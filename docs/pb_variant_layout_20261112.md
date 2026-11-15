# Variant layout and terminology — 2026-11-12

The Variant page now orders its sections as Variant identity, Carriers observed in CRDC, Test a phenotype profile, Carrier phenotypes, and collapsed carrier/detail tables. Carrier display filters are above the full-width phenotype hierarchy. Co-carried genes remain available in a separate collapsed section.

The profile result columns are **Phenotype profile, β ⓘ, P, Mean carrier rPheRS Z, Carriers with phenotype data, Settings**. The β and P values continue to use the existing exact-variant result reader. β remains `beta_raw / reference_sample_SD` for the carrier 0/1 effect. No q column or precomputed `q_by_gene` is introduced. Mean carrier rPheRS Z remains a separate descriptive statistic, with complete eligible-carrier coverage required.

The CRDC summary displays the number of distinct carriers and source frequency on one line. An allele frequency is explicitly prefixed **AF**; it must not be described as the proportion of people carrying the variant. A carrier frequency is labelled separately and is calculated from counts only when a valid CRDC sample denominator exists. The observed-carrier count is independent of scoring eligibility.

The page reuses Gene2's ProfileInput, HelpTooltip, InfoRail, Demographics, evidenceHelp and confirmed referenceProvenance. Annotation and calculation definitions are available through info icons, with official source links for external annotations. The former persistent method paragraphs are removed. Advanced options contain the existing Max/Sum and All/Affected only controls; the profile still runs on Apply. No backend regression, reference population or correction family was changed.

The internal sample section's legacy display-only sum is labelled **Mean pathogenicity sum**. The carrier adapter sums available per-variant pathogenicity scores without ALT dosage, so it must not be described as the dosage-aware regression GRS. Its existing calculation is preserved and the distinction is explained in its info icon.

Co-gene FDR remains Benjamini–Hochberg correction across valid p-values from the **target gene plus all different-gene co-carriers**, before display filters and pagination. It is separate from the precomputed within-gene single-HPO correction. Gene β retains the SD effect per 0.1 GRS.

## Definition sources

- [External DB provenance and hover wording, sections 9–10; Custom HPO definitions, section 11; Gene2 follow-up, section 12](/Users/kyuryung/Documents/Obsidian/Research/Methods/Pathogenicity_logic/External_DB_Provenance_and_Build_Scripts_2026-11-12.md)
- [October 19 SD and beta display definitions](/Users/kyuryung/Documents/Obsidian/Projects/Browser_Paper_2025/dig-dug-portal/PB_rPheRS_SD_and_Single_HPO_Beta_Implementation_2026-10-19.md:22)
- [Variant Context and co-gene model/family definitions](/Users/kyuryung/Documents/Obsidian/Projects/Browser_Paper_2025/dig-dug-portal/PB_Variant_Prototype_Context_and_Carrier_Statistics_2026-10-05.md:33). October 19 SD definitions supersede historical raw display values.

## Verification

- Carrier-statistics tests, including the updated layout contract, metadata deduplication, partial coverage and allele-versus-carrier frequency distinctions, pass.
- Variant identifier tests pass.
- Vue template compilation and rendering with a supplied result fixture pass: six profile data headers plus the result action column, β and mean Z kept distinct, unchanged P, no q column, no Vue warnings. The fixture values are validation inputs, not new live analysis results.
- Development build passes; the existing LocusZoom/tabix-reader export warning remains.
- The local server at port 8098 returns HTTP 200. The browser connector was initially unavailable. The November 12 review follow-up used native Chrome access to inspect the rendered page and expanded phenotype tree and verify Apply, re-run, and delete with the existing GJB2 example. The applied β, P and mean Z remained −0.608, 0.540 and −0.549 in that check.

No commit, push, production deployment or external message was performed for this layout change.

## Screenshot review follow-up

- The top-right gene area now shows the gene link and **392 variants observed in CRDC** for the GJB2 example. Duplicate gene-info summaries and gene carrier counts were removed from this area.
- The carrier heading is a single sentence: **2 carriers (AF 0.0000870549) observed in CRDC** for the example, with singular/plural grammar based on the actual count.
- Projects use the shared Gene2 component's four-row pagination. Variant-specific styling bounds project titles to two lines and investigator labels to one, with full labels retained in titles. A 1,001-person, 13-project fixture verified four rows per page, the last page and project search.
- The current profile row includes Gene2-style re-run and × controls. Re-run restores the applied HPO, Max/Sum and All/Affected settings; delete removes the result and invalidates outstanding co-gene responses. The input remains available to apply again.
- The observed-phenotype header is compact. HP:0000118 is an understated inline root row. Child rows share the parent grid, and their bars start further inward by depth. Tree connectors are darker and thicker.
- Reusable checks: `node scripts/test_pb_variant_layout.js` and `node scripts/test_pb_variant_carrier_statistics.js`. The development build passes with the existing LocusZoom/tabix-reader warning.

## Carrier meaning and hierarchy review

The separate gene side column is removed. The gene link is immediately before the variant coordinate in Variant identity.

`2 variant carriers shown` describes the people in the current display selection. Applying an HPO profile does not automatically filter them. The profile result's scored-carrier denominator remains the analysis-eligible roster, independently of observed phenotype metadata. A separate **Tested profile in carrier metadata** strip reports how many displayed carriers have each input HPO term or a descendant recorded, and labels incomplete metadata coverage. Counts do not interpret missing metadata as absence. The existing GJB2/Hearing abnormality example showed two observed variant carriers, 1/1 analysis carriers scored, and Hearing abnormality recorded in 0/2 carriers.

Exact input HPO terms are highlighted with a distinct background and a **Profile** tag. Their ancestor paths receive a subtler background. Present profile terms are revealed automatically without changing carrier filters. Depth-specific bar colours distinguish parent and child rows. Parent counts include descendant observations and are not additive.

The last visible top-level connector ends at the last branch's own row, instead of continuing to the next card. Carrier samples and the other detail cards have right-aligned up/down disclosure icons, separate from HPO branch toggles.

Verification includes synthetic observed/missing-HPO metadata cases, highlighting of exact terms versus ancestors, carrier selection remaining unchanged, template rendering, the existing statistics checks, and the development build. Native Chrome inspection confirmed the GJB2 record-count strip, depth colours, terminated tree connector and independent Carrier samples header.

## Phenotype data availability and performance correction — latest definition

This section supersedes the earlier count/record-strip wording above. The previous explanation incorrectly blurred an empty HPO list with phenotype data availability. Inspection of the two-carrier GJB2 example confirmed one nonempty phenotype list (98 records, 50 explicitly observed) and one empty list. Metadata-row existence and residual-score availability are separate measures.

- The profile column is **Carriers with phenotype data**, measured from nonempty source phenotype lists, with all observed variant carriers as denominator. It does not reuse the scorer's eligible-carrier count. Empty, unavailable and pending metadata are distinguished internally.
- **Settings** displays both aggregation and population, e.g. **Max · All** (defaults) or **Sum · Affected only**. β/P and the standardized mean calculation are unchanged. Individual-score coverage is available through the mean-Z information icon.
- The lower heading reports **Phenotype data available: 1 of 2 carriers** for the example. Observed phenotype counts and percentages use only those with phenotype records: **1 / 1**, instead of 1/2 (50%). The extra applied-term record-count strip is removed. Applied HPO highlighting remains.
- With only one carrier contributing phenotype information, bars and percentages are hidden in favour of explicit n/N values. For larger groups, bars are 12px thick and n/N (%) remains visible. Parent counts overlap descendants and must not be added.

The old Variant path performed individual browser BioIndex requests and did not reuse the Gene metadata cache. It also merged phenotype data only after the entire carrier list completed. The new private `POST /__pb_variant_carrier_metadata__` route uses the Gene endpoint's source/auth-scoped disk and memory caches and bounded request queue. Requests are limited to 100 IDs and checked against membership of the selected gene/exact variant. It returns individual metadata only for the private Variant workflow; do not mount it as a public aggregate API. The frontend requests 5 then 96 carriers per batch, displays progressive results, and keeps a bounded direct-query fallback for integrations missing the new route.

The normalized cache now retains explicitly observed HPO IDs separately from all recorded HPO IDs. Legacy cache entries without that distinction are refreshed once; absent/negated terms are never inferred as positive observations. Warm two-carrier live timings were 1.0238s for the first batch and 0.0081s for the repeated batch. These are metadata API measurements, not full-page or regression timings. A large first-time query or legacy-cache refresh may still take time; no claim of instant cold preparation is made.

Carrier gene and ontology references are interned and immutable, and metadata maps are frozen before Vue receives them. This avoids duplicating/reactively traversing the same gene/HPO objects across thousands of people. The full co-gene family remains intact for FDR.

Backend integration requires `scripts/variant_carrier_metadata_endpoint.js` alongside the updated `gene_carrier_summary_endpoint.js`. The existing local 8098 server was restarted with its environment preserved; production services were not deployed. Checks: `test_variant_carrier_metadata_endpoint.js`, `test_gene_carrier_summary_endpoint.js`, `test_gene_carrier_restart_cache.js`, `test_pb_variant_layout.js`, `test_pb_variant_carrier_statistics.js`, and the Vue development build. Native Chrome confirmed the new column headings and the one-of-two phenotype population with 1/1 row counts.

## 2026-11-13 — Header, demographics and annotation refinement

- The carrier heading is now **2 carriers observed in CRDC** (using actual counts and singular/plural grammar). AF remains at full precision in Variant identity and is not repeated in this heading.
- Variant demographics always show **Male / Female / Unknown** and **Yes / No / Unknown**, including zero-count categories. Missing values in retrieved metadata count as Unknown; people whose metadata has not loaded are not invented as Unknown, and partial coverage remains labelled.
- The shared Demographics component has an opt-in `inlineProjectSearch` prop. Variant enables it to place the search beside **Project / Investigator** in the table heading and remove the redundant Project title/count/search row. Four-row project pagination remains. Gene2's default layout is unchanged.
- Variant identity groups rsID, HGVSc/HGVSp and transcript/protein IDs on the left. The right column follows **Consequence → ClinVar → CRDC/gnomAD AF → LoFTEE/AlphaMissense/REVEL**, with spacing between the groups.
- Annotation labels and values, including linked gnomAD AF, use 18px text. Transcript labels stay on one line where desktop width permits; narrow layouts stack labels and values instead of overflowing.
- Native Chrome inspection confirmed these changes with the two-carrier GJB2 example. Variant layout/statistics and Gene2 regression checks pass. Development build passes with the existing LocusZoom/tabix-reader warning.

## 2026-11-13 — CRDC AF marker and phenotype profile history

- Available CRDC AF values in Variant identity use the same yellow marker treatment as the LoFTEE HC variant score. Full numeric precision is preserved; unavailable values are not highlighted.
- Each successful Apply adds a result to the top of the profile table. Earlier rows retain their HPO profile, SD beta, P, mean carrier Z, analysis details and Max/Sum + All/Affected settings. Only the most recently applied result is green and marked **Applied**. The lower phenotype/co-gene panels follow that applied result.
- Re-run uses the saved row's terms and settings and adds a fresh result. The source row remains. The × control deletes only its row; deleting the applied result clears the active analysis without deleting earlier rows. Re-run an earlier result to apply it again.
- Existing results remain visible during a new request and after a failed request. A late response from a previous variant cannot enter the new variant's table. Co-gene responses are checked against the applied result, so a pending new calculation does not invalidate the still-applied analysis prematurely.
- History is held for the current page and variant. Reloading the page or loading another variant starts a fresh history. Saved rows hold aggregate summaries rather than copies of individual carrier scores.
- Checks: `node scripts/test_pb_variant_profile_history.js` covers consecutive Apply, saved settings, immutable prior values, failure retention, re-run, individual deletion and stale responses. Existing Variant layout and carrier statistics checks also pass.

## 2026-11-13 — Applied HPO visibility and availability wording

The yellow tree highlight was still enabled, but the example's Hearing abnormality input was not in the observed carrier tree, leaving no matching row to highlight. Applied terms outside the current observed tree now remain visible as yellow reference labels above it. They are labelled **Not recorded in available phenotype data**, **Phenotype records incomplete**, or **No phenotype data in the current selection** as appropriate. These references do not add observations or change tree counts. Recorded input terms continue to receive the yellow tree-row highlight and are not duplicated in the reference labels. Only the current Applied result drives these highlights.

The profile table column is now **Carriers with any phenotype data**. A value of 1 / 2 means one of two variant carriers has any phenotype records; it is independent of whether the entered HPO is recorded. It can therefore remain 1 / 2 while the input HPO's recorded-carrier count is zero. The hover states that distinction explicitly. Missing records do not establish clinical absence. Tests cover the independent counts, highlighted rows, unlisted references, incomplete metadata and switching the applied term.


## 2026-11-13 — Remove repeated availability column

The profile results table no longer contains **Carriers with any phenotype data**. This value describes the variant's metadata coverage, remains the same across profile runs, and is already displayed above the observed phenotype tree. The table now contains Phenotype profile, β, P, Mean carrier rPheRS Z, Settings and row actions. The **Phenotype data available: 1 of 2 carriers** notice in Carrier phenotypes remains to explain the tree's population and denominator. Calculation, profile history and yellow highlighting are unchanged.


## 2026-11-13 — Sample table above carrier phenotypes

Carrier samples now appears between the phenotype profile result table and Carrier phenotypes, expanded initially. Its heading uses the complete exact-variant carrier count, e.g. **2 carrier samples**. The repeated aggregate mean Z/pathogenicity sum and carrier-count subtitle are removed, together with the Private BioIndex/metadata-matched line. The sample ID track has a bounded width so it does not create excess space before Age.

**Total HPO terms** precedes Affected and supports numeric sorting. It now uses the scorer's `n_terms`, not a count of BioIndex records or browser tree nodes. This supersedes the briefly attempted metadata-list count.

### Persistent scoring count source

rPheRS reads `2025_crdc_15764sample_hpo_parent_expanded_binary.tsv.gz`, sums each sample's binary row, and fits `raw PheRS ~ n_terms`. The live source is `/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/pb_context_demo/20261007-5a9ab06cc/source/2025_crdc_15764sample_hpo_parent_expanded_binary.tsv.gz`. The compressed input SHA-256 is `eaa0ea2e218d300d4b9546ec238128e146237cee92a43350bc2846d5bd834ba6` (15,764 rows; 6,440 HPO columns). The original metadata table has a separate `total_terms` field. For the first example carrier it is 97 while scoring-matrix `n_terms` is 98; those fields must not be substituted.

The verified matrix and its generated lookup persist in `.pb-private-data/rphers/`, excluded from Git and public assets. Generate a lookup for each approved scoring release with:

```sh
python3 scripts/build_pb_hpo_term_counts.py \
  --hpo-matrix /private/path/to/approved_scoring_hpo_matrix.tsv.gz \
  --output /private/path/to/hpo_term_counts.json
```

Configure `PB_HPO_TERM_COUNTS_FILE` in the metadata API environment, or use this prototype's default `.pb-private-data/rphers/hpo_term_counts.json`. `variant_hpo_term_counts_source.js` reads the persistent release lookup on carrier metadata requests, caches parsed values while its file is unchanged, and reloads atomically replaced files without restarting the server. A new scoring release requires rebuilding/replacing the lookup from that same approved matrix; no page-specific or sample-specific values are hardcoded. Invalid or missing source files cannot reuse stale values.

The existing private exact-variant metadata route attaches `n_terms` and `n_terms_status` after its carrier-membership check, with input fingerprint in `n_terms_source`. It does not enumerate cohort counts. No extra BioIndex lookup, browser reconstruction or regression is needed. Browser sample suffixes `_E38`/`_G38` map to the matrix's canonical sample ID.

Known empty phenotype records outside the matrix display 0 with `empty_phenotype_record` status; this does not imply scoring eligibility. A nonempty record with no matrix match or an unavailable count source stays unavailable. The column's info icon explains the source and distinction. The two example rows show 98 and 0. The local 8098 server was restarted with its existing environment; Gene2 on 8099 was not restarted. Tests cover matrix row sums and validation, provenance, persistent-file replacement, API membership/cache reuse, source counts differing from metadata length, zero/missing distinctions, sorting and section order.


## 2026-11-13 — One carrier card with matching headings

Sample rows and Carrier phenotypes now share one outer card, with a thin internal divider. The sample section retains its disclosure control but no longer has a separate card border or background. Both headings use h2 and the same typography: 28px on desktop and 24px on narrow layouts, with matching weight and line height. Native Chrome confirmed the shared card and matching titles; existing Variant layout and carrier-statistics checks pass.


## 2026-11-13 — Exact-variant evidence row and expandable carrier details

The shared carrier card now starts with the current variant's Gene2-style evidence table. Its columns are Variant, ClinVar, Total carriers, In Silico Predictors, Carriers with HPO, Mean carrier rPheRS Z, Variant beta (rPheRS SD) and P. Blue **Variant information** and green **Phenotype-based evidence** bands group those columns. The variant-row button expands the individual sample table below it; details start collapsed. Carrier phenotypes remains below in the same card, and the count heading is retained.

Beta, P and standardized mean use the currently Applied exact-variant response; no new regressions or q column are introduced. `Carriers with HPO` calls the same private `/__gene_variant_hpo_counts__` endpoint as Gene2 for this one variant. It matches at least one exact recorded HPO ID in the applied profile (OR), counts each distinct carrier once and uses all observed exact-variant carriers independently of display filters or All/Affected settings. It does not substitute score coverage or the number with any phenotype data. Loading, partial metadata coverage and failure remain explicit. Response checks prevent old-profile/old-variant counts appearing after an input change. Reapplying a profile can retry its count request.

The Carrier phenotypes info icon explicitly describes statistics among carriers with at least one recorded HPO term, excluding empty/unavailable records from the denominator. The hierarchy itself uses observed-positive annotations. A reference label for an applied term outside that hierarchy now says **Not listed among observed carrier phenotypes**; it does not claim the term is absent from the full metadata record. This distinction matters because Gene2's HPO reference count matches exact recorded IDs while the hierarchy only uses observed-positive terms. Existing layout, statistics, OR-count endpoint and asynchronous profile-history tests validate the new structure and count behavior.


Live verification for this evidence-row change: the Hearing abnormality profile returns Carriers with HPO = 0, mean Z = -0.549, Variant beta = -0.608 and P = 0.540. The shared Gene endpoint returns OR count = 1 when HP:0011897 is added. Native Chrome confirmed the row expands individual carriers underneath, with HPO totals 98 and 0, while Carrier phenotypes remains in the same outer card. The profile-history, layout, carrier-statistics and recorded-HPO endpoint checks pass, as does the production build.


## 2026-11-13 — Visually join summary and expanded samples

The variant evidence table and its expandable individual sample table now share one rounded border. The outline turns blue when expanded, and the connected detail area uses the same pale background with an internal divider instead of an external gap. Carrier phenotypes remains outside that inner border in the same outer carrier card. Native Chrome and the existing layout render check confirmed the grouping.


## 2026-11-13 — Match Gene2 expanded annotation and project search

Gene2's expanded Variant annotation now follows Variant identity's two-column grouping: rsID/HGVSc/HGVSp and transcript/protein IDs on the left; Consequence, ClinVar, CRDC/gnomAD AF, LoFTEE, AlphaMissense and REVEL on the right. Labels and values use consistent 18px text, values align right, desktop transcript labels stay on one line, and narrow screens stack fields. CRDC AF and the selected LoFTEE/AlphaMissense variant-score source receive the same yellow marker. ClinVar keeps classification-aware colour treatment and source hover text remains shared.

Transcript consequences are queried lazily for the expanded variant only, using the same BioIndex index, canonical variant ID and `buildTranscriptIdentity` MANE/gene selection as Variant page. A bounded cache shares repeated transcript lookups; late responses cannot overwrite a different expanded variant. Existing supplied HGVS and identifier references remain fallbacks. No per-gene eager transcript fetch is added.

The compact per-variant Carrier summary enables the shared inline project-search option. Its search now sits beside Project / Investigator in the table heading, removing the redundant Project/count/search rows. Project names occupy at most two lines, investigator labels one, with full titles available. Four-row pagination and project/investigator search are preserved. The main gene-wide overview's existing layout is unchanged.

Native Chrome on the 8099 Gene2 page confirmed the GJB2 example's transcript/protein fields, yellow CRDC/HC values and inline project search. Gene2 main and carrier-table checks, Variant layout checks, template compilation and production build pass.
