import {campaignCourse,campaignVideo,campaignStory,campaignOperations,campaignRuntime} from '../application/campaign.ts'
import {projectCourse} from '../core/course-projection.ts'
import {projectVideo} from '../core/video-projection.ts'
import {projectStory} from '../core/story-projection.ts'
import {previewCommand} from '../core/commands.ts'
import {actionBudget} from '../core/economy.ts'
import {addDays,quarterOf} from '../core/calendar.ts'
import {quarterLimit,dayBefore} from '../core/operations-calendar.ts'
import {RuleError} from '../core/errors.ts'
import {assertCourseMoney,assertCourseCashDelta} from './course-shape-assertions.ts'
import {StoryHarness} from './story-harness.ts'
import {CourseShapePolicyRefusal,type CourseShape,type CourseShapeCallbacks} from './course-shape-scenario.ts'
import type {GameRun} from '../core/run-types.ts'

function check(value:unknown,message:string):asserts value{if(!value)throw Error(message)}
const c=(h:DelegatedCourseHarness)=>{const p=projectCourse(h.run,campaignCourse);check(p,'PUBLIC_COURSE_REQUIRED');return p}
const v=(h:DelegatedCourseHarness)=>{const p=projectVideo(h.run,campaignVideo);check(p,'PUBLIC_VIDEO_REQUIRED');return p}
const now=(h:DelegatedCourseHarness)=>h.run.timeline.cursor.date
const at=(h:DelegatedCourseHarness,date:string)=>h.at(date,{work:false})
const resources=['player-production']
const deadline='2025-12-31'
// Only the explicitly registered finite business failures are policy results.
const finiteReasons=new Set(['INSUFFICIENT_ACTION_POINTS','INSUFFICIENT_AVAILABLE_FUNDS','INSUFFICIENT_CAPACITY','COURSE_SUPPORT_UNAVAILABLE','OVERDUE_OBLIGATION','AGENT_INDEPENDENT_RISK_PENDING','AGENT_NOT_READY_FOR_BUSINESS','AGENT_SERVICE_FEE_OVERDUE','AGENT_CASH_LIMIT_EXCEEDED','AGENT_SCOPE_NOT_AUTHORIZED','AGENT_DEPLOYMENT_NOT_ACTIVE','AGENT_EXPANSION_NOT_AUTHORIZED'])
function send(h:DelegatedCourseHarness,kind:string,payload:unknown){
 try{return h.send(kind,payload)}catch(error){
  let refusal:{result?:{status?:string;reasonCodes?:string[]}}|null=null
  try{refusal=JSON.parse(error instanceof Error?error.message:String(error))}catch{/* Non-command exceptions remain fatal. */}
  const reasons=refusal?.result?.reasonCodes
  if(refusal?.result?.status==='rejected'&&reasons?.length&&reasons.every(r=>finiteReasons.has(r)))throw new CourseShapePolicyRefusal('actual_command_refused',{date:now(h),kind,payload,reasons})
  throw error
 }
}
function qualified(h:DelegatedCourseHarness,definition:string,from:string,to:string){
 try{campaignCourse.qualificationForJob(h.run,definition,from,to);return true}catch(error){if(error instanceof RuleError&&error.code==='COURSE_TOOL_QUALIFICATION_REQUIRED')return false;throw error}
}
function pointDate(h:DelegatedCourseHarness,n:number,date=now(h)){
 let candidate=date
 for(let i=0;i<5;i++){
  if(candidate>deadline)throw new CourseShapePolicyRefusal('finite_2025_action_window_exhausted',{needed:n,date:candidate})
  if(actionBudget(h.run.economy,candidate).available>=n+h.riskBuffer(candidate))return candidate
  candidate=quarterLimit(candidate)
 }
 throw Error('COURSE_SHAPE_POINT_SEARCH_GUARD')
}
function renew(h:DelegatedCourseHarness,shape:CourseShape,mark:(name:string)=>void){
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
function schedule(h:DelegatedCourseHarness,shape:CourseShape):Schedule|null{
 const product=campaignCourse.catalog.products.find(p=>p.id===shape.productId)!,support=campaignOperations.catalog.jobs.find(j=>j.id===`course-support-${shape.productId}-${shape.supportMode}`)!
 const stageDef=`course-stage-${shape.productId}-${shape.topicId}`,ap=product.stageAP
 const program=shape.topicId==='image_workflows'?'image_rights':'video_access'
 const knownExpiry=v(h).applications.filter(a=>a.program===program&&a.approved===true&&a.expiresAt!==null).map(a=>a.expiresAt!).sort().at(-1)
 if(!knownExpiry)return null
 const available=new Map<string,number>(),canUse=(date:string,points:number,earlier:readonly {date:string;points:number}[])=>{
  const q=quarterOf(date);let n=available.get(q);if(n===undefined){n=actionBudget(h.run.economy,date).available;available.set(q,n)}
  return n-earlier.filter(e=>quarterOf(e.date)===q).reduce((sum,e)=>sum+e.points,0)>=points+h.riskBuffer(date)
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
function runBusinessShape(h:DelegatedCourseHarness,shape:CourseShape,callbacks:CourseShapeCallbacks={}):void{
 check(h.run.origin==='normal','NORMAL_COURSE_SHAPE_PREFIX_REQUIRED')
 const original=h.run,publicCourse=c(h),business=publicCourse.businesses.find(b=>b.lifecycle==='operating');check(business,'ACTUAL_COURSE_BUSINESS_REQUIRED')
 const product=campaignCourse.catalog.products.find(p=>p.id===shape.productId)!,cases=publicCourse.cases.filter(x=>x.kind==='first_order'||publicCourse.licenses.some(l=>l.businessId===business.id&&l.caseId===x.id&&l.job?.status==='completed'))
 const first=cases.find(x=>x.kind==='first_order'),video=cases.find(x=>x.kind==='video'&&x.licensed);check(first&&video,'ACTUAL_TWO_PAID_CASES_AND_SAME_COMPANY_LICENSE_REQUIRED')
 const old=publicCourse.courses.find(x=>x.topicId===shape.topicId&&x.edition==='foundation'),study=publicCourse.studies.find(s=>s.predecessorId===old?.id&&s.completedAt!==null&&s.members.length>0)
 if(shape.edition==='advanced'&&(!old||!study))throw new CourseShapePolicyRefusal('actual_advanced_demand_missing',{topicId:shape.topicId,predecessor:old?.id??null,studies:publicCourse.studies})
 let cohortId:string|null=null
 const mark=(name:string)=>{if(cohortId)assertCourseMoney(h.run,cohortId);assertCourseCashDelta(original,h.run,business.accountId);callbacks.milestone?.(name,h.run)}
 h.setMilestoneSink(mark)
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
 const deployment=projectStory(h.run,campaignStory).deployments.find(d=>d.businessId===business.id)
 check(shape.supportMode==='delegated_group'&&deployment,'ORIGINAL_DELEGATED_SHAPE_AND_DEPLOYMENT_REQUIRED')
 send(h,'SetHengxingAuthority',{deploymentId:deployment.id,businessId:business.id,level:'cross_flow',scopes:['course_support','external_service_commitments'],cashLimitFen:500000,expiresAt:'2025-12-31',externalDelegation:true,consent:true});mark('separate-explicit-expansion')
 const checkedAt=addDays(now(h),7);at(h,checkedAt);h.finishCurrentRisk()
 const checkedStory=projectStory(h.run,campaignStory)
 h.note('first-authority-check',{checkedAt,publicIncidents:checkedStory.incidents.map(i=>({id:i.id,stage:i.stage,verdict:i.verdict}))})
 if(!checkedStory.incidents.some(i=>i.deploymentIds.includes(deployment.id)&&i.signals.some(s=>s.source!=='system_report'&&s.date>=checkedAt&&s.date<=now(h))))h.note('no_public_signal_after_check',{deploymentId:deployment.id,checkedAt,actualDate:now(h),investigationInvented:false})
 mark('first-public-risk-check')
 let planned:Schedule|null=null
 for(let attempt=0;attempt<5;attempt++){
  planned=schedule(h,shape);if(planned)break
  renew(h,shape,mark)
 }
 if(!planned)throw new CourseShapePolicyRefusal('finite_2025_schedule_unavailable',{shape,date:now(h)})
 const seatLimit=Math.min(audience.eligibleMembers.length,product.capacity)
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

/** A player policy over committed public signals, never an agency profile or future roll. */
export class DelegatedCourseHarness extends StoryHarness{
 readonly riskTrace:unknown[]=[]
 businessCompletedAt:string|null=null
 monitoringComplete=false
 blockedByViolation=false
 #monitoring=false
 #sink:((name:string)=>void)|null=null
 #markSequence=0
 readonly #seenSignals=new Set<string>()
 readonly #stoppedCases=new Set<string>()
 readonly #deferred=new Set<string>()
 readonly #originalStoryJobs:Set<string>
 readonly #originalCohorts:Set<string>
 constructor(options:ConstructorParameters<typeof StoryHarness>[0]={}){
  super(options)
  this.#originalStoryJobs=new Set(projectStory(this.run,campaignStory).jobs.map(j=>j.id))
  this.#originalCohorts=new Set(this.run.course?.cohorts.map(c=>c.id)??[])
 }
 setMilestoneSink(sink:(name:string)=>void){this.#sink=sink}
 note(kind:string,detail:unknown){this.riskTrace.push({kind,revision:this.run.revision,date:now(this),detail})}
 #mark(name:string){this.#sink?.('risk-'+String(++this.#markSequence).padStart(3,'0')+'-'+name)}
 riskBuffer(date:string){
  const spent=projectStory(this.run,campaignStory).jobs.filter(j=>j.kind==='investigate'&&!this.#originalStoryJobs.has(j.id)&&quarterOf(j.startAt)===quarterOf(date)).reduce((n,j)=>n+j.actionPoints,0)
  return Math.max(0,1-spent)
 }
 #capacityWake(date:string,days:number):string|null{
  const until=addDays(date,days),ends:string[]=[]
  for(const j of this.run.operations?.jobs??[])if(j.resources.includes('player-production')&&j.status!=='cancelled'&&j.startAt<until&&(j.releasedAt??j.completeAt)>date)ends.push(j.releasedAt??j.completeAt)
  for(const j of projectStory(this.run,campaignStory).jobs)if(j.resourceId==='player-production'&&j.status==='running'&&j.startAt<until&&j.completeAt>date)ends.push(j.completeAt)
  for(const j of this.run.world?.jobs??[]){const end=j.status==='interrupted'?this.run.economy.actions.find(a=>a.definition.id===j.actionId)?.finishedAt??j.completeAt:j.completeAt;if(j.startAt<until&&end>date)ends.push(end)}
  return ends.sort()[0]??null
 }
 #reviewStep():{changed:boolean;wakeAt:string|null;pending:boolean}{
  const date=now(this),story=projectStory(this.run,campaignStory)
  for(const incident of story.incidents)for(const signal of incident.signals)if(!this.#seenSignals.has(signal.id)){
   this.#seenSignals.add(signal.id);this.note('public-signal',{incidentId:incident.id,signal,openedAt:incident.openedAt,deadline:incident.deadline,pause:this.run.timeline.pause});this.#mark('public-signal')
  }
  if(this.run.timeline.pause?.reason==='STORY_RISK_DECISION_PENDING'){
   const instanceId=this.run.timeline.pause.instanceId
   this.send('AcknowledgeStoryPause',{instanceId});this.note('separate-acknowledgement',{instanceId});this.#mark('acknowledged')
   return {changed:true,wakeAt:null,pending:true}
  }
  for(const incident of story.incidents){
   if(incident.kind!=='agent'||incident.verdict!=='violation'||incident.resolvedAt!==null||this.#stoppedCases.has(incident.id))continue
   for(const id of incident.deploymentIds){const deployment=projectStory(this.run,campaignStory).deployments.find(d=>d.id===id);check(deployment,'PUBLIC_VIOLATION_DEPLOYMENT_REQUIRED');if(deployment.stoppedAt===null){this.send('StopHengxingAuthority',{deploymentId:id});this.#mark('finite-owned-stop')}}
   const current=projectStory(this.run,campaignStory).incidents.find(c=>c.id===incident.id)!
   this.send('DeclareRiskLiabilities',{incidentId:current.id,snapshot:{contractIds:current.currentLiabilities.contractIds,obligationIds:current.currentLiabilities.obligationIds,jobIds:current.currentLiabilities.jobIds}})
   this.#stoppedCases.add(incident.id);this.blockedByViolation=true
   this.note('actual-independent-violation-finite-stop',{incidentId:current.id,verdict:current.verdict,deadline:current.deadline,currentLiabilities:current.currentLiabilities,externalControlVerified:current.controlVerified})
   this.#mark('original-liabilities-retained')
   if(!this.#monitoring)throw new CourseShapePolicyRefusal('actual_independent_violation_finite_stop',{incidentId:current.id,publicIncident:current})
   return {changed:true,wakeAt:null,pending:false}
  }
  let wakeAt:string|null=null,pending=false
  for(const incident of story.incidents){
   if(incident.resolvedAt!==null)continue
   const job=incident.jobs.investigate
   if(job?.status==='completed'&&job.result!==null&&job.completeAt<=date&&(incident.verdict==='unknown'||incident.stage==='investigating')){
    this.note('actual-independent-work-completed',{incidentId:incident.id,job,unconfirmedVerdict:incident.verdict});this.#mark('actual-investigation-completed-not-confirmed')
    this.send('ConfirmRiskAssessment',{incidentId:incident.id})
    const current=projectStory(this.run,campaignStory).incidents.find(c=>c.id===incident.id)!
    this.note('actual-completed-assessment',{incidentId:incident.id,job,verdict:current.verdict,stage:current.stage,deadline:current.deadline,strictlyBeforeDefault:date<incident.deadline})
    this.#mark('actual-independent-assessment');return {changed:true,wakeAt:null,pending:true}
   }
   if(job?.status==='running'){
    pending=true;if(wakeAt===null||job.completeAt<wakeAt)wakeAt=job.completeAt
    continue
   }
   const newIndependent=job?.status==='completed'&&incident.signals.some(s=>s.source!=='system_report'&&s.date>job.completeAt&&s.date<=date)
   if(incident.verdict!=='unknown'&&!newIndependent&&job?.status!=='interrupted')continue
   check(!job||job.status==='interrupted'||job.status==='completed'&&newIndependent,'UNEXPECTED_UNREVIEWABLE_PUBLIC_INVESTIGATION')
   pending=true
   const business=incident.businessIds.map(id=>this.run.operations?.businesses.find(b=>b.id===id)).find(b=>b&&b.lifecycle!=='closed'&&this.run.controlledAccountIds.includes(b.accountId))
   check(business,'ACTUAL_BOUND_RISK_PAYER_REQUIRED')
   const payload={incidentId:incident.id,kind:'investigate',accountId:business.accountId,resourceId:'player-production'}
   const preview=previewCommand(this.run,this.command('StartRiskTask',payload),this.codec.registry,this.run.actorId)
   if(preview.allowed){
    this.send('StartRiskTask',payload)
    const actual=projectStory(this.run,campaignStory).incidents.find(c=>c.id===incident.id)!.jobs.investigate!
    check(actual.costFen===preview.upfrontCostFen&&actual.actionPoints===preview.actionPoints&&actual.startAt===date,'ACTUAL_INVESTIGATION_TERMS_CHANGED')
    this.note('actual-paid-investigation',{incidentId:incident.id,job:actual,deadline:incident.deadline,willCompleteStrictlyBeforeDefault:actual.completeAt<incident.deadline})
    this.#mark('paid-investigation-started');return {changed:true,wakeAt:actual.completeAt,pending:true}
   }
   const known=new Set([...finiteReasons,'STORY_WORK_OUTSIDE_TIMELINE'])
   check(preview.reasonCodes.length>0&&preview.reasonCodes.every(r=>known.has(r)),'UNKNOWN_INVESTIGATION_PREVIEW_REFUSAL:'+JSON.stringify(preview))
   const key=[incident.id,date,...preview.reasonCodes].join('|')
   if(!this.#deferred.has(key)){this.#deferred.add(key);this.note('deferred-public-investigation-preview',{incidentId:incident.id,payload,reasonCodes:preview.reasonCodes,deadline:incident.deadline,actualCommandAttempt:false});this.#mark('deferred-real-resource')}
   const candidate=preview.reasonCodes.includes('INSUFFICIENT_CAPACITY')?this.#capacityWake(date,incident.taskTerms.investigate!.days):preview.reasonCodes.includes('INSUFFICIENT_ACTION_POINTS')?quarterLimit(date):null
   if(candidate&&candidate>date&&candidate<=deadline&&(wakeAt===null||candidate<wakeAt))wakeAt=candidate
  }
  return {changed:false,wakeAt,pending}
 }
 override at(target:string,options:{prepareManualCase?:boolean;work?:boolean}={}):GameRun{
  check(options.work!==true,'SUPPLEMENT_POLICY_DOES_NOT_ACCEPT_EMPLOYMENT')
  if(target<now(this))throw Error('DELEGATED_POLICY_CANNOT_BACKDATE')
  for(let guard=0;guard<1200;guard++){
   const step=this.#reviewStep();if(step.changed)continue
   const run=this.run,date=now(this),limit=quarterLimit(date),pause=run.timeline.pause
   if(pause){
    if(pause.reason==='CONTENT_DECISION_PENDING'){
     const i=run.world!.instances.find(i=>i.openedBy===pause.instanceId);check(i,'ACTUAL_PAUSED_CONTENT_REQUIRED')
     this.send('ChooseEvent',{instanceId:i.id,choiceId:options.prepareManualCase&&i.definitionId==='PREP-CASE'?'prepare':campaignRuntime.definition(i.definitionId).defaultChoiceId})
    }else if(pause.reason==='CASH_SHORTFALL')this.send('AcknowledgeCashGap',{instanceId:pause.instanceId})
    else throw Error('UNHANDLED_DELEGATED_POLICY_PAUSE:'+JSON.stringify(pause))
    continue
   }
   if(date===target&&run.timeline.cursor.phase==='snapshot')return run
   let next=target<limit?target:date===dayBefore(limit)?limit:dayBefore(limit)
   if(step.wakeAt&&step.wakeAt>=date&&step.wakeAt<next)next=step.wakeAt
   this.send('AdvanceTime',{date:next})
  }
  throw Error('DELEGATED_POLICY_CLOCK_GUARD')
 }
 finishCurrentRisk(){
  for(let guard=0;guard<80;guard++){
   const step=this.#reviewStep();if(step.changed)continue
   if(!step.pending)return
   if(step.wakeAt&&step.wakeAt>=now(this)&&step.wakeAt<=deadline){this.at(step.wakeAt,{work:false});continue}
   throw new CourseShapePolicyRefusal('actual_public_risk_no_current_legal_investigation_window',{date:now(this),publicStory:projectStory(this.run,campaignStory)})
  }
  throw Error('DELEGATED_PUBLIC_INVESTIGATION_GUARD')
 }
 #settleRefusedCourse(){
  this.#monitoring=true
  const current=c(this)
  for(const cohort of current.cohorts.filter(co=>!this.#originalCohorts.has(co.id))){
   const people=cohort.students.filter(s=>s.paidRemainingFen>0).map(s=>s.personId)
   if(people.length&&now(this)<=cohort.refundUntil){this.send('RefundCourseLearners',{cohortId:cohort.id,personIds:people,reason:'独立核查或原资源条件受阻：仅按原窗口退回本班剩余学费，不替换支持或清除原责任'});this.#mark('refused-cohort-original-refunds')}
   else if(people.length)this.note('original-refund-window-already-closed',{cohortId:cohort.id,refundUntil:cohort.refundUntil,paidStudentsRemaining:people.length})
   const fresh=c(this).cohorts.find(co=>co.id===cohort.id)!
   const ids=new Set([...fresh.stageJobs.flatMap(list=>list.filter(j=>j!==null).map(j=>j.id)),...fresh.supportJobs.flatMap(slot=>slot.job?[slot.job.id]:[])])
   for(const id of ids){const job=this.run.operations!.jobs.find(j=>j.id===id);if(job&&['planned','running'].includes(job.status)){this.send('InterruptJob',{jobId:id});this.#mark('refused-cohort-unused-work-stopped')}}
  }
 }
 monitorThrough(target=deadline){
  this.#monitoring=true;this.at(target,{work:false});this.monitoringComplete=now(this)===target&&this.run.timeline.cursor.phase==='snapshot'
  this.note('actual-monitoring-cutoff',{target,actualDate:now(this),phase:this.run.timeline.cursor.phase,publicIncidents:projectStory(this.run,campaignStory).incidents.map(i=>({id:i.id,stage:i.stage,verdict:i.verdict,resolvedAt:i.resolvedAt,controlVerified:i.controlVerified,currentLiabilities:i.currentLiabilities}))})
  this.#mark('actual-year-end-monitoring')
 }
 settleRefusalAndMonitor(){this.#settleRefusedCourse();this.monitorThrough()}
}

/** The original 12 delegated identities are preserved; finite refusals remain failures to close. */
export function runDelegatedCourseShape(h:DelegatedCourseHarness,shape:CourseShape,callbacks:CourseShapeCallbacks={}):void{
 try{runBusinessShape(h,shape,callbacks);h.businessCompletedAt=now(h)}
 catch(error){if(error instanceof CourseShapePolicyRefusal){h.note('finite-business-refusal',{code:error.code,detail:error.detail});h.settleRefusalAndMonitor();throw error}throw error}
 h.monitorThrough()
}
