---
title: PB Phenotype Engineering Integration Handoff
tags: [dig-dug-portal, pb-phenotype, bioindex, phers]
status: active
updated: 2026-10-16
---

# PB Phenotype Engineering Integration Handoff

- Updated: 2026-10-16
- Branch: `kyuryung/bch-prototype`
- Page: `/pb_phenotype.html`
Audience: frontend, backend, reference-data and platform engineers integrating this page into the authenticated BCH portal.

## A. Delivery and integration baseline

| Item | Required implementation |
|---|---|
| Current screen commit | `e66a2be797e0f3b682f706973a926fe97fba6fdc` — `feat(pb-phenotype): expand references and unify profile analysis` |
| Prerequisite Phenotype commit | `179be6c4a` — profile service, proxy, initial reference/data integration |
| Related Variant screen commit | `71a157188daf457926b217df9f39a6d38f1e5531` |
| Variant engineering document | [PB Variant integration handoff](pb_variant_engineering_integration_handoff.md) |

Integrate the branch history through `e66a2be79`, or include its prerequisites explicitly. Cherry-picking only the latest Template/CSS changes does not supply the profile service, proxy, precomputed-gene endpoint or statistical dependencies. Preserve the existing BCH multi-page routes and configuration; add the needed entry/service mappings rather than replacing the entire production `vue.config.js`.

Reference URLs:

- Single: `http://127.0.0.1:8098/pb_phenotype.html?query=HP%3A0001945&exclude=HP%3A0000252`
- Multiple: `http://127.0.0.1:8098/pb_phenotype.html?query=HP%3A0001945%2CHP%3A0002922%2CHP%3A0002315`
- Additional reference selection: append `&source=omim`, `decipher`, or `ddg2p`; Orphanet is the default.

These are local acceptance references. The implementation commits do not establish a test-server deployment. The sections below contain the current product and calculation rules; use them as acceptance requirements, not as a source of hard-coded example counts.

## B. Services the deployed page must have

| Browser path | Current development provider | Required deployed behavior |
|---|---|---|
| `/__pb_phenotype_profile__/profile` | Vue proxy to local Python profile service, normally port 8093; rewrites to `/phenotype-analyzer-api/profile` | An authenticated service with the response contract in C1; the Python implementation can be mounted server-side with approved inputs or replaced by an equivalent existing service |
| `/__hpo_gene_associations__?hpo=…` | Express handler registered by `scripts/gene_hpo_association_endpoint.js` in `devServer.before` | Serve the same approved precomputed HPO-to-gene release projection from a backend route; a static Vue build does not include this handler |
| `/phenotype-analyzer-api/co-gene-associations` | Vue proxy to the existing Gene/Variant Context API, normally port 8092 | Preserve existing gene-score model and complete requested-family BH results; do not create a requirement for `/profile-gene-associations` |
| `/__bioindex_private__/api/bio/query/samples-info` | Private BioIndex proxy | Preserve the private request helper, session authentication and authorized sample metadata fields |

`devServer.proxy` and `devServer.before` run only in development. Deploying built HTML/JS alone will not provide the three API paths above. Configure the production web server/application router explicitly and preserve the same-origin private access boundary. Do not substitute public BioIndex responses or fixture values.

Development settings:

| Variable | Role |
|---|---|
| `PB_PHENOTYPE_HPO_MATRIX` | Approved complete parent-expanded binary HPO TSV/TSV.GZ; first column sample ID, remaining columns HPO IDs |
| `PB_PHENOTYPE_METADATA` | TSV with `sample_id`, `age`, `sex`, `affected`, aligned to the profile cohort |
| `PB_PHENOTYPE_COHORT_MAPPING` | CSV with `de_identified_subject`, `clean_name`, `cohort_type`; Primary mapping takes precedence |
| `PB_PHENOTYPE_PYTHON` / `PB_PHENOTYPE_PROFILE_PORT` | Python interpreter / local profile port (8093 default in Vue); profile dependencies include NumPy and SciPy |
| `PB_GENE_HPO_FILE` | Approved `browser_gene_hpo.jsonl.gz` release for the single-HPO gene route |
| `PHENOTYPE_ANALYZER_HOST_PRIVATE` | Existing gene/variant Context service upstream; its approved analysis roster, covariates and gene-score source are separate from the full profile cohort |
| `BIOINDEX_HOST_PRIVATE` / `BIOINDEX_HOST_PRIVATE_BROWSER` | Private upstream / same-origin browser proxy base |

`npm run serve:pb-phenotype` sets local development defaults. For a standalone profile service use `python3 -m scripts.pb_phenotype_profile_api --hpo-matrix <approved-path> --metadata <approved-path> --cohort-mapping <approved-path> --host 127.0.0.1 --port 8093`. Configure approved service-side inputs in the target environment; workstation paths are not production runtime dependencies. Never put the raw matrix, sample metadata or gene-score table into browser assets or Git.

## C. Request, response and calculation contracts

### C1. Private sample profile

```http
POST /__pb_phenotype_profile__/profile
Content-Type: application/json

{"hpo_ids":["HP:0001945","HP:0002315"],"page":1,"page_size":100}
```

The upstream profile path is `/phenotype-analyzer-api/profile`. The existing parser accepts 1–20 HPO IDs, positive page numbers, and page sizes 1–100. The current frontend sends no Exclude or metadata filters in this request: it collects **all** response pages, then applies its display filters. Do not pass age-band labels into the optional legacy `exact_age` field or silently redefine its request contract.

Required response fields:

| Field | Contract |
|---|---|
| `query_hpo_ids` | HPO IDs used for this calculation |
| `scoring_method` | Current frontend requires `residual PheRS: rphers_fast.score_samples` |
| `cohort_sample_count` | Full profile cohort count, distinct from returned matches and analysis-roster size |
| `pagination` | `{page, page_size, total, next}`; total counts the complete matching result, not the current response slice |
| `samples[]` | One row per sample: `sample_id`, `unique_sample_ID`, `residual_phers`, `matches`, `expanded_hpo_ids`, `age_at_enrollment`, `gender`, `initial_study_affected`, `cohort_category` |
| `matches` | `k/n`, computed from the same parent-expanded matrix and query; not inferred from PheRS |
| `expanded_hpo_ids` | Complete recorded/parent-expanded HPO IDs needed by match cards, Exclude and co-recorded phenotype summaries |
| Demographics | Nullable numeric age; `female`/`male`/`unknown`; affected `Y`/`N`/missing; explicit cohort label or missing |

The API returns samples matching at least one query term. For multiple HPOs the current UI selects ≥2 matches for its sample list and demographic/cohort summaries. Single HPO uses all returned matches. Residual PheRS comes from the existing scorer over the full approved matrix; changing Exclude removes rows without refitting or changing the remaining scores.

This is an authenticated **sample-level** route. Do not apply the public aggregate-only response contract to it, and do not expose it through an unauthenticated/public route. Reference definitions and disease annotations remain separate from patient observations.

### C2. Single-HPO precomputed genes

`GET /__hpo_gene_associations__?hpo=HP:0001945` returns `{hpoId, total, associations}`. Each association supplies `gene`, `oddsRatio`, `ciLow`, `ciHigh`, `pValue`, and `qValue`. The current handler selects positive-direction, q-significant associations from the approved release and transforms the approximate OR/CI to a 0.1-score increment. Preserve this scale and its labels; do not display those ORs as the multi-HPO β.

The current handler caps returned associations at 20 although `total` may be larger. For a complete production list, deliver all valid rows or implement explicit server pagination compatible with the 4-row UI. Do not claim a full list when only this preview has been delivered. Missing release configuration is 503, not an empty biological result.

### C3. Multi-HPO full-gene analysis

Use the existing `POST /phenotype-analyzer-api/co-gene-associations` with:

```json
{
  "gene": "<first symbol in the approved source catalog>",
  "terms": ["HP:0001945", "HP:0002315"],
  "co_genes": ["<every other symbol in that same catalog>"],
  "score_type": "max",
  "affected_only": false
}
```

The strings in angle brackets describe the request construction, not runnable gene symbols. `profileGeneApi.js` constructs the real request from `profileGeneCatalog.generated.json` (19,090 named genes for the verified source). The request fits the existing 25,000-symbol / 512 KiB limits.

The response must include `query_hpo`, `model`, `score_type`, `affected_only`, `fdr_method: "BH"`, `n_requested`, `n_tests`, and `gene_associations` keyed by every requested symbol. A valid tested row has `status: "ok"`, `beta`, finite `p_value` and `fdr` in [0,1], and `n_positive`; non-testable genes retain their explicit status. The adapter checks complete symbols/counts, BH and valid FDR coverage, then retains valid tested genes. The view additionally verifies that query HPOs and the normalized full-testing scope match.

The legacy service's scope label refers generically to target/co-genes. For this page the **actual request family is the complete approved source catalog**, and the adapter normalizes its scope accordingly. For Variant the family is only the target plus unfiltered co-carrier genes. Preserve this difference even though both pages reuse the same route. Do not select genes from Orphanet candidates or top-10 diseases before testing.

The statistical model and score source are reused from Gene/Variant; no Phenotype-only regression is introduced. Source catalog and service score release must match. The source hash and regeneration command appear in the implementation reference below; the current service does not independently return that hash.

### C4. Reference matching and descriptive summaries

- Orphanet uses the frequency-weighted coverage formula below; other selected DBs show unique matched/total phenotype HPO counts with no invented frequency or Profile score.
- Exclude removes matching disease records; Orphanet's own Excluded(0%) annotations are ignored. Source selection controls both disease ranking and What would narrow this?.
- Demographic comparisons start with the same query-qualified, metadata-filtered samples **before Exclude**. Gray segments are the unique excluded subset; filled plus gray preserves the original bar extent. Remaining samples define cohort statistics and co-recorded HPO percentages.
- Cohort Mean residual PheRS is the mean of available finite residuals, with a scored/total denominator; 0 and negative scores are included. This differs from Variant's same-gene Mean rPheRS, which requires complete eligible-carrier coverage before showing any mean.

## D. Engineer implementation and acceptance checklist

1. Integrate the complete branch prerequisites; preserve `/pb_phenotype.html`, `/pb_variant.html`, `/pb_Gene.html` case and existing portal routing.
2. Configure the four private browser paths in B and approved backend inputs. Verify the full profile cohort and the separate gene-analysis roster; do not interchange their denominators.
3. Ship the generated reference artifacts with provenance, or a versioned equivalent. Preserve Orphanet/OMIM/DECIPHER/DDG2P source selection, complete HPO profiles, gene links and MONDO mappings. A search preview is not a full disease profile.
4. Fetch every sample page before totals, filters and charts. Verify that unavailable HPO or missing sample metadata produces a clear state rather than synthetic zeros.
5. Verify single and multiple queries: 5 sample rows, 4 gene rows, 5 disease rows and 5 cohort groups per page. Cohort groups are open by default. No Save profile button, top-three rank highlight, duplicate All annotated capsule, PheRS bar or Profile score bar.
6. Check recorded HPO color fills vs unrecorded **white dashed** boxes, Exclude's red block and per-term exclusion counts, and Unknown demographics. UI-valid age is 0–100 with the specified bands; age-at-enrollment is not age-at-onset.
7. Check both Age and Sex before/after counts, no duplicate exclusion counts, cohort age quantiles/sex totals/residual mean, column sorting and pagination. Quantile method and missing-score rules are specified below.
8. Switch each disease source and verify that both the table and narrowing candidates/counts change; preserve `source` in the URL and apply Exclude to each source.
9. Run the three Node tests listed below, the development build and `git diff --check`. Validate the private HTTP contracts in the target environment and compare the supplied local acceptance cases. Local verified counts are examples, not fixed release expectations.

Source files to integrate: `PbPhenotype/Template.vue`, `style.css`, `phenotypeModel.js`, `profileGeneApi.js`, the three generated reference/catalog artifacts, `scripts/pb_phenotype_profile_api.py`, `gene_hpo_association_endpoint.js`, existing scorer/Context dependencies and relevant `vue.config.js` entries. Reference builders and tests are listed below.

The remaining source limits below are concrete integration items: single-HPO gene preview cap, no validated sample-diagnosis→Orphanet count mapping, and no Compare phenotypes implementation. Do not replace them with mock values. This document and the existing Variant handoff are the two page-specific engineering entry documents; no new file is required.

## Current implementation reference and calculation details

## 1. 현재 상태와 적용 범위

대상은 `http://127.0.0.1:8098/pb_phenotype.html`이다. 로컬 페이지가 기존 계산 API·BioIndex와 로컬 샘플 profile 서비스를 사용한다. 이번 작업에서 테스트 서버에 화면이나 API를 배포하지 않았다.

기준 파일은 사용자가 제공한 `/Users/kyuryung/Downloads/phenotype_page_spec.md`, `phenotype_page1_single_hpo.html`, `phenotype_page2_three_hpo.html`이다. spec은 계산·화면 요구의 기준이고 HTML은 시각 참조다. 목업의 숫자·샘플 ID·유전자 통계는 실데이터로 사용하지 않는다. **아래의 후속 사용자 결정이 이전 spec과 이전 작업 기록보다 우선한다.**

현재 화면 순서:

1. 검색, 입력 HPO·Exclude, age/sex/affected 필터와 HPO context 요약.
2. Samples ranked by residual PheRS: 샘플 표 → Age/Sex·동반 HPO → 코호트 요약.
3. Genes associated with this profile 또는 단일 HPO 유전자 결과.
4. 출처를 선택하는 질병 표와, 여러 HPO일 때 What would narrow this?.

상단의 큰 지표 카드 4개는 삭제했다. HPO context 안에 각 term의 코호트 샘플 수·비율, Orphanet 질병 수, 빈도 80% 이상으로 주석된 질병 수를 한 줄로 표시한다. 각 term 아래에는 Exclude로 빠지는 샘플·질병·고빈도 질병 수를 빨간 줄로 표시한다. 서로 다른 줄의 제외 집합은 겹칠 수 있으므로 합산하지 않는다.

여러 HPO에서는 `All N together`, `≥2 of N`, `16,366 total samples`를 표시한다. 마지막 숫자는 코호트 그룹 개수가 아니라 전체 샘플 수다. 이 상단 요약은 전체 코호트와 Orphanet 직접 주석 기준이다. 아래 질병 DB 선택은 질병 표와 좁히기 패널에 적용되며 상단 Orphanet 요약이나 유전자 검정 범위를 바꾸지 않는다.

## 2. 데이터와 실행 경로

| 데이터 | 실제 기준 | 연결 |
|---|---|---|
| 샘플 HPO·Residual PheRS | 부모 HPO 확장 CRDC 행렬, metadata, 기존 `rphers_fast.score_samples` | 로컬 `/__pb_phenotype_profile__/profile` → 8093 `/phenotype-analyzer-api/profile` |
| 질병/프로젝트 표시명 | 로컬 cohort category, BioIndex의 `clean_name` 등으로 표시명 보강 | `/api/bio/query/samples-info`, `_E38`·`_G38` ID 조회 |
| 단일 HPO 유전자 | 기존 Gene 페이지용 `browser_gene_hpo.jsonl.gz`의 양의 방향·q 유의 release | `/__hpo_gene_associations__?hpo=…` |
| 다중 HPO 유전자 | Gene/Variant와 동일한 전체 코호트 gene-score 모델 | 기존 `POST /phenotype-analyzer-api/co-gene-associations` |
| Orphanet 질병·빈도·유전자 | Orphadata Products 4·6, July 2026 | `orphanetReference.generated.js` |
| OMIM·DECIPHER 질병 HPO | 로컬 HPOA 2026-02-16의 전체 양성 phenotype 주석 | `additionalDiseaseReferences.generated.json` |
| DDG2P 질병 HPO·연결 유전자 | 로컬 DDG2P gene–condition phenotype 자료 | 같은 추가 reference artifact |
| MONDO | 질병 ID 매핑 | 질병 상세 행의 MONDO mappings; 독립된 표현형 목록으로 중복 집계하지 않음 |

기본 실행은 `npm run serve:pb-phenotype`이다. `scripts/serve_pb_phenotype_local.sh`가 로컬 입력 경로를 지정한다. 주요 환경변수는 `PB_PHENOTYPE_HPO_MATRIX`, `PB_PHENOTYPE_METADATA`, `PB_PHENOTYPE_COHORT_MAPPING`, `PB_GENE_HPO_FILE`, `BIOINDEX_HOST_PRIVATE`다. BioIndex 기본 대상은 `http://100.80.30.199:5000`, Context API 프록시 기본 대상은 `http://127.0.0.1:8092`다.

샘플 API의 모든 페이지를 `page_size=100`으로 수집한 다음 화면에서 필터·정렬·페이지 나누기를 한다. BioIndex `samples-info.phenotypes`가 비어 있어도 실제 샘플 HPO는 확장 HPO 행렬에서 읽는다. 빈 BioIndex 필드를 이유로 HPO가 없다고 판단하지 않는다.

## 3. 입력·Exclude·샘플 표

- 완전한 HPO ID나 목록에서 고른 term은 + 버튼을 다시 누르지 않아도 추가된다.
- Exclude는 빨간 테두리 블록이며 선택한 term도 빨간 테두리 안에 표시한다.
- Exclude에 일치하는 샘플과 질병은 결과 표에서 제거한다. **점수를 낮추는 동작이 아니다.** 남은 샘플의 residual PheRS와 남은 질병의 Profile score는 변경하지 않는다.
- 샘플의 확장 HPO 목록에 실제로 기록된 Exclude만 제거 근거로 쓴다. 미기록은 임상적 부재가 아니라 Unknown이다.
- 단일·다중 HPO 모두 샘플 표를 처음부터 보여주며 5명씩 페이지를 넘긴다. 단일 화면의 Open sample list 버튼은 삭제했다.
- 다중 HPO 샘플 표와 나이·성별·코호트 요약의 대상은 질의 HPO를 최소 2개 기록한 샘플이다. 단일 HPO는 해당 HPO를 기록한 샘플이다.
- 샘플 컬럼은 Rank, Sample, Residual PheRS, Query HPOs matched, Age · sex, Cohort disease / project, Affected다. 제목을 누르면 정렬 방향이 바뀐다.
- residual PheRS는 기존 scorer의 숫자만 표시하며 점수 bar는 없다. 순위 1–3에 별도 색을 주지 않고 모든 rank를 같은 중립 스타일로 표시한다. 질병 순위의 상위 3개 강조도 삭제했다.
- Query HPOs matched는 입력 순서의 작은 사각형과 `k/n`이다. 기록된 HPO만 색을 채우고 **미기록은 흰색 바탕·점선 테두리**로 표시한다. 옅은 색 채우기나 투명도 표현은 사용하지 않는다.
- 색의 차이는 순위가 아니라 실제 일치 항목의 차이다. 확인한 Fever·Increased CSF protein·Headache 질의에서 1·2위는 Fever 미기록이고, 3·4·5위는 CSF protein 미기록이었다. 모두 2/3이어도 기록된 HPO의 종류는 다르다.
- 입력 순서의 색은 orange `#E69F00`, sky `#56B4E9`, green `#009E73`, yellow `#F0E442`, blue `#0072B2`, pink `#CC79A7`, black, grey다. 같은 HPO는 chip·segment에서 같은 색을 쓴다.
- 긴 단일 HPO 정의는 Definition and ontology를 펼쳐 읽도록 정리했다.
- Save profile/Saved 버튼과 localStorage 저장 코드는 삭제했다. 당시 저장값을 복원하는 기능이 없어 실효성이 없었기 때문이다.

## 4. Age·Sex·코호트 통계

단일·다중 HPO 모두 같은 요약 카드를 사용한다. 여러 HPO에서도 나이 분포는 현재 프로필과 일치하는 샘플 집합을 설명하므로 유지한다. **등록 시 나이이며 발병 나이가 아니다.**

유효 나이는 0–100세다. 음수·100 초과·해석 불가·누락 값은 Unknown이다. 구간은 `0 / 1–2 / 3–5 / 6–9 / 10–13 / 14–17 / 18+ / Unknown`이다. 소수 나이는 유효성 확인 후 내림하여 band를 찾는다.

Age at record와 Sex · remaining samples의 공통 규칙:

- age·sex·affected·cohort 필터와 샘플의 질의 일치 조건을 먼저 적용한 동일한 모집단에서 Exclude 전후를 비교한다.
- 색칠한 부분은 남은 샘플, 회색 사선 음영은 Exclude로 제거된 샘플이다. 막대의 전체 길이는 Exclude 전 개수로 유지한다.
- 각 줄은 `remaining / before`와 `−excluded`를 표시한다. 여러 Exclude term에 동시에 걸린 샘플도 한 번만 센다.
- Sex는 Female / Male / Unknown을 사용한다. 두 차트는 같은 샘플 집합을 집계한다.
- 동반 표현형은 남은 샘플의 확장 HPO에서 집계하고 입력/제외 HPO를 빼고 최대 8개를 보여준다.

Cohort categories는 **기본 펼침**, 5개 그룹씩 페이지 나누기다. 그룹별 통계는 필터·Exclude 적용 후 남은 샘플 기준이다.

| 컬럼 | 정의 |
|---|---|
| Samples | 남은 샘플 수 |
| Affected | affected=Y 샘플 수 |
| Age · median (Q1–Q3) | 유효 나이의 중앙값 및 25–75백분위 범위; 유효 age 수/샘플 수도 표시 |
| Sex · F / M / unknown | 여성 / 남성 / Unknown 샘플 수; 합계는 Samples와 같음 |
| Mean residual PheRS | 사용 가능한 residual PheRS의 산술평균; scored 수/샘플 수도 표시 |

나이 분위수는 정렬된 값의 `(n−1)×p` 위치를 선형 보간한다. 유효 나이가 없으면 `—`다. 평균 residual PheRS에서 0·음수는 실제 값으로 포함하고 누락·비유한 값은 제외한다. 유효 점수가 없으면 0이 아닌 `—`다. 모든 컬럼은 정렬 가능하다. Sex 정렬은 여성 샘플 수, 평균 점수 정렬은 실제 숫자를 기준으로 한다.

## 5. 유전자 검정 범위와 404 해결

단일 HPO는 기존 사전 계산 release를 사용하며 OR per 0.1 burden score, 95% CI, p, q를 표시한다. 다중 HPO는 기존 Gene/Variant 계산의 β, p, BH q, positive-score 샘플 수를 사용한다. 화면은 4개 유전자씩 페이지를 넘긴다. Orphanet 연결은 검정과 독립된 evidence이며 연결이 없는 유의한 유전자도 candidate로 표시한다.

이전 구현은 Orphanet 상위 10개 질병에서 고른 유전자만 기존 API에 요청했다. 따라서 Orphanet에 없는 유전자를 놓칠 수 있었고 q의 검정 범위도 좁아졌다. 이를 수정하여 **원본 점수 파일의 전체 유전자 기호 19,090개를 기존 API에 요청**한다. 기존 서버는 같은 HPO/options의 전체 gene-score 계산을 한 번 실행하고 요청한 유전자의 결과를 선택한다. 전체 유전자 목록을 요청하므로 BH q는 검정 가능한 전체 유전자 범위에서 나온다.

`profileGeneApi.js`는 전체 요청 수·반환 기호·유효 p/q·n_tests·BH 여부를 확인한다. 일부만 반환되면 전체 검정처럼 표시하지 않고 오류를 낸다. 목표 gene은 목록 첫 기호, co_genes는 나머지 전체 목록이며 Orphanet 후보 목록으로 제한하지 않는다. `score_type=max`, `affected_only=false`다.

앞서 `/phenotype-analyzer-api/profile-gene-associations`라는 새 URL을 연결했을 때 실행 중인 API에 이 경로가 없어 404가 났다. 일시적인 장애가 아니었다. **최종 화면은 이 URL을 호출하지 않고 이미 있는 `/co-gene-associations`를 사용한다.** 새 서버 경로를 배포해야 화면이 작동하는 구조가 아니다. 사용하지 않는 새 backend route 변경은 최종 변경 묶음에서 제거했다.

유전자 목록 artifact는 개인별 score/샘플 ID가 아니라 유전자 기호와 원본 해시만 담는다.

- 원본: `CRDC2025_step4_sample_gene_burden_nonsyn_dosage_LOFTEE_AM.tsv`
- SHA256: `155bb297af273bd61e83c2449e061519c74b4515fd01c336e46593aec132b469`
- 원본 행 10,205,276개, 유효 유전자 기호 19,090개. 빈 기호 8,273행은 유전자 목록에 포함하지 않는다.
- 점수 release가 바뀌면 **gene catalog도 함께 재생성**해야 한다. 기존 API는 원본 hash를 반환하지 않으므로 현재 연결의 전체 범위는 이 확인한 source snapshot에 대한 것이다.

## 6. 질병 DB 선택과 What would narrow this?

질병 카드에서 Orphanet / OMIM / DECIPHER / DDG2P를 선택한다. **질병 표와 What would narrow this?는 같은 선택 상태를 공유한다.** 선택한 출처는 URL의 `source=omim|decipher|ddg2p`에 남아 새로고침 후 유지된다. 기본은 Orphanet이다.

| 출처 | 표시와 정렬 |
|---|---|
| Orphanet | 단일 HPO는 직접 주석 빈도·criterion, 다중 HPO는 아래 빈도 가중 Profile score |
| OMIM / DECIPHER / DDG2P | 빈도 가중치 없이 `Disease HPOs matched`와 `Query terms matched` |

추가 DB의 `2/8`은 해당 질병 레코드의 전체 고유 phenotype HPO 8개 중 2개가 질의에 의해 설명된다는 뜻이다. 별도 `2/3`은 입력 HPO 3개 중 2개가 매칭되었다는 뜻이다. 질병의 더 구체적인 자손 HPO도 매치한다. 여러 query가 같은 질병 HPO를 설명해도 그 주석은 한 번만 센다. 정렬은 매칭된 질병 HPO 개수 → 일치 질의 수 → 질병 HPO coverage → 이름 순이다. 임의 빈도나 Profile score를 만들지 않는다.

추가 DB는 전체 주석을 사용하며 기존 검색용 8-term preview를 계산에 재사용하지 않는다. HPOA aspect=P 및 Phenotypic abnormality 계열만 사용하여 유전양식·clinical modifier가 phenotype 분모나 제안에 섞이지 않게 한다. 사용 가능한 reference는 OMIM 8,592개 phenotype 보유 질병, DECIPHER 47개, DDG2P 1,718개 gene–condition 레코드다. 원본에는 OMIM 8,614개·DDG2P 1,724개가 있었으나 phenotype 주석이 없는 레코드는 결과 후보로 만들지 않는다.

DDG2P는 gene–condition 레코드 단위이므로 질병이 비슷하더라도 연결 gene/condition이 다르면 구분한다. 연결 OMIM ID와 유전자, 가능한 MONDO 매핑을 상세 행에 표시한다. MONDO는 이 자료에서 식별자 연결 역할이며 같은 주석의 독립적인 두 번째 DB 근거로 중복 집계하지 않는다.

질병은 5개씩 페이지를 넘긴다. 제목 옆에 현재 출처의 매칭 수를 표시한다. 중복된 All annotated/After exclusions 단일 캡슐은 삭제했다. 출처 선택과 단일 Orphanet의 실제 빈도 필터는 남긴다. Profile score와 residual PheRS의 bar는 사용하지 않는다.

여러 HPO의 What would narrow this? 규칙:

- 선택한 DB의 상위 최대 10개 레코드에서 아직 입력·제외에 쓰지 않은 표현형을 제안한다.
- Orphanet은 score≥0.10 후보 중 상위 10개, 다른 DB는 매칭 후보의 개수 기반 순위 상위 10개다. 0.10은 내부 범위이며 별도 Candidates 필터를 만들지 않는다.
- 제안 순위는 기존 이진 엔트로피다. 표의 한 행은 표현형 하나이고 `8 of 10`은 상위 10개 중 8개에 주석되어 있다는 뜻이다. 표본 수가 아니며 미주석이 임상적 부재를 뜻하지 않는다.
- `+`는 기록된 표현형 추가, `−`는 Exclude 추가다. +는 검정 글자·옅은 파랑 버튼, −는 빨강 글자·옅은 빨강 버튼이다. 컬럼 제목 정렬 버튼에는 테두리를 두르지 않는다.
- 출처를 바꾸면 출처 라벨·후보 목록·제안 용어·각 제안의 개수가 함께 바뀐다. 제안이 없으면 해당 출처의 안내 문구를 표시한다.

## 7. spec 7.4에서 유지한 Orphanet 계산

가중치는 Obligate 0.9950, Very frequent 0.8911, Frequent 0.5446, Occasional 0.1733, Very rare 0.0297이다. Orphanet Excluded(0%) 주석은 계산과 사용자 Exclude 매칭 모두에서 무시한다.

1. `S(D)`: 질병의 표현형 가중치 합. 조상–자손 관계인 쌍은 가중치가 큰 하나만 세고, 같으면 더 구체적인 쪽을 남긴다. 전체 집합에 동시에 적용한다.
2. `m(q,D)`: q와 같은 주석 또는 q의 자손 주석 중 최대 가중치. 없으면 0이다. 이 매칭에는 분모에서 정리하기 전 전체 양성 주석을 쓴다. 넓은 질병 주석은 더 구체적인 질의의 일치로 취급하지 않는다.
3. `N=Σm(q,D)`, `Cov_D=min(1,N/S(D))`, `Cov_Q=N/입력 term 수`.
4. `score=2×Cov_D×Cov_Q/(Cov_D+Cov_Q)`. 두 coverage가 모두 0이면 0. 소수 둘째 자리까지 표시하며 확률이 아니라 순위용이다.
5. **후속 사용자 결정:** Exclude에 맞는 질병은 제거한다. 이전 spec의 `0.5×최대 Exclude 가중치` 감점은 현재 구현에 적용하지 않는다.

spec의 FHL 예시: Seizure·Fever·Hepatosplenomegaly 질의, 주석 11개라면 `S=2×0.9950+5×0.8911+4×0.5446=8.6239`, `N=2.8811`, `Cov_D≈0.334`, `Cov_Q≈0.960`, 조화평균 약 0.496 → **0.50**이다. 목업의 다른 5개 점수는 실제 disease profile로 검증한 값이 아닌 예시값이다.

IC, 발병 나이 적합도, semantic similarity는 현재 점수에 넣지 않는다. 원본 spec의 큰 metric strip·단일 샘플 목록 접기·PheRS/Profile score bar·Exclude 감점은 위 사용자 변경으로 대체되었다. 분모 S(D)는 같은 Orphanet snapshot 안에서 캐싱한다.

## 8. 검증한 실데이터와 화면

| 질의 / Exclude | 확인값 |
|---|---|
| Fever / Microcephaly | 1,866명 중 94명 제외, 1,772명 남음 |
| 같은 질의의 Sex | Female 841→795 (−46), Male 1,021→973 (−48), Unknown 4→4 |
| Fever의 Inflammatory Bowel Disease 그룹 | 284명, Female/Male/Unknown 127/157/0, median age 15, 평균 residual PheRS 1.587 |
| Fever의 Unexplained Epilepsies 그룹 | 257명, 평균 residual PheRS 1.528 |
| Fever의 Primary Immunodeficiency 그룹 | 222명, 평균 residual PheRS 1.356 |
| 혈중 이온 이상·Nausea/vomiting·체격 이상·고환 형태 이상 / 방광 기능 이상 | ≥2/4 샘플 549명 중 78명 제외 → 471명. Sex Female 217→188, Male 332→283 |
| 같은 4-term 유전자 검정 | 19,090 기호 요청, 검정 가능 18,819개, q<0.05인 18개 |
| 같은 4-term 출처 선택 | Orphanet 1,627 / OMIM 1,978 / DECIPHER 12 / DDG2P 577. 각 선택에서 질병 표와 narrowing 제안이 실제로 달라짐 |
| Fever·CSF protein 증가·Headache | Orphanet 561개. All annotated 캡슐 삭제 및 미기록 흰색 점선 확인 |

위 수치는 해당 질의·필터·source snapshot에서 관찰한 값이다. 다른 질의의 고정 숫자로 사용하지 않는다. 코호트 평균·성별 수는 로컬 API의 전체 샘플을 별도로 집계한 Python 결과와 화면을 대조했다. 나이/성별 막대의 Exclude 전 전체 길이 유지, 코호트 기본 펼침·5행 페이지 전환, 평균 점수 정렬, 모든 rank의 중립색을 브라우저에서 확인했다.

검증 명령:

- `node scripts/test_pb_phenotype_model.mjs`: Orphanet 공식, 나이 bands, 추가 DB 전체 profile·중복 제거·출처별 narrowing, Age/Sex 음영 집계, cohort 분위수·성별·평균의 0/음수/누락 처리.
- `node scripts/test_pb_profile_gene_api.mjs`: 기존 API에 전체 catalog 요청, 부분 결과 및 불완전 FDR 거부.
- `node scripts/test_pb_phenotype_gene_endpoint.js`: 단일 HPO release endpoint.
- `npm run build -- --dest /private/tmp/pbp-commit-build`: 최종 변경으로 통과. 기존 `tabix-reader` default-export warning 1개.
- `git diff --check`: 통과.

## 9. 파일·재생성·기록

주요 변경 파일:

- `src/views/PbPhenotype/Template.vue`, `style.css`, `phenotypeModel.js`
- `additionalDiseaseReferences.generated.json`, `profileGeneCatalog.generated.json`, `profileGeneApi.js`
- `scripts/build_pb_phenotype_additional_references.py`, `build_pb_profile_gene_catalog.py`
- `scripts/test_pb_phenotype_model.mjs`, `test_pb_profile_gene_api.mjs`

추가 질병 reference 재생성:

```sh
python3 scripts/build_pb_phenotype_additional_references.py \
  --reference-dir /Users/kyuryung/Documents/github_dir/dig-dug-portal/data/reference_db \
  --hpo-obo /Users/kyuryung/Documents/BCH/90_Ref/hp_260216.obo
```

유전자 catalog 재생성은 승인된 원본 점수 파일이 있는 환경에서 한다. 출력은 샘플 ID나 score가 없는 유전자 목록·해시뿐이다.

```sh
python3 scripts/build_pb_profile_gene_catalog.py \
  --gene-scores /path/to/CRDC2025_step4_sample_gene_burden_nonsyn_dosage_LOFTEE_AM.tsv \
  --output src/views/PbPhenotype/profileGeneCatalog.generated.json
```

추가 DB artifact에는 입력 TSV별 SHA256·HPO OBO 버전·전체 profile 개수를 기록한다. 원본 reference/score release를 바꾸면 artifact도 갱신하고 API와 목록 범위를 대조한다.

남은 구현 경계:

1. 로컬 profile sidecar와 기존 원격 Context API/BioIndex 연결이 필요하다. 로컬 페이지 변경과 테스트 서버 배포는 별개다.
2. 표본 진단→Orphanet 질병의 검증된 매핑이 없어 질병별 CRDC 진단 count 컬럼은 생략한다.
3. 단일 HPO gene endpoint는 기존 코드상 최대 20개 association을 반환한다. 화면은 그 반환 목록을 4개씩 나누며, total이 20을 넘는 release의 전체 행 연결은 추가 작업이다.
4. Compare phenotypes는 아직 구현하지 않았다. 9개 이상 HPO는 chip은 중립색이지만 segment는 유지하는 기존 동작이 남아 있다.
5. 기존 샘플별 민감 데이터는 private 입력과 API에서 읽으며 Git에 원본 샘플 행렬·metadata·gene-score 표를 넣지 않는다.

이전 커밋: Phenotype `179be6c4a`, Variant `71a157188`. 본 후속 변경 묶음의 범위는 위 Phenotype 구현·reference·검증·문서 파일이며 브랜치는 `kyuryung/bch-prototype`이다. Gene/Variant 화면 및 다른 작업의 변경은 이 묶음에 포함하지 않는다. 실제 커밋 식별자와 push 결과는 Obsidian 동기화본의 마지막 저장 기록과 Git history에서 확인한다.
