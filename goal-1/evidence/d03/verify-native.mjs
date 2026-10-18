import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {resolve,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {evidenceDirectory} from '../../../scripts/evidence-output.ts'
import {createCampaignCodec,createCampaignRun} from '../../../src/application/campaign.ts'
import {evaluateCommand} from '../../../src/core/commands.ts'
import {hashValue} from '../../../src/core/hash.ts'

const root=fileURLToPath(new URL('../../../',import.meta.url)),input=join(root,'goal-1/evidence/d03')
const output=evidenceDirectory(root,'native-audit.json'),sha=v=>createHash('sha256').update(v).digest('hex'),codec=createCampaignCodec()
function path(file){if(typeof file!=='string'||!file||resolve(input,file)!==join(input,file)||file.includes('..')||/[\\\r\n]/.test(file))throw Error('INVALID_EVIDENCE_PATH');return join(input,file)}
const read=file=>readFileSync(path(file),'utf8'),reportRaw=read('native-report.json'),report=JSON.parse(reportRaw),freeze=JSON.parse(read(report.sourceFreeze))
const verifyFreeze=()=>{for(const [file,hash] of Object.entries(freeze.sha256))if(sha(readFileSync(join(root,file)))!==hash)throw Error('SOURCE_CHANGED:'+file)}
verifyFreeze()
if(report.taskId!=='D03'||report.checks.length!==52||!report.checks.every(c=>c.pass)||report.nativeAcceptanceComplete!==false)throw Error('INVALID_D03_NATIVE_SCOPE')
const lines=file=>read(file).trimEnd().split('\n').map(JSON.parse),iterations=lines(report.iterationJournal),latest=new Map()
for(const check of iterations){latest.set(check.id,check);if(!check.artifacts.length)throw Error('MISSING_ACTUAL_ARTIFACT');for(const a of check.artifacts)if(sha(readFileSync(path(a.file)))!==a.sha256)throw Error('ARTIFACT_CHANGED:'+a.file)}
if(hashValue(lines(report.checksJournal))!==hashValue(report.checks)||hashValue([...latest.values()])!==hashValue(report.checks)||iterations.length!==report.iterations)throw Error('LATEST_OBSERVATIONS_MISMATCH')
const formats=JSON.parse(read('input-canonicalization-audit.json')).inputs,inputs=report.inputs.map(a=>{
 const raw=read(a.file);if(sha(raw)!==a.sha256)throw Error('INPUT_CHANGED:'+a.file)
 if(a.sourceFile&&sha(readFileSync(join(root,a.sourceFile)))!==a.sourceSha256)throw Error('ORIGINAL_SOURCE_CHANGED:'+a.file)
 const run=codec.import(raw),canonical=codec.export(run),format=formats.find(f=>f.originalFile===a.file)
 if(run.origin!=='normal'||raw!==canonical&&raw!==canonical+'\n')throw Error('UNEXPECTED_INPUT_FORMAT')
 if(format&&(format.originalSha256!==sha(raw)||format.canonicalSha256!==sha(canonical)||read(format.canonicalFile)!==canonical))throw Error('CANONICAL_EXPECTATION_MISMATCH')
 return {file:a.file,run,canonical,rawSha256:sha(raw),canonicalSha256:sha(canonical),format:raw===canonical?'canonical':'exactly_one_LF'}
})
const cache=new Map(),cases=[];let evaluated=0
for(const a of report.exports){
 const raw=read(a.file);if(sha(raw)!==a.sha256)throw Error('EXPORT_CHANGED:'+a.file)
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
 cases.push({file:a.file,runId:final.runId,seed:final.seed,revision:final.revision,versions:final.versions,commands,expectedHash:a.sha256,actualReplayHash:sha(replay),result:'BYTE_EQUAL'})
}
const auditedInputs=inputs.map(({file,run,canonical,rawSha256,canonicalSha256,format})=>{if(![...cache.values()].some(r=>r.runId===run.runId&&r.revision===run.revision&&codec.export(r)===canonical))throw Error('INPUT_NOT_AUDITED_PREFIX:'+file);return {file,runId:run.runId,revision:run.revision,rawSha256,canonicalSha256,format,fullNormalPrefixByteEqual:true}})
const equality=report.equalPairs.map(([first,last])=>{if(!report.exports.some(a=>a.file===first)||!report.exports.some(a=>a.file===last)||read(first)!==read(last))throw Error('UI_PAIR_NOT_BYTE_EQUAL');return {first,last,byteEqual:true}})
verifyFreeze()
const result={taskId:'D03',result:'EXPORT_REPLAY_PASS',d03DesktopChecksComplete:true,nativeAcceptanceComplete:false,pending:report.pending,baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),nativeReportHash:sha(reportRaw),verifierHash:sha(readFileSync(fileURLToPath(import.meta.url))),sourceFreezeHash:sha(read(report.sourceFreeze)),frozenFiles:Object.keys(freeze.sha256).length,checks:report.checks.length,iterations:iterations.length,inputs:auditedInputs,cases,equality,evaluatedUniqueCommands:evaluated,cachePolicy:'Only identical full creation identity/version and full command envelopes share immutable evaluated prefixes. Every UI raw export is byte-equal to full replay. Original LF-bearing inputs are preserved and separately identified.',notCovered:report.notCovered}
writeFileSync(join(output,'native-audit.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({result:result.result,exports:cases.length,inputs:auditedInputs.length,equalPairs:equality.length,evaluatedUniqueCommands:evaluated,checks:result.checks,nativeAcceptanceComplete:false}))
