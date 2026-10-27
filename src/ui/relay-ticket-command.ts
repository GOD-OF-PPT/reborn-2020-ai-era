import type {GamePanelProps} from './game-types.ts'
import type {RelayProjection} from '../core/relay-projection.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {resolveRelaySceneTarget,type RelaySceneTarget,type RelaySceneContext} from './relay-scene-target.ts'

type Input=Pick<GamePanelProps,'view'|'features'|'accountId'>
export interface RelayTicketAudit{
 readonly target:RelaySceneTarget|null
 readonly job:ProductionJob|null
 readonly batch:NonNullable<RelayProjection>['auditJobs'][number]|null
 readonly reason:string|null
}

/** An already commissioned audit remains the same job when the player revisits its meter. */
export function relayTicketAudit(p:Input,target:RelaySceneTarget):RelayTicketAudit{
 return relayTicketAuditFor(p.features.relay,p.view.date,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})
}
export function relayTicketAuditFor(v:RelayProjection,today:string,target:RelaySceneTarget,context:RelaySceneContext):RelayTicketAudit{
 const empty={target:null,job:null,batch:null},bad=(reason:string):RelayTicketAudit=>({...empty,reason})
 const r=resolveRelaySceneTarget(v,target,context)
 if(!v||r.status!=='valid')return bad(r.reason??'请先核对这一张计量票的原对象。')
 if(target.kind!=='period'||!r.meter)return {...empty,reason:null}
 const rows=v.audits.filter(a=>a.meterId===r.meter!.id),active:typeof rows=[]
 if(new Set(rows.map(a=>a.id)).size!==rows.length)return bad('这张票的原复核引用重复，请先核对；没有挑选其中一份。')
 for(const audit of rows){
  const batches=v.auditJobs.filter(b=>b.jobId===audit.jobId),batch=batches.length===1?batches[0]:undefined
  if(audit.businessId!==target.businessId||!batch?.job||batch.businessId!==target.businessId||audit.completedAt!==null&&audit.completedAt>today)return bad('这张票的原复核与所属任务未对齐，请先核对原批次。')
  if(batch.job.status==='planned'||batch.job.status==='running'){
   if(audit.completedAt!==null)return bad('原复核仍在安排或进行中，不能提前认作已经完成。')
   active.push(audit)
  }else if(batch.job.status==='completed'&&audit.completedAt===null)return bad('原任务与复核完成记录尚未对齐，请先核对同一批次。')
 }
 if(active.length>1)return bad('这张票对应多份尚未完成的复核，先核对原记录；没有重复委托。')
 if(active.length===0){
  if(r.meter.auditedUnits===null&&rows.some(a=>a.completedAt!==null))return bad('原复核与已公开实计尚未对齐，请先核对原依据。')
  return {...empty,reason:null}
 }
 const audit=active[0]!,batchTarget:RelaySceneTarget={kind:'period',runId:target.runId,accountId:target.accountId,businessId:target.businessId,stationId:target.stationId,periodId:target.periodId,jobId:audit.jobId}
 const checked=resolveRelaySceneTarget(v,batchTarget,context)
 if(checked.status!=='valid'||!checked.audit||!checked.job||!['planned','running'].includes(checked.job.status))return bad(checked.reason??'原复核批次与这张计量票的关系尚未唯一核定。')
 return {target:batchTarget,job:checked.job,batch:checked.audit,reason:null}
}
export interface RelayTicketCommand{
 readonly kind:'CorrectRelayUsage'
 readonly payload:{readonly auditId:string;readonly correctUnits:number}
 readonly label:string
 readonly confirm:true
}

/** A correction copies one revealed original audit; the reader cannot invent a quantity. */
export function relayTicketCorrection(p:Input,target:RelaySceneTarget,includeUnchanged=false):{command:RelayTicketCommand|null;reason:string|null}{
 return relayTicketCorrectionFor(p.features.relay,p.view.date,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations},includeUnchanged)
}
export function relayTicketCorrectionFor(v:RelayProjection,today:string,target:RelaySceneTarget,context:RelaySceneContext,includeUnchanged=false):{command:RelayTicketCommand|null;reason:string|null}{
 const resolved=resolveRelaySceneTarget(v,target,context)
 if(!v||resolved.status!=='valid')return {command:null,reason:resolved.reason??'请先明确选择这一张原计量票。'}
 if(target.kind!=='period'||!resolved.meter)return {command:null,reason:null}
 const meter=resolved.meter
 if(meter.correctionId!==null)return {command:null,reason:null}
 if(meter.auditedUnits===null)return {command:null,reason:'这张票的实计尚未独立复核，不能提前更正。'}
 if(!includeUnchanged&&meter.auditedUnits===meter.reportedUnits)return {command:null,reason:null}
 const candidates=v.audits.filter(a=>a.meterId===meter.id&&a.businessId===target.businessId&&a.completedAt!==null&&a.completedAt<=today)
 if(candidates.length!==1)return {command:null,reason:'这张票的已完成复核依据不唯一，请核对原记录；没有改用另一次复核。'}
 const audit=candidates[0]!,batchTarget:RelaySceneTarget={kind:'period',runId:target.runId,accountId:target.accountId,businessId:target.businessId,stationId:target.stationId,periodId:target.periodId,jobId:audit.jobId}
 const batch=resolveRelaySceneTarget(v,batchTarget,context)
 if(batch.status!=='valid'||batch.audit?.jobId!==audit.jobId||batch.job?.status!=='completed'||batch.job.completeAt>today||audit.actualUnits===null||audit.actualUnits!==meter.auditedUnits)return {command:null,reason:'原复核任务、完成日期或已公开实计没有对齐，请先核对同一张票。'}
 return {command:{kind:'CorrectRelayUsage',payload:{auditId:audit.id,correctUnits:meter.auditedUnits},label:meter.auditedUnits===meter.reportedUnits?'按这份相符的实计，留下原核对记录':'按这份已核实计，更正这一张原票',confirm:true},reason:null}
}
