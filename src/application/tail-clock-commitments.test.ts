import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t16-epilogue/asset-a01/normal-asset-before-epilogue.json?raw'
import {createCampaignCodec} from './campaign.ts'
import {GameController} from './game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {PlayFeatures} from '../ui/game-types.ts'

// The original normal 24-quarter life is unchanged. These are original
// Controller/IDB commands, not native interaction or human acceptance.
it('projects original finite living and maintenance bills before they are scheduled, without duplicating or charging them on read',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-tail-known-bills'}),controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
 try{
  await controller.initialize();await controller.importNew(raw)
  const feature=()=>controller.snapshot.view!.features as unknown as PlayFeatures
  expect(controller.snapshot.view!.origin).toBe('normal');expect(feature().journey!.closedQuarters).toBe(24)
  expect((await controller.submit(controller.prepare('EnterEpilogue',{consent:true,reviewHash:feature().journey!.reviewHash}))).status).toBe('saved')
  const oldBudget=controller.snapshot.view!.budget
  for(const expectedDate of ['2026-01-01','2026-01-31']){
   const before=controller.exportSaved(),v=controller.snapshot.view!,date=feature().journey!.nextTailDate!
   expect(date).toBe(expectedDate)
   const command=controller.prepare('AdvanceEpilogueTime',{date}),projection=controller.clockCommitments(command),again=controller.clockCommitments(command)
   expect(projection).toEqual(again);expect(projection).toMatchObject({runId:v.runId,sourceRevision:v.revision,from:v.date,target:date})
   const outflows=projection.accounts.flatMap(a=>a.outflows)
   expect(new Set(outflows.map(f=>f.id)).size).toBe(outflows.length)
   expect(outflows.some(f=>f.label.includes(expectedDate.endsWith('-01')?'生活费':'维护费'))).toBe(true)
   expect(controller.exportSaved()).toBe(before)
   expect(()=>controller.clockCommitments(controller.prepare('AdvanceEpilogueTime',{date:'2027-07-01'}))).toThrow()
   expect((await controller.submit(command)).status).toBe('saved')
   const after=controller.snapshot.view!
   for(const row of projection.accounts){
    const old=v.accounts.find(a=>a.accountId===row.accountId)!,current=after.accounts.find(a=>a.accountId===row.accountId)!
    expect(current.cashFen-old.cashFen).toBe(row.outflows.reduce((sum,f)=>sum+f.amountFen,0))
   }
   expect(after.date).toBe(expectedDate);expect(after.phase).toBe('epilogue');expect(after.budget).toEqual(oldBudget)
   expect(()=>controller.clockCommitments(command)).toThrow('STALE_REVISION')
  }
 }finally{await controller.close();await store.close()}
})
