"""Validate every record and write a reproducible manifest after generation."""
from pathlib import Path
import hashlib, json, struct
root=Path('data/flop-v1')
shards={}
states=0
for path in sorted(root.glob('*.bin'),key=lambda p:int(p.stem)):
 raw=path.read_bytes()
 assert raw[:4]==b'RRF1'
 count=struct.unpack_from('<I',raw,4)[0]
 assert len(raw)==8+count*22
 previous=-1
 for key,*counts in struct.iter_unpack('<I9H',raw[8:]):
  assert key>previous and sum(counts)==1081
  previous=key
 shards[path.stem]={'rows':count,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
 states+=count
assert len(shards)==169 and states==1286792
manifest={'version':1,'canonicalization':'suit-permutation-min-v1','cardEncoding':'suit*13+rank-2','denominator':1081,'categories':9,'recordBytes':22,'states':states,'generatorSha256':hashlib.sha256(Path('scripts/generate-flop.cpp').read_bytes()).hexdigest(),'shards':shards}
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'{states:,} states, {len(shards)} shards, {sum(s["bytes"] for s in shards.values()):,} bytes; all counts sum to 1081')
