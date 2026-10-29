import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {TodayScene} from './TodayScene.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {todayThread} from './today-thread.ts'
import {playerThread} from './player-thread.ts'
import {ecosystemFocusFor} from './ecosystem-player-thread.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import source135 from '../../goal-1/evidence/t17-acceptance-38/chrome-main-r7/u5-r7-10-new135-real-training-and-partial-collection.json?raw'

// Original Native capture, re-imported by the real controller. This verifies
// public producer and actual consumer handlers, not a browser or human playtest.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),current:[] as unknown[],index:0}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const index=hooks.index++,values=hooks.current;if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useImperativeHandle:()=>{}}
})
function mounted<T>(key:string,render:()=>T):T{const old=hooks.current,index=hooks.index;hooks.current=hooks.slots.get(key)??[];hooks.slots.set(key,hooks.current);hooks.index=0;try{return render()}finally{hooks.current=old;hooks.index=index}}
type Element=ReactElement<Record<string,unknown>>
const drawers=new Set(['VideoSceneChoice','CourseSceneChoice','MarketSceneChoice'])
function nodes(value:unknown):Element[]{
 if(Array.isArray(value))return value.flatMap(nodes)
 if(!isValidElement<Record<string,unknown>>(value))return []
 if(typeof value.type==='function'&&drawers.has(value.type.name)&&typeof value.props.children==='function')return nodes(value.props.children(()=>{throw Error('UNRELATED_DRAWER_NOT_EXERCISED')}))
 return [value,...['children','heading','context','feedback','facts','decisions','object','record','footer'].flatMap(key=>nodes(value.props[key]))]
}
const words=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(words).join(''):isValidElement<Record<string,unknown>>(value)?words(value.props.children):''
let controller:GameController,store:IndexedDbRunStore,p:GamePanelProps
beforeAll(async()=>{
 const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u5-today-original135'})
 controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(source135)
 const view=controller.snapshot.view!;p={controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn()}
 expect(view.revision).toBe(135);expect(controller.exportSaved()).toBe(source135)
})
afterAll(async()=>{await controller?.close();await store?.close()})
const contractFocus=()=>{const c=p.features.deepseek!.contracts[0]!,b=p.features.deepseek!.businesses.find(b=>b.id===c.businessId)!;return ecosystemFocusFor(p,{runId:p.view.runId,accountId:b.accountId,businessId:b.id,kind:'contract',recordId:c.id})}
function render(key:string,feedback?:string){
 const focus=contractFocus(),today=todayThread(p,focus,'2025-Q2')!,onFocus=vi.fn(),onPrepare=vi.fn(),onNavigate=vi.fn()
 const draw=()=>mounted(key,()=>TodayScene({p,today,headingRef:{current:null},feedback,onFocus,onPrepare,onNavigate,onResume:vi.fn(),onExplore:vi.fn(),onRecollection:vi.fn()}))
 return {focus,today,onFocus,onPrepare,onNavigate,draw}
}

it('presents actual135 remaining money as original financial facts rather than unfinished production or support',()=>{
 hooks.slots.clear();const ui=render('actual-original-money'),all=nodes(ui.draw()),tableau=all.find(n=>n.type===RoomTableau)!,c=p.features.deepseek!.contracts[0]!
 expect(c.status).toBe('completed');expect(c.balance!.receivableFen).toBe(210000);expect(c.productionJob!.status).toBe('completed');expect(c.supportJob!.status).toBe('completed')
 expect(ui.today.ongoing.filter(item=>item.focus.kind==='ecosystem')).toHaveLength(1)
 expect(ui.today.ongoing.find(item=>item.focus.kind==='ecosystem')!.ecosystemContinuation).toMatchObject({kind:'money'})
 expect(words(tableau.props.heading)).toContain('这些原款，仍要分别核对');expect(words(tableau.props.heading)).not.toContain('约定，今天还在继续')
 expect(words(tableau.props.facts)).toContain('原应收¥2,100');expect(words(tableau.props.facts)).not.toContain('件已经答应的事')
 const button=nodes(tableau.props.decisions).find(n=>n.type==='button'&&words(n).includes('核对这份原款与旧义务'))!,object=nodes(tableau.props.object).find(n=>n.type===OpeningObject)!
 expect(object.props.onActivate).toBe(button.props.onClick);(button.props.onClick as ()=>void)();expect(ui.onFocus).toHaveBeenCalledExactlyOnceWith(ui.focus)
 expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(source135)
})

it('keeps original Q2 identities while current business conditions, unanswered demand and unpaid old money remain current choices',()=>{
 const c=p.features.deepseek!.contracts[0]!,b=p.features.deepseek!.businesses.find(b=>b.id===c.businessId)!,lead=p.features.deepseek!.leads.find(l=>l.status==='open'&&l.maxPriceFen>0)!,identity={runId:p.view.runId,accountId:b.accountId,businessId:b.id}
 for(const target of [{...identity,kind:'business' as const},{...identity,kind:'lead' as const,recordId:lead.id},{...identity,kind:'contract' as const,recordId:c.id}]){
  const f=ecosystemFocusFor(p,target),thread=playerThread(p,f,'2025-Q2')
  expect(thread).toMatchObject({focus:f,focusQuarter:'2025-Q2',focusScope:'current'})
  expect(thread.line).not.toContain('仍按原约定继续');expect(thread.line).not.toContain('本季出现以下实际反馈')
 }
 expect(controller.exportSaved()).toBe(source135)
})

it('keeps generic UI status by the reading entry and exposes the actual ecology direction without creating a new contract or equity step',()=>{
 hooks.slots.clear();const ui=render('actual-directions','这次选择已经记下，尚待履行的事仍照原约定继续。');let all=nodes(ui.draw()),tableau=all.find(n=>n.type===RoomTableau)!
 expect(tableau.props.feedback).toBeNull();expect(words(tableau.props.record)).toContain('这次选择已经记下')
 const open=nodes(tableau.props.record).find(n=>n.type==='button')!;(open.props.onClick as ()=>void)();all=nodes(ui.draw())
 const ecology=all.find(n=>n.type==='button'&&words(n).startsWith('听听合作需求'))!;expect(ecology).toBeDefined();(ecology.props.onClick as ()=>void)()
 expect(ui.onFocus).toHaveBeenCalledExactlyOnceWith(ecosystemFocusFor(p,null,'personal'));expect(ui.onPrepare).not.toHaveBeenCalled();expect(ui.onNavigate).not.toHaveBeenCalled()
 expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(source135)
})
