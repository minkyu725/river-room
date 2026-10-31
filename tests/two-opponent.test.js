import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';import {createTwoOpponentLoader,readTwoRiverCounts,readTwoStreetCounts} from '../two-opponent-probabilities.js';import {calculateEquity} from '../engine.js';import {preflopTwo} from '../preflop-two-counts.js';import {bruteForceTwoOpponents} from '../scripts/two-opponent-reference.mjs';
const ab=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),hash=b=>createHash('sha256').update(b).digest('hex'),file=p=>readFile(new URL('../'+p,import.meta.url)),json=async p=>JSON.parse(await file(p));
const c=s=>s.split(' ').map(x=>'23456789TJQKA'.indexOf(x[0])+'cdhs'.indexOf(x[1])*13);
const local=async url=>{const path=url.replace(/^\.\//,'');if(path.endsWith('.json'))return {ok:true,json:()=>json(path)};return {ok:true,arrayBuffer:async()=>ab(await file(path))};};
test('all compressed two-opponent artifacts match independently verified bytes and full-state reports',async()=>{
 const rv=await json('data/river-two-verification.json'),sv=await json('data/two-street-verification.json');assert.equal(rv.riverStates,145350179);assert.equal(rv.independentlyEnumeratedStates,1051);assert.equal(sv.bruteOpponentDeals,966381570);assert.equal(sv.preflopSha256,hash(await file('data/preflop-two-counts.json')));
 for(const street of ['river','turn','flop']){const root=`data/${street}-two-v1/`,manifest=await file(root+'manifest.json'),m=JSON.parse(manifest),proof=street==='river'?rv.manifestSha256:sv.streets[street].manifestSha256;assert.equal(hash(manifest),proof);assert.equal(m.generatorSha256,hash(await file(street==='river'?'scripts/generate-river-two.cpp':'scripts/derive-two.cpp')));let rows=0;
  for(const [key,e]of Object.entries(m.chunks??m.shards)){const packed=await file(root+key+'.bin.gz');assert.equal(packed.length,e.bytes);assert.equal(hash(packed),e.sha256);const raw=gunzipSync(packed);assert.equal(raw.length,e.rawBytes);assert.equal(hash(raw),e.rawSha256);rows+=street==='river'?raw.readUInt32LE(8)*1081:raw.readUInt32LE(4);}
  assert.equal(rows,street==='river'?145350179:street==='turn'?13960050:1286792);
 }
});
test('two-opponent preflop all 169 classes are exact, symmetric and no stronger than heads-up',()=>{
 assert.equal(Object.keys(preflopTwo).length,169);for(const [k,row]of Object.entries(preflopTwo)){const hole=[Number(k)>>6,Number(k)&63],r=calculateEquity(hole,[],2),h=calculateEquity(hole,[],1);assert.equal(r.denominator,1894107877200);assert.equal(r.equity,null);assert.equal(r.win,row[0]/row[2]);assert.equal(r.tie,row[1]/row[2]);assert.equal(r.strongest,(row[0]+row[1])/row[2]);assert.ok(r.strongest<=h.strongest);assert.deepEqual(calculateEquity(hole.map(c=>(c+13)%52).reverse(),[],2),r);}
});
test('compressed two-opponent loader is exact for ties, card collisions and all postflop streets',async()=>{
 const load=createTwoOpponentLoader(local),hole=c('Ac 3d'),board=c('Kc Kd Kh Ks 2h'),r=await load(hole,board),reference=bruteForceTwoOpponents(hole,board);assert.equal(r.wins,reference.wins);assert.equal(r.ties,reference.ties);assert.equal(r.strongest,1);assert.equal(r.wins,671580);
 const royal=await load(c('2d 3h'),c('Ac Kc Qc Jc Tc'));assert.equal(royal.strongest,1);assert.equal(royal.win,0);assert.equal(royal.tie,1);
 for(const n of [3,4]){const b=c('2c 7d 9h Js').slice(0,n),h=c('Ac Kd'),r=await load(h,b);assert.equal(r.denominator,n===3?966381570:41122620);assert.deepEqual(await load(h.map(c=>(c+13)%52).reverse(),b.map(c=>(c+13)%52).reverse()),r);}
 assert.throws(()=>readTwoRiverCounts(new ArrayBuffer(0),0,0));assert.throws(()=>readTwoStreetCounts(new ArrayBuffer(0),0,'flop'));
});
test('compressed loader retries, checks integrity, deduplicates and bounds cache to three shards',async()=>{
 const requests=[];let broken=true;const load=createTwoOpponentLoader(async url=>{requests.push(url);return broken?{ok:false}:local(url);}),hole=[0,1],board=[8,23,45,50];await assert.rejects(load(hole,board));broken=false;const [a,b]=await Promise.all([load(hole,board),load(hole,board)]);assert.deepEqual(a,b);assert.equal(requests.filter(p=>p.endsWith('/1.bin.gz')).length,1);for(const n of [2,3,4])await load([0,n],board);await load(hole,board);assert.equal(requests.filter(p=>p.endsWith('/1.bin.gz')).length,2);
 const corrupt=createTwoOpponentLoader(async url=>{const response=await local(url);if(url.endsWith('.gz')){const bytes=new Uint8Array(await response.arrayBuffer());bytes[12]^=1;return {ok:true,arrayBuffer:async()=>bytes.buffer};}return response;});await assert.rejects(corrupt(hole,board),/integrity/);
});
test('Pages packaging includes every application module dependency',async()=>{
 const workflow=await file('.github/workflows/pages.yml'),copied=new Set(workflow.toString().match(/cp (.+) _site\//)[1].split(/\s+/)),seen=new Set();
 async function check(name){if(seen.has(name))return;seen.add(name);assert.ok(copied.has(name),`Pages packaging omits ${name}`);const source=(await file(name)).toString();for(const m of source.matchAll(/from ['"]\.\/([^'"?]+)(?:\?[^'"]*)?['"]/g))await check(m[1]);}
 await check('app.js');
});
