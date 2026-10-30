import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {canonicalFlop,readFlopCounts,createFlopLoader} from '../flop-probabilities.js';
import {evaluate,calculateEquity} from '../engine.js';
const root=new URL('../data/flop-v1/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',root)));
function arrayBuffer(raw){return raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength);}
function reference(hole,board){const used=new Set([...hole,...board]),deck=Array.from({length:52},(_,i)=>i).filter(c=>!used.has(c)),counts=Array(9).fill(0);for(let a=0;a<46;a++)for(let b=a+1;b<47;b++)counts[evaluate([...hole,...board,deck[a],deck[b]]).category]++;return counts;}
function permutations(a){if(!a.length)return [[]];return a.flatMap((v,i)=>permutations(a.filter((_,j)=>i!==j)).map(p=>[v,...p]));}
const perms=permutations([0,1,2,3]);
test('all 1,286,792 states have sorted keys, integer counts, exact total and matching hashes',async()=>{
 let states=0;assert.equal(Object.keys(manifest.shards).length,169);assert.equal(createHash('sha256').update(await readFile(new URL('../scripts/generate-flop.cpp',import.meta.url))).digest('hex'),manifest.generatorSha256);
 for(const [hero,entry] of Object.entries(manifest.shards)){
  const raw=await readFile(new URL(`${hero}.bin`,root)),view=new DataView(arrayBuffer(raw));assert.equal(createHash('sha256').update(raw).digest('hex'),entry.sha256);assert.equal(raw.length,8+entry.rows*22);assert.equal(raw.length,entry.bytes);assert.equal(view.getUint32(0,false),0x52524631);assert.equal(view.getUint32(4,true),entry.rows);
  let prev=-1;for(let row=0;row<entry.rows;row++){const offset=8+row*22,key=view.getUint32(offset,true);assert.ok(key>prev);prev=key;const cards=[Number(hero)>>6,Number(hero)&63,key>>12,(key>>6)&63,key&63];assert.equal(new Set(cards).size,5);assert.ok(cards.every(c=>c>=0&&c<52));assert.ok(cards[2]<cards[3]&&cards[3]<cards[4]);let sum=0;for(let c=0;c<9;c++)sum+=view.getUint16(offset+4+c*2,true);assert.equal(sum,1081);}states+=entry.rows;
 }
 assert.equal(states,1286792);
});
test('independent JS runout enumeration matches first/middle/last state of every shard',async()=>{
 for(const [hero,entry] of Object.entries(manifest.shards)){
  const buffer=arrayBuffer(await readFile(new URL(`${hero}.bin`,root))),view=new DataView(buffer),hole=[Number(hero)>>6,Number(hero)&63];
  for(const row of [0,Math.floor(entry.rows/2),entry.rows-1]){const key=view.getUint32(8+row*22,true),board=[key>>12,(key>>6)&63,key&63];assert.deepEqual(canonicalFlop(hole,board),{hero:Number(hero),flop:key});assert.deepEqual(readFlopCounts(buffer,key),reference(hole,board));}
 }
});
test('normalization ignores all suit names, hole order and board order',()=>{
 for(const cards of [[12,25,38,0,1],[0,1,2,3,4],[0,14,28,42,12],[12,11,10,9,8]]){
  const expected=canonicalFlop(cards.slice(0,2),cards.slice(2));
  for(const p of perms){const mapped=cards.map(c=>p[Math.floor(c/13)]*13+c%13);for(const board of permutations(mapped.slice(2)))assert.deepEqual(canonicalFlop(mapped.slice(0,2).reverse(),board),expected);}
 }
 assert.throws(()=>canonicalFlop([0,1],[0,2,3]));assert.throws(()=>canonicalFlop([0,1],[2,3,52]));
});
test('lookup fetches only required shards, deduplicates requests and limits memory cache to three',async()=>{
 const requests=[];
 const loader=createFlopLoader(async url=>{requests.push(url);const file=url.split('/').at(-1);if(file==='manifest.json')return {ok:true,json:async()=>manifest};const raw=await readFile(new URL(file,root));return {ok:true,arrayBuffer:async()=>arrayBuffer(raw)};});
 const hole=[0,1],board=[8,23,45];const [a,b]=await Promise.all([loader(hole,board),loader(hole,board)]);assert.deepEqual(a,b);assert.equal(a.categories.reduce((n,c)=>n+c.count,0),1081);assert.equal(a.equity,null);
 assert.equal(requests.length,2);await loader(hole,board);assert.equal(requests.length,2);
 for(const n of [2,3,4])await loader([0,n],board);await loader(hole,board);assert.equal(requests.filter(r=>r.endsWith('/1.bin')).length,2);assert.equal(requests.filter(r=>r.endsWith('/manifest.json')).length,1);
});
test('network and checksum failures stay explicit and permit later retries',async()=>{
 let fail=true;const loader=createFlopLoader(async url=>{if(fail)return {ok:false};if(url.endsWith('manifest.json'))return {ok:true,json:async()=>manifest};const raw=await readFile(new URL(url.split('/').at(-1),root));return {ok:true,arrayBuffer:async()=>arrayBuffer(raw)};});
 await assert.rejects(loader([0,1],[8,23,45]),/manifest unavailable/);fail=false;await loader([0,1],[8,23,45]);
 const corrupt=createFlopLoader(async url=>url.endsWith('manifest.json')?{ok:true,json:async()=>manifest}:{ok:true,arrayBuffer:async()=>{const raw=await readFile(new URL(url.split('/').at(-1),root));raw[20]^=1;return arrayBuffer(raw);}});
 await assert.rejects(corrupt([0,1],[8,23,45]),/checksum mismatch/);
 assert.throws(()=>readFlopCounts(new ArrayBuffer(8),1),/Invalid/);
});
test('river completion is a known category, not estimated opponent equity',()=>{
 const r=calculateEquity([12,25],[38,0,1,2,3],4);assert.equal(r.method,'static-river');assert.equal(r.equity,null);assert.equal(r.categories.filter(c=>c.probability===1).length,1);assert.equal(r.categories.reduce((n,c)=>n+c.probability,0),1);
});
