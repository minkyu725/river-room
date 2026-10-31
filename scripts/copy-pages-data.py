"""Publish only the embedded offline model; preserve every exact source in Git."""
import pathlib,shutil
source=pathlib.Path('data/offline-v1');target=pathlib.Path('_site/data')
if target.exists():shutil.rmtree(target)
if not (source/'flop.bin').exists():raise RuntimeError('Build and verify the offline model first')
shutil.copytree(source,target/'offline-v1')
print(f'Offline data bytes={sum(p.stat().st_size for p in source.iterdir() if p.is_file())}; exact originals retained in repository')
