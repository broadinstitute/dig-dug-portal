# Gene2 integration handoff — 2026-11-12

Target: `pb_gene2.html?query=GJB2` on branch `kyuryung/bch-prototype`.
This is the current Gene2 UI contract. Earlier mockups/history notes may show
removed columns or controls; follow this document for the final screen.

## Apply

- Frontend: `src/views/PbGene2/`; existing Vue CLI entry remains in `vue.config.js`.
- Shared adapter: `src/views/PbGene/pbGeneBioIndexAdapter.js` only shortens the
  missing summary to `NCBI summary unavailable`.
- Local API support: `scripts/gene_carrier_summary_endpoint.js`,
  `gene_carrier_disk_cache.js`, `gene_variant_hpo_counts_endpoint.js` and
  `gene_hpo_association_endpoint.js`. Vue dev-server routes are examples;
  a static frontend build does not deploy these server handlers.
- Keep existing private-source authentication. Production deployment and
  BioIndex ingestion have not been performed by this change.

## Final screen behavior

1. Gene identity/external references → CRDC variants/annotations → carrier
   demographics → single-phenotype associations → custom HPO → variant evidence.
   Missing information is muted. Gene2 retains its existing CSS scale of 0.8.
2. Consequences use actual categories, count sorting and numbered pages.
   Predictor details expand under Annotated. Chart selections filter both the
   variant list and the distinct union of matching carriers' demographics.
3. All help buttons are superscript i icons. Hover/focus opens a side panel;
   click pins it; Escape closes it. Confirmed reference text and official URLs
   are in `referenceProvenance.js`. VEP/cache versions and DB dates are distinct;
   ClinVar 2025-08-24 is a VCF date, not a download date.
4. Single-phenotype results use all delivered rows with pagination, search,
   sorting and pins. There is no top-15 limit or P-threshold selector. Show q;
   keep its within-gene definition in i. Do not repeat carrier denominators.
5. Custom-profile history: ↻ re-runs the row's HPOs and saved Max/Sum,
   All/Affected, threshold and minimum-carrier settings. The new result becomes
   Applied; earlier results remain. × deletes one row. Deleting Applied also
   clears its applied variant evidence. Disable actions during calculation.
6. Expanded variant: annotation → carrier summary → carrier samples, enclosed
   with its parent variant row in one blue outline. Annotation's blue ↗ opens
   that exact variant page. Summary is Project / Age / Sex above Affected;
   projects include investigators, sorting and four rows per page.
7. Carrier samples: five rows per page; search covers all carrier IDs. Fetch
   individual metadata only for the visible page. Columns are Sample, Age, Sex,
   GT, rPheRS Z, Project, Affected. HPO terms, Co-genes and the additional
   Carrier phenotypes/co-genes section are removed. Missing GT remains a dash.

## Data and units — preserve these boundaries

- `GET /__gene_hpo_associations__?gene=...`: Gene q/flag/count must use
  `q_by_gene`, `q_significant_by_gene`, `n_q_significant_by_gene`.
  Phenotype continues using `q_by_hpo`. Missing Gene q must stay missing.
- Import `gene_hpo_release_20261112/browser_gene_hpo.jsonl.gz` on the shared
  server; set `PB_GENE_HPO_FILE` and `PB_GENE_HPO_RELEASE_ID` for the reference
  endpoint. File/checksum/import details:
  [association delivery contract](pb_gene_context_association_engineering_handoff.md#precomputed-association-db-import--november-12-2026).
  All PASS P < 0.05 rows were delivered after q was calculated on the full family.
  Never recompute q on displayed/delivered rows. Do not ship the 361 MB file to
  browsers or commit it to Git.
- `GET /__gene_carrier_summary__` and `POST /__gene_carrier_demographics__` supply
  gene/selected-carrier summaries. `POST /__gene_variant_hpo_counts__` supplies
  recorded HPO-positive carrier counts; use all entered terms (AND). These counts
  are independent of rPheRS score availability and the All/Affected model roster.
- Custom analysis still uses `/phenotype-analyzer-api/analyze`; visible variant
  filters do not restrict its scoring/model cohort. Precomputed beta is HPO
  log-odds per 0.1 Sum GRS; custom Gene beta is rPheRS SD per 0.1 GRS;
  Variant beta is a carrier/non-carrier rPheRS SD effect.
- Mean/individual Z use the full HPO scoring cohort's mean and sample SD.
  Incomplete eligible-carrier score coverage stays Unavailable.
- The local disk cache survives server restarts, is source/build/auth scoped,
  and expires after 24h. Configure `PB_GENE_CARRIER_CACHE_DIR` on durable private
  storage. Cold misses may still be slow. The optional prebuilt server API in
  [backend/gene_carrier_api](../backend/gene_carrier_api/README.md) is a separate
  integration option; copying frontend files alone does not enable it.

## Verify after integration

- GJB2 currently has 392 observed variants and 16,143 gene carriers. Its largest
  variant has 15,374 carriers. Check count/bar spacing, five-row sample pages and
  full-ID search. These are validation values, never UI constants.
- Gene-HPO release check: GJB2 has 119 delivered rows, 2,774 full-family PASS HPO
  tests and 9 gene-q-significant rows. All pages must be reachable.
- Core checks: `node scripts/test_pb_gene2.js`, `test_pb_gene2_carrier_table.js`,
  `test_pb_gene2_carrier_scores.js`, `test_pb_gene2_info_rail.js`,
  `test_pb_gene2_filtered_demographics.js`, `test_pb_gene2_hpo_counts.js`,
  `test_gene_variant_hpo_counts.js`, `test_gene_carrier_summary_endpoint.js`,
  `test_gene_carrier_disk_cache.js`, `test_gene_carrier_restart_cache.js` and
  `test_pb_phenotype_gene_endpoint.js` from `scripts/` (prefix each with `node scripts/`).
  These checks pass locally; the active dev build compiles with the existing
  unrelated `locuszoom/tabix-reader` warning. Final narrow-screen visual QA is
  still required in the integration environment.
