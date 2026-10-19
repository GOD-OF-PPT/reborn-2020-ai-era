import {requireRule} from './errors.ts'
import type {CommandView} from './commands.ts'
export function intentBusinesses(m:CommandView,p:Record<string,unknown>):string[]{
 const ids=new Set<string>();if(typeof p.businessId==='string')ids.add(p.businessId)
 if(typeof p.accountId==='string')for(const b of m.operations?.businesses.filter(b=>b.accountId===p.accountId)??[])ids.add(b.id)
 if(typeof p.deploymentId==='string'){const d=m.story?.deployments.find(d=>d.id===p.deploymentId);if(d)ids.add(d.businessId)}
 const co=m.course?.cohorts.find(c=>c.id===p.cohortId),course=m.course?.courses.find(c=>c.id===(p.courseId??co?.courseId));if(course)ids.add(course.businessId)
 const channel=m.video?.channels.find(c=>c.id===p.channelId);if(channel)ids.add(channel.businessId)
 const period=m.relay?.periods.find(v=>v.id===p.periodId);if(period)ids.add(period.businessId)
 const invoice=m.relay?.receivables.find(v=>v.id===p.receivableId),customer=m.relay?.customers.find(c=>c.id===(p.customerId??invoice?.customerId));if(customer)ids.add(customer.businessId)
 const delivery=m.deepseek?.deliveries.find(d=>d.id===p.deliveryId),contractId=p.contractId??delivery?.contractId
 for(const c of [...(m.operations?.contracts??[]),...(m.video?.contracts??[]),...(m.deepseek?.contracts??[])])if(c.id===contractId)ids.add('businessId' in c?c.businessId:m.video?.channels.find(ch=>ch.id===c.channelId)?.businessId??'')
 const order=m.market?.orders.find(o=>o.id===p.orderId);if(order)for(const b of m.operations?.businesses.filter(b=>b.accountId===order.accountId)??[])ids.add(b.id)
 const j=m.operations?.jobs.find(j=>j.id===p.jobId);if(j)ids.add(j.businessId);const w=m.operations?.workers.find(w=>w.id===p.workerId);if(w)ids.add(w.sponsorBusinessId)
 return [...ids].filter(Boolean)
}
const cleanup=new Set(['FundBusiness','PayObligation','PauseBusiness','WindDownBusiness','CloseBusiness','DismissWorker','CancelAction','InterruptJob','CancelContract','SubmitDelivery','StartCourseStage','StartCourseRecovery','StartCourseRefresh','RefundCourseLearners','PauseNewEnrollment','StopCourseSales','RetireCourse','CollectRelayDue','CollectRelayReceivable','RefundRelayBalance','RefundRelaySupplier','StartRelayAudit','CorrectRelayUsage','CorrectRelayPeriod','PauseRelayTraffic','StopRelayPeriod','StopRelayStation','CloseRelayCustomer','AcknowledgeRelayMarket','SubmitEcoDelivery','CollectEcoReceivable','CancelEcoContract','StopEcosystemService','SubmitVideoCommission','ExitVideoCommission','CollectVideoSettlement','UnlistVideo','StopHengxingAuthority','InterruptStoryWork','AcknowledgeStoryPause','StartRiskTask','ConfirmRiskAssessment','DeclareRiskLiabilities','ResolveRiskCase','ShareRiskFindings','DeclineRiskClaim','PayUnverifiedProcessingFee','CancelStockOrder'])
export function guardStoryCommand(m:CommandView,kind:string,raw:unknown){
 if(!m.story||kind==='RunRoutineStep')return
 const p=typeof raw==='object'&&raw!==null?raw as Record<string,unknown>:{},targets=intentBusinesses(m,p),taken=m.story.incidents.filter(c=>m.story!.jobs.some(j=>j.id===c.takeoverJobId&&j.kind==='takeover'&&j.status==='completed')).flatMap(c=>c.businessIds)
 const order=m.market?.orders.find(o=>o.id===p.orderId),sell=['PlaceStockOrder','PlanStockOrder','SubmitStockOrder','AmendStockOrder'].includes(kind)&&(p.side??order?.side)==='sell'
 if(targets.some(id=>taken.includes(id)))requireRule(cleanup.has(kind)||sell,'EXTERNAL_MANAGER_HOLDS_NEW_BUSINESS_CONTROL')
 const relayInvoice=m.relay?.receivables.find(r=>r.id===p.receivableId),delivery=m.deepseek?.deliveries.find(d=>d.id===p.deliveryId),id=kind==='CollectRelayDue'?p.customerId:kind==='CollectRelayReceivable'?relayInvoice?.customerId:kind==='CollectEcoReceivable'?delivery?.contractId:kind==='CollectVideoSettlement'?p.settlementId:null
 if(typeof id==='string')requireRule(!m.story.incidents.some(c=>c.kind==='external_claim'&&c.verdict==='unknown'&&c.contractIds.includes(id)),'ORIGINAL_COUNTERPARTY_IDENTITY_NOT_VERIFIED')
}
