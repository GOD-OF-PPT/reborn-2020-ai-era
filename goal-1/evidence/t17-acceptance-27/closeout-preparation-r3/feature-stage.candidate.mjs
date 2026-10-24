import {resolve} from 'node:path';
import {repo,task,opening,extras,json,bytes,ident,put,git,verifySeal,preserve,delta,masters,blobOid,proof,hash,gitIdentity,checkStatus,postRequired} from './closeout-lib.candidate.mjs';
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs';
const [mode,out,commit]=process.argv.slice(2);postRequired(out);assertBrowserEvidenceWritable(resolve(repo,out));
const head=()=>git(['rev-parse','HEAD']).toString().trim(),indexNames=()=>git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort();
const exact=(a,b)=>{if(JSON.stringify([...a].sort())!==JSON.stringify([...b].sort()))throw Error('EXACT_PATH_SET_MISMATCH')};
if(mode==='prepare'){
 gitIdentity();if(indexNames().length)throw Error('EXISTING_INDEX_MUST_BE_REVIEWED_NO_RESET');
 const preserved=preserve(),seal=verifySeal(task),marker=json(task+'/sealed-evidence.json'),sourceDelta=delta();
 // Root must separately review this explicit file; no inference from unrelated docs/assets.
 exact(json(out+'/extra-owned-paths.json'),extras);
 const ordinaryPaths=[...new Set([...sourceDelta.ui,...marker.files.map(r=>r.path),task+'/sealed-evidence.json',...extras])].sort(),selectedMasters=[];
 for(const row of masters()){
  const name=row.path.split('/').at(-1)+'.feature-intended.txt',workingName=row.path.split('/').at(-1)+'.working-before-feature.txt';
  put(out,name,row.intended);put(out,workingName,row.current);
  selectedMasters.push({path:row.path,bytes:row.intended.length,sha256:hash(row.intended),oid:blobOid(row.intended),gitMode:'100644',kind:'selective-master',readFrom:out+'/'+name,workingSnapshot:out+'/'+workingName,workingIdentity:row.workingIdentity,ownSuffixBytes:row.ownSuffixBytes,ownSuffixSha256:row.ownSuffixSha256,originalP3:row.p3,committedP0:row.committedP0});
 }
 const ordinary=ordinaryPaths.map(path=>({...ident(path),oid:blobOid(bytes(path)),kind:'current-owned'})),all=[...ordinary,...selectedMasters];
 checkStatus(all.map(r=>r.path),out,preserved.excludedP3Paths);
 put(out,'stage-paths.nul',Buffer.from(ordinaryPaths.join('\0')+'\0'));
 put(out,'feature-stage-plan.json',JSON.stringify({at:new Date().toISOString(),parent:opening().head,seal,sourceDelta,ordinary,masters:selectedMasters,paths:all.map(r=>r.path).sort(),ignoredLogPaths:ordinaryPaths.filter(p=>p.endsWith('.log')),excludedP3Paths:preserved.excludedP3Paths,excludedTree:'goal-1/evidence/t17-acceptance-19/'},null,2)+'\n');
 console.log(JSON.stringify({prepared:true,ordinary:ordinary.length,masters:selectedMasters.length,root27SealedFiles:marker.files.length,indexWrites:false},null,2));
}else{
 const plan=json(out+'/feature-stage-plan.json'),rows=[...plan.ordinary,...plan.masters],preserved=preserve();verifySeal(task);exact(delta().ui,plan.sourceDelta.ui);exact(delta().newAssets,plan.sourceDelta.newAssets);
 if(mode==='stage'){
  gitIdentity(plan.parent);if(indexNames().length)throw Error('INDEX_CHANGED_NO_RESET');
  for(const r of plan.ordinary){const n=ident(r.path);if(n.bytes!==r.bytes||n.sha256!==r.sha256||n.mode!==r.mode)throw Error('OWNED_DISK_CHANGED:'+r.path)}
  for(const r of plan.masters)if(ident(r.path).sha256!==r.workingIdentity.sha256||hash(bytes(r.readFrom))!==r.sha256||ident(r.path).mode!==r.workingIdentity.mode)throw Error('MASTER_CHANGED:'+r.path);
  checkStatus(plan.paths,out,preserved.excludedP3Paths);
  if(!bytes(out+'/stage-paths.nul').equals(Buffer.from(plan.ordinary.map(r=>r.path).join('\0')+'\0')))throw Error('PATHSPEC_NOT_BOUND_TO_PLAN');
  git(['add','-f','--pathspec-from-file='+resolve(repo,out,'stage-paths.nul'),'--pathspec-file-nul']);
  for(const r of plan.masters){const oid=git(['hash-object','-w','--stdin'],bytes(r.readFrom)).toString().trim();if(oid!==r.oid)throw Error('MASTER_OID');git(['update-index','--add','--cacheinfo',r.gitMode+','+oid+','+r.path])}
  exact(indexNames(),plan.paths);const result=proof(rows);put(out,'feature-stage-readback.json',JSON.stringify({at:new Date().toISOString(),parent:plan.parent,...result,mastersStillIncludeUncommittedP3:true},null,2)+'\n');console.log(JSON.stringify(result));
 }else if(mode==='verify-commit'){
  if(!commit||head()!==commit)throw Error('EXPLICIT_CURRENT_COMMIT_REQUIRED');gitIdentity(commit);
  const parents=git(['rev-list','--parents','-n','1',commit]).toString().trim().split(' ');if(parents.length!==2||parents[1]!==plan.parent)throw Error('COMMIT_PARENT_CHANGED');
  exact(git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split('\0').filter(Boolean),plan.paths);
  const result=proof(rows,commit);if(indexNames().length)throw Error('INDEX_NOT_EMPTY');
  for(const r of plan.ordinary){const n=ident(r.path);if(n.sha256!==r.sha256||n.mode!==r.mode)throw Error('DISK_CHANGED:'+r.path)}
  for(const r of plan.masters){const n=ident(r.path);if(n.sha256!==r.workingIdentity.sha256||n.mode!==r.workingIdentity.mode)throw Error('P3_WORKING_MASTER_CHANGED')}
  put(out,'feature-commit-readback.json',JSON.stringify({at:new Date().toISOString(),featureCommit:commit,parent:plan.parent,...result,ordinaryDiskByteSame:plan.ordinary.length,selectiveMasters:3,indexEmpty:true,mastersPreservedUncommittedP3:true},null,2)+'\n');console.log(JSON.stringify(result));
 }else throw Error('EXPLICIT prepare|stage|verify-commit REQUIRED');
}
