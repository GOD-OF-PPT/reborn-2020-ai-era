import {beforeAll,afterAll,describe,expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import type {PublicWaitResult} from '../application/public-wait.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {waitSceneResult,waitSequenceValid,waitResultAfterRetry} from './wait-scene-result.ts'
import {savedSceneResult} from './scene-result.ts'
import raw19 from '../../goal-1/evidence/t17-acceptance-39/public-wait-model-r1/reconstructed-original19.json?raw'
import class97 from '../../goal-1/evidence/t17-acceptance-36/chrome-final-r10/f04-final97-question-action-reading-unchanged.json?raw'

async function open(name:string,raw:string,abortRevision?:number){const codec=createCampaignCodec(),factory=new IDBFactory(),fault=abortAfterHeadWrite(factory,name,row=>(row as {envelope?:{revision?:number}}).envelope?.revision===abortRevision),store=new IndexedDbRunStore({codec,factory:abortRevision?fault.factory:factory,keyRange:IDBKeyRange,name});let n=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++n)});await controller.initialize();await controller.importNew(raw);return {controller,fault,close:async()=>{await controller.close(true);await store.close()}}}

describe('owned range receipt',()=>{
 let h:Awaited<ReturnType<typeof open>>,result:PublicWaitResult
 beforeAll(async()=>{h=await open('cux09-reel-rest',raw19);result=await h.controller.waitForFeedback(h.controller.prepare('AdvanceTime',{date:'2020-04-11'}))})
 afterAll(async()=>{await h?.close()})
 it('binds every actual time receipt and preserves the actual dates, account and action frame',()=>{
  const current=h.controller.snapshot.view!,reel=waitSceneResult(result,current)!
  expect(waitSequenceValid(result,current)).toBe(true)
  expect(reel.frame).toMatchObject({dateBefore:'2020-04-04',dateAfter:'2020-04-11',pointsBefore:3,pointsAfter:3})
  expect(reel.text).toContain('2020-04-04');expect(reel.text).toContain('2020-04-11')
  expect(h.controller.snapshot.view!.revision).toBe(21)
 })
 it('rejects missing steps, forged IDs, mixed runs and a later unrelated revision',()=>{
  const current=h.controller.snapshot.view!
  expect(waitSceneResult({...result,steps:result.steps.slice(1)},current)).toBeNull()
  expect(waitSceneResult({...result,steps:result.steps.map((step,i)=>i===0?{...step,commandId:'foreign'}:step)},current)).toBeNull()
  expect(waitSceneResult({...result,before:{...result.before,runId:'foreign'}},current)).toBeNull()
  expect(waitSceneResult(result,{...current,revision:current.revision+1})).toBeNull()
  expect(waitSceneResult(result,{...current,accounts:current.accounts.map(a=>({...a,cashFen:a.cashFen+1}))})).toBeNull()
 })
})

it('keeps the saved part of an actual abort and adds only the exact original candidate on retry',async()=>{
 const h=await open('cux09-reel-abort',raw19,21)
 try{
  const result=await h.controller.waitForFeedback(h.controller.prepare('AdvanceTime',{date:'2020-04-11'})),old=h.controller.snapshot.view!,partial=waitSceneResult(result,old)!
  expect(result.status).toBe('unsaved');expect(partial.text).toContain('接下来的一步尚未保存')
  expect(partial.frame.dateAfter).toBe('2020-04-10')
  const retried=await h.controller.retry();expect(retried.status).toBe('saved')
  if(retried.status!=='saved')throw Error('ORIGINAL_RETRY_REQUIRED')
  const current=h.controller.snapshot.view!,resumed=waitResultAfterRetry(result,retried.receipt,current)!,reel=waitSceneResult(resumed,current)!
  expect(resumed.steps).toHaveLength(2);expect(reel.frame.dateAfter).toBe('2020-04-11')
  expect(h.controller.timeWait).toBeNull();expect(current.revision).toBe(21)
  expect(waitResultAfterRetry(result,{...retried.receipt,commandId:'another'},current)).toBeNull()
 }finally{await h.close()}
})

it('saves only an early nonmeaning candidate on retry and explains the still unexecuted remainder without inventing feedback',async()=>{
 const h=await open('cux09-reel-early-abort',raw19,20)
 try{
  const original=h.controller.exportSaved(),scope=h.controller.prepare('AdvanceTime',{date:'2020-04-11'}),result=await h.controller.waitForFeedback(scope),candidate=h.controller.exportCandidate()
  expect(h.fault.trace).toEqual({writeSucceeded:true,abortIssued:true})
  expect(result.status).toBe('unsaved');expect(result.steps).toEqual([]);expect(h.controller.exportSaved()).toBe(original)
  const retry=await h.controller.retry();if(retry.status!=='saved')throw Error('ORIGINAL_RETRY_REQUIRED')
  const current=h.controller.snapshot.view!,saved=waitResultAfterRetry(result,retry.receipt,current)!,reel=waitSceneResult(saved,current)!
  expect(current).toMatchObject({revision:20,date:'2020-04-10'});expect(saved.steps).toHaveLength(1)
  expect(saved.feedback).toEqual([]);expect(h.controller.exportSaved()).toBe(candidate)
  expect(reel.text).toContain('余下的等候');expect(reel.text).not.toContain('这次真实反馈')
  expect((await h.controller.waitForFeedback(scope)).steps).toEqual([])
  expect(h.controller.exportSaved()).toBe(candidate);expect(h.controller.timeWait).toBeNull()
 }finally{await h.close()}
})

it('shows all actual earlier cash payments when the final meaningful class update itself has no new payment',async()=>{
 const h=await open('cux09-reel-class',class97)
 const captured:{before:PublicWaitResult['lastSaved']|null;at:PublicWaitResult['lastSaved']|null}={before:null,at:null}
 let prior=h.controller.snapshot.view!
 const unsubscribe=h.controller.subscribe(()=>{
  const view=h.controller.snapshot.view
  if(view?.saveStatus==='saved'&&!view.busy&&!view.hasCandidate&&view.revision===prior.revision+1){
   if(view.date==='2023-03-01'){captured.before=prior;captured.at=view}
   prior=view
  }
 })
 try{
  const result=await h.controller.waitForFeedback(h.controller.prepare('AdvanceTime',{date:'2023-03-31'})),reel=waitSceneResult(result,h.controller.snapshot.view!)!
  expect(result.current.date).toBe('2023-03-14')
  expect(reel.brief).toContain('个人实际付出¥8,000')
  expect(reel.brief).toContain('课程出现了新的更新事项')
  expect(reel.text).toContain('2023-01-31');expect(reel.text).toContain('2023-03-14')
  const at=captured.at,before=captured.before;if(!at||!before)throw Error('ACTUAL_MARCH1_PUBLIC_PAIR_REQUIRED')
  expect(savedSceneResult('AdvanceTime','原日期',before,at)).toContain('个人实际付出¥4,000')
  // A bounded presentation variant uses actual same-scope saved views/steps.
  // Native R8 separately proves the real stop; this creates no game outcome.
  const stopped:PublicWaitResult={...result,status:'stopped',reasonCodes:['WAIT_STOP_REQUESTED'],current:at,lastSaved:at,lastBefore:before,steps:result.steps.filter(step=>step.revisionAfter<=at.revision),feedback:[],failed:null}
  const stoppedReel=waitSceneResult(stopped,at)!
  expect(stoppedReel.brief.startsWith('已经按你的选择停下')).toBe(true)
  expect(stoppedReel.text).toContain('个人实际付出¥8,000');expect(stoppedReel.text).toContain('课程实际付出¥100')
  expect(stoppedReel.text.match(/个人实际付出/g)).toHaveLength(1)
  expect(stoppedReel.text).not.toContain('个人实际付出¥4,000')
 }finally{unsubscribe();await h.close()}
},30000)
