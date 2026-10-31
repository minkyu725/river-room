// Offline exact graph references, not loaded by the app.
const c2=n=>n<2?0:n*(n-1)/2,c3=n=>n<3?0:n*(n-1)*(n-2)/6;
export function graphStats(n,edges){
 const adj=Array.from({length:n},()=>Array(n).fill(0));for(const [a,b]of edges){if(a===b||adj[a][b])throw Error('Expected a simple graph');adj[a][b]=adj[b][a]=1;}
 const d=adj.map(r=>r.reduce((a,b)=>a+b,0)),s=adj.map(r=>r.reduce((sum,x,v)=>sum+x*d[v],0)),common=adj.map(a=>adj.map(b=>a.reduce((sum,x,v)=>sum+x*b[v],0))),t=Array(n).fill(0);let triangles=0;
 for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)if(adj[a][b])for(let c=b+1;c<n;c++)if(adj[a][c]&&adj[b][c]){triangles++;t[a]++;t[b]++;t[c]++;}
 return {n,edges,adj,d,s,common,t,triangles,q:edges.reduce((sum,[a,b])=>sum+d[a]*d[b],0)};
}
export function countThreeMatchings(n,edges){const g=graphStats(n,edges),m=edges.length;return 6*(c3(m)-(m-2)*g.d.reduce((s,d)=>s+c2(d),0)+edges.reduce((s,[a,b])=>s+c2(g.d[a]+g.d[b]-2),0)-g.d.reduce((s,d)=>s+c3(d),0)-g.triangles);}
export function countThreeAfterDeleting(g,a,b){
 const {n,adj,d,s,common,t,triangles,q}=g,e=adj[a][b],m=g.edges.length-d[a]-d[b]+e;let wedges=0,cubes=0,squares=0,stars=0,linear=0,a3=e*d[b];
 for(let v=0;v<n;v++)if(v!==a&&v!==b){const va=adj[v][a],vb=adj[v][b],dv=d[v]-va-vb;wedges+=c2(dv);stars+=c3(dv);cubes+=dv**3;squares+=dv**2;linear+=(va+vb)*(s[v]-va*d[a]-vb*d[b]);a3+=va*common[v][b];}
 const reducedQ=q-d[a]*s[a]-d[b]*s[b]+e*d[a]*d[b]-linear+t[a]+t[b]+a3-e*(2*common[a][b]+d[a]+d[b]-1),reducedTriangles=triangles-t[a]-t[b]+e*common[a][b];
 if(reducedQ<0||reducedTriangles<0)throw Error('Invalid reduced graph moments');
 return 6*(c3(m)-(m-2)*wedges+(cubes-5*squares+6*m)/2+reducedQ-stars-reducedTriangles);
}
export function bruteThreeMatchings(n,edges){let count=0;const disjoint=(a,b)=>a[0]!==b[0]&&a[0]!==b[1]&&a[1]!==b[0]&&a[1]!==b[1];for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++)if(disjoint(edges[i],edges[j]))for(let k=j+1;k<edges.length;k++)if(disjoint(edges[i],edges[k])&&disjoint(edges[j],edges[k]))count++;return count*6;}
