import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {resolve,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {evidenceDirectory} from '../../../scripts/evidence-output.ts'
import {createCampaignCodec,createCampaignRun} from '../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../src/core/commands.ts'
import {hashValue} from '../../../src/core/hash.ts'

const root=fileURLToPath(new URL('../../../',import.meta.url)),input=join(root,'goal-1/evidence/d03-cinematic')
const output=evidenceDirectory(root,'native-audit.json'),sha=v=>createHash('sha256').update(v).digest('hex'),codec=createCampaignCodec()
function file(name){if(typeof name!=='string'||!name||resolve(input,name)!==join(input,name)||name.includes('..')||/[\\\r\n]/.test(name))throw Error('INVALID_EVIDENCE_PATH');return join(input,name)}
const read=name=>readFileSync(file(name),'utf8'),lines=name=>read(name).trimEnd().split('\n').map(JSON.parse)
const reportRaw=read('native-report.json'),report=JSON.parse(reportRaw),freeze=JSON.parse(read(report.sourceFreeze))
function verifyFreeze(){for(const [name,hash] of Object.entries(freeze.sha256))if(sha(readFileSync(join(root,name)))!==hash)throw Error('SOURCE_CHANGED:'+name)}
verifyFreeze()
if(report.taskId!=='D03-CINEMATIC'||report.nativeAcceptanceComplete!==false||report.D03Complete!==false||report.checks.length!==59||report.exports.length!==15||report.inputs.length!==6)throw Error('INVALID_CINEMATIC_NATIVE_SCOPE')
function jpegSize(bytes){
 if(bytes[0]!==255||bytes[1]!==216)throw Error('NATIVE_JPEG_REQUIRED')
 let i=2
 while(i<bytes.length){if(bytes[i++]!==255)continue;while(bytes[i]===255)i++;const marker=bytes[i++];if(marker===217||marker===218)break;if(marker===216||marker===1||marker>=208&&marker<=215)continue;const size=bytes.readUInt16BE(i);if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker))return [bytes.readUInt16BE(i+5),bytes.readUInt16BE(i+3)];if(size<2)throw Error('INVALID_JPEG_SEGMENT');i+=size}
 throw Error('JPEG_DIMENSIONS_MISSING')
}
const captured=new Map(),historicalDrift=[]
for(const journal of Object.values(report.captures))for(const row of lines(journal)){
 if(captured.has(row.label))throw Error('DUPLICATE_CAPTURE_LABEL')
 const image=readFileSync(file(row.image))
 if(sha(image)!==row.sha256||hashValue(jpegSize(image))!==hashValue(row.before.viewport)||hashValue(row.before.viewport)!==hashValue(row.after.viewport))throw Error('CAPTURE_GEOMETRY_OR_BYTES_CHANGED:'+row.label)
 if(hashValue(row.before.scroll)!==hashValue(row.after.scroll))historicalDrift.push(row.label)
 if(hashValue(JSON.parse(read(row.label+'.json')))!==hashValue(row)||!read(row.label+'.ax.txt').includes('AXWebArea'))throw Error('CAPTURE_METADATA_MISSING_OR_CHANGED')
 captured.set(row.label,row)
}
if(hashValue(historicalDrift)!==hashValue(report.historicalScrollDrift.labels))throw Error('SCROLL_HISTORY_CHANGED')
const latestChecks=[];let iterations=0
for(const journal of report.journals){
 if(sha(read(journal.file))!==journal.sha256)throw Error('JOURNAL_CHANGED')
 const observations=lines(journal.file),latest=new Map()
 for(const check of observations){const row=captured.get(check.capture);if(!row||row.source!==check.source||row.runtime!==check.runtime||Object.values(check.checks).some(v=>typeof v!=='boolean')||check.pass!==Object.values(check.checks).every(Boolean))throw Error('INVALID_ACTUAL_CHECK');latest.set(check.id,check)}
 if(observations.length!==journal.iterations||latest.size!==journal.latest)throw Error('OBSERVATION_COUNT_MISMATCH')
 for(const check of latest.values()){const row=captured.get(check.capture);if(!check.pass||hashValue(row.before.scroll)!==hashValue(row.after.scroll))throw Error('LATEST_OBSERVATION_NOT_PASSED_AND_STABLE');latestChecks.push({journal:journal.scope,...check})}
 iterations+=observations.length
}
if(iterations!==report.iterations||hashValue(latestChecks)!==hashValue(report.checks))throw Error('LATEST_CHECKS_MISMATCH')
const inputs=report.inputs.map(a=>{
 const raw=read(a.file);if(sha(raw)!==a.sha256||sha(readFileSync(join(root,a.sourceFile)))!==a.sourceSha256)throw Error('ORIGINAL_INPUT_CHANGED')
 const run=codec.import(raw),canonical=codec.export(run)
 if(run.origin!=='normal'||raw!==canonical&&raw!==canonical+'\n')throw Error('NORMAL_CANONICAL_INPUT_REQUIRED')
 return {file:a.file,run,canonical,rawSha256:sha(raw),canonicalSha256:sha(canonical),format:raw===canonical?'canonical':'exactly_one_LF'}
})
const cache=new Map(),cases=[];let evaluated=0
for(const a of report.exports){
 const raw=read(a.file);if(sha(raw)!==a.sha256)throw Error('EXPORT_CHANGED')
 const final=codec.import(raw),creation=final.receipts[0]
 if(final.origin!=='normal'||creation.kind!=='CreateRun'||final.runId!==a.runId||final.revision!==a.revision)throw Error('NORMAL_CREATION_REQUIRED')
 let prefix=hashValue([final.runId,final.actorId,final.seed,final.backgroundId,final.playerProfile,creation.commandId,creation.payloadSignature,final.versions]),run=cache.get(prefix)
 if(!run){run=createCampaignRun({runId:final.runId,actorId:final.actorId,commandId:creation.commandId,backgroundId:final.backgroundId,seed:final.seed,playerProfile:final.playerProfile});if(hashValue(run.receipts[0])!==hashValue(creation)||hashValue(run.versions)!==hashValue(final.versions))throw Error('CREATION_CONTRACT_MISMATCH');cache.set(prefix,run)}
 const commands=[]
 for(const receipt of final.receipts.slice(1)){
  const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},next=hashValue([prefix,command]),cached=cache.get(next)
  if(cached)run=cached;else{const result=evaluateCommand(run,command,codec.registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify({file:a.file,command,result}));run=result.nextRun;cache.set(next,run);evaluated++}
  prefix=next;commands.push(command)
 }
 const replay=codec.export(run);if(raw!==replay||replay!==codec.export(final))throw Error('FULL_PREFIX_NOT_BYTE_EQUAL:'+a.file)
 cases.push({file:a.file,runId:final.runId,seed:final.seed,revision:final.revision,versions:final.versions,runtime:a.runtime,source:a.source,commands,expectedHash:a.sha256,actualReplayHash:sha(replay),result:'BYTE_EQUAL'})
}
const auditedInputs=inputs.map(({file,run,canonical,rawSha256,canonicalSha256,format})=>{if(![...cache.values()].some(r=>r.runId===run.runId&&r.revision===run.revision&&codec.export(r)===canonical))throw Error('INPUT_NOT_AUDITED_FULL_PREFIX');return {file,runId:run.runId,revision:run.revision,rawSha256,canonicalSha256,format,fullNormalPrefixByteEqual:true}})
const equality=report.equalPairs.map(([first,last])=>{if(!report.exports.some(a=>a.file===first)||!report.exports.some(a=>a.file===last)||read(first)!==read(last))throw Error('UI_PAIR_NOT_BYTE_EQUAL');return {first,last,byteEqual:true}})
verifyFreeze()
const result={taskId:'D03-CINEMATIC',result:'EXPORT_REPLAY_PASS',d03CinematicNativeSubsetComplete:true,nativeAcceptanceComplete:false,D03Complete:false,pending:report.pending,baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),nativeReportHash:sha(reportRaw),verifierHash:sha(readFileSync(fileURLToPath(import.meta.url))),sourceFreezeHash:sha(read(report.sourceFreeze)),frozenFiles:Object.keys(freeze.sha256).length,checks:latestChecks.length,iterations,captures:captured.size,historicalScrollDrift,inputs:auditedInputs,cases,equality,evaluatedUniqueCommands:evaluated,cachePolicy:'Only identical full creation identity/version and full command envelopes share immutable evaluated prefixes. Every UI raw export byte-equals a full normal replay. One-LF original inputs preserved separately.',scope:report.scope}
writeFileSync(join(output,'native-audit.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({result:result.result,exports:cases.length,inputs:auditedInputs.length,equalPairs:equality.length,evaluatedUniqueCommands:evaluated,checks:result.checks,iterations,nativeAcceptanceComplete:false}))
