// Offline exact graph references, not loaded by the app.
import {graphStats} from './three-opponent-matching.mjs';
const c2=n=>n<2?0:n*(n-1)/2,c3=n=>n<3?0:n*(n-1)*(n-2)/6,c4=n=>n<4?0:n*(n-1)*(n-2)*(n-3)/24;
export function stats4(n,edges){const g=graphStats(n,edges),s2=g.adj.map(r=>r.reduce((s,x,v)=>s+x*g.d[v]**2,0)),r=edges.reduce((s,[a,b])=>s+g.d[a]*g.d[b]*(g.d[a]+g.d[b]),0),cycles=g.common.map((row,v)=>row.reduce((sum,c,u)=>sum+(u===v?0:c2(c)),0)),totalCycles=cycles.reduce((a,b)=>a+b,0)/4;
 return {...g,s2,r,cycles,totalCycles};}
function momentsCount(m,d,s,t,q,r,triangles,cycles){let M=0,starsG=0,fourStars=0,p2=0,p3=0,p4=0,pathTerm=0,paws=0,diamonds=0,dt=0;
 for(let v=0;v<d.length;v++){const x=d[v];M+=c2(x);starsG+=c3(x);fourStars+=c4(x);p2+=x*x;p3+=x**3;p4+=x**4;pathTerm+=(x*(x-3)+s[v])**2-x*(x-3)**2-2*(x-3)*s[v];paws+=c3(x)*(3*x-12)+c2(x-1)*s[v];diamonds+=c2(x)*c2(x-2)+(x-2)*t[v];dt+=x*t[v];}
 const W=(p3-5*p2+6*m)/2+q,T=starsG+triangles,Stars=(p4+3*r-9*p3-18*q+26*p2-24*m)/6,P4=(pathTerm-p3)/2-3*T,C4=3*fourStars+dt-6*triangles+cycles,Paws=paws+2*dt-12*triangles;
 return 24*(c4(m)-M*c2(m-2)+(W-T)*(m-3)+c2(M)-W-Stars-P4+C4+Paws-diamonds+fourStars);}
export function countFour(n,edges){const g=stats4(n,edges);return momentsCount(edges.length,g.d,g.s,g.t,g.q,g.r,g.triangles,g.totalCycles);}
export function countFourDeleting(g,a,b){const {n,adj,d,s,s2,common,t,triangles,q,r,cycles,totalCycles}=g,e=adj[a][b],m=g.edges.length-d[a]-d[b]+e,dd=[],ss=[],tt=[];let linear=0,a3=e*d[b],deltaR=0;
 for(let v=0;v<n;v++)if(v!==a&&v!==b){const va=adj[v][a],vb=adj[v][b],delta=va+vb,z=common[v][a]+common[v][b]-e*delta,sr=s[v]-va*d[a]-vb*d[b],s2r=s2[v]-va*d[a]**2-vb*d[b]**2;dd.push(d[v]-delta);ss.push(sr-z);tt.push(t[v]-va*common[v][a]-vb*common[v][b]+e*va*vb);linear+=delta*sr;a3+=va*common[v][b];deltaR+=-delta*(2*d[v]*sr+s2r)+delta**2*sr+(2*delta*d[v]-delta**2)*z;}
 const qr=q-d[a]*s[a]-d[b]*s[b]+e*d[a]*d[b]-linear+t[a]+t[b]+a3-e*(2*common[a][b]+d[a]+d[b]-1),rr=r-d[a]**2*s[a]-d[a]*s2[a]-d[b]**2*s[b]-d[b]*s2[b]+e*d[a]*d[b]*(d[a]+d[b])+deltaR,tr=triangles-t[a]-t[b]+e*common[a][b],cr=totalCycles-cycles[a]-cycles[b]+e*(a3-d[a]-d[b]+1)+c2(common[a][b]);
 return momentsCount(m,dd,ss,tt,qr,rr,tr,cr);}
export function bruteFour(n,edges){if(n>64)throw Error('Direct oracle supports up to 64 vertices');let result=0;const masks=edges.map(([a,b])=>[(a<32?1<<a:0)|(b<32?1<<b:0),(a>=32?1<<(a-32):0)|(b>=32?1<<(b-32):0)]);const walk=(start,left,lo,hi)=>{if(!left){result++;return;}for(let i=start;i<=edges.length-left;i++){const [l,h]=masks[i];if(!(lo&l)&&!(hi&h))walk(i+1,left-1,lo|l,hi|h);}};walk(0,4,0,0);return result*24;}
