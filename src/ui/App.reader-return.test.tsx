import {expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import App from './App.tsx'
import {CinematicRoom} from './CinematicRoom.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {Dialog} from './Dialog.tsx'
import {ClockConfirmationFacts} from './ClockConfirmationFacts.tsx'

// Actual App callbacks and Controller/IDB, using the established hook driver.
// Effects/DOM/keyboard focus and real Chrome remain separate verification.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T|((old:T)=>T))=>{hooks.values[i]=typeof next==='function'?(next as (old:T)=>T)(hooks.values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useSyncExternalStore:<T,>(_subscribe:unknown,get:()=>T)=>get(),useMemo:<T,>(create:()=>T,deps:readonly unknown[])=>{const i=hooks.index++,old=hooks.values[i] as {deps:readonly unknown[];value:T}|undefined;if(!old||old.deps.length!==deps.length||deps.some((d,n)=>!Object.is(d,old.deps[n])))hooks.values[i]={deps:[...deps],value:create()};return (hooks.values[i] as {value:T}).value}}
})
type Element=ReactElement<Record<string,unknown>>
function elements(value:unknown):Element[]{return Array.isArray(value)?value.flatMap(elements):isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children),...elements(value.props.footer)]:[]}
function text(value:unknown):string{return typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''}
function invoke(element:Element,name:string,...args:unknown[]){const fn=element.props[name];if(typeof fn!=='function'||element.props.disabled)throw Error('ACTUAL_ENABLED_APP_CALLBACK_REQUIRED');return fn(...args)}
async function setup(name:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name}),controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:(()=>{let n=0;return()=>name+'-'+(++n)})()})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'u6-reader-return-fixed-v1'})
 hooks.values=[]
 const render=()=>{hooks.index=0;return elements(App({controller,focusPreferenceStorage:{getItem:()=>null,setItem:()=>{throw Error('READING_MUST_NOT_WRITE_BOOKMARK')}}}))}
 const ledger=(tree:Element[])=>{const found=tree.filter(e=>e.type==='button'&&text(e.props.children).includes('翻开原账'));expect(found).toHaveLength(1);return found[0]!}
 const book=(tree:Element[])=>{const found=tree.find(e=>e.type===Dialog&&e.props.title==='账本与存档');expect(found).toBeDefined();return found!}
 return {controller,store,render,ledger,book}
}

it('returns from a read-only ledger trip to the same room and preserves the actual saved life',async()=>{
 const h=await setup('u6-reader-room-return')
 try{
  const before=h.controller.exportSaved(),room=h.render();expect(room.some(e=>e.type===CinematicRoom)).toBe(true)
  invoke(h.ledger(room),'onClick');const open=h.render();expect(open.some(e=>e.type===NarrativeScene&&e.props.screen==='finance')).toBe(true)
  invoke(h.book(open),'onClose');const returned=h.render()
  expect(returned.some(e=>e.type===CinematicRoom)).toBe(true);expect(returned.some(e=>e.type===NarrativeScene&&e.props.screen==='finance')).toBe(false)
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
})

it('does not restore the stale reading destination after a real new command changed the source revision',async()=>{
 const h=await setup('u6-reader-stale-revision')
 try{
  const before=h.controller.exportSaved(),view=h.controller.snapshot.view!
  invoke(h.ledger(h.render()),'onClick');h.book(h.render())
  expect((await h.controller.submit(h.controller.prepare('WorkQuarter',{}))).status).toBe('saved')
  expect(h.controller.snapshot.view!.revision).toBe(view.revision+1)
  const current=h.controller.exportSaved();expect(current).not.toBe(before)
  invoke(h.book(h.render()),'onClose');const closed=h.render()
  expect(closed.some(e=>e.type===CinematicRoom)).toBe(false);expect(closed.some(e=>e.type===NarrativeScene&&e.props.screen==='finance')).toBe(true)
  expect(h.controller.exportSaved()).toBe(current)
 }finally{await h.controller.close();await h.store.close()}
})

it('keeps a real committed time echo when returning to the room and through another pure ledger reading',async()=>{
 const h=await setup('u6-reader-time-echo')
 try{
  const room=h.render().find(e=>e.type===CinematicRoom)!;invoke(room,'onNavigate','finance')
  const finance=h.render().find(e=>e.type===NarrativeScene&&e.props.screen==='finance')!,p=finance.props
  const request=(p.p??p) as Record<string,unknown>,wait=request.requestWait
  expect(typeof wait).toBe('function')
  if(typeof wait!=='function')throw Error('ACTUAL_APP_TIME_REQUEST_REQUIRED')
  wait('2020-01-02','等待已安排的日子',false)
  for(let i=0;i<100&&h.controller.snapshot.view!.date!=='2020-01-02';i++)await new Promise(resolve=>setTimeout(resolve,0))
  expect(h.controller.snapshot.view!.date).toBe('2020-01-02')
  for(let i=0;i<100&&h.controller.snapshot.busy;i++)await new Promise(resolve=>setTimeout(resolve,0))
  await new Promise(resolve=>setTimeout(resolve,0))
  const after=h.render().find(e=>e.type===NarrativeScene&&e.props.screen==='finance')!;invoke(after,'onNavigate','room')
  const current=h.render(),main=current.find(e=>e.type===CinematicRoom)!
  expect(isValidElement(main.props.timeEcho)).toBe(true)
  const raw=h.controller.exportSaved();invoke(h.ledger(current),'onClick');invoke(h.book(h.render()),'onClose')
  expect(isValidElement(h.render().find(e=>e.type===CinematicRoom)!.props.timeEcho)).toBe(true)
  expect(h.controller.exportSaved()).toBe(raw)
 }finally{await h.controller.close();await h.store.close()}
})

it('binds the first-layer clock facts to the actual captured App confirmation without submitting it',async()=>{
 const h=await setup('u6-reader-clock-confirm')
 try{
  invoke(h.render().find(e=>e.type===CinematicRoom)!,'onNavigate','finance')
  const scene=h.render().find(e=>e.type===NarrativeScene&&e.props.screen==='finance')!,request=scene.props.request
  if(typeof request!=='function')throw Error('ACTUAL_APP_REQUEST_REQUIRED')
  const before=h.controller.exportSaved(),view=h.controller.snapshot.view!
  request('AdvanceTime',{date:'2020-01-02'},'核对这段日历',true)
  const confirmation=h.render().find(e=>e.type===Dialog&&e.props.title==='核对这段日历')!
  expect(confirmation).toBeDefined()
  const facts=elements(confirmation).find(e=>e.type===ClockConfirmationFacts)!
  expect(facts).toBeDefined();expect(facts.props.newCostFen).toBe(0);expect(facts.props.newActionPoints).toBe(0)
  expect(facts.props.clock).toMatchObject({runId:view.runId,sourceRevision:view.revision,from:'2020-01-01',target:'2020-01-02'})
  invoke(confirmation,'onClose');h.render();expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.controller.close();await h.store.close()}
})
