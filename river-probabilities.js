import {checkedTableResponse} from './compressed-table.js?v=27';
const permutations=[];
function permute(values,prefix=[]){if(!values.length){permutations.push(prefix);return;}values.forEach((v,i)=>permute(values.filter((_,j)=>i!==j),[...prefix,v]));}permute([0,1,2,3]);
export function canonicalRiver(hole,board){
 const cards=[...hole,...board];if(hole.length!==2||board.length!==5||new Set(cards).size!==7||cards.some(c=>!Number.isInteger(c)||c<0||c>51))throw Error('Invalid river cards');
 let best=Infinity,bestHero=Infinity,chosenBoard,chosenHole;
 for(const p of permutations){const map=c=>p[Math.floor(c/13)]*13+c%13,b=board.map(map).sort((a,b)=>a-b),h=hole.map(map).sort((a,b)=>a-b),key=b.reduce((k,c)=>k*64+c,0),hero=h[0]*64+h[1];if(key<best||key===best&&hero<bestHero){best=key;bestHero=hero;chosenBoard=b;chosenHole=h;}}
 const deck=Array.from({length:52},(_,i)=>i).filter(c=>!chosenBoard.includes(c)),a=deck.indexOf(chosenHole[0]),b=deck.indexOf(chosenHole[1]);
 return {boardKey:best,ordinal:a*(93-a)/2+b-a-1};
}
export function findRiverBoard(buffer,key){const view=new DataView(buffer);if(view.byteLength!==8+134459*4||view.getUint32(0,false)!==0x52524b31||view.getUint32(4,true)!==134459)throw Error('Invalid river index');let lo=0,hi=134458;while(lo<=hi){const mid=(lo+hi)>>1,k=view.getUint32(8+mid*4,true);if(k<key)lo=mid+1;else if(k>key)hi=mid-1;else return mid;}throw Error('River board missing');}
export function readRiverCounts(buffer,boardIndex,ordinal){
 const view=new DataView(buffer),start=view.byteLength>=12?view.getUint32(4,true):0,n=view.byteLength>=12?view.getUint32(8,true):0;
 if(view.byteLength!==12+n*2703||view.getUint32(0,false)!==0x52525731||boardIndex<start||boardIndex>=start+n||ordinal<0||ordinal>=1081||!Number.isInteger(ordinal))throw Error('Invalid river table');
 const bit=ordinal*20,offset=12+(boardIndex-start)*2703+Math.floor(bit/8),value=(view.getUint8(offset)|(view.getUint8(offset+1)<<8)|(view.getUint8(offset+2)<<16))>>>(bit%8),wins=value&1023,ties=(value>>>10)&1023;
 if(wins+ties>990)throw Error('Invalid river counts');return {wins,ties};
}
export function createRiverLoader(fetcher=(...args)=>fetch(...args)){
 let metadata;const cache=new Map(),pending=new Map();
 async function checked(path,entry){return checkedTableResponse(await fetcher('./data/river-hu-v1/'+path+(entry.rawBytes===undefined?'':'.gz')),entry);}
 async function meta(){if(!metadata)metadata=(async()=>{const r=await fetcher('./data/river-hu-v1/gzip-manifest.json');if(!r.ok)throw Error('River manifest unavailable');const m=await r.json();if(m.version!==1||m.canonicalization!=='river-board-suit-min-v1'||m.boards!==134459||m.denominator!==990||m.bytesPerBoard!==2703||Object.keys(m.chunks||{}).length!==1051)throw Error('Invalid river manifest');return {m,keys:await checked('keys.bin',m.keys)};})().catch(e=>{metadata=null;throw e;});return metadata;}
 return async(hole,board)=>{const key=canonicalRiver(hole,board),{m,keys}=await meta(),boardIndex=findRiverBoard(keys,key.boardKey),chunk=Math.floor(boardIndex/128);let buffer;
  if(cache.has(chunk)){buffer=cache.get(chunk);cache.delete(chunk);cache.set(chunk,buffer);}else{if(!pending.has(chunk))pending.set(chunk,checked(chunk+'.bin',m.chunks[chunk]).then(value=>{cache.set(chunk,value);while(cache.size>3)cache.delete(cache.keys().next().value);return value;}).finally(()=>pending.delete(chunk)));buffer=await pending.get(chunk);}
  const {wins,ties}=readRiverCounts(buffer,boardIndex,key.ordinal);return {method:'static-river-hu',wins,ties,win:wins/990,tie:ties/990,equity:(wins+ties/2)/990,strongest:(wins+ties)/990,denominator:990};
 };
}
export const loadRiverProbabilities=createRiverLoader();
