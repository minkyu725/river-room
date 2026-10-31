#pragma once
#include <array>
#include <cstdint>
#include <stdexcept>
// Exact threshold-graph moments. At most 47 remaining cards before hero removal.
struct ThreeGraph {
 int n,m=0;std::array<uint64_t,47> adj{};std::array<int,47>d{},s{},t{};int common[47][47]{};int64_t q=0,triangles=0;
 explicit ThreeGraph(int size=47):n(size){if(n<2||n>47)throw std::runtime_error("invalid graph size");}
 static int64_t c2(int64_t x){return x<2?0:x*(x-1)/2;}static int64_t c3(int64_t x){return x<3?0:x*(x-1)*(x-2)/6;}
 void insert(int a,int b){
  if(a==b||a<0||b<0||a>=n||b>=n||(adj[a]>>b&1))throw std::runtime_error("invalid edge");
  q+=s[a]+s[b]+int64_t(d[a]+1)*(d[b]+1);uint64_t both=adj[a]&adj[b];int count=__builtin_popcountll(both);triangles+=count;t[a]+=count;t[b]+=count;
  while(both){int v=__builtin_ctzll(both);both&=both-1;t[v]++;}
  uint64_t mask=adj[a];while(mask){int v=__builtin_ctzll(mask);mask&=mask-1;s[v]++;common[v][b]++;common[b][v]++;}
  mask=adj[b];while(mask){int v=__builtin_ctzll(mask);mask&=mask-1;s[v]++;common[v][a]++;common[a][v]++;}
  common[a][a]++;common[b][b]++;s[a]+=d[b]+1;s[b]+=d[a]+1;d[a]++;d[b]++;adj[a]|=uint64_t(1)<<b;adj[b]|=uint64_t(1)<<a;m++;
 }
 uint32_t afterDeleting(int a,int b)const{
  int e=adj[a]>>b&1;int64_t edges=m-d[a]-d[b]+e,wedges=0,cubes=0,squares=0,stars=0,linear=0,a3=e*d[b];
  for(int v=0;v<n;v++)if(v!=a&&v!=b){int va=adj[v]>>a&1,vb=adj[v]>>b&1,dv=d[v]-va-vb;wedges+=c2(dv);stars+=c3(dv);cubes+=int64_t(dv)*dv*dv;squares+=dv*dv;linear+=(va+vb)*(s[v]-va*d[a]-vb*d[b]);a3+=va*common[v][b];}
  int64_t reducedQ=q-int64_t(d[a])*s[a]-int64_t(d[b])*s[b]+e*d[a]*d[b]-linear+t[a]+t[b]+a3-e*(2*common[a][b]+d[a]+d[b]-1),reducedTriangles=triangles-t[a]-t[b]+e*common[a][b];
  int64_t count=6*(c3(edges)-(edges-2)*wedges+(cubes-5*squares+6*edges)/2+reducedQ-stars-reducedTriangles);
  if(reducedQ<0||reducedTriangles<0||count<0||count>733055400||count%6)throw std::runtime_error("invalid matching moments");return uint32_t(count);
 }
};
