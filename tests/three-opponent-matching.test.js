import test from 'node:test';import assert from 'node:assert/strict';import {graphStats,countThreeMatchings,countThreeAfterDeleting,bruteThreeMatchings} from '../scripts/three-opponent-matching.mjs';
const complete=n=>Array.from({length:n},(_,a)=>Array.from({length:n-a-1},(_,i)=>[a,a+i+1])).flat();
test('three-opponent graph formula agrees with brute matchings and exact complete-graph denominator',()=>{
 let seed=9184;const r=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let n=4;n<=12;n++)for(let example=0;example<30;example++){const density=r(),edges=complete(n).filter(()=>r()<density);assert.equal(countThreeMatchings(n,edges),bruteThreeMatchings(n,edges));}
 assert.equal(countThreeMatchings(45,complete(45)),990*903*820);assert.equal(countThreeMatchings(45,complete(45)),733055400);
});
test('O(vertices) hero-card deletion moments agree with rebuilding and directly enumerating remaining graph',()=>{
 let seed=5921;const r=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let n=4;n<=12;n++)for(let example=0;example<15;example++){const density=r(),edges=complete(n).filter(()=>r()<density),g=graphStats(n,edges);for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){const kept=Array.from({length:n},(_,i)=>i).filter(v=>v!==a&&v!==b),reduced=edges.filter(([u,v])=>kept.includes(u)&&kept.includes(v)).map(([u,v])=>[kept.indexOf(u),kept.indexOf(v)]),actual=countThreeAfterDeleting(g,a,b);assert.equal(actual,countThreeMatchings(n-2,reduced));assert.equal(actual,bruteThreeMatchings(n-2,reduced));}}
 assert.equal(countThreeAfterDeleting(graphStats(47,complete(47)),0,46),733055400);
});
