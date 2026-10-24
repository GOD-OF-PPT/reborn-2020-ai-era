import type {RelayProjection} from '../core/relay-projection.ts'
import {canonicalRelayTarget,type RelaySceneTarget,type RelaySceneContext} from './relay-scene-target.ts'

/** A calendar job returns only its unique original owner; an audit batch spanning periods needs explicit selection. */
export function relayWorkTarget(relay:RelayProjection,runId:string,jobId:string,operations:RelaySceneContext['operations']):RelaySceneTarget|null{
 if(!relay||!operations)return null
 const jobs=operations.jobs.filter(j=>j.id===jobId),job=jobs.length===1?jobs[0]:undefined
 if(!job)return null
 const businesses=relay.businesses.filter(b=>b.id===job.businessId),stations=relay.stations.filter(s=>s.businessId===job.businessId)
 if(businesses.length!==1||stations.length!==1)return null
 const business=businesses[0]!,base={runId,accountId:business.accountId,businessId:business.id,stationId:stations[0]!.id}
 const context={runId,accountId:base.accountId,operations},candidates:RelaySceneTarget[]=[]
 for(const period of relay.periods.filter(p=>p.businessId===business.id&&(p.jobId===jobId||p.supportJobId===jobId)))candidates.push({...base,kind:'period',periodId:period.id,jobId})
 const audits=relay.auditJobs.filter(a=>a.jobId===jobId)
 if(audits.length){
  if(audits.length!==1||audits[0]!.periodIds.length!==1)return null
  candidates.push({...base,kind:'period',periodId:audits[0]!.periodIds[0]!,jobId})
 }
 for(const application of relay.applications.filter(a=>a.businessId===business.id&&a.jobId===jobId))candidates.push({...base,kind:'application',applicationId:application.id})
 for(const audience of relay.audiences.filter(a=>a.businessId===business.id&&a.jobId===jobId))candidates.push({...base,kind:'audience',audienceId:audience.id})
 if(candidates.length!==1)return null
 return canonicalRelayTarget(relay,candidates[0]!,context)
}
