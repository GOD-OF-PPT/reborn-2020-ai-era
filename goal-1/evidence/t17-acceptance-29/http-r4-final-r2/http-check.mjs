import {readFileSync,readdirSync,lstatSync,writeFileSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs';

const repo=resolve(import.meta.dirname,'../../../..');
const out=import.meta.dirname,root29=resolve(out,'..');
const newRoot=join(repo,'.delivery/t17-u2-r4');
const baseUrl='http://127.0.0.1:5366/';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const must=(condition,message)=>{if(!condition)throw Error(message)};
const put=(name,value)=>{assertBrowserEvidenceWritable(out);writeFileSync(join(out,name),JSON.stringify(value,null,2)+'\n')};
function tree(root){
 const files=[],directories=[];
 function visit(path){
  const st=lstatSync(path);must(!st.isSymbolicLink(),'SYMLINK_REJECTED:'+path);
  if(st.isDirectory()){
   directories.push({path:relative(root,path),mode:st.mode&0o777});
   for(const name of readdirSync(path).sort())visit(join(path,name));
  }else if(st.isFile()){
   const data=readFileSync(path);files.push({path:relative(root,path),bytes:data.length,sha256:hash(data),mode:st.mode&0o777});
  }else throw Error('NON_REGULAR_PATH:'+path);
 }
 visit(root);return {files,directories};
}
const newManifest=tree(newRoot);
put('artifacts-r4.json',{root:newRoot,...newManifest});
must(newManifest.files.length===47,'R4_ARTIFACT_COUNT_CHANGED');

// IDs come from this U2's original export journals. Fault markers are actual DEV seam literals.
const exportJournals=[],runIds=new Set();
function discover(path){
 const st=lstatSync(path);must(!st.isSymbolicLink(),'SYMLINK_REJECTED:'+path);
 if(st.isDirectory())for(const name of readdirSync(path).sort())discover(join(path,name));
 else if(st.isFile()&&path.endsWith('/exports.jsonl')){
  const raw=readFileSync(path);exportJournals.push({path:relative(repo,path),bytes:raw.length,sha256:hash(raw)});
  for(const line of raw.toString('utf8').split('\n').filter(Boolean)){const row=JSON.parse(line);if(typeof row.runId==='string'&&row.runId)runIds.add(row.runId)}
 }
}
discover(root29);must(runIds.size===2&&runIds.has('life-fb8a1287-8767-46bb-b4e1-0b38ff7dd06f'),'TWO_CURRENT_NORMAL_RUN_IDS_REQUIRED');
const faultSource=readFileSync(join(repo,'src/application/browser-game.ts'),'utf8');
const faultDbNames=[...new Set([...faultSource.matchAll(/'(reborn-2020-[^']*-validation)'/g)].map(match=>match[1]))];
const faultModes=[...new Set([...faultSource.matchAll(/'(abort-[a-z-]+)'/g)].map(match=>match[1]))];
const devMarkers=['storageTest','abortAfterHeadWrite',...faultDbNames,...faultModes];
const markers=[...runIds].map(value=>({kind:'current-U2-export-runId',value})).concat(devMarkers.map(value=>({kind:'DEV-fault-seam',value})));
const hits=[];
for(const row of newManifest.files){const raw=readFileSync(join(newRoot,row.path));for(const marker of markers)if(raw.includes(Buffer.from(marker.value)))hits.push({path:row.path,...marker})}
put('artifact-marker-scan.json',{artifactCount:newManifest.files.length,exportJournals,runIds:[...runIds].sort(),devMarkers,hits,allAbsent:hits.length===0,scope:'Exact current U2 export runId bytes and actual DEV fault-entry/database literal markers; this is a production artifact scan, not a game/performance/compatibility test'});
must(hits.length===0,'ARTIFACT_MARKER_FOUND');

const httpRows=[];
for(let start=0;start<newManifest.files.length;start+=8){
 const group=newManifest.files.slice(start,start+8);
 const results=await Promise.allSettled(group.map(async row=>{
  const url=new URL(row.path.split('/').map(encodeURIComponent).join('/'),baseUrl).href;
  const response=await fetch(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)});
  const data=Buffer.from(await response.arrayBuffer()),expected=readFileSync(join(newRoot,row.path));
  return {path:row.path,url,status:response.status,bytes:data.length,sha256:hash(data),expectedBytes:row.bytes,expectedSha256:row.sha256,bytesEqual:data.equals(expected),contentType:response.headers.get('content-type')};
 }));
 for(let i=0;i<results.length;i++){const item=results[i];httpRows.push(item.status==='fulfilled'?item.value:{path:group[i].path,error:String(item.reason)})}
}
let rootEntry;
try{
 const response=await fetch(baseUrl,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)}),data=Buffer.from(await response.arrayBuffer());
 rootEntry={url:baseUrl,status:response.status,bytes:data.length,sha256:hash(data),bytesEqual:data.equals(readFileSync(join(newRoot,'index.html')))};
}catch(error){rootEntry={url:baseUrl,error:String(error)}}
const allHttpEqual=httpRows.every(row=>row.status===200&&row.bytesEqual===true)&&rootEntry.status===200&&rootEntry.bytesEqual===true;
put('http-5366-binding.json',{at:new Date().toISOString(),serverChanged:false,sourceServed:'Root-owned R4 currently serves 5366; this check performs no server change',artifactCount:httpRows.length,rows:httpRows,rootEntry,allHttpEqual});
must(allHttpEqual,'HTTP_5366_ARTIFACT_MISMATCH');
must(JSON.stringify(tree(newRoot))===JSON.stringify(newManifest),'R4_ARTIFACTS_CHANGED_DURING_HTTP_READ');
const sourceBefore=JSON.parse(readFileSync(join(out,'source-before.json'),'utf8'));
const ident=path=>{const st=lstatSync(join(repo,path)),raw=readFileSync(join(repo,path));must(st.isFile()&&!st.isSymbolicLink(),'REGULAR_FILE_REQUIRED:'+path);return {path,bytes:raw.length,sha256:hash(raw),mode:st.mode&0o777}};
const sourceFinal={at:new Date().toISOString(),files:sourceBefore.files.map(row=>ident(row.path))};
const auxiliaryBefore=JSON.parse(readFileSync(join(out,'auxiliary-inputs-before.json'),'utf8')),auxiliaryFinal={at:new Date().toISOString(),files:auxiliaryBefore.files.map(row=>ident(row.path))};
put('source-final.json',sourceFinal);put('auxiliary-inputs-final.json',auxiliaryFinal);
const sameRows=(expected,actual)=>expected.length===actual.length&&expected.every((row,index)=>{const now=actual[index];return now&&row.path===now.path&&row.bytes===now.bytes&&row.sha256===now.sha256&&row.mode===now.mode&&(row.gitMode===undefined||row.gitMode===(now.mode&0o111?'100755':'100644'))});
const sourceUnchanged=sameRows(sourceBefore.files,sourceFinal.files),auxiliaryUnchanged=sameRows(auxiliaryBefore.files,auxiliaryFinal.files);
must(sourceUnchanged&&auxiliaryUnchanged,'SOURCE_CHANGED_DURING_ENGINEERING_CHECK');
const rootConfigs=['package.json','package-lock.json','tsconfig.json','tsconfig.app.json','tsconfig.core.json','tsconfig.node.json','vite.config.ts','vitest.config.ts','index.html'];
const currentPaths=[...['src','assets','public'].flatMap(root=>tree(join(repo,root)).files.map(row=>root+'/'+row.path)),...rootConfigs].sort();
const expectedPaths=sourceBefore.files.map(row=>row.path).sort();
must(currentPaths.length===530&&JSON.stringify(currentPaths)===JSON.stringify(expectedPaths),'R4_SOURCE_EXACT_SET_CHANGED');
const baseline=JSON.parse(readFileSync(join(root29,'baseline.json'),'utf8'));
const p3=Object.values(baseline.priorFiles).filter(row=>!row.path.startsWith('goal-1/'));
must(p3.length===26,'P3_BASELINE_SCOPE_CHANGED');
const p3Current=p3.map(row=>ident(row.path));
must(sameRows(p3,p3Current),'P3_BYTES_HASH_MODE_CHANGED');
put('p3-bridge.json',{baseline:'goal-1/evidence/t17-acceptance-29/baseline.json',paths:26,allBytesShaModesEqual:true,rows:p3Current,scope:'Preservation bridge only, not P3 functionality/62/22 validation'});
put('source-exact-set.json',{files:530,exactSet:true,bytesShaModesSame:sourceUnchanged,optionalGitModesChecked:true});
const summary={at:new Date().toISOString(),artifactCount:newManifest.files.length,allHttpEqual,runIdCount:runIds.size,devMarkerCount:devMarkers.length,markerHits:hits.length,sourceCount:sourceFinal.files.length,sourceUnchanged,sourceExactSet:true,p3Preserved:26,auxiliaryUnchanged,serverChanged:false,retainedServer:'Root-owned R4 http://127.0.0.1:5366 remains running; no server change performed'};
put('engineering-final-summary.json',summary);console.log(JSON.stringify(summary,null,2));
