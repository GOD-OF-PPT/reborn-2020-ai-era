from pathlib import Path
import hashlib,json,statistics,subprocess
root=Path(__file__).resolve().parents[3]
phase=Path(__file__).resolve().parent
load=lambda name:json.loads((phase/name).read_text())
freeze=load('source-freeze-c2.json')['sha256']
for name,h in freeze.items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==h,name
opening=load('opening-source.json')['sha256']
assert [n for n,h in opening.items() if hashlib.sha256((root/n).read_bytes()).hexdigest()!=h]==['index.html']
for name in ['syntax-result.json','gating-result.json','typecheck-result.json','build-result.json','syntax-c2-result.json','gating-c2-result.json','build-c2-result.json']:assert load(name)['exitCode']==0,name
for name in ['d03-fixed-http-readback.json','c1-production-manifest.json','c2-production-manifest.json']:
 manifest=load(name);assert manifest['httpEqualsDisk']
 for item in manifest['resources']:assert hashlib.sha256((root/manifest['directory']/item['file']).read_bytes()).hexdigest()==item['sha256'],item['file']
prefix='REBORN_STARTUP_METRICS_V1 '
def metric(name):
 logs=load(name);assert all(item['level']=='info' for item in logs),name
 matched=[item for item in logs if item['message'].startswith(prefix)];assert len(matched)==1,name
 return json.loads(matched[0]['message'][len(prefix):])
assert load('plain-console.json')==[]
for name in ['plain-script-state.json','c2-final-plain-script-state.json']:assert load(name)['diagnosticScriptCount']==0
assert not load('c2-final-plain-script-state.json')['textMode']
first=metric('sample1-console.json');assert first['sceneResource'] is None
samples=[]
for i in range(1,4):
 m=metric(f'c2-sample{i}-console.json');assert m['status']=='complete' and not m['timedOut'] and not m['deadlineReached'] and m['paintObserverSupported'] and not m['errors']
 assert all(v['state']=='visible' for v in m['visibility'])
 assert m['viewport']['width']==1280 and m['viewport']['height']==720
 assert isinstance(m['firstContentfulPaintMs'],(int,float)) and m['firstContentfulPaintMs']>=m['firstPaintMs']>0
 assert m['enabledActionObservedAtMs']>0 and m['navigation']['loadEventEnd']>0
 assert m['sceneResource']['name']==m['requiredSceneAsset'] and m['sceneResource']['name'].startswith('room-ordinary-v1-')
 assert m['sceneResource']['responseEndMs']>=m['sceneResource']['startTimeMs']>0
 capture=load(f'c2-performance-sample{i}.json');assert capture['viewportStable'] and not capture['before']['overflow'] and capture['before']['hud'] is None
 assert hashlib.sha256((phase/capture['image']).read_bytes()).hexdigest()==capture['sha256']
 samples.append({'sample':i,'fcpMs':m['firstContentfulPaintMs'],'enabledActionObservedMs':m['enabledActionObservedAtMs'],'sceneResponseEndMs':m['sceneResource']['responseEndMs'],'loadEventEndMs':m['navigation']['loadEventEnd']})
text=metric('c2-text-console.json');assert text['status']=='complete' and not text['timedOut'] and text['requiredSceneAsset'] is None and text['sceneResource'] is None and not text['errors']
checks=[json.loads(line) for line in (phase/'performance-c2-native-checks.jsonl').read_text().splitlines()];assert len(checks)==4 and all(c['pass'] for c in checks)
legacy=[json.loads(line) for line in (phase/'performance-native-checks.jsonl').read_text().splitlines()];assert len(legacy)==1 and legacy[0]['pass'] is False
for name in ['plain-native-checks.jsonl','plain-c2-native-checks.jsonl']:assert all(json.loads(line)['pass'] for line in (phase/name).read_text().splitlines())
report={'result':'STARTUP_EVIDENCE_PASS','frozenSourceFiles':len(freeze),'originalGameJsCssImagesExactFromD03':True,'normalOptOutChecks':2,'newNativePerformanceChecks':4,'retainedC1FailedProbeChecks':1,'samples':samples,'medianFcpMs':statistics.median(m['fcpMs'] for m in samples),'medianEnabledActionObservedMs':statistics.median(m['enabledActionObservedMs'] for m in samples),'medianSceneResponseEndMs':statistics.median(m['sceneResponseEndMs'] for m in samples),'textModeWithoutScene':True,'method':'Actual browser Performance/Navigation/Resource APIs and DOM observation; not Node/tool duration. Cache/network uncontrolled; diagnostic overhead present. Three samples are not p95 or cold-cache evidence.','notProven':['native200percent','nativeBeforeunload','agreedPerformanceBudgetOrAllDevices','wholeT15OrC15','full24quarters/endings','originalPNGs/humanPlaytest'],'T15Complete':False,'C15Complete':False,'goalComplete':False}
out=phase/'startup-evidence-audit.json';assert not out.exists();out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
