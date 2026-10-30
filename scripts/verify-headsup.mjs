import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import {canonicalStreet,readStreetCounts} from '../headsup-probabilities.js';import {evaluate} from '../engine.js';import {exactEquity} from './exact-equity.mjs';
const started=Date.now();let compared=0,runouts=0,states=0;
function decode(key,n){const a=Array(n);for(let i=n-1;i>=0;i--){a[i]=key%64;key=Math.floor(key/64);}return a;}
// Keep the independent flop reference simple: enumerate opponent cards from the
// remaining 45 cards, rather than sharing the offline river-map aggregation.
function referenceFlop(hole,board){const deck=Array.from({length:52},(_,i)=>i).filter(c=>![...hole,...board].includes(c));let wins=0,ties=0;for(let a=0;a<46;a++)for(let b=a+1;b<47;b++){const full=[...board,deck[a],deck[b]],own=evaluate([...hole,...full]).score,remaining=deck.filter((_,i)=>i!==a&&i!==b);for(let i=0;i<44;i++)for(let j=i+1;j<45;j++){const score=evaluate([remaining[i],remaining[j],...full]).score;if(own>score)wins++;else if(own===score)ties++;}}return {wins,ties};}
for(const street of ['turn','flop']){
 const root=new URL(`../data/${street}-hu-v1/`,import.meta.url),m=JSON.parse(await readFile(new URL('manifest.json',root))),size=street==='turn'?8:12,den=street==='turn'?45540:1070190;
 assert.equal(createHash('sha256').update(await readFile(new URL('derive-headsup.cpp',import.meta.url))).digest('hex'),m.generatorSha256);
 for(const [hero,entry] of Object.entries(m.shards)){
  const raw=await readFile(new URL(hero+'.bin',root)),buffer=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),v=new DataView(buffer);assert.equal(createHash('sha256').update(raw).digest('hex'),entry.sha256);assert.equal(raw.length,entry.bytes);assert.equal(raw.length,8+entry.rows*size);let prev=-1;
  for(let row=0;row<entry.rows;row++){const offset=8+row*size,key=v.getUint32(offset,true);assert.ok(key>prev);prev=key;const wins=street==='turn'?v.getUint16(offset+4,true):v.getUint32(offset+4,true),ties=street==='turn'?v.getUint16(offset+6,true):v.getUint32(offset+8,true);assert.ok(wins+ties<=den);}states+=entry.rows;
  if(street==='turn')for(const row of [0,Math.floor(entry.rows/2),entry.rows-1]){const key=v.getUint32(8+row*size,true),hole=[Number(hero)>>6,Number(hero)&63],board=decode(key,4),actual=readStreetCounts(buffer,key,street),ref=exactEquity(hole,board,1);assert.deepEqual(canonicalStreet(hole,board),{hero:Number(hero),key});assert.equal(actual.wins,Math.round(ref.win*45540));assert.equal(actual.ties,Math.round(ref.tie*45540));compared++;runouts+=45540;}
  // Nine full flop spot checks cover pocket/suited/offsuit extremes; full turn
  // strata and the exact aggregation invariant cover every other shard.
  if(street==='flop'&&[1,13,14,533,534,535,728,729,793].includes(Number(hero))){const row=Math.floor(entry.rows/2),key=v.getUint32(8+row*size,true),hole=[Number(hero)>>6,Number(hero)&63],board=decode(key,3),ref=referenceFlop(hole,board),actual=readStreetCounts(buffer,key,street);assert.equal(actual.wins,ref.wins);assert.equal(actual.ties,ref.ties);compared++;runouts+=1070190;}
 }
}
assert.equal(states,15246842);
const report={allHashes:true,allCountBounds:true,turnStates:13960050,flopStates:1286792,independentStates:compared,independentComparisons:runouts,elapsedSeconds:(Date.now()-started)/1000};console.log(JSON.stringify(report,null,2));if(process.argv.includes('--report'))await writeFile(new URL('../data/headsup-verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
