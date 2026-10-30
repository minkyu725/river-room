import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {canonicalRiver,findRiverBoard,readRiverCounts,createRiverLoader} from '../river-probabilities.js';
import {canonicalStreet,readStreetCounts,createStreetLoader} from '../headsup-probabilities.js';import {preflopHeadsUp} from '../preflop-headsup-counts.js';import {preflopEquity} from '../preflop-equity.js';
import {evaluate,calculateEquity} from '../engine.js';import {exactEquity} from '../scripts/exact-equity.mjs';
const root=new URL('../data/river-hu-v1/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',root))),keyRaw=await readFile(new URL('keys.bin',root));const ab=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),keys=ab(keyRaw);
function decode(key,n=5){const b=Array(n);for(let i=n-1;i>=0;i--){b[i]=key%64;key=Math.floor(key/64);}return b;}
function holeAt(board,n){const d=Array.from({length:52},(_,i)=>i).filter(c=>!board.includes(c));for(let a=0;a<46;a++)for(let b=a+1;b<47;b++)if(n--===0)return [d[a],d[b]];}
function perms(a){return a.length?a.flatMap((v,i)=>perms(a.filter((_,j)=>i!==j)).map(p=>[v,...p])):[[]];}
const permutations=perms([0,1,2,3]);
test('all stored river counts have matching hashes, valid index and wins+ties <=990',async()=>{
 assert.equal(createHash('sha256').update(keyRaw).digest('hex'),manifest.keys.sha256);assert.equal(createHash('sha256').update(await readFile(new URL('../scripts/generate-river-hu.cpp',import.meta.url))).digest('hex'),manifest.generatorSha256);const kv=new DataView(keys);let previous=-1;for(let i=0;i<134459;i++){const k=kv.getUint32(8+i*4,true);assert.ok(k>previous);previous=k;}
 let rows=0;for(const [chunk,entry]of Object.entries(manifest.chunks)){const raw=await readFile(new URL(chunk+'.bin',root)),v=new DataView(ab(raw));assert.equal(createHash('sha256').update(raw).digest('hex'),entry.sha256);assert.equal(v.getUint32(0,false),0x52525731);assert.equal(v.getUint32(4,true),entry.start);assert.equal(v.getUint32(8,true),entry.boards);assert.equal(raw.length,entry.bytes);assert.equal(raw.length,12+entry.boards*2703);
  for(let b=0;b<entry.boards;b++)for(let h=0;h<1081;h++){const bit=h*20,o=12+b*2703+Math.floor(bit/8),v=(raw[o]|raw[o+1]<<8|raw[o+2]<<16)>>>(bit%8);if((v&1023)+((v>>>10)&1023)>990)assert.fail('Invalid river count');rows++;}
 }
 assert.equal(rows,145350179);
});
test('all flop and turn heads-up shards have exact integer bounds and hashes',async()=>{
 for(const street of ['flop','turn']){const dir=new URL(`../data/${street}-hu-v1/`,import.meta.url),m=JSON.parse(await readFile(new URL('manifest.json',dir))),size=street==='flop'?12:8;let states=0;assert.equal(createHash('sha256').update(await readFile(new URL('../scripts/derive-headsup.cpp',import.meta.url))).digest('hex'),m.generatorSha256);
  for(const [hero,e]of Object.entries(m.shards)){const raw=await readFile(new URL(hero+'.bin',dir)),v=new DataView(ab(raw));assert.equal(createHash('sha256').update(raw).digest('hex'),e.sha256);assert.equal(raw.length,e.bytes);assert.equal(v.getUint32(4,true),e.rows);assert.equal(raw.length,8+e.rows*size);let prev=-1;
   for(let i=0;i<e.rows;i++){const o=8+i*size,k=v.getUint32(o,true);assert.ok(k>prev);prev=k;const w=size===12?v.getUint32(o+4,true):v.getUint16(o+4,true),t=size===12?v.getUint32(o+8,true):v.getUint16(o+6,true);if(w+t>m.denominator)assert.fail('Invalid derived count');}states+=e.rows;
  }
  assert.equal(states,street==='flop'?1286792:13960050);
 }
});
test('river loader uses exact wins and ties; a royal board is 100% strongest, not 50%',async()=>{
 const requests=[];const loader=createRiverLoader(async url=>{requests.push(url);const file=url.split('/').at(-1);if(file==='manifest.json')return {ok:true,json:async()=>manifest};const raw=await readFile(new URL(file,root));return {ok:true,arrayBuffer:async()=>ab(raw)};});
 const hole=[13,27],board=[12,11,10,9,8],r=await loader(hole,board);assert.equal(r.wins,0);assert.equal(r.ties,990);assert.equal(r.strongest,1);assert.equal(r.equity,.5);
 await loader(hole.reverse(),board.reverse());assert.equal(requests.length,3);
 // K quads with an A kicker can only win or share first place.
 const q=await loader([12,14],[11,24,37,50,26]);assert.equal(q.wins+q.ties,990);assert.equal(q.strongest,1);
});
test('river normalization ignores suit names and card orders, including board stabilizers',async()=>{
 const hole=[12,25],board=[0,14,28,42,9],expected=canonicalRiver(hole,board),index=findRiverBoard(keys,expected.boardKey),raw=await readFile(new URL(Math.floor(index/128)+'.bin',root)),buffer=ab(raw),ref=readRiverCounts(buffer,index,expected.ordinal);
 for(const p of permutations){const map=c=>p[Math.floor(c/13)]*13+c%13,k=canonicalRiver(hole.map(map).reverse(),board.map(map).reverse());assert.equal(k.boardKey,expected.boardKey);assert.deepEqual(readRiverCounts(buffer,index,k.ordinal),ref);}
 assert.throws(()=>canonicalRiver([0,1],[0,2,3,4,5]));assert.throws(()=>readRiverCounts(new ArrayBuffer(0),0,0));
});
test('independent direct enumeration agrees with river and turn integer counts',async()=>{
 const kv=new DataView(keys);
 for(const index of [0,63,4096,20000,60000,134458]){const board=decode(kv.getUint32(8+index*4,true)),h=holeAt(board,540),raw=await readFile(new URL(Math.floor(index/128)+'.bin',root)),actual=readRiverCounts(ab(raw),index,540),r=exactEquity(h,board,1);assert.equal(actual.wins,Math.round(r.win*990));assert.equal(actual.ties,Math.round(r.tie*990));}
 for(const hero of [1,13,14,533,728,793]){const raw=await readFile(new URL(`../data/turn-hu-v1/${hero}.bin`,import.meta.url)),v=new DataView(ab(raw)),n=v.getUint32(4,true),key=v.getUint32(8+Math.floor(n/2)*8,true),board=decode(key,4),hole=[hero>>6,hero&63],r=exactEquity(hole,board,1),actual=readStreetCounts(ab(raw),key,'turn');assert.equal(actual.wins,Math.round(r.win*45540));assert.equal(actual.ties,Math.round(r.tie*45540));assert.deepEqual(canonicalStreet(hole,board),{hero,key});}
});
test('own exact preflop counts conserve symmetry and match independent historical rounded values',()=>{
 let weighted=0n;for(const [hero,row]of Object.entries(preflopHeadsUp)){const a=Number(hero)>>6,b=Number(hero)&63,weight=a%13===b%13?6:Math.floor(a/13)===Math.floor(b/13)?4:12;assert.equal(row.slice(3).reduce((a,b)=>a+b,0),2118760);assert.ok(row[0]+row[1]<=row[2]);weighted+=BigInt(weight)*(2n*BigInt(row[0])+BigInt(row[1]));
  const rank=c=>'23456789TJQKA'[c%13],rs=[a,b].sort((x,y)=>y%13-x%13),key=rs.map(rank).join('')+(a%13===b%13?'':Math.floor(a/13)===Math.floor(b/13)?'s':'o'),old=preflopEquity[key];assert.ok(Math.abs(row[0]/row[2]-old[1]/10000)<=.00005+1e-12);assert.ok(Math.abs(row[1]/row[2]-old[2]/10000)<=.00005+1e-12);
 }
 assert.equal(weighted,1326n*2097572400n);const r=calculateEquity([12,25],[],1);assert.equal(r.strongest,r.win+r.tie);assert.ok(r.strongest>r.equity);
});
test('street loader retries failures, verifies checksums, deduplicates and bounds cached shards',async()=>{
 const dir=new URL('../data/turn-hu-v1/',import.meta.url),m=JSON.parse(await readFile(new URL('manifest.json',dir))),requests=[];let broken=true;
 const loader=createStreetLoader('turn',async url=>{requests.push(url);if(broken)return {ok:false};const file=url.split('/').at(-1);return file==='manifest.json'?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>ab(await readFile(new URL(file,dir)))};});
 const hole=[0,1],board=[8,23,45,50];await assert.rejects(loader(hole,board));broken=false;const [a,b]=await Promise.all([loader(hole,board),loader(hole,board)]);assert.deepEqual(a,b);assert.equal(a.strongest,(a.wins+a.ties)/45540);assert.equal(requests.filter(p=>p.endsWith('/1.bin')).length,1);
 for(const n of [2,3,4])await loader([0,n],board);await loader(hole,board);assert.equal(requests.filter(p=>p.endsWith('/1.bin')).length,2);
 const corrupt=createStreetLoader('turn',async url=>url.endsWith('manifest.json')?{ok:true,json:async()=>m}:{ok:true,arrayBuffer:async()=>{const b=await readFile(new URL(url.split('/').at(-1),dir));b[10]^=1;return ab(b);}});await assert.rejects(corrupt(hole,board),/checksum/);
});
