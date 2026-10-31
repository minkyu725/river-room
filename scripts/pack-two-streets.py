import pathlib,gzip,hashlib,json,struct
sha=lambda b:hashlib.sha256(b).hexdigest()
for street,magic,states,denominator in [('turn',b'RT21',13960050,41122620),('flop',b'RF21',1286792,966381570)]:
 source=pathlib.Path('/private/tmp/river-room-mw2')/street;dest=pathlib.Path(f'data/{street}-two-v1');dest.mkdir(exist_ok=True)
 m={'version':1,'opponents':2,'street':street,'states':states,'denominator':denominator,'canonicalization':'suit-permutation-min-v1','encoding':'gzip-u32-key-wins-ties','generatorSha256':sha(pathlib.Path('scripts/derive-two.cpp').read_bytes()),'parentManifestSha256':sha(pathlib.Path('data/river-two-v1/manifest.json').read_bytes()),'shards':{}}
 files=sorted(source.glob('*.bin'));assert len(files)==169;count=0
 for f in files:
  raw=f.read_bytes();n=struct.unpack_from('<I',raw,4)[0];assert raw[:4]==magic and len(raw)==8+n*12;count+=n
  previous=-1
  for key,wins,ties in struct.iter_unpack('<III',raw[8:]):
   assert key>previous and wins+ties<=denominator;previous=key
  packed=gzip.compress(raw,compresslevel=9,mtime=0);p=dest/(f.name+'.gz');tmp=p.with_suffix('.tmp');tmp.write_bytes(packed);tmp.replace(p)
  m['shards'][f.stem]={'rows':n,'bytes':len(packed),'sha256':sha(packed),'rawBytes':len(raw),'rawSha256':sha(raw)}
 assert count==states
 (dest/'manifest.json').write_text(json.dumps(m,separators=(',',':'))+'\n');print(street,count,sum(v['bytes'] for v in m['shards'].values()),flush=True)
pre=json.loads(pathlib.Path('data/preflop-two-counts.json').read_text());assert len(pre)==169
for row in pre.values():assert row[2]==1894107877200 and row[0]+row[1]<=row[2]
pathlib.Path('preflop-two-counts.js').write_text('// Exact two-opponent preflop wins, top ties, ordered opponent/runout deals.\nexport const preflopTwo='+json.dumps({k:v[:3] for k,v in pre.items()},separators=(',',':'))+';\n')
