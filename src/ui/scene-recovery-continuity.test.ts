import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {playerThread} from './player-thread.ts'
import type {PlayFeatures} from './game-types.ts'
import carry from '../../goal-1/evidence/t17-acceptance-36/chrome-normal-r1/n07-saved17-cross-quarter-old-job.json?raw'
import sample from '../../goal-1/evidence/t17-acceptance-36/chrome-atomic-r1/a01-import-buffer86.json?raw'
import video from '../../goal-1/evidence/t17-acceptance-23/chrome-r6/ai-saved-70-paid-r6.json?raw'
import completedCarry from '../../goal-1/evidence/t17-acceptance-36/chrome-normal-r1/n09-saved18-life-complete.json?raw'
import refresh106 from '../../goal-1/evidence/t17-acceptance-39/chrome-update-r5/r5-06-actual106-refresh-started.json?raw'
import refresh108 from '../../goal-1/evidence/t17-acceptance-39/chrome-update-r5/r5-08-actual108-original-update-completed.json?raw'
import closed119 from '../../goal-1/evidence/t17-acceptance-39/normal-course-boundary-r40/normal-final.json?raw'
import relay105 from '../../goal-1/evidence/t17-acceptance-11/chrome-production-r12/r105-audit-correction-real-cash-saved.json?raw'
import {relayBusinessTarget,relayFocusFor} from './relay-player-thread.ts'

// Retained normal original sources. Importing a local test store is not new Native play.
async function imported(name:string,raw:string,check:(p:Parameters<typeof playerThread>[0])=>void){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'cux09-source-'+name}),controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=> 'cux09-'+name})
 try{await controller.initialize();await controller.importNew(raw);const view=controller.snapshot.view!;check({view,features:view.features as unknown as PlayFeatures});expect(controller.exportSaved()).toBe(raw)}finally{await controller.close();await store.close()}
}

it('keeps the actual previous-quarter workspace job in front after April1 without renewing work or rewriting its source',async()=>{
 await imported('carry',carry,p=>{
  const job=p.features.life.jobs.find(j=>j.id==='life:719699f293d85e4fd27a700d7d9d1d3e')!,thread=playerThread(p)
  expect(p.view.date).toBe('2020-04-01');expect(job).toMatchObject({status:'running',startAt:'2020-03-28',completeAt:'2020-04-04'})
  expect(thread.focus).toMatchObject({kind:'life',entityId:job.id,selection:'workspace'})
  expect(thread.focusQuarter).toBe('2020-Q1');expect(thread.focusScope).toBe('carry')
  expect(thread.wait?.date).toBe('2020-04-04');expect(thread.legacyFallbackRequired).toBe(false)
  expect(p.features.workbench.employment).toEqual([])
 })
})

it('recovers the actual second sample attempt, preserving completed preparation without inventing a class or income',async()=>{
 await imported('sample',sample,p=>{
  const thread=playerThread(p)
  expect(thread.focus).toMatchObject({kind:'course',entityId:'crs:77414d90c9272b27bdbf354d34cf4ff2',courseTarget:{kind:'course',courseId:'crs:60aafe5da1d987ede4868ffc2c3a469f',sampleJobId:'crs:77414d90c9272b27bdbf354d34cf4ff2'}})
  expect(thread.stage).toBe('course-ready');expect(thread.legacyFallbackRequired).toBe(false)
  expect(p.features.course!.cohorts).toEqual([])
 })
})

it('keeps the completed carry result on reentry rather than replacing it with an empty calendar',async()=>{
 await imported('completed-carry',completedCarry,p=>{
  const thread=playerThread(p)
  expect(p.view.date).toBe('2020-04-04')
  expect(thread.focus).toMatchObject({kind:'life',entityId:'life:719699f293d85e4fd27a700d7d9d1d3e',selection:'workspace'})
  expect(thread.outcome).toBe('actual');expect(thread.focusScope).toBe('current')
  expect(thread.focusQuarter).toBe('2020-Q1');expect(thread.legacyFallbackRequired).toBe(false)
 })
})

it('recovers the original paid AI commission instead of selecting the older manual work on the same channel',async()=>{
 await imported('video',video,p=>{
  const thread=playerThread(p)
  expect(thread.focus).toMatchObject({kind:'video',entityId:'vid:05ccd9f89da3f63a998c1b2307bcf1d6',videoTarget:{channelId:'vid:1b8b8b648df6353c25412860736670c9',workId:'vid:01c1e94b003afd17b9e4423f78ccc7b9',contractId:'vid:05ccd9f89da3f63a998c1b2307bcf1d6'}})
  expect(thread.legacyFallbackRequired).toBe(false)
  expect(thread.focus.entityId).not.toBe('vid:6889207b61c61ee8a67b41c642a90c53')
 })
})

for(const [revision,raw,stage]of [[106,refresh106,'course-refresh-running'],[108,refresh108,'course-stage-planned']] as const)it('keeps the exact original class after the same-course auxiliary refresh at real revision '+revision,async()=>{
 await imported('refresh-'+revision,raw,p=>{
  expect(p.features.course!.cohorts).toHaveLength(1)
  const co=p.features.course!.cohorts[0]!,lesson=p.features.course!.courses.find(c=>c.id===co.courseId)!,thread=playerThread(p)
  expect(p.view.revision).toBe(revision)
  expect(thread.focus).toMatchObject({kind:'course',accountId:p.features.course!.businesses.find(b=>b.id===lesson.businessId)!.accountId,entityId:co.id,courseTarget:{kind:'cohort',businessId:lesson.businessId,courseId:lesson.id,cohortId:co.id}})
  expect(thread.stage).toBe(stage);expect(thread.focusScope).not.toBe('history')
  expect(thread.legacyFallbackRequired).toBe(false)
  const published=p.features.sceneCommands!,last=published.commands.findLast(row=>row.kind==='StartCourseRefresh')!
  // Negative public-source variant only: a missing/foreign original target must
  // not borrow the earlier class to make a supposedly normal saved result.
  const invalid={...p,features:{...p.features,sceneCommands:{...published,commands:published.commands.map(row=>row.commandId===last.commandId?{...row,identifiers:{...row.identifiers,courseId:'foreign-course-not-published'}}:row)}}}
  expect(playerThread(invalid).stage).toBe('review-choice')
 })
})

it('keeps the actual current-quarter class closure when its original manual arrangements came from the previous quarter',async()=>{
 await imported('closed-current-quarter',closed119,p=>{
  const co=p.features.course!.cohorts[0]!,thread=playerThread(p)
  expect(p.view).toMatchObject({revision:119,date:'2023-05-01'});expect(co.closedAt).toBe('2023-04-30')
  expect(thread.focus).toMatchObject({kind:'course',entityId:co.id,courseTarget:{kind:'cohort',cohortId:co.id}})
  expect(thread.stage).toBe('course-cohort-closed');expect(thread.focusScope).toBe('current');expect(thread.focusQuarter).toBe('2023-Q1')
  expect(playerThread(p,{...thread.focus,runId:'foreign-life'}).focusStatus).toBe('invalid')
  const published=p.features.sceneCommands!,classSources=new Set(['PlanCourseCohort','EnrollCourseAudience','StartCourseStage','StartCourseRecovery','RefundCourseLearners','InterruptJob','RescheduleJob'])
  // Bounded source-publication variant, not a modified saved game: an actual
  // class result alone cannot invent the missing original command relation.
  const missing={...p,features:{...p.features,sceneCommands:{...published,commands:published.commands.filter(row=>!classSources.has(row.kind))}}}
  expect(playerThread(missing).focus.kind).not.toBe('course')
 })
})

it('keeps the original corrected service period through its actual customer collections on reentry',async()=>{
 await imported('relay-cash-period',relay105,p=>{
  const period=p.features.relay!.periods.find(row=>row.id==='rly:03db53459f6d8827f8a5b5e83e0c034a')!
  const identity=relayBusinessTarget(p,period.businessId)!,focus=relayFocusFor(p,{...identity,kind:'period',periodId:period.id})
  const exact=playerThread(p,focus),restored=playerThread(p)
  expect(p.view).toMatchObject({revision:105,date:'2025-03-08',budget:{available:0}})
  expect(p.features.sceneCommands!.commands.at(-1)).toMatchObject({kind:'CollectRelayDue',revisionAfter:105})
  expect(restored.focus).toEqual(focus)
  expect(restored.stage).toBe(exact.stage)
  expect(restored.wait).toEqual(exact.wait)
  expect(restored.command).toEqual(exact.command)
  expect(restored.resultRefs).toEqual(exact.resultRefs)
  expect(restored.legacyFallbackRequired).toBe(false)
  expect(restored.stage).not.toBe('relay-records')
 })
})

it('keeps an explicitly selected customer independent from automatic service recovery',async()=>{
 await imported('relay-explicit-customer',relay105,p=>{
  const customer=p.features.relay!.customers.find(row=>row.id==='rly:aa1ae71ec735b943dc1649d455d84dc5')!
  const identity=relayBusinessTarget(p,customer.businessId)!,focus=relayFocusFor(p,{...identity,kind:'customer',customerId:customer.id})
  expect(playerThread(p,focus)).toMatchObject({focus,focusStatus:'valid',stage:'relay-records'})
  expect(playerThread(p,{...focus,runId:'another-life'}).focusStatus).toBe('invalid')
 })
})

it('does not borrow the old service period to repair an unknown collection source',async()=>{
 await imported('relay-unknown-customer',relay105,p=>{
  const published=p.features.sceneCommands!,last=published.commands.at(-1)!
  // A bounded public-source failure, not a modified saved history.
  const invalid={...p,features:{...p.features,sceneCommands:{...published,commands:published.commands.map(row=>row.commandId===last.commandId?{...row,identifiers:{...row.identifiers,customerId:'missing-original-customer'}}:row)}}}
  expect(playerThread(invalid)).toMatchObject({stage:'review-choice',focus:{kind:'free'}})
 })
})
