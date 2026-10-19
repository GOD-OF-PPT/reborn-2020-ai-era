import {requireRule} from './errors.ts'
import {storyOf,storyId,agentSupportGrant,checkAgentBudget,type StoryContext} from './story-state.ts'
import {patchStory,type StoryModel} from './story-work.ts'
export function recordAgentSupport<M extends StoryModel>(m:M,jobId:string,deploymentId:string|null,mode:'assisted_group'|'delegated_group'|'assisted'|'delegated',manualCostFen:number,manualDays:number,sourceCommandId:string):M{
 const job=m.operations?.jobs.find(j=>j.id===jobId);requireRule(job,'AGENT_SUPPORT_JOB_MISSING');const grant=agentSupportGrant(m,job.businessId,deploymentId,mode,job.startAt,job.completeAt),action=m.economy.actions.find(a=>a.definition.id===job.actionId);requireRule(action,'AGENT_SUPPORT_ACTION_MISSING');checkAgentBudget(m,grant,action.definition.costFen);const s=storyOf(m);requireRule(!s.supportUses.some(u=>u.jobId===jobId),'AGENT_SUPPORT_REUSED')
 return patchStory(m,{supportUses:[...s.supportUses,{id:storyId('support-use',jobId),jobId,sourceCommandId,deploymentId:deploymentId!,grantId:grant.id,businessId:job.businessId,date:m.economy.asOf,mode,manualCostFen,manualDays}]})
}
/** Already-confirmed support freezes its grant; a later future-scope change cannot rewrite it. */
export function checkExistingAgentSupport(m:StoryContext,definitionId:string,from:string,to:string,jobId?:string,businessId?:string){
 if(!/^(course|relay)-support-.*(assisted|delegated)/.test(definitionId))return
 if(jobId===undefined){requireRule(businessId&&m.story?.deployments.some(d=>d.businessId===businessId&&d.lifecycle==='active'),'AGENT_DEPLOYMENT_REQUIRED');return}
 const use=m.story?.supportUses.find(u=>u.jobId===jobId),d=m.story?.deployments.find(d=>d.id===use?.deploymentId),g=m.story?.grants.find(g=>g.id===use?.grantId)
 requireRule(use&&d&&g&&use.businessId===businessId&&d.businessId===businessId&&d.activeFrom!==null&&d.activeFrom<=from&&d.lifecycle==='active'&&d.stoppedAt===null&&to<=d.expiresAt,'AGENT_SUPPORT_PERMISSION_REVOKED')
 requireRule(!m.economy.ledger.obligations.some(o=>o.sourceEventId===d.id&&o.remainingFen>0&&o.date<=m.economy.asOf),'AGENT_SERVICE_FEE_OVERDUE')
 requireRule(g.createdAt<=use.date&&g.expiresAt>=to&&(g.revokedAt===null||g.revokedAt>=use.date),'AGENT_SUPPORT_GRANT_EXPIRED')
}
