import {addDays,monthEnd} from './calendar.ts'
import {earnedMonthly} from './operations-calendar.ts'
import {STORY_CONTENT} from '../content/story.ts'
import {hashValue} from './hash.ts'
import type {StoryState,StoryDeployment,StoryIncident,StoryGrant} from './story-schema.ts'
import type {OperatingContext} from './operations-types.ts'
import {requireRule} from './errors.ts'
export const storyId=(...parts:string[])=>'story:'+hashValue(parts).slice(0,32)
export const initialStory=():StoryState=>({catalogVersion:STORY_CONTENT.version,catalogHash:hashValue(STORY_CONTENT),riskMode:'local_standard',linzhou:{opportunityAt:null,factId:null,pilotJobId:null,continuityJobId:null,participationJobId:null,willingness:'unknown',publicationChoice:null,choiceAt:null,branch:'pending',publishedAt:null,publicationSourceId:null},links:[],readiness:[],impacts:[],deployments:[],grants:[],externalDelegations:[],supportUses:[],jobs:[],incidents:[],evidence:[],reports:[],attempts:[],fees:[],network:[],sharedFindings:[],logs:[]})
export type StoryContext=OperatingContext&{readonly story?:StoryState|null}
export function storyOf(m:Pick<StoryContext,'story'>):StoryState{requireRule(m.story,'STORY_NOT_CONFIGURED');return m.story}
export function storyDeployment(m:StoryContext,id:string):StoryDeployment{const d=storyOf(m).deployments.find(d=>d.id===id);requireRule(d,'UNKNOWN_AGENT_DEPLOYMENT');requireRule(m.controlledAccountIds.includes(d.accountId),'AGENT_ACCOUNT_NOT_CONTROLLED');return d}
export function storyIncident(m:StoryContext,id:string):StoryIncident{const c=storyOf(m).incidents.find(c=>c.id===id);requireRule(c&&c.businessIds.some(id=>m.operations?.businesses.some(b=>b.id===id&&m.controlledAccountIds.includes(b.accountId))),'RISK_CASE_NOT_CONTROLLED');return c}
export function activeGrant(m:StoryContext,deploymentId:string,date:string):StoryGrant|undefined{return m.story?.grants.findLast(g=>g.deploymentId===deploymentId&&g.createdAt<=date&&g.expiresAt>=date&&(g.revokedAt===null||g.revokedAt>date))}
export function openToolAt(m:StoryContext,date:string){return m.story?.linzhou.branch==='open'&&m.story.linzhou.publishedAt!==null&&m.story.linzhou.publishedAt<=date}
export function storyCompetitionBps(m:StoryContext,date:string){return openToolAt(m,date)&&date>=STORY_CONTENT.linzhou.competitionFrom&&date<=STORY_CONTENT.linzhou.competitionTo?STORY_CONTENT.linzhou.competitionBps:0}
/** Reconstruct wages from actual dated payments; later payment cannot rewrite an earlier quote. */
export function obligationOutstandingAt(m:Pick<StoryContext,'economy'>,o:StoryContext['economy']['ledger']['obligations'][number],date:string,beforeActionId?:string){
 if(o.date>date)return 0
 const cutoff=beforeActionId?m.economy.receipts.findIndex(r=>{const p=JSON.parse(r.signature);return p.kind==='reserve_action'&&p.action.id===beforeActionId}):-1
 const prior=cutoff<0?null:new Set(m.economy.receipts.slice(0,cutoff).map(r=>r.id))
 const paid=m.economy.ledger.transactions.filter(t=>t.referenceId===o.id&&t.date<=date&&(prior===null||prior.has(t.id))).reduce((n,t)=>n-t.lines.filter(l=>l.accountId===o.accountId&&l.deltaFen<0).reduce((s,l)=>s+l.deltaFen,0),0)
 return Math.max(0,o.amountFen-paid)
}
export function safetyReady(m:StoryContext,d:StoryDeployment,date:string,beforeActionId?:string){
 const cutoff=beforeActionId?m.economy.receipts.findIndex(r=>{const p=JSON.parse(r.signature);return p.kind==='reserve_action'&&p.action.id===beforeActionId}):-1
 const prior=cutoff<0?null:new Set(m.economy.receipts.slice(0,cutoff).map(r=>r.id))
 return !!d.backupResourceId&&(d.backupResourceId==='player-production'||!!m.operations?.workers.some(w=>w.id===d.backupResourceId&&w.from<=date&&(w.to===null||w.to>=date)&&!m.economy.ledger.obligations.some(o=>o.sourceEventId===w.id&&obligationOutstandingAt(m,o,date,beforeActionId)>0)))&&[d.recordsJobId,d.drillJobId].every(id=>m.story?.jobs.some(j=>j.id===id&&j.status==='completed'&&j.completeAt<=date&&(prior===null||prior.has(storyId('complete',j.id)))))
}
export function agentSupportGrant(m:StoryContext,businessId:string,deploymentId:string|null|undefined,mode:string,from:string,to:string):StoryGrant{
 requireRule(deploymentId,'AGENT_DEPLOYMENT_REQUIRED');const d=storyDeployment(m,deploymentId),g=activeGrant(m,d.id,from),b=m.operations?.businesses.find(b=>b.id===businessId)
 requireRule(b&&d.businessId===businessId&&d.accountId===b.accountId&&d.lifecycle==='active'&&d.activeFrom!==null&&d.activeFrom<=from&&to<=d.expiresAt,'AGENT_NOT_READY_FOR_BUSINESS')
 requireRule(!m.economy.ledger.obligations.some(o=>o.sourceEventId===d.id&&o.remainingFen>0&&o.date<=m.economy.asOf),'AGENT_SERVICE_FEE_OVERDUE')
 requireRule(g&&g.expiresAt>=to&&g.scopes.includes(b.route==='ai_course'?'course_support':'relay_support'),'AGENT_SCOPE_NOT_AUTHORIZED')
 if(mode==='delegated_group'||mode==='delegated')requireRule(g.level==='cross_flow'&&g.externalDelegation,'AGENT_EXPANSION_NOT_AUTHORIZED')
 requireRule(!m.story?.incidents.some(c=>c.businessIds.includes(businessId)&&['confirmed','containing','recovering','takeover'].includes(c.stage)),'AGENT_INDEPENDENT_RISK_PENDING')
 return g
}
export function independentRiskReasons(m:StoryContext,businessId:string){return m.story?.incidents.some(c=>c.businessIds.includes(businessId)&&!['normal','resolved'].includes(c.stage)&&c.signals.some(s=>s.source!=='system_report'))?['INDEPENDENT_RISK_EVIDENCE']:[]}

export const isAgentSupportMode=(mode:string)=>['assisted_group','delegated_group','assisted','delegated'].includes(mode)
export function authorizedAgentCommitment(m:StoryContext,grantId:string){return m.story?.supportUses.filter(u=>u.grantId===grantId).reduce((n,u)=>{const j=m.operations?.jobs.find(j=>j.id===u.jobId),a=m.economy.actions.find(a=>a.definition.id===j?.actionId);return n+(j?.status==='cancelled'?0:a?.definition.costFen??0)},0)??0}
export function checkAgentBudget(m:StoryContext,g:StoryGrant,newAmountFen:number){requireRule(authorizedAgentCommitment(m,g.id)+newAmountFen<=g.cashLimitFen,'AGENT_CASH_LIMIT_EXCEEDED')}
export function agentServiceEarned(d:StoryDeployment,month:string,through:string){if(d.activeFrom===null)return 0;const end=[addDays(d.expiresAt,1),...(d.stoppedAt?[addDays(d.stoppedAt,1)]:[])].sort()[0]!;return earnedMonthly(d.monthlyFeeFen,[{from:d.activeFrom,to:end}],month,through)}
export function agentServiceUnbilled(m:Pick<StoryContext,'story'>,d:StoryDeployment,date:string){if(d.activeFrom===null)return 0;let sum=0;for(let month=d.activeFrom.slice(0,7);month<=date.slice(0,7);month=addDays(monthEnd(month+'-01'),1).slice(0,7)){const billed=m.story?.fees.filter(f=>f.deploymentId===d.id&&f.month===month).reduce((n,f)=>n+f.amountFen,0)??0;sum+=Math.max(0,agentServiceEarned(d,month,date)-billed)}return sum}

/** A witnessed business result, rather than a setup flag, unlocks broader delegation. */
export function hasAgentBusinessResult(m:StoryContext,deploymentId:string,date:string){return m.story?.supportUses.some(u=>{if(u.deploymentId!==deploymentId)return false;const j=m.operations?.jobs.find(j=>j.id===u.jobId),a=m.economy.actions.find(a=>a.definition.id===j?.actionId);if(!j||j.status!=='completed'||j.completeAt>date||!a||!(a.definition.costFen<u.manualCostFen||addDays(j.startAt,u.manualDays)>j.completeAt))return false;const p=m.relay?.periods.find(p=>p.supportJobId===j.id);if(p)return p.feePostedAt!==null&&p.feePostedAt<=date&&m.economy.ledger.metrics.some(e=>e.sourceEventId===p.id&&e.kind==='income'&&e.deltaFen>0&&e.date<=date);const co=m.course?.cohorts.find(co=>co.slots.some(slot=>slot.jobId===j.id));return !!co?.stages.some(stage=>stage.deliveredAt!==null&&stage.deliveredAt<=date&&stage.amountFen>0)})??false}
