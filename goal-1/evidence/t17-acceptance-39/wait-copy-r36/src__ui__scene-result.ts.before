import type {PlayingView,PlayFeatures} from './game-types.ts'
import {moneyText} from './game-text.ts'
import {RELAY_JOBS} from '../content/relay.ts'
import {domainSceneResult} from './scene-domain-results.ts'
import {courseSceneResult} from './course-scene-result.ts'
import {videoSceneResult} from './video-scene-result.ts'
import {relayResponseSceneResult} from './relay-response-result.ts'
import {relaySupportSettlement} from './relay-support-settlement.ts'
import {isoDate} from '../core/calendar.ts'
import {MONEY_LIMIT} from '../core/money.ts'
import {ecosystemSceneResult} from './ecosystem-scene-result.ts'
import {sceneCashResult} from './scene-cash-result.ts'

type Relay=NonNullable<PlayFeatures['relay']>
const originalDay=(value:unknown):value is string=>{try{return typeof value==='string'&&isoDate(value)===value}catch{return false}}

/** A quoted price becomes a result only when the committed current terms actually use it. */
function effectiveRelayQuoteResults(previous:PlayingView,current:PlayingView,before:Relay,after:Relay):string[]{
 if(current.readOnly||current.busy||!Array.isArray(before.quotes)||!Array.isArray(after.quotes))return []
 const parts:string[]=[]
 for(const quote of after.quotes){
  const originals=before.quotes.filter(q=>q.id===quote.id),old=originals.length===1?originals[0]:undefined,job=quote.job
  if(!old||after.quotes.filter(q=>q.id===quote.id).length!==1||!originalDay(quote.effectiveAt)||quote.effectiveAt<=previous.date||quote.effectiveAt>current.date||!originalDay(quote.completedAt)||quote.completedAt>=quote.effectiveAt||quote.completedAt>current.date||!job||job.id!==quote.jobId||job.definitionId!=='relay-requote'||job.businessId!==quote.businessId||job.status!=='completed'||job.completeAt!==quote.completedAt)continue
  if(old.businessId!==quote.businessId||old.jobId!==quote.jobId||old.createdAt!==quote.createdAt||old.effectiveAt!==quote.effectiveAt||old.offerId!==quote.offerId||old.unitPriceFen!==quote.unitPriceFen||old.serviceFeeFen!==quote.serviceFeeFen||JSON.stringify(old.customerIds)!==JSON.stringify(quote.customerIds)||after.quotes.filter(q=>q.jobId===quote.jobId).length!==1)continue
  if(!Number.isSafeInteger(quote.unitPriceFen)||quote.unitPriceFen<1||quote.unitPriceFen>100||!Number.isSafeInteger(quote.serviceFeeFen)||quote.serviceFeeFen<0||quote.serviceFeeFen>MONEY_LIMIT||!quote.customerIds.length||new Set(quote.customerIds).size!==quote.customerIds.length||quote.responses.length!==quote.customerIds.length||new Set(quote.responses.map(r=>r.customerId)).size!==quote.customerIds.length||quote.responses.some(r=>!quote.customerIds.includes(r.customerId)||typeof r.accepted!=='boolean'))continue
  const businesses=after.businesses.filter(b=>b.id===quote.businessId),business=businesses.length===1?businesses[0]:undefined,oldBusinesses=before.businesses.filter(b=>b.id===quote.businessId)
  if(!business||oldBusinesses.length!==1||oldBusinesses[0]!.accountId!==business.accountId||current.accounts.filter(a=>a.accountId===business.accountId).length!==1||previous.accounts.filter(a=>a.accountId===business.accountId).length!==1)continue
  const currentJobs=current.operations?.jobs.filter(j=>j.id===job.id&&j.businessId===business.id)??[],originalJobs=previous.operations?.jobs.filter(j=>j.id===old.jobId&&j.businessId===business.id)??[]
  if(currentJobs.length!==1||originalJobs.length!==1||currentJobs[0]!.status!=='completed'||currentJobs[0]!.definitionId!==job.definitionId||currentJobs[0]!.actionId!==job.actionId||currentJobs[0]!.startAt!==job.startAt||currentJobs[0]!.completeAt!==job.completeAt||originalJobs[0]!.actionId!==job.actionId)continue
  const accepted=quote.responses.filter(r=>r.accepted)
  if(!accepted.length)continue
  const names:string[]=[]
  for(const response of accepted){
   const customers=after.customers.filter(c=>c.id===response.customerId&&c.businessId===business.id),originalCustomers=before.customers.filter(c=>c.id===response.customerId&&c.businessId===business.id),customer=customers.length===1?customers[0]:undefined
   if(!customer||originalCustomers.length!==1||!originalDay(originalCustomers[0]!.activeTerms.effectiveAt)||originalCustomers[0]!.activeTerms.effectiveAt>previous.date||customer.activeTerms.sourceId!==quote.id||customer.activeTerms.effectiveAt!==quote.effectiveAt||customer.activeTerms.unitPriceFen!==quote.unitPriceFen||customer.activeTerms.serviceFeeFen!==quote.serviceFeeFen){names.length=0;break}
   names.push('客户'+(after.customers.filter(c=>c.businessId===business.id).findIndex(c=>c.id===customer.id)+1))
  }
  if(names.length!==accepted.length)continue
  parts.push(`与${names.join('、')}谈妥的报价已于${quote.effectiveAt}生效；后续用量价${moneyText(quote.unitPriceFen)}，周期支持基准${moneyText(quote.serviceFeeFen)}。旧计量和本期支持仍按原报价核对，下一期服务另行决定；报价生效本身没有现金入账`)
 }
 return parts
}

function committedRelayChange(previous:PlayingView|null,current:PlayingView){
 if(!previous||previous.runId!==current.runId||current.revision<=previous.revision||current.saveStatus!=='saved'||current.hasCandidate)return null
 const before=previous.features as unknown as PlayFeatures,after=current.features as unknown as PlayFeatures
 if(!before.relay||!after.relay)return null
 return {before:before.relay,after:after.relay,features:after}
}

function relayCommandResult(kind:string,previous:PlayingView|null,current:PlayingView):string|null{
 const change=committedRelayChange(previous,current)
 if(!change)return null
 const {before,after,features}=change
 if(kind==='ReadRelaySupplyDecision'){
  const letters=after.applications.filter(letter=>letter.read&&letter.approved!==null&&before.applications.some(old=>old.id===letter.id&&!old.read&&old.job?.status==='completed'))
  const letter=letters.length===1?letters[0]:undefined
  if(!letter)return null
  const supplier=after.catalog.suppliers.find(s=>s.id===letter.supplierId)
  if(!supplier)return null
  if(letter.approved&&letter.expiresAt)return `回信写着：${supplier.label}的本局许可获准，有效至${letter.expiresAt}。原实际适配与启用条件仍须分别核对，读信没有新增付款或行动。`
  if(letter.approved===false)return `回信写着：${supplier.label}此次没有授予本局许可。原已付费用与申请记录保留，下一次申请仍须核对原冷却和真实资源。`
  return null
 }
 if(kind==='CollectRelayDue'){
  const collected=after.receivables.flatMap(row=>{
   const old=before.receivables.find(prior=>prior.id===row.id)
   return old&&old.customerId===row.customerId&&row.collectedFen>old.collectedFen?[{customerId:row.customerId,amountFen:row.collectedFen-old.collectedFen}]:[]
  })
  const customerIds=new Set(collected.map(row=>row.customerId)),customer=customerIds.size===1?after.customers.find(c=>c.id===collected[0]!.customerId):undefined
  const oldCustomer=before.customers.find(c=>c.id===customer?.id),business=after.businesses.find(b=>b.id===customer?.businessId),oldBusiness=before.businesses.find(b=>b.id===business?.id)
  const amount=collected.reduce((sum,row)=>sum+row.amountFen,0)
  if(!customer||!oldCustomer||!business||!oldBusiness||amount<=0||business.funds.cashFen-oldBusiness.funds.cashFen!==amount||customer.balance.recognizedIncomeFen!==oldCustomer.balance.recognizedIncomeFen)return null
  const number=after.customers.filter(c=>c.businessId===business.id).findIndex(c=>c.id===customer.id)+1
  return `客户${number}的原应收实际到账${moneyText(amount)}，进入原中转站账户。这是原已确认收入的回款，未到期的原应收仍留在原账。`
 }
 if(kind==='StartRelayServicePeriod'){
  const added=after.periods.filter(period=>!before.periods.some(old=>old.id===period.id))
  const period=added.length===1?added[0]:undefined
  if(!period||period.job?.status!=='planned'||!period.supportJob)return null
  return `服务单已经安排：${period.from}—${period.to}，${period.customerIds.length}位原客户。原支持另在${period.supportJob.startAt}—${period.supportJob.completeAt}；这一步只是预留，不是收入或回款。`
 }
 if(kind==='StartRelayAudit'){
  const added=after.auditJobs.filter(audit=>!before.auditJobs.some(old=>old.jobId===audit.jobId))
  const audit=added.length===1?added[0]:undefined,job=audit?.job
  if(!job||job.status!=='planned'&&job.status!=='running')return null
  const term=RELAY_JOBS.find(definition=>definition.id===job.definitionId&&definition.id==='relay-meter-audit')
  const business=after.businesses.find(row=>row.id===job.businessId)
  const finance=features.workbench.finance.find(row=>row.accountId===business?.accountId)
  if(!term||!finance)return null
  const paid=finance.metrics.filter(row=>row.kind==='cost'&&row.referenceId===job.actionId).reduce((sum,row)=>sum+row.deltaFen,0)
  const reserved=finance.reservations.filter(row=>row.kind==='plan'&&row.originId===job.actionId&&row.status==='active').reduce((sum,row)=>sum+row.amountFen,0)
  if(job.status==='planned'){
   if(paid!==0||reserved!==term.costFen)return null
   return `复核委托已经安排：${job.startAt}—${job.completeAt}，开工季度预留${term.actionPoints}点、自有资金预留${moneyText(reserved)}，尚未开工支付。完成后才看独立结果，差额仍须另行确认。`
  }
  if(paid!==term.costFen||reserved!==0)return null
  return `复核委托已经寄出：${job.startAt}—${job.completeAt}，实际支付${moneyText(paid)}、使用开工季度${term.actionPoints}点。完成前不提前揭示实计用量，差额仍须另行确认。`
 }
 if(kind==='CorrectRelayPeriod'){
  const added=after.corrections.filter(correction=>!before.corrections.some(old=>old.id===correction.id))
  if(!added.length||!added.every(correction=>{
   const original=before.meters.find(meter=>meter.id===correction.meterId),currentMeter=after.meters.find(meter=>meter.id===correction.meterId)
   return original&&currentMeter?.correctionId===correction.id&&currentMeter.reportedUnits===original.reportedUnits
    &&currentMeter.unitPriceFen===original.unitPriceFen&&currentMeter.unitCostFen===original.unitCostFen
    &&currentMeter.termsId===original.termsId&&currentMeter.rateId===original.rateId
    &&before.audits.some(audit=>audit.id===correction.auditId&&audit.meterId===original.id&&audit.completedAt!==null)
  }))return null
  return `已按${new Set(added.map(correction=>correction.meterId)).size}条原计量追加更正记录。原报告与价格仍保留；这里记下账目差额，不代表现金已经到账，应收应付继续按原账处理。`
 }
 return null
}

function relayTimeResult(previous:PlayingView|null,current:PlayingView):string|null{
 const change=committedRelayChange(previous,current)
 if(!change)return null
 const last=current.receipts.at(-1)
 if(!previous||last?.kind!=='AdvanceTime'||last.revisionAfter!==current.revision||current.date<previous.date)return null
 const singleAdvance=current.revision===previous.revision+1
 const {before,after,features}=change,parts:string[]=[]
 if(singleAdvance)parts.push(...effectiveRelayQuoteResults(previous,current,before,after))
 const oldBook=before.casebook,book=after.casebook
 if(singleAdvance&&oldBook?.status==='ready'&&book?.status==='ready'&&oldBook.runId===previous.runId&&oldBook.revision===previous.revision&&oldBook.asOf===previous.date&&book.runId===current.runId&&book.revision===current.revision&&book.asOf===current.date&&new Set(book.actions.map(a=>a.jobId)).size===book.actions.length&&new Set(oldBook.actions.map(a=>a.jobId)).size===oldBook.actions.length){
  for(const action of book.actions){
   const prior=oldBook.actions.find(a=>a.jobId===action.jobId),jobs=current.operations?.jobs.filter(j=>j.id===action.jobId&&j.businessId===action.scopeBusinessId)??[]
   if(!prior||prior.status!=='reserved'||prior.executedAt!==null||!['executed','completed'].includes(action.status)||action.executedAt===null||action.executedAt<previous.date||action.executedAt>current.date||JSON.stringify(prior.definition)!==JSON.stringify(action.definition)||jobs.length!==1||jobs[0]!.actionId!==action.definition.id||prior.scopeBusinessId!==action.scopeBusinessId)continue
   const definition=jobs[0]!.definitionId,label=definition==='relay-meter-audit'?'原复核':definition.startsWith('relay-support-')?'原支持':definition==='relay-service'?'原服务':definition==='relay-application'?'原供应申请':definition==='relay-marketing'?'原获客':definition==='relay-adapter'?'原线路适配':definition==='relay-requote'?'原报价谈判':'原中转准备'
   parts.push(`${label}已于${action.executedAt}实际开工；原预留的${moneyText(action.definition.costFen)}与开工季度${action.definition.actionPoints}点已按原账转为实际使用，没有再次预留同一笔钱或行动`)
  }
 }
 const audits=after.auditJobs.filter(audit=>audit.completed&&audit.job?.status==='completed'&&audit.job.completeAt<=current.date
  &&before.auditJobs.some(old=>old.jobId===audit.jobId&&(old.job?.status==='planned'||old.job?.status==='running')))
 if(audits.length)parts.push(`${audits.length}份独立复核已实际完成，${audits.reduce((sum,audit)=>sum+audit.meterCount,0)}条原计量已有本次结果；差额仍须另行确认更正`)
 const supported=after.periods.filter(period=>period.supportJob?.status==='completed'&&period.supportJob.completeAt<=current.date
  &&before.periods.some(old=>old.id===period.id&&old.supportJob?.id===period.supportJob?.id&&(old.supportJob?.status==='planned'||old.supportJob?.status==='running')))
 if(supported.length)parts.push(`${supported.length}段原支持已实际完成，服务费与旧责任仍按原账核对，完成不等于客户已经付款`)
 const settled=singleAdvance?after.periods.filter(period=>period.feePostedAt!==null&&period.compensatedAt!==null&&before.periods.some(old=>old.id===period.id&&old.supportJobId===period.supportJobId&&(old.feePostedAt===null||old.compensatedAt===null))):[]
 for(const period of settled){
  const businesses=after.businesses.filter(b=>b.id===period.businessId),stations=after.stations.filter(s=>s.businessId===period.businessId)
  if(businesses.length!==1||stations.length!==1)continue
  const accountId=businesses[0]!.accountId,target={kind:'period' as const,runId:current.runId,accountId,businessId:period.businessId,stationId:stations[0]!.id,periodId:period.id}
  const settlement=relaySupportSettlement({view:current,features,accountId},target)
  if(settlement.status==='known')parts.unshift(settlement.summary.join('；'))
  else if(settlement.reason)parts.push(settlement.reason)
 }
 const served=after.periods.filter(period=>period.job?.status==='completed'&&period.job.completeAt<=current.date
  &&before.periods.some(old=>old.id===period.id&&old.job?.id===period.job?.id&&(old.job?.status==='planned'||old.job?.status==='running')))
 if(served.length)parts.push(`${served.length}段计量周期已经结束，累计报告用量${served.reduce((sum,period)=>sum+period.reportedUnits,0)}；报告不代替独立实计，原支持与回款各按记录核对`)
 return parts.length?`${current.date}，${parts.join('；')}。`:null
}

/** Called only after the controller reports a complete saved transaction. */
export function savedSceneResult(kind:string,label:string,previous:PlayingView|null,current:PlayingView){
 if(!previous||previous.runId!==current.runId||current.saveStatus!=='saved'||current.hasCandidate||current.revision<=previous.revision)return '尚未核定新的完整保存，眼前仍以上一次完整提交为准。'
 const f=current.features as unknown as PlayFeatures,before=previous?.features as unknown as PlayFeatures|undefined,first=f.firstOrder
 const domain=domainSceneResult(kind,previous,current)
 const course=courseSceneResult(kind,previous,current)
 const video=videoSceneResult(kind,previous,current)
 const relayResponse=relayResponseSceneResult(kind,previous,current)
 const ecosystem=ecosystemSceneResult(kind,previous,current)
 if(relayResponse)return relayResponse
 if(ecosystem&&kind!=='AdvanceTime')return ecosystem
 if(kind==='WorkQuarter')return `这一季的工作已经安排好。月末才按实际在岗日期发薪；你还留着${current.budget.available}点，可以做自己的选择。`
 if(kind==='StartFirstOrder')return `你接下了这份手工小单。${first.dates.startAt}开工，${first.dates.submitBy}前完成并提交。${first.status==='planned'?`本次预留制作费${moneyText(first.terms.costFen)}和${first.terms.actionPoints}点，开工时才实际使用。`:first.status==='running'?`制作已经开工，已付制作费${moneyText(first.result.directCostFen)}，使用${first.terms.actionPoints}点。`:''}客户的钱还没有到账。`
 if(kind==='SubmitDelivery')return '作品交出去了。接下来，等客户真正复核；验收和到账还会留下各自的日期。'
 if(kind==='AcknowledgeStoryPause')return '你收下了这封来信。原期限仍在；这一步没有调查、付款或撤回外部权限。'
 if(kind==='StartRiskTask'){
  const job=f.story.jobs.find(j=>!before?.story.jobs.some(old=>old.id===j.id))
  if(job?.kind==='investigate')return `委托已经寄出。${job.startAt}—${job.completeAt}，实际支付${moneyText(job.costFen)}、使用${job.actionPoints}点。等独立工作真正完成，再看回信。`
 }
 if(kind==='ConfirmRiskAssessment')return '你已对照独立回信，明确记下本次评估。眼前只陈述这一次的证据，原账、旧交付与范围之外的责任继续保留。'
 const relayCommand=relayCommandResult(kind,previous,current)
 if(relayCommand)return relayCommand
 if(kind==='AdvanceTime'){
  const parts:string[]=[]
  if(ecosystem)parts.push(ecosystem)
  if(first.result.paymentFen>0&&(before?.firstOrder.result.paymentFen??0)===0)parts.push(`${current.date}，客户实际付来了${moneyText(first.result.paymentFen)}。制作成本${moneyText(first.result.directCostFen)}，这一单净得${moneyText(first.result.netOrderFen)}。`)
  if(first.status==='awaiting_submission'&&before?.firstOrder.status!=='awaiting_submission')parts.push(`${current.date}，这份作品已经做完。下一步，要由你亲手交给客户。`)
  if(f.workbench.pause&&!domain)parts.push(`${current.date}，日子在这里停了一下。${f.workbench.progression.barrierLabel??'有一件需要你面对的事。'}`)
  if(f.story.jobs.some(j=>j.kind==='investigate'&&j.status==='completed'&&!before?.story.jobs.some(old=>old.id===j.id&&old.status==='completed')))parts.push(`${current.date}，独立回信到了。工作已经实际完成，仍要由你对照记录并另行确认。`)
  const relayTime=relayTimeResult(previous,current)
  if(relayTime)parts.push(relayTime)
  if(domain)parts.push(current.date+'，'+domain)
  if(course)parts.push(course)
  if(video)parts.push(video)
  if(parts.length)return parts.join(' ')
  const last=current.receipts.at(-1)
  if(current.revision===previous.revision+1&&!current.readOnly&&!current.busy&&last?.kind===kind&&last.revisionAfter===current.revision){
   const businesses=current.operations?.businesses??[],names:Record<string,string>={ai_stock:'模拟投资',ai_video:'视频工作室',ai_course:'课程工作室',api_relay:'API中转站',deepseek_opportunity:'生态服务'}
   const label=(accountId:string)=>{if(accountId==='personal')return '个人';const rows=businesses.filter(b=>b.accountId===accountId);if(rows.length!==1)return '原企业账户';const b=rows[0]!,peers=businesses.filter(n=>n.route===b.route);return (names[b.route]??'原企业')+(peers.length>1?' '+(peers.findIndex(n=>n.id===b.id)+1):'')}
   const cash=sceneCashResult(before?.workbench.finance??[],f.workbench.finance,previous.date,current.date,label)
   if(cash)return current.date+'，'+cash
  }
  return `${current.date}。已经确认的安排按真实日期发生，眼前又多了一次选择。`
 }
 if(domain)return domain
 if(course)return course
 if(video)return video
 return `${label}，已经记进这段人生。实际结果请看眼前的记录；未完成的承诺仍会延续。`
}
