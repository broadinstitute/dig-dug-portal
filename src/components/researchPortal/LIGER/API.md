# LIGER API Reference

Everything the front end needs to know about the LIGER indexes: how they are keyed, what each one
returns, where the data is incomplete, and what is still unanswered.

Companion to `README.md`, which covers the folder layout and how the *values* must be read
(expression bars, specificity denominators, axis scaling). This file is about the **endpoints**.

> Supersedes `DETAIL_DATA_CATALOGUE.md` and `BACKEND_REQUEST_TISSUE_KEYS.md`, both removed. The
> tissue-key request was delivered — see *Tissue keys* below. The catalogue's field inventories are
> preserved in full at the end of this file.

---

## Host

Resolved in `apiHost()` — a single binary choice, no precedence chain. Dev when the page is served
from `localhost` / `127.0.0.1` / `0.0.0.0`, or when any label of the hostname other than the TLD
contains `dev`. Prod otherwise. Both default to the hugeamp bioindexes.

**Two endpoints do not follow it** and are pinned to `LIGER_HUGEAMP_HOST`, because only the hugeamp
bioindex serves them (others return `501`):

- `/api/portal/phenotypes` — called **unscoped**, and must stay that way. `?q=md` scopes it to the
  metabolic disease group, which silently dropped every trait outside it.
- `/api/bio/match/gene?q=`

`BIO_INDEX_HOST` is deliberately unused: it is compile-time injected per portal build, so it made the
resolved host depend on how the bundle was built rather than on the page config.

## Tissue keys

**Every index is keyed on the tissue key** — `vat`, `pancreas`, `bonemarrow` — and none takes a model
argument. One convention, every endpoint, every portal.

This was a backend change the portal requested and received. Before it, endpoints disagreed about
whether argument 1 was a tissue key or a dataset ID, nothing declared which, and guessing wrong
returned **HTTP 500** rather than an empty result. The client carried a hardcoded tissue → dataset
table, a reverse index, per-portal dataset-ID observation, and a runtime sniff of which convention a
portal spoke. All of it is deleted.

Two rules follow, and both still bite:

- **Never hold a dataset ID as a constant.** They drift as source data is rebuilt — heart went
  `v3.2` → `v4.0`, artery and pancreas both moved to `v3`, liver is now `FNIH_Liver_scRNA_v4.0`
  (was `v3.2`). Read it from the `dataset` field of a row you just loaded.
- **Never gate the tissue list.** Every row reports its own `tissue`, so the list is whatever the API
  returns. The old table dropped anything it did not list, which is how `bone`, `bonemarrow` and
  `tendon` stayed invisible after the API gained them.

Twelve tissues are live: artery, bone, bonemarrow, heart, hypothalamus, kidney, liver, muscle,
pancreas, sat, tendon, vat. Across them, **161 tissue/cell-type scopes**.

The one remaining piece of tissue config is a display-label map (`TISSUE_LABELS`), and it is
temporary — labels cannot be derived from keys (`bonemarrow` title-cases to "Bonemarrow",
`sat`/`vat` to "Sat"/"Vat"). `tissue_label` has been requested on the gene-level expression
endpoints; `tissueLabel()` already prefers the row's field, so **delete the map when it lands**.

---

## Endpoints

| Endpoint | Query | Notes |
|---|---|---|
| `match/gene` | `<prefix>` | Autocomplete. Pinned to hugeamp. |
| `gene-program-expression-cell-state` | `<gene>` | Gene-level; source of the tissue list. |
| `gene-program-expression-program` | `<gene>` | Gene-level. |
| `gene-program-expression-cell-type` | `<tissue>,<gene>` | `log2fc_weighted_vs_all_parent` is **always null** here. |
| `gene-program-expression-cell-state` | `<tissue>,<cellType>,<gene>` | |
| `gene-program-expression-program` | `<tissue>,<cellType>,<gene>` | Carries `factor_label`, so node labels survive a `gene-program-factor` failure. |
| `gene-program-cell-state-metadata-extended` | `<tissue>,<cellType>` | `display_name` + the lede. **Not available for all 12 tissues.** |
| `gene-program-factor` | `<tissue>,<cellType>` | Exactly six fields. `top_genes` only. |
| `gene-program-gene-factor` | `<tissue>,<cellType>,<factor>` | One request per program — there is no gene-keyed loading index. |
| `gene-program-gene-set-factor` | `<tissue>,<cellType>,<factor>` | **Liver only.** See *Coverage gaps*. |
| `gene-program-qc-factor` | `<tissue>,<cellType>,<factor>` | |
| `gene-program-qc-metadata-extended` | `1` | The whole QC signature dictionary; fetched once. |
| `gene-program-heatmap` | `<tissue>,<cellType>` | Eight fields. `state_name` **mixes curated states and QC signatures**. |
| `gene-program-nmf-liger-report` | `<tissue>,<cellType>` | Factor-level QC. See below. |
| `gene-program-trait-factor` | `<tissue>,<cellType>,<factor>` | |
| `gene-program-cell-state-trait-factor` | `<tissue>,<cellType>,<stateId>` | |
| `portal/phenotypes` | *(unscoped)* | Trait labels and groups. Pinned to hugeamp. |
| `raw/file/single_cell_all_metadata/dataset_metadata.json.gz` | — | JSONL, not JSON. |

---

## The factor QC report

`gene-program-nmf-liger-report` — one row per factor, six checks, and an `overall_verdict` rolling up
the four that flag. The factor-level quality signal: *is this gene program trustworthy?*

**A different axis from `isQcStateRow()`.** That asks whether a `state_name` is a QC artifact rather
than a curated cell state. The report's own `blacklist_status` / `top_blacklist_match` name a QC
signature a factor correlates with, are informational only, and must not feed `isQcStateRow()`.

### Measured, not inferred

Swept all 161 scopes on `bioindex-dev.hugeamp.org`; 162 returned rows, **2,296 factor rows** total.

| Field | Observed values | Flags? |
|---|---|---|
| `activity_status` | `active`, `inactive` | yes |
| `independence_status` | `independent` **only** | yes, but never fires |
| `similarity_status` | `no_strong_match`, `tracks_curated_state` | **no — informational** |
| `technical_status` | `clean`, `possible_confound` | yes |
| `blacklist_status` | `clean`, `possible_blacklist_match`, `unknown` | **no — informational** |
| `contamination_status` | `clean`, `possible_contaminant`, `unknown` | yes |
| `overall_verdict` | `high_confidence`, `flagged` | — |

**Filter on `overall_verdict`, never on an individual status.**

`flags` is **semicolon-separated**, no spaces. Three code shapes, the first taking no argument:

```
INACTIVE
TECHNICAL_CONFOUND_<covariate>     e.g. _SI_Age, _QC_percent_mt, _X, _Y
CONTAMINATION_<state_id>
```

`parseFactorFlags()` returns `{code, kind, detail}` rather than keeping the raw string, so excluding
a class of flag later is a predicate change rather than a rewrite. An unrecognised code renders as
itself rather than vanishing.

### What the numbers look like

- **355 of 2,296 rows flagged (15.5%)**, ranging 8% (muscle) to 35% (bonemarrow).
- `n_flags` never exceeds **2** — 1,941 at 0, 281 at 1, 74 at 2.
- Reason counts across 429 codes: `TECHNICAL_CONFOUND` 274, `CONTAMINATION` 137, `INACTIVE` 18.
- Both thresholds appear to be **|r| > 0.5**. `contaminant_gene_loading_corr` sits near zero
  throughout and does not drive the verdict. All correlations are **Spearman r**.
- `independence_status` is constant across all 2,296 rows and no `REDUNDANT_*` code exists. **Do not
  render independence as a live check** — it can only ever say "pass".

### Traps

**`unknown` is a third state** meaning the check could not be run — not a pass, not a failure. 222
rows (9.7%) carry it, always on `contamination_status` and `blacklist_status` *together*. Of those,
**200 are `high_confidence`** — i.e. four checks passed and two never ran. Do not claim the
contamination check passed on those rows.

**`clean` on an informational check is not a low correlation.** One sampled factor reads
`blacklist_status: clean` at r = 0.68.

**`X` and `Y` drive more flags than anything else.** 154 of 274 technical-confound flags — 36% of all
flag codes. Two plausible readings (sex chromosomes, embedding coordinates) and both make the flag
inappropriate. A further 51 flags come from `age` / `SI_BMI` / `Trait_*` covariates, which are
biological rather than technical. **This is why the verdict currently displays but filters nothing.**

---

## Coverage gaps

| Gap | Status |
|---|---|
| **`gene-program-gene-set-factor` is liver-only.** 10 scopes with data, all liver; 151 without, covering the other eleven tissues entirely. `liver,schwann_cell,Factor7` returns 3,704 rows; `pancreas,beta_cell` returns 0 for all ten factors. | Measured across all 161 scopes. The Gene sets tab is empty on 94% of scopes, so it stays *enabled* when empty rather than being disabled and unable to explain itself. |
| **`gene-program-cell-state-metadata-extended` does not cover all 12 tissues.** It is the sole source of `display_name`, the lede, marker genes and citations. | Which tissues are missing is **unanswered**. Without it, state rows fall back to raw IDs. |
| **No gene-independent tissue/cell-type API.** | Blocks a tissue-first flow; the dropdowns cannot populate before a gene is chosen. |
| **`gsea_p` / `gsea_q` are null on a substantial fraction of heatmap rows** — 190 of 450 for islet beta. | Expected; reported separately from "below threshold" in the UI. |
| **`state_name` mixes curated states and QC signatures** — 36 of 45 distinct values for islet beta are `qc_bad_*`. No field separates them. | `isQcStateRow()` tests the `qc_` prefix, keeping the (never-populated) `state_type` test first in case the index grows it. |

---

## Open questions

Nothing below should be guessed at in code.

| # | Question | Who |
|---|---|---|
| 1 | **What are technical covariates `X` and `Y`?** 36% of all QC flags. Decides whether `overall_verdict` is ever safe to filter on. | Kyle |
| 2 | **Should `Trait_*` / `age` / `SI_BMI` covariates flag at all?** 51 flags from biological covariates. | Kyle |
| 3 | **Why is the contamination check `unknown` on 222 rows,** and should those still read `high_confidence`? | Patrick / Kyle |
| 4 | **Is `gene-program-gene-set-factor`'s liver-only coverage intended,** and is the rest coming? | Patrick |
| 5 | **Which tissues lack `cell-state-metadata-extended`?** | Patrick |
| 6 | **What does the `p_value` on expression rows test?** Asked twice on the 2026-10-02 call, unanswered. It no longer drives anything in the UI. | Patrick / Kyle |
| 7 | **What exactly are the gene loadings, and what is the scaling parameter?** Blocks labelling the units honestly. | Kyle |
| 8 | **How does `factor_quality` relate to `overall_verdict`?** Two quality signals on the same object from different endpoints. Orthogonal or redundant? | Patrick / Kyle |
| 9 | **Is `independence_status` meant to be constant,** or is the check not firing? | Kyle |
| 11 | **Confirm what the heatmap's GSEA tests.** The UI now tells readers it is "the cell state's marker gene set, tested for enrichment among genes ranked by their loading in the program" (`ENRICHMENT_DEFINITION`). That is the reading the field names imply, **not a confirmed description** — the index returns only `gsea_p` / `gsea_q`, with no `gsea_nes`, so neither effect size nor direction is available to check it against. If it is wrong, the tooltip is actively misleading. | Kyle / Patrick |
| 10 | **Does MSKKP serve the same bioindex as CMDKP?** Believed yes; unverified. | — |

---

## Field inventories

> **Provenance.** Measured on `bioindex-dev.pankbase.org`, `islet_of_Langerhans_scRNA_v3-4` / `beta`,
> plus a sweep of 11 islet cell types (87 curated states) — **before the tissue-key migration**, so
> the query shapes shown are the old dataset-keyed ones. The *field sets* are what matters here and
> are still believed current; the counts are of that sample, not of today's twelve tissues.

## 2. Cell state — what the API actually returns

### 2.1 `gene-program-cell-state-metadata-extended?q=<tissue>,<cellType>` — 1 row per state

Fill rates are over all 87 islet states.

**Identity**

| Field | Fill | Example |
|---|---|---|
| `state_id` | 87/87 | `pancreas_beta_cell_dedifferentiation_low_identity` |
| `display_name` | 87/87 | `Dedifferentiation low identity` |
| `state.label` | 87/87 | same as `display_name` |
| `summary.recommended_portal_label` | 87/87 | same as `display_name` |
| `tissue` / `tissue_label` | 87/87 | `pancreas` / `Pancreas` |
| `cell_type` / `cell_type_label` | 87/87 | `beta` / `Beta cell` |

**Prose** — four independent descriptions, all populated:

| Field | Character |
|---|---|
| `summary.portal_user_summary` | one-sentence, portal-voice. **Best lede.** |
| `summary.biological_description` | longer, mechanism-flavoured |
| `summary.short_description` | identical to `biological_description` in every state sampled |
| `summary.recommended_portal_summary` | "how to use this state" framing |
| `summary.curation_notes` | caveat sentence about panel overlap |

**Curation status** — this is the material for the overview block you want:

| Field | Distinct values across 87 states |
|---|---|
| `summary.portal_display_establishment` | 13 human-readable values (`Canonical identity marker panel` ×20, `Needs metadata review` ×18, `Well-established inflammatory process` ×17, …) |
| `summary.state_establishment_level` | 8 tokens (`well_established_process` ×40, `canonical_identity` ×19, `established_functional_state` ×9, `emerging_context_dependent` ×7, `established_subtype_or_zonation` ×5, `disease_associated_established` ×3, `needs_review` ×3, `generic_process_marker_panel` ×1) |
| `state.class` | `process_gradient` 44, `broad_identity_gradient` 21, `rare_process` 9, `broad_function_gradient` 7, `composite_required` 3, `unknown` 3 |
| `state.interpretation_status` | `continuous_gradient` 72, `continuous_or_hard_callable_if_separable` 9, `composite_required` 3, `needs_review` 3 |
| `state.release_class` | `portal_default` 49, `portal_flagged` 37, `exploratory` 1 |
| `state.portal_visibility` | `show_default` 63, `show_with_caution` 24 |
| `state.qc_sensitivity` | `low` 38, `moderate` 29, `none` 16, `high` 4 |
| `state.allow_hard_call` | `false` 78, `true` 9 |
| `state.is_composite_required` | `true` 3 |
| `curation.provenance_warnings[]` | 15 distinct combinations, e.g. `portal_metadata_rule:canonical_identity`, `ambiguous_language_override_applied` |
| `curation.curated_by` | **constant** `CMDKP cell-state curation workflow` |
| `curation.curation_version` | **constant** `2026-06-04` |
| `curation.manual_review_status` | **constant** `Not yet reviewed` |
| `quality.quality` / `quality_class` / `quality_label` | **constant** `AI curated` |
| `quality.quality_badges[]` | **constant** `["AI curated cell state"]` |
| `summary.portal_primary_badges[]` | **constant** `["AI curated cell state"]` — identical to the above |
| `summary.recommended_display` | **constant** `curated_state` |
| `state.is_qc` | **constant** `false` |

The six constants are still worth showing *once*, as a provenance line ("AI curated by the
CMDKP workflow, v2026-06-04, not yet manually reviewed"), but not as six badges — right now
`portal_primary_badges` and `quality_badges` are the same string and the dedupe in
`buildLabeledDetailBadges` is the only thing hiding it.

**Gene-interpretation guidance** — already wired into `interpretationRows`:

| Field | Fill |
|---|---|
| `summary.gene_expression_interpretation` | 87/87 |
| `summary.gene_expression_caveat` | 87/87 |
| `summary.gene_expression_followup` | 87/87 |
| `summary.gene_expression_overinterpretation_warning` | 87/87 |
| `summary.interpretation_caveat` | 87/87 — **not currently shown**, distinct from `gene_expression_caveat` |
| `summary.do_not_overinterpret_as` | 68/87 |
| `summary.required_supporting_evidence` | 68/87 |

**Methods and scoring** — fully populated, currently computed by `stateMethodsDetail()` but
**never rendered anywhere** (nothing reads it in `v1/StateDetails.vue`):

| Field | Example |
|---|---|
| `scoring.primary_score` | `AUCell` (constant) |
| `scoring.secondary_score` | `UCell` (constant) |
| `scoring.hard_call_policy` | `continuous_only_unless_manifest_allows_threshold` (constant) |
| `scoring.activity_weights[]` | 2 entries, each `{id, label, description}` — e.g. "Gradient state activity: within-state AUCell percentile squared" |
| `state.score_scope` | `within_tissue_cell_type` |
| `state.hard_call_notes` | full sentence |
| `summary.portal_methods_details` | pre-composed methods paragraph |

**Markers** — 8–10 per state, 87/87 populated:

`marker_set.markers[]`: `gene`, `role` (`positive_marker`), `evidence_level` (`curated`),
`marker_notes`, `source_type` (`literature_curated`), `from_excel`, `from_gmt`,
`citations[]` (`citation_id`, `citation_label`, `url`; `doi`/`pmid` always empty).
Plus `marker_set.n_markers`, `gene_set_description`, `source_gmt`, `source_workbook`.

**Citations** — `state_level_citations[]`, 1–5 per state:
`citation_id`, `citation_label`, `raw_citation_text`, `url` are populated.
`authors`, `title`, `journal`, `year`, `doi`, `pmid` are **empty on every row**, so the
`suffix` in `stateReferenceDetail()` is always the empty string.

**Always empty — do not build UI on these:**

| Field | Status |
|---|---|
| `human_genetics.pigean_available` | `false` 87/87 |
| `human_genetics.top_trait_associations[]` | `[]` 87/87 |
| `human_genetics.links.pigean_results_api` | populated, but the URL 404s (the flag says unavailable) |
| `related.matched_programs[]` | `[]` 87/87 |
| `related.qc_signatures_to_check[]` | `[]` 87/87 |
| `related.related_states[]` | `[]` 87/87 |
| `quality.known_limitations[]` | `[]` 87/87 |
| `quality.qc_caveats[]` | `[]` 87/87 |
| `quality.suppress_from_default_view` | `false` 87/87 |
| `curation.last_reviewed` | `""` 87/87 |
| `summary.state_establishment_rationale` | `""` 87/87 |

Note `related.*` being empty is why *all* state↔program association has to come from the
heatmap index.

### 2.2 State associations

| Source | Rows | Usable fields |
|---|---|---|
| `gene-program-heatmap?q=<ds>,<ct>` | 450 for beta | `program_id`, `program_label`, `state_name`, `gsea_p`, `gsea_q` — **and nothing else** |
| `gene-program-cell-state-trait-factor?q=<ds>,<ct>,<stateId>` | 355 | `trait`, `beta`, `beta_uncorrected` |
| `gene-program-expression-cell-state?q=<ds>,<ct>,<gene>` | 9 | `log10_cpk`, `log2fc_weighted_vs_all_parent`, `p_value` |

`gsea_p`/`gsea_q` are `null` in **190 of 450** heatmap rows (42%).

---

## 3. Gene program — what the API actually returns

### 3.1 `gene-program-factor?q=<ds>,<ct>,<model>` — 1 row per program, 6 fields

| Field | Example |
|---|---|
| `dataset` | `islet_of_Langerhans_scRNA_v3-4` |
| `cell_type` | `beta` |
| `model` | `mouse_msigdb` |
| `factor` | `Factor1` |
| `label` | `ribosomal or translation/QC program` |
| `top_genes` | `EIF4A2;FTH1;PPDPF;FTL;LINGO1;RPL4;...` (semicolon string) |

That is the entire program-level metadata surface. Ten beta programs, labels drawn from a
small vocabulary: `ribosomal or translation/QC program` ×3, `Qc bad motile cilia artifact QC
program` ×3, `unmatched data-driven program` ×2, `heat shock or dissociation/QC program`,
`ambient or contamination/QC program`.

Worth noting: **7 of 10 beta programs are self-labelled QC/artifact programs.** That is the
honest headline for a program overview, and it is available today — far more informative than
the constant "Exploratory biological".

### 3.2 Program associations

| Source | Rows (Factor1) | Usable fields |
|---|---|---|
| `gene-program-gene-factor` | 4940 | `gene`, `value` (loading, 0–58.2; 45 rows are exactly 0), `factor_label` |
| `gene-program-gene-set-factor` | 4026 | `gene_set`, `beta` (8.1e-06 … 1.52), `beta_uncorrected` |
| `gene-program-qc-factor` | 19 | `state_name`, `gsea_p`, `gsea_q` (both always present) |
| `gene-program-qc-metadata-extended?q=1` | 36 | `qc_signature_id`, `display_name`, `category`, `tier`, `recommended_use`, `exclude_when`, `markers[]`, `source`, `source_gmt` |
| `gene-program-trait-factor` | 103 | `trait`, `beta`, `beta_uncorrected` |
| `gene-program-heatmap` | 45 states × program | `state_name`, `gsea_p`, `gsea_q` |
| `gene-program-expression-program` | 10 | `log10_cpk`, `log2fc_weighted_vs_all_parent`, `p_value` |

The QC metadata join is clean: **19/19** `qc-factor` rows match a `qc_signature_id`. That
metadata is richer than the tooltip currently uses — `tier`
(`hard_exclude_if_incompatible` ×30, `review_exclude_if_extreme` ×3, `hard_exclude_if_high`
×2, `hard_exclude_if_extreme` ×1), `recommended_use`, and `exclude_when` ("High in
non-adipocyte parent cell types.") are all unused. `category` has 9 values:
`offtarget_identity` 18, `ambient_rna` 9, `unexpected_lineage_or_artifact` 2,
`blood_ambient_or_contaminant` 2, and five singletons.

---

## 4. Fields the code looks for that do not exist

Every one of these produces a silently-empty column, a dead fallback, or a wrong constant.

**On heatmap rows** (`relationshipHeatmapRows`):
`correlation`, `cell_spearman_r`, `cell_spearman_r_gradient`, `donor_spearman_r`,
`donor_spearman_r_gradient`, `combined_match_score`, `metric_value`, `score`, `metric_id`,
`match_class`, `qc_recommendation`, `qc_caveat`, `state_type`, `gsea_nes`, `loading_auc`,
`expression_score_spearman_r`, `top100_overlap_n`, `display_name`, `state_label`.

**On program metadata** (`meta` in `openProgramDetail`):
`rationale`, `suggested_program_label`, `suggested_program_quality_class`, `quality_class`,
`release_recommendation`, `qc_recommendation`, `qc_cell_states`.

**On gene-set rows**: `factor_value`, `relevance_to_factor`, `gene_set_description`,
`description`, `label`.

**On state metadata rows**: everything in §2.1's "always empty" table.

### Consequences visible in the UI today

1. **`state_type` filter is a no-op, and it matters.** The heatmap returns 45 distinct
   `state_name`s for beta — **36 of them are `qc_bad_*` signatures**, only 9 are curated
   states. `curatedStateMatchesForProgram()` filters with
   `field(row, ["state_type"]) !== "qc_state"`, which is `null !== "qc_state"` → true for
   every row. So the program's **"State matches" tab and the "Best curated state matches"
   overview preview both list QC signatures as if they were curated states**, labelled with
   whatever `shortStateLabel()` makes of a raw `qc_bad_*` id. Conversely
   `qcMatchesForProgram()` always returns `[]`.
2. **`Correlation` (program panel) and `Cell coactivity` (state panel) columns are always
   blank** — both read heatmap fields that don't exist.
3. **`Match score` is not a match score.** `rowMatchScore()` falls through to
   `gseaNegLogQValue()`, so on the program panel it is an exact duplicate of the adjacent
   `-log10(q)` column, and on the state panel it is a relabelled `-log10(q)`.
4. **The metric selector offers two derived duplicates.** `relationshipMetricIds` resolves to
   `["gsea_neglog10p", "gsea_neglog10q"]` only — both recomputed from `gsea_p`/`gsea_q`, which
   are already their own columns. Default is `gsea_neglog10p`. The `divergingMetrics` list is
   always empty.
5. **`Rationale` never renders; `Quality` is the constant from §1.**
6. **Gene-set `relevanceToFactor` and `description` are always null** — the sort key in
   `buildProgramGeneSetTableRows()` therefore reduces to `max(|beta|, |beta_uncorrected|)`.
7. **The state trait empty-state text is stale.** "No state-level PIGEAN rows returned for
   this state in the current API" — that endpoint returns 355 rows now.
8. **`stateMethodsDetail()` is computed and never consumed.** Dead code covering real data.

---
