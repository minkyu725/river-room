import test from 'node:test';
import assert from 'node:assert/strict';
import {findTerms} from '../glossary.js';

test('glossary lookup accepts Korean, English and typographic hyphen variants',()=>{
 for(const query of ['C-bet','cbet','Ｃ－ｂｅｔ','C‑bet','씨벳']) assert.ok(findTerms(query).some(t=>t.id==='cbet'),query);
 assert.ok(findTerms('레인보우').some(t=>t.id==='rainbow'));
 assert.ok(findTerms('equity').some(t=>t.id==='equity'));
 assert.equal(findTerms('없는용어xyz').length,0);
});
test('glossary category filters compose with search without losing equity explanations',()=>{
 assert.equal(findTerms('레인보우','베팅·액션').length,0);
 assert.ok(findTerms('레인보우','보드·드로우').some(t=>t.id==='rainbow'));
 const equity=findTerms('equity','확률·GTO').find(t=>t.id==='equity');
 assert.match(equity.example,/50%/);
 assert.match(equity.note,/60%/);
});
