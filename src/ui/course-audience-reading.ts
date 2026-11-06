import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {courseSceneContext,resolveCourseFocus} from './course-player-thread.ts'
import {courseSceneProgress} from './course-scene-progress.ts'
import {isoDate,quarterOf} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

/** Read the same known public audience; every action still belongs to CourseThreadAction. */
export function courseAudienceReading(p:GamePanelProps,thread:PlayerThreadView){
 const f=thread.focus,w=p.features.workbench,v=p.features.course
 if(p.view.phase!=='playing'||!v||f.kind!=='course'||f.courseTarget?.kind!=='audience'||f.accountId!==p.accountId||thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.responsibilityOverrideNeeded||!['current','carry','history'].includes(thread.focusScope)||resolveCourseFocus(p,f).reason||w.pause!==null||w.atQuarterEnd||w.progression.requiresDelivery||w.events.some(e=>e.presentation!=='ordinary'||e.isBlocking)||w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date)))return null
 const progress=courseSceneProgress(v,p.view.date,f.courseTarget,courseSceneContext(p))
 if(!progress||progress.invalidReason||progress.historical||progress.phase!==thread.stage||!['course-audience-planned','course-audience-running','course-audience-ready','course-audience-empty'].includes(thread.stage))return null
 if(thread.focusScope==='history'){
  const target=f.courseTarget,rows=v.audiences.filter(a=>a.id===target.audienceId&&a.courseId===target.courseId),a=rows[0]
  if(rows.length!==1||!a||a.completedAt===null||a.completedAt>=w.quarterStart||a.completedAt>p.view.date||!['course-audience-ready','course-audience-empty'].includes(thread.stage))return null
  try{isoDate(a.completedAt);if(thread.focusQuarter!==quarterOf(a.createdAt)||thread.focusQuarter>=w.quarter)return null}catch{return null}
  return {historical:true as const,title:thread.stage==='course-audience-ready'?'把这批意向，办成下一班课？':'那次的回应，接下来怎样继续？',line:'原反馈'+a.completedAt+' · 覆盖'+a.members.length+'人，基础意向'+a.eligibleMembers.length+'人。',detail:'原报价'+moneyText(a.priceFen)+'/人。'+(thread.stage==='course-audience-empty'?'这份反馈没有基础意向；可以另拟一次接触，也可以先回生活。':'若要再开班，先核今天的身份、人数与支持条件。'),stageLabel:'原受众与报价 · 回看'+thread.focusQuarter}
 }
 return {historical:false as const,title:thread.title,line:thread.line,detail:thread.detail,stageLabel:thread.stage==='course-audience-planned'?'推广已安排 · 尚未开工':thread.wait?'推广进行中 · 实际意向尚未形成':'受众已有记录 · 班期与报名另核'}
}

/** Expose the same original plan intent only after this audience has real feedback. */
export function courseAudienceNext(p:GamePanelProps,thread:PlayerThreadView){
 const reading=courseAudienceReading(p,thread),target=thread.focus.kind==='course'?thread.focus.courseTarget:null
 if(!reading||target?.kind!=='audience'||thread.stage!=='course-audience-ready')return null
 const progress=courseSceneProgress(p.features.course,p.view.date,target,courseSceneContext(p))
 return progress?.teachingIntent==='plan'&&!progress.wait&&!progress.historical&&!progress.invalidReason?{label:'为这批意向，筹备一班课',caption:'先定承诺与人数，再选教学日期和支持',intent:'plan' as const}:null
}
