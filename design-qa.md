# Latest: matching rules, HPO eligibility, zero results and desktop tables — 2026-11-15

final result: passed

These decisions supersede the older default matching behavior documented below. Work remains local on port 8099; no commit, push, deployment or service restart.

Visual truth: the user's single/multi flow mockups and subsequent screenshots, particularly 07:37 (project rows), 07:56 (multi summary and phenotype context), 07:58 (common metrics), 07:59 (combination tiles), 08:07–08:08 (Advanced and unavailable HPO), and 08:33 (zero-result bar). Desktop only, 1980×1100 and 1440×1100; existing CSS zoom .8 retained. Focused screenshots were opened and visually compared to these references. No remaining P0/P1/P2 findings in this scope.

Matching and summary:
- Advanced offers All (AND), Any (OR), and Custom with an integer minimum. Custom is available for three or more included HPOs; for two, Any and All cover the distinct rules. New profiles and Clear all default to All. Existing explicit match=atLeastTwo/min_match and gene_scope links remain readable; custom settings survive reload. A minimum of one canonicalizes to Any and a minimum equal to the included count canonicalizes to All.
- The collapsed editor shows a read-only matching-rule badge and plain-language explanation. Advanced summary is labeled Draft; results update on Apply. The result header and Who section identify the applied rule and the shared matching-sample denominator. This does not add a second Match selector outside Advanced.
- Multi results include all four common metrics AND exact phenotype-combination tiles with the existing colors. Combinations are mutually exclusive. Any results with more than four combinations use the existing inner arrows. Original single-HPO precomputed model results and source memberships are untouched.
- Zero matches are a valid intersection of individually available HPOs. The gray bar now occupies the full row rather than the empty zero-width first track. A no-match explanation and applied rule replace ambiguity. Undefined affected/age statistics say No matching samples rather than 0 of 0 or doubled dashes. Empty CRDC detail cards are hidden; external disease references remain available.

Availability, shared across Phenotype, Gene2 and Variant Custom HPO:
- Eligibility means at least one recorded sample in the full CRDC parent-expanded analysis HPO matrix. This is independent of the selected gene's carriers, the current display filters and the model's minimum-carrier setting.
- Autocomplete keeps unavailable terms visible with a reason and disables selection. Raw typing/pasting, Advanced Apply, reruns and direct calculation entry points are checked too. Unsupported Phenotype URLs stop before the profile API. The custom profile input commits checked terms rather than committing raw draft text as chips.
- A known zero and an absent matrix column both block selection; unknown counts remain unknown. A failed/loading count request is never reported as zero. The shared loader caches only successful counts and retries failures. QA found that typing cleared the retry message; the retry control now remains available while the service is in an error state.
- Refinement +/− buttons also disable unavailable HPOs. Unmeasured external-term matching counts display —, not a fabricated zero. Terms with positive global coverage remain usable even when they match zero samples in the current search.

Desktop tables and interaction:
- Matching samples has a Project/Investigator header filter with search, checkboxes, Select all/Clear, Apply/Cancel and A→Z/Z→A sorting. It affects that table, its pins, clipboard and CSV only; the search-cohort summary is unchanged and a visible X of N caption identifies the local filter.
- The multi header says Phenotype match with an explanatory hover. Project Affected is explicitly Yes / No, with unknown shown separately. Individual sample status remains Yes/No/Unknown. Five unpinned rows and maximum five numeric page buttons remain; nested project pagination uses arrows.
- Results use 21px table body, 20px headers, 18.5–19px secondary text, moderate weights, a wider desktop content frame and visible #c8d3df inner cell borders. The 80% prototype scale remains.
- Phenotype gene links now pass query= to Gene2 rather than the ignored gene= parameter. Actual clicks verified KCNQ2 → KCNQ2, sample BCH-22-33107-01 → the same sample, and chr12:9106261:C:T → the same variant. Sample/Variant routing itself needed no modification.
- Controlled hover panels attach to their trigger with an 8px visual gap, account for CSS zoom, flip above/below and clamp to the viewport. Panels sit outside table overflow clipping, follow scroll/resize, support focus/Escape and clean up on navigation. Beta, Z-score, match header, query markers, pin and comparison explanations were measured in-browser, including top/right/left edge cases. No log-odds wording was added to the Phenotype beta hover.

Evidence in .pb-private-data/layout-qa/table-readability-20261115/: single/multi focused table PNGs, filters-final.json, links-and-values-final.json, multi-summary-final.json and tooltip-position-final.json. Row audits checked all 2,059 Seizure samples/37 projects and 332 selected multi samples/24 projects against raw profile fields, including Yes/No/unknown totals, sex, median/quartiles, mean Z, phenotype counts and displayed gene beta/CI/p/q/carriers. No mismatches.

Evidence in .pb-private-data/layout-qa/hpo-availability-20261115/: browser-final.json, final-touch.json, zero-match-final.json and focused Advanced, unavailable-input, matching-rule and summary PNGs. Live HPO HP:0000006 has exactly one sample and was allowed on all three pages. Missing HP:0001563 was blocked, including direct model calls. Gene/Variant analysis requests were intercepted with a test response; no actual gene or variant model was fitted for this validation. Count-service 503 → retry recovery was verified. Browser errors: none. A transient unrelated Sample module/HMR error during the first link pass disappeared in a fresh final pass; no Sample files were changed by this task.

Verified matching populations: Seizure + Hearing abnormality All=208, Any=3,165; cellular phenotype + Hearing impairment + Seizure All=8, Custom minimum 2=332 (8+192+78+54), Any=3,447; the user's Hearing abnormality + Fever + Juvenile cataract All=0, Any=2,920, Custom minimum 2=261. All summary counts, combination totals and phenotype denominators update with the selected rule. Zero/positive bar heights were about 51px at CSS zoom .8, with no desktop overflow.

Validation: phenotype single/model/selection/input/profile-editor; shared CRDC HPO eligibility/cache/error-retry tests; tooltip geometry; Gene2 component/input/regression suite; Variant layout and profile-history/async-lifecycle suite; burden frontend carrier invariants; Vue template compilation and scoped diff --check. Private source backups: .pb-private-data/layout-backups/20261115-074112-before-table-readability/source.tar.gz and 20261115-0812-before-shared-hpo-validation/source.tar.gz (directories 700, archives 600). Existing unrelated dirty work was preserved.

---

# Multi-HPO flow and beta hover — desktop QA, 2026-11-15

final result: passed

Source visual truth: `/Users/kyuryung/Downloads/phenotype_flow_multi.png` (1980px wide). Preserve the existing search editor, including Advanced-only Match. The crossed-out Match and co-recorded-table heading in the source are not implemented. Earlier decisions still apply: five rows, pins, sortable headers, maximum five numeric page buttons, and arrows-only nested pagination. Mobile remains excluded.

Browser evidence: `.pb-private-data/layout-qa/multi-hpo-20261115/multi-1980-final.png`, `multi-1440-final.png`, focused `{summary,projects,people,samples,genes,diseases}-{1980,1440}-final.png`, `beta-hover-final.png`, and `browser-first.json`. Viewports 1980×1100 and 1440×1100, deviceScaleFactor 1, existing CSS zoom .8. Full-page capture canvases 2456×4689 / 1781×4689; focused cards are 1152px wide. Compare the content frame, excluding Chromium's zoom-related blank canvas. Source and browser screenshots opened together; both full composition and readable focused tables reviewed.

Required fidelity surfaces:
- Typography: preserved Arial stack and heading hierarchy, existing 18px result table text, complete long-label wrapping; sample and project rPheRS Z-score columns included. Single header is β only; hover/focus explains β per 0.1 Sum GRS, the GRS definition and dosage × LoFTEE/AlphaMissense aggregation, with no log-odds wording.
- Spacing/layout: six ordered cards follow summary, projects, people, samples, genes, external diseases. Summary shows a teal match bar and four HPO-combination tiles. Shared cards preserve pin rows, expanded project age/HPO detail and five-row numbered pages. No desktop document overflow at either viewport.
- Colors/tokens: teal profile group, gray everyone-else group, existing query chip colors reused in matching markers, combination tiles, co-term ancestry hints, sample rows, gene carriers and disease rows. Blue + and red − remain.
- Assets: standard Bootstrap square, pin, info and chevron icons; no new raster assets required. Existing header/search assets unchanged.
- Copy/content: counts use actual source data rather than the illustrative image. Comparison explicitly labels unadjusted Fisher p and observed score coverage. No numbered card circles, no duplicate Match controls, no co-recorded-table title; the +/− table remains functional.

Comparison history: first capture matched composition and controls; illustrative combination counts were replaced by independent actual matrix values (8,192,78,54; total 332). Carrier percentages were refined to 5.4%, 1.6%, etc. rather than integer rounding; post-fix focused gene capture verified. No actionable P0/P1/P2 visual findings remain. Long real project/disease labels naturally occupy more lines than the illustrative source; accepted data-dependent wrapping.

Functional evidence: three reference HPOs return Any=3447, >=2=332, All=8, with comparison results refreshed on each Apply. All 6 cards render. Project mean Z and individual Z present; matched markers display 3/3 or 2/3 with tooltips; samples default to descending rPheRS Z. Sample pins remain across page changes. Project pins and nested arrows verified separately. Co-term header sorting works. Require predicted and returned 318; Exclude predicted and returned 14. A multi-HPO Require is an explicit AND rule (required=true) outside the Any/k/All group, preserving the displayed intersection, with URL roundtrip and Advanced Apply tests. OMIM/source selection, ranked matched-HPO disease markers and top-10 separators render. Single β hover and keyboard focus show the GRS text; a later capture needed a pointer reset/focus to reliably trigger the tooltip after route navigation. Final capture succeeded. No browser page errors and no co-gene/regression requests in the multi workflow.

Data/statistical boundary: `/__hpo_gene_carrier_comparison__` uses existing private Sum GRS>0 memberships and the same parent-expanded HPO matrix, selecting the exact current sample set. Counts, percentages and ratios use known score coverage; missing scores are not zero. Two-sided Fisher exact p is unadjusted, and rows are genes with higher carrier prevalence in matching samples. No q or model-adjusted beta is presented for this comparison, and no single-HPO burden model is refitted. 19,090 approved genes compared; reference example has 332/332 selected and 15,416/16,034 other samples covered. The single-HPO precomputed beta/p/q path remains distinct and unchanged numerically.

Validation passed: Python `scripts.test_pb_phenotype_carrier_comparison` (coverage, counts, query overlaps, exact p=1/3, zero comparison carriers and invalid scope); Node phenotype single/model/selection/input/profile-editor/gene-endpoint suites. New editor test verifies required-HPO URL normalization and Advanced Apply retaining Any semantics. All templates compiled and scoped diff --check passed. Source backup: `.pb-private-data/layout-backups/20261115-071343-before-multi-layout/source.tar.gz`. No commit/push/deploy.

---

# Pagination consistency correction — 2026-11-15

final result: passed

Source: `/Users/kyuryung/Desktop/Screenshot 2026-11-15 at 06.56.07.png`; requested correction removes stacked numeric page strips and the inconsistent seven-number case. Expanded project phenotype table now uses only chevrons with a 2 / total indicator. All other single-HPO result pagers show at most five consecutive page numbers in groups (1–5, then 6–10), without first/last number additions. Gene2/Variant sources were not modified.

Evidence: `.pb-private-data/layout-qa/single-hpo-pins-20261115/project-pagination-final.png`, desktop 1980×1100, deviceScaleFactor 1, existing CSS zoom .8. Focused project card reviewed against the supplied screenshot. Typography, card spacing, colors, Bootstrap icons and table copy preserved; only navigation density changed. No P0/P1/P2 findings. Browser verified inner Next increments page 1→2, only two inner buttons, outer numeric buttons 1–5 then 6–8 for the eight-page head query, backwards transition to 1–5, and zero page errors. Inline component checks also covered seven total pages and 258 total pages, including the final group. Targeted diff check passed.

---

# Single-HPO desktop revision — pins, numbered pages and HPO lookup, 2026-11-15

final result: passed

Latest user decisions: five unpinned sample rows per page; numbered navigation and pins for samples/projects matching Gene2; keep the co-recorded phenotype +/− table while removing only its “Also recorded in these samples” heading; clickable table header sorting. Mobile excluded by user.

Source visual truth: `/Users/kyuryung/Desktop/Screenshot 2026-11-15 at 06.33.21.png` (1476×292) for the eight-column gene table, plus the original `phenotype_flow_single.png` for card sequence. Existing Gene2 pin controls and `evidencePagination.js` are interaction/style references.

Browser evidence: `.pb-private-data/layout-qa/single-hpo-pins-20261115/{cell,head}-desktop.png`, focused `{cell,head}-{projects,people,samples,genes}.png`, `head-1440.png`, and `browser.json`. Viewports 1980×1100 and 1440×1100, deviceScaleFactor 1, existing prototype CSS zoom 0.8 retained. Focused card captures are 1152px wide; compare content frames rather than the blank extra canvas from Chromium full-page capture with CSS zoom. Source and focused browser captures were opened and compared. Full-flow captures confirm six-card order and five-row table density.

Findings / iteration history: initial gene table had missing illustrative carrier columns and an inappropriate q-only positive capped release lookup. The final table follows the provided column order and uses the verified complete P<0.05 release via an HPO index; both effect directions retained and q remains q_by_hpo. Earlier removal of the entire co-recorded table was corrected after the user's clarification. The +/− controls and numbered term pagination are restored; only the title is hidden. No actionable P0/P1/P2 findings remain in the requested desktop scope.

Fidelity surfaces: existing Arial typography, 26px headings, table density and wrapping preserved; numbered blue current-page controls, bordered pin icons and pale blue pinned rows match Gene2; white card spacing and blue/orange/gray tokens retained; no generated raster assets required; Bootstrap icons used; copy distinguishes precomputed burden statistics from descriptive counts, with incomplete score coverage explicitly marked. The provided image's carrier numbers are illustrative and are not copied into live data.

Verified interactions: five normal sample rows; pin persists across page 3 and sorting; unpin restores five normal rows without duplicates; project pin persists across page 3, sorting and expansion; all project column sort buttons work; gene P/q filter pages work; negative β rows remain; 449-sample query returns 799 P<0.05 results and 16 q<0.05 results; 5,608-sample head query returns 896 P<0.05 results and zero q<0.05 results; page 4 active state works; restored +/− table renders; no browser page errors; no co-gene/model calculation requests. Earlier-session live +/− tests verified predicted and actual intersections; the restored controls use the same handlers.

Analysis audit: Obsidian `Browser_Paper_Gene_HPO_Results_and_Browser_Export_2026-09-05.md` states one binary-HPO null fit per HPO followed by tests of all genes. Gene display reorders those same pairs by gene; this does not reverse outcome/predictor. November release has 17,952 genes and 2,337,904 PASS P<0.05 pairs, both directions, SHA256 e2e032fe388e2d9b2d99e1fb539bb576a046f20df723e1cd91336e8b1a3f5bff. Private HPO lookup index rebuild only; no original beta/p/q or association model recomputation. Gene page remains on its separate q_by_gene mapping.

Auxiliary carrier data: existing Sum GRS>0 membership API joined to the same parent-expanded HPO matrix, not the all-variant carrier union. Coverage 15,748/16,366, 448/449 for the cellular term. Counts have an asterisk and coverage caption rather than assuming missing scores are zero. This descriptive intersection is independent of and cannot block statistical result display. No new model calculation.

Validation passed: test_pb_phenotype_gene_endpoint.js (complete >20-row P delivery, negative effects, q scopes, original coefficient units); test_pb_phenotype_single.mjs (pins, page preservation, missingness, ontology); test_pb_phenotype_selection.js; test_pb_phenotype_input.js; test_pb_phenotype_profile_editor.js; test_pb_phenotype_model.mjs; Vue template compilation and targeted git diff --check. No mobile QA claimed. Browser errors: none. Existing locuszoom/tabix build warning remains unrelated.

Private rollback: `.pb-private-data/layout-backups/20261115-063634-before-pins-and-burden-fix/source.tar.gz`; the initial pre-redesign backup remains intact. Local frontend 8099 restarted to load the backend reader; other servers and the existing profile service preserved. No commit, push or deployment.

---

# Single-HPO results layout — desktop QA, 2026-11-15

final result: passed

Scope: `pb_phenotype.html?query=HP%3A0025354`, exactly one included HPO and no excluded/demographic/project/investigator constraints. The user explicitly excluded mobile work during this session. The existing search editor and all other query modes remain the baseline.

Source visual truth: `/Users/kyuryung/Downloads/phenotype_flow_single.png`.
Implementation evidence: `.pb-private-data/layout-qa/single-hpo-20261115/desktop-1980-final.png` and `desktop-1440-final.png`; focused `desktop-1980-{summary,projects,people,samples,genes,diseases}-final.png` and corresponding 1440 captures. Evidence and CSV remain git-ignored.

Viewports: 1980 × 1100 and 1440 × 1100 CSS viewport pixels, deviceScaleFactor 1. The existing prototype HTML applies CSS zoom 0.8; this was preserved. Chromium full-page screenshot canvases are 2456 × 6435 and 1781 × 6435 because of that zoom. Element captures reflect the painted card size (1152px across). Compare the source content frame with the implementation content frame, not the blank full-page capture canvas. The reference uses illustrative data; the implementation uses the live API, with all 25 sample rows rather than the four illustrative sample rows in the reference.

Full-view comparison: the six cards follow summary → projects → demographics/co-recorded terms → samples → precomputed genes → external diseases. No numbered circles or old card category badges. The preserved search card precedes the results. Card borders, white backgrounds, blue links, orange/gray cohorts, and three-column demographic layout follow the source. The existing 1440px maximum shell and default 0.8 scale are intentional repository constraints. Source and browser images were opened together; focused captures were reviewed for table headings, long names, scores, cohort bands, reference source tabs, and refine controls.

Required fidelity surfaces:
- Fonts/typography: existing Arial/Helvetica stack and 26px card headings retained; readable 18px result tables and 17px dense gene table. No ellipsis or clipped long names. Sample and project rPheRS Z-scores added as requested. Natural wrapping of very long HPO labels remains acceptable.
- Spacing/layout rhythm: white rounded cards, consistent 20px card separation, grouped summary tiles, project count bars, demographic dividers, and two-part disease card. At both desktop sizes all six cards fit horizontally; page scroll widths were 1965 and 1425 respectively, below viewport widths.
- Colors/tokens: existing blue/ink/muted tokens, orange matching group, gray comparison group, blue require and red exclude actions, teal significant q values.
- Image quality/assets: no new raster assets in the reference result area. Existing page header preserved. Bootstrap icon components used for disclosures, plus/minus and information.
- Copy/content: live counts replace examples: 449 matching of 16,366, 15,917 everyone else, 29 projects, 385 affected, age median 11 (Q1–Q3 5–18). Summary and gene-band numbers match. External references have the required reference-only copy. Unlinked gene diseases say None linked.

Comparison history:
1. Initial browser capture found gene symbols wrapping mid-symbol because the legacy td font size overrode table typography. Explicitly inherited each table's font size; post-fix gene captures show GARIN1B, PLEKHF1 and RNASE13 intact.
2. Disease separator header wrapped Diseases as Disease / s. Increased that column to 20% and rebalanced adjacent columns; final focused disease capture shows the complete word.
3. Final desktop captures have no actionable P0/P1/P2 visual findings. A narrow-layout flex-axis issue found before the user excluded mobile was corrected within result headings; experimental mobile header edits were removed. Mobile is not an acceptance criterion.

Primary interactions verified with an isolated, user-authorized Playwright Chrome profile (the built-in browser host was unavailable):
- Six ordered cards and 25 sample rows per page; project and sample Previous/Next change visible rows.
- Project expansion exposes its age distribution and paginated co-recorded phenotypes.
- Copy sample IDs copies all 449 IDs; CSV exports all rows including rPheRS Z-score.
- OMIM, DECIPHER, DDG2P and Orphanet source buttons change disease rows and source counts.
- Co-recorded Require/Exclude predicted 436 / 13 and actual live-profile results were 436 / 13.
- Disease-separator Require/Exclude predicted 121 / 328 and actual results were 121 / 328.
- Require uses All to preserve the displayed intersection; Exclude applies the URL condition and returns to the legacy filtered result layout.
- Opening/closing Advanced preserves the editor state and existing disabled basic-input behavior.
- No browser page errors. Console errors checked in the full interaction run: none. No new single-HPO model calculation is requested. During multi-HPO transition tests only, full-cohort regression and score-membership requests were stubbed to avoid running out-of-scope analyses; live sample profile responses and URL state were used.

Known data limitations / intentional differences from reference:
- The configured precomputed gene release has no group-specific carrier counts or tested-gene denominator. Carrier cells and fold ratios display — with an explanatory Methods disclosure; no counts or effects are fabricated. The 16 significant positive gene rows and their β/CI/p/q come directly from the existing release. The original model sample count (15,574) is distinguished from the descriptive HPO matrix cohort (16,366) in Methods.
- The existing single-HPO gene endpoint delivers at most 20 positive significant rows; this term supplies 16 and all 16 are paginated. Expanding that backend release is outside this layout change.
- No medical inference is added. External reference disease data remain separate from CRDC model evidence.

Validation: `test_pb_phenotype_single.mjs`, `test_pb_phenotype_selection.js`, `test_pb_phenotype_input.js`, `test_pb_phenotype_profile_editor.js`, `test_pb_phenotype_model.mjs` passed. All new Vue templates compiled; targeted git diff --check passed. Existing browserslist age notice is unrelated.

Implementation checklist: six cards, untouched search, conditional gate, both rPheRS Z-score columns, project disclosure, all result tables paginated, sample exports, source selection, refine counts and URL updates verified.

Private rollback snapshot: `.pb-private-data/layout-backups/20261115-060624-before-single-hpo/source.tar.gz`, git-ignored with restricted permissions, containing both Phenotype and Variant sources before this session. `rollback-scope.txt` identifies added files. No commit, push or deployment performed.

---

# Single phenotype search QA — 2026-11-14 (latest)

**final result: blocked**

- Source visual truth: `/Users/kyuryung/Downloads/phenotype_search_bar_mockup.png`, inspected directly. Follow-up user constraints: only the upper search card, Advanced directly under the bar, minimal horizontal dividers, one HPO textbox, and existing result layouts retained.
- Implementation: local `pb_phenotype.html` on port 8099. No implementation screenshot was saved. Source is a four-state annotated desktop mock; source CSS viewport/density is unknown. Target responsive CSS includes 1250/800/520px breakpoints. Full-view/focused screenshot comparison and narrow-viewport measurements remain unverified.
- Native Chrome accessibility inspection confirmed the live page had one Include selector, one HPO combobox, one Search, one Advanced search, and the unchanged 449-sample result for HP:0025354. In-app browser access was unavailable. Native inspection was then stopped; the user confirmed the Advanced expansion themselves and asked not to inspect it again. Do not repeat browser operations for that check.
- Functional checks passed: one phenotype combobox even with Advanced open; suggestion selection immediately applies Include/Exclude; real-count display and unavailable-count handling; Advanced/summary shared state; grouped positive HPOs with Any / k-of-n / All matching; inclusive age ranges and exact investigator/project filters; URL reload compatibility; exclusion based on expanded recorded HPOs; removal/Clear all; color preservation; Advanced before summary in render order.
- API checks passed: profile-only aggregate hpo-count endpoint, cohort denominator 16,366, 6,440 matrix terms, HP:0025354 count 449, and identical pre/post-restart existing profile JSON. No sample identifiers are returned by the aggregate endpoint.
- Typography/colors: existing 20px primary typography, page palette and buttons retained. Source-aligned controls/rows use 18px secondary labels and small monospaced HPO IDs. Actual raster typography/contrast comparison not certified.
- Spacing/layout: one upper search card, no added horizontal summary dividers or nested search rows. Advanced uses a subtle surface tint. Mobile rules wrap the bar, chips, Match controls, and condition values; overflow must still be measured in a narrow browser viewport.
- Assets: existing BootstrapVue icon library; no generated imagery or handwritten icon substitutes.
- Copy: source-aligned Include/Exclude, Search, Advanced search, Samples with, Without, Limited to, Find samples where, Add a line, Clear all, and panel-only Apply. No mock annotation headings included in the product.
- Validation: JavaScript editor/input/selection/model suites; Python profile metadata/sample/scoring/server suites; Vue compilation and whitespace checks. Browser console and narrow-width visual QA were not completed, so no visual pass is claimed.

**final result: blocked**

---

## Earlier QA records

# Phenotype profile / Advanced QA — 2026-11-14

**final result: blocked**

Implementation is applied to the existing local 8099 page. Browser-rendered visual verification is blocked: the in-app browser tool returned `The browser access host is unavailable`. No implementation screenshot or browser console capture was obtained; a 200 response, compiled bundle, or passing component tests is not visual QA.

## Source visual truth and viewport

User-supplied desktop crops under `/Users/kyuryung/Desktop/`:

- `Screenshot 2026-11-14 at 12.51.24.png`: 1902 × 114 pixels, Gene header.
- `Screenshot 2026-11-14 at 13.03.06.png`: 1868 × 236 pixels, previous Phenotype input.
- `Screenshot 2026-11-14 at 13.04.45.png`: 1758 × 104 pixels, draft profile plus Apply / Advanced.
- `Screenshot 2026-11-14 at 13.05.24.png`: 926 × 106 pixels, applied Samples with chips.
- `Screenshot 2026-11-14 at 13.07.19.png`: 2002 × 180 pixels, wide search / advanced pattern.
- `Screenshot 2026-11-14 at 13.08.00.png`: 1276 × 412 pixels, repeated AND / Contains conditions.

Latest user decisions override those crops: increase type to match Gene2/Variant; minimize card blocks; put editor and results on the same surface; show excluded HPOs beside included HPOs in the Samples with row.

Implementation screenshot path: unavailable. CSS verification targets: desktop 1440px and mobile 390px. Source CSS viewport, deviceScaleFactor and crop density are unknown. Pixel-density normalization and same-state full-view/focused comparisons remain unperformed.

## Required fidelity surfaces

- Fonts / typography: code uses the existing Gene2 Arial family, 20px primary and 18px secondary text. Actual rendered weight, line wrapping and optical match are unverified.
- Spacing / rhythm: editor, applied chips, Project summary, demographics and sample results share one continuous surface. Nested demographic panel boxes removed. Responsive rules wrap editor and condition rows; project tables scroll horizontally. Rendered overflow / above-the-fold alignment unverified.
- Color tokens: Gene2 ink #24334a, primary #0b66d8, background #f6f8fb. Positive HPO colors preserved; excluded HPOs have an explicit Exclude label plus red semantic color. Rendered contrast unverified.
- Assets: references contain native UI and standard icons only. Existing BootstrapVue icons used; no new raster assets, CSS drawings or handcrafted icon substitutes.
- Copy / content: Home / Phenotype search / Search and Gene / Variant navigation; Phenotype profile / Apply / Advanced; Samples with; Contains / Exclude; age / sex / affected / investigator / project conditions. Core state tested below.

## Functional validation

Passed `test_pb_phenotype_profile_editor.js`, `test_pb_phenotype_selection.js`, `test_pb_phenotype_input.js`, and `test_pb_phenotype_model.mjs`. Both Vue templates compile without errors. Verified draft isolation until Apply, multi-condition AND, Contains/Exclude, numeric ages including zero/Unknown, demographic and investigator/project filters, URL serialization, consistent project/demographic/group-gene counts, and no regression refit for demographic changes. A rendered VNode check confirms excluded chips share the Samples with chip container and are not duplicated in a separate applied-filter row. The current 8099 bundle contains the new editor, advanced controls, merged surface, Exclude chip and typography without a module build failure.

The broader existing `test_rphers_sd_ui.js` check fails in its Variant-context setup at line 78 (`No carriers match the genotype selection`), before loading the Phenotype component. Variant code was not changed for this task.

## Comparison history and remaining gate

1. Implemented profile draft editing / Advanced conditions, then enlarged type and merged search/results after user feedback.
2. Moved applied Exclude HPOs into the same Samples with row after the user clarified the desired placement; added a component-render assertion.
3. Browser host remained unavailable. No visual comparison has passed. Browser-only interaction, responsive overflow, console errors, and source-versus-implementation full/focused captures must be checked when browser access returns.

**final result: blocked**

---

## Earlier QA record (preserved)

# Phenotype page visual QA

- Source visual truth: `/Users/kyuryung/Downloads/phenotype_page1_single_hpo.html` and `/Users/kyuryung/Downloads/phenotype_page2_three_hpo.html`; `/Users/kyuryung/Downloads/phenotype_page_spec.md` is authoritative for content and behavior.
- Implementation: `http://127.0.0.1:8098/pb_phenotype.html?query=HP%3A0001250` and `?query=HP%3A0001250%2CHP%3A0001945%2CHP%3A0001433&exclude=HP%3A0000252`.
- Viewport: Chrome desktop, approximately 1424 × 800 CSS pixels. Implementation was visually inspected in both states. No screenshot file was saved.
- Source pixel dimensions, density normalization, and focused side-by-side comparison: unavailable. Browser security policy blocked opening the supplied local HTML files through `file://`; the reference CSS and HTML were inspected as source instead. No alternate browser route was attempted.

## Findings

- [P1] A pixel-level comparison against the rendered mockups remains unverified. The implementation follows the specified 1180px container, card layout, color system, and block order, but typography and spacing cannot be certified against a rendered source capture.
- [Data] The existing test API returns at most 30 samples and only a `k/n` HPO match count. BioIndex `samples-info`, used by the Gene and Variant pages, exposes HPO lists for only some of those returned samples. The page labels every partial denominator and leaves unavailable cohort totals, age, and combined-profile burden statistics blank.

## Checked on the implementation

- Typography: Helvetica/Arial stack, mockup heading and table hierarchy.
- Spacing/layout: 1180px container; context, four metrics, samples, genes, and diseases in the specified order.
- Color: teal CRDC, purple Orphanet, red exclusions, ordered HPO chip palette.
- Imagery: no separate image asset exists in either supplied HTML mockup; existing site header is retained.
- Copy: required profile banner, unrecorded-term note, Orphanet snapshot and diagnostic-criterion note are present.
- Interaction: changing from three to two to one query terms updates the same page; test API and BioIndex results load.

## Comparison history

1. Initial implementation captured in Chrome for single and three-term states. The source HTML could not be opened as a rendered page because `file://` is blocked, so a full comparison could not be completed.

final result: blocked

## 2026-11-12 expanded variant detail and investigator follow-up

Scope: annotation → carrier summary → carrier samples, with the blue ↗ link next
to annotation and project-level investigators in the expanded carrier summary.
Native Chrome AX and `/private/tmp/pb-gene2-expanded-current.png` now confirm the
new section order, actual annotation values, exact variant/gene link, and
`Investigator: benjamin_raby` below the matching project. Long project text wraps;
counts and progress bars occupy separate cells. The captured desktop layout has
readable annotation columns and thin separators consistent with the gene page.
This capture supersedes the earlier capture blocker only for this scoped desktop
detail review; narrow-screen and final full-table visual checks remain unverified.

The carrier table uses 10/25/50 rows per page and searches the full carrier ID set.
The 20,000-carrier behavior check verifies bounded page metadata requests and
page/search/sort reset. Project summaries retain four rows per page and search
both project and investigator labels; investigators do not change carrier counts.

Scoped desktop visual result: passed. Responsive visual gate: not verified.

## 2026-11-12 superscript information icons

All shared Gene2 info buttons now use a 14px icon raised above the text baseline.
Removed competing per-section icon sizes and the variant header's separate bottom
icon row/padding. Explicit two-line labels keep the icon beside the final label
line. Native Chrome capture `/private/tmp/pb-gene2-superscript-info.png` verifies
shorter variant headers without detached icons, plus superscript icons in the
profile table, annotation and carrier summary. Existing focus/hover/click handlers
are preserved. Gene2 template/behavior and information-rail checks passed.

Scoped desktop visual result: passed.

## 2026-11-12 compact result actions

Re-run is now an icon-only clockwise arrow with the native title `Re-run` and a
profile-specific accessible label. The adjacent X has title `Delete row`. Desktop
capture `/private/tmp/pb-gene2-result-action-icons.png` confirms both fit in the
right-hand action cell without increasing row height. Browser AX confirms both
titles and accessible labels. Deleting an inactive row preserves the current
analysis; deleting Applied clears its context and variant effects rather than
silently applying another history row. Calculation-time deletion is disabled.
These deletion cases and existing replay/template checks pass.

Scoped desktop visual result: passed.

## 2026-11-12 phenotype history Re-run

Each custom-profile history row now has a right-aligned Re-run button. It restores
the row's HPO terms and saved Max/Sum, All/Affected, significance threshold and
minimum carriers, submits the existing analysis API, and applies the newly
returned result. Previous results remain in history. All run buttons are disabled
during calculation. Rows without complete saved settings cannot silently borrow
the current form settings. A newly applied result resets the input draft.

Actual Chrome replay of Hearing abnormality + Seizure returned beta 0.028,
P 1.17e-5 and 1,095 positive-GRS samples; the new row received Applied. Screenshot:
`/private/tmp/pb-gene2-rerun-history.png`. The button fits beside Settings and the
two selected HPO tokens remain visible without the abandoned draft/suggestion.
Gene2 behavior tests cover exact saved-setting restoration, concurrent run guards
and missing/unrelated history rows. Templates and diff checks pass.

Scoped desktop visual result: passed.

## 2026-11-12 carrier summary alignment and five-row samples

Expanded variant demographics now use the same three-column organization as the
gene overview: Project / Age / Sex above Affected. Project rows include supplied
investigators, count sorting, four-row numbered pagination and search. Intrinsic
count widths and separate bar tracks prevent the reported four-digit overlap.
The actual 15,374-carrier variant was inspected in Chrome; capture:
`/private/tmp/pb-gene2-carrier-summary-three-columns.png`.

Carrier samples are fixed at five per page; the previous row-size selector is
removed. Native Chrome showed `1–5 of 9`, exactly five rows and two pages for a
nine-carrier variant (`/private/tmp/pb-gene2-five-carrier-rows.png`). A transient
blank screen during development reload cleared after the current build loaded;
the console contained no application error. Gene2 template checks and the
20,000-carrier pagination/search checks pass with five-row pages.

Scoped desktop visual result: passed.


## PB Sample screenshot alignment — 2026-11-09

See [design-qa.pb-sample.md](design-qa.pb-sample.md). Workflow changes are browser-verified; exact same-state visual comparison remains incomplete.

final result: blocked


## PB Gene2 CRDC summary layout — 2026-11-12

- Source visual truth: `/Users/kyuryung/Downloads/ChatGPT 이미지 2026년 11월 12일 오전 11_40_34.png` (Image 1, 1586 × 992 pixels). Image 2 identifies the replaced metrics/demographics region.
- Implementation: `http://127.0.0.1:8098/pb_gene2.html?query=GJB2`; native Chrome capture `/private/tmp/pb-gene2-crdc-layout-20261112.png` (3024 × 1898 pixels, Retina density 2, Chrome zoom 90%).
- State: GJB2, 392 variants, 16,143 unique carriers, complete metadata, first project page. Native accessibility inspection confirms all three chart totals, six project rows, seven project pages, and Age/Sex/Affected values.
- Typography: existing Arial/Helvetica, navy headings, 30px summary title and 23px chart headings; readable in the captured desktop region.
- Spacing/layout: three summary columns above a 2.4:1:1 demographic grid. Gene identity is a separate preceding card. At widths ≤1250px, summary charts stack and Project spans both demographic columns; at ≤700px demographics stack. Responsive states need visual capture.
- Colors/tokens: blue consequences, teal annotation availability, red/amber/teal/purple/gray ClinVar groups; counts use the full variant set and percentages use real totals.
- Assets: Bootstrap Vue icons and data bars; no raster assets required.
- Copy/content: removed the four mixed metrics and collapsed demographics wrapper. Source icons temporarily state release 115 with URL/date pending, as requested. Investigator names are shown only if project-level metadata supplies them; current aggregates omit them and display a muted unavailable state.
- Automated validation: `node scripts/test_pb_gene2.js`, `node scripts/test_pb_gene2_carrier_scores.js`, and `git diff --check` pass. Tests cover chart partitions, overlapping prediction annotations, independent filters, six-row project paging, search resetting a later page, sample-count sorting, source-data immutability, and partial coverage.
- Comparison history: initial native capture confirms the three-column chart layout. ClinVar legends were then constrained to three items on the first row, and the compact breakpoint was widened to avoid cramped columns. Final CSS changes still need an updated browser capture.
- Full-view and focused comparison evidence: incomplete. The native capture includes the complete chart region but only the upper demographic rows; no equal-viewport combined comparison was accepted. Browser control reported an active user change, so further automated interaction stopped.
- Console and end-to-end interaction review: not completed in this iteration; Vue templates compile and existing calculation tests pass.

final result: blocked

Remaining visual checks: capture the entire final card at a matching width, compare against Image 1, and check the compact/mobile states. Code is available in the existing local development server for user review.


## PB Gene2 two-column revision and larger detail text — 2026-11-12

- Source: user screenshots `Screenshot 2026-11-12 at 12.12.41.png` and `Screenshot 2026-11-12 at 11.58.03.png`, plus the subsequent explicit two-column, paging, sorting and larger-font instructions.
- Implemented: wider Consequence at left; Predictors above ClinVar at right. Consequence uses four-row pages and count sorting. The largest four consequence categories remain individual bar segments; the rest aggregate into Others, with internal dividers and union filtering. GJB2 counts are 99, 86, 70, 68 and Others 69. Minimum bar widths prioritize legible counts; bar geometry is approximate, as requested.
- Detail text: shared 20px content and 18px secondary typography across tables, legends, project/investigator labels, demographics and expanded variant details. Chart labels retain the separately requested smaller adaptive sizes.
- Investigator correction: original sample metadata already contained investigator labels. The summary endpoint now returns project-to-investigator associations; the UI joins these by project. Live partial aggregation confirmed 35 projects with corresponding investigator associations, without adding sample identifiers to responses.
- Validation: Gene2 model/template tests, carrier-score tests, carrier-summary endpoint tests and diff checks pass. Added coverage for exact consequence buckets, non-HC annotation availability, Annotated disclosure, Others count conservation/union filtering, count sort before paging and project investigator associations without count inflation. The running server bundle includes the final two-column layout and 20px/18px typography.
- Browser evidence: `/private/tmp/pb-gene2-two-column-20261112.png` is an existing-tab capture, not accepted final evidence: that tab retained the previous bundle after the server restart. Native browser interaction repeatedly reported a user-driven app change. Existing HPO analysis was preserved; no forced reload was performed.
- Final full-view and focused comparison, compact viewport capture and manual interaction verification remain pending a fresh page load.

final result: blocked

---

## 2026-11-12: Gene2 association/profile/variant layout

**Source visual truth**
- `/Users/kyuryung/Downloads/ChatGPT 이미지 2026년 11월 12일 오후 02_01_10.png`
- `/Users/kyuryung/Downloads/ChatGPT 이미지 2026년 11월 12일 오후 02_01_03.png`

**Implementation and comparison evidence**
- Local implementation: `http://127.0.0.1:8098/pb_gene2.html?query=GJB2`.
- Association screenshot: `/private/tmp/pb-gene2-associations-current.png`.
- Applied-profile screenshot: `/private/tmp/pb-gene2-applied-layout-v2.png`.
- Full-region side-by-side comparison: `/private/tmp/pb-gene2-association-comparison.png`.
- Applied variant side-by-side comparison: `/private/tmp/pb-gene2-variant-comparison.png`.
- Focused numeric-cell evidence: `/private/tmp/pb-gene2-association-numeric-crop.png`.
- Source images are 1774 px wide. Chrome native capture is 3024 px wide (1512 logical screen points); browser zoom was 90%, with the existing Gene2 CSS zoom of 0.8. The implementation content crop is 2074 px wide, normalized to 1774 px for the comparison. Source device density is unknown: these are content-proportion comparisons, not a claim of exact CSS-pixel matching.
- Top comparison uses the same first five precomputed GJB2 rows and P filter. The source's q dashes and example page count intentionally differ: the implementation shows actual q_by_gene and 24 pages from 119 records.
- Applied comparison uses HP:0000364, Max and All. It predates the final input-finish and aligned-info-icon fixes. Its top heading is clipped by the viewport. A fresh same-state capture is still required.

**Fidelity surfaces**
- Typography: existing Arial/Helvetica is retained. Body values remain 20 CSS px, secondary text and table headings 18–19 px; the larger readable text and cell spacing requested by the user intentionally increase row height relative to the mock. Numeric columns are aligned and use tabular numerals.
- Spacing/layout rhythm: search/filter controls, pin-first association rows, numbered pagination, profile form, green applied row, and blue/green variant group headers follow the reference. The user explicitly requested three separate carrier columns; this changes variant column proportions from the mock.
- Colors/tokens: pale blue headers, pale green applied state, blue actions and yellow pathogenicity values follow the reference using solid colors. No new raster assets were needed.
- Assets/icons: existing Bootstrap icons are used for pin, info/question, gear, sorting and pagination; no generated/decorative assets were needed.
- Copy/content: units are separated for precomputed log-odds, custom gene rPheRS SD and variant rPheRS SD. Explanations are in hover/focus tooltips. P is strictly < 0.05. The source q dash, page totals and sample numbers are not hardcoded.

**Comparison history / fixes**
1. [P1] Initial rendered variant headers broke Pathogenicity and Variant beta in the middle of words. Increased the minimum table/column widths, merged consequence under the variant ID, and changed header text layout. The v2 screenshot verifies intact words and separate numeric cells.
2. [P2] HPO/Scored header info icons aligned differently and appeared close to adjacent headings. Added consistent centered icon placement below the label and reduced excess row padding. The final post-fix capture was blocked.
3. [P2] Direct HPO-ID entry left the same ID in the input next to its chip and left suggestions open after Apply. Added finish-on-blur/submit and verified the committed query becomes empty and suggestions close in the Vue behavior test. The final same-state browser capture was blocked.
4. Focused top-table crop confirms distinct spacing between beta, CI, P, q and carrier ratios. No numeric overlap is present in that captured region.

**Behavior and real data verified**
- Browser AX showed 24 association pages and actual q_by_gene (first q 3.22e-4).
- Browser applied HP:0000364 and showed Gene beta 0.026, P 3.63e-5 and 1,095 GRS-positive samples from the real API.
- First variant displayed 2 total carriers, 0 carriers with the HPO and 1 scored carrier with actual mean Z/beta/P. Another row displayed 2 total, 1 HPO-positive and 2 scored. These are distinct units.
- Hover/focus tooltip definition was visible on the precomputed 95% CI in the AX tree; Escape support remains implemented.
- Vue/template behavior, source q mapping, 119-row pagination, HPO count intersection/coverage/session isolation, abort/stale responses and existing score/demographic checks passed.
- Console inspection found no application rendering exception; an existing development sockjs unload permissions-policy message was present.

**Remaining verification**
Native browser actions repeatedly returned `The user changed ... Re-query the latest state`, scroll returned `noWindowsAvailable`, and the last screenshot attempt timed out and reset the CUA kernel. In-app browser reported its access host unavailable. This prevents a fresh capture of the final input/header fixes and consistent final keyboard/pagination/small-viewport interaction verification. Do not promote build/API success to a passed visual gate.

**Implementation checklist**
- [x] Layout and actual-data wiring implemented.
- [x] Source and implementation comparisons captured and reviewed.
- [x] Observed word-wrapping and direct-input issues fixed in code.
- [ ] Fresh final same-state screenshot after the last fixes.
- [ ] Final keyboard/focus/pagination and responsive visual pass.

final result: blocked

---

## 2026-11-12 follow-up: simpler headings and information in the margin

Scope: remove the association P/q selector, standardize all HelpTooltip buttons to
info icons, move method information next to section titles, hide q's within-gene
subtitle, remove repeated carrier denominators, and rename the variant predictor
column. Native Chrome AX showed these changes and actual counts 244, 103, 11, 50,
14 without the repeated denominator. It also showed In Silico Predictors in the
variant header and sort control.

The new shared InfoRail uses the shell's rendered/logical width ratio to account
for CSS zoom. It keeps the panel level with the icon in the outer margin rather
than applying top/fallback coordinates over another table. Unit checks passed for
zoom 0.8, lower-page icon alignment, side selection, reserving space, narrow-screen
flow placement, click pin/unpin, Escape and outside-click dismissal. Template and
existing Gene2 behavior tests passed. The existing default CSS zoom 0.8 remains;
no additional automatic shrinking was introduced.

Visual verification blocker: native capture returned ScreenCaptureKit error -3811
("Failed to start stream due to audio/video capture failure"), and the follow-up
browser action reported "The user changed ... Re-query the latest state". No new
post-change screenshot could be obtained. The prior comparison images above remain
historical evidence and must not be treated as a screenshot of the new rail.

final result: blocked

## 2026-11-14 Variant genotype dropdown (scoped review)

Source visual truth: `/Users/kyuryung/.codex/generated_images/01a1dab5-b6d6-77e0-8da2-52f0bed701e6/exec-a086377c-dfc4-41c8-9727-73accfc79ca3.png`.
Latest user amendment: highlight the Genotype label in the same yellow as CRDC AF.
Implementation capture: `/private/tmp/pb-variant-genotype-20261114/genotype-dropdown-all.png`.
Full-card side-by-side comparison: `/private/tmp/pb-variant-genotype-20261114/genotype-comparison.png`.
Filtered-state capture: `/private/tmp/pb-variant-genotype-20261114/genotype-homozygous-29.png`.

Viewport/evidence: native Chrome screenshot 3194 × 1898 pixels, browser zoom 80%.
Source card 2066 × 761 pixels. Implementation card crop (478,973)-(2686,1841)
is 2208 × 868 pixels. Both full cards are normalized to 1000 px width in the
same comparison image. CSS viewport/DPR were not instrumented through the
unavailable browser connector; comparison uses pixel-normalized card geometry.
State: All applied, dropdown expanded, all three options checked. Mock counts
12/272/10 are illustrative; actual screenshot variant has 0/0/294 from the
configured GT source. This data difference is intentional, not visual drift.

Findings: no actionable P0/P1/P2 issues in the changed header/dropdown.
- Fonts/typography: existing application fonts and heading scale retained;
  dropdown uses the existing ClinVar 18/16 px typography. Genotype is adjacent
  to CRDC, with no right-aligned standalone checkbox row.
- Layout/spacing: trigger follows the heading; the menu overlays the demographic
  card without shifting its columns. Selection/total subtitle remains. Original
  application chart and project-row spacing is preserved rather than redesigned
  to match small generative-mock differences.
- Colors/tokens: label uses the existing CRDC AF marker `#ffe484`; native checked
  checkboxes, Apply, border and restrained shadow follow the ClinVar pattern.
- Assets/icons: Bootstrap funnel icons reused. No new raster assets required.
- Copy/content: Homozygous, Hetero, Unknown, Select/Deselect all, Cancel and Apply
  match the selected design. The removed scope sentence and variant sections
  remain absent.

Primary interaction observed in Chrome: default three checks selected; removing
Hetero and Unknown then Apply changed 226 to 29 carriers, sample title to 29,
demographic bars to denominator 29, and phenotype coverage to 13 of 29. API tests
also confirm All/individual/multiple selections restrict scoring and HPO counts.
Console was not inspected because native Chrome had concurrent user activity;
frontend compilation, Vue render checks and HTTP calculation checks passed.
Mobile viewport was not visually captured; existing page layout is retained.
P3: minor mock/native typography and caret differences; retain the user's
requested existing ClinVar component rather than restyling unrelated content.
Comparison history: first scoped full-card comparison passed; no visual repair
iteration was needed. Earlier blocked reviews above concern other page changes.

final result: passed
