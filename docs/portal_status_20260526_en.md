# CRDC Rare Disease Portal Current Status

Date: 2026-05-26  
Repository root: this `dig-dug-portal` repository

This document records the current implementation status of the portal mockup. It is not the DB build guide and not the API specification.

---

## 1. Active Main Pages

| Page | URL | Entry | Current status |
|---|---|---|---|
| Front | `/krFront.html` | `src/views/KrFront/main.js` | Current main search entry page |
| Sample | `/krSample.html` | `src/views/KrSample/main.js` | Current sample-centered evidence page |
| Phenotype | `/krPhenotype.html` | `src/views/KrPhenotype/main.js` | Current phenotype search result page |
| Variant | `/krVariant.html` | `src/views/KrVariant/main.js` | Current promoted DB-connected variant page |

Older candidate or archived pages may exist, but the four routes above are the current comparison baseline.

---

## 2. Shared Data Assets

The shared sample-free reference DB is now expected under the repository:

```text
data/reference_db/crdc_reference_db_tables.rds
```

This folder also contains table-level RDS/TSV files for HPO, MONDO, disease profiles, gene annotations, DDG2P, PanelApp, and pathway annotation.

Current test portal DBs are local build artifacts and should not be treated as the main DB. If a developer creates a test DB, it should be placed in a local output folder and not overwrite `data/reference_db`.

---

## 3. Current Fixture Integration

The browser still does not read RDS directly. The current mockup uses generated JavaScript fixtures.

Current generated fixture files:

```text
src/views/KrSample/portalSampleData.generated.js
src/views/KrPhenotype/portalPhenotypeData.generated.js
src/views/KrVariant/portalVariantData.generated.js
src/views/KrVariant/portalVariantNewData.generated.js
```

Current adapters:

```text
src/views/KrSample/mockData.js
src/views/KrPhenotype/mockData.js
src/views/KrVariant/mockData.js
```

The generated fixture is applied on top of the fallback mock state. Therefore, if a DB-derived field is missing, fallback mock values may still be visible.

---

## 4. Current Front Page Status

Main files:

```text
src/views/KrFront/main.js
src/views/KrFront/Template.vue
src/views/KrFront/style.css
```

Current role:

- Search entry point.
- Provides sample, phenotype, and variant/gene workflow entry points.
- Shows context setup area.
- Communicates CRDC-first interpretation logic.

Known status:

- Current front page is the promoted main version.
- The page should link to main routes, not archived or candidate routes.
- Context setup is still client-side.

---

## 5. Current Sample Page Status

Main files:

```text
src/views/KrSample/main.js
src/views/KrSample/Template.vue
src/views/KrSample/mockData.js
src/views/KrSample/portalSampleData.generated.js
src/views/KrSample/style.css
```

Current role:

- Sample-centered evidence hub.
- Shows sample metadata, HPO profile, GenDx status, similar samples, similar genotype evidence, disease profile matches, and gene/variant evidence.

Current DB/fixture limitations:

- Generated fixture is still largely sample-shaped rather than a full dynamic sample map.
- URL sample switching may display the requested ID but not fully recalculate all evidence unless the fixture/API supports it.
- GenDx-specific diagnostic details are limited unless a dedicated GenDx table is added.

Important status rules:

- Disease match wording should remain reference-oriented.
- Similarity to searched sample and context match should remain separate.
- `GenDx` casing should stay unchanged.

---

## 6. Current Phenotype Page Status

Main files:

```text
src/views/KrPhenotype/main.js
src/views/KrPhenotype/Template.vue
src/views/KrPhenotype/mockData.js
src/views/KrPhenotype/portalPhenotypeData.generated.js
src/views/KrPhenotype/style.css
```

Current role:

- Phenotype-first result page.
- Shows query phenotype profile, reference-derived candidates, and CRDC cohort evidence.

Current DB/fixture limitations:

- The current generated phenotype fixture is based on available test DB overlap logic.
- Full runtime PheRS and annotation-burden residual scoring are not implemented in the frontend.
- When a score is unavailable, the UI should say `not calculated` rather than imply a real score exists.

Known UI semantics:

- Reference-derived disease/gene candidates should stay separate from CRDC cohort evidence.
- Co-observed phenotypes belong to CRDC cohort evidence.
- Gene candidates should distinguish exact query HPO matches, related HPO hierarchy matches, and annotation-only HPO terms.

---

## 7. Current Variant Page Status

Main files:

```text
src/views/KrVariant/main.js
src/views/KrVariant/Template_V3.vue
src/views/KrVariant/mockData.js
src/views/KrVariant/portalVariantData.generated.js
src/views/KrVariant/portalVariantNewData.generated.js
src/views/KrVariant/style.css
```

Current role:

- Variant/gene carrier evidence page.
- The promoted current version uses the former new candidate as the main page.
- Shows queried variant/gene, carrier counts, demographic summary, locus window, carrier phenotype profile, and context setting workflow.

Current status:

- Variant level and gene level are separated.
- Gene-level carrier sample list should be deduplicated by sample ID.
- Pathogenicity should use ClinVar/severity fields if available, not the phrase `rare/damaging test subset` as a display diagnosis.
- Context comparison should be HPO-based.

---

## 8. Current Context Status

Shared files:

```text
src/views/KrClinicalFocus/ClinicalFocusBar.vue
src/views/KrClinicalFocus/focusStore.js
src/views/KrClinicalFocus/focusComparison.js
src/views/KrClinicalFocus/mockFocusData.js
src/views/KrClinicalFocus/style.css
```

Context is currently browser-session state, not backend-persisted state.

Expected display:

```text
No context | Set Context
Context active | Edit Context
```

Context should be interpreted as an HPO phenotype profile.

---

## 9. Current Build / Run Notes

Development server:

```bash
./node_modules/.bin/vue-cli-service serve --mode development --port 8090 --host 0.0.0.0
```

Build:

```bash
npm run build
```

Main URLs:

```text
http://localhost:8090/krFront.html
http://localhost:8090/krSample.html
http://localhost:8090/krPhenotype.html
http://localhost:8090/krVariant.html
```

---

## 10. Known Gaps

| Area | Current gap |
|---|---|
| Backend integration | Mockup still uses generated JS fixtures |
| Runtime sample switching | Not fully dynamic unless fixture/API is expanded |
| Runtime phenotype search | Full PheRS not implemented in frontend |
| GRS | Not implemented in frontend |
| GenDx detail | Needs dedicated structured source table |
| Context scoring | Mostly UI/session-level unless backend context comparison is added |
| Variant universe | Current test fixture may be subset-based, not full VCF |

---

## 11. What Should Not Regress

- Do not use diagnosis-certainty language for reference matches.
- Do not merge phenotype similarity, context match, and genotype recurrence into one score.
- Do not hide CRDC recurrent candidates because PanelApp/pathway support is missing.
- Do not change `GenDx` casing.
- Do not make non-clickable values blue.
- Do not remove the variant locus/per-position carrier track from the variant page.
