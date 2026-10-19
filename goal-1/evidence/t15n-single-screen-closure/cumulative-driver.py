"""Original C15-N 20 steps plus type/build, same limits and fork isolation."""
from pathlib import Path
import subprocess,time,json,hashlib,os
root=Path.cwd();base=root/'goal-1/evidence/t15n-single-screen-closure';out=base/'cumulative';out.mkdir(exist_ok=False)
freeze=json.loads((base/'source-final.json').read_text())['sha256'];steps=[]
def verify():
 changed=[p for p,h in freeze.items() if hashlib.sha256((root/p).read_bytes()).hexdigest()!=h]
 if changed:raise RuntimeError('FINAL_SOURCE_CHANGED:'+str(changed))
def execute(name,cmd,env=None):
 verify();log=out/(name+'-output.txt');start=time.monotonic()
 with log.open('x') as f:r=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT,env=env)
 row={'step':name,'command':cmd,'exitCode':r.returncode,'seconds':round(time.monotonic()-start,3),'output':str(log.relative_to(root))};steps.append(row);verify()
 (out/'run-results.json').write_text(json.dumps({'finalSource':'../source-final.json','sourceUnchanged':True,'allExecutedPassed':all(x['exitCode']==0 for x in steps),'steps':steps,'wholeGoalComplete':False,'compatibilityAcceptance':'pending M01, not executed here'},indent=2)+'\n');print(json.dumps(row),flush=True)
 if r.returncode:raise SystemExit(r.returncode)
execute('typecheck',['rtk','proxy','npm','run','typecheck'])
execute('build',['rtk','proxy','npm','run','build','--','--outDir','.delivery/t15n-single-screen-final1'])
execute('all-unit',['rtk','proxy','npm','run','test:unit','--','--maxWorkers=1'])
execute('tool-tests',['rtk','proxy','npm','run','test:docs'])
execute('content',['rtk','proxy','npm','run','validate:content'])
for name,script in [('docs','check_docs.py'),('plan','check_plan.py'),('competitive','check_competitive_design.py')]:execute(name,['rtk','proxy','python3','-B','scripts/'+script]+(['--text-only'] if name=='docs' else []))
execute('life',['rtk','proxy','node','--experimental-strip-types','scripts/collect_life_evidence.ts','--output-dir',str((out/'life').relative_to(root))])
for name in ['story','kernel','save','world','operations','first-order','market','playable','video','course','relay','deepseek','route-diversity']:
 env=os.environ.copy();env['ROUTE_EVIDENCE_DIRECTORY']=str((out/'replay').relative_to(root));execute('replay-'+name,['rtk','proxy','npm','run','evidence:'+name,'--','--output-dir',str((out/'replay'/name).relative_to(root))],env)
verify();(out/'complete.json').write_text(json.dumps({'steps':len(steps),'allPassed':True,'sourceUnchanged':True,'scope':'All currently implemented JS, tools/content/docs, complete original14 replay contracts including life. Not native200/mobile/human/full24quarter/ending acceptance.','finalBuild':'.delivery/t15n-single-screen-final1'},indent=2)+'\n');print('C15_NONCOMPAT_CUMULATIVE_COMPLETE',flush=True)
