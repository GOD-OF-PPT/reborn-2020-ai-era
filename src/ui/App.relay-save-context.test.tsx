import {expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import type {PlayFeatures,SceneTarget} from './game-types.ts'
import {openingFocusFor} from './player-thread.ts'
import {seasonFocusPreferenceKey,type SeasonFocusPreferenceStorage} from './season-focus-preference.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import App from './App.tsx'
import {CinematicRoom} from './CinematicRoom.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {Dialog} from './Dialog.tsx'
import {SectionNavigation} from './Navigation.tsx'
import readyRaw from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0091.json?raw'
import plannedRaw from '../../goal-1/evidence/t17-acceptance-11/chrome-relay-fault-r12/r92-normal-for-service-abort-text-before-import.json?raw'

// Drive actual App handlers and async controller/store promises. This harness does
// not emulate DOM, React effects, browser locks or claim native fault acceptance.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{
  const index=hooks.index++,values=hooks.values
  if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial
  return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const
 }
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useSyncExternalStore:<T,>(_subscribe:unknown,getSnapshot:()=>T)=>getSnapshot(),useMemo:<T,>(create:()=>T,deps:readonly unknown[])=>{
  const index=hooks.index++,previous=hooks.values[index] as {deps:readonly unknown[];value:T}|undefined
  if(!previous||previous.deps.length!==deps.length||deps.some((value,i)=>!Object.is(value,previous.deps[i])))hooks.values[index]={deps:[...deps],value:create()}
  return (hooks.values[index] as {value:T}).value
 }}
})
function deferred(){let resolve!:()=>void;const promise=new Promise<void>(done=>{resolve=done});return {promise,resolve}}
class HeldCommitStore extends IndexedDbRunStore{
 readonly entered=deferred()
 readonly release=deferred()
 #first=true
 override async commit(...args:Parameters<IndexedDbRunStore['commit']>){
  if(this.#first){this.#first=false;this.entered.resolve();await this.release.promise}
  return super.commit(...args)
 }
}
type Element=ReactElement<Record<string,unknown>>
function elements(value:unknown):Element[]{
 if(Array.isArray(value))return value.flatMap(elements)
 return isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children),...elements(value.props.footer)]:[]
}
function text(value:unknown):string{
 if(typeof value==='string'||typeof value==='number')return String(value)
 if(Array.isArray(value))return value.map(text).join('')
 return isValidElement<Record<string,unknown>>(value)?text(value.props.children):''
}
function fire(element:Element,event:'onClick'|'onChange',value?:string){
 const action=element.props[event];if(typeof action!=='function')throw Error('REAL_VISIBLE_HANDLER_REQUIRED')
 if(element.props.disabled)throw Error('VISIBLE_HANDLER_DISABLED')
 if(event==='onChange')action({target:{value}});else action()
}
async function fixture(name:string,{planned=false,abort=false}={}){
 const raw=planned?plannedRaw:readyRaw,codec=createCampaignCodec(),factory=new IDBFactory(),physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 const original=codec.import(raw)
 await physical.importSave(raw,{mode:'create',actorId:'player',importId:name+'-prefix'})
 const fault=abort?abortAfterHeadWrite(factory,name):null,store=new HeldCommitStore({codec,factory:fault?.factory??factory,keyRange:IDBKeyRange,name})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++sequence)})
 await controller.initialize();await controller.continueLife(original.runId)
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,relay=features.relay!,business=relay.businesses[0]!,station=relay.stations.find(s=>s.businessId===business.id)!,identity={runId:view.runId,accountId:business.accountId,businessId:business.id,stationId:station.id}
 const businessTarget:RelaySceneTarget={...identity,kind:'business'},target:RelaySceneTarget=planned?{...identity,kind:'period',periodId:relay.periods[0]!.id}:businessTarget
 const focus=openingFocusFor({view,features},'relay',{accountId:business.accountId,relayTarget:target})!
 const preferences=new Map([[seasonFocusPreferenceKey(view.runId),JSON.stringify({version:1,runId:view.runId,quarter:features.workbench.quarter,focus})]])
 const storage:SeasonFocusPreferenceStorage={getItem:key=>preferences.get(key)??null,setItem:(key,value)=>{preferences.set(key,value)}}
 const submit=vi.spyOn(controller,'submit'),retry=vi.spyOn(controller,'retry')
 const submitted=()=>{const result=submit.mock.results.at(-1);if(result?.type!=='return')throw Error('REAL_SUBMIT_PROMISE_REQUIRED');return result.value}
 const finish=async()=>{store.release.resolve();const result=await submitted();await Promise.resolve();await Promise.resolve();return result}
 const finishRetry=async()=>{const result=retry.mock.results.at(-1);if(result?.type!=='return')throw Error('REAL_RETRY_PROMISE_REQUIRED');const settled=await result.value;await Promise.resolve();await Promise.resolve();return settled}
 const close=async()=>{store.release.resolve();const pending=submit.mock.results.at(-1);if(pending?.type==='return')await pending.value;await controller.close(true);await physical.close()}
 const payload={businessId:business.id,customerIds:[relay.customers.find(c=>c.mode==='postpaid')!.id],supplierIds:['cedar-direct'],resources:['player-production'],startAt:'2025-01-28',maxUnits:2800,maxSupplierCostFen:10000,supportMode:'guided'}
 return {raw,codec,physical,store,fault,controller,view,features,businessTarget,target,storage,preferences,submit,retry,submitted,finish,finishRetry,close,payload}
}
type Fixture=Awaited<ReturnType<typeof fixture>>
function driver(f:Fixture){
 hooks.values=[]
 let tree:ReturnType<typeof App>
 const render=()=>{hooks.index=0;tree=App({controller:f.controller,focusPreferenceStorage:f.storage})}
 const component=<T,>(type:unknown):T=>{const e=elements(tree).find(row=>row.type===type);if(!e)throw Error('PUBLIC_APP_COMPONENT_REQUIRED');return e.props as T}
 const scene=()=>component<ComponentProps<typeof NarrativeScene>>(NarrativeScene)
 const book=()=>elements(tree).find(e=>e.type===Dialog&&e.props.className==='scene-workspace workspace-relay')
 const click=(label:string)=>{const button=elements(tree).find(e=>e.type==='button'&&text(e).includes(label));if(!button)throw Error('PUBLIC_APP_BUTTON_REQUIRED:'+label);fire(button,'onClick');render()}
 const openBook=(target=f.target,details:Pick<SceneTarget,'relayDraftSlot'|'recordId'>={})=>{
  const request={...details,openRecord:true,accountId:target.accountId,relayTarget:target}
  if(elements(tree).some(e=>e.type===CinematicRoom))component<ComponentProps<typeof CinematicRoom>>(CinematicRoom).onNavigate('relay',request)
  else scene().onOpen('relay',request)
  render()
 }
 render();openBook()
 return {
  render,scene,book,click,openBook,
  async start(kind='StartRelayServicePeriod',payload:unknown=f.payload){scene().request(kind,payload,'核对原中转安排',true);render();click('就这样决定');await f.store.entered.promise;render();expect(f.controller.snapshot.busy).toBe(true)},
  closeConfirmation(){click('返回调整')},
  changeAccount(accountId:string){const label=elements(tree).find(e=>e.type==='label'&&e.props.className==='scene-sheet-account'),select=label&&elements(label).find(e=>e.type==='select');if(!select)throw Error('VISIBLE_BOOK_ACCOUNT_REQUIRED');fire(select,'onChange',accountId);render()},
  closeBook(){const current=book();if(!current||typeof current.props.onClose!=='function')throw Error('OPEN_ORIGINAL_BOOK_REQUIRED');current.props.onClose();render()},
  openRelayEntry(){const current=book(),navigation=elements(current).find(e=>e.type===SectionNavigation);if(!navigation||typeof navigation.props.onNavigate!=='function')throw Error('VISIBLE_BOOK_ROUTE_REQUIRED');navigation.props.onNavigate('relay');render()},
 }
}
const readFocus=(f:Fixture)=>JSON.parse(f.preferences.get(seasonFocusPreferenceKey(f.view.runId))!).focus as {relayTarget:RelaySceneTarget}

it('preserves another draft slot or record on the same business during an actual delayed commit',async()=>{
 for(const change of ['slot','record'] as const){
  const f=await fixture('relay-save-same-business-'+change)
  try{
   const ui=driver(f);ui.openBook(f.target,{relayDraftSlot:'service',recordId:'original-service-page'});await ui.start();ui.closeConfirmation()
   ui.openBook(f.target,{relayDraftSlot:change==='slot'?'capital':'service',recordId:change==='record'?'another-visible-record':'original-service-page'})
   expect(ui.book()).toBeDefined()
   expect((await f.finish()).status).toBe('saved');ui.render()
   expect(ui.book(),'a distinct same-business draft must keep its own reading context').toBeDefined()
   expect(ui.scene().relayTarget).toEqual(f.target);expect(ui.scene().receipt).toBeNull()
   expect(f.controller.snapshot.view!.revision).toBe(f.view.revision+1);expect(f.submit).toHaveBeenCalledTimes(1)
   const period=(f.controller.snapshot.view!.features as unknown as PlayFeatures).relay!.periods[0]!
   expect(readFocus(f).relayTarget).toEqual({...f.businessTarget,kind:'period',periodId:period.id})
  }finally{await f.close()}
 }
},20000)

it('maps an actual same-scope saved service to its new public period and closes only that original book',async()=>{
 const f=await fixture('relay-save-same-scope')
 try{
  const ui=driver(f);expect(ui.book()).toBeDefined();await ui.start()
  expect(f.controller.exportSaved()).toBe(f.raw)
  expect((await f.finish()).status).toBe('saved');ui.render()
  const view=f.controller.snapshot.view!,period=(view.features as unknown as PlayFeatures).relay!.periods[0]!
  expect(ui.scene().relayTarget).toEqual({...f.businessTarget,kind:'period',periodId:period.id})
  expect(ui.scene().accountId).toBe(f.target.accountId);expect(ui.book()).toBeUndefined();expect(ui.scene().receipt).toContain('服务单已经安排')
  expect(readFocus(f).relayTarget).toEqual(ui.scene().relayTarget)
  expect(view.revision).toBe(f.view.revision+1);expect(f.submit).toHaveBeenCalledTimes(1)
  expect(f.codec.export((await f.physical.load(view.runId))!.run)).toBe(f.controller.exportSaved())
 }finally{await f.close()}
},20000)

it('preserves a changed account and a reopened original book while the actual saved service and global pin still publish',async()=>{
 for(const change of ['account','reopen'] as const){
  const f=await fixture('relay-save-'+change)
  try{
   const ui=driver(f);await ui.start();ui.closeConfirmation()
   if(change==='account')ui.changeAccount('personal');else{ui.closeBook();ui.openBook()}
   expect(ui.book()).toBeDefined();expect(f.controller.exportSaved()).toBe(f.raw)
   expect((await f.finish()).status).toBe('saved');ui.render()
   expect(ui.book(),'a later reading workspace must remain open').toBeDefined()
   expect(ui.scene().accountId).toBe(change==='account'?'personal':f.target.accountId)
   expect(ui.scene().relayTarget).toEqual(f.target);expect(ui.scene().receipt).toBeNull()
   const period=(f.controller.snapshot.view!.features as unknown as PlayFeatures).relay!.periods[0]!
   expect(readFocus(f).relayTarget).toEqual({...f.businessTarget,kind:'period',periodId:period.id})
   expect(f.controller.snapshot.view!.revision).toBe(f.view.revision+1);expect(f.submit).toHaveBeenCalledTimes(1)
  }finally{await f.close()}
 }
},20000)

it('does not replace a same-account relay entry explicitly opened from the book during a real auxiliary save',async()=>{
 const f=await fixture('relay-save-target',{planned:true})
 try{
  const ui=driver(f);await ui.start('FundBusiness',{businessId:f.target.businessId,amountFen:10000});ui.closeConfirmation();ui.openRelayEntry()
  expect(ui.scene().accountId).toBe(f.target.accountId);expect(ui.scene().relayTarget).toBeNull()
  expect((await f.finish()).status).toBe('saved');ui.render()
  expect(ui.scene().relayTarget).toBeNull();expect(ui.book()).toBeDefined();expect(ui.scene().receipt).toBeNull()
  expect(readFocus(f).relayTarget).toEqual(f.target)
  expect(f.controller.snapshot.view!.revision).toBe(f.view.revision+1);expect(f.submit).toHaveBeenCalledTimes(1)
 }finally{await f.close()}
},20000)

it('keeps a real aborted candidate private and maps the original payload on retry without reopening the dismissed book',async()=>{
 const f=await fixture('relay-save-retry',{abort:true})
 try{
  const ui=driver(f);await ui.start();expect((await f.finish()).status).toBe('unsaved');ui.render()
  expect(f.fault?.trace).toEqual({writeSucceeded:true,abortIssued:true})
  expect(f.controller.snapshot.view!.revision).toBe(f.view.revision);expect(ui.scene().relayTarget).toEqual(f.target);expect(ui.book()).toBeUndefined()
  expect(readFocus(f).relayTarget).toEqual(f.target);expect(f.controller.exportSaved()).toBe(f.raw)
  expect(f.codec.export((await f.physical.load(f.view.runId))!.run)).toBe(f.raw)
  const candidate=f.controller.exportCandidate();ui.click('重试保存原候选')
  expect((await f.finishRetry()).status).toBe('saved');ui.render()
  const period=(f.controller.snapshot.view!.features as unknown as PlayFeatures).relay!.periods[0]!
  expect(ui.scene().relayTarget).toEqual({...f.businessTarget,kind:'period',periodId:period.id});expect(ui.book()).toBeUndefined();expect(ui.scene().receipt).toContain('服务单已经安排')
  expect(readFocus(f).relayTarget).toEqual(ui.scene().relayTarget)
  expect(f.controller.exportSaved()).toBe(candidate);expect(f.codec.export((await f.physical.load(f.view.runId))!.run)).toBe(candidate)
  expect(f.submit).toHaveBeenCalledTimes(1);expect(f.retry).toHaveBeenCalledTimes(1)
 }finally{await f.close()}
},20000)
