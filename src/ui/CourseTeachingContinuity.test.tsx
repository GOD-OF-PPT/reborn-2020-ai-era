import {expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import {courseFocusFor} from './course-player-thread.ts'
import {playerThread} from './player-thread.ts'
import {CourseEncounter} from './CourseEncounter.tsx'
import {CourseThreadAction} from './CourseThreadAction.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {isCourseContinuityThread,isCoursePreparationThread} from './course-continuity.ts'
import {todayThread} from './today-thread.ts'
import {dayPerspectiveCurrent} from './day-perspective.ts'
import {courseTeachingMoneyFor,courseTeachingClosureFor} from './course-teaching-continuity.ts'
import audienceRaw from '../../goal-1/evidence/t17-acceptance-25/chrome-r2/c2-saved90-audience-completed.json?raw'
import closedRaw from '../../goal-1/evidence/t17-acceptance-25/chrome-r4/c2-r4-saved117-closed.json?raw'
import enrolledRaw from '../../goal-1/evidence/t17-acceptance-25/chrome-r3/c2-saved92-enrolled-protected.json?raw'
import refundedRaw from '../../goal-1/evidence/t17-acceptance-32/chrome-main-r8/r8-saved95-half-refund-paid.json?raw'
import actualClosedRaw from '../../goal-1/evidence/t17-acceptance-32/chrome-main-r9/r9-saved120-class-actually-closed.json?raw'

type Element=ReactElement<Record<string,unknown>>
const elements=(node:unknown):Element[]=>Array.isArray(node)?node.flatMap(elements):isValidElement<Record<string,unknown>>(node)?[node,...elements(node.props.children)]:[]
async function original(raw:string,name:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u3c2-shared-'+name})
 let sequence=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>name+'-'+(++sequence)})
 await controller.initialize();await controller.importNew(raw)
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,lesson=features.course!.courses[0]!,business=features.course!.businesses.find(b=>b.id===lesson.businessId)!
 const p:GamePanelProps={controller,view,features,accountId:business.accountId,request:vi.fn()}
 return {controller,p,lesson,close:async()=>{await controller.close();await store.close()}}
}
function shared(p:GamePanelProps,target:CourseSceneTarget){
 const thread=playerThread(p,courseFocusFor(p,target)),choose=vi.fn(),result=vi.fn(),today=vi.fn()
 expect(isCourseContinuityThread(thread)).toBe(true);expect(isCoursePreparationThread(thread)).toBe(false)
 const encounter=CourseEncounter({p,thread,date:null,waitLabel:'',onChoose:choose,onResult:result,onToday:today})
 if(!isValidElement<ComponentProps<typeof CourseThreadAction>>(encounter))throw Error('ORIGINAL_ACTION_REQUIRED')
 const tree=CourseThreadAction(encounter.props),rows=elements(tree),button=rows.find(e=>e.type==='button'),paper=rows.find(e=>e.type===OpeningObject)
 if(!button||!paper)throw Error('SHARED_THOUGHT_AND_PAPER_REQUIRED')
 expect(button.props.onClick).toBe(paper.props.onActivate)
 return {thread,button,paper,choose,result,today}
}

it('opens the same original audience commitment from the thought and paper without arranging a class',async()=>{
 const f=await original(audienceRaw,'audience')
 try{
  const a=f.p.features.course!.audiences[0]!,target:CourseSceneTarget={kind:'audience',businessId:f.lesson.businessId,courseId:f.lesson.id,audienceId:a.id},raw=f.controller.exportSaved(),ui=shared(f.p,target)
  expect(ui.thread.stage).toBe('course-audience-ready')
  ;(ui.button.props.onClick as ()=>void)();(ui.paper.props.onActivate as ()=>void)()
  expect(ui.choose).toHaveBeenCalledTimes(2);expect(ui.result).not.toHaveBeenCalled();expect(f.p.request).not.toHaveBeenCalled();expect(f.controller.exportSaved()).toBe(raw)
 }finally{await f.close()}
})

it('takes a truly closed class to today and refuses an old binding after an actual save',async()=>{
 const f=await original(closedRaw,'closed')
 try{
  const co=f.p.features.course!.cohorts.find(c=>c.closedAt!==null)!,target:CourseSceneTarget={kind:'cohort',businessId:f.lesson.businessId,courseId:co.courseId,cohortId:co.id},raw=f.controller.exportSaved(),ui=shared(f.p,target)
  expect(ui.thread.stage).toBe('course-cohort-closed')
  expect(courseTeachingMoneyFor(f.p,target)).toBe('累计预款¥4,995 · 仍受保护¥0 · 教学收入¥4,995')
  ;(ui.paper.props.onActivate as ()=>void)();expect(ui.today).toHaveBeenCalledTimes(1);expect(ui.result).not.toHaveBeenCalled();expect(ui.choose).not.toHaveBeenCalled();expect(f.controller.exportSaved()).toBe(raw)
  const command=f.controller.prepare('AdvanceTime',{date:f.p.features.workbench.progression.nextDate})
  expect((await f.controller.submit(command)).status).toBe('saved')
  ;(ui.button.props.onClick as ()=>void)();expect(ui.today).toHaveBeenCalledTimes(1);expect(ui.result).not.toHaveBeenCalled()
 }finally{await f.close()}
})

it('keeps a completed teaching attempt attached to its class until the player explicitly chooses the current class',async()=>{
 const f=await original(closedRaw,'attempt')
 try{
  const co=f.p.features.course!.cohorts[0]!,job=co.stageJobs.flat().find(j=>j?.status==='completed')!,target:CourseSceneTarget={kind:'cohort',businessId:f.lesson.businessId,courseId:co.courseId,cohortId:co.id,jobId:job.id},raw=f.controller.exportSaved(),ui=shared(f.p,target)
  expect(ui.thread.focusScope).toBe('history');expect(ui.thread.resultRefs.some(r=>r.kind==='job'&&r.id===job.id)).toBe(true)
  expect(courseTeachingMoneyFor(f.p,target)).toBeNull()
  ;(ui.paper.props.onActivate as ()=>void)();expect(ui.result).toHaveBeenCalledTimes(1);expect(ui.today).not.toHaveBeenCalled();expect(ui.choose).not.toHaveBeenCalled();expect(f.controller.exportSaved()).toBe(raw)
 }finally{await f.close()}
})

it('keeps an unfinished class reachable from Today and distinguishes a saved new student commitment from waiting',async()=>{
 const f=await original(enrolledRaw,'today-class')
 try{
  const co=f.p.features.course!.cohorts.find(c=>c.closedAt===null&&c.students.length>0)!,target:CourseSceneTarget={kind:'cohort',businessId:f.lesson.businessId,courseId:co.courseId,cohortId:co.id},focus=courseFocusFor(f.p,target),raw=f.controller.exportSaved()
  const today=todayThread(f.p,focus)
  expect(courseTeachingMoneyFor(f.p,target)).toBe('累计预款¥4,995 · 仍受保护¥4,995 · 教学收入¥0')
  expect(today).not.toBeNull();expect(today!.ongoing.some(item=>item.focus.kind==='course'&&item.focus.courseTarget?.kind==='cohort'&&item.focus.courseTarget.cohortId===co.id)).toBe(true)
  const enrolled=f.p.view.receipts.findLast(r=>r.kind==='EnrollCourseAudience')!
  expect(dayPerspectiveCurrent(f.p.view,{runId:f.p.view.runId,revision:enrolled.revisionAfter-1})).toBe(false)
  expect(dayPerspectiveCurrent(f.p.view,{runId:f.p.view.runId,revision:enrolled.revisionAfter})).toBe(true)
  expect(f.p.request).not.toHaveBeenCalled();expect(f.controller.exportSaved()).toBe(raw)
 }finally{await f.close()}
})

it('keeps a real paid refund visible beside cumulative tuition, protection and earned income after importing the saved class',async()=>{
 const f=await original(refundedRaw,'paid-refund')
 try{
  const co=f.p.features.course!.cohorts.find(c=>c.closedAt===null&&c.students.length===5)!,target:CourseSceneTarget={kind:'cohort',businessId:f.lesson.businessId,courseId:co.courseId,cohortId:co.id},raw=f.controller.exportSaved()
  expect(co.students.filter(s=>s.paidRemainingFen>0)).toHaveLength(4)
  expect(courseTeachingMoneyFor(f.p,target)).toBe('累计预款¥995 · 已实际退¥199 · 仍受保护¥398 · 教学收入¥398')
  expect(courseTeachingClosureFor(f.p,target)).toBeNull()
  expect(f.p.request).not.toHaveBeenCalled();expect(f.controller.exportSaved()).toBe(raw)
 }finally{await f.close()}
})

it('summarizes only a truly settled class and keeps a historical teaching attempt separate from its later closure',async()=>{
 const f=await original(actualClosedRaw,'settled-copy')
 try{
  const co=f.p.features.course!.cohorts[0]!,target:CourseSceneTarget={kind:'cohort',businessId:f.lesson.businessId,courseId:co.courseId,cohortId:co.id},raw=f.controller.exportSaved(),copy=courseTeachingClosureFor(f.p,target)
  expect(co.closedAt).toBe('2023-04-30');expect(copy?.line).toBe('本班于2023-04-30实际结清。')
  expect(copy?.terms).toContain('留存4/5人');expect(copy?.terms).toContain('结算费实付¥39.80')
  expect(copy?.originalEcho).toContain(co.startAt+'班已于'+co.closedAt+'实际结清')
  const job=co.stageJobs.flat().find(j=>j?.status==='completed')!
  expect(courseTeachingClosureFor(f.p,{...target,jobId:job.id})).toBeNull()
  expect(courseTeachingMoneyFor(f.p,target)).toBe('累计预款¥995 · 已实际退¥199 · 仍受保护¥0 · 教学收入¥796')
  expect(f.controller.exportSaved()).toBe(raw);expect(f.p.request).not.toHaveBeenCalled()
 }finally{await f.close()}
})

it('puts a stopped teaching decision before its remaining wait, without advancing or submitting anything',async()=>{
 const f=await original(enrolledRaw,'stopped-priority')
 try{
  const co=f.p.features.course!.cohorts[0]!,target:CourseSceneTarget={kind:'cohort',businessId:f.lesson.businessId,courseId:co.courseId,cohortId:co.id},base=playerThread(f.p,courseFocusFor(f.p,target)),result=vi.fn(),choose=vi.fn(),raw=f.controller.exportSaved()
  // UI policy boundary: this input is not a newly accepted stopped game history.
  // The real engine may retain a closing wait after teaching has stopped.
  const thread={...base,stage:'course-teaching-cancelled',outcome:'non-success' as const,wait:{date:'2023-05-05',label:'等退款窗口后的结算'}}
  const node=CourseThreadAction({p:f.p,thread,active:true,date:'2023-05-05',waitLabel:thread.wait.label,onChoose:choose,onResult:result,onToday:vi.fn(),children:primary=>primary?.main})
  const button=elements(node).find(e=>e.type==='button')!
  ;(button.props.onClick as ()=>void)();expect(result).toHaveBeenCalledTimes(1);expect(choose).not.toHaveBeenCalled();expect(f.p.request).not.toHaveBeenCalled();expect(f.controller.exportSaved()).toBe(raw)
 }finally{await f.close()}
})
