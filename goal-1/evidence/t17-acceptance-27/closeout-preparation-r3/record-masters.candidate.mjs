import {resolve} from 'node:path';
import {repo,task,json,bytes,ident,put,git,verifySeal,preserve,delta,blobOid,proof,hash,gitIdentity,checkStatus,postRequired} from './closeout-lib.candidate.mjs';
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs';
const [mode,out,commit]=process.argv.slice(2);postRequired(out);
const feature=json(out+'/feature-stage-plan.json'),featureCommit=json(out+'/feature-commit-readback.json').featureCommit,head=()=>git(['rev-parse','HEAD']).toString().trim(),names=()=>git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort();
const exact=(a,b)=>{if(JSON.stringify([...a].sort())!==JSON.stringify([...b].sort()))throw Error('RECORD_EXACT_PATHS_REQUIRED')};
const preserved=preserve();verifySeal(task);exact(delta().ui,feature.sourceDelta.ui);exact(delta().newAssets,feature.sourceDelta.newAssets);
for(const r of feature.ordinary){const n=ident(r.path);if(n.sha256!==r.sha256||n.mode!==r.mode)throw Error('FEATURE_SOURCE_OR_EVIDENCE_CHANGED_BEFORE_RECORD:'+r.path)}
if(mode==='prepare'){
 assertBrowserEvidenceWritable(resolve(repo,out));gitIdentity(featureCommit);if(names().length)throw Error('RECORD_PREPARE_INDEX_MUST_BE_EMPTY');const selected=[];
 for(const r of feature.masters){
  const originalWorking=bytes(r.workingSnapshot),current=bytes(r.path),headBytes=git(['cat-file','blob',featureCommit+':'+r.path]);
  if(hash(headBytes)!==r.sha256||hash(originalWorking)!==r.workingIdentity.sha256||!current.subarray(0,originalWorking.length).equals(originalWorking))throw Error('RECORD_PREFIX_OR_FEATURE_BLOB_CHANGED');
  const suffix=current.subarray(originalWorking.length);if(!suffix.length)throw Error('EXPLICIT_NEW_R1_COMPLETION_RECORD_REQUIRED');const intended=Buffer.concat([headBytes,suffix]),name=r.path.split('/').at(-1)+'.record-intended.txt';put(out,name,intended);
  selected.push({path:r.path,readFrom:out+'/'+name,bytes:intended.length,sha256:hash(intended),oid:blobOid(intended),gitMode:r.gitMode,workingIdentity:ident(r.path),newRecordSuffixBytes:suffix.length,newRecordSuffixSha256:hash(suffix),preservedP3:r.originalP3});
 }
 checkStatus([...feature.paths,...selected.map(r=>r.path)],out,preserved.excludedP3Paths);
 put(out,'record-intent.json',JSON.stringify({at:new Date().toISOString(),parent:featureCommit,masters:selected,scope:'R1 completion record only; S4/T17/goal still incomplete',wholeGoal:false,wholeT17:false,wholeS4:false,push:false},null,2)+'\n');console.log(JSON.stringify({preparedRecordMasters:3,parent:featureCommit,indexWrites:false}));
}else{
 const seal=verifySeal(out),marker=json(out+'/sealed-evidence.json'),intent=json(out+'/record-intent.json'),ordinary=[...marker.files.map(r=>r.path),out+'/sealed-evidence.json'].sort().map(path=>({...ident(path),oid:blobOid(bytes(path))})),rows=[...ordinary,...intent.masters];
 checkStatus([...feature.paths,...rows.map(r=>r.path)],out,preserved.excludedP3Paths);
 if(mode==='stage'){
  gitIdentity(intent.parent);if(names().length)throw Error('RECORD_INDEX_CHANGED_NO_RESET');for(const r of intent.masters){const n=ident(r.path);if(n.sha256!==r.workingIdentity.sha256||n.mode!==r.workingIdentity.mode||hash(bytes(r.readFrom))!==r.sha256)throw Error('RECORD_MASTER_CHANGED')}
  // NUL stdin is bound to the just-verified sealed post paths; no write to that sealed post.
  git(['add','-f','--pathspec-from-file=-','--pathspec-file-nul'],Buffer.from(ordinary.map(r=>r.path).join('\0')+'\0'));
  for(const r of intent.masters){const oid=git(['hash-object','-w','--stdin'],bytes(r.readFrom)).toString().trim();if(oid!==r.oid)throw Error('RECORD_MASTER_OID');git(['update-index','--add','--cacheinfo',r.gitMode+','+oid+','+r.path])}
  exact(names(),rows.map(r=>r.path));console.log(JSON.stringify({stage:true,seal,...proof(rows),output:'stdout only; sealed post was not written'},null,2));
 }else if(mode==='verify-commit'){
  if(!commit||head()!==commit)throw Error('EXPLICIT_RECORD_COMMIT_REQUIRED');gitIdentity(commit);const parents=git(['rev-list','--parents','-n','1',commit]).toString().trim().split(' ');if(parents.length!==2||parents[1]!==intent.parent)throw Error('RECORD_PARENT_CHANGED');
  exact(git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split('\0').filter(Boolean),rows.map(r=>r.path));if(names().length)throw Error('RECORD_INDEX_NOT_EMPTY');
  for(const r of intent.masters){const n=ident(r.path);if(n.sha256!==r.workingIdentity.sha256||n.mode!==r.workingIdentity.mode)throw Error('P3_MASTER_WORKING_BYTES_CHANGED')}
  console.log(JSON.stringify({recordCommit:commit,parent:intent.parent,seal,...proof(rows,commit),indexEmpty:true,mastersRetainP3:true,output:'stdout only; sealed post was not written'},null,2));
 }else throw Error('EXPLICIT prepare|stage|verify-commit REQUIRED');
}
