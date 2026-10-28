import type {GamePanelProps} from './game-types.ts'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import {courseSceneProgress,courseTargetReason} from './course-scene-progress.ts'
import {courseSceneContext} from './course-player-thread.ts'
import {courseCohortJob} from './course-cohort-progress.ts'

/** Short room narration only; the original progress keeps its complete record and terms. */
export function courseRoomCopy(p:Pick<GamePanelProps,'view'|'features'>,target:CourseSceneTarget|null){
 const course=p.features.course,context=courseSceneContext(p)
 if(!course||target?.kind!=='cohort'||target.jobId!==undefined||courseTargetReason(course,target,context))return null
 const progress=courseSceneProgress(course,p.view.date,target,context)
 if(progress?.phase!=='course-stage-planned'&&progress?.phase!=='course-stage-running')return null
 const co=course.cohorts.find(c=>c.id===target.cohortId)!,stage=co.stages.find(s=>s.deliveredAt===null)
 if(!stage)return null
 const active=co.stageJobs[stage.index]?.filter(job=>job?.status==='planned'||job?.status==='running')??[]
 if(active.length!==1||!active[0])return null
 const job=courseCohortJob(course,co,active[0].id,context),paid=co.students.filter(s=>s.paidRemainingFen>0)
 if(!job||!paid.length||progress.phase!==`course-stage-${job.status}`)return null
 const planned=job.status==='planned',number=stage.index+1,delivered=co.stages.filter(s=>s.deliveredAt!==null).length
 return {
  title:`第${number}段教学，${planned?'已经安排':'正在进行'}。`,
  context:`${paid.length}名留存学员 · 已交出${delivered}/${co.stages.length}段；原支持和退款期限继续。`,
  line:`${job.startAt}—${job.completeAt}，${planned?'原安排尚未实际开工':'等这段教学真正完成'}。${job.completeAt===stage.dueAt?'':`须在${stage.dueAt}前交出。`}`,
 }
}
