import type { CommandEnvelope } from '../core/run-types.ts'
import type { PlayFeatures,PlayingView } from './game-types.ts'
/** Presentation reads ownership already decided by the rule model. */
export function intentAccount(command:CommandEnvelope,view:PlayingView,features:PlayFeatures):string{
 const p=command.payload as Record<string,unknown>
 if(command.kind==='FundBusiness'||command.kind==='OpenCourseStudio'||command.kind==='OpenRelayStation')return 'personal'
 if(typeof p.accountId==='string')return p.accountId
 if(['WorkQuarter','QuitWork','StartFirstOrder','ResearchMarket','StopMarketResearch','FavoriteMemory','ReadNews'].includes(command.kind))return 'personal'
 if(typeof p.planId==='string')return features.routines?.plans.find(plan=>plan.id===p.planId)?.accountId??'personal'
 if(typeof p.auditId==='string'){const audit=features.relay?.audits.find(a=>a.id===p.auditId);if(audit)return view.operations?.businesses.find(b=>b.id===audit.businessId)?.accountId??'personal'}
 const relayCustomerId=typeof p.customerId==='string'?p.customerId:typeof p.meterId==='string'?features.relay?.meters.find(m=>m.id===p.meterId)?.customerId:typeof p.receivableId==='string'?features.relay?.receivables.find(r=>r.id===p.receivableId)?.customerId:null
 const relayBusinessId=typeof p.periodId==='string'?features.relay?.periods.find(period=>period.id===p.periodId)?.businessId:relayCustomerId?features.relay?.customers.find(c=>c.id===relayCustomerId)?.businessId:typeof p.applicationId==='string'?features.relay?.applications.find(a=>a.id===p.applicationId)?.businessId:null
 if(relayBusinessId)return view.operations?.businesses.find(b=>b.id===relayBusinessId)?.accountId??'personal'
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
