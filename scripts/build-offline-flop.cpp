// Read-only quantization of the preserved exact flop tables. No simulation.
#include <algorithm>
#include <array>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>
#include <zlib.h>
using B=std::vector<unsigned char>;using U=__uint128_t;namespace fs=std::filesystem;
uint32_t get(const B&b,size_t o,int n=4){uint32_t x=0;for(int i=0;i<n;i++)x|=uint32_t(b.at(o+i))<<(8*i);return x;}
U wide(const B&b,size_t o,int n){U x=0;for(int i=0;i<n;i++)x|=U(b.at(o+i))<<(8*i);return x;}
U decimal(std::string s){U x=0;for(char c:s)x=x*10+c-'0';return x;}
void put(B&b,uint32_t x,int n){for(int i=0;i<n;i++)b.push_back(x>>(8*i));}
B readgzip(std::string p){gzFile f=gzopen(p.c_str(),"rb");if(!f)throw std::runtime_error(p);B b;std::array<unsigned char,65536>a;int n;while((n=gzread(f,a.data(),a.size()))>0)b.insert(b.end(),a.begin(),a.begin()+n);if(n<0)throw std::runtime_error("gzip read");gzclose(f);return b;}
B zip(const B&b){z_stream z{};if(deflateInit2(&z,9,Z_DEFLATED,31,9,Z_DEFAULT_STRATEGY)!=Z_OK)throw std::runtime_error("deflate init");B out(deflateBound(&z,b.size()));z.next_in=const_cast<unsigned char*>(b.data());z.avail_in=b.size();z.next_out=out.data();z.avail_out=out.size();if(deflate(&z,Z_FINISH)!=Z_STREAM_END)throw std::runtime_error("deflate");out.resize(z.total_out);deflateEnd(&z);return out;}
struct Block{uint16_t hero;uint32_t rows,raw;B packed;};
int main(int argc,char**argv){try{std::string dest=argc>1?argv[1]:"/private/tmp/river-compact/candidates";fs::create_directories(dest);std::vector<int>qs={200,250,255,256,275,300,325,333,350,375,400,500,1000,2000,5000,10000,65535};if(argc>2){qs.clear();for(int a=2;a<argc;a++)qs.push_back(std::stoi(argv[a]));}std::vector<std::vector<Block>>all(qs.size());std::vector<int>heroes;for(auto&p:fs::directory_iterator("data/flop-hu-v1")){auto s=p.path().filename().string();if(s.ends_with(".bin.gz"))heroes.push_back(std::stoi(s));}std::sort(heroes.begin(),heroes.end());if(heroes.size()!=169)throw std::runtime_error("heroes");
 std::array<std::string,6>names={"hu","two","three","four","five","six"};std::array<U,6>den={1070190,966381570,792432887400ULL,587192769563400ULL,decimal("391070384529224400"),decimal("232686878794888518000")};uint64_t states=0;
 for(int h:heroes){std::array<B,6>src;uint32_t rows=0;for(int n=0;n<6;n++){src[n]=readgzip("data/flop-"+names[n]+"-v1/"+std::to_string(h)+".bin.gz");if(!n)rows=get(src[n],4);if(get(src[n],4)!=rows)throw std::runtime_error("row count");int w=n<2?4:n==5?16:8;if(src[n].size()!=8+size_t(rows)*(4+2*w))throw std::runtime_error("row size");}states+=rows;
 for(size_t qi=0;qi<qs.size();qi++){int q=qs[qi],width=q>255?2:1;B raw;raw.reserve(rows*(4+12*width));uint32_t last=0;for(uint32_t i=0;i<rows;i++){uint32_t key=get(src[0],8+i*12);if(i&&key<=last)throw std::runtime_error("keys");last=key;put(raw,key,4);uint32_t prevW=q,prevS=q;for(int n=0;n<6;n++){int w=n<2?4:n==5?16:8;size_t o=8+size_t(i)*(4+2*w);if(get(src[n],o)!=key)throw std::runtime_error("alignment");U win=wide(src[n],o+4,w),tie=wide(src[n],o+4+w,w),d=den[n];if(win+tie>d)throw std::runtime_error("count bounds");uint32_t qw=(win*q*2+d)/(d*2),qs=((win+tie)*q*2+d)/(d*2);if(qw>qs||qw>prevW||qs>prevS)throw std::runtime_error("monotonicity");put(raw,n?prevW-qw:qw,width);put(raw,n?prevS-qs:qs,width);prevW=qw;prevS=qs;}}
 all[qi].push_back({uint16_t(h),rows,uint32_t(raw.size()),zip(raw)});
 }if(all[0].size()%20==0)std::cerr<<all[0].size()<<"/169\n";}
 if(states!=1286792)throw std::runtime_error("coverage");for(size_t qi=0;qi<qs.size();qi++){B out={'O','F','P','1'};put(out,qs[qi],4);put(out,qs[qi]>255?2:1,1);put(out,0,1);put(out,169,2);uint32_t offset=12+169*18;for(auto&b:all[qi]){put(out,b.hero,2);put(out,b.rows,4);put(out,offset,4);put(out,b.packed.size(),4);put(out,b.raw,4);offset+=b.packed.size();}for(auto&b:all[qi])out.insert(out.end(),b.packed.begin(),b.packed.end());std::ofstream f(dest+"/flop-q"+std::to_string(qs[qi])+".bin",std::ios::binary);f.write((char*)out.data(),out.size());std::cout<<"{\"q\":"<<qs[qi]<<",\"bytes\":"<<out.size()<<",\"maxErrorPp\":"<<50.0/qs[qi]<<"}\n";}
 }catch(std::exception&e){std::cerr<<e.what()<<'\n';return 1;}}
