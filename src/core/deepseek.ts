import {addDays,quarterOf} from './calendar.ts'
import {actionBudget} from './economy.ts'
import {accountFunds} from './ledger.ts'
import {requireRule} from './errors.ts'
import {hashValue} from './hash.ts'
import {DEEPSEEK_CONTENT} from '../content/deepseek.ts'
import {deepseekParametersSchema,type DeepseekParameters,type DeepseekState,type DeepseekContext as Context,type DeepseekIntent as Intent,type DeepseekContract} from './deepseek-schema.ts'
import {EquityRuntime,EQUITY_KINDS} from './equity.ts'
import {deepseekId as did,dsState as state,dsPatch as patch,dsLog as log,dsPost as post,dsFact as fact,dsReveal as reveal,dsPass as pass,dsNumber as num,dsString as str,dsIds as ids,dsAllowed as allowed,dsDone as done,dsRatio as ratio,dsEvent as event,dsQueue as queue} from './deepseek-state.ts'
import {assertDeepseek} from './deepseek-validation.ts'
import type {OperationsRuntime} from './operations.ts'
import type {VideoRuntime} from './video.ts'
import type {OperatingContext,OperatingModel} from './operations-types.ts'
import type {RuleModel,GameRun} from './run-types.ts'
import type {ScheduledEvent} from './timeline.ts'
import type {RunOperation} from './content-types.ts'
export class DeepseekRuntime{
 readonly operations:OperationsRuntime;readonly video:VideoRuntime;readonly equity:EquityRuntime;readonly catalog:typeof DEEPSEEK_CONTENT&DeepseekParameters;readonly hash:string;readonly capabilities:(m:OperatingContext,id:string,date:string)=>readonly string[]
 constructor(operations:OperationsRuntime,video:VideoRuntime,capabilities:(m:OperatingContext,id:string,date:string)=>readonly string[],parameters:unknown={proposalAcceptBps:8500,deliveryAcceptBps:8500,invitationAuthorityBps:10000,financingConsentBps:8500,negotiationAcceptBps:9000,buyerAcceptBps:6500,governanceAcceptBps:6500}){const p=deepseekParametersSchema.safeParse(parameters);requireRule(p.success,'INVALID_DEEPSEEK_PARAMETERS');this.operations=operations;this.video=video;this.capabilities=capabilities;this.catalog={...DEEPSEEK_CONTENT,...p.data};this.hash=hashValue(this.catalog);this.equity=new EquityRuntime(operations,p.data)}
 initial():DeepseekState{return {version:this.catalog.version,catalogHash:this.hash,counterfactualEnabledAt:null,preparations:[],adapters:[],outreaches:[],leads:[],contracts:[],deliveries:[],collections:[],refunds:[],invitations:[],negotiations:[],agreements:[],rounds:[],governance:[],exits:[],policies:[]}}
 validate(run:GameRun){assertDeepseek(this,run)}
 business(m:Context,id:string){const b=this.operations.business(m,id);requireRule(b.definitionId==='ecosystem-service','ECOSYSTEM_SERVICE_BUSINESS_REQUIRED');return b}
 cancellationCompensation(c:Pick<DeepseekContract,'cancelledAt'|'deliveredAt'|'supportPostedAt'|'priceFen'>){return c.cancelledAt===null&&c.deliveredAt!==null&&c.supportPostedAt===null?ratio(c.priceFen,1000,10000):0}
 contract(m:Context,id:string){const c=state(m).contracts.find(c=>c.id===id);requireRule(c,'ECO_CONTRACT_NOT_FOUND');this.business(m,c.businessId);return c}
 model(id:string){const p=this.catalog.models.find(p=>p.id===id);requireRule(p,'ECO_MODEL_NOT_FOUND');return p}
 modelAvailable(m:Context,id:string,date:string){const p=this.model(id);return date>=p.availableAt&&m.world?.anchors.some(a=>a.id===p.anchorId)===true}
 adapted(m:Context,businessId:string,modelId:string,productId:string,date:string){return state(m).adapters.some(a=>a.businessId===businessId&&a.modelId===modelId&&a.purpose===productId&&a.consentedAt<=date&&date<a.expiresAt&&done(m,a.jobId))}
 variant(productId:string,scope:string){const p=this.catalog.products.find(p=>p.id===productId);requireRule(p,'ECO_PRODUCT_NOT_FOUND');return {priceFen:scope==='pilot'?p.priceFen/2:p.priceFen,job:scope==='pilot'?'deepseek-pilot-'+p.id:p.job,support:scope==='pilot'?'deepseek-pilot-'+p.id+'-support':p.support}}
 hasEntitlement(m:OperatingContext,bindingId:string,id:string,date:string){if(bindingId!=='player'||!m.deepseek)return false;const s=state(m);if(id==='basic_programming')return s.preparations.some(p=>p.kind==='basics'&&m.operations?.jobs.some(j=>j.id===p.jobId&&j.status==='completed'&&j.completeAt<=date));if(id==='deepseek_supply_approval')return s.adapters.some(a=>a.consentedAt<=date&&date<a.expiresAt&&m.operations?.jobs.some(j=>j.id===a.jobId&&j.status==='completed'&&j.completeAt<=date));if(id==='financing_consent')return s.invitations.some(a=>a.reportAt!==null&&a.reportAt<=date&&a.financingConsent===true&&date<=a.expiresAt);if(id==='due_diligence')return s.invitations.some(a=>a.reportAt!==null&&a.reportAt<=date&&a.authority===true);if(id==='equity_eligibility')return s.preparations.some(p=>p.kind==='eligibility'&&m.operations?.jobs.some(j=>j.id===p.jobId&&j.status==='completed'&&j.completeAt<=date));return false}
 closeConstraint(m:OperatingContext,businessId:string){if(!m.deepseek)return;const s=state(m);requireRule(s.contracts.filter(c=>c.businessId===businessId).every(c=>c.status==='completed'||c.status==='cancelled')&&!s.agreements.some(a=>a.businessId===businessId&&(a.shares>0||s.exits.some(e=>e.agreementId===a.id&&e.receivableId!==null&&m.economy.ledger.privateReceivables.some(r=>r.id===e.receivableId&&r.remainingFen>0)))),'DEEPSEEK_UNSETTLED_ASSETS_OR_SERVICE')}
 #active(m:Context,businessId:string){const b=this.business(m,businessId);requireRule(b.lifecycle==='operating'&&!m.world?.stoppedBindings.includes(businessId),'DEEPSEEK_NEW_BUSINESS_PAUSED');return b}
 #job(m:Context,i:Intent,businessId:string,definitionId:string,date:string){return this.operations.inspectRouteJob(m,businessId,definitionId,ids(i.resources),str(i.startAt),date)}
 #plan(m:RuleModel,i:Intent,businessId:string,definitionId:string,id:string){return this.operations.planRouteJob(m,businessId,definitionId,ids(i.resources),str(i.startAt),id)}
 #pair(m:Context,i:Intent,businessId:string,main:string,support:string,date:string){const d=this.operations.catalog.jobs.find(j=>j.id===main)!;const from=str(i.startAt),supportAt=addDays(from,d.durationDays+3),a=this.#job(m,i,businessId,main,date),b=this.#job(m,{...i,startAt:supportAt},businessId,support,date);requireRule(from>date,'ECO_FUTURE_START_REQUIRED');requireRule(accountFunds(m.economy.ledger,this.business(m,businessId).accountId).availableFen>=a.upfrontCostFen+b.upfrontCostFen,'INSUFFICIENT_AVAILABLE_FUNDS');requireRule(quarterOf(from)!==quarterOf(supportAt)||actionBudget(m.economy,from).available>=a.actionPoints+b.actionPoints,'INSUFFICIENT_ACTION_POINTS');return {...a,upfrontCostFen:a.upfrontCostFen+b.upfrontCostFen,actionPoints:a.actionPoints+b.actionPoints,actionAllocations:[{date:from,actionPoints:a.actionPoints,label:'实际制作/补救'},{date:supportAt,actionPoints:b.actionPoints,label:'约定支持'}]}}
 inspect(m:Context,i:Intent,date:string){
  const s=state(m);requireRule(m.phase===undefined||m.phase==='playing'||['StopEcosystemService','CancelEcoContract','CollectEcoReceivable','RejectEquityInvitation','DeclineEquityTerms','CollectEquityExit'].includes(i.kind),'RUN_NOT_PLAYING')
  if(EQUITY_KINDS.has(i.kind))return this.equity.inspect(m,i,date)
  switch(i.kind){
   case 'OpenEcosystemService':requireRule(this.modelAvailable(m,'v2',date),'ECO_MODEL_NOT_AVAILABLE');requireRule(!m.operations?.businesses.some(b=>b.definitionId==='ecosystem-service'&&b.lifecycle!=='closed'),'ECO_BUSINESS_EXISTS');requireRule(num(i.capitalFen)>=500000&&accountFunds(m.economy.ledger,'personal').availableFen>=num(i.capitalFen),'INSUFFICIENT_AVAILABLE_FUNDS');return {...allowed(),upfrontCostFen:num(i.capitalFen)}
   case 'StartEcosystemPreparation':{const b=this.business(m,str(i.businessId)),kind=i.preparation==='materials'?'materials':'basics';requireRule(!s.preparations.some(p=>p.businessId===b.id&&p.kind===kind&&m.operations?.jobs.some(j=>j.id===p.jobId&&['planned','running','completed'].includes(j.status))),'ECO_PREPARATION_ALREADY_EXISTS');return this.#job(m,i,b.id,kind==='materials'?'deepseek-materials':'deepseek-basics',date)}
   case 'StartEcosystemAdaptation':{const b=this.business(m,str(i.businessId));requireRule(this.modelAvailable(m,str(i.modelId),date)&&this.capabilities(m,'basic_programming',date).length===0,'ECO_TECHNICAL_PREPARATION_REQUIRED');requireRule(m.world?.preparations.some(p=>p.bindingId==='player'&&p.key==='ecosystem_materials'),'ECO_APPLICATION_MATERIALS_REQUIRED');requireRule(i.acceptSimulationTerms===true,'ECO_PURPOSE_CONSENT_REQUIRED');requireRule(!s.adapters.some(a=>a.businessId===b.id&&a.modelId===i.modelId&&a.purpose===i.productId&&date<a.expiresAt&&m.operations?.jobs.some(j=>j.id===a.jobId&&['planned','running','completed'].includes(j.status))),'ECO_ADAPTATION_ALREADY_EXISTS');return this.#job(m,i,b.id,'deepseek-adaptation',date)}
   case 'StartEcoOutreach':{const b=this.#active(m,str(i.businessId));requireRule(this.adapted(m,b.id,str(i.modelId),str(i.productId),date),'ECO_PURPOSE_ADAPTATION_REQUIRED');requireRule(s.outreaches.filter(o=>o.businessId===b.id&&m.operations?.jobs.find(j=>j.id===o.jobId)?.startAt.slice(0,4)===date.slice(0,4)).length<6,'ECO_OUTREACH_LIMIT');if(i.mode==='referral')requireRule(ids(i.sourceCohortIds).length>0&&ids(i.sourceCohortIds).every(id=>m.video?.cohorts.some(c=>c.id===id&&c.date<=date)),'ECO_ACTUAL_REFERRAL_REQUIRED');return this.#job(m,i,b.id,i.mode==='referral'?'deepseek-referral':'deepseek-outreach',date)}
   case 'DeclineEcoLead':requireRule(s.leads.some(l=>l.id===i.leadId&&l.status==='open'),'ECO_LEAD_NOT_OPEN');break
   case 'AcceptEcoContract':{
    const l=s.leads.find(l=>l.id===i.leadId&&l.status==='open'&&date<=l.expiresAt);requireRule(l,'ECO_LEAD_NOT_OPEN');const b=this.#active(m,l.businessId),v=this.variant(l.productId,str(i.scope));requireRule(l.maxPriceFen>=v.priceFen,'ECO_CUSTOMER_DID_NOT_ACCEPT_SCOPE');requireRule(!s.contracts.some(c=>c.personId===l.personId&&c.productId===l.productId&&c.modelId===l.modelId),'ECO_CUSTOMER_ALREADY_SERVED');const mainDays=this.operations.catalog.jobs.find(j=>j.id===v.job)!.durationDays,supportDays=this.operations.catalog.jobs.find(j=>j.id===v.support)!.durationDays;requireRule(this.adapted(m,b.id,l.modelId,l.productId,str(i.startAt))&&this.adapted(m,b.id,l.modelId,l.productId,addDays(str(i.startAt),mainDays+3+supportDays-1)),'ECO_PURPOSE_ADAPTATION_REQUIRED');const pair=this.#pair(m,i,b.id,v.job,v.support,date);return {...pair,receivedPrepaymentFen:v.priceFen/2,protectedIncreaseFen:v.priceFen/2}
   }
   case 'SubmitEcoDelivery':{const c=this.contract(m,str(i.contractId)),job=m.operations?.jobs.find(j=>j.id===(c.remediationJobId??c.productionJobId));requireRule(c.status==='production'&&c.submittedAt===null&&job?.status==='completed'&&c.reviewAt!==null&&date<c.reviewAt,'ECO_DELIVERY_NOT_READY');break}
   case 'StartEcoRemediation':{const c=this.contract(m,str(i.contractId));requireRule(c.status==='rejected'&&c.remediationJobId===null,'ECO_REMEDIATION_UNAVAILABLE');const days=this.operations.catalog.jobs.find(j=>j.id===this.variant(c.productId,c.scope).support)!.durationDays;requireRule(this.adapted(m,c.businessId,c.modelId,c.productId,str(i.startAt))&&this.adapted(m,c.businessId,c.modelId,c.productId,addDays(str(i.startAt),7+3+days-1)),'ECO_PURPOSE_ADAPTATION_REQUIRED');return this.#pair(m,i,c.businessId,'deepseek-remediation',this.variant(c.productId,c.scope).support,date)}
   case 'CancelEcoContract':{const c=this.contract(m,str(i.contractId));requireRule(c.status!=='completed'&&c.status!=='cancelled','ECO_CONTRACT_CLOSED');return {...allowed(),upfrontCostFen:this.cancellationCompensation(c)}}
   case 'CollectEcoReceivable':{const d=s.deliveries.find(d=>d.id===i.deliveryId);requireRule(d&&d.dueAt<=date,'ECO_COLLECTION_NOT_DUE');this.contract(m,d.contractId);requireRule(num(i.amountFen)>0&&num(i.amountFen)<=d.creditFen-s.collections.filter(c=>c.deliveryId===d.id).reduce((n,c)=>n+c.amountFen,0),'ECO_INVALID_COLLECTION');break}
   case 'StopEcosystemService':{const b=this.business(m,str(i.businessId));requireRule(b.lifecycle==='operating','ECO_BUSINESS_ALREADY_STOPPED');break}
   default:requireRule(false,'UNKNOWN_DEEPSEEK_COMMAND')
  }
  return allowed()
 }
 apply(m:RuleModel,i:Intent,commandId:string):RuleModel{
  const date=m.timeline.cursor.date;this.inspect(m,i,date);const id=did(commandId,i.kind),s=state(m);let next=m
  if(EQUITY_KINDS.has(i.kind))next=this.equity.apply(m,i,commandId)
  else switch(i.kind){
   case 'OpenEcosystemService':{next=this.operations.apply(next,{kind:'DiscoverBusiness',definitionId:'ecosystem-service'},did(id,'discover'));const b=next.operations!.businesses.at(-1)!;next=this.operations.apply(next,{kind:'FundBusiness',businessId:b.id,amountFen:num(i.capitalFen)},did(id,'fund'));next=this.operations.apply(next,{kind:'PrepareBusiness',businessId:b.id},did(id,'prepare'));break}
   case 'StartEcosystemPreparation':{const kind=i.preparation==='materials'?'materials' as const:'basics' as const,businessId=str(i.businessId);next=this.#plan(next,i,businessId,kind==='materials'?'deepseek-materials':'deepseek-basics',id);next=patch(next,{preparations:[...s.preparations,{id,businessId,kind,jobId:id}]});break}
   case 'StartEcosystemAdaptation':{const businessId=str(i.businessId);next=this.#plan(next,i,businessId,'deepseek-adaptation',id);next=patch(next,{adapters:[...s.adapters,{id,businessId,modelId:i.modelId as 'v2'|'v3'|'r1',purpose:i.productId as 'deployment'|'training',jobId:id,consentedAt:date,expiresAt:addDays(next.operations!.jobs.find(j=>j.id===id)!.completeAt,366)}]});break}
   case 'StartEcoOutreach':{const businessId=str(i.businessId);next=this.#plan(next,i,businessId,i.mode==='referral'?'deepseek-referral':'deepseek-outreach',id);next=patch(next,{outreaches:[...s.outreaches,{id,businessId,jobId:id,mode:i.mode as 'paid'|'referral',productId:i.productId as 'deployment'|'training',modelId:i.modelId as 'v2'|'v3'|'r1',sourceCohortIds:ids(i.sourceCohortIds),completedAt:null,personIds:[]}]});break}
   case 'DeclineEcoLead':next=patch(next,{leads:s.leads.map(l=>l.id===i.leadId?{...l,status:'declined'}:l)});break
   case 'AcceptEcoContract':{
    const l=s.leads.find(l=>l.id===i.leadId)!,b=this.business(m,l.businessId),v=this.variant(l.productId,str(i.scope));next=this.#plan(next,i,b.id,v.job,did('production',id));const job=next.operations!.jobs.find(j=>j.id===did('production',id))!,reviewAt=addDays(job.completeAt,3),supportId=did('support',id);next=this.#plan(next,{...i,startAt:reviewAt},b.id,v.support,supportId)
    next=post(next,{id:did('prepay',id),sourceEventId:id,date,kind:'receive_prepayment',accountId:b.accountId,counterpartyId:'world',businessId:b.id,contractId:id,amountFen:v.priceFen/2,reservationId:did('protection',id)})
    const c:DeepseekContract={id,businessId:b.id,leadId:l.id,personId:l.personId,productId:l.productId,modelId:l.modelId,scope:i.scope as 'pilot'|'standard',priceFen:v.priceFen,prepaymentFen:v.priceFen/2,acceptedAt:date,prepaymentOperationId:did('prepay',id),productionJobId:job.id,originalSupportJobId:supportId,supportJobId:supportId,reviewFactId:did('review-fact',id),submittedAt:null,reviewAt,accepted:null,remediationJobId:null,deliveredAt:null,supportPostedAt:null,cancelledAt:null,status:'production'};next=fact(next,c.reviewFactId,date,id);next=patch(next,{contracts:[...s.contracts,c],leads:s.leads.map(old=>old.id===l.id?{...old,status:'accepted'}:old)})
    next=queue(next,event('eco_review',id,reviewAt));next=queue(next,event('eco_support',id,next.operations!.jobs.find(j=>j.id===supportId)!.completeAt));break
   }
   case 'SubmitEcoDelivery':next=patch(next,{contracts:s.contracts.map(c=>c.id===i.contractId?{...c,submittedAt:date,status:'review'}:c)});break
   case 'StartEcoRemediation':{
    const c=this.contract(m,str(i.contractId));next=this.#plan(next,i,c.businessId,'deepseek-remediation',id);const job=next.operations!.jobs.find(j=>j.id===id)!,reviewAt=addDays(job.completeAt,3),supportId=did('remediation-support',id);next=this.#plan(next,{...i,startAt:reviewAt},c.businessId,this.variant(c.productId,c.scope).support,supportId);next=patch(next,{contracts:s.contracts.map(v=>v.id===c.id?{...v,remediationJobId:id,supportJobId:supportId,submittedAt:null,accepted:null,reviewAt,status:'production'}:v)});next=queue(next,event('eco_review',c.id,reviewAt));next=queue(next,event('eco_support',c.id,next.operations!.jobs.find(j=>j.id===supportId)!.completeAt));break
   }
   case 'CancelEcoContract':next={...this.#cancel(next,this.contract(next,str(i.contractId)),date,id),timeline:next.timeline};break
   case 'CollectEcoReceivable':{const d=s.deliveries.find(d=>d.id===i.deliveryId)!,c=this.contract(m,d.contractId),b=this.business(m,c.businessId);next=post(next,{id,sourceEventId:d.id,date,kind:'collect_receivable',accountId:b.accountId,businessId:b.id,contractId:c.id,amountFen:num(i.amountFen)});next=patch(next,{collections:[...s.collections,{id,deliveryId:d.id,date,amountFen:num(i.amountFen),operationId:id}]});break}
   case 'StopEcosystemService':next=this.operations.apply(next,{kind:'PauseBusiness',businessId:str(i.businessId)},id);break
  }
  next=log(next,did('command-log',id),date,id,EQUITY_KINDS.has(i.kind)?`明确架空投资决策：${i.kind}`:`生态服务决策：${i.kind}`);next={...this.sync(next,date),timeline:next.timeline};const gap=next.economy.ledger.obligations.find(o=>o.remainingFen>0&&o.date<=date&&!m.economy.ledger.obligations.some(old=>old.id===o.id&&old.remainingFen>0));if(gap&&next.timeline.pause===null)next={...next,timeline:{...next.timeline,pause:{instanceId:gap.originOperationId,reason:'CASH_SHORTFALL',source:'command'}}};return next
 }
 #cancel<T extends OperatingModel>(m:T,c:DeepseekContract,date:string,id:string):T{
  let next=m;for(const jobId of [c.productionJobId,c.supportJobId,c.remediationJobId])if(jobId&&next.operations?.jobs.some(j=>j.id===jobId&&['planned','running'].includes(j.status)))next={...this.operations.interruptRouteJob(next,jobId,date)} as T
  const b=this.business(next,c.businessId),balance=next.economy.ledger.contracts.find(b=>b.id===c.id),refund=balance?.prepaidFen??0
  if(refund>0){next=post(next,{id:did('refund',id),sourceEventId:c.id,date,kind:'refund_undelivered',accountId:b.accountId,businessId:b.id,contractId:c.id,amountFen:refund,referenceId:c.prepaymentOperationId,obligationId:did('refund-due',id)});next=patch(next,{refunds:[...state(next).refunds,{id,contractId:c.id,date,amountFen:refund,operationId:did('refund',id)}]})}
  if(this.cancellationCompensation(c)>0)next=post(next,{id:did('support-compensation',id),sourceEventId:c.id,date,kind:'due_expense',accountId:b.accountId,counterpartyId:'world',businessId:b.id,contractId:c.id,amountFen:this.cancellationCompensation(c),obligationId:did('support-compensation-due',id)})
  return patch(next,{contracts:state(next).contracts.map(v=>v.id===c.id?{...v,status:'cancelled',cancelledAt:date}:v)})
 }
 #deliver<T extends OperatingModel>(m:T,c:DeepseekContract,stage:'production'|'support',date:string):T{
  const s=state(m),id=did('delivery',c.id,stage);if(s.deliveries.some(d=>d.id===id))return m;const b=this.business(m,c.businessId),amount=stage==='production'?ratio(c.priceFen,8000,10000):c.priceFen-ratio(c.priceFen,8000,10000),balance=m.economy.ledger.contracts.find(b=>b.id===c.id),prepaid=Math.min(balance?.prepaidFen??0,amount),credit=amount-prepaid,operationIds:string[]=[];let next=m
  if(prepaid>0){const op=did('prepaid-delivery',id);next=post(next,{id:op,sourceEventId:c.id,date,kind:'deliver_prepaid',accountId:b.accountId,businessId:b.id,contractId:c.id,amountFen:prepaid});operationIds.push(op)}
  if(credit>0){const op=did('credit-delivery',id);next=post(next,{id:op,sourceEventId:c.id,date,kind:'deliver_on_credit',accountId:b.accountId,counterpartyId:'world',businessId:b.id,contractId:c.id,amountFen:credit});operationIds.push(op)}
  return patch(next,{deliveries:[...s.deliveries,{id,contractId:c.id,stage,date,amountFen:amount,prepaidFen:prepaid,creditFen:credit,operationIds,dueAt:addDays(date,7)}],contracts:state(next).contracts.map(v=>v.id===c.id?{...v,...(stage==='production'?{deliveredAt:date,status:'support' as const}:{supportPostedAt:date,status:'completed' as const})}:v)})
 }
 sync<T extends OperatingModel>(m:T,date:string):T{
  let next=m
  for(const p of state(next).preparations)if(p.kind==='materials'&&done(next,p.jobId)&&!next.world?.preparations.some(w=>w.sourceEventId===p.jobId)){
   requireRule(next.world&&next.operations,'WORLD_REQUIRED');const job=next.operations.jobs.find(j=>j.id===p.jobId)!;next={...next,world:{...next.world,preparations:[...next.world.preparations,{bindingId:'player',key:'ecosystem_materials',sourceEventId:job.id,date:job.completeAt}]},operations:{...next.operations,businesses:next.operations.businesses.map(b=>b.id===p.businessId?{...b,prepared:true}:b)}}
  }
  for(const o of state(next).outreaches)if(o.completedAt===null&&done(next,o.jobId)){
   const job=next.operations!.jobs.find(j=>j.id===o.jobId)!,all=o.mode==='referral'?[...new Set(o.sourceCohortIds.flatMap(id=>next.video!.cohorts.find(c=>c.id===id)!.members))].slice(0,3):this.video.audienceMembers(next,'local_merchants',210+state(next).outreaches.indexOf(o)*3,3),people=all.filter(personId=>!state(next).leads.some(l=>l.personId===personId&&l.modelId===o.modelId&&l.productId===o.productId));let leads=[...state(next).leads]
   for(const personId of people){const id=did('lead',o.id,personId),factId=did('proposal',id);next=fact(next,factId,job.completeAt,id);const standard=this.variant(o.productId,'standard').priceFen,maxPriceFen=pass(next,factId,this.catalog.proposalAcceptBps)?standard:pass(next,factId,Math.min(10000,this.catalog.proposalAcceptBps+1000))?standard/2:0;next=reveal(next,factId,`实际需求研究完成：本客户可接受的已知范围预算${maxPriceFen}分，未签约未收款`);leads.push({id,businessId:o.businessId,outreachId:o.id,personId,productId:o.productId,modelId:o.modelId,factId,maxPriceFen,createdAt:job.completeAt,expiresAt:addDays(job.completeAt,90),status:'open'})}
   next=patch(next,{leads,outreaches:state(next).outreaches.map(v=>v.id===o.id?{...v,completedAt:job.completeAt,personIds:people}:v)})
  }
  if(state(next).leads.some(l=>l.status==='open'&&date>l.expiresAt))next=patch(next,{leads:state(next).leads.map(l=>l.status==='open'&&date>l.expiresAt?{...l,status:'expired'}:l)})
  return this.equity.sync(next,date)
 }
 reduce(m:OperatingModel,e:ScheduledEvent<RunOperation>){
  requireRule(e.payload.kind==='deepseek_event','INVALID_DEEPSEEK_EVENT');if(e.payload.type==='follow_round')return this.equity.reduce(m,e)
  const c=this.contract(m,e.payload.entityId),date=e.date;let next=m
  if(e.payload.type==='eco_review'){
   if(c.reviewAt!==date||c.status==='cancelled'||c.deliveredAt!==null)return {state:m,skippedReason:'ECO_REVIEW_RETIRED'}
   if(c.submittedAt===null){next=this.#cancel(next,c,date,e.instanceId);return {state:next,skippedReason:'ECO_NOT_SUBMITTED_REFUNDED'}}
   const accepted=pass(next,c.reviewFactId,Math.min(10000,this.catalog.deliveryAcceptBps+(c.remediationJobId!==null?2500:0)));next=reveal(next,c.reviewFactId,'客户复核依据已固定；本次是否认可见实际复核回执');next=patch(next,{contracts:state(next).contracts.map(v=>v.id===c.id?{...v,accepted,status:accepted?'support':'rejected'}:v)})
   if(accepted)next=this.#deliver(next,c,'production',date);else if(next.operations?.jobs.some(j=>j.id===c.supportJobId&&['planned','running'].includes(j.status)))next=this.operations.interruptRouteJob(next,c.supportJobId,date)
  }else{
   if(c.status==='cancelled'||c.status==='rejected'||c.supportPostedAt!==null)return {state:m,skippedReason:'ECO_SUPPORT_RETIRED'}
   const job=next.operations?.jobs.find(j=>j.id===c.supportJobId);if(c.accepted===true&&job?.status==='completed'&&job.completeAt===date)next=this.#deliver(next,c,'support',date);else return {state:m,skippedReason:'ECO_SUPPORT_NOT_COMPLETED'}
  }
  next=this.sync(next,date);const gap=next.economy.ledger.obligations.find(o=>o.remainingFen>0&&o.date<=date&&!m.economy.ledger.obligations.some(old=>old.id===o.id&&old.remainingFen>0));return {state:next,...(gap?{pauseReason:'CASH_SHORTFALL'}:{})}
 }
}
