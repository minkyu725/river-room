// Exact river heads-up wins/ties. Standalone evaluator, no sampled outcomes.
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
 if(argc>1&&std::string(argv[1])=="--evaluate"){int c;while(std::cin>>c){Masks m{};add(m,c);for(int i=1;i<7;i++){std::cin>>c;add(m,c);}std::cout<<score(m)<<'\n';}return 0;}
 std::filesystem::path dir=argc>1?argv[1]:"data/river-hu-v1";std::filesystem::create_directories(dir);
 std::set<unsigned> unique;
 for(int a=0;a<48;a++)for(int b=a+1;b<49;b++)for(int c=b+1;c<50;c++)for(int d=c+1;d<51;d++)for(int e=d+1;e<52;e++){
  std::array<int,5> board{a,b,c,d,e};unsigned best=~0u;for(auto&p:perms)best=std::min(best,key(board,p));unique.insert(best);
 }
 std::vector<unsigned> boards(unique.begin(),unique.end());if(boards.size()!=134459){std::cerr<<"board state mismatch\n";return 1;}
 {std::ofstream f(dir/"keys.bin",std::ios::binary);f.write("RRK1",4);put32(f,boards.size());for(auto k:boards)put32(f,k);}
 constexpr int perChunk=128,bytesPerBoard=2703;int maxChunks=argc>2?std::stoi(argv[2]):999999;
 auto started=std::chrono::steady_clock::now();uint64_t rows=0;
 for(unsigned start=0,chunk=0;start<boards.size()&&int(chunk)<maxChunks;start+=perChunk,chunk++){
  unsigned n=std::min<unsigned>(perChunk,boards.size()-start);auto path=dir/(std::to_string(chunk)+".bin");
  if(std::filesystem::exists(path)&&std::filesystem::file_size(path)==12+n*bytesPerBoard){rows+=n*1081;continue;}
  auto tmp=path;tmp+=".tmp";std::ofstream out(tmp,std::ios::binary);out.write("RRW1",4);put32(out,start);put32(out,n);
  for(unsigned index=start;index<start+n;index++){
   unsigned k=boards[index];std::array<int,5> board;for(int i=4;i>=0;i--){board[i]=k&63;k>>=6;}
   Masks base{};std::array<bool,52> used{};for(int c:board){add(base,c);used[c]=true;}std::vector<int> deck;for(int c=0;c<52;c++)if(!used[c])deck.push_back(c);
   std::array<Hand,1081> hands;int ordinal=0;
   for(int a=0;a<46;a++){Masks one=base;add(one,deck[a]);for(int b=a+1;b<47;b++){Masks two=one;add(two,deck[b]);hands[ordinal]={score(two),uint16_t(ordinal),uint8_t(a),uint8_t(b)};ordinal++;}}
   std::sort(hands.begin(),hands.end(),[](const Hand&a,const Hand&b){return a.value<b.value;});
   std::array<unsigned,47> lower{},equal{};std::array<uint8_t,bytesPerBoard> packed{};
   for(int lo=0;lo<1081;){int hi=lo+1;while(hi<1081&&hands[hi].value==hands[lo].value)hi++;
    for(int i=lo;i<hi;i++){equal[hands[i].a]++;equal[hands[i].b]++;}
    for(int i=lo;i<hi;i++){const auto&h=hands[i];unsigned wins=lo-lower[h.a]-lower[h.b],ties=hi-lo-equal[h.a]-equal[h.b]+1;if(wins+ties>990){std::cerr<<"deal count error\n";return 1;}unsigned value=(wins|(ties<<10))<<((h.ordinal*20)%8),offset=(h.ordinal*20)/8;for(int j=0;j<3;j++)packed[offset+j]|=(value>>(j*8))&255;}
    for(int c=0;c<47;c++){lower[c]+=equal[c];equal[c]=0;}lo=hi;
   }
   out.write(reinterpret_cast<const char*>(packed.data()),packed.size());rows+=1081;
  }
  out.close();if(!out)return 1;std::filesystem::rename(tmp,path);
  if(chunk%32==0||start+n==boards.size())std::cout<<"chunk="<<chunk<<" boards="<<start+n<<"/"<<boards.size()<<" elapsed="<<std::chrono::duration<double>(std::chrono::steady_clock::now()-started).count()<<"s"<<std::endl;
 }
 std::cout<<"stored_hand_states="<<rows<<std::endl;
}
