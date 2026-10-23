import {addDays,quarterOf} from './calendar.ts'
import {accountFunds} from './ledger.ts'
import {cumulativeFee,sumMoney,money} from './money.ts'
import {requireRule} from './errors.ts'
import {DEEPSEEK_CONTENT} from '../content/deepseek.ts'
import {deepseekId as did,dsState as state,dsPatch as patch,dsPost as post,dsFact as fact,dsReveal as reveal,dsPass as pass,dsNumber as num,dsString as str,dsIds as ids,dsAllowed as allowed,dsDone as done,dsRatio as ratio,dsEvent as event,dsQueue as queue,hasPaidEcoCase} from './deepseek-state.ts'
import type {DeepseekContext as Context,DeepseekIntent as Intent,DeepseekParameters,DeepseekAgreement} from './deepseek-schema.ts'
import type {OperationsRuntime} from './operations.ts'
import type {OperatingModel} from './operations-types.ts'
import type {RuleModel} from './run-types.ts'
import type {ScheduledEvent} from './timeline.ts'
import type {RunOperation} from './content-types.ts'
export const EQUITY_KINDS=new Set(['EnableCounterfactualEquity','RequestDeepSeekPublicSubscription','OpenEquityDesk','StartEquityRelationship','DiscoverEquityInvitation','PayUnverifiedBrokerFee','InvestigateEquityInvitation','RejectEquityInvitation','StartEquityEligibility','StartEquityNegotiation','DeclineEquityTerms','SignEquityAgreement','FollowEquityRound','ProposeEquityGovernance','RequestEquityExit','AcceptEquityExit','CollectEquityExit'])
export class EquityRuntime{
 readonly operations:OperationsRuntime;readonly parameters:DeepseekParameters;readonly catalog=DEEPSEEK_CONTENT
 constructor(operations:OperationsRuntime,parameters:DeepseekParameters){this.operations=operations;this.parameters=parameters}
 business(m:Context,id:string){const b=this.operations.business(m,id);requireRule(b.route==='deepseek_opportunity','DEEPSEEK_BUSINESS_REQUIRED');return b}
 active(m:Context,id:string){const b=this.business(m,id);requireRule(b.lifecycle==='operating'&&!m.world?.stoppedBindings.includes(id),'DEEPSEEK_NEW_BUSINESS_PAUSED');return b}
 invitation(m:Context,id:string){const i=state(m).invitations.find(i=>i.id===id);requireRule(i,'EQUITY_INVITATION_NOT_FOUND');this.business(m,i.businessId);return i}
 agreement(m:Context,id:string){const a=state(m).agreements.find(a=>a.id===id);requireRule(a&&m.controlledAccountIds.includes(a.accountId),'EQUITY_AGREEMENT_NOT_FOUND');return a}
 related(m:Context,businessId:string){return hasPaidEcoCase(m)||state(m).preparations.some(p=>p.kind==='relationship'&&p.businessId===businessId&&done(m,p.jobId))}
 eligible(m:Context,businessId:string){return state(m).preparations.some(p=>p.kind==='eligibility'&&p.businessId===businessId&&done(m,p.jobId))}
 totalShares(m:Context){return state(m).rounds.at(-1)?.totalShares??this.catalog.initialShares}
 valuation(m:Context){return state(m).rounds.at(-1)?.valuationFen??this.catalog.initialPreMoneyFen}
 terms(id:string){const t=this.catalog.terms.find(t=>t.id===id);requireRule(t,'UNKNOWN_EQUITY_TERMS');return t}
 exitQuote(m:Context,exitId:string,units:number,date:string){
  const e=state(m).exits.find(e=>e.id===exitId);requireRule(e&&e.unitPriceFen!==null,'EQUITY_NO_VALID_BUYER');const a=this.agreement(m,e.agreementId),gross=money(units*e.unitPriceFen),previousGross=sumMoney(m.economy.ledger.receipts.filter(r=>r.kind==='dispose_private_asset').map(r=>(JSON.parse(r.signature) as {grossFen:number}).grossFen)),fee=cumulativeFee(previousGross,gross,this.catalog.transferFeeBps);let left=units,basis=0
  const lots=a.lots.map(l=>{const take=Math.min(left,l.remainingShares),used=l.shares-l.remainingShares,cost=ratio(l.costFen,used+take,l.shares)-ratio(l.costFen,used,l.shares);left-=take;basis+=cost;return {...l,remainingShares:l.remainingShares-take,remainingCostFen:l.remainingCostFen-cost}});requireRule(left===0,'EQUITY_LOT_UNDERFLOW')
  return {lots,basis,summary:{shares:units,grossFen:gross,feeFen:fee,netReceivableFen:gross-fee,dueAt:addDays(date,7)}}
 }
 #job(m:Context,i:Intent,businessId:string,definitionId:string,date:string){return this.operations.inspectRouteJob(m,businessId,definitionId,ids(i.resources),str(i.startAt),date)}
 #plan(m:RuleModel,i:Intent,businessId:string,definitionId:string,id:string){return this.operations.planRouteJob(m,businessId,definitionId,ids(i.resources),str(i.startAt),id)}
 inspect(m:Context,i:Intent,date:string){
  const s=state(m);if(i.kind==='RequestDeepSeekPublicSubscription')requireRule(false,'NO_VERIFIED_DEEPSEEK_PUBLIC_SUBSCRIPTION')
  if(i.kind==='EnableCounterfactualEquity'){requireRule(s.counterfactualEnabledAt===null&&i.acknowledge===true,'COUNTERFACTUAL_CONFIRMATION_REQUIRED');return allowed()}
  requireRule(s.counterfactualEnabledAt!==null,'COUNTERFACTUAL_MODE_REQUIRED')
  if(i.kind==='OpenEquityDesk'){requireRule(date>='2025-01-20'&&m.world?.anchors.some(a=>a.id==='H009'),'EQUITY_NOT_AVAILABLE');requireRule(!m.operations?.businesses.some(b=>b.definitionId==='deepseek-investor'&&b.lifecycle!=='closed'),'EQUITY_DESK_EXISTS');return allowed()}
  if(i.kind==='StartEquityRelationship'||i.kind==='StartEquityEligibility'){
   const b=this.active(m,str(i.businessId)),kind=i.kind==='StartEquityRelationship'?'relationship':'eligibility';requireRule(!s.preparations.some(p=>p.businessId===b.id&&p.kind===kind&&m.operations?.jobs.some(j=>j.id===p.jobId&&['planned','running','completed'].includes(j.status))),'EQUITY_PREPARATION_ALREADY_EXISTS')
   if(kind==='eligibility')requireRule(this.related(m,b.id)&&s.invitations.some(a=>a.businessId===b.id&&a.reportAt!==null&&a.authority===true&&a.financingConsent===true),'EQUITY_VERIFIED_INVITATION_REQUIRED')
   return this.#job(m,i,b.id,kind==='relationship'?'deepseek-relationship':'deepseek-eligibility',date)
  }
  if(i.kind==='DiscoverEquityInvitation'){const b=this.active(m,str(i.businessId));requireRule(date>='2025-01-20'&&date<='2025-08-01'&&s.invitations.length<8,'EQUITY_INVITATION_WINDOW_CLOSED');requireRule(!s.invitations.some(old=>old.businessId===b.id&&old.source===i.source&&quarterOf(old.createdAt)===quarterOf(date)),'EQUITY_INVITATION_ALREADY_FOUND');if(i.source==='referral')requireRule(this.related(m,b.id),'EQUITY_RELATIONSHIP_REQUIRED');return allowed()}
  if(['PayUnverifiedBrokerFee','InvestigateEquityInvitation','RejectEquityInvitation'].includes(i.kind)){
   const a=this.invitation(m,str(i.invitationId));requireRule(a.status==='open'&&date<=a.expiresAt,'EQUITY_INVITATION_CLOSED')
   if(i.kind==='RejectEquityInvitation')return allowed();this.active(m,a.businessId)
   if(i.kind==='PayUnverifiedBrokerFee'){requireRule(a.brokerPaymentId===null&&a.reportAt===null,'EQUITY_BROKER_FEE_UNAVAILABLE');requireRule(accountFunds(m.economy.ledger,this.business(m,a.businessId).accountId).availableFen>=100000,'INSUFFICIENT_AVAILABLE_FUNDS');return {...allowed(),upfrontCostFen:100000}}
   requireRule(a.diligenceJobId===null||m.operations?.jobs.some(j=>j.id===a.diligenceJobId&&['cancelled','interrupted'].includes(j.status)),'EQUITY_DILIGENCE_ALREADY_STARTED');return this.#job(m,i,a.businessId,'deepseek-diligence',date)
  }
  if(i.kind==='StartEquityNegotiation'){
   const a=this.invitation(m,str(i.invitationId)),b=this.active(m,a.businessId),t=this.terms(str(i.termsId));requireRule(date>=this.catalog.negotiationFrom&&date<='2025-08-01','EQUITY_NEGOTIATION_WINDOW_CLOSED');requireRule(a.status==='open'&&date<=a.expiresAt&&a.reportAt!==null&&a.authority===true&&a.financingConsent===true&&this.related(m,b.id)&&this.eligible(m,b.id),'EQUITY_QUALIFICATION_REQUIRED');requireRule(s.agreements.length===0&&!s.negotiations.some(n=>n.invitationId===a.id&&n.termsId===i.termsId&&n.kind===i.acquisitionKind),'EQUITY_NEGOTIATION_ALREADY_ATTEMPTED');requireRule(num(i.amountFen)>=t.minCapitalFen&&num(i.amountFen)<=this.catalog.firstNewMoneyFen&&num(i.amountFen)%800===0,'EQUITY_INVALID_TICKET');return this.#job(m,i,b.id,'deepseek-negotiation',date)
  }
  if(i.kind==='SignEquityAgreement'||i.kind==='DeclineEquityTerms'){
   const n=s.negotiations.find(n=>n.id===i.negotiationId);requireRule(n&&n.respondedAt!==null&&n.closedAt===null&&date<=n.expiresAt,'EQUITY_TERMS_NOT_READY');this.business(m,n.businessId)
   if(i.kind==='SignEquityAgreement'){this.active(m,n.businessId);const inv=this.invitation(m,n.invitationId);requireRule(n.accepted===true&&inv.status==='open'&&inv.authority===true&&inv.financingConsent===true&&this.eligible(m,n.businessId)&&s.agreements.length===0&&date<this.catalog.followAt,'EQUITY_COUNTERPARTY_DID_NOT_ACCEPT');requireRule(accountFunds(m.economy.ledger,this.business(m,n.businessId).accountId).availableFen>=n.amountFen,'INSUFFICIENT_AVAILABLE_FUNDS');return {...allowed(),upfrontCostFen:n.amountFen}}
   return allowed()
  }
  if(i.kind==='FollowEquityRound'){
   const a=this.agreement(m,str(i.agreementId));requireRule(a.followDecision==='pending'&&date>=this.catalog.followAt&&date<=addDays(this.catalog.followAt,this.catalog.followDecisionDays),'EQUITY_FOLLOW_WINDOW_CLOSED');const amount=num(i.amountFen);if(amount>0)this.active(m,a.businessId);const price=this.catalog.followPreMoneyFen/this.totalShares(m);requireRule(amount===0||a.preemptive&&a.shares>0&&Number.isInteger(price)&&amount%price===0&&amount<=ratio(this.catalog.followNewMoneyFen,a.shares,this.totalShares(m)),'EQUITY_FOLLOW_RIGHT_REQUIRED');requireRule(accountFunds(m.economy.ledger,a.accountId).availableFen>=amount,'INSUFFICIENT_AVAILABLE_FUNDS');return {...allowed(),upfrontCostFen:amount}
  }
  if(i.kind==='ProposeEquityGovernance'){
   const a=this.agreement(m,str(i.agreementId));requireRule(a.board&&a.shares>0,'EQUITY_GOVERNANCE_RIGHT_REQUIRED');requireRule(!s.governance.some(g=>g.agreementId===a.id&&g.policy===i.policy),'EQUITY_GOVERNANCE_ALREADY_PROPOSED');return this.#job(m,i,a.businessId,'deepseek-governance',date)
  }
  if(i.kind==='RequestEquityExit'){
   const a=this.agreement(m,str(i.agreementId));requireRule(a.shares>0&&date>=a.lockUntil&&a.transferConsent,'EQUITY_LOCKED_OR_TRANSFER_NOT_CONSENTED');requireRule(num(i.shares)>0&&num(i.shares)<=a.shares&&!s.exits.some(e=>e.agreementId===a.id&&quarterOf(e.createdAt)===quarterOf(date)),'EQUITY_EXIT_ALREADY_REQUESTED');return this.#job(m,i,a.businessId,'deepseek-exit',date)
  }
  if(i.kind==='AcceptEquityExit'){
   const e=s.exits.find(e=>e.id===i.exitId);requireRule(e&&e.responseAt!==null&&e.buyerWilling===true&&e.unitPriceFen!==null&&e.operationId===null&&date<=e.expiresAt,'EQUITY_NO_VALID_BUYER');const a=this.agreement(m,e.agreementId);requireRule(date>=a.lockUntil&&a.transferConsent&&num(i.shares)>0&&num(i.shares)<=Math.min(e.shares,a.shares),'EQUITY_INVALID_EXIT_SHARES');return {...allowed(),privateSale:this.exitQuote(m,e.id,num(i.shares),date).summary}
  }
  if(i.kind==='CollectEquityExit'){const e=s.exits.find(e=>e.id===i.exitId&&e.receivableId!==null);requireRule(e&&e.dueAt!==null&&date>=e.dueAt,'EQUITY_EXIT_NOT_DUE');const owed=m.economy.ledger.privateReceivables.find(r=>r.id===e.receivableId);requireRule(owed&&num(i.amountFen)>0&&num(i.amountFen)<=owed.remainingFen,'EQUITY_INVALID_COLLECTION');return allowed()}
  requireRule(false,'UNKNOWN_EQUITY_COMMAND')
 }
 apply(m:RuleModel,i:Intent,commandId:string):RuleModel{
  const date=m.timeline.cursor.date;this.inspect(m,i,date);const id=did(commandId,i.kind),s=state(m);let next=m
  if(i.kind==='EnableCounterfactualEquity')return patch(next,{counterfactualEnabledAt:date})
  if(i.kind==='OpenEquityDesk'){next=this.operations.apply(next,{kind:'DiscoverBusiness',definitionId:'deepseek-investor'},did(id,'discover'));const b=next.operations!.businesses.at(-1)!;next=this.operations.apply(next,{kind:'PrepareBusiness',businessId:b.id},did(id,'prepare'));return this.operations.apply(next,{kind:'ActivateBusiness',businessId:b.id},did(id,'activate'))}
  if(i.kind==='StartEquityRelationship'||i.kind==='StartEquityEligibility'){const businessId=str(i.businessId),kind=i.kind==='StartEquityRelationship'?'relationship' as const:'eligibility' as const;next=this.#plan(next,i,businessId,kind==='relationship'?'deepseek-relationship':'deepseek-eligibility',id);return patch(next,{preparations:[...s.preparations,{id,businessId,kind,jobId:id}]})}
  if(i.kind==='DiscoverEquityInvitation'){
   const a={id,businessId:str(i.businessId),source:i.source as 'referral'|'broker',createdAt:date,expiresAt:addDays(date,90),classification:'counterfactual' as const,authorityFactId:did('authority',id),consentFactId:did('consent',id),termsFactId:did('terms',id),diligenceJobId:null,reportAt:null,authority:null,financingConsent:null,status:'open' as const,brokerPaymentId:null}
   for(const f of [a.authorityFactId,a.consentFactId,a.termsFactId])next=fact(next,f,date,id);return patch(next,{invitations:[...s.invitations,a]})
  }
  if(['PayUnverifiedBrokerFee','InvestigateEquityInvitation','RejectEquityInvitation'].includes(i.kind)){
   const a=this.invitation(m,str(i.invitationId));let updated={...a}
   if(i.kind==='PayUnverifiedBrokerFee'){next=post(next,{id,sourceEventId:a.id,date,kind:'expense',accountId:this.business(m,a.businessId).accountId,counterpartyId:'world',businessId:a.businessId,amountFen:100000,fundingPurpose:'ordinary'});updated.brokerPaymentId=id}
   else if(i.kind==='InvestigateEquityInvitation'){next=this.#plan(next,i,a.businessId,'deepseek-diligence',id);updated.diligenceJobId=id}
   else updated.status='declined'
   return patch(next,{invitations:s.invitations.map(v=>v.id===a.id?updated:v)})
  }
  if(i.kind==='StartEquityNegotiation'){
   const a=this.invitation(m,str(i.invitationId));next=this.#plan(next,i,a.businessId,'deepseek-negotiation',id);const job=next.operations!.jobs.find(j=>j.id===id)!;return patch(next,{negotiations:[...s.negotiations,{id,invitationId:a.id,businessId:a.businessId,jobId:id,classification:'counterfactual',kind:i.acquisitionKind as 'new_capital'|'secondary',termsId:i.termsId as 'financial'|'liquidity'|'board',amountFen:num(i.amountFen),unitPriceFen:800,shares:num(i.amountFen)/800,factId:a.termsFactId,createdAt:date,respondedAt:null,accepted:null,expiresAt:addDays(job.completeAt,30),closedAt:null}]})
  }
  if(i.kind==='DeclineEquityTerms')return patch(next,{negotiations:s.negotiations.map(n=>n.id===i.negotiationId?{...n,closedAt:date}:n)})
  if(i.kind==='SignEquityAgreement'){
   const n=s.negotiations.find(n=>n.id===i.negotiationId)!,b=this.business(m,n.businessId),t=this.terms(n.termsId),investmentId=did('investment',id),totalShares=this.catalog.initialShares+(n.kind==='new_capital'?250000:0)
   next=post(next,{id:did('acquire',id),sourceEventId:n.id,date,kind:'acquire_asset',accountId:b.accountId,counterpartyId:'world',businessId:b.id,investmentId,assetId:this.catalog.subjectId,classification:'counterfactual',amountFen:n.amountFen,referenceId:n.kind==='new_capital'?'counterfactual-issuer-new-capital':'counterfactual-founder-secondary'})
   const a:DeepseekAgreement={id,negotiationId:n.id,invitationId:n.invitationId,businessId:b.id,accountId:b.accountId,investmentId,subjectId:'deepseek-counterfactual',classification:'counterfactual',kind:n.kind,signedAt:date,lockUntil:addDays(date,t.lockDays),termsId:n.termsId,board:t.board,information:t.information,preemptive:t.preemptive,transferConsent:t.transferConsent,initialShares:n.shares,initialCostFen:n.amountFen,shares:n.shares,costFen:n.amountFen,disposedShares:0,disposedBasisFen:0,lots:[{originId:did('acquire',id),shares:n.shares,costFen:n.amountFen,remainingShares:n.shares,remainingCostFen:n.amountFen}],followDecision:null,followAmountFen:0,followAt:null,acquisitionOperationIds:[did('acquire',id)]}
   next=patch(next,{agreements:[...s.agreements,a],invitations:s.invitations.map(i=>i.id===n.invitationId?{...i,status:'used'}:i),negotiations:s.negotiations.map(old=>old.id===n.id?{...old,closedAt:date}:old),rounds:[...s.rounds,{id:did('round1',id),kind:n.kind,agreementId:id,date,preMoneyFen:this.catalog.initialPreMoneyFen,newMoneyFen:n.kind==='new_capital'?this.catalog.firstNewMoneyFen:0,playerMoneyFen:n.amountFen,otherMoneyFen:n.kind==='new_capital'?this.catalog.firstNewMoneyFen-n.amountFen:0,issuedShares:n.kind==='new_capital'?250000:0,transferredShares:n.kind==='secondary'?n.shares:0,totalShares,valuationFen:n.kind==='new_capital'?1000000000:this.catalog.initialPreMoneyFen}]})
   next=post(next,{id:did('mark',id),sourceEventId:id,date,kind:'value_asset',accountId:a.accountId,businessId:a.businessId,investmentId,valueFen:ratio(this.valuation(next),a.shares,totalShares)})
   next=queue(next,event('follow_round',a.id,this.catalog.followAt));return queue(next,event('follow_round',a.id,addDays(this.catalog.followAt,this.catalog.followDecisionDays)))
  }
  if(i.kind==='FollowEquityRound')return {...this.#follow(next,this.agreement(next,str(i.agreementId)),num(i.amountFen),date,id,false),timeline:next.timeline}
  if(i.kind==='ProposeEquityGovernance'){
   const a=this.agreement(next,str(i.agreementId));next=this.#plan(next,i,a.businessId,'deepseek-governance',id);const factId=did('governance-fact',id);next=fact(next,factId,date,id);return patch(next,{governance:[...s.governance,{id,agreementId:a.id,businessId:a.businessId,jobId:id,policy:i.policy as 'independent_audit'|'commercial_scope',factId,createdAt:date,resolvedAt:null,approved:null}]})
  }
  if(i.kind==='RequestEquityExit'){
   const a=this.agreement(next,str(i.agreementId));next=this.#plan(next,i,a.businessId,'deepseek-exit',id);const factId=did('buyer',id),job=next.operations!.jobs.find(j=>j.id===id)!;next=fact(next,factId,date,id);return patch(next,{exits:[...s.exits,{id,agreementId:a.id,businessId:a.businessId,jobId:id,factId,createdAt:date,shares:num(i.shares),referenceUnitPriceFen:Math.floor(this.valuation(m)/this.totalShares(m)),referenceRoundId:s.rounds.at(-1)!.id,scopeRestricted:s.policies.some(p=>p.policy==='commercial_scope'&&p.date<date),buyerKind:null,responseAt:null,buyerWilling:null,unitPriceFen:null,expiresAt:addDays(job.completeAt,14),dueAt:null,soldShares:0,operationId:null,receivableId:null,collectedFen:0,collectionOperationIds:[]}]})
  }
  if(i.kind==='AcceptEquityExit'){
   const e=s.exits.find(e=>e.id===i.exitId)!,a=this.agreement(m,e.agreementId),units=num(i.shares),plan=this.exitQuote(m,e.id,units,date),{lots,basis}=plan,gross=plan.summary.grossFen,fee=plan.summary.feeFen
   const receivableId=did('sale-receivable',id),dueAt=addDays(date,7);next=post(next,{id,sourceEventId:e.id,date,kind:'dispose_private_asset',accountId:a.accountId,counterpartyId:'world',businessId:a.businessId,investmentId:a.investmentId,removedPrincipalFen:basis,grossFen:gross,feeFen:fee,valueFen:ratio(this.valuation(next),a.shares-units,this.totalShares(next)),receivableId,dueAt})
   return patch(next,{agreements:s.agreements.map(v=>v.id===a.id?{...v,shares:a.shares-units,disposedShares:a.disposedShares+units,disposedBasisFen:a.disposedBasisFen+basis,lots}:v),exits:s.exits.map(v=>v.id===e.id?{...v,soldShares:units,operationId:id,receivableId,dueAt}:v)})
  }
  if(i.kind==='CollectEquityExit'){
   const e=s.exits.find(e=>e.id===i.exitId)!,a=this.agreement(m,e.agreementId);next=post(next,{id,sourceEventId:e.id,date,kind:'collect_private_sale',accountId:a.accountId,counterpartyId:'world',receivableId:e.receivableId!,amountFen:num(i.amountFen)});return patch(next,{exits:s.exits.map(v=>v.id===e.id?{...v,collectedFen:v.collectedFen+num(i.amountFen),collectionOperationIds:[...v.collectionOperationIds,id]}:v)})
  }
  requireRule(false,'UNKNOWN_EQUITY_COMMAND')
 }
 #follow<T extends OperatingModel>(m:T,a:DeepseekAgreement,amount:number,date:string,id:string,defaulted:boolean):T{
  const s=state(m),oldTotal=this.totalShares(m),price=this.catalog.followPreMoneyFen/oldTotal,issued=this.catalog.followNewMoneyFen/price,newShares=amount/price,total=oldTotal+issued;requireRule(Number.isSafeInteger(issued)&&Number.isSafeInteger(newShares),'INVALID_EQUITY_ROUND_SHARES');let next=m;const operationId=did('follow-acquire',id)
  if(amount>0)next=post(next,{id:operationId,sourceEventId:a.id,date,kind:'acquire_asset',accountId:a.accountId,counterpartyId:'world',businessId:a.businessId,investmentId:a.investmentId,assetId:a.subjectId,classification:'counterfactual',amountFen:amount,referenceId:'counterfactual-follow-on-new-capital'})
  next=patch(next,{agreements:s.agreements.map(v=>v.id===a.id?{...v,shares:v.shares+newShares,costFen:v.costFen+amount,followDecision:defaulted?'defaulted':amount>0?'participated':'declined',followAmountFen:amount,followAt:date,lots:amount>0?[...v.lots,{originId:operationId,shares:newShares,costFen:amount,remainingShares:newShares,remainingCostFen:amount}]:v.lots,acquisitionOperationIds:amount>0?[...v.acquisitionOperationIds,operationId]:v.acquisitionOperationIds}:v),rounds:[...s.rounds,{id,kind:'new_capital',agreementId:a.id,date,preMoneyFen:this.catalog.followPreMoneyFen,newMoneyFen:this.catalog.followNewMoneyFen,playerMoneyFen:amount,otherMoneyFen:this.catalog.followNewMoneyFen-amount,issuedShares:issued,transferredShares:0,totalShares:total,valuationFen:this.catalog.followPreMoneyFen+this.catalog.followNewMoneyFen}]})
  return post(next,{id:did('follow-mark',id),sourceEventId:a.id,date,kind:'value_asset',accountId:a.accountId,businessId:a.businessId,investmentId:a.investmentId,valueFen:ratio(this.valuation(next),a.shares+newShares,total)})
 }
 sync<T extends OperatingModel>(m:T,date:string):T{
  let next=m
  for(const a of state(next).invitations){if(a.diligenceJobId!==null&&a.reportAt===null&&done(next,a.diligenceJobId)){const job=next.operations!.jobs.find(j=>j.id===a.diligenceJobId)!,authority=pass(next,a.authorityFactId,a.source==='broker'?Math.min(2500,this.parameters.invitationAuthorityBps):this.parameters.invitationAuthorityBps),consent=authority&&pass(next,a.consentFactId,this.parameters.financingConsentBps);next=reveal(next,a.authorityFactId,authority?'架空邀请的对手授权已核实':'虚构中间人未能证明授权，未取得任何股份');next=reveal(next,a.consentFactId,consent?'本局架空对手有条件愿意谈融资':'本局未核实可谈融资意愿，不能形成股权');next=patch(next,{invitations:state(next).invitations.map(v=>v.id===a.id?{...v,reportAt:job.completeAt,authority,financingConsent:consent}:v)})}else if(a.status==='open'&&date>a.expiresAt)next=patch(next,{invitations:state(next).invitations.map(v=>v.id===a.id?{...v,status:'expired'}:v)})}
  for(const n of state(next).negotiations)if(n.respondedAt===null&&done(next,n.jobId)){const job=next.operations!.jobs.find(j=>j.id===n.jobId)!,threshold=(this.parameters.negotiationAcceptBps===10000?10000:Math.max(0,this.parameters.negotiationAcceptBps-(n.termsId==='liquidity'?1500:n.termsId==='board'?2000:0))),accepted=pass(next,n.factId,threshold);next=reveal(next,n.factId,'架空对手条款基础态度已核实；结果以已完成的每份谈判回执为准');next=patch(next,{negotiations:state(next).negotiations.map(v=>v.id===n.id?{...v,respondedAt:job.completeAt,accepted}:v)})}
  for(const g of state(next).governance)if(g.resolvedAt===null&&done(next,g.jobId)){const job=next.operations!.jobs.find(j=>j.id===g.jobId)!,approved=pass(next,g.factId,this.parameters.governanceAcceptBps);next=reveal(next,g.factId,approved?'架空董事会3/5同意有限用途/披露提案':'架空董事会未通过；少数席位不能单方决定研发');next=patch(next,{governance:state(next).governance.map(v=>v.id===g.id?{...v,resolvedAt:job.completeAt,approved}:v),policies:approved?[...state(next).policies,{governanceId:g.id,policy:g.policy,date:job.completeAt}]:state(next).policies})}
  for(const e of state(next).exits)if(e.responseAt===null&&done(next,e.jobId)){const job=next.operations!.jobs.find(j=>j.id===e.jobId)!,f=next.facts.find(f=>f.id===e.factId)!,buyerKind=f.roll%2===0?'research_partner' as const:'financial' as const,willing=pass(next,e.factId,this.parameters.buyerAcceptBps)&&(!e.scopeRestricted||buyerKind==='research_partner'),discount=7000+f.roll%2501,price=ratio(e.referenceUnitPriceFen,discount,10000);next=reveal(next,e.factId,willing?'独立买方提供有期限和份额上限的折价报价，尚未成交':'本次没有愿意接手的买方；股份仍保留');next=patch(next,{exits:state(next).exits.map(v=>v.id===e.id?{...v,responseAt:job.completeAt,buyerKind,buyerWilling:willing,unitPriceFen:willing?price:null}:v)})}
  return next
 }
 reduce(m:OperatingModel,e:ScheduledEvent<RunOperation>){requireRule(e.payload.kind==='deepseek_event'&&e.payload.type==='follow_round','UNKNOWN_EQUITY_EVENT');const a=this.agreement(m,e.payload.entityId),date=e.date
  if(date===this.catalog.followAt){if(a.followDecision!==null)return {state:m,skippedReason:'EQUITY_ROUND_ALREADY_DECIDED'};return {state:patch(m,{agreements:state(m).agreements.map(v=>v.id===a.id?{...v,followDecision:'pending'}:v)})}}
  if(a.followDecision!=='pending')return {state:m,skippedReason:'EQUITY_ROUND_ALREADY_DECIDED'}
  return {state:this.#follow(m,a,0,date,e.instanceId,true)}
 }
}
