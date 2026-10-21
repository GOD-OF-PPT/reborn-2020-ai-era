import {expect,it} from 'vitest'
import {prepareCourseF03} from '../testing/course-scenarios.ts'
import {projectCourse} from '../core/course-projection.ts'
import {courseSceneProgress,courseNeedsRecovery} from './course-scene-progress.ts'
import {CourseCommandDetails} from './CourseCommandDetails.tsx'
import {courseResourceLabel} from './course-resource-labels.ts'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import type {CommandEnvelope} from '../core/run-types.ts'

/** Actual fixture commands produce public display states; these are not normal-opening or balance proofs. */
function path(options:Parameters<typeof prepareCourseF03>[0]={}){
 const {h,course}=prepareCourseF03(options)
 const view=()=>projectCourse(h.run,h.course)!
 const progress=()=>courseSceneProgress(view(),h.run.timeline.cursor.date)!
 function enroll(takePayment=true){
  h.send('BuildCourseSample',{courseId:course.id,resources:['player-production'],startAt:'2023-01-01'});h.send('AdvanceTime',{date:'2023-01-15'})
  h.send('CreateCourseAudience',{courseId:course.id,mode:'paid',priceFen:19900,resources:['player-production'],startAt:'2023-01-15'});h.send('AdvanceTime',{date:'2023-01-22'})
  h.send('PlanCourseCohort',{courseId:course.id,audienceId:h.run.course!.audiences[0]!.id,startAt:'2023-01-24',endAt:'2023-02-28',supportStartAt:'2023-04-01',seatLimit:20,supportMode:'guided_group',resources:['player-production'],promise:'clear_scope'})
  const co=h.run.course!.cohorts[0]!,people=h.run.course!.audiences[0]!.eligibleMembers.slice(0,20)
  if(takePayment)h.send('EnrollCourseAudience',{cohortId:co.id,personIds:people})
  return {co,people}
 }
 function teach(){
  const {co,people}=enroll()
  h.send('StartCourseStage',{cohortId:co.id,index:0,resources:['player-production'],startAt:'2023-01-24'});h.send('AdvanceTime',{date:'2023-01-31'})
  h.send('StartCourseStage',{cohortId:co.id,index:1,resources:['player-production'],startAt:'2023-01-31'});h.send('AdvanceTime',{date:'2023-02-07'})
  return {co,people}
 }
 return {h,course,view,progress,enroll,teach}
}
it('does not turn a draft or a future sample into teaching, income or automatic commands',()=>{
 const p=path(),raw=p.h.codec.export(p.h.run),publicBefore=JSON.stringify(p.view())
 expect(p.progress().title).toContain('准备');expect(p.progress().stage).toBeUndefined()
 expect(p.h.codec.export(p.h.run)).toBe(raw);expect(JSON.stringify(p.view())).toBe(publicBefore)
 p.h.send('BuildCourseSample',{courseId:p.course.id,resources:['player-production'],startAt:'2023-01-02'})
 expect(p.progress().title).toContain('安排好');expect(p.progress().stage).toBeUndefined()
})
it('offers only the actual next undelivered stage of a real prepaid class and retains its own deadline',()=>{
 const p=path(),{co}=p.enroll(),v=p.view(),before=JSON.stringify(v)
 const result=courseSceneProgress(v,p.h.run.timeline.cursor.date)!
 expect(result.stage).toEqual({cohortId:co.id,courseId:p.course.id,index:0,dueAt:'2023-02-07',days:7,actionPoints:1})
 expect(result.line).toContain('20名实际学员');expect(result.choice.line).toContain('2023-01-24班');expect(result.choice.line).toContain('先选择实际资源与日期')
 expect(JSON.stringify(v)).toBe(before)
 p.h.send('StartCourseStage',{cohortId:co.id,index:0,resources:['player-production'],startAt:'2023-01-24'})
 expect(p.progress().title).toContain('留在日历');expect(p.progress().stage).toBeUndefined()
 p.h.send('AdvanceTime',{date:'2023-01-24'});expect(p.progress().title).toContain('认真教完')
 p.h.send('AdvanceTime',{date:'2023-01-31'});expect(p.progress().stage?.index).toBe(1)
})
it('does not call teaching complete after all prepayments were actually refunded',()=>{
 const p=path(),{co,people}=p.enroll()
 p.h.send('RefundCourseLearners',{cohortId:co.id,personIds:people,reason:'先退还原预款，保留原支持安排'})
 expect(p.progress().title).toContain('款项已退');expect(p.progress().title).not.toContain('讲完');expect(p.progress().stage).toBeUndefined()
 expect(p.progress().line).toContain('原任务与成本不会自动消失')
})
it('keeps original support and the refund window after both actual teaching stages finish',()=>{
 const p=path();p.teach()
 expect(p.progress().title).toContain('课后');expect(p.progress().choice.line).toContain('2023-04-01—2023-04-08');expect(p.progress().stage).toBeUndefined()
 p.h.send('AdvanceTime',{date:'2023-04-08'})
 expect(p.progress().title).toContain('余地');expect(p.progress().choice.line).toContain('2023-04-15')
 p.h.send('AdvanceTime',{date:'2023-04-16'});expect(p.progress().title).toContain('认真收好')
 expect(courseSceneProgress(p.view(),'2023-07-01')?.title).not.toContain('认真收好')
})
it('shows an all-refund ending as the actual consequence rather than a successful learning promise',()=>{
 const p=path(),{co,people}=p.teach()
 p.h.send('RefundCourseLearners',{cohortId:co.id,personIds:people,reason:'按原阶段处理全班退款'})
 p.h.send('AdvanceTime',{date:'2023-04-16'})
 expect(p.view().cohorts[0]!.closedAt).toBe('2023-04-16')
 const raw=p.h.codec.export(p.h.run),publicBefore=JSON.stringify(p.view()),result=p.progress()
 expect(result.title).toContain('以退款收场');expect(result.title).not.toContain('认真收好')
 expect(result.line).toContain('20名');expect(result.line).toContain('¥3,980');expect(result.line).toContain('实际付款仍看原账')
 expect(result.choice.label).toBe('翻看本期结果与下一份准备')
 expect(JSON.stringify(p.view())).toBe(publicBefore);expect(p.h.codec.export(p.h.run)).toBe(raw)
})
it('keeps both retained learners and partial refunds visible after the actual class closes',()=>{
 const p=path(),{co,people}=p.teach()
 p.h.send('RefundCourseLearners',{cohortId:co.id,personIds:[people[0]!],reason:'保留一人的原退款记录'})
 p.h.send('AdvanceTime',{date:'2023-04-16'})
 expect(p.view().cohorts[0]!.closedAt).toBe('2023-04-16')
 const result=p.progress()
 expect(result.title).toContain('也留下退款');expect(result.line).toContain('19名学员留在本班')
 expect(result.line).toContain('1名学员有退款记录');expect(result.line).toContain('¥199')
 expect(result.line).not.toContain('已经到账');expect(result.stage).toBeUndefined()
})
it('does not describe an actual empty closed class as teaching success or a refunded class',()=>{
 const p=path();p.enroll(false);p.h.send('AdvanceTime',{date:'2023-04-16'})
 expect(p.view().cohorts[0]!.closedAt).toBe('2023-04-16')
 expect(p.view().cohorts[0]!.students).toHaveLength(0)
 const result=p.progress()
 expect(result.title).toContain('没有等来学员');expect(result.title).not.toContain('退款收场')
 expect(result.line).toContain('没有实际报名');expect(result.stage).toBeUndefined()
 const business=p.h.run.operations!.businesses.find(b=>b.route==='ai_course')!
 p.h.send('WindDownBusiness',{businessId:business.id});p.h.send('CloseBusiness',{businessId:business.id})
 expect(p.progress().choice.title).toBe('回看原课程与交付记录')
 expect(p.progress().choice.title).not.toContain('曾经认真交付')
})
it('uses real publicly revealed learning problems for the support/refund choice without auto-authorizing recovery',()=>{
 const p=path({parameters:{matchBps:10000,helpedBps:0,feeBps:500}});p.teach();p.h.send('AdvanceTime',{date:'2023-04-08'})
 expect(p.progress().title).toContain('还没跟上');expect(p.progress().choice.line).toContain('原权限');expect(p.progress().choice.label).toContain('退款');expect(p.progress().stage).toBeUndefined()
 const co=p.view().cohorts[0]!
 p.h.send('StartCourseRecovery',{cohortId:co.id,supportMode:'guided_group',deploymentId:null,resources:['player-production'],startAt:'2023-04-08'})
 expect(p.progress().title).toContain('补回来');expect(p.progress().choice.line).toContain('2023-04-08—2023-04-15')
 p.h.send('AdvanceTime',{date:'2023-04-15'})
 expect(p.view().cohorts[0]!.status).toBe('remedy')
 expect(p.view().cohorts[0]!.students.every(s=>s.outcome==='helped'&&s.recovered)).toBe(true)
 expect(courseNeedsRecovery(p.view().cohorts[0]!)).toBe(false)
 expect(p.progress().title).toContain('余地');expect(p.progress().choice.line).toContain('2023-04-15')
 expect(p.progress().title).not.toContain('还没跟上');expect(p.progress().title).not.toContain('结清')

})
it('does not offer a new stage when its original completion deadline can no longer be met',()=>{
 const p=path();p.enroll();p.h.send('AdvanceTime',{date:'2023-02-01'})
 expect(p.progress().title).toContain('教学期限');expect(p.progress().stage).toBeUndefined()
 p.h.send('AdvanceTime',{date:'2023-02-08'});expect(p.progress().title).toContain('停下了');expect(p.progress().choice.line).toContain('退款')
})
it('shows an actual new-demand study independently of a maintenance revision or repeat purchase',()=>{
 const p=path();p.teach();p.h.send('AdvanceTime',{date:'2023-04-16'})
 p.h.send('StudyAdvancedCourseDemand',{courseId:p.course.id,resources:['player-production'],startAt:'2023-04-16'})
 expect(p.progress().title).toContain('还需要什么');expect(p.progress().stage).toBeUndefined()
 p.h.send('AdvanceTime',{date:'2023-04-23'});expect(p.progress().title).toContain('新需求');expect(p.progress().choice.line).toContain('实际需求成员')
})
it('retains the selected class update and every other class as public facts without inferring hidden learning outcomes',()=>{
 const p=path();p.enroll();const v=p.view(),co=v.cohorts[0]!,lesson=v.courses[0]!
 // Display-only public update variant; not encoded or claimed as a valid historical event.
 const update={id:'visible-update',courseId:lesson.id,anchorId:'H009',occurredAt:'2023-01-22',dueAt:'2023-01-29',affectedCohortIds:[co.id],settledCohortIds:[],resolvedAt:null,resolution:null,defaulted:false}
 const changed={...v,courses:[{...lesson,unresolvedUpdates:[update]}],updates:[update]}
 const before=JSON.stringify(changed),result=courseSceneProgress(changed,p.h.run.timeline.cursor.date)!
 expect(result.title).toContain('工具已经变了');expect(result.choice.line).toContain('不创造再次收费');expect(result.stage).toBeUndefined();expect(JSON.stringify(changed)).toBe(before)
})
it('keeps a closed studio as original history rather than suggesting new enrollment in its old ready course',()=>{
 const p=path();p.teach();p.h.send('AdvanceTime',{date:'2023-04-16'})
 const business=p.h.run.operations!.businesses.find(b=>b.route==='ai_course')!
 p.h.send('WindDownBusiness',{businessId:business.id});p.h.send('CloseBusiness',{businessId:business.id})
 expect(p.progress().title).toContain('原记录');expect(p.progress().choice.line).toContain('本季新回款');expect(p.progress().stage).toBeUndefined()
})
it('focuses a second actual class whose last feasible start comes before an already planned lesson completes',()=>{
 const p=path(),{co}=p.enroll(),a=p.h.run.course!.audiences[0]!
 p.h.send('StartCourseStage',{cohortId:co.id,index:0,resources:['player-production'],startAt:'2023-01-24'})
 p.h.send('PlanCourseCohort',{courseId:p.course.id,audienceId:a.id,startAt:'2023-01-23',endAt:'2023-03-10',supportStartAt:'2023-04-08',seatLimit:20,supportMode:'guided_group',resources:['player-production'],promise:'clear_scope'})
 const second=p.h.run.course!.cohorts.at(-1)!
 p.h.send('EnrollCourseAudience',{cohortId:second.id,personIds:a.eligibleMembers.slice(20,40)})
 expect(p.progress().stage?.cohortId).toBe(second.id);expect(p.progress().choice.line).toContain('2023-01-23班')
 expect(p.view().cohorts).toHaveLength(2);expect(p.view().cohorts[0]!.stageJobs[0]![0]!.status).toBe('planned')
})
it('identifies the actual class, stage and original windows in confirmation, while rendering does not charge or deliver',()=>{
 const p=path(),{co}=p.enroll(),saved=p.h.codec.export(p.h.run)
 const command:CommandEnvelope={runId:p.h.run.runId,actorId:'player',commandId:'inspect-stage-identity',expectedRevision:p.h.run.revision,kind:'StartCourseStage',payload:{cohortId:co.id,index:0,resources:['player-production'],startAt:'2023-01-24'}}
 const html=renderToStaticMarkup(createElement(CourseCommandDetails,{command,course:p.view()}))
 for(const text of ['图像工具入门','2023-01-24班','第1段教学','2023-02-07','实际授课资源：由我自己来教','不提前确认本段教学收入','2023-04-15','原支持、退款责任'])expect(html).toContain(text)
 expect(p.h.codec.export(p.h.run)).toBe(saved)
 expect(renderToStaticMarkup(createElement(CourseCommandDetails,{command:{...command,kind:'CreateCourseAudience'},course:p.view()}))).toBe('')
})
it('confirms the actual hired teaching resources and keeps dismissed or unknown IDs instead of substituting the player',()=>{
 const p=path(),{co}=p.enroll(),business=p.h.run.operations!.businesses.find(b=>b.route==='ai_course')!
 p.h.send('HireWorker',{businessId:business.id,definitionId:'assistant-zhou'})
 p.h.send('HireWorker',{businessId:business.id,definitionId:'editor-lin'})
 const workers=p.h.run.operations!.workers
 const command:CommandEnvelope={runId:p.h.run.runId,actorId:'player',commandId:'inspect-hired-stage-resources',expectedRevision:p.h.run.revision,kind:'StartCourseStage',payload:{cohortId:co.id,index:0,resources:[workers[0]!.id],startAt:'2023-01-24'}}
 const saved=p.h.codec.export(p.h.run),course=p.view(),captured=renderToStaticMarkup(createElement(CourseCommandDetails,{command,course,workers}))
 expect(workers.map(w=>w.definitionId)).toEqual(['assistant-zhou','editor-lin'])
 for(const worker of workers){
  const selected={...command,payload:{cohortId:co.id,index:0,resources:[worker.id],startAt:'2023-01-24'}},html=renderToStaticMarkup(createElement(CourseCommandDetails,{command:selected,course,workers}))
  expect(course.resources.some(r=>r.id===worker.id)).toBe(true)
  expect(html).toContain(courseResourceLabel(worker.id,course.resources,workers))
  expect(html).toContain(worker.from+'入职')
  expect(html).toContain(worker.definitionId==='assistant-zhou'?'周助理':'林剪辑员');expect(html).not.toContain('由我自己来教')
 }
 expect(p.h.codec.export(p.h.run)).toBe(saved)
 p.h.send('DismissWorker',{workerId:workers[0]!.id})
 const afterDismiss=p.h.codec.export(p.h.run),unknown='unlisted-original-resource'
 expect(renderToStaticMarkup(createElement(CourseCommandDetails,{command,course,workers}))).toBe(captured)
 expect(p.view().resources.some(r=>r.id===workers[0]!.id)).toBe(false)
 for(const id of [workers[0]!.id,unknown]){
  // These resources are intentionally unavailable; rendering is not an accepted teaching command.
  const historicalCommand={...command,payload:{cohortId:co.id,index:0,resources:[id],startAt:'2023-01-24'}},historical=renderToStaticMarkup(createElement(CourseCommandDetails,{command:historicalCommand,course:p.view(),workers:p.h.run.operations!.workers}))
  expect(historical).toContain('原资源现不可用（'+id+'）');expect(historical).not.toContain('由我自己来教')
  if(id===workers[0]!.id)expect(historical).toContain('周助理')
 }
 expect(p.h.codec.export(p.h.run)).toBe(afterDismiss)
})
it('uses the actual second-stage deadline and preserves an already delivered first stage as history',()=>{
 const p=path(),{co}=p.teach()
 const command:CommandEnvelope={runId:p.h.run.runId,actorId:'player',commandId:'inspect-stage-original',expectedRevision:p.h.run.revision,kind:'StartCourseStage',payload:{cohortId:co.id,index:1,resources:['player-production'],startAt:'2023-02-07'}}
 const html=renderToStaticMarkup(createElement(CourseCommandDetails,{command,course:p.view()}))
 expect(html).toContain('第2段教学');expect(html).toContain('2023-02-28');expect(html).toContain('2023-02-07实际交付本段');expect(html).not.toContain('不提前确认本段教学收入')
})
