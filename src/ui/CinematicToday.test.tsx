import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {CinematicRoom} from './CinematicRoom.tsx'
import {TodayScene} from './TodayScene.tsx'
import {todayThread} from './today-thread.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {Dialog} from './Dialog.tsx'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'

// A component callback/effect driver with real original Controller/codec and
// fake IDB. It is not a browser, geometry, performance or human playtest.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),values:[] as unknown[],index:0,effects:[] as (()=>void)[]}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const useState=<T,>(initial:T|(()=>T))=>{const index=hooks.index++,values=hooks.values;if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const}
 const useEffect=(callback:()=>void|(()=>void),deps?:readonly unknown[])=>{
  const [slot]=useState(()=>({deps:null as readonly unknown[]|null,cleanup:undefined as void|(()=>void)}))
  if(slot.deps===null||deps===undefined||deps.length!==slot.deps.length||deps.some((value,index)=>!Object.is(value,slot.deps![index]))){hooks.effects.push(()=>{slot.cleanup?.();slot.cleanup=callback()});slot.deps=deps??null}
 }
 return {...actual,useState,useRef:<T,>(initial:T)=>useState(()=>({current:initial}))[0],useEffect,useImperativeHandle:()=>{},useId:()=> 'today-reading-test'}
})
function mounted<T>(key:string,render:()=>T):T{
 const prior=hooks.values,index=hooks.index;hooks.values=hooks.slots.get(key)??[];hooks.slots.set(key,hooks.values);hooks.index=0;hooks.effects=[]
 try{const result=render(),effects=hooks.effects.slice();effects.forEach(effect=>effect());return result}finally{hooks.values=prior;hooks.index=index}
}
type Element=ReactElement<Record<string,unknown>>
function elements(value:unknown):Element[]{
 if(Array.isArray(value))return value.flatMap(elements)
 if(!isValidElement<Record<string,unknown>>(value))return []
 if(typeof value.type==='function'&&['VideoSceneChoice','CourseSceneChoice','MarketSceneChoice'].includes(value.type.name)&&typeof value.props.children==='function')return elements(value.props.children(()=>{}))
 const own=[value,...elements(value.props.children)]
 if(typeof value.type==='function'&&value.type.name==='RoomTableau')for(const key of ['intention','decisions','record','object'])own.push(...elements(value.props[key]))
 return own
}
const text=(value:unknown):string=>typeof value==='string'?value:Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''
const rest={kind:'rest',personId:null,reference:null}
let sequence=0
async function frame(){
 const name='today-reading-'+(++sequence),codec=createCampaignCodec();let armed=false
 const seam=abortAfterHeadWrite(new IDBFactory(),name,()=>armed),store=new IndexedDbRunStore({codec,factory:seam.factory,keyRange:IDBKeyRange,name})
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++sequence)})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',seed:name,playerProfile:{wishId:'autonomy',approach:'first_order'}})
 const props=():GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn()}}
 return {name,controller,store,props,arm:()=>{armed=true},trace:seam.trace,close:async()=>{await controller.close();await store.close()}}
}
afterEach(()=>{hooks.slots.clear();vi.unstubAllGlobals()})
function roomDriver(f:Awaited<ReturnType<typeof frame>>,port:GamePanelProps['controller']=f.controller){
 vi.stubGlobal('document',{addEventListener:vi.fn(),removeEventListener:vi.fn()})
 const initial=f.props(),focus=playerThread(initial).focus,today={runId:initial.view.runId,revision:initial.view.revision},onFocus=vi.fn(),request=vi.fn()
 const render=(selected:OpeningFocus=focus,readingContext='original-reading')=>mounted(f.name+'-room',()=>CinematicRoom({...f.props(),controller:port,request,readingContext,initialToday:today,openingFocus:selected,onOpeningFocus:onFocus,headingRef:null,notice:null,onNavigate:vi.fn(),onPeople:vi.fn(),onYear:vi.fn()}))
 const requestFrom=(tree:ReturnType<typeof render>)=>{const leaf=elements(tree).find(row=>typeof row.type==='function'&&row.type.name==='RoomMoment');if(!leaf)throw Error('ORIGINAL_ROOM_REQUIRED');return (leaf.props.p as GamePanelProps).request}
 return {focus,onFocus,request,render,requestFrom}
}

it('previews and cancels a personal choice without replacing the original bookmark or requesting a command',async()=>{
 const f=await frame()
 try{
  const p=f.props(),focus=playerThread(p).focus,onPrepare=vi.fn(),raw=f.controller.exportSaved(),today=todayThread(p,focus)!
  const render=()=>mounted(f.name+'-today',()=>TodayScene({p,today,headingRef:null,onFocus:vi.fn(),onPrepare,onResume:vi.fn(),onExplore:vi.fn(),onRecollection:vi.fn(),onNavigate:vi.fn()}))
  const directions=elements(render()).find(row=>row.type==='button'&&text(row.props.children).startsWith('想想今天'))!;expect(directions).toBeDefined();(directions.props.onClick as ()=>void)()
  const button=elements(render()).find(row=>row.type==='button'&&text(row.props.children).startsWith('留点时间给自己'))!;expect(button).toBeDefined();(button.props.onClick as ()=>void)()
  const dialog=elements(render()).find(row=>row.type===Dialog)!;expect(dialog.props.title).toBe('留点时间给自己');expect(onPrepare).not.toHaveBeenCalled()
  ;(dialog.props.onClose as ()=>void)();expect(elements(render()).some(row=>row.type===Dialog)).toBe(false)
  expect(onPrepare).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled();expect(f.controller.exportSaved()).toBe(raw)
 }finally{await f.close()}
},60000)

it('keeps the old focus through a real head-write abort, then follows the actual new life job only after the original retry saves',async()=>{
 const f=await frame()
 try{
  const driver=roomDriver(f),old=f.controller.exportSaved(),initial=driver.render();driver.requestFrom(initial)('StartLifeWork',rest,'核对休整',true);driver.render()
  expect(driver.request).toHaveBeenCalledExactlyOnceWith('StartLifeWork',rest,'核对休整',true);expect(driver.onFocus).not.toHaveBeenCalled();expect(f.controller.exportSaved()).toBe(old)
  f.arm();expect((await f.controller.submit(f.controller.prepare('StartLifeWork',rest))).status).toBe('unsaved');driver.render()
  expect(f.trace).toEqual({writeSucceeded:true,abortIssued:true});expect(f.controller.exportSaved()).toBe(old);expect(driver.onFocus).not.toHaveBeenCalled()
  expect((await f.controller.retry()).status).toBe('saved');driver.render()
  const p=f.props(),job=p.features.life.jobs.find(job=>job.kind==='rest')!;expect(job).toBeDefined();expect(p.view.budget.available).toBe(3)
  expect(driver.onFocus).toHaveBeenCalledExactlyOnceWith({runId:p.view.runId,kind:'life',accountId:'personal',selection:'rest',entityId:job.id})
  driver.render();expect(driver.onFocus).toHaveBeenCalledOnce()
 }finally{await f.close()}
},60000)

it('retires the old handoff when the player explicitly changes reading before the original command saves',async()=>{
 const f=await frame()
 try{
  const driver=roomDriver(f);driver.requestFrom(driver.render())('StartLifeWork',rest,'核对休整',true)
  const other:OpeningFocus={runId:f.props().view.runId,kind:'free',accountId:'personal',entityId:null};driver.render(other)
  expect((await f.controller.submit(f.controller.prepare('StartLifeWork',rest))).status).toBe('saved');driver.render(other)
  expect(driver.onFocus).not.toHaveBeenCalled();expect(f.props().features.life.jobs.some(job=>job.kind==='rest')).toBe(true)
 }finally{await f.close()}
},60000)


it('retires a pending choice after a runtime session change even when the run, revision and reading remain the same',async()=>{
 const f=await frame();let session='before-reload'
 try{
  const port=new Proxy(f.controller,{get(object,key){if(key==='runtimeSession')return session;const value=Reflect.get(object,key,object);return typeof value==='function'?value.bind(object):value}})
  const driver=roomDriver(f,port);driver.requestFrom(driver.render())('StartLifeWork',rest,'核对休整',true)
  session='after-reload';driver.render()
  expect((await f.controller.submit(f.controller.prepare('StartLifeWork',rest))).status).toBe('saved');driver.render()
  expect(driver.onFocus).not.toHaveBeenCalled();expect(f.props().features.life.jobs.some(job=>job.kind==='rest')).toBe(true)
 }finally{await f.close()}
},60000)


it.each(['pointer','keyboard','outside-reading'] as const)('retires a pending result after a later %s gesture without cancelling the original game save',async gesture=>{
 const f=await frame()
 try{
  const driver=roomDriver(f),tree=driver.render();driver.requestFrom(tree)('StartLifeWork',rest,'核对休整',true)
  if(gesture==='pointer')(tree.props.onPointerDownCapture as ()=>void)()
  else if(gesture==='keyboard')(tree.props.onKeyDownCapture as ()=>void)()
  else driver.render(driver.focus,'another-reading')
  expect((await f.controller.submit(f.controller.prepare('StartLifeWork',rest))).status).toBe('saved')
  driver.render(driver.focus,gesture==='outside-reading'?'another-reading':'original-reading')
  expect(driver.onFocus).not.toHaveBeenCalled();expect(f.props().features.life.jobs.some(job=>job.kind==='rest')).toBe(true)
 }finally{await f.close()}
},60000)
