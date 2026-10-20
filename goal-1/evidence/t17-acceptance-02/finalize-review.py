from pathlib import Path
import json,hashlib,collections

ROOT=Path.cwd();OUT=ROOT/'goal-1/evidence/t17-acceptance-02'
assert not (OUT/'sealed-evidence.json').exists()
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
raw=OUT/'requirement-review-r2.json';report=json.loads(raw.read_text())
overrides=[]
for case in report['cases']:
 for condition in case['conditions']:
  if condition['conditionId'] in ['X14.1','X14.3']:
   overrides.append({'conditionId':condition['conditionId'],'was':condition['adjudication'],'now':'部分','reason':'Current native samples prove the inspected scenes/pages. The wording also requires all long forms, which still need steps5/12; do not extrapolate narrow samples.'})
   condition['adjudication']='部分'
report['revision']='R3: conservative scope review of the same original129 conditions'
report['previousRevision']={'file':str(raw.relative_to(ROOT)),'sha256':sha(raw)}
report['adjudicationOverrides']=overrides
report['finalizerSourceSha256']=sha(OUT/'finalize-review.py')
report['limitations']=['The20 legacy source flags match repository runtime imports, lockfiles and Node version only; no third-party installation-byte archive is claimed. They never alone close a case.','The15 source-bound current file runs are the executed T17 steps1-3 runs. This index executes no game behavior.','Partly evidenced does not mean unimplemented; the remaining observation and owner are explicit. Compatibility remains M01, original assets and real playtests remain T17.']
source=json.loads((OUT/'current-source-index.json').read_text())
assert sha(OUT/'current-source-index.json')==report['indexSha256']
assert sha(OUT/'unit-evidence-source-scope.json')==report['sourceScopeSha256']
assert sha(OUT/'build-requirement-review.py')==report['authoringSourceSha256']
assert all(sha(ROOT/f['file'])==f['sha256'] for f in source['sourceFiles'])
assert all(sha(ROOT/file)==h for file,h in report['authorityHashes'].items())
conditions=[c for r in report['cases'] for c in r['conditions']]
assert len(report['cases'])==54 and len(conditions)==129 and len({c['conditionId'] for c in conditions})==129
original={r['caseId']:r for r in source['requirements']}
for case in report['cases']:
 assert case['original']==original[case['caseId']]
 for implementation in case['implementation']:
  assert sha(ROOT/implementation['file'])==implementation['sha256']
 for condition in case['conditions']:
  for test in condition['tests']:
   assert sha(ROOT/test['file'])==test['sha256']
   assert any(t['file']==test['file'] and t['line']==test['line'] and t['title']==test['title'] for t in source['testDeclarations'])
  for observed in condition['observations']:
   assert sha(ROOT/observed['file'])==observed['sha256']
   value=json.loads((ROOT/observed['file']).read_text())
   for part in observed['pointer'].strip('/').split('/'):
    part=part.replace('~1','/').replace('~0','~');value=value[int(part)] if isinstance(value,list) else value[part]
   assert value==observed['observed']
  if case['wholeCasePassed']:
   assert condition['adjudication']=='有据'
   assert any(t['sourceBinding']['currentUnitSourceMatched'] for t in condition['tests'])
assert {c['caseId'] for c in report['cases'] if c['wholeCasePassed']}=={'Q33','Q35'}
native=ROOT/'goal-1/evidence/t17-acceptance-01'
for a,b in [('chrome-dev-a1/workspace-completion-old-saved-s3.json','chrome-readonly-a1/physical-old-s3-readonly.json'),('chrome-dev-a1/workspace-completion-unsaved-candidate-s4.json','chrome-dev-a1/retried-workspace-completion-s4.json'),('chrome-dev-a1/retried-workspace-completion-s4.json','chrome-readonly-a1/physical-retried-s4-readonly.json'),('chrome-r7/cinematic-content-q1-s24.json','chrome-r7/after-readonly-settings-and-review-s24.json')]:assert (native/a).read_bytes()==(native/b).read_bytes()
current=json.loads((native/'step3-final-summary.json').read_text())
assert all(sha(ROOT/f)==h for f,h in current['finalSourceFiles'].items())
with (OUT/'requirement-review-r3.json').open('x') as f:json.dump(report,f,ensure_ascii=False,indent=2)
lines=['# 54项逐条件复核 R3','', '最终判定以本版及requirement-review-r3.json为准。源码/具体测试/实际字段分别保留原执行身份；本次索引不执行新游戏测试。Q33/Q35的当前证据满足限定条件，其余未覆盖部分逐条保留。有据行中的边界说明不自动新增验收要求。','', '| 原编号 | 条件数 | 判定 |','|---|---:|---|']
queue=[]
for case in report['cases']:
 lines.append('|'+case['caseId']+'|'+str(len(case['conditions']))+'|'+case['adjudication']+'|')
 unresolved=[c for c in case['conditions'] if c['adjudication']!='有据']
 targetFiles=sorted({t['file'] for c in unresolved for t in c['tests']})
 queue.append({'caseId':case['caseId'],'wholeCasePassed':case['wholeCasePassed'],'unresolvedConditions':[c['conditionId'] for c in unresolved],'owners':sorted({c['owner'] for c in unresolved}),'targetedCommand':['npm','run','test:unit','--','--maxWorkers=1',*targetFiles] if targetFiles else None,'commandBoundary':'Proposed verification only, not executed here. Preserve original test assertions, per-file isolation and timeouts. Already evidenced cases rejoin the required finalC17 cumulative run, not a redundant isolated rerun.','specificWork':[{'condition':c['conditionId'],'requirement':c['requirement'],'remaining':c['remaining']} for c in unresolved]})
for case in report['cases']:
 lines+=['','## '+case['caseId'],'',case['original']['trigger']+' → '+case['original']['expected'],'']
 for c in case['conditions']:
  refs='；'.join(t['file']+':'+str(t['line'])+' '+t['title'] for t in c['tests']) or '尚无实际测试/人测'
  lines+=['- '+c['conditionId']+' '+c['requirement']+' ['+c['adjudication']+']','  - 对应：'+refs,'  - 实际字段：'+('；'.join(o['file']+'#'+o['pointer']+'（'+o['epoch']+'）' for o in c['observations']) or '只有源码/测试条件链接，不推断未执行字段。'),'  - 余项/边界：'+c['remaining']]
with (OUT/'requirement-review-r3.md').open('x') as f:f.write('\n'.join(lines)+'\n')
with (OUT/'verification-queue.json').open('x') as f:json.dump({'scope':'Concrete follow-up obligations; proposed commands are not executions','requirementsSha256':sha(OUT/'requirement-review-r3.json'),'cases':queue},f,ensure_ascii=False,indent=2)
summary={'cases':54,'conditions':129,'currentAndHistoricalTestDeclarationsReferenced':len({(t['file'],t['line']) for c in conditions for t in c['tests']}),'observedFields':sum(len(c['observations']) for c in conditions),'conditionStates':dict(collections.Counter(c['adjudication'] for c in conditions)),'wholeCasesEvidenced':['Q33','Q35'],'newBehaviorTestsExecuted':0,'allReferenceAndPairChecksPassed':True,'runtimeCodeChanged':False,'wholeT17Complete':False}
with (OUT/'mapping-final-validation.json').open('x') as f:json.dump(summary,f,ensure_ascii=False,indent=2)
print(json.dumps(summary,ensure_ascii=False))
