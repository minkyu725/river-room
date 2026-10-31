"""Lossless deterministic gzip shards; run after the complete native generation."""
import gzip,hashlib,json,pathlib,struct,sys
source=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/private/tmp/river-room-mw4/river')
dest=pathlib.Path('data/river-four-v1');dest.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
m={'version':1,'opponents':4,'canonicalization':'river-board-suit-min-v1','boards':134459,'rows':145350179,'denominator':543194051400,'bytesPerBoard':17296,'encoding':'gzip-r4w1-u64-wins-ties','generatorSha256':sha(pathlib.Path('scripts/generate-river-four.cpp').read_bytes()),'matchingHeaderSha256':sha(pathlib.Path('scripts/matching-four.hpp').read_bytes()),'parentHeaderSha256':sha(pathlib.Path('scripts/matching-three.hpp').read_bytes()),'keysSha256':sha(pathlib.Path('data/river-hu-v1/keys.bin').read_bytes()),'chunks':{}}
for chunk in range(1051):
 raw=(source/f'{chunk}.bin').read_bytes();start=chunk*128;n=min(128,134459-start)
 assert raw[:4]==b'R4W1' and struct.unpack_from('<II',raw,4)==(start,n) and len(raw)==12+n*17296
 packed=gzip.compress(raw,compresslevel=9,mtime=0)
 p=dest/f'{chunk}.bin.gz';tmp=p.with_suffix('.tmp');tmp.write_bytes(packed);tmp.replace(p)
 m['chunks'][str(chunk)]={'bytes':len(packed),'sha256':sha(packed),'rawBytes':len(raw),'rawSha256':sha(raw)}
(dest/'manifest.json').write_text(json.dumps(m,separators=(',',':'))+'\n')
print(json.dumps({'rawBytes':sum(x['rawBytes'] for x in m['chunks'].values()),'gzipBytes':sum(x['bytes'] for x in m['chunks'].values()),'chunks':len(m['chunks'])}))
