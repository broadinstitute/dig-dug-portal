# REVEL Pathogenic Score Fallback Design

## Goal

Use one Pathogenic Score priority across the 2025 genotype burden pipeline and
the Gene Page context calculation:

```text
LoFTEE HC -> AlphaMissense -> REVEL -> No_score
```

REVEL rescues variants only when neither LoFTEE HC nor a finite AlphaMissense
score is available. ClinVar, genotype dosage, and consequence are not score
fallbacks.

## Score contract

For each distinct variant:

1. `LoF=HC` gives Pathogenic Score `1`.
2. Otherwise, a finite AlphaMissense value in `[0,1]` is used.
3. Otherwise, a finite REVEL value in `[0,1]` is used.
4. Otherwise, the score is undefined and the source is `No_score`.

The selected source is recorded as `LoFTEE_HC`, `AlphaMissense`, `REVEL`, or
`No_score`. A numeric zero produced by an available predictor remains a defined
score; it is not treated as missing.

## 2025 burden pipeline

Update the existing 2025 nonsynonymous Step4 calculation without changing its
population, DP threshold, AF threshold, carrier rows, or dosage behavior. Its
legacy burden remains:

```text
weighted_score = alt_dosage * Pathogenic Score
```

The rerun writes all burden, evidence, QC, and validation files under a new
`revel_fallback_v1_20260715` versioned location. It must not overwrite the
current canonical files while calculating.

After the new run passes validation:

1. Compare old and new row counts and key sets.
2. Confirm that only REVEL-rescued scores and their downstream aggregates
   change.
3. Preserve the current canonical results under a clearly named pre-REVEL
   archive.
4. Promote the validated new files to the existing canonical paths atomically.
5. Recheck the `VCF_versions` catalog links and gzip integrity.

The expected coverage benchmark from the frozen 2025 evidence is 1,658,555
assigned gene-variant pairs, with 368,536 (`22.22%`) remaining unscored under
the new priority. These values are validation expectations, not hard-coded
calculation inputs.

## Gene Page context calculation

The portal model continues to use carrier presence rather than genotype dosage:

```text
X_i = sum(Pathogenic Score_v for distinct scored variants carried by sample i)
Y_i = phenotype_match_score_resid for sample i
```

Update the evidence normalization so REVEL is used only after LoFTEE HC and
AlphaMissense. The stored Pathogenic Score must match the selected provenance.
Variant Match Scores remain independent of Pathogenic Score availability.

Because the construction of `X` changes, the result uses model version
`portal_huber_rlm_v1` and score version
`loftee_hc_alphamissense_revel_v1`. Score coverage and
`n_variants_unscored` remain part of every gene burden result.

## Validation

Automated tests cover all precedence cases:

- LoFTEE HC overrides AlphaMissense and REVEL.
- AlphaMissense overrides REVEL.
- REVEL rescues a variant with no higher-priority score.
- A variant with no finite source remains `No_score`.
- Stored score/provenance mismatches fail explicitly.
- Carrier-presence portal burden remains independent of dosage and duplicate
  carrier rows.

The full HPC rerun is accepted only after `sacct` completion, validation/QC
PASS, stderr/log review with no unexpected errors, gzip integrity, unique-key
checks, score-source counts, and old-versus-new comparison all pass. The
private CEP152/DMD context fixture is then regenerated and compared without
committing sample IDs, patient residuals, audits, or private input paths.

## Repository and publication boundary

Commit only related calculation code, tests, and shareable documentation.
Preserve unrelated dirty-tree files and private/generated artifacts. Push the
completed verified changes to `kyuryung/mockup-branch` only after the versioned
HPC results and local portal checks pass.
