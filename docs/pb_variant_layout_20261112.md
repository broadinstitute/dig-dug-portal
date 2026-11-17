# Variant layout — current implementation

Current contract: [Variant engineering handoff, November 17](pb_variant_engineering_integration_handoff.md#current-ui-contract--2026-11-17). Older November 12–13 layout/history instructions are superseded.

| Order | Content |
|---|---|
| 1 | Variant identity; source annotations and AF. |
| 2 | One carrier card: left count + All/Het/Hom selector; demographics; thin divider; independently filtered Carrier phenotypes. |
| 3 | Profile input/Advanced options; one history result row per run; full-width expandable scored-sample table. |

- All/Het/Hom: blue/green/yellow buttons and chart fills; Unknown remains selectable when present.
- Remove repeated variant identity/evidence columns from profile results.
- Profile Apply does not highlight, expand or navigate the observed phenotype browser.
- Save per-run individual scores; expanding an older run uses that run's scores.
- Scored samples only; default descending Z; five rows/page; distinguish scoring exclusions from missing HPO records.
- Use the shared [pagination control](pb_front_gene_variant_merge_handoff.md#shared-pagination--2026-11-17) in every paginated section.
- Files: `PbVariant/{Template.vue,pageModel.js,style.css,layoutHelp.js}`, `PbGene2/Demographics.vue`, `PbGene/SummaryPager.vue`.
- Checks: `node scripts/test_pb_variant_layout.js`, `node scripts/test_pb_variant_carrier_statistics.js`, `node scripts/test_pb_variant_profile_history.js`, `node scripts/test_pb_pagination.js`.

## Persistent scoring count source

rPheRS reads `2025_crdc_15764sample_hpo_parent_expanded_binary.tsv.gz`, sums each sample's binary row, and fits `raw PheRS ~ n_terms`. The live source is `/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/pb_context_demo/20261007-5a9ab06cc/source/2025_crdc_15764sample_hpo_parent_expanded_binary.tsv.gz`. The compressed input SHA-256 is `eaa0ea2e218d300d4b9546ec238128e146237cee92a43350bc2846d5bd834ba6` (15,764 rows; 6,440 HPO columns). The original metadata table has a separate `total_terms` field. For the first example carrier it is 97 while scoring-matrix `n_terms` is 98; those fields must not be substituted.

The verified matrix and its generated lookup persist in `.pb-private-data/rphers/`, excluded from Git and public assets. Generate a lookup for each approved scoring release with:

```sh
python3 scripts/build_pb_hpo_term_counts.py \
  --hpo-matrix /private/path/to/approved_scoring_hpo_matrix.tsv.gz \
  --output /private/path/to/hpo_term_counts.json
```

Configure `PB_HPO_TERM_COUNTS_FILE` in the metadata API environment, or use this prototype's default `.pb-private-data/rphers/hpo_term_counts.json`. `variant_hpo_term_counts_source.js` reads the persistent release lookup on carrier metadata requests, caches parsed values while its file is unchanged, and reloads atomically replaced files without restarting the server. A new scoring release requires rebuilding/replacing the lookup from that same approved matrix; no page-specific or sample-specific values are hardcoded. Invalid or missing source files cannot reuse stale values.

The existing private exact-variant metadata route attaches `n_terms` and `n_terms_status` after its carrier-membership check, with input fingerprint in `n_terms_source`. It does not enumerate cohort counts. No extra BioIndex lookup, browser reconstruction or regression is needed. Browser sample suffixes `_E38`/`_G38` map to the matrix's canonical sample ID.

Known empty phenotype records outside the matrix display 0 with `empty_phenotype_record` status; this does not imply scoring eligibility. A nonempty record with no matrix match or an unavailable count source stays unavailable. The column's info icon explains the source and distinction. Checks: matrix row sums/validation, provenance, file replacement, API membership/cache reuse, source counts versus metadata-list length, zero/missing distinctions.
