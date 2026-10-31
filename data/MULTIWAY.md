# 상대 2~5명 정확 정적 최강 패 확률표

내 점수가 두 상대 점수 이상인 확률입니다. 공동 1등을 포함하며 단독 승리, 공동 1등 동률을 별도 정수 카운트로 저장합니다. 팟 지분이나 몬테카를로 추정이 아닙니다. 모든 상대 홀카드 및 공개되지 않은 보드를 균등하게 가정하며 실제 게임에서 비공개로 알고 있는 상대 카드를 사용하지 않습니다.

| 스트리트 | 저장 상태 | 분모 |
|---|---:|---:|
| 리버 | 145,350,179 | 893,970 |
| 턴 | 13,960,050 | 41,122,620 |
| 플롭 | 1,286,792 | 966,381,570 |
| 프리플롭 | 169 | 1,894,107,877,200 |

리버는 무늬 정규화 보드 134,459개 × 보드별 홀카드 1,081개를 저장합니다. 홀카드의 보드 대칭에 따른 중복 일부는 밀집 인덱싱을 위해 유지합니다.

## 정확한 계산

리버의 미지 카드 45장을 정점, 내 패 이하인 상대 홀카드를 간선으로 하는 그래프를 만듭니다. `m`은 간선 수, `d(v)`는 차수입니다. 두 상대의 카드를 중복 없이 배정하는 경우의 수는 `2 × (C(m,2) − Σ C(d(v),2))`입니다. 모든 간선 쌍에서 카드를 공유하는 쌍을 빼고 상대의 순서를 배정합니다. 내 패보다 엄격히 약한 간선으로 같은 계산을 하면 단독 승리 수가 되고, 두 값의 차이가 공동 1등 동률 수입니다.

네 장 보드에서는 가능한 리버 46개를 합합니다. 플롭에서는 턴 합계 47개를 합한 뒤 순서 중복 2로 나눕니다. 프리플롭에서는 플롭 19,600개를 합하고 최종 보드의 플롭 선택 중복 10으로 나눕니다. 모든 나눗셈의 정수성을 생성기에서 검사합니다. 상대들의 카드 충돌은 이미 리버 count에 반영되어 있습니다.

## 파일·압축·조회

- `river-two-v1`: 1,051개 gzip chunk. 원본 `R2W1`, 시작 보드 u32, 보드 수 u32, 상태별 wins 20bit + ties 20bit (little endian 5바이트). 보드별 5,405바이트. 기존 `river-hu-v1/keys.bin` 인덱스를 공유합니다.
- `turn-two-v1`, `flop-two-v1`: 각각 169개 gzip shard. 원본 `RT21` / `RF21`, 행 수 u32, `(boardKey,wins,ties)` u32 세 개로 구성한 정렬된 12바이트 행입니다.
- `preflop-two-counts.json` 및 앱 모듈 `preflop-two-counts.js`: 169개 정확한 정수 numerator/denominator입니다. JSON의 추가 9개 값은 상대 수와 무관한 기존 족보 분포이며 모듈에는 세 값만 싣습니다.
- gzip 합계: 리버 72,133,695바이트, 턴 84,801,667바이트, 플롭 11,640,091바이트. 반올림/양자화 없이 정수 카운트를 손실 없이 압축합니다.
- 앱은 현재 상태의 shard만 읽고, 압축·해제 데이터 양쪽 SHA-256과 크기를 검증합니다. 메모리에는 최근 세 shard만 유지하고 서비스워커의 `/data/` 캐시에 넣지 않습니다.
- 브라우저의 `DecompressionStream('gzip')`를 사용합니다. Safari 16.4부터 지원됩니다 ([WebKit 공식 안내](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/)). 지원되지 않거나 파일 오류가 발생하면 추정값을 표시하지 않고 안내합니다. 기존 상대 1명 표에는 이 압축 API가 필요하지 않습니다.

## 재현

저장소 루트에서 실행합니다. 임시 원본 경로는 필요하면 해당 생성기에서 조정합니다. 출력은 chunk/shard 단위 임시 파일의 원자적 rename으로 체크포인트를 보존합니다. 사용한도와 기존 프로세스를 확인하고 같은 생성기를 동시에 실행하지 않습니다.

```sh
c++ -O3 -std=c++17 scripts/generate-river-two.cpp -o /private/tmp/generate-river-two
/private/tmp/generate-river-two
python3 scripts/pack-river-two.py
c++ -O3 -std=c++17 scripts/derive-two.cpp -o /private/tmp/derive-two
/private/tmp/derive-two
python3 scripts/pack-two-streets.py
node scripts/verify-river-two.mjs
node scripts/verify-two-streets.mjs
npm test
```

원본 생성기와 evaluator는 자체 구현입니다. Manifest에는 생성기 SHA-256, 부모 데이터 해시, 압축/원본 파일의 해시·크기가 있습니다. 현재 호스트에서 리버 전체 생성은 약 19초, 상위 스트리트 합산은 약 35초였으며 다른 환경의 실행 시간을 보장하지 않습니다.

## 독립 검증

- `river-two-verification.json`: 모든 145,350,179개 count의 경계와 짝수성, 전체 해시를 확인했습니다. 1,051개 chunk 각각에서 독립 JS evaluator와 ordered-disjoint-hand 직접 열거를 비교했습니다 (총 939,562,470개 상대 배정).
- `two-street-verification.json`: 전체 턴/플롭 파일의 키 정렬·count 경계·해시를 확인했습니다. 모든 169개 hero shard에서 턴 1개와 플롭 3개를 독립 JS로 재계산했습니다. 그중 플롭 1개는 1,081개 runout × 893,970개 상대 배정, 총 966,381,570개 경우를 직접 열거했습니다. 프리플롭 169개 분모·경계·헤즈업 이하 확률을 정수 곱셈으로 검사했습니다.
- 일반 테스트는 생성된 모든 파일의 해시를 검증 보고서에 결합하고 로열 보드의 100% 공동 1등, 쿼드 A 키커의 카드 충돌, 대칭, 재시도·중복 요청·해시 오류·캐시 상한·폴드 후 지연 응답을 검사합니다.

상대 6명은 아직 제공하지 않습니다. 상대 2명 식을 임의로 거듭제곱하지 않으며, 다음 단계는 더 큰 matching 개수의 정확한 알고리즘을 검증한 뒤 진행합니다.


## 상대 3명 확장

| 스트리트 | 저장 상태 | 분모 |
|---|---:|---:|
| 리버 | 145,350,179 | 733,055,400 |
| 턴 | 13,960,050 | 33,720,548,400 |
| 플롭 | 1,286,792 | 792,432,887,400 |
| 프리플롭 | 169 | 1,553,168,459,304,000 |

카드 그래프의 크기 3 matching은 line graph의 독립 정점 3개와 같습니다. 따라서 순서 없는 count는 `C(m,3) − (m−2)Σ C(d(v),2) + Σ_(uv∈E) C(d(u)+d(v)−2,2) − Σ C(d(v),3) − triangles(G)`입니다. 상대 순서를 배정하려면 3!을 곱합니다. Strict/non-strict 두 그래프를 세어 단독 승리와 공동 1등을 분리합니다.

생성기는 47정점 score-threshold 그래프의 차수, 이웃 차수 합, 간선 양 끝 차수 곱의 합, 공통 이웃 수, 삼각형 수를 간선 삽입마다 갱신합니다. Hero 두 정점을 삭제한 모멘트를 O(47)로 구하므로 전체 그래프를 매번 재열거하지 않습니다. 식과 구현은 `scripts/matching-three.hpp`, 독립 JS 재계산은 `scripts/three-opponent-matching.mjs`에 있습니다.

- `river-three-v1`: `R3W1`, 시작 보드/보드 수 u32, 상태별 wins/ties u32 두 개, 보드별 8,648바이트. gzip 98,958,750바이트.
- `turn-three-v1` / `flop-three-v1`: `RT31` / `RF31`, 행 수 u32, key u32 + wins/ties u64의 20바이트 행. gzip 각각 113,517,552 / 15,996,399바이트.
- `preflop-three-counts.json` 및 JS 모듈: 정확한 정수 카운트이며 현재 분모까지 JavaScript 안전 정수 범위입니다. 다음 인원 단계에서는 이를 가정하지 않아야 합니다.
- `multiway-probabilities.js`: 상대 2/3명이 공유하는 압축·해시·분할 조회 코드입니다. API·무음/애니메이션·카드 보기 디자인은 기존 흐름을 유지합니다.

원본 전체 리버 생성은 현재 호스트에서 약 47초, 턴/플롭/프리플롭 합산은 약 35초였습니다. 생성/압축은 기존 명령의 `two`를 `three`로 바꿔 실행합니다. 생성기에는 `matching-three.hpp`가 필요하며 manifest에 해당 헤더 SHA-256도 기록합니다. 작은 그래프의 native 누적 갱신 검증은 `node scripts/verify-three-graph.mjs <compiled-generator>`로 재현합니다.

검증 보고서:

- `three-graph-verification.json`: 1,708개 그래프/삽입 prefix에서 native 누적 모멘트가 독립 JS 전체 재계산과 일치. 작은 그래프는 직접 matching 열거와도 비교.
- `river-three-verification.json`: 전체 count 경계·6의 배수·해시 검사, chunk별 1,051개 상태를 독립 JS evaluator/전체 그래프 재계산과 비교. 그중 9개는 겹치지 않는 간선 세 개를 직접 열거해 확인 (상태당 ordered deal space 733,055,400).
- `three-street-verification.json`: 모든 턴/플롭 행 정렬·정수 경계·해시 검사. 턴 169개와 플롭 3개, 합계 11,017개 runout을 독립 JS로 재계산. 프리플롭 169개 분모·경계·상대 2명 이하 확률을 BigInt 곱셈으로 확인.

수치 표는 샘플링하지 않았습니다. 독립 재검산은 위 대표 상태 범위이며, 전체 생성기에는 모든 행의 정수성/경계 검사가 있습니다. 테스트는 모든 공개 데이터의 압축/원본 해시를 해당 보고서와 결합합니다.


## 상대 4명 확장

| 스트리트 | 저장 상태 | 분모 |
|---|---:|---:|
| 리버 | 145,350,179 | 543,194,051,400 |
| 턴 | 13,960,050 | 24,986,926,364,400 |
| 플롭 | 1,286,792 | 587,192,769,563,400 |
| 프리플롭 | 169 | 1,150,897,828,344,264,000 |

네 matching은 line graph의 independent 4-set입니다. 모든 4정점 이하 edge-subgraph를 포함배제로 세며, 삼각형·star·path·4-cycle·paw·diamond·clique를 정확히 보정합니다. `four-opponent-matching.mjs`의 독립 직접 열거 회귀와 `matching-four.hpp`의 누적 생성기가 기준입니다. 기존 `matching-three.hpp`를 수정하지 않고 확장해 이전 단계의 출처 해시를 보존했습니다.

- 리버 원본은 `R4W1` + 시작 보드/보드 수 u32 + 상태별 wins/ties u64 두 개 (보드당 17,296바이트)입니다. gzip 139,637,124바이트.
- 턴/플롭은 `RT41` / `RF41`, key u32 + wins/ties u64의 20바이트 행입니다. gzip 각각 126,622,814 / 18,095,902바이트.
- 프리플롭 JSON/JS의 세 count 필드는 십진 문자열입니다. 엔진은 BigInt로 읽고, `exact-probability.js`가 표시할 퍼센트를 정수 나눗셈으로 직접 반올림합니다. 따라서 JS 안전 정수를 넘는 값이나 반올림 경계에서도 원래 정수와 표시 정밀도를 보존합니다. 근사 float 필드는 일반 화면 계산용이며 실제 퍼센트 문자열과 경우의 수는 정확한 count에서 만듭니다.
- 현재 호스트 전체 리버 생성 약 126초, 상위 스트리트 합산 약 38초였습니다. 생성기는 이전 명령의 three를 four로 바꿔 재현합니다. N4 헤더와 부모 N3 헤더 해시를 모두 manifest에 보존합니다.
- `four-graph-verification.json`: 1,708개 native 그래프/prefix가 독립 모멘트 재구성과 일치했습니다. 별도 작은 그래프 직접 matching 회귀는 660개입니다.
- `river-four-verification.json`: 모든 count의 범위·24의 배수·해시 검사, 1,051개 상태의 독립 JS scoring/전체 그래프 재계산, 그중 적합 간선 100개 이하인 비영(非零) 9개 상태의 직접 matching 열거가 일치했습니다. 희소한 경우를 직접 열거한 것이며 모든 상태에서 5,431억 번의 개별 deal을 반복했다는 뜻은 아닙니다.
- `four-street-verification.json`: 모든 턴/플롭 행 경계·정렬·해시, 169개 턴과 3개 플롭의 11,017개 runout 재계산, 모든 프리플롭의 BigInt 경계와 상대 3명 이하 확률을 검사했습니다.

## 레거시 HU 전송 압축

기존 HU 원본과 manifest는 출처 검증·생성기 재현을 위해 Git에 그대로 보존합니다. `compress-legacy-headsup.py`가 원본 SHA를 검사하고 gzip 파일 및 `gzip-manifest.json`을 생성합니다. 1,389개 파일을 해제한 결과가 기존 검증본과 byte 단위로 같은지 테스트합니다. 압축 결과는 리버 64,108,468 / 턴 59,442,797 / 플롭 8,993,809바이트입니다.

Pages의 `copy-pages-data.py`는 이 HU 원본 1,389개 shard만 전송본에서 제외하며 index keys.bin은 유지합니다. 앱은 gzip manifest와 파일만 조회하고 압축 전후 무결성을 검사합니다. 원본 `.bin` HTTP 경로는 Pages 제공 범위가 아니며 저장소 재현용입니다. 모든 postflop 조회에 Safari 16.4+ 압축 API가 필요합니다. 정확 계산된 표의 상태/의미는 그대로 유지합니다.


## 상대 5명 확장

| 스트리트 | 상태 수 | 분모 |
|---|---:|---:|
| 리버 | 145,350,179 | 361,767,238,232,400 |
| 턴 | 13,960,050 | 16,641,292,958,690,400 |
| 플롭 | 1,286,792 | 391,070,384,529,224,400 |
| 프리플롭 | 169 | 766,497,953,677,279,824,000 |

Connected edge-support Möbius 전개와 vertex-partition Möbius 전개로 matching 1~6개의 계수를 연결 그래프 52개의 homomorphism에 대한 정확한 정수식(scale 5040)으로 바꿉니다. 전개·나눗셈은 모두 정수이며, 7개 이하 정점의 작은 support를 전수 생성합니다. 이 방법은 추정이나 샘플링이 아닙니다. tree/cycle/bicyclic/K4 식을 빠르게 평가하고, 누적 행렬 A²/A³/A diag(degree) A에서 Hero 삭제 결과를 복원합니다. 구조적으로 동일한 twin 정점을 삭제한 값은 그래프 동형이므로 재사용합니다. 출처/유도/검증은 MATCHING-5-6-PLAN.md와 scripts/matching-*입니다.

5/6명 리버는 동일한 중간 결과를 활용하여 공동 생성했습니다. 인원 단계의 완성·배포는 5명 다음 6명 순서로 진행합니다. 3개 native worker가 중복 없는 chunk를 담당하고 source fingerprint와 원자적 paired checkpoint를 보존합니다. 합산은 unsigned __int128, 모든 노출 count는 문자열/BigInt로 유지합니다.

- `river-five-v1`: R5W1 + 시작/보드 수 u32 + 상태별 wins/ties u64. 보드당 17,296바이트, gzip 154,156,517바이트.
- `turn-five-v1` / `flop-five-v1`: RT51/RF51 + 행 수 u32 + key u32,wins/ties u64의 20바이트 행. gzip 140,612,901 / 20,294,415바이트.
- `preflop-five-counts.json` / JS 모듈: 정확한 십진 문자열. 프리플롭을 포함한 모든 표시 반올림은 BigInt로 수행합니다.
- `derive-five-six.cpp 5`, `pack-many-tables.py 5`로 재현합니다. 원본 작업 경로와 generation fingerprint는 생성기 기본 경로를 참고합니다. 기존 chunk가 살아 있으면 중복 실행하지 않습니다.
- `five-verification.json`: 전체 압축/원본 byte를 해시로 결합합니다. 모든 count 범위·배수·키 정렬은 생성기/packer에서 전수 검사했습니다. 독립 JS scoring/그래프 재구성으로 리버 1,051개 상태, 턴 169개·플롭 3개의 11,017개 runout을 검산했습니다. 별도로 실제 카드의 18개/15개 active vertex를 직접 subset-DP로 세어 matching 5/6개와 table count를 비교했습니다. 모든 프리플롭의 BigInt 경계 및 상대 4명 이하 확률도 검사합니다.

## 동일 공개 저장소의 고정 커밋 전달

GitHub Pages의 게시 크기는 1GB 제한입니다 ([공식 문서](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)). 따라서 큰 5명 표 315,063,833바이트는 이미 게시한 동일 공개 저장소의 검증된 데이터 커밋 `5a28a4ba726dfeb4d598cbf7be3e94b405d57e21`에서 직접 조회합니다. 앱과 작은 preflop 모듈은 Pages에 게시하며, `table-source.js`가 해당 커밋의 raw.githubusercontent.com 경로를 고정합니다. branch/main 최신 값을 사용하지 않습니다 ([커밋 고정 안내](https://docs.github.com/en/repositories/working-with-files/using-files/getting-permanent-links-to-files)).

실제 고정 커밋 응답에서 CORS `*`, cross-origin resource policy, HTTP 200을 확인했습니다. 새 서비스/유료 저장소/추가 인증 권한을 만들지 않습니다. 기존 압축 전후 SHA 검증, 실패 재시도 및 3-shard 메모리 상한을 그대로 사용합니다. raw 전달 실패나 브라우저 미지원 시 추정값을 표시하지 않습니다. 모든 데이터 원본은 저장소와 재현 가능한 생성기로 검토할 수 있습니다.


## 상대 6명 (총 7명)

`river-six-v1` 145,350,179행, `turn-six-v1` 13,960,050행, `flop-six-v1` 1,286,792행, 프리플롭 169개 정규 클래스입니다. 리버는 R6W1/u64 쌍, 턴은 RT61/u32 키+u64 쌍, 플롭은 RF61/u32 키+u128 쌍입니다. 프리플롭은 10진 문자열을 BigInt로 읽습니다. 분모는 각각 215251506748278000, 9901569310420788000, 232686878794888518000, 456066282437981495280000입니다. 공동 1등은 wins+ties이며 동률 지분을 나눈 equity가 아닙니다.

전체 바이트/해시는 `six-verification.json`과 각 manifest에 고정되어 있습니다. 독립 리버 1,051 상태와 실제 카드 subset-DP 사례, 턴 169개/플롭 3개 상태의 11,017 runout, 프리플롭 169개 합산 및 상위 인원 단조성을 검증했습니다. 모든 행의 범위·정렬·정수 나눗셈 검사는 생성/압축 시 수행합니다. 독립 검증을 모든 상태에 다시 실행한 것으로 주장하지 않습니다. 생성 재개 및 수학적 모델은 상대 5명과 같은 `generate-river-five-six.cpp`, `derive-five-six.cpp`, `pack-many-tables.py`, `verify-many-tables.mjs`를 사용합니다.

상대 6명의 bulk 표도 상대 5명과 동일하게 이 공개 저장소의 고정 데이터 커밋 `484429223d26de7bf168207d0880123476ae49cb`에서 가져옵니다. Pages에는 작은 프리플롭·검증 파일과 앱을 유지하며 기존 상대 1–4명 표 제공 범위를 줄이지 않습니다. 총 7명까지 커스텀 인원 선택기와 저장된 핸드 복기를 지원합니다.
