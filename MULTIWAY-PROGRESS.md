# 정확한 다인전 최강 패 확률 지속 작업

## 승인된 목표

상대 1명 → 2명 → 3명 → 4명 → 5명 → 6명 순서로, 공동 1등을 포함하는 `P(내 패보다 강한 상대가 없음)`의 정확한 정적 확률표를 확장합니다. 각 인원 단계의 프리플롭·플롭·턴·리버 전체 표, 독립 검증, 앱 연동이 완료될 때마다 CI를 통과한 PR을 머지하고 GitHub Pages의 해당 커밋·공개 파일을 검증합니다. 샘플링·헤즈업 거듭제곱을 정확한 값으로 대체하지 않습니다.

사용자는 인원 단계별 머지·배포와 사용한도 리셋 후 재개를 승인했습니다. 비용 지출이나 한도/보호 설정 우회는 승인 범위에 없습니다. 마지막 상대 6명 단계에는 총 7명 테이블 UI도 필요합니다 (이번 단계에서 총 7명 UI로 확장).

## 단계 상태

| 상대 수 | 상태 | 내용 |
|---|---|---|
| 1 | 완료·배포 검증 | PR #20, merge `2b7b41495c10bb287a1c0d1c305f9a39bb057aec`, Pages run `41146072556` |
| 2 | 완료·배포 검증 | PR #22, merge `9f0e8dcebfd6ae704f0bb4a698c18e93365ddc5f`, Pages `41148159361` |
| 3 | 완료·배포 검증 | PR #23, merge `c97f5617cd0542e7dec9df2da9b7509c9f9702f2`, Pages `41150080074` |
| 4 | 완료·배포 검증 | PR #24, merge `7172978b6f843f2953ee642785f18989d593f632`, Pages `41152755319` |
| 5 | 완료·배포 검증 | PR #25, merge `c3e0d8441f600ef9f85ad51bd8f63ce44711280a`, Pages `41174379999`; 99 tests / 공개 20 상태 검증 |
| 6 | 완료·배포 검증 | PR #26, merge `2d86791079dc8c9b5c5ba3c33bdb1ac5a28f1399`, Pages `41175534762`; 104 tests / 공개 24 상태 검증 |

## 실행·한도·재개 규칙

- 같은 채팅의 goal과 시간당 heartbeat가 연속 작업/한도 후 재시도를 담당합니다. 매 실행 시작과 큰 계산 경계에서 실제 `get_usage_limits`를 확인합니다. 누락 수치는 0으로 해석하지 않습니다.
- 한도 소진 또는 `ordinaryUsageAllowed=false`이면 체크포인트를 먼저 저장하고 리셋 후 실행에서 재확인합니다. 긴 blocking sleep, 유료 크레딧/API 우회, 전역 권한 확대를 사용하지 않습니다.
- Git·PR·배포 상태와 진행 중인 계산 프로세스를 먼저 읽어 중복 실행을 피합니다. 생성기는 shard 단위 임시 파일→원자적 rename 및 해시로 재개 가능하게 만듭니다.
- 변경 없는 한도 대기는 조용히 유지하고, 단계 완료/배포 완료/의미 있는 실패/사용자 조치 필요 시 알립니다.
- 기존 상대 1명 표와 사용자 UI를 보존합니다. 새 단계의 부분 계산을 완료한 것처럼 표시하거나 조기에 배포하지 않습니다.
- 기존 데이터만 약 520MB이므로, 추가 단계 배포 전에 Pages 전체 크기와 파일별 다운로드 비용을 검증합니다. 손실 없는 압축/분할 및 브라우저 지원을 먼저 벤치마크하며 별도 비용·서비스 도입을 자동으로 가정하지 않습니다.

## 상대 2명 수학적 기준

리버에서 알려진 7장을 제외한 45개 카드를 꼭짓점으로, 가능한 상대 홀카드 990개를 간선으로 봅니다. 내 패 이하인 간선들의 수를 `m`, 꼭짓점 차수를 `d(v)`라 하면, 두 상대가 겹치지 않는 홀카드를 가지며 내 패보다 강하지 않은 경우는 정확히:

`2 × (C(m,2) − Σ_v C(d(v),2))`

분모는 `C(45,2) × C(43,2) = 893,970`입니다. 내 패보다 **엄격히 약한** 간선 그래프에도 같은 식을 적용하면 단독 승리 수를 얻고, 두 numerator의 차이가 공동 1등 동률 수입니다. 두 상대의 카드 충돌을 제외하므로 단순 헤즈업 확률의 제곱과 다릅니다.

`scripts/two-opponent-reference.mjs`는 오프라인 검증용 oracle이며 앱에서 불러오지 않습니다. `tests/multiway-reference.test.js`는 별도 ordered-disjoint-hand 직접 열거와 비교합니다. 로열 보드 공동 1등, 쿼드 A 키커의 동률, 확실한 단독 승리와 무작위 고정 회귀 사례를 포함합니다.

## 다음 작업

1. 현재 branch `codex/exact-multiway-2`: 전체 표 생성 및 독립 검증 완료. data/MULTIWAY.md와 두 검증 보고서에 전체 범위·실측을 기록했습니다. 고정 24개 기본 회귀와 리버 1,051개 chunk별 직접 열거를 통과했습니다.
2. 상대 2명은 PR #22의 테스트 71개, Pages run 41148159361 성공, 공개 파일 20개 byte 일치 및 공개 HTTP 로더 4개 상태 일치를 확인했습니다. 로컬 브라우저 v23 첫 로드는 확인했지만 Mac 잠금 및 CDP 입력 timeout으로 3인 테이블 직접 조작/시각 검증은 완료하지 못했습니다. 이를 실제 압축 데이터를 사용하는 HUD 통합 테스트와 구별합니다.
3. 현재 branch `codex/exact-multiway-3`의 graph matching 검증을 바탕으로 native incremental stats와 전체 상대 3명 생성기를 구현합니다.

## 상대 3명 수학 기준 (소규모 독립 열거 검증, 전체 표 생성 전)

k=3 matching은 원래 그래프 G의 line graph L(G)에서 independent vertex triple의 개수와 같습니다. 따라서 후보 식은 `C(m,3) − (m−2) Σ_v C(d(v),2) + Σ_(uv∈E) C(d(u)+d(v)−2,2) − Σ_v C(d(v),3) − triangles(G)`입니다. 이를 작은 임의 그래프의 직접 matching 열거와 완전 그래프 분모, 실제 카드의 독립 직접 열거로 먼저 검증해야 합니다. 상대 label 배정에는 3!을 곱합니다. Hero 두 카드 삭제 후 차수·간선 차수 모멘트·triangle 수를 효율적으로 갱신하는 방법을 벤치마크해야 전체 생성이 실용적입니다.

상대 4~6명은 더 큰 matching 개수의 정확한 알고리즘이 필요합니다. 후보 식을 근거 없이 일반화하지 않습니다. 높은 상대 수의 프리플롭 count는 uint64를 넘으므로 uint128/BigInt와 정확한 정수 나눗셈을 설계합니다.


### 다음 native 생성기 구현 지점

`scripts/three-opponent-matching.mjs` 및 테스트는 line-graph inclusion/exclusion 식과 Hero 두 정점을 삭제한 O(vertices) 모멘트 식을 작은 무작위 그래프의 직접 열거 및 45정점 완전 그래프 분모 733,055,400과 비교합니다. 실제 카드 전체 표를 생성한 것은 아직 아닙니다.

리버의 47정점 score-threshold 그래프를 점수순으로 sweep합니다. Hero 점수 그룹을 추가하기 전 strict count, 추가한 후 non-strict count를 계산합니다. 전체 그래프의 degree D, neighbor degree sum S, Q=sum_edges(Du*Dv), common=A², vertex triangles t, 전체 triangles T, 47bit adjacency를 유지하면 Hero 삭제 count는 정점 47개를 한 번 순회해 계산할 수 있습니다.

새 간선 (a,b)를 넣을 때 기존 adjacency와 degree를 사용해 다음 순서로 갱신합니다 (아직 incremental 구현은 별도 검증 필요):

- Q += S[a]+S[b]+(D[a]+1)*(D[b]+1).
- 공통 이웃 mask=adj[a]&adj[b]. T += popcount(mask), t[a]/t[b]에도 같은 값, 각 공통 이웃의 t에는 1 추가.
- 기존 a 이웃 v마다 S[v]++, common[v][b]++, common[b][v]++. 기존 b 이웃 v마다 S[v]++, common[v][a]++, common[a][v]++.
- common[a][a]++, common[b][b]++, S[a]+=oldD[b]+1, S[b]+=oldD[a]+1.
- D[a]++, D[b]++, 양쪽 adjacency에 간선 추가.

먼저 이 incremental 갱신을 그래프 전체 재계산과 매 단계 비교하고, 삭제 공식도 함께 대조합니다. 이 방법은 Hero마다 990개 간선/삼각형을 다시 열거하는 비용을 피합니다. 상대 3명 리버 wins/ties는 u32 각각으로 저장할 수 있지만 턴 이후는 u64가 필요합니다. 높은 단계의 프리플롭은 u128/BigInt가 필요합니다. 압축 후 전체 Pages 크기를 단계마다 다시 확인합니다.

상대 3명 전체 생성·검증 결과는 data/MULTIWAY.md, data/river-three-verification.json, data/three-street-verification.json, data/three-graph-verification.json에 기록했습니다. 로컬 브라우저 v24의 상대 3명 프리플롭 확률과 390px 가로 넘침 없음을 확인했으며, postflop HTTP/공개 배포 검증은 PR 머지 후 수행합니다.


## 상대 3명 배포 완료 / 상대 4명 시작

PR #23 / merge c97f5617cd0542e7dec9df2da9b7509c9f9702f2 / Pages 41150080074 success를 확인했습니다. 공개 파일 23개와 실제 HTTP 로더 4개 상태가 로컬 검증본과 일치했습니다. 로컬 브라우저 v24에서 상대 3명 확률, 폴드→다음 핸드, 390px 가로 넘침 없음을 확인했습니다.

다음 단계의 직접 열거 기준 구현은 scripts/four-opponent-matching.mjs입니다. 660개 작은 그래프의 직접 matching 4개 열거 및 완전 그래프 분모 543,194,051,400과 일치합니다. 아직 실제 카드 전체 표는 생성하지 않았습니다.

- 상세 미검증 native 갱신 유도는 허용 임시 경로 /private/tmp/river-round/mw4-derivation.md에 보존했습니다. 검증된 JS 모멘트와 대조한 뒤 구현합니다.
- 기존 matching-three.hpp는 상대 3명 데이터 manifest가 SHA를 고정합니다. 이를 수정하지 말고 matching-four.hpp에서 포함/확장하여 레거시 검증을 유지합니다.
- 전체 데이터가 약 917MB이므로 상대 4명 배포 전에 기존 HU 리버/턴/플롭을 손실 없이 압축하고 모든 기존 상태가 동일하게 해제되는지 확인합니다.
- 상대 4명 이상 프리플롭은 JS 안전 정수를 초과합니다. 정확한 uint128/BigInt 카운트와 안전한 비율 계산/분모 표시를 먼저 설계합니다.


## 상대 4명 배포 완료 / 다음 실행

PR #24, merge 7172978b6f843f2953ee642785f18989d593f632, Pages 41152755319 success를 확인했습니다. 공개 파일 23개와 상대 1~4명 실제 HTTP 조회 16개가 검증본과 일치했습니다. HU 원본 shard는 Pages에서 제외되고 gzip 전송을 사용합니다. 소스 원본은 Git에 유지하며 모든 해제 byte를 검사합니다.

상대 5/6명 후보 전략을 MATCHING-5-6-PLAN.md에 보존했습니다. 먼저 52개 작은 연결 그래프 catalogue/정확 계수 생성 및 독립 subset-DP로 모든 matching 1~6개 계수의 일치를 검증하세요. 아직 후보이며 표 생성이 완료된 것이 아닙니다. 기존 native 헤더를 수정하지 말고 새 확장으로 출처 해시를 유지하세요. 임시 계산·검증 핸들은 /private/tmp/river-round/checkpoint.md도 확인하세요. 현재 큰 계산 프로세스는 모두 완료됐으며 새 실행에서 중복 작업 여부를 재확인해야 합니다.

실제 get_usage_limits가 허용하는 동안 진행하고, 소진 시 체크포인트를 유지한 채 등록된 heartbeat의 리셋 후 실행에서 재개합니다. 한도 누락 값을 0으로 보거나 크레딧을 구매하지 않습니다.


## 리셋 후 5·6명 계산 재개

2026-10-31 한도 리셋을 실제 get_usage_limits로 확인하고 작업을 재개했습니다. 작은 연결 그래프 52개와 정수 계수(scale 5040)를 생성했습니다. 모든 matching 1~6개에 대해 68개 host의 독립 subset-DP/완전 그래프 색칠 포함배제와 일치했고, 빠른 homomorphism은 86개 host에서 직접 hom 열거와 일치했습니다. Native 누적 행렬·Hero 삭제·구조적 twin 캐시는 870개 prefix(최대47정점)와 독립 재구성에 일치했습니다. 실제 카드 사례의 18정점/15정점 subset-DP에서도 5/6명 count가 일치합니다.

현재 native 전체 리버를 /private/tmp/river-room-mw56-v1 아래에 공동 생성 중입니다. source fingerprint generation.json과 live worker/session/PID는 /private/tmp/river-round/mw56-workers.json에 보존합니다. worker 로그는 mw56-worker-{0,1,2}.log입니다. 재시작 전 반드시 살아 있는 handle 또는 해당 PID를 확인해 중복 작업을 피하세요. chunk는 각각 원자적 rename되며 두 상대 수의 paired checkpoint가 모두 있어야 건너뜁니다. 아직 전체 표가 완성된 것은 아닙니다.

생성 완료 후 scripts/derive-five-six.cpp를 5 인자로 실행하고 scripts/pack-many-tables.py 5로 포장합니다. 6명 리버는 공동 계산하지만 전체 스트리트 합산/검증/배포는 5명부터 완료합니다. uint128 합산 및 6명 플롭 128bit 행을 구현했으나 전체 생성 데이터와의 검증은 대기 중입니다.

Pages의 공식 1GB 제한 때문에 큰 5/6명 파일은 동일한 기존 공개 GitHub 저장소의 immutable commit URL을 고려합니다. 실제 기존 커밋 .gz 응답에서 CORS * 및 cross-origin 전달 가능을 확인했습니다. 새 서비스·유료 비용·권한 확대 없이 동일한 검증 byte를 조회하며, 원본 commit를 고정하고 압축 전후 SHA를 계속 검증해야 합니다. table-source.js는 아직 빈 설정(로컬 조회)이며, 검증된 데이터 commit가 게시된 뒤에만 revision을 채웁니다.

리버 5/6명 1,051 paired chunk가 모두 완성됐고 worker 3개는 exit0으로 확인했습니다. 상대 5명 전체 스트리트를 생성·검증했으며 data/five-verification.json을 참고하세요. 실제 계정 한도 리셋 후 정상 허용 상태에서 진행했습니다. 상대 6명은 아직 리버 원본만 완료한 단계입니다.

### 상대 6명 UI 및 전달 사전 검증

104 tests 통과(2–7명 240 핸드 포함). 390px/320px/1280px에서 6명 상대 좌석과 7명 인원 선택기를 확인했습니다. 모바일 하단 좌석은 보드 아래·내 홀카드 바깥에 배치하고 데스크톱에서 흰 배경에 걸치는 하단 스택/상태는 짙은 글씨로 표시합니다. QA 초기 인원 7명/딜러 4번 fixture 외에는 실제 앱·CSS·표 로더를 사용했습니다. 브라우저의 고정 SHA raw 조회에서 실제 카드 wins=931253760, ties=49927829760 및 CORS/gzip/양쪽 SHA/BigInt 검증 PASS입니다. 기본 4명과 기본 딜러는 변경하지 않습니다.


## 전체 단계 완료 검증

상대 1–6명 모든 스트리트 제공 범위를 완료했습니다. 최종 6명 표 릴리스는 PR #26의 위 머지 SHA/Pages run에 고정되어 있습니다. 공개 파일 29개와 고정 커밋 데이터 manifest/경계 shard 7개를 SHA로 비교했고, 상대 1–6명 각각 royal 동률·카드 제거·플롭·턴의 24개 HTTP 조회가 로컬 정확 표와 일치했습니다. Version 27에서 검증했습니다. 이후 version 28은 하단 두 좌석의 팝업 방향과 문서 완료 상태만 보완하며 수치/표는 변경하지 않습니다.

추가 모바일 폴드·카드 보기에서 390px 가로 넘침 없이 두 미사용 카드만 opacity .32, 사용 5장은 opacity 1 및 transform none을 확인했습니다. 하단 좌석 팝업은 위로 열어 테이블 바깥 종료 문구와 겹치지 않게 합니다. 브라우저 QA fixture는 초기 인원/딜러만 바꾸고 실제 게임 및 표 로더를 사용했습니다. 기본 4명은 유지합니다.

최종 후속 PR의 CI·Pages 및 공개 파일 재검증 후 umbrella issue #21과 heartbeat 자동화를 종료합니다. 수학/생성 근거는 각 검증 JSON과 재현 가능한 생성기, 데이터 SHA에 남겨 두며 임시 경로의 checkpoint를 보존합니다.
