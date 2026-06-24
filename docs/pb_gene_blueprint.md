# pb_Gene Search Blueprint

Date: 2026-06-24
Repository: `dig-dug-portal`

This document is a companion blueprint for the `pb_Gene.html` mockup. It follows the same architecture vocabulary as `docs/ARCHITECT_GUIDE.md`, but focuses only on the gene search result page.

The page is a gene-first cohort evidence view. It is designed to help a reviewer inspect one gene, understand the CRDC carrier evidence for that gene, and decide which variant or carrier group should be inspected next.

The shared browser build uses `mockData.js` fallback data. Local private testing
can use generated fixture data, but generated carrier-level fixtures should not
be pushed. A production implementation should replace the fixture bridge with a
backend API that returns the same page-shaped evidence.

The local generated fixture currently uses `PGD` when present. The page should
still be implemented as a gene-search result view; `PGD` is a development
default, not a hard-coded production gene.

---

## 1. Current Page Structure

| Page | URL | Entry | Template | Page model | Fixture adapter |
|---|---|---|---|---|---|
| Gene search result | `/pb_Gene.html` | `src/views/PbGene/main.js` | `src/views/PbGene/Template.vue` | `src/views/PbGene/pageModel.js` | `src/views/PbGene/fixturePipeline.js` |

The page is intentionally separate from the older `krVariant.html` mockup. It narrows the workflow to one searched gene, then lets the user move from gene-level evidence to variant-level evidence.

The page has three major blocks:

| Block | Purpose |
|---|---|
| Top block | Identify the searched gene with HGNC/NCBI reference context and summarize gene-level CRDC evidence |
| Middle block | Show the gene locus, exon model, variant positions, and carrier density |
| Bottom block | Show gene-level carrier summary and variant evidence rows |

---

## 2. Page File Convention

`pb_Gene.html` follows the same local page split used by the promoted portal pages.

| File | Role |
|---|---|
| `main.js` | Vue mount and page bootstrap |
| `Template.vue` | Rendered layout, controls, and block structure |
| `pageModel.js` | Computed values, filters, locus zoom state, display labels, and helper methods |
| `mockData.js` | Small fallback state when no generated fixture is available |
| `fixturePipeline.js` | Optional generated fixture import and state merge boundary |
| `portalGeneData.generated.js` | Optional local-only generated fixture for private testing; ignored in the shared branch |
| `style.css` | Page-local styling |

Generated fixtures are not the long-term API. They are a private/local bridge
for realistic payload testing before a backend endpoint exists. Shared branches
should still build from fallback mock data when generated carrier fixtures are
absent.

---

## 3. Evidence Semantics

Use the same evidence hierarchy as the shared portal architecture guide.

| Evidence layer | Meaning on `pb_Gene.html` |
|---|---|
| CRDC internal evidence | Current cohort carriers, affected/proband counts, gene carrier HPO profile, carrier demographics, variant carrier sets |
| Core rare disease reference | DDG2P and other curated gene-disease support shown as reference context |
| Secondary annotation | PanelApp and Reactome/WikiPathways support shown as secondary annotation |
| Variant annotation | gnomAD AF, AlphaMissense, REVEL, LOFTEE, ClinVar, and consequence fields for variants observed in the cohort |

Rules:

- CRDC internal evidence is primary.
- Gene reference annotation supports interpretation but should not hide CRDC evidence.
- Secondary annotation should not decide whether a CRDC carrier or variant is displayed.
- HPO category profiles summarize the carriers of the current gene or selected variant.
- Co-carrier genotype profiles are computed from the selected carrier set.
- Broad HPO anchors should not be displayed as evidence terms: `HP:0000001` and `HP:0000118`.
- ClinVar is classification context, not part of the variant severity score.
- Variant severity score is annotation-only: `LoFTEE HC -> 1`, else AlphaMissense, else REVEL.
- Genotype dosage can be used for sample-level gene burden, but variant score displays should not multiply by genotype.

---

## 4. Page Contract

### 4.1 Top Block

Purpose:

Show the searched gene identity, reference annotation, and compact gene-level CRDC evidence.

Expected evidence:

| Area | Data source category |
|---|---|
| Gene symbol and HGNC approved name | HGNC-backed `gene_basic_info` |
| Gene description | NCBI Gene summary in `gene_basic_info` |
| Gene location and build | Representative transcript exon coordinates |
| Cytogenetic location | HGNC `location` in `gene_basic_info` |
| Ensembl ID | Gene reference / exon reference |
| DDG2P, PanelApp, pathway rows | Gene annotation summary |
| Carrier, affected, proband, GenDx diagnosed counts | CRDC cohort carrier tables |
| Carrier phenotype profile | HPO terms among current gene carriers |
| Most severe observed variant / score | Variant annotations among current gene variants |
| Mean carrier burden | Mean of carrier-level max gene burden scores |

The gene identity block shows source labels inline:

```text
HGNC: phosphogluconate dehydrogenase
NCBI: 6-phosphogluconate dehydrogenase is ...
```

The locus title carries the build, genomic range, cytogenetic location, and span:

```text
PGD gene locus (GRCh38) chr1:10,399,064-10,420,511 (1p36.22; 21.4 kb)
```

Mean carrier burden is a gene burden summary. Match score is separate and is
not defined without an explicit phenotype or outcome context.

`GenDx diagnosed` is a top metric based on sample metadata
`diagnosed_flag`. The expanded carrier sample table also has a `GenDx` detail
column backed by `data/reference_db/crdc_diagnosed_20240716.tsv`. That detail is
joined by `sample_id`; it is not filtered to the searched gene because carrier
status and diagnostic gene are different concepts. If metadata and the diagnosis
detail file disagree, the carrier row shows `*` with a hover explanation while
the top metric remains metadata-based.

### 4.2 Middle Block

Purpose:

Show where the gene sits on the genome and where observed CRDC variants fall inside the gene.

Expected evidence:

| Area | Data source category |
|---|---|
| Exon model | Reference exon coordinates and reference sequence |
| Variant markers | Variant positions from CRDC sample variants |
| Carrier density | Per-position carrier counts across the gene |
| Zoom/base view | Reference sequence from the selected locus window |

The locus view should use one coordinate system. Whole-gene view emphasizes exon/intron structure and carrier density. Base-level view emphasizes local reference bases, queried position, and per-position carrier count.

### 4.3 Bottom Block

Purpose:

Let the user switch between gene-level carrier summary and selected variant-level carrier summary.

Expected evidence:

| Area | Data source category |
|---|---|
| Gene-level carrier summary | All current gene carriers |
| Variant-level carrier summary | Carriers of the selected variant row |
| Carrier phenotype profile | HPO category distribution for the active carrier set |
| Carrier genotype profile | Other genes observed among the active carrier set |
| Carrier demographics | Age, investigator/cohort, sex, affected/proband summaries |
| Variant evidence table | Variant rows observed in the current gene |
| Expanded carrier samples | Sample-level metadata for carriers of the selected variant |

The same UI panels should be able to summarize either the full gene carrier set or one selected variant carrier set. The active mode must be clear to the user.

Variant rows should show high-AF review flags when CRDC AF or gnomAD AF is
`>= 0.10`. This is a review warning for a rare-disease cohort, not an automatic
exclusion rule.

---

## 5. Backend API Principles

Recommended production endpoint:

```text
GET /api/pb-gene?gene={HGNC_SYMBOL}
```

The response should be page-shaped. The browser should not receive raw cohort-scale tables.

Top-level response groups:

```text
geneInfo
crdcEvidence
genomeWindow
variantRows
geneCarrierDemographics
geneLevelPhenotypeCategories
geneLevelCoCarrierGenes
```

Backend responsibilities:

- Resolve the requested gene symbol.
- Load prepared reference tables from `data/reference_db/` or the equivalent server-side reference database.
- Return one representative gene model for locus display.
- Join CRDC sample metadata, HPO terms, and variant calls by `sample_id`.
- Compute carrier counts, affected/proband counts, and carrier demographics.
- Compute gene-level and variant-level HPO category summaries.
- Use gene carrier count as the denominator for gene-level HPO profiles and
  selected variant carrier count for variant-level HPO profiles.
- Return an empty phenotype category array when a carrier set has no non-broad
  HPO terms; do not render blank category rows.
- Add carrier-sample GenDx detail from `crdc_diagnosed_20240716.tsv` and flag
  metadata/detail conflicts with `*`.
- Compute per-position carrier density for the locus view.
- Compute or return variant severity scores using `LoFTEE HC -> AlphaMissense -> REVEL`.
- Compute carrier-only mean gene burden if the burden metric is shown.
- Paginate or limit expanded carrier sample rows for production-scale cohorts.
- Return explicit unavailable values for data that cannot be calculated.

Frontend responsibilities:

- Render the page-shaped response.
- Manage local display state such as selected variant, zoom level, and filters.
- Keep labels, sorting, expansion, and visual hierarchy consistent.
- Avoid inventing unavailable evidence.

---

## 6. Known Limitations

Current mockup limitations:

- The shared branch uses synthetic fallback mock data.
- Private generated fixtures are static and represent one gene at a time.
- The local helper can generate fixtures for private development, but it is not a production API.
- Gene symbol alias resolution is not part of the current page contract.
- A searched gene can only render full CRDC evidence if carrier and variant data exist for that gene.
- Match score remains unavailable without an outcome or phenotype context.
- Full reference FASTA/GTF/TSV/BED-like artifacts are local or server-side reference inputs, not browser assets.
- Prepared reference tables already exist under `data/reference_db/`; production work should use them instead of adding browser-side downloads.

Production implementation should preserve the page semantics while replacing the fixture bridge with an API-backed data path.
