import {readFileSync,writeFileSync,readdirSync,lstatSync} from 'node:fs'
import {resolve,join,relative,basename} from 'node:path'
import {createHash} from 'node:crypto'
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs'

const input=resolve('goal-1/evidence/t17-acceptance-23'),output=join(input,'normal-export-audit-r1')
assertBrowserEvidenceWritable(output)
const sha=b=>createHash('sha256').update(b).digest('hex'),json=path=>JSON.parse(readFileSync(path,'utf8')),before=json(join(output,'input-source-before.json')),report=json(join(output,'normal-browser-export-audit.json')),terminal=json(join(output,'terminal.json')),errors=[]
const snapshot=path=>{const stat=lstatSync(path);if(stat.isSymbolicLink()||!stat.isFile())throw Error('NON_REGULAR_AFTER_INPUT:'+path);const b=readFileSync(path);return {path,bytes:b.length,sha256:sha(b)}}
const compare=expected=>{const actual=snapshot(expected.path);return {expected,actual,matches:actual.bytes===expected.bytes&&actual.sha256===expected.sha256}}
const sameKeys=(a,b)=>JSON.stringify(Object.keys(a).sort())===JSON.stringify(Object.keys(b).sort())
function walk(path){const stat=lstatSync(path);if(stat.isSymbolicLink())throw Error('AFTER_SYMLINK:'+path);return stat.isDirectory()?readdirSync(path).sort().flatMap(name=>walk(join(path,name))):[relative(process.cwd(),path)]}
const sourceAfter=before.source126.map(compare),inputsBefore=[...before.journalFiles,...before.records.map(row=>row.actual)],inputsAfter=inputsBefore.map(compare)
if(terminal.code!==0||!report.allByteEqual||!before.passed||sourceAfter.some(row=>!row.matches)||inputsAfter.some(row=>!row.matches))errors.push('AUDIT_TERMINAL_OR_BOUND_INPUT_DRIFT')
const expectedSourceHashes=Object.fromEntries(before.source126.map(row=>[row.path,row.sha256])),expectedInputHashes=Object.fromEntries(inputsBefore.map(row=>[row.path,row.sha256]))
const reportSourceSetEqual=sameKeys(report.sourceHashes,expectedSourceHashes),reportInputSetEqual=sameKeys(report.inputHashes,expectedInputHashes)
const reportSourceHashEqual=reportSourceSetEqual&&Object.entries(expectedSourceHashes).every(([path,hash])=>report.sourceHashes[path]===hash),reportInputHashEqual=reportInputSetEqual&&Object.entries(expectedInputHashes).every(([path,hash])=>report.inputHashes[path]===hash)
if(!reportSourceHashEqual||!reportInputHashEqual)errors.push('REPORT_SOURCE_OR_INPUT_BINDING_MISMATCH')
const folders=readdirSync(input,{withFileTypes:true}).filter(e=>e.name.startsWith('chrome-')&&e.isDirectory()).map(e=>e.name).sort(),folderSetEqual=JSON.stringify(folders)===JSON.stringify(before.folders)
const jsonNames=folders.flatMap(folder=>walk(join(input,folder))).filter(path=>path.endsWith('.json')).sort(),jsonNamesBefore=before.jsonInventory.map(row=>row.path).sort(),jsonInventorySetEqual=JSON.stringify(jsonNames)===JSON.stringify(jsonNamesBefore),jsonAfter=before.jsonInventory.map(compare)
if(!folderSetEqual||!jsonInventorySetEqual||jsonAfter.some(row=>!row.matches))errors.push('CHROME_FOLDER_OR_COMPLETE_JSON_INVENTORY_CHANGED')
const runtimePaths=['src/core','src/application','src/content','src/persistence'].flatMap(dir=>walk(resolve(dir))).filter(path=>path.endsWith('.ts')&&!basename(path).includes('.test.')).sort(),runtimeExpected=before.prefix.groups.runtime.map(row=>row.expected.path).sort(),runtimeSetEqual=JSON.stringify(runtimePaths)===JSON.stringify(runtimeExpected)
if(!runtimeSetEqual)errors.push('RUNTIME_SET_CHANGED')
const prefix139=Object.fromEntries(Object.entries(before.prefix.groups).map(([group,rows])=>[group,rows.map(row=>compare(row.expected))]))
if(Object.values(prefix139).flat().some(row=>!row.matches))errors.push('ORIGINAL_139_PREFIX_BINDING_CHANGED')
const rows=before.records.map(row=>{
 const record=report.records.find(record=>record.folder===row.folder&&record.file===row.file)
 return {path:row.actual.path,journal:row.journal,line:row.line,record,originalOrigin:row.origin,originalSource:row.source,matches:!!record&&record.sha256===row.sha256&&record.bytes===row.bytes&&record.runId===row.publicEnvelope.runId&&record.revision===row.publicEnvelope.revision&&record.recordedOrigin===row.origin&&record.recordedUISource===row.source&&record.fullNormalCreatePrefixByteEqual===true}
})
const reportKeys=report.records.map(row=>row.folder+'/'+row.file),uniqueReportKeys=new Set(reportKeys),recordSetEqual=rows.every(row=>row.matches)&&report.records.length===before.records.length&&uniqueReportKeys.size===report.records.length
if(!recordSetEqual)errors.push('REPORT_RECORD_OR_PROVENANCE_MISMATCH')
const optional=json(join(output,'optional-public-metadata-addendum.json')),optionalRows=optional.rows.map(row=>{
 const record=report.records.find(record=>record.folder===row.folder&&record.file===row.file)
 return {...row,reportMatches:!!record&&record.runId===row.publicEnvelopeRunId&&record.revision===row.publicEnvelopeRevision&&record.sha256===row.sha256&&record.bytes===row.bytes}
})
if(optionalRows.some(row=>!row.reportMatches))errors.push('OPTIONAL_METADATA_ADDENDUM_NOT_BOUND')
const originCounts=before.originCounts,recordedInputBuffers=report.records.filter(row=>row.recordedOrigin==='import_buffer').length
if(report.inputBuffers!==originCounts.import_buffer||recordedInputBuffers!==report.inputBuffers)errors.push('INPUT_BUFFER_COUNT_MISMATCH')
const rawHashGroups=Object.groupBy(before.records,row=>row.sha256),normalRunGroups=Object.groupBy(report.records,row=>row.runId)
const result={at:new Date().toISOString(),passed:errors.length===0,errors,terminal,counts:{creations:report.creations,executedUniqueCommands:report.executedUniqueCommands,files:report.files,inputBuffers:report.inputBuffers,originCounts,distinctRawHashes:Object.keys(rawHashGroups).length,sourceFiles:Object.keys(report.sourceHashes).length,inputFiles:Object.keys(report.inputHashes).length},normalRunGroups:Object.fromEntries(Object.entries(normalRunGroups).map(([runId,rows])=>[runId,{files:rows.length,revisions:[...new Set(rows.map(row=>row.revision))].sort((a,b)=>a-b)}])),sourceAfter,inputsAfter,reportBinding:{reportSourceSetEqual,reportInputSetEqual,reportSourceHashEqual,reportInputHashEqual,recordSetEqual,folderSetEqual,jsonInventorySetEqual,runtimeSetEqual},jsonAfter,prefix139,records:rows,optionalRows,scope:'Independently confirms the existing original tool report, all raw/journal bindings and original 139 prefix identities. Does not repeat Create audit or prove UI/human acceptance.',limits:['ExecutedUniqueCommands includes the earned prehistory and branching command prefixes, not just this Chrome session clicks.','Saved/candidate/import_buffer origins remain their originally recorded layers; input buffers and candidates are not promoted to saved outcomes.','Source126 does not include UI/assets/HTTP, and its equality does not complete unfinished P3 or the overall goal.','The independent registration inventory checks complete codec-shaped JSON exports, not all screenshots, AX text or raw strings embedded inside metadata wrappers.','Original prefix manifest did not record mode; no historical mode equality is claimed.']}
assertBrowserEvidenceWritable(output)
writeFileSync(join(output,'source-input-after-and-prefix-binding.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:result.passed,errors,counts:result.counts,reportBinding:result.reportBinding,prefix139:Object.fromEntries(Object.entries(prefix139).map(([k,v])=>[k,{count:v.length,allSame:v.every(row=>row.matches)}])),optionalNullRows:optionalRows.length,normalRunGroups:result.normalRunGroups},null,2))
process.exitCode=errors.length?1:0
