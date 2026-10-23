import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {NarrativeScene} from './NarrativeScene.tsx'

it.each(['completed','interrupted'] as const)('keeps the original actual %s research in the narrative instead of a different planned order',async outcome=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'s1-narrative-research-'+outcome})
 let count=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`s1-research-${outcome}-${++count}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'investment'},seed:'s1-narrative-research-'+outcome})
 const features=()=>controller.snapshot.view!.features as unknown as PlayFeatures
 const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')
 const noAction=()=>{throw Error('READING_MUST_NOT_ACT')}
 try{
  const market=features().market,stock=market.stocks.find(s=>s.symbol==='SIM-AI01')!
  await send('PlanStockOrder',{accountId:'personal',symbol:stock.symbol,side:'buy',quantity:100,limitPriceFen:stock.upperFen!,quoteId:market.quoteId!,validUntil:market.matchingCalendar[0]!.id})
  const order=features().market.orders.at(-1)!
  await send('ResearchMarket',{definitionId:'market-overview'})
  const research=features().market.researches.at(-1)!
  if(outcome==='completed')await send('AdvanceTime',{date:research.completeAt})
  else await send('StopMarketResearch',{researchId:research.id})
  expect(features().market.researches.find(r=>r.id===research.id)?.status).toBe(outcome)
  expect(features().market.orders.find(o=>o.id===order.id)?.status).toBe('planned')
  const view=controller.snapshot.view!,before=controller.exportSaved()
  const p:GamePanelProps={controller,view,features:features(),accountId:'personal',request:noAction}
  const render=(props:GamePanelProps,recordId=research.id)=>renderToStaticMarkup(<NarrativeScene {...props} screen="market" marketRecordId={recordId} headingRef={null} personId="tang-ying" onPerson={noAction} onOpen={noAction} onPeople={noAction} onYear={noAction} onNavigate={noAction} receipt={null}/>)
  // Readonly/candidate variants are bounded public UI copies, never imported as normal saved runs.
  for(const props of [p,{...p,view:{...view,readOnly:true}},{...p,view:{...view,hasCandidate:true,saveStatus:'unsaved' as const}}]){
   const html=render(props)
   expect(html).toContain(outcome==='completed'?'这次公开研究，已经完成。':'这次研究，已经中断。')
   expect(html).toContain('翻看这项原研究与实际记录')
   expect(html).toContain('data-market-record-id="'+research.id+'"')
   expect(html).not.toContain('这份判断，还只是一张计划。')
   expect(html).not.toContain('选择一份模拟委托')
   expect(html).not.toContain('data-market-record-id="'+order.id+'"')
   expect(controller.exportSaved()).toBe(before)
  }
  const invalid=render(p,'missing-research')
  expect(invalid).toContain('先找回原来的那份委托。')
  expect(invalid).not.toContain('翻看这项原研究与实际记录')
  expect(invalid).not.toContain('这份判断，还只是一张计划。')
  expect(controller.exportSaved()).toBe(before)
 }finally{await controller.close();await store.close()}
})
