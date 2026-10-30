import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as engine from '../engine.js';
function harness(){
 const nodes=new Map(),timers=new Map();let timerId=0;
 const node=()=>({value:'60',hidden:false,disabled:false,style:{},textContent:'',innerHTML:'',append(){},replaceChildren(){},showModal(){},close(){}});
 const document={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},createElement:node};document.querySelector('#players').value='4';
 const context=vm.createContext({...engine,document,console,localStorage:{getItem:()=>null,setItem(){}},navigator:{},Worker:class{postMessage(){}},confirm:()=>true,setTimeout:f=>{timers.set(++timerId,f);return timerId;},clearTimeout:id=>timers.delete(id)});
 const src=readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'');vm.runInContext(src+'\nglobalThis.inspect=()=>game;globalThis.restart=start;',context);
 return {context,nodes,timers,game:()=>context.inspect(),tick(){const [id,fn]=timers.entries().next().value||[];if(fn){timers.delete(id);fn();return true;}return false;}};
}
test('200 complete hands: 2–6 players, folds, raises, all-ins, no stalled turns or chip loss',()=>{
 const h=harness();
 for(let n=2;n<=6;n++)for(let round=0;round<40;round++){
  h.nodes.get('#players').value=String(n);h.context.restart(true);let steps=0;
  while(!h.game().done){assert.ok(steps++<500,'hand must terminate');const g=h.game();assert.equal(g.players.reduce((s,p)=>s+p.stack+p.total,0),n*1000);assert.ok(g.players.every(p=>p.stack>=0&&p.bet>=0));const cards=[...g.board,...g.players.flatMap(p=>p.hole),...g.deck];assert.equal(new Set(cards).size,52);assert.equal(cards.length,52);
   if(!h.nodes.get('#call').disabled){const choice=Math.random();if(choice<.10)h.nodes.get('#fold').onclick();else if(choice<.45&&!h.nodes.get('#raise').disabled){h.nodes.get('#raise-size').value=choice<.2?'1000':String(g.current+g.minRaise);h.nodes.get('#raise').onclick();}else h.nodes.get('#call').onclick();}
   else assert.ok(h.tick(),'pending game must have a scheduled action');
  }
  assert.equal(h.game().players.reduce((s,p)=>s+p.stack,0),n*1000);assert.equal(h.nodes.get('#next').hidden,false);assert.equal(h.nodes.get('#results').hidden,false);assert.ok(!h.nodes.get('#opponents').innerHTML.includes('card back'));
 }
});
test('heads-up dealer posts small blind and acts first preflop',()=>{const h=harness();h.nodes.get('#players').value='2';h.context.restart(true);assert.equal(h.game().players[0].bet,10);assert.equal(h.game().players[1].bet,20);assert.equal(h.game().turn,0);});
test('bet presets respect minimum raise and stack, and require a separate confirmation',()=>{const h=harness();h.nodes.get('#players').value='2';h.context.restart(true);const before=h.game().players[0].stack;h.nodes.get('#half-pot').onclick();assert.equal(Number(h.nodes.get('#raise-size').value),40);h.nodes.get('#full-pot').onclick();assert.equal(Number(h.nodes.get('#raise-size').value),50);h.nodes.get('#all-in').onclick();assert.equal(Number(h.nodes.get('#raise-size').value),1000);assert.equal(h.game().players[0].stack,before);h.nodes.get('#raise').onclick();assert.equal(h.game().players[0].stack,0);assert.equal(h.game().current,1000);});

test('early finish reveals the exact remaining runout and compares every dealt hand',()=>{
 const h=harness();h.nodes.get('#players').value='2';h.context.restart(true);
 const g=h.game(),deck=[...g.deck],expected=[...deck.splice(-3),...deck.splice(-1),...deck.splice(-1)];
 h.nodes.get('#fold').onclick();
 assert.equal(g.done,true);assert.equal(g.board.length,0);assert.deepEqual([...g.fullBoard],expected);
 const best=Math.max(...g.players.map(p=>engine.evaluate([...p.hole,...expected]).score));
 assert.deepEqual([...g.hypothetical],Array.from(g.players.filter(p=>engine.evaluate([...p.hole,...expected]).score===best),p=>p.name));
 assert.ok(h.nodes.get('#board').innerHTML.includes('unplayed'));assert.ok(h.nodes.get('#results').innerHTML.includes('모두 폴드하지 않았다면'));
});

test('next hand carries stacks, excludes busted seats, and conserves table chips',()=>{
 const h=harness();h.nodes.get('#players').value='4';h.context.restart(true);
 const g=h.game();g.done=true;g.players.forEach((p,i)=>p.stack=[700,0,1800,1500][i]);
 h.context.restart();const next=h.game();
 assert.deepEqual(Array.from(next.players,p=>p.stack+p.total),[700,0,1800,1500]);assert.equal(next.players[1].sittingOut,true);assert.equal(next.pending.has(1),false);
 let steps=0;while(!next.done){assert.ok(steps++<500);if(!h.nodes.get('#call').disabled)h.nodes.get('#call').onclick();else assert.ok(h.tick());}
 assert.equal(next.players.reduce((sum,p)=>sum+p.stack,0),4000);
 const stacks=next.players.map(p=>p.stack);if(stacks[0]>0&&stacks.filter(x=>x>0).length>1){h.context.restart();assert.deepEqual(h.game().players.map(p=>p.stack+p.total),stacks);}
});
