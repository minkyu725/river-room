import {preflopSix} from './preflop-six-counts.js?v=32';
import {preflopFive} from './preflop-five-counts.js?v=32';
import {bigProbability} from './exact-probability.js?v=32';
import {preflopFour} from './preflop-four-counts.js?v=32';
import {preflopThree} from './preflop-three-counts.js?v=32';
import {preflopTwo} from './preflop-two-counts.js?v=32';
import {preflopHeadsUp} from './preflop-headsup-counts.js?v=32';
export const suits=['♣','♦','♥','♠'];
export const rank=c=>c%13+2;
export const suit=c=>Math.floor(c/13);
export const names=['하이 카드','원페어','투페어','트리플','스트레이트','플러시','풀하우스','포카드','스트레이트 플러시'];
export function shuffled(cards=Array.from({length:52},(_,i)=>i),random=Math.random){const a=[...cards];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function straight(rs){const a=[...new Set(rs)].sort((a,b)=>b-a);if(a.includes(14))a.push(1);for(let i=0;i<=a.length-5;i++)if(a[i]-a[i+4]===4)return a[i];return 0;}
export function evaluate(cards){
 const rs=cards.map(rank).sort((a,b)=>b-a),counts=new Map();rs.forEach(r=>counts.set(r,(counts.get(r)||0)+1));
 const groups=[...counts].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);const flush=[0,1,2,3].map(s=>cards.filter(c=>suit(c)===s).map(rank).sort((a,b)=>b-a)).find(a=>a.length>=5);
 const sf=flush&&straight(flush),quads=groups.find(g=>g[1]===4),trips=groups.filter(g=>g[1]>=3),pairs=groups.filter(g=>g[1]>=2);let v;
 if(sf)v=[8,sf];else if(quads)v=[7,quads[0],...rs.filter(r=>r!==quads[0]).slice(0,1)];
 else if(trips.length&&pairs.some(g=>g[0]!==trips[0][0]))v=[6,trips[0][0],pairs.find(g=>g[0]!==trips[0][0])[0]];
 else if(flush)v=[5,...flush.slice(0,5)];else if(straight(rs))v=[4,straight(rs)];
 else if(trips.length)v=[3,trips[0][0],...rs.filter(r=>r!==trips[0][0]).slice(0,2)];
 else if(pairs.length>=2){const ps=pairs.map(g=>g[0]).sort((a,b)=>b-a).slice(0,2);v=[2,...ps,...rs.filter(r=>!ps.includes(r)).slice(0,1)];}
 else if(pairs.length)v=[1,pairs[0][0],...rs.filter(r=>r!==pairs[0][0]).slice(0,3)];else v=[0,...rs.slice(0,5)];
 while(v.length<6)v.push(0);return {score:v.reduce((n,r)=>n*15+r,0),category:v[0],name:names[v[0]]};
}
// UI-only best-five selection: keep Monte Carlo's evaluate() allocation-light.
export function describeHand(cards){
 const result=evaluate(cards),ordered=[...cards].sort((a,b)=>rank(b)-rank(a)||a-b);
 let best=ordered;
 if(cards.length>=5){
  outer:for(let a=0;a<ordered.length-4;a++)for(let b=a+1;b<ordered.length-3;b++)for(let c=b+1;c<ordered.length-2;c++)for(let d=c+1;d<ordered.length-1;d++)for(let e=d+1;e<ordered.length;e++){
   const five=[ordered[a],ordered[b],ordered[c],ordered[d],ordered[e]];
   if(evaluate(five).score===result.score){best=five;break outer;}
  }
 }
 const counts=new Map();best.forEach(c=>counts.set(rank(c),(counts.get(rank(c))||0)+1));
 const straightHand=result.category===4||result.category===8,wheel=straightHand&&best.some(c=>rank(c)===14)&&best.some(c=>rank(c)===5);
 best.sort((a,b)=>(straightHand?0:counts.get(rank(b))-counts.get(rank(a)))||((wheel&&rank(b)===14?1:rank(b))-(wheel&&rank(a)===14?1:rank(a)))||a-b);
 const label=c=>`${rank(c)<11?rank(c):({11:'J',12:'Q',13:'K',14:'A'})[rank(c)]}${suits[suit(c)]}`;
 const madeCount=({0:1,1:2,2:4,3:3,7:4})[result.category]??5;
 const made=best.slice(0,madeCount).map(label).join(' '),kickers=best.slice(madeCount).map(label).join(' ');
 return {...result,cards:best,madeCards:best.slice(0,madeCount),kickerCards:best.slice(madeCount),label:`${result.name} · ${made}${kickers?' · 키커 '+kickers:''}`};
}
export function equity(hole,board,opponents,iterations=1800,random=Math.random,breakdown=false){
 if(opponents===0&&!breakdown)return {equity:1,win:1,tie:0,iterations:0};const used=new Set([...hole,...board]),available=Array.from({length:52},(_,i)=>i).filter(c=>!used.has(c));const categories=breakdown?names.map((name,category)=>({name,category,samples:0,share:0})):null;let share=0,wins=0,ties=0;
 for(let i=0;i<iterations;i++){const deck=[...available],need=5-board.length+opponents*2;for(let j=0;j<need;j++){const k=j+Math.floor(random()*(deck.length-j));[deck[j],deck[k]]=[deck[k],deck[j]];}const b=[...board,...deck.slice(0,5-board.length)],own=evaluate([...hole,...b]);const bucket=categories?.[own.category];if(bucket)bucket.samples++;let equal=1,lose=false;for(let j=0;j<opponents;j++){const off=5-board.length+j*2,other=evaluate([...deck.slice(off,off+2),...b]).score;if(other>own.score){lose=true;break;}if(other===own.score)equal++;}if(!lose){share+=1/equal;if(bucket)bucket.share+=1/equal;if(equal===1)wins++;else ties++;}}
 return {equity:share/iterations,win:wins/iterations,tie:ties/iterations,iterations,...(categories?{categories:categories.map(({share,...bucket})=>({...bucket,probability:bucket.samples/iterations,equity:bucket.samples?share/bucket.samples:null}))}:{})};
}
export function calculateEquity(hole,board,opponents){
 if(board.length===5){const category=evaluate([...hole,...board]).category;return {method:'static-river',equity:opponents===0?1:null,win:opponents===0?1:null,tie:opponents===0?0:null,strongest:opponents===0?1:null,denominator:1,categories:names.map((name,i)=>({name,category:i,probability:i===category?1:0,equity:null}))};}
 if(board.length)return {method:'unavailable',win:opponents===0?1:null,tie:opponents===0?0:null,strongest:opponents===0?1:null,denominator:1};
 const ranks=hole.map(rank).sort((a,b)=>b-a),low=ranks[1]-2,high=ranks[0]-2,suited=suit(hole[0])===suit(hole[1]),key=low*64+(low===high||!suited?high+13:high),row=preflopHeadsUp[key];
 if(opponents===4||opponents===5||opponents===6)return {method:'static',...bigProbability(...(opponents===6?preflopSix[key]:opponents===5?preflopFive[key]:preflopFour[key])),categories:names.map((name,category)=>({name,category,count:row[3+category],probability:row[3+category]/2118760,equity:null,samples:null}))};
 const counts=opponents===3?preflopThree[key]:opponents===2?preflopTwo[key]:row;
 const win=opponents===0?1:opponents<=3?counts[0]/counts[2]:null,tie=opponents===0?0:opponents<=3?counts[1]/counts[2]:null;
 return {method:'static',wins:opponents===0?1:counts[0],ties:opponents===0?0:counts[1],win,tie,strongest:win===null?null:opponents>=2?(counts[0]+counts[1])/counts[2]:win+tie,equity:win===null||opponents>=2?null:win+tie/2,denominator:opponents===0?1:counts[2],categories:names.map((name,category)=>({name,category,count:row[3+category],probability:row[3+category]/2118760,equity:null,samples:null}))};
}
export function settle(players,board){
 const payouts=players.map(()=>0),pots=[],levels=[...new Set(players.map(p=>p.total).filter(Boolean))].sort((a,b)=>a-b);let previous=0;
 for(const level of levels){const contributors=players.map((p,i)=>({p,i})).filter(x=>x.p.total>=level),amount=(level-previous)*contributors.length;previous=level;const eligible=contributors.filter(x=>!x.p.folded);if(!eligible.length){contributors.forEach(({i})=>payouts[i]+=amount/contributors.length);continue;}const scored=eligible.map(x=>({...x,score:evaluate([...x.p.hole,...board]).score})),best=Math.max(...scored.map(x=>x.score)),winners=scored.filter(x=>x.score===best).map(x=>x.i),each=Math.floor(amount/winners.length);winners.forEach((i,n)=>payouts[i]+=each+(n<amount%winners.length?1:0));pots.push({amount,winners});}
 return {payouts,pots};
}
export function botDecision(view,random=Math.random){
 // The view contains only this bot's hole cards and public information.
 const {hole,board,opponents,call,stack,pot,current,bet,minRaise,aggression,bluffRate,heroAggression,heroBluffs,canRaise}=view;
 const strength=equity(hole,board,opponents,110,random).equity,suspicion=Math.min(.65,.10+heroAggression*.20+heroBluffs*.30+(current>pot*.65?.12:0)),bluff=random()<bluffRate*(board.length?1:.7),odds=call/(pot+call||1);
 if(canRaise&&stack>call&&(bluff||strength>.65+(1-aggression)*.14)&&random()<(bluff?.92:aggression))return {type:'raise',target:Math.min(bet+stack,current+Math.max(minRaise,Math.round(pot*(bluff?.7:.5)/10)*10)),reason:bluff?'블러프 레이즈':'밸류 레이즈'};
 if(call>0&&strength+suspicion*.20<odds+.09&&random()>suspicion*.45)return {type:'fold',reason:'폴드'};
 return {type:'call',reason:call?(suspicion>.38?'블러프 의심 · 콜':'콜'):'체크'};
}
