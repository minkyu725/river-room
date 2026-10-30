// Independent exact category generator. Card IDs: suit*13 + rank-2.
// clang++ -O3 -std=c++17 -march=native scripts/generate-flop.cpp -o /tmp/river-flop
#include <algorithm>
#include <array>
#include <chrono>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <numeric>
#include <set>
#include <vector>
using Perm=std::array<int,4>;
using Masks=std::array<unsigned,4>;
std::vector<Perm> perms;
bool straights[8192];
void init(){Perm p{0,1,2,3};do{perms.push_back(p);}while(std::next_permutation(p.begin(),p.end()));for(unsigned m=0;m<8192;m++){straights[m]=(m&0x100f)==0x100f;for(unsigned i=0;i<=8;i++)straights[m]=straights[m]||((m&(31u<<i))==(31u<<i));}}
inline void add(Masks &m,int c){m[c/13]|=1u<<(c%13);}
inline int category(const Masks &s){
 unsigned all=s[0]|s[1]|s[2]|s[3];bool flush=false;
 for(unsigned m:s)if(__builtin_popcount(m)>=5){if(straights[m])return 8;flush=true;}
 unsigned quads=s[0]&s[1]&s[2]&s[3];if(quads)return 7;
 unsigned trips=(s[0]&s[1]&s[2])|(s[0]&s[1]&s[3])|(s[0]&s[2]&s[3])|(s[1]&s[2]&s[3]);
 unsigned pairs=(s[0]&s[1])|(s[0]&s[2])|(s[0]&s[3])|(s[1]&s[2])|(s[1]&s[3])|(s[2]&s[3]);
 if(trips&&__builtin_popcount(pairs)>=2)return 6;
 if(flush)return 5;if(straights[all])return 4;if(trips)return 3;
 int n=__builtin_popcount(pairs);return n>=2?2:n?1:0;
}
int mapcard(int c,const Perm&p){return p[c/13]*13+c%13;}
unsigned holekey(int a,int b){if(a>b)std::swap(a,b);return (a<<6)|b;}
unsigned boardkey(int a,int b,int c){if(a>b)std::swap(a,b);if(b>c)std::swap(b,c);if(a>b)std::swap(a,b);return (a<<12)|(b<<6)|c;}
void put16(std::ostream &f,unsigned n){f.put(n&255);f.put((n>>8)&255);}
void put32(std::ostream &f,unsigned n){put16(f,n&65535);put16(f,n>>16);}
int main(int argc,char**argv){
 init();
 if(argc>1&&std::string(argv[1])=="--evaluate"){
  int c;while(std::cin>>c){Masks m{};add(m,c);for(int i=1;i<7;i++){std::cin>>c;add(m,c);}std::cout<<category(m)<<'\n';}return 0;
 }
 if(argc>1&&std::string(argv[1])=="--selftest"){
  std::array<uint64_t,9> five{},seven{};
  for(int a=0;a<48;a++)for(int b=a+1;b<49;b++)for(int c=b+1;c<50;c++)for(int d=c+1;d<51;d++)for(int e=d+1;e<52;e++){Masks m{};for(int v:{a,b,c,d,e})add(m,v);five[category(m)]++;}
  const std::array<uint64_t,9> expected5{1302540,1098240,123552,54912,10200,5108,3744,624,40};
  if(five!=expected5){std::cerr<<"five card distribution FAILED\n";return 1;}
  for(int a=0;a<46;a++)for(int b=a+1;b<47;b++)for(int c=b+1;c<48;c++)for(int d=c+1;d<49;d++)for(int e=d+1;e<50;e++)for(int f=e+1;f<51;f++)for(int g=f+1;g<52;g++){Masks m{};for(int v:{a,b,c,d,e,f,g})add(m,v);seven[category(m)]++;}
  const std::array<uint64_t,9> expected7{23294460,58627800,31433400,6461620,6180020,4047644,3473184,224848,41584};
  if(seven!=expected7){std::cerr<<"seven card distribution FAILED\n";return 1;}
  std::cout<<"All 2,598,960 five-card and 133,784,560 seven-card hands passed\n";return 0;
 }
 std::filesystem::path dir=argc>1?argv[1]:"data/flop-v1";std::filesystem::create_directories(dir);
 int limit=argc>2?std::stoi(argv[2]):169;
 std::set<unsigned> heroes;for(int a=0;a<51;a++)for(int b=a+1;b<52;b++){unsigned k=~0u;for(auto&p:perms)k=std::min(k,holekey(mapcard(a,p),mapcard(b,p)));heroes.insert(k);}
 auto start=std::chrono::steady_clock::now();uint64_t total=0;int done=0;
 for(unsigned hk:heroes){
  if(done++>=limit)break;int h0=hk>>6,h1=hk&63;std::vector<Perm> stable;
  for(auto&p:perms)if(holekey(mapcard(h0,p),mapcard(h1,p))==hk)stable.push_back(p);
  std::vector<int> deck;for(int c=0;c<52;c++)if(c!=h0&&c!=h1)deck.push_back(c);
  std::set<unsigned> boards;
  for(int a=0;a<48;a++)for(int b=a+1;b<49;b++)for(int c=b+1;c<50;c++){
   unsigned key=~0u;for(auto&p:stable)key=std::min(key,boardkey(mapcard(deck[a],p),mapcard(deck[b],p),mapcard(deck[c],p)));boards.insert(key);
  }
  auto path=dir/(std::to_string(hk)+".bin");total+=boards.size();
  if(std::filesystem::exists(path)&&std::filesystem::file_size(path)==8+boards.size()*22){std::cout<<done<<"/169 resume "<<hk<<" "<<boards.size()<<std::endl;continue;}
  auto tmp=path;tmp+=".tmp";std::ofstream out(tmp,std::ios::binary);out.write("RRF1",4);put32(out,boards.size());
  for(unsigned bk:boards){
   int b0=bk>>12,b1=(bk>>6)&63,b2=bk&63;Masks base{};for(int c:{h0,h1,b0,b1,b2})add(base,c);
   std::vector<int> remain;for(int c:deck)if(c!=b0&&c!=b1&&c!=b2)remain.push_back(c);
   std::array<unsigned,9> counts{};
   for(int i=0;i<46;i++){Masks one=base;add(one,remain[i]);for(int j=i+1;j<47;j++){Masks two=one;add(two,remain[j]);counts[category(two)]++;}}
   if(std::accumulate(counts.begin(),counts.end(),0u)!=1081){std::cerr<<"count mismatch\n";return 1;}
   put32(out,bk);for(auto n:counts)put16(out,n);
  }
  out.close();if(!out){std::cerr<<"write failed\n";return 1;}std::filesystem::rename(tmp,path);
  double elapsed=std::chrono::duration<double>(std::chrono::steady_clock::now()-start).count();
  std::cout<<done<<"/169 generated "<<hk<<" states="<<boards.size()<<" elapsed="<<elapsed<<"s"<<std::endl;
 }
 std::cout<<"total_states="<<total<<std::endl;
 if(limit>=169&&total!=1286792){std::cerr<<"canonical state mismatch\n";return 1;}
}
