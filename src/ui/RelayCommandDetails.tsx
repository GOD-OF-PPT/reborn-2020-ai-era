import type {CommandEnvelope} from '../core/run-types.ts'
import type {RelayProjection} from '../core/relay-projection.ts'
import type {WorkerInstance} from '../core/operations-types.ts'
import {RELAY_JOBS} from '../content/relay.ts'
import {relayAuditCompletion} from './relay-audit-dates.ts'
import {relayAuditableMeters} from './relay-scene-progress.ts'
import {courseResourceLabel} from './course-resource-labels.ts'
import {moneyText} from './game-text.ts'

/** The caller supplies the same captured public snapshot as the original confirmation. */
export function RelayCommandDetails({command,relay,workers,accountName}:{command:CommandEnvelope;relay:RelayProjection;workers:readonly WorkerInstance[];accountName:(id:string)=>string}){
 if(!relay)return null
 if(command.kind==='CollectRelayDue'){
  const payload=command.payload as {customerId:string},customer=relay.customers.find(c=>c.id===payload.customerId),business=relay.businesses.find(b=>b.id===customer?.businessId)
  if(!customer||!business)return null
  const number=relay.customers.filter(c=>c.businessId===business.id).findIndex(c=>c.id===customer.id)+1
  return <section className="confirmation-context"><h3>收好客户{number}的这笔原回款</h3><p>{accountName(business.accountId)}将收取已经到期的原应收{moneyText(customer.dueReceivableFen)}，对应客户{number}的原合同（{customer.signedAt}—{customer.termEnd}）。</p><p>另有{moneyText(customer.balance.receivableFen-customer.dueReceivableFen)}原应收尚未到期，继续留在原账。回款不重复确认收入；原计量、独立复核和差额更正仍分别保留。</p></section>
 }
 if(command.kind!=='StartRelayAudit')return null
 const payload=command.payload as {periodId?:string;meterId?:string;resources:string[];startAt:string}
 const meter=payload.meterId?relay.meters.find(m=>m.id===payload.meterId):undefined
 const period=relay.periods.find(p=>p.id===(payload.periodId??meter?.periodId)),business=relay.businesses.find(b=>b.id===period?.businessId)
 if(!period||!business)return null
 const eligible=relayAuditableMeters(relay,period.id).filter(m=>!payload.meterId||m.id===payload.meterId),job=RELAY_JOBS.find(j=>j.id==='relay-meter-audit')!
 return <section className="confirmation-context relay-audit-terms">
  <h3>只查这一段已经发生的原账</h3>
  <p>{period.from}—{period.to}原服务 · {accountName(business.accountId)}支付{moneyText(job.costFen)}。本次覆盖{eligible.length}条已发生且可复核的计量，后续请求不会自动纳入。</p>
  <p>{payload.resources.map(id=>id==='player-production'?'本人实际维护时间':courseResourceLabel(id,relay.resources,workers)).join('、')} · {payload.startAt}—{relayAuditCompletion(payload.startAt,job.durationDays)??'完成日期待核对'} · 原{job.actionPoints}点与{job.durationDays}日。原工资、服务和支持排程仍继续计算。</p>
  <p>完成之前不揭示实计用量；完成之后仍要另行确认差额更正。原账保留，更正不等于客户到账，也不把未消费充值或供应贷项变成利润。</p>
 </section>
}
