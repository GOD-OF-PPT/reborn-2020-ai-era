import {expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {addDays} from '../core/calendar.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {CommandButton} from './CommandButton.tsx'
import {CourseSceneChoice,courseDraftCommand,type CourseChoiceIntent} from './CourseSceneChoice.tsx'
import {courseSceneProgress,type CourseSceneTarget} from './course-scene-progress.ts'
import {createCourseSceneDraftMemory,emptyCourseSceneDraft,type CourseSceneDraftSlot,type CourseDraftCase} from './course-scene-draft.ts'
import source from '../../goal-1/evidence/t17-acceptance-24/chrome-r4/course-physical-78.json?raw'

// Reuse the selection tests' real-handler driver. No DOM, effect or Chrome claim.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const slot=<T,>(initial:()=>T):[T,(value:T|((previous:T)=>T))=>void]=>{
  const index=hooks.index++
  if(!(index in hooks.values))hooks.values[index]=initial()
  return [hooks.values[index] as T,value=>{hooks.values[index]=typeof value==='function'?(value as (previous:T)=>T)(hooks.values[index] as T):value}]
 }
 return {...actual,useState:<T,>(initial:T|(()=>T))=>slot(()=>typeof initial==='function'?(initial as ()=>T)():initial),useRef:<T,>(initial:T)=>slot(()=>({current:initial}))[0],useId:()=> 'course-license',useEffect:()=>{}}
})
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
function act(element:Element|undefined,event:'onClick'|'onChange',value?:unknown){
 const handler=element?.props[event]
 if(typeof handler!=='function')throw Error('VISIBLE_HANDLER_REQUIRED:'+event)
 handler(value)
}
function renderFunction(element:Element|undefined):unknown{
 if(!element||typeof element.type!=='function')throw Error('ACTUAL_COMPONENT_REQUIRED')
 return Reflect.apply(element.type,undefined,[element.props])
}
function driver(p:()=>GamePanelProps,target:CourseSceneTarget){
 hooks.values=[]
 const chosen=vi.fn(),inspect=vi.fn()
 let tree:ReturnType<typeof CourseSceneChoice>|null=null
 const render=()=>{hooks.index=0;tree=CourseSceneChoice({p:p(),target,onTarget:chosen,onInspect:inspect,children:open=><><button type="button" onClick={()=>open()}>打开当前教案</button><button type="button" onClick={()=>open('record')}>显式翻看原记录</button></>})}
 const click=(label:string)=>{act(elements(tree).find(e=>e.type==='button'&&text(e.props.children).includes(label)),'onClick');render()}
 const component=(name:string)=>elements(tree).find(e=>typeof e.type==='function'&&e.type.name===name)
 const open=(intent?:CourseChoiceIntent)=>click(intent==='record'?'显式翻看原记录':'打开当前教案')
 render()
 return {render,click,open,component,chosen,inspect,all:()=>elements(tree),text:()=>text(tree)}
}
async function normal(name:string,failSave=false){
 const codec=createCampaignCodec(),original=codec.import(source),factory=new IDBFactory(),locks=new MemoryWriterAccess(),physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 expect(original.origin).toBe('normal');expect(original.revision).toBe(78)
 await physical.importSave(source,{mode:'create',actorId:'player',importId:name+'-source'})
 const fault=failSave?abortAfterHeadWrite(factory,name):null,store=fault?new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name}):physical
 let sequence=0
 const controller=new GameController({codec,store,locks,id:()=>name+'-'+(++sequence)})
 await controller.initialize();await controller.continueLife(original.runId)
 const memory=createCourseSceneDraftMemory(original.runId),requests=vi.fn()
 const p=():GamePanelProps=>{
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,b=features.course!.businesses.find(b=>b.lifecycle==='operating')!
  return {controller,view,features,accountId:b.accountId,courseDraftMemory:memory,request:requests}
 }
 const initial=p(),course=initial.features.course!.courses.find(c=>c.cases.length===2)!
 expect(initial.view.date).toBe('2022-12-08');expect(course.cases.map(ref=>ref.kind)).toEqual(['first_order','video'])
 expect(course.status).toBe('draft');expect(course.sampleJobId).toBeNull()
 expect(initial.features.course!.licenses).toHaveLength(0);expect(initial.features.course!.cohorts).toHaveLength(0)
 const ref:CourseDraftCase={kind:'video',id:course.cases[1]!.id},target:CourseSceneTarget={kind:'course',businessId:course.businessId,courseId:course.id},slot:CourseSceneDraftSlot=`license:video:${ref.id}`,scope={accountId:initial.accountId,businessId:course.businessId,courseId:null,slot},draft={...emptyCourseSceneDraft(),resources:['player-production'],startAt:addDays(initial.view.date,10)}
 const close=async()=>{hooks.values=[];await controller.close();await store.close();if(physical!==store)await physical.close()}
 return {codec,factory,locks,physical,store,controller,fault,memory,requests,p,course,ref,target,scope,draft,close,name}
}

it('opens the actual second case licence step and preserves its target, future draft, original payload and inspect slot',async()=>{
 const h=await normal('course-license-a78-open')
 try{
  const p=h.p(),before=h.controller.exportSaved(),sampleScope={...h.scope,courseId:h.course.id,slot:'sample' as const},sample={...h.draft,startAt:addDays(p.view.date,20)},info=p.features.course!.cases.find(ref=>ref.kind===h.ref.kind&&ref.id===h.ref.id)!
  h.memory.write(p.view.runId,sampleScope,sample)
  expect(courseSceneProgress(p.features.course,p.view.date,h.target,{operations:p.view.operations})?.phase).toBe('course-rights-required')
  const d=driver(h.p,h.target);d.open()
  expect(d.component('Dialog')?.props.title).toBe('这份案例，能用于这一堂课吗？')
  expect(d.text()).toContain('案例2 · '+info.label);expect(d.component('CourseSceneRecord')).toBeUndefined()
  const change=(kind:'select'|'input',value:string)=>{
   const controls=elements(renderFunction(d.component('ScheduleFields')))
   act(controls.find(e=>e.type===kind&&(kind==='select'||e.props.type==='date')),'onChange',{target:{value}});d.render()
  }
  change('select','player-production');change('input',h.draft.startAt)
  expect(h.memory.read(p.view.runId,h.scope)).toEqual(h.draft)
  expect(h.memory.read(p.view.runId,sampleScope)).toEqual(sample)
  const expected={businessId:h.course.businessId,caseKind:'video',caseId:h.ref.id,resources:['player-production'],startAt:h.draft.startAt},command=courseDraftCommand(h.p(),h.draft,'license',h.target,h.ref)
  expect(command).toMatchObject({kind:'LicenseCourseMaterials',payload:expected,confirm:true})
  const original=d.all().find(e=>e.type===CommandButton&&e.props.kind==='LicenseCourseMaterials')
  expect(original?.props.payload).toEqual(expected)
  const button=elements(renderFunction(original)).find(e=>e.type==='button')
  expect(button?.props.disabled).toBe(false)
  act(button,'onClick');d.render()
  expect(h.requests).toHaveBeenCalledExactlyOnceWith('LicenseCourseMaterials',expected,command!.label,true)
  expect(h.controller.exportSaved()).toBe(before)
  d.open();d.click('翻看课程、资金与全部责任')
  expect(d.inspect).toHaveBeenCalledExactlyOnceWith(h.target,h.scope.slot)
  d.open('record')
  expect(d.component('CourseSceneRecord')?.props.target).toBe(h.target)
  expect(d.component('ScheduleFields')).toBeUndefined()
  expect(d.text()).toContain('核对案例2的课程使用范围');expect(d.text()).not.toContain('核对案例1的课程使用范围')
  d.click('翻看课程、资金与全部责任')
  expect(d.inspect).toHaveBeenLastCalledWith(h.target,undefined)
  expect(d.chosen).not.toHaveBeenCalled()
  expect(courseDraftCommand(h.p(),h.draft,'license',h.target,{kind:'video',id:'not-a-public-case'})).toBeNull()
  expect(courseDraftCommand(h.p(),h.draft,'license',h.target,{kind:'first_order',id:h.course.cases[0]!.id})).toBeNull()
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},20000)

it('keeps real reader and failed-save candidate gates, then avoids a duplicate licence after the exact retry',async()=>{
 const h=await normal('course-license-a78-candidate',true),readerStore=new IndexedDbRunStore({codec:h.codec,factory:h.factory,keyRange:IDBKeyRange,name:h.name}),reader=new GameController({codec:h.codec,store:readerStore,locks:h.locks,id:()=> 'course-license-reader'})
 try{
  const p=h.p(),before=h.controller.exportSaved()
  h.memory.write(p.view.runId,h.scope,h.draft)
  await reader.initialize();await reader.continueLife(p.view.runId)
  expect(reader.snapshot.view!.readOnly).toBe(true)
  const readerProps=():GamePanelProps=>{const view=reader.snapshot.view!;return {...p,controller:reader,view,features:view.features as unknown as PlayFeatures}}
  const readonly=driver(readerProps,h.target);readonly.open()
  expect(readonly.text()).toContain('当前仅可翻阅，不能提交教学准备')
  expect(readonly.all().filter(e=>e.type===CommandButton)).toHaveLength(0)
  expect(readonly.all().some(e=>e.type==='button'&&e.props.disabled===true&&text(e.props.children).includes('核对这份案例的课程使用范围'))).toBe(true)
  expect(readonly.chosen).not.toHaveBeenCalled();expect(h.requests).not.toHaveBeenCalled()
  const command=courseDraftCommand(p,h.draft,'license',h.target,h.ref)!
  expect(h.controller.preview(h.controller.prepare(command.kind,command.payload)).allowed).toBe(true)
  expect((await h.controller.submit(h.controller.prepare(command.kind,command.payload))).status).toBe('unsaved')
  expect(h.controller.exportSaved()).toBe(before);expect(h.codec.export((await h.physical.load(p.view.runId))!.run)).toBe(before)
  expect(h.p().view.hasCandidate).toBe(true);expect(h.p().features.course!.licenses).toHaveLength(0)
  const pending=driver(h.p,h.target);pending.open()
  expect(pending.text()).toContain('上一笔决定尚未保存')
  expect(pending.all().filter(e=>e.type===CommandButton)).toHaveLength(0)
  expect(h.requests).not.toHaveBeenCalled();expect(pending.chosen).not.toHaveBeenCalled()
  expect(h.memory.read(p.view.runId,h.scope)).toEqual(h.draft)
  const candidate=h.controller.exportCandidate();expect((await h.controller.retry()).status).toBe('saved')
  expect(h.controller.exportSaved()).toBe(candidate);expect(h.codec.export((await h.physical.load(p.view.runId))!.run)).toBe(candidate)
  expect(h.p().features.course!.licenses).toHaveLength(1)
  expect(h.p().features.course!.licenses[0]).toMatchObject({businessId:h.course.businessId,caseId:h.ref.id,job:{status:'planned',startAt:h.draft.startAt}})
  expect(courseDraftCommand(h.p(),h.draft,'license',h.target,h.ref)).toBeNull()
  const saved=driver(h.p,h.target);saved.open()
  expect(saved.component('CourseSceneRecord')?.props.target).toBe(h.target)
  expect(saved.component('ScheduleFields')).toBeUndefined()
  expect(saved.text()).not.toContain('核对案例2的课程使用范围')
  expect(saved.all().some(e=>e.type===CommandButton&&e.props.kind==='LicenseCourseMaterials')).toBe(false)
  expect(saved.chosen).not.toHaveBeenCalled();expect(h.requests).not.toHaveBeenCalled()
  expect(h.fault?.trace).toMatchObject({writeSucceeded:true,abortIssued:true})
  expect(h.p().features.course!.cohorts).toHaveLength(0)
 }finally{await reader.close();await readerStore.close();await h.close()}
},20000)
