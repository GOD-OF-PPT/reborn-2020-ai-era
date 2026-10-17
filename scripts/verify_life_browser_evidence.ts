import {readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {join,isAbsolute} from 'node:path'
import {fileURLToPath} from 'node:url'
import {evidenceDirectory} from './evidence-output.ts'
import {createCampaignCodec,createCampaignRun} from '../src/application/campaign.ts'
import {evaluateCommand} from '../src/core/commands.ts'
import {hashValue} from '../src/core/hash.ts'
import type {GameRun} from '../src/core/run-types.ts'

interface Artifact {file:string;sha256:string}
interface Check {id:string;pass:boolean;artifacts:Artifact[];[key:string]:unknown}
interface Report {taskId:'T15';checks:Check[];checksJournal:string;iterationJournal?:string;inputs:Artifact[];exports:(Artifact&{role:string})[];equalPairs:[string,string][];pending:{id:string;reason:string}[]}
const root=fileURLToPath(new URL('../',import.meta.url)),input=join(root,'goal-1/evidence'),output=evidenceDirectory(root,'t15-browser-replay-audit.json'),sha=(v:string|Uint8Array)=>createHash('sha256').update(v).digest('hex'),codec=createCampaignCodec()
function relativeFile(path:string){if(isAbsolute(path)||/[\\\r\n]/.test(path)||path.split('/').some(v=>v==='..'||v===''))throw Error('INVALID_T15_EVIDENCE_PATH');return join(input,path)}
const reportFile=process.env.T15_NATIVE_REPORT??'t15-browser-native.json';if(!/^t15-[a-z0-9-]+\.json$/.test(reportFile))throw Error('INVALID_T15_NATIVE_REPORT')
const reportRaw=readFileSync(relativeFile(reportFile),'utf8'),report=JSON.parse(reportRaw) as Report
if(report.taskId!=='T15'||!report.exports.length||!report.checks.length||!Array.isArray(report.pending))throw Error('INCOMPLETE_T15_NATIVE_REPORT')
const journalPath=relativeFile(report.checksJournal),journal=readFileSync(journalPath,'utf8').trim().split('\n').map(s=>JSON.parse(s)) as Check[]
if(hashValue(journal)!==hashValue(report.checks))throw Error('NATIVE_CHECK_JOURNAL_MISMATCH')
if(new Set(report.checks.map(c=>c.id)).size!==report.checks.length)throw Error('DUPLICATE_NATIVE_CHECK_ID')
if(report.iterationJournal){const rows=readFileSync(relativeFile(report.iterationJournal),'utf8').trim().split('\n').map(s=>JSON.parse(s)) as Check[],latest=new Map<string,Check>();for(const r of rows)latest.set(r.id,r);if(hashValue([...latest.values()])!==hashValue(report.checks))throw Error('NATIVE_CHECKS_NOT_LATEST_ACTUAL_OBSERVATIONS')}
for(const check of report.checks){if(typeof check.pass!=='boolean'||!check.artifacts.length)throw Error('NATIVE_CHECK_LACKS_ACTUAL_ARTIFACT');for(const a of check.artifacts)if(sha(readFileSync(relativeFile(a.file)))!==a.sha256)throw Error('NATIVE_CHECK_ARTIFACT_CHANGED:'+a.file)}
const inputs=report.inputs.map(a=>{const raw=readFileSync(relativeFile(a.file),'utf8');if(sha(raw)!==a.sha256)throw Error('NATIVE_INPUT_CHANGED');const run=codec.import(raw);if(run.origin!=='normal')throw Error('NORMAL_INPUT_REQUIRED');return {file:a.file,run}})
const cache=new Map<string,GameRun>(),cases=[];let evaluated=0
for(const a of report.exports){
 if(!/^t15-(browser|ui-smoke)-[a-z0-9-]+\.json$/.test(a.file))throw Error('INVALID_NATIVE_EXPORT_NAME')
 const raw=readFileSync(relativeFile(a.file),'utf8');if(sha(raw)!==a.sha256)throw Error('NATIVE_EXPORT_CHANGED:'+a.file)
 const final=codec.import(raw),creation=final.receipts[0]!;if(final.origin!=='normal'||creation.kind!=='CreateRun')throw Error('NORMAL_COMMAND_PREFIX_REQUIRED')
 let prefix=hashValue([final.runId,final.actorId,final.seed,final.backgroundId,final.playerProfile,creation.commandId,creation.payloadSignature,final.versions]),run=cache.get(prefix)
 if(!run){run=createCampaignRun({runId:final.runId,actorId:final.actorId,commandId:creation.commandId,backgroundId:final.backgroundId,seed:final.seed,playerProfile:final.playerProfile});if(hashValue(run.receipts[0])!==hashValue(creation))throw Error('INITIAL_COMMAND_CONTRACT_MISMATCH');cache.set(prefix,run)}
 const commands=[]
 for(const receipt of final.receipts.slice(1)){
  const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore},next=hashValue([prefix,command]),cached=cache.get(next)
  if(cached)run=cached;else{const r=evaluateCommand(run,command,codec.registry,run.actorId);if(r.status!=='proposed')throw Error(JSON.stringify({file:a.file,command,result:r}));run=r.nextRun;cache.set(next,run);evaluated++}
  prefix=next;commands.push(command)
 }
 const replay=codec.export(run);if(replay!==raw||replay!==codec.export(final))throw Error('FULL_UI_PREFIX_NOT_BYTE_EQUAL:'+a.file)
 cases.push({file:a.file,role:a.role,runId:final.runId,revision:final.revision,seed:final.seed,versions:final.versions,commands,expectedHash:sha(raw),actualReplayHash:sha(replay),result:'BYTE_EQUAL'})
}
const auditedInputs=inputs.map(({file,run})=>{if(![...cache.values()].some(r=>r.runId===run.runId&&r.revision===run.revision&&codec.export(r)===codec.export(run)))throw Error('INPUT_NOT_REPLAYED_PREFIX:'+file);return {file,runId:run.runId,revision:run.revision,fullNormalPrefixByteEqual:true}})
const equality=report.equalPairs.map(([first,last])=>{if(!report.exports.some(e=>e.file===first)||!report.exports.some(e=>e.file===last)||readFileSync(relativeFile(first),'utf8')!==readFileSync(relativeFile(last),'utf8'))throw Error('CANDIDATE_RETRY_OR_READ_CHANGED');return {first,last,byteEqual:true}})
function sourceFiles(dir:string):string[]{return readdirSync(join(root,dir),{withFileTypes:true}).flatMap(i=>i.isDirectory()?sourceFiles(dir+'/'+i.name):/\.(tsx?|css)$/.test(i.name)?[dir+'/'+i.name]:[])}
const paths=[...sourceFiles('src'),'scripts/verify_life_browser_evidence.ts','scripts/collect_life_evidence.ts','scripts/evidence-output.ts','package.json','package-lock.json','docs/34-people-life-year-contract.md','index.html'],nativeAcceptanceComplete=report.checks.every(c=>c.pass)&&report.pending.length===0
writeFileSync(join(output,'t15-browser-replay-audit.json'),JSON.stringify({taskId:'T15',evidenceType:'audit_of_visible_UI_exports_full_normal_command_prefixes',result:'EXPORT_REPLAY_PASS',nativeAcceptanceComplete,pending:report.pending,failedNativeCheckIds:report.checks.filter(c=>!c.pass).map(c=>c.id),baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),nativeReport:reportFile,nativeReportHash:sha(reportRaw),checks:report.checks.length,passedNativeObservations:report.checks.filter(c=>c.pass).length,inputs:auditedInputs,cases,equality,evaluatedUniqueCommands:evaluated,cachePolicy:'Only identical complete creation identity/version and full command envelopes share immutable evaluated prefixes; every final export is byte-compared, every input must be an audited prefix.',sourceHashes:Object.fromEntries(paths.map(p=>[p,sha(readFileSync(join(root,p)))])),notCovered:['native_2020_prehistory_for_imported_engine_inputs','full24quarter_epilogue','original_three_png','human_playtest','overall_Q_X_acceptance',...report.pending.map(p=>p.id)]},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({result:'EXPORT_REPLAY_PASS',nativeAcceptanceComplete,exports:cases.length,inputs:inputs.length,equalPairs:equality.length,evaluatedUniqueCommands:evaluated,pending:report.pending.length}))
