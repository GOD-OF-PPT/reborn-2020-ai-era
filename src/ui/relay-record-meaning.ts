import type {ProductionJob} from '../core/operations-types.ts'
import {isoDate} from '../core/calendar.ts'
import type {GamePanelProps} from './game-types.ts'
import type {RelayRecordRow} from './relay-records.ts'
import {resolveRelaySceneTarget,type RelaySceneTarget} from './relay-scene-target.ts'
import {moneyText} from './game-text.ts'
import {relayAuditableMeters} from './relay-scene-progress.ts'

type Input=Pick<GamePanelProps,'view'|'features'|'accountId'>
export type RelayRecordMeaning='respond'|'waiting'|'optional'|'retained'
export interface RelayRecordReading{meaning:RelayRecordMeaning;reason:string;unknown:boolean}
export const relayRecordMeaningLabels:Record<RelayRecordMeaning,string>={respond:'需回应',waiting:'正在等',optional:'可选处理',retained:'留存依据'}
const one=<T,>(rows:readonly T[])=>rows.length===1?rows[0]:undefined
const amount=(n:number)=>Number.isSafeInteger(n)&&n>=0
const validDate=(date:string|null|undefined):date is string=>{try{isoDate(date);return true}catch{return false}}
const reading=(meaning:RelayRecordMeaning,reason:string,unknown=false):RelayRecordReading=>({meaning,reason,unknown})
const unknown=()=>reading('respond','原来源尚不能唯一核对；先核依据，不把未知当作零或责任已清。',true)
function sameJob(a:ProductionJob,b:ProductionJob){return a.id===b.id&&a.businessId===b.businessId&&a.definitionId===b.definitionId&&a.actionId===b.actionId&&a.startAt===b.startAt&&a.completeAt===b.completeAt&&a.status===b.status&&a.releasedAt===b.releasedAt&&a.contractId===b.contractId&&a.outputId===b.outputId&&a.resources.length===b.resources.length&&a.resources.every((id,i)=>id===b.resources[i])}
function readyHistory(p:Input){const h=p.features.relay?.casebook;return h?.status==='ready'&&h.runId===p.view.runId&&h.revision===p.view.revision&&h.asOf===p.view.date?h:null}

/** The original public quote wait, shared with the existing Clock consumer. */
export function relayRecordQuoteEffectiveDate(p:Input,target:RelaySceneTarget,row:RelayRecordRow):string|null{
 const v=p.features.relay
 if(!v||row.kind!=='quote'||!row.quoteId||!row.jobId)return null
 if(resolveRelaySceneTarget(v,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations}).status!=='valid')return null
 const quotes=v.quotes.filter(q=>q.id===row.quoteId&&q.businessId===target.businessId&&q.jobId===row.jobId),q=quotes.length===1?quotes[0]:undefined
 const jobs=p.view.operations?.jobs.filter(j=>j.id===row.jobId&&j.businessId===target.businessId)??[],job=jobs.length===1?jobs[0]:undefined
 if(!q||!job||job.status!=='completed'||q.completedAt===null||q.job?.id!==job.id||q.job.businessId!==target.businessId||q.job.status!=='completed')return null
 if(!validDate(p.view.date)||!validDate(q.completedAt)||!validDate(q.effectiveAt)||!validDate(job.completeAt))return null
 if(job.completeAt>q.completedAt||q.completedAt>p.view.date||q.effectiveAt<=p.view.date||!q.customerIds.length||new Set(q.customerIds).size!==q.customerIds.length)return null
 if(q.customerIds.some(id=>v.customers.filter(c=>c.id===id&&c.businessId===target.businessId).length!==1)||q.responses.length!==q.customerIds.length||new Set(q.responses.map(r=>r.customerId)).size!==q.customerIds.length||q.responses.some(r=>!q.customerIds.includes(r.customerId)||typeof r.accepted!=='boolean')||!q.responses.some(r=>r.accepted))return null
 return q.effectiveAt
}

function originalJob(p:Input,target:RelaySceneTarget,row:RelayRecordRow):ProductionJob|null|undefined{
 const v=p.features.relay!
 if(!row.jobId)return row.kind==='audience'?null:undefined
 const job=one(p.view.operations?.jobs.filter(j=>j.id===row.jobId&&j.businessId===target.businessId)??[])
 if(!job)return undefined
 const source=row.kind==='service'?one(v.periods.filter(r=>r.id===row.periodId&&r.businessId===target.businessId&&r.jobId===row.jobId))?.job
  :row.kind==='support'?one(v.periods.filter(r=>r.id===row.periodId&&r.businessId===target.businessId&&r.supportJobId===row.jobId))?.supportJob
  :row.kind==='audit'?one(v.auditJobs.filter(r=>r.jobId===row.jobId&&r.businessId===target.businessId))?.job
  :row.kind==='preparation'?one(v.preparations.filter(r=>r.id===row.recordId&&r.businessId===target.businessId&&r.jobId===row.jobId))?.job
  :row.kind==='adapter'?one(v.adapters.filter(r=>r.id===row.recordId&&r.businessId===target.businessId&&r.jobId===row.jobId))?.job
  :row.kind==='application'?one(v.applications.filter(r=>r.id===row.applicationId&&r.businessId===target.businessId&&r.jobId===row.jobId))?.job
  :row.kind==='audience'?one(v.audiences.filter(r=>r.id===row.audienceId&&r.businessId===target.businessId&&r.jobId===row.jobId))?.job
  :row.kind==='quote'?one(v.quotes.filter(r=>r.id===row.quoteId&&r.businessId===target.businessId&&r.jobId===row.jobId))?.job:undefined
 return source&&sameJob(source,job)&&validDate(job.startAt)&&validDate(job.completeAt)?job:undefined
}

/** Reading groups describe public meaning; they never preview or gate a command. */
export function relayRecordReading(p:Input,target:RelaySceneTarget,row:RelayRecordRow):RelayRecordReading{
 try{return classify(p,target,row)}catch{return unknown()}
}
function classify(p:Input,target:RelaySceneTarget,row:RelayRecordRow):RelayRecordReading{
 const v=p.features.relay,r=resolveRelaySceneTarget(v,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})
 if(!v||r.status!=='valid'||!validDate(p.view.date))return unknown()
 if(row.target&&(row.target.runId!==target.runId||row.target.accountId!==target.accountId||row.target.businessId!==target.businessId||row.target.stationId!==target.stationId||resolveRelaySceneTarget(v,row.target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations}).status!=='valid'))return unknown()
 const history=readyHistory(p),finance=one(p.features.workbench.finance.filter(f=>f.accountId===target.accountId))
 const ownCustomer=(id:string|undefined)=>one(v.customers.filter(c=>c.id===id&&c.businessId===target.businessId))
 if(row.kind==='receivable'){
  const invoice=one(v.receivables.filter(i=>i.id===row.receivableId&&i.customerId===row.customerId))
  if(!invoice||!ownCustomer(invoice.customerId)||!validDate(invoice.dueAt)||![invoice.amountFen,invoice.collectedFen,invoice.reversedFen].every(amount))return unknown()
  const remaining=invoice.amountFen-invoice.collectedFen-invoice.reversedFen
  return remaining<0?unknown():remaining===0?reading('retained','原单已收与冲回仍留作依据，不再次记收入。'):invoice.dueAt>p.view.date?reading('waiting','等这张已开原单自己的到期日 '+invoice.dueAt+'；尚不能当可花现金。'):reading('respond','原单已经到期，可决定本次收款；仍可先继续原安排，不要求先清空列表。')
 }
 if(row.kind==='customer'){
  const customer=ownCustomer(row.customerId)
  if(!customer||![customer.balance.prepaidFen,customer.balance.receivableFen,customer.dueReceivableFen].every(amount))return unknown()
  if(customer.dueReceivableFen>0)return reading('respond','这位客户有已到期原款，可决定收款；原余额与保护仍分别保留。')
  const future=v.receivables.filter(i=>i.customerId===customer.id&&i.amountFen>i.collectedFen+i.reversedFen)
  if(future.some(i=>![i.amountFen,i.collectedFen,i.reversedFen].every(amount))||future.reduce((sum,i)=>sum+i.amountFen-i.collectedFen-i.reversedFen,0)!==customer.balance.receivableFen)return unknown()
  if(future.length){if(future.some(i=>!validDate(i.dueAt)||i.dueAt<=p.view.date))return unknown();return reading('waiting','这位客户仍有尚未到期的原单，按各自原日期等待；预款保护不变。')}
  return reading('retained',customer.balance.prepaidFen>0?'原未消费预款继续受保护；正常留存不是待清空任务，退款仍可另行显选。':'原客户条款与旧款依据保留；新充值、续签或新服务仍须另行决定。')
 }
 if(row.kind==='obligation'){
  const debts=history?history.obligationHistory.filter(o=>o.id===row.obligationId&&o.scopeBusinessId===target.businessId&&o.accountId===target.accountId):finance?.obligations.filter(o=>o.id===row.obligationId&&o.accountId===target.accountId&&(o.businessId===target.businessId||r.business?.company&&o.businessId===null))??[]
  const debt=debts.length===1?debts[0]:undefined
  if(!debt||!amount(debt.remainingFen)||!validDate(debt.date))return unknown()
  return debt.remainingFen===0?reading('retained','这笔原义务已结，实际付款与原引用继续保留。'):debt.date>p.view.date?reading('waiting','原义务仍在，自己的到期日是 '+debt.date+'；不提前抹去欠款。'):reading('respond','原义务已到期未付，需面对原付款或有限处理；原保护与可花限制继续。')
 }
 if(row.kind==='refund'){
  const refund=one(v.refunds.filter(f=>f.id===row.refundId&&f.customerId===row.customerId))
  if(!refund||!ownCustomer(refund.customerId)||!history)return unknown()
  const debts=history.obligationHistory.filter(o=>o.scopeBusinessId===target.businessId&&o.accountId===target.accountId&&refund.operationIds.includes(o.originOperationId))
  if(!refund.operationIds.length||refund.operationIds.some(id=>debts.filter(o=>o.originOperationId===id).length!==1)||debts.some(o=>!amount(o.remainingFen)||!validDate(o.date)))return unknown()
  const later=history.operations.filter(o=>o.scopeBusinessId===target.businessId&&o.accountId===target.accountId&&o.kind==='pay_obligation'&&debts.some(d=>d.id===o.obligationId)),operations=new Set([...refund.operationIds,...later.map(o=>o.id)])
  const cash=history.transactions.filter(t=>t.scopeBusinessId===target.businessId&&t.accountId===target.accountId&&operations.has(t.id)&&debts.some(d=>d.id===t.referenceId&&(d.originOperationId===t.id||later.some(o=>o.id===t.id&&o.obligationId===d.id))))
  if(cash.some(t=>t.amountFen>=0)||cash.reduce((sum,t)=>sum-t.amountFen,0)+debts.reduce((sum,d)=>sum+d.remainingFen,0)!==refund.amountFen)return unknown()
  return debts.some(o=>o.remainingFen>0)?reading('respond','退款仍有原欠款，实际已付与尚欠分别核对；不会因翻页或离开清除。'):reading('retained','原退款已按原义务结算；充值批次、保护和实际付款依据仍保留。')
 }
 if(row.kind==='supplier'){
  const option=one(v.supplyOptions.filter(o=>o.businessId===target.businessId&&o.supplierId===row.supplierId))
  if(!option||!amount(option.outstandingFen)||option.credit&&(!amount(option.credit.remainingFen)||option.credit.businessId!==target.businessId||option.credit.accountId!==target.accountId))return unknown()
  if(option.outstandingFen>0){
   if(!history)return unknown()
   const costs=new Set(v.meters.filter(m=>m.supplierId===row.supplierId&&v.periods.some(period=>period.id===m.periodId&&period.businessId===target.businessId)).flatMap(m=>m.costOperationId?[m.costOperationId]:[]))
   const operations=history.operations.filter(o=>o.scopeBusinessId===target.businessId&&(costs.has(o.id)||option.credit&&o.prepaymentId===option.credit.id)),ids=new Set(operations.map(o=>o.id)),debts=history.obligationHistory.filter(o=>o.scopeBusinessId===target.businessId&&o.accountId===target.accountId&&ids.has(o.originOperationId)&&o.remainingFen>0)
   if(debts.some(o=>!amount(o.remainingFen)||!validDate(o.date))||debts.reduce((sum,o)=>sum+o.remainingFen,0)!==option.outstandingFen)return unknown()
   return debts.some(o=>o.date<=p.view.date)?reading('respond','这条供应有已到期原欠款；资产、费用与付款继续分别核对。'):reading('waiting','这条供应有未到期原单，按原义务自己的日期等待。')
  }
  return (option.credit?.remainingFen??0)>0?reading('optional','可以显选取回未用供应资产；正常留存不是未完成任务，也不记利润。'):reading('retained','供应条款与原资产流水留作依据；没有补造新预付或贷项。')
 }
 if(row.kind==='meter'){
  const meter=one(v.meters.filter(m=>m.id===row.meterId&&m.periodId===row.periodId&&m.customerId===row.customerId))
  if(!meter||!ownCustomer(meter.customerId)||!v.periods.some(period=>period.id===meter.periodId&&period.businessId===target.businessId))return unknown()
  const audits=v.audits.filter(a=>a.meterId===meter.id&&a.businessId===target.businessId),active=v.auditJobs.filter(batch=>batch.businessId===target.businessId&&audits.some(a=>a.jobId===batch.jobId)&&batch.job&&['planned','running'].includes(batch.job.status))
  if(active.length>1)return unknown()
  if(active.length===1){const job=active[0]!.job,original=job?one(p.view.operations?.jobs.filter(j=>j.id===job.id&&j.businessId===target.businessId)??[]):undefined;return job&&original&&sameJob(job,original)?reading('waiting','这张票已在原复核中，等它实际完成才看实计，不重复委托。'):unknown()}
  if(meter.correctionId)return reading('retained','原更正已经保存；新增单据、付款与剩余责任仍各沿自己的原记录。')
  if(meter.auditedUnits!==null){
   const audit=one(audits.filter(a=>a.completedAt!==null&&a.completedAt<=p.view.date&&a.actualUnits===meter.auditedUnits))
   if(!audit)return unknown()
   return meter.auditedUnits!==meter.reportedUnits?reading('respond','已完成的独立复核有公开差额，可核对这一张原票并决定追加更正。'):reading('optional','实计与原报告一致；可以核对原票，不强制制造一次更正。')
  }
  if(relayAuditableMeters(v,meter.periodId).some(m=>m.id===meter.id))return reading('optional','可以显选核对这一张原票的独立复核条件；尚未委托，不冒充正在等，原资格与费用仍核。')
  return meter.supplierId===null?reading('retained','这张原报告没有形成供应服务；报告与当时原因保留，不把未知实计写成零。'):unknown()
 }
 if(['preparation','application','adapter','audience','service','support','audit','quote'].includes(row.kind)){
  const job=originalJob(p,target,row)
  if(job===undefined)return unknown()
  if(job&&['planned','running'].includes(job.status))return reading('waiting','等这份已安排的原任务：'+(job.status==='planned'?job.startAt+'开工':job.completeAt+'反馈')+'；原费用与日期屏障继续。')
  if(row.kind==='support'&&job&&['interrupted','cancelled'].includes(job.status)){
   const period=one(v.periods.filter(period=>period.id===row.periodId&&period.businessId===target.businessId&&period.supportJobId===job.id))
   if(!period)return unknown()
   if(period.feePostedAt===null&&period.compensatedAt===null)return job.completeAt>p.view.date?reading('waiting','原支持已经停止，仍等原结算日 '+job.completeAt+'；不是免费补做支持，也不预告结算金额。'):unknown()
   if(period.feePostedAt===null||period.compensatedAt===null)return unknown()
  }
  if(row.kind==='application'){
   const application=one(v.applications.filter(a=>a.id===row.applicationId&&a.businessId===target.businessId))
   if(!application)return unknown()
   if(!application.read&&job?.status==='completed')return reading('respond','原回信已经到达，仍需亲自翻阅；未读批准与有效期保持未知。')
  }
  if(row.kind==='quote'){
   const effectiveAt=relayRecordQuoteEffectiveDate(p,target,row)
   if(effectiveAt)return reading('waiting','原报价已谈妥，仍等 '+effectiveAt+'生效；旧价与已发生原账不追改。')
   const q=one(v.quotes.filter(q=>q.id===row.quoteId&&q.businessId===target.businessId))
   if(job?.status==='completed'&&(!q||!validDate(q.completedAt)||q.completedAt>p.view.date||job.completeAt>q.completedAt||!validDate(q.effectiveAt)||!q.customerIds.length||new Set(q.customerIds).size!==q.customerIds.length||q.responses.length!==q.customerIds.length||new Set(q.responses.map(x=>x.customerId)).size!==q.customerIds.length||q.responses.some(x=>!q.customerIds.includes(x.customerId)||typeof x.accepted!=='boolean')))return reading('retained','原报价的完成或答复来源尚待核定；结果未知，不补成零接受或无责任。',true)
  }
  return reading('retained','原安排与实际结果留作依据；新的业务或承诺仍需另行显选。')
 }
 if(row.attention==='due'||row.attention==='known')return unknown()
 return reading('retained',history?'已经保存的原约或流水继续保留；结算、保护与未完义务仍分别核对。':'原约本身仍可读，逐笔结算来源尚未取得；不能据此断言责任已经清除。',!history)
}

/** This is an account disclosure, never an instruction to clear normal balances. */
export function relayRecordProtectionText(p:Input,target:RelaySceneTarget):string{
 const resolved=resolveRelaySceneTarget(p.features.relay,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations}),account=one(p.view.accounts.filter(a=>a.accountId===target.accountId))
 if(resolved.status!=='valid'||!account||!amount(account.prepaidLiabilityFen)||!amount(account.protectionRequiredFen))return '原账户客户保护来源尚待核对；不能把未知当作零或无义务。'
 return '本账户未消费客户预款 '+moneyText(account.prepaidLiabilityFen)+' 仍为负债；保护需求（含冻结）'+moneyText(account.protectionRequiredFen)+'。正常留存不要求为翻页或离开退清，原退款和旧责任仍可核对。'
}
