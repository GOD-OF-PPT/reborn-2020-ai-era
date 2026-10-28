import {quarterOf} from '../core/calendar.ts'
import type {GamePanelProps} from './game-types.ts'
import type {OpeningFocus,PlayerThreadView} from './player-thread.ts'
import {courseSceneProgress,courseTargetEntity,courseTargetReason,type CourseSceneTarget,type CourseSceneContext} from './course-scene-progress.ts'
import {courseCohortJob} from './course-cohort-progress.ts'

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
 if(t.kind==='audience')return v.audiences.find(a=>a.id===t.audienceId)?.job??null
 if(t.kind==='cohort'){const co=v.cohorts.find(co=>co.id===t.cohortId);return co&&t.jobId?courseCohortJob(v,co,t.jobId,courseSceneContext(p)):null}
 const id=t.kind==='outline'?v.outlines.find(o=>o.id===t.outlineId)?.jobId:t.kind==='license'?v.licenses.find(l=>l.id===t.licenseId)?.jobId:t.kind==='course'?t.sampleJobId??v.courses.find(c=>c.id===t.courseId)?.sampleJobId:null
 return p.view.operations?.jobs.find(j=>j.id===id&&j.businessId===t.businessId)??null
}
export function courseFocusQuarter(p:Input,f:CourseOpeningFocus):string|null{
 const t=f.courseTarget;if(!t)return p.features.workbench.quarter
 if(t.kind==='audience'){const a=p.features.course?.audiences.find(a=>a.id===t.audienceId);return a?quarterOf(a.createdAt):null}
 if(t.kind==='cohort'){const co=p.features.course?.cohorts.find(co=>co.id===t.cohortId),job=focusJob(p,f);const date=t.jobId?job?.startAt:co?.createdAt;return date?quarterOf(date):null}
 const job=focusJob(p,f),c=t.kind==='course'?p.features.course?.courses.find(c=>c.id===t.courseId):undefined,b=p.features.course?.businesses.find(b=>b.id===t.businessId)
 const date=t.kind==='course'&&t.sampleJobId===undefined?c?.createdAt:job?.startAt??b?.history[0]?.date
 return date?quarterOf(date):null
}
export function courseFocusOpen(p:Input,f:CourseOpeningFocus):boolean{
 const t=f.courseTarget;if(!t)return false
 const progress=courseSceneProgress(p.features.course,p.view.date,t,courseSceneContext(p))
 if(progress?.invalidReason||progress?.historical)return false
 if(progress?.command||progress?.wait)return true
 if(t.kind==='studio')return p.features.course?.businesses.some(b=>b.id===t.businessId&&['preparing','operating'].includes(b.lifecycle))??false
 if(t.kind==='course'&&p.features.course?.courses.some(c=>c.id===t.courseId&&['draft','building'].includes(c.status))&&p.features.course.businesses.some(b=>b.id===t.businessId&&b.lifecycle==='operating'))return true
 const job=focusJob(p,f);if(job)return ['planned','running'].includes(job.status)
 if(t.kind==='cohort')return p.features.course?.cohorts.some(co=>co.id===t.cohortId&&co.closedAt===null)??false
 return false
}
export function courseFocusResultDate(p:Input,f:CourseOpeningFocus):string|null{
 const job=focusJob(p,f);if(job)return job.status==='completed'?job.completeAt:job.releasedAt
 const t=f.courseTarget
 if(t?.kind==='audience')return p.features.course?.audiences.find(a=>a.id===t.audienceId)?.completedAt??null
 if(t?.kind==='cohort')return p.features.course?.cohorts.find(co=>co.id===t.cohortId)?.closedAt??null
 const b=t?p.features.course?.businesses.find(b=>b.id===t.businessId):undefined
 return b?.history.filter(h=>['operating','closed','winding_down'].includes(h.state)).at(-1)?.date??null
}
export function coursePlayerScene(p:Input,f:CourseOpeningFocus):Scene{
 const progress=courseSceneProgress(p.features.course,p.view.date,f.courseTarget,courseSceneContext(p))!,t=f.courseTarget,v=p.features.course
 const course=t&&(t.kind==='course'||t.kind==='audience'||t.kind==='cohort')?v?.courses.find(c=>c.id===t.courseId):undefined
 const cohort=t?.kind==='cohort'?v?.cohorts.find(co=>co.id===t.cohortId):undefined
 const object=course?course.name+(cohort?' · '+cohort.startAt+'班':t?.kind==='audience'?' · 本次原报价':t?.kind==='course'&&t.sampleJobId?progress.historical?' · 那次样课':' · 样课':' · 教案'):t?.kind==='outline'?'这间教室的教学大纲':t?.kind==='license'?'案例的课程使用范围':t?'桌边的教案':'桌上的课程准备资料'
 return {stage:progress.phase,object,title:progress.title,line:progress.line,detail:progress.choice.line,outcome:progress.outcome,resultRefs:progress.resultRefs,inspect:{screen:'course',label:progress.choice.label,target:{accountId:f.accountId,courseTarget:t,openRecord:true,...(progress.recordId?{recordId:progress.recordId}:{})}},...(progress.command?{command:{...progress.command,label:progress.choice.label}}:{}),...(progress.wait?{wait:progress.wait}:{})}
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
 if(kind==='CreateCourseAudience'){
  const a=added(before.audiences,v.audiences,a=>a.courseId===body.courseId&&a.mode===body.mode&&a.priceFen===body.priceFen),c=a?v.courses.find(c=>c.id===a.courseId):undefined
  if(a&&c)target={kind:'audience',businessId:c.businessId,courseId:c.id,audienceId:a.id}
 }
 if(kind==='PlanCourseCohort'){
  const co=added(before.cohorts,v.cohorts,co=>co.courseId===body.courseId&&co.audienceId===body.audienceId&&co.startAt===body.startAt&&co.endAt===body.endAt&&co.seatLimit===body.seatLimit&&co.promise===body.promise&&co.supportJobs.every(s=>s.mode===body.supportMode&&s.job?.startAt===body.supportStartAt)),c=co?v.courses.find(c=>c.id===co.courseId):undefined
  if(co&&c)target={kind:'cohort',businessId:c.businessId,courseId:c.id,cohortId:co.id}
 }
 if(['EnrollCourseAudience','RefundCourseLearners','StartCourseStage','StartCourseRecovery'].includes(kind)){
  const co=v.cohorts.find(co=>co.id===body.cohortId),old=before.cohorts.find(co=>co.id===body.cohortId),c=co?v.courses.find(c=>c.id===co.courseId):undefined
  if(co&&old&&c){
   if(kind==='StartCourseStage'||kind==='StartCourseRecovery'){
    const jobs=kind==='StartCourseStage'?co.stages.find(s=>s.index===body.index)?.attempts.filter(a=>!old.stages.some(s=>s.attempts.some(o=>o.jobId===a.jobId))).map(a=>a.jobId)??[]:co.supportJobs.filter(s=>s.recovery&&!old.supportJobs.some(o=>o.jobId===s.jobId)).map(s=>s.jobId)
    if(jobs.length===1)target={kind:'cohort',businessId:c.businessId,courseId:c.id,cohortId:co.id,jobId:jobs[0]!}
   }else{
    const changed=kind==='EnrollCourseAudience'?co.students.some(s=>!old.students.some(o=>o.id===s.id)):v.refunds.some(r=>r.cohortId===co.id&&!before.refunds.some(o=>o.id===r.id))
    if(changed){if(existing?.courseTarget?.kind==='cohort'&&existing.courseTarget.cohortId===co.id&&!resolveCourseFocus(previous,existing).reason)return existing;target={kind:'cohort',businessId:c.businessId,courseId:c.id,cohortId:co.id}}
   }
  }
 }
 if(['ActivateBusiness','PauseBusiness','ResumeBusiness','WindDownBusiness','CloseBusiness'].includes(kind)){
  const b=v.businesses.find(b=>b.id===body.businessId),old=before.businesses.find(b=>b.id===body.businessId)
  if(b&&old&&b.history.length===old.history.length+1&&b.history.at(-1)?.sourceId===last.commandId)target={kind:'studio',businessId:b.id}
 }
 if(['PauseNewEnrollment','ResumeCourseEnrollment','StopCourseSales','RetireCourse','StartCourseRefresh'].includes(kind)){
  const c=v.courses.find(c=>c.id===body.courseId),old=before.courses.find(o=>o.id===body.courseId)
  if(c&&old&&(c.status!==old.status||c.paused!==old.paused||kind==='StartCourseRefresh'&&c.refreshJobs.some(r=>!old.refreshJobs.some(o=>o.jobId===r.jobId)))){
   if(existing?.courseTarget&&'courseId' in existing.courseTarget&&existing.courseTarget.courseId===c.id&&!resolveCourseFocus(previous,existing).reason)return existing
   target={kind:'course',businessId:c.businessId,courseId:c.id}
  }
 }
 if(kind==='InterruptJob'||kind==='RescheduleJob'){
  const old=previous.view.operations?.jobs.find(j=>j.id===body.jobId),now=current.view.operations?.jobs.find(j=>j.id===body.jobId)
  if(!old||!now||JSON.stringify(old)===JSON.stringify(now))return null
  const o=v.outlines.find(o=>o.jobId===body.jobId),l=v.licenses.find(l=>l.jobId===body.jobId),c=v.courses.find(c=>c.sampleAttempts.includes(String(body.jobId)))
  if(o)target={kind:'outline',businessId:o.businessId,outlineId:o.id}
  else if(l)target={kind:'license',businessId:l.businessId,licenseId:l.id}
  else if(c)target={kind:'course',businessId:c.businessId,courseId:c.id,sampleJobId:String(body.jobId)}
  else {
   const cohorts=v.cohorts.filter(co=>co.stages.some(s=>s.attempts.some(a=>a.jobId===body.jobId))||co.supportJobs.some(s=>s.jobId===body.jobId)),co=cohorts[0],owner=co?v.courses.find(c=>c.id===co.courseId):undefined
   if(cohorts.length===1&&co&&owner)target={kind:'cohort',businessId:owner.businessId,courseId:owner.id,cohortId:co.id,jobId:String(body.jobId)}
   else {const a=v.audiences.find(a=>a.jobId===body.jobId),c=a?v.courses.find(c=>c.id===a.courseId):undefined;if(a&&c)target={kind:'audience',businessId:c.businessId,courseId:c.id,audienceId:a.id}}
  }
 }
 if(!target)return null
 const focus=courseFocusFor(current,target),matched=resolveCourseFocus(current,focus)
 return matched.reason?null:matched.focus
}
