import {replayNormalCourse} from './normal-course-scenario.ts'
import {StoryHarness} from './story-harness.ts'
import {campaignCourse,campaignVideo,campaignStory} from '../application/campaign.ts'
import {projectCourse} from '../core/course-projection.ts'
import {projectVideo} from '../core/video-projection.ts'
import {projectStory} from '../core/story-projection.ts'
import {actionBudget} from '../core/economy.ts'
import {addDays,quarterOf} from '../core/calendar.ts'
import {dayBefore,quarterLimit} from '../core/operations-calendar.ts'
import type {GameRun} from '../core/run-types.ts'

export class CoursePrefixPolicyRefusal extends Error{
 readonly code:string
 readonly detail:unknown
 constructor(code:string,detail:unknown){super(code);this.name='CoursePrefixPolicyRefusal';this.code=code;this.detail=detail}
}
export interface CoursePrefixCallbacks{
 readonly committed?:(run:GameRun,kind:string)=>void
 readonly milestone?:(name:string,run:GameRun)=>void
}
function check(value:unknown,message:string):asserts value{if(!value)throw Error(message)}
const v=(h:StoryHarness)=>{const value=projectVideo(h.run,campaignVideo);check(value,'PUBLIC_VIDEO_REQUIRED');return value}
const c=(h:StoryHarness)=>{const value=projectCourse(h.run,campaignCourse);check(value,'PUBLIC_COURSE_REQUIRED');return value}
const now=(h:StoryHarness)=>h.run.timeline.cursor.date
const at=(h:StoryHarness,date:string)=>h.at(date,{work:false})
const resource=['player-production']

class PrefixHarness extends StoryHarness{
 readonly onCommitted:CoursePrefixCallbacks['committed']
 constructor(prior:GameRun,onCommitted:CoursePrefixCallbacks['committed']){super({priorRun:prior});this.onCommitted=onCommitted}
 override sendAs(kind:string,payload:unknown,id:string){const result=super.sendAs(kind,payload,id);this.onCommitted?.(result,kind);return result}
}
/** Work is a separate command. It is never implicit in a date observation or a full-budget quarter. */
function workThroughQ3(h:StoryHarness){
 const date=now(h),q=quarterOf(date)
 if(date<'2024-10-01'&&date<dayBefore(quarterLimit(date))&&!h.run.operations!.employment.some(e=>e.quarter===q&&e.segments.some(s=>s.to===null))&&actionBudget(h.run.economy,date).available>=2)h.send('WorkQuarter',{})
}
function employedAt(h:StoryHarness,target:string){
 check(target>=now(h),'COURSE_PREFIX_CANNOT_BACKDATE')
 for(let guard=0;guard<40;guard++){
  workThroughQ3(h)
  if(now(h)===target&&h.run.timeline.cursor.phase==='snapshot')return
  const limit=quarterLimit(now(h)),last=dayBefore(limit)
  at(h,target<limit?target:now(h)===last?limit:last)
 }
 throw Error('COURSE_PREFIX_EMPLOYMENT_CLOCK_LIMIT')
}
function points(h:StoryHarness,n:number){
 workThroughQ3(h)
 for(let guard=0;actionBudget(h.run.economy,now(h)).available<n;guard++){
  check(guard<4,'COURSE_PREFIX_POINT_POLICY_EXHAUSTED')
  const date=quarterLimit(now(h));check(date<='2025-12-31','NO_2026_FREE_ACTIONS');employedAt(h,date)
 }
}
function finishVideoWork(h:StoryHarness,id:string){
 let work=v(h).works.find(w=>w.id===id);check(work?.production,'ACTUAL_VIDEO_PRODUCTION_REQUIRED');employedAt(h,work.production.completeAt)
 work=v(h).works.find(w=>w.id===id)!
 if(work.defectKnown&&work.corrections.length===0){
  points(h,1);h.send('ReworkVideo',{workId:id,resources:resource,startAt:now(h)});const correction=v(h).works.find(w=>w.id===id)!.corrections.at(-1);check(correction,'ACTUAL_VIDEO_CORRECTION_REQUIRED');employedAt(h,correction.completeAt)
 }
 h.send('ReviewVideoOutput',{workId:id,disclosure:'manual'})
}
function paidLicensedCommission(h:StoryHarness,mark:(name:string)=>void){
 points(h,1);const channel=v(h).channels[0],lead=channel?.leads[0]
 if(!channel||!lead)throw new CoursePrefixPolicyRefusal('no_actual_qualified_video_lead',channel?.leads??[])
 h.send('AcceptVideoCommission',{channelId:channel.id,cohortId:lead.cohortId,clientId:lead.personId,modeId:'manual',materialId:'licensed',resources:resource,startAt:now(h)})
 const id=v(h).contracts.at(-1)!.id;mark('licensed-video-unpaid');finishVideoWork(h,v(h).contracts.find(x=>x.id===id)!.workId)
 for(let guard=0;guard<12;guard++){
  const contract=v(h).contracts.find(x=>x.id===id)!,work=v(h).works.find(x=>x.id===contract.workId)!
  if(contract.status==='settled'){check(contract.paidCase,'ACTUAL_PAID_VIDEO_CASE_REQUIRED');mark('licensed-video-paid');return id}
  if(contract.status==='cancelled')throw new CoursePrefixPolicyRefusal('actual_licensed_commission_cancelled',contract)
  if(contract.status==='delivered'){check(contract.paymentAt,'ACTUAL_PAYMENT_DATE_REQUIRED');employedAt(h,contract.paymentAt);continue}
  if(contract.status==='production'||contract.status==='revision'){
   if(contract.status==='revision'&&contract.revisions>=contract.includedRevisions&&!contract.negotiated){
    points(h,1);h.send('NegotiateVideoCommission',{contractId:id,proposal:'scope',resources:resource,startAt:now(h)});const jobId=v(h).contracts.find(x=>x.id===id)!.negotiationJobId,job=h.run.operations!.jobs.find(j=>j.id===jobId);check(job,'ACTUAL_NEGOTIATION_JOB_REQUIRED');employedAt(h,job.completeAt);continue
   }
   if(contract.status==='revision'&&!(contract.negotiation==='scope'&&contract.negotiationOutcome==='accepted')){
    points(h,1);h.send('ReworkVideo',{workId:work.id,resources:resource,startAt:now(h)});const job=v(h).works.find(x=>x.id===work.id)!.corrections.at(-1);check(job,'ACTUAL_CLIENT_REVISION_REQUIRED');employedAt(h,job.completeAt);h.send('ReviewVideoOutput',{workId:work.id,disclosure:'manual'})
   }
   h.send('SubmitVideoCommission',{contractId:id});const submitted=v(h).contracts.find(x=>x.id===id)!.submittedAt;check(submitted,'ACTUAL_CLIENT_SUBMISSION_REQUIRED');employedAt(h,addDays(submitted,2));continue
  }
  throw Error('UNKNOWN_PUBLIC_VIDEO_CONTRACT_STATUS:'+contract.status)
 }
 throw Error('COURSE_PREFIX_COMMISSION_LIMIT')
}
function applyProgram(h:StoryHarness,program:'image_rights'|'video_access',date:string){
 employedAt(h,date);const channel=v(h).channels[0]!
 const prior=v(h).applications.filter(a=>a.program===program)
 if(prior.some(a=>a.resultRead&&a.approved===true&&a.expiresAt!==null&&a.expiresAt>date))return true
 h.send('ApplyVideoProgram',{channelId:channel.id,program,resources:resource,startAt:date});const application=v(h).applications.at(-1)!;check(application.job,'ACTUAL_APPLICATION_JOB_REQUIRED');employedAt(h,application.job.completeAt);h.send('DecideVideoProgram',{applicationId:application.id})
 const result=v(h).applications.find(a=>a.id===application.id)!;check(result.resultRead,'PUBLIC_APPLICATION_RESULT_MUST_BE_READ');return result.approved===true
}

/** Six fixed normal histories, with no fixtures, hidden outcomes, parameter changes or implicit authority. */
export function buildCourseMatrixPrefix(backgroundId:string,seed:string,callbacks:CoursePrefixCallbacks={}){
 const names=new Set<string>(),markRun=(name:string,run:GameRun)=>{if(!names.has(name)){names.add(name);callbacks.milestone?.(name,run)}}
 const normal=replayNormalCourse(backgroundId,{seed,onCommitted(run){
  callbacks.committed?.(run,run.receipts.at(-1)!.kind)
  const projection=projectCourse(run,campaignCourse)!,cohort=projection.cohorts[0],last=run.receipts.at(-1)!
  if(last.kind==='OpenCourseStudio')markRun('image-studio-open',run)
  if(last.kind==='DefineCourse')markRun('image-defined',run)
  if(last.kind==='BuildCourseSample')markRun('image-sample-planned',run)
  if(last.kind==='PlanCourseCohort')markRun('image-cohort-planned',run)
  if(last.kind==='EnrollCourseAudience')markRun('image-prepaid',run)
  if(cohort?.stages[0]?.deliveredAt!==null&&cohort?.stages[0]?.deliveredAt!==undefined&&cohort.stages[1]!.attempts.length===0)markRun('image-half-delivered',run)
  if(cohort?.stages.every(s=>s.deliveredAt!==null))markRun('image-both-delivered',run)
  if(projection.courses[0]?.unresolvedUpdates.some(u=>u.affectedCohortIds.includes(cohort?.id??'')))markRun('image-original-update',run)
 }})
 markRun('image-normal-closed',normal.closed)
 const h=new PrefixHarness(normal.run,callbacks.committed),mark=(name:string)=>markRun(name,h.run)
 const business=c(h).businesses[0]!,image=c(h).courses.find(x=>x.topicId==='image_workflows'&&x.edition==='foundation')!;check(business&&image,'NORMAL_IMAGE_STUDIO_REQUIRED')
 const videoCase=paidLicensedCommission(h,mark)
 employedAt(h,'2024-01-01');h.send('LicenseCourseMaterials',{businessId:business.id,caseKind:'video',caseId:videoCase,resources:resource,startAt:'2024-01-02'});mark('material-license-planned');employedAt(h,'2024-01-09');mark('material-license-completed')
 employedAt(h,'2024-04-01');h.send('StudyAdvancedCourseDemand',{courseId:image.id,resources:resource,startAt:'2024-04-02'});employedAt(h,'2024-04-09');mark('image-new-demand-completed')
 let videoApproved=applyProgram(h,'video_access','2024-06-06'),approvalMonth:'early'|'late'='early'
 const defineVideo=()=>{h.send('DefineCourse',{businessId:business.id,name:'正常前史中的视频基础课堂',productId:'intro_recorded',topicId:'video_workflows',edition:'foundation',segment:'ai_learners',cases:[{kind:'first_order',id:normal.result.paidCase},{kind:'video',id:videoCase}],consent:true});return c(h).courses.at(-1)!}
 let videoCourse:ReturnType<typeof c>['courses'][number]|null=null
 if(videoApproved){employedAt(h,'2024-07-01');videoCourse=defineVideo();h.send('BuildCourseSample',{courseId:videoCourse.id,resources:resource,startAt:now(h)});employedAt(h,addDays(now(h),14));mark('video-sample-ready')}
 else{videoApproved=applyProgram(h,'video_access','2024-09-04');if(videoApproved){videoCourse=defineVideo();h.send('BuildCourseSample',{courseId:videoCourse.id,resources:resource,startAt:now(h)});employedAt(h,addDays(now(h),14));mark('video-sample-ready')}}
 at(h,'2024-10-01');h.send('StartHengxingDeployment',{businessId:business.id,resourceId:'player-production',expiresAt:'2025-12-31',initialCashLimitFen:500000,consent:true});at(h,'2024-10-08');mark('approval-deployment-ready')
 const deployment=projectStory(h.run,campaignStory).deployments.at(-1)!;check(deployment?.activeFrom!==null,'ACTUAL_DEPLOYMENT_READY_REQUIRED')
 if(!videoApproved){
  approvalMonth='late';videoApproved=applyProgram(h,'video_access','2024-12-03')
  if(!videoApproved)throw new CoursePrefixPolicyRefusal('three_actual_video_access_refusals',v(h).applications.filter(a=>a.program==='video_access'))
  applyProgram(h,'image_rights','2024-12-11');mark('image-first-renewal-result')
  at(h,'2024-12-26');check(h.run.world!.anchors.some(a=>a.id==='H008'),'ACTUAL_H008_REQUIRED_BEFORE_BUILD');videoCourse=defineVideo();h.send('BuildCourseSample',{courseId:videoCourse.id,resources:resource,startAt:'2024-12-26'});at(h,'2025-01-09');mark('video-sample-ready')
 }
 check(videoCourse,'ACTUAL_VIDEO_FOUNDATION_REQUIRED')
 h.send('CreateCourseAudience',{courseId:videoCourse.id,mode:'video_referral',priceFen:19900,videoCohortIds:c(h).videoCohorts.filter(x=>x.segment==='ai_learners').map(x=>x.id)})
 const audience=c(h).audiences.at(-1)!,people=audience.eligibleMembers.slice(0,20)
 if(!people.length)throw new CoursePrefixPolicyRefusal('no_actual_video_course_learners',audience)
 const early=approvalMonth==='early',startAt=early?'2024-10-09':'2025-01-10',endAt=early?'2024-10-30':'2025-02-03',supportStartAt=early?'2024-11-01':'2025-02-04'
 h.send('PlanCourseCohort',{courseId:videoCourse.id,audienceId:audience.id,startAt,endAt,supportStartAt,seatLimit:people.length,supportMode:'assisted_group',deploymentId:deployment.id,resources:resource,promise:'clear_scope'});mark('video-cohort-planned')
 const cohort=c(h).cohorts.at(-1)!;h.send('EnrollCourseAudience',{cohortId:cohort.id,personIds:people});mark('video-prepaid')
 h.send('StartCourseStage',{cohortId:cohort.id,index:0,resources:resource,startAt});at(h,addDays(startAt,7));mark('video-half-delivered')
 if(!early){at(h,'2025-01-20');h.send('StartCourseRefresh',{courseId:videoCourse.id,resources:resource,startAt:'2025-01-20'});at(h,'2025-01-27');mark('video-original-update-completed')}
 h.send('StartCourseStage',{cohortId:cohort.id,index:1,resources:resource,startAt:now(h)});at(h,addDays(now(h),7));mark('video-both-delivered');at(h,cohort.supportCompleteAt);mark('video-support-feedback')
 const complaints=c(h).cohorts.find(x=>x.id===cohort.id)!.students.filter(s=>s.paidRemainingFen>0&&s.outcome==='needs_recovery')
 if(complaints.length)h.send('RefundCourseLearners',{cohortId:cohort.id,personIds:complaints.map(s=>s.personId),reason:'固定有限策略按实际学习反馈退还原交付款，不自动扩权或增加本季行动'})
 at(h,addDays(cohort.refundUntil,1));mark('video-closed')
 const finalVideo=c(h).courses.find(x=>x.id===videoCourse!.id)!
 if(!finalVideo.graduateCount)throw new CoursePrefixPolicyRefusal('no_actual_video_foundation_graduates',c(h).cohorts.find(x=>x.id===cohort.id))
 if(early){at(h,'2025-01-01');h.send('WorkQuarter',{});h.send('StudyAdvancedCourseDemand',{courseId:videoCourse.id,resources:resource,startAt:'2025-01-01'});at(h,'2025-01-08');mark('video-new-demand-completed');applyProgram(h,'image_rights','2025-01-08');mark('image-first-renewal-result')}
 else{at(h,'2025-04-01');h.send('StudyAdvancedCourseDemand',{courseId:videoCourse.id,resources:resource,startAt:'2025-04-01'});at(h,'2025-04-08');mark('video-new-demand-completed')}
 at(h,'2025-04-08');mark('common-prefix-ready')
 return {initial:h.initial,run:h.run,commands:h.commands,publicCourse:c(h),publicVideo:v(h),publicStory:projectStory(h.run,campaignStory),approvalMonth,milestoneNames:[...names]}
}
