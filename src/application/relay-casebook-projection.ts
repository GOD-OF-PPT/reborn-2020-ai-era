import type {GameRun} from '../core/run-types.ts'
import type {RelayProjection} from '../core/relay-projection.ts'
import type {ActionRecord} from '../core/economy.ts'
import type {LedgerReceipt,Payable} from '../core/ledger.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {MONEY_LIMIT} from '../core/money.ts'

type Relay=NonNullable<RelayProjection>
export type RelayCasebookOperationKind='supplier_prepay'|'consume_supplier'|'incur_supplier_usage'|'reverse_supplier_usage'|'refund_supplier'|'settle_supplier_credit'|'receive_prepayment'|'deliver_prepaid'|'deliver_on_credit'|'collect_receivable'|'refund_undelivered'|'refund_delivered'|'expense'|'due_expense'|'pay_obligation'|'reserve_cash'|'move_reservation'|'release_reservation'|'owner_transfer'|'open_business_account'|'borrow_cash'
export interface RelayCasebookOperation{
 readonly id:string;readonly kind:RelayCasebookOperationKind;readonly status:LedgerReceipt['status'];readonly order:number;readonly date:string
 readonly accountId:string;readonly businessId:string|null;readonly scopeBusinessId:string;readonly contractId:string|null;readonly sourceEventId:string;readonly referenceId:string|null
 readonly amountFen:number|null;readonly prepaymentId:string|null;readonly obligationId:string|null;readonly dueAt:string|null;readonly reservationId:string|null;readonly originId:string|null;readonly newOriginId:string|null;readonly counterpartyId:string|null;readonly targetAccountId:string|null;readonly bucket:string|null;readonly settlement:string|null
}
export interface RelayCasebookTransaction{
 readonly id:string;readonly order:number;readonly lineIndex:number;readonly date:string;readonly accountId:string;readonly amountFen:number
 readonly scopeBusinessId:string;readonly businessId:string|null;readonly contractId:string|null;readonly sourceId:string;readonly referenceId:string|null
}
export interface RelayCasebookAction extends ActionRecord{readonly jobId:string;readonly scopeBusinessId:string;readonly resources:readonly string[]}
export type RelayCasebookObligation=Payable&{readonly scopeBusinessId:string}
type Recharge=NonNullable<GameRun['relay']>['recharges'][number]
type Collection=NonNullable<GameRun['relay']>['collections'][number]
type Renewal=NonNullable<GameRun['relay']>['renewals'][number]
export interface RelayCasebookHistory{
 readonly status:'ready'|'unavailable';readonly reason:string|null;readonly runId:string;readonly revision:number;readonly asOf:string
 readonly recharges:readonly (Recharge&{readonly scopeBusinessId:string;readonly accountId:string})[]
 readonly collections:readonly (Collection&{readonly scopeBusinessId:string;readonly customerId:string;readonly accountId:string})[]
 readonly renewals:readonly (Renewal&{readonly scopeBusinessId:string;readonly accountId:string})[]
 readonly obligationHistory:readonly RelayCasebookObligation[]
 readonly transactions:readonly RelayCasebookTransaction[]
 readonly actions:readonly RelayCasebookAction[]
 readonly operations:readonly RelayCasebookOperation[]
}
export type RelayCasebookProjection=(Relay&{readonly casebook:RelayCasebookHistory})|null

const baseKeys=['id','kind','date','sourceEventId','accountId','businessId','contractId','referenceId']
const shapes:Record<RelayCasebookOperationKind,{required:readonly string[];optional?:readonly string[]}>= {
 supplier_prepay:{required:['businessId','prepaymentId','amountFen','counterpartyId']},consume_supplier:{required:['businessId','prepaymentId','amountFen']},incur_supplier_usage:{required:['businessId','prepaymentId','amountFen','counterpartyId','obligationId','dueAt']},reverse_supplier_usage:{required:['businessId','prepaymentId','amountFen','referenceId']},refund_supplier:{required:['businessId','prepaymentId','amountFen']},settle_supplier_credit:{required:['businessId','prepaymentId','amountFen','obligationId','referenceId']},
 receive_prepayment:{required:['businessId','contractId','amountFen','counterpartyId','reservationId']},deliver_prepaid:{required:['businessId','contractId','amountFen']},deliver_on_credit:{required:['businessId','contractId','amountFen','counterpartyId']},collect_receivable:{required:['businessId','contractId','amountFen']},refund_undelivered:{required:['businessId','contractId','amountFen','obligationId','referenceId']},refund_delivered:{required:['businessId','contractId','amountFen','settlement','referenceId'],optional:['obligationId','reservationId']},
 expense:{required:['amountFen','counterpartyId'],optional:['reservationId','originId','fundingPurpose']},due_expense:{required:['amountFen','counterpartyId','obligationId']},pay_obligation:{required:['amountFen','obligationId']},reserve_cash:{required:['reservationId','bucket','originId','amountFen'],optional:['fundingPurpose']},move_reservation:{required:['reservationId','newOriginId']},release_reservation:{required:['reservationId'],optional:['amountFen']},owner_transfer:{required:['targetAccountId','amountFen'],optional:['fundingPurpose']},open_business_account:{required:[]},borrow_cash:{required:['counterpartyId','amountFen','obligationId','dueAt']},
}
const stringFields=['id','sourceEventId','accountId','businessId','contractId','referenceId','prepaymentId','obligationId','reservationId','originId','newOriginId','counterpartyId','targetAccountId']
function insist(condition:unknown):asserts condition{if(!condition)throw Error('RELAY_CASEBOOK_SOURCE_MISMATCH')}
const identifier=(v:unknown):v is string=>typeof v==='string'&&v.length>0&&v.length<=512&&v.trim().length>0&&!/[\u0000-\u001f\u007f]/.test(v)
const money=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=MONEY_LIMIT
function date(v:unknown):v is string{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const value=Date.parse(v+'T00:00:00Z');return Number.isFinite(value)&&new Date(value).toISOString().slice(0,10)===v}
function index<T>(rows:readonly T[],key:(row:T)=>string):Map<string,T>{const result=new Map<string,T>();for(const row of rows){const id=key(row);insist(identifier(id)&&!result.has(id));result.set(id,row)}return result}
const sameJob=(a:ProductionJob,b:ProductionJob)=>a.id===b.id&&a.businessId===b.businessId&&a.definitionId===b.definitionId&&a.actionId===b.actionId&&a.contractId===b.contractId&&a.startAt===b.startAt&&a.completeAt===b.completeAt&&a.status===b.status&&a.releasedAt===b.releasedAt&&a.outputId===b.outputId&&a.resources.length===b.resources.length&&a.resources.every((r,i)=>r===b.resources[i])
function empty(run:GameRun,reason:string|null):RelayCasebookHistory{return {status:reason===null?'ready':'unavailable',reason,runId:run.runId,revision:run.revision,asOf:run.timeline.cursor.date,recharges:[],collections:[],renewals:[],obligationHistory:[],transactions:[],actions:[],operations:[]}}

/** Only this application boundary decodes original financial receipts. No rule is replayed. */
export function enrichRelayCasebook(run:GameRun,relay:RelayProjection):RelayCasebookProjection{
 if(relay===null)return null
 try{return {...relay,casebook:readHistory(run,relay)}}catch{return {...relay,casebook:empty(run,'这份原账的来源或主体不唯一，暂不能展开逐笔历史；原账和原有操作仍保留。')}}
}
function readHistory(run:GameRun,relay:Relay):RelayCasebookHistory{
 const today=run.timeline.cursor.date;insist(date(today)&&run.relay!==null&&run.operations!==null)
 const businesses=index(relay.businesses,b=>b.id),originalBusinesses=index(run.operations.businesses,b=>b.id),customers=index(relay.customers,c=>c.id),invoices=index(relay.receivables,r=>r.id),periods=index(relay.periods,p=>p.id),meters=index(relay.meters,m=>m.id),receipts=index(run.economy.ledger.receipts,r=>r.id),originalJobs=index(run.operations.jobs,j=>j.id),originalActions=index(run.economy.actions,a=>a.definition.id)
 const knownSources=new Map<string,string>(),operationOwners=new Map<string,string>(),publicJobs=new Map<string,ProductionJob>()
 for(const rows of [relay.preparations,relay.applications,relay.adapters,relay.audiences,relay.audits,relay.corrections,relay.refunds,relay.quotes] as const)index<{id:string}>(rows,row=>row.id)
 index(relay.auditJobs,row=>row.jobId)
 const audiences=index(relay.audiences,a=>a.id)
 const bind=(map:Map<string,string>,id:string,owner:string)=>{insist(identifier(id)&&businesses.has(owner)&&(!map.has(id)||map.get(id)===owner));map.set(id,owner)}
 for(const b of businesses.values()){const original=originalBusinesses.get(b.id);insist(original&&original.accountId===b.accountId&&original.route==='api_relay'&&original.definitionId===b.definitionId&&run.controlledAccountIds.includes(b.accountId));bind(knownSources,b.id,b.id)}
 const addJob=(job:ProductionJob|null,jobId:string,owner:string)=>{insist(job&&job.id===jobId&&job.businessId===owner&&originalJobs.has(jobId)&&sameJob(job,originalJobs.get(jobId)!));const previous=publicJobs.get(jobId);insist(!previous||sameJob(previous,job));publicJobs.set(jobId,job);bind(knownSources,job.id,owner);bind(knownSources,job.actionId,owner)}
 for(const c of customers.values()){const audience=audiences.get(c.originAudienceId);insist(businesses.has(c.businessId)&&date(c.signedAt)&&c.signedAt<=today&&audience?.businessId===c.businessId&&audience.members.includes(c.personId));index(c.terms,t=>t.id);bind(knownSources,c.id,c.businessId)}
 for(const p of periods.values()){insist(businesses.has(p.businessId)&&date(p.createdAt)&&p.createdAt<=today&&new Set(p.customerIds).size===p.customerIds.length&&p.customerIds.every(id=>customers.get(id)?.businessId===p.businessId));bind(knownSources,p.id,p.businessId);addJob(p.job,p.jobId,p.businessId);addJob(p.supportJob,p.supportJobId,p.businessId)}
 for(const m of meters.values()){const p=periods.get(m.periodId);insist(p&&p.customerIds.includes(m.customerId)&&customers.get(m.customerId)?.businessId===p.businessId);bind(knownSources,m.id,p.businessId);for(const id of [...m.deliveryIds,...(m.costOperationId?[m.costOperationId]:[])])bind(operationOwners,id,p.businessId)}
 for(const rows of [relay.preparations,relay.applications,relay.adapters] as const)for(const row of rows){insist(businesses.has(row.businessId));bind(knownSources,row.id,row.businessId);addJob(row.job,row.jobId,row.businessId)}
 for(const a of relay.audiences){insist(businesses.has(a.businessId));bind(knownSources,a.id,a.businessId);if(a.jobId!==null)addJob(a.job,a.jobId,a.businessId)}
 for(const a of relay.auditJobs){insist(businesses.has(a.businessId)&&a.periodIds.every(id=>periods.get(id)?.businessId===a.businessId));addJob(a.job,a.jobId,a.businessId)}
 for(const q of relay.quotes){insist(businesses.has(q.businessId)&&q.customerIds.every(id=>customers.get(id)?.businessId===q.businessId));bind(knownSources,q.id,q.businessId);addJob(q.job,q.jobId,q.businessId)}
 for(const r of invoices.values()){const c=customers.get(r.customerId);insist(c&&knownSources.get(r.sourceId)===c.businessId&&date(r.date)&&r.date<=today&&date(r.dueAt)&&r.dueAt>=r.date&&money(r.amountFen)&&money(r.collectedFen)&&money(r.reversedFen)&&r.collectedFen+r.reversedFen<=r.amountFen);bind(knownSources,r.id,c.businessId);bind(operationOwners,r.operationId,c.businessId)}
 for(const c of relay.corrections){const m=meters.get(c.meterId);insist(m&&date(c.date)&&c.date<=today);const owner=periods.get(m.periodId)!.businessId;bind(knownSources,c.id,owner);for(const id of c.operationIds)bind(operationOwners,id,owner)}
 for(const r of relay.refunds){const c=customers.get(r.customerId);insist(c&&date(r.date)&&r.date<=today);bind(knownSources,r.id,c.businessId);for(const id of r.operationIds)bind(operationOwners,id,c.businessId)}

 const recharges:RelayCasebookHistory['recharges'][number][]=[],collections:RelayCasebookHistory['collections'][number][]=[],renewals:RelayCasebookHistory['renewals'][number][]=[]
 index(run.relay.recharges,r=>r.id);index(run.relay.collections,r=>r.id);index(run.relay.renewals,r=>r.id)
 for(const r of run.relay.recharges){const c=customers.get(r.customerId);if(!c)continue;insist(date(r.date)&&r.date<=today&&money(r.amountFen)&&money(r.usedFen)&&money(r.refundedFen)&&r.usedFen+r.refundedFen<=r.amountFen);bind(operationOwners,r.operationId,c.businessId);bind(knownSources,r.id,c.businessId);recharges.push({id:r.id,customerId:r.customerId,date:r.date,amountFen:r.amountFen,operationId:r.operationId,usedFen:r.usedFen,refundedFen:r.refundedFen,scopeBusinessId:c.businessId,accountId:businesses.get(c.businessId)!.accountId})}
 for(const r of run.relay.collections){const invoice=invoices.get(r.receivableId);if(!invoice)continue;const c=customers.get(invoice.customerId)!;insist(date(r.date)&&r.date<=today&&r.date>=invoice.dueAt&&money(r.amountFen)&&r.amountFen>0);bind(operationOwners,r.operationId,c.businessId);collections.push({id:r.id,receivableId:r.receivableId,date:r.date,operationId:r.operationId,amountFen:r.amountFen,scopeBusinessId:c.businessId,customerId:c.id,accountId:businesses.get(c.businessId)!.accountId})}
 for(const r of run.relay.renewals){const c=customers.get(r.customerId);if(!c)continue;insist(date(r.date)&&r.date<=today&&date(r.termEnd)&&r.termEnd>=r.date&&money(r.creditLimitFen));renewals.push({id:r.id,customerId:r.customerId,date:r.date,termEnd:r.termEnd,creditLimitFen:r.creditLimitFen,mode:r.mode,scopeBusinessId:c.businessId,accountId:businesses.get(c.businessId)!.accountId})}
 for(const r of relay.refunds)for(const rechargeId of r.rechargeIds)insist(recharges.some(p=>p.id===rechargeId&&p.customerId===r.customerId))

 const companyAccountOwner=(accountId:string)=>{const candidates=[...businesses.values()].filter(b=>b.accountId===accountId&&b.company);insist(candidates.length<=1);return candidates[0]?.id}
 const resolveOwner=(accountId:string,declared:string|null,contractId:string|null,source:string|null,reference:string|null,expected?:string):string|undefined=>{
  const candidates=new Set<string>();if(declared&&businesses.has(declared))candidates.add(declared);if(contractId&&customers.has(contractId))candidates.add(customers.get(contractId)!.businessId);for(const id of [source,reference]){if(id&&knownSources.has(id))candidates.add(knownSources.get(id)!);if(id&&operationOwners.has(id))candidates.add(operationOwners.get(id)!)}if(expected)candidates.add(expected)
  if(declared&&!businesses.has(declared)){insist(candidates.size===0);return undefined}if(candidates.size===0){const company=companyAccountOwner(accountId);if(company)candidates.add(company)}insist(candidates.size<=1);return [...candidates][0]
 }
 const obligationHistory:RelayCasebookObligation[]=[],obligations=index(run.economy.ledger.obligations,o=>o.id)
 for(const o of obligations.values()){const owner=resolveOwner(o.accountId,o.businessId,o.contractId,o.sourceEventId,o.originOperationId);if(!owner)continue;insist(businesses.get(owner)!.accountId===o.accountId&&date(o.date)&&money(o.amountFen)&&money(o.remainingFen)&&o.remainingFen<=o.amountFen);bind(knownSources,o.id,owner);bind(operationOwners,o.originOperationId,owner);obligationHistory.push({id:o.id,accountId:o.accountId,businessId:o.businessId,contractId:o.contractId,counterpartyId:o.counterpartyId,date:o.date,sourceEventId:o.sourceEventId,originOperationId:o.originOperationId,kind:o.kind,amountFen:o.amountFen,remainingFen:o.remainingFen,protectionReservationId:o.protectionReservationId,scopeBusinessId:owner})}
 const ownObligations=index(obligationHistory,o=>o.id)
 const actions:RelayCasebookAction[]=[]
 for(const job of publicJobs.values()){const a=originalActions.get(job.actionId),b=businesses.get(job.businessId)!;insist(a&&a.definition.businessId===b.id&&a.definition.accountId===b.accountId&&date(a.plannedAt)&&a.plannedAt<=today&&(a.executedAt===null||date(a.executedAt)&&a.executedAt<=today)&&(a.finishedAt===null||date(a.finishedAt)&&a.finishedAt<=today));const d=a.definition;insist(money(d.costFen)&&Number.isSafeInteger(d.actionPoints)&&d.actionPoints>=0&&date(d.startAt)&&date(d.completeAt)&&date(d.settlementAt));actions.push({jobId:job.id,scopeBusinessId:b.id,resources:[...job.resources],status:a.status,plannedAt:a.plannedAt,executedAt:a.executedAt,finishedAt:a.finishedAt,definition:{id:d.id,definitionId:d.definitionId,accountId:d.accountId,counterpartyId:d.counterpartyId,businessId:b.id,actionPoints:d.actionPoints,costFen:d.costFen,cashReservationId:d.cashReservationId,startAt:d.startAt,completeAt:d.completeAt,settlementAt:d.settlementAt,...(d.fundingPurpose?{fundingPurpose:d.fundingPurpose}:{})}})}

 const operations:RelayCasebookOperation[]=[]
 const relayAccounts=new Set([...businesses.values()].map(b=>b.accountId))
 for(let order=0;order<run.economy.ledger.receipts.length;order++){
  const receipt=run.economy.ledger.receipts[order]!,kind=receipt.kind as RelayCasebookOperationKind
  if(!Object.hasOwn(shapes,kind)){insist(!operationOwners.has(receipt.id));continue}
  const candidateAccount=run.controlledAccountIds.includes(receipt.accountId)&&(relayAccounts.has(receipt.accountId)||operationOwners.has(receipt.id)||kind==='owner_transfer'&&receipt.accountId==='personal');if(!candidateAccount)continue
  const raw:unknown=JSON.parse(receipt.signature);insist(raw!==null&&typeof raw==='object'&&!Array.isArray(raw));const op=raw as Record<string,unknown>,shape=shapes[kind],allowed=new Set([...baseKeys,...shape.required,...(shape.optional??[])])
  insist(receipt.status==='applied'||receipt.status==='due')
  insist(Object.keys(op).every(k=>allowed.has(k))&&['id','kind','date','sourceEventId','accountId',...shape.required].every(k=>Object.hasOwn(op,k)))
  for(const field of stringFields)if(Object.hasOwn(op,field))insist(identifier(op[field]))
  insist(op.id===receipt.id&&op.kind===receipt.kind&&op.accountId===receipt.accountId&&(op.contractId??null)===receipt.contractId&&date(op.date)&&op.date<=today)
  if(Object.hasOwn(op,'amountFen'))insist(money(op.amountFen));if(Object.hasOwn(op,'dueAt'))insist(date(op.dueAt)&&op.dueAt>=op.date)
  if(Object.hasOwn(op,'fundingPurpose'))insist(op.fundingPurpose==='ordinary'||op.fundingPurpose==='recovery')
  if(Object.hasOwn(op,'bucket'))insist(['plan','order','frozen'].includes(String(op.bucket)))
  if(kind==='refund_delivered')insist(op.settlement==='receivable'&&!Object.hasOwn(op,'obligationId')&&!Object.hasOwn(op,'reservationId')||op.settlement==='cash'&&identifier(op.obligationId)&&identifier(op.reservationId))
  const owed=typeof op.obligationId==='string'?ownObligations.get(op.obligationId):undefined
  const owner=resolveOwner(receipt.accountId,typeof op.businessId==='string'?op.businessId:null,typeof op.contractId==='string'?op.contractId:null,String(op.sourceEventId),typeof op.referenceId==='string'?op.referenceId:null,operationOwners.get(receipt.id)??owed?.scopeBusinessId)
  if(!owner)continue
  const b=businesses.get(owner)!,transfer=kind==='owner_transfer';insist(receipt.accountId===b.accountId||transfer&&receipt.accountId==='personal'&&op.targetAccountId===b.accountId)
  if(transfer)insist(op.targetAccountId===b.accountId||receipt.accountId===b.accountId&&op.targetAccountId==='personal')
  if(typeof op.contractId==='string')insist(customers.get(op.contractId)?.businessId===owner||run.operations.contracts.some(c=>c.id===op.contractId&&c.businessId===owner))
  if(kind==='pay_obligation')insist(owed&&owed.scopeBusinessId===owner&&owed.accountId===receipt.accountId)
  if(typeof op.referenceId==='string'&&['reverse_supplier_usage','settle_supplier_credit'].includes(kind)){const previous=operations.find(r=>r.id===op.referenceId);insist(previous&&previous.scopeBusinessId===owner&&previous.prepaymentId===op.prepaymentId&&['consume_supplier','incur_supplier_usage'].includes(previous.kind))}
  bind(operationOwners,receipt.id,owner)
  const text=(key:string)=>typeof op[key]==='string'?op[key] as string:null
  operations.push({id:receipt.id,kind,status:receipt.status,order,date:String(op.date),accountId:receipt.accountId,businessId:text('businessId'),scopeBusinessId:owner,contractId:text('contractId'),sourceEventId:String(op.sourceEventId),referenceId:text('referenceId'),amountFen:typeof op.amountFen==='number'?op.amountFen:null,prepaymentId:text('prepaymentId'),obligationId:text('obligationId'),dueAt:text('dueAt'),reservationId:text('reservationId'),originId:text('originId'),newOriginId:text('newOriginId'),counterpartyId:text('counterpartyId'),targetAccountId:text('targetAccountId'),bucket:text('bucket'),settlement:text('settlement')})
 }
 const operationIndex=index(operations,o=>o.id)
 for(const [id,owner]of operationOwners)insist(operationIndex.get(id)?.scopeBusinessId===owner&&receipts.has(id))
 const transactions:RelayCasebookTransaction[]=[];index(run.economy.ledger.transactions,t=>t.id)
 for(let order=0;order<run.economy.ledger.transactions.length;order++){const t=run.economy.ledger.transactions[order]!,op=operationIndex.get(t.id);if(!op)continue;insist(date(t.date)&&t.date<=today&&t.date===op.date&&t.sourceEventId===op.sourceEventId);const b=businesses.get(op.scopeBusinessId)!,owed=op.obligationId?ownObligations.get(op.obligationId):undefined;insist(t.businessId===(owed?.businessId??op.businessId)&&t.contractId===(owed?.contractId??op.contractId))
  insist(['supplier_prepay','refund_supplier','receive_prepayment','collect_receivable','refund_undelivered','refund_delivered','expense','due_expense','pay_obligation','owner_transfer','borrow_cash'].includes(op.kind)&&!(op.kind==='refund_delivered'&&op.settlement==='receivable'))
  if(op.obligationId&&['pay_obligation','due_expense','refund_undelivered','refund_delivered'].includes(op.kind))insist(t.referenceId===op.obligationId)
  if(op.kind==='collect_receivable')insist(t.referenceId===op.contractId)
  for(let lineIndex=0;lineIndex<t.lines.length;lineIndex++){const line=t.lines[lineIndex]!;if(line.accountId!==b.accountId&&!(op.kind==='owner_transfer'&&line.accountId==='personal'))continue;insist(Number.isSafeInteger(line.deltaFen)&&Math.abs(line.deltaFen)<=MONEY_LIMIT);transactions.push({id:t.id,order,lineIndex,date:t.date,accountId:line.accountId,amountFen:line.deltaFen,scopeBusinessId:b.id,businessId:t.businessId,contractId:t.contractId,sourceId:t.sourceEventId,referenceId:t.referenceId})}
 }
 for(const r of recharges)insist(operationIndex.get(r.operationId)?.kind==='receive_prepayment'&&operationIndex.get(r.operationId)?.contractId===r.customerId&&operationIndex.get(r.operationId)?.amountFen===r.amountFen&&transactions.some(t=>t.id===r.operationId&&t.accountId===r.accountId&&t.amountFen===r.amountFen))
 for(const r of collections)insist(operationIndex.get(r.operationId)?.kind==='collect_receivable'&&operationIndex.get(r.operationId)?.sourceEventId===r.receivableId&&operationIndex.get(r.operationId)?.amountFen===r.amountFen&&transactions.some(t=>t.id===r.operationId&&t.accountId===r.accountId&&t.amountFen===r.amountFen))
 for(const invoice of invoices.values())insist(collections.filter(c=>c.receivableId===invoice.id).reduce((n,c)=>n+c.amountFen,0)===invoice.collectedFen)
 return {status:'ready',reason:null,runId:run.runId,revision:run.revision,asOf:today,recharges,collections,renewals,obligationHistory,transactions,actions,operations}
}
