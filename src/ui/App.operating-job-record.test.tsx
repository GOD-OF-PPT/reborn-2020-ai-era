import {expect,it,vi} from 'vitest'
import {createRef,isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t17-acceptance-40/equity-worker-r329/prelude-r1/before-winddown.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import App from './App.tsx'
import {CinematicRoom} from './CinematicRoom.tsx'
import {OperatingJobRecord,type OperatingJobDraft} from './OperatingJobRecord.tsx'
import {Dialog} from './Dialog.tsx'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {OperatingJobTarget} from './operating-job-target.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {RoomMoment,roomMoment} from './RoomMoment.tsx'
import {SceneJournal} from './SceneJournal.tsx'
import {MarketSceneChoice} from './MarketSceneChoice.tsx'
import {VideoSceneChoice} from './VideoSceneChoice.tsx'
import {CourseSceneChoice} from './CourseSceneChoice.tsx'
import {RelaySceneChoice} from './RelaySceneChoice.tsx'

// Actual App callbacks and original normal Controller/fakeIDB. DOM/effects and
// Chrome remain separate; no test changes viewport, geometry or compatibility.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const values=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,values);const i=hooks.index++;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return[values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return{...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useId:()=>hooks.scope,useEffect:()=>{},useSyncExternalStore:<T,>(_subscribe:unknown,get:()=>T)=>get(),useMemo:<T,>(create:()=>T,deps:readonly unknown[])=>{const values=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,values);const i=hooks.index++,old=values[i] as {deps:readonly unknown[];value:T}|undefined;if(!old||old.deps.length!==deps.length||deps.some((d,n)=>!Object.is(d,old.deps[n])))values[i]={deps:[...deps],value:create()};return(values[i] as {value:T}).value}}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(value:unknown):Element[]=>Array.isArray(value)?value.flatMap(elements):isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children),...elements(value.props.footer)]:[]
const text=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''
function invoke(e:Element,name:string,...args:unknown[]){const fn=e.props[name];if(e.props.disabled||typeof fn!=='function')throw Error('ACTUAL_ENABLED_APP_CALLBACK_REQUIRED');return fn(...args)}
async function setup(name:string,faulty=false){
 const codec=createCampaignCodec(),factory=new IDBFactory(),locks=new MemoryWriterAccess();let armed=false
 const fault=abortAfterHeadWrite(factory,name,()=>armed),store=new IndexedDbRunStore({codec,factory:faulty?fault.factory:factory,keyRange:IDBKeyRange,name}),controller=new GameController({codec,store,locks})
 await controller.initialize();await controller.importNew(raw)
 const render=(owner=controller,scope=name)=>{hooks.scope=scope;hooks.index=0;return elements(App({controller:owner,focusPreferenceStorage:{getItem:()=>null,setItem:()=>{throw Error('READING_MUST_NOT_WRITE_GAME_OR_BOOKMARK')}}}))}
 const original=controller.snapshot.view!,company=original.operations!.businesses.find(b=>b.definitionId==='ecosystem-service')!,own=original.operations!.jobs.find(j=>j.definitionId==='service-maintenance')!,cross=original.operations!.jobs.find(j=>j.definitionId==='business-preparation')!
 const target=(job=own):OperatingJobTarget=>({runId:original.runId,accountId:original.operations!.businesses.find(b=>b.id===job.businessId)!.accountId,businessId:job.businessId,jobId:job.id})
 const open=(job=own,owner=controller,scope=name)=>{const room=render(owner,scope).find(e=>e.type===CinematicRoom)!;expect(room).toBeDefined();invoke(room,'onNavigate','deepseek',{operatingJobTarget:target(job)})}
 const record=(owner=controller,scope=name)=>{const found=render(owner,scope).find(e=>e.type===OperatingJobRecord);expect(found).toBeDefined();return found!}
 const modal=(label:string)=>{const found=render().find(e=>e.type===Dialog&&e.props.title===label);expect(found).toBeDefined();return found!}
 const finish=async()=>{await controller.close();await store.close()}
 return{codec,controller,store,locks,fault,company,own,cross,target,render,open,record,modal,arm:()=>{armed=true},finish}
}
function update(record:Element,draft:OperatingJobDraft){return (record.props.onDraftChange as (draft:OperatingJobDraft)=>boolean)(draft)}
function request(record:Element){return(record.props.p as GamePanelProps).request}

it('uses the exact same original reading activation for the room object and main thought, without a repeated near-menu',async()=>{
 const h=await setup('u6-original-job-object-direct')
 try{
  const view=h.controller.snapshot.view!,p:GamePanelProps={controller:h.controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn()},fallback=roomMoment(p),onNavigate=vi.fn()
  hooks.scope='u6-original-job-object-moment';hooks.index=0
  const tree=OpeningMoment({p,fallback,headingRef:createRef<HTMLHeadingElement>(),onNavigate,onExplore:vi.fn()})
  const readers=new Set<unknown>([MarketSceneChoice,VideoSceneChoice,CourseSceneChoice,RelaySceneChoice])
  function expand(value:unknown):Element[]{
   if(Array.isArray(value))return value.flatMap(expand)
   if(!isValidElement<Record<string,unknown>>(value))return []
   const child=value.props.children
   if(typeof child==='function')return expand(child(readers.has(value.type)?vi.fn():null))
   return[value,...expand(child)]
  }
  const tableau=expand(tree).find(e=>e.type===RoomTableau)!,object=tableau.props.object as Element,main=elements(tableau.props.decisions).find(e=>e.type==='button'&&text(e.props.children).includes(fallback.inspect!.label))!
  expect(object.type).toBe(OpeningObject);expect(main).toBeDefined()
  expect(object.props.onActivate).toBe(main.props.onClick)
  invoke(object,'onActivate')
  expect(onNavigate).toHaveBeenCalledOnce()
  expect(onNavigate).toHaveBeenCalledWith('deepseek',{accountId:h.company.accountId,operatingJobTarget:h.target()})
  expect(h.controller.exportSaved()).toBe(raw)
 }finally{await h.finish()}
})

it('opens the same original job in place instead of switching the room to a new cooperation or writing a preference',async()=>{
 const h=await setup('u6-original-job-room')
 try{
  h.open();const book=h.record()
  expect(book.props.target).toEqual(h.target())
  expect(h.render().some(e=>e.type===CinematicRoom)).toBe(true)
  expect(update(book,{resource:'player-production',date:'2025-04-07'})).toBe(true)
  expect(h.record().props.initialDraft).toEqual({resource:'player-production',date:'2025-04-07'})
  invoke(book,'onClose');expect(h.render().some(e=>e.type===OperatingJobRecord)).toBe(false)
  h.open();expect(h.record().props.initialDraft).toEqual({resource:'player-production',date:'2025-04-07'})
  expect(h.controller.exportSaved()).toBe(raw)
 }finally{await h.finish()}
})

it('isolates the worker other-business draft and retires old A edits, closing and commitments through an A→B→A round trip',async()=>{
 const h=await setup('u6-original-job-ticket')
 try{
  h.open();const oldA=h.record();update(oldA,{resource:'player-production',date:'2025-04-07'})
  invoke(oldA,'onClose');h.open(h.cross);const b=h.record();update(b,{resource:h.cross.resources[0]!,date:'2025-04-09'})
  expect(update(oldA,{resource:'stale-resource',date:'2025-12-31'})).toBe(false);invoke(oldA,'onClose')
  expect(h.record().props.target).toEqual(h.target(h.cross))
  request(oldA)('InterruptJob',{jobId:h.own.id},'旧A不应提交',true)
  expect(h.render().some(e=>e.type===Dialog&&e.props.title==='旧A不应提交')).toBe(false)
  invoke(b,'onClose');h.open();const fresh=h.record()
  expect(fresh.props.initialDraft).toEqual({resource:'player-production',date:'2025-04-07'})
  expect(update(oldA,{resource:'player-production',date:'2025-11-01'})).toBe(false)
  request(oldA)('InterruptJob',{jobId:h.own.id},'回到A也不复活旧回调',true)
  expect(h.render().some(e=>e.type===Dialog&&e.props.title==='回到A也不复活旧回调')).toBe(false)
  expect(h.controller.exportSaved()).toBe(raw)
 }finally{await h.finish()}
})

it('keeps an actual second controller read-only while letting it inspect the same original date draft',async()=>{
 const h=await setup('u6-original-job-reader'),reader=new GameController({codec:h.codec,store:h.store,locks:h.locks})
 try{
  await reader.initialize();await reader.continueLife(h.controller.snapshot.view!.runId)
  expect(reader.snapshot.view!.readOnly).toBe(true)
  h.open(h.own,reader,'u6-real-job-reader-app');const book=h.record(reader,'u6-real-job-reader-app')
  expect(update(book,{resource:'player-production',date:'2025-04-07'})).toBe(true)
  request(book)('InterruptJob',{jobId:h.own.id},'只读不应取得停止权限',true)
  expect(h.render(reader,'u6-real-job-reader-app').some(e=>e.type===Dialog&&e.props.title==='只读不应取得停止权限')).toBe(false)
  expect(reader.exportSaved()).toBe(raw);expect(h.controller.exportSaved()).toBe(raw)
 }finally{await reader.close();await h.finish()}
})

it('keeps the old actual job and draft after head.put abort, then reopens only its original saved retry with unchanged cash and AP',async()=>{
 const h=await setup('u6-original-job-abort',true)
 try{
  h.open();const before=h.controller.snapshot.view!,book=h.record(),body={jobId:h.own.id,resources:['player-production'],startAt:'2025-04-07'}
  update(book,{resource:'player-production',date:'2025-04-07'})
  const submit=vi.spyOn(h.controller,'submit'),retry=vi.spyOn(h.controller,'retry')
  h.arm();request(book)('RescheduleJob',body,'原维护改期',true)
  const review=h.modal('原维护改期'),decide=elements(review).find(e=>e.type==='button'&&text(e.props.children)==='就这样决定 →')!
  invoke(decide,'onClick');expect((await submit.mock.results.at(-1)!.value).status).toBe('unsaved')
  await new Promise(resolve=>setTimeout(resolve,0))
  expect(h.fault.trace).toEqual({writeSucceeded:true,abortIssued:true});expect(h.controller.exportSaved()).toBe(raw)
  expect((await h.store.load(before.runId))!.run).toEqual(h.codec.import(raw))
  const retained=h.record(),old=(retained.props.p as GamePanelProps).view.operations!.jobs.find(j=>j.id===h.own.id)!
  expect(old.startAt).toBe('2025-04-03');expect(retained.props.initialDraft).toEqual({resource:'player-production',date:'2025-04-07'})
  expect(update(retained,{resource:'player-production',date:'2025-10-01'})).toBe(false)
  invoke(retained,'onClose')
  const originalRetry=h.render().find(e=>e.type==='button'&&text(e.props.children)==='重试保存原候选')!
  invoke(originalRetry,'onClick');expect((await retry.mock.results.at(-1)!.value).status).toBe('saved')
  await new Promise(resolve=>setTimeout(resolve,0))
  const current=h.controller.snapshot.view!,restored=h.record()
  expect(restored.props.target).toEqual(h.target());expect(restored.props.initialDraft).toEqual({resource:'player-production',date:'2025-04-07'})
  expect(current.operations!.jobs.find(j=>j.id===h.own.id)).toMatchObject({startAt:'2025-04-07',completeAt:'2025-04-09',status:'planned'})
  expect(current.accounts).toEqual(before.accounts);expect(current.budget).toEqual(before.budget)
  expect((await h.store.load(current.runId))!.run).toEqual(h.codec.import(h.controller.exportSaved()))
  expect(submit).toHaveBeenCalledTimes(1);expect(retry).toHaveBeenCalledTimes(1)
 }finally{await h.finish()}
})

it('does not steal a later explicit B reading after the original A retry saves',async()=>{
 const h=await setup('u6-original-job-retry-other',true)
 try{
  h.open();const a=h.record(),submit=vi.spyOn(h.controller,'submit'),retry=vi.spyOn(h.controller,'retry')
  h.arm();request(a)('RescheduleJob',{jobId:h.own.id,resources:['player-production'],startAt:'2025-04-07'},'原A改期',true)
  invoke(elements(h.modal('原A改期')).find(e=>e.type==='button'&&text(e.props.children)==='就这样决定 →')!,'onClick')
  expect((await submit.mock.results.at(-1)!.value).status).toBe('unsaved');await new Promise(resolve=>setTimeout(resolve,0))
  invoke(h.record(),'onClose');h.open(h.cross);const b=h.record();invoke(b,'onClose')
  const originalRetry=h.render().find(e=>e.type==='button'&&text(e.props.children)==='重试保存原候选')!
  invoke(originalRetry,'onClick');expect((await retry.mock.results.at(-1)!.value).status).toBe('saved');await new Promise(resolve=>setTimeout(resolve,0))
  expect(h.render().some(e=>e.type===OperatingJobRecord)).toBe(false)
  h.open(h.cross);expect(h.record().props.target).toEqual(h.target(h.cross))
 }finally{await h.finish()}
})

it('keeps the original public wait failure bound to the same job and restores only its durably retried start',async()=>{
 const h=await setup('u6-original-job-wait-retry',true)
 try{
  h.open();const book=h.record(),p=book.props.p as GamePanelProps,wait=vi.spyOn(h.controller,'waitForFeedback'),retry=vi.spyOn(h.controller,'retry')
  h.arm();p.requestWait!('2025-04-03','等原维护实际开工',true)
  invoke(elements(h.modal('等原维护实际开工')).find(e=>e.type==='button'&&text(e.props.children)==='就这样决定 →')!,'onClick')
  expect((await wait.mock.results.at(-1)!.value).status).toBe('unsaved');await new Promise(resolve=>setTimeout(resolve,0))
  expect(h.controller.exportSaved()).toBe(raw);expect(h.fault.trace).toEqual({writeSucceeded:true,abortIssued:true})
  expect((h.record().props.p as GamePanelProps).view.operations!.jobs.find(j=>j.id===h.own.id)!.status).toBe('planned')
  invoke(h.record(),'onClose')
  invoke(h.render().find(e=>e.type==='button'&&text(e.props.children)==='重试保存原候选')!,'onClick')
  expect((await retry.mock.results.at(-1)!.value).status).toBe('saved');await new Promise(resolve=>setTimeout(resolve,0))
  const current=h.controller.snapshot.view!,restored=h.record()
  expect(restored.props.target).toEqual(h.target());expect(current.date).toBe('2025-04-03')
  expect(current.operations!.jobs.find(j=>j.id===h.own.id)!.status).toBe('running')
  expect(current.budget).toMatchObject({available:1,reserved:0,spent:3})
  expect((await h.store.load(current.runId))!.run).toEqual(h.codec.import(h.controller.exportSaved()))
 }finally{await h.finish()}
})

it('connects the actual room calendar consumer through its original work row to the same job paper',async()=>{
 const h=await setup('u6-original-job-real-calendar')
 try{
  const drawRoom=()=>{const original=h.render().find(e=>e.type===CinematicRoom)!;hooks.scope='u6-real-calendar-room';hooks.index=0;return elements(Reflect.apply(CinematicRoom,undefined,[original.props]))}
  const moment=drawRoom().find(e=>e.type===RoomMoment)!;expect(moment).toBeDefined();invoke(moment,'onResponsibilities')
  const responsibilities=drawRoom().find(e=>e.type===Dialog&&e.props.title==='桌上的牵挂')!,calendar=elements(responsibilities).find(e=>e.type===SceneJournal&&e.props.inlineOperating===true)!
  expect(calendar).toBeDefined();hooks.scope='u6-real-calendar-list';hooks.index=0
  const list=elements(Reflect.apply(SceneJournal,undefined,[calendar.props])),rows=list.filter(e=>e.type==='section'&&e.props.className==='journal-record')
  expect(rows).toHaveLength(2)
  const own=rows.find(e=>text(e.props.children).includes('这份维护'))!
  invoke(elements(own).find(e=>e.type==='button')!,'onClick')
  expect(h.record().props.target).toEqual(h.target())
  expect(drawRoom().some(e=>e.type===Dialog&&e.props.title==='桌上的牵挂')).toBe(false)
  expect(h.controller.exportSaved()).toBe(raw)
 }finally{await h.finish()}
})

it('keeps the original committed cash-gap advisory visible without blocking a legal task wait or borrowing a foreign forecast',async()=>{
 const h=await setup('u6-original-job-cash-gap')
 try{
  h.open();const book=h.record(),p=book.props.p as GamePanelProps
  hooks.scope='u6-original-job-gap-paper';hooks.index=0
  const paper=Reflect.apply(OperatingJobRecord,undefined,[book.props]),copy=text(paper)
  expect(copy).toContain('2025-05-31');expect(copy).toContain('¥1,316.12');expect(copy).toContain('按现有承诺预计不足')
  expect(h.controller.preview(h.controller.prepare('AdvanceTime',{date:'2025-04-03'})).allowed).toBe(true)
  const foreign={...p,features:{...p.features,workbench:{...p.features.workbench,finance:p.features.workbench.finance.map(f=>f.accountId===h.company.accountId?{...f,forecast:{...f.forecast,accountId:'personal'}}:f)}}}
  hooks.scope='u6-original-job-foreign-gap-paper';hooks.index=0
  const neutral=text(Reflect.apply(OperatingJobRecord,undefined,[{...book.props,p:foreign}]))
  expect(neutral).not.toContain('¥1,316.12');expect(neutral).toContain('资金情景来源待核对')
  expect(h.controller.exportSaved()).toBe(raw)
 }finally{await h.finish()}
})
