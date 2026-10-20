import sys,json,hashlib,subprocess
from pathlib import Path
p=Path(__file__).absolute().parent
def guard():
 for d in [p,*p.parents]:
  if d.is_symlink() or not d.is_dir():raise Exception('EVIDENCE_DIRECTORY_REQUIRED')
  if (d/'sealed-evidence.json').exists():raise Exception('EVIDENCE_SEALED_USE_NEW_ROOT')
  if d.name=='evidence' and d.parent.name=='goal-1':return
 raise Exception('PROJECT_EVIDENCE_REQUIRED')
guard()
expected=json.loads((p/'expected-feature-files.json').read_text())
mode=sys.argv[1]
if mode=='staged':
 data=subprocess.check_output(['rtk','proxy','git','ls-files','-s','-z']);entries={r.split(b'\t',1)[1].decode():r.split()[1].decode() for r in data.split(b'\0') if r};ref='index'
 actual=subprocess.check_output(['rtk','proxy','git','diff','--cached','--name-only','-z']).decode().strip('\0').split('\0');assert sorted(actual)==sorted(expected)
elif mode=='commit':
 ref=sys.argv[2];data=subprocess.check_output(['rtk','proxy','git','ls-tree','-rz','--full-tree',ref]);entries={r.split(b'\t',1)[1].decode():r.split()[2].decode() for r in data.split(b'\0') if r}
 actual=subprocess.check_output(['rtk','proxy','git','diff-tree','--no-commit-id','--name-only','-r','-z',ref]).decode().strip('\0').split('\0');assert sorted(actual)==sorted(expected)
else:raise Exception('STAGED_OR_COMMIT_REQUIRED')
keys=list(expected);batch=subprocess.check_output(['rtk','proxy','git','cat-file','--batch'],input=('\n'.join(entries[k] for k in keys)+'\n').encode());pos=0
for file in keys:
 end=batch.index(b'\n',pos);head=batch[pos:end].split();assert head[1]==b'blob';n=int(head[2]);raw=batch[end+1:end+1+n];pos=end+1+n+1
 assert Path(file).read_bytes()==raw,file
 assert n==expected[file]['bytes'] and hashlib.sha256(raw).hexdigest()==expected[file]['sha256'],file
assert pos==len(batch)
report={'mode':mode,'ref':ref,'files':len(keys),'allDiskAndGitBytesEqual':True,'expectedManifestSha256':hashlib.sha256((p/'expected-feature-files.json').read_bytes()).hexdigest()}
with (p/(mode+'-byte-check.json')).open('x') as out:json.dump(report,out,indent=2)
print(json.dumps(report))
