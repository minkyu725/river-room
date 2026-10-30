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
export function equity(hole,board,opponents,iterations=1800,random=Math.random){
 if(opponents===0)return {equity:1,win:1,tie:0,iterations:0};const used=new Set([...hole,...board]),available=Array.from({length:52},(_,i)=>i).filter(c=>!used.has(c));let share=0,wins=0,ties=0;
 for(let i=0;i<iterations;i++){const deck=[...available],need=5-board.length+opponents*2;for(let j=0;j<need;j++){const k=j+Math.floor(random()*(deck.length-j));[deck[j],deck[k]]=[deck[k],deck[j]];}const b=[...board,...deck.slice(0,5-board.length)],own=evaluate([...hole,...b]).score;let equal=1,lose=false;for(let j=0;j<opponents;j++){const off=5-board.length+j*2,other=evaluate([...deck.slice(off,off+2),...b]).score;if(other>own){lose=true;break;}if(other===own)equal++;}if(!lose){share+=1/equal;if(equal===1)wins++;else ties++;}}
 return {equity:share/iterations,win:wins/iterations,tie:ties/iterations,iterations};
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
