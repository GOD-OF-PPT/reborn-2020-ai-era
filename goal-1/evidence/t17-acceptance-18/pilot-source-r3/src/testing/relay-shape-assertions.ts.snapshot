import {campaignRelay,campaignStory} from '../application/campaign.ts'
import {projectRelay} from '../core/relay-projection.ts'
import {projectStory} from '../core/story-projection.ts'
import {accountPosition,type LedgerOperation,type MetricEntry} from '../core/ledger.ts'
import {canonicalJson} from '../core/identity.ts'
import {addDays} from '../core/calendar.ts'
import type {GameRun} from '../core/run-types.ts'
import {RELAY_CORE_CHECKPOINTS,type RelayCoreCheckpointName,type RelayShape} from './relay-shape-types.ts'

export type RelayCheckpointStatus='passed'|'blocked'|'not_reached'
export interface RelayShapeTarget{
 readonly businessId:string
 readonly accountId:string
 readonly customerId:string|null
 readonly personId:string|null
 readonly audienceId:string|null
 readonly periodId:string|null
 readonly serviceJobId:string|null
 readonly supportJobId:string|null
 readonly auditJobIds:readonly string[]
}
export interface RelayShapeMoney{
 readonly date:string
 readonly accounts:readonly {
  accountId:string;originalCashFen:number;cashFen:number;cashDeltaFen:number;transactionDeltaFen:number
  heldFen:number;availableFen:number;protectionRequiredFen:number;protectionShortfallFen:number;commitmentShortfallFen:number
  prepaidLiabilityFen:number;supplierPrepaidFen:number;receivableFen:number;payableFen:number
 }[]
 readonly preserved:{customers:number;periods:number;meters:number;corrections:number;ledgerTransactions:number;ledgerReceipts:number}
 readonly target:{incomeFen:number;usageIncomeFen:number;periodFeeFen:number;supplierCostFen:number;cashCollectedFen:number
  remainingReceivableFen:number;remainingProtectedFen:number;duePayableFen:number;futurePayableFen:number}
}
export interface RelayShapeAssessment{
 readonly target:RelayShapeTarget
 readonly checkpoints:readonly {name:RelayCoreCheckpointName;status:RelayCheckpointStatus;evidence:unknown}[]
 readonly positive:boolean
 readonly money:RelayShapeMoney
}

function check(value:unknown,code:string):asserts value{if(!value)throw Error(code)}
function equal(a:unknown,b:unknown,code:string){check(canonicalJson(a)===canonicalJson(b),code)}
function total(values:readonly number[]){
 let n=0n
 for(const value of values){check(Number.isSafeInteger(value),'RELAY_SHAPE_NONINTEGER_MONEY');n+=BigInt(value)}
 const result=Number(n);check(Number.isSafeInteger(result),'RELAY_SHAPE_MONEY_OVERFLOW');return result
}
function preserve<T extends {id:string}>(before:readonly T[],after:readonly T[],label:string){
 const rows=new Map(after.map(row=>[row.id,row]));check(rows.size===after.length,'RELAY_SHAPE_DUPLICATE_'+label)
 for(const row of before){const code='RELAY_SHAPE_OLD_'+label+'_CHANGED:'+row.id;check(rows.has(row.id),code);equal(rows.get(row.id),row,code)}
}
function appendOnly<T>(before:readonly T[],after:readonly T[],label:string){
 check(after.length>=before.length,'RELAY_SHAPE_OLD_'+label+'_REMOVED')
 equal(after.slice(0,before.length),before,'RELAY_SHAPE_OLD_'+label+'_CHANGED')
}
function operations(run:GameRun){
 return run.economy.ledger.receipts.map(receipt=>{
  const operation=JSON.parse(receipt.signature) as LedgerOperation
  check(operation.id===receipt.id&&operation.kind===receipt.kind,'RELAY_SHAPE_FINANCIAL_RECEIPT_SOURCE:'+receipt.id)
  return operation
 })
}
function amount(operation:LedgerOperation){check('amountFen' in operation,'RELAY_SHAPE_AMOUNT_OPERATION_REQUIRED');return operation.amountFen}
function context(original:GameRun,run:GameRun){
 check(original.origin==='normal'&&run.origin==='normal'&&original.runId===run.runId&&original.seed===run.seed&&original.backgroundId===run.backgroundId,'RELAY_SHAPE_NORMAL_PREFIX_IDENTITY')
 equal(run.versions,original.versions,'RELAY_SHAPE_VERSIONS_CHANGED')
 check(run.revision>=original.revision&&run.timeline.cursor.date>=original.timeline.cursor.date,'RELAY_SHAPE_PREFIX_BACKDATED')
 check(original.relay&&run.relay&&original.operations&&run.operations,'RELAY_SHAPE_RELAY_REQUIRED')
 const originalBusiness=original.operations.businesses.find(b=>b.definitionId==='relay-station')
 check(originalBusiness,'RELAY_SHAPE_ORIGINAL_STATION_REQUIRED')
 const business=run.operations.businesses.find(b=>b.id===originalBusiness.id)
 check(business&&business.accountId===originalBusiness.accountId,'RELAY_SHAPE_BUSINESS_ACCOUNT_CHANGED')
 const oldCustomers=new Set(original.relay.customers.map(c=>c.id)),oldPeriods=new Set(original.relay.periods.map(p=>p.id))
 const customers=run.relay.customers.filter(c=>!oldCustomers.has(c.id)),periods=run.relay.periods.filter(p=>!oldPeriods.has(p.id))
 check(customers.length<=1&&customers.every(c=>c.businessId===business.id),'RELAY_SHAPE_TARGET_CUSTOMER_SCOPE')
 check(periods.length<=1&&periods.every(p=>p.businessId===business.id),'RELAY_SHAPE_TARGET_PERIOD_SCOPE')
 const customer=customers[0]??null,period=periods[0]??null
 check(!period||customer&&period.customerIds.length===1&&period.customerIds[0]===customer.id,'RELAY_SHAPE_PERIOD_CUSTOMER_SCOPE')
 const meters=period?run.relay.meters.filter(m=>m.periodId===period.id):[]
 const meterIds=new Set(meters.map(m=>m.id)),sources=new Set([...(period?[period.id]:[]),...meterIds])
 const corrections=run.relay.corrections.filter(c=>meterIds.has(c.meterId))
 const financial=operations(run),byOperation=new Map(financial.map(o=>[o.id,o]))
 return {business,customer,period,meters,meterIds,sources,corrections,financial,byOperation}
}

/** Only a period's own fee entry counts; old P1 and meter income are different sources. */
export function relayShapePeriodFeeEntries(entries:readonly MetricEntry[],businessId:string,periodId:string|null,through:string){
 return periodId===null?[]:entries.filter(e=>e.businessId===businessId&&e.sourceEventId===periodId&&e.kind==='income'&&e.date<=through)
}

/** At any prefix stage, verify cash and balance identities without choosing an action. */
export function assertRelayShapeMoney(original:GameRun,run:GameRun,shape:RelayShape):RelayShapeMoney{
 const c=context(original,run),before=original.economy.ledger,ledger=run.economy.ledger,date=run.timeline.cursor.date
 check(shape.unitPriceFen===(shape.offerKind==='low_margin'?10:6),'RELAY_SHAPE_PRICE_DIMENSION_CHANGED')
 appendOnly(original.receipts,run.receipts,'COMMAND_RECEIPTS')
 appendOnly(before.transactions,ledger.transactions,'CASH_TRANSACTIONS')
 appendOnly(before.metrics,ledger.metrics,'METRICS')
 appendOnly(before.receipts,ledger.receipts,'FINANCIAL_RECEIPTS')
 equal(ledger.accounts.map(a=>({id:a.id,kind:a.kind})),before.accounts.map(a=>({id:a.id,kind:a.kind})),'RELAY_SHAPE_ACCOUNT_SCOPE_CHANGED')
 equal(run.controlledAccountIds,original.controlledAccountIds,'RELAY_SHAPE_ACCOUNT_AUTHORITY_CHANGED')
 preserve(original.relay!.customers,run.relay!.customers,'CUSTOMERS')
 preserve(original.relay!.periods,run.relay!.periods,'PERIODS')
 preserve(original.relay!.meters,run.relay!.meters,'METERS')
 preserve(original.relay!.audits,run.relay!.audits,'AUDITS')
 preserve(original.relay!.corrections,run.relay!.corrections,'CORRECTIONS')
 preserve(original.relay!.recharges,run.relay!.recharges,'RECHARGES')
 preserve(original.relay!.receivables,run.relay!.receivables,'RECEIVABLES')
 preserve(before.contracts,ledger.contracts.filter(b=>before.contracts.some(old=>old.id===b.id)),'REVENUE_BALANCES')
 check(run.relay!.refunds.length===original.relay!.refunds.length,'RELAY_SHAPE_REFUND_CLEANUP_FORBIDDEN')
 const accountsById=new Map(ledger.accounts.map(a=>[a.id,a]))
 for(const transaction of ledger.transactions){
  check(transaction.lines.every(line=>accountsById.has(line.accountId)),'RELAY_SHAPE_TRANSACTION_UNKNOWN_ACCOUNT')
  check(total(transaction.lines.map(line=>line.deltaFen))===0,'RELAY_SHAPE_CASH_TRANSACTION_UNBALANCED:'+transaction.id)
 }
 const accounts=ledger.accounts.filter(a=>a.kind!=='external').map(account=>{
  const old=before.accounts.find(a=>a.id===account.id)!
  const cashFromHistory=total(ledger.transactions.flatMap(t=>t.lines.filter(l=>l.accountId===account.id).map(l=>l.deltaFen)))
  const transactionDeltaFen=total(ledger.transactions.slice(before.transactions.length).flatMap(t=>t.lines.filter(l=>l.accountId===account.id).map(l=>l.deltaFen)))
  check(account.balanceFen===cashFromHistory&&account.balanceFen-old.balanceFen===transactionDeltaFen,'RELAY_SHAPE_CASH_DELTA_MISMATCH:'+account.id)
  const reservations=ledger.reservations.filter(r=>r.accountId===account.id&&r.status==='active')
  check(reservations.every(r=>Number.isSafeInteger(r.amountFen)&&r.amountFen>=0),'RELAY_SHAPE_INVALID_RESERVATION')
  const heldFen=total(reservations.map(r=>r.amountFen)),protectionRequiredFen=total(reservations.filter(r=>r.kind==='customer_protection'||r.kind==='frozen').map(r=>r.amountFen))
  const position=accountPosition(ledger,account.id)
  check(position.heldFen===heldFen&&position.availableFen===Math.max(0,account.balanceFen-heldFen)&&position.protectionRequiredFen===protectionRequiredFen,'RELAY_SHAPE_OWN_CASH_OR_PROTECTION_MISMATCH')
  return {accountId:account.id,originalCashFen:old.balanceFen,cashDeltaFen:account.balanceFen-old.balanceFen,transactionDeltaFen,...position}
 })
 const cashFor=(operationIds:ReadonlySet<string>,accountId:string)=>total(ledger.transactions.filter(t=>operationIds.has(t.id)).flatMap(t=>t.lines.filter(l=>l.accountId===accountId).map(l=>l.deltaFen)))
 for(const balance of ledger.contracts){
  const income=total(ledger.metrics.filter(m=>m.contractId===balance.id&&m.kind==='income').map(m=>m.deltaFen))
  check(income===balance.recognizedIncomeFen,'RELAY_SHAPE_CONTRACT_INCOME_MISMATCH:'+balance.id)
  const refundDebt=ledger.obligations.filter(o=>o.contractId===balance.id&&['refund_undelivered','refund_delivered'].includes(o.kind))
  const cashOperations=new Set(c.financial.filter(o=>('contractId' in o&&o.contractId===balance.id&&['receive_prepayment','collect_receivable','refund_undelivered','refund_delivered'].includes(o.kind))||o.kind==='pay_obligation'&&refundDebt.some(d=>d.id===o.obligationId)).map(o=>o.id))
  const refundRemaining=total(refundDebt.map(o=>o.remainingFen))
  check(cashFor(cashOperations,balance.accountId)===income+balance.prepaidFen-balance.receivableFen+refundRemaining,'RELAY_SHAPE_CUSTOMER_CASH_LIABILITY_IDENTITY:'+balance.id)
  const protection=balance.protectionReservationId?ledger.reservations.find(r=>r.id===balance.protectionReservationId):null
  const undeliveredRefund=total(refundDebt.filter(o=>o.kind==='refund_undelivered').map(o=>o.remainingFen))
  check((protection?.amountFen??0)===balance.prepaidFen+undeliveredRefund,'RELAY_SHAPE_CUSTOMER_PROTECTION_MISMATCH:'+balance.id)
 }
 // Cash paid to a supplier = recognized net cost + unused supplier asset - unpaid invoices.
 // This accepts both prepaid correction credit and a new correction payable.
 for(const pool of ledger.supplierPrepayments){
  const related=c.financial.filter(o=>'prepaymentId' in o&&o.prepaymentId===pool.id)
  const invoices=related.filter(o=>o.kind==='incur_supplier_usage')
  const obligations=ledger.obligations.filter(o=>invoices.some(i=>i.kind==='incur_supplier_usage'&&i.obligationId===o.id))
  const relatedIds=new Set(related.map(o=>o.id)),cashIds=new Set([...relatedIds,...c.financial.filter(o=>o.kind==='pay_obligation'&&obligations.some(d=>d.id===o.obligationId)).map(o=>o.id)])
  const cashPaid=-cashFor(cashIds,pool.accountId),cost=total(ledger.metrics.filter(m=>m.kind==='cost'&&relatedIds.has(m.operationId)).map(m=>m.deltaFen)),unpaid=total(obligations.map(o=>o.remainingFen))
  const topups=total(related.filter(o=>o.kind==='supplier_prepay').map(o=>o.amountFen))
  const assetSpent=total(related.filter(o=>['consume_supplier','settle_supplier_credit','refund_supplier'].includes(o.kind)).map(amount))
  const restoredPrepaid=total(related.filter(o=>o.kind==='reverse_supplier_usage'&&c.byOperation.get(o.referenceId)?.kind==='consume_supplier').map(amount))
  // A paid postpaid invoice can become a credit asset after a negative correction.
  // Verify cumulative acquired assets from their remaining value and documented
  // disposal, rather than assuming that every acquisition was a cash top-up.
  check(pool.paidFen>=topups&&pool.paidFen===pool.remainingFen+assetSpent-restoredPrepaid&&pool.remainingFen===cashPaid-cost+unpaid&&pool.remainingFen>=0,'RELAY_SHAPE_SUPPLIER_ASSET_COST_PAYABLE_IDENTITY:'+pool.id)
 }
 for(const recharge of run.relay!.recharges){
  const used=total(c.financial.filter(o=>o.kind==='deliver_prepaid'&&o.referenceId===recharge.operationId).map(amount))
  const refunded=total(c.financial.filter(o=>o.kind==='refund_undelivered'&&o.referenceId===recharge.operationId).map(amount))
  check(recharge.usedFen===used&&recharge.refundedFen===refunded&&used+refunded<=recharge.amountFen,'RELAY_SHAPE_RECHARGE_BATCH_MISMATCH:'+recharge.id)
 }
 const oldCustomerIds=new Set(original.relay!.customers.map(row=>row.id)),oldSources=new Set([...original.relay!.periods,...original.relay!.meters].map(row=>row.id))
 for(const operation of c.financial.slice(before.receipts.length))check(!oldSources.has(operation.sourceEventId)&&(!('contractId' in operation)||!oldCustomerIds.has(operation.contractId!)),'RELAY_SHAPE_NEW_OPERATION_TOUCHES_P1_ACCOUNTING:'+operation.id)
 for(const invoice of run.relay!.receivables){
  const collected=total(run.relay!.collections.filter(x=>x.receivableId===invoice.id).map(x=>x.amountFen))
  const reversed=total(c.financial.filter(o=>o.kind==='refund_delivered'&&o.settlement==='receivable'&&o.referenceId===invoice.operationId).map(amount))
  check(invoice.collectedFen===collected&&invoice.reversedFen===reversed&&collected+reversed<=invoice.amountFen,'RELAY_SHAPE_RECEIVABLE_HISTORY_MISMATCH:'+invoice.id)
  for(const collection of run.relay!.collections.filter(x=>x.receivableId===invoice.id)){
   const op=c.byOperation.get(collection.operationId),customer=run.relay!.customers.find(x=>x.id===invoice.customerId)
   check(op?.kind==='collect_receivable'&&op.contractId===invoice.customerId&&op.amountFen===collection.amountFen&&collection.date>=invoice.dueAt&&customer,'RELAY_SHAPE_COLLECTION_SOURCE_OR_DATE')
   check(cashFor(new Set([op.id]),op.accountId)===op.amountFen&&!ledger.metrics.some(m=>m.operationId===op.id&&m.kind==='income'),'RELAY_SHAPE_COLLECTION_DOUBLE_INCOME_OR_CASH')
  }
 }
 for(const meter of c.meters){
  check(meter.customerId===c.customer?.id,'RELAY_SHAPE_METER_CUSTOMER_SCOPE')
  const delivered=total(meter.deliveryIds.map(id=>{
   const op=c.byOperation.get(id);check(op&&(op.kind==='deliver_prepaid'||op.kind==='deliver_on_credit')&&op.contractId===meter.customerId&&op.sourceEventId===meter.id&&op.date===meter.date,'RELAY_SHAPE_METER_DELIVERY_SOURCE');return op.amountFen
  }))
  check(delivered===meter.reportedUnits*meter.unitPriceFen,'RELAY_SHAPE_REPORTED_METER_INCOME')
  const cost=meter.costOperationId?c.byOperation.get(meter.costOperationId):null
  if(meter.reportedUnits&&meter.unitCostFen)check(cost&&(cost.kind==='consume_supplier'||cost.kind==='incur_supplier_usage')&&cost.sourceEventId===meter.id&&cost.amountFen===meter.reportedUnits*meter.unitCostFen,'RELAY_SHAPE_REPORTED_METER_COST')
  else check(cost===null,'RELAY_SHAPE_UNSERVED_SUPPLIER_COST')
 }
 const publicMeters=c.corrections.length?new Map(projectRelay(run,campaignRelay)!.meters.map(m=>[m.id,m])):null
 for(const correction of c.corrections){
  const meter=c.meters.find(m=>m.id===correction.meterId)!,audit=run.relay!.audits.find(a=>a.id===correction.auditId),publicMeter=publicMeters!.get(meter.id)!
  check(audit?.meterId===meter.id&&audit.completedAt!==null&&audit.completedAt<=correction.date&&publicMeter.auditedUnits!==null,'RELAY_SHAPE_CORRECTION_BEFORE_PUBLIC_AUDIT')
  check(correction.originalReportedUnits===meter.reportedUnits&&correction.correctUnits===publicMeter.auditedUnits,'RELAY_SHAPE_CORRECTION_CHANGED_ORIGINAL_QUANTITY')
  check(correction.customerDeltaFen===(correction.correctUnits-meter.reportedUnits)*meter.unitPriceFen&&correction.supplierDeltaFen===(correction.correctUnits-meter.reportedUnits)*meter.unitCostFen,'RELAY_SHAPE_CORRECTION_PRICE_OR_AMOUNT')
  const ids=new Set(correction.operationIds)
  check(correction.operationIds.every(id=>{const o=c.byOperation.get(id);return o?.sourceEventId===meter.id&&o.date===correction.date&&('accountId' in o&&o.accountId===c.business.accountId)&&(!('contractId' in o)||o.contractId===meter.customerId)}),'RELAY_SHAPE_CORRECTION_WRONG_SOURCE_OR_ACCOUNT')
  check(total(ledger.metrics.filter(m=>ids.has(m.operationId)&&m.kind==='income').map(m=>m.deltaFen))===correction.customerDeltaFen&&total(ledger.metrics.filter(m=>ids.has(m.operationId)&&m.kind==='cost').map(m=>m.deltaFen))===correction.supplierDeltaFen,'RELAY_SHAPE_CORRECTION_NOT_POSTED')
 }
 const targetInvoices=run.relay!.receivables.filter(r=>r.customerId===c.customer?.id)
 const targetDebt=ledger.obligations.filter(o=>o.businessId===c.business.id&&(c.sources.has(o.sourceEventId)||c.sources.has(o.originOperationId)||c.corrections.some(x=>x.operationIds.includes(o.originOperationId))))
 const income=ledger.metrics.filter(m=>m.businessId===c.business.id&&m.kind==='income'&&c.sources.has(m.sourceEventId))
 const balance=ledger.contracts.find(b=>b.id===c.customer?.id)
 const money:RelayShapeMoney={date,accounts,preserved:{customers:original.relay!.customers.length,periods:original.relay!.periods.length,meters:original.relay!.meters.length,corrections:original.relay!.corrections.length,ledgerTransactions:before.transactions.length,ledgerReceipts:before.receipts.length},target:{
  incomeFen:total(income.map(m=>m.deltaFen)),usageIncomeFen:total(income.filter(m=>c.meterIds.has(m.sourceEventId)).map(m=>m.deltaFen)),periodFeeFen:total(relayShapePeriodFeeEntries(ledger.metrics,c.business.id,c.period?.id??null,date).map(m=>m.deltaFen)),
  supplierCostFen:total(ledger.metrics.filter(m=>m.businessId===c.business.id&&m.kind==='cost'&&c.meterIds.has(m.sourceEventId)).map(m=>m.deltaFen)),cashCollectedFen:total(run.relay!.collections.filter(x=>targetInvoices.some(i=>i.id===x.receivableId)).map(x=>x.amountFen)),
  remainingReceivableFen:balance?.receivableFen??0,remainingProtectedFen:balance?.prepaidFen??0,duePayableFen:total(targetDebt.filter(o=>o.date<=date).map(o=>o.remainingFen)),futurePayableFen:total(targetDebt.filter(o=>o.date>date).map(o=>o.remainingFen)),
 }}
 check(shape.offerKind!=='low_margin'||money.target.periodFeeFen===0,'RELAY_SHAPE_LOW_MARGIN_CHARGED_PERIOD_FEE')
 return money
}

function request(run:GameRun,kind:string,predicate:(payload:Record<string,unknown>)=>boolean){
 return run.receipts.filter(r=>r.kind===kind).map(receipt=>({receipt,payload:JSON.parse(receipt.payloadSignature).payload as Record<string,unknown>})).find(row=>predicate(row.payload))
}
function status(present:boolean,valid:boolean):RelayCheckpointStatus{return !present?'not_reached':valid?'passed':'blocked'}

/** Derive the original ten checkpoints from source records, not from policy control flow. */
export function assessRelayShape(original:GameRun,run:GameRun,shape:RelayShape):RelayShapeAssessment{
 const money=assertRelayShapeMoney(original,run,shape),c=context(original,run),relay=projectRelay(run,campaignRelay)!,baseline=projectRelay(original,campaignRelay)!,story=projectStory(run,campaignStory),date=run.timeline.cursor.date
 const customer=relay.customers.find(x=>x.id===c.customer?.id)??null,period=relay.periods.find(x=>x.id===c.period?.id)??null
 const meters=period?relay.meters.filter(m=>m.periodId===period.id):[],eligible=meters.filter(m=>m.supplierId!==null),meterIds=new Set(meters.map(m=>m.id))
 const audits=relay.audits.filter(a=>meterIds.has(a.meterId)),auditJobIds=[...new Set(audits.map(a=>a.jobId))],corrections=relay.corrections.filter(a=>meterIds.has(a.meterId))
 const target:RelayShapeTarget={businessId:c.business.id,accountId:c.business.accountId,customerId:customer?.id??null,personId:customer?.personId??null,audienceId:customer?.originAudienceId??null,periodId:period?.id??null,serviceJobId:period?.jobId??null,supportJobId:period?.supportJobId??null,auditJobIds}
 const checkpoints:RelayShapeAssessment['checkpoints'][number][]=[]
 const put=(name:RelayCoreCheckpointName,value:RelayCheckpointStatus,evidence:unknown)=>checkpoints.push({name,status:value,evidence})
 const originalBusiness=baseline.businesses.find(b=>b.id===c.business.id)!
 const permission=baseline.applications.findLast(a=>a.businessId===c.business.id&&a.supplierId===shape.supplierId&&a.read&&a.approved===true&&a.expiresAt!==null&&a.decisionAt<='2025-01-12'&&a.expiresAt>='2025-02-09'&&a.allowedSegments.includes('local_merchants'))
 const adapted=baseline.adapters.some(a=>a.businessId===c.business.id&&a.supplierId===shape.supplierId&&a.job?.status==='completed')
 const prepared=baseline.technicallyReady&&baseline.preparations.some(p=>p.businessId===c.business.id&&p.kind==='materials'&&p.job?.status==='completed')
 const publicRisks=story.incidents.filter(i=>i.businessIds.includes(c.business.id)&&!['normal','resolved'].includes(i.stage))
 const prerequisite=originalBusiness.lifecycle==='operating'&&c.business.lifecycle==='operating'&&prepared&&permission&&adapted&&original.timeline.cursor.date==='2025-01-01'&&publicRisks.length===0&&!run.world?.stoppedBindings.includes(c.business.id)
 put(RELAY_CORE_CHECKPOINTS[0],prerequisite?'passed':'blocked',{runId:run.runId,originalRevision:original.revision,originalDate:original.timeline.cursor.date,versions:run.versions,businessId:c.business.id,accountId:c.business.accountId,permission:permission??null,adapted,prepared,publicRisks})

 const audience=customer?baseline.audiences.find(a=>a.id===customer.originAudienceId):null
 const originalConverted=new Set(original.video?.conversions.filter(v=>v.productVersion==='relay-service-v1').map(v=>v.personId))
 const expectedPerson=audience?.members.find(id=>!originalConverted.has(id)&&!baseline.customers.some(row=>row.personId===id))
 const fee=shape.offerKind==='managed_support'?50000:0
 const offer=customer?relay.offers.find(o=>o.id===customer.terms[0]?.sourceId):null
 const signing=customer?request(run,'SignRelayCustomers',p=>Array.isArray(p.personIds)&&p.personIds.includes(customer.personId)):null
 const contractValid=!!customer&&audience?.mode==='paid'&&audience.segment==='local_merchants'&&audience.completedAt!==null&&customer.businessId===c.business.id&&customer.personId===expectedPerson
  &&customer.mode===shape.customerMode&&customer.initialMode===shape.customerMode&&customer.creditLimitFen===(shape.customerMode==='postpaid'?2000000:0)&&customer.initialCreditLimitFen===customer.creditLimitFen
  &&customer.signedAt==='2025-01-11'&&customer.termEnd==='2025-03-31'&&customer.initialTermEnd===customer.termEnd&&customer.closedAt===null
  &&offer?.businessId===c.business.id&&offer.offerId===shape.offerKind&&offer.unitPriceFen===shape.unitPriceFen&&offer.serviceFeeFen===fee&&customer.terms.length===1
  &&signing?.receipt.date===customer.signedAt&&signing.payload.businessId===c.business.id&&signing.payload.audienceId===audience.id&&signing.payload.offerId===offer.id
 put(RELAY_CORE_CHECKPOINTS[1],status(customer!==null,contractValid),{customer,audienceId:audience?.id??null,expectedPersonId:expectedPerson??null,offer:offer??null,signCommandId:signing?.receipt.commandId??null})

 const recharges=run.relay!.recharges.filter(r=>r.customerId===customer?.id),limit=customer?Number(BigInt(customer.monthlyUnits)*BigInt(shape.unitPriceFen)*4n/3n)+fee:0
 const creditValid=!!customer&&(shape.customerMode==='postpaid'?customer.creditLimitFen===2000000&&recharges.length===0:
  recharges.length===1&&customer.rechargeLimitFen===limit&&recharges[0]!.amountFen===limit&&recharges[0]!.date==='2025-01-11'
   &&!run.economy.ledger.metrics.some(m=>m.operationId===recharges[0]!.operationId&&m.kind==='income'))
 put(RELAY_CORE_CHECKPOINTS[2],status(!!customer&&(shape.customerMode==='postpaid'||recharges.length>0),creditValid),{mode:shape.customerMode,creditLimitFen:customer?.creditLimitFen??null,rechargeLimitFen:customer?.rechargeLimitFen??null,recharges,remainingProtectedFen:money.target.remainingProtectedFen,remainingReceivableFen:money.target.remainingReceivableFen})

 const poolId=relay.supplyOptions.find(s=>s.businessId===c.business.id&&s.supplierId===shape.supplierId)?.credit?.id
 const suffixOperations=c.financial.slice(original.economy.ledger.receipts.length),topups=suffixOperations.filter(o=>o.kind==='supplier_prepay')
 const supplier=relay.catalog.suppliers.find(s=>s.id===shape.supplierId)!
 const supplierFunding=shape.supplierId==='cedar-reseller'?supplier.billing==='prepaid'&&topups.length===1&&topups[0]!.amountFen===400000&&topups[0]!.prepaymentId===poolId:
  supplier.billing==='postpaid'&&topups.length===0
 put(RELAY_CORE_CHECKPOINTS[3],status(customer!==null&&(shape.supplierId!=='cedar-reseller'||topups.length>0),supplierFunding),{supplierId:shape.supplierId,billing:supplier.billing,creditLimitFen:supplier.creditLimitFen,topups,position:money.accounts.find(a=>a.accountId===c.business.accountId),pool:relay.supplyOptions.find(s=>s.businessId===c.business.id&&s.supplierId===shape.supplierId)?.credit??null,ownCashIsSeparateFromCustomerProtection:true})

 const supportTerms={guided:{points:1,cost:150000,days:7},self:{points:2,cost:0,days:14},assisted:{points:1,cost:100000,days:4},delegated:{points:1,cost:70000,days:2}}[shape.supportMode]
 const service=period?.job,support=period?.supportJob,serviceAction=run.economy.actions.find(a=>a.definition.id===service?.actionId),supportAction=run.economy.actions.find(a=>a.definition.id===support?.actionId)
 const serviceRequest=period?request(run,'StartRelayServicePeriod',p=>p.businessId===c.business.id&&Array.isArray(p.customerIds)&&p.customerIds.includes(customer?.id)):null
 const use=run.story?.supportUses.find(u=>u.jobId===support?.id),deployment=story.deployments.find(d=>d.id===use?.deploymentId),grant=deployment?.grants.find(g=>g.id===use?.grantId)
 const committedToGrant=grant?total((run.story?.supportUses??[]).filter(u=>u.grantId===grant.id).map(u=>{const job=run.operations!.jobs.find(j=>j.id===u.jobId);return job?.status==='cancelled'?0:run.economy.actions.find(a=>a.definition.id===job?.actionId)?.definition.costFen??0})):0
 const agentMode=shape.supportMode==='assisted'||shape.supportMode==='delegated'
 const authorityValid=!agentMode||!!use&&use.businessId===c.business.id&&use.mode===shape.supportMode&&!!deployment&&!!grant&&grant.deploymentId===deployment.id&&deployment.businessId===c.business.id&&deployment.accountId===c.business.accountId&&deployment.activeFrom!==null&&deployment.activeFrom<=period!.to
  &&grant.businessId===c.business.id&&grant.createdAt<=period!.createdAt&&grant.expiresAt>=support!.completeAt&&grant.scopes.includes('relay_support')
  &&(grant.revokedAt===null||grant.revokedAt>=use.date)&&committedToGrant<=grant.cashLimitFen
  &&(shape.supportMode==='assisted'?grant.level==='approval'&&!grant.externalDelegation:grant.level==='cross_flow'&&grant.externalDelegation&&grant.scopes.includes('external_service_commitments'))
 const jobsValid=!!period&&!!customer&&period.businessId===c.business.id&&canonicalJson(period.customerIds)===canonicalJson([customer.id])&&canonicalJson(period.supplierIds)===canonicalJson([shape.supplierId])
  &&period.supportMode===shape.supportMode&&period.maxUnits===300000&&period.maxSupplierCostFen===1200000&&period.from==='2025-01-12'&&period.to==='2025-02-09'
  &&service?.startAt===period.from&&service.completeAt===period.to&&canonicalJson(service.resources)===canonicalJson(['player-production'])
  &&support?.startAt===period.to&&support.completeAt===addDays(period.to,supportTerms.days)&&canonicalJson(support.resources)===canonicalJson(['player-production'])
  &&serviceAction?.definition.costFen===300000&&serviceAction.definition.actionPoints===1&&supportAction?.definition.costFen===supportTerms.cost&&supportAction.definition.actionPoints===supportTerms.points
  &&serviceRequest?.payload.supportMode===shape.supportMode&&serviceRequest.payload.deploymentId===(agentMode?deployment?.id:null)&&authorityValid
 put(RELAY_CORE_CHECKPOINTS[4],status(period!==null,jobsValid),{period,service:service??null,support:support??null,serviceAction:serviceAction??null,supportAction:supportAction??null,deploymentId:deployment?.id??null,grant:grant??null,committedToGrantFen:committedToGrant,authorityValid})

 const usableUnits=total(meters.map(m=>m.auditedUnits??m.reportedUnits)),usageDates=new Set(meters.map(m=>m.date))
 const usageValid=!!period&&service?.status==='completed'&&period.stoppedAt===null&&meters.length>0&&usageDates.size===meters.length
  &&meters.every(m=>m.customerId===customer?.id&&m.date>=period.from&&m.date<period.to&&(m.supplierId===null?m.reportedUnits===0&&m.rateId===null:m.supplierId===shape.supplierId&&m.rateId!==null&&m.supplierBilling===supplier.billing))&&usableUnits>0
 put(RELAY_CORE_CHECKPOINTS[5],status(meters.length>0,usageValid),{observedMeters:meters.length,publicUnits:usableUnits,completed:service?.status??null,dates:[...usageDates],rateIds:[...new Set(meters.map(m=>m.rateId))],blockedReasons:meters.filter(m=>m.reason!==null).map(m=>({meterId:m.id,date:m.date,reason:m.reason,reportedUnits:m.reportedUnits})),usageIncomeFen:money.target.usageIncomeFen})

 const allActualVisible=eligible.length>0&&eligible.every(m=>m.auditedUnits!==null)
 const servedDays=allActualVisible?new Set(eligible.filter(m=>m.auditedUnits!>0).map(m=>m.date)).size:null
 const expectedFee=servedDays===null?null:Math.floor((fee*servedDays+14)/28)
 const compensationOperations=period?c.financial.filter(o=>o.kind==='due_expense'&&o.sourceEventId===period.id):[]
 const compensationValid=compensationOperations.every(o=>o.kind==='due_expense'&&o.businessId===c.business.id&&o.accountId===c.business.accountId&&total(run.economy.ledger.metrics.filter(m=>m.operationId===o.id&&m.kind==='cost').map(m=>m.deltaFen))===o.amountFen&&run.economy.ledger.obligations.some(d=>d.id===o.obligationId&&d.originOperationId===o.id&&d.amountFen===o.amountFen))
 const supportValid=!!period&&support?.status==='completed'&&period.feePostedAt===support.completeAt&&period.compensatedAt===period.feePostedAt&&date>=period.feePostedAt&&compensationValid
  &&(shape.offerKind==='low_margin'?money.target.periodFeeFen===0:money.target.periodFeeFen>0&&(expectedFee===null||expectedFee===money.target.periodFeeFen))
 put(RELAY_CORE_CHECKPOINTS[6],status(period?.feePostedAt!==null&&period?.feePostedAt!==undefined||support?.status==='interrupted'||support?.status==='cancelled',supportValid),{supportStatus:support?.status??null,feePostedAt:period?.feePostedAt??null,periodFeeFen:money.target.periodFeeFen,expectedAfterPublicAuditFen:expectedFee,servedDays,compensationOperations,notProfitOrNewCash:true})

 const auditJob=run.operations!.jobs.find(j=>j.id===auditJobIds[0]),auditRequest=period?request(run,'StartRelayAudit',p=>p.periodId===period.id):null,auditAction=run.economy.actions.find(a=>a.definition.id===auditJob?.actionId)
 const auditValid=eligible.length>0&&auditJobIds.length===1&&auditJob?.status==='completed'&&auditJob.startAt==='2025-02-24'&&auditJob.completeAt==='2025-02-27'&&auditAction?.definition.costFen===10000&&auditAction.definition.actionPoints===1&&canonicalJson(auditJob.resources)===canonicalJson(['player-production'])
  &&auditRequest?.receipt.date==='2025-02-24'&&auditRequest.payload.periodId===period?.id&&audits.length===eligible.length
  &&audits.every(a=>eligible.some(m=>m.id===a.meterId&&m.date<=auditJob.startAt)&&a.completedAt===auditJob.completeAt)&&new Set(audits.map(a=>a.meterId)).size===eligible.length&&allActualVisible
 put(RELAY_CORE_CHECKPOINTS[7],status(audits.length>0,auditValid),{eligibleMeterIds:eligible.map(m=>m.id),auditJobIds,job:auditJob??null,audits,actualUnitsOnlyAfterCompletedAudit:true})

 const correctionRequest=period?request(run,'CorrectRelayPeriod',p=>p.periodId===period.id):null
 const correctionValid=auditValid&&correctionRequest?.receipt.date==='2025-02-27'&&corrections.length===eligible.length&&new Set(corrections.map(x=>x.meterId)).size===eligible.length
  &&corrections.every(x=>eligible.some(m=>m.id===x.meterId&&m.correctionId===x.id&&m.auditedUnits===x.correctUnits)&&x.date==='2025-02-27'&&audits.some(a=>a.id===x.auditId&&a.completedAt!==null&&a.completedAt<=x.date))
 put(RELAY_CORE_CHECKPOINTS[8],status(corrections.length>0,correctionValid),{correctionCommandId:correctionRequest?.receipt.commandId??null,corrections,deltaKinds:[...new Set(corrections.map(x=>Math.sign(x.customerDeltaFen)))],zeroDoesNotProvePositiveOrNegativeCorrection:true})

 const invoices=relay.receivables.filter(r=>r.customerId===customer?.id),collections=run.relay!.collections.filter(x=>invoices.some(i=>i.id===x.receivableId))
 const finalValid=!!period&&date>='2025-03-14'&&date<='2025-03-31'&&correctionValid&&money.target.remainingReceivableFen===0&&money.target.duePayableFen===0&&money.target.futurePayableFen===0
  &&invoices.every(i=>i.dueAt<=date&&i.amountFen===i.collectedFen+i.reversedFen)&&collections.every(x=>invoices.some(i=>i.id===x.receivableId&&i.dueAt<=x.date))
 put(RELAY_CORE_CHECKPOINTS[9],status(!!period&&date>='2025-03-14',finalValid),{date,invoices,collections,duePayableFen:money.target.duePayableFen,futurePayableFen:money.target.futurePayableFen,remainingCustomerProtectionFen:money.target.remainingProtectedFen,supplierAssets:money.accounts.find(a=>a.accountId===c.business.accountId)?.supplierPrepaidFen??0,oldP1Preserved:money.preserved,wholeCompanyClosureClaimed:false})
 check(checkpoints.length===10&&checkpoints.every((p,i)=>p.name===RELAY_CORE_CHECKPOINTS[i]),'RELAY_SHAPE_CHECKPOINT_SET_CHANGED')
 const positive=checkpoints.every(p=>p.status==='passed')&&service?.status==='completed'&&support?.status==='completed'&&allActualVisible&&usableUnits>0&&money.target.usageIncomeFen>0
 return {target,checkpoints,positive,money}
}
