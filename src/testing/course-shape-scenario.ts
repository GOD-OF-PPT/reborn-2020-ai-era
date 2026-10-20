import {campaignCourse,campaignVideo,campaignStory,campaignOperations} from '../application/campaign.ts'
import {projectCourse} from '../core/course-projection.ts'
import {projectVideo} from '../core/video-projection.ts'
import {projectStory} from '../core/story-projection.ts'
import {actionBudget} from '../core/economy.ts'
import {addDays,quarterOf} from '../core/calendar.ts'
import {quarterLimit} from '../core/operations-calendar.ts'
import {RuleError} from '../core/errors.ts'
import {assertCourseMoney,assertCourseCashDelta} from './course-shape-assertions.ts'
import {StoryHarness} from './story-harness.ts'
import type {GameRun} from '../core/run-types.ts'

const products=['intro_recorded','practical_cohort','enterprise_training'] as const
const topics=['image_workflows','video_workflows'] as const
const editions=['foundation','advanced'] as const
const supports=['self_small','guided_group','assisted_group','delegated_group'] as const
export interface CourseShape{readonly id:string;readonly productId:typeof products[number];readonly topicId:typeof topics[number];readonly edition:typeof editions[number];readonly supportMode:typeof supports[number]}
export const COURSE_SHAPES:readonly CourseShape[]=products.flatMap(productId=>topics.flatMap(topicId=>editions.flatMap(edition=>supports.map(supportMode=>({id:[productId,topicId,edition,supportMode].join('--'),productId,topicId,edition,supportMode})))))
export class CourseShapePolicyRefusal extends Error{
 readonly code:string;readonly detail:unknown
 constructor(code:string,detail:unknown){super(code);this.name='CourseShapePolicyRefusal';this.code=code;this.detail=detail}
}
export interface CourseShapeCallbacks{readonly milestone?:(name:string,run:GameRun)=>void}
function check(value:unknown,message:string):asserts value{if(!value)throw Error(message)}
const c=(h:StoryHarness)=>{const p=projectCourse(h.run,campaignCourse);check(p,'PUBLIC_COURSE_REQUIRED');return p}
const v=(h:StoryHarness)=>{const p=projectVideo(h.run,campaignVideo);check(p,'PUBLIC_VIDEO_REQUIRED');return p}
const now=(h:StoryHarness)=>h.run.timeline.cursor.date
const at=(h:StoryHarness,date:string)=>h.at(date,{work:false})
const resources=['player-production']
const deadline='2025-12-31'
// Only the explicitly registered finite business failures are policy results.
const finiteReasons=new Set(['INSUFFICIENT_ACTION_POINTS','INSUFFICIENT_AVAILABLE_FUNDS','INSUFFICIENT_CAPACITY','COURSE_SUPPORT_UNAVAILABLE','OVERDUE_OBLIGATION','AGENT_INDEPENDENT_RISK_PENDING','AGENT_NOT_READY_FOR_BUSINESS','AGENT_SERVICE_FEE_OVERDUE','AGENT_CASH_LIMIT_EXCEEDED','AGENT_SCOPE_NOT_AUTHORIZED','AGENT_DEPLOYMENT_NOT_ACTIVE','AGENT_EXPANSION_NOT_AUTHORIZED'])
function send(h:StoryHarness,kind:string,payload:unknown){
 try{return h.send(kind,payload)}catch(error){
  let refusal:{result?:{status?:string;reasonCodes?:string[]}}|null=null
  try{refusal=JSON.parse(error instanceof Error?error.message:String(error))}catch{/* Non-command exceptions remain fatal. */}
  const reasons=refusal?.result?.reasonCodes
  if(refusal?.result?.status==='rejected'&&reasons?.length&&reasons.every(r=>finiteReasons.has(r)))throw new CourseShapePolicyRefusal('actual_command_refused',{date:now(h),kind,payload,reasons})
  throw error
 }
}
function qualified(h:StoryHarness,definition:string,from:string,to:string){
 try{campaignCourse.qualificationForJob(h.run,definition,from,to);return true}catch(error){if(error instanceof RuleError&&error.code==='COURSE_TOOL_QUALIFICATION_REQUIRED')return false;throw error}
}
function pointDate(h:StoryHarness,n:number,date=now(h)){
 let candidate=date
 for(let i=0;i<5;i++){
  if(candidate>deadline)throw new CourseShapePolicyRefusal('finite_2025_action_window_exhausted',{needed:n,date:candidate})
  if(actionBudget(h.run.economy,candidate).available>=n)return candidate
  candidate=quarterLimit(candidate)
 }
 throw Error('COURSE_SHAPE_POINT_SEARCH_GUARD')
}
function renew(h:StoryHarness,shape:CourseShape,mark:(name:string)=>void){
 const program=shape.topicId==='image_workflows'?'image_rights':'video_access'
 const channel=v(h).channels[0];check(channel,'ORIGINAL_CHANNEL_REQUIRED')
 const applications=v(h).applications.filter(a=>a.channelId===channel.id&&a.program===program)
 const active=applications.filter(a=>a.approved===true&&a.expiresAt!==null&&a.expiresAt>now(h)).sort((a,b)=>a.expiresAt!.localeCompare(b.expiresAt!)).at(-1)
 const cycle=applications.filter(a=>a.appliedAt>=(program==='image_rights'?'2024-12-01':'2025-01-01'))
 if(cycle.length>=3)throw new CourseShapePolicyRefusal('three_actual_qualification_refusals_or_finite_attempt_limit',{program,cycle})
 let date=active?.expiresAt??now(h)
 const last=applications.at(-1);if(last&&addDays(last.appliedAt,90)>date)date=addDays(last.appliedAt,90)
 if(date<now(h))date=now(h)
 date=pointDate(h,1,date)
 if(addDays(date,7)>deadline)throw new CourseShapePolicyRefusal('finite_2025_qualification_window_exhausted',{program,date,cycle})
 at(h,date);send(h,'ApplyVideoProgram',{channelId:channel.id,program,resources,startAt:date})
 const application=v(h).applications.at(-1);check(application?.job,'ACTUAL_QUALIFICATION_JOB_REQUIRED')
 at(h,application.job.completeAt);send(h,'DecideVideoProgram',{applicationId:application.id})
 const actual=v(h).applications.find(a=>a.id===application.id);check(actual?.resultRead&&actual.decidedAt!==null,'ACTUAL_QUALIFICATION_RESULT_REQUIRED')
 mark('qualification-'+program+'-'+cycle.length)
}
interface Schedule{startAt:string;stage1At:string;endAt:string;supportStartAt:string;supportCompleteAt:string}
function schedule(h:StoryHarness,shape:CourseShape):Schedule|null{
 const product=campaignCourse.catalog.products.find(p=>p.id===shape.productId)!,support=campaignOperations.catalog.jobs.find(j=>j.id===`course-support-${shape.productId}-${shape.supportMode}`)!
 const stageDef=`course-stage-${shape.productId}-${shape.topicId}`,ap=product.stageAP
 const program=shape.topicId==='image_workflows'?'image_rights':'video_access'
 const knownExpiry=v(h).applications.filter(a=>a.program===program&&a.approved===true&&a.expiresAt!==null).map(a=>a.expiresAt!).sort().at(-1)
 if(!knownExpiry)return null
 const available=new Map<string,number>(),canUse=(date:string,points:number,earlier:readonly {date:string;points:number}[])=>{
  const q=quarterOf(date);let n=available.get(q);if(n===undefined){n=actionBudget(h.run.economy,date).available;available.set(q,n)}
  return n-earlier.filter(e=>quarterOf(e.date)===q).reduce((sum,e)=>sum+e.points,0)>=points
 }
 // Earliest-first dates. No future outcome, license decision, or hidden profile is inspected.
 for(let start=addDays(now(h),1);addDays(start,product.stageDays*2+support.durationDays+8)<=deadline&&addDays(start,product.stageDays*2)<=knownExpiry;start=addDays(start,1)){
  const firstEnd=addDays(start,product.stageDays)
  if(!canUse(start,ap,[])||!qualified(h,stageDef,start,firstEnd))continue
  for(let second=firstEnd;addDays(second,product.stageDays)<=addDays(start,90);second=addDays(second,1)){
   const secondEnd=addDays(second,product.stageDays),end=[addDays(start,Math.max(21,product.stageDays*2)),secondEnd].sort().at(-1)!
   if(end>deadline||!canUse(second,ap,[{date:start,points:ap}])||!qualified(h,stageDef,second,secondEnd))continue
   for(let supportDate=end;supportDate<=addDays(end,90)&&addDays(supportDate,support.durationDays+8)<=deadline;supportDate=addDays(supportDate,1)){
    if(!canUse(supportDate,support.actionPoints,[{date:start,points:ap},{date:second,points:ap}]))continue
    return {startAt:start,stage1At:second,endAt:end,supportStartAt:supportDate,supportCompleteAt:addDays(supportDate,support.durationDays)}
   }
  }
 }
 return null
}

/** Executes original commands from an independently earned normal prefix; never edits a run. */
export function runCourseShape(h:StoryHarness,shape:CourseShape,callbacks:CourseShapeCallbacks={}):void{
 check(h.run.origin==='normal','NORMAL_COURSE_SHAPE_PREFIX_REQUIRED')
 const original=h.run,publicCourse=c(h),business=publicCourse.businesses.find(b=>b.lifecycle==='operating');check(business,'ACTUAL_COURSE_BUSINESS_REQUIRED')
 const product=campaignCourse.catalog.products.find(p=>p.id===shape.productId)!,cases=publicCourse.cases.filter(x=>x.kind==='first_order'||publicCourse.licenses.some(l=>l.businessId===business.id&&l.caseId===x.id&&l.job?.status==='completed'))
 const first=cases.find(x=>x.kind==='first_order'),video=cases.find(x=>x.kind==='video'&&x.licensed);check(first&&video,'ACTUAL_TWO_PAID_CASES_AND_SAME_COMPANY_LICENSE_REQUIRED')
 const old=publicCourse.courses.find(x=>x.topicId===shape.topicId&&x.edition==='foundation'),study=publicCourse.studies.find(s=>s.predecessorId===old?.id&&s.completedAt!==null&&s.members.length>0)
 if(shape.edition==='advanced'&&(!old||!study))throw new CourseShapePolicyRefusal('actual_advanced_demand_missing',{topicId:shape.topicId,predecessor:old?.id??null,studies:publicCourse.studies})
 let cohortId:string|null=null
 const mark=(name:string)=>{if(cohortId)assertCourseMoney(h.run,cohortId);assertCourseCashDelta(original,h.run,business.accountId);callbacks.milestone?.(name,h.run)}
 send(h,'DefineCourse',{businessId:business.id,name:`真实${product.label}·${shape.topicId}·${shape.edition}`,productId:shape.productId,topicId:shape.topicId,edition:shape.edition,segment:'ai_learners',cases:[{kind:first.kind,id:first.id},{kind:video.kind,id:video.id}],predecessorId:shape.edition==='advanced'?old!.id:null,studyId:shape.edition==='advanced'?study!.id:null,consent:true})
 const courseId=c(h).courses.at(-1)!.id,sampleDef=`course-sample-${shape.productId}-${shape.topicId}`
 for(let attempt=0;;attempt++){
  check(attempt<5,'FINITE_SAMPLE_QUALIFICATION_SEARCH_GUARD')
  const date=pointDate(h,1);at(h,date)
  if(qualified(h,sampleDef,date,addDays(date,product.sampleDays)))break
  renew(h,shape,mark)
 }
 send(h,'BuildCourseSample',{courseId,resources,startAt:now(h)});mark('sample-planned')
 const sample=c(h).courses.find(x=>x.id===courseId)!.job;check(sample,'ACTUAL_SAMPLE_REQUIRED');at(h,sample.completeAt)
 check(c(h).courses.find(x=>x.id===courseId)!.job?.status==='completed','UNEXPECTED_ACTUAL_SAMPLE_NOT_COMPLETED:'+JSON.stringify(c(h).courses.find(x=>x.id===courseId)))
 mark('sample-completed')
 send(h,'CreateCourseAudience',{courseId,mode:'video_referral',priceFen:product.basePriceFen,videoCohortIds:c(h).videoCohorts.filter(x=>x.segment==='ai_learners').map(x=>x.id)})
 const audience=c(h).audiences.at(-1)!;mark('audience-created')
 if(!audience.eligibleMembers.length)throw new CourseShapePolicyRefusal('actual_no_eligible_demand',audience)
 let planned:Schedule|null=null
 for(let attempt=0;attempt<5;attempt++){
  planned=schedule(h,shape);if(planned)break
  renew(h,shape,mark)
 }
 if(!planned)throw new CourseShapePolicyRefusal('finite_2025_schedule_unavailable',{shape,date:now(h)})
 const deployment=projectStory(h.run,campaignStory).deployments.find(d=>d.businessId===business.id)
 if(shape.supportMode==='delegated_group'){
  check(deployment,'ACTUAL_DEPLOYMENT_REQUIRED')
  send(h,'SetHengxingAuthority',{deploymentId:deployment.id,businessId:business.id,level:'cross_flow',scopes:['course_support','external_service_commitments'],cashLimitFen:500000,expiresAt:'2025-12-31',externalDelegation:true,consent:true});mark('separate-explicit-expansion')
 }
 const seatLimit=Math.min(audience.eligibleMembers.length,shape.supportMode==='self_small'?product.selfCapacity:product.capacity)
 send(h,'PlanCourseCohort',{courseId,audienceId:audience.id,startAt:planned.startAt,endAt:planned.endAt,supportStartAt:planned.supportStartAt,seatLimit,supportMode:shape.supportMode,deploymentId:['assisted_group','delegated_group'].includes(shape.supportMode)?deployment?.id??null:null,resources,promise:'clear_scope'})
 cohortId=c(h).cohorts.at(-1)!.id;mark('support-reserved-before-prepayment')
 const co=()=>c(h).cohorts.find(x=>x.id===cohortId)!
 const people=co().availablePeople.slice(0,seatLimit)
 if(!people.length)throw new CourseShapePolicyRefusal('actual_no_unconverted_learners',{cohortId,availablePeople:co().availablePeople})
 send(h,'EnrollCourseAudience',{cohortId,personIds:people});mark('actual-protected-prepayment')
 send(h,'StartCourseStage',{cohortId,index:0,resources,startAt:planned.startAt});check(co().stages[0]!.deliveredAt===null&&co().stages[0]!.amountFen===0,'PLANNING_MUST_NOT_RECOGNIZE_INCOME');mark('stage0-planned-not-delivered')
 at(h,addDays(planned.startAt,product.stageDays));mark('stage0-actual-delivery')
 check(co().stages[0]!.deliveredAt!==null,'UNEXPECTED_FIRST_STAGE_NOT_DELIVERED:'+JSON.stringify(co().stageJobs[0]))
 send(h,'StartCourseStage',{cohortId,index:1,resources,startAt:planned.stage1At});check(co().stages[1]!.deliveredAt===null&&co().stages[1]!.amountFen===0,'SECOND_PLANNING_MUST_NOT_RECOGNIZE_INCOME')
 at(h,addDays(planned.stage1At,product.stageDays));mark('both-actual-deliveries')
 check(co().stages[1]!.deliveredAt!==null,'UNEXPECTED_SECOND_STAGE_NOT_DELIVERED:'+JSON.stringify(co().stageJobs[1]))
 at(h,planned.supportCompleteAt);mark('actual-support-feedback')
 const actual=co(),complaints=actual.students.filter(s=>s.paidRemainingFen>0&&s.outcome==='needs_recovery')
 if(complaints.length){send(h,'RefundCourseLearners',{cohortId,personIds:complaints.map(s=>s.personId),reason:'固定核心策略：仅对真实学习反馈需要补救者退回原款，保留实际费用与未付责任'});mark('actual-complaint-refunds')}
 at(h,addDays(actual.refundUntil,1));mark('actual-window-fee-and-obligations')
 const final=co()
 const incomplete=final.supportJobs.filter(s=>!s.recovery&&s.job?.status!=='completed')
 if(incomplete.length){
  const evidence=incomplete.map(slot=>{
   const job=slot.job;check(job,'EXPECTED_ORIGINAL_SUPPORT_JOB')
   const failures=h.run.timeline.receipts.filter(r=>{const event=JSON.parse(r.signature);return event.payload?.entityId===job.id&&r.skippedReason?.startsWith('JOB_')}).map(r=>({date:r.date,reason:r.skippedReason}))
   const actualUse=h.run.story!.supportUses.find(u=>u.jobId===job.id),actualDeployment=projectStory(h.run,campaignStory).deployments.find(d=>d.id===actualUse?.deploymentId)
   const explicitFailure=failures.some(r=>{const reason=r.reason?.replace(/^JOB_(START|COMPLETION)_FAILED:/,'');return reason!==undefined&&finiteReasons.has(reason)})
   const boundStop=actualUse&&actualDeployment?.stoppedAt&&job.releasedAt===actualDeployment.stoppedAt&&['cancelled','interrupted'].includes(job.status)
   check(explicitFailure||boundStop,'UNEXPECTED_SUPPORT_INCOMPLETE:'+JSON.stringify({job,failures,actualDeployment}))
   return {job,failures,actualUse,actualDeployment}
  })
  throw new CourseShapePolicyRefusal('actual_authorized_support_interrupted',{cohort:final,evidence})
 }
 if(final.closedAt===null){
  const debt=h.run.economy.ledger.obligations.filter(o=>o.contractId===cohortId&&o.remainingFen>0)
  check(debt.length>0,'UNEXPECTED_COHORT_NOT_CLOSED_WITHOUT_DEBT:'+JSON.stringify(final))
  throw new CourseShapePolicyRefusal('actual_cohort_debt_unpaid',{cohort:final,debt})
 }
 check(final.stages.every(s=>s.deliveredAt!==null),'CLOSED_WITHOUT_TWO_ACTUAL_DELIVERIES')
}
