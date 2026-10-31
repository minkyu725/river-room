import {createMultiwayLoader} from '../multiway-probabilities.js';
import {createFourOpponentLoader} from '../four-opponent-probabilities.js';
import {exactPercent} from '../exact-probability.js';
import {createThreeOpponentLoader} from '../three-opponent-probabilities.js';
import {createTwoOpponentLoader} from '../two-opponent-probabilities.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as engine from '../engine.js';
function harness(options={}){
 const nodes=new Map(),timers=new Map(),workers=[],animations=[],storage=new Map([['river-animation',options.animation===undefined?'false':options.animation],['river-history',options.history??null]]);let timerId=0;
 // Minimal card DOM: keep node identity, classes, attributes and replacement real
 // enough to catch repeated entrance motion without a browser dependency.
 const node=(tag='div')=>{
  let html='',raw='';const attrs=new Map(),el={value:'60',hidden:false,disabled:false,style:{},textContent:'',className:'',dataset:{},children:[],parent:null,content:{},showModal(){},close(){},addEventListener(){},setAttribute(k,v){attrs.set(k,v);},getAttribute(k){return attrs.get(k);},append(...items){for(const item of items){item.parent=this;this.children.push(item);}},replaceChildren(...items){this.children=[];html='';this.append(...items);},replaceWith(next){next.parent=this.parent;this.parent.children.splice(this.parent.children.indexOf(this),1,next);}};
  el.classList={contains:c=>el.className.split(/\s+/).includes(c),add(...classes){el.className=[...new Set([...el.className.split(/\s+/).filter(Boolean),...classes])].join(' ');},remove(...classes){el.className=el.className.split(/\s+/).filter(c=>!classes.includes(c)).join(' ');},toggle(c,on){if(on)this.add(c);else this.remove(c);}};
  Object.defineProperties(el,{innerHTML:{get(){return this.children.length?this.children.map(c=>c.outerHTML).join(''):html;},set(value){html=value;this.children=[];if(tag==='template'){const card=node('span');card.setRaw(value);this.content.firstElementChild=card;}}},outerHTML:{get(){return raw?raw.replace(/class="[^"]*"/,`class="${this.className}"`):this.innerHTML;}}});el.setRaw=value=>{raw=value;el.className=value.match(/class="([^"]*)"/)?.[1]||'';};
  if(options.motionAPI){el.getBoundingClientRect=()=>({left:20,top:50,width:40,height:20});el.remove=()=>{if(el.parent)el.parent.children=el.parent.children.filter(c=>c!==el);};el.animate=(frames,settings)=>{const animation={frames,settings,target:el,cancelled:false,cancel(){this.cancelled=true;this.oncancel?.();}};animations.push(animation);return animation;};}return el;
 };
 const document={body:options.motionAPI?node('body'):undefined,documentElement:node('html'),querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},querySelectorAll(){return [...nodes.values()].flatMap(el=>el.children).filter(el=>el.classList.contains('dealing')||el.classList.contains('flipping'));},createElement:node};document.querySelector('#players').value=String(options.players??4);
 const media={matches:!!options.reducedMotion,addEventListener(event,fn){this.onchange=fn;},addListener(fn){this.onchange=fn;}};
 if(options.legacyMedia)delete media.addEventListener;
 const context=vm.createContext({...engine,loadFiveOpponentProbabilities:options.loadFiveOpponentProbabilities??(()=>Promise.reject(Error('No network in harness'))),exactPercent,loadFourOpponentProbabilities:options.loadFourOpponentProbabilities??(()=>Promise.reject(Error('No network in harness'))),loadThreeOpponentProbabilities:options.loadThreeOpponentProbabilities??(()=>Promise.reject(Error('No network in harness'))),loadTwoOpponentProbabilities:options.loadTwoOpponentProbabilities??(()=>Promise.reject(Error('No network in harness'))),loadHeadsUpProbabilities:options.loadHeadsUpProbabilities??(()=>Promise.reject(Error('No network in harness'))),loadFlopProbabilities:options.loadFlopProbabilities??(()=>Promise.reject(Error('No network in game harness'))),shuffled:options.shuffled??engine.shuffled,botDecision:options.botDecision??engine.botDecision,document,console,localStorage:{getItem:key=>{if(options.storageFails)throw Error('storage blocked');return storage.get(key)??null;},setItem(key,value){if(options.storageFails)throw Error('storage blocked');storage.set(key,value);}},matchMedia:options.noMatchMedia?undefined:()=>media,navigator:options.navigator??{},AudioContext:options.AudioContext,Worker:class{constructor(){if(options.workerUnavailable)throw Error('unavailable');workers.push(this);}postMessage(data){if(options.postFails)throw Error('post failed');this.request=data;}terminate(){this.terminated=true;}},confirm:()=>options.confirm!==false,setTimeout:f=>{timers.set(++timerId,f);return timerId;},clearTimeout:id=>timers.delete(id)});
 const src=readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/gm,'');vm.runInContext(src+'\nglobalThis.inspect=()=>game;globalThis.restart=start;globalThis.currentRequest=()=>equityRequest;',context);
 return {context,nodes,timers,workers,storage,media,animations,game:()=>context.inspect(),tick(){const [id,fn]=timers.entries().next().value||[];if(fn){timers.delete(id);fn();return true;}return false;}};
}
test('240 complete hands: 2–7 players, folds, raises, all-ins, no stalled turns or chip loss',()=>{
 const h=harness();
 for(let n=2;n<=7;n++)for(let round=0;round<40;round++){
  h.nodes.get('#players').value=String(n);h.context.restart(true);let steps=0;
  while(!h.game().done){assert.ok(steps++<500,'hand must terminate');const g=h.game();assert.equal(g.players.reduce((s,p)=>s+p.stack+p.total,0),n*1000);assert.ok(g.players.every(p=>p.stack>=0&&p.bet>=0));const cards=[...g.board,...g.players.flatMap(p=>p.hole),...g.deck];assert.equal(new Set(cards).size,52);assert.equal(cards.length,52);
   if(!h.nodes.get('#call').disabled){const choice=Math.random();if(choice<.10)h.nodes.get('#fold').onclick();else if(choice<.45&&!h.nodes.get('#raise').disabled){h.nodes.get('#raise-size').value=choice<.2?'1000':String(g.current+g.minRaise);h.nodes.get('#raise').onclick();}else h.nodes.get('#call').onclick();}
   else assert.ok(h.tick(),'pending game must have a scheduled action');
  }
  assert.equal(h.game().players.reduce((s,p)=>s+p.stack,0),n*1000);assert.equal(h.nodes.get('#next').hidden,false);assert.equal(h.nodes.get('#results').hidden,false);for(let i=1;i<n;i++)assert.ok(!h.nodes.get('#opponent-cards-'+i).innerHTML.includes('card back'));
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


test('game uses static lookup without constructing a worker or simulation',()=>{
 const h=harness({players:2});assert.equal(h.workers.length,0);assert.match(h.nodes.get('#equity-detail').textContent,/단독 승리 .*% · 동률 .*%/);assert.doesNotMatch(h.nodes.get('#equity-detail').textContent,/전수|가지/);assert.equal((h.nodes.get('#hand-odds-body').innerHTML.match(/<tr>/g)||[]).length,9);
 const before=h.nodes.get('#equity').innerHTML;h.context.calculate();assert.equal(h.nodes.get('#equity').innerHTML,before);
});
test('multiway preflop uses exact bigint counts and retains category probabilities',()=>{const h=harness({players:6});assert.ok(!h.nodes.get('#equity').innerHTML.startsWith('—'));assert.match(h.nodes.get('#equity-detail').textContent,/단독 승리 .*% · 동률 .*%/);assert.doesNotMatch(h.nodes.get('#equity-detail').textContent,/전수|가지|766,497/);assert.equal((h.nodes.get('#hand-odds-body').innerHTML.match(/<tr>/g)||[]).length,9);});

test('hand odds toggle is independent and clears old results when folding',()=>{
 const h=harness();h.nodes.get('#players').value='2';h.context.restart(true);assert.equal(h.nodes.get('#hand-odds-content').hidden,true);
 h.nodes.get('#toggle-hand-odds').onclick();assert.equal(h.nodes.get('#hand-odds-content').hidden,false);
 const request=h.context.currentRequest();h.context.showEquity({id:request.id,...engine.calculateEquity(request.hole,[],1)});
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

test('postflop has no live calculation and stale replies cannot replace its empty state',async()=>{
 const h=harness({players:2}),g=h.game();g.board=g.deck.splice(-4);await h.context.calculate();assert.equal(h.nodes.get('#equity').innerHTML,'—<span>%</span>');assert.equal(h.nodes.get('#hand-odds-body').innerHTML,'');assert.ok(h.nodes.get('#equity-detail').textContent.includes('사전 승률표'));
 const id=h.context.currentRequest().id;h.context.showEquity({id:id-1,...engine.calculateEquity(g.players[0].hole,[],1)});assert.equal(h.nodes.get('#hand-odds-body').innerHTML,'');
});

const fixedDeck=()=>Array.from({length:52},(_,i)=>i);
const callingBot=()=>({type:'call',reason:''});
function finishDeal(h){let steps=0;while(h.game().busy){assert.ok(steps++<40,'sequence must complete');assert.ok(h.tick());}}
function assertLocked(h){for(const id of ['fold','call','raise','raise-size','half-pot','full-pot','all-in'])assert.equal(h.nodes.get('#'+id).disabled,true,id+' must be locked');}
function beforeSettlement(h){const g=h.game();assert.equal(g.done,false);assert.equal(h.nodes.get('#round-result').hidden,true);assert.equal(h.nodes.get('#results').hidden,true);assert.equal(h.nodes.get('#next').hidden,true);assert.equal(h.storage.get('river-history'),null);assertLocked(h);}

test('hole deal is two clockwise passes from dealer left; no hidden ranks, equity, actions or bots leak',()=>{
 const h=harness({animation:'true',shuffled:fixedDeck}),g=h.game();
 assert.deepEqual(Array.from(g.players,p=>p.dealt),[0,0,0,0]);assert.equal(h.context.currentRequest(),null);assert.equal(h.nodes.get('#hero-hand').textContent,'카드 배분 중');assertLocked(h);
 const initial=JSON.stringify(g),slider=h.nodes.get('#raise-size').value;
 for(const id of ['fold','call','raise','all-in','next'])h.nodes.get('#'+id).onclick();
 h.context.act(0,'fold');h.context.advance();assert.equal(JSON.stringify(g),initial);assert.equal(h.nodes.get('#raise-size').value,slider);
 let prev=[0,0,0,0];
 for(const seat of [1,2,3,0,1,2,3,0]){
  assert.equal(h.timers.size,1,'only the deal timer is scheduled');assert.ok(h.tick());const dealt=Array.from(g.players,p=>p.dealt),expected=prev.map((n,i)=>n+(i===seat?1:0));assert.deepEqual(dealt,expected);prev=dealt;
  assertLocked(h);assert.equal(g.log.length,1);assert.equal(h.context.currentRequest(),null);assert.equal(h.nodes.get('#equity').innerHTML,'—<span>%</span>');assert.equal(h.nodes.get('#hand-odds-body').innerHTML,'');
  for(let i=1;i<4;i++){const html=h.nodes.get('#opponent-cards-'+i).innerHTML;assert.equal((html.match(/card back/g)||[]).length,dealt[i]);assert.ok(!html.includes('<b>'));}
  const heroHTML=h.nodes.get('#hero').innerHTML;assert.equal((heroHTML.match(/<b>/g)||[]).length,dealt[0]);if(dealt[0]<2)assert.equal(h.nodes.get('#hero-hand').textContent,'카드 배분 중');
 }
 assert.equal(g.busy,true,'lock lasts through the last card motion');assert.ok(h.tick());assert.equal(g.busy,false);assert.equal(h.nodes.get('#call').disabled,true);assert.equal(h.timers.size,1,'first bot starts only after the full deal');assert.equal(h.context.currentRequest().hole.length,2);
});

test('rotating dealer deals past busted seats and still deals to players all-in from blinds',()=>{
 const h=harness({animation:'true',shuffled:fixedDeck});finishDeal(h);const old=h.game();old.done=true;old.players.forEach((p,i)=>p.stack=[700,0,20,3280][i]);h.context.restart();const g=h.game();
 assert.equal(h.nodes.get('#position').textContent,'');assert.equal(g.players[2].stack,20,'dealer skips the busted seat');
 const changes=[];let prev=Array.from(g.players,p=>p.dealt);while(g.busy){h.tick();const next=Array.from(g.players,p=>p.dealt);next.forEach((n,i)=>{if(n!==prev[i])changes.push(i);});prev=next;}
 assert.deepEqual(changes,[3,0,2,3,0,2]);assert.equal(g.players[1].dealt,0);assert.ok(h.nodes.get('#opponent-cards-1').innerHTML.includes('쉬는 자리'));
 const headsup=harness({animation:'true',players:2});finishDeal(headsup);headsup.game().done=true;headsup.game().players.forEach((p,i)=>p.stack=i?1990:10);headsup.context.restart();assert.equal(headsup.game().players[0].stack,0);finishDeal(headsup);assert.equal(headsup.game().players[0].dealt,2,'funded before posting BB still receives cards');
});

test('flop, turn and river reveal in order, locking play and keeping every previous card node stationary',()=>{
 const h=harness({animation:'true',players:2,shuffled:fixedDeck,botDecision:callingBot}),g=h.game();finishDeal(h);const expectedDeck=[...g.deck],planned=[...expectedDeck.splice(-3),...expectedDeck.splice(-1),...expectedDeck.splice(-1)];
 const heroNodes=[...h.nodes.get('#hero').children],opponentNodes=[...h.nodes.get('#opponent-cards-1').children];
 h.nodes.get('#call').onclick();assert.ok(h.tick(),'BB checks');assert.equal(g.busy,true);assert.equal(g.board.length,0);assertLocked(h);
 for(let i=0;i<3;i++){
  h.tick();assert.deepEqual([...g.board],planned.slice(0,i+1));assertLocked(h);const cards=[...h.nodes.get('#board').children];assert.equal(cards.length,5);
  h.context.render();h.nodes.get('#sound').onclick();h.nodes.get('#toggle-hand-odds').onclick();assert.deepEqual(h.nodes.get('#board').children,cards);assert.deepEqual(h.nodes.get('#hero').children,heroNodes);assert.deepEqual(h.nodes.get('#opponent-cards-1').children,opponentNodes);
 }
 h.tick();assert.equal(g.busy,false);assert.equal(h.nodes.get('#call').disabled,true,'bot acts first postflop');
 for(const length of [4,5]){
  assert.ok(h.tick(),'bot checks');assert.equal(h.nodes.get('#call').disabled,false);h.nodes.get('#call').onclick();assert.equal(g.busy,true);const previous=[...h.nodes.get('#board').children].slice(0,length-1);
  assertLocked(h);h.tick();assert.deepEqual([...g.board],planned.slice(0,length));assert.deepEqual(h.nodes.get('#board').children.slice(0,length-1),previous);assertLocked(h);h.tick();assert.equal(g.busy,false);
 }
});

test('early fold shows exact dimmed runout before opponents and settles once after their motion',()=>{
 const h=harness({animation:'true',players:2,shuffled:fixedDeck}),g=h.game();finishDeal(h);const deck=[...g.deck],expected=[...deck.splice(-3),...deck.splice(-1),...deck.splice(-1)],stacks=g.players.map(p=>p.stack);h.nodes.get('#fold').onclick();
 assert.equal(g.finishing,true);beforeSettlement(h);assert.deepEqual([...g.fullBoard],expected);
 for(let i=0;i<5;i++){
  h.tick();assert.equal(g.runoutShown,i+1);assert.equal(g.board.length,0);assert.equal(g.players[1].revealed,false);assert.deepEqual(g.players.map(p=>p.stack),stacks);beforeSettlement(h);
  const cards=h.nodes.get('#board').children;assert.equal(cards.filter(el=>el.classList.contains('unplayed')).length,i+1);for(let j=0;j<=i;j++)assert.equal(cards[j].dataset.markup,h.context.card(expected[j]).replace('class="card ','class="card unplayed '));
 }
 h.tick();assert.equal(g.players[1].revealed,true);assert.equal(h.nodes.get('#opponent-cards-1').innerHTML.includes('card back'),false);beforeSettlement(h);
 const late=[...h.timers.values()];h.tick();assert.equal(g.done,true);assert.equal(g.finishing,false);assert.equal(h.nodes.get('#round-result').hidden,false);assert.equal(h.nodes.get('#results').hidden,false);assert.equal(g.players.reduce((sum,p)=>sum+p.stack,0),2000);assert.equal(JSON.parse(h.storage.get('river-history')).length,1);assert.ok(h.nodes.get('#results').innerHTML.includes('모두 폴드하지 않았다면'));
 const final=JSON.stringify(g);late.forEach(fn=>fn());h.context.finish();h.context.completeHand();assert.equal(JSON.stringify(g),final);assert.equal(JSON.parse(h.storage.get('river-history')).length,1);
});

test('showdown reveals live opponents in seat order, then folded review, then payout',()=>{
 const h=harness({animation:'true',shuffled:fixedDeck}),g=h.game();finishDeal(h);
 // A settled river betting state: participant 2 folded, everyone contributed.
 g.board=g.deck.splice(-5);g.street=3;g.pending.clear();g.players.forEach(p=>{p.stack=900;p.bet=0;p.total=100;});g.players[2].folded=true;h.context.render();h.context.finish();const boardNodes=[...h.nodes.get('#board').children];beforeSettlement(h);
 for(const seat of [1,3,2]){
  h.tick();assert.equal(g.players[seat].revealed,true);assert.equal(g.players[0].revealed,false);assert.ok(g.players.every(p=>p.stack===900));assert.deepEqual(h.nodes.get('#board').children,boardNodes);beforeSettlement(h);
  const justRevealed=g.players.slice(1).filter(p=>p.revealed).map(p=>p.name);assert.equal(justRevealed.length,[1,3,2].indexOf(seat)+1);
 }
 h.tick();assert.equal(g.done,true);assert.equal(g.players.reduce((s,p)=>s+p.stack,0),4000);assert.ok(h.nodes.get('#results').innerHTML.includes('폴드'));assert.equal(JSON.parse(h.storage.get('river-history'))[0].revealed,5);
});

test('turning motion off during deal flushes once, persists, cancels stale callbacks and affects only new transitions when enabled again',()=>{
 const h=harness({animation:'true',players:2,botDecision:callingBot});h.tick();const stale=[...h.timers.values()],g=h.game();assert.equal(g.players[1].dealt,1);
 h.nodes.get('#animation').onclick();assert.equal(g.busy,false);assert.deepEqual(Array.from(g.players,p=>p.dealt),[2,2]);assert.equal(h.storage.get('river-animation'),'false');assert.equal(h.nodes.get('#animation').getAttribute('aria-pressed'),'false');assert.equal(h.context.document.documentElement.classList.contains('motion-off'),true);assert.equal(h.timers.size,0);assert.equal(h.context.document.querySelectorAll().length,0);
 const before=JSON.stringify(g);stale.forEach(fn=>fn());assert.equal(JSON.stringify(g),before);
 const hero=[...h.nodes.get('#hero').children];h.nodes.get('#animation').onclick();h.context.render();assert.deepEqual(h.nodes.get('#hero').children,hero);assert.equal(h.context.document.querySelectorAll().length,0,'old cards must not restart motion');assert.equal(h.nodes.get('#animation').getAttribute('aria-pressed'),'true');
 h.nodes.get('#call').onclick();h.tick();assert.equal(g.busy,true,'new street uses enabled animation');assert.equal(g.board.length,0);h.tick();assert.equal(g.board.length,1);
});

test('turning motion off during flop and final reveal drains without bot overlap or double payout',()=>{
 const h=harness({animation:'true',players:2,botDecision:callingBot});finishDeal(h);h.nodes.get('#call').onclick();h.tick();h.tick();const g=h.game(),staleFlop=[...h.timers.values()];assert.equal(g.board.length,1);
 h.nodes.get('#animation').onclick();assert.equal(g.busy,false);assert.equal(g.board.length,3);assert.equal(h.timers.size,1,'one bot resumes');const before=JSON.stringify(g);staleFlop.forEach(fn=>fn());assert.equal(JSON.stringify(g),before);
 h.tick();h.nodes.get('#animation').onclick();h.nodes.get('#fold').onclick();assert.equal(g.finishing,true);h.tick();assert.equal(g.runoutShown,4);const staleFinish=[...h.timers.values()];h.nodes.get('#animation').onclick();assert.equal(g.done,true);assert.equal(g.runoutShown,5);assert.equal(g.players[1].revealed,true);assert.equal(h.timers.size,0);const final=JSON.stringify(g);staleFinish.forEach(fn=>fn());assert.equal(JSON.stringify(g),final);assert.equal(JSON.parse(h.storage.get('river-history')).length,1);assert.equal(g.players.reduce((s,p)=>s+p.stack,0),2000);
});

test('reset cancels captured hole, street and finish callbacks and stale equity results',()=>{
 for(const phase of ['hole','street','finish']){
  const h=harness({animation:'true',players:2,botDecision:callingBot});
  if(phase!=='hole'){finishDeal(h);if(phase==='street'){h.nodes.get('#call').onclick();h.tick();}else h.nodes.get('#fold').onclick();}
  h.tick();const old=h.game(),callbacks=[...h.timers.values()],request=h.context.currentRequest();h.nodes.get('#new').onclick();const current=h.game();assert.notEqual(current,old);const before=JSON.stringify(current);callbacks.forEach(fn=>fn());if(request)h.context.showEquity({id:request.id,equity:999,tie:0,categories:[]});assert.equal(JSON.stringify(current),before);assert.equal(h.nodes.get('#equity').innerHTML,'—<span>%</span>');assert.equal(h.storage.get('river-history'),null);assert.equal(h.timers.size,1);
  finishDeal(h);assert.equal(current.busy,false);assert.equal(current.done,false);assert.deepEqual(Array.from(current.players,p=>p.dealt),[2,2]);
 }
});

test('saved off has no sequence timers or CSS motion, and reduced motion overrides saved on without overwriting it',()=>{
 const off=harness({players:2,animation:'false'});assert.equal(off.game().busy,false);assert.equal(off.timers.size,0);assert.equal(off.context.document.querySelectorAll().length,0);off.nodes.get('#fold').onclick();assert.equal(off.game().done,true);assert.equal(off.timers.size,0);assert.equal(off.context.document.querySelectorAll().length,0);
 const h=harness({players:2,animation:'true',reducedMotion:true});assert.equal(h.game().busy,false);assert.equal(h.timers.size,0);assert.equal(h.nodes.get('#animation').disabled,true);assert.equal(h.nodes.get('#animation').getAttribute('aria-pressed'),'false');assert.equal(h.storage.get('river-animation'),'true');
 h.media.matches=false;h.media.onchange();assert.equal(h.nodes.get('#animation').disabled,false);assert.equal(h.nodes.get('#animation').getAttribute('aria-pressed'),'true');h.nodes.get('#new').onclick();h.tick();const stale=[...h.timers.values()];h.media.matches=true;h.media.onchange();assert.equal(h.game().busy,false);assert.equal(h.timers.size,0);assert.deepEqual(Array.from(h.game().players,p=>p.dealt),[2,2]);const before=JSON.stringify(h.game());stale.forEach(fn=>fn());assert.equal(JSON.stringify(h.game()),before);
});

test('animation defaults on with missing or inaccessible storage and falls back when matchMedia is unavailable',()=>{
 for(const options of [{animation:null},{storageFails:true},{animation:null,noMatchMedia:true}]){const h=harness({...options,players:2});assert.equal(h.game().busy,true);assert.equal(h.nodes.get('#animation').getAttribute('aria-pressed'),'true');h.nodes.get('#animation').onclick();assert.equal(h.game().busy,false);assert.equal(h.timers.size,0);}
});

test('legacy reduced-motion listener drains the final pending flip exactly once',()=>{
 const h=harness({animation:'true',players:2,legacyMedia:true});finishDeal(h);h.nodes.get('#fold').onclick();
 for(let i=0;i<6;i++)h.tick();assert.equal(h.game().players[1].revealed,true);assert.equal(h.game().done,false);const callbacks=[...h.timers.values()];
 h.media.matches=true;h.media.onchange();assert.equal(h.game().done,true);assert.equal(h.timers.size,0);const final=JSON.stringify(h.game());callbacks.forEach(fn=>fn());h.media.matches=false;h.media.onchange();h.context.render();assert.equal(JSON.stringify(h.game()),final);assert.equal(h.context.document.querySelectorAll().length,0);assert.equal(JSON.parse(h.storage.get('river-history')).length,1);
});

test('animated and immediate all-in hands retain identical planned cards, results, hypothetical review and chip carryover',()=>{
 function play(animation){const h=harness({animation,players:3,shuffled:fixedDeck,botDecision:callingBot});if(h.game().busy)finishDeal(h);const g=h.game();
  let steps=0;while(!g.done){assert.ok(steps++<100);if(!h.nodes.get('#raise').disabled){h.nodes.get('#all-in').onclick();h.nodes.get('#raise').onclick();}else if(!h.nodes.get('#call').disabled)h.nodes.get('#call').onclick();else assert.ok(h.tick());}
  assert.equal(g.players.reduce((sum,p)=>sum+p.stack,0),3000);const record=JSON.parse(h.storage.get('river-history'))[0];delete record.id;return {record,stacks:Array.from(g.players,p=>p.stack),board:[...g.board],deck:[...g.deck]};
 }
 assert.deepEqual(play('true'),play('false'));
});


test('folded hand review separates name, made cards and kickers; table uses an inspectable disclosure',()=>{
 const h=harness({players:2,shuffled:fixedDeck}),g=h.game();h.nodes.get('#fold').onclick();
 const hero=engine.describeHand([...g.players[0].hole,...g.fullBoard]);
 const html=h.nodes.get('#hero-hand').innerHTML;
 assert.ok(html.includes('<summary>'));assert.ok(html.includes('폴드 · '+hero.name));assert.ok(html.includes('카드 보기'));assert.ok(html.includes('class="hand-popover-title">폴드 · '+hero.name));
 assert.equal((html.match(/class="hand-card[ "]/g)||[]).length,5);assert.equal((html.match(/data-used="true"/g)||[]).length,5);assert.equal((html.match(/data-used="false"/g)||[]).length,2);
 const p=g.players[1];p.folded=true;h.context.render();assert.ok(h.nodes.get('#opponent-last-1').innerHTML.includes('폴드 · '+engine.evaluate([...p.hole,...g.fullBoard]).name));
 const row=h.context.resultRow({...p,folded:true,payout:0},g.fullBoard);assert.ok(row.includes('hand-description'));assert.ok(row.includes('hand-line'));assert.ok(!row.includes('<summary>'));
 assert.ok(h.context.resultRow({...p,folded:true,payout:0},[]).includes('폴드 · 미완성 보드'));
 const pair=h.context.handMarkup([12,25,11,7,5]);assert.ok(pair.includes('hand-kickers'));assert.ok(pair.indexOf('구성')<pair.indexOf('키커'));
 // A render unrelated to the hand must not replace an open native disclosure.
 const el=h.nodes.get('#hero-hand'),cached=el.dataset.handMarkup;el.innerHTML=el.innerHTML.replace('<details ','<details open ');h.context.render();assert.ok(el.innerHTML.includes('<details open '));assert.equal(el.dataset.handMarkup,cached);
});

test('call and raise animate chips; check uses an action note; fold moves only own cards',()=>{
 for(const action of ['call','raise','check','fold']){
  const h=harness({players:2,motionAPI:true}),g=h.game();h.nodes.get('#animation').onclick();
  if(action==='check')g.current=g.players[0].bet;
  h.nodes.get('#'+(action==='check'?'call':action)).onclick();
  const notes=h.animations.filter(a=>a.target.className==='action-note'),chips=h.animations.filter(a=>a.target.className==='bet-flight');assert.equal(notes.length,1);
  assert.ok(notes[0].target.textContent.includes({call:'콜',raise:'레이즈',check:'체크',fold:'폴드'}[action]));assert.equal(chips.length,action==='call'||action==='raise'?1:0);
  assert.ok(!h.animations.some(a=>h.nodes.get('#board').children.includes(a.target)),'action must not move board cards');
  if(action==='fold')assert.ok(h.animations.some(a=>a.target===h.nodes.get('#hero')));
  h.nodes.get('#animation').onclick();assert.ok(h.animations.every(a=>a.cancelled));assert.equal(h.context.document.body.children.length,0,'toggle removes transient action notes and chips');
 }
});

test('action motion stays off with preference/reduced motion; reset cleans effects without replay',()=>{
 for(const options of [{},{animation:'true',reducedMotion:true}]){const h=harness({...options,players:2,motionAPI:true});h.nodes.get('#call').onclick();assert.equal(h.animations.length,0);}
 const h=harness({players:2,motionAPI:true});h.nodes.get('#animation').onclick();h.nodes.get('#raise').onclick();assert.ok(h.animations.length);h.context.restart(true);assert.ok(h.animations.every(a=>a.cancelled));assert.equal(h.context.document.body.children.length,0);
});

test('playback audio session follows app mute and recovers interrupted contexts',()=>{
 let created=0,resumed=0;const session={type:'auto'};
 class AudioContext{constructor(){created++;this.state='suspended';}resume(){resumed++;this.state='running';return Promise.resolve();}}
 const h=harness({navigator:{audioSession:session},AudioContext});
 h.context.unlockAudio();assert.equal(session.type,'playback');assert.equal(created,1);assert.equal(resumed,1);
 vm.runInContext("audio.state='interrupted'",h.context);h.context.unlockAudio();assert.equal(resumed,2);
 h.nodes.get('#sound').onclick();assert.equal(session.type,'auto');assert.equal(h.storage.get('river-muted'),'true');
 h.context.unlockAudio();assert.equal(session.type,'auto');assert.equal(resumed,2);
 h.nodes.get('#sound').onclick();assert.equal(session.type,'playback');assert.equal(h.storage.get('river-muted'),'false');assert.equal(created,1);
 vm.runInContext("audio.state='closed'",h.context);h.context.unlockAudio();assert.equal(created,2);
});
test('missing or rejected Audio Session API never blocks Web Audio or game',()=>{
 const navigator={};Object.defineProperty(navigator,'audioSession',{get(){throw Error('unsupported');}});
 for(const nav of [{},navigator]){let resumed=0;const h=harness({navigator:nav,AudioContext:class{state='suspended';resume(){resumed++;return Promise.resolve();}}});h.context.unlockAudio();assert.equal(resumed,1);assert.ok(h.game().players.length);}
});

test('custom player picker navigates without changing the game, Escape closes and restores focus',()=>{
 const h=harness(),g=h.game(),picker=h.nodes.get('#player-picker'),toggle=h.nodes.get('#players-toggle'),menu=h.nodes.get('#players-menu');
 assert.equal(menu.hidden,true);assert.equal(h.nodes.get('#players-value').textContent,'4명');
 toggle.onclick();assert.equal(menu.hidden,false);assert.equal(toggle.getAttribute('aria-expanded'),'true');
 const key=key=>picker.onkeydown({key,preventDefault(){}});
 key('ArrowDown');key('End');assert.equal(h.game(),g);assert.equal(h.nodes.get('#players').value,'4');
 key('Escape');assert.equal(menu.hidden,true);assert.equal(toggle.getAttribute('aria-expanded'),'false');
 toggle.onclick();key('Home');key('Enter');assert.equal(h.game().players.length,2);assert.equal(h.nodes.get('#players-value').textContent,'2명');assert.equal(h.nodes.get('#players-option-2').getAttribute('aria-selected'),'true');assert.equal(h.nodes.get('#players-option-4').getAttribute('aria-selected'),'false');assert.equal(menu.hidden,true);
});
test('custom player choice cancellation restores displayed value, selected option and current table',()=>{
 const h=harness({confirm:false}),g=h.game();h.nodes.get('#players-toggle').onclick();h.nodes.get('#players-option-6').onclick();
 assert.equal(h.game(),g);assert.equal(h.nodes.get('#players').value,'4');assert.equal(h.nodes.get('#players-value').textContent,'4명');assert.equal(h.nodes.get('#players-option-4').getAttribute('aria-selected'),'true');assert.equal(h.nodes.get('#players-option-6').getAttribute('aria-selected'),'false');assert.equal(h.nodes.get('#players-menu').hidden,true);
});

test('seven-card reviews retain all cards but mark exactly five used, including a board-only hand',()=>{
 const h=harness(),html=h.context.sevenCards([13,27,12,11,10,9,8]);
 assert.equal((html.match(/data-used="true"/g)||[]).length,5);assert.equal((html.match(/data-used="false"/g)||[]).length,2);assert.equal((html.match(/class="card unused/g)||[]).length,2);
 const holePart=html.slice(0,html.indexOf('<small>보드</small>'));assert.equal((holePart.match(/data-used="false"/g)||[]).length,2);
});
test('async flop lookup shows exact completion counts and rejects stale replies and errors',async()=>{
 const pending=[];const h=harness({players:2,loadFlopProbabilities:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))}),g=h.game();g.board=g.deck.splice(-3);const first=h.context.calculate();assert.ok(h.nodes.get('#hand-odds-status').textContent.includes('불러오는 중'));
 const result={method:'static-flop',equity:null,categories:engine.names.map((name,category)=>({name,category,probability:category===1?1:0}))};
 pending[0].resolve(result);await first;assert.ok(h.nodes.get('#hand-odds-status').textContent.includes('최종 족보 완성 확률'));assert.doesNotMatch(h.nodes.get('#hand-odds-status').textContent,/1,081|전수/);assert.ok(h.nodes.get('#hand-odds-body').innerHTML.includes('100.0%'));
 const stale=h.context.calculate();g.board.push(g.deck.pop());await h.context.calculate();const status=h.nodes.get('#hand-odds-status').textContent;pending[1].resolve(result);await stale;assert.equal(h.nodes.get('#hand-odds-status').textContent,status);assert.equal(h.nodes.get('#hand-odds-body').innerHTML,'');
 g.board.pop();const failed=h.context.calculate();pending[2].reject(Error('offline'));await failed;assert.ok(h.nodes.get('#hand-odds-status').textContent.includes('불러오지 못했습니다'));assert.equal(h.nodes.get('#hand-odds-body').innerHTML,'');
});

test('strongest-hand headline includes tied first place instead of splitting pot share',()=>{
 const h=harness({players:2}),id=h.context.currentRequest().id;
 h.context.showEquity({id,method:'static-river-hu',win:0,tie:1,strongest:1,equity:.5,denominator:990,categories:[]});
 assert.equal(h.nodes.get('#equity').innerHTML,'100.0<span>%</span>');assert.ok(h.nodes.get('#equity-detail').textContent.includes('단독 승리 0.0%'));assert.ok(h.nodes.get('#equity-detail').textContent.includes('동률 100.0%'));
});
test('late heads-up win lookup cannot overwrite a later street or folded hand',async()=>{
 const pending=[];const h=harness({players:2,loadHeadsUpProbabilities:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))}),g=h.game();g.board=g.deck.splice(-4);const first=h.context.calculate();g.players[0].folded=true;h.context.calculate();const before=h.nodes.get('#equity-detail').textContent;pending[0].resolve({method:'static-turn-hu',strongest:1,win:1,tie:0,denominator:45540});await first;assert.equal(h.nodes.get('#equity-detail').textContent,before);assert.equal(h.nodes.get('#equity').innerHTML,'—<span>%</span>');
});

test('two-opponent static replies show joint first place and cannot overwrite a fold',async()=>{
 const pending=[],h=harness({players:3,loadTwoOpponentProbabilities:()=>new Promise(resolve=>pending.push(resolve))}),g=h.game();g.board=g.deck.splice(-4);
 const first=h.context.calculate();pending[0]({strongest:.8,win:.7,tie:.1,denominator:41122620});await first;assert.equal(h.nodes.get('#equity').innerHTML,'80.0<span>%</span>');assert.ok(h.nodes.get('#equity-detail').textContent.includes('70.0% · 동률 10.0%'));
 const stale=h.context.calculate();g.players[0].folded=true;h.context.calculate();const text=h.nodes.get('#equity-detail').textContent;pending[1]({strongest:1,win:1,tie:0,denominator:41122620});await stale;assert.equal(h.nodes.get('#equity-detail').textContent,text);assert.equal(h.nodes.get('#equity').innerHTML,'—<span>%</span>');
});

test('real compressed three-player tables reach the HUD on flop, turn and river',async()=>{
 const load=createTwoOpponentLoader(async url=>{const bytes=readFileSync(new URL('../'+url.replace(/^\.\//,''),import.meta.url));return url.endsWith('.json')?{ok:true,json:async()=>JSON.parse(bytes)}:{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};});
 const h=harness({players:3,loadTwoOpponentProbabilities:load}),g=h.game();g.board=g.deck.splice(-3);
 for(const n of [3,4,5]){if(n>3)g.board.push(g.deck.pop());await h.context.calculate();const r=await load([...g.players[0].hole],[...g.board]);assert.equal(h.nodes.get('#equity').innerHTML,`${exactPercent(BigInt(r.wins)+BigInt(r.ties),r.denominator)}<span>%</span>`);assert.equal(h.nodes.get('#equity-detail').textContent,`단독 승리 ${exactPercent(BigInt(r.wins),r.denominator)}% · 동률 ${exactPercent(BigInt(r.ties),r.denominator)}%`);}
});
test('real compressed four-player tables reach the HUD on flop, turn and river',async()=>{
 const load=createThreeOpponentLoader(async url=>{const bytes=readFileSync(new URL('../'+url.replace(/^\.\//,''),import.meta.url));return url.endsWith('.json')?{ok:true,json:async()=>JSON.parse(bytes)}:{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};});
 const h=harness({players:4,loadThreeOpponentProbabilities:load}),g=h.game();g.board=g.deck.splice(-3);
 for(const n of [3,4,5]){if(n>3)g.board.push(g.deck.pop());await h.context.calculate();const r=await load([...g.players[0].hole],[...g.board]);assert.equal(h.nodes.get('#equity').innerHTML,`${exactPercent(BigInt(r.wins)+BigInt(r.ties),r.denominator)}<span>%</span>`);assert.equal(h.nodes.get('#equity-detail').textContent,`단독 승리 ${exactPercent(BigInt(r.wins),r.denominator)}% · 동률 ${exactPercent(BigInt(r.ties),r.denominator)}%`);}
});

test('three-opponent pending reply cannot overwrite a fold',async()=>{
 let resolve;const h=harness({players:4,loadThreeOpponentProbabilities:()=>new Promise(r=>resolve=r)}),g=h.game();g.board=g.deck.splice(-4);const promise=h.context.calculate();g.players[0].folded=true;h.context.calculate();const before=h.nodes.get('#equity-detail').textContent;resolve({strongest:1,win:1,tie:0,denominator:33720548400});await promise;assert.equal(h.nodes.get('#equity-detail').textContent,before);assert.equal(h.nodes.get('#equity').innerHTML,'—<span>%</span>');
});
test('real compressed five-player tables reach the HUD on flop, turn and river',async()=>{
 const load=createFourOpponentLoader(async url=>{const bytes=readFileSync(new URL('../'+url.replace(/^\.\//,''),import.meta.url));return url.endsWith('.json')?{ok:true,json:async()=>JSON.parse(bytes)}:{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};});
 const h=harness({players:5,loadFourOpponentProbabilities:load}),g=h.game();g.board=g.deck.splice(-3);
 for(const n of [3,4,5]){if(n>3)g.board.push(g.deck.pop());await h.context.calculate();const r=await load([...g.players[0].hole],[...g.board]);assert.equal(h.nodes.get('#equity').innerHTML,`${exactPercent(BigInt(r.wins)+BigInt(r.ties),r.denominator)}<span>%</span>`);assert.equal(h.nodes.get('#equity-detail').textContent,`단독 승리 ${exactPercent(BigInt(r.wins),r.denominator)}% · 동률 ${exactPercent(BigInt(r.ties),r.denominator)}%`);}
});

test('real six-player HUD uses exact five-opponent preflop and bigint postflop tables',async()=>{
 const load=createMultiwayLoader(5,async url=>{const path=url.includes('/data/')?'data/'+url.split('/data/')[1]:url.replace(/^\.\//,''),bytes=readFileSync(new URL('../'+path,import.meta.url));return path.endsWith('.json')?{ok:true,json:async()=>JSON.parse(bytes)}:{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}),h=harness({players:6,loadFiveOpponentProbabilities:load}),g=h.game();assert.match(h.nodes.get('#equity-detail').textContent,/단독 승리 .*% · 동률 .*%/);assert.doesNotMatch(h.nodes.get('#equity-detail').textContent,/전수|가지|766,497/);g.board=g.deck.splice(-3);for(const n of [3,4,5]){if(n>3)g.board.push(g.deck.pop());await h.context.calculate();const r=await load([...g.players[0].hole],[...g.board]);assert.equal(h.nodes.get('#equity').innerHTML,`${exactPercent(r.wins+r.ties,r.denominator)}<span>%</span>`);assert.equal(h.nodes.get('#equity-detail').textContent,`단독 승리 ${exactPercent(BigInt(r.wins),r.denominator)}% · 동률 ${exactPercent(BigInt(r.ties),r.denominator)}%`);}});

test('seven-player picker supports keyboard End, cancellation, portraits and saved review',()=>{const h=harness(),picker=h.nodes.get('#player-picker');h.nodes.get('#players-toggle').onclick();picker.onkeydown({key:'End',preventDefault(){}});picker.onkeydown({key:'Enter',preventDefault(){}});assert.equal(h.game().players.length,7);assert.equal(h.nodes.get('#players-value').textContent,'7명');assert.equal(h.nodes.get('#players-option-7').getAttribute('aria-selected'),'true');assert.equal(h.nodes.get('.felt').dataset.players,'7');assert.ok(!h.nodes.get('#opponents').innerHTML.includes('undefined'));let steps=0;while(!h.game().done){assert.ok(steps++<1000);if(!h.nodes.get('#call').disabled)h.nodes.get('#call').onclick();else assert.ok(h.tick());}const saved=h.storage.get('river-history');assert.equal(JSON.parse(saved)[0].players.length,7);const restored=harness({history:saved});assert.ok(restored.nodes.get('#history').children.length>0);const cancelled=harness({confirm:false}),before=cancelled.game();cancelled.nodes.get('#players-option-7').onclick();assert.equal(cancelled.game(),before);assert.equal(cancelled.nodes.get('#players').value,'4');});

test('touch blur with no related target does not reopen a picker on the second tap',()=>{
 const h=harness(),picker=h.nodes.get('#player-picker'),toggle=h.nodes.get('#players-toggle'),menu=h.nodes.get('#players-menu'),option=h.nodes.get('#players-option-4'),game=h.game();let focused=0;toggle.focus=()=>focused++;picker.contains=target=>[picker,toggle,option].includes(target);
 for(let i=0;i<3;i++){toggle.onclick();assert.equal(menu.hidden,false);picker.onfocusout({relatedTarget:null});toggle.onclick();assert.equal(menu.hidden,true);assert.equal(toggle.getAttribute('aria-expanded'),'false');}
 assert.equal(h.game(),game);assert.equal(h.nodes.get('#players').value,'4');assert.equal(focused,3);
 toggle.onclick();picker.onfocusout({relatedTarget:option});assert.equal(menu.hidden,false);picker.onfocusout({relatedTarget:{}});assert.equal(menu.hidden,true);
 toggle.onclick();picker.onkeydown({key:'Tab'});assert.equal(menu.hidden,true);
});
