# PROJECT_STATE

Last updated: 2026-05-19

This document summarizes the current mockup state for the rare disease cohort evidence portal. It is a handoff note for future UI/API work. It does not define production backend behavior.

## Current Mockup State

The portal mockup is organized around context-guided interpretation of rare disease cohort evidence.

Core idea:

```text
clinical context x search subject -> interpreted cohort evidence
```

- `Clinical context` is optional background knowledge used to interpret a search result.
- `Search subject` is the item the user wants to inspect now: sample ID, phenotype profile, variant, or gene.
- If context is set, result cards should read as context-guided interpretation.
- If context is not set, pages should show cohort-wide discovery-style results and suggest contexts worth checking.
- Clinical context should resolve to an HPO-term profile before comparison.

The current mockup is not a genome browser and should not be framed as oncology. It is a rare disease clinical evidence portal for patient, phenotype, and variant interpretation across a hospital cohort.

## Main Files

Front page:

- `src/views/KrFront/Template.vue`
- `src/views/KrFront/main.js`
- `src/views/KrFront/store.js`

Shared clinical context module:

- `src/views/KrClinicalFocus/ClinicalFocusBar.vue`
- `src/views/KrClinicalFocus/FocusResultAccordion.vue`
- `src/views/KrClinicalFocus/focusStore.js`
- `src/views/KrClinicalFocus/mockFocusData.js`
- `src/views/KrClinicalFocus/focusComparison.js`
- `src/views/KrClinicalFocus/style.css`
- `src/views/KrClinicalFocus/README.md`

Sample page:

- `src/views/KrSample/Template.vue`
- `src/views/KrSample/mockData.js`
- `src/views/KrSample/store.js`
- `src/views/KrSample/style.css`
- `src/views/KrSample/schemaNotes.md`
- `src/views/KrSample/main.js`

Phenotype page:

- `src/views/KrPhenotype/Template.vue`
- `src/views/KrPhenotype/mockData.js`
- `src/views/KrPhenotype/store.js`
- `src/views/KrPhenotype/style.css`
- `src/views/KrPhenotype/schemaNotes.md`
- `src/views/KrPhenotype/main.js`

Variant page:

- `src/views/KrVariant/Template_V3.vue`
- `src/views/KrVariant/mockData.js`
- `src/views/KrVariant/store.js`
- `src/views/KrVariant/style.css`
- `src/views/KrVariant/schemaNotes.md`
- `src/views/KrVariant/main_V3.js`

Assets:

- `public/images/context_guided_flow.png`
- `public/images/context_info.png`
- `public/images/context_summary_20260519.png`
- `public/images/summary_front.png`

Archive / rollback references:

- `src/views/archive/`
- `src/views/archive/version_focus_base/`
- `src/views/archive/version_01/`

Routing / page registration:

- `vue.config.js`

## Preserved Design Decisions

- Keep the URLs/page names stable unless explicitly asked otherwise.
- Keep the current front page concept: `Clinical context` is optional and `Search subject` remains the primary search input.
- Keep sample-first / phenotype-first / variant-first entry points visible on the landing page, but keep the wording concise.
- Use `BCH-12-34567-01` style sample IDs in visible mock data. Avoid reverting to `CRDC-2031` unless showing legacy examples intentionally.
- Treat sample page as the main interpretation hub.
- Sample page information order should remain: cohort position, phenotype-similar patients, genotype-similar patients, public disease hypotheses, then gene/variant evidence.
- Variant evidence should support interpretation, not dominate the first screen.
- Use HPO-rooted phenotype category labels, for example `Abnormality of the nervous system [HP:0000707]`, rather than informal labels like `Neuro`.
- Nearest-patient retrieval should use raw weighted phenotype similarity. Residual or annotation-burden correction belongs in QC/group-affinity contexts, not primary nearest-patient ranking.
- Investigator/group affinity should be presented as a phenotype-signature comparison with clear rank and z-score-style output. Do not use unexplained arbitrary thresholds.
- Variant locus views should keep the queried position aligned across ruler, disease/gene tracks, codon/base track, variant marker, and carrier-count plot.
- Keep large text support for result pages, but expose it through compact options UI rather than a dominant top-level control.
- Use color and bold only for clickable elements, active state, and important values. Labels and categories should not visually dominate results.
- Use color-blind-conscious colors. Do not rely only on red/green or yellow/blue contrast to convey meaning.
- Open/close triangles should be visually consistent and orange.

## Things Not To Change Without Explicit Approval

- Do not redesign the whole portal when the user asks for a local UI correction.
- Do not remove the clinical context concept unless explicitly requested.
- Do not make clinical context a separate search mode or separate page. It is global background context.
- Do not block search when no context is set.
- Do not present suggested contexts as diagnoses.
- Do not use oncology examples.
- Do not treat `hp.json` as disease-to-HPO annotation data.
- Do not infer OMIM disease HPO profiles from OMIM title/gene-map files alone.
- Do not replace HPO disease annotation needs with OMIM metadata. Future disease HPO profiles should come from data such as `phenotype.hpoa`.
- Do not overwrite archive folders or remove rollback snapshots without explicit approval.
- Do not run broad UI rewrites for small text, spacing, or label changes.
- Do not modify UI files when the user asks only for documentation.

## Current Data/Backend Assumptions

Mock data is currently static and deterministic.

Expected future backend/API needs:

- Resolve clinical context source to an HPO profile.
- Support context sources: Orphanet disease, OMIM disease, BCH sample ID, investigator cohort, manual HPO terms, and no context.
- HPO ontology support should use `hp.json` for autocomplete, labels, synonyms, alternative IDs, obsolete term handling, ancestor/descendant traversal, and broad phenotype grouping.
- Orphanet and OMIM disease profiles require disease-to-HPO annotation data, not just disease names or gene metadata.
- Sample lookup should return identity, HPO terms, investigator group, affected/proband status, GenDx status, and rare coding gene/variant evidence.
- Phenotype search should distinguish current search terms from active clinical context terms.
- Variant/gene search should return carrier samples, carrier phenotype profile, gene/locus evidence, pathogenicity annotations, and context-guided carrier interpretation.

## Editing Rules For Next Iterations

Use the smallest file scope possible:

- Data value changes: edit `mockData.js` first.
- Layout or markup changes: edit `Template.vue`.
- Color, spacing, typography, or responsive behavior: edit `style.css`.
- Shared context behavior: edit `src/views/KrClinicalFocus/*`.
- Page registration/routing only: edit `vue.config.js`.

For result pages, avoid repeating a large `Clinical context x Search subject` card. The next intended direction is:

- Remove large repeated search-condition cards.
- Keep compact top-right `Edit Context`.
- Show active context label near that control when context exists.
- Put `Large Text` under a small options popover.
- Use floating popovers, not full-page modals, for context/options controls.

## Next Tasks

Immediate front-page polish:

- Finalize wording and compactness of the clinical context panel.
- Ensure `Set context` / `Confirm` / `Remove Context` wording is consistent.
- Keep the context editor compact and avoid bubble-heavy HPO chips where a table is clearer.

Sample page:

- Remove the `Compare` tab if the context-guided workflow already covers that use case.
- Replace the large repeated context/search card with compact context controls.
- Convert phenotype composition from horizontal rows to a compact vertical bar-style summary if requested.
- Preserve the sample page as the primary patient interpretation hub.

Phenotype page:

- Convert visible sample IDs to BCH-style IDs.
- Keep phenotype-based evidence and molecular evidence visually distinct without implying false priority.
- Improve linked behavior between selected sample/table/scatter while avoiding overbuilt interactions.
- Make context-guided interpretation visible only where it changes interpretation.

Variant page:

- Keep disease track, exon/codon/base track, variant marker, and carrier-count plot aligned.
- Add amino acid/codon interpretation where useful.
- Convert disease bubbles and carrier/HPO displays into clearer table-like structures where design review rejects bubble UI.
- Support variant-level and gene-level carrier phenotype summaries consistently.

Build/check:

- Run `npm run build` after code changes that affect Vue/CSS/JS.
- Documentation-only changes do not require a build.
