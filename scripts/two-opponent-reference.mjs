// Offline oracle for the next static-table stage. Never imported by the app.
import {evaluate} from '../engine.js';
export function countTwoOpponents(hole,board){
 const known=[...hole,...board];if(hole.length!==2||board.length!==5||new Set(known).size!==7||known.some(c=>!Number.isInteger(c)||c<0||c>51))throw Error('Expected seven distinct cards');
 const own=evaluate(known).score,deck=Array.from({length:52},(_,i)=>i).filter(c=>!known.includes(c));
 const goodDegrees=Array(45).fill(0),strictDegrees=Array(45).fill(0);let goodEdges=0,strictEdges=0;const hands=[];
 for(let a=0;a<44;a++)for(let b=a+1;b<45;b++){const score=evaluate([deck[a],deck[b],...board]).score;hands.push({a,b,score});if(score<=own){goodEdges++;goodDegrees[a]++;goodDegrees[b]++;}if(score<own){strictEdges++;strictDegrees[a]++;strictDegrees[b]++;}}
 const choose2=n=>n<2?0:n*(n-1)/2;
 // Unordered pairs of disjoint graph edges, then label the two opponents.
 const disjointPairs=(edges,degrees)=>2*(choose2(edges)-degrees.reduce((n,d)=>n+choose2(d),0));
 const strongest=disjointPairs(goodEdges,goodDegrees),wins=disjointPairs(strictEdges,strictDegrees),ties=strongest-wins;
 return {strongest,wins,ties,denominator:893970,hands,own};
}
export function bruteForceTwoOpponents(hole,board){
 const own=evaluate([...hole,...board]).score,deck=Array.from({length:52},(_,i)=>i).filter(c=>![...hole,...board].includes(c)),hands=[];
 for(let a=0;a<44;a++)for(let b=a+1;b<45;b++)hands.push({a,b,score:evaluate([deck[a],deck[b],...board]).score});
 let strongest=0,wins=0,denominator=0;
 for(const a of hands)for(const b of hands){if(a.a===b.a||a.a===b.b||a.b===b.a||a.b===b.b)continue;denominator++;if(a.score<=own&&b.score<=own)strongest++;if(a.score<own&&b.score<own)wins++;}
 return {strongest,wins,ties:strongest-wins,denominator};
}
