import {afterAll,beforeAll,expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t17-acceptance-40/equity-shared-closure-r221/normal75-input.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {equityJourneyFor,equityFocusFor} from './equity-player-thread.ts'
import {savedSceneResult} from './scene-result.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'

// Original Create75 prefix and real controller/codec/store callbacks.
// Fake IDB and model rendering are not Chrome or human play.
let controller:GameController,store:IndexedDbRunStore,before:PlayingView,stopped:PlayingView,closed:PlayingView,target:EquitySceneTarget
const props=(view:PlayingView):GamePanelProps=>({controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:()=>{throw Error('READING_MUST_NOT_SUBMIT')}})
beforeAll(async()=>{
 const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-closure-normal75'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(raw);before=controller.snapshot.view!;
 const business=(before.features as unknown as PlayFeatures).deepseek!.businesses.find(b=>b.definitionId==='deepseek-investor')!;target={runId:before.runId,accountId:business.accountId,businessId:business.id,kind:'business'};
 expect((await controller.submit(controller.prepare('WindDownBusiness',{businessId:business.id}))).status).toBe('saved');stopped=controller.snapshot.view!;
 expect((await controller.submit(controller.prepare('CloseBusiness',{businessId:business.id}))).status).toBe('saved');closed=controller.snapshot.view!;
})
afterAll(async()=>{await controller?.close();await store?.close()})
it('makes the stopped original desk about retained records rather than starting relationships or invitations',()=>{
 const p=props(stopped),j=equityJourneyFor(p,equityFocusFor(p,target));expect(j.phase).toBe('business-winding-down');expect(j.title).toContain('收尾');expect(j.paper).toBe('kept');expect(j.purpose).toContain('保留');expect(j.action).toMatchObject({kind:'choice',intent:'next'});expect(j.title).not.toContain('关系');
})
it('closes the desk as a saved result and gives the same object a direct return to life',()=>{
 const p=props(closed),j=equityJourneyFor(p,equityFocusFor(p,target));expect(j.phase).toBe('business-closed');expect(j.paper).toBe('kept');expect(j.outcome).toBe('actual');expect(j.purpose).toContain('已经关闭');expect(j.action.kind).toBe('today');expect(j.resultDate).toBe(closed.date);
})
it('reports the actual wind-down and closure instead of a generic task acknowledgement',()=>{
 expect(savedSceneResult('WindDownBusiness','停止原主体',before,stopped)).toContain('进入收尾');expect(savedSceneResult('CloseBusiness','关闭原主体',stopped,closed)).toContain('分账已经关闭');expect(savedSceneResult('CloseBusiness','关闭原主体',stopped,{...closed,hasCandidate:true,saveStatus:'unsaved'})).toContain('上一次完整提交');
})
