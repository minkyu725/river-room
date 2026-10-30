import {names} from './engine.js?v=20';
const permutations=[];
function permute(values,prefix=[]){if(!values.length){permutations.push(prefix);return;}values.forEach((v,i)=>permute(values.filter((_,j)=>i!==j),[...prefix,v]));}permute([0,1,2,3]);
export function canonicalFlop(hole,board){
 const cards=[...hole,...board];if(hole.length!==2||board.length!==3||new Set(cards).size!==5||cards.some(c=>!Number.isInteger(c)||c<0||c>51))throw Error('Invalid flop cards');
 let best=Infinity,hero,flop;
 for(const p of permutations){const map=c=>p[Math.floor(c/13)]*13+c%13,h=hole.map(map).sort((a,b)=>a-b),b=board.map(map).sort((a,b)=>a-b),hk=h[0]*64+h[1],bk=b[0]*4096+b[1]*64+b[2],key=hk*262144+bk;if(key<best){best=key;hero=hk;flop=bk;}}
 return {hero,flop};
}
export function readFlopCounts(buffer,key){
 const view=new DataView(buffer);if(view.byteLength<8||view.getUint32(0,false)!==0x52524631)throw Error('Invalid flop table');
 const rows=view.getUint32(4,true);if(view.byteLength!==8+rows*22)throw Error('Invalid flop table length');
 let lo=0,hi=rows-1;
 while(lo<=hi){const mid=(lo+hi)>>1,offset=8+mid*22,k=view.getUint32(offset,true);if(k<key)lo=mid+1;else if(k>key)hi=mid-1;else{const counts=Array.from({length:9},(_,i)=>view.getUint16(offset+4+i*2,true));if(counts.reduce((a,b)=>a+b,0)!==1081)throw Error('Invalid flop counts');return counts;}}
 throw Error('Flop state missing');
}
export function createFlopLoader(fetcher=(...args)=>fetch(...args)){
 let manifestPromise;const cache=new Map(),pending=new Map();
 async function manifest(){if(!manifestPromise)manifestPromise=fetcher('./data/flop-v1/manifest.json').then(r=>{if(!r.ok)throw Error('Flop manifest unavailable');return r.json();}).then(m=>{if(m.version!==1||m.denominator!==1081||m.canonicalization!=='suit-permutation-min-v1'||m.states!==1286792||Object.keys(m.shards||{}).length!==169)throw Error('Invalid flop manifest');return m;}).catch(e=>{manifestPromise=null;throw e;});return manifestPromise;}
 async function shard(hero){
  if(cache.has(hero)){const value=cache.get(hero);cache.delete(hero);cache.set(hero,value);return value;}
  if(pending.has(hero))return pending.get(hero);
  const promise=(async()=>{const m=await manifest(),entry=m.shards[hero];if(!entry)throw Error('Flop shard missing');const response=await fetcher(`./data/flop-v1/${hero}.bin`);if(!response.ok)throw Error('Flop shard unavailable');const buffer=await response.arrayBuffer();if(buffer.byteLength!==entry.bytes)throw Error('Flop shard truncated');
   const digest=await globalThis.crypto.subtle.digest('SHA-256',buffer),hash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');if(hash!==entry.sha256)throw Error('Flop shard checksum mismatch');
   cache.set(hero,buffer);while(cache.size>3)cache.delete(cache.keys().next().value);return buffer;
  })();pending.set(hero,promise);try{return await promise;}finally{pending.delete(hero);}
 }
 return async(hole,board)=>{const key=canonicalFlop(hole,board),counts=readFlopCounts(await shard(key.hero),key.flop);return {method:'static-flop',equity:null,tie:null,denominator:1081,categories:names.map((name,category)=>({name,category,probability:counts[category]/1081,count:counts[category],equity:null}))};};
}
export const loadFlopProbabilities=createFlopLoader();
