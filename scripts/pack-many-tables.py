"""Exact lossless delivery for stages 5 and 6; run after native checkpoints complete."""
import pathlib,json,hashlib,gzip,struct,sys
n=int(sys.argv[1]);assert n in (5,6);stage='five' if n==5 else 'six';root=pathlib.Path('/private/tmp/river-room-mw56-v1')/stage
sha=lambda b:hashlib.sha256(b).hexdigest();generation=json.loads((root.parent/'generation.json').read_text())
for path,digest in generation['sourceSha256'].items():assert sha(pathlib.Path(path).read_bytes())==digest,'Generator changed while running'
rden=361767238232400 if n==5 else 215251506748278000
tden=rden*46;fden=tden*47//2;pden=fden*1960
river=pathlib.Path(f'data/river-{stage}-v1');river.mkdir(exist_ok=True)
m={'version':1,'opponents':n,'canonicalization':'river-board-suit-min-v1','boards':134459,'rows':145350179,'denominator':str(rden),'bytesPerBoard':17296,'encoding':f'gzip-r{n}w1-u64-wins-ties','generatorSha256':sha(pathlib.Path('scripts/generate-river-five-six.cpp').read_bytes()),'sourceSha256':generation['sourceSha256'],'keysSha256':sha(pathlib.Path('data/river-hu-v1/keys.bin').read_bytes()),'chunks':{}}
if '--streets-only' not in sys.argv:
 for chunk in range(1051):
  raw=(root/'river'/f'{chunk}.bin').read_bytes();start=chunk*128;boards=min(128,134459-start);assert raw[:4]==f'R{n}W1'.encode() and struct.unpack_from('<II',raw,4)==(start,boards) and len(raw)==12+boards*17296
  for wins,ties in struct.iter_unpack('<QQ',raw[12:]):assert wins+ties<=rden and wins%(120 if n==5 else 720)==0 and ties%(120 if n==5 else 720)==0
  packed=gzip.compress(raw,compresslevel=9,mtime=0);target=river/f'{chunk}.bin.gz';temp=target.with_suffix('.tmp');temp.write_bytes(packed);temp.replace(target)
  m['chunks'][str(chunk)]={'bytes':len(packed),'sha256':sha(packed),'rawBytes':len(raw),'rawSha256':sha(raw)}
 (river/'manifest.json').write_text(json.dumps(m,separators=(',',':'))+'\n');print(stage,'river',sum(e['bytes'] for e in m['chunks'].values()),flush=True)
else:
 existing=json.loads((river/'manifest.json').read_text());assert existing['generatorSha256']==m['generatorSha256'] and existing['sourceSha256']==m['sourceSha256']
if '--river-only' in sys.argv:sys.exit(0)
for street,states,den in [('turn',13960050,tden),('flop',1286792,fden)]:
 width=16 if n==6 and street=='flop' else 8;record=4+2*width;dest=pathlib.Path(f'data/{street}-{stage}-v1');dest.mkdir(exist_ok=True)
 m={'version':1,'opponents':n,'street':street,'states':states,'denominator':str(den),'canonicalization':'suit-permutation-min-v1','encoding':f'gzip-u32-key-u{width*8}-wins-ties','generatorSha256':sha(pathlib.Path('scripts/derive-five-six.cpp').read_bytes()),'parentManifestSha256':sha((river/'manifest.json').read_bytes()),'shards':{}}
 files=sorted((root/street).glob('*.bin'));assert len(files)==169;count=0
 for file in files:
  raw=file.read_bytes();rows=struct.unpack_from('<I',raw,4)[0];assert raw[:4]==f'R{street[0].upper()}{n}1'.encode() and len(raw)==8+rows*record;count+=rows;previous=-1
  for offset in range(8,len(raw),record):
   key=struct.unpack_from('<I',raw,offset)[0];wins=int.from_bytes(raw[offset+4:offset+4+width],'little');ties=int.from_bytes(raw[offset+4+width:offset+record],'little');assert key>previous and wins+ties<=den;previous=key
  packed=gzip.compress(raw,compresslevel=9,mtime=0);target=dest/(file.name+'.gz');temp=target.with_suffix('.tmp');temp.write_bytes(packed);temp.replace(target)
  m['shards'][file.stem]={'rows':rows,'bytes':len(packed),'sha256':sha(packed),'rawBytes':len(raw),'rawSha256':sha(raw)}
 assert count==states;(dest/'manifest.json').write_text(json.dumps(m,separators=(',',':'))+'\n');print(stage,street,count,sum(e['bytes'] for e in m['shards'].values()),flush=True)
pre=json.loads(pathlib.Path(f'data/preflop-{stage}-counts.json').read_text());assert len(pre)==169
for row in pre.values():assert int(row[2])==pden and int(row[0])+int(row[1])<=pden
pathlib.Path(f'preflop-{stage}-counts.js').write_text('// Exact all-street aggregation: integer counts preserved as decimal strings.\nexport const preflop'+stage.capitalize()+'='+json.dumps({k:v[:3] for k,v in pre.items()},separators=(',',':'))+';\n')
