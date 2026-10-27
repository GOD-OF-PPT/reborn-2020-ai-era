import {beforeAll,expect,it} from 'vitest'
import {createCampaignCodec,campaignRelay} from './campaign.ts'
import {projectRelay} from '../core/relay-projection.ts'
import type {GameRun} from '../core/run-types.ts'
import {enrichRelayCasebook} from './relay-casebook-projection.ts'
import {replayRelayF04} from '../testing/relay-scenarios.ts'
import actual87 from '../../goal-1/evidence/t17-acceptance-36/chrome-service-r2/r8-10-saved87-new-original-customer2-collection.json?raw'

const codec=createCampaignCodec()
let run:GameRun
beforeAll(()=>{run=codec.import(actual87)})
const original=()=>projectRelay(run,campaignRelay)!

it('preserves null and publishes only an additive history of a real committed service',()=>{
 expect(enrichRelayCasebook(run,null)).toBeNull()
 const relay=original(),before=codec.export(run),result=enrichRelayCasebook(run,relay)!
 expect(result.casebook.status).toBe('ready');expect(result.casebook.reason).toBeNull()
 const {casebook,...base}=result;expect(base).toEqual(relay);expect(codec.export(run)).toBe(before)
 expect(casebook).toMatchObject({runId:run.runId,revision:87,asOf:'2024-11-07'})
 expect(casebook.recharges.length).toBeGreaterThan(0);expect(casebook.collections.length).toBeGreaterThan(0)
 expect(casebook.operations.some(o=>o.kind==='incur_supplier_usage'||o.kind==='consume_supplier')).toBe(true)
})

it('exposes the actual original invoice collection and cash identity, not new income',()=>{
 const result=enrichRelayCasebook(run,original())!,history=result.casebook
 expect(history.status).toBe('ready')
 const current=result.customers.filter(c=>c.businessId===result.periods.find(p=>p.from==='2024-10-09')!.businessId)[1]!
 const receipts=history.collections.filter(c=>c.customerId===current.id&&c.date==='2024-11-07')
 expect(receipts.reduce((n,r)=>n+r.amountFen,0)).toBe(1216)
 for(const receipt of receipts){
  expect(history.operations.find(o=>o.id===receipt.operationId)).toMatchObject({kind:'collect_receivable',sourceEventId:receipt.receivableId,amountFen:receipt.amountFen,scopeBusinessId:current.businessId})
  expect(history.transactions.filter(t=>t.id===receipt.operationId&&t.accountId===receipt.accountId)).toEqual([expect.objectContaining({amountFen:receipt.amountFen,sourceId:receipt.receivableId})])
 }
 expect(result.receivables.filter(r=>r.customerId===current.id&&r.dueAt>'2024-11-07').reduce((n,r)=>n+r.amountFen-r.collectedFen-r.reversedFen,0)).toBe(720)
})

it('retains settled obligations, original transaction references and already committed future support',()=>{
 const history=enrichRelayCasebook(run,original())!.casebook
 expect(history.status).toBe('ready');expect(history.obligationHistory.some(o=>o.remainingFen===0)).toBe(true)
 const support=history.actions.find(a=>a.definition.completeAt==='2024-11-13')!
 expect(support).toBeDefined();expect(support.definition.costFen).toBeGreaterThan(0)
 expect(support.executedAt!<='2024-11-07').toBe(true);expect(support.finishedAt).toBeNull()
 const payment=history.operations.find(o=>o.kind==='pay_obligation')!
 expect(payment).toBeDefined();expect(history.transactions.some(t=>t.id===payment.id&&t.referenceId===payment.obligationId)).toBe(true)
 const ordered=history.operations.map(o=>o.order);expect(ordered).toEqual([...ordered].sort((a,b)=>a-b))
 expect(codec.export(run)).toBe(actual87)
})

it('never accesses hidden world, demand, audit truth or future queues while projecting financial history',()=>{
 const relay=original(),blocked=()=>{throw Error('HIDDEN_READ_FORBIDDEN')}
 const guarded={...run,relay:{...run.relay!},timeline:{...run.timeline}} as GameRun
 Object.defineProperties(guarded,{facts:{get:blocked},random:{get:blocked},privateNotes:{get:blocked},seed:{get:blocked},world:{get:blocked}})
 Object.defineProperty(guarded.relay!,'meters',{get:blocked});Object.defineProperty(guarded.timeline,'pending',{get:blocked})
 const result=enrichRelayCasebook(guarded,relay)!
 expect(result.casebook.status).toBe('ready')
 const forbidden=new Set(['signature','raw','actualUnits','factId','random','seed','privateNotes','pending'])
 const inspect=(value:unknown)=>{if(value===null||typeof value!=='object')return;for(const [key,child]of Object.entries(value)){expect(forbidden.has(key)).toBe(false);inspect(child)}}
 inspect(result.casebook)
})

it('fails the whole history slice on duplicate original identities without changing the public base',()=>{
 const relay=original(),duplicate={...relay,receivables:[...relay.receivables,relay.receivables[0]!]}
 const result=enrichRelayCasebook(run,duplicate)!
 expect(result.receivables).toEqual(duplicate.receivables);expect(result.casebook.status).toBe('unavailable')
 expect(result.casebook.operations).toEqual([]);expect(result.casebook.transactions).toEqual([]);expect(result.casebook.recharges).toEqual([])
 expect(codec.export(run)).toBe(actual87)
})

it.each(['wrong-id','foreign-account','extra-field'] as const)('rejects a %s receipt instead of publishing a guessed financial chain',variant=>{
 const relay=original(),collection=run.relay!.collections.at(-1)!,receipt=run.economy.ledger.receipts.find(r=>r.id===collection.operationId)!,op=JSON.parse(receipt.signature) as Record<string,unknown>
 const altered={...op,...(variant==='wrong-id'?{id:'other-operation'}:variant==='foreign-account'?{accountId:'personal'}:{unexpected:'must not escape'})}
 const changed={...run,economy:{...run.economy,ledger:{...run.economy.ledger,receipts:run.economy.ledger.receipts.map(r=>r.id===receipt.id?{...r,signature:JSON.stringify(altered)}:r)}}}
 const result=enrichRelayCasebook(changed,relay)!
 expect(result.casebook.status).toBe('unavailable');expect(result.casebook.actions).toEqual([]);expect(result.casebook.obligationHistory).toEqual([])
 expect(codec.export(run)).toBe(actual87)
})

it('rejects a job whose original action belongs to another account',()=>{
 const relay=original(),support=relay.periods.find(p=>p.to==='2024-11-06')!.supportJob!,action=run.economy.actions.find(a=>a.definition.id===support.actionId)!
 const changed={...run,economy:{...run.economy,actions:run.economy.actions.map(a=>a===action?{...a,definition:{...a.definition,accountId:'personal'}}:a)}}
 expect(enrichRelayCasebook(changed,relay)!.casebook.status).toBe('unavailable')
})

it('reads a real paid-supplier correction as an original cost reversal and asset, without rewriting money',()=>{
 const fixture=replayRelayF04({parameters:{billingErrorBps:10000}}),h=fixture.h,period=projectRelay(h.run,h.relay)!.periods[0]!
 h.send('StartRelayAudit',{periodId:period.id,resources:['player-production'],startAt:'2025-02-13'})
 h.send('AdvanceTime',{date:'2025-02-16'})
 const audited=projectRelay(h.run,h.relay)!,meter=audited.meters.find(m=>m.auditedUnits!==null&&m.auditedUnits<m.reportedUnits&&m.unitCostFen>0)!,audit=audited.audits.find(a=>a.meterId===meter.id&&a.completedAt!==null)!
 expect(meter).toBeDefined();h.send('CorrectRelayUsage',{auditId:audit.id,correctUnits:meter.auditedUnits})
 const before=h.codec.export(h.run),publicRelay=projectRelay(h.run,h.relay)!,correction=publicRelay.corrections.find(c=>c.meterId===meter.id)!,history=enrichRelayCasebook(h.run,publicRelay)!.casebook
 expect(history.status).toBe('ready')
 const reversal=history.operations.find(o=>o.kind==='reverse_supplier_usage'&&correction.operationIds.includes(o.id))!
 expect(reversal).toMatchObject({referenceId:meter.costOperationId,sourceEventId:meter.id,amountFen:-correction.supplierDeltaFen,scopeBusinessId:fixture.business.id})
 expect(history.transactions.some(t=>t.id===reversal.id)).toBe(false)
 const refund=history.operations.find(o=>o.kind==='refund_delivered'&&o.settlement==='cash'&&correction.operationIds.includes(o.id))!,owed=history.obligationHistory.find(o=>o.id===refund.obligationId)!
 expect(refund).toBeDefined();expect(owed).toBeDefined()
 const paid=history.transactions.filter(t=>t.id===refund.id&&t.accountId===refund.accountId)
 expect(paid.reduce((n,t)=>n-t.amountFen,0)+owed.remainingFen).toBe(refund.amountFen)
 for(const cash of paid)expect(cash.referenceId).toBe(owed.id)
 expect(publicRelay.supplyOptions.find(s=>s.businessId===fixture.business.id&&s.supplierId===meter.supplierId)!.credit!.remainingFen).toBeGreaterThan(0)
 expect(h.codec.export(h.run)).toBe(before)
},60000)
