import fs from 'node:fs';
import {resolve} from 'node:path';
import {repo,tree,ident,hash,json,git,put,verifySeal,blobOid,proof} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';

export const root='goal-1/evidence/t17-acceptance-36';
export const post='goal-1/evidence/t17-u0r-post-commit-01';
const base=json(root+'/baseline.json'),feature=json(root+'/feature-commit-proof-r10.json');
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const same=(a,b)=>!!a&&!!b&&['path','bytes','sha256','mode'].every(k=>a[k]===b[k]);
const read=p=>fs.readFileSync(resolve(repo,p));
const exact=(a,b)=>{if(!eq([...a].sort(),[...b].sort())||new Set(a).size!==a.length)throw Error('EXACT_SET_REQUIRED');};
const canonical=t=>({files:[...t.files].sort((a,b)=>a.path.localeCompare(b.path)),directories:[...t.directories].sort(),directoryModes:[...t.directoryModes].sort((a,b)=>a.path.localeCompare(b.path))});
export const head=()=>git(['rev-parse','HEAD']).toString().trim();
const staged=()=>git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean);
export const write=(out,name,v)=>put(out,name,JSON.stringify(v,null,2)+'\n');
export function identity(expected){
 const actual={head:head(),branch:git(['branch','--show-current']).toString().trim(),remote:git(['remote','get-url','origin']).toString().trim()};
 if(expected&&actual.head!==expected||actual.branch!==base.branch||actual.remote!==base.remote)throw Error('REPOSITORY_IDENTITY_DRIFT');
 return actual;
}
export function source(){
 const frozen=json(root+'/u0r-build-r10.source-before.json');
 const now=[...tree('src').files,...tree('assets').files,...tree('public').files,...['package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.core.json','tsconfig.node.json','vite.config.ts','vitest.config.ts','index.html'].map(ident)].sort((a,b)=>a.path.localeCompare(b.path));
 exact(now.map(r=>r.path),frozen.files.map(r=>r.path));const map=new Map(now.map(r=>[r.path,r]));
 for(const r of frozen.files)if(!same(map.get(r.path),r))throw Error('R10_SOURCE_DRIFT:'+r.path);
 for(const r of frozen.extra)if(!same(ident(r.path),r))throw Error('R10_EXTRA_DRIFT:'+r.path);
 const rows=json(root+'/owned-ui-r10.json').rows;
 if(rows.length!==28)throw Error('EXPECTED_28_UI');
 for(const r of rows)if(!same(ident(r.path),r))throw Error('FEATURE_WORKING_DRIFT');
 const changed=git(['diff-tree','--no-commit-id','--name-only','-r','-z',feature.commit]).toString().split('\0').filter(Boolean);
 exact(changed,rows.map(r=>r.path));
 if(git(['rev-parse',feature.commit+'^']).toString().trim()!==base.head)throw Error('FEATURE_PARENT_DRIFT');
 return {files:now.length,extra:frozen.extra.length,feature:feature.commit,featureProof:proof(rows,feature.commit),sourceAuthority:ident(root+'/u0r-build-r10.source-before.json')};
}
export function masters(){
 const own=json(root+'/owned-master-suffixes-r5.json');
 return base.masters.map(r=>{
  const before=read(r.privatePreimage.path),prior=git(['cat-file','blob',base.head+':'+r.path]),current=read(r.path),a=r.p3Insertion.offset;
  if(hash(before)!==r.sha256||before.length!==r.bytes||hash(prior)!==r.headSha256||prior.length!==r.headBytes)throw Error('MASTER_BASELINE_DRIFT');
  const insert=before.subarray(a,a+2304),entry=own.entries.find(e=>e.path===r.path),suffix=Buffer.from(entry.suffix);
  if(hash(insert)!=='d6d2ae77cb0e8dadcee47df146d712a82dbfa4a278a2de9cec3a3a5564610655'||insert.filter(x=>x===10).length!==14||before.indexOf(insert)!==a||before.indexOf(insert,a+1)!==-1)throw Error('P3_INSERT_IDENTITY');
  if(!Buffer.concat([before.subarray(0,a),before.subarray(a+2304)]).equals(prior)||!Buffer.concat([before,suffix]).equals(current)||hash(current)!==entry.currentSha256||entry.beforeSha256!==r.sha256||entry.headSha256!==r.headSha256)throw Error('MASTER_APPEND_ONLY_OWNED_SUFFIX');
  const intended=Buffer.concat([prior,suffix]);
  if(intended.includes(insert)||!Buffer.concat([current.subarray(0,a),current.subarray(a+2304)]).equals(intended))throw Error('P3_WORKTREE_ONLY');
  return {path:r.path,intended,bytes:intended.length,sha256:hash(intended),oid:blobOid(intended),gitMode:r.gitMode,working:ident(r.path),suffixBytes:suffix.length,p3:r.p3Insertion};
 });
}
export function preserve(){
 for(const r of base.p3)if(!same(ident(r.path),r))throw Error('P3_CHANGED:'+r.path);
 if(base.p3.length!==26||!same(ident('goal-1/input.md'),base.originalInput)||!same(ident(base.unverifiedWip.path),base.unverifiedWip))throw Error('INPUT_OR_UNVERIFIED_WIP_CHANGED');
 const authority=base.root19.authority;if(!same(ident(authority.path),authority))throw Error('ROOT19_AUTHORITY_CHANGED');
 const r19=tree('goal-1/evidence/t17-acceptance-19'),r35=tree('goal-1/evidence/t17-acceptance-35');
 if(!eq(canonical(r19),canonical(json(authority.path)))||r19.files.length!==1197||r19.directories.length!==110)throw Error('ROOT19_CHANGED');
 if(!eq(canonical(r35),canonical(base.previousUnsealedRoot35)))throw Error('ROOT35_CHANGED');
 const regular=[],links=[];
 function walk(p){if(p===root||p===post)return;const s=fs.lstatSync(resolve(repo,p));if(s.isSymbolicLink()){if(p.endsWith('/sealed-evidence.json'))links.push(p);return;}if(s.isDirectory())for(const n of fs.readdirSync(resolve(repo,p)).sort())walk(p+'/'+n);else if(p.endsWith('/sealed-evidence.json'))regular.push(p);}
 walk('goal-1/evidence');exact(regular,base.seals.map(r=>r.path));exact(links,base.markerSymlinks.map(r=>r.path));
 for(const r of base.seals)if(!same(ident(r.path),r))throw Error('OLD_MARKER_CHANGED');
 for(const r of base.markerSymlinks){const s=fs.lstatSync(resolve(repo,r.path));if(!s.isSymbolicLink()||fs.readlinkSync(resolve(repo,r.path))!==r.target||s.size!==Buffer.byteLength(r.target)||(r.mode!==undefined&&(s.mode&511)!==r.mode))throw Error('OLD_SYMBOLIC_MARKER_CHANGED');}
 const last=base.lastSealed.map(r=>{const actual=verifySeal(r.root);if(!same(actual.marker,r.marker)||actual.ordinaryFiles!==r.ordinaryFiles||actual.directories!==r.directories)throw Error('OLD_SEALED_PAYLOAD_CHANGED');return actual;});
 return {p3:26,input:ident('goal-1/input.md'),unverifiedRecordModel:ident(base.unverifiedWip.path),root19:{files:r19.files.length,directories:r19.directories.length,exactTree:true},root35:{files:r35.files.length,exactTree:true},oldMarkers:regular.length,symbolicMarkers:links.length,last,masterP3:masters().map(({intended,...r})=>r)};
}
export function seal(target){
 if(target!==root&&target!==post)throw Error('ONLY_CURRENT_ROOT_OR_POST');
 guard(resolve(repo,target));source();preserve();const a=tree(target),b=tree(target);if(!eq(a,b))throw Error('WRITERS_NOT_STOPPED');
 put(target,'sealed-evidence.json',JSON.stringify({format:'t17-u0r-exact-bytes-v1',at:new Date().toISOString(),selfExcluded:'sealed-evidence.json',scope:target===root?'U0-R local feature already committed; limited task completion and record intent. Whole goal/human/PNG remain open.':'Actual U0-R record commit readback and parent-guard refusals; this post commit itself is verified after commit.',...a},null,2)+'\n');return verifySeal(target);
}
export function prepareRecord(){
 identity(feature.commit);if(staged().length)throw Error('EMPTY_INDEX_REQUIRED');const src=source(),preserved=preserve();
 const out='.delivery/t17-u0r-record-intended';if(fs.existsSync(resolve(repo,out)))throw Error('FRESH_PRIVATE_MASTER_OUTPUT_REQUIRED');fs.mkdirSync(resolve(repo,out));
 const plan=masters().map(({intended,...r})=>{const readFrom=out+'/'+r.path.split('/').at(-1)+'.txt';fs.writeFileSync(resolve(repo,readFrom),intended,{flag:'wx'});return {...r,readFrom};});
 const ordinaryDocs=['AGENTS.md','docs/36-mainline-and-art-reconstruction-plan.md'];
 write(root+'/closeout-r1','record-intent.json',{at:new Date().toISOString(),parent:feature.commit,masters:plan,ordinaryDocs,docIdentities:ordinaryDocs.map(ident),source:src,preservation:preserved,wholeGoal:false,goalStatus:'active',compatibility:0,push:false});
 return {masters:plan.length,source:src,preservation:preserved};
}
function recordRows(){
 const intent=json(root+'/closeout-r1/record-intent.json');
 const paths=[...tree(root).files.map(r=>r.path),root+'/sealed-evidence.json',...intent.ordinaryDocs].sort();
 for(const r of intent.docIdentities)if(!same(ident(r.path),r))throw Error('DOC_INTENT_DRIFT');
 const rows=paths.map(path=>({...ident(path),oid:blobOid(read(path))}));
 for(const r of intent.masters)if(!same(ident(r.path),r.working)||hash(read(r.readFrom))!==r.sha256||blobOid(read(r.readFrom))!==r.oid)throw Error('MASTER_INTENT_DRIFT');
 return {intent,rows:[...rows,...intent.masters]};
}
export function stageRecord(){
 const sealed=verifySeal(root),{intent,rows}=recordRows();identity(intent.parent);if(staged().length)throw Error('EMPTY_INDEX_REQUIRED');source();preserve();
 const ordinary=rows.filter(r=>!intent.masters.some(m=>m.path===r.path));
 git(['add','-f','--',...ordinary.map(r=>r.path)]);
 for(const r of intent.masters){const oid=git(['hash-object','-w','--no-filters','--',r.readFrom]).toString().trim();if(oid!==r.oid)throw Error('MASTER_BLOB_IDENTITY');git(['update-index','--add','--cacheinfo',r.gitMode+','+oid+','+r.path]);}
 exact(staged(),rows.map(r=>r.path));return {sealed,paths:rows.length,...proof(rows)};
}
export function verifyRecord(commit){
 const sealed=verifySeal(root),{intent,rows}=recordRows();identity(commit);if(git(['rev-parse',commit+'^']).toString().trim()!==intent.parent)throw Error('RECORD_PARENT');
 exact(git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split('\0').filter(Boolean),rows.map(r=>r.path));if(staged().length)throw Error('INDEX_NOT_EMPTY');
 return {commit,parent:intent.parent,sealed,...proof(rows,commit),source:source(),preservation:preserve(),push:false};
}
