import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {OpeningFocus} from './player-thread.ts'
import {RoomMoment} from './RoomMoment.tsx'
import {SeasonRecollection} from './SeasonRecollection.tsx'
import {TodayScene} from './TodayScene.tsx'
import {todayThread} from './today-thread.ts'
import {dayPerspectiveCurrent} from './day-perspective.ts'

const never=()=>{throw Error('READING_MUST_NOT_EXECUTE_OR_NAVIGATE')}
async function normal(name:string,approach:'free'|'first_order'='free'){
 const store=new IndexedDbRunStore({codec:createCampaignCodec(),factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u2-ui-'+name})
 let n=0
 const controller=new GameController({codec:createCampaignCodec(),store,locks:new MemoryWriterAccess(),id:()=>`u2-ui-${name}-${++n}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach},seed:'u2-ui-'+name})
 const p=():GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:never}}
 const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')
 const advance=async(date:string)=>{for(let i=0;i<45;i++){
  const w=p().features.workbench
  if(w.pause){const event=w.events.find(e=>e.isBlocking),choice=event?.choices.find(c=>c.isDefault);expect(choice).toMatchObject({costFen:0,actionPoints:0});await send('ChooseEvent',{instanceId:event!.id,choiceId:choice!.id});continue}
  if(p().view.date>=date)return
  await send('AdvanceTime',{date})
 }throw Error('U2_UI_CLOCK_LIMIT')}
 return {controller,p,send,advance,close:async()=>{await controller.close();await store.close()}}
}

it('keeps payroll as an ongoing work clock, then offers a shared UI return from the same closed historical work',async()=>{
 const h=await normal('work-history')
 try{
  await h.send('WorkQuarter',{});const period=h.p().features.workbench.employment[0]!
  const todayPerspective={runId:h.p().view.runId,revision:h.p().view.revision}
  const focus:OpeningFocus={runId:h.p().view.runId,kind:'work',accountId:'personal',entityId:period.id}
  await h.advance('2020-01-31')
  expect(dayPerspectiveCurrent(h.p().view,todayPerspective)).toBe(true)
  const before=h.controller.exportSaved(),ongoing=renderToStaticMarkup(<RoomMoment p={h.p()} headingRef={null} openingFocus={focus} onOpeningFocus={never} onNavigate={never} onExplore={never}/>)
  expect(ongoing).toContain('data-day-state="ongoing"');expect(ongoing).toContain('等下一次原工作日历反馈')
  expect(ongoing).not.toContain('收好这次结果，想想接下来的日子');expect(h.controller.exportSaved()).toBe(before)
  await h.advance('2020-04-01')
  const historicalBefore=h.controller.exportSaved(),html=renderToStaticMarkup(<RoomMoment p={h.p()} headingRef={null} openingFocus={focus} focusQuarter="2020-Q1" onOpeningFocus={never} onNavigate={never} onExplore={never}/>)
  expect(html).toContain('data-day-state="history"');expect(html).toContain('合上这页，回到今天')
  expect(html).not.toContain('aria-label="不新增安排，让原日子继续');expect(html).not.toContain('aria-label="保留这一季的工作"')
  expect(h.controller.exportSaved()).toBe(historicalBefore)
  expect(dayPerspectiveCurrent(h.p().view,todayPerspective)).toBe(true)
  h.controller.preview(h.controller.prepare('WorkQuarter',{}))
  expect(dayPerspectiveCurrent(h.p().view,todayPerspective)).toBe(true);expect(h.controller.exportSaved()).toBe(historicalBefore)
  await h.send('WorkQuarter',{})
  expect(dayPerspectiveCurrent(h.p().view,todayPerspective)).toBe(false)
 }finally{await h.close()}
},30000)

it('keeps an original waiting exit for an empty simulated market at zero actual AP after research finishes',async()=>{
 const h=await normal('market-zero')
 try{
  await h.send('WorkQuarter',{});await h.send('ResearchMarket',{definitionId:'market-overview'});await h.advance('2020-01-08')
  await h.send('ResearchMarket',{definitionId:'market-foundation-course'});await h.advance('2020-01-15')
  const p=h.p();expect(p.view.budget.available).toBe(0)
  const focus:OpeningFocus={runId:p.view.runId,kind:'market',accountId:'personal',entityId:null},before=h.controller.exportSaved()
  const html=renderToStaticMarkup(<RoomMoment p={p} headingRef={null} openingFocus={focus} onOpeningFocus={never} onNavigate={never} onExplore={never}/>)
  const clock=html.match(/<button[^>]*aria-label="不新增安排，让原日子继续[^\"]*"[^>]*>/)?.[0]
  expect(clock).toBeDefined();expect(clock).not.toContain('disabled');expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},30000)

it('separates an old quarter result page from todays remaining responsibilities and contains no rollover command',async()=>{
 const h=await normal('leaf')
 try{
  await h.send('WorkQuarter',{});await h.advance('2020-04-01')
  const before=h.controller.exportSaved(),html=renderToStaticMarkup(<SeasonRecollection p={h.p()} quarter="2020-Q1" onClose={never} onToday={never} onContinueFocus={never} onNavigate={never}/>)
  expect(html).toContain('正在翻阅2020-Q1');expect(html).toContain('今天仍是2020-04-01');expect(html).toContain('截至今天，仍需面对的约定')
  expect(html).toContain('合上2020-Q1，回到今天');expect(html).not.toContain('核对旧约定，进入下一季')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},30000)

it('renders today after an actual life result without auto arranging work, another rest or a simulated order',async()=>{
 const h=await normal('life-today')
 try{
  await h.send('StartLifeWork',{kind:'rest',personId:null,reference:null});await h.advance('2020-01-08')
  const p=h.p(),job=p.features.life.jobs[0]!,focus:OpeningFocus={runId:p.view.runId,kind:'life',accountId:'personal',selection:'rest',entityId:job.id},today=todayThread(p,focus)!
  expect(today.primary.classification).toBe('result')
  const before=h.controller.exportSaved(),html=renderToStaticMarkup(<TodayScene p={p} today={today} headingRef={null} onFocus={never} onPrepare={never} onResume={never} onExplore={never} onRecollection={never} onNavigate={never}/>)
  expect(html).toContain('今天，仍由你安排');expect(html).toContain('data-day-kind="today"');expect(html).toContain('不新增安排，让原日子继续')
  expect(html).not.toContain('aria-label="保留这一季的工作"');expect(html).not.toContain('核对并留出七天休整');expect(html).not.toContain('核对并提交买单')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},20000)

it('keeps the real first delivery visible even when Today was requested through a season leaf',async()=>{
 const h=await normal('delivery-today','first_order')
 try{
  await h.send('StartFirstOrder',{});await h.advance('2020-01-19')
  const p=h.p();expect(p.features.workbench.progression.requiresDelivery).toBe(true)
  const focus:OpeningFocus={runId:p.view.runId,kind:'first-order',accountId:'personal',entityId:p.features.firstOrder.contractId}
  const before=h.controller.exportSaved(),html=renderToStaticMarkup(<RoomMoment p={p} headingRef={null} openingFocus={focus} onOpeningFocus={never} todayView onToday={never} onReturnFocus={never} onNavigate={never} onExplore={never}/>)
  expect(html).toContain('aria-label="把这份作品交给客户"');expect(html).not.toContain('data-day-view="today"');expect(html).not.toContain('今天，想把时间留给什么')
  const leaf=renderToStaticMarkup(<SeasonRecollection p={p} onClose={never} onToday={never} onNavigate={never}/>)
  expect(leaf).toContain('先回到待交付的作品');expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},30000)
