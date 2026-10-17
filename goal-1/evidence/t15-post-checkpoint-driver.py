from pathlib import Path
import subprocess,json,hashlib,time,os
root=Path.cwd();e=root/'goal-1/evidence';checkpoint='c9a7287ad57afe8c1ec58f005cf113c77d7f66d2'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==checkpoint
files=[p for p in subprocess.check_output(['git','diff-tree','--no-commit-id','--name-only','-r','-z',checkpoint]).decode().split('\0') if p]
before={p:sha(root/p) for p in files}
original=json.loads((e/'t15-r3-regression-results.json').read_text())['steps']
commands=[]
for row in original:
 name=row['step'];cmd=row['command'][:]
 if name=='route-diversity':cmd[-1]='goal-1/evidence/t15-r3-route-diversity-reviewed'
 commands.append((name,cmd))
commands.extend([
 ('life',['rtk','proxy','node','--experimental-strip-types','scripts/collect_life_evidence.ts','--output-dir','goal-1/evidence/t15-r3-final-life']),
 ('native',['rtk','proxy','node','--experimental-strip-types','scripts/verify_life_browser_evidence.ts']),
 ('profile',['rtk','proxy','node','--experimental-strip-types','scripts/profile_life_honest.ts','--output-dir','goal-1/evidence/t15-diagnosis-indexed'])])
old=json.loads((e/'t14-post-commit-check.json').read_text())['entries']
commands.extend((r['name'],r['command']) for r in old if r['name'] in ['ui-inputs','support-input'])
env=os.environ.copy();env.pop('T15_NATIVE_REPORT',None);env['ROUTE_EVIDENCE_DIRECTORY']='goal-1/evidence/t15-r3-regression'
entries=[]
for name,cmd in commands:
 output=e/('t15-post-checkpoint-'+name+'-refusal.txt');start=time.monotonic()
 with output.open('xb') as f:r=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT,env=env,timeout=45)
 raw=output.read_bytes();refused=r.returncode!=0 and b'IMMUTABLE_TASK_EVIDENCE' in raw
 entries.append({'name':name,'command':cmd,'exitCode':r.returncode,'refusedCommittedOutput':refused,'seconds':round(time.monotonic()-start,3),'file':str(output.relative_to(root)),'sha256':sha(output)})
 print(json.dumps({'entry':name,'refused':refused}),flush=True)
 assert refused,('DID_NOT_REFUSE_COMMITTED_OUTPUT',name,r.returncode)
checks=[]
for p,h in before.items():
 raw=(root/p).read_bytes();blob=subprocess.check_output(['git','rev-parse',checkpoint+':'+p],text=True).strip();algorithm='sha1' if len(blob)==40 else 'sha256';git_hash=hashlib.new(algorithm,('blob '+str(len(raw))+'\0').encode()+raw).hexdigest()
 assert sha(root/p)==h and git_hash==blob,('CHECKPOINT_FILE_CHANGED',p)
 checks.append({'file':p,'sha256':h,'gitBlob':blob,'bytes':len(raw)})
freeze=json.loads((e/'t15-native-r3-source-freeze.json').read_text());assert all(sha(root/p)==h for p,h in freeze['sha256'].items())
report={'taskId':'T15','scope':'post-checkpoint committed-evidence overwrite refusal and exact-byte Git readback, not T15 completion','checkpointCommit':checkpoint,'entries':entries,'unchangedCheckpointFiles':checks,'frozenSourceFiles':len(freeze['sha256']),'sourceUnchanged':True,'nativePending':2,'taskComplete':False}
with (e/'t15-post-checkpoint-check.json').open('x') as f:json.dump(report,f,indent=2)
print(json.dumps({'entries':len(entries),'allRefused':True,'checkpointFilesUnchanged':len(checks),'sourceUnchanged':True,'taskComplete':False}))
