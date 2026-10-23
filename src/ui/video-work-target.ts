import type {VideoProjection} from '../core/video-projection.ts'
import {canonicalVideoTarget,videoTargetReason,type VideoSceneTarget} from './video-scene-progress.ts'

/** A calendar job can point only to its unique public video owner and original business. */
export function videoWorkTarget(video:VideoProjection,jobId:string,businessId:string):{accountId:string;videoTarget:VideoSceneTarget}|null{
 if(!video)return null
 const matches=new Map<string,{accountId:string;videoTarget:VideoSceneTarget}>()
 const add=(target:VideoSceneTarget)=>{
  const channels=video.channels.filter(c=>c.id===target.channelId&&c.businessId===businessId)
  if(channels.length!==1||videoTargetReason(video,target)!==null)return
  const canonical=canonicalVideoTarget(video,target)
  matches.set(JSON.stringify(canonical),{accountId:channels[0]!.accountId,videoTarget:canonical})
 }
 for(const work of video.works)if([work.production,...work.corrections].some(j=>j?.id===jobId&&j.businessId===businessId))add({channelId:work.channelId,workId:work.id,...(work.contractId?{contractId:work.contractId}:{})})
 for(const contract of video.contracts)if(contract.negotiationJobId===jobId)add({channelId:contract.channelId,workId:contract.workId,contractId:contract.id})
 for(const marketing of video.marketing)if(marketing.job?.id===jobId&&marketing.job.businessId===businessId)add({channelId:marketing.channelId,marketingId:marketing.id})
 return matches.size===1?[...matches.values()][0]!:null
}
