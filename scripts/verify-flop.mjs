import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluate} from '../engine.js';
import {canonicalFlop,readFlopCounts} from '../flop-probabilities.js';
import assert from 'node:assert/strict';
const manifest=JSON.parse(await readFile(new URL('../data/flop-v1/manifest.json',import.meta.url)));
let states=0,compared=0;
const started=Date.now();
function reference(hole,board){const used=new Set([...hole,...board]),deck=Array.from({length:52},(_,i)=>i).filter(c=>!used.has(c)),counts=Array(9).fill(0);for(let a=0;a<46;a++)for(let b=a+1;b<47;b++)counts[evaluate([...hole,...board,deck[a],deck[b]]).category]++;return counts;}
for(const [hk,entry] of Object.entries(manifest.shards)){
 const raw=await readFile(new URL(`../data/flop-v1/${hk}.bin`,import.meta.url)),buffer=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),view=new DataView(buffer);
 assert.equal(createHash('sha256').update(raw).digest('hex'),entry.sha256);assert.equal(raw.length,entry.bytes);assert.equal(view.getUint32(4,true),entry.rows);
 let previous=-1;
 for(let row=0;row<entry.rows;row++){const key=view.getUint32(8+row*22,true);assert.ok(key>previous);previous=key;const counts=readFlopCounts(buffer,key);assert.equal(counts.reduce((a,b)=>a+b,0),1081);
  if((process.argv.includes('--full-shard')&&hk==='1')||[0,Math.floor(entry.rows/2),entry.rows-1].includes(row)){
   const hole=[Number(hk)>>6,Number(hk)&63],board=[key>>12,(key>>6)&63,key&63];assert.deepEqual(canonicalFlop(hole,board),{hero:Number(hk),flop:key});assert.deepEqual(counts,reference(hole,board));compared++;
  }
 }
 states+=entry.rows;
}
assert.equal(states,1286792);assert.equal(Object.keys(manifest.shards).length,169);
const report={states,shards:169,denominator:1081,allRecordSums:true,allSha256:true,independentJsStates:compared,independentJsRunouts:compared*1081,fullRepresentativeShard:process.argv.includes('--full-shard'),elapsedSeconds:(Date.now()-started)/1000};
console.log(JSON.stringify(report,null,2));if(process.argv.includes('--report'))await writeFile(new URL('../data/flop-v1/verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
