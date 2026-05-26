# CRDC Rare Disease Portal 개선안 상세 보고서

작성 기준: 현재 로컬 작업 트리의 기본 포털, reframe 후보 문서, generated test DB fixture, 그리고 지금까지의 목업 수정 흐름

대상 기본 페이지:

- `krFront.html`
- `krSample.html`
- `krPhenotype.html`
- `krVariant.html`

참고하되 더 이상 주 작업 대상으로 삼지 않을 후보 페이지:

- `krFront_reframe.html`
- `krSample_reframe.html`
- `krPhenotype_reframe.html`
- `krVariant_reframe.html`

이 문서는 새 UI를 즉시 구현하는 문서가 아니라, 현재 기본 포털을 유지하면서 어떤 섹션을 삭제하고 어떤 섹션을 추가해야 하는지 정리한 개선안입니다. 핵심 판단은 다음입니다.

> 해석 방향과 정보 계층은 reframe이 더 맞습니다.  
> 그러나 실제 화면 구성, 카드 밀도, 표, 팝업, 트랙 시각화는 기본 포털이 더 낫습니다.  
> 따라서 reframe 페이지를 계속 키우기보다, 기본 포털의 시각 구조 위에 reframe의 해석 구조를 흡수하는 방식이 맞습니다.

---

## 1. 전체 결론

### 1.1 유지해야 할 것

기본 포털에서 유지할 가치가 큰 요소는 다음입니다.

| 영역 | 유지 이유 |
|---|---|
| `krFront.html`의 검색 진입 카드와 오른쪽 context card | 검색 시작점과 context 설정이 한 화면에 들어와 있어 직관적입니다. |
| `krSample.html`의 탭 기반 구조 | sample page가 가장 중요한 interpretation hub라는 방향과 잘 맞습니다. |
| `krSample.html`의 compact table, row-by-row evidence, 작은 popover | 너무 많은 정보를 한꺼번에 펼치지 않고 drill-down하기 좋습니다. |
| `krPhenotype.html`의 top query summary 시각 구조 | query terms, matched sample count, cohort summary, age distribution을 한 화면에서 볼 수 있습니다. |
| `krVariant.html`의 locus track, carrier phenotype profile, carrier sample table | variant/gene 검색에서 가장 중요한 carrier evidence를 시각적으로 잘 보여줍니다. |
| 기존 top-right context control | 모든 결과 페이지에서 context 상태를 같은 위치에서 확인할 수 있습니다. |

### 1.2 reframe에서 가져와야 할 것

reframe의 장점은 시각화보다 해석 순서입니다. 기본 포털에 흡수해야 할 내용은 다음입니다.

| reframe 방향 | 기본 포털에 적용할 방식 |
|---|---|
| 첫 화면에서 “무엇을 검색했고, 무엇을 봐야 하는지”를 요약 | 각 결과 페이지 상단에 compact interpretation summary band 추가 | 
| Primary CRDC evidence / Core rare disease reference / Secondary annotation 분리 | 기본 페이지의 탭과 표 안에서 source label과 섹션명을 명확히 분리 |
| active context는 HPO phenotype-based | variant/gene에서는 context를 variant 자체가 아니라 carrier HPO profile과 비교 |
| phenotype similarity, context match, genotype recurrence를 합치지 않음 | 별도 컬럼 또는 별도 badge로 분리 |
| PanelApp, Reactome, WikiPathways는 보조 annotation | 필터나 priority reducer로 쓰지 않고 작은 badge로만 표시 |<!--mondo, decipher 이런것도 추가했잖아. 그것도 고려해야지-->

### 1.3 더 이상 진행하지 말아야 할 것

| 항목 | 이유 |
|---|---|
| reframe page를 별도 주 버전으로 계속 확장 | 레이아웃과 정보 시각화가 기본 포털보다 약합니다. |
| 기존 기본 포털을 전면 재구축 | 이미 좋은 card/table/popover/track 시각 요소가 많습니다. |
| diagnosis certainty처럼 읽히는 표현 | 포털의 목적은 diagnosis 확정이 아니라 cohort/reference evidence review입니다. |
| PheRS/GRS가 실제 계산된 것처럼 보이게 하는 문구 | 현재 frontend fixture에는 runtime PheRS/GRS 계산이 없습니다. |<!--계산은 나중에 실제 구현되면 넣어야하잖아. 그러면 목업에도 있어야하는거 아닌가?-->
| hard-coded old demo values 유지 | test DB generated fixture와 화면 표시가 어긋나면 사용자가 DB 연결 여부를 판단할 수 없습니다. |

---

## 2. 포털의 목표 해석 구조

### 2.1 사용자가 포털에서 얻고자 하는 것

CRDC rare disease portal의 목표는 단순히 “검색 결과 목록”을 보여주는 것이 아닙니다. 연구자가 sample ID, phenotype profile, variant/gene 중 하나로 시작했을 때 다음 질문에 답할 수 있어야 합니다.

1. 이 검색 대상은 CRDC cohort 안에서 어디에 위치하는가?<!--이 질문하고 2번질문하고 같은거잖아 두번을 정리할필요는없어-->
2. 검색 대상과 비슷한 sample, phenotype-defined group, carrier group이 있는가?<!--혹은 개별샘플-->
3. CRDC 내부 recurrence와 phenotype overlap이 있는 gene/variant가 있는가?
4. Orphanet, HPO, OMIM 같은 rare disease reference가 같은 방향을 지지하는가?<!--decipher mondo도 같이 고민해야해 secondary에서도 이건 질병단위라 앱이나 pathway기반보다는 우선순위가 앞서 그러니까 1순위는 orphanet 일꺼고 hpo(hp.obo등의 hpo 에서 가져온것) 애초에 기본 검색 단위이니까 하이라키를 생각하면되고, omim보다는 decipher랑 mondo omim을 같은 레벨로 보는게 맞아 1.5순위정도. 그리고나서 panelapp reactome wiki와 나머지들은 secondary인거고-->
5. PanelApp, Reactome, WikiPathways 같은 secondary annotation은 보조적으로 무엇을 말하는가? <!--이건 가능성이지. 1순위에서 결과가 매칭되는게 없다면 1.5, 그리고 2순위-->
6. active HPO context가 있다면 검색 대상이 그 context와 얼마나 겹치는가? <!--1차는 겹치는거지만, 패턴을 보는것도 좋아.-->
7. 다음으로 사용자가 inspect해야 할 것은 sample, phenotype group, disease profile, gene, variant, carrier set 중 무엇인가? <!--이건네가 말하려는게 이해가 안되는데 일단은 생각하지못한 새로운 insight의 가능성을 찾는게 숨은 목적이야-->

### 2.2 Evidence hierarchy

개선 후 모든 페이지에서 evidence는 다음 순서로 읽혀야 합니다.

| 우선순위 | Evidence layer | 의미 | UI 표현 |
|---|---|---|---|
| 1 | Primary CRDC internal evidence | CRDC sample/HPO/variant recurrence, carrier phenotype overlap, matched cohort, investigator/group pattern | 가장 앞쪽 summary, 기본 table, main tab |
| 2 | Core rare disease reference | Orphanet, HPO, OMIM disease/gene/HPO profile | disease profile reference, external annotation column |
| 3 | Secondary annotation | PanelApp, Reactome, WikiPathways, MONDO/DDG2 등 보조 annotation | 작은 badge 또는 secondary column |

<!--Core는 앞에 말한것처럼 Orphanet이 될꺼고, 1.5순위는 Decipher, Mondo, Omim이 될꺼야, 2순위가 PanelApp, Reactome, WikiPathways가 되는게 맞다고 생각해-->

PanelApp/pathway membership이 없다는 이유로 CRDC recurrent candidate를 숨기거나 낮추면 안 됩니다. `uncurated_recurrent_candidate`는 reference가 부족하더라도 CRDC 내부 recurrence와 phenotype overlap이 있으면 discovery candidate로 보존해야 합니다. <!-- 모든 우선순위는 CRDC야. CRDC기반으로 최대한의 결과를 주고 DB바탕은 DB바탕 결과가 따로 있는거야. 내부에서 못찾으면 못찾았다고 명시하고 나서 후보를 보이는거야-->

### 2.3 Context interpretation rule

Active context는 HPO phenotype profile입니다. 따라서 다음처럼 해석해야 합니다.

| 페이지 | 올바른 비교 |
|---|---|
| Sample | active HPO context vs searched sample HPO profile |
| Phenotype | searched HPO profile vs active HPO context, 그리고 둘의 disease/gene reference overlap |
| Variant/Gene | active HPO context vs queried-variant carrier HPO profile 또는 gene carrier HPO profile |

하지 말아야 할 비교:

- active context vs variant itself
- phenotype similarity + genotype recurrence + context match를 하나의 vague score로 병합
- context active 자체를 genetic similarity처럼 표현

---

## 3. 현재 코드 기반 전체 구조

### 3.1 Multipage entry

기본 페이지와 reframe 페이지는 모두 `vue.config.js`의 multipage entry로 등록되어 있습니다.

```js
// vue.config.js
krFront: {
    entry: "src/views/KrFront/main.js",
    filename: "krFront.html",
},
krSample: {
    entry: "src/views/KrSample/main.js",
    filename: "krSample.html",
},
krPhenotype: {
    entry: "src/views/KrPhenotype/main.js",
    filename: "krPhenotype.html",
},
krVariant: {
    entry: "src/views/KrVariant/main_V3.js",
    filename: "krVariant.html",
},
```

reframe entry도 존재하지만 개선안의 주 작업 대상은 기본 entry입니다.

```js
// vue.config.js
krFrontReframe: {
    entry: "src/views/KrFrontReframe/main.js",
    filename: "krFront_reframe.html",
},
krSampleReframe: {
    entry: "src/views/KrSampleReframe/main.js",
    filename: "krSample_reframe.html",
},
krPhenotypeReframe: {
    entry: "src/views/KrPhenotypeReframe/main.js",
    filename: "krPhenotype_reframe.html",
},
krVariantReframe: {
    entry: "src/views/KrVariantReframe/main.js",
    filename: "krVariant_reframe.html",
},
```

### 3.2 데이터 흐름

현재 Vue 목업은 RDS를 직접 읽지 않습니다. RDS에서 JS fixture를 생성하고 `mockData.js`에서 override합니다.

```text
test RDS
  -> scripts/export_portal_test_fixtures.R
  -> portalSampleData.generated.js
  -> portalPhenotypeData.generated.js
  -> portalVariantData.generated.js
  -> 각 mockData.js의 applyPortal*Data()
  -> Template.vue render
```

현재 generated fixture:

| 파일 | 목적 |
|---|---|
| `src/views/KrSample/portalSampleData.generated.js` | test DB 기반 sample page state override |
| `src/views/KrPhenotype/portalPhenotypeData.generated.js` | test DB 기반 phenotype page state override |
| `src/views/KrVariant/portalVariantData.generated.js` | test DB 기반 variant page state override |

sample mockData override:

```js
// src/views/KrSample/mockData.js
import { applyPortalSampleData } from "./portalSampleData.generated";

export function createKrSampleState() {
    const state = {
        // 기존 static fixture
    };
    return applyPortalSampleData(state);
}
```

phenotype, variant도 같은 구조입니다.

```js
// src/views/KrPhenotype/mockData.js
import { applyPortalPhenotypeData } from "./portalPhenotypeData.generated";

// src/views/KrVariant/mockData.js
import { applyPortalVariantData } from "./portalVariantData.generated";
```

### 3.3 Context 저장소

Clinical context는 DB가 아니라 browser sessionStorage에 저장됩니다.

```js
// src/views/KrClinicalFocus/focusStore.js
const FOCUS_STORAGE_KEY = "krClinicalFocus.v1";
const FOCUS_EVENT = "kr-clinical-focus-change";

export function readClinicalFocus() {
    const raw = window.sessionStorage.getItem(FOCUS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function writeClinicalFocus(focus) {
    window.sessionStorage.setItem(
        FOCUS_STORAGE_KEY,
        JSON.stringify({
            ...focus,
            updatedAt: new Date().toISOString(),
        }),
    );
    window.dispatchEvent(new CustomEvent(FOCUS_EVENT, { detail: readClinicalFocus() }));
}
```

Context가 active인지 여부는 HPO term list가 있는지로 판단합니다.

```js
// src/views/KrClinicalFocus/focusComparison.js
export function hasClinicalFocus(focus) {
    return !!(focus && Array.isArray(focus.hpoTerms) && focus.hpoTerms.length);
}
```

---

## 4. 페이지 간 이동 로직

### 4.1 Front page에서 결과 페이지로 이동

`krFront.html`은 검색 mode에 따라 URL을 이동시킵니다.

```js
// src/views/KrFront/Template.vue
openResults() {
    const target = this.activeFixture;
    const value = this.searchValue.trim() || target.example;
    const encoded = encodeURIComponent(value);

    if (this.activeMode === "cohort") {
        window.location.assign(`/krSample.html?sample_id=${encoded}`);
        return;
    }

    if (this.activeMode === "phenotype") {
        window.location.assign(`/krPhenotype.html?query=${encoded}`);
        return;
    }

    window.location.assign(`/krVariant.html?query=${encoded}`);
}
```

현재 문제는 URL parameter가 화면 데이터 선택에 충분히 반영되지 않는다는 점입니다. 예를 들어 `krSample.html?sample_id=BCH-22-44945-01`가 들어와도 현재 generated fixture가 하나의 대표 sample state를 override하는 구조라서, 임의 sample lookup이 되지는 않습니다.

개선 방향:

| 단계 | 개선 |
|---|---|
| 단기 | front example을 generated fixture의 대표 sample/variant/phenotype query와 맞춥니다. |
| 중기 | `sample_id`, `query` parameter가 generated fixture 안의 여러 후보 중 하나를 선택하도록 만듭니다. |
| 장기 | backend API 또는 precomputed query cache로 연결합니다. |

### 4.2 Sample page에서 다른 페이지로 이동

현재 sample page의 clickable value는 다음 역할을 해야 합니다.

| 클릭 대상 | 이동 대상 |
|---|---|
| similar sample ID | `/krSample.html?sample_id=...` |
| shared phenotype count | phenotype-related view 또는 popover |
| shared gene / variant | `/krVariant.html?query=...` |
| disease profile overlap | popover 또는 disease/reference detail |

현재 구현은 placeholder link 또는 `href="#"` 스타일이 섞여 있으므로, 실제 링크처럼 보이는 값은 모두 이동 또는 popover 동작이 있어야 합니다. blue styling은 clickable/popover-triggering 값에만 남겨야 합니다.

### 4.3 Phenotype page에서 다른 페이지로 이동

현재 phenotype page는 matched sample table, candidate gene/variant table을 통해 sample/variant page로 이동해야 합니다.

개선해야 할 점:

- top query section의 132/904 hard-coded 값과 generated fixture의 20/350 값이 어긋납니다.
- `PheRS/profile match`는 실제 runtime PheRS 계산이 아니라 현재 fixture 기반 placeholder/summary임을 명확히 해야 합니다.
- disease/gene/variant candidate에서 external reference와 CRDC cohort overlay를 분리해야 합니다.

### 4.4 Variant page에서 다른 페이지로 이동

variant page의 carrier sample list는 sample page로 이동해야 합니다.

현재 주요 문제:

- generated fixture는 `chr2:231222761:AT:A`, `ARMC9`, carrier count 259/329를 제공합니다.
- 하지만 template 안 일부 static text는 여전히 `chr15`, `UBE3A`, `18 carriers`처럼 남아 있습니다.
- 따라서 DB fixture가 반영되지 않은 것처럼 보입니다.

이 문제는 portal 신뢰도에 직접 영향을 줍니다. variant page는 가장 먼저 stale static value 제거가 필요합니다.

---

## 5. 데이터베이스와 계산/필터 관계

### 5.1 Test DB table

현재 테스트 DB row count는 다음과 같이 알려져 있습니다.

| table | row count | 주요 용도 |
|---|---:|---|
| `sample` | 350 | sample metadata |
| `sample_hpo` | 14,578 | sample별 HPO term |
| `sample_page_summary` | 350 | sample page top summary |
| `sample_variant` | 5,059 | sample별 rare/damaging variant subset |
| `same_variant_recurrence` | 410 | 같은 variant recurrence |
| `same_gene_recurrence` | 305 | 같은 gene recurrence |
| `carrier_context_fit_summary` | 3,939 | carrier context/HPO overlap summary |
| `sample_gene_variant_evidence_summary` | 4,110 | sample gene/variant evidence summary |

candidate label 분포:

| candidate_label | count | 의미 |
|---|---:|---|
| `uncurated_recurrent_candidate` | 2,341 | external reference가 없어도 CRDC recurrence/phenotype overlap이 있는 discovery candidate |
| `external_and_crdc_supported` | 1,598 | reference와 CRDC 내부 evidence가 모두 있는 후보 |
| `singleton_or_low_support` | 103 | recurrence support가 낮은 후보 |
| `reference_supported_candidate` | 68 | external reference support 중심 후보 |

### 5.2 현재 frontend에서 실제 계산되는 것

현재 frontend에서 실제 계산되는 것은 제한적입니다.

| 항목 | 현재 상태 |
|---|---|
| HPO term count 표시 | generated fixture에서 제공한 값 표시 |
| sample disease profile overlap | export script에서 계산/정리된 summary 표시 |
| phenotype neighbors | export script에서 HPO overlap 기반으로 만든 top neighbors 표시 |
| same gene / same variant recurrence | generated fixture에서 summary 표시 |
| active context 저장/표시 | sessionStorage 기반 |
| PheRS runtime 계산 | frontend에는 없음 |
| GRS runtime 계산 | frontend에는 없음 |
| residual / annotation-burden correction | 현재 fixture에서 `not calculated`가 많음 |
| arbitrary query에 대한 실시간 search | 없음 |

### 5.3 표현형 검색/PheRS 관련 주의

`krPhenotype.html`은 현재 문구상 `weighted PheRS/profile matching`을 설명하지만, 실제 frontend에서 임의 query에 대해 PheRS를 계산하지 않습니다. generated fixture에는 다음과 같은 문구가 있습니다.

```js
// src/views/KrPhenotype/portalPhenotypeData.generated.js
"subtext": "2 test DB HPO query terms; runtime PheRS/GRS is not implemented in frontend"
```

따라서 화면에서는 다음을 구분해야 합니다.

| 표현 | 사용 가능 여부 |
|---|---|
| `weighted profile matching concept` | 가능 |
| `test DB HPO overlap search` | 가능 |
| `PheRS/profile match` | backend/precomputed 값이 있을 때만 명확히 표시 |
| `runtime PheRS calculated` | 현재는 표시하면 안 됨 |
| `GRS` | 현재는 표시하면 안 됨 |

---

## 6. 전체 개선 전략

### 6.1 목표

기본 포털의 visual system을 유지하면서 다음을 적용합니다.

1. reframe의 evidence hierarchy를 기본 페이지에 흡수합니다.
2. 현재 화면의 stale static value를 generated fixture와 일치시킵니다.
3. 섹션명을 data source와 해석 logic이 드러나게 바꿉니다.
4. 중복 summary와 diagnosis처럼 읽히는 표현을 제거합니다.
5. 각 페이지 첫 화면에 “무엇을 봐야 하는지”를 compact하게 넣습니다.
6. 모든 clickable/blue value는 실제 링크 또는 popover 동작을 갖게 합니다.

### 6.2 구현 순서 제안

| phase | 작업 | 이유 |
|---|---|---|
| 0 | stale value cleanup | DB fixture가 붙었는지 화면에서 확인 가능해야 합니다. |
| 1 | `krFront.html` entry point/context 정리 | 전체 workflow 시작점입니다. |
| 2 | `krSample.html` sample hub 정리 | sample page가 가장 중요한 해석 허브입니다. |
| 3 | `krPhenotype.html` generated value/PheRS 문구 정리 | 현재 hard-coded mismatch가 큽니다. |
| 4 | `krVariant.html` variant/gene scope 정리 | carrier evidence가 DB와 어긋나면 해석이 불가능합니다. |
| 5 | context-aware summary 연결 | active context가 있을 때만 context match를 표시합니다. |

---

## 7. `krFront.html` 개선안

### 7.1 페이지 목적

`krFront.html`은 검색 entry point와 context status management 페이지입니다. 사용자는 sample, variant/gene, phenotype profile 중 하나로 시작하지만, 세 mode는 서로 다른 tool이 아니라 같은 CRDC cohort exploration workflow의 시작점이어야 합니다.

### 7.2 현재 화면 구조

현재 주요 화면 구간:

| 위치 | 현재 표시 | 코드 위치 |
|---|---|---|
| main intro | `Clinical context-guided rare disease cohort search` | `src/views/KrFront/Template.vue` |
| search card | Search by ID / phenotype / variant-gene mode | `activeMode`, `modes` |
| right purpose card | `Our purpose` | template right column |
| context setup | `Clinical context (Background knowledge)` | `ClinicalFocusBar` |
| visual explanation | context/search/evidence 그림 | hero visual |

검색 mode:

```js
// src/views/KrFront/Template.vue
modes: [
    { key: "cohort", label: "Search by ID", shortLabel: "Sample ID" },
    { key: "phenotype", label: "Search by phenotype", shortLabel: "Phenotype" },
    { key: "variant", label: "Search by variant / gene", shortLabel: "Variant / gene" },
]
```

### 7.3 현재 문제

| 문제 | 영향 |
|---|---|
| sample/variant/phenotype example이 generated test DB 대표값과 어긋날 수 있음 | 실제 DB가 붙었는지 첫 화면에서 확인하기 어렵습니다. |
| 세 search mode가 “하나의 workflow entry”라는 메시지가 약함 | reframe의 장점인 통합 workflow 인식이 부족합니다. |
| active context summary는 있지만 “HPO context가 페이지 전체에서 어떻게 쓰이는지”가 더 명확해야 함 | context가 variant 자체와 비교된다는 오해가 생길 수 있습니다. |
| `Our purpose` 설명과 search intro가 일부 중복될 수 있음 | first screen이 다소 무거워질 수 있습니다. |

### 7.4 유지할 것

- 현재 좌측 search card와 우측 `Our purpose` card의 2-column visual은 유지합니다.
- `Clinical context (Background knowledge)`는 right card 안에 유지합니다.
- floating context panel 방식은 유지합니다.
- 별도 large context section은 만들지 않습니다.

### 7.5 삭제/축소할 것

| 삭제/축소 | 이유 |
|---|---|
| reframe page로 보내는 navigation | 기본 포털을 개선 대상으로 삼기 때문입니다. |
| search mode별 장황한 설명 | front는 entry point이므로 간결해야 합니다. |
| context를 genotype similarity처럼 읽히게 하는 문구 | context는 HPO phenotype-based입니다. |

### 7.6 추가할 것

| 추가 항목 | 위치 | 내용 |
|---|---|---|
| “세 entry point는 하나의 cohort exploration workflow” message | search card 또는 purpose card | sample, variant/gene, phenotype 검색이 같은 evidence layer로 연결됨을 표시 |
| test DB-backed example values | input placeholder/example | `BCH-22-44945-01`, `chr2:231222761:AT:A`, generated phenotype query |
| active context compact summary | right card | context source, selected HPO terms, Edit/Clear |
| context usage note | purpose card | “Variant/gene pages compare active context to carrier HPO profile, not to the variant itself.” |

### 7.7 데이터 source

Front page 자체는 generated DB fixture를 직접 import하지 않습니다. 그러나 example 값을 generated fixture와 맞추려면 다음 중 하나가 필요합니다.

| 방식 | 장점 | 단점 |
|---|---|---|
| static example을 generated 대표값으로 수동 갱신 | 가장 간단 | fixture 재생성 시 다시 어긋날 수 있음 |
| front 전용 generated summary import | 항상 동기화 가능 | 작은 추가 fixture 필요 |
| backend/search API | 장기적으로 맞음 | 현재 목업 범위 밖 |

단기 권장:

- `krFront.html`의 example만 현재 generated fixture와 맞춥니다.
- 검색 후 페이지는 기본 page URL로 이동합니다.

### 7.8 평가 체크리스트

| 화면 항목 | 평가 질문 | 조치 |
|---|---|---|
| `Clinical context-guided rare disease cohort search` | 제목이 너무 marketing-like하지 않은가? | 유지하되 subtitle을 cohort exploration 중심으로 조정 |
| Search by ID | sample search임이 명확한가? | `Search by sample ID`로 명확화 가능 |
| Search by phenotype | HPO profile 검색이라는 점이 보이는가? | placeholder에 HPO ID 포함 |
| Search by variant / gene | exact variant와 gene-level query가 구분되는가? | input hint에 둘 다 예시 |
| Our purpose | 너무 일반론인가? | CRDC internal evidence와 rare disease reference 연결 목적 강조 |
| Clinical context | active HPO context임이 보이는가? | “HPO phenotype context” 문구 추가 |
| Set context button | 열림/닫힘 상태가 명확한가? | 주황색 triangle 유지 |
| Active context summary | Confirm 후 별도 floating bubble 없이 right card에서만 상태를 보여주는가? | 현재 원칙 유지 |

---

## 8. `krSample.html` 개선안

### 8.1 페이지 목적

`krSample.html`은 포털의 핵심 hub입니다. 연구자가 sample ID를 넣었을 때 가장 먼저 궁금한 것은 다음입니다.

1. 이 sample의 phenotype/genotype 기본 profile은 무엇인가?
2. CRDC cohort 안에서 어떤 sample, group, disease profile, gene/variant와 가까운가?
3. GenDx 또는 reported candidate evidence가 있는가?
4. active context가 있다면 이 sample이 해당 HPO context와 얼마나 맞는가?
5. 다음으로 볼 evidence는 similar sample, disease profile, gene/variant 중 무엇인가?

### 8.2 현재 화면 구조

현재 sample page top 구조:

| 영역 | 현재 표시 |
|---|---|
| global toolbar | `CURRENT WORKFLOW Sample search`, context status, Edit Context, options |
| sample header | sample ID, sex/age/GenDx, HPO terms, rare coding genes |
| top answer compact box | Closest phenotype match, Group affinity, Disease profile reference |
| main tabs | Overview, Similar samples, Similar by genotype, Disease profile matches, Gene / variant evidence |

Tabs:

```js
// src/views/KrSample/Template.vue
mainTabs: [
    { id: "overview", label: "Overview" },
    { id: "phenotype", label: "Similar samples" },
    { id: "genotype", label: "Similar by genotype" },
    { id: "disease", label: "Disease profile matches" },
    { id: "genes", label: "Gene / variant evidence" },
]
```

### 8.3 현재 generated sample

현재 generated fixture는 대표 sample로 다음을 제공합니다.

| 항목 | 값 |
|---|---|
| sample ID | `BCH-22-44945-01` |
| sex | `male` |
| age group | `12-17` |
| investigator | `janet_chou` |
| HPO total | `107` |
| rare coding genes | `17` |
| top candidate | `ARMC9 chr2:231222761:AT:A` |
| GenDx short status | `Not loaded` |
| top disease profile reference | `Chronic mucocutaneous candidiasis` |

현재 화면에서 age가 비거나 Group affinity가 static처럼 보이는 경우는 generated fixture가 template의 특정 field와 완전히 맞지 않거나, 화면 일부가 아직 static mock value를 사용하기 때문입니다. 이 mismatch는 가장 먼저 확인해야 합니다.

### 8.4 현재 좋은 점

| 요소 | 유지 이유 |
|---|---|
| sample header compact metadata | sample ID 아래에 핵심 metadata가 들어와 있어 좋습니다. |
| top answer compact summary | 사용자가 첫 화면에서 가장 중요한 방향을 파악할 수 있습니다. |
| right Sample overview card 내부 tabs | 긴 phenotype profile을 기본 overview와 분리한 점이 좋습니다. |
| GenDx panel row table | 카드 3개보다 table이 sample overview 흐름에 맞습니다. |
| Similar samples table | phenotype-matched sample을 evidence table로 보여주는 방향이 맞습니다. |
| popover for shared HPO terms | 긴 HPO list를 숨기고 필요한 때만 보여줍니다. |

### 8.5 현재 문제

| 문제 | 영향 |
|---|---|
| top answer의 `Group affinity`가 investigator overlap인지 phenotype-signature affinity인지 직관적이지 않음 | 사용자에게 group membership처럼 보일 수 있습니다. |
| `GenDx: Not loaded`와 candidate gene/variant가 동시에 보일 때 의미가 불명확 | GenDx diagnosis status와 rare variant evidence가 섞여 보입니다. |
| overview의 `Who is closest...`와 Similar samples tab이 일부 중복 | 같은 질문이 두 곳에서 반복됩니다. |
| Disease profile reference와 Disease profile matches tab이 같은 정보를 다른 강도로 보여줄 수 있음 | diagnosis처럼 읽힐 위험이 있습니다. |
| active context가 있을 때 sample-context match가 top에서 충분히 요약되지 않음 | context-driven interpretation이 약합니다. |
| generated fixture의 HPO domain grouping이 root category가 아니라 개별 HPO term처럼 보일 수 있음 | phenotype profile composition 해석이 어렵습니다. |

### 8.6 유지할 섹션

| 섹션 | 유지 방식 |
|---|---|
| Global toolbar/context | 현재 inline control 유지 |
| Sample header | 유지, 단 generated data와 완전 동기화 |
| Top answer compact summary | 유지하되 label 정리 |
| Overview tab | sample 자체 + compact cohort position 중심으로 유지 |
| Similar samples tab | phenotype-similar samples table 유지 |
| Similar by genotype tab | gene-level recurrence 중심으로 유지 |
| Disease profile matches tab | public disease profile reference로 유지 |
| Gene / variant evidence tab | gene-level checklist 유지 |

### 8.7 삭제/축소할 항목

| 항목 | 조치 | 이유 |
|---|---|---|
| `Disease hypothesis` 계열 문구 | `Disease profile reference`로 교체 | 확정 진단처럼 보이면 안 됩니다. |
| `moderate-high`, `strong`, `likely causal` 계열 표현 | 제거 | evidence strength 과장입니다. |
| Overview 안의 긴 score explanation 본문 | info popover로 유지 | 본문이 무거워집니다. |
| 중복 closest sample 강조 | Similar samples tab으로 이동/통합 | sample 하나가 main result처럼 보이면 안 됩니다. |
| GenDx를 action button처럼 보이게 하는 표현 | plain information으로 유지 | GenDx는 reported info입니다. |

### 8.8 추가할 항목

| 추가 | 위치 | 목적 |
|---|---|---|
| Sample interpretation summary band | sample header 바로 아래 또는 top answer box 확장 | reframe의 “첫 화면 요약”을 기본 UI에 흡수 |
| `Data source / scope` micro label | top summary 또는 footer | test DB/generated fixture임을 필요 시 확인 |
| active context match summary | context active일 때만 top summary | sample-context HPO overlap |
| `CRDC internal evidence`, `Rare disease reference`, `Secondary annotation` source labels | Gene/variant evidence tab | evidence source 구분 |
| `Similarity to searched sample` vs `Match to active context` 별도 컬럼 | Similar samples/context active 상태 | 두 score를 혼동하지 않기 위해 |

### 8.9 추천 top summary band

기본 포털의 card style을 유지하면서 다음 항목을 한 줄 또는 2-row compact layout으로 넣습니다.

| 항목 | 예시 |
|---|---|
| Phenotype burden | `107 HPO terms` |
| GenDx status | `GenDx: Not loaded` 또는 `Undiagnosed` |
| Top disease profile reference | `Chronic mucocutaneous candidiasis · 11 / 18 HPO terms` |
| Top similar phenotype neighbor/group | `BCH-19-86295-01 · 69% shared HPO overlap` |
| Top recurrent gene/variant evidence | `ARMC9 chr2:231222761:AT:A` |
| Context match, active only | `Context overlap: 5 / 12 context HPO terms` |

이 band는 새로운 큰 card가 아니라 현재 top answer compact box를 확장하는 방식이 좋습니다.

### 8.10 DB source mapping

| 화면 항목 | DB/generated source | 계산/필터 |
|---|---|---|
| sample ID/sex/age/proband/affected | `sample`, `sample_page_summary` -> `portalSampleData.generated.js.sample` | selected sample |
| HPO count | `sample_hpo` | sample별 unique HPO count |
| rare coding genes | `sample_variant` | sample별 gene_symbol unique count |
| disease profile reference | `sample_disease_profile_match_summary` | disease_match_rank 기준 top |
| phenotype neighbors | `sample_hpo` self-join in export script | shared HPO count / query HPO count |
| same gene recurrence | `same_gene_recurrence` 또는 `sample_gene_variant_evidence_summary` | candidate_label, gene carrier count |
| same variant recurrence | `same_variant_recurrence` | variant carrier count |
| carrier phenotype overlap | `carrier_context_fit_summary` | shared HPO count |
| GenDx | 현재 test DB export에서는 제한적 | available field가 없으면 `Not loaded` 표시 |

### 8.11 계산/필터 옵션

현재 UI에 있어야 하는 선택/필터:

| 옵션 | 적용 위치 | 의미 |
|---|---|---|
| active context on/off | global context | context match summary 표시 여부 |
| sample overview internal tab | Sample overview card | basic overview vs phenotype profile |
| Similar samples shared HPO popover | Similar samples table | numerator HPO terms drill-down |
| Similar genotype overlap count | Similar by genotype table | qualitative label 대신 count |
| Disease profile overlap popover | Disease profile matches | matched HPO terms |
| Gene phenotype fit popover | Gene/variant evidence | matched disease/sample HPO terms |

### 8.12 세부 평가 체크리스트

#### Global toolbar

| 화면 텍스트/구간 | 평가 질문 | 권장 조치 |
|---|---|---|
| `CURRENT WORKFLOW` | workflow label보다 value가 눈에 띄는가? | value `Sample search`를 충분히 크게 유지 |
| `Context active` / `No context` | 작고 보조적인 상태 표시인가? | 결과 카드보다 튀지 않게 유지 |
| info icon | context 상태의 의미를 설명하는가? | no-context/active-context tooltip 유지 |
| `Edit Context` | blue로 clickable임이 명확한가? | `#0055FF` 유지 |
| options menu | layout을 방해하지 않는가? | inline separator 유지 |

#### Sample header

| 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| sample ID | 현재 URL/sample fixture와 일치하는가? | `BCH-22-44945-01`이면 정확히 표시 |
| sex | DB value가 `male`이면 화면도 male인가? | capitalization만 일관화 |
| age group | `12-17` 또는 `12-18` 혼용이 없는가? | DB age band와 UI label 통일 |
| GenDx | `Not loaded`, `Undiagnosed`, `Diagnosed`가 구분되는가? | GenDx status legend 필요 |
| HPO terms | total HPO term count가 실제 sample_hpo count와 맞는가? | generated fixture와 검증 |
| rare coding variants gene count | sample_variant unique genes와 맞는가? | count 검증 |

#### Top answer compact box

| 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| Closest phenotype match | sample ID와 similarity basis가 명확한가? | `shared HPO overlap` 문구 추가 |
| Group affinity | investigator group인지 phenotype-defined group인지 명확한가? | `Investigator phenotype-signature affinity`로 변경 고려 |
| Disease profile reference | diagnosis처럼 보이지 않는가? | `reference match for review` 설명 유지 |
| Top recurrent gene/variant | 현재 없음 | 추가 필요 |
| Context match | active context 때만 보이는가? | 조건부 표시 |

#### Overview tab

| 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| 질문 제목 | Similar samples tab과 중복되지 않는가? | sample 자체와 cohort position 중심으로 조정 |
| score basis info | 본문에 길게 노출되지 않는가? | info popover 유지 |
| Sample overview table | proband, affected, sex, age, investigator, HPO count가 정확한가? | DB mapping 점검 |
| Context comparison | no context일 때 빈 값처럼 보이지 않는가? | no-context guide 표시 |
| GenDx panel | diagnosis처럼 보이지 않는가? | reported candidate evidence로 표현 |
| Phenotype profile internal tab | HPO root category가 진짜 root category인가? | generated grouping 개선 필요 |

#### Similar samples tab

| 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| tab label | phenotype profile이 비슷한 sample을 의미하는가? | `Similar samples` 유지 |
| Sample column | clickable이면 blue인가? | link 구현 확인 |
| Similarity rank | blue가 아닌가? | 일반 텍스트 유지 |
| Shared phenotype counts | popover로 numerator term 표시되는가? | HPO term + ID 표시 |
| Shared genes | gene name만 표시되는가? | consequence 제거 유지 |
| Investigator/Sex/Age band | matched sample metadata인가? | DB value 검증 |
| Note | diagnosis/hypothesis를 암시하지 않는가? | 짧고 neutral하게 유지 |

#### Similar by genotype tab

| 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| 제목 | gene-level evidence 중심인가? | `Who shares a relevant gene/variant signal?` 고려 |
| Reference variant | searched sample 기준 variant가 명확한가? | 실제 variant ID 포함 |
| Genetic similarity | qualitative overclaim이 없는가? | same gene / same variant / carrier overlap으로 분리 |
| Phenotype overlap | `High` 같은 라벨이 없는가? | `12 / 47 shared HPO terms`처럼 count 표시 |
| Variant evidence | query sample vs matched sample의 consequence가 구분되는가? | 두 샘플 값을 분리 |

#### Disease profile matches tab

| 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| title | `hypothesis`보다 `profile match`인가? | 유지 |
| Disease profile | diagnosis처럼 보이지 않는가? | source와 profile wording 유지 |
| Matched HPO terms | popover로 term+ID 표시되는가? | 확인 |
| Notes | certainty label이 없는가? | phenotype domain overlap만 설명 |

#### Gene / variant evidence tab

| 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| 설명문 | gene-level checklist 방향인가? | 유지 |
| Gene value | clickable이면 blue인가? | link 확인 |
| Best variant | 실제 variant ID가 포함되는가? | plain text, table variant만 blue |
| Disease link | reference provenance가 있는가? | Orphanet/HPO/OMIM source 표시 |
| Phenotype fit | popover term list가 complete한가? | numerator term 전체 표시 |
| Internal support | count 기반인가? | `same-gene carriers`, `phenotype-similar` |
| GenDx | `GenDx` casing 정확한가? | `GenDx` 고정 |
| Priority reason | 과장 표현 없는가? | concise evidence combination |

---

## 9. `krPhenotype.html` 개선안

### 9.1 페이지 목적

`krPhenotype.html`은 사용자가 입력한 phenotype profile로 CRDC sample, phenotype group, disease profile, gene/variant 후보를 찾는 페이지입니다.

핵심 질문:

1. 입력 HPO profile은 CRDC cohort 안에서 몇 개 sample과 겹치는가?
2. matched sample set 안에서 반복되는 추가 phenotype은 무엇인가?
3. external disease/gene reference는 어떤 candidate를 제시하는가?
4. CRDC cohort 안에서 그 candidate gene/variant가 실제로 관찰되는가?
5. active context가 있다면 query HPO와 context HPO가 어떻게 겹치는가?

### 9.2 현재 화면 구조

현재 화면은 크게 세 구간입니다.

| 구간 | 현재 역할 |
|---|---|
| Query phenotype profile top section | query terms, phenotype-similar sample count, cohort summary, age distribution |
| Phenotype-derived candidates | external disease/gene candidates + CRDC cohort variant overlay |
| CRDC cohort evidence | matched samples, co-observed phenotypes, investigator evidence |

### 9.3 현재 generated phenotype mismatch

generated fixture는 다음 값을 제공합니다.

| 항목 | generated value |
|---|---|
| query | `Abnormal circulating purine concentration [HP:0004352] + Abnormal oral morphology [HP:0031816]` |
| matched samples | `20 / 350` |
| runtime PheRS/GRS | not implemented in frontend |

그러나 현재 template top section에는 여전히 다음 static 값이 보일 수 있습니다.

| 화면 static | 문제 |
|---|---|
| `Cleft palate [HP:0000175]` | generated query와 불일치 |
| `Developmental delay [HP:0001263]` | generated query와 불일치 |
| `132 / 904` | generated DB 350 samples와 불일치 |
| age distribution among 132 samples | generated topSamples 20과 불일치 |

이 mismatch는 phenotype page의 최우선 수정 대상입니다.

### 9.4 유지할 것

| 요소 | 이유 |
|---|---|
| top query profile card | visual density와 summary 구조가 좋습니다. |
| right-side borderless summary layout | card fragmentation을 줄인 결과가 좋습니다. |
| `Phenotype-derived candidates` tab 구조 | external candidate와 CRDC overlay를 분리하기 좋습니다. |
| `CRDC cohort evidence` tab 구조 | matched sample, co-observed phenotype, investigator evidence를 나눌 수 있습니다. |
| popover info | 긴 설명을 숨기기 좋습니다. |

### 9.5 삭제/축소할 항목

| 항목 | 조치 | 이유 |
|---|---|---|
| hard-coded Cleft palate/Developmental delay | generated query로 대체 | DB 확인이 안 됩니다. |
| hard-coded 132/904 cohort summary | generated count로 대체 | 현재 test DB는 350 samples입니다. |
| `PheRS/profile match` overclaim | 실제 계산 여부 명시 | frontend runtime 계산 없음 |
| co-observed phenotype을 disease candidate section에 넣기 | CRDC cohort evidence로 유지 | co-observed는 matched sample set에서 온 정보입니다. |
| `Query support 2 / 2`를 main decision rule처럼 보이게 하는 구조 | supporting detail로 낮춤 | PheRS/profile matching 개념과 다릅니다. |

### 9.6 추가할 항목

| 추가 | 위치 | 목적 |
|---|---|---|
| generated query terms 렌더링 | top left query profile | 실제 test DB query 확인 |
| generated matched sample count | top cohort summary | `20 / 350` 등 실제 값 표시 |
| `runtime PheRS/GRS not implemented` small note | candidate section 또는 info popover | 오해 방지 |
| active context HPO terms 별도 block | top query section, context active일 때만 | searched query와 context를 섞지 않음 |
| candidate provenance tags | Disease/Gene candidates table | external annotation vs CRDC overlay 구분 |

### 9.7 Phenotype-derived candidates 목표 구조

현재 section title은 이미 개선되어 있습니다.

```text
Phenotype-derived candidates
Which diseases, genes, and cohort variants are supported by the input phenotype profile?
```

이 구간의 최종 logic은 다음이어야 합니다.

```text
Input HPO profile
  -> weighted profile/PheRS concept or precomputed profile score
  -> ranked disease and gene candidates from external reference
  -> CRDC cohort variants observed in those candidate genes
```

단, 현재 frontend에서 runtime PheRS는 계산하지 않으므로 실제 UI에서는 다음처럼 표현해야 합니다.

| UI 표현 | 권장 |
|---|---|
| `PheRS/profile match` | 값이 precomputed/generated이면 표시 가능 |
| `not calculated in frontend fixture` | 값이 없으면 그대로 표시 |
| `Query support` | 작은 supporting detail |
| `External annotation` | Orphanet/HPO/OMIM provenance |
| `CRDC cohort evidence` | phenotype-matched samples에서 candidate gene/variant 관찰 |
| `Why matched` | query HPO profile과 reference profile overlap 설명 |

### 9.8 CRDC cohort evidence 목표 구조

현재 section:

```text
CRDC cohort evidence
How does this phenotype profile appear across CRDC samples, phenotypes, variants, and investigator groups?
These results are generated by applying the input phenotype profile to the CRDC cohort.
```

이 구조는 방향이 좋습니다. 다만 top query section과 중복되는 overview tab은 만들지 않는 것이 맞습니다. 최종 tabs는 다음이 적절합니다.

| tab | 역할 |
|---|---|
| Matched samples | ranked matched sample table + selected sample detail + selected sample phenotype profile + annotation-burden check trigger |
| Co-observed phenotypes | phenotype-matched sample set 안에서 반복되는 추가 HPO terms |
| Investigator-level evidence | investigator/group-level pattern |

Annotation-burden check는 독립 tab보다 matched samples 안의 secondary trigger 또는 subpanel이 현재 사용자의 최근 방향과 맞습니다.

### 9.9 DB source mapping

| 화면 항목 | DB/generated source | 계산/필터 |
|---|---|---|
| query HPO terms | `portalPhenotypeData.generated.js.phenotype.queryTerms.exact` | selected test DB query |
| matched sample count | generated headline / topSamples | HPO overlap summary |
| matched sample table | `phenotype.topSamples` | query terms matched, raw score |
| disease candidates | generated disease candidate rows 또는 static fallback | external reference profile |
| gene candidates | generated gene rows 또는 static fallback | external disease/gene annotation + cohort carrier evidence |
| cohort variant overlay | generated variant rows | candidate gene 안의 cohort variants |
| co-observed phenotypes | generated coObserved/root category summary | phenotype-matched sample set |
| investigator evidence | generated investigator rows 또는 static fallback | group-level phenotype signature overlap |

### 9.10 계산/필터 옵션

| 옵션 | 현재/필요 |
|---|---|
| query terms exact vs semantic related | top query disclosure로 표시 |
| matched sample row select | selected sample detail 업데이트 |
| HPO root category expand | full term-level detail line-by-line |
| candidate tab switch | Disease candidates / Gene candidates / Cohort variant overlay |
| CRDC evidence tab switch | Matched samples / Co-observed phenotypes / Investigator-level evidence |
| annotation-burden check | matched samples 안 secondary trigger |
| active context | searched query HPO와 context HPO를 분리 표시 |

### 9.11 세부 평가 체크리스트

#### Top query section

| 화면 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| `Query phenotype profile` | main page title과 경쟁하지 않는가? | 22-24px 유지 |
| query HPO terms | generated fixture와 일치하는가? | static Cleft palate 제거 |
| phenotype-similar samples count | `20 / 350` 등 실제 generated count인가? | hard-coded 132/904 제거 |
| info icon | popover가 화면 밖으로 나가지 않는가? | viewport-aware placement |
| semantically similar phenotypes | expanded 시 term+ID가 line-by-line인가? | 유지/검증 |
| cohort summary | denominator가 명확한가? | generated denominator 사용 |
| age distribution | generated data 기반인가? | 없으면 placeholder가 아니라 “not available” |
| annotation-burden check | `n_terms` 같은 내부 용어가 없는가? | `total HPO-term correction` 사용 |
| candidate gene evidence | source label이 box처럼 보이지 않는가? | plain text `External | CRDC` |

#### Phenotype-derived candidates

| 화면 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| section title | input-derived candidate임이 명확한가? | `Phenotype-derived candidates` 유지 |
| subtitle | diseases/genes/cohort variants의 관계가 보이는가? | 유지 |
| pipeline copy | union filter처럼 보이지 않는가? | weighted profile wording 유지 |
| Disease candidates tab | disease HPO profile size가 보이는가? | `Disease profile HPO terms` column 추가 |
| Query support | main rule처럼 보이지 않는가? | supporting detail로 낮춤 |
| External annotation | provenance가 source로 보이는가? | Orphanet/HPO/OMIM 표시 |
| Cohort variant overlay | Link column이 없는가? | variant cell 자체를 clickable |
| table typography | header만 bold인가? | body values regular |

#### CRDC cohort evidence

| 화면 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| section title | CRDC-based evidence임이 명확한가? | 유지 |
| note | top summary와 중복되지 않는가? | 짧게 유지 |
| tabs visual | Phenotype-derived candidates tab style과 통일되는가? | 동일 card-tab style 적용 |
| Matched samples table | `RankSample`처럼 header가 붙어 보이지 않는가? | column gap/width 조정 |
| Investigator column | proband와 investigator가 섞이지 않는가? | investigator만 표시 |
| Query terms matched | 2 original terms 기준인가? | `2 / 2 query terms` |
| selected sample detail | Proband/Affected/Sex/Age가 별도 row인가? | 유지/확인 |
| selected phenotype profile | query term 존재 여부와 HPO term+ID가 정확한가? | expanded row line-by-line |
| Co-observed phenotypes | selected sample이 아니라 matched set 요약인가? | tab 분리 유지 |
| Investigator evidence | counts가 outlier가 아니라 matched samples인가? | wording 검증 |
| Annotation-burden check | secondary로 보이는가? | large always-visible plot 지양 |

---

## 10. `krVariant.html` 개선안

### 10.1 페이지 목적

`krVariant.html`은 queried variant 또는 gene에 대해 carrier set, carrier phenotype profile, recurrence, disease/reference annotation, cohort group pattern을 해석하는 페이지입니다.

핵심 질문:

1. 정확히 어떤 variant/gene을 검색했는가?
2. exact queried variant carrier와 same gene carrier는 각각 몇 명인가?
3. carrier들이 어떤 phenotype profile을 공유하는가?
4. carrier들이 특정 investigator/group/phenotype-defined group에 몰리는가?
5. Orphanet/HPO/OMIM reference와 연결되는가?
6. active context가 있다면 carrier HPO profile이 active HPO context와 겹치는가?

### 10.2 현재 화면 구조

현재 variant page 주요 구간:

| 구간 | 현재 표시 |
|---|---|
| top toolbar | workflow/context/options |
| variant header | queried variant, gene, build, carrier count, pathogenicity, demographic summary |
| queried variant window | locus track, disease/gene track, exon/codon/base track, per-position carrier count |
| queried variant evidence | ClinVar, gnomAD AF, REVEL, AlphaMissense, LoFTEE |
| gene/locus context | nearest gene, gene carriers, P/LP variants |
| disease signals | disease/gene-level reference signals |
| carrier phenotype profile | carrier sample table, carrier HPO profile, context position, phenotype summary |

### 10.3 현재 generated variant와 화면 mismatch

generated fixture:

| 항목 | generated value |
|---|---|
| query | `chr2:231222761:AT:A` |
| gene/window | `ARMC9 Variant` |
| build | `test DB` |
| exact queried variant carriers | `259 samples` |
| gene carriers | `329 samples` |
| pathogenicity | `rare/damaging test subset` |

현재 template에 남아 있는 stale static:

| stale text | 문제 |
|---|---|
| `chr15:22,000,220 G>C` | generated query와 불일치 |
| `UBE3A` | generated gene `ARMC9`와 불일치 |
| `18 queried-variant carriers` | generated exact variant carriers 259와 불일치 |
| `15q11.3` | generated variant chr2와 불일치 |
| `Angelman syndrome` | generated ARMC9 reference와 불일치 가능 |

variant page의 첫 번째 개선은 레이아웃이 아니라 stale static 제거입니다.

### 10.4 유지할 것

| 요소 | 이유 |
|---|---|
| locus track | variant page에서 가장 중요한 시각 요소입니다. |
| disease/gene track checkbox | track toggle interaction이 유용합니다. |
| exon/codon/base track | variant genomic context를 설명합니다. |
| per-position carrier count | local recurrence 확인에 필요합니다. |
| carrier phenotype profile block | carrier set interpretation의 핵심입니다. |
| carrier sample checkbox + phenotype checkbox context workflow | context source selection이 명확해졌습니다. |
| demographic summary in header | carrier set overview에 유용합니다. |

### 10.5 삭제/축소할 항목

| 항목 | 조치 | 이유 |
|---|---|---|
| stale UBE3A/chr15/18 carrier text | generated fixture로 교체 | DB 연결 확인이 불가능합니다. |
| active context가 없는데 context score처럼 보이는 panel | no-context guide로 대체 | false interpretation 방지 |
| Disease/Gene track check 정보가 per-position 위에 쌓이는 방식 | 현재는 유지 또는 명확한 위치로 고정 | 사용자가 혼동한 지점입니다. |
| `diagnosis`처럼 보이는 disease signal | `disease reference` 또는 `gene-level reference`로 표현 | certainty 방지 |

### 10.6 추가할 항목

| 추가 | 위치 | 목적 |
|---|---|---|
| exact variant / same gene / nearby region scope labels | header, evidence table, carrier blocks | 숫자의 denominator 명확화 |
| top interpretation summary band | variant header 아래 | reframe의 핵심 요약을 기본 visual에 흡수 |
| active context carrier-HPO overlap | context active일 때 carrier phenotype profile | context-vs-carrier HPO 비교 |
| no-context guide | Context position in CRDC card | context 없을 때 score처럼 보이지 않게 |
| carrier group pattern compact section | carrier phenotype block 하단 또는 tab | carriers가 phenotype/investigator group을 이루는지 확인 |

### 10.7 추천 top summary band

variant/gene header 아래 compact band:

| 항목 | 예시 |
|---|---|
| Query scope | `Exact queried variant: chr2:231222761:AT:A` |
| Gene | `ARMC9` |
| Pathogenicity/severity | `rare/damaging test subset` |
| Exact variant carriers | `259 samples` |
| Same gene carriers | `329 samples` |
| Affected/proband/diagnosed counts | `affected/proband/diagnosed carrier counts` |
| Top carrier phenotype categories | generated carrier HPO categories |
| Top disease references | `Orpha 79320`, `Orpha 391665` |
| Cohort concentration | top investigator/group if available |
| Context match, active only | `carrier HPO vs active context: 11 / 18 HPO terms` |

### 10.8 Carrier context workflow

현재 개선된 workflow:

1. Phenotype Summary panel에서 root category 또는 term checkbox 선택
2. 또는 carrier sample list에서 sample checkbox 선택
3. mixed type selection은 막음
4. 선택하면 Edit context panel 자동 오픈
5. Edit context panel에서 selected item 제거/추가/clear 가능
6. Confirm context 후 sessionStorage에 context 적용

현재 관련 코드:

```js
// src/views/KrVariant/Template_V3.vue
confirmCarrierContextDraft() {
    const items = this.carrierContextDraftItems;
    const sourceLabel = this.carrierContextDraftType === "samples"
        ? `${items.length} selected ${this.carrierReference.levelLabel} sample${items.length === 1 ? "" : "s"}`
        : `${items.length} selected carrier phenotype item${items.length === 1 ? "" : "s"}`;

    writeClinicalFocus({
        source: "carrierProfile",
        label: sourceLabel,
        hpoTerms: this.carrierContextDraftType === "phenotypes" ? items : this.contextHpoTerms,
        notes: "Mock context created from the carrier phenotype profile workflow.",
    });
}
```

개선해야 할 점:

- 선택 즉시 왼쪽 카드에 status text가 커지게 보이는 것은 혼동을 만듭니다.
- Edit context panel 안에서만 selected phenotype/sample을 명확히 보여주는 것이 더 낫습니다.
- 왼쪽 status text는 작게 또는 숨기고, 선택 유형만 inline으로 표시합니다.

### 10.9 DB source mapping

| 화면 항목 | DB/generated source | 계산/필터 |
|---|---|---|
| queried variant | `portalVariantData.generated.js.variant.query.label` | selected generated variant |
| gene | `variant.query.window` 또는 `geneContext` | variant annotation |
| exact carrier count | `variant.variantEvidence`, `summaryScopes.variant.all` | exact queried variant |
| same gene carrier count | `summaryScopes.gene.all` | same gene |
| carrier samples | `variant.carrierSamples` | variant or gene level toggle |
| carrier phenotype categories | generated carrier phenotype summary | carrier HPO aggregation |
| disease signals | `variant.diseaseSignals` | gene-level reference |
| variant evidence | `variant.variantEvidence` | ClinVar/gnomAD/LoFTEE etc |
| demographic summary | `summaryScopes` | sex/proband count |
| context position | `carrier_context_fit_summary` if exported | active HPO context overlap |

### 10.10 계산/필터 옵션

| 옵션 | 의미 |
|---|---|
| Variant level / Gene level toggle | exact queried variant carriers vs same gene carriers |
| Disease track checkbox | disease reference annotations 표시 |
| Gene track checkbox | gene track 표시 |
| density filters: all/affected/proband | per-position carrier count subset |
| investigator select | carrier phenotype summary/investigator context filtering |
| age select | density/carrier filtering |
| carrier sample checkbox | selected samples as context source |
| phenotype term checkbox | selected HPO terms/categories as context source |

### 10.11 세부 평가 체크리스트

#### Header

| 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| queried variant label | generated query와 일치하는가? | static chr15 제거 |
| gene symbol | ARMC9 등 실제 gene과 일치하는가? | UBE3A static 제거 |
| cytoband | generated variant 위치와 맞는가? | 없으면 숨김 |
| pathogenicity badge | certainty 과장 없는가? | `rare/damaging test subset` 등 neutral |
| carrier count subline | exact variant/gene scope가 명확한가? | `exact queried variant carriers`로 표기 |
| Demographic Summary | denominator가 exact variant인지 gene인지 보이는가? | toggle 상태와 동기화 |

#### Queried variant window

| 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| coordinate window | generated variant 주변 좌표인가? | hard-coded chr15 제거 |
| disease track | disease reference annotation인지 명확한가? | diagnosis처럼 표시 금지 |
| gene track | queried gene과 맞는가? | generated gene 사용 |
| base marker | actual variant position인가? | generated position 사용 |
| per-position carrier count | exact/nearby carrier count 구분이 되는가? | scope label 추가 |
| density filters | 결과에 영향을 주는지 보이는가? | selected 상태 명확화 |

#### Evidence cards

| 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| Queried variant evidence | exact variant evidence인가? | table label 명확화 |
| Gene/locus context | same gene evidence인가? | exact vs gene 분리 |
| Disease signals | gene-level reference인지 variant-level인지 명확한가? | source label 추가 |

#### Carrier phenotype profile

| 항목 | 평가 질문 | 권장 조치 |
|---|---|---|
| Variant/Gene level toggle | carrier table과 phenotype summary가 같이 바뀌는가? | 동기화 확인 |
| Set as context | selection 없으면 disabled인가? | 유지 |
| Edit context panel | selected items, remove, clear, confirm이 보이는가? | 유지 |
| carrier sample table | checkbox와 sample link가 구분되는가? | blue only for sample link |
| HPO root category table | category vs term 구분이 되는가? | root category grouping 개선 |
| Phenotype Summary | root category와 term 모두 선택 가능한가? | 현재 개선 방향 유지 |
| Context position in CRDC | no context일 때 guide인가? | score처럼 보이면 안 됨 |

---

## 11. reframe 페이지 평가와 활용 방침

### 11.1 reframe에서 맞았던 점

| 항목 | 유지할 개념 |
|---|---|
| evidence hierarchy | Primary CRDC / Core reference / Secondary annotation |
| top interpretation summary | 첫 화면에서 해석 방향 제시 |
| context rule | active HPO context를 carrier/sample/disease HPO와 비교 |
| query vs context 분리 | phenotype page에서 두 HPO set을 섞지 않음 |
| PanelApp/pathway badge-only | secondary annotation으로 제한 |

### 11.2 reframe에서 부족했던 점

| 문제 | 이유 |
|---|---|
| layout이 기본 포털보다 덜 정돈됨 | 카드, 표, 트랙 밀도가 약합니다. |
| 시각화가 단순 placeholder 중심 | 실제 검토용 화면으로 쓰기 어렵습니다. |
| 기본 포털의 좋은 popover/table/track interaction을 충분히 재사용하지 못함 | 이미 만든 개선 UI를 버리게 됩니다. |
| 별도 reframe route가 baseline과 갈라짐 | 두 버전을 동시에 유지하면 작업 대상이 분산됩니다. |

### 11.3 결론

reframe 페이지는 버리지 않더라도, 앞으로의 주 작업은 기본 포털입니다.

권장:

- reframe은 정보 계층 참고 문서/비교 후보로 유지
- 새 구현은 `krFront.html`, `krSample.html`, `krPhenotype.html`, `krVariant.html`에 반영
- reframe의 summary band와 evidence layer label만 기본 포털로 흡수

---

## 12. 전역 삭제/추가 목록

### 12.1 삭제해야 할 것

| 삭제 대상 | 적용 페이지 | 이유 |
|---|---|---|
| hard-coded old sample/phenotype/variant values | Front, Phenotype, Variant | test DB fixture 검증 불가 |
| `Disease hypothesis` wording | Sample | diagnosis처럼 읽힘 |
| qualitative strength labels | Sample, Phenotype | `High`, `moderate-high`, `strong` 등 금지 |
| `n_terms` | Phenotype | 내부 용어 |
| context score without context | Variant | 없는 context를 score처럼 보이면 안 됨 |
| Link column where value itself can link | Phenotype variant overlay | table clutter |
| body table bold values | Phenotype, CRDC evidence | header만 bold여야 함 |
| popover centered/bold body | Phenotype top info | 읽기 어렵고 화면 밖으로 넘침 |

### 12.2 추가해야 할 것

| 추가 대상 | 적용 페이지 | 목적 |
|---|---|---|
| generated fixture 동기화 check | all result pages | DB 연결 확인 |
| compact interpretation summary band | Sample, Phenotype, Variant | 첫 화면 해석 방향 |
| source/scope labels | all result pages | exact variant / same gene / CRDC / external 구분 |
| active context match summary | context active 상태 | context-driven interpretation |
| no-context guide | Variant carrier context | score 오해 방지 |
| HPO term+ID line-by-line detail | all HPO popovers/expands | 검토 가능성 |
| screenshot verification checklist | docs/process | visual regression 확인 |

---

## 13. 구현 우선순위

### P0: DB fixture와 화면 값 동기화

가장 먼저 해야 합니다.

| 페이지 | P0 항목 |
|---|---|
| Front | example values를 generated sample/variant/phenotype과 맞춤 |
| Sample | sample ID, age, sex, GenDx, group affinity, disease profile reference 확인 |
| Phenotype | query terms, matched count, denominator, age/sex/proband summary hard-coded 제거 |
| Variant | chr15/UBE3A/18 carriers hard-coded 제거 |

P0가 끝나기 전에는 UI hierarchy 평가가 어렵습니다.

### P1: 기본 포털에 reframe summary 흡수

| 페이지 | 작업 |
|---|---|
| Sample | top answer compact box를 interpretation summary band로 확장 |
| Phenotype | top query summary를 generated data 기반으로 정리 |
| Variant | variant header 아래 exact/gene scope summary band 추가 |

### P2: 섹션별 중복 제거

| 페이지 | 작업 |
|---|---|
| Sample | Overview와 Similar samples 중복 제거 |
| Phenotype | top summary와 CRDC cohort evidence 중복 제거 |
| Variant | carrier profile과 context position의 no-context 상태 정리 |

### P3: Context-aware rendering

| 페이지 | 작업 |
|---|---|
| Sample | sample-context HPO overlap |
| Phenotype | query HPO vs active context HPO 분리 |
| Variant | carrier HPO vs active context HPO |

---

## 14. 화면 검증 체크리스트

### 14.1 공통

| 검증 항목 | 확인 방법 |
|---|---|
| 네 기본 URL render | `/krFront.html`, `/krSample.html`, `/krPhenotype.html`, `/krVariant.html` |
| reframe URL은 보존되지만 주 작업 대상 아님 | `_reframe.html` 페이지가 깨지지 않는지 정도만 확인 |
| context status | no context / active context 모두 확인 |
| Edit Context | popover가 화면 밖으로 나가지 않고 X/Cancel/Confirm이 보이는지 |
| blue text | 실제 clickable/popover-triggering 값만 blue인지 |
| table body | body values가 불필요하게 bold가 아닌지 |
| GenDx casing | 모든 화면에서 `GenDx`인지 |
| diagnosis certainty | 금지 표현이 없는지 |
| source hierarchy | CRDC / external reference / secondary annotation 구분이 보이는지 |

### 14.2 Front screenshot target

권장 캡처:

- `krFront.html` first viewport
- context 없음 상태
- context active 상태
- Set context panel opened

확인:

- search mode 3개가 하나의 workflow entry로 보이는지
- right purpose card가 너무 무겁지 않은지
- active context summary가 별도 floating bubble 없이 card 안에만 있는지

### 14.3 Sample screenshot target

권장 캡처:

- sample header + top summary
- Overview tab, Sample overview internal tab
- Overview tab, Phenotype profile internal tab
- Similar samples tab with shared HPO popover
- Similar by genotype tab
- Disease profile matches tab
- Gene / variant evidence tab with phenotype fit popover
- context active state

확인:

- age/sex/sample ID가 generated fixture와 맞는지
- Group affinity가 static old value가 아닌지
- GenDx status가 의미 있게 보이는지
- Similar samples와 Overview가 중복되지 않는지
- disease wording이 reference match인지

### 14.4 Phenotype screenshot target

권장 캡처:

- top Query phenotype profile
- Phenotype-derived candidates disease tab
- Phenotype-derived candidates gene tab
- Cohort variant overlay tab
- CRDC cohort evidence matched samples tab
- Co-observed phenotypes tab expanded row
- Investigator-level evidence tab

확인:

- query terms가 generated fixture와 맞는지
- 132/904 같은 old count가 남아 있지 않은지
- PheRS/GRS가 실제 계산된 것처럼 보이지 않는지
- CRDC cohort evidence tab style이 Phenotype-derived candidates와 통일되는지
- popover가 화면 밖으로 넘치지 않는지

### 14.5 Variant screenshot target

권장 캡처:

- variant header + demographic summary
- queried variant window with all tracks off/on
- per-position carrier count filters
- queried variant evidence/gene context cards
- carrier phenotype profile, variant level
- carrier phenotype profile, gene level
- Edit context panel after phenotype selection
- Edit context panel after carrier sample selection
- active context state

확인:

- chr2/ARMC9 generated value가 화면 전체에 일관되는지
- exact variant carriers와 same gene carriers가 섞이지 않는지
- carrier sample count가 toggle에 맞게 변하는지
- context selection status가 왼쪽에서 혼동스럽게 크게 보이지 않는지
- selected phenotype terms가 Edit context panel 안에서 명확히 보이는지

---

## 15. 구체적인 데이터 이동 경로

### 15.1 Sample search path

```text
krFront.html search by sample
  -> /krSample.html?sample_id=...
  -> KrSample/main.js
  -> KrSample/Template.vue
  -> createKrSampleState()
  -> KrSample/mockData.js base state
  -> applyPortalSampleData()
  -> portalSampleData.generated.js
  -> rendered sample header/tabs
```

현재 한계:

- URL parameter가 여러 sample 중 하나를 선택하는 full lookup으로 작동하지 않습니다.
- generated fixture가 대표 sample 한 개 중심으로 state를 override합니다.

필요 개선:

- generated fixture에 여러 sample payload를 넣거나, sample_id별 lookup object를 생성합니다.
- `createKrSampleState(sampleId)` 형태로 바꿉니다.

### 15.2 Phenotype search path

```text
krFront.html search by phenotype
  -> /krPhenotype.html?query=...
  -> KrPhenotype/main.js
  -> KrPhenotype/Template.vue
  -> createKrPhenotypeState()
  -> KrPhenotype/mockData.js base state
  -> applyPortalPhenotypeData()
  -> portalPhenotypeData.generated.js
  -> rendered query profile/candidates/CRDC evidence
```

현재 한계:

- arbitrary query에 대해 runtime PheRS/GRS를 계산하지 않습니다.
- generated fixture는 특정 test query 하나에 대한 static payload입니다.
- top query section 일부가 generated fixture를 완전히 사용하지 않을 수 있습니다.

필요 개선:

- `query` parameter가 generated phenotype payload와 연결되도록 합니다.
- 실제 PheRS/GRS 계산 전까지는 `HPO overlap fixture` 또는 `precomputed profile result`로 명시합니다.

### 15.3 Variant search path

```text
krFront.html search by variant/gene
  -> /krVariant.html?query=...
  -> KrVariant/main_V3.js
  -> KrVariant/Template_V3.vue
  -> createKrVariantState()
  -> KrVariant/mockData.js base state
  -> applyPortalVariantData()
  -> portalVariantData.generated.js
  -> rendered header/locus/evidence/carrier profile
```

현재 한계:

- generated `chr2:231222761:AT:A`와 template static `chr15/UBE3A/18 carriers`가 섞입니다.
- exact variant, same gene, nearby region scope가 일부 화면에서 명확하지 않습니다.

필요 개선:

- `variant.query`에서 모든 header/locus/window label을 생성합니다.
- exact/gene scope count를 computed property로 통일합니다.
- hard-coded coordinate strings를 제거합니다.

---

## 16. 필요한 코드 구조 개선

### 16.1 State factory parameterization

현재:

```js
export function createKrSampleState() {
    const state = { ... };
    return applyPortalSampleData(state);
}
```

권장:

```js
export function createKrSampleState({ sampleId } = {}) {
    const state = { ... };
    return applyPortalSampleData(state, { sampleId });
}
```

phenotype/variant도 같은 형태로 확장할 수 있습니다.

### 16.2 Generated fixture shape

현재 대표 payload 하나:

```js
const portalSampleState = {
    sample: { sampleId: "BCH-22-44945-01", ... },
};
```

권장:

```js
const portalSampleStateById = {
    "BCH-22-44945-01": { ... },
    "BCH-19-86295-01": { ... },
};
```

이렇게 하면 front에서 sample_id를 바꿔도 화면이 실제로 바뀝니다.

### 16.3 공통 evidence label helper

반복되는 source label을 helper로 정리합니다.

```js
function evidenceLayerLabel(source) {
    if (source === "crdc") return "CRDC internal evidence";
    if (source === "reference") return "Core rare disease reference";
    if (source === "secondary") return "Secondary annotation";
    return "Evidence";
}
```

단, shared CSS나 shared component를 크게 바꾸기보다 각 페이지 template 안에서 작은 helper로 시작하는 것이 안전합니다.

---

## 17. 삭제/추가 후 기대되는 최종 흐름

### 17.1 Front

```text
Search entry + HPO context management
  -> sample / phenotype / variant-gene entry
  -> same CRDC cohort evidence workflow
```

### 17.2 Sample

```text
Sample header
  -> compact interpretation summary
  -> sample phenotype/genotype overview
  -> similar patients/groups
  -> public disease profile references
  -> gene/variant evidence
```

### 17.3 Phenotype

```text
Query phenotype profile
  -> phenotype-derived disease/gene candidates
  -> CRDC matched sample evidence
  -> co-observed phenotype structure
  -> investigator/group evidence
```

### 17.4 Variant

```text
Queried variant/gene header
  -> locus and recurrence context
  -> carrier count and demographics
  -> carrier phenotype profile
  -> carrier sample set
  -> disease/reference/secondary annotation
  -> active context overlap if available
```

---

## 18. 최종 판단

현재 포털의 가장 좋은 방향은 다음입니다.

1. 기본 포털의 card/table/popover/track 시각 구조를 유지합니다.
2. reframe의 정보 계층을 기본 포털에 흡수합니다.
3. 별도 reframe page를 계속 키우지 않습니다.
4. 먼저 generated test DB fixture와 화면 값의 mismatch를 제거합니다.
5. 그 다음 sample, phenotype, variant page에 compact interpretation summary를 추가합니다.
6. 각 섹션에서 “이 값이 어디서 왔는지”와 “무엇과 무엇을 비교하는지”를 명확히 합니다.

가장 중요한 검증 기준은 다음입니다.

> 사용자가 화면 첫 viewport만 보고도  
> “무엇을 검색했는지, CRDC 내부에서 어떤 evidence가 가장 강한지, external rare disease reference는 무엇을 보조하는지, 다음에 무엇을 inspect해야 하는지”를 알 수 있어야 합니다.

이 기준을 만족하려면 reframe을 독립 버전으로 계속 확장하기보다, 기본 포털의 좋은 시각화 위에 reframe의 해석 구조를 얹는 방식이 가장 효율적입니다.

