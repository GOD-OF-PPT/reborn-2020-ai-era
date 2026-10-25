import {afterAll,beforeAll,expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {resolveRelaySceneTarget,type RelaySceneTarget} from './relay-scene-target.ts'
import {relayJourneyAction} from './relay-journey.ts'
import {relayPaperFor,relayMoneyFor} from './relay-continuity.ts'
import {relayBusinessTarget,relayFocusFor,relayFocusOpen,relayFocusResultDate,relayPlayerScene} from './relay-player-thread.ts'
import {relaySceneProgress} from './relay-scene-progress.ts'
import {relayReviewDate,relayReviewLabel,relayDeferredFeedback} from './relay-scene-clock.ts'
import {todayThread} from './today-thread.ts'
import {dayPerspectiveCurrent} from './day-perspective.ts'
import beforeOpen from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0065.json?raw'
import beforeCustomers from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0080.json?raw'
import unread from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0071.json?raw'
import serviceReady from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0091.json?raw'
import planned from '../../goal-1/evidence/t17-acceptance-27/chrome-main-r1/main-saved92-service-planned.json?raw'
import closed from '../../goal-1/evidence/t17-acceptance-27/chrome-normal-r5/normal-saved118-closed-period.json?raw'
import teaching from '../../goal-1/evidence/t17-acceptance-32/chrome-main-r8/r8-saved97-original-backup.json?raw'
import settling from '../../goal-1/evidence/t17-acceptance-27/chrome-main-r1/main-saved116-original-period-settled.json?raw'
import midServiceDue from '../../goal-1/evidence/t17-acceptance-33/chrome-main-r1/r4-saved83-mid-service-first-original-due.json?raw'

// Frozen normal histories are inputs, not new browser actions or this task's acceptance.
const fixtures:Record<string,{p:GamePanelProps;store:IndexedDbRunStore}>={}
for(const [name,raw] of Object.entries({beforeOpen,beforeCustomers,unread,serviceReady,planned,closed,teaching,settling,midServiceDue}))beforeAll(async()=>{
  const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'relay-journey-'+name})
  let id=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++id)})
  await controller.initialize();await controller.importNew(raw)
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,business=features.relay?.businesses[0]
  fixtures[name]={p:{controller,view,features,accountId:business?.accountId??'personal',request:()=>{throw Error('READ_ONLY_PROJECTION_CALLED_A_COMMAND')}},store}
})
afterAll(async()=>{for(const {p,store} of Object.values(fixtures)){await p.controller.close();await store.close()}})
const target=(p:GamePanelProps)=>relayBusinessTarget(p,p.features.relay!.businesses[0]!.id)!
const periodTarget=(p:GamePanelProps):Omit<Extract<RelaySceneTarget,{kind:'period'}>,'jobId'|'meterId'>=>({...target(p),kind:'period',periodId:p.features.relay!.periods[0]!.id})

it('starts with explicit capital and fails closed on an unrelated owner, without changing the saved life',()=>{
 const {p}=fixtures.beforeOpen!,raw=p.controller.exportSaved()
 expect(relayJourneyAction({...p,accountId:'personal'},null).intent).toBe('open')
 const original=target(fixtures.beforeCustomers!.p)
 expect(relayJourneyAction(fixtures.beforeCustomers!.p,{...original,accountId:'personal'}).intent).toBe('objects')
 expect(relayJourneyAction(p,undefined).intent).toBe('objects')
 expect(p.controller.exportSaved()).toBe(raw)
})

it('offers actual prospects with an explicitly selected quote, and keeps missing technical work independent of video or courses',()=>{
 const {p}=fixtures.beforeCustomers!,t=target(p),raw=p.controller.exportSaved()
 expect(relayJourneyAction(p,t).intent).toBe('customers')
 const display={...p,features:{...p.features,relay:{...p.features.relay!,technicallyReady:false,businesses:p.features.relay!.businesses.map(b=>({...b,lifecycle:'preparing' as const}))}}}
 // Public display variant only; no fabricated business state is submitted or saved.
 expect(relayJourneyAction(display,t).intent).toBe('basics')
 expect(relayJourneyAction(display,t).caption).not.toMatch(/先经营视频|先开班/)
 expect(p.controller.exportSaved()).toBe(raw)
})

it('keeps the actual audience identity while its scene asks for the next customer decision and retains the original demand record',()=>{
 const {p}=fixtures.beforeCustomers!,audience=p.features.relay!.audiences.find(a=>a.completedAt!==null)!,raw=p.controller.exportSaved()
 const t:RelaySceneTarget={...target(p),kind:'audience',audienceId:audience.id},scene=relayPlayerScene(p,relayFocusFor(p,t))
 expect(scene.title).toBe('这次，愿意答应哪些客户？')
 expect(scene.detail).toContain(audience.members.length+'位公开潜客')
 expect(scene.inspect?.target?.relayTarget).toEqual(t)
 expect(p.controller.exportSaved()).toBe(raw)
})

it('keeps planned service and its future support visually distinct, without exposing unaudited actual units',()=>{
 const {p}=fixtures.planned!,t=periodTarget(p),raw=p.controller.exportSaved(),art=relayPaperFor(p,t)!
 expect(art.phase).toBe('service');expect(art.state).toBe('planned');expect(art.support).toBe('planned')
 expect(art.supportLabel).toContain('原支持')
 expect(JSON.stringify(art)).not.toContain('auditedUnits')
 expect(relayMoneyFor(p,t)).toContain('客户未消费保护')
 expect(relayPaperFor(p,{...t,runId:'other-life'})).toBeUndefined()
 expect(p.controller.exportSaved()).toBe(raw)
})

it('keeps an unsealed-to-the-player supply result in ongoing obligations until it is actually read',()=>{
 const {p}=fixtures.unread!,a=p.features.relay!.applications.find(a=>!a.read&&a.job?.status==='completed')!
 expect(a).toBeDefined()
 const t:RelaySceneTarget={...target(p),kind:'application',applicationId:a.id},f=relayFocusFor(p,t)
 expect(relayFocusOpen(p,f)).toBe(true);expect(relayFocusResultDate(p,f)).toBeNull()
 expect(relayPaperFor(p,t)).toMatchObject({phase:'permission',state:'unread'})
 expect(todayThread(p,f)!.ongoing.some(item=>item.focus.kind==='relay'&&item.focus.relayTarget?.kind==='application'&&item.focus.relayTarget.applicationId===a.id)).toBe(true)
})

it('takes a funded original customer to the next service decision instead of asking for repeated recharge',()=>{
 const {p}=fixtures.serviceReady!,c=p.features.relay!.customers.find(c=>c.mode==='prepaid'&&c.balance.prepaidFen>0)!
 expect(c).toBeDefined()
 expect(relayJourneyAction(p,{...target(p),kind:'customer',customerId:c.id}).intent).toBe('next')
})

it('uses closed-period receipts as results and keeps that same original object reachable from Today',()=>{
 const {p}=fixtures.closed!,t=periodTarget(p),raw=p.controller.exportSaved(),progress=relaySceneProgress(p.features.relay,p.view.date,t,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})!
 expect(progress.phase).toBe('period-closed')
 expect(p.view.receipts.at(-1)?.kind).toBe('CollectRelayDue')
 expect(relayPaperFor(p,t)).toMatchObject({phase:'result',state:'received',support:'completed'})
 expect(relayPaperFor(p,t)?.line).toContain('本期按原账结束')
 expect(relayPaperFor(p,t)?.paymentLabel).toContain('本次收到本期原单')
 // A receipt alone must not announce that unreviewed records are finished.
 // This is an explicit public display policy variant, never saved as a history.
 const unreviewed={...p,features:{...p.features,relay:{...p.features.relay!,audits:[]}}}
 expect(relayPaperFor(unreviewed,t)?.line).toContain('记录仍待独立复核')
 expect(relayPaperFor(unreviewed,t)?.line).not.toContain('本期按原账结束')
 expect(relayJourneyAction(p,t).intent).toBe('next')
 const today=todayThread(p,relayFocusFor(p,t))!
 expect(today.primary.supported).toBe(true);expect(today.primary.classification).toBe('result')
 expect(today.primary.thread.focus).toMatchObject({kind:'relay',relayTarget:t})
 expect(p.controller.exportSaved()).toBe(raw)
})

it('renders a selected historical support job and meter as their own records rather than the current whole-period phase',()=>{
 const {p}=fixtures.closed!,t=periodTarget(p),period=p.features.relay!.periods[0]!,meter=p.features.relay!.meters.find(m=>m.periodId===period.id)!
 expect(relayPaperFor(p,{...t,jobId:period.supportJobId})).toMatchObject({phase:'service',state:'ended',support:'completed',historical:true})
 const art=relayPaperFor(p,{...t,meterId:meter.id})!
 expect(art.phase).toBe('audit');expect(art.dateLabel).toBe(meter.date)
 expect(art.line).toContain('这条原报告')
})

it('keeps a saved parallel teaching promise on its conservative public review date without imposing daily stops on a relay-only life',()=>{
 const p=fixtures.teaching!.p,w=p.features.workbench
 expect(relayReviewDate(p,'2023-03-31')).toBe(w.progression.nextDate)
 const relayOnly=fixtures.planned!.p
 expect(relayReviewDate(relayOnly,'2024-07-31')).toBe('2024-07-31')
 expect(relayReviewDate(relayOnly,null)).toBeNull()
})

it('leaves Today for an actually saved relay promise, while an unchanged reading keeps Today',()=>{
 const {p}=fixtures.planned!,perspective={runId:p.view.runId,revision:p.view.revision-1}
 expect(dayPerspectiveCurrent(p.view,perspective)).toBe(false)
 expect(dayPerspectiveCurrent(p.view,{runId:p.view.runId,revision:p.view.revision})).toBe(true)
})

it('stops at an already disclosed original invoice date without creating daily metering clicks or changing the saved life',()=>{
 const {p}=fixtures.settling!,raw=p.controller.exportSaved()
 expect(p.view.date).toBe('2025-03-18')
 expect(relayReviewDate(p,'2025-03-31')).toBe('2025-03-21')
 // r116's latest original receipt really collected an earlier invoice. Both
 // that actual receipt and the remaining future original invoice must be shown.
 expect(relayPaperFor(p,periodTarget(p))).toMatchObject({phase:'result',state:'received'})
 expect(relayPaperFor(p,periodTarget(p))?.paymentLabel).toContain('原单未收 ¥12.12')
 const noNewReceipt={...p,view:{...p.view,receipts:[]}}
 expect(relayPaperFor(noNewReceipt,periodTarget(p))).toMatchObject({phase:'result',state:'receivable'})
 expect(relayPaperFor(noNewReceipt,periodTarget(p))?.paymentLabel).toContain('本期原单未收 ¥12.12')
 expect(relayReviewDate(p,'2025-03-20')).toBe('2025-03-20')
 expect(relayReviewLabel(p,'2025-03-21','等服务结束')).toBe('等已知客户原单到期')
 expect(relayReviewLabel(p,'2025-03-20','等服务结束')).toBe('等服务结束')
 expect(p.controller.exportSaved()).toBe(raw)
})

it('lets a player defer collection until the same active service feedback while retaining original invoices and clock barriers',()=>{
 const {p}=fixtures.midServiceDue!,t=periodTarget(p),raw=p.controller.exportSaved()
 expect(p.view.date).toBe('2024-10-23')
 expect(relaySceneProgress(p.features.relay,p.view.date,t,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})?.command?.kind).toBe('CollectRelayDue')
 expect(relayDeferredFeedback(p,t)).toEqual({date:'2024-11-06',label:'先继续原服务，待收款仍保留'})
 // Public policy variant only: a parallel class retains a disclosed earlier
 // review date. This is not a combined saved history or a newly taught class.
 const teachingView={...p,features:{...p.features,course:fixtures.teaching!.p.features.course,workbench:{...p.features.workbench,progression:{...p.features.workbench.progression,nextDate:'2024-10-24'}}}}
 expect(relayDeferredFeedback(teachingView,t)).toEqual({date:'2024-10-24',label:'先到原日历停点，待收款仍保留'})
 expect(relayDeferredFeedback(p,{...t,accountId:'personal'})).toBeNull()
 expect(relayDeferredFeedback({...p,features:{...p.features,workbench:{...p.features.workbench,progression:{...p.features.workbench.progression,requiresDelivery:true}}}},t)).toBeNull()
 expect(relayDeferredFeedback(fixtures.closed!.p,periodTarget(fixtures.closed!.p))).toBeNull()
 expect(p.controller.exportSaved()).toBe(raw)
})

it('keeps the same zero-balance customer on Next after stopping, pausing new contracts or pausing traffic',()=>{
 const {p}=fixtures.serviceReady!,base=target(p),customer=p.features.relay!.customers.find(row=>row.businessId===base.businessId&&row.mode==='prepaid'&&row.closedAt===null)!,t:RelaySceneTarget={...base,kind:'customer',customerId:customer.id},raw=p.controller.exportSaved()
 expect(customer).toBeDefined();expect(customer.termEnd>=p.view.date).toBe(true)
 // Complete public display-policy variants of the canonical fixture only.
 // They are not new saved Stop/Pause/refund histories or finance acceptance.
 const display=(lifecycle:'operating'|'paused'|'winding_down',trafficPaused:boolean):GamePanelProps=>{
  const relay={...p.features.relay!,businesses:p.features.relay!.businesses.map(row=>row.id===base.businessId?{...row,lifecycle}:row),stations:p.features.relay!.stations.map(row=>row.id===base.stationId?{...row,trafficPaused}:row),customers:p.features.relay!.customers.map(row=>row.id===customer.id?{...row,balance:{...row.balance,prepaidFen:0}}:row)}
  const features={...p.features,relay,workbench:{...p.features.workbench,routes:p.features.workbench.routes.map(row=>row.businessId===base.businessId?{...row,lifecycle}:row)}}
  return {...p,features,view:{...p.view,features:{...p.view.features,relay,workbench:features.workbench},operations:{...p.view.operations!,businesses:p.view.operations!.businesses.map(row=>row.id===base.businessId?{...row,lifecycle}:row)}}}
 }
 expect(relayJourneyAction(display('operating',false),t).intent).toBe('customer-funds')
 for(const variant of [display('paused',false),display('winding_down',true),display('operating',true)]){
  const resolved=resolveRelaySceneTarget(variant.features.relay,t,{runId:variant.view.runId,accountId:variant.accountId,operations:variant.view.operations}),action=relayJourneyAction(variant,t)
  expect(resolved.status).toBe('valid');expect(resolved.target).toBe(t)
  expect(action.intent).toBe('next');expect(action.command).toBeUndefined()
  expect(action.caption).toContain('余额、资产与欠款保留')
  expect(relayFocusFor(variant,t)).toMatchObject({runId:p.view.runId,accountId:base.accountId,entityId:customer.id,relayTarget:t})
 }
 expect(p.controller.exportSaved()).toBe(raw)
})
