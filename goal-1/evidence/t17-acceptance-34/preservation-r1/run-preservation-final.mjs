import {spawnSync} from 'node:child_process';
import {writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs';
const out=resolve('goal-1/evidence/t17-acceptance-34/preservation-r1');assertBrowserEvidenceWritable(out);
const argv=['proxy','node','goal-1/evidence/t17-acceptance-34/preservation-r1/verify-preservation-final.mjs'],start=new Date().toISOString(),clock=performance.now();
const command={program:'rtk',argv,cwd:process.cwd(),start,sourceSha256:createHash('sha256').update(readFileSync(resolve(out,'verify-preservation-final.mjs'))).digest('hex')};
writeFileSync(resolve(out,'command.json'),JSON.stringify(command,null,2)+'\n',{flag:'wx'});
const r=spawnSync('rtk',argv,{cwd:process.cwd(),encoding:'utf8',maxBuffer:4*1024*1024});
for(const [name,value]of [['stdout.txt',r.stdout??''],['stderr.txt',r.stderr??'']]){assertBrowserEvidenceWritable(out);writeFileSync(resolve(out,name),value,{flag:'wx'});}
const terminal={...command,end:new Date().toISOString(),wallMilliseconds:performance.now()-clock,exitCode:r.status,signal:r.signal,error:r.error?{name:r.error.name,message:r.error.message}:null};assertBrowserEvidenceWritable(out);writeFileSync(resolve(out,'terminal.json'),JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');console.log(JSON.stringify({exitCode:r.status,signal:r.signal,wallMilliseconds:terminal.wallMilliseconds}));process.exitCode=r.status??1;
