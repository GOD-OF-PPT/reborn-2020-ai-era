import {hashValue} from './hash.ts'
import {requireRule} from './errors.ts'
import {addDays,quarterOf} from './calendar.ts'
import {capacityUsage} from './operations.ts'
import {lifeStateSchema,type LifeJob,type LifePromise,type LifeState} from './life-schema.ts'
import {lifeOf,lifeId,lifeEvent,agendaEvents,lifePerson,personKnown,personAvailable,referenceAllowed,makeLifeOffer,jobTerms,LIFE_COMMAND_KINDS} from './life-state.ts'
import type {GameRun} from './run-types.ts'
import type {RunOperation} from './content-types.ts'
import type {ScheduledEvent} from './timeline.ts'
import type {LifeRuntime} from './life.ts'

type Event=ScheduledEvent<RunOperation>&{processed?:boolean;skippedReason?:string}
type Log=LifeState['logs'][number]
const payload=(r:GameRun['receipts'][number])=>JSON.parse(r.payloadSignature).payload as Record<string,unknown>

/** Checks all sources in both directions, including things an edited save tries to delete. */
export function assertLife(run:GameRun,runtime:LifeRuntime){
 const parsed=lifeStateSchema.safeParse(run.life);requireRule(parsed.success&&run.life&&run.operations&&run.world,'INVALID_LIFE_STATE')
 const s=lifeOf(run),date=run.timeline.cursor.date
 requireRule(s.catalogVersion===runtime.catalog.version&&s.catalogHash===runtime.hash,'LIFE_CONTENT_MISMATCH')
 for(const list of [s.jobs,s.promises,s.priorities,s.agenda,s.logs])requireRule(new Set(list.map(v=>v.id)).size===list.length,'DUPLICATE_LIFE_RECORD')
 const commands=new Map(run.receipts.map(r=>[r.commandId,r])),jobs=new Map(s.jobs.map(j=>[j.id,j])),logs=new Map(s.logs.map(l=>[l.id,l])),causes=new Map(run.causes.map(c=>[c.id,c]))
 // Per-validation indexes only: every actual timer must match an expected owner's
 // exact lifecycle event. Rebuilding an actual timer from itself is insufficient.
 const agenda=agendaEvents(),agendaIds=new Set(agenda.map(e=>e.instanceId)),expectedTimers=new Set<string>()
 const events:Event[]=[...run.timeline.pending,...run.timeline.receipts.map(r=>({...JSON.parse(r.signature),processed:true,skippedReason:r.skippedReason}) as Event)].filter(e=>e.payload.kind==='life_event'||e.instanceId.startsWith('life:'))
 const byEvent=new Map<string,Event[]>();for(const e of events){const rows=byEvent.get(e.instanceId)??[];rows.push(e);byEvent.set(e.instanceId,rows)}
 const eventFor=(expected:ScheduledEvent<RunOperation>)=>{const list=byEvent.get(expected.instanceId)??[];requireRule(list.length===1,'LIFE_TIMER_MISSING');const actual=list[0]!;requireRule(hashValue(actual.payload)===hashValue(expected.payload)&&actual.date===expected.date&&actual.phase===expected.phase&&actual.priority===expected.priority,'LIFE_TIMER_MISMATCH');expectedTimers.add(expected.instanceId);return actual}
 const clockRoot=(logId:string)=>{const c=causes.get(logId),r=commands.get(c?.commandId??'');requireRule(r&&['AdvanceTime','RunRoutineStep','AdvanceEpilogueTime'].includes(r.kind),'LIFE_CLOCK_CAUSE_MISSING');return r}
 const expectedLogs=new Set<string>()
 function expectLog(id:string,at:string,source:string,text:string,parents:readonly string[]=[],visibility:Log['visibility']='visible',commandId?:string){
  const l=logs.get(id),c=causes.get(id);requireRule(l&&l.date===at&&l.sourceEventId===source&&l.text===text&&l.visibility===visibility&&hashValue(l.parentIds)===hashValue(parents),'LIFE_LOG_SOURCE_MISMATCH')
  requireRule(c&&c.domain==='life'&&c.date===l.date&&c.sourceEventId===source&&c.visibleSummary===text&&c.visibility===visibility&&hashValue(c.parentIds)===hashValue(parents)&&commands.get(c.commandId)?.causeIds.includes(id)&&(commandId===undefined||c.commandId===commandId),'LIFE_CAUSE_MISMATCH');expectedLogs.add(id)
 }
 for(const expected of agenda){
  const e=eventFor(expected),record=s.agenda.find(a=>a.id===expected.instanceId),p=expected.payload;requireRule(p.kind==='life_event','INVALID_LIFE_TIMER')
  requireRule(Boolean(record)===Boolean(e.processed),'LIFE_AGENDA_PROGRESS_MISMATCH')
  if(record){const def=runtime.catalog.busy.find(b=>p.entityId===b.id+':start'||p.entityId===b.id+':end')!;requireRule(record.definitionId===p.entityId&&record.personId===def.personId&&record.date===e.date&&record.sourceEventId===e.instanceId&&!e.skippedReason,'LIFE_AGENDA_SOURCE_MISMATCH');expectLog(record.id,e.date,e.instanceId,p.entityId.endsWith(':start')?def.startText:def.endText,[],personKnown(run,def.personId,e.date)?'visible':'hidden');clockRoot(record.id)}
 }
 for(const a of s.agenda)requireRule(agendaIds.has(a.id),'ORPHAN_LIFE_AGENDA')
 let economics:Map<string,Record<string,unknown>>|null=null
 const economic=(id:string)=>{economics??=new Map(run.economy.receipts.map(r=>[r.id,JSON.parse(r.signature)]));return economics.get(id)}
 function interruptionRevision(j:LifeJob){const c=causes.get(lifeId('interrupted',j.id));return commands.get(c?.commandId??'')?.revisionAfter??Number.MAX_SAFE_INTEGER}
 for(const action of run.economy.actions)if(action.definition.definitionId.startsWith('life-'))requireRule(s.jobs.some(j=>j.actionId===action.definition.id),'ORPHAN_LIFE_ACTION')
 for(const j of s.jobs){
  const source=commands.get(j.originCommandId),p=source?payload(source):null,terms=jobTerms(j.kind,j.personId)
  requireRule(source&&source.date===j.startAt&&j.id===lifeId('job',j.originCommandId)&&j.actionId===lifeId('action',j.id)&&j.accountId==='personal'&&j.resourceId==='player-production'&&j.actionPoints===1&&j.costFen===terms.costFen&&j.completeAt===addDays(j.startAt,terms.days)&&(j.completeAt<='2025-12-31'||run.economy.tailQuarterLock==='2025-Q4'&&j.kind==='promise_keep')&&j.startAt<=date,'LIFE_JOB_SOURCE_MISMATCH')
  if(j.kind==='promise_keep'){
   const promise=s.promises.find(o=>o.id===j.promiseId),accepted=commands.get(promise?.acceptedCommandId??'')
   requireRule(source.kind==='FulfillLifePromise'&&p?.promiseId===promise?.id&&promise?.personId===j.personId&&j.reference===null&&accepted&&accepted.revisionAfter<source.revisionAfter&&promise.acceptedAt!==null&&promise.acceptedAt<=j.startAt&&j.completeAt<=promise.deadline,'LIFE_PROMISE_WORK_WITHOUT_ACCEPTANCE')
   const previous=s.jobs.filter(o=>o.id!==j.id&&o.promiseId===j.promiseId&&(commands.get(o.originCommandId)?.revisionAfter??Infinity)<source.revisionAfter)
   requireRule(previous.every(o=>o.status==='interrupted'&&o.releasedAt!==null&&o.releasedAt<=j.startAt&&interruptionRevision(o)<source.revisionAfter),'LIFE_PROMISE_WORK_REUSED_BEFORE_INTERRUPTION')
  }else{
   requireRule(source.kind==='StartLifeWork'&&p?.kind===j.kind&&(p.personId??null)===j.personId&&hashValue(p.reference??null)===hashValue(j.reference)&&j.promiseId===null,'LIFE_WORK_NOT_AUTHORIZED')
   if(j.kind==='rest'||j.kind==='workspace')requireRule(j.personId===null&&j.reference===null,'LIFE_WORK_UNEXPECTED_PERSON')
   else requireRule(j.personId!==null&&lifePerson(j.personId).work===j.kind&&personKnown(run,j.personId,j.startAt)&&referenceAllowed(run,j.personId,j.reference,j.startAt),'LIFE_ACTUAL_REFERENCE_REQUIRED')
   const previous=s.jobs.filter(o=>o.id!==j.id&&o.kind===j.kind&&o.personId===j.personId&&(j.kind==='workspace'||quarterOf(o.startAt)===quarterOf(j.startAt))&&(commands.get(o.originCommandId)?.revisionAfter??Infinity)<source.revisionAfter)
   requireRule(previous.every(o=>o.status==='interrupted'&&o.releasedAt!==null&&o.releasedAt<=j.startAt&&interruptionRevision(o)<source.revisionAfter),'LIFE_ACTIVITY_REUSED_BEFORE_INTERRUPTION')
  }
  if(j.personId!==null)requireRule(personAvailable(j.personId,j.startAt,j.completeAt),'LIFE_PERSON_UNAVAILABLE')
  const action=run.economy.actions.find(a=>a.definition.id===j.actionId),definition={id:j.actionId,definitionId:'life-'+j.kind,accountId:'personal',counterpartyId:'world',actionPoints:1,costFen:j.costFen,cashReservationId:lifeId('funds',j.id),startAt:j.startAt,completeAt:j.completeAt,settlementAt:j.completeAt}
  requireRule(action&&hashValue(action.definition)===hashValue(definition),'LIFE_ACTION_MISMATCH')
  const reserve=economic(lifeId('reserve',j.id)),execute=economic(lifeId('execute',j.id))
  requireRule(reserve?.kind==='reserve_action'&&reserve.date===j.startAt&&hashValue(reserve.action)===hashValue(definition)&&execute?.kind==='execute_action'&&execute.actionId===j.actionId&&execute.date===j.startAt,'LIFE_ACTION_RECEIPT_MISSING')
  expectLog(lifeId('reserve',j.id),j.startAt,j.id,'reserve_action',[],'visible',j.originCommandId);expectLog(lifeId('execute',j.id),j.startAt,j.id,'execute_action',[],'visible',j.originCommandId)
  expectLog(j.id,j.startAt,j.id,'已实际开始：'+terms.title+'；完成与后续效果仍按真实日期处理。',[lifeId('reserve',j.id),lifeId('execute',j.id)],'visible',j.originCommandId)
  const timer=eventFor(lifeEvent('finish_job',j.id,j.completeAt))
  if(j.status==='running')requireRule(action.status==='executed'&&j.releasedAt===null&&j.result===null&&j.interruptedBy===null&&j.interruptionReason===null&&!timer.processed,'INVALID_RUNNING_LIFE_WORK')
  if(j.status==='completed'){
   const result=j.kind==='rest'?'rested':j.kind==='workspace'?'workspace_ready':j.kind==='promise_keep'?'promise_fulfilled':'shared_experience',complete=economic(lifeId('complete',j.id))
   requireRule(action.status==='completed'&&action.finishedAt===j.completeAt&&j.releasedAt===j.completeAt&&j.result===result&&j.interruptedBy===null&&j.interruptionReason===null&&timer.processed&&!timer.skippedReason&&complete?.kind==='complete_action'&&complete.actionId===j.actionId&&complete.date===j.completeAt,'INVALID_COMPLETED_LIFE_WORK')
   expectLog(lifeId('complete',j.id),j.completeAt,j.id,'complete_action');expectLog(lifeId('result',j.id),j.completeAt,j.id,'生活工作实际完成：'+terms.title+'。',[j.id,lifeId('complete',j.id)]);clockRoot(lifeId('result',j.id))
  }
  if(j.status==='interrupted'){
   const interrupted=economic(lifeId('interrupt',j.id));requireRule(action.status==='interrupted'&&action.finishedAt===j.releasedAt&&j.releasedAt!==null&&j.startAt<=j.releasedAt&&j.releasedAt<=j.completeAt&&j.result===null&&j.interruptedBy!==null&&j.interruptionReason!==null&&interrupted?.kind==='interrupt_action'&&interrupted.actionId===j.actionId&&interrupted.date===j.releasedAt,'INVALID_INTERRUPTED_LIFE_WORK')
   const command=commands.get(j.interruptedBy)
   if(j.interruptionReason==='PLAYER_INTERRUPTED')requireRule(command?.kind==='InterruptLifeWork'&&payload(command).jobId===j.id&&command.date===j.releasedAt,'LIFE_INTERRUPTION_WITHOUT_COMMAND')
   else requireRule(j.interruptedBy===timer.instanceId&&timer.processed&&timer.skippedReason===j.interruptionReason&&j.releasedAt===j.completeAt&&j.interruptionReason.startsWith('LIFE_COMPLETION_FAILED:'),'LIFE_FAILED_COMPLETION_WITHOUT_TIMER')
   if(timer.processed)requireRule(timer.skippedReason==='LIFE_WORK_INTERRUPTED'||timer.skippedReason===j.interruptionReason,'LIFE_INTERRUPTION_RECEIPT_MISMATCH')
   expectLog(lifeId('interrupt',j.id),j.releasedAt,j.id,'interrupt_action');expectLog(lifeId('interrupted',j.id),j.releasedAt,j.interruptedBy,'生活工作已中断，已付成本与已耗行动保留：'+j.interruptionReason,[j.id,lifeId('interrupt',j.id)])
  }
  requireRule(capacityUsage(run,'player-production',j.startAt,j.releasedAt??j.completeAt,j.id)<1,'LIFE_RESOURCE_DOUBLE_BOOKED')
 }
 const expectedOffers=new Map<string,LifePromise>()
 for(const j of [...s.jobs].sort((a,b)=>a.completeAt.localeCompare(b.completeAt)||a.id.localeCompare(b.id))){const offer=makeLifeOffer(j);if(offer&&!expectedOffers.has(offer.id)&&personAvailable(offer.personId,offer.offeredAt,addDays(offer.offeredAt,1)))expectedOffers.set(offer.id,offer)}
 requireRule(s.promises.length===expectedOffers.size,'LIFE_PROMISE_RECORD_MISSING')
 for(const promise of s.promises){
  const expected=expectedOffers.get(promise.id),job=jobs.get(promise.sharedJobId)
  requireRule(expected&&job&&['personId','year','sharedJobId','offeredAt','expiresAt','deadline','costFen','days','actionPoints'].every(key=>Reflect.get(promise,key)===Reflect.get(expected,key)),'LIFE_PROMISE_TERMS_REWRITTEN')
  expectLog(promise.id,promise.offeredAt,job.id,lifePerson(promise.personId).name+'根据实际共同经历提出一项有限约定，接受仍由你决定。',[lifeId('result',job.id)]);const offeredRoot=clockRoot(promise.id)
  const expiry=eventFor(lifeEvent('offer_expiry',promise.id,addDays(promise.expiresAt,1))),due=eventFor(lifeEvent('promise_due',promise.id,promise.deadline))
  if(expiry.processed)requireRule(expiry.skippedReason===(promise.status==='expired'?undefined:'LIFE_OFFER_ALREADY_ANSWERED'),'LIFE_EXPIRY_RECEIPT_REWRITTEN')
  if(due.processed)requireRule(due.skippedReason===(promise.status==='missed'?undefined:'LIFE_PROMISE_NOT_OUTSTANDING'),'LIFE_DUE_RECEIPT_REWRITTEN')
  const responses=run.receipts.filter(r=>['AcceptLifePromise','DeclineLifePromise'].includes(r.kind)&&payload(r).promiseId===promise.id);requireRule(responses.length<=1,'LIFE_PROMISE_MULTIPLE_RESPONSES');const response=responses[0]
  const cancellations=s.agenda.filter(a=>a.personId===promise.personId&&a.definitionId.endsWith(':start')&&a.date>=promise.offeredAt&&a.date<=promise.expiresAt)
  if(response){requireRule(response.revisionAfter>offeredRoot.revisionAfter&&promise.responseCommandId===response.commandId&&response.date>=promise.offeredAt&&response.date<=promise.expiresAt&&cancellations.every(a=>clockRoot(a.id).revisionAfter>response.revisionAfter),'LIFE_RESPONSE_AFTER_OFFER_ENDED')}
  else requireRule(promise.responseCommandId===null,'LIFE_PROMISE_RESPONSE_MISSING')
  if(promise.acceptedAt!==null){requireRule(response?.kind==='AcceptLifePromise'&&payload(response).consent===true&&promise.acceptedCommandId===response.commandId&&promise.acceptedAt===response.date&&personAvailable(promise.personId,response.date,addDays(response.date,1))&&runtime.availablePromiseWindow(promise.personId,response.date,promise.days,promise.deadline),'LIFE_PROMISE_ACCEPTANCE_MISSING');expectLog(lifeId('accepted',response.commandId,promise.id),response.date,response.commandId,'已接受约定；真实工作、费用与日期仍需另行安排。',[promise.id],'visible',response.commandId)}
  else requireRule(promise.acceptedCommandId===null&&response?.kind!=='AcceptLifePromise','LIFE_PROMISE_ACCEPTANCE_REWRITTEN')
  if(promise.status==='offered')requireRule(!response&&promise.acceptedAt===null&&promise.resolvedAt===null&&promise.resolutionSourceId===null&&promise.completionJobId===null&&!expiry.processed&&cancellations.length===0,'LIFE_OFFER_DEFAULT_DELETED')
  else if(promise.status==='accepted')requireRule(promise.acceptedAt!==null&&promise.resolvedAt===null&&promise.resolutionSourceId===null&&promise.completionJobId===null&&!due.processed,'LIFE_PROMISE_DEADLINE_IGNORED')
  else if(promise.status==='fulfilled'){
   const completed=jobs.get(promise.completionJobId??'');requireRule(promise.acceptedAt!==null&&completed?.kind==='promise_keep'&&completed.promiseId===promise.id&&completed.status==='completed'&&completed.completeAt<=promise.deadline&&promise.resolvedAt===completed.completeAt&&promise.resolutionSourceId===lifeEvent('finish_job',completed.id,completed.completeAt).instanceId,'LIFE_PROMISE_FREE_FULFILLMENT')
   expectLog(lifeId('fulfilled',promise.id),completed.completeAt,completed.id,'约定通过真实工作按期兑现，原花费与其他义务继续保留。',[promise.id,lifeId('result',completed.id)])
  }else{
   requireRule(promise.resolvedAt!==null&&promise.resolutionSourceId!==null&&promise.completionJobId===null,'LIFE_PROMISE_RESOLUTION_MISSING')
   if(promise.status==='declined'){requireRule(response?.kind==='DeclineLifePromise'&&promise.acceptedAt===null&&promise.resolvedAt===response.date&&promise.resolutionSourceId===response.commandId,'LIFE_PROMISE_DECLINE_MISSING');expectLog(lifeId('declined',response.commandId,promise.id),response.date,response.commandId,'已明确婉拒这次未接受的邀请，不新增付款义务。',[promise.id],'visible',response.commandId)}
   if(promise.status==='expired'){requireRule(!response&&promise.acceptedAt===null&&expiry.processed&&!expiry.skippedReason&&cancellations.length===0&&promise.resolvedAt===expiry.date&&promise.resolutionSourceId===expiry.instanceId,'LIFE_OFFER_EXPIRY_MISSING');expectLog(lifeId('expired',promise.id),expiry.date,expiry.instanceId,'未响应的邀请已到期；没有自动接受、付款或完成工作。',[promise.id])}
   if(promise.status==='npc_declined'){const a=cancellations.sort((a,b)=>a.date.localeCompare(b.date))[0];requireRule(!response&&promise.acceptedAt===null&&a&&promise.resolvedAt===a.date&&promise.resolutionSourceId===a.id,'LIFE_NPC_DECLINE_SOURCE_MISSING');expectLog(lifeId('npc_declined',promise.id),a.date,a.id,'对方按自己的安排撤回了尚未接受的邀请；不记玩家失约。',[promise.id])}
   if(promise.status==='missed'){requireRule(promise.acceptedAt!==null&&due.processed&&!due.skippedReason&&promise.resolvedAt===due.date&&promise.resolutionSourceId===due.instanceId&&!s.jobs.some(j=>j.promiseId===promise.id&&j.status==='completed'&&j.completeAt<=promise.deadline),'LIFE_MISSED_PROMISE_ERASED');expectLog(lifeId('missed',promise.id),due.date,due.instanceId,'已接受的约定没有按原期限实际完成，保留失约与已付成本。',[promise.id])}
  }
 }
 for(const goal of s.priorities){const r=commands.get(goal.sourceCommandId),p=r?payload(r):null;requireRule(r?.kind==='SetLifePriority'&&r.date===goal.date&&goal.year===Number(goal.date.slice(0,4))&&goal.id===lifeId('priority',r.commandId)&&p?.year===goal.year&&p.priority===goal.priority,'LIFE_PRIORITY_SOURCE_MISSING');expectLog(goal.id,goal.date,r.commandId,'已明确本年度生活关注目标；这不自动付款、安排工作或增加行动。',[],'visible',r.commandId)}
 for(const r of run.receipts){if(r.kind==='SetLifePriority')requireRule(s.priorities.some(g=>g.sourceCommandId===r.commandId),'LIFE_PRIORITY_RECORD_DELETED');if(['StartLifeWork','FulfillLifePromise'].includes(r.kind))requireRule(s.jobs.some(j=>j.originCommandId===r.commandId),'LIFE_JOB_RECORD_DELETED');if(['AcceptLifePromise','DeclineLifePromise'].includes(r.kind))requireRule(s.promises.some(p=>p.responseCommandId===r.commandId),'LIFE_PROMISE_RESPONSE_DELETED')}
 for(const e of events){const p=e.payload;requireRule(p.kind==='life_event','INVALID_LIFE_TIMER');if(p.type==='agenda')requireRule(agendaIds.has(e.instanceId),'ORPHAN_LIFE_AGENDA_TIMER');else if(p.type==='finish_job')requireRule(jobs.has(p.entityId),'ORPHAN_LIFE_JOB_TIMER');else requireRule(s.promises.some(v=>v.id===p.entityId),'ORPHAN_LIFE_PROMISE_TIMER');requireRule(expectedTimers.has(e.instanceId),'UNOWNED_LIFE_TIMER')}
 requireRule(s.logs.length===expectedLogs.size&&s.logs.every(l=>expectedLogs.has(l.id)),'ORPHAN_LIFE_LOG')
 for(const c of run.causes.filter(c=>c.domain==='life')){
  if(c.id==='cause:'+c.commandId){const r=commands.get(c.commandId);requireRule(r&&LIFE_COMMAND_KINDS.some(k=>k===r.kind)&&c.sourceEventId==='command:'+r.commandId&&c.visibleSummary===r.summary&&r.causeIds.includes(c.id),'LIFE_COMMAND_CAUSE_MISMATCH')}
  else requireRule(logs.has(c.id),'ORPHAN_LIFE_CAUSE')
 }
}
