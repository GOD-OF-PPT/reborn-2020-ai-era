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
import {openingFocusFor,playerThread} from './player-thread.ts'

async function normal(id:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d09-market-'+id})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d09-market-${id}-${++sequence}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'d09-market-'+id})
 const p=():GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:()=>{throw Error('READ_ONLY_RENDER_MUST_NOT_REQUEST')}}}
 const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status,kind).toBe('saved')
 const advance=async(date:string,ready:()=>boolean=()=>true)=>{for(let n=0;n<35;n++){
  const w=p().features.workbench
  if(w.pause){expect(w.pause.reason).toBe('CONTENT_DECISION_PENDING');const event=w.events.find(event=>event.isBlocking)!,choice=event.choices.find(choice=>choice.isDefault)!;expect(choice).toMatchObject({costFen:0,actionPoints:0});await send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}
  if(p().view.date>=date&&ready())return
  await send('AdvanceTime',{date})
 }throw Error('MARKET_CONTINUATION_CLOCK_LIMIT')}
 return {controller,store,p,send,advance,close:async()=>{await controller.close();await store.close()}}
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
  expect(readonly.match(/<button[^>]*aria-label="提交这份模拟委托"[^>]*>/)?.[0]).toContain('disabled=""')
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

it('keeps the original normal Q1 sale waiting for its own Q2 cash and dates the actual result without replacing its pin',async()=>{
 const h=await normal('source-crossquarter')
 try{
  await h.send('PlaceStockOrder',marketDraftPayload(draft(h.p()),h.p())!)
  await h.advance('2020-01-11')
  await h.advance('2020-03-30')
  let p=h.p();const quote=p.features.market.stocks.find(stock=>stock.symbol==='SIM-AI02')!,position=p.features.market.positions.find(position=>position.symbol===quote.symbol)!
  await h.send('PlaceStockOrder',{accountId:'personal',symbol:quote.symbol,side:'sell',quantity:position.quantity,limitPriceFen:quote.lowerFen,quoteId:p.features.market.quoteId,validUntil:p.features.market.matchingCalendar.find(point=>point.date==='2020-03-31')!.id})
  p=h.p();const sale=p.features.market.orders.find(order=>order.side==='sell')!,focus=openingFocusFor(p,'market',{accountId:'personal',recordId:sale.id})!
  await h.advance('2020-03-31',()=>h.p().features.market.orders.find(order=>order.id===sale.id)?.status==='filled')
  p=h.p();const fill=p.features.market.fills.find(fill=>fill.orderId===sale.id)!,settlement=p.features.market.settlements.find(settlement=>settlement.sourceId===fill.id)!
  expect(settlement).toMatchObject({accountId:'personal',dueAt:'2020-04-01',paidAt:null})
  const raw=h.controller.exportSaved(),progress=marketSceneProgress(p.features.market,p.view.date,'personal',sale.id),thread=playerThread(p,focus,'2020-Q1')
  expect(progress).toMatchObject({phase:'settlement',active:true,entityId:sale.id,nextDate:settlement.dueAt,order:{id:sale.id},settlement:{id:settlement.id}})
  expect(thread).toMatchObject({focus:{entityId:sale.id,accountId:'personal'},wait:{date:settlement.dueAt}})
  expect(thread.resultRefs.some(ref=>ref.kind==='settlement')).toBe(false)
  expect(thread.inspect.target?.recordId).toBe(sale.id)
  // These public display counterexamples are never stored or called a valid financial run.
  const buyFill=p.features.market.fills.find(fill=>fill.orderId!==sale.id)!
  for(const replacement of [{...settlement,sourceId:buyFill.id},{...settlement,accountId:'another-account'}]){
   const display={...p.features.market,settlements:p.features.market.settlements.map(row=>row.id===settlement.id?replacement:row)}
   expect(marketSceneProgress(display,p.view.date,'personal',sale.id).nextDate).toBeUndefined()
  }
  expect(marketSceneProgress(p.features.market,'2020-04-02','personal',sale.id).nextDate).toBe('2020-04-02')
  expect(h.controller.exportSaved()).toBe(raw)
  await h.advance(settlement.dueAt,()=>h.p().features.market.settlements.find(row=>row.id===settlement.id)?.paidAt!==null)
  p=h.p();const paid=playerThread(p,focus,'2020-Q1'),saved=h.controller.exportSaved()
  expect(paid).toMatchObject({focusScope:'current',focusQuarter:'2020-Q1',focus:{entityId:sale.id},outcome:'actual'})
  expect(paid.resultRefs).toContainEqual({kind:'settlement',id:settlement.id,date:'2020-04-01'})
  expect(paid.line).not.toContain('旧收支不会重记为本季收入')
  expect(paid.wait).toBeUndefined();expect(paid.command).toBeUndefined()
  expect(p.features.market.settlements.find(row=>row.id===settlement.id)!.paidAt).toBe('2020-04-01')
  for(const replacement of [{...settlement,sourceId:buyFill.id},{...settlement,accountId:'another-account'}]){
   const display={...p,features:{...p.features,market:{...p.features.market,settlements:p.features.market.settlements.map(row=>row.id===settlement.id?replacement:row)}}}
   const unrelated=playerThread(display,focus,'2020-Q1')
   expect(unrelated.focusScope).toBe('history');expect(unrelated.wait).toBeUndefined()
   expect(unrelated.resultRefs.some(ref=>ref.kind==='settlement')).toBe(false)
  }
  expect(h.controller.exportSaved()).toBe(saved)
 }finally{await h.close()}
},20000)

it('keeps a real partially filled sale cancellable while its own earlier cash settlement still waits',async()=>{
 const h=await normal('source-partial-sale')
 try{
  let p=h.p();const original=marketDraftPayload(draft(p),p)!
  await h.send('PlaceStockOrder',{...original,quantity:600,validUntil:p.features.market.matchingCalendar[2]!.id})
  await h.advance('2020-01-21',()=>h.p().features.market.positions.some(position=>position.quantity===600&&position.settledQuantity===600))
  await h.advance('2020-02-19')
  p=h.p();const quote=p.features.market.stocks.find(stock=>stock.symbol==='SIM-AI02')!
  await h.send('PlaceStockOrder',{accountId:'personal',symbol:quote.symbol,side:'sell',quantity:600,limitPriceFen:quote.lowerFen,quoteId:p.features.market.quoteId,validUntil:p.features.market.matchingCalendar.find(point=>point.date==='2020-02-29')!.id})
  const sale=h.p().features.market.orders.find(order=>order.side==='sell')!
  await h.advance('2020-02-20',()=>h.p().features.market.orders.find(order=>order.id===sale.id)?.status==='partially_filled')
  p=h.p();const fill=p.features.market.fills.find(fill=>fill.orderId===sale.id)!,settlement=p.features.market.settlements.find(row=>row.sourceId===fill.id)!
  expect(p.features.market.orders.find(order=>order.id===sale.id)).toMatchObject({status:'partially_filled',remaining:100})
  const progress=marketSceneProgress(p.features.market,p.view.date,'personal',sale.id)
  expect(progress).toMatchObject({phase:'partial',active:true,entityId:sale.id,nextDate:settlement.dueAt,secondaryCommand:{kind:'CancelStockOrder',payload:{orderId:sale.id}}})
  expect(progress.line).toContain('交收')
  const cash=p.view.accounts.find(account=>account.accountId==='personal')!.cashFen,budget=p.view.budget
  await h.send(progress.secondaryCommand!.kind,progress.secondaryCommand!.payload)
  p=h.p();expect(p.view.accounts.find(account=>account.accountId==='personal')!.cashFen).toBe(cash);expect(p.view.budget).toEqual(budget)
  expect(marketSceneProgress(p.features.market,p.view.date,'personal',sale.id)).toMatchObject({phase:'settlement',entityId:sale.id,nextDate:settlement.dueAt})
  expect(p.features.market.positions.find(position=>position.symbol===quote.symbol)!.quantity).toBe(100)
  await h.advance(settlement.dueAt,()=>h.p().features.market.settlements.find(row=>row.id===settlement.id)?.paidAt!==null)
  p=h.p();expect(p.view.accounts.find(account=>account.accountId==='personal')!.cashFen).toBe(cash+settlement.amountFen)
  expect(marketSceneProgress(p.features.market,p.view.date,'personal',sale.id)).toMatchObject({phase:'history',active:false,entityId:sale.id})
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
  const originalSale=p.features.market.orders.find(order=>order.side==='sell')!
  const originalProgress=marketSceneProgress(p.features.market,p.view.date,'personal',originalSale.id)
  expect(originalProgress).toMatchObject({phase:'settlement',active:true,entityId:originalSale.id,order:{id:originalSale.id},settlement:{id:settlement.id},nextDate:settlement.dueAt})
  expect(originalProgress.command).toBeUndefined();expect(originalProgress.secondaryCommand).toBeUndefined()
  expect(progress.line).toContain('眼下仍不可花')
  const before=h.controller.exportSaved();expect(renderToStaticMarkup(scene(p))).toContain('等这笔款交收');expect(h.controller.exportSaved()).toBe(before)
  await h.send('AdvanceTime',{date:settlement.dueAt});p=h.p()
  expect(p.features.market.settlements.find(s=>s.id===settlement.id)!.paidAt).toBe(settlement.dueAt)
  expect(marketSceneProgress(p.features.market,p.view.date,'personal',settlement.id).active).toBe(false)
  const settledScene=renderToStaticMarkup(scene(p))
  expect(settledScene).toContain('填写一份新的买卖委托');expect(settledScene).toContain('股票、买卖方向、股数、限价和期限，都由你决定')
  expect(settledScene.match(/aria-label="翻看全部模拟行情、委托与交收"/g)).toHaveLength(1)
  expect(settledScene).not.toContain('核对这笔原交收')
  await h.send('ResearchMarket',{definitionId:'market-overview'});p=h.p()
  // Deliberate display selection only; no foreign account or campaign state is stored.
  const research=marketSceneProgress(p.features.market,p.view.date,'unowned-display-account')
  expect(research).toMatchObject({phase:'research',accountId:'personal'})
 }finally{await h.close()}
},20000)
