import type {PlayerThreadView} from './player-thread.ts'
import type {CoursePreparationPaperState} from './CoursePreparationPaper.tsx'

/** Preparation stays distinct from the original class, learner and update flows. */
export function isCoursePreparationThread(thread:PlayerThreadView):boolean{
 if(thread.focus.kind!=='course'||thread.focusStatus==='invalid')return false
 const target=thread.focus.courseTarget
 return target?.kind!=='audience'&&target?.kind!=='cohort'&&!thread.stage.startsWith('course-refresh')&&thread.stage!=='course-update-required'
}

export function coursePreparationPaperFor(thread:PlayerThreadView):CoursePreparationPaperState|undefined{
 if(!isCoursePreparationThread(thread))return undefined
 if(thread.focusScope==='history')return {phase:'history'}
 if(thread.outcome==='non-success'||thread.stage==='course-closed')return {phase:'stopped'}
 if(thread.stage==='course-ready'||thread.stage==='course-sample-completed')return {phase:'sample-ready'}
 if(thread.focus.kind==='course'&&thread.focus.courseTarget?.kind==='course'&&['course-paused','course-rights-required','course-tool-required'].includes(thread.stage)&&thread.resultRefs.some(ref=>ref.kind==='job'))return {phase:'sample-ready'}
 if(thread.stage==='course-activate'||thread.stage==='course-outline-completed')return {phase:'outline-completed'}
 if(thread.stage==='course-license-completed')return {phase:'license-ready'}
 if(thread.stage==='course-outline-planned')return {phase:'outline-planned'}
 if(thread.stage==='course-outline-running')return {phase:'outline-running'}
 if(thread.stage==='course-license-planned')return {phase:'license-planned'}
 if(thread.stage==='course-license-running')return {phase:'license-running'}
 if(thread.stage==='course-sample-planned')return {phase:'sample-planned'}
 if(thread.stage==='course-sample-running')return {phase:'sample-running'}
 return {phase:thread.focus.kind==='course'&&thread.focus.courseTarget===null?'entry':'definition'}
}
