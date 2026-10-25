import type {GamePanelProps} from './game-types.ts'
import type {RelayChoiceDraftSlot} from './relay-preparation-draft.ts'
import {relaySceneProgress} from './relay-scene-progress.ts'
import {resolveRelaySceneTarget,type RelaySceneTarget} from './relay-scene-target.ts'

export type RelayChoiceIntent=RelayChoiceDraftSlot|'objects'|'record'|'next'|'more'
export interface RelayJourneyAction{
 readonly intent:RelayChoiceIntent
 readonly label:string
 readonly caption:string
 readonly command?:{readonly kind:'ActivateBusiness';readonly payload:{readonly businessId:string};readonly confirm:true}
}
export function relayJourneyScene(action:RelayJourneyAction):{title:string;line:string;finishWhen:string}|null{
 if(action.command)return {title:'准备已经留下，是否让这间站开门？',line:'材料、供应许可与实际适配都可以核对。启用由你确认，不会自动获客或开始服务。',finishWhen:'原准备通过启用核对；获客、客户条款和服务仍另行决定。'}
 const scenes:Partial<Record<RelayChoiceIntent,{title:string;line:string;finishWhen:string}>>={
  open:{title:'这一次，试着为别人接通线路。',line:'先用自己的钱准备材料、申请许可，再去寻找真实需求。',finishWhen:'明确这次愿意投入的资本；开站还不是营业、签约或收入。'},
  basics:{title:'开门之前，先把技术学明白。',line:'技术基础还需要真实的时间与投入。先选择谁来学习、何时开始，再看这次安排。',finishWhen:'这份技术准备实际完成；申请与许可仍须另定。'},
  materials:{title:'先把这份申请，准备得让人看明白。',line:'这间站留好了一笔自有资本。服务材料还没完成，先选择谁来准备、何时开始。',finishWhen:'这份申请材料实际完成；供应审查还没有开始。'},
  application:{title:'下一封申请信，想寄给哪家供应？',line:'先对照公开价格、账期和故障域，再留出真实的申请时间。完成审查后，还要亲手读回信。',finishWhen:'这份申请得到实际回信，并由你亲手阅读；不保证批准。'},
  adapter:{title:'有了许可，还要把线路接好。',line:'选择这次实际适配的供应、资源和日期。已经完成的基础适配可复用，不重复付费。',finishWhen:'所选线路实际适配完成；获客与服务仍另定。'},
  capital:{title:'开门之前，再看一眼这间站的钱。',line:'已经支付的费用和仍预留的资金分开核对。启用门槛看此刻可花，不能靠未来客户充值补足。',finishWhen:'显选自有资本并核对真实可花；不会因此自动营业。'},
  marketing:{title:'先听听，谁真的需要这份服务。',line:'获客是一次新的投入，不保证签约。付费推广或已有视频受众都由你选择，不要求先做另一门生意。',finishWhen:'看见这次实际需求回信；报价、签约与充值分别决定。'},
  offer:{title:'有人留下需求，先把报价写清楚。',line:'这次愿意怎样收费、承担什么支持，由你自己写明。报价不会改动旧合同，也还没有收入。',finishWhen:'这份报价明确保存；具体客户仍须逐位选择。'},
  customers:{title:'这次，愿意答应哪些客户？',line:'逐位选择真实名单和已保存报价，再核对预付、后付、信用与期限。签下合同还没有收钱。',finishWhen:'本次显选客户的原约定保存；充值与实际服务仍另定。'},
  'customer-funds':{title:'合同留下了，这次充值另作决定。',line:'实收预款同时形成客户保护；用量与支持交付后才确认收入。先选清这次是哪位客户、充多少。',finishWhen:'这位客户的本次预款与等额保护实际保存；服务还没有开始。'},
  'supplier-funds':{title:'要为哪条线路，留多少自有资金？',line:'这笔钱先成为供应资产，真正消耗后才是成本。服务预算和客户保护仍分别核对。',finishWhen:'本次供应资产实际入账；没有自动安排服务或消费。'},
  service:{title:'把这一期，认真留在日历上。',line:'客户、线路和支持不会自己排好。由你选择对象、供应顺序、预算与未来日期，再承担这次约定。',finishWhen:'本期服务实际走到反馈，再逐项兑现支持、核账与原款。'},
 }
 return scenes[action.intent]??null
}
type Input=Pick<GamePanelProps,'view'|'features'|'accountId'>

/** Suggest one kind of decision from public saved facts. Never selects its form values. */
export function relayJourneyAction(p:Input,target:RelaySceneTarget|null|undefined):RelayJourneyAction{
 const choose=(intent:RelayChoiceIntent,label:string,caption:string):RelayJourneyAction=>({intent,label,caption})
 if(target===undefined)return choose('objects','先选定眼前的服务','明确翻开原站点、客户或账期，不替你安排。')
 const v=p.features.relay,r=resolveRelaySceneTarget(v,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})
 if(r.status==='invalid'||!v)return choose('objects','找回这份服务的原对象',r.reason??'当前没有可核的服务记录。')
 if(target===null)return v.businesses.length?choose('objects','先选回哪一份服务，留在眼前','原站点、客户和账期逐份选择；另作新准备也由你明确决定。'):choose('open','先决定，这次投入多少钱','从自己的钱开始；材料、许可、获客与服务还需分别投入。')
 const progress=relaySceneProgress(v,p.view.date,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})
 if(target.kind==='period'){
  if(target.jobId||target.meterId)return choose('next','回到同一期，看看接下来的事','保留这份原任务或计量，再显选本期当前记录。')
  if(progress?.intent==='audit')return choose('audit','给这期原账，安排一次独立核对','显选原资源和日期，只复核已经发生的记录。')
  return choose('next','看看本期还留下什么，再决定下一步','服务、支持、原款与旧余额分别核对；新一期另行显选。')
 }
 if(target.kind==='application')return choose('next','带着这封回信，核对本站下一步','保留原批准或拒绝；材料、适配与启用仍由原条件核对。')
 const business=r.business!
 if(['closed','winding_down','paused'].includes(business.lifecycle)||r.station?.trafficPaused)return choose('next','看清停下之后，仍要面对什么','原支持、余额、资产与欠款保留，恢复与退出独立决定。')
 if(target.kind==='customer'){
  if(r.customer?.closedAt===null&&r.customer.termEnd>=p.view.date&&r.customer.mode==='prepaid'&&r.customer.balance.prepaidFen===0)return choose('customer-funds','核对这位客户，本次要充多少','实收预款与等额保护并列；充值不确认服务收入。')
  return choose('next','收好这份客户约定，选择下一步','服务和新的客户条款仍须另外决定。')
 }
 if(target.kind==='audience'){
  if(r.audience?.completedAt===null)return choose('record','翻看这次获客的原安排','名单尚未实际形成，不能提前签约。')
  if(v.customers.some(c=>c.businessId===business.id&&c.originAudienceId===r.audience!.id))return choose('next','这份客户约定之后，核对服务的准备','已签客户不必增加到整份名单；其他潜客保留，新的签约仍可显选。')
  const available=r.audience?.members.filter(id=>!v.customers.some(c=>c.personId===id))??[]
  if(!available.length)return choose('next','收好这次需求回信，选择下一步','已签身份不重复转化，零新潜客也不会凭空生成合同。')
  return v.offers.some(o=>o.businessId===business.id)
   ?choose('customers','给哪些真实客户，写下这次承诺','显选原报价、具体潜客、付款方式、信用与期限；签约不充值。')
   :choose('offer','先写明，这次愿意答应的价格','显选按量或支持报价和单位价格；保存报价还没有收入。')
 }
 if(progress?.wait)return choose('record','翻看本站这份正在进行的安排','同一资源与实际日期保留，等待由原时钟处理。')
 if(business.lifecycle==='preparing'){
  if(!v.technicallyReady)return choose('basics','先把服务的技术基础补齐','实际1000元、1点、七日；已有技术不重复学习。')
  const materialReady=p.features.workbench.routes.find(route=>route.id==='api_relay')?.requirements.preparationReady===true||v.preparations.some(a=>a.businessId===business.id&&a.kind==='materials'&&a.job?.status==='completed')
  if(!materialReady)return choose('materials','把这份供应申请材料准备好','实际100元、1点、七日；资源和日期由你显选。')
  const supplies=v.supplyOptions.filter(s=>s.businessId===business.id&&s.permitted)
  if(!supplies.length)return choose('application','给哪一家供应，寄出申请','比较公开价格、账期与故障域；申请成本独立，未读信不预告批准。')
  if(!supplies.some(s=>s.adapted))return choose('adapter','把已许可的线路，实际接好','显选已许可供应与资源日期；原基础适配不重复收费。')
  const minimum=p.features.workbench.routes.find(route=>route.id==='api_relay')?.requirements.minimumCashFen
  if(minimum!==undefined&&business.funds.availableFen<minimum)return choose('capital','启用之前，再核对本站自有资金','开站门槛不是全链预算；已付准备费与客户保护都不能充作可花。')
  return {...choose('record','核对原准备，让本站开始营业','只启用已经具备的资本、技术、材料与许可；不自动获客或服务。'),command:{kind:'ActivateBusiness',payload:{businessId:business.id},confirm:true}}
 }
 if(v.periods.some(period=>period.businessId===business.id&&period.status!=='closed'))return choose('objects','选回眼前这一期，继续原来的约定','已有周期逐份显选；不默换到最新一期或再开服务。')
 const customers=v.customers.filter(c=>c.businessId===business.id&&c.closedAt===null&&c.termEnd>=p.view.date)
 if(!customers.length){
  const audience=v.audiences.some(a=>a.businessId===business.id&&a.completedAt!==null&&a.members.some(id=>!v.customers.some(c=>c.personId===id)))
  if(!audience)return choose('marketing','先听听，谁真的需要这条线路','显选客群和付费获客，或明确已有视频受众；不强迫经营视频或课程。')
  return v.offers.some(o=>o.businessId===business.id)?choose('customers','选定真实潜客，核对这次约定','报价、客户身份、预付/后付、信用和期限都由你选择。'):choose('offer','为这次实际需求，写一份报价','原价格和服务方案显选；不自动采用最近一份报价。')
 }
 if(customers.every(c=>c.mode==='prepaid'&&c.balance.prepaidFen===0))return choose('customer-funds','给哪一位客户，核对本次充值','客户资金形成保护和负债；不可拿未来充值填现在缺口。')
 if(!v.supplyOptions.some(s=>s.businessId===business.id&&s.permitted&&s.adapted))return choose('application','先核对，哪些线路真正可用','许可、适配、价格、故障域与预付资产分别保留。')
 return choose('service','为这些客户，认真安排一期服务','显选客户、供应顺序、资源、未来日期、预算和支持；原确认后才承诺。')
}
