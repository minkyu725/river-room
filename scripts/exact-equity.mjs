// Offline reference enumerator for generating/validating future static tables.
import {evaluate,names} from '../engine.js';
// Uniform unknown hands, with unordered board runouts and labelled opponents.
// Folded/private cards are unknown and must never be removed from this deck.
export function equityCaseCount(hole,board,opponents){
 function choose(n,k){let v=1n;for(let i=1;i<=k;i++)v=v*BigInt(n-i+1)/BigInt(i);return v;}
 let remaining=52-hole.length-board.length;const missing=5-board.length;
 let cases=choose(remaining,missing);remaining-=missing;
 for(let i=0;i<opponents;i++){cases*=choose(remaining,2);remaining-=2;}
 return cases;
}
// Offline data-generation utility; never called by the game UI or Worker.
export function exactEquity(hole,board,opponents,limit=50000){
 const cases=equityCaseCount(hole,board,opponents);
 if(cases>BigInt(limit))return null;
 const used=new Set([...hole,...board]),deck=Array.from({length:52},(_,i)=>i).filter(c=>!used.has(c));
 const categories=names.map((name,category)=>({name,category,samples:0,share:0}));let share=0,wins=0,ties=0,iterations=0;
 function combinations(pool,count,visit,picked=[],start=0){
  if(!count){visit(picked,pool.filter(c=>!picked.includes(c)));return;}
  for(let i=start;i<=pool.length-count;i++)combinations(pool,count-1,visit,[...picked,pool[i]],i+1);
 }
 combinations(deck,5-board.length,(runout,available)=>{
  const fullBoard=[...board,...runout],own=evaluate([...hole,...fullBoard]),bucket=categories[own.category];
  function opponentsAt(pool,index,equal,lost){
   if(index===opponents){iterations++;bucket.samples++;if(!lost){const fraction=1/equal;share+=fraction;bucket.share+=fraction;if(equal===1)wins++;else ties++;}return;}
   combinations(pool,2,(hand,rest)=>{const score=evaluate([...hand,...fullBoard]).score;opponentsAt(rest,index+1,equal+(score===own.score?1:0),lost||score>own.score);});
  }
  opponentsAt(available,0,1,false);
 });
 return {method:'exact',cases:cases.toString(),equity:share/iterations,win:wins/iterations,tie:ties/iterations,iterations,categories:categories.map(({share,...bucket})=>({...bucket,probability:bucket.samples/iterations,equity:bucket.samples?share/bucket.samples:null}))};
}
