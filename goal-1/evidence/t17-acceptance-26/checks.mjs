import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {put,ident,tree,verifySeal,hash} from '../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
import {assertBrowserEvidenceWritable} from '../../../scripts/browser_evidence_guard.mjs';

const root='goal-1/evidence/t17-acceptance-26';
assertBrowserEvidenceWritable(resolve(root));
const mode=process.argv[2];
if(mode==='checks'||mode==='final-docs'){
 const commands=mode==='final-docs'?[['docs-final',['python3','-B','scripts/check_docs.py','--text-only']]]:[
  ['script-syntax',['node','--check',root+'/storyboard/storyboard.js']],
  ['plan',['python3','-B','scripts/check_plan.py']],
  ['competitive',['python3','-B','scripts/check_competitive_design.py']],
  ['docs',['python3','-B','scripts/check_docs.py','--text-only']],
 ];
 const results=[];
 for(const [label,args] of commands){
  const started=new Date().toISOString();
  const r=spawnSync('rtk',['proxy',...args],{encoding:'utf8',maxBuffer:8*1024*1024});
  put(root,label+'.stdout.txt',r.stdout??'');put(root,label+'.stderr.txt',r.stderr??'');
  results.push({label,args:['rtk','proxy',...args],started,ended:new Date().toISOString(),exit:r.status,signal:r.signal,error:r.error?.message??null});
 }
 const before=readFileSync('goal-1/evidence/t17-acceptance-25/docs-final-r2/stderr.txt','utf8').split('\n').filter(Boolean);
 const after=readFileSync(root+'/'+(mode==='final-docs'?'docs-final':'docs')+'.stderr.txt','utf8').split('\n').filter(Boolean);
 const counts=a=>a.reduce((m,s)=>(m.set(s,(m.get(s)??0)+1),m),new Map());
 const old=counts(before),now=counts(after);
 const added=after.filter(s=>{const n=old.get(s)??0;if(n){old.set(s,n-1);return false}return true});
 const removed=before.filter(s=>{const n=now.get(s)??0;if(n){now.set(s,n-1);return false}return true});
 const comparison={previousErrors:before.length,currentErrors:after.length,added,removed};
 put(root,mode==='final-docs'?'checks-final-result.json':'checks-result.json',JSON.stringify({scope:'S4-R0 design only; no gameplay or compatibility tests',results,docsComparison:comparison},null,2)+'\n');
 console.log(JSON.stringify({results,docsComparison:comparison},null,2));
}else if(mode==='preserve'){
 const baseline=JSON.parse(readFileSync(root+'/baseline.json','utf8'));
 const masters=new Set(Object.keys(baseline.masters));
 for(const [path,row] of Object.entries(baseline.priorFiles)){
  if(masters.has(path))continue;
  const actual=ident(path);if(actual.bytes!==row.bytes||actual.sha256!==row.sha256||actual.mode!==row.mode)throw Error('PRIOR_WORK_CHANGED:'+path);
 }
 for(const [path,row] of Object.entries(baseline.masters)){
  const b=readFileSync(path);if(hash(b.subarray(0,row.working.bytes))!==row.working.sha256)throw Error('MASTER_PRIOR_PREFIX_CHANGED:'+path);
 }
 const current=[...tree('src').files,...tree('assets').files].sort((a,b)=>a.path.localeCompare(b.path));
 const expected=[...baseline.runtimeAndAssets].sort((a,b)=>a.path.localeCompare(b.path));
 if(JSON.stringify(current)!==JSON.stringify(expected))throw Error('RUNTIME_OR_ASSET_CHANGED');
 for(const [path,row] of Object.entries(baseline.seals))if(ident(path).sha256!==row.sha256)throw Error('OLD_MARKER_CHANGED:'+path);
 const seals=['goal-1/evidence/t17-acceptance-25','goal-1/evidence/t17-s3-course-teaching-post-commit-01'].map(verifySeal);
 const root19=tree('goal-1/evidence/t17-acceptance-19');
 const old19=JSON.parse(readFileSync('goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/root19-preparation-tree.json','utf8'));
 if(JSON.stringify(root19)!==JSON.stringify(old19))throw Error('P3_ROOT19_CHANGED');
 const original=ident('goal-1/input.md');if(original.sha256!==baseline.originalInput.sha256)throw Error('ORIGINAL_INPUT_CHANGED');
 const result={at:new Date().toISOString(),priorWorkingFiles:Object.keys(baseline.priorFiles).length,priorMasterPrefixes:3,runtimeAndAssets:current.length,allUnchanged:true,oldSealMarkers:Object.keys(baseline.seals).length,seals,root19:{files:root19.files.length,directories:root19.directories.length},originalInput:original,scope:'Full bytes/modes for current src/assets and prior non-master WIP; prior master prefixes; newest two full seals and all old markers. Not a new full historical acceptance.'};
 put(root,'preservation-result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}else throw Error('EXPLICIT checks|final-docs|preserve REQUIRED');
