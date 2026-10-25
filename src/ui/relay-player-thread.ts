import {quarterOf} from '../core/calendar.ts'
import type {GamePanelProps} from './game-types.ts'
import type {OpeningFocus,PlayerThreadView} from './player-thread.ts'
import {relaySceneProgress} from './relay-scene-progress.ts'
import {resolveRelaySceneTarget,relayTargetEntity,type RelaySceneTarget,type RelaySceneContext} from './relay-scene-target.ts'
import {relayJourneyAction,relayJourneyScene} from './relay-journey.ts'

type Input=Pick<GamePanelProps,'view'|'features'>
export type RelayOpeningFocus=Extract<OpeningFocus,{kind:'relay'}>
type Scene=Pick<PlayerThreadView,'stage'|'object'|'title'|'line'|'detail'|'outcome'|'inspect'|'resultRefs'|'command'|'secondaryCommand'|'wait'>
export function relaySceneContext(p:Input,accountId:string):RelaySceneContext{return {runId:p.view.runId,accountId,operations:p.view.operations}}
export function relayBusinessTarget(p:Input,businessId:string):Extract<RelaySceneTarget,{kind:'business'}>|null{
 const v=p.features.relay,bs=v?.businesses.filter(b=>b.id===businessId)??[],ss=v?.stations.filter(s=>s.businessId===businessId)??[]
 if(bs.length!==1||ss.length!==1)return null
 const target:Extract<RelaySceneTarget,{kind:'business'}>={kind:'business',runId:p.view.runId,accountId:bs[0]!.accountId,businessId,stationId:ss[0]!.id}
 return resolveRelaySceneTarget(v,target,relaySceneContext(p,target.accountId)).reason?null:target
}

/** A captured target is complete already; this does not fill missing station or owner fields. */
export function relayFocusFor(p:Input,target:RelaySceneTarget|null=null,accountId?:string):RelayOpeningFocus{
 return {runId:p.view.runId,kind:'relay',accountId:accountId??target?.accountId??'personal',entityId:target?relayTargetEntity(target):null,relayTarget:target,...(target?{businessId:target.businessId}:{})}
}
export function resolveRelayFocus(p:Input,f:RelayOpeningFocus):{focus:RelayOpeningFocus;reason:string|null}{
 const bad=(reason:string)=>({focus:f,reason}),t=f.relayTarget
 if(f.runId!==p.view.runId)return bad('这份服务关注来自另一段人生，请重新选择。')
 if(p.view.accounts.filter(a=>a.accountId===f.accountId).length!==1)return bad('原服务账户不可达或不唯一，请重新选择；没有换到另一账户。')
 if(t===null)return f.entityId===null&&f.accountId==='personal'&&f.businessId===undefined?{focus:f,reason:null}:bad('先选择这次服务所属的中转站；入口没有绑定另一主体。')
 const resolved=resolveRelaySceneTarget(p.features.relay,t,relaySceneContext(p,f.accountId))
 if(resolved.reason)return bad(resolved.reason)
 if(f.businessId!==t.businessId||f.entityId!==relayTargetEntity(t))return bad('原服务关注与完整对象身份不一致，请重新选择。')
 return {focus:f,reason:null}
}
function resolved(p:Input,f:RelayOpeningFocus){return resolveRelaySceneTarget(p.features.relay,f.relayTarget,relaySceneContext(p,f.accountId))}
export function relayFocusQuarter(p:Input,f:RelayOpeningFocus):string|null{
 if(f.relayTarget===null)return p.features.workbench.quarter
 const r=resolved(p,f),t=f.relayTarget
 const date=t.kind==='period'?r.meter?.date??r.job?.startAt??r.period?.createdAt:t.kind==='customer'?r.customer?.signedAt:t.kind==='audience'?r.audience?.createdAt:t.kind==='application'?r.application?.appliedAt:r.station?.createdAt
 return date?quarterOf(date):null
}
export function relayFocusOpen(p:Input,f:RelayOpeningFocus):boolean{
 const r=resolved(p,f),t=f.relayTarget,v=p.features.relay
 if(r.status!=='valid'||!t||!v)return false
 if(t.kind==='application')return !r.application!.read&&r.application!.job?.status==='completed'||['planned','running'].includes(r.application!.job!.status)
 if(r.job)return ['planned','running'].includes(r.job.status)
 if(t.kind==='audience')return r.audience!.completedAt===null&&!!r.audience!.job&&['planned','running'].includes(r.audience!.job.status)
 if(t.kind==='customer')return r.customer!.closedAt===null||r.customer!.balance.prepaidFen>0||r.customer!.balance.receivableFen>0
 if(t.kind==='business')return r.business!.lifecycle!=='closed'
 const period=r.period!,sourceIds=new Set([period.id,...v.meters.filter(m=>m.periodId===period.id).map(m=>m.id)])
 return ['planned','running','support','settling'].includes(period.status)||[period.job,period.supportJob].some(j=>j&&['planned','running'].includes(j.status))
  ||v.receivables.some(row=>sourceIds.has(row.sourceId)&&row.amountFen>row.collectedFen+row.reversedFen)
  ||v.meters.some(m=>m.periodId===period.id&&m.auditedUnits!==null&&m.auditedUnits!==m.reportedUnits&&m.correctionId===null)
}
export function relayFocusResultDate(p:Input,f:RelayOpeningFocus):string|null{
 const r=resolved(p,f),t=f.relayTarget,v=p.features.relay
 if(r.status!=='valid'||!t||!v)return null
 if(r.application)return r.application.read?r.application.decisionAt:r.job&&['cancelled','interrupted'].includes(r.job.status)?r.job.releasedAt:null
 if(r.job)return r.job.status==='completed'?r.job.completeAt:r.job.releasedAt
 if(r.meter){const m=r.meter,correction=v.corrections.find(c=>c.id===m.correctionId),audit=v.audits.filter(a=>a.meterId===m.id&&a.completedAt!==null).at(-1);return correction?.date??audit?.completedAt??m.date}
 if(r.period){const sourceIds=new Set([r.period.id,...v.meters.filter(m=>m.periodId===r.period!.id).map(m=>m.id)]),invoices=new Set(v.receivables.filter(i=>sourceIds.has(i.sourceId)).map(i=>i.id));const dates=[r.period.stoppedAt,r.period.feePostedAt,r.period.compensatedAt,...v.corrections.filter(c=>v.meters.some(m=>m.id===c.meterId&&m.periodId===r.period!.id)).map(c=>c.date),...(p.features.workbench.finance.find(a=>a.accountId===f.accountId)?.transactions.filter(tx=>tx.amountFen>0&&invoices.has(tx.sourceId)).map(tx=>tx.date)??[])].filter((date):date is string=>date!==null&&date<=p.view.date);return dates.sort().at(-1)??null}
 if(r.customer)return [r.customer.closedAt,r.customer.signedAt,...(p.features.workbench.finance.find(a=>a.accountId===f.accountId)?.transactions.filter(tx=>tx.contractId===r.customer!.id).map(tx=>tx.date)??[])].filter((date):date is string=>date!==null&&date<=p.view.date).sort().at(-1)??null
 if(r.audience)return r.audience.completedAt
 return r.station?.closedAt??r.business?.history.filter(h=>['operating','closed','winding_down'].includes(h.state)).at(-1)?.date??null
}
export function relayPlayerScene(p:Input,f:RelayOpeningFocus):Scene{
 const progress=relaySceneProgress(p.features.relay,p.view.date,f.relayTarget,relaySceneContext(p,f.accountId))!,r=resolved(p,f)
 const object=r.period?`${r.period.from}—${r.period.to}的服务约定`:r.customer?'这位客户的服务与原账':r.audience?'这次获客的实际回信':r.application?'供应方的申请回信':f.relayTarget?'本站的服务单与接线盒':'桌边的中转服务资料'
 const decision=!progress.historical&&!progress.wait&&!progress.command?relayJourneyScene(relayJourneyAction({...p,accountId:f.accountId},f.relayTarget)):null
 return {stage:'relay-'+progress.phase,object,title:decision?.title??progress.title,line:decision?.line??progress.line,detail:decision?(r.audience||r.customer?progress.line:''):progress.choice.line===progress.line?'':progress.choice.line,outcome:progress.outcome,resultRefs:progress.resultRefs,inspect:{screen:'relay',label:progress.choice.label,target:{accountId:f.accountId,relayTarget:f.relayTarget,openRecord:true,...(progress.recordId?{recordId:progress.recordId}:{})}},...(progress.command?{command:{...progress.command,label:progress.choice.label}}:{}),...(progress.wait?{wait:progress.wait}:{})}
}

/** New public IDs follow only a committed original receipt, never a candidate or a balance delta. */
export function relayFocusFromSaved(previous:Input,current:Input,kind:string,body:Record<string,unknown>,existing?:RelayOpeningFocus|null):RelayOpeningFocus|null{
 const old=previous.features.relay,v=current.features.relay,last=current.view.receipts.at(-1)
 if(!old||!v||previous.view.runId!==current.view.runId||current.view.revision!==previous.view.revision+1||current.view.saveStatus!=='saved'||current.view.hasCandidate||current.view.readOnly||current.view.phase!=='playing'||last?.kind!==kind||last.revisionAfter!==current.view.revision)return null
 const added=<T extends {id:string}>(before:readonly T[],after:readonly T[],match:(row:T)=>boolean):T|null=>{const rows=after.filter(row=>!before.some(o=>o.id===row.id)&&match(row));return rows.length===1?rows[0]!:null}
 const base=(businessId:string)=>{const businesses=v.businesses.filter(b=>b.id===businessId),stations=v.stations.filter(s=>s.businessId===businessId);return businesses.length===1&&stations.length===1?{runId:current.view.runId,accountId:businesses[0]!.accountId,businessId,stationId:stations[0]!.id}:null}
 const keep=(businessId:string)=>existing&&existing.businessId===businessId&&!resolveRelayFocus(previous,existing).reason?existing:null
 let target:RelaySceneTarget|null=null
 if(kind==='OpenRelayStation'){const b=added(old.businesses,v.businesses,b=>b.definitionId==='relay-station'),identity=b?base(b.id):null;if(identity)target={...identity,kind:'business'}}
 if(kind==='ApplyRelaySupply'){const a=added(old.applications,v.applications,a=>a.businessId===body.businessId&&a.supplierId===body.supplierId),identity=a?base(a.businessId):null;if(a&&identity)target={...identity,kind:'application',applicationId:a.id}}
 if(kind==='StartRelayMarketing'){const a=added(old.audiences,v.audiences,a=>a.businessId===body.businessId&&a.mode===body.mode&&a.segment===body.segment),identity=a?base(a.businessId):null;if(a&&identity)target={...identity,kind:'audience',audienceId:a.id}}
 if(kind==='StartRelayServicePeriod'){
  const same=(a:readonly string[],b:unknown)=>Array.isArray(b)&&a.length===b.length&&a.every(id=>b.includes(id))
  const period=added(old.periods,v.periods,row=>row.businessId===body.businessId&&row.from===body.startAt&&row.maxUnits===body.maxUnits&&row.maxSupplierCostFen===body.maxSupplierCostFen&&row.supportMode===body.supportMode&&same(row.customerIds,body.customerIds)&&same(row.supplierIds,body.supplierIds)),identity=period?base(period.businessId):null
  if(period&&identity)target={...identity,kind:'period',periodId:period.id}
 }
 if(['StartRelayAudit','CorrectRelayPeriod','StopRelayPeriod','CorrectRelayUsage'].includes(kind)){
  const audit=kind==='CorrectRelayUsage'?v.audits.find(a=>a.id===body.auditId):null,meter=v.meters.find(m=>m.id===(body.meterId??audit?.meterId)),period=v.periods.find(p=>p.id===(body.periodId??meter?.periodId)),identity=period?base(period.businessId):null
  const changed=period&&(kind==='StartRelayAudit'?v.audits.some(a=>!old.audits.some(o=>o.id===a.id)&&v.meters.some(m=>m.id===a.meterId&&m.periodId===period.id&&(body.meterId===undefined||m.id===body.meterId))):kind==='StopRelayPeriod'?period.stoppedAt!==null&&old.periods.some(o=>o.id===period.id&&o.stoppedAt===null):v.corrections.some(c=>!old.corrections.some(o=>o.id===c.id)&&v.meters.some(m=>m.id===c.meterId&&m.periodId===period.id&&(body.meterId===undefined||m.id===body.meterId))))
  if(period&&identity&&changed){const selected=keep(period.businessId);if(selected?.relayTarget?.kind==='period'&&selected.relayTarget.periodId===period.id)return selected;target={...identity,kind:'period',periodId:period.id,...(meter?{meterId:meter.id}:{})}}
 }
 if(['CollectRelayDue','CollectRelayReceivable','RechargeRelayCustomer','RefundRelayBalance','CloseRelayCustomer','RenewRelayCustomer'].includes(kind)){
  const receivable=v.receivables.find(r=>r.id===body.receivableId),customer=v.customers.find(c=>c.id===(body.customerId??receivable?.customerId)),identity=customer?base(customer.businessId):null
  const prior=customer?old.customers.find(c=>c.id===customer.id):undefined
  const changed=customer&&prior&&(kind==='CollectRelayDue'||kind==='CollectRelayReceivable'?v.receivables.some(r=>r.customerId===customer.id&&r.collectedFen>(old.receivables.find(o=>o.id===r.id)?.collectedFen??r.collectedFen)):kind==='RefundRelayBalance'?v.refunds.some(r=>r.customerId===customer.id&&!old.refunds.some(o=>o.id===r.id)):kind==='RechargeRelayCustomer'?customer.balance.prepaidFen>prior.balance.prepaidFen:kind==='CloseRelayCustomer'?customer.closedAt!==prior.closedAt:customer.termEnd!==prior.termEnd||customer.mode!==prior.mode||customer.creditLimitFen!==prior.creditLimitFen)
  if(customer&&identity&&changed){const selected=keep(customer.businessId),t=selected?.relayTarget;if(t?.kind==='period'&&v.periods.some(p=>p.id===t.periodId&&p.customerIds.includes(customer.id))||t?.kind==='customer'&&t.customerId===customer.id)return selected!;target={...identity,kind:'customer',customerId:customer.id}}
 }
 if(['InterruptJob','RescheduleJob'].includes(kind)){
  const before=previous.view.operations?.jobs.find(j=>j.id===body.jobId),after=current.view.operations?.jobs.find(j=>j.id===body.jobId)
  if(before&&after&&JSON.stringify(before)!==JSON.stringify(after)){
   const periods=v.periods.filter(p=>p.jobId===body.jobId||p.supportJobId===body.jobId||v.auditJobs.some(a=>a.jobId===body.jobId&&a.periodIds.includes(p.id))),period=periods[0],identity=periods.length===1&&period?base(period.businessId):null
   if(period&&identity){const selected=keep(period.businessId);if(selected?.relayTarget?.kind==='period'&&selected.relayTarget.periodId===period.id)return selected;target={...identity,kind:'period',periodId:period.id,jobId:String(body.jobId)}}
  }
 }
 if(['StartRelayPreparation','StartRelayAdapter','SignRelayCustomers','SetRelayOffer','StartRelayRequote','TopUpRelaySupplier','RefundRelaySupplier','PauseRelayTraffic','ResumeRelayTraffic','StopRelayStation','AcknowledgeRelayMarket','FundBusiness','ActivateBusiness','PauseBusiness','ResumeBusiness','WindDownBusiness','CloseBusiness'].includes(kind)&&typeof body.businessId==='string'){
  const identity=base(body.businessId);if(identity){const selected=keep(body.businessId);if(selected)return selected}
 }
 if(kind==='ReadRelaySupplyDecision'){const a=v.applications.find(a=>a.id===body.applicationId&&a.read&&!old.applications.find(o=>o.id===a.id)?.read),identity=a?base(a.businessId):null;if(a&&identity){const selected=keep(a.businessId);if(selected?.relayTarget?.kind==='application'&&selected.relayTarget.applicationId===a.id)return selected;target={...identity,kind:'application',applicationId:a.id}}}
 if(!target)return null
 const focus=relayFocusFor(current,target);return resolveRelayFocus(current,focus).reason?null:focus
}
