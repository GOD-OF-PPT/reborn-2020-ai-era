import {readFileSync,writeFileSync,lstatSync,readdirSync,readlinkSync} from 'node:fs';
import {resolve,relative,join,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs';

const cwd=process.cwd(),out=resolve(fileURLToPath(new URL('.',import.meta.url))),root=resolve(out,'..');
if(relative(cwd,out)!=='goal-1/evidence/t17-acceptance-34/preservation-r1')throw Error('OWN_FRESH_OUTPUT_REQUIRED');
assertBrowserEvidenceWritable(out);
const sha=b=>createHash('sha256').update(b).digest('hex'),sort=(a,b)=>a.path.localeCompare(b.path,'en');
const errors=[];
function check(ok,code,detail){if(!ok)errors.push({code,detail});return ok;}
function rel(p){return relative(cwd,p).split('\\').join('/');}
function file(p){const a=resolve(cwd,p),s=lstatSync(a);if(!s.isFile()||s.isSymbolicLink())throw Error('ORDINARY_FILE_REQUIRED:'+p);const b=readFileSync(a);return {path:rel(a),bytes:b.length,sha256:sha(b),mode:s.mode&0o7777};}
function sameRow(a,b,tag){for(const k of ['path','bytes','sha256','mode'])if(b[k]!==undefined)check(a[k]===b[k],tag+':'+k,{path:b.path,expected:b[k],actual:a[k]});}
function readJson(p){return JSON.parse(readFileSync(resolve(cwd,p),'utf8'));}
function unique(values,tag){check(new Set(values).size===values.length,tag,{total:values.length,unique:new Set(values).size});}
function exact(actual,expected,tag){unique(actual,tag+':actual-duplicates');unique(expected,tag+':expected-duplicates');const aa=new Set(actual),ee=new Set(expected),missing=expected.filter(x=>!aa.has(x)),extra=actual.filter(x=>!ee.has(x));check(!missing.length&&!extra.length,tag,{missing,extra});return {actual:actual.length,expected:expected.length,missing,extra,exact:!missing.length&&!extra.length};}
function tree(rootPath,excluded=new Set()){
 const files=[],directories=[],directoryModes=[],symlinks=[],special=[];
 function walk(abs){const p=rel(abs);if(excluded.has(p))return;const s=lstatSync(abs);
  if(s.isSymbolicLink()){const target=readlinkSync(abs),bytes=Buffer.from(target);symlinks.push({path:p,target,targetBytes:bytes.length,targetSha256:sha(bytes),lstatBytes:s.size,mode:s.mode&0o7777});return;}
  if(s.isDirectory()){directories.push(p);directoryModes.push({path:p,mode:s.mode&0o7777});for(const n of readdirSync(abs).sort())walk(join(abs,n));}
  else if(s.isFile())files.push(file(p));else special.push({path:p,mode:s.mode});
 }
 walk(resolve(cwd,rootPath));return {files:files.sort(sort),directories:directories.sort(),directoryModes:directoryModes.sort(sort),symlinks:symlinks.sort(sort),special:special.sort(sort)};
}
function verifyTree(actual,expected,tag){
 const fileSet=exact(actual.files.map(x=>x.path),expected.files.map(x=>x.path),tag+':file-set');
 const dirSet=exact(actual.directories,expected.directories,tag+':directory-set');
 const map=new Map(actual.files.map(x=>[x.path,x]));for(const e of expected.files)if(map.has(e.path))sameRow(map.get(e.path),e,tag+':file');
 const dmap=new Map(actual.directoryModes.map(x=>[x.path,x.mode]));
 check(Array.isArray(expected.directoryModes),tag+':directory-modes-required',{});
 for(const e of expected.directoryModes??[])check(dmap.get(e.path)===e.mode,tag+':directory-mode',{path:e.path,expected:e.mode,actual:dmap.get(e.path)});
 check(!actual.symlinks.length&&!actual.special.length,tag+':unexpected-nonordinary',{symlinks:actual.symlinks,special:actual.special});
 return {fileSet,dirSet,fileBytesShaModeCompared:expected.files.length,directoryModesCompared:expected.directoryModes?.length??0,symlinks:actual.symlinks,special:actual.special,treeSha256:sha(Buffer.from(JSON.stringify(actual)))};
}
const baselinePath='goal-1/evidence/t17-acceptance-34/baseline.json',ownedPath='goal-1/evidence/t17-acceptance-34/owned-master-suffixes.json',authorityPath='goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/root19-preparation-tree.json';
const base=readJson(baselinePath),owned=readJson(ownedPath),base32=readJson(base.root19.baseline),authority=readJson(authorityPath);
const controls=[baselinePath,ownedPath,base.root19.baseline,authorityPath,'scripts/browser_evidence_guard.mjs',rel(resolve(out,'preparation-inputs.json')),rel(fileURLToPath(import.meta.url)),...base.lastSealed.map(x=>x.marker.path)];
const beforeInputs=controls.map(file);
check(file(base.root19.baseline).sha256===base.root19.baselineSha256,'ROOT19_BASELINE32_PIN',{expected:base.root19.baselineSha256,actual:file(base.root19.baseline)});
check(JSON.stringify(base32.root19)===JSON.stringify(authority),'ROOT19_AUTHORITIES_IDENTICAL',{baseline:base.root19.baseline,authority:authorityPath});
function git(...args){return execFileSync('rtk',['proxy','git',...args],{cwd,encoding:null,maxBuffer:20*1024*1024});}
function occ(b,n){let count=0,pos=0;while((pos=b.indexOf(n,pos))!==-1){count++;pos++;}return count;}
function markerInventory(){
 const regular=[],symlinks=[],other=[];
 function walk(abs){if(abs===root)return;const s=lstatSync(abs);if(s.isSymbolicLink()){
   if(basename(abs)==='sealed-evidence.json'){const target=readlinkSync(abs),b=Buffer.from(target);symlinks.push({path:rel(abs),target,targetBytes:b.length,targetSha256:sha(b),lstatBytes:s.size,mode:s.mode&0o7777});}return;
  }if(s.isDirectory()){for(const n of readdirSync(abs).sort())walk(join(abs,n));}
  else if(basename(abs)==='sealed-evidence.json'){if(s.isFile())regular.push(file(rel(abs)));else other.push(rel(abs));}
 }
 walk(resolve(cwd,'goal-1/evidence'));return {regular:regular.sort(sort),symlinks:symlinks.sort(sort),other};
}
function snapshot(label){
 const start=new Date().toISOString(),head=git('rev-parse','HEAD').toString().trim(),branch=git('branch','--show-current').toString().trim();
 check(head===base.head,label+':HEAD_UNCHANGED',{expected:base.head,actual:head});
 const p3=base.p3.map(e=>{const a=file(e.path);sameRow(a,e,label+':P3');return a;});check(p3.length===26,label+':P3_COUNT',{actual:p3.length});
 const root19Tree=tree('goal-1/evidence/t17-acceptance-19'),root19=verifyTree(root19Tree,authority,label+':ROOT19');
 check(root19.fileSet.actual===1197&&root19.dirSet.actual===110,label+':ROOT19_EXPECTED_COUNTS',root19);
 const markers=markerInventory(),markerSet=exact(markers.regular.map(x=>x.path),base.seals.map(x=>x.path),label+':OLD_ORDINARY_MARKER_SET');
 const markerMap=new Map(markers.regular.map(x=>[x.path,x]));for(const e of base.seals)if(markerMap.has(e.path))sameRow(markerMap.get(e.path),e,label+':OLD_MARKER');
 const symlinkSet=exact(markers.symlinks.map(x=>x.path),base.markerSymlinks.map(x=>x.path),label+':MARKER_SYMLINK_SET');
 for(const e of base.markerSymlinks){const a=markers.symlinks.find(x=>x.path===e.path);if(a){check(a.target===e.target,label+':MARKER_SYMLINK_TARGET',{expected:e,actual:a});check(typeof e.mode==='number'&&a.mode===e.mode,label+':MARKER_SYMLINK_BASELINE_MODE',{path:e.path,expected:e.mode,actual:a.mode});const eb=Buffer.from(e.target);check(a.targetBytes===eb.length&&a.targetSha256===sha(eb)&&a.lstatBytes===eb.length,label+':MARKER_SYMLINK_LITERAL_BYTES',{expectedBytes:eb.length,actual:a});}}
 check(markers.regular.length===122&&markers.symlinks.length===2&&!markers.other.length,label+':MARKER_COUNTS',{regular:markers.regular.length,symlinks:markers.symlinks.length,other:markers.other});
 const latest=base.lastSealed.map(e=>{sameRow(file(e.marker.path),e.marker,label+':LAST_MARKER');const marker=readJson(e.marker.path);check(marker.selfExcluded==='sealed-evidence.json',label+':EXACT_ROOT_SELF_EXCLUDE',{root:e.root,selfExcluded:marker.selfExcluded});const actual=tree(e.root,new Set([e.marker.path]));const result=verifyTree(actual,marker,label+':PAYLOAD:'+e.root);check(result.fileSet.actual===e.ordinaryFiles&&result.dirSet.actual===e.directories,label+':PAYLOAD_DECLARED_COUNTS',{root:e.root,expected:e,actual:result});return {root:e.root,marker:file(e.marker.path),...result};});
 const input=file(base.originalInput.path);sameRow(input,base.originalInput,label+':ORIGINAL_INPUT');check(input.bytes===61&&input.sha256==='20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1',label+':INPUT_FIXED',{input});
 const masters=base.masters.map(e=>{
  const work=readFileSync(resolve(cwd,e.path)),headBytes=git('show',base.head+':'+e.path),currentHeadBytes=git('show','HEAD:'+e.path),indexBytes=git('show',':'+e.path),needle=work.subarray(e.p3Insertion.offset,e.p3Insertion.offset+e.p3Insertion.bytes),entry=owned.entries.find(x=>x.path===e.path);
  check(needle.length===2304&&sha(needle)==='d6d2ae77cb0e8dadcee47df146d712a82dbfa4a278a2de9cec3a3a5564610655'&&needle.filter(x=>x===10).length===14,label+':P3_INSERT_IDENTITY',{path:e.path,bytes:needle.length,sha256:sha(needle),lineFeeds:needle.filter(x=>x===10).length});
  check(occ(work,needle)===1,label+':P3_INSERT_UNIQUE_WORKING',{path:e.path,count:occ(work,needle)});
  check(occ(headBytes,needle)===0&&occ(currentHeadBytes,needle)===0&&occ(indexBytes,needle)===0,label+':P3_INSERT_ABSENT_HEAD_AND_INDEX',{path:e.path,baseHead:occ(headBytes,needle),head:occ(currentHeadBytes,needle),index:occ(indexBytes,needle)});
  check(headBytes.length===e.headBytes&&sha(headBytes)===e.headSha256,label+':MASTER_HEAD_ANCHOR',{path:e.path,actualBytes:headBytes.length,actualSha256:sha(headBytes),expected:e});
  check(indexBytes.equals(headBytes),label+':MASTER_INDEX_EQUALS_HEAD',{path:e.path,indexBytes:indexBytes.length,indexSha256:sha(indexBytes),headSha256:sha(headBytes)});
  const original=Buffer.concat([headBytes.subarray(0,e.p3Insertion.offset),needle,headBytes.subarray(e.p3Insertion.offset)]);
  check(original.length===e.bytes&&sha(original)===e.sha256,label+':MASTER_BASELINE_RECONSTRUCT',{path:e.path,bytes:original.length,sha256:sha(original),expected:e.sha256});
  check(!!entry,label+':REGISTERED_OWN_SUFFIX',{path:e.path});
  const suffix=Buffer.from(entry?.suffix??'');const expected=Buffer.concat([original,suffix]);
  check(work.equals(expected),label+':MASTER_EXACT_BASELINE_PLUS_OWN_SUFFIX',{path:e.path,currentBytes:work.length,expectedBytes:expected.length,currentSha256:sha(work),expectedSha256:sha(expected)});
  check(entry?.beforeBytes===e.bytes&&entry?.beforeSha256===e.sha256&&entry?.headBytes===headBytes.length&&entry?.headSha256===sha(headBytes),label+':OWN_SUFFIX_BASE_ANCHORS',{path:e.path});
  check(entry?.afterSha256===sha(work),label+':OWN_SUFFIX_CURRENT_HASH',{path:e.path,expected:entry?.afterSha256,actual:sha(work)});
  sameRow(file(e.path),{path:e.path,mode:e.mode},label+':MASTER_MODE');
  return {path:e.path,working:file(e.path),head:{bytes:headBytes.length,sha256:sha(headBytes)},index:{bytes:indexBytes.length,sha256:sha(indexBytes)},p3:{offset:e.p3Insertion.offset,bytes:needle.length,sha256:sha(needle),lineFeeds:needle.filter(x=>x===10).length,workingOccurrences:occ(work,needle),headOccurrences:occ(currentHeadBytes,needle),indexOccurrences:occ(indexBytes,needle)},ownSuffix:{bytes:suffix.length,sha256:sha(suffix),matchesRegistered:work.equals(expected)&&entry?.afterSha256===sha(work)}};
 });
 const p3HeadEntries=git('ls-tree','-r','-z',base.head,'--',...base.p3.map(x=>x.path)).toString().split('\0').filter(Boolean).map(x=>{const m=/^(\d+) blob ([a-f0-9]+)\t(.*)$/.exec(x);if(!m)throw Error('UNEXPECTED_HEAD_ENTRY:'+x);return {mode:m[1],oid:m[2],path:m[3]};});
 const p3IndexEntries=git('ls-files','--stage','-z','--',...base.p3.map(x=>x.path)).toString().split('\0').filter(Boolean).map(x=>{const m=/^(\d+) ([a-f0-9]+) (\d+)\t(.*)$/.exec(x);if(!m)throw Error('UNEXPECTED_INDEX_ENTRY:'+x);check(m[3]==='0',label+':P3_INDEX_STAGE_ZERO',{entry:x});return {mode:m[1],oid:m[2],path:m[4]};});
 const sortedP3Head=p3HeadEntries.sort(sort),sortedP3Index=p3IndexEntries.sort(sort);check(JSON.stringify(sortedP3Head)===JSON.stringify(sortedP3Index),label+':P3_INDEX_EQUALS_HEAD',{head:sortedP3Head,index:sortedP3Index});
 const indexStage=git('ls-files','--stage','-z','--',...base.p3.map(x=>x.path),...base.masters.map(x=>x.path));
 return {label,start,end:new Date().toISOString(),git:{head,branch,indexStageBytes:indexStage.length,indexStageSha256:sha(indexStage),indexStage:indexStage.toString().split('\0').filter(Boolean),p3HeadEntries:sortedP3Head,p3IndexEntries:sortedP3Index,p3IndexEqualsHead:JSON.stringify(sortedP3Head)===JSON.stringify(sortedP3Index)},p3,root19,markers:{regularSet:markerSet,symlinkSet,regularBytesShaModeCompared:base.seals.length,regularInventorySha256:sha(Buffer.from(JSON.stringify(markers.regular))),symlinks:markers.symlinks,symlinkBaselineModeAvailable:true,modeLimit:'symbolic modes and literal targets match this task baseline and initial/final; fixture creation-time modes are not separately proven',excludedCurrentRoot:rel(root),other:markers.other},latest,input,masters,stableIdentitySha256:sha(Buffer.from(JSON.stringify({head,branch,p3,root19:root19Tree,markers,latest,input,masters,indexStageSha256:sha(indexStage)})))};
}
let first=null,second=null,fatal=null;
try{first=snapshot('before');second=snapshot('after');check(first.stableIdentitySha256===second.stableIdentitySha256,'ALL_SCOPED_INITIAL_FINAL_IDENTICAL',{before:first.stableIdentitySha256,after:second.stableIdentitySha256});}catch(e){fatal={name:e.name,message:e.message,stack:e.stack};errors.push({code:'FATAL_READ',detail:fatal});}
const afterInputs=controls.map(file);check(JSON.stringify(beforeInputs)===JSON.stringify(afterInputs),'CONTROL_INPUTS_INITIAL_FINAL_IDENTICAL',{before:beforeInputs,after:afterInputs});
const result={format:'cux06-preservation-readback-v1',at:new Date().toISOString(),scope:'read-only current bounded preservation; not final seal, runtime, human or whole-goal acceptance',baseline:file(baselinePath),script:file(rel(fileURLToPath(import.meta.url))),inputBefore:beforeInputs,inputAfter:afterInputs,first,second,errors,passed:errors.length===0,limitations:['122 ordinary marker identities and exact set are checked; only latest root33/post payloads are fully rehashed in addition to full root19.','No marker is followed through a symbolic directory; marker symlinks compare their literal target bytes, not target contents.','Symbolic marker modes and literal targets match this task baseline; their fixture creation-time modes are not independently established.','PUBLIC/remote verification belongs to Root; no network Git operation or index write was performed.','Current root34 and all its growing outputs are excluded only from the old marker inventory.','No P3 tests, compatibility tests, browser, rule commands, staging, commit or sealing executed.']};
assertBrowserEvidenceWritable(out);writeFileSync(join(out,'readback.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:result.passed,errors:errors.length,p3:first?.p3.length,root19:first?{files:first.root19.fileSet.actual,directories:first.root19.dirSet.actual}:null,oldMarkers:first?{ordinary:first.markers.regularSet.actual,symlink:first.markers.symlinkSet.actual}:null,latest:first?.latest.map(x=>({root:x.root,files:x.fileSet.actual,directories:x.dirSet.actual})),head:first?.git.head,initialFinalSame:first?.stableIdentitySha256===second?.stableIdentitySha256,readback:'goal-1/evidence/t17-acceptance-34/preservation-r1/readback.json'}));
process.exitCode=result.passed?0:1;
