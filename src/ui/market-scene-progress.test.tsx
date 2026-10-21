import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {marketSceneProgress} from './market-scene-progress.ts'
import {marketDraftPayload,type MarketSceneDraft} from './MarketSceneChoice.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {roomMoment} from './RoomMoment.tsx'

async function normal(id:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d09-market-'+id})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d09-market-${id}-${++sequence}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'d09-market-'+id})
 const p=():GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:()=>{throw Error('READ_ONLY_RENDER_MUST_NOT_REQUEST')}}}
 const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status,kind).toBe('saved')
 return {controller,store,p,send,close:async()=>{await controller.close();await store.close()}}
}
function draft(p:GamePanelProps,symbol='SIM-AI02'):MarketSceneDraft{
 const market=p.features.market,stock=market.stocks.find(s=>s.symbol===symbol)!
 return {accountId:'personal',symbol:stock.symbol,side:'buy',quantity:String(stock.rule!.lotSize),price:(stock.upperFen!/100).toFixed(2),expiry:market.matchingCalendar[1]!.id,quoteId:market.quoteId}
}
const noAction=()=>{throw Error('READ_ONLY_RENDER_MUST_NOT_NAVIGATE')}
function scene(p:GamePanelProps){return <NarrativeScene {...p} screen="market" headingRef={null} personId="tang-ying" onPerson={noAction} onOpen={noAction} onPeople={noAction} onYear={noAction} onNavigate={noAction} receipt={null}/>}

it('keeps the normal plan, submission and cancellation distinct and renders the actual original command guard',async()=>{
 const h=await normal('plan')
 try{
  const initial=h.p(),payload=marketDraftPayload(draft(initial),initial)!
  expect(payload.validUntil).toBe(initial.features.market.matchingCalendar[1]!.id)
  const cash=initial.view.accounts[0]!.cashFen,budget=initial.view.budget
  await h.send('PlanStockOrder',payload)
  let p=h.p(),progress=marketSceneProgress(p.features.market,p.view.date,'personal')
  expect(progress).toMatchObject({phase:'planned',active:true,command:{kind:'SubmitStockOrder',payload:{orderId:p.features.market.orders[0]!.id,quoteId:p.features.market.quoteId}}})
  expect(p.view.accounts[0]!.cashFen).toBe(cash);expect(p.view.budget).toEqual(budget)
  const held=p.features.market.orders[0]!.cashHeldFen,raw=h.controller.exportSaved()
  expect(held).toBeGreaterThan(0);expect(renderToStaticMarkup(scene(p))).toContain('这份判断，还只是一张计划')
  const readonly=renderToStaticMarkup(scene({...p,view:{...p.view,readOnly:true}}))
  expect(readonly.match(/<button[^>]*aria-label="核对并提交这份原计划"[^>]*>/)?.[0]).toContain('disabled=""')
  expect(h.controller.exportSaved()).toBe(raw)
  expect(roomMoment(p).command?.kind).toBe('SubmitStockOrder')
  await h.send(progress.command!.kind,progress.command!.payload)
  p=h.p();progress=marketSceneProgress(p.features.market,p.view.date,'personal')
  expect(progress.phase).toBe('pending');expect(progress.waitLabel).toContain('这份委托')
  expect(p.features.market.orders[0]!.cashHeldFen).toBe(held);expect(p.features.market.fills).toEqual([])
  await h.send(progress.secondaryCommand!.kind,progress.secondaryCommand!.payload)
  p=h.p();expect(p.features.market.orders[0]).toMatchObject({status:'cancelled',cashHeldFen:0})
  expect(p.view.accounts[0]!.cashFen).toBe(cash);expect(p.view.budget).toEqual(budget)
 }finally{await h.close()}
},20000)

it('requires a complete current public draft and leaves stale quotes and foreign accounts to the original barriers',async()=>{
 const h=await normal('draft')
 try{
  let p=h.p();const original=draft(p),raw=h.controller.exportSaved()
  expect(marketDraftPayload(original,p)).not.toBeNull()
  for(const invalid of [{...original,accountId:'not-controlled'},{...original,symbol:''},{...original,side:'' as const},{...original,quantity:'1.5'},{...original,price:'0'},{...original,expiry:'2020-01-20'},{...original,quoteId:'old-quote'}])expect(marketDraftPayload(invalid,p)).toBeNull()
  expect(h.controller.exportSaved()).toBe(raw)
  await h.send('AdvanceTime',{date:'2020-01-10'});p=h.p()
  expect(p.features.market.quoteId).not.toBe(original.quoteId)
  expect(marketDraftPayload(original,p)).toBeNull()
  expect(h.controller.preview(h.controller.prepare('PlaceStockOrder',{...marketDraftPayload(draft(p),p)!,accountId:'not-controlled'})).allowed).toBe(false)
 }finally{await h.close()}
},20000)

it('keeps real no-volume and partial fills, then releases only unfilled funds',async()=>{
 const h=await normal('partial')
 try{
  let p=h.p();const q=p.features.market.stocks.find(s=>s.symbol==='SIM-AI05')!
  await h.send('PlaceStockOrder',{accountId:'personal',symbol:q.symbol,side:'buy',quantity:2100,limitPriceFen:1000,quoteId:p.features.market.quoteId,validUntil:p.features.market.matchingCalendar[2]!.id})
  await h.send('AdvanceTime',{date:'2020-01-10'});p=h.p()
  expect(p.features.market.fills).toHaveLength(0);expect(p.features.market.orders[0]!.reason).toBe('NO_VOLUME')
  expect(marketSceneProgress(p.features.market,p.view.date,'personal')).toMatchObject({phase:'pending',nextDate:'2020-01-20'})
  await h.send('AdvanceTime',{date:'2020-01-20'});p=h.p()
  const actual=p.features.market.orders[0]!
  expect(actual).toMatchObject({status:'partially_filled',remaining:100})
  expect(marketSceneProgress(p.features.market,p.view.date,'personal').line).toContain('已成交2000股 / 余100股')
  const quantity=p.features.market.positions[0]!.quantity,cash=p.view.accounts[0]!.cashFen
  await h.send('CancelStockOrder',{orderId:actual.id});p=h.p()
  expect(p.features.market.positions[0]!.quantity).toBe(quantity);expect(p.view.accounts[0]!.cashFen).toBe(cash)
  expect(p.features.market.orders[0]!.cashHeldFen).toBe(0)
 }finally{await h.close()}
},20000)

it('presents real deferred sale proceeds as a dated wait and keeps research on the personal account',async()=>{
 const h=await normal('settlement')
 try{
  let p=h.p();await h.send('PlaceStockOrder',marketDraftPayload(draft(p),p)!)
  await h.send('AdvanceTime',{date:'2020-01-11'});p=h.p()
  const quote=p.features.market.stocks.find(s=>s.symbol==='SIM-AI02')!,position=p.features.market.positions[0]!
  await h.send('PlaceStockOrder',{accountId:'personal',symbol:quote.symbol,side:'sell',quantity:position.quantity,limitPriceFen:quote.lowerFen,quoteId:p.features.market.quoteId,validUntil:p.features.market.matchingCalendar[0]!.id})
  await h.send('AdvanceTime',{date:'2020-01-20'});p=h.p()
  const settlement=p.features.market.settlements.find(s=>s.paidAt===null)!
  expect(settlement).toBeDefined()
  const progress=marketSceneProgress(p.features.market,p.view.date,'personal')
  expect(progress).toMatchObject({phase:'settlement',active:true,nextDate:settlement.dueAt})
  expect(progress.line).toContain('眼下仍不可花')
  const before=h.controller.exportSaved();expect(renderToStaticMarkup(scene(p))).toContain('等这笔原款交收');expect(h.controller.exportSaved()).toBe(before)
  await h.send('AdvanceTime',{date:settlement.dueAt});p=h.p()
  expect(p.features.market.settlements.find(s=>s.id===settlement.id)!.paidAt).toBe(settlement.dueAt)
  expect(marketSceneProgress(p.features.market,p.view.date,'personal',settlement.id).active).toBe(false)
  const settledScene=renderToStaticMarkup(scene(p))
  expect(settledScene).toContain('再写一份新的买卖判断');expect(settledScene).toContain('下一份委托仍由你选择标的、方向、股数、限价与期限')
  expect(settledScene).not.toContain('核对这笔原交收')
  await h.send('ResearchMarket',{definitionId:'market-overview'});p=h.p()
  // Deliberate display selection only; no foreign account or campaign state is stored.
  const research=marketSceneProgress(p.features.market,p.view.date,'unowned-display-account')
  expect(research).toMatchObject({phase:'research',accountId:'personal'})
 }finally{await h.close()}
},20000)
