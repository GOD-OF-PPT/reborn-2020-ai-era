import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {repo,task,tree,verifySeal,preserve} from './closeout-lib.candidate.mjs';
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs';
const mode=process.argv[2],post=process.argv[3],target=mode==='--create-post-after-writers-stopped'||mode==='--verify'&&post?post:task;
if(target!==task&&(!target||!target.startsWith('goal-1/evidence/t17-s3-course-teaching-post-commit-')))throw Error('C2_ROOT_OR_POST_REQUIRED');
if(mode==='--verify'){console.log(JSON.stringify({seal:verifySeal(target),preservation:preserve()},null,2))}
else if(mode==='--create-after-writers-stopped'||mode==='--create-post-after-writers-stopped'){
 // Root must first stop evidence writers and finish the target's own files. This flag is not writer detection.
 assertBrowserEvidenceWritable(resolve(repo,target));preserve();const before=tree(target),again=tree(target);if(JSON.stringify(before)!==JSON.stringify(again))throw Error('EVIDENCE_MOVED_WHILE_READING');
 const marker={format:target===task?'t17-s3-course-teaching-original-bytes-v1':'t17-s3-course-teaching-post-original-bytes-v1',at:new Date().toISOString(),selfExcluded:'sealed-evidence.json',scope:target===task?'C2 final precommit snapshot; real Git/task completion belongs in independent post/masters':'Actual feature commit/readback, guard refusals and completion-record intent; record commit checked after this snapshot',...before};
 writeFileSync(resolve(repo,target,'sealed-evidence.json'),JSON.stringify(marker,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({seal:verifySeal(target)},null,2));
}else throw Error('EXPLICIT --verify OR --create-after-writers-stopped OR --create-post-after-writers-stopped REQUIRED');
