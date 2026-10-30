import {equity} from './engine.js?v=10';
self.onmessage=({data})=>{const {id,hole,board,opponents}=data;self.postMessage({id,...equity(hole,board,opponents,1800,Math.random,true)});};
