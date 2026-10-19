import {StoryHarness} from './story-harness.ts'
import {replayNormalRelay} from './normal-relay-scenario.ts'
import {addDays} from '../core/calendar.ts'
import {actionBudget} from '../core/economy.ts'
import {accountFunds,metricsFor} from '../core/ledger.ts'
import {operatingAccruals} from '../core/operations-accrual.ts'
import {STORY_CONTENT} from '../content/story.ts'
import type {GameRun} from '../core/run-types.ts'
/** Normal 2020 source plus extra real work. Original command IDs preserve already-created references. */
export function normalStoryPrepared(backgroundId:string,seed:string){
 // The template has already executed and codec-roundtripped this exact common
 // prefix. Branch from its first eligible state instead of executing it twice.
 let checkpoint:GameRun|null=null
 const template=replayNormalRelay(backgroundId,{seed,stopAfterServicePlan:true,onCommitted:run=>{if(checkpoint===null&&run.timeline.cursor.date>='2024-12-08'&&run.timeline.cursor.date<='2024-12-24'&&run.operations!.businesses.some(b=>b.definitionId==='relay-station')&&actionBudget(run.economy,run.timeline.cursor.date).available>=1)checkpoint=run}}),prefix:GameRun=checkpoint??template.initial,h=new StoryHarness({priorRun:prefix});let deployed=false,records=false,preparationInQ1=false
 const prepare=()=>{
  const date=h.run.timeline.cursor.date,b=h.run.operations!.businesses.find(b=>b.definitionId==='relay-station')
  if(!deployed&&b&&date>='2024-12-08'&&date<='2024-12-24'&&actionBudget(h.run.economy,date).available>=1){h.send('StartHengxingDeployment',{businessId:b.id,resourceId:'player-production',expiresAt:'2025-09-30',initialCashLimitFen:500000,consent:true});h.at(addDays(date,7),{work:false});deployed=true;const d=h.run.story!.deployments[0]!;if(h.run.timeline.cursor.date<='2024-12-24'&&actionBudget(h.run.economy,h.run.timeline.cursor.date).available>=1){h.send('StartAgentPreparation',{deploymentId:d.id,kind:'records',resourceId:'player-production'});h.at(addDays(h.run.timeline.cursor.date,7),{work:false});records=true}}
  if(deployed&&!preparationInQ1&&h.run.timeline.cursor.date==='2025-01-01'){const d=h.run.story!.deployments[0]!,kind=records?'drill':'records';h.send('StartAgentPreparation',{deploymentId:d.id,kind,resourceId:'player-production'});h.at(addDays(h.run.timeline.cursor.date,kind==='drill'?3:7),{work:false});preparationInQ1=true;records=true}
 }
 if(checkpoint!==null)prepare()
 for(const receipt of template.beforeService.receipts.slice(prefix.receipts.length,-1)){
  const p=JSON.parse(receipt.payloadSignature).payload;h.sendAs(receipt.kind,p,receipt.commandId);prepare()
 }
 if(!deployed)return normalStoryLatePrepared({...template,run:template.finishService()})
 const b=h.run.operations!.businesses.find(b=>b.definitionId==='relay-station')!,d=h.run.story!.deployments[0]!,original=template.beforeService.receipts.at(-1)!,p=JSON.parse(original.payloadSignature).payload
 h.sendAs('StartRelayServicePeriod',{...p,supportMode:'assisted',deploymentId:d.id},original.commandId);const period=h.run.relay!.periods.at(-1)!,support=h.run.operations!.jobs.find(j=>j.id===period.supportJobId)!
 h.at(support.completeAt,{work:false});const firstResult=h.codec.export(h.run)
 h.at('2025-04-01',{work:false});if(d.drillJobId===null&&!h.run.story!.deployments[0]!.drillJobId){h.send('StartAgentPreparation',{deploymentId:d.id,kind:'drill',resourceId:'player-production'});h.at(addDays(h.run.timeline.cursor.date,3),{work:false})}
 auditAndCollect(h,b.id,period.id);h.at('2025-07-01',{work:false});return result(h,b.id,d.id,firstResult,false)
}
function auditAndCollect(h:StoryHarness,businessId:string,periodId:string){const from=h.run.timeline.cursor.date;h.send('StartRelayAudit',{periodId,resources:['player-production'],startAt:from});h.at(addDays(from,3),{work:false});h.send('CorrectRelayPeriod',{periodId});for(const c of h.run.relay!.customers.filter(c=>c.businessId===businessId))if(h.run.relay!.receivables.some(r=>r.customerId===c.id&&r.dueAt<=h.run.timeline.cursor.date&&r.amountFen>r.collectedFen+r.reversedFen))h.send('CollectRelayDue',{customerId:c.id})}
function normalStoryLatePrepared(template:ReturnType<typeof replayNormalRelay>){
 // A real lack of Q4 capacity changes the strategy and dates, never the seed or past command history.
 const h=new StoryHarness({priorRun:template.run}),b=h.run.operations!.businesses.find(b=>b.definitionId==='relay-station')!;h.at('2025-04-01',{work:false});h.send('StartHengxingDeployment',{businessId:b.id,resourceId:'player-production',expiresAt:'2025-09-30',initialCashLimitFen:500000,consent:true});h.at('2025-04-08',{work:false});const d=h.run.story!.deployments[0]!;h.send('StartAgentPreparation',{deploymentId:d.id,kind:'records',resourceId:'player-production'});h.at('2025-04-15',{work:false});h.send('StartAgentPreparation',{deploymentId:d.id,kind:'drill',resourceId:'player-production'});h.at('2025-04-18',{work:false});for(const c of h.run.relay!.customers)h.send('RenewRelayCustomer',{customerId:c.id,termEnd:'2025-06-30',mode:c.mode,creditLimitFen:c.creditLimitFen});h.send('StartRelayServicePeriod',{businessId:b.id,customerIds:h.run.relay!.customers.map(c=>c.id),supplierIds:['cedar-direct'],maxUnits:300000,maxSupplierCostFen:1200000,supportMode:'assisted',deploymentId:d.id,resources:['player-production'],startAt:'2025-06-03'});h.at('2025-07-05',{work:false});return result(h,b.id,d.id,h.codec.export(h.run),true)
}
function result(h:StoryHarness,businessId:string,deploymentId:string,firstResult:string,lateCapacityFallback:boolean){const b=h.run.operations!.businesses.find(b=>b.id===businessId)!,use=h.run.story!.supportUses.find(u=>u.deploymentId===deploymentId)!,job=h.run.operations!.jobs.find(j=>j.id===use.jobId)!,action=h.run.economy.actions.find(a=>a.definition.id===job.actionId)!;return {h,b,deploymentId,firstResult,beforeExpansion:h.codec.export(h.run),lateCapacityFallback,result:{origin:h.run.origin,backgroundId:h.run.backgroundId,seed:h.run.seed,versions:h.run.versions,firstActualSupportComplete:job.completeAt,manualCostFen:use.manualCostFen,actualSupportCostFen:action.definition.costFen,manualDays:use.manualDays,actualDays:job.completeAt===addDays(job.startAt,4)?4:2,setupCostFen:h.run.story!.deployments.find(d=>d.id===deploymentId)!.setupCostFen,agentServiceFeesFen:h.run.story!.fees.filter(f=>f.deploymentId===deploymentId).reduce((n,f)=>n+f.amountFen,0),businessAvailableFen:accountFunds(h.run.economy.ledger,b.accountId).availableFen,quarterProfit:metricsFor(h.run.economy.ledger,b.accountId,b.id,'2025-01-01','2025-03-31'),unbilledCostFen:operatingAccruals(h.run,h.run.timeline.cursor.date).find(a=>a.businessId===b.id)!.amountFen,remainingActionPoints:actionBudget(h.run.economy,h.run.timeline.cursor.date).available,catalogRiskMode:STORY_CONTENT.classification}}}

/** Salary commitments, real partial debt payment and four used AP create the stress case. */
export function normalStoryPayrollReady(priorRun?:GameRun){
 const h=new StoryHarness({priorRun:priorRun??replayNormalRelay('technical_employee').run});h.at('2025-04-01',{work:false});const b=h.run.operations!.businesses.find(b=>b.route==='api_relay')!
 for(const definitionId of ['editor-lin','assistant-zhou'])h.send('HireWorker',{businessId:b.id,definitionId})
 h.send('StartHengxingDeployment',{businessId:b.id,resourceId:'player-production',expiresAt:'2025-09-30',initialCashLimitFen:500000,consent:true});h.at('2025-04-08',{work:false});const d=h.run.story!.deployments[0]!
 for(const c of h.run.relay!.customers)h.send('RenewRelayCustomer',{customerId:c.id,termEnd:'2025-06-30',mode:c.mode,creditLimitFen:c.creditLimitFen})
 h.send('StartRelayServicePeriod',{businessId:b.id,customerIds:h.run.relay!.customers.map(c=>c.id),supplierIds:['cedar-direct'],maxUnits:300000,maxSupplierCostFen:1200000,supportMode:'assisted',deploymentId:d.id,resources:['player-production'],startAt:'2025-06-03'});h.at('2025-07-05',{work:false})
 return {h,b,deploymentId:d.id}
}
/** Continue the intact payroll/support prefix; callers may share this earned prerequisite. */
export function normalStoryZeroResources(priorRun?:GameRun,preparedRun?:GameRun){
 const source=preparedRun??normalStoryPayrollReady(priorRun).h.run,h=new StoryHarness({priorRun:source}),b=h.run.operations!.businesses.find(b=>b.route==='api_relay')!,d=h.run.story!.deployments[0]!
 if(h.run.timeline.cursor.date!=='2025-07-05'||h.run.operations!.workers.length!==2||!h.run.story!.supportUses.some(u=>u.deploymentId===d.id&&h.run.operations!.jobs.some(j=>j.id===u.jobId&&j.status==='completed')))throw Error('NORMAL_STRESS_ACTUAL_PRECONDITIONS_REQUIRED')
 h.send('WorkQuarter',{});h.send('ResearchMarket',{definitionId:'market-overview'});h.send('SetHengxingAuthority',{deploymentId:d.id,businessId:b.id,level:'cross_flow',scopes:['relay_support','external_service_commitments'],cashLimitFen:100000,expiresAt:'2025-09-30',externalDelegation:true,consent:true});h.send('StopHengxingAuthority',{deploymentId:d.id});h.at('2025-09-30',{work:false})
 for(const o of h.run.economy.ledger.obligations.filter(o=>o.accountId===b.accountId&&o.remainingFen>0&&o.date<=h.run.timeline.cursor.date)){const available=accountFunds(h.run.economy.ledger,b.accountId).availableFen;if(available>0)h.send('PayObligation',{accountId:b.accountId,obligationId:o.id,amountFen:Math.min(available,o.remainingFen)})}
 if(accountFunds(h.run.economy.ledger,b.accountId).availableFen!==0||actionBudget(h.run.economy,h.run.timeline.cursor.date).available!==0)throw Error('NORMAL_STRESS_HAS_NOT_ACTUALLY_REACHED_ZERO_RESOURCES')
 return {h,b,deploymentId:d.id,incidentId:h.run.story!.incidents.find(c=>c.kind==='agent'&&c.deploymentIds.includes(d.id))!.id,zero:h.codec.export(h.run)}
}
