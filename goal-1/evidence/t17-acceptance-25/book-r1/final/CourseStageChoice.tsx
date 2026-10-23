import {useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {courseStageLatestStart,courseTargetReason,type CourseSceneStage,type CourseSceneTarget} from './course-scene-progress.ts'
import {Dialog} from './Dialog.tsx'
import {ResourceSelect} from './ResourceSelect.tsx'
import {CommandButton} from './CommandButton.tsx'
import {playableThrough} from './game-text.ts'
import {courseResourceLabel} from './course-resource-labels.ts'
import {useCourseTeachingDraft,type CourseTeachingDraftScope,type CourseTeachingDraftSlot} from './course-teaching-draft.ts'

type Props={p:GamePanelProps;stage:CourseSceneStage;onFullRecord:(target?:CourseSceneTarget,slot?:CourseTeachingDraftSlot)=>void;children:(open:()=>void)=>ReactNode}
export function CourseStageChoice(props:Props){
 const {p,stage}=props,v=p.features.course,co=v?.cohorts.find(co=>co.id===stage.cohortId&&co.courseId===stage.courseId),c=v?.courses.find(c=>c.id===co?.courseId),b=v?.businesses.find(b=>b.id===c?.businessId),product=v?.catalog.products.find(product=>product.id===c?.productId),target:CourseSceneTarget|undefined=co&&c&&b?{kind:'cohort',businessId:b.id,courseId:c.id,cohortId:co.id}:undefined
 const reason=!v||!target||!co||!c||!b||!product?'原班期或课程当前不可核，请重新选择。':p.accountId!==b.accountId||!p.view.accounts.some(a=>a.accountId===b.accountId)?'这段教学与当前查看账户不一致，请选回原账户。':stage.index!==0&&stage.index!==1||co.stages[stage.index]?.dueAt!==stage.dueAt||product.stageDays!==stage.days||product.stageAP!==stage.actionPoints?'原教学阶段或期限已经不匹配，请重新选择。':courseTargetReason(v,target,{operations:p.view.operations})
 return reason||!co||!c||!b||!target?<InvalidStage {...props} reason={reason??'原教学记录当前不可核。'}/>:<CourseStageEditor key={JSON.stringify([p.view.runId,p.accountId,co.id,stage.index])} {...props} target={target} scope={{accountId:b.accountId,businessId:b.id,courseId:c.id,audienceId:co.audienceId,cohortId:co.id,slot:stage.index===0?'stage:0':'stage:1'}}/>
}
function InvalidStage({children,reason}:Props&{reason:string}){
 const [open,setOpen]=useState(false)
 return <>{children(()=>setOpen(true))}{open?<Dialog title="先找回这一段原教学" onClose={()=>setOpen(false)}><p className="warning-box" role="status">{reason}</p><button type="button" onClick={()=>setOpen(false)}>返回，明确选回原班期</button></Dialog>:null}</>
}
function CourseStageEditor({p,stage,onFullRecord,children,target,scope}:Props&{target:CourseSceneTarget;scope:CourseTeachingDraftScope}){
 const [open,setOpen]=useState(false),[draft,setDraft]=useCourseTeachingDraft(p.view.runId,scope,p.courseTeachingDraftMemory),v=p.features.course!,co=v.cohorts.find(co=>co.id===stage.cohortId)!,c=v.courses.find(c=>c.id===stage.courseId)!,resourceChoices=v.resources.map(r=>({...r,label:courseResourceLabel(r.id,v.resources,p.view.operations?.workers)})),earliest=co.startAt>p.view.date?co.startAt:p.view.date,completionLimit=courseStageLatestStart(stage.dueAt,stage.days),latest=completionLimit<playableThrough?completionLimit:playableThrough
 const blocked=p.view.busy||p.controller.snapshot.busy||p.view.readOnly||p.view.hasCandidate||p.view.saveStatus==='conflict'||p.features.workbench.pause!==null||p.features.workbench.progression.requiresDelivery
 const request:GamePanelProps['request']=(kind,payload,label,confirm)=>{const current=p.controller.snapshot.view;if(blocked||!current||current.runId!==p.view.runId||current.revision!==p.view.revision)return;setOpen(false);p.request(kind,payload,label,confirm)}
 return <>{children(()=>setOpen(true))}{open?<Dialog title="给这一段课，留出真正的时间" className="course-stage-choice" onClose={()=>setOpen(false)}>
  <p>{c.name} · {co.startAt}班 · 第{stage.index+1}教学阶段。最晚{stage.dueAt}实际完成。</p><p>本段基准{stage.actionPoints}点 / {stage.days}日，使用所选日期对应季度的真实注意力。开工没有确认教学收入；实际完成后才按原学员和阶段释放保护，退款窗口继续保留。</p>
  <div className="lesson-plan-fields"><fieldset><legend>谁来认真讲这一段</legend><label className="field">这段教学的实际资源<ResourceSelect options={resourceChoices} value={draft.resources.length===1?draft.resources[0]??'':''} onChange={id=>setDraft(previous=>({...previous,resources:id?[id]:[]}))}/></label><p>明确选择本人或已在岗同事，原工资与同一资源排程另行核对。</p>{draft.resources.some(id=>!resourceChoices.some(r=>r.id===id))?<p className="warning-box">原授课资源现在不可用，请重新选择。</p>:null}</fieldset><fieldset><legend>在日历上留下一天</legend><label className="field">这段教学的开工日期<input type="date" min={earliest} max={latest} value={draft.startAt} onChange={e=>setDraft(previous=>({...previous,startAt:e.target.value}))}/></label><p>最晚{latest}开工，才能按原约完成。翻页、改日期和返回调整都不等于开始教学。</p>{draft.startAt&&(draft.startAt<earliest||draft.startAt>latest)?<p className="warning-box">原草稿日期{draft.startAt}现在不在可安排范围，请重新选择；没有替你改日历。</p>:null}</fieldset></div>
  <div className="lesson-plan-actions"><CommandButton {...p} request={request} kind="StartCourseStage" payload={{cohortId:co.id,index:stage.index,resources:draft.resources,startAt:draft.startAt}} label="核对这份教学安排" confirm primary/>
  <button type="button" onClick={()=>{setOpen(false);onFullRecord(target,scope.slot)}}>翻看原班期、支持与退款</button></div>
 </Dialog>:null}</>
}
