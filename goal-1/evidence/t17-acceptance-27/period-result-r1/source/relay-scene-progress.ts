import type {RelayProjection} from '../core/relay-projection.ts'
import {moneyText} from './game-text.ts'
import {resolveRelaySceneTarget,relayTargetEntity,type RelaySceneTarget,type RelaySceneContext,type RelayTargetResolution} from './relay-scene-target.ts'
export type {RelaySceneTarget,RelaySceneContext} from './relay-scene-target.ts'

type Relay=NonNullable<RelayProjection>
type Period=Relay['periods'][number]
type Job=NonNullable<Relay['preparations'][number]['job']>
export type RelayScenePhase='invalid'|'opening'|'preparation'|'supplier-letter'|'supply'|'marketing'|'intake'|'terms'|'funding'|'planning'|'planned'|'service'|'support'|'audit-waiting'|'audit-ready'|'correction'|'collection'|'settling'|'market-change'|'paused'|'stopping'|'closed'|'period-closed'|'records'
export interface RelaySceneResultRef{readonly kind:'job'|'business'|'application'|'audience'|'customer'|'period'|'meter'|'audit'|'correction'|'receivable'|'operation';readonly id:string;readonly date:string|null}
export type RelaySceneCommand=
 |{readonly kind:'ReadRelaySupplyDecision';readonly payload:{readonly applicationId:string};readonly confirm:false}
 |{readonly kind:'CorrectRelayPeriod';readonly payload:{readonly periodId:string};readonly confirm:true}
 |{readonly kind:'CollectRelayDue';readonly payload:{readonly customerId:string};readonly confirm:true}
export interface RelaySceneProgress{
 readonly target:RelaySceneTarget|null
 readonly invalidReason:string|null
 readonly historical:boolean
 readonly outcome:'none'|'pending'|'actual'|'non-success'
 readonly resultRefs:readonly RelaySceneResultRef[]
 readonly recordId:string|null
 readonly wait:{readonly date:string;readonly label:string}|null
 readonly intent:'service'|'audit'|null
 readonly phase:RelayScenePhase
 readonly title:string
 readonly line:string
 readonly choice:{readonly title:string;readonly line:string;readonly label:string}
 readonly businessId:string|null
 readonly periodId:string|null
 readonly periodIds:string[]
 readonly periodIndex:number
 readonly nextDate:string|null
 readonly completeAt:string|null
 readonly command:RelaySceneCommand|null
 /** Scope metadata only. The original audit payload is periodId/resources/startAt. */
 readonly audit:{readonly businessId:string;readonly periodId:string}|null
}

const active=(job:Job|null|undefined):job is Job&{status:'planned'|'running'}=>!!job&&(job.status==='planned'||job.status==='running')
function jobNext(job:Job,date:string):string|null{
 if(job.status==='planned'&&job.startAt>=date)return job.startAt
 if(job.completeAt<date)return null
 return job.completeAt
}
function pendingCorrections(relay:Relay,periodId:string){
 return relay.meters.filter(m=>m.periodId===periodId&&m.auditedUnits!==null&&m.auditedUnits!==m.reportedUnits&&m.correctionId===null)
}
/** A prior completed audit still covers its meters; a cancelled one does not. */
export function relayAuditableMeters(relay:Relay,periodId:string){
 return relay.meters.filter(m=>m.periodId===periodId&&m.supplierId!==null&&!relay.audits.some(a=>{
  if(a.meterId!==m.id)return false
  const job=relay.auditJobs.find(j=>j.jobId===a.jobId)?.job
  return !!job&&['planned','running','completed'].includes(job.status)
 }))
}
function selectedPeriod(relay:Relay,preferredId:string|null|undefined,businessId:string|undefined):Period|undefined{
 const preferred=preferredId?relay.periods.find(p=>p.id===preferredId):undefined
 if(preferred)return preferred
 const correction=relay.periods.find(p=>pendingCorrections(relay,p.id).length>0)
 if(correction)return correction
 const own=relay.periods.filter(p=>p.businessId===businessId)
 const live=own.filter(p=>p.status!=='closed').sort((a,b)=>a.from.localeCompare(b.from)||a.id.localeCompare(b.id))
 if(own.length)return live.find(p=>active(p.job)||active(p.supportJob))??live[0]??own.at(-1)
 const other=relay.periods.filter(p=>p.status!=='closed').sort((a,b)=>a.from.localeCompare(b.from)||a.id.localeCompare(b.id))
 return other.find(p=>active(p.job)||active(p.supportJob))??other[0]??relay.periods.at(-1)
}

/** Only saved public projections. Selecting a letter, scope or date executes nothing. */
function legacyRelaySceneProgress(relay:RelayProjection,date:string,preferredPeriodId?:string|null):RelaySceneProgress|null{
 if(!relay)return null
 const current=relay.businesses.find(b=>b.lifecycle!=='closed')??relay.businesses.at(-1)
 const period=selectedPeriod(relay,preferredPeriodId,current?.id)
 const business=relay.businesses.find(b=>b.id===period?.businessId)??current
 const businessId=business?.id??null,periodId=period?.id??null,periodIds=relay.periods.map(p=>p.id)
 const context={businessId,periodId,periodIds,periodIndex:periodId===null?-1:periodIds.indexOf(periodId),nextDate:null,completeAt:null,command:null,audit:null,target:null,invalidReason:null,historical:false,outcome:'none' as const,resultRefs:[],recordId:null,wait:null,intent:null}
 const scene=(phase:RelayScenePhase,title:string,line:string,choiceTitle:string,choiceLine:string,label:string,extra:Partial<Pick<RelaySceneProgress,'nextDate'|'completeAt'|'command'|'audit'>>={}):RelaySceneProgress=>({...context,phase,title,line,choice:{title:choiceTitle,line:choiceLine,label},...extra})
 if(!business)return scene('opening','一盏夜班灯，从一份准备开始。','中转经营需要自有资金、真实材料与本局供应许可，尚没有已经营业的线路。','先核对这份新的准备','资本转入独立账户；开站、获客、客户充值和实际收入各自发生。','核对自有资金与开站条件')
 const station=relay.stations.find(s=>s.businessId===business.id)
 const customers=relay.customers.filter(c=>c.businessId===business.id&&c.closedAt===null)
 const identity=period?`${period.from}—${period.to}这期服务`:'这份中转经营'
 const stoppedSupport=period?.supportJob&&['interrupted','cancelled'].includes(period.supportJob.status)
 const supportNote=stoppedSupport?'原支持已中断或取消，等候不会自动补做；原成本和后续责任继续保留。':''
 const corrections=period?pendingCorrections(relay,period.id):[]
 if(period&&corrections.length)return scene('correction','旧账单上，还有几行需要认真改正。','独立复核已经揭示差额。原报告、原价格和更正依据都保留，结过的周期也不能略过。','按已完成的独立记录核对差额',`${identity}有${corrections.length}条尚未更正的已知差额；核对客户和供应两边的原账。`,'核对并更正本期原账',{command:{kind:'CorrectRelayPeriod',payload:{periodId:period.id},confirm:true}})
 const due=customers.find(customer=>(!period||period.customerIds.includes(customer.id))&&relay.receivables.some(r=>r.customerId===customer.id&&r.dueAt<=date&&r.amountFen>r.collectedFen+r.reversedFen))
 if(due){
  const amount=relay.receivables.filter(r=>r.customerId===due.id&&r.dueAt<=date).reduce((sum,r)=>sum+r.amountFen-r.collectedFen-r.reversedFen,0)
  const number=relay.customers.filter(c=>c.businessId===due.businessId).findIndex(c=>c.id===due.id)+1
  return scene('collection','约定的日子到了，先收好原来的回款。','只有已经到期的原应收可以收取。这笔现金不会再确认一次新的收入。',`收取客户${number}已经到期的原应收`,`${moneyText(amount)}已到约定日期；本次按该客户全部已到期原单收取，其他余额和旧约继续。`,`核对客户${number}的原回款 · ${moneyText(amount)}`,{command:{kind:'CollectRelayDue',payload:{customerId:due.id},confirm:true}})
 }
 if(business.lifecycle==='closed')return scene('closed','灯已经收好，原来的记录仍在。','这家企业已经关闭。历史服务、复核、退款与原账继续保留，不再安排新的经营或审计。','回看这一份已经收尾的经营','已结收入与旧成本不会变成本季新的回款；其他周期仍可逐份翻阅。','翻看已关闭企业与原账')
 const unread=relay.applications.find(a=>a.businessId===business.id&&!a.read&&a.job?.status==='completed'&&a.job.completeAt<=date)
 if(unread)return scene('supplier-letter','供应那头，终于有一封回信。','申请工作已经实际完成，回信还需要你亲手拆开。此刻不替它宣布批准或拒绝。','拆开这封已完成审查的回信',`${unread.job!.startAt}—${unread.job!.completeAt}是原申请的真实日子；原已付成本仍在。`,'阅读这份供应审查结果',{command:{kind:'ReadRelaySupplyDecision',payload:{applicationId:unread.id},confirm:false}})
 const audit=period?relay.auditJobs.find(a=>a.periodIds.includes(period.id)&&active(a.job)):undefined
 if(audit?.job)return scene('audit-waiting','账单已经送去核对，还要等真实回信。','复核尚未实际完成，不能提前展示实计用量或把差额当作已经更正。','留出这次独立核对的日子',`${audit.job.startAt}—${audit.job.completeAt}，这次只覆盖已委托的${audit.meterCount}条原记录；随后发生的计量另核。`,'查看原复核任务与记录',{nextDate:jobNext(audit.job,date),completeAt:audit.job.completeAt})
 const eligible=period?relayAuditableMeters(relay,period.id):[]
 if(business.lifecycle==='winding_down')return scene('stopping','请求停下来以后，还有原来的承诺。','停站没有清空旧余额、供应资产、客户应收或已经发生的费用。','把停站后的原账逐项收好',`客户未消费余额${moneyText(business.funds.prepaidLiabilityFen)}、供应资产${moneyText(business.funds.supplierPrepaidFen)}、应收${moneyText(business.funds.receivableFen)}与应付${moneyText(business.funds.payableFen)}分别处理；满足原门槛后再关闭。`,'核对停站余额、退款与原债务')
 if(station?.trafficPaused)return scene('paused','先把新的请求停一停。','原交通已暂停，既有资源、支持、费用和客户余额仍按原记录继续。','看看这盏灯下还留着什么',`${identity}的原约定没有被暂停按钮抹掉；恢复交通、停止本期或停站收尾仍由你明确选择。`,'核对暂停交通与全部旧责任',{nextDate:period&&active(period.job)?jobNext(period.job,date):period&&active(period.supportJob)?jobNext(period.supportJob,date):null})
 if(business.lifecycle==='paused'&&!active(period?.job)&&!active(period?.supportJob))return scene('paused','先缓一缓新的合同，旧约仍要认真对待。','这家企业暂停接受新合同，既有交通与原支持不因此自动停止。','核对原客户与暂停后的安排','是否恢复新合同仍由你明确选择，原余额、服务、支持与费用各自保留。','查看暂停新合同与原安排')
 const changes=relay.changes.filter(change=>change.businessId===business.id&&change.acknowledgedAt===null&&change.date<=date)
 // An ordinary business notice stays in its original book; an explicitly selected period keeps its own progress.
 const explicitPeriod=period!==undefined&&preferredPeriodId===period.id
 if(changes.length&&!explicitPeriod)return scene('market-change','今天的风向变了，旧账仍有自己的日期。','供应与竞争前提已经发生公开变化。阅读与确认不替你重谈客户报价或增加供应权限。','对照新的前提，保留原来的约定',`${changes.length}项已发生变化待核对；已发生用量保持原价格版本，未来条款须另行选择、谈妥并实际生效。`,'查看公开变价与原合同')
 if(period){
  if(active(period.job))return scene(period.job.status==='planned'?'planned':'service',period.job.status==='planned'?'下一班线路，已经留在日历里。':'夜里的线路，还在真实地走。','容量与供应预算只是原授权上限，真正发生的用量才进入原账。'+supportNote,'看看这一期已经留下的服务记录',`${identity}已记录${period.observedDays}日，报告用量${period.reportedUnits}，有不足或停止原因${period.failedDays}日；支持与收费仍有各自的完成日期。`,'翻看本期用量、线路与原安排',{nextDate:jobNext(period.job,date),completeAt:period.job.completeAt})
  if(active(period.supportJob)){
   const stoppedService=period.job&&['interrupted','cancelled'].includes(period.job.status)
   return scene('support',stoppedService?'请求停下了，原来的支持还在日历。':'线路走完这一段，还要回应电话那头的人。',stoppedService?'原服务已中断或取消，原支持仍需按真实日期完成；等候不会补回未发生的用量。':'服务周期结束不等于支持已经完成。周期支持费与赔付按实际支持和已服务日另行核对。','把原来承诺的支持认真走完',`${period.supportJob.startAt}—${period.supportJob.completeAt}是这次真实支持安排，使用原资源与原预留；客户余额仍另列。`,'查看本期实际支持与原账',{nextDate:jobNext(period.supportJob,date),completeAt:period.supportJob.completeAt})
  }
  if(eligible.length)return scene('audit-ready','线路走过的日子，留下了一叠账单。','报告用量还不是独立实计。你可以安排真实资源，核对已经发生的记录。'+supportNote,'给这些原账安排一次独立复核',`${identity}有${eligible.length}条已有供应记录尚未被有效复核覆盖；日期、资源与实际费用仍要分别确认。`,'选择本期复核的资源与日期',{audit:{businessId:business.id,periodId:period.id}})
  if(period.status==='settling'||period.status==='stopped'||period.feePostedAt===null)return scene('settling','这期已经留下记录，原账还没有收好。','停止请求、任务中断或服务结束，都不会免费补齐支持、清除应收应付或客户保护。','核对这期还在延续的责任',`${identity}的支持、费用与原账逐项保留；未到期应收不能提前取用，已揭示差额仍须独立更正。`,'查看本期原账与未结责任')
  if(period.status==='closed')return scene('period-closed',stoppedSupport?'原账收好后，中断的支持仍留在记录。':'这一期收好了，客户的余额仍另有去处。','本期结清不等于企业关闭，也不等于客户余额或供应贷项已经变成利润。'+supportNote,'翻看这一期真实留下的账',`${identity}已经按原账结束；旧计量、更正和其他周期仍可逐份查看，下一期须重新明确客户、供应与支持。`,'查看本期结果、旧余额与下一期安排')
 }
 const preparations=relay.preparations.filter(p=>p.businessId===business.id)
 const preparation=preparations.find(p=>active(p.job))
 if(preparation?.job)return scene('preparation','把接通线路之前的准备，一点点做好。','真实材料或技术学习还在原资源的日历上，开始没有代替完成。','留住这段已经安排的准备',`${preparation.job.startAt}—${preparation.job.completeAt}；原投入和后续供应条件分别保留。`,'查看技术、材料与实际准备',{nextDate:jobNext(preparation.job,date),completeAt:preparation.job.completeAt})
 const application=relay.applications.find(a=>a.businessId===business.id&&active(a.job))
 if(application?.job)return scene('supply','申请信已经寄出，别急着替对方答应。','供应审查尚在实际进行中，未读回信前不提前给出批准或拒绝。','等这次审查真正走完',`${application.job.startAt}—${application.job.completeAt}是原申请安排；费用已经有自己的记录。`,'查看供应申请与原资源',{nextDate:jobNext(application.job,date),completeAt:application.job.completeAt})
 const adapter=relay.adapters.find(a=>a.businessId===business.id&&active(a.job))
 if(adapter?.job)return scene('supply','有了许可，还要把这条线路认真接好。','实际适配正在原资源上进行。新线路不会因为换页就完成，也不会加入原已冻结的周期。','留出这次真实适配的日子',`${adapter.job.startAt}—${adapter.job.completeAt}；已确认周期沿原供应选择，后续选择另行核对。`,'查看原供应适配与资源',{nextDate:jobNext(adapter.job,date),completeAt:adapter.job.completeAt})
 if(business.lifecycle!=='operating')return scene('preparation','灯已经摆好，开门前再核对一遍。','已有资金、技术、原材料与本局供应许可各有来源，启用仍须通过原条件。','翻看已经做过的真实准备','既有材料和已完成的基础适配不必重复领取；缺少什么、是否启用，仍由原记录与命令预览核对。','核对原技术、材料、供应与启用条件')
 const marketing=relay.audiences.find(a=>a.businessId===business.id&&active(a.job))
 if(marketing?.job)return scene('marketing','请人来聊聊需求，也要花真实的日子。','获客任务尚未完成，不能把还没到来的名单当作已签客户。','等这一份实际获客记录',`${marketing.job.startAt}—${marketing.job.completeAt}；既有客户身份不会重新变成一笔营销收入。`,'查看本次获客与原资源',{nextDate:jobNext(marketing.job,date),completeAt:marketing.job.completeAt})
 if(!customers.length){
  const audience=relay.audiences.find(a=>a.businessId===business.id&&a.completedAt!==null&&a.completedAt<=date&&a.members.some(id=>!relay.customers.some(customer=>customer.personId===id)))
  if(!audience)return scene('intake','线路备好了，还要听听谁真的需要。','目前没有可据此签约的新潜客。营销或选择已有视频受众，不保证成交。','认真做一次真实获客','客群、实际资源、付费获客与明确选择的已有视频受众都保留；不凭空发放客户或充值。','核对客群与真实获客')
  const offer=relay.offers.find(o=>o.businessId===business.id)
  return offer?scene('terms','有人愿意聊聊，先把承诺写明白。','实际潜客与已保存报价都在，签约、充值和开服务仍是不同决定。','给真实客户核对一份原合同','选择实际身份、已保存报价、预付或后付信用与有效期；签约不自动收钱、充值或开服务。','核对客户、已保存报价与信用条款'):scene('terms','来访者坐下了，先认真写一份报价。','潜客已经实际留下，价格与支持承诺仍需要你另行核对。','写下仅供后续签约的报价','按量或实际支持方案、单位价格和成本分别核对；保存报价还没有确认收入。','核对并保存本次报价')
 }
 const unfunded=customers.find(customer=>customer.mode==='prepaid'&&customer.balance.prepaidFen===0&&customer.termEnd>=date)
 if(unfunded)return scene('funding','合同留下了，余额还需要另一份确认。','签约没有替客户充值。预付款形成客户保护与负债，服务后才按原用量确认收入。','明确核对这次模拟充值',`原月约定上限${moneyText(unfunded.rechargeLimitFen)}；本月剩余可充额度由原预览核验，不能凭当前余额推算。`,'核对客户余额、额度与本次充值')
 if(!relay.supplyOptions.some(option=>option.businessId===business.id&&option.permitted&&option.adapted))return scene('supply','电话那头的供应，还要逐条核实。','当前没有同时公开有效许可与实际适配的本主体供应，不能凭新闻或同名线路开服务。','核对原供应与实际可用条件','许可、适配、故障域和供应资产各自保留；初次批准附带的已完成基础适配不会要求再付一次。','查看原供应许可、适配与资金')
 return scene('planning','把下一班线路，认真留在日历上。','已有客户和供应并不等于服务已开始。新的周期仍需明确资源、日期、容量、供应预算与支持。','安排一次真实服务与支持','本期供应顺序和备援、客户合同期限、预留资金与跨季度行动各自核对；代理只能使用已有明确权限。','核对下一期客户、线路与真实安排')
}

function recordScene(relay:RelayProjection,phase:RelayScenePhase,title:string,line:string,label:string):RelaySceneProgress{
 return {phase,title,line,choice:{title,line,label},businessId:null,periodId:null,periodIds:relay?.periods.map(p=>p.id)??[],periodIndex:-1,nextDate:null,completeAt:null,command:null,audit:null,target:null,invalidReason:null,historical:false,outcome:'none',resultRefs:[],recordId:null,wait:null,intent:null}
}
function invalidScene(relay:RelayProjection,reason:string,target:RelaySceneTarget|null=null){
 return {...recordScene(relay,'invalid','这份原服务，需要重新选一次。',reason,'重新选择原中转对象'),target,invalidReason:reason,periodIds:[]}
}
function scopedRelay(relay:Relay,resolved:RelayTargetResolution):Relay{
 const businessId=resolved.business!.id,period=resolved.period
 return {...relay,businesses:[resolved.business!],stations:[resolved.station!],
  periods:period?[period]:[],customers:relay.customers.filter(c=>c.businessId===businessId&&(!period||period.customerIds.includes(c.id))),
  applications:period?[]:relay.applications.filter(a=>a.businessId===businessId),preparations:relay.preparations.filter(a=>a.businessId===businessId),
  adapters:relay.adapters.filter(a=>a.businessId===businessId),audiences:relay.audiences.filter(a=>a.businessId===businessId),
  offers:relay.offers.filter(a=>a.businessId===businessId),supplyOptions:relay.supplyOptions.filter(a=>a.businessId===businessId),
  changes:relay.changes.filter(a=>a.businessId===businessId),auditJobs:relay.auditJobs.filter(a=>a.businessId===businessId&&(!period||a.periodIds.includes(period.id))),
  // Collection is selected below by original source; the original command still collects every due invoice for that customer.
  receivables:[]}
}
function bound(progress:RelaySceneProgress,relay:Relay,resolved:RelayTargetResolution):RelaySceneProgress{
 const target=resolved.target!,periodIds=relay.periods.filter(p=>p.businessId===target.businessId).map(p=>p.id)
 const date=progress.nextDate
 const stopped=resolved.period&&(resolved.period.stoppedAt!==null||[resolved.period.job?.status,resolved.period.supportJob?.status].some(status=>status==='cancelled'||status==='interrupted'))
 return {...progress,target,businessId:target.businessId,periodId:resolved.period?.id??null,periodIds,periodIndex:resolved.period?periodIds.indexOf(resolved.period.id):-1,
  recordId:relayTargetEntity(target),wait:date?{date,label:progress.phase==='support'?'等这期原支持完成':progress.phase==='audit-waiting'?'等这批原计量复核':progress.phase==='planned'?'等这期原服务开工':'等这份原安排的下一反馈'}:null,
  outcome:stopped?'non-success':['planned','service','support','audit-waiting','marketing','preparation'].includes(progress.phase)?'pending':progress.phase==='period-closed'?'actual':'none',
  resultRefs:resolved.period?[{kind:'period',id:resolved.period.id,date:resolved.period.createdAt}]:[{kind:'business',id:target.businessId,date:resolved.station!.createdAt}],
  intent:progress.audit?'audit':progress.phase==='planning'&&target.kind==='business'?'service':null}
}
function jobRecord(relay:Relay,date:string,resolved:RelayTargetResolution):RelaySceneProgress{
 const job=resolved.job!,target=resolved.target!,kind=resolved.audit?'复核':job.definitionId==='relay-service'?'服务':target.kind==='application'?'供应申请':target.kind==='audience'?'获客':'支持'
 const waiting=active(job),next=waiting?jobNext(job,date):null
 const complete=job.status==='completed',stopped=job.status==='cancelled'||job.status==='interrupted'
 const title=job.status==='planned'?`这份原${kind}，已经排进日历。`:job.status==='running'?`这份原${kind}，仍在实际进行。`:complete?`这份原${kind}已经实际完成。`:`这份原${kind}已经停下。`
 const line=`${job.startAt}—${job.completeAt}。`+(waiting?'日期到达不替代原任务的实际完成；资源、费用与旧约仍按原记录执行。':complete?'完成的是这一份原任务，独立计量、账目更正和实际回款仍分别核对。':'等候不会免费重做；原已付成本、行动与旧责任保留。')
 const result=bound(recordScene(relay,waiting?(resolved.audit?'audit-waiting':job.status==='planned'?'planned':kind==='支持'?'support':'service'):'records',title,line,'翻看这份原任务与同一期记录'),relay,resolved)
 return {...result,historical:!waiting,outcome:waiting?'pending':complete?'actual':stopped?'non-success':'none',nextDate:next,completeAt:job.completeAt,
  wait:next?{date:next,label:`等这份原${kind}${job.status==='planned'?'开工':'完成'}`} :null,
  resultRefs:[...result.resultRefs,{kind:'job',id:job.id,date:complete?job.completeAt:job.releasedAt??job.startAt}],recordId:job.id,command:null,audit:null,intent:null}
}
function focusedRelaySceneProgress(relay:RelayProjection,date:string,target:RelaySceneTarget|null,context:RelaySceneContext):RelaySceneProgress|null{
 const resolved=resolveRelaySceneTarget(relay,target,context)
 if(resolved.status==='invalid')return invalidScene(relay,resolved.reason!,target)
 if(resolved.status==='entry')return recordScene(relay,'opening','先选定这盏灯下的原服务。','显选原中转站、客户或账期；准备新站另行核对资本与资格。查看不会签约、充值或开始服务。','选择原中转对象或准备新站')
 const value=relay!,t=resolved.target!,business=resolved.business!
 if(t.kind==='period'&&t.jobId!==undefined)return jobRecord(value,date,resolved)
 if(t.kind==='period'&&resolved.meter){
  const meter=resolved.meter,known=meter.auditedUnits!==null
  const scene=bound(recordScene(value,'records','这一天的原计量，仍在这期票根上。',`${meter.date}，原报告${meter.reportedUnits}单位；${known?'独立复核实计'+meter.auditedUnits+'单位':'实计待核'}。原价格和引用保留，查看不会更正或收款。`,'翻看这条原计量与原账'),value,resolved)
  return {...scene,historical:true,outcome:known?'actual':'none',resultRefs:[...scene.resultRefs,{kind:'meter',id:meter.id,date:meter.date}],recordId:meter.id}
 }
 if(t.kind==='application'){
  const application=resolved.application!
  if(active(resolved.job))return {...jobRecord(value,date,resolved),phase:'supply'}
  const result=bound(recordScene(value,'supplier-letter','这封原供应回信，还由你亲手拆开。',`${resolved.job!.startAt}—${resolved.job!.completeAt}。未读之前不宣布批准或有效期，原费用与准备来源保留。`,'阅读这份原供应回信'),value,resolved)
  if(!application.read&&resolved.job!.status==='completed'&&resolved.job!.completeAt<=date&&application.decisionAt<=date)return {...result,command:{kind:'ReadRelaySupplyDecision',payload:{applicationId:application.id},confirm:false},resultRefs:[{kind:'application',id:application.id,date:application.appliedAt}]}
  if(application.read)return {...result,phase:'records',historical:true,outcome:application.approved===true?'actual':application.approved===false?'non-success':'none',title:application.approved===true?'原回信写下了这一份许可。':'原回信与原成本都保留。',line:application.approved===true?`本局许可有效至${application.expiresAt}；实际适配、用途和当前日期仍须分别核对。`:'这次申请没有公开有效许可；不会替换为另一份批准。',command:null,resultRefs:[{kind:'application',id:application.id,date:application.decisionAt}]}
  return {...jobRecord(value,date,resolved),phase:'records'}
 }
 if(t.kind==='audience'){
  const audience=resolved.audience!
  if(active(resolved.job))return {...jobRecord(value,date,resolved),phase:'marketing'}
  return {...bound(recordScene(value,'terms','这份原需求名单，留在同一间站。',`${audience.members.length}位公开潜客；名单不是已签合同，报价、身份、预付/后付与期限仍须明确选择。`,'翻看这份原获客与客户约定'),value,resolved),outcome:audience.completedAt?'actual':'non-success',resultRefs:[{kind:'audience',id:audience.id,date:audience.completedAt??audience.createdAt}]}
 }
 if(t.kind==='customer'){
  const customer=resolved.customer!
  return {...bound(recordScene(value,'records','这一位原客户的承诺，仍须逐项核对。',`${customer.signedAt}—${customer.termEnd}，${customer.mode==='prepaid'?'预付余额':'后付信用'}；未消费余额${moneyText(customer.balance.prepaidFen)}、原应收${moneyText(customer.balance.receivableFen)}分列。查看不会充值、收款或安排另一账期。`,'翻看这位原客户与各期原账'),value,resolved),historical:customer.closedAt!==null,resultRefs:[{kind:'customer',id:customer.id,date:customer.signedAt}]}
 }
 const scoped=scopedRelay(value,resolved)
 let progress=legacyRelaySceneProgress(scoped,date,resolved.period?.id)!
 let futureReceivable:Relay['receivables'][number]|null=null
 if(resolved.period){
  const period=resolved.period,sources=new Set([period.id,...value.meters.filter(m=>m.periodId===period.id).map(m=>m.id)])
  const invoice=value.receivables.find(r=>sources.has(r.sourceId)&&r.dueAt<=date&&r.amountFen>r.collectedFen+r.reversedFen&&period.customerIds.includes(r.customerId))
  if(invoice&&progress.phase!=='correction'){
   const due=value.receivables.filter(r=>r.customerId===invoice.customerId&&r.dueAt<=date).reduce((n,r)=>n+r.amountFen-r.collectedFen-r.reversedFen,0)
   progress={...recordScene(value,'collection','这位原客户，已有到期款可以核对。',`本期有原单到期；本次命令收取该客户全部到期原单${moneyText(due)}，可能包括其他账期。回款不重复确认收入。`,'核对这位原客户全部到期原款'),command:{kind:'CollectRelayDue',payload:{customerId:invoice.customerId},confirm:true}}
  }
  if(!invoice&&progress.phase==='settling'&&!active(period.job)&&!active(period.supportJob)
   &&!value.auditJobs.some(a=>a.periodIds.includes(period.id)&&active(a.job))&&!pendingCorrections(value,period.id).length){
   futureReceivable=value.receivables.filter(row=>row.dueAt>date&&row.amountFen>row.collectedFen+row.reversedFen
    &&period.customerIds.includes(row.customerId)&&value.customers.filter(c=>c.id===row.customerId&&c.businessId===period.businessId).length===1
    &&(row.sourceId===period.id||value.meters.some(m=>m.id===row.sourceId&&m.periodId===period.id&&m.customerId===row.customerId)))
    .sort((a,b)=>a.dueAt.localeCompare(b.dueAt)||a.id.localeCompare(b.id))[0]??null
   if(futureReceivable){
    const number=value.customers.filter(c=>c.businessId===period.businessId).findIndex(c=>c.id===futureReceivable!.customerId)+1
    const amount=futureReceivable.amountFen-futureReceivable.collectedFen-futureReceivable.reversedFen
    progress={...progress,title:'这笔原应收，还要等到约定的日子。',line:`客户${number}的原应收${moneyText(amount)}尚未到账；原成本、支持与应付继续按记录保留。`,
     choice:{title:'等这笔原应收真正到期',line:`${futureReceivable.dueAt}是这笔原单的到期日。推进仍经过原日历屏障与费用，到期后再由你明确收款。`,label:`等客户${number}的原应收到期`},nextDate:futureReceivable.dueAt}
   }
  }
  // A period may close before an independent audit. Do not erase original allowed follow-up actions by lifecycle alone.
  if(progress.phase==='closed'&&relayAuditableMeters(value,period.id).length)progress={...recordScene(value,'audit-ready','这一期原计量，仍可核对独立依据。','企业状态与原计量分别保留；是否能新安排复核仍由原预览核验，已知更正、应收应付不会因关闭消失。','核对本期原复核条件'),audit:{businessId:business.id,periodId:period.id}}
 }
 const result=bound(progress,value,resolved)
 if(futureReceivable)return {...result,outcome:result.outcome==='non-success'?'non-success':'pending',wait:{date:futureReceivable.dueAt,label:progress.choice.label},resultRefs:[...result.resultRefs,{kind:'receivable',id:futureReceivable.id,date:futureReceivable.date}]}
 return {...result,command:result.command,audit:result.audit}
}

/** Undefined is the old initial recommendation; every explicitly supplied identity fails closed. */
export function relaySceneProgress(relay:RelayProjection,date:string,target?:RelaySceneTarget|string|null,context?:RelaySceneContext):RelaySceneProgress|null{
 if(target===undefined)return legacyRelaySceneProgress(relay,date)
 if(typeof target==='string'){
  const periods=relay?.periods.filter(p=>p.id===target)??[],period=periods.length===1?periods[0]:undefined
  if(!period)return invalidScene(relay,'原账期不存在或不唯一，请重新选择；没有换到另一账期。')
  if(context){
   const business=relay?.businesses.find(b=>b.id===period.businessId),station=relay?.stations.find(s=>s.businessId===period.businessId)
   if(!business||!station)return invalidScene(relay,'没有取得原企业与中转站，请重新选择。')
   return focusedRelaySceneProgress(relay,date,{kind:'period',runId:context.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,periodId:period.id},context)
  }
  return legacyRelaySceneProgress(relay,date,target)
 }
 if(target===null&&!context)return recordScene(relay,'opening','先明确选择一份原服务。','没有替你选择另一企业或账期；查看与准备仍分开。','选择原中转对象')
 if(!context)return invalidScene(relay,'缺少原人生与账户上下文，请重新选择。',target)
 return focusedRelaySceneProgress(relay,date,target,context)
}
