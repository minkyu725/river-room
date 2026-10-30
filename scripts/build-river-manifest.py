from pathlib import Path
import hashlib,json,struct
root=Path('data/river-hu-v1');keys=(root/'keys.bin').read_bytes()
assert keys[:4]==b'RRK1' and len(keys)==8+134459*4
values=struct.unpack_from('<134459I',keys,8)
assert all(a<b for a,b in zip(values,values[1:]))
chunks={};states=0
for path in sorted((p for p in root.glob('*.bin') if p.name!='keys.bin'),key=lambda p:int(p.stem)):
 raw=path.read_bytes();start,n=struct.unpack_from('<II',raw,4)
 assert raw[:4]==b'RRW1' and start==int(path.stem)*128 and n==min(128,134459-start) and len(raw)==12+n*2703
 chunks[path.stem]={'start':start,'boards':n,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()};states+=n*1081
assert len(chunks)==1051 and states==145350179
m={'version':1,'canonicalization':'river-board-suit-min-v1','boards':134459,'handsPerBoard':1081,'denominator':990,'bitsPerHand':20,'bytesPerBoard':2703,'boardsPerChunk':128,'storedHandStates':states,'generatorSha256':hashlib.sha256(Path('scripts/generate-river-hu.cpp').read_bytes()).hexdigest(),'keys':{'bytes':len(keys),'sha256':hashlib.sha256(keys).hexdigest()},'chunks':chunks}
(root/'manifest.json').write_text(json.dumps(m,indent=2)+'\n')
print(states,'stored hand states;',sum(c['bytes'] for c in chunks.values())+len(keys),'binary bytes')
