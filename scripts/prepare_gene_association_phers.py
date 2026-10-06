"""Export browser-context residual PheRS for one HPO query on the overlap roster.

This is a private server-side intermediate. It uses the same HPO matrix loader,
overlap-roster rule, and ``score_samples`` function as the Gene Context API.
The TSV stays on the server. The private Variant Context route can return only
the requested variant's carrier residuals to the authenticated PB Variant view.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

from scripts.pb_gene_context_validation import load_hpo_matrix, load_overlap_roster
from scripts.rphers_fast import score_samples


def calculate_residual_phers(hpo_matrix_path: str, overlap_roster_path: str, query_hpo: list[str]):
    """Return aligned (sample IDs, residual scores, raw scores) for the Context roster."""
    terms = list(dict.fromkeys(term.strip().upper() for term in query_hpo if term.strip()))
    if not terms:
        raise ValueError("At least one HPO term is required")
    hpo = load_hpo_matrix(hpo_matrix_path, terms)
    roster = set(load_overlap_roster(overlap_roster_path)["sample_ids"])
    indices = [i for i, sample_id in enumerate(hpo["sample_ids"]) if sample_id in roster]
    if not indices:
        raise ValueError("HPO matrix and overlap roster have no common samples")
    sample_ids = hpo["sample_ids"][indices]
    scored = score_samples(hpo["matrix"], hpo["hpo_columns"], terms, sample_ids=hpo["sample_ids"])
    return (
        sample_ids,
        scored["phenotype_match_score_resid"][indices],
        scored["phenotype_match_score"][indices],
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hpo-matrix", required=True)
    parser.add_argument("--overlap-roster", required=True)
    parser.add_argument("--hpo", action="append", required=True, help="Repeat for each HP: term")
    parser.add_argument("--output", required=True, help="Private sample-level TSV destination")
    args = parser.parse_args()
    sample_ids, residuals, raw_scores = calculate_residual_phers(args.hpo_matrix, args.overlap_roster, args.hpo)
    destination = Path(args.output)
    if destination.exists():
        parser.error("Refusing to overwrite existing output")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("x", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t")
        writer.writerow(("sample_id", "residual_phers", "raw_phers"))
        writer.writerows(
            (sample_id, format(float(residual), ".17g"), format(float(raw), ".17g"))
            for sample_id, residual, raw in zip(sample_ids, residuals, raw_scores)
        )
    print(f"Wrote {len(sample_ids)} private phenotype rows to {destination}")


if __name__ == "__main__":
    main()
