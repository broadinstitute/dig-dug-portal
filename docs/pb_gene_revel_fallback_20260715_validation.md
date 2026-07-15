# REVEL Pathogenic Score Fallback Validation (2026-07-15)

## Result

The 2025 nonsynonymous burden and evidence were regenerated and promoted to
the existing canonical paths after the versioned candidate passed all gates.
The previous canonical files are preserved under version label
`pre_revel_v0_20260715`; the validated source run is preserved under
`revel_fallback_v1_20260715`.

Pathogenic Score version `loftee_hc_alphamissense_revel_v1` uses:

```text
LoFTEE HC = 1 -> AlphaMissense -> REVEL -> No_score
```

The 2025 Step4 burden continues to use:

```text
weighted_score = alt_dosage * Pathogenic Score
```

## HPC execution gates

| Job | Purpose | Final state |
| --- | --- | --- |
| `21873080` | Generate versioned Step4 burden, evidence, and QC | `COMPLETED`, exit `0:0` |
| `21873132` | Compare legacy and candidate evidence/burden | `COMPLETED`, exit `0:0` |
| `21873136` | Recalculate aggregate CEP152/DMD context results | `COMPLETED`, exit `0:0` |
| `21873146` | Independently rebuild private variant and sample audits | `COMPLETED`, exit `0:0` |

The Step4 validation, evidence-to-burden rebuild, conservation checks, gzip
integrity checks, and old/new comparison all returned `PASS`.

## Pathogenic Score coverage

The frozen 2025 evidence contains 1,658,555 assigned gene-variant pairs.

| Selected score source | Gene-variant pairs | Percent |
| --- | ---: | ---: |
| LoFTEE HC | 81,737 | 4.928% |
| AlphaMissense | 1,130,582 | 68.167% |
| REVEL fallback | 77,700 | 4.685% |
| No score | 368,536 | 22.220% |

REVEL rescued 77,700 gene-variant pairs that were unscored in the legacy
pipeline. The remaining score coverage is 77.780%. A defined numeric zero
remains scored and is not classified as `No_score`.

## Legacy versus v1 burden

The candidate retained all 11,423,009 evidence rows and all 10,205,276
sample-gene burden rows. Evidence keys, sample-gene keys, annotations,
`n_variants`, and all non-REVEL scores were unchanged.

REVEL fallback affected 567,335 carrier rows and changed the score sum for
485,284 sample-gene rows. The dosage-weighted score added across the evidence
was 96,291.164. The comparison reconstructed every changed score and burden
delta from REVEL-only rows and returned `PASS`.

## CEP152 and DMD context check

The context analysis used the same four HPO terms, 16,343-sample analysis
population, and phenotype residual checksum as the legacy validation. Variant
Match Scores and carrier counts were unchanged.

| Gene | Variants | Scored | Unscored | Beta | P-value |
| --- | ---: | ---: | ---: | ---: | ---: |
| CEP152 | 247 | 214 | 33 | 0.000164692 | 0.198437 |
| DMD | 401 | 312 | 89 | 0.0000663248 | 0.738222 |

Neither gene had a REVEL-only evidence row in this validation subset, so its
burden values and statistics were unchanged. The returned versions are now
`portal_huber_rlm_v1` and `loftee_hc_alphamissense_revel_v1`.

Private validation independently reproduced three variant Match Scores per
gene and all 16,343 sample burdens per gene. Sample IDs, residuals, patient-level
audits, private input paths, and generated aggregate JSON are not committed.
