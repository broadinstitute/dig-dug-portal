# pb_Gene Live BioIndex Handoff

Date: 2026-07-10
Page: `/pb_Gene.html?query={GENE}`

This note documents the current shareable branch state for the `pb_Gene` mockup.
It is meant for handoff/review, not as a final production API contract.

## How to Run

Use the private BioIndex host through the dev-server proxy:

```bash
BIOINDEX_HOST_PRIVATE=http://100.80.30.199:5000 NODE_OPTIONS=--openssl-legacy-provider ./node_modules/.bin/vue-cli-service serve --port 8093 --host 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8093/pb_Gene.html?query=DMD
http://127.0.0.1:8093/pb_Gene.html?query=EGFR
http://127.0.0.1:8093/pb_Gene.html?query=SCN1A
```

The page should respond to the searched gene. It should not stay fixed on the
old mock gene.

## Runtime Connection

The private connection is intentionally scoped to this dev build.

| Layer | File | Current role |
|---|---|---|
| Dev proxy | `vue.config.js` | When `BIOINDEX_HOST_PRIVATE` is set, proxies browser requests through `/__bioindex_private__`. |
| BioIndex client | `src/utils/bioIndexUtils.js` | Replaces `BIO_INDEX_HOST_PRIVATE` at build time and uses it when `query_private: true`. |
| pb_Gene adapter | `src/views/PbGene/pbGeneBioIndexAdapter.js` | Calls private BioIndex and converts rows into the page-shaped state. |
| Page state/rendering | `src/views/PbGene/pageModel.js`, `Template.vue`, `style.css` | Displays live gene-level and variant-level evidence. |

The adapter currently queries:

| BioIndex index | Query | Used for |
|---|---|---|
| `gene` | HGNC gene symbol | Best available gene identity fields from BioIndex. This is partial for some display fields. |
| `gene-variants2` | HGNC gene symbol | Variant annotation supplement when it matches a carrier variant. Variants that have no `gene-samples` carrier rows are not shown in the CRDC evidence table. |
| `gene-samples` | HGNC gene symbol | Carrier/sample variant rows, unique carrier counts, genotype, CRDC AF, consequence, LoF/REVEL/AlphaMissense/pathogenicity fields. This is the source of the displayed variant evidence rows. |

The shared BioIndex helper follows `/api/bio/cont` continuations, so the page is
not limited to the first BioIndex response page.

## Tracked Reference Data

Some data shown on the page is not coming from the live BioIndex response yet.
Those references are tracked in the branch so Helen can reproduce them after a
pull.

| UI area | Source files | Notes |
|---|---|---|
| DDG2P, PanelApp, pathway rows | `src/views/PbGene/geneAnnotationReference.js`, `src/views/PbGene/geneAnnotationReference.generated.js` | Generated from `data/reference_db/gene_annotation_summary.tsv` by `scripts/build_pb_gene_annotation_reference.js`. |
| Exon model in the locus block | `src/views/PbGene/geneExonReference.js`, `src/views/PbGene/geneExonReference.generated.js` | Generated from `data/reference_db/gene_exon_coords.tsv` by `scripts/build_pb_gene_exon_reference.js`. |

These are sanitized/reference-style data, not the old fixed carrier fixture.

## Current Field Mapping

| UI field | Current source |
|---|---|
| Gene title | Requested query gene. |
| HGNC name | `gene` BioIndex row when available. |
| NCBI description | `gene` BioIndex row when available; otherwise explicit unavailable text. |
| Location/build | Gene BioIndex coordinates if available, otherwise tracked exon reference and observed variant positions. Build label is `GRCh38`. |
| Current carriers | Unique `sample_id` values from `gene-samples`. |
| Variants in this gene | Distinct carrier variant ids from `gene-samples`. |
| CRDC AF | First available of `crdc_vcf_af`, `crdcAF`, `cohortAF`, `cohort_AF_dp20`, `cohort_af_dp20`, `AF`. |
| Variant severity score | `LoFTEE/LoF HC -> 1`, else AlphaMissense, else REVEL. |
| Most severe observed variant | Highest annotation-only variant severity score among current rows. |
| Variant evidence table | Live carrier variant rows from `gene-samples`, default-sorted by variant score descending, ten rows at a time. |

## Explicitly Unavailable or Empty Today

These values are intentionally not mocked. They are empty/unavailable because
the currently tested private BioIndex responses do not expose the required
sample-level metadata or phenotype data.

| UI field | Current display | Reason |
|---|---|---|
| Affected count | `Unavailable` | `gene-samples` rows tested so far do not provide `affected_flag` or equivalent sample-level metadata. |
| Proband count | `Unavailable` | `gene-samples` rows tested so far do not provide `proband_flag` or equivalent sample-level metadata. |
| GenDx diagnosed count | `Unavailable` | `gene-samples` rows tested so far do not provide `diagnosed_flag`; no built `patient` index was available during testing. |
| Carrier demographics by age/sex/investigator | `No sample metadata available` | Current rows do not include age, sex/gender, investigator/cohort/study fields. |
| Gene-level carrier phenotype profile | `No HPO category data` / empty profile | Current live response does not include sample-level HPO terms for gene carriers. |
| Variant-level phenotype profile | Empty profile | Same sample-level HPO limitation. |
| Co-carrier gene summary | `No co-carrier gene summary` | Current rows do not include a co-carrier summary. |
| Match score | `no context` / unavailable | A match score needs a phenotype or outcome context; this gene search page does not currently have one. |
| Some OMIM / Ensembl fields | `Unavailable` | Not consistently available in the current `gene` BioIndex response used by this page. |

Note: `gene-variants2` may expose variant-level HPO-like aggregate fields in
some rows, but that is not the same as sample-level HPO/category data for the
current carrier set. The page leaves the carrier phenotype cards empty rather
than mixing incompatible semantics.

## Verification Snapshot

Checked locally on 2026-07-10:

- `npm run build` completes with the pre-existing `tabix-reader` warning.
- `DMD` loads live carrier/variant counts from private BioIndex.
- The variant evidence table defaults to variant score descending.
- Classification consequence text wraps inside the classification column.
- Missing sample metadata is shown as an empty state, not as fake `Unavailable N` bars.
