import {beforeAll,expect,it} from 'vitest'
import {createCampaignCodec} from '../application/campaign.ts'
import {projectRun} from '../core/commands.ts'
import {relayId} from '../core/relay.ts'
import {operatingId} from '../core/operations.ts'
import type {GameRun} from '../core/run-types.ts'
import type {RelayCasebookHistory} from '../application/relay-casebook-projection.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import {relayCorrectionEffects} from './relay-correction-effects.ts'
import {relayRecordRows} from './relay-records.ts'
import {moneyText} from './game-text.ts'
import positive103 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r4/n32-r4-saved103-positive-single-correction-new-due.json?raw'
import positive106 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r4/n36-r4-saved106-new-correction-invoice-partial-collection.json?raw'
import negative101 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a03-saved101-before-negative-correction.json?raw'
import negative102 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a10-saved102-after-original-candidate-retry.json?raw'
import negative103 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a13-saved103-negative-supplier-credit-partial-return.json?raw'
import negative104 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a15-saved104-rest-period-correction-for-old-responsibilities.json?raw'
import negative109 from '../../goal-1/evidence/t17-acceptance-37/chrome-negative-atomic-r6/a16-saved109-all-period-due-collected-after-corrections.json?raw'

type Input=Parameters<typeof relayCorrectionEffects>[0]
type Relay=NonNullable<Input['features']['relay']>
type Finance=Input['features']['workbench']['finance'][number]
type Frame={p:Input;run:GameRun;raw:string;target:Extract<RelaySceneTarget,{kind:'period'}>;correctionId:string}
const codec=createCampaignCodec(),originals=[positive103,positive106,negative101,negative102,negative103,negative104,negative109]
let pos103:Frame,pos106:Frame,old101:Frame,neg102:Frame,neg103:Frame,neg104:Frame,neg109:Frame
function frame(raw:string):Frame{
 const run=codec.import(raw),features=codec.registry.runtime!.project!(run) as unknown as Input['features'],relay=features.relay!
 const correction=relay.corrections[0],meter=correction?relay.meters.find(m=>m.id===correction.meterId)!:relay.meters.find(m=>m.id==='rly:74f69ecae52761965ccc78dd565ad1c1')!,period=relay.periods.find(p=>p.id===meter.periodId)!,business=relay.businesses.find(b=>b.id===period.businessId)!,station=relay.stations.find(s=>s.businessId===business.id)!
 const target:Extract<RelaySceneTarget,{kind:'period'}>={kind:'period',runId:run.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,periodId:period.id,meterId:meter.id}
 const p:Input={view:{...projectRun(run),features,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null} as unknown as Input['view'],features,accountId:business.accountId}
 expect(codec.export(run)).toBe(raw);expect(relay.casebook?.status).toBe('ready')
 return {p,run,raw,target,correctionId:correction?.id??'rly:1ef46bc560fb5f7f3f1071cdc1b3bd88'}
}
beforeAll(()=>{[pos103,pos106,old101,neg102,neg103,neg104,neg109]=originals.map(frame) as [Frame,Frame,Frame,Frame,Frame,Frame,Frame]},20000)
const effect=(f:Frame)=>relayCorrectionEffects(f.p,f.target,f.correctionId)
const relay=(p:Input)=>p.features.relay!
const book=(p:Input)=>relay(p).casebook!
const correction=(f:Frame)=>relay(f.p).corrections.find(c=>c.id===f.correctionId)!
const finance=(p:Input)=>p.features.workbench.finance.find(f=>f.accountId===p.accountId)!
function change(p:Input,update:(r:Relay)=>Relay,updateFinance?:(f:Finance)=>Finance):Input{
 return {...p,features:{...p.features,relay:update(relay(p)),workbench:{...p.features.workbench,finance:p.features.workbench.finance.map(f=>f.accountId===p.accountId&&updateFinance?updateFinance(f):f)}}}
}
const withBook=(p:Input,history:RelayCasebookHistory)=>change(p,r=>({...r,casebook:history}))
const selectedOps=(p:Input,cid=neg102.correctionId)=>{const c=relay(p).corrections.find(c=>c.id===cid)!;return c.operationIds.map(id=>book(p).operations.find(o=>o.id===id)!)}
const refundOp=(p:Input)=>selectedOps(p).find(o=>o.kind==='refund_delivered')!
const reverseOp=(p:Input)=>selectedOps(p).find(o=>o.kind==='reverse_supplier_usage')!
function effects(p:Input){return relayCorrectionEffects(p,neg102.target,neg102.correctionId)}

it('reads the saved single negative correction as actual606 cash refund and202 restored supplier asset while keeping the original customer protection',()=>{
 const f=effect(neg102),oldAccount=old101.p.view.accounts.find(a=>a.accountId===old101.p.accountId)!,account=neg102.p.view.accounts.find(a=>a.accountId===neg102.p.accountId)!
 expect(f.status).toBe('known');expect(f.identity).toMatchObject({runId:neg102.p.view.runId,revision:102,periodId:neg102.target.periodId,meterId:neg102.target.meterId,correctionId:neg102.correctionId})
 expect(f.customer).toMatchObject({status:'known',incomeDeltaFen:-606,receivableReversedFen:0,refundRegisteredFen:606,refundInitiallyPaidFen:606,refundLaterPaidFen:0,refundPaidFen:606,refundDueFen:0,refundProtectedFen:0})
 expect(f.supplier).toMatchObject({status:'known',costDeltaFen:-202,reversedFen:202,reducedUnpaidFen:0,restoredAssetFen:202})
 expect(f.customer.summary.join('')).toContain('累计实际退 '+moneyText(606));expect(f.customer.summary.join('')).toContain('不是退回充值余额')
 expect(f.supplier.summary.join('')).toContain('恢复供应未用资产/贷项 '+moneyText(202));expect(f.supplier.summary.join('')).toContain('没有因此收到供应现金')
 expect(account.cashFen-oldAccount.cashFen).toBe(-606);expect(account.availableFen-oldAccount.availableFen).toBe(-606)
 expect(account.prepaidLiabilityFen).toBe(717578);expect(account.prepaidLiabilityFen).toBe(oldAccount.prepaidLiabilityFen)
 expect(f.customer.refunds[0]!.originalDeliveryId).not.toBe(f.customer.refunds[0]!.obligationId)
 for(const id of correction(neg102).operationIds)expect(f.lines.join('\n')).toContain(id)
 expect(codec.export(neg102.run)).toBe(negative102)
})

it('keeps the historical202 restoration separate from later101 asset return and505 current pool after other corrections and old obligations',()=>{
 for(const [f,current]of [[neg103,101],[neg109,505]] as const){
  const e=effect(f)
  expect(e.customer).toMatchObject({status:'known',refundPaidFen:606,refundDueFen:0})
  expect(e.supplier).toMatchObject({status:'known',restoredAssetFen:202,reducedUnpaidFen:0})
  expect(e.supplier.pools[0]!.currentRemainingFen).toBe(current)
  expect(e.supplier.summary.join('')).toContain('本站跨期');expect(e.supplier.summary.join('')).toContain('不全部归于这张更正')
  expect(codec.export(f.run)).toBe(f.raw)
 }
 expect(effect(neg104).supplier).toMatchObject({status:'known',restoredAssetFen:202})
})

it('keeps the actual positive invoice Jan18 and supplier debt Jan11 distinct from cash and reads later partial collection and credit settlement',()=>{
 const first=effect(pos103),later=effect(pos106)
 expect(first.status).toBe('known');expect(first.customer).toMatchObject({incomeDeltaFen:120,receivableAddedFen:120,refundRegisteredFen:0})
 expect(first.customer.invoices).toEqual([expect.objectContaining({date:'2025-01-04',dueAt:'2025-01-18',amountFen:120,collectedFen:0,remainingFen:120})])
 expect(first.supplier).toMatchObject({status:'known',costDeltaFen:60,expenseAddedFen:60,cashPaidFen:0,creditSettledFen:0,dueFen:60})
 expect(first.supplier.expenses[0]).toMatchObject({date:'2025-01-04',dueAt:'2025-01-11',amountFen:60,remainingFen:60})
 expect(later.customer.invoices[0]).toMatchObject({amountFen:120,collectedFen:60,remainingFen:60,dueAt:'2025-01-18'})
 expect(later.supplier).toMatchObject({status:'known',costDeltaFen:60,cashPaidFen:30,creditSettledFen:30,dueFen:0})
 expect(later.supplier.pools[0]!.currentRemainingFen).toBe(5970)
 expect(later.sourceRefs.some(ref=>ref.kind==='transaction'&&ref.amountFen===-30)).toBe(true)
 expect(later.customer.sourceRefs.some(ref=>ref.kind==='transaction'&&ref.amountFen===60)).toBe(true)
 expect(codec.export(pos106.run)).toBe(positive106)
})

it('publishes linked money facts in the correction first layer without changing original record identity or losing original IDs',()=>{
 const rows=relayRecordRows(neg102.p,neg102.target),row=rows.rows.find(row=>row.correctionId===neg102.correctionId&&row.kind==='correction')!
 expect(rows.reason).toBeNull();expect(row.recordId).toBe(neg102.correctionId);expect(row.key).toBe('correction:'+neg102.correctionId)
 expect(row.target).toEqual(neg102.target);expect(row.summary!.join('')).toContain('累计实际退 '+moneyText(606));expect(row.summary!.join('')).toContain('恢复供应未用资产/贷项 '+moneyText(202))
 expect(row.lines.join('\n')).toContain(neg102.target.meterId!);expect(row.lines.join('\n')).toContain(correction(neg102).auditId)
 for(const id of correction(neg102).operationIds)expect(row.lines.join('\n')).toContain(id)
 expect(row.lines.join('\n')).toContain(effect(neg102).customer.refunds[0]!.obligationId)
})

function unpaidRefund():Input{
 // Explicit public-reference fixture. It is not another normal saved run or
 // a claim that the observed606 refund was unpaid in the actual Native trace.
 const p=neg102.p,o=refundOp(p),history=book(p),debt=history.obligationHistory.find(d=>d.id===o.obligationId)!,protectionId=debt.protectionReservationId!
 return change(p,r=>({...r,casebook:{...history,operations:history.operations.map(x=>x.id===o.id?{...x,status:'due'}:x),transactions:history.transactions.filter(t=>t.id!==o.id),obligationHistory:history.obligationHistory.map(d=>d.id===debt.id?{...d,remainingFen:d.amountFen}:d)}}),f=>({...f,reservations:[...f.reservations.filter(v=>v.id!==protectionId),{id:protectionId,accountId:p.accountId,originId:debt.id,kind:'customer_protection',amountFen:606,status:'active'}]}))
}
function laterRefundPay(p:Input,amountFen:number):Input{
 const h=book(p),origin=refundOp(p),debt=h.obligationHistory.find(d=>d.id===origin.obligationId)!,source='public-correction-later-refund-pay',id=operatingId(source,'PayObligation'),originalCash=book(neg102.p).transactions.find(t=>t.id===origin.id)!
 return change(p,r=>({...r,casebook:{...h,operations:[...h.operations,{...origin,id,kind:'pay_obligation',businessId:null,contractId:null,sourceEventId:source,referenceId:null,reservationId:null,amountFen,order:Math.max(...h.operations.map(o=>o.order))+1}],transactions:[...h.transactions,{...originalCash,id,sourceId:source,referenceId:debt.id,amountFen:-amountFen,order:Math.max(...h.transactions.map(t=>t.order))+1}],obligationHistory:h.obligationHistory.map(d=>d.id===debt.id?{...d,remainingFen:d.remainingFen-amountFen}:d)}}),f=>({...f,reservations:f.reservations.flatMap(v=>v.id!==debt.protectionReservationId?[v]:debt.remainingFen===amountFen?[]:[{...v,amountFen:debt.remainingFen-amountFen,status:'active' as const}])}))
}
it('distinguishes registered cash refund, actual laterPay and remaining matched protection without using historical due status as current debt',()=>{
 const unpaid=effects(unpaidRefund()),part=effects(laterRefundPay(unpaidRefund(),200)),all=effects(laterRefundPay(unpaidRefund(),606))
 expect(unpaid.customer).toMatchObject({status:'known',refundRegisteredFen:606,refundPaidFen:0,refundDueFen:606,refundProtectedFen:606})
 expect(part.customer).toMatchObject({status:'known',refundInitiallyPaidFen:0,refundLaterPaidFen:200,refundPaidFen:200,refundDueFen:406,refundProtectedFen:406})
 expect(all.customer).toMatchObject({status:'known',refundPaidFen:606,refundDueFen:0,refundProtectedFen:0})
 expect(part.customer.summary.join('')).toContain('当前尚欠 '+moneyText(406));expect(part.supplier.status).toBe('known')
})

it('accepts an absent fullypaid zero reservation in the actual positive-only projection without inventing its historical release record',()=>{
 const p=neg102.p,o=refundOp(p),debt=book(p).obligationHistory.find(d=>d.id===o.obligationId)!
 expect(debt).toMatchObject({remainingFen:0,protectionReservationId:o.reservationId})
 expect(finance(p).reservations.filter(v=>v.id===o.reservationId)).toEqual([])
 expect(effects(p).customer).toMatchObject({status:'known',refundPaidFen:606,refundDueFen:0,refundProtectedFen:0})
 // An explicit legacy public fixture may still include exactly one released0.
 const explicit=change(p,r=>r,f=>({...f,reservations:[...f.reservations,{id:o.reservationId!,accountId:p.accountId,originId:debt.id,kind:'customer_protection',status:'released',amountFen:0}]}))
 expect(effects(explicit).customer).toMatchObject({status:'known',refundPaidFen:606,refundDueFen:0,refundProtectedFen:0})
 expect(effects(p).lines.join('')).not.toContain('已释放')
})

it.each(['missing-positive','wrong-positive-amount','wrong-positive-owner','active-zero-after-paid','positive-after-paid','duplicate-after-paid'] as const)('keeps the refund side unknown for %s instead of using absence or zero to erase a protected debt',variant=>{
 const unpaid=variant.endsWith('after-paid')?neg102.p:unpaidRefund(),o=refundOp(unpaid),debt=book(unpaid).obligationHistory.find(d=>d.id===o.obligationId)!
 const sample={id:o.reservationId!,accountId:unpaid.accountId,originId:debt.id,kind:'customer_protection' as const,status:'released' as const,amountFen:0}
 const modified=change(unpaid,r=>r,f=>({...f,reservations:variant==='missing-positive'?f.reservations.filter(v=>v.id!==o.reservationId):variant==='wrong-positive-amount'?f.reservations.map(v=>v.id===o.reservationId?{...v,amountFen:605}:v):variant==='wrong-positive-owner'?f.reservations.map(v=>v.id===o.reservationId?{...v,originId:'another-original-debt'}:v):[...f.reservations,...(variant==='duplicate-after-paid'?[sample,sample]:[{...sample,status:'active' as const,amountFen:variant==='positive-after-paid'?1:0}])]}))
 const e=effects(modified)
 expect(e.customer).toMatchObject({status:'unavailable',refundPaidFen:null,refundDueFen:null,refundProtectedFen:null})
 expect(e.supplier).toMatchObject({status:'known',restoredAssetFen:202})
})

it('distinguishes a public original receivable reversal from a cash refund instead of restoring customer recharge credit',()=>{
 // A public-reference fixture for the other existing refund_delivered mode.
 // The actual Native102 above remains cash; this is not another saved branch.
 const p=neg102.p,h=book(p),refund=refundOp(p),delivery=h.operations.find(o=>o.id===refund.referenceId)!,c=correction(neg102),id=relayId('credit-reversal',c.id,delivery.id),invoiceId='public-original-credit-invoice'
 const changed=change(p,r=>({...r,corrections:r.corrections.map(row=>row.id===c.id?{...row,operationIds:row.operationIds.map(op=>op===refund.id?id:op)}:row),receivables:[...r.receivables,{id:invoiceId,operationId:delivery.id,customerId:refund.contractId!,sourceId:c.meterId,date:delivery.date,dueAt:'2025-03-07',amountFen:delivery.amountFen!,collectedFen:0,reversedFen:606}],casebook:{...h,operations:h.operations.map(o=>o.id===refund.id?{...o,id,settlement:'receivable',obligationId:null,reservationId:null}:o.id===delivery.id?{...o,kind:'deliver_on_credit' as const,referenceId:null}:o),transactions:h.transactions.filter(t=>t.id!==refund.id),obligationHistory:h.obligationHistory.filter(d=>d.id!==refund.obligationId)}}),f=>({...f,metrics:f.metrics.map(m=>m.operationId===refund.id?{...m,operationId:id}:m.operationId===delivery.id?{...m,referenceId:delivery.contractId}:m)}))
 const e=effects(changed)
 expect(e.customer).toMatchObject({status:'known',incomeDeltaFen:-606,receivableReversedFen:606,refundRegisteredFen:0,refundPaidFen:0})
 expect(e.customer.reversedInvoices[0]).toMatchObject({id:invoiceId,reversedByThisFen:606})
 expect(e.customer.reversedInvoices[0]!.remainingFen).toBe(delivery.amountFen!-606)
 expect(e.customer.summary.join('')).toContain('没有因此退现金');expect(e.supplier.status).toBe('known')
})

it('distinguishes positive income recognized from original prepaid customer funds from a newly issued receivable',()=>{
 // Explicit public-reference fixture: a prior1000fen recharge funds this120fen
 // adjustment. No normal creation, real new recharge or added cash is claimed.
 const p=pos103.p,h=book(p),c=correction(pos103),credit=h.operations.find(o=>c.operationIds.includes(o.id)&&o.kind==='deliver_on_credit')!,rechargeId='public-paid-before-correction',receivedId='public-prepayment-origin',usedId=relayId('prepaid-use',relayId('correction',c.id),rechargeId),customerId=credit.contractId!,businessId=credit.scopeBusinessId
 const originalCash=h.transactions.find(t=>t.accountId===p.accountId)!,used={...credit,id:usedId,kind:'deliver_prepaid' as const,referenceId:receivedId,order:credit.order+1},received={...credit,id:receivedId,kind:'receive_prepayment' as const,date:'2025-01-03',sourceEventId:customerId,referenceId:null,amountFen:1000,order:credit.order}
 const changed=change(p,r=>({...r,corrections:r.corrections.map(row=>row.id===c.id?{...row,operationIds:row.operationIds.map(op=>op===credit.id?usedId:op)}:row),receivables:r.receivables.filter(i=>i.operationId!==credit.id),casebook:{...h,operations:[...h.operations.filter(o=>o.id!==credit.id).map(o=>o.order>=credit.order?{...o,order:o.order+1}:o),received,used],recharges:[...h.recharges,{id:rechargeId,customerId,date:received.date,amountFen:1000,operationId:receivedId,usedFen:120,refundedFen:0,scopeBusinessId:businessId,accountId:p.accountId}],transactions:[...h.transactions,{...originalCash,id:receivedId,date:received.date,contractId:customerId,businessId,scopeBusinessId:businessId,sourceId:customerId,referenceId:null,amountFen:1000,order:Math.max(...h.transactions.map(t=>t.order))+1}]}}),f=>({...f,metrics:f.metrics.map(m=>m.operationId===credit.id?{...m,operationId:usedId,referenceId:receivedId}:m)}))
 const e=relayCorrectionEffects(changed,pos103.target,pos103.correctionId)
 expect(e.customer).toMatchObject({status:'known',incomeDeltaFen:120,prepaidConsumedFen:120,receivableAddedFen:0,refundPaidFen:0})
 expect(e.customer.invoices).toEqual([]);expect(e.customer.summary.join('')).toContain('没有新现金收取');expect(e.supplier.status).toBe('known')
})

it('keeps a mixed original receivable reversal and cash refund as separate consequences of one negative adjustment',()=>{
 // Explicit two-source public fixture, never an accepted/codec-exported save.
 const p=neg102.p,h=book(p),c=correction(neg102),refund=refundOp(p),delivery=h.operations.find(o=>o.id===refund.referenceId)!,newDeliveryId='public-additional-original-credit-delivery',reversalId=relayId('credit-reversal',c.id,newDeliveryId),newDelivery={...delivery,id:newDeliveryId,kind:'deliver_on_credit' as const,referenceId:null,amountFen:100,order:delivery.order+1},reversal={...refund,id:reversalId,settlement:'receivable',referenceId:newDeliveryId,obligationId:null,reservationId:null,amountFen:100,order:Math.max(...h.operations.map(o=>o.order))+2}
 const metricSeed=finance(p).metrics.find(m=>m.operationId===delivery.id)!,refundMetric=finance(p).metrics.find(m=>m.operationId===refund.id)!
 const changed=change(p,r=>({...r,meters:r.meters.map(m=>m.id===c.meterId?{...m,deliveryIds:[...m.deliveryIds,newDeliveryId]}:m),corrections:r.corrections.map(row=>row.id===c.id?{...row,operationIds:[...row.operationIds,reversalId]}:row),receivables:[...r.receivables,{id:'public-mixed-original-invoice',operationId:newDeliveryId,customerId:refund.contractId!,sourceId:c.meterId,date:delivery.date,dueAt:'2025-03-07',amountFen:100,collectedFen:0,reversedFen:100}],casebook:{...h,operations:[...h.operations.map(o=>({...o,order:o.order>delivery.order?o.order+1:o.order,...(o.id===refund.id?{amountFen:506}:{})})),newDelivery,reversal],transactions:h.transactions.map(t=>t.id===refund.id?{...t,amountFen:-506}:t),obligationHistory:h.obligationHistory.map(d=>d.id===refund.obligationId?{...d,amountFen:506}:d)}}),f=>({...f,metrics:[...f.metrics.map(m=>m.operationId===refund.id?{...m,deltaFen:-506}:m),{...metricSeed,operationId:newDeliveryId,referenceId:refund.contractId,deltaFen:100},{...refundMetric,operationId:reversalId,referenceId:newDeliveryId,deltaFen:-100}]}))
 const e=effects(changed)
 expect(e.customer).toMatchObject({status:'known',incomeDeltaFen:-606,receivableReversedFen:100,refundRegisteredFen:506,refundPaidFen:506,refundDueFen:0})
 expect(e.customer.refunds).toHaveLength(1);expect(e.customer.reversedInvoices).toHaveLength(1)
 expect(e.customer.summary.join('')).toContain('冲回原未收 '+moneyText(100));expect(e.customer.summary.join('')).toContain('累计实际退 '+moneyText(506))
 expect(e.supplier.status).toBe('known')
})

it.each(['customer-ref','customer-missing-op','supplier-ref','supplier-missing-op'] as const)('keeps the other side known when only %s is unavailable',variant=>{
 const p=neg102.p,h=book(p),refund=refundOp(p),reverse=reverseOp(p)
 const modified=withBook(p,{...h,operations:h.operations.filter(o=>variant!=='customer-missing-op'||o.id!==refund.id).filter(o=>variant!=='supplier-missing-op'||o.id!==reverse.id).map(o=>variant==='supplier-ref'&&o.id===reverse.id?{...o,referenceId:'other-public-cost'}:o),transactions:h.transactions.map(t=>variant==='customer-ref'&&t.id===refund.id?{...t,referenceId:'another-public-refund-debt'}:t)})
 const e=effects(modified),customerUnknown=variant.startsWith('customer')
 expect(e.status).toBe('partial');expect(e.customer.status).toBe(customerUnknown?'unavailable':'known');expect(e.supplier.status).toBe(customerUnknown?'known':'unavailable')
 if(customerUnknown){expect(e.customer.refundPaidFen).toBeNull();expect(e.supplier.restoredAssetFen).toBe(202)}else{expect(e.supplier.restoredAssetFen).toBeNull();expect(e.customer.refundPaidFen).toBe(606)}
})

it.each(['wrong-account','wrong-date','wrong-amount','wrong-source','wrong-canonical'] as const)('rejects a %s laterPay even when refund totals could look plausible',variant=>{
 const p=laterRefundPay(unpaidRefund(),200),h=book(p),last=h.operations.at(-1)!
 const e=effects(withBook(p,{...h,operations:h.operations.map(o=>o.id===last.id&&variant==='wrong-canonical'?{...o,id:'public-unmatched-pay'}:o),transactions:h.transactions.map(t=>t.id===last.id?{...t,...(variant==='wrong-account'?{accountId:'personal'}:variant==='wrong-date'?{date:'2025-03-06'}:variant==='wrong-amount'?{amountFen:-199}:variant==='wrong-source'?{sourceId:'another-command'}:{id:'public-unmatched-pay'})}:t)}))
 expect(e.customer.status).toBe('unavailable');expect(e.customer.refundPaidFen).toBeNull();expect(e.supplier.status).toBe('known')
})

function supplierSplit(paidFen:number,remainingFen:number,assetFen:number):Input{
 // Public financial-reference fixture: alter only one original invoice's
 // paid/unpaid/restored facts. No rule/replay or new normal history is claimed.
 const p=neg102.p,h=book(p),reverse=reverseOp(p),source=h.operations.find(o=>o.id===reverse.referenceId)!,debt=h.obligationHistory.find(d=>d.originOperationId===source.id)!,payments=h.operations.filter(o=>o.kind==='pay_obligation'&&o.obligationId===debt.id),paymentIds=new Set(payments.map(o=>o.id))
 return change(p,r=>({...r,supplyOptions:r.supplyOptions.map(option=>option.credit?.id===reverse.prepaymentId?{...option,credit:assetFen===0?null:{...option.credit,paidFen:assetFen,remainingFen:assetFen}}:option),casebook:{...h,operations:h.operations.filter(o=>paidFen>0||!paymentIds.has(o.id)).map(o=>paymentIds.has(o.id)?{...o,amountFen:paidFen}:o),transactions:h.transactions.filter(t=>paidFen>0||!paymentIds.has(t.id)).map(t=>paymentIds.has(t.id)?{...t,amountFen:-paidFen}:t),obligationHistory:h.obligationHistory.map(d=>d.id===debt.id?{...d,remainingFen}:d)}}))
}
it('reads negative supplier reductions from exact paid/debt facts as unpaid reversal or mixed debt and asset without min or balance-only inference',()=>{
 const unpaid=effects(supplierSplit(0,2022,0)),mixed=effects(supplierSplit(2123,0,101))
 expect(unpaid.supplier).toMatchObject({status:'known',reversedFen:202,reducedUnpaidFen:202,restoredAssetFen:0})
 expect(mixed.supplier).toMatchObject({status:'known',reversedFen:202,reducedUnpaidFen:101,restoredAssetFen:101})
 expect(unpaid.customer.refundPaidFen).toBe(606);expect(mixed.customer.refundPaidFen).toBe(606)
})

it('refuses a per-correction supplier split when more than one reverse shares the original cost, retaining the customer result',()=>{
 const p=neg102.p,h=book(p),reverse=reverseOp(p),e=effects(withBook(p,{...h,operations:[...h.operations,{...reverse,id:'public-another-reverse-same-original-cost',order:Math.max(...h.operations.map(o=>o.order))+1,amountFen:1}]}))
 expect(e.status).toBe('partial');expect(e.supplier).toMatchObject({status:'unavailable',restoredAssetFen:null,reducedUnpaidFen:null});expect(e.customer).toMatchObject({status:'known',refundPaidFen:606})
})

it('reads reversal of an originally consumed supplier asset as asset restoration instead of payable reduction or supplier cash',()=>{
 // Public-reference fixture for original consume_supplier; the real source
 // in Native102 was postpaid and paidFeb14, which remains covered separately.
 const p=neg102.p,h=book(p),reverse=reverseOp(p),source=h.operations.find(o=>o.id===reverse.referenceId)!,debt=h.obligationHistory.find(d=>d.originOperationId===source.id)!,payments=h.operations.filter(o=>o.kind==='pay_obligation'&&o.obligationId===debt.id),ids=new Set(payments.map(o=>o.id))
 const changed=withBook(p,{...h,operations:h.operations.filter(o=>!ids.has(o.id)).map(o=>o.id===source.id?{...o,kind:'consume_supplier' as const,obligationId:null,dueAt:null}:o),obligationHistory:h.obligationHistory.filter(d=>d.id!==debt.id),transactions:h.transactions.filter(t=>!ids.has(t.id))})
 const e=effects(changed)
 expect(e.supplier).toMatchObject({status:'known',reversedFen:202,reducedUnpaidFen:0,restoredAssetFen:202})
 expect(e.supplier.reversals[0]!.sourceKind).toBe('consume_supplier');expect(e.supplier.summary.join('')).toContain('没有因此收到供应现金')
 expect(e.customer.refundPaidFen).toBe(606)
})

it('reads an actual zero adjustment record as zero only when its original completed audit and current history are available',()=>{
 const z=relay(neg104.p).corrections.find(c=>c.customerDeltaFen===0&&c.supplierDeltaFen===0)!,m=relay(neg104.p).meters.find(m=>m.id===z.meterId)!,target:Extract<RelaySceneTarget,{kind:'period'}>={kind:'period',runId:neg104.target.runId,accountId:neg104.target.accountId,businessId:neg104.target.businessId,stationId:neg104.target.stationId,periodId:m.periodId,meterId:m.id}
 const e=relayCorrectionEffects(neg104.p,target,z.id)
 expect(e.status).toBe('known');expect(e.customer).toMatchObject({incomeDeltaFen:0,refundPaidFen:0,receivableAddedFen:0});expect(e.supplier).toMatchObject({costDeltaFen:0,restoredAssetFen:0,dueFen:0})
 const noHistory=change(neg104.p,r=>({...r,casebook:{...book(neg104.p),status:'unavailable',reason:'公开原账暂不可读'}}))
 expect(relayCorrectionEffects(noHistory,target,z.id).customer.refundPaidFen).toBeNull()
})

it.each(['stale-book','cross-run','cross-account','missing-history','duplicate-operation','wrong-period','uncompleted-audit'] as const)('fails closed for %s without granting or disabling original actions',variant=>{
 let p=neg102.p;const h=book(p)
 if(variant==='stale-book')p=withBook(p,{...h,revision:h.revision+1})
 if(variant==='missing-history')p=change(p,r=>({...r,casebook:{...h,status:'unavailable',reason:'明确公共反例'}}))
 if(variant==='duplicate-operation')p=withBook(p,{...h,operations:[...h.operations,h.operations[0]!]})
 if(variant==='uncompleted-audit')p=change(p,r=>({...r,audits:r.audits.map(a=>a.id===correction(neg102).auditId?{...a,completedAt:null,actualUnits:null}:a)}))
 const target=variant==='cross-run'?{...neg102.target,runId:'another-life'}:variant==='cross-account'?{...neg102.target,accountId:'personal'}:variant==='wrong-period'?{...neg102.target,periodId:'another-period'}:neg102.target
 const e=relayCorrectionEffects(p,target,neg102.correctionId)
 expect(e.status).toBe('unavailable');expect(e.customer.refundPaidFen).toBeNull();expect(e.supplier.restoredAssetFen).toBeNull()
 expect('allowed' in e).toBe(false);expect('command' in e).toBe(false)
})

it('keeps an old committed snapshot under candidate protection and allows readonly history without publishing a new success',()=>{
 const old={...old101.p,view:{...old101.p.view,hasCandidate:true,saveStatus:'unsaved' as const}},readOnly={...neg102.p,view:{...neg102.p.view,readOnly:true,saveStatus:'read_only' as const}}
 expect(relayCorrectionEffects(old,old101.target,neg102.correctionId).status).toBe('unavailable')
 expect(relayCorrectionEffects(readOnly,neg102.target,neg102.correctionId)).toMatchObject({status:'known',customer:{refundPaidFen:606},supplier:{restoredAssetFen:202}})
 expect(effect(neg102).summary.join('')).not.toContain('本次');expect(effect(neg103).summary.join('')).not.toContain('本次')
})

it('does not consume hidden meter truth or mutate any of the seven actual original authorities',()=>{
 const p=neg102.p,meter=relay(p).meters.find(m=>m.id===neg102.target.meterId)!,publicMeter={...meter}
 Object.defineProperty(publicMeter,'actualUnits',{get(){throw Error('UNREVIEWED_PRIVATE_METER_ACCESS_FORBIDDEN')}})
 const guarded=change(p,r=>({...r,meters:r.meters.map(m=>m.id===meter.id?publicMeter:m)}))
 expect(effects(guarded).status).toBe('known')
 for(const f of [pos103,pos106,old101,neg102,neg103,neg104,neg109])expect(codec.export(f.run)).toBe(f.raw)
})
