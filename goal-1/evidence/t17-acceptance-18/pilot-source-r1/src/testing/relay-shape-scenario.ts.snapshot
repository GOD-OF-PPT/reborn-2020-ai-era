import {campaignRelay,campaignStory,campaignRuntime,campaignOperations,campaignMarket} from '../application/campaign.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {projectRelay} from '../core/relay-projection.ts'
import {projectStory} from '../core/story-projection.ts'
import {addDays} from '../core/calendar.ts'
import {relayPrefixPublicReadiness} from './relay-prefix-readiness.ts'
import {RELAY_CORE_CHECKPOINTS,RELAY_SHAPES,type RelayShape,type RelayShapeCallbacks} from './relay-shape-types.ts'
import type {StoryHarness} from './story-harness.ts'

export class RelayShapePolicyRefusal extends Error{
 readonly code:string
 readonly detail:unknown
 constructor(code:string,detail:unknown){super(code);this.name='RelayShapePolicyRefusal';this.code=code;this.detail=detail}
}

// Only actual, registered resource/permission failures are finite. Payload, identity,
// scheduling mistakes and unrecognised engine failures must stop the batch.
const finiteReasons=new Set([
 'INSUFFICIENT_ACTION_POINTS','INSUFFICIENT_AVAILABLE_FUNDS','INSUFFICIENT_CAPACITY','OVERDUE_OBLIGATION',
 'AGENT_INDEPENDENT_RISK_PENDING','AGENT_NOT_READY_FOR_BUSINESS','AGENT_SERVICE_FEE_OVERDUE',
 'AGENT_CASH_LIMIT_EXCEEDED','AGENT_SCOPE_NOT_AUTHORIZED','AGENT_DEPLOYMENT_NOT_ACTIVE',
 'AGENT_EXPANSION_NOT_AUTHORIZED','RELAY_SUPPLY_NOT_READY','RELAY_SUPPLY_PERMISSION_REQUIRED',
 'RELAY_CUSTOMER_CONTRACT_EXPIRED','RELAY_TRAFFIC_PAUSED','RELAY_NEW_CONTRACTS_PAUSED',
])
export const isRelayShapeFiniteRejection=(reasonCodes:readonly string[])=>reasonCodes.length>0&&reasonCodes.every(code=>finiteReasons.has(code))

function check(value:unknown,message:string):asserts value{if(!value)throw Error(message)}
const now=(h:StoryHarness)=>h.run.timeline.cursor.date
const relay=(h:StoryHarness)=>{const p=projectRelay(h.run,campaignRelay);check(p,'PUBLIC_RELAY_REQUIRED');return p}
const story=(h:StoryHarness)=>projectStory(h.run,campaignStory)
const resources=['player-production']
const supportDays={guided:7,self:14,assisted:4,delegated:2} as const

/** Closed contracts still consumed that real person's relay conversion. */
export function relayShapeFirstUnusedPerson(members:readonly string[],customers:readonly {personId:string}[]){
 const converted=new Set(customers.map(c=>c.personId))
 return members.find(personId=>!converted.has(personId))??null
}

/** Select only already-observed supplied records; an interrupted audit may be retried. */
export function relayShapeAuditableMeterIds(periodId:string,through:string,
 meters:readonly {id:string;periodId:string;date:string;supplierId:string|null}[],
 audits:readonly {meterId:string;jobId:string}[],
 jobs:readonly {jobId:string;job:{status:string}|null}[]){
 const status=new Map(jobs.map(row=>[row.jobId,row.job?.status]))
 return meters.filter(m=>m.periodId===periodId&&m.date<=through&&m.supplierId!==null&&!audits.some(a=>{
  if(a.meterId!==m.id)return false
  const state=status.get(a.jobId);check(state,'PUBLIC_RELAY_AUDIT_JOB_REQUIRED')
  return ['planned','running','completed'].includes(state)
 })).map(m=>m.id)
}

function send(h:StoryHarness,kind:string,payload:unknown){
 try{return h.send(kind,payload)}catch(error){
  if(error instanceof RelayShapePolicyRefusal)throw error
  // StoryHarness reports the actual evaluate result; a preview or an I/O error
  // alone never becomes evidence of an actual command rejection.
  let actual:{result?:{status?:string;reasonCodes?:unknown}}|null=null
  try{actual=JSON.parse(error instanceof Error?error.message:String(error))}catch{/* Unknown exceptions remain fatal. */}
  const reasons=actual?.result?.reasonCodes
  if(actual?.result?.status==='rejected'&&Array.isArray(reasons)&&reasons.every((r):r is string=>typeof r==='string')&&isRelayShapeFiniteRejection(reasons))
   throw new RelayShapePolicyRefusal('actual_public_command_precondition_refused',{date:now(h),revision:h.run.revision,kind,payload,reasonCodes:reasons})
  throw error
 }
}

function advance(h:StoryHarness,date:string){
 check(date>=now(h)&&date<='2025-03-31','RELAY_SHAPE_FIXED_DATE_WINDOW_REQUIRED')
 h.at(date,{work:false})
 check(now(h)===date&&h.run.timeline.cursor.phase==='snapshot','RELAY_SHAPE_ACTUAL_TARGET_NOT_REACHED')
}

function reviewDelegatedAuthority(h:StoryHarness,businessId:string,deploymentId:string,mark:(name:string)=>void){
 send(h,'SetHengxingAuthority',{deploymentId,businessId,level:'cross_flow',scopes:['relay_support','external_service_commitments'],
  cashLimitFen:500000,expiresAt:'2025-12-31',externalDelegation:true,consent:true})
 mark('separate-explicit-cross-flow-authority')
 advance(h,'2025-01-08');mark('actual-seven-day-authority-check')
 for(let guard=0;guard<12;guard++){
  const publicStory=story(h),cases=publicStory.incidents.filter(c=>c.businessIds.includes(businessId)&&c.deploymentIds.includes(deploymentId))
  const violation=cases.find(c=>c.verdict==='violation'&&c.resolvedAt===null)
  if(violation){
   const deployment=publicStory.deployments.find(d=>d.id===deploymentId);check(deployment,'PUBLIC_RELAY_DEPLOYMENT_REQUIRED')
   if(deployment.stoppedAt===null)send(h,'StopHengxingAuthority',{deploymentId})
   mark('finite-owned-authority-stopped')
   const current=story(h).incidents.find(c=>c.id===violation.id);check(current,'PUBLIC_RELAY_RISK_CASE_REQUIRED')
   const {contractIds,obligationIds,jobIds}=current.currentLiabilities
   send(h,'DeclareRiskLiabilities',{incidentId:current.id,snapshot:{contractIds,obligationIds,jobIds}})
   mark('finite-original-risk-liabilities-declared')
   throw new RelayShapePolicyRefusal('actual_independent_violation_finite_stop',{date:now(h),incident:story(h).incidents.find(c=>c.id===current.id),externalControlRestored:false})
  }
  const pending=cases.find(c=>{
   const signals=c.signals.filter(s=>s.source!=='system_report'&&s.date<=now(h)),job=c.jobs.investigate
   return c.resolvedAt===null&&signals.length>0&&!(c.stage==='normal'&&['normal','ordinary'].includes(c.verdict)&&job?.status==='completed'&&signals.every(s=>s.date<=job.completeAt))
  })
  if(!pending){
   mark(cases.some(c=>c.signals.some(s=>s.source!=='system_report'))?'actual-public-assessment-permits-original-grant':'no-public-signal-after-authority-check')
   const grant=story(h).deployments.find(d=>d.id===deploymentId)?.currentGrant
   check(grant?.level==='cross_flow'&&grant.externalDelegation&&grant.expiresAt>='2025-02-11','ORIGINAL_RELAY_CROSS_FLOW_GRANT_NOT_RETAINED')
   return
  }
  const job=pending.jobs.investigate
  if(job?.status==='completed')check(job.result!==null,'UNEXPECTED_COMPLETED_RELAY_INVESTIGATION_WITHOUT_RESULT')
  if(job?.status==='completed'&&job.result!==null&&(pending.stage==='investigating'||pending.verdict==='unknown')){
   mark('actual-independent-investigation-completed')
   send(h,'ConfirmRiskAssessment',{incidentId:pending.id});mark('actual-independent-risk-assessment-confirmed');continue
  }
  if(job?.status==='running'){
   if(job.completeAt>'2025-01-11')throw new RelayShapePolicyRefusal('actual_public_risk_no_fixed_investigation_window',{date:now(h),incident:pending})
   advance(h,job.completeAt);continue
  }
  const laterSignal=job?.status==='completed'&&pending.signals.some(s=>s.source!=='system_report'&&s.date>job.completeAt)
  if(job&&job.status!=='interrupted'&&!laterSignal)throw new RelayShapePolicyRefusal('actual_public_risk_not_cleared',{date:now(h),incident:pending})
  if(addDays(now(h),3)>'2025-01-11')throw new RelayShapePolicyRefusal('actual_public_risk_no_fixed_investigation_window',{date:now(h),incident:pending})
  send(h,'StartRiskTask',{incidentId:pending.id,kind:'investigate',accountId:publicStory.businesses.find(b=>b.id===businessId)!.accountId,resourceId:'player-production'})
  mark('actual-paid-independent-investigation-started')
 }
 throw Error('RELAY_SHAPE_PUBLIC_RISK_REVIEW_GUARD')
}

/** The original 48 shapes use public facts and real commands from one earned P1. */
export function runRelayShape(h:StoryHarness,shape:RelayShape,callbacks:RelayShapeCallbacks={}):void{
 const mark=(name:string)=>callbacks.milestone?.(name,h.run)
 try{
  check(RELAY_SHAPES.some(s=>s.id===shape.id&&s.supplierId===shape.supplierId&&s.offerKind===shape.offerKind&&s.unitPriceFen===shape.unitPriceFen&&s.customerMode===shape.customerMode&&s.supportMode===shape.supportMode),'ORIGINAL_RELAY_SHAPE_REQUIRED')
  check(h.run.origin==='normal'&&['technical_employee','content_employee'].includes(h.run.backgroundId)&&['t16-campaign-0','t16-campaign-1','t16-campaign-2'].includes(h.run.seed),'ORIGINAL_RELAY_SHAPE_IDENTITY_REQUIRED')
  check(now(h)==='2025-01-01','ORIGINAL_RELAY_P1_JAN1_REQUIRED')
  const readiness=relayPrefixPublicReadiness(h.run,h.commands)
  check(readiness.ready,'VERIFIED_PUBLIC_RELAY_P1_REQUIRED:'+JSON.stringify(readiness.reasons))
  const initial=relay(h),business=readiness.business,deployment=readiness.deployment
  check(business&&deployment&&readiness.audience,'PUBLIC_RELAY_P1_BINDINGS_REQUIRED')
  const oldCustomerIds=initial.customers.map(c=>c.id),oldPeriodIds=initial.periods.map(p=>p.id),oldMeterIds=initial.meters.map(m=>m.id)
  mark(RELAY_CORE_CHECKPOINTS[0])
  if(shape.supportMode==='delegated')reviewDelegatedAuthority(h,business.id,deployment.id,mark)
  advance(h,'2025-01-11')
  const current=relay(h),audience=current.audiences.find(a=>a.id===readiness.audience!.id)
  check(audience&&audience.mode==='paid'&&audience.segment==='local_merchants'&&audience.completedAt!==null,'ORIGINAL_PUBLIC_RELAY_AUDIENCE_REQUIRED')
  const personId=relayShapeFirstUnusedPerson(audience.members,current.customers)
  if(personId===null)throw new RelayShapePolicyRefusal('actual_no_unused_public_relay_customer',{audience})
  const offer=current.offers.find(o=>o.businessId===business.id&&o.offerId===shape.offerKind&&o.unitPriceFen===shape.unitPriceFen&&o.serviceFeeFen===(shape.offerKind==='low_margin'?0:50000))
  check(offer,'ORIGINAL_PUBLIC_RELAY_OFFER_REQUIRED')
  send(h,'SignRelayCustomers',{businessId:business.id,audienceId:audience.id,offerId:offer.id,personIds:[personId],termEnd:'2025-03-31',
   mode:shape.customerMode,creditLimitFen:shape.customerMode==='postpaid'?2000000:0})
  const customer=relay(h).customers.find(c=>!oldCustomerIds.includes(c.id)&&c.personId===personId)
  check(customer&&customer.monthlyUnits===60000,'ACTUAL_SINGLE_RELAY_CUSTOMER_REQUIRED')
  mark(RELAY_CORE_CHECKPOINTS[1])
  const expectedRecharge=Number(BigInt(customer.monthlyUnits)*BigInt(shape.unitPriceFen)*4n/3n)+offer.serviceFeeFen
  check(customer.rechargeLimitFen===expectedRecharge&&expectedRecharge===(shape.offerKind==='low_margin'?800000:530000),'ORIGINAL_PUBLIC_RELAY_RECHARGE_QUOTA_REQUIRED')
  if(shape.customerMode==='prepaid')send(h,'RechargeRelayCustomer',{customerId:customer.id,amountFen:customer.rechargeLimitFen})
  mark(RELAY_CORE_CHECKPOINTS[2])
  if(shape.supplierId==='cedar-reseller')send(h,'TopUpRelaySupplier',{businessId:business.id,supplierId:shape.supplierId,amountFen:400000})
  const supply=relay(h).supplyOptions.find(s=>s.businessId===business.id&&s.supplierId===shape.supplierId)
  check(supply?.permitted&&supply.adapted,'ORIGINAL_PUBLIC_RELAY_SUPPLY_REQUIRED')
  const application=relay(h).applications.findLast(a=>a.businessId===business.id&&a.supplierId===shape.supplierId&&a.read&&a.approved===true&&a.expiresAt!==null&&a.decisionAt<='2025-01-12'&&a.expiresAt>='2025-02-09'&&a.allowedSegments.includes(customer.segment))
  if(!application)throw new RelayShapePolicyRefusal('actual_no_full_read_supplier_permission_window',{supplierId:shape.supplierId,date:now(h)})
  mark(RELAY_CORE_CHECKPOINTS[3])
  send(h,'StartRelayServicePeriod',{businessId:business.id,customerIds:[customer.id],supplierIds:[shape.supplierId],maxUnits:300000,maxSupplierCostFen:1200000,
   supportMode:shape.supportMode,deploymentId:['assisted','delegated'].includes(shape.supportMode)?deployment.id:null,resources,startAt:'2025-01-12'})
  const period=relay(h).periods.find(p=>!oldPeriodIds.includes(p.id)&&p.customerIds.length===1&&p.customerIds[0]===customer.id)
  check(period?.job&&period.supportJob&&period.from==='2025-01-12'&&period.to==='2025-02-09'&&period.supportJob.completeAt===addDays(period.to,supportDays[shape.supportMode]),'ACTUAL_FIXED_RELAY_JOBS_REQUIRED')
  mark(RELAY_CORE_CHECKPOINTS[4])
  advance(h,period.to)
  const served=relay(h).periods.find(p=>p.id===period.id);check(served,'ACTUAL_RELAY_PERIOD_REQUIRED')
  mark(RELAY_CORE_CHECKPOINTS[5])
  if(served.job?.status!=='completed'){
   check(served.job?.status==='interrupted'||served.job?.status==='cancelled','UNEXPECTED_RELAY_SERVICE_NOT_COMPLETED')
   throw new RelayShapePolicyRefusal('actual_relay_service_not_completed',{period:served})
  }
  advance(h,period.supportJob.completeAt)
  const supported=relay(h).periods.find(p=>p.id===period.id);check(supported?.supportJob&&supported.feePostedAt!==null&&supported.compensatedAt!==null,'ACTUAL_RELAY_SUPPORT_CLOSE_REQUIRED')
  mark(RELAY_CORE_CHECKPOINTS[6])
  if(supported.supportJob.status!=='completed'){
   check(['interrupted','cancelled'].includes(supported.supportJob.status),'UNEXPECTED_RELAY_SUPPORT_NOT_COMPLETED')
   throw new RelayShapePolicyRefusal('actual_relay_support_not_completed',{period:supported})
  }
  advance(h,'2025-02-24')
  const beforeAudit=relay(h),auditableIds=relayShapeAuditableMeterIds(period.id,now(h),beforeAudit.meters,beforeAudit.audits,beforeAudit.auditJobs)
  if(auditableIds.length===0)throw new RelayShapePolicyRefusal('actual_no_supplied_meters_to_audit',{periodId:period.id,meters:beforeAudit.meters.filter(m=>m.periodId===period.id)})
  send(h,'StartRelayAudit',{periodId:period.id,resources,startAt:'2025-02-24'});mark('actual-paid-period-audit-started')
  advance(h,'2025-02-27')
  const audited=relay(h),newAudits=audited.audits.filter(a=>auditableIds.includes(a.meterId)),auditJobIds=[...new Set(newAudits.map(a=>a.jobId))]
  check(newAudits.length===auditableIds.length&&auditJobIds.length===1,'ACTUAL_NEW_PERIOD_AUDIT_SCOPE_REQUIRED')
  const auditJob=audited.auditJobs.find(a=>a.jobId===auditJobIds[0]);check(auditJob?.job,'ACTUAL_RELAY_AUDIT_JOB_REQUIRED')
  if(auditJob.job.status!=='completed'){
   check(['interrupted','cancelled'].includes(auditJob.job.status),'UNEXPECTED_RELAY_AUDIT_NOT_COMPLETED')
   throw new RelayShapePolicyRefusal('actual_relay_audit_not_completed',{auditJob})
  }
  check(newAudits.every(a=>a.completedAt==='2025-02-27'&&a.actualUnits!==null)&&audited.meters.filter(m=>auditableIds.includes(m.id)).every(m=>m.auditedUnits!==null),'ACTUAL_COMPLETED_PUBLIC_AUDIT_REQUIRED')
  mark(RELAY_CORE_CHECKPOINTS[7])
  send(h,'CorrectRelayPeriod',{periodId:period.id})
  check(relay(h).corrections.filter(c=>auditableIds.includes(c.meterId)).length===auditableIds.length,'ACTUAL_SEPARATE_RELAY_CORRECTIONS_REQUIRED')
  mark(RELAY_CORE_CHECKPOINTS[8])
  advance(h,'2025-03-14')
  if(relay(h).customers.find(c=>c.id===customer.id)!.dueReceivableFen>0)send(h,'CollectRelayDue',{customerId:customer.id})
  const final=relay(h)
  check(oldCustomerIds.every(id=>final.customers.some(c=>c.id===id))&&oldPeriodIds.every(id=>final.periods.some(p=>p.id===id))&&oldMeterIds.every(id=>final.meters.some(m=>m.id===id)),'ORIGINAL_RELAY_P1_HISTORY_REMOVED')
  const unpaid=final.receivables.filter(r=>r.customerId===customer.id&&r.dueAt<=now(h)&&r.amountFen>r.collectedFen+r.reversedFen)
  if(unpaid.length>0)throw new RelayShapePolicyRefusal('actual_target_relay_due_receivable_remains',{customerId:customer.id,unpaid})
  const finance=projectWorkbench(h.run,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog).finance.find(f=>f.accountId===business.accountId)
  check(finance,'PUBLIC_RELAY_FINAL_ACCOUNT_REQUIRED')
  mark(RELAY_CORE_CHECKPOINTS[9])
  const due=finance.obligations.filter(o=>o.date<=now(h)&&o.remainingFen>0)
  if(due.length>0||finance.protectionShortfallFen>0||finance.commitmentShortfallFen>0)
   throw new RelayShapePolicyRefusal('actual_relay_due_or_protection_shortfall_remains',{date:now(h),finance,due})
 }catch(error){
  if(error instanceof RelayShapePolicyRefusal)mark('finite-policy-refusal')
  throw error
 }
}
