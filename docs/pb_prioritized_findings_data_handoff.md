# Prioritized findings: six-type source and engineering handoff

Reviewed 2026-11-09. This is an ingestion proposal based on the actual frozen files and generating code; it does not change the classifier or connect findings to the live UI.

## Recommendation

Use `six_type_classification.tsv.gz` as the authoritative classified evidence source. Materialize a **private, sample-keyed findings API/index** from it. Keep Type 5–6 discovery evidence distinct from disease evidence. Keep exclusions/review records in a separate coverage/QC product. Add disease-specific rPheRS only from an independently versioned calculation; the classification file does not contain it.

A release-faithful first implementation can show Type, Tier, variant/GT, disease/source evidence, cohort-fit explanation, recorded HPO overlap and discovery enrichment evidence. Missing scores and inheritance assessments must stay explicitly unavailable. Do not run classification rules in Vue.

## Source files and frozen provenance

Server directory:

```text
/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/browser_paper/tiering_phrank_validation_2025/results/six_type_classification_20260816
```

| File | Actual data rows, excluding header | Use |
|---|---:|---|
| `six_type_classification.tsv.gz` | 196,941 | Primary classified evidence records for the sample page |
| `type56_phenotype_gene_associations.tsv.gz` | 568,958 | Supporting HPO × dominant investigator × gene enrichment table; 213 rows have `is_rank_1=Y` |
| `six_type_unresolved.tsv.gz` | 952,433 | QC/review/exclusion reasons; not a second findings list |
| `classify_six_types_logic.py` | — | Exact rule implementation and column semantics |
| `run_six_types_20260816.sbatch` | — | Input paths, invocation and execution context |
| `logs/provenance/input_sha256_22542917.tsv` | — | Successful-job input hashes; do not substitute the failed-job manifest |
| `output_sha256.tsv`, `output_line_counts.tsv` | — | Artifact validation. Published line counts include one header line |

Verified SHA-256 values:

| Artifact | SHA-256 |
|---|---|
| classification | `0add6aa00b0aaba4fe2abe81558500a45854ccb5e57e4513976093692185f0d2` |
| Type 5–6 associations | `37b83aa7fa87437dfa954986ebf8a1fecc56998395cb66845336eb4b3d97454b` |
| unresolved | `4f37f740ec202ed58cda64f316e28cffd96ce177b2f2502faba484038d3a650c` |
| classifier script | `4564b47d07491a12e2e55f708d80739171de397928b051e8108ed0140c0afb27` |

All output hashes match the supplied manifest. The inspected script hash matches the successful job's input manifest.

The wrapper uses a **15,764-sample HPO matrix**, 16,366-sample metadata, ClinVar September 2025, HPO/HPOA 2026-02-16, Orphanet July 2026 disease-HPO data and the frozen Config2 tiering/known-gene evidence inputs. The upstream tiering path contains `config2_main_vcv_star34_legacy_tier23`. Current local sample variants instead use the September 7 processed evidence release, and current similarity scoring uses a 16,366-sample matrix. These releases must remain separately identified.

`source_version` in a classification row is the evidence source's version. In ClinVar rows it can be an RCV accession version such as `13`; it is not a classifier version or a release date. Publish a separate `classifier_release_id`, classifier hash, input manifest and build timestamp.

## Counts and actual grain

| Type | Evidence rows | Tier in this release | Context |
|---|---:|---|---|
| Type 1 | 542 | Tier 1 | `variant_rcv`, MATCH |
| Type 2 | 1,734 | Tier 1 | `variant_rcv`, OUTSIDE |
| Type 3 | 32,394 | Tier 2 | `known_gene_db`, MATCH |
| Type 4 | 161,593 | Tier 2 | `known_gene_db`, OUTSIDE |
| Type 5 | 663 | Empty / no tier | Own original investigator group's discovery signal |
| Type 6 | 15 | Empty / no tier | Another original investigator group's discovery signal |

The classified artifact covers **5,871 samples**, 41,700 distinct variant IDs and **97,400 sample × gene × variant combinations**. Required sample/gene/variant/GT fields are populated; variant ID formats passed the audit; there are no conflicting GTs for the same sample/gene/variant and no completely identical rows.

Neither the generator docstring's sample/gene/variant unit nor the existing handoff's sample/variant/disease key is a safe unique record key:

- `sample_id + variant_id + disease_id` loses 1,433 additional evidence rows.
- Adding gene, Type, evidence scope/source/record/version and inheritance still collides for 436 rows if **`evidence_value` is omitted**.
- Including `evidence_value` makes the audited evidence identity unique for all 196,941 rows.
- **9,421 sample/gene/variant combinations appear under multiple Types**. Different disease evidence can legitimately produce MATCH and OUTSIDE for the same variant.
- Type 5–6 all have blank `disease_id` by design. Requiring disease IDs would drop all 678 discovery findings.

Recommended durable identity: retain an immutable `record_id` derived from the classifier release plus the ordered complete source row, with the original file/row locator retained server-side. Keep an explicit natural-key audit including `evidence_value`. Never deduplicate by variant alone or choose one Type per variant.

The six buttons and All findings count **evidence records**. Publish distinct variants separately. If the list groups cards by variant, preserve all evidence records as selectable children and keep counts labelled; do not silently change the counting unit.

## Fields to ingest and where they belong

| UI / API area | Source fields | Contract |
|---|---|---|
| Finding identity and navigation | `sample_id`, `GeneSymbol`, `Variant_ID`, `GT`, `type`, `tier_label` | Canonicalize sample/variant IDs; preserve raw values and release; map `Type_1` → numeric Type 1 and `Tier_1` → Tier 1; empty Tier stays null |
| Disease title and links, Types 1–4 | `disease_id`, `disease_db_ids`, `disease_name` | Preserve aliases and evidence-specific disease identity; support MONDO, OMIM, ORPHA, MEDGEN and RCV fallback IDs |
| Evidence details | `evidence_scope`, `evidence_source`, `evidence_value`, `evidence_record_id`, `source_version` | Retain every distinct source/value; do not treat summary lists of all RCVs as the current evidence record |
| ClinVar details | `vcv_variation_id`, `rcv_accession`, `rcv_classification`, `rcv_review_status` | Show exact RCV review status; keep VCV and RCV review levels separate |
| Why this is Type 1–4 | `cohort_match`, `cohort_match_basis`, `investigator`, `investigator_disease`, `cohort_mapping_evidence`, cohort/disease category fields | Show frozen classification context; never recompute it from current project labels or from patient HPO overlap |
| Inheritance | `inheritance`, `inheritance_normalized`, `inheritance_status_input`, `_computed`, `_review`, final `inheritance_status`, `genotype_state` | Separate disease MOI, observed genotype and assessment. Blank or NOT_ASSESSED is not a match or a mismatch |
| Recorded HPO overlap | `patient_hpo_count`, `disease_hpo_count`, `matched_hpo_count`, `matched_hpo_terms`, `phenotype_coverage`, `phenotype_evaluation_status` | Source coverage is a **0–1 fraction**, not a percentage; multiply by 100 only for display. These counts use expanded HPO sets and exclude the ontology roots |
| Type 5–6 reason / discovery tab | `primary_*`, `cross_cohort_*` and association table | Normalize into arrays of HPO/group enrichment evidence; these are not disease records |
| Eligibility / coverage | `sample_analysis_role`, `family_id`, `family_id_source`, `family_relationship`, `affected`; unresolved reasons | Keep source analysis scope; absence of a classified row alone does not establish complete zero-findings coverage |
| Disease-specific rPheRS and percentile | Not provided | A separate sample × disease × scoring-release result is required |

The overlap denominator may differ from the 53 recorded terms shown in the current sample header. Preserve the expanded-vs-recorded distinction and source matrix version; do not substitute current raw-HPO counts into this frozen overlap.

### Type 5–6 must use a discovery evidence view

The code selects affected samples and one representative per BCH family, preferring affected `-01`; otherwise it requires exactly one affected index. Its dominant group requires at least 10 selected patients and at least 75% of patients with that HPO term. Rank 1 by one-sided Fisher raw p defines the gene signal; **no p/q significance cutoff is applied**. The association file has no FDR column. These are ranked enrichment signals, not a declaration of statistical significance.

Split semicolon-separated `primary_*` fields into aligned objects, checking every field length against `primary_group_count`; do the same for `cross_cohort_*`. Never split and deduplicate each column independently. Preserve counts, dominance fraction, rank, raw p and odds ratio together.

All 678 classified discovery records passed the parallel-array length check; 157 have more than one primary group. Retain these arrays instead of choosing the first group.

**For Type 6, `primary_*` contains the other investigator group's evidence** and `cross_cohort_*` is empty. For Type 5, `primary_*` is own-group evidence and `cross_cohort_*` can contain additional outside-group evidence. Do not label `primary_*` as the current project's evidence without inspecting Type/group identity.

The source has 30 nonfinite primary odds-ratio values. JSON must represent these as `odds_ratio: null` plus `odds_ratio_status: "positive_infinity"` (when applicable), not emit invalid JSON `Infinity` or silently convert to zero.

## Required UI corrections before using this release

1. **Tier 1 caption:** the current `ClinVar 3–4 star P/LP` caption cannot describe the row-level RCV evidence in this release. Its 2,276 Type 1–2 rows include expert panel (553), practice guideline (62), multiple submitters/no conflicts (676), single submitter (877), and no assertion criteria (108). The inspected RCV parser selects P/LP and does not apply an RCV review-star threshold. Recommended release-faithful caption: `Tier 1 · ClinVar RCV P/LP`, with each row's actual review status displayed and legacy input provenance retained. If the product instead requires RCV 3–4 stars, request a new approved classification release; frontend filtering cannot safely substitute for a full reclassification.
2. **Disease-specific scores:** every one of the 196,941 rows has `phenotype_weighted_score=NOT_CALCULATED`. Unweighted overlap and Fisher p are not residual PheRS or percentile. Hide the chart or show `Not calculated` until a separate scoring result is joined. Do not show zero/0th percentile for missing results.
3. **MOI assessment:** all 196,263 Type 1–4 records have final `NOT_ASSESSED_NO_MOI`; the 678 discovery records are blank. The field being present does not mean inheritance compatibility was established. Display `Not assessed: MOI not ingested`, with observed GT separately (see the MOI clarification below). Annotation enrichment later must not overwrite frozen classification history.
4. **Discovery layout:** Type 5–6 should show phenotype/group/gene evidence instead of `Disease unavailable` and an empty disease-score panel.
5. **Explicit evidence records:** change `PrioritizedFindings.vue` to receive canonical `findings[]` with stable record IDs directly. Its current `variants.flatMap(diseases)` and index keys cannot safely model the source grain, multiple evidence values or discovery records.
6. **Scope explanation:** replace the current `scope()` inference from Type number with the supplied context and basis. Distinguish original investigator-based classification context from today's `Project` display name. A current project-name mapping is display metadata; it must not change a frozen Type or MATCH/OUTSIDE status.
7. **Disease URLs:** the current helper sends every non-OMIM ID to Orphanet. Add namespace-specific URLs or render a plain ID when no route exists. Never fabricate an Orphanet URL for MONDO, MEDGEN or RCV IDs.
8. **Tier 2 caption:** the six-type script trusts the upstream `Tier_2` label and does not independently enforce high impact for those rows. The output has no consequence/high-impact field with which to verify the current `Known gene + high impact` caption. Prefer `Tier 2 · Known-gene evidence` until the upstream legacy tiering definition has been verified; enrichment annotations must not silently redefine the frozen tier.

## Unresolved records and completeness

| Source reason | Rows | Interpretation |
|---|---:|---|
| `affected_not_Y` | 636,159 | Outside this classifier's affected-sample scope |
| `missing_objective_cohort_category_match` | 204,321 | Objective cohort/category mapping could not be established |
| `no_eligible_disease_evidence` | 51,708 | No evidence passed the necessary mapping checks |
| `type56_family_representative_excluded` | 43,108 | Not selected as the family representative for Type 5–6 |
| `sample_not_in_phenotype_matrix` | 15,256 | Missing from the frozen phenotype matrix |
| `sample_not_in_metadata` | 1,881 | Metadata join absent |

These counts are rejection records, not counts of distinct variants or patients. A source row can generate multiple rejection reasons, and an unresolved disease evidence row can coexist with classified evidence for the same variant. Do not subtract unresolved counts from classified counts or label every unresolved record as an application error.

The classified table alone contains no complete roster of successfully evaluated samples with zero results. Publish a coverage table from the original eligible input roster with `available / partial / not_eligible / not_in_release / unavailable` and reason codes. A source-covered sample with classified rows can still have unresolved evidence. Only show `0 findings` when successful evaluation and zero results are established; otherwise show the relevant coverage state.

## Engineering delivery package and API

Prepare versioned artifacts outside the web application repository:

- `prioritized_findings.jsonl.gz`: canonical source evidence rows, sample-keyed, preserving raw record provenance and stable `record_id`.
- `discovery_evidence.jsonl.gz`: normalized Type 5–6 HPO/group evidence linked to finding record IDs; full associations remain an optional private drill-down dataset, not a browser download.
- `sample_classification_coverage.jsonl.gz`: evaluation scope/coverage and per-sample unresolved counts; raw unresolved details available only in private review/QC tools.
- `manifest.json`: file hashes/counts, schema/classifier/input releases, column transformations, original investigator context, matrix/ontology versions, creation time and lineage.
- Later: `sample_disease_scores.jsonl.gz`, keyed by sample, resolved disease/profile ID and scoring release. Include raw residual, Z-score/percentile/reference cohort and project comparison denominators. Disease alias resolution must be versioned and conflicts retained.

Suggested **new, not yet implemented** private endpoint:

```text
GET /phenotype-analyzer-api/sample-prioritized?sample_id={canonical_id}&type={1..6}&page=1&page_size=20
```

Return:

```ts
{
  sample_id: string;
  classifier_release_id: string;
  coverage: { status: string; reason_counts: Record<string, number> };
  summary: {
    evidence_record_count: number;
    distinct_variant_count: number;
    by_type: Record<string, { evidence_record_count: number; distinct_variant_count: number }>;
  };
  records: Finding[]; // stable IDs, type, tier|null, variant/GT, disease evidence OR discovery evidence
  pagination: { page: number; page_size: number; filtered_total: number };
}
```

Calculate the summary from the whole sample result, not the current page. Provide filtering/search/pagination server-side if responses grow. Preserve authorized private-source access; do not publish these sample-level artifacts or rely on frontend hiding.

## Joining to current variants and score sources

Normalize identifiers once in the ingestion layer: canonical sample ID removes only the documented terminal `_E38`/`_G38`, and variant IDs use an explicit genome build and normalized `chr:position:ref:alt`. Prefix/case normalization is not left alignment, multiallelic decomposition or liftover. Audit those differences separately.

Join findings to current variant annotations using **sample_id + gene_symbol + canonical variant_id**. Gene belongs in the evidence identity; a variant can affect multiple genes. Keep the classifier's GT as source evidence and compare it to current observed GT. Do not drop unmatched findings through an inner join. Return an explicit `matched / missing_in_current_variant_source / genotype_conflict` state and retain the classified record.

For the user-selected sample checked locally: **29 evidence rows**, Type 3 = 12 and Type 4 = 17, **10 distinct gene/variant pairs**, 26 distinct disease IDs. All 29 join to the current 418-row processed sample variant response with **zero GT conflicts**. This is a one-sample join check, not validation of the full release. The API lookup source and response stayed local/private; no private row values are included here.

## Acceptance checks and implementation sequence

1. Freeze the source manifest and resolve the Tier 1 caption/RCV-star contract. Preserve the original classifier release; do not silently update old results with current annotation.
2. Validate hashes, UTF-8 BOM handling, header-inclusive published counts, required IDs, allowed Type/Tier combinations, all 196,941 evidence identities and zero GT conflicts within the release.
3. Materialize canonical evidence records and aligned discovery arrays. Reconcile **all** sample/variant keys against the current variant release, recording unmatched and conflicting rows instead of dropping them.
4. Build sample coverage from the original input roster and unresolved reasons. Validate no-result states separately from missing data.
5. Publish the private API/index. Verify six Type counts and All totals use the same evidence-record unit; preserve multi-Type and multi-disease variants.
6. Replace the UI fixture adapter with explicit evidence records; implement disease and discovery detail variants, raw review statuses, unavailable MOI/score states and original cohort-fit explanation.
7. Add separately versioned disease scores only after confirming disease-profile mapping, eligibility, family exclusions, score reference and project comparison definitions.

The reproducible read-only audit is [audit_pb_prioritized_source.py](../scripts/audit_pb_prioritized_source.py); aggregate results are [pb_prioritized_findings_source_audit.json](pb_prioritized_findings_source_audit.json). Re-run against the frozen server files before an ingestion release:

```bash
python3 scripts/audit_pb_prioritized_source.py /private/path/to/frozen/source \
  --output /private/path/to/audit.json
```

Optional `--sample-id` and `--sample-variant-json` enable the exact current-response join check without printing private finding rows.

## Browser delivery revision: compact first page, detail on demand (2026-11-09)

The source is an audit/archive input, **not a browser payload**. It has 78 columns, 196,941 rows, 263,548,538 uncompressed TSV bytes and 19,049,147 gzip bytes. Preserve the frozen original privately; do not send it, the full association file or the unresolved file to the browser. Dropping fields from an API response is distinct from deleting the evidence needed for reproducibility.

### Lean serving model

1. Build a persistent private database/index offline. Index `(sample_id, type, record_id)` and the detail record ID. Requests must use the index; do not scan or decompress the entire release for each sample.
2. The first response contains the release ID, coverage state, six Type counts, total evidence/variant counts and **20 list records**. List fields are release-local record ID, numeric Type, gene, variant ID, GT, disease ID/name when applicable, and source label. Derive Tier from the explicit release contract or include its small numeric value; don't repeat long provenance strings per row.
3. A second endpoint fetches detail by stable record ID. Optionally include the first selected detail in the first response to save one round trip. Retrieve later detail only when a finding is selected; retain a bounded client cache keyed by release and record ID.
4. Server-side detail contains only the selected evidence, cohort-fit explanation, HPO overlap, real assessment state and relevant discovery groups. Full RCV summary arrays, original mapping notes and full source-row provenance stay server-side and are fetched through an explicit evidence drill-down only if needed.
5. Deduplicate shared disease names/aliases, variant annotations and source descriptors in the serving database. Retain all distinct evidence values and per-sample Type/context; payload reduction must not collapse different findings or alter counts.
6. Use HTTP compression and release-aware private caching. Querying/filtering another page should fetch only that page. Return exact counts separately from paged records; never download the full cohort to calculate the six buttons.

### Omit or defer from normal browser responses

| Source content | Serving treatment |
|---|---|
| All-row `phenotype_weighted_score=NOT_CALCULATED` | Omit repeated raw strings; expose one explicit score availability status. Omission is not score zero |
| Empty inheritance columns | Omit repeated empty columns; detail reports `not_assessed` plus `moi_not_ingested`. Preserve original columns in the archive |
| Repeated patient metadata, sex, affected, family | Use the sample header once; send only evidence-specific context in detail |
| `clinvar_rcv_*` summary strings repeating every RCV on each variant | Retain current evidence's RCV in detail; full multi-record summary only in optional drill-down |
| HPO labels repeated in mapping/category strings | Send IDs only when needed; use the frozen ontology label dictionary and fetch the full explanation on demand |
| `primary_*` / `cross_cohort_*` wide parallel arrays | Send normalized discovery objects only for a selected Type 5–6 record |
| Full unresolved rows / full 568,958-row association table | Backend/QC only; browser receives coverage/counts and selected evidence |
| Full input paths/hashes repeated per record | One response-level release ID; full manifest retained server-side |

The original content-hash ID may remain the durable backend identity. A short immutable release-local wire ID can reduce repeated bytes if the API also returns the release ID and the mapping is frozen; never treat a page-relative array index as a record identity.

### Measured projection, not a latency claim

For the checked sample's 29 evidence records, an offline list/detail projection measured:

| Response form | Compact JSON bytes | Gzip bytes |
|---|---:|---:|
| All 29 records with all 78 original columns | 97,491 | 5,125 |
| First 20 list records + Type counts/page envelope | 3,725 | 869 |
| First selected record's detail | 985 | 612 |
| First page with first selected detail embedded | 4,729 | 1,350 |

This compares response shapes with intentionally different detail/pagination scope, not lossless compression of the full source. Remaining records/details remain available on demand. One example is not a worst-case bound, and transfer/DB/browser latency has not been benchmarked. Measure an empty sample, each Type, a multi-disease sample, large discovery arrays and the largest sample result before setting a payload budget. Recommended initial budgets are configurable targets, not measured guarantees: compressed first page <20 KB and selected detail <10 KB where possible, with pagination for unusually large evidence arrays.

The all-row **list projection alone** occupies 36,064,964 uncompressed JSONL bytes versus 263,548,538 source TSV bytes. That excludes detail/QC/provenance storage and should not be advertised as total storage reduction. The principal browser optimization is sample-keyed access and delayed detail loading, not loading a smaller cohort-wide file.

Reproduce using [benchmark_pb_prioritized_payload.py](../scripts/benchmark_pb_prioritized_payload.py); aggregate measurements are in [pb_prioritized_payload_sizes.json](pb_prioritized_payload_sizes.json). The benchmark exports aggregate byte counts only and does not publish private sample rows.

## MOI clarification: intended comparison versus populated output

The user's interpretation of the intended model is correct: **disease MOI** (e.g. AD/AR) is separate from **the assessment of this sample's genotype against that disease MOI**. Both are also separate from rPheRS, which scores phenotype similarity.

The exact inspected release does not carry the inputs through:

- `parse_vcv_rcv_evidence()` explicitly creates `inheritance`, `inheritance_normalized` and `inheritance_status` as empty strings. `trait_set_evidence()` reads disease names and IDs, not MOI annotations.
- `load_known_gene_evidence()` also explicitly creates those inheritance fields as empty strings. The actual input header has nine columns (gene/source/qualifying/evidence type/value/disease ID/label/record/version), with **no MOI or inheritance-status columns**.
- The frozen tiering input header likewise has no MOI or inheritance-status columns.
- `inheritance_assessment()` contains a comparison framework. For **AD/AR it reuses a supplied `MATCH`/`MISMATCH` status** rather than deriving one from GT in that function. Its X-linked branch computes a result from MOI, sex and genotype, with review states. Since the loaders pass blank MOI, the release reaches `NOT_ASSESSED_NO_MOI` instead.

Therefore `NOT_ASSESSED_NO_MOI` means **MOI was not ingested into this calculation**, not that ClinVar/ClinGen/DDG2P/Orphanet lack disease inheritance information or that the disease has no inheritance mode. The distinction must be visible in the engineer handoff and UI availability text.

To populate this area later, prepare a separately versioned disease/evidence-specific MOI table (gene + disease/evidence identity + source/version), preserve multiple modes and unmapped/conflicting cases, then supply the approved assessment workflow with the inputs it actually expects. Do not attach one inheritance mode to a gene globally, and do not fill AD/AR status merely by adding an MOI label to this loader. Establish the upstream assessment-status source or extend/revalidate the backend assessment logic under a new version. Keep `moi_annotation_status`, `inheritance_assessment_status`, original GT and their provenance separate. Annotation/assessment enrichment must not silently change the frozen Type labels.

## Existing local disease-MOI enrichment located while recording this session

A later review of the existing Obsidian project records located a **pre-existing 86-column disease-MOI enriched derivative** of this release. The prior MOI availability statements in this handoff describe the server's **78-column classifier output and original genotype-assessment fields**, not every existing local derivative.

```text
/Users/kyuryung/Documents/BCH/99_2025_CRDC/tiering_20250806/six_type_20260817/six_type_classification.tsv
```

On 2026-11-09, file existence, all 86 headers and SHA-256
`b9986352e9992d4ff4c64c5787f322d71131af22f33a0fcc3416db5d02efe070`
were checked and matched the existing August 17 guide. That guide records that the original 196,941 rows / 78 fields were retained while adding eight `disease_inheritance_*` annotation columns. Full row-by-row equivalence was not re-audited during this discovery.

The eight extra fields are HPO IDs, labels, normalized MOI, matched disease IDs, annotation status, source, source version and source SHA-256. They were annotated from frozen HPOA/ClinGen/DDG2P/Orphanet data. **Review this existing derivative as the preferred MOI annotation source before rebuilding an annotation table.** Serve its compact MOI codes/status in selected detail and retain full source lineage on the backend.

The enriched disease annotation does not overwrite `inheritance_status` or establish this patient's genotype compatibility. The original `NOT_ASSESSED_NO_MOI` assessment can coexist with a populated `disease_inheritance_normalized`. Disease-specific rPheRS remains a separate unconnected calculation. Payload benchmarks above cover the server 78-column version; a compact detail including these additional MOI fields has not yet been measured.

Reference Obsidian record: `Projects/Browser_Paper_2025/Tiering_and_Phrank_Validation/2025_VCF_Six-Type_Result_File_and_Column_Guide_2026-08-17.md`.
