import {canonicalJson} from '../core/identity.ts'
import {storyId} from '../core/story-state.ts'
import type {projectStory} from '../core/story-projection.ts'
import type {CommandEnvelope} from '../core/run-types.ts'

/** The source fields needed after the caller has replayed full request/candidate bytes. */
export interface RelayShapeViolationAttempt{
 readonly sequence:number
 readonly command:CommandEnvelope
 readonly before:{readonly revision:number;readonly date:string}
 readonly after:{readonly revision:number;readonly date:string;readonly sha256:string}
 readonly status:'attempted'|'accepted'|'rejected'|'exception'|'committed_with_exception'
 readonly proposedCandidate:{readonly bytes:number;readonly sha256:string}|null
}

export interface RelayShapeViolationChain{
 readonly businessId:string;readonly deploymentId:string;readonly incidentId:string;readonly investigationJobId:string
 readonly investigationCommandId:string;readonly confirmCommandId:string;readonly stopCommandId:string;readonly declareCommandId:string
}

/** A final stopped state can come from the deadline; require the player's actual source commands. */
export function relayShapeExplicitViolationChain(attempts:readonly RelayShapeViolationAttempt[],story:ReturnType<typeof projectStory>,businessId:string,deploymentId:string):RelayShapeViolationChain|null{
 const payload=(a:RelayShapeViolationAttempt)=>a.command.payload!==null&&typeof a.command.payload==='object'&&!Array.isArray(a.command.payload)?a.command.payload as Record<string,unknown>:null
 const accepted=(a:RelayShapeViolationAttempt)=>a.status==='accepted'&&a.proposedCandidate!==null&&a.proposedCandidate.bytes>0&&a.proposedCandidate.sha256===a.after.sha256
  &&a.command.expectedRevision===a.before.revision&&a.after.revision===a.before.revision+1&&a.after.date===a.before.date
 const ordered=(a:RelayShapeViolationAttempt,b:RelayShapeViolationAttempt)=>a.sequence<b.sequence&&a.after.revision<=b.before.revision&&a.command.runId===b.command.runId&&a.command.actorId===b.command.actorId
 const deployment=story.deployments.find(d=>d.id===deploymentId&&d.businessId===businessId)
 if(!deployment||deployment.stoppedAt===null)return null
 for(const incident of story.incidents){
  const job=incident.jobs.investigate,liabilities=incident.liabilities
  if(incident.kind!=='agent'||incident.verdict!=='violation'||!incident.businessIds.includes(businessId)||!incident.deploymentIds.includes(deploymentId)
   ||!job||job.status!=='completed'||job.result!=='violation'||job.kind!=='investigate'||job.businessId!==businessId||job.accountId!==deployment.accountId
   ||job.resourceId!=='player-production'||job.costFen!==10000||job.actionPoints!==1||!liabilities
   ||!incident.evidence.some(e=>e.kind==='boundary_trace'&&e.jobId===job.id&&e.incidentId===incident.id&&e.deploymentId===deploymentId&&e.date===job.completeAt))continue
  const investigation=attempts.find(a=>accepted(a)&&a.command.kind==='StartRiskTask'&&payload(a)?.incidentId===incident.id&&payload(a)?.kind==='investigate'
   &&payload(a)?.accountId===deployment.accountId&&payload(a)?.resourceId==='player-production'&&a.before.date===job.startAt&&job.id===storyId('job','investigate',a.command.commandId,incident.id))
  if(!investigation)continue
  for(const declaration of attempts){
   const p=payload(declaration)
   if(!accepted(declaration)||declaration.command.kind!=='DeclareRiskLiabilities'||p?.incidentId!==incident.id||p.snapshot===undefined
    ||liabilities.sourceCommandId!==declaration.command.commandId||liabilities.date!==declaration.before.date
    ||canonicalJson(p.snapshot)!==canonicalJson({contractIds:liabilities.contractIds,obligationIds:liabilities.obligationIds,jobIds:liabilities.jobIds}))continue
   const stop=attempts.find(a=>accepted(a)&&a.command.kind==='StopHengxingAuthority'&&payload(a)?.deploymentId===deploymentId&&ordered(a,declaration)
    &&a.before.date===deployment.stoppedAt&&a.before.date===declaration.before.date
    &&incident.selfReports.some(r=>r.deploymentId===deploymentId&&r.request==='stop_owned'&&r.reportedState==='stopped'&&r.sourceEventId===a.command.commandId&&r.date===a.before.date))
   if(!stop)continue
   const confirmation=attempts.find(a=>accepted(a)&&a.command.kind==='ConfirmRiskAssessment'&&payload(a)?.incidentId===incident.id&&ordered(investigation,a)&&ordered(a,stop)
    &&a.before.date>=job.completeAt&&a.before.date===stop.before.date)
   if(confirmation)return {businessId,deploymentId,incidentId:incident.id,investigationJobId:job.id,investigationCommandId:investigation.command.commandId,
    confirmCommandId:confirmation.command.commandId,stopCommandId:stop.command.commandId,declareCommandId:declaration.command.commandId}
  }
 }
 return null
}

