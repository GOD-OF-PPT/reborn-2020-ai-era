import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {post,write,identity} from '../t17-acceptance-36/closeout-r1/closeout.mjs';
import {repo,put,hash,blobOid,ident} from '../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
import {assertBrowserEvidenceWritable as guard} from '../../../scripts/browser_evidence_guard.mjs';

async function run(name,args){
 guard(post);const argv=['rtk','proxy',...args],started=new Date().toISOString();
 const r=await new Promise((accept,reject)=>{const p=spawn(argv[0],argv.slice(1),{cwd:repo}),out=[],err=[];p.stdout.on('data',b=>out.push(b));p.stderr.on('data',b=>err.push(b));p.on('error',reject);p.on('close',(code,signal)=>accept({code,signal,stdout:Buffer.concat(out),stderr:Buffer.concat(err)}));});
 put(post,name+'.stdout.txt',r.stdout);put(post,name+'.stderr.txt',r.stderr);
 write(post,name+'.command.json',{argv,started,finished:new Date().toISOString(),exitCode:r.code,signal:r.signal});if(r.code!==0)throw Error('READBACK_COMMAND_FAILED:'+name);return r.stdout;
}
const initial=await Promise.allSettled([
 run('repository',['gh','repo','view','--json','nameWithOwner,visibility,url,defaultBranchRef']),
 run('origin-main',['git','ls-remote','--heads','origin','main']),
 run('working-status',['git','status','--porcelain=v1','-z','--untracked-files=all'])
]);
for(const r of initial)if(r.status!=='fulfilled')throw r.reason;
const account=JSON.parse(initial[0].value.toString()),line=initial[1].value.toString().trim().split(/\s+/);
if(account.nameWithOwner!=='GOD-OF-PPT/reborn-2020-ai-era'||account.visibility!=='PUBLIC'||account.defaultBranchRef?.name!=='main'||line.length!==2||line[1]!=='refs/heads/main'||!/^([0-9a-f]{40})$/.test(line[0]))throw Error('REMOTE_IDENTITY_DRIFT');
const remoteMain=line[0],file='README.md';
const paired=await Promise.allSettled([
 run('remote-readme',['gh','api','repos/GOD-OF-PPT/reborn-2020-ai-era/contents/'+file+'?ref='+remoteMain]),
 run('pinned-readme',['git','cat-file','blob',remoteMain+':'+file])
]);
for(const r of paired)if(r.status!=='fulfilled')throw r.reason;
const api=JSON.parse(paired[0].value.toString()),bytes=Buffer.from(api.content,'base64');
if(api.type!=='file'||api.path!==file||api.encoding!=='base64'||api.size!==bytes.length||api.sha!==blobOid(bytes)||!bytes.equals(paired[1].value))throw Error('REMOTE_FILE_BYTES_MISMATCH');
const final=await run('origin-main-after',['git','ls-remote','--heads','origin','main']);if(!final.equals(initial[1].value))throw Error('REMOTE_MOVED_DURING_READBACK');
write(post,'repository-readback.json',{at:new Date().toISOString(),identity:identity('8f306ec06a2139bf4aee43c50f0f95d6d8e53f12'),repository:account,remoteMain,remoteMainBeforeAfterEqual:true,remoteFile:{path:file,ref:remoteMain,bytes:bytes.length,gitBlob:api.sha,sha256:hash(bytes),localPinnedGitBlobBytesEqual:true},workingReadme:ident(file),workingInput:ident('goal-1/input.md'),scope:'read-only actual remote branch and pinned file bytes; no push, fetch, deployment or remote update',push:false});
console.log(JSON.stringify({repository:account.nameWithOwner,visibility:account.visibility,remoteMain,readmeSha256:hash(bytes),remoteStable:true,push:false}));
