// Independent offline scoring/graph reconstruction; never used by the app.
import {evaluate} from '../engine.js';import {countThreeMatchings,bruteThreeMatchings} from './three-opponent-matching.mjs';
export function countThreeOpponents(hole,board,brute=false){const known=[...hole,...board];if(hole.length!==2||board.length!==5||new Set(known).size!==7)throw Error('Expected distinct river cards');const own=evaluate(known).score,deck=Array.from({length:52},(_,i)=>i).filter(c=>!known.includes(c)),good=[],strict=[];
 for(let a=0;a<44;a++)for(let b=a+1;b<45;b++){const score=evaluate([...board,deck[a],deck[b]]).score;if(score<=own)good.push([a,b]);if(score<own)strict.push([a,b]);}
 const count=brute?bruteThreeMatchings:countThreeMatchings,strongest=count(45,good),wins=count(45,strict);return {wins,ties:strongest-wins,strongest,denominator:733055400};
}
