import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs'

// Preparation only until Root explicitly declares the visible exports complete.
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..')
const input=path.join(repo,'goal-1/evidence/t17-acceptance-34')
const [flag,destination,...extra]=process.argv.slice(2)
if(flag!=='--output-dir'||!destination||extra.length)throw Error('FRESH_EXPLICIT_OUTPUT_REQUIRED')
const output=path.resolve(repo,destination)
if(path.dirname(output)!==input||!/^normal-export-audit-r[1-9][0-9]*$/.test(path.basename(output)))throw Error('CUX06_ROOT34_FRESH_AUDIT_SIBLING_REQUIRED')
assertBrowserEvidenceWritable(input)
if(fs.existsSync(output))throw Error('PRESERVE_EXISTING_AUDIT_USE_NEW_SIBLING')
fs.mkdirSync(output)
const write=(name,value)=>{
 assertBrowserEvidenceWritable(output)
 fs.writeFileSync(path.join(output,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})
}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')
function read(relative){
 const absolute=path.join(repo,relative),stat=fs.lstatSync(absolute)
 if(stat.isSymbolicLink()||!stat.isFile())throw Error('REGULAR_INPUT_REQUIRED:'+relative)
 const bytes=fs.readFileSync(absolute)
 return {bytes,identity:{path:relative,bytes:bytes.length,sha256:sha(bytes),mode:stat.mode&0o777}}
}
function sources(){
 const paths=[]
 const walk=relative=>{
  for(const entry of fs.readdirSync(path.join(repo,relative),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
   const name=relative+'/'+entry.name
   if(entry.isSymbolicLink())throw Error('SOURCE_SYMLINK_NOT_FOLLOWED:'+name)
   if(entry.isDirectory())walk(name)
   else if(entry.isFile()&&entry.name.endsWith('.ts')&&!entry.name.includes('.test.'))paths.push(name)
  }
 }
 for(const name of ['src/core','src/application','src/content','src/persistence'])walk(name)
 paths.push('scripts/verify_normal_browser_exports.ts','scripts/evidence-output.ts')
 return paths.sort().map(name=>read(name).identity)
}
const categories=new Set(['saved_ui','physical_readonly','import_buffer','unsaved_candidate'])
function inputs(){
 const chromeEntries=fs.readdirSync(input,{withFileTypes:true}).filter(entry=>entry.name.startsWith('chrome-'))
 for(const entry of chromeEntries)if(entry.isSymbolicLink())throw Error('CHROME_DIRECTORY_SYMLINK_NOT_FOLLOWED:'+entry.name)
 const folders=chromeEntries.filter(entry=>entry.isDirectory()).map(entry=>entry.name).sort()
 const identities=[],records=[],scannedJSON=[],unknownJSON=[],optionalHeaders=[],roleCounts={saved_ui:0,physical_readonly:0,import_buffer:0,unsaved_candidate:0,unknown:0}
 const registered=new Set()
 for(const folder of folders){
  const directory=path.join(input,folder),files=fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))
  const codecFiles=[]
  for(const file of files){
   if(file.isSymbolicLink())throw Error('CHROME_SYMLINK_NOT_FOLLOWED:'+folder+'/'+file.name)
   if(!file.isFile()||!file.name.endsWith('.json'))continue
   const name=path.relative(repo,path.join(directory,file.name)),data=read(name)
   identities.push(data.identity)
   let value
   try{value=JSON.parse(data.bytes.toString('utf8'))}catch(error){unknownJSON.push({path:name,reason:'JSON_PARSE_FAILED',message:String(error)});continue}
   const codecShaped=!!value&&typeof value==='object'&&!Array.isArray(value)&&typeof value.runId==='string'&&Number.isSafeInteger(value.revision)&&'state'in value&&('checksum'in value||'schemaVersion'in value)
   scannedJSON.push({path:name,codecShaped})
   if(codecShaped)codecFiles.push(name)
  }
  const journal=files.find(file=>file.name==='exports.jsonl')
  if(journal){
   if(!journal.isFile())throw Error('REGULAR_EXPORT_MANIFEST_REQUIRED:'+folder)
   const name=path.relative(repo,path.join(directory,journal.name)),data=read(name)
   identities.push(data.identity)
   const lines=data.bytes.toString('utf8').split('\n')
   for(let index=0;index<lines.length;index++){
    if(!lines[index])continue
    const row=JSON.parse(lines[index]),file=row.file,key=folder+'/'+file
    if(typeof file!=='string'||path.basename(file)!==file||!/^[a-zA-Z0-9_.-]+\.json$/.test(file)||registered.has(key))throw Error('INVALID_OR_DUPLICATE_EXPORT_FILE:'+key)
    if(typeof row.origin!=='string'||!row.origin.trim()||typeof row.source!=='string'||!row.source.trim()||!Number.isSafeInteger(row.bytes)||row.bytes<=0||typeof row.sha256!=='string'||!/^[a-f0-9]{64}$/.test(row.sha256))throw Error('FIVE_REQUIRED_EXPORT_FIELDS_INVALID:'+key)
    registered.add(key)
    const raw=read(path.relative(repo,path.join(directory,file))),value=JSON.parse(raw.bytes.toString('utf8'))
    if(raw.identity.bytes!==row.bytes||raw.identity.sha256!==row.sha256)throw Error('RAW_BYTES_OR_SHA_MISMATCH:'+key)
    if(row.runId!==undefined&&row.runId!==null&&row.runId!==value.runId)throw Error('OPTIONAL_RUN_ID_MISMATCH:'+key)
    if(row.revision!==undefined&&row.revision!==null&&row.revision!==value.revision)throw Error('OPTIONAL_REVISION_MISMATCH:'+key)
    if(row.runId===undefined||row.runId===null||row.revision===undefined||row.revision===null)optionalHeaders.push({folder,file,line:index+1,recordedRunId:row.runId??null,recordedRevision:row.revision??null,publicRunId:value.runId,publicRevision:value.revision})
    const sourceRole=row.source.match(/^(SAVED_UI|PHYSICAL_READONLY|IMPORT_BUFFER|UNSAVED_CANDIDATE):/)?.[1]?.toLowerCase()
    if(!sourceRole||!categories.has(sourceRole))throw Error('CUX06_EXPLICIT_SOURCE_ROLE_PREFIX_REQUIRED:'+key)
    const category=sourceRole
    if(row.origin!==category)throw Error('CUX06_LOWERCASE_ORIGIN_MUST_MATCH_EXPLICIT_SOURCE_ROLE:'+key)
    if(row.artifactKind!==undefined&&row.artifactKind!==category)throw Error('CONFLICTING_SOURCE_ROLE_DECLARATION:'+key)
    roleCounts[category]++
    records.push({folder,file,line:index+1,origin:row.origin,source:row.source,artifactKind:category,roleSource:category==='unknown'?null:'explicit source prefix',identity:raw.identity,publicHeader:{runId:value.runId,revision:value.revision,schemaVersion:value.schemaVersion,rulesVersion:value.rulesVersion,contentVersion:value.contentVersion,contentHash:value.contentHash,saveVersion:value.saveVersion,rngAlgorithmVersion:value.rngAlgorithmVersion}})
   }
  }
  for(const name of codecFiles){const key=folder+'/'+path.basename(name);if(!registered.has(key))throw Error('UNREGISTERED_CODEC_SHAPED_RAW:'+key)}
 }
 if(!records.length)throw Error('NO_REGISTERED_VISIBLE_EXPORTS')
 return {folders,identities:identities.sort((a,b)=>a.path.localeCompare(b.path)),records,scannedJSON,unknownJSON,optionalHeaders,roleCounts,
  roleLimit:'C-UX06 roles come only from exact explicit SAVED_UI:/PHYSICAL_READONLY:/IMPORT_BUFFER:/UNSAVED_CANDIDATE: source prefixes. origin must match the corresponding lowercase role as a consistency check and is never used to infer it. Missing/conflicting declarations reject before replay. Native-log capture-role cross-check remains independent; candidate/import/readonly artifacts are audited, not additional saved outcomes.',
  savedOutcomeCount:null}
}

/** Bind imported historical prefixes as provenance, never as new browser-earned commands. */
function provenanceReferences(){
 const rows=new Map()
 const bindReference=(reference,label)=>{
  if(!reference||typeof reference.path!=='string'||!reference.path.startsWith('goal-1/evidence/')||path.relative(repo,path.resolve(repo,reference.path))!==reference.path)throw Error('EXPLICIT_NATIVE_REFERENCE_IDENTITY_REQUIRED:'+label)
  const original=read(reference.path)
  if(original.identity.bytes!==reference.bytes||original.identity.sha256!==reference.sha256||reference.mode!==undefined&&original.identity.mode!==reference.mode)throw Error('NATIVE_REFERENCE_BYTES_OR_MODE_CHANGED:'+label)
  rows.set(reference.path,original.identity)
 }
 const manifests=fs.readdirSync(input,{withFileTypes:true}).filter(entry=>/^native-inputs.*\.json$/.test(entry.name)).sort((a,b)=>a.name.localeCompare(b.name))
 if(!manifests.length)throw Error('CUX06_NATIVE_PREFIX_PROVENANCE_REQUIRED')
 for(const manifest of manifests){
  if(manifest.isSymbolicLink()||!manifest.isFile())throw Error('REGULAR_NATIVE_PROVENANCE_REQUIRED:'+manifest.name)
  const name=path.relative(repo,path.join(input,manifest.name)),data=read(name),value=JSON.parse(data.bytes.toString('utf8'))
  rows.set(name,data.identity)
  if(value.sourceBinding!==undefined)bindReference(value.sourceBinding,name+':sourceBinding')
  if(!Array.isArray(value.inputs)||!value.inputs.length)throw Error('EXPLICIT_PREFIX_INPUTS_REQUIRED:'+name)
  for(const prefix of value.inputs){
   if(typeof prefix.path!=='string'||!prefix.path.startsWith('goal-1/evidence/')||path.relative(repo,path.resolve(repo,prefix.path))!==prefix.path||prefix.notNewNativeHistory!==true)throw Error('EXPLICIT_OLD_PREFIX_IDENTITY_REQUIRED:'+name)
   const original=read(prefix.path)
   if(original.identity.bytes!==prefix.bytes||original.identity.sha256!==prefix.sha256)throw Error('ORIGINAL_PREFIX_BYTES_CHANGED:'+prefix.path)
   const header=JSON.parse(original.bytes.toString('utf8'))
   if(prefix.runId!==undefined&&prefix.runId!==header.runId||prefix.revision!==undefined&&prefix.revision!==header.revision)throw Error('ORIGINAL_PREFIX_HEADER_MISMATCH:'+prefix.path)
   rows.set(prefix.path,original.identity)
   if(prefix.manifest!==undefined)bindReference(prefix.manifest,prefix.path+':manifest')
  }
 }
 return [...rows.values()].sort((a,b)=>a.path.localeCompare(b.path))
}
function extraReferenceRows(){
 const names=['scripts/browser_evidence_guard.mjs',path.relative(repo,fileURLToPath(import.meta.url)),'goal-1/evidence/t17-acceptance-34/baseline.json','goal-1/evidence/t17-acceptance-34/audit-preparation-r1/official-source-contract-r1.json','goal-1/evidence/t17-acceptance-33/audit-preparation-r1/run-audit.mjs','goal-1/evidence/t17-acceptance-33/audit-preparation-r1/official-source-contract-r1.json','goal-1/input.md']
 const rows=new Map(names.map(name=>[name,read(name).identity]))
 for(const row of provenanceReferences())rows.set(row.path,row)
 return [...rows.values()].sort((a,b)=>a.path.localeCompare(b.path))
}

const started=Date.now()
let beforeSources=null,beforeInputs=null,terminal=null
try{
 beforeSources=sources();if(beforeSources.length!==126)throw Error('CUX06_ORIGINAL_126_OFFICIAL_SOURCES_REQUIRED:'+beforeSources.length);beforeInputs=inputs()
 const contract=JSON.parse(read('goal-1/evidence/t17-acceptance-34/audit-preparation-r1/official-source-contract-r1.json').bytes.toString('utf8'))
 if(contract.officialSourceCount!==126||contract.p3Count!==26||JSON.stringify(contract.officialSources)!==JSON.stringify(beforeSources))throw Error('CUX06_PREPARED_OFFICIAL_SOURCE_CONTRACT_CHANGED')
 const originalTemplate=read(contract.template.path).identity
 if(JSON.stringify(originalTemplate)!==JSON.stringify(contract.template))throw Error('IMMUTABLE_ROOT33_TEMPLATE_CHANGED')
 const baseline=JSON.parse(read('goal-1/evidence/t17-acceptance-34/baseline.json').bytes.toString('utf8'))
 const baselineMap=new Map(baseline.sourceAndAssets.map(entry=>[entry.path,entry]))
 const baselineDiff=beforeSources.filter(entry=>baselineMap.has(entry.path)&&['bytes','sha256','mode'].some(key=>baselineMap.get(entry.path)[key]!==entry[key]))
 const p3Before=baseline.p3.map(expected=>{const actual=read(expected.path).identity;if(['bytes','sha256','mode'].some(key=>expected[key]!==actual[key]))throw Error('CUX06_ORIGINAL_P3_BASELINE_CHANGED:'+expected.path);return actual});if(p3Before.length!==26)throw Error('CUX06_ORIGINAL_26_P3_REQUIRED');if(JSON.stringify(contract.p3)!==JSON.stringify(p3Before))throw Error('CUX06_PREPARED_P3_CONTRACT_CHANGED');write('p3-before.json',{rows:p3Before,comparedTo:'Root34 opening working-tree baseline, including original uncommitted P3; not bare HEAD'})
 const extraReferences=extraReferenceRows()
 write('source-before.json',{at:new Date().toISOString(),officialSourceCount:beforeSources.length,officialSources:beforeSources,extraReferences,baselineDiff,notInSourceAndAssetsBaseline:beforeSources.filter(entry=>!baselineMap.has(entry.path))})
 write('input-before.json',beforeInputs)
 if(baselineDiff.length)throw Error('ENGINE_SOURCE_CHANGED_FROM_CUX06_BASELINE:'+JSON.stringify(baselineDiff.map(entry=>entry.path)))
 const reportDirectory=path.join(output,'report')
 const args=['proxy','env','NATIVE_EXPORT_INPUT_DIRECTORY='+path.relative(repo,input),'node','--experimental-strip-types','scripts/verify_normal_browser_exports.ts','--output-dir',path.relative(repo,reportDirectory)]
 write('command.json',{at:new Date().toISOString(),cwd:repo,command:['rtk',...args],node:process.version,scope:'C-UX06 original complete Create replay after Root declares captures done; no browser, compatibility, game UI mutation, source changes or Git writes.'})
 assertBrowserEvidenceWritable(output)
 const execution=spawnSync('rtk',args,{cwd:repo,encoding:'utf8',maxBuffer:32*1024*1024})
 terminal={exitCode:execution.status,signal:execution.signal,error:execution.error?.message??null}
 write('stdout.log',execution.stdout??'');write('stderr.log',execution.stderr??'')
 const afterSources=sources(),afterInputs=inputs(),afterReferences=extraReferenceRows(),p3After=p3Before.map(entry=>read(entry.path).identity)
 const p3Equal=JSON.stringify(p3Before)===JSON.stringify(p3After);write('p3-after.json',{rows:p3After,p3Equal})
 const sourceEqual=JSON.stringify(beforeSources)===JSON.stringify(afterSources),inputEqual=JSON.stringify(beforeInputs)===JSON.stringify(afterInputs),extraReferencesEqual=JSON.stringify(extraReferences)===JSON.stringify(afterReferences)
 write('source-after.json',{officialSources:afterSources,extraReferences:afterReferences,sourceEqual,extraReferencesEqual})
 write('input-after.json',afterInputs)
 let report=null,reportIdentity=null,officialIdentityEqual=false
 const reportFile=path.relative(repo,path.join(reportDirectory,'normal-browser-export-audit.json'))
 if(fs.existsSync(path.join(repo,reportFile))){
  const original=read(reportFile);report=JSON.parse(original.bytes.toString('utf8'));reportIdentity=original.identity
  officialIdentityEqual=Object.keys(report.sourceHashes).length===beforeSources.length&&beforeSources.every(entry=>report.sourceHashes[entry.path]===entry.sha256)
 }
 const passed=terminal.exitCode===0&&terminal.signal===null&&terminal.error===null&&sourceEqual&&inputEqual&&extraReferencesEqual&&p3Equal&&officialIdentityEqual&&report?.allByteEqual===true&&beforeInputs.unknownJSON.length===0
 const result={at:new Date().toISOString(),wallMs:Date.now()-started,...terminal,passed,sourceEqual,inputEqual,extraReferencesEqual,p3Equal,officialIdentityEqual,officialSourceCount:beforeSources.length,reportIdentity,
  replay:report?{creations:report.creations,executedUniqueCommands:report.executedUniqueCommands,files:report.files,inputBuffers:report.inputBuffers,allByteEqual:report.allByteEqual}:null,
  manifest:{directories:beforeInputs.folders.length,rows:beforeInputs.records.length,codecShapedFiles:beforeInputs.scannedJSON.filter(row=>row.codecShaped).length,unknownJSON:beforeInputs.unknownJSON,optionalHeaderAddenda:beforeInputs.optionalHeaders,roleCounts:beforeInputs.roleCounts,unknownRoles:beforeInputs.records.filter(row=>row.artifactKind==='unknown').map(row=>({folder:row.folder,file:row.file,origin:row.origin,source:row.source}))},
  limit:'Replay verifies complete creation prefixes and canonical bytes; unique replay commands are not a count of saved browser submissions. Buffer/candidate/readonly/unknown artifacts do not add new saved outcomes. No visual, native failure-path, human-understanding, compatibility, P3 formal matrix or whole-goal acceptance is claimed.'}
 write('result.json',result);console.log(JSON.stringify(result));if(!passed)process.exitCode=1
}catch(error){
 const failure={at:new Date().toISOString(),wallMs:Date.now()-started,passed:false,terminal,error:error instanceof Error?{name:error.name,message:error.message,stack:error.stack}:String(error)}
 write('failure.json',failure);console.error(JSON.stringify(failure));process.exitCode=1
}
