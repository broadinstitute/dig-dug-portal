# Backend updates — 2026-10-05

Handoff notes, written with the context of the migration session. **Nothing here is integrated yet.**
Read this first in the next session, alongside `CHECKIN_PUNCHLIST_2026-10-02.md`.

---

## 1. New endpoint: `gene-program-nmf-liger-report`

```
/api/bio/query/gene-program-nmf-liger-report?q=<tissueKey>,<cellType>
```

Tissue-keyed, no model argument — consistent with the migrated endpoints. One row per factor.

**This is the QC rule the check-in asked for.** It unblocks punchlist 1.4 (stop graying by p-value) and
1.5 (hide QC-failing programs by default).

### 1.1 Fields

Grouped by the check they belong to. Each check contributes a `*_status`, with the evidence beside it.

| Group | Fields |
|---|---|
| Identity | `factor`, `tissue`, `cell_type`, `dataset` |
| Activity | `mean_cell_score`, `max_gene_loading`, `activity_status` |
| Independence | `most_correlated_factor`, `max_other_factor_corr`, `independence_status` |
| Curated-state match | `best_matching_state`, `best_match_corr`, `similarity_basis`, `similarity_status` |
| Technical confound | `top_technical_covariate`, `top_technical_corr`, `technical_status` |
| Blacklist / QC signature | `top_blacklist_match`, `blacklist_match_corr`, `blacklist_status` |
| Cross-cell-type contamination | `top_contaminant_state`, `top_contaminant_celltype`, `contaminant_gene_loading_corr`, `contaminant_cellscore_corr`, `contamination_status` |
| Verdict | `n_flags`, `flags`, `overall_verdict` |

### 1.2 **Only four of the six checks are flagged — this is the critical detail**

From the source report (`factor_report.txt`), which states it explicitly and repeatedly:

| Check | Contributes to a flag? | Report wording |
|---|---|---|
| Activity | **yes** | `Inactive (flagged)` |
| Independence | **yes** | `Redundant with another factor` |
| Technical confound | **yes** | `Possible technical confound` → `FLAGGED [TECHNICAL_CONFOUND_SI_Age]` |
| Cross-cell-type contamination | **yes** | `Possible cross-cell-type contamination (flagged)` |
| Curated-state match | **no** | `informational only, not flagged` |
| Blacklist / QC signature | **no** | `informational only, not flagged` |

So **`overall_verdict` is the rule to filter on**, not any individual status, and specifically *not*
`blacklist_status`. `high_confidence` means no flags at all; `flagged` carries reason codes in `flags`.

Worked examples from the report:

- `Factor_factor4` — everything clean except `Technical QC: POSSIBLE_CONFOUND (SI_Age, r = 0.57)`
  → `FLAGGED [TECHNICAL_CONFOUND_SI_Age]`
- `Factor_factor8` — `Cross-cell-type QC: POSSIBLE_CONTAMINANT (… macrophage, cellscore r = 0.57)`
  → `FLAGGED [CONTAMINATION_artery_macrophage_antigen_presenting_macrophage]`
- Every other factor in that run → `HIGH_CONFIDENCE`

Note the report's own totals: 12/12 active, 12/12 independent, 11/12 technically clean, 11/12
contamination-clean, **10/12 (83%) high-confidence**. So a default filter on `overall_verdict` hides
roughly one program in six rather than most of them — which makes default-hidden viable.

### 1.3 Do not confuse this with the QC-signature filtering already in the code

Two different axes that both say "QC", and conflating them would be a real bug:

- **Factor-level QC** (new, this endpoint) — *is this gene program trustworthy?* Drives graying/hiding
  of **program rows**.
- **QC-signature filtering** (already implemented) — *is this `state_name` a QC artifact rather than a
  curated cell state?* Drives dropping **states and edges**, via `qc_signature_id` from
  `gene-program-qc-metadata-extended`, in `isQcStateRow()`.

`blacklist_status` / `top_blacklist_match` on the report rows name a QC signature a factor correlates
with, and are **informational only**. They must not feed `isQcStateRow()` and must not drive hiding.

### 1.4 Enum values — **measured 2026-10-05, no longer inferred**

Swept all 169 tissue/cell-type pairs on `bioindex-dev.hugeamp.org`; 162 returned rows, 2308 factor
rows total. Every value below was observed. Three of the doc's earlier guesses were wrong.

| Field | Observed values | vs. the earlier guess |
|---|---|---|
| `activity_status` | `active`, `inactive` | as guessed |
| `independence_status` | `independent` **only** | `redundant` **never occurs** — see below |
| `similarity_status` | `no_strong_match`, `tracks_curated_state` | now known |
| `technical_status` | `clean`, `possible_confound` | as guessed |
| `blacklist_status` | `clean`, `possible_blacklist_match`, **`unknown`** | third value not anticipated |
| `contamination_status` | `clean`, `possible_contaminant`, **`unknown`** | third value not anticipated |
| `overall_verdict` | `high_confidence`, `flagged` | as guessed |

**`flags` is semicolon-separated, no spaces:**

```
TECHNICAL_CONFOUND_Y;CONTAMINATION_bonemarrow_promyelocyte_primary_granule_biosynthesis
```

Three code shapes, and note the first takes no suffix:

- `INACTIVE` — bare, no argument
- `TECHNICAL_CONFOUND_<covariate>` — e.g. `_X`, `_Y`, `_age`, `_SI_BMI`, `_QC_percent_mt`
- `CONTAMINATION_<state_id>` — the full contaminant state ID

No `REDUNDANT_*` code appears anywhere in 2308 rows, consistent with `independence_status` being
constant. **Do not render an "independence" check as a live signal** — on this data it can only ever
say "pass", which reads as a verified check rather than one that never fires.

#### Both thresholds appear to be |r| ≥ 0.5

Consistent across every sampled row: `technical_status` flips to `possible_confound` at
`|top_technical_corr| ≥ ~0.5` (0.654 and 0.6615 flag; 0.3215 and −0.2342 do not; −0.5368 flags), and
`contamination_status` flips at `contaminant_cellscore_corr ≥ ~0.5` (0.5404 and 0.546 flag; 0.4475
and 0.41 do not). `contaminant_gene_loading_corr` is near zero throughout and does not appear to
drive the verdict. Useful if the UI ever shows how close a factor sat to the line.

#### Flagged rate — **355 of 2296 rows, 15.5%. Default-hidden is viable.**

Close enough to the 10-of-12 sample report's implied ~17% to confirm it. Range by tissue:

| | | | | | |
|---|---|---|---|---|---|
| muscle 8% | heart 10% | hypothalamus 12% | liver 12% | pancreas 13% | kidney 13% |
| artery 15% | tendon 15% | vat 16% | bone 21% | sat 22% | **bonemarrow 35%** |

`n_flags` never exceeds **2** (1941 rows at 0, 281 at 1, 74 at 2), so a reason display never has to
handle more than two codes.

Reason counts across the 429 codes: `TECHNICAL_CONFOUND` 274, `CONTAMINATION` 137, `INACTIVE` 18.

#### `unknown` is a third state and must not be folded into either side

It means the check could not be run, not that it passed and not that it failed. Treating it as
`clean` overstates confidence; treating it as flagged hides programs for missing data.

**Measured:** 222 rows (9.7%) carry `unknown`, and it is always *both* `contamination_status` and
`blacklist_status` together — never one alone. Of those, **200 are `high_confidence` and 22 are
`flagged`** (flagged by activity or technical, since contamination could not run).

So `high_confidence` is not uniform: on ~200 rows it means "four checks passed and two never ran."
If the UI ever states *why* a program is trusted, it must not claim the contamination check passed on
those rows.

#### ⚠️ `X` and `Y` drive more flags than anything else, and nobody knows what they are

Of the 274 technical-confound flags, **154 (56%) are covariate `X` or `Y`** — 36% of all 429 flag
codes, the single largest cause of hiding.

| covariate | flags | reading |
|---|---|---|
| `Y` 81, `X` 73 | **154** | unknown — see below |
| `QC_percent_mt` 33, `QC_nFeature_RNA` 13, `QC_nCount_RNA` 12, `nCount_normalized` 5 | 63 | genuinely technical |
| `age` 25, `SI_Age` 10, `SI_BMI` 3 | 38 | biological |
| `Trait_Duration_of_diabetes` 12, `Trait_T1GRS_nonMHC` 1 | 13 | biological — the signal, arguably |
| `SI_Subject_ID` 6 | 6 | batch / donor |

Two readings of `X` / `Y`, and both undermine the flag:

- **sex chromosomes** — then the flag means "this program differs by sex", which is biology, not an
  artifact.
- **embedding coordinates** (UMAP X/Y) — then it is near-circular: LIGER factors are what the
  embedding is computed *from*, so a factor correlating with its own embedding axis is expected.

**Ask Kyle what `X` and `Y` are.** If either reading holds, these 154 flags should be excluded and
the effective hidden rate drops from 15.5% to roughly 9%.

#### ⚠️ `technical_status` flags on covariates that are not technical

Observed `top_technical_covariate` values include `Trait_Duration_of_diabetes`, `Trait_T1GRS_nonMHC`,
`SI_BMI`, `SI_Age` and `age` alongside genuinely technical ones (`QC_percent_mt`, `QC_nFeature_RNA`,
`QC_nCount_RNA`, `nCount_normalized`) and the ambiguous `X` / `Y`.

A program flagged `TECHNICAL_CONFOUND_Trait_Duration_of_diabetes` has been flagged for correlating
with **disease duration** — which on a diabetes portal is plausibly the signal, not an artifact.
Since `overall_verdict` rolls this into `flagged`, a default-hidden filter would hide exactly those
programs. **Raise with Kyle before shipping 1.5.** This is the one finding that could change the
design rather than just the implementation.

### 1.5 Factor ID join — **confirmed clean**

`factor_report.txt` named its factors `Factor_factor1`…`Factor_factor12`; the API returns `Factor1`
… `Factor18` across the sweep. The report file was a different run, and the API's form is the one the
other endpoints use. Still worth one direct set-comparison against `gene-program-factor` for a single
scope, but the naming mismatch was an artifact of the text report, not of the index.

### 1.6 Incidental: `max_gene_loading`

80.84 here, and we have previously observed loadings up to ~58. The gene→program link width currently
scales to the strongest loading on screen with a floor (`GENE_LINK_CEILING_FLOOR = 5`). A per-factor
`max_gene_loading` could give that scale a principled ceiling instead. Minor, not required.

### 1.7 Not answered by this endpoint

The check-in's question *"what does the `p_value` on the expression rows test?"* is still open. This
endpoint removes the **need** for that p-value in the graying logic, but if the p-value stays on
screen anywhere we still cannot say what it means. Keep punchlist 3.1 open.

---

## 2. Answers to outstanding backend questions

### 2.1 `gene-program-cell-state-metadata-extended` — **not available for all 12 tissues**

This is a real constraint on the current design, not a minor gap.

That endpoint is the sole source of:
- `display_name` — the readable cell state label
- `summary.portal_user_summary` — **the lede now rendered on every cell state row**
- marker genes, citations, methods, `state.is_qc`

So for tissues without it, cell state rows lose their second line entirely and fall back to raw IDs
like `liver_schwann_cell_repair_activated_schwann_cell`, and the Cell state detail tab is empty.

**Next session should:**
1. Determine *which* tissues have it (bone, bonemarrow and tendon are new and presumably among the
   gaps, but the answer was just "no", not a list).
2. Make the degradation deliberate: `stateLabel()` already falls back through `state_name`, so the
   label survives — but `formatDisplayLabel()` on those IDs gives
   "Liver Schwann Cell Repair Activated Schwann Cell", which is poor. Consider stripping the
   `<tissue>_<cellType>_` prefix, which is redundant with the scope the reader already chose.
3. Decide what a lede-less state row looks like. It currently renders a single line and the row keeps
   its fixed height, so it degrades without breaking the canvas — but a whole list of them will look
   like something failed to load.

### 2.2 `gene-program-gene-set-factor` — **has data for SOME scopes only**

> **Corrected 2026-10-05 (later), then measured.** The claim below — that the endpoint simply "has
> data" — was made off a single `liver,schwann_cell,Factor7` sample and is wrong as a generalisation.
>
> **Swept all 161 scopes: only LIVER has gene-set associations.** 10 scopes with, 151 without.
> Every one of the other eleven tissues returns 0 for every factor tested — artery, bone, bonemarrow,
> heart, hypothalamus, kidney, muscle, pancreas, sat, tendon, vat. `liver,schwann_cell,Factor7` alone
> returns 3704 rows. The endpoint works and the query shape is right; the data is a liver-only load.
>
> This is the second wrong conclusion about this one endpoint. The first ("it's empty") came from
> testing with stale query shapes; the second ("it has data") came from correcting that with one
> sample and generalising from it. Both were single-scope inferences. **Ask Patrick whether the
> liver-only coverage is intended and whether the rest is coming** — see punchlist 3.14.
>
> UI consequence: the Gene sets tab is empty on 94% of scopes, so it is deliberately left *enabled*
> when empty and says that an empty result is a coverage gap, not a finding. A disabled tab would be
> the normal case and would explain nothing.

```
/api/bio/query/gene-program-gene-set-factor?q=liver,schwann_cell,Factor7
```

returns rows. The empty results I reported were almost certainly my own testing error — at that point
the test URLs still carried a `model` argument and/or a dataset ID rather than a tissue key.

Row shape: `dataset`, `tissue`, `cell_type`, `factor`, `factor_label`, `factor_quality`, `gene_set`,
`beta`, `beta_uncorrected`.

**Re-verify the Gene sets tab in the browser after the migration** — the code now sends
`?q=<tissue>,<cellType>,<factor>`, which is the shape that works.

Note the sample gene set name: `LAKE_ADULT_KIDNEY_C22_ENDOTHELIAL_CELLS_GLOMERULAR_CAPILLARIES`.
That is exactly the long unbroken underscore name the overview preview overflow fix was for, so that
fix should now be visible rather than theoretical.

### 2.3 Dataset drift, again

Liver is `FNIH_Liver_scRNA_v4.0` here; the old hardcoded table had `FNIH_Liver_scRNA_v3.2`. Nothing to
do — this is the behavior the migration was for — but it is a fourth confirmed version bump.

---

## 3. What to do first next session

**Unblocked by this update:**

1. Add the URL builder to `ligerApi.js` — nothing else about it is unusual:
   ```js
   factorReport: (tissueKey, cellType) =>
       query(host, "gene-program-nmf-liger-report", tissueKey, cellType),
   ```
2. **Fetch a scope with flagged factors first** and record the real enum values (§1.4). Do not write
   the filter against guessed strings.
3. Punchlist **1.4** — replace p-value graying with `overall_verdict`.
4. Punchlist **1.5** — hide flagged programs by default, with a `show all` checkbox, alongside the
   existing significance checkbox in the legend.
5. Surface the *reason* — `flags`, or the individual statuses with their correlations — in the program
   detail panel and/or the row tooltip. The evidence fields are the valuable part: "possible
   contamination from macrophage, cellscore r = 0.57" is far more useful than a grey row.

**Still blocked:** 1.1 (name), 1.8 (trait heat map — data validation), 1.10 (tissue-first flow — needs
the gene-independent tissue/cell-type API).

**Worth asking alongside the remaining questions:** how does `factor_quality`
(`exploratory_biological`, `unmatched`) relate to `overall_verdict`? Two quality signals on the same
object, from different endpoints, and it is not obvious whether they are orthogonal or redundant.
Building a badge on both would be the same mistake as v1's fabricated quality badge.
