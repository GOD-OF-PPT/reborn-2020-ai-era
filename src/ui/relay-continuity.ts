import type {GamePanelProps} from './game-types.ts'
import type {RelayServicePaperState,RelayPaperSupportState} from './RelayServicePaper.tsx'
import {resolveRelaySceneTarget,type RelaySceneTarget} from './relay-scene-target.ts'
import {relaySceneProgress,relayAuditableMeters} from './relay-scene-progress.ts'
import {moneyText} from './game-text.ts'
import {relayId} from '../core/relay.ts'

type Input=Pick<GamePanelProps,'view'|'features'|'accountId'>
export function relayMoneyFor(p:Input,target:RelaySceneTarget|null|undefined):string|null{
 if(!target)return null
 const r=resolveRelaySceneTarget(p.features.relay,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})
 if(r.status!=='valid'||!r.business)return null
 const f=r.business.funds
 return (r.business.company?'企业可花':'个人可花')+moneyText(f.availableFen)+' · 本账户客户未消费保护'+moneyText(f.prepaidLiabilityFen)
  +(f.receivableFen>0?' · 原客户应收'+moneyText(f.receivableFen):'')
  +(f.supplierPrepaidFen>0?' · 供应资产'+moneyText(f.supplierPrepaidFen):'')
  +(f.payableFen>0?' · 原应付'+moneyText(f.payableFen):'')
}
/** Art receives only saved public facts; its shape cannot disclose an unread or unaudited result. */
export function relayPaperFor(p:Input,target:RelaySceneTarget|null|undefined):RelayServicePaperState|undefined{
 if(target===undefined)return undefined
 const v=p.features.relay,r=resolveRelaySceneTarget(v,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})
 if(r.status==='invalid'||!v)return undefined
 if(target===null)return {phase:'preparation',state:'choice',heading:''}
 const progress=relaySceneProgress(v,p.view.date,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})!
 const base={heading:'',...(progress.historical?{historical:true}:{})}
 if(r.job&&['cancelled','interrupted'].includes(r.job.status))return {...base,phase:'result',state:'stopped',dateLabel:r.job.releasedAt??r.job.startAt,line:target.kind==='application'?'原申请已停止 · 未读结果仍不揭示':target.kind==='audience'?'原获客已停止 · 没有新名单':'这份原任务已停止 · 已耗投入保留'}
 if(target.kind==='period'&&r.meter){
  const m=r.meter,known=m.auditedUnits!==null,pending=known&&m.auditedUnits!==m.reportedUnits&&m.correctionId===null
  return {...base,phase:'audit',state:m.correctionId?'corrected':known?'reviewed':'reported',dateLabel:m.date,line:'这条原报告 '+m.reportedUnits+' · '+(known?'原复核实计 '+m.auditedUnits:'实计待独立复核'),...(pending?{responsibility:'这条原记录的已知差额尚待更正'}:{})}
 }
 if(target.kind==='period'&&r.job){
  const j=r.job,dates=j.startAt+'—'+j.completeAt
  if(r.audit)return {...base,phase:'audit',state:j.status==='planned'?'planned':j.status==='running'?'running':'reviewed',dateLabel:dates,line:j.status==='completed'?'这次原批次已实际复核 '+r.audit.meterCount+'条':'只覆盖这次原批次的 '+r.audit.meterCount+'条已有计量'}
  const support=j.definitionId.startsWith('relay-support-'),state=j.status==='planned'?'planned':j.status==='running'?'running':'ended'
  return {...base,phase:'service',state,dateLabel:dates,line:(support?'这份原支持':'这份原服务')+(j.status==='completed'?'已实际完成':j.status==='planned'?'已预留，尚未开工':'仍在进行'),...(support?{support:j.status==='completed'?'completed' as const:state==='planned'?'planned' as const:'running' as const}:{})}
 }
 if(r.application){
  const a=r.application
  return {...base,phase:'permission',state:!a.read?'unread':a.approved===true?'approved':a.approved===false?'declined':'read-pending',dateLabel:a.job?.status==='planned'?'申请开工 '+a.job.startAt:a.job?.status==='running'?'审查反馈 '+a.job.completeAt:a.read?'亲读原回信':'待亲手拆信',line:!a.read?'未读回信 · 结果尚未揭示':a.approved===true?'本局原许可 · 用途与适配另核':a.approved===false?'原申请未获许可 · 成本保留':'原回信仍待核对'}
 }
 if(r.audience){
  if(r.audience.job&&['planned','running'].includes(r.audience.job.status))return {...base,phase:'preparation',state:r.audience.job.status==='planned'?'planned':'running',dateLabel:r.audience.job.startAt+'—'+r.audience.job.completeAt,line:'原获客尚在安排中 · 名单未形成'}
  return {...base,phase:'commitment',state:'choice',dateLabel:r.audience.completedAt??r.audience.createdAt,line:r.audience.completedAt===null?'原获客尚待核对':r.audience.members.length+'位实际潜客 · 签约另定'}
 }
 if(target.kind==='customer'&&r.customer)return {...base,phase:'commitment',state:r.customer.balance.prepaidFen>0?'funded':'agreed',dateLabel:'原合同至 '+r.customer.termEnd,line:'客户'+(v.customers.filter(customer=>customer.businessId===r.customer!.businessId).findIndex(customer=>customer.id===r.customer!.id)+1)+'的原合同',paymentLabel:'未消费预款 '+moneyText(r.customer.balance.prepaidFen)+' · 仍属客户保护',...(r.customer.dueReceivableFen>0?{responsibility:'原到期款 '+moneyText(r.customer.dueReceivableFen)+'待明确收取'}:{})}
 if(r.period){
  const period=r.period,job=period.job,support=period.supportJob
  const supportState:RelayPaperSupportState=support?.status==='planned'?'planned':support?.status==='running'?'running':support?.status==='completed'?'completed':support?'stopped':'pending'
  const supportLabel=support?.status==='planned'?'原支持 '+support.startAt+'—'+support.completeAt:support?.status==='running'?'原支持仍在进行 · '+support.completeAt:support?.status==='completed'?'原支持已实际完成':support?'原支持已停止 · 按原记录核对':'原支持尚待核对'
  const meters=v.meters.filter(m=>m.periodId===period.id),sources=new Set([period.id,...meters.map(m=>m.id)]),invoices=v.receivables.filter(i=>sources.has(i.sourceId)),due=invoices.filter(i=>i.dueAt<=p.view.date).reduce((n,i)=>n+i.amountFen-i.collectedFen-i.reversedFen,0),unpaid=invoices.reduce((n,i)=>n+i.amountFen-i.collectedFen-i.reversedFen,0),collected=invoices.reduce((n,i)=>n+i.collectedFen,0),corrections=meters.filter(m=>m.auditedUnits!==null&&m.auditedUnits!==m.reportedUnits&&m.correctionId===null).length
  const responsibility=corrections?corrections+'条已知差额仍待更正':due>0?'原到期应收 '+moneyText(due)+'待明确收取':r.business!.funds.payableFen>0?'本站原应付 '+moneyText(r.business!.funds.payableFen)+'仍保留':null
  const labels={...base,support:supportState,supportLabel,...(responsibility?{responsibility}:{}),dateLabel:period.from+'—'+period.to}
  const receipt=p.view.receipts.at(-1),invoicesById=new Set(invoices.map(i=>i.id)),collectionId=receipt?relayId(receipt.commandId,receipt.kind):null
  // The public receipt exposes commandId, not private transactionIds. Correlate
  // actual public ledger rows with the canonical original operation identity.
  const receivedNow=receipt&&collectionId&&['CollectRelayDue','CollectRelayReceivable'].includes(receipt.kind)&&receipt.revisionAfter===p.view.revision?(p.features.workbench.finance.find(f=>f.accountId===target.accountId)?.transactions.filter(tx=>invoicesById.has(tx.sourceId)&&tx.id===(receipt.kind==='CollectRelayDue'?relayId('collect',collectionId,tx.sourceId):relayId('collect',collectionId))&&tx.amountFen>0).reduce((n,tx)=>n+tx.amountFen,0)??0):0
  if(receivedNow>0){
   const unreviewed=relayAuditableMeters(v,period.id).length
   return {...labels,phase:'result',state:'received',line:corrections?'这次原款已收 · 已知差额仍待更正':unreviewed?'这次原款已收 · '+unreviewed+'条记录仍待独立复核':period.status==='closed'?'本期按原账结束 · 企业与客户余额另列':'这次已经实际收到 · 服务与复核仍分别继续',paymentLabel:'本次收到本期原单 '+moneyText(receivedNow)+(unpaid>0?' · 原单未收 '+moneyText(unpaid):'')}
  }
  if(progress.phase==='audit-waiting')return {...labels,phase:'audit',state:v.auditJobs.some(a=>a.periodIds.includes(period.id)&&a.job?.status==='running')?'running':'planned',line:'原报告可查 · 复核尚未完成'}
  if(progress.phase==='audit-ready'||progress.phase==='correction')return {...labels,phase:'audit',state:corrections?'reviewed':period.auditedMeters>0?'reviewed':period.meterCount>0?'reported':'unmetered',line:corrections?'独立复核已揭示差额':period.auditedMeters>0?'已有原复核 · 后来计量仍另核':'报告不代替独立实计'}
  if(progress.phase==='collection'||progress.phase==='settling'||period.status==='closed')return {...labels,phase:'result',state:unpaid>0?'receivable':period.status==='closed'?'closed':'receivable',line:period.status==='closed'?'本期按原账结束 · 企业与客户余额另列':progress.phase==='settling'?'原应收尚待到期 · 实际到账另核':'原单与实际收款分别发生',paymentLabel:unpaid>0?'本期原单未收 '+moneyText(unpaid)+(collected>0?' · 原单累计实收 '+moneyText(collected):''):collected>0?'本期原单累计实收 '+moneyText(collected):'原支持与用量收入留在原账'}
  return {...labels,phase:'service',state:job?.status==='planned'?'planned':job?.status==='running'?'running':period.stoppedAt!==null||job?.status==='interrupted'||job?.status==='cancelled'?'stopped':'ended',line:'已记录 '+period.observedDays+'日 · 报告 '+period.reportedUnits+'单位'}
 }
 const preparation=v.preparations.find(a=>a.businessId===target.businessId&&a.job&&['planned','running'].includes(a.job.status)),application=v.applications.find(a=>a.businessId===target.businessId&&!a.read&&a.job&&['planned','running','completed'].includes(a.job.status)),adapter=v.adapters.find(a=>a.businessId===target.businessId&&a.job&&['planned','running'].includes(a.job.status))
 if(application&&!preparation)return {...base,phase:'permission',state:'unread',...(application.job?.completeAt?{dateLabel:application.job.completeAt}:{}),line:application.job?.status==='completed'?'原审查已完成 · 等亲手读信':'原申请已安排 · 不预告结果'}
 if(preparation?.job||adapter?.job){const job=preparation?.job??adapter!.job!;return {...base,phase:'preparation',state:job.status==='planned'?'planned':'running',dateLabel:job.startAt+'—'+job.completeAt,line:preparation?.kind==='basics'?'技术基础的真实准备':preparation?'申请材料的真实准备':'已许可供应的实际适配'}}
 if(r.business!.lifecycle==='closed'||r.business!.lifecycle==='winding_down'||r.business!.lifecycle==='paused'||r.station!.trafficPaused){const f=r.business!.funds,due=v.customers.some(c=>c.businessId===target.businessId&&c.dueReceivableFen>0);return {...base,phase:'result',state:r.business!.lifecycle==='closed'?'closed':'stopped',line:'停止与旧记录分别保留',...(f.supplierPrepaidFen>0||f.receivableFen>0?{paymentLabel:'供应资产 '+moneyText(f.supplierPrepaidFen)+' · 原应收 '+moneyText(f.receivableFen)}:{}),...(f.prepaidLiabilityFen>0||f.payableFen>0||due?{responsibility:'原客户保护余额、应付或到期原款仍需处理'}:{})}}
 return {...base,phase:'preparation',state:r.business!.lifecycle==='operating'?'ready':'choice',line:r.business!.lifecycle==='operating'?'本站已启用 · 客户与服务另定':'技术、材料、许可与资本分别核对'}
}
