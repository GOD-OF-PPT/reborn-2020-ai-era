import {quarterOf} from '../core/calendar.ts'
import {dayBefore} from '../core/operations-calendar.ts'
import type {CourseProjection} from '../core/course-projection.ts'
import {moneyText,playableThrough} from './game-text.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {COURSE_JOBS} from '../content/course.ts'
import {courseCohortTargetReason,courseCohortProgress,courseRefreshProgress} from './course-cohort-progress.ts'

export type CourseSceneTarget=
 |{readonly kind:'studio';readonly businessId:string}
 |{readonly kind:'outline';readonly businessId:string;readonly outlineId:string}
 |{readonly kind:'license';readonly businessId:string;readonly licenseId:string}
 |{readonly kind:'course';readonly businessId:string;readonly courseId:string;readonly sampleJobId?:string}
 |{readonly kind:'audience';readonly businessId:string;readonly courseId:string;readonly audienceId:string}
 |{readonly kind:'cohort';readonly businessId:string;readonly courseId:string;readonly cohortId:string;readonly jobId?:string}
export interface CourseSceneContext{readonly preparationReady?:boolean;readonly operations?:{readonly jobs:readonly ProductionJob[]}|null}
export type CourseSceneResultRef={readonly kind:'job'|'course'|'outline'|'license'|'business'|'audience'|'cohort'|'enrollment'|'refund'|'operation';readonly id:string;readonly date:string|null}

export interface CourseSceneStage{
 readonly cohortId:string
 readonly courseId:string
 readonly index:number
 readonly dueAt:string
 readonly days:number
 readonly actionPoints:number
}
export function courseStageLatestStart(dueAt:string,days:number):string{
 let date=dueAt
 for(let n=0;n<days;n++)date=dayBefore(date)
 return date
}
export interface CourseSceneProgress{
 readonly phase:string
 readonly invalidReason:string|null
 readonly outcome:'none'|'pending'|'actual'|'non-success'
 readonly resultRefs:readonly CourseSceneResultRef[]
 readonly target?:CourseSceneTarget
 readonly historical?:boolean
 readonly command?:{readonly kind:'ActivateBusiness';readonly payload:{readonly businessId:string};readonly confirm:boolean}
 readonly wait?:{readonly date:string;readonly label:string}
 readonly title:string
 readonly line:string
 readonly choice:{readonly title:string;readonly line:string;readonly label:string}
 readonly stage?:CourseSceneStage
 readonly preparation?:CoursePreparationStep
 readonly waitDate?:string
 readonly recordId?:string
 readonly teachingIntent?:'audience'|'plan'|'enroll'|'stage:0'|'stage:1'|'recovery'|'refund'|'refresh'
}
export interface CoursePreparationStep{readonly phase:'fund'|'outline'|'waiting'|'activate';readonly businessId?:string;readonly jobId?:string}
function scene(title:string,line:string,choiceTitle:string,choiceLine:string,label:string):CourseSceneProgress{
 return {title,line,choice:{title:choiceTitle,line:choiceLine,label},phase:'legacy',invalidReason:null,outcome:'none',resultRefs:[]}
}

/** A past remedy flag alone does not contradict actual completed learning support. */
export function courseNeedsRecovery(co:NonNullable<CourseProjection>['cohorts'][number]):boolean{
 return co.students.some(s=>s.paidRemainingFen>0&&(s.outcome==='needs_recovery'||co.status==='remedy'&&!co.supportSatisfied))
}

/** Committed public teaching facts. Selecting a resource/date and the original command still belong to the player. */
function legacyCourseSceneProgress(course:CourseProjection,date:string):CourseSceneProgress|null{
 if(!course)return null
 const attention=(co:NonNullable<CourseProjection>['cohorts'][number])=>{
  const lesson=course.courses.find(c=>c.id===co.courseId),update=lesson?.unresolvedUpdates.map(u=>u.dueAt).sort()[0]
  if(update)return update
  if(co.status==='settling')return co.feePostedAt??co.refundUntil
  if(courseNeedsRecovery(co))return co.remedyDueAt
  const stage=!co.teachingCancelled?co.stages.find(s=>s.deliveredAt===null):null
  if(stage&&lesson){const job=co.stageJobs[stage.index]?.find(j=>j&&(j.status==='planned'||j.status==='running'));return job?.completeAt??courseStageLatestStart(stage.dueAt,course.catalog.products.find(p=>p.id===lesson.productId)!.stageDays)}
  return co.supportJobs.filter(s=>s.job&&(s.job.status==='planned'||s.job.status==='running')).map(s=>s.job!.completeAt).sort()[0]??co.refundUntil
 }
 const open=course.cohorts.filter(c=>c.closedAt===null).sort((a,b)=>attention(a).localeCompare(attention(b))||a.id.localeCompare(b.id))
 const cohort=open.find(c=>c.students.some(s=>s.paidRemainingFen>0))??open[0]
 if(cohort){
  const lesson=course.courses.find(c=>c.id===cohort.courseId)
  if(!lesson)return null
  const product=course.catalog.products.find(p=>p.id===lesson.productId)!
  const people=cohort.students.filter(s=>s.paidRemainingFen>0)
  const identity=lesson.name+' · '+cohort.startAt+'班'
  if(lesson.unresolvedUpdates.length)return scene('工具已经变了，旧承诺还在。','原学员的材料、教学和退款，都要按原约定继续处理。','先照顾已经答应的这堂课',`${identity}有${lesson.unresolvedUpdates.length}项公开更新待处理；更新不创造再次收费资格。`,'核对旧课更新、教学与退款')
  if(cohort.status==='settling')return scene('课已经走过，原账还要收好。','这期尚未结清，不能把剩余费用或退款留在画面之外。','核对这期未结的原账',`${identity}的原费用与退款继续保留；已经确认的收入不等于当前可分配现金。`,'查看本班费用与未结责任')
  if(courseNeedsRecovery(cohort)){
   const recovery=cohort.supportJobs.find(s=>s.recovery&&s.job&&(s.job.status==='planned'||s.job.status==='running'))
   if(recovery?.job)return scene('这一次，把落下的学习补回来。','补支持已经安排，还需要走到实际完成。','看着这段补支持真正完成',`${identity}安排在${recovery.job.startAt}—${recovery.job.completeAt}；实际反馈、${cohort.remedyDueAt}前的补救与原退款窗口仍须核对。`,'查看补支持进度、学员反馈与退款')
   return scene('有人还没跟上，先把承诺接住。','学员的实际反馈已经出现，还需要补支持或按原记录退款。','认真回应这一次反馈',`${identity}须在${cohort.remedyDueAt}前处理；支持方式、原权限、资源与代价仍由你选择。`,'核对学员反馈、补支持与退款')
  }
  if(cohort.teachingCancelled)return scene('这堂课停下了，原责任仍在。','没有实际交付的部分，不会因为等候或换页而完成。','把未交付与退款逐项收好',`${identity}已经停止原教学；已花成本、原退款和支持安排继续保留。`,'查看停课后的原账与安排')
  if(!people.length)return scene(cohort.students.length?'款项已退，原安排仍须看清。':'名额只是约定，还要有人愿意来。',cohort.students.length?'已经发生的退款留在原记录里，原任务与成本不会自动消失。':'这期还没有实际留存学员，班额与预留不是收入。','翻看这期真实留下的安排',`${identity}的实际报名、保护款、支持与退款均保留；是否接受新学员仍由你决定。`,'核对本班实际报名与原安排')
  const teaching=cohort.stageJobs.flat().find(j=>j&&(j.status==='planned'||j.status==='running'))
  if(teaching)return scene(teaching.status==='planned'?'这一段课，已经留在日历。':'这一次，把答应的内容认真教完。',teaching.status==='planned'?'安排已经确定，还须等到实际开工与完成。':'教学已经开始，完成之后才按原阶段确认收入。','看着这段教学真正走完',`${identity}安排在${teaching.startAt}—${teaching.completeAt}；开始没有代替交付，原学员退款窗口仍在。`,'查看本段实际教学与学员记录')
  const stage=cohort.stages.find(s=>s.deliveredAt===null)
  if(stage&&people.length){
   if(cohort.startAt>playableThrough)return scene('原来的课，还留在往后的日历里。','旧承诺与原预留仍在，不能借未来日期取得新的行动额度。','先核对来年的原安排',`${identity}仍按原账与有限收尾处理；当前先保留原教学、支持和退款记录。`,'查看未来原约定与收尾边界')
   if(date>courseStageLatestStart(stage.dueAt,product.stageDays))return scene('原来的教学期限，需要先面对。','已经来不及按原期限完成的课，不能假装现在开工就能交付。','看清这一段还欠着什么',`${identity}第${stage.index+1}段最晚${stage.dueAt}完成；请核对原期限、已交付部分与退款。`,'核对未完成教学与退款')
   const result=scene(stage.index===0?'这堂课，已经有人在等。':'第一段已经交出，接着把课讲完。',`${people.length}名实际学员仍在本班，下一段教学需要你真正留出时间。`,'给第'+(stage.index+1)+'段课留出日子',`${identity}最晚${stage.dueAt}完成这一段；先选择实际资源与日期，再核对原安排。`,'选择第'+(stage.index+1)+'段教学的资源与日期')
   return {...result,stage:{cohortId:cohort.id,courseId:lesson.id,index:stage.index,dueAt:stage.dueAt,days:product.stageDays,actionPoints:product.stageAP}}
  }
  const support=cohort.supportJobs.find(s=>s.job&&(s.job.status==='planned'||s.job.status==='running'))
  if(support?.job)return scene('讲完了课，还要照顾课后的人。','原来的答疑与支持，也是这堂课的一部分。','把这段课后支持认真走完',`${identity}已安排${support.job.startAt}—${support.job.completeAt}实际支持；原资源、费用和退款责任仍在。`,'查看原支持、资源与退款窗口')
  return scene('答应的内容交出后，还要留一点余地。','这期仍在原支持、退款或结算窗口中。','等这堂课真正收好',`${identity}的退款窗口至${cohort.refundUntil}，实际费用按原账结算；此刻还没有完整结清。`,'查看本班窗口与原账')
 }
 const currentBusiness=(id:string)=>course.businesses.some(b=>b.id===id&&b.lifecycle!=='closed')
 if(course.businesses.length&&!course.businesses.some(b=>b.lifecycle!=='closed'))return scene('这里的课，已经留在原记录里。','工作室已经收尾，原学生、学习与退款记录继续保留。','回看原课程与交付记录','历史收入与旧成本不会变成本季新回款；新工作室与新承诺仍需另外明确选择。','翻看已收尾课程与原账')
 const unfinished=course.courses.find(c=>currentBusiness(c.businessId)&&(c.status==='draft'||c.status==='building'))
 if(unfinished){
  const job=unfinished.job
  if(job&&(job.status==='planned'||job.status==='running'))return scene(job.status==='planned'?'样课的日子，已经安排好。':'把真正做过的事，写成一堂好课。','样课完成之前，还不能开始向学员兑现教学。','先把这一份样课做好',`${unfinished.name}安排在${job.startAt}—${job.completeAt}；案例权利、工具资格与原投入分别保留。`,'查看样课、案例与实际资源')
  return scene('先把值得交付的内容准备好。','案例与想法已经留下，仍需实际样课和教学准备。','把这堂课做成真正的准备',`${unfinished.name}尚未实际完成样课；原工具资格、课程素材权利与自有成本须另行核对。`,'核对样课、工具与素材权利')
 }
 const study=course.studies.find(s=>currentBusiness(s.businessId)&&s.job&&(s.job.status==='planned'||s.job.status==='running'))
 if(study?.job)return scene('先听听，上过课的人还需要什么。','新的学习需求还在实际调查中，不能提前当作进阶购买。','让这次需求研究真正完成',`${study.job.startAt}—${study.job.completeAt}实际调查；旧知识产品仍不能向同一人重复收费。`,'查看进阶需求与原学员记录')
 const completedStudy=course.studies.findLast(s=>currentBusiness(s.businessId)&&s.completedAt!==null&&quarterOf(s.completedAt)===quarterOf(date)&&!course.courses.some(c=>c.studyId===s.id))
 if(completedStudy)return scene(completedStudy.members.length?'新需求已经留下记录，下一堂课仍要认真准备。':'这次调查，还没有留下新的实际需求。','进阶仍需要独立样课与交付，维护修订不等于新产品。','看清原学员的实际新需求',`${completedStudy.members.length}名实际需求成员已经记录；新方案、资源与投入仍由你核对。`,'核对真实新需求与进阶方案')
 const closed=course.cohorts.filter(c=>c.closedAt!==null&&quarterOf(c.closedAt)===quarterOf(date)).at(-1)
 if(closed){
  const refunded=closed.students.filter(s=>s.refundedFen>0),retained=closed.students.filter(s=>s.paidRemainingFen>0),refundFen=refunded.reduce((sum,s)=>sum+s.refundedFen,0)
  const title=!closed.students.length?'这期没有等来学员。':refunded.length&&!retained.length?'这堂课，最终以退款收场。':refunded.length?'这堂课，留下了学习，也留下退款。':closed.students.every(s=>s.outcome==='helped')?'这期的承诺，已经认真收好。':'这期的原账，已经收尾。'
  const line=!closed.students.length?`${closed.closedAt}收尾时没有实际报名，原安排与已花成本仍留在账上。`:refunded.length?`${closed.closedAt}按原窗口收尾，${retained.length}名学员留在本班、${refunded.length}名学员有退款记录。退款处理合计${moneyText(refundFen)}，实际付款仍看原账。`:`${closed.closedAt}按原窗口实际结清，${retained.length}名学员的学习与原账记录仍然保留。`
  return scene(title,line,'再想想下一堂值得交付的课','旧学员和同一知识产品的购买身份仍在；新的需求、样课与交付都要重新核对。','翻看本期结果与下一份准备')
 }
 const ready=course.courses.find(c=>currentBusiness(c.businessId)&&c.status==='ready')
 if(ready)return scene(ready.unresolvedUpdates.length?'旧课的工具前提，值得再看一遍。':'先听听，谁真的需要这堂课。','样课与实际需求、招生和最终学习效果，是不同的事情。','把价格、班额与支持想清楚',`${ready.name}的原样课和记录都在；新班仍需真实受众、支持资源与保护资金。`,'核对课程受众、班额与原承诺')
 const outline=course.outlines.find(o=>currentBusiness(o.businessId)&&o.job&&(o.job.status==='planned'||o.job.status==='running'))
 if(outline?.job){const planned=outline.job.status==='planned';return {...scene(planned?'给这份大纲，留好了真正的日子。':'先把这堂课的骨架认真写好。',planned?'安排已经记下，尚未开始。原资金与注意力先为这段日子留好。':'写作已经开始，仍要等到实际完成。大纲不会代替样课或招生。',planned?'等到这份大纲真正开工':'给教学准备留足真正的时间',`${outline.job.startAt}—${outline.job.completeAt}实际补齐大纲；原成本与后续条件继续核对。`,'等这份大纲真正写好'),preparation:{phase:'waiting',businessId:outline.businessId,jobId:outline.job.id},waitDate:planned?outline.job.startAt:outline.job.completeAt}}
 const preparing=course.businesses.find(b=>b.lifecycle==='preparing')
 if(preparing){
  if(preparing.prepared&&course.outlines.some(o=>o.businessId===preparing.id&&o.job?.status==='completed'))return {...scene('第一份大纲，已经认真写完。','准备只是开始；案例、样课和招生各有自己的前提。','决定是否启用这间教室','启用前仍核对原资格、初始产能与自有资金；此刻没有学生、预款或教学收入。','核对条件，启用这间教室'),preparation:{phase:'activate',businessId:preparing.id}}
  return {...scene('一间小小的教室，先写好第一份教案。','教室分账已经建立。接下来，亲自决定谁来写、哪天开始。','把值得教的事认真理一遍','大纲准备需要¥100、1点和7日，实际完成后再决定下一步。','选择执笔人和开工日'),preparation:{phase:'outline',businessId:preparing.id}}
 }
 const firstPlan=course.businesses.find(b=>b.lifecycle==='operating'&&!course.courses.some(c=>c.businessId===b.id)&&course.outlines.some(o=>o.businessId===b.id&&o.job?.status==='completed'))
 if(firstPlan)return {...scene('第一份教案留下了，想想谁会需要它。','教室已经启用；接下来选一个真正做过的案例，构思第一堂课。','从自己的真实经历开始','选择案例、形式与主题，再核对素材使用范围。方案不等于样课，更没有自动招生或收费。','挑选案例，构思第一堂课'),recordId:firstPlan.id+'-define'}
 if(course.businesses.length)return scene('一间小小的教室，先从准备开始。','资金、案例、大纲、样课和工具资格，各有自己的前提。','翻看已经做过的准备','已有工作室与历史原账继续保留；新的课和学员仍需你明确选择。','核对课程准备、案例与原账')
 if(date>=course.catalog.availableAt)return {...scene('把做过的事，变成值得教的一堂课。','先给一间小教室留出余地，不急着向任何人收费。','给教室留一笔自己的钱','自选转入资本，再安排真实大纲；样课、招生和收入都还没有发生。','决定给教室留多少钱'),preparation:{phase:'fund'}}
 return null
}

const targetId=(value:unknown):value is string=>typeof value==='string'&&value.length>0&&value.length<=512&&value.trim().length>0&&!/[\u0000-\u001f\u007f]/.test(value)
export const courseTargetEntity=(t:CourseSceneTarget):string=>t.kind==='course'?t.sampleJobId??t.courseId:t.kind==='license'?t.licenseId:t.kind==='outline'?t.outlineId:t.kind==='audience'?t.audienceId:t.kind==='cohort'?t.jobId??t.cohortId:t.businessId
function sampleJob(course:NonNullable<CourseProjection>,target:Extract<CourseSceneTarget,{kind:'course'}>,context?:CourseSceneContext){
 const c=course.courses.find(c=>c.id===target.courseId),id=target.sampleJobId??c?.sampleJobId
 return id?(context?.operations?.jobs.find(j=>j.id===id)??(context?.operations?undefined:c?.job?.id===id?c.job:undefined)):undefined
}
/** Exact supplied identities are checked, never repaired into another draft or attempt. */
export function courseTargetReason(course:CourseProjection,target:CourseSceneTarget,context?:CourseSceneContext):string|null{
 if(!course||!target||typeof target!=='object'||Array.isArray(target)||!['studio','outline','license','course','audience','cohort'].includes(target.kind)||!targetId(target.businessId))return '原课程目标身份不完整，请明确重新选择。'
 const keys=target.kind==='studio'?['kind','businessId']:target.kind==='outline'?['kind','businessId','outlineId']:target.kind==='license'?['kind','businessId','licenseId']:target.kind==='audience'?['kind','businessId','courseId','audienceId']:target.kind==='cohort'?['kind','businessId','courseId','cohortId','jobId']:['kind','businessId','courseId','sampleJobId']
 if(Object.keys(target).some(key=>!keys.includes(key)))return '原课程目标含有冲突字段，没有换到另一项准备。'
 const business=course.businesses.filter(b=>b.id===target.businessId)
 if(business.length!==1||business[0]!.route!=='ai_course')return '原课程工作室不存在或身份重复，请重新选择。'
 if(target.kind==='audience'||target.kind==='cohort')return courseCohortTargetReason(course,target,context)
 const checkJob=(job:ProductionJob|null|undefined,id:string)=>{
  const rows=context?.operations?.jobs.filter(j=>j.id===id)??(job?[job]:[])
  return rows.length===1&&rows[0]!.id===id&&rows[0]!.businessId===target.businessId
 }
 if(target.kind==='outline'){
  if(!targetId(target.outlineId)||target.outlineId===target.businessId)return '原大纲身份为空或冲突，请重新选择。'
  const rows=course.outlines.filter(o=>o.id===target.outlineId),o=rows[0]
  if(rows.length!==1||o!.businessId!==target.businessId||!checkJob(o!.job,o!.jobId)||o!.job?.definitionId!=='course-outline')return '原大纲或任务不属于这间工作室，没有换成另一份大纲。'
 }
 if(target.kind==='license'){
  if(!targetId(target.licenseId)||target.licenseId===target.businessId)return '原课程素材许可身份为空或冲突，请重新选择。'
  const rows=course.licenses.filter(l=>l.id===target.licenseId),l=rows[0]
  if(rows.length!==1||l!.businessId!==target.businessId||!checkJob(l!.job,l!.jobId)||l!.job?.definitionId!=='course-material-license')return '原课程使用范围或任务不属于这间工作室，没有替换许可。'
 }
 if(target.kind==='course'){
  if(!targetId(target.courseId)||target.courseId===target.businessId||target.sampleJobId!==undefined&&(!targetId(target.sampleJobId)||[target.businessId,target.courseId].includes(target.sampleJobId)))return '原课程或样课任务身份为空或冲突，请重新选择。'
  const rows=course.courses.filter(c=>c.id===target.courseId),c=rows[0]
  if(rows.length!==1||c!.businessId!==target.businessId)return '原课程不属于这间工作室，没有换成另一门课。'
  if(target.sampleJobId!==undefined){
   const j=sampleJob(course,target,context)
   if(c!.sampleAttempts.filter(id=>id===target.sampleJobId).length!==1||!checkJob(j,target.sampleJobId)||j?.definitionId!==`course-sample-${c!.productId}-${c!.topicId}`)return '原样课尝试已不可匹配，没有改成最新样课；请重新选择。'
  }
 }
 return null
}

function focusedCourseScene(course:NonNullable<CourseProjection>,date:string,target:CourseSceneTarget,context?:CourseSceneContext):CourseSceneProgress{
 const reason=courseTargetReason(course,target,context)
 const make=(phase:string,title:string,line:string,terms:string,label:string,outcome:CourseSceneProgress['outcome']='none',refs:readonly CourseSceneResultRef[]=[]):CourseSceneProgress=>({...scene(title,line,title,terms,label),phase,outcome,resultRefs:refs,target})
 if(reason)return {...make('course-invalid','先找回原来的这份教学准备。',reason,'原大纲、课程、学生和费用继续保留；请明确重新选择。','重新选择原课程对象'),invalidReason:reason}
 if(target.kind==='audience'||target.kind==='cohort')return courseCohortProgress(course,date,target,context)
 const b=course.businesses.find(b=>b.id===target.businessId)!,closed=b.lifecycle==='closed',stopped=['winding_down','closed'].includes(b.lifecycle)
 const globalOutline=context?.preparationReady??course.outlines.some(o=>o.businessId===b.id&&o.job?.status==='completed')
 const canActivate=b.lifecycle==='preparing'&&b.prepared&&globalOutline
 const activation={kind:'ActivateBusiness' as const,payload:{businessId:b.id},confirm:true}
 const originalJob=(kind:'outline'|'license'|'sample',job:ProductionJob,identity:string,refs:readonly CourseSceneResultRef[]):CourseSceneProgress=>{
  const waiting=job.status==='planned'||job.status==='running',complete=job.status==='completed',name=kind==='outline'?'大纲':kind==='license'?'课程素材使用范围':'样课'
  const shortName=kind==='license'?'素材':name,definition=COURSE_JOBS.find(d=>d.id===job.definitionId),terms=definition?`${moneyText(definition.costFen)} / ${definition.actionPoints}点 / ${definition.durationDays}日；`:''
  const status=job.status==='planned'?'已预留，尚未实付或使用行动。':job.status==='running'?'已开工，成本与行动已按原账承担。':complete?'已实际完成，已耗成本与行动保留。':job.status==='cancelled'?'未开工安排已取消，预留按原账释放。':'已中断，尚未完成；已耗成本与行动保留。'
  const p=make(`course-${kind}-${job.status}`,waiting?job.status==='planned'?`这份${shortName}，已经排进日历。`:`这份${shortName}，正在准备。`:complete?`这份${shortName}，已经完成。`:`这份${shortName}，已经停下。`,`${identity} · ${job.startAt}—${job.completeAt}。`,`${job.resources.map(id=>course.resources.find(r=>r.id===id)?.label??'原安排的制作成员').join('、')} · ${terms}${status}${stopped?'工作室已停；':''}资格与旧责任仍须核对；${kind==='sample'?'样课不等于招生。':'样课与招生另定。'}`,`翻看这份原${name}与安排`,waiting?'pending':complete?'actual':'non-success',refs)
  return waiting?{...p,wait:{date:job.status==='planned'?job.startAt:job.completeAt,label:`等这份原${name}${job.status==='planned'?'实际开工':'实际完成'}`},waitDate:job.status==='planned'?job.startAt:job.completeAt}:p
 }
 if(target.kind==='outline'){
  const o=course.outlines.find(o=>o.id===target.outlineId)!,j=o.job!,p=originalJob('outline',j,'这间工作室的原大纲',[{kind:'outline',id:o.id,date:j.startAt},...(j.status==='completed'?[{kind:'job' as const,id:j.id,date:j.completeAt}]:[])])
  return canActivate&&j.status==='completed'?{...p,command:activation,preparation:{phase:'activate',businessId:b.id},choice:{title:'决定是否启用这间教室',line:'大纲与营业准备已经存在；仍须独立核对原资金、资格和初始产能，此刻没有学生或学费。',label:'核对条件，启用这间教室'}}:p
 }
 if(target.kind==='license'){
  const l=course.licenses.find(l=>l.id===target.licenseId)!,j=l.job!
  return originalJob('license',j,'本工作室这份案例的原课程使用范围',[{kind:'license',id:l.id,date:j.startAt},...(j.status==='completed'?[{kind:'job' as const,id:j.id,date:j.completeAt}]:[])])
 }
 if(target.kind==='studio'){
  if(closed)return make('course-closed','这间原教室，已经收尾。','原课程、大纲、案例与旧班记录仍在。','新工作室与新付费承诺须另外明确选择，不把历史成果当成本季新增收入。','翻看这间原工作室的记录','actual')
  if(stopped||b.lifecycle==='paused')return make('course-paused','先把这间原教室的安排看清。','工作室已经暂停或进入收尾。','停止新安排不清除原任务、维护、更新或旧学生责任。','翻看原工作室与有限收尾','non-success')
  if(canActivate)return {...make('course-activate','大纲与营业准备都已留下。','已有公开准备可以复用，不需要为进入下一步再写一次大纲。','启用仍独立核对原资格、可花至少¥2,000与初始产能；启用后按实际在营日承担原月维护。','核对条件，启用这间教室'),preparation:{phase:'activate',businessId:b.id},command:activation}
  if(b.lifecycle==='preparing'){
   const active=course.outlines.filter(o=>o.businessId===b.id&&o.job&&['planned','running'].includes(o.job.status))
   if(active.length===1){const o=active[0]!,p=originalJob('outline',o.job!,'这间工作室的大纲',[{kind:'outline',id:o.id,date:o.job!.startAt}]);return {...p,preparation:{phase:'waiting',businessId:b.id,jobId:o.job!.id}}}
   return {...make('course-outline-needed','先把做过的事，写成能教给别人的大纲。',globalOutline?'以前写过的大纲还在，眼前这间教室还需要准备好。':'先整理自己真正做过的事，再准备好这间教室。','自己写这份大纲需要¥100、1点、7日；选好执笔人和开工日，完成后再决定是否启用教室。已有的合法准备也可在随身册核对、沿用，不必强制重写。','选择执笔人和开工日'),preparation:{phase:'outline',businessId:b.id}}
  }
  return make('course-define','这间教室已启用，再明确想教什么。','已有课程与案例仍保留；没有替你选择第一份草稿。','选择实际已付案例、形式、主题、受众和使用同意，再独立定义这门课；此刻没有招生。','构思新课或明确翻选已有课程')
 }
 const c=course.courses.find(c=>c.id===target.courseId)!,job=sampleJob(course,target,context),historical=target.sampleJobId!==undefined&&target.sampleJobId!==c.sampleJobId
 const refs:CourseSceneResultRef[]=[{kind:'course',id:c.id,date:c.createdAt}]
 if(job?.status==='completed')refs.push({kind:'job',id:job.id,date:job.completeAt})
 if(historical&&job)return {...originalJob('sample',job,c.name,refs),historical:true}
 if(job&&['planned','running','interrupted','cancelled'].includes(job.status))return originalJob('sample',job,c.name,refs)
 const refresh=courseRefreshProgress(course,date,target,context);if(refresh)return refresh
 if(closed||c.status==='retired'||stopped)return make(closed?'course-closed':'course-retired','这份原课程，已经停止新安排。',c.name+'的原样课与版本仍保留。','原学生、退款、更新与费用继续按原记录处理；本次查看不会恢复招生。','翻看原课程与全部旧责任','non-success',refs)
 if(c.unresolvedUpdates.length)return {...make('course-update-required','样课记录还在，工具前提需要更新。',`${c.name}有原更新责任，期限${c.unresolvedUpdates.map(u=>u.dueAt).sort()[0]}。`,'原更新须实际投入并完成；新获客、班额与支持仍另行决定，不把更新记作新产品或收入。','翻看原更新与课程记录',c.status==='ready'?'actual':'pending',refs),teachingIntent:'refresh'}
 const pendingRights=course.licenses.filter(l=>l.businessId===b.id&&c.cases.some(ref=>ref.id===l.caseId)&&l.job&&['planned','running'].includes(l.job.status)).sort((a,b)=>(a.job!.status==='planned'?a.job!.startAt:a.job!.completeAt).localeCompare(b.job!.status==='planned'?b.job!.startAt:b.job!.completeAt)||a.id.localeCompare(b.id))[0]
 if(pendingRights?.job)return originalJob('license',pendingRights.job,c.name+' · 原案例的课程使用范围',[...refs,{kind:'license',id:pendingRights.id,date:pendingRights.job.startAt}])
 const missingRights=c.cases.some(ref=>{const info=course.cases.find(r=>r.kind===ref.kind&&r.id===ref.id);return !info||info.licensed&&!course.licenses.some(l=>l.businessId===b.id&&l.caseId===ref.id&&l.job?.status==='completed')})
 if(missingRights)return make('course-rights-required','先把这门课的原案例使用范围看清。',c.name+'的案例或课程素材权利仍待核对。','已付案例和本单授权不是同一件事。需要的课程使用范围按原¥300、1点、7日实际完成；不自动授权。','核对这门课的实际案例与课程权利',c.status==='ready'?'actual':'none',refs)
 if(c.qualificationReasons.length)return make('course-tool-required','这门课的工具前提，需要先确认。',c.name+'的当前公开工具资格尚不齐全。','沿原申请和阅读动作核对；样课制作期每一日仍须通过原资格预览，不编批准或延长期限。','查看原工具资格与课程准备',c.status==='ready'?'actual':'none',refs)
 if(c.paused||b.lifecycle==='paused')return make('course-paused','这份课程暂不接受新的安排。',c.name+'的原样课与版本仍在。','恢复仍须原条件与独立决定；旧班责任、更新和费用没有消失。','核对原暂停与恢复条件',c.status==='ready'?'actual':'none',refs)
 if(c.status==='ready')return {...make('course-ready','这一份样课，已经真正准备好。',`${c.name}的样课已实际完成，${course.cohorts.some(co=>co.courseId===c.id)?'已有班期与学员记录继续保留。':'尚未招生。'}`,'当前案例权利与工具前提可核；新的获客、价格、班额、支持和实际报名仍须另行决定，本次查看没有新增学费或教学收入。','翻看这门原课，再决定是否迈向下一步','actual',refs),teachingIntent:'audience'}
 if(job?.status==='completed')return originalJob('sample',job,c.name,refs)
 const definition=COURSE_JOBS.find(d=>d.id===`course-sample-${c.productId}-${c.topicId}`)
 return make('course-draft','课程方案留下了，样课还须亲手做出来。',c.name+'仍是方案，没有把定义当作样课完成。',`${definition?`本门样课${moneyText(definition.costFen)}、${definition.actionPoints}点、${definition.durationDays}日；`:''}显选实际资源与日期，再核对制作期资格；未来学费不能支付当前制作。`,'选择这门课样课的资源与开工日','none',refs)
}

/** Undefined keeps the original recommendation; null explicitly selects no existing object. */
export function courseSceneProgress(course:CourseProjection,date:string,target?:CourseSceneTarget|null,context?:CourseSceneContext):CourseSceneProgress|null{
 if(target===undefined)return legacyCourseSceneProgress(course,date)
 if(target===null){
  const available=!!course&&date>=course.catalog.availableAt
  return {...scene(available?'先选这次想认真准备的那一堂课。':'这间教室，还没有到可以筹备的日子。',available?'明确选择已有工作室或课程；也可在原规则允许时筹备，不会自动接管旧班。':course?`课程筹备的公开可用日是${course.catalog.availableAt}；当前尚未到达，不能提前建立工作室。`:'当前没有可核对的课程筹备记录。','先明确这一次教学准备',available?'资金、案例、大纲、课程权利与样课分别核对；本次选择不会招生或收款。':'现在可以先积累真实已付案例、保留生活与自有资金；到可用日仍须核对原工具资格、大纲和实际样课，不会因等待自动获得许可。',available?'明确选择课程准备对象':'查看已付案例与原资格边界'),phase:available?'course-entry':'course-unavailable',...(!available&&course&&date<course.catalog.availableAt?{outcome:'pending' as const,waitDate:course.catalog.availableAt,wait:{date:course.catalog.availableAt,label:'保留准备，等到公开可用日'}}:{})}
 }
 if(!course)return {...scene('原课程记录暂不可达。','没有换到另一门课。','重新选择原对象','原记录保留，当前不执行任何准备。','重新选择课程对象'),phase:'course-invalid',invalidReason:'当前公开课程记录不可达，请重新选择。',target}
 return focusedCourseScene(course,date,target,context)
}
