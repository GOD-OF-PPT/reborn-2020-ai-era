from pathlib import Path
import json,hashlib,subprocess
root=Path.cwd();e=root/'goal-1/evidence';sources=[];refs=[];reports=[];historical=[]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
freeze=json.loads((e/'t15-native-r3-source-freeze.json').read_text())
for name,h in freeze['sha256'].items():
 assert sha(root/name)==h,('R3_SOURCE_CHANGED',name)
source_paths=sorted(str(p.relative_to(root)) for p in (root/'src').rglob('*') if p.is_file())
assert source_paths==freeze['srcPaths']
driver=json.loads((e/'t15-r3-regression-reviewed-results.json').read_text());assert driver['all13PassedAfterCorrection']
folders=[root/p for p in driver['outputDirectories']]+[e/'t15-r3-final-life']
selected=[]
for folder in folders:
 candidates=list(folder.glob('*evidence.json'))
 assert len(candidates)==1,(str(folder),[str(p) for p in candidates])
 selected.append(candidates[0])
selected += [e/'t15-browser-native.json',e/'t15-browser-replay-audit.json']
seen_refs=set()
for path in selected:
 data=json.loads(path.read_text());report_name=str(path.relative_to(root));reports.append({'file':report_name,'sha256':sha(path),'taskId':data.get('taskId'),'scope':data.get('scope',data.get('evidenceType'))})
 if 'failures' in data:assert not data['failures'],report_name
 if 'result' in data:assert data['result'] in ['PASS','EXPORT_REPLAY_PASS'],(report_name,data['result'])
 for name,h in data.get('sourceHashes',{}).items():
  assert sha(root/name)==h,('REPORT_SOURCE_CHANGED',report_name,name)
  sources.append({'report':report_name,'file':name,'sha256':h})
 if path.name=='t13-route-diversity-evidence.json':assert data['sourceHash']==sha(root/'scripts/collect_route_diversity_evidence.ts')
 def walk(x):
  if isinstance(x,list):
   for v in x:walk(v)
  elif isinstance(x,dict):
   name=x.get('file');h=x.get('sha256')
   if isinstance(name,str) and isinstance(h,str) and len(h)==64:
    if Path(name).is_absolute():raise AssertionError(('ABSOLUTE_ARTIFACT_REFERENCE',report_name,name))
    is_historical=x.get('scope')=='historical_report_only_not_reexecuted_for_current_sources'
    artifact=e/name if is_historical else root/name if name.startswith(('goal-1/','src/','scripts/','docs/','assets/')) else path.parent/name
    assert artifact.is_file(),('ARTIFACT_MISSING',report_name,name,str(artifact))
    assert sha(artifact)==h,('ARTIFACT_HASH_CHANGED',report_name,name)
    key=(report_name,str(artifact.relative_to(root)),h)
    if key not in seen_refs:refs.append({'report':report_name,'file':str(artifact.relative_to(root)),'sha256':h,'historicalOnly':is_historical});seen_refs.add(key)
    if is_historical:
     historical.append({'report':report_name,'file':str(artifact.relative_to(root)),'sha256':h,'scope':x['scope']})
     if 'screenshot' in x:
      screenshot=e/x['screenshot'];assert sha(screenshot)==x['screenshotSha256']
      historical.append({'report':report_name,'file':str(screenshot.relative_to(root)),'sha256':x['screenshotSha256'],'scope':x['scope']})
   for k,v in x.items():
    if k!='sourceHashes':walk(v)
 walk(data)
audit=json.loads((e/'t15-browser-replay-audit.json').read_text());native=json.loads((e/'t15-browser-native.json').read_text());assert audit['nativeReportHash']==sha(e/'t15-browser-native.json');assert audit['nativeAcceptanceComplete']==False and len(audit['pending'])==2
for row in native.get('exportAudits',[]):assert sha(e/row['file'])==row['sha256']
protection=json.loads((e/'t15-r3-protected-readback.json').read_text());assert not protection['failures'] and len(protection['checks'])==2151
pins=json.loads((e/'t15-all-pinned-previews-readback.json').read_text());assert pins['result']=='PASS' and len(pins['checks'])==132
report={'taskId':'T15','result':'RECORDED_COMPONENTS_INTEGRITY_PASS_TASK_INCOMPLETE','scope':'source/artifact/old-byte/pinned-preview integrity, not native environment, human or whole goal acceptance','baseCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'sourceFreeze':'t15-native-r3-source-freeze.json','frozenSourceFiles':len(freeze['sha256']),'sourceUnchanged':True,'reports':reports,'sourceGroups':sources,'artifactReferences':refs,'historicalReferences':historical,'historicalBrowserChecksNotReexecuted':True,'uniqueArtifactFiles':len({r['file'] for r in refs}),'uniqueArtifactHashes':len({r['sha256'] for r in refs}),'oldProtectedFiles':2151,'pinnedHttpAndDiskFiles':132,'nativeReportHash':sha(e/'t15-browser-native.json'),'nativeAuditHash':sha(e/'t15-browser-replay-audit.json'),'pending':native['pending'],'notCovered':native['notCovered']}
with (e/'t15-integrity.json').open('x') as f:json.dump(report,f,indent=2)
print(json.dumps({'reports':len(reports),'sourceGroups':len(sources),'artifactReferences':len(refs),'uniqueArtifactFiles':report['uniqueArtifactFiles'],'uniqueArtifactHashes':report['uniqueArtifactHashes'],'sourceUnchanged':True,'taskComplete':False,'pending':len(native['pending'])}))
