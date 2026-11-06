import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {courseSceneContext,resolveCourseFocus} from './course-player-thread.ts'
import {courseSceneProgress} from './course-scene-progress.ts'

/** Read the same known public audience; every action still belongs to CourseThreadAction. */
export function courseAudienceReading(p:GamePanelProps,thread:PlayerThreadView){
 const f=thread.focus,w=p.features.workbench,v=p.features.course
 if(p.view.phase!=='playing'||!v||f.kind!=='course'||f.courseTarget?.kind!=='audience'||f.accountId!==p.accountId||thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.responsibilityOverrideNeeded||!['current','carry'].includes(thread.focusScope)||resolveCourseFocus(p,f).reason||w.pause!==null||w.atQuarterEnd||w.progression.requiresDelivery||w.events.some(e=>e.presentation!=='ordinary'||e.isBlocking)||w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date)))return null
 const progress=courseSceneProgress(v,p.view.date,f.courseTarget,courseSceneContext(p))
 if(!progress||progress.invalidReason||progress.historical||progress.phase!==thread.stage||!['course-audience-planned','course-audience-running','course-audience-ready','course-audience-empty'].includes(thread.stage))return null
 return {title:thread.title,line:thread.line,detail:thread.detail,stageLabel:thread.stage==='course-audience-planned'?'推广已安排 · 尚未开工':thread.wait?'推广进行中 · 实际意向尚未形成':'受众已有记录 · 班期与报名另核'}
}
