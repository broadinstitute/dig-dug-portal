# PB Gene2 review status

- Source visual truth: selected full-page mockups `exec-18031c50-7678-4e0e-a274-0f59911742d0.png`, `exec-747d9fac-ee67-4fc9-af0f-6051c81cdc03.png`, and corrected HPO/variant region `exec-157e7c3c-3596-4ecf-9f58-7a03309c5ee3.png`, under `/Users/kyuryung/.codex/generated_images/01a18fae-e808-7dd3-a325-4c8a627e958e/`.
- User override: omit the gene locus, including its length track, density bars and filters. Existing gene coordinate text remains.
- Implementation: http://127.0.0.1:8097/pb_gene2.html?query=SLC6A7
- Build: development build passed with the private BioIndex browser proxy; full production build also passed (existing locuszoom export and CSS ordering warnings).
- Automated verification passed: pin/search isolation, immutable release-row values, per-gene pin reset, unchanged original score functions, gene-wide demographics independent of variant selection, partial HPO denominator labels, Gene2 route retention, SFC template compilation, aggregate metadata HPO deduplication and no patient identifiers in aggregate responses, existing residual-PheRS SD and HPO search checks.
- Existing `test_pb_gene_selection.js` does not load the existing rphersUnits dependency and fails before exercising any changed code; Gene2's test covers its shared selection behavior.
- Visual evidence: unavailable. In-app browser and native/browser inventory are unavailable. User initially allowed Playwright, then explicitly superseded that permission with “아니야 내가 확인할께 링크줘”. No Playwright browser was run.
- Viewport, browser-rendered screenshot, density normalization, full-view comparison, focused-region comparison, console inspection and manual interaction checks: pending the user's direct review.
- Typography: Arial/Helvetica, compact 12–14px tables and 21px section headings; requires visual confirmation.
- Spacing/layout: four ordered sections; gene-level and variant-level details are separate; locus omitted; requires visual confirmation.
- Colors/tokens: existing portal blue/navy/grey tokens; requires visual confirmation.
- Assets: existing Bootstrap Vue icons; no generated raster assets needed in implementation.
- Copy/content: HPO profiles remain the first column of accumulated Context runs; applied profile identifies variant context, precomputed binary-HPO units remain distinct, missing/partial metadata are labelled.

final result: blocked

Browser visual QA is pending user review, at the user's request. No claim of visual QA completion is made.

## Subsequent requested changes

- Gene2 defaults to GJB2, while explicit gene queries remain supported.
- Gene and variant demographics use Project groups, following Phenotype's clean_name → Project → project → project_name precedence.
- Prediction-annotation coverage renamed to Variants with prediction annotations.
- Precomputed associations sort numerically by beta, confidence interval, p, q and HPO carrier count. Pinned/search groups stay independent; missing values sort last in both directions. Confidence intervals sort by lower limit, then upper limit.
- Expanded variant phenotype table has case-insensitive name/HPO lookup and ascending/descending carrier-count sort; co-genes have independent symbol lookup. Filtering operates before pagination and does not change the co-gene test/FDR set.
- Variant pins remain visible without duplicates across pagination, sorting and position search. Expanded pinned variants do not redirect the comparison page, use current HPO values, and reset on a different gene.
- Extended automated Gene2 tests passed for these interactions. Browser verification remains assigned to the user.

## Front2 entry

- Added `/pb_front2.html` with the original Front layout and search behavior, excluding Sample links, format hints and routing. Gene queries go to `/pb_gene2.html`; Gene2 Home returns to `/pb_front2.html`. Variant and Phenotype destinations are unchanged.
- Original Front files are unchanged. Search-target tests and both Vue templates passed.
- The existing8098 development server was restarted using its original private BioIndex, Context API and precomputed-release settings. Compilation passed with the existing locuszoom/tabix-reader warning. HTTP checks confirmed Front2, Gene2 and the original Front return their respective entries.
- User is performing visual review; no automated browser was opened.

## Demographics, variant category filters and loading

- Sex and Affected are stacked in a shared column. Project groups have a full searchable, scrollable list with an expand/compact toggle; long project names wrap instead of truncating.
- ClinVar/consequence/LoFTEE badges filter the displayed variant evidence. OR within a category, AND across categories; source variants, HPO calculations, gene-wide summaries and FDR families are unchanged. Pinned rows outside the filter are explicitly labelled. Filter-aware pagination and genomic-position lookup share the filtered row set.
- Removed120-sample barriers from metadata aggregation: a bounded streaming worker pool now keeps the same12-request global concurrency, retains high-priority variant requests, and allows later samples to progress while a single lookup waits. A regression check blocked the first sample and verified completion beyond120 before releasing it.
- The normalized private per-sample cache remains session-token-scoped, uses LRU eviction with a5000-record /32MiB serialized-payload budget and15-minute TTL, and does not evict in-flight requests. Auth-scope, retry and failed-metadata checks pass. This does not remove the first-load per-carrier source queries; a batch/aggregate upstream contract remains the larger performance improvement.
- Legacy8097 now forwards HTML to8098 and proxies remaining calls, avoiding an independent metadata aggregation cache/job.
- Gene2 interaction/model checks, metadata aggregation checks and Vue template compilation pass. Development compilation has only the existing locuszoom/tabix-reader export warning. HTTP entries and legacy redirects verified; visual review remains with the user. No end-to-end load-time speedup figure is claimed.

## Variant identifier lookup

- The Find field now supports genomic position, exact variant ID, HGVS c./p./g. notation and rsID using identifiers already present in the gene release. Raw Existing_variation rsIDs and all supplied transcript HGVS aliases are retained by the shared adapter.
- Source-only GJB2 inspection confirmed c.35del with rs80338939, c.167del with rs80338942, c.235del with rs80338943, and a separate c.35dup record sharing rs80338939. No sample identifiers were output.
- Lookup accepts an optional terminal deletion sequence when omitted from supplied annotation, while preserving coordinates/operation and any explicitly specified transcript/version. It does not realign indels or convert between transcripts.
- Multiple rsID matches and comma-separated identifiers are shown together; clear-search restores the existing category-filtered table. Pins remain independent. Failed lookups keep the last valid table and show an error. No new remote identifier service or per-variant lookup requests are needed.
- Identifier unit checks and Gene2 integration checks passed; the8098 compiled bundle contains the change. User is performing visual review.

## Phenotype selected-term URL repair

- Root cause: Front autocomplete submits `Term name [HP:0000000]`, while `resolveHpoId` previously accepted only bare HPO IDs or an exact full term name. `Chest tightness [HP:0031352]` resolved to no IDs despite the term being present in both catalogs.
- The resolver now supports the selected label-plus-bracketed-ID format, including case/space variants and multi-term lists. Regression tests use the actual reference and the exact reported URL. Existing phenotype model tests pass.
- A separate runtime check found the sample profile backend on8093 was not listening (ECONNREFUSED), while the Chest tightness precomputed gene endpoint returned200 and20 association rows. Restored the existing profile service with the exact source paths already specified by `serve_pb_phenotype_local.sh`; the matrix includes HP:0031352. No alternative data source or scoring method was introduced.
- Manual browser review remains with the user.

## Annotation counts and sex categories

- Replaced the Predicted LoF badge with AM annotated and REVEL annotated availability counts. Zero scores count as annotated; missing values do not. These badges filter displayed variants, with OR within annotation selections and AND across other categories. Missense/Other consequence groups still cover all variants; LoFTEE HC remains available.
- Gene2 demographics merge sex 0 and case-insensitive unknown into a single Unknown count, for both summary and fallback metadata, without modifying source summaries or age-zero bins. Gene and expanded-variant demographics share this component.
- Regression checks cover annotation count/filter behavior, conserved sex totals, unmodified input and fallback grouping. Vue templates and Gene2 tests pass. Dev compilation passed with the existing tabix-reader warning; visual review remains with the user.
- AF scope clarification pending: the initial live GJB2 source response has 11/158 numeric af values >= 0.01 and 3/50 numeric gnomADe_AF values >= 0.01. The current table does not enforce an AF cutoff. No blanket AF < 0.01 label or new data filter has been added while the scope question is pending.

## On-demand gene association loading investigation

- Existing calculation service and SSH tunnel are healthy. Live proxy validation returns immediately. A new Chest tightness co-gene request completed in 26.88 seconds; repeating it completed in 1.21 seconds (server calculation 0.176 ms on the repeat).
- The screenshot five-term profile (HP:0012735, HP:0031352, HP:0001785, HP:0001977, HP:0002204), requested with the complete 19,090-gene catalog, returned HTTP 200 in 53.52 seconds, including 26.50 seconds of server processing. It returned 19,090 catalog rows and 18,819 valid tests. No statistical model, test family or score reference changed.
- Clarified first-load calculation/download wait in Phenotype multi-HPO and Gene2 co-gene loading copy. Added a shared two-minute request/body deadline so a stalled response becomes a retryable error; Gene2 now exposes Retry. Existing Phenotype retry remains.
- Added consequence tooltips: Missense versus other non-missense consequences is distinct from clinical classification.
- Request deadline/error tests, full catalog API validation, Gene2 interactions and Vue compilation pass. Browser visual QA remains assigned to the user. These changes bound failure behavior and clarify the wait; no new speedup is claimed.

## Variant co-gene association sorting

- Added toggling numeric ascending/descending sort controls for the displayed SD-standardized beta, p and q (FDR) in each expanded variant co-gene table. Sort applies to the complete search result before pagination and returns to page one.
- Sorting uses unrounded values, preserves beta signs, keeps missing/non-finite/non-OK results last in both directions, and leaves source rows and the full FDR testing family unchanged. Sorting/search reuse existing results without API requests.
- Regression checks exercise signed/zero beta, scientific-notation p, q, unavailable values, both directions, search, pagination and request isolation. Gene2 tests, Vue template compilation and whitespace checks pass. Development build passed with the existing tabix-reader warning; browser review remains with the user.
