import {readFileSync,writeFileSync,readdirSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {assertBrowserEvidenceWritable} from '../../../../../scripts/browser_evidence_guard.mjs';

const out='goal-1/evidence/t17-acceptance-32/http-r6/recheck-r2';
const build='.delivery/t17-u3c2-r6',baseUrl='http://127.0.0.1:5370/';
const authorityPath='goal-1/evidence/t17-acceptance-32/build-r6.source-after.json';
const buildResultPath='goal-1/evidence/t17-acceptance-32/build-r6.result.json';
const started=new Date().toISOString();
const hash=body=>createHash('sha256').update(body).digest('hex');
const write=(name,body)=>{assertBrowserEvidenceWritable(out);writeFileSync(out+'/'+name,JSON.stringify(body,null,2)+'\n',{flag:'wx'});};
const identify=path=>{const stat=lstatSync(path);if(stat.isSymbolicLink()||!stat.isFile())throw Error('REGULAR_FILE_REQUIRED:'+path);const body=readFileSync(path);return {path,bytes:body.length,sha256:hash(body),mode:stat.mode&0o777};};
function tree(root){
 const files=[],directories=[];
 const visit=path=>{const stat=lstatSync(path);if(stat.isSymbolicLink())throw Error('NO_TREE_SYMLINK:'+path);if(stat.isDirectory()){directories.push({path,mode:stat.mode&0o777});for(const item of readdirSync(path).sort())visit(path+'/'+item);}else if(stat.isFile())files.push(identify(path));else throw Error('ORDINARY_TREE_REQUIRED:'+path);};
 visit(root);return {files:files.sort((a,b)=>a.path.localeCompare(b.path)),directories:directories.sort((a,b)=>a.path.localeCompare(b.path))};
}
const configs=['package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.core.json','tsconfig.node.json','vite.config.ts','vitest.config.ts','index.html'];
const sourceTree=()=>[...tree('src').files,...tree('assets').files,...tree('public').files,...configs.map(identify)].sort((a,b)=>a.path.localeCompare(b.path));
const normalize=rows=>rows.map(({path,bytes,sha256,mode})=>({path,bytes,sha256,mode})).sort((a,b)=>a.path.localeCompare(b.path));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

async function main(){
 assertBrowserEvidenceWritable(out);
 const buildResult=JSON.parse(readFileSync(buildResultPath,'utf8'));
 if(buildResult.exitCode!==0||!buildResult.sourceUnchanged||!buildResult.extraSame||buildResult.argv?.at(-1)!==build)throw Error('SUCCESSFUL_FROZEN_R6_BUILD_REQUIRED');
 const authority=JSON.parse(readFileSync(authorityPath,'utf8')),expected=normalize(authority.files),sourcesBefore=sourceTree();
 const sourceMatchesBuildBefore=same(expected,sourcesBefore),artifactsBefore=tree(build),markers=JSON.parse(readFileSync(out+'/marker-inputs.json','utf8'));
 write('source-before.json',{authority:identify(authorityPath),files:sourcesBefore,sourceMatchesBuildBefore});
 write('artifacts-before.json',{build,...artifactsBefore});
 if(!sourceMatchesBuildBefore)throw Error('FROZEN_R6_SOURCE_CHANGED_BEFORE_HTTP');
 if(markers.normalRunIds.length!==2||markers.devMarkers.length!==33)throw Error('EXPLICIT_2_NORMAL_33_DEV_ONLY');
 const seamPath='src/application/browser-game.ts',seam=readFileSync(seamPath,'utf8');
 const derived=['storageTest','abortAfterHeadWrite',...new Set([...seam.matchAll(/'(reborn-2020-[^']*-validation)'/g)].map(m=>m[1])),...new Set([...seam.matchAll(/'(abort-[a-z-]+)'/g)].map(m=>m[1]))];
 const devListMatchesCurrentSeam=same(markers.devMarkers,derived);
 const normalHits=[],devHits=[],assets=[];
 const sourceImages=expected.filter(row=>row.path.startsWith('assets/')&&/\.(?:png|jpe?g|webp|svg|gif|avif)$/i.test(row.path));
 for(const row of artifactsBefore.files){
  const body=readFileSync(row.path);
  for(const literal of markers.normalRunIds)if(body.includes(Buffer.from(literal)))normalHits.push({path:row.path,literal});
  for(const literal of markers.devMarkers)if(body.includes(Buffer.from(literal)))devHits.push({path:row.path,literal});
  if(/\.(?:png|jpe?g|webp|svg|gif|avif)$/i.test(row.path)){
   const originalMatches=sourceImages.filter(source=>source.bytes===row.bytes&&source.sha256===row.sha256);
   assets.push({artifact:row,originalMatches,exactOriginalMatch:originalMatches.length>0});
  }
 }
 write('marker-scan.json',{normalRunIds:markers.normalRunIds,normalRunIdAuthority:markers.normalRunIdAuthority,devMarkers:markers.devMarkers,devMarkerAuthority:markers.devMarkerAuthority,currentSeam:identify(seamPath),currentSeamDerivedCount:derived.length,devListMatchesCurrentSeam,normalHits,devHits,normalRunIdsAbsent:normalHits.length===0,devLiteralsAbsent:devHits.length===0,scope:'Only two explicit normal run IDs and 33 DEV literals; not arbitrary identifiers, hidden data or a new Create check'});
 write('asset-originals.json',{artifactImageCount:assets.length,rows:assets,allOriginalBytesMatch:assets.every(row=>row.exactOriginalMatch),scope:'Copied original image bytes/SHA only; not pixel rendering or visual acceptance'});
 const responses=[];
 for(let i=0;i<artifactsBefore.files.length;i+=6){
  const batch=artifactsBefore.files.slice(i,i+6);
  const settled=await Promise.allSettled(batch.map(async expected=>{
   const path=expected.path.slice(build.length+1),url=baseUrl+path.split('/').map(encodeURIComponent).join('/');
   const response=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)}),body=Buffer.from(await response.arrayBuffer()),sha256=hash(body);
   return {path,url,status:response.status,contentType:response.headers.get('content-type'),bytes:body.length,sha256,expectedBytes:expected.bytes,expectedSha256:expected.sha256,equal:body.length===expected.bytes&&sha256===expected.sha256};
  }));
  for(let j=0;j<settled.length;j++){const item=settled[j];responses.push(item.status==='fulfilled'?item.value:{path:batch[j].path.slice(build.length+1),error:String(item.reason)});}
 }
 let rootEntry;
 try{const response=await fetch(baseUrl,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)}),body=Buffer.from(await response.arrayBuffer()),sha256=hash(body),index=artifactsBefore.files.find(row=>row.path===build+'/index.html');rootEntry={url:baseUrl,status:response.status,bytes:body.length,sha256,equal:!!index&&body.length===index.bytes&&sha256===index.sha256};}catch(error){rootEntry={url:baseUrl,error:String(error)};}
 write('http-responses.json',{artifactResponses:responses,rootEntry,artifactGetCount:responses.length,rootAliasGetCount:1,totalGetCount:responses.length+1});
 const sourcesAfter=sourceTree(),artifactsAfter=tree(build),sourceMatchesBuildAfter=same(expected,sourcesAfter),sourceUnchanged=same(sourcesBefore,sourcesAfter),artifactsUnchanged=same(artifactsBefore,artifactsAfter);
 write('source-after.json',{authority:identify(authorityPath),files:sourcesAfter,sourceMatchesBuildAfter});
 write('artifacts-after.json',{build,...artifactsAfter});
 const allHttpEqual=responses.every(row=>row.status===200&&row.equal)&&rootEntry.status===200&&rootEntry.equal;
 const allOriginalBytesMatch=assets.every(row=>row.exactOriginalMatch),ok=sourceMatchesBuildBefore&&sourceMatchesBuildAfter&&sourceUnchanged&&artifactsUnchanged&&allHttpEqual&&allOriginalBytesMatch&&devListMatchesCurrentSeam&&normalHits.length===0&&devHits.length===0;
 return {started,ended:new Date().toISOString(),ok,build,baseUrl,buildAuthority:identify(buildResultPath),sourceAuthority:identify(authorityPath),checker:identify(out+'/http-readback.mjs'),sourceCount:expected.length,sourceMatchesBuildBefore,sourceMatchesBuildAfter,sourceUnchanged,artifactCount:responses.length,artifactImages:assets.length,rootAliasGetCount:1,totalGetCount:responses.length+1,artifactsUnchanged,allHttpEqual,allOriginalBytesMatch,normalRunIdCount:markers.normalRunIds.length,devLiteralCount:markers.devMarkers.length,normalRunIdHits:normalHits.length,devLiteralHits:devHits.length,devListMatchesCurrentSeam,scope:'Read-only artifact HTTP/bytes/SHA and exact frozen-build input binding; no game commands, DB access, browser interaction, visual, performance, compatibility, geometry or new Create validation'};
}

try{const result=await main();write('result.json',result);console.log(JSON.stringify(result));if(!result.ok)process.exitCode=1;}catch(error){write('terminal-error.json',{started,ended:new Date().toISOString(),error:String(error),checker:identify(out+'/http-readback.mjs')});console.error(String(error));process.exitCode=1;}
