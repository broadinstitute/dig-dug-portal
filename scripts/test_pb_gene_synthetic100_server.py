"""100-ID synthetic integration check for both PB Gene association scripts.

Only sample identifiers, age/sex/PCs, affected status and GRM come from the
existing ADCY10 cohort. HPO calls, variant carriers, WES/WGS and gene scores
are generated with a fixed seed in the requested private sandbox.
"""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import asdict
from pathlib import Path

import numpy as np
from scipy.stats import t

from scripts.pb_gene_context_validation import ContextAnalysisEngine
from scripts.variant_association_lmm_reference import DenseLMMReference


TERMS = ("HP:0011734", "HP:0006827")
VARIANTS = ("synthetic:ATL1:V1", "synthetic:ATL1:V2")
GENES = ("ATL1", "ADCY10", "SLC34A1")


def read_tsv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def write_tsv(path: Path, columns: list[str], rows) -> None:
    with path.open("x", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, delimiter="\t", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def prepare(root: Path, cohort_cov: Path) -> None:
    rows = read_tsv(cohort_cov)
    affected_known = [row for row in rows if row["affected"].strip().upper() == "Y" and row["sex"].strip().lower() in {"female", "male"}][:57]
    affected_unknown = [row for row in rows if row["affected"].strip().upper() == "Y" and row["sex"].strip().lower() == "unknown"][:3]
    unaffected_known = [row for row in rows if row["affected"].strip().upper() == "N" and row["sex"].strip().lower() in {"female", "male"}][:37]
    unaffected_unknown = [row for row in rows if row["affected"].strip().upper() == "N" and row["sex"].strip().lower() == "unknown"][:3]
    affected = affected_known + affected_unknown
    unaffected = unaffected_known + unaffected_unknown
    selected_ids = {row["sample_id"] for row in affected + unaffected}
    selected = [row for row in rows if row["sample_id"] in selected_ids]
    if len(selected) != 100 or len({row["sample_id"] for row in selected}) != 100:
        raise ValueError("Could not select 60 affected + 40 unaffected unique ADCY10 cohort samples")
    rng = np.random.default_rng(20261002)
    root.joinpath("input").mkdir(parents=True, exist_ok=False)
    root.joinpath("results").mkdir(parents=True, exist_ok=False)
    columns = list(selected[0]) + ["WES_WGS"]
    covariates = [dict(row, WES_WGS="WGS" if i % 3 else "WES") for i, row in enumerate(selected)]
    write_tsv(root / "input/covariates.tsv", columns, covariates)
    write_tsv(root / "input/roster.tsv", ["sample_id", "overlap_status"],
              ({"sample_id": row["sample_id"], "overlap_status": "both"} for row in selected))

    carrier_one = set(rng.choice(100, size=25, replace=False).tolist())
    carrier_two = set(rng.choice(100, size=18, replace=False).tolist())
    hpo = []
    evidence = []
    gene_scores = []
    for i, row in enumerate(selected):
        sample_id = row["sample_id"]
        hpo.append({"sample_id": sample_id,
                    TERMS[0]: int(rng.random() < (0.65 if i in carrier_one else 0.18)),
                    TERMS[1]: int(rng.random() < (0.55 if i in carrier_two else 0.23)),
                    "HP:0000001": int(rng.random() < 0.3),
                    "HP:0000002": int(rng.random() < 0.2)})
        for variant_id, carriers in zip(VARIANTS, (carrier_one, carrier_two)):
            if i in carriers:
                evidence.append({"sample_id": sample_id, "gene_symbol": "ATL1",
                                 "Variant_ID": variant_id, "GT": "0/1",
                                 "pathogenicity_score": 0.7, "Alphamissense": 0.7})
        for gene in GENES:
            if gene == "ATL1":
                maximum = (0.35 + 0.65 * rng.random()) if i in carrier_one else (0.25 * rng.random() if i % 4 == 0 else 0.0)
            else:
                maximum = float(rng.random()) if rng.random() < 0.28 else 0.0
            total = maximum + (0.3 * rng.random() if maximum > 0 and i % 5 == 0 else 0.0)
            gene_scores.append({"sample_id": sample_id, "gene_symbol": gene,
                                "gene_score_max": f"{maximum:.12g}", "gene_score_sum": f"{total:.12g}",
                                "n_variants": 1, "n_nonzero_var": int(maximum > 0)})
    write_tsv(root / "input/hpo.tsv", ["sample_id", *TERMS, "HP:0000001", "HP:0000002"], hpo)
    write_tsv(root / "input/variant_evidence.tsv",
              ["sample_id", "gene_symbol", "Variant_ID", "GT", "pathogenicity_score", "Alphamissense"], evidence)
    write_tsv(root / "input/gene_scores.tsv",
              ["sample_id", "gene_symbol", "gene_score_max", "gene_score_sum", "n_variants", "n_nonzero_var"], gene_scores)
    print("SYNTHETIC_100_PREPARED selected=100 affected=60 unaffected=40 sex_unknown=6 hpo=fake variants=fake gene_scores=fake")


def read_grm_subset(prefix: Path, wanted: list[str]) -> np.ndarray:
    with prefix.with_suffix(".grm.id").open() as handle:
        grm_ids = [line.rstrip("\n").split()[1] for line in handle]
    index = {sample_id: i for i, sample_id in enumerate(grm_ids)}
    if len(index) != len(grm_ids) or any(sample_id not in index for sample_id in wanted):
        raise ValueError("GRM IDs are duplicate or model IID is absent")
    positions = np.array([index[sample_id] for sample_id in wanted], dtype=int)
    matrix = np.zeros((len(wanted), len(wanted)), dtype=float)
    with prefix.with_suffix(".grm.bin").open("rb") as handle:
        for j in np.argsort(positions):
            i = int(positions[j]) + 1
            handle.seek(i * (i - 1) // 2 * 4)
            values = np.fromfile(handle, dtype="<f4", count=i)
            if len(values) != i:
                raise ValueError("Truncated GRM")
            take = np.flatnonzero(positions < i)
            matrix[j, take] = values[positions[take]]
            matrix[take, j] = values[positions[take]]
    return matrix


def check_variant(root: Path, grm_prefix: Path) -> None:
    inp = root / "input"
    result = json.loads((root / "results/variant_ols.json").read_text())
    engine = ContextAnalysisEngine(inp / "hpo.tsv", inp / "roster.tsv",
                                   inp / "variant_evidence.tsv", inp / "covariates.tsv")
    ids = engine.analysis_sample_ids
    if len(ids) != 100:
        raise AssertionError("Variant analysis did not use all 100 samples")
    if engine.covariates["sex_counts"]["Unknown"] != 6 or "sex_unknown" in result["dropped_aliased_covariates"]:
        raise AssertionError("Three-level sex factor was not retained in the variant design")
    y, _ = engine._phenotype(tuple(sorted(TERMS)))
    c = engine.covariates["values"]
    carriers = {variant_id: set() for variant_id in VARIANTS}
    for row in read_tsv(inp / "variant_evidence.tsv"):
        carriers[row["Variant_ID"]].add(row["sample_id"])
    for variant_id in VARIANTS:
        x = np.array([float(sample_id in carriers[variant_id]) for sample_id in ids])
        design = np.column_stack((np.ones(100), x, c))
        coef = np.linalg.lstsq(design, y, rcond=None)[0]
        residual = y - design @ coef
        df = 100 - np.linalg.matrix_rank(design)
        se = np.sqrt((residual @ residual / df) * np.linalg.pinv(design.T @ design)[1, 1])
        p_value = 2 * t.sf(abs(coef[1] / se), df)
        got = result["variant_associations"][variant_id]
        if got["status"] != "ok" or got["n_samples"] != 100 or got["n_carriers"] != int(x.sum()):
            raise AssertionError(f"Variant OLS status/count mismatch: {variant_id}")
        np.testing.assert_allclose([got["beta"], got["standard_error"], got["p_value"]],
                                   [coef[1], se, p_value], rtol=1e-8, atol=1e-10)
    print("VARIANT_OLS_100_PASS variants=2 independent=numpy_lstsq+t")

    grm_ids = [row["vcf_sample_id"] for row in read_tsv(inp / "covariates.tsv")]
    k = read_grm_subset(grm_prefix, grm_ids)
    k += 1e-4 * np.mean(np.diag(k)) * np.eye(len(k))
    lmm_engine = DenseLMMReference(ids, c, k, ids)
    outcome = lmm_engine.outcome(y)
    v = k + outcome.delta * np.eye(100)
    vi = np.linalg.inv(v)
    fixed = lmm_engine.c
    vic = vi @ fixed
    projection = vi - vic @ np.linalg.inv(fixed.T @ vic) @ vic.T
    yy = y @ projection @ y
    command_result = json.loads((root / "results/variant_lmm.json").read_text())
    if command_result["analysis_sample_count"] != 100 or len(command_result["variant_associations"]) != len(VARIANTS):
        raise AssertionError("Variant LMM command did not return both variants")
    lmm_results = {}
    for variant_id in VARIANTS:
        got = outcome.variant(carriers[variant_id])
        x = np.array([float(sample_id in carriers[variant_id]) for sample_id in ids])
        xx = x @ projection @ x
        beta = x @ projection @ y / xx
        rss = max(0.0, yy - beta * beta * xx)
        se = np.sqrt(rss / lmm_engine.df / xx)
        p_value = 2 * t.sf(abs(beta / se), lmm_engine.df)
        if got.status != "ok":
            raise AssertionError(f"Variant LMM status {got.status}: {variant_id}")
        np.testing.assert_allclose([got.beta, got.standard_error, got.p_value],
                                   [beta, se, p_value], rtol=1e-6, atol=1e-8)
        from_command = command_result["variant_associations"][variant_id]
        np.testing.assert_allclose([from_command["beta"], from_command["standard_error"], from_command["p_value"]],
                                   [beta, se, p_value], rtol=1e-6, atol=1e-8)
        lmm_results[variant_id] = asdict(got)
    output = {
        "gene": "ATL1",
        "query_hpo": result["query_hpo"],
        "analysis_sample_count": len(ids),
        "model": "Gaussian LMM residual PheRS ~ binary variant + age + age_missing + sex (female reference; male/unknown levels) + PC1-PC10 + GRM",
        "grm_prefix": str(grm_prefix),
        "grm_ridge": "1e-4 * mean(diagonal)",
        "covariate_design_columns": result["covariate_design_columns"],
        "dropped_aliased_covariates": [result["covariate_design_columns"][int(name[1:])] for name in lmm_engine.dropped_covariates],
        "variant_associations": lmm_results,
    }
    (root / "results/variant_lmm_reference.json").write_text(json.dumps(output, indent=2, allow_nan=False) + "\n")
    print(f"VARIANT_LMM_REFERENCE_100_PASS variants={len(lmm_results)} independent=direct_GLS")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("phase", choices=("prepare", "check-variant"))
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--cohort-cov", type=Path)
    parser.add_argument("--grm-prefix", type=Path)
    args = parser.parse_args()
    if args.phase == "prepare":
        if args.cohort_cov is None:
            parser.error("--cohort-cov required for prepare")
        prepare(args.root, args.cohort_cov)
    else:
        if args.grm_prefix is None:
            parser.error("--grm-prefix required for check-variant")
        check_variant(args.root, args.grm_prefix)


if __name__ == "__main__":
    main()
