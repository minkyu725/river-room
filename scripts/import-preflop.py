"""Extract exact, rounded numeric facts from the pinned source hands.json.
Usage: python3 scripts/import-preflop.py /path/to/hands.json
Source and rounding are recorded in EQUITY.md. No estimated field is imported.
"""
import json, sys
from pathlib import Path
source=json.loads(Path(sys.argv[1]).read_text())
assert source['meta']['scale']==10000
assert {'equityVsRandom','winVsRandom','tieVsRandom','potential'} <= set(source['meta']['exact'])
rows={h['hand']:[h['equityVsRandom'],h['winVsRandom'],h['tieVsRandom'],h['potential']] for h in source['hands']}
assert len(rows)==169
assert all(len(r[3])==9 and abs(sum(r[3])-10000)<=4 for r in rows.values())
Path('preflop-equity.js').write_text('// Exact enumeration results, rounded to 1/10000. Provenance: EQUITY.md\nexport const preflopEquity='+json.dumps(rows,separators=(',',':'))+';\n')
