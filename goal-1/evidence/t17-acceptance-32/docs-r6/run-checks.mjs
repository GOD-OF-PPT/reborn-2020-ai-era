import fs from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';
const repo=process.cwd(),out='goal-1/evidence/t17-acceptance-32/docs-r6',manifest='goal-1/evidence/t17-acceptance-32/build-r6.source-before.json';
guard(resolve(out));
const hash=b=>createHash('sha256').update(b).digest('hex'),ident=p=>{const b=fs.readFileSync(p),s=fs.lstatSync(p);return{path:p,bytes:b.length,sha256:hash(b),mode:s.mode&511};};
const put=(n,v)=>{guard(resolve(out));fs.writeFileSync(out+'/'+n,Buffer.isBuffer(v)||typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const deps=()=>['scripts/browser_evidence_guard.mjs',out+'/run-checks.mjs',out+'/input-inventory.py'].map(ident);
function sourceBinding(){const expected=JSON.parse(fs.readFileSync(manifest,'utf8')).files,current=expected.map(r=>ident(r.path)),map=new Map(expected.map(r=>[r.path,r])),mismatch=current.filter(r=>['bytes','sha256','mode'].some(k=>r[k]!==map.get(r.path)[k]));return{manifest:ident(manifest),count:current.length,allRowsMatched:mismatch.length===0,mismatch,rowsDigestSha256:hash(Buffer.from(JSON.stringify(current))),dependencies:deps()};}
function inventory(name){const argv=['rtk','proxy','python3','-B',out+'/input-inventory.py',name],start=Date.now();const r=spawnSync(argv[0],argv.slice(1),{cwd:repo,maxBuffer:128*1024*1024});if(r.status!==0)throw Error('INPUT_INVENTORY_FAILED:'+r.status+':'+String(r.stderr));return{data:JSON.parse(String(r.stdout)),argv,exitCode:r.status,wallMs:Date.now()-start};}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),all=[];
try{
 for(const [name,args] of [['plan',['scripts/check_plan.py']],['competitive',['scripts/check_competitive_design.py']],['docs',['scripts/check_docs.py','--text-only']]]){
  const argv=['rtk','proxy','python3','-B',...args],before=sourceBinding();put(name+'.source-before.json',before);put(name+'.command.json',{at:new Date().toISOString(),argv,checkKind:'Original whole repository checker CLI; no scoped substitution'});
  const ib=inventory(name);put(name+'.inputs-before.json.gz',gzipSync(Buffer.from(JSON.stringify(ib.data))));
  guard(resolve(out));const start=Date.now(),r=spawnSync(argv[0],argv.slice(1),{cwd:repo,maxBuffer:32*1024*1024});const wallMs=Date.now()-start;
  put(name+'.stdout.log',r.stdout??Buffer.alloc(0));put(name+'.stderr.log',r.stderr??Buffer.alloc(0));
  const ia=inventory(name),after=sourceBinding();
  const bm=new Map(ib.data.rows.map(row=>[row.path,row])),am=new Map(ia.data.rows.map(row=>[row.path,row])),added=ia.data.rows.filter(row=>!bm.has(row.path)),removed=ib.data.rows.filter(row=>!am.has(row.path)),changed=ia.data.rows.filter(row=>bm.has(row.path)&&!same(row,bm.get(row.path)));
  const inputEqual=ib.data.rowsDigestSha256===ia.data.rowsDigestSha256;
  put(name+'.inputs-readback.json',{provider:ib.data.provider,scoped:name!=='docs',before:{count:ib.data.count,rowsDigestSha256:ib.data.rowsDigestSha256,argv:ib.argv,wallMs:ib.wallMs},after:{count:ia.data.count,rowsDigestSha256:ia.data.rowsDigestSha256,argv:ia.argv,wallMs:ia.wallMs},inputEqual,added,removed,changed,note:'Before gzip contains identities only, not source/raw payload copies. Native writer input additions/changes are reported, not silently excluded from whole docs.'});
  put(name+'.source-after.json',after);const sourceEqual=same(before,after),row={at:new Date().toISOString(),argv,exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,wallMs,sourceCount:before.count,sourceEqual,sourceMatchedR6:before.allRowsMatched&&after.allRowsMatched,inputEqual,inputCountBefore:ib.data.count,inputCountAfter:ia.data.count,provider:ib.data.provider,scopedInputs:name!=='docs',wholeDocs:name==='docs'};put(name+'.result.json',row);all.push(row);console.log(JSON.stringify(row));
 }
 put('execution-summary.json',{at:new Date().toISOString(),results:all,noBusinessOrCompatibilityTests:true,originalCheckerExitsPreserved:true});process.exitCode=all.some(r=>r.exitCode!==0||!r.sourceEqual||!r.sourceMatchedR6)?1:0;
}catch(error){put('failure.json',{at:new Date().toISOString(),completed:all,error:String(error),stack:error?.stack});console.error(String(error));process.exitCode=1;}
