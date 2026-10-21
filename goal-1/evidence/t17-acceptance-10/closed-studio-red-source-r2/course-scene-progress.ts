import {quarterOf} from '../core/calendar.ts'
import {dayBefore} from '../core/operations-calendar.ts'
import type {CourseProjection} from '../core/course-projection.ts'
import {moneyText,playableThrough} from './game-text.ts'

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
 readonly title:string
 readonly line:string
 readonly choice:{readonly title:string;readonly line:string;readonly label:string}
 readonly stage?:CourseSceneStage
}
function scene(title:string,line:string,choiceTitle:string,choiceLine:string,label:string):CourseSceneProgress{
 return {title,line,choice:{title:choiceTitle,line:choiceLine,label}}
}

/** A past remedy flag alone does not contradict actual completed learning support. */
export function courseNeedsRecovery(co:NonNullable<CourseProjection>['cohorts'][number]):boolean{
 return co.students.some(s=>s.paidRemainingFen>0&&(s.outcome==='needs_recovery'||co.status==='remedy'&&!co.supportSatisfied))
}

/** Committed public teaching facts. Selecting a resource/date and the original command still belong to the player. */
export function courseSceneProgress(course:CourseProjection,date:string):CourseSceneProgress|null{
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
 if(course.businesses.length&&!course.businesses.some(b=>b.lifecycle!=='closed'))return scene('这里的课，已经留在原记录里。','工作室已经收尾，原学生、学习与退款记录继续保留。','回看曾经认真交付过的课','历史收入与旧成本不会变成本季新回款；新工作室与新承诺仍需另外明确选择。','翻看已收尾课程与原账')
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
 const outline=course.outlines.find(o=>o.job&&(o.job.status==='planned'||o.job.status==='running'))
 if(outline?.job)return scene('先把这堂课的骨架认真写好。','大纲仍在实际准备中，营业准备没有代替样课或招生。','给教学准备留足真正的时间',`${outline.job.startAt}—${outline.job.completeAt}实际补齐大纲；原成本与后续条件继续核对。`,'查看教学大纲与原工作室准备')
 if(course.businesses.length)return scene('一间小小的教室，先从准备开始。','资金、案例、大纲、样课和工具资格，各有自己的前提。','翻看已经做过的准备','已有工作室与历史原账继续保留；新的课和学员仍需你明确选择。','核对课程准备、案例与原账')
 return null
}
