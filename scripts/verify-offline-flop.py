"""Independent exhaustive check against all preserved exact flop counts."""
import gzip,hashlib,json,struct,time
from pathlib import Path
start=time.time();blob=Path('data/offline-v1/flop.bin').read_bytes();magic,q,width,zero,blocks=struct.unpack_from('<4sIBBH',blob);assert (magic,q,width,zero,blocks)==(b'OFP1',255,1,0,169)
names=['hu','two','three','four','five','six'];source_hashes={};maxima=[[0,0,0]for _ in names];examples=[[None]*3 for _ in names];states=0;entries=[];offset=12+18*blocks
for j in range(blocks):
 hero,rows,off,length,rawlen=struct.unpack_from('<HIIII',blob,12+j*18);assert off==offset;offset+=length;raw=gzip.decompress(blob[off:off+length]);assert len(raw)==rawlen==rows*16
 src=[]
 for name in names:
  p=Path(f'data/flop-{name}-v1/{hero}.bin.gz');b=p.read_bytes();source_hashes[str(p)]=hashlib.sha256(b).hexdigest();m=json.loads(Path(f'data/flop-{name}-v1/manifest.json').read_text());a=gzip.decompress(b);assert struct.unpack_from('<I',a,4)[0]==rows;src.append((a,int(m['denominator'])))
 last=-1
 for i,row in enumerate(struct.iter_unpack('<I12B',raw)):
  key,*codes=row;assert key>last;last=key;pw=ps=0
  for n,(a,d)in enumerate(src):
   cw,cs=codes[2*n:2*n+2];wq,sq=(cw,cs)if not n else(pw-cw,ps-cs);pw,ps=wq,sq;assert 0<=wq<=sq<=q
   width=4 if n<2 else 16 if n==5 else 8;o=8+i*(4+width*2);assert struct.unpack_from('<I',a,o)[0]==key;w=int.from_bytes(a[o+4:o+4+width],'little');t=int.from_bytes(a[o+4+width:o+4+2*width],'little');assert wq==(2*w*q+d)//(2*d);assert sq==(2*(w+t)*q+d)//(2*d)
   errors=[abs(wq*d-w*q),abs(sq*d-(w+t)*q),abs((sq-wq)*d-t*q)];assert errors[0]*2<=d and errors[1]*2<=d and errors[2]<=d
   for c,e in enumerate(errors):
    if e>maxima[n][c]:maxima[n][c]=e;examples[n][c]={'hero':hero,'boardKey':key,'row':i}
 states+=rows;entries.append({'hero':hero,'rows':rows,'sha256':hashlib.sha256(raw).hexdigest()})
 if j%20==0:print(j,states,round(time.time()-start,1),flush=True)
assert states==1286792 and offset==len(blob)
report={'version':1,'q':q,'states':states,'opponents':6,'checkedProbabilities':states*6*3,'method':'all states against preserved exact integer counts; nearest fixed-point rounding, no learned model','boundPp':{'strongest':50/q,'win':50/q,'tie':100/q},'maxObservedErrorPp':{},'worstCases':examples,'bytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest(),'generatorSha256':hashlib.sha256(Path('scripts/build-offline-flop.cpp').read_bytes()).hexdigest(),'verifierSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'rawBlockHashes':entries,'sourceHashes':source_hashes}
for n,name in enumerate(names):
 d=int(json.loads(Path(f'data/flop-{name}-v1/manifest.json').read_text())['denominator']);report['maxObservedErrorPp'][str(n+1)]={k:100*maxima[n][c]/(q*d)for c,k in enumerate(['win','strongest','tie'])}
Path('data/offline-v1/verification.json').write_text(json.dumps(report,indent=2)+'\n');print({k:report[k]for k in ['states','checkedProbabilities','bytes','boundPp','maxObservedErrorPp']})
