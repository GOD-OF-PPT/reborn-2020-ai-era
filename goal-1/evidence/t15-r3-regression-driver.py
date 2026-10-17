from pathlib import Path
import subprocess,time,json,hashlib
root=Path.cwd();e=root/'goal-1/evidence';freeze=json.loads((e/'t15-native-r3-source-freeze.json').read_text());results=[]
def verify():
 changed=[p for p,h in freeze['sha256'].items() if hashlib.sha256((root/p).read_bytes()).hexdigest()!=h]
 if changed:raise RuntimeError('R3_SOURCE_CHANGED:'+str(changed))
for name in ['story','kernel','save','world','operations','first-order','market','playable','video','course','relay','deepseek','route-diversity']:
 verify();out='goal-1/evidence/t15-r3-regression/'+name;cmd=['rtk','proxy','npm','run','evidence:'+name,'--','--output-dir',out];log=e/('t15-r3-regression-'+name+'-output.txt');started=time.monotonic()
 with log.open('x') as f:p=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT)
 row={'step':name,'command':cmd,'exitCode':p.returncode,'seconds':round(time.monotonic()-started,3),'output':str(log.relative_to(root)),'scope':'R3 regression of original tool/scenario contract; does not rename its historical task identity'};results.append(row);print(json.dumps(row),flush=True)
 if p.returncode:break
verify()
with (e/'t15-r3-regression-results.json').open('x') as f:json.dump({'sourceFreeze':'t15-native-r3-source-freeze.json','sourceUnchanged':True,'all13Completed':len(results)==13 and all(r['exitCode']==0 for r in results),'steps':results},f,indent=2)
