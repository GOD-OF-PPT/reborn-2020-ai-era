import {addDays,quarterOf} from './calendar.ts'
import {queueEvent,type ScheduledEvent} from './timeline.ts'
import {requireRule} from './errors.ts'
import {LifeWork,patchLife,lifeLog} from './life-work.ts'
import {LIFE_CATALOG,LIFE_HASH,LIFE_COMMAND_KINDS,initialLife,lifeOf,lifeId,lifeEvent,agendaEvents,lifePerson,personKnown,personAvailable,referenceAllowed,makeLifeOffer,type LifeContext} from './life-state.ts'
import {assertLife} from './life-validation.ts'
import type {LifeJob,LifePerson,LifeReference,LifePriority} from './life-schema.ts'
import type {OperatingModel} from './operations-types.ts'
import type {GameRun,RuleModel} from './run-types.ts'
import type {CommandContext} from './commands.ts'
import type {RunOperation} from './content-types.ts'

const allowed=()=>({allowed:true,reasonCodes:[] as readonly string[],actionPoints:0,upfrontCostFen:0,releasedFen:0})
export const lifeKinds=LIFE_COMMAND_KINDS
export class LifeRuntime{
 readonly catalog=LIFE_CATALOG;readonly hash=LIFE_HASH;readonly work=new LifeWork()
 initial(){return initialLife()}
 schedule(m:RuleModel){let timeline=m.timeline;for(const e of agendaEvents())timeline=queueEvent(timeline,e);return {...m,timeline}}
 inspect(m:LifeContext&{readonly phase?:RuleModel['phase']},kind:string,p:Record<string,unknown>,date:string){
  const s=lifeOf(m);requireRule(m.phase===undefined||m.phase==='playing'||kind==='InterruptLifeWork','RUN_NOT_PLAYING')
  if(kind==='StartLifeWork'){
   const work=String(p.kind) as LifeJob['kind'];requireRule(work!=='promise_keep'&&Object.hasOwn(this.catalog.work,work),'UNKNOWN_LIFE_WORK')
   const personId=p.personId===null?null:String(p.personId) as LifePerson,reference=p.reference as LifeReference|null
   if(work==='rest'||work==='workspace'){requireRule(personId===null&&reference===null,'LIFE_WORK_UNEXPECTED_PERSON')}
   else{requireRule(personId!==null&&lifePerson(personId).work===work,'LIFE_PERSON_WORK_MISMATCH');requireRule(personKnown(m,personId,date),'LIFE_PERSON_NOT_KNOWN');requireRule(referenceAllowed(m,personId,reference,date),'LIFE_ACTUAL_REFERENCE_REQUIRED')}
   const q=quarterOf(date)
   if(work==='workspace')requireRule(!s.jobs.some(j=>j.kind==='workspace'&&j.status!=='interrupted'),'LIFE_WORKSPACE_ALREADY_ARRANGED')
   else requireRule(!s.jobs.some(j=>j.kind===work&&j.personId===personId&&quarterOf(j.startAt)===q&&j.status!=='interrupted'),'LIFE_WORK_ALREADY_THIS_QUARTER')
   return this.work.inspect(m,work,personId,date)
  }
  if(kind==='FulfillLifePromise'){
   const promise=s.promises.find(o=>o.id===p.promiseId);requireRule(promise?.status==='accepted','LIFE_PROMISE_NOT_ACCEPTED')
   requireRule(!s.jobs.some(j=>j.promiseId===promise.id&&j.status!=='interrupted'),'LIFE_PROMISE_WORK_ALREADY_ARRANGED')
   requireRule(addDays(date,promise.days)<=promise.deadline,'LIFE_PROMISE_DEADLINE_MISSED')
   return this.work.inspect(m,'promise_keep',promise.personId,date)
  }
  if(kind==='InterruptLifeWork'){requireRule(s.jobs.some(j=>j.id===p.jobId&&j.status==='running'),'LIFE_JOB_NOT_RUNNING');return allowed()}
  if(kind==='SetLifePriority'){requireRule(Number(p.year)===Number(date.slice(0,4)),'LIFE_PRIORITY_CURRENT_YEAR_ONLY');requireRule(s.priorities.filter(g=>g.year===p.year).at(-1)?.priority!==p.priority,'LIFE_PRIORITY_ALREADY_SELECTED');return allowed()}
  if(kind==='AcceptLifePromise'||kind==='DeclineLifePromise'){
   const promise=s.promises.find(o=>o.id===p.promiseId);requireRule(promise?.status==='offered'&&promise.offeredAt<=date&&date<=promise.expiresAt,'LIFE_OFFER_NOT_AVAILABLE')
   if(kind==='AcceptLifePromise'){requireRule(p.consent===true,'LIFE_PROMISE_CONSENT_REQUIRED');requireRule(personAvailable(promise.personId,date,addDays(date,1)),'LIFE_PERSON_UNAVAILABLE');requireRule(this.availablePromiseWindow(promise.personId,date,promise.days,promise.deadline),'LIFE_PROMISE_NO_AVAILABLE_WINDOW')}
   return allowed()
  }
  requireRule(false,'UNKNOWN_LIFE_COMMAND')
 }
 availablePromiseWindow(personId:LifePerson,date:string,days:number,deadline:string){for(let d=date;addDays(d,days)<=deadline;d=addDays(d,1))if(personAvailable(personId,d,addDays(d,days)))return true;return false}
 apply(m:OperatingModel,kind:string,p:Record<string,unknown>,context:CommandContext):{state:OperatingModel;newEvents?:readonly ScheduledEvent<RunOperation>[]} {
  const date=context.date;this.inspect(m,kind,p,date);const s=lifeOf(m)
  if(kind==='StartLifeWork')return this.work.start(m,p.kind as LifeJob['kind'],p.personId as LifePerson|null,null,p.reference as LifeReference|null,date,context.commandId)
  if(kind==='FulfillLifePromise'){const promise=s.promises.find(o=>o.id===p.promiseId)!;return this.work.start(m,'promise_keep',promise.personId,promise.id,null,date,context.commandId)}
  if(kind==='InterruptLifeWork')return {state:this.work.interrupt(m,String(p.jobId),date,context.commandId)}
  if(kind==='SetLifePriority'){
   const id=lifeId('priority',context.commandId),goal={id,year:Number(p.year),priority:p.priority as LifePriority,date,sourceCommandId:context.commandId}
   return {state:lifeLog(patchLife(m,{priorities:[...s.priorities,goal]}),id,date,context.commandId,'已明确本年度生活关注目标；这不自动付款、安排工作或增加行动。')}
  }
  const promise=s.promises.find(o=>o.id===p.promiseId)!,accepted=kind==='AcceptLifePromise',id=lifeId(accepted?'accepted':'declined',context.commandId,promise.id)
  const next={...promise,status:accepted?'accepted' as const:'declined' as const,...(accepted?{acceptedAt:date,acceptedCommandId:context.commandId}:{resolvedAt:date,resolutionSourceId:context.commandId}),responseCommandId:context.commandId}
  return {state:lifeLog(patchLife(m,{promises:s.promises.map(o=>o.id===promise.id?next:o)}),id,date,context.commandId,accepted?'已接受约定；真实工作、费用与日期仍需另行安排。':'已明确婉拒这次未接受的邀请，不新增付款义务。',[promise.id])}
 }
 reduce(m:OperatingModel,event:ScheduledEvent<RunOperation>):{state:OperatingModel;newEvents?:readonly ScheduledEvent<RunOperation>[];skippedReason?:string} {
  const p=event.payload;requireRule(p.kind==='life_event','INVALID_LIFE_EVENT');const s=lifeOf(m),date=event.date
  if(p.type==='agenda'){
   const match=this.catalog.busy.find(b=>p.entityId===b.id+':start'||p.entityId===b.id+':end');requireRule(match,'UNKNOWN_LIFE_AGENDA');const start=p.entityId.endsWith(':start');requireRule(date===(start?match.from:match.to),'LIFE_AGENDA_DATE_MISMATCH')
   const id=event.instanceId,record={id,definitionId:p.entityId,personId:match.personId,date,sourceEventId:id}
   let next=lifeLog(patchLife(m,{agenda:[...s.agenda,record]}),id,date,id,start?match.startText:match.endText,[],personKnown(m,match.personId,date)?'visible':'hidden')
   if(start)for(const promise of lifeOf(next).promises.filter(o=>o.personId===match.personId&&o.status==='offered'&&date<=o.expiresAt))next=this.resolveOffer(next,promise.id,'npc_declined',date,id,'对方按自己的安排撤回了尚未接受的邀请；不记玩家失约。')
   return {state:next}
  }
  if(p.type==='finish_job'){
   const result=this.work.finish(m,p.entityId,date,event.instanceId);if(result.job.status!=='completed')return result
   let next=result.state;const job=result.job
   if(job.kind==='promise_keep'){
    const promise=lifeOf(next).promises.find(o=>o.id===job.promiseId);requireRule(promise?.status==='accepted'&&job.completeAt<=promise.deadline,'LIFE_PROMISE_COMPLETION_NOT_AUTHORIZED')
    next=patchLife(next,{promises:lifeOf(next).promises.map(o=>o.id===promise.id?{...o,status:'fulfilled',resolvedAt:date,resolutionSourceId:event.instanceId,completionJobId:job.id}:o)})
    next=lifeLog(next,lifeId('fulfilled',promise.id),date,job.id,'约定通过真实工作按期兑现，原花费与其他义务继续保留。',[promise.id,lifeId('result',job.id)])
   }
   const offer=makeLifeOffer(job)
   if(offer&&!lifeOf(next).promises.some(o=>o.personId===offer.personId&&o.year===offer.year)&&personAvailable(offer.personId,date,addDays(date,1))){
    next=lifeLog(patchLife(next,{promises:[...lifeOf(next).promises,offer]}),offer.id,date,job.id,lifePerson(offer.personId).name+'根据实际共同经历提出一项有限约定，接受仍由你决定。',[lifeId('result',job.id)])
    return {state:next,newEvents:[lifeEvent('offer_expiry',offer.id,addDays(offer.expiresAt,1)),lifeEvent('promise_due',offer.id,offer.deadline)]}
   }
   return {state:next}
  }
  const promise=s.promises.find(o=>o.id===p.entityId);requireRule(promise,'LIFE_PROMISE_NOT_FOUND')
  if(p.type==='offer_expiry'){
   requireRule(date===addDays(promise.expiresAt,1),'LIFE_OFFER_EXPIRY_MISMATCH')
   return promise.status==='offered'?{state:this.resolveOffer(m,promise.id,'expired',date,event.instanceId,'未响应的邀请已到期；没有自动接受、付款或完成工作。')}:{state:m,skippedReason:'LIFE_OFFER_ALREADY_ANSWERED'}
  }
  requireRule(p.type==='promise_due'&&date===promise.deadline,'LIFE_PROMISE_DUE_MISMATCH')
  return promise.status==='accepted'?{state:this.resolveOffer(m,promise.id,'missed',date,event.instanceId,'已接受的约定没有按原期限实际完成，保留失约与已付成本。')}:{state:m,skippedReason:'LIFE_PROMISE_NOT_OUTSTANDING'}
 }
 private resolveOffer(m:OperatingModel,id:string,status:'npc_declined'|'expired'|'missed',date:string,sourceId:string,text:string){
  const next=patchLife(m,{promises:lifeOf(m).promises.map(o=>o.id===id?{...o,status,resolvedAt:date,resolutionSourceId:sourceId}:o)})
  return lifeLog(next,lifeId(status,id),date,sourceId,text,[id])
 }
 validate(run:GameRun){assertLife(run,this)}
}
