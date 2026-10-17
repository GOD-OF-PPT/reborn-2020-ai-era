import {addDays} from './calendar.ts'
import {actionBudget,applyEconomy,type EconomyOperation} from './economy.ts'
import {accountFunds} from './ledger.ts'
import {requireRule,RuleError} from './errors.ts'
import {remainingCapacity} from './operations.ts'
import {lifeOf,lifeId,lifeEvent,jobTerms,personAvailable,type LifeContext} from './life-state.ts'
import type {LifeState,LifeJob,LifePerson,LifeReference} from './life-schema.ts'
import type {OperatingModel} from './operations-types.ts'

export function patchLife<M extends OperatingModel>(m:M,fields:Partial<LifeState>):M{return {...m,life:{...lifeOf(m),...fields}}}
export function lifeLog<M extends OperatingModel>(m:M,id:string,date:string,sourceEventId:string,text:string,parentIds:readonly string[]=[],visibility:'visible'|'hidden'='visible'):M{
 const s=lifeOf(m);requireRule(!s.logs.some(l=>l.id===id),'LIFE_LOG_REUSED')
 return patchLife(m,{logs:[...s.logs,{id,date,sourceEventId,text,parentIds:[...parentIds],visibility}]})
}
function postLife<M extends OperatingModel>(m:M,operation:EconomyOperation):M{return lifeLog({...m,economy:applyEconomy(m.economy,operation)},operation.id,operation.date,operation.sourceEventId,operation.kind)}

/** Actual personal work: the original AP, ledger and shared dated resource do the accounting. */
export class LifeWork{
 inspect(m:LifeContext,kind:LifeJob['kind'],personId:LifePerson|null,date:string){
  requireRule(m.operations&&m.controlledAccountIds.includes('personal'),'LIFE_PERSONAL_ACCOUNT_REQUIRED')
  const t=jobTerms(kind,personId),completeAt=addDays(date,t.days)
  requireRule(date===m.economy.asOf&&completeAt<='2025-12-31','LIFE_WORK_OUTSIDE_TIMELINE')
  requireRule(actionBudget(m.economy,date).available>=1,'INSUFFICIENT_ACTION_POINTS')
  requireRule(accountFunds(m.economy.ledger,'personal').availableFen>=t.costFen,'INSUFFICIENT_AVAILABLE_FUNDS')
  if(t.costFen>0)requireRule(!m.economy.ledger.obligations.some(o=>o.accountId==='personal'&&o.date<=date&&o.remainingFen>0),'OVERDUE_OBLIGATION')
  requireRule(remainingCapacity(m,'player-production',date,completeAt)>=1,'INSUFFICIENT_CAPACITY')
  if(personId!==null)requireRule(personAvailable(personId,date,completeAt),'LIFE_PERSON_UNAVAILABLE')
  return {allowed:true,reasonCodes:[] as readonly string[],actionPoints:1,upfrontCostFen:t.costFen,releasedFen:0,actionDate:date}
 }
 start(m:OperatingModel,kind:LifeJob['kind'],personId:LifePerson|null,promiseId:string|null,reference:LifeReference|null,date:string,commandId:string){
  this.inspect(m,kind,personId,date);const t=jobTerms(kind,personId),id=lifeId('job',commandId),actionId=lifeId('action',id),completeAt=addDays(date,t.days)
  const definition={id:actionId,definitionId:'life-'+kind,accountId:'personal',counterpartyId:'world',actionPoints:1,costFen:t.costFen,cashReservationId:lifeId('funds',id),startAt:date,completeAt,settlementAt:completeAt}
  const reserveId=lifeId('reserve',id),executeId=lifeId('execute',id)
  let next=postLife(m,{kind:'reserve_action',id:reserveId,sourceEventId:id,date,action:definition})
  next=postLife(next,{kind:'execute_action',id:executeId,sourceEventId:id,date,actionId})
  const job:LifeJob={id,kind,personId,promiseId,reference,originCommandId:commandId,actionId,accountId:'personal',resourceId:'player-production',startAt:date,completeAt,costFen:t.costFen,actionPoints:1,status:'running',releasedAt:null,result:null,interruptedBy:null,interruptionReason:null}
  next=patchLife(next,{jobs:[...lifeOf(next).jobs,job]});next=lifeLog(next,id,date,id,'已实际开始：'+t.title+'；完成与后续效果仍按真实日期处理。',[reserveId,executeId])
  return {state:next,job,newEvents:[lifeEvent('finish_job',id,completeAt)]}
 }
 interrupt(m:OperatingModel,id:string,date:string,sourceId:string,reason='PLAYER_INTERRUPTED'){
  const j=lifeOf(m).jobs.find(j=>j.id===id);requireRule(j?.status==='running'&&j.startAt<=date&&date<=j.completeAt,'LIFE_JOB_NOT_RUNNING')
  let next=postLife(m,{kind:'interrupt_action',id:lifeId('interrupt',j.id),sourceEventId:j.id,date,actionId:j.actionId})
  next=patchLife(next,{jobs:lifeOf(next).jobs.map(o=>o.id===j.id?{...o,status:'interrupted',releasedAt:date,interruptedBy:sourceId,interruptionReason:reason}:o)})
  return lifeLog(next,lifeId('interrupted',j.id),date,sourceId,'生活工作已中断，已付成本与已耗行动保留：'+reason,[j.id,lifeId('interrupt',j.id)])
 }
 finish(m:OperatingModel,id:string,date:string,eventId:string){
  const j=lifeOf(m).jobs.find(j=>j.id===id);requireRule(j&&j.completeAt===date,'INVALID_LIFE_COMPLETION')
  if(j.status==='interrupted')return {state:m,job:j,skippedReason:'LIFE_WORK_INTERRUPTED'}
  requireRule(j.status==='running','LIFE_JOB_ALREADY_FINISHED')
  try{requireRule(remainingCapacity(m,'player-production',j.startAt,j.completeAt,j.id)>=1,'INSUFFICIENT_CAPACITY');if(j.personId!==null)requireRule(personAvailable(j.personId,j.startAt,j.completeAt),'LIFE_PERSON_UNAVAILABLE')}
  catch(error){if(!(error instanceof RuleError))throw error;const state=this.interrupt(m,j.id,date,eventId,'LIFE_COMPLETION_FAILED:'+error.code);return {state,job:lifeOf(state).jobs.find(o=>o.id===id)!,skippedReason:'LIFE_COMPLETION_FAILED:'+error.code}}
  let next=postLife(m,{kind:'complete_action',id:lifeId('complete',j.id),sourceEventId:j.id,date,actionId:j.actionId})
  const result=j.kind==='rest'?'rested':j.kind==='workspace'?'workspace_ready':j.kind==='promise_keep'?'promise_fulfilled':'shared_experience'
  const job:LifeJob={...j,status:'completed',releasedAt:date,result}
  next=patchLife(next,{jobs:lifeOf(next).jobs.map(o=>o.id===id?job:o)})
  next=lifeLog(next,lifeId('result',j.id),date,j.id,'生活工作实际完成：'+jobTerms(j.kind,j.personId).title+'。',[j.id,lifeId('complete',j.id)])
  return {state:next,job}
 }
}
