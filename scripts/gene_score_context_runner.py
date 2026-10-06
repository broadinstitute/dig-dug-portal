"""Run the existing gene-score LM/LMM script for one private HPO context."""

from __future__ import annotations

import csv
import hashlib
from pathlib import Path
import subprocess
import tempfile
from threading import Lock


class GeneScoreContextRunner:
    def __init__(
        self,
        score_path,
        covariate_path,
        *,
        model="lm",
        score_type="max",
        affected_only=False,
        platform_path=None,
        score_id_map=None,
        grm_prefix=None,
        rscript="Rscript",
        timeout_seconds=600,
    ):
        if model not in {"lm", "lmm"} or score_type not in {"max", "sum"}:
            raise ValueError("unsupported gene-score model or score type")
        if model == "lmm" and not grm_prefix:
            raise ValueError("gene-score LMM requires a GRM prefix")
        self.score_path = str(score_path)
        self.covariate_path = str(covariate_path)
        self.model = model
        self.score_type = score_type
        self.affected_only = affected_only
        self.platform_path = platform_path
        self.score_id_map = score_id_map
        self.grm_prefix = grm_prefix
        self.rscript = rscript
        self.timeout_seconds = timeout_seconds
        self._score_slice_dir = tempfile.TemporaryDirectory(prefix="pb_gene_grs_scores_")
        self._score_slices = {}
        self._score_slice_lock = Lock()

    def _score_file_for_gene(self, gene):
        """Scan the large score table once per gene, then reuse its small slice."""
        key = gene.upper()
        with self._score_slice_lock:
            if key in self._score_slices:
                return self._score_slices[key]
            name = hashlib.sha256(key.encode()).hexdigest()[:16] + ".tsv"
            output = Path(self._score_slice_dir.name) / name
            marker = b"\t" + key.encode() + b"\t"
            with Path(self.score_path).open("rb", buffering=1024 * 1024) as source, output.open("wb") as target:
                target.write(source.readline())
                for line in source:
                    if marker in line:
                        target.write(line)
            self._score_slices[key] = str(output)
            return str(output)

    def _run(self, sample_ids, residual_phers, gene=None, score_type=None, affected_only=None):
        if len(sample_ids) != len(residual_phers):
            raise ValueError("phenotype sample and residual lengths differ")
        score_type = self.score_type if score_type is None else score_type
        affected_only = self.affected_only if affected_only is None else affected_only
        if score_type not in {"max", "sum"} or not isinstance(affected_only, bool):
            raise ValueError("unsupported gene-score settings")
        script = Path(__file__).with_name(f"run_gene_score_{self.model}.R")
        with tempfile.TemporaryDirectory(prefix="pb_gene_grs_") as directory:
            phenotype_path = Path(directory) / "phenotype.tsv"
            output_path = Path(directory) / "association.tsv"
            with phenotype_path.open("w", newline="") as handle:
                writer = csv.writer(handle, delimiter="\t")
                writer.writerow(("sample_id", "residual_phers"))
                writer.writerows(
                    (sample_id, format(float(value), ".17g"))
                    for sample_id, value in zip(sample_ids, residual_phers)
                )
            command = [
                self.rscript, str(script),
                "--phenotype", str(phenotype_path),
                "--covariates", self.covariate_path,
                "--gene-scores", self._score_file_for_gene(gene) if gene else self.score_path,
                "--score-type", score_type,
                "--affected-only", "yes" if affected_only else "no",
                "--output", str(output_path),
            ]
            if gene:
                command.extend(("--genes", gene))
            if self.platform_path:
                command.extend(("--platform-file", str(self.platform_path)))
            if self.score_id_map:
                command.extend(("--score-id-map", str(self.score_id_map)))
            if self.grm_prefix:
                command.extend(("--grm-prefix", str(self.grm_prefix)))
            subprocess.run(command, check=True, capture_output=True, text=True, timeout=self.timeout_seconds)
            with output_path.open(newline="") as handle:
                rows = list(csv.DictReader(handle, delimiter="\t"))
        output = {}
        for row in rows:
            symbol = row["gene_symbol"].upper()
            if symbol in output:
                raise ValueError("gene-score script returned a duplicate gene result")
            output[symbol] = {
                "gene": symbol,
                "model": row["model"],
                "score_type": row["score_type"],
                "affected_only": row["affected_only"] == "yes",
                "beta": float(row["beta"]) if row["beta"] else None,
                "standard_error": float(row["standard_error"]) if row["standard_error"] else None,
                "p_value": float(row["p_value"]) if row["p_value"] else None,
                "n_samples": int(row["n_samples"]),
                "n_positive": int(row["n_positive"]),
                "status": row["status"],
            }
        return output

    def run(self, gene, sample_ids, residual_phers, *, score_type=None, affected_only=None):
        results = self._run(sample_ids, residual_phers, gene=gene,
                            score_type=score_type, affected_only=affected_only)
        if len(results) != 1 or gene.upper() not in results:
            raise ValueError("gene-score script returned an unexpected gene result")
        return results[gene.upper()]

    def run_all(self, sample_ids, residual_phers, *, score_type=None, affected_only=None):
        """Fit one null model and test every gene in the approved score source."""
        return self._run(sample_ids, residual_phers, score_type=score_type, affected_only=affected_only)
