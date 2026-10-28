import {beforeAll,afterAll,describe,expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from './campaign.ts'
import {GameController} from './game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {canonicalJson} from '../core/identity.ts'
import raw19 from '../../goal-1/evidence/t17-acceptance-39/public-wait-model-r1/reconstructed-original19.json?raw'
import actual20 from '../../goal-1/evidence/t17-acceptance-39/chrome-result-r3/r3-03-actual20-explicit-rest-completed.json?raw'
import class97 from '../../goal-1/evidence/t17-acceptance-36/chrome-final-r10/f04-final97-question-action-reading-unchanged.json?raw'

async function open(name:string,raw=raw19,abortRevision?:number){
 const codec=createCampaignCodec(),factory=new IDBFactory(),locks=new MemoryWriterAccess(),database='cux09-wait-'+name
 const fault=abortAfterHeadWrite(factory,database,row=>(row as {envelope?:{revision?:number}}).envelope?.revision===abortRevision)
 const store=new IndexedDbRunStore({codec,factory:abortRevision===undefined?factory:fault.factory,keyRange:IDBKeyRange,name:database}),physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name:database});let n=0
 const controller=new GameController({codec,store,locks,id:()=>name+'-'+(++n)})
 await controller.initialize();await controller.importNew(raw)
 return {controller,codec,physical,locks,fault,factory,store,database,close:async()=>{await controller.close(true);await physical.close();await store.close()}}
}

it('runs only original time commands, skips a date with no meaningful change and keeps the exact original game state',async()=>{
 const h=await open('rest')
 try{
  const command=h.controller.prepare('AdvanceTime',{date:'2020-04-11'}),result=await h.controller.waitForFeedback(command)
  expect(result.status).toBe('saved');expect(result.steps).toHaveLength(2)
  expect(result.steps.map(s=>s.date)).toEqual(['2020-04-10','2020-04-11'])
  expect(result.steps.at(-1)!.commandId).toBe(command.commandId)
  expect(result.feedback.some(f=>f.kind==='job'&&f.attention==='pause')).toBe(true)
  const final=h.codec.import(h.controller.exportSaved()),expected=h.codec.import(actual20)
  expect(final.receipts.slice(-2).every(r=>r.kind==='AdvanceTime')).toBe(true)
  expect(final.life!.jobs.find(j=>j.kind==='rest')!.status).toBe('completed')
  expect(final.random).toEqual(expected.random)
  expect(h.controller.snapshot.view!.accounts).toEqual(result.before.accounts)
  expect(h.controller.snapshot.view!.budget).toEqual(result.before.budget)
  expect(h.controller.timeWait).toBeNull();expect(h.controller.snapshot.busy).toBe(false)
  expect(await h.physical.exportStored(final.runId)).toBe(h.controller.exportSaved())
 }finally{await h.close()}
})

it('shares one active intent, permits cancellation before the first command, and blocks parallel writes',async()=>{
 const h=await open('cancel')
 try{
  const before=h.controller.exportSaved(),command=h.controller.prepare('AdvanceTime',{date:'2020-04-11'}),flight=h.controller.waitForFeedback(command)
  expect(h.controller.waitForFeedback(command)).toBe(flight)
  expect(h.controller.snapshot.busy).toBe(true)
  expect(()=>h.controller.submit(h.controller.prepare('WorkQuarter',{}))).toThrow('SAVE_IN_PROGRESS')
  expect(h.controller.preview(h.controller.prepare('AdvanceTime',{date:'2020-04-11'}))).toMatchObject({allowed:false,reasonCodes:['SAVE_IN_PROGRESS']})
  expect(()=>h.controller.clockCommitments(h.controller.prepare('AdvanceTime',{date:'2020-04-11'}))).toThrow('SAVE_IN_PROGRESS')
  expect(()=>h.controller.retry()).toThrow('SAVE_IN_PROGRESS')
  const homeAttempt=h.controller.home()
  const routineAttempt=h.controller.runRoutine('not-an-authorized-plan')
  const restoreAttempt=h.controller.restore(before)
  h.controller.stopWaiting()
  await expect(homeAttempt).rejects.toThrow('SAVE_IN_PROGRESS')
  await expect(routineAttempt).rejects.toThrow('SAVE_IN_PROGRESS')
  await expect(restoreAttempt).rejects.toThrow('SAVE_IN_PROGRESS')
  const result=await flight
  expect(result).toMatchObject({status:'stopped',reasonCodes:['WAIT_STOP_REQUESTED'],steps:[]})
  expect(h.controller.exportSaved()).toBe(before)
  expect((await h.controller.waitForFeedback(command)).steps).toEqual([])
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
})

it('stops after the current original save and retains the real partial date',async()=>{
 const h=await open('partial-stop')
 try{
  const view=h.controller.snapshot.view!,unsubscribe=h.controller.subscribe(()=>{if(h.controller.snapshot.view?.revision===view.revision+1&&h.controller.snapshot.view.saveStatus==='saved')h.controller.stopWaiting()})
  const result=await h.controller.waitForFeedback(h.controller.prepare('AdvanceTime',{date:'2020-04-11'}));unsubscribe()
  expect(result.status).toBe('stopped');expect(result.steps).toHaveLength(1)
  expect(h.controller.snapshot.view).toMatchObject({date:'2020-04-10',revision:20})
  expect(h.controller.snapshot.view!.budget).toEqual(view.budget)
 }finally{await h.close()}
})

it('retains the first durable step after a real second head.put abort, and retries only the original candidate',async()=>{
 const h=await open('actual-abort',raw19,21)
 try{
  const command=h.controller.prepare('AdvanceTime',{date:'2020-04-11'}),result=await h.controller.waitForFeedback(command)
  expect(result.status).toBe('unsaved');expect(result.steps).toHaveLength(1)
  expect(h.fault.trace).toEqual({writeSucceeded:true,abortIssued:true})
  expect(result.lastSaved).toMatchObject({revision:20,date:'2020-04-10',saveStatus:'saved'})
  expect(h.controller.snapshot.view).toMatchObject({revision:20,date:'2020-04-10',saveStatus:'unsaved',hasCandidate:true})
  const old=h.controller.exportSaved(),candidate=h.controller.exportCandidate()
  expect(await h.physical.exportStored(result.before.runId)).toBe(old)
  expect(h.codec.import(candidate).receipts.at(-1)!.commandId).toBe(command.commandId)
  expect((await h.controller.retry()).status).toBe('saved')
  expect(h.controller.exportSaved()).toBe(candidate)
  expect(await h.physical.exportStored(result.before.runId)).toBe(candidate)
  expect((await h.controller.waitForFeedback(command)).steps).toEqual([])
  expect(h.controller.exportSaved()).toBe(candidate)
 }finally{await h.close()}
})

it('rejects a stale range and preserves original saved-command idempotency',async()=>{
 const h=await open('stale')
 try{
  const untouched=h.controller.exportSaved()
  expect((await h.controller.waitForFeedback(h.controller.prepare('AdvanceTime',{date:'2026-01-01'})))).toMatchObject({status:'rejected',reasonCodes:['PREVIEW_RANGE_ENDED'],steps:[]})
  expect((await h.controller.waitForFeedback(h.controller.prepare('AdvanceTime',{date:'not-a-date'})))).toMatchObject({status:'rejected',steps:[]})
  expect(()=>h.controller.waitForFeedback(h.controller.prepare('WorkQuarter',{}))).toThrow('CLOCK_COMMAND_REQUIRED')
  expect(h.controller.exportSaved()).toBe(untouched)
  const stale=h.controller.prepare('AdvanceTime',{date:'2020-04-11'}),single=h.controller.prepare('AdvanceTime',{date:'2020-04-10'})
  expect((await h.controller.submit(single)).status).toBe('saved')
  const before=h.controller.exportSaved()
  expect((await h.controller.waitForFeedback(stale))).toMatchObject({status:'rejected',reasonCodes:['STALE_REVISION'],steps:[]})
  expect((await h.controller.waitForFeedback(single)).steps).toEqual([])
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
})

it('keeps a real same-run reader from starting time or changing the physical saved history',async()=>{
 const h=await open('reader'),readerStore=new IndexedDbRunStore({codec:h.codec,factory:h.factory,keyRange:IDBKeyRange,name:h.database}),reader=new GameController({codec:h.codec,store:readerStore,locks:h.locks})
 try{
  const before=h.controller.exportSaved(),runId=h.controller.snapshot.view!.runId
  await reader.initialize();await reader.continueLife(runId)
  expect(reader.snapshot.view!.readOnly).toBe(true)
  const result=await reader.waitForFeedback(reader.prepare('AdvanceTime',{date:'2020-04-11'}))
  expect(result.status).toBe('rejected');expect(result.steps).toEqual([])
  expect(reader.exportSaved()).toBe(before);expect(h.controller.exportSaved()).toBe(before)
  expect(await h.physical.exportStored(runId)).toBe(before)
 }finally{await reader.close();await readerStore.close();await h.close()}
})

it('finishes the current original transaction before closing and never resumes the remaining range',async()=>{
 const h=await open('close-current');let closing:Promise<void>|null=null,requested=false
 try{
  const before=h.controller.snapshot.view!,unsubscribe=h.controller.subscribe(()=>{
   const view=h.controller.snapshot.view
   if(!requested&&view?.revision===before.revision+1&&view.saveStatus==='saved'){requested=true;closing=h.controller.close()}
  })
  const result=await h.controller.waitForFeedback(h.controller.prepare('AdvanceTime',{date:'2020-04-11'}));unsubscribe()
  await closing
  expect(requested).toBe(true);expect(result).toMatchObject({status:'stopped',reasonCodes:['WAIT_STOP_REQUESTED']})
  expect(result.steps).toHaveLength(1);expect(result.lastSaved).toMatchObject({date:'2020-04-10',revision:20})
  const stored=await h.physical.exportStored(before.runId)
  expect(h.codec.import(stored!).revision).toBe(20)
  expect(h.codec.import(stored!).timeline.cursor.date).toBe('2020-04-10')
  await expect(h.controller.continueLife(before.runId)).rejects.toThrow('SESSION_CLOSED')
 }finally{await h.close()}
})

describe('actual normal class public feedback window',()=>{
 let h:Awaited<ReturnType<typeof open>>,direct:Awaited<ReturnType<typeof open>>
 let expected:ReturnType<ReturnType<typeof createCampaignCodec>['import']>
 beforeAll(async()=>{
  h=await open('class',class97);direct=await open('class-direct',class97)
  // Prepare the independent reference; the complete operation under test stays in the case.
  expect((await direct.controller.submit(direct.controller.prepare('AdvanceTime',{date:'2023-03-14'}))).status).toBe('saved')
  expected=direct.codec.import(direct.controller.exportSaved())
 })
 afterAll(async()=>{await h?.close();await direct?.close()})
 it('passes routine dates internally, stops at the actual March14 update and preserves every simulation field',async()=>{
  const result=await h.controller.waitForFeedback(h.controller.prepare('AdvanceTime',{date:'2023-03-31'}))
  expect(result.status).toBe('stopped');expect(result.steps).toHaveLength(8)
  expect(result.current.date).toBe('2023-03-14')
  expect(result.feedback.some(row=>row.kind==='course-update'&&row.attention==='pause')).toBe(true)
  const actual=h.codec.import(h.controller.exportSaved())
  for(const field of ['phase','economy','operations','market','video','course','relay','deepseek','life','story','journey','routines','random','world','timeline'] as const)expect(canonicalJson(actual[field]),field).toBe(canonicalJson(expected[field]))
 },30000)
})
