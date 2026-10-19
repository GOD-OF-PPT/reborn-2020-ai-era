"""Compare new complete story results to the intact schema12 T15 original run."""
from pathlib import Path
import json,hashlib
base=Path('goal-1/evidence/t15n-single-screen-closure')
old=Path('goal-1/evidence/t15-r3-regression/story')
new=base/'cumulative-final2/replay/story'
a=json.loads((old/'t14-story-evidence.json').read_text())
b=json.loads((new/'t14-story-evidence.json').read_text())
def refs(value):
 result={}
 if isinstance(value,list):
  for item in value:result.update(refs(item))
 elif isinstance(value,dict):
  if isinstance(value.get('file'),str) and '/' not in value['file'] and isinstance(value.get('sha256'),str):result[value['file']]=value['sha256']
  for key,item in value.items():
   if key!='sourceHashes':result.update(refs(item))
 return result
previous,current=refs(a),refs(b);rows=[]
for name,expected in current.items():
 body=(new/name).read_bytes();prior=(old/name).read_bytes()
 rows.append({'file':name,'newOwnHashValid':hashlib.sha256(body).hexdigest()==expected,'oldOwnHashValid':hashlib.sha256(prior).hexdigest()==previous.get(name),'rawByteEqual':body==prior})
cases={case['id']:case for case in a['cases']};sequences=[]
for case in b['cases']:
 prior=cases[case['id']]
 sequences.append({'id':case['id'],'completeCommandsEqual':case.get('commands')==prior.get('commands'),'seedEqual':case.get('seed')==prior.get('seed'),'versionsEqual':case.get('versions')==prior.get('versions')})
result={'oldReport':str(old/'t14-story-evidence.json'),'newReport':str(new/'t14-story-evidence.json'),'fixedSampleSetEqual':a['fixedSampleSet']==b['fixedSampleSet'],'caseIdsEqual':set(cases)=={c['id'] for c in b['cases']},'snapshotNamesEqual':set(previous)==set(current),'snapshots':len(rows),'rows':rows,'completeCaseSequences':sequences,'scope':'All original fixed cases retained; independent engine equivalence, not native/human/full24quarter acceptance.'}
passed=result['fixedSampleSetEqual'] and result['caseIdsEqual'] and result['snapshotNamesEqual'] and all(all(r[k] for k in ['newOwnHashValid','oldOwnHashValid','rawByteEqual']) for r in rows) and all(all(r[k] for k in ['completeCommandsEqual','seedEqual','versionsEqual']) for r in sequences)
result['passed']=passed
with (base/'story-all-goldens-comparison.json').open('x') as f:json.dump(result,f,indent=2);f.write('\n')
print(json.dumps({'passed':passed,'cases':len(sequences),'snapshots':len(rows)}))
if not passed:raise SystemExit(1)
