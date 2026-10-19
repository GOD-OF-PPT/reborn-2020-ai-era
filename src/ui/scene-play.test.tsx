import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {PlayFeatures} from './game-types.ts'
import {sceneSeason,sceneShortcut} from './scene-season.ts'
import {SceneJournal,sceneWorks} from './SceneJournal.tsx'
import {committedEcho,SceneEcho} from './SceneEcho.tsx'
import {OpportunityAtlas} from './OpportunityAtlas.tsx'

it('24 original scene moods cover their own quarters, without certifying future progress',()=>{
 const copies=Array.from({length:24},(_,i)=>sceneSeason(`${2020+Math.floor(i/4)}-Q${i%4+1}`))
 expect(copies.map(s=>s.chapter)).toEqual(Array.from({length:24},(_,i)=>i+1))
 expect(new Set(copies.map(s=>s.title)).size).toBe(24)
 for(const outside of ['2019-Q4','2026-Q1','2020-Q0','2020-Q5','2020-Q10'])expect(sceneSeason(outside).chapter).toBeNull()
})

it('numbered thoughts navigate, while modal dialogs and editing keep their keys',()=>{
 expect(['1','2','3','4'].map(k=>sceneShortcut(k,false,false,false))).toEqual(['quarter','routes','life','memory'])
 for(const key of ['1','2','3','4','Enter','ArrowDown']){
  expect(sceneShortcut(key,true,false,false)).toBeNull();expect(sceneShortcut(key,false,true,false)).toBeNull();expect(sceneShortcut(key,false,false,true)).toBeNull()
 }
})

it('actual production remains planned, running, then awaiting submission; browsing never mutates it',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d07-film-stages'})
 let id=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`film-d07-${++id}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'d07-film-stages'})
 const snapshot=()=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:()=>{throw Error('READ_MUST_NOT_WRITE')}}}
 try{
  const initial=snapshot(),raw=controller.exportSaved()
  const atlas=renderToStaticMarkup(<OpportunityAtlas {...initial} onRoute={()=>{throw Error('RENDER_MUST_NOT_NAVIGATE')}}/>)
  expect(atlas).toContain('五条路线电影抉择');expect(atlas.match(/aria-label="聚焦/g)).toHaveLength(5)
  expect(controller.exportSaved()).toBe(raw);expect(committedEcho(initial.view,initial.view)).toBeNull()
  expect((await controller.submit(controller.prepare('StartFirstOrder',{}))).status).toBe('saved')
  let p=snapshot(),works=sceneWorks(p),frame=committedEcho(initial.view,p.view)
  expect(works.some(w=>w.status==='已经安排，等待实际开工')).toBe(true)
  expect(frame?.pointsAfter).toBe(p.view.budget.available)
  expect(frame?.accounts[0]?.before).toBe(2600000)
  const old=controller.exportSaved();expect(renderToStaticMarkup(<SceneJournal p={p} onNavigate={()=>{throw Error('READ_MUST_NOT_NAVIGATE')}}/>)).toContain('等待实际开工');expect(controller.exportSaved()).toBe(old)
  expect(committedEcho(initial.view,{...p.view,saveStatus:'unsaved',hasCandidate:true})).toBeNull()
  expect(committedEcho({...initial.view,runId:'different-life'},p.view)).toBeNull()
  expect(renderToStaticMarkup(<SceneEcho text="尚未实际到账" frame={frame} accountName={()=>'个人账户'} onClose={()=>{}}/>)).toContain('尚未实际到账')
  expect((await controller.submit(controller.prepare('AdvanceTime',{date:'2020-01-05'}))).status).toBe('saved')
  p=snapshot();expect(sceneWorks(p).some(w=>w.status==='进行中，完成后仍需核对交付')).toBe(true)
  expect((await controller.submit(controller.prepare('AdvanceTime',{date:'2020-01-19'}))).status).toBe('saved')
  p=snapshot();works=sceneWorks(p);expect(works.some(w=>w.status==='作品已完成，等待你亲手提交')).toBe(true)
  expect(p.features.firstOrder.result.paymentFen).toBe(0)
  expect(controller.snapshot.view!.date).toBe('2020-01-19')
 }finally{await controller.close();await store.close()}
},20000)
