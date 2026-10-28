import type {GamePanelProps} from './game-types.ts'
import {courseStageLatestStart,type CourseSceneProgress} from './course-scene-progress.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'

/** An optional pause in arranging teaching cannot cross its already public last start day. */
export function courseStageWaitDate(w:GamePanelProps['features']['workbench'],date:string,progress:CourseSceneProgress|null,observePublic=false):string|null{
 const target=progress?.target,stage=progress?.stage
 if(w.atQuarterEnd||w.pause!==null||w.progression.requiresDelivery||progress?.phase!=='course-stage-needed'||progress.invalidReason!==null||progress.historical||progress.wait||target?.kind!=='cohort'||target.jobId!==undefined||!stage||stage.cohortId!==target.cohortId||stage.courseId!==target.courseId||!Number.isSafeInteger(stage.days)||stage.days<=0)return null
 try{const next=playableAdvanceDate(w,date,w.progression.nextDate),latest=courseStageLatestStart(stage.dueAt,stage.days),targetDate=observePublic?playableAdvanceDate(w,date,latest):next<latest?next:latest;return targetDate>date?targetDate:null}catch{return null}
}
