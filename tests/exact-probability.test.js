import test from 'node:test';import assert from 'node:assert/strict';import {exactPercent,bigProbability} from '../exact-probability.js';import {readFile} from 'node:fs/promises';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';
test('display rounding preserves rational precision beyond safe Number integers',()=>{
 const d=1000000000000000000n;assert.equal(exactPercent(500499999999999999n,d),'50.0');assert.equal(exactPercent(500500000000000000n,d),'50.1');assert.equal(exactPercent(1,3),'33.3');assert.equal(exactPercent(0,d),'0.0');assert.equal(exactPercent(d,d),'100.0');assert.throws(()=>exactPercent(1,0));assert.throws(()=>bigProbability(2,1,2));const p=bigProbability('500499999999999999','1',String(d));assert.equal(p.wins,500499999999999999n);assert.equal(p.denominator,d);assert.equal(exactPercent(p.wins+p.ties,p.denominator),'50.1');
});
test('all legacy heads-up gzip files restore the previously verified exact bytes',async()=>{
 const hash=b=>createHash('sha256').update(b).digest('hex');let files=0;
 for(const street of ['river','turn','flop']){const root=new URL(`../data/${street}-hu-v1/`,import.meta.url),original=await readFile(new URL('manifest.json',root)),m=JSON.parse(await readFile(new URL('gzip-manifest.json',root))),source=JSON.parse(original);assert.equal(m.sourceManifestSha256,hash(original));assert.equal(m.compression,'gzip');for(const [key,e]of Object.entries(m.chunks??m.shards)){const old=(source.chunks??source.shards)[key],packed=await readFile(new URL(key+'.bin.gz',root)),raw=gunzipSync(packed);assert.equal(hash(packed),e.sha256);assert.equal(packed.length,e.bytes);assert.equal(hash(raw),old.sha256);assert.equal(hash(raw),e.rawSha256);assert.equal(raw.length,old.bytes);files++;}}
 assert.equal(files,1389);
});
