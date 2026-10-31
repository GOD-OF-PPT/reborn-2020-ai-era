import {beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import type {PlayFeatures,SceneTarget} from './game-types.ts'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import {emptyCourseSceneDraft,type CourseSceneDraftScope} from './course-scene-draft.ts'
import {openingFocusFor} from './player-thread.ts'
import {seasonFocusPreferenceKey,type SeasonFocusPreferenceStorage} from './season-focus-preference.ts'
import App from './App.tsx'
import {CinematicRoom} from './CinematicRoom.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {Dialog} from './Dialog.tsx'
import earnedSource from '../../goal-1/evidence/t17-acceptance-24/chrome-r4/course-physical-78.json?raw'
import committedSource from '../../goal-1/evidence/t17-acceptance-40/interaction-runtime-r354/course-prefix-r1/saved79.json?raw'
import {projectRun} from '../core/commands.ts'

// Actual App handlers and normal Controller/IDB saves. The existing hook driver
// does not execute React effects, a DOM, native locks or browser interactions.
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
 const action=element.props[event];if(typeof action!=='function')throw Error('ACTUAL_APP_HANDLER_REQUIRED')
 if(element.props.disabled)throw Error('ACTUAL_APP_HANDLER_DISABLED')
 if(event==='onChange')action({target:{value}});else action()
}
let sourceRunId=''
beforeAll(()=>{
 const codec=createCampaignCodec(),original=codec.import(earnedSource),stored=codec.import(committedSource)
 expect(original.origin).toBe('normal');expect(original.revision).toBe(78)
 expect(stored.origin).toBe('normal');expect(stored.revision).toBe(79)
 expect(stored.runId).toBe(original.runId);expect(stored.seed).toBe(original.seed)
 expect(stored.receipts.slice(0,original.receipts.length)).toEqual(original.receipts)
 expect(stored.receipts.at(-1)).toMatchObject({kind:'DefineCourse',commandId:'command-u3c1-course-same-setup-1'})
 expect(codec.export(stored)).toBe(committedSource)
 const before=projectRun(original),after=projectRun(stored)
 expect(after.budget).toEqual(before.budget);expect(after.accounts).toEqual(before.accounts)
 sourceRunId=stored.runId
})
async function normal(name:string,mode:'define'|'license'='define',abort=false,legacy=false){
 const codec=createCampaignCodec(),factory=new IDBFactory(),locks=new MemoryWriterAccess(),physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 // This prefix was actually saved by the original Controller/Session/Store.
 // Each consumer still imports/validates it; no AP, case or financial field is injected.
 await physical.importSave(committedSource,{mode:'create',actorId:'player',importId:name+'-source'})
 let sequence=1
 const fault=abort?abortAfterHeadWrite(factory,name):null,store=new IndexedDbRunStore({codec,factory:fault?.factory??factory,keyRange:IDBKeyRange,name}),controller=new GameController({codec,store,locks,id:()=>name+'-command-'+(++sequence)})
 await controller.initialize();await controller.continueLife(sourceRunId)
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,company=features.course!.businesses.find(b=>b.lifecycle==='operating')!,courseA=features.course!.courses[0]!,firstCase=features.course!.cases.find(c=>c.kind==='first_order')!,licensedCase=features.course!.cases.find(c=>c.kind==='video'&&c.licensed)!,courseB=features.course!.courses.find(c=>c.name==='后来明确翻看的教案B')!,raw=committedSource
 expect(view.date).toBe('2022-12-08');expect(company.company).toBe(true);expect(company.accountId).not.toBe('personal')
 expect(licensedCase).toBeDefined();expect(courseB).toBeDefined();expect(features.course!.licenses).toHaveLength(0)
 const definition={businessId:company.id,name:'稍后明确留下的教案C',productId:'intro_recorded',topicId:'image_workflows',edition:'foundation',segment:'local_merchants',cases:[{kind:'first_order',id:firstCase.id}],consent:true}
 const targetA:CourseSceneTarget=mode==='define'?{kind:'studio',businessId:company.id}:{kind:'course',businessId:company.id,courseId:courseA.id},targetB:CourseSceneTarget={kind:'course',businessId:company.id,courseId:courseB.id},initialTarget=legacy?undefined:targetA
 const focus=openingFocusFor({view,features:view.features as unknown as PlayFeatures},'course',{accountId:company.accountId,courseTarget:targetA})!
 const preferences=new Map([[seasonFocusPreferenceKey(view.runId),JSON.stringify({version:1,runId:view.runId,quarter:(view.features as unknown as PlayFeatures).workbench.quarter,focus})]])
 const storage:SeasonFocusPreferenceStorage={getItem:key=>preferences.get(key)??null,setItem:(key,value)=>{preferences.set(key,value)}}
 const settled=deferred(),release=deferred(),realSubmit=controller.submit.bind(controller)
 // Only delivery to App is delayed: the original Controller result and physical
 // atomic save/failure have already happened when settled resolves.
 const submit=vi.spyOn(controller,'submit').mockImplementation(async command=>{const result=await realSubmit(command);settled.resolve();await release.promise;return result}),retry=vi.spyOn(controller,'retry')
 const finish=async()=>{release.resolve();const call=submit.mock.results.at(-1);if(call?.type!=='return')throw Error('ACTUAL_SUBMISSION_PROMISE_REQUIRED');const result=await call.value;await Promise.resolve();await Promise.resolve();return result}
 const finishRetry=async()=>{const call=retry.mock.results.at(-1);if(call?.type!=='return')throw Error('ACTUAL_RETRY_PROMISE_REQUIRED');const result=await call.value;await Promise.resolve();await Promise.resolve();return result}
 const close=async()=>{release.resolve();const call=submit.mock.results.at(-1);if(call?.type==='return')await call.value;await controller.close(true);await physical.close()}
 const payload=mode==='define'?definition:{businessId:company.id,caseKind:'video',caseId:licensedCase.id,resources:['player-production'],startAt:'2022-12-18'}
 return {codec,physical,controller,company,courseA,licensedCase,view,raw,targetA,targetB,initialTarget,definition,payload,kind:mode==='define'?'DefineCourse':'LicenseCourseMaterials',storage,preferences,settled,submit,retry,fault,finish,finishRetry,close}
}
type Fixture=Awaited<ReturnType<typeof normal>>
const pin=(f:Fixture):CourseSceneTarget=>JSON.parse(f.preferences.get(seasonFocusPreferenceKey(f.view.runId))!).focus.courseTarget
function driver(f:Fixture){
 hooks.values=[];let tree:ReturnType<typeof App>
 const render=()=>{hooks.index=0;tree=App({controller:f.controller,focusPreferenceStorage:f.storage})}
 const component=<T,>(type:unknown):T=>{const element=elements(tree).find(e=>e.type===type);if(!element)throw Error('PUBLIC_APP_COMPONENT_REQUIRED');return element.props as T}
 const scene=()=>component<ComponentProps<typeof NarrativeScene>>(NarrativeScene)
 const book=()=>elements(tree).find(e=>e.type===Dialog&&e.props.className==='scene-workspace workspace-course')
 const preparationFeedback=()=>elements(tree).find(e=>e.type==='p'&&e.props.className==='scene-sheet-caption'&&e.props.role==='status')
 const click=(label:string)=>{const element=elements(tree).find(e=>e.type==='button'&&text(e).includes(label));if(!element)throw Error('VISIBLE_APP_BUTTON_REQUIRED:'+label);fire(element,'onClick');render()}
 const openBook=(target:CourseSceneTarget|undefined=f.initialTarget,slot?:SceneTarget['courseDraftSlot'])=>{
  const request={openRecord:true,accountId:f.company.accountId,...(target===undefined?{}:{courseTarget:target}),...(slot?{courseDraftSlot:slot}:{})}
  if(elements(tree).some(e=>e.type===CinematicRoom))component<ComponentProps<typeof CinematicRoom>>(CinematicRoom).onNavigate('course',request)
  else scene().onOpen('course',request)
  render()
 }
 render();openBook()
 return {render,scene,book,preparationFeedback,click,openBook,
  async start(){scene().request(f.kind,f.payload,'原工作室这次真实准备',true);render();click('就这样决定');await f.settled.promise;render()},
  closeConfirmation(){click('返回调整')},
  changeAccount(accountId:string){const label=elements(tree).find(e=>e.type==='label'&&e.props.className==='scene-sheet-account'),select=label&&elements(label).find(e=>e.type==='select');if(!select)throw Error('VISIBLE_ACCOUNT_SELECT_REQUIRED');fire(select,'onChange',accountId);render()},
  selectTarget(target:CourseSceneTarget){const select=scene().onCourseTargetChange;if(!select)throw Error('PUBLIC_COURSE_SELECTION_REQUIRED');select(target);render()},
  closeBook(){const current=book();if(!current||typeof current.props.onClose!=='function')throw Error('OPEN_ORIGINAL_BOOK_REQUIRED');current.props.onClose();render()},
 }
}
function keepDraft(f:Fixture,ui:ReturnType<typeof driver>,slot:'sample'|`license:video:${string}`){
 const scope:CourseSceneDraftScope={accountId:f.company.accountId,businessId:f.company.id,courseId:slot==='sample'?f.courseA.id:null,slot},draft={...emptyCourseSceneDraft(),name:'我仍在调整的原教案',resources:['player-production'],startAt:'2022-12-28'}
 const memory=ui.scene().courseDraftMemory;if(!memory)throw Error('ACTUAL_APP_DRAFT_MEMORY_REQUIRED');expect(memory.write(f.view.runId,scope,draft)).toBe(true)
 return {scope,draft,memory}
}

it('follows the actual new course of a saved definition and closes only that same original workspace',async()=>{
 const f=await normal('u3c1-course-same')
 try{
  const ui=driver(f);await ui.start();const saved=f.controller.exportSaved()
  expect((await f.finish()).status).toBe('saved');ui.render()
  const view=f.controller.snapshot.view!,course=(view.features as unknown as PlayFeatures).course!.courses.find(c=>c.name===f.definition.name)!,expected={kind:'course',businessId:f.company.id,courseId:course.id}
  expect(course.status).toBe('draft');expect(course.sampleJobId).toBeNull()
  expect(ui.scene().courseTarget).toEqual(expected);expect(pin(f)).toEqual(expected)
  expect(ui.scene().accountId).toBe(f.company.accountId);expect(ui.book()).toBeUndefined();expect(ui.scene().receipt).toContain(f.definition.name)
  expect(view.revision).toBe(f.view.revision+1);expect(view.accounts).toEqual(f.view.accounts);expect(view.budget).toEqual(f.view.budget)
  expect((view.features as unknown as PlayFeatures).course!.cohorts).toHaveLength(0)
  expect(f.controller.exportSaved()).toBe(saved);expect(await f.physical.exportStored(f.view.runId)).toBe(saved);expect(f.submit).toHaveBeenCalledTimes(1)
 }finally{await f.close()}
})

it.each(['target','account','reopen'] as const)('keeps a later course %s context when the original actual saved definition arrives',async change=>{
 const f=await normal('u3c1-course-'+change)
 try{
  const ui=driver(f);await ui.start();ui.closeConfirmation()
  if(change==='target')ui.selectTarget(f.targetB)
  else if(change==='account')ui.changeAccount('personal')
  else{ui.closeBook();ui.openBook()}
  const target=change==='target'?f.targetB:f.targetA,account=change==='account'?'personal':f.company.accountId,saved=f.controller.exportSaved()
  expect(ui.scene().courseTarget).toEqual(target);expect(ui.scene().accountId).toBe(account);expect(ui.book()).toBeDefined()
  expect((await f.finish()).status).toBe('saved');ui.render()
  expect(ui.scene().courseTarget).toEqual(target);expect(ui.scene().accountId).toBe(account)
  expect(ui.book(),'an earlier save cannot close the later original reading workspace').toBeDefined();expect(ui.scene().receipt).toBeNull();expect(ui.preparationFeedback()).toBeUndefined()
  const course=(f.controller.snapshot.view!.features as unknown as PlayFeatures).course!.courses.find(c=>c.name===f.definition.name)!
  expect(pin(f)).toEqual(change==='target'?f.targetB:{kind:'course',businessId:f.company.id,courseId:course.id})
  expect(f.controller.snapshot.view!.revision).toBe(f.view.revision+1);expect(f.submit).toHaveBeenCalledTimes(1)
  expect(f.controller.exportSaved()).toBe(saved);expect(await f.physical.exportStored(f.view.runId)).toBe(saved)
 }finally{await f.close()}
})

it('retains the actual same-course licence draft after saving a real planned licence without granting completed rights or sample income',async()=>{
 const f=await normal('u3c1-course-license','license')
 try{
  const ui=driver(f),draft=keepDraft(f,ui,`license:video:${f.licensedCase.id}`)
  await ui.start();const saved=f.controller.exportSaved();expect((await f.finish()).status).toBe('saved');ui.render()
  const view=f.controller.snapshot.view!,features=view.features as unknown as PlayFeatures,license=features.course!.licenses[0]!,before=f.view.accounts.find(a=>a.accountId===f.company.accountId)!,after=view.accounts.find(a=>a.accountId===f.company.accountId)!
  expect(ui.scene().courseTarget).toEqual(f.targetA);expect(pin(f)).toEqual(f.targetA);expect(ui.book()).toBeDefined();expect(ui.preparationFeedback()).toBeDefined();expect(ui.scene().receipt).toBeNull()
  expect(draft.memory.read(f.view.runId,draft.scope)).toEqual(draft.draft)
  expect(license).toMatchObject({businessId:f.company.id,caseId:f.licensedCase.id,job:{status:'planned',startAt:'2022-12-18',completeAt:'2022-12-25'}})
  expect(after.cashFen).toBe(before.cashFen);expect(after.availableFen).toBe(before.availableFen-30000)
  expect(view.budget.spent).toBe(f.view.budget.spent);expect(view.budget.reserved).toBe(f.view.budget.reserved+1);expect(view.date).toBe(f.view.date)
  expect(features.course!.cohorts).toHaveLength(0);expect(features.course!.businesses.find(b=>b.id===f.company.id)!.metrics.incomeFen).toBe(0)
  expect(f.controller.exportSaved()).toBe(saved);expect(await f.physical.exportStored(f.view.runId)).toBe(saved);expect(f.submit).toHaveBeenCalledTimes(1)
 }finally{await f.close()}
})

it('keeps a later sample draft slot on the same course free from an older licence callback',async()=>{
 const f=await normal('u3c1-course-slot','license')
 try{
  const ui=driver(f),draft=keepDraft(f,ui,'sample');await ui.start();ui.closeConfirmation();ui.openBook(f.targetA,'sample')
  const saved=f.controller.exportSaved();expect((await f.finish()).status).toBe('saved');ui.render()
  expect(ui.scene().courseTarget).toEqual(f.targetA);expect(ui.book()).toBeDefined();expect(ui.preparationFeedback()).toBeUndefined();expect(ui.scene().receipt).toBeNull()
  expect(draft.memory.read(f.view.runId,draft.scope)).toEqual(draft.draft)
  expect(f.controller.exportSaved()).toBe(saved);expect(await f.physical.exportStored(f.view.runId)).toBe(saved);expect(f.submit).toHaveBeenCalledTimes(1)
 }finally{await f.close()}
})

it('follows its own saved studio licence and retains that exact licence slot with visible committed feedback',async()=>{
 const f=await normal('u3c1-course-studio-license','license')
 try{
  const ui=driver(f),studio:CourseSceneTarget={kind:'studio',businessId:f.company.id},slot=`license:video:${f.licensedCase.id}` as const
  ui.selectTarget(studio);ui.openBook(studio,slot)
  const draft=keepDraft(f,ui,slot);await ui.start();const saved=f.controller.exportSaved()
  expect((await f.finish()).status).toBe('saved');ui.render()
  const license=(f.controller.snapshot.view!.features as unknown as PlayFeatures).course!.licenses[0]!,target={kind:'license',businessId:f.company.id,licenseId:license.id}
  expect(ui.scene().courseTarget).toEqual(target);expect(pin(f)).toEqual(target)
  expect(ui.book()).toBeDefined();expect(ui.preparationFeedback()).toBeDefined();expect(ui.scene().receipt).toBeNull()
  expect(draft.memory.read(f.view.runId,draft.scope)).toEqual(draft.draft)
  expect(f.controller.exportSaved()).toBe(saved);expect(await f.physical.exportStored(f.view.runId)).toBe(saved);expect(f.submit).toHaveBeenCalledTimes(1)
 }finally{await f.close()}
})

it('treats reordered properties of the same explicit course identity as the same workspace',async()=>{
 const f=await normal('u3c1-course-canonical','license')
 try{
  const ui=driver(f);await ui.start();ui.closeConfirmation()
  ui.selectTarget({courseId:f.courseA.id,businessId:f.company.id,kind:'course'})
  expect((await f.finish()).status).toBe('saved');ui.render()
  expect(ui.scene().courseTarget).toEqual(f.targetA);expect(ui.book()).toBeDefined();expect(ui.preparationFeedback()).toBeDefined()
  expect(f.submit).toHaveBeenCalledTimes(1)
 }finally{await f.close()}
})

it('preserves the original undefined legacy course preparation context and its actual licence draft',async()=>{
 const f=await normal('u3c1-course-legacy','license',false,true)
 try{
  const ui=driver(f),draft=keepDraft(f,ui,`license:video:${f.licensedCase.id}`)
  expect(ui.scene().courseTarget).toBeUndefined();await ui.start();expect((await f.finish()).status).toBe('saved');ui.render()
  expect(ui.scene().courseTarget).toBeUndefined();expect(ui.book()).toBeDefined();expect(ui.preparationFeedback()).toBeDefined();expect(ui.scene().receipt).toBeNull()
  expect(draft.memory.read(f.view.runId,draft.scope)).toEqual(draft.draft)
  expect(f.submit).toHaveBeenCalledTimes(1);expect(f.controller.snapshot.view!.revision).toBe(f.view.revision+1)
 }finally{await f.close()}
})

it('keeps an actual head-write licence abort private and retries its original candidate without replacing a later course B',async()=>{
 const f=await normal('u3c1-course-retry','license',true)
 try{
  const ui=driver(f);await ui.start();expect((await f.finish()).status).toBe('unsaved');ui.render()
  expect(f.fault?.trace).toEqual({writeSucceeded:true,abortIssued:true});expect(ui.scene().courseTarget).toEqual(f.targetA)
  expect(ui.book()).toBeUndefined();expect(ui.preparationFeedback()).toBeUndefined();expect(ui.scene().receipt).toBeNull()
  expect(f.controller.snapshot.view!.revision).toBe(f.view.revision);expect(f.controller.snapshot.view!.accounts).toEqual(f.view.accounts);expect(f.controller.snapshot.view!.budget).toEqual(f.view.budget)
  expect(f.controller.exportSaved()).toBe(f.raw);expect(await f.physical.exportStored(f.view.runId)).toBe(f.raw)
  const candidate=f.controller.exportCandidate();ui.openBook(f.targetB);ui.click('重试保存原候选')
  expect((await f.finishRetry()).status).toBe('saved');ui.render()
  expect(ui.scene().courseTarget).toEqual(f.targetB);expect(ui.book()).toBeDefined();expect(ui.preparationFeedback()).toBeUndefined();expect(ui.scene().receipt).toBeNull()
  expect((f.controller.snapshot.view!.features as unknown as PlayFeatures).course!.licenses).toHaveLength(1)
  expect(f.controller.exportSaved()).toBe(candidate);expect(await f.physical.exportStored(f.view.runId)).toBe(candidate)
  expect(f.submit).toHaveBeenCalledTimes(1);expect(f.retry).toHaveBeenCalledTimes(1)
 }finally{await f.close()}
})
