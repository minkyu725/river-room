#pragma once
#include "matching-three.hpp"
// Keep legacy ThreeGraph immutable: its bytes are part of published provenance.
struct FourGraph:ThreeGraph {
 std::array<int64_t,47>s2{},cycles{};int64_t r=0,totalCycles=0;
 explicit FourGraph(int size=47):ThreeGraph(size){}
 static int64_t c4(int64_t x){return x<4?0:x*(x-1)*(x-2)*(x-3)/24;}
 void insert(int a,int b){
  if(a==b||a<0||b<0||a>=n||b>=n||(adj[a]>>b&1))throw std::runtime_error("invalid edge");
  int64_t a3=0;uint64_t mask=adj[a];while(mask){int v=__builtin_ctzll(mask);mask&=mask-1;a3+=common[v][b];}
  totalCycles+=a3;cycles[a]+=a3;cycles[b]+=a3;
  r+=(2*d[a]+1)*int64_t(s[a])+s2[a]+(2*d[b]+1)*int64_t(s[b])+s2[b]+int64_t(d[a]+1)*(d[b]+1)*(d[a]+d[b]+2);
  mask=adj[a];while(mask){int v=__builtin_ctzll(mask);mask&=mask-1;cycles[v]+=common[v][b];s2[v]+=2*d[a]+1;}
  mask=adj[b];while(mask){int v=__builtin_ctzll(mask);mask&=mask-1;cycles[v]+=common[v][a];s2[v]+=2*d[b]+1;}
  s2[a]+=int64_t(d[b]+1)*(d[b]+1);s2[b]+=int64_t(d[a]+1)*(d[a]+1);ThreeGraph::insert(a,b);
 }
 uint64_t afterDeletingFour(int a,int b)const{
  int e=adj[a]>>b&1;int64_t edges=m-d[a]-d[b]+e,M=0,starsG=0,fourStars=0,p2=0,p3=0,p4=0,pathTerm=0,paws=0,diamonds=0,dt=0,linear=0,a3=e*d[b],deltaR=0;
  for(int v=0;v<n;v++)if(v!=a&&v!=b){
   int va=adj[v]>>a&1,vb=adj[v]>>b&1,delta=va+vb,z=common[v][a]+common[v][b]-e*delta;int64_t sr=s[v]-va*d[a]-vb*d[b],s2r=s2[v]-va*d[a]*d[a]-vb*d[b]*d[b],x=d[v]-delta,sv=sr-z,tv=t[v]-va*common[v][a]-vb*common[v][b]+e*va*vb;
   linear+=delta*sr;a3+=va*common[v][b];deltaR+=-delta*(2*d[v]*sr+s2r)+delta*delta*sr+(2*delta*d[v]-delta*delta)*z;
   M+=c2(x);starsG+=c3(x);fourStars+=c4(x);p2+=x*x;p3+=x*x*x;p4+=x*x*x*x;int64_t term=x*(x-3)+sv;pathTerm+=term*term-x*(x-3)*(x-3)-2*(x-3)*sv;paws+=c3(x)*(3*x-12)+c2(x-1)*sv;diamonds+=c2(x)*c2(x-2)+(x-2)*tv;dt+=x*tv;
  }
  int64_t qr=q-int64_t(d[a])*s[a]-int64_t(d[b])*s[b]+e*d[a]*d[b]-linear+t[a]+t[b]+a3-e*(2*common[a][b]+d[a]+d[b]-1),rr=r-int64_t(d[a])*d[a]*s[a]-d[a]*s2[a]-int64_t(d[b])*d[b]*s[b]-d[b]*s2[b]+int64_t(e)*d[a]*d[b]*(d[a]+d[b])+deltaR,tr=triangles-t[a]-t[b]+e*common[a][b],cr=totalCycles-cycles[a]-cycles[b]+e*(a3-d[a]-d[b]+1)+c2(common[a][b]);
  int64_t W=(p3-5*p2+6*edges)/2+qr,T=starsG+tr,Stars=(p4+3*rr-9*p3-18*qr+26*p2-24*edges)/6,P4=(pathTerm-p3)/2-3*T,C4=3*fourStars+dt-6*tr+cr,Paws=paws+2*dt-12*tr;
  int64_t count=24*(c4(edges)-M*c2(edges-2)+(W-T)*(edges-3)+c2(M)-W-Stars-P4+C4+Paws-diamonds+fourStars);
  if(qr<0||rr<0||tr<0||cr<0||count<0||count>543194051400LL||count%24)throw std::runtime_error("invalid four-matching moments");return uint64_t(count);
 }
};
