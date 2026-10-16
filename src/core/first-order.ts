import { requireRule } from './errors.ts'
import { remainingCapacity, type OperationsRuntime } from './operations.ts'
import { actionBudget } from './economy.ts'
import { accountFunds, metricsFor } from './ledger.ts'
import type { OperatingContext } from './operations-types.ts'
import type { GameRun, RuleModel } from './run-types.ts'
import type { WorldRuntime } from './world.ts'

export interface FirstOrderPolicy { readonly id:string;readonly businessDefinitionId:string;readonly jobDefinitionId:string;readonly title:string;readonly classification:'fictional';readonly productionMode:'manual';readonly offeredFrom:string;readonly offeredTo:string;readonly startAt:string;readonly completeAt:string;readonly reviewAt:string;readonly durationDays:number;readonly actionPoints:number;readonly costFen:number;readonly priceFen:number;readonly capabilityId:string;readonly caseKey:string }
export function inspectFirstOrder(context:OperatingContext,date:string,policy:FirstOrderPolicy,world:WorldRuntime){
 requireRule(context.operations&&context.world,'OPERATIONS_NOT_CONFIGURED')
 requireRule(context.phase===undefined||context.phase==='playing','RUN_NOT_PLAYING')
 requireRule(date>=policy.offeredFrom&&date<=policy.offeredTo,'FIRST_ORDER_WINDOW_CLOSED')
 requireRule(!context.operations.contracts.some(c=>c.offerId===policy.id)&&!context.operations.offerDecisions.some(d=>d.offerId===policy.id),'FIRST_ORDER_ALREADY_HANDLED')
 const business=context.operations.businesses.find(b=>b.definitionId===policy.businessDefinitionId&&b.lifecycle!=='closed')
 requireRule(!business||['discovered','preparing','operating'].includes(business.lifecycle),'BUSINESS_REQUIRES_RESUME')
 requireRule(!business||business.prepared,'BUSINESS_NOT_PREPARED')
 requireRule(!business||!context.world.stoppedBindings.includes(business.id),'NEW_CONTRACTS_PAUSED')
 requireRule(world.capabilityReasons(context,'player',policy.capabilityId,date).length===0,'MANUAL_SKILL_REQUIRED')
 requireRule(accountFunds(context.economy.ledger,'personal').availableFen>=policy.costFen,'INSUFFICIENT_AVAILABLE_FUNDS')
 requireRule(!context.economy.ledger.obligations.some(o=>o.accountId==='personal'&&o.remainingFen>0&&o.date<=date),'OVERDUE_OBLIGATION')
 requireRule(actionBudget(context.economy,policy.startAt).available>=policy.actionPoints,'INSUFFICIENT_ACTION_POINTS')
 requireRule(remainingCapacity(context,'player-production',policy.startAt,policy.completeAt)>=1,'INSUFFICIENT_CAPACITY')
 if(business?.lifecycle!=='operating')requireRule(world.capacityAvailable(context,'player',date,1)>=1,'INITIAL_CAPACITY_REQUIRED')
 return {allowed:true,reasonCodes:[] as readonly string[],actionPoints:policy.actionPoints,upfrontCostFen:policy.costFen,releasedFen:0}
}
export function startFirstOrder(model:RuleModel,commandId:string,policy:FirstOrderPolicy,world:WorldRuntime,operations:OperationsRuntime):RuleModel{
 inspectFirstOrder({...model,cursor:model.timeline.cursor},model.timeline.cursor.date,policy,world)
 let next=model;let business=next.operations?.businesses.find(b=>b.definitionId===policy.businessDefinitionId&&b.lifecycle!=='closed')
 if(!business){next=operations.apply(next,{kind:'DiscoverBusiness',definitionId:policy.businessDefinitionId},`${commandId}:discover`);business=next.operations?.businesses.find(b=>b.definitionId===policy.businessDefinitionId&&b.lifecycle!=='closed')}
 requireRule(business,'BUSINESS_NOT_CREATED')
 if(business.lifecycle==='discovered'){next=operations.apply(next,{kind:'PrepareBusiness',businessId:business.id},`${commandId}:prepare`);business=operations.business(next,business.id)}
 if(business.lifecycle==='preparing')next=operations.apply(next,{kind:'ActivateBusiness',businessId:business.id},`${commandId}:activate`)
 return operations.apply(next,{kind:'AcceptContract',businessId:business.id,offerId:policy.id,resources:['player-production'],startAt:policy.startAt},`${commandId}:accept`)
}
export function projectFirstOrder(run:GameRun,policy:FirstOrderPolicy){
 const contract=run.operations?.contracts.find(c=>c.offerId===policy.id)
 const job=run.operations?.jobs.find(j=>j.id===contract?.jobId)
 const business=run.operations?.businesses.find(b=>b.id===contract?.businessId)
 const decision=run.operations?.offerDecisions.find(d=>d.offerId===policy.id)
 const balance=run.economy.ledger.contracts.find(c=>c.id===contract?.id)
 const paymentFen=contract?run.economy.ledger.transactions.filter(t=>t.sourceEventId===contract.id).flatMap(t=>t.lines).filter(line=>line.accountId==='personal'&&line.deltaFen>0).reduce((sum,line)=>sum+line.deltaFen,0):0
 const directCostFen=job?run.economy.ledger.metrics.filter(m=>m.referenceId===job.actionId&&m.kind==='cost').reduce((sum,m)=>sum+m.deltaFen,0):0
 let cash=0;const trace=run.economy.ledger.transactions.map(t=>{cash+=t.lines.filter(line=>line.accountId==='personal').reduce((sum,line)=>sum+line.deltaFen,0);return {transactionId:t.id,date:t.date,cashFen:cash}})
 const quarterTrace=trace.filter(row=>row.date<='2020-03-31')
 const quarterClosed=run.timeline.cursor.date>'2020-03-31'||(run.timeline.cursor.date==='2020-03-31'&&run.timeline.cursor.phase==='snapshot'&&run.timeline.cursor.priority===Number.MAX_SAFE_INTEGER)
 const status=contract?(contract.status==='production'?(job?.status==='completed'?'awaiting_submission':job?.status??'production'):contract.status):decision?.kind??(run.timeline.cursor.date<=policy.offeredTo?'available':'unavailable')
 const deadlineMissed=status==='awaiting_submission'&&run.timeline.cursor.date>policy.completeAt
 const nextStep=status==='available'?'choose_offer':status==='planned'?'advance_to_start':status==='running'?'advance_to_completion':status==='awaiting_submission'?(deadlineMissed?'cancel_or_keep_work':'submit_delivery'):status==='review'?'wait_for_customer':status==='delivered'?'wait_for_payment':null
 return {offerId:policy.id,title:policy.title,classification:policy.classification,productionMode:policy.productionMode,status,nextStep,deadlineMissed,decision:decision?{kind:decision.kind,date:decision.date}:null,businessId:business?.id??null,contractId:contract?.id??null,jobId:job?.id??null,dates:{replyBy:policy.offeredTo,startAt:policy.startAt,submitBy:policy.completeAt,earliestReviewAt:policy.reviewAt},terms:{costFen:policy.costFen,priceFen:policy.priceFen,actionPoints:policy.actionPoints},result:{confirmedIncomeFen:balance?.recognizedIncomeFen??0,paymentFen,directCostFen,netOrderFen:(balance?.recognizedIncomeFen??0)-directCostFen,businessPostedProfitFen:business?metricsFor(run.economy.ledger,business.accountId,business.id).profitFen:0},paidCaseAvailable:run.world?.preparations.some(p=>p.key===policy.caseKey&&p.sourceEventId===contract?.id)??false,cashFen:accountFunds(run.economy.ledger,'personal').cashFen,minimumCashFen:quarterTrace.length?Math.min(...quarterTrace.map(row=>row.cashFen)):0,quarterClosed,quarterEndCashFen:quarterClosed?(quarterTrace.at(-1)?.cashFen??0):null,cashTrace:trace,budget:actionBudget(run.economy,run.timeline.cursor.date)}
}
