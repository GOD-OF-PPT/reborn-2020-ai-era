import type {GamePanelProps} from './game-types.ts'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import {courseSceneProgress,courseTargetReason} from './course-scene-progress.ts'
import {courseSceneContext,resolveCourseFocus} from './course-player-thread.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {ComponentProps} from 'react'
import {SceneTimeNotice,sceneTimeNarrative} from './SceneEcho.tsx'
import {courseCohortFinancials} from './CourseTeachingDetails.tsx'
import {courseCohortJob} from './course-cohort-progress.ts'
import {courseTeachingClosureFor} from './course-teaching-continuity.ts'
import {COURSE_JOBS} from '../content/course.ts'
import {moneyText} from './game-text.ts'

/** Read one explicit class's published learning and money; never predict a learner's outcome. */
export function courseSupportReading(p:Pick<GamePanelProps,'view'|'features'>,target:CourseSceneTarget|null){
 const v=p.features.course,context=courseSceneContext(p)
 if(!v||target?.kind!=='cohort'||target.jobId!==undefined||courseTargetReason(v,target,context))return null
 const co=v.cohorts.find(c=>c.id===target.cohortId)!,lesson=v.courses.find(c=>c.id===co.courseId)!,progress=courseSceneProgress(v,p.view.date,target,context),money=courseCohortFinancials(v,p.view,co.id)
 if(!money||money.totalDueFen>0||progress?.invalidReason||progress?.historical||lesson.unresolvedUpdates.length)return null
 const paid=co.students.filter(s=>s.paidRemainingFen>0),helped=paid.filter(s=>s.outcome==='helped').length,needs=paid.filter(s=>s.outcome==='needs_recovery').length
 if(co.assessmentAt!==null&&(co.assessmentAt>p.view.date||helped+needs!==paid.length))return null
 const changedSinceAssessment=paid.some(s=>s.recovered)||money.refundRegisteredFen>0
 const feedback=co.assessmentAt===null?'学习反馈尚未形成':changedSinceAssessment?`当前留存：${helped}人已达到约定，${needs}人仍需帮助；首轮反馈${co.assessmentAt}`:`${co.assessmentAt}实际反馈：${helped}人已达到约定，${needs}人仍需帮助`
 const base={context:'',phase:progress?.phase,money,helped,needs,feedback}
 if(progress?.phase==='course-recovery-needed')return {...base,title:co.assessmentAt===null?'讲完的课，还欠一份支持。':'有人没跟上，这次怎样回应？',line:feedback+'。',terms:`补支持须在${co.remedyDueAt}完成；退款窗口至${co.refundUntil}。选真实人手与投入，或核对原学员退款；逾期未兑现的部分按原约处理。`}
 if(progress?.phase==='course-recovery-planned'||progress?.phase==='course-recovery-running'){
  const slots=co.supportJobs.filter(s=>s.recovery&&(s.job?.status==='planned'||s.job?.status==='running'))
  if(slots.length!==1)return null
  const slot=slots[0]!,job=courseCohortJob(v,co,slot.jobId,context),definition=COURSE_JOBS.find(d=>d.id===job?.definitionId)
  if(!job||!definition||progress.phase!=='course-recovery-'+job.status)return null
  const resources=job.resources.map(id=>{const matches=v.resources.filter(r=>r.id===id);return matches.length===1?matches[0]!.label:null})
  if(!resources.length||resources.some(label=>label===null))return null
  return {...base,title:job.status==='planned'?'补支持已安排，还没兑现。':'正在把落下的帮助补回来。',line:`${feedback}；补支持${job.startAt}—${job.completeAt}。`,terms:`${resources.join('、')} · ${moneyText(definition.costFen)} / ${definition.actionPoints}点 / ${definition.durationDays}日；${job.status==='planned'?'已预留，尚未实付或使用行动':'已开工，原成本与行动已承担'}。最晚${co.remedyDueAt}完成，退款至${co.refundUntil}；实际完成才看是否补足。`}
 }
 if(progress?.phase==='course-refund-window'&&co.assessmentAt!==null&&co.supportSatisfied&&needs===0)return {...base,title:'答应的帮助兑现了，留好最后的余地。',line:feedback+'。',terms:`退款窗口至${co.refundUntil}；窗口结束后按留存教学收入${v.catalog.feeBps/100}%列结算费。此刻没有新收费，下一班另作决定。`}
 if(progress?.phase==='course-cohort-closed'&&co.closedAt!==null&&co.closedAt<=p.view.date)return {...base,title:progress.title,line:`${co.closedAt}实际结清 · 留存${paid.length}人；${feedback}。`,terms:`退款实际已付${moneyText(money.refundPaidFen)}；结算费已付${moneyText(money.feePaidFen)}。学习与退款记录留在这一班，接下来由你选择。`}
 return null
}

/** A sole published assessment already says these counts; the complete echo stays unchanged. */
export function courseLearningEchoCoversLine(p:GamePanelProps,thread:PlayerThreadView,notice:Pick<ComponentProps<typeof SceneTimeNotice>,'date'|'text'|'brief'|'frame'>,line:string){
 const f=thread.focus,last=p.view.receipts.at(-1),frame=notice.frame
 if(f.kind!=='course'||f.courseTarget?.kind!=='cohort'||f.accountId!==p.accountId||!['current','carry'].includes(thread.focusScope)||resolveCourseFocus(p,f).reason||thread.focusStatus==='invalid'||thread.responsibilityOverrideNeeded||p.view.busy||p.view.readOnly||p.view.hasCandidate||p.view.saveStatus!=='saved'||last?.kind!=='AdvanceTime'||last.revisionAfter!==p.view.revision||notice.date!==p.view.date||!frame)return false
 const v=p.features.course,target=f.courseTarget;if(!v)return false
 const reading=courseSupportReading(p,target),co=v.cohorts.find(c=>c.id===target.cohortId),lesson=v.courses.find(c=>c.id===co?.courseId)
 if(!reading||!co||!lesson||co.assessmentAt!==p.view.date||!['course-recovery-needed','course-refund-window'].includes(reading.phase??'')||line!==reading.line||v.cohorts.filter(c=>c.assessmentAt===p.view.date).length!==1)return false
 const original=`「${lesson.name}」· ${co.startAt}班已有实际学习反馈：${reading.helped}人已得到承诺的帮助，${reading.needs}人仍需帮助；原整改与退款期限继续保留。`
 const published=notice.brief===original&&sceneTimeNarrative(notice.date,notice.text).startsWith(original)
 if(!published&&(sceneTimeNarrative(notice.date,notice.text)!==original||notice.brief!==undefined&&notice.brief!==original))return false
 return !frame.quarterChanged&&frame.dateBefore<=frame.dateAfter&&frame.dateAfter===p.view.date&&frame.pointsBefore===frame.pointsAfter&&frame.pointsAfter===p.view.budget.available&&frame.reservedBefore===frame.reservedAfter&&frame.reservedAfter===p.view.budget.reserved&&frame.spentBefore===frame.spentAfter&&frame.spentAfter===p.view.budget.spent&&frame.accounts.length>0&&new Set(frame.accounts.map(a=>a.id)).size===frame.accounts.length&&frame.accounts.every(a=>a.before===a.after&&p.view.accounts.filter(row=>row.accountId===a.id&&row.availableFen===a.after).length===1)
}

/** Shorten only the already-published sole fee/closure brief; original text and frame stay intact. */
export function courseClosedCashBrief(p:GamePanelProps,thread:PlayerThreadView,notice:Pick<ComponentProps<typeof SceneTimeNotice>,'date'|'text'|'brief'|'frame'>){
 const f=thread.focus,frame=notice.frame,last=p.view.receipts.at(-1)
 if(f.kind!=='course'||f.courseTarget?.kind!=='cohort'||f.courseTarget.jobId!==undefined||f.accountId!==p.accountId||!['current','carry'].includes(thread.focusScope)||resolveCourseFocus(p,f).reason||thread.responsibilityOverrideNeeded||p.view.busy||p.view.readOnly||p.view.hasCandidate||p.view.saveStatus!=='saved'||last?.kind!=='AdvanceTime'||last.revisionAfter!==p.view.revision||notice.date!==p.view.date||!frame)return null
 const target=f.courseTarget,v=p.features.course!,co=v.cohorts.find(c=>c.id===target.cohortId)!,owner=v.businesses.find(b=>b.id===target.businessId)!,closure=courseTeachingClosureFor(p,target),money=courseCohortFinancials(v,p.view,co.id)
 if(!closure||!money||co.closedAt!==p.view.date||co.feePostedAt!==p.view.date||money.feePaidFen<=0||money.feePaidFen!==co.feeFen||money.totalDueFen!==0||frame.quarterChanged||frame.dateAfter!==p.view.date||frame.dateBefore>frame.dateAfter||frame.pointsBefore!==frame.pointsAfter||frame.pointsAfter!==p.view.budget.available||frame.reservedBefore!==frame.reservedAfter||frame.reservedAfter!==p.view.budget.reserved||frame.spentBefore!==frame.spentAfter||frame.spentAfter!==p.view.budget.spent)return null
 const paid=frame.accounts.filter(a=>a.id===owner.accountId),row=paid[0]
 if(paid.length!==1||!row||row.before===null||row.before-row.after!==money.feePaidFen||!frame.accounts.every(a=>(a.id===owner.accountId||a.before===a.after)&&p.view.accounts.filter(b=>b.accountId===a.id&&b.availableFen===a.after).length===1))return null
 const original=`这段日子，课程实际付出${moneyText(money.feePaidFen)}。 ${closure.originalEcho}`
 return notice.brief===original&&sceneTimeNarrative(notice.date,notice.text).startsWith(original)?`结算费实际付出${moneyText(money.feePaidFen)}，本班于${co.closedAt}结清。`:null
}
