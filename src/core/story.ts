import {storyValidationContext} from './story-validation-context.ts'
import {StoryRisk,riskKinds} from './story-risk.ts'
import {assertStoryRisk} from './story-risk-validation.ts'
import {guardStoryCommand} from './story-boundary.ts'
import {STORY_CONTENT} from '../content/story.ts'
import {addDays} from './calendar.ts'
import {StoryAgency,agencyKinds} from './story-agency.ts'
import {checkExistingAgentSupport} from './story-support.ts'
import type {OperationsRuntime} from './operations.ts'
import {StoryWork,storyEvent,type StoryModel} from './story-work.ts'
import {StoryHistory} from './story-history.ts'
import {initialStory,storyOf} from './story-state.ts'
import {queueEvent,type ScheduledEvent} from './timeline.ts'
import type {RunOperation} from './content-types.ts'
import type {GameRun,RuleModel} from './run-types.ts'
import type {CommandContext,CommandView} from './commands.ts'
import {visibleFacts} from './facts.ts'
import {requireRule} from './errors.ts'
/** One committed story state, sharing the existing clock and business resources. */
export class StoryRuntime {
 readonly work=new StoryWork();readonly history=new StoryHistory(this.work);readonly agency:StoryAgency;readonly risk:StoryRisk
 constructor(operations:OperationsRuntime){this.agency=new StoryAgency(this.work,operations);this.risk=new StoryRisk(this.work,this.agency)}
 get catalog(){return this.history.catalog}
 initial(){return initialStory()}
 schedule(m:RuleModel){let timeline=m.timeline;for(const e of [...this.history.events(),...this.risk.events()])timeline=queueEvent(timeline,e);return {...m,timeline}}
 inspect(view:CommandView,kind:string,payload:Record<string,unknown>){return (riskKinds as readonly string[]).includes(kind)?this.risk.inspect(view,kind,payload,view.date):(agencyKinds as readonly string[]).includes(kind)?this.agency.inspect(view,kind,payload,view.date):this.history.inspect(view,kind,payload,view.date)}
 apply(m:RuleModel,kind:string,payload:Record<string,unknown>,context:CommandContext):RuleModel{
  const view:CommandView={pending:m.timeline.pending,runId:context.runId,actorId:context.actorId,revision:context.revision,date:context.date,phase:m.phase,controlledAccountIds:m.controlledAccountIds,economy:m.economy,cursor:m.timeline.cursor,pause:m.timeline.pause,evidence:visibleFacts(m.facts),world:m.world,operations:m.operations,market:m.market,video:m.video,course:m.course,relay:m.relay,routines:m.routines,deepseek:m.deepseek,story:m.story,life:m.life,journey:m.journey}
  this.inspect(view,kind,payload);const r=(riskKinds as readonly string[]).includes(kind)?this.risk.apply(m,kind,payload,context):(agencyKinds as readonly string[]).includes(kind)?this.agency.apply(m,kind,payload,context):this.history.apply(m,kind,payload,context);let state=r.state;if(kind==='InterruptStoryWork'){const j=storyOf(state).jobs.find(j=>j.id===payload.jobId)!;state=this.agency.onInterrupted(state,j,context.date)}const added=[...r.newEvents];if(kind==='SetHengxingAuthority'&&payload.level==='cross_flow'){const g=storyOf(state).grants.at(-1)!;const at=addDays(context.date,STORY_CONTENT.authorityCheckDays);if(at<=g.expiresAt)added.push(storyEvent('authority_check',g.id,at))}if(kind==='StopHengxingAuthority'||kind==='SetHengxingAuthority'&&payload.level!=='cross_flow'){const d=storyOf(state).deployments.find(d=>d.id===payload.deploymentId);if(d){const withdrawal=this.risk.ensureWithdrawal(state,d.id,context.date,context.commandId);state=withdrawal.state;added.push(...withdrawal.newEvents)}}let timeline=m.timeline;if('clearPause' in r&&r.clearPause)timeline={...timeline,pause:null};for(const e of added)timeline=queueEvent(timeline,e);if(kind==='AcknowledgeStoryPause'&&timeline.pause===null){const existing=state.economy.ledger.obligations.find(o=>o.remainingFen>0&&state.story?.logs.some(l=>l.id===o.originOperationId&&l.date===context.date));if(existing)timeline={...timeline,pause:{instanceId:existing.originOperationId,reason:'CASH_SHORTFALL',source:'command'}}}const gap=state.economy.ledger.obligations.find(o=>o.remainingFen>0&&!m.economy.ledger.obligations.some(p=>p.id===o.id&&p.remainingFen>0));if(gap&&timeline.pause===null)timeline={...timeline,pause:{instanceId:gap.originOperationId,reason:'CASH_SHORTFALL',source:'command'}};return {...m,...state,timeline}
 }
 worldUpdated(m:StoryModel,event:ScheduledEvent<RunOperation>){return this.history.worldUpdated(m,event)}
 jobConstraint(m:import('./story-state.ts').StoryContext,id:string,from:string,to:string,jobId?:string,businessId?:string){checkExistingAgentSupport(m,id,from,to,jobId,businessId)}
 synchronize(m:StoryModel,date:string){return this.agency.synchronize(m,date)}
 guard(view:CommandView,kind:string,payload:unknown){guardStoryCommand(view,kind,payload)}
 closeConstraint(m:import('./story-state.ts').StoryContext,id:string){requireRule(!m.story?.jobs.some(j=>j.businessId===id&&j.status==='running'),'UNFINISHED_STORY_WORK');this.agency.closeConstraint(m,id,m.economy.asOf)}
 reduce(m:StoryModel,event:ScheduledEvent<RunOperation>){
  const p=event.payload;requireRule(p.kind==='story_event','INVALID_STORY_EVENT')
  let result:{state:StoryModel;newEvents?:readonly ScheduledEvent<RunOperation>[];skippedReason?:string}
  if(p.type==='finish_job'){
   const before=storyOf(m).jobs.find(j=>j.id===p.entityId);requireRule(before,'STORY_JOB_MISSING');const reason=this.agency.completionReason(m,before)
   if(reason&&before.status==='running'){const stopped=this.work.interrupt(m,before.id,event.date);result={state:this.agency.onInterrupted(stopped,before,event.date),skippedReason:'STORY_WORK_FAILED:'+reason}}
   else{const r=this.work.finish(m,p.entityId,event.date);if(['deployment','records','drill'].includes(r.job.kind))result={...r,...this.agency.finishWork(r.state,r.job,event.date)};else if(['pilot','continuity','participation'].includes(r.job.kind))result={...r,state:this.history.finishWork(r.state,r.job,event.date)};else result={...r,...this.risk.finishWork(r.state,r.job,event.date)}}
  }else if(['agent_fee','grant_expiry','deployment_expiry'].includes(p.type))result=this.agency.reduce(m,event)
  else if(p.type==='linzhou_offer'||p.type==='linzhou_publish')result=this.history.reduce(m,event);else result=this.risk.reduce(m,event)
  const gap=result.state.economy.ledger.obligations.some(o=>o.remainingFen>0&&!m.economy.ledger.obligations.some(p=>p.id===o.id&&p.remainingFen>0));return {...result,...(gap?{pauseReason:'CASH_SHORTFALL'}:{})}
 }

 validate(run:GameRun){const context=storyValidationContext(run);this.work.validate(run,context);this.history.validate(run,context);this.agency.validate(run,context);assertStoryRisk(run,this.risk,context);const s=storyOf(run),events=context.events;for(const event of events){const p=event.payload;if(p.kind!=='story_event')continue;if(p.type==='linzhou_offer'||p.type==='linzhou_publish')requireRule(this.history.events().some(e=>e.instanceId===event.instanceId),'ORPHAN_STORY_HISTORY_EVENT');requireRule(['linzhou_offer','linzhou_publish','finish_job','agent_fee','grant_expiry','deployment_expiry','network','external_claim','incident_deadline','agent_attempt','authority_check','network_adoption','network_review','claim_response'].includes(p.type),'STORY_EVENT_HANDLER_REQUIRED');const expected=storyEvent(p.type,p.entityId,p.date,p.occurrence,p.type==='finish_job'?'player_actions':p.type==='agent_fee'?'due_obligations':'world_update');requireRule(expected.instanceId===event.instanceId&&expected.phase===event.phase&&expected.priority===event.priority,'STORY_EVENT_IDENTITY_MISMATCH')}
  requireRule(new Set(s.logs.map(l=>l.id)).size===s.logs.length,'DUPLICATE_STORY_LOG');for(const l of s.logs)requireRule(l.date<=run.timeline.cursor.date,'STORY_FUTURE_LOG')
 }
}
