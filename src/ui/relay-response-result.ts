import type {PlayingView,PlayFeatures} from './game-types.ts'
import {relayId} from '../core/relay.ts'
import {operatingId} from '../core/operations.ts'
import {moneyText} from './game-text.ts'
import {relayTicketCorrection} from './relay-ticket-command.ts'
import {resolveRelaySceneTarget,type RelaySceneTarget} from './relay-scene-target.ts'
import {relayCorrectionEffects,type RelayCorrectionEffects} from './relay-correction-effects.ts'
import {MONEY_LIMIT} from '../core/money.ts'
import {isoDate,quarterOf} from '../core/calendar.ts'

const one=<T>(rows:readonly T[])=>rows.length===1?rows[0]:undefined
const features=(view:PlayingView)=>view.features as unknown as PlayFeatures

/** Only linked public effects supply the short echo; account deltas never assign its meaning. */
function correctionBrief(effects:readonly RelayCorrectionEffects[]):string{
 const parts:string[]=[]
 const total=(values:readonly (number|null)[])=>{
  if(values.some(n=>n===null||!Number.isSafeInteger(n)||n<0))return null
  const sum=values.reduce<number>((n,value)=>n+value!,0)
  return Number.isSafeInteger(sum)&&sum<=MONEY_LIMIT?sum:null
 }
 if(effects.every(e=>e.customer.status==='known')){
  const sides=effects.map(e=>e.customer),refund=total(sides.map(s=>s.refundRegisteredFen)),paid=total(sides.map(s=>s.refundPaidFen)),due=total(sides.map(s=>s.refundDueFen)),added=total(sides.map(s=>s.receivableAddedFen)),reversed=total(sides.map(s=>s.receivableReversedFen)),consumed=total(sides.map(s=>s.prepaidConsumedFen))
  if([refund,paid,due,added,reversed,consumed].every(n=>n!==null)){
   if(refund!>0)parts.push('原多计款实际退客户'+moneyText(paid!)+'，尚欠'+moneyText(due!))
   if(added!>0){const dates=[...new Set(sides.flatMap(s=>s.invoices.map(i=>i.dueAt)))];parts.push('新增原应收'+moneyText(added!)+(dates.length===1?'，'+dates[0]+'到期':'，各单按原到期日继续'))}
   if(reversed!>0)parts.push('冲回原未收'+moneyText(reversed!)+'，没有因此退现金')
   if(consumed!>0)parts.push('消费原受保护款'+moneyText(consumed!)+'，没有新现金收取')
  }else parts.push('客户原款去向尚待核齐')
 }else parts.push('客户原款去向尚待核齐')
 if(effects.every(e=>e.supplier.status==='known')){
  const sides=effects.map(e=>e.supplier),restored=total(sides.map(s=>s.restoredAssetFen)),reduced=total(sides.map(s=>s.reducedUnpaidFen)),added=total(sides.map(s=>s.expenseAddedFen)),paid=total(sides.map(s=>s.cashPaidFen)),credit=total(sides.map(s=>s.creditSettledFen)),due=total(sides.map(s=>s.dueFen))
  if([restored,reduced,added,paid,credit,due].every(n=>n!==null)){
   if(restored!>0)parts.push('恢复供应未用资产'+moneyText(restored!)+'（尚未变现金）')
   if(reduced!>0)parts.push('冲减原供应欠款'+moneyText(reduced!))
   if(added!>0)parts.push('供应更正成本'+moneyText(added!)+'，现金已付'+moneyText(paid!)+'、资产冲抵'+moneyText(credit!)+'、尚欠'+moneyText(due!))
  }else parts.push('供应原款去向尚待核齐')
 }else parts.push('供应原款去向尚待核齐')
 return parts.length?parts.join('；')+'。':''
}

/** A cash echo is tied to the newly committed original operation, never to a positive balance alone. */
export function relayResponseSceneResult(kind:string,previous:PlayingView|null,current:PlayingView):string|null{
 const receipt=current.receipts.at(-1)
 if(!previous||previous.runId!==current.runId||current.saveStatus!=='saved'||current.hasCandidate||current.readOnly||current.busy||current.revision!==previous.revision+1||receipt?.kind!==kind||receipt.revisionAfter!==current.revision)return null
 if(current.date!==previous.date||kind!=='StopRelayStation'&&JSON.stringify(current.budget)!==JSON.stringify(previous.budget))return null
 const before=features(previous).relay,after=features(current).relay
 if(!before||!after)return null
 const id=relayId(receipt.commandId,kind)
 if(kind==='CorrectRelayUsage'){
  const correction=one(after.corrections.filter(c=>c.id===id&&!before.corrections.some(old=>old.id===c.id)))
  const meter=correction?one(after.meters.filter(m=>m.id===correction.meterId)):undefined,old=meter?one(before.meters.filter(m=>m.id===meter.id)):undefined
  const audit=correction?one(before.audits.filter(a=>a.id===correction.auditId&&a.meterId===correction.meterId&&a.completedAt!==null&&a.completedAt<=previous.date)):undefined
  if(!correction||!meter||!old||!audit||correction.date!==current.date||audit.actualUnits===null||audit.actualUnits!==correction.correctUnits||old.auditedUnits!==correction.correctUnits||meter.correctionId!==correction.id||old.correctionId!==null||meter.periodId!==old.periodId||meter.customerId!==old.customerId||meter.reportedUnits!==old.reportedUnits||meter.termsId!==old.termsId||meter.rateId!==old.rateId||meter.unitPriceFen!==old.unitPriceFen||meter.unitCostFen!==old.unitCostFen)return null
  const period=one(before.periods.filter(p=>p.id===old.periodId)),business=period?one(before.businesses.filter(b=>b.id===period.businessId)):undefined,station=business?one(before.stations.filter(s=>s.businessId===business.id)):undefined
  if(!period||!business||!station||audit.businessId!==business.id)return null
  const target:RelaySceneTarget={kind:'period',runId:previous.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,periodId:period.id,meterId:meter.id}
  const checked=relayTicketCorrection({view:previous,features:features(previous),accountId:business.accountId},target,true).command
  if(checked?.payload.auditId!==audit.id||checked.payload.correctUnits!==correction.correctUnits||resolveRelaySceneTarget(after,target,{runId:current.runId,accountId:business.accountId,operations:current.operations}).status!=='valid')return null
  const effects=relayCorrectionEffects({view:current,features:features(current),accountId:business.accountId},target,correction.id)
  return correctionBrief([effects])+`这一张原票已按实际完成的复核追加更正：客户收入调整${moneyText(correction.customerDeltaFen)}，供应成本调整${moneyText(correction.supplierDeltaFen)}。原报告与原价都保留；新增应收应付按自己的原日期继续。`+effects.summary.join('；')
 }
 if(kind==='CorrectRelayPeriod'){
  const added=after.corrections.filter(c=>!before.corrections.some(old=>old.id===c.id))
  if(!added.length||new Set(added.map(c=>c.id)).size!==added.length)return null
  const checked=added.map(c=>{
   const old=one(before.meters.filter(m=>m.id===c.meterId)),meter=one(after.meters.filter(m=>m.id===c.meterId)),audit=one(before.audits.filter(a=>a.id===c.auditId&&a.meterId===c.meterId&&a.completedAt!==null&&a.completedAt<=previous.date))
   if(!old||!meter||!audit||c.id!==relayId('period-correction',id,c.meterId)||c.date!==current.date||old.correctionId!==null||meter.correctionId!==c.id||old.auditedUnits!==c.correctUnits||audit.actualUnits!==c.correctUnits||meter.periodId!==old.periodId||meter.customerId!==old.customerId||meter.reportedUnits!==old.reportedUnits||meter.termsId!==old.termsId||meter.rateId!==old.rateId||meter.unitPriceFen!==old.unitPriceFen||meter.unitCostFen!==old.unitCostFen)return null
   return {correction:c,old,audit}
  })
  if(checked.some(c=>c===null))return null
  const rows=checked.flatMap(c=>c?[c]:[]),periodIds=[...new Set(rows.map(r=>r.old.periodId))],period=periodIds.length===1?one(before.periods.filter(p=>p.id===periodIds[0])):undefined,business=period?one(before.businesses.filter(b=>b.id===period.businessId)):undefined,station=business?one(before.stations.filter(s=>s.businessId===business.id)):undefined
  if(!period||!business||!station||rows.some(r=>r.audit.businessId!==business.id))return null
  const target:RelaySceneTarget={kind:'period',runId:current.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,periodId:period.id}
  if(resolveRelaySceneTarget(after,target,{runId:current.runId,accountId:business.accountId,operations:current.operations}).status!=='valid')return null
  const financial=rows.filter(r=>r.correction.customerDeltaFen!==0||r.correction.supplierDeltaFen!==0),effects=financial.map(r=>relayCorrectionEffects({view:current,features:features(current),accountId:business.accountId},target,r.correction.id))
  return (effects.length?correctionBrief(effects):'')+`已按${rows.length}条原计量追加更正记录。原报告与价格仍保留；这里记下账目差额，不代表现金已经到账，应收应付继续按原账处理。`+effects.flatMap(e=>e.summary).join('；')
 }
 const oldBook=before.casebook,book=after.casebook
 if(oldBook?.status!=='ready'||book?.status!=='ready'||oldBook.runId!==previous.runId||oldBook.revision!==previous.revision||oldBook.asOf!==previous.date||book.runId!==current.runId||book.revision!==current.revision||book.asOf!==current.date)return null
 if(kind==='StopRelayStation'){
  const business=one(after.businesses.filter(b=>b.lifecycle==='winding_down'&&before.businesses.some(old=>old.id===b.id&&old.accountId===b.accountId&&old.lifecycle!=='winding_down'&&old.lifecycle!=='closed')))
  const old=business?one(before.businesses.filter(b=>b.id===business.id)):undefined,station=business?one(after.stations.filter(s=>s.businessId===business.id)):undefined,oldStation=business?one(before.stations.filter(s=>s.businessId===business.id)):undefined
  if(!business||!old||!station?.trafficPaused||station.id!==oldStation?.id||!previous.operations||!current.operations)return null
  const jobs=previous.operations.jobs.filter(j=>j.businessId===business.id&&['planned','running'].includes(j.status))
  if(jobs.some(j=>{
   const now=one(current.operations!.jobs.filter(row=>row.id===j.id&&row.businessId===business.id)),prior=one(oldBook.actions.filter(a=>a.jobId===j.id)),action=one(book.actions.filter(a=>a.jobId===j.id))
   return !now||now.status!==(j.status==='planned'?'cancelled':'interrupted')||!prior||!action||prior.scopeBusinessId!==business.id||action.scopeBusinessId!==business.id||prior.definition.id!==j.actionId||prior.definition.accountId!==business.accountId||action.definition.accountId!==business.accountId||JSON.stringify(prior.definition)!==JSON.stringify(action.definition)||action.executedAt!==prior.executedAt||action.status!==(j.status==='planned'?'cancelled':'interrupted')||(j.status==='planned'?(prior.status!=='reserved'||prior.executedAt!==null):(prior.status!=='executed'||prior.executedAt===null))
  }))return null
  let releasedPoints=0
  try{
   if(previous.budget.quarter!==quarterOf(isoDate(previous.date)))return null
   for(const job of jobs.filter(j=>j.status==='planned')){
    const action=one(oldBook.actions.filter(a=>a.jobId===job.id))!
    if(!Number.isSafeInteger(action.definition.actionPoints)||action.definition.actionPoints<0)return null
    if(quarterOf(isoDate(action.definition.startAt))===previous.budget.quarter)releasedPoints+=action.definition.actionPoints
   }
  }catch{return null}
  if(!Number.isSafeInteger(releasedPoints)||releasedPoints>previous.budget.reserved||current.budget.quarter!==previous.budget.quarter||current.budget.total!==previous.budget.total||current.budget.spent!==previous.budget.spent||current.budget.reserved!==previous.budget.reserved-releasedPoints||current.budget.available!==previous.budget.available+releasedPoints)return null
  const workers=previous.operations.workers.filter(w=>w.sponsorBusinessId===business.id&&w.to===null)
  if(workers.some(w=>current.operations!.workers.filter(now=>now.id===w.id&&now.sponsorBusinessId===business.id&&now.to===current.date).length!==1))return null
  const month=current.date.slice(0,7),expected=new Map<string,{entityId:string;kind:'maintenance'|'wage'}>([[operatingId('bill','maintenance',business.id,month),{entityId:business.id,kind:'maintenance'}],...workers.map(w=>[operatingId('bill','wage',w.id,month),{entityId:w.id,kind:'wage' as const}] as const)])
  const bills=current.operations.payroll.filter(p=>expected.has(p.id)&&!previous.operations!.payroll.some(old=>old.id===p.id))
  const money=(n:number)=>Number.isSafeInteger(n)&&n>=0&&n<=MONEY_LIMIT
  let paid=0,due=0
  const finance=one(features(current).workbench.finance.filter(f=>f.accountId===business.accountId)),billCashIds=new Set<string>()
  if(!finance)return null
  for(const bill of bills){
   const expectedBill=expected.get(bill.id)!
   if(bill.entityId!==expectedBill.entityId||bill.kind!==expectedBill.kind||bill.month!==month||bill.through!==current.date||!money(bill.amountFen))return null
   if(bill.amountFen===0){if(bill.operationId!==null)return null;continue}
   const operation=one(book.operations.filter(o=>o.id===bill.id)),debt=operation?one(book.obligationHistory.filter(o=>o.id===operation.obligationId)):undefined
   if(bill.operationId!==bill.id||!operation||operation.kind!=='due_expense'||oldBook.operations.some(o=>o.id===operation.id)||operation.accountId!==business.accountId||operation.scopeBusinessId!==business.id||operation.businessId!==business.id||operation.contractId!==null||operation.sourceEventId!==bill.entityId||operation.date!==current.date||operation.amountFen!==bill.amountFen||operation.obligationId!==operatingId('bill-due',bill.id)||!debt||debt.accountId!==business.accountId||debt.scopeBusinessId!==business.id||debt.businessId!==business.id||debt.contractId!==null||debt.kind!=='expense'||debt.originOperationId!==operation.id||debt.sourceEventId!==bill.entityId||debt.date!==current.date||debt.amountFen!==bill.amountFen||!money(debt.remainingFen))return null
   const metrics=finance.metrics.filter(m=>m.operationId===operation.id)
   if(metrics.length!==1||metrics[0]!.kind!=='cost'||metrics[0]!.accountId!==business.accountId||metrics[0]!.businessId!==business.id||metrics[0]!.contractId!==null||metrics[0]!.referenceId!==null||metrics[0]!.sourceEventId!==bill.entityId||metrics[0]!.date!==current.date||metrics[0]!.deltaFen!==bill.amountFen)return null
   const cash=book.transactions.filter(t=>t.id===operation.id&&t.accountId===business.accountId)
   if(cash.length>1||cash.some(t=>t.scopeBusinessId!==business.id||t.businessId!==business.id||t.contractId!==null||t.sourceId!==bill.entityId||t.referenceId!==debt.id||t.date!==current.date||t.amountFen>=0||!money(-t.amountFen)))return null
   const amount=-cash.reduce((n,t)=>n+t.amountFen,0)
   if(amount+debt.remainingFen!==bill.amountFen)return null
   paid+=amount;due+=debt.remainingFen;billCashIds.add(operation.id)
  }
  if(!money(paid)||!money(due)||old.funds.cashFen-business.funds.cashFen!==paid||business.funds.prepaidLiabilityFen!==old.funds.prepaidLiabilityFen||business.funds.receivableFen!==old.funds.receivableFen||business.funds.supplierPrepaidFen!==old.funds.supplierPrepaidFen||business.funds.payableFen-old.funds.payableFen!==due)return null
  const newCash=book.transactions.filter(t=>t.accountId===business.accountId&&!oldBook.transactions.some(old=>old.id===t.id&&old.lineIndex===t.lineIndex))
  if(newCash.some(t=>!billCashIds.has(t.id)))return null
  return `本站已转入收尾；原维护及工资实际支付${moneyText(paid)}，尚欠${moneyText(due)}。这是原日期内已有费用的结算，停站没有退回已开工投入或已用行动。客户原保护${moneyText(business.funds.prepaidLiabilityFen)}、原应收${moneyText(business.funds.receivableFen)}、供应资产${moneyText(business.funds.supplierPrepaidFen)}和原应付${moneyText(business.funds.payableFen)}继续留在原账；未开工安排按原账取消，旧客户款不会自动收取或退还。`
 }
 if(kind==='CollectRelayReceivable'){
  const collected=one(book.collections.filter(c=>c.id===id&&!oldBook.collections.some(old=>old.id===c.id))),invoice=collected?one(after.receivables.filter(i=>i.id===collected.receivableId)):undefined,old=invoice?one(before.receivables.filter(i=>i.id===invoice.id)):undefined
  const customer=invoice?one(after.customers.filter(c=>c.id===invoice.customerId)):undefined,oldCustomer=customer?one(before.customers.filter(c=>c.id===customer.id)):undefined
  const business=customer?one(after.businesses.filter(b=>b.id===customer.businessId)):undefined,oldBusiness=business?one(before.businesses.filter(b=>b.id===business.id)):undefined
  if(!collected||collected.amountFen<=0||collected.operationId!==relayId('collect',id)||collected.date!==current.date||!invoice||!old||!customer||!oldCustomer||!business||!oldBusiness||collected.customerId!==customer.id||collected.scopeBusinessId!==business.id||collected.accountId!==business.accountId||invoice.collectedFen-old.collectedFen!==collected.amountFen||invoice.amountFen!==old.amountFen||invoice.reversedFen!==old.reversedFen||invoice.customerId!==old.customerId||invoice.dueAt!==old.dueAt||invoice.sourceId!==old.sourceId||invoice.dueAt>current.date||customer.balance.recognizedIncomeFen!==oldCustomer.balance.recognizedIncomeFen||business.funds.cashFen-oldBusiness.funds.cashFen!==collected.amountFen)return null
  const cash=book.transactions.filter(t=>t.id===collected.operationId&&t.accountId===business.accountId),operation=one(book.operations.filter(o=>o.id===collected.operationId&&o.kind==='collect_receivable'&&o.scopeBusinessId===business.id&&o.contractId===customer.id&&o.sourceEventId===invoice.id))
  if(cash.length!==1||cash[0]!.date!==current.date||cash[0]!.amountFen!==collected.amountFen||cash[0]!.scopeBusinessId!==business.id||cash[0]!.businessId!==business.id||cash[0]!.contractId!==customer.id||cash[0]!.sourceId!==invoice.id||!operation||operation.date!==current.date||operation.accountId!==business.accountId||operation.amountFen!==collected.amountFen)return null
  const remaining=invoice.amountFen-invoice.collectedFen-invoice.reversedFen,number=after.customers.filter(c=>c.businessId===business.id).findIndex(c=>c.id===customer.id)+1
  return `客户${number}这一张原单实际到账${moneyText(collected.amountFen)}，进入原中转账户；本单净未收还剩${moneyText(remaining)}。其它原单继续保留，这笔回款没有再确认一遍收入，也没有使用新的行动点。`
 }
 if(kind==='RefundRelayBalance'){
  const refund=one(after.refunds.filter(r=>r.id===id&&!before.refunds.some(old=>old.id===r.id))),customer=refund?one(after.customers.filter(c=>c.id===refund.customerId)):undefined,oldCustomer=customer?one(before.customers.filter(c=>c.id===customer.id)):undefined
  const business=customer?one(after.businesses.filter(b=>b.id===customer.businessId)):undefined,oldBusiness=business?one(before.businesses.filter(b=>b.id===business.id)):undefined
  if(!refund||refund.amountFen<=0||refund.date!==current.date||!customer||!oldCustomer||!business||!oldBusiness||new Set(refund.operationIds).size!==refund.operationIds.length||new Set(refund.rechargeIds).size!==refund.rechargeIds.length||refund.operationIds.length!==refund.rechargeIds.length||oldCustomer.balance.prepaidFen-customer.balance.prepaidFen!==refund.amountFen||oldCustomer.balance.recognizedIncomeFen!==customer.balance.recognizedIncomeFen)return null
  const operations=book.operations.filter(o=>refund.operationIds.includes(o.id))
  if(operations.length!==refund.operationIds.length||operations.some(o=>o.kind!=='refund_undelivered'||o.scopeBusinessId!==business.id||o.accountId!==business.accountId||o.contractId!==customer.id||o.date!==current.date||oldBook.operations.some(old=>old.id===o.id)))return null
  for(const rechargeId of refund.rechargeIds){
   const recharge=one(book.recharges.filter(r=>r.id===rechargeId&&r.customerId===customer.id)),prior=one(oldBook.recharges.filter(r=>r.id===rechargeId&&r.customerId===customer.id)),operation=one(operations.filter(o=>o.id===relayId('balance-refund',id,rechargeId)))
   if(!recharge||!prior||!operation||operation.referenceId!==recharge.operationId||operation.sourceEventId!==customer.id||operation.amountFen!==recharge.refundedFen-prior.refundedFen||recharge.usedFen!==prior.usedFen||recharge.amountFen!==prior.amountFen||recharge.operationId!==prior.operationId)return null
  }
  const cash=book.transactions.filter(t=>refund.operationIds.includes(t.id)&&t.accountId===business.accountId)
  if(cash.some(t=>t.date!==current.date||t.scopeBusinessId!==business.id||t.businessId!==business.id||t.contractId!==customer.id||t.amountFen>0||!operations.some(o=>o.id===t.id&&o.obligationId===t.referenceId)))return null
  const paid=-cash.reduce((n,t)=>n+t.amountFen,0),owed=book.obligationHistory.filter(o=>refund.operationIds.includes(o.originOperationId)&&o.scopeBusinessId===business.id&&o.accountId===business.accountId).reduce((n,o)=>n+o.remainingFen,0)
  if(paid+owed!==refund.amountFen||oldBusiness.funds.cashFen-business.funds.cashFen!==paid)return null
  return `客户原款退款登记${moneyText(refund.amountFen)}已经保存；本次实际付出${moneyText(paid)}，仍待偿还的原退款${moneyText(owed)}。这位客户尚未消费的原余额还剩${moneyText(customer.balance.prepaidFen)}；未付退款及其保护仍随原义务处理，不形成利润，原支持与其它旧账继续。`
 }
 if(kind==='RefundRelaySupplier'){
  const operation=one(book.operations.filter(o=>o.id===relayId('supplier-refund',id)&&o.kind==='refund_supplier'&&!oldBook.operations.some(old=>old.id===o.id)))
  const business=operation?one(after.businesses.filter(b=>b.id===operation.scopeBusinessId)):undefined,oldBusiness=business?one(before.businesses.filter(b=>b.id===business.id)):undefined
  const option=operation?one(after.supplyOptions.filter(o=>o.businessId===operation.scopeBusinessId&&o.credit?.id===operation.prepaymentId)):undefined,oldOption=option?one(before.supplyOptions.filter(o=>o.businessId===option.businessId&&o.supplierId===option.supplierId)):undefined
  const supplier=option?one(after.catalog.suppliers.filter(s=>s.id===option.supplierId)):undefined
  if(!operation||operation.date!==current.date||operation.amountFen===null||operation.amountFen<=0||!business||operation.accountId!==business.accountId||operation.businessId!==business.id||!oldBusiness||!option?.credit||!oldOption?.credit||!supplier||operation.sourceEventId!==supplier.id||oldOption.credit.remainingFen-option.credit.remainingFen!==operation.amountFen||business.funds.cashFen-oldBusiness.funds.cashFen!==operation.amountFen||business.metrics.incomeFen!==oldBusiness.metrics.incomeFen)return null
  const cash=book.transactions.filter(t=>t.id===operation.id&&t.accountId===business.accountId)
  if(cash.length!==1||cash[0]!.date!==current.date||cash[0]!.amountFen!==operation.amountFen||cash[0]!.scopeBusinessId!==business.id||cash[0]!.businessId!==business.id||cash[0]!.sourceId!==supplier.id)return null
  return `${supplier.label}的本站资产实际退回${moneyText(operation.amountFen)}；该供应仍留资产${moneyText(option.credit.remainingFen)}、未付${moneyText(option.outstandingFen)}。这是自有资金回到原账户，没有新增服务收入，也没有清掉客户保护或其它旧债。`
 }
 if(kind==='PayObligation'){
  const operations=book.operations.filter(o=>o.kind==='pay_obligation'&&!oldBook.operations.some(old=>old.id===o.id)),operation=one(operations),debt=operation?one(book.obligationHistory.filter(o=>o.id===operation.obligationId)):undefined,old=debt?one(oldBook.obligationHistory.filter(o=>o.id===debt.id)):undefined
  if(!operation||operation.id!==operatingId(receipt.commandId,'PayObligation')||operation.sourceEventId!==receipt.commandId||operation.date!==current.date||operation.amountFen===null||operation.amountFen<=0||!debt||!old||debt.amountFen!==old.amountFen||debt.originOperationId!==old.originOperationId||debt.sourceEventId!==old.sourceEventId||old.remainingFen-debt.remainingFen!==operation.amountFen||debt.scopeBusinessId!==operation.scopeBusinessId||debt.accountId!==operation.accountId)return null
  const cash=book.transactions.filter(t=>t.id===operation.id&&t.accountId===debt.accountId)
  if(cash.length!==1||cash[0]!.date!==current.date||cash[0]!.amountFen!==-operation.amountFen||cash[0]!.referenceId!==debt.id||cash[0]!.scopeBusinessId!==debt.scopeBusinessId||cash[0]!.sourceId!==receipt.commandId)return null
  return `这一笔原义务实际支付${moneyText(operation.amountFen)}，仍剩${moneyText(debt.remainingFen)}关联原单。这里只偿还旧款，没有再确认一遍费用；其它客户保护、供应资产和未结事项仍按原记录继续。`
 }
 return null
}
