// Characters are sampled once per table; hands retain their identity and traits.
export const opponentPool=Object.freeze([
 {name:'민',style:'균형형',aggression:.58,bluffRate:.12},
 {name:'루나',style:'공격형',aggression:.85,bluffRate:.28},
 {name:'제이',style:'신중형',aggression:.34,bluffRate:.07},
 {name:'노아',style:'변칙형',aggression:.73,bluffRate:.32},
 {name:'유진',style:'분석형',aggression:.5,bluffRate:.16},
 {name:'하늘',style:'수비형',aggression:.38,bluffRate:.08},
 {name:'지우',style:'균형형',aggression:.54,bluffRate:.13},
 {name:'이든',style:'공격형',aggression:.78,bluffRate:.22},
 {name:'수아',style:'균형형',aggression:.62,bluffRate:.16},
 {name:'도윤',style:'공격형',aggression:.79,bluffRate:.24},
 {name:'예린',style:'신중형',aggression:.4,bluffRate:.06},
 {name:'서준',style:'변칙형',aggression:.68,bluffRate:.25}
].map((p,avatar)=>Object.freeze({...p,id:'character-'+avatar,avatar})));
export function chooseTableOpponents(count,random=Math.random){
 if(!Number.isInteger(count)||count<1||count>8||typeof random!=='function')throw Error('Invalid opponent selection');
 const pool=[...opponentPool];for(let i=pool.length-1;i>0;i--){const r=random();if(!Number.isFinite(r)||r<0||r>=1)throw Error('Invalid random source');const j=Math.floor(r*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return pool.slice(0,count).map(p=>({...p}));
}
