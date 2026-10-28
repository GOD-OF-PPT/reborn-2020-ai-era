import {beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import type {PlayFeatures} from './game-types.ts'
import {openingFocusFor,type OpeningFocus} from './player-thread.ts'
import {courseFocusFor} from './course-player-thread.ts'
import {seasonFocusPreferenceKey,type SeasonFocusPreferenceStorage} from './season-focus-preference.ts'
import App from './App.tsx'
import {CinematicRoom} from './CinematicRoom.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import beforeLife from '../../goal-1/evidence/t17-acceptance-39/fresh-primary-r64/model-original-prefix14.json?raw'
import oldClass from '../../goal-1/evidence/t17-acceptance-39/chrome-wait-final-r10/r10-11-current105-eight-original-steps.json?raw'

// Actual App handlers and original controller/store. Native14 was not exported:
// beforeLife is the exact original prefix derived by full replay of Native15.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{
  const i=hooks.index++,values=hooks.values
  if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial
  return [values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const
 }
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useSyncExternalStore:<T,>(_subscribe:unknown,read:()=>T)=>read(),useMemo:<T,>(make:()=>T,deps:readonly unknown[])=>{
  const i=hooks.index++,old=hooks.values[i] as {deps:readonly unknown[];value:T}|undefined
  if(!old||old.deps.length!==deps.length||deps.some((v,k)=>!Object.is(v,old.deps[k])))hooks.values[i]={deps:[...deps],value:make()}
  return (hooks.values[i] as {value:T}).value
 }}
})
function deferred(){let resolve!:()=>void;const promise=new Promise<void>(done=>{resolve=done});return {promise,resolve}}
class HeldStore extends IndexedDbRunStore{
 readonly entered=deferred();readonly release=deferred();#first=true
 override async commit(...args:Parameters<IndexedDbRunStore['commit']>){if(this.#first){this.#first=false;this.entered.resolve();await this.release.promise}return super.commit(...args)}
}
type Element=ReactElement<Record<string,unknown>>
function elements(value:unknown):Element[]{if(Array.isArray(value))return value.flatMap(elements);return isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children),...elements(value.props.footer)]:[]}
function text(value:unknown):string{return typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''}
const codec=createCampaignCodec()
async function fixture(name:string,{focusKind='first-order',abort=false,version=1}:{focusKind?:'first-order'|'work'|'course';abort?:boolean;version?:number}={}){
 const raw=focusKind==='course'?oldClass:beforeLife,factory=new IDBFactory(),physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 const original=codec.import(raw);await physical.importSave(raw,{mode:'create',actorId:'player',importId:name+'-prefix'})
 const fault=abort?abortAfterHeadWrite(factory,name):null,store=new HeldStore({codec,factory:fault?.factory??factory,keyRange:IDBKeyRange,name})
 let count=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++count)})
 await controller.initialize();await controller.continueLife(original.runId)
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures
 let focus:OpeningFocus
 if(focusKind==='course'){const co=features.course!.cohorts[0]!,lesson=features.course!.courses.find(c=>c.id===co.courseId)!;focus=courseFocusFor({view,features},{kind:'cohort',businessId:lesson.businessId,courseId:lesson.id,cohortId:co.id})}
 else focus=openingFocusFor({view,features},'quarter',{accountId:'personal',recordId:focusKind==='work'?features.workbench.employment[0]!.id:features.firstOrder.contractId!})!
 const key=seasonFocusPreferenceKey(view.runId),initial=JSON.stringify({version,runId:view.runId,quarter:features.workbench.quarter,focus}),preferences=new Map([[key,initial]])
 const storage:SeasonFocusPreferenceStorage={getItem:k=>preferences.get(k)??null,setItem:(k,v)=>{preferences.set(k,v)}}
 let submit=vi.spyOn(controller,'submit'),retry=vi.spyOn(controller,'retry')
 const observeCalls=()=>{submit=vi.spyOn(controller,'submit');retry=vi.spyOn(controller,'retry')}
 const pending=()=>{const result=submit.mock.results.at(-1);if(result?.type!=='return')throw Error('ORIGINAL_SUBMIT_REQUIRED');return result.value}
 const finish=async()=>{store.release.resolve();const result=await pending();await Promise.resolve();await Promise.resolve();return result}
 const finishRetry=async()=>{const result=retry.mock.results.at(-1);if(result?.type!=='return')throw Error('ORIGINAL_RETRY_REQUIRED');const saved=await result.value;await Promise.resolve();await Promise.resolve();return saved}
 const close=async()=>{store.release.resolve();const result=submit.mock.results.at(-1);if(result?.type==='return')await result.value;await controller.close(true);await physical.close()}
 return {raw,codec,controller,physical,store,fault,view,features,focus,key,initial,preferences,storage,get submit(){return submit},get retry(){return retry},observeCalls,finish,finishRetry,close}
}
type Fixture=Awaited<ReturnType<typeof fixture>>
function driver(f:Fixture){
 const values:unknown[]=[];let tree:ReturnType<typeof App>
 const render=()=>{hooks.values=values;hooks.index=0;tree=App({controller:f.controller,focusPreferenceStorage:f.storage})}
 const props=<T,>(type:unknown):T=>{const e=elements(tree).find(e=>e.type===type);if(!e)throw Error('ACTUAL_APP_COMPONENT_REQUIRED');return e.props as T}
 const room=()=>props<ComponentProps<typeof CinematicRoom>>(CinematicRoom),scene=()=>props<ComponentProps<typeof NarrativeScene>>(NarrativeScene)
 const click=(label:string)=>{const button=elements(tree).find(e=>e.type==='button'&&text(e).includes(label));if(!button||button.props.disabled||typeof button.props.onClick!=='function')throw Error('ACTUAL_VISIBLE_BUTTON_REQUIRED:'+label);button.props.onClick();render()}
 render();room().onNavigate('quarter',{accountId:'personal'});render();scene().onNavigate('life',{accountId:'personal'});render()
 const mode=(next:'rest'|'workspace')=>{const change=scene().onLifeMode;if(!change)throw Error('ACTUAL_LIFE_SELECTION_HANDLER_REQUIRED');change(next);render()}
 mode(f.focus.kind==='course'?'rest':'workspace')
 const payload=f.focus.kind==='course'?{kind:'rest',personId:null,reference:null}:{kind:'workspace',personId:null,reference:null}
 const review=()=>{scene().request('StartLifeWork',payload,'核对这次生活安排',true);render()}
 return {render,room,scene,click,mode,review,
  async start(){review();click('就这样决定');await f.store.entered.promise;render()},
  back(){scene().onNavigate('room');render()},
 }
}
const storedFocus=(f:Fixture)=>JSON.parse(f.preferences.get(f.key)!).focus as OpeningFocus
let initial:Fixture
beforeAll(async()=>{initial=await fixture('finished-life-next')})

it('follows the next explicitly saved life after the actual paid first-order attempt, including the persisted bookmark',async()=>{
 const f=initial;f.observeCalls()
 try{
  const ui=driver(f);expect(f.view).toMatchObject({date:'2020-03-28',revision:14,budget:{available:1}})
  await ui.start();expect(storedFocus(f)).toEqual(f.focus);expect(f.controller.exportSaved()).toBe(f.raw)
  expect((await f.finish()).status).toBe('saved');ui.render();ui.back()
  const view=f.controller.snapshot.view!,features=view.features as unknown as PlayFeatures,job=features.life.jobs.find(j=>j.kind==='workspace')!
  expect(job).toMatchObject({startAt:'2020-03-28',completeAt:'2020-04-04',status:'running'})
  expect(ui.room().openingFocus).toMatchObject({kind:'life',selection:'workspace',entityId:job.id})
  expect(storedFocus(f)).toEqual(ui.room().openingFocus)
  expect(view.budget).toMatchObject({available:0,spent:4,reserved:0})
  expect(features.workbench.finance.find(a=>a.accountId==='personal')!.cashFen).toBe(3180000)
  expect(features.firstOrder.result).toMatchObject({paymentFen:130000,directCostFen:50000,netOrderFen:80000})
 }finally{await f.close()}
})

it('keeps viewing and cancelled life confirmation separate from the original bookmark and saved game',async()=>{
 const f=await fixture('finished-life-cancel')
 try{const ui=driver(f);ui.review();ui.click('返回调整');expect(storedFocus(f)).toEqual(f.focus);expect(f.preferences.get(f.key)).toBe(f.initial);expect(f.controller.exportSaved()).toBe(f.raw);expect(f.submit).not.toHaveBeenCalled()}finally{await f.close()}
})

it.each(['work','course'] as const)('keeps a genuinely unfinished %s primary while a separate life activity really saves',async focusKind=>{
 const f=await fixture('finished-life-open-'+focusKind,{focusKind})
 try{const ui=driver(f);await ui.start();expect((await f.finish()).status).toBe('saved');ui.render();expect(storedFocus(f)).toEqual(f.focus);expect(f.controller.snapshot.view!.revision).toBe(f.view.revision+1)}finally{await f.close()}
})

it('does not publish a late life result into another life selection, including workspace to rest to workspace',async()=>{
 const f=await fixture('finished-life-changed-scope')
 try{const ui=driver(f);await ui.start();ui.mode('rest');ui.mode('workspace');expect((await f.finish()).status).toBe('saved');ui.render();expect(storedFocus(f)).toEqual(f.focus);expect(ui.scene().receipt).toBeNull();expect(f.submit).toHaveBeenCalledTimes(1)}finally{await f.close()}
})

it('keeps the old primary and physical head after an actual abort, then follows only the exact original candidate on retry',async()=>{
 const f=await fixture('finished-life-original-retry',{abort:true})
 try{
  const ui=driver(f);await ui.start();expect((await f.finish()).status).toBe('unsaved');ui.render()
  expect(f.fault!.trace).toEqual({writeSucceeded:true,abortIssued:true});expect(storedFocus(f)).toEqual(f.focus)
  expect(await f.controller.exportStored(f.view.runId)).toBe(f.raw)
  const candidate=f.controller.exportCandidate();ui.click('重试保存原候选');expect((await f.finishRetry()).status).toBe('saved');ui.render();ui.back()
  const job=(f.controller.snapshot.view!.features as unknown as PlayFeatures).life.jobs.find(j=>j.kind==='workspace')!
  expect(storedFocus(f)).toMatchObject({kind:'life',selection:'workspace',entityId:job.id});expect(f.controller.exportSaved()).toBe(candidate)
  expect(f.submit).toHaveBeenCalledTimes(1);expect(f.retry).toHaveBeenCalledTimes(1)
 }finally{await f.close()}
})

it('keeps a newly selected life page when retrying the original candidate instead of borrowing its old display scope',async()=>{
 const f=await fixture('finished-life-retry-other-mode',{abort:true})
 try{const ui=driver(f);await ui.start();expect((await f.finish()).status).toBe('unsaved');ui.render();const candidate=f.controller.exportCandidate();ui.mode('rest');ui.click('重试保存原候选');expect((await f.finishRetry()).status).toBe('saved');ui.render();expect(f.controller.exportSaved()).toBe(candidate);expect(storedFocus(f)).toEqual(f.focus);expect(ui.scene().lifeMode).toBe('rest');expect(ui.scene().receipt).toBeNull()}finally{await f.close()}
})

it('does not overwrite an unsupported original UI preference while saving a legitimate life arrangement',async()=>{
 const f=await fixture('finished-life-unknown-preference',{version:99})
 try{const ui=driver(f);await ui.start();expect((await f.finish()).status).toBe('saved');ui.render();expect(f.preferences.get(f.key)).toBe(f.initial)}finally{await f.close()}
})
