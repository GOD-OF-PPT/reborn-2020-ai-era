import type {CourseProjection} from '../core/course-projection.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {addDays} from '../core/calendar.ts'
import {dayBefore} from '../core/operations-calendar.ts'
import {COURSE_JOBS} from '../content/course.ts'
import {moneyText,playableThrough} from './game-text.ts'
import type {CourseSceneTarget,CourseSceneContext,CourseSceneProgress,CourseSceneResultRef} from './course-scene-progress.ts'

type View=NonNullable<CourseProjection>
type Target=Extract<CourseSceneTarget,{kind:'audience'|'cohort'}>
type Cohort=View['cohorts'][number]
const id=(value:unknown):value is string=>typeof value==='string'&&value.length>0&&value.length<=512&&value.trim().length>0&&!/[\u0000-\u001f\u007f]/.test(value)
const active=(job:ProductionJob|null|undefined)=>job?.status==='planned'||job?.status==='running'

/** A saved update is already arranged; its original job supplies the next visible wait. */
export function courseRefreshProgress(course:View,date:string,target:Extract<CourseSceneTarget,{kind:'course'|'audience'|'cohort'}>,context?:CourseSceneContext):CourseSceneProgress|null{
 const lesson=course.courses.find(c=>c.id===target.courseId&&c.businessId===target.businessId)
 if(!lesson)return null
 const rows=lesson.refreshes.filter(refresh=>!refresh.applied&&active(refresh.job))
 if(!rows.length)return null
 const refresh=rows[0]!,jobs=context?.operations?.jobs.filter(job=>job.id===refresh.jobId)??(refresh.job?[refresh.job]:[]),job=jobs[0]
 const refs:CourseSceneResultRef[]=[{kind:'course',id:lesson.id,date:lesson.createdAt}]
 if(target.kind==='audience'){const a=course.audiences.find(a=>a.id===target.audienceId);if(a)refs.push({kind:'audience',id:a.id,date:a.createdAt})}
 if(target.kind==='cohort'){const co=course.cohorts.find(co=>co.id===target.cohortId);if(co)refs.push({kind:'cohort',id:co.id,date:co.createdAt})}
 if(rows.length!==1||jobs.length!==1||!job||!active(job)||job.businessId!==target.businessId||job.definitionId!==`course-refresh-${lesson.productId}-${lesson.topicId}`)return {phase:'course-refresh-unavailable',title:'先核对这门课的原更新。',line:lesson.name+'的原更新任务身份暂不可核对，没有另排一次。',choice:{title:'核对原更新',line:'原课程、学员和任务保留；请翻看本课程的实际更新记录。',label:'翻看本课程原更新记录'},target,invalidReason:'原更新任务不能唯一匹配，请核对原记录。',outcome:'none',resultRefs:refs}
 const definition=COURSE_JOBS.find(d=>d.id===job.definitionId)!,planned=job.status==='planned',at=planned?job.startAt:job.completeAt,waitDate=at<date?date:at
 refs.push({kind:'job',id:job.id,date:job.startAt})
 const resources=job.resources.map(id=>course.resources.find(r=>r.id===id)?.label??'原安排的教学成员').join('、')
 return {phase:planned?'course-refresh-planned':'course-refresh-running',title:planned?'这份旧课更新，已经留在日历。':'这份旧课，正在实际更新。',line:`${lesson.name} · ${job.startAt}—${job.completeAt}。`,choice:{title:'等这份原更新真正完成',line:`${resources} · ${moneyText(definition.costFen)} / ${definition.actionPoints}点 / ${definition.durationDays}日；${planned?'已预留，尚未实付或使用行动。':'已开工，成本与行动已按原账承担。'}实际完成后才覆盖本次绑定的更新；旧教学、支持和退款期限照常。`,label:'翻看这份已安排的原更新'},target,recordId:job.id,invalidReason:null,outcome:'pending',resultRefs:refs,...(waitDate<=playableThrough?{waitDate,wait:{date:waitDate,label:planned?'等这份原更新实际开工':'等这份原更新实际完成'}}:{})}
}

/** Only an original member of this cohort may resolve a dated teaching/support attempt. */
export function courseCohortJob(course:View,co:Cohort,jobId:string,context?:CourseSceneContext):ProductionJob|null{
 const matches=course.cohorts.flatMap(row=>[...row.stageJobs.flat().filter(j=>j?.id===jobId).map(job=>({cohort:row.id,job})),...row.supportJobs.filter(s=>s.jobId===jobId).map(s=>({cohort:row.id,job:s.job}))])
 const jobs=context?.operations?.jobs.filter(j=>j.id===jobId)??matches.flatMap(m=>m.job?[m.job]:[])
 if(matches.length!==1||matches[0]!.cohort!==co.id||jobs.length!==1)return null
 const job=jobs[0]!,c=course.courses.find(c=>c.id===co.courseId)
 if(!c||job.businessId!==c.businessId)return null
 const stages=co.stages.filter(s=>s.attempts.some(a=>a.jobId===jobId)),slots=co.supportJobs.filter(s=>s.jobId===jobId)
 if(stages.length+slots.length!==1)return null
 if(stages.length===1&&job.definitionId!==`course-stage-${c.productId}-${c.topicId}`||slots.length===1&&job.definitionId!==`course-support-${c.productId}-${slots[0]!.mode}`)return null
 return job
}

export function courseCohortTargetReason(course:View,target:Target,context?:CourseSceneContext):string|null{
 const values=[target.businessId,target.courseId,target.kind==='audience'?target.audienceId:target.cohortId,...(target.kind==='cohort'&&target.jobId!==undefined?[target.jobId]:[])]
 if(!values.every(id)||new Set(values).size!==values.length)return '原受众、班期或任务身份为空或冲突，请重新选择。'
 const courses=course.courses.filter(c=>c.id===target.courseId)
 if(courses.length!==1||courses[0]!.businessId!==target.businessId)return '原受众或班期不属于这门课与工作室，没有换到另一班。'
 if(target.kind==='audience'){
  const rows=course.audiences.filter(a=>a.id===target.audienceId),a=rows[0]
  if(rows.length!==1||a!.courseId!==target.courseId)return '原受众报价不属于这门课，没有换成另一批受众。'
  if(a!.mode==='paid'){
   const jobs=context?.operations?.jobs.filter(j=>j.id===a!.jobId)??(a!.job?[a!.job]:[])
   if(jobs.length!==1||jobs[0]!.businessId!==target.businessId||jobs[0]!.definitionId!=='course-marketing'||a!.job?.id!==a!.jobId)return '原获客任务已不能匹配，没有改成另一项推广。'
  }else if(a!.jobId!==null||a!.job!==null)return '原视频受众记录含有冲突任务，请重新选择。'
  return null
 }
 const rows=course.cohorts.filter(co=>co.id===target.cohortId),co=rows[0]
 if(rows.length!==1||co!.courseId!==target.courseId||course.audiences.filter(a=>a.id===co!.audienceId&&a.courseId===target.courseId).length!==1)return '原班期与课程或原受众报价不匹配，没有换成另一班。'
 if(target.jobId!==undefined&&!courseCohortJob(course,co!,target.jobId,context))return '原教学或支持尝试已不可匹配，没有改成最新任务；请重新选择。'
 return null
}

/** Derives one explicitly selected offer/class; never chooses a global first cohort. */
export function courseCohortProgress(course:View,date:string,target:Target,context?:CourseSceneContext):CourseSceneProgress{
 const c=course.courses.find(c=>c.id===target.courseId)!,b=course.businesses.find(b=>b.id===target.businessId)!,p=course.catalog.products.find(p=>p.id===c.productId)!
 const refs:CourseSceneResultRef[]=[{kind:'course',id:c.id,date:c.createdAt}]
 const make=(phase:string,title:string,line:string,terms:string,label:string,intent?:CourseSceneProgress['teachingIntent'],outcome:CourseSceneProgress['outcome']='pending'):CourseSceneProgress=>({phase,title,line,choice:{title,line:terms,label},invalidReason:null,outcome,resultRefs:[...refs],target,recordId:target.kind==='audience'?target.audienceId:target.jobId??target.cohortId,...(intent?{teachingIntent:intent}:{})})
 const wait=(progress:CourseSceneProgress,at:string,label:string):CourseSceneProgress=>at>playableThrough?progress:{...progress,waitDate:at,wait:{date:at<date?date:at,label}}
 const jobScene=(job:ProductionJob,name:string,identity:string):CourseSceneProgress=>{
  const definition=COURSE_JOBS.find(d=>d.id===job.definitionId),resources=job.resources.map(id=>course.resources.find(r=>r.id===id)?.label??'原安排的教学成员').join('、')
  const status=job.status==='planned'?'已预留，尚未实付或使用行动。':job.status==='running'?'已开工，成本与行动已按原账承担。':job.status==='completed'?'已实际完成，已耗成本与行动保留。':job.status==='cancelled'?'未开工安排已取消，预留按原账释放。':'中断未完成，已耗成本与行动保留。'
  const result=make(`course-${name}-${job.status}`,job.status==='planned'?(name==='audience'?'这次推广，已经排进日历。':'这一段，已经留在日历。'):job.status==='running'?(name==='audience'?'这次推广，正在进行。':'这一次，把答应的事真正做完。'):job.status==='completed'?'这一段，已经实际完成。':'这一次安排，已经停下。',`${identity} · ${job.startAt}—${job.completeAt}。`,`${resources} · ${definition?`${moneyText(definition.costFen)} / ${definition.actionPoints}点 / ${definition.durationDays}日；`:''}${status}${name==='stage'?'教学实际交付才释放原保护、确认阶段收入；不是又收一笔钱。':name==='audience'?'推广实际完成才留下本次实际受众；不是报名或收入。':'支持完成与学员实际反馈、退款窗口分别核对。'}`,name==='audience'?'翻看这次推广的原安排':'翻看本班这项原安排',undefined,active(job)?'pending':job.status==='completed'?'actual':'non-success')
  return active(job)?wait(result,job.status==='planned'?job.startAt:job.completeAt,`等${name==='audience'?'这次推广':'本班这段'+(name==='stage'?'教学':'支持')}实际${job.status==='planned'?'开工':'完成'}`):{...result,historical:true}
 }
 if(target.kind==='audience'){
  const a=course.audiences.find(a=>a.id===target.audienceId)!
  refs.push({kind:'audience',id:a.id,date:a.createdAt})
  if(a.job&&active(a.job))return jobScene(a.job,'audience',c.name+' · 本次原报价'+moneyText(a.priceFen))
  if(a.completedAt===null)return make('course-audience-stopped','这次获客，没有实际完成。',c.name+'的这份报价与原投入仍保留。','没有把中断记成受众或收入；可另行明确获客，原班责任继续。','翻看原获客与有限退出',undefined,'non-success')
  const refresh=courseRefreshProgress(course,date,target,context);if(refresh)return refresh
  if(c.unresolvedUpdates.length)return make('course-cohort-update-required','工具已经变了，先看清原更新。',`${c.name}更新期限${c.unresolvedUpdates.map(u=>u.dueAt).sort()[0]}。`,'原更新实际完成后再决定新班，旧班教学与退款仍须处理。','核对这门课的原更新','refresh')
  if(c.status!=='ready'||c.paused||b.lifecycle!=='operating'||c.qualificationReasons.length)return make('course-audience-blocked','这份实际受众还在，新班条件需要核对。',`${c.name} · 原报价${moneyText(a.priceFen)}。`,'原暂停、工具资格与经营控制没有因获客完成而解除；不自动开班或收费。','查看原条件与这份受众')
  return make(a.eligibleMembers.length?'course-audience-ready':'course-audience-empty',a.eligibleMembers.length?'先听清需要，再把承诺定下来。':'这次报价，没有留下实际意向。',`${c.name} · ${a.completedAt}实际覆盖${a.members.length}人，基础意向${a.eligibleMembers.length}人。`,`${moneyText(a.priceFen)}是本次原报价；购买身份与所选承诺仍须重新核对，不保证报名。${a.eligibleMembers.length?'显选班额、日期、支持和资源，先预留自有资金与行动。':'原投入不退，是否另作报价或停止由你决定。'}`,a.eligibleMembers.length?'明确本班期限与真实支持':'翻看本次原受众与报价',a.eligibleMembers.length?'plan':undefined,a.eligibleMembers.length?'actual':'non-success')
 }
 const co=course.cohorts.find(co=>co.id===target.cohortId)!,identity=c.name+' · '+co.startAt+'班',paid=co.students.filter(s=>s.paidRemainingFen>0)
 refs.push({kind:'cohort',id:co.id,date:co.createdAt})
 if(target.jobId!==undefined){const job=courseCohortJob(course,co,target.jobId,context)!;refs.push({kind:'job',id:job.id,date:job.status==='completed'?job.completeAt:job.releasedAt??job.startAt});return jobScene(job,co.stages.some(st=>st.attempts.some(a=>a.jobId===job.id))?'stage':co.supportJobs.find(s=>s.jobId===job.id)?.recovery?'recovery':'support',identity)}
 const ledger=`冻结单价${moneyText(co.priceFen)} · 留存${paid.length}/${co.seatLimit}人；退款窗口至${co.refundUntil}。`
 if(co.closedAt!==null){const refunded=co.students.some(s=>s.refundedFen>0);return make('course-cohort-closed',!co.students.length?'这期没有等来学员。':!paid.length?'这堂课，以原退款收场。':refunded?'这堂课留下学习，也留下退款。':'这期的承诺与原账，已经收好。',`${identity} · ${co.closedAt}实际收尾。`,`${ledger}原结算费${moneyText(co.feeFen)}；学习、退款及购买身份保留，不是新的现金或重复收费资格。`,'翻看本班学习与原账',undefined,co.students.length&&!paid.length?'non-success':'actual')}
 if(co.feePostedAt!==null)return make('course-cohort-settling','课程窗口已过，原账仍待付清。',identity,`${ledger} ${co.feePostedAt}登记结算费${moneyText(co.feeFen)}；入账不是实付，原退款应付与费用必须继续核对。`,'翻看原费用与未付责任')
 const refresh=courseRefreshProgress(course,date,target,context);if(refresh)return refresh
 if(c.unresolvedUpdates.length)return make('course-cohort-update-required','工具已经变了，旧学员还在等。',`${identity} · 更新期限${c.unresolvedUpdates.map(u=>u.dueAt).sort()[0]}。`,`${ledger}更新不创造新购买资格；原教学、支持与退款继续，不能因新准备隐藏。`,'安排原更新或翻看旧责任','refresh')
 if(co.teachingCancelled)return wait(make('course-teaching-cancelled','原教学停下了，未交付与退款仍在。',identity,`${ledger}未按期完成的教学不会免费补完；原退款记录可能仍有应付，任务与成本须另核。`,'核对原学员退款与安排',date<=co.refundUntil&&paid.length?'refund':undefined,'non-success'),addDays(co.refundUntil,1),'等原退款窗口后的结算，沿途责任照常')
 if(!paid.length){
  if(date<co.startAt&&co.status==='open'&&!co.enrollmentPaused&&!c.paused&&b.lifecycle==='operating')return make('course-cohort-enroll','班额已经约定，还要有人愿意来。',identity,`${ledger}当前未购买的实际意向${co.availablePeople.length}人；显选实际成员收受保护预款，预款不是收入，原支持已经预留。`,'明确本班实际报名成员','enroll')
  return wait(make('course-cohort-no-learners','本班没有留存学员，原安排仍在。',identity,`${ledger}空班或退款不会自动取消原支持，已耗成本仍保留。`,'翻看原安排、退款与有限退出',undefined,'non-success'),addDays(co.refundUntil,1),'等原窗口收尾，先处理沿途事项')
 }
 const needs=paid.filter(s=>s.outcome==='needs_recovery')
 if(needs.length||co.status==='remedy'&&!co.supportSatisfied){
  const pending=co.supportJobs.find(s=>s.recovery&&active(s.job))
  if(pending?.job)return jobScene(pending.job,'recovery',identity)
  return make('course-recovery-needed','有人还没跟上，把原承诺接住。',`${identity} · ${needs.length}名学员仍需帮助。`,`${ledger}补救须在${co.remedyDueAt}实际完成；显选真实支持与资源，或按原流水退款，不保证免费解决。`,'明确补支持或原学员退款',date<=co.remedyDueAt?'recovery':'refund')
 }
 const stage=co.stages.find(s=>s.deliveredAt===null)
 if(stage){
  const activeJob=co.stageJobs[stage.index]?.find(active)
  if(activeJob)return jobScene(activeJob,'stage',identity)
  let latestStart=stage.dueAt;for(let n=0;n<p.stageDays;n++)latestStart=dayBefore(latestStart)
  if(date>latestStart)return make('course-stage-overdue','原来的教学期限，需要先面对。',`${identity} · 第${stage.index+1}段最迟${stage.dueAt}完成。`,`${ledger}已经不能按原时长如期完成，核对未交付与原退款。`,'核对原阶段与退款','refund','non-success')
  return {...make('course-stage-needed',stage.index===0?'这堂课，已经有人在等。':'第一段交出后，把下一段认真讲完。',`${identity} · ${paid.length}名实际学员。`,`${ledger}第${stage.index+1}段${p.stageAP}点 / ${p.stageDays}日；最晚${latestStart}开工、${stage.dueAt}完成。先显选资源与日期，完成才释放保护并确认收入。`,'选择第'+(stage.index+1)+'段资源与日期',stage.index===0?'stage:0':'stage:1'),stage:{cohortId:co.id,courseId:c.id,index:stage.index,dueAt:stage.dueAt,days:p.stageDays,actionPoints:p.stageAP}}
 }
 const support=co.supportJobs.find(s=>!s.recovery&&active(s.job))
 if(support?.job)return jobScene(support.job,'support',identity)
 if(!co.supportSatisfied)return wait(make('course-support-incomplete','讲完了课，原支持还没有兑现。',identity,`${ledger}实际支持与学习反馈仍待核对；补支持或退款沿原窗口，不把中断当完成。`,'核对原支持、补救与退款','recovery'),addDays(co.supportCompleteAt,1),'等本班原支持期限的实际处理')
 return wait(make('course-refund-window','内容交出了，还要留住原退款窗口。',identity,`${ledger}实际反馈已记录，结算费在窗口结束后按原留存确认收入5%登记；当前尚未结清。`,'翻看本班实际学员与原退款','refund'),addDays(co.refundUntil,1),'等本班退款窗口后的原结算')
}

