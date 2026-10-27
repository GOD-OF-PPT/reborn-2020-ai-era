import fs from 'node:fs';import path from 'node:path';
import {tree,ident,json,hash,git,verifySeal,blobOid,proof} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';
export const root='goal-1/evidence/t17-acceptance-38',base='bf783d3992aa2c2810cd87e0f1b2e50232a5260e',out=root+'/closeout-r28';
export const same=(a,b)=>['bytes','sha256','mode'].every(k=>a[k]===b[k]);
export function put(name,v,dir=out){guard(path.resolve(dir));fs.writeFileSync(dir+'/'+name,JSON.stringify(v,null,2)+'\n',{flag:'wx'});}
export function readiness(){
 const b=json(root+'/baseline.json'),ad=json(root+'/source-admission-r23/result.json');
 for(const e of b.p3)if(!same(ident(e.path),e))throw Error('P3_CHANGED:'+e.path);
 if(!same(ident('goal-1/input.md'),b.originalInput))throw Error('INPUT_CHANGED');
 for(const e of b.oldSeals)if(!same(ident(e.path),e))throw Error('OLD_MARKER_CHANGED:'+e.path);
 for(const e of b.markerSymlinks){const st=fs.lstatSync(e.path);if(!st.isSymbolicLink()||fs.readlinkSync(e.path)!==e.target||(st.mode&0o777)!==e.mode)throw Error('OLD_SYMLINK_CHANGED');}
 const old19=json('goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/root19-preparation-tree.json'),now19=tree('goal-1/evidence/t17-acceptance-19'),old35=json('goal-1/evidence/t17-acceptance-37/baseline.json').previousUnsealedRoot35,now35=tree('goal-1/evidence/t17-acceptance-35');
 if(JSON.stringify(old19)!==JSON.stringify(now19)||JSON.stringify(old35)!==JSON.stringify(now35))throw Error('OLD_UNSEALED_TREE_CHANGED');
 const seals=b.lastSealed.map(e=>verifySeal(e.root));for(let i=0;i<seals.length;i++)if(!same(seals[i].marker,b.lastSealed[i].marker))throw Error('OLD_PAYLOAD_CHANGED');
 const cfg=b.sourceAndAssets.filter(e=>!e.path.startsWith('src/')&&!e.path.startsWith('assets/')&&!e.path.startsWith('public/')).map(e=>e.path);
 const current=[...tree('src').files,...tree('assets').files,...tree('public').files,...cfg.map(ident)].sort((a,b)=>a.path.localeCompare(b.path)),built=json(root+'/u5-build-r15.source-after.json').files;
 if(current.length!==651||current.length!==built.length||current.some((e,i)=>e.path!==built[i].path||!same(e,built[i])))throw Error('FINAL_BUILD_SOURCE_MISMATCH');
 const old=new Map(b.sourceAndAssets.map(e=>[e.path,e])),allowed=new Set([...ad.changedUi,...ad.addedUi,...ad.addedAssets].map(e=>e.path));
 for(const e of current){const prev=old.get(e.path);if(!prev||!same(prev,e)){if(!allowed.has(e.path))throw Error('UNOWNED_SOURCE_CHANGE:'+e.path);}old.delete(e.path);}if(old.size)throw Error('SOURCE_REMOVAL');
 for(const e of [...ad.changedUi,...ad.addedUi,...ad.addedAssets,...ad.requiredNewTestFixtures])if(!same(ident(e.path),e))throw Error('OWNED_IDENTITY_CHANGED:'+e.path);
 for(const e of b.masters){const pre=fs.readFileSync(e.privatePreimage.path),head=git(['show',base+':'+e.path]),p=e.p3Insertion,block=pre.subarray(p.offset,p.offset+p.bytes),without=Buffer.concat([pre.subarray(0,p.offset),pre.subarray(p.offset+p.bytes)]),work=fs.readFileSync(e.path);if(hash(pre)!==e.sha256||hash(head)!==e.headSha256||hash(block)!==p.sha256||!without.equals(head)||!work.subarray(0,pre.length).equals(pre))throw Error('MASTER_BASE_OR_P3_INSERT_CHANGED:'+e.path);}
 const repo=json(out+'/repository.json');if(repo.visibility!=='PUBLIC'||repo.owner.login!=='GOD-OF-PPT'||git(['branch','--show-current']).toString().trim()!==b.branch||git(['remote','get-url','origin']).toString().trim()!==b.remote)throw Error('REPOSITORY_CHANGED');
 for(const name of ['type-r54-end-and-global-protection','u5-build-r15','checks-r52-original-end-and-protection','checks-r55-original-complete-moment','full-create-final-r26','docs-python-r27','docs-plan-r27','docs-competitive-r27','content-r27']){const d=json(root+'/'+name+'.result.json');if(d.exitCode!==0||d.sourceUnchanged!==true||d.runnerUnchanged!==true)throw Error('REQUIRED_CHECK_NOT_PASS:'+name);}
 for(const n of ['full-create-audit-r14','native-full-create-audit-r16','full-create-audit-r22','full-create-final-r26'])if(json(root+'/'+n+'/normal-browser-export-audit.json').allByteEqual!==true)throw Error('CREATE_AUDIT_NOT_PASS');
 const feature=[...ad.changedUi,...ad.addedUi,...ad.addedAssets,...ad.requiredNewTestFixtures].map(e=>ident(e.path)).concat(['AGENTS.md','docs/36-mainline-and-art-reconstruction-plan.md'].map(ident)).sort((a,b)=>a.path.localeCompare(b.path));if(feature.length!==55||new Set(feature.map(e=>e.path)).size!==55||feature.some(e=>b.p3.some(p=>p.path===e.path)))throw Error('FEATURE_SCOPE');
 return {at:new Date().toISOString(),base,head:git(['rev-parse','HEAD']).toString().trim(),sourceCount:651,feature,p3Exact:26,originalInputExact:true,oldMarkers:126,symbolicMarkers:2,root19:{files:now19.files.length,directories:now19.directories.length},root35:{files:now35.files.length,directories:now35.directories.length},sealedPayloads:seals,allRequiredChecksPass:true,wholeGlobalDocsPass:false,bareHeadStandaloneAccepted:false,compatibility:0,goalComplete:false};
}
export function rowWithOid(e,b=fs.readFileSync(e.path)){return {...e,oid:blobOid(b)}}
export {git,tree,ident,json,hash,blobOid,proof};
