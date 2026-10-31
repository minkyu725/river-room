import pathlib,gzip,hashlib,json,struct
sha=lambda b:hashlib.sha256(b).hexdigest()
for street,magic,states,denominator in [('turn',b'RT41',13960050,24986926364400),('flop',b'RF41',1286792,587192769563400)]:
 source=pathlib.Path('/private/tmp/river-room-mw4')/street;dest=pathlib.Path(f'data/{street}-four-v1');dest.mkdir(exist_ok=True)
 m={'version':1,'opponents':4,'street':street,'states':states,'denominator':denominator,'canonicalization':'suit-permutation-min-v1','encoding':'gzip-u32-key-u64-wins-ties','generatorSha256':sha(pathlib.Path('scripts/derive-four.cpp').read_bytes()),'parentManifestSha256':sha(pathlib.Path('data/river-four-v1/manifest.json').read_bytes()),'shards':{}}
 files=sorted(source.glob('*.bin'));assert len(files)==169;count=0
 for f in files:
  raw=f.read_bytes();n=struct.unpack_from('<I',raw,4)[0];assert raw[:4]==magic and len(raw)==8+n*20;count+=n
  previous=-1
  for key,wins,ties in struct.iter_unpack('<IQQ',raw[8:]):
   assert key>previous and wins+ties<=denominator;previous=key
  packed=gzip.compress(raw,compresslevel=9,mtime=0);p=dest/(f.name+'.gz');tmp=p.with_suffix('.tmp');tmp.write_bytes(packed);tmp.replace(p)
  m['shards'][f.stem]={'rows':n,'bytes':len(packed),'sha256':sha(packed),'rawBytes':len(raw),'rawSha256':sha(raw)}
 assert count==states
 (dest/'manifest.json').write_text(json.dumps(m,separators=(',',':'))+'\n');print(street,count,sum(v['bytes'] for v in m['shards'].values()),flush=True)
pre=json.loads(pathlib.Path('data/preflop-four-counts.json').read_text());assert len(pre)==169
for row in pre.values():assert int(row[2])==1150897828344264000 and int(row[0])+int(row[1])<=int(row[2])
pathlib.Path('preflop-four-counts.js').write_text('// Exact four-opponent preflop wins, top ties, ordered opponent/runout deals.\nexport const preflopFour='+json.dumps({k:v[:3] for k,v in pre.items()},separators=(',',':'))+';\n')
