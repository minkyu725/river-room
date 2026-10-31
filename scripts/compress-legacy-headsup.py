"""Keep verified source binaries, emit byte-identical gzip delivery manifests."""
import pathlib,json,gzip,hashlib
sha=lambda b:hashlib.sha256(b).hexdigest()
for street in ['river','turn','flop']:
 root=pathlib.Path(f'data/{street}-hu-v1');source=(root/'manifest.json').read_bytes();m=json.loads(source);m['sourceManifestSha256']=sha(source);m['compression']='gzip';entries=m['chunks' if street=='river' else 'shards'];raw_total=packed_total=0
 for key,e in entries.items():
  raw=(root/f'{key}.bin').read_bytes();assert len(raw)==e['bytes'] and sha(raw)==e['sha256'];packed=gzip.compress(raw,compresslevel=9,mtime=0);dest=root/f'{key}.bin.gz';tmp=dest.with_suffix('.tmp');tmp.write_bytes(packed);tmp.replace(dest);raw_total+=len(raw);packed_total+=len(packed)
  entries[key]={**e,'rawBytes':len(raw),'rawSha256':e['sha256'],'bytes':len(packed),'sha256':sha(packed)}
 (root/'gzip-manifest.json').write_text(json.dumps(m,separators=(',',':'))+'\n');print(street,raw_total,packed_total,flush=True)
