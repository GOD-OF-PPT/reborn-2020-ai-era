from pathlib import Path
from datetime import datetime,timezone
import argparse,hashlib,json,subprocess
parser=argparse.ArgumentParser();parser.add_argument('--commit',required=True);parser.add_argument('--output-dir',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[3];phase=Path(__file__).resolve().parent
out=(root/args.output_dir).resolve();assert out.is_relative_to(root) and not out.exists();out.mkdir()
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()==args.commit
rel=str(phase.relative_to(root));paths=subprocess.check_output(['git','ls-tree','-r','--name-only',args.commit,'--',rel,'goal-1/evidence/d03-cinematic','goal-1/evidence/d03-cinematic-c2'],cwd=root,text=True).splitlines()
batch=subprocess.Popen(['git','cat-file','--batch'],cwd=root,stdin=subprocess.PIPE,stdout=subprocess.PIPE)
def blob(ref,path):
 batch.stdin.write((ref+':'+path+'\n').encode());batch.stdin.flush();header=batch.stdout.readline().split();assert len(header)==3 and header[1]==b'blob';data=batch.stdout.read(int(header[2]));assert batch.stdout.read(1)==b'\n';return data
before={}
for name in paths:
 raw=(root/name).read_bytes();assert raw==blob(args.commit,name),name
 if not name.startswith(rel+'/'):assert raw==blob('c2da7ac65ea098851237b7e3d4f12224c2d9efa7',name),name
 before[name]=hashlib.sha256(raw).hexdigest()
commands=[('audit',['python3',rel+'/verify-evidence.py'],'AssertionError'),('native-save',['node','--input-type=module','-e',"import {recorder} from './goal-1/evidence/d03-cinematic/browser-evidence.mjs';await recorder(null,'"+str(phase)+"',{source:'post-commit guard',runtime:'none'}).save('c2-sample1-console',{attempted:true});"],'EEXIST')]
results=[]
for name,command,marker in commands:
 r=subprocess.run(command,cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);(out/(name+'-refusal-output.txt')).write_bytes(r.stdout);assert r.returncode!=0 and marker in r.stdout.decode(),(name,r.returncode,r.stdout);results.append({'name':name,'exitCode':r.returncode,'expectedMarker':marker,'refused':True})
for name,h in before.items():
 raw=(root/name).read_bytes();assert hashlib.sha256(raw).hexdigest()==h and raw==blob(args.commit,name),name
batch.stdin.close();assert batch.wait()==0
freeze=json.loads((phase/'source-freeze-c2.json').read_text())['sha256']
for name,h in freeze.items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==h,name
repo=json.loads(subprocess.check_output(['gh','repo','view','--json','nameWithOwner,visibility'],cwd=root,text=True));assert repo=={'nameWithOwner':'GOD-OF-PPT/reborn-2020-ai-era','visibility':'PUBLIC'}
report={'recordedAtUtc':datetime.now(timezone.utc).isoformat(),'featureCommit':args.commit,'result':'POST_COMMIT_PHASE_GUARDS_PASS','attempts':results,'phaseAndPriorCinematicEvidenceFilesExact':len(before),'sourceFilesShaExact':len(freeze),'repository':repo,'branch':subprocess.check_output(['git','branch','--show-current'],cwd=root,text=True).strip(),'remoteMain':subprocess.check_output(['git','ls-remote','origin','refs/heads/main'],cwd=root,text=True).strip(),'pushed':False,'T15Complete':False,'C15Complete':False,'goalComplete':False}
(out/'post-commit-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
