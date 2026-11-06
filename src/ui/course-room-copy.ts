import type {GamePanelProps} from './game-types.ts'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import {courseSceneProgress,courseTargetReason,courseStageLatestStart} from './course-scene-progress.ts'
import {courseSceneContext} from './course-player-thread.ts'
import {courseCohortJob} from './course-cohort-progress.ts'
import {COURSE_JOBS} from '../content/course.ts'
import {courseSupportReading} from './course-support-reading.ts'
import {moneyText} from './game-text.ts'

/** The current class's original price and refund window, without repeating its retained-history notice. */
export function courseUpdateRoomTerms(p:Pick<GamePanelProps,'view'|'features'>,target:CourseSceneTarget|null){
 const course=p.features.course,context=courseSceneContext(p)
 if(!course||target?.kind!=='cohort'||target.jobId!==undefined||courseTargetReason(course,target,context))return null
 if(courseSceneProgress(course,p.view.date,target,context)?.phase!=='course-cohort-update-required')return null
 const cohort=course.cohorts.find(row=>row.id===target.cohortId)!
 return `本班约定单价${moneyText(cohort.priceFen)} · 留存${cohort.students.filter(row=>row.paidRemainingFen>0).length}/${cohort.seatLimit}人；退款窗口至${cohort.refundUntil}。学费不再收一次。`
}

/** Short room narration only; the original progress keeps its complete record and terms. */
export function courseRoomCopy(p:Pick<GamePanelProps,'view'|'features'>,target:CourseSceneTarget|null){
 const support=courseSupportReading(p,target);if(support)return support
 const course=p.features.course,context=courseSceneContext(p)
 if(!course||target?.kind!=='cohort'||target.jobId!==undefined||courseTargetReason(course,target,context))return null
 const progress=courseSceneProgress(course,p.view.date,target,context)
 const co=course.cohorts.find(c=>c.id===target.cohortId)!,stage=co.stages.find(s=>s.deliveredAt===null)
 if(progress?.phase==='course-cohort-enroll')return {title:'这一班，还在等学员。',context:'',line:`本班${co.students.filter(s=>s.paidRemainingFen>0).length}/${co.seatLimit}位 · 当前未购意向${co.availablePeople.length}人。`,terms:`单价${moneyText(co.priceFen)} · ${co.startAt}开课；支持至${co.supportCompleteAt}，退款窗口至${co.refundUntil}。预款受保护，报名不确认收入。`}
 if(progress?.phase==='course-stage-needed'&&progress.stage&&stage&&stage.index===progress.stage.index){const data=progress.stage,latest=courseStageLatestStart(data.dueAt,data.days);return {title:progress.title,context:'',line:`${co.students.filter(s=>s.paidRemainingFen>0).length}名学员 · 已交${co.stages.filter(s=>s.deliveredAt!==null).length}/2段；第${stage.index+1}段${data.actionPoints}点/${data.days}日。`,terms:`约定单价${moneyText(co.priceFen)}；最晚${latest}开工、${data.dueAt}完成。支持至${co.supportCompleteAt}，退款至${co.refundUntil}。实际交付才确认收入，不再收费。`}}
 if(progress?.phase==='course-support-planned'||progress?.phase==='course-support-running'){
  const slots=co.supportJobs.filter(slot=>!slot.recovery&&slot.job&&(slot.job.status==='planned'||slot.job.status==='running')),slot=slots[0],delivered=co.stages.filter(s=>s.deliveredAt!==null).length
  if(slots.length!==1||!slot||delivered!==co.stages.length)return null
  const support=courseCohortJob(course,co,slot.jobId,context),definition=COURSE_JOBS.find(d=>d.id===support?.definitionId),labels=support?.resources.map(id=>{const rows=course.resources.filter(r=>r.id===id);return rows.length===1?rows[0]!.label:null})
  if(!support||!definition||support.definitionId!==`course-support-${course.courses.find(c=>c.id===co.courseId)!.productId}-${slot.mode}`||!labels?.length||labels.some(label=>label===null)||progress.phase!==`course-support-${support.status}`)return null
  const sameYear=[support.startAt,support.completeAt,co.refundUntil].every(date=>date.slice(0,4)===p.view.date.slice(0,4)),date=(value:string)=>sameYear?value.slice(5).replace('-','/'):value,year=sameYear?support.startAt.slice(0,4)+'年':'',planned=support.status==='planned'
  return {title:planned?'两段课已交出，还要兑现支持。':'两段课已交出，正在兑现支持。',context:'',line:`${co.students.filter(s=>s.paidRemainingFen>0).length}人 · 教学${delivered}/${co.stages.length}已交付；支持${year}${date(support.startAt)}—${date(support.completeAt)}。`,terms:`${labels.join('、')} · ${moneyText(definition.costFen)} / ${definition.actionPoints}点 / ${definition.durationDays}日；${planned?'已预留，尚未实付或使用行动':'已开工，原成本与行动已承担'}。退款窗口至${co.refundUntil}；实际学习反馈仍须等待，不另收学费。`}
 }
 if(progress?.phase!=='course-stage-planned'&&progress?.phase!=='course-stage-running')return null
 if(!stage)return null
 const active=co.stageJobs[stage.index]?.filter(job=>job?.status==='planned'||job?.status==='running')??[]
 if(active.length!==1||!active[0])return null
 const job=courseCohortJob(course,co,active[0].id,context),paid=co.students.filter(s=>s.paidRemainingFen>0)
 if(!job||!paid.length||progress.phase!==`course-stage-${job.status}`)return null
 const definition=COURSE_JOBS.find(row=>row.id===job.definitionId),resources=job.resources.map(id=>{
  const rows=course.resources.filter(resource=>resource.id===id)
  return rows.length===1?rows[0]!.label:null
 })
 if(!definition||!resources.length||resources.some(label=>label===null))return null
 const planned=job.status==='planned',number=stage.index+1,delivered=co.stages.filter(s=>s.deliveredAt!==null).length
 const sameYear=[job.startAt,job.completeAt,stage.dueAt].every(date=>date.slice(0,4)===p.view.date.slice(0,4)),displayDate=(date:string)=>sameYear?date.slice(5).replace('-','/'):date,year=sameYear?job.startAt.slice(0,4)+'年':''
 return {
  title:`第${number}段教学，${planned?'已经安排':'正在进行'}。`,
  context:'',
  line:`${paid.length}人 · 已交${delivered}/${co.stages.length}段 · ${year}${displayDate(job.startAt)}—${displayDate(job.completeAt)}；最晚${displayDate(stage.dueAt)}交出。`,
  terms:`${resources.join('、')} · ${moneyText(definition.costFen)} / ${definition.actionPoints}点 / ${definition.durationDays}日；${planned?'已预留，尚未实付或使用行动':'已开工，原成本与行动已承担'}。交付才释放原保护、确认收入；不再收费。支持与退款仍按原期。`,
 }
}
