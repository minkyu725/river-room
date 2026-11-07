"""Independent exact-rational proof + all-row comparison to untouched exact source counts."""
from pathlib import Path
from fractions import Fraction as F
from math import comb,floor
import gzip,struct,hashlib,json
C=[[F(9,25840),F(-99,6460),F(539,2584),F(-1535,1292),F(113,34),F(-821,170),F(7,2)],[F(2379,1683476),F(-26169,420869),F(3409651,4208690),F(-7300383,1683476),F(989099,88604),F(-6291447,443020),F(198677,26060)]]
basis=lambda x,k:F(comb(x,k) if x>=k else 0,comb(22,k))
bounds=[max(abs(sum(c[k]*basis(x,k) for k in range(7))-basis(x,n)) for x in range(23)) for n,c in zip([7,8],C)]
assert float(bounds[0])<.000348297214 and float(bounds[1])<.001413147560
cf=[list(map(float,c)) for c in C];den=[1070190,966381570,792432887400,587192769563400,391070384529224400,232686878794888518000];names=['hu','two','three','four','five','six'];widths=[4,4,8,8,8,16]
b=Path('data/nine-v1/flop.bin').read_bytes();assert b[:4]==b'NIN1' and struct.unpack_from('<I',b,4)[0]==169
old=Path('data/offline-v1/flop.bin').read_bytes();states=0;sources={};blocks=[]
for i in range(169):
 h,rows,o,size,raw=struct.unpack_from('<HIIII',b,8+18*i);assert (h,rows)==struct.unpack_from('<HI',old,12+18*i);a=gzip.decompress(b[o:o+size]);assert len(a)==raw==rows*4
 src=[]
 for name,w in zip(names,widths):
  p=Path(f'data/flop-{name}-v1/{h}.bin.gz');z=p.read_bytes();sources[str(p)]=hashlib.sha256(z).hexdigest();d=gzip.decompress(z);assert len(d)==8+rows*(4+2*w);src.append(d)
 for j in range(rows):
  vals=[[],[]];keys=[]
  for d,w,denom in zip(src,widths,den):
   off=8+j*(4+2*w);keys.append(struct.unpack_from('<I',d,off)[0]);win=int.from_bytes(d[off+4:off+4+w],'little');tie=int.from_bytes(d[off+4+w:off+4+2*w],'little');vals[0].append(win/denom);vals[1].append((win+tie)/denom)
  assert len(set(keys))==1
  prev=[255,255]
  for ni,c in enumerate(cf):
   q=[]
   for m,v in enumerate(vals):
    p=c[0]+sum(x*y for x,y in zip(c[1:],v));p=0 if all(x==0 for x in v) else 1 if all(x==1 for x in v) else p;p=max(0,min(v[5],p));q.append(min(prev[m],floor(p*255+.5)))
   q[0]=min(q);actual=list(a[j*4+ni*2:j*4+ni*2+2]);assert actual==q,(h,j,ni,actual,q);prev=q
 states+=rows;blocks.append({'hero':h,'rows':rows,'sha256':hashlib.sha256(a).hexdigest()})
assert states==1286792
pretext=Path('preflop-nine.js').read_text();pre=json.loads(pretext.split('=',1)[1].strip().rstrip(';'))
preSources=[]
for name in ['headsup','two','three','four','five','six']:
 p=Path(f'data/preflop-{name}-counts.json');z=p.read_bytes();sources[str(p)]=hashlib.sha256(z).hexdigest();preSources.append(json.loads(z))
assert len(pre)==169
for key,rows in pre.items():
 ps=[[F(int(src[key][0]),int(src[key][2])) for src in preSources],[F(int(src[key][0])+int(src[key][1]),int(src[key][2])) for src in preSources]]
 previous=[F(1),F(1)]
 for ni,c in enumerate(C):
  q=[]
  for m,v in enumerate(ps):
   v0=c[0]+sum(x*y for x,y in zip(c[1:],v));v0=F(0) if all(x==0 for x in v) else F(1) if all(x==1 for x in v) else v0;q.append(max(F(0),min(v[5],previous[m],v0)))
  q[0]=min(q);assert abs(rows[ni]['win']-float(q[0]))<1e-12;assert abs(rows[ni]['strongest']-float(q[1]))<1e-12;previous=q
report={'version':1,'states':states,'checkedProbabilities':states*4,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'preflopClasses':len(pre),'preflopSha256':hashlib.sha256(Path('preflop-nine.js').read_bytes()).hexdigest(),'basisSlots':22,'rationalCoefficients':[[str(x) for x in c] for c in C],'rationalMaxResidual':[str(x) for x in bounds],'boundPp':{str(n):{'preflopTurnRiver':float(e)*100+1e-8,'flop':float(e)*100+50/255+1e-8,'flopDisplay':float(e)*100+50/255+.05+1e-8,'tieFlopDisplay':float(e)*200+100/255+.05+1e-8} for n,e in zip([7,8],bounds)},'sourceHashes':sources,'rawBlocks':blocks,'generatorSha256':hashlib.sha256(Path('scripts/build-nine-flop.cpp').read_bytes()).hexdigest(),'verifierSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
Path('data/nine-v1/verification.json').write_text(json.dumps(report,indent=2)+'\n');print(states,'states fully verified;',report['boundPp'])
