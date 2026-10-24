import {readFileSync,readdirSync,lstatSync,writeFileSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs';

const repo=resolve(import.meta.dirname,'../../../..');
const out=import.meta.dirname,root28=resolve(out,'..');
const oldRoot=join(repo,'.delivery/t17-u1-r5'),newRoot=join(repo,'.delivery/t17-u1-r6');
const baseUrl='http://127.0.0.1:5364/';
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
const oldManifest=tree(oldRoot),newManifest=tree(newRoot);
put('artifacts-r5.json',{root:oldRoot,...oldManifest});put('artifacts-r6.json',{root:newRoot,...newManifest});
const oldMap=new Map(oldManifest.files.map(row=>[row.path,row])),newMap=new Map(newManifest.files.map(row=>[row.path,row]));
const removed=oldManifest.files.filter(row=>!newMap.has(row.path)).map(row=>row.path),added=newManifest.files.filter(row=>!oldMap.has(row.path)).map(row=>row.path);
const changed=newManifest.files.filter(row=>oldMap.has(row.path)&&JSON.stringify(row)!==JSON.stringify(oldMap.get(row.path)));
const rawComparison=newManifest.files.filter(row=>oldMap.has(row.path)).map(row=>({path:row.path,bytesEqual:readFileSync(join(oldRoot,row.path)).equals(readFileSync(join(newRoot,row.path)))}));
const directoriesSame=JSON.stringify(oldManifest.directories)===JSON.stringify(newManifest.directories);
const artifactsEqual=removed.length===0&&added.length===0&&changed.length===0&&directoriesSame&&rawComparison.every(row=>row.bytesEqual);
put('artifact-comparison.json',{oldCount:oldManifest.files.length,newCount:newManifest.files.length,removed,added,changed,directoriesSame,rawComparison,artifactsEqual});
must(artifactsEqual,'R5_R6_ARTIFACTS_DIFFER');

// IDs come from this U1's original export journals. Fault markers are actual DEV seam literals.
const exportJournals=[],runIds=new Set();
function discover(path){
 const st=lstatSync(path);must(!st.isSymbolicLink(),'SYMLINK_REJECTED:'+path);
 if(st.isDirectory())for(const name of readdirSync(path).sort())discover(join(path,name));
 else if(st.isFile()&&path.endsWith('/exports.jsonl')){
  const raw=readFileSync(path);exportJournals.push({path:relative(repo,path),bytes:raw.length,sha256:hash(raw)});
  for(const line of raw.toString('utf8').split('\n').filter(Boolean)){const row=JSON.parse(line);if(typeof row.runId==='string'&&row.runId)runIds.add(row.runId)}
 }
}
discover(root28);must(runIds.size>0,'NO_ORIGINAL_RUN_ID_SCAN_INPUT');
const faultSource=readFileSync(join(repo,'src/application/browser-game.ts'),'utf8');
const faultDbNames=[...new Set([...faultSource.matchAll(/'(reborn-2020-[^']*-validation)'/g)].map(match=>match[1]))];
const faultModes=[...new Set([...faultSource.matchAll(/'(abort-[a-z-]+)'/g)].map(match=>match[1]))];
const devMarkers=['storageTest','abortAfterHeadWrite',...faultDbNames,...faultModes];
const markers=[...runIds].map(value=>({kind:'current-U1-export-runId',value})).concat(devMarkers.map(value=>({kind:'DEV-fault-seam',value})));
const hits=[];
for(const row of newManifest.files){const raw=readFileSync(join(newRoot,row.path));for(const marker of markers)if(raw.includes(Buffer.from(marker.value)))hits.push({path:row.path,...marker})}
put('artifact-marker-scan.json',{artifactCount:newManifest.files.length,exportJournals,runIds:[...runIds].sort(),devMarkers,hits,allAbsent:hits.length===0,scope:'Exact current U1 export runId bytes and actual DEV fault-entry/database literal markers; this is a production artifact scan, not a game/performance/compatibility test'});
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
put('http-5364-binding.json',{at:new Date().toISOString(),serverChanged:false,sourceServed:'Existing R5 remains on 5364; R6 artifacts independently byte-equal to R5',artifactCount:httpRows.length,rows:httpRows,rootEntry,allHttpEqual});
must(allHttpEqual,'HTTP_5364_ARTIFACT_MISMATCH');
must(JSON.stringify(tree(oldRoot))===JSON.stringify(oldManifest),'R5_ARTIFACTS_CHANGED_DURING_HTTP_READ');
must(JSON.stringify(tree(newRoot))===JSON.stringify(newManifest),'R6_ARTIFACTS_CHANGED_DURING_HTTP_READ');
const sourceBefore=JSON.parse(readFileSync(join(out,'source-before.json'),'utf8'));
const ident=path=>{const st=lstatSync(join(repo,path)),raw=readFileSync(join(repo,path));must(st.isFile()&&!st.isSymbolicLink(),'REGULAR_FILE_REQUIRED:'+path);return {path,bytes:raw.length,sha256:hash(raw),mode:st.mode&0o777}};
const sourceFinal={at:new Date().toISOString(),files:sourceBefore.files.map(row=>ident(row.path))};
const auxiliaryBefore=JSON.parse(readFileSync(join(out,'auxiliary-inputs-before.json'),'utf8')),auxiliaryFinal={at:new Date().toISOString(),files:auxiliaryBefore.files.map(row=>ident(row.path))};
put('source-final.json',sourceFinal);put('auxiliary-inputs-final.json',auxiliaryFinal);
const sourceUnchanged=JSON.stringify(sourceFinal.files)===JSON.stringify(sourceBefore.files),auxiliaryUnchanged=JSON.stringify(auxiliaryFinal.files)===JSON.stringify(auxiliaryBefore.files);
must(sourceUnchanged&&auxiliaryUnchanged,'SOURCE_CHANGED_DURING_ENGINEERING_CHECK');
const summary={at:new Date().toISOString(),artifactsEqual,artifactCount:newManifest.files.length,allHttpEqual,runIdCount:runIds.size,devMarkerCount:devMarkers.length,markerHits:hits.length,sourceCount:sourceFinal.files.length,sourceUnchanged,auxiliaryUnchanged,serverChanged:false,retainedServer:'Existing http://127.0.0.1:5364 serves unchanged R5; no switch necessary or performed'};
put('engineering-final-summary.json',summary);console.log(JSON.stringify(summary,null,2));
