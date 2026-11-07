import fs from 'node:fs';import {calculateEquity} from '../engine.js';import {preflopHeadsUp} from '../preflop-headsup-counts.js';import {extendedResult} from '../moment-extension.js';
const out={};for(const key of Object.keys(preflopHeadsUp)){const hole=[Number(key)>>6,Number(key)&63],rows=Array.from({length:6},(_,i)=>calculateEquity(hole,[],i+1));out[key]=[7,8].map(n=>extendedResult(rows,n,'offline-bounded-preflop'));}
fs.writeFileSync('preflop-nine.js','// Generated from preserved exact moments; do not edit.\nexport const preflopNine='+JSON.stringify(out)+';\n');
