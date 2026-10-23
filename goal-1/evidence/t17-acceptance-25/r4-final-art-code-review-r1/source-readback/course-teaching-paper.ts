import {sumMoney} from '../core/money.ts'
import type {GamePanelProps} from './game-types.ts'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import {courseSceneProgress} from './course-scene-progress.ts'
import {courseSceneContext} from './course-player-thread.ts'
import type {CoursePaperState,CoursePaperStage} from './OpeningObject.tsx'

/** The paper shows this explicit class, never a later attempt in an old task bookmark. */
export function courseTeachingPaper(p:Pick<GamePanelProps,'features'|'view'>,target:CourseSceneTarget|null):CoursePaperState|undefined{
 const course=p.features.course
 if(!course||target?.kind!=='cohort'||courseSceneProgress(course,p.view.date,target,courseSceneContext(p))?.historical)return undefined
 const co=course.cohorts.find(c=>c.id===target.cohortId&&c.courseId===target.courseId),lesson=course.courses.find(c=>c.id===target.courseId&&c.businessId===target.businessId),business=course.businesses.find(b=>b.id===target.businessId)
 if(!co||!lesson||!business)return undefined
 const progress=courseSceneProgress(course,p.view.date,target,courseSceneContext(p))
 if(!progress||progress.invalidReason)return undefined
 const stage=(index:0|1):CoursePaperStage=>{
  if(co.stages[index]?.deliveredAt!=null)return 'completed'
  const job=co.stageJobs[index]?.at(-1)
  if(job?.status==='planned'||job?.status==='running')return job.status
  return job?'stopped':'pending'
 }
 const finance=p.features.workbench.finance.find(a=>a.accountId===business.accountId)
 const refundOwed=(finance?.obligations??[]).filter(o=>o.contractId===co.id&&(o.kind==='refund_undelivered'||o.kind==='refund_delivered'))
 const protectionIds=new Set([finance?.contracts.find(c=>c.id===co.id)?.protectionReservationId,...refundOwed.map(o=>o.protectionReservationId)])
 return {stages:[stage(0),stage(1)],protectedFen:sumMoney((finance?.reservations??[]).filter(r=>r.status==='active'&&protectionIds.has(r.id)).map(r=>r.amountFen)),needsHelp:co.students.filter(s=>s.paidRemainingFen>0&&s.outcome==='needs_recovery').length,refundDueFen:sumMoney(refundOwed.map(o=>o.remainingFen)),supportUnmet:co.status==='remedy'&&!co.supportSatisfied&&co.students.some(s=>s.paidRemainingFen>0),closedAt:co.closedAt}
}
