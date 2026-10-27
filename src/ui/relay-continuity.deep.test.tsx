import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {relayBusinessTarget} from './relay-player-thread.ts'
import {relayPaperFor} from './relay-continuity.ts'
import {RelayServicePaperNotes} from './RelayServicePaper.tsx'
import {moneyText} from './game-text.ts'
import normal94 from '../../goal-1/evidence/t17-acceptance-27/chrome-main-r1/main-saved94-period-ended.json?raw'
import supplier132 from '../../goal-1/evidence/t17-acceptance-33/chrome-content-r1/content-r10-saved132-after-reentry-supplier-asset.json?raw'

async function original(name:string,raw:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u4b-paper-'+name})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++sequence)})
 await controller.initialize();await controller.importNew(raw)
 const p=(accountId='personal'):GamePanelProps=>{const view=controller.snapshot.view!;return {view,features:view.features as unknown as PlayFeatures,controller,accountId,request:vi.fn()}}
 return {controller,p,close:async()=>{await controller.close();await store.close()}}
}
type Fixture=Awaited<ReturnType<typeof original>>
const station=(f:Fixture)=>{const base=f.p(),business=base.features.relay!.businesses.find(row=>row.lifecycle!=='closed')!,target=relayBusinessTarget(base,business.id)!;return {p:f.p(target.accountId),target}}

describe('deep relay papers consume original public records without creating another money result',()=>{
 let base:Fixture,partial:Fixture,refund:Fixture,supplier:Fixture
 beforeAll(async()=>{base=await original('base94',normal94)})
 beforeAll(async()=>{partial=await original('partial94',normal94)})
 beforeAll(async()=>{refund=await original('refund94',normal94)})
 beforeAll(async()=>{supplier=await original('supplier132',supplier132)})
 afterAll(async()=>{for(const f of [base,partial,refund,supplier])await f?.close()})

 it('shows actual postpaid credit and keeps real old prepayment visible when the public payment mode changes',()=>{
  const {p,target}=station(base),v=p.features.relay!,customer=v.customers.find(row=>row.businessId===target.businessId&&row.mode==='postpaid')!,selected={...target,kind:'customer' as const,customerId:customer.id},raw=base.controller.exportSaved()
  const art=relayPaperFor(p,selected)!
  expect(art.ticket).toBe('customer-credit');expect(art.paymentNature).toBe('credit');expect(art.paymentLabel).toContain('后付信用上限 '+moneyText(customer.creditLimitFen))
  expect(art.paymentLabel).toContain('原未回款 '+moneyText(customer.balance.receivableFen))
  // Bounded display policy, not a submitted renewal or a new financial history.
  const oldProtection=12345,variant={...p,features:{...p.features,relay:{...v,customers:v.customers.map(row=>row.id===customer.id?{...row,balance:{...row.balance,prepaidFen:oldProtection}}:row)}}}
  const retained=relayPaperFor(variant,selected)!
  expect(retained.paymentNature).toBe('credit');expect(retained.hasPrepaidProtection).toBe(true);expect(retained.protectedBalanceLabel).toContain(moneyText(oldProtection))
  expect(p.request).not.toHaveBeenCalled();expect(base.controller.exportSaved()).toBe(raw)
 })

 it('keeps known corrections, current-period due money, stopped support and account-wide debt together without assigning all debt to the period',()=>{
  const {p,target}=station(base),v=p.features.relay!,period=v.periods.find(row=>row.businessId===target.businessId)!,meter=v.meters.find(row=>row.periodId===period.id&&row.supplierId!==null)!,support=period.supportJob!,raw=base.controller.exportSaved()
  const stopped={...support,status:'interrupted' as const,releasedAt:p.view.date}
  // Public presentation-policy variant only, never imported, saved or called a normal outcome.
  const variant={...p,view:{...p.view,operations:{...p.view.operations!,jobs:p.view.operations!.jobs.map(job=>job.id===support.id?stopped:job)}},features:{...p.features,relay:{...v,businesses:v.businesses.map(b=>b.id===target.businessId?{...b,funds:{...b.funds,payableFen:500}}:b),periods:v.periods.map(row=>row.id===period.id?{...row,status:'settling' as const,supportJob:stopped,feePostedAt:null,compensatedAt:null}:row),meters:v.meters.map(row=>row.id===meter.id?{...row,auditedUnits:row.reportedUnits+1,correctionId:null}:row)}}}
  const art=relayPaperFor(variant,{...target,kind:'period',periodId:period.id})!,html=renderToStaticMarkup(<RelayServicePaperNotes art={art}/>)
  expect(html).toContain('本期已知差额');expect(html).toContain('本期原到期应收');expect(html).toContain('原支持已停止')
  expect(html).toContain('本账户原应付 ¥5');expect(html).toContain('不能全部归本期');expect(art.supportStatus).toBe('interrupted')
  expect(p.request).not.toHaveBeenCalled();expect(base.controller.exportSaved()).toBe(raw)
 })

 it('rejects an invalid explicit record and another customer invoice rather than falling back to a main or first paper',()=>{
  const {p,target}=station(base),v=p.features.relay!,invoice=v.receivables.find(row=>row.amountFen>row.collectedFen+row.reversedFen)!,other=v.customers.find(row=>row.businessId===target.businessId&&row.id!==invoice.customerId)!,raw=base.controller.exportSaved()
  expect(relayPaperFor(p,target,{kind:'receivable',recordId:'missing-original-invoice'})).toBeUndefined()
  expect(relayPaperFor(p,{...target,kind:'customer',customerId:other.id},{kind:'receivable',recordId:invoice.id})).toBeUndefined()
  expect(relayPaperFor(p,{...target,runId:'another-life'},{kind:'supplier',recordId:v.catalog.suppliers[0]!.id})).toBeUndefined()
  expect(base.controller.exportSaved()).toBe(raw);expect(p.request).not.toHaveBeenCalled()
 })

 it('publishes a real original partial collection, preserves that saved paper under a later candidate, and rejects a foreign receipt',async()=>{
  const before=station(partial),v=before.p.features.relay!,invoice=v.receivables.find(row=>row.dueAt<=before.p.view.date&&row.amountFen-row.collectedFen-row.reversedFen>1)!,amountFen=1,income=v.businesses.find(row=>row.id===before.target.businessId)!.metrics.incomeFen
  const command=partial.controller.prepare('CollectRelayReceivable',{receivableId:invoice.id,amountFen})
  expect(partial.controller.preview(command).allowed).toBe(true);expect((await partial.controller.submit(command)).status).toBe('saved')
  const {p,target}=station(partial),raw=partial.controller.exportSaved(),selection={kind:'receivable' as const,recordId:invoice.id},art=relayPaperFor(p,target,selection)!
  expect(art.state).toBe('received');expect(art.ticket).toBe('partial-receipt');expect(art.paymentNature).toBe('collection')
  expect(art.paymentLabel).toContain('本次实际收取本单 '+moneyText(amountFen));expect(art.paymentLabel).toContain('本单净未收')
  expect(p.features.relay!.businesses.find(row=>row.id===target.businessId)!.metrics.incomeFen).toBe(income)
  const candidate={...p,view:{...p.view,hasCandidate:true,saveStatus:'unsaved' as const}},oldReceipt={...p,view:{...p.view,receipts:p.view.receipts.map((row,index)=>index===p.view.receipts.length-1?{...row,commandId:'another-original-command'}:row)}}
  expect(relayPaperFor(candidate,target,selection)?.paymentLabel).toBe(art.paymentLabel);expect(relayPaperFor(candidate,target,selection)?.state).toBe(art.state)
  expect(relayPaperFor(oldReceipt,target,selection)?.paymentLabel).not.toContain('本次实际收取')
  expect(p.request).not.toHaveBeenCalled();expect(partial.controller.exportSaved()).toBe(raw)
 })

 it('uses the real refund operation and historical obligation to distinguish customer repayment from new revenue',async()=>{
  const before=station(refund),v=before.p.features.relay!,customer=v.customers.find(row=>row.businessId===before.target.businessId&&row.balance.prepaidFen>0)!,amountFen=1,available=v.businesses.find(row=>row.id===before.target.businessId)!.funds.availableFen,income=v.businesses.find(row=>row.id===before.target.businessId)!.metrics.incomeFen
  const command=refund.controller.prepare('RefundRelayBalance',{customerId:customer.id,amountFen})
  expect(refund.controller.preview(command).allowed).toBe(true);expect((await refund.controller.submit(command)).status).toBe('saved')
  const {p,target}=station(refund),raw=refund.controller.exportSaved(),selected={...target,kind:'customer' as const,customerId:customer.id},art=relayPaperFor(p,selected)!
  expect(art.ticket).toBe('customer-refund');expect(art.paymentNature).toBe('customer-refund');expect(art.paymentLabel).toContain('本次退款登记 '+moneyText(amountFen));expect(art.paymentLabel).toContain('已实际退 '+moneyText(amountFen))
  expect(p.features.relay!.businesses.find(row=>row.id===target.businessId)!.funds.availableFen).toBe(available);expect(p.features.relay!.businesses.find(row=>row.id===target.businessId)!.metrics.incomeFen).toBe(income)
  const recorded=p.features.relay!.refunds.at(-1)!,unavailable={...p,features:{...p.features,relay:{...p.features.relay!,casebook:{...p.features.relay!.casebook!,status:'unavailable' as const,reason:'Explicit history-unavailable display policy'}}}}
  const unknown=relayPaperFor(unavailable,selected,{kind:'refund',recordId:recorded.id})!
  expect(unknown.paymentLabel).toContain('暂不可逐笔核对');expect(unknown.paymentLabel).not.toContain('已实际退')
  expect(p.request).not.toHaveBeenCalled();expect(refund.controller.exportSaved()).toBe(raw)
 })

 it('classifies a real partial supplier-asset return by its original operation instead of a positive account balance',async()=>{
  const before=station(supplier),v=before.p.features.relay!,option=v.supplyOptions.find(row=>row.businessId===before.target.businessId&&(row.credit?.remainingFen??0)>0)!,amountFen=1,business=v.businesses.find(row=>row.id===before.target.businessId)!
  const command=supplier.controller.prepare('RefundRelaySupplier',{businessId:business.id,supplierId:option.supplierId,amountFen})
  expect(supplier.controller.preview(command).allowed).toBe(true);expect((await supplier.controller.submit(command)).status).toBe('saved')
  const {p,target}=station(supplier),raw=supplier.controller.exportSaved(),art=relayPaperFor(p,target,{kind:'supplier',recordId:option.supplierId})!
  expect(art.ticket).toBe('supplier-return');expect(art.paymentNature).toBe('supplier-return');expect(art.paymentLabel).toContain('本次取回原供应资产 '+moneyText(amountFen));expect(art.scopeLabel).toContain('不能全部归本期')
  const after=p.features.relay!.businesses.find(row=>row.id===target.businessId)!
  expect(after.funds.availableFen).toBe(business.funds.availableFen+amountFen);expect(after.metrics.incomeFen).toBe(business.metrics.incomeFen)
  expect(p.request).not.toHaveBeenCalled();expect(supplier.controller.exportSaved()).toBe(raw)
 })
})

it('keeps an unknown meter on its one original commissioned audit wait, without revealing a result or replacing its bookmark',async()=>{
 const f=await original('meter-audit-display94',normal94)
 try{
  const {p,target}=station(f),v=p.features.relay!,period=v.periods.find(row=>row.businessId===target.businessId)!,meters=v.meters.filter(row=>row.periodId===period.id&&row.auditedUnits===null).slice(0,2),meter=meters[0]!,leaf={...target,kind:'period' as const,periodId:period.id,meterId:meter.id},selection={kind:'meter' as const,recordId:meter.id},raw=f.controller.exportSaved(),bookmark=JSON.stringify(leaf)
  expect(meters).toHaveLength(2)
  // Explicit public presentation fixture only: these audit jobs are never imported or saved.
  // The two original meter identities remain unknown in all waiting/cancelled/ambiguous variants.
  const job={...period.job!,id:'display-original-audit-job',actionId:'display-original-audit-action',definitionId:'relay-meter-audit',contractId:null,startAt:'2025-02-26',completeAt:'2025-03-01',status:'planned' as const,releasedAt:null,outputId:null},oldJob={...job,id:'display-old-audit-job',actionId:'display-old-audit-action',startAt:'2025-02-23',completeAt:'2025-02-26',status:'cancelled' as const,releasedAt:p.view.date}
  const frame=(status:'planned'|'running'|'cancelled'|'interrupted',withOld=false,oldStatus:'cancelled'|'interrupted'='cancelled'):GamePanelProps=>{
   const today=status==='running'||status==='interrupted'?'2025-02-27':p.view.date,current={...job,status,releasedAt:status==='cancelled'||status==='interrupted'?today:null},jobs=withOld?[{...oldJob,status:oldStatus},current]:[current]
   return {...p,view:{...p.view,date:today,operations:{...p.view.operations!,jobs:[...p.view.operations!.jobs,...jobs]}},features:{...p.features,relay:{...v,audits:[...v.audits,...jobs.flatMap(j=>meters.map((m,index)=>({id:j.id+'-leaf-'+index,businessId:target.businessId,meterId:m.id,jobId:j.id,completedAt:null,actualUnits:null})))],auditJobs:[...v.auditJobs,...jobs.map(j=>({jobId:j.id,job:j,businessId:target.businessId,periodIds:[period.id],meterCount:meters.length,completed:false}))]}}}
  }
  for(const status of ['planned','running'] as const)for(const oldStatus of ['cancelled','interrupted'] as const){
   const input=frame(status,true,oldStatus)
   for(const art of [relayPaperFor(input,leaf),relayPaperFor(input,target,selection)]){
    expect(art).toMatchObject({phase:'audit',state:status,ticket:'meter'})
    expect(art!.dateLabel).toBe('原复核 '+job.startAt+'—'+job.completeAt)
    expect(art!.scopeLabel).toContain('原完整批次 2条');expect(art!.scopeLabel).toContain('本票包含')
    expect(art!.line).toContain(meter.date+'原报告 '+meter.reportedUnits);expect(art!.line).toContain('实计仍待独立复核')
    expect(renderToStaticMarkup(<RelayServicePaperNotes art={art!}/>)).toContain('本票包含')
    expect(art!.state).not.toBe('reviewed');expect(art!.state).not.toBe('corrected')
   }
  }
  for(const status of ['cancelled','interrupted'] as const){
   expect(relayPaperFor(frame(status),leaf)?.state).toBe('reported')
   expect(relayPaperFor(frame(status),target,selection)?.state).toBe('reported')
  }
  const planned=frame('planned'),batch=planned.features.relay!.auditJobs.at(-1)!,duplicate={...planned,features:{...planned.features,relay:{...planned.features.relay!,auditJobs:[...planned.features.relay!.auditJobs,batch]}}}
  for(const art of [relayPaperFor(duplicate,leaf),relayPaperFor(duplicate,target,selection)]){
   expect(art).toMatchObject({phase:'audit',state:'reported',ticket:'meter'})
   expect(art!.scopeLabel).toContain('原复核来源待核对');expect(art!.responsibilities?.join('')).toContain('先核对')
   expect(art!.dateLabel).toBe(meter.date);expect(art!.line).toContain('实计仍待独立复核')
  }
  expect(JSON.stringify(leaf)).toBe(bookmark);expect(p.request).not.toHaveBeenCalled();expect(f.controller.exportSaved()).toBe(raw)
 }finally{await f.close()}
})
