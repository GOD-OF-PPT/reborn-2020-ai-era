import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t17-acceptance-40/follow-native-r153/saved121-public-round-undecided.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import App from './App.tsx'
import {CinematicRoom} from './CinematicRoom.tsx'
import {EquityFollowNotice} from './EquityFollowNotice.tsx'
import {EquitySceneChoice} from './EquitySceneChoice.tsx'
import {EquityDecisionFacts} from './EquityDecisionFacts.tsx'
import {CommandButton} from './CommandButton.tsx'
import {Dialog} from './Dialog.tsx'
import type {PlayFeatures} from './game-types.ts'
import type {OpeningFocus} from './player-thread.ts'
import {moneyText} from './game-text.ts'

// Real App/component callbacks, original Controller/IDB and scoped room effects.
// The minimal event surface is not a DOM, Chrome or human-comprehension test.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0,effects:[] as (()=>void)[]}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const values=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,values);const i=hooks.index++;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(value:T)=>state(()=>({current:value}))[0],useId:()=>hooks.scope,useSyncExternalStore:<T,>(_subscribe:unknown,get:()=>T)=>get(),useMemo:<T,>(create:()=>T)=>create(),useEffect:(create:()=>void|(()=>void),deps:readonly unknown[])=>{const slot=state<{deps:readonly unknown[];cleanup?:()=>void}|null>(null),old=slot[0];if(hooks.scope.startsWith('room-')&&(!old||old.deps.length!==deps.length||deps.some((d,i)=>!Object.is(d,old.deps[i]))))hooks.effects.push(()=>{old?.cleanup?.();const cleanup=create();slot[1]({deps:[...deps],...(typeof cleanup==='function'?{cleanup}:{})})})}}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(v:unknown):Element[]=>Array.isArray(v)?v.flatMap(elements):isValidElement<Record<string,unknown>>(v)?[v,...elements(v.props.children),...elements(v.props.footer)]:[]
const text=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(text).join(''):isValidElement<Record<string,unknown>>(v)?text(v.props.children):''
function draw<T,>(scope:string,fn:()=>T):T{hooks.scope=scope;hooks.index=0;return fn()}
function invoke(e:Element,name:string,...args:unknown[]){const fn=e.props[name];if(e.props.disabled||typeof fn!=='function')throw Error('ACTUAL_ENABLED_CALLBACK_REQUIRED:'+name);return fn(...args)}
const settle=async()=>{await new Promise(resolve=>setTimeout(resolve,0))}
async function setup(id:string,faulty=false){
 const codec=createCampaignCodec(),factory=new IDBFactory(),name='u6-follow-app-'+id,locks=new MemoryWriterAccess();let armed=false,n=0
 const fault=abortAfterHeadWrite(factory,name,()=>armed),store=new IndexedDbRunStore({codec,factory:faulty?fault.factory:factory,keyRange:IDBKeyRange,name}),controller=new GameController({codec,store,locks,id:()=>`follow-app-${id}-${++n}`})
 await controller.initialize();await controller.importNew(raw)
 const memory=new Map<string,string>(),app=()=>draw('app-'+id,()=>elements(App({controller,focusPreferenceStorage:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>{memory.set(k,v)}}}))),roomElement=()=>app().find(e=>e.type===CinematicRoom)!
 const room=()=>{const element=roomElement(),tree=draw('room-'+id,()=>Reflect.apply(CinematicRoom,undefined,[element.props]));const notice=elements(tree).find(e=>e.type===EquityFollowNotice);if(notice)draw('notice-'+id,()=>Reflect.apply(EquityFollowNotice,undefined,[notice.props]));for(const effect of hooks.effects.splice(0))effect();return tree}
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,period=features.workbench.employment.find(e=>e.quarter===features.workbench.quarter)!,work:OpeningFocus={runId:view.runId,kind:'work',accountId:'personal',entityId:period.id},a=features.deepseek!.agreements[0]!
 const selectWork=()=>invoke(roomElement(),'onOpeningFocus',work)
 const open=()=>{const notice=elements(room()).find(e=>e.type===EquityFollowNotice)!,button=draw('notice-'+id,()=>Reflect.apply(EquityFollowNotice,undefined,[notice.props]));invoke(button,'onClick');return elements(room()).find(e=>e.type===EquitySceneChoice)!}
 const choices=(element:Element)=>draw('choice-'+id,()=>Reflect.apply(EquitySceneChoice,undefined,[element.props]))
 const modal=()=>app().find(e=>e.type===Dialog&&elements(e).some(x=>x.type===EquityDecisionFacts))!
 const command=(element:Element,amountFen:number)=>{let tree=choices(element);if(amountFen>0){const step=elements(tree).find(e=>e.type==='button'&&text(e.props.children).startsWith('我想追加一笔本金，先试算'));if(step){invoke(step,'onClick');tree=choices(element)}const owner=elements(tree).find(e=>e.type==='label'&&text(e.props.children).startsWith('本次愿意另行投入'))!,input=elements(owner).find(e=>e.type==='input')!;invoke(input,'onChange',{currentTarget:{value:String(amountFen/100)}});tree=choices(element)}const row=elements(tree).find(e=>e.type===CommandButton&&e.props.kind==='FollowEquityRound'&&(e.props.payload as {amountFen:number}).amountFen===amountFen)!;invoke(elements(Reflect.apply(CommandButton,undefined,[row.props])).find(e=>e.type==='button')!,'onClick');room()}
 return{controller,store,fault,a,work,app,room,roomElement,selectWork,open,choices,modal,command,arm:()=>{armed=true},close:async()=>{await controller.close();await store.close()}}
}
let normal:Awaited<ReturnType<typeof setup>>,failed:Awaited<ReturnType<typeof setup>>
beforeAll(async()=>{normal=await setup('normal');failed=await setup('failed',true)})
beforeEach(()=>{hooks.slots.clear();hooks.effects=[];vi.stubGlobal('document',{addEventListener:vi.fn(),removeEventListener:vi.fn()})})
afterAll(async()=>{await normal?.close();await failed?.close();vi.unstubAllGlobals()})

it('opens the same agreement comparison directly and cancels back to its actual work without writing a command or bookmark',()=>{
 const h=normal,before=h.controller.exportSaved(),submit=vi.spyOn(h.controller,'submit');h.selectWork()
 const original=h.roomElement().props.openingFocus,panel=h.open(),tree=h.choices(panel)
 expect(text(tree)).toContain('把现金留在自己手中');expect(text(tree)).toContain('本轮每份'+moneyText(800))
 expect(elements(tree).filter(e=>e.type===CommandButton&&e.props.kind==='FollowEquityRound')).toHaveLength(1)
 expect(text(tree)).toContain('我想追加一笔本金，先试算');expect(elements(tree).some(e=>e.type==='input')).toBe(false)
 invoke(panel,'onClose');expect(elements(h.room()).some(e=>e.type===EquitySceneChoice)).toBe(false)
 expect(h.roomElement().props.openingFocus).toEqual(original);expect(h.controller.exportSaved()).toBe(before);expect(submit).not.toHaveBeenCalled()
})

it('captures both zero and partial principal in the original App confirmation and keeps cancelling free of payment',()=>{
 const h=normal,before=h.controller.exportSaved();h.selectWork()
 for(const amount of [0,249600]){
  const panel=h.open();h.command(panel,amount)
  const modal=h.modal(),facts=elements(modal).find(e=>e.type===EquityDecisionFacts)!
  expect(facts.props.command).toMatchObject({kind:'FollowEquityRound',payload:{agreementId:h.a.id,amountFen:amount},expectedRevision:121});expect(facts.props.view).toBe(h.controller.snapshot.view)
  expect(facts.props.preview).toMatchObject({allowed:true});expect(text(Reflect.apply(EquityDecisionFacts,undefined,[facts.props]))).toContain(amount===0?'本次不新增付款':moneyText(249600))
  invoke(elements(modal).find(e=>e.type==='button'&&text(e.props.children)==='返回调整')!,'onClick');invoke(panel,'onClose')
 }
 expect(h.controller.exportSaved()).toBe(before)
})

it('keeps the old letter after a real head.put abort and hands the original retry result to its agreement while retaining its saved echo',async()=>{
 const h=failed,before=h.controller.exportSaved(),submit=vi.spyOn(h.controller,'submit'),retry=vi.spyOn(h.controller,'retry');h.selectWork();const panel=h.open();h.arm();h.command(panel,249600)
 invoke(elements(h.modal()).find(e=>e.type==='button'&&text(e.props.children)==='就这样决定 →')!,'onClick')
 expect((await submit.mock.results.at(-1)!.value).status).toBe('unsaved');await settle();h.room()
 expect(h.fault.trace).toEqual({writeSucceeded:true,abortIssued:true});expect(h.controller.exportSaved()).toBe(before);expect(h.roomElement().props.openingFocus).toEqual(h.work)
 expect((await h.store.load(h.work.runId))!.run).toEqual(JSON.parse(before).state)
 invoke(h.app().find(e=>e.type==='button'&&text(e.props.children)==='重试保存原候选')!,'onClick')
 expect((await retry.mock.results.at(-1)!.value).status).toBe('saved');await settle();h.room()
 const actual=h.roomElement(),view=h.controller.snapshot.view!,a=(view.features as unknown as PlayFeatures).deepseek!.agreements[0]!
 expect(view.revision).toBe(122);expect(a.shares).toBe(2812);expect(a.totalShares).toBe(1562500);expect(a.followDecision).not.toBe('pending')
 expect(actual.props.openingFocus).toMatchObject({kind:'equity',equityTarget:{kind:'agreement',recordId:h.a.id}});expect(actual.props.timeEcho).not.toBeNull()
 expect((await h.store.load(view.runId))!.run).toEqual(JSON.parse(h.controller.exportSaved()).state);expect(submit).toHaveBeenCalledTimes(1);expect(retry).toHaveBeenCalledTimes(1)
})

it('does not let a queued result from the previous committed view take focus after the controller has published a newer real revision',async()=>{
 const h=normal,submit=vi.spyOn(h.controller,'submit');h.selectWork();h.command(h.open(),249600)
 invoke(elements(h.modal()).find(e=>e.type==='button'&&text(e.props.children)==='就这样决定 →')!,'onClick')
 expect((await submit.mock.results.at(-1)!.value).status).toBe('saved');await settle()
 const committed=h.roomElement();expect((committed.props.view as {revision:number}).revision).toBe(122)
 draw('room-normal',()=>Reflect.apply(CinematicRoom,undefined,[committed.props]))
 const queued=hooks.effects.splice(0)
 expect((await h.controller.submit(h.controller.prepare('AdvanceTime',{date:'2025-09-02'}))).status).toBe('saved')
 expect(h.controller.snapshot.view!.revision).toBe(123)
 for(const effect of queued)effect()
 expect(h.roomElement().props.openingFocus).toEqual(h.work)
 h.room();expect(h.roomElement().props.openingFocus).toEqual(h.work)
})
