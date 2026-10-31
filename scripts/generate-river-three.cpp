// Exact three-opponent river wins/ties, with incremental graph moments.
// Full evaluator retained from the independently verified HU generator.
#include "matching-three.hpp"
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
using Masks=std::array<unsigned,4>;
std::vector<std::array<int,4>> perms;
unsigned straightHigh[8192];
void init(){std::array<int,4> p{0,1,2,3};do{perms.push_back(p);}while(std::next_permutation(p.begin(),p.end()));for(unsigned m=0;m<8192;m++){if((m&0x100f)==0x100f)straightHigh[m]=5;for(unsigned i=0;i<=8;i++)if((m&(31u<<i))==(31u<<i))straightHigh[m]=i+6;}}
inline void add(Masks&m,int c){m[c/13]|=1u<<(c%13);}
inline int high(unsigned m){return 33-__builtin_clz(m);}
inline unsigned pack(int cat,int a=0,int b=0,int c=0,int d=0,int e=0){return (((((cat*15+a)*15+b)*15+c)*15+d)*15+e);}
inline unsigned tops(int cat,unsigned mask){int r[5]{};for(int i=0;i<5&&mask;i++){r[i]=high(mask);mask&=~(1u<<(r[i]-2));}return pack(cat,r[0],r[1],r[2],r[3],r[4]);}
unsigned score(const Masks&s){
 unsigned all=s[0]|s[1]|s[2]|s[3],flush=0;for(unsigned m:s)if(__builtin_popcount(m)>=5){if(straightHigh[m])return pack(8,straightHigh[m]);flush=m;}
 unsigned q=s[0]&s[1]&s[2]&s[3];if(q){int r=high(q);return pack(7,r,high(all&~(1u<<(r-2))));}
 unsigned t=(s[0]&s[1]&s[2])|(s[0]&s[1]&s[3])|(s[0]&s[2]&s[3])|(s[1]&s[2]&s[3]);
 unsigned p=(s[0]&s[1])|(s[0]&s[2])|(s[0]&s[3])|(s[1]&s[2])|(s[1]&s[3])|(s[2]&s[3]);
 if(t&&__builtin_popcount(p)>=2){int r=high(t);return pack(6,r,high(p&~(1u<<(r-2))));}
 if(flush)return tops(5,flush);if(straightHigh[all])return pack(4,straightHigh[all]);
 if(t){int r=high(t);unsigned m=all&~(1u<<(r-2));int a=high(m);m&=~(1u<<(a-2));return pack(3,r,a,high(m));}
 if(__builtin_popcount(p)>=2){int a=high(p);p&=~(1u<<(a-2));int b=high(p);return pack(2,a,b,high(all&~((1u<<(a-2))|(1u<<(b-2)))));}
 if(p){int r=high(p);unsigned m=all&~(1u<<(r-2));int a=high(m);m&=~(1u<<(a-2));int b=high(m);m&=~(1u<<(b-2));return pack(1,r,a,b,high(m));}
 return tops(0,all);
}
unsigned key(const std::array<int,5>&cards,const std::array<int,4>&p){std::array<int,5>b;for(int i=0;i<5;i++)b[i]=p[cards[i]/13]*13+cards[i]%13;std::sort(b.begin(),b.end());unsigned k=0;for(int c:b)k=(k<<6)|c;return k;}
void put32(std::ostream&f,unsigned v){for(int i=0;i<4;i++)f.put((v>>(i*8))&255);}
struct Hand{unsigned value;uint16_t ordinal;uint8_t a,b;};
int main(int argc,char**argv){
 init();
 if(argc>1&&std::string(argv[1])=="--graph"){int n,m,a,b;while(std::cin>>n>>m>>a>>b){ThreeGraph g(n);for(int i=0;i<m;i++){int u,v;std::cin>>u>>v;g.insert(u,v);}std::cout<<g.afterDeleting(a,b)<<'\n';}return 0;}
 if(argc>1&&std::string(argv[1])=="--evaluate"){int c;while(std::cin>>c){Masks m{};add(m,c);for(int i=1;i<7;i++){std::cin>>c;add(m,c);}std::cout<<score(m)<<'\n';}return 0;}
 std::filesystem::path dir=argc>1?argv[1]:"/private/tmp/river-room-mw3/river";std::filesystem::create_directories(dir);
 std::ifstream keys("data/river-hu-v1/keys.bin",std::ios::binary);char header[8];keys.read(header,8);if(!keys||std::string(header,4)!="RRK1")throw std::runtime_error("missing canonical river keys");
 std::vector<unsigned> boards(134459);for(auto&k:boards){unsigned char b[4];keys.read(reinterpret_cast<char*>(b),4);k=b[0]|unsigned(b[1])<<8|unsigned(b[2])<<16|unsigned(b[3])<<24;}if(!keys)throw std::runtime_error("truncated keys");
 constexpr int perChunk=128,bytesPerBoard=8648;int maxChunks=argc>2?std::stoi(argv[2]):999999;
 auto started=std::chrono::steady_clock::now();uint64_t rows=0;
 for(unsigned start=0,chunk=0;start<boards.size()&&int(chunk)<maxChunks;start+=perChunk,chunk++){
  unsigned n=std::min<unsigned>(perChunk,boards.size()-start);auto path=dir/(std::to_string(chunk)+".bin");
  if(std::filesystem::exists(path)&&std::filesystem::file_size(path)==12+n*bytesPerBoard){rows+=n*1081;continue;}
  auto tmp=path;tmp+=".tmp";std::ofstream out(tmp,std::ios::binary);out.write("R3W1",4);put32(out,start);put32(out,n);
  for(unsigned index=start;index<start+n;index++){
   unsigned k=boards[index];std::array<int,5> board;for(int i=4;i>=0;i--){board[i]=k&63;k>>=6;}
   Masks base{};std::array<bool,52> used{};for(int c:board){add(base,c);used[c]=true;}std::vector<int> deck;for(int c=0;c<52;c++)if(!used[c])deck.push_back(c);
   std::array<Hand,1081> hands;unsigned pairValues[47][47]{};int ordinal=0;
   for(int a=0;a<46;a++){Masks one=base;add(one,deck[a]);for(int b=a+1;b<47;b++){Masks two=one;add(two,deck[b]);unsigned v=score(two);pairValues[a][b]=pairValues[b][a]=v;hands[ordinal]={v,uint16_t(ordinal),uint8_t(a),uint8_t(b)};ordinal++;}}
   std::sort(hands.begin(),hands.end(),[](const Hand&a,const Hand&b){return a.value<b.value;});
   ThreeGraph graph;std::array<uint8_t,bytesPerBoard> packed{};std::array<uint32_t,1081> wins{};
   for(int lo=0;lo<1081;){int hi=lo+1;while(hi<1081&&hands[hi].value==hands[lo].value)hi++;
    for(int i=lo;i<hi;i++){const auto&h=hands[i];wins[h.ordinal]=graph.afterDeleting(h.a,h.b);}
    for(int i=lo;i<hi;i++)graph.insert(hands[i].a,hands[i].b);
    for(int i=lo;i<hi;i++){const auto&h=hands[i];uint32_t strongest=graph.afterDeleting(h.a,h.b),win=wins[h.ordinal];if(win>strongest)throw std::runtime_error("invalid three-opponent count");uint32_t counts[2]{win,strongest-win};for(int field=0;field<2;field++)for(int byte=0;byte<4;byte++)packed[h.ordinal*8+field*4+byte]=(counts[field]>>(8*byte))&255;}
    lo=hi;
   }
   out.write(reinterpret_cast<const char*>(packed.data()),packed.size());rows+=1081;
  }
  out.close();if(!out)return 1;std::filesystem::rename(tmp,path);
  if(chunk%32==0||start+n==boards.size())std::cout<<"chunk="<<chunk<<" boards="<<start+n<<"/"<<boards.size()<<" elapsed="<<std::chrono::duration<double>(std::chrono::steady_clock::now()-started).count()<<"s"<<std::endl;
 }
 std::cout<<"stored_hand_states="<<rows<<std::endl;
}
