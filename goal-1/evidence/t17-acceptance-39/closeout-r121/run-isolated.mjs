import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import crypto from 'node:crypto';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';
const root='goal-1/evidence/t17-acceptance-39',out=root+'/closeout-r121',snapshot=JSON.parse(fs.readFileSync(out+'/isolated-source.json'));
if(!snapshot.allRelativeImportsResolved)throw Error('COMPLETE_IMPORT_SNAPSHOT_REQUIRED');
const node='/Users/gordon/.nvm/versions/node/v22.12.0/bin/node';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const verify=()=>snapshot.snapshots.every(x=>sha(fs.readFileSync(x.path))===x.sha256&&sha(fs.readFileSync(path.join(snapshot.target,x.path)))===x.sha256);
if(!verify())throw Error('SOURCE_CHANGED_BEFORE_RUN');
async function run(name,args){
 guard(out);const stdout=fs.openSync(out+'/'+name+'.stdout.log','wx'),stderr=fs.openSync(out+'/'+name+'.stderr.log','wx'),start=Date.now();
 const result=await new Promise(resolve=>{const child=cp.spawn(node,args,{cwd:snapshot.target,env:{...process.env,PATH:path.dirname(node)+':'+process.env.PATH},stdio:['ignore',stdout,stderr]});child.on('error',error=>resolve({exitCode:null,error:String(error)}));child.on('close',(exitCode,signal)=>resolve({exitCode,signal}))});
 fs.closeSync(stdout);fs.closeSync(stderr);
 const report={at:new Date().toISOString(),...result,wallMs:Date.now()-start,command:[node,...args],cwd:snapshot.target,head:snapshot.head,ownedProductCount:54,p3WipIncluded:0,sourceUnchanged:verify(),compatibility:0};
 guard(out);fs.writeFileSync(out+'/'+name+'.result.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});return {name,...report};
}
const results=await Promise.all([run('isolated-type',[path.join(snapshot.target,'node_modules/typescript/bin/tsc'),'-b','--pretty','false']),run('isolated-build',[path.join(snapshot.target,'node_modules/vite/bin/vite.js'),'build','--outDir','dist-isolated'])]);
console.log(JSON.stringify(results.map(({name,exitCode,wallMs,sourceUnchanged})=>({name,exitCode,wallMs,sourceUnchanged,p3WipIncluded:0}))));
if(results.some(x=>x.exitCode!==0||!x.sourceUnchanged))process.exitCode=1;
