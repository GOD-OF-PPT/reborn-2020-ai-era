import type {CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps} from './game-types.ts'
import type {WorkerInstance} from '../core/operations-types.ts'
import {RELAY_JOBS} from '../content/relay.ts'
import {relayAuditCompletion} from './relay-audit-dates.ts'
import {relayAuditableMeters} from './relay-scene-progress.ts'
import {courseResourceLabel} from './course-resource-labels.ts'
import {moneyText} from './game-text.ts'
import {relayResponseCommandDetails} from './RelayResponseCommandDetails.tsx'

/** The caller supplies the same captured public snapshot as the original confirmation. */
export function RelayCommandDetails({command,relay,workers,accountName,view,finance}:{command:CommandEnvelope;relay:GamePanelProps['features']['relay'];workers:readonly WorkerInstance[];accountName:(id:string)=>string;view?:GamePanelProps['view']|undefined;finance?:GamePanelProps['features']['workbench']['finance']|undefined}){
 if(!relay)return null
  const response=relayResponseCommandDetails({command,relay,accountName,view,finance})
 if(response)return response
 if(command.kind==='TopUpRelaySupplier'){
  const p=command.payload as {businessId:string;supplierId:string;amountFen:number},business=relay.businesses.find(b=>b.id===p.businessId),supplier=relay.catalog.suppliers.find(s=>s.id===p.supplierId)
  if(!business||!supplier)return null
  return <section className="confirmation-context"><h3>这笔自有资金先成为供应资产</h3><p>{accountName(business.accountId)}拟向{supplier.label}转入{moneyText(p.amountFen)}；自有可花减少，原供应资产等额增加。</p><p>这次转入本身不确认服务收入或供应消耗成本；原已发生成本仍保留，后续实际消费才计成本。供应资产不代替本期预算，也不能挪用客户保护资金；未用资产退回另行决定。</p></section>
 }
 if(command.kind==='StartRelayServicePeriod'){
  const p=command.payload as {businessId:string;customerIds:string[];supplierIds:string[];resources:string[];startAt:string;maxUnits:number;maxSupplierCostFen:number;supportMode:string;deploymentId?:string|null}
  const business=relay.businesses.find(b=>b.id===p.businessId),service=RELAY_JOBS.find(j=>j.id==='relay-service'),support=RELAY_JOBS.find(j=>j.id==='relay-support-'+p.supportMode)
  if(!business||!service||!support)return null
  const serviceEnd=relayAuditCompletion(p.startAt,service.durationDays),supportEnd=serviceEnd?relayAuditCompletion(serviceEnd,support.durationDays):null
  const clients=relay.customers.filter(c=>c.businessId===business.id),supportLabel=({guided:'集中支持',self:'限额自支持',assisted:'原代理辅助支持',delegated:'已明确授权的委托支持'} as Record<string,string>)[p.supportMode]
  return <section className="confirmation-context relay-service-terms">
   <h3>这期服务与原支持，一起留在日历</h3>
   <p>{accountName(business.accountId)} · 明确选择{p.customerIds.length}份原客户合同，供应按你选择的先后尝试，不自动增加备援。</p>
   <ul>{p.customerIds.map(id=>{const customer=clients.find(c=>c.id===id);return <li key={id}>{customer?'客户'+(clients.indexOf(customer)+1)+' · '+(customer.mode==='prepaid'?'充值制':'后付信用')+' · 原合同有效至'+customer.termEnd:'原客户现不可达，请返回调整'}</li>})}</ul>
   <p>供应顺序：{p.supplierIds.map(id=>relay.catalog.suppliers.find(s=>s.id===id)?.label??'原供应现不可达（'+id+'）').join(' → ')}。同故障域备援仍可能同时停服；许可与实际适配由原预览核验。</p>
   <p>{p.resources.map(id=>id==='player-production'?'本人实际服务与支持时间':courseResourceLabel(id,relay.resources,workers)).join('、')}；服务{p.startAt}—{serviceEnd??'完成日期待核对'}，{moneyText(service.costFen)}/{service.actionPoints}点/{service.durationDays}日。</p>
   <p>{supportLabel}：{serviceEnd??'支持开始日期待核对'}—{supportEnd??'支持完成日期待核对'}，{moneyText(support.costFen)}/{support.actionPoints}点/{support.durationDays}日。本次确认将同时预留这次支持，保存成功后不必再安排一次；员工工资和原代理服务费另计。</p>
   {p.deploymentId?<p>本次明确选择原部署{p.deploymentId}；仅沿已有许可，不能由这份服务确认扩大权限。</p>:null}
   <p>本期容量上限{p.maxUnits}单位，供应成本授权上限{moneyText(p.maxSupplierCostFen)}。上限不是已发生用量、实际成本或收入；供应预付仍是资产，客户未消费充值仍受保护。</p>
   <p>保存成功才是已安排，真实开工、计量、支持完成、确认收入与实收仍分别发生。中断或停止保留原成本、支持和旧账责任。</p>
  </section>
 }
 if(command.kind==='CollectRelayDue'){
  const payload=command.payload as {customerId:string},customer=relay.customers.find(c=>c.id===payload.customerId),business=relay.businesses.find(b=>b.id===customer?.businessId)
  if(!customer||!business)return null
  const number=relay.customers.filter(c=>c.businessId===business.id).findIndex(c=>c.id===customer.id)+1
  return <section className="confirmation-context"><h3>收好客户{number}的这笔原回款</h3><p>{accountName(business.accountId)}将收取已经到期的原应收{moneyText(customer.dueReceivableFen)}，对应客户{number}的原合同（{customer.signedAt}—{customer.termEnd}）。</p><p>本次覆盖客户{number}全部已到期原单，可能跨多个账期，不能全部归为眼前这一期。更正新增单据按自己的原到期日核对。</p><p>另有{moneyText(customer.balance.receivableFen-customer.dueReceivableFen)}原应收尚未到期，继续留在原账。回款不重复确认收入；原计量、独立复核和差额更正仍分别保留。</p></section>
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
