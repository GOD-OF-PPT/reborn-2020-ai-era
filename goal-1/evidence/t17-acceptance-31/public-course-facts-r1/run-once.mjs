import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';
const out=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(out,'../../../..'),root='goal-1/evidence/t17-acceptance-31';
const hash=b=>createHash('sha256').update(b).digest('hex'),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const put=(n,v)=>{guard(out);fs.writeFileSync(path.join(out,n),typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'})};
function read(p){const absolute=path.resolve(repo,p);if(path.relative(repo,absolute).startsWith('..'))throw Error('REPOSITORY_INPUT_REQUIRED');for(let current=path.dirname(absolute);current!==repo;current=path.dirname(current)){const s=fs.lstatSync(current);if(!s.isDirectory()||s.isSymbolicLink())throw Error('REGULAR_INPUT_ANCESTRY_REQUIRED:'+p)}const s=fs.lstatSync(absolute);if(!s.isFile()||s.isSymbolicLink())throw Error('REGULAR_FILE_REQUIRED:'+p);const b=fs.readFileSync(absolute);return {bytes:b,identity:{path:p,bytes:b.length,sha256:hash(b),mode:s.mode&0o777}}}
function tree(dir){const rows=[];for(const name of fs.readdirSync(path.join(repo,dir)).sort()){const p=dir+'/'+name,s=fs.lstatSync(path.join(repo,p));if(s.isSymbolicLink())throw Error('SOURCE_SYMLINK:'+p);if(s.isDirectory())rows.push(...tree(p));else if(s.isFile())rows.push(read(p).identity);else throw Error('NON_REGULAR_SOURCE:'+p)}return rows}
const sources=()=>[...tree('src'),...tree('assets'),...tree('public'),...['package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.core.json','tsconfig.node.json','vite.config.ts','vitest.config.ts','index.html'].map(p=>read(p).identity)].sort((a,b)=>a.path.localeCompare(b.path));
const authorityPaths=['build-final-r6.source-before.json','build-final-r6.source-after.json','build-final-r6.result.json'].map(p=>root+'/'+p);
const selected={
 'chrome-main-r5':['normal-course-73-funded.json','normal86-sample-actually-ready.json','actual-previous-backup85.json','r6-original-main86-after-preferences.json'],
 'chrome-final-r6':['r6-normal86-after-next-today-life.json','r6-normal86-reentered.json'],
 'chrome-atomic-r1':['candidate-74-outline-not-published.json','old-saved-73-after-abort.json','retry-saved-74.json'],
 'chrome-physical-old-r1':['physical-old-73.json'],
 'chrome-physical-new-r1':['physical-new-74.json']
};
function inputs(){const files=[],records=[];for(const [folder,names]of Object.entries(selected)){const manifest=root+'/'+folder+'/exports.jsonl',m=read(manifest);files.push(m.identity);const lines=m.bytes.toString('utf8').split('\n');for(const name of names){const matches=lines.flatMap((l,i)=>{if(!l)return [];const row=JSON.parse(l);return row.file===name?[{row,line:i+1}]:[]});if(matches.length!==1)throw Error('EXACT_SINGLE_MANIFEST_ROW_REQUIRED:'+folder+'/'+name);const {row,line}=matches[0],p=root+'/'+folder+'/'+name,r=read(p),v=JSON.parse(r.bytes.toString('utf8')),role=row.source?.match(/^(SAVED_UI|PHYSICAL_READONLY|IMPORT_BUFFER|UNSAVED_CANDIDATE):/)?.[1]?.toLowerCase();if(!role||role!==row.origin)throw Error('EXPLICIT_ROLE_REQUIRED:'+p);if(row.bytes!==r.identity.bytes||row.sha256!==r.identity.sha256||row.runId!==v.runId||row.revision!==v.revision)throw Error('MANIFEST_BYTES_OR_HEADER_MISMATCH:'+p);files.push(r.identity);const {state,checksum,...header}=v;records.push({manifest,line,origin:row.origin,source:row.source,role,identity:r.identity,publicHeader:header,checksum});}}return {files:files.sort((a,b)=>a.path.localeCompare(b.path)),records}}
const started=Date.now();let terminal=null;
try{
 if(fs.existsSync(path.join(out,'command.json'))||fs.existsSync(path.join(out,'result.json'))||fs.existsSync(path.join(out,'public-facts.json')))throw Error('ONCE_ONLY_NO_RESTART');
 guard(out);
 const before=sources(),authority=authorityPaths.map(p=>read(p).identity),a=JSON.parse(read(authorityPaths[0]).bytes),b=JSON.parse(read(authorityPaths[1]).bytes),build=JSON.parse(read(authorityPaths[2]).bytes),canonical=rows=>rows.map(({path,bytes,sha256,mode})=>({path,bytes,sha256,mode})).sort((a,b)=>a.path.localeCompare(b.path));
 const sourceR6Equal=same(canonical(a.files),canonical(b.files))&&same(before,canonical(b.files));
 if(!sourceR6Equal||build.exitCode!==0||build.sourceCount!==before.length||!build.sourceUnchanged||!build.extraSame)throw Error('AUTHORITATIVE_R6_SOURCE_BINDING_FAILED');
 const extra=['scripts/browser_evidence_guard.mjs',root+'/public-course-facts-r1/facts.mjs',root+'/public-course-facts-r1/run-once.mjs',root+'/public-course-facts-r1/input.md',root+'/public-course-facts-r1/plan.md',root+'/public-course-facts-r1/tasks.md'].map(p=>read(p).identity),inputBefore=inputs();
 put('source-before.json',{at:new Date().toISOString(),files:before,authority,extra,sourceR6Equal,sourceCount:before.length,node:{version:process.version,execPath:process.execPath},packageResolutionBoundary:'Repository source and package lock frozen; installed node_modules contents are not recursively inventoried.'});put('input-before.json',inputBefore);
 const argv=['proxy','node','--experimental-strip-types',root+'/public-course-facts-r1/facts.mjs'];put('command.json',{at:new Date().toISOString(),cwd:repo,argv:['rtk',...argv],scope:'One original codec/public projection pass; no game command or complete Create replay.'});
 const r=spawnSync('rtk',argv,{cwd:repo,maxBuffer:32*1024*1024});terminal={exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null};
 put('stdout.log',r.stdout??Buffer.alloc(0));put('stderr.log',r.stderr??Buffer.alloc(0));
 const after=sources(),inputAfter=inputs(),extraAfter=extra.map(x=>read(x.path).identity),authorityAfter=authorityPaths.map(p=>read(p).identity);
 const sourceUnchanged=same(before,after),inputUnchanged=same(inputBefore,inputAfter),extraUnchanged=same(extra,extraAfter),authorityUnchanged=same(authority,authorityAfter);
 put('source-after.json',{files:after,extra:extraAfter,authority:authorityAfter,sourceUnchanged,extraUnchanged,authorityUnchanged});put('input-after.json',inputAfter);
 const factsPath=path.join(out,'public-facts.json'),facts=fs.existsSync(factsPath)?JSON.parse(fs.readFileSync(factsPath,'utf8')):null;
 const result={at:new Date().toISOString(),wallMs:Date.now()-started,...terminal,sourceCount:before.length,sourceR6Equal,sourceUnchanged,inputUnchanged,extraUnchanged,authorityUnchanged,factIdentity:facts?read(root+'/public-course-facts-r1/public-facts.json').identity:null,allFactChecks:facts?.allFactChecks??false,passed:terminal.exitCode===0&&terminal.signal===null&&terminal.error===null&&sourceUnchanged&&inputUnchanged&&extraUnchanged&&authorityUnchanged&&facts?.allFactChecks===true};
 put('result.json',result);console.log(JSON.stringify(result));process.exitCode=result.passed?0:terminal.exitCode||1;
}catch(error){put('runner-error.json',{at:new Date().toISOString(),wallMs:Date.now()-started,terminal,error:String(error)});console.error(String(error));process.exitCode=1}
