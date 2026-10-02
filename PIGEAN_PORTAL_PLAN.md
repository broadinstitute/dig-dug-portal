# PIGEAN method page and results portal

Status: implemented locally; see `src/views/PIGEAN/Method/README.md` for editing and validation.
Updated: 2026-09-15.

## Agreed direction

Build one statically hosted PIGEAN method page in DIG-DUG, following the EAGGL
template and the requested navigation: PIGEAN title beside Abstract / Explorer /
Documentation / Usage guide. Written content appears in a card; Explorer has
its own full-width workspace. HTML, JavaScript, CSS, and supporting JSON/Markdown
files may be served over HTTP. A single inlined file and `file://` support are
not required.

Use the Explorer and its interaction design from `pigean-flannick` as the
reference. Make `cfde-inc-v2`, `small`, and `large` explicit model choices. Fetch
scientific results from their respective BioIndex hosts; maintain a separate
versioned catalog for discovery and fuzzy search.

## Inspected sources

- DIG-DUG branch `chase/pigean-page`, commit `95df3613b`: currently the same
  commit as local `dk-bird-methods-kp`; EAGGL template is already present.
- `src/views/EAGGL/{Template.vue,main.js,store.js}`: method-page layout and
  shared portal header/footer setup.
- `vue.config.js`: Vue multi-page build; existing legacy PIGEAN pages live at
  `pigean/index.html`, `gene.html`, `geneset.html`, and `phenotype.html`.
- `src/utils/bioIndexUtils.js`: host overrides, queries, and continuation handling.
- `src/components/Documentation.vue` and `src/utils/documentationUtils.js`:
  existing Markdown rendering and HTML sanitization, with `defaultContent` support.
- `src/components/PigeanPlot.vue`, `PigeanTable.vue`, and
  `src/components/researchPortal/PIGEAN/`: existing visualization/component patterns.
- Sibling `pigean-flannick`, branch `chase/portal`, commit `c1d98bd5`:
  `src/pigean/portal_assets.py`, `portal_assets_common.py`,
  `portal_compare_assets.py`, `portal_db.py`, `portal_compare.py`,
  `portal_server.py`, and `docs/PIGEAN_PORTAL.md`.
- Sibling `reveal-mechanisms`: `docs/api-discovery.md`,
  `data/cfde/indexes.json`, and the September 15 T2D fixtures/manifests.

The existing PIGEAN knowledge graph does not contain the newer portal modules;
the migration findings above were checked against source files directly.

## Page and component structure

Entry: `src/views/PIGEAN/Method/`, producing `/pigean-method.html`. This distinct
filename avoids a clean-URL collision with `/pigean/` on case-insensitive hosts.
Preserve existing `/pigean/*.html` routes
during migration. Integrate into the bird-method navigation when its owning
navigation configuration is confirmed.

Page navigation:

1. **PIGEAN title:** expanded name beside the four section tabs.
2. **Abstract:** supplied text and figure in a reading card.
3. **Explorer:** model and phenotype selection, gene lookup, plots, entity
   details and comparison in a full-width workspace.
4. **Documentation / Usage guide:** separate Markdown articles in reading cards.

Keep app state in URL parameters/hash: model, phenotype, view, selected gene or
gene set, and comparison selections. Opening a detail sheet or changing views
must not navigate to another HTML entry. Reload, shared links, and browser
back/forward should restore the visible state.

Port the existing interactions into Vue components. Reuse BootstrapVue tables,
tabs and controls and the existing D3 visualization utilities where they fit.
The source portal embeds JavaScript in Python strings, uses global DOM IDs and
body styles, and loads Plotly separately; it cannot simply be pasted into the
EAGGL template. Audit `PigeanPlot.vue` for standalone props/events before reuse:
it currently includes legacy store and navigation assumptions. Keep chart
behavior parity explicit if replacing the source portal's Plotly plots.

Suggested code locations:

- `src/views/PIGEAN/Method/`: page entry, template, Vuex wiring.
- `src/components/researchPortal/PIGEAN/`: Explorer, detail sheet, Comparer,
  and method-specific controls, following the existing feature organization.
- `src/utils/pigeanPortalApi.js`: model-specific queries and row normalization,
  using the shared BioIndex transport.
- `src/utils/pigeanPortalUtils.js`: normalization, search ranking and comparison;
  `pigeanPortalApi.js` also loads and validates the registry.
- `public/pigean/content/`: Markdown and figure assets for the three tabs.
- `public/pigean/registry/`: versioned search catalogs/manifests.

## Runtime architecture

```text
Static HTTP host
  pigean-method.html + compiled JS/CSS
  method content + figures
  versioned registry JSON
             |
             v
  Browser: Vue UI, fuzzy search, filtering, plots, detail sheets
             |
             v
  PIGEAN data adapter: model -> host + exact query-key layout
          /                                      \
  CFDE BioIndex                             Production BioIndex
  cfde-inc-v2                               small / large
```

### Registry sidecar

The source portal already performs fuzzy matching in browser JavaScript:
`fuzzyScore()` ranks exact, prefix, substring, and in-order subsequence matches.
Trait search covers IDs/names/portal IDs and ontology identifiers/labels; gene search operates over downloaded
run genes. This is not edit-distance typo correction or semantic search.

Start with a **generated static registry sidecar**, served beside the page. It
can preserve the existing search ranking without a continuously running search
service. Generate it from BioIndex catalogs and phenotype metadata; keep its
contents separate from scientific result rows. Do not make users download all
gene scores merely to discover a phenotype or gene.

The implemented catalog (schema 2) carries names and search terms; the separate
`phenotypes.json` sidecar preserves the full v0.0.1 data model: 8,402 phenotype
records and 24,050 ontology assertions. It records source revision and SHA-256.
The lookup resolves 3,775 of the 3,778 advertised CFDE keys using exact legacy
or PIGEAN IDs, unique embedded Orphanet IDs, or unique GWAS Catalog hyphen
variants. Original query keys are never rewritten. Three unresolved Orphanet
keys retain their identifiers. Duplicate/ambiguous aliases are not selected.
Result headers, comparisons, entity sheets, cross-trait tables/plots, and
search all consume this metadata. Mapping predicates, source confidence,
justification, and provenance remain visible; broad matches are not synonyms.

Registry fields should include:

- Schema version, generation time, source host, model, source index build times.
- Exact phenotype query keys, display names, portal IDs, trait groups and
  available model/configuration combinations.
- Searchable gene and gene-set identifiers, labels, and verified aliases;
  model-specific availability and optionally separate shards for larger catalogs.
- Explicit query dimensions, including sigma where applicable.
- Capability states per model/index: available, unavailable, or unverified.

Keep display normalization separate from canonical query keys, including the
recorded CFDE capitalization anomaly. Generate each release atomically, retain
its source manifest/checksums, and give caches a release/version key. Probe
gene/gene-set phenotype catalogs independently: the 3,778 CFDE factor keys are
not proof of exhaustive Explorer phenotype coverage.

If catalog size or refresh requirements justify a service, serve the same
registry contract behind a small read-only search API. Measure catalog size and
browser search latency first. A service would own catalog refresh, cached search
and capability discovery; the browser would still query BioIndex for scores.
If a target host cannot support browser CORS, resolve that deployment issue
explicitly; a proxy would be an additional responsibility for the sidecar.

## BioIndex contracts and model differences

### CFDE: verified from supplied local source snapshots

Host: `https://cfde-dev.hugeampkpnbi.org`; model: `cfde-inc-v2`.

- Genes: `pigean-gene-phenotype`, keys `(phenotype, model)`.
- Gene sets: `pigean-gene-set-phenotype`, keys `(phenotype, model)`.
- Gene across traits: `pigean-gene`, keys `(gene, model)`.
- Gene set across traits: `pigean-gene-set`, keys `(gene_set, model)`.
- Factor context: `pigean-factor`, keys `(phenotype, model)`.
- Factor detail: `pigean-gene-factor` / `pigean-gene-set-factor`,
  keys `(phenotype, model, factor)`.
- Joined context: `pigean-joined-gene` / `pigean-joined-gene-set`,
  keys `(phenotype, gene_or_gene_set, model)`.

Membership catalogs currently advertise only `cfde`, not `cfde-inc-v2`.
Do not switch models automatically. The existing `GeneSet2Phenotype` component
and PIGEAN gene-set page use `pigean-joined-gene-set` to display genes in a set
for the selected phenotype. The Explorer uses that same query for highlighting
and labels these as genes returned for the set in the current phenotype. This
can be a subset of full membership and does not supply weighted loadings.

### Small / large: validated with live T2D responses

Host: `https://bioindex.hugeamp.org`.

- The supplied example and existing phenotype store use
  `pigean-gene-phenotype`, keys `(phenotype, sigma, model)`; initial sigma is 2.
- Existing store code uses the same key layout for
  `pigean-gene-set-phenotype`.
- Existing cross-trait gene/gene-set stores use
  `(trait_group, gene_or_gene_set, sigma, model)`.
- Existing phenotype discovery uses `pigean-phenotypes` with `q=1`.

The implementation retrieved complete live T2D results for both models in the
browser, including continuations. Small returns 43,264 distinct gene identifiers
and 1,035 gene sets; Large returns 2,835 gene sets. Cross-trait browsing queries the four non-HPO production trait groups; HPO rows are excluded from mixed responses as well. An intermittent Large fetch
failure succeeded on retry. Initial command-line 403 responses during planning
did not represent the browser's access. Full membership coverage is separate from score availability. Phenotype-specific
joined records support scoped highlighting, without reconstructing loadings.

### Adapter rules

- Keep a model configuration registry; never assume the same endpoint name
  implies the same positional keys across hosts.
- Encode the entire `q` query parameter once. Cache by host, model, sigma,
  phenotype/entity key, index, and data/registry version.
- Use a stable dataset/configuration identity. The source portal supports
  multiple runs/seeds, while these APIs may expose only published configurations.
  Only offer a run/seed selector when the source actually supplies that dimension.
- Preserve `prior`, `log_bf`, `combined`, `beta`, `beta_uncorrected` and source
  values. Keep unavailable HuGE scores, parameters, ranks and loadings absent;
  never derive or zero-fill them to make a component render.
- CFDE `source` is the gene-set library/source; CFDE `label` is factor context.
  The SQLite portal's `label` means library. Normalize to distinct `library`
  and `factorLabel` fields; retain original rows for provenance.
- Retain distinctions between gene-set ID, factor label and display title.
- Return records with coverage metadata, source query and capability state;
  distinguish unsupported, empty, restricted, failed and incomplete results.
- Cancel or ignore stale requests when selections change; never display rows
  from the previous model underneath a newly selected model label.

### Pagination is a correctness requirement

The CFDE capture established that `limit` caps results; it is not merely a page
size. A capped response can have no continuation while bytes remain unread.
The supplied production `limit=500` example is therefore a sample, not evidence
of full coverage.

For complete datasets, omit the cap, follow continuations on the same host,
check repeated tokens and errors, and inspect progress/restriction metadata.
The existing shared client already follows continuations but returns only rows;
its current non-200 handling can return empty/partial data, and the continuation
loop needs failure/repeated-token guards. Add a backward-compatible path that
exposes coverage and rejects failed or incomplete full-data requests. Review
that shared change separately because other portal pages use this utility.

## Feature migration sequence

The sequence below records the original design and possible extensions. The
current implementation and scope are described in `src/views/PIGEAN/Method/README.md`.
The shipped registry contains phenotype discovery; global entity/alias catalogs
and a hosted refresh service remain potential extensions. Gene and gene-set
search operate on the selected phenotype's downloaded records.

### 1. Confirm the contracts and capture fixtures

Capture catalog plus small, large and CFDE T2D responses, preserving host,
query, build date, continuation behavior, coverage and exact fields. Establish
capabilities for metadata, genes, gene sets, cross-trait results, memberships,
parameters and ranks. Use the existing CFDE fixtures as regression inputs.

Done when each UI feature has a verified source or an explicit unavailable
state, and required model identities cannot collide.

### 2. Build the method page and authoring path

Register `/pigean-method.html`; add documentation tabs, local content loading, section
links and a featured-app container. Keep draft status explicit until author
review. Shared header/CMS loading failures must not prevent access to local
content or the app.

Done when the page builds and loads from static HTTP hosting and content can be
edited without changing Vue templates.

### 3. Deliver the Explorer vertical slice

Model/trait selectors and fuzzy lookup; direct-versus-indirect support scatter;
sortable/filterable gene and gene-set tables; linked point/row selection;
detail sheet; across-trait plots; model-specific loading, empty and error states.
The scatter and gene table occupy the left column, with gene sets on the right;
the panels stack on narrow screens. Selecting a set highlights returned genes
with larger white-ringed points that retain their combined-support Viridis
colors; table rows use purple accents. An individual gene selection adds an
orange outline and label. A right-side
sheet shows details and related records; closing it preserves selection.
The hash stores both identifiers and the sheet state for sharing and history.
Highlighting uses actual phenotype-specific relationships from the same model.
The Explorer defaults to direct support >= 0 and combined support >= 1, with
no indirect-support minimum. Filtering precedes scatter and table construction;
the complete source response remains cached for threshold changes. The current
BioIndex query contract exposes q/fmt/limit, not score predicates, so this
reduces rendering work without claiming lower network transfer or truncating
continuations. HPO traits are excluded from discovery and cross-trait views.

Done when all three models load verified data, selection changes and URL state
are reliable, and unavailable features are explained in the relevant panel.

### 4. Add Comparer within the same page

Port independent A/B selection, score and rank comparisons, overlap/correlation
summaries, scatter views, presence filters, and parameter differences where
supported. Use the same normalized data layer.

The current portal computes competition ranks over full original files before
thresholding, and uses average ranks for Spearman correlations. BioIndex may
already have filtered those original files. Do not claim equivalent full-model
ranks or correlations from a truncated response. Require complete exposed
datasets plus an explicit interpretation, or source/precomputed full-model ranks
for exact original behavior. Missing rows mean “not present in returned data,”
not a score of zero or proof of no association. Label within-model and
cross-model comparisons with the selected populations and metrics.

Done when summaries match reference calculations for a defined population and
the page states when only source-exposed results can be compared.

### 5. Integrate and publish

Connect navigation, finish reviewed content/figures, validate the registry
refresh process, then publish through the portal branch workflow. Portal work
targets the bird-methods branch; it must not be merged back into master as a
portal-specific change. Any generally useful transport fixes can follow the
repository's separate shared-feature workflow.

## Content drafting and inclusion

Keep three reviewed Markdown sources under `public/pigean/content/`, loaded as
text by the page and rendered with the existing `Documentation.vue` renderer.
Keep figures beside them with stable asset URLs and meaningful alt text.
Local content makes the first prototype independent of CMS editing/access.
The component's existing content-map override can support CMS publishing later.

### Abstract — method owner writes; agent integrates

Target roughly 150–250 words: biological problem, evidence inputs, what PIGEAN
estimates, and what the outputs enable. Use the owner's approved terminology
and claims; add a publication/citation only when supplied or verified.

Figure brief: human-genetic evidence and gene annotations/gene sets feeding the
PIGEAN model, with gene support and gene-set effects as outputs. Match the app's
direct/indirect/combined terminology. The owner reviews the scientific mapping
before the final SVG/PNG is produced. Include a caption explaining the arrows.

### Documentation — method owner drafts; agent structures and cross-checks

Outline:

1. Method overview and intended questions.
2. Accepted evidence and gene-set inputs.
3. Statistical model and fitting overview.
4. Definitions/interpretation of displayed scores, units and log scales.
5. Differences between CFDE, small and large model configurations.
6. Data versions, filtering/coverage, assumptions and limitations.
7. Reproducibility, citations and links to the full mathematical methods.

Use `pigean-flannick/docs/methods.tex` as the mathematical source of truth;
publish a readable web summary with links to the reviewed full methods.
Do not copy LaTeX directly into the current Markdown renderer and assume
equations will render; choose equation rendering or an approved export if
equations are needed inline.

### User guide — adapt existing material

Retain `docs/PIGEAN_CLI_REFERENCE.md` as the canonical command-line manual.
Reuse `docs/PIGEAN_PORTAL.md` for the web workflow, updating the SQLite/run
terminology to reflect the published BioIndex configurations.

The visible tab should start with the portal workflow: choose a model and
phenotype, interpret the scatter, inspect genes/gene sets, explore across traits,
and share a selection. Add comparison instructions with the Comparer milestone.
Link to a pinned/versioned CLI guide for running PIGEAN yourself. Replace
build/serve instructions in the public portal walkthrough with the actual
hosted-page workflow. Capture screenshots only after UI behavior stabilizes.

### Review workflow

Outline -> owner draft -> agent integrates assets/links -> owner scientific
review -> static preview/link/accessibility checks -> publication.

Record source commit, content revision and review status together so the web
guide and scientific documentation do not silently drift from the implementation.

## Validation and remaining decisions

- Existing repository commands: `npm ci`, `npm run build`, `npm run preview`.
  No new command is assumed to exist. Dependencies are not installed in this
  checkout at the time of planning.
- Adapter fixtures: positional keys, host selection, full continuation reads,
  cap detection, restricted/failed/empty results, label/library differences,
  missing fields and stale-request suppression.
- Regression checks: existing portal threshold/ranking/comparison tests supply
  behavioral references; no need to rerun statistical inference for this port.
- Browser smoke tests: all three models, linked detail views, keyboard search,
  reload/back/forward, static hosting without DIG-DUG server, CMS failure,
  production CORS including the client's access-token header, mobile layout,
  and the existing index/phenotype/region/variant/gene routes.
- Measure complete-response size and browser responsiveness before deciding
  between browser search/analysis, a worker, precomputed summaries or service work.
- Pending: successful production catalog/response access, model descriptions,
  full-run/rank/parameter availability, navigation ownership and final author text.
- DisMech and a mechanism knowledge graph are outside this PIGEAN migration;
  the supplied inventory is useful evidence for the CFDE API contracts.
