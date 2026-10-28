import type {CourseProjection} from '../core/course-projection.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {MONEY_LIMIT} from '../core/money.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {moneyText} from './game-text.ts'
import {sceneCashResult} from './scene-cash-result.ts'

type CourseView=NonNullable<CourseProjection>
type Cohort=CourseView['cohorts'][number]
const active=(job:ProductionJob|null|undefined)=>job?.status==='planned'||job?.status==='running'
const scheduled=(job:ProductionJob)=>`${job.startAt}—${job.completeAt}，${job.status==='planned'?'已安排，尚未开工':'已实际开工，尚未完成'}`
const sum=(values:readonly number[]):number|null=>{
 if(values.some(n=>!Number.isSafeInteger(n)||n<0||n>MONEY_LIMIT))return null
 const total=values.reduce((n,value)=>n+BigInt(value),0n)
 return total<=BigInt(MONEY_LIMIT)?Number(total):null
}
function originalClass(features:PlayFeatures,cohort:Cohort){
 const course=features.course?.courses.filter(c=>c.id===cohort.courseId)
 if(course?.length!==1)return null
 const lesson=course[0]!,businesses=features.course!.businesses.filter(b=>b.id===lesson.businessId)
 if(businesses.length!==1)return null
 const business=businesses[0]!,original=features.workbench.finance.filter(a=>a.accountId===business.accountId)
 if(original.length!==1||business.route!=='ai_course')return null
 return {lesson,business,finance:original[0]!,label:`「${lesson.name}」· ${cohort.startAt}班`}
}

/** Public deltas from one committed original command; records never stand in for cash payments. */
export function courseTeachingSceneResult(kind:string,previous:PlayingView|null,current:PlayingView):string|null{
 const receipt=current.receipts.at(-1)
 if(!previous||previous.runId!==current.runId||current.revision!==previous.revision+1||current.saveStatus!=='saved'||current.hasCandidate||current.readOnly||receipt?.kind!==kind||receipt.revisionAfter!==current.revision)return null
 const before=previous.features as unknown as PlayFeatures,after=current.features as unknown as PlayFeatures,a=before.course,b=after.course
 if(!a||!b)return null
 if(kind==='FundBusiness'){
  const changed=b.businesses.filter(row=>a.businesses.some(old=>old.id===row.id&&row.funds.cashFen>old.funds.cashFen&&row.metrics.incomeFen===old.metrics.incomeFen))
  const company=changed.length===1?changed[0]:undefined,old=a.businesses.find(row=>row.id===company?.id)
  const personalBefore=before.workbench.finance.find(row=>row.accountId==='personal'),personalAfter=after.workbench.finance.find(row=>row.accountId==='personal')
  if(company&&old&&personalBefore&&personalAfter&&personalBefore.cashFen-personalAfter.cashFen===company.funds.cashFen-old.funds.cashFen)return `你为原课程企业追加了自有资本${moneyText(company.funds.cashFen-old.funds.cashFen)}。这是个人资金转入，未产生课程收入，也没有替你开班或招生。`
 }
 if(kind==='CreateCourseAudience'){
  const added=b.audiences.filter(row=>!a.audiences.some(old=>old.id===row.id)),audience=added.length===1?added[0]:undefined
  const lesson=b.courses.find(c=>c.id===audience?.courseId)
  if(audience&&lesson){
   if(audience.job&&active(audience.job))return `「${lesson.name}」的这次推广${scheduled(audience.job)}。完成后才看真实需求；报价和意向都不是报名或学费收入。`
   if(audience.mode==='video_referral'&&audience.completedAt!==null)return `「${lesson.name}」已有这次受众需求记录：实际覆盖${audience.members.length}人，基础意向${audience.eligibleMembers.length}人。尚未开班或报名，不保证之后满班。`
  }
 }
 if(kind==='PlanCourseCohort'){
  const added=b.cohorts.filter(row=>!a.cohorts.some(old=>old.id===row.id)),cohort=added.length===1?added[0]:undefined,context=cohort?originalClass(after,cohort):null
  if(cohort&&context&&cohort.students.length===0)return `${context.label}已经留下，最多${cohort.seatLimit}人；原支持按${cohort.supportCompleteAt}完成的约定预留。这一步尚未报名收款，原教学仍须分别安排。`
 }
 if(kind==='EnrollCourseAudience'){
  const rows=b.cohorts.flatMap(cohort=>{const old=a.cohorts.find(c=>c.id===cohort.id&&c.courseId===cohort.courseId);const students=old?cohort.students.filter(student=>!old.students.some(e=>e.id===student.id)):[];return students.length?[{cohort,students}]:[]})
  if(rows.length===1){
   const {cohort,students}=rows[0]!,context=originalClass(after,cohort),amount=sum(students.map(student=>student.priceFen))
   if(context&&amount!==null&&students.every(student=>student.cohortId===cohort.id&&student.courseId===cohort.courseId&&student.paidAt===current.date&&student.delivered.every(n=>n===0)))return `${context.label}新增${students.length}名实际学员，收到保护预款${moneyText(amount)}。本次课程收入仍为0；实际完成教学后才按原阶段释放保护。`
  }
 }
 if(kind==='StartCourseStage'){
  const rows=b.cohorts.flatMap(cohort=>cohort.stages.flatMap(stage=>stage.attempts.flatMap(attempt=>{
   const old=a.cohorts.find(c=>c.id===cohort.id),job=cohort.stageJobs[stage.index]?.find(j=>j?.id===attempt.jobId)
   return old&&!old.stages[stage.index]!.attempts.some(a=>a.jobId===attempt.jobId)&&job&&active(job)?[{cohort,stage,job}]:[]
  })))
  if(rows.length===1){const {cohort,stage,job}=rows[0]!,context=originalClass(after,cohort);if(context)return `${context.label}的第${stage.index+1}段教学${scheduled(job)}。真正完成才核对这段收入与原预款保护，没有提前记作交付。`}
 }
 if(kind==='StartCourseRecovery'){
  const rows=b.cohorts.flatMap(cohort=>cohort.supportJobs.flatMap(slot=>slot.recovery&&slot.job&&active(slot.job)&&a.cohorts.some(old=>old.id===cohort.id&&!old.supportJobs.some(s=>s.jobId===slot.jobId))?[{cohort,job:slot.job}]:[]))
  if(rows.length===1){const {cohort,job}=rows[0]!,context=originalClass(after,cohort);if(context)return `${context.label}的这次补支持${scheduled(job)}。学习结果仍等实际完成，原退款与整改期限没有因此延后。`}
 }
 if(kind==='StartCourseRefresh'){
  const rows=b.courses.flatMap(lesson=>lesson.refreshes.flatMap(refresh=>refresh.job&&active(refresh.job)&&a.courses.some(old=>old.id===lesson.id&&!old.refreshes.some(r=>r.jobId===refresh.jobId))?[{lesson,job:refresh.job}]:[]))
  if(rows.length===1){
   const {lesson,job}=rows[0]!,cash=sceneCashResult(before.workbench.finance,after.workbench.finance,previous.date,current.date,id=>id==='personal'?'个人':b.businesses.some(company=>company.accountId===id)?'课程':'经营')
   return `${cash?cash+' ':''}「${lesson.name}」的这次原材料更新${scheduled(job)}。实际完成后才覆盖本次绑定的更新；旧班教学、支持与退款责任仍继续。`
  }
 }
 if(kind==='InterruptJob'){
  const rows=b.cohorts.flatMap(cohort=>[...cohort.stageJobs.flat().filter((j):j is ProductionJob=>j!==null),...cohort.supportJobs.flatMap(s=>s.job?[s.job]:[])].flatMap(job=>{
   const old=a.cohorts.find(c=>c.id===cohort.id),prior=old?[...old.stageJobs.flat(),...old.supportJobs.map(s=>s.job)].find(j=>j?.id===job.id):null
   return active(prior)&&['cancelled','interrupted'].includes(job.status)?[{cohort,job}]:[]
  }))
  if(rows.length===1){const {cohort,job}=rows[0]!,context=originalClass(after,cohort);if(context)return `${context.label}的这项原任务已停下。${job.status==='cancelled'?'未开工安排已取消，原预留按原账释放':'已耗费用与行动保留，未完成部分没有变成交付'}；原学员、支持和退款责任仍须处理。`}
 }
 const facts:string[]=[]
 if(kind==='RefundCourseLearners'||kind==='AdvanceTime'){
  const added=b.refunds.filter(refund=>!a.refunds.some(old=>old.id===refund.id))
  const cohortIds=[...new Set(added.map(refund=>refund.cohortId))]
  for(const id of cohortIds){
   const cohort=b.cohorts.find(cohort=>cohort.id===id),context=cohort?originalClass(after,cohort):null,oldFinance=context?before.workbench.finance.find(f=>f.accountId===context.business.accountId):undefined
   if(!cohort||!context||!oldFinance)continue
   const records=added.filter(refund=>refund.cohortId===id),operationIds=new Set(records.flatMap(refund=>refund.operationIds))
   const unearned=sum(records.map(r=>r.undeliveredFen)),earned=sum(records.map(r=>r.deliveredFen))
   const paid=sum(context.finance.transactions.filter(t=>operationIds.has(t.id)&&t.contractId===id&&t.sourceId===id&&t.amountFen<0&&!oldFinance.transactions.some(old=>old.id===t.id)).map(t=>-t.amountFen))
   const owed=sum(context.finance.obligations.filter(o=>o.contractId===id&&operationIds.has(o.originOperationId)&&['refund_undelivered','refund_delivered'].includes(o.kind)).map(o=>o.remainingFen))
   if(unearned!==null&&earned!==null&&paid!==null&&owed!==null&&BigInt(unearned)+BigInt(earned)===BigInt(paid)+BigInt(owed))facts.push(`${context.label}按原款处理应退${moneyText(unearned+earned)}：未交付部分${moneyText(unearned)}、已交付收入冲减${moneyText(earned)}；本次实际付出${moneyText(paid)}${owed>0?`，仍欠${moneyText(owed)}，旧应付和保护继续保留`:'，本次应退款已按原账支付'}`)
  }
 }
 if(kind==='AdvanceTime'){
  for(const lesson of b.courses){
   const old=a.courses.find(c=>c.id===lesson.id)
   const completed=lesson.refreshes.filter(refresh=>refresh.applied&&refresh.job?.status==='completed'&&old?.refreshes.some(prior=>prior.jobId===refresh.jobId&&!prior.applied&&active(prior.job)))
   if(completed.length)facts.push(`「${lesson.name}」本次绑定的材料已实际更新；其他未覆盖更新与原学员承诺仍按各自记录核对，没有新增购买或学费`)
  }
  for(const audience of b.audiences){
   const old=a.audiences.find(row=>row.id===audience.id),lesson=b.courses.find(c=>c.id===audience.courseId)
   if(old&&lesson&&old.completedAt===null&&audience.completedAt!==null&&old.job?.id===audience.job?.id&&active(old.job)&&audience.job?.status==='completed')facts.push(`「${lesson.name}」这次推广已实际完成：实际覆盖${audience.members.length}人，基础意向${audience.eligibleMembers.length}人；意向尚未变成报名或收入`)
  }
  for(const cohort of b.cohorts){
   const old=a.cohorts.find(c=>c.id===cohort.id&&c.courseId===cohort.courseId),context=originalClass(after,cohort)
   if(!old||!context)continue
   for(const stage of cohort.stages){
    const prior=old.stages[stage.index],completedJob=cohort.stageJobs[stage.index]?.find(job=>job?.status==='completed'&&job.completeAt===stage.deliveredAt&&old.stageJobs[stage.index]?.some(prior=>prior?.id===job.id&&active(prior)))
    if(prior?.deliveredAt===null&&stage.deliveredAt!==null&&completedJob)facts.push(`${context.label}第${stage.index+1}段已实际交付${stage.amountFen>0?`，按原阶段确认收入${moneyText(stage.amountFen)}并释放相应保护；这不是又收到一笔学费`:'；没有对应学员的新增教学收入，原成本与安排仍保留'}`)
   }
   if(old.assessmentAt===null&&cohort.assessmentAt!==null&&cohort.assessmentAt<=current.date){
    const activeStudents=cohort.students.filter(student=>student.paidRemainingFen>0),helped=activeStudents.filter(student=>student.outcome==='helped').length,needs=activeStudents.filter(student=>student.outcome==='needs_recovery').length
    facts.push(`${context.label}已有实际学习反馈：${helped}人已得到承诺的帮助，${needs}人仍需帮助；原整改与退款期限继续保留`)
   }else{
    const completed=cohort.supportJobs.filter(slot=>slot.job?.status==='completed'&&old.supportJobs.some(prior=>prior.jobId===slot.jobId&&active(prior.job)))
    if(completed.length)facts.push(`${context.label}有${completed.length}项原支持实际完成，学习反馈仍按实际教学和学员记录核对`)
   }
   const recovered=cohort.students.filter(student=>student.recovered&&student.outcome==='helped'&&old.students.some(prior=>prior.id===student.id&&!prior.recovered))
   if(recovered.length)facts.push(`${context.label}的${recovered.length}位原学员已实际补足帮助，没有新增购买或学费收入`)
   if(old.feePostedAt===null&&cohort.feePostedAt!==null&&cohort.closedAt===null)facts.push(`${context.label}原窗口已到结算节点，原结算费${moneyText(cohort.feeFen)}已入账；本班未结应付仍须处理，尚未结清`)
  }
 }
 // Debt payment can close a class without advancing the calendar.
 for(const cohort of b.cohorts){
  const old=a.cohorts.find(c=>c.id===cohort.id&&c.courseId===cohort.courseId),context=originalClass(after,cohort)
  if(old?.closedAt===null&&cohort.closedAt!==null&&cohort.closedAt<=current.date&&context&&!context.finance.obligations.some(o=>o.contractId===cohort.id&&o.remainingFen>0))facts.push(`${context.label}已于${cohort.closedAt}实际结清${cohort.students.length===0?'，没有实际报名；原安排和成本仍保留':'；原学员的学习与退款记录仍可翻阅'}，没有自动开启新班`)
 }
 return facts.length?facts.join('；')+'。':null
}
