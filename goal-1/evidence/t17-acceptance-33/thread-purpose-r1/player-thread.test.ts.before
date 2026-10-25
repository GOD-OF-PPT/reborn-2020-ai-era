import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec,createCampaignRun} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {RunSession} from '../application/session.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import type {GamePanelProps,PlayingView,PlayFeatures} from './game-types.ts'
import type {OpeningFocus} from './player-thread.ts'
import {openingFocusAfterSave,openingFocusFor,playerThread} from './player-thread.ts'
import retainedWorkQ2Raw from '../../goal-1/evidence/t17-acceptance-22/chrome-production-r4/work-q2-r4-original-readback.json?raw'

type Input=Pick<GamePanelProps,'view'|'features'>
const input=(view:PlayingView):Input=>({view,features:view.features as unknown as PlayFeatures})
async function normal(name:string,approach:PlayingView['playerProfile']['approach']='free',backgroundId:'technical_employee'|'content_employee'='technical_employee',raw?:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'s1-thread-'+name})
 let count=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`s1-thread-${name}-${++count}`})
 await controller.initialize()
 if(raw)await controller.importNew(raw)
 else await controller.newLife({backgroundId,playerProfile:{wishId:'autonomy',approach},seed:'s1-thread-'+name})
 const p=()=>input(controller.snapshot.view!)
 const send=async(kind:string,payload:unknown)=>{const result=await controller.submit(controller.prepare(kind,payload));expect(result.status,JSON.stringify({kind,payload,result})).toBe('saved')}
 const advance=async(date:string)=>{for(let i=0;i<20;i++){
  const w=p().features.workbench
  if(w.pause){
   expect(w.pause.reason).toBe('CONTENT_DECISION_PENDING')
   const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!
   expect(choice).toMatchObject({costFen:0,actionPoints:0})
   await send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue
  }
  if(p().view.date>=date)return
  await send('AdvanceTime',{date})
 }throw Error('S1_THREAD_CLOCK_LIMIT')}
 const reopen=async()=>{const runId=p().view.runId,saved=controller.exportSaved();await controller.home();await controller.continueLife(runId);expect(controller.exportSaved()).toBe(saved);return p()}
 return {controller,p,send,advance,reopen,close:async()=>{await controller.close();await store.close()}}
}

it.each(['first_order','investment','free'] as const)('responds to the real %s opening without executing or mutating a life',async approach=>{
 const h=await normal('opening-'+approach,approach)
 try{
  const before=h.controller.exportSaved(),thread=playerThread(h.p())
  expect(thread.focus.kind).toBe({first_order:'first-order',investment:'market',free:'free'}[approach])
  expect(thread.wish).toEqual({id:'autonomy',label:'保持生活自主'})
  expect(thread.resultRefs).toEqual([]);expect(thread.outcome).toBe('none')
  if(approach!=='first_order')expect(thread.command?.kind).not.toBe('StartFirstOrder')
  if(approach==='free')expect(thread.command).toBeUndefined()
  for(let i=0;i<4;i++)expect(playerThread(h.p())).toEqual(thread)
  expect(h.controller.exportSaved()).toBe(before)
  expect(h.p().view.accounts.find(a=>a.accountId==='personal')!.cashFen).toBe(2600000)
  expect(h.p().view.budget.available).toBe(4)
 }finally{await h.close()}
})

it.each(['technical_employee','content_employee'] as const)('keeps the %s actual first-order stages and atomic payment tied to one original contract',async background=>{
 const h=await normal('first-'+background,'first_order',background)
 try{
  let focus=playerThread(h.p()).focus
  await h.send('WorkQuarter',{});await h.send('StartFirstOrder',{})
  let thread=playerThread(h.p(),focus);focus=thread.focus
  expect(thread).toMatchObject({stage:'planned',outcome:'pending',wait:{date:'2020-01-05'},resultRefs:[]})
  expect(focus.entityId).toBe(h.p().features.firstOrder.contractId)
  expect(openingFocusFor(h.p(),thread.inspect.screen,thread.inspect.target)).toEqual(focus)
  expect(h.p().view.budget).toMatchObject({available:1,reserved:1})
  await h.send('AdvanceTime',{date:'2020-01-05'})
  expect(playerThread(h.p(),focus)).toMatchObject({stage:'running',wait:{date:'2020-01-19'},resultRefs:[]})
  await h.send('AdvanceTime',{date:'2020-01-19'})
  thread=playerThread(h.p(),focus)
  expect(thread).toMatchObject({stage:'delivery',outcome:'pending',command:{kind:'SubmitDelivery',payload:{contractId:focus.entityId}}})
  expect(thread.resultRefs).toEqual([{kind:'job',id:h.p().features.firstOrder.jobId,date:'2020-01-19'}])
  await h.send(thread.command!.kind,thread.command!.payload)
  expect(playerThread(h.p(),focus)).toMatchObject({stage:'waiting',outcome:'pending'})
  expect(h.p().features.firstOrder.result.paymentFen).toBe(0)
  await h.send('AdvanceTime',{date:'2020-01-20'})
  thread=playerThread(h.p(),focus)
  expect(thread).toMatchObject({stage:'paid',outcome:'actual',focus:{entityId:focus.entityId}})
  expect(thread.command).toBeUndefined();expect(thread.wait).toBeUndefined()
  expect(thread.line).toContain('¥1,300');expect(thread.line).toContain('¥800')
  const payments=thread.resultRefs.filter(ref=>ref.kind==='payment')
  expect(payments).toHaveLength(1);expect(payments[0]!.date).toBe('2020-01-20')
  expect(h.p().features.workbench.finance[0]!.transactions.some(tx=>tx.id===payments[0]!.id&&tx.amountFen===130000)).toBe(true)
  expect(h.p().features.firstOrder.result).toMatchObject({directCostFen:50000,paymentFen:130000,netOrderFen:80000})
  await h.reopen()
  expect(playerThread(h.p())).toMatchObject({stage:'paid',outcome:'actual',focus:{entityId:focus.entityId}})
 }finally{await h.close()}
})

it.each(['declined','skipped','expired','cancelled','interrupted','missed'] as const)('preserves the real %s first-order exit without a success, reward or replacement order',async state=>{
 const h=await normal('exit-'+state,'first_order')
 try{
  const focus=playerThread(h.p()).focus
  if(state==='declined'||state==='skipped')await h.send(state==='declined'?'DeclineOffer':'SkipOffer',{offerId:h.p().features.firstOrder.offerId})
  else if(state==='expired')await h.send('AdvanceTime',{date:'2020-01-06'})
  else{
   await h.send('StartFirstOrder',{})
   if(state==='cancelled')await h.send('CancelContract',{contractId:h.p().features.firstOrder.contractId})
   if(state==='interrupted'){await h.send('AdvanceTime',{date:'2020-01-05'});await h.send('InterruptJob',{jobId:h.p().features.firstOrder.jobId})}
   if(state==='missed')await h.send('AdvanceTime',{date:'2020-01-20'})
  }
  const before=h.controller.exportSaved(),thread=playerThread(h.p(),focus)
  expect(thread.stage).toBe(state);expect(thread.outcome).toBe('non-success')
  expect(thread.command?.kind).not.toBe('StartFirstOrder');expect(thread.command?.kind).not.toBe('SubmitDelivery')
  expect(thread.resultRefs.some(ref=>ref.kind==='payment')).toBe(false)
  expect(h.p().features.firstOrder.result.paymentFen).toBe(0)
  expect(h.p().features.firstOrder.paidCaseAvailable).toBe(false)
  if(state==='interrupted'||state==='missed')expect(h.p().features.firstOrder.result.directCostFen).toBe(50000)
  if(state==='cancelled')expect(h.p().view.budget).toMatchObject({available:4,reserved:0,spent:0})
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
})

it('keeps a selected normal market order through actual matching, and never substitutes its resulting position',async()=>{
 const h=await normal('market','investment')
 try{
  const m=h.p().features.market,stock=m.stocks.find(s=>s.symbol==='SIM-AI01')!
  await h.send('PlanStockOrder',{accountId:'personal',symbol:stock.symbol,side:'buy',quantity:100,limitPriceFen:stock.upperFen!,quoteId:m.quoteId!,validUntil:m.matchingCalendar[0]!.id})
  const focus=openingFocusFor(h.p(),'market')!,planned=playerThread(h.p(),focus)
  expect(planned).toMatchObject({stage:'market-planned',focus:{entityKind:'order'},command:{kind:'SubmitStockOrder'},inspect:{target:{recordId:focus.entityId,accountId:'personal'}}})
  await h.send(planned.command!.kind,planned.command!.payload)
  expect(playerThread(h.p(),focus)).toMatchObject({stage:'market-pending',wait:{date:m.matchingCalendar[0]!.date}})
  await h.send('AdvanceTime',{date:m.matchingCalendar[0]!.date})
  const current=playerThread(h.p(),focus)
  expect(current.focus.entityId).toBe(focus.entityId)
  expect(current.stage).toBe('market-history');expect(current.outcome).toBe('actual')
  expect(current.resultRefs.some(ref=>ref.kind==='fill'&&h.p().features.market.fills.some(fill=>fill.id===ref.id&&fill.orderId===focus.entityId))).toBe(true)
  expect(h.p().features.market.positions.some(pos=>pos.quantity===100)).toBe(true)
  const position=h.p().features.market.positions.find(pos=>pos.quantity===100)!,positionFocus=openingFocusFor(h.p(),'market',{accountId:'personal',recordId:position.id})!
  expect(playerThread(h.p(),positionFocus)).toMatchObject({stage:'market-position',outcome:'actual',resultRefs:current.resultRefs})
  expect(current.command?.kind).not.toBe('StartFirstOrder')
  await h.reopen()
  expect(playerThread(h.p())).toMatchObject({stage:'market-history',outcome:'actual',focus:{entityId:focus.entityId}})
  const wrong=playerThread(h.p(),{...focus,entityId:'missing-order'})
  expect(wrong).toMatchObject({focusStatus:'invalid',outcome:'none',resultRefs:[]})
  expect(wrong.command).toBeUndefined();expect(wrong.focus.entityId).toBe('missing-order')
 }finally{await h.close()}
})

it('retains a cancelled market order as a non-success and a finished research as its own public object',async()=>{
 const h=await normal('market-exits','investment')
 try{
  const m=h.p().features.market,stock=m.stocks.find(s=>s.symbol==='SIM-AI01')!
  await h.send('PlanStockOrder',{accountId:'personal',symbol:stock.symbol,side:'buy',quantity:100,limitPriceFen:stock.upperFen!,quoteId:m.quoteId!,validUntil:m.matchingCalendar[0]!.id})
  const order=openingFocusFor(h.p(),'market')!
  await h.send('CancelStockOrder',{orderId:order.entityId})
  expect(playerThread(h.p(),order)).toMatchObject({stage:'market-history',outcome:'non-success',resultRefs:[]})
  await h.send('ResearchMarket',{definitionId:'market-overview'})
  const research=h.p().features.market.researches.at(-1)!,focus=openingFocusFor(h.p(),'market',{recordId:research.id})!
  await h.send('AdvanceTime',{date:research.completeAt})
  const thread=playerThread(h.p(),focus)
  expect(thread).toMatchObject({stage:'market-research-completed',focus:{entityId:research.id,entityKind:'research'},resultRefs:[{kind:'research',id:research.id,date:research.completeAt}]})
  expect(thread.command).toBeUndefined();expect(h.p().features.market.fills).toHaveLength(0)
 }finally{await h.close()}
})

it('passes initial life selections without a record ID, then binds the actual saved rest job to the original record',async()=>{
 const h=await normal('life-selection-record')
 try{
  const before=h.controller.exportSaved()
  for(const selection of ['rest','workspace','tang-ying'] as const){
   const focus=openingFocusFor(h.p(),'life',selection==='tang-ying'?{accountId:'personal',lifeSelection:'person',personId:selection}:{accountId:'personal',lifeSelection:selection})!
   const ready=playerThread(h.p(),focus)
   expect(ready.inspect.target).toEqual(selection==='tang-ying'?{accountId:'personal',lifeSelection:'person',personId:selection}:{accountId:'personal',lifeSelection:selection})
   expect(ready.inspect.target).not.toHaveProperty('recordId')
  }
  expect(h.controller.exportSaved()).toBe(before)
  const focus=openingFocusFor(h.p(),'life',{accountId:'personal',lifeSelection:'rest'})!,ready=playerThread(h.p(),focus)
  expect(ready.stage).toBe('life-ready');expect(ready.inspect.target).toEqual({accountId:'personal',lifeSelection:'rest'})
  await h.send(ready.command!.kind,ready.command!.payload)
  const job=h.p().features.life.jobs.at(-1)!,running=playerThread(h.p(),focus)
  expect(running.focus.entityId).toBe(job.id)
  expect(running.inspect.target).toEqual({accountId:'personal',lifeSelection:'rest',recordId:job.id})
  expect(openingFocusFor(h.p(),running.inspect.screen,running.inspect.target)).toEqual(running.focus)
 }finally{await h.close()}
})

it('binds free life navigation to the actual job and keeps its completion separate from a new invitation',async()=>{
 const h=await normal('life')
 try{
  let focus=openingFocusFor(h.p(),'life',{personId:'tang-ying',lifeSelection:'person',accountId:'personal'})!
  const ready=playerThread(h.p(),focus)
  expect(ready).toMatchObject({stage:'life-ready',command:{kind:'StartLifeWork',payload:{kind:'friend_visit',personId:'tang-ying'}}})
  await h.send(ready.command!.kind,ready.command!.payload)
  let thread=playerThread(h.p(),focus);focus=thread.focus
  const job=h.p().features.life.jobs.at(-1)!
  expect(focus.entityId).toBe(job.id);expect(thread).toMatchObject({stage:'life-running',wait:{date:job.completeAt}})
  expect(thread.inspect.target).toMatchObject({accountId:'personal',recordId:job.id,personId:'tang-ying',lifeSelection:'person'})
  await h.send('AdvanceTime',{date:job.completeAt})
  thread=playerThread(h.p(),focus)
  expect(thread).toMatchObject({stage:'life-completed',outcome:'actual',focus:{entityId:job.id},resultRefs:[{kind:'job',id:job.id,date:job.completeAt}]})
  expect(thread.command).toBeUndefined()
  const promise=h.p().features.life.promises.at(-1)!
  await h.send('AcceptLifePromise',{promiseId:promise.id,consent:true})
  expect(playerThread(h.p(),focus).responsibilityOverrideNeeded).toBe(false)
  expect(playerThread(h.p(),focus).focus.entityId).toBe(job.id)
 }finally{await h.close()}
})

it('lets a free life retain real work and salary without making it exclusive with the manual order',async()=>{
 const h=await normal('work')
 try{
  let focus=openingFocusFor(h.p(),'quarter')!
  expect(playerThread(h.p(),focus)).toMatchObject({stage:'work-offer',command:{kind:'WorkQuarter'}})
  await h.send('WorkQuarter',{});await h.send('StartFirstOrder',{})
  let thread=playerThread(h.p(),focus);focus=thread.focus
  expect(thread).toMatchObject({stage:'work-scheduled',wait:{date:'2020-01-31'}})
  expect(h.p().view.budget).toMatchObject({available:1,reserved:1})
  // The first-order delivery really interrupts this ordinary work focus without replacing its identity.
  await h.send('AdvanceTime',{date:'2020-01-19'})
  expect(playerThread(h.p(),focus)).toMatchObject({focus:{entityId:focus.entityId},responsibilityOverrideNeeded:true})
  await h.send('SubmitDelivery',{contractId:h.p().features.firstOrder.contractId})
  await h.send('AdvanceTime',{date:'2020-01-20'})
  await h.advance('2020-01-31')
  thread=playerThread(h.p(),focus)
  expect(thread.stage).toBe('work-paid')
  expect(thread.wait).toEqual({date:'2020-02-29',label:'等下一次原工作日历反馈'})
  expect(thread.resultRefs.some(ref=>ref.kind==='payroll'&&h.p().view.operations!.payroll.some(row=>row.id===ref.id&&row.kind==='salary'))).toBe(true)
  expect(thread.focus.entityId).toBe(focus.entityId)
 }finally{await h.close()}
})

it('keeps a current-quarter work entry empty until an actual new work decision, while the specified old salary stays historical',async()=>{
 const h=await normal('work-current-entry','free','technical_employee',retainedWorkQ2Raw)
 try{
  const p=h.p(),old=p.view.operations!.employment.find(period=>period.quarter==='2020-Q1')!
  expect(p.view.date).toBe('2020-04-01');expect(p.features.workbench.quarter).toBe('2020-Q2')
  expect(p.view.operations!.employment.some(period=>period.quarter==='2020-Q2')).toBe(false)
  const historical=openingFocusFor(p,'quarter',{accountId:'personal',recordId:old.id})!
  const originalThread=playerThread(p,historical,'2020-Q1'),raw=h.controller.exportSaved(),budget=p.view.budget,accounts=p.view.accounts
  expect(originalThread).toMatchObject({focusScope:'history',focus:{entityId:old.id}})
  expect(originalThread.command).toBeUndefined()
  const entry=openingFocusFor(p,'quarter',{accountId:'personal'})!,today=playerThread(p,entry,'2020-Q2')
  expect(entry).toMatchObject({kind:'work',entityId:null})
  expect(today).toMatchObject({focusScope:'entry',stage:'work-offer',command:{kind:'WorkQuarter',payload:{},confirm:true}})
  // Defensive display boundary only: this is not imported or represented as a normal campaign.
  const withHistoricalRows={...p,features:{...p.features,workbench:{...p.features.workbench,employment:[...p.view.operations!.employment]}}}
  expect(openingFocusFor(withHistoricalRows,'quarter',{accountId:'personal'})).toMatchObject({kind:'work',entityId:null})
  expect(today.resultRefs).toEqual([]);expect(today.wait).toBeUndefined()
  expect(h.controller.preview(h.controller.prepare('WorkQuarter',{})).allowed).toBe(true)
  expect(h.controller.exportSaved()).toBe(raw);expect(h.p().view.budget).toEqual(budget);expect(h.p().view.accounts).toEqual(accounts)
  await h.send('WorkQuarter',{})
  const current=openingFocusFor(h.p(),'quarter',{accountId:'personal'})!,period=h.p().view.operations!.employment.find(period=>period.quarter==='2020-Q2')!
  expect(current.entityId).toBe(period.id);expect(current.entityId).not.toBe(old.id)
  expect(playerThread(h.p(),historical,'2020-Q1').resultRefs).toEqual(originalThread.resultRefs)
  expect(playerThread(h.p(),historical,'2020-Q1').command).toBeUndefined()
 }finally{await h.close()}
})

it('explains cross-run, cross-account and mismatched life identity without choosing a replacement',async()=>{
 const h=await normal('identity')
 try{
  const base:OpeningFocus={runId:h.p().view.runId,kind:'market',accountId:'personal',entityId:null}
  for(const focus of [{...base,runId:'another-life'},{...base,accountId:'missing-account'},{runId:base.runId,kind:'life' as const,accountId:'personal',entityId:'missing-job',selection:'rest' as const}]){
   const thread=playerThread(h.p(),focus)
   expect(thread.focusStatus).toBe('invalid');expect(thread.invalidReason).toBeTruthy()
   expect(thread.command).toBeUndefined();expect(thread.resultRefs).toEqual([])
   expect(thread.focus).toEqual(focus)
  }
 }finally{await h.close()}
})

it('follows explicit saved first-order choices while work and time do not steal another intended object',async()=>{
 const h=await normal('saved-focus')
 try{
  const free=playerThread(h.p()).focus,market=openingFocusFor(h.p(),'market')!
  let previous=h.p();await h.send('WorkQuarter',{});let current=h.p()
  expect(openingFocusAfterSave(previous,current,'WorkQuarter',{},free)).toMatchObject({kind:'work',entityId:current.features.workbench.employment[0]!.id})
  expect(openingFocusAfterSave(previous,current,'WorkQuarter',{},market)).toBe(market)
  expect(openingFocusAfterSave(previous,current,'WorkQuarter',{},null)?.kind).toBe('work')
  expect(openingFocusAfterSave(previous,{...current,view:{...current.view,hasCandidate:true}},'WorkQuarter',{},free)).toBe(free)
  expect(openingFocusAfterSave(previous,{...current,view:{...current.view,readOnly:true}},'WorkQuarter',{},free)).toBe(free)
  expect(openingFocusAfterSave(current,current,'WorkQuarter',{},free)).toBe(free)
  previous=h.p();await h.send('StartFirstOrder',{});current=h.p()
  const first=openingFocusAfterSave(previous,current,'StartFirstOrder',{},free)!
  expect(first).toMatchObject({kind:'first-order',entityId:current.features.firstOrder.contractId,businessId:current.features.firstOrder.businessId})
  expect(openingFocusAfterSave(previous,current,'ReadNews',{},market)).toBe(market)
  previous=h.p();await h.send('AdvanceTime',{date:'2020-01-05'});current=h.p()
  expect(openingFocusAfterSave(previous,current,'AdvanceTime',{date:current.view.date},first)).toBe(first)
  const jobId=current.features.firstOrder.jobId
  previous=h.p();await h.send('InterruptJob',{jobId});current=h.p()
  expect(openingFocusAfterSave(previous,current,'InterruptJob',{jobId},market)?.kind).toBe('first-order')
  expect(openingFocusAfterSave(previous,current,'InterruptJob',{jobId:'different-job'},market)).toBe(market)
 }finally{await h.close()}
})

it('binds newly saved orders, amendments and research by public identity and original account',async()=>{
 const h=await normal('saved-market')
 try{
  const existing=playerThread(h.p()).focus,m=h.p().features.market,stock=m.stocks.find(s=>s.symbol==='SIM-AI01')!
  const payload={accountId:'personal',symbol:stock.symbol,side:'buy',quantity:100,limitPriceFen:stock.upperFen!,quoteId:m.quoteId!,validUntil:m.matchingCalendar[0]!.id}
  let previous=h.p();await h.send('PlanStockOrder',payload);let current=h.p()
  let focus=openingFocusAfterSave(previous,current,'PlanStockOrder',payload,existing)!
  expect(focus).toMatchObject({kind:'market',accountId:'personal',entityId:current.features.market.orders.at(-1)!.id,entityKind:'order'})
  expect(openingFocusAfterSave(previous,current,'PlanStockOrder',{...payload,accountId:'missing-account'},existing)).toBe(existing)
  const submit={orderId:focus.entityId,quoteId:current.features.market.quoteId}
  previous=h.p();await h.send('SubmitStockOrder',submit);current=h.p()
  expect(openingFocusAfterSave(previous,current,'SubmitStockOrder',submit,existing)?.entityId).toBe(focus.entityId)
  const amendment={orderId:focus.entityId,quantity:100,limitPriceFen:stock.upperFen!,quoteId:current.features.market.quoteId,validUntil:m.matchingCalendar[0]!.id}
  previous=h.p();await h.send('AmendStockOrder',amendment);current=h.p()
  const amended=openingFocusAfterSave(previous,current,'AmendStockOrder',amendment,focus)!
  expect(amended.entityId).not.toBe(focus.entityId)
  expect(current.features.market.orders.find(o=>o.id===amended.entityId)?.replacesId).toBe(focus.entityId)
  focus=amended
  const cancel={orderId:focus.entityId}
  previous=h.p();await h.send('CancelStockOrder',cancel);current=h.p()
  expect(openingFocusAfterSave(previous,current,'CancelStockOrder',cancel,existing)?.entityId).toBe(focus.entityId)
  const research={definitionId:'market-overview'}
  previous=h.p();await h.send('ResearchMarket',research);current=h.p()
  const researched=openingFocusAfterSave(previous,current,'ResearchMarket',research,focus)!
  expect(researched).toMatchObject({kind:'market',entityKind:'research',entityId:current.features.market.researches.at(-1)!.id})
 }finally{await h.close()}
})

it('follows saved life work and a particular promise without inventing a different person or completion',async()=>{
 const h=await normal('saved-life')
 try{
  const existing=playerThread(h.p()).focus,start={kind:'friend_visit',personId:'tang-ying',reference:null}
  let previous=h.p();await h.send('StartLifeWork',start);let current=h.p()
  let focus=openingFocusAfterSave(previous,current,'StartLifeWork',start,existing)!
  expect(focus).toMatchObject({kind:'life',selection:'tang-ying',entityId:current.features.life.jobs.at(-1)!.id})
  await h.send('AdvanceTime',{date:current.features.life.jobs.at(-1)!.completeAt})
  const promise=h.p().features.life.promises.at(-1)!,accept={promiseId:promise.id,consent:true}
  previous=h.p();await h.send('AcceptLifePromise',accept);current=h.p()
  focus=openingFocusAfterSave(previous,current,'AcceptLifePromise',accept,focus)!
  expect(focus).toMatchObject({kind:'life',entityId:promise.id,selection:promise.personId})
  expect(playerThread(current,focus)).toMatchObject({stage:'life-accepted',outcome:'pending'})
  const fulfill={promiseId:promise.id}
  previous=h.p();await h.send('FulfillLifePromise',fulfill);current=h.p()
  focus=openingFocusAfterSave(previous,current,'FulfillLifePromise',fulfill,focus)!
  expect(focus.entityId).toBe(promise.id)
  expect(playerThread(current,focus)).toMatchObject({stage:'life-running',outcome:'pending',wait:{date:current.features.life.jobs.at(-1)!.completeAt}})
  expect(openingFocusAfterSave(previous,current,'FulfillLifePromise',{promiseId:'different-promise'},existing)).toBe(existing)
 }finally{await h.close()}
})

it('publishes the previous thread after a real atomic abort and the same object only after the original candidate saves',async()=>{
 const codec=createCampaignCodec(),factory=new IDBFactory(),name='s1-thread-atomic'
 const store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 const run=createCampaignRun({runId:'s1-thread-atomic',actorId:'player',commandId:'s1-create',backgroundId:'technical_employee',seed:'s1-thread-atomic',playerProfile:{wishId:'autonomy',approach:'first_order'}})
 await store.create(run)
 const fault=abortAfterHeadWrite(factory,name),failing=new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name})
 const session=await RunSession.open({store:failing,codec,registry:codec.registry,locks:new MemoryWriterAccess(),runId:run.runId,actorId:'player'})
 try{
  const before=playerThread(input(session.view)),command={runId:run.runId,actorId:'player',commandId:'s1-thread-first',expectedRevision:1,kind:'StartFirstOrder',payload:{}}
  expect((await session.submit(command)).status).toBe('unsaved')
  expect(fault.trace.abortIssued).toBe(true)
  const failed=playerThread(input(session.view),before.focus)
  expect(failed).toMatchObject({stage:'offer',outcome:'none',resultRefs:[],focus:{entityId:before.focus.entityId}})
  expect((await session.retry()).status).toBe('saved')
  expect(playerThread(input(session.view),before.focus)).toMatchObject({stage:'planned',outcome:'pending',focus:{entityId:input(session.view).features.firstOrder.contractId}})
  const readonly=playerThread(input({...session.view,readOnly:true}),before.focus)
  expect(readonly.stage).toBe('planned');expect(readonly.resultRefs).toEqual([])
 }finally{await session.close();await failing.close();await store.close()}
})

it.each(['completed','interrupted'] as const)('reconstructs a free opening from the actually saved and reopened %s life job',async state=>{
 const h=await normal('reopen-life-'+state)
 try{
  await h.send('StartLifeWork',{kind:'rest',personId:null,reference:null})
  const job=h.p().features.life.jobs.at(-1)!
  if(state==='completed')await h.advance(job.completeAt)
  else await h.send('InterruptLifeWork',{jobId:job.id})
  await h.reopen()
  const before=h.controller.exportSaved(),thread=playerThread(h.p())
  expect(thread).toMatchObject({stage:'life-'+state,focus:{kind:'life',selection:'rest',entityId:job.id},outcome:state==='completed'?'actual':'non-success'})
  expect(thread.resultRefs).toEqual(state==='completed'?[{kind:'job',id:job.id,date:job.completeAt}]:[])
  expect(thread.command?.kind).not.toBe('StartFirstOrder')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
})

it.each(['filled','cancelled'] as const)('reconstructs free actual market %s after reopening instead of an empty calendar or first order',async state=>{
 const h=await normal('reopen-market-'+state)
 try{
  const m=h.p().features.market,stock=m.stocks.find(s=>s.symbol==='SIM-AI01')!
  await h.send('PlanStockOrder',{accountId:'personal',symbol:stock.symbol,side:'buy',quantity:100,limitPriceFen:stock.upperFen!,quoteId:m.quoteId!,validUntil:m.matchingCalendar[0]!.id})
  const order=h.p().features.market.orders.at(-1)!
  if(state==='filled'){
   await h.send('SubmitStockOrder',{orderId:order.id,quoteId:h.p().features.market.quoteId})
   await h.advance(m.matchingCalendar[0]!.date)
  }else await h.send('CancelStockOrder',{orderId:order.id})
  await h.reopen()
  expect(playerThread(h.p())).toMatchObject({stage:'market-history',focus:{kind:'market',entityId:order.id,accountId:order.accountId},outcome:state==='filled'?'actual':'non-success'})
 }finally{await h.close()}
})

it.each(['life-last','market-last'] as const)('recovers the last explicit non-work %s source among real arrangements while an automatic invitation never steals it',async order=>{
 const h=await normal('reopen-multiple-'+order)
 try{
  const m=h.p().features.market,stock=m.stocks.find(s=>s.symbol==='SIM-AI01')!
  const plan=()=>h.send('PlanStockOrder',{accountId:'personal',symbol:stock.symbol,side:'buy',quantity:100,limitPriceFen:stock.upperFen!,quoteId:m.quoteId!,validUntil:m.matchingCalendar[0]!.id})
  if(order==='life-last')await plan()
  else await h.send('WorkQuarter',{})
  await h.send('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null})
  const job=h.p().features.life.jobs.at(-1)!
  if(order==='life-last')await h.send('WorkQuarter',{})
  else await plan()
  const marketOrder=h.p().features.market.orders.at(-1)!
  await h.advance(job.completeAt)
  expect(h.p().features.life.promises.at(-1)?.status).toBe('offered')
  await h.reopen()
  const thread=playerThread(h.p())
  expect(thread).toMatchObject(order==='life-last'?{stage:'life-completed',focus:{kind:'life',entityId:job.id},outcome:'actual'}:{stage:'market-planned',focus:{kind:'market',entityId:marketOrder.id}})
  expect(thread.command?.kind).not.toBe('AcceptLifePromise')
  const explicit=openingFocusFor(h.p(),'market',{accountId:'personal',recordId:marketOrder.id})!
  expect(playerThread(h.p(),explicit).focus).toEqual(explicit)
  const before=h.controller.exportSaved()
  // A bounded display copy deliberately lacks ordering receipts. It is not imported as a valid run.
  const sourceLess={view:{...h.p().view,receipts:[]},features:h.p().features}
  const ambiguous=playerThread(sourceLess)
  expect(ambiguous).toMatchObject({stage:'review-choice',focus:{kind:'free',entityId:null},outcome:'none',resultRefs:[],inspect:{screen:'quarter'}})
  expect(ambiguous.command).toBeUndefined();expect(ambiguous.line).toContain('3项实际安排')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
})

it('limits automatic recovery to the current quarter while an explicit old object remains inspectable',async()=>{
 const h=await normal('reopen-quarter')
 try{
  await h.send('StartLifeWork',{kind:'rest',personId:null,reference:null})
  const focus=playerThread(h.p()).focus
  await h.advance('2020-04-01');await h.reopen()
  expect(h.p().features.workbench.quarter).toBe('2020-Q2')
  expect(playerThread(h.p())).toMatchObject({stage:'choose',focus:{kind:'free'},outcome:'none'})
  expect(playerThread(h.p(),focus)).toMatchObject({stage:'life-completed',focus:{entityId:focus.entityId},outcome:'actual'})
 }finally{await h.close()}
})
