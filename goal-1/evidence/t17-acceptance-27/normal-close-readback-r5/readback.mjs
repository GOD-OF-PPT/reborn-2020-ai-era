import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {resolve,dirname,relative} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {assertBrowserEvidenceWritable} from '../../../../scripts/browser_evidence_guard.mjs'
import {createCampaignCodec} from '../../../../src/application/campaign.ts'
import {projectRun} from '../../../../src/core/commands.ts'
import {relaySceneProgress} from '../../../../src/ui/relay-scene-progress.ts'

const dir=dirname(fileURLToPath(import.meta.url)),root=resolve(dir,'../../../..')
await assertBrowserEvidenceWritable(dir)
const sha=raw=>createHash('sha256').update(raw).digest('hex')
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b)
const write=(file,value)=>writeFileSync(resolve(dir,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'})
function fileIdentity(path){const raw=readFileSync(resolve(root,path));return {path,bytes:raw.length,sha256:sha(raw)}}
// Relative static imports include type files, so this is a conservative source
// binding, not a claim that every listed line executes during import.
function moduleClosure(entries){
 const found=new Set()
 const visit=path=>{
  if(found.has(path))return
  found.add(path)
  const source=readFileSync(resolve(root,path),'utf8')
  for(const match of source.matchAll(/\b(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){
   const next=relative(root,resolve(root,dirname(path),match[1]))
   if(/\.tsx?$/.test(next)&&existsSync(resolve(root,next)))visit(next)
  }
 }
 entries.forEach(visit)
 return [...found].sort()
}
const closure=moduleClosure(['src/application/campaign.ts','src/core/commands.ts','src/ui/relay-scene-progress.ts'])
const sources=[...closure,'package.json','package-lock.json','tsconfig.app.json'].map(fileIdentity)
const r5Path='goal-1/evidence/t17-acceptance-27/build-r5/source-after.json',r5Raw=readFileSync(resolve(root,r5Path)),r5=JSON.parse(r5Raw)
const r5Map=new Map(r5.files.map(row=>[row.path,row]))
const buildMismatches=sources.filter(row=>r5Map.get(row.path)?.sha256!==row.sha256)
write('source-before.json',{binding:'conservative relative-static-import closure; type imports included',entries:['src/application/campaign.ts','src/core/commands.ts','src/ui/relay-scene-progress.ts'],files:sources,r5Manifest:{path:r5Path,sha256:sha(r5Raw)},buildMismatches})

const paths=[
 'goal-1/evidence/t17-acceptance-27/chrome-main-r1/main-saved116-original-period-settled.json',
 'goal-1/evidence/t17-acceptance-27/chrome-normal-r5/normal-saved118-closed-period.json',
]
const codec=createCampaignCodec()
const frames=paths.map(path=>{
 const raw=readFileSync(resolve(root,path),'utf8'),run=codec.import(raw)
 assert.equal(codec.export(run),raw,'official codec roundtrip must preserve exact bytes')
 const view=projectRun(run),features=codec.registry.runtime.project(run),relay=features.relay
 assert.equal(run.origin,'normal');assert.equal(view.phase,'playing');assert.equal(relay.periods.length,1)
 return {path,raw,identity:{path,bytes:Buffer.byteLength(raw),sha256:sha(raw)},run,view,features,relay}
})
const [before,after]=frames,[a,b]=frames.map(frame=>frame.relay.periods[0])
assert.equal(before.view.revision,116);assert.equal(after.view.revision,118)
assert.equal(before.view.date,'2025-03-18');assert.equal(after.view.date,'2025-03-21')
assert.equal(before.view.runId,after.view.runId)
assert.equal(a.id,'rly:503e6b6995b626f7c3bec7a0dd02e180');assert.equal(a.id,b.id)
assert.equal(a.status,'settling');assert.equal(b.status,'closed')
assert.deepEqual(before.run.receipts,after.run.receipts.slice(0,before.run.receipts.length))
const commands=after.run.receipts.slice(before.run.receipts.length).map(receipt=>({commandId:receipt.commandId,kind:receipt.kind,date:receipt.date,revisionBefore:receipt.revisionBefore,revisionAfter:receipt.revisionAfter,payload:JSON.parse(receipt.payloadSignature).payload}))
assert.deepEqual(commands.map(c=>c.kind),['AdvanceTime','CollectRelayDue'])
assert.equal(commands[0].payload.date,'2025-03-21')

function snapshot(frame){
 const {relay,view,features,run}=frame,period=relay.periods[0],business=relay.businesses.find(row=>row.id===period.businessId),station=relay.stations.find(row=>row.businessId===business.id)
 const meters=relay.meters.filter(row=>row.periodId===period.id),sources=new Set([period.id,...meters.map(row=>row.id)])
 const invoices=relay.receivables.filter(row=>sources.has(row.sourceId))
 const differences=meters.filter(row=>row.auditedUnits!==null&&row.auditedUnits!==row.reportedUnits)
 const target={kind:'period',runId:view.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,periodId:period.id}
 const scene=relaySceneProgress(relay,view.date,target,{runId:view.runId,accountId:business.accountId,operations:view.operations})
 const account=view.accounts.find(row=>row.accountId===business.accountId)
 const grants=features.story.deployments.map(row=>({id:row.id,accountId:row.accountId,businessId:row.businessId,lifecycle:row.lifecycle,currentGrant:row.currentGrant,grants:row.grants,externalDelegations:row.externalDelegations}))
 const income=run.economy.ledger.metrics.filter(row=>row.accountId===business.accountId&&row.businessId===business.id&&row.kind==='income')
 return {runId:view.runId,origin:view.origin,phase:view.phase,date:view.date,revision:view.revision,
  period:{id:period.id,businessId:period.businessId,status:period.status,from:period.from,to:period.to,feePostedAt:period.feePostedAt,stoppedAt:period.stoppedAt,service:period.job,support:period.supportJob,meterCount:meters.length,audited:meters.filter(row=>row.auditedUnits!==null).length,knownDifferences:differences.length,uncorrectedKnown:differences.filter(row=>!relay.corrections.some(c=>c.meterId===row.id)).length,correctionCount:relay.corrections.filter(row=>meters.some(m=>m.id===row.meterId)).length,receivables:{count:invoices.length,amountFen:invoices.reduce((n,row)=>n+row.amountFen,0),collectedFen:invoices.reduce((n,row)=>n+row.collectedFen,0),reversedFen:invoices.reduce((n,row)=>n+row.reversedFen,0),unpaidFen:invoices.reduce((n,row)=>n+row.amountFen-row.collectedFen-row.reversedFen,0)}},
  scene:{phase:scene.phase,title:scene.title,wait:scene.wait??null},
  business:{id:business.id,accountId:business.accountId,company:business.company,lifecycle:business.lifecycle,stoppedAt:business.stoppedAt,funds:business.funds,publicAccount:account},
  personal:view.accounts.find(row=>row.accountId==='personal'),budget:view.budget,
  customerBalances:relay.customers.filter(row=>row.businessId===business.id).map(row=>({id:row.id,termEnd:row.termEnd,mode:row.mode,closedAt:row.closedAt,balance:row.balance})),
  supplierAssets:relay.supplyOptions.filter(row=>row.businessId===business.id).map(row=>({supplierId:row.supplierId,permitted:row.permitted,adapted:row.adapted,credit:row.credit,outstandingFen:row.outstandingFen})),
  income:{entryCount:income.length,amountFen:income.reduce((n,row)=>n+row.deltaFen,0),entriesSha256:sha(JSON.stringify(income))},
  ordinaryChanges:relay.changes,grants,
 }
}
const prior=snapshot(before),current=snapshot(after)
assert.equal(prior.scene.phase,'settling');assert.equal(current.scene.phase,'period-closed')
assert.equal(current.period.service.status,'completed');assert.equal(current.period.support.status,'completed')
assert.equal(current.period.meterCount,168);assert.equal(current.period.audited,168);assert.equal(current.period.knownDifferences,7);assert.equal(current.period.uncorrectedKnown,0);assert.equal(current.period.correctionCount,168)
assert.deepEqual(prior.period.service,current.period.service);assert.deepEqual(prior.period.support,current.period.support)
assert.equal(current.business.company,true);assert.equal(current.business.lifecycle,'operating');assert.equal(current.business.stoppedAt,null)
assert.equal(current.period.receivables.unpaidFen,0)
assert.equal(prior.period.receivables.unpaidFen,1212)
const changedInvoices=after.relay.receivables.flatMap(row=>{const old=before.relay.receivables.find(r=>r.id===row.id);assert.ok(old,'no newly created receivable during advance/collection');return row.collectedFen===old.collectedFen?[]:[{id:row.id,customerId:row.customerId,sourceId:row.sourceId,date:row.date,dueAt:row.dueAt,amountFen:row.amountFen,beforeCollectedFen:old.collectedFen,afterCollectedFen:row.collectedFen,collectedDeltaFen:row.collectedFen-old.collectedFen,reversedFen:row.reversedFen}]})
assert.equal(changedInvoices.length,2)
assert.ok(changedInvoices.every(row=>row.collectedDeltaFen===606&&row.dueAt==='2025-03-21'))
assert.equal(commands[1].payload.customerId,changedInvoices[0].customerId)
assert.equal(changedInvoices[0].customerId,changedInvoices[1].customerId)
const oldTransactions=before.run.economy.ledger.transactions,newTransactions=after.run.economy.ledger.transactions.slice(oldTransactions.length)
assert.deepEqual(oldTransactions,after.run.economy.ledger.transactions.slice(0,oldTransactions.length))
assert.equal(newTransactions.length,2)
assert.ok(newTransactions.every(row=>changedInvoices.some(invoice=>invoice.id===row.sourceEventId)&&row.lines.find(line=>line.accountId===current.business.accountId)?.deltaFen===606))
const newLedgerReceipts=after.run.economy.ledger.receipts.slice(before.run.economy.ledger.receipts.length).map(row=>({id:row.id,kind:row.kind,status:row.status,accountId:row.accountId,contractId:row.contractId,operation:JSON.parse(row.signature)}))
assert.equal(newLedgerReceipts.length,2);assert.ok(newLedgerReceipts.every(row=>row.kind==='collect_receivable'&&row.status==='applied'))
assert.equal(current.business.funds.cashFen-prior.business.funds.cashFen,1212)
assert.equal(current.business.funds.availableFen-prior.business.funds.availableFen,1212)
assert.equal(current.business.funds.availableFen,3066528)
assert.equal(current.business.funds.receivableFen,0);assert.equal(current.business.funds.payableFen,0)
for(const field of ['protectionRequiredFen','heldFen','prepaidLiabilityFen','supplierPrepaidFen','netAssetsFen'])assert.equal(prior.business.funds[field],current.business.funds[field],field+' must not be created by collection')
assert.deepEqual(prior.personal,current.personal);assert.deepEqual(prior.budget,current.budget)
assert.equal(current.budget.available,0)
assert.deepEqual(prior.income,current.income)
const recognized=rows=>rows.map(row=>({id:row.id,recognizedIncomeFen:row.balance.recognizedIncomeFen,prepaidFen:row.balance.prepaidFen}))
assert.deepEqual(recognized(prior.customerBalances),recognized(current.customerBalances))
assert.deepEqual(prior.ordinaryChanges,current.ordinaryChanges)
const h010=current.ordinaryChanges.find(row=>row.anchorId==='H010');assert.ok(h010);assert.equal(h010.acknowledgedAt,null)
for(const field of ['applications','adapters','offers','quotes'])assert.deepEqual(before.relay[field],after.relay[field])
assert.deepEqual(before.relay.customers.map(row=>row.terms),after.relay.customers.map(row=>row.terms))
assert.deepEqual(prior.grants,current.grants);assert.deepEqual(prior.supplierAssets,current.supplierAssets)
const end=sources.map(row=>fileIdentity(row.path))
assert.ok(same(sources,end),'actual source closure changed during readback')
assert.deepEqual(paths.map(fileIdentity),frames.map(frame=>frame.identity),'raw source bytes changed during readback')
write('source-after.json',{files:end,sourceUnchanged:true,rawUnchanged:true,buildMismatches})
const result={status:'READ_ONLY_OFFICIAL_IMPORT_AND_PUBLIC_READBACK_PASS',commandsIssued:0,completeCreationReplay:false,browserActions:0,
 sources:frames.map(frame=>frame.identity),r5ManifestMatches:buildMismatches.length===0,buildMismatches,
 before:prior,after:current,newCommittedCommands:commands,lastOriginalInvoices:changedInvoices,actualCashTransactions:newTransactions,newLedgerReceipts,
 checks:{sameRunSamePeriod:true,originalServiceSupportCompleted:true,original168AuditsAnd7CorrectedDifferences:true,lastTwoOriginal606FenCollected:true,companyStillOperating:true,protectionAndSupplierAssetNotReleased:true,receivableAndPayableZero:true,cashAndAvailableGainOnly1212Fen:true,incomeEntriesAndRecognizedIncomeUnchanged:true,ledgerNetAssetsUnchangedOnCollection:true,personalAndZeroApUnchanged:true,h010NotAcknowledged:true,originalCustomerSupplierAndAgentPermissionsUnchanged:true,sourceAndRawUnchanged:true},
 boundaries:['official codec import plus public projections and committed known ledger operations only; no new commands or storage writes','not a full CreateRun replay; Root separately audits all new branches','no hidden facts/random/future-result inspection','ledger net assets and projected net assets after unbilled accruals are reported separately','period closed does not close company or release customer prepaid protection/supplier credit','does not establish profitability, complete S4/goal, compatibility or new Chrome proof']}
write('result.json',result)
write('script-identity.json',fileIdentity(relative(root,fileURLToPath(import.meta.url))))
console.log(JSON.stringify({status:result.status,sources:result.sources,period:current.period,business:current.business,personal:current.personal,budget:current.budget,lastOriginalInvoices:changedInvoices,income:current.income,checks:result.checks,r5ManifestMatches:result.r5ManifestMatches,sourceCount:sources.length},null,2))
