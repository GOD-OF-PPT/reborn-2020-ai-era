import {readFileSync,writeFileSync,lstatSync,readdirSync} from 'node:fs'
import {resolve,join,relative,sep} from 'node:path'
import {createHash} from 'node:crypto'
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs'

const repo=process.cwd(),root=resolve('goal-1/evidence/t17-acceptance-23/preservation-r2')
assertBrowserEvidenceWritable(root)
const hash=b=>createHash('sha256').update(b).digest('hex')
const json=path=>JSON.parse(readFileSync(path,'utf8'))
const errors=[],limits=[]
const relativePath=path=>relative(repo,path).split(sep).join('/')
function identity(path){
 const stat=lstatSync(path,{throwIfNoEntry:false})
 if(!stat)return {path,exists:false}
 const result={path,exists:true,regularFile:stat.isFile()&&!stat.isSymbolicLink(),mode:stat.mode&0o777}
 return result.regularFile?{...result,bytes:stat.size,sha256:hash(readFileSync(path))}:result
}
function compare(expected){
 const actual=identity(expected.path),fields=['bytes','sha256',...(expected.mode===undefined?[]:['mode'])]
 return {expected,actual,modeRecorded:expected.mode!==undefined,matches:actual.regularFile===true&&fields.every(key=>actual[key]===expected[key])}
}
function walk(path,unsupported=[]){
 const stat=lstatSync(path)
 if(stat.isSymbolicLink()){unsupported.push(relativePath(path));return []}
 if(stat.isFile())return [relativePath(path)]
 if(!stat.isDirectory()){unsupported.push(relativePath(path));return []}
 return readdirSync(path).sort().flatMap(name=>walk(join(path,name),unsupported))
}
const startedAt=new Date().toISOString(),inputs=json(join(root,'inputs-before.json')).files
const post='goal-1/evidence/t17-s2-season-post-commit-01'
const postFeature=json(post+'/feature-commit-readback.json')
const sealedRoots=['goal-1/evidence/t17-acceptance-22',post]
const sealed=sealedRoots.map(directory=>{
 const markerPath=directory+'/sealed-evidence.json',markerBefore=identity(markerPath),marker=json(markerPath),unsupported=[]
 if(marker.selfExcluded!=='sealed-evidence.json'||!Array.isArray(marker.files))throw Error('UNRECOGNIZED_SEAL_FORMAT:'+directory)
 const expected=marker.files.map(f=>f.path).sort(),actual=walk(resolve(directory),unsupported).filter(path=>path!==markerPath).sort()
 const rows=marker.files.map(f=>{
  if(!f.path.startsWith(directory+'/')||resolve(f.path).startsWith(resolve(directory)+sep)===false)throw Error('SEALED_PATH_ESCAPES_ROOT')
  return compare(f)
 })
 const missing=expected.filter(path=>!actual.includes(path)),added=actual.filter(path=>!expected.includes(path)),failed=rows.filter(row=>!row.matches)
 const anchor=directory===sealedRoots[0]?{path:post+'/feature-commit-readback.json',field:'sealedMarkerSha256',sha256:postFeature.sealedMarkerSha256,matches:markerBefore.sha256===postFeature.sealedMarkerSha256}:null
 const result={root:directory,format:marker.format,selfExcluded:marker.selfExcluded,expectedCount:expected.length,actualCount:actual.length,missing,added,unsupported,modeRecorded:rows.filter(row=>row.modeRecorded).length,markerBefore,independentMarkerAnchor:anchor,rows,passed:missing.length===0&&added.length===0&&unsupported.length===0&&failed.length===0&&anchor?.matches!==false}
 if(!result.passed)errors.push('SEALED_TREE_MISMATCH:'+directory)
 return result
})
limits.push('S2 post marker excludes itself; current identity and this check before/after equality are recorded. No earlier independent post-marker hash is claimed.')
const sourceBaseline=json('goal-1/evidence/t17-acceptance-23/source-baseline.json'),sourceMap=new Map(sourceBaseline.files.map(f=>[f.path,f]))
const oldPreservationPath='goal-1/evidence/t17-acceptance-22/preservation-final-r1/result.json',oldPreservation=json(oldPreservationPath)
const p3=oldPreservation.p3.files.map(row=>{
 const opening=sourceMap.get(row.path),expected=opening??row.current
 const check=compare(expected)
 return {...check,classification:row.classification,baselineSource:opening?'goal-1/evidence/t17-acceptance-23/source-baseline.json':oldPreservationPath+'#p3.files.current',baselinePeriod:opening?'S3 opening':'S2 final sealed observation',beforeS2OriginalBytesClaimed:opening?undefined:false}
})
if(p3.length!==26||p3.some(row=>!row.matches))errors.push('P3_SPECIFIED_SOURCE_MISMATCH')
limits.push('P3 historical tracked/untracked labels are carried from the original report; current Git classification and P3 functional tests are not checked. Eight script hashes prove equality to the sealed S2 final observation, not its previously unrecorded pre-S2 bytes.')
const prefixPath='goal-1/evidence/t17-acceptance-23/normal-prefix-r1/source-before.json',prefix=json(prefixPath)
const prefixGroups=Object.fromEntries(['runtime','protocol','reference','inputs'].map(group=>[group,prefix[group].map(compare)]))
const runtimeActual=['src/application','src/core','src/content','src/persistence'].flatMap(path=>walk(resolve(path))).filter(path=>path.endsWith('.ts')&&!path.endsWith('.test.ts')).sort()
const runtimeExpected=prefix.runtime.map(f=>f.path).sort()
const runtimeSet={expected:runtimeExpected.length,actual:runtimeActual.length,missing:runtimeExpected.filter(path=>!runtimeActual.includes(path)),added:runtimeActual.filter(path=>!runtimeExpected.includes(path))}
if(Object.values(prefixGroups).flat().length!==139||Object.values(prefixGroups).flat().some(row=>!row.matches)||runtimeSet.missing.length||runtimeSet.added.length)errors.push('PREFIX_SOURCE_OR_INPUT_MISMATCH')
limits.push('Prefix manifest records bytes and SHA only; current modes are observed but historical mode equality is not claimed. Hash preservation is not a new engine/Create replay acceptance.')
const masterBaseline=json('goal-1/evidence/t17-acceptance-23/master-baseline.json')
const originalInput=compare(masterBaseline.find(f=>f.path==='goal-1/input.md'))
if(!originalInput.matches||originalInput.actual.bytes!==61||originalInput.actual.sha256!=='20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1')errors.push('ORIGINAL_INPUT_MISMATCH')
const master=masterBaseline.filter(f=>f.path!=='goal-1/input.md').map(expected=>{
 const bytes=readFileSync(expected.path),prefixBytes=bytes.subarray(0,expected.bytes),tail=bytes.subarray(expected.bytes),tailText=tail.toString('utf8')
 const headings=tailText.split('\n').filter(line=>/^#{1,6} /.test(line)),onlyS3Tail=tail.length>0&&tailText.startsWith('\n\n## 当前S3-V1 视频一单完整经历（2026-10-23）\n')&&headings.every(line=>line.includes('S3-V1'))
 const row={expected,actual:identity(expected.path),strippedBytes:prefixBytes.length,strippedSha256:hash(prefixBytes),matchesOriginalPrefix:prefixBytes.length===expected.bytes&&hash(prefixBytes)===expected.sha256,tailBytes:tail.length,tailSha256:hash(tail),tailText,headings,onlyS3Tail}
 if(!row.matchesOriginalPrefix||!row.onlyS3Tail)errors.push('MASTER_ORIGINAL_PREFIX_OR_S3_TAIL_MISMATCH:'+expected.path)
 return row
})
limits.push('Master original prefix equality preserves its pre-existing P3 text. This check does not rederive a 14-line Git diff from HEAD or inspect/stage the index.')
const r7Path='goal-1/evidence/t17-acceptance-23/build-r7/source-before.json',r7=json(r7Path)
const r8CurrentRows=r7.files.map(compare),r8Changed=r8CurrentRows.filter(row=>!row.matches)
if(r8Changed.some(row=>!row.expected.path.startsWith('src/ui/')))errors.push('NON_UI_SOURCE_CHANGED_FROM_R7')
const r8={baseline:r7Path,baselineCount:r7.files.length,checkedAt:new Date().toISOString(),changed:r8Changed,nonUiChanged:r8Changed.filter(row=>!row.expected.path.startsWith('src/ui/')),scope:'Observation while R8 owns UI reading changes; not a whole-source freeze and not a new engine/UI test acceptance.'}
for(const seal of sealed){seal.markerAfter=identity(seal.markerBefore.path);seal.markerStableDuringCheck=seal.markerBefore.bytes===seal.markerAfter.bytes&&seal.markerBefore.sha256===seal.markerAfter.sha256&&seal.markerBefore.mode===seal.markerAfter.mode;if(!seal.markerStableDuringCheck)errors.push('SEAL_MARKER_CHANGED_DURING_READ:'+seal.root)}
const inputReadback=inputs.map(compare)
if(inputReadback.some(row=>!row.matches))errors.push('CHECK_INPUT_CHANGED')
const result={startedAt,completedAt:new Date().toISOString(),passed:errors.length===0,errors,originalInput,p3:{count:p3.length,openingBaseline:p3.filter(row=>row.baselinePeriod==='S3 opening').length,s2FinalObservation:p3.filter(row=>row.baselinePeriod==='S2 final sealed observation').length,allExist:p3.every(row=>row.actual.regularFile),allBytesMatch:p3.every(row=>row.matches),rows:p3},sealed,prefix:{source:prefixPath,count:Object.values(prefixGroups).flat().length,groups:prefixGroups,runtimeSet},master,r8,inputReadback,limits,actions:{git:false,sourceOrMasterWrites:false,oldEvidenceWrites:false,browserOrHttp:false,compatibility:false,gameOrUnitTests:false,services:false}}
assertBrowserEvidenceWritable(root)
writeFileSync(join(root,'result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:result.passed,errors,p3:p3.length,p3OpeningBaseline:result.p3.openingBaseline,p3S2FinalBaseline:result.p3.s2FinalObservation,sealed:sealed.map(s=>({root:s.root,files:s.actualCount,passed:s.passed,modeRecorded:s.modeRecorded,markerStableDuringCheck:s.markerStableDuringCheck,anchored:s.independentMarkerAnchor?.matches??null})),prefix:Object.fromEntries(Object.entries(prefixGroups).map(([k,v])=>[k,{count:v.length,matches:v.every(row=>row.matches)}])),runtimeSet,master:master.map(row=>({path:row.actual.path,prefixEqual:row.matchesOriginalPrefix,tailBytes:row.tailBytes,onlyS3Tail:row.onlyS3Tail})),r8Changed:r8Changed.map(row=>row.actual.path),inputReadback:inputReadback.every(row=>row.matches)},null,2))
process.exitCode=errors.length?1:0
