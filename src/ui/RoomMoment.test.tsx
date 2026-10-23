import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {PlayFeatures} from './game-types.ts'
import {RoomMoment,roomMoment} from './RoomMoment.tsx'
import retainedRelayRaw from '../../goal-1/evidence/t17-acceptance-11/chrome-production-r12/r105-audit-correction-real-cash-saved.json?raw'
import knownSignalRaw from '../../goal-1/evidence/t17-acceptance-07/chrome-film/signal-input-text-before-import.json?raw'
import unreadSupplyRaw from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0071.json?raw'
import {campaignRelay} from '../application/campaign.ts'
import {projectRelay} from '../core/relay-projection.ts'

it('makes the actual first-order commitment, delivery and cash separate playable moments without mutating on render',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d08-first-moment'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d08-${++id}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'first_order'},seed:'d08-first-moment'})
 const snapshot=()=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:()=>{throw Error('RENDER_MUST_NOT_SUBMIT')}}}
 const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')
 const render=()=>{const p=snapshot(),before=controller.exportSaved(),html=renderToStaticMarkup(<RoomMoment p={p} headingRef={null} onNavigate={()=>{throw Error('RENDER_MUST_NOT_NAVIGATE')}} onExplore={()=>{throw Error('RENDER_MUST_NOT_EXPLORE')}}/>);expect(controller.exportSaved()).toBe(before);return html}
 try{
  expect(roomMoment(snapshot()).stage).toBe('offer');expect(render()).toContain('接下这笔手工单');expect(render()).toContain('先保留这一季的工作')
  await send('WorkQuarter',{});await send('StartFirstOrder',{})
  expect(roomMoment(snapshot())).toMatchObject({stage:'planned',wait:{date:'2020-01-05'}});expect(snapshot().features.firstOrder.result.paymentFen).toBe(0)
  expect(render()).not.toContain('先保留这一季的工作');expect(render()).toContain('还没有交付或回款')
  await send('AdvanceTime',{date:'2020-01-19'})
  expect(roomMoment(snapshot())).toMatchObject({stage:'delivery',command:{kind:'SubmitDelivery',payload:{contractId:snapshot().features.firstOrder.contractId}}})
  expect(render()).toContain('把这份作品交给客户');expect(snapshot().features.firstOrder.result.paymentFen).toBe(0)
  await send('SubmitDelivery',{contractId:snapshot().features.firstOrder.contractId});expect(roomMoment(snapshot()).stage).toBe('waiting')
  await send('AdvanceTime',{date:'2020-01-20'})
  expect(roomMoment(snapshot()).stage).toBe('paid');expect(snapshot().features.firstOrder.result).toMatchObject({paymentFen:130000,directCostFen:50000,netOrderFen:80000})
  expect(render()).toContain('¥1,300');expect(render()).toContain('¥800')
 }finally{await controller.close();await store.close()}
},20000)

it('keeps a real readonly current moment from submitting while its original information remains present',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d08-readonly-moment'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d08-read-${++id}`})
 await controller.initialize();await controller.newLife({backgroundId:'content_employee',playerProfile:{wishId:'autonomy',approach:'first_order'},seed:'d08-readonly-moment'})
 try{
  const saved=controller.exportSaved(),view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures
  const html=renderToStaticMarkup(<RoomMoment p={{controller,view:{...view,readOnly:true},features,accountId:'personal',request:()=>{throw Error('READ_ONLY_RENDER_MUST_NOT_SUBMIT')}}} headingRef={null} onNavigate={()=>{}} onExplore={()=>{}}/>)
  expect(html.match(/<button[^>]*aria-label="接下这笔手工单"[^>]*>/)?.[0]).toContain('disabled=""');expect(html).toContain('¥500');expect(html).toContain('个人制作成本¥500 · 1点');expect(controller.exportSaved()).toBe(saved)
 }finally{await controller.close();await store.close()}
},20000)

it('also leaves work directly available after accepting the order first, with the same actual combined budget',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d08-reverse-order'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d08-reverse-${++id}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'d08-reverse-order'})
 try{
  expect((await controller.submit(controller.prepare('StartFirstOrder',{}))).status).toBe('saved')
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,before=controller.exportSaved()
  const html=renderToStaticMarkup(<RoomMoment p={{controller,view,features,accountId:'personal',request:()=>{throw Error('RENDER_MUST_NOT_SUBMIT')}}} headingRef={null} onNavigate={()=>{}} onExplore={()=>{}}/>)
  expect(html).toContain('先保留这一季的工作');expect(html).toContain('可与副业组合');expect(controller.exportSaved()).toBe(before)
  expect((await controller.submit(controller.prepare('WorkQuarter',{}))).status).toBe('saved')
  expect(controller.snapshot.view!.budget).toMatchObject({available:1,reserved:1})
  expect((controller.snapshot.view!.features as unknown as PlayFeatures).firstOrder.status).toBe('planned')
 }finally{await controller.close();await store.close()}
},20000)

it('keeps a separate due-money responsibility ahead of a focused completed first-order delivery',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'s1-delivery-attention'})
 let id=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`s1-attention-${++id}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'first_order'},seed:'s1-delivery-attention'})
 try{
  expect((await controller.submit(controller.prepare('StartFirstOrder',{}))).status).toBe('saved')
  expect((await controller.submit(controller.prepare('AdvanceTime',{date:'2020-01-19'}))).status).toBe('saved')
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,before=controller.exportSaved()
  expect(features.firstOrder.status).toBe('awaiting_submission')
  // This bounded public display projection tests priority; it is not saved as a normal financial history.
  const attention={...features,workbench:{...features.workbench,finance:features.workbench.finance.map(a=>a.accountId==='personal'?{...a,protectionShortfallFen:1}:a)}}
  const html=renderToStaticMarkup(<RoomMoment p={{controller,view,features:attention,accountId:'personal',request:()=>{throw Error('DISPLAY_MUST_NOT_SUBMIT')}}} headingRef={null} onNavigate={()=>{}} onExplore={()=>{}}/>)
  expect(html).toContain('核对原账与到期责任');expect(html).toContain('原来的关注仍保留')
  expect(html).not.toContain('aria-label="把这份作品交给客户"')
  expect(controller.exportSaved()).toBe(before);expect(features.firstOrder.result.paymentFen).toBe(0)
 }finally{await controller.close();await store.close()}
},20000)

it('prioritises actual old relay responsibilities at zero AP over offering unavailable employment',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d08-retained-relay'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d08-retained-${++id}`})
 await controller.initialize();await controller.importNew(retainedRelayRaw)
 try{
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,before=controller.exportSaved()
  expect(view.budget.available).toBe(0)
  const p={controller,view,features,accountId:'personal',request:()=>{throw Error('RENDER_MUST_NOT_SUBMIT')}}
  expect(roomMoment(p)).toMatchObject({stage:'commitment',inspect:{screen:'relay'}})
  const html=renderToStaticMarkup(<RoomMoment p={p} headingRef={null} onNavigate={()=>{}} onExplore={()=>{}}/>)
  expect(html).toContain('未到期应收不能提前取用');expect(html).not.toContain('保留这一季的工作');expect(controller.exportSaved()).toBe(before)
 }finally{await controller.close();await store.close()}
},20000)

it('presents an actual public risk without assuming a business-choice interface, and keeps resolved history behind current obligations',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d08-known-risk'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d08-risk-${++id}`})
 await controller.initialize();await controller.importNew(knownSignalRaw)
 try{
  let view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures
  const pause=features.workbench.pause
  expect(pause?.reason).toBe('STORY_RISK_DECISION_PENDING')
  expect(roomMoment({view,features})).toMatchObject({stage:'attention',inspect:{screen:'story'}})
  expect((await controller.submit(controller.prepare('AcknowledgeStoryPause',{instanceId:pause!.instanceId}))).status).toBe('saved')
  view=controller.snapshot.view!;features=view.features as unknown as PlayFeatures
  const before=controller.exportSaved()
  expect(features.story.incidents.some(c=>c.resolvedAt===null&&c.stage!=='normal')).toBe(true)
  expect(roomMoment({view,features})).toMatchObject({stage:'commitment',inspect:{screen:'story'}})
  // A bounded public display projection checks ranking; it is never saved or described as a combined normal campaign.
  const history={...features.story,incidents:features.story.incidents.map(c=>({...c,stage:'resolved' as const,resolvedAt:view.date}))}
  const relay=projectRelay(codec.import(retainedRelayRaw),campaignRelay)
  expect(roomMoment({view,features:{...features,story:history,video:null,course:null,relay,deepseek:null}})).toMatchObject({stage:'commitment',inspect:{screen:'relay'}})
  expect(controller.exportSaved()).toBe(before)
 }finally{await controller.close();await store.close()}
},20000)

it('lets an actually completed unread supplier letter be read from the room through its original free command',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d08-unread-letter'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d08-letter-${++id}`})
 await controller.initialize();await controller.importNew(unreadSupplyRaw)
 try{
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,before=controller.exportSaved()
  const letter=features.relay!.applications.find(a=>!a.read&&a.job?.status==='completed')!
  expect(letter.approved).toBeNull()
  const moment=roomMoment({view,features})
  expect(moment.command).toMatchObject({kind:'ReadRelaySupplyDecision',payload:{applicationId:letter.id},confirm:false})
  expect(controller.exportSaved()).toBe(before)
  expect((await controller.submit(controller.prepare(moment.command!.kind,moment.command!.payload))).status).toBe('saved')
  const after=controller.snapshot.view!,relay=(after.features as unknown as PlayFeatures).relay!
  expect(relay.applications.find(a=>a.id===letter.id)?.read).toBe(true)
  expect(after.accounts).toEqual(view.accounts);expect(after.budget).toEqual(view.budget)
 }finally{await controller.close();await store.close()}
},20000)
