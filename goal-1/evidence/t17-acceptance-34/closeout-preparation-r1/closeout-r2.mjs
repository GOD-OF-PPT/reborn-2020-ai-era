import fs from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {repo,tree,ident,hash,json,git,put,verifySeal,blobOid,proof} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';

export const root='goal-1/evidence/t17-acceptance-34',post='goal-1/evidence/t17-cux06-post-commit-01';
const base=json(root+'/baseline.json'),own=json(root+'/owned-master-suffixes.json');
const docs=['AGENTS.md','docs/36-mainline-and-art-reconstruction-plan.md'];
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const same=(a,b)=>['path','bytes','sha256','mode'].every(k=>a[k]===b[k]);
const exact=(a,b,why)=>{if(!eq([...a].sort(),[...b].sort())||new Set(a).size!==a.length)throw Error(why);};
const read=p=>fs.readFileSync(resolve(repo,p));
const write=(out,name,value)=>put(out,name,JSON.stringify(value,null,2)+'\n');
const head=()=>git(['rev-parse','HEAD']).toString().trim();
const staged=()=>git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean);
const canonical=t=>({files:[...t.files].sort((a,b)=>a.path.localeCompare(b.path)),directories:[...t.directories].sort(),directoryModes:[...t.directoryModes].sort((a,b)=>a.path.localeCompare(b.path))});
function row(path,data){const i=ident(path),b=data??read(path);return {...i,bytes:b.length,sha256:hash(b),oid:blobOid(b)};}
export function identity(expected=base.head){
 const current={head:head(),branch:git(['branch','--show-current']).toString().trim(),remote:git(['remote','get-url','origin']).toString().trim()};
 if(current.head!==expected||current.branch!==base.branch||!/github\.com[:/]GOD-OF-PPT\/reborn-2020-ai-era(?:\.git)?$/.test(current.remote))throw Error('REPOSITORY_IDENTITY_CHANGED');
 return current;
}
export function sourceScope(){
 const binding=root+'/cux06-build-r2.source-before.json',frozen=json(binding),current=[...tree('src').files,...tree('assets').files,...tree('public').files,...['package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.core.json','tsconfig.node.json','vite.config.ts','vitest.config.ts','index.html'].map(ident)].sort((a,b)=>a.path.localeCompare(b.path));
 exact(current.map(r=>r.path),frozen.files.map(r=>r.path),'FINAL_SOURCE_EXACT_SET');
 const map=new Map(current.map(r=>[r.path,r]));for(const r of frozen.files)if(!same(map.get(r.path),r))throw Error('FINAL_SOURCE_DRIFT:'+r.path);
 for(const r of frozen.extra)if(!same(ident(r.path),r))throw Error('FINAL_EXTRA_REFERENCE_DRIFT:'+r.path);
 const prior=new Map(base.sourceAndAssets.map(r=>[r.path,r]));
 if(base.sourceAndAssets.some(r=>!map.has(r.path)))throw Error('SOURCE_REMOVAL');
 const changed=current.filter(r=>!prior.has(r.path)||!same(r,prior.get(r.path))).map(r=>r.path);
 if(changed.some(p=>!p.startsWith('src/ui/')))throw Error('NON_UI_SOURCE_ASSET_CONFIG_DELTA');
 return {binding:ident(binding),count:current.length,extraCount:frozen.extra.length,uiPaths:changed.sort(),files:current};
}
export function masterPlans(){if(base.masters.length!==3)throw Error('EXPECTED_THREE_MASTERS');return base.masters.map(r=>{
 const original=read(root+'/'+r.path.split('/').at(-1)+'.baseline'),originalHead=git(['cat-file','blob',base.head+':'+r.path]),current=read(r.path),a=r.p3Insertion.offset;
 if(original.length!==r.bytes||hash(original)!==r.sha256||originalHead.length!==r.headBytes||hash(originalHead)!==r.headSha256)throw Error('MASTER_BASELINE_DRIFT');
 const insert=original.subarray(a,a+2304);
 if(hash(insert)!=='d6d2ae77cb0e8dadcee47df146d712a82dbfa4a278a2de9cec3a3a5564610655'||insert.filter(x=>x===10).length!==14||original.indexOf(insert)!==a||original.indexOf(insert,a+1)!==-1)throw Error('P3_UNIQUE_ORIGINAL_INSERT_REQUIRED');
 if(!Buffer.concat([original.subarray(0,a),original.subarray(a+2304)]).equals(originalHead)||!current.subarray(0,original.length).equals(original)||ident(r.path).mode!==r.mode)throw Error('MASTER_APPEND_ONLY_REQUIRED');
 const suffix=current.subarray(original.length),entry=own.entries.find(e=>e.path===r.path),owned=Buffer.from(entry.suffix);
 if(!suffix.subarray(0,owned.length).equals(owned)||entry.beforeSha256!==r.sha256||entry.headSha256!==r.headSha256)throw Error('OWN_REGISTERED_PREFIX_REQUIRED');
 const intended=Buffer.concat([originalHead,suffix]);
 if(intended.includes(insert)||current.indexOf(insert)!==a||current.indexOf(insert,a+1)!==-1||!Buffer.concat([current.subarray(0,a),current.subarray(a+2304)]).equals(intended))throw Error('P3_MUST_STAY_WORKTREE_ONLY');
 return {path:r.path,working:ident(r.path),suffixBytes:suffix.length,ownedPrefixBytes:owned.length,p3:{offset:a,bytes:insert.length,sha256:hash(insert),lf:14},intended,intendedIdentity:row(r.path,intended)};
 });}
export function preserve(){
 for(const r of base.p3)if(!same(ident(r.path),r))throw Error('P3_CHANGED:'+r.path);
 if(base.p3.length!==26)throw Error('EXPECTED_26_P3');
 const root19Anchor=ident(base.root19.baseline);if(root19Anchor.sha256!==base.root19.baselineSha256)throw Error('ROOT19_BASELINE_ANCHOR_DRIFT');
 const authority=json(base.root19.baseline).root19,actual=tree('goal-1/evidence/t17-acceptance-19');
 if(!eq(canonical(actual),canonical(authority))||actual.files.length!==1197||actual.directories.length!==110)throw Error('ROOT19_EXACT_TREE_DRIFT');
 const regular=[],links=[];
 function walk(p){if(p===root||p===post)return;const s=fs.lstatSync(resolve(repo,p));if(s.isSymbolicLink()){if(p.endsWith('/sealed-evidence.json'))links.push(p);return;}if(s.isDirectory()){for(const n of fs.readdirSync(resolve(repo,p)).sort())walk(p+'/'+n);}else if(p.endsWith('/sealed-evidence.json')){if(!s.isFile())throw Error('ORDINARY_MARKER_REQUIRED');regular.push(p);}}
 if(base.seals.length!==122||base.markerSymlinks.length!==2)throw Error('EXPECTED_122_ORDINARY_AND_TWO_SYMBOLIC_MARKERS');
 walk('goal-1/evidence');exact(regular,base.seals.map(r=>r.path),'OLD_MARKER_EXACT_SET');exact(links,base.markerSymlinks.map(r=>r.path),'SYMBOLIC_MARKER_EXACT_SET');
 for(const r of base.seals)if(!same(ident(r.path),r))throw Error('OLD_MARKER_DRIFT:'+r.path);
 const literalLinks=base.markerSymlinks.map(r=>{const s=fs.lstatSync(resolve(repo,r.path)),target=fs.readlinkSync(resolve(repo,r.path));if(!s.isSymbolicLink()||target!==r.target||s.size!==Buffer.byteLength(target)||(r.mode!==undefined&&(s.mode&511)!==r.mode))throw Error('SYMBOLIC_MARKER_LITERAL_DRIFT');return {path:r.path,target,bytes:s.size,mode:s.mode&511};});
 const last=base.lastSealed.map(r=>{const v=verifySeal(r.root);if(!same(v.marker,r.marker)||v.ordinaryFiles!==r.ordinaryFiles||v.directories!==r.directories)throw Error('LAST_SEAL_PAYLOAD_DRIFT');return v;});
 if(!same(ident('goal-1/input.md'),base.originalInput)||base.originalInput.bytes!==61||base.originalInput.sha256!=='20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1')throw Error('ORIGINAL_INPUT_DRIFT');
 const index=git(['ls-files','--stage','-z']).toString().split('\0').filter(Boolean),prior=git(['ls-tree','-rz',base.head]).toString().split('\0').filter(Boolean);
 for(const r of base.p3){const a=index.find(x=>x.slice(x.indexOf('\t')+1)===r.path),b=prior.find(x=>x.slice(x.indexOf('\t')+1)===r.path);if(!b){if(a)throw Error('UNTRACKED_P3_STAGED:'+r.path);}else{const [mode,,oid]=b.slice(0,b.indexOf('\t')).split(' ');if(a!==mode+' '+oid+' 0\t'+r.path)throw Error('TRACKED_P3_INDEX_DRIFT:'+r.path);}}
 return {p3:26,root19:{files:1197,directories:110},oldMarkers:regular.length,markerSymlinks:literalLinks,last,input:ident('goal-1/input.md'),masters:masterPlans().map(({intended,...m})=>m),limit:'Old ordinary marker exact set/bytes/mode; symbolic literal target bytes and baseline-recorded modes. Root19 exact payload bound to original baseline SHA; full payload otherwise checked only last two sealed roots.'};
}
export function prepare(){
 identity();if(staged().length)throw Error('INDEX_MUST_BE_EMPTY');const preserved=preserve(),source=sourceScope();
 if(fs.existsSync(resolve(repo,post)))throw Error('FRESH_POST_REQUIRED');
 for(const p of ['goal-1','goal-1/evidence']){const s=fs.lstatSync(resolve(repo,p));if(!s.isDirectory()||s.isSymbolicLink()||fs.existsSync(resolve(repo,p,'sealed-evidence.json')))throw Error('POST_PARENT_NOT_WRITABLE');}
 fs.mkdirSync(resolve(repo,post));guard(resolve(repo,post));write(post,'pre-feature-binding.json',{at:new Date().toISOString(),identity:identity(),source,preserved});
 return {prepared:true,ui:source.uiPaths.length,sourceCount:source.count,post};
}
export function seal(target){
 if(target!==root&&target!==post)throw Error('ONLY_OWN_ROOT_OR_POST');guard(resolve(repo,target));preserve();sourceScope();const a=tree(target),b=tree(target);if(!eq(a,b))throw Error('WRITERS_NOT_STOPPED');
 put(target,'sealed-evidence.json',JSON.stringify({format:'t17-cux06-exact-bytes-v1',at:new Date().toISOString(),selfExcluded:'sealed-evidence.json',scope:target===root?'C-UX06 cumulative checkpoint precommit evidence only; human and whole goal acceptance remain open':'C-UX06 actual feature readback and limited completion record intent; record independently read after commit',...a},null,2)+'\n');return verifySeal(target);
}
export function stageFeature(){
 identity();if(staged().length)throw Error('INDEX_MUST_BE_EMPTY');preserve();const source=sourceScope(),seal=verifySeal(root),paths=[...source.uiPaths,...docs,...tree(root).files.map(r=>r.path),root+'/sealed-evidence.json'].sort();
 const allowed=new Set([...paths,...base.masters.map(r=>r.path),...base.p3.map(r=>r.path),...tree('goal-1/evidence/t17-acceptance-19').files.map(r=>r.path)]);
 for(const line of git(['status','--porcelain=v1','-z','--untracked-files=all']).toString().split('\0').filter(Boolean)){const p=line.slice(3);if(/[RC]/.test(line.slice(0,2))||!allowed.has(p)&&!p.startsWith(post+'/'))throw Error('UNACCOUNTED_STATUS:'+line);}
 const rows=paths.map(p=>row(p));write(post,'feature-stage-intent.json',{at:new Date().toISOString(),parent:base.head,seal,uiPaths:source.uiPaths,docs,rows,mastersExcluded:true});put(post,'feature-paths.nul',Buffer.from(paths.join('\0')+'\0'));
 git(['add','-f','--pathspec-from-file='+post+'/feature-paths.nul','--pathspec-file-nul']);exact(staged(),paths,'FEATURE_EXACT_STAGE_SET');const result=proof(rows);write(post,'feature-stage-readback.json',{at:new Date().toISOString(),...result});return result;
}
export function commitFeature(){
 const intent=json(post+'/feature-stage-intent.json');identity(intent.parent);exact(staged(),intent.rows.map(r=>r.path),'FEATURE_EXACT_STAGE_SET');proof(intent.rows);preserve();sourceScope();verifySeal(root);for(const row of intent.rows)if(!same(ident(row.path),row))throw Error('FEATURE_WORKING_DRIFT_BEFORE_COMMIT');guard(resolve(repo,post));
 const argv=['rtk','proxy','git','commit','-m','fix(ui): align course preparation state and material for C-UX06'],started=new Date().toISOString(),r=spawnSync(argv[0],argv.slice(1),{cwd:repo,maxBuffer:32*1024*1024});
 put(post,'feature-commit.stdout.txt',r.stdout??Buffer.alloc(0));put(post,'feature-commit.stderr.txt',r.stderr??Buffer.alloc(0));write(post,'feature-commit-command.json',{argv,started,finished:new Date().toISOString(),exitCode:r.status,signal:r.signal});if(r.status!==0)throw Error('FEATURE_COMMIT_FAILED');
 const commit=head();if(git(['rev-parse',commit+'^']).toString().trim()!==intent.parent)throw Error('FEATURE_PARENT');exact(git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split('\0').filter(Boolean),intent.rows.map(r=>r.path),'FEATURE_COMMIT_SET');const result=proof(intent.rows,commit);for(const row of intent.rows)if(!same(ident(row.path),row))throw Error('FEATURE_WORKING_DRIFT');if(staged().length)throw Error('INDEX_NOT_EMPTY');
 write(post,'feature-commit-readback.json',{at:new Date().toISOString(),commit,parent:intent.parent,...result,seal:verifySeal(root),push:false});return {commit,...result};
}
export function prepareRecord(){
 const feature=json(post+'/feature-commit-readback.json');identity(feature.commit);if(staged().length)throw Error('INDEX_MUST_BE_EMPTY');preserve();sourceScope();verifySeal(root);proof(json(post+'/feature-stage-intent.json').rows,feature.commit);
 const masters=[];for(const p of masterPlans()){if(p.suffixBytes<=p.ownedPrefixBytes)throw Error('COMPLETION_APPENDIX_REQUIRED');if(hash(git(['cat-file','blob',feature.commit+':'+p.path]))!==base.masters.find(r=>r.path===p.path).headSha256)throw Error('FEATURE_INCLUDED_MASTER_SUFFIX');const name=p.path.split('/').at(-1)+'.record-intended.txt';put(post,name,p.intended);masters.push({...p.intendedIdentity,readFrom:post+'/'+name,working:p.working,p3:p.p3,suffixBytes:p.suffixBytes});}
 write(post,'record-intent.json',{at:new Date().toISOString(),parent:feature.commit,masters,goalStatus:'active',compatibility:0,push:false});const ordinary=[...tree(post).files.map(r=>r.path),post+'/record-ordinary-paths.nul',post+'/sealed-evidence.json'].sort();put(post,'record-ordinary-paths.nul',Buffer.from(ordinary.join('\0')+'\0'));return {masters:3,postMustStopWriters:true,p3WorktreeOnly:true};
}
function recordRows(){const intent=json(post+'/record-intent.json'),paths=[...tree(post).files.map(r=>r.path),post+'/sealed-evidence.json'].sort();exact(read(post+'/record-ordinary-paths.nul').toString().split('\0').filter(Boolean),paths,'RECORD_NUL_EXACT_SET');for(const r of intent.masters)if(!same(ident(r.path),r.working)||hash(read(r.readFrom))!==r.sha256)throw Error('RECORD_MASTER_DRIFT');return {intent,rows:[...paths.map(p=>row(p)),...intent.masters]};}
export function stageRecord(){
 const seal=verifySeal(post),{intent,rows}=recordRows();identity(intent.parent);if(staged().length)throw Error('INDEX_MUST_BE_EMPTY');preserve();sourceScope();verifySeal(root);
 git(['add','-f','--pathspec-from-file='+post+'/record-ordinary-paths.nul','--pathspec-file-nul']);for(const r of intent.masters){const oid=git(['hash-object','-w','--no-filters','--',r.readFrom]).toString().trim();if(oid!==r.oid)throw Error('MASTER_OID');git(['update-index','--add','--cacheinfo',r.gitMode+','+oid+','+r.path]);}exact(staged(),rows.map(r=>r.path),'RECORD_EXACT_STAGE_SET');return {seal,...proof(rows)};
}
export function verifyRecord(commit){
 const rootSeal=verifySeal(root),seal=verifySeal(post),{intent,rows}=recordRows();identity(commit);if(git(['rev-parse',commit+'^']).toString().trim()!==intent.parent)throw Error('RECORD_PARENT');exact(git(['diff-tree','--no-commit-id','--name-only','-r','-z',commit]).toString().split('\0').filter(Boolean),rows.map(r=>r.path),'RECORD_COMMIT_SET');if(staged().length)throw Error('INDEX_NOT_EMPTY');const result=proof(rows,commit);preserve();sourceScope();if(!eq(rootSeal,verifySeal(root)))throw Error('ROOT_PAYLOAD_DRIFT_DURING_RECORD_READBACK');return {commit,parent:intent.parent,rootSeal,seal,...result,mastersWorkingRetainP3:true,push:false};
}
export function cliProbes(){
 guard(resolve(repo,post));const before=verifySeal(root),results=[];
 for(const r of [{name:'collector',target:root+'/guard-collector-probe',argv:['node','--experimental-strip-types','scripts/collect_course_evidence.ts','--output-dir',root+'/guard-collector-probe']},{name:'auditor',target:root+'/guard-auditor-probe',argv:['env','NATIVE_EXPORT_INPUT_DIRECTORY='+root,'node','--experimental-strip-types','scripts/verify_normal_browser_exports.ts','--output-dir',root+'/guard-auditor-probe']}]){
  if(fs.existsSync(resolve(repo,r.target)))throw Error('ABSENT_PROBE_TARGET_REQUIRED');const started=new Date().toISOString(),p=spawnSync('rtk',['proxy',...r.argv],{cwd:repo,maxBuffer:16*1024*1024});put(post,'guard-'+r.name+'.stdout.txt',p.stdout??Buffer.alloc(0));put(post,'guard-'+r.name+'.stderr.txt',p.stderr??Buffer.alloc(0));const absent=!fs.existsSync(resolve(repo,r.target)),rejected=p.status===1&&String(p.stdout).concat(String(p.stderr)).includes('IMMUTABLE_EVIDENCE_PARENT_USE_NEW_SIBLING')&&absent;results.push({...r,started,finished:new Date().toISOString(),exitCode:p.status,signal:p.signal,targetAbsent:absent,rejectedBeforeOutput:rejected});if(!rejected)throw Error('CLI_PARENT_GUARD_REJECTION_REQUIRED');
 }
 const after=verifySeal(root);if(!eq(before,after))throw Error('SEALED_PAYLOAD_CHANGED');write(post,'cli-parent-guard.json',{at:new Date().toISOString(),results,sealBefore:before,sealAfter:after});return {results:2,exactReadbackEqual:true};
}
