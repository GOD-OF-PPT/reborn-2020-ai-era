import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {SeasonRecollection} from './SeasonRecollection.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {CommandButton} from './CommandButton.tsx'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'

// Actual component callbacks + normal Controller/IDB. No DOM/effects,
// compatibility, Native or human comprehension claim is made by this driver.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const values=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,values);const i=hooks.index++;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(value:T)=>state(()=>({current:value}))[0],useEffect:()=>{},useMemo:<T,>(factory:()=>T)=>factory(),useId:()=>hooks.scope}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(v:unknown):Element[]=>Array.isArray(v)?v.flatMap(elements):isValidElement<Record<string,unknown>>(v)?[v,...elements(v.props.children),...elements(v.props.footer)]:[]
function render<T,>(scope:string,fn:()=>T):T{hooks.scope=scope;hooks.index=0;return fn()}
function invoke(e:Element,name:string,...args:unknown[]){const fn=e.props[name];if(e.props.disabled||typeof fn!=='function')throw Error('ACTUAL_ENABLED_HANDLER_REQUIRED:'+name);return fn(...args)}
async function setup(id:string,raw?:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-reading-'+id}),controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:(()=>{let n=0;return()=>`u6-reading-${id}-${++n}`})()})
 await controller.initialize();if(raw)await controller.importNew(raw);else await controller.newLife({backgroundId:'technical_employee',seed:'u6-reading-prefix',playerProfile:{wishId:'autonomy',approach:'free'}})
 const p=():GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn()}}
 const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')
 const advance=async(date:string)=>{for(let n=0;n<40;n++){const w=p().features.workbench;if(w.pause){const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;expect(choice).toMatchObject({costFen:0,actionPoints:0});await send('ChooseEvent',{instanceId:event.id,choiceId:choice.id})}else if(p().view.date<date)await send('AdvanceTime',{date});else return}throw Error('READING_PREFIX_CLOCK_LIMIT')}
 return {codec,store,controller,p,send,advance,close:async()=>{await controller.close();await store.close()}}
}
let endRaw:string,startRaw:string
beforeAll(async()=>{const h=await setup('prefix');try{await h.send('WorkQuarter',{});await h.advance('2020-03-31');expect(h.p().features.workbench.atQuarterEnd).toBe(true);endRaw=h.controller.exportSaved();await h.advance('2020-04-01');startRaw=h.controller.exportSaved()}finally{await h.close()}})
beforeEach(()=>hooks.slots.clear())
afterAll(()=>hooks.slots.clear())
function leaf(p:GamePanelProps,id:string){
 const onClose=vi.fn(),onToday=vi.fn(),onNavigate=vi.fn(),draw=(next=p)=>render(id,()=>SeasonRecollection({p:next,onClose,onToday,onNavigate})),tree=draw()
 return {draw,tree,onClose,onToday,onNavigate}
}

it('lets the actual quarter clock close the leaf and choose Today before forwarding its original wait without writing a new promise',async()=>{
 const h=await setup('clock',endRaw)
 try{
  const p=h.p(),before=h.controller.exportSaved(),ui=leaf(p,'clock-leaf'),clock=elements(ui.tree).find(e=>e.type===ClockAdvance)!
  expect(clock).toBeDefined();const rendered=render('clock-control',()=>Reflect.apply(ClockAdvance,undefined,[clock.props])),main=elements(rendered).find(e=>e.type===CommandButton&&e.props.className==='clock-main')!
  const button=elements(Reflect.apply(CommandButton,undefined,[main.props])).find(e=>e.type==='button')!
  invoke(button,'onClick')
  expect(ui.onClose).toHaveBeenCalledTimes(1);expect(ui.onToday).toHaveBeenCalledTimes(1)
  expect(p.requestWait).toHaveBeenCalledWith('2020-04-01',expect.stringContaining('进入下一季'),expect.any(Boolean));expect(p.request).not.toHaveBeenCalled()
  expect(ui.onClose.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(p.requestWait!).mock.invocationCallOrder[0]!)
  invoke(button,'onClick');expect(p.requestWait).toHaveBeenCalledTimes(1)
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
})

it('keeps the originally opened quarter after a real ordinary rollover and requires an explicit reading change',async()=>{
 const h=await setup('pin',endRaw)
 try{
  const ui=leaf(h.p(),'pinned-leaf');expect(ui.tree.props.title).toBe('2020-Q1 · 这季留下的日子')
  await h.advance('2020-04-01');const p=h.p(),before=h.controller.exportSaved();expect(p.features.workbench.quarter).toBe('2020-Q2')
  const tree=ui.draw(p);expect(tree.props.title).toBe('2020-Q1 · 这季留下的日子');expect(elements(tree).some(e=>e.type===ClockAdvance)).toBe(false)
  expect(ui.onClose).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled();expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
})

it('fences an old reading callback after Q2 to Q1 to Q2 at the same committed revision',async()=>{
 const h=await setup('scope',startRaw)
 try{
  const p=h.p(),before=h.controller.exportSaved(),ui=leaf(p,'scope-leaf'),select=(tree:Element)=>elements(tree).find(e=>e.type==='select')!
  const old=select(ui.tree);invoke(old,'onChange',{target:{value:'2020-Q1'}})
  const previous=ui.draw();expect(previous.props.title).toBe('2020-Q1 · 这季留下的日子')
  invoke(select(previous),'onChange',{target:{value:'2020-Q2'}});expect(ui.draw().props.title).toBe('2020-Q2 · 这季留下的日子')
  invoke(old,'onChange',{target:{value:'2020-Q1'}});expect(ui.draw().props.title).toBe('2020-Q2 · 这季留下的日子')
  invoke(ui.tree,'onClose');expect(ui.onClose).not.toHaveBeenCalled()
  invoke(ui.draw(),'onClose');expect(ui.onClose).toHaveBeenCalledTimes(1)
  expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled();expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
})
