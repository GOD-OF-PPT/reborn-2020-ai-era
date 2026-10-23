import {useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {courseStageLatestStart,type CourseSceneStage} from './course-scene-progress.ts'
import {Dialog} from './Dialog.tsx'
import {ResourceSelect} from './ResourceSelect.tsx'
import {CommandButton} from './CommandButton.tsx'
import {playableThrough} from './game-text.ts'
import {courseResourceLabel} from './course-resource-labels.ts'

export function CourseStageChoice({p,stage,onFullRecord,children}:{p:GamePanelProps;stage:CourseSceneStage;onFullRecord:()=>void;children:(open:()=>void)=>ReactNode}){
 const [open,setOpen]=useState(false),[resource,setResource]=useState('player-production')
 const course=p.features.course,cohort=course?.cohorts.find(c=>c.id===stage.cohortId),lesson=course?.courses.find(c=>c.id===stage.courseId)
 const resourceChoices=course?.resources.map(r=>({...r,label:courseResourceLabel(r.id,course.resources,p.view.operations?.workers)}))??[]
 const earliest=cohort&&cohort.startAt>p.view.date?cohort.startAt:p.view.date
 const [date,setDate]=useState({sourceDate:p.view.date,value:earliest})
 const startAt=date.sourceDate===p.view.date?date.value:earliest
 const completionLimit=courseStageLatestStart(stage.dueAt,stage.days),latest=completionLimit<playableThrough?completionLimit:playableThrough
 return <>{children(()=>setOpen(true))}{open&&course&&cohort&&lesson?<Dialog title="给这一段课，留出真正的时间" className="course-stage-choice" onClose={()=>setOpen(false)}>
  <p>{lesson.name} · {cohort.startAt}班 · 第{stage.index+1}教学阶段。最晚{stage.dueAt}实际完成。</p>
  <p>本段基准{stage.actionPoints}点 / {stage.days}日，使用所选日期对应季度的真实注意力。开工没有确认教学收入；实际完成后才按原学员与阶段释放保护，退款窗口继续保留。</p>
  <div className="lesson-plan-fields"><fieldset><legend>谁来认真讲这一段</legend><label className="field">这段教学的实际资源<ResourceSelect options={resourceChoices} value={resource} onChange={setResource}/></label><p>由自己留出时间，或使用已经在岗的同事。原工资和同一资源的排程仍另行核对。</p></fieldset><fieldset><legend>在日历上留下一天</legend><label className="field">这段教学的开工日期<input type="date" min={earliest} max={latest} value={startAt} onChange={e=>setDate({sourceDate:p.view.date,value:e.target.value})} onBlur={e=>setDate({sourceDate:p.view.date,value:e.currentTarget.value})}/></label><p>最晚{latest}开工，才能按原约完成。翻页、改日期和返回调整都不等于开始教学。</p></fieldset></div>
  <div className="lesson-plan-actions"><CommandButton {...p} kind="StartCourseStage" payload={{cohortId:cohort.id,index:stage.index,resources:[resource],startAt}} label="核对这份教学安排" confirm primary/>
  <button type="button" onClick={()=>{setOpen(false);onFullRecord()}}>翻看原班期、支持与退款</button></div>
 </Dialog>:null}</>
}
