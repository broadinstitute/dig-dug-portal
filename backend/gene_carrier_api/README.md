# CRDC Gene carrier 집계 API — 백엔드 전달 파일

이 폴더를 BioIndex 백엔드 저장소에 복사해서 연결할 수 있습니다. 사용자가
백엔드 저장소 접근 권한을 가지고 있을 필요는 없습니다. 담당자는 아래의 원본
데이터 적재, 라우터 등록, 기존 권한 검사 연결을 수행하면 됩니다.

## 동작

배포 전에 `samples-info`와 `gene-variants-crdc`의 동일한 운영 원본을 SQLite에
적재하고 gene별 기본 집계를 계산합니다. 사용자 요청 중에는 BioIndex 개별
sample 조회를 수행하지 않습니다. 같은 cohort에 접근 가능한 사용자는 같은
서버 파일을 공유합니다. 사용자별 cohort 범위가 다르면 준비 파일과 라우터도
그 범위에 맞춰 나눕니다.

- 기본 화면: 저장된 gene summary를 읽습니다.
- 변이 필터: 선택된 variant의 carrier 합집합에서 한 사람을 한 번만 세고,
  서버에 있는 metadata로 demographics를 집계합니다.
- Locus 필터: 동일한 metadata로 age/sex/project/investigator 등을 적용합니다.
- 원본 갱신: 새 파일의 적재·집계·검증이 완료되면 원자적으로 교체합니다.
  실패하면 기존 파일을 유지하고, 실행 중인 worker도 다음 요청부터 새 파일을
  읽습니다. 방문자의 첫 요청으로 적재 작업을 시작하지 않습니다.

핵심 코드는 Python 3.9 이상 표준 라이브러리만 사용합니다. `fastapi_router.py`는
기존 FastAPI 서버에 연결하는 선택 모듈입니다. 기존 Node 개발 서버 코드를
바꾸거나 운영 서버를 재시작한 패키지는 아닙니다.

## 파일

| 파일 | 역할 |
|---|---|
| `core.py` | 원본 정규화, SQLite 구축, 집계, API 처리 |
| `fastapi_router.py` | 기존 FastAPI 앱에 등록할 라우터 |
| `__main__.py` | 데이터 구축 명령과 localhost HTTP 미리보기 |
| `test_core.py` | 집계·중복 제거·갱신 검증 |
| `test_fastapi.py` | HTTP 계약·권한·동시 요청 검증 |
| `provenance.example.json` | 실제 source/build 값을 채울 출처 양식 |

## 1. 데이터 준비

압축하지 않은 JSONL 또는 `.jsonl.gz`를 사용합니다. 한 줄에 하나의 원본
record를 넣습니다. HTTP 응답의 `{"data":[...]}` wrapper를 넣는 형식은 아닙니다.
전체 gene을 서비스하려면 전체 gene의 variant export를 제공해야 합니다.

`samples-info`에는 정확한 `SampleInVCF` 키가 있어야 합니다. 예를 들어
`_E38`과 `_G38`은 다른 키입니다. `sample_id`만으로 추측해서 합치지 않습니다.
지원하는 metadata 필드는 기존 Gene page 집계와 같습니다:
`age_at_enrollment`, `gender`/`sex`, `clean_name`/`Project`, `investigator`,
`initial_study_affected`, `family_relationship`, `genes`, `phenotypes`.

`gene-variants-crdc`에는 gene symbol (`gene`, `gene_symbol` 또는 `SYMBOL`),
variant 좌표 (`chromosome`, `position`, `reference`, `alt` 또는 대응하는 VCF
대문자 필드), 정확한 VCF sample ID의 `samples` 배열이 필요합니다. transcript
중복 row와 중복 carrier ID는 적재 과정에서 제거됩니다.

출처 양식을 복사한 후 각 index의 실제 source URI/S3 경로와 `built` timestamp를
채웁니다. 선택적으로 다운로드 날짜 등 추가 필드를 넣어도 유지됩니다. annotation의
release 번호를 metadata index의 build timestamp 대신 넣지는 않습니다.

```sh
cp gene_carrier_api/provenance.example.json provenance.json
```

## 2. 배포 전에 구축

아래 명령은 `gene_carrier_api` 폴더의 상위 디렉터리에서 실행합니다. 출력 파일은
웹 static 디렉터리 밖의 서버 데이터 경로에 둡니다. 적재 작업과 API가 같은
서비스 계정으로 파일을 읽을 수 있도록 배치합니다.

```sh
python3 -m gene_carrier_api build \
  --metadata /data/samples-info.jsonl.gz \
  --variants /data/gene-variants-crdc.jsonl.gz \
  --provenance /data/provenance.json \
  --output /data/prepared/carriers.sqlite
```

기본적으로 metadata가 없는 carrier, 서로 충돌하는 metadata row, 잘못된 키,
빈 gene export가 있으면 구축을 실패시켜 기존 배포 파일을 보존합니다.
실제 원본에 metadata가 없는 것이 확인된 경우에만 `--allow-missing-metadata`로
부분 coverage를 허용할 수 있습니다. 전체 carrier 수와 metadata가 매칭된 수는
별도로 반환하므로 missing을 생물학적 0으로 처리하지 않습니다.

manifest에는 원본 출처, build 값, 입력 파일 SHA-256, metadata/gene 수와
missing coverage가 기록됩니다. 원본 index를 갱신하는 배포 작업에 이 구축
명령을 연결합니다. 공유 데이터는 브라우저나 로그인 세션마다 새로 만들지 않습니다.

## 3. 기존 FastAPI 앱에 연결

```python
from gene_carrier_api.fastapi_router import create_router

def authorize_carrier_request(request, gene):
    # 담당자가 기존 BioIndex의 인증 및 해당 cohort 접근 검사를 연결합니다.
    # 동기 함수이며, 접근이 허용된 경우에만 명시적으로 True를 반환해야 합니다.
    return existing_carrier_access_check(request, gene)

app.include_router(create_router(
    "/data/prepared/carriers.sqlite",
    authorize_request=authorize_carrier_request,
))
```

`existing_carrier_access_check`는 통합 지점을 표시하는 이름입니다. 이 패키지가
새 로그인 정책을 정의하지 않습니다. callback을 생략하거나 미리보기의 허용
함수를 그대로 운영에 등록하는 방식으로 동작하지 않게 구성했습니다.

기존 BioIndex가 `/api/bio` prefix를 사용한다면 `include_router`에
`prefix="/api/bio"`를 추가할 수 있습니다. 포털의 아래 세 경로를 해당 backend
경로로 전달하고 기존 인증 정보를 유지합니다. Vue `devServer` 설정은 운영
빌드에서 실행되지 않으므로 운영 reverse proxy 또는 기존 API routing에
등록해야 합니다.

| 요청 | 결과 |
|---|---|
| `GET /__gene_carrier_summary__?gene=GJB2` | 미리 계산된 전체 gene summary |
| `GET /__gene_carrier_summary__?gene=GJB2&variant=chr...` | 특정 variant의 summary |
| `POST /__gene_carrier_demographics__` | 선택한 variant 집합의 demographics |
| `GET /__gene_locus_filter__?gene=GJB2&start=...&end=...` | locus와 demographic 필터 집계 |

POST body는 현재 Gene2와 동일합니다:

```json
{"gene":"GJB2","variant_ids":["chr13:20763686:G:A"]}
```

위 variant ID는 형식 설명용이며 실제 데이터 포함 여부를 의미하지 않습니다.
빈 배열은 carrier 0건을 반환하고, 해당 gene에 없는 variant는 400입니다.
없는 gene은 404, 접근 불가는 403, 준비 파일을 읽을 수 없으면 503입니다.
준비되지 않은 데이터를 요청 시점의 장시간 BioIndex 조회로 대체하지 않습니다.

응답은 현재 frontend의 `status`, `completed`, `total`, `carrierTotal`,
`matchedMetadataCount`, `geneCarrierDemographics` 계약을 유지합니다. 전체
summary에는 기존 phenotype/co-carrier gene 집계도 포함됩니다. 반환 payload에
개별 sample ID는 포함되지 않습니다. HPO 분석의 전체/affected 분석 모집단은
이 API가 변경하지 않습니다.

## 4. 테스트와 미리보기

```sh
python3 -m unittest gene_carrier_api.test_core
python3 -m unittest gene_carrier_api.test_fastapi.FastAPICarrierTests.test_http_routes_preserve_auth_headers_and_concurrent_selection

python3 -m gene_carrier_api preview \
  --database /data/prepared/carriers.sqlite \
  --port 8099
```

첫 테스트는 표준 라이브러리만 필요합니다. HTTP 테스트는 backend 환경의
FastAPI와 TestClient용 httpx를 사용합니다. `preview`는 localhost 전용이며,
운영 등록은 위의 기존 인증을 연결한 라우터를 사용합니다.

검증 내용: carrier 합집합, transcript 중복, 빈 선택, 다른 gene의 variant
거절, metadata coverage, age 경계, Investigator 연결, HPO/동일 carrier의
gene 중복, 권한 검사, 동시 선택 요청 간 독립성, 실패 시 기존 파일 유지,
기존 worker에서 새 데이터 읽기. 핵심 8개 + HTTP 1개 테스트가 통과했습니다.

2026-11-12 로컬 검증에서는 기존 BioIndex에서 확보한 정확한 GJB2 snapshot을
사용했습니다. 16,143명의 demographics, 19,151개 co-carrier gene 및 6,524개
phenotype 집계가 기존 결과와 일치했습니다. 서버 저장소 함수 기준 기본 집계
조회 0.021초, 모든 carrier를 포함한 변이 선택의 demographics 집계 0.075초,
준비 파일 구축 7.358초였습니다. 이 구축 시간은 이미 로컬에 확보된 입력부터
측정한 값이며 원본 다운로드 시간, 네트워크 왕복, 운영 성능을 뜻하지 않습니다.
전체 gene 원본 적재와 운영 배포는 별도 통합 작업입니다.

FastAPI 연결 방식 참고:
[APIRouter 등록](https://fastapi.tiangolo.com/tutorial/bigger-applications/),
[동기·비동기 경로 처리](https://fastapi.tiangolo.com/async/).

## 담당자에게 전달할 요청

> 이 `gene_carrier_api` 폴더를 BioIndex backend 저장소에 추가해 주세요.
> 운영 BioIndex를 만든 동일 원본의 samples-info와 gene-variants-crdc 전체
> export로 prepared SQLite를 배포 전에 구축하고, FastAPI router에 기존 cohort
> 권한 검사를 연결해 주세요. 포털의 summary/demographics/locus 세 경로를
> 이 API로 전달해 사용자 요청 중 개별 sample 조회가 발생하지 않도록 해 주세요.
> 원본 갱신 시 새 prepared 파일을 구축·검증한 뒤 교체하고, 원본과 gene별
> carrier/metadata coverage를 대조해 주세요. 폴더 복사 후 라우터 등록과 데이터
> 구축이 모두 완료돼야 운영 화면에 반영됩니다.
