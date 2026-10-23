import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {CommandButton} from './CommandButton.tsx'
import {CoursePanel,courseDraftScopeForTarget,courseTargetLocation,courseTeachingScopeForTarget} from './CoursePanel.tsx'
import {CourseStageChoice} from './CourseStageChoice.tsx'
import {courseWorkTarget,sceneWorks} from './SceneJournal.tsx'
import {courseTargetReason,type CourseSceneTarget,type CourseSceneStage} from './course-scene-progress.ts'
import {createCourseTeachingDraftMemory,emptyCourseTeachingDraft,type CourseTeachingDraftScope} from './course-teaching-draft.ts'
import ready86 from '../../goal-1/evidence/t17-acceptance-24/chrome-final-r5/course-r5-final-physical-86.json?raw'

// SSR uses real React. The opt-in branch drives actual book/scene handlers only.
const hooks=vi.hoisted(()=>({enabled:false,values:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{
  if(!hooks.enabled)return actual.useState(initial)
  const index=hooks.index++
  if(!(index in hooks.values))hooks.values[index]=typeof initial==='function'?(initial as ()=>T)():initial
  return [hooks.values[index] as T,(next:T|((previous:T)=>T))=>{hooks.values[index]=typeof next==='function'?(next as (previous:T)=>T)(hooks.values[index] as T):next}] as const
 }
 return {...actual,useState:state,useRef:<T,>(initial:T)=>hooks.enabled?state(()=>({current:initial}))[0]:actual.useRef(initial),useEffect:(effect:()=>void|(()=>void),deps?:readonly unknown[])=>{if(!hooks.enabled)actual.useEffect(effect,deps)}}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(value:unknown):Element[]=>Array.isArray(value)?value.flatMap(elements):isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children),...elements(value.props.footer)]:[]
const text=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''
function renderFunction(element:Element|undefined):unknown{if(!element||typeof element.type!=='function')throw Error('ACTUAL_BOOK_COMPONENT_REQUIRED');return Reflect.apply(element.type,undefined,[element.props])}
function act(element:Element|undefined,event:'onClick'|'onChange',value?:unknown){const handler=element?.props[event];if(typeof handler!=='function')throw Error('ACTUAL_HANDLER_REQUIRED:'+event);handler(value)}
function leaf(html:string,id:string,end:string){const start=html.indexOf('id="'+id+'"');expect(start).toBeGreaterThanOrEqual(0);return html.slice(start,html.indexOf(end,start)+end.length)}
async function normal(name:string,raw=ready86){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'c2-book-'+name}),requests=vi.fn();let count=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`c2-book-${name}-${++count}`})
 await controller.initialize();await controller.importNew(raw)
 const p=():GamePanelProps=>{const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,b=features.course!.businesses.find(b=>b.lifecycle==='operating')!;return {controller,view,features,accountId:b.accountId,request:requests}}
 const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status,kind).toBe('saved')
 const advance=async(date:string)=>{for(let n=0;n<100;n++){
  const {view,features}=p(),w=features.workbench
  if(w.pause){expect(w.pause.reason).toBe('CONTENT_DECISION_PENDING');const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;expect(choice).toMatchObject({costFen:0,actionPoints:0});await send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}
  if(view.date>=date&&!view.operations?.jobs.some(j=>['planned','running'].includes(j.status)&&j.completeAt<=date))return
  const barrier=w.atQuarterEnd?w.progression.nextQuarterDate:w.progression.quarterTarget
  await send('AdvanceTime',{date:barrier&&barrier<date?barrier:date})
 }throw Error('C2_BOOK_ORIGINAL_CLOCK_LIMIT')}
 return {codec,controller,requests,p,send,advance,close:async()=>{await controller.close();await store.close()}}
}
let h:Awaited<ReturnType<typeof normal>>,courseId='',businessId='',audienceId='',cohortA='',cohortB='',oldJob='',newJob='',beforeAttempts='',marketing:Pick<GamePanelProps,'view'|'features'>|null=null
beforeAll(async()=>{
 h=await normal('targets');expect(h.p().view).toMatchObject({origin:'normal',revision:86,date:'2023-01-16'})
 const c=h.p().features.course!.courses[0]!;courseId=c.id;businessId=c.businessId
 await h.send('FundBusiness',{businessId,amountFen:1000000})
 await h.send('CreateCourseAudience',{courseId,mode:'paid',priceFen:99900,resources:['player-production'],startAt:'2023-01-17'})
 marketing={view:h.p().view,features:h.p().features};await h.advance('2023-01-24')
 const a=h.p().features.course!.audiences[0]!;audienceId=a.id;expect(a.eligibleMembers.length).toBeGreaterThan(1)
 const plan={courseId,audienceId,seatLimit:2,supportMode:'self_small',resources:['player-production'],promise:'clear_scope'}
 await h.send('PlanCourseCohort',{...plan,startAt:'2023-01-26',endAt:'2023-03-01',supportStartAt:'2023-04-01'})
 await h.send('PlanCourseCohort',{...plan,startAt:'2023-01-27',endAt:'2023-03-05',supportStartAt:'2023-05-01'})
 const [aClass,bClass]=h.p().features.course!.cohorts;if(!aClass||!bClass)throw Error('TWO_REAL_CLASSES_REQUIRED');cohortA=aClass.id;cohortB=bClass.id
 await h.send('EnrollCourseAudience',{cohortId:cohortA,personIds:aClass.availablePeople.slice(0,2)})
 beforeAttempts=h.controller.exportSaved()
 await h.send('StartCourseStage',{cohortId:cohortA,index:0,resources:['player-production'],startAt:'2023-01-26'})
 oldJob=h.p().features.course!.cohorts.find(co=>co.id===cohortA)!.stageJobs[0]!.at(-1)!.id
 await h.send('InterruptJob',{jobId:oldJob})
 await h.send('StartCourseStage',{cohortId:cohortA,index:0,resources:['player-production'],startAt:'2023-01-27'})
 newJob=h.p().features.course!.cohorts.find(co=>co.id===cohortA)!.stageJobs[0]!.at(-1)!.id
},30000)
afterAll(async()=>{await h?.close()})
const target=(cohortId=cohortA):Extract<CourseSceneTarget,{kind:'cohort'}>=>({kind:'cohort',businessId,courseId,cohortId})
const scope=(p:GamePanelProps,cohortId:string,slot:CourseTeachingDraftScope['slot']):CourseTeachingDraftScope=>({accountId:p.accountId,businessId,courseId,audienceId,cohortId,slot})

it('locates the real audience, classes and every original attempt, including legacy IDs and cross-class rejection',()=>{
 const p=h.p(),raw=h.controller.exportSaved(),context={operations:p.view.operations},audience:CourseSceneTarget={kind:'audience',businessId,courseId,audienceId},old:CourseSceneTarget={...target(),kind:'cohort',cohortId:cohortA,jobId:oldJob},supportA=p.features.course!.cohorts.find(co=>co.id===cohortA)!.supportJobs[0]!.jobId
 for(const [t,id] of [[audience,audienceId],[target(),cohortA],[old,oldJob],[{...target(),kind:'cohort',cohortId:cohortA,jobId:supportA},supportA]] as const){
  expect(courseTargetReason(p.features.course,t,context)).toBeNull()
  expect(courseTargetLocation(p.features.course,t,context)?.focusId).toBe(id)
  const book=renderToStaticMarkup(<CoursePanel {...p} initialTarget={t}/>)
  expect(book).toContain('href="#'+encodeURIComponent(id)+'"');expect(book).toContain('id="'+id+'"')
 }
 expect(oldJob).not.toBe(newJob)
 const legacy=renderToStaticMarkup(<CoursePanel {...p} initialFocusId={oldJob}/>)
 expect(legacy).toContain('href="#'+encodeURIComponent(oldJob)+'"')
 const learner=p.features.course!.cohorts.find(co=>co.id===cohortA)!.students[0]!.id,learnerBook=renderToStaticMarkup(<CoursePanel {...p} initialTarget={target()} initialFocusId={learner}/>)
 expect(learnerBook).toContain('href="#'+encodeURIComponent(learner)+'"');expect(learnerBook).toContain('id="'+learner+'"')
 for(const recordId of [cohortB,'missing-original-record']){
  const wrongRecord=renderToStaticMarkup(<CoursePanel {...p} initialTarget={target()} initialFocusId={recordId}/>)
  expect(wrongRecord).toContain('原记录与这次课程或班期目标不匹配');expect(wrongRecord).not.toContain('从实际未购买意向中选择人数')
 }
 const invalid:CourseSceneTarget={kind:'cohort',businessId,courseId,cohortId:cohortB,jobId:supportA}
 const rejected=renderToStaticMarkup(<CoursePanel {...p} initialTarget={invalid}/>)
 expect(rejected).toContain('先找回原来的课程准备');expect(rejected).not.toContain('从实际未购买意向中选择人数')
 expect(courseDraftScopeForTarget(p.features.course,target(),p.accountId,undefined,context)).toEqual({scope:null,invalidReason:null})
 expect(courseDraftScopeForTarget(p.features.course,target(),p.accountId,'definition',context).invalidReason).not.toBeNull()
 expect(courseTeachingScopeForTarget(p.features.course,target(),p.accountId,'plan',context).invalidReason).not.toBeNull()
 for(const slot of ['capital','refresh'] as const)expect(courseTeachingScopeForTarget(p.features.course,target(),p.accountId,slot,context).scope).toEqual({accountId:p.accountId,businessId,courseId,audienceId:null,cohortId:null,slot})
 expect(h.controller.exportSaved()).toBe(raw)
})

it('maps actual paid marketing and original teaching/support jobs into complete same-account calendar targets',()=>{
 if(!marketing)throw Error('PUBLIC_MARKETING_SNAPSHOT_REQUIRED')
 const p=h.p(),a=p.features.course!.audiences.find(a=>a.id===audienceId)!,co=p.features.course!.cohorts.find(co=>co.id===cohortA)!,support=co.supportJobs[0]!.jobId,raw=h.controller.exportSaved()
 expect(sceneWorks(marketing).find(row=>row.id===a.jobId)).toMatchObject({accountId:p.accountId,courseTarget:{kind:'audience',businessId,courseId,audienceId}})
 for(const id of [oldJob,newJob,support])expect(courseWorkTarget(p,id,businessId)).toEqual({accountId:p.accountId,courseTarget:{kind:'cohort',businessId,courseId,cohortId:cohortA,jobId:id}})
 expect(sceneWorks(p).some(row=>row.id===oldJob)).toBe(false)
 expect(sceneWorks(p).find(row=>row.id===newJob)?.courseTarget).toEqual({kind:'cohort',businessId,courseId,cohortId:cohortA,jobId:newJob})
 expect(courseWorkTarget(p,newJob,'another-business')).toBeNull()
 const c=p.features.course!.courses.find(c=>c.id===courseId)!,c1:CourseSceneTarget={kind:'course',businessId,courseId,sampleJobId:c.sampleJobId!},book=renderToStaticMarkup(<CoursePanel {...p} initialTarget={c1}/>)
 expect(book).toContain('原样课任务记录');expect(book).toContain('id="'+c.sampleJobId+'"')
 expect(h.controller.exportSaved()).toBe(raw)
})

it('keeps class-specific plan, teaching and refund drafts, including a past date that must be explicitly reselected',async()=>{
 const initial=h.p(),memory=createCourseTeachingDraftMemory(initial.view.runId),stageScope=scope(initial,cohortA,'stage:0'),otherScope=scope(initial,cohortB,'stage:0'),draft={...emptyCourseTeachingDraft(),resources:['player-production'],startAt:'2023-01-28'},other={...draft,startAt:'2023-01-29'},refundScope=scope(initial,cohortA,'refund'),person=initial.features.course!.cohorts.find(co=>co.id===cohortA)!.students[0]!.personId,refund={...emptyCourseTeachingDraft(),personIds:[person],reason:'只核对本班这位学员的原款'}
 memory.write(initial.view.runId,stageScope,draft);memory.write(initial.view.runId,otherScope,other);memory.write(initial.view.runId,refundScope,refund)
 await h.advance('2023-01-29')
 const p={...h.p(),courseTeachingDraftMemory:memory},raw=h.controller.exportSaved(),book=renderToStaticMarkup(<CoursePanel {...p} initialTarget={target()} initialTeachingSlot="stage:0"/>),stage=leaf(book,cohortA+'-stage-0','</article>'),second=leaf(book,cohortB+'-stage-0','</article>'),refundHtml=leaf(book,cohortA+'-refund','</details>')
 expect(stage).toContain('value="2023-01-28"');expect(stage).toContain('原草稿日期2023-01-28已不在当前可安排范围')
 expect(second).toContain('value="2023-01-29"');expect(refundHtml).toContain('value="'+refund.reason+'"')
 expect(memory.read(p.view.runId,stageScope)).toEqual(draft);expect(memory.read(p.view.runId,otherScope)).toEqual(other);expect(memory.read(p.view.runId,refundScope)).toEqual(refund)
 expect(courseTeachingScopeForTarget(p.features.course,target(),p.accountId,'stage:0',{operations:p.view.operations}).scope).toEqual(stageScope)
 expect(h.controller.exportSaved()).toBe(raw)
})

it('passes the actual teaching-editor fields into the same book slot and reads back a book edit without submitting',async()=>{
 const g=await normal('stage-event',beforeAttempts)
 try{
  const base=g.p(),memory=createCourseTeachingDraftMemory(base.view.runId),p={...base,courseTeachingDraftMemory:memory},co=p.features.course!.cohorts.find(co=>co.id===cohortA)!,c=p.features.course!.courses.find(c=>c.id===courseId)!,product=p.features.course!.catalog.products.find(p=>p.id===c.productId)!,stage:CourseSceneStage={cohortId:co.id,courseId:c.id,index:0,dueAt:co.stages[0]!.dueAt,days:product.stageDays,actionPoints:product.stageAP},inspect=vi.fn(),raw=g.controller.exportSaved(),sceneSlots:unknown[]=[],bookSlots:unknown[]=[]
  let scene:unknown=null,book:unknown=null
  hooks.enabled=true
  const renderScene=()=>{hooks.values=sceneSlots;hooks.index=0;scene=renderFunction(CourseStageChoice({p,stage,onFullRecord:inspect,children:open=><button type="button" onClick={open}>选择这段教学</button>}))}
  const clickScene=(label:string)=>{act(elements(scene).find(e=>e.type==='button'&&text(e.props.children).includes(label)),'onClick');renderScene()}
  renderScene();clickScene('选择这段教学')
  const resource=elements(scene).find(e=>typeof e.type==='function'&&e.type.name==='ResourceSelect')
  expect(resource?.props.value).toBe('');expect(elements(scene).find(e=>e.type==='input'&&e.props.type==='date')?.props.value).toBe('')
  const onResource=resource?.props.onChange;if(typeof onResource!=='function')throw Error('ACTUAL_RESOURCE_CHANGE_REQUIRED');onResource('player-production');renderScene()
  act(elements(scene).find(e=>e.type==='input'&&e.props.type==='date'),'onChange',{target:{value:'2023-01-28'}});renderScene();clickScene('翻看原班期、支持与退款')
  expect(inspect).toHaveBeenCalledExactlyOnceWith(target(), 'stage:0')
  const renderBook=()=>{hooks.values=bookSlots;hooks.index=0;const outer=renderFunction(CoursePanel({...p,initialTarget:target(),initialTeachingSlot:'stage:0'})),business=elements(outer).find(e=>typeof e.type==='function'&&e.type.name==='CourseBusiness'),businessTree=renderFunction(business),klass=elements(businessTree).find(e=>typeof e.type==='function'&&e.type.name==='CourseClass'&&e.props.cohortId===cohortA);book=renderFunction(klass)}
  renderBook();const article=elements(book).find(e=>e.type==='article'&&e.props.id===cohortA+'-stage-0'),schedule=renderFunction(elements(article).find(e=>typeof e.type==='function'&&e.type.name==='TeachingSchedule'))
  expect(elements(schedule).find(e=>e.type==='input'&&e.props.type==='date')?.props.value).toBe('2023-01-28')
  act(elements(schedule).find(e=>e.type==='input'&&e.props.type==='date'),'onChange',{target:{value:'2023-01-29'}});renderBook();renderScene();clickScene('选择这段教学')
  expect(elements(scene).find(e=>e.type==='input'&&e.props.type==='date')?.props.value).toBe('2023-01-29')
  expect(memory.read(p.view.runId,scope(p,cohortA,'stage:0'))).toMatchObject({resources:['player-production'],startAt:'2023-01-29'})
  expect(g.requests).not.toHaveBeenCalled();expect(g.controller.exportSaved()).toBe(raw)
 }finally{hooks.enabled=false;hooks.values=[];await g.close()}
},20000)

it('submits the complete original class plan from shared book fields without changing its frozen audience price',()=>{
 const base=h.p(),memory=createCourseTeachingDraftMemory(base.view.runId),p={...base,courseTeachingDraftMemory:memory},planScope:CourseTeachingDraftScope={accountId:p.accountId,businessId,courseId,audienceId,cohortId:null,slot:'plan'},draft={...emptyCourseTeachingDraft(),price:'399',resources:['player-production'],startAt:'2023-05-01',endAt:'2023-06-01',supportStartAt:'2023-07-01',seatLimit:'2',supportMode:'self_small',promise:'clear_scope'},raw=h.controller.exportSaved(),requests=vi.fn(),props={...p,request:requests},audience:CourseSceneTarget={kind:'audience',businessId,courseId,audienceId}
 memory.write(p.view.runId,planScope,draft)
 try{
  hooks.enabled=true;hooks.values=[];let book:unknown=null
  const render=()=>{hooks.index=0;const outer=renderFunction(CoursePanel({...props,initialTarget:audience,initialTeachingSlot:'plan'})),business=renderFunction(elements(outer).find(e=>typeof e.type==='function'&&e.type.name==='CourseBusiness')),intake=renderFunction(elements(business).find(e=>typeof e.type==='function'&&e.type.name==='CourseIntake'&&e.props.courseId===courseId));book=renderFunction(elements(intake).find(e=>typeof e.type==='function'&&e.type.name==='CourseAudiencePlan'&&e.props.audienceId===audienceId))}
  render()
  const label=elements(book).find(e=>e.type==='label'&&text(e.props.children).includes('最终教学期限'))
  act(elements(label).find(e=>e.type==='input'),'onChange',{target:{value:'2023-06-02'}});render()
  const form=elements(book).find(e=>e.type==='form'),submit=form?.props.onSubmit
  if(typeof submit!=='function')throw Error('ORIGINAL_CLASS_PLAN_SUBMIT_REQUIRED')
  submit({preventDefault:()=>{}})
  expect(requests).toHaveBeenCalledExactlyOnceWith('PlanCourseCohort',{courseId,audienceId,startAt:'2023-05-01',endAt:'2023-06-02',supportStartAt:'2023-07-01',seatLimit:2,supportMode:'self_small',deploymentId:null,resources:['player-production'],promise:'clear_scope'},'冻结班额、阶段期限和真实支持预留',true)
  expect(memory.read(p.view.runId,planScope)).toEqual({...draft,endAt:'2023-06-02'})
  expect(h.controller.exportSaved()).toBe(raw)
 }finally{hooks.enabled=false;hooks.values=[]}
})

it('keeps explicit real enrolment and refund people in their own class slots and original confirmation requests',async()=>{
 const g=await normal('people-events',beforeAttempts)
 try{
  const base=g.p(),memory=createCourseTeachingDraftMemory(base.view.runId),p={...base,courseTeachingDraftMemory:memory},bClass=p.features.course!.cohorts.find(co=>co.id===cohortB)!,aClass=p.features.course!.cohorts.find(co=>co.id===cohortA)!,newPerson=bClass.availablePeople[0]!,paidPerson=aClass.students[0]!.personId,raw=g.controller.exportSaved(),states=new Map<string,unknown[]>();let currentClass=cohortB,book:unknown=null
  hooks.enabled=true
  const render=()=>{if(!states.has(currentClass))states.set(currentClass,[]);hooks.values=states.get(currentClass)!;hooks.index=0;const outer=renderFunction(CoursePanel({...p,initialTarget:target(currentClass)})),business=renderFunction(elements(outer).find(e=>typeof e.type==='function'&&e.type.name==='CourseBusiness'));book=renderFunction(elements(business).find(e=>typeof e.type==='function'&&e.type.name==='CourseClass'&&e.props.cohortId===currentClass))}
  render()
  expect(elements(book).find(e=>e.type===CommandButton&&e.props.kind==='EnrollCourseAudience')?.props.payload).toEqual({cohortId:cohortB,personIds:[]})
  expect(g.requests).not.toHaveBeenCalled()
  const personLabel=elements(book).find(e=>e.type==='label'&&text(e.props.children).includes('实际意向1'))
  act(elements(personLabel).find(e=>e.type==='input'),'onChange',{target:{checked:true}});render()
  const enroll=elements(book).find(e=>e.type===CommandButton&&e.props.kind==='EnrollCourseAudience'),enrollButton=elements(renderFunction(enroll)).find(e=>e.type==='button')
  expect(enrollButton?.props.disabled).toBe(false);act(enrollButton,'onClick')
  expect(g.requests.mock.calls[0]?.slice(0,2)).toEqual(['EnrollCourseAudience',{cohortId:cohortB,personIds:[newPerson]}]);expect(g.requests.mock.calls[0]?.[3]).toBe(true)
  const refundScope=scope(p,cohortA,'refund');memory.write(p.view.runId,refundScope,{...emptyCourseTeachingDraft(),personIds:[paidPerson],reason:'从近景带回的原款原因'})
  currentClass=cohortA;render()
  const refundLabel=elements(book).find(e=>e.type==='label'&&text(e.props.children).includes('退款原因'))
  act(elements(refundLabel).find(e=>e.type==='input'),'onChange',{target:{value:'核对后只为这位原学员退款'}});render()
  const refund=elements(book).find(e=>e.type===CommandButton&&e.props.kind==='RefundCourseLearners'&&Array.isArray((e.props.payload as {personIds?:unknown})?.personIds)&&((e.props.payload as {personIds:unknown[]}).personIds.length===1)),refundButton=elements(renderFunction(refund)).find(e=>e.type==='button')
  expect(refundButton?.props.disabled).toBe(false);act(refundButton,'onClick')
  expect(g.requests.mock.calls[1]?.slice(0,2)).toEqual(['RefundCourseLearners',{cohortId:cohortA,personIds:[paidPerson],reason:'核对后只为这位原学员退款'}]);expect(g.requests.mock.calls[1]?.[3]).toBe(true)
  expect(memory.read(p.view.runId,scope(p,cohortB,'enroll'))?.personIds).toEqual([newPerson])
  expect(memory.read(p.view.runId,refundScope)?.personIds).toEqual([paidPerson])
  expect(g.controller.exportSaved()).toBe(raw)
 }finally{hooks.enabled=false;hooks.values=[];await g.close()}
},20000)

it('keeps a real course refresh job reachable from the calendar and the same class without replacing its teaching identity',async()=>{
 const before=h.p()
 await h.send('StartCourseRefresh',{courseId,resources:['player-production'],startAt:'2023-02-07'})
 const p=h.p(),c=p.features.course!.courses.find(c=>c.id===courseId)!,job=c.refreshes.at(-1)!.job!,raw=h.controller.exportSaved(),courseTarget:CourseSceneTarget={kind:'course',businessId,courseId}
 expect(job.status).toBe('planned');expect(p.view.budget.spent).toBe(before.view.budget.spent)
 expect(courseWorkTarget(p,job.id,businessId)).toEqual({accountId:p.accountId,courseTarget,recordId:job.id})
 expect(sceneWorks(p).find(row=>row.id===job.id)).toMatchObject({accountId:p.accountId,courseTarget,recordId:job.id})
 for(const currentTarget of [courseTarget,target()]){
  const book=renderToStaticMarkup(<CoursePanel {...p} initialTarget={currentTarget} initialFocusId={job.id}/>)
  expect(book).toContain('href="#'+encodeURIComponent(job.id)+'"');expect(book).toContain('id="'+job.id+'"')
 }
 expect(h.controller.exportSaved()).toBe(raw)
})
