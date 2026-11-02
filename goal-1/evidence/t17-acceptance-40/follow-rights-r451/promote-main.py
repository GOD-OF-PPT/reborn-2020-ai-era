from pathlib import Path
import hashlib,json,os,urllib.request,urllib.parse,concurrent.futures
r=Path('goal-1/evidence/t17-acceptance-40/follow-rights-r451')
def sha(b):return hashlib.sha256(b).hexdigest()
def read(p):return json.loads(Path(p).read_text())
assert not (r/'stopped.json').exists()
for name in ['r455-type.result.json','r455-build.result.json','rights-455-final.result.json']:
 d=read(r/name);assert d['exitCode']==0 and d['sourceExact'],name
v=read(r/'rights-455-final.vitest.json');assert v['success'] and v['numPassedTests']==357 and v['numFailedTests']==0 and len(v['testResults'])==54
n=read(r/'native-result455.json');assert n['source']==455 and n['sameScreenZeroAndToday'] and n['zeroOriginalPayloadConfirm'] and n['originalBookReachable'] and n['normalFullAppAcceptance'] is False
assert sha((r/'main129-before455.ui-export.json').read_bytes())=='82f3147aa4684334f032886300292fd906050af25e873c1ded5a69c87b5621e7'
source=read(r/'snapshot455.json');base=read('goal-1/evidence/t17-acceptance-40/equity-history-r449/main-artifact450.json');main=Path(base['target']);dist=Path(source['target'])/'dist-u6-review'
for row in source['files']:assert sha((Path(source['target'])/row['path']).read_bytes())==row['sha256'],row['path']
for row in base['files']:assert sha((main/row['path']).read_bytes())==row['sha256'],row['path']
(r/'main-index450.html').write_bytes((main/'index.html').read_bytes())
workers=list(dist.glob('assets/*worker*.js'));assert len(workers)==1
w=workers[0].read_bytes();assert len(w)==938836 and sha(w)=='968363c0d0025db3c5d9699dc79f1ed8e41e5ec6d7804e48c2adefe1a34de2ed'
added=[]
for p in sorted(dist.rglob('*')):
 if not p.is_file() or p.name=='index.html':continue
 name=p.relative_to(dist);out=main/name;b=p.read_bytes()
 if out.exists():assert out.read_bytes()==b,str(name)
 else:out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(b);added.append(str(name))
tmp=main/'.index-equity-history455.tmp';tmp.write_bytes((dist/'index.html').read_bytes());os.replace(tmp,main/'index.html')
rows=[]
for p in sorted(main.rglob('*')):
 if p.is_file():b=p.read_bytes();rows.append({'path':str(p.relative_to(main)),'bytes':len(b),'sha256':sha(b)})
report={'source':455,'target':str(main),'origin':'http://127.0.0.1:5415/','files':rows,'added':added,'old450NonIndexPreserved':len(base['files'])-1,'workerUnchanged416':True,'gameDataActions':0,'compatibility':0}
(r/'main-artifact455.json').write_text(json.dumps(report,indent=2)+'\n')
def check(row):
 b=urllib.request.urlopen(report['origin']+urllib.parse.quote(row['path']),timeout=20).read();assert len(b)==row['bytes'] and sha(b)==row['sha256'],row['path'];return row['path']
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:checked=list(pool.map(check,rows))
(r/'main-http455.json').write_text(json.dumps({'source':455,'files':len(checked),'allBytesEqual':True,'old450NonIndexPreserved':len(base['files'])-1,'compatibility':0},indent=2)+'\n')
print({'source':455,'HTTP':len(checked),'added':len(added),'oldNonIndexPreserved':len(base['files'])-1,'workerExact':True,'gameDataActions':0})
