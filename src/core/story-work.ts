import {storyValidationContext,type StoryValidationContext} from './story-validation-context.ts'
import {STORY_CONTENT} from '../content/story.ts'
import {addDays} from './calendar.ts'
import {actionBudget,applyEconomy,type EconomyOperation} from './economy.ts'
import {accountFunds} from './ledger.ts'
import {requireRule,RuleError} from './errors.ts'
import {remainingCapacity,capacityUsage} from './operations.ts'
import {hashValue} from './hash.ts'
import {openToolAt,safetyReady,storyId,storyOf,type StoryContext} from './story-state.ts'
import type {StoryJobKind,StoryJob,StoryState} from './story-schema.ts'
import type {OperatingModel} from './operations-types.ts'
import type {GameRun} from './run-types.ts'
import type {RunOperation} from './content-types.ts'
import type {ScheduledEvent} from './timeline.ts'
export type StoryModel=OperatingModel
export const storyEvent=(type:import('./story-schema.ts').StoryEvent['type'],entityId:string,date:string,occurrence=0,phase:ScheduledEvent<RunOperation>['phase']='world_update'):ScheduledEvent<RunOperation>=>({instanceId:storyId(type,entityId,date,String(occurrence)),date,phase,priority:type==='finish_job'?50:-20,payload:{kind:'story_event',type,entityId,date,occurrence}})
export function patchStory<M extends StoryModel>(m:M,fields:Partial<StoryState>):M{return {...m,story:{...storyOf(m),...fields}}}
export function storyLog<M extends StoryModel>(m:M,id:string,date:string,sourceEventId:string,text:string,parentIds:readonly string[]=[],visibility:'visible'|'hidden'='visible'):M{const s=storyOf(m);requireRule(!s.logs.some(l=>l.id===id),'STORY_LOG_REUSED');return patchStory(m,{logs:[...s.logs,{id,date,sourceEventId,text,parentIds:[...parentIds],visibility}]})}
export function storyPost<M extends StoryModel>(m:M,op:EconomyOperation):M{return storyLog({...m,economy:applyEconomy(m.economy,op)},op.id,op.date,op.sourceEventId,op.kind)}
export function storyWorkTerms(m:StoryContext,kind:StoryJobKind,entityId:string,date:string,beforeActionId?:string){
 let costFen:number=STORY_CONTENT.jobs[kind].costFen,days:number=STORY_CONTENT.jobs[kind].days
 if(kind==='deployment'){if(m.story?.readiness.some(r=>r.anchorId===STORY_CONTENT.sharedAnchor&&r.preparationKey==='ecosystem_materials'&&r.date<=date))costFen=STORY_CONTENT.agent.preparedSetupCostFen;if(openToolAt(m,date))costFen=Math.min(costFen,STORY_CONTENT.agent.openSetupCostFen)}
 if(kind==='records'&&openToolAt(m,date))costFen=20000
 if(kind==='isolate'||kind==='recover'){const c=m.story?.incidents.find(c=>c.id===entityId),prepared=c&&c.deploymentIds.length>0&&c.deploymentIds.every(id=>{const d=m.story?.deployments.find(d=>d.id===id);return d&&safetyReady(m,d,date,beforeActionId)});if(prepared){costFen=kind==='isolate'?40000:30000;days=kind==='isolate'?3:5}}
 return {points:STORY_CONTENT.jobs[kind].points,costFen,days}
}
/** Dated work for history and incidents shares the original money, AP and personnel pools. */
export class StoryWork {
 inspect(m:StoryContext,kind:StoryJobKind,entityId:string,accountId:string,resourceId:string,date:string){
  requireRule(m.operations&&m.controlledAccountIds.includes(accountId),'STORY_ACCOUNT_NOT_CONTROLLED');const t=storyWorkTerms(m,kind,entityId,date),completeAt=addDays(date,t.days)
  requireRule(completeAt<='2025-12-31','STORY_WORK_OUTSIDE_TIMELINE');requireRule(actionBudget(m.economy,date).available>=t.points,'INSUFFICIENT_ACTION_POINTS');requireRule(accountFunds(m.economy.ledger,accountId).availableFen>=t.costFen,'INSUFFICIENT_AVAILABLE_FUNDS');requireRule(remainingCapacity(m,resourceId,date,completeAt)>=1,'INSUFFICIENT_CAPACITY')
  return {allowed:true,reasonCodes:[] as readonly string[],actionPoints:t.points,upfrontCostFen:t.costFen,releasedFen:0,actionDate:date}
 }
 start(m:StoryModel,kind:StoryJobKind,entityId:string,businessId:string|null,accountId:string,resourceId:string,date:string,commandId:string){
  this.inspect(m,kind,entityId,accountId,resourceId,date);const t=storyWorkTerms(m,kind,entityId,date),id=storyId('job',kind,commandId,entityId),actionId=storyId('action',id),completeAt=addDays(date,t.days)
  const definition={id:actionId,definitionId:'story-'+kind,accountId,counterpartyId:'world',...(businessId===null?{}:{businessId}),actionPoints:t.points,costFen:t.costFen,cashReservationId:storyId('funds',id),startAt:date,completeAt,settlementAt:completeAt}
  let next=storyPost(m,{kind:'reserve_action',id:storyId('reserve',id),sourceEventId:id,date,action:definition});next=storyPost(next,{kind:'execute_action',id:storyId('execute',id),sourceEventId:id,date,actionId})
  const job:StoryJob={id,kind,entityId,businessId,accountId,resourceId,originCommandId:commandId,actionId,startAt:date,completeAt,costFen:t.costFen,actionPoints:t.points,status:'running',releasedAt:null,result:null}
  next=patchStory(next,{jobs:[...storyOf(next).jobs,job]});return {state:next,job,newEvents:[storyEvent('finish_job',id,completeAt,0,'player_actions')]}
 }
 interrupt(m:StoryModel,jobId:string,date:string){const j=storyOf(m).jobs.find(j=>j.id===jobId);requireRule(j?.status==='running','STORY_JOB_NOT_RUNNING');let next=storyPost(m,{kind:'interrupt_action',id:storyId('interrupt',j.id),sourceEventId:j.id,date,actionId:j.actionId});next=patchStory(next,{jobs:storyOf(next).jobs.map(o=>o.id===j.id?{...o,status:'interrupted',releasedAt:date}:o)});return next}
 finish(m:StoryModel,jobId:string,date:string){
  const j=storyOf(m).jobs.find(j=>j.id===jobId);requireRule(j&&j.completeAt===date,'INVALID_STORY_COMPLETION')
  if(j.status==='interrupted')return {state:m,job:j,skippedReason:'STORY_JOB_INTERRUPTED'}
  requireRule(j.status==='running','STORY_JOB_ALREADY_FINISHED')
  try{requireRule(remainingCapacity(m,j.resourceId,j.startAt,j.completeAt,j.id)>=1,'INSUFFICIENT_CAPACITY');if(j.resourceId!=='player-production')requireRule(!m.economy.ledger.obligations.some(o=>o.sourceEventId===j.resourceId&&o.remainingFen>0&&o.date<=date),'WORKER_WAGE_OVERDUE')}
  catch(e){if(!(e instanceof RuleError))throw e;const next=this.interrupt(m,j.id,date);return {state:next,job:storyOf(next).jobs.find(o=>o.id===j.id)!,skippedReason:'STORY_WORK_FAILED:'+e.code}}
  let next=storyPost(m,{kind:'complete_action',id:storyId('complete',j.id),sourceEventId:j.id,date,actionId:j.actionId});const job:StoryJob={...j,status:'completed',releasedAt:date};next=patchStory(next,{jobs:storyOf(next).jobs.map(o=>o.id===j.id?job:o)});return {state:next,job}
 }
 validate(run:GameRun,context:StoryValidationContext=storyValidationContext(run)){
  const s=storyOf(run),events=context.events,economics=s.jobs.length?context.economics:new Map()
  requireRule(new Set(s.jobs.map(j=>j.id)).size===s.jobs.length,'DUPLICATE_STORY_JOB')
  for(const action of run.economy.actions)if(action.definition.definitionId.startsWith('story-'))requireRule(s.jobs.some(j=>j.actionId===action.definition.id),'ORPHAN_STORY_ACTION')
  for(const j of s.jobs){
   const origin=run.receipts.find(r=>r.commandId===j.originCommandId),a=run.economy.actions.find(a=>a.definition.id===j.actionId),t=storyWorkTerms(run,j.kind,j.entityId,j.startAt,j.actionId)
   const sourceKind=['pilot','continuity','participation'].includes(j.kind)?'StartLinzhouWork':j.kind==='deployment'?'StartHengxingDeployment':['records','drill'].includes(j.kind)?'StartAgentPreparation':'StartRiskTask';requireRule(origin?.kind===sourceKind,'STORY_WORK_COMMAND_KIND_MISMATCH')
   requireRule(origin&&origin.date===j.startAt&&j.id===storyId('job',j.kind,j.originCommandId,j.entityId)&&j.actionId===storyId('action',j.id)&&j.completeAt===addDays(j.startAt,t.days)&&j.costFen===t.costFen&&j.actionPoints===t.points&&j.startAt<=run.timeline.cursor.date,'INVALID_STORY_JOB_SOURCE')
   requireRule(a&&a.definition.definitionId==='story-'+j.kind&&a.definition.accountId===j.accountId&&(a.definition.businessId??null)===j.businessId&&a.definition.actionPoints===j.actionPoints&&a.definition.costFen===j.costFen&&a.definition.startAt===j.startAt&&a.definition.completeAt===j.completeAt&&a.definition.settlementAt===j.completeAt&&a.definition.cashReservationId===storyId('funds',j.id)&&a.definition.counterpartyId==='world','STORY_ACTION_MISMATCH')
   const reserve=economics.get(storyId('reserve',j.id)),execute=economics.get(storyId('execute',j.id));requireRule(reserve?.kind==='reserve_action'&&hashValue(reserve.action)===hashValue(a.definition)&&execute?.kind==='execute_action'&&execute.actionId===j.actionId&&execute.date===j.startAt,'STORY_ACTION_RECEIPT_MISSING')
   const timer=events.filter(e=>e.instanceId===storyEvent('finish_job',j.id,j.completeAt,0,'player_actions').instanceId);requireRule(timer.length===1,'MISSING_STORY_COMPLETION')
   const event=timer[0]!;requireRule(event.payload.kind==='story_event'&&event.payload.type==='finish_job'&&event.payload.entityId===j.id&&event.payload.occurrence===0&&event.payload.date===j.completeAt&&event.date===j.completeAt&&event.phase==='player_actions'&&event.priority===50,'INVALID_STORY_COMPLETION_EVENT')
   if(j.status==='running')requireRule(a.status==='executed'&&j.releasedAt===null&&!event.processed&&j.result===null,'INVALID_RUNNING_STORY_WORK')
   else if(j.status==='completed')requireRule(a.status==='completed'&&a.finishedAt===j.completeAt&&j.releasedAt===j.completeAt&&event.processed&&!event.skippedReason&&economics.get(storyId('complete',j.id))?.kind==='complete_action','INVALID_COMPLETED_STORY_WORK')
   else requireRule(a.status==='interrupted'&&a.finishedAt===j.releasedAt&&j.releasedAt!==null&&j.startAt<=j.releasedAt&&j.releasedAt<=j.completeAt&&j.result===null&&economics.get(storyId('interrupt',j.id))?.kind==='interrupt_action','INVALID_INTERRUPTED_STORY_WORK')
   if(j.businessId!==null)requireRule(run.operations?.businesses.some(b=>b.id===j.businessId&&b.accountId===j.accountId),'STORY_JOB_ACCOUNT_MISMATCH')
   requireRule(j.resourceId==='player-production'||run.operations?.workers.some(w=>w.id===j.resourceId&&w.from<=j.startAt&&(w.to===null||(j.releasedAt??j.completeAt)<=w.to)),'INVALID_STORY_RESOURCE')
   const units=j.resourceId==='player-production'?1:run.operations!.workers.find(w=>w.id===j.resourceId)!.units;requireRule(capacityUsage(run,j.resourceId,j.startAt,j.releasedAt??j.completeAt,j.id)<units,'STORY_RESOURCE_DOUBLE_BOOKED')
   if(j.status==='interrupted'&&event.processed)requireRule(event.skippedReason==='STORY_JOB_INTERRUPTED'||j.releasedAt===j.completeAt&&event.skippedReason?.startsWith('STORY_WORK_FAILED:'),'STORY_INTERRUPTION_RECEIPT_MISMATCH')
  }
  for(const e of events){const payload=e.payload;if(payload.kind==='story_event'&&payload.type==='finish_job')requireRule(s.jobs.some(j=>j.id===payload.entityId),'ORPHAN_STORY_TIMER')}
 }
}
