// Offline exact two-opponent aggregation. Opponent-card collisions are
// already accounted for by the river graph matching counts.
#include <algorithm>
#include <array>
#include <chrono>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <set>
#include <vector>
using Perm=std::array<int,4>;std::vector<Perm> perms;uint32_t chooseN[53][6];
uint32_t get32(const uint8_t*p){return p[0]|uint32_t(p[1])<<8|uint32_t(p[2])<<16|uint32_t(p[3])<<24;}
void put32(std::ostream&f,uint32_t n){for(int i=0;i<4;i++)f.put((n>>(8*i))&255);}void put16(std::ostream&f,uint32_t n){f.put(n&255);f.put((n>>8)&255);}
std::vector<uint8_t> read(const std::filesystem::path&p){std::ifstream f(p,std::ios::binary|std::ios::ate);if(!f)throw std::runtime_error("missing "+p.string());auto n=f.tellg();std::vector<uint8_t> v(n);f.seekg(0);f.read(reinterpret_cast<char*>(v.data()),n);if(!f)throw std::runtime_error("read failed");return v;}
int mapped(int c,const Perm&p){return p[c/13]*13+c%13;}unsigned hkey(int a,int b){if(a>b)std::swap(a,b);return a*64+b;}
template<size_t N> unsigned bkey(std::array<int,N> b,const Perm&p){for(int&c:b)c=mapped(c,p);std::sort(b.begin(),b.end());unsigned k=0;for(int c:b)k=k*64+c;return k;}
template<size_t N> unsigned canonical(const std::array<int,N>&b,const std::vector<Perm>&stable){unsigned key=~0u;for(auto&p:stable)key=std::min(key,bkey(b,p));return key;}
int main(){
 Perm p{0,1,2,3};do{perms.push_back(p);}while(std::next_permutation(p.begin(),p.end()));for(int n=0;n<=52;n++){chooseN[n][0]=1;for(int k=1;k<=5;k++)chooseN[n][k]=n?chooseN[n-1][k]+chooseN[n-1][k-1]:0;}
 auto started=std::chrono::steady_clock::now();const std::filesystem::path river="/private/tmp/river-room-mw2/river",turn="/private/tmp/river-room-mw2/turn",flop="/private/tmp/river-room-mw2/flop";std::filesystem::create_directories(turn);std::filesystem::create_directories(flop);
 auto keys=read("data/river-hu-v1/keys.bin");std::vector<unsigned> canonicalKeys(134459);for(int i=0;i<134459;i++)canonicalKeys[i]=get32(keys.data()+8+i*4);
 std::vector<uint32_t> map(2598960);std::filesystem::path mapPath="/private/tmp/river-room-board-map.bin";
 if(std::filesystem::exists(mapPath)&&std::filesystem::file_size(mapPath)==map.size()*4){auto raw=read(mapPath);for(size_t i=0;i<map.size();i++)map[i]=get32(raw.data()+i*4);}else{
  for(int a=0;a<48;a++)for(int b=a+1;b<49;b++)for(int c=b+1;c<50;c++)for(int d=c+1;d<51;d++)for(int e=d+1;e<52;e++){
   std::array<int,5> board{a,b,c,d,e};unsigned best=~0u,pi=0;for(unsigned i=0;i<perms.size();i++){unsigned k=bkey(board,perms[i]);if(k<best){best=k;pi=i;}}
   auto it=std::lower_bound(canonicalKeys.begin(),canonicalKeys.end(),best);if(it==canonicalKeys.end()||*it!=best)throw std::runtime_error("board key missing");unsigned rank=chooseN[a][1]+chooseN[b][2]+chooseN[c][3]+chooseN[d][4]+chooseN[e][5];map[rank]=unsigned(it-canonicalKeys.begin())*32+pi;
  }
  std::ofstream f(mapPath,std::ios::binary);for(auto v:map)put32(f,v);
 }
 std::cout<<"raw board mapping ready\n"<<std::flush;
 std::vector<uint8_t> values(size_t(134459)*5405);for(int chunk=0;chunk<1051;chunk++){auto raw=read(river/(std::to_string(chunk)+".bin"));unsigned start=get32(raw.data()+4),n=get32(raw.data()+8);if(raw.size()!=12+size_t(n)*5405)throw std::runtime_error("bad river chunk");std::copy(raw.begin()+12,raw.end(),values.begin()+size_t(start)*5405);}
 auto lookup=[&](int h0,int h1,std::array<int,5> board){std::sort(board.begin(),board.end());unsigned rank=0;for(int i=0;i<5;i++)rank+=chooseN[board[i]][i+1];uint32_t entry=map[rank];const auto&p=perms[entry&31];int a=mapped(h0,p),b=mapped(h1,p);if(a>b)std::swap(a,b);int ai=a,bi=b;for(int c:board){int mc=mapped(c,p);ai-=mc<a;bi-=mc<b;}int ordinal=ai*(93-ai)/2+bi-ai-1;size_t offset=size_t(entry>>5)*5405+ordinal*5;uint64_t v=0;for(int j=0;j<5;j++)v|=uint64_t(values[offset+j])<<(8*j);return std::array<unsigned,2>{unsigned(v&1048575),unsigned((v>>20)&1048575)};};
 std::set<unsigned> heroes;for(int a=0;a<51;a++)for(int b=a+1;b<52;b++){unsigned k=~0u;for(auto&p:perms)k=std::min(k,hkey(mapped(a,p),mapped(b,p)));heroes.insert(k);}uint64_t turnStates=0,flopStates=0;int done=0;
 std::ofstream pre("data/preflop-two-counts.json.tmp");pre<<"{\n";
 for(unsigned hk:heroes){int h0=hk>>6,h1=hk&63;std::vector<Perm> stable;for(auto&p:perms)if(hkey(mapped(h0,p),mapped(h1,p))==hk)stable.push_back(p);std::vector<int> deck;for(int c=0;c<52;c++)if(c!=h0&&c!=h1)deck.push_back(c);
  std::vector<unsigned> tkeys;std::vector<std::array<unsigned,2>> tcounts;auto tp=turn/(std::to_string(hk)+".bin");
  if(std::filesystem::exists(tp)){auto raw=read(tp);unsigned n=get32(raw.data()+4);if(raw.size()!=8+size_t(n)*12)throw std::runtime_error("bad turn checkpoint");for(unsigned i=0;i<n;i++){tkeys.push_back(get32(raw.data()+8+i*12));const auto*q=raw.data()+12+i*12;tcounts.push_back({get32(q),get32(q+4)});}}
  else{
   std::set<unsigned> unique;for(int a=0;a<47;a++)for(int b=a+1;b<48;b++)for(int c=b+1;c<49;c++)for(int d=c+1;d<50;d++)unique.insert(canonical(std::array<int,4>{deck[a],deck[b],deck[c],deck[d]},stable));tkeys.assign(unique.begin(),unique.end());
   auto temp=tp;temp+=".tmp";std::ofstream out(temp,std::ios::binary);out.write("RT21",4);put32(out,tkeys.size());
   for(unsigned k:tkeys){std::array<int,4> board;unsigned v=k;for(int i=3;i>=0;i--){board[i]=v&63;v>>=6;}std::array<unsigned,2> count{};
    for(int c:deck)if(std::find(board.begin(),board.end(),c)==board.end()){auto r=lookup(h0,h1,{board[0],board[1],board[2],board[3],c});count[0]+=r[0];count[1]+=r[1];}if(count[0]+count[1]>41122620)throw std::runtime_error("turn counts invalid");tcounts.push_back(count);put32(out,k);put32(out,count[0]);put32(out,count[1]);
   }out.close();if(!out)throw std::runtime_error("turn write failed");std::filesystem::rename(temp,tp);
  }
  turnStates+=tkeys.size();auto fraw=read(std::filesystem::path("data/flop-v1")/(std::to_string(hk)+".bin"));unsigned fn=get32(fraw.data()+4);std::vector<unsigned> fkeys;std::vector<std::array<unsigned,2>> fcounts;
  auto fp=flop/(std::to_string(hk)+".bin"),ftemp=fp;ftemp+=".tmp";std::ofstream fout(ftemp,std::ios::binary);fout.write("RF21",4);put32(fout,fn);
  for(unsigned row=0;row<fn;row++){unsigned k=get32(fraw.data()+8+row*22);std::array<int,3> b{int(k>>12),int((k>>6)&63),int(k&63)};std::array<unsigned,2> count{};
   for(int c:deck)if(std::find(b.begin(),b.end(),c)==b.end()){unsigned tk=canonical(std::array<int,4>{b[0],b[1],b[2],c},stable);auto it=std::lower_bound(tkeys.begin(),tkeys.end(),tk);if(it==tkeys.end()||*it!=tk)throw std::runtime_error("turn lookup missing");auto r=tcounts[it-tkeys.begin()];count[0]+=r[0];count[1]+=r[1];}
   if(count[0]%2||count[1]%2)throw std::runtime_error("ordered runout mismatch");count[0]/=2;count[1]/=2;if(count[0]+count[1]>966381570)throw std::runtime_error("flop counts invalid");fkeys.push_back(k);fcounts.push_back(count);put32(fout,k);put32(fout,count[0]);put32(fout,count[1]);
  }fout.close();if(!fout)throw std::runtime_error("flop write failed");std::filesystem::rename(ftemp,fp);flopStates+=fn;
  uint64_t pw=0,pties=0;std::array<uint64_t,9> cats{};for(int a=0;a<48;a++)for(int b=a+1;b<49;b++)for(int c=b+1;c<50;c++){unsigned k=canonical(std::array<int,3>{deck[a],deck[b],deck[c]},stable);auto it=std::lower_bound(fkeys.begin(),fkeys.end(),k);if(it==fkeys.end()||*it!=k)throw std::runtime_error("flop lookup missing");auto r=fcounts[it-fkeys.begin()];pw+=r[0];pties+=r[1];size_t row=it-fkeys.begin();for(int cat=0;cat<9;cat++){const auto*q=fraw.data()+8+row*22+4+cat*2;cats[cat]+=q[0]|unsigned(q[1])<<8;}}
  if(pw%10||pties%10)throw std::runtime_error("preflop runout mismatch");if(done)pre<<",\n";pre<<'"'<<hk<<"\":["<<pw/10<<','<<pties/10<<",1894107877200";for(auto count:cats){if(count%10)throw std::runtime_error("preflop category mismatch");pre<<','<<count/10;}pre<<']';
  if(++done%8==0||done==169)std::cout<<done<<"/169 turn="<<turnStates<<" flop="<<flopStates<<" elapsed="<<std::chrono::duration<double>(std::chrono::steady_clock::now()-started).count()<<"s\n"<<std::flush;
 }
 pre<<"\n}\n";pre.close();if(!pre)throw std::runtime_error("preflop write failed");std::filesystem::rename("data/preflop-two-counts.json.tmp","data/preflop-two-counts.json");if(turnStates!=13960050||flopStates!=1286792)throw std::runtime_error("state count mismatch");
}
