import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluate,equity,settle,shuffled,botDecision} from '../engine.js';
const c=s=>s.split(' ').map(x=>'23456789TJQKA'.indexOf(x[0])+'cdhs'.indexOf(x[1])*13);
test('nine hand categories in ascending order',()=>{const hands=['Ac Jd 9h 7s 5c 3d 2h','Ac Ad 9h 7s 5c 3d 2h','Ac Ad 9h 9s 5c 3d 2h','Ac Ad Ah 7s 5c 3d 2h','Ac 2d 3h 4s 5c 9d Jh','Ac Jc 9c 7c 5c 3d 2h','Ac Ad Ah 7s 7c 3d 2h','Ac Ad Ah As 5c 3d 2h','Ac 2c 3c 4c 5c 9d Jh'];let prev=-1;hands.forEach((h,i)=>{const e=evaluate(c(h));assert.equal(e.category,i);assert.ok(e.score>prev);prev=e.score;});});
test('two trips form full house; flush uses best five',()=>{assert.equal(evaluate(c('Ac Ad Ah Ks Kc Kd 2h')).score,evaluate(c('Ac Ad Ah Ks Kc')).score);assert.equal(evaluate(c('Ac Kc Jc 9c 7c 2c 4h')).score,evaluate(c('Ac Kc Jc 9c 7c')).score);});
test('wheel and kicker ordering',()=>{assert.ok(evaluate(c('2c 3d 4h 5s 6c')).score>evaluate(c('Ac 2d 3h 4s 5c')).score);assert.ok(evaluate(c('Ac Ad Kh 7s 5c')).score>evaluate(c('Ac Ad Qh 7s 5c')).score);});
test('royal board splits equity; unbeatable quads wins',()=>{assert.equal(equity(c('2d 3h'),c('Ac Kc Qc Jc Tc'),3,100).equity,.25);assert.equal(equity(c('Ac Ad'),c('Ah As 2c 3d 9h'),2,100).equity,1);});
test('shuffle preserves 52 unique cards',()=>assert.equal(new Set(shuffled()).size,52));
test('side pots include folded contributions and conserve chips',()=>{const ps=[{hole:c('Ac Ad'),total:100},{hole:c('Kc Kd'),total:300},{hole:c('Qc Qd'),total:300},{hole:c('Jc Jd'),total:200,folded:true}];assert.deepEqual(settle(ps,c('2c 4d 6h 8s Th')).payouts,[400,500,0,0]);});
test('split pot and unmatched contribution refund',()=>assert.deepEqual(settle([{hole:c('2d 3d'),total:101},{hole:c('4d 5d'),total:60}],c('Ac Kc Qc Jc Tc')).payouts,[101,60]));
test('bot can randomly bluff using only own cards',()=>{const d=botDecision({hole:c('2d 7h'),board:[],opponents:1,call:0,stack:1000,pot:40,current:20,bet:20,minRaise:20,aggression:1,bluffRate:1,heroAggression:0,heroBluffs:0,canRaise:true},()=>0);assert.equal(d.type,'raise');assert.equal(d.reason,'블러프 레이즈');});

function seeded(){let n=12345;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
test('category probabilities sum to one and weighted equity matches total equity',()=>{
 for(const board of [[],c('2c 7h Jd'),c('2c 7h Jd 9s Tc')]){const result=equity(c('Ac Kd'),board,3,1200,seeded(),true);assert.equal(result.categories.length,9);assert.equal(result.categories.reduce((n,b)=>n+b.samples,0),1200);assert.ok(Math.abs(result.categories.reduce((n,b)=>n+b.probability,0)-1)<1e-12);assert.ok(Math.abs(result.categories.reduce((n,b)=>n+b.probability*(b.equity??0),0)-result.equity)<1e-12);for(const bucket of result.categories)assert.ok(bucket.samples?bucket.equity>=0&&bucket.equity<=1:bucket.equity===null);}
});
test('royal board has only straight flush, with shared-pot conditional equity',()=>{
 const result=equity(c('2d 3h'),c('Ac Kc Qc Jc Tc'),3,100,seeded(),true);assert.equal(result.categories[8].probability,1);assert.equal(result.categories[8].equity,.25);assert.ok(result.categories.slice(0,8).every(b=>b.samples===0&&b.equity===null));
});
test('uncontested category distribution remains available without opponents',()=>{
 const result=equity(c('Ac Ad'),[],0,100,seeded(),true);assert.equal(result.equity,1);assert.equal(result.categories.reduce((n,b)=>n+b.samples,0),100);assert.ok(result.categories.filter(b=>b.samples).every(b=>b.equity===1));
});
