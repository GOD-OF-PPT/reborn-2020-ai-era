import {quarterOf} from '../core/calendar.ts'
import type {GamePanelProps} from './game-types.ts'
import type {OpeningFocus,PlayerThreadView} from './player-thread.ts'
import {courseSceneProgress,courseTargetEntity,courseTargetReason,type CourseSceneTarget,type CourseSceneContext} from './course-scene-progress.ts'

type Input=Pick<GamePanelProps,'view'|'features'>
export type CourseOpeningFocus=Extract<OpeningFocus,{kind:'course'}>
type Scene=Pick<PlayerThreadView,'stage'|'object'|'title'|'line'|'detail'|'outcome'|'inspect'|'resultRefs'|'command'|'secondaryCommand'|'wait'>
export function courseSceneContext(p:Input):CourseSceneContext{return {operations:p.view.operations,preparationReady:p.features.workbench.routes.find(r=>r.id==='ai_course')?.requirements.preparationReady??false}}

export function courseFocusFor(p:Input,target:CourseSceneTarget|null=null,accountId?:string):CourseOpeningFocus{
 const business=target?p.features.course?.businesses.find(b=>b.id===target.businessId):undefined
 return {runId:p.view.runId,kind:'course',accountId:accountId??business?.accountId??'personal',entityId:target?courseTargetEntity(target):null,courseTarget:target,...(target?{businessId:target.businessId}:{})}
}
export function resolveCourseFocus(p:Input,f:CourseOpeningFocus):{focus:CourseOpeningFocus;reason:string|null}{
 const bad=(reason:string)=>({focus:f,reason}),t=f.courseTarget
 if(f.runId!==p.view.runId)return bad('这份课程关注来自另一段人生，请重新选择。')
 if(t===null)return f.entityId===null&&f.accountId==='personal'&&f.businessId===undefined?{focus:f,reason:null}:bad('课程入口没有实际工作室，不能绑定另一主体或课程。')
 const reason=courseTargetReason(p.features.course,t,courseSceneContext(p));if(reason)return bad(reason)
 const b=p.features.course!.businesses.find(b=>b.id===t.businessId)!,rows=p.view.operations?.businesses.filter(o=>o.id===b.id)??[]
 if(f.businessId!==t.businessId||b.accountId!==f.accountId||p.view.accounts.filter(a=>a.accountId===f.accountId).length!==1||rows.length!==1||rows[0]!.accountId!==b.accountId||rows[0]!.route!=='ai_course'||rows[0]!.definitionId!=='course-studio')return bad('原课程、工作室与账户不匹配，没有换到另一主体。')
 if(f.entityId!==courseTargetEntity(t))return bad('原课程关注与完整对象身份不一致，请重新选择。')
 return {focus:f,reason:null}
}
function focusJob(p:Input,f:CourseOpeningFocus){
 const v=p.features.course,t=f.courseTarget;if(!v||!t)return null
 const id=t.kind==='outline'?v.outlines.find(o=>o.id===t.outlineId)?.jobId:t.kind==='license'?v.licenses.find(l=>l.id===t.licenseId)?.jobId:t.kind==='course'?t.sampleJobId??v.courses.find(c=>c.id===t.courseId)?.sampleJobId:null
 return p.view.operations?.jobs.find(j=>j.id===id&&j.businessId===t.businessId)??null
}
export function courseFocusQuarter(p:Input,f:CourseOpeningFocus):string|null{
 const t=f.courseTarget;if(!t)return p.features.workbench.quarter
 const job=focusJob(p,f),c=t.kind==='course'?p.features.course?.courses.find(c=>c.id===t.courseId):undefined,b=p.features.course?.businesses.find(b=>b.id===t.businessId)
 const date=t.kind==='course'&&t.sampleJobId===undefined?c?.createdAt:job?.startAt??b?.history[0]?.date
 return date?quarterOf(date):null
}
export function courseFocusOpen(p:Input,f:CourseOpeningFocus):boolean{
 const t=f.courseTarget;if(!t)return false
 const job=focusJob(p,f);if(job)return ['planned','running'].includes(job.status)
 if(t.kind==='studio')return p.features.course?.businesses.some(b=>b.id===t.businessId&&b.lifecycle==='preparing')??false
 if(t.kind==='course')return p.features.course?.courses.some(c=>c.id===t.courseId&&c.status==='draft')??false
 return false
}
export function courseFocusResultDate(p:Input,f:CourseOpeningFocus):string|null{
 const job=focusJob(p,f);if(job)return job.status==='completed'?job.completeAt:job.releasedAt
 const t=f.courseTarget,b=t?p.features.course?.businesses.find(b=>b.id===t.businessId):undefined
 return b?.history.filter(h=>['operating','closed','winding_down'].includes(h.state)).at(-1)?.date??null
}
export function coursePlayerScene(p:Input,f:CourseOpeningFocus):Scene{
 const progress=courseSceneProgress(p.features.course,p.view.date,f.courseTarget,courseSceneContext(p))!,t=f.courseTarget,v=p.features.course
 const course=t?.kind==='course'?v?.courses.find(c=>c.id===t.courseId):undefined
 const object=course?course.name+(t?.kind==='course'&&t.sampleJobId?' · 这份原样课尝试':' · 原课程方案'):t?.kind==='outline'?'原工作室的这份教学大纲':t?.kind==='license'?'原案例的课程使用范围':t?'这间原课程工作室':'桌上的课程准备资料'
 return {stage:progress.phase,object,title:progress.title,line:progress.line,detail:progress.choice.line,outcome:progress.outcome,resultRefs:progress.resultRefs,inspect:{screen:'course',label:progress.choice.label,target:{accountId:f.accountId,courseTarget:t,openRecord:true}},...(progress.command?{command:{...progress.command,label:progress.choice.label}}:{}),...(progress.wait?{wait:progress.wait}:{})}
}

/** Only the committed original command may bind a new public preparation object. */
export function courseFocusFromSaved(previous:Input,current:Input,kind:string,body:Record<string,unknown>,existing?:CourseOpeningFocus|null):CourseOpeningFocus|null{
 const before=previous.features.course,v=current.features.course,last=current.view.receipts.at(-1)
 if(!v||!before||previous.view.runId!==current.view.runId||current.view.revision!==previous.view.revision+1||current.view.saveStatus!=='saved'||current.view.hasCandidate||current.view.readOnly||current.view.phase!=='playing'||last?.kind!==kind||last.revisionAfter!==current.view.revision)return null
 let target:CourseSceneTarget|null=null
 const added=<T extends {id:string}>(old:readonly T[],now:readonly T[],match:(row:T)=>boolean):T|null=>{const rows=now.filter(row=>!old.some(o=>o.id===row.id)&&match(row));return rows.length===1?rows[0]!:null}
 if(kind==='OpenCourseStudio'){const b=added(before.businesses,v.businesses,b=>b.definitionId==='course-studio');if(b)target={kind:'studio',businessId:b.id}}
 if(kind==='StartCourseOutline'){const o=added(before.outlines,v.outlines,o=>o.businessId===body.businessId);if(o)target={kind:'outline',businessId:o.businessId,outlineId:o.id}}
 if(kind==='LicenseCourseMaterials'){
  const l=added(before.licenses,v.licenses,l=>l.businessId===body.businessId&&l.caseId===body.caseId)
  if(l){
   const selected=existing?.courseTarget
   if(selected?.kind==='course'&&existing?.businessId===l.businessId&&!resolveCourseFocus(previous,existing).reason&&v.courses.some(c=>c.id===selected.courseId&&c.cases.some(ref=>ref.id===l.caseId&&ref.kind===body.caseKind)))return existing
   target={kind:'license',businessId:l.businessId,licenseId:l.id}
  }
 }
 if(kind==='DefineCourse'){const c=added(before.courses,v.courses,c=>c.businessId===body.businessId&&c.name===body.name&&c.productId===body.productId&&c.topicId===body.topicId&&c.edition===body.edition);if(c)target={kind:'course',businessId:c.businessId,courseId:c.id}}
 if(kind==='BuildCourseSample'){
  const c=v.courses.find(c=>c.id===body.courseId),old=before.courses.find(c=>c.id===body.courseId)
  if(c&&old&&c.sampleJobId!==null&&!old.sampleAttempts.includes(c.sampleJobId)&&c.sampleAttempts.includes(c.sampleJobId))target={kind:'course',businessId:c.businessId,courseId:c.id,sampleJobId:c.sampleJobId}
 }
 if(['ActivateBusiness','PauseBusiness','ResumeBusiness','WindDownBusiness','CloseBusiness'].includes(kind)){
  const b=v.businesses.find(b=>b.id===body.businessId),old=before.businesses.find(b=>b.id===body.businessId)
  if(b&&old&&b.history.length===old.history.length+1&&b.history.at(-1)?.sourceId===last.commandId)target={kind:'studio',businessId:b.id}
 }
 if(['PauseNewEnrollment','ResumeCourseEnrollment','StopCourseSales','RetireCourse','StartCourseRefresh'].includes(kind)){
  const c=v.courses.find(c=>c.id===body.courseId),old=before.courses.find(o=>o.id===body.courseId)
  if(c&&old&&(c.status!==old.status||c.paused!==old.paused||kind==='StartCourseRefresh'&&c.refreshJobs.some(r=>!old.refreshJobs.some(o=>o.jobId===r.jobId))))target={kind:'course',businessId:c.businessId,courseId:c.id}
 }
 if(kind==='InterruptJob'||kind==='RescheduleJob'){
  const old=previous.view.operations?.jobs.find(j=>j.id===body.jobId),now=current.view.operations?.jobs.find(j=>j.id===body.jobId)
  if(!old||!now||JSON.stringify(old)===JSON.stringify(now))return null
  const o=v.outlines.find(o=>o.jobId===body.jobId),l=v.licenses.find(l=>l.jobId===body.jobId),c=v.courses.find(c=>c.sampleAttempts.includes(String(body.jobId)))
  if(o)target={kind:'outline',businessId:o.businessId,outlineId:o.id}
  else if(l)target={kind:'license',businessId:l.businessId,licenseId:l.id}
  else if(c)target={kind:'course',businessId:c.businessId,courseId:c.id,sampleJobId:String(body.jobId)}
 }
 if(!target)return null
 const focus=courseFocusFor(current,target),matched=resolveCourseFocus(current,focus)
 return matched.reason?null:matched.focus
}
