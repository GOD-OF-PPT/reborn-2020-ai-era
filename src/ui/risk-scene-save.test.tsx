import raw from '../../goal-1/evidence/t17-acceptance-07/chrome-risk/baseline-signal-155.json?raw'
import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {storySceneProgress} from './story-scene-progress.ts'
import type {PlayFeatures} from './game-types.ts'

it('publishes the real investigation letter only after its whole save commits, and retries the same candidate',async()=>{
 // An actually earned browser export, independently replayed from Create in this task's evidence.
 const codec=createCampaignCodec(),name='risk-letter-atomic-save',base=new IDBFactory()
 const fault=abortAfterHeadWrite(base,name,row=>((row as {envelope?:{state?:{story?:{evidence?:unknown[]}}}}).envelope?.state?.story?.evidence?.length??0)>0)
 const store=new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name}),reader=new IndexedDbRunStore({codec,factory:base,keyRange:IDBKeyRange,name})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`risk-save-${++id}`})
 const view=()=>controller.snapshot.view!,features=()=>view().features as unknown as PlayFeatures
 try{
  await controller.initialize();await controller.importNew(raw)
  const c=features().story.incidents.find(c=>c.verdict==='unknown')!,business=view().operations!.businesses.find(b=>c.businessIds.includes(b.id))!
  const beforePersonal=view().accounts.find(a=>a.accountId==='personal')!.cashFen,paidFrom=view().accounts.find(a=>a.accountId===business.accountId)!.cashFen,ap=view().budget.available
  expect((await controller.submit(controller.prepare('StartRiskTask',{incidentId:c.id,kind:'investigate',accountId:business.accountId,resourceId:'player-production'}))).status).toBe('saved')
  expect(view().accounts.find(a=>a.accountId==='personal')!.cashFen).toBe(beforePersonal)
  expect(view().accounts.find(a=>a.accountId===business.accountId)!.cashFen).toBe(paidFrom-c.taskTerms.investigate!.costFen)
  expect(view().budget.available).toBe(ap-c.taskTerms.investigate!.points)
  expect(storySceneProgress(features().story,view().date,c.id)?.phase).toBe('waiting')
  const pause=features().workbench.pause!
  expect((await controller.submit(controller.prepare('AcknowledgeStoryPause',{instanceId:pause.instanceId}))).status).toBe('saved')
  const before=controller.exportSaved(),completeAt=features().story.incidents.find(i=>i.id===c.id)!.jobs.investigate!.completeAt
  expect((await controller.submit(controller.prepare('AdvanceTime',{date:completeAt}))).status).toBe('unsaved')
  expect(fault.trace).toEqual({writeSucceeded:true,abortIssued:true})
  expect(controller.exportSaved()).toBe(before);expect(await reader.exportStored(view().runId)).toBe(before)
  expect(storySceneProgress(features().story,view().date,c.id)?.phase).toBe('waiting')
  const candidate=controller.exportCandidate()
  expect((await controller.retry()).status).toBe('saved');expect(controller.exportSaved()).toBe(candidate)
  expect(storySceneProgress(features().story,view().date,c.id)?.phase).toBe('assessment')
  expect((await controller.submit(controller.prepare('ConfirmRiskAssessment',{incidentId:c.id}))).status).toBe('saved')
  expect(features().story.incidents.find(i=>i.id===c.id)!.verdict).not.toBe('unknown')
 }finally{await controller.close(true);await store.close();await reader.close()}
},30000)
