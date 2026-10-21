import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {PlayFeatures} from './game-types.ts'
import {NarrativeScene,SceneAttention} from './NarrativeScene.tsx'
import {SceneThreads} from './SceneThreads.tsx'
import {riskThreads} from './scene-thread-notes.ts'
import {annualRoomImproved} from './annual-scene.ts'
import {AnnualScene} from './AnnualScene.tsx'
import {YearReview} from './YearReview.tsx'

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
  expect(first).toContain('查看这季的工作安排')
  expect(first).toContain('查看报价，决定是否接单')
  expect(first).toContain('让日子向前')
  // Explicit UI projections exercise presentation guards; these are not completed campaigns.
  const delivery={...h.features,workbench:{...h.features.workbench,progression:{...h.features.workbench.progression,requiresDelivery:true}}}
  const waiting=renderToStaticMarkup(<NarrativeScene {...h.p} features={delivery}/>)
  expect(waiting).not.toContain('让日子向前')
  expect(waiting).toContain('先面对这份交付')
  const ended={...h.features,workbench:{...h.features.workbench,atQuarterEnd:true}}
  expect(renderToStaticMarkup(<NarrativeScene {...h.p} view={{...h.view,date:'2025-12-31'}} features={ended}/>)).not.toContain('走进下一季')
  const readOnly=renderToStaticMarkup(<NarrativeScene {...h.p} view={{...h.view,readOnly:true}}/>)
  expect(readOnly.match(/<button[^>]*aria-label="查看这季的工作安排"[^>]*>/)?.[0]).toContain('disabled=""')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
},20000)

it('ordinary saved time keeps the person portrait in the game scene while its full reel is optional',async()=>{
 const h=await normalScene()
 try{
  expect((await h.controller.submit(h.controller.prepare('AdvanceTime',{date:'2020-01-04'}))).status).toBe('saved')
  const view=h.controller.snapshot.view!,features=view.features as unknown as PlayFeatures,before=h.controller.exportSaved()
  const html=renderToStaticMarkup(<NarrativeScene {...h.p} view={view} features={features} screen="life" receipt="2020-01-04，原安排已经记下。" receiptKind="AdvanceTime"/>)
  expect(html).toContain('scene-person-focus');expect(html).toContain('scene-time-note');expect(html).not.toContain('<dialog')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
},20000)

it('an actually accepted promise is named with its deadline outside the operation sheet',async()=>{
 const h=await normalScene()
 try{
  for(const [kind,payload] of [['StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null}],['AdvanceTime',{date:'2020-01-04'}]] as const)expect((await h.controller.submit(h.controller.prepare(kind,payload))).status).toBe('saved')
  const offered=(h.controller.snapshot.view!.features as unknown as PlayFeatures).life.promises.find(o=>o.status==='offered')!
  expect((await h.controller.submit(h.controller.prepare('AcceptLifePromise',{promiseId:offered.id,consent:true}))).status).toBe('saved')
  const view=h.controller.snapshot.view!,features=view.features as unknown as PlayFeatures,before=h.controller.exportSaved()
  const html=renderToStaticMarkup(<SceneThreads p={{...h.p,view,features}} onOpen={h.p.onNavigate}/>)
  expect(html).toContain('全部持续牵挂');expect(html).toContain('唐萤');expect(html).toContain(offered.deadline);expect(html).toContain('仍需另行工作');expect(html).toContain('¥300')
  const unavailableBusinesses={...features,course:null,relay:null,deepseek:null,routines:null}
  expect(renderToStaticMarkup(<SceneThreads p={{...h.p,view,features:unavailableBusinesses}} onOpen={h.p.onNavigate}/>)).toContain(offered.deadline)
  const scene=renderToStaticMarkup(<NarrativeScene {...h.p} view={view} features={features} screen="life"/>)
  expect(scene).toContain('开始兑现这项约定');expect(scene).toContain('还需要留出时间去做');expect(scene).toContain(offered.deadline);expect(scene).toContain('个人¥300')
  expect(scene).not.toContain('已经实际做到');expect(scene).not.toContain('你做到了');expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
},20000)

it('an invitation remains separate from accepting and completing it, and can be declined from the scene',async()=>{
 const h=await normalScene()
 try{
  await h.controller.submit(h.controller.prepare('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null}));await h.controller.submit(h.controller.prepare('AdvanceTime',{date:'2020-01-04'}))
  const view=h.controller.snapshot.view!,features=view.features as unknown as PlayFeatures,before=h.controller.exportSaved()
  const html=renderToStaticMarkup(<NarrativeScene {...h.p} view={view} features={features} screen="life"/>)
  expect(html).toContain('唐萤有一件事，想请你一起做');expect(html).toContain('看清约定后答应');expect(html).toContain('婉拒唐萤的邀请');expect(html).toContain('以后仍需个人¥300')
  expect(html).not.toContain('你已经接受');expect(html).not.toContain('你已答应');expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
},20000)

it('every unresolved public risk survives the ordinary highlight budget without assuming recovery',()=>{
 const base={kind:'agent' as const,stage:'signal' as const,deadline:'2025-01-31',resolvedAt:null,businessIds:['public-course'],knownCostFen:100,paidWorkCostFen:0,unverifiedFeePaidFen:0,unpaidKnownCostFen:100}
 // Public display facts only: no private verdict, permissions, RNG or stored campaign fixture.
 const notes=riskThreads([...Array.from({length:6},(_,i)=>({...base,id:'public-risk-'+i})),{...base,id:'resolved-risk',resolvedAt:'2025-01-20'},{...base,id:'normal-risk',stage:'normal'}],()=> '课程工作室')
 expect(notes).toHaveLength(6);expect(notes.map(n=>n.id)).toEqual(Array.from({length:6},(_,i)=>'risk:public-risk-'+i))
 for(const note of notes){expect(note.title).toContain('课程工作室');expect(note.title).toContain('仍待核实');expect(note.detail).toContain('暂停自报不代表独立恢复');expect(note.screen).toBe('story')}
})

it('annual scenes use completion as of that date, and text mode needs no decorative image',async()=>{
 const h=await normalScene()
 try{
  await h.controller.submit(h.controller.prepare('StartLifeWork',{kind:'workspace',personId:null,reference:null}))
  let view=h.controller.snapshot.view!,features=view.features as unknown as PlayFeatures
  expect(annualRoomImproved(features.life.jobs,'2020-01-08')).toBe(false)
  await h.controller.submit(h.controller.prepare('AdvanceTime',{date:'2020-01-08'}));view=h.controller.snapshot.view!;features=view.features as unknown as PlayFeatures
  const before=h.controller.exportSaved();expect(annualRoomImproved(features.life.jobs,'2020-01-07')).toBe(false);expect(annualRoomImproved(features.life.jobs,'2020-01-08')).toBe(true)
  const html=renderToStaticMarkup(<AnnualScene life={features.life} year={features.life.years[0]!} textOnly/>);expect(html).toContain('桌椅与照明已经改善');expect(html).not.toContain('<img');expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
},20000)

it('the year retains the actual promise beyond its five selected causal highlights',async()=>{
 const h=await normalScene()
 try{
  await h.controller.submit(h.controller.prepare('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null}));await h.controller.submit(h.controller.prepare('AdvanceTime',{date:'2020-01-04'}))
  let features=h.controller.snapshot.view!.features as unknown as PlayFeatures;const offered=features.life.promises.find(o=>o.status==='offered')!
  await h.controller.submit(h.controller.prepare('AcceptLifePromise',{promiseId:offered.id,consent:true}));await h.controller.submit(h.controller.prepare('FulfillLifePromise',{promiseId:offered.id}));await h.controller.submit(h.controller.prepare('AdvanceTime',{date:'2020-01-07'}))
  const view=h.controller.snapshot.view!;features=view.features as unknown as PlayFeatures;const before=h.controller.exportSaved()
  const html=renderToStaticMarkup(<YearReview p={{...h.p,view,features}} onPlan={h.p.onPeople}/>);expect(html).toContain('这一年提出的全部邀请与原约定');expect(html).toContain('唐萤 · 已经通过实际工作兑现');expect(html).toContain('2020-01-07留下这项结果');expect(h.controller.exportSaved()).toBe(before)
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

it('an actually planned first order remains visible without being called completed or paid',async()=>{
 const h=await normalScene()
 try{
  const result=await h.controller.submit(h.controller.prepare('StartFirstOrder',{}))
  expect(result.status).toBe('saved')
  const view=h.controller.snapshot.view!,features=view.features as unknown as PlayFeatures,before=h.controller.exportSaved()
  const html=renderToStaticMarkup(<NarrativeScene {...h.p} view={view} features={features}/>)
  expect(html).toContain('这份作品，已排进日历')
  expect(html).toContain('2020-01-05')
  expect(html).toContain('2020-01-19')
  expect(html).toContain('此刻还没有交付和回款')
  expect(html).not.toContain('客户已经付了款')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
},20000)

it('a quarter result has its own scene and does not reannounce an old first order in another quarter',async()=>{
 const h=await normalScene(),before=h.controller.exportSaved()
 try{
  // These bounded display projections test chapter attribution, not financial completion.
  const firstOrder={...h.features.firstOrder,result:{...h.features.firstOrder.result,paymentFen:130000,directCostFen:50000,netOrderFen:80000}}
  const later={...h.features,firstOrder,workbench:{...h.features.workbench,quarter:'2020-Q2',atQuarterEnd:true,progression:{...h.features.workbench.progression,nextDate:'2020-07-01',nextQuarterDate:'2020-07-01'}}}
  const html=renderToStaticMarkup(<NarrativeScene {...h.p} view={{...h.view,date:'2020-06-30'}} features={later}/>)
  expect(html).toContain('这一季，你留下了什么')
  expect(html).toContain('翻看本季实际记录')
  expect(html).not.toContain('这笔小单，客户已经付了款')
  expect(html).not.toContain('查看这季的工作安排')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
},20000)
it('keeps actual first-order delivery ahead of video review and preserves read-only guards on the new scene action',async()=>{
 const h=await normalScene()
 try{
  expect((await h.controller.submit(h.controller.prepare('StartFirstOrder',{}))).status).toBe('saved')
  expect((await h.controller.submit(h.controller.prepare('OpenVideoChannel',{name:'真实阶段的内容账号',segment:'local_merchants'}))).status).toBe('saved')
  let view=h.controller.snapshot.view!,features=view.features as unknown as PlayFeatures
  const channel=features.video!.channels[0]!
  expect((await h.controller.submit(h.controller.prepare('HireWorker',{businessId:channel.businessId,definitionId:'editor-lin'}))).status).toBe('saved')
  view=h.controller.snapshot.view!;const worker=view.operations!.workers[0]!
  expect((await h.controller.submit(h.controller.prepare('StartVideoWork',{channelId:channel.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:[worker.id],startAt:view.date}))).status).toBe('saved')
  expect((await h.controller.submit(h.controller.prepare('AdvanceTime',{date:'2020-01-19'}))).status).toBe('saved')
  view=h.controller.snapshot.view!;features=view.features as unknown as PlayFeatures
  expect(features.workbench.progression.requiresDelivery).toBe(true)
  const priority=renderToStaticMarkup(<NarrativeScene {...h.p} view={view} features={features} screen="video"/>)
  expect(priority).toContain('核对并提交这份作品');expect(priority).not.toContain('人工核对作品1与使用说明')
  expect((await h.controller.submit(h.controller.prepare('SubmitDelivery',{contractId:features.firstOrder.contractId}))).status).toBe('saved')
  view=h.controller.snapshot.view!;features=view.features as unknown as PlayFeatures;const before=h.controller.exportSaved()
  const actionable=renderToStaticMarkup(<NarrativeScene {...h.p} view={view} features={features} screen="video"/>)
  expect(actionable).toContain('人工核对作品1与使用说明')
  const readonly=renderToStaticMarkup(<NarrativeScene {...h.p} view={{...view,readOnly:true}} features={features} screen="video"/>)
  expect(readonly.match(/<button[^>]*aria-label="人工核对作品1与使用说明"[^>]*>/)?.[0]).toContain('disabled=""')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
},20000)
