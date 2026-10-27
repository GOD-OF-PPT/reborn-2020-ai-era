import {beforeAll,expect,it} from 'vitest'
import {createCampaignCodec,campaignRelay} from '../application/campaign.ts'
import {enrichRelayCasebook} from '../application/relay-casebook-projection.ts'
import {projectRelay} from '../core/relay-projection.ts'
import {projectRun} from '../core/commands.ts'
import {evaluateCommand} from '../core/commands.ts'
import type {GameRun} from '../core/run-types.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import {relayRecordKindLabel,relayRecordRows} from './relay-records.ts'
import {moneyText} from './game-text.ts'
import actual87 from '../../goal-1/evidence/t17-acceptance-36/chrome-service-r2/r8-10-saved87-new-original-customer2-collection.json?raw'
import ready80 from '../../goal-1/evidence/t17-acceptance-33/chrome-main-r1/r4-saved80-front-completed-before-service.json?raw'
import service83 from '../../goal-1/evidence/t17-acceptance-33/chrome-main-r1/r4-saved83-mid-service-first-original-due.json?raw'
import closed91 from '../../goal-1/evidence/t17-acceptance-33/chrome-main-r1/r5-saved91-full-service-closed.json?raw'

type Input=Parameters<typeof relayRecordRows>[0]
type WholePeriodTarget=Extract<RelaySceneTarget,{kind:'period'}>&{readonly jobId?:never;readonly meterId?:never}
const codec=createCampaignCodec()
let run:GameRun,p:Input,target:WholePeriodTarget
beforeAll(()=>{
 run=codec.import(actual87)
 const features=codec.registry.runtime!.project!(run) as unknown as Input['features'],relay=enrichRelayCasebook(run,projectRelay(run,campaignRelay))!,period=relay.periods.find(t=>t.from==='2024-10-09'&&t.to==='2024-11-06')!,business=relay.businesses.find(b=>b.id===period.businessId)!,station=relay.stations.find(s=>s.businessId===business.id)!
 p={accountId:business.accountId,view:{...projectRun(run),busy:false,readOnly:false,hasCandidate:false,saveStatus:'saved'} as Input['view'],features:{...features,relay}}
 target={kind:'period',runId:run.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,periodId:period.id}
})

it('provides typed original record identities and first-layer money without replacing the original evidence',()=>{
 const result=relayRecordRows(p,target)
 expect(result.reason).toBeNull();expect(result.rows.length).toBeGreaterThan(0)
 for(const row of result.rows){expect(row.recordId).toBeTruthy();expect(row.summary!.length).toBeGreaterThan(0);expect(row.lines.length).toBeGreaterThan(0);expect(relayRecordKindLabel(row.kind)).not.toMatch(/^[a-z]+$/)}
 const invoice=result.rows.find(r=>r.kind==='receivable'&&r.customerId===p.features.relay!.customers.filter(c=>c.businessId===target.businessId)[1]!.id&&r.summary!.some(s=>s.includes('净未收')))
 expect(invoice?.receivableId).toBe(invoice?.recordId)
 expect(result.rows.flatMap(r=>r.summary??[]).join('\n')).not.toMatch(/CollectRelayDue|CorrectRelayUsage|postpaid|prepaid|planned/)
 expect(codec.export(run)).toBe(actual87)
})

it('keeps an unaudited meter unknown and binds that original leaf instead of another customer',()=>{
 const meter=p.features.relay!.meters.find(m=>m.periodId===target.periodId&&m.auditedUnits===null)!,leaf:RelaySceneTarget={...target,meterId:meter.id}
 const result=relayRecordRows(p,leaf),rows=result.rows.filter(r=>r.kind==='meter')
 expect(result.reason).toBeNull();expect(rows).toHaveLength(1)
 expect(rows[0]).toMatchObject({recordId:meter.id,meterId:meter.id,customerId:meter.customerId})
 expect(rows[0]!.auditId).toBeUndefined();expect(rows[0]!.correctUnits).toBeUndefined()
 expect(rows[0]!.summary!.join('')).toContain('尚未独立复核')
 expect(result.rows.filter(r=>r.kind==='refund').every(r=>r.customerId===meter.customerId&&r.ownership==='station')).toBe(true)
})

it('refuses another run, a duplicated original meter and a forged visible audit truth',()=>{
 expect(relayRecordRows(p,{...target,runId:'other-life'}).rows).toEqual([])
 const relay=p.features.relay!,meter=relay.meters.find(m=>m.periodId===target.periodId&&m.auditedUnits===null)!,leaf:RelaySceneTarget={...target,meterId:meter.id}
 // Deliberately untrusted malformed input; production never permits both children.
 const mixed={...target,meterId:meter.id,jobId:'malformed-mixed-job'} as unknown as RelaySceneTarget
 expect(relayRecordRows(p,mixed)).toMatchObject({rows:[],reason:expect.any(String)})
 const duplicate={...p,features:{...p.features,relay:{...relay,meters:[...relay.meters,meter]}}}
 expect(relayRecordRows(duplicate,target)).toMatchObject({rows:[],reason:expect.any(String)})
 const forged={...p,features:{...p.features,relay:{...relay,meters:relay.meters.map(m=>m.id===meter.id?{...m,auditedUnits:123456}:m)}}}
 expect(relayRecordRows(forged,leaf)).toMatchObject({rows:[],reason:expect.any(String)})
 expect(codec.export(run)).toBe(actual87)
})

it('labels unavailable historical details explicitly and keeps stable records when the public meter order changes',()=>{
 const relay=p.features.relay!,{casebook:omitted,...legacy}=relay
 expect(omitted).toBeDefined()
 const old={...p,features:{...p.features,relay:legacy}},result=relayRecordRows(old,target)
 expect(result.reason).toBeNull();expect(result.rows.some(r=>r.lines.some(s=>s.includes('逐笔付款与原投入明细尚未取得')))).toBe(true)
 const reversed={...p,features:{...p.features,relay:{...relay,meters:[...relay.meters].reverse()}}}
 expect(relayRecordRows(reversed,target).rows.map(r=>r.key)).toEqual(relayRecordRows(p,target).rows.map(r=>r.key))
})

it('does not accept a casebook from a different committed revision or duplicated original cash operation',()=>{
 const relay=p.features.relay!,history=relay.casebook!
 const stale={...p,features:{...p.features,relay:{...relay,casebook:{...history,revision:history.revision+1}}}}
 expect(relayRecordRows(stale,target)).toMatchObject({rows:[],reason:expect.any(String)})
 const duplicate={...p,features:{...p.features,relay:{...relay,casebook:{...history,operations:[...history.operations,history.operations[0]!]}}}}
 expect(relayRecordRows(duplicate,target)).toMatchObject({rows:[],reason:expect.any(String)})
})

it('keeps the full original cross-period audit batch distinct from its current period filter',()=>{
 const relay=p.features.relay!,{casebook:omitted,...legacy}=relay,period=legacy.periods.find(t=>t.id===target.periodId)!,meter=legacy.meters.find(m=>m.periodId===period.id&&m.auditedUnits===null)!
 expect(omitted).toBeDefined()
 const secondId='public-second-period',secondMeterId='public-second-meter',batchId='public-cross-period-audit',actionId='public-audit-action'
 const service:ProductionJob={...period.job!,id:'public-second-service',actionId:'public-second-service-action'},support:ProductionJob={...period.supportJob!,id:'public-second-support',actionId:'public-second-support-action'}
 const auditJob:ProductionJob={...period.job!,id:batchId,actionId,definitionId:'relay-meter-audit',startAt:'2024-11-04',completeAt:'2024-11-07',status:'completed',releasedAt:'2024-11-07',outputId:'public-audit-output'}
 const other={...period,id:secondId,jobId:service.id,job:service,supportJobId:support.id,supportJob:support}
 const second={...meter,id:secondMeterId,periodId:secondId,costOperationId:null,deliveryIds:[],auditedUnits:meter.reportedUnits}
 const audits=[{id:'public-audit-one',businessId:period.businessId,meterId:meter.id,jobId:batchId,completedAt:p.view.date,actualUnits:meter.reportedUnits},{id:'public-audit-two',businessId:period.businessId,meterId:second.id,jobId:batchId,completedAt:p.view.date,actualUnits:second.reportedUnits}]
 const input:Input={...p,view:{...p.view,operations:{...p.view.operations!,jobs:[...p.view.operations!.jobs,service,support,auditJob]}},features:{...p.features,relay:{...legacy,periods:[...legacy.periods,other],meters:[...legacy.meters.map(m=>m.id===meter.id?{...m,auditedUnits:m.reportedUnits}:m),second],audits:[...legacy.audits.filter(a=>a.meterId!==meter.id),...audits],auditJobs:[...legacy.auditJobs,{jobId:batchId,job:auditJob,businessId:period.businessId,periodIds:[period.id,secondId],meterCount:2,completed:true}]}}}
 const result=relayRecordRows(input,{...target,jobId:batchId})
 expect(result.reason).toBeNull()
 expect(result.rows.find(r=>r.kind==='audit'&&r.recordId===batchId)).toMatchObject({jobId:batchId,periodIds:[period.id,secondId],summary:expect.arrayContaining([expect.stringContaining('涉及 2期')])})
 expect(result.rows.filter(r=>r.kind==='meter').map(r=>r.recordId).sort()).toEqual([meter.id,second.id].sort())
 expect(result.rows.find(r=>r.meterId===meter.id&&r.kind==='meter')).toMatchObject({auditId:'public-audit-one',correctUnits:meter.reportedUnits})
})

it('reads the same committed money in readonly or unsaved-candidate overlays without publishing a proposed state',()=>{
 const normal=relayRecordRows(p,target),protectedView={...p,view:{...p.view,readOnly:true,hasCandidate:true,saveStatus:'unsaved' as const}}
 expect(relayRecordRows(protectedView,target)).toEqual(normal)
 expect(codec.export(run)).toBe(actual87)
})

it('distinguishes original refund cash, its later payment and remaining debt by exact public references',()=>{
 // A public-view fixture tests attribution only; it is not a new saved normal life.
 const relay=p.features.relay!,history=relay.casebook!,source=history.recharges.find(r=>r.scopeBusinessId===target.businessId)!,customer=relay.customers.find(c=>c.id===source.customerId)!,seedOperation=history.operations.find(o=>o.id===source.operationId)!,seedCash=history.transactions[0]!
 expect(source).toBeDefined()
 const refundId='public-refund-record',operationId='public-refund-operation',obligationId='public-refund-obligation',laterId='public-refund-later-payment',rechargeId='public-refund-recharge'
 const operation={...seedOperation,id:operationId,kind:'refund_undelivered' as const,order:100000,date:p.view.date,amountFen:10000,sourceEventId:customer.id,contractId:customer.id,referenceId:source.operationId,obligationId,reservationId:null}
 const later={...operation,id:laterId,kind:'pay_obligation' as const,order:100001,amountFen:4000,sourceEventId:'public-original-pay-command',referenceId:null,businessId:null}
 const debt={id:obligationId,accountId:p.accountId,scopeBusinessId:target.businessId,businessId:target.businessId,contractId:customer.id,counterpartyId:'world',originOperationId:operationId,sourceEventId:customer.id,kind:'refund_undelivered' as const,date:p.view.date,amountFen:10000,remainingFen:0,protectionReservationId:null}
 const firstCash={...seedCash,id:operationId,order:100000,lineIndex:0,date:p.view.date,accountId:p.accountId,scopeBusinessId:target.businessId,businessId:target.businessId,contractId:customer.id,sourceId:customer.id,referenceId:obligationId,amountFen:-6000}
 const laterCash={...firstCash,id:laterId,order:100001,sourceId:later.sourceEventId,amountFen:-4000}
 const frame:Input={...p,features:{...p.features,relay:{...relay,refunds:[...relay.refunds,{id:refundId,customerId:customer.id,date:p.view.date,amountFen:10000,rechargeIds:[rechargeId],operationIds:[operationId]}],casebook:{...history,recharges:[...history.recharges,{...source,id:rechargeId,amountFen:20000,usedFen:10000,refundedFen:10000}],operations:[...history.operations,operation,later],obligationHistory:[...history.obligationHistory,debt],transactions:[...history.transactions,firstCash,laterCash]}}}}
 const result=relayRecordRows(frame,target),refund=result.rows.find(r=>r.refundId===refundId)!
 expect(result.reason).toBeNull();expect(refund.state).toContain('付清')
 expect(refund.summary!.join('')).toContain('退款现金 ¥100')
 expect(refund.lines.some(s=>s.includes(laterId)&&s.includes(obligationId))).toBe(true)
 const wrong={...frame,features:{...frame.features,relay:{...frame.features.relay!,casebook:{...frame.features.relay!.casebook!,transactions:frame.features.relay!.casebook!.transactions.map(t=>t.id===laterId?{...t,referenceId:'another-obligation'}:t)}}}}
 expect(relayRecordRows(wrong,target)).toMatchObject({reason:expect.any(String),rows:[]})
 expect(codec.export(run)).toBe(actual87)
})

it('does not describe a real original service cancelled before opening as spent money or action',()=>{
 let current=codec.import(ready80)
 const before=projectRun(current),original=codec.export(current),savedService=codec.import(service83).receipts.find(r=>r.kind==='StartRelayServicePeriod'&&r.revisionBefore===80)!
 expect(savedService).toBeDefined()
 const payload=(JSON.parse(savedService.payloadSignature) as {payload:unknown}).payload
 const send=(kind:string,body:unknown,commandId:string)=>{const result=evaluateCommand(current,{runId:current.runId,actorId:current.actorId,commandId,expectedRevision:current.revision,kind,payload:body},codec.registry,current.actorId);expect(result.status).toBe('proposed');if(result.status!=='proposed')throw Error('ORIGINAL_TEST_COMMAND_REJECTED');current=codec.import(codec.export(result.nextRun))}
 const oldPeriods=new Set(projectRelay(current,campaignRelay)!.periods.map(t=>t.id))
 send('StartRelayServicePeriod',payload,'record-cancel-original-plan')
 const planned=projectRelay(current,campaignRelay)!.periods.filter(t=>!oldPeriods.has(t.id))
 expect(planned).toHaveLength(1);expect(planned[0]!.job!.status).toBe('planned')
 send('StopRelayPeriod',{periodId:planned[0]!.id},'record-cancel-before-start')
 const features=codec.registry.runtime!.project!(current) as unknown as Input['features'],relay=enrichRelayCasebook(current,projectRelay(current,campaignRelay))!,period=relay.periods.find(t=>t.id===planned[0]!.id)!,business=relay.businesses.find(b=>b.id===period.businessId)!,station=relay.stations.find(s=>s.businessId===business.id)!
 const view={...projectRun(current),busy:false,readOnly:false,hasCandidate:false,saveStatus:'saved'} as Input['view'],frame:Input={view,features:{...features,relay},accountId:business.accountId},selected:WholePeriodTarget={kind:'period',runId:current.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,periodId:period.id}
 const action=relay.casebook.actions.find(a=>a.jobId===period.jobId)!
 expect(action).toMatchObject({status:'cancelled',executedAt:null})
 expect(view.budget.spent).toBe(before.budget.spent)
 expect(view.accounts.find(a=>a.accountId===business.accountId)!.cashFen).toBe(before.accounts.find(a=>a.accountId===business.accountId)!.cashFen)
 expect(period.supportJob!.status).toBe('planned')
 const result=relayRecordRows(frame,selected),row=result.rows.find(r=>r.kind==='service'&&r.periodId===period.id)!
 expect(result.reason).toBeNull();expect(row.summary!.join('')).toContain('已取消，尚未实际开工')
 expect(row.summary!.join('')).not.toContain('已实际执行')
 expect(original).toBe(ready80)
},20000)

it('reads supplier invoice payments and credit settlement in the original reference order, excluding other debt',()=>{
 // Deliberate public financial-view fixture, not a newly played or saved campaign.
 const relay=p.features.relay!,history=relay.casebook!,meter=relay.meters.find(m=>m.periodId===target.periodId&&m.supplierId!==null&&m.costOperationId!==null)!,seed=history.operations.find(o=>o.id===meter.costOperationId)!,supplierId=meter.supplierId!,pool=seed.prepaymentId!,option=relay.supplyOptions.find(o=>o.businessId===target.businessId&&o.supplierId===supplierId)!,cashSeed=history.transactions.find(t=>t.accountId===p.accountId)!
 expect(pool).toBeTruthy()
 const owner={scopeBusinessId:target.businessId,accountId:p.accountId,businessId:target.businessId,contractId:null},invoiceId='public-supplier-invoice',debtId='public-supplier-debt',payId='public-manual-supplier-pay',reverseId='public-supplier-reversal',nextInvoiceId='public-next-supplier-invoice',nextDebtId='public-next-supplier-debt',settleId='public-supplier-credit-settlement',otherDebtId='public-unrelated-supplier-debt',otherPayId='public-unrelated-supplier-payment'
 const invoice={...seed,...owner,id:invoiceId,kind:'incur_supplier_usage' as const,order:100000,date:p.view.date,sourceEventId:meter.id,referenceId:seed.id,prepaymentId:pool,obligationId:debtId,dueAt:p.view.date,amountFen:10000}
 const pay={...invoice,id:payId,kind:'pay_obligation' as const,order:100001,sourceEventId:'public-original-manual-pay-command',referenceId:null,prepaymentId:null,businessId:null,amountFen:6000}
 const reverse={...invoice,id:reverseId,kind:'reverse_supplier_usage' as const,order:100002,referenceId:invoiceId,obligationId:null,dueAt:null,amountFen:6000}
 const nextInvoice={...invoice,id:nextInvoiceId,order:100003,obligationId:nextDebtId,amountFen:5000}
 const settle={...nextInvoice,id:settleId,kind:'settle_supplier_credit' as const,order:100004,referenceId:nextInvoiceId,amountFen:2000}
 const otherInvoice={...invoice,id:'public-unrelated-supplier-invoice',order:100005,sourceEventId:'public-unrelated-supplier-source',prepaymentId:'public-another-supplier-pool',obligationId:otherDebtId,amountFen:900}
 const otherPay={...pay,id:otherPayId,order:100006,sourceEventId:'public-another-manual-pay-command',obligationId:otherDebtId,amountFen:900}
 const debt={...owner,id:debtId,counterpartyId:'world',sourceEventId:meter.id,originOperationId:invoiceId,kind:'expense' as const,date:p.view.date,amountFen:10000,remainingFen:0,protectionReservationId:null}
 const nextDebt={...debt,id:nextDebtId,originOperationId:nextInvoiceId,amountFen:5000,remainingFen:3000},otherDebt={...debt,id:otherDebtId,sourceEventId:otherInvoice.sourceEventId,originOperationId:otherInvoice.id,amountFen:900}
 const cash={...cashSeed,...owner,id:payId,order:100001,lineIndex:0,date:p.view.date,sourceId:pay.sourceEventId,referenceId:debtId,amountFen:-6000},otherCash={...cash,id:otherPayId,order:100006,sourceId:otherPay.sourceEventId,referenceId:otherDebtId,amountFen:-900}
 const credit={id:pool,accountId:p.accountId,businessId:target.businessId,counterpartyId:'world',paidFen:2000,remainingFen:0}
 const frame:Input={...p,features:{...p.features,relay:{...relay,supplyOptions:relay.supplyOptions.map(o=>o===option?{...o,credit,outstandingFen:3000}:o),casebook:{...history,operations:[...history.operations,invoice,pay,reverse,nextInvoice,settle,otherInvoice,otherPay],obligationHistory:[...history.obligationHistory,debt,nextDebt,otherDebt],transactions:[...history.transactions,cash,otherCash]}}}}
 const result=relayRecordRows(frame,target),row=result.rows.find(r=>r.kind==='supplier'&&r.supplierId===supplierId)!,lines=row.lines
 expect(result.reason).toBeNull()
 expect(lines.some(line=>line.includes(payId)&&line.includes(debtId)&&line.includes('实际现金'))).toBe(true)
 expect(lines.some(line=>line.includes(otherPayId))).toBe(false)
 expect(lines.findIndex(line=>line.includes(invoiceId))).toBeLessThan(lines.findIndex(line=>line.includes(payId)))
 expect(lines.findIndex(line=>line.includes(payId))).toBeLessThan(lines.findIndex(line=>line.includes(reverseId)))
 expect(lines.find(line=>line.includes(settleId))).toContain('非现金')
 expect(result.rows.some(r=>r.kind==='obligation'&&r.obligationId===debtId)).toBe(true)
 const broken={...frame,features:{...frame.features,relay:{...frame.features.relay!,casebook:{...frame.features.relay!.casebook!,transactions:frame.features.relay!.casebook!.transactions.map(t=>t.id===payId?{...t,referenceId:otherDebtId}:t)}}}}
 expect(relayRecordRows(broken,target)).toMatchObject({rows:[],reason:expect.any(String)})
 const wrongSource={...frame,features:{...frame.features,relay:{...frame.features.relay!,casebook:{...frame.features.relay!.casebook!,transactions:frame.features.relay!.casebook!.transactions.map(t=>t.id===payId?{...t,sourceId:'another-command-source'}:t)}}}}
 expect(relayRecordRows(wrongSource,target)).toMatchObject({rows:[],reason:expect.any(String)})
 expect(codec.export(run)).toBe(actual87)
})

it('uses the original customer ordinal in readable titles while retaining every full customer reference in the original evidence',()=>{
 const relay=p.features.relay!,customers=relay.customers.filter(c=>c.businessId===target.businessId),whole=relayRecordRows(p,target)
 expect(whole.reason).toBeNull()
 for(const row of whole.rows)expect(row.title).not.toMatch(/[a-f0-9]{32}/i)
 for(const customer of customers){
  const customerRow=whole.rows.find(r=>r.kind==='customer'&&r.customerId===customer.id)!,number=customers.findIndex(c=>c.id===customer.id)+1
  expect(customerRow.title).toContain('客户'+number+'的原约定')
  expect(customerRow.title).toContain(customer.mode==='prepaid'?'预付':'后付');expect(customerRow.title).toContain(customer.termEnd)
  expect(customerRow.lines.join('\n')).toContain(customer.id);expect(customerRow.lines.join('\n')).toContain(customer.personId)
  const selected:RelaySceneTarget={kind:'customer',runId:target.runId,accountId:target.accountId,businessId:target.businessId,stationId:target.stationId,customerId:customer.id},only=relayRecordRows(p,selected)
  expect(only.reason).toBeNull();expect(only.rows.find(r=>r.kind==='customer')!.title).toBe(customerRow.title)
  expect(only.rows.find(r=>r.kind==='customer')!.recordId).toBe(customer.id)
  for(const meter of relay.meters.filter(m=>m.customerId===customer.id&&m.periodId===target.periodId)){
   const row=whole.rows.find(r=>r.kind==='meter'&&r.meterId===meter.id)!
   expect(row.title).toContain('客户'+number);expect(row.lines.join('\n')).toContain(customer.id)
   expect(row).toMatchObject({key:'meter:'+meter.id,recordId:meter.id,target:{...target,meterId:meter.id}})
  }
 }
 const period=whole.rows.find(r=>r.kind==='service'&&r.periodId===target.periodId)!
 for(const id of relay.periods.find(r=>r.id===target.periodId)!.customerIds)expect(period.lines.join('\n')).toContain(id)
 expect(codec.export(run)).toBe(actual87)
})

it('distinguishes same-customer same-due invoices and same-day receipts by their original business sequence across different filters',()=>{
 // This explicit public-view fixture verifies labels, never claims new cash or a new saved campaign.
 const relay=p.features.relay!,history=relay.casebook!,seed=history.collections.find(c=>c.scopeBusinessId===target.businessId)!,customer=relay.customers.find(c=>c.id===seed.customerId)!,invoice=relay.receivables.find(i=>i.customerId===customer.id&&relay.meters.some(m=>m.id===i.sourceId&&m.customerId===customer.id&&m.periodId===target.periodId))!,number=relay.customers.filter(c=>c.businessId===target.businessId).findIndex(c=>c.id===customer.id)+1
 expect(invoice).toBeDefined()
 const one={...invoice,id:'public-title-same-due-one',operationId:'public-title-invoice-operation-one',date:invoice.date,dueAt:invoice.dueAt,amountFen:400,collectedFen:200,reversedFen:0},two={...one,id:'public-title-same-due-two',operationId:'public-title-invoice-operation-two',amountFen:700,collectedFen:0}
 const first={...seed,id:'public-title-same-day-receipt-one',operationId:'public-title-cash-one',receivableId:one.id,customerId:customer.id,date:p.view.date,amountFen:100},second={...first,id:'public-title-same-day-receipt-two',operationId:'public-title-cash-two'}
 const frame:Input={...p,features:{...p.features,relay:{...relay,receivables:[...relay.receivables,one,two],casebook:{...history,collections:[...history.collections,first,second]}}}},invoiceCount=relay.receivables.filter(i=>relay.customers.some(c=>c.id===i.customerId&&c.businessId===target.businessId)).length,receiptCount=history.collections.filter(c=>c.scopeBusinessId===target.businessId).length
 const selected:RelaySceneTarget={kind:'customer',runId:target.runId,accountId:target.accountId,businessId:target.businessId,stationId:target.stationId,customerId:customer.id},meter=relay.meters.find(m=>m.id===invoice.sourceId)!,leaf:RelaySceneTarget={...target,meterId:meter.id}
 const frames=[relayRecordRows(frame,target),relayRecordRows(frame,selected),relayRecordRows(frame,leaf)]
 for(const result of frames){
  expect(result.reason).toBeNull()
  for(const [offset,item]of [[1,one],[2,two]] as const){const row=result.rows.find(r=>r.receivableId===item.id&&r.kind==='receivable')!
   expect(row.title).toContain('客户'+number+' · 原单'+(invoiceCount+offset));expect(row.title).toContain(item.date+'开单');expect(row.title).toContain(item.dueAt+'到期');expect(row.title).toContain('净未收'+moneyText(offset===1?200:700))
   expect(row.lines.join('\n')).toContain(item.id);expect(row.lines.join('\n')).toContain(customer.id)
   expect(row).toMatchObject({key:'receivable:'+item.id,recordId:item.id,receivableId:item.id,target:leaf})
  }
  for(const [offset,item]of [[1,first],[2,second]] as const){const row=result.rows.find(r=>r.collectionId===item.id)!
   expect(row.title).toContain('客户'+number+' · 收据'+(receiptCount+offset));expect(row.title).toContain(item.date+'实收'+moneyText(100));expect(row.title).not.toMatch(/[a-f0-9]{32}/i)
   expect(row.lines.join('\n')).toContain(item.id);expect(row.lines.join('\n')).toContain(one.id)
   expect(row).toMatchObject({key:'collection:'+item.id,recordId:item.id,collectionId:item.id,receivableId:one.id})
  }
 }
 expect(frames[0]!.rows.filter(r=>r.kind==='receivable'&&[one.id,two.id].includes(r.recordId)).map(r=>r.title).sort()).toEqual(frames[1]!.rows.filter(r=>r.kind==='receivable'&&[one.id,two.id].includes(r.recordId)).map(r=>r.title).sort())
 expect(codec.export(run)).toBe(actual87)
})

it('names an original completed audit by its real dates and business batch ordinal while preserving the full cross-reference',()=>{
 const actual=codec.import(closed91),features=codec.registry.runtime!.project!(actual) as unknown as Input['features'],relay=enrichRelayCasebook(actual,projectRelay(actual,campaignRelay))!,period=relay.periods.find(t=>t.from==='2024-10-09'&&t.to==='2024-11-06')!,business=relay.businesses.find(b=>b.id===period.businessId)!,station=relay.stations.find(s=>s.businessId===business.id)!,batch=relay.auditJobs.find(a=>a.businessId===business.id&&a.periodIds.includes(period.id))!
 expect(batch).toBeDefined();expect(batch.job!.status).toBe('completed')
 const view={...projectRun(actual),busy:false,readOnly:false,hasCandidate:false,saveStatus:'saved'} as Input['view'],frame:Input={view,features:{...features,relay},accountId:business.accountId},whole:WholePeriodTarget={kind:'period',runId:actual.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,periodId:period.id},index=relay.auditJobs.filter(a=>a.businessId===business.id).findIndex(a=>a.jobId===batch.jobId)+1
 for(const selected of [whole,{...whole,jobId:batch.jobId}] satisfies RelaySceneTarget[]){
  const result=relayRecordRows(frame,selected),row=result.rows.find(r=>r.kind==='audit'&&r.jobId===batch.jobId)!
  expect(result.reason).toBeNull();expect(row.title).toBe('第'+index+'次原复核 · '+batch.job!.startAt+'—'+batch.job!.completeAt)
  expect(row.title).not.toMatch(/[a-f0-9]{32}/i);expect(row.lines.join('\n')).toContain(batch.jobId)
  for(const id of batch.periodIds)expect(row.lines.join('\n')).toContain(id)
  expect(row).toMatchObject({key:'audit:'+batch.jobId,recordId:batch.jobId,jobId:batch.jobId,periodIds:batch.periodIds})
 }
 expect(codec.export(actual)).toBe(closed91)
})
