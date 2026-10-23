import {expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {addDays} from '../core/calendar.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import {CourseTeachingChoice,courseTeachingDraftCommand,type CourseTeachingIntent} from './CourseTeachingChoice.tsx'
import {createCourseTeachingDraftMemory,emptyCourseTeachingDraft,type CourseTeachingDraftScope} from './course-teaching-draft.ts'
import {CommandButton} from './CommandButton.tsx'
import ready from '../../goal-1/evidence/t17-acceptance-24/chrome-final-r5/course-r5-final-physical-86.json?raw'
import beforeClass from '../../goal-1/evidence/t17-acceptance-10/chrome-physical-r1/r74-physical-after-candidate-retry.json?raw'

// Invoke actual UI handlers with stable hooks; no DOM/effect/browser behaviour is claimed.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const slot=<T,>(initial:()=>T):[T,(value:T|((old:T)=>T))=>void]=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=initial();return [hooks.values[i] as T,value=>{hooks.values[i]=typeof value==='function'?(value as (old:T)=>T)(hooks.values[i] as T):value}]}
 return {...actual,useState:<T,>(initial:T|(()=>T))=>slot(()=>typeof initial==='function'?(initial as ()=>T)():initial),useRef:<T,>(initial:T)=>slot(()=>({current:initial}))[0],useId:()=> 'teaching-test',useEffect:()=>{}}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(value:unknown):Element[]=>Array.isArray(value)?value.flatMap(elements):isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children),...elements(value.props.footer)]:[]
const text=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''
function act(element:Element|undefined,event:'onClick'|'onChange',value?:unknown){const handler=element?.props[event];if(typeof handler!=='function')throw Error('ACTUAL_HANDLER_REQUIRED:'+event);handler(value)}
function component(element:Element|undefined){if(!element||typeof element.type!=='function')throw Error('ACTUAL_COMPONENT_REQUIRED');return Reflect.apply(element.type,undefined,[element.props])}
async function setup(raw:string,name:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name}),requests=vi.fn(),chosen=vi.fn(),inspect=vi.fn()
 let seq=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++seq)})
 await controller.initialize();await controller.importNew(raw)
 const memory=createCourseTeachingDraftMemory(controller.snapshot.view!.runId)
 const p=():GamePanelProps=>{const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,b=features.course!.businesses.find(b=>b.lifecycle==='operating')!;return {controller,view,features,accountId:b.accountId,courseTeachingDraftMemory:memory,request:requests}}
 const close=async()=>{hooks.values=[];await controller.close();await store.close()}
 return {controller,codec,store,memory,requests,chosen,inspect,p,close}
}
function driver(h:Awaited<ReturnType<typeof setup>>,initial:CourseSceneTarget){
 hooks.values=[];let target:CourseSceneTarget|null=initial,blocked:string|null=null,tree:ReturnType<typeof CourseTeachingChoice>|null=null,override:Partial<GamePanelProps>={}
 const render=()=>{hooks.index=0;tree=CourseTeachingChoice({p:{...h.p(),...override},target,onTarget:next=>{h.chosen(next);target=next},onInspect:h.inspect,blockedReason:blocked,children:open=><>{(['capital','audience','plan','enroll','stage:0','stage:1','recovery','refund','refresh','record'] as const).map(intent=><button type="button" key={intent} onClick={()=>open(intent)}>{'OPEN '+intent}</button>)}</>})}
 const all=()=>elements(tree),named=(name:string)=>all().find(e=>typeof e.type==='function'&&e.type.name===name)
 const click=(label:string)=>{act(all().find(e=>e.type==='button'&&text(e.props.children).includes(label)),'onClick');render()}
 const open=(intent:CourseTeachingIntent)=>click('OPEN '+intent)
 render();return {render,all,named,click,open,text:()=>text(tree),setTarget:(next:CourseSceneTarget)=>{target=next;render()},setBlocked:(reason:string|null)=>{blocked=reason;render()},override:(next:Partial<GamePanelProps>)=>{override=next;render()}}
}
const basicScope=(p:GamePanelProps,courseId:string,businessId:string,slot:CourseTeachingDraftScope['slot']):CourseTeachingDraftScope=>({accountId:p.accountId,businessId,courseId,audienceId:null,cohortId:null,slot})
it('uses actual capital and paid-audience handlers without spending on browsing, defaulting fields or borrowing the capital draft',async()=>{
 const h=await setup(ready,'teaching-ready-handlers')
 try{
  const p=h.p(),lesson=p.features.course!.courses.find(c=>c.status==='ready')!,target:CourseSceneTarget={kind:'course',businessId:lesson.businessId,courseId:lesson.id},d=driver(h,target),before=h.controller.exportSaved()
  d.open('audience')
  expect(d.all().filter(e=>e.type==='input'&&e.props.type==='radio').every(e=>e.props.checked===false)).toBe(true)
  const radios=()=>d.all().filter(e=>e.type==='input'&&e.props.type==='radio')
  act(radios().find(e=>e.props.checked===false),'onChange')
  const price=d.all().find(e=>e.type==='input'&&e.props.inputMode==='decimal')
  act(price,'onChange',{target:{value:'500'}});d.render()
  const audienceScope=basicScope(p,lesson.id,lesson.businessId,'audience')
  expect(h.memory.read(p.view.runId,audienceScope)).toMatchObject({audienceMode:'paid',price:'500',resources:[],startAt:''})
  d.click('再留出本次推广')
  const resources=elements(component(d.named('Resources')))
  act(resources.find(e=>e.type==='input'&&e.props.type==='radio'),'onChange',{target:{checked:true}})
  const date=elements(component(d.named('DateField'))).find(e=>e.type==='input'&&e.props.type==='date')
  const future=addDays(p.view.date,3);act(date,'onChange',{target:{value:future}});d.render()
  const actualDraft=h.memory.read(p.view.runId,audienceScope)!
  expect(actualDraft).toMatchObject({price:'500',audienceMode:'paid',resources:['player-production'],startAt:future})
  const blockedButton=elements(component(d.all().find(e=>e.type===CommandButton&&e.props.kind==='CreateCourseAudience'))).find(e=>e.type==='button')
  expect(blockedButton?.props.disabled).toBe(true);expect(h.requests).not.toHaveBeenCalled();expect(h.controller.exportSaved()).toBe(before)
  d.open('capital');act(d.all().find(e=>e.type==='input'&&e.props.inputMode==='decimal'),'onChange',{target:{value:'10000'}});d.render()
  const fund=d.all().find(e=>e.type===CommandButton&&e.props.kind==='FundBusiness'),button=elements(component(fund)).find(e=>e.type==='button')
  expect(button?.props.disabled).toBe(false);act(button,'onClick');d.render()
  expect(h.requests).toHaveBeenLastCalledWith('FundBusiness',{businessId:lesson.businessId,amountFen:1000000},expect.any(String),true)
  expect(h.chosen).not.toHaveBeenCalled();expect(h.controller.exportSaved()).toBe(before)
  expect((await h.controller.submit(h.controller.prepare('FundBusiness',{businessId:lesson.businessId,amountFen:1000000}))).status).toBe('saved')
  d.open('audience');d.click('再留出本次推广')
  const offer=d.all().find(e=>e.type===CommandButton&&e.props.kind==='CreateCourseAudience'),offerButton=elements(component(offer)).find(e=>e.type==='button')
  expect(offer?.props.payload).toEqual({courseId:lesson.id,mode:'paid',priceFen:50000,resources:['player-production'],startAt:future});expect(offerButton?.props.disabled).toBe(false)
  act(offerButton,'onClick');d.render();expect(h.requests).toHaveBeenLastCalledWith('CreateCourseAudience',offer!.props.payload,expect.any(String),true)
  expect(h.memory.read(p.view.runId,audienceScope)).toEqual(actualDraft);expect(h.memory.read(p.view.runId,basicScope(p,lesson.id,lesson.businessId,'capital'))?.capital).toBe('10000')
  expect(h.chosen).not.toHaveBeenCalled()
 }finally{await h.close()}
},20000)
it('keeps consecutive real enrollment/refund checkbox edits and exact selected IDs instead of slicing or overwriting arrays',async()=>{
 const h=await setup(beforeClass,'teaching-class-handlers')
 try{
  const p=h.p(),co=p.features.course!.cohorts[0]!,lesson=p.features.course!.courses.find(c=>c.id===co.courseId)!,target:CourseSceneTarget={kind:'cohort',businessId:lesson.businessId,courseId:lesson.id,cohortId:co.id},d=driver(h,target),before=h.controller.exportSaved()
  d.open('enroll')
  const people=d.all().filter(e=>e.type==='input'&&e.props.type==='checkbox');expect(people.length).toBeGreaterThanOrEqual(2)
  act(people[0],'onChange',{target:{checked:true}});act(people[1],'onChange',{target:{checked:true}});d.render()
  const scope:CourseTeachingDraftScope={...basicScope(p,lesson.id,lesson.businessId,'enroll'),audienceId:co.audienceId,cohortId:co.id}
  const selected=h.memory.read(p.view.runId,scope)!
  expect(selected.personIds).toEqual(co.availablePeople.slice(0,2))
  expect(courseTeachingDraftCommand(p,selected,'enroll',target)?.payload).toEqual({cohortId:co.id,personIds:co.availablePeople.slice(0,2)})
  const copy=[...selected.personIds];selected.personIds.length=0;expect(h.memory.read(p.view.runId,scope)?.personIds).toEqual(copy)
  d.click('翻开同对象');expect(h.inspect).toHaveBeenLastCalledWith(target,'enroll');expect(h.chosen).not.toHaveBeenCalled()
  d.open('refund')
  const refundPeople=d.all().filter(e=>e.type==='input'&&e.props.type==='checkbox'&&!e.props.disabled)
  act(refundPeople[0],'onChange',{target:{checked:true}});act(refundPeople[1],'onChange',{target:{checked:true}})
  act(d.all().find(e=>e.type==='input'&&e.props.maxLength===200),'onChange',{target:{value:'按本班原承诺处理'}});d.render()
  const refundScope={...scope,slot:'refund' as const},refund=h.memory.read(p.view.runId,refundScope)!
  expect(refund.personIds).toEqual(co.students.slice(0,2).map(s=>s.personId));expect(refund.reason).toBe('按本班原承诺处理')
  expect(h.memory.read(p.view.runId,scope)?.personIds).toEqual(copy)
  const command=courseTeachingDraftCommand(p,refund,'refund',target)!,native=elements(component(d.all().find(e=>e.type===CommandButton&&e.props.kind==='RefundCourseLearners'))).find(e=>e.type==='button')
  expect(native?.props.disabled).toBe(false);act(native,'onClick');d.render();expect(h.requests).toHaveBeenLastCalledWith(command.kind,command.payload,command.label,true)
  expect(courseTeachingDraftCommand(p,{...refund,personIds:[...refund.personIds,'unknown-student']},'refund',target)).toBeNull()
  expect(courseTeachingDraftCommand(p,{...refund,personIds:[refund.personIds[0]!,refund.personIds[0]!]},'refund',target)).toBeNull()
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},20000)
it('keeps owner, candidate, read-only, blocked and original-job gates synchronous while the original record remains inspectable',async()=>{
 const h=await setup(beforeClass,'teaching-gates')
 try{
  const p=h.p(),co=p.features.course!.cohorts[0]!,lesson=p.features.course!.courses.find(c=>c.id===co.courseId)!,target:CourseSceneTarget={kind:'cohort',businessId:lesson.businessId,courseId:lesson.id,cohortId:co.id},d=driver(h,target)
  const draft={...emptyCourseTeachingDraft(),resources:['player-production'],startAt:co.startAt}
  expect(courseTeachingDraftCommand(p,draft,'stage:0',target)?.payload).toEqual({cohortId:co.id,index:0,resources:['player-production'],startAt:co.startAt})
  expect(courseTeachingDraftCommand({...p,accountId:'personal'},draft,'stage:0',target)).toBeNull()
  expect(courseTeachingDraftCommand(p,{...draft,startAt:'2020-01-01'},'stage:0',target)).toBeNull()
  expect(courseTeachingDraftCommand(p,{...draft,resources:['player-production','unknown']},'stage:0',target)).toBeNull()
  expect(courseTeachingDraftCommand(p,draft,'stage:0',{...target,jobId:'not-this-cohort-job'})).toBeNull()
  expect(courseTeachingDraftCommand(p,{...draft,supportMode:'assisted_group'},'recovery',target)).toBeNull()
  d.open('stage:0');d.override({view:{...p.view,readOnly:true}})
  expect(d.all().filter(e=>e.type===CommandButton)).toHaveLength(0);expect(d.text()).toContain('仅可翻阅')
  d.override({view:{...p.view,hasCandidate:true}});expect(d.all().filter(e=>e.type===CommandButton)).toHaveLength(0)
  d.setBlocked('先回应当前原责任');expect(d.all().filter(e=>e.type===CommandButton)).toHaveLength(0)
  expect(h.requests).not.toHaveBeenCalled();expect(h.chosen).not.toHaveBeenCalled()
 }finally{await h.close()}
},20000)
