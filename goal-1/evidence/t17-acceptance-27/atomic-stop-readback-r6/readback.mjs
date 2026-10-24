import {readFileSync,writeFileSync,existsSync,lstatSync} from 'node:fs'
import {resolve,dirname,relative} from 'node:path'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs'

const dir=dirname(fileURLToPath(import.meta.url)),root=resolve(dir,'../../../..')
assertBrowserEvidenceWritable(dir)
const sha=raw=>createHash('sha256').update(raw).digest('hex')
const write=(name,value)=>{assertBrowserEvidenceWritable(dir);writeFileSync(resolve(dir,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'})}
function identity(path){const full=resolve(root,path),stat=lstatSync(full);assert.ok(stat.isFile()&&!stat.isSymbolicLink(),'regular input/source required');const raw=readFileSync(full);return {path,bytes:raw.length,sha256:sha(raw),mode:stat.mode&0o777}}
// A fixed conservative relative-import closure, including type declarations.
// It binds the official codec/projectors; no UI phase/label module is an entry.
function moduleClosure(entries){
 const found=new Set()
 const visit=path=>{
  if(found.has(path))return
  assert.ok(path.startsWith('src/')&&!path.startsWith('src/ui/'),'official accounting closure must not depend on parallel UI labels')
  found.add(path)
  const source=readFileSync(resolve(root,path),'utf8')
  for(const match of source.matchAll(/\b(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){
   const next=relative(root,resolve(root,dirname(path),match[1]))
   if(/\.(?:tsx?|m?js|json)$/.test(next)&&existsSync(resolve(root,next)))visit(next)
  }
 }
 entries.forEach(visit);return [...found].sort()
}
const entries=['src/application/campaign.ts','src/core/commands.ts','src/persistence/codec.ts']
const closure=moduleClosure(entries),sourcePaths=[...closure,'package.json','package-lock.json','scripts/browser_evidence_guard.mjs']
const sourceBefore=sourcePaths.map(identity),scriptPath=relative(root,fileURLToPath(import.meta.url)),scriptBefore=identity(scriptPath)
const names={
 candidate92:'goal-1/evidence/t17-acceptance-27/chrome-atomic-r5/atomic-candidate92-startservice.json',
 old91:'goal-1/evidence/t17-acceptance-27/chrome-atomic-r5/atomic-old-saved91-after-abort.json',
 physical91:'goal-1/evidence/t17-acceptance-27/chrome-physical-old-r5/physical-readonly91-before-retry.json',
 physical92:'goal-1/evidence/t17-acceptance-27/chrome-physical-new-r5/physical-readonly92-after-retry.json',
 running93:'goal-1/evidence/t17-acceptance-27/chrome-stop-r5/stop-running93-before-original-stop.json',
 stopped94:'goal-1/evidence/t17-acceptance-27/chrome-stop-r5/stop-saved94-support-and-old-debts-retained.json',
}
const inputsBefore=Object.fromEntries(Object.entries(names).map(([name,path])=>[name,identity(path)]))
write('source-before.json',{binding:'fixed conservative official relative-import closure, type files included; not a claim each line executes',entries,nodeVersion:process.version,files:sourceBefore,coreApplicationModules:sourceBefore.filter(row=>/^src\/(core|application)\//.test(row.path)),uiModules:[],whole506SourceClaim:false})
write('inputs-before.json',inputsBefore)
write('script-before.json',scriptBefore)

let failure=null
try{
 // Import only after binding the source files. Registry construction is not a command/replay.
 const {createCampaignCodec}=await import(pathToFileURL(resolve(root,'src/application/campaign.ts')).href)
 const {projectRun}=await import(pathToFileURL(resolve(root,'src/core/commands.ts')).href)
 const codec=createCampaignCodec(),frames={}
 for(const [name,path]of Object.entries(names)){
  const raw=readFileSync(resolve(root,path),'utf8'),run=codec.import(raw)
  assert.equal(codec.export(run),raw,'official canonical roundtrip: '+name)
  const view=projectRun(run),features=codec.registry.runtime.project(run)
  assert.equal(run.origin,'normal');assert.equal(view.phase,'playing')
  assert.equal(codec.export(run),raw,'public projection must not mutate: '+name)
  frames[name]={path,raw,run,view,features,relay:features.relay}
 }
 const {candidate92,old91,physical91,physical92,running93,stopped94}=frames
 assert.equal(inputsBefore.old91.sha256,'fbb353ba3c510d4e2a116170f78e5ee1bd4b93580541823195f8aa9c8f41a321')
 assert.equal(inputsBefore.candidate92.sha256,'ae94d0c6e03fa447a0f5acd72a847176f290c34cc402651ba59baa8a42d30f54')
 assert.equal(old91.raw,physical91.raw);assert.equal(candidate92.raw,physical92.raw)
 for(const [name,expected]of [['old91',91],['physical91',91],['candidate92',92],['physical92',92],['running93',93],['stopped94',94]]){
  assert.equal(frames[name].view.revision,expected,name)
  assert.equal(frames[name].view.runId,old91.view.runId,name)
  assert.deepEqual(frames[name].run.versions,old91.run.versions,name)
 }
 const receipt=receipt=>({commandId:receipt.commandId,kind:receipt.kind,date:receipt.date,revisionBefore:receipt.revisionBefore,revisionAfter:receipt.revisionAfter,payload:JSON.parse(receipt.payloadSignature).payload})
 const suffix=(before,after)=>{assert.deepEqual(after.run.receipts.slice(0,before.run.receipts.length),before.run.receipts);return after.run.receipts.slice(before.run.receipts.length).map(receipt)}
 const startReceipts=suffix(old91,candidate92),runningReceipts=suffix(candidate92,running93),stopReceipts=suffix(running93,stopped94)
 assert.equal(old91.relay.periods.length,0)
 assert.equal(startReceipts.length,1);assert.equal(startReceipts[0].kind,'StartRelayServicePeriod')
 assert.equal(candidate92.run.receipts.filter(row=>row.kind==='StartRelayServicePeriod').length,1)
 assert.equal(runningReceipts.length,1);assert.equal(runningReceipts[0].kind,'AdvanceTime');assert.equal(runningReceipts[0].payload.date,'2025-01-28')
 assert.equal(stopReceipts.length,1);assert.equal(stopReceipts[0].kind,'StopRelayPeriod')
 const periodId='rly:c89c1062f0ddd18e27ea8de398634f9e'
 const period=frame=>{assert.equal(frame.relay.periods.length,1);const p=frame.relay.periods[0];assert.equal(p.id,periodId);return p}
 const planned=period(candidate92),running=period(running93),stopped=period(stopped94)
 assert.equal(planned.status,'planned');assert.equal(running.status,'running');assert.equal(stopped.status,'stopped')
 assert.equal(stopReceipts[0].payload.periodId,periodId)
 assert.equal(candidate92.view.date,'2025-01-27');assert.equal(running93.view.date,'2025-01-28');assert.equal(stopped94.view.date,running93.view.date)
 assert.deepEqual(planned.customerIds,startReceipts[0].payload.customerIds);assert.deepEqual(planned.supplierIds,startReceipts[0].payload.supplierIds)
 assert.deepEqual(running.customerIds,planned.customerIds);assert.deepEqual(stopped.customerIds,running.customerIds)
 assert.deepEqual(stopped.supplierIds,running.supplierIds);assert.equal(stopped.businessId,running.businessId)
 assert.equal(running.job.status,'running');assert.equal(stopped.job.status,'interrupted');assert.equal(stopped.job.releasedAt,'2025-01-28');assert.equal(stopped.stoppedAt,'2025-01-28')
 assert.equal(running.supportJob.status,'planned');assert.deepEqual(running.supportJob,stopped.supportJob)
 const action=(frame,job)=>{const rows=frame.run.economy.actions.filter(row=>row.definition.id===job.actionId);assert.equal(rows.length,1);return rows[0]}
 const serviceAction=action(running93,running.job),stoppedAction=action(stopped94,stopped.job),supportAction=action(running93,running.supportJob),stoppedSupport=action(stopped94,stopped.supportJob)
 assert.equal(serviceAction.definition.costFen,300000);assert.equal(serviceAction.definition.actionPoints,1);assert.equal(serviceAction.status,'executed');assert.equal(serviceAction.executedAt,'2025-01-28')
 assert.equal(stoppedAction.status,'interrupted');assert.equal(stoppedAction.executedAt,serviceAction.executedAt);assert.equal(stoppedAction.finishedAt,'2025-01-28');assert.deepEqual(stoppedAction.definition,serviceAction.definition)
 assert.equal(supportAction.definition.costFen,150000);assert.equal(supportAction.definition.actionPoints,1);assert.equal(supportAction.status,'reserved');assert.deepEqual(stoppedSupport,supportAction)
 const supportReservation=frame=>{const row=frame.run.economy.ledger.reservations.find(row=>row.id===supportAction.definition.cashReservationId);assert.ok(row);assert.equal(row.status,'active');assert.equal(row.amountFen,150000);return row}
 assert.deepEqual(supportReservation(running93),supportReservation(stopped94))
 const expenses=running93.run.economy.ledger.receipts.filter(row=>row.kind==='expense').map(row=>({receiptId:row.id,status:row.status,operation:JSON.parse(row.signature)})).filter(row=>row.operation.referenceId===serviceAction.definition.id)
 assert.equal(expenses.length,1);assert.equal(expenses[0].status,'applied');assert.equal(expenses[0].operation.amountFen,300000)
 const serviceCash=running93.run.economy.ledger.transactions.filter(row=>row.id===expenses[0].receiptId)
 assert.equal(serviceCash.length,1);assert.equal(serviceCash[0].lines.find(line=>line.accountId===serviceAction.definition.accountId).deltaFen,-300000)
 assert.equal(candidate92.view.budget.reserved,2);assert.equal(running93.view.budget.reserved,1)
 assert.equal(running93.view.budget.spent,candidate92.view.budget.spent+1);assert.equal(running93.view.budget.available,candidate92.view.budget.available)
 assert.deepEqual(running93.view.budget,stopped94.view.budget)
 assert.deepEqual(running93.run.economy.ledger,stopped94.run.economy.ledger,'stop must not refund cost, release future support or alter old ledger')
 assert.deepEqual(running93.view.accounts,stopped94.view.accounts)
 for(const field of ['businesses','stations','applications','adapters','supplyOptions','audiences','offers','customers','meters','auditJobs','audits','receivables','corrections','refunds','quotes','changes','observations'])assert.deepEqual(running93.relay[field],stopped94.relay[field],'original public relay '+field)
 const without=(object,keys)=>Object.fromEntries(Object.entries(object).filter(([key])=>!keys.includes(key)))
 assert.deepEqual(without(running,['status','stoppedAt','job']),without(stopped,['status','stoppedAt','job']))
 assert.deepEqual(without(running.job,['status','releasedAt']),without(stopped.job,['status','releasedAt']))
 const grants=frame=>frame.features.story.deployments.map(row=>({id:row.id,accountId:row.accountId,businessId:row.businessId,lifecycle:row.lifecycle,currentGrant:row.currentGrant,grants:row.grants,externalDelegations:row.externalDelegations}))
 assert.deepEqual(grants(running93),grants(stopped94))
 function snapshot(frame){
  const p=frame.relay.periods[0]??null,b=p?frame.relay.businesses.find(row=>row.id===p.businessId):frame.relay.businesses[0],ledger=frame.run.economy.ledger
  const income=ledger.metrics.filter(row=>row.businessId===b.id&&row.kind==='income'),cost=ledger.metrics.filter(row=>row.businessId===b.id&&row.kind==='cost')
  const knownLedger=ledger.receipts.filter(row=>row.accountId===b.accountId).map(row=>({id:row.id,kind:row.kind,status:row.status,operation:JSON.parse(row.signature)}))
  return {identity:inputsBefore[Object.keys(frames).find(key=>frames[key]===frame)],runId:frame.view.runId,revision:frame.view.revision,date:frame.view.date,origin:frame.view.origin,budget:frame.view.budget,period:p,business:{id:b.id,accountId:b.accountId,company:b.company,lifecycle:b.lifecycle,stoppedAt:b.stoppedAt,funds:b.funds,metrics:b.metrics},publicAccount:frame.view.accounts.find(row=>row.accountId===b.accountId),personalAccount:frame.view.accounts.find(row=>row.accountId==='personal'),customerBalances:frame.relay.customers.map(row=>({id:row.id,businessId:row.businessId,signedAt:row.signedAt,termEnd:row.termEnd,mode:row.mode,closedAt:row.closedAt,balance:row.balance})),supplierAssets:frame.relay.supplyOptions,receivables:frame.relay.receivables,obligations:ledger.obligations.filter(row=>row.accountId===b.accountId),income:{amountFen:income.reduce((n,row)=>n+row.deltaFen,0),entries:income.length,sha256:sha(JSON.stringify(income))},cost:{amountFen:cost.reduce((n,row)=>n+row.deltaFen,0),entries:cost.length,sha256:sha(JSON.stringify(cost))},customerProtection:ledger.reservations.filter(row=>row.accountId===b.accountId&&row.kind==='customer_protection'),activePlanReservations:ledger.reservations.filter(row=>row.accountId===b.accountId&&row.kind==='plan'&&row.status==='active'),knownPostedOperations:knownLedger,agentPermissions:grants(frame),ledgerSha256:sha(JSON.stringify(ledger))}
 }
 const result={status:'OFFICIAL_READ_ONLY_ATOMIC_STOP_READBACK_PASS',commandsIssued:0,previewCalls:0,replayCalls:0,browserActions:0,storageWrites:0,inputs:inputsBefore,sourceBinding:{entries,conservativeModules:closure.length,coreApplicationModules:sourceBefore.filter(row=>/^src\/(core|application)\//.test(row.path)).length,uiModules:0,whole506SourceClaim:false},canonicalRoundtripCount:6,uniqueRunIds:1,uniqueRevisions:[91,92,93,94],atomic:{old91EqualsIndependentPhysical91:true,candidate92EqualsRetryIndependentPhysical92:true,old91:snapshot(old91),candidate92:snapshot(candidate92),oneNewOriginalStartReceipt:startReceipts[0]},finiteStop:{running93:snapshot(running93),stopped94:snapshot(stopped94),newOriginalReceipt:stopReceipts[0],serviceActionBefore:serviceAction,serviceActionAfter:stoppedAction,supportActionUnchanged:supportAction,supportReservationUnchanged:supportReservation(stopped94),actualServiceExpense:expenses[0],actualServiceCash:serviceCash[0]},checks:{sameRunAndSameActualPeriod:true,oneStartReceiptNotTwo:true,serviceActuallyPaid300000FenAndSpent1Point:true,futureSupport150000FenAnd1PointStillReserved:true,stopAddsNoPaymentOrRefund:true,stopDoesNotReleaseSupportOrRestoreServiceAp:true,allLedgerBytesUnchangedOnStop:true,publicCashIncomeProtectionReceivablesPayablesUnchangedOnStop:true,originalCustomersSuppliersPermissionsAndMeterEvidenceUnchanged:true,businessAndStationNotClosedByPeriodStop:true},boundaries:['official codec import/export plus official public playing projections and already committed posted ledger operations only','raw imports do not replay or issue game commands; no controller/session/store was constructed','current UI label modules are excluded, so this is not a claim about all 506 source files or planned-support wording','physical source identity is the recorded native export supplied by Root; this script does not reopen browser storage','not a full CreateRun replay or new Chrome/playtest proof; Root audits actual branches separately','does not establish whole R1/S4/goal completion, profitability, formal P3/62/22 or compatibility']}
 write('result.json',result)
 console.log(JSON.stringify({status:result.status,inputs:inputsBefore,periodId,atomicReceipt:startReceipts[0],stopReceipt:stopReceipts[0],servicePaidFen:300000,supportReservedFen:150000,runningBudget:running93.view.budget,stoppedBudget:stopped94.view.budget,runningFunds:result.finiteStop.running93.business.funds,stoppedFunds:result.finiteStop.stopped94.business.funds,checks:result.checks,sourceBinding:result.sourceBinding},null,2))
}catch(error){failure=error;write('failure.json',{name:error.name,message:error.message,stack:error.stack});throw error}
finally{
 const sourceAfter=sourcePaths.map(identity),inputsAfter=Object.fromEntries(Object.entries(names).map(([name,path])=>[name,identity(path)])),scriptAfter=identity(scriptPath)
 const sourceSame=JSON.stringify(sourceBefore)===JSON.stringify(sourceAfter),inputSame=JSON.stringify(inputsBefore)===JSON.stringify(inputsAfter),scriptSame=JSON.stringify(scriptBefore)===JSON.stringify(scriptAfter)
 write('source-after.json',{files:sourceAfter,sourceUnchanged:sourceSame,inputs:inputsAfter,rawUnchanged:inputSame,script:scriptAfter,scriptUnchanged:scriptSame,whole506SourceClaim:false,checksReached:failure===null})
 assert.ok(sourceSame,'fixed official source closure changed during readback');assert.ok(inputSame,'actual source raw bytes changed during readback');assert.ok(scriptSame,'readback script changed during execution')
}
