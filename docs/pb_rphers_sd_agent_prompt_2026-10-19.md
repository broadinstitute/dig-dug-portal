# BCH prototype 점수·효과 표시 변경 — 재분석 없는 최종 작업 프롬프트

작성일: 2026-10-19

아래 확정된 구분에 따라 Gene·Variant·Phenotype 페이지의 표시와 관련 API·CSV를 수정해줘. **기존 분석 결과를 재척도화하는 작업이며, 과거 전체 분석을 재실행하거나 새로운 분석으로 대체하지 않는다.**

| 분석 | 사용할 기존 값 | 최종 표시값 | 표시 단위 |
|---|---|---|---|
| 사전 계산 binary single-HPO gene burden | 기존 logistic 근사 β | `0.1 × β_raw` | 0.1 GRS당 log-odds |
| HPO Context Gene 선형회귀 | 기존 rPheRS 선형회귀 β | `0.1 × β_raw / s` | 0.1 GRS당 rPheRS SD |
| HPO Context Variant 선형회귀 | 기존 rPheRS 선형회귀 β | `β_raw / s` | carrier 0→1에 대한 rPheRS SD |

여기서 `s`는 해당 Context의 **기존 scoring cohort 전체 유효 residual PheRS의 표본 SD**다. Single-HPO에는 이 SD를 적용하지 않는다. 위 β_raw는 원래 predictor 1단위당 계수이며, 이미 0.1단위로 변환된 표시값에 다시 0.1을 곱하지 않는다.

작업 저장소:

`/Users/kyuryung/Documents/github_dir/dig-dug-portal-bch-prototype`

## 1. 작업 원칙

- 최신 코드와 적용되는 AGENTS.md를 확인하고 기존 작업자의 변경사항을 보존한다.
- 셸 스크립트에 `set -euo pipefail`을 사용하지 않는다. 필요한 실패 처리는 명시적으로 작성한다.
- 기존 scoring cohort, 실제 회귀 roster, HPO 가중치, residual PheRS 계산법, 공변량, 모델, GRS Max/Sum, Variant carrier 0/1 predictor를 유지한다.
- 15,764명과 15,761명을 통일하기 위한 점수 재계산이나 roster 변경을 하지 않는다. Sample 목록·carrier 수·코호트 분모도 이 작업 때문에 바꾸지 않는다.
- Affected-only의 기존 회귀 대상 선택 방식을 유지한다.
- **보름 걸렸던 single-HPO gene burden 분석, 전체 HPO 배치, 새 선형회귀 대체 분석, 계산시간 벤치마크를 실행하지 않는다.**
- 기존 β·SE·p·q·N과 raw 점수는 보존한다. 표시용 변환 필드를 별도로 추가한다.
- 신규 Context 입력에 따른 기존 서비스 계산은 유지한다. 표시 단위를 바꾸기 위한 추가 회귀나 과거 결과의 일괄 재적합은 하지 않는다.
- 이 문서는 사용자가 확정한 구현 명세다. 세부 구현 선택을 Jason의 미팅 발언으로 소급해 설명하지 않는다.

## 2. 먼저 분석 출처를 구분한다

화면의 “상단”이라는 위치 대신 **single-HPO 사전 계산 결과인지, HPO Context 결과인지**를 기준으로 연결 경로를 확인한다. Context에 HPO 하나를 입력하는 경우도 사전 계산 binary single-HPO 분석과는 별개다.

Single-HPO release 서버 경로:

`/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/single_gene_burden_with_HPO/gene_hpo_release_20260905`

해당 browser projection은 `browser_gene_hpo.jsonl.gz`이며 결과변수는 `hpo_binary`, 생성 모델은 `binomial(link="logit")`이다. 기존 `beta_gene_score_sum_approx`와 `se_gene_score_sum_approx`를 우선 사용한다. 실제 release에서 원래 predictor 단위와 필드 연결을 확인한다. 서버 파일을 직접 확인하지 않았다면 확인했다고 보고하지 않는다.

Context에서는 기존 residual PheRS, gene/variant β·SE, scoring cohort, 분석 roster, 데이터 버전의 연결을 확인한다. 파일명에 포함된 인원수만으로 실제 N을 단정하지 않는다.

## 3. Single-HPO: 기존 β를 0.1 GRS당으로 표시한다

기존 binary/logit 분석의 원래 1 GRS당 계수로 다음을 계산한다.

```text
single_hpo_beta_per_0_1_grs = 0.1 × beta_raw
single_hpo_se_per_0_1_grs   = 0.1 × se_raw
```

- 화면 제목: **β per 0.1 GRS (log-odds)**
- 도움말: “기존 binary HPO burden 분석에서 GRS가 0.1 증가할 때 HPO 보유의 log-odds가 얼마나 변하는지 나타내는 근사 계수입니다.”
- 기존 OR 주 표시를 위 β 표시로 교체한다. OR를 그대로 주 표시값으로 남기거나, OR 숫자의 제목만 β로 바꾸지 않는다.
- 저장된 β를 사용한다. 이미 β가 있는데 화면의 OR를 다시 로그 변환해서 계수를 복원하지 않는다.
- 이 β에는 residual PheRS 평균이나 SD를 적용하지 않는다. `SD 효과`, `rPheRS 변화량`, `Z-score`로 설명하지 않는다.
- Score-test 근사 β라는 성격을 도움말·metadata에 유지한다. 이를 새로 적합한 정확한 logistic 회귀계수로 설명하지 않는다.
- 기존 p-value, q-value, 분석 N, 검정 방법, 결과 선택 기준을 유지한다. β/SE로 Wald p-value를 새로 계산하지 않는다.
- 신뢰구간을 표시하는 경우, 기존 계수 신뢰구간에 0.1을 곱한다. 기존 OR 신뢰구간만 있다면 원래 증가량을 확인하고 양의 유한한 경계값에 로그 변환 및 증가량 변환을 적용한다. 이미 0.1 GRS당인 OR 구간을 중복 변환하지 않는다. 대응 관계를 확인할 수 없다면 해당 CI를 `Unavailable`로 처리한다.
- 기존 raw OR·CI 필드는 호환성을 위해 보존할 수 있으나 β 표시와 혼동하지 않도록 별도 필드로 유지한다.
- Gene와 Phenotype에서 같은 release의 같은 gene–HPO 결과를 표시하면 동일한 β 표시값과 해당 분석의 p/q/N을 사용한다.

## 4. Context의 표준화 기준과 개인 점수

기존 점수를 생성한 scoring cohort의 전체 유효 residual PheRS에서 다음을 계산한다.

```text
μ = 기존 residual PheRS 평균
s = 기존 residual PheRS 표본 SD (ddof=1)

개인 rPheRS Z-score = (r_i - μ) / s
평균 rPheRS Z-score = (기존 집단 평균 rPheRS - μ) / s
```

평균 변환은 같은 대상과 결측 처리 조건에서 적용하며, 해당 개인 Z-score들의 평균과 같아야 한다.

- `s`는 환자들의 residual PheRS SD다. β의 SE, 여러 gene β의 SD, 다른 회귀모형의 오차 SD를 사용하지 않는다.
- 기존 전체 점수 벡터에서 μ와 s를 구한다. 표준화를 이유로 HPO 가중치·residualization·점수 생성 집단을 변경하거나 회귀를 다시 실행하지 않는다.
- Context가 달라지면 그 Context의 기존 점수에서 기준을 구한다. 같은 Context·데이터·scoring cohort이면 기준을 재사용한다.
- Carrier, HPO 일치 환자, 현재 화면 행만으로 기준을 계산하지 않는다. 필터·페이지네이션·carrier 선택·Affected-only로 기준을 바꾸지 않는다.
- 서로 다른 기존 cohort를 통합하지 않는다. 기준이 다르면 metadata로 차이를 명시한다.
- 개인 점수와 평균에는 0.1을 곱하지 않는다.
- 기존 결측·coverage 규칙을 유지한다. 실제 개인 점수가 없는 칸은 `Unavailable`을 유지하며 집단 평균이나 β로 개인 점수를 추정하지 않는다.
- 전체 기준 점수를 확보할 수 없거나 SD=0 또는 유효 점수 부족이면 표준화 값은 `Unavailable`로 반환한다. 일부 sample만으로 SD를 추정하거나 raw 값을 Z-score로 표시하지 않는다.

## 5. Context 회귀 효과

### 5.1 Gene: 0.1 GRS당 SD 효과

```text
context_gene_beta_sd_per_0_1_grs = 0.1 × beta_raw / s
context_gene_se_sd_per_0_1_grs   = 0.1 × se_raw / s
```

- 화면 제목: **Effect per 0.1 GRS (SD)**
- 도움말: “공변량 보정 후 gene burden score가 0.1 증가할 때 residual PheRS가 기준 집단 SD 단위로 얼마나 변하는지 나타냅니다.”
- 화면과 CSV의 주 표시값은 반드시 **0.1 GRS당**으로 한다.
- GRS 입력값이나 모델을 변경하지 않는다. 기존 결과를 변환한다.
- 기존 slope 신뢰구간에는 양 끝에 `0.1 / s`를 곱한다.

### 5.2 Variant: carrier 0→1의 SD 효과

```text
context_variant_beta_sd = beta_raw / s
context_variant_se_sd   = se_raw / s
```

- 화면 제목: **Variant effect β (SD)**
- 도움말: “공변량 보정 후 variant 비보유자(0)와 보유자(1) 사이의 residual PheRS 차이를 기준 집단 SD 단위로 나타냅니다.”
- Variant 효과에는 0.1을 곱하지 않는다.
- 기존 slope 신뢰구간의 양 끝을 s로 나눈다.

### 5.3 공통 규칙

- 회귀 slope β에서는 μ를 빼지 않는다. β를 SE로 나누지 않는다.
- GRS predictor 자체를 Z-score로 바꾸지 않는다.
- 이미 변환된 값은 중복 변환하지 않는다.
- 기존 Context의 p/q를 그대로 유지한다. Single-HPO의 p/q와 섞지 않는다.
- Carrier 평균 Z-score와 공변량 보정 β는 다른 통계량이다. 회귀 효과를 개인 Z-score라고 부르지 않는다.

## 6. 화면·정렬·CSV 적용 범위

| 페이지·영역 | 표시 |
|---|---|
| Gene의 사전 계산 single-HPO association | β per 0.1 GRS (log-odds) |
| Gene의 HPO Context gene 효과 | Effect per 0.1 GRS (SD) |
| Gene의 Context variant Match Score | Mean rPheRS Z-score |
| Gene의 Context variant Effect Score | Variant effect β (SD) |
| Variant의 Context exact-variant 효과 | Variant effect β (SD) |
| Variant의 Context 다른 gene 효과 | Effect per 0.1 GRS (SD) |
| Phenotype의 사전 계산 single-HPO gene 결과 | β per 0.1 GRS (log-odds) |
| Phenotype의 live Context gene 효과 | Effect per 0.1 GRS (SD) |
| 실제 개인 residual PheRS가 제공되는 영역 | rPheRS Z-score |
| 기존 carrier·선택 carrier·co-variant·cohort 평균 rPheRS 영역 | Mean rPheRS Z-score |

개인 점수 도움말에는 “기준 집단 평균에서 몇 SD 떨어져 있는지”, 평균에는 “해당 집단의 개인 Z-score 평균”이라고 설명한다. 각 평균의 기존 대상 범위를 유지한다.

관련 제목·요약·도움말·효과값 정렬·CSV를 함께 맞춘다. Single-HPO 열에는 `log_odds_per_0_1_grs`, Context Gene 열에는 `sd_per_0_1_grs`, Variant 열에는 `sd`와 carrier 대비가 드러나게 한다. 기존 유의성 필터·p/q 정렬·결과 선택 범위를 임의로 바꾸지 않는다.

LoFTEE/AlphaMissense Variant Score, GRS 자체, Mean carrier GRS, disease Profile score는 이 작업으로 변경하지 않는다. 레이아웃 개편이나 추가 분석 기능을 넣지 않는다.

## 7. API·캐시·metadata

- 기존 raw 필드의 의미를 유지하고 위 식에 대응하는 표시용 필드를 추가한다.
- `oddsRatio` 필드에 β를 넣지 않는다. Single-HPO log-odds β와 Context SD β를 동일한 무단위 필드로 혼용하지 않는다.
- Single-HPO에는 release·모델·결과변수·predictor·증가량 0.1·log-odds 단위·근사 계수 여부·실제 분석 N을 명시한다.
- Context에는 기준 μ·s·유효 점수 N·scoring cohort 식별자·실제 분석 N·Context HPO·데이터/표준화 버전·predictor·증가량·GRS Max/Sum을 구분한다.
- Scoring N, 분석 N, carrier 수, 화면 sample 수를 하나의 N으로 덮어쓰지 않는다.
- 서로 다른 기준의 metadata가 섞인 응답은 표준화 값을 표시하지 않는다.
- 캐시 버전을 구분하되 유효한 기존 raw 결과를 재사용한다. 캐시 변경 때문에 과거 분석을 일괄 재실행하지 않는다.
- 결측·SD=0·기준 누락·불완전 coverage 상태를 명시한다. 개인 ID를 표준화 metadata에 불필요하게 노출하지 않는다.

## 8. 작업 순서와 검증

1. 기존 데이터/API/화면 연결을 single-HPO와 Context로 구분하고, 원래 β·SE·predictor 단위를 확인한다.
2. Single-HPO 저장 β·SE의 0.1배 표시를 연결한다.
3. Context의 기존 점수에서 μ·s를 확보하고 개인/평균 Z-score와 기존 β·SE 표시 변환을 추가한다.
4. 화면·정렬·CSV·도움말·캐시를 일관되게 수정한다.
5. 작은 사례로 아래 항목을 검증하고 엔지니어 문서를 갱신한다. 과거 전체 분석을 재실행하지 않는다.

검증 항목:

- Single-HPO β·SE 표시값이 기존 원계수의 정확히 0.1배이며 rPheRS SD를 사용하지 않는지.
- Context Gene은 `0.1 / s`, Variant는 `1 / s`로 변환되는지.
- 개인/평균 Z-score에 0.1을 곱하지 않는지.
- 기준 집단 전체 Z-score 평균≈0, 표본 SD≈1인지. Carrier나 Affected-only 부분집단에는 이 조건을 요구하지 않는다.
- 작은 합성 데이터에서 Z-score를 Y로 직접 적합한 선형회귀 slope·SE가 raw 계수·SE를 s로 나눈 값과 일치하는지. 이는 검증용이며 실제 분석 재실행이 아니다.
- 기존 raw 점수·모델·cohort·β·SE·p·q·N이 보존되는지. Single-HPO score-test p/q를 새 Wald p/q로 바꾸지 않았는지.
- Carrier 평균 Z-score와 해당 개인 Z-score 평균이 일치하는지.
- 같은 Context·scoring 기준을 공유하는 경로의 metadata와 동일 환자 점수가 일치하고, 필터로 μ·s가 바뀌지 않는지.
- 결측·coverage·SD=0·CI 변환·중복 0.1 변환을 올바르게 처리하는지.
- 화면·CSV·정렬 값과 단위가 일치하고, 다른 분석의 β·p·q·CI·N이 혼합되지 않는지.

페이지 간 β/p는 모델과 대상이 같을 때 비교한다. q는 다중검정 범위까지 같을 때만 일치를 요구한다.

설명용 예시:

```text
Context 기준 μ = 2, s = 4

개인 rPheRS = 10 → (10 - 2) / 4 = 2
Carrier 평균 rPheRS = 6 → (6 - 2) / 4 = 1

Single-HPO raw β = 8, SE = 2
  → 0.1 GRS당 β = 0.8, SE = 0.2 (log-odds; s와 무관)

Context Gene raw β = 8, SE = 2
  → 0.1 GRS당 β = 0.2, SE = 0.05 (rPheRS SD)

Context Variant raw β = 8, SE = 2
  → carrier 0→1 β = 2, SE = 0.5 (rPheRS SD)
```

완료 보고에는 변경 파일, 세 분석별 실제 표시식과 단위, 적용 화면, 표준화 기준, 검증 결과와 남은 제한을 정리한다. **Single-HPO는 기존 β의 0.1배, Context Gene은 기존 β의 0.1/s배, Context Variant는 기존 β의 1/s배이며, 과거 분석 재실행 없이 구현했는지** 명확히 보고한다.
