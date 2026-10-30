import {equity} from './engine.js';
self.onmessage=({data})=>{const {id,hole,board,opponents}=data;self.postMessage({id,...equity(hole,board,opponents)});};
