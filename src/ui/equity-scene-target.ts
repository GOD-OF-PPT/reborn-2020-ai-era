import type {DeepseekProjection} from '../core/deepseek-projection.ts'
import type {OperationsState,ProductionJob} from '../core/operations-types.ts'
import {isoDate} from '../core/calendar.ts'

type Equity=NonNullable<DeepseekProjection>
export type EquityRecordKind='preparation'|'invitation'|'negotiation'|'agreement'|'governance'|'exit'
export type EquitySceneTarget={readonly runId:string;readonly accountId:string;readonly businessId:string}&(
 |{readonly kind:'business'}
 |{readonly kind:EquityRecordKind;readonly recordId:string}
)
export interface EquitySceneContext{
 readonly runId:string
 readonly accountId:string
 readonly date:string
 readonly accounts:readonly {readonly accountId:string}[]
 readonly operations:Pick<OperationsState,'businesses'|'jobs'>|null
}
export interface EquityTargetResolution{
 readonly status:'entry'|'valid'|'invalid'
 readonly target:EquitySceneTarget|null
 readonly reason:string|null
 readonly business:Equity['businesses'][number]|null
 readonly preparation:Equity['preparations'][number]|null
 readonly invitation:Equity['invitations'][number]|null
 readonly negotiation:Equity['negotiations'][number]|null
 readonly agreement:Equity['agreements'][number]|null
 readonly governance:Equity['governance'][number]|null
 readonly exit:Equity['exits'][number]|null
 readonly job:ProductionJob|null
}
const empty={business:null,preparation:null,invitation:null,negotiation:null,agreement:null,governance:null,exit:null,job:null}
const one=<T,>(rows:readonly T[]):T|null=>rows.length===1?rows[0]!:null
const id=(value:unknown):value is string=>typeof value==='string'&&value.length>0&&value.length<=512&&value.trim().length>0&&!/[\u0000-\u001f\u007f]/.test(value)
const date=(value:string)=>{try{isoDate(value);return true}catch{return false}}
const nonnegative=(value:number)=>Number.isSafeInteger(value)&&value>=0
export function isEquitySceneTarget(value:unknown):value is EquitySceneTarget{
 try{
  if(value===null||typeof value!=='object'||Array.isArray(value))return false
  const prototype=Object.getPrototypeOf(value)
  if(prototype!==Object.prototype&&prototype!==null||Object.values(Object.getOwnPropertyDescriptors(value)).some(d=>d.get!==undefined||d.set!==undefined))return false
  const t=value as Record<string,unknown>,base=['kind','runId','accountId','businessId']
  const keys=t.kind==='business'?base:['preparation','invitation','negotiation','agreement','governance','exit'].includes(String(t.kind))?[...base,'recordId']:[]
  return keys.length>0&&Object.keys(t).length===keys.length&&keys.every(k=>Object.hasOwn(t,k)&&id(t[k]))
 }catch{return false}
}
export const equityTargetEntity=(target:EquitySceneTarget)=>target.kind==='business'?target.businessId:target.recordId
function sameJob(a:ProductionJob,b:ProductionJob){
 return a.id===b.id&&a.businessId===b.businessId&&a.definitionId===b.definitionId&&a.contractId===b.contractId&&a.actionId===b.actionId
  &&a.startAt===b.startAt&&a.completeAt===b.completeAt&&a.releasedAt===b.releasedAt&&a.status===b.status&&a.outputId===b.outputId
  &&a.resources.length===b.resources.length&&a.resources.every((resource,index)=>resource===b.resources[index])
}

/** Read the selected original record. Never change its owner, pick a newer row or infer an unrevealed reply. */
export function resolveEquitySceneTarget(v:DeepseekProjection,target:EquitySceneTarget|null,context:EquitySceneContext):EquityTargetResolution{
 const bad=(reason:string):EquityTargetResolution=>({status:'invalid',target,reason,...empty})
 if(!context||!id(context.runId)||!id(context.accountId)||!date(context.date))return bad('当前架空权益的阅读上下文不完整，请重新选择。')
 if(!v)return bad('尚未取得原架空权益公开记录，请稍后重新选择。')
 if(target===null)return context.accountId==='personal'?{status:'entry',target:null,reason:null,...empty}:bad('尚未选择权益主体，不能默认采用另一份企业账户。')
 if(!isEquitySceneTarget(target))return bad('原权益对象的身份或种类不完整，请重新选择。')
 if(target.runId!==context.runId)return bad('这份权益记录来自另一段人生，没有替换当前对象。')
 if(target.accountId!==context.accountId)return bad('原权益对象与当前账户不匹配，没有切换承担主体。')
 if(!context.operations)return bad('原准备主体与任务记录尚未取得，请重新选择。')
 const business=one(v.businesses.filter(b=>b.id===target.businessId)),original=one(context.operations.businesses.filter(b=>b.id===target.businessId))
 if(!business||!original||!['deepseek-investor','ecosystem-service'].includes(business.definitionId)||business.route!=='deepseek_opportunity'||business.accountId!==target.accountId
  ||original.definitionId!==business.definitionId||original.accountId!==business.accountId||original.route!==business.route||original.company!==business.company
  ||context.accounts.filter(a=>a.accountId===target.accountId).length!==1)return bad('原权益准备主体或账户不唯一，没有选成另一间企业。')
 const resolved:EquityTargetResolution={status:'valid',target,reason:null,...empty,business}
 const job=(source:ProductionJob|null|undefined,jobId:string,definitionId:string)=>{
  const actual=one(context.operations!.jobs.filter(j=>j.id===jobId))
  return source&&actual&&actual.businessId===business.id&&actual.definitionId===definitionId&&sameJob(source,actual)
   &&date(actual.startAt)&&date(actual.completeAt)&&actual.completeAt>=actual.startAt?actual:null
 }
 const invitation=(recordId:string)=>{
  const row=one(v.invitations.filter(i=>i.id===recordId))
  if(!row||row.businessId!==business.id||row.classification!=='counterfactual'||!date(row.createdAt)||!date(row.expiresAt)||row.expiresAt<row.createdAt)return null
  const actual=row.diligenceJobId===null?null:job(row.diligenceJob,row.diligenceJobId,'deepseek-diligence')
  if(row.diligenceJobId===null&&row.diligenceJob!==null||row.diligenceJobId!==null&&!actual)return null
  if(row.reportAt===null?(row.authority!==null||row.financingConsent!==null):!date(row.reportAt)||row.reportAt>context.date||row.authority===null||row.financingConsent===null||actual?.status!=='completed'||actual.completeAt!==row.reportAt)return null
  return {row,job:actual}
 }
 const negotiation=(recordId:string)=>{
  const row=one(v.negotiations.filter(n=>n.id===recordId)),parent=row?invitation(row.invitationId):null
  const actual=row?job(row.job,row.jobId,'deepseek-negotiation'):null
  if(!row||row.businessId!==business.id||row.classification!=='counterfactual'||!parent||!actual||!v.catalog.terms.some(t=>t.id===row.termsId))return null
  if(row.respondedAt===null?row.accepted!==null:!date(row.respondedAt)||row.respondedAt>context.date||row.accepted===null||actual.status!=='completed'||actual.completeAt!==row.respondedAt)return null
  return {row,invitation:parent.row,job:actual}
 }
 const agreement=(recordId:string)=>{
  const row=one(v.agreements.filter(a=>a.id===recordId)),parent=row?negotiation(row.negotiationId):null,asset=row?.asset
  if(!row||!parent||row.businessId!==business.id||row.accountId!==business.accountId||row.invitationId!==parent.invitation.id||row.classification!=='counterfactual'
   ||parent.row.closedKind!=='signed'||parent.row.accepted!==true||parent.row.closedAt!==row.signedAt||row.kind!==parent.row.kind||row.termsId!==parent.row.termsId||row.initialShares!==parent.row.shares||row.initialCostFen!==parent.row.amountFen
   ||!asset||asset.id!==row.investmentId||asset.accountId!==row.accountId||asset.assetId!==row.subjectId||asset.classification!=='counterfactual'
   ||![row.shares,asset.bookCostFen,asset.valueFen].every(nonnegative))return null
  const terms=v.catalog.terms.find(t=>t.id===row.termsId)!
  if(row.board!==terms.board||row.information!==terms.information||row.preemptive!==terms.preemptive||row.transferConsent!==terms.transferConsent)return null
  return {row,negotiation:parent.row,invitation:parent.invitation}
 }
 if(target.kind==='business')return resolved
 if(target.kind==='preparation'){
  const row=one(v.preparations.filter(p=>p.id===target.recordId)),actual=row&&['relationship','eligibility'].includes(row.kind)?job(row.job,row.jobId,row.kind==='relationship'?'deepseek-relationship':'deepseek-eligibility'):null
  return row&&row.businessId===business.id&&actual?{...resolved,preparation:row,job:actual}:bad('原关系或资格准备与本主体、原任务不匹配。')
 }
 if(target.kind==='invitation'){
  const original=invitation(target.recordId)
  return original?{...resolved,invitation:original.row,job:original.job}:bad('原邀请、授权报告或尽调任务不唯一，请重新选择。')
 }
 if(target.kind==='negotiation'){
  const original=negotiation(target.recordId)
  return original?{...resolved,negotiation:original.row,invitation:original.invitation,job:original.job}:bad('原谈判与其邀请、条款或实际回应不匹配。')
 }
 if(target.kind==='agreement'){
  const original=agreement(target.recordId)
  return original?{...resolved,agreement:original.row,negotiation:original.negotiation,invitation:original.invitation}:bad('原协议、持有资产与其谈判主体不匹配；没有换成另一份持股。')
 }
 if(target.kind==='governance'){
  const row=one(v.governance.filter(g=>g.id===target.recordId)),parent=row?agreement(row.agreementId):null,actual=row?job(row.job,row.jobId,'deepseek-governance'):null
  if(!row||row.businessId!==business.id||!parent||!actual)return bad('原治理会议与协议、主体或任务不匹配。')
  if(row.resolvedAt===null?row.approved!==null:!date(row.resolvedAt)||row.resolvedAt>context.date||row.approved===null||actual.status!=='completed'||actual.completeAt!==row.resolvedAt)return bad('原治理回应尚未核定，没有提前显示通过。')
  return {...resolved,governance:row,agreement:parent.row,negotiation:parent.negotiation,invitation:parent.invitation,job:actual}
 }
 const row=one(v.exits.filter(e=>e.id===target.recordId)),parent=row?agreement(row.agreementId):null,actual=row?job(row.job,row.jobId,'deepseek-exit'):null
 if(!row||row.businessId!==business.id||!parent||!actual)return bad('原转让申请与协议、主体或买方调查不匹配。')
 if(row.responseAt===null?row.buyerWilling!==null||row.unitPriceFen!==null||row.buyerKind!==null:!date(row.responseAt)||row.responseAt>context.date||row.buyerWilling===null||actual.status!=='completed'||actual.completeAt!==row.responseAt)return bad('原买方回应尚未核定，没有提前显示报价。')
 if(row.buyerWilling===true&&(row.unitPriceFen===null||!nonnegative(row.unitPriceFen))||row.buyerWilling===false&&row.unitPriceFen!==null)return bad('原买方意愿与这份报价金额不一致。')
 const receivable=row.receivable
 if(row.receivableId===null?receivable!==null||row.operationId!==null:!receivable||row.operationId===null||row.soldShares<1||receivable.id!==row.receivableId||receivable.accountId!==business.accountId||receivable.sourceEventId!==row.id||receivable.originOperationId!==row.operationId||receivable.dueAt!==row.dueAt||![receivable.amountFen,receivable.remainingFen,row.collectedFen].every(nonnegative)||receivable.remainingFen>receivable.amountFen||row.collectedFen!==receivable.amountFen-receivable.remainingFen)return bad('原转让应收、实收来源、金额或到期日不匹配。')
 return {...resolved,exit:row,agreement:parent.row,negotiation:parent.negotiation,invitation:parent.invitation,job:actual}
}
