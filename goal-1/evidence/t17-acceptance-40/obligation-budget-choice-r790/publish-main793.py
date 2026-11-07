from pathlib import Path
import hashlib,json,re,urllib.request,datetime,os,shutil
root=Path(__file__).parent
http=urllib.request.build_opener(urllib.request.ProxyHandler({}))
source=Path('.delivery/t17-u6-obligation-budget-r793/dist-u6-review')
target=Path('.delivery/t17-u6-main-r416')
assert (target/'index.html').read_bytes()==Path('.delivery/t17-u6-obligation-direct-r789/dist-u6-review/index.html').read_bytes()
for name in ['r793-build.result.json','r793-type.result.json','budget-ui793.result.json','original-money793.result.json']:
 assert json.loads((root/name).read_text())['exitCode']==0,name
assert json.loads((root/'budget-ui793.vitest.json').read_text())['numPassedTests']==156
assert json.loads((root/'source-review793.json').read_text())['nonOwnedSame789']==1208
assert not (root/'main-publication793.json').exists()
hash=lambda b:hashlib.sha256(b).hexdigest()
with http.open('http://127.0.0.1:5415/',timeout=20) as response:assert response.read()==(target/'index.html').read_bytes()
old={str(p.relative_to(target)):hash(p.read_bytes()) for p in target.rglob('*') if p.is_file() and str(p.relative_to(target))!='index.html'}
files=[p for p in source.rglob('*') if p.is_file()]
for p in files:
 rel=p.relative_to(source); out=target/rel
 if str(rel)!='index.html' and out.exists():assert out.read_bytes()==p.read_bytes(),str(rel)
with (root/'main-index-before793.html').open('xb') as backup:backup.write((target/'index.html').read_bytes())
for p in files:
 rel=p.relative_to(source); out=target/rel
 if str(rel)=='index.html':continue
 if not out.exists():out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,out)
newindex=(source/'index.html').read_bytes()
tmp=target/'index.budget793.tmp';tmp.write_bytes(newindex);os.replace(tmp,target/'index.html')
assert all(hash((target/path).read_bytes())==value for path,value in old.items())
base='http://127.0.0.1:5415'
with http.open(base+'/',timeout=20) as response:assert response.read()==newindex
entries=sorted(set(re.findall(r'(?:src|href)="(/assets/[^"<>]+)"',newindex.decode())))
rows=[]
for name in entries:
 expected=(source/name.lstrip('/')).read_bytes()
 with http.open(base+name,timeout=20) as response:assert response.read()==expected,name
 rows.append({'path':name,'bytes':len(expected),'sha256':hash(expected)})
record={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':793,'previous':789,'url':base+'/','indexSha256':hash(newindex),'entryAssets':rows,'oldNonIndexAssetsPreserved':len(old),'storageTests':0,'compatibility':0}
(root/'main-publication793.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in record.items() if k!='entryAssets'},ensure_ascii=False));print('entry assets',len(rows))
