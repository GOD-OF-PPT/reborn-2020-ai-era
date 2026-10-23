import {readFileSync,writeFileSync,lstatSync,readdirSync} from 'node:fs'
import {resolve,dirname,join,relative,sep} from 'node:path'
import {createHash} from 'node:crypto'
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs'

const repo=process.cwd(),root='goal-1/evidence/t17-acceptance-25/preservation-r1',parent=dirname(root)
assertBrowserEvidenceWritable(root)
const hash=b=>createHash('sha256').update(b).digest('hex'),json=p=>JSON.parse(readFileSync(p,'utf8')),errors=[],startedAt=new Date().toISOString()
function identity(path){
 const full=resolve(path)
 if(!full.startsWith(repo+sep))throw Error('PATH_OUTSIDE_REPOSITORY')
 for(let p=dirname(full);;p=dirname(p)){const s=lstatSync(p);if(s.isSymbolicLink()||!s.isDirectory())throw Error('UNSAFE_ANCESTOR:'+p);if(dirname(p)===p)break}
 const s=lstatSync(full,{throwIfNoEntry:false})
 if(!s)return {path,exists:false}
 return {path,exists:true,regular:s.isFile()&&!s.isSymbolicLink(),mode:s.mode&0o777,...(s.isFile()&&!s.isSymbolicLink()?{bytes:s.size,sha256:hash(readFileSync(full))}:{})}
}
function compare(expected){const actual=identity(expected.path);return {expected,actual,matches:actual.regular===true&&['bytes','sha256',...(expected.mode===undefined?[]:['mode'])].every(k=>expected[k]===actual[k])}}
function walk(path,out={files:[],directories:[],unsupported:[],directoryModes:[]}){
 const s=lstatSync(path)
 if(s.isSymbolicLink())out.unsupported.push(path)
 else if(s.isDirectory()){out.directories.push(path);out.directoryModes.push({path,mode:s.mode&0o777});for(const n of readdirSync(path).sort())walk(join(path,n),out)}
 else if(s.isFile())out.files.push(path)
 else out.unsupported.push(path)
 return out
}
const authority=[parent+'/git-baseline.json',parent+'/source-baseline.json',parent+'/master-baseline.json','goal-1/evidence/t17-acceptance-24/preservation-r1/result.json','goal-1/evidence/t17-acceptance-24/master-baseline.json','goal-1/evidence/t17-s3-course-preparation-post-commit-01/feature-stage-manifest.json'].map(identity)
const opening=json(parent+'/git-baseline.json'),baseline=json(parent+'/source-baseline.json'),masters=json(parent+'/master-baseline.json')
const allowed=new Set([
 'App.tsx','CourseCommandDetails.tsx','CoursePanel.tsx','CourseSceneChoice.tsx','CourseStageChoice.tsx','NarrativeScene.tsx','OpeningMoment.tsx','OpeningObject.tsx','RoomMoment.tsx','SceneJournal.tsx','course-play.css','course-player-thread.ts','course-scene-progress.ts','course-scene-result.ts','game-types.ts','player-thread.ts','season-focus-preference.ts','season-thread.ts',
 'CourseTeachingChoice.test.tsx','CourseTeachingChoice.tsx','CourseTeachingDetails.test.tsx','CourseTeachingDetails.tsx','course-cohort-progress.test.ts','course-cohort-progress.ts','course-refund-result.test.ts','course-teaching-draft.test.ts','course-teaching-draft.ts','course-teaching-paper.ts','course-teaching-result.ts','course-teaching-target.test.tsx','course-teaching.css'
].map(p=>'src/ui/'+p))
const sourceRows=baseline.files.map(compare),sourceTree=walk('src'),baseSet=new Set(baseline.files.map(r=>r.path)),currentSet=new Set(sourceTree.files),changed=sourceRows.filter(r=>!r.matches),added=sourceTree.files.filter(p=>!baseSet.has(p)).map(identity),missing=baseline.files.filter(r=>!currentSet.has(r.path)).map(r=>r.path),disallowed=[...changed.map(r=>r.expected.path),...added.map(r=>r.path)].filter(p=>!allowed.has(p))
const nonUi=sourceRows.filter(r=>!r.expected.path.startsWith('src/ui/'))
if(baseline.files.length!==429||missing.length||disallowed.length||sourceTree.unsupported.length||nonUi.some(r=>!r.matches))errors.push('SOURCE_SCOPE_OR_NON_UI_CHANGED')
const priorP3=json('goal-1/evidence/t17-acceptance-24/preservation-r1/result.json').p3.rows
const p3Opening=opening.status.split('\n').flatMap(line=>{const path=line.match(/(?:^|\s)((?:src|scripts)\/\S+|vitest\.config\.ts)$/)?.[1];return path?[{path,openingStatus:line}]:[]})
const p3=p3Opening.map(row=>{const prior=priorP3.find(r=>r.path===row.path),start=baseline.files.find(r=>r.path===row.path),expected=start??(prior?{...prior.expected,mode:prior.expected.mode??prior.earlierModeCheck?.expectedMode}:null);if(!expected)return {...row,matches:false,missingAnchor:true};return {...row,...compare(expected),anchor:start?'root25/source-baseline':'sealed root24/preservation-r1/result.json P3 exact prior manifest'}})
if(p3.length!==26||p3.some(r=>!r.matches))errors.push('P3_26_PATHS_CHANGED')
const previousMasters=json('goal-1/evidence/t17-acceptance-24/master-baseline.json'),stage=json('goal-1/evidence/t17-s3-course-preparation-post-commit-01/feature-stage-manifest.json')
const master=masters.map(row=>{
 const actual=identity(row.path),bytes=readFileSync(row.path),original=Buffer.from(row.text),prefix=bytes.subarray(0,row.bytes),after=bytes.subarray(row.bytes),old=previousMasters.find(r=>r.path===row.path),meta=stage.masters.find(r=>r.path===row.path)
 const oldBytes=Buffer.from(old.text),head=readFileSync(meta.proof).subarray(0,meta.headBytes);let offset=0,suffix=0;while(offset<Math.min(oldBytes.length,head.length)&&oldBytes[offset]===head[offset])offset++;while(suffix<Math.min(oldBytes.length-offset,head.length-offset)&&oldBytes[oldBytes.length-1-suffix]===head[head.length-1-suffix])suffix++;const p3Bytes=oldBytes.subarray(offset,oldBytes.length-suffix),removed=head.subarray(offset,head.length-suffix),openingP3=original.subarray(offset,offset+p3Bytes.length),currentP3=bytes.subarray(offset,offset+p3Bytes.length),lines=p3Bytes.toString('utf8').split('\n').length-1;if(removed.length!==0)errors.push('P3_NOT_A_SINGLE_INSERTION:'+row.path)
 const result={path:row.path,actual,opening:{bytes:row.bytes,sha256:row.sha256,textInternallyMatches:original.length===row.bytes&&hash(original)===row.sha256},openingPrefixPreserved:prefix.length===row.bytes&&hash(prefix)===row.sha256,currentC2Tail:{bytes:after.length,sha256:hash(after),headings:after.toString('utf8').split('\n').filter(l=>/^#{1,6} /.test(l))},p3:{offset,removedBytes:removed.length,bytes:p3Bytes.length,lines,sha256:hash(p3Bytes),openingMatches:p3Bytes.equals(openingP3),currentMatches:p3Bytes.equals(currentP3),anchor:'single 2304-byte insertion between root24 master-baseline.text and original HEAD prefix recovered from sealed C1 post intended text; not headBytes as offset'}}
 if(!result.opening.textInternallyMatches||!result.openingPrefixPreserved||p3Bytes.length!==2304||lines!==14||!result.p3.openingMatches||!result.p3.currentMatches)errors.push('MASTER_OR_P3_PREFIX_CHANGED:'+row.path)
 return result
})
const sealed=opening.oldSeals.map(anchor=>{
 const directory=dirname(anchor.path),markerBefore=identity(anchor.path),marker=json(anchor.path),tree=walk(directory),expected=marker.files.map(r=>r.path).sort(),actual=tree.files.filter(p=>p!==anchor.path).sort(),expectedDirectories=[...marker.directories].sort(),actualDirectories=[...tree.directories].sort()
 const rows=marker.files.map(entry=>{if(!resolve(entry.path).startsWith(resolve(directory)+sep))throw Error('SEALED_ENTRY_ESCAPE');return compare(entry)})
 const missing=expected.filter(p=>!actual.includes(p)),added=actual.filter(p=>!expected.includes(p)),duplicates=expected.filter((p,i)=>i&&expected[i-1]===p),directoryMissing=expectedDirectories.filter(p=>!actualDirectories.includes(p)),directoryAdded=actualDirectories.filter(p=>!expectedDirectories.includes(p)),markerAfter=identity(anchor.path)
 const result={root:directory,ordinaryFiles:{expected:expected.length,actual:actual.length,missing,added,duplicates},directories:{expected:expectedDirectories.length,actual:actualDirectories.length,missing:directoryMissing,added:directoryAdded,currentModes:tree.directoryModes,historicalModesRecorded:false},marker:{openingSha256:anchor.sha256,before:markerBefore,after:markerAfter,openingShaMatches:markerBefore.sha256===anchor.sha256,stableDuringRead:markerBefore.sha256===markerAfter.sha256&&markerBefore.bytes===markerAfter.bytes&&markerBefore.mode===markerAfter.mode,historicalModeRecorded:false},unsupported:tree.unsupported,allOrdinaryModesRecorded:marker.files.every(r=>r.mode!==undefined),rows}
 result.matches=marker.selfExcluded==='sealed-evidence.json'&&rows.every(r=>r.matches)&&!missing.length&&!added.length&&!duplicates.length&&!directoryMissing.length&&!directoryAdded.length&&!tree.unsupported.length&&result.marker.openingShaMatches&&result.marker.stableDuringRead
 if(!result.matches)errors.push('SEALED_EVIDENCE_MISMATCH:'+directory)
 return result
})
const originalInput=compare({path:'goal-1/input.md',...opening.originalInput})
if(!originalInput.matches)errors.push('ORIGINAL_INPUT_CHANGED')
const authorityEnd=authority.map(compare);if(authorityEnd.some(r=>!r.matches))errors.push('AUDIT_AUTHORITY_CHANGED_DURING_READ')
const result={startedAt,completedAt:new Date().toISOString(),passed:errors.length===0,errors,source:{scope:'exact src tree only; no whole-repository preservation claim',baselineCount:baseline.files.length,currentFiles:sourceTree.files.length,unchanged:sourceRows.filter(r=>r.matches).length,nonUiCount:nonUi.length,nonUiAllMatch:nonUi.every(r=>r.matches),changed,added,missing,disallowed,unsupported:sourceTree.unsupported,allowedC2Paths:[...allowed].sort(),allRows:sourceRows,currentSource:sourceTree.files.map(identity)},p3:{count:p3.length,allMatch:p3.every(r=>r.matches),rows:p3},master,sealed,originalInput,authority,authorityEnd,limits:['453+21 ordinary entries and both exact directory sets are anchored by the two old markers. Each ordinary entry records mode and is checked. Marker SHA is externally anchored to root25 git-baseline; its historical mode and directory historical modes are not recorded, so only current/stable-during-read modes are reported.','P3 checks exactly the 26 original source/script/config paths; the root19 directory and whole-repository history are not implied.','Current src changes are enumerated C2 UI only; unchanged baseline subset is not a whole-repository claim. Source may evolve after this snapshot; root will own final production build/Chrome/final readback.'],actions:{productionWrites:false,oldEvidenceWrites:false,git:false,gameOrUnitTests:false,compatibility:false,browser:false}}
assertBrowserEvidenceWritable(root);writeFileSync(root+'/result-r2.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:result.passed,errors,source:{baseline:baseline.files.length,current:sourceTree.files.length,unchanged:result.source.unchanged,nonUi:nonUi.length,nonUiAllMatch:result.source.nonUiAllMatch,changed:changed.length,added:added.length,missing,disallowed},p3:{count:p3.length,allMatch:result.p3.allMatch},masters:master.map(m=>({path:m.path,prefix:m.openingPrefixPreserved,p3:m.p3,currentTail:m.currentC2Tail})),sealed:sealed.map(s=>({root:s.root,ordinary:s.ordinaryFiles,directories:{expected:s.directories.expected,actual:s.directories.actual,missing:s.directories.missing,added:s.directories.added},marker:s.marker,matches:s.matches})),input:originalInput.matches},null,2))
process.exitCode=errors.length?1:0
