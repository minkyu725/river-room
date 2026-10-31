import json,pathlib
c=json.loads(pathlib.Path('scripts/matching-catalogue.json').read_text());d=json.loads(pathlib.Path('scripts/matching-homomorphisms.json').read_text());forms=d['forms'];used={v for f in forms for v in f};kinds=['tree','cycle','clique4','diamond','diamond-leaf3','diamond-leaf2','bowtie','house','k23']
lines=['// Generated from the independently verified support catalogue.','#pragma once',f'constexpr int FORM_COUNT={len(forms)},SUPPORT_COUNT={len(c["graphs"])};','struct SupportSpec{int kind,length,form,weights[6];};']
lines+=['constexpr int FORM_CHILDREN[FORM_COUNT][7]={'+','.join('{'+','.join(map(str,[len(f)]+f+[-1]*(6-len(f))))+'}' for f in forms)+'};']
lines+=['constexpr bool FORM_MESSAGE[FORM_COUNT]={'+','.join('true' if i in used else 'false' for i in range(len(forms)))+'};']
lines+=['constexpr SupportSpec SUPPORTS[SUPPORT_COUNT]={'+','.join('{'+','.join(map(str,[kinds.index(s['kind']),len(s.get('weights',[])),s.get('form',0)]))+',{'+','.join(map(str,s.get('weights',[])+[0]*(6-len(s.get('weights',[])))))+'}}' for s in d['descriptors'])+'};']
lines+=['constexpr int64_t MATCH_COEFFICIENTS[7][SUPPORT_COUNT]={'+','.join('{'+','.join(row)+'}' for row in c['coefficients'])+'};']
pathlib.Path('scripts/matching-supports.hpp').write_text('\n'.join(lines)+'\n')
