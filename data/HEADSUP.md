# Exact strongest-hand probabilities against one random opponent

The UI shows `P(hero score >= opponent score)`: the probability no opponent has a stronger hand, **including tied first place**. It does not divide ties by the number of winners. Wins and ties are also displayed separately. All results are exhaustive, not sampled. The model gives equal weight to all legal unknown opponent hands and remaining boards; it does not read actual hidden cards or infer betting ranges.

| Street | Denominator per known state | Coverage |
|---|---:|---:|
| Preflop | 2,097,572,400 | 169 hole-card classes |
| Flop | 1,070,190 = C(47,2) × C(45,2) | 1,286,792 suit-isomorphic states |
| Turn | 45,540 = 46 × C(45,2) | 13,960,050 suit-isomorphic states |
| River | 990 = C(45,2) | all boards and legal hero hands |

With no opponent left, strongest-hand probability is 100%. With two or more opponents, the UI reports missing exact data instead of substituting heads-up odds or a simulation. The separate category-completion table is not the strongest-hand probability.

## River generation

`scripts/generate-river-hu.cpp` has an independent seven-card full-score evaluator. We compared 20,000 deterministic random hands against engine.js, including exact category and tie-break score. Each of the 134,459 suit-canonical river boards evaluates its C(47,2)=1,081 legal hero pairs. Sorting these scores and accumulating total/per-card counts allows exact exclusion of both hero cards:

- `wins = allLower - lowerContainingA - lowerContainingB`.
- `ties = allEqual - equalContainingA - equalContainingB + 1` (the intersection is the hero hand itself).

The 990 legal opponent pairs are therefore counted without enumerating the same evaluation repeatedly. Results include exactly 145,350,179 stored hero/board combinations; board stabilizers leave some equivalent hero entries duplicated to permit dense lookup without per-hand keys.

`river-hu-v1/keys.bin`: ASCII `RRK1`, uint32 little-endian board count, sorted uint32 board keys. A board key packs its sorted five card IDs in base 64. Suit permutations minimize board key; tied board permutations may further minimize hero key. Every legal mapped hero pair exists in the table.

Each chunk has `RRW1`, uint32 starting board index, uint32 board count, then dense rows for at most 128 boards. Hero pairs are in lexicographic order over the 47-card remaining deck. Each hand stores wins in ten bits and ties in the next ten bits, little-endian, packed consecutively. A board uses 2,703 bytes. Each numerator is 0..990 and wins+ties <=990. Total river binary data including headers/index: **363,993,133 bytes**.

## Exact aggregation

`scripts/derive-headsup.cpp` builds a temporary 52-choose-5 board-normalization map and loads packed river records offline. It visits each canonical turn state and sums the 46 possible river counts. Flop counts sum the 47 possible turn tables and divide by two, since each unordered turn/river pair was counted twice. Preflop counts sum all C(50,3) flop tables and divide by ten, since each final board contains ten flops. Divisibility and denominator bounds are asserted.

- `turn-hu-v1/<hero>.bin`: `RTH1`, uint32 row count, sorted records `(uint32 boardKey, uint16 wins, uint16 ties)`. 169 shards, **111,681,752 bytes**.
- `flop-hu-v1/<hero>.bin`: `RFH1`, uint32 row count, sorted records `(uint32 boardKey, uint32 wins, uint32 ties)`. 169 shards, **15,442,856 bytes**.
- `preflop-headsup-counts.json` and root `preflop-headsup-counts.js`: 169 own-generated rows containing wins, ties, denominator and nine exact category counts. Category counts are independently aggregated from the existing exact flop-category table; they sum to C(50,5)=2,118,760. The old rounded imported preflop file is retained as an archival independent cross-check and is no longer loaded by the app.

These are repository-owned generators and numerical results. No external evaluator or probability dataset was used to generate the new winning/tied counts.

## Reproduce and verify

```sh
clang++ -O3 -std=c++17 -march=native scripts/generate-river-hu.cpp -o /tmp/river-hu
/tmp/river-hu data/river-hu-v1
python3 scripts/build-river-manifest.py
clang++ -O3 -std=c++17 -march=native scripts/derive-headsup.cpp -o /tmp/derive-headsup
/tmp/derive-headsup
python3 scripts/build-headsup-manifests.py
node scripts/verify-river.mjs --full-board --report
node scripts/verify-headsup.mjs --report
npm test
```

The derivation currently uses `/private/tmp/river-room-board-map.bin` as a local restart cache and needs roughly 400MB of memory. The published app never loads this full working set. Shards write to temporary files before rename; derivation resumes from completed turn shards. Manifests contain source and parent-data hashes, formats, counts, sizes and per-file SHA-256.

Verification covers every stored bound/hash, independent direct JavaScript river comparisons including one full representative board, independent turn comparisons across every hero shard, and complete direct enumeration of nine representative flop states. `headsup-verification.json` records 516 independently recomputed states and **32,720,490** opponent/runout comparisons. `river-hu-v1/verification.json` records its separate coverage. Exact integer preflop symmetry requires the combo-weighted sum of `2*wins+ties` to equal `1326*denominator`; all 169 new rows also agree with independent historical win/tie values within their rounding precision.

At runtime the app only normalizes cards, fetches/checks the required binary and divides integer counts by the denominator. Each loader retains at most three shards/chunks in memory. Large datasets are excluded from service-worker installation and unbounded asset caching. Failed downloads stay explicit and stale responses cannot replace later streets or folded-hand state.


전송본은 gzip-manifest.json / .bin.gz로 제공합니다. 원본 .bin과 이 문서의 생성 형식은 Git 재현·검증용으로 유지하며 Pages에서는 제외합니다. 압축 전후 SHA와 전체 byte 일치 검증 및 배포 선택 규칙은 [MULTIWAY.md](./MULTIWAY.md)의 레거시 HU 절을 참고하세요.
