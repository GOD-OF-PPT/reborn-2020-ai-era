import type {RelayProjection} from '../core/relay-projection.ts'
import type {OperationsState,ProductionJob} from '../core/operations-types.ts'

type Relay=NonNullable<RelayProjection>
export interface RelaySceneIdentity{readonly runId:string;readonly accountId:string;readonly businessId:string;readonly stationId:string}
type PeriodRecord={readonly jobId?:never;readonly meterId?:never}|{readonly jobId:string;readonly meterId?:never}|{readonly meterId:string;readonly jobId?:never}
export type RelaySceneTarget=RelaySceneIdentity&(
 |{readonly kind:'business'}
 |{readonly kind:'application';readonly applicationId:string}
 |{readonly kind:'audience';readonly audienceId:string}
 |{readonly kind:'customer';readonly customerId:string}
 |({readonly kind:'period';readonly periodId:string}&PeriodRecord)
)
export interface RelaySceneContext{readonly runId:string;readonly accountId:string;readonly operations:Pick<OperationsState,'businesses'|'jobs'>|null}
export interface RelayTargetResolution{
 readonly status:'entry'|'valid'|'invalid'
 readonly target:RelaySceneTarget|null
 readonly reason:string|null
 readonly business:Relay['businesses'][number]|null
 readonly station:Relay['stations'][number]|null
 readonly application:Relay['applications'][number]|null
 readonly audience:Relay['audiences'][number]|null
 readonly customer:Relay['customers'][number]|null
 readonly period:Relay['periods'][number]|null
 readonly meter:Relay['meters'][number]|null
 readonly job:ProductionJob|null
 readonly audit:Relay['auditJobs'][number]|null
}
const empty={business:null,station:null,application:null,audience:null,customer:null,period:null,meter:null,job:null,audit:null}
const one=<T>(rows:readonly T[]):T|null=>rows.length===1?rows[0]!:null
const id=(value:unknown):value is string=>typeof value==='string'&&value.length>0&&value.length<=512&&value.trim().length>0&&!/[\u0000-\u001f\u007f]/.test(value)
const unique=(values:readonly string[])=>new Set(values).size===values.length
function sameJob(a:ProductionJob,b:ProductionJob){
 return a.id===b.id&&a.businessId===b.businessId&&a.definitionId===b.definitionId&&a.contractId===b.contractId&&a.actionId===b.actionId
  &&a.startAt===b.startAt&&a.completeAt===b.completeAt&&a.releasedAt===b.releasedAt&&a.status===b.status&&a.outputId===b.outputId
  &&a.resources.length===b.resources.length&&a.resources.every((v,i)=>v===b.resources[i])
}
function shape(target:RelaySceneTarget):boolean{
 if(target===null||typeof target!=='object'||Array.isArray(target))return false
 const proto=Object.getPrototypeOf(target)
 if(proto!==Object.prototype&&proto!==null||Object.values(Object.getOwnPropertyDescriptors(target)).some(d=>d.get!==undefined||d.set!==undefined))return false
 const base=['kind','runId','accountId','businessId','stationId']
 const keys=target.kind==='business'?base:target.kind==='application'?[...base,'applicationId']:target.kind==='audience'?[...base,'audienceId']:target.kind==='customer'?[...base,'customerId']:target.kind==='period'?[...base,'periodId','jobId','meterId']:[]
 if(!keys.length||Object.keys(target).some(k=>!keys.includes(k))||base.some(k=>!Object.hasOwn(target,k)))return false
 if(!Object.values(target).every(id))return false
 if(target.kind==='application'&&!id(target.applicationId)||target.kind==='audience'&&!id(target.audienceId)||target.kind==='customer'&&!id(target.customerId)||target.kind==='period'&&(!id(target.periodId)||target.jobId!==undefined&&target.meterId!==undefined))return false
 return true
}

/** Match every identity against the saved public view. Nothing is filled from another object. */
export function resolveRelaySceneTarget(relay:RelayProjection,target:RelaySceneTarget|null,context:RelaySceneContext):RelayTargetResolution{
 const bad=(reason:string):RelayTargetResolution=>({status:'invalid',target,reason,...empty})
 if(!context||!id(context.runId)||!id(context.accountId))return bad('当前中转上下文不完整，请重新选择原对象。')
 if(target===null)return {status:'entry',target:null,reason:null,...empty}
 if(!shape(target))return bad('原中转对象身份不完整或混入另一类记录，请重新选择。')
 if(target.runId!==context.runId)return bad('这份服务关注来自另一段人生，请重新选择。')
 if(target.accountId!==context.accountId)return bad('原中转账户与当前对象不匹配，没有切换到另一账户，请重新选择。')
 if(!relay||!context.operations)return bad('没有取得原中转公开记录，请重新选择。')
 const business=one(relay.businesses.filter(b=>b.id===target.businessId)),operationBusiness=one(context.operations.businesses.filter(b=>b.id===target.businessId))
 if(!business||business.accountId!==target.accountId||business.route!=='api_relay'||business.definitionId!=='relay-station'
  ||!operationBusiness||operationBusiness.accountId!==business.accountId||operationBusiness.route!==business.route||operationBusiness.definitionId!==business.definitionId||operationBusiness.company!==business.company)return bad('原企业与中转账户不唯一或不匹配，请重新选择；没有换到另一站。')
 const station=one(relay.stations.filter(s=>s.businessId===business.id))
 if(!station||station.id!==target.stationId||relay.stations.filter(s=>s.id===target.stationId).length!==1)return bad('原中转站身份已失效或不唯一，请重新选择。')
 let resolved:RelayTargetResolution={status:'valid',target,reason:null,...empty,business,station}
 const job=(source:ProductionJob|null|undefined,jobId:string,definition:string):ProductionJob|null=>{
  const original=one(context.operations!.jobs.filter(j=>j.id===jobId))
  return source&&source.id===jobId&&source.businessId===business.id&&source.definitionId===definition&&original&&sameJob(source,original)?original:null
 }
 if(target.kind==='business')return resolved
 if(target.kind==='application'){
  const application=one(relay.applications.filter(a=>a.id===target.applicationId)),actual=application?job(application.job,application.jobId,'relay-application'):null
  if(!application||application.businessId!==business.id||!actual||relay.catalog.suppliers.filter(s=>s.id===application.supplierId).length!==1)return bad('原供应申请或原任务不属于这间站，请重新选择。')
  return {...resolved,application,job:actual}
 }
 if(target.kind==='audience'){
  const audience=one(relay.audiences.filter(a=>a.id===target.audienceId)),actual=audience?.jobId?job(audience.job,audience.jobId,'relay-marketing'):null
  if(!audience||audience.businessId!==business.id||audience.mode==='paid'&&!actual||audience.mode==='video_referral'&&audience.jobId!==null)return bad('原获客记录或任务与本站不匹配，请重新选择。')
  return {...resolved,audience,job:actual}
 }
 const customer=(customerId:string)=>{
  const c=one(relay.customers.filter(c=>c.id===customerId))
  if(!c||c.businessId!==business.id||!unique(c.terms.map(t=>t.id)))return null
  const audience=one(relay.audiences.filter(a=>a.id===c.originAudienceId))
  return audience?.businessId===business.id&&audience.members.includes(c.personId)?c:null
 }
 if(target.kind==='customer'){
  const actual=customer(target.customerId)
  return actual?{...resolved,customer:actual}:bad('原客户不属于本站或原获客来源已失效，请重新选择。')
 }
 const period=one(relay.periods.filter(p=>p.id===target.periodId))
 if(!period||period.businessId!==business.id||!period.customerIds.length||!period.supplierIds.length||!unique(period.customerIds)||!unique(period.supplierIds)
  ||!period.customerIds.every(c=>customer(c))||!period.supplierIds.every(s=>relay.catalog.suppliers.filter(p=>p.id===s).length===1))return bad('原账期、客户或供应身份不完整，请重新选择；没有换到另一期。')
 if(period.feeQuotes.length!==period.customerIds.length||!unique(period.feeQuotes.map(q=>q.customerId))||period.feeQuotes.some(q=>!period.customerIds.includes(q.customerId)||!customer(q.customerId)?.terms.some(t=>t.id===q.termsId)))return bad('这期原支持报价与客户条款不匹配，请重新选择。')
 const service=job(period.job,period.jobId,'relay-service'),support=job(period.supportJob,period.supportJobId,'relay-support-'+period.supportMode)
 if(!service||!support||service.id===support.id)return bad('本期原服务或支持任务不匹配，请重新选择。')
 resolved={...resolved,period}
 if(target.meterId!==undefined){
  const meter=one(relay.meters.filter(m=>m.id===target.meterId)),c=meter?customer(meter.customerId):null
  if(!meter||meter.periodId!==period.id||!period.customerIds.includes(meter.customerId)||!c?.terms.some(t=>t.id===meter.termsId)
   ||meter.supplierId!==null&&!period.supplierIds.includes(meter.supplierId))return bad('原计量不属于这期客户与价格记录，请重新选择。')
  // Historical rateId and prices are frozen original facts, not the current catalog rate.
  return {...resolved,meter,customer:c}
 }
 if(target.jobId!==undefined){
  const audit=one(relay.auditJobs.filter(a=>a.jobId===target.jobId)),matches=[service,support].filter(j=>j.id===target.jobId)
  if(audit){
   const rows=relay.audits.filter(a=>a.jobId===audit.jobId),meters=rows.map(a=>one(relay.meters.filter(m=>m.id===a.meterId)))
   const periods=[...new Set(meters.flatMap(m=>m?[m.periodId]:[]))]
   if(audit.businessId!==business.id||!audit.periodIds.includes(period.id)||!unique(audit.periodIds)||!rows.length||rows.length!==audit.meterCount||!unique(rows.map(a=>a.id))||!unique(rows.map(a=>a.meterId))
    ||rows.some(a=>a.businessId!==business.id)||meters.some(m=>!m||relay.periods.filter(p=>p.id===m.periodId&&p.businessId===business.id).length!==1)
    ||periods.length!==audit.periodIds.length||!periods.every(p=>audit.periodIds.includes(p)))return bad('原复核批次与这期已发生记录不匹配，请重新选择。')
   const actual=job(audit.job,audit.jobId,'relay-meter-audit');if(actual)matches.push(actual)
  }
  if(matches.length!==1)return bad('原任务不唯一或不属于这期服务、支持与复核，请重新选择。')
  return {...resolved,job:matches[0]!,audit}
 }
 return resolved
}
export function relayTargetReason(relay:RelayProjection,target:RelaySceneTarget|null,context:RelaySceneContext):string|null{return resolveRelaySceneTarget(relay,target,context).reason}
export function canonicalRelayTarget(relay:RelayProjection,target:RelaySceneTarget|null,context:RelaySceneContext):RelaySceneTarget|null{
 const resolved=resolveRelaySceneTarget(relay,target,context)
 return resolved.status==='valid'?resolved.target:null
}
export function relayTargetEntity(target:RelaySceneTarget):string{
 return target.kind==='period'?target.meterId??target.jobId??target.periodId:target.kind==='customer'?target.customerId:target.kind==='audience'?target.audienceId:target.kind==='application'?target.applicationId:target.businessId
}
