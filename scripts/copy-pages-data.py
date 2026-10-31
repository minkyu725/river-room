"""Publish compressed delivery files while retaining reproducible raw repo data."""
import pathlib,shutil
source=pathlib.Path('data');target=pathlib.Path('_site/data');copied=skipped=0
if target.exists():shutil.rmtree(target)
for p in source.rglob('*'):
 if not p.is_file():continue
 if p.parent.name in {'river-hu-v1','turn-hu-v1','flop-hu-v1'} and p.suffix=='.bin' and p.name!='keys.bin':skipped+=1;continue
 dest=target/p.relative_to(source);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest);copied+=p.stat().st_size
print(f'Published data bytes={copied}; source-only raw shards={skipped}')
