import {readFileSync,writeFileSync,readdirSync,lstatSync} from 'node:fs'
import {resolve,join,relative,isAbsolute} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs'

const project=fileURLToPath(new URL('../../../../',import.meta.url))
const output=fileURLToPath(new URL('./',import.meta.url))
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const json=path=>JSON.parse(readFileSync(resolve(project,path),'utf8'))
const errors=[]
function observed(path){
 const absolute=resolve(project,path),stat=lstatSync(absolute,{throwIfNoEntry:false})
 if(!stat)return {path,exists:false}
 if(stat.isSymbolicLink()||!stat.isFile())return {path,exists:true,regularFile:false,fullMode:stat.mode}
 const bytes=readFileSync(absolute)
 return {path,exists:true,regularFile:true,bytes:bytes.length,sha256:hash(bytes),mode:stat.mode&0o777,fullMode:stat.mode}
}
function compare(expected,path=expected.path){
 const actual=observed(path),matches={exists:actual.exists&&actual.regularFile===true,bytes:actual.bytes===expected.bytes,sha256:actual.sha256===expected.sha256,mode:Object.hasOwn(expected,'mode')?actual.mode===expected.mode:null}
 return {path,expected:{...expected,path},actual,matches,passed:matches.exists&&matches.bytes&&matches.sha256&&matches.mode!==false}
}
function safeRelative(path){return typeof path==='string'&&path.length>0&&!isAbsolute(path)&&!path.split('/').includes('..')&&path.split('/').every(Boolean)}
function sealCheck(root,format){
 const markerPath=root+'/sealed-evidence.json',marker=json(markerPath)
 if(marker.format!==format||marker.selfExcluded!=='sealed-evidence.json'||!Array.isArray(marker.files))throw Error('UNRECOGNIZED_ORIGINAL_SEAL_FORMAT:'+root)
 const expectedPaths=marker.files.map(f=>f.path)
 if(expectedPaths.some(path=>!safeRelative(path))||new Set(expectedPaths).size!==expectedPaths.length||expectedPaths.includes(marker.selfExcluded))throw Error('INVALID_ORIGINAL_SEAL_PATH_SET:'+root)
 const actualFiles=[],unsupported=[]
 function walk(dir){
  for(const name of readdirSync(dir)){
   const path=join(dir,name),stat=lstatSync(path),local=relative(resolve(project,root),path)
   if(stat.isSymbolicLink()){unsupported.push({path:local,type:'symbolic-link'});continue}
   if(stat.isDirectory())walk(path)
   else if(stat.isFile()){if(local!==marker.selfExcluded)actualFiles.push(local)}
   else unsupported.push({path:local,type:'non-regular'})
  }
 }
 const rootStat=lstatSync(resolve(project,root))
 if(rootStat.isSymbolicLink()||!rootStat.isDirectory())throw Error('SEALED_ROOT_NOT_ORIGINAL_DIRECTORY:'+root)
 walk(resolve(project,root));actualFiles.sort()
 const missing=expectedPaths.filter(p=>!actualFiles.includes(p)),added=actualFiles.filter(p=>!expectedPaths.includes(p))
 const files=marker.files.map(f=>compare(f,root+'/'+f.path)),failures=files.filter(f=>!f.passed)
 const result={root,format:marker.format,selfExcluded:marker.selfExcluded,markerCurrent:observed(markerPath),expectedCount:expectedPaths.length,actualCount:actualFiles.length,missing,added,unsupported,modeFields:files.filter(f=>f.matches.mode!==null).length,modeNotRecorded:files.filter(f=>f.matches.mode===null).map(f=>f.path),modeMask:'stat.mode & 0777, matching the decimal permission values recorded by these markers',files,passed:missing.length===0&&added.length===0&&unsupported.length===0&&failures.length===0}
 if(!result.passed)errors.push({kind:'sealed-root',root,missing,added,unsupported,failures:failures.map(f=>f.path)})
 return result
}

assertBrowserEvidenceWritable(output)
const startedAt=new Date().toISOString(),inputs=json('goal-1/evidence/t17-acceptance-22/preservation-final-r1/inputs.json')
const sealed=[sealCheck('goal-1/evidence/t17-acceptance-21','t17-s1-original-bytes-v1'),sealCheck('goal-1/evidence/t17-s1-opening-post-commit-01','t17-s1-post-original-bytes-v1')]
const baseline=json('goal-1/evidence/t17-acceptance-22/source-baseline.json'),r4=json('goal-1/evidence/t17-acceptance-22/build-r4/source-before.json')
const excludedS2Ui=baseline.files.filter(f=>r4.files.find(g=>g.path===f.path)?.sha256!==f.sha256).map(f=>f.path)
if(baseline.files.length!==408||excludedS2Ui.length!==12||excludedS2Ui.some(p=>!p.startsWith('src/ui/')))throw Error('ORIGINAL_BASELINE_SCOPE_REQUIRES_REVIEW')
// This checks 396 baseline members only; the twelve active S2 paths are never read here.
const kept=baseline.files.filter(f=>!excludedS2Ui.includes(f.path)).map(f=>compare(f)),baselineFailures=kept.filter(f=>!f.passed)
if(baselineFailures.length)errors.push({kind:'baseline-preservation',paths:baselineFailures.map(f=>f.path)})
const group=path=>path.startsWith('src/')?path.split('/')[1]:path.startsWith('assets/')?'asset':'config'
const categories={};for(const f of kept){const category=group(f.path);categories[category]=(categories[category]??0)+1}
const baselineResult={originalCount:408,scope:'408 baseline minus the 12 previously registered S2 UI paths derived from the frozen R4 snapshot; no current whole-415 freeze',excludedS2Ui,checkedCount:kept.length,nonUiCount:kept.filter(f=>!f.path.startsWith('src/ui/')).length,unchangedOtherUiCount:kept.filter(f=>f.path.startsWith('src/ui/')).length,categories,files:kept,passed:baselineFailures.length===0,modeCompared:kept.filter(f=>f.matches.mode!==null).length,modeNotRecorded:kept.filter(f=>f.matches.mode===null).length}

const historicalP3=json('goal-1/evidence/t17-acceptance-21/p3-source-preservation-r1.json')
const declaredUntracked=[
 'scripts/browser_evidence_guard.d.mts','scripts/collect_relay_critical_pilot.ts','scripts/relay-critical-audit.test.ts','scripts/relay-critical-audit.ts','scripts/relay-critical-evidence.ts','scripts/relay-critical-run.test.ts','scripts/relay-critical-run.ts','scripts/verify_relay_critical_pilot.ts',
 'src/core/relay-knowledge.ts','src/core/relay-read-boundary.test.ts',
 'src/testing/relay-critical-authority.ts','src/testing/relay-critical-context.ts','src/testing/relay-critical-lifecycle.ts','src/testing/relay-critical-metering.ts','src/testing/relay-critical-money.test.ts','src/testing/relay-critical-money.ts','src/testing/relay-critical-service.ts','src/testing/relay-critical-supply.ts',
]
const p3Names=[...new Set([...historicalP3.files.map(f=>f.path),...declaredUntracked,'vitest.config.ts'])]
const earlierSrc=json('goal-1/evidence/t17-acceptance-21/opening-source-baseline.json')
const p3Files=p3Names.map(path=>{
 const expected=baseline.files.find(f=>f.path===path)??earlierSrc.files.find(f=>f.path===path)
 const origin=baseline.files.some(f=>f.path===path)?'root22/source-baseline.json':earlierSrc.files.some(f=>f.path===path)?'root21/opening-source-baseline.json':null
 const historical=historicalP3.files.find(f=>f.path===path)
 return {path,classification:declaredUntracked.includes(path)?'root-declared pre-existing untracked P3 source':historical?'historically identified modified P3 source':'root-declared pre-existing config WIP',currentGitClassificationChecked:false,baselineSource:origin,historyConsistent:historical&&expected?historical.sha256===expected.sha256&&historical.bytes===expected.bytes:null,...(expected?{comparison:compare(expected,path)}:{current:observed(path),priorBytesVerified:false})}
})
const p3Failures=p3Files.filter(f=>f.comparison?!f.comparison.passed||f.historyConsistent===false:!f.current.exists||f.current.regularFile!==true)
if(p3Failures.length)errors.push({kind:'p3-preservation',paths:p3Failures.map(f=>f.path)})
const p3={sourceEntries:p3Names.length,historicalModified:historicalP3.files.length,rootDeclaredUntracked:declaredUntracked.length,configEntries:1,byteVerified:p3Files.filter(f=>f.comparison).length,currentOnly:p3Files.filter(f=>!f.comparison).length,files:p3Files,passed:p3Failures.length===0,testsExecuted:0,formal62Or22ClaimedPassed:false}
const commitReadback=json('goal-1/evidence/t17-s1-opening-post-commit-01/feature-commit-readback.json')
const originalInput=compare({path:'goal-1/input.md',bytes:61,sha256:commitReadback.originalInputSha256})
if(originalInput.expected.sha256!=='20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1'||!originalInput.passed)errors.push({kind:'original-goal-input'})
const root21MarkerMatchesPostAnchor=sealed[0].markerCurrent.sha256===commitReadback.sealedMarkerSha256
if(!root21MarkerMatchesPostAnchor)errors.push({kind:'root21-marker-anchor'})
const root19=['input.md','plan.md','tasks.md'].map(name=>observed('goal-1/evidence/t17-acceptance-19/'+name))
if(root19.some(f=>!f.exists||!f.regularFile))errors.push({kind:'root19-triple-missing'})
const inputReadback=inputs.files.map(f=>compare(f)),changedInputs=inputReadback.filter(f=>!f.passed)
if(changedInputs.length)errors.push({kind:'verification-input-drift',paths:changedInputs.map(f=>f.path)})
const result={startedAt,completedAt:new Date().toISOString(),passed:errors.length===0,errors,sealed,root21MarkerMatchesPostAnchor,baseline:baselineResult,p3,originalInput,root19:{scope:'Existence/current identity only; no original byte baseline for these three files was supplied',files:root19,priorBytesVerified:false,otherRoot19EvidenceSetChecked:false},inputReadback,limits:{fullCurrentS2UiFreezePerformed:false,newS2FilesCompared:false,gitExecuted:false,currentGitClassificationVerified:false,browserOrHttpUsed:false,unitOrGameTestsExecuted:false,servicesTouched:false,srcOrOldEvidenceWritten:false,baselineModesNotClaimed:true}}
assertBrowserEvidenceWritable(output)
writeFileSync(join(output,'result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'})
process.stdout.write(JSON.stringify({passed:result.passed,errors,sealed:sealed.map(s=>({root:s.root,files:s.actualCount,modeCompared:s.modeFields,passed:s.passed})),baseline:{checked:kept.length,categories,modeCompared:baselineResult.modeCompared,modeNotRecorded:baselineResult.modeNotRecorded},p3:{files:p3.sourceEntries,byteVerified:p3.byteVerified,currentOnly:p3.currentOnly,passed:p3.passed},goalInput:{bytes:originalInput.actual.bytes,sha256:originalInput.actual.sha256,passed:originalInput.passed}},null,2)+'\n')
process.exitCode=result.passed?0:1
