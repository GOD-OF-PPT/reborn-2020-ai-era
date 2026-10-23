import {readFileSync,writeFileSync,readdirSync,lstatSync,existsSync,realpathSync} from 'node:fs'
import {resolve,join,relative,basename,isAbsolute} from 'node:path'
import {createHash} from 'node:crypto'
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs'

const input=resolve('goal-1/evidence/t17-acceptance-23'),output=join(input,'normal-export-audit-r1')
assertBrowserEvidenceWritable(output)
const sha=b=>createHash('sha256').update(b).digest('hex'),rel=p=>relative(process.cwd(),p)
const identity=path=>{const b=readFileSync(path);return {path:rel(path),bytes:b.length,sha256:sha(b)}}
const errors=[],folders=readdirSync(input,{withFileTypes:true}).filter(e=>e.name.startsWith('chrome-')&&e.isDirectory()).map(e=>e.name).sort(),records=[],journalFiles=[],registered=new Set(),jsonInventory=[],optionalMetadata=[]
function regular(path){const stat=lstatSync(path);if(stat.isSymbolicLink()||!stat.isFile())throw Error('NON_REGULAR_INPUT:'+path);const location=relative(realpathSync(input),realpathSync(path));if(location.startsWith('..')||isAbsolute(location))throw Error('INPUT_ESCAPES_ROOT');return identity(path)}
function walk(path){const stat=lstatSync(path);if(stat.isSymbolicLink())throw Error('SYMLINK_CHROME_INPUT:'+path);return stat.isDirectory()?readdirSync(path).sort().flatMap(name=>walk(join(path,name))):[path]}
for(const folder of folders){
 const directory=join(input,folder),journal=join(directory,'exports.jsonl')
 if(existsSync(journal)){
  journalFiles.push(regular(journal))
  for(const [index,line] of readFileSync(journal,'utf8').split('\n').entries()){
   if(!line)continue
   let row;try{row=JSON.parse(line)}catch{errors.push({folder,line:index+1,reason:'INVALID_JOURNAL_JSON'});continue}
   const required=['file','origin','source','bytes','sha256']
   if(!row||required.some(key=>!Object.hasOwn(row,key))||typeof row.file!=='string'||basename(row.file)!==row.file||!/^[a-zA-Z0-9_.-]+\.json$/.test(row.file)||!['saved','candidate','import_buffer'].includes(row.origin)||typeof row.source!=='string'||!row.source.trim()||!Number.isSafeInteger(row.bytes)||row.bytes<1||!/^[0-9a-f]{64}$/.test(row.sha256)){errors.push({folder,line:index+1,reason:'INVALID_FIVE_FIELD_CONTRACT',row});continue}
   const path=join(directory,row.file),pathName=rel(path)
   if(registered.has(pathName)){errors.push({folder,line:index+1,reason:'DUPLICATE_PATH'});continue}
   registered.add(pathName)
   const actual=regular(path),raw=readFileSync(path),text=raw.toString('utf8');let envelope
   try{envelope=JSON.parse(text)}catch{errors.push({path:pathName,reason:'REGISTERED_RAW_NOT_JSON'});continue}
   const saveShape=envelope&&typeof envelope==='object'&&typeof envelope.runId==='string'&&Number.isSafeInteger(envelope.revision)&&typeof envelope.schemaVersion==='number'&&envelope.state&&typeof envelope.state==='object'&&typeof envelope.checksum==='string'
   if(!saveShape||!Buffer.from(text,'utf8').equals(raw)||actual.bytes!==row.bytes||actual.sha256!==row.sha256)errors.push({path:pathName,reason:'RAW_SHAPE_OR_BYTES_MISMATCH'})
   if(row.runId!==undefined&&row.runId!==null&&row.runId!==envelope.runId||row.revision!==undefined&&row.revision!==null&&row.revision!==envelope.revision)errors.push({path:pathName,reason:'OPTIONAL_PUBLIC_METADATA_CONFLICT'})
   if(row.runId===null||row.revision===null)optionalMetadata.push({folder,file:row.file,journal:rel(journal),line:index+1,originalRunId:row.runId??null,originalRevision:row.revision??null,publicEnvelopeRunId:envelope.runId,publicEnvelopeRevision:envelope.revision,bytes:actual.bytes,sha256:actual.sha256,origin:row.origin,source:row.source,note:'Original optional null values remain unmodified; required five fields and bytes already bind this exact raw.'})
   records.push({folder,journal:rel(journal),line:index+1,...row,actual,publicEnvelope:{runId:envelope.runId,revision:envelope.revision},saveShape})
  }
 }
 for(const path of walk(directory).filter(path=>path.endsWith('.json'))){
  const actual=regular(path);let envelope;try{envelope=JSON.parse(readFileSync(path,'utf8'))}catch{jsonInventory.push({...actual,saveShape:false,invalidJson:true});continue}
  const saveShape=!!(envelope&&typeof envelope==='object'&&typeof envelope.runId==='string'&&Number.isSafeInteger(envelope.revision)&&typeof envelope.schemaVersion==='number'&&envelope.state&&typeof envelope.state==='object'&&typeof envelope.checksum==='string')
  jsonInventory.push({...actual,saveShape,registered:registered.has(actual.path)})
 }
}
const unregistered=jsonInventory.filter(f=>f.saveShape&&!f.registered);if(unregistered.length)errors.push({reason:'UNREGISTERED_CODEC_SHAPED_RAW',paths:unregistered.map(f=>f.path)})
const prefixPath='goal-1/evidence/t17-acceptance-23/normal-prefix-r1/source-before.json',prefix=JSON.parse(readFileSync(prefixPath,'utf8'))
const prefixGroups=Object.fromEntries(['runtime','protocol','reference','inputs'].map(group=>[group,prefix[group].map(expected=>({expected,actual:identity(resolve(expected.path))}))]))
if(Object.values(prefixGroups).flat().some(row=>row.expected.bytes!==row.actual.bytes||row.expected.sha256!==row.actual.sha256))errors.push({reason:'ORIGINAL_139_PREFIX_BINDING_DRIFT'})
const source126=[...prefixGroups.runtime,...prefixGroups.protocol].map(row=>row.actual)
const sourcePaths=['src/core','src/application','src/content','src/persistence'].flatMap(dir=>walk(resolve(dir))).filter(path=>path.endsWith('.ts')&&!basename(path).includes('.test.')).map(rel).sort(),expectedRuntime=prefix.runtime.map(f=>f.path).sort()
if(JSON.stringify(sourcePaths)!==JSON.stringify(expectedRuntime))errors.push({reason:'RUNTIME_SOURCE_SET_DRIFT'})
const snapshot={at:new Date().toISOString(),passed:errors.length===0,errors,inputDirectory:rel(input),folders,journalFiles,records,originCounts:Object.fromEntries(['saved','candidate','import_buffer'].map(origin=>[origin,records.filter(row=>row.origin===origin).length])),jsonInventory,unregistered,optionalMetadata,source126,prefix:{source:prefixPath,groups:prefixGroups},notes:['No codec import, game command or Create replay executed by this independent preflight.','All JSON files under existing direct chrome-* directories are shape-inventoried, including nested files; only complete codec-shaped raw files require export rows.','Origin labels are independently enumerated here; their recorded browser provenance remains the parent journal responsibility.']}
assertBrowserEvidenceWritable(output)
writeFileSync(join(output,'input-source-before.json'),JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'})
writeFileSync(join(output,'optional-public-metadata-addendum.json'),JSON.stringify({at:snapshot.at,originalJournalsUnmodified:true,scope:'Only optional row.runId/revision nulls are supplemented from the already bound public envelope. No origin, source, raw, signature or receipt is changed.',rows:optionalMetadata},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:snapshot.passed,errors,folders:folders.length,journals:journalFiles.length,registeredRaw:records.length,originCounts:snapshot.originCounts,jsonFilesInventoried:jsonInventory.length,unregisteredCompleteRaw:unregistered.length,optionalNullRows:optionalMetadata.length,source126:source126.length,prefix139:Object.values(prefixGroups).flat().length},null,2))
process.exitCode=errors.length?1:0
