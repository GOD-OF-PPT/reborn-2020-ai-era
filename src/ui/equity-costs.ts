import type {GamePanelProps} from './game-types.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {DEEPSEEK_JOBS} from '../content/deepseek.ts'
import {isoDate} from '../core/calendar.ts'

type Finance=GamePanelProps['features']['workbench']['finance']
const definitions=new Set(['deepseek-relationship','deepseek-diligence','deepseek-eligibility','deepseek-negotiation','deepseek-governance','deepseek-exit'])
export interface EquityDirectCosts{
 readonly paidFen:number|null
 readonly reservedFen:number|null
 readonly jobs:readonly {readonly id:string;readonly paidFen:number|null;readonly reservedFen:number|null}[]
 readonly reason:string|null
}
const reason='原权益准备费或预留的来源尚未核全，不能把未知金额按零展示。'
const validDate=(v:string)=>{try{isoDate(v);return true}catch{return false}}
const sum=(values:readonly number[])=>{const total=values.reduce((a,b)=>a+b,0);return values.every(n=>Number.isSafeInteger(n)&&n>=0)&&Number.isSafeInteger(total)?total:null}

/** Original direct job payments only: excludes investment principal, broker fees,
 * payroll, upkeep, valuation and transfer receipts. This grants no command authority. */
export function equityDirectCosts(businessId:string,accountId:string,jobs:readonly ProductionJob[]|undefined,finance:Finance|undefined,asOf:string):EquityDirectCosts{
 const unknown:EquityDirectCosts={paidFen:null,reservedFen:null,jobs:[],reason}
 if(!jobs||!finance||!validDate(asOf))return unknown
 const accounts=finance.filter(f=>f.accountId===accountId),tasks=jobs.filter(j=>j.businessId===businessId&&definitions.has(j.definitionId))
 if(accounts.length!==1||new Set(tasks.map(j=>j.id)).size!==tasks.length||new Set(tasks.map(j=>j.actionId)).size!==tasks.length)return unknown
 const f=accounts[0]!,actions=new Set(tasks.map(j=>j.actionId)),transactions=f.transactions.filter(t=>actions.has(t.sourceId))
 // A negotiation action is also the later principal's source; an exit action
 // is also the sale and collection source. Only a matching original COST
 // operation plus its actual negative cash line proves a paid job budget.
 const metrics=f.metrics.filter(m=>m.kind==='cost'&&actions.has(m.sourceEventId))
 if(new Set(metrics.map(m=>m.operationId)).size!==metrics.length)return unknown
 const payments=transactions.filter(t=>t.amountFen<0&&metrics.some(m=>m.operationId===t.id&&m.sourceEventId===t.sourceId&&m.accountId===accountId&&m.businessId===businessId&&m.date===t.date&&m.deltaFen===-t.amountFen))
 const holds=f.reservations.filter(r=>r.kind==='plan'&&r.status==='active'&&actions.has(r.originId))
 if(payments.some(t=>t.businessId!==businessId||!validDate(t.date)||t.date>asOf)||new Set(transactions.map(t=>t.id)).size!==transactions.length||new Set(holds.map(r=>r.id)).size!==holds.length)return unknown
 const rows=tasks.map(job=>{
  const term=DEEPSEEK_JOBS.find(t=>t.id===job.definitionId),paid=sum(payments.filter(t=>t.sourceId===job.actionId).map(t=>-t.amountFen)),held=sum(holds.filter(r=>r.originId===job.actionId).map(r=>r.amountFen))
  if(!term||!validDate(job.startAt)||!validDate(job.completeAt))return {id:job.id,paidFen:null,reservedFen:null}
  const started=['running','completed'].includes(job.status)||job.status==='interrupted'&&job.releasedAt!==null&&validDate(job.releasedAt)&&job.releasedAt>=job.startAt
  return {id:job.id,paidFen:paid===(started?term.costFen:0)?paid:null,reservedFen:held===(job.status==='planned'?term.costFen:0)?held:null}
 })
 const paidFen=rows.every(r=>r.paidFen!==null)?sum(rows.map(r=>r.paidFen!)):null,reservedFen=rows.every(r=>r.reservedFen!==null)?sum(rows.map(r=>r.reservedFen!)):null
 return {paidFen,reservedFen,jobs:rows,reason:paidFen===null||reservedFen===null?reason:null}
}

export function equityBrokerFee(invitation:{readonly id:string;readonly businessId:string;readonly brokerPaymentId:string|null},accountId:string,finance:Finance,asOf:string):{paidFen:number|null;reason:string|null}{
 if(invitation.brokerPaymentId===null)return {paidFen:0,reason:null}
 const unknown={paidFen:null,reason:'这封邀请记有中间服务费，但实际流水来源尚待核对；不能按零或投资本金展示。'}
 const accounts=finance.filter(f=>f.accountId===accountId);if(accounts.length!==1||!validDate(asOf))return unknown
 const f=accounts[0]!,rows=f.transactions.filter(t=>t.id===invitation.brokerPaymentId),metrics=f.metrics.filter(m=>m.operationId===invitation.brokerPaymentId&&m.kind==='cost')
 if(rows.length!==1||metrics.length!==1)return unknown
 const t=rows[0]!,m=metrics[0]!
 return t.sourceId===invitation.id&&t.businessId===invitation.businessId&&t.amountFen<0&&Number.isSafeInteger(t.amountFen)&&validDate(t.date)&&t.date<=asOf&&m.sourceEventId===invitation.id&&m.accountId===accountId&&m.businessId===invitation.businessId&&m.date===t.date&&m.deltaFen===-t.amountFen?{paidFen:-t.amountFen,reason:null}:unknown
}
