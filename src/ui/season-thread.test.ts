import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec,createCampaignRun} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {RunSession} from '../application/session.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import type {OpeningFocus} from './player-thread.ts'
import {playerThread,openingFocusFor} from './player-thread.ts'
import type {SeasonInput} from './season-thread.ts'
import {seasonFocusAfterSave,seasonFocusChoices,seasonRecollection} from './season-thread.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import retainedRelayRaw from '../../goal-1/evidence/t17-acceptance-11/chrome-production-r12/r105-audit-correction-real-cash-saved.json?raw'
import {sceneThreads} from './scene-thread-notes.ts'
import {loadSeasonFocusPreference} from './season-focus-preference.ts'
import {moneyText} from './game-text.ts'

const input=(view:PlayingView):SeasonInput=>({view,features:view.features as unknown as PlayFeatures})
async function normal(name:string,raw?:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'s2-season-'+name})
 let count=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`s2-${name}-${++count}`})
 await controller.initialize()
 if(raw)await controller.importNew(raw)
 else await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'s2-'+name})
 const p=()=>input(controller.snapshot.view!)
 const send=async(kind:string,payload:unknown)=>{const previous=p();const result=await controller.submit(controller.prepare(kind,payload));expect(result.status,JSON.stringify({kind,payload,result})).toBe('saved');return {previous,current:p()}}
 const advance=async(date:string)=>{for(let n=0;n<35;n++){
  const w=p().features.workbench
  if(w.pause){expect(w.pause.reason).toBe('CONTENT_DECISION_PENDING');const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;expect(choice).toMatchObject({costFen:0,actionPoints:0});await send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}
  if(p().view.date>=date)return
  await send('AdvanceTime',{date})
 }throw Error('S2_SEASON_CLOCK_LIMIT')}
 return {codec,controller,p,send,advance,close:async()=>{await controller.close();await store.close()}}
}
const marketPayload=(p:SeasonInput,symbol='SIM-AI01')=>{const m=p.features.market,q=m.stocks.find(q=>q.symbol===symbol)!;return {accountId:'personal',symbol:q.symbol,side:'buy',quantity:100,limitPriceFen:q.upperFen!,quoteId:m.quoteId!,validUntil:m.matchingCalendar[0]!.id}}

it('closes a real working quarter before offering the original next-quarter date and keeps old salary historical',async()=>{
 const h=await normal('work')
 try{
  const entry:OpeningFocus={runId:h.p().view.runId,kind:'work',accountId:'personal',entityId:null}
  const saved=await h.send('WorkQuarter',{}),focus=seasonFocusAfterSave(saved.previous,saved.current,'WorkQuarter',{},entry)!
  await h.advance('2020-01-31')
  const january=playerThread(h.p(),focus)
  expect(january.line).toContain(`截至2020-01-31，2020-Q1这段工作已实收工资合计${moneyText(800000)}`)
  expect(january.line).toContain(`最近一笔是2020-01-31的${moneyText(800000)}`)
  expect(january.resultRefs).toHaveLength(1);expect(january.resultRefs[0]).toMatchObject({kind:'payroll',date:'2020-01-31'})
  expect(seasonRecollection(h.p())).toMatchObject({quarter:'2020-Q1',closed:false,nextQuarterDate:null})
  expect(seasonRecollection(h.p())!.allNodes.some(n=>n.sourceRefs.some(r=>r.kind==='payroll'))).toBe(true)
  await h.advance('2020-03-31')
  const before=h.controller.exportSaved(),echo=seasonRecollection(h.p())!
  expect(echo).toMatchObject({quarter:'2020-Q1',closed:true,atQuarterEnd:true,nextQuarterDate:'2020-04-01'})
  expect(echo.closeSourceId).toBeTruthy();expect(echo.nodes.length).toBeLessThanOrEqual(3)
  expect(echo.allNodes.filter(n=>n.sourceRefs[0]?.kind==='payroll')).toHaveLength(3)
  const march=playerThread(h.p(),focus)
  expect(march.line).toContain(`截至2020-03-31，2020-Q1这段工作已实收工资合计${moneyText(2400000)}`)
  expect(march.line).toContain(`最近一笔是2020-03-31的${moneyText(800000)}`)
  expect(march.resultRefs.map(ref=>ref.date)).toEqual(['2020-01-31','2020-02-29','2020-03-31'])
  expect(march.detail).toContain('本季日历已结算，下一季工作仍要另行决定')
  expect(march.detail).not.toContain('工作照原日历继续')
  expect(seasonFocusChoices(h.p()).some(c=>c.focus.entityId===focus.entityId&&c.date==='2020-01-01')).toBe(true)
  expect(h.controller.exportSaved()).toBe(before)
  await h.advance('2020-04-01')
  expect(playerThread(h.p(),focus,'2020-Q1')).toMatchObject({focusScope:'history',focusQuarter:'2020-Q1'})
  expect(playerThread(h.p(),focus,'2020-Q1').command).toBeUndefined()
  expect(playerThread(h.p(),focus,'2020-Q1').line).toContain('旧收支不会重记为本季收入')
  expect(playerThread(h.p(),focus,'2020-Q1').line).toContain(`截至2020-04-01，2020-Q1这段工作已实收工资合计${moneyText(2400000)}`)
  expect(playerThread(h.p(),focus,'2020-Q1').line).toContain(`最近一笔是2020-03-31的${moneyText(800000)}`)
  expect(playerThread(h.p(),focus,'2020-Q1').detail).toContain('这里回看原季度工作')
  expect(playerThread(h.p(),focus,'2020-Q1').resultRefs).toEqual(march.resultRefs)
  expect(h.p().view.budget.available).toBe(4)
  expect(seasonRecollection(h.p(),'2020-Q1')!.allNodes).toEqual(echo.allNodes)
  expect(seasonRecollection(h.p(),'2020-Q1')!.nextQuarterDate).toBeNull()
  expect(playerThread(h.p(),entry,'2020-Q1').focusStatus).toBe('invalid')
  const currentEntry={...entry,entityId:null}
  expect(playerThread(h.p(),currentEntry,'2020-Q2').command?.kind).toBe('WorkQuarter')
  const again=await h.send('WorkQuarter',{})
  expect(seasonFocusAfterSave(again.previous,again.current,'WorkQuarter',{},focus,true)).toBe(focus)
  expect(seasonFocusAfterSave(again.previous,again.current,'WorkQuarter',{},currentEntry,true)?.entityId).not.toBe(focus.entityId)
 }finally{await h.close()}
},30000)

it('carries an actual life job across quarters without calling its plan complete or paying again',async()=>{
 const h=await normal('life-carry')
 try{
  await h.advance('2020-03-28')
  const entry:OpeningFocus={runId:h.p().view.runId,kind:'life',selection:'rest',accountId:'personal',entityId:null}
  const payload={kind:'rest',personId:null,reference:null},saved=await h.send('StartLifeWork',payload),focus=seasonFocusAfterSave(saved.previous,saved.current,'StartLifeWork',payload,entry)!
  const job=h.p().features.life.jobs.find(j=>j.id===focus.entityId)!
  expect(job.completeAt).toBe('2020-04-04')
  await h.advance('2020-03-31')
  const q1=seasonRecollection(h.p())!
  expect(q1.closed).toBe(true)
  expect(q1.allNodes.some(n=>n.sourceRefs.some(r=>r.id===job.id))).toBe(false)
  expect(q1.remaining.some(r=>r.focus?.entityId===job.id&&r.dueAt===job.completeAt)).toBe(true)
  await h.advance('2020-04-01')
  const carry=playerThread(h.p(),focus,'2020-Q1')
  expect(carry).toMatchObject({focusScope:'carry',focusQuarter:'2020-Q1',stage:'life-running',wait:{date:job.completeAt}})
  expect(carry.command).toBeUndefined();expect(h.p().view.budget.available).toBe(4)
  const before=h.controller.exportSaved();seasonFocusChoices(h.p());seasonRecollection(h.p());expect(h.controller.exportSaved()).toBe(before)
  await h.advance(job.completeAt)
  expect(playerThread(h.p(),focus,'2020-Q1')).toMatchObject({focusScope:'current',stage:'life-completed',focus:{entityId:job.id}})
  expect(playerThread(h.p(),focus,'2020-Q1').line).toContain('本季出现以下实际反馈')
  expect(seasonRecollection(h.p())!.allNodes.some(n=>n.sourceRefs.some(r=>r.id===job.id)&&n.date===job.completeAt)).toBe(true)
  expect(seasonRecollection(h.p(),'2020-Q1')!.allNodes.some(n=>n.sourceRefs.some(r=>r.id===job.id))).toBe(false)
  expect(h.p().view.budget.available).toBe(4)
 }finally{await h.close()}
},30000)

it('uses actual fills and later cash settlement separately while a primary order follows only its own amendment',async()=>{
 const h=await normal('market')
 try{
  const original=marketPayload(h.p(),'SIM-AI02'),planned=await h.send('PlanStockOrder',original)
  const entry:OpeningFocus={runId:h.p().view.runId,kind:'market',accountId:'personal',entityId:null}
  let focus=seasonFocusAfterSave(planned.previous,planned.current,'PlanStockOrder',original,entry)!
  const amendment={orderId:focus.entityId,quantity:100,limitPriceFen:original.limitPriceFen,quoteId:h.p().features.market.quoteId,validUntil:original.validUntil},changed=await h.send('AmendStockOrder',amendment)
  const amended=seasonFocusAfterSave(changed.previous,changed.current,'AmendStockOrder',amendment,focus)!
  expect(amended.entityId).not.toBe(focus.entityId);focus=amended
  await h.advance(h.p().features.market.matchingCalendar[0]!.date)
  const fill=h.p().features.market.fills.find(f=>f.orderId===focus.entityId)!
  expect(fill).toBeTruthy()
  let echo=seasonRecollection(h.p())!
  expect(echo.allNodes.some(n=>n.sourceRefs.some(r=>r.id===fill.id)&&n.inspect.target?.recordId===focus.entityId)).toBe(true)
  expect(echo.allNodes.some(n=>n.title.includes('交收'))).toBe(false)
  await h.advance('2020-01-11')
  const payload={...marketPayload(h.p(),'SIM-AI02'),side:'sell',limitPriceFen:h.p().features.market.stocks.find(s=>s.symbol==='SIM-AI02')!.lowerFen!},sale=await h.send('PlaceStockOrder',payload)
  expect(seasonFocusAfterSave(sale.previous,sale.current,'PlaceStockOrder',payload,focus,true)).toBe(focus)
  const saleFocus=seasonFocusAfterSave(sale.previous,sale.current,'PlaceStockOrder',payload,focus,false)!
  expect(saleFocus.entityId).not.toBe(focus.entityId)
  await h.advance(h.p().features.market.matchingCalendar[0]!.date)
  const settlement=h.p().features.market.settlements.find(s=>s.kind==='sale')!
  expect(settlement).toBeTruthy();expect(settlement.paidAt).toBeNull()
  echo=seasonRecollection(h.p())!
  expect(echo.remaining.some(r=>r.focus?.entityId===settlement.id)).toBe(true)
  expect(echo.allNodes.some(n=>n.id===settlement.id)).toBe(false)
  await h.advance(settlement.dueAt)
  expect(seasonRecollection(h.p())!.allNodes.some(n=>n.id===settlement.id&&n.date===settlement.dueAt)).toBe(true)
 }finally{await h.close()}
},30000)

it('retains an accepted original promise across the quarter boundary and records only its actual later fulfilment',async()=>{
 const h=await normal('promise-carry')
 try{
  await h.advance('2020-03-25')
  await h.send('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null})
  await h.advance(h.p().features.life.jobs.at(-1)!.completeAt)
  const promise=h.p().features.life.promises.at(-1)!
  const focus:OpeningFocus={runId:h.p().view.runId,kind:'life',selection:promise.personId,accountId:'personal',entityId:promise.id}
  const accept={promiseId:promise.id,consent:true},accepted=await h.send('AcceptLifePromise',accept)
  expect(seasonFocusAfterSave(accepted.previous,accepted.current,'AcceptLifePromise',accept,focus)).toBe(focus)
  await h.advance('2020-04-01')
  const carried=playerThread(h.p(),focus,'2020-Q1')
  expect(carried).toMatchObject({focusScope:'carry',focusQuarter:'2020-Q1',stage:'life-accepted',command:{kind:'FulfillLifePromise',payload:{promiseId:promise.id}}})
  expect(seasonRecollection(h.p())!.remaining.some(r=>r.focus?.entityId===promise.id&&r.dueAt===promise.deadline)).toBe(true)
  const fulfill={promiseId:promise.id},working=await h.send('FulfillLifePromise',fulfill)
  expect(seasonFocusAfterSave(working.previous,working.current,'FulfillLifePromise',fulfill,focus)).toBe(focus)
  const job=h.p().features.life.jobs.find(j=>j.promiseId===promise.id)!
  await h.advance(job.completeAt)
  expect(playerThread(h.p(),focus,'2020-Q1')).toMatchObject({focusScope:'current',stage:'life-completed',resultRefs:[{kind:'promise',id:promise.id,date:job.completeAt}]})
  expect(seasonRecollection(h.p())!.allNodes.filter(n=>n.sourceRefs.some(r=>r.id===promise.id))).toHaveLength(1)
  expect(seasonRecollection(h.p(),'2020-Q1')!.allNodes.some(n=>n.sourceRefs.some(r=>r.id===promise.id))).toBe(false)
  expect(seasonRecollection(h.p())!.remaining.some(r=>r.focus?.entityId===promise.id)).toBe(false)
 }finally{await h.close()}
},30000)

it('keeps a pinned primary while an actual side activity saves and only refines its own entry',async()=>{
 const h=await normal('pin')
 try{
  const entry:OpeningFocus={runId:h.p().view.runId,kind:'life',selection:'rest',accountId:'personal',entityId:null}
  const work=await h.send('WorkQuarter',{})
  expect(seasonFocusAfterSave(work.previous,work.current,'WorkQuarter',{},entry,true)).toBe(entry)
  const payload={kind:'rest',personId:null,reference:null},life=await h.send('StartLifeWork',payload),primary=seasonFocusAfterSave(life.previous,life.current,'StartLifeWork',payload,entry,true)!
  expect(primary.entityId).toBe(life.current.features.life.jobs.at(-1)!.id)
  const research={definitionId:'market-overview'},side=await h.send('ResearchMarket',research)
  expect(seasonFocusAfterSave(side.previous,side.current,'ResearchMarket',research,primary,true)).toBe(primary)
  expect(seasonFocusAfterSave(side.previous,side.current,'ResearchMarket',research,primary,false)?.kind).toBe('market')
  const clock=await h.send('AdvanceTime',{date:'2020-01-08'})
  expect(seasonFocusAfterSave(clock.previous,clock.current,'AdvanceTime',{date:'2020-01-08'},primary,true)).toBe(primary)
  expect(playerThread(h.p(),primary).stage).toBe('life-completed')
 }finally{await h.close()}
},20000)

it('rejects future bookmark quarters and personal business bindings instead of ignoring shape-valid wrong ownership',async()=>{
 const h=await normal('invalid')
 try{
  const base={runId:h.p().view.runId,accountId:'personal',entityId:null,businessId:'some-business'}
  for(const focus of [{...base,kind:'life' as const,selection:'rest' as const},{...base,kind:'work' as const},{...base,kind:'free' as const}]){
   const thread=playerThread(h.p(),focus)
   expect(thread.focusStatus).toBe('invalid');expect(thread.invalidReason).toContain('不绑定企业')
   expect(thread.command).toBeUndefined()
  }
  const entry=openingFocusFor(h.p(),'market')!
  expect(playerThread(h.p(),entry,'2021-Q1').focusStatus).toBe('invalid')
  expect(playerThread(h.p(),{...entry,kind:'market',entityId:null,entityKind:'order'}).focusStatus).toBe('invalid')
  const payload=marketPayload(h.p());await h.send('PlanStockOrder',payload)
  const order=h.p().features.market.orders[0]!
  expect(playerThread(h.p(),{...entry,kind:'market',entityId:order.id,entityKind:'settlement'}).focusStatus).toBe('invalid')
  await h.send('StartFirstOrder',{})
  const businessId=h.p().features.firstOrder.businessId!
  expect(businessId).toBeTruthy()
  const ownOrder:OpeningFocus={...entry,kind:'market',entityId:order.id,entityKind:'order'}
  expect(playerThread(h.p(),ownOrder).focus.businessId).toBeUndefined()
  expect(playerThread(h.p(),{...ownOrder,businessId}).focusStatus).toBe('invalid')
  expect(seasonRecollection(h.p(),'2025-Q4')).toBeNull();expect(seasonRecollection(h.p(),'not-a-quarter')).toBeNull()
 }finally{await h.close()}
})

it('keeps the terminal-quarter projection within the finite epilogue without promising another quarter',async()=>{
 const h=await normal('terminal-projection')
 try{
  // This is a public-view boundary projection, not a claim of completing a normal 24-quarter run.
  const p=h.p(),w=p.features.workbench,chapter=p.features.journey!.chapters[0]!
  const terminal:SeasonInput={view:{...p.view,date:'2025-12-31'},features:{...p.features,workbench:{...w,quarter:'2025-Q4',quarterStart:'2025-10-01',quarterEnd:'2025-12-31',atQuarterEnd:true,progression:{...w.progression,nextQuarterDate:null}},journey:{...p.features.journey!,chapters:[{...chapter,id:'2025-Q4',quarter:'2025-Q4',from:'2025-10-01',through:'2025-12-31',closedAt:'2025-12-31',closeSourceId:'journey:close:2025-Q4'}]}}}
  const echo=seasonRecollection(terminal)!
  expect(echo.nextQuarterDate).toBeNull();expect(echo.nextQuestion).toContain('有限尾声');expect(echo.nextQuestion).not.toContain('下一季')
 }finally{await h.close()}
})

it('keeps a shape-valid but publicly invalid market entry pinned after a real side order saves',async()=>{
 const h=await normal('invalid-market-entry-save')
 try{
  await h.send('StartFirstOrder',{})
  const previous=h.p(),existing:OpeningFocus={runId:previous.view.runId,kind:'market',accountId:'personal',entityId:null,businessId:previous.features.firstOrder.businessId!}
  const raw=JSON.stringify({version:1,runId:previous.view.runId,quarter:previous.features.workbench.quarter,focus:existing})
  expect(loadSeasonFocusPreference({getItem:()=>raw,setItem:()=>{throw Error('UNEXPECTED_PREFERENCE_WRITE')}},{runId:previous.view.runId,quarter:previous.features.workbench.quarter}).status).toBe('loaded')
  expect(playerThread(previous,existing).focusStatus).toBe('invalid')
  const payload=marketPayload(previous),saved=await h.send('PlaceStockOrder',payload)
  expect(saved.current.features.market.orders).toHaveLength(1)
  const committed=h.controller.exportSaved()
  expect(seasonFocusAfterSave(saved.previous,saved.current,'PlaceStockOrder',payload,existing)).toBe(existing)
  expect(playerThread(saved.current,existing).focusStatus).toBe('invalid')
  expect(h.controller.exportSaved()).toBe(committed)
 }finally{await h.close()}
})

it('refreshes a pinned object result without selecting it again or changing its original bookmark identity',async()=>{
 const h=await normal('same-object')
 try{
  const payload={kind:'rest',personId:null,reference:null},started=await h.send('StartLifeWork',payload)
  const lifeEntry:OpeningFocus={runId:h.p().view.runId,kind:'life',selection:'rest',accountId:'personal',entityId:null}
  const life=seasonFocusAfterSave(started.previous,started.current,'StartLifeWork',payload,lifeEntry)!
  const stop={jobId:life.entityId},interrupted=await h.send('InterruptLifeWork',stop)
  expect(seasonFocusAfterSave(interrupted.previous,interrupted.current,'InterruptLifeWork',stop,life)).toBe(life)
  expect(playerThread(h.p(),life)).toMatchObject({stage:'life-interrupted',outcome:'non-success'})
  expect(seasonRecollection(h.p())!.allNodes.some(n=>n.sourceRefs.some(r=>r.id===life.entityId)&&n.title.includes('停下'))).toBe(true)
  const orderPayload=marketPayload(h.p()),planned=await h.send('PlanStockOrder',orderPayload)
  const marketEntry:OpeningFocus={runId:h.p().view.runId,kind:'market',accountId:'personal',entityId:null}
  const order=seasonFocusAfterSave(planned.previous,planned.current,'PlanStockOrder',orderPayload,marketEntry)!
  const cancel={orderId:order.entityId},cancelled=await h.send('CancelStockOrder',cancel)
  expect(seasonFocusAfterSave(cancelled.previous,cancelled.current,'CancelStockOrder',cancel,order)).toBe(order)
  const researchPayload={definitionId:'market-overview'},researched=await h.send('ResearchMarket',researchPayload)
  const research=seasonFocusAfterSave(researched.previous,researched.current,'ResearchMarket',researchPayload,marketEntry)!
  const stopResearch={researchId:research.entityId},stopped=await h.send('StopMarketResearch',stopResearch)
  expect(seasonFocusAfterSave(stopped.previous,stopped.current,'StopMarketResearch',stopResearch,research)).toBe(research)
 }finally{await h.close()}
},20000)

it('retains actual forced-event and clock-pause sources until the original decision is saved, then returns to the pinned primary',async()=>{
 const h=await normal('responsibility')
 try{
  const initial:OpeningFocus={runId:h.p().view.runId,kind:'work',accountId:'personal',entityId:null},work=await h.send('WorkQuarter',{})
  const primary=seasonFocusAfterSave(work.previous,work.current,'WorkQuarter',{},initial)!
  for(let n=0;n<35&&!h.p().features.workbench.pause&&h.p().view.date<'2020-03-31';n++)await h.send('AdvanceTime',{date:'2020-03-31'})
  const w=h.p().features.workbench,before=h.controller.exportSaved(),echo=seasonRecollection(h.p())!
  expect(w.pause?.reason).toBe('CONTENT_DECISION_PENDING')
  expect(echo.remaining.some(r=>r.urgent&&r.sourceRefs.some(ref=>ref.kind==='pause'&&ref.id===w.pause!.instanceId))).toBe(true)
  for(const event of w.events.filter(e=>e.isBlocking||e.presentation!=='ordinary'))expect(echo.remaining.some(r=>r.dueAt===event.expiresAt&&r.sourceRefs.some(ref=>ref.id===event.id))).toBe(true)
  expect(playerThread(h.p(),primary).responsibilityOverrideNeeded).toBe(true)
  expect(h.controller.exportSaved()).toBe(before)
  const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!
  const payload={instanceId:event.id,choiceId:choice.id},resolved=await h.send('ChooseEvent',payload)
  expect(seasonFocusAfterSave(resolved.previous,resolved.current,'ChooseEvent',payload,primary)).toBe(primary)
  expect(seasonRecollection(h.p())!.remaining.some(r=>r.sourceRefs.some(ref=>ref.id===event.id))).toBe(false)
 }finally{await h.close()}
},20000)

it('preserves original later-business pending and its complete responsibility set without stealing an explicit S2 focus',async()=>{
 const h=await normal('legacy',retainedRelayRaw)
 try{
  const before=h.controller.exportSaved(),ordinary=playerThread(h.p())
  expect(ordinary.legacyFallbackRequired).toBe(true)
  const explicit:OpeningFocus={runId:h.p().view.runId,kind:'work',accountId:'personal',entityId:null}
  expect(playerThread(h.p(),explicit).legacyFallbackRequired).toBe(false)
  const echo=seasonRecollection(h.p())!
  expect(echo.remaining.some(r=>r.inspect.screen==='relay')).toBe(true)
  expect(echo.remaining.some(r=>r.sourceRefs.some(ref=>ref.kind==='obligation'))).toBe(true)
  expect(echo.nodes.length).toBeLessThanOrEqual(3)
  for(const original of sceneThreads(h.p().features,h.p().view.date).filter(t=>t.screen!=='life'))expect(echo.remaining.some(r=>r.id===original.id)).toBe(true)
  for(const finance of h.p().features.workbench.finance)for(const debt of finance.obligations)expect(echo.remaining.some(r=>r.sourceRefs.some(ref=>ref.id===debt.id))).toBe(true)
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
})

it('holds a pinned primary through a real abort and retries only the original committed instance',async()=>{
 const codec=createCampaignCodec(),factory=new IDBFactory(),name='s2-pin-abort',store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 const run=createCampaignRun({runId:'s2-pin-abort',actorId:'player',commandId:'s2-create',backgroundId:'technical_employee',seed:'s2-pin-abort'});await store.create(run)
 const fault=abortAfterHeadWrite(factory,name),failing=new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name})
 const session=await RunSession.open({store:failing,codec,registry:codec.registry,locks:new MemoryWriterAccess(),runId:run.runId,actorId:'player'})
 try{
  const previous=input(session.view),primary:OpeningFocus={runId:run.runId,kind:'market',accountId:'personal',entityId:null},own:OpeningFocus={runId:run.runId,kind:'first-order',accountId:'personal',entityId:previous.features.firstOrder.offerId}
  const command={runId:run.runId,actorId:'player',commandId:'s2-first',expectedRevision:1,kind:'StartFirstOrder',payload:{}}
  expect((await session.submit(command)).status).toBe('unsaved')
  expect(seasonFocusAfterSave(previous,input(session.view),command.kind,command.payload,own,true)).toBe(own)
  expect((await session.retry()).status).toBe('saved')
  const current=input(session.view),before=session.exportSaved()
  expect(seasonFocusAfterSave(previous,current,command.kind,command.payload,primary,true)).toBe(primary)
  expect(seasonFocusAfterSave(previous,current,command.kind,command.payload,own,true)?.entityId).toBe(current.features.firstOrder.contractId)
  expect(session.exportSaved()).toBe(before)
 }finally{await session.close();await failing.close();await store.close()}
})
