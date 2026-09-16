# LIGER Detail Panels — Data Catalogue

What the state and program detail panels can actually show, verified against live responses.

**Probe conditions.** All counts below come from `https://bioindex-dev.pankbase.org`,
`islet_of_Langerhans_scRNA_v3-4` / `beta` / `mouse_msigdb`, plus a sweep of all 11 islet cell
types (87 curated states) and all 10 configured tissues.

Two facts that frame everything:

- **Prod pankbase does not serve these indexes.** `https://bioindex.pankbase.org` returns
  `{"detail":"Invalid index: ..."}` for every LIGER index. Only `bioindex-dev.pankbase.org`
  has them, i.e. only when the dev host is in play (localhost or a `dev` subdomain).
- **Only one dataset has data.** Of the 10 datasets in `LIGER_TISSUE_CONFIG`, only
  `islet_of_Langerhans_scRNA_v3-4` returns rows. The other nine (including the other pancreas
  dataset `FNIH_Pancreas_scRNA_v2.2`) return 0 on every index.
- **Metadata is tissue-keyed, everything else is dataset-keyed.**
  `gene-program-cell-state-metadata-extended` only answers to `Pancreas,<cellType>`; every
  other index only answers to `islet_of_Langerhans_scRNA_v3-4,...`.

---

## 1. Where "Exploratory biological" comes from

It comes from nowhere in the API. It is a client-side fallback that fires 100% of the time.

`openProgramDetail` ([LigerBrowser.vue:2532](LigerBrowser.vue:2532)) asks for a quality class:

```js
let quality = this.field(meta, ["suggested_program_quality_class", "quality_class",
                                "release_recommendation", "qc_recommendation"])
              || this.inferredProgramQuality(programId);
```

`gene-program-factor` returns exactly six fields — `dataset`, `model`, `cell_type`, `factor`,
`label`, `top_genes`. None of those four names exist, so it always falls through to
`inferredProgramQuality()` ([LigerBrowser.vue:2105](LigerBrowser.vue:2105)):

```js
let hasBadMatch  = rows.some(row => /qc|suppress|artifact/i.test(field(row, ["match_class", "qc_recommendation", "qc_caveat"]) || ""));
let hasStrongMatch = rows.some(row => /strong|gene_only/i.test(field(row, ["match_class"]) || ""));
return hasStrongMatch ? "high_confidence_biological" : "exploratory_biological";
```

`gene-program-heatmap` has no `match_class`, `qc_recommendation`, or `qc_caveat` field either
(verified over 1320 rows across every islet cell type). Both regexes test the empty string,
both fail, and the function returns `"exploratory_biological"` — which `prettyToken()` renders
as **"Exploratory biological"** and `detailBadgeTone()` colours warn, because the word
`exploratory` is in its warn regex.

So the badge is a hardcoded constant wearing a data-driven costume. Same value also feeds the
`Quality` row in `summaryFields`, so the overview says it twice.

The same collapse hits the neighbouring field: `Rationale` reads `meta.rationale`, which does
not exist, so that row is filtered out and never renders. The README's claim that
"`gene-program-factor` now also provides a `rationale` field" is not true of this deployment.

---

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
**never rendered anywhere** (nothing reads it in `StateDetails.vue`):

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

## 5. Proposed reorganization

Rule applied: the overview holds *identity + curation status* only; every many-row association
becomes a tab; anything in §2.1's always-empty table or §4 is deleted rather than rendered as
a blank.

### Cell state

**Header** — `display_name` · `cell_type_label`, `tissue_label` · `summary.portal_user_summary`
as the lede (as now).

**Overview** (no tab, always first):

- *About this state* — `summary.biological_description`, and `summary.recommended_portal_summary`
  as the "how to use it" line.
- *Curation status* — a labelled grid, not a badge soup:
  Establishment `summary.portal_display_establishment` · State class `state.class` ·
  Interpretation `state.interpretation_status` · Release `state.release_class` ·
  Portal visibility `state.portal_visibility` · QC sensitivity `state.qc_sensitivity` ·
  Hard calls `state.allow_hard_call`.
- *Provenance* — one line: "AI curated · CMDKP cell-state curation workflow · v2026-06-04 ·
  not yet manually reviewed", plus `curation.provenance_warnings[]` as small chips. Replaces
  the duplicated `portal_primary_badges` / `quality_badges` pair.
- *What this means for `<GENE>`* — the four `gene_expression_*` fields, as now, plus
  `summary.interpretation_caveat` and `summary.do_not_overinterpret_as` (68/87), which are
  currently dropped.
- Counts only, as jump-offs: N markers, N related programs, N traits, N citations.

**Tabs**

| Tab | Content | Source |
|---|---|---|
| Marker genes | chips + provenance table (gene, role, evidence, notes, source type, citations) | `marker_set.markers[]` |
| Related programs | heat table: Program, GSEA P, GSEA q, −log10(q). **Drop** Cell coactivity, Match score, and the metric selector. | heatmap |
| Traits | grouped heat table, joint/marginal beta | `…cell-state-trait-factor` |
| Methods | `portal_methods_details`, score scope, hard-call policy + notes, primary/secondary score, `scoring.activity_weights[]` | already built by the unused `stateMethodsDetail()` |
| References | `state_level_citations[]` — label + link only, drop the always-empty PMID/DOI suffix | metadata |

### Gene program

**Header** — `label` · `factor` · `cell_type` / `dataset` / `model`.

**Overview**:

- *About this program* — drop `summaryText`'s invented prose. State what is known:
  the model label, the factor id, N genes with positive loading, N gene sets, N traits.
- *Interpretability* — replace the fabricated quality badge with two things the API supports:
  1. **Self-label flag**: `label` contains `QC`/`artifact` → "This program is labelled as a
     QC/artifact program by the factorization" (true for 7 of 10 beta programs).
  2. **QC signature evidence**: "N of 19 QC signatures at q < 0.05" from `gene-program-qc-factor`,
     with the existing bubbles below it. Bubble tooltips gain `tier`, `recommended_use`, and
     `exclude_when` from the QC metadata.
- Remove `Rationale` and `Quality` from `summaryFields` entirely until the API supplies them.

**Tabs**

| Tab | Content | Source |
|---|---|---|
| Gene loadings | Gene / Loading, top 30 of ~4900 (say so) | `gene-program-gene-factor` |
| Curated state matches | heat table filtered to `state_name` **not** matching `^qc_`, since `state_type` doesn't exist. Columns: State, GSEA P, GSEA q, −log10(q). Drop Correlation, Match score, metric selector. | heatmap |
| QC signatures | promote from bubbles to a real table: Signature, Category, Tier, GSEA P, GSEA q, Marker genes, Exclude when | `qc-factor` ⋈ `qc-metadata-extended` |
| Gene sets | Gene set / Joint beta / Marginal beta, top N of ~4000 (say so) | `gene-program-gene-set-factor` |
| Traits | grouped heat table | `gene-program-trait-factor` |

### Shared cleanup

- Delete the metric selector from both panels, or gate it on `metricOptions.length > 2` so it
  disappears when the only options are the two `gsea_neglog10*` duplicates.
- Delete the `Correlation` / `Cell coactivity` / `Match score` columns.
- Split QC signatures out of curated-state matches by an `^qc_` test on `state_name`.
- Fix the stale "No state-level PIGEAN rows" empty-state string.
- Update README §"Endpoints Currently Wired" — the `rationale` claim and the `combined_match_score`
  / correlation metric list do not match what the index returns.

### Unverified

The phenotype label/group join (`/api/portal/phenotypes?q=md`) could not be measured from here —
Cloudflare blocks scripted access to both hugeamp bioindex hosts. Trait keys look like hugeamp
phenotype `name`s (`SerumUrea`, `BSandFG`), so the join plausibly works, but the effective row
count after `LIGER_FILTER_UNLABELED_HEATMAP_TRAITS` drops unlabelled traits is unmeasured. Worth
checking in the browser, since it decides whether the trait tabs show 355 rows or a handful.
