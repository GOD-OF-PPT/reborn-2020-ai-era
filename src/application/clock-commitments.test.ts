import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from './campaign.ts'
import {GameController} from './game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {PlayFeatures} from '../ui/game-types.ts'

async function normalClock(){
 const codec=createCampaignCodec(),factory=new IDBFactory(),locks=new MemoryWriterAccess(),store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name:'t17-clock-review'})
 let id=0
 const controller=new GameController({codec,store,locks,id:()=>`clock-${++id}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'t17-clock-review'})
 for(const [kind,payload]of [['StartFirstOrder',{}],['WorkQuarter',{}]]as const)expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')
 return {controller,store,codec,factory,locks}
}

it('normal clock review shows the actual500 start payment and original reservation without executing either',async()=>{
 const h=await normalClock()
 try{
  const before=h.controller.exportSaved(),view=h.controller.snapshot.view!,command=h.controller.prepare('AdvanceTime',{date:'2020-01-05'})
  const review=h.controller.clockCommitments(command),personal=review.accounts.find(a=>a.accountId==='personal')!
  expect(review).toMatchObject({runId:view.runId,sourceRevision:view.revision,from:'2020-01-01',target:'2020-01-05'})
  expect(personal.outflows).toContainEqual(expect.objectContaining({date:'2020-01-05',amountFen:-50000,releasedFen:50000}))
  expect(h.controller.exportSaved()).toBe(before);expect(h.controller.snapshot.view!.date).toBe('2020-01-01')
 }finally{await h.controller.close();await h.store.close()}
})

it('a selected next-quarter horizon includes its4000 living bill while the ordinary quarter forecast stays unchanged',async()=>{
 const h=await normalClock()
 try{
  const before=h.controller.exportSaved(),ordinary=JSON.stringify((h.controller.snapshot.view!.features as unknown as PlayFeatures).workbench.finance)
  const review=h.controller.clockCommitments(h.controller.prepare('AdvanceTime',{date:'2020-04-01'})),personal=review.accounts.find(a=>a.accountId==='personal')!
  expect(personal.outflows).toContainEqual(expect.objectContaining({date:'2020-04-01',amountFen:-400000}))
  expect(personal.outflows.every(f=>f.amountFen<0)).toBe(true)
  expect(JSON.stringify((h.controller.snapshot.view!.features as unknown as PlayFeatures).workbench.finance)).toBe(ordinary)
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
})

it('an early within-day target does not present a later same-day living bill as already inside the selected interval',async()=>{
 const h=await normalClock()
 try{
  const before=h.controller.exportSaved(),early=h.controller.clockCommitments(h.controller.prepare('AdvanceTime',{date:'2020-02-01',phase:'certain_receipts'})),end=h.controller.clockCommitments(h.controller.prepare('AdvanceTime',{date:'2020-02-01'}))
  expect(early.targetPhase).toBe('certain_receipts');expect(early.accounts[0]!.outflows.some(f=>f.date==='2020-02-01')).toBe(false)
  expect(end.accounts[0]!.outflows).toContainEqual(expect.objectContaining({date:'2020-02-01',amountFen:-400000}))
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
})

it('clock queries reject stale/non-clock/out-of-range requests and never publish private notes or hidden state',async()=>{
 const h=await normalClock()
 try{
  const old=h.controller.prepare('AdvanceTime',{date:'2020-01-05'})
  expect((await h.controller.submit(h.controller.prepare('SetPrivateNote',{text:'DO_NOT_SHARE_CLOCK_NOTE'}))).status).toBe('saved')
  expect(()=>h.controller.clockCommitments(old)).toThrowError('STALE_REVISION')
  expect(()=>h.controller.clockCommitments(h.controller.prepare('SetPrivateNote',{text:''}))).toThrowError('CLOCK_COMMAND_REQUIRED')
  expect(()=>h.controller.clockCommitments(h.controller.prepare('AdvanceTime',{date:'2026-01-01'}))).toThrowError('PREVIEW_RANGE_ENDED')
  const current=h.controller.prepare('AdvanceTime',{date:'2020-01-05'})
  expect(()=>h.controller.clockCommitments({...current,actorId:'intruder'})).toThrowError('FORBIDDEN_ACTOR')
  expect(()=>h.controller.clockCommitments({...current,runId:'another-life'})).toThrowError('WRONG_RUN')
  let getterCalls=0
  const getter={...current};Object.defineProperty(getter,'kind',{enumerable:true,get:()=>{getterCalls++;return 'AdvanceTime'}})
  expect(()=>h.controller.clockCommitments(getter)).toThrowError('INVALID_JSON_VALUE');expect(getterCalls).toBe(0)
  const before=h.controller.exportSaved(),review=h.controller.clockCommitments(h.controller.prepare('AdvanceTime',{date:'2020-01-05'}))
  expect(JSON.stringify(review)).not.toContain('DO_NOT_SHARE_CLOCK_NOTE');expect(review).not.toHaveProperty('random');expect(review).not.toHaveProperty('facts')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
})

it('another read-only session cannot use the new query to bypass the installed preview guard',async()=>{
 const h=await normalClock(),readerStore=new IndexedDbRunStore({codec:h.codec,factory:h.factory,keyRange:IDBKeyRange,name:h.store.name}),reader=new GameController({codec:h.codec,store:readerStore,locks:h.locks})
 try{
  const before=h.controller.exportSaved();await reader.initialize();await reader.continueLife(h.controller.snapshot.view!.runId)
  expect(reader.snapshot.view!.readOnly).toBe(true)
  expect(()=>reader.clockCommitments(reader.prepare('AdvanceTime',{date:'2020-01-05'}))).toThrowError('READ_ONLY_SESSION')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await reader.close();await h.controller.close();await readerStore.close();await h.store.close()}
})
