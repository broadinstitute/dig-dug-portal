# CRDC Rare Disease Portal 정적 Preview 상세 설명서

작성 기준:
- 정적 preview HTML: `docs/portal_new_preview.html`
- preview screenshot:
  - `docs/portal_new_preview_files/portal_new_preview_front.png`
  - `docs/portal_new_preview_files/portal_new_preview_sample.png`
  - `docs/portal_new_preview_files/portal_new_preview_phenotype.png`
  - `docs/portal_new_preview_files/portal_new_preview_variant.png`
- 개선안 문서: `docs/portal_new_description.md`
- reframe 후보 archive: `docs/archive/reframe_candidate_20260523/`

이 문서는 실제 Vue 포털 구현 문서가 아니라, 개선안 적용 전에 만든 **정적 화면 preview artifact**가 무엇을 보여주고, 어떤 판단을 돕기 위해 만들어졌는지 설명합니다.

---

## 1. 정적 preview의 목적

현재 포털의 방향성은 다음처럼 정리되었습니다.

1. 해석 방향과 정보 계층은 reframe 쪽이 더 맞습니다.
2. 그러나 화면 구성, 카드 밀도, 표, popover, locus/carrier 시각화는 기본 포털이 더 낫습니다.
3. 따라서 reframe을 계속 확장하지 않고, 기본 포털의 visual system 위에 reframe의 해석 계층을 흡수해야 합니다.

정적 preview는 이 방향을 실제 Vue 코드에 바로 적용하기 전에, **레이아웃이 망가지지 않는지**, **정보 계층이 읽히는지**, **어떤 섹션을 유지/삭제/추가해야 하는지**를 빠르게 판단하기 위한 화면입니다.

중요한 점:
- 이 preview는 실제 앱이 아닙니다.
- Vue component가 아닙니다.
- route가 아닙니다.
- DB와 연결되지 않습니다.
- 클릭, 탭 전환, popover, context 저장 동작은 없습니다.
- 화면 방향과 정보 구조만 확인하기 위한 정적 HTML입니다.

---

## 2. 생성된 파일 구조

| 파일 | 역할 |
|---|---|
| `docs/portal_new_preview.html` | 네 페이지의 개선 후 예상 구조를 한 HTML 안에 그린 정적 preview |
| `docs/portal_new_preview_files/portal_new_preview_front.png` | front page 예상 화면 screenshot |
| `docs/portal_new_preview_files/portal_new_preview_sample.png` | sample page 예상 화면 screenshot |
| `docs/portal_new_preview_files/portal_new_preview_phenotype.png` | phenotype page 예상 화면 screenshot |
| `docs/portal_new_preview_files/portal_new_preview_variant.png` | variant page 예상 화면 screenshot |
| `docs/archive/reframe_candidate_20260523/` | 기존 reframe 후보를 나중에 볼 수 있도록 보관한 archive |

정적 preview는 하나의 HTML 파일 안에 네 개의 `<section>`을 둡니다.

```html
<section id="front-preview" class="preview-page">...</section>
<section id="sample-preview" class="preview-page">...</section>
<section id="phenotype-preview" class="preview-page">...</section>
<section id="variant-preview" class="preview-page">...</section>
```

브라우저 screenshot을 캡처할 때는 query parameter로 한 화면만 보이게 했습니다.

```text
docs/portal_new_preview.html?screen=front
docs/portal_new_preview.html?screen=sample
docs/portal_new_preview.html?screen=phenotype
docs/portal_new_preview.html?screen=variant
```

이 동작은 CSS selector로 처리됩니다.

```css
body.screen-front .preview-page:not(#front-preview),
body.screen-sample .preview-page:not(#sample-preview),
body.screen-phenotype .preview-page:not(#phenotype-preview),
body.screen-variant .preview-page:not(#variant-preview) {
  display: none;
}
```

---

## 3. 정적 preview의 범위와 한계
### 3.1 포함된 것

| 포함 | 설명 |
|---|---|
| 기본 포털형 topbar | `CURRENT WORKFLOW`, workflow value, top-right context control |
| 기본 포털형 card/panel | 둥근 card, subtle border, compact table |
| reframe에서 가져온 interpretation summary | 각 결과 페이지 상단의 metric band |
| CRDC-first evidence hierarchy | CRDC evidence를 가장 앞에 두는 구조 |
| reference tier 구분 | Orphanet/HPO, DECIPHER/MONDO/OMIM, secondary badges 구분 |
| PheRS/GRS placeholder | 계산값은 현재 `not calculated`로 표시 |
| variant scope 구분 | exact queried variant, same gene, nearby region count 분리 |

### 3.2 포함되지 않은 것

| 제외 | 이유 |
|---|---|
| 실제 Vue state | 구현 전 layout 검토용입니다. |
| 실제 DB fixture import | 화면 형태를 먼저 보기 위한 정적 예시입니다. |
| tab click | static screenshot에서 탭의 시각 구조만 보여줍니다. |
| popover | preview에서는 정보 구조만 표현합니다. |
| context 저장 | `sessionStorage` 연결 없음 |
| route navigation | 실제 `/krSample.html` 등으로 이동하지 않음 |
| responsive/mobile 검증 | 현재는 desktop first preview입니다. |

---

## 4. 반영된 사용자 주석과 해석 수정

`portal_new_description.md` 앞부분의 HTML 주석을 반영해 preview 방향을 조정했습니다.

### 4.1 CRDC가 항상 1순위

주석의 핵심:

```text
모든 우선순위는 CRDC야. CRDC기반으로 최대한의 결과를 주고
DB바탕은 DB바탕 결과가 따로 있는거야.
내부에서 못찾으면 못찾았다고 명시하고 나서 후보를 보이는거야.
```

Preview 반영:

- front page에서 `CRDC first`를 명시했습니다.
- sample preview summary 첫 항목을 `CRDC sample profile`로 두었습니다.
- phenotype preview에서 `CRDC matched cohort`와 `CRDC cohort evidence`를 별도 block으로 둡니다.
- variant preview에서 exact variant carrier count와 same-gene carrier count를 맨 앞에 둡니다.

### 4.2 Reference tier 재정의

주석의 핵심:

```text
Orphanet이 core이고 HPO는 기본 검색 단위/ontology hierarchy.
DECIPHER, MONDO, OMIM은 1.5순위 정도.
PanelApp, Reactome, WikiPathways는 secondary.
```

Preview 반영:

```text
CRDC first → Orphanet/HPO → DECIPHER/MONDO/OMIM → secondary badges
```

이 구조는 front preview의 `Evidence layers`와 `Our purpose` card, phenotype preview의 `Reference order`, sample preview의 `Reference profile`에서 반복됩니다.

### 4.3 PheRS/GRS는 목업 슬롯 유지

주석의 핵심:

```text
계산은 나중에 실제 구현되면 넣어야 하므로 목업에도 있어야 한다.
```

Preview 반영:

- PheRS/GRS section을 제거하지 않았습니다.
- 대신 현재 test fixture에서 계산되지 않은 값은 `not calculated in this fixture` 또는 `PheRS residual: not calculated`로 표현했습니다.
- 즉, 미래 backend 계산이 들어올 자리를 보존하되, 현재 계산된 것처럼 보이지 않게 했습니다.

### 4.4 “위치”와 “비슷한 sample/group” 중복 정리

주석의 핵심:

```text
CRDC cohort 안에서 어디에 위치하는가와 비슷한 sample/group이 있는가는 중복이다.
```

Preview 반영:

- front preview에서는 `Hidden goal`을 “새로운 cohort/group/gene/variant insight를 찾는 것”으로 표현했습니다.
- sample preview에서는 `Similar sample/group`을 하나의 summary metric으로 묶었습니다.
- cohort position을 별도의 추상 항목으로 반복하지 않았습니다.

### 4.5 Active context는 overlap뿐 아니라 pattern도 봄

주석의 핵심:

```text
1차는 겹치는 것이지만, 패턴을 보는 것도 좋다.
```

Preview 반영:

- sample preview의 `Context match`는 `Pattern overlap`으로 표현했습니다.
- 설명에 `HPO overlap + domain pattern, not genotype similarity`를 넣었습니다.
- front preview의 context rule도 `HPO pattern overlap`으로 표현했습니다.

---

## 5. 공통 visual system

정적 preview는 기본 포털의 시각 언어를 흉내냅니다.

### 5.1 색상

```css
:root {
  --ink: #172033;
  --muted: #5f6b7d;
  --line: #d9e2ef;
  --soft: #f4f7fb;
  --blue: #0055ff;
  --green: #17824a;
  --orange: #c96f22;
}
```

의미:

| 색 | 역할 |
|---|---|
| dark ink | page title, section title, key value |
| muted gray | secondary 설명, source note |
| blue | clickable처럼 보이는 값 또는 action |
| green | positive/context rule callout |
| orange | caution/no-context guide |
| line gray | table/card separator |

### 5.2 Page container

```css
.preview-page {
  width: 1600px;
  min-height: 1000px;
  margin: 28px auto;
  padding: 34px;
  background: #f8fafc;
  border: 1px solid #dbe3ee;
  border-radius: 30px;
  box-shadow: var(--shadow);
}
```

해석:

- 각 preview page는 실제 browser viewport 하나처럼 보이도록 1600px wide card로 만들었습니다.
- 실제 Vue app의 완전한 responsive behavior를 검증하는 목적은 아닙니다.
- screenshot은 desktop 화면의 정보 hierarchy 판단용입니다.

### 5.3 Topbar

```css
.workflow-label {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.workflow-value {
  font-size: 38px;
  font-weight: 800;
}
```

의미:
- 기존 기본 포털에서 “CURRENT WORKFLOW value가 작아 보인다”는 문제를 반영해 workflow value를 크고 명확하게 유지했습니다.
- top-right context control은 pill/button이 아니라 inline text 형식입니다.

### 5.4 Panel/card

```css
.panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 26px;
}
```

의미:
- reframe처럼 flat하게 흩어지지 않고, 기본 포털의 card containment를 유지합니다.
- 다만 card 안에 또 과도한 card를 중첩하지 않도록 metric band와 table은 divider 중심으로 설계했습니다.

### 5.5 Metric band

```css
.metric-band {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border: 1px solid var(--line);
  border-radius: 20px;
  overflow: hidden;
}
```

의미:
- reframe의 top interpretation summary를 기본 포털 스타일에 맞춰 흡수한 핵심 UI입니다.
- 새로운 큰 section이 아니라 header 바로 아래 compact 요약 band입니다.
- 각 metric은 `small label`, `strong value`, `secondary explanation`으로 구성됩니다.

### 5.6 Table

```css
th {
  font-size: 15px;
  font-weight: 800;
  text-transform: uppercase;
}

td {
  font-size: 17px;
  font-weight: 400;
}
```

의미:
- 사용자가 지적했던 “table body 값이 너무 bold” 문제를 반영했습니다.
- column header만 bold이고, body value는 regular weight입니다.

---

## 6. Front preview 상세 설명

Screenshot:

![Front preview](/Users/kyuryung/Documents/github_dir/dig-dug-portal/docs/portal_new_preview_files/portal_new_preview_front.png)

### 6.1 목적

Front preview의 목적은 세 search mode를 독립 tool처럼 보이지 않게 하고, 같은 CRDC cohort exploration workflow의 세 entry point로 보이게 하는 것입니다.

### 6.2 화면 구조

| 영역 | 내용 | 의도 |
|---|---|---|
| topbar | `CURRENT WORKFLOW Rare disease cohort search` | portal 전체 workflow라는 느낌 |
| context control | `ⓘ No context | Set Context | ⋮` | global context 상태 표시 |
| left panel | `One cohort exploration workflow` | 세 검색 시작점이 같은 workflow임을 설명 |
| divider card | Search subject / Optional HPO context / Evidence layers | reframe의 workflow band를 기본 카드형으로 흡수 |
| search mode cards | sample, variant/gene, phenotype | 실제 검색 entry point |
| right panel | `Our purpose` | CRDC-first evidence hierarchy 설명 |
| evidence metric band | Primary / Reference / Secondary | evidence source tier 구분 |
| context rule callout | active context는 HPO pattern overlap | variant와 context 직접 비교 금지 |

### 6.3 세 entry point

| 카드 | 예시 값 | 의미 |
|---|---|---|
| Search by sample | `BCH-22-44945-01` | sample phenotype/genotype hub로 이동 |
| Search by variant/gene | `chr2:231222761:AT:A` | exact variant 또는 same-gene carrier set 해석 |
| Search by phenotype | `Abnormal oral morphology [HP:0031816]` | HPO profile query |

### 6.4 중요한 해석
Front preview는 “사용자가 자신이 무엇을 검색했는지 모른다”는 의미의 요약이 아닙니다. 의도는 검색 종류가 달라도 **해석 목적은 CRDC evidence exploration으로 통합된다**는 점을 보여주는 것입니다.

### 6.5 실제 구현 시 반영할 점

| Preview 요소 | 실제 구현 방향 |
|---|---|
| workflow band | `krFront.html`의 search card 주변에 compact card로 추가 |
| search examples | generated fixture의 대표 sample/variant/phenotype query와 맞춤 |
| reference tier 설명 | `Our purpose` card에 흡수 |
| context rule | context area 근처 info tooltip로 이동 가능 |

### 6.6 주의할 점

- front page가 설명문-heavy해지면 안 됩니다.
- `Our purpose` card는 유지하되, 긴 텍스트보다 compact hierarchy로 보여주는 편이 낫습니다.
- `Set Context` panel은 현재 기본 포털의 floating behavior를 유지하는 것이 좋습니다.

---

## 7. Sample preview 상세 설명

Screenshot:

![Sample preview](/Users/kyuryung/Documents/github_dir/dig-dug-portal/docs/portal_new_preview_files/portal_new_preview_sample.png)

### 7.1 목적

Sample preview는 sample page를 포털의 핵심 interpretation hub로 유지하면서, reframe의 summary-first 계층을 기본 UI 안에 넣는 방향을 보여줍니다.

핵심 질문:

- 이 sample 자체는 어떤 phenotype/genotype profile을 갖는가?
- CRDC 내부에서 비슷한 sample/group 또는 recurrent gene/variant evidence가 있는가?
- reference disease profile은 무엇을 보조하는가?
- active context가 있을 때 HPO overlap과 domain pattern이 맞는가?

### 7.2 화면 구조

| 영역 | 내용 | 의도 |
|---|---|---|
| topbar | `CURRENT WORKFLOW Sample search` | sample page임을 명확히 표시 |
| context control | `ⓘ Context active | Edit Context | ⋮` | active context 상태 |
| sample header | `BCH-22-44945-01` | 검색 대상 sample |
| compact metadata | `male | Age 12-17 | GenDx: Not loaded · 107 HPO terms | 17 genes...` | 기존 header 정보를 더 압축 |
| interpretation summary band | 5개 metric | reframe summary를 기존 header 위치에 흡수 |
| source row | CRDC first / PheRS-GRS slot / Secondary badge | 계산/annotation tier 설명 |
| left lower panel | Sample phenotype / genotype overview | sample 자체 profile |
| right lower panel | 기존 main tab 구조 | 기본 포털 tab visual 유지 |

### 7.3 Interpretation summary band

| Metric | Preview value | 의미 |
|---|---|---|
| CRDC sample profile | `107 HPO terms` | sample phenotype burden |
| Similar sample/group | `BCH-19-86295-01` | 비슷한 개별 sample 또는 group evidence |
| Recurrent evidence | `ARMC9` | same-gene/carrier HPO evidence |
| Reference profile | `Chronic mucocutaneous candidiasis` | Orphanet first, DECIPHER/MONDO/OMIM review tier |
| Context match | `Pattern overlap` | active HPO context와 sample HPO/domain pattern 비교 |

이 band는 새 reframe layout이 아니라, 기존 sample header와 top summary card를 개선한 형태입니다.

### 7.4 Source row

Preview text:

```text
CRDC first: 내부 sample/variant recurrence를 먼저 표시
PheRS/GRS: not calculated in this fixture 슬롯은 유지
Secondary: PanelApp/Reactome/WikiPathways는 badge만
```

의도:

- 계산값이 아직 없더라도 PheRS/GRS 자리를 삭제하지 않습니다.
- 다만 실제 계산된 것처럼 보이지 않게 합니다.
- secondary annotation은 필터가 아니라 badge라는 원칙을 명시합니다.

### 7.5 Lower left panel

`Sample phenotype / genotype overview`는 sample 자체를 먼저 이해하는 영역입니다.

Preview table:

| Item | Value | Source |
|---|---|---|
| Proband | No | sample metadata |
| Affected | Yes | sample metadata |
| Dominant HPO area | Abnormal oral / immune-related morphology | sample_hpo aggregation |
| Top variant evidence | `chr2:231222761:AT:A · ARMC9` | sample_variant + recurrence |

실제 구현에서는 이 panel이 현재 `Overview` tab의 sample overview table 및 GenDx panel과 연결됩니다.

### 7.6 Lower right panel

기존 main tabs를 유지합니다.

| Tab | Preview에서 보여주는 개선 방향 |
|---|---|
| Overview | sample 자체 + summary 중심 |
| Similar samples | sample similarity와 context match 분리 |
| Similar by genotype | qualitative label 대신 shared HPO count |
| Disease profile matches | disease hypothesis가 아니라 profile reference |
| Gene / variant evidence | CRDC recurrent candidate와 reference-supported candidate 분리 |

### 7.7 실제 구현 시 반영할 점

| Preview 요소 | 실제 구현 방향 |
|---|---|
| metadata 압축 | 현재 sample header에 유지 |
| metric band | 기존 top answer compact summary를 확장 |
| `PheRS/GRS not calculated` | 계산 슬롯은 유지하되 NA 처리 |
| Reference profile metric | `Disease hypothesis` wording 제거 |
| Similar sample/group metric | `cohort position`과 중복되지 않게 통합 |
| lower right tab style | 기존 `mainTabs` 유지 |

### 7.8 확인해야 할 위험

| 위험 | 설명 |
|---|---|
| metric band가 너무 무거워질 수 있음 | 실제 sample page에서는 5칸이 좁으면 2-row compact layout 고려 |
| Reference profile이 diagnosis처럼 보일 수 있음 | 항상 `profile reference` 또는 `reference match`로 표시 |
| Context match가 genotype similarity처럼 보일 수 있음 | `HPO overlap + domain pattern` 문구 유지 |
| PheRS/GRS NA가 오류처럼 보일 수 있음 | `not calculated in this test fixture` 설명 필요 |

---

## 8. Phenotype preview 상세 설명

Screenshot:

![Phenotype preview](/Users/kyuryung/Documents/github_dir/dig-dug-portal/docs/portal_new_preview_files/portal_new_preview_phenotype.png)

### 8.1 목적

Phenotype preview는 검색한 HPO profile이 CRDC cohort와 external reference에서 어떻게 해석되는지 보여줍니다.

핵심은 다음 분리입니다.

1. Query phenotype profile
2. Phenotype-derived disease/gene candidates
3. CRDC cohort evidence

### 8.2 Top query section

Preview content:

```text
Query phenotype profile
Abnormal circulating purine concentration [HP:0004352]
Abnormal oral morphology [HP:0031816]

Phenotype-similar samples
20 / 350
```

의도:
- 기존 hard-coded `Cleft palate`, `Developmental delay`, `132 / 904` 대신 generated fixture와 맞는 구조를 상정했습니다.
- query HPO terms는 plain text로 표시합니다.
- HPO query와 active context는 섞지 않는다는 rule을 유지합니다.

### 8.3 Top summary right side

Preview:

| Box | 내용 |
|---|---|
| CRDC matched cohort | `20 matched samples in current test fixture` |
| Profile scoring | `PheRS residual: not calculated` |
| age bar | 시각 구조만 표현 |

이 구조는 현재 phenotype top card의 right summary를 간결하게 유지하면서, 계산되지 않은 값은 명확히 `not calculated`로 표시하는 방향입니다.

### 8.4 Reference order rule

Preview text:

```text
Reference order: Orphanet/HPO → DECIPHER/MONDO/OMIM → secondary badges.
```

의미:

- Orphanet/HPO가 core입니다.
- DECIPHER/MONDO/OMIM은 disease/reference layer에서 1.5 tier로 고려합니다.
- PanelApp/Reactome/WikiPathways 등은 secondary badge입니다.

### 8.5 Phenotype-derived candidates

이 section은 입력 HPO profile에서 나온 disease/gene 후보를 먼저 보여주고, CRDC variant evidence를 overlay하는 영역입니다.

Preview tabs:

| Tab | 의미 |
|---|---|
| Disease candidates | input HPO profile과 disease reference profile match |
| Gene candidates | HPO/gene/disease annotation 기반 gene 후보 |
| Cohort variant overlay | 후보 gene 안에서 CRDC cohort variant가 관찰되는지 |

Preview table columns:

| Column | 의미 |
|---|---|
| Disease candidate | disease profile candidate |
| Profile match | exact/related HPO profile overlap 또는 score |
| Reference tier | Orphanet/HPO core인지, DECIPHER/MONDO/OMIM review tier인지 |
| CRDC evidence | phenotype-matched cohort에서 carrier/recurrent evidence가 있는지 |

중요한 점:

- `Query support 2 / 2`만으로 candidate가 결정되는 것처럼 보이면 안 됩니다.
- PheRS/profile score가 없으면 `NA`로 표시합니다.
- CRDC recurrence는 external reference가 부족해도 보존합니다.

### 8.6 CRDC cohort evidence

이 section은 phenotype profile을 CRDC cohort에 적용했을 때 보이는 내부 evidence입니다.

Preview tabs:

| Tab | 의미 |
|---|---|
| Matched samples | phenotype-matched sample list |
| Co-observed phenotypes | matched sample set에서 반복되는 추가 HPO terms |
| Investigator-level evidence | investigator/group-level pattern |

Preview matched sample table:

| Column | 의미 |
|---|---|
| Rank | matched sample rank |
| Sample | clickable sample ID |
| Query terms matched | original query terms 기준 |
| Total HPO terms | selected sample burden |
| Candidate signals | CRDC internal candidate gene/variant signals |

### 8.7 실제 구현 시 반영할 점

| Preview 요소 | 실제 구현 방향 |
|---|---|
| 20 / 350 | generated phenotype fixture 값과 동기화 |
| PheRS residual NA | 계산 전까지 `not calculated` |
| Disease candidates table | 현재 table에 reference tier/source column 정리 |
| CRDC cohort evidence tabs | 현재 tab style을 Phenotype-derived candidates와 맞춤 |
| Co-observed phenotypes | disease candidate section이 아니라 CRDC cohort evidence 안에 유지 |

### 8.8 확인해야 할 위험

| 위험 | 설명 |
|---|---|
| top summary와 CRDC cohort evidence가 중복될 수 있음 | top은 high-level count, lower는 drill-down으로 구분 |
| PheRS 문구가 과장될 수 있음 | 계산값 없으면 `NA` |
| disease candidate가 diagnosis처럼 보일 수 있음 | candidate/reference profile wording 유지 |
| CRDC evidence와 external annotation이 섞일 수 있음 | column/source tier를 명확히 분리 |

---

## 9. Variant preview 상세 설명

Screenshot:

![Variant preview](/Users/kyuryung/Documents/github_dir/dig-dug-portal/docs/portal_new_preview_files/portal_new_preview_variant.png)

### 9.1 목적

Variant preview는 queried variant/gene page에서 가장 먼저 필요한 scope 구분을 보여줍니다.

핵심 분리:

1. exact queried variant
2. same gene carrier set
3. nearby region/per-position carrier count
4. carrier HPO profile
5. active context vs carrier HPO profile

### 9.2 Header

Preview:

```text
chr2:231222761:AT:A
ARMC9 Variant | test DB | rare/damaging test subset
```

이것은 generated fixture 기반 값을 기준으로 한 예시입니다. 실제 구현에서는 stale static value인 `chr15`, `UBE3A`, `18 carriers`가 남지 않아야 합니다.

### 9.3 Variant summary band

| Metric | Preview value | 의미 |
|---|---|---|
| Exact queried variant | `259 carriers` | 정확히 같은 variant carrier |
| Same gene | `329 ARMC9 carriers` | 같은 gene 안의 carrier set |
| Carrier phenotype | `Carrier HPO profile` | carriers의 phenotype structure |
| Reference | `Orpha 79320 · Orpha 391665` | gene-level rare disease reference |
| Context match | `Carrier HPO vs context HPO` | context는 variant 자체와 비교하지 않음 |

이 band는 variant page에서 가장 중요한 count scope를 첫 화면에서 분리하기 위한 것입니다.

### 9.4 Queried variant window

Preview는 실제 genome browser를 재구현하지 않고, 형태만 보여줍니다.

표현된 요소:

- horizontal locus line
- variant marker
- density/per-position carrier count bar
- disease track/gene track/per-position note

실제 구현에서는 기존 `krVariant.html`의 locus track을 유지하고, 값만 generated fixture와 동기화하는 것이 맞습니다.

### 9.5 Carrier phenotype profile

Preview table:

| Column | 의미 |
|---|---|
| HPO root category | carrier set에서 많이 보이는 root category |
| Carrier support | exact variant carrier 중 support |
| Context action | category 또는 term을 context source로 선택 |

Preview rows:

- `Abnormality of the nervous system [HP:0000707]`
- `Abnormality of head or neck [HP:0000152]`
- `Growth abnormality [HP:0001507]`

이 preview는 실제 variant page에서 이미 개선된 “phenotype category/term checkbox 선택 후 Edit context panel” 흐름을 방향성으로 반영합니다.

### 9.6 No-context guide

Preview callout:

```text
Context position in CRDC는 active context가 있을 때만 score처럼 보입니다.
No context 상태에서는 “Set context to evaluate carrier HPO profile” 안내만 보여줍니다.
```

의미:

- context가 없는데도 context score가 있는 것처럼 보이면 안 됩니다.
- no context 상태는 missing data가 아니라 “context 기반 해석을 아직 하지 않음”입니다.

### 9.7 실제 구현 시 반영할 점

| Preview 요소 | 실제 구현 방향 |
|---|---|
| exact/same gene metric band | 현재 variant header 아래 compact summary로 추가 |
| stale value cleanup | `chr15`, `UBE3A`, `18 carriers` 제거 |
| carrier phenotype profile | 기존 block 유지, data-driven value로 교체 |
| context action | direct set이 아니라 Edit context confirmation 유지 |
| no-context guide | Context position card에 조건부 표시 |

### 9.8 확인해야 할 위험

| 위험 | 설명 |
|---|---|
| exact variant와 same gene count가 섞일 수 있음 | 모든 count에 scope label 필요 |
| context match가 variant similarity처럼 보일 수 있음 | `carrier HPO vs context HPO`로 명시 |
| locus track이 placeholder처럼 보일 수 있음 | 실제 구현에서는 기존 track 유지 |
| reference signal이 diagnosis처럼 보일 수 있음 | `gene-level rare disease reference` wording 필요 |

---

## 10. 정적 preview와 실제 구현의 관계

### 10.1 Preview에서 실제 구현으로 옮길 수 있는 것

| Preview concept | 실제 적용 대상 |
|---|---|
| metric-band summary | sample/phenotype/variant header 아래 |
| evidence tier wording | front purpose card, phenotype candidate section, sample/variant evidence tables |
| no-calculation placeholder | PheRS/GRS/residual/annotation-burden fields |
| exact/gene scope labels | variant page |
| CRDC-first language | all result pages |
| table body regular weight | phenotype/sample/variant tables |

### 10.2 그대로 옮기면 안 되는 것

| Preview element | 이유 |
|---|---|
| static values | 실제 generated fixture와 연결 필요 |
| simplified age bar | 실제 data-driven chart 필요 |
| simplified locus track | 기존 `krVariant.html` track 유지 필요 |
| non-clickable tabs | 실제 Vue tab state와 연결 필요 |
| static context control | existing `ClinicalFocusBar`/focusStore와 연결 필요 |

### 10.3 구현 전 반드시 결정해야 할 것

| 결정 항목 | 선택지 |
|---|---|
| Preview를 바로 기본 페이지에 반영할지 | 아니면 `kr*_new.html` 후보 페이지를 먼저 만들지 |
| metric band 위치 | header 내부 / header 아래 / top answer box 대체 |
| reference tier label | `Core reference`, `Review reference`, `Secondary annotation` 등 |
| NA 표시 문구 | `Not calculated`, `Not calculated in this fixture`, `Planned backend calculation` |
| generated fixture 범위 | 대표 sample 하나 / 여러 sample lookup |

---

## 11. Reframe archive와의 관계

Reframe candidate는 삭제하지 않고 다음 위치에 archive로 보관했습니다.

```text
docs/archive/reframe_candidate_20260523/
```

포함된 것:

```text
dist_html/
src_views/
docs/
README.md
```

의미:

- reframe route/source/doc은 나중에 다시 볼 수 있습니다.
- 그러나 앞으로의 주 개발 방향은 reframe page 확장이 아니라 기본 포털 개선입니다.
- 정적 preview는 reframe archive에서 필요한 해석 구조만 꺼내 기본 포털형 visual로 다시 그린 중간 artifact입니다.

---

## 12. 평가 기준

정적 preview를 보고 판단해야 할 항목은 다음입니다.

### 12.1 전체

| 평가 질문 | 판단 기준 |
|---|---|
| 기본 포털의 장점이 유지되는가? | card/table/track 느낌이 살아 있어야 합니다. |
| reframe의 해석 방향이 보이는가? | CRDC-first, reference tier, secondary badge가 구분되어야 합니다. |
| 첫 화면이 너무 무거운가? | summary band가 도움이 되는지 방해되는지 봐야 합니다. |
| 계산 안 된 값이 오류처럼 보이는가? | `not calculated` 문구가 자연스러운지 확인합니다. |
| active context 의미가 명확한가? | HPO overlap/pattern이지 genotype similarity가 아니어야 합니다. |

### 12.2 Front

| 평가 질문 | 판단 기준 |
|---|---|
| 세 검색 mode가 하나의 workflow로 보이는가? | 별도 tool 3개처럼 보이면 실패입니다. |
| Reference tier가 직관적인가? | Orphanet/HPO, DECIPHER/MONDO/OMIM, secondary badge 순서가 읽혀야 합니다. |
| 설명이 과도한가? | front는 search entry이므로 너무 장황하면 줄여야 합니다. |

### 12.3 Sample

| 평가 질문 | 판단 기준 |
|---|---|
| sample header가 너무 복잡해졌는가? | metadata와 summary band가 한 화면에 부담 없이 들어와야 합니다. |
| Similar sample/group이 cohort position과 중복되지 않는가? | 하나의 metric으로 읽히면 좋습니다. |
| Reference profile이 diagnosis처럼 보이지 않는가? | profile reference wording이 유지되어야 합니다. |
| PheRS/GRS slot이 필요한가? | 미래 계산을 넣을 자리로 설득력이 있는지 봐야 합니다. |

### 12.4 Phenotype

| 평가 질문 | 판단 기준 |
|---|---|
| query profile과 CRDC cohort evidence가 분리되는가? | top은 query summary, lower는 evidence drill-down이어야 합니다. |
| candidate section이 union filter처럼 보이지 않는가? | profile match / reference tier / CRDC overlay가 구분되어야 합니다. |
| CRDC cohort evidence가 table-heavy하게만 보이는가? | co-observed/investigator tabs에서 해석 흐름이 필요합니다. |

### 12.5 Variant

| 평가 질문 | 판단 기준 |
|---|---|
| exact variant와 same gene carrier count가 분리되는가? | 첫 summary band에서 바로 보여야 합니다. |
| locus track이 계속 중심인가? | 실제 구현에서는 현재 track을 유지해야 합니다. |
| context match가 carrier HPO와 비교된다는 점이 보이는가? | `carrier HPO vs context HPO` 문구가 필요합니다. |
| no-context 상태가 자연스러운가? | score 대신 guide를 보여야 합니다. |

---

## 13. 다음 단계 제안

정적 preview를 검토한 뒤 권장 순서는 다음입니다.

1. Preview에서 유지할 summary band 항목을 확정합니다.
2. 바로 기본 페이지를 수정하지 않고, 필요하면 `kr*_new.html` 후보 페이지를 만듭니다.
3. 후보 페이지에서 layout 깨짐, text overflow, table density를 확인합니다.
4. 괜찮은 부분만 기본 `kr*.html`에 이식합니다.
5. 그 다음 RDS → generated fixture 연결을 강화합니다.

가장 먼저 실제 구현해볼 만한 최소 단위는 다음입니다.

| 우선순위 | 작업 |
|---|---|
| 1 | `krVariant.html` stale `chr15/UBE3A/18 carriers` 제거 |
| 2 | `krPhenotype.html` top query/count를 generated fixture와 동기화 |
| 3 | `krSample.html` top summary band를 현재 top answer box에 흡수 |
| 4 | `krFront.html` reference tier/context rule 문구 최소 반영 |

---

## 14. 결론

정적 preview는 현재 포털을 대체하는 새 구현이 아닙니다. 목적은 **기본 포털의 시각적 장점을 유지하면서 reframe의 해석 방향을 어디에 어떻게 얹을지**를 빠르게 확인하는 것입니다.

Preview가 제안하는 핵심 방향은 다음입니다.

1. CRDC internal evidence를 항상 먼저 보여줍니다.
2. Orphanet/HPO를 core reference로 두고, DECIPHER/MONDO/OMIM은 review/reference tier로 둡니다.
3. PanelApp/Reactome/WikiPathways 등은 secondary badge로만 둡니다.
4. PheRS/GRS 계산 슬롯은 유지하되 현재 fixture에서는 `not calculated`로 표시합니다.
5. sample/phenotype/variant page 모두 상단에 compact interpretation summary를 두되, 기존 기본 포털의 card/table/track 구조는 유지합니다.
6. active context는 HPO overlap과 phenotype pattern 비교로 읽혀야 하며, genotype similarity로 보이면 안 됩니다.

이 방향이 화면상으로 과하지 않다고 판단되면, 다음 단계는 정적 preview가 아니라 실제 후보 Vue page 또는 기본 페이지의 작은 patch로 넘어갈 수 있습니다.