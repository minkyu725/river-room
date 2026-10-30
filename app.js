import {suits,rank,suit,shuffled,evaluate,settle,botDecision,equity} from './engine.js';
const $=s=>document.querySelector(s);
const profiles=[{name:'민',style:'균형형',aggression:.58,bluffRate:.12},{name:'루나',style:'공격형',aggression:.85,bluffRate:.28},{name:'제이',style:'신중형',aggression:.34,bluffRate:.07},{name:'노아',style:'변칙형',aggression:.73,bluffRate:.32},{name:'유진',style:'분석형',aggression:.5,bluffRate:.16}];
let saved=[];try{saved=JSON.parse(localStorage.getItem('river-history')||'[]');if(!Array.isArray(saved))saved=[];}catch{}
let history=saved.filter(h=>Array.isArray(h.players)&&Array.isArray(h.board)&&Array.isArray(h.log)).slice(0,30),hand=0,dealer=-1,game,timer,token=0,calcId=0,worker;
try{worker=new Worker('./equity-worker.js',{type:'module'});worker.onmessage=({data})=>showEquity(data);worker.onerror=()=>{$('#equity-detail').textContent='승률 계산을 사용할 수 없습니다. 페이지를 다시 열어 주세요.';};}catch{}
const streets=['프리플롭','플롭','턴','리버'];
// Seats follow the table perimeter. Leave the center clear for the board.
const seats={1:[[50,3]],2:[[22,12],[78,12]],3:[[15,23],[50,3],[85,23]],4:[[12,34],[33,5],[67,5],[88,34]],5:[[10,38],[25,9],[50,2],[75,9],[90,38]]};
const portraitColors=['#d3ad72','#bb817c','#8faba2','#a19ebc','#7ca4b8'];
function portrait(i){
 const hair=['M10 23Q5 5 23 7Q39 5 37 24L32 16 24 19 18 15Z','M7 35V19Q8 4 24 5Q41 5 41 23V36L33 31V18L17 16V32Z','M10 19Q10 4 24 6Q38 6 38 21L31 14 20 17Z','M8 22L9 12 18 10 22 4 28 10 37 10 40 24 32 17 25 21 15 16Z','M9 23Q4 8 19 6Q32 0 39 14L36 24 31 17 14 18Z'][i];
 const glasses=i===2?'<path d="M15 24h7v6h-7zm11 0h7v6h-7zm-4 2h4" fill="none" stroke="#30424c" stroke-width="2"/>':'';
 return `<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="24" fill="${portraitColors[i]}"/><path d="M7 48q1-14 17-14t17 14" fill="${['#395b69','#6c3e52','#416358','#594c70','#38516a'][i]}"/><rect x="20" y="30" width="8" height="9" rx="3" fill="#dba57c"/><ellipse cx="24" cy="23" rx="13" ry="15" fill="#f2c399"/><path d="${hair}" fill="#34333a"/><path d="M17 24h2m10 0h2" stroke="#34333a" stroke-width="2.5" stroke-linecap="round"/><path d="M21 31q3 2 6-1" stroke="#a66b55" stroke-width="1.5" fill="none" stroke-linecap="round"/>${glasses}</svg>`;
}
function markup(selector,html){const el=$(selector);if(el.innerHTML!==html)el.innerHTML=html;}
function chips(amount){const count=Math.min(12,Math.max(1,Math.ceil(amount/40)));return Array.from({length:count},(_,i)=>`<i style="--tower:${i%3};--level:${Math.floor(i/3)};--chip:${['#bd9654','#a35758','#4e8799'][i%3]}"></i>`).join('');}
function card(c,hidden=false){if(hidden)return '<span class="card back" aria-label="비공개 카드"><span>♠</span></span>';const r=rank(c),s=suit(c);return `<span class="card ${s===1||s===2?'red':''}" aria-label="${r} ${suits[s]}"><b>${r<11?r:r===11?'J':r===12?'Q':r===13?'K':'A'}</b><span>${suits[s]}</span></span>`;}
function message(s){$('#status').textContent=s;}
function active(){return game.players.filter(p=>!p.folded);}
function ready(p){return !p.folded&&p.stack>0;}
function nextSeat(i){return(i+1)%game.players.length;}
function pay(i,amount){const p=game.players[i],n=Math.min(p.stack,Math.max(0,amount));p.stack-=n;p.bet+=n;p.total+=n;return n;}
function start(reset=false){
 clearTimeout(timer);token++;const n=Number($('#players').value);if(reset){dealer=-1;hand=0;}dealer=(dealer+1)%n;hand++;
 const deck=shuffled();game={players:Array.from({length:n},(_,i)=>({name:i?profiles[i-1].name:'나',hole:[deck.pop(),deck.pop()],stack:1000,bet:0,total:0,folded:false,last:'',actedAt:null})),deck,board:[],street:0,current:20,minRaise:20,done:false,pending:new Set(),turn:0,log:[],heroRaises:0};
 const sb=n===2?dealer:nextSeat(dealer),bb=nextSeat(sb);pay(sb,10);pay(bb,20);game.players[sb].last='SB 10';game.players[bb].last='BB 20';game.pending=new Set(game.players.map((_,i)=>i));game.turn=nextSeat(bb);game.log.push('블라인드 10 / 20');render();calculate();advance();
}
function canRaise(i){const p=game.players[i];return p.stack>game.current-p.bet&&(p.actedAt===null||game.current-p.actedAt>=game.minRaise)&&game.players.some((q,j)=>j!==i&&ready(q));}
function act(i,type,target){
 const p=game.players[i],call=game.current-p.bet;
 if(type==='fold'){p.folded=true;p.last='폴드';}
 else if(type==='raise'&&canRaise(i)){
  const old=game.current,cap=p.bet+p.stack;target=Math.min(cap,Math.max(old+game.minRaise,target));pay(i,target-p.bet);game.current=p.bet;if(game.current-old>=game.minRaise)game.minRaise=game.current-old;
  for(let j=0;j<game.players.length;j++)if(j!==i&&ready(game.players[j])&&game.players[j].bet<game.current)game.pending.add(j);
  p.last=`레이즈 ${p.bet}`;if(i===0)game.heroRaises++;
 }else{const paid=pay(i,call);p.last=call?`콜 ${paid}`:'체크';}
 if(!p.stack)p.last+=' · 올인';p.actedAt=game.current;game.pending.delete(i);game.log.push(`${p.name}: ${p.last}`);game.turn=nextSeat(i);
}
function advance(){
 render();if(active().length===1){finish();return;}
 for(const i of game.pending)if(!ready(game.players[i]))game.pending.delete(i);
 const able=game.players.map((p,i)=>ready(p)?i:-1).filter(i=>i>=0);
 if(able.length<=1&&able.every(i=>game.players[i].bet>=Math.max(0,...game.players.filter(p=>!p.folded&&p!==game.players[i]).map(p=>p.bet))))game.pending.clear();
 if(!game.pending.size){if(game.street===3){finish();return;}message('다음 커뮤니티 카드를 공개합니다.');timer=setTimeout(newStreet,650);return;}
 while(!game.pending.has(game.turn))game.turn=nextSeat(game.turn);render();
 if(game.turn===0){const call=Math.min(game.players[0].stack,game.current-game.players[0].bet);message(call?`내 차례 · 계속하려면 ${call}칩 콜`:'내 차례 · 체크하거나 베팅할 수 있습니다.');return;}
 const id=token,i=game.turn;message(`${game.players[i].name}님이 생각 중입니다…`);
 timer=setTimeout(()=>{
  if(id!==token||game.done)return;const p=game.players[i],profile=profiles[i-1],past=history.slice(0,12),bluffs=past.length?past.filter(h=>h.heroBluff).length/past.length:0;
  const decision=botDecision({hole:p.hole,board:game.board,opponents:active().length-1,call:game.current-p.bet,stack:p.stack,pot:game.players.reduce((s,p)=>s+p.total,0),current:game.current,bet:p.bet,minRaise:game.minRaise,...profile,heroAggression:Math.min(1,game.heroRaises/3),heroBluffs:bluffs,canRaise:canRaise(i)});
  const count=active().length;act(i,decision.type,decision.target);if(decision.reason.includes('의심')){game.players[i].last+=' · 블러프 의심';game.log.push(`${p.name}: 블러프를 의심해 콜`);}if(count!==active().length)calculate();advance();
 },550+Math.random()*450);
}
function newStreet(){game.street++;game.board.push(...game.deck.splice(-[3,1,1][game.street-1]));game.current=0;game.minRaise=20;for(const p of game.players){p.bet=0;p.actedAt=null;if(!p.folded)p.last=p.stack?'':'올인';}game.pending=new Set(game.players.map((p,i)=>ready(p)?i:-1).filter(i=>i>=0));game.turn=nextSeat(dealer);game.log.push(streets[game.street]);calculate();advance();}
function finish(){
 game.done=true;const alone=active().length===1,payouts=alone?game.players.map(p=>p.folded?0:game.players.reduce((s,q)=>s+q.total,0)):settle(game.players,game.board).payouts;game.players.forEach((p,i)=>p.stack+=payouts[i]);
 const winners=game.players.filter((p,i)=>payouts[i]>0).map(p=>p.name),hero=game.players[0],net=payouts[0]-hero.total;
 game.resultLabel=net>0?`나이스 핸드! +${net}칩`:net===0?'핸드 종료':`${winners.join(', ')} 팟 수령`;game.net=net;
 const result={id:Date.now(),hand,net,board:[...game.board],players:game.players.map((p,i)=>({name:p.name,hole:p.hole,folded:p.folded,payout:payouts[i],total:p.total})),heroBluff:game.heroRaises>0&&!hero.folded&&game.board.length===5&&evaluate([...hero.hole,...game.board]).category<2,log:game.log};
 history.unshift(result);history=history.slice(0,30);try{localStorage.setItem('river-history',JSON.stringify(history));}catch{}
 render();renderHistory();message(`${winners.join(', ')} 팟 수령 · 나의 결과 ${net>=0?'+':''}${net} 칩`);
 $('#results').hidden=false;$('#results').innerHTML=`<div class="panel-heading"><h2>공개된 패 <small>폴드한 상대 포함</small></h2><span>${alone?'폴드로 종료':'쇼다운'}</span></div>`+result.players.map(p=>resultRow(p,result.board)).join('');calculate();
}
function resultRow(p,board){return `<div class="result-row"><div><b>${p.name}</b><small>${p.folded?'폴드':board.length===5?evaluate([...p.hole,...board]).name:'미완성 보드'}</small></div><div class="cards mini">${p.hole.map(c=>card(c)).join('')}</div><strong class="${p.payout?'positive':''}">${p.payout?'+'+p.payout+' 수령':'—'}</strong></div>`;}
function render(){
 const g=game;$('#hand-no').textContent=`핸드 ${hand}`;$('#street').textContent=g.done?'종료':streets[g.street];$('#pot').textContent=g.players.reduce((s,p)=>s+p.total,0).toLocaleString();
 markup('#pot-stack',chips(g.players.reduce((s,p)=>s+p.total,0)));$('#round-result').hidden=!g.done;$('#round-result').textContent=g.resultLabel||'';$('#round-result').className=`round-result ${g.net>0?'won':''}`;
 markup('#board',Array.from({length:5},(_,i)=>i<g.board.length?card(g.board[i]):'<span class="card empty" aria-label="미공개 보드">♠</span>').join(''));markup('#hero',g.players[0].hole.map(c=>card(c)).join(''));$('#hero-hand').textContent=g.players[0].folded?'폴드':g.board.length?evaluate([...g.players[0].hole,...g.board]).name:startingHand(g.players[0].hole);$('#stack').textContent=`${g.players[0].stack.toLocaleString()} 칩`;$('#position').textContent=dealer===0?'딜러':'';
 $('#opponents').innerHTML=g.players.slice(1).map((p,j)=>{const [x,y]=seats[g.players.length-1][j];return `<div style="--x:${x}%;--y:${y}%" class="opponent ${p.folded?'folded':''} ${g.turn===j+1&&!g.done?'thinking':''}"><div class="avatar"><span class="portrait">${portrait(j)}</span>${p.name}${dealer===j+1?'<span class="dealer" aria-label="딜러">D</span>':''}</div><div class="cards small">${p.hole.map(c=>card(c,!g.done)).join('')}</div><b>${p.stack.toLocaleString()}</b><small>${p.last||profiles[j].style}</small></div>`;}).join('');
 $('#personalities').innerHTML=profiles.slice(0,g.players.length-1).map(p=>`<div class="profile"><span><i class="profile-dot"></i>${p.name}</span><small>${p.style}</small><span class="aggression">${'▰'.repeat(Math.round(p.aggression*5))}<em>${'▱'.repeat(5-Math.round(p.aggression*5))}</em></span></div>`).join('');
 const turn=g.turn===0&&!g.done&&g.pending.has(0),p=g.players[0],call=Math.min(p.stack,g.current-p.bet);$('#actions').hidden=g.done;$('#next').hidden=!g.done;$('#results').hidden=!g.done;
 for(const id of ['fold','call','raise'])$('#'+id).disabled=!turn;$('#raise').disabled=!turn||!canRaise(0);$('#call').textContent=call?`콜 ${call}`:'체크';
 for(const id of ['half-pot','full-pot','all-in'])$('#'+id).disabled=!turn||!canRaise(0);
 const min=Math.min(p.bet+p.stack,g.current+g.minRaise),max=p.bet+p.stack,slider=$('#raise-size');slider.min=min;slider.max=Math.max(min,max);if(Number(slider.value)<min)slider.value=min;if(Number(slider.value)>max)slider.value=max;$('#raise-value').textContent=slider.value;$('#raise').textContent=Number(slider.value)===max?'올인':`레이즈 ${slider.value}`;slider.disabled=!turn||!canRaise(0);
}
function startingHand(h){return rank(h[0])===rank(h[1])?'포켓 페어':suit(h[0])===suit(h[1])?'수티드 · 같은 무늬':'오프수트 · 다른 무늬';}
function calculate(){const id=++calcId;$('#equity').innerHTML='···<span>%</span>';$('#equity-detail').textContent='가능한 상대 패를 계산하고 있어요.';
 if(game.players[0].folded){$('#equity').innerHTML='—<span>%</span>';$('#equity-detail').textContent='폴드했습니다. 종료 후 전체 패를 확인하세요.';$('#equity-bar').style.width='0%';return;}
 const data={id,hole:game.players[0].hole,board:game.board,opponents:active().length-1};if(worker)worker.postMessage(data);else setTimeout(()=>showEquity({id,...equity(data.hole,data.board,data.opponents,600)}),30);
}
function showEquity(data){if(data.id!==calcId)return;const n=(data.equity*100).toFixed(1);$('#equity').innerHTML=`${n}<span>%</span>`;$('#equity-bar').style.width=n+'%';$('#equity-detail').textContent=`상대 ${active().length-1}명 / 동률 ${(data.tie*100).toFixed(1)}%`;}
function renderHistory(){
 $('#record-count').textContent=`${history.length}개`;$('#history').replaceChildren();
 if(!history.length){$('#history').innerHTML='<p class="muted">핸드가 끝나면<br>상대의 패를 여기서 복기하세요.</p>';return;}
 for(const h of history.slice(0,10)){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=`핸드 ${h.hand}　${h.net>=0?'+':''}${h.net}칩`;details.append(summary);const body=document.createElement('div');body.innerHTML=`<div class="cards mini history-board">${h.board.map(c=>card(c)).join('')}</div>`+h.players.map(p=>resultRow(p,h.board)).join('');const log=document.createElement('p');log.className='history-log';log.textContent=h.log.join(' → ');body.append(log);details.append(body);$('#history').append(details);}
}
$('#new').onclick=()=>{if(game&&!game.done&&game.players.some(p=>p.total>20)&&!confirm('현재 핸드를 종료하고 새 테이블을 시작할까요?'))return;start(true);};
$('#next').onclick=()=>start();
function heroAction(type){if(game.done||game.turn!==0||!game.pending.has(0))return;act(0,type,Number($('#raise-size').value));if(type==='fold')calculate();advance();}
$('#fold').onclick=()=>heroAction('fold');$('#call').onclick=()=>heroAction('call');$('#raise').onclick=()=>heroAction('raise');
$('#raise-size').oninput=()=>{const n=Number($('#raise-size').value);$('#raise-value').textContent=n;$('#raise').textContent=n===game.players[0].bet+game.players[0].stack?'올인':`레이즈 ${n}`;};
function preset(fraction){if(game.done||game.turn!==0||!canRaise(0))return;const p=game.players[0],slider=$('#raise-size'),pot=game.players.reduce((s,p)=>s+p.total,0),target=fraction===Infinity?p.bet+p.stack:game.current+Math.max(game.minRaise,Math.round(pot*fraction));slider.value=Math.min(Number(slider.max),Math.max(Number(slider.min),target));slider.oninput();}
$('#half-pot').onclick=()=>preset(.5);$('#full-pot').onclick=()=>preset(1);$('#all-in').onclick=()=>preset(Infinity);
$('#toggle-equity').onclick=()=>{const el=$('#equity-content');el.hidden=!el.hidden;$('#toggle-equity').textContent=el.hidden?'보기':'가리기';};
$('#help').onclick=$('#install').onclick=()=>$('#help-dialog').showModal();$('#close-help').onclick=()=>$('#help-dialog').close();$('#help-dialog').onclick=e=>{if(e.target===$('#help-dialog'))$('#help-dialog').close();};renderHistory();start();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
