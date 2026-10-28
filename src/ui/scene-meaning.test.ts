import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {courseFocusFor} from './course-player-thread.ts'
import {relayBusinessTarget,relayFocusFor} from './relay-player-thread.ts'
import {openingFocusFor,playerThread} from './player-thread.ts'
import {seasonRecollection} from './season-thread.ts'
import {sceneMeaning,seasonMeaning} from './scene-meaning.ts'
import {moneyText} from './game-text.ts'
import readyRaw from '../../goal-1/evidence/t17-acceptance-34/chrome-final-sample-r2/r2-saved86-current-final-preview.json?raw'
import promisedRaw from '../../goal-1/evidence/t17-acceptance-32/chrome-main-r8/r8-saved97-original-backup.json?raw'
import lateRaw from '../../goal-1/evidence/t17-acceptance-32/chrome-main-r8/r8-saved98-late-update-observed.json?raw'
import closedRaw from '../../goal-1/evidence/t17-acceptance-34/chrome-production-r1/r1-saved120-after-saveexit-reload-continue.json?raw'
import relayRaw from '../../goal-1/evidence/t17-acceptance-34/chrome-final-service-r2/r2-saved85-current-separate-record-entries.json?raw'
import firstRaw from '../../goal-1/evidence/t17-acceptance-29/chrome-atomic/atomic-before-life-r6.json?raw'
import workRaw from '../../goal-1/evidence/t17-acceptance-29/chrome-main/work-r10-after-return-today-r2.json?raw'
import lifeRaw from '../../goal-1/evidence/t17-acceptance-29/chrome-resume/market-sale-paid-r28.json?raw'

/** Existing complete saved histories are display inputs, not newly played outcomes. */
async function original(name:string,raw:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'meaning-'+name})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++sequence)})
 await controller.initialize();await controller.importNew(raw)
 const p=(accountId='personal'):GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId,request:vi.fn()}}
 return {p,controller,close:async()=>{await controller.close();await store.close()}}
}
type Fixture=Awaited<ReturnType<typeof original>>

describe('a public scene connects an actual choice with the next part of life',()=>{
 let ready:Fixture,promised:Fixture,late:Fixture,closed:Fixture,relay:Fixture,first:Fixture,work:Fixture,life:Fixture
 beforeAll(async()=>{ready=await original('ready',readyRaw)})
 beforeAll(async()=>{promised=await original('promised',promisedRaw)})
 beforeAll(async()=>{late=await original('late',lateRaw)})
 beforeAll(async()=>{closed=await original('closed',closedRaw)})
 beforeAll(async()=>{relay=await original('relay',relayRaw)})
 beforeAll(async()=>{first=await original('first',firstRaw)})
 beforeAll(async()=>{work=await original('work',workRaw)})
 beforeAll(async()=>{life=await original('life',lifeRaw)})
 afterAll(async()=>{for(const f of [ready,promised,late,closed,relay,first,work,life])await f?.close()})
 const course=(f:Fixture,cohort=false)=>{
  const base=f.p(),c=base.features.course!.courses[0]!,co=base.features.course!.cohorts[0]
  const focus=courseFocusFor(base,cohort?{kind:'cohort',businessId:c.businessId,courseId:c.id,cohortId:co!.id}:{kind:'course',businessId:c.businessId,courseId:c.id})
  const p=f.p(focus.accountId)
  return {p,thread:playerThread(p,focus),c,co}
 }
 it('distinguishes actual readiness from a student promise in the same year and wish, without changing either saved history',()=>{
  const a=course(ready),b=course(promised,true),oldA=ready.controller.exportSaved(),oldB=promised.controller.exportSaved()
  expect(a.p.view.playerProfile).toEqual(b.p.view.playerProfile)
  expect(a.p.view.date.slice(0,4)).toBe(b.p.view.date.slice(0,4))
  const before=sceneMeaning(a.p,a.thread)!,after=sceneMeaning(b.p,b.thread)!
  expect(before.title).toContain('样课');expect(before.situation).toContain('还没有班期')
  expect(before.question).toContain('了解谁可能需要');expect(before.situation).not.toContain('意向')
  expect(b.thread.stage).toBe('course-stage-planned');expect(after.title).toBe('这一段，已经留在日历。');expect(after.situation).toContain('2023-01-16班')
  expect(after.question).toContain('教学和自己');expect(after.sourceRefs.some(ref=>ref.kind==='cohort'&&ref.id===b.co!.id)).toBe(true)
  expect(ready.controller.exportSaved()).toBe(oldA);expect(promised.controller.exportSaved()).toBe(oldB)
 })
 it('does not borrow a later closure to promise that the original late-update class can still finish',()=>{
  const a=course(late,true),b=course(closed,true),before=late.controller.exportSaved(),lateMeaning=sceneMeaning(a.p,a.thread)!,done=sceneMeaning(b.p,b.thread)!
  expect(a.p.view.runId).toBe(b.p.view.runId)
  expect(lateMeaning.title).toContain('来不及');expect(lateMeaning.question).toContain('退款收尾')
  expect(lateMeaning.situation).not.toContain('已经收好');expect(lateMeaning.sourceRefs.some(ref=>ref.kind==='course-update')).toBe(true)
  expect(done.title).toContain('收好了');expect(done.situation).toContain('2023-04-30')
  expect(done.situation).toContain('¥199');expect(done.question).toContain('生活')
  expect(late.controller.exportSaved()).toBe(before)
 })
 it('keeps existing cohorts visible when revisiting their ready sample rather than saying no learner was ever promised',()=>{
  const d=course(closed),m=sceneMeaning(d.p,d.thread)!
  expect(m.situation).toContain('已有实际班期记录');expect(m.situation).not.toContain('还没有班期')
  expect(m.question).toContain('先了解谁可能需要这堂课');expect(m.question).not.toContain('先回访原班')
  expect(m.sourceRefs.some(ref=>ref.kind==='cohort'&&ref.id===d.co!.id)).toBe(true)
  const ongoing=course(promised),current=sceneMeaning(ongoing.p,ongoing.thread)!
  expect(current.situation).toContain('原教学、支持与退款仍须');expect(current.question).toBe(m.question)
 })
 it('calls student refund totals recorded refunds even when a bounded public variant still has a payable',()=>{
  const d=course(closed,true),before=closed.controller.exportSaved(),co=d.co!
  // Public display policy only; this is not codec-sealed or a newly closed game history.
  const unpaid={id:'display-only:refund-payable',accountId:d.p.accountId,businessId:d.c.businessId,contractId:co.id,counterpartyId:'world',date:d.p.view.date,sourceEventId:co.id,originOperationId:'display-only:refund-operation',kind:'refund_delivered' as const,amountFen:19900,remainingFen:19900,protectionReservationId:null}
  const features={...d.p.features,workbench:{...d.p.features.workbench,finance:d.p.features.workbench.finance.map(account=>account.accountId===d.p.accountId?{...account,obligations:[...account.obligations,unpaid]}:account)}}
  const p={...d.p,features},m=sceneMeaning(p,d.thread)!
  expect(m.situation).toContain('已记退款');expect(m.situation).toContain('实付与待付仍看原账')
  expect(m.situation).not.toContain('实际退款');expect(m.situation).not.toContain('全部实付')
  expect(features.workbench.finance.find(account=>account.accountId===p.accountId)!.obligations.some(row=>row.id===unpaid.id&&row.remainingFen===19900)).toBe(true)
  expect(closed.controller.exportSaved()).toBe(before)
 })
 it('uses the original period invoices, keeping support, actual collection and future money separate',()=>{
  const base=relay.p(),v=base.features.relay!,period=v.periods[0]!,identity=relayBusinessTarget(base,period.businessId)!
  const focus=relayFocusFor(base,{...identity,kind:'period',periodId:period.id}),p=relay.p(focus.accountId),before=relay.controller.exportSaved()
  const m=sceneMeaning(p,playerThread(p,focus))!
  expect(m.situation).toContain('180.64');expect(m.situation).toContain('19.36');expect(m.situation).toContain('当前无到期待收')
  expect(m.situation).toContain('2024-11-13');expect(m.question).toContain('原单到期')
  expect(m.sourceRefs.some(ref=>ref.kind==='period'&&ref.id===period.id)).toBe(true)
  expect(relay.controller.exportSaved()).toBe(before)
 })
 it('includes a same-period correction invoice at its new due date, excludes an unrelated period and rejects a contradictory source',()=>{
  const base=relay.p(),v=base.features.relay!,period=v.periods[0]!,meter=v.meters.find(row=>row.periodId===period.id)!,identity=relayBusinessTarget(base,period.businessId)!,focus=relayFocusFor(base,{...identity,kind:'period',periodId:period.id}),p=relay.p(focus.accountId)
  const correction={id:'display-only:correction',meterId:meter.id,auditId:'display-only:audit',date:p.view.date,originalReportedUnits:meter.reportedUnits,correctUnits:meter.reportedUnits+25,customerDeltaFen:25*meter.unitPriceFen,supplierDeltaFen:25*meter.unitCostFen,operationIds:['display-only:credit','display-only:supplier-correction']}
  const invoice={id:'display-only:corrected-invoice',customerId:meter.customerId,sourceId:meter.id,date:p.view.date,dueAt:'2024-11-20',operationId:correction.operationIds[0]!,amountFen:correction.customerDeltaFen,collectedFen:0,reversedFen:0}
  const unrelated={...invoice,id:'display-only:other-period-invoice',sourceId:'display-only:other-period',operationId:'display-only:other-credit',amountFen:99900}
  // Complete source relations in a bounded public projection variant, never a submitted game state.
  const projected={...v,meters:v.meters.map(row=>row.id===meter.id?{...row,correctionId:correction.id,auditedUnits:correction.correctUnits}:row),corrections:[...v.corrections,correction],receivables:[...v.receivables,invoice,unrelated]}
  const variant={...p,features:{...p.features,relay:projected}},m=sceneMeaning(variant,playerThread(p,focus))!
  expect(m.situation).toContain('未到期'+moneyText(1936+correction.customerDeltaFen));expect(m.situation).toContain('当前无到期待收')
  expect(m.sourceRefs.some(row=>row.kind==='receivable'&&row.id===invoice.id&&row.date===p.view.date)).toBe(true)
  expect(m.sourceRefs.some(row=>row.id===unrelated.id)).toBe(false)
  const inconsistent={...variant,features:{...variant.features,relay:{...projected,receivables:projected.receivables.map(row=>row.id===invoice.id?{...row,sourceId:unrelated.sourceId}:row)}}}
  expect(sceneMeaning(inconsistent,playerThread(p,focus))).toBeNull()
 })
 it('uses the actual first payment as a transition to a new explicit life choice, not a salary or another free commission',()=>{
  const p=first.p(),focus=openingFocusFor(p,'quarter',{recordId:p.features.firstOrder.contractId!})!,m=sceneMeaning(p,playerThread(p,focus))!
  expect(m.situation).toContain('¥1,300');expect(m.situation).toContain('¥500');expect(m.situation).toContain('¥800')
  expect(m.question).toContain('工作和生活');expect(p.request).not.toHaveBeenCalled()
 })
 it('keeps the old work quarter as history and counts only its own real payroll',()=>{
  const p=work.p(),period=p.view.operations!.employment[0]!,focus=openingFocusFor(p,'quarter',{recordId:period.id})!,thread=playerThread(p,focus),m=sceneMeaning(p,thread)!
  expect(thread.focusScope).toBe('history');expect(m.title).toContain('原季度');expect(m.situation).toContain('24,000')
  expect(m.situation).toContain('不续约');expect(m.sourceRefs.filter(ref=>ref.kind==='payroll')).toHaveLength(3)
 })
 it('keeps a cross-quarter life result current and a running carry unfinished',()=>{
  const p=life.p(),job=p.features.life.jobs.find(job=>job.kind==='workspace')!,focus=openingFocusFor(p,'life',{lifeSelection:'workspace',recordId:job.id})!,thread=playerThread(p,focus)
  const current=sceneMeaning(p,thread)!
  // It began in Q2, but its July 2 result still belongs to the current Q3.
  expect(thread.focusScope).toBe('current');expect(current.title).toContain('真正给生活留了时间')
  expect(current.situation).toContain('2020-07-02实际完成');expect(current.situation).toContain('不返还行动')
  // Bounded public display variant only; not submitted, imported or called a game outcome.
  const features={...p.features,life:{...p.features.life,jobs:p.features.life.jobs.map(row=>row.id===job.id?{...row,status:'running' as const}:row)}}
  const carry={...p,features,view:{...p.view,date:'2020-07-01'}},carryThread={...thread,focusScope:'carry' as const}
  const m=sceneMeaning(carry,carryThread)!
  expect(m.title).toContain('上季');expect(m.situation).toContain('尚未完成');expect(m.situation).not.toContain('实际完成')
 })
 it('reads the same original life job as history after real later-quarter progression',async()=>{
  const jobId=life.p().features.life.jobs.find(job=>job.kind==='workspace')!.id,later=await original('life-later-history',lifeRaw)
  try{
   for(let step=0;step<12&&later.p().view.date<'2020-10-01';step++){
    const now=later.p(),w=now.features.workbench
    if(w.pause){const event=w.events.find(event=>event.isBlocking),choice=event?.choices.find(choice=>choice.isDefault);expect(choice).toMatchObject({costFen:0,actionPoints:0});expect((await later.controller.submit(later.controller.prepare('ChooseEvent',{instanceId:event!.id,choiceId:choice!.id}))).status).toBe('saved')}
    else expect((await later.controller.submit(later.controller.prepare('AdvanceTime',{date:'2020-10-01'}))).status).toBe('saved')
   }
   const historicalP=later.p(),historicalFocus=openingFocusFor(historicalP,'life',{lifeSelection:'workspace',recordId:jobId})!,historicalThread=playerThread(historicalP,historicalFocus),before=later.controller.exportSaved()
   expect(historicalP.view.date).toBe('2020-10-01');expect(historicalThread.focusScope).toBe('history')
   const historical=sceneMeaning(historicalP,historicalThread)!
   expect(historical.title).toContain('走过');expect(historical.situation).toContain('2020-07-02实际完成');expect(historical.situation).toContain('不返还行动')
   expect(later.controller.exportSaved()).toBe(before)
  }finally{await later.close()}
 },30000)
 it('falls back for a foreign run, another active account, invalid identity and an old attempt instead of choosing another object',()=>{
  const d=course(ready),bad={...d.thread,focus:{...d.thread.focus,runId:'another-life'}}
  expect(sceneMeaning(d.p,bad)).toBeNull();expect(sceneMeaning({...d.p,accountId:'personal'},d.thread)).toBeNull()
  expect(sceneMeaning(d.p,{...d.thread,focusStatus:'invalid'})).toBeNull()
  const co=course(closed,true),job=co.co!.stageJobs.flat().find(job=>job?.status==='completed')!
  const historical=playerThread(co.p,courseFocusFor(co.p,{kind:'cohort',businessId:co.c.businessId,courseId:co.c.id,cohortId:co.co!.id,jobId:job.id}))
  expect(sceneMeaning(co.p,historical)).toBeNull()
 })
 it('preserves the same old business meaning in a candidate/readonly overlay without executing or publishing a candidate',()=>{
  const d=course(ready),before=ready.controller.exportSaved(),originalMeaning=sceneMeaning(d.p,d.thread)
  const candidate={...d.p,view:{...d.p.view,hasCandidate:true,saveStatus:'unsaved' as const}}
  expect(sceneMeaning(candidate,d.thread)).toEqual(originalMeaning)
  expect(sceneMeaning({...d.p,view:{...d.p.view,readOnly:true}},d.thread)).toEqual(originalMeaning)
  expect(d.p.request).not.toHaveBeenCalled();expect(ready.controller.exportSaved()).toBe(before)
 })
 it('keeps selected-quarter results separate from today and remains quiet for an empty or stale public period',()=>{
  const p=work.p(),season=seasonRecollection(p,'2020-Q1')!,m=seasonMeaning(p,season)!
  expect(m.situation).toContain('24,000');expect(m.situation).toContain('2020-Q1');expect(m.situation).toContain(p.view.date)
  expect(m.sourceRefs.filter(ref=>ref.kind==='payroll')).toHaveLength(3)
  expect(seasonMeaning(p,{...season,asOf:'2020-01-01'})).toBeNull()
  expect(seasonMeaning(p,{...season,quarter:'2020-Q2'})).toBeNull()
  const d=course(ready),empty=seasonRecollection(d.p,'2023-Q1')!
  expect(seasonMeaning(d.p,empty)).toBeNull() // A sample alone is not invented personal wages or a life event.
 })
 it('filters a salary-shaped record that is not attached to an original personal employment period',()=>{
  const p=work.p(),season=seasonRecollection(p,'2020-Q1')!,payroll=p.view.operations!.payroll.find(row=>row.kind==='salary')!
  const foreign={...payroll,id:'display-only:foreign-salary',entityId:'display-only:another-entity',amountFen:99999999}
  const variant={...p,view:{...p.view,operations:{...p.view.operations!,payroll:[...p.view.operations!.payroll,foreign]}}}
  expect(seasonMeaning(variant,season)).toEqual(seasonMeaning(p,season))
 })
})
