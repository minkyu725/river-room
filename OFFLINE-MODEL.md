# Self-contained offline probabilities

## Current delivery

The preserved exact sources still exist, unchanged, in `data/` (baseline commit `62b7485d5f87d2ae94a0d432d0346e75178fa728`). They are no longer copied to Pages. Initial cache body size is about **8.58 MB**, including the **8.40 MB** flop model. This is a deliberate under-9-MB installation budget, not a hosting-provider limit. Subsequent probability queries have no network dependency.

| Street | Method | Error before display rounding |
|---|---|---|
| Preflop | Preserved exact 169-class inline counts | 0 |
| Flop | All 1,286,792 states, opponents 1–6, nearest 8-bit quantization | Strongest/unique win <=0.197 percentage points; tie <=0.393 |
| Turn | Exact integer sum over 46 river cards | 0 |
| River | Exact disjoint-pocket graph matching | 0 |

The metric remains P(no opponent is stronger), including joint first place, not divided pot equity. After the UI's 0.1-percentage-point rounding, the flop bounds are <=0.25 points for strongest/unique win and <=0.45 for tie. Flop values are visibly marked approximate. Opponents are uniformly random; betting behavior is not conditioned on.

## Size versus error

Full candidates are recorded in `data/offline-v1/candidates.json`. Model-only results include Q200:7.88 MB/0.25pp, Q255:8.40 MB/0.1961pp, Q256:9.73 MB/0.1953pp, Q500:11.84 MB/0.1pp, Q1000:14.31 MB/0.05pp. Q255 is the most precise tested candidate meeting the complete under-9-MB installation budget. Moving from Q255 to Q256 (256 to 257 levels) gains less than 0.0008pp but costs another 1.33 MB and exceeds that budget with the app. This is an engineering choice among measured candidates, not a claim of global optimality across all possible codecs.

For each state, unique win and strongest probabilities are rounded independently to Q255 integers. Other opponent counts are stored as nonnegative differences from the previous count. Nearest rounding has error <=1/(2Q); tie is their difference and has error <=1/Q. These are whole-domain bounds, not sampled model accuracy. The independent Python verifier checked **23,162,256 values**, covering every state, all six opponent counts, and all three metrics. Its report records actual worst cases, original compressed-source hashes, model/block hashes, and generator/verifier hashes.

## Format and reproduction

`OFP1`: Q u32, width u8, reserved u8, block count u16. Each of 169 directory records contains hero u16 and rows/offset/gzipBytes/rawBytes u32. A gzip block has 16-byte records: boardKey u32 and 12 u8 codes (opponent-1 win/strongest, then previous-minus-current for opponents 2–6). Key ordering, source alignment, bounds and monotonicity are checked.

```sh
clang++ -std=c++20 -O3 scripts/build-offline-flop.cpp -lz -o /tmp/build-offline-flop
/tmp/build-offline-flop /tmp/compact 255
python3 scripts/verify-offline-flop.py
npm test
```

Compare the generated `flop-q255.bin` with the committed model; do not overwrite exact sources. Gzip bytes can differ across zlib versions, so independently regenerated compressed output needs its own hash verification. A model replacement requires updating both runtime manifests to the new SHA.

## Installation, caching and CPU tradeoff

The service worker caches the app, Worker and model at installation. A content-SHA model URL permits later UI updates to copy the unchanged model from the previous cache instead of redownloading it. Startup reads the cached model once and transfers it to the Worker, which verifies its complete SHA. Later requests decompress resident blocks or calculate exact integer results. No per-state fetch or automatic download fallback exists. Initial installation failure produces an installation notice. Cache deletion requires online reinstallation; browser cache retention is not permanent storage.

HTTPS, service workers, Cache API, module Workers, BigInt and gzip DecompressionStream are required. The exact river kernel uses the preserved generator's 52 connected graph supports/homomorphism coefficients; turn sums 46 possible runouts. The separate flop category distribution enumerates 1,081 own-hand runouts exactly. Neither Monte Carlo nor heads-up exponentiation is used. CPU work replaces the large turn/river tables and runs off the UI thread.

In the browser QA environment, six-opponent flop took 7–8ms, turn 186–189ms and river 4ms, while at least 24 animation frames progressed. These are measurements, not performance guarantees for every iPhone. An owned preview server was shut down; cached-page reload, a fresh Worker, and all three probability queries still succeeded. The excluded QA page added only an inline test button calling the production API. CI also forbids fetch inside the real Worker, verifies startup cache-read-once behavior, reuses SHA-identical models, and preserves unrelated application caches.
