import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {PlayFeatures} from './game-types.ts'
import {NarrativeScene,SceneAttention} from './NarrativeScene.tsx'

async function normalScene(){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d05-narrative'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`film-${++id}`})
 await controller.initialize()
 await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'d05-scene-read-only'})
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures
 const noAction=()=>{throw Error('RENDER_MUST_NOT_MUTATE_OR_NAVIGATE')}
 return {controller,store,view,features,p:{controller,view,features,request:noAction,accountId:'personal',screen:'quarter' as const,headingRef:null,personId:'tang-ying' as const,onPerson:noAction,onOpen:noAction,onPeople:noAction,onYear:noAction,onNavigate:noAction,receipt:null}}
}

it('scene choices are read-only and keep delivery, end-of-range and read-only action guards',async()=>{
 const h=await normalScene(),before=h.controller.exportSaved()
 try{
  const first=renderToStaticMarkup(<NarrativeScene {...h.p}/>)
  expect(first).toContain('核对本季工作安排')
  expect(first).toContain('核对这笔手工第一单')
  expect(first).toContain('让日子向前')
  // Explicit UI projections exercise presentation guards; these are not completed campaigns.
  const delivery={...h.features,workbench:{...h.features.workbench,progression:{...h.features.workbench.progression,requiresDelivery:true}}}
  const waiting=renderToStaticMarkup(<NarrativeScene {...h.p} features={delivery}/>)
  expect(waiting).not.toContain('让日子向前')
  expect(waiting).toContain('先面对这份交付')
  const ended={...h.features,workbench:{...h.features.workbench,atQuarterEnd:true}}
  expect(renderToStaticMarkup(<NarrativeScene {...h.p} view={{...h.view,date:'2025-12-31'}} features={ended}/>)).not.toContain('走进下一季')
  const readOnly=renderToStaticMarkup(<NarrativeScene {...h.p} view={{...h.view,readOnly:true}}/>)
  expect(readOnly.match(/<button[^>]*aria-label="核对本季工作安排"[^>]*>/)?.[0]).toContain('disabled=""')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
},20000)

it('the cinematic layer retains every known account shortfall rather than selecting one highlight',async()=>{
 const h=await normalScene(),before=h.controller.exportSaved()
 try{
  const original=h.features.workbench.finance[0]!
  // Two deliberately bounded UI projections, never stored or claimed as normal financial history.
  const features={...h.features,workbench:{...h.features.workbench,finance:[{...original,protectionShortfallFen:100},{...original,accountId:'fixture-company',commitmentShortfallFen:250}]}}
  const html=renderToStaticMarkup(<SceneAttention p={{...h.p,features}} onOpen={h.p.onNavigate}/>)
  expect(html.match(/role="alert"/g)).toHaveLength(2)
  expect(html).toContain('个人承诺资金存在缺口')
  expect(html).toContain('企业承诺资金存在缺口')
  expect(html).toContain('¥2.50')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
},20000)
