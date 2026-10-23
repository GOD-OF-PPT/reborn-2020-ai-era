import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {dayBefore,quarterLimit} from '../core/operations-calendar.ts'
import {addDays} from '../core/calendar.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {CoursePanel,coursePanelContext,courseRecordChoices,courseRecordSelection,courseTargetLocation,courseDraftScopeForTarget} from './CoursePanel.tsx'
import {CourseSceneChoice,courseDraftCommand} from './CourseSceneChoice.tsx'
import {courseWorkTarget,sceneWorks} from './SceneJournal.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {courseSceneProgress,type CourseSceneTarget} from './course-scene-progress.ts'
import {createCourseSceneDraftMemory,emptyCourseSceneDraft,type CourseSceneDraftSlot,type CourseDraftCase} from './course-scene-draft.ts'
import beforeStudio from '../../goal-1/evidence/t17-acceptance-16/normal-before-course-studio.json?raw'
import beforeLicense from '../../goal-1/evidence/t17-acceptance-16/chrome-production-r6/licensed-case-prefix-text-before-import.json?raw'

const eventHooks=vi.hoisted(()=>({enabled:false,values:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{
  if(!eventHooks.enabled)return actual.useState<T>(initial)
  const index=eventHooks.index++
  if(!(index in eventHooks.values))eventHooks.values[index]=typeof initial==='function'?(initial as ()=>T)():initial
  return [eventHooks.values[index] as T,(next:T|((previous:T)=>T))=>{eventHooks.values[index]=typeof next==='function'?(next as (previous:T)=>T)(eventHooks.values[index] as T):next}] as const
 }
 return {...actual,useState:state,useRef:<T,>(initial:T)=>eventHooks.enabled?state(()=>({current:initial}))[0]:actual.useRef(initial),useId:()=>eventHooks.enabled?'course-inspect-step':actual.useId(),useEffect:(effect:()=>void|(()=>void),deps?:readonly unknown[])=>{if(!eventHooks.enabled)actual.useEffect(effect,deps)}}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(value:unknown):Element[]=>Array.isArray(value)?value.flatMap(elements):isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children),...elements(value.props.footer)]:[]
const text=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''

const noRequest=()=>{throw Error('LOCATING_A_COURSE_MUST_NOT_SUBMIT_OR_RESELECT')}
async function normal(raw:string,name:string){
 const codec=createCampaignCodec(),factory=new IDBFactory(),store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 expect(codec.import(raw).origin).toBe('normal')
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++id)})
 await controller.initialize();await controller.importNew(raw)
 const p=():GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:noRequest}}
 const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')
 const until=async(date:string,done:()=>boolean)=>{for(let n=0;n<40;n++){
  if(done())return
  const {view,features}=p(),limit=quarterLimit(view.date)
  if(features.workbench.pause)throw Error('UNEXPECTED_PUBLIC_PAUSE:'+features.workbench.pause.reason)
  await send('AdvanceTime',{date:date<limit?date:view.date===dayBefore(limit)?limit:dayBefore(limit)})
 }throw Error('NORMAL_COURSE_DATE_GUARD')}
 return {codec,store,controller,p,send,until}
}

let prepared:Awaited<ReturnType<typeof normal>>|undefined
let businessId='',courseA='',courseB='',oldSample='',newSample='',outlineId=''
let activation:{valid:string;wrong:string;rawSame:boolean}|undefined
beforeAll(async()=>{
 const h=prepared=await normal(beforeStudio,'c1-book-normal')
 await h.send('OpenCourseStudio',{capitalFen:500000})
 businessId=h.p().features.course!.businesses[0]!.id
 await h.send('StartCourseOutline',{businessId,resources:['player-production'],startAt:h.p().view.date})
 outlineId=h.p().features.course!.outlines[0]!.id
 const outline=h.p().features.course!.outlines[0]!
 await h.until(outline.job!.completeAt,()=>h.p().features.course!.outlines[0]!.job?.status==='completed')
 const current=h.p(),business=current.features.course!.businesses[0]!,target:CourseSceneTarget={kind:'studio',businessId}
 expect(business.accountId).not.toBe('personal')
 expect(h.controller.preview(h.controller.prepare('ActivateBusiness',{businessId})).allowed).toBe(true)
 expect(courseSceneProgress(current.features.course,current.view.date,target,{operations:current.view.operations})?.command?.kind).toBe('ActivateBusiness')
 const before=h.controller.exportSaved(),render=(accountId:string)=>renderToStaticMarkup(<NarrativeScene {...current} accountId={accountId} screen="course" courseTarget={target} headingRef={null} personId="tang-ying" onPerson={noRequest} onOpen={noRequest} onPeople={noRequest} onYear={noRequest} onNavigate={noRequest} receipt={null}/>)
 activation={valid:render(business.accountId),wrong:render('personal'),rawSame:h.controller.exportSaved()===before}
 await h.send('ActivateBusiness',{businessId})
 const ref=h.p().features.course!.cases.find(ref=>!ref.licensed)!
 for(const name of ['指定的原课程甲','另一份课程乙'])await h.send('DefineCourse',{businessId,name,productId:'intro_recorded',topicId:'image_workflows',edition:'foundation',segment:'ai_learners',cases:[{kind:ref.kind,id:ref.id}],consent:true})
 const [firstCourse,secondCourse]=h.p().features.course!.courses
 if(!firstCourse||!secondCourse)throw Error('TWO_REAL_COURSES_REQUIRED')
 courseA=firstCourse.id;courseB=secondCourse.id
 await h.send('BuildCourseSample',{courseId:courseA,resources:['player-production'],startAt:h.p().view.date})
 oldSample=h.p().features.course!.courses.find(c=>c.id===courseA)!.sampleJobId!
 await h.send('InterruptJob',{jobId:oldSample})
 await h.until('2023-01-01',()=>h.p().view.date==='2023-01-01'&&h.p().features.workbench.quarter==='2023-Q1')
 await h.send('BuildCourseSample',{courseId:courseA,resources:['player-production'],startAt:h.p().view.date})
 newSample=h.p().features.course!.courses.find(c=>c.id===courseA)!.sampleJobId!
},20000)
afterAll(async()=>{await prepared?.controller.close();await prepared?.store.close()})
const current=()=>{if(!prepared)throw Error('NORMAL_PREFIX_REQUIRED');const p=prepared.p(),b=p.features.course!.businesses.find(b=>b.id===businessId)!;return {...p,accountId:b.accountId}}

it('keeps an explicitly targeted course and rejects missing or cross-account records before showing executable forms',()=>{
 const p=current(),before=p.controller.exportSaved(),target:CourseSceneTarget={kind:'course',businessId,courseId:courseB},context={operations:p.view.operations}
 expect(courseTargetLocation(p.features.course,target,context)).toEqual({businessId,focusId:courseB+'-course'})
 const html=renderToStaticMarkup(<CoursePanel {...p} initialTarget={target} onTargetChange={noRequest}/>)
 expect(html).toContain('href="#'+encodeURIComponent(courseB+'-course')+'"');expect(html).toContain('id="'+courseB+'-course"')
 const invalid:CourseSceneTarget[]=[{kind:'studio',businessId:'missing-studio'},{...target,businessId:'another-studio'},{...target,courseId:'missing-course'},{...target,sampleJobId:newSample},{kind:'outline',businessId,outlineId:'missing-outline'},{kind:'license',businessId,licenseId:'missing-license'}]
 for(const target of invalid){
  const blocked=renderToStaticMarkup(<CoursePanel {...p} initialTarget={target} onTargetChange={noRequest}/>)
  expect(blocked).toContain('先找回原来的课程准备')
  for(const label of ['以自有资金准备课程工作室','制作实际样课与案例说明','建立课程方案，尚不招生','安排课程素材使用范围'])expect(blocked).not.toContain(label)
 }
 for(const accountId of ['personal','missing-account']){
  const wrong=renderToStaticMarkup(<CoursePanel {...p} accountId={accountId} initialTarget={target} onTargetChange={noRequest}/>)
  expect(wrong).toContain('先找回原来的课程准备');expect(wrong).not.toContain('制作实际样课与案例说明')
 }
 const entry=renderToStaticMarkup(<CoursePanel {...p} accountId="personal" initialTarget={null} onTargetChange={noRequest}/>)
 expect(entry).toContain('准备课程工作室');expect(entry).not.toContain('制作实际样课与案例说明')
 const unknown=renderToStaticMarkup(<CoursePanel {...p} accountId="missing-account" initialTarget={null} onTargetChange={noRequest}/>)
 expect(unknown).toContain('原账户已不可用');expect(unknown).not.toContain('以自有资金准备课程工作室')
 const key=coursePanelContext(p.view.runId,p.accountId,target)
 expect(CoursePanel({...p,initialTarget:target}).key).toBe(key)
 expect(coursePanelContext('other-run',p.accountId,target)).not.toBe(key)
 expect(coursePanelContext(p.view.runId,p.accountId,{...target,courseId:courseA})).not.toBe(key)
 expect(p.controller.exportSaved()).toBe(before)
})

it('previews and cancels a different original course without changing the confirmed target, draft or game bytes',()=>{
 const p=current(),before=p.controller.exportSaved(),target:CourseSceneTarget={kind:'course',businessId,courseId:courseA},context={operations:p.view.operations},choice=courseRecordChoices(p.features.course,p.accountId,context).find(row=>row.target.kind==='course'&&row.target.courseId===courseB&&!row.target.sampleJobId)!
 const original={target,draftId:null},preview=courseRecordSelection(p.features.course,p.accountId,original,{type:'preview',id:choice.id},context),cancelled=courseRecordSelection(p.features.course,p.accountId,preview,{type:'cancel'},context)
 expect(preview.target).toBe(target);expect(cancelled).toEqual(original);expect(cancelled.target).toBe(target)
 expect(courseRecordSelection(p.features.course,'missing-account',preview,{type:'confirm'},context)).toBe(preview)
 expect(courseRecordSelection(p.features.course,p.accountId,preview,{type:'confirm'},context).target).toEqual(choice.target)
 const memory=createCourseSceneDraftMemory(p.view.runId),scope={accountId:p.accountId,businessId,courseId:null,slot:'definition' as const},draft={...emptyCourseSceneDraft(),name:'从原册回来仍保留的方案',productId:'practical_cohort',topicId:'image_workflows',segment:'ai_learners',consent:true,cases:[...p.features.course!.courses[0]!.cases],resources:['player-production'],startAt:'2023-01-21'}
 memory.write(p.view.runId,scope,draft)
 const props={...p,courseDraftMemory:memory},first=renderToStaticMarkup(<CoursePanel {...props} initialTarget={{kind:'studio',businessId}}/>),returned=renderToStaticMarkup(<CoursePanel {...props} initialTarget={{kind:'studio',businessId}}/>)
 expect(first).toContain('value="从原册回来仍保留的方案"');expect(returned).toContain('value="2023-01-21"')
 expect(memory.read(p.view.runId,scope)).toEqual(draft);expect(p.controller.exportSaved()).toBe(before)
})

it('maps original outline and sample job identities and shows an older sample attempt without substituting the current job',()=>{
 const p=current(),before=p.controller.exportSaved(),outline=p.features.course!.outlines.find(o=>o.id===outlineId)!,oldTarget:CourseSceneTarget={kind:'course',businessId,courseId:courseA,sampleJobId:oldSample},newTarget:CourseSceneTarget={kind:'course',businessId,courseId:courseA,sampleJobId:newSample}
 expect(oldSample).not.toBe(newSample)
 expect(courseWorkTarget(p,outline.jobId,businessId)).toEqual({accountId:p.accountId,courseTarget:{kind:'outline',businessId,outlineId}})
 expect(courseWorkTarget(p,oldSample,businessId)).toEqual({accountId:p.accountId,courseTarget:oldTarget})
 expect(sceneWorks(p).find(row=>row.id===newSample)).toMatchObject({screen:'course',accountId:p.accountId,courseTarget:newTarget})
 expect(sceneWorks(p).some(row=>row.id===oldSample)).toBe(false)
 expect(courseWorkTarget(p,newSample,'another-business')).toBeNull();expect(courseWorkTarget(p,'missing-job',businessId)).toBeNull()
 const old=renderToStaticMarkup(<CoursePanel {...p} initialTarget={oldTarget} onTargetChange={noRequest}/>)
 expect(old).toContain('id="'+oldSample+'"');expect(old).toContain('没有换成后来的一次样课');expect(old).not.toContain('制作实际样课与案例说明')
 expect(courseTargetLocation(p.features.course,oldTarget)).toBeNull()
 const outlineBook=renderToStaticMarkup(<CoursePanel {...p} initialTarget={{kind:'outline',businessId,outlineId}} onTargetChange={noRequest}/>)
 expect(outlineBook).toContain('href="#'+encodeURIComponent(outlineId)+'"');expect(outlineBook).toContain('id="'+outlineId+'"');expect(outlineBook).toContain('id="'+outline.jobId+'"')
 expect(outlineBook).not.toContain('补齐教学大纲与营业准备 · 1点/100元/7天')
 expect(p.controller.exportSaved()).toBe(before)
})

it('renders activation only for the actual company account while explaining a mismatched personal view',()=>{
 expect(activation).toBeDefined()
 expect(activation!.valid).toContain('command scene-decision-main')
 expect(activation!.wrong).toContain('当前查看账户不一致');expect(activation!.wrong).not.toContain('command scene-decision-main')
 expect(activation!.rawSame).toBe(true)
})

it('keeps a normal licensed-case definition draft and original bytes through a real head-write abort and exact retry',async()=>{
 const codec=createCampaignCodec(),run=codec.import(beforeLicense),factory=new IDBFactory(),name='c1-book-licence-abort',store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 expect(run.origin).toBe('normal')
 await store.importSave(beforeLicense,{mode:'create',actorId:'player',importId:'c1-book-original-licence'})
 const fault=abortAfterHeadWrite(factory,name),failing=new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name}),controller=new GameController({codec,store:failing,locks:new MemoryWriterAccess(),id:()=> 'c1-book-same-licence'})
 try{
  await controller.initialize();await controller.continueLife(run.runId)
  const p=():GamePanelProps=>{const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,b=features.course!.businesses.find(b=>b.lifecycle==='operating')!;return {controller,view,features,accountId:b.accountId,request:noRequest}},before=p(),b=before.features.course!.businesses.find(b=>b.lifecycle==='operating')!,ref=before.features.course!.cases.find(ref=>ref.licensed)!,memory=createCourseSceneDraftMemory(run.runId),scope={accountId:b.accountId,businessId:b.id,courseId:null,slot:'definition' as const},draft={...emptyCourseSceneDraft(),name:'授权安排后继续准备的同一堂课',productId:'practical_cohort',topicId:'image_workflows',segment:'ai_learners',cases:[{kind:'video' as const,id:ref.id}],resources:['player-production'],startAt:'2023-01-20',consent:true}
  memory.write(run.runId,scope,draft)
  const raw=controller.exportSaved(),command=controller.prepare('LicenseCourseMaterials',{businessId:b.id,caseKind:ref.kind,caseId:ref.id,resources:['player-production'],startAt:before.view.date})
  expect(controller.preview(command).allowed).toBe(true);expect((await controller.submit(command)).status).toBe('unsaved')
  expect(controller.exportSaved()).toBe(raw);expect(codec.export((await store.load(run.runId))!.run)).toBe(raw)
  const failed=renderToStaticMarkup(<CoursePanel {...p()} courseDraftMemory={memory} initialTarget={{kind:'studio',businessId:b.id}} onTargetChange={noRequest}/>)
  expect(failed).toContain('value="授权安排后继续准备的同一堂课"');expect(failed).toContain('value="2023-01-20"');expect(memory.read(run.runId,scope)).toEqual(draft)
  const candidate=controller.exportCandidate();expect((await controller.retry()).status).toBe('saved');expect(controller.exportSaved()).toBe(candidate);expect(codec.export((await store.load(run.runId))!.run)).toBe(candidate)
  const license=p().features.course!.licenses.at(-1)!,target:CourseSceneTarget={kind:'license',businessId:b.id,licenseId:license.id}
  expect(courseWorkTarget(p(),license.jobId,b.id)).toEqual({accountId:b.accountId,courseTarget:target})
  const saved=renderToStaticMarkup(<CoursePanel {...p()} courseDraftMemory={memory} initialTarget={target} onTargetChange={noRequest}/>)
  expect(saved).toContain('id="'+license.id+'"');expect(memory.read(run.runId,scope)).toEqual(draft)
  const readonly=renderToStaticMarkup(<CoursePanel {...p()} view={{...p().view,readOnly:true}} courseDraftMemory={memory} initialTarget={target}/>)
  expect(readonly).toContain('id="'+license.id+'"');expect(readonly).toContain('disabled=""');expect(controller.exportSaved()).toBe(candidate)
  expect(fault.trace).toMatchObject({writeSucceeded:true,abortIssued:true})
 }finally{await controller.close();await store.close();await failing.close()}
},20000)

it('keeps the current sample record reachable after its real completion instead of losing the job anchor',async()=>{
 if(!prepared)throw Error('NORMAL_PREFIX_REQUIRED')
 const h=prepared,job=h.p().view.operations!.jobs.find(j=>j.id===newSample)!
 await h.until(job.completeAt,()=>h.p().features.course!.courses.find(c=>c.id===courseA)?.status==='ready')
 const p=current(),raw=p.controller.exportSaved(),target:CourseSceneTarget={kind:'course',businessId,courseId:courseA,sampleJobId:newSample}
 expect(p.view.operations!.jobs.find(j=>j.id===newSample)?.status).toBe('completed')
 const book=renderToStaticMarkup(<CoursePanel {...p} initialTarget={target} onTargetChange={noRequest}/>)
 expect(book).toContain('原样课任务记录');expect(book).toContain('id="'+newSample+'"');expect(book).toContain('href="#'+encodeURIComponent(newSample)+'"')
 expect(p.controller.exportSaved()).toBe(raw)
})

it('carries the pending licence step from the actual scene handler to the original book without borrowing the sample draft',async()=>{
 const h=await normal(beforeLicense,'c1-book-pending-licence')
 try{
  const initial=h.p(),b=initial.features.course!.businesses.find(b=>b.lifecycle==='operating')!,source=initial.features.course!.cases.find(ref=>ref.licensed)!
  const ref:CourseDraftCase={kind:'video',id:source.id}
  expect(source.kind).toBe('video')
  await h.send('DefineCourse',{businessId:b.id,name:'待独立素材许可的这堂课',productId:'practical_cohort',topicId:'image_workflows',edition:'foundation',segment:'ai_learners',cases:[ref],consent:true})
  const current=h.p(),course=current.features.course!.courses.at(-1)!,target:CourseSceneTarget={kind:'course',businessId:b.id,courseId:course.id},memory=createCourseSceneDraftMemory(current.view.runId),slot:CourseSceneDraftSlot=`license:video:${ref.id}`,scope={accountId:b.accountId,businessId:b.id,courseId:null,slot},future=addDays(current.view.date,10),otherFuture=addDays(current.view.date,20),draft={...emptyCourseSceneDraft(),resources:['player-production'],startAt:future}
  memory.write(current.view.runId,scope,draft)
  const sampleScope={accountId:b.accountId,businessId:b.id,courseId:course.id,slot:'sample' as const},sample={...draft,startAt:otherFuture};memory.write(current.view.runId,sampleScope,sample)
  const p:GamePanelProps={...current,accountId:b.accountId,courseDraftMemory:memory},raw=h.controller.exportSaved(),captured:{target:CourseSceneTarget|null|undefined;slot:CourseSceneDraftSlot|undefined}={target:undefined,slot:undefined}
  eventHooks.enabled=true;eventHooks.values=[]
  let tree:ReturnType<typeof CourseSceneChoice>|null=null
  const chosen:(CourseSceneTarget|null)[]=[]
  const render=()=>{eventHooks.index=0;tree=CourseSceneChoice({p,target,onTarget:next=>{chosen.push(next)},onInspect:(next,step)=>{captured.target=next;captured.slot=step}})}
  const click=(label:string)=>{const button=elements(tree).find(e=>e.type==='button'&&text(e.props.children).includes(label)),handler=button?.props.onClick;if(typeof handler!=='function')throw Error('VISIBLE_STEP_BUTTON_REQUIRED:'+label);handler();render()}
  render();click('走近这份教案')
  expect(elements(tree).find(e=>typeof e.type==='function'&&e.type.name==='Dialog')?.props.title).toBe('这份案例，能用于这一堂课吗？')
  expect(text(tree)).toContain('案例1 · '+source.label)
  const fields=elements(tree).find(e=>typeof e.type==='function'&&e.type.name==='ScheduleFields')
  expect(fields?.props.draft).toEqual(draft)
  expect(fields?.props.p).toBe(p)
  expect(elements(tree).find(e=>e.props.kind==='LicenseCourseMaterials')?.props.payload).toEqual({businessId:b.id,caseKind:'video',caseId:ref.id,resources:['player-production'],startAt:future})
  expect(chosen).toEqual([])
  expect(h.p().view.accounts).toEqual(current.view.accounts);expect(h.p().view.budget).toEqual(current.view.budget);expect(h.p().view.revision).toBe(current.view.revision);expect(h.controller.exportSaved()).toBe(raw)
  click('翻看课程、资金与全部责任')
  expect(captured).toEqual({target,slot})
  eventHooks.enabled=false
  const parsed=courseDraftCommand(p,draft,'license',target,ref)
  expect(parsed?.payload).toMatchObject({businessId:b.id,caseKind:'video',caseId:ref.id,resources:['player-production'],startAt:future})
  const book=renderToStaticMarkup(<CoursePanel {...p} initialTarget={target} initialDraftSlot={slot} onTargetChange={noRequest}/>)
  const anchor=b.id+'-license-draft-video-'+ref.id
  expect(book).toContain('id="'+anchor+'"');expect(book).toContain('href="#'+encodeURIComponent(anchor)+'"')
  expect(book).toContain('value="'+future+'"');expect(book).not.toContain('value="'+otherFuture+'"');expect(book).toContain('当前这份许可草稿')
  for(const invalidSlot of [`license:video:missing-case` as CourseSceneDraftSlot,'entry' as const,'outline' as const,'definition' as const]){
   const rejected=renderToStaticMarkup(<CoursePanel {...p} initialTarget={target} initialDraftSlot={invalidSlot} onTargetChange={noRequest}/>)
   expect(rejected).toContain('先找回原来的课程准备');expect(rejected).not.toContain('制作实际样课与案例说明')
  }
  expect(courseDraftScopeForTarget(p.features.course,{kind:'studio',businessId:b.id},b.accountId,'sample',{operations:p.view.operations}).invalidReason).not.toBeNull()
  expect(memory.read(p.view.runId,scope)).toEqual(draft);expect(memory.read(p.view.runId,sampleScope)).toEqual(sample);expect(h.controller.exportSaved()).toBe(raw)
 }finally{eventHooks.enabled=false;eventHooks.values=[];await h.controller.close();await h.store.close()}
},20000)
