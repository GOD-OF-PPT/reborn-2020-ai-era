import {createCampaignRun,campaignRelay,campaignStory} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,type CommandPreview} from '../core/commands.ts'
import {addDays,quarterOf} from '../core/calendar.ts'
import {quarterLimit} from '../core/operations-calendar.ts'
import {actionBudget} from '../core/economy.ts'
import {hashValue} from '../core/hash.ts'
import {projectRelay} from '../core/relay-projection.ts'
import {projectStory} from '../core/story-projection.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import {StoryHarness} from './story-harness.ts'
import {remainingCapacity} from '../core/operations.ts'
import {RELAY_JOBS} from '../content/relay.ts'

export class RelayPrefixPolicyRefusal extends Error{
 readonly code:string
 readonly detail:unknown
 constructor(code:string,detail:unknown){super(code);this.name='RelayPrefixPolicyRefusal';this.code=code;this.detail=detail}
}
export interface RelayPrefixCallbacks{
 readonly attempted?:(command:CommandEnvelope)=>void
  readonly previewed?:(command:CommandEnvelope,preview:CommandPreview,run:GameRun)=>void
  readonly rejected?:(command:CommandEnvelope,reasons:readonly string[],run:GameRun)=>void
 readonly committed?:(run:GameRun,kind:string)=>void
 readonly milestone?:(name:string,run:GameRun)=>void
}

const deadline='2025-03-31'
const resource=['player-production']
const supplierIds=['cedar-direct','cedar-reseller','harbor-independent'] as const
const seeds=['t16-campaign-0','t16-campaign-1','t16-campaign-2'] as const
const finiteReasons=new Set([
  'INSUFFICIENT_AVAILABLE_FUNDS','INSUFFICIENT_CAPACITY','INSUFFICIENT_ACTION_POINTS','OVERDUE_OBLIGATION',
  'INSUFFICIENT_STARTUP_FUNDS','INITIAL_CAPACITY_REQUIRED','BUSINESS_QUALIFICATION_REQUIRED',
 'AGENT_FEE_BUFFER_REQUIRED','AGENT_SERVICE_FEE_OVERDUE','AGENT_INDEPENDENT_RISK_PENDING',
  'AGENT_SCOPE_NOT_AUTHORIZED','AGENT_CASH_LIMIT_EXCEEDED','AGENT_NOT_READY_FOR_BUSINESS','AGENT_DEPLOYMENT_NOT_ACTIVE',
 'RELAY_SUPPLY_PERMISSION_REQUIRED','RELAY_SUPPLY_NOT_READY','RELAY_CUSTOMER_CONTRACT_EXPIRED',
 'RELAY_RECHARGE_LIMIT','RELAY_NEW_CONTRACTS_PAUSED','RELAY_TRAFFIC_PAUSED',
])
export const isRelayPrefixFiniteRejection=(reasons:readonly string[])=>reasons.length>0&&reasons.every(code=>finiteReasons.has(code))
function check(value:unknown,message:string):asserts value{if(!value)throw Error(message)}
const now=(h:StoryHarness)=>h.run.timeline.cursor.date
function relay(h:StoryHarness){const result=projectRelay(h.run,campaignRelay);check(result,'PUBLIC_RELAY_REQUIRED');return result}

/** Values are already-public budget, occupancy and own available cash; no future outcome is an input. */
export function relayPrefixSlotReadiness(input:{startAt:string;serviceAvailablePoints:number;supportAvailablePoints:number;serviceCapacity:number;supportCapacity:number;availableFen:number}){
  check([input.serviceAvailablePoints,input.supportAvailablePoints,input.serviceCapacity,input.supportCapacity,input.availableFen].every(Number.isSafeInteger),'PUBLIC_RELAY_SLOT_INTEGER_FACTS_REQUIRED')
  const service=RELAY_JOBS.find(job=>job.id==='relay-service')!,support=RELAY_JOBS.find(job=>job.id==='relay-support-assisted')!
  check(service.durationDays===28&&service.actionPoints===1&&service.costFen===300000&&support.durationDays===4&&support.actionPoints===1&&support.costFen===100000,'ORIGINAL_RELAY_PREFIX_SERVICE_TERMS_REQUIRED')
  const to=addDays(input.startAt,service.durationDays),supportCompleteAt=addDays(to,support.durationDays)
  const sameQuarter=quarterOf(input.startAt)===quarterOf(to),requiredServicePoints=service.actionPoints+(sameQuarter?support.actionPoints:0),requiredFen=service.costFen+support.costFen
  const reasonCodes:string[]=[]
  if(input.serviceAvailablePoints<requiredServicePoints||!sameQuarter&&input.supportAvailablePoints<support.actionPoints)reasonCodes.push('INSUFFICIENT_ACTION_POINTS')
  if(input.serviceCapacity<1||input.supportCapacity<1)reasonCodes.push('INSUFFICIENT_CAPACITY')
  if(input.availableFen<requiredFen)reasonCodes.push('INSUFFICIENT_AVAILABLE_FUNDS')
  return {allowed:reasonCodes.length===0,reasonCodes,startAt:input.startAt,to,supportCompleteAt,
    service:{actionPoints:service.actionPoints,costFen:service.costFen,availablePoints:input.serviceAvailablePoints,capacity:input.serviceCapacity},
    support:{actionPoints:support.actionPoints,costFen:support.costFen,availablePoints:input.supportAvailablePoints,capacity:input.supportCapacity},requiredFen,sameQuarter}
}

export function inspectRelayPrefixSlot(run:GameRun,businessId:string,startAt:string){
  const publicRelay=projectRelay(run,campaignRelay),business=publicRelay?.businesses.find(row=>row.id===businessId)
  check(business,'PUBLIC_RELAY_BUSINESS_REQUIRED')
  const to=addDays(startAt,28),supportCompleteAt=addDays(to,4)
  return {...relayPrefixSlotReadiness({startAt,serviceAvailablePoints:actionBudget(run.economy,startAt).available,supportAvailablePoints:actionBudget(run.economy,to).available,
    serviceCapacity:remainingCapacity(run,'player-production',startAt,to),supportCapacity:remainingCapacity(run,'player-production',to,supportCompleteAt),availableFen:business.funds.availableFen}),
    businessId,accountId:business.accountId,availableFen:business.funds.availableFen,heldFen:business.funds.heldFen,prepaidLiabilityFen:business.funds.prepaidLiabilityFen}
}

export class RelayPrefixHarness extends StoryHarness{
 readonly callbacks:RelayPrefixCallbacks
 constructor(initial:GameRun,callbacks:RelayPrefixCallbacks){super({priorRun:initial});this.callbacks=callbacks}
 override command(kind:string,payload:unknown):CommandEnvelope{return {...super.command(kind,payload),commandId:'relay-prefix-'+this.run.revision}}
 override sendAs(kind:string,payload:unknown,id:string){
  const command={...this.command(kind,payload),commandId:id}
  this.callbacks.attempted?.(command)
   if(kind==='StartRelayServicePeriod'){
    const preview=previewCommand(this.run,command,this.codec.registry,this.run.actorId)
    this.callbacks.previewed?.(command,preview,this.run)
   }
  const result=evaluateCommand(this.run,command,this.codec.registry,this.run.actorId)
  if(result.status!=='proposed'){
    if(result.status==='rejected')this.callbacks.rejected?.(command,result.reasonCodes,this.run)
    if(result.status==='rejected'&&isRelayPrefixFiniteRejection(result.reasonCodes))throw new RelayPrefixPolicyRefusal('actual_public_command_precondition_refused',{date:now(this),revision:this.run.revision,command,result})
   throw Error('UNEXPECTED_RELAY_PREFIX_COMMAND_REFUSAL:'+JSON.stringify({date:now(this),command,result}))
  }
  const raw=this.codec.export(result.nextRun),next=this.codec.import(raw)
  check(this.codec.export(next)===raw,'RELAY_PREFIX_STRICT_CODEC_ROUNDTRIP_REQUIRED')
  this.commands.push(command);this.run=next;this.callbacks.committed?.(this.run,kind)
  return this.run
 }
}

/** Six fixed identities use this finite public policy, never a selected hidden outcome. */
export function buildRelayMatrixPrefix(backgroundId:string,seed:string,callbacks:RelayPrefixCallbacks={}){
 check(['technical_employee','content_employee'].includes(backgroundId),'ORIGINAL_RELAY_BACKGROUND_REQUIRED')
  check((seeds as readonly string[]).includes(seed),'ORIGINAL_RELAY_SEED_REQUIRED')
 const created=createCampaignRun({runId:'normal-relay-matrix-'+backgroundId+'-'+hashValue(seed).slice(0,8),actorId:'player',commandId:'create',backgroundId,seed})
 const h=new RelayPrefixHarness(created,callbacks),names=new Set<string>()
 const mark=(name:string)=>{check(!names.has(name),'DUPLICATE_RELAY_PREFIX_MILESTONE:'+name);names.add(name);callbacks.milestone?.(name,h.run)}
 const refuse=(code:string,detail:unknown):never=>{throw new RelayPrefixPolicyRefusal(code,{date:now(h),revision:h.run.revision,detail})}
 const at=(target:string)=>{
  if(target>deadline)refuse('fixed_prefix_deadline_exceeded',{requestedDate:target,deadline})
  check(target>=now(h),'RELAY_PREFIX_CANNOT_BACKDATE')
  return h.at(target,{work:false})
 }
 const points=(required:number)=>{
  for(let guard=0;actionBudget(h.run.economy,now(h)).available<required;guard++){
   check(guard<8,'RELAY_PREFIX_POINT_GUARD')
   const next=quarterLimit(now(h));at(next);mark('point-budget-moved-to-'+next)
  }
 }
 const send=(kind:string,payload:unknown)=>h.send(kind,payload)
 const waitJob=(id:string)=>{
  const job=h.run.operations!.jobs.find(j=>j.id===id);check(job,'ACTUAL_RELAY_JOB_REQUIRED')
  at(job.completeAt)
  const current=h.run.operations!.jobs.find(j=>j.id===id);check(current,'ACTUAL_RELAY_JOB_REQUIRED')
  if(current.status!=='completed')refuse('actual_relay_work_did_not_complete',{job:current})
 }
 mark('creation')
 // Employment is explicit in the inherited normal clock and stops after 2024-Q1.
 h.at('2024-01-01')
 at('2024-01-02');mark('payroll-through-2024-q1')
 send('OpenRelayStation',{capitalFen:3000000})
 const business=relay(h).businesses.find(b=>b.definitionId==='relay-station');check(business,'ACTUAL_RELAY_STATION_REQUIRED')
 mark('station-open')
 send('StartRelayPreparation',{businessId:business.id,preparation:'materials',resources:resource,startAt:now(h)})
 waitJob(relay(h).preparations.at(-1)!.jobId);mark('materials-completed')
 if(backgroundId==='content_employee'){
  send('StartRelayPreparation',{businessId:business.id,preparation:'basics',resources:resource,startAt:now(h)})
  waitJob(relay(h).preparations.at(-1)!.jobId);mark('basics-completed')
 }
 at('2024-01-16');check(relay(h).technicallyReady,'ACTUAL_TECHNICAL_PREPARATION_REQUIRED')
 at('2024-04-02')
 const apply=(supplierId:typeof supplierIds[number],attempt:number)=>{
  points(1)
  send('ApplyRelaySupply',{businessId:business.id,supplierId,resources:resource,startAt:now(h)})
  const application=relay(h).applications.at(-1)!;check(application.supplierId===supplierId,'ACTUAL_SUPPLIER_APPLICATION_REQUIRED')
  mark('application-'+supplierId+'-'+attempt+'-planned')
  waitJob(application.jobId);mark('application-'+supplierId+'-'+attempt+'-completed-unread')
  send('ReadRelaySupplyDecision',{applicationId:application.id})
  const result=relay(h).applications.find(a=>a.id===application.id)!;check(result.read&&result.approved!==null,'PUBLIC_SUPPLY_DECISION_MUST_BE_READ')
  mark('application-'+supplierId+'-'+attempt+'-read-'+(result.approved?'approved':'refused'))
  return result
 }
 // Every provider gets its first real decision before any rejected application is retried.
 for(const supplierId of supplierIds)apply(supplierId,1)
 for(const supplierId of supplierIds){
  for(let attempt=2;attempt<=3;attempt++){
   const previous=relay(h).applications.filter(a=>a.supplierId===supplierId).at(-1)!;check(previous.read,'PUBLIC_SUPPLY_DECISION_MUST_BE_READ')
   if(previous.approved)break
   const retryAt=addDays(previous.decisionAt,31);if(retryAt>now(h))at(retryAt)
   apply(supplierId,attempt)
  }
  const result=relay(h).applications.filter(a=>a.supplierId===supplierId).at(-1)!
  if(result.approved!==true)refuse('three_actual_supplier_application_refusals',{supplierId,applications:relay(h).applications.filter(a=>a.supplierId===supplierId)})
 }
 send('ActivateBusiness',{businessId:business.id});mark('station-active')
 for(const supplierId of supplierIds){
  const supply=relay(h).supplyOptions.find(s=>s.businessId===business.id&&s.supplierId===supplierId);check(supply,'PUBLIC_SUPPLY_OPTION_REQUIRED')
  if(supply.adapted)continue
  points(1)
  send('StartRelayAdapter',{businessId:business.id,supplierId,resources:resource,startAt:now(h)})
  const adapter=relay(h).adapters.at(-1)!;check(adapter.supplierId===supplierId,'ACTUAL_SUPPLIER_ADAPTER_REQUIRED')
  mark('adapter-'+supplierId+'-planned');waitJob(adapter.jobId);mark('adapter-'+supplierId+'-completed')
 }
 const supplied=relay(h)
 for(const supplierId of supplierIds)check(supplied.supplyOptions.some(s=>s.businessId===business.id&&s.supplierId===supplierId&&s.permitted&&s.adapted),'THREE_ACTUAL_PERMITTED_ADAPTED_SUPPLIERS_REQUIRED')
 mark('three-suppliers-ready')
 points(1)
 send('StartRelayMarketing',{businessId:business.id,segment:'local_merchants',mode:'paid',resources:resource,startAt:now(h)})
 const audience=relay(h).audiences.at(-1)!;check(audience.jobId,'ACTUAL_PAID_MARKETING_JOB_REQUIRED')
 mark('paid-marketing-planned');waitJob(audience.jobId);mark('paid-marketing-completed')
 send('SetRelayOffer',{businessId:business.id,offerKind:'low_margin',unitPriceFen:10})
 send('SetRelayOffer',{businessId:business.id,offerKind:'managed_support',unitPriceFen:6});mark('both-original-offers-set')
 if(now(h)<'2024-10-01')at('2024-10-01')
 points(1)
 send('StartHengxingDeployment',{businessId:business.id,resourceId:'player-production',expiresAt:'2025-12-31',initialCashLimitFen:500000,consent:true})
 const deployment=projectStory(h.run,campaignStory).deployments.at(-1)!;check(deployment.setupJob,'ACTUAL_DEPLOYMENT_WORK_REQUIRED')
 mark('approval-deployment-planned');at(deployment.setupJob.completeAt)
 const active=projectStory(h.run,campaignStory).deployments.find(d=>d.id===deployment.id)!
 if(active.lifecycle!=='active'||active.activeFrom===null)refuse('actual_approval_deployment_did_not_complete',{deployment:active})
 check(active.currentGrant?.level==='approval'&&!active.currentGrant.externalDelegation,'ORIGINAL_APPROVAL_SCOPE_REQUIRED')
 mark('approval-deployment-completed')
 // Capacity/AP/date are decided before the original customer is signed or charged.
 let startAt:string,supportCompleteAt:string
 for(let guard=0;;guard++){
  check(guard<8,'RELAY_PREFIX_SERVICE_SLOT_GUARD')
  startAt=addDays(now(h),1)
  const to=addDays(startAt,28);supportCompleteAt=addDays(to,4)
  if(supportCompleteAt>deadline)refuse('fixed_trial_support_deadline_exceeded',{startAt,supportCompleteAt,deadline})
   const slot=inspectRelayPrefixSlot(h.run,business.id,startAt)
   const fixedRefusals=slot.reasonCodes.filter(reason=>reason!=='INSUFFICIENT_ACTION_POINTS')
   if(fixedRefusals.length)refuse('public_trial_service_slot_refused',{slot,reasonCodes:fixedRefusals})
   if(slot.allowed)break
  at(quarterLimit(now(h)));mark('trial-budget-moved-to-'+now(h))
 }
 const prospects=relay(h).audiences.find(a=>a.id===audience.id)!,personId=prospects.members.find(id=>!relay(h).customers.some(c=>c.personId===id))
 if(!personId)refuse('no_actual_unconverted_relay_prospect',{audience:prospects})
 const offer=relay(h).offers.find(o=>o.businessId===business.id&&o.offerId==='managed_support')!;check(offer,'ACTUAL_MANAGED_SUPPORT_OFFER_REQUIRED')
 const ninetyDays=addDays(now(h),90),termEnd=ninetyDays<deadline?ninetyDays:deadline
 send('SignRelayCustomers',{businessId:business.id,audienceId:audience.id,offerId:offer.id,personIds:[personId],termEnd,mode:'prepaid',creditLimitFen:0})
 const customer=relay(h).customers.at(-1)!;mark('original-trial-customer-signed')
 if(customer.rechargeLimitFen<400000)refuse('actual_trial_recharge_quota_below_fixed_amount',{customerId:customer.id,rechargeLimitFen:customer.rechargeLimitFen,requestedFen:400000})
 send('RechargeRelayCustomer',{customerId:customer.id,amountFen:400000});mark('original-trial-customer-prepaid')
 send('StartRelayServicePeriod',{businessId:business.id,customerIds:[customer.id],supplierIds:['cedar-direct'],maxUnits:300000,maxSupplierCostFen:1200000,supportMode:'assisted',deploymentId:deployment.id,resources:resource,startAt})
 const period=relay(h).periods.at(-1)!;check(period.supportJob?.completeAt===supportCompleteAt,'ACTUAL_TRIAL_SUPPORT_DATES_REQUIRED')
 mark('original-assisted-trial-planned');at(period.from);mark('original-assisted-trial-started')
 at(period.to);mark('original-service-completed-support-started')
 at(supportCompleteAt);mark('original-assisted-support-completed')
 const finalRelay=relay(h),completed=finalRelay.periods.find(p=>p.id===period.id)!,finalDeployment=projectStory(h.run,campaignStory).deployments.find(d=>d.id===deployment.id)!
 if(completed.supportJob?.status!=='completed'||completed.feePostedAt===null||!finalDeployment.observedBusinessResult||!h.run.economy.ledger.metrics.some(m=>m.sourceEventId===period.id&&m.kind==='income'&&m.deltaFen>0))refuse('actual_managed_assisted_business_result_missing',{period:completed,deployment:finalDeployment})
 mark('actual-managed-assistance-business-result')
 if(now(h)<'2025-01-01')at('2025-01-01')
 const publicRelay=relay(h),publicStory=projectStory(h.run,campaignStory)
 for(const supplierId of supplierIds){
  const readPermission=publicRelay.applications.some(a=>a.businessId===business.id&&a.supplierId===supplierId&&a.read&&a.approved===true&&a.expiresAt!==null&&a.expiresAt>now(h))
  if(!readPermission||!publicRelay.supplyOptions.some(s=>s.businessId===business.id&&s.supplierId===supplierId&&s.permitted&&s.adapted))refuse('actual_supplier_readiness_expired_before_common_point',{supplierId,applications:publicRelay.applications.filter(a=>a.supplierId===supplierId)})
 }
 mark('common-prefix-ready')
 return {initial:h.initial,run:h.run,commands:h.commands,milestoneNames:[...names],publicRelay,publicStory}
}
