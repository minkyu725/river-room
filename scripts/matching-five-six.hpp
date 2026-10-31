#pragma once
#include "matching-four.hpp"
#include "matching-supports.hpp"
struct Host56 {
 int n;int A[47][47]{},C[47][47]{},P[47][47]{},B[47][47]{},d[47]{};uint64_t cliques=0;
 std::array<uint64_t,7> matchings()const{
  uint64_t f[FORM_COUNT][47]{},msg[FORM_COUNT][47]{};
  for(int id=0;id<FORM_COUNT;id++){for(int i=0;i<n;i++){uint64_t value=1;for(int c=1;c<=FORM_CHILDREN[id][0];c++)value*=msg[FORM_CHILDREN[id][c]][i];f[id][i]=value;}if(FORM_MESSAGE[id])for(int i=0;i<n;i++)for(int j=0;j<n;j++)if(A[i][j])msg[id][i]+=f[id][j];}
  uint64_t hom[SUPPORT_COUNT]{};
  for(int k=0;k<SUPPORT_COUNT;k++){const auto&s=SUPPORTS[k];uint64_t value=0;if(s.kind==0){for(int i=0;i<n;i++)value+=f[s.form][i];}else if(s.kind==2)value=24*cliques;else if(s.kind==6){for(int i=0;i<n;i++)value+=uint64_t(P[i][i])*P[i][i];}else{
    int active[6]{},ac=0;for(int i=0;i<s.length;i++)if(s.weights[i])active[ac++]=i;const uint64_t*fw=f[ac?s.weights[active[0]]:0];const uint64_t*gw=f[ac>1?s.weights[active[1]]:0];
    if(s.kind==1&&s.length==3&&ac<2){for(int i=0;i<n;i++)value+=fw[i]*P[i][i];}
    else for(int i=0;i<n;i++)for(int j=0;j<n;j++){
     const uint64_t a=A[i][j],c=C[i][j],p=P[i][j],b=B[i][j],di=d[i],dj=d[j];
     if(s.kind==3)value+=a*c*c;else if(s.kind==4)value+=a*di*c*c;else if(s.kind==5)value+=a*c*b;else if(s.kind==7)value+=a*c*p;else if(s.kind==8)value+=c*c*c;
     else if(s.length==3)value+=ac==2?a*fw[i]*gw[j]*c:a*di*dj*b;
     else if(s.length==4){if(ac<2)value+=fw[i]*c*c;else value+=(active[1]-active[0]==2)?di*dj*c*c:a*di*dj*p;}
     else if(s.length==5)value+=fw[i]*c*p;else if(s.length==6)value+=p*p;
    }
   }hom[k]=value;
  }
  __int128 c[7]{},m[7]{};m[0]=1;std::array<uint64_t,7> result{};result[0]=1;
  for(int k=1;k<=6;k++){__int128 sum=0;for(int i=0;i<SUPPORT_COUNT;i++)sum+=__int128(MATCH_COEFFICIENTS[k][i])*hom[i];if(sum%5040)throw std::runtime_error("nonintegral support log");c[k]=sum/5040;__int128 next=c[k];for(int i=1;i<k;i++)next+=c[i]*m[k-i];if(next%k)throw std::runtime_error("nonintegral support matching");m[k]=next/k;if(m[k]<0||m[k]>__int128(UINT64_MAX))throw std::runtime_error("matching overflow");result[k]=uint64_t(m[k]);}return result;
 }
};
struct FiveSixGraph:FourGraph {
 int p3[47][47]{},weighted[47][47]{};int64_t cliques=0;std::array<int64_t,47>cliqueVertex{};
 unsigned revision=1;mutable unsigned classRevision=0;mutable int vertexClass[47]{};
 struct Cached{unsigned revision=0;std::array<uint64_t,2> value{};};mutable Cached cached[47][47]{};
 explicit FiveSixGraph(int size=47):FourGraph(size){}
 std::array<uint64_t,2> query(int a,int b)const{
  if(classRevision!=revision){int next=0;for(int v=0;v<n;v++){vertexClass[v]=-1;for(int w=0;w<v;w++)if(((adj[v]^adj[w])&~((uint64_t(1)<<v)|(uint64_t(1)<<w)))==0){vertexClass[v]=vertexClass[w];break;}if(vertexClass[v]<0)vertexClass[v]=next++;}classRevision=revision;}
  int ca=vertexClass[a],cb=vertexClass[b];if(ca>cb)std::swap(ca,cb);auto&entry=cached[ca][cb];if(entry.revision==revision)return entry.value;
  std::array<uint64_t,2> value{};int active=0;for(int v=0;v<n;v++)if(v!=a&&v!=b&&d[v]-int(adj[v]>>a&1)-int(adj[v]>>b&1)>0)active++;
  if(active>=10){if(n==47&&m==1081)value={361767238232400ULL,215251506748278000ULL};else{auto result=without(a,b).matchings();value={result[5]*120,result[6]*720};}}
  entry.revision=revision;entry.value=value;return value;
 }
 void insert(int a,int b){
  if(a==b||a<0||b<0||a>=n||b>=n||(adj[a]>>b&1))throw std::runtime_error("invalid edge");
  uint64_t both=adj[a]&adj[b],mask=both;int64_t newCliques=0;while(mask){int v=__builtin_ctzll(mask);mask&=mask-1;int count=__builtin_popcountll(adj[v]&both);newCliques+=count;cliqueVertex[v]+=count;}newCliques/=2;cliques+=newCliques;cliqueVertex[a]+=newCliques;cliqueVertex[b]+=newCliques;
  int aa[47],bb[47];for(int i=0;i<n;i++){aa[i]=adj[i]>>a&1;bb[i]=adj[i]>>b&1;}
  for(int i=0;i<n;i++)for(int j=0;j<n;j++){p3[i][j]+=aa[i]*bb[j]+bb[i]*aa[j];weighted[i][j]+=aa[i]*aa[j]+bb[i]*bb[j];}
  for(int i=0;i<n;i++){p3[i][b]+=common[i][a];p3[i][a]+=common[i][b];p3[a][i]+=common[b][i];p3[b][i]+=common[a][i];p3[i][a]+=aa[i];p3[a][i]+=aa[i];p3[i][b]+=bb[i];p3[b][i]+=bb[i];weighted[a][i]+=(d[b]+1)*bb[i];weighted[i][a]+=(d[b]+1)*bb[i];weighted[b][i]+=(d[a]+1)*aa[i];weighted[i][b]+=(d[a]+1)*aa[i];}
  weighted[a][a]+=d[b]+1;weighted[b][b]+=d[a]+1;p3[a][b]++;p3[b][a]++;FourGraph::insert(a,b);revision++;
 }
 Host56 without(int a,int b)const{
  Host56 h{};int index[47],size=0;for(int v=0;v<n;v++)if(v!=a&&v!=b&&d[v]-int(adj[v]>>a&1)-int(adj[v]>>b&1)>0)index[size++]=v;h.n=size;int e=adj[a]>>b&1;
  int64_t edgeCliques=0;if(e){uint64_t both=adj[a]&adj[b],mask=both;while(mask){int v=__builtin_ctzll(mask);mask&=mask-1;edgeCliques+=__builtin_popcountll(adj[v]&both);}edgeCliques/=2;}
  int64_t count=cliques-cliqueVertex[a]-cliqueVertex[b]+e*edgeCliques;if(count<0)throw std::runtime_error("negative clique count");h.cliques=count;
  for(int i=0;i<h.n;i++){const int v=index[i],va=adj[v]>>a&1,vb=adj[v]>>b&1;h.d[i]=d[v]-va-vb;for(int j=0;j<h.n;j++){const int u=index[j],ua=adj[u]>>a&1,ub=adj[u]>>b&1;h.A[i][j]=adj[v]>>u&1;h.C[i][j]=common[v][u]-va*ua-vb*ub;h.P[i][j]=p3[v][u]-va*common[a][u]-vb*common[b][u]-common[v][a]*ua-common[v][b]*ub+e*(va*ub+vb*ua);uint64_t both=adj[v]&adj[u];h.B[i][j]=weighted[v][u]-(d[a]-e)*va*ua-(d[b]-e)*vb*ub-__builtin_popcountll(both&adj[a])-__builtin_popcountll(both&adj[b]);if(h.C[i][j]<0||h.P[i][j]<0||h.B[i][j]<0)throw std::runtime_error("invalid deleted matrix");}}return h;
 }
};
