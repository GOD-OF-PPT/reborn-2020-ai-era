import type { CommandEnvelope } from '../core/run-types.ts'
import type { PlayFeatures,PlayingView } from './game-types.ts'
/** Presentation reads ownership already decided by the rule model. */
export function intentAccount(command:CommandEnvelope,view:PlayingView,features:PlayFeatures):string{
 const p=command.payload as Record<string,unknown>
 if(typeof p.accountId==='string')return p.accountId
 if(['WorkQuarter','QuitWork','StartFirstOrder','ResearchMarket','StopMarketResearch','FavoriteMemory','ReadNews'].includes(command.kind))return 'personal'
 if(typeof p.orderId==='string')return features.market.orders.find(o=>o.id===p.orderId)?.accountId??'personal'
 if(typeof p.instanceId==='string')return features.workbench.events.find(e=>e.id===p.instanceId)?.accountId??'personal'
 if(typeof p.jobId==='string'&&command.kind==='InterruptPreparation')return features.workbench.preparationJobs.find(j=>j.id===p.jobId)?.accountId??'personal'
 const businessId=typeof p.businessId==='string'?p.businessId:typeof p.contractId==='string'?view.operations?.contracts.find(c=>c.id===p.contractId)?.businessId:typeof p.jobId==='string'?view.operations?.jobs.find(j=>j.id===p.jobId)?.businessId:null
 if(businessId)return view.operations?.businesses.find(b=>b.id===businessId)?.accountId??'personal'

 return 'personal'
}
