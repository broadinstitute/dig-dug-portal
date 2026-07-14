# pb_Gene BioIndex and Context API Handoff

Date: 2026-07-14
Page: `/pb_Gene.html?query={HGNC_SYMBOL}`

This is the entry point for Helen's implementation review. It records what the
current Gene Page reads from BioIndex, what the new context endpoint must
calculate, and which method decisions are still provisional.

## Review package

Read in this order:

1. `docs/pb_gene_live_handoff.md` — current frontend, BioIndex, and endpoint mapping.
2. `docs/pb_gene_context_api_guide.md` — calculation definitions and request/response contract.
3. `docs/pb_gene_context_api_review_checklist.md` — required statistical, data, and production sign-off.

Reference code:

| File | Role |
|---|---|
| `scripts/rphers_fast.py` | Calculate one `phenotype_match_score_resid` value for every analysis sample. |
| `scripts/context_api_fast.py` | Calculate variant Match Scores, construct gene burden X, fit the provisional burden model, and calculate BH-FDR. |
| `scripts/test_rphers_fast.py` | HPO scoring and residual tests. |
| `scripts/test_context_api_fast.py` | Variant mean, binary-carrier burden, RLM, and BH tests. |

`scripts/pb_gene_context_validation.py` and its tests are local validation
support. They are useful for method review but are not the production API.

## Run the current shared page

Use the private BioIndex host through the development proxy:

```bash
BIOINDEX_HOST_PRIVATE=http://100.80.30.199:5000 \
NODE_OPTIONS=--openssl-legacy-provider \
./node_modules/.bin/vue-cli-service serve --port 8090 --host 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8090/pb_Gene.html?query=DMD
```

This command verifies the Gene Page and live BioIndex fields. Running a real
HPO context calculation also requires the production context service to be
connected through `PHENOTYPE_ANALYZER_HOST_PRIVATE` or an equivalent deployed
route for `/phenotype-analyzer-api/analyze`.

## End-to-end data flow

```text
HGNC gene query
  -> BioIndex gene + gene-variants2 + complete gene-samples continuations
  -> Gene Page identity, locus, carrier, variant, annotation, and Pathogenic Score fields

HPO list
  -> full-CRDC phenotype scoring engine
  -> one phenotype_match_score_resid value per analysis sample (Y)

complete gene-samples rows + full ordered Y
  -> variant carrier means
  -> Match Score (Context-based), one value per variant
  -> binary-carrier Pathogenic Score sums (X), one value per sample
  -> provisional Huber RLM Y ~ X + C
  -> gene-level Beta, P-value, FDR/status

aggregate response only
  -> /phenotype-analyzer-api/analyze
  -> context result row and Variant Table Match Score column
```

Patient-level Y, HPO, or genotype data must not be returned to the browser by
the context endpoint.

## Runtime connection

| Layer | File or route | Role |
|---|---|---|
| BioIndex dev proxy | `vue.config.js` | Proxies `/__bioindex_private__` when `BIOINDEX_HOST_PRIVATE` is set. |
| BioIndex client | `src/utils/bioIndexUtils.js` | Queries private BioIndex and follows `/api/bio/cont` continuations. |
| Gene Page adapter | `src/views/PbGene/pbGeneBioIndexAdapter.js` | Joins carrier evidence with matching annotation rows and creates page state. |
| Context route | `POST /phenotype-analyzer-api/analyze` | Accepts gene, HPO terms, and Advanced options; returns aggregate Match Scores and gene burden statistics. |
| Page state | `src/views/PbGene/pageModel.js` | Sends the context request and merges aggregate scores into existing live variant rows. |
| Rendering | `src/views/PbGene/Template.vue`, `style.css` | Displays HPO controls, results, BioIndex evidence, and context-dependent Match Scores. |

## BioIndex mapping

The Gene Page currently queries each index by HGNC gene symbol:

| BioIndex index | Current use |
|---|---|
| `gene` | Best available gene name, description, chromosome, coordinates, and identifiers. |
| `gene-variants2` | Variant annotation supplement when its canonical variant ID matches a carrier variant. It does not create a CRDC evidence row without carrier evidence. |
| `gene-samples` | Source of CRDC carrier/sample rows, unique carriers, displayed variants, GT, CRDC frequency, consequence, ClinVar clinical significance, LoFTEE, AlphaMissense, REVEL, `pathogenicity_score`, and `score_source`. It is also the input for carrier grouping and gene burden X. |

The shared BioIndex helper must consume all continuation pages. A first-page or
UI pagination subset is not a valid input for counts, Match Scores, or gene
burden.

## UI field mapping

| UI field | Source or calculation |
|---|---|
| Gene title | Requested HGNC gene symbol. |
| HGNC name and NCBI description | `gene` row when available. |
| Location/build | `gene` coordinates, then tracked exon reference or observed variant positions; build is GRCh38. |
| CRDC cohort | Cohort denominator field when provided; otherwise explicit `Unavailable`. |
| Gene carriers | Distinct `gene-samples.sample_id` values. |
| Affected / Proband | Carrier flags when provided; otherwise explicit `Unavailable`. |
| Largest contributing clinical area | Investigator/cohort-to-public-clinical-area summary when provided; otherwise explicit `Unavailable`. |
| Variants in this gene | Distinct carrier variant IDs from complete `gene-samples` results. |
| CRDC carrier frequency | Person-level carrier frequency supplied or derived by the backend. Do not label it allele frequency. |
| Classification | ClinVar clinical significance fields only; keep the external ClinVar link when unavailable. |
| Pathogenic Score | Fixed variant-level biological score; current display precedence is LoFTEE HC = 1, else AlphaMissense, else REVEL. |
| Match Score (Context-based) | Mean `phenotype_match_score_resid` across all unique carriers of each variant. |
| Beta / P-value | Gene-level context burden regression result returned by the context endpoint. |

Tracked reference data remains separate from BioIndex:

| UI area | Tracked source |
|---|---|
| DDG2P, PanelApp, pathways | `data/reference_db/gene_annotation_summary.tsv` and generated reference module. |
| Gene locus exon model | `data/reference_db/gene_exon_coords.tsv` and generated reference module. |

## Context endpoint contract

Request:

```json
{
  "terms": "HP:0001250,HP:0000133",
  "gene": "DMD",
  "advanced": {
    "significance_metric": "p_value",
    "significance_threshold": 0.05,
    "min_carriers": 5
  }
}
```

Response shape:

```json
{
  "query_hpo": ["HP:0001250", "HP:0000133"],
  "gene": "DMD",
  "analysis_sample_count": 12438,
  "variant_match_scores": {},
  "gene_burden": {
    "beta": 0.184,
    "standard_error": 0.051,
    "p_value": 0.00031,
    "fdr": 0.00124,
    "n_samples": 12438,
    "n_positive_burden": 84,
    "min_carriers": 5,
    "status": "ok",
    "model_version": "portal_huber_rlm_v0"
  }
}
```

The complete calculation, status values, Advanced validation, and FDR rules are
defined in `docs/pb_gene_context_api_guide.md`.

## Production readiness boundary

The Python code is a reviewable reference implementation, not a complete HTTP
service and not a statistically approved final model.

The following decisions remain open and must not be hidden during handoff:

1. `portal_huber_rlm_v0` currently uses MASS `summary.rlm`-style standard errors and a two-sided normal approximation. It is not HC3.
2. Covariates are currently empty. Age band, sex, and PC1-PC10 require a versioned method decision and parity validation before use.
3. `min_carriers` currently gates on samples with X > 0. This may differ from the number of actual carriers when scores are zero or missing.
4. The exact Pathogenic Score provenance, version, valid range, and missing-score policy require data-owner sign-off.
5. The FDR family must be request-scoped and explicitly returned. The BH helper exists, but production response assembly is not implemented here.
6. Production uses the complete current Gene Page carrier-variant set from BioIndex. The private CEP152/DMD validation used a nonsynonymous evidence subset and must not silently redefine the production variant universe.

See `docs/pb_gene_context_api_review_checklist.md` for the full approval list.

## Explicitly unavailable today

The current tested BioIndex rows do not consistently provide affected/proband
flags, public clinical-area mappings, cohort denominator, age, sex,
investigator, GenDx detail, sample HPO terms, or co-carrier genes. The UI must
show an explicit unavailable or empty state rather than fabricated values.

## Privacy and sharing boundary

Do not commit or send:

- original VCF or HPO matrices;
- real sample IDs or patient-level residuals;
- private sample/variant audit tables;
- `/private/tmp/cep152_dmd_context_validation.json`;
- any private source path or checksum that is not needed to implement the API.

The aggregate CEP152/DMD results are local validation evidence only. Helen's
implementation should follow the documented endpoint contract and validate it
against approved backend data.

## Verification snapshot

Checked locally on 2026-07-14:

- 32 context, calculation, validation, and UI tests passed.
- `npm run build` completed with the pre-existing `tabix-reader` warning.
- `git diff --check` passed.
- No private VCF, HPO matrix, sample-level audit, or aggregate validation fixture was added to Git.
