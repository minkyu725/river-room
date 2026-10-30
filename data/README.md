# Generated exact flop category probabilities

`flop-v1/` contains all 1,286,792 suit-isomorphic states for a two-card hero hand and a three-card flop. Each state exhaustively enumerates the C(47,2)=1,081 unordered turn/river runouts. This is a **final hand-category distribution**, independent of opponent count. It is not showdown win probability or conditional equity.

All numbers were generated locally with the repository-owned C++ source; no external probability dataset or evaluator is used for these files. The classifier uses independent suit/rank bit masks rather than engine.js's grouped-rank evaluator. Card encoding is `suit*13 + rank-2`, with clubs/diamonds/hearts/spades at suits 0/1/2/3.

## Reproduce

```sh
clang++ -O3 -std=c++17 -march=native scripts/generate-flop.cpp -o /tmp/river-flop
/tmp/river-flop --selftest
/tmp/river-flop data/flop-v1
python3 scripts/build-flop-manifest.py
node scripts/verify-flop.mjs --full-shard --report
npm test
```

The generator writes each shard to a temporary file and renames it only after completion. On restart it skips complete files with the expected size. The manifest builder rechecks ordering and every count total; the verifier checks all SHA-256 hashes. To deliberately regenerate existing files, use a new output directory, compare hashes, and replace only after verification. A generation run on this task's machine completed in 11.14 seconds; this is a measurement for this compiler/hardware, not a guarantee for other machines.

## Format

Each canonical hole-card key has one `<hero>.bin` shard. For each of the 24 suit permutations, sort the mapped hole cards and board cards separately. Minimize `(heroKey * 262144 + boardKey)` lexicographically, where `heroKey=h0*64+h1` and `boardKey=b0*4096+b1*64+b2`. Hole/board order and suit names therefore do not change the lookup.

- Four bytes ASCII `RRF1`.
- Four bytes little-endian uint32 record count.
- Records sorted by board key: uint32 board key, then nine little-endian uint16 category counts in engine.names order.
- Record size 22 bytes. Each count is 0..1081 and the sum is exactly 1081.
- 169 shards, 28,310,776 bytes including keys and headers. `manifest.json` records row counts, byte lengths, hashes, encoding and generator-source hash.

`verification.json` records the independent full representative shard plus first/middle/last rows of every shard: 4,998 states, 5,402,838 runouts. Every state in the dataset is checked for count sum and key ordering. The C++ classifier also passed exhaustive known distributions of all 2,598,960 five-card and 133,784,560 seven-card hands. CI repeats all record/hash checks and first/middle/last JavaScript cross-checks for all 169 shards.

## Runtime

The app normalizes the actual cards and fetches only the required hero shard. A SHA-256 check and binary search precede display. Concurrent requests are deduplicated, stale results cannot overwrite later streets/hands, and memory holds at most three shards. Large tables are excluded from service-worker install and its unbounded asset cache. A shard needs a successful network/HTTP-cache load; unavailable data is explicitly reported rather than calculated or estimated during play.

Turn category probabilities and postflop opponent equities are separate future datasets. River category probabilities reuse the already-known hand category (one category at 100%).
