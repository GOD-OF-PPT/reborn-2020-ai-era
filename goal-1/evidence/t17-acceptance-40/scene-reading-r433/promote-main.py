from pathlib import Path
import hashlib,json,os,urllib.request,urllib.parse,concurrent.futures
r=Path('goal-1/evidence/t17-acceptance-40/scene-reading-r433')
def sha(b):return hashlib.sha256(b).hexdigest()
def read(p):return json.loads(Path(p).read_text())
for name in ['r436-type.result.json','r436-build.result.json','ecosystem-final.result.json']:
 d=read(r/name);assert d['exitCode']==0 and d['sourceExact'],name
v=read(r/'ecosystem-final.vitest.json');assert v['success'] and v['numFailedTests']==0
source=read(r/'snapshot436.json');base=read('goal-1/evidence/t17-acceptance-40/scene-language-r418/main-artifact431.json')
main=Path(base['target']);dist=Path(source['target'])/'dist-u6-review'
for row in source['files']:assert sha((Path(source['target'])/row['path']).read_bytes())==row['sha256'],row['path']
for row in base['files']:assert sha((main/row['path']).read_bytes())==row['sha256'],row['path']
old=(main/'index.html').read_bytes();(r/'main-index431.html').write_bytes(old)
worker=list(dist.glob('assets/*worker*.js'));assert len(worker)==1,[str(p) for p in worker]
w=worker[0].read_bytes();assert len(w)==938836 and sha(w)=='968363c0d0025db3c5d9699dc79f1ed8e41e5ec6d7804e48c2adefe1a34de2ed'
assert (r/'main129-before434.json').read_bytes()==Path('goal-1/evidence/t17-acceptance-40/scene-language-r418/main129-after431.json').read_bytes()
added=[]
for p in sorted(dist.rglob('*')):
 if not p.is_file() or p.name=='index.html':continue
 name=p.relative_to(dist);out=main/name;b=p.read_bytes()
 if out.exists():assert out.read_bytes()==b,str(name)
 else:out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(b);added.append(str(name))
new=(dist/'index.html').read_bytes();tmp=main/'.index-reading436.tmp';tmp.write_bytes(new);os.replace(tmp,main/'index.html')
rows=[]
for p in sorted(main.rglob('*')):
 if p.is_file():b=p.read_bytes();rows.append({'path':str(p.relative_to(main)),'bytes':len(b),'sha256':sha(b)})
report={'source':436,'target':str(main),'origin':'http://127.0.0.1:5415/','files':rows,'added':added,'old431NonIndexPreserved':len(base['files'])-1,'workerUnchanged416':True,'gameDataActions':0,'compatibility':0}
(r/'main-artifact436.json').write_text(json.dumps(report,indent=2)+'\n')
def check(row):
 u=report['origin']+urllib.parse.quote(row['path']);b=urllib.request.urlopen(u,timeout=20).read();assert len(b)==row['bytes'] and sha(b)==row['sha256'],row['path'];return row['path']
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:checked=list(pool.map(check,rows))
(r/'main-http436.json').write_text(json.dumps({'source':436,'files':len(checked),'allBytesEqual':True,'old431NonIndexPreserved':len(base['files'])-1,'compatibility':0},indent=2)+'\n')
print({'source':436,'HTTP':len(checked),'added':len(added),'oldNonIndexPreserved':len(base['files'])-1,'workerExact':True,'gameDataActions':0})
