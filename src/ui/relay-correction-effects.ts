import type {GamePanelProps} from './game-types.ts'
import type {RelayCasebookHistory,RelayCasebookOperation,RelayCasebookObligation} from '../application/relay-casebook-projection.ts'
import {resolveRelaySceneTarget,type RelaySceneTarget} from './relay-scene-target.ts'
import {operatingId} from '../core/operations.ts'
import {relayId} from '../core/relay.ts'
import {MONEY_LIMIT} from '../core/money.ts'
import {moneyText} from './game-text.ts'

type Input=Pick<GamePanelProps,'view'|'features'|'accountId'>
type Relay=NonNullable<Input['features']['relay']>
type Correction=Relay['corrections'][number]
export interface RelayCorrectionSourceRef{
 readonly kind:'correction'|'meter'|'audit'|'period'|'customer'|'operation'|'metric'|'obligation'|'transaction'|'invoice'|'collection'|'recharge'|'pool'|'reservation'
 readonly id:string;readonly date:string|null;readonly accountId:string;readonly businessId:string;readonly amountFen?:number;readonly customerId?:string
}
export interface RelayCorrectionIdentity{
 readonly runId:string;readonly revision:number;readonly asOf:string;readonly businessId:string;readonly accountId:string;readonly stationId:string
 readonly periodId:string;readonly meterId:string;readonly auditId:string;readonly correctionId:string;readonly customerId:string;readonly supplierId:string|null
}
interface Side{
 readonly status:'known'|'unavailable';readonly reason:string|null;readonly summary:readonly string[];readonly lines:readonly string[];readonly sourceRefs:readonly RelayCorrectionSourceRef[]
}
export interface RelayCorrectionInvoiceEffect{
 readonly id:string;readonly operationId:string;readonly date:string;readonly dueAt:string;readonly amountFen:number;readonly collectedFen:number;readonly reversedFen:number;readonly remainingFen:number
}
export interface RelayCorrectionReversedInvoiceEffect extends RelayCorrectionInvoiceEffect{readonly reversalOperationId:string;readonly reversedByThisFen:number}
export interface RelayCorrectionRefundEffect{
 readonly operationId:string;readonly originalDeliveryId:string;readonly obligationId:string;readonly date:string;readonly registeredFen:number
 readonly initialCashPaidFen:number;readonly laterCashPaidFen:number;readonly totalCashPaidFen:number;readonly remainingFen:number;readonly protectionId:string;readonly currentProtectedFen:number
}
export interface RelayCorrectionCustomerEffects extends Side{
 readonly incomeDeltaFen:number|null;readonly prepaidConsumedFen:number|null;readonly receivableAddedFen:number|null;readonly receivableReversedFen:number|null
 readonly refundRegisteredFen:number|null;readonly refundInitiallyPaidFen:number|null;readonly refundLaterPaidFen:number|null;readonly refundPaidFen:number|null;readonly refundDueFen:number|null;readonly refundProtectedFen:number|null
 readonly invoices:readonly RelayCorrectionInvoiceEffect[];readonly reversedInvoices:readonly RelayCorrectionReversedInvoiceEffect[];readonly refunds:readonly RelayCorrectionRefundEffect[]
}
export interface RelayCorrectionExpenseEffect{
 readonly operationId:string;readonly referenceCostId:string|null;readonly poolId:string|null;readonly obligationId:string|null;readonly date:string;readonly dueAt:string|null
 readonly amountFen:number;readonly cashPaidFen:number;readonly creditSettledFen:number;readonly remainingFen:number
}
export interface RelayCorrectionSupplierReversal{
 readonly operationId:string;readonly referenceCostId:string;readonly poolId:string;readonly date:string;readonly sourceKind:'consume_supplier'|'incur_supplier_usage'
 readonly amountFen:number;readonly reducedUnpaidFen:number;readonly restoredAssetFen:number
}
export interface RelayCorrectionPoolEffect{readonly id:string;readonly paidFen:number;readonly currentRemainingFen:number;readonly label:'本站跨期共用'}
export interface RelayCorrectionSupplierEffects extends Side{
 readonly costDeltaFen:number|null;readonly expenseAddedFen:number|null;readonly cashPaidFen:number|null;readonly creditSettledFen:number|null;readonly dueFen:number|null
 readonly reversedFen:number|null;readonly reducedUnpaidFen:number|null;readonly restoredAssetFen:number|null
 readonly expenses:readonly RelayCorrectionExpenseEffect[];readonly reversals:readonly RelayCorrectionSupplierReversal[];readonly pools:readonly RelayCorrectionPoolEffect[]
}
export interface RelayCorrectionEffects{
 readonly status:'known'|'partial'|'unavailable';readonly reason:string|null;readonly identity:RelayCorrectionIdentity|null
 readonly customer:RelayCorrectionCustomerEffects;readonly supplier:RelayCorrectionSupplierEffects
 readonly summary:readonly string[];readonly lines:readonly string[];readonly sourceRefs:readonly RelayCorrectionSourceRef[]
}
const customerReason='该更正的原现金退还、客户余额或原单引用尚未核齐；未知部分不按零或已经结清处理。'
const supplierReason='该更正的供应冲账、资产恢复或原付款引用尚未唯一核齐；保留原调整，不猜现金或单条抵账金额。'
const unavailableCustomer=(reason=customerReason):RelayCorrectionCustomerEffects=>({status:'unavailable',reason,summary:[reason],lines:[reason],sourceRefs:[],incomeDeltaFen:null,prepaidConsumedFen:null,receivableAddedFen:null,receivableReversedFen:null,refundRegisteredFen:null,refundInitiallyPaidFen:null,refundLaterPaidFen:null,refundPaidFen:null,refundDueFen:null,refundProtectedFen:null,invoices:[],reversedInvoices:[],refunds:[]})
const unavailableSupplier=(reason=supplierReason):RelayCorrectionSupplierEffects=>({status:'unavailable',reason,summary:[reason],lines:[reason],sourceRefs:[],costDeltaFen:null,expenseAddedFen:null,cashPaidFen:null,creditSettledFen:null,dueFen:null,reversedFen:null,reducedUnpaidFen:null,restoredAssetFen:null,expenses:[],reversals:[],pools:[]})
function result(identity:RelayCorrectionIdentity|null,customer:RelayCorrectionCustomerEffects,supplier:RelayCorrectionSupplierEffects,base:readonly RelayCorrectionSourceRef[]=[]):RelayCorrectionEffects{
 const status=customer.status==='known'&&supplier.status==='known'?'known':customer.status==='known'||supplier.status==='known'?'partial':'unavailable'
 return {status,reason:[customer.reason,supplier.reason].filter(Boolean).join('；')||null,identity,customer,supplier,summary:[...customer.summary,...supplier.summary],lines:[...base.map(ref=>'原来源 '+ref.kind+' · '+ref.id+' · '+(ref.date??'原记录日期')+'；原账户 '+ref.accountId+'；原企业 '+ref.businessId),...customer.lines,...supplier.lines],sourceRefs:[...base,...customer.sourceRefs,...supplier.sourceRefs]}
}
function insist(v:unknown):asserts v{if(!v)throw Error('CORRECTION_PUBLIC_SOURCE_MISMATCH')}
const money=(v:number)=>Number.isSafeInteger(v)&&v>=0&&v<=MONEY_LIMIT
const day=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v
function total(xs:readonly number[]){let n=0;for(const x of xs){insist(Number.isSafeInteger(x)&&Math.abs(x)<=MONEY_LIMIT);n+=x;insist(Number.isSafeInteger(n)&&Math.abs(n)<=MONEY_LIMIT)}return n}
function one<T>(xs:readonly T[]):T{insist(xs.length===1);return xs[0]!}
function index<T>(xs:readonly T[],key:(x:T)=>string){const m=new Map<string,T>();for(const x of xs){const id=key(x);insist(id.length>0&&!m.has(id));m.set(id,x)}return m}
interface Context{
 relay:Relay;book:RelayCasebookHistory;correction:Correction;meter:Relay['meters'][number];identity:RelayCorrectionIdentity
 finance:Input['features']['workbench']['finance'][number];operations:Map<string,RelayCasebookOperation>;debts:Map<string,RelayCasebookObligation>;operationSides:Map<string,'customer'|'supplier'>
}
const owns=(c:Context,r:{scopeBusinessId:string;accountId:string})=>r.scopeBusinessId===c.identity.businessId&&r.accountId===c.identity.accountId
function operation(c:Context,id:string){const o=c.operations.get(id);insist(o&&owns(c,o)&&o.businessId===c.identity.businessId&&Number.isSafeInteger(o.order)&&o.order>=0&&day(o.date)&&o.date<=c.identity.asOf&&o.amountFen!==null&&money(o.amountFen)&&o.amountFen>0);return o}
function sideOperations(c:Context,side:'customer'|'supplier'){return c.correction.operationIds.filter(id=>c.operationSides.get(id)===side).map(id=>operation(c,id))}
function atCorrection(c:Context,o:RelayCasebookOperation){insist(o.sourceEventId===c.identity.meterId&&o.date===c.correction.date)}
function metric(c:Context,o:RelayCasebookOperation,kind:'income'|'cost',delta:number){
 const m=one(c.finance.metrics.filter(m=>m.operationId===o.id&&m.kind===kind))
 insist(m.accountId===c.identity.accountId&&m.businessId===c.identity.businessId&&m.contractId===o.contractId&&m.referenceId===(o.referenceId??o.contractId)&&m.date===o.date&&m.sourceEventId===o.sourceEventId&&m.deltaFen===delta)
 return m
}
function references(c:Context){
 const sourceRefs:RelayCorrectionSourceRef[]=[],lines:string[]=[]
 const ref=(kind:RelayCorrectionSourceRef['kind'],id:string,date:string|null,amountFen?:number)=>sourceRefs.push({kind,id,date,accountId:c.identity.accountId,businessId:c.identity.businessId,customerId:c.identity.customerId,...(amountFen===undefined?{}:{amountFen})})
 const op=(o:RelayCasebookOperation)=>{ref('operation',o.id,o.date,o.amountFen??undefined);lines.push('原操作 '+o.id+' · '+o.kind+' · '+o.date+'；原账户 '+o.accountId+'；原来源 '+o.sourceEventId+'；原引用 '+(o.referenceId??'无')+'；原义务 '+(o.obligationId??'无')+'；原池 '+(o.prepaymentId??'无')+(o.amountFen===null?'':'；原额 '+moneyText(o.amountFen)))}
 return {sourceRefs,lines,ref,op}
}
type Refs=ReturnType<typeof references>
function payments(c:Context,origin:RelayCasebookOperation,debt:RelayCasebookObligation,refs:Refs,allowCredit:boolean){
 insist(owns(c,debt)&&debt.businessId===c.identity.businessId&&debt.accountId===origin.accountId&&debt.originOperationId===origin.id&&debt.contractId===origin.contractId&&debt.sourceEventId===origin.sourceEventId&&money(debt.amountFen)&&debt.amountFen===origin.amountFen&&money(debt.remainingFen)&&debt.remainingFen<=debt.amountFen&&day(debt.date))
 const direct=c.book.transactions.filter(t=>t.id===origin.id&&t.accountId===origin.accountId),later=c.book.operations.filter(o=>o.kind==='pay_obligation'&&o.obligationId===debt.id),credits=c.book.operations.filter(o=>o.kind==='settle_supplier_credit'&&o.obligationId===debt.id)
 insist(direct.length<=1&&(origin.kind==='refund_delivered'||direct.length===0)&&(!credits.length||allowCredit))
 let initiallyPaid=0,laterPaid=0,credit=0
 for(const t of direct){insist(owns(c,t)&&t.businessId===debt.businessId&&t.contractId===debt.contractId&&t.referenceId===debt.id&&t.sourceId===origin.sourceEventId&&t.date===origin.date&&t.amountFen<0&&money(-t.amountFen)&&-t.amountFen<=debt.amountFen);initiallyPaid+=-t.amountFen;refs.ref('transaction',t.id,t.date,t.amountFen);refs.lines.push('原退款实际现金 '+t.id+' · '+t.date+' · '+moneyText(t.amountFen)+'；原义务引用 '+t.referenceId+'；原来源 '+t.sourceId)}
 for(const o of later){
  const manual=o.id===operatingId(o.sourceEventId,'PayObligation'),automatic=allowCredit&&o.sourceEventId===origin.id&&o.date===debt.date&&o.id===relayId('supplier-payment',relayId('supplier_due',origin.id,debt.date))
  insist(owns(c,o)&&(o.businessId===null||o.businessId===debt.businessId)&&o.contractId===null&&(manual||automatic)&&o.order>origin.order&&day(o.date)&&o.date>=origin.date&&o.date<=c.identity.asOf&&o.amountFen!==null&&money(o.amountFen)&&o.amountFen>0)
  const t=one(c.book.transactions.filter(t=>t.id===o.id&&t.accountId===o.accountId))
  insist(owns(c,t)&&t.businessId===debt.businessId&&t.contractId===debt.contractId&&t.referenceId===debt.id&&t.sourceId===o.sourceEventId&&t.date===o.date&&t.amountFen===-o.amountFen)
  insist(!c.finance.metrics.some(m=>m.operationId===o.id));laterPaid=total([laterPaid,o.amountFen]);refs.op(o);refs.ref('transaction',t.id,t.date,t.amountFen);refs.lines.push('后续原付款现金 '+t.id+' · '+t.date+' · '+moneyText(t.amountFen)+'；原义务引用 '+debt.id+'；原命令来源 '+t.sourceId)
 }
 for(const o of credits){
  insist(allowCredit&&owns(c,o)&&o.businessId===debt.businessId&&o.contractId===null&&o.referenceId===origin.id&&o.prepaymentId===origin.prepaymentId&&o.sourceEventId===origin.id&&o.id===relayId('supplier-credit-offset',relayId('supplier_due',origin.id,debt.date))&&o.date===debt.date&&o.order>origin.order&&day(o.date)&&o.date>=origin.date&&o.date<=c.identity.asOf&&o.amountFen!==null&&money(o.amountFen)&&o.amountFen>0)
  insist(!c.book.transactions.some(t=>t.id===o.id)&&!c.finance.metrics.some(m=>m.operationId===o.id));credit=total([credit,o.amountFen]);refs.op(o)
 }
 const paid=total([initiallyPaid,laterPaid]);insist(total([paid,credit,debt.remainingFen])<=debt.amountFen)
 refs.ref('obligation',debt.id,debt.date,debt.remainingFen);refs.lines.push('原义务 '+debt.id+' · '+debt.date+'；原额 '+moneyText(debt.amountFen)+'；当前余欠 '+moneyText(debt.remainingFen)+'；原来源 '+debt.sourceEventId+'；原成本/退款操作 '+debt.originOperationId)
 return {initiallyPaid,laterPaid,paid,credit,remaining:debt.remainingFen}
}
function invoiceEffect(c:Context,id:string,refs:Refs):RelayCorrectionInvoiceEffect{
 const r=one(c.relay.receivables.filter(r=>r.id===id)),remaining=r.amountFen-r.collectedFen-r.reversedFen
 insist(r.customerId===c.identity.customerId&&r.sourceId===c.identity.meterId&&day(r.date)&&r.date<=c.identity.asOf&&day(r.dueAt)&&r.dueAt>=r.date&&[r.amountFen,r.collectedFen,r.reversedFen,remaining].every(money))
 const collections=c.book.collections.filter(v=>v.receivableId===r.id)
 insist(total(collections.map(v=>v.amountFen))===r.collectedFen)
 for(const v of collections){const o=operation(c,v.operationId),t=one(c.book.transactions.filter(t=>t.id===o.id&&t.accountId===c.identity.accountId));insist(owns(c,v)&&v.customerId===r.customerId&&v.amountFen>0&&o.kind==='collect_receivable'&&o.sourceEventId===r.id&&o.contractId===r.customerId&&o.amountFen===v.amountFen&&o.date===v.date&&v.date>=r.dueAt&&owns(c,t)&&t.businessId===c.identity.businessId&&t.contractId===r.customerId&&t.sourceId===r.id&&t.referenceId===r.customerId&&t.date===v.date&&t.amountFen===v.amountFen);refs.op(o);refs.ref('collection',v.id,v.date,v.amountFen);refs.ref('transaction',t.id,t.date,t.amountFen);refs.lines.push('原收据 '+v.id+'；原单 '+r.id+'；现金 '+t.id+' · '+t.date+' · '+moneyText(t.amountFen)+'；原客户引用 '+t.referenceId+'；回款不重复确认收入。')}
 return {id:r.id,operationId:r.operationId,date:r.date,dueAt:r.dueAt,amountFen:r.amountFen,collectedFen:r.collectedFen,reversedFen:r.reversedFen,remainingFen:remaining}
}
function customerEffects(c:Context):RelayCorrectionCustomerEffects{
 insist(Number.isSafeInteger(c.correction.customerDeltaFen)&&Math.abs(c.correction.customerDeltaFen)<=MONEY_LIMIT&&c.correction.customerDeltaFen===(c.correction.correctUnits-c.correction.originalReportedUnits)*c.meter.unitPriceFen)
 const refs=references(c),ops=sideOperations(c,'customer'),invoices:RelayCorrectionInvoiceEffect[]=[],reversedInvoices:RelayCorrectionReversedInvoiceEffect[]=[],refunds:RelayCorrectionRefundEffect[]=[],summary:string[]=[]
 insist(ops.every(o=>['deliver_prepaid','deliver_on_credit','refund_delivered'].includes(o.kind)))
 let prepaidConsumedFen=0,receivableAddedFen=0,receivableReversedFen=0
 for(const o of ops){
  atCorrection(c,o);insist(o.contractId===c.identity.customerId&&o.amountFen!==null);metric(c,o,'income',o.kind==='refund_delivered'?-o.amountFen:o.amountFen);refs.op(o);refs.ref('metric',o.id,o.date,o.kind==='refund_delivered'?-o.amountFen:o.amountFen)
  if(o.kind==='deliver_prepaid'){
   const recharge=one(c.book.recharges.filter(r=>r.operationId===o.referenceId&&r.customerId===c.identity.customerId));insist(owns(c,recharge)&&o.id===relayId('prepaid-use',relayId('correction',c.correction.id),recharge.id)&&recharge.date<=o.date&&recharge.usedFen>=o.amountFen&&recharge.usedFen+recharge.refundedFen<=recharge.amountFen&&!c.book.transactions.some(t=>t.id===o.id));const received=operation(c,recharge.operationId),cash=one(c.book.transactions.filter(t=>t.id===received.id&&t.accountId===c.identity.accountId));insist(received.kind==='receive_prepayment'&&received.contractId===c.identity.customerId&&received.sourceEventId===c.identity.customerId&&received.date===recharge.date&&received.amountFen===recharge.amountFen&&owns(c,cash)&&cash.contractId===c.identity.customerId&&cash.sourceId===received.sourceEventId&&cash.date===received.date&&cash.amountFen===received.amountFen);refs.op(received);prepaidConsumedFen=total([prepaidConsumedFen,o.amountFen]);refs.ref('recharge',recharge.id,recharge.date,o.amountFen);refs.lines.push('原充值 '+recharge.id+'；原入款操作 '+recharge.operationId+'；该更正确认消费原款 '+moneyText(o.amountFen)+'，不是新现金收取。')
  }else if(o.kind==='deliver_on_credit'){
   const raw=one(c.relay.receivables.filter(r=>r.operationId===o.id)),r=invoiceEffect(c,raw.id,refs);insist(o.id===relayId('credit-use',relayId('correction',c.correction.id))&&r.amountFen===o.amountFen&&r.date===o.date&&!c.book.transactions.some(t=>t.id===o.id));invoices.push(r);receivableAddedFen=total([receivableAddedFen,o.amountFen]);refs.ref('invoice',r.id,r.date,r.amountFen);summary.push('该更正新增原应收 '+moneyText(r.amountFen)+'；'+r.date+'开单 / '+r.dueAt+'到期；当前净未收 '+moneyText(r.remainingFen)+'。');refs.lines.push('新增原单 '+r.id+'；原开单 '+r.date+'；原到期 '+r.dueAt+'；原额 '+moneyText(r.amountFen)+'；累计已收 '+moneyText(r.collectedFen)+'；累计冲回 '+moneyText(r.reversedFen)+'；净未收 '+moneyText(r.remainingFen))
  }else{
   insist(o.referenceId!==null&&c.meter.deliveryIds.includes(o.referenceId));const delivery=operation(c,o.referenceId);insist(['deliver_prepaid','deliver_on_credit'].includes(delivery.kind)&&delivery.contractId===c.identity.customerId&&delivery.sourceEventId===c.identity.meterId&&delivery.order<o.order&&delivery.date<=o.date&&delivery.amountFen!==null&&delivery.amountFen>=o.amountFen&&o.id===relayId(o.settlement==='cash'?'cash-reversal':'credit-reversal',c.correction.id,delivery.id));metric(c,delivery,'income',delivery.amountFen);refs.op(delivery)
   if(o.settlement==='receivable'){
    insist(o.obligationId===null&&!c.book.transactions.some(t=>t.id===o.id));const raw=one(c.relay.receivables.filter(r=>r.operationId===delivery.id)),r=invoiceEffect(c,raw.id,refs);insist(r.amountFen===delivery.amountFen&&r.reversedFen>=o.amountFen);reversedInvoices.push({...r,reversalOperationId:o.id,reversedByThisFen:o.amountFen});receivableReversedFen=total([receivableReversedFen,o.amountFen]);refs.ref('invoice',r.id,r.date,o.amountFen);refs.lines.push('原被冲回应收 '+r.id+'；原入账操作 '+r.operationId+'；开单 '+r.date+'；到期 '+r.dueAt+'；本条冲回 '+moneyText(o.amountFen)+'；累计冲回 '+moneyText(r.reversedFen)+'；净未收 '+moneyText(r.remainingFen));summary.push('该更正冲回原未收 '+moneyText(o.amountFen)+'；原单 '+r.date+'开单 / '+r.dueAt+'到期，当前净未收 '+moneyText(r.remainingFen)+'；没有因此退现金。')
   }else{
    insist(o.settlement==='cash'&&o.obligationId!==null&&o.reservationId!==null);const debt=c.debts.get(o.obligationId);insist(debt&&debt.kind==='refund_delivered'&&debt.date===o.date&&debt.protectionReservationId===o.reservationId)
    const paid=payments(c,o,debt,refs,false),protections=c.finance.reservations.filter(r=>r.id===o.reservationId);insist(paid.paid+paid.remaining===o.amountFen&&protections.length<=1)
    const protection=protections[0]
    // Workbench publishes positive reservations. A fully paid original debt
    // can have no row here; that does not disclose a historical release state.
    if(debt.remainingFen>0)insist(protection&&protection.accountId===c.identity.accountId&&protection.originId===debt.id&&protection.kind==='customer_protection'&&protection.amountFen===debt.remainingFen&&protection.status==='active')
    else if(protection)insist(protection.accountId===c.identity.accountId&&protection.originId===debt.id&&protection.kind==='customer_protection'&&protection.amountFen===0&&protection.status==='released')
    refunds.push({operationId:o.id,originalDeliveryId:delivery.id,obligationId:debt.id,date:o.date,registeredFen:o.amountFen,initialCashPaidFen:paid.initiallyPaid,laterCashPaidFen:paid.laterPaid,totalCashPaidFen:paid.paid,remainingFen:paid.remaining,protectionId:o.reservationId,currentProtectedFen:debt.remainingFen});refs.ref('reservation',o.reservationId,null,debt.remainingFen)
    refs.lines.push('原退款保护引用 '+o.reservationId+'；当前原退款未付保护 '+moneyText(debt.remainingFen)+(protection?'；沿该原引用核对当前公开行。':'；当前正额占款列表没有此项，现金与原义务余欠已核齐；不推断历史释放状态。'))
   }
  }
 }
 const delta=total(ops.map(o=>o.kind==='refund_delivered'?-o.amountFen!:o.amountFen!));insist(delta===c.correction.customerDeltaFen)
 if(delta>0)insist(ops.every(o=>o.kind!=='refund_delivered'));if(delta<0)insist(ops.every(o=>o.kind==='refund_delivered'));if(delta===0)insist(ops.length===0)
 const registered=total(refunds.map(r=>r.registeredFen)),initial=total(refunds.map(r=>r.initialCashPaidFen)),later=total(refunds.map(r=>r.laterCashPaidFen)),paid=total(refunds.map(r=>r.totalCashPaidFen)),due=total(refunds.map(r=>r.remainingFen)),protectedFen=total(refunds.map(r=>r.currentProtectedFen))
 if(refunds.length)summary.unshift('该更正登记退还已消费多计原款 '+moneyText(registered)+'；累计实际退 '+moneyText(paid)+'，当前尚欠 '+moneyText(due)+'；这是现金退款，不是退回充值余额。')
 if(prepaidConsumedFen>0)summary.push('该更正从原客户未消费款确认收入 '+moneyText(prepaidConsumedFen)+'；相应原保护款被消费，没有新现金收取。')
 if(delta===0)summary.push('该更正客户收入调整为 '+moneyText(0)+'，没有新增应收、现金退款或原预款消费。')
 if(delta>0)summary.push('该更正客户收入调整 '+moneyText(delta)+'；收款仍沿原单实际发生，不重复确认收入。')
 if(protectedFen>0)summary.push('该更正未付退款对应的原保护 '+moneyText(protectedFen)+'仍保留，其它客户原保护另核。')
 return {status:'known',reason:null,summary,lines:refs.lines,sourceRefs:refs.sourceRefs,incomeDeltaFen:delta,prepaidConsumedFen,receivableAddedFen,receivableReversedFen,refundRegisteredFen:registered,refundInitiallyPaidFen:initial,refundLaterPaidFen:later,refundPaidFen:paid,refundDueFen:due,refundProtectedFen:protectedFen,invoices,reversedInvoices,refunds}
}
function supplierEffects(c:Context):RelayCorrectionSupplierEffects{
 insist(Number.isSafeInteger(c.correction.supplierDeltaFen)&&Math.abs(c.correction.supplierDeltaFen)<=MONEY_LIMIT&&c.correction.supplierDeltaFen===(c.correction.correctUnits-c.correction.originalReportedUnits)*c.meter.unitCostFen)
 const refs=references(c),ops=sideOperations(c,'supplier'),expenses:RelayCorrectionExpenseEffect[]=[],reversals:RelayCorrectionSupplierReversal[]=[],summary:string[]=[],pools:RelayCorrectionPoolEffect[]=[]
 insist(ops.every(o=>['consume_supplier','incur_supplier_usage','reverse_supplier_usage'].includes(o.kind)))
 for(const o of ops){
  atCorrection(c,o);insist(o.id===relayId('supplier-correction',c.correction.id)&&o.contractId===null&&o.amountFen!==null&&o.prepaymentId!==null&&c.identity.supplierId!==null);metric(c,o,'cost',o.kind==='reverse_supplier_usage'?-o.amountFen:o.amountFen);refs.op(o);refs.ref('metric',o.id,o.date,o.kind==='reverse_supplier_usage'?-o.amountFen:o.amountFen)
  const pool=one(c.relay.supplyOptions.filter(s=>s.businessId===c.identity.businessId&&s.supplierId===c.identity.supplierId)),credit=pool.credit
  if(credit){insist(credit.id===o.prepaymentId&&credit.accountId===c.identity.accountId&&credit.businessId===c.identity.businessId&&money(credit.paidFen)&&money(credit.remainingFen));if(!pools.some(p=>p.id===credit.id))pools.push({id:credit.id,paidFen:credit.paidFen,currentRemainingFen:credit.remainingFen,label:'本站跨期共用'});refs.ref('pool',credit.id,null,credit.remainingFen)}
  if(o.kind==='incur_supplier_usage'){
   insist(o.referenceId===(c.meter.costOperationId??c.meter.id));if(c.meter.costOperationId!==null){const source=operation(c,c.meter.costOperationId);insist(['consume_supplier','incur_supplier_usage'].includes(source.kind)&&source.prepaymentId===o.prepaymentId&&source.sourceEventId===c.meter.id&&source.order<o.order&&source.amountFen!==null);metric(c,source,'cost',source.amountFen);refs.op(source)}
   insist(o.obligationId!==null&&o.dueAt!==null);const debt=c.debts.get(o.obligationId);insist(debt&&debt.kind==='expense'&&debt.date===o.dueAt&&debt.protectionReservationId===null);const paid=payments(c,o,debt,refs,true),reverse=c.book.operations.filter(r=>r.kind==='reverse_supplier_usage'&&r.referenceId===o.id);insist(reverse.length===0&&paid.paid+paid.credit+paid.remaining===o.amountFen)
   expenses.push({operationId:o.id,referenceCostId:o.referenceId,poolId:o.prepaymentId,obligationId:debt.id,date:o.date,dueAt:debt.date,amountFen:o.amountFen,cashPaidFen:paid.paid,creditSettledFen:paid.credit,remainingFen:paid.remaining});summary.push('该更正新增供应成本 '+moneyText(o.amountFen)+'；'+o.date+'登记 / '+debt.date+'到期；原现金已付 '+moneyText(paid.paid)+'，原贷项抵付 '+moneyText(paid.credit)+'，当前尚欠 '+moneyText(paid.remaining)+'。')
  }else if(o.kind==='consume_supplier'){
   insist(credit&&!c.book.transactions.some(t=>t.id===o.id));expenses.push({operationId:o.id,referenceCostId:o.referenceId,poolId:o.prepaymentId,obligationId:null,date:o.date,dueAt:null,amountFen:o.amountFen,cashPaidFen:0,creditSettledFen:o.amountFen,remainingFen:0});summary.push('该更正实际消耗原供应资产 '+moneyText(o.amountFen)+'，不是另付一笔现金。')
  }else{
   insist(o.referenceId!==null&&o.referenceId===c.meter.costOperationId);const source=operation(c,o.referenceId);insist((source.kind==='consume_supplier'||source.kind==='incur_supplier_usage')&&source.sourceEventId===c.identity.meterId&&source.contractId===null&&source.prepaymentId===o.prepaymentId&&source.order<o.order&&source.date<=o.date&&source.amountFen!==null&&source.amountFen>=o.amountFen)
   const sameSource=c.book.operations.filter(r=>r.kind==='reverse_supplier_usage'&&r.referenceId===source.id);insist(sameSource.length===1&&sameSource[0]!.id===o.id);metric(c,source,'cost',source.amountFen);refs.op(source)
   let reducedUnpaidFen=0
   if(source.kind==='incur_supplier_usage'){
    insist(source.obligationId!==null);const debt=c.debts.get(source.obligationId);insist(debt&&debt.kind==='expense'&&debt.protectionReservationId===null&&debt.date===source.dueAt);const paid=payments(c,source,debt,refs,true)
    reducedUnpaidFen=source.amountFen-paid.paid-paid.credit-paid.remaining;insist(money(reducedUnpaidFen)&&reducedUnpaidFen<=o.amountFen)
   }else insist(credit)
   const restoredAssetFen=o.amountFen-reducedUnpaidFen;insist(money(restoredAssetFen)&&(!restoredAssetFen||credit)&&!c.book.transactions.some(t=>t.id===o.id))
   reversals.push({operationId:o.id,referenceCostId:source.id,poolId:o.prepaymentId,date:o.date,sourceKind:source.kind,amountFen:o.amountFen,reducedUnpaidFen,restoredAssetFen})
   summary.push('该更正冲减原供应未付 '+moneyText(reducedUnpaidFen)+'；恢复供应未用资产/贷项 '+moneyText(restoredAssetFen)+'，没有因此收到供应现金。')
  }
 }
 const delta=total(ops.map(o=>o.kind==='reverse_supplier_usage'?-o.amountFen!:o.amountFen!));insist(delta===c.correction.supplierDeltaFen)
 if(delta>0)insist(ops.every(o=>o.kind!=='reverse_supplier_usage'));if(delta<0)insist(ops.every(o=>o.kind==='reverse_supplier_usage'));if(delta===0)insist(ops.length===0)
 if(delta===0)summary.push('该更正供应成本调整为 '+moneyText(0)+'，没有新增供应应付或资产恢复。')
 for(const pool of pools){summary.push('该供应当前本站跨期未用资产/贷项 '+moneyText(pool.currentRemainingFen)+'；当前余额不全部归于这张更正。');refs.lines.push('本站供应池 '+pool.id+'；原池累计 '+moneyText(pool.paidFen)+'（含已付后贷项，不是现金充值总额）；当前未用 '+moneyText(pool.currentRemainingFen))}
 return {status:'known',reason:null,summary,lines:refs.lines,sourceRefs:refs.sourceRefs,costDeltaFen:delta,expenseAddedFen:total(expenses.map(e=>e.amountFen)),cashPaidFen:total(expenses.map(e=>e.cashPaidFen)),creditSettledFen:total(expenses.map(e=>e.creditSettledFen)),dueFen:total(expenses.map(e=>e.remainingFen)),reversedFen:total(reversals.map(r=>r.amountFen)),reducedUnpaidFen:total(reversals.map(r=>r.reducedUnpaidFen)),restoredAssetFen:total(reversals.map(r=>r.restoredAssetFen)),expenses,reversals,pools}
}

/** Reads committed public facts only. It neither predicts a settlement nor controls a command. */
export function relayCorrectionEffects(p:Input,target:RelaySceneTarget,correctionId:string):RelayCorrectionEffects{
 let c:Context
 try{
  const relay=p.features.relay,resolved=resolveRelaySceneTarget(relay,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations});insist(relay&&resolved.status==='valid'&&resolved.business&&resolved.station&&['business','customer','period'].includes(target.kind)&&p.view.accounts.filter(a=>a.accountId===p.accountId).length===1)
  index(relay.corrections,x=>x.id);index(relay.meters,x=>x.id);index(relay.audits,x=>x.id)
  const correction=one(relay.corrections.filter(x=>x.id===correctionId)),meter=one(relay.meters.filter(m=>m.id===correction.meterId)),period=one(relay.periods.filter(t=>t.id===meter.periodId&&t.businessId===resolved.business!.id)),customer=one(relay.customers.filter(t=>t.id===meter.customerId&&t.businessId===period.businessId)),audit=one(relay.audits.filter(a=>a.id===correction.auditId&&a.meterId===meter.id&&a.businessId===period.businessId))
  insist(day(p.view.date)&&day(correction.date)&&correction.date<=p.view.date&&audit.completedAt!==null&&day(audit.completedAt)&&audit.completedAt<=correction.date&&audit.actualUnits!==null&&audit.actualUnits===correction.correctUnits&&meter.auditedUnits===correction.correctUnits&&meter.reportedUnits===correction.originalReportedUnits&&meter.correctionId===correction.id&&period.customerIds.includes(customer.id))
  if(target.kind==='period')insist(target.periodId===period.id&&(target.meterId===undefined||target.meterId===meter.id)&&(target.jobId===undefined||resolved.audit?.jobId===audit.jobId));if(target.kind==='customer')insist(target.customerId===customer.id)
  const leaf:RelaySceneTarget={kind:'period',runId:target.runId,accountId:target.accountId,businessId:target.businessId,stationId:target.stationId,periodId:period.id,meterId:meter.id};insist(resolveRelaySceneTarget(relay,leaf,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations}).status==='valid')
  const auditTarget:RelaySceneTarget={kind:'period',runId:target.runId,accountId:target.accountId,businessId:target.businessId,stationId:target.stationId,periodId:period.id,jobId:audit.jobId},checkedAudit=resolveRelaySceneTarget(relay,auditTarget,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})
  insist(checkedAudit.status==='valid'&&checkedAudit.audit?.completed&&checkedAudit.job?.status==='completed'&&checkedAudit.job.completeAt===audit.completedAt&&checkedAudit.job.completeAt<=correction.date)
  const book=relay.casebook;insist(book?.status==='ready'&&book.runId===p.view.runId&&book.revision===p.view.revision&&book.asOf===p.view.date)
  const finance=one(p.features.workbench.finance.filter(f=>f.accountId===p.accountId)),operations=index(book.operations,o=>o.id),debts=index(book.obligationHistory,o=>o.id);index(book.transactions,t=>t.id+':'+t.lineIndex);index(correction.operationIds,id=>id)
  const identity:RelayCorrectionIdentity={runId:p.view.runId,revision:p.view.revision,asOf:p.view.date,businessId:period.businessId,accountId:p.accountId,stationId:resolved.station.id,periodId:period.id,meterId:meter.id,auditId:audit.id,correctionId:correction.id,customerId:customer.id,supplierId:meter.supplierId}
  const customerOperationIds=new Set([
   relayId('credit-use',relayId('correction',correction.id)),
   ...book.recharges.filter(r=>r.customerId===customer.id&&r.scopeBusinessId===period.businessId).map(r=>relayId('prepaid-use',relayId('correction',correction.id),r.id)),
   ...meter.deliveryIds.flatMap(id=>[relayId('credit-reversal',correction.id,id),relayId('cash-reversal',correction.id,id)]),
  ]),supplierOperationId=relayId('supplier-correction',correction.id),operationSides=new Map<string,'customer'|'supplier'>()
  for(const id of correction.operationIds){const known=operations.get(id);if(id===supplierOperationId||known&&['consume_supplier','incur_supplier_usage','reverse_supplier_usage'].includes(known.kind))operationSides.set(id,'supplier');else{insist(customerOperationIds.has(id)||known&&['deliver_prepaid','deliver_on_credit','refund_delivered'].includes(known.kind));operationSides.set(id,'customer')}}
  c={relay,book,correction,meter,identity,finance,operations,debts,operationSides}
 }catch{return result(null,unavailableCustomer(),unavailableSupplier())}
 let customer:RelayCorrectionCustomerEffects,supplier:RelayCorrectionSupplierEffects
 try{customer=customerEffects(c)}catch{customer=unavailableCustomer()}
 try{supplier=supplierEffects(c)}catch{supplier=unavailableSupplier()}
 const base:RelayCorrectionSourceRef[]=[['correction',c.correction.id,c.correction.date],['meter',c.meter.id,c.meter.date],['audit',c.correction.auditId,c.relay.audits.find(a=>a.id===c.correction.auditId)!.completedAt],['period',c.identity.periodId,null],['customer',c.identity.customerId,null]].map(([kind,id,date])=>({kind:kind as RelayCorrectionSourceRef['kind'],id:id!,date:date??null,accountId:c.identity.accountId,businessId:c.identity.businessId,customerId:c.identity.customerId}))
 return result(c.identity,customer,supplier,base)
}
