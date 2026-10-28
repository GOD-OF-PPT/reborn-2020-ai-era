import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,projectRun} from '../core/commands.ts'
import {RunSession} from '../application/session.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {todayThread,type TodayThreadInput} from './today-thread.ts'

const input=(view:PlayingView):TodayThreadInput=>({view,features:view.features as unknown as PlayFeatures})
function normal(name:string){
 const codec=createCampaignCodec()
 let run=createCampaignRun({runId:'u2-today-'+name,actorId:'player',commandId:'u2-create-'+name,backgroundId:'technical_employee',seed:'u2-today-'+name,playerProfile:{wishId:'autonomy',approach:'free'}})
 const p=():TodayThreadInput=>{const projected=codec.registry.runtime!.project!(run),features=projected as unknown as PlayFeatures;return {features,view:{...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}}}
 const send=(kind:string,payload:unknown)=>{const command={runId:run.runId,actorId:run.actorId,commandId:'u2-'+name+'-'+run.revision,expectedRevision:run.revision,kind,payload},result=evaluateCommand(run,command,codec.registry,run.actorId);expect(result.status,JSON.stringify({kind,payload,result})).toBe('proposed');if(result.status!=='proposed')throw Error('NORMAL_COMMAND_REQUIRED');run=codec.import(codec.export(result.nextRun))}
 const advance=(date:string)=>{for(let n=0;n<35;n++){const current=p(),w=current.features.workbench;if(w.pause){expect(w.pause.reason).toBe('CONTENT_DECISION_PENDING');const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;expect(choice).toMatchObject({costFen:0,actionPoints:0});send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}if(current.view.date>=date)return;send('AdvanceTime',{date})}throw Error('NORMAL_CLOCK_LIMIT')}
 return {p,send,advance,raw:()=>codec.export(run)}
}
const free=(p:TodayThreadInput):OpeningFocus=>({runId:p.view.runId,accountId:'personal',entityId:null,kind:'free'})
const marketPayload=(p:TodayThreadInput,side:'buy'|'sell'='buy',accountId='personal')=>{const m=p.features.market,q=m.stocks.find(s=>s.symbol==='SIM-AI02')!;return{accountId,symbol:q.symbol,side,quantity:100,limitPriceFen:side==='buy'?q.upperFen!:q.lowerFen!,quoteId:m.quoteId!,validUntil:m.matchingCalendar[0]!.id}}

it('offers only UI directions from a normal empty day and retains the exact primary and game bytes',()=>{
 const h=normal('entry'),p=h.p(),pin=free(p),before=h.raw(),view=todayThread(p,pin)!
 expect(view.source).toEqual({runId:p.view.runId,revision:1,date:'2020-01-01',quarter:'2020-Q1'})
 expect(view.primary).toMatchObject({classification:'entry',supported:true,thread:{focus:pin}})
 expect(view.ongoing).toEqual([])
 expect(todayThread(p,{runId:p.view.runId,accountId:'personal',kind:'life',selection:'rest',entityId:null})!.primary.classification).toBe('entry')
 expect(view.directions.map(row=>row.id)).toEqual(['work','life','video','course','relay','ecosystem','equity','market'])
 for(const original of ['work','life','video','market'])expect(view.directions.filter(row=>row.id===original)).toHaveLength(1)
 expect(view.directions[2]).toMatchObject({id:'video',screen:'video'})
 expect(view.directions[3]).toMatchObject({id:'course',screen:'course'})
 expect(view.directions.filter(row=>row.id==='equity')).toEqual([expect.objectContaining({id:'equity',screen:'deepseek'})])
 for(const direction of view.directions){expect(direction).not.toHaveProperty('command');expect(direction).not.toHaveProperty('payload');expect(direction).not.toHaveProperty('focus')}
 expect(view.wait?.date).toBe(p.features.workbench.progression.nextDate)
 expect(todayThread(p,pin)).toEqual(view);expect(h.raw()).toBe(before)
})

it('keeps a real first salary active, then separates the quarter result from old history without renewing work',()=>{
 const h=normal('work');h.send('WorkQuarter',{});let p=h.p()
 const period=p.view.operations!.employment[0]!,pin:OpeningFocus={runId:p.view.runId,accountId:'personal',entityId:period.id,kind:'work'}
 h.advance('2020-01-31');p=h.p()
 let view=todayThread(p,pin,'2020-Q1')!
 expect(view.primary).toMatchObject({classification:'active',thread:{stage:'work-paid',outcome:'actual'}})
 expect(view.primary.sourceRefs).toEqual([{kind:'payroll',id:p.view.operations!.payroll.find(row=>row.entityId===period.id)!.id,date:'2020-01-31'}])
 expect(view.ongoing.some(row=>row.focus.entityId===period.id&&row.classification==='active')).toBe(true)
 h.advance('2020-03-31');p=h.p();view=todayThread(p,pin,'2020-Q1')!
 expect(view.primary.classification).toBe('result');expect(view.ongoing.some(row=>row.focus.entityId===period.id)).toBe(false)
 expect(view.wait).toMatchObject({date:'2020-04-01'})
 h.advance('2020-04-01');p=h.p();const before=h.raw();view=todayThread(p,pin,'2020-Q1')!
 expect(view.primary).toMatchObject({classification:'history',originQuarter:'2020-Q1',thread:{focus:{entityId:period.id}}})
 expect(view.primary.sourceRefs.map(ref=>ref.date)).toEqual(['2020-01-31','2020-02-29','2020-03-31'])
 expect(p.view.operations!.employment.filter(row=>row.quarter==='2020-Q2')).toEqual([])
 expect(view.source).toMatchObject({date:'2020-04-01',quarter:'2020-Q2'})
 expect(p.view.budget.available).toBe(4);expect(h.raw()).toBe(before)
})

it('carries an actual rest job across a quarter and only calls its later public completion a result',()=>{
 const h=normal('rest');h.advance('2020-03-28');h.send('StartLifeWork',{kind:'rest',personId:null,reference:null})
 let p=h.p();const job=p.features.life.jobs.at(-1)!,pin:OpeningFocus={runId:p.view.runId,accountId:'personal',kind:'life',selection:'rest',entityId:job.id}
 expect(job.completeAt).toBe('2020-04-04')
 h.advance('2020-04-01');p=h.p();let view=todayThread(p,pin,'2020-Q1')!
 expect(view.primary).toMatchObject({classification:'carry',originQuarter:'2020-Q1',thread:{stage:'life-running',wait:{date:job.completeAt}}})
 expect(view.ongoing).toContainEqual(expect.objectContaining({classification:'carry',focus:expect.objectContaining({entityId:job.id})}))
 expect(view.remaining.some(row=>row.focus?.entityId===job.id)).toBe(true)
 const ap=p.view.budget.available;h.advance(job.completeAt);p=h.p();const before=h.raw();view=todayThread(p,pin,'2020-Q1')!
 expect(view.primary).toMatchObject({classification:'result',thread:{focus:{entityId:job.id},stage:'life-completed'}})
 expect(view.primary.sourceRefs).toEqual([{kind:'job',id:job.id,date:job.completeAt}])
 expect(view.ongoing.some(row=>row.focus.entityId===job.id)).toBe(false)
 expect(p.view.budget.available).toBe(ap);expect(h.raw()).toBe(before)
})

it('treats a real holding and an unpaid sale as active facts, never as spendable settled cash',()=>{
 const h=normal('market');h.send('PlaceStockOrder',marketPayload(h.p()));h.advance(h.p().features.market.matchingCalendar[0]!.date)
 let p=h.p();const position=p.features.market.positions.find(row=>row.quantity>0)!,holding:OpeningFocus={runId:p.view.runId,accountId:'personal',kind:'market',entityKind:'position',entityId:position.id}
 expect(position.quantity).toBe(100)
 expect(todayThread(p,holding)!.primary).toMatchObject({classification:'active',thread:{outcome:'actual',stage:'market-position'}})
 h.advance('2020-01-11');h.send('PlaceStockOrder',marketPayload(h.p(),'sell'))
 p=h.p();const order=p.features.market.orders.at(-1)!,pin:OpeningFocus={runId:p.view.runId,accountId:'personal',kind:'market',entityKind:'order',entityId:order.id}
 h.advance(p.features.market.matchingCalendar[0]!.date);p=h.p()
 const settlement=p.features.market.settlements.find(row=>row.kind==='sale'&&p.features.market.fills.some(fill=>fill.orderId===order.id&&fill.id===row.sourceId))!
 expect(settlement.paidAt).toBeNull()
 let view=todayThread(p,pin)!
 expect(view.primary.classification).toBe('active')
  expect(view.ongoing.filter(row=>row.focus.entityId===order.id)).toHaveLength(1)
  expect(view.ongoing.find(row=>row.focus.entityId===order.id)!.wait?.date).toBe(settlement.dueAt)
  expect(view.ongoing.some(row=>row.focus.entityId===settlement.id)).toBe(false)
 expect(view.remaining.some(row=>row.focus?.entityId===settlement.id)).toBe(true)
  expect(view.remaining.find(row=>row.focus?.entityId===settlement.id)!.dueAt).toBe(settlement.dueAt)
 h.advance(settlement.dueAt);p=h.p();const before=h.raw();view=todayThread(p,pin)!
 expect(view.primary.classification).toBe('result')
 expect(view.ongoing.some(row=>row.focus.entityId===order.id||row.focus.entityId===settlement.id)).toBe(false)
 expect(p.features.market.settlements.find(row=>row.id===settlement.id)!.paidAt).toBe(settlement.dueAt)
 expect(h.raw()).toBe(before)
})

it('keeps each real account sale once while retaining independent or uncovered settlement records',()=>{
 const h=normal('sale-accounts')
 h.send('DiscoverBusiness',{definitionId:'course-studio'})
 const business=h.p().view.operations!.businesses.find(row=>row.definitionId==='course-studio')!
 expect(business.company).toBe(true)
 h.send('FundBusiness',{businessId:business.id,amountFen:500000})
 for(const accountId of ['personal',business.accountId])h.send('PlaceStockOrder',marketPayload(h.p(),'buy',accountId))
 h.advance(h.p().features.market.matchingCalendar[0]!.date);h.advance('2020-01-11')
 for(const accountId of ['personal',business.accountId])h.send('PlaceStockOrder',marketPayload(h.p(),'sell',accountId))
 h.advance(h.p().features.market.matchingCalendar[0]!.date)
 const p=h.p(),before=h.raw(),sales=p.features.market.orders.filter(row=>row.side==='sell'),settlements=p.features.market.settlements.filter(row=>row.kind==='sale'&&row.paidAt===null)
 expect(sales).toHaveLength(2);expect(settlements).toHaveLength(2)
 const view=todayThread(p,free(p))!
 for(const order of sales){
  const settlement=settlements.find(row=>row.accountId===order.accountId&&p.features.market.fills.some(fill=>fill.orderId===order.id&&fill.id===row.sourceId))!
  const choices=view.ongoing.filter(item=>item.focus.accountId===order.accountId)
  expect(choices).toHaveLength(1);expect(choices[0]!.focus.entityId).toBe(order.id)
  expect(choices[0]!.wait?.date).toBe(settlement.dueAt)
  expect(view.remaining.some(item=>item.focus?.entityId===settlement.id&&item.accountId===order.accountId&&item.dueAt===settlement.dueAt)).toBe(true)
 }
 const companySale=sales.find(row=>row.accountId===business.accountId)!,companySettlement=settlements.find(row=>row.accountId===business.accountId)!
 // Bounded public-projection counterexamples: every ID/account/date comes from the normal commands above.
 // These copies are not imported/saved or claimed as a new execution or an actually declared dividend.
 const uncovered:TodayThreadInput={...p,features:{...p.features,market:{...p.features.market,orders:p.features.market.orders.filter(row=>row.id!==companySale.id)}}}
 const uncoveredView=todayThread(uncovered,free(p))!
 expect(uncoveredView.ongoing.some(item=>item.focus.entityId===companySettlement.id&&item.focus.accountId===business.accountId&&item.wait?.date===companySettlement.dueAt)).toBe(true)
 expect(uncoveredView.ongoing.some(item=>item.focus.entityId===sales.find(row=>row.accountId==='personal')!.id)).toBe(true)
 const dividendKind:TodayThreadInput={...p,features:{...p.features,market:{...p.features.market,settlements:p.features.market.settlements.map(row=>row.id===companySettlement.id?{...row,kind:'dividend' as const}:row)}}}
 expect(todayThread(dividendKind,free(p))!.ongoing.some(item=>item.focus.entityId===companySettlement.id&&item.focus.accountId===business.accountId)).toBe(true)
 expect(h.raw()).toBe(before)
})

it('keeps complete public responsibilities and the primary while a real forced event interrupts the calendar',()=>{
 const h=normal('responsibility');h.send('WorkQuarter',{});let p=h.p()
 const pin:OpeningFocus={runId:p.view.runId,accountId:'personal',kind:'work',entityId:p.features.workbench.employment[0]!.id}
 for(let n=0;n<35&&!h.p().features.workbench.pause;n++)h.send('AdvanceTime',{date:'2020-03-31'})
 p=h.p();const event=p.features.workbench.events.find(row=>row.isBlocking)!,before=h.raw(),view=todayThread(p,pin)!
 expect(event).toBeTruthy();expect(view.responsibilityOverrideNeeded).toBe(true);expect(view.wait).toBeNull()
 expect(view.remaining.some(row=>row.id==='event:'+event.id)).toBe(true)
 expect(view.remaining.some(row=>row.id==='pause:'+p.features.workbench.pause!.instanceId)).toBe(true)
 expect(view.primary.thread.focus.entityId).toBe(pin.entityId);expect(h.raw()).toBe(before)
 const choice=event.choices.find(row=>row.isDefault)!;h.send('ChooseEvent',{instanceId:event.id,choiceId:choice.id})
 expect(todayThread(h.p(),pin)!.primary.thread.focus.entityId).toBe(pin.entityId)
})

it('still offers the original bounded clock at zero AP without creating another arrangement',()=>{
 const h=normal('zero');h.send('WorkQuarter',{});h.send('ResearchMarket',{definitionId:'market-overview'});h.advance('2020-01-08');h.send('StartLifeWork',{kind:'rest',personId:null,reference:null})
 const p=h.p(),before=h.raw(),view=todayThread(p,free(p))!
 expect(p.view.budget.available).toBe(0);expect(view.wait).not.toBeNull()
 expect(view.wait!.date<=p.features.workbench.progression.quarterTarget).toBe(true)
 expect(view.ongoing.length).toBeGreaterThanOrEqual(2)
 expect(h.raw()).toBe(before)
})

it('explains invalid identities and leaves other route loops to their original presentation',()=>{
 const h=normal('invalid'),p=h.p(),before=h.raw()
 const pin:OpeningFocus={runId:p.view.runId,accountId:'personal',entityId:null,kind:'market'}
 for(const focus of [{...pin,runId:'other-life'},{...pin,accountId:'missing-account'},{...pin,entityId:'missing-order',entityKind:'order' as const}]){
  const view=todayThread(p,focus)!
  expect(view.primary.classification).toBe('invalid');expect(view.primary.thread.focus).toEqual(focus)
  expect(view.primary.thread.invalidReason).toBeTruthy()
 }
 const other:OpeningFocus={runId:p.view.runId,accountId:'personal',entityId:p.features.firstOrder.offerId,kind:'first-order'}
 expect(todayThread(p,other)!.primary).toMatchObject({classification:'other',supported:false})
 // A public-context counterexample, not a normal execution or a replacement game state.
 expect(todayThread({...p,features:{...p.features,journey:null}},pin)).toBeNull()
 expect(h.raw()).toBe(before)
})

it('uses only old committed public data during a real abort, then exposes the saved arrangement after original retry',async()=>{
 const codec=createCampaignCodec(),factory=new IDBFactory(),locks=new MemoryWriterAccess(),name='u2-today-atomic',store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 const run=createCampaignRun({runId:name,actorId:'player',commandId:'u2-create',backgroundId:'technical_employee',seed:name,playerProfile:{wishId:'autonomy',approach:'free'}})
 await store.create(run)
 const fault=abortAfterHeadWrite(factory,name),failing=new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name})
 const session=await RunSession.open({store:failing,codec,registry:codec.registry,locks,runId:run.runId,actorId:'player'}),reader=await RunSession.open({store,codec,registry:codec.registry,locks,runId:run.runId,actorId:'player'})
 try{
  const p=input(session.view),pin=free(p),old=todayThread(p,pin)!,before=session.exportSaved()
  expect(reader.view.readOnly).toBe(true);expect(todayThread(input(reader.view),pin)).toEqual(old)
  const command={runId:run.runId,actorId:'player',commandId:'u2-rest',expectedRevision:1,kind:'StartLifeWork',payload:{kind:'rest',personId:null,reference:null}}
  expect((await session.submit(command)).status).toBe('unsaved');expect(fault.trace.abortIssued).toBe(true)
  expect(session.view.pendingRevision).toBe(2);expect(todayThread(input(session.view),pin)).toEqual(old)
  expect(session.exportSaved()).toBe(before);expect((await store.load(run.runId))?.run.revision).toBe(1)
  expect((await session.retry()).status).toBe('saved')
  const current=todayThread(input(session.view),pin)!
  expect(current.source.revision).toBe(2);expect(current.primary.thread.focus).toEqual(pin)
  expect(current.ongoing).toHaveLength(1);expect(current.ongoing[0]!.focus.entityId).toBe(input(session.view).features.life.jobs[0]!.id)
  expect(todayThread(input(reader.view),pin)).toEqual(old)
  expect((await reader.submit(command)).status).toBe('rejected')
  expect(playerThread(input(session.view),pin).focus).toEqual(pin)
 }finally{await reader.close();await session.close();await failing.close();await store.close()}
})
