export const glossary = [
  {
    "id": "equity",
    "term": "Equity",
    "alias": "에퀴티",
    "category": "확률·GTO",
    "definition": "쇼다운까지 진행했을 때 받을 것으로 기대되는 팟 지분입니다. 동률은 나눠 갖는 비율만 반영합니다.",
    "example": "헤즈업에서 단독 승리 40%, 동률 20%라면 equity는 40% + 20% ÷ 2 = 50%입니다.",
    "note": "현재 앱의 최강 패 확률은 같은 경우 60%입니다. 상대 레인지에 따라 equity도 달라집니다."
  },
  {
    "id": "strongest",
    "term": "최강 패 확률",
    "alias": "공동 1등 포함",
    "category": "확률·GTO",
    "definition": "리버까지 진행했을 때 내 패보다 강한 상대가 없을 확률입니다. 이 앱에서 사용하는 지표입니다.",
    "example": "보드가 로열 플러시라서 6명이 모두 비기면 최강 패 확률은 100%, 각자의 equity는 약 16.7%입니다.",
    "note": "Equity와 다릅니다. 상대의 실제 액션 레인지 대신 무작위 핸드를 가정합니다."
  },
  {
    "id": "ev",
    "term": "EV",
    "alias": "기대값 · Expected value",
    "category": "확률·GTO",
    "definition": "같은 선택을 반복했을 때 평균적으로 얻거나 잃는 칩입니다. 확률과 다른 단위입니다.",
    "example": "추가 베팅 없이 끝나는 콜: EV = equity × 콜 후 최종 팟 − 콜 금액. EV +2 BB는 평균 2 BB 이익입니다.",
    "note": "앱의 올인 퀴즈는 레이크·ICM 없는 헤즈업 모델입니다."
  },
  {
    "id": "gto",
    "term": "GTO",
    "alias": "게임 이론 최적 전략",
    "category": "확률·GTO",
    "definition": "가정한 게임에서 어느 한 명도 혼자 전략을 바꿔 기대값을 높일 수 없는 균형을 말합니다.",
    "example": "솔버를 볼 때는 인원, 포지션, 스택, 레이크, 베팅 크기가 내 상황과 같은지 확인합니다.",
    "note": "앱의 무작위 상대 확률과 참고 프리플롭 차트는 GTO 솔버 해답이 아닙니다."
  },
  {
    "id": "range",
    "term": "Range",
    "alias": "레인지",
    "category": "확률·GTO",
    "definition": "한 장의 특정 패가 아니라, 플레이어가 가질 수 있는 여러 핸드와 그 빈도의 묶음입니다.",
    "example": "AA, KK, AKs로만 이루어진 레인지는 모든 핸드가 가능한 무작위 레인지와 다릅니다.",
    "note": "s는 같은 무늬(suited), o는 다른 무늬(offsuit). 66+는 66부터 AA까지의 페어입니다."
  },
  {
    "id": "pot-odds",
    "term": "Pot odds",
    "alias": "팟 오즈",
    "category": "확률·GTO",
    "definition": "콜 비용과 받을 수 있는 팟의 비율입니다. 이를 콜에 필요한 최소 equity로 바꿔 볼 수 있습니다.",
    "example": "상대 베팅까지 포함한 팟이 100, 콜 비용이 50이면 필요 equity는 50 ÷ 150 = 33.3%입니다.",
    "note": "추가 베팅·레이크가 없는 경우의 기준입니다. 최강 패 확률을 equity 대신 넣으면 안 됩니다."
  },
  {
    "id": "mdf",
    "term": "MDF",
    "alias": "최소 방어 빈도",
    "category": "확률·GTO",
    "definition": "상대의 equity 0% 블러프가 자동으로 이익을 얻지 못하게 방어하는 레인지 비율의 기준입니다.",
    "example": "팟 100에 상대가 50 베팅: MDF = 100 ÷ (100 + 50) ≈ 66.7%. 방어는 콜과 레이즈를 포함합니다.",
    "note": "개별 핸드의 승률이 아닙니다. 멀티웨이·미래 스트리트에 그대로 적용하는 콜 규칙도 아닙니다."
  },
  {
    "id": "eqr",
    "term": "EQR",
    "alias": "에퀴티 실현율",
    "category": "확률·GTO",
    "definition": "추가 액션이 있는 실제 플레이에서 raw equity가 얼마나 기대 수익으로 이어지는지 나타냅니다.",
    "example": "좋은 포지션에서는 상대 액션을 보고 결정할 수 있어, 같은 raw equity라도 얻는 가치가 달라질 수 있습니다.",
    "note": "Equity만으로 모든 콜·폴드 판단을 정할 수 없는 이유입니다."
  },
  {
    "id": "range-advantage",
    "term": "Range advantage",
    "alias": "레인지 어드밴티지",
    "category": "확률·GTO",
    "definition": "특정 보드에서 한쪽 레인지의 equity 분포가 상대보다 유리한 상태입니다.",
    "example": "나의 한 핸드가 약해도 전체 레인지에는 강한 핸드가 상대보다 많을 수 있습니다.",
    "note": "한 핸드의 최강 패 확률만으로 레인지 우위를 판단하지 않습니다."
  },
  {
    "id": "nut-advantage",
    "term": "Nut advantage",
    "alias": "넛 어드밴티지",
    "category": "확률·GTO",
    "definition": "매우 강한 최상위 핸드를 한쪽 레인지가 더 많이 보유하는 우위입니다.",
    "example": "평균적인 패의 강도가 비슷해도 한쪽에만 가능한 스트레이트가 많을 수 있습니다.",
    "note": "레인지 어드밴티지와 구분합니다."
  },
  {
    "id": "mix",
    "term": "Mixed strategy",
    "alias": "혼합 전략 · 믹스",
    "category": "확률·GTO",
    "definition": "같은 핸드·상황에서도 여러 액션을 정해진 빈도로 섞는 전략입니다.",
    "example": "어떤 해답이 레이즈 60%, 폴드 40%라면 매번 레이즈만 하는 것과 다릅니다.",
    "note": "앱 참고 차트의 경계 핸드는 두 선택을 허용하지만, 정확한 솔버 빈도를 제공하지는 않습니다."
  },
  {
    "id": "rainbow",
    "term": "Rainbow",
    "alias": "레인보우 · rb",
    "category": "보드·드로우",
    "definition": "플롭의 세 카드 무늬가 모두 다른 보드입니다.",
    "example": "A♠ 7♥ 2♦는 레인보우입니다.",
    "note": "레인보우가 항상 드라이한 것은 아닙니다. J♠ T♥ 9♦는 스트레이트 연결성이 높습니다."
  },
  {
    "id": "two-tone",
    "term": "Two-tone",
    "alias": "투톤",
    "category": "보드·드로우",
    "definition": "플롭 세 장 중 두 장이 같은 무늬인 보드입니다.",
    "example": "K♥ 8♥ 3♣는 투톤입니다.",
    "note": "하트 두 장을 가진 핸드는 플러시 드로우를 가질 수 있습니다."
  },
  {
    "id": "monotone",
    "term": "Monotone",
    "alias": "모노톤",
    "category": "보드·드로우",
    "definition": "플롭 세 장이 모두 같은 무늬인 보드입니다.",
    "example": "Q♠ 8♠ 2♠는 모노톤입니다.",
    "note": "스페이드 홀카드 두 장이면 이미 플러시입니다."
  },
  {
    "id": "texture",
    "term": "Board texture",
    "alias": "보드 텍스처 · 드라이 / 웨트",
    "category": "보드·드로우",
    "definition": "무늬, 연결성, 페어 여부 등 보드의 성질입니다. 드라이·웨트는 드로우 가능성을 설명하는 상대적 표현입니다.",
    "example": "K♠ 7♥ 2♦는 대체로 드라이, J♥ T♥ 9♣는 웨트한 편입니다.",
    "note": "보드만 보지 말고 양쪽 레인지와 함께 해석합니다."
  },
  {
    "id": "draw",
    "term": "Draw / Outs",
    "alias": "드로우 / 아웃츠",
    "category": "보드·드로우",
    "definition": "드로우는 추가 카드로 패가 개선될 가능성, 아웃츠는 원하는 결과를 만드는 남은 카드입니다.",
    "example": "A♥ Q♥에 보드 9♥ 4♥ 2♣라면 플러시 드로우이며 남은 하트는 9장입니다.",
    "note": "플러시가 완성돼도 더 강한 패에 질 수 있어 모든 개선 카드가 승리 아웃츠인 것은 아닙니다."
  },
  {
    "id": "oesd",
    "term": "OESD / Gutshot",
    "alias": "양방향 / 것샷 스트레이트 드로우",
    "category": "보드·드로우",
    "definition": "OESD는 양 끝 중 하나로, 것샷은 내부의 특정 랭크로 스트레이트가 완성되는 드로우입니다.",
    "example": "5-6-7-8은 4 또는 9, 5-6-8-9는 7이 필요합니다.",
    "note": "보이지 않는 카드 기준 보통 8장 대 4장이지만, 모두 승리를 보장하지는 않습니다."
  },
  {
    "id": "backdoor",
    "term": "Backdoor",
    "alias": "백도어",
    "category": "보드·드로우",
    "definition": "플롭에서 턴과 리버 두 장이 모두 맞아야 완성되는 드로우입니다.",
    "example": "A♥ Q♥, 보드 K♥ 7♣ 2♦에서 턴·리버가 모두 하트면 백도어 플러시입니다.",
    "note": "한 장만 맞으면 되는 일반적인 플러시 드로우와 다릅니다."
  },
  {
    "id": "nuts",
    "term": "Nuts / Blocker",
    "alias": "넛 / 블로커",
    "category": "보드·드로우",
    "definition": "넛은 현재 보드에서 가능한 최강 핸드, 블로커는 내가 보유해 상대가 가질 수 없게 된 카드입니다.",
    "example": "A♥를 들고 있으면 상대는 A♥가 필요한 넛 플러시를 가질 수 없습니다.",
    "note": "플롭의 넛은 이후 카드로 바뀔 수 있습니다. 블로커 하나만으로 블러프를 결정하지 않습니다."
  },
  {
    "id": "kicker",
    "term": "Kicker",
    "alias": "키커",
    "category": "핸드·포지션",
    "definition": "같은 족보의 패에서 강약을 가르는 나머지 비교 카드입니다.",
    "example": "보드 A♣ 9♦ 7♥ 4♠ 2♣에서 AK는 AQ보다 K 키커가 높아 이깁니다.",
    "note": "최종 5장에 포함되는 카드만 비교합니다."
  },
  {
    "id": "hole-board",
    "term": "Hole cards / Board",
    "alias": "홀카드 / 보드",
    "category": "핸드·포지션",
    "definition": "홀카드는 내 비공개 두 장, 보드는 모두가 공유하는 최대 다섯 장입니다.",
    "example": "홀덤은 홀카드와 보드 7장 중 최선의 5장을 씁니다.",
    "note": "홀카드를 반드시 두 장 다 써야 하는 것은 아닙니다."
  },
  {
    "id": "streets",
    "term": "Street",
    "alias": "스트리트",
    "category": "핸드·포지션",
    "definition": "베팅 라운드입니다. 프리플롭은 보드 공개 전, 플롭은 3장, 턴은 4장, 리버는 5장 공개 단계입니다.",
    "example": "플롭에서 콜한 뒤 턴에서 다시 결정합니다.",
    "note": "일상어의 내 턴(액션 순서)과 카드 단계인 턴을 구분합니다."
  },
  {
    "id": "positions",
    "term": "BTN / CO / HJ / UTG",
    "alias": "버튼 / 컷오프 / 하이잭 / 언더더건",
    "category": "핸드·포지션",
    "definition": "BTN은 딜러 버튼, CO는 그 바로 전 자리, HJ는 CO 전 자리입니다. UTG는 프리플롭에서 BB 다음에 처음 액션하는 자리입니다.",
    "example": "6인 테이블의 프리플롭 순서는 UTG → HJ → CO → BTN → SB → BB입니다.",
    "note": "인원에 따라 중간 포지션의 이름과 개수가 달라집니다."
  },
  {
    "id": "ip-oop",
    "term": "IP / OOP",
    "alias": "인 포지션 / 아웃 오브 포지션",
    "category": "핸드·포지션",
    "definition": "포스트플롭에서 상대보다 나중에 액션하면 IP, 먼저 액션하면 OOP입니다.",
    "example": "헤즈업 팟에서 BTN은 보통 IP라서 상대의 행동을 보고 결정합니다.",
    "note": "헤즈업의 BTN은 SB도 겸하고 프리플롭에는 먼저 액션합니다."
  },
  {
    "id": "bb-stack",
    "term": "BB / Effective stack / SPR",
    "alias": "빅블라인드 / 유효 스택 / 스택 대 팟 비율",
    "category": "핸드·포지션",
    "definition": "BB는 큰 강제 베팅이자 금액 단위입니다. 헤즈업 유효 스택은 두 사람 중 작은 스택, SPR은 유효 잔여 스택 ÷ 팟입니다.",
    "example": "BB 20칩일 때 1,000칩은 50 BB. 잔여 유효 스택 600, 팟 200이면 SPR은 3입니다.",
    "note": "멀티웨이의 유효 스택은 상대별로 다를 수 있습니다."
  },
  {
    "id": "cbet",
    "term": "C-bet",
    "alias": "컨티뉴에이션 베트 · 씨벳",
    "category": "베팅·액션",
    "definition": "프리플롭의 마지막 레이저가 플롭에서도 이어서 하는 베팅입니다.",
    "example": "CO가 오픈, BB가 콜. 플롭에서 BB 체크 후 CO가 베팅하면 C-bet입니다.",
    "note": "블러프일 수도 밸류 베트일 수도 있습니다. 프리플롭 콜러의 베팅은 자동으로 C-bet이 되지 않습니다."
  },
  {
    "id": "rfi",
    "term": "RFI / Open raise",
    "alias": "첫 진입 레이즈 / 오픈 레이즈",
    "category": "베팅·액션",
    "definition": "앞선 사람이 모두 폴드한 프리플롭에서 레이즈로 처음 팟에 진입하는 액션입니다.",
    "example": "CO까지 모두 폴드하고 CO가 2.5 BB로 올리면 RFI입니다.",
    "note": "림퍼가 있는 상황의 레이즈는 RFI와 구분합니다."
  },
  {
    "id": "three-bet",
    "term": "3-bet / 4-bet",
    "alias": "쓰리벳 / 포벳",
    "category": "베팅·액션",
    "definition": "3-bet은 첫 레이즈에 대한 리레이즈, 4-bet은 그 3-bet을 다시 올리는 것입니다. 프리플롭에서는 BB가 첫 베팅으로 셉니다.",
    "example": "BB 1 → 오픈 2.5 BB → 3-bet 8 BB → 4-bet 20 BB.",
    "note": "숫자는 세 배·네 배의 금액을 뜻하지 않습니다."
  },
  {
    "id": "check-raise",
    "term": "Check-raise",
    "alias": "체크 레이즈",
    "category": "베팅·액션",
    "definition": "같은 스트리트에서 먼저 체크한 후, 상대 베팅에 레이즈하는 액션입니다.",
    "example": "BB 체크 → BTN 3 BB 베팅 → BB 10 BB로 레이즈.",
    "note": "턴이 아니라 같은 베팅 라운드 안에서 일어납니다."
  },
  {
    "id": "value-bluff",
    "term": "Value bet / Bluff / Semi-bluff",
    "alias": "밸류 베트 / 블러프 / 세미블러프",
    "category": "베팅·액션",
    "definition": "밸류 베트는 더 약한 패의 콜에서 가치를 얻고, 블러프는 더 강한 패의 폴드를 노립니다. 세미블러프는 개선 가능성도 가진 블러프입니다.",
    "example": "아직 메이드 핸드가 약한 플러시 드로우로 베팅하면 세미블러프가 될 수 있습니다.",
    "note": "내 패가 좋아 보인다는 이유만으로 모든 베팅이 밸류 베트는 아닙니다."
  },
  {
    "id": "barrel",
    "term": "Barrel",
    "alias": "배럴",
    "category": "베팅·액션",
    "definition": "연속 스트리트에 걸쳐 베팅을 이어가는 표현입니다.",
    "example": "플롭 베팅 후 턴에서도 베팅하면 더블 배럴, 리버까지 이어가면 트리플 배럴입니다.",
    "note": "C-bet 이후의 라인을 설명할 때 자주 쓰입니다."
  },
  {
    "id": "limp",
    "term": "Limp / Call / Check / Fold",
    "alias": "림프 / 콜 / 체크 / 폴드",
    "category": "베팅·액션",
    "definition": "림프는 프리플롭에 BB만 콜하며 진입하는 것, 콜은 베팅 맞추기, 체크는 추가 베팅 없이 넘기기, 폴드는 포기하기입니다.",
    "example": "베팅을 맞춰야 할 금액이 있으면 체크할 수 없습니다.",
    "note": "앱의 콜·체크·폴드 버튼은 실제 가능한 액션만 제공합니다."
  },
  {
    "id": "showdown",
    "term": "Showdown / Split pot",
    "alias": "쇼다운 / 스플릿 팟",
    "category": "베팅·액션",
    "definition": "쇼다운은 마지막에 패를 비교하는 단계, 스플릿 팟은 같은 강도의 승자들이 팟을 나누는 경우입니다.",
    "example": "같은 최선의 5장으로 비기면 홀카드 2장의 원래 높낮이는 따로 비교하지 않습니다.",
    "note": "모두 폴드해 한 명만 남으면 쇼다운 없이 팟을 받습니다."
  }
];

export function findTerms(query="", category="전체") {
 const key=query.normalize("NFKC").toLocaleLowerCase().replace(/[\s‐‑–—-]/g, "");
 return glossary.filter(t=>(category==="전체"||t.category===category)&&[t.term,t.alias,t.definition,t.example,t.note].join(" ").normalize("NFKC").toLocaleLowerCase().replace(/[\s‐‑–—-]/g, "").includes(key));
}
