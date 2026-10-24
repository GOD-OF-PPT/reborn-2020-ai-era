import {readFileSync,writeFileSync,lstatSync,readdirSync} from 'node:fs'
import {resolve,join,relative,dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs'

const dir=dirname(fileURLToPath(import.meta.url)),repo=resolve(dir,'../../../..')
const root='goal-1/evidence/t17-acceptance-29',anchorPath='goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/root19-preparation-tree.json'
const root25Marker='goal-1/evidence/t17-acceptance-25/sealed-evidence.json',p3AnchorPath='goal-1/evidence/t17-acceptance-25/preservation-r1/result-r2.json'
assertBrowserEvidenceWritable(dir)
const hash=b=>createHash('sha256').update(b).digest('hex'),startedAt=new Date().toISOString()
function safe(path){
 assert.ok(typeof path==='string'&&path.length&&!path.includes('\0')&&!path.includes('\\')&&!path.split('/').some(p=>['','.','..'].includes(p)),'unsafe relative path')
 const full=resolve(repo,path);assert.ok(!relative(repo,full).startsWith('..'))
 let cursor=repo
 for(const part of path.split('/')){cursor=join(cursor,part);assert.equal(lstatSync(cursor).isSymbolicLink(),false,'symlink rejected: '+path)}
 return full
}
function bytes(path){const full=safe(path);assert.ok(lstatSync(full).isFile(),'regular file required: '+path);return readFileSync(full)}
const json=path=>JSON.parse(bytes(path).toString('utf8'))
function identity(path){const raw=bytes(path);return {path,bytes:raw.length,sha256:hash(raw),mode:lstatSync(safe(path)).mode&0o777}}
const equal=(a,b)=>a.bytes===b.bytes&&a.sha256===b.sha256&&a.mode===b.mode
function exact(expected){const actual=identity(expected.path);assert.ok(equal(actual,expected),'byte/hash/mode changed: '+expected.path);return actual}
function sameSet(a,b,label){assert.equal(new Set(a).size,a.length,'duplicate actual '+label);assert.equal(new Set(b).size,b.length,'duplicate expected '+label);assert.deepEqual([...a].sort(),[...b].sort(),'exact set changed: '+label)}
function tree(path,{excludeRootMarker=false}={}){
 const files=[],directories=[],directoryModes=[]
 function visit(p){const st=lstatSync(safe(p));if(st.isDirectory()){directories.push(p);directoryModes.push({path:p,mode:st.mode&0o777});for(const n of readdirSync(safe(p)).sort())visit(p+'/'+n)}else if(st.isFile()){if(!excludeRootMarker||p!==path+'/sealed-evidence.json')files.push(identity(p))}else throw Error('non-regular path: '+p)}
 visit(path);return {files,directories,directoryModes}
}
function verifyTree(expected,current,label){
 sameSet(current.files.map(r=>r.path),expected.files.map(r=>r.path),label+' files');sameSet(current.directories,expected.directories,label+' directories')
 const actual=new Map(current.files.map(r=>[r.path,r]));for(const row of expected.files)assert.ok(equal(actual.get(row.path),row),'tree byte/mode changed: '+row.path)
 assert.equal(expected.directoryModes.length,expected.directories.length,'all directory modes anchored')
 sameSet(expected.directoryModes.map(r=>r.path),expected.directories,label+' directory-mode keys')
 const modes=new Map(current.directoryModes.map(r=>[r.path,r.mode]));for(const row of expected.directoryModes)assert.equal(modes.get(row.path),row.mode,'directory mode changed: '+row.path)
 return {files:current.files.length,directories:current.directories.length,fileBytesShaModesEqual:true,directoryModesEqual:true,exactSets:true,current}
}
function write(name,value){assertBrowserEvidenceWritable(dir);writeFileSync(join(dir,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'})}

const partial={startedAt}
try{
 const baselinePath=root+'/baseline.json',baseline=json(baselinePath),scriptPath=relative(repo,fileURLToPath(import.meta.url)),scriptBefore=identity(scriptPath)
 const authorityPaths=[baselinePath,root25Marker,anchorPath,p3AnchorPath,...baseline.masters.map(r=>root+'/'+r.path.split('/').at(-1)+'.baseline')]
 const authorityBefore=authorityPaths.map(identity)
 assert.equal(baseline.sourceAndAssets.length,520);assert.equal(baseline.seals.length,112)
 const p3=Object.values(baseline.priorFiles).filter(r=>!r.path.startsWith('goal-1/'));assert.equal(p3.length,26);sameSet(p3.map(r=>r.path),p3.map(r=>r.path),'P3 unique')
 const p3Rows=p3.map(exact);partial.p3={count:26,allEqual:true}
 const oldMarkers=baseline.seals.map(exact);partial.oldMarkers={count:112,allEqual:true,scope:'baseline-listed marker identity only, not all old payloads'}
 assert.ok(baseline.seals.some(r=>r.path===root25Marker),'root25 marker external baseline anchor required')
 const root25=json(root25Marker),anchorRow=root25.files.find(r=>r.path===anchorPath),p3AnchorRow=root25.files.find(r=>r.path===p3AnchorPath)
 assert.ok(anchorRow&&p3AnchorRow);exact(anchorRow);exact(p3AnchorRow)
 const root19Expected=json(anchorPath);assert.equal(root19Expected.files.length,1197);assert.equal(root19Expected.directories.length,110)
 const root19='goal-1/evidence/t17-acceptance-19';assert.equal(lstatSync(resolve(repo,root19,'sealed-evidence.json'),{throwIfNoEntry:false}),undefined,'no new root19 marker')
 const root19Result=verifyTree(root19Expected,tree(root19),root19)
 const knownRoot19=Object.values(baseline.priorFiles).filter(r=>r.path.startsWith(root19+'/')),anchorMap=new Map(root19Expected.files.map(r=>[r.path,r]))
 for(const row of knownRoot19)assert.ok(equal(row,anchorMap.get(row.path)),'partial baseline differs from full anchor: '+row.path)
 partial.root19={files:root19Result.files,directories:root19Result.directories,baselineKnownSubset:knownRoot19.length}
 const p3Master=json(p3AnchorPath).master
 const masters=baseline.masters.map(expected=>{
  const actual=exact(expected),copyPath=root+'/'+expected.path.split('/').at(-1)+'.baseline',copy=bytes(copyPath),current=bytes(expected.path)
  assert.ok(current.equals(copy),'whole master differs from baseline copy: '+expected.path)
  const anchor=p3Master.find(r=>r.path===expected.path).p3,block=current.subarray(anchor.offset,anchor.offset+anchor.bytes),lineFeeds=[...block].filter(x=>x===10).length
  assert.equal(anchor.bytes,2304);assert.equal(anchor.lines,14);assert.equal(lineFeeds,14);assert.equal(hash(block),anchor.sha256);assert.equal(current.indexOf(block),anchor.offset);assert.equal(current.indexOf(block,anchor.offset+1),-1)
  return {path:expected.path,actual,baselineCopy:identity(copyPath),wholeBaselineEqual:true,p3Block:{offset:anchor.offset,bytes:2304,lineFeeds,sha256:anchor.sha256,unique:true,source:p3AnchorPath}}
 })
 const originalInput=exact(baseline.originalInput);assert.equal(originalInput.bytes,61);assert.equal(originalInput.sha256,'20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1')
 const sealed=baseline.lastSealed.map(entry=>{
  const marker=exact(entry.marker),index=json(entry.marker.path);assert.equal(index.selfExcluded,'sealed-evidence.json');assert.equal(index.files.length,entry.ordinaryFiles);assert.equal(index.directories.length,entry.directories)
  for(const row of index.files)assert.ok(row.path.startsWith(entry.root+'/')&&row.path!==entry.marker.path,'invalid payload path')
  return {root:entry.root,marker,...verifyTree(index,tree(entry.root,{excludeRootMarker:true}),entry.root)}
 })
 assert.deepEqual(sealed.map(r=>[r.files,r.directories]),[[351,30],[28,1]])
 const baseRows=baseline.sourceAndAssets,baseMap=new Map(baseRows.map(r=>[r.path,r])),fixed=baseRows.filter(r=>!['src','assets','public'].includes(r.path.split('/')[0])).map(r=>r.path)
 const currentSource=[...tree('src').files,...tree('assets').files,...tree('public').files,...fixed.map(identity)].sort((a,b)=>a.path.localeCompare(b.path))
 const currentMap=new Map(currentSource.map(r=>[r.path,r]));sameSet([...baseMap.keys()],baseRows.map(r=>r.path),'source baseline unique')
 const missing=baseRows.filter(r=>!currentMap.has(r.path)).map(r=>r.path),changed=baseRows.filter(r=>currentMap.has(r.path)&&!equal(r,currentMap.get(r.path))).map(r=>({before:r,after:currentMap.get(r.path)})),added=currentSource.filter(r=>!baseMap.has(r.path)),unchanged=baseRows.filter(r=>currentMap.has(r.path)&&equal(r,currentMap.get(r.path)))
 const disallowed=[...changed.map(r=>r.after.path),...added.map(r=>r.path)].filter(p=>!p.startsWith('src/ui/'))
 assert.equal(currentSource.length,530);assert.equal(missing.length,0);assert.equal(disallowed.length,0)
 const nonUi=baseRows.filter(r=>!r.path.startsWith('src/ui/'));for(const row of nonUi)assert.ok(equal(row,currentMap.get(row.path)),'non-UI changed: '+row.path)
 const authorityAfter=authorityPaths.map(identity);assert.deepEqual(authorityAfter,authorityBefore,'authority changed during read')
 assert.deepEqual(baseline.seals.map(exact),oldMarkers,'marker changed during read');assert.deepEqual(p3.map(exact),p3Rows);baseline.masters.forEach(exact);exact(baseline.originalInput)
 const sourceAfter=currentSource.map(r=>identity(r.path));assert.deepEqual(sourceAfter,currentSource,'source changed during read')
 assert.deepEqual(identity(scriptPath),scriptBefore,'checker changed during read')
 const result={startedAt,completedAt:new Date().toISOString(),passed:true,baseline:identity(baselinePath),script:scriptBefore,p3:{count:26,allBytesShaModesEqual:true,rows:p3Rows},masters,oldSealMarkers:{count:112,allBytesShaModesEqual:true,stableDuringRead:true,rows:oldMarkers,scope:'Marker identities only except specified root19/root28/post trees'},root19:{anchor:identity(anchorPath),anchorIndexEntry:anchorRow,root25Marker:identity(root25Marker),anchorBoundByBaselineRoot25Marker:true,baselineKnownSubset:knownRoot19.length,...root19Result},sealed,originalInput,source:{scope:'same baseline src/assets/public and explicit root configuration universe; not whole repository',baseline:520,current:530,unchanged:unchanged.length,changed,added,missing,disallowed,nonUiCount:nonUi.length,nonUiAllEqual:true,currentRows:currentSource,stableDuringRead:true},authorityBefore,authorityAfter,boundaries:['No Git, source/master/old evidence writes, game commands, replay, test suite, network, browser or compatibility actions.','Old marker identities are anchored to this baseline; only the named root19/root28/post payload sets were fully rechecked.','Three masters equal the entire opening baseline now; future append/commit requires its own evidence and is not approved here.','Only the baseline source/asset universe and P3 paths are covered; no whole-repository unchanged or gameplay-completion claim.']}
 write('result.json',result);write('source-diff.json',{baseline:520,current:530,unchanged:unchanged.length,changed,added,missing,disallowed,nonUiCount:nonUi.length,nonUiAllEqual:true})
 console.log(JSON.stringify({passed:true,p3:26,masters:masters.map(r=>({path:r.path,bytes:r.actual.bytes,wholeBaselineEqual:true,p3:r.p3Block})),markers:112,root19:{files:1197,directories:110,baselineKnownSubset:knownRoot19.length,anchor:identity(anchorPath)},sealed:sealed.map(r=>({root:r.root,files:r.files,directories:r.directories,marker:r.marker})),originalInput,source:{baseline:520,current:530,unchanged:unchanged.length,changed:changed.map(r=>r.after.path),added:added.map(r=>r.path),missing,disallowed,nonUi:nonUi.length,nonUiAllEqual:true},authorityAndSourceStable:true},null,2))
}catch(error){write('failure-r1.json',{...partial,completedAt:new Date().toISOString(),passed:false,error:String(error),stack:error?.stack});console.error(String(error?.stack??error));process.exitCode=1}
