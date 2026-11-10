# River Room

Current delivery: Play / Quiz / In-game offline modes, 2-9 total players. [New modes and 8-9-player accuracy](./NINE-PLAYERS.md). Exact originals remain preserved. Initial app cache is about 10.6 MB. No per-query probability downloads. Existing 2-7-player accuracy is unchanged; 8-9-player probabilities are bounded approximations (strongest display +/-0.4 percentage points).

한국어 싱글플레이 텍사스 홀덤 연습 PWA. 의존성/빌드 없이 GitHub Pages에서 실행됩니다.

- 앱: https://minkyu725.github.io/river-room/
- 저장소: https://github.com/minkyu725/river-room
- 로컬 경로: `/Users/minkyu/works/river-room`
- 디자인 기준: [DESIGN.md](./DESIGN.md), no-slop-ui 스킬로 중성 배경·녹색 테이블과 절제된 컨트롤 적용

## 실행

```sh
npm run dev
# http://localhost:4173
npm test
```

2~9인, 새 테이블 시작 시 1,000칩, 10/20 블라인드. 다음 핸드에도 보유 칩을 유지하며 칩이 소진된 상대는 쉬고, 내 칩이 소진되거나 한 명만 남으면 테이블을 종료합니다. 딜러 순환, 체크/콜/폴드/노리밋 레이즈/올인, 사이드 팟을 지원합니다. 매 핸드 종료 시 폴드한 플레이어까지 패를 공개하며 남은 보드를 옅게 공개하고 모든 참가자가 폴드하지 않았을 때의 가상 승자도 표시합니다. 카드·칩·액션 효과음과 음소거를 지원하며 최근 30개 기록을 기기에 저장합니다 (최근 10개를 UI에서 조회).

홀 카드는 딜러 왼쪽부터 한 장씩 두 바퀴 배분하고 플롭·턴·리버와 종료 후 공개도 순서대로 진행합니다. 공개가 끝나면 행동과 칩 정산이 이어집니다. 소리 버튼 옆 **애니메이션 켜짐/꺼짐** 설정은 기기에 저장됩니다. 기본은 켜짐이며 기기의 동작 줄이기 설정에서는 대기와 모션을 생략합니다. 진행 중 끄면 남은 공개를 즉시 마칩니다.

The active app uses an embedded offline model. With 1-6 opponents, preflop/turn/river are exact and flop is bounded approximate. With 7-8 opponents all streets are bounded approximate. See [OFFLINE-MODEL.md](./OFFLINE-MODEL.md) for error bounds and original-data preservation.

AI는 자기 패/보드로 110회 샘플링한 에퀴티, 팟 오즈, 성향, 확률적 블러프, 현재 핸드의 내 공격성과 이전 공개 패에 따른 블러프 의심을 이용합니다. 상대의 실제 비공개 카드를 읽지 않습니다. 전문 포커 솔버가 아닌 연습용 휴리스틱입니다. 과거 약한 패의 레이즈를 블러프 신호로 쓰므로 실패한 드로 등과 엄밀히 구분하지 않습니다.

## GitHub Pages 배포

1. GitHub 저장소를 만들고 이 폴더의 파일을 main 브랜치에 푸시합니다.
2. 저장소 Settings → Pages → Source를 **GitHub Actions**로 설정합니다.
3. Deploy GitHub Pages 워크플로 완료 후 표시되는 URL을 엽니다.

모든 앱 경로가 상대경로라 `/저장소명/` 주소에서도 동작합니다. 서버/외부 API/비밀 키가 필요하지 않습니다.

iPhone: 배포 URL을 Safari에서 열기 → 공유 → 홈 화면에 추가. 최초 온라인 로드 후 서비스워커 설치가 완료되면 게임은 오프라인으로 실행 가능합니다. 대형 확률표는 필요한 shard의 네트워크/HTTP 캐시 로드가 필요하며, 사용할 수 없으면 안내를 표시합니다. 버전 변경 시 sw.js의 CACHE 이름을 변경하고 재방문하면 갱신됩니다. 실제 돈/결제/멀티플레이 기능은 없습니다.

## 족보 완성 확률

최강 패 확률 아래의 **족보 완성 확률 보기**를 펼치면 프리플롭·플롭 9개 최종 족보의 완성 확률을 확인할 수 있습니다. 상대 인원과 무관한 내 패 완성 확률이며 승률과 다릅니다. 리버는 확정된 족보를 표시하며, 턴의 족보 분포는 미제공입니다. Probability work runs in a Worker without Monte Carlo.

참가 인원을 바꾸면 칩 초기화 안내 후 해당 인원의 새 테이블을 시작합니다. 취소하면 현재 인원과 게임을 유지합니다. 손상된 저장 기록은 건너뛰고 정상 기록만 복원합니다. PR에서는 별도 테스트 워크플로를 실행하며 main 병합 후 Pages를 배포합니다.

종료 후 폴드한 플레이어도 `폴드 · 최종 족보`로 표시합니다. 폴드·체크·콜·레이즈 시 행동 표시가 나타나며 베팅 칩이 팟으로 이동합니다. 기존 애니메이션 토글과 동작 줄이기 설정을 함께 따릅니다.

테이블에는 족보 이름을 우선 표시하며 **카드 보기**를 누르면 실제 구성 카드와 키커를 나눠 볼 수 있습니다. 내 패와 상대 패는 동일한 카드 보기 디자인을 사용하며 팝오버에는 족보 이름도 표시합니다. 폴드한 플레이어의 팝오버도 같은 밝기로 표시합니다. 결과·복기 기록은 족보 이름 / 구성 / 키커를 별도 줄로 표시하며 개인별 홀카드 2장과 보드 5장 중 최선의 5장에 쓰이지 않는 2장은 흐리게 표시합니다. 동률인 최선의 조합이 여러 개이면 한 조합을 선택합니다. 스트레이트의 A는 A–2–3–4–5에서 낮은 카드로 정렬합니다. 결과와 복기 기록은 남은 가상 보드를 포함한 최종 족보이며 기존 가상 결과 안내를 따릅니다.

iPhone Safari에서 **소리 켜짐** 상태로 화면을 한 번 터치한 후 미디어 볼륨을 올리세요. Audio Session API 지원 환경에서는 `playback` 세션을 사용합니다. 시스템 무음 스위치 자체를 변경하거나 하드웨어 볼륨 버튼으로 앱의 **소리 꺼짐** 설정을 해제할 수는 없습니다. 미지원 브라우저는 기존 Web Audio 동작을 유지합니다. 다른 미디어 재생이 중단될 수 있습니다.


레이즈 총액은 새 내 차례마다 최소 가능 금액으로 초기화되고, 같은 차례의 재렌더에서는 선택값을 유지합니다. 2/2.5/3 BB 프리셋과 칩·BB 동시 표시를 지원합니다(1 BB=20칩). 최소 레이즈 미달·스택 초과 프리셋은 비활성화하며 실제 베팅은 레이즈 버튼으로 확정합니다. [확률표 파일 용량 실측](./TABLE-STORAGE.md).


각 베팅 라운드(프리플롭/플롭/턴/리버)는 카드 공개와 확률 계산이 끝난 뒤 5초 동안 멈춥니다. **액션 진행하기**를 누르면 기다리지 않고 시작합니다. 이 대기는 애니메이션 끄기/동작 줄이기와 별개이며, 모드를 벗어나면 남은 시간이 보존됩니다. 2~9인 좌석은 나의 왼쪽 자리부터 시계 방향으로 액션 순서와 일치합니다. 중복/이전 상대 타이머 및 순서가 아닌 액션은 무효 처리합니다.

새 테이블의 상대는 12명 캐릭터 풀에서 중복 없이 무작위로 선택됩니다. 외형과 성향은 캐릭터에 연결되며 같은 테이블의 다음 핸드에는 상대 구성과 칩이 유지됩니다. 라운드 확인 시간에는 화면 하단에 내 카드·최강 패 확률·진행 버튼이 표시되고, 확률 가리기 상태도 그대로 적용됩니다.

내 버튼 자리는 대비가 높은 **BTN · 딜러** 배지로 표시됩니다. 확률을 가리면 진행 중인 확인 대기가 즉시 종료되고, 다음 라운드도 확률 계산을 기다리지 않고 진행됩니다. 플레이어별 직전 액션은 현재 핸드 내에서 라운드와 함께 보존되며 새 핸드에서 초기화됩니다.

## 포커 용어집

홈의 **용어집** 또는 `#glossary`에서 33개 항목을 한글·영문·약어로 검색하고 네 분류로 찾아볼 수 있습니다. 각 항목은 뜻, 카드/액션 예시, 해석할 때의 주의점을 제공합니다. 설치 시 앱에 함께 저장되므로 용어 조회에도 인터넷이 필요하지 않습니다.

현재 **최강 패 확률**은 `P(내 패보다 강한 상대 없음)`으로 공동 1등을 전부 포함합니다. **Equity(에퀴티)**는 동률 시 분할 지분을 반영한 기대 팟 지분입니다. 헤즈업에서는 `P(단독 승리) + P(동률)/2`이며 올인 콜·폴드 퀴즈가 이 값을 사용합니다. 멀티웨이에서는 동률 참여 인원별 분포가 필요하므로 단순히 동률 확률을 절반 더한 값을 equity로 표시하지 않습니다. 기존 확률 수치/계산표는 바뀌지 않습니다.

용어 설명 참고: [PokerStrategy equity](https://www.pokerstrategy.com/strategy/various-poker/ranges-equity-introduction/), [PokerStars C-bet](https://www.pokerstars.com/poker/learn/lesson/c-betting/), [GTO Wizard glossary](https://lp.gtowizard.com/glossary/). 앱의 무작위 상대 확률과 참고 프리플롭 차트는 GTO 솔버 전략이 아닙니다.
