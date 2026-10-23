import type {CommandEnvelope} from '../core/run-types.ts'
import type {CourseProjection} from '../core/course-projection.ts'
import type {WorkerInstance} from '../core/operations-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {COURSE_JOBS} from '../content/course.ts'
import {addDays,isoDate} from '../core/calendar.ts'
import {MONEY_LIMIT,sumMoney} from '../core/money.ts'
import {moneyText} from './game-text.ts'
import {courseResourceLabel} from './course-resource-labels.ts'
import {supportModeText} from './AgentSupportChoice.tsx'
import {CourseRefundDetails} from './CourseRefundDetails.tsx'

type Props={command:CommandEnvelope;course:CourseProjection;workers?:readonly WorkerInstance[]|undefined;view?:PlayingView|undefined;confirm?:CommandPreview|undefined;accountName?:((id:string)=>string)|undefined}
const kinds=new Set(['CreateCourseAudience','PlanCourseCohort','EnrollCourseAudience','StartCourseStage','StartCourseRecovery','StartCourseRefresh','RefundCourseLearners'])
const object=(value:unknown):Record<string,unknown>|null=>value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null
const unique=<T,>(rows:readonly T[],predicate:(row:T)=>boolean)=>{const matches=rows.filter(predicate);return matches.length===1?matches[0]:undefined}
const strings=(value:unknown,min=1,max=240):value is string[]=>Array.isArray(value)&&value.length>=min&&value.length<=max&&value.every(v=>typeof v==='string'&&v.length>0)&&new Set(value).size===value.length
const fen=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=MONEY_LIMIT
const recheck=()=> <p className="warning-box">这次教学承诺的对象或条件已变化，请返回逐项重新核对。</p>
const after=(date:unknown,days:number,current:string)=>{try{if(typeof date!=='string')return null;isoDate(date);return date>=current?addDays(date,days):null}catch{return null}}

/** Original cohort money and refund obligations; no balance difference is treated as profit or a payment. */
export function courseCohortFinancials(course:CourseProjection,view:PlayingView,cohortId:string){
 const co=course?.cohorts.find(c=>c.id===cohortId),lesson=co?course?.courses.find(c=>c.id===co.courseId):undefined,b=lesson?course?.businesses.find(b=>b.id===lesson.businessId):undefined
 const finance=(view.features as unknown as PlayFeatures).workbench?.finance.find(a=>a.accountId===b?.accountId)
 if(!course||!co||!lesson||!b||!finance)return null
 const contract=unique(finance.contracts,c=>c.id===co.id)
 if(co.students.length&&!contract)return null
 const refunds=course.refunds.filter(r=>r.cohortId===co.id),operationIds=new Set(refunds.flatMap(r=>r.operationIds)),owed=finance.obligations.filter(o=>o.contractId===co.id),refundOwed=owed.filter(o=>(o.kind==='refund_undelivered'||o.kind==='refund_delivered')&&operationIds.has(o.originOperationId))
 try{
  const receivedFen=sumMoney(finance.transactions.filter(t=>t.contractId===co.id&&t.amountFen>0).map(t=>t.amountFen)),refundRegisteredFen=sumMoney(refunds.flatMap(r=>[r.undeliveredFen,r.deliveredFen])),refundDueFen=sumMoney(refundOwed.map(o=>o.remainingFen)),refundPaidFen=refundRegisteredFen-refundDueFen
  const feePostedFen=co.feePostedAt===null?0:co.feeFen,feeDueFen=sumMoney(owed.filter(o=>o.kind==='expense').map(o=>o.remainingFen)),feePaidFen=feePostedFen-feeDueFen
  const protectionIds=new Set([contract?.protectionReservationId,...refundOwed.map(o=>o.protectionReservationId)].filter((id):id is string=>typeof id==='string'))
  const protectedFen=sumMoney(finance.reservations.filter(r=>r.status==='active'&&protectionIds.has(r.id)).map(r=>r.amountFen)),unearnedFen=contract?.prepaidFen??0,recognizedFen=contract?.recognizedIncomeFen??0,totalDueFen=sumMoney(owed.map(o=>o.remainingFen))
  if(![receivedFen,refundRegisteredFen,refundDueFen,refundPaidFen,feePostedFen,feeDueFen,feePaidFen,protectedFen,unearnedFen,recognizedFen,totalDueFen].every(fen))return null
  return {receivedFen,protectedFen,unearnedFen,recognizedFen,refundRegisteredFen,refundPaidFen,refundDueFen,feePostedFen,feePaidFen,feeDueFen,totalDueFen}
 }catch{return null}
}

/** These are the exact captured terms being confirmed, not the result of the command. */
export function CourseTeachingDetails({command,course,workers,view,confirm,accountName}:Props){
 if(!kinds.has(command.kind))return null
 if(command.kind==='RefundCourseLearners')return <CourseRefundDetails command={command} course={course} view={view} confirm={confirm} accountName={accountName}/>
 const p=object(command.payload)
 if(!p||!course||!view||command.runId!==view.runId||command.expectedRevision!==view.revision||view.readOnly||view.hasCandidate)return recheck()
 const co=typeof p.cohortId==='string'?unique(course.cohorts,c=>c.id===p.cohortId):undefined
 const lesson=unique(course.courses,c=>c.id===(co?.courseId??p.courseId)),b=lesson?unique(course.businesses,b=>b.id===lesson.businessId):undefined,original=b?unique(view.operations?.businesses??[],o=>o.id===b.id):undefined
 if(!lesson||!b||!original||b.route!=='ai_course'||original.route!==b.route||b.accountId!==original.accountId||!unique(view.accounts,a=>a.accountId===b.accountId))return recheck()
 const account=accountName?.(b.accountId)??(b.company?'本课程企业账户':'本课程经营分账'),identity=<p><strong>{lesson.name}{co?' · '+co.startAt+'班':''}</strong> · {account}。</p>
 const resourceLabels=(value:unknown,min=1,max=1)=>strings(value,min,max)&&value.every(id=>unique(course.resources,r=>r.id===id))?value.map(id=>id==='player-production'?'由我自己承担':courseResourceLabel(id,course.resources,workers)).join('、'):null
 if(command.kind==='CreateCourseAudience'){
  const product=unique(course.catalog.products,item=>item.id===lesson.productId)
  if(!product||!fen(p.priceFen)||p.priceFen<product.minPriceFen||p.priceFen>product.maxPriceFen||p.mode!=='paid'&&p.mode!=='video_referral')return recheck()
  if(p.mode==='video_referral'){
   if(!strings(p.videoCohortIds,1,96)||p.videoCohortIds.some(id=>!unique(course.videoCohorts,row=>row.id===id&&row.segment===lesson.segment&&row.date<=view.date)))return recheck()
   return <section className="confirmation-context course-teaching-terms"><h3>让已有受众看见这门课</h3>{identity}<p>本次报价{moneyText(p.priceFen)}；明确使用{p.videoCohortIds.length}份同受众的已有记录。保存后才核对实际合格意向，尚未建立班期、收取预款或确认教学收入。</p>{p.videoCohortIds.map(id=>{const source=course.videoCohorts.find(row=>row.id===id)!;return <p key={id}>{source.date}的已有受众记录 · 实际{source.members}人；意向与报名仍须分别决定。</p>})}</section>
  }
  const job=COURSE_JOBS.find(j=>j.id==='course-marketing')!,resources=resourceLabels(p.resources),completion=after(p.startAt,job.durationDays,view.date)
  if(!resources||!completion)return recheck()
  return <section className="confirmation-context course-teaching-terms"><h3>这次推广与报价</h3>{identity}<p>本次报价{moneyText(p.priceFen)}。资源：{resources}；{String(p.startAt)}开工，预计{completion}反馈。</p><p>由本课程自有资金承担上方原确认投入；完成后才出现实际受众与合格意向，不保证报名、满班或收入。预计不等于实际完成。</p></section>
 }
 if(command.kind==='PlanCourseCohort'){
  const audience=unique(course.audiences,a=>a.id===p.audienceId&&a.courseId===lesson.id&&a.completedAt!==null),resources=resourceLabels(p.resources,1,3)
  const mode=typeof p.supportMode==='string'?p.supportMode:'',job=COURSE_JOBS.find(j=>j.id===`course-support-${lesson.productId}-${mode}`),completion=job?after(p.supportStartAt,job.durationDays,view.date):null
  if(!audience||!resources||!job||!completion||typeof p.startAt!=='string'||typeof p.endAt!=='string'||!fen(p.seatLimit)||p.seatLimit<1||p.seatLimit>240||p.promise!=='clear_scope'&&p.promise!=='accelerated_results')return recheck()
  try{isoDate(p.startAt);isoDate(p.endAt);if(p.startAt<=view.date||p.endAt<p.startAt)return recheck()}catch{return recheck()}
  const deployment=typeof p.deploymentId==='string'?(view.features as unknown as PlayFeatures).story?.deployments.find(d=>d.id===p.deploymentId&&d.businessId===b.id):undefined
  if((mode==='assisted_group'||mode==='delegated_group')&&!deployment)return recheck()
  return <section className="confirmation-context course-teaching-terms"><h3>这一班将承担的承诺</h3>{identity}<p>从{p.startAt}开课，最迟{p.endAt}完成教学；最多{p.seatLimit}人。单价沿所选受众记录冻结为{moneyText(audience.priceFen)}，本次不能临时改价。</p><p>承诺：{p.promise==='clear_scope'?'明确范围与练习目标':'更激进的加速承诺，更多意向及投诉风险'}。</p><p>支持方式：{supportModeText[mode]}；资源：{resources}；{String(p.supportStartAt)}开始，预计{completion}完成。{deployment?'使用已明确选择的原部署 '+deployment.id.slice(-6)+'，范围、期限、预算仍由原预览核对。':''}</p><p>保存这一步就为原支持预留资金、资源和对应季度行动；之后不重复安排原支持。当前没有学员预款或教学收入，报名和收款需要另行确认。教学两段各自安排；退款窗口延续至支持整改期结束。</p></section>
 }
 if(command.kind==='EnrollCourseAudience'){
  if(!co||!strings(p.personIds)||p.personIds.some(id=>!co.availablePeople.includes(id))||!confirm?.allowed||!fen(confirm.receivedPrepaymentFen)||!fen(confirm.protectedIncreaseFen))return recheck()
  const audience=course.audiences.find(a=>a.id===co.audienceId&&a.courseId===lesson.id)
  if(!audience||p.personIds.some(id=>!audience.members.includes(id)))return recheck()
  return <section className="confirmation-context course-teaching-terms"><h3>这次明确接下的学员</h3>{identity}<p>冻结单价{moneyText(co.priceFen)} · {p.personIds.length}位实际合格意向。收到预款{moneyText(confirm.receivedPrepaymentFen)}，同时增加保护{moneyText(confirm.protectedIncreaseFen)}；本次教学收入仍为¥0。</p>{p.personIds.map(id=><p key={id}>本次选择：原受众意向{audience.members.indexOf(id)+1}。</p>)}<p>原支持已安排至{co.supportCompleteAt}，退款窗口至{co.refundUntil}。完成实际教学后才按阶段释放保护、确认收入；这笔预款不能替代本应先准备的自有资金。</p></section>
 }
 if(command.kind==='StartCourseStage'||command.kind==='StartCourseRecovery'||command.kind==='StartCourseRefresh'){
  const index=p.index
  if(command.kind==='StartCourseStage'&&(!co||index!==0&&index!==1))return recheck()
  const mode=typeof p.supportMode==='string'?p.supportMode:'',jobId=command.kind==='StartCourseStage'?`course-stage-${lesson.productId}-${lesson.topicId}`:command.kind==='StartCourseRecovery'?`course-support-${lesson.productId}-${mode}`:`course-refresh-${lesson.productId}-${lesson.topicId}`,job=COURSE_JOBS.find(j=>j.id===jobId),resources=resourceLabels(p.resources),completion=job?after(p.startAt,job.durationDays,view.date):null
  if(!resources||!job||!completion||command.kind==='StartCourseRecovery'&&!co)return recheck()
  if(command.kind==='StartCourseRecovery'&&(mode==='assisted_group'||mode==='delegated_group')&&!(view.features as unknown as PlayFeatures).story?.deployments.some(d=>d.id===p.deploymentId&&d.businessId===b.id))return recheck()
  return <section className="confirmation-context course-teaching-terms"><h3>{command.kind==='StartCourseStage'?'第'+(Number(index)+1)+'段教学安排':command.kind==='StartCourseRecovery'?'这次补支持的承诺':'这次旧课更新'}</h3>{identity}<p>资源：{resources}；{String(p.startAt)}开工 → 预计{completion}完成（{job.durationDays}日）。{command.kind==='StartCourseRecovery'?'支持方式：'+supportModeText[mode]+'。':''}</p><p>{command.kind==='StartCourseStage'?'本段最迟'+co!.stages[Number(index)]!.dueAt+'实际完成。安排和开工不确认收入；真实完成后才释放原保护并确认本段收入，不重复收款。':command.kind==='StartCourseRecovery'?'整改期限'+co!.remedyDueAt+'。实际完成后再核对已公开的学习反馈，不保证新收入。':'原学员更新不另收费；实际完成后仍须核对当前资格与全部旧承诺。'}{co?'原退款窗口至'+co.refundUntil+'。':''}预计不等于实际完成，已耗成本照原账保留；原支持、退款责任继续保留。</p></section>
 }
 return null
}
