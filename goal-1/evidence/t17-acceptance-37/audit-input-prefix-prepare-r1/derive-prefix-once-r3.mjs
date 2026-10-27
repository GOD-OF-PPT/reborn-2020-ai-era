import fs from 'node:fs'
import path from 'node:path'
import {read,sha,sources,dependencies,guard,repo} from '../../t17-acceptance-36/normal-continuity-audit-r1/io.mjs'

// Future-only derived input. Root independent review and exact GO are mandatory.
const prepare='goal-1/evidence/t17-acceptance-37/audit-input-prefix-prepare-r1'
const originalPath='goal-1/evidence/t17-acceptance-27/chrome-normal-r5/normal-saved118-closed-period.json'
const originalSha='73a542da47b270f9e02d533003ac6f8c803907037b586f0f29d5393ec49458fb'
const equalIdentity=(a,b)=>a?.path===b?.path&&a?.bytes===b?.bytes&&a?.sha256===b?.sha256&&a?.mode===b?.mode
function differences(first,last){const a=new Map(first.map(r=>[r.path,r])),b=new Map(last.map(r=>[r.path,r]));if(a.size!==first.length||b.size!==last.length)throw Error('DUPLICATE_IDENTITY_PATH');return [...new Set([...a.keys(),...b.keys()])].filter(n=>!equalIdentity(a.get(n),b.get(n)))}
function sameData(a,b){if(a===b)return true;if(a===null||b===null||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&sameData(a[k],b[k]))}
function one(rows,label){if(rows.length!==1)throw Error('EXACT_ONE_PUBLIC_SOURCE_REQUIRED:'+label);return rows[0]}
function requireIdentity(row){const current=read(row.path);if(!equalIdentity(current.identity,row))throw Error('FROZEN_FILE_CHANGED:'+row.path);return current}
if(process.argv.length!==4||process.argv[2]!=='--root-go')throw Error('EXPLICIT_ROOT_GO_REQUIRED')
const contractFile=read(prepare+'/frozen-contract-r3.json'),contract=JSON.parse(contractFile.bytes.toString('utf8')),goFile=read(process.argv[3]),go=JSON.parse(goFile.bytes.toString('utf8'))
if(go.authorizedBy!=='/root'||go.operation!=='derive_normal101_via_full118_once'||!equalIdentity(go.contract,contractFile.identity)||!go.independentReview)throw Error('EXACT_ROOT_GO_AND_INDEPENDENT_REVIEW_REQUIRED')
requireIdentity(go.independentReview)
if(contract.state!=='prepared_not_executed'||contract.original.path!==originalPath||contract.original.bytes!==2900985||contract.original.sha256!==originalSha||contract.prefix.revision!==101||contract.prefix.receiptCount!==101||contract.originalReceiptCount!==118||contract.historicalPostCreateCommands!==117||contract.expectedOfficialSources!==127||contract.expectedDependencies!==901||contract.p3.length!==26)throw Error('FIXED_NORMAL118_TO101_CONTRACT_REQUIRED')
if(process.version!=='v22.12.0'||process.version!==contract.nodeVersion)throw Error('FROZEN_NODE2212_REQUIRED')
const authority=[contractFile.identity,goFile.identity,go.independentReview]
function bindings(){return {officialSources:sources(),dependencies:dependencies(),p3:contract.p3.map(r=>read(r.path).identity),references:contract.references.map(r=>read(r.path).identity),authority:authority.map(r=>read(r.path).identity)}}
const expected={officialSources:contract.officialSources,dependencies:contract.dependencies,p3:contract.p3,references:contract.references,authority}
const before=bindings(),initialDifferences=Object.fromEntries(Object.keys(expected).map(k=>[k,differences(expected[k],before[k])]))
if(before.officialSources.length!==127||before.dependencies.length!==901||Object.values(initialDifferences).some(a=>a.length))throw Error('INITIAL_SOURCE_INPUT_RUNTIME_AUTHORITY_DRIFT')
const directory=contract.outputDirectory
if(!/^goal-1\/evidence\/t17-acceptance-37\/audit-input-prefix-run-r[1-9][0-9]*$/.test(directory)||directory!=='goal-1/evidence/t17-acceptance-37/audit-input-prefix-run-r1'||go.outputDirectory!==directory)throw Error('FRESH_EXACT_SIBLING_RUN_ROOT_REQUIRED')
const output=path.resolve(repo,directory)
guard(path.dirname(output));if(fs.existsSync(output))throw Error('ONE_FRESH_EXECUTION_ONLY');fs.mkdirSync(output);guard(output)
function put(name,value){if(path.basename(name)!==name)throw Error('SINGLE_OWNED_OUTPUT_NAME_REQUIRED');guard(output);fs.writeFileSync(path.join(output,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})}
put('input.md',read(prepare+'/input.md').bytes.toString('utf8'))
put('plan.md','One original normal Create and its117 original postCreate commands only. Capture original101 as an immutable in-memory codec string; reproduce118 byte-for-byte before publishing101. No persistent head, new gameplay command, seed search or private-truth inspection. Exact contract/GO and independent review are bound in source-before.json.\n')
put('tasks.md','- [ ] One frozen original118 complete replay and public101 preconditions.\n- [ ] Source/input/runtime/P326/authority final identity and only then prefix publication.\nFinal actual status is result.json; this wx initial record is never overwritten.\n')
put('source-before.json',before)
put('start.json',{at:new Date().toISOString(),argv:process.argv,cwd:repo,node:process.version,contract:contractFile.identity,rootGo:goFile.identity,independentReview:go.independentReview,newNativeCreates:0,newNativeCommands:0,role:'Historical normal input derivation only; no Controller/Store/Session or persistent head.'})
const started=Date.now(),steps=[];let creationAttempts=0,creationCompletions=0,error=null,after=null,finalDifferences=null,fullEndpointByteEqual=false,prefixRaw=null,publicFacts=null,published=false
try{
 // All product imports occur only after the exact frozen cut and Root GO checks.
 const {createCampaignCodec,createCampaignRun}=await import('../../../../src/application/campaign.ts')
 const {evaluateCommand,projectRun}=await import('../../../../src/core/commands.ts')
 const codec=createCampaignCodec(),data=requireIdentity(contract.original),sourceText=data.bytes.toString('utf8'),original=codec.import(sourceText)
 if(codec.export(original)!==sourceText||original.origin!=='normal'||original.runId!==contract.runId||original.revision!==118||original.receipts.length!==118)throw Error('EXACT_NORMAL_SOURCE_CODEC_REQUIRED')
 const first=original.receipts[0]
 if(first.kind!=='CreateRun'||first.commandId!=='create')throw Error('ORIGINAL_CREATION_RECEIPT_REQUIRED')
 // The original seed is passed through only as the official Create dependency.
 // It is never displayed, inspected, varied, scored or used to choose this input.
 creationAttempts++
 let run=createCampaignRun({runId:original.runId,actorId:original.actorId,commandId:first.commandId,backgroundId:original.backgroundId,seed:original.seed,playerProfile:original.playerProfile})
 creationCompletions++
 run=codec.import(codec.export(run))
 if(!sameData(run.receipts,[first]))throw Error('ORIGINAL_CREATE_RECEIPT_MISMATCH')
 for(const [index,receipt]of original.receipts.slice(1).entries()){
  const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore}
  const step={originalReceiptOrdinal1:index+2,postCreateOrdinal1:index+1,commandId:receipt.commandId,kind:receipt.kind,revisionBefore:receipt.revisionBefore,revisionAfter:receipt.revisionAfter,date:receipt.date,status:'attempted'};steps.push(step)
  const result=evaluateCommand(run,command,codec.registry,original.actorId);step.commandResult=result.status
  if(result.status!=='proposed')throw Error('ORIGINAL_RECEIPT_REPLAY_REJECTED:'+receipt.commandId+':'+JSON.stringify(result.reasonCodes??[result.status]))
  if(!sameData(result.receipt,receipt))throw Error('ORIGINAL_RECEIPT_RESULT_MISMATCH:'+receipt.commandId)
  const raw=codec.export(result.nextRun);run=codec.import(raw)
  if(codec.export(run)!==raw)throw Error('HISTORICAL_STEP_CODEC_ROUNDTRIP_MISMATCH')
  step.status='proposed_codec_roundtrip';
  if(run.revision===101){if(prefixRaw!==null||receipt.commandId!==contract.prefix.lastCommandId||receipt.kind!=='AdvanceTime')throw Error('EXACT101_CAPTURE_BOUNDARY_REQUIRED');prefixRaw=raw}
 }
 if(steps.length!==117||codec.export(run)!==sourceText||sha(sourceText)!==originalSha||prefixRaw===null)throw Error('FULL118_BYTE_EQUAL_BEFORE_PREFIX_PUBLICATION_REQUIRED')
 fullEndpointByteEqual=true
 const prefix=codec.import(prefixRaw),view=projectRun(prefix),project=codec.registry.runtime?.project
 if(typeof project!=='function')throw Error('OFFICIAL_PUBLIC_PROJECT_REQUIRED')
 const features=project.call(codec.registry.runtime,prefix),relay=features.relay,expectedPublic=contract.prefix.publicTarget
 if(codec.export(prefix)!==prefixRaw||!sameData(prefix.receipts,original.receipts.slice(0,101))||prefix.revision!==101||prefix.receipts.length!==101||prefix.runId!==original.runId||prefix.actorId!==original.actorId||prefix.backgroundId!==original.backgroundId||prefix.origin!=='normal'||!sameData(prefix.versions,original.versions)||!sameData(view.playerProfile,original.playerProfile)||view.date!=='2025-03-07'||view.phase!=='playing')throw Error('ORIGINAL101_IDENTITY_OR_RECEIPTS_NOT_PRESERVED')
 if(!relay||relay.casebook?.status!=='ready'||relay.casebook.runId!==view.runId||relay.casebook.revision!==101||relay.casebook.asOf!==view.date)throw Error('EXACT_PUBLIC_CASEBOOK_REQUIRED')
 const business=one(relay.businesses.filter(b=>b.id===expectedPublic.businessId),'business'),station=one(relay.stations.filter(s=>s.id===expectedPublic.stationId&&s.businessId===business.id),'station'),period=one(relay.periods.filter(p=>p.id===expectedPublic.periodId&&p.businessId===business.id),'period'),meter=one(relay.meters.filter(m=>m.id===expectedPublic.meterId&&m.periodId===period.id&&m.customerId===expectedPublic.customerId),'meter'),audit=one(relay.audits.filter(a=>a.id===expectedPublic.auditId&&a.meterId===meter.id&&a.businessId===business.id),'audit'),customer=one(relay.customers.filter(c=>c.id===meter.customerId&&c.businessId===business.id),'customer')
 const periodMeterIds=new Set(relay.meters.filter(m=>m.periodId===period.id).map(m=>m.id)),periodAudits=relay.audits.filter(a=>periodMeterIds.has(a.meterId)),auditJob=one(relay.auditJobs.filter(a=>a.jobId===audit.jobId),'completed original audit batch')
 if(business.accountId!==expectedPublic.accountId||!view.accounts.some(a=>a.accountId===business.accountId)||station.closedAt!==null||periodMeterIds.size!==168||periodAudits.length!==168||periodAudits.some(a=>a.completedAt!=='2025-03-07'||a.actualUnits===null)||relay.corrections.length!==0||relay.meters.some(m=>m.correctionId!==null)||audit.completedAt!=='2025-03-07'||audit.actualUnits!==1011||meter.reportedUnits!==1112||meter.auditedUnits!==1011||meter.unitPriceFen!==6||meter.unitCostFen!==2||meter.supplierId!=='cedar-direct'||meter.date!=='2025-02-07'||auditJob.job?.status!=='completed'||auditJob.job.completeAt!=='2025-03-07'||auditJob.meterCount!==168||!auditJob.completed)throw Error('PUBLIC101_COMPLETED_UNCORRECTED_TARGET_REQUIRED')
 const finance=one(features.workbench.finance.filter(f=>f.accountId===business.accountId),'same enterprise public finance')
 publicFacts={method:'Official projectRun and the same codec.registry.runtime.project only, after complete118 endpoint matches. No unaudited meter.actualUnits/seed/queue/fact access.',runId:view.runId,revision:view.revision,date:view.date,phase:view.phase,backgroundId:view.backgroundId,playerProfile:view.playerProfile,budget:view.budget,accounts:view.accounts,casebook:{status:relay.casebook.status,runId:relay.casebook.runId,revision:relay.casebook.revision,asOf:relay.casebook.asOf},business,station,period,auditJob,audit,originalPublicMeter:meter,customer,periodMeterCount:periodMeterIds.size,completedPeriodAuditCount:periodAudits.length,originalPeriodAuditIds:periodAudits.map(a=>a.id),correctionCount:relay.corrections.length,oldResponsibilities:{receivables:relay.receivables,obligations:finance.obligations,supplierAssets:relay.supplyOptions.filter(o=>o.businessId===business.id).map(o=>({supplierId:o.supplierId,credit:o.credit,outstandingFen:o.outstandingFen}))}}
 if(codec.export(prefix)!==prefixRaw)throw Error('PUBLIC_READ_MUTATED_PREFIX')
 after=bindings();finalDifferences=Object.fromEntries(Object.keys(before).map(k=>[k,differences(before[k],after[k])]))
 put('source-after.json',after)
 if(Object.values(finalDifferences).some(a=>a.length))throw Error('FINAL_SOURCE_INPUT_RUNTIME_AUTHORITY_DRIFT')
 put('public101-facts.json',publicFacts)
 put('replay-metadata.json',{creationHistories:1,historicalPostCreateCommands:117,steps,fullEndpoint:contract.original,fullEndpointByteEqual,retainedPrefix:{revision:101,creationHistories:1,historicalPostCreateCommands:100,receiptCount:101},newNativeCreates:0,newNativeCommands:0})
 // This provenance is a derivation record, never a saved_ui/Native capture claim.
 put('provenance.json',{at:new Date().toISOString(),role:'derived_normal_prefix',requiresPassedResult:true,source:contract.original,originalManifest:contract.originalManifest,originalSeal:contract.originalSeal,fullEndpointByteEqual,creationHistories:1,historicalPostCreateCommands:117,selectedPrefix:{file:'normal-prefix101-before-original-period-correction.json',revision:101,date:view.date,receiptCount:101,historicalPostCreateCommands:100,bytes:Buffer.byteLength(prefixRaw),sha256:sha(prefixRaw),lastOriginalCommandId:contract.prefix.lastCommandId,nextOriginalCommandId:contract.prefix.nextCommandId,nextOriginalKind:'CorrectRelayPeriod'},target:expectedPublic,newNativeCreates:0,newNativeCommands:0,persistentHeadWrites:0,limit:'Original101 derived from one legal complete source history, not a new life or an original saved_ui capture. Only a later actual UI CorrectRelayUsage/save creates a new102 branch; do not concatenate old whole-period102 or old118.'})
 put('normal-prefix101-before-original-period-correction.json',prefixRaw)
 const publishedRaw=read(directory+'/normal-prefix101-before-original-period-correction.json')
 if(publishedRaw.bytes.toString('utf8')!==prefixRaw)throw Error('PUBLISHED_PREFIX_BYTES_MISMATCH')
 published=true
}catch(failure){error={name:failure.name,message:failure.message,stack:failure.stack};if(after===null){try{after=bindings();finalDifferences=Object.fromEntries(Object.keys(before).map(k=>[k,differences(before[k],after[k])]))
 put('source-after.json',after)}catch(bindingFailure){error.finalBindingError={name:bindingFailure.name,message:bindingFailure.message}}}}
if(!fs.existsSync(path.join(output,'replay-metadata.json')))put('failed-replay-metadata.json',{actualHistoricalCreateAttempts:creationAttempts,actualHistoricalCreateCompletions:creationCompletions,steps,fullEndpointByteEqual,prefixCapturedOnlyInMemory:prefixRaw!==null,published,newNativeCreates:0,newNativeCommands:0})
const passed=error===null&&published&&fullEndpointByteEqual&&publicFacts!==null&&finalDifferences!==null&&Object.values(finalDifferences).every(a=>a.length===0)
const result={at:new Date().toISOString(),passed,wallMs:Date.now()-started,normalSourceHistoryCount:1,actualHistoricalCreateAttempts:creationAttempts,actualHistoricalCreateCompletions:creationCompletions,proposedHistoricalCommands:steps.filter(s=>s.commandResult==='proposed').length,attemptedHistoricalPostCreateCommands:steps.length,successfulHistoricalPostCreateCommands:steps.filter(s=>s.status==='proposed_codec_roundtrip').length,full118ByteEqual:fullEndpointByteEqual,prefixPublished:published,prefix:published?read(directory+'/normal-prefix101-before-original-period-correction.json').identity:null,differences:finalDifferences,error,newNativeCreates:0,newNativeCommands:0,persistentHeadWrites:0,limit:'Historical normal input derivation only. result.passed must be true before any future UI import. This does not execute new single correction, prove Native interaction, visual/human acceptance, all U4B/C-S4-R, compatibility or whole goal.'}
put('result.json',result);put('terminal.json',{at:result.at,exitCode:passed?0:1,wallMs:result.wallMs,passed})
console.log(JSON.stringify({passed,attemptedHistoricalCommands:steps.length,full118ByteEqual:fullEndpointByteEqual,prefixPublished:published,prefix:result.prefix,error:error?{name:error.name,message:error.message}:null}))
if(!passed)process.exitCode=1
