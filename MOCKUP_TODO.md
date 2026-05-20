# MOCKUP TODO: Result pages cleanup

## Working principle

The front page is done for now. Do not modify the front page unless explicitly requested.

This TODO is for the three result pages:
- sample page
- phenotype page
- variant page

Main goal:
Make result pages focus on interpretation, not repeated search setup.
Keep the UI simple, compact, and evidence-centered.

Important rules:
1. Do not redesign the whole app.
2. Do not add large new sections unless explicitly requested.
3. Use floating popovers, not full-screen modals.
4. Do not invent data we do not have.
5. If a field is not supported by current mock data or known data sources, remove it or mark it as unavailable in the mock structure.
6. Use color and bold only for clickable elements, active state, and important result values.
7. Labels and category names should not be visually louder than the actual evidence values.
8. All triangle open/close indicators should be orange.

---

# GLOBAL-1: Remove repeated context/search setup from result pages

Targets:
- src/views/KrSample/Template.vue
- src/views/KrPhenotype/Template.vue
- src/views/KrVariant/Template_V3.vue
- shared CSS only if needed

Apply to all three result pages.

Tasks:
1. Remove the large repeated “Clinical context x search subject” line.
2. Remove large explanation cards that repeat the original search condition.
3. Do not show search conditions as large cards on result pages.
4. Keep result pages focused on interpretation and evidence.
5. If the user needs to see the active context, show it only in the compact top-right tool area.

Do not modify front page.

---

# GLOBAL-2: Add compact Edit Context and Options controls

Targets:
- src/views/KrSample/Template.vue
- src/views/KrPhenotype/Template.vue
- src/views/KrVariant/Template_V3.vue
- shared context component files only if needed
- shared CSS only if needed

Apply to all three result pages.

Tasks:
1. In the upper-right tool area where “Large Text” currently exists, add an “Edit Context” button.
2. If a context is active, show the current context name near the button in small text.
   Example:
   Focus: Kabuki-like disorder
3. Clicking “Edit Context” should open a compact floating popover near the button.
4. The popover should show the current context information.
5. Keep the existing context information structure, but make it compact.
6. The popover must include “Remove Context”.
7. “Remove Context” should clear the active context and return the page to cohort-wide / hospital-wide interpretation mode.
8. Do not create an “In context / Out of context” toggle.
9. The popover must not push the page layout down.
10. The popover must have an X close button.
11. Clicking outside the popover should close it.

Do not modify front page.

---

# GLOBAL-3: Move Large Text into a three-dot Options menu

Targets:
- src/views/KrSample/Template.vue
- src/views/KrPhenotype/Template.vue
- src/views/KrVariant/Template_V3.vue
- shared CSS only if needed

Apply to all three result pages.

Tasks:
1. Add a Google-style vertical three-dot Options button next to “Edit Context”.
2. Clicking the Options button should open a small floating popover.
3. Move “Large Text” into this Options popover.
4. Large Text should consistently increase text size across sample, phenotype, and variant pages.
5. The Options popover should not be a full modal.
6. The Options popover should have an X close button.
7. Clicking outside the popover should close it.

Do not modify front page.

---

# GLOBAL-4: Context-aware result card wording

Targets:
- src/views/KrSample/Template.vue
- src/views/KrPhenotype/Template.vue
- src/views/KrVariant/Template_V3.vue
- mockData only if needed
- shared CSS only if needed

Apply to all three result pages.

Tasks:
1. If context is active, result cards should read as context-guided interpretation.
2. If no context is active, result cards should read as hospital-wide / cohort-wide discovery.
3. Do not split hospital-wide comparison into a separate tab.
4. If hospital-wide comparison is useful, show it only as a small baseline reference inside each card.
5. Do not make context labels visually louder than actual evidence values.
6. Do not invent context-specific evidence if current mock data does not support it.

Do not modify front page.

---

# SAMPLE-1: Simplify sample page header

Target:
- src/views/KrSample/Template.vue
- src/views/KrSample/style.css only if needed
- src/views/KrSample/mockData.js only if needed

Tasks:
1. Rename the top workflow label from “Current workflow - sample ID search” to “Sample search”.
2. Remove the duplicated title “Sample-centered evidence hub”.
3. In the main sample header card, show only the sample name / sample ID as the main title.
4. Remove these fields from the current sample header card:
   - HPO terms
   - GenDx
   - Sex/Age
   - Investigator
5. Move this explanation into an info icon next to “Sample search”:
   “Similar-patient search excludes this sample itself. The main score asks which other CRDC samples best reproduce this sample's HPO profile; rarer HPO terms contribute more than common broad terms.”
6. The info icon should open a compact floating popover.
7. Do not add a large explanation card.

Do not modify phenotype or variant pages in this task.

---

# SAMPLE-2: Compact top evidence summary

Target:
- src/views/KrSample/Template.vue
- src/views/KrSample/style.css only if needed

Tasks:
1. Combine these three items into one compact summary box:
   - Closest phenotype match
   - Group affinity
   - Disease hypothesis to review
2. Separate the three items with vertical dividers using “|” or equivalent visual separators.
3. Keep the summary compact and readable.
4. Do not make this section visually heavier than the main evidence sections.

Do not modify phenotype or variant pages in this task.

---

# SAMPLE-3: Clean Sample overview section

Target:
- src/views/KrSample/Template.vue
- src/views/KrSample/mockData.js only if needed
- src/views/KrSample/style.css only if needed

Tasks:
1. In the overview area, remove the text “Cohort position”.
2. Under “Sample overview”, remove the subtitle:
   “Identity, phenotype load, and existing evidence”
3. When no context is active, the Sample overview table should show fields in this order:
   - Proband
   - Affected
   - Sex
   - Age group
   - Investigator
   - Total HPO term count
   - HPO profile + dominant HPO group
   - Rare coding variant carrier gene count
4. When context is active, add context-related information below the sample overview table:
   - Context total HPO term count
   - Context HPO profile + dominant HPO group
   - Overlap ratio between the searched sample HPO profile and the context HPO profile
   - Dominant parent HPO group among overlapping terms
5. Keep this context-related information compact.
6. Do not invent exact context statistics if mock data does not support them. Add clearly named mock fields only if needed.

Do not modify phenotype or variant pages in this task.

---

# SAMPLE-4: Similar by phenotype tab cleanup

Target:
- src/views/KrSample/Template.vue
- src/views/KrSample/mockData.js only if needed
- src/views/KrSample/style.css only if needed

Tasks:
1. Remove the redundant text “Phenotype similarity” from the Similar by phenotype area.
2. Add an info icon next to:
   “Who looks most like this sample?”
3. The info icon should show this explanation in a compact floating popover:
   “The searched sample is not compared to itself here. Rows show other CRDC samples ranked by raw weighted phenotype similarity: query-term overlap, rare phenotype weight, and semantic/related-term consistency. Residual is not used for this nearest-patient ranking.”
4. Update the similar sample table columns from:
   Sample | Similarity rank | Shared phenotype signal | Diagnosis | Best genetic clue | Why it matters
   to:
   Sample | Similarity rank | Shared phenotype counts | Best Disease | Best genetic clue | Note
5. “Shared phenotype counts” should show counts only.
   Example:
   14 / 47
6. “Similarity rank” and “Note” should use normal text color, not blue.
7. Blue color should only be used for clickable values.
8. Intended clickable fields:
   - Sample: links to sample page search
   - Shared phenotype counts: links to phenotype page
   - Best Disease: links to variant or disease evidence view if supported
   - Gene information in Best genetic clue: links to variant page
9. Use HPO term names when showing phenotype terms.
   Avoid vague labels such as “speech” or “growth” if they are not actual HPO term names.

Do not modify phenotype or variant pages in this task.

---

# SAMPLE-5: Phenotype profile composition display

Target:
- src/views/KrSample/Template.vue
- src/views/KrSample/style.css only if needed

Tasks:
1. Do not show phenotype profile composition as bubbles.
2. Show it as a simple collapsible section using an orange triangle indicator.
3. Use triangle open/close only:
   - collapsed: orange ▸
   - expanded: orange ▾
4. The stacked bar plot should have square ends, not rounded ends.
5. The stacked bar should visually represent the actual fraction.
   Example:
   If the value is 14 / 47, the bar should not look fully filled.
6. Make the display look like stacked bricks, not a rounded pill.

Do not modify phenotype or variant pages in this task.

---

# SAMPLE-6: Similar by genotype tab cleanup

Target:
- src/views/KrSample/Template.vue
- src/views/KrSample/mockData.js only if needed
- src/views/KrSample/style.css only if needed

Tasks:
1. Add an info icon next to:
   “Who shares a relevant genetic mechanism?”
2. Move this explanation into the info popover:
   “This is genotype-first context for the same searched sample. Exact same variant, same gene, and same mechanism are separated because they imply different evidence strength and should not be interpreted as equivalent.”
3. Remove “same pathway/mechanism” if the current data does not actually support pathway or mechanism annotation.
4. Do not invent pathway or mechanism data.
5. For same-gene-related tables, only clickable fields should be blue.
6. “Genetic similarity” should be normal black text unless it is clickable.
7. The table should clearly represent gene-level evidence.
8. If a shared gene is shown, the gene name should be the core value.
9. Variant-level information such as LoF should be shown separately and clearly.
10. Do not imply that both samples have the same variant consequence unless the mock data explicitly supports it.
11. Use actual HPO term names for key phenotype fields.

Do not modify phenotype or variant pages in this task.

---

# SAMPLE-7: Public disease hypotheses tab cleanup

Target:
- src/views/KrSample/Template.vue
- src/views/KrSample/mockData.js only if needed
- src/views/KrSample/style.css only if needed

Tasks:
1. Rename “Public disease hypotheses” so it clearly indicates that the information comes from public disease databases.
2. Avoid interpretation labels such as “moderate-high”.
3. Do not overstate evidence strength.
4. Keep this tab as a public database reference, not a final diagnosis section.

Do not modify phenotype or variant pages in this task.

---

# SAMPLE-8: Gene/Variant evidence tab as evidence checklist

Target:
- src/views/KrSample/Template.vue
- src/views/KrSample/mockData.js only if needed
- src/views/KrSample/style.css only if needed

Tasks:
1. The Gene/Variant evidence tab should look like a gene-level evidence checklist, not a narrative interpretation section.
2. Replace or shorten the abstract method note.
3. Preferred short note:
   “Genes are prioritized when rare sample variants align with phenotype evidence, known disease links, internal same-gene carriers, and GenDX support.”
4. Strengthen row-level evidence.
5. Example checklist structure for a gene:
   - Gene: KMT2D
   - Best variant: missense · rare
   - Disease link: Kabuki syndrome
   - Phenotype fit: 11 / 18 disease HPO terms
   - Internal support: 4 same-gene carriers, 2 phenotype-similar
   - GenDX: supporting evidence
   - Priority reason: rare variant + phenotype fit + same-gene recurrence
6. Every evidence field must have a clear source in the current mock data or known available data.
7. Do not invent unavailable information.
8. If current mock data does not support a field, either remove that field or add a clearly named mock field that represents the intended future data structure.

Do not modify phenotype or variant pages in this task.

----
# SAMPLE-3 결과 중 GenDx panel 부분만 수정해주세요.

수정 대상:

* src/views/KrSample/Template.vue
* 필요할 경우에만 src/views/KrSample/style.css
* 필요할 경우에만 src/views/KrSample/mockData.js

현재 문제:
GenDX PANEL RESULT 섹션이 너무 별도 카드처럼 보이고, Gene / Variant / Pathogenicity가 각각 큰 카드 3개로 나뉘어 있습니다. 이 방식은 샘플 overview 흐름과 맞지 않습니다.

원하는 수정:

1. 제목을 “GenDX panel result”가 아니라 “GenDx panel”로 바꿔주세요.

2. “GenDx panel” 제목 옆에 파란색 info 아이콘을 추가해주세요.

3. 아래 설명 문장은 화면에 직접 길게 노출하지 말고, info 아이콘을 눌렀을 때 뜨는 작은 floating popover 안으로 넣어주세요.

   문장:
   “Existing panel evidence is treated as a reported candidate, not automatic proof. The page checks whether phenotype similarity, similar-patient recurrence, and public disease match support the same interpretation.”

4. 기존의 Gene / Variant / Pathogenicity 3개 큰 카드는 제거하고, Sample overview와 비슷한 row-by-row table 형태로 바꿔주세요.

5. GenDx에서 보고된 변이가 있는지 여부가 가장 중요한 정보이므로, table 맨 위 row에 넣어주세요.

   원하는 표시 예시:

   GenDx panel

   Status          Yes · reported panel variant
   Gene            KMT2D
   Variant         chr12:49,431,208 C>T
   Pathogenicity   Likely pathogenic

6. Variant 값은 클릭 가능한 값처럼 보여야 합니다.
   클릭하면 variant page로 이동하는 링크처럼 처리해주세요.
   실제 routing이 아직 없으면 기존 mockup에서 쓰는 방식과 맞춰 placeholder link로 처리해도 됩니다.

7. 하단의 “Review reported variant” 버튼은 제거해주세요.
   Variant row 자체가 variant page로 넘어가는 entry point이면 충분합니다.

8. 만약 GenDx panel result가 1개 이상일 수 있다면, 제목 또는 Status row에 개수를 표시해주세요.
   예:
   “GenDx panel (1)”
   또는
   “GenDx panel (3)”

9. GenDx panel result가 여러 개일 경우, GenDx panel 제목 row 오른쪽에 작은 dot navigation을 추가해주세요.
   예:
   ○ ○ ○
   사용자가 dot을 누르면 다음 GenDx-reported variant 정보로 전환되는 구조입니다.
   단, 현재 mockData에 1개만 있으면 dot은 1개만 보이거나 생략해도 됩니다.

10. 이 GenDx panel은 최종 진단처럼 보이면 안 됩니다.
    “reported candidate evidence”처럼 보여야 합니다.
    과도한 색상이나 strong label은 쓰지 마세요.

하지 말아야 할 것:

* phenotype page, variant page, front page는 수정하지 마세요.
* SAMPLE-4 이후 작업은 하지 마세요.
* 전체 Sample overview 레이아웃을 다시 디자인하지 마세요.
* GenDx 정보를 새로운 큰 카드 3개로 다시 만들지 마세요.
* “Review reported variant” 버튼을 유지하지 마세요.

수정 후 아래만 짧게 보고해주세요:

1. 수정한 파일
2. 수정 내용 요약
3. 확인 URL

