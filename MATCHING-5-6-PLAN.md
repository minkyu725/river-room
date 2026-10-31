# Candidate exact joint stage5/6 algorithm — UNIMPLEMENTED, must prove/verify

Goal: compute both remaining matching coefficients m5,m6 from <=52 small connected graph homomorphism counts, reusing threshold graph stats and O(47^2) Hero deletion. Avoid manually deriving I5/I6 motifs or sampling. All future ideas below require independent small-graph tests and native prefix reconstruction tests. Do not claim achieved from this note.

## Universal coefficient generation

Z_G(z)=sum m_j(G) z^j (unlabeled matchings, m0=1). Define c_k=k*[z^k]log Z. Integer recurrence c_k=k*m_k - sum_(i=1..k-1) c_i*m_(k-i); invert to recover m_k exactly by /k.

For each connected simple support F with <=6 edges, define a(F,k)=sum_(S subset E(F))(-1)^(e-|S|)*c_k(Z_(V(F),S)). Tiny F has <=6 edges so brute matching subsets at most64. Edge-support Mobius inversion yields c_k(G)=sum_F a(F,k)*copies(F,G). Disconnected support coefficient is zero since log Z is additive. Supports with >k edges have zero coefficient.

copies(F,G)=inj(F,G)/Aut(F). Compute inj via vertex-partition Mobius: sum_pi mu(pi)*hom(F/pi,G), mu(pi)=product_blocks (-1)^(|block|-1)(|block|-1)!. Looped quotient =>0; parallel edges collapse (simple adjacency 0/1). Quotients remain connected simple graphs <=6 edges, <=7 vertices, so within same catalogue.

Generate catalogue by starting K2 and adding nonedge between existing vertices or a new leaf; canonicalize by degree-group sorted permutations (n<=7; only <=720 equal-degree perms common). Expected connected counts by edge count1..6:1,1,3,5,12,30 (total52), but verify construction; no external dataset required. Aut(F) obtained by all n! perms preserving adjacency. Aut divides7!=5040. Combine coefficients into integer B[k,Q]=sum_F (5040/Aut(F))*a(F,k)*sum_(pi quotient Q)mu(pi).
Then c_k(G)=sum_Q B[k,Q]*hom(Q,G)/5040; assert exact division. Compute coefficients in BigInt/codegen; evaluate in signed __int128 (individual weighted hom terms can exceed uint64). Recover m1..6 by recurrence, assert /k exact and nonnegative. Multiply m5 by120, m6 by720 for labeled opponents. River counts fit uint64; upper aggregation/preflop requires uint128.

Validate universal identity using a SLOW generic hom solver for small host graphs (treewidth elimination / brute n^|V(F)| small n) and independent exact vertex-subset matching polynomial DP (n<=12..16, memo induced vertex mask). Direct subset-edge matchings fine on tiny supports. Test empty/dense/random and all k<=6. Then implement fast hom catalogue and compare to slow hom individually before native all-state generation.

## Fast hom counts (all 52 supports)

Catalogue comprises trees (25 total across e<=6), unicyclic (21), bicyclic e5 diamond + e6 five patterns, K4 e6. Tree hom DP: for rooted form, f(v)=product_child [A f_child](v), total sum f. Root each unrooted tree at center; for <=7 vertices child component <=3 vertices. Only child-message vectors needed: d=A1, S=A d, S2=A d^2, AS=A^2 d. Thus full rooted-tree/attached-branch f are products of these; no large tensor contraction needed.

Unicyclic supports: peel attached trees, leaving cycle length3..6. At most3 attached edges overall. Compute root weight vectors f on cycle anchors from tree messages; most weights=1. Let C=A^2, P=A^3, B=A diag(d) A.
- triangle no weights:trace P; one weighted anchor f:sum_u f_u P_uu.
- triangle two weighted anchors f,g (third1):sum_(u,v) Auv f_u g_v Cuv.
- triangle all3 weighted: only case f=g=h=d (one leaf each), sum_uv Auv d_u d_v Buv.
- cycle4 no weights:sum_uv Cuv^2; one anchor f:sum_uv f_u Cuv^2.
- cycle4 two leaves at adjacent anchors:sum_uv Auv d_u d_v Puv.
- cycle4 two opposite leaves:sum_uv d_u d_v Cuv^2.
- cycle5 no weights:sum_uv Cuv Puv; one leaf:sum_uv d_u Cuv Puv.
- cycle6 no weights:sum_uv Puv^2.
Sums over ordered u,v (including diagonals unless Auv factor zeros them). Roles refer to labeled pattern vertices, so automorphism division only in universal coefficient generation, never accidentally divide hom counts.

Bicyclic supports:
- diamond e5:sum_uv Auv Cuv^2.
- diamond+leaf at degree3 core vertex:sum_uv Auv d_u Cuv^2.
- diamond+leaf at degree2 core vertex:sum_uv Auv Cuv Buv.
- bowtie (two triangles sharing root):sum_u P_uu^2.
- house (triangle+square sharing edge):sum_uv Auv Cuv Puv.
- K2,3:sum_uv Cuv^3 (diagonals allowed).
- K4:hom=24*#K4. Use threshold global/vertex clique4 stats and deletion below instead of per-state enumeration.

All weighted cycle sums can be fused in a small number of O(n^2) loops. Root tree messages are cheap; A2d=A*S may take O(n^2). Scalar tree hom counts O(n) per pattern. Precompute catalogue expression descriptors and verify against generic hom on small graphs.

## Threshold stats and O(n^2) two-Hero deletion

Retain existing FourGraph immutable (published source fingerprints). New graph extends it with P=A^3, B=A diag(D) A, global K4 and per-vertex K4.

For remaining i,j after deleting a,b, e=Aab:
C'_ij=Cij - Aia*Aaj - Aib*Abj.
P'_ij=Pij - Aia*Caj - Aib*Cbj - Cia*Aaj - Cib*Abj + e*(Aia*Abj+Aib*Aaj).
B'_ij=Bij -(Da-e)*Aia*Aaj -(Db-e)*Aib*Abj - popcount(adj[i]&adj[j]&adj[a]) - popcount(adj[i]&adj[j]&adj[b]).
D'_v=Dv-Ava-Avb. Zero deleted rows/cols; isolated deleted vertices don't affect hom of connected patterns with an edge. Avoid including them in sums of degree0 root-isolate pattern (catalogue has no isolate support).
S'_v = S_v -Ava*Da-Avb*Db -(Cva+Cvb-e*(Ava+Avb)).
S2'_v = S2_v -Ava*Da^2-Avb*Db^2 -2*(Bva+Bvb-e*(Ava*Db+Avb*Da)) +(Cva+Cvb-e*(Ava+Avb)) +2*popcount(adj[v]&adj[a]&adj[b]).
Compute AS'=A' S' in O(n^2). Build remaining weight vectors and hom sums.

K4'=K4total-K4a-K4b+e*K4edge(a,b), where K4edge=#edges among common neighbors(a,b). Compute that one value O(n) popcounts: sum_w in common popcount(adj[w]&common)/2. Then homK4=24*K4'.

## Inserting a NONEDGE ab (old stats before calling FourGraph::insert)

P update expansion A'^3-A^3:
- for all i,j add Aia*Abj+Aib*Aaj (outer products).
- column b += old C_col a; column a += old C_col b.
- row a += old C_row b; row b += old C_row a.
- column/row a += old adj column/row a, similarly b (A Delta^2 + Delta^2 A).
- Pab++, Pba++ (Delta^3). Delta A Delta=0 for nonedge ab and zero diagonals.
All old adjacency/common values; combine updates without accidentally rereading changed P (P is only target).

B update expansion A'D'A':
- add outer(adj col a,adj col a) + outer(adj col b,adj col b) (degree changes).
- row/column a += (Db+1)*old adjacency row/column b.
- row/column b += (Da+1)*old adjacency row/column a.
- Baa += Db+1; Bbb += Da+1.

K4 insertion: common mask=adj[a]&adj[b]. For each v in common, count popcount(adj[v]&common); add that to per-vertex K4[v]. Sum counts/2=new cliques. Add to global and K4[a],K4[b]. Then call FourGraph::insert for earlier moments.

Verify incremental P/B/clique4 against complete rebuild after each small/random prefix, plus Hero deletion matrices vs actual induced graph. Only then full native generation.

Performance target: O(47^2) insertion and per-Hero hom eval, 145m rows. Could take minutes to hours; benchmark bounded chunks. Parallel independent boards/chunks at conservative worker count if useful, no duplicated processes. Generate 5/6 jointly since coefficients reuse hom counts, but publish full stage5 first, then stage6 (UI7 required). Keep durable checksummed chunks and live process/session handles. User permits continued calculation/quota reset, not credits/API spending.

Storage: stage4 Pages ~844MB. Measure stage5/6 gzip sizes. Consider additional lossless encoding or immutable commit-pinned raw data URLs in SAME already-public GitHub repo (see the source-only delivery/storage notes in the local checkpoint), no new service/permission/cost. Verify primary GitHub docs/actual CORS/cache if using. No silent lossy probability substitution.
