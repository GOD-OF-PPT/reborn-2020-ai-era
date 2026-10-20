from pathlib import Path
import hashlib,json,subprocess,time,sys
p=Path(__file__).absolute().parent
for ancestor in [p,*p.parents]:
 if ancestor.is_symlink():raise Exception('EVIDENCE_SYMLINK_FORBIDDEN')
 if (ancestor/'sealed-evidence.json').exists():raise Exception('EVIDENCE_SEALED_USE_NEW_ROOT')
 if ancestor.name=='evidence' and ancestor.parent.name=='goal-1':break
else:raise Exception('PROJECT_EVIDENCE_REQUIRED')
for name in ['cli-types-r2','xz-helper-tests','python-tools']:
 if json.loads((p/(name+'.json')).read_text())['exitCode']!=0:raise Exception('PREREQUISITE_CHECK_NOT_PASSED:'+name)
for file,e in json.loads((p/'execution-source-freeze-r2.json').read_text()).items():
 if hashlib.sha256(Path(file).read_bytes()).hexdigest()!=e['sha256']:raise Exception('FROZEN_SOURCE_CHANGED:'+file)
if (p/'matrix-r1').exists():raise Exception('FRESH_OUTPUT_REQUIRED')
command=['rtk','proxy','node','--experimental-strip-types','--experimental-transform-types','scripts/collect_course_delegated_evidence.ts','--output-dir','goal-1/evidence/t17-acceptance-08/matrix-r1']
started=time.time()
with (p/'matrix-r1-command-intent.json').open('x') as out:json.dump({'command':command,'started':started,'state':'before-launch'},out,indent=2)
with (p/'matrix-r1-console.txt').open('x') as log:
 process=subprocess.Popen(command,stdout=log,stderr=subprocess.STDOUT)
 with (p/'matrix-r1-running.json').open('x') as out:json.dump({'command':command,'started':started,'pid':process.pid,'state':'launched; check actual process/session for liveness'},out,indent=2)
 print(json.dumps({'startedMatrix':'matrix-r1','pid':process.pid,'registeredExpected':72,'console':str(p/'matrix-r1-console.txt')}),flush=True)
 code=process.wait()
with (p/'matrix-r1-complete.json').open('x') as out:json.dump({'command':command,'started':started,'finished':time.time(),'pid':process.pid,'exitCode':code,'state':'terminal'},out,indent=2)
print(json.dumps({'matrix':'matrix-r1','exitCode':code,'elapsedSeconds':time.time()-started}),flush=True)
sys.exit(code)
