import {readFileSync,readdirSync,lstatSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const repo=resolve(import.meta.dirname,'../../../..');
const root28='goal-1/evidence/t17-acceptance-28';
const root19='goal-1/evidence/t17-acceptance-19';
const root27='goal-1/evidence/t17-acceptance-27';
const post='goal-1/evidence/t17-s4-relay-r1-post-commit-01';
const anchorPath='goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/root19-preparation-tree.json';
const p3Hash='d6d2ae77cb0e8dadcee47df146d712a82dbfa4a278a2de9cec3a3a5564610655';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const must=(condition,message)=>{if(!condition)throw Error(message)};
function safe(path){
 must(typeof path==='string'&&path.length>0&&!path.includes('\0')&&!path.includes('\\')&&!path.split('/').some(part=>['','..','.'].includes(part)),'UNSAFE_REPOSITORY_PATH');
 const absolute=resolve(repo,path);must(!relative(repo,absolute).startsWith('..'),'OUTSIDE_REPOSITORY');
 let current=repo;
 for(const part of path.split('/')){current=join(current,part);must(!lstatSync(current).isSymbolicLink(),'SYMLINK_REJECTED:'+path)}
 return absolute;
}
const bytes=path=>{const absolute=safe(path);must(lstatSync(absolute).isFile(),'REGULAR_FILE_REQUIRED:'+path);return readFileSync(absolute)};
const json=path=>JSON.parse(bytes(path).toString('utf8'));
const identity=path=>{const raw=bytes(path);return {path,bytes:raw.length,sha256:hash(raw),mode:lstatSync(safe(path)).mode&0o777}};
function exactRow(expected){
 const actual=identity(expected.path);
 must(actual.bytes===expected.bytes&&actual.sha256===expected.sha256&&actual.mode===expected.mode,'BYTE_HASH_MODE_CHANGED:'+expected.path);
 return actual;
}
function unique(values,label){must(new Set(values).size===values.length,'DUPLICATE_PATH:'+label)}
function sameSet(a,b,label){unique(a,label+':actual');unique(b,label+':expected');must(JSON.stringify([...a].sort())===JSON.stringify([...b].sort()),'EXACT_SET_CHANGED:'+label)}
function tree(root){
 const files=[],directories=[],directoryModes=[];
 function visit(path){
  const absolute=safe(path),st=lstatSync(absolute);
  if(st.isDirectory()){
   directories.push(path);directoryModes.push({path,mode:st.mode&0o777});
   for(const name of readdirSync(absolute).sort())visit(path+'/'+name);
  }else if(st.isFile()){
   if(path!==root+'/sealed-evidence.json')files.push(identity(path));
  }else throw Error('NON_REGULAR_PATH:'+path);
 }
 visit(root);return {files,directories,directoryModes};
}
function exactTree(expected,current,label){
 sameSet(current.files.map(row=>row.path),expected.files.map(row=>row.path),label+':files');
 sameSet(current.directories,expected.directories,label+':directories');
 const files=new Map(current.files.map(row=>[row.path,row]));
 for(const row of expected.files){const now=files.get(row.path);must(now.bytes===row.bytes&&now.sha256===row.sha256&&now.mode===row.mode,'TREE_FILE_CHANGED:'+row.path)}
 must(expected.directoryModes?.length===expected.directories.length,'DIRECTORY_MODE_ANCHOR_REQUIRED:'+label);
 const modes=new Map(current.directoryModes.map(row=>[row.path,row.mode]));
 for(const row of expected.directoryModes)must(modes.get(row.path)===row.mode,'DIRECTORY_MODE_CHANGED:'+row.path);
 return {files:current.files.length,directories:current.directories.length,directoryModes:current.directoryModes.length,exactSetBytesShaAndModes:true};
}
function seal(root,fileCount,directoryCount){
 const path=root+'/sealed-evidence.json',expected=json(path);
 must(expected.selfExcluded==='sealed-evidence.json','EXPLICIT_MARKER_SELF_EXCLUSION_REQUIRED:'+root);
 must(expected.files.length===fileCount&&expected.directories.length===directoryCount,'SEALED_SCOPE_CHANGED:'+root);
 must(expected.files.every(row=>row.path.startsWith(root+'/')&&row.path!==path),'INVALID_SEALED_FILE_PATH:'+root);
 return {root,marker:identity(path),...exactTree(expected,tree(root),root)};
}
function readonlyGit(args){
 must(args[0]==='rev-parse'&&args.length===2&&args[1]==='HEAD'||args[0]==='cat-file'&&args.length===3&&args[1]==='blob','READ_ONLY_GIT_ONLY');
 const result=spawnSync('rtk',['proxy','git',...args],{cwd:repo,maxBuffer:8*1024*1024});
 must(result.status===0,'GIT_READ_FAILED:'+String(result.stderr));return result.stdout;
}

/** Read-only. append mode requires the caller's exact newly appended suffix identities. */
export function checkMasters({mode='exact',appends}={}){
 must(mode==='exact'||mode==='append','MASTER_MODE_REQUIRED');
 const baseline=json(root28+'/baseline.json');
 const head=readonlyGit(['rev-parse','HEAD']).toString().trim();
 must(head===baseline.head,'HEAD_CHANGED_SINCE_U1_BASELINE');
 const paths=baseline.masters.map(row=>row.path);
 if(mode==='append'){
  must(appends!==null&&typeof appends==='object'&&!Array.isArray(appends),'EXPLICIT_APPEND_IDENTITIES_REQUIRED');
  sameSet(Object.keys(appends),paths,'append-identities');
 }else must(appends===undefined,'EXACT_MODE_MUST_NOT_ACCEPT_APPEND');
 const rows=baseline.masters.map(row=>{
  const copyPath=root28+'/'+row.path.split('/').at(-1)+'.baseline',base=bytes(copyPath),current=bytes(row.path),now=identity(row.path);
  must(base.length===row.bytes&&hash(base)===row.sha256,'MASTER_BASELINE_COPY_CHANGED:'+copyPath);
  must(now.mode===row.mode,'MASTER_MODE_CHANGED:'+row.path);
  must(current.subarray(0,base.length).equals(base),'MASTER_PREFIX_CHANGED:'+row.path);
  const suffix=current.subarray(base.length);
  if(mode==='exact')must(current.equals(base),'MASTER_NOT_EXACT_BASELINE:'+row.path);
  else{
   const expected=appends[row.path];
   must(expected&&Number.isSafeInteger(expected.bytes)&&expected.bytes>=0&&/^[a-f0-9]{64}$/.test(expected.sha256),'APPEND_IDENTITY_INVALID:'+row.path);
   must(suffix.length===expected.bytes&&hash(suffix)===expected.sha256,'UNEXPECTED_APPEND:'+row.path);
  }
  const original=readonlyGit(['cat-file','blob',head+':'+row.path]);
  let first=0,last=0;
  while(first<base.length&&first<original.length&&base[first]===original[first])first++;
  while(last<base.length-first&&last<original.length-first&&base[base.length-1-last]===original[original.length-1-last])last++;
  const inserted=base.subarray(first,base.length-last),lineFeeds=[...inserted].filter(byte=>byte===10).length;
  must(original.length-first-last===0&&inserted.length===2304&&lineFeeds===14&&hash(inserted)===p3Hash,'P3_HEAD_INSERTION_CHANGED:'+row.path);
  const position=current.indexOf(inserted);
  must(position===first&&current.indexOf(inserted,position+1)===-1,'P3_INSERTION_NOT_UNIQUE:'+row.path);
  must(Buffer.concat([base.subarray(0,first),base.subarray(first+inserted.length)]).equals(original),'HEAD_NOT_RECOVERED_BY_ONLY_P3_REMOVAL:'+row.path);
  return {path:row.path,working:now,baselineCopy:identity(copyPath),exactBaseline:mode==='exact',preservedBaselinePrefix:true,appendBytes:suffix.length,appendSha256:hash(suffix),head:{commit:head,bytes:original.length,sha256:hash(original)},p3:{offset:first,bytes:2304,lineFeeds,sha256:p3Hash,unique:true}};
 });
 return {mode,head,rows,scope:'Only the explicitly supplied current suffix is checked; no future append is approved'};
}

/** No writes, imports of old closeout candidates, game commands, or test execution. */
export function checkPreservation(options={}){
 const baselinePath=root28+'/baseline.json',baseline=json(baselinePath);
 const prior=Object.values(baseline.priorFiles),p3=prior.filter(row=>!row.path.startsWith('goal-1/'));
 must(p3.length===26&&baseline.root19.length===1197&&baseline.seals.length===110,'U1_BASELINE_SCOPE_CHANGED');
 unique(p3.map(row=>row.path),'P3 baseline');unique(baseline.seals.map(row=>row.path),'old marker baseline');
 p3.forEach(exactRow);baseline.seals.forEach(exactRow);exactRow(baseline.originalInput);
 must(baseline.originalInput.bytes===61&&baseline.originalInput.sha256==='20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1','ORIGINAL_INPUT_ANCHOR_CHANGED');
 const root25Marker=json('goal-1/evidence/t17-acceptance-25/sealed-evidence.json');
 const anchorRow=root25Marker.files.find(row=>row.path===anchorPath);must(anchorRow,'R1_REFERENCED_SEALED_ROOT19_ANCHOR_MISSING');exactRow(anchorRow);
 const root19Expected=json(anchorPath);
 must(root19Expected.files.length===1197&&root19Expected.directories.length===110,'ROOT19_ANCHOR_SCOPE_CHANGED');
 sameSet(baseline.root19.map(row=>row.path),root19Expected.files.map(row=>row.path),'root19-baseline-anchor');
 const anchorMap=new Map(root19Expected.files.map(row=>[row.path,row]));
 for(const row of baseline.root19){const anchor=anchorMap.get(row.path);must(row.bytes===anchor.bytes&&row.sha256===anchor.sha256&&row.mode===anchor.mode,'ROOT19_U1_BASELINE_DIFFERS_FROM_R1_ANCHOR:'+row.path)}
 must(!lstatSync(resolve(repo,root19,'sealed-evidence.json'),{throwIfNoEntry:false}),'ROOT19_ROOT_MARKER_WAS_NOT_PRESENT_IN_R1_ANCHOR');
 const oldRoot19=exactTree(root19Expected,tree(root19),root19);
 const relay=seal(root27,850,87),relayPost=seal(post,38,1);
 const masters=checkMasters(options);
 return {at:new Date().toISOString(),scope:'Read-only byte/SHA/mode/exact-tree preservation, not gameplay/compatibility acceptance',baseline:identity(baselinePath),p3:{count:p3.length,allBytesShaModesEqual:true,rows:p3},oldSealMarkers:{count:baseline.seals.length,allBytesShaModesEqual:true,scope:'Marker identities only except separately checked root27/post payloads',rows:baseline.seals},root19:{...oldRoot19,anchor:identity(anchorPath),anchorBoundByRoot25Seal:true,rootMarkerAbsent:true},root27:relay,post:relayPost,originalInput:identity('goal-1/input.md'),masters};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2);let options={};
  if(args.length){must(args.length===2&&args[0]==='--append-manifest','USAGE_EXACT_OR_APPEND_MANIFEST');options={mode:'append',appends:json(args[1])}}
  console.log(JSON.stringify(checkPreservation(options),null,2));
 }catch(error){console.error(JSON.stringify({at:new Date().toISOString(),status:'failed',error:String(error?.message??error)},null,2));process.exitCode=1}
}
