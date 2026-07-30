"""Run privacy-safe CEP152/DMD context calculations from private flat files."""

import argparse
from collections import Counter
import csv
from functools import lru_cache
import gzip
import hashlib
import json
from pathlib import Path

import numpy as np
from scipy import sparse

from scripts.context_api_fast import (
    gene_burden_scores,
    gene_burden_test,
    variant_match_scores,
    variant_pathogenic_scores,
)
from scripts.rphers_fast import score_samples


PC_NAMES = [f"PC{index}" for index in range(1, 11)]
COVARIATE_NAMES = ["age", "age_missing", "sex_male", "sex_unknown", *PC_NAMES]
MISSING_VALUES = {"", ".", "na", "n/a", "nan", "null", "none", "unknown"}


def _open_text(path, mode="rt"):
    path = Path(path)
    return gzip.open(path, mode, newline="") if path.suffix == ".gz" else path.open(mode, newline="")


def _finite_float(value):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if np.isfinite(number) else None


def load_hpo_matrix(path, query_hpo):
    """Load a binary sample-by-HPO TSV into CSR form without a dense copy."""
    sample_ids = []
    row_indices = []
    column_indices = []
    with _open_text(path) as handle:
        header = handle.readline().rstrip("\r\n").split("\t")
        if len(header) < 2:
            raise ValueError("HPO matrix requires sample_id and at least one HPO column")
        hpo_columns = header[1:]
        missing = [term for term in query_hpo if term not in set(hpo_columns)]
        if missing:
            raise ValueError("missing query HPO columns: " + ", ".join(missing))
        for row_index, line in enumerate(handle):
            sample_id, separator, raw_values = line.rstrip("\r\n").partition("\t")
            if not separator or not sample_id:
                raise ValueError(f"invalid HPO matrix row {row_index + 2}")
            values = np.fromstring(raw_values, dtype=np.float64, sep="\t")
            if values.size != len(hpo_columns):
                raise ValueError(f"HPO matrix row {row_index + 2} has the wrong column count")
            if not np.all(np.isin(values, (0.0, 1.0))):
                raise ValueError(f"HPO matrix row {row_index + 2} is not binary")
            present = np.flatnonzero(values)
            row_indices.extend([row_index] * present.size)
            column_indices.extend(present.tolist())
            sample_ids.append(sample_id)
    if len(set(sample_ids)) != len(sample_ids):
        raise ValueError("HPO matrix sample IDs must be unique")
    matrix = sparse.csr_matrix(
        (np.ones(len(row_indices), dtype=np.uint8), (row_indices, column_indices)),
        shape=(len(sample_ids), len(hpo_columns)),
    )
    return {
        "sample_ids": np.asarray(sample_ids, dtype=str),
        "hpo_columns": hpo_columns,
        "matrix": matrix,
    }


def load_overlap_roster(path):
    """Return the validated both-roster plus aggregate overlap-status counts."""
    sample_ids = []
    counts = Counter()
    with _open_text(path) as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        if not reader.fieldnames or "sample_id" not in reader.fieldnames or "overlap_status" not in reader.fieldnames:
            raise ValueError("overlap roster requires sample_id and overlap_status")
        for row in reader:
            sample_id = str(row.get("sample_id") or "").strip()
            status = str(row.get("overlap_status") or "").strip()
            if not sample_id or not status:
                raise ValueError("overlap roster contains an empty sample_id or overlap_status")
            counts[status] += 1
            if status == "both":
                sample_ids.append(sample_id)
    if len(set(sample_ids)) != len(sample_ids):
        raise ValueError("overlap roster contains duplicate both sample IDs")
    return {"sample_ids": sample_ids, "status_counts": dict(counts)}


def _canonical_sex(value):
    normalized = str(value or "").strip().lower()
    if normalized in {"female", "f"}:
        return "Female"
    if normalized in {"male", "m"}:
        return "Male"
    return "Unknown"


def _required_float(value, label):
    number = _finite_float(value)
    if number is None:
        raise ValueError(f"{label} must be finite")
    return number


def load_covariates(path, analysis_sample_ids):
    """Load and align age, three-level sex, and PC1-PC10 to the analysis roster."""
    analysis_sample_ids = [str(value) for value in analysis_sample_ids]
    rows = {}
    with _open_text(path) as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        required = {"sample_id", "age", "sex", *PC_NAMES}
        if not required.issubset(set(reader.fieldnames or [])):
            missing = sorted(required - set(reader.fieldnames or []))
            raise ValueError("covariate file is missing columns: " + ", ".join(missing))
        for row in reader:
            sample_id = str(row.get("sample_id") or "").strip()
            if not sample_id:
                raise ValueError("covariate file contains an empty sample_id")
            if sample_id in rows:
                raise ValueError(f"duplicate covariate sample_id: {sample_id}")
            rows[sample_id] = row

    missing_ids = [sample_id for sample_id in analysis_sample_ids if sample_id not in rows]
    if missing_ids:
        raise ValueError(f"covariate file is missing {len(missing_ids)} analysis samples")

    observed_ages = []
    parsed = {}
    for sample_id in analysis_sample_ids:
        row = rows[sample_id]
        raw_age = str(row.get("age") or "").strip()
        age = _finite_float(raw_age)
        age_missing = age is None or not 0 <= age <= 99
        if age_missing:
            age = None
        if age is not None:
            observed_ages.append(age)
        parsed[sample_id] = {
            "age": age,
            "age_missing": age_missing,
            "sex": _canonical_sex(row.get("sex")),
            "pcs": [_required_float(row.get(name), f"{name} for {sample_id}") for name in PC_NAMES],
        }
    if not observed_ages:
        raise ValueError("covariate file has no observed age values in the analysis roster")

    age_median = float(np.median(observed_ages))
    values = []
    sex_counts = Counter()
    for sample_id in analysis_sample_ids:
        row = parsed[sample_id]
        sex_counts[row["sex"]] += 1
        values.append([
            age_median if row["age"] is None else row["age"],
            float(row["age_missing"]),
            float(row["sex"] == "Male"),
            float(row["sex"] == "Unknown"),
            *row["pcs"],
        ])
    return {
        "values": np.asarray(values, dtype=np.float64),
        "names": list(COVARIATE_NAMES),
        "age_median": age_median,
        "age_missing_count": int(sum(row["age_missing"] for row in parsed.values())),
        "sex_reference": "Female",
        "sex_counts": {label: int(sex_counts.get(label, 0)) for label in ("Female", "Male", "Unknown")},
    }


def reconstruct_pathogenic_score(row):
    """Reconstruct the Extended Pathogenic Score used for display."""
    score, source = variant_pathogenic_scores(row)["extended"]
    stored = _finite_float(row.get("pathogenicity_score"))
    expected = 0.0 if score is None else score
    if stored is not None and not np.isclose(stored, expected):
        variant_id = row.get("Variant_ID") or row.get("variant_id") or "unknown variant"
        raise ValueError(f"stored pathogenicity_score does not match reconstructed provenance for {variant_id}")
    return score, source


def reconstruct_burden_pathogenic_score(row):
    """Reconstruct the LoFTEE HC/AlphaMissense-only score used in X."""
    return variant_pathogenic_scores(row)["burden"]


def load_gene_evidence(path, genes, analysis_sample_ids):
    """Stream the evidence TSV and retain requested-gene carriers in the analysis roster."""
    genes = [str(gene).strip().upper() for gene in genes]
    requested = set(genes)
    analysis_sample_ids = set(str(value) for value in analysis_sample_ids)
    rows_by_gene = {gene: [] for gene in genes}
    outside = Counter({gene: 0 for gene in genes})
    with _open_text(path) as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        required = {"sample_id", "gene_symbol", "GT", "pathogenicity_score"}
        fields = set(reader.fieldnames or [])
        if not required.issubset(fields) or not ({"Variant_ID", "variant_id"} & fields):
            raise ValueError("evidence file is missing required gene-samples fields")
        for raw in reader:
            gene = str(raw.get("gene_symbol") or "").strip().upper()
            if gene not in requested:
                continue
            sample_id = str(raw.get("sample_id") or "").strip()
            if sample_id not in analysis_sample_ids:
                outside[gene] += 1
                continue
            variant_id = str(raw.get("Variant_ID") or raw.get("variant_id") or "").strip()
            if not variant_id:
                raise ValueError("evidence row has no variant ID")
            extended_score, extended_source = reconstruct_pathogenic_score(raw)
            burden_score, burden_source = reconstruct_burden_pathogenic_score(raw)
            rows_by_gene[gene].append({
                "sample_id": sample_id,
                "gene_symbol": gene,
                "variant_id": variant_id,
                "GT": raw.get("GT"),
                "alt_dosage": raw.get("alt_dosage"),
                "pathogenicity_score": extended_score,
                "score_source": extended_source,
                "burden_pathogenicity_score": burden_score,
                "burden_score_source": burden_source,
            })
    return {
        "rows_by_gene": rows_by_gene,
        "carrier_rows_outside_analysis": {gene: int(outside[gene]) for gene in genes},
    }


def _write_private_audits(audit_dir, gene, sample_ids, y, x, rows):
    audit_dir = Path(audit_dir)
    audit_dir.mkdir(parents=True, exist_ok=True)
    carrier_ids = {row["sample_id"] for row in rows}
    with gzip.open(audit_dir / f"{gene}_sample_audit.tsv.gz", "wt", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["sample_id", "phenotype_match_score_resid", "gene_burden_loftee_am", "is_gene_carrier"],
            delimiter="\t",
            lineterminator="\n",
        )
        writer.writeheader()
        for sample_id, residual, burden in zip(sample_ids, y, x):
            writer.writerow({
                "sample_id": sample_id,
                "phenotype_match_score_resid": format(float(residual), ".17g"),
                "gene_burden_loftee_am": format(float(burden), ".17g"),
                "is_gene_carrier": int(sample_id in carrier_ids),
            })
    residual_by_sample = dict(zip(sample_ids, y))
    seen = set()
    with gzip.open(audit_dir / f"{gene}_variant_carrier_audit.tsv.gz", "wt", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "sample_id",
                "variant_id",
                "GT",
                "alt_dosage",
                "extended_pathogenic_score",
                "extended_score_source",
                "burden_pathogenic_score",
                "burden_score_source",
                "phenotype_match_score_resid",
            ],
            delimiter="\t",
            lineterminator="\n",
        )
        writer.writeheader()
        for row in rows:
            key = (row["sample_id"], row["variant_id"])
            if key in seen:
                continue
            seen.add(key)
            writer.writerow({
                "sample_id": row["sample_id"],
                "variant_id": row["variant_id"],
                "GT": row["GT"],
                "alt_dosage": row["alt_dosage"],
                "extended_pathogenic_score": "" if row["pathogenicity_score"] is None else row["pathogenicity_score"],
                "extended_score_source": row["score_source"],
                "burden_pathogenic_score": "" if row["burden_pathogenicity_score"] is None else row["burden_pathogenicity_score"],
                "burden_score_source": row["burden_score_source"],
                "phenotype_match_score_resid": format(float(residual_by_sample[row["sample_id"]]), ".17g"),
            })


def _gene_result(
    gene,
    sample_ids,
    y,
    rows,
    min_carriers,
    phenotype_checksum,
    outside_rows,
    audit_dir,
    covariates=None,
    covariate_names=None,
    carriers_by_variant=None,
    burden_input=None,
):
    if carriers_by_variant is None:
        carriers_by_variant = {}
        for row in rows:
            carriers_by_variant.setdefault(row["variant_id"], []).append(row["sample_id"])
    if burden_input is None:
        burden_input = gene_burden_scores(sample_ids, rows)
    x = burden_input["values"]
    burden = gene_burden_test(
        y,
        x,
        covariates=covariates,
        covariate_names=covariate_names,
        min_positive=min_carriers,
    )
    n_total = len(carriers_by_variant)
    n_scored = int(burden_input["n_variants_scored"])
    n_unscored = int(burden_input["n_variants_unscored"])
    burden.update({
        "n_variants_total": n_total,
        "n_variants_scored": n_scored,
        "n_variants_unscored": n_unscored,
        "n_variants_revel_only": int(burden_input["n_variants_revel_only"]),
        "score_coverage": float(n_scored / n_total) if n_total else None,
        "interpretation_scope": (
            "no_gene_variants" if not n_total
            else "exploratory_scored_variants_only" if n_unscored
            else "all_variants_scored"
        ),
    })
    if audit_dir is not None:
        _write_private_audits(audit_dir, gene, sample_ids, y, x, rows)
    return {
        "gene": gene,
        "analysis_sample_count": len(sample_ids),
        "phenotype_vector_sha256": phenotype_checksum,
        "carrier_sample_count": len({row["sample_id"] for row in rows}),
        "carrier_rows_outside_analysis": int(outside_rows),
        "variant_match_scores": variant_match_scores(sample_ids, y, carriers_by_variant),
        "gene_burden": burden,
    }


class ContextAnalysisEngine:
    """Preload cohort inputs and cache HPO vectors and per-gene burden inputs."""

    def __init__(self, hpo_path, roster_path, evidence_path, covariate_path=None):
        self.hpo = load_hpo_matrix(hpo_path, [])
        self.roster = load_overlap_roster(roster_path)
        self.evidence_path = Path(evidence_path)
        both = set(self.roster["sample_ids"])
        hpo_ids = self.hpo["sample_ids"].tolist()
        missing_from_hpo = both - set(hpo_ids)
        if missing_from_hpo:
            raise ValueError(f"{len(missing_from_hpo)} overlap-roster samples are missing from the HPO matrix")
        self.analysis_sample_ids = [sample_id for sample_id in hpo_ids if sample_id in both]
        self.analysis_sample_set = set(self.analysis_sample_ids)
        hpo_index = {sample_id: position for position, sample_id in enumerate(hpo_ids)}
        self.analysis_hpo_indices = np.asarray(
            [hpo_index[sample_id] for sample_id in self.analysis_sample_ids],
            dtype=int,
        )
        self.covariates = (
            load_covariates(covariate_path, self.analysis_sample_ids)
            if covariate_path
            else None
        )

    @lru_cache(maxsize=32)
    def _phenotype(self, normalized_query_hpo):
        missing = [term for term in normalized_query_hpo if term not in set(self.hpo["hpo_columns"])]
        if missing:
            raise ValueError("missing query HPO columns: " + ", ".join(missing))
        phenotype = score_samples(
            self.hpo["matrix"],
            self.hpo["hpo_columns"],
            normalized_query_hpo,
            sample_ids=self.hpo["sample_ids"],
        )
        y = np.asarray(
            phenotype["phenotype_match_score_resid"][self.analysis_hpo_indices],
            dtype=np.float64,
        )
        checksum = hashlib.sha256(y.astype("<f8", copy=False).tobytes()).hexdigest()
        return y, checksum

    @lru_cache(maxsize=64)
    def _gene_data(self, gene):
        evidence = load_gene_evidence(
            self.evidence_path,
            [gene],
            self.analysis_sample_set,
        )
        rows = evidence["rows_by_gene"][gene]
        carriers_by_variant = {}
        for row in rows:
            carriers_by_variant.setdefault(row["variant_id"], []).append(row["sample_id"])
        return {
            "rows": rows,
            "outside_rows": evidence["carrier_rows_outside_analysis"][gene],
            "carriers_by_variant": carriers_by_variant,
            "burden_input": gene_burden_scores(self.analysis_sample_ids, rows),
        }

    def analyze(self, gene, query_hpo, min_carriers=10, audit_dir=None):
        gene = str(gene or "").strip().upper()
        if not gene:
            raise ValueError("gene is required")
        normalized_query_hpo = tuple(sorted(set(str(term).strip().upper() for term in query_hpo if str(term).strip())))
        if not normalized_query_hpo:
            raise ValueError("at least one HPO term is required")
        y, phenotype_checksum = self._phenotype(normalized_query_hpo)
        gene_data = self._gene_data(gene)
        result = _gene_result(
            gene,
            self.analysis_sample_ids,
            y,
            gene_data["rows"],
            min_carriers,
            phenotype_checksum,
            gene_data["outside_rows"],
            audit_dir,
            covariates=None if self.covariates is None else self.covariates["values"],
            covariate_names=None if self.covariates is None else self.covariates["names"],
            carriers_by_variant=gene_data["carriers_by_variant"],
            burden_input=gene_data["burden_input"],
        )
        result["query_hpo"] = list(normalized_query_hpo)
        result["covariate_encoding"] = None if self.covariates is None else {
            "names": self.covariates["names"],
            "age_median": self.covariates["age_median"],
            "age_missing_count": self.covariates["age_missing_count"],
            "sex_reference": self.covariates["sex_reference"],
            "sex_counts": self.covariates["sex_counts"],
        }
        return result


def run_validation(
    hpo_path,
    roster_path,
    evidence_path,
    query_hpo,
    genes,
    min_carriers=10,
    audit_dir=None,
    covariate_path=None,
):
    """Calculate Y once and return aggregate endpoint-shaped results for each gene."""
    genes = list(dict.fromkeys(str(gene).strip().upper() for gene in genes))
    engine = ContextAnalysisEngine(
        hpo_path,
        roster_path,
        evidence_path,
        covariate_path=covariate_path,
    )
    gene_results = {
        gene: engine.analyze(gene, query_hpo, min_carriers=min_carriers, audit_dir=audit_dir)
        for gene in genes
    }
    phenotype_checksum = next(
        (result["phenotype_vector_sha256"] for result in gene_results.values()),
        None,
    )
    results = {
        "query_hpo": sorted(set(query_hpo)),
        "analysis_sample_count": len(engine.analysis_sample_ids),
        "phenotype_source_sample_count": len(engine.hpo["sample_ids"]),
        "phenotype_vector_sha256": phenotype_checksum,
        "roster_status_counts": engine.roster["status_counts"],
        "covariate_encoding": next(
            (result["covariate_encoding"] for result in gene_results.values()),
            None,
        ),
        "genes": gene_results,
    }
    return results


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hpo-matrix", required=True)
    parser.add_argument("--overlap-roster", required=True)
    parser.add_argument("--evidence", required=True)
    parser.add_argument("--covariates")
    parser.add_argument("--hpo", action="append", required=True)
    parser.add_argument("--gene", action="append", required=True)
    parser.add_argument("--min-carriers", type=int, default=10)
    parser.add_argument("--audit-dir")
    parser.add_argument("--output", required=True)
    args = parser.parse_args(argv)
    result = run_validation(
        args.hpo_matrix,
        args.overlap_roster,
        args.evidence,
        args.hpo,
        args.gene,
        min_carriers=args.min_carriers,
        audit_dir=args.audit_dir,
        covariate_path=args.covariates,
    )
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
