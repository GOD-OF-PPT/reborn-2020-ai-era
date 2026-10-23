import type {CommandEnvelope} from '../core/run-types.ts'
import type {CourseProjection} from '../core/course-projection.ts'
import type {WorkerInstance} from '../core/operations-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {PlayingView} from './game-types.ts'
import {courseResourceLabel} from './course-resource-labels.ts'
import {CourseRefundDetails} from './CourseRefundDetails.tsx'
import {CoursePreparationDetails} from './CoursePreparationDetails.tsx'
import {CourseTeachingDetails} from './CourseTeachingDetails.tsx'

/** The original confirmation identifies the actual class and stage from its captured public snapshot. */
export function CourseCommandDetails({command,course,workers,view,confirm,accountName}:{command:CommandEnvelope;course:CourseProjection;workers?:readonly WorkerInstance[];view?:PlayingView|undefined;confirm?:CommandPreview|undefined;accountName?:((id:string)=>string)|undefined}){
 if(command.kind==='RefundCourseLearners')return <CourseRefundDetails command={command} course={course} view={view} confirm={confirm} accountName={accountName}/>
 // The existing read-only stage record also accepts its captured public course without a live view.
 if(command.kind==='StartCourseStage'&&!view){
  if(!course||!command.payload||typeof command.payload!=='object')return null
  const payload=command.payload as {cohortId?:unknown;index?:unknown;resources?:unknown}
  if(typeof payload.cohortId!=='string'||payload.index!==0&&payload.index!==1)return null
  const cohorts=course.cohorts.filter(c=>c.id===payload.cohortId),cohort=cohorts.length===1?cohorts[0]:undefined,lesson=course.courses.find(c=>c.id===cohort?.courseId),stage=cohort?.stages[payload.index]
  if(!cohort||!lesson||!stage)return null
  const resources=Array.isArray(payload.resources)&&payload.resources.length>0&&payload.resources.every((id):id is string=>typeof id==='string')?payload.resources.map(id=>courseResourceLabel(id,course.resources,workers)).join('、'):'未取得原授课资源，请返回核对'
  return <section className="confirmation-context course-teaching-terms"><p><strong>{lesson.name} · {cohort.startAt}班 · 第{payload.index+1}段教学</strong>。实际授课资源：{resources}；原完成期限{stage.dueAt}。</p><p>{stage.deliveredAt?<>原记录已于{stage.deliveredAt}实际交付本段，重复安排仍由原规则拒绝。</>:<>这次只安排所选资源与日期，不提前确认本段教学收入。实际完成后，才按原学员和阶段核对保护释放。</>}已花成本与原支持、退款责任继续保留，退款窗口至{cohort.refundUntil}。</p></section>
 }
 if(['CreateCourseAudience','PlanCourseCohort','EnrollCourseAudience','StartCourseStage','StartCourseRecovery','StartCourseRefresh'].includes(command.kind))return view?<CourseTeachingDetails command={command} course={course} workers={workers} view={view} confirm={confirm} accountName={accountName}/>:null
 return <CoursePreparationDetails command={command} course={course} workers={workers} view={view} accountName={accountName}/>
}
