import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {OpeningAttemptChoices} from './OpeningAttemptChoices.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {openingAttempt} from './opening-attempt.ts'
import {seasonFocusAfterSave} from './season-thread.ts'

async function life(approach:'first_order'|'investment'|'free'){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u1-moment-'+approach}),controller=new GameController({codec,store,locks:new MemoryWriterAccess()}),request=vi.fn()
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach},seed:'u1-moment-'+approach})
 const p=():GamePanelProps=>({controller,view:controller.snapshot.view!,features:controller.snapshot.view!.features as unknown as PlayFeatures,accountId:'personal',request})
 const render=()=>renderToStaticMarkup(<OpeningMoment p={p()} headingRef={null} fallback={roomMoment(p())} onNavigate={vi.fn()} onExplore={vi.fn()}/>)
 return {p,render,controller,request,send:async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved'),close:async()=>{await controller.close();await store.close()}}
}

it.each(['first_order','investment','free'] as const)('gives the real %s first screen its own shared choice without starting anything',async approach=>{
 const h=await life(approach)
 try{
  const before=h.controller.exportSaved(),html=h.render(),label={first_order:'回应这封委托',investment:'看看这笔钱，准备怎样安排',free:'今天，先把时间留给什么'}[approach]
  expect(html).toContain(label);expect(html).toContain('opening-attempt-scene')
  expect(html).toContain('opening-object-action');expect(html).not.toContain('走近这件事')
  expect(html).not.toContain('<dialog');expect(h.request).not.toHaveBeenCalled();expect(h.controller.exportSaved()).toBe(before)
  if(approach!=='first_order'){
   expect(html).toContain('data-entry-paper="'+(approach==='free'?'calendar':'market')+'"')
   expect(html).not.toContain('data-first-order-phase=')
   expect(html).not.toContain('first-attempt-v1.png')
  }
  if(approach==='free')expect(html).not.toContain('把七天留给自己')
 }finally{await h.close()}
})

it('offers every original reply and retains the saved receipt with explicit next choices after the real first-order loop',async()=>{
 const h=await life('first_order')
 try{
  const choices=()=>renderToStaticMarkup(<OpeningAttemptChoices p={h.p()} attempt={openingAttempt(h.p())!} panel="offer" onClose={vi.fn()} onInspect={vi.fn()} onMarket={vi.fn()} onExplore={vi.fn()} onFocus={vi.fn()} onNavigate={vi.fn()}/>)
  expect(choices()).toContain('接下这笔手工单');expect(choices()).toContain('婉拒这笔报价');expect(choices()).toContain('略过这次委托')
  await h.send('StartFirstOrder',{});expect(h.render()).toContain('data-first-order-phase="planned"')
  await h.send('AdvanceTime',{date:'2020-01-05'});expect(h.render()).toContain('data-first-order-phase="running"')
  await h.send('AdvanceTime',{date:'2020-01-19'});expect(h.render()).toContain('data-first-order-phase="delivery"')
  await h.send('SubmitDelivery',{contractId:h.p().features.firstOrder.contractId});expect(h.render()).toContain('data-first-order-phase="feedback"')
  await h.send('AdvanceTime',{date:'2020-01-20'})
  const raw=h.controller.exportSaved(),html=h.render(),attempt=openingAttempt(h.p())!
  expect(html).toContain('data-first-order-phase="paid"');expect(html).toContain('¥1,300');expect(html).toContain('2020-01-20')
  expect(html).toContain('接下来的日子，想怎样继续');expect(html).not.toContain('看看这份手艺，还能用在哪里')
  expect(new Set(attempt.nextChoices.map(choice=>choice.screen)).size).toBeGreaterThan(2)
  expect(h.request).not.toHaveBeenCalled();expect(h.controller.exportSaved()).toBe(raw)
 }finally{await h.close()}
})

it.each(['WorkQuarter','StartLifeWork'] as const)('follows the original saved %s after explicitly choosing an empty free calendar',async kind=>{
 const h=await life('free')
 try{
  const previous=h.p(),focus=openingAttempt(previous)!.thread.focus,payload=kind==='WorkQuarter'?{}:{kind:'rest',personId:null,reference:null}
  expect(seasonFocusAfterSave(previous,previous,kind,payload,focus,true)).toBe(focus)
  await h.send(kind,payload)
  const current=h.p(),next=seasonFocusAfterSave(previous,current,kind,payload,focus,true)!
  expect(next.kind).toBe(kind==='WorkQuarter'?'work':'life');expect(next.entityId).not.toBeNull()
  expect(next.runId).toBe(current.view.runId);expect(next.accountId).toBe('personal')
  const raw=h.controller.exportSaved()
  renderToStaticMarkup(<OpeningMoment p={current} focus={next} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(current)} onNavigate={vi.fn()} onExplore={vi.fn()}/>)
  expect(h.request).not.toHaveBeenCalled();expect(h.controller.exportSaved()).toBe(raw)
 }finally{await h.close()}
})
