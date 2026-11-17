# PB Front, Gene2, Phenotype, Variant and Sample — integration starting point

For a colleague trying the prototype, use the [local installation guide](pb_local_browser_setup.md). `npm run setup:pb-runtime` downloads the approved release through the user's own company SSH access, verifies the repository's pinned checksums, builds the GT index and writes local settings. Private inputs remain outside Git. Trial users should not edit scripts or follow test-server migration instructions.

## Local maintenance after `f44f9dada` — 2026-11-17

Redundant and obsolete comments were removed; the five pages' design, behavior, API and calculation contracts below are unchanged. Carry the updated `scripts/test_pb_gene_context_ui.py` with the source: its fixture-isolation check now uses a function boundary instead of a removed comment heading. This maintenance is included in the commit containing this note; it does not establish target-server deployment.

## Local trial packaging review — 2026-11-17

1. The source audit measured 54.45 MiB before cleanup. The unused `KrClinicalFocus/portalDiseaseReferenceData.generated.js` had no consumers and was removed after a private rollback backup; existing tracked content is now about 41.59 MiB. Full frontend build and Front reference/availability checks passed. Keep the actively imported ontology, annotation and disease references.
2. Full local Git packs occupy about 1.15 GiB; a shallow single-branch checkout of `461a2dd50` measured about 69 MiB including Git metadata. Use the shallow-clone command in the trial guide. Do not rewrite shared history to reduce a trial download.
3. `node_modules`, private inputs and scratch output are excluded from Git. The current installed dependencies are about 494 MiB excluding about 1.4 GiB of regenerable build cache. No existing `node_modules` or build cache needs to be bundled.
4. SSH launchers accept `PB_CONTEXT_SSH_HOST` (default `e3`), detect the compute username from that login, and allow `PB_CONTEXT_COMPUTE_USER` as an override. Trial mode `PB_CONTEXT_ALLOW_SUBMIT=0` only reuses an existing job; stopped jobs produce a maintainer instruction. The existing maintainer default remains submit-enabled. Eight mocked connection tests passed without contacting HPC or submitting jobs.
5. Runtime packaging is implemented in `scripts/setup_pb_runtime_data.py` and `configs/pb_runtime_data_manifest.json`: 15 approved files, 885,821,510 bytes, from `share/dig-dug-portal/prototype_runtime_data`. Server files are group-readable (0640), directories 2750, group `rc_rc-data-science_gnomad-e2`; parent-directory/e3 access is also required. The installer reuses verified local files, retains interrupted downloads, verifies every file before replacement, generates private `local.env`, and uses the downloaded GT source to build the index. Metadata points directly to the approved XLSX, not the incompatible same-named TSV. No raw records, installed dependencies, preparation files or developer backups are added to Git.
6. The guide covers Python/npm installation and two terminals (shared-service connection, then local browser). Generated settings select trial mode without job submission and detect the user's own compute login. Maintainers still provide access and keep the shared service running; a second user's fresh-PC login/service access has not been tested. A clone alone does not include data or dependencies.
7. Validation: the installer downloaded the two missing input files from e3, verified all 15 files, generated local settings, and reused the verified GT index. A subsequent `npm run setup:pb-runtime -- --verify-only` passed. Seventeen installer/SSH tests cover retries, checksum failures, private-path protection, shell quoting, existing configuration preservation, own-user tunnels, and no job submission in trial mode. The frontend build passed after source cleanup; a complete fresh-PC npm/Python installation and a second user's live service connection remain untested.

## Current correction after `47d7159c6` — Variant regression and profile input

**Use the [current Variant correction](pb_variant_engineering_integration_handoff.md#current-correction--shared-genevariant-regression-2026-11-16) before older genotype-scope instructions.** Variant and the Gene2 variant-evidence table share the same adjusted carrier-versus-noncarrier OLS and full scoring-cohort reference. GT All must agree across pages. A genotype subset changes the carrier group; retain eligible noncarriers and exclude unselected carriers entirely. Carrier-only regression/reference was an implementation error, not intended behavior.

Carry the changed Python API/engine **and** Variant model/template/help, shared `PbGene2/ProfileInput.vue`, and tests. The response must distinguish selected-carrier IDs from the larger fitted cohort through comparison/reference metadata; reject the old carrier-only response. The shared autocomplete now anchors under its input and scrolls internally. Preserve all five pages' design rules below.

Status: the commit containing this document delivers this correction **after `47d7159c6`**, with its source and tests; the earlier manifest does not cover it. The isolated prototype Variant API was backed up, updated and restarted; there was no production portal deployment, new data release or change to Gene/Sample services. API/engine/OLS tests passed (29 Python); Variant layout/history/statistics and Gene2 checks passed (four JavaScript commands). Live examples and a genotype subset passed Gene/Variant parity/control checks; the user confirmed the screen. Full target migration acceptance remains separate.

## Required design fidelity — all five pages

**All engineer-facing documentation and AI implementation instructions must be written in English.**

**Implement the user's existing prototype as designed. The current Vue templates, CSS, shared components and assets are the visual and interaction specification for Front (including Front2), Gene2, Phenotype, Variant and Sample. Port them together; do not redesign or substitute generic framework styling.**

- Preserve typography, font weights, colors, borders, radii, spacing, widths, card/table order, alignment, icons, pagination and responsive behavior. Preserve selected, hover, focus, expanded, loading, empty and error states and the existing Guide/help placement.
- Load the prototype's fonts, icons, assets and page/shared CSS; prevent the destination site's global CSS or component defaults from overriding them. Match the rendered styles, not just the text and data.
- Use the current source and the latest page contract together. Adapt server/data integration behind the UI while preserving the designed markup, classes and behavior. If a framework migration requires different markup, reproduce the same rendered result and interactions.
- Compare prototype and target screenshots at the same viewport, zoom, query and UI state for **each of the five pages**. Check search/filters, selection and expansion as well as the initial screen. Fix visual differences before declaring UI implementation complete; a build or API response alone is insufficient.

### Latest delivery after `54cfec6e2` — 2026-11-16

Committed delivery `47d7159c6` follows baseline `54cfec6e2` and includes Front search, Phenotype refinements/export-only changes, their tests and all five English page contracts. Use its complete history plus the later correction delivered with this document on `kyuryung/bch-prototype`. `54cfec6e2` and the November 15 manifest alone are incomplete. Git delivery does not establish target-server deployment. Older delivery statements below refer to their earlier snapshots.

| Page | Current contract |
|---|---|
| Front / Front2 | [Front contract](pb_front_engineering_handoff_20261116.md): only CRDC-available HPO suggestions, validated paste/submission, multi-HPO default All (AND). |
| Gene2 | [Gene2 contract](pb_gene2_engineering_handoff_20261112.md): preserve current layout, scoring availability labels and GT integration. |
| Phenotype | [Latest search/refinement delta](pb_phenotype_live_profile_and_spec_2026-10-16.md#2026-11-16-search-refinements--latest-local-delta): Includes/Without + IDs under Limited to, stronger colors, return to search conditions after +/−, Export only. Preserve the accepted result layout. |
| Variant | [Variant contract](pb_variant_engineering_integration_handoff.md): retain the blue Genotype selector and exact-ID GT fix; apply the latest shared Gene/Variant regression correction. |
| Sample | [Sample contract](pb_sample_engineering_integration_handoff.md): retain the two comparison tables and final short blue dashed separators. |

Delivery audit: all five current page contracts, this common guide and the legacy engineering entry contain no Korean text; their local file links were checked. Thirteen targeted JavaScript test commands passed across Front/Front2, shared HPO availability, Phenotype, Gene2, Variant and Sample comparisons. The complete frontend build passed with the existing LocusZoom/tabix-reader export warning. The Gene2 test now includes its missing Guide component stub. Target-server adapters, private inputs/authentication and five-page visual acceptance still require verification after migration.

## November 16 review of all four pages

Reviewed the latest page contracts and current source against delivered HEAD `306ded0b8a1c585e067bc56cd8bec71a1c93e713`. **November 16 changes are included in this Git delivery; test-server deployment remains pending.** The November 15 source manifest is an earlier snapshot; it does not contain these additions. Use the current page-specific sections below and the complete commit, including all listed new imports. No new API/data release or statistical model is introduced by this documentation review.

| Page | Current delta to implement | Authoritative detail |
|---|---|---|
| Phenotype | Final full-width Hierarchy / separate Table layout; category/query filters; disease Rank evidence; carrier ratio/Fisher 2×2 help. Keep the latest accepted layout. | [November 16 Phenotype](pb_phenotype_live_profile_and_spec_2026-10-16.md#2026-11-16-results-ui--current-local-follow-up) |
| Gene2 | Persistent verified scoring inputs; Excluded / Unavailable / measured 0; shared GT boundary/cache fix. | [November 16 Gene2](pb_gene2_engineering_handoff_20261112.md#2026-11-16-gene2-follow-up--current-local-contract) |
| Variant | Blue Genotype control; exact GT request/cache fix; selected-carrier display with noncarrier regression controls and a full-cohort scoring reference. | [Current Variant correction](pb_variant_engineering_integration_handoff.md#current-correction--shared-genevariant-regression-2026-11-16) |
| Sample | Above Shared genes, Identical variants and Same gene/different variants: final **short blue dashed** dividers, `1px dashed #527abd`. No orange or long-dash gradient. | [November 16 Sample](pb_sample_engineering_integration_handoff.md#2026-11-16-sample-follow-up--current-local-contract) |
| Shared local runtime | Managed Ctrl+C cleanup, fixed frontend port, project-scoped stop/status; retain scoring and GT preparation. | [Local lifecycle](#local-development-lifecycle--2026-11-16) |

Required new runtime sources include `scripts/pb_local_server.py`, `scripts/prepare_pb_gene_scoring.sh`, `PbPhenotype/ProjectPhenotypeTree.vue`, `DiseaseRankDetails.vue` and `diseaseRankEvidence.js`, plus their existing imports. Ship the new lifecycle/GT-request tests too. `CohortPhenotypeTree.vue` is an unused intermediate layout, not an import of the final page; do not wire it into the accepted Hierarchy. Preserve shared HelpTooltip/InfoRail optional-table defaults for other pages.

Verification is page-specific: keep the recorded passed checks and unresolved final visual/target-server acceptance in each contract. Local lifecycle tests passed 8 cases; Sample template/CSS parsing passed. Before this Git delivery, the complete frontend build and 9 targeted JavaScript test commands passed, as did all 8 local lifecycle tests. No new catalog acceptance or deployment is claimed. Existing LocusZoom/tabix-reader and proxy `util._extend` warnings were diagnosed, not fixed by the lifecycle work.

## Current integration map — 2026-11-15

The four-page implementation, required adapters, tests and handoffs are committed and pushed as `cea55b953fd21068301168ff666b61db8f44ae98` on `kyuryung/bch-prototype`. Use the later delivery commit containing this document for the shared Guide, scale, Phenotype help and Sample comparison updates; Git delivery does not establish test-server deployment. Use the current per-page contracts first: [Phenotype](pb_phenotype_live_profile_and_spec_2026-10-16.md), [Sample](pb_sample_engineering_integration_handoff.md), [Gene2](pb_gene2_engineering_handoff_20261112.md), [Variant](pb_variant_engineering_integration_handoff.md). The collapsed material below is historical provenance, not current implementation instructions. Do not merge its old field/model/layout rules into the current contracts.

## 2026-11-16 Phenotype results follow-up — local working tree

The [current Phenotype contract](pb_phenotype_live_profile_and_spec_2026-10-16.md#2026-11-16-results-ui--current-local-follow-up) records the final overview hierarchy/Table layouts, query/category filters, disease Rank evidence and carrier ratio/Fisher help. These edits follow baseline `306ded0b8` and are included in this Git delivery; no test-server deployment is claimed; the November 15 source-delivery manifest covers the earlier delivery only. Do not apply older result-layout bullets over the November 16 contract. Shared Gene2 help now accepts an optional 2×2 table; existing text-only consumers retain their behavior.

## 2026-11-16 Gene2 / Variant follow-up — local working tree

Follow the new [Gene2 delta](pb_gene2_engineering_handoff_20261112.md#2026-11-16-gene2-follow-up--current-local-contract) and [Variant delta](pb_variant_engineering_integration_handoff.md#2026-11-16-variant-follow-up--current-local-contract): persistent verified Gene scoring inputs, **Excluded / Unavailable / 0**, the larger Genotype control, and exact-ID/failed-cache GT fixes. These follow `306ded0b8` and are included in this Git delivery; test-server deployment remains pending; the November 15 manifest does not include them. Include new `scripts/prepare_pb_gene_scoring.sh` and `scripts/test_pb_variant_genotype_request.js` with the modified source. Current launchers also require the separately documented `pb_local_server.py`. Preserve the Phenotype update above and existing model/q/source contracts. Final browser and target-server acceptance remain required.

| Role | Current source / boundary |
|---|---|
| Default gene navigation | `/pb_gene2.html?query=…` |
| **Primary live API** | **Test-server BioIndex** `http://100.80.30.199:5000/api/bio/query/<index>?q=…`; preserve authentication, query keys and all continuations |
| Gene2/Variant carrier universe | BioIndex `gene-variants-crdc`, with all continuations; **not historical `gene-samples`** |
| Gene2/Variant/Sample Project, PI | Same private BioIndex `samples-info`: `clean_name`, `investigator` |
| Processed GT / Sample variant rows / all-candidate shared evidence | Pinned approved-share release below; Sample overlaps are evidence counts, not a new similarity score |
| Original-VCF supplementation | Variant exact-target missing GT only; separate provenance/service in Variant handoff |
| Sample profile and common HPO availability | Private profile service 8093, 16,366 × 6,440 matrix; `/__pb_phenotype_profile__/hpo-counts` now also required by Gene2/Variant |
| Gene2 scoring/n_terms | Approved 15,764 × 6,440 matrix and matching covariates; do not substitute Sample matrix |
| Variant analysis | Dedicated Context service 8095; selected carriers versus eligible noncarriers, full scoring reference; echo carrier selection and fitted-group counts |
| Single-gene burden q | Same tests: Gene2=`q_by_gene` over HPOs for a fixed gene; Phenotype=`q_by_hpo` over genes for a fixed HPO. Both precede P<0.05 delivery filtering; beta/p/N unchanged. |
| Current association API gap | Live `gene-hpo15` is top-15 with HPO-wise q. Complete P<0.05/Gene-wise-q and efficient HPO-key lookup need the server API/index connection; do not claim already deployed. |
| Prioritized findings | Not connected live; do not infer Type/Tier in the browser |

BioIndex GET `:5000/api/bio/query/gene-variants-crdc?q=…` and Helen POST `/phenotype-analyzer-api/gene-variants-crdc` are different contracts despite sharing a name. Do not redirect the whole prototype analysis base to the latter. Private sources are not bundled in static assets or Git. Exact paths/build timestamps/checksums are maintained in the existing Obsidian source handoff.

## 2026-11-16 Front multi-phenotype search — local follow-up

Front (`pb_front.html` / `pb_Front.html`) and Front2 now validate phenotype selection and submission using the existing shared `/__pb_phenotype_profile__/hpo-counts` service. Show an HPO suggestion only when its count is at least one; omit zero/absent/unchecked HPOs before ranking and limiting the results. Keep selection guards and reject unsupported pasted IDs before navigation. Show counts for available HPOs and provide retry after service failure. Keep the complete input for correction; do not silently drop a term.

Resolve accepted names/aliases/selected labels to deduplicated HPO IDs and navigate to `/pb_phenotype.html?query=<IDs>&match=all`. Multi-HPO searches require every included term (AND). Gene/Variant navigation and Front2's Sample exclusion retain their existing behavior. The screenshot's `HP:0010010` was absent from the live analysis HPO set; switching matching mode alone cannot make it searchable.

Carry both Front templates, `PbFront/searchModel.js`, new shared `PbFront/phenotypeSearch.js`, and new `scripts/test_pb_front_phenotype_availability.js`. The new test and existing Front/Front2 routing and shared availability tests pass; both templates/CSS compile. Chrome confirmed unsupported input stays on Front and an available Seizure + Hypotonia search opens All (AND), with 553 matching samples in the checked source. These changes follow baseline `54cfec6e2` and are included in the commit containing this document; the earlier delivery manifest does not cover them. Verify the final input/dropdown behavior and an available multi-HPO AND search in the target browser. See the [Front contract](pb_front_engineering_handoff_20261116.md).

## Delivery boundary and outstanding server work

- **Code:** use the commit containing the current correction at the top, with its full history/dependencies including `47d7159c6`. The November 15 manifest covers an earlier snapshot; it does not certify the current correction or a deployment.
- **Five current contracts:** follow the linked Front, Gene2, Phenotype, Variant and Sample documents. The legacy Gene document and collapsed history are reference material, not additional current page specifications. The old file checklist is an inventory, not current implementation instructions.
- **Primary source:** retain the existing test-server BioIndex/authentication. Private paths and local ports describe reference preparation; configure equivalent private server services, never browser access to developer files.
- **Required server integration:** connect the complete approved burden release with both q fields and efficient HPO lookup; implement the HPO-count and full Sample comparison adapters; configure the documented private scoring/GT inputs and service routes. These are explicit migration tasks, not features already proven deployed.
- **Completion evidence:** the delivered source passed the frontend build, 23 JavaScript test commands and 38 Python tests. The build has the existing locuszoom/tabix-reader export warning. Test-server acceptance in each page contract is still required after integration; a Git push or successful static build alone is insufficient.

## 2026-11-15 UI delivery — Guide, margin help and Sample comparison

This delivery includes the shared Guide/PDF preview, default 100% scale, Phenotype margin help, and Sample two-table comparison with rank help and accessible disclosure controls. It follows implementation `cea55b953` and documentation `ddf455104`; use the full commit containing this document, not only those earlier commits. The [source checklist](pb_page_source_delivery_20261115.json) records shipped file hashes and required baseline sources. Private backup, QA screenshots and authoring/scratch directories are deliberately excluded; the actual served Guide PDF and preview are included under `public/guides/`. Git delivery is separate from test-server deployment.

No API, BioIndex index/build, private data release, model, q family or carrier definition changed in this UI update. Keep the test-server BioIndex contract above. The subsequently selected Sample two-table shared-evidence mockup is now implemented locally inside the existing expansion; see the Sample contract. It replaces the rejected nested-expansion proposal, retains the same backend APIs, and is included in this delivery.

## Shared Guide popup

Front (`pb_front.html`, its uppercase alias and `pb_front2.html`) shows a Guide thumbnail at the upper right. Gene2, Phenotype, Variant and Sample show a compact Guide button in a reserved right gutter. All use `src/components/pb/PortalGuide.vue` and the same static `/guides/quick_guide_en.pdf`; ship `public/guides/quick_guide_en.pdf` and `quick_guide_en_preview.png` with the frontend. The preview is rendered from that exact PDF. No private data API is needed to open it.

The five current pages (including Front aliases) now start at 100% CSS scale. The Guide gutter stays reserved; browser zoom remains under the user’s control. Legacy prototype entries retain their previous scale.

The component uses a native modal dialog with an embedded PDF, an Open PDF fallback, close button, Escape/backdrop dismissal and focus restoration. It compensates for the existing prototype zoom; retain the reserved gutter so the trigger does not cover result tables. To update the guide, replace the public PDF and regenerate its preview together. The `output/pdf/` authoring directory is not a runtime dependency. The selected source is `output/pdf/crdc-first-visit/quick_guide_en.pdf` (not the similarly named `crdc_quick_guide_en.pdf`); the served copy must match it byte for byte. The deployed URL is `/guides/quick_guide_en.pdf`, never a local filesystem path. Serve it as `application/pdf` and permit the same-origin PDF frame under the deployment CSP.

Required shared files are `PortalGuide.vue`, both `public/guides/` assets, `public/index.html`, the six Front/Front2/Gene2/Phenotype/Variant/Sample `Template.vue` imports, and the associated page styles. Phenotype additionally requires `ResultInfo.vue`, the shared Gene2 `HelpTooltip.vue` / `InfoRail.vue` / `infoRailPosition.js`, and its result styles. Keep the InfoRail prop defaults for existing Gene2 consumers; Phenotype selects its own shell/card and reserves 92px for the outer Guide strip.

Validation: the local desktop Guide was checked on all six entries for PDF URL, modal opening/closing, Escape/backdrop, focus restoration and gutter separation. Phenotype superscript/margin alignment passed at 1440px and 1980px. The margin-layout checks held API requests pending to isolate UI geometry; they are not a fresh data or backend acceptance test. Scale, Gene2 information-rail, Sample information-position and single-HPO tests passed. Production build passed with the existing locuszoom/tabix-reader warning. Repeat deployed static-asset/CSP/modal checks on the target server after integration.

## Local development lifecycle — 2026-11-16

This is a **macOS/Linux development launcher**, not the production service supervisor. Carry `scripts/pb_local_server.py`, `scripts/test_pb_local_server.py`, both `serve_pb_*` launchers, `package.json` scripts and the scoped `PB_LOCAL_SERVER_PORT`/portfinder guard in `vue.config.js`. Retain `prepare_pb_gene_scoring.sh` and `prepare_pb_genotypes.sh` in the launch sequence. The launcher validates inputs first; it does not install private scoring data.

- One managed launcher per checkout. Vue and its spawned local APIs run in a process group owned by the launcher. Ctrl+C/TERM/HUP cleans the group; a stuck child is terminated after a three-second grace period. Normal frontend exit also cleans its API descendants.
- An occupied frontend/local API port stops startup; do not silently advance 8098→8099→8100. `PB_LOCAL_SERVER_PORT` is internal to the managed launch, not a user data/API setting.
- `npm run stop:pb` discovers recognized Vue/Profile/Context processes by **exact checkout working directory**, including servers started before this helper; `npm run status:pb` lists remaining local processes. Do not replace this with broad `pkill node/python` or hard-coded PIDs. Runtime lock: `<repo>/.pb-private-data/runtime/local-server.lock` (private, ignored).
- SSH tunnels and remote Slurm jobs are independent. `stop:pb` leaves them available; closing a tunnel does not cancel a remote job. Keep the tunnel terminal open while using the UI. Production operators must manage deployed services with their own supervisor.

Terminal 1 (unchanged):

```sh
cd /Users/kyuryung/Documents/github_dir/dig-dug-portal-bch-prototype
bash scripts/start_pb_context_demo.sh
```

Terminal 2 (clear legacy local servers once or before restarting):

```sh
cd /Users/kyuryung/Documents/github_dir/dig-dug-portal-bch-prototype
npm run stop:pb
PHENOTYPE_ANALYZER_HOST_PRIVATE=http://127.0.0.1:8092 \
NODE_OPTIONS=--openssl-legacy-provider \
npm run serve:pb-phenotype
```

No manual `/private/tmp` GT setting is required: verified persistent GT cache discovery/preparation remains in the launcher. After Ctrl+C, `npm run status:pb` should report no local frontend/API for this checkout. Validate with `python3 -B -m unittest scripts.test_pb_local_server`: stuck API cleanup on SIGINT/TERM, orphan cleanup, port collision, command/PID ownership and another-checkout protection. The developer-local port/path examples are not fixed production URLs or release versions.

## Implementation order for an AI-assisted migration

1. Read the four current per-page documents above and the source registry; establish the actual target BioIndex API/release first.
2. Use the commit containing the [source delta/checksums](pb_page_source_delivery_20261115.json) and its declared baseline dependencies, including the new helpers. Merge application routes; do not replace the portal configuration wholesale.
3. Use existing test-server BioIndex for live rows. Add the documented private aggregates/lookup adapters where the current response is insufficient. Local file/cache paths are reference backend provenance, not browser data sources.
4. Verify both q scopes, cohorts, complete pagination, exact IDs, units and null handling. Do not fit new models or adjust q merely to connect a display.
5. Run target-server acceptance including auth/restart/source version. Record actual deployment evidence separately from local tests and Git state.

<details>
<summary>Historical implementation/source notes — not the current four-page contract</summary>

## Shared carrier GT source — 2026-11-13

Use the approved shared `sample_variant_gene.jsonl.gz` for exact per-sample GT
(distribution path corrected November 14, 2026):

```text
/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/sample_variant_gene.jsonl.gz
```

SHA-256: `e602b847ccdba8961f788701b43004514346490f55164dd3023be23aa7c6bbc7`.
Release: `2025_crdc_16366_dp20_af001_20260907`; GRCh38; nonsynonymous,
DP ≥ 20, cohort AF < 0.01. Full-file counts verified on November 13:
16,343 samples; 19,152 gene identifiers (19,090 symbols + 62 Ensembl fallbacks);
1,659,133 unique exact variants; 11,403,462 sample × gene × variant rows;
138,299,457 compressed bytes. This is a filtered release, not a complete VCF.
The files and handoff instructions are recorded as prepared; actual receipt or
production ingestion by Helen is not established by that record.

For distribution and automatic downloads, use only the shared directory above;
do not use a private reference-directory fallback. The shared copy's size and
SHA-256 were rechecked on November 14 and match this pinned release. The current
Gene/Gene2 startup/cache contract is in the existing
[current Gene2 server setup](pb_gene2_engineering_handoff_20261112.md#6-files-and-server-setup).
Variant delivery and later local changes are tracked separately in the Variant handoff.

### Runtime wiring

- **Gene / Gene2 / Variant:** `pbGeneBioIndexAdapter.js` requests
  `GET /__pb_gene_genotypes__?gene=GJB2`. The private endpoint reads the processed
  GT source and returns only exact variants and samples present in the caller's
  current `gene-variants-crdc` carrier universe. Existing annotations, carrier
  lists/counts and association models remain sourced from their current inputs.
- Match canonical GRCh38 chromosome/position/REF/ALT **and** sample ID. Remove
  only the terminal `_E38` or `_G38` assay suffix when looking up canonical
  source sample IDs. Return the original current carrier ID to the frontend.
  Do not match by gene alone or require raw suffixed ID equality with canonical
  source IDs. Preserve original GT (`0/1`, `1|1`, `0/2`, haploid calls, etc.).
- Missing, partial/no-call or conflicting GT stays unavailable. Never infer
  `0/1` or `0/0` from carrier membership or absence. Conflicting duplicate calls
  are reported as `status: conflict`. GT stays attached to the variant-specific
  carrier, never to the shared sample-only metadata cache.
- **Sample:** the existing private
  `POST /__pb_phenotype_profile__/sample-variants` reads the same original
  `sample_variant_gene.jsonl.gz` through `PB_SAMPLE_VARIANT_SOURCE`, and maps
  `gt` to `genotype` in the Variants & genotype table. Prioritized findings
  remain disconnected in live mode; do not enable or invent findings merely
  because a GT is available. Their illustrative fixture is unchanged. Full
  annotation records still come from the original file, not from the compact
  GT index.
- **Phenotype:** no genotype column or single-variant sample context exists in
  the present sample/gene summaries. Its linked Sample, Gene2 and Variant detail
  pages use the above source. Do not attach one patient-wide GT to phenotype
  sample rows, or recalculate precomputed GRS from this display lookup.

### Local index and deployment

Build the private gene-keyed lookup once, outside the public assets directory:

```bash
python3 scripts/build_pb_genotype_index.py --source /path/to/sample_variant_gene.jsonl.gz --out /private/path/genotype-index
```

Configure `PB_GENOTYPE_INDEX=/private/path/genotype-index` on the Vue prototype
server, then restart it. `gene_carrier_summary_endpoint.js` registers the route
and forwards the existing BioIndex access scope. The builder checks the original
source SHA-256. The lookup verifies its content-addressed packed-file checksum,
reads only one gene's gzip member and keeps at most five genes in memory.
The full-source index has 19,152 genes / 11,403,462 rows; packed payload is
62,335,236 bytes, plus its small offset manifest. No whole-cohort download is
sent to the browser. Set `PB_SAMPLE_VARIANT_SOURCE` to the same verified original
release for the existing Sample profile service; its current sample bridge
still streams the original source on an uncached sample request.

Historical November 13 session index: `/private/tmp/pb-genotype-index-20261113`.
The current Gene launchers instead default to the verified persistent checkout
cache `.pb-private-data/genotypes/shared/2025_crdc_16366_dp20_af001_20260907/index`;
see the linked Gene2 specification for setup and offline/failure behavior.
The builder's original source pin is intentional: changing releases requires
updating the expected hash/data-version contract and rebuilding, not relabeling
old calls. For production Helen may index the same processed rows directly in
BioIndex keyed by gene, variant and sample; the frontend response/join contract
above must be preserved. These local routes do not deploy changes to
`100.80.30.199` by themselves.

Acceptance: exact-variant/sample join; `_E38`/`_G38` mapping; distinct GTs for
one sample at two variants; phase/multiallelic/haploid preservation; conflict
and no-call missingness; unchanged current carrier universe; access-scope
filtering; pack corruption rejection; shared Gene2/Variant adapter propagation;
Sample evidence consistency. Live target `chr13:20189005:CTG:C` has two matching
current carriers in the processed source, both `0/1`.
Live local endpoints 8098 and 8099 return 1,241 matched GJB2 calls across
89 variants, including those two carriers and the two `chr13:20189353:A:G`
carriers (also `0/1`). `chr13:20185461:C:T` remains unavailable in this source.
The existing Sample route independently returns the target `0/1` call among
700 records for the checked carrier. Both development servers compiled after
restart. The existing `test_pb_gene_selection.js` separately fails at its
missing `rphersUnits` mock, before exercising the GT connection.


- Updated: 2026-11-12 (precomputed gene-HPO data contract; prior carrier updates retained)
- Source branch: `kyuryung/bch-prototype`
- Required feature commits: `a58f3a7a` through `f604dfa3`
- Audience: engineer or coding agent integrating the mockup into the authenticated BCH test server

This is the implementation contract for the current PB portal mockup. It states
which page elements are already connected, which values are reference data,
which values are still illustrative, and which real service must replace each
illustrative block. Follow this document without substituting local files,
synthetic values, or public BioIndex responses.

## Non-negotiable boundaries

1. Work from `kyuryung/bch-prototype`; verify that `f604dfa3` is an ancestor of
   the integration branch. Do not copy whole configuration or adapter files from
   another checkout.
2. Preserve the existing PB routes and exact filename casing:
   `/pb_Front.html`, `/pb_Front_legacy.html`, `/pb_Gene.html`,
   `/pb_variant.html`, and `/pb_phenotype.html`.
3. Keep `/pb_Front_legacy.html` available for comparison. The new
   `/pb_Front.html` is the active entry page.
4. Runtime cohort data must come from the authenticated private BioIndex or an
   approved authenticated aggregate API. Do not read an analyst's local files
   from the browser or server.
5. Do not use fixture or mock values as a runtime fallback. Show loading,
   `Unavailable`, or a clear error when a required source is unavailable.
6. Do not hard-code a service host. Configure it through deployment environment
   variables and expose it to the browser through an authenticated same-origin
   route.
7. Consume every BioIndex continuation page before calculating totals.
   Distinct carrier counts are distinct non-empty `sample_id` values, not row
   counts.
8. Keep generated reference artifacts in version control, but never edit them
   manually.

## Page and data status

| Page or block | Current source | Status on this branch | Test-server action |
|---|---|---|---|
| PB Front search and autocomplete | Generated gene and HPO references | Implemented | Deploy unchanged; rebuild references only through their generators |
| PB Gene identity, variants, and carriers | Private BioIndex | Live-capable | Configure the private browser proxy and retain continuation handling |
| PB Gene precomputed associations | Approved November 12 p<0.05 JSONL release; prototype reader retains legacy q mapping | Data prepared; production ingestion/mapping required | Index all delivered rows by gene and display `q_by_gene`; see section 3 |
| PB Variant identity and exact carriers | Private BioIndex | Live-capable | Configure the private browser proxy and retain exact-variant resolution |
| HPO Context on Gene and Variant | Session context plus `POST /phenotype-analyzer-api/analyze` on demand | Implemented, service-dependent | Configure the existing analyzer service; do not run it automatically |
| Phenotype definition and ontology | Generated HPO reference | Implemented static reference | Deploy the generated artifact and its provenance metadata |
| Phenotype diseases, frequencies, criteria, and related genes | Generated Orphanet Product 4 and Product 6 reference | Implemented static reference | Deploy the generated artifact; external ORPHA and internal gene links must remain active |
| Phenotype associated genes | Same November 12 association release | Production ingestion/mapping required | Index the same pairs by HPO and display `q_by_hpo`; see section 3 |
| Single-HPO CRDC statistics and samples | No live source | Unavailable | Connect the approved phenotype-profile endpoint |
| Multi-HPO CRDC summary and sample rows | Hard-coded illustrative values in `PbPhenotype/Template.vue` | Must be replaced | Remove all hard-coded values and connect the phenotype-profile endpoint |
| Multi-HPO Orphanet overlap | Generated Orphanet reference, client-side exact overlap | Implemented preview | Keep as exact overlap unless an approved semantic-similarity service replaces it |

## Cross-page processed BioIndex handoff (2026-09-07)

This section is the build and ingestion record for the processed carrier and
HPO data prepared for Helen. It covers the shared evidence needed by Gene,
Variant, Sample, and Phenotype. The files are canonical private build inputs;
they are not browser assets and must not be committed to this repository or
served as static files.

### Approved inputs and provenance

The build deliberately uses the following frozen inputs. Do not replace a path
with a similarly named file from another project or release.

| Input | Full path | SHA-256 | Role |
|---|---|---|---|
| Processed nonsynonymous carrier evidence | `/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/ref/BCH/VCF_versions/VCF_2025_WES_WGS/nonsyn_sample_gene_variant_score_evidence_dp20_af001.tsv.gz` | `882f69f8d380580670927e61d577ee14e81dc4c8935e6ba4dc46c7e7a098ed16` | `sample_id`, gene, variant, GT, AF and score/annotation fields after DP20 and cohort AF < 0.01 filtering |
| Confirmed 16,366-sample metadata | `/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/browser_paper/data/CRDC20251009_updated_07142026_Aditi_confirmed_metadata_16366.tsv` | `28ece1a4f3c61e98be674657bf6745d97b3583ec81f44082dbd8730261e9c6c9` | Original observed `hpo_terms`; other metadata exists but is not copied into this handoff |
| Parent-expanded binary HPO matrix | `/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/browser_paper/data/2025_crdc_16366sample_hpo_parent_expanded_binary.tsv.gz` | `bf3b5e45bb7b2f08cc33b96947fd11025671ec87d62f075d8eb5aee730db08d1` | `sample_id` plus 6,440 binary HPO columns |
| HPO ontology provenance | `/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/ref/HPO/hp_260216.obo` | `8d6c23798667d4506767ce643fc3c028f0d1c85e7e1d8810e491181a345d53cd` | Documented parent-expansion lineage, `hp/releases/2026-02-16` |

The first path is a symbolic link. Its resolved source is:

```text
/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/browser_paper/genotype_2025/evidence/nonsyn_sample_gene_variant_score_evidence_dp20_af001.tsv.gz
```

Record the symbolic-link path and resolved path in operational review. The
approved input identity is the SHA-256 above, not the filename alone.

> **Provenance boundary:** Obsidian records identify `hp_260216.obo` as the
> ontology used by the parent-expanded matrix lineage. No record naming this
> exact 16,366-sample matrix build was found. Keep that distinction in audit
> records; do not silently relabel it as the June 2026 ontology.

### Builder and exact execution

Repository source:

```text
/Users/kyuryung/Documents/github_dir/dig-dug-portal/scripts/build_bioindex_handoff.py
/Users/kyuryung/Documents/github_dir/dig-dug-portal/scripts/test_build_bioindex_handoff.py
/Users/kyuryung/Documents/github_dir/dig-dug-portal/scripts/run_bioindex_handoff_20260907.sbatch
```

Server copies and output directory:

```text
/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/ref/dig-dug-portal/bioindex_handoff_20260907/build_bioindex_handoff.py
/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/ref/dig-dug-portal/bioindex_handoff_20260907/run_bioindex_handoff_20260907.sbatch
/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/ref/dig-dug-portal/bioindex_handoff_20260907/
```

The Python builder is the reusable automation. The Slurm file fixes this
specific release's inputs, output, and versions. Re-run the frozen build with:

```bash
sbatch /lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/ref/dig-dug-portal/bioindex_handoff_20260907/run_bioindex_handoff_20260907.sbatch
```

Current build attempt: job `23511915`, submitted 2026-09-07, ended `FAILED`
after 7 minutes 12 seconds with exit code `1:0`. It found 23 variant-evidence
samples absent from the metadata/HPO roster and correctly stopped before
publishing outputs. Do not ingest this directory until that cohort mismatch is
resolved and a later job produces a complete manifest.

For a later release, call the reusable builder with new explicit inputs rather
than editing page code:

```bash
python3 build_bioindex_handoff.py \
  --variant-evidence /absolute/path/to/processed_variant_evidence.tsv.gz \
  --metadata /absolute/path/to/confirmed_metadata.tsv \
  --expanded-hpo /absolute/path/to/parent_expanded_binary.tsv.gz \
  --output-dir /absolute/path/to/new_empty_release_directory \
  --data-version RELEASE_NAME \
  --hpo-ontology-version HPO_RELEASE
```

Run the local self-check before copying a modified builder to the server:

```bash
cd /Users/kyuryung/Documents/github_dir/dig-dug-portal
python3 scripts/test_build_bioindex_handoff.py
```

Expected terminal line:

```text
BIOINDEX_HANDOFF_BUILD_PASS
```

### What the builder does

1. Validates the required processed-evidence headers.
2. Retains one canonical row per `sample_id × gene × variant` and rejects a
   duplicate key instead of silently selecting one row.
3. Prefixes a variant such as `3:151828170:T:C` with `chr` so cross-page links
   receive `chr3:151828170:T:C`.
4. Uses `gene_symbol` when supplied. If `gene_symbol` is empty but `gene_id`
   exists, it uses the Ensembl gene ID as the published `gene_symbol` value.
   It still rejects a row missing both identifiers.
5. Extracts observed HPO IDs from the metadata `hpo_terms` field.
6. Reads every positive cell in the parent-expanded matrix and merges it with
   the observed HPO rows. `is_observed=true` wins when a term occurs in both.
7. Derives distinct `sample_id × gene_symbol` rows from the variant evidence;
   no separate gene-carrier input is used.
8. Requires the metadata and expanded matrix sample sets to match exactly and
   requires every variant sample to occur in that shared HPO roster.
9. Uses compute-node temporary SQLite storage for uniqueness and sorting. It
   does not load the 440 MB compressed variant input into browser memory.
10. Refuses to overwrite final output files, writes gzip files through a
    temporary name, and publishes `manifest.json` with input/output hashes,
    sizes, versions, and counts.

### Known build failures and restart procedure

The following failures are retained so the next engineer does not repeat them:

| Job | Failure | Resolution/status |
|---|---|---|
| `23511391` | Server Python rejected a `Path` object passed to `sqlite3.connect()` | Fixed by passing the path as a string; no output was produced |
| `23511495` | A processed-evidence row had no `gene_symbol` | Fixed: use the same row's Ensembl `gene_id`; still fail if both are absent |
| `23511915` | 23 variant samples were absent from both approved metadata/HPO inputs | Unresolved data-contract decision; no output was produced |

Before the next submission, produce a private QC list for the 23 unmatched
sample IDs and choose one documented policy with the data owner:

1. supply the matching approved HPO/metadata rows; or
2. keep their variant rows but publish no HPO rows and record the missing-HPO
   count in the manifest; or
3. exclude them from all three artifacts and record the excluded sample and
   variant-row counts in the manifest.

Do not silently choose policy 2 or 3. Gene/Variant carrier denominators, Sample
availability, Phenotype counts, and co-gene counts must all use the same
documented cohort policy. After updating the builder, run the local self-check,
copy the verified script to the server path above, compare local and server
script SHA-256, and then submit the same Slurm wrapper.

### Output files and row contracts

Data version for this release:

```text
2025_crdc_16366_dp20_af001_20260907
```

#### `sample_variant_gene.jsonl.gz`

Grain: one `sample_id × canonical variant_id × gene_symbol`.

```json
{
  "sample_id": "0104K",
  "gene_symbol": "AADAC",
  "gene_id": "ENSG00000114771",
  "variant_id": "chr3:151828170:T:C",
  "gt": "0/1",
  "cohort_af_dp20": 0.00387999511181718,
  "gnomade_af": 0.00557,
  "clinvar_sig": "Likely_benign",
  "pathogenicity_score": 0.0,
  "score_source": "No_score",
  "consequence": "stop_lost",
  "impact": "HIGH",
  "biotype": "protein_coding"
}
```

The builder also retains available `lof`, `revel`, and `alphamissense` fields.
Missing source values are omitted, not written as zero. The generated file is
ordered by `gene_symbol`, `sample_id`, and `variant_id`.

#### `sample_hpo.jsonl.gz`

Grain: one unique `sample_id × hpo_id`.

```json
{"sample_id":"0104K","hpo_id":"HP:0001250","is_observed":true}
{"sample_id":"0104K","hpo_id":"HP:0000707","is_observed":false}
```

Use `is_observed=true` for a patient's reported phenotype display. Expanded
rows support ontology-aware search and calculation; never present every
ancestor as if it were directly observed. The file is ordered by `sample_id`
and `hpo_id`.

#### `sample_gene.jsonl.gz`

Grain: one distinct `sample_id × gene_symbol` from the approved processed
variant universe.

```json
{"sample_id":"0104K","gene_symbol":"AADAC"}
```

For a selected gene, co-genes are the same sample's distinct rows after
excluding that selected gene. Therefore:

```text
co_gene_count = distinct qualifying genes for the sample - 1
```

Do not interpret this as every gene in the person's genome. It is limited to
the same nonsynonymous, DP20, cohort AF < 0.01 evidence universe as the variant
input.

#### `manifest.json`

The manifest is the release gate. It records data and HPO versions, variant
scope, creation time, input SHA-256 values, row/sample/HPO counts, output byte
sizes, and output SHA-256 values. Do not ingest files from a build without a
completed manifest.

### BioIndex materialization and page use

The output files are normalized canonical artifacts. BioIndex query keys must
be top-level fields. Build query-specific indexes or sorted materializations as
required by the platform; do not ask the browser to scan a whole file.

| Logical source | Query key | Suggested index | Consumer |
|---|---|---|---|
| `sample_variant_gene` | `gene_symbol` | existing/extended `gene-samples` | Gene carriers and variants; Variant gene context |
| `sample_variant_gene` | `variant_id` | `variant-sample` or replacement | Variant exact carriers and GT |
| `sample_variant_gene` | `sample_id` | proposed `sample-variants-crdc` | Sample `All` variants and GT |
| `sample_hpo` | `sample_id` | proposed private sample-HPO index | Sample phenotype; carrier-detail join |
| `sample_hpo` | `hpo_id` | proposed private HPO-samples index | Phenotype CRDC samples and counts |
| `sample_gene` | `sample_id` | proposed private sample-gene index | Co-gene list/count and Sample gene grouping |
| `sample_gene` | `gene_symbol` | optional gene-carrier projection | Gene carrier membership when variant detail is unnecessary |

The canonical variant file is already gene-sorted, while the HPO and
sample-gene files are sample-sorted. A BioIndex build keyed in another direction
may require a separately sorted materialization. Creating another index does
not change the logical row contract.

Do not perform one browser request per carrier to obtain HPO or co-gene data.
For Gene and Variant carrier tables, join or materialize approved sample HPO
and sample-gene values in the private backend/BioIndex build. For Sample and
Phenotype, query their direct sample/HPO indexes. Patient-level HPO and carrier
data remain private; public pages and logs must not expose unrestricted rows.

The current `pbGeneBioIndexAdapter` expects flat carrier-variant rows, so
`sample_variant_gene` is compatible with its row grain. It is not compatible
with a nested `variants[]`-per-sample document without an adapter rewrite.
Keep missing connected fields explicitly `Unavailable` until the relevant
private index or server-side join is deployed.

### Release verification before Helen ingests the files

1. Confirm the Slurm job ended `COMPLETED` with exit code `0:0`.
2. Confirm all three `.jsonl.gz` files and `manifest.json` exist and no `.tmp`
   or `.build.sqlite` remains.
3. Run `gzip -t` on every gzip output.
4. Compare output line counts to the manifest.
5. Confirm `sample_hpo` contains both observed and expanded rows and that
   observed rows are a subset of the parent-expanded matrix for the same HPO
   release, allowing only explicitly documented exceptions.
6. Confirm `sample_gene` equals the distinct sample/gene projection of
   `sample_variant_gene`.
7. Confirm variant IDs use one GRCh38 representation and all GT values come
   from the sample-specific evidence row.
8. Review the count and examples of records where Ensembl `gene_id` replaced a
   missing `gene_symbol`; do not silently call an Ensembl ID an HGNC symbol in
   UI labels.
9. Record the final manifest and BioIndex build/index identifiers in this
   document before enabling live page consumption.
10. Test one Gene, exact Variant, Sample, and HPO query through the authenticated
    private route, including continuation and zero-result behavior.

## Routes and navigation

`vue.config.js` registers all current PB entries. Preserve the following flow:

| Search type | Destination |
|---|---|
| Sample | the sample page route already registered by the target application |
| Gene | `/pb_Gene.html?query={HGNC_SYMBOL}` |
| Variant | `/pb_variant.html?query={variant}` with `gene={symbol}` when known |
| One or more phenotypes | `/pb_phenotype.html?query={comma-separated HPO IDs or terms}` |

The current Phenotype mockup links sample results to `/pb_Sample.html`, while
the other PB pages use `/krSample.html`. Before deployment, replace the
Phenotype link with the target application's actually registered sample route.
Do not add a second sample page solely to satisfy the mock link.

## 1. PB Front

Primary files:

- `src/views/PbFront/Template.vue`
- `src/views/PbFront/searchModel.js`
- `src/views/PbGene/geneIdReference.generated.js`
- `src/views/KrClinicalFocus/clinicalContextReference.generated.js`

Required behavior:

- Keep the compact green-accent search layout and boxed editable input.
- Gene and phenotype autocomplete is case-insensitive.
- Accept a sample ID, exact variant or rsID, gene symbol, phenotype term, or
  HPO ID. Multiple phenotype terms may be separated by commas.
- The help control beside `TYPE, THEN PRESS ENTER` must explain accepted input
  formats on hover, focus, and click.
- Route the resolved query using `searchModel.js`; do not perform cohort
  analysis on the front page.
- Keep `pb_Front_legacy.html` intact.

## 2. PB Gene and PB Variant live BioIndex

PB Gene's shared adapter is `src/views/PbGene/pbGeneBioIndexAdapter.js`.
PB Variant reuses that gene evidence and resolves exact variants through the
transcript-consequence source.

Existing private BioIndex dependencies:

| Index | Query | Used for |
|---|---|---|
| `gene` | gene symbol | Basic gene record when present |
| `gene-samples` | gene symbol | Carrier rows and sample-linked observed variants |
| `gene-variants2` | gene symbol | Variant annotations |
| `transcript-consequences` | normalized variant | Variant-to-gene and transcript consequence resolution |

Keep `query_private: true`, follow all continuation URLs, and deduplicate
carrier rows by `sample_id`. Missing fields remain `Unavailable` or
`Not calculated`; they must not be inferred from unrelated rows.

Deployment requirements:

- Set `BIOINDEX_HOST_PRIVATE` in the server environment.
- The browser must query an authenticated same-origin route. In development,
  the existing `/__bioindex_private__` proxy provides that route when the
  environment variable is set.
- A production build cannot use the Vue development proxy. The target web
  server must provide equivalent authenticated routing, or set
  `BIOINDEX_HOST_PRIVATE_BROWSER` to its approved same-origin endpoint.
- Do not let private PB pages silently fall back to the public BioIndex host.

Recent UI decisions that must be preserved:

- The Gene hero does not show Affected, Probands, or Largest contributing
  clinical area.
- `Pathogenic score coverage` and `Most severe observed variant` share one
  card. Coverage is annotated variants over observed variants.
- `Top phenotype associations` receives the remaining hero width.
- The three Gene carrier-summary panels are collapsed initially under
  `Carrier summary details`.
- The HPO Context on-demand capsule remains visually adjacent to the match
  score area on both Gene and Variant pages.

## 3. Precomputed gene-HPO burden associations

The November 12 [DB import contract](pb_gene_context_association_engineering_handoff.md#precomputed-association-db-import--november-12-2026)
is authoritative for this section. Import the single runtime file
`/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/single_gene_burden_with_HPO/gene_hpo_release_20261112/browser_gene_hpo.jsonl.gz`
(360,812,435 bytes; 17,952 genes; 2,337,904 PASS p<0.05 pairs). The full archive
and build records under `internal/` are not needed for runtime ingestion.

The portal displays completed results; it does not run the burden analysis.
Use one approved result table and publish two query indexes over that same
table:

| Suggested private index | Query key | Consumer |
|---|---|---|
| `gene-hpo-burden-by-gene` | `gene_symbol` | PB Gene `Top phenotype associations` |
| `gene-hpo-burden-by-hpo` | `hpo_id` | PB Phenotype `Top associated genes` |

Both indexes refer to the same underlying pairs. Carry the JSONL record's
`gene` into the indexed `gene_symbol`. Preserve both stored q fields and choose
the displayed q by page. This example shows a normalized indexed row, not
literal production values:

```json
{
  "gene_symbol": "SCN1A",
  "hpo_id": "HP:0001250",
  "hpo_label": "Seizure",
  "odds_ratio": 2.18,
  "ci_low": 1.60,
  "ci_high": 2.97,
  "p_value": 0.000001,
  "q_by_gene": 0.0001,
  "q_by_hpo": 0.0002,
  "analysis_sample_count": 15000,
  "model_version": "...",
  "burden_score_version": "...",
  "result_version": "..."
}
```

Analysis contract:

```text
logit(P(HPO = 1)) = alpha + beta * gene burden score + covariates + GRM
OR = exp(beta)
```

- The phenotype is binary.
- OR means the change in phenotype odds for a one-unit increase in that gene's
  burden score.
- The same `(gene, HPO)` OR is shown on both pages. Never invert it and never
  rerun a reverse model for the Phenotype page.
- The delivery contains every PASS `p < 0.05` pair, both beta directions,
  without a top-15 or q filter. Both q values were calculated before this
  filtering; do not recalculate them from the import or displayed subset.
- Gene q is BH-adjusted across PASS HPOs within one gene (`q_by_gene`).
  Phenotype q is BH-adjusted across PASS genes within one HPO (`q_by_hpo`).
  There is no `q_value_global` in this release, and the two displayed q values
  need not match for a shared pair.
- Initial Gene order is p-value ascending, then HPO ID. Q sorting/filtering
  and exports must use the page-specific q. Do not describe OR magnitude as
  a valid ranking across genes.
- Display `analysis_sample_count` from the fitted model, not a general cohort
  total.
- If no rows pass, show `No passing precomputed associations`; do not load the
  current mock rows.

Map the live row to the existing Gene component shape as follows:

| Live field | Existing UI field |
|---|---|
| `hpo_id` | `hpoId` |
| `hpo_label` | `label` |
| `odds_ratio` | `oddsRatio` |
| `ci_low` | `ciLow` |
| `ci_high` | `ciHigh` |
| `p_value` | `pValue` |
| `q_by_gene` (Gene) / `q_by_hpo` (Phenotype) | `qValue` |

Remove the `genePhenotypeAssociations` mock import from the live Gene state
once this source is connected.

## 4. Phenotype reference data

Primary files:

- `src/views/PbPhenotype/Template.vue`
- `src/views/PbPhenotype/style.css`
- `scripts/build_pb_phenotype_reference.py`
- `src/views/PbPhenotype/orphanetReference.generated.js`

Rebuild the generated reference only with approved inputs:

```bash
python3 scripts/build_pb_phenotype_reference.py \
  --product4 path/to/orphanet_product4.xml \
  --product6 path/to/orphanet_product6.xml \
  --hpo-obo path/to/hp.obo \
  --output src/views/PbPhenotype/orphanetReference.generated.js
```

The generated artifact records input filenames, dates or versions, and SHA-256
values. Treat that metadata as authoritative and show it in release records.
Do not label the UI with a reference month that conflicts with the generated
metadata.

Single-HPO behavior to preserve:

- Show the definition, then immediate parent and child HPO terms.
- Keep HPO definition/ontology separate from Orphanet disease evidence.
- Show Orphanet disease frequency, diagnostic-criterion status, and all related
  genes available in Product 6.
- Put diagnostic-criterion diseases first by default.
- Hide `Excluded (0%)` associations.
- ORPHA IDs open the corresponding Orphanet page in a new tab.
- Related gene symbols open `/pb_Gene.html?query={symbol}`.
- Clicking non-link space in a disease row expands or collapses diagnostic
  details and other features to check.
- Group other features by Orphanet frequency, show higher-frequency groups
  first, and reveal lower-frequency or additional items on demand.

Multi-HPO Orphanet behavior:

- At two or more selected terms, treat the set as one custom phenotype profile.
- The current disease table is an exact-query-term overlap preview. Label it as
  exact overlap; do not call it ontology-aware or semantic similarity.
- Sort by number of matched query terms, then diagnostic-criterion status.
- Keep each selected term available as a link back to its single-term page.

## 5. CRDC phenotype-profile API

Use one authenticated endpoint for one or more HPO terms so the single-term and
multi-term pages share one implementation. Add it to the existing phenotype
analyzer service as a separate sample-authorized operation:

```http
POST /phenotype-analyzer-api/profile
Content-Type: application/json
```

Request contract:

```json
{
  "hpo_ids": ["HP:0001250"],
  "filters": {
    "investigator": null,
    "exact_age": null,
    "sex": null
  },
  "page": 1,
  "page_size": 25
}
```

Response contract:

```json
{
  "query_hpo_ids": ["HP:0001250"],
  "summary": {
    "eligible_sample_count": 0,
    "complete_match_sample_count": 0,
    "largest_investigator": null,
    "largest_investigator_count": 0,
    "median_exact_age": null
  },
  "filter_options": {
    "investigators": [],
    "exact_ages": [],
    "sexes": []
  },
  "samples": [],
  "pagination": {
    "page": 1,
    "page_size": 25,
    "total": 0,
    "next": null
  },
  "scoring_method": "approved method name",
  "scoring_version": "...",
  "data_version": "..."
}
```

Each returned sample row must contain only authorized portal fields:

```json
{
  "sample_id": "...",
  "profile_score": 0.0,
  "exact_match_count": 0,
  "related_match_count": null,
  "investigator": "...",
  "exact_age": 0,
  "sex": "..."
}
```

Implementation rules:

- Source the data from the approved CRDC HPO/sample service used by the test
  server, not from a developer workstation.
- Keep this endpoint separate from the aggregate-only `/analyze` operation.
  Sample rows require the test server's existing authentication and
  authorization policy.
- `exact_age` is numeric and filterable as an exact value. Do not replace it
  with broad age ranges or labels.
- A missing phenotype annotation is unknown, not clinically absent.
- `profile_score`, its label, and its interpretation must come from the
  approved scoring method. Do not invent an ontology-related match count.
- If related matches are not supported, return `null` and hide that column.
- Return stable pagination and a complete `total`; do not load every sample in
  one browser response.
- On zero results, render a zero-result state. On service failure, render an
  unavailable/error state. Neither case may fall back to mock rows.

Before enabling this endpoint in the UI, delete the hard-coded
`profileSummary` and `mockSamples` values in `PbPhenotype/Template.vue` and add
loading, empty, and error states. The `Refresh profile preview` action must
issue a new request using the current HPO terms and filters; it must not remain
a no-op.

## Integration order

1. Fetch `kyuryung/bch-prototype` and verify the required feature commits.
2. Preserve target-server authentication and configure the private BioIndex
   same-origin route.
3. Deploy the five PB page entries and verify Front, Gene, and Variant routing.
4. Verify live Gene and Variant values before touching new association or
   phenotype services.
5. Deploy the generated HPO/Orphanet reference and validate its provenance.
6. Publish the precomputed gene-HPO table through the two private indexes and
   connect Gene and Phenotype to the same rows.
7. Implement and connect the authenticated phenotype-profile endpoint.
8. Remove all illustrative phenotype statistics and sample rows.
9. Point phenotype sample links to the target application's registered sample
   route.
10. Run automated and browser acceptance checks, then deploy through the
    team's normal review process.

## Verification

Run from the repository root:

```bash
node scripts/test_pb_front_search.js
node scripts/test_pb_front_search_state.js
node scripts/test_pb_clinical_context_integration.js
node scripts/test_pb_front_clinical_context_reference.js
node scripts/test_pb_variant_carrier_statistics.js
node scripts/test_pb_variant_identifiers.js
python3 -m unittest scripts.test_pb_gene_context_ui scripts.test_pb_gene_context_validation
git diff --check
npm run build
```

The repository has a pre-existing `locuszoom`/`tabix-reader` build warning; a
new error or a missing PB page bundle is not acceptable.

Browser acceptance checklist:

- [ ] `/pb_Front.html` accepts typed input and case-insensitive gene/HPO autocomplete.
- [ ] `/pb_Front_legacy.html` still renders independently.
- [ ] A known live gene returns nonzero observed variants and distinct carriers.
- [ ] A known exact variant maps to its gene and returns distinct exact carriers.
- [ ] BioIndex network requests use the authenticated private same-origin route,
      not the public fallback.
- [ ] Gene and Phenotype retain identical raw beta/SE/OR, p-value and model N
      for the same pair; Gene displays `q_by_gene` and Phenotype `q_by_hpo`.
- [ ] Gene initially lists all delivered p<0.05 rows in p-value/HPO-ID order
      across pagination; page-specific q is used for q sorting and filtering.
- [ ] A single HPO term shows definition, immediate ontology relations,
      Orphanet diseases, diagnostic criteria, and all available related genes.
- [ ] Two or more HPO terms switch to profile view and refresh with real API data.
- [ ] Investigator, exact-age, and sex filters change both summary and sample rows.
- [ ] Sample, gene, phenotype, variant, and ORPHA links resolve to their intended pages.
- [ ] No `ILLUSTRATIVE MOCK VALUES`, hard-coded sample ID, fake statistic, personal
      filesystem path, or service host appears in the production bundle.
- [ ] Service failures show an explicit unavailable/error state and never mock data.

## Completion evidence for Helen

The implementing agent should return only verifiable evidence:

1. the integration commit and deployed commit;
2. configured environment variable names, without secret values;
3. the BioIndex indexes and API operations connected to each page block;
4. automated test and build results;
5. browser screenshots for Front, a live Gene, a live Variant, one HPO term,
   and a multi-HPO profile;
6. one shared gene-HPO row proving identical raw effect/p/model N and correct
   Gene `q_by_gene` versus Phenotype `q_by_hpo` mapping;
7. confirmation that all mock phenotype statistics and sample rows were removed.

## Related repository documentation

- `docs/pb_gene_production_integration_handoff.md`
- `docs/pb_gene_context_api_guide.md`
- `docs/pb_gene_context_api_review_checklist.md`
- `docs/bch_pb_variant_tier1_acceptance_note_20260801.md`
- `docs/pb_variant_engineering_integration_handoff.md`

Those documents contain page-specific history. This document is the current
cross-page implementation contract when they differ.

</details>
