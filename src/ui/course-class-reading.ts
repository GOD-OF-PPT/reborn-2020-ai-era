import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {courseSceneContext,resolveCourseFocus} from './course-player-thread.ts'
import {courseSceneProgress} from './course-scene-progress.ts'
import {courseCohortFinancials} from './CourseTeachingDetails.tsx'
import {moneyText} from './game-text.ts'
import {courseRoomCopy} from './course-room-copy.ts'
import {sceneThreads} from './scene-thread-notes.ts'

/** One known current class, one original action; complex responsibilities keep their complete path. */
export function courseClassReading(p:GamePanelProps,thread:PlayerThreadView){
 const resume=courseClassResume(p,thread),resumeTarget=thread.focus.kind==='course'?thread.focus.courseTarget:null
 if(resume&&resumeTarget?.kind==='audience'){const audience=p.features.course!.audiences.find(a=>a.id===resumeTarget.audienceId)!;return {title:'先恢复这门课，再决定新班。',line:'原报价'+moneyText(audience.priceFen)+' · 基础意向'+audience.eligibleMembers.length+'人。',detail:'恢复后，再为这批意向另拟班期；此刻没有新报名或学费。',stageLabel:'旧课已更新 · 接班尚待恢复'}}
 const f=thread.focus,w=p.features.workbench,v=p.features.course
 if(p.view.phase!=='playing'||!v||f.kind!=='course'||f.courseTarget?.kind!=='cohort'||f.courseTarget.jobId!==undefined||f.accountId!==p.accountId||thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.responsibilityOverrideNeeded||!['current','carry'].includes(thread.focusScope)||resolveCourseFocus(p,f).reason||w.pause!==null||w.atQuarterEnd||w.progression.requiresDelivery||w.events.some(e=>e.presentation!=='ordinary'||e.isBlocking)||w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date)))return null
 const target=f.courseTarget,progress=courseSceneProgress(v,p.view.date,target,courseSceneContext(p)),co=v.cohorts.find(c=>c.id===target.cohortId),money=courseCohortFinancials(v,p.view,target.cohortId)
 if(!co||!money||money.totalDueFen>0||progress?.invalidReason||progress?.historical||progress?.phase!==thread.stage||!['course-cohort-enroll','course-stage-needed','course-stage-planned','course-stage-running','course-support-planned','course-support-running','course-recovery-needed','course-recovery-planned','course-recovery-running','course-refund-window','course-cohort-closed'].includes(thread.stage))return null
 const stage=co.stages.find(s=>s.deliveredAt===null),number=stage?stage.index+1:null,copy=courseRoomCopy(p,target)
 return {title:copy?.title??thread.title,line:copy?.line??thread.line,detail:copy?.terms??thread.detail,stageLabel:thread.stage==='course-cohort-enroll'?'班期已约定 · 仍待实际报名':thread.stage==='course-stage-needed'?'第'+number+'段教学 · 留出真实人手和日期':thread.stage==='course-stage-planned'?'第'+number+'段已安排 · 尚未开工':thread.stage==='course-stage-running'?'第'+number+'段教学中 · 尚未实际交付':thread.stage==='course-support-planned'?'支持已预留 · 尚未开工':thread.stage==='course-support-running'?'课后支持进行中 · 等实际反馈':thread.stage==='course-recovery-needed'?'实际反馈 · 补帮助或退款':thread.stage==='course-recovery-planned'?'补支持已安排 · 尚未实际完成':thread.stage==='course-recovery-running'?'补支持进行中 · 等实际反馈':thread.stage==='course-cohort-closed'?'原窗口实际结清 · 下一段生活':'实际帮助已兑现 · 退款窗口仍在'}
}

/** Resuming sales is still its original separate command, after the original update and conditions. */
export function courseClassResume(p:GamePanelProps,thread:PlayerThreadView){
 const f=thread.focus,v=p.features.course,w=p.features.workbench
 if(p.view.phase!=='playing'||!v||f.kind!=='course'||f.courseTarget?.kind!=='audience'||f.accountId!==p.accountId||thread.stage!=='course-audience-blocked'||thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.responsibilityOverrideNeeded||!['current','carry'].includes(thread.focusScope)||resolveCourseFocus(p,f).reason||w.pause!==null||w.atQuarterEnd||w.progression.requiresDelivery||w.events.some(e=>e.presentation!=='ordinary'||e.isBlocking)||w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date)))return null
 const target=f.courseTarget,course=v.courses.filter(c=>c.id===target.courseId&&c.businessId===target.businessId),c=course[0],owners=v.businesses.filter(b=>b.id===target.businessId&&b.accountId===p.accountId),progress=courseSceneProgress(v,p.view.date,target,courseSceneContext(p))
 return course.length===1&&c?.status==='ready'&&c.paused&&c.unresolvedUpdates.length===0&&c.qualificationReasons.length===0&&owners.length===1&&owners[0]?.lifecycle==='operating'&&progress?.phase===thread.stage&&!progress.historical&&!progress.invalidReason?{courseId:c.id,label:'核对原条件，恢复接新班'}:null
}

/** This explicit reading returns to the same parent class; it creates no teaching task. */
export function courseClassResult(p:GamePanelProps,thread:PlayerThreadView){
 const f=thread.focus,v=p.features.course
 if(p.view.phase!=='playing'||!v||f.kind!=='course'||f.courseTarget?.kind!=='cohort'||f.courseTarget.jobId===undefined||f.accountId!==p.accountId||thread.stage!=='course-stage-completed'||thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.responsibilityOverrideNeeded||resolveCourseFocus(p,f).reason||p.features.workbench.pause!==null||p.features.workbench.progression.requiresDelivery)return null
 const t=f.courseTarget,co=v.cohorts.find(c=>c.id===t.cohortId&&c.courseId===t.courseId),jobs=p.view.operations?.jobs.filter(j=>j.id===t.jobId&&j.businessId===t.businessId)??[]
 return co&&co.stages.some(stage=>stage.attempts.some(a=>a.jobId===t.jobId))&&jobs.length===1&&jobs[0]?.status==='completed'&&jobs[0].completeAt<=p.view.date?{label:'翻回这一班，接着安排下一步'}:null
}

/** The one responsibility already fully shown in this class scene needs only a calendar reading link. */
export function courseClassThreadAlreadyVisible(p:GamePanelProps,thread:PlayerThreadView){
 const f=thread.focus
 if(f.kind!=='course'||f.courseTarget?.kind!=='cohort'||f.courseTarget.jobId!==undefined||!courseClassReading(p,thread))return false
 const notes=sceneThreads(p.features,p.view.date)
 return notes.length===1&&notes[0]?.id==='cohort:'+f.courseTarget.cohortId
}
