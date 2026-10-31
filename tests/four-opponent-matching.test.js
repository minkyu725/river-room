import test from 'node:test';import assert from 'node:assert/strict';import {stats4,countFour,countFourDeleting,bruteFour} from '../scripts/four-opponent-matching.mjs';
test('four-opponent exact formula and O(vertices) hero deletion agree with direct matching enumeration',()=>{
const full=n=>Array.from({length:n},(_,a)=>Array.from({length:n-a-1},(_,i)=>[a,a+i+1])).flat();let seed=21904;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};let cases=0;
for(let n=4;n<=14;n++)for(let sample=0;sample<15;sample++){const density=random(),edges=full(n).filter(()=>random()<density);assert.equal(countFour(n,edges),bruteFour(n,edges));const g=stats4(n,edges);for(let attempt=0;attempt<4;attempt++){const a=Math.floor(random()*n);let b=Math.floor(random()*(n-1));if(b>=a)b++;const keep=Array.from({length:n},(_,i)=>i).filter(v=>v!==a&&v!==b),reduced=edges.filter(([u,v])=>keep.includes(u)&&keep.includes(v)).map(([u,v])=>[keep.indexOf(u),keep.indexOf(v)]);assert.equal(countFourDeleting(g,a,b),bruteFour(n-2,reduced));cases++;}}
assert.equal(countFour(45,full(45)),733055400*741);assert.equal(countFourDeleting(stats4(47,full(47)),0,46),733055400*741);assert.equal(cases,660);

});
