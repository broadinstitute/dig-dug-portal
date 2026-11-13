# PB Variant implementation contract

- Updated: 2026-11-13
- Entry: `/pb_variant.html?query=chr13%3A20189005%3ACTG%3AC&gene=GJB2`
- Branch: `kyuryung/bch-prototype`
- Baseline: `3d12ecbb9` + the Variant follow-up commit containing this document.

## Scope and implementation order

1. Apply Variant UI files and shared dependencies below.
2. Register private metadata, genotype and recorded-HPO-count routes.
3. Prepare the approved GT and scoring-HPO indexes; set server environment.
4. Preserve existing Context API calculations and standardization.
5. Run acceptance checks. Deploy frontend and private routes together.

Gene2 page layout is outside this delivery. `PbGene2/Template.vue`,
`VariantAnnotation.vue`, `style.css`, carrier-table/HPO-total UI changes remain
separate. Shared Demographics, help text and OR-count client compatibility are
included because Variant uses those contracts.

| Layer | Files |
|---|---|
| Variant UI/model | `src/views/PbVariant/{Template.vue,pageModel.js,style.css}` |
| Carrier data/display | `src/views/PbVariant/{carrierStatistics.js,sampleMetadata.js,tableSorting.js,layoutSummary.js,phenotypePresentation.js,layoutHelp.js}` |
| Shared UI/help | `src/views/PbGene2/{Demographics.vue,evidenceHelp.js,variantHpoCounts.js}` |
| Existing source/UI dependencies | `src/views/PbGene2/{referenceProvenance.js,HelpTooltip.vue,InfoRail.vue,ProfileInput.vue}`, `src/utils/rphersUnits.js` |
| Shared carrier/GT adapter | `src/views/PbGene/{pbGeneBioIndexAdapter.js,carrierGenotypes.js}` |
| Private API registration | `scripts/gene_carrier_summary_endpoint.js` |
| Variant metadata/HPO count | `scripts/{variant_carrier_metadata_endpoint.js,variant_hpo_term_counts_source.js,gene_variant_hpo_counts_endpoint.js}` |
| GT lookup | `scripts/{gene_genotype_endpoint.js,processed_genotype_source.js,build_pb_genotype_index.py}` |
| Scoring-HPO lookup builder | `scripts/build_pb_hpo_term_counts.py` |

## UI contract

Order: Variant identity → CRDC carrier demographics → Test a phenotype profile
→ one carrier card → Co-carried genes → Other same-gene variants.

- Identity: gene before coordinate; left identifiers/HGVS/transcripts, right
  Consequence/ClinVar/AF/predictors. Uniform 18px values. Yellow CRDC AF and
  selected score source: LoFTEE HC = 1, otherwise available AlphaMissense.
- Heading: `N carriers observed in CRDC`; precise AF stays in identity.
  Project search sits beside Project / Investigator; four projects per page.
  Sex: Male/Female/Unknown; Affected: Yes/No/Unknown, including known zeroes.
- Profile columns: profile, β, P, Mean carrier rPheRS Z, Settings, actions.
  Default Max · All. No q, Scored carriers, Samples or phenotype-data column.
- Successful Apply prepends a saved result. Latest Applied controls downstream
  evidence. Re-run restores that row's terms/settings and adds a result.
  Delete removes only its row; deleting Applied clears active analysis.
  Pending/failed requests preserve prior results. History resets on reload or
  another variant; it does not persist individual residual vectors per run.
- Carrier card: matching h2 titles (28px desktop/24px narrow CSS). Evidence
  table above Carrier phenotypes, within the same outer card.
- Evidence columns: Variant, ClinVar, Total carriers, In Silico Predictors,
  Carriers with HPO, Mean carrier rPheRS Z, Variant β (rPheRS SD), P.
  Blue Variant information / green Phenotype-based evidence bands.
- Expand the variant row to show Sample, Age, Sex, GT, rPheRS Z-score,
  Total HPO terms, Affected, Project. Five samples per page. Summary and
  expanded samples share one rounded border; expanded outline is blue.
- Do not restore duplicate mean/pathogenicity summaries or the
  `Private BioIndex detail · metadata matched` line.
- Observed HPO tree: compact HP:0000118 root, darker terminated connectors,
  depth colours and applied-term highlighting. With one contributing carrier,
  show n/N without bars/%; otherwise use 12px bars and n/N (%).

## Definitions: keep these separate

| Value | Contract |
|---|---|
| Total carriers | Distinct observed exact-variant carriers; not cohort size |
| Carriers with HPO | At least ONE exact recorded applied HPO ID (OR); count each carrier once; all observed variant carriers; independent of All/Affected/display filters |
| Phenotype data available | Carriers with any nonempty HPO record; show once beside Carrier phenotypes; not an applied-HPO match count |
| Observed phenotype statistics | Only carriers with HPO records contribute to denominator; tree uses `is_observed=true` + ancestor paths; no assumption of absence for missing data |
| Total HPO terms | Scoring binary-matrix row sum `n_terms`; not metadata `total_terms`, list length or browser tree size |
| Variant β | Existing carrier 0/1 regression, displayed `β_raw / reference_sample_SD` |
| Mean carrier rPheRS Z | Separate descriptive mean; complete analysis-eligible carrier coverage required |
| Individual Z | Per-sample score using full scoring-cohort mean/sample SD |
| Gene/co-gene β | `0.1 × β_raw / reference_sample_SD`, using selected dosage-aware Max/Sum GRS |
| P / q / FDR | Variant P unchanged; no q for one variant × profile; co-gene BH family = target + all unfiltered co-genes with valid P; not precomputed `q_by_gene` |

A missing applied term stays visible as a yellow reference labelled
`Not listed among observed carrier phenotypes`. Do not claim it is absent from
all metadata. Carrier phenotypes ⓘ must state the HPO-record population and
excluded empty/unavailable records.

## Private API contracts

| Route | Request | Required response/use |
|---|---|---|
| Existing `/phenotype-analyzer-api/analyze` | gene, terms, exact variant_id, score_type, affected_only | Existing variant association/mean/individual Z + standardization; never derive SD in browser |
| Existing `/phenotype-analyzer-api/co-gene-associations` | target + complete co-gene family, terms/settings | Full-family BH; do not restrict to visible rows |
| `POST /__pb_variant_carrier_metadata__` | gene, variant, sample_ids (1–100) | metadata by original carrier ID; failed IDs; `n_terms`, `n_terms_status`, `n_terms_source` |
| `POST /__gene_variant_hpo_counts__` | gene, variant_ids, hpo_terms | `match: any`; each variant: count, metadataCount, carrierTotal, complete |
| `GET /__pb_gene_genotypes__?gene=...` | gene; existing session access scope | rows `{variant_id,sample_id,gt,status}` + source version/hash/scope |

- Authenticate with existing BioIndex scope. Verify current authorized
  gene/variant carrier membership before returning sample data.
- Preserve source/build/auth-scoped cache. Metadata retains full `hpoIds` and
  observed-positive `observedHpoIds` separately; refresh legacy entries once.
- Variant metadata batches: first 5, then 96; progressive/partial updates.
  Keep interned immutable gene/HPO references; avoid reactive duplication.
- HPO reference count: distinguish Loading/Unavailable/partial; never treat a
  failed request as zero. Reject stale profile/variant responses.

## GT source and configuration

```text
/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/ref/dig-dug-portal/bioindex_handoff_20260907/sample_variant_gene.jsonl.gz
SHA-256: e602b847ccdba8961f788701b43004514346490f55164dd3023be23aa7c6bbc7
Release: 2025_crdc_16366_dp20_af001_20260907
Scope: GRCh38; nonsynonymous; DP >= 20; cohort AF < 0.01
```

```sh
python3 scripts/build_pb_genotype_index.py --source /private/sample_variant_gene.jsonl.gz --out /private/genotype-index
# Server environment:
PB_GENOTYPE_INDEX=/private/genotype-index
```

Join exact chr/position/REF/ALT AND canonical sample ID. Remove only the
terminal `_E38`/`_G38` suffix for source matching; return current carrier IDs.
Preserve phase, original allele indices, multiallelic and haploid GT. Missing,
partial/no-call or conflicting GT stays unavailable. Never infer 0/1 or 0/0.
Attach GT to variant-specific carrier records, not sample-only metadata.
Validate original source/packed-index hashes. Read one gene member per lookup;
retain at most five genes. Do not send the whole index to the browser.

## Persistent n_terms source and configuration

```text
pb_context_demo/20261007-5a9ab06cc/source/2025_crdc_15764sample_hpo_parent_expanded_binary.tsv.gz
SHA-256: eaa0ea2e218d300d4b9546ec238128e146237cee92a43350bc2846d5bd834ba6
Matrix: 15,764 samples x 6,440 HPO columns; parent-expanded binary rows
```

```sh
python3 scripts/build_pb_hpo_term_counts.py --hpo-matrix /private/approved_hpo.tsv.gz --output /private/hpo_term_counts.json
# Server environment (default: .pb-private-data/rphers/hpo_term_counts.json):
PB_HPO_TERM_COUNTS_FILE=/private/hpo_term_counts.json
```

Use the same approved matrix as rPheRS `raw ~ n_terms` residualization.
Rebuild/replace the lookup with each scoring release. The API reloads replaced
files and rejects missing/invalid sources instead of retaining stale counts.
`scoring_matrix` means a matrix lookup. Current Variant UI also displays 0 for
an explicitly empty phenotype record outside the matrix, labelled
`empty_phenotype_record`; this does not imply scoring eligibility. Other
missing samples/source counts stay unavailable. Do not describe this exception
as an observed all-zero matrix row.

## Hover/reference requirements

Use `PbGene2/referenceProvenance.js` text/official links and shared
`evidenceHelp.js`; retain `HelpTooltip`/`InfoRail`. Add the GT info icon to its
sample-table heading. No permanent methods paragraphs below tables.

| Source | Confirmed identifier |
|---|---|
| VEP | 115.1; cache 115; GRCh38.p14; GENCODE 49 |
| ClinVar | GRCh38 VCF 2025-08-24 (resource date, not download date) |
| gnomAD | Exomes v4.1 via Ensembl cache 115 |
| AlphaMissense / REVEL | Original provider precomputed hg38/GRCh38 scores via VEP 115.1 plugins; no invented release date |
| LoFTEE | GRCh38 plugin; HC/LC confidence |
| GT | Processed CRDC source/release/hash/scope above; preserve missing/conflict semantics |

## Acceptance commands

```sh
node scripts/test_pb_variant_layout.js
node scripts/test_pb_variant_profile_history.js
node scripts/test_pb_variant_carrier_statistics.js
node scripts/test_variant_carrier_metadata_endpoint.js
node scripts/test_variant_hpo_term_counts_source.js
node scripts/test_gene_variant_hpo_counts.js
node scripts/test_processed_genotypes.js
node scripts/test_pb_live_metadata.js
node scripts/test_gene_carrier_summary_endpoint.js
node scripts/test_gene_carrier_restart_cache.js
node scripts/test_pb_gene2_hpo_counts.js
python3 -m unittest scripts.test_pb_hpo_term_counts scripts.test_build_pb_genotype_index
NODE_OPTIONS=--openssl-legacy-provider npm run build -- --dest /private/build/pb-variant
```

Browser acceptance: saved profile history; 0/1 OR matches without score changes;
exact GT + source hover; DB source links; shared evidence/detail border;
HPO-only statistics denominator; empty/missing records; sample/project paging.
Known live example before later data changes: GJB2 chr13:20189005:CTG:C has two
carriers; Hearing abnormality gives HPO count 0, mean Z -0.549, beta -0.608,
P 0.540. Adding HP:0011897 gives OR count 1. Examples are not UI constants.

## Delivery boundaries

Commit code, builders, contracts and synthetic tests only. Exclude private
matrix/GT/index files, credentials, captures and unrelated Gene2/Sample work.
`.pb-private-data/` is gitignored and is not a public assets directory.
A successful frontend build/push does not install private indexes or deploy
these routes to the test/production server. Runtime inputs above are required.
