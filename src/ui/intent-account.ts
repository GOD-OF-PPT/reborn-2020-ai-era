import type { CommandEnvelope } from '../core/run-types.ts'
import type { PlayFeatures,PlayingView } from './game-types.ts'
/** Presentation reads ownership already decided by the rule model. */
export function intentAccount(command:CommandEnvelope,view:PlayingView,features:PlayFeatures):string{
 const p=command.payload as Record<string,unknown>
 if(command.kind==='FundBusiness'||command.kind==='OpenCourseStudio')return 'personal'
 if(typeof p.accountId==='string')return p.accountId
 if(['WorkQuarter','QuitWork','StartFirstOrder','ResearchMarket','StopMarketResearch','FavoriteMemory','ReadNews'].includes(command.kind))return 'personal'
 const courseId=typeof p.courseId==='string'?p.courseId:typeof p.cohortId==='string'?features.course?.cohorts.find(c=>c.id===p.cohortId)?.courseId:null
 if(courseId){const c=features.course?.courses.find(c=>c.id===courseId);return view.operations?.businesses.find(b=>b.id===c?.businessId)?.accountId??'personal'}
 const videoChannelId=typeof p.channelId==='string'?p.channelId:typeof p.workId==='string'?features.video?.works.find(w=>w.id===p.workId)?.channelId:typeof p.contractId==='string'?features.video?.contracts.find(c=>c.id===p.contractId)?.channelId:typeof p.applicationId==='string'?features.video?.applications.find(a=>a.id===p.applicationId)?.channelId:typeof p.publicationId==='string'?features.video?.publications.find(a=>a.id===p.publicationId)?.channelId:typeof p.settlementId==='string'?features.video?.settlements.find(a=>a.id===p.settlementId)?.channelId:null
 if(videoChannelId)return features.video?.channels.find(c=>c.id===videoChannelId)?.accountId??'personal'
 if(typeof p.orderId==='string')return features.market.orders.find(o=>o.id===p.orderId)?.accountId??'personal'
 if(typeof p.instanceId==='string')return features.workbench.events.find(e=>e.id===p.instanceId)?.accountId??'personal'
 if(typeof p.jobId==='string'&&command.kind==='InterruptPreparation')return features.workbench.preparationJobs.find(j=>j.id===p.jobId)?.accountId??'personal'
 const businessId=typeof p.businessId==='string'?p.businessId:typeof p.contractId==='string'?view.operations?.contracts.find(c=>c.id===p.contractId)?.businessId:typeof p.jobId==='string'?view.operations?.jobs.find(j=>j.id===p.jobId)?.businessId:null
 if(businessId)return view.operations?.businesses.find(b=>b.id===businessId)?.accountId??'personal'

 return 'personal'
}
