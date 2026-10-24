import {expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {courseWaitDate} from './course-wait-date.ts'
import {courseFocusFor} from './course-player-thread.ts'
import {playerThread} from './player-thread.ts'
import {CourseThreadAction} from './CourseThreadAction.tsx'
import {CourseEncounter} from './CourseEncounter.tsx'
import {CourseTeachingChoice} from './CourseTeachingChoice.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {CommandButton} from './CommandButton.tsx'
import {Dialog} from './Dialog.tsx'
import raw97 from '../../goal-1/evidence/t17-acceptance-32/chrome-main-r8/r8-saved97-original-backup.json?raw'

// Actual saved normal97 before the failed R8 long wait. Hook driving below is
// handler evidence only; it does not claim DOM, effects, focus or Native QA.
const hooks=vi.hoisted(()=>({current:{values:[] as unknown[],index:0}}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{
  const slot=hooks.current.index++,values=hooks.current.values
  if(!(slot in values))values[slot]=typeof initial==='function'?(initial as ()=>T)():initial
  return [values[slot] as T,(value:T|((old:T)=>T))=>{values[slot]=typeof value==='function'?(value as (old:T)=>T)(values[slot] as T):value}] as const
 }
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useMemo:<T,>(factory:()=>T)=>factory(),useEffect:()=>{},useId:()=> 'course-public-wait'}
})
type Scope={values:unknown[];index:number}
function within<T>(scope:Scope,render:()=>T):T{const old=hooks.current;hooks.current=scope;scope.index=0;try{return render()}finally{hooks.current=old}}
type Element=ReactElement<Record<string,unknown>>
const elements=(value:unknown):Element[]=>Array.isArray(value)?value.flatMap(elements):isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children),...elements(value.props.footer)]:[]
function originalFunction(element:Element|undefined):unknown{if(!element||typeof element.type!=='function')throw Error('ORIGINAL_COMPONENT_REQUIRED');return Reflect.apply(element.type,undefined,[element.props])}
function activate(element:Element|undefined){const handler=element?.props.onClick;if(!element||element.props.disabled||typeof handler!=='function')throw Error('ORIGINAL_ENABLED_ACTION_REQUIRED');handler()}
async function normal(name:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'course-public-wait-'+name})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++sequence)})
 await controller.initialize();await controller.importNew(raw97)
 const request=vi.fn<GamePanelProps['request']>()
 const p=():GamePanelProps=>{const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,co=features.course!.cohorts.find(co=>co.id==='crs:65e711b806d157156363b88c08ec182c')!,lesson=features.course!.courses.find(c=>c.id===co.courseId)!,owner=features.course!.businesses.find(b=>b.id===lesson.businessId)!;return {controller,view,features,accountId:owner.accountId,request}}
 const first=p(),co=first.features.course!.cohorts[0]!,lesson=first.features.course!.courses.find(c=>c.id===co.courseId)!,jobId=co.stages[1]!.attempts.at(-1)!.jobId
 expect(first.view).toMatchObject({origin:'normal',revision:97,date:'2023-01-31'});expect(first.view.budget.available).toBe(1)
 const target={kind:'cohort' as const,businessId:lesson.businessId,courseId:lesson.id,cohortId:co.id,jobId}
 const thread=(props=p())=>playerThread(props,courseFocusFor(props,target))
 return {controller,p,target,thread,request,close:async()=>{await controller.close();await store.close()}}
}

it('uses one earlier public date for the actual97 thought, object, optional review and same-object record while retaining Apr1 as the job goal',async()=>{
 const f=await normal('shared-date')
 try{
  const p=f.p(),thread=f.thread(p),before=f.controller.exportSaved(),longDate=playableAdvanceDate(p.features.workbench,p.view.date,thread.wait!.date)
  expect(thread.wait?.date).toBe('2023-04-01');expect(longDate).toBe('2023-03-31');expect(p.features.workbench.progression.nextDate).toBe('2023-02-01')
  const encounter=CourseEncounter({p,thread,date:longDate,waitLabel:'先到日历上的下一处反馈',onChoose:vi.fn(),onResult:vi.fn(),onToday:vi.fn()})
  if(!isValidElement<ComponentProps<typeof CourseThreadAction>>(encounter))throw Error('ORIGINAL_THREAD_ACTION_REQUIRED')
  const clock=CourseThreadAction(encounter.props)
  if(!isValidElement<ComponentProps<typeof ClockAdvance>>(clock)||clock.type!==ClockAdvance)throw Error('ORIGINAL_SHARED_CLOCK_REQUIRED')
  expect(clock.props.date).toBe('2023-02-01');expect(clock.props.label).toBe('先到日历上的这一日 · 2023-02-01')
  const command=within({values:[],index:0},()=>ClockAdvance(clock.props)),tree=originalFunction(command as Element),all=elements(tree)
  const main=all.find(e=>e.type==='div'&&e.props.className==='command clock-main'),mainButton=elements(main).find(e=>e.type==='button'),paper=all.find(e=>e.type===OpeningObject),review=all.find(e=>e.type===CommandButton&&e.props.className==='clock-review')
  expect(mainButton?.props.onClick).toBe(paper?.props.onActivate)
  expect(paper?.props.detail).toContain('2023-04-01');expect(paper?.props.actionLabel).toContain('2023-02-01')
  expect(review?.props.payload).toEqual({date:'2023-02-01'})
  activate(mainButton);const open=paper?.props.onActivate;if(typeof open!=='function')throw Error('ORIGINAL_OBJECT_ACTION_REQUIRED');open();activate(elements(originalFunction(review)).find(e=>e.type==='button'))
  expect(f.request.mock.calls.map(call=>({kind:call[0],payload:call[1]}))).toEqual(Array.from({length:3},()=>({kind:'AdvanceTime',payload:{date:'2023-02-01'}})))
  expect(f.request.mock.calls.at(-1)?.[3]).toBe(true)

  const scope:Scope={values:[],index:0};let record:unknown
  const renderRecord=()=>{record=within(scope,()=>CourseTeachingChoice({p,target:f.target,children:open=><button type="button" onClick={()=>open('record')}>翻看这份同班安排</button>}))}
  renderRecord();activate(elements(record).find(e=>e.type==='button'));renderRecord()
  expect(elements(record).some(e=>e.type===Dialog)).toBe(true)
  const recordClock=elements(record).find(e=>e.type===ClockAdvance)
  expect(recordClock?.props.date).toBe('2023-02-01');expect(recordClock?.props.label).toBe('先到日历上的这一日 · 2023-02-01')
  expect(f.controller.exportSaved()).toBe(before)

  // A real source change invalidates the old thought/object binding.
  expect((await f.controller.submit(f.controller.prepare('AdvanceTime',{date:'2023-02-01'}))).status).toBe('saved')
  open();expect(f.request).toHaveBeenCalledTimes(3)
 }finally{await f.close()}
})

it('keeps invalid, past, same-day, quarter and original writer-policy boundaries without inventing a later wait',async()=>{
 const f=await normal('boundaries')
 try{
  const p=f.p(),w=p.features.workbench,before=f.controller.exportSaved()
  // Explicit public UI policy inputs below are not additional accepted histories.
  for(const next of ['not-a-date','2023-02-30','2023-01-30'])expect(courseWaitDate({...w,progression:{...w.progression,nextDate:next}},p.view.date,'2023-03-31')).toBeNull()
  expect(courseWaitDate(w,p.view.date,'2023-01-30')).toBeNull();expect(courseWaitDate(w,p.view.date,'not-a-date')).toBeNull()
  expect(courseWaitDate({...w,pause:{instanceId:'ui-boundary',reason:'CONTENT_DECISION_PENDING'}},p.view.date,'2023-03-31')).toBeNull()
  expect(courseWaitDate({...w,progression:{...w.progression,requiresDelivery:true}},p.view.date,'2023-03-31')).toBeNull()
  expect(courseWaitDate(w,p.view.date,p.view.date)).toBeNull()
  expect(courseWaitDate({...w,progression:{...w.progression,nextDate:p.view.date}},p.view.date,'2023-03-31')).toBe(p.view.date)
  expect(courseWaitDate({...w,progression:{...w.progression,nextDate:'2023-02-10'}},p.view.date,'2023-02-01')).toBe('2023-02-01')
  const quarter={...w,atQuarterEnd:true,progression:{...w.progression,quarterTarget:'2023-03-31',nextDate:'2023-04-01',nextQuarterDate:'2023-04-01'}}
  expect(courseWaitDate(quarter,'2023-03-31','2023-04-08')).toBe('2023-04-01')
  expect(courseWaitDate({...quarter,atQuarterEnd:false,progression:{...quarter.progression,nextQuarterDate:null}},'2023-03-31','2023-04-08')).toBe('2023-03-31')
  for(const view of [{...p.view,readOnly:true},{...p.view,hasCandidate:true,saveStatus:'unsaved' as const}]){
   const props={...p,view},node=CourseThreadAction({p:props,thread:f.thread(p),active:true,date:'2023-03-31',waitLabel:'原等待',onChoose:vi.fn(),onResult:vi.fn(),onToday:vi.fn(),children:primary=>primary?.main})
   expect(isValidElement(node)&&node.type===ClockAdvance).toBe(true)
   const command=within({values:[],index:0},()=>originalFunction(node as Element)),rendered=originalFunction(command as Element)
   expect(elements(rendered).find(e=>e.type==='button')?.props.disabled).toBe(true)
  }
  expect(f.request).not.toHaveBeenCalled();expect(f.controller.exportSaved()).toBe(before)
 }finally{await f.close()}
})

it('walks the original97 calendar through real original commands and receives the new course update on Mar14 before its Mar21 deadline',async()=>{
 const f=await normal('real-update-stop')
 try{
  const initial=f.p(),classId=f.target.cohortId,initialClass=initial.features.course!.cohorts.find(co=>co.id===classId)!,dates:string[]=[]
  expect(initial.features.course!.updates.some(update=>update.anchorId==='H004')).toBe(false)
  let reached=false
  for(let step=0;step<32;step++){
   const p=f.p(),update=p.features.course!.updates.find(update=>update.courseId===f.target.courseId&&update.anchorId==='H004')
   if(update){
    expect(p.view.date).toBe('2023-03-14');expect(update).toMatchObject({occurredAt:'2023-03-14',dueAt:'2023-03-21',defaulted:false,resolvedAt:null});reached=true;break
   }
   expect(p.features.workbench.pause).toBeNull();expect(p.features.workbench.progression.requiresDelivery).toBe(false)
   const thread=f.thread(p);expect(thread.wait?.date).toBe('2023-04-01')
   const requested=playableAdvanceDate(p.features.workbench,p.view.date,thread.wait!.date),date=courseWaitDate(p.features.workbench,p.view.date,requested)
   expect(date).not.toBeNull();expect(date!>=p.view.date).toBe(true);expect(date!<='2023-03-14').toBe(true)
   const command=f.controller.prepare('AdvanceTime',{date});expect(f.controller.preview(command).allowed).toBe(true)
   expect((await f.controller.submit(command)).status).toBe('saved');dates.push(f.p().view.date)
   expect(f.p().view.revision).toBe(p.view.revision+1)
   if(date===p.view.date)expect(f.p().features.workbench.progression.nextDate).not.toBe(date)
  }
  expect(reached).toBe(true);expect(dates[0]).toBe('2023-02-01');expect(dates.at(-1)).toBe('2023-03-14')
  const final=f.p(),co=final.features.course!.cohorts.find(co=>co.id===classId)!
  expect(final.view.budget).toEqual(initial.view.budget);expect(co.stages).toEqual(initialClass.stages);expect(co.supportJobs).toEqual(initialClass.supportJobs)
  expect(co.students).toEqual(initialClass.students);expect(co.closedAt).toBeNull();expect(co.teachingCancelled).toBe(false)
  expect(final.view.receipts.filter(r=>r.kind==='EnrollCourseAudience')).toHaveLength(1);expect(f.request).not.toHaveBeenCalled()
 }finally{await f.close()}
},30000)
