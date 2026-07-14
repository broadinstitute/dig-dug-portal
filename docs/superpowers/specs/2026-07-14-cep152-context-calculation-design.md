# CEP152 and DMD Context Calculation Design

## Goal

Calculate and inspect real CEP152 and DMD phenotype-context results from the
user's private CRDC files before connecting the aggregate results needed by the
`pb_Gene` UI. Both genes use the same HPO query, analysis roster, and phenotype
residuals so the comparison isolates gene-specific genotype evidence.

The fixed HPO query is:

```text
HP:0001336
HP:0002353
HP:0001270
HP:0012373
```

`HP:0003593` is not part of this analysis.

## Private inputs

- Approved parent-expanded CRDC sample-by-HPO binary matrix.
- Approved CEP152 and DMD sample-gene-variant evidence with existing Pathogenic
  Score provenance.
- Validated genotype/phenotype sample-overlap roster.
- Genotype and phenotype records are joined by normalized `sample_id`.

Patient-level rows, original sample IDs, and source data remain outside Git.
Temporary extracts go under a private temporary or server working directory.

## Calculation flow

1. Read the full 16,367-sample HPO matrix and calculate one
   `phenotype_match_score_resid` value per sample with `rphers_fast.score_samples()`.
2. Read only CEP152 and DMD rows from the validated 2025 genotype evidence
   file.
3. Normalize those rows to the existing `gene-samples` field names without
   loading them into BioIndex:
   `sample_id`, `gene_symbol`, `variant_id`, `GT`, `pathogenicity_score`, and
   `score_source`.
4. Use only roster rows with `overlap_status=both` as the regression population.
   Genotype-only and phenotype-only IDs are counted for QC and excluded from
   the regression.
5. For every CEP152 and DMD variant, calculate the mean residual across all unique
   scored carriers. This variant Match Score does not require a Pathogenic
   Score.
6. Build each sample's gene burden from carrier presence, not dosage:

   ```text
   X_i = sum(Pathogenic Score_v for distinct scored variants carried by sample i)
   ```

   `0/1` and `1/1` each contribute the variant score once. A DMD carrier also
   contributes once regardless of X-chromosome allele dosage or ploidy.
   Duplicate sample-variant rows contribute once.
7. Fit the provisional `portal_huber_rlm_v0` model `Y ~ X` only when at least
   five samples have `X > 0`.

## Undefined Pathogenic Scores

A missing Pathogenic Score means undefined, not zero.

- All CEP152 and DMD variants remain eligible for the variant Match Score.
- The evidence generator stores undefined scores as numeric zero. Reconstruct
  whether the existing score is defined from its provenance fields: `LoF=HC`
  or a finite `Alphamissense` value means defined; neither means `No_score`.
- Validate the reconstructed value against the stored `pathogenicity_score`.
  This recovers the existing score provenance and does not introduce a new
  scoring rule or use REVEL as a fallback.
- Only variants with a defined Pathogenic Score contribute to X.
- The result reports `n_variants_total`, `n_variants_scored`,
  `n_variants_unscored`, and score coverage.
- A fitted burden result is labeled `exploratory_scored_variants_only` whenever
  any variant for that gene is unscored.
- If no variants are scored or fewer than five samples have positive X, Beta
  and P-value are null with an explicit status.
- No fallback score, presence-only burden, or annotation-derived scoring rule
  is introduced in this validation.

## Outputs and privacy boundary

The calculation produces:

- a private sample-level audit table used only to reproduce joins and X/Y;
- a private variant audit table with carrier and score completeness checks;
- an aggregate JSON result containing query HPOs, sample counts, variant Match
  Scores, burden diagnostics, Beta, P-value, model version, and statuses.

The aggregate JSON must not contain sample IDs or sample-level residuals. UI
connection follows only after the file-based calculations and manual checks
pass. It contains separate endpoint-shaped results for CEP152 and DMD plus a
side-by-side comparison of carrier counts, variant counts, score coverage,
variant Match Scores, Beta, P-value, and status.

## Validation

- Confirm all four HPO terms exist in the matrix.
- Confirm CEP152 and DMD rows use the expected genotype-evidence schema.
- Report genotype/phenotype overlap without printing IDs.
- Manually reproduce at least three variant Match Scores from private carrier
  residuals.
- Manually reproduce at least three sample burden values, including a
  multi-variant carrier when available.
- Verify dosage does not change X and duplicate sample-variant rows do not
  change X.
- Report score coverage before interpreting Beta or P-value.
- Confirm the phenotype residual vector is calculated once and reused unchanged
  for both genes.
- Run the existing Python calculation tests and one two-gene end-to-end check.
