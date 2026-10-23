import {expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {CourseSceneChoice} from './CourseSceneChoice.tsx'
import {createCourseSceneDraftMemory,emptyCourseSceneDraft} from './course-scene-draft.ts'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import source from '../../goal-1/evidence/t17-acceptance-16/normal-before-course-studio.json?raw'

// Exercise actual selection handlers. This driver makes no DOM/effect/browser claim.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const slot=<T,>(initial:()=>T):[T,(value:T|((previous:T)=>T))=>void]=>{
  const index=hooks.index++
  if(!(index in hooks.values))hooks.values[index]=initial()
  return [hooks.values[index] as T,value=>{hooks.values[index]=typeof value==='function'?(value as (previous:T)=>T)(hooks.values[index] as T):value}]
 }
 return {...actual,useState:<T,>(initial:T|(()=>T))=>slot(()=>typeof initial==='function'?(initial as ()=>T)():initial),useRef:<T,>(initial:T)=>slot(()=>({current:initial}))[0],useId:()=> 'course-reselect',useEffect:()=>{}}
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
function act(element:Element,event:'onClick'|'onChange'){
 const handler=element.props[event]
 if(typeof handler!=='function')throw Error('VISIBLE_HANDLER_REQUIRED')
 handler()
}
it('returns to externally selected course A after choosing B without reviving a stale local target',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'course-choice-reselect'})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`course-reselect-${++sequence}`})
 try{
  await controller.initialize();await controller.importNew(source)
  const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')
  await send('OpenCourseStudio',{capitalFen:500000})
  const business=(controller.snapshot.view!.features as unknown as PlayFeatures).course!.businesses[0]!
  await send('StartCourseOutline',{businessId:business.id,resources:['player-production'],startAt:'2022-11-30'})
  await send('AdvanceTime',{date:'2022-12-07'});await send('ActivateBusiness',{businessId:business.id})
  const ref=(controller.snapshot.view!.features as unknown as PlayFeatures).course!.cases.find(ref=>ref.kind==='first_order')!
  const definition={businessId:business.id,productId:'intro_recorded',topicId:'image_workflows',edition:'foundation',segment:'ai_learners',cases:[{kind:ref.kind,id:ref.id}],consent:true}
  await send('DefineCourse',{...definition,name:'重新选回的教案甲'});await send('DefineCourse',{...definition,name:'另行查看的教案乙'})
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,[a,b]=features.course!.courses
  if(!a||!b)throw Error('TWO_ACTUAL_DRAFTS_REQUIRED')
  const targetA:CourseSceneTarget={kind:'course',businessId:business.id,courseId:a.id},targetB:CourseSceneTarget={kind:'course',businessId:business.id,courseId:b.id}
  const memory=createCourseSceneDraftMemory(view.runId),before=controller.exportSaved(),chosen:(CourseSceneTarget|null)[]=[]
  let target:CourseSceneTarget|null=targetA
  const p:GamePanelProps={controller,view,features,accountId:business.accountId,courseDraftMemory:memory,request:()=>{throw Error('BROWSING_MUST_NOT_SUBMIT')}}
  const scope=(id:string)=>({accountId:business.accountId,businessId:business.id,courseId:id,slot:'sample' as const})
  const draftA={...emptyCourseSceneDraft(),resources:['player-production'],startAt:'2022-12-12'},draftB={...draftA,startAt:'2022-12-19'}
  memory.write(view.runId,scope(a.id),draftA);memory.write(view.runId,scope(b.id),draftB)
  hooks.values=[]
  let tree:ReturnType<typeof CourseSceneChoice>|null=null
  const render=()=>{hooks.index=0;tree=CourseSceneChoice({p,target,onTarget:next=>{chosen.push(next);target=next}})}
  const click=(label:string)=>{
   const button=elements(tree).find(e=>e.type==='button'&&text(e.props.children).includes(label))
   if(!button)throw Error('VISIBLE_BUTTON_REQUIRED:'+label)
   act(button,'onClick');render()
  }
  const kicker=()=>text(elements(tree).find(e=>e.type==='p'&&e.props.className==='course-paper-kicker'))
  render();click('走近这份教案');click('翻选另一份教案')
  const label=elements(tree).find(e=>e.type==='label'&&text(e.props.children).includes(b.name)),radio=label&&elements(label).find(e=>e.type==='input'&&e.props.type==='radio')
  if(!radio)throw Error('PUBLIC_COURSE_CHOICE_REQUIRED')
  act(radio,'onChange');render();expect(chosen).toEqual([])
  click('明确翻看这一份');expect(target).toEqual(targetB);expect(kicker()).toContain(b.name)
  target=targetA;render()
  expect(kicker()).toContain(a.name);expect(kicker()).not.toContain(b.name)
  expect(memory.read(view.runId,scope(a.id))).toEqual(draftA);expect(memory.read(view.runId,scope(b.id))).toEqual(draftB)
  expect(controller.exportSaved()).toBe(before)
 }finally{hooks.values=[];await controller.close();await store.close()}
},20000)
