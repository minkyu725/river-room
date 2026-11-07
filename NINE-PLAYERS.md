# 8–9 player bounded offline probabilities

Existing exact 1–6 opponent results and old compact model are unchanged. New opponent counts 7 and 8 are explicitly **bounded approximations**, not exact new enumeration and not simulation or a power of heads-up probability.

After choosing the final board, 45 unknown cards remain. Uniformly pair 44 of them into 22 labeled opponent slots, leaving one unused. Let X be the number of these slots whose hands do not beat the hero. Exchangeability gives P_k = E[choose(X,k)/choose(22,k)] for every k, including averaging over unknown board runouts. Replacing “do not beat” with “strictly lose” gives unique wins in the same way.

Approximate the degree-7 or degree-8 target on the finite domain X=0…22 by a degree-six polynomial in the same binomial basis. Exact rational coefficients and residuals are in data/nine-v1/verification.json and moment-extension.js. A pointwise bound on all 23 values implies the same bound for **every** possible distribution of X, therefore for all legal card states. This does not require a held-out statistical sample.

Uniform computational probability errors before quantization: 7 opponents ≤0.034829722 percentage points, 8 opponents ≤0.141314757 points. This uses the unquantized exact moments; applying the formula to previously quantized moments would amplify errors and is deliberately avoided. Values are clipped to [0,P6], unique win≤strongest, and the 8-opponent estimate≤7-opponent estimate. Since true probabilities obey those constraints and the 8-opponent bound is larger, these projections preserve the stated bounds. All-zero/all-one exact endpoints are preserved.

Preflop: all 169 classes × both new counts generated into preflop-nine.js. Flop: all 1,286,792 canonical states × both new counts generated from original six exact tables; nearest Q255 quantization adds ≤0.196078432 points per win/strongest value. The extra model is 1,883,546 bytes, compressed into 169 blocks with original row order. Original model remains 8,397,454 bytes. Initial model payload is ~10.28 MB, whole cached app ~10.6 MB. No probability queries fetch files after installation.

Turn and river: Worker obtains exact first six moments locally and applies the bounded formula. They are approximate only for the two new opponent counts. Existing 1–6 opponent turn/river calculations remain exact. Turn work can take longer on older phones; it stays off the UI thread.

Including 0.1%-precision display rounding, uniform strongest/unique-win bounds:

| Opponents | Preflop/turn/river | Flop | Flop ties |
|---|---:|---:|---:|
| 7 | ±0.09%p | ±0.29%p | ±0.52%p |
| 8 | ±0.20%p | ±0.39%p | ±0.73%p |

UI conservatively uses ±0.4%p strongest and ±0.73%p ties for all 8–9-player streets. Existing 2–7-player bounds are unchanged.

Reproduce with:

```
c++ -std=c++20 -O3 scripts/build-nine-flop.cpp -lz -o /private/tmp/build-nine
/private/tmp/build-nine
node scripts/build-nine-preflop.mjs
python3 scripts/verify-nine.py
npm test
```

Independent Python verifier checks rational residuals exactly on the whole 23-point domain, hashes every preserved input, and compares every new encoded probability against independently decoded original exact counts. Existing full verifier still covers the original Q255 model. An independent small-graph matching oracle additionally checks the extension against actual 7/8-opponent results, with exhaustive induced-subset matching counts.

## Three modes and strategy assumptions

Home page always offers Play / Quiz / In-game. Play is loaded on entry and paused when leaving. Quiz scores persist locally. The in-game open book supports 169 preflop classes, exact card entry across four streets, 2–9 total players, and duplicate-card prevention. No hidden/dead cards or opponent betting ranges are conditioned on.

The all-in quiz compares exact heads-up chip EV(call)=pot share×(pot before call+call)−call versus EV(fold)=0. The opponent is explicitly uniform random; ties split equally, there is no future betting, rake or ICM. “Strongest” probability is not used as pot share. This is a genuine maximum-EV choice within those two allowed actions under the stated model.

The first-in quiz uses the factual 100BB core/mixed open range notation from https://syup5.github.io/holdem_strategy_preflop/ (accessed 2026-11-08). Ahead players have all folded, behind-count and position are given; core raises, mixed accepts raise/fold, outside folds. This is explicitly a simplified chart exercise, not a claim of universal solver optimality. Only the first-in chart data was adapted; reference software/UI/equity assets were not copied. Link attribution is present in both new modes.
