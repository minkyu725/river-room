import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as engine from '../engine.js';
function harness(options={}){
 const nodes=new Map(),timers=new Map(),workers=[];let timerId=0;
 const node=()=>({value:'60',hidden:false,disabled:false,style:{},textContent:'',innerHTML:'',append(){},replaceChildren(){},showModal(){},close(){}});
 const document={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},createElement:node};document.querySelector('#players').value='4';
 const context=vm.createContext({...engine,document,console,localStorage:{getItem:key=>key==='river-history'?(options.history??null):null,setItem(){}},navigator:{},Worker:class{constructor(){if(options.workerUnavailable)throw Error('unavailable');workers.push(this);}postMessage(data){if(options.postFails)throw Error('post failed');this.request=data;}terminate(){this.terminated=true;}},confirm:()=>options.confirm!==false,setTimeout:f=>{timers.set(++timerId,f);return timerId;},clearTimeout:id=>timers.delete(id)});
 const src=readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'');vm.runInContext(src+'\nglobalThis.inspect=()=>game;globalThis.restart=start;',context);
 return {context,nodes,timers,workers,game:()=>context.inspect(),tick(){const [id,fn]=timers.entries().next().value||[];if(fn){timers.delete(id);fn();return true;}return false;}};
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


test('worker async error recovers current odds and rejects stale results',()=>{
 const h=harness();h.nodes.get('#players').value='2';h.context.restart(true);const worker=h.workers[0],request=worker.request;
 worker.onerror();assert.equal(worker.terminated,true);
 while(h.tick()){}assert.ok(h.nodes.get('#equity').innerHTML.includes('%'));assert.ok(!h.nodes.get('#equity').innerHTML.includes('···'));
 assert.equal((h.nodes.get('#hand-odds-body').innerHTML.match(/<tr>/g)||[]).length,9);
 const before=h.nodes.get('#equity').innerHTML;h.context.showEquity({id:request.id-1,equity:999,tie:0});assert.equal(h.nodes.get('#equity').innerHTML,before);
});

test('worker construction and postMessage failure both use fallback odds',()=>{
 for(const options of [{workerUnavailable:true},{postFails:true}]){const h=harness(options);h.nodes.get('#players').value='2';h.context.restart(true);while(h.tick()){}assert.equal((h.nodes.get('#hand-odds-body').innerHTML.match(/<tr>/g)||[]).length,9);}
});

test('hand odds toggle is independent and clears old results when folding',()=>{
 const h=harness();h.nodes.get('#players').value='2';h.context.restart(true);assert.equal(h.nodes.get('#hand-odds-content').hidden,true);
 h.nodes.get('#toggle-hand-odds').onclick();assert.equal(h.nodes.get('#hand-odds-content').hidden,false);
 const request=h.workers[0].request;h.context.showEquity({id:request.id,...engine.equity(request.hole,request.board,request.opponents,100,()=>.4,true)});
 assert.ok(h.nodes.get('#hand-odds-body').innerHTML.includes('<tr>'));h.nodes.get('#fold').onclick();assert.equal(h.nodes.get('#hand-odds-body').innerHTML,'');assert.ok(h.nodes.get('#hand-odds-status').textContent.includes('폴드'));
 h.context.showEquity({id:request.id,equity:1,tie:0});assert.equal(h.nodes.get('#hand-odds-body').innerHTML,'');
 h.nodes.get('#toggle-hand-odds').onclick();assert.equal(h.nodes.get('#hand-odds-content').hidden,true);
});

test('corrupt history is skipped while valid records survive and names are escaped',()=>{
 const valid={hand:1,net:0,board:[4,5,6,7,8],players:[{name:'<img src=x onerror=alert(1)>',hole:[0,1],total:20,payout:20},{name:'민',hole:[2,3],total:20,payout:20}],log:['체크']};
 const duplicate={...valid,board:[0]},badPlayers={...valid,players:[{},{}]};
 for(const history of ['bad json',JSON.stringify([null,{players:[{}],board:[],log:[]}]),JSON.stringify([duplicate,badPlayers,valid])]){
  const h=harness({history});assert.ok(h.game());assert.equal(h.nodes.get('#record-count').textContent,history.includes('onerror')?'1개':'0개');
 }
 const h=harness();const row=h.context.resultRow(valid.players[0],valid.board);assert.ok(!row.includes('<img'));assert.ok(row.includes('&lt;img'));
});

test('changing participant count starts selected table and invalidates old bot timers',()=>{
 const h=harness(),old=h.game(),callbacks=[...h.timers.values()];h.nodes.get('#players').value='2';h.nodes.get('#players').onchange();
 const current=h.game();assert.notEqual(current,old);assert.equal(current.players.length,2);assert.equal(h.nodes.get('#players').value,'2');assert.equal(current.players.reduce((sum,p)=>sum+p.stack+p.total,0),2000);
 const before=JSON.stringify(current);callbacks.forEach(fn=>fn());assert.equal(JSON.stringify(current),before);
 h.nodes.get('#fold').onclick();h.nodes.get('#next').onclick();assert.equal(h.game().players.length,2);assert.equal(h.nodes.get('#players').value,'2');
});

test('cancelling participant change restores selection without changing the game',()=>{
 const h=harness({confirm:false}),before=h.game();h.nodes.get('#players').value='6';h.nodes.get('#players').onchange();assert.equal(h.game(),before);assert.equal(h.nodes.get('#players').value,'4');
});

test('an older cached worker response without categories triggers compatible fallback',()=>{
 const h=harness();h.nodes.get('#players').value='2';h.context.restart(true);const worker=h.workers[0];worker.onmessage({data:{id:worker.request.id,equity:.5,tie:0,iterations:1800}});assert.equal(worker.terminated,true);while(h.tick()){}assert.equal((h.nodes.get('#hand-odds-body').innerHTML.match(/<tr>/g)||[]).length,9);
});
