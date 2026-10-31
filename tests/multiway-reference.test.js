import test from 'node:test';import assert from 'node:assert/strict';import {countTwoOpponents,bruteForceTwoOpponents} from '../scripts/two-opponent-reference.mjs';
const c=s=>s.split(' ').map(x=>'23456789TJQKA'.indexOf(x[0])+'cdhs'.indexOf(x[1])*13);
test('two-opponent graph matching agrees with independent ordered disjoint-hand enumeration',()=>{
 const examples=[['2d 3h','Ac Kc Qc Jc Tc'],['Ac 3d','Kc Kd Kh Ks 2h'],['Ac Ad','Ah As 2c 3d 9h'],['7c 2d','Ac Kh Qd Js Tc']];
 let seed=91827;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const cases=examples.map(([h,b])=>[c(h),c(b)]);
 for(let n=0;n<20;n++){const deck=Array.from({length:52},(_,i)=>i);for(let j=0;j<7;j++){const k=j+Math.floor(random()*(52-j));[deck[j],deck[k]]=[deck[k],deck[j]];}cases.push([deck.slice(0,2),deck.slice(2,7)]);}
 for(const [hole,board] of cases){const {hands,own,...a}=countTwoOpponents(hole,board),b=bruteForceTwoOpponents(hole,board);assert.deepEqual(a,b);assert.equal(a.denominator,893970);assert.ok(a.wins<=a.strongest&&a.strongest<=a.denominator);assert.equal(a.wins+a.ties,a.strongest);}
});
test('joint first place counts all ties and correctly excludes card collisions',()=>{
 const royal=countTwoOpponents(c('2d 3h'),c('Ac Kc Qc Jc Tc'));assert.equal(royal.strongest,893970);assert.equal(royal.wins,0);assert.equal(royal.ties,893970);
 const quads=countTwoOpponents(c('Ac 3d'),c('Kc Kd Kh Ks 2h'));assert.equal(quads.strongest,893970);assert.equal(quads.wins,671580);
 assert.throws(()=>countTwoOpponents([0,1],[0,2,3,4,5]));
});
