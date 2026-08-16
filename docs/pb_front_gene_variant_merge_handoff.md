# PB Portal Front, Gene, Variant, and Phenotype Implementation Handoff

- Updated: 2026-08-16
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
| PB Gene `Top phenotype associations` | `src/views/PbGene/mockData.js` in mock state; live adapter returns an empty array | Illustrative only | Connect the approved precomputed gene-HPO burden result source |
| PB Variant identity and exact carriers | Private BioIndex | Live-capable | Configure the private browser proxy and retain exact-variant resolution |
| HPO Context on Gene and Variant | Session context plus `POST /phenotype-analyzer-api/analyze` on demand | Implemented, service-dependent | Configure the existing analyzer service; do not run it automatically |
| Phenotype definition and ontology | Generated HPO reference | Implemented static reference | Deploy the generated artifact and its provenance metadata |
| Phenotype diseases, frequencies, criteria, and related genes | Generated Orphanet Product 4 and Product 6 reference | Implemented static reference | Deploy the generated artifact; external ORPHA and internal gene links must remain active |
| Phenotype `Top associated genes` | No live source | Unavailable | Connect the same precomputed gene-HPO result table used by PB Gene |
| Single-HPO CRDC statistics and samples | No live source | Unavailable | Connect the approved phenotype-profile endpoint |
| Multi-HPO CRDC summary and sample rows | Hard-coded illustrative values in `PbPhenotype/Template.vue` | Must be replaced | Remove all hard-coded values and connect the phenotype-profile endpoint |
| Multi-HPO Orphanet overlap | Generated Orphanet reference, client-side exact overlap | Implemented preview | Keep as exact overlap unless an approved semantic-similarity service replaces it |

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

The portal displays completed results; it does not run the burden analysis.
Use one approved result table and publish two query indexes over that same
table:

| Suggested private index | Query key | Consumer |
|---|---|---|
| `gene-hpo-burden-by-gene` | `gene_symbol` | PB Gene `Top phenotype associations` |
| `gene-hpo-burden-by-hpo` | `hpo_id` | PB Phenotype `Top associated genes` |

Both indexes must return the same rows. Required fields:

```json
{
  "gene_symbol": "SCN1A",
  "hpo_id": "HP:0001250",
  "hpo_label": "Seizure",
  "odds_ratio": 2.18,
  "ci_low": 1.60,
  "ci_high": 2.97,
  "p_value": 0.000001,
  "q_value_global": 0.0001,
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
- The result publisher, not the browser, applies the approved positive-effect,
  p-value, and global-FDR filters. The intended thresholds are `p < 0.05` and
  the analysis-approved global `q` threshold (`0.05` or `0.10`).
- Sort displayed rows by `q_value_global`, then `p_value`. Do not describe OR
  magnitude as a valid ranking across genes.
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
| `q_value_global` | `qValue` |

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
- [ ] Gene and Phenotype show the identical OR, p-value, q-value, and model N
      for the same gene-HPO pair.
- [ ] Gene-HPO rows are ordered by global q-value, then p-value.
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
6. one cross-page gene-HPO row proving identical OR/p/q/model N;
7. confirmation that all mock phenotype statistics and sample rows were removed.

## Related repository documentation

- `docs/pb_gene_production_integration_handoff.md`
- `docs/pb_gene_context_api_guide.md`
- `docs/pb_gene_context_api_review_checklist.md`
- `docs/bch_pb_variant_tier1_acceptance_note_20260801.md`
- `docs/pb_variant_engineering_integration_handoff.md`

Those documents contain page-specific history. This document is the current
cross-page implementation contract when they differ.
