import {beforeAll,afterAll,expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {playerThread} from './player-thread.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import raw from '../../goal-1/evidence/t17-acceptance-38/chrome-art-isolated-r25/u5-r25-03-actual-physical75-after-settings.json?raw'
let controller:GameController,store:IndexedDbRunStore
beforeAll(async()=>{const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'cux09-recovery'});controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=> 'cux09-recovery-input'});await controller.initialize();await controller.importNew(raw)})
afterAll(async()=>{await controller?.close();await store?.close()})
const p=()=>{const view=controller.snapshot.view as PlayingView;return {view,features:view.features as unknown as PlayFeatures}}

it('recovers the exact original submitted cooperation with no UI bookmark, rather than a generic business menu',()=>{
 const before=controller.exportSaved(),input=p(),contract=input.features.deepseek!.contracts[0]!,thread=playerThread(input)
 expect(thread.focus).toMatchObject({kind:'ecosystem',entityId:contract.id,ecosystemTarget:{kind:'contract',recordId:contract.id,businessId:contract.businessId}})
 expect(thread.legacyFallbackRequired).toBe(false)
 expect(thread.stage).toBe('ecosystem-support')
 expect(thread.wait?.date).toBe('2024-07-26')
 expect(thread.line).toContain('80%')
 expect(controller.exportSaved()).toBe(before)
})

it('does not repair a specified stale or foreign object by silently choosing the recovered cooperation',()=>{
 const input=p(),contract=input.features.deepseek!.contracts[0]!,business=input.features.deepseek!.businesses.find(b=>b.id===contract.businessId)!,before=controller.exportSaved()
 const focus={kind:'ecosystem' as const,runId:input.view.runId,accountId:business.accountId,businessId:business.id,entityId:'missing',ecosystemTarget:{kind:'contract' as const,runId:input.view.runId,accountId:business.accountId,businessId:business.id,recordId:'missing'}}
 expect(playerThread(input,focus)).toMatchObject({focusStatus:'invalid',focus:{entityId:'missing'}})
 expect(playerThread(input,{...focus,runId:'foreign'})).toMatchObject({focusStatus:'invalid',focus:{runId:'foreign'}})
 expect(controller.exportSaved()).toBe(before)
})
