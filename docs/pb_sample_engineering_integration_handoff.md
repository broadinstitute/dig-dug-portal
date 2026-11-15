# PB Sample engineering integration handoff

Source delivery: [source delta/checksums against the baseline](pb_page_source_delivery_20261115.json). Use the Git commit containing this document together with its baseline dependencies; the checklist is not a standalone application or deployment record.

Updated: 2026-11-15 · Entry: `/pb_sample.html?query=<sample-ID>` · Vue 2.
Reference: the source commit containing this document, compared with baseline `859cd905d49e61f3a1e6765bb88ff0a2555c3128` on `kyuryung/bch-prototype`.
This is the implementation contract for test-server migration, not a deployment record. It supersedes the older Sample mockup/unconnected-source instructions.

## Test-server source first

The primary live data source is the test server's existing private BioIndex API: `http://100.80.30.199:5000/api/bio/query/<index>?q=…`, retaining authentication and all continuation pages. `samples-info` is queried by exact `SampleInVCF`; its `clean_name`/`investigator` remain authoritative. Current `gene-variants-crdc` supplies the Gene2/Variant membership universe. The pinned processed GT/overlap source below is a distinct, explicitly versioned derived-evidence dataset, not a replacement BioIndex universe.

The `/__pb_phenotype_profile__/…` paths below are prototype adapter contracts. Reuse the test server's existing cohort integration and implement the missing full-candidate/join responses there; do not point the browser at local Mac files. Historical Helen `analyze` top-30 matches and `top_phenotypes` over a displayed subset cannot produce complete Sample comparisons. Paths/hashes below describe backend preparation/reproducibility where an equivalent server materialization is required.

Linked single-gene burden views use different q families: Gene2 `q_by_gene`, Phenotype `q_by_hpo`, both before delivery filtering. Sample overlap tables do not calculate or substitute either q.

Latest shared changes: the common HPO-count adapter is also required by Phenotype/Gene2/Variant input validation (≥1 globally recorded sample, unknown/error distinct from zero). Sample's observed HPO display is not this Custom-input gate. Keep the current case-safe `ProjectComparison.vue` / `projectComparisonStats.js` imports. See [Phenotype](pb_phenotype_live_profile_and_spec_2026-10-16.md), [Gene2](pb_gene2_engineering_handoff_20261112.md), [Variant](pb_variant_engineering_integration_handoff.md) for their current screen contracts.

## 1. What to port

Port the page **and its Node gateway, Python profile service and private inputs** together. A static `npm run build` deployment alone does not install the `/__…__` server routes.

Runtime prerequisites: retain the existing Node/Vue dependencies; the gateway requires global `fetch` and `AbortSignal.timeout`. The Python environment must load NumPy/SciPy and the existing analysis modules imported by the profile service. Keep the existing Gene/Variant R environment separately. Dependency versions are not pinned by this handoff; verify imports and `/health` in the target service environment before connecting the UI.

| Layer | Required implementation |
|---|---|
| Sample UI | `src/views/PbSample/Template.vue`, `style.css`, `SampleHpoTree.vue`, `SampleVariants.vue`, `sampleEvidence.js`, `variantEvidence.js`, `tableSort.js`; retain the other existing Sample adapters/components |
| Comparison UI | `SampleComparison.vue`, `ProjectComparison.vue`, **`projectComparisonStats.js`**, `SamplePagination.vue`, `SampleInfo.vue`, `sampleInfoPosition.js`, `sampleHelp.js` in the same directory |
| Metadata | Existing `sampleRecord.js` and `pbSampleBioIndexAdapter.js`; shared Gene/Variant `samples-info` provider in `scripts/gene_carrier_summary_endpoint.js` |
| Gateway | `scripts/sample_match_projects_endpoint.js`, registered by `gene_carrier_summary_endpoint.js`; `vue.config.js` registration/proxies |
| Calculation | `scripts/pb_phenotype_profile_api.py`, `pb_profile_metadata.py`, `sample_overlap_index.py`; existing `pb_gene_context_api_server.py`, `rphers_fast.py`, `rphers_standardization.py` and their imports |
| GT installation | `scripts/prepare_pb_genotypes.sh`, `setup_pb_genotypes.py`, existing `build_pb_genotype_index.py` / processed-GT reader |
| Shared display | `public/index.html` first-paint 80% scale; existing Gene2/Variant fonts, navigation and help dependencies |

**New files are included in this delivery commit.** Carry the complete dependency set, including its baseline imports. `ProjectComparison.vue` must import explicitly with `.vue`; the helper is `projectComparisonStats.js`. Do not restore the former case-only `projectComparison.js` name: it caused module resolution failure on macOS.

## 2. Source contract

| Value | Authoritative source / rule |
|---|---|
| Top-card metadata, Project and Investigator; comparison labels | Private BioIndex `samples-info`, keyed by exact `SampleInVCF`; **Project = `clean_name`, Investigator = `investigator`**, same as Gene2/Variant. No local CSV substitution for displayed labels. |
| Sample identity | Honor an explicit `_E38`/`_G38` key; canonical requests try `_E38`, then `_G38`. Validate the returned ID. Strip only the terminal assay suffix for canonical joins. |
| Recorded HPO | Distinct `phenotypes[]` with `is_observed === true`; inferred ancestors do not increase this count. Candidate counts use shared metadata when available, otherwise the scorer's recorded terms. |
| Sample scoring/query | Approved 16,366 × 6,440 parent-expanded matrix plus matching metadata. Use the searched sample's **complete deduplicated `hpo_terms_raw`** profile; no first-10 limit. |
| Variant profile / shared counts | Frozen processed `sample_variant_gene.jsonl.gz` and its verified GT pack. This is nonsynonymous, DP ≥20, cohort AF <0.01, GRCh38; not genome-wide calls. |
| Prioritized findings | **Not connected live.** Fixture examples are allowed only with `?fixture=1`; never infer Tier/Type from the variant table. See [the existing source handoff](pb_prioritized_findings_data_handoff.md). |

The `samples-info.genes` list is not a list of variant calls or genotypes. Historical `gene-samples` must not replace current `gene-variants-crdc` membership or this pinned processed release. BioIndex and processed-release cohorts differ; their counts need not match.

## 3. Browser routes and gateway

All sample data routes remain private; retain the existing application authentication and BioIndex token scope. Never expose the Python service/internal join vector directly as a public API.

| Browser request | Server behavior |
|---|---|
| Private BioIndex `/__bioindex_private__/api/bio/query/samples-info?q=<SampleInVCF>` | Proxy to `BIOINDEX_HOST_PRIVATE` (current `http://100.80.30.199:5000`). Consume `/api/bio/cont?token=…` when present; retain access-token handling. |
| `POST /__pb_phenotype_profile__/sample-matches`, `{sample_id}` | Node handler calls private `/phenotype-analyzer-api/sample-match-inputs`; joins all candidate metadata through the existing source/auth-scoped provider; returns full candidate list and project summaries. |
| Same route, `{sample_id,candidate_id,gene_page:1}` | Comparison details; shared-gene page size five. Reject self/family, unknown candidates, invalid pages and nonshared genes. |
| Same route, `{sample_id,candidate_id,gene:"ABCA13"}` | Separate searched/comparison variant+raw-GT lists for that shared gene. No cartesian pairing. |
| `POST /__pb_phenotype_profile__/sample-variants`, `{sample_id}` | Proxy to `/phenotype-analyzer-api/sample-variants`: `sample_id, rows, data_version, scope, genome_build, complete_genome:false`. |
| `GET /__pb_phenotype_profile__/hpo-counts` | Proxy to `/phenotype-analyzer-api/hpo-counts`: aggregate parent-expanded counts. Also required by current Gene2/Variant HPO input validation. |
| Browser `POST /__pb_phenotype_profile__/sample-match-inputs` | **404**. Internal input vector is not the public browser DTO. |

Gateway implementation: `sample_match_projects_endpoint.js`. Register this handler **before** the generic profile proxy. Preserve request/sample-ID validation, `private, no-store`, timeouts and error states. Strip `_project_inputs` and `_reference_vcf_sample_id` before responding. Private backend default: `127.0.0.1:8093`, configured by `PB_PHENOTYPE_PROFILE_PORT`.

Summary fields: `sample_id`, `reference_hpo_ids`, `reference_hpo_count`, `reference_scores`, `eligible_sample_count`, `phenotype_scored_sample_count`, `genotype_comparable_sample_count`, `excluded_self_family_count`, `phenotypeMatches[]`, `projectPhenotypeSummary[]`, `overlap_source`, `overlap_error`, `rphers_standardization`.

Candidate fields: `rank`, `sampleId`, `matchedHpo`, `recordedHpoCount`, `rphersZ`, `residual`, `phenotypeStatus`, `sharedGenes`, `sharedVariants`, `genotypeStatus`, `project`, `investigator`, `age`, `sex`. Detail additionally returns `hpo_matches`, `reference_scores`, `candidate_scores` and shared-gene/variant details. Null/unavailable is different from zero.

## 4. Calculations and denominators

- Return **all nonfamily candidates in the matrix roster**, including candidates without phenotype scores. Exclude self and canonical BCH family-ID prefix matches (`BCH-YY-NNNNN`); a relationship label is not a family ID. No 50-person cutoff.
- Default order remains existing `rphers_fast.score_samples` residual descending; unscored candidates follow. Sorting applies to the full returned set, missing last in both directions; preserve original rank. UI pages contain five unpinned rows plus pinned rows.
- `Matched` = query HPO IDs present in the candidate's parent-expanded matrix / total reference query IDs. It is neither a proportion of the candidate's recorded HPO count nor a weighted genetic similarity.
- Existing score: IC-weighted binary matches, residualized on total expanded HPO count, then Z standardized using full scoring-cohort mean/sample SD **before** family exclusion. `reference_scores` exposes the searched sample's own row from the same scorer; do not refit for that display. No disease probability or new combined genetic/phenotype score.
- `Shared genes` = distinct genes with processed evidence in both samples, even if variants differ. `Shared variants` = identical chromosome/position/REF/ALT present in both, deduplicated across gene annotations; GT need not match. Missing reference/candidate source means null, not inferred zero. These are evidence intersections, not genome-wide genetic similarity, pathogenicity or a validated similarity ranking.
- Project summary row `n` is **Scored n**; median/IQR use scored residual PheRS. Project expansion includes **all project candidates**: coverage, available-value medians/IQR/available-n, matched-HPO distribution with Unavailable, and member list. Distribution percentages use all group members; quartiles use linear interpolation. Do not switch these denominators silently.

## 5. Display contract

- Top card: sample ID, family state, affected, sex, age, Project/Investigator, recorded HPO count and dominant HPO group. No variant count beside/under the sample name.
- `Phenotype profile`: full-width clean hierarchy; no blue band; thin branch guides end at the last child. Names expand, HPO IDs link to `/pb_phenotype.html?query=…`. Explanations belong in superscript i help.
- Similar profiles: Samples and Projects views, numbered pagination, sample pins. Searched IDs use yellow text highlighting; comparison IDs green, consistently in headers and variant lists. Candidate detail shows **matched HPOs only**, five per page with ‹/›. Show searched and comparison rPheRS Z from the same query/reference.
- Gene chevron/name button expands; a separate `Gene page ↗` link opens `/pb_gene2.html?query=…` in a new tab. Do not make the expansion button navigate. Each sample's variants stay in its own labeled list.
- `Variant profile`: five rows/page; Gene / Variant / Consequence / Score source / In silico score / ClinVar / CRDC AF / GT. Keep compact header padding and readable fonts; consequence may wrap. Footer **`1–5 of 440 variants / 420 genes`** (dynamic totals, bold count). No repeated scope paragraph, subtitle, `5 per page`, or duplicate top-card totals.
- Source labels: LoFTEE / AM / REVEL / None. Numeric score = LoFTEE HC 1, otherwise AlphaMissense, rounded to two decimals. REVEL-only `—*`, missing `—`; REVEL is not added to this burden score. **Do not multiply the displayed annotation score by GT**. Example `chr2:21006574:G:C`, GT `1/1`, raw AM `0.073` → `0.07`, not `0.146`.
- Superscript help: processed scope, Gene/GRCh38, predictor names/reference limitations, raw score/GT, matched/recorded HPO and rPheRS definitions. Position help below its icon using side margins at 80% scale; avoid mount-time zoom/layout jumps.

## 6. Private inputs and startup

**Approved GT download path only:**

```text
/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/sample_variant_gene.jsonl.gz
```

Release `2025_crdc_16366_dp20_af001_20260907`; gzip SHA-256 `e602b847ccdba8961f788701b43004514346490f55164dd3023be23aa7c6bbc7`.
Default private cache relative to checkout:

```text
.pb-private-data/genotypes/shared/2025_crdc_16366_dp20_af001_20260907/
  sample_variant_gene.jsonl.gz
  index/manifest.json
  index/genotypes-06622cb5e148898fdf28de90ed6fb98b0de3d4e3dfa26ab5e011c0e3b6f051fb.bin
```

Packed SHA-256 is the hex in its filename. Installer verifies source/pack; overlap loader verifies pack and source release. Explicit source overrides must also be this verified release. The sample-variants response's release label alone does not prove a substituted file's contents.

| Setting | Test-server requirement |
|---|---|
| `BIOINDEX_HOST_PRIVATE` | Existing authenticated private BioIndex; current `http://100.80.30.199:5000`. |
| `PB_PHENOTYPE_HPO_MATRIX` | Durable copy of approved **16,366-sample** matrix; SHA-256 `bf3b5e45bb7b2f08cc33b96947fd11025671ec87d62f075d8eb5aee730db08d1`. Do not substitute Gene2's 15,764 matrix. |
| `PB_PHENOTYPE_METADATA` | Matching approved metadata. Reader requires `sample_id, age, sex, affected`, preserves `hpo_terms_raw`/VCF IDs. Current local TSV has the wrong schema and falls back to sibling XLSX `#xl/worksheets/sheet1.xml`. Configure that verified XLSX directly or a validated equivalent TSV; copying the existing TSV alone is insufficient. |
| `PB_PHENOTYPE_COHORT_MAPPING` | Verified `samples-info-projects.jsonl` snapshot. Do not use legacy `Cohort mapping (8).csv` as replacement for live Sample Project/PI. Gateway labels remain authoritative. |
| `PB_GENOTYPE_INDEX` | Verified index above; launchers discover/install the persistent default. Old `/private/tmp/pb-genotype-index-20261113` is not a portable path. |
| `PB_SAMPLE_VARIANT_SOURCE` | Original pinned gzip. Explicit env/CLI wins; otherwise gzip beside GT index if present, then persistent shared cache. The pack alone cannot supply Sample annotation rows. |
| `PB_PHENOTYPE_PROFILE_PORT` | Default 8093; configure matching gateway target. Run one service per listener. |

Existing local startup (requires this checkout's private HPO/metadata/precomputed inputs):

```sh
PHENOTYPE_ANALYZER_HOST_PRIVATE=http://127.0.0.1:8092 \
NODE_OPTIONS=--openssl-legacy-provider \
npm run serve:pb-phenotype
```

`serve_pb_phenotype_local.sh` sets local input defaults, sources `prepare_pb_genotypes.sh`, then serves frontend 8098 (a busy port can increment). First GT preparation uses the caller's existing SSH access (`PB_GT_SSH_HOST`, default `e3`) to the approved share; valid caches work offline. `PB_GT_AUTO_DOWNLOAD=0` disables new downloads. No private `/ref/` fallback; users without company access cannot download a fresh private source. This startup does not download/install the HPO matrix, metadata or precomputed association files.

For migration, override machine-specific paths with durable private paths. Port the existing route registration to the actual application server, start `python3 -m scripts.pb_phenotype_profile_api --hpo-matrix … --metadata … --cohort-mapping … --sample-variant-source … --port 8093` (same approved data), and reverse-proxy only the documented routes. Keep the existing Gene Context 8092 and scoped Variant 8095 services distinct. Keep data, GT packs, snapshots and captures outside Git/public assets.

Annotation provenance used by help is recorded in `src/views/PbGene2/referenceProvenance.js`: VEP 115.1/cache 115, GRCh38.p14/GENCODE 49, ClinVar GRCh38 VCF 2025-08-24, gnomAD exomes 4.1. AM/REVEL release IDs and original download dates, and the LoFTEE commit, are **not recorded**; November 12 is provenance review date, not a download date.

## 7. Acceptance and known limits

1. Load `BCH-24-03906-01`: identity matches, Project=`Primary Immunodeficiency`, Investigator=`janet_chou`; hierarchy and linked HPO IDs preserve observed/parent distinction.
2. Summary returns all candidates, not 50; private join fields are absent. Reference/candidate IDs must match requests. Validate auth-scoped metadata and unavailable states.
3. Check both sample/project expansion, five-row pages, pins, searched/comparison highlights and separate variant lists; clicking expansion must not navigate.
4. Check same release/hash on all inputs; a missing comparison sample is unavailable. Check dosage-free score, raw GT, count footer and help placement.
5. Repeat after restart with the persistent cache; confirm no dependency on temporary paths and no duplicate 8093 listener. HTTP 200 alone is insufficient: compare IDs, counts, scope and source metadata.

Previously verified local evidence (not production constants): searched sample has 440 variant-table rows / 420 genes, 16,363 nonfamily candidates, 8,182 phenotype-scored and 16,340 processed-evidence candidates (23 unavailable). Reference Z=16.868440600716905; first candidate Z=15.987602823365746. Primary Immunodeficiency expansion: 951 total, 525 phenotype-scored, 951 with processed evidence. Last recorded full-response timing after restart: 16.78 s first / 4.47 s repeat, ~5.33 MB; this includes startup/metadata/HTTP, not just compute. Production latency and complete latest visual QA remain to be checked after migration.

Relevant checks (run on the delivered code, not as proof of server deployment):

```sh
node scripts/test_sample_match_projects_endpoint.js
node src/views/PbSample/sampleComparison.test.js
node src/views/PbSample/projectComparison.test.js
node src/views/PbSample/sampleVariants.test.js
node src/views/PbSample/variantEvidence.test.js
node src/views/PbSample/tableSort.test.js
node src/views/PbSample/sampleInfoPosition.test.js
python3 -m unittest scripts.test_sample_overlap_index scripts.test_pb_sample_analysis scripts.test_pb_profile_metadata scripts.test_setup_pb_genotypes
```

Related: [Gene2 specification](pb_gene2_engineering_handoff_20261112.md), [Variant handoff](pb_variant_engineering_integration_handoff.md), [shared source contract](pb_front_gene_variant_merge_handoff.md). Detailed local/server paths and catalog build timestamps are in the existing Obsidian `PB_BioIndex_Processed_Data_Handoff_2026-09-07` and `PB_Sample_Prototype_Handoff_2026-08-20` notes. Their historical sections are not deployment instructions.
