import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {repo,task,tree,verifySeal,preserve,gitIdentity,postRequired} from './closeout-lib.candidate.mjs';
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs';
const [mode,post]=process.argv.slice(2),target=mode==='--create-post-after-writers-stopped'||mode==='--verify'&&post?post:task;
if(target!==task)postRequired(target);
if(mode==='--verify')console.log(JSON.stringify({seal:verifySeal(target),preservation:preserve()},null,2));
else if(mode==='--create-after-writers-stopped'||mode==='--create-post-after-writers-stopped'){
 // This explicit flag is Root's declaration, not detection of active browser/evidence writers.
 assertBrowserEvidenceWritable(resolve(repo,target));preserve();if(target===task)gitIdentity();const before=tree(target),again=tree(target);if(JSON.stringify(before)!==JSON.stringify(again))throw Error('EVIDENCE_MOVED_WHILE_READING');
 const marker={format:target===task?'t17-s4-relay-r1-original-bytes-v1':'t17-s4-relay-r1-post-original-bytes-v1',at:new Date().toISOString(),selfExcluded:'sealed-evidence.json',scope:target===task?'R1 final precommit snapshot; actual commit/readback belongs in independent post/masters':'Actual feature commit/readback, sealed-parent refusals and completion-record intent; record commit checked after this snapshot',...before};
 assertBrowserEvidenceWritable(resolve(repo,target));writeFileSync(resolve(repo,target,'sealed-evidence.json'),JSON.stringify(marker,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({seal:verifySeal(target)},null,2));
}else throw Error('EXPLICIT --verify OR --create-after-writers-stopped OR --create-post-after-writers-stopped REQUIRED');
