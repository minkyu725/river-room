import {loadSixOpponentProbabilities} from './six-opponent-probabilities.js?v=29';
import {loadFiveOpponentProbabilities} from './five-opponent-probabilities.js?v=29';
import {exactPercent} from './exact-probability.js?v=29';
import {loadFourOpponentProbabilities} from './four-opponent-probabilities.js?v=29';
import {loadThreeOpponentProbabilities} from './three-opponent-probabilities.js?v=29';
import {loadTwoOpponentProbabilities} from './two-opponent-probabilities.js?v=29';
import {loadHeadsUpProbabilities} from './headsup-probabilities.js?v=29';
import {loadFlopProbabilities} from './flop-probabilities.js?v=29';
import {suits,rank,suit,shuffled,evaluate,describeHand,settle,botDecision,calculateEquity} from './engine.js?v=29';
const $=s=>document.querySelector(s);
const profiles=[{name:'민',style:'균형형',aggression:.58,bluffRate:.12},{name:'루나',style:'공격형',aggression:.85,bluffRate:.28},{name:'제이',style:'신중형',aggression:.34,bluffRate:.07},{name:'노아',style:'변칙형',aggression:.73,bluffRate:.32},{name:'유진',style:'분석형',aggression:.5,bluffRate:.16},{name:'하늘',style:'수비형',aggression:.38,bluffRate:.08}];
let saved=[];try{saved=JSON.parse(localStorage.getItem('river-history')||'[]');if(!Array.isArray(saved))saved=[];}catch{}
let history=saved.filter(validRecord).slice(0,30),hand=0,dealer=-1,game,timer,token=0,calcId=0;
let equityRequest,sequence;
const actionEffects=new Set();
const CARD_MS=200; // Leave a frame after the 180ms CSS motion before continuing.
let animationPreference=true,reducedMotion;
try{animationPreference=localStorage.getItem('river-animation')!=='false';}catch{}
try{reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');}catch{}
function animationsEnabled(){return animationPreference&&!reducedMotion?.matches;}
function animationButton(){
 const enabled=animationsEnabled(),button=$('#animation');button.textContent=enabled?'애니메이션 켜짐':'애니메이션 꺼짐';button.setAttribute('aria-pressed',String(enabled));
 button.disabled=!!reducedMotion?.matches;button.title=button.disabled?'기기의 동작 줄이기 설정을 따릅니다.':'';
 document.documentElement.classList.toggle('motion-off',!enabled);
}
function clearCardMotion(){for(const el of document.querySelectorAll('.dealing, .flipping'))el.classList.remove('dealing','flipping');}
function cancelSequence(){clearActionMotion();if(sequence)clearTimeout(sequence.timer);sequence=null;clearCardMotion();}
// Each callback belongs to one hand and one sequence. Flushing and cancellation
// invalidate it before continuing, so even an already queued callback is harmless.
function runSequence(steps,complete){
 const s=sequence={game,token,steps,index:0,animated:animationsEnabled(),timer:null,complete};game.busy=true;render();calculate();
 function next(){
  if(sequence!==s||game!==s.game||token!==s.token)return;
  if(s.animated&&s.index<s.steps.length){s.steps[s.index++]();sound('deal');render();s.timer=setTimeout(next,CARD_MS);return;}
  while(s.index<s.steps.length)s.steps[s.index++]();
  if(!s.animated)sound('deal');
  sequence=null;clearCardMotion();game.busy=false;render();s.complete();
 }
 s.next=next;
 if(s.animated&&steps.length)s.timer=setTimeout(next,CARD_MS);else next();
}
function finishSequenceNow(){if(!sequence)return;const s=sequence;clearTimeout(s.timer);s.animated=false;s.next();}
$('#animation').onclick=()=>{animationPreference=!animationPreference;try{localStorage.setItem('river-animation',String(animationPreference));}catch{}animationButton();if(!animationsEnabled()){clearCardMotion();clearActionMotion();finishSequenceNow();}};
function motionChanged(){animationButton();if(!animationsEnabled()){clearCardMotion();clearActionMotion();finishSequenceNow();}}
if(reducedMotion?.addEventListener)reducedMotion.addEventListener('change',motionChanged);else reducedMotion?.addListener?.(motionChanged);
animationButton();
function clearActionMotion(){for(const effect of [...actionEffects]){effect.animation.cancel();effect.cleanup();actionEffects.delete(effect);}}
function actionEffect(el,frames,duration=280,cleanup=()=>{}){
 if(!animationsEnabled()||!el?.animate){cleanup();return;}
 let animation;try{animation=el.animate(frames,{duration,easing:'ease-out'});}catch{cleanup();return;}const effect={animation,cleanup};actionEffects.add(effect);
 const done=()=>{actionEffects.delete(effect);cleanup();};animation.onfinish=done;animation.oncancel=done;
}
function animateAction(i,kind,paid){
 if(!animationsEnabled())return;
 const label=$(i?'#opponent-last-'+i:'#hero-hand');
 if(label?.getBoundingClientRect&&document.body){const rect=label.getBoundingClientRect(),note=document.createElement('span');note.className='action-note';note.textContent=game.players[i].last;note.setAttribute('aria-hidden','true');note.style.left=(rect.left+rect.width/2)+'px';note.style.top=(rect.top-6)+'px';document.body.append(note);actionEffect(note,[{opacity:0,transform:'translate(-50%, -80%) scale(.92)'},{opacity:1,offset:.2,transform:'translate(-50%, -100%) scale(1)'},{opacity:1,offset:.8},{opacity:0,transform:'translate(-50%, -110%) scale(1)'}],480,()=>note.remove());}
 else actionEffect(label,[{opacity:.45},{opacity:1}],280);
 if(kind==='fold')actionEffect($(i?'#opponent-cards-'+i:'#hero'),[{opacity:1,transform:'translateY(0)'},{opacity:.42,transform:'translateY(6px)'},{opacity:.42,transform:'translateY(0)'}]);
 if(paid<=0)return;
 const source=$(i?'#opponent-stack-'+i:'#stack'),target=$('#pot');
 if(!source?.getBoundingClientRect||!target?.getBoundingClientRect||!document.body)return;
 const a=source.getBoundingClientRect(),b=target.getBoundingClientRect(),chip=document.createElement('i');chip.className='bet-flight';chip.setAttribute('aria-hidden','true');chip.style.left=(a.left+a.width/2)+'px';chip.style.top=(a.top+a.height/2)+'px';document.body.append(chip);
 actionEffect(chip,[{opacity:1,transform:'translate(-50%, -50%) scale(1)'},{opacity:1,offset:.8},{opacity:0,transform:`translate(calc(-50% + ${b.left+b.width/2-a.left-a.width/2}px), calc(-50% + ${b.top+b.height/2-a.top-a.height/2}px)) scale(.7)`}],kind==='raise'?380:320,()=>chip.remove());
}
function validRecord(h){
 const isCard=c=>Number.isInteger(c)&&c>=0&&c<52,isAmount=n=>Number.isFinite(n)&&n>=0;
 if(!h||!Number.isInteger(h.hand)||h.hand<1||!Number.isFinite(h.net)||!Array.isArray(h.players)||h.players.length<2||h.players.length>7||!Array.isArray(h.board)||h.board.length>5||!h.board.every(isCard)||!Array.isArray(h.log)||!h.log.every(x=>typeof x==='string'))return false;
 if(!h.players.every(p=>p&&typeof p.name==='string'&&p.name.length<=60&&Array.isArray(p.hole)&&p.hole.length===2&&p.hole.every(isCard)&&isAmount(p.total)&&isAmount(p.payout)))return false;
 const cards=[...h.board,...h.players.flatMap(p=>p.hole)];
 return new Set(cards).size===cards.length&&(h.revealed===undefined||Number.isInteger(h.revealed)&&h.revealed>=0&&h.revealed<=h.board.length)&&(h.hypothetical===undefined||Array.isArray(h.hypothetical)&&h.hypothetical.length>0&&h.hypothetical.every(name=>h.players.some(p=>p.name===name)));
}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
let audio,muted=false;
try{muted=localStorage.getItem('river-muted')==='true';}catch{}
function sound(kind){
 if(muted||!audio)return;
 try{const now=audio.currentTime,notes={deal:[740,520],chips:[1200,1650,950],check:[340],fold:[220],win:[523,659,784],end:[392,330]}[kind]||[520];
 notes.forEach((f,i)=>{const osc=audio.createOscillator(),gain=audio.createGain(),t=now+i*.055;osc.type=kind==='chips'?'triangle':'sine';osc.frequency.setValueAtTime(f,t);osc.frequency.exponentialRampToValueAtTime(f*.65,t+.065);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.055,t+.006);gain.gain.exponentialRampToValueAtTime(.0001,t+.10);osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+.11);});}catch{}
}
function unlockAudio(){
 if(muted)return;
 // Web Audio defaults to ambient on iOS. Playback uses media volume even
 // with the silent switch enabled; websites cannot change that switch.
 try{if(globalThis.navigator?.audioSession)navigator.audioSession.type='playback';}catch{}
 try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!audio||audio.state==='closed'){if(Audio)audio=new Audio();}if(audio&&(audio.state==='suspended'||audio.state==='interrupted'))audio.resume().catch(()=>{});}catch{}
}
function soundButton(){const b=$('#sound');b.textContent=muted?'소리 꺼짐':'소리 켜짐';b.setAttribute?.('aria-pressed',String(!muted));b.title='소리 켜짐 상태에서 화면을 터치하고 기기의 미디어 볼륨을 조절하세요.';}
$('#sound').onclick=()=>{muted=!muted;if(muted){try{if(globalThis.navigator?.audioSession)navigator.audioSession.type='auto';}catch{}}else unlockAudio();try{localStorage.setItem('river-muted',String(muted));}catch{}soundButton();if(!muted)sound('check');};soundButton();
globalThis.document.addEventListener?.('pointerdown',unlockAudio,{passive:true});
globalThis.document.addEventListener?.('keydown',unlockAudio);
const streets=['프리플롭','플롭','턴','리버'];
// Seats follow the table perimeter. Leave the center clear for the board.
const seats={1:[[50,3]],2:[[22,12],[78,12]],3:[[15,23],[50,3],[85,23]],4:[[12,34],[33,5],[67,5],[88,34]],5:[[10,38],[25,9],[50,2],[75,9],[90,38]],6:[[10,32],[32,5],[68,5],[90,32],[86,75],[14,75]]};
const portraitColors=['#d3ad72','#bb817c','#8faba2','#a19ebc','#7ca4b8','#9cae97'];
function portrait(i){
 const hair=['M10 23Q5 5 23 7Q39 5 37 24L32 16 24 19 18 15Z','M7 35V19Q8 4 24 5Q41 5 41 23V36L33 31V18L17 16V32Z','M10 19Q10 4 24 6Q38 6 38 21L31 14 20 17Z','M8 22L9 12 18 10 22 4 28 10 37 10 40 24 32 17 25 21 15 16Z','M9 23Q4 8 19 6Q32 0 39 14L36 24 31 17 14 18Z','M8 24Q6 7 18 6Q27 1 35 9Q41 13 38 26L32 18 24 14 17 18Z'][i];
 const glasses=i===2?'<path d="M15 24h7v6h-7zm11 0h7v6h-7zm-4 2h4" fill="none" stroke="#30424c" stroke-width="2"/>':'';
 return `<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="24" fill="${portraitColors[i]}"/><path d="M7 48q1-14 17-14t17 14" fill="${['#395b69','#6c3e52','#416358','#594c70','#38516a','#43594c'][i]}"/><rect x="20" y="30" width="8" height="9" rx="3" fill="#dba57c"/><ellipse cx="24" cy="23" rx="13" ry="15" fill="#f2c399"/><path d="${hair}" fill="#34333a"/><path d="M17 24h2m10 0h2" stroke="#34333a" stroke-width="2.5" stroke-linecap="round"/><path d="M21 31q3 2 6-1" stroke="#a66b55" stroke-width="1.5" fill="none" stroke-linecap="round"/>${glasses}</svg>`;
}
function markup(selector,html){const el=$(selector);if(el.innerHTML!==html)el.innerHTML=html;}
function chips(amount){const count=Math.min(12,Math.max(1,Math.ceil(amount/40)));return Array.from({length:count},(_,i)=>`<i style="--tower:${i%3};--level:${Math.floor(i/3)};--chip:${['#bd9654','#a35758','#4e8799'][i%3]}"></i>`).join('');}
function card(c,hidden=false){if(hidden)return '<span class="card back" aria-label="비공개 카드"><span>♠</span></span>';const r=rank(c),s=suit(c);return `<span class="card ${s===1||s===2?'red':''}" aria-label="${r} ${suits[s]}"><b>${r<11?r:r===11?'J':r===12?'Q':r===13?'K':'A'}</b><span>${suits[s]}</span></span>`;}
function emptyCard(label){return `<span class="card empty" aria-label="${label}">♠</span>`;}
function renderCards(el,values,effect){
 values.forEach((value,i)=>{const old=el.children[i];if(old?.dataset.markup===value)return;const template=document.createElement('template');template.innerHTML=value;const next=template.content.firstElementChild;next.dataset.markup=value;
  if(sequence?.animated&&!value.includes('card empty')){next.classList.add(effect);next.addEventListener('animationend',()=>next.classList.remove(effect),{once:true});}
  if(old)old.replaceWith(next);else el.append(next);
 });
}
function mountSeats(){
 $('.felt').dataset.players=String(game.players.length);
 $('#board').replaceChildren();$('#hero').replaceChildren();
 $('#opponents').innerHTML=game.players.slice(1).map((p,j)=>{const [x,y]=seats[game.players.length-1][j],i=j+1;return `<div id="opponent-${i}" style="--x:${x}%;--y:${y}%" class="opponent" data-side="${x<35?'left':x>65?'right':'center'}"><div class="avatar"><span class="portrait">${portrait(j)}</span>${p.name}${dealer===i?'<span class="dealer" aria-label="딜러">D</span>':''}</div><div id="opponent-cards-${i}" class="cards small"></div><b id="opponent-stack-${i}"></b><div class="seat-status" id="opponent-last-${i}"></div></div>`;}).join('');
}
function message(s){$('#status').textContent=s;}
function active(){return game.players.filter(p=>!p.folded);}
function ready(p){return !p.folded&&p.stack>0;}
function nextSeat(i){do{i=(i+1)%game.players.length;}while(game.players[i].sittingOut);return i;}
function pay(i,amount){const p=game.players[i],n=Math.min(p.stack,Math.max(0,amount));p.stack-=n;p.bet+=n;p.total+=n;return n;}
function start(reset=false){
 const previous=!reset&&game?game.players:null,n=previous?previous.length:Number($('#players').value);if(previous&&(previous[0].stack===0||previous.filter(p=>p.stack>0).length<2))return;
 clearTimeout(timer);cancelSequence();token++;if(reset){dealer=-1;hand=0;}do{dealer=(dealer+1)%n;}while(previous&&previous[dealer].stack===0);hand++;$('#players').value=String(n);syncPlayerPicker();
 const deck=shuffled();game={players:Array.from({length:n},(_,i)=>({name:i?profiles[i-1].name:'나',hole:[deck.pop(),deck.pop()],dealt:0,revealed:false,stack:previous?previous[i].stack:1000,sittingOut:!!previous&&previous[i].stack===0,bet:0,total:0,folded:!!previous&&previous[i].stack===0,last:'',actedAt:null})),deck,board:[],runoutShown:0,street:0,current:20,minRaise:20,done:false,finishing:false,busy:false,pending:new Set(),turn:0,log:[],heroRaises:0};
 const sb=game.players.filter(p=>!p.sittingOut).length===2?dealer:nextSeat(dealer),bb=nextSeat(sb);pay(sb,10);pay(bb,20);game.players[sb].last='SB 10';game.players[bb].last='BB 20';game.pending=new Set(game.players.flatMap((p,i)=>ready(p)?[i]:[]));game.turn=nextSeat(bb);game.log.push('블라인드 10 / 20');mountSeats();
 const order=Array.from({length:n},(_,j)=>(dealer+j+1)%n).filter(i=>!game.players[i].sittingOut);
 message('홀 카드를 한 장씩 배분합니다.');runSequence([...order,...order].map(i=>()=>game.players[i].dealt++),()=>{calculate();advance();});
}
function canRaise(i){const p=game.players[i];return p.stack>game.current-p.bet&&(p.actedAt===null||game.current-p.actedAt>=game.minRaise)&&game.players.some((q,j)=>j!==i&&ready(q));}
function act(i,type,target){
 if(game.done||game.busy||game.finishing)return;
 const p=game.players[i],before=p.stack,call=game.current-p.bet;let kind=type==='fold'?'fold':'check';sound(type==='fold'?'fold':type==='raise'||call?'chips':'check');
 if(type==='fold'){p.folded=true;p.last='폴드';}
 else if(type==='raise'&&canRaise(i)){
  const old=game.current,cap=p.bet+p.stack;target=Math.min(cap,Math.max(old+game.minRaise,target));pay(i,target-p.bet);game.current=p.bet;if(game.current-old>=game.minRaise)game.minRaise=game.current-old;
  for(let j=0;j<game.players.length;j++)if(j!==i&&ready(game.players[j])&&game.players[j].bet<game.current)game.pending.add(j);
  kind='raise';p.last=`레이즈 ${p.bet}`;if(i===0)game.heroRaises++;
 }else{const paid=pay(i,call);kind=call?'call':'check';p.last=call?`콜 ${paid}`:'체크';}
 if(!p.stack)p.last+=' · 올인';p.actedAt=game.current;game.pending.delete(i);game.log.push(`${p.name}: ${p.last}`);game.turn=nextSeat(i);render();animateAction(i,kind,before-p.stack);
}
function advance(){
 if(game.done||game.busy||game.finishing)return;
 render();if(active().length===1){finish();return;}
 for(const i of game.pending)if(!ready(game.players[i]))game.pending.delete(i);
 const able=game.players.map((p,i)=>ready(p)?i:-1).filter(i=>i>=0);
 if(able.length<=1&&able.every(i=>game.players[i].bet>=Math.max(0,...game.players.filter(p=>!p.folded&&p!==game.players[i]).map(p=>p.bet))))game.pending.clear();
 if(!game.pending.size){if(game.street===3){finish();return;}newStreet();return;}
 while(!game.pending.has(game.turn))game.turn=nextSeat(game.turn);render();
 if(game.turn===0){const call=Math.min(game.players[0].stack,game.current-game.players[0].bet);message(call?`내 차례 · 계속하려면 ${call}칩 콜`:'내 차례 · 체크하거나 베팅할 수 있습니다.');return;}
 const id=token,i=game.turn;message(`${game.players[i].name}님이 생각 중입니다…`);
 timer=setTimeout(()=>{
  if(id!==token||game.done||game.busy||game.finishing||game.turn!==i||!game.pending.has(i))return;const p=game.players[i],profile=profiles[i-1],past=history.slice(0,12),bluffs=past.length?past.filter(h=>h.heroBluff).length/past.length:0;
  const decision=botDecision({hole:p.hole,board:game.board,opponents:active().length-1,call:game.current-p.bet,stack:p.stack,pot:game.players.reduce((s,p)=>s+p.total,0),current:game.current,bet:p.bet,minRaise:game.minRaise,...profile,heroAggression:Math.min(1,game.heroRaises/3),heroBluffs:bluffs,canRaise:canRaise(i)});
  const count=active().length;act(i,decision.type,decision.target);if(decision.reason.includes('의심')){game.players[i].last+=' · 블러프 의심';game.log.push(`${p.name}: 블러프를 의심해 콜`);}if(count!==active().length)calculate();advance();
 },550+Math.random()*450);
}
function newStreet(){
 if(game.done||game.busy||game.finishing)return;
 game.street++;const cards=game.deck.splice(-[3,1,1][game.street-1]);game.current=0;game.minRaise=20;for(const p of game.players){p.bet=0;p.actedAt=null;if(!p.folded)p.last=p.stack?'':'올인';}game.pending=new Set(game.players.map((p,i)=>ready(p)?i:-1).filter(i=>i>=0));game.turn=nextSeat(dealer);game.log.push(streets[game.street]);
 message(`${streets[game.street]} 카드를 공개합니다.`);runSequence(cards.map(c=>()=>game.board.push(c)),()=>{calculate();advance();});
}
function finish(){
 if(game.done||game.busy||game.finishing)return;
 clearTimeout(timer);game.finishing=true;const remaining=[...game.deck];game.fullBoard=[...game.board];for(let street=game.street;street<3;street++)game.fullBoard.push(...remaining.splice(-[3,1,1][street]));game.runoutShown=game.board.length;
 const opponents=Array.from({length:game.players.length},(_,j)=>(dealer+j+1)%game.players.length).filter(i=>i!==0&&!game.players[i].sittingOut);
 const steps=game.fullBoard.slice(game.board.length).map(()=>()=>{game.runoutShown++;});
 for(const i of [...opponents.filter(i=>!game.players[i].folded),...opponents.filter(i=>game.players[i].folded)])steps.push(()=>{game.players[i].revealed=true;});
 message(active().length===1?'남은 보드와 상대 패를 차례로 공개합니다.':'쇼다운 · 상대 패를 차례로 공개합니다.');runSequence(steps,completeHand);
}
function completeHand(){
 if(game.done||!game.finishing)return;
 game.done=true;game.finishing=false;const contenders=game.players.filter(p=>!p.sittingOut),best=Math.max(...contenders.map(p=>evaluate([...p.hole,...game.fullBoard]).score));game.hypothetical=contenders.filter(p=>evaluate([...p.hole,...game.fullBoard]).score===best).map(p=>p.name);const alone=active().length===1,payouts=alone?game.players.map(p=>p.folded?0:game.players.reduce((s,q)=>s+q.total,0)):settle(game.players,game.board).payouts;game.players.forEach((p,i)=>p.stack+=payouts[i]);
 const winners=game.players.filter((p,i)=>payouts[i]>0).map(p=>p.name),hero=game.players[0],net=payouts[0]-hero.total;
 game.resultLabel=net>0?`나이스 핸드! +${net}칩`:net===0?'핸드 종료':`${winners.join(', ')} 팟 수령`;game.net=net;sound(net>0?'win':'end');
 const result={id:Date.now(),hand,net,board:[...game.fullBoard],revealed:game.board.length,hypothetical:game.hypothetical,players:game.players.map((p,i)=>({name:p.name,hole:p.hole,folded:p.folded,sittingOut:p.sittingOut,payout:payouts[i],total:p.total})),heroBluff:game.heroRaises>0&&!hero.folded&&game.board.length===5&&evaluate([...hero.hole,...game.board]).category<2,log:game.log};
 history.unshift(result);history=history.slice(0,30);try{localStorage.setItem('river-history',JSON.stringify(history));}catch{}
 render();renderHistory();message(`${winners.join(', ')} 팟 수령 · 나의 결과 ${net>=0?'+':''}${net} 칩`);
 $('#results').hidden=false;$('#results').innerHTML=`<div class="panel-heading"><h2>공개된 패 <small>폴드한 상대 포함</small></h2><span>${alone?'폴드로 종료':'쇼다운'}</span></div>`+reviewNote(result)+result.players.filter(p=>!p.sittingOut).map(p=>resultRow(p,result.board)).join('');calculate();
}
function markUnusedHole(el,hole,board){
 const used=board.length===5?new Set(describeHand([...hole,...board]).cards):null;
 hole.forEach((c,i)=>{el.children[i]?.classList.toggle('unused',!!used&&!used.has(c));});
}
function sevenCards(cards){
 const used=new Set(describeHand(cards).cards),piece=c=>card(c).replace('class="card ',`data-used="${used.has(c)}" class="card ${used.has(c)?'':'unused '}`).replace('aria-label="',`aria-label="${used.has(c)?'최선의 5장 · ':'미사용 · '}`);
 const group=(label,values)=>`<span class="seven-group"><small>${label}</small><span class="cards mini">${values.map(piece).join('')}</span></span>`;
 return `<span class="seven-cards" aria-label="최선의 5장은 선명하게, 미사용 카드는 흐리게 표시">${group('홀카드',cards.slice(0,2))}${group('보드',cards.slice(2))}</span>`;
}
function handMarkup(cards,prefix='',compact=false){
 const hand=describeHand(cards),title=`${prefix}${hand.name}`;
 const tokens=cards=>cards.map(c=>{const r=rank(c),red=suit(c)===1||suit(c)===2;return `<span class="hand-card${red?' red':''}">${r<11?r:({11:'J',12:'Q',13:'K',14:'A'})[r]}${suits[suit(c)]}</span>`;}).join('');
 const lines=`<span class="hand-line"><span class="hand-line-label">구성</span><span class="hand-card-run">${tokens(hand.madeCards)}</span></span>${hand.kickerCards.length?`<span class="hand-line hand-kickers"><span class="hand-line-label">키커</span><span class="hand-card-run">${tokens(hand.kickerCards)}</span></span>`:''}`;
 return compact?`<details class="hand-disclosure" name="hand-cards"><summary><span class="hand-name">${escapeHTML(title)}</span><span class="hand-more">카드 보기</span></summary><div class="hand-popover"><strong class="hand-popover-title">${escapeHTML(title)}</strong>${sevenCards(cards)}${lines}</div></details>`:`<span class="hand-description"><span class="hand-name">${escapeHTML(title)}</span>${lines}</span>`;
}
function renderHandStatus(selector,cards,prefix='',plain=''){
 const el=$(selector);if(cards){const html=handMarkup(cards,prefix,true);if(el.dataset.handMarkup!==html){el.innerHTML=html;el.dataset.handMarkup=html;}}else{el.textContent=plain;delete el.dataset.handMarkup;}
}
function resultRow(p,board){return `<div class="result-row"><div><b>${escapeHTML(p.name)}</b>${board.length===5?handMarkup([...p.hole,...board],p.folded?'폴드 · ':''):`<small>${p.folded?'폴드 · ':''}미완성 보드</small>`}</div><div class="result-seven">${board.length===5?sevenCards([...p.hole,...board]):p.hole.map(c=>card(c)).join('')}</div><strong class="${p.payout?'positive':''}">${p.payout?'+'+p.payout+' 수령':'—'}</strong></div>`;}
function render(){
 const g=game;$('#hand-no').textContent=`핸드 ${hand}`;$('#street').textContent=g.done?'종료':streets[g.street];$('#pot').textContent=g.players.reduce((s,p)=>s+p.total,0).toLocaleString();
 markup('#pot-stack',chips(g.players.reduce((s,p)=>s+p.total,0)));$('#round-result').hidden=!g.done;$('#round-result').textContent=g.resultLabel||'';$('#round-result').className=`round-result ${g.net>0?'won':''}`;
 renderBoard(g);const hero=g.players[0];renderCards($('#hero'),hero.hole.map((c,i)=>i<hero.dealt?card(c):emptyCard('미배분 카드')),'dealing');$('#hero').classList.toggle('folded',hero.folded);markUnusedHole($('#hero'),hero.hole,g.done?g.fullBoard:g.board);renderHandStatus('#hero-hand',hero.dealt<2||hero.folded&&!g.done||!g.done&&!g.board.length?null:[...hero.hole,...(g.done?g.fullBoard:g.board)],g.done?(hero.folded?'폴드 · ':''):(hero.last?hero.last+' · ':''),hero.dealt<2?'카드 배분 중':hero.folded?'폴드':`${hero.last?hero.last+' · ':''}${startingHand(hero.hole)}`);$('#stack').textContent=`${hero.stack.toLocaleString()} 칩`;$('#position').textContent=dealer===0?'딜러':'';
 g.players.slice(1).forEach((p,j)=>{const i=j+1;$('#opponent-'+i).className=`opponent ${p.folded?'folded':''} ${g.turn===i&&!g.done&&!g.busy&&!g.finishing?'thinking':''}`;renderCards($('#opponent-cards-'+i),p.hole.map((c,k)=>k<p.dealt?card(c,!p.revealed):emptyCard(p.sittingOut?'쉬는 자리':'미배분 카드')),p.revealed?'flipping':'dealing');markUnusedHole($('#opponent-cards-'+i),p.hole,p.revealed?g.fullBoard:[]);$('#opponent-stack-'+i).textContent=p.stack.toLocaleString();renderHandStatus('#opponent-last-'+i,p.revealed&&!p.sittingOut?[...p.hole,...g.fullBoard]:null,p.folded?'폴드 · ':'',p.sittingOut?'칩 소진':p.last||profiles[j].style);});
 $('#personalities').innerHTML=profiles.slice(0,g.players.length-1).map(p=>`<div class="profile"><span><i class="profile-dot"></i>${p.name}</span><small>${p.style}</small><span class="aggression">${'▰'.repeat(Math.round(p.aggression*5))}<em>${'▱'.repeat(5-Math.round(p.aggression*5))}</em></span></div>`).join('');
 const turn=g.turn===0&&!g.done&&!g.busy&&!g.finishing&&g.pending.has(0),p=g.players[0],call=Math.min(p.stack,g.current-p.bet);$('#actions').hidden=g.done;$('#next').hidden=!g.done;$('#next').disabled=g.done&&(g.players[0].stack===0||g.players.filter(p=>p.stack>0).length<2);$('#next').textContent=$('#next').disabled?'테이블 종료 · 새 테이블로 시작하세요':'다음 핸드';$('#results').hidden=!g.done;
 for(const id of ['fold','call','raise'])$('#'+id).disabled=!turn;$('#raise').disabled=!turn||!canRaise(0);$('#call').textContent=call?`콜 ${call}`:'체크';
 for(const id of ['half-pot','full-pot','all-in'])$('#'+id).disabled=!turn||!canRaise(0);
 const min=Math.min(p.bet+p.stack,g.current+g.minRaise),max=p.bet+p.stack,slider=$('#raise-size');slider.min=min;slider.max=Math.max(min,max);if(Number(slider.value)<min)slider.value=min;if(Number(slider.value)>max)slider.value=max;$('#raise-value').textContent=slider.value;$('#raise').textContent=Number(slider.value)===max?'올인':`레이즈 ${slider.value}`;slider.disabled=!turn||!canRaise(0);
}
function renderBoard(g){
 const html=Array.from({length:5},(_,i)=>{const revealed=i<g.board.length,c=revealed?g.board[i]:i<g.runoutShown?g.fullBoard[i]:null;return c===null?emptyCard('미공개 보드'):card(c).replace('class="card ',`class="card ${revealed?'':'unplayed '}`);});
 // Only replace a slot when its card changes; unrelated renders preserve nodes.
 renderCards($('#board'),html,'flipping');
}
function reviewNote(h){return `<p class="review-note">${h.revealed<5?'옅은 카드는 종료 후 공개한 남은 보드입니다. ':''}모두 폴드하지 않았다면: <b>${h.hypothetical.map(escapeHTML).join(', ')}${h.hypothetical.length>1?' 공동 승리':' 승리'}</b><br><small>전체 보드와 모든 참가자의 패를 비교한 결과 · 실제 칩 정산과 별개<br>개인별 7장에서 흐린 2장은 미사용 카드입니다. 동률인 최선의 조합은 한 가지를 표시합니다.</small></p>`;}
function startingHand(h){return rank(h[0])===rank(h[1])?'포켓 페어':suit(h[0])===suit(h[1])?'수티드 · 같은 무늬':'오프수트 · 다른 무늬';}
function calculate(){const id=++calcId;equityRequest=null;$('#equity').innerHTML='···<span>%</span>';$('#equity-detail').textContent='사전 계산표를 확인하고 있어요.';$('#equity-bar').style.width='0%';$('#hand-odds-body').innerHTML='';$('#hand-odds-status').textContent='족보별 사전 계산표를 확인하고 있어요.';
 if(game.players[0].dealt<2||game.busy){$('#equity').innerHTML='—<span>%</span>';$('#equity-detail').textContent='카드 배분·공개 후 승률을 계산합니다.';$('#hand-odds-status').textContent='카드 배분·공개를 기다리고 있어요.';return;}
 if(game.players[0].folded){$('#equity').innerHTML='—<span>%</span>';$('#equity-detail').textContent='폴드했습니다. 종료 후 전체 패를 확인하세요.';$('#hand-odds-status').textContent='폴드한 핸드는 승률을 계산하지 않습니다. 종료 후 공개된 패를 확인하세요.';return;}
 const data=equityRequest={id,hole:[...game.players[0].hole],board:[...game.board],opponents:active().length-1};
 const base=calculateEquity(data.hole,data.board,data.opponents);
 if(!data.board.length||data.opponents===0){showEquity({id,...base});return;}
 const categoryRequest=data.board.length===3?loadFlopProbabilities(data.hole,data.board):Promise.resolve(base);
 const winRequest=data.opponents===1?loadHeadsUpProbabilities(data.hole,data.board):data.opponents===2?loadTwoOpponentProbabilities(data.hole,data.board):data.opponents===3?loadThreeOpponentProbabilities(data.hole,data.board):data.opponents===4?loadFourOpponentProbabilities(data.hole,data.board):data.opponents===5?loadFiveOpponentProbabilities(data.hole,data.board):data.opponents===6?loadSixOpponentProbabilities(data.hole,data.board):Promise.resolve(null);
 $('#equity').innerHTML='—<span>%</span>';$('#equity-detail').textContent=data.opponents<=6?'정확한 사전 승률표를 불러오는 중…':`상대 ${data.opponents}명 정확 승률표는 미제공입니다.`;
 $('#hand-odds-status').textContent='사전 계산표를 불러오는 중…';
 return Promise.allSettled([categoryRequest,winRequest]).then(([category,win])=>{
  const result=category.status==='fulfilled'?category.value:{method:'unavailable',categoryError:true};
  showEquity({id,...result,...(win.status==='fulfilled'&&win.value?win.value:{}),categories:result.categories??[],winError:win.status==='rejected'});
 });
}
function percent(n){return n===0?'0.0%':n<.001?'<0.1%':(n*100).toFixed(1)+'%';}
function showEquity(data){
 if(data.id!==calcId||game.busy||game.players[0].dealt<2)return;
 const chance=Number.isFinite(data.strongest)?data.strongest:Number.isFinite(data.win)&&Number.isFinite(data.tie)?data.win+data.tie:null;
 const hasCounts=data.wins!==undefined&&data.ties!==undefined&&data.denominator!==undefined,winText=hasCounts?exactPercent(data.wins,data.denominator):(data.win*100).toFixed(1),tieText=hasCounts?exactPercent(data.ties,data.denominator):(data.tie*100).toFixed(1);
 const n=chance===null?null:hasCounts?exactPercent(BigInt(data.wins)+BigInt(data.ties),data.denominator):(chance*100).toFixed(1),opponents=active().length-1;
 $('#equity').innerHTML=`${n??'—'}<span>%</span>`;$('#equity-bar').style.width=(n??0)+'%';
 $('#equity-detail').textContent=n!==null?opponents===0?'남은 상대 없음 · 최강 패 100%':`단독 승리 ${winText}% · 동률 ${tieText}%`:data.winError?'정확한 사전 승률표를 불러오지 못했습니다.':`상대 ${opponents}명 정확 승률표는 아직 미제공입니다.`;
 const categories=Array.isArray(data.categories)?data.categories:[];
 $('#hand-odds-body').innerHTML=categories.slice().reverse().map(c=>`<tr><th scope="row">${c.name}</th><td>${percent(c.probability)}</td></tr>`).join('');
 $('#hand-odds-status').textContent=data.categoryError?'족보 확률표를 불러오지 못했습니다. 다음 액션 또는 새로고침 후 다시 시도합니다.':!categories.length?'턴의 족보 완성 분포표는 미제공입니다. 상단 최강 패 확률과는 별개입니다.':game.board.length===3?'최종 족보 완성 확률 · 최강 패 확률과는 별개입니다.':game.board.length===5?'리버의 확정 족보 · 상대보다 강할 확률은 상단에서 확인하세요.':'최종 족보 완성 확률 · 최강 패 확률과는 별개입니다.';
}
function renderHistory(){
 $('#record-count').textContent=`${history.length}개`;$('#history').replaceChildren();
 if(!history.length){$('#history').innerHTML='<p class="muted">핸드가 끝나면<br>상대의 패를 여기서 복기하세요.</p>';return;}
 for(const h of history.slice(0,10)){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=`핸드 ${h.hand}　${h.net>=0?'+':''}${h.net}칩`;details.append(summary);const body=document.createElement('div');body.innerHTML=`<div class="cards mini history-board">${h.board.map((c,i)=>card(c).replace('class="card ',`class="card ${i>=(h.revealed??5)?'unplayed ':''}`)).join('')}</div>`+(h.hypothetical?reviewNote(h):'')+h.players.filter(p=>!p.sittingOut).map(p=>resultRow(p,h.board)).join('');const log=document.createElement('p');log.className='history-log';log.textContent=h.log.join(' → ');body.append(log);details.append(body);$('#history').append(details);}
}
$('#new').onclick=()=>{if(game&&!game.done&&game.players.some(p=>p.total>20)&&!confirm('현재 핸드를 종료하고 새 테이블을 시작할까요?'))return;unlockAudio();start(true);};
$('#players').onchange=()=>{const previous=String(game.players.length);if($('#players').value===previous)return;if(!confirm('참가 인원을 변경하면 현재 테이블과 보유 칩이 초기화됩니다. 새 테이블을 시작할까요?')){$('#players').value=previous;syncPlayerPicker();return;}unlockAudio();start(true);};
// Custom single-select listbox. Focus moves through choices without changing
// the table until the user confirms a choice; cancelling restores the selection.
let playerChoice=4;
function syncPlayerPicker(){
 const value=Number($('#players').value);$('#players-value').textContent=`${value}명`;
 for(let n=2;n<=7;n++)$('#players-option-'+n).setAttribute('aria-selected',String(n===value));
}
function closePlayerPicker(restoreFocus=false){
 $('#players-menu').hidden=true;$('#players-toggle').setAttribute('aria-expanded','false');
 if(restoreFocus)$('#players-toggle').focus?.();
}
function openPlayerPicker(value=Number($('#players').value)){
 playerChoice=value;$('#players-menu').hidden=false;$('#players-toggle').setAttribute('aria-expanded','true');$('#players-option-'+value).focus?.();
}
function choosePlayers(value){
 closePlayerPicker(true);$('#players').value=String(value);$('#players').onchange();syncPlayerPicker();
}
$('#players-menu').hidden=true;
$('#players-toggle').onclick=()=>$('#players-menu').hidden?openPlayerPicker():closePlayerPicker(true);
for(let n=2;n<=7;n++)$('#players-option-'+n).onclick=()=>choosePlayers(n);
$('#player-picker').onkeydown=e=>{
 const open=!$('#players-menu').hidden;
 if(e.key==='Escape'&&open){e.preventDefault();closePlayerPicker(true);return;}
 if(e.key==='Tab'){if(open)closePlayerPicker(true);return;}
 if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
  e.preventDefault();const value=e.key==='Home'?2:e.key==='End'?7:open?Math.max(2,Math.min(7,playerChoice+(e.key==='ArrowDown'?1:-1))):Number($('#players').value);openPlayerPicker(value);return;
 }
 if(open&&(e.key==='Enter'||e.key===' ')){e.preventDefault();choosePlayers(playerChoice);}
};
$('#player-picker').onfocusout=e=>{if(!$('#player-picker').contains?.(e.relatedTarget))closePlayerPicker();};
document.addEventListener?.('pointerdown',e=>{if(!$('#player-picker').contains(e.target))closePlayerPicker();});
$('#next').onclick=()=>{if(!game.done)return;unlockAudio();start();};
function heroAction(type){if(game.done||game.busy||game.finishing||game.turn!==0||!game.pending.has(0))return;act(0,type,Number($('#raise-size').value));if(type==='fold')calculate();advance();}
$('#fold').onclick=()=>heroAction('fold');$('#call').onclick=()=>heroAction('call');$('#raise').onclick=()=>heroAction('raise');
$('#raise-size').oninput=()=>{const n=Number($('#raise-size').value);$('#raise-value').textContent=n;$('#raise').textContent=n===game.players[0].bet+game.players[0].stack?'올인':`레이즈 ${n}`;};
function preset(fraction){if(game.done||game.busy||game.finishing||game.turn!==0||!game.pending.has(0)||!canRaise(0))return;const p=game.players[0],slider=$('#raise-size'),pot=game.players.reduce((s,p)=>s+p.total,0),target=fraction===Infinity?p.bet+p.stack:game.current+Math.max(game.minRaise,Math.round(pot*fraction));slider.value=Math.min(Number(slider.max),Math.max(Number(slider.min),target));slider.oninput();}
$('#half-pot').onclick=()=>preset(.5);$('#full-pot').onclick=()=>preset(1);$('#all-in').onclick=()=>preset(Infinity);
$('#toggle-equity').onclick=()=>{const el=$('#equity-content');el.hidden=!el.hidden;$('#toggle-equity').textContent=el.hidden?'보기':'가리기';};
$('#hand-odds-content').hidden=true;
$('#toggle-hand-odds').onclick=()=>{const content=$('#hand-odds-content'),button=$('#toggle-hand-odds');content.hidden=!content.hidden;button.textContent=content.hidden?'족보 완성 확률 보기':'족보 완성 확률 닫기';button.setAttribute?.('aria-expanded',String(!content.hidden));};
$('#help').onclick=$('#install').onclick=()=>$('#help-dialog').showModal();$('#close-help').onclick=()=>$('#help-dialog').close();$('#help-dialog').onclick=e=>{if(e.target===$('#help-dialog'))$('#help-dialog').close();};renderHistory();start();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
