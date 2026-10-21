import {beforeAll,expect,it} from 'vitest'
import {createCampaignCodec,createCampaignRun,campaignMarket} from '../application/campaign.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {projectRun} from '../core/commands.ts'
import {projectRelay} from '../core/relay-projection.ts'
import {prepareRelayF04} from '../testing/relay-scenarios.ts'
import {createPublicRiskInvestigation} from '../testing/public-risk-scene-fixture.ts'
import {savedSceneResult} from './scene-result.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {RelayCommandDetails} from './RelayCommandDetails.tsx'

/** Small real fixtures supply public snapshots; they are not normal play or native saving evidence. */
function displayFrames(mode:'prepaid'|'postpaid'='prepaid'){
 const h=prepareRelayF04({parameters:{billingErrorBps:10000,monthlyUnits:1000}}).h
 const base=createCampaignRun({runId:'relay-result-display-base',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'relay-result-display-base'})
 const baseFeatures=createCampaignCodec().registry.runtime!.project!(base) as unknown as PlayFeatures
 const view=():PlayingView=>({...projectRun(h.run),features:{...baseFeatures,
  relay:projectRelay(h.run,h.relay),workbench:projectWorkbench(h.run,h.runtime,h.operations.catalog,campaignMarket.catalog)},
  saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null})
 const business=h.run.operations!.businesses.find(row=>row.route==='api_relay')!
 h.send('StartRelayMarketing',{businessId:business.id,segment:'local_merchants',mode:'paid',resources:['player-production'],startAt:'2025-01-01'})
 h.send('AdvanceTime',{date:'2025-01-08'})
 h.send('SetRelayOffer',{businessId:business.id,offerKind:'managed_support',unitPriceFen:6})
 const audience=projectRelay(h.run,h.relay)!.audiences[0]!,offer=projectRelay(h.run,h.relay)!.offers[0]!
 h.send('SignRelayCustomers',{businessId:business.id,audienceId:audience.id,offerId:offer.id,personIds:audience.members.slice(0,1),termEnd:'2025-03-31',mode,creditLimitFen:mode==='postpaid'?500000:0})
 const customer=projectRelay(h.run,h.relay)!.customers[0]!
 if(mode==='prepaid')h.send('RechargeRelayCustomer',{customerId:customer.id,amountFen:55000})
 const beforePeriod=view()
 h.send('StartRelayServicePeriod',{businessId:business.id,customerIds:[customer.id],supplierIds:['cedar-direct'],maxUnits:28,maxSupplierCostFen:10000,supportMode:'guided',resources:['player-production'],startAt:'2025-01-09'})
 const planned=view(),period=projectRelay(h.run,h.relay)!.periods[0]!
 h.send('AdvanceTime',{date:'2025-02-06'})
 const serviceDone=view()
 h.send('AdvanceTime',{date:'2025-02-13'})
 const supportDone=view()
 if(mode==='postpaid')h.send('CollectRelayDue',{customerId:customer.id})
 const collected=view()
 h.send('StartRelayAudit',{periodId:period.id,resources:['player-production'],startAt:'2025-02-14'})
 const auditPlanned=view()
 h.send('AdvanceTime',{date:'2025-02-14'})
 const auditRunning=view()
 h.send('AdvanceTime',{date:'2025-02-17'})
 const auditDone=view()
 h.send('CorrectRelayPeriod',{periodId:period.id})
 return {h,beforePeriod,planned,serviceDone,supportDone,collected,auditPlanned,auditRunning,auditDone,corrected:view()}
}
let frames:ReturnType<typeof displayFrames>
let collectionFrames:ReturnType<typeof displayFrames>
beforeAll(()=>{frames=displayFrames();collectionFrames=displayFrames('postpaid')},30000)
const features=(view:PlayingView)=>view.features as unknown as PlayFeatures
function changed(view:PlayingView,change:(value:PlayFeatures)=>PlayFeatures):PlayingView{
 return {...view,features:{...change(features(view))}}
}
const receipt=(kind:string,previous:PlayingView|null,current:PlayingView)=>savedSceneResult(kind,'原操作',previous,current)

function letterFrames(approved:boolean){
 const source=frames.beforePeriod,base=features(source),application=base.relay!.applications[0]!
 const previous=changed(source,f=>({...f,relay:{...f.relay!,applications:[{...application,read:false,approved:null,expiresAt:null}]}}))
 const current=changed({...source,revision:source.revision+1},f=>({...f,relay:{...f.relay!,applications:[{...application,read:true,approved,expiresAt:approved?'2025-11-30':null}]}}))
 return {previous,current}
}

it('shows the supplier letter only after its actual public read was saved, including its bounded permission',()=>{
 const {previous,current}=letterFrames(true),text=receipt('ReadRelaySupplyDecision',previous,current)
 expect(text).toContain('本局许可获准，有效至2025-11-30');expect(text).toContain('读信没有新增付款或行动')
 expect(text).toContain('原实际适配与启用条件仍须分别核对')
 for(const blocked of [{hasCandidate:true,saveStatus:'unsaved' as const},{saveStatus:'saving' as const},{revision:previous.revision}])expect(receipt('ReadRelaySupplyDecision',previous,{...current,...blocked})).not.toContain('本局许可获准')
})

it('retains a rejected public letter and original costs without inventing permission or a retry date',()=>{
 const {previous,current}=letterFrames(false),text=receipt('ReadRelaySupplyDecision',previous,current)
 expect(text).toContain('此次没有授予本局许可');expect(text).toContain('原已付费用与申请记录保留')
 expect(text).not.toContain('有效至');expect(text).not.toContain('本局许可获准')
})

it('does not announce unread or unchanged letters as newly approved',()=>{
 const {previous,current}=letterFrames(true)
 expect(receipt('ReadRelaySupplyDecision',previous,{...previous,revision:current.revision})).not.toContain('回信写着')
 expect(receipt('ReadRelaySupplyDecision',current,{...current,revision:current.revision+1})).not.toContain('回信写着')
 expect(receipt('ReadRelaySupplyDecision',null,current)).not.toContain('回信写着')
})

it('shows the real collected receivable as cash without recognizing its original income twice',()=>{
 const before=features(collectionFrames.supportDone).relay!,after=features(collectionFrames.collected).relay!,customer=before.customers[0]!
 expect(customer.dueReceivableFen).toBeGreaterThan(0)
 expect(after.businesses[0]!.funds.cashFen-before.businesses[0]!.funds.cashFen).toBe(customer.dueReceivableFen)
 expect(after.customers[0]!.balance.recognizedIncomeFen).toBe(customer.balance.recognizedIncomeFen)
 const amount=(customer.dueReceivableFen/100).toLocaleString('en-US',{maximumFractionDigits:2})
 const text=receipt('CollectRelayDue',collectionFrames.supportDone,collectionFrames.collected)
 expect(text).toContain('客户1的原应收实际到账¥'+amount);expect(text).toContain('未到期的原应收仍留在原账')
 expect(after.customers[0]!.balance.receivableFen).toBeGreaterThan(0)
})

it('does not claim collection from an unchanged receipt, wrong cash delta or newly recognized income',()=>{
 const before=collectionFrames.supportDone,after=collectionFrames.collected
 expect(receipt('CollectRelayDue',after,{...after,revision:after.revision+1})).not.toContain('原应收实际到账')
 const noCash=changed(after,f=>({...f,relay:{...f.relay!,businesses:f.relay!.businesses.map((b,i)=>({...b,funds:{...b.funds,cashFen:features(before).relay!.businesses[i]!.funds.cashFen}}))}}))
 expect(receipt('CollectRelayDue',before,noCash)).not.toContain('原应收实际到账')
 const newIncome=changed(after,f=>({...f,relay:{...f.relay!,customers:f.relay!.customers.map(c=>({...c,balance:{...c.balance,recognizedIncomeFen:c.balance.recognizedIncomeFen+1}}))}}))
 expect(receipt('CollectRelayDue',before,newIncome)).not.toContain('原应收实际到账')
 expect(receipt('CollectRelayDue',before,{...after,hasCandidate:true,saveStatus:'unsaved'})).not.toContain('原应收实际到账')
})

it('captures the exact customer, due amount, original contract and remaining future receivable in confirmation',()=>{
 const before=collectionFrames.supportDone,relay=features(before).relay!,customer=relay.customers[0]!,command={runId:before.runId,actorId:'player',commandId:'collect-display',expectedRevision:before.revision,kind:'CollectRelayDue',payload:{customerId:customer.id}}
 const render=()=>renderToStaticMarkup(createElement(RelayCommandDetails,{command,relay,workers:[],accountName:()=> '原中转站'})),html=render()
 expect(html).toContain('收好客户1的这笔原回款');expect(html).toContain('原中转站将收取已经到期的原应收')
 expect(html).toContain(customer.signedAt+'—'+customer.termEnd);expect(html).toContain('尚未到期，继续留在原账')
 expect(html).toContain('回款不重复确认收入');expect(render()).toBe(html)
 expect(features(collectionFrames.collected).relay!.customers[0]!.dueReceivableFen).toBe(0)
})

it('identifies the newly planned public period without treating a reservation as revenue or payment',()=>{
 const text=receipt('StartRelayServicePeriod',frames.beforePeriod,frames.planned)
 expect(text).toContain('服务单已经安排：2025-01-09—2025-02-06，1位原客户')
 expect(text).toContain('原支持另在2025-02-06—2025-02-13')
 expect(text).toContain('只是预留，不是收入或回款')
 expect(features(frames.planned).relay!.periods[0]!.job!.status).toBe('planned')
})

it('distinguishes a future audit reservation from its actual paid start using the bound public account',()=>{
 const planned=receipt('StartRelayAudit',frames.supportDone,frames.auditPlanned)
 expect(planned).toContain('2025-02-14—2025-02-17')
 expect(planned).toContain('开工季度预留1点、自有资金预留¥100，尚未开工支付')
 expect(planned).not.toContain('实际支付')
 const running=receipt('StartRelayAudit',frames.supportDone,frames.auditRunning)
 expect(running).toContain('实际支付¥100、使用开工季度1点')
 expect(running).toContain('完成前不提前揭示实计用量')
})

it('does not invent audit payment when its actual public cost or account mapping is missing',()=>{
 const running=features(frames.auditRunning).relay!.auditJobs[0]!.job!
 const missingCost=changed(frames.auditRunning,f=>({...f,workbench:{...f.workbench,
  finance:f.workbench.finance.map(row=>({...row,metrics:row.metrics.filter(metric=>metric.referenceId!==running.actionId)}))}}))
 expect(receipt('StartRelayAudit',frames.supportDone,missingCost)).not.toContain('复核委托已经寄出')
 const missingBusiness=changed(frames.auditRunning,f=>({...f,relay:{...f.relay!,businesses:[]}}))
 expect(receipt('StartRelayAudit',frames.supportDone,missingBusiness)).not.toContain('复核委托已经寄出')
})

it('announces only newly completed audit work and leaves the separate correction decision open',()=>{
 const text=receipt('AdvanceTime',frames.auditRunning,frames.auditDone)
 expect(text).toContain('2025-02-17，1份独立复核已实际完成，28条原计量已有本次结果')
 expect(text).toContain('差额仍须另行确认更正')
 expect(text).not.toContain('已经到账')
 const stillRunning=receipt('AdvanceTime',frames.auditPlanned,frames.auditRunning)
 expect(stillRunning).not.toContain('独立复核已实际完成')
})

it('keeps service ending, original support completion and reported usage distinct',()=>{
 const service=receipt('AdvanceTime',frames.planned,frames.serviceDone)
 const reported=features(frames.serviceDone).relay!.periods[0]!.reportedUnits
 expect(service).toContain(`1段计量周期已经结束，累计报告用量${reported}`)
 expect(service).toContain('报告不代替独立实计')
 expect(service).not.toContain('原支持已实际完成')
 const support=receipt('AdvanceTime',frames.serviceDone,frames.supportDone)
 expect(support).toContain('1段原支持已实际完成')
 expect(support).toContain('完成不等于客户已经付款')
 expect(support).not.toContain('计量周期已经结束')
})

it('preserves all newly completed public jobs when one clock advance spans both service and support',()=>{
 const text=receipt('AdvanceTime',frames.planned,frames.supportDone)
 expect(text).toContain('1段原支持已实际完成')
 expect(text).toContain('1段计量周期已经结束')
 expect(text).toContain('累计报告用量')
 expect(text).not.toContain('成功服务')
})

it('uses added correction IDs with original public meter and audit references without claiming cash collection',()=>{
 const before=features(frames.auditDone).relay!,after=features(frames.corrected).relay!
 expect(before.corrections).toHaveLength(0)
 expect(after.corrections).toHaveLength(28)
 for(const correction of after.corrections){
  expect(before.meters.some(meter=>meter.id===correction.meterId)).toBe(true)
  expect(before.audits.some(audit=>audit.id===correction.auditId&&audit.completedAt!==null)).toBe(true)
 }
 const text=receipt('CorrectRelayPeriod',frames.auditDone,frames.corrected)
 expect(text).toContain('已按28条原计量追加更正记录')
 expect(text).toContain('原报告与价格仍保留')
 expect(text).toContain('不代表现金已经到账，应收应付继续按原账处理')
})

it('does not call an unchanged old correction or completion a new event',()=>{
 const later={...frames.corrected,revision:frames.corrected.revision+1}
 expect(receipt('CorrectRelayPeriod',frames.corrected,later)).not.toContain('已按')
 expect(receipt('AdvanceTime',frames.corrected,later)).not.toContain('已实际完成')
 expect(receipt('StartRelayAudit',frames.corrected,later)).not.toContain('复核委托已经')
 expect(receipt('StartRelayServicePeriod',frames.corrected,later)).not.toContain('服务单已经安排')
})

it('requires the same life and a saved newer state for relay-specific receipts',()=>{
 for(const current of [
  {...frames.planned,runId:'another-life'},
  {...frames.planned,revision:frames.beforePeriod.revision},
  {...frames.planned,saveStatus:'unsaved' as const,hasCandidate:true},
  {...frames.planned,saveStatus:'saving' as const},
 ])expect(receipt('StartRelayServicePeriod',frames.beforePeriod,current)).not.toContain('服务单已经安排')
 expect(receipt('StartRelayServicePeriod',null,frames.planned)).not.toContain('服务单已经安排')
})

it('does not report cancelled or interrupted support as completed',()=>{
 for(const status of ['cancelled','interrupted'] as const){
  const stopped=changed(frames.supportDone,f=>({...f,relay:{...f.relay!,periods:f.relay!.periods.map(period=>({...period,
   supportJob:period.supportJob?{...period.supportJob,status}:null}))}}))
  expect(receipt('AdvanceTime',frames.serviceDone,stopped)).not.toContain('原支持已实际完成')
 }
})

it('keeps first-order, pause and independent story-letter priorities ahead of relay completions',()=>{
 const paid=changed(frames.auditDone,f=>({...f,firstOrder:{...f.firstOrder,result:{...f.firstOrder.result,paymentFen:130000,directCostFen:50000,netOrderFen:80000}}}))
 expect(receipt('AdvanceTime',frames.auditRunning,paid)).toContain('客户实际付来了¥1,300')
 const awaiting=changed(frames.auditDone,f=>({...f,firstOrder:{...f.firstOrder,status:'awaiting_submission'}}))
 expect(receipt('AdvanceTime',frames.auditRunning,awaiting)).toContain('由你亲手交给客户')
 const paused=changed(frames.auditDone,f=>({...f,workbench:{...f.workbench,
  pause:{instanceId:'public-pause',reason:'CASH_SHORTFALL',source:'command'},progression:{...f.workbench.progression,barrierLabel:'原现金缺口仍待核对'}}}))
 expect(receipt('AdvanceTime',frames.auditRunning,paused)).toContain('日子在这里停了一下。原现金缺口仍待核对')
 const job={...createPublicRiskInvestigation({status:'completed'}),entityId:'public-incident',actionId:'public-investigation',releasedAt:null}
 const letter=changed(frames.auditDone,f=>({...f,story:{...f.story,jobs:[job]}}))
 expect(receipt('AdvanceTime',frames.auditRunning,letter)).toContain('独立回信到了')
 expect(receipt('AdvanceTime',frames.auditRunning,letter)).not.toContain('28条原计量')
})

it('uses only public reported data and leaves the display inputs and original fixture bytes untouched',()=>{
 const before=JSON.stringify({previous:frames.planned,current:frames.serviceDone}),raw=frames.h.codec.export(frames.h.run)
 const original=receipt('AdvanceTime',frames.planned,frames.serviceDone)
 const extra=changed(frames.serviceDone,f=>({...f,relay:{...f.relay!,meters:f.relay!.meters.map(meter=>Object.assign({},meter,
  {unpublishedActualUnits:999999,unpublishedFutureFault:'unrelated-hidden-sentinel'}))}}))
 expect(receipt('AdvanceTime',frames.planned,extra)).toBe(original)
 expect(JSON.stringify({previous:frames.planned,current:frames.serviceDone})).toBe(before)
 expect(frames.h.codec.export(frames.h.run)).toBe(raw)
})
