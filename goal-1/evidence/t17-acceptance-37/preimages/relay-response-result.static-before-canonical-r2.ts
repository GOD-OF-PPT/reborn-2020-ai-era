import type {PlayingView,PlayFeatures} from './game-types.ts'
import {relayId} from '../core/relay.ts'
import {moneyText} from './game-text.ts'

const one=<T>(rows:readonly T[])=>rows.length===1?rows[0]:undefined
const features=(view:PlayingView)=>view.features as unknown as PlayFeatures

/** A cash echo is tied to the newly committed original operation, never to a positive balance alone. */
export function relayResponseSceneResult(kind:string,previous:PlayingView|null,current:PlayingView):string|null{
 const receipt=current.receipts.at(-1)
 if(!previous||previous.runId!==current.runId||current.saveStatus!=='saved'||current.hasCandidate||current.revision!==previous.revision+1||receipt?.kind!==kind||receipt.revisionAfter!==current.revision)return null
 const before=features(previous).relay,after=features(current).relay
 if(!before||!after)return null
 const id=relayId(receipt.commandId,kind)
 if(kind==='CorrectRelayUsage'){
  const correction=one(after.corrections.filter(c=>c.id===id&&!before.corrections.some(old=>old.id===c.id)))
  const meter=correction?one(after.meters.filter(m=>m.id===correction.meterId)):undefined,old=meter?one(before.meters.filter(m=>m.id===meter.id)):undefined
  const audit=correction?one(before.audits.filter(a=>a.id===correction.auditId&&a.meterId===correction.meterId&&a.completedAt!==null&&a.completedAt<=previous.date)):undefined
  if(!correction||!meter||!old||!audit||audit.actualUnits===null||audit.actualUnits!==correction.correctUnits||old.auditedUnits!==correction.correctUnits||meter.correctionId!==correction.id||old.correctionId!==null||meter.reportedUnits!==old.reportedUnits||meter.termsId!==old.termsId||meter.rateId!==old.rateId||meter.unitPriceFen!==old.unitPriceFen||meter.unitCostFen!==old.unitCostFen)return null
  return `这一张原票已按实际完成的复核追加更正：客户收入调整${moneyText(correction.customerDeltaFen)}，供应成本调整${moneyText(correction.supplierDeltaFen)}。原报告与原价都保留；更正不是收钱，新增应收应付按自己的原日期继续。`
 }
 const oldBook=before.casebook,book=after.casebook
 if(oldBook?.status!=='ready'||book?.status!=='ready'||oldBook.runId!==previous.runId||oldBook.revision!==previous.revision||oldBook.asOf!==previous.date||book.runId!==current.runId||book.revision!==current.revision||book.asOf!==current.date||current.date!==previous.date||JSON.stringify(current.budget)!==JSON.stringify(previous.budget))return null
 if(kind==='CollectRelayReceivable'){
  const collected=one(book.collections.filter(c=>c.id===id&&!oldBook.collections.some(old=>old.id===c.id))),invoice=collected?one(after.receivables.filter(i=>i.id===collected.receivableId)):undefined,old=invoice?one(before.receivables.filter(i=>i.id===invoice.id)):undefined
  const customer=invoice?one(after.customers.filter(c=>c.id===invoice.customerId)):undefined,oldCustomer=customer?one(before.customers.filter(c=>c.id===customer.id)):undefined
  const business=customer?one(after.businesses.filter(b=>b.id===customer.businessId)):undefined,oldBusiness=business?one(before.businesses.filter(b=>b.id===business.id)):undefined
  if(!collected||!invoice||!old||!customer||!oldCustomer||!business||!oldBusiness||invoice.collectedFen-old.collectedFen!==collected.amountFen||invoice.amountFen!==old.amountFen||invoice.reversedFen!==old.reversedFen||invoice.customerId!==old.customerId||invoice.dueAt!==old.dueAt||invoice.sourceId!==old.sourceId||invoice.dueAt>current.date||customer.balance.recognizedIncomeFen!==oldCustomer.balance.recognizedIncomeFen||business.funds.cashFen-oldBusiness.funds.cashFen!==collected.amountFen)return null
  const cash=book.transactions.filter(t=>t.id===collected.operationId&&t.accountId===business.accountId),operation=one(book.operations.filter(o=>o.id===collected.operationId&&o.kind==='collect_receivable'&&o.scopeBusinessId===business.id&&o.contractId===customer.id&&o.sourceEventId===invoice.id))
  if(cash.length!==1||cash[0]!.amountFen!==collected.amountFen||cash[0]!.scopeBusinessId!==business.id||cash[0]!.contractId!==customer.id||cash[0]!.sourceId!==invoice.id||!operation||operation.amountFen!==collected.amountFen)return null
  const remaining=invoice.amountFen-invoice.collectedFen-invoice.reversedFen,number=after.customers.filter(c=>c.businessId===business.id).findIndex(c=>c.id===customer.id)+1
  return `客户${number}这一张原单实际到账${moneyText(collected.amountFen)}，进入原中转账户；本单净未收还剩${moneyText(remaining)}。其它原单继续保留，这笔回款没有再确认一遍收入，也没有使用新的行动点。`
 }
 if(kind==='RefundRelayBalance'){
  const refund=one(after.refunds.filter(r=>r.id===id&&!before.refunds.some(old=>old.id===r.id))),customer=refund?one(after.customers.filter(c=>c.id===refund.customerId)):undefined,oldCustomer=customer?one(before.customers.filter(c=>c.id===customer.id)):undefined
  const business=customer?one(after.businesses.filter(b=>b.id===customer.businessId)):undefined,oldBusiness=business?one(before.businesses.filter(b=>b.id===business.id)):undefined
  if(!refund||!customer||!oldCustomer||!business||!oldBusiness||new Set(refund.operationIds).size!==refund.operationIds.length||oldCustomer.balance.prepaidFen-customer.balance.prepaidFen!==refund.amountFen||oldCustomer.balance.recognizedIncomeFen!==customer.balance.recognizedIncomeFen)return null
  const operations=book.operations.filter(o=>refund.operationIds.includes(o.id))
  if(operations.length!==refund.operationIds.length||operations.some(o=>o.kind!=='refund_undelivered'||o.scopeBusinessId!==business.id||o.accountId!==business.accountId||o.contractId!==customer.id))return null
  const cash=book.transactions.filter(t=>refund.operationIds.includes(t.id)&&t.accountId===business.accountId)
  if(cash.some(t=>t.scopeBusinessId!==business.id||t.contractId!==customer.id||t.amountFen>0))return null
  const paid=-cash.reduce((n,t)=>n+t.amountFen,0),owed=book.obligationHistory.filter(o=>refund.operationIds.includes(o.originOperationId)&&o.scopeBusinessId===business.id&&o.accountId===business.accountId).reduce((n,o)=>n+o.remainingFen,0)
  if(paid+owed!==refund.amountFen||oldBusiness.funds.cashFen-business.funds.cashFen!==paid)return null
  return `客户原款退款登记${moneyText(refund.amountFen)}已经保存；本次实际付出${moneyText(paid)}，仍待偿还的原退款${moneyText(owed)}。这位客户未消费保护余额还剩${moneyText(customer.balance.prepaidFen)}；退款释放保护没有变成利润，原支持与其它旧账继续。`
 }
 if(kind==='RefundRelaySupplier'){
  const operation=one(book.operations.filter(o=>o.id===relayId('supplier-refund',id)&&o.kind==='refund_supplier'&&!oldBook.operations.some(old=>old.id===o.id)))
  const business=operation?one(after.businesses.filter(b=>b.id===operation.scopeBusinessId)):undefined,oldBusiness=business?one(before.businesses.filter(b=>b.id===business.id)):undefined
  const option=operation?one(after.supplyOptions.filter(o=>o.businessId===operation.scopeBusinessId&&o.credit?.id===operation.prepaymentId)):undefined,oldOption=option?one(before.supplyOptions.filter(o=>o.businessId===option.businessId&&o.supplierId===option.supplierId)):undefined
  const supplier=option?one(after.catalog.suppliers.filter(s=>s.id===option.supplierId)):undefined
  if(!operation||operation.amountFen===null||operation.amountFen<=0||!business||!oldBusiness||!option?.credit||!oldOption?.credit||!supplier||oldOption.credit.remainingFen-option.credit.remainingFen!==operation.amountFen||business.funds.cashFen-oldBusiness.funds.cashFen!==operation.amountFen||business.metrics.incomeFen!==oldBusiness.metrics.incomeFen)return null
  const cash=book.transactions.filter(t=>t.id===operation.id&&t.accountId===business.accountId)
  if(cash.length!==1||cash[0]!.amountFen!==operation.amountFen||cash[0]!.scopeBusinessId!==business.id||cash[0]!.sourceId!==supplier.id)return null
  return `${supplier.label}的本站资产实际退回${moneyText(operation.amountFen)}；该供应仍留资产${moneyText(option.credit.remainingFen)}、未付${moneyText(option.outstandingFen)}。这是自有资金回到原账户，没有新增服务收入，也没有清掉客户保护或其它旧债。`
 }
 if(kind==='PayObligation'){
  const operations=book.operations.filter(o=>o.kind==='pay_obligation'&&!oldBook.operations.some(old=>old.id===o.id)),operation=one(operations),debt=operation?one(book.obligationHistory.filter(o=>o.id===operation.obligationId)):undefined,old=debt?one(oldBook.obligationHistory.filter(o=>o.id===debt.id)):undefined
  if(!operation||operation.amountFen===null||operation.amountFen<=0||!debt||!old||old.remainingFen-debt.remainingFen!==operation.amountFen||debt.scopeBusinessId!==operation.scopeBusinessId||debt.accountId!==operation.accountId)return null
  const cash=book.transactions.filter(t=>t.id===operation.id&&t.accountId===debt.accountId)
  if(cash.length!==1||cash[0]!.amountFen!==-operation.amountFen||cash[0]!.referenceId!==debt.id||cash[0]!.scopeBusinessId!==debt.scopeBusinessId)return null
  return `这一笔原义务实际支付${moneyText(operation.amountFen)}，仍剩${moneyText(debt.remainingFen)}关联原单。这里只偿还旧款，没有再确认一遍费用；其它客户保护、供应资产和未结事项仍按原记录继续。`
 }
 return null
}
