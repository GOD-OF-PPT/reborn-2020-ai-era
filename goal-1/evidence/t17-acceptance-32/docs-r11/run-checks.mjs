import fs from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';
const repo=process.cwd(),out='goal-1/evidence/t17-acceptance-32/docs-r11',manifest='goal-1/evidence/t17-acceptance-32/build-r11.source-after.json';
guard(resolve(out));
const hash=b=>createHash('sha256').update(b).digest('hex'),ident=path=>{const b=fs.readFileSync(path),s=fs.lstatSync(path);return{path,bytes:b.length,sha256:hash(b),mode:s.mode&511};};
const put=(n,v)=>{guard(resolve(out));fs.writeFileSync(out+'/'+n,typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const sourceBinding=()=>{const original=JSON.parse(fs.readFileSync(manifest,'utf8')).files,rows=original.map(r=>ident(r.path)),expected=new Map(original.map(r=>[r.path,r]));return{manifest:ident(manifest),sourceCount:rows.length,rowsDigestSha256:hash(Buffer.from(JSON.stringify(rows))),mismatch:rows.filter(r=>['bytes','sha256','mode'].some(k=>r[k]!==expected.get(r.path)[k])),dependencies:['scripts/browser_evidence_guard.mjs',out+'/scoped-docs.py',out+'/run-checks.mjs'].map(ident)};};
const inventory=kind=>{const argv=['rtk','proxy','python3','-B',out+'/scoped-docs.py','inventory',kind],r=spawnSync(argv[0],argv.slice(1),{cwd:repo,maxBuffer:16*1024*1024});if(r.status!==0)throw Error('INPUT_INVENTORY_FAILED:'+String(r.stderr));return JSON.parse(r.stdout);};
const all=[];
try{
for(const [name,args] of [['docs',['-B',out+'/scoped-docs.py','check']],['plan',['-B','scripts/check_plan.py']],['competitive',['-B','scripts/check_competitive_design.py']]]){
 const argv=['rtk','proxy','python3',...args],before=sourceBinding(),inputsBefore=inventory(name);put(name+'.before.json',{source:before,inputs:inputsBefore});put(name+'.command.json',{at:new Date().toISOString(),argv,wholeDocs:false,provider:name==='docs'?'six-MD scoped check function':'original default CLI'});
 guard(resolve(out));const started=Date.now(),r=spawnSync(argv[0],argv.slice(1),{cwd:repo,maxBuffer:16*1024*1024}),wallMs=Date.now()-started;
 put(name+'.stdout.log',r.stdout??Buffer.alloc(0));put(name+'.stderr.log',r.stderr??Buffer.alloc(0));const after=sourceBinding(),inputsAfter=inventory(name);put(name+'.after.json',{source:after,inputs:inputsAfter});
 const result={at:new Date().toISOString(),argv,exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,wallMs,sourceCount:before.sourceCount,sourceMatchedR11:before.mismatch.length===0&&after.mismatch.length===0,sourceEqual:JSON.stringify(before)===JSON.stringify(after),inputEqual:JSON.stringify(inputsBefore)===JSON.stringify(inputsAfter),provider:inputsBefore.provider,wholeDocs:false,scoped:name==='docs'};
 put(name+'.result.json',result);all.push(result);console.log(JSON.stringify(result));
}
put('execution-summary.json',{at:new Date().toISOString(),results:all,noBusinessOrCompatibilityTests:true,wholeDocsExecuted:false});process.exitCode=all.some(r=>r.exitCode!==0||!r.sourceEqual||!r.sourceMatchedR11||!r.inputEqual)?1:0;
}catch(error){put('failure.json',{error:String(error),stack:error?.stack,completed:all});console.error(String(error));process.exitCode=1;}
