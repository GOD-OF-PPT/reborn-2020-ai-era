import type {SceneCommand} from '../application/scene-commands.ts'
import {deepseekId} from '../core/deepseek-state.ts'
import {relayId} from '../core/relay.ts'
import {courseId} from '../core/course.ts'
import {videoId} from '../core/video.ts'
import type {GamePanelProps} from './game-types.ts'
import type {OpeningFocus} from './player-thread.ts'
import {ecosystemFocusFor,resolveEcosystemFocus} from './ecosystem-player-thread.ts'
import type {EcosystemSceneTarget} from './ecosystem-scene-target.ts'
import {relayBusinessTarget,relayFocusFor,resolveRelayFocus} from './relay-player-thread.ts'
import {courseFocusFor,resolveCourseFocus} from './course-player-thread.ts'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import {resolveVideoFocus,videoTargetEntity} from './video-player-thread.ts'
import type {VideoSceneTarget} from './video-scene-progress.ts'
type Input=Pick<GamePanelProps,'view'|'features'>

/** null is an unrelated command; [] is a relevant source that cannot be uniquely matched. */
export function sceneCommandFocus(p:Input,c:SceneCommand):readonly OpeningFocus[]|null{
 const v=p.features.deepseek,r=p.features.relay,lessons=p.features.course,movies=p.features.video,f=c.identifiers
 const course=(target:CourseSceneTarget):OpeningFocus[]=>{const focus=courseFocusFor(p,target);return resolveCourseFocus(p,focus).reason?[]:[focus]}
 const lesson=(id:string|undefined):OpeningFocus[]=>{const rows=lessons?.courses.filter(x=>x.id===id)??[];return rows.length===1?course({kind:'course',businessId:rows[0]!.businessId,courseId:rows[0]!.id}):[]}
 const cohort=(id:string|undefined):OpeningFocus[]=>{const rows=lessons?.cohorts.filter(x=>x.id===id)??[],owners=lessons?.courses.filter(x=>x.id===rows[0]?.courseId)??[];return rows.length===1&&owners.length===1?course({kind:'cohort',businessId:owners[0]!.businessId,courseId:owners[0]!.id,cohortId:rows[0]!.id}):[]}
 const video=(target:VideoSceneTarget):OpeningFocus[]=>{const channels=movies?.channels.filter(x=>x.id===target.channelId)??[];if(channels.length!==1)return [];const channel=channels[0]!,focus:Extract<OpeningFocus,{kind:'video'}>={kind:'video',runId:p.view.runId,accountId:channel.accountId,businessId:channel.businessId,entityId:videoTargetEntity(target),videoTarget:target};return resolveVideoFocus(p,focus).reason?[]:[focus]}
 const work=(id:string|undefined):OpeningFocus[]=>{const rows=movies?.works.filter(w=>w.id===id)??[];return rows.length===1?video({channelId:rows[0]!.channelId,workId:rows[0]!.id,...(rows[0]!.contractId?{contractId:rows[0]!.contractId}:{})}):[]}
 const videoContract=(id:string|undefined):OpeningFocus[]=>{const rows=movies?.contracts.filter(x=>x.id===id)??[];return rows.length===1?video({channelId:rows[0]!.channelId,workId:rows[0]!.workId,contractId:rows[0]!.id}):[]}
 const eco=(businessId:string,kind:EcosystemSceneTarget['kind'],recordId?:string):OpeningFocus[]=>{
  const businesses=v?.businesses.filter(b=>b.id===businessId&&b.definitionId==='ecosystem-service')??[]
  if(businesses.length!==1)return []
  const identity={runId:p.view.runId,accountId:businesses[0]!.accountId,businessId},target:EcosystemSceneTarget=kind==='business'?{...identity,kind}:{...identity,kind,recordId:recordId!}
  const focus=ecosystemFocusFor(p,target)
  return resolveEcosystemFocus(p,focus).reason?[]:[focus]
 }
 const contract=(id:string|undefined)=>{const rows=v?.contracts.filter(x=>x.id===id)??[];return rows.length===1?eco(rows[0]!.businessId,'contract',rows[0]!.id):[]}
 const relay=(businessId:string,rest:{kind:'period';periodId:string}|{kind:'business'}|{kind:'application';applicationId:string}|{kind:'audience';audienceId:string}|{kind:'customer';customerId:string}):OpeningFocus[]=>{
  const identity=relayBusinessTarget(p,businessId)
  if(!identity)return []
  const focus=relayFocusFor(p,{...identity,...rest})
  return resolveRelayFocus(p,focus).reason?[]:[focus]
 }
 const customer=(id:string|undefined)=>{const rows=r?.customers.filter(x=>x.id===id)??[];return rows.length===1?relay(rows[0]!.businessId,{kind:'customer',customerId:rows[0]!.id}):[]}
 const period=(id:string|undefined)=>{const rows=r?.periods.filter(x=>x.id===id)??[];return rows.length===1?relay(rows[0]!.businessId,{kind:'period',periodId:rows[0]!.id}):[]}
 const ecoId=deepseekId(c.commandId,c.kind),rlyId=relayId(c.commandId,c.kind),crsId=courseId(c.commandId,c.kind),vidId=videoId(c.commandId,c.kind)
 if(c.kind==='OpenCourseStudio'){
  const rows=lessons?.businesses.filter(b=>b.definitionId==='course-studio'&&b.history.some(h=>h.sourceId===c.commandId+':discover'))??[]
  return rows.length===1?course({kind:'studio',businessId:rows[0]!.id}):[]
 }
 if(c.kind==='StartCourseOutline'||c.kind==='LicenseCourseMaterials'){
  const kind=c.kind==='StartCourseOutline'?'outline':'license',rows=kind==='outline'?lessons?.outlines:lessons?.licenses,matched=rows?.filter(x=>x.id===crsId&&x.businessId===f.businessId)??[]
  return matched.length===1?kind==='outline'?course({kind,businessId:matched[0]!.businessId,outlineId:matched[0]!.id}):course({kind,businessId:matched[0]!.businessId,licenseId:matched[0]!.id}):[]
 }
 if(c.kind==='DefineCourse')return lesson(lessons?.courses.find(x=>x.id===crsId&&x.businessId===f.businessId)?.id)
 if(c.kind==='BuildCourseSample'){
  const rows=lessons?.courses.filter(x=>x.id===f.courseId&&x.sampleAttempts.includes(courseId('job',crsId)))??[]
  return rows.length===1?course({kind:'course',businessId:rows[0]!.businessId,courseId:rows[0]!.id,sampleJobId:courseId('job',crsId)}):[]
 }
 if(c.kind==='CreateCourseAudience'){
  const rows=lessons?.audiences.filter(x=>x.id===crsId&&x.courseId===f.courseId)??[],owners=lessons?.courses.filter(x=>x.id===rows[0]?.courseId)??[]
  return rows.length===1&&owners.length===1?course({kind:'audience',businessId:owners[0]!.businessId,courseId:owners[0]!.id,audienceId:rows[0]!.id}):[]
 }
 if(c.kind==='PlanCourseCohort')return cohort(lessons?.cohorts.find(x=>x.id===crsId&&x.courseId===f.courseId&&x.audienceId===f.audienceId)?.id)
 if(['EnrollCourseAudience','StartCourseStage','StartCourseRecovery','RefundCourseLearners'].includes(c.kind))return cohort(f.cohortId)
 if(['StartCourseRefresh','StudyAdvancedCourseDemand','PauseNewEnrollment','ResumeCourseEnrollment','StopCourseSales','RetireCourse'].includes(c.kind))return lesson(f.courseId)
 if(c.kind==='OpenVideoChannel')return video({channelId:vidId})
 if(c.kind==='StartVideoWork')return work(movies?.works.find(x=>x.id===vidId&&x.channelId===f.channelId)?.id)
 if(c.kind==='StartVideoMarketing'){
  const rows=movies?.marketing.filter(x=>x.id===vidId&&x.channelId===f.channelId)??[]
  return rows.length===1?video({channelId:rows[0]!.channelId,marketingId:rows[0]!.id}):[]
 }
 if(c.kind==='AcceptVideoCommission')return videoContract(movies?.contracts.find(x=>x.id===vidId&&x.channelId===f.channelId&&x.clientId===f.clientId&&x.cohortId===f.cohortId)?.id)
 if(['ReviewVideoOutput','ReworkVideo','PublishVideo','AbandonVideoWork'].includes(c.kind))return work(f.workId)
 if(['SubmitVideoCommission','NegotiateVideoCommission','ExitVideoCommission'].includes(c.kind))return videoContract(f.contractId)
 if(c.kind==='UnlistVideo')return work(movies?.publications.find(x=>x.id===f.publicationId)?.workId)
 if(c.kind==='CollectVideoSettlement'){
  const settlement=movies?.settlements.find(x=>x.id===f.settlementId)
  return work(movies?.publications.find(x=>x.id===settlement?.publicationId)?.workId)
 }
 if(c.kind==='OpenEcosystemService'){
  const source=deepseekId(ecoId,'discover'),rows=v?.businesses.filter(b=>b.definitionId==='ecosystem-service'&&b.history.some(h=>h.sourceId===source))??[]
  return rows.length===1?eco(rows[0]!.id,'business'):[]
 }
 if(c.kind==='StartEcosystemPreparation'||c.kind==='StartEcosystemAdaptation'||c.kind==='StartEcoOutreach'){
  const kind=c.kind==='StartEcosystemPreparation'?'preparation':c.kind==='StartEcosystemAdaptation'?'adapter':'outreach',rows=kind==='preparation'?v?.preparations:kind==='adapter'?v?.adapters:v?.outreaches
  const matched=rows?.filter(row=>row.id===ecoId&&row.businessId===f.businessId)??[]
  return matched.length===1?eco(matched[0]!.businessId,kind,matched[0]!.id):[]
 }
 if(c.kind==='AcceptEcoContract'){
  const rows=v?.contracts.filter(row=>row.id===ecoId&&row.leadId===f.leadId)??[]
  return rows.length===1?contract(rows[0]!.id):[]
 }
 if(['SubmitEcoDelivery','StartEcoRemediation','CancelEcoContract'].includes(c.kind))return contract(f.contractId)
 if(c.kind==='CollectEcoReceivable'){
  const rows=v?.deliveries.filter(d=>d.id===f.deliveryId)??[]
  return rows.length===1?contract(rows[0]!.contractId):[]
 }
 if(c.kind==='DeclineEcoLead'){
  const rows=v?.leads.filter(row=>row.id===f.leadId)??[]
  return rows.length===1?eco(rows[0]!.businessId,'lead',rows[0]!.id):[]
 }
 if(c.kind==='StopEcosystemService')return typeof f.businessId==='string'?eco(f.businessId,'business'):[]
 if(c.kind==='OpenRelayStation'){
  const rows=r?.stations.filter(s=>s.id===rlyId)??[]
  return rows.length===1?relay(rows[0]!.businessId,{kind:'business'}):[]
 }
 if(c.kind==='StartRelayServicePeriod')return period(r?.periods.find(x=>x.id===rlyId&&x.businessId===f.businessId)?.id)
 if(c.kind==='ApplyRelaySupply'){
  const rows=r?.applications.filter(a=>a.id===rlyId&&a.businessId===f.businessId)??[]
  return rows.length===1?relay(rows[0]!.businessId,{kind:'application',applicationId:rows[0]!.id}):[]
 }
 if(c.kind==='StartRelayMarketing'){
  const rows=r?.audiences.filter(a=>a.id===rlyId&&a.businessId===f.businessId)??[]
  return rows.length===1?relay(rows[0]!.businessId,{kind:'audience',audienceId:rows[0]!.id}):[]
 }
 if(['StopRelayPeriod','CorrectRelayPeriod','StartRelayAudit','CorrectRelayUsage'].includes(c.kind)){
  if(f.periodId)return period(f.periodId)
  const audit=f.auditId?r?.audits.find(a=>a.id===f.auditId):null,meter=r?.meters.find(m=>m.id===(f.meterId??audit?.meterId))
  if(meter)return period(meter.periodId)
  // A batch audit can belong to several original periods. Keep the business as a whole.
  return f.businessId?relay(f.businessId,{kind:'business'}):[]
 }
 if(c.kind==='CollectRelayReceivable')return customer(r?.receivables.find(x=>x.id===f.receivableId)?.customerId)
 if(['CollectRelayDue','RechargeRelayCustomer','RefundRelayBalance','CloseRelayCustomer','RenewRelayCustomer'].includes(c.kind))return customer(f.customerId)
 if(['StartRelayPreparation','StartRelayAdapter','SignRelayCustomers','SetRelayOffer','StartRelayRequote','PauseRelayTraffic','ResumeRelayTraffic','StopRelayStation'].includes(c.kind))return f.businessId?relay(f.businessId,{kind:'business'}):[]
 if(c.kind==='InterruptJob'||c.kind==='RescheduleJob'){
  const job=p.view.operations?.jobs.find(j=>j.id===f.jobId)
  if(!job)return null
  const contracts=v?.contracts.filter(x=>[x.productionJobId,x.remediationJobId,x.supportJobId].includes(job.id))??[]
  if(contracts.length)return contracts.length===1?contract(contracts[0]!.id):[]
  const periods=r?.periods.filter(x=>x.jobId===job.id||x.supportJobId===job.id||r.auditJobs.some(a=>a.jobId===job.id&&a.periodIds.includes(x.id)))??[]
  if(periods.length)return periods.length===1?period(periods[0]!.id):relay(job.businessId,{kind:'business'})
  const classes=lessons?.cohorts.filter(x=>x.stageJobs.flat().some(j=>j?.id===job.id)||x.supportJobs.some(s=>s.job?.id===job.id))??[]
  if(classes.length)return classes.length===1?cohort(classes[0]!.id):[]
  const samples=lessons?.courses.filter(x=>x.sampleAttempts.includes(job.id))??[]
  if(samples.length)return samples.length===1?course({kind:'course',businessId:samples[0]!.businessId,courseId:samples[0]!.id,sampleJobId:job.id}):[]
  const works=movies?.works.filter(x=>x.production?.id===job.id||x.corrections.some(j=>j?.id===job.id))??[]
  if(works.length)return works.length===1?work(works[0]!.id):[]
 }
 return null
}
