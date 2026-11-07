// Exchangeable 22-slot completion: P_k = E[C(X,k)/C(22,k)].
// Uniform discrete minimax degree-six approximation; see NINE-PLAYERS.md.
export const momentCoefficients={7:[9/25840,-99/6460,539/2584,-1535/1292,113/34,-821/170,7/2],8:[2379/1683476,-26169/420869,3409651/4208690,-7300383/1683476,989099/88604,-6291447/443020,198677/26060]};
export const momentError={7:0.000348297214,8:0.001413147560};
export function extendMoments(values,n){if(![7,8].includes(n)||values.length!==6||values.some(x=>!Number.isFinite(x)||x<0||x>1))throw Error('Invalid probability moments');if(values.every(x=>x===1))return 1;if(values.every(x=>x===0))return 0;const c=momentCoefficients[n];return Math.max(0,Math.min(values[5],n===8?extendMoments(values,7):1,c[0]+values.reduce((s,p,i)=>s+c[i+1]*p,0)));}
export function extendedResult(rows,n,method){const strongest=extendMoments(rows.map(r=>r.strongest),n),win=Math.min(strongest,extendMoments(rows.map(r=>r.win),n));return {method,win,tie:strongest-win,strongest,equity:null,approximate:true,maxErrorPp:momentError[n]*100,tieMaxErrorPp:momentError[n]*200};}
