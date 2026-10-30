from pathlib import Path
import hashlib,json,struct
source=hashlib.sha256(Path('scripts/derive-headsup.cpp').read_bytes()).hexdigest()
parent=hashlib.sha256(Path('data/river-hu-v1/manifest.json').read_bytes()).hexdigest()
for street,magic,size,denominator,total in [('flop',b'RFH1',12,1070190,1286792),('turn',b'RTH1',8,45540,13960050)]:
 root=Path(f'data/{street}-hu-v1');shards={};states=0
 for path in sorted(root.glob('*.bin'),key=lambda p:int(p.stem)):
  raw=path.read_bytes();n=struct.unpack_from('<I',raw,4)[0]
  assert raw[:4]==magic and len(raw)==8+n*size
  previous=-1
  for key,wins,ties in struct.iter_unpack('<III' if street=='flop' else '<IHH',raw[8:]):
   assert key>previous and wins+ties<=denominator;previous=key
  shards[path.stem]={'rows':n,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()};states+=n
 assert len(shards)==169 and states==total
 m={'version':1,'street':street,'canonicalization':'suit-permutation-min-v1','denominator':denominator,'recordBytes':size,'states':states,'generatorSha256':source,'riverManifestSha256':parent,'shards':shards}
 (root/'manifest.json').write_text(json.dumps(m,indent=2)+'\n');print(street,states,'states',sum(s['bytes'] for s in shards.values()),'bytes')
rows=json.loads(Path('data/preflop-headsup-counts.json').read_text())
assert len(rows)==169 and all(len(r)==12 and sum(r[3:])==2118760 and r[0]+r[1]<=r[2] and r[2]==2097572400 for r in rows.values())
Path('preflop-headsup-counts.js').write_text('// Own exhaustive counts: wins, ties, denominator, nine category counts. See data/HEADSUP.md\nexport const preflopHeadsUp='+json.dumps(rows,separators=(',',':'))+';\n')
