import {readFileSync,writeFileSync,lstatSync,readdirSync} from 'node:fs'
import {resolve,dirname,join,relative,sep} from 'node:path'
import {createHash} from 'node:crypto'
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs'

const repo=process.cwd(),root='goal-1/evidence/t17-acceptance-24/preservation-r1',parent=dirname(root)
assertBrowserEvidenceWritable(root)
const hash=b=>createHash('sha256').update(b).digest('hex'),json=p=>JSON.parse(readFileSync(p,'utf8')),errors=[],limits=[]
const startedAt=new Date().toISOString(),beforeInputs=json(root+'/inputs-before.json').files
function safe(path){
 const full=resolve(path)
 if(full!==repo&&!full.startsWith(repo+sep))throw Error('PATH_OUTSIDE_REPOSITORY:'+path)
 for(let p=dirname(full);;p=dirname(p)){
  const s=lstatSync(p);if(s.isSymbolicLink()||!s.isDirectory())throw Error('ANCESTOR_NOT_REAL_DIRECTORY:'+p)
  if(dirname(p)===p)break
 }
 return full
}
function identity(path){
 try{
  const full=safe(path),s=lstatSync(full,{throwIfNoEntry:false})
  if(!s)return {path,exists:false}
  const result={path,exists:true,regular:s.isFile()&&!s.isSymbolicLink(),mode:s.mode&0o777}
  return result.regular?{...result,bytes:s.size,sha256:hash(readFileSync(full))}:result
 }catch(error){return {path,error:String(error)}}
}
function compare(expected){
 const actual=identity(expected.path),fields=['bytes','sha256',...(expected.mode===undefined?[]:['mode'])]
 return {expected,actual,modeRecorded:expected.mode!==undefined,matches:actual.regular===true&&fields.every(k=>expected[k]===actual[k])}
}
function walk(path,out={files:[],directories:[],unsupported:[]}){
 const full=safe(path),s=lstatSync(full),name=relative(repo,full).split(sep).join('/')
 if(s.isSymbolicLink())out.unsupported.push(name)
 else if(s.isDirectory()){out.directories.push(name);for(const n of readdirSync(full).sort())walk(join(name,n),out)}
 else if(s.isFile())out.files.push(name)
 else out.unsupported.push(name)
 return out
}
const baseline=json(parent+'/source-baseline.json'),git=json(parent+'/git-baseline.json'),masters=json(parent+'/master-baseline.json')
const c1Allowed=new Set([
 'App.tsx','CourseCommandDetails.tsx','CoursePanel.tsx','CoursePreparation.tsx','NarrativeScene.tsx','OpeningMoment.tsx','OpeningObject.tsx','RoomMoment.tsx','SceneJournal.tsx','course-scene-progress.test.ts','course-scene-progress.ts','game-text.ts','game-types.ts','player-thread.ts','scene-result.ts','season-focus-preference.test.ts','season-focus-preference.ts','season-thread.ts',
 'CoursePreparationDetails.test.tsx','CoursePreparationDetails.tsx','CourseSceneChoice.license.test.tsx','CourseSceneChoice.reselect.test.tsx','CourseSceneChoice.tsx','course-play.css','course-player-thread.test.ts','course-player-thread.ts','course-scene-choice.test.tsx','course-scene-draft.test.ts','course-scene-draft.ts','course-scene-result.ts','course-target.test.tsx'
].map(p=>'src/ui/'+p))
const sourceRows=baseline.files.map(compare),sourceTree=walk('src'),baseSet=new Set(baseline.files.map(f=>f.path)),currentSet=new Set(sourceTree.files)
const added=sourceTree.files.filter(p=>!baseSet.has(p)).map(identity),missing=baseline.files.filter(f=>!currentSet.has(f.path)).map(f=>f.path),changed=sourceRows.filter(r=>!r.matches)
const nonUi=sourceRows.filter(r=>!r.expected.path.startsWith('src/ui/')),ui=sourceRows.filter(r=>r.expected.path.startsWith('src/ui/'))
const disallowed=[...changed.map(r=>r.expected.path),...added.map(r=>r.path)].filter(p=>!c1Allowed.has(p))
if(baseline.files.length!==416||sourceTree.unsupported.length||missing.length||disallowed.length||nonUi.some(r=>!r.matches))errors.push('SOURCE_CLASSIFICATION_OR_NON_UI_MISMATCH')
limits.push('The root24 source baseline records bytes/SHA only. Current source modes are observed; historical source-mode equality is not claimed from that baseline.')
const oldSource=json('goal-1/evidence/t17-acceptance-23/source-baseline.json'),oldP3=json('goal-1/evidence/t17-acceptance-23/preservation-r2/result.json').p3.rows
const p3Paths=git.status.split('\n').flatMap(line=>{const path=line.match(/(?:^|\s)((?:src|scripts)\/\S+|vitest\.config\.ts)$/)?.[1];return path?[{path,openingStatus:line,classification:line.startsWith('??')?'untracked at C1 opening':'modified tracked at C1 opening'}]:[]})
const p3=p3Paths.map(row=>{
 const opening=baseline.files.find(f=>f.path===row.path),earlier=oldSource.files.find(f=>f.path===row.path),old=oldP3.find(f=>f.expected.path===row.path)
 const expected=opening??earlier??old?.expected
 if(!expected)return {...row,actual:identity(row.path),matches:null,baseline:'no recorded original bytes found'}
 const modeAnchor=expected.mode===undefined?earlier??old?.expected:null
 return {...row,...compare(expected),baseline:opening?'root24/source-baseline':earlier?'root23/source-baseline':'sealed root23/preservation-r2 expectation from S2 final observation',earlierModeCheck:modeAnchor?.mode!==undefined?{source:earlier?'root23/source-baseline':'root23/preservation-r2',expectedMode:modeAnchor.mode,actualMode:identity(row.path).mode,matches:identity(row.path).mode===modeAnchor.mode}:null}
})
if(p3.length!==26||p3.some(r=>r.matches!==true||r.earlierModeCheck?.matches===false))errors.push('SPECIFIED_P3_SOURCE_MISMATCH')
limits.push('P3 labels are the opening status, not a new index/status inspection. Seventeen src hashes use C1 opening; vitest.config uses S3-V1 opening; eight script hashes use the sealed earlier S2-final observation, not undocumented pre-S2 bytes. No P3 functional test is claimed.')
const originalInput=compare({path:'goal-1/input.md',...git.input})
if(!originalInput.matches||originalInput.actual.bytes!==61||originalInput.actual.sha256!=='20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1')errors.push('ORIGINAL_INPUT_MISMATCH')
const master=masters.map(expected=>{
 const bytes=readFileSync(safe(expected.path)),prefix=bytes.subarray(0,expected.bytes),tail=bytes.subarray(expected.bytes),text=tail.toString('utf8'),headings=text.split('\n').filter(l=>/^#{1,6} /.test(l))
 const row={expected:{path:expected.path,bytes:expected.bytes,sha256:expected.sha256},actual:identity(expected.path),baselineTextInternallyMatches:Buffer.byteLength(expected.text)===expected.bytes&&hash(Buffer.from(expected.text))===expected.sha256,originalPrefixMatches:prefix.length===expected.bytes&&hash(prefix)===expected.sha256,tail:{bytes:tail.length,sha256:hash(tail),text,headings,onlyC1:tail.length===0||text.startsWith('\n\n## 当前S3-C1 ')&&headings.every(h=>h.includes('S3-C1'))}}
 if(!row.baselineTextInternallyMatches||!row.originalPrefixMatches||!row.tail.onlyC1)errors.push('MASTER_PREFIX_OR_C1_TAIL_MISMATCH:'+expected.path)
 return row
})
const sealed=git.oldSeals.map(anchor=>{
 const directory=dirname(anchor.path),markerBefore=identity(anchor.path),marker=json(anchor.path)
 if(marker.selfExcluded!=='sealed-evidence.json'||!Array.isArray(marker.files))throw Error('UNRECOGNIZED_SEAL_FORMAT:'+directory)
 const tree=walk(directory),expected=marker.files.map(f=>f.path).sort(),actual=tree.files.filter(p=>p!==anchor.path).sort()
 const rows=marker.files.map(f=>{if(!resolve(f.path).startsWith(resolve(directory)+sep))throw Error('SEALED_ENTRY_ESCAPES_ROOT');return compare(f)})
 const fileMissing=expected.filter(p=>!actual.includes(p)),fileAdded=actual.filter(p=>!expected.includes(p)),duplicateEntries=expected.filter((p,i)=>i>0&&expected[i-1]===p)
 const directoriesRecorded=Array.isArray(marker.directories),directories=directoriesRecorded?{expected:marker.directories.length,actual:tree.directories.length,missing:marker.directories.filter(p=>!tree.directories.includes(p)),added:tree.directories.filter(p=>!marker.directories.includes(p))}:{expected:null,actual:tree.directories.length,historicalSetUnknown:true}
 const markerAfter=identity(anchor.path),result={root:directory,format:marker.format,expectedFiles:expected.length,actualFiles:actual.length,filesExcludingSelf:true,missing:fileMissing,added:fileAdded,duplicateEntries,unsupported:tree.unsupported,directories,modeRecorded:rows.filter(r=>r.modeRecorded).length,marker:{openingSha256:anchor.sha256,before:markerBefore,after:markerAfter,openingBytesMatch:markerBefore.sha256===anchor.sha256,stableDuringRead:markerAfter.sha256===markerBefore.sha256&&markerAfter.bytes===markerBefore.bytes&&markerAfter.mode===markerBefore.mode,historicalModeUnknown:true},rows}
 result.matches=!fileMissing.length&&!fileAdded.length&&!duplicateEntries.length&&!tree.unsupported.length&&rows.every(r=>r.matches)&&result.marker.openingBytesMatch&&result.marker.stableDuringRead&&(!directoriesRecorded||!directories.missing.length&&!directories.added.length)
 if(!result.matches)errors.push('SEALED_TREE_MISMATCH:'+directory)
 return result
})
limits.push('Two old sealed trees are checked, not every historical evidence root. Marker bytes are anchored to C1 git-baseline; marker historical modes were not recorded there. Entry modes are verified only where each marker records them; the post marker has no historical directory list.')
const sourceEnd=baseline.files.map(compare),sourceChangesDuringRead=sourceRows.filter((r,i)=>r.actual.sha256!==sourceEnd[i].actual.sha256||r.actual.bytes!==sourceEnd[i].actual.bytes).map(r=>({path:r.expected.path,before:r.actual,after:sourceEnd.find(x=>x.expected.path===r.expected.path).actual}))
if(sourceChangesDuringRead.some(r=>!['src/ui/course-scene-progress.ts','src/ui/course-scene-progress.test.ts'].includes(r.path)))errors.push('UNEXPECTED_SOURCE_DRIFT_DURING_AUDIT')
const inputReadback=beforeInputs.map(compare);if(inputReadback.some(r=>!r.matches))errors.push('AUDIT_INPUT_CHANGED')
const result={startedAt,completedAt:new Date().toISOString(),passed:errors.length===0,errors,source:{baselineCount:baseline.files.length,currentFiles:sourceTree.files.length,nonUiCount:nonUi.length,nonUiMatches:nonUi.every(r=>r.matches),uiCount:ui.length,uiUnchanged:ui.filter(r=>r.matches).length,uiChanged:changed.filter(r=>r.expected.path.startsWith('src/ui/')).length,addedCount:added.length,missing,disallowed,unsupported:sourceTree.unsupported,changed,added,allRows:sourceRows,endRows:sourceEnd,sourceChangesDuringRead,allowedC1Paths:[...c1Allowed].sort(),wholeSourceFrozen:false},p3:{count:p3.length,openingSrc:p3.filter(r=>r.baseline==='root24/source-baseline').length,allMatch:p3.every(r=>r.matches),rows:p3},originalInput,master,sealed,inputReadback,limits,actions:{productionWrites:false,oldEvidenceWrites:false,git:false,gameOrUnitTests:false,compatibility:false,browser:false}}
assertBrowserEvidenceWritable(root);writeFileSync(root+'/result.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:result.passed,errors,source:{baseline:416,current:sourceTree.files.length,nonUi:nonUi.length,nonUiMatch:result.source.nonUiMatches,uiChanged:result.source.uiChanged,new:added.length,sourceChangesDuringRead},p3:{count:p3.length,allMatch:result.p3.allMatch},input:originalInput.matches,masters:master.map(m=>({path:m.expected.path,prefix:m.originalPrefixMatches,tailBytes:m.tail.bytes,onlyC1:m.tail.onlyC1})),sealed:sealed.map(s=>({root:s.root,expected:s.expectedFiles,actual:s.actualFiles,modeRecorded:s.modeRecorded,matches:s.matches,markerAnchored:s.marker.openingBytesMatch,unsupported:s.unsupported})),inputReadback:inputReadback.every(r=>r.matches)},null,2))
process.exitCode=errors.length?1:0
