import {createOfflineFlop} from './offline-flop.js?v=32';
import {exactRiverCounts,exactTurnCounts,flopCategories,probabilityResult} from './offline-river.js?v=32';
import {model} from './offline-manifest.js?v=32';
let flop,initializing;
self.onmessage=async({data})=>{const {type,id,hole,board,opponents}=data;try{if(type==='init'){if(!initializing)initializing=(async()=>{if(data.buffer.byteLength!==model.bytes)throw Error('Offline model size mismatch');const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data.buffer))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==model.sha256)throw Error('Offline model integrity failure');flop=createOfflineFlop(data.buffer);})();await initializing;self.postMessage({type:'ready'});return;}
 if(!initializing)throw Error('Offline model is not initialized');await initializing;let result;
 if(board.length===3){result=await flop(hole,board,opponents);result.categories=flopCategories(hole,board);}else if(board.length===4)result=probabilityResult(exactTurnCounts(hole,board,opponents),'offline-exact-turn');else if(board.length===5)result=probabilityResult(exactRiverCounts(hole,board,opponents),'offline-exact-river');else throw Error('Unsupported board');self.postMessage({type:'result',id,result});
 }catch(e){self.postMessage({type:'error',id,error:e.message});}};
