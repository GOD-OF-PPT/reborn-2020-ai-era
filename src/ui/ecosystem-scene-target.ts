import type {DeepseekProjection} from '../core/deepseek-projection.ts'
import type {OperationsState,ProductionJob} from '../core/operations-types.ts'
import {isoDate} from '../core/calendar.ts'

type Eco=NonNullable<DeepseekProjection>
export type EcosystemRecordKind='preparation'|'adapter'|'outreach'|'lead'|'contract'|'delivery'
export type EcosystemSceneTarget={readonly runId:string;readonly accountId:string;readonly businessId:string}&(
 |{readonly kind:'business'}
 |{readonly kind:EcosystemRecordKind;readonly recordId:string}
)
export interface EcosystemSceneContext{
 readonly runId:string
 readonly accountId:string
 readonly accounts:readonly {readonly accountId:string}[]
 readonly operations:Pick<OperationsState,'businesses'|'jobs'>|null
}
export interface EcosystemTargetResolution{
 readonly status:'entry'|'valid'|'invalid'
 readonly target:EcosystemSceneTarget|null
 readonly reason:string|null
 readonly business:Eco['businesses'][number]|null
 readonly preparation:Eco['preparations'][number]|null
 readonly adapter:Eco['adapters'][number]|null
 readonly outreach:Eco['outreaches'][number]|null
 readonly lead:Eco['leads'][number]|null
 readonly contract:Eco['contracts'][number]|null
 readonly delivery:Eco['deliveries'][number]|null
 readonly job:ProductionJob|null
}
const empty={business:null,preparation:null,adapter:null,outreach:null,lead:null,contract:null,delivery:null,job:null}
const one=<T,>(rows:readonly T[]):T|null=>rows.length===1?rows[0]!:null
const id=(value:unknown):value is string=>typeof value==='string'&&value.length>0&&value.length<=512&&value.trim().length>0&&!/[\u0000-\u001f\u007f]/.test(value)
const date=(value:string):boolean=>{try{isoDate(value);return true}catch{return false}}
export function isEcosystemSceneTarget(value:unknown):value is EcosystemSceneTarget{
 if(value===null||typeof value!=='object'||Array.isArray(value))return false
 const prototype=Object.getPrototypeOf(value)
 if(prototype!==Object.prototype&&prototype!==null||Object.values(Object.getOwnPropertyDescriptors(value)).some(d=>d.get!==undefined||d.set!==undefined))return false
 const t=value as Record<string,unknown>,base=['kind','runId','accountId','businessId']
 if(typeof t.kind!=='string')return false
 const keys=t.kind==='business'?base:['preparation','adapter','outreach','lead','contract','delivery'].includes(t.kind)?[...base,'recordId']:[]
 return keys.length>0&&Object.keys(t).length===keys.length&&keys.every(k=>Object.hasOwn(t,k)&&id(t[k]))
}
export const ecosystemTargetEntity=(target:EcosystemSceneTarget)=>target.kind==='business'?target.businessId:target.recordId
function sameJob(a:ProductionJob,b:ProductionJob){
 return a.id===b.id&&a.businessId===b.businessId&&a.definitionId===b.definitionId&&a.contractId===b.contractId&&a.actionId===b.actionId
  &&a.startAt===b.startAt&&a.completeAt===b.completeAt&&a.releasedAt===b.releasedAt&&a.status===b.status&&a.outputId===b.outputId
  &&a.resources.length===b.resources.length&&a.resources.every((resource,index)=>resource===b.resources[index])
}

/** Resolve the requested public object. A missing object is never replaced by a different record or an equity desk. */
export function resolveEcosystemSceneTarget(v:DeepseekProjection,target:EcosystemSceneTarget|null,context:EcosystemSceneContext):EcosystemTargetResolution{
 const bad=(reason:string):EcosystemTargetResolution=>({status:'invalid',target,reason,...empty})
 if(!context||!id(context.runId)||!id(context.accountId))return bad('当前生态合作上下文不完整，请重新选择。')
 if(target===null)return context.accountId==='personal'?{status:'entry',target:null,reason:null,...empty}:bad('未选企业的生态方向不绑定另一账户，请明确选择原主体。')
 if(!isEcosystemSceneTarget(target))return bad('原生态对象的身份或种类不完整，请重新选择。')
 if(target.runId!==context.runId)return bad('这份合作来自另一段人生，没有替换当前对象。')
 if(target.accountId!==context.accountId)return bad('原合作与当前账户不匹配，没有换到另一主体。')
 if(!v||!context.operations)return bad('尚未取得原生态合作公开记录，请重新选择。')
 const business=one(v.businesses.filter(b=>b.id===target.businessId)),original=one(context.operations.businesses.filter(b=>b.id===target.businessId))
 if(!business||!original||business.definitionId!=='ecosystem-service'||business.route!=='deepseek_opportunity'||business.accountId!==target.accountId
  ||original.definitionId!==business.definitionId||original.route!==business.route||original.accountId!==business.accountId||original.company!==business.company
  ||context.accounts.filter(a=>a.accountId===business.accountId).length!==1)return bad('原生态企业与账户不唯一或不匹配；没有选成架空权益主体。')
 const resolved:EcosystemTargetResolution={status:'valid',target,reason:null,...empty,business}
 const job=(source:ProductionJob|null|undefined,jobId:string,definitionId:string):ProductionJob|null=>{
  const original=one(context.operations!.jobs.filter(j=>j.id===jobId))
  return source&&source.businessId===business.id&&source.definitionId===definitionId&&original&&sameJob(source,original)
   &&date(original.startAt)&&date(original.completeAt)&&original.completeAt>=original.startAt?original:null
 }
 const outreach=(outreachId:string)=>{
  const row=one(v.outreaches.filter(o=>o.id===outreachId)),actual=row?job(row.job,row.jobId,row.mode==='paid'?'deepseek-outreach':'deepseek-referral'):null
  return row&&row.businessId===business.id&&actual?{row,job:actual}:null
 }
 const lead=(leadId:string)=>{
  const row=one(v.leads.filter(l=>l.id===leadId)),source=row?outreach(row.outreachId):null
  return row&&row.businessId===business.id&&source&&source.row.personIds.includes(row.personId)&&source.row.modelId===row.modelId&&source.row.productId===row.productId?row:null
 }
 const contract=(contractId:string)=>{
  const row=one(v.contracts.filter(c=>c.id===contractId)),source=row?lead(row.leadId):null
  if(!row||row.businessId!==business.id||!source||source.personId!==row.personId||source.modelId!==row.modelId||source.productId!==row.productId
   ||!row.balance||row.balance.id!==row.id||row.balance.accountId!==business.accountId||row.balance.businessId!==business.id)return null
  const production=job(row.productionJob,row.productionJobId,row.scope==='pilot'?'deepseek-pilot-'+row.productId:'deepseek-'+row.productId)
  const support=job(row.supportJob,row.supportJobId,(row.scope==='pilot'?'deepseek-pilot-':'deepseek-')+row.productId+'-support')
  const remediation=row.remediationJobId===null?null:job(row.remediationJob,row.remediationJobId,'deepseek-remediation')
  const deliveries=v.deliveries.filter(d=>d.contractId===row.id),nonnegative=(n:number)=>Number.isSafeInteger(n)&&n>=0
  if(![row.balance.prepaidFen,row.balance.recognizedIncomeFen,row.balance.receivableFen].every(nonnegative)
   ||!nonnegative(business.funds.prepaidLiabilityFen)||!nonnegative(business.funds.receivableFen)||business.funds.prepaidLiabilityFen<row.balance.prepaidFen||business.funds.receivableFen<row.balance.receivableFen
   ||new Set(deliveries.map(d=>d.id)).size!==deliveries.length||new Set(deliveries.map(d=>d.stage)).size!==deliveries.length
   ||deliveries.some(d=>![d.amountFen,d.prepaidFen,d.creditFen,d.remainingFen].every(nonnegative)||d.prepaidFen+d.creditFen!==d.amountFen||d.remainingFen>d.creditFen||!date(d.date)||!date(d.dueAt)||d.dueAt<d.date)
   ||deliveries.reduce((n,d)=>n+d.remainingFen,0)!==row.balance.receivableFen||deliveries.reduce((n,d)=>n+d.amountFen,0)!==row.balance.recognizedIncomeFen)return null
  return production&&support&&(row.remediationJobId===null||remediation)?{row,job:remediation??production}:null
 }
 if(target.kind==='business')return resolved
 if(target.kind==='preparation'){
  const preparation=one(v.preparations.filter(p=>p.id===target.recordId))
  if(!preparation||preparation.businessId!==business.id||!['materials','basics'].includes(preparation.kind))return bad('原材料或技术准备不属于这份生态合作。')
  const actual=job(preparation.job,preparation.jobId,preparation.kind==='materials'?'deepseek-materials':'deepseek-basics')
  return actual?{...resolved,preparation,job:actual}:bad('原准备任务与当前公开记录不匹配。')
 }
 if(target.kind==='adapter'){
  const adapter=one(v.adapters.filter(a=>a.id===target.recordId)),actual=adapter?job(adapter.job,adapter.jobId,'deepseek-adaptation'):null
  return adapter&&adapter.businessId===business.id&&actual?{...resolved,adapter,job:actual}:bad('原模型用途与适配任务不属于这间企业。')
 }
 if(target.kind==='outreach'){
  const source=outreach(target.recordId)
  return source?{...resolved,outreach:source.row,job:source.job}:bad('原需求研究或实际受众来源已经失效。')
 }
 if(target.kind==='lead'){
  const row=lead(target.recordId)
  return row?{...resolved,lead:row}:bad('原客户需求与同一份模型、用途或获客来源不匹配。')
 }
 if(target.kind==='contract'){
  const source=contract(target.recordId)
  return source?{...resolved,contract:source.row,job:source.job}:bad('原合作、客户、生产、支持或原分账不唯一，请重新选择。')
 }
 const delivery=one(v.deliveries.filter(d=>d.id===target.recordId)),source=delivery?contract(delivery.contractId):null
 if(!delivery||!source||!Number.isSafeInteger(delivery.remainingFen)||delivery.remainingFen<0||delivery.remainingFen>delivery.creditFen
  ||!date(delivery.date)||!date(delivery.dueAt)||delivery.dueAt<delivery.date)return bad('原阶段应收与原合作、金额或到期日不匹配。')
 return {...resolved,delivery,contract:source.row,job:source.job}
}
