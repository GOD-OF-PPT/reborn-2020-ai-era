import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import initialRaw from '../../goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-initial.json?raw'
import companyRaw from '../../goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-beforeContract.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import App from './App.tsx'
import {CinematicRoom} from './CinematicRoom.tsx'
import {EcosystemMoment} from './EcosystemMoment.tsx'
import {EcosystemPaper} from './EcosystemPaper.tsx'
import {EquityMoment} from './EquityMoment.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {ecosystemFocusFor} from './ecosystem-player-thread.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'

// Real App navigation and normal Controller/IDB; this hook driver does not run
// DOM/effects or establish browser visibility, human understanding or fun.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const values=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,values);const i=hooks.index++;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useId:()=>hooks.scope,useEffect:()=>{},useSyncExternalStore:<T,>(_subscribe:unknown,get:()=>T)=>get(),useMemo:<T,>(factory:()=>T,deps:readonly unknown[])=>{const slot=state<{deps:readonly unknown[];value:T}|null>(null),old=slot[0];if(old&&old.deps.length===deps.length&&deps.every((d,i)=>Object.is(d,old.deps[i])))return old.value;const next={deps:[...deps],value:factory()};slot[1](next);return next.value}}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(v:unknown):Element[]=>Array.isArray(v)?v.flatMap(elements):isValidElement<Record<string,unknown>>(v)?[v,...elements(v.props.children),...elements(v.props.decisions)]:[]
const text=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(text).join(''):isValidElement<Record<string,unknown>>(v)?text(v.props.children):''
function render<T,>(scope:string,factory:()=>T):T{hooks.scope=scope;hooks.index=0;return factory()}
function invoke(e:Element,name:string,...args:unknown[]){const fn=e.props[name];if(e.props.disabled||typeof fn!=='function')throw Error('ACTUAL_ENABLED_UI_HANDLER_REQUIRED:'+name);return fn(...args)}
async function setup(id:string,raw:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-entry-'+id}),locks=new MemoryWriterAccess(),controller=new GameController({codec,store,locks})
 await controller.initialize();await controller.importNew(raw)
 const draw=()=>render('app-'+id,()=>elements(App({controller,focusPreferenceStorage:{getItem:()=>null,setItem:()=>{}}})))
 return {codec,store,locks,controller,draw,room:()=>draw().find(e=>e.type===CinematicRoom)!,scene:()=>draw().find(e=>e.type===EcosystemMoment)!,close:async()=>{await controller.close();await store.close()}}
}
let entry:Awaited<ReturnType<typeof setup>>,company:Awaited<ReturnType<typeof setup>>,reader:GameController
beforeAll(async()=>{entry=await setup('entry',initialRaw);company=await setup('company',companyRaw);reader=new GameController({codec:entry.codec,store:entry.store,locks:entry.locks});await reader.initialize();await reader.continueLife(entry.controller.snapshot.view!.runId);expect(reader.snapshot.view!.readOnly).toBe(true)})
afterAll(async()=>{await reader?.close();await company?.close();await entry?.close()})
beforeEach(()=>hooks.slots.clear())
const second=(scene:Element,scope:string)=>{const tree=render(scope,()=>Reflect.apply(EcosystemMoment,undefined,[scene.props])),tableau=elements(tree).find(e=>e.type===RoomTableau)!;return {tree,tableau,button:elements(tableau.props.decisions).find(e=>e.type==='button'&&text(e.props.children).includes('另看明确架空的出资选择'))!}}

it('lets the actual App entry show an independent equity reading choice without opening a service enterprise or writing a game command',async()=>{
 const h=entry,before=h.controller.exportSaved(),submit=vi.spyOn(h.controller,'submit')
 invoke(h.room(),'onNavigate','deepseek')
 const {button}=second(h.scene(),'uncommitted-service-entry');expect(button).toBeDefined();expect(text(button)).toContain('不必先开服务企业')
 invoke(button,'onClick')
 const equity=h.draw().find(e=>e.type===EquityMoment)!,focus=equity.props.focus as {kind:string;accountId:string;equityTarget:null},p=equity.props.p as GamePanelProps
 expect(focus).toMatchObject({kind:'equity',accountId:'personal',equityTarget:null});expect(p.features.deepseek!.counterfactualEnabledAt).toBeNull();expect(p.features.deepseek!.businesses).toHaveLength(0)
 expect(submit).not.toHaveBeenCalled();expect(h.controller.exportSaved()).toBe(before);expect(h.codec.export((await h.store.load(p.view.runId))!.run)).toBe(before);submit.mockRestore()
})

it('keeps a specified original service and its shared paper action direct instead of inserting another mode decision',()=>{
 const h=company,v=h.controller.snapshot.view!,features=v.features as unknown as PlayFeatures,b=features.deepseek!.businesses.filter(b=>b.definitionId==='ecosystem-service');expect(b).toHaveLength(1)
 const target={runId:v.runId,accountId:b[0]!.accountId,businessId:b[0]!.id,kind:'business' as const},before=h.controller.exportSaved()
 invoke(h.room(),'onNavigate','deepseek',{deepseekPane:'ecosystem',ecosystemTarget:target,accountId:target.accountId})
 const {tree,tableau,button}=second(h.scene(),'specified-original-service');expect(button).toBeUndefined()
 const paper=elements(tableau.props.object).find(e=>e.type===EcosystemPaper)!,binding=paper.props.binding as {activate:()=>void}
 expect(elements(tableau.props.decisions).some(e=>e.type==='button'&&e.props.onClick===binding.activate)).toBe(true);expect(tree).toBeDefined();expect(h.controller.exportSaved()).toBe(before)
})

it('allows actual readonly viewing while fencing a candidate or stale entry callback from switching the live subject',()=>{
 const view=reader.snapshot.view!,features=view.features as unknown as PlayFeatures,p:GamePanelProps={controller:reader,view,features,accountId:'personal',request:vi.fn()},navigate=vi.fn(),props={p,focus:ecosystemFocusFor(p),headingRef:null,onFocus:vi.fn(),onNavigate:navigate,onExplore:vi.fn()}
 const draw=(source=p)=>render('protected-entry',()=>EcosystemMoment({...props,p:source})),button=(tree:unknown)=>elements(tree).find(e=>e.type==='button'&&text(e.props.children).includes('另看明确架空的出资选择'))!
 invoke(button(draw()),'onClick');expect(navigate).toHaveBeenCalledWith('deepseek',{deepseekPane:'equity',equityTarget:null,accountId:'personal'});expect(p.request).not.toHaveBeenCalled();navigate.mockClear()
 for(const status of [{...view},{...view,hasCandidate:true,saveStatus:'unsaved' as const}]){const tree=draw({...p,view:status}),b=button(tree);expect(b.props.disabled).toBe(true);(b.props.onClick as ()=>void)();expect(navigate).not.toHaveBeenCalled()}
 expect(reader.exportSaved()).toBe(entry.controller.exportSaved())
})
