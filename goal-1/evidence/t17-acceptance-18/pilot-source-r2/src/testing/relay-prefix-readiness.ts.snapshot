import {campaignRelay,campaignStory,campaignRuntime,campaignOperations,campaignMarket} from '../application/campaign.ts'
import {projectRelay} from '../core/relay-projection.ts'
import {projectStory} from '../core/story-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {projectRun} from '../core/commands.ts'
import {addDays} from '../core/calendar.ts'
import {relayId} from '../core/relay.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'

export const RELAY_PREFIX_SUPPLIERS=['cedar-direct','cedar-reseller','harbor-independent'] as const
export const RELAY_PREFIX_DEADLINE='2025-03-31'

/** These are public accounting entries, not hidden demand or permission truth. */
export function relayPeriodFeeProof(entries:readonly {sourceEventId:string;businessId:string|null;kind:string;deltaFen:number;date:string}[],periodId:string,businessId:string,through:string){
 return entries.filter(entry=>entry.sourceEventId===periodId&&entry.businessId===businessId&&entry.kind==='income'&&entry.deltaFen>0&&entry.date<=through)
}

export function relayAdapterProof(adapter:{businessId:string;supplierId:string;jobId:string;kind:string;job:{status:string;completeAt:string}|null},application:{businessId:string;supplierId:string;jobId:string;read:boolean;approved:boolean|null},through:string){
 return adapter.businessId===application.businessId&&adapter.supplierId===application.supplierId&&application.read&&application.approved===true
  &&adapter.job?.status==='completed'&&adapter.job.completeAt<=through
  &&(adapter.kind==='migration'||adapter.kind==='initial_verification'&&adapter.jobId===application.jobId)
}

/** No action selection, hidden facts, random state, willingness or policy-builder dependency. */
export function relayPrefixPublicReadiness(run:GameRun,accepted:readonly CommandEnvelope[]){
 const relay=projectRelay(run,campaignRelay),story=projectStory(run,campaignStory)
 const workbench=projectWorkbench(run,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog),view=projectRun(run)
 if(!relay)throw Error('RELAY_PUBLIC_PROJECTION_REQUIRED')
 const date=view.date,business=relay.businesses.find(b=>b.definitionId==='relay-station'),station=relay.stations.find(s=>s.businessId===business?.id)
 const reasons:string[]=[]
 const check=(condition:unknown,reason:string)=>{if(!condition)reasons.push(reason)}
 check(date>='2025-01-01'&&date<=RELAY_PREFIX_DEADLINE,'COMMON_POINT_DATE_OUTSIDE_FIXED_WINDOW')
 check(view.phase==='playing'&&workbench.pause===null,'COMMON_POINT_NOT_PLAYING_OR_PUBLIC_PAUSE')
 check(business?.lifecycle==='operating'&&business.prepared&&station?.closedAt===null&&!station.trafficPaused,'SAME_STATION_NOT_OPERATING')
 check(relay.technicallyReady,'PUBLIC_TECHNICAL_PREPARATION_MISSING')
 const preparations=relay.preparations.filter(p=>p.businessId===business?.id)
 check(preparations.some(p=>p.kind==='materials'&&p.job?.status==='completed'&&p.job.completeAt<=date),'ACTUAL_MATERIALS_MISSING')
 if(run.backgroundId==='content_employee')check(preparations.some(p=>p.kind==='basics'&&p.job?.status==='completed'&&p.job.completeAt<=date),'CONTENT_BACKGROUND_ACTUAL_BASICS_MISSING')
 const suppliers=RELAY_PREFIX_SUPPLIERS.map(supplierId=>{
  const applications=relay.applications.filter(a=>a.businessId===business?.id&&a.supplierId===supplierId)
  const application=applications.findLast(a=>a.read&&a.approved===true&&a.expiresAt!==null&&a.decisionAt<=date&&date<a.expiresAt)
  const adapters=relay.adapters.filter(a=>a.businessId===business?.id&&a.supplierId===supplierId)
  const supply=relay.supplyOptions.find(s=>s.businessId===business?.id&&s.supplierId===supplierId)
  const adapted=!!application&&adapters.some(a=>relayAdapterProof(a,application,date))
  const ready=!!application&&application.job?.status==='completed'&&application.purpose==='licensed_service_aggregation'
   &&application.allowedSegments.includes('local_merchants')&&adapted&&supply?.permitted===true&&supply.adapted
  check(ready,'SUPPLIER_NOT_READ_VALID_AND_ACTUALLY_ADAPTED:'+supplierId)
  return {supplierId,ready,applications,adapters,supply: supply??null,validApplicationId:application?.id??null,
   expiresAt:application?.expiresAt??null,remainingDays:application?.expiresAt?Math.round((Date.parse(application.expiresAt)-Date.parse(date))/86400000):null,
   futureServiceWindowRevalidationRequired:true}
 })
 const audience=relay.audiences.find(a=>a.businessId===business?.id&&a.mode==='paid'&&a.segment==='local_merchants'&&a.completedAt!==null&&a.completedAt<=date&&a.job?.status==='completed'&&a.members.length>0)
 check(audience,'ACTUAL_PAID_LOCAL_MERCHANT_AUDIENCE_MISSING')
 for(const [kind,price,fee] of [['low_margin',10,0],['managed_support',6,50000]] as const)
  check(relay.offers.some(o=>o.businessId===business?.id&&o.offerId===kind&&o.unitPriceFen===price&&o.serviceFeeFen===fee),'FIXED_OFFER_MISSING:'+kind)
 const deployment=story.deployments.find(d=>d.businessId===business?.id&&d.accountId===business?.accountId&&d.lifecycle==='active'&&d.setupJob?.status==='completed'&&d.activeFrom!==null&&d.activeFrom<=date)
 const grant=deployment?.currentGrant
 check(deployment&&grant?.level==='approval'&&grant.scopes.includes('relay_support')&&!grant.externalDelegation&&grant.expiresAt>=date,'SAME_BUSINESS_APPROVAL_DEPLOYMENT_MISSING')
 const finance=workbench.finance.find(f=>f.accountId===business?.accountId)
 const serviceCommands=accepted.filter(c=>c.kind==='StartRelayServicePeriod')
 const witnesses=relay.periods.filter(p=>p.businessId===business?.id).map(period=>{
  const command=serviceCommands.find(c=>relayId(c.commandId,c.kind)===period.id)
  const payload=command?.payload as Record<string,unknown>|undefined
  const customers=period.customerIds.map(id=>relay.customers.find(c=>c.id===id))
  const support=deployment?.supportResults.find(r=>r.jobId===period.supportJobId&&r.mode==='assisted')
  const feeEntries=relayPeriodFeeProof(finance?.metrics??[],period.id,business?.id??'',date)
  const originalApproved=deployment?.grants.find(g=>g.level==='approval'&&g.createdAt<=period.to&&g.expiresAt>=addDays(period.to,4)&&g.scopes.includes('relay_support')&&!g.externalDelegation)
  const validSuppliers=period.supplierIds.every(id=>relay.applications.some(a=>a.businessId===business?.id&&a.supplierId===id&&a.read&&a.approved===true&&a.decisionAt<=period.from&&a.expiresAt!==null&&a.expiresAt>=period.to&&a.allowedSegments.includes('local_merchants')))
  const ready=!!command&&payload?.deploymentId===deployment?.id&&period.supportMode==='assisted'
   &&period.customerIds.length===1&&customers.every(c=>c&&c.businessId===business?.id&&c.originAudienceId===audience?.id&&c.initialMode==='prepaid'&&c.initialCreditLimitFen===0&&c.signedAt<=period.from&&addDays(c.termEnd,1)>=period.to&&c.terms.some(t=>t.offerId==='managed_support'&&t.unitPriceFen===6&&t.serviceFeeFen===50000))
   &&period.supplierIds.length===1&&period.supplierIds[0]==='cedar-direct'&&validSuppliers
   &&period.maxUnits===300000&&period.maxSupplierCostFen===1200000&&period.job?.status==='completed'
   &&period.supportJob?.status==='completed'&&period.supportJob.completeAt<=date&&period.supportJob.startAt===period.to&&period.supportJob.completeAt===addDays(period.to,4)
   &&period.to===addDays(period.from,28)&&period.stoppedAt===null&&period.feePostedAt!==null&&period.feePostedAt<=date
   &&support?.status==='completed'&&(support.actualCostFen<support.manualCostFen||support.completeAt<addDays(support.startAt,support.manualDays))
   &&!!originalApproved&&feeEntries.length>0&&deployment?.observedBusinessResult===true
  return {periodId:period.id,ready,period,customers,supportResult:support??null,approvalGrant:originalApproved??null,
   deploymentId:deployment?.id??null,commandId:command?.commandId??null,positivePeriodFeeEntries:feeEntries,
   recognizedPeriodServiceFeeFen:feeEntries.reduce((n,e)=>n+e.deltaFen,0),notCashCollectionOrNetProfit:true}
 })
 check(witnesses.some(w=>w.ready),'ACTUAL_SAME_BUSINESS_MANAGED_ASSISTED_POSITIVE_PERIOD_FEE_MISSING')
 const relevantFinance=workbench.finance.filter(f=>f.accountId==='personal'||f.accountId===business?.accountId)
 const overdue=relevantFinance.flatMap(f=>f.obligations.filter(o=>o.date<=date&&o.remainingFen>0))
 check(relevantFinance.every(f=>f.protectionShortfallFen===0&&f.commitmentShortfallFen===0)&&overdue.length===0,'PUBLIC_CASH_PROTECTION_OR_DUE_OBLIGATION_BLOCKS_READINESS')
 return {ready:reasons.length===0,reasons,date,phase:view.phase,runId:view.runId,revision:view.revision,businessId:business?.id??null,accountId:business?.accountId??null,
  business:business??null,station:station??null,technicallyReady:relay.technicallyReady,preparations,suppliers,audience:audience??null,
  offers:relay.offers.filter(o=>o.businessId===business?.id),deployment:deployment??null,businessResultWitnesses:witnesses,
  finance:relevantFinance,overdue,publicPause:workbench.pause,publicIncidents:story.incidents,actionPoints:view.budget,
  payroll:view.operations?.payroll??[],remainingOriginalDuties:'Trial customer balances, supplier assets/payables, maintenance, wages/living and agent fees remain. Readiness is not closure, delegated authority, routine authorization, positive profit or future service eligibility.'}
}
