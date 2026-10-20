import sys,subprocess,time,json
from pathlib import Path
p=Path(__file__).absolute().parent
def guard():
 for d in [p,*p.parents]:
  if d.is_symlink() or not d.is_dir():raise Exception('EVIDENCE_DIRECTORY_REQUIRED')
  if (d/'sealed-evidence.json').exists():raise Exception('EVIDENCE_SEALED_USE_NEW_ROOT')
  if d.name=='evidence' and d.parent.name=='goal-1':return
 raise Exception('PROJECT_EVIDENCE_REQUIRED')
guard()
name=sys.argv[1]
if not name.replace('-','').isalnum():raise Exception('SINGLE_NEW_CHECK_NAME_REQUIRED')
log=p/(name+'.txt');meta=p/(name+'.json')
if log.exists() or meta.exists():raise Exception('NEW_OUTPUT_REQUIRED')
start=time.time()
with log.open('x') as f:
 r=subprocess.run(sys.argv[2:],stdout=f,stderr=subprocess.STDOUT)
guard()
result={'command':sys.argv[2:],'started':start,'finished':time.time(),'exitCode':r.returncode}
with meta.open('x') as f:json.dump(result,f,ensure_ascii=False,indent=2)
print(json.dumps(result))
print(log.read_text()[-5000:])
sys.exit(r.returncode)
