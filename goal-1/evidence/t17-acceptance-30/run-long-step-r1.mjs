import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {tree,ident} from '../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
import {assertBrowserEvidenceWritable as guard} from '../../../scripts/browser_evidence_guard.mjs';
const root='goal-1/evidence/t17-acceptance-30',[name,...argv]=process.argv.slice(2);
if(!/^[a-zA-Z0-9_.-]+$/.test(name??'')||!argv.length)throw Error('STEP_AND_ARGV_REQUIRED');guard(root);
const sources=()=>[...tree('src').files,...tree('assets').files,...tree('public').files,...['package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.core.json','tsconfig.node.json','vite.config.ts','vitest.config.ts','index.html'].map(ident)].sort((a,b)=>a.path.localeCompare(b.path));
const put=(suffix,value)=>{guard(root);fs.writeFileSync(resolve(root,name+'.'+suffix),JSON.stringify(value,null,2)+'\n',{flag:'wx'})};
const before=sources(),extra=[ident(root+'/run-long-step-r1.mjs'),ident('scripts/browser_evidence_guard.mjs')];put('source-before.json',{files:before,extra});
const logs={};for(const kind of ['stdout','stderr']){guard(root);logs[kind]=fs.openSync(resolve(root,name+'.'+kind+'.log'),'wx')}
const start=Date.now(),child=spawn('rtk',['proxy',...argv],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
put('started.json',{at:new Date().toISOString(),cwd:process.cwd(),argv:['rtk','proxy',...argv],parentPid:process.pid,childPid:child.pid,sourceCount:before.length,originalTimeoutsAndIsolationUnmodified:true});
for(const kind of ['stdout','stderr'])child[kind].on('data',chunk=>{guard(root);fs.writeSync(logs[kind],chunk);process[kind].write(chunk)});
let error=null;const ended=await new Promise(resolve=>{child.once('error',e=>{error=String(e);resolve({code:null,signal:null})});child.once('close',(code,signal)=>resolve({code,signal}))});
for(const fd of Object.values(logs))fs.closeSync(fd);
const after=sources(),sourceUnchanged=JSON.stringify(before)===JSON.stringify(after),extraSame=extra.every(row=>{const now=ident(row.path);return row.bytes===now.bytes&&row.sha256===now.sha256&&row.mode===now.mode});put('source-after.json',{files:after,extraSame});
const result={at:new Date().toISOString(),argv:['rtk','proxy',...argv],exitCode:ended.code,signal:ended.signal,wallMs:Date.now()-start,sourceCount:before.length,sourceUnchanged,extraSame,error};put('result.json',result);console.log(JSON.stringify(result));process.exitCode=ended.code===0&&sourceUnchanged&&extraSame&&!error?0:ended.code||1;
