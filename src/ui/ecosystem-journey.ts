import type {DeepseekProjection} from '../core/deepseek-projection.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {DEEPSEEK_JOBS} from '../content/deepseek.ts'
import {isoDate} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'
import {ecosystemContractCosts} from './ecosystem-contract-costs.ts'
import {ecosystemContractResponsibility} from './ecosystem-contract-responsibility.ts'
import {resolveEcosystemSceneTarget,type EcosystemSceneTarget,type EcosystemSceneContext,type EcosystemTargetResolution} from './ecosystem-scene-target.ts'

export type EcosystemChoiceIntent='objects'|'leads'|'contracts'|'open'|'materials'|'basics'|'adapt'|'outreach'|'lead'|'remediation'|'collection'|'business'|'next'|'record'
export type EcosystemJourneyAction=
 |{readonly kind:'choice';readonly intent:EcosystemChoiceIntent;readonly label:string}
 |{readonly kind:'command';readonly command:'ActivateBusiness'|'SubmitEcoDelivery';readonly payload:Record<string,unknown>;readonly label:string;readonly confirm:boolean}
 |{readonly kind:'wait';readonly date:string;readonly label:string}
 |{readonly kind:'today';readonly label:string}
export interface EcosystemJourney{
 readonly resolution:EcosystemTargetResolution
 readonly phase:string
 readonly title:string
 readonly line:string
 readonly object:string
 readonly purpose:string
 readonly finishWhen:string
 readonly outcome:'none'|'pending'|'actual'|'non-success'
 readonly active:boolean
 readonly originDate:string|null
 readonly resultDate:string|null
 readonly facts:readonly string[]
 readonly action:EcosystemJourneyAction
 readonly paper:'intention'|'preparation'|'prepared'|'letter'|'commitment'|'work'|'ready'|'sent'|'reply'|'support'|'receivable'|'receipt'|'kept'|'stopped'
}
export interface EcosystemJourneyContext extends EcosystemSceneContext{
 readonly date:string
 readonly materialsReady:boolean
 readonly finance?:Parameters<typeof ecosystemContractCosts>[2]
 readonly transactions?:readonly {readonly id:string;readonly date:string;readonly sourceId:string;readonly amountFen:number;readonly businessId:string|null;readonly contractId:string|null}[]
}
type Eco=NonNullable<DeepseekProjection>
type Content=Omit<EcosystemJourney,'resolution'>
const choice=(intent:EcosystemChoiceIntent,label:string):EcosystemJourneyAction=>({kind:'choice',intent,label})
const wait=(date:string,label:string):EcosystemJourneyAction=>({kind:'wait',date,label})
const activeJob=(job:ProductionJob|null|undefined)=>!!job&&['planned','running'].includes(job.status)
const nextJob=(job:ProductionJob,date:string)=>!activeJob(job)?null:job.status==='planned'&&job.startAt>date?job.startAt:job.completeAt>date?job.completeAt:null
const jobFacts=(job:ProductionJob)=>{
 const terms=DEEPSEEK_JOBS.find(t=>t.id===job.definitionId)
 return `${job.startAt}—${job.completeAt}；${terms?'原基础预算'+moneyText(terms.costFen)+' / '+terms.actionPoints+'点；':''}已预留、实际支付及工资维护按原账分别核对。`
}
const receipts=(v:Eco,contractId:string)=>v.deliveries.filter(d=>d.contractId===contractId)
const name=(v:Eco,c:Eco['contracts'][number])=>`客户${v.leads.findIndex(l=>l.personId===c.personId)+1} · ${v.catalog.models.find(m=>m.id===c.modelId)?.label??'原模型'} / ${v.catalog.products.find(p=>p.id===c.productId)?.label??'原用途'} · ${c.scope==='pilot'?'有限试点':'标准范围'}`
function currentPurpose(phase:string,outcome:EcosystemJourney['outcome']):Pick<Content,'purpose'|'finishWhen'>{
 const purpose=(purpose:string,finishWhen:string)=>({purpose,finishWhen})
 if(phase==='invalid'||phase==='unknown'||phase.endsWith('-unknown')||phase==='unavailable')return purpose('先核对这份原合作的公开事实，再选择眼前一步。','明确找回有效原对象；不会自动接受或换成另一份合作。')
 if(phase==='completed'||phase==='paid'||phase==='prepaid-delivery')return purpose('收好这份实际结果，再决定接下来的生活。','本段结果可到此停留；下一份合作须另选，不要求关闭企业。')
 if(phase==='cancelled'||phase==='support-interrupted'||phase.endsWith('-stopped'))return purpose('看清这次停在哪里，保留实际成本与原责任。','核对原后果、退款或未完约定；停止不记作成功或新增回款。')
 if(phase==='collection'||phase==='receivable')return purpose('把已经发生的原款按自己的期限核清。','到期后显选金额实际收取；也可先回生活，未收款仍保留。')
 if(phase==='customer-review')return purpose('等这位原客户真正回应已经提交的作品。','看到原认可或拒绝后再回应；不提前宣布收入或实收。')
 if(phase==='ready-to-submit')return purpose('把已经完成的这份作品，亲手交给原客户。','提交后等原客户实际复核；制作完成不是到账。')
 if(phase.startsWith('production-'))return purpose('把答应的这份作品按原日子认真做完。','实际完成后亲手提交，再等客户复核；支持仍是独立承诺。')
 if(phase==='support')return purpose('把这份已验收合作的原支持真正走完。','看到原支持实际结果，再核对最后20%与原款；不自动接新单。')
 if(phase==='rejected')return purpose('回应原客户这次真实拒绝，选择还愿意承担什么。','明确安排合法补救，或核对退款与补偿后退出。')
 if(phase==='lead-business-unavailable')return purpose('先核对原企业是否恢复新增，保留这位客户的原回复期限。','不在暂停或收尾中接受新的合作；婉拒与原记录仍可核对。')
 if(phase==='lead-open')return purpose('比较这位客户的范围与真实投入，再决定是否接下。','显选试点或标准并原确认，或婉拒；预款不代替履约。')
 if(phase.startsWith('lead-'))return purpose('收好这封需求的原答复，再决定下一次尝试。','原答复可作停留点；没有自动接受另一位客户。')
 if(phase.endsWith('-completed'))return purpose('收好这份真正完成的准备，再决定怎样继续。','这份准备可到此停留；用途、需求和合同仍分别显选。')
 if(['preparation-planned','preparation-running','adapter-planned','adapter-running','outreach-planned','outreach-running','business-working'].includes(phase))return purpose('给已经安排的这份工作留好真实的日子。','看到自己的原反馈或明确中断；准备与人数不是服务收入。')
 if(phase==='materials-needed')return purpose('把本次能交付的范围认真准备清楚。','看到服务材料实际完成；没有因此接受客户承诺。')
 if(phase==='basics-needed')return purpose('补上这次合作真正需要的技术基础。','等学习实际完成；用途许可与客户合同仍须另选。')
 if(phase==='adaptation-needed')return purpose('显选本次模型用途，让工具真正适合这份服务。','看到该用途适配实际完成；不取得股份或真实供应授权。')
 if(phase==='activation')return purpose('核对已做好的准备，决定是否启用服务。','明确启用后再找真实需求；不会自动接合同。')
 if(phase==='business-closed')return purpose('收好这段经营经历，再安排今天的生活。','原主体已经关闭，经营记录继续可查。')
 if(phase==='business-paused'||phase==='business-winding_down')return purpose('把原企业的承诺与实际停止范围分别收好。','旧任务、退款和款项继续核对；暂停不会自动撤约或恢复。')
 if(phase==='original-contracts')return purpose('找回一份原来答应的合作，继续其中真实的一步。','明确选择原对象即可；查看不重新承诺或付费。')
 if(phase==='original-money')return purpose('核对本账户真实留下的原款与旧义务。','各笔原款和资产按自己的来源处理，不把余额当新客户或新服务。')
 if(phase==='known-leads'||phase==='outreach-needed')return purpose('听清具体的服务需要，再决定下一次承担。','看到实际需求即可停留；没有自动成交或客户收入。')
 return outcome==='non-success'?purpose('收好这次真实停下的记录。','旧费用与约定保留，可以回到今天。'):purpose('决定怎样用自己的时间与手艺，参与一次具体合作。','明确下一次尝试或暂不投入；不自动开企业、接单或投资。')
}

/** An ecology-only presentation. It never executes, previews, reveals a fact or replaces the selected object. */
export function ecosystemJourney(v:DeepseekProjection,target:EcosystemSceneTarget|null,context:EcosystemJourneyContext):EcosystemJourney{
 const resolution=resolveEcosystemSceneTarget(v,target,context),date=context.date
 const base:Content={phase:'entry',title:'从一份真正需要你的合作开始。',line:'先看眼前能准备什么，再决定是否承担客户的请求。',object:'尚未写下承诺的合作意向',purpose:'决定怎样用自己的时间与手艺，参与一次具体合作。',finishWhen:'明确下一次尝试或暂不投入；不自动开企业、接单或投资。',outcome:'none',active:false,originDate:null,resultDate:null,facts:[],action:choice('open','核对这次服务的条件与自有投入'),paper:'intention'}
 const present=(content:Partial<Content>):EcosystemJourney=>{const combined={...base,...content};return {resolution,...combined,...currentPurpose(combined.phase,combined.outcome)}}
 if(resolution.status==='invalid')return present({phase:'invalid',title:'先找回这份原合作。',line:resolution.reason!,action:choice('objects','重新选择原生态对象')})
 if(!v)return present({phase:'unavailable',line:'当前尚未取得生态服务公开记录。可以回到今天，原存档不变。',action:{kind:'today',label:'回到今天，再决定安排'}})
 if(!target){const businesses=v.businesses.filter(b=>b.definitionId==='ecosystem-service'&&b.lifecycle!=='closed');return present(businesses.length?{action:choice('objects','把一份原合作放到眼前'),line:'已有生态企业和原约定，请明确选择想继续的对象；没有选成另一份权益安排。'}:{})}
 const b=resolution.business!,funds=`企业可花${moneyText(b.funds.availableFen)} · 预款保护${moneyText(b.funds.prepaidLiabilityFen)} · 待收${moneyText(b.funds.receivableFen)} · 待付${moneyText(b.funds.payableFen)}`
 const common={originDate:b.history[0]?.date??null,facts:[funds],object:'这间原生态企业的合作夹'}
 if(target.kind==='business'){
  const jobs=context.operations!.jobs.filter(j=>j.businessId===b.id&&activeJob(j)).sort((a,b)=>(nextJob(a,date)??'9999').localeCompare(nextJob(b,date)??'9999')||a.id.localeCompare(b.id)),first=jobs[0],next=first?nextJob(first,date):null
  if(first&&next)return present({...common,phase:'business-working',title:'原来答应的工作，仍在自己的日历上。',line:'原制作、支持与准备各按原安排继续。也可以明确翻回其中一份，不会重新付费。',outcome:'pending',active:true,action:wait(next,'等原安排的下一处反馈'),paper:'work'})
  if(b.lifecycle==='closed')return present({...common,phase:'business-closed',title:'这间企业，已经合上了。',line:'过去的合作与原账都在，今天由你安排。',outcome:'actual',action:{kind:'today',label:'收好企业记录，回到今天'},paper:'kept'})
  if(['winding_down','paused'].includes(b.lifecycle))return present({...common,phase:'business-'+b.lifecycle,title:b.lifecycle==='paused'?'先不接新合作，原承诺仍保留。':'这间企业正在实际收尾。',line:'暂停新增与真正收尾分别发生；原支持、退款、应收和应付不会因此清除。',action:choice('business','核对原约定、继续或收尾'),paper:'kept'})
  if(b.lifecycle==='preparing'){
   if(!context.materialsReady)return present({...common,phase:'materials-needed',title:'先把能交付什么，认真写清。',line:'材料只是准备。选择实际资源和日子，尚未因此接下客户。',action:choice('materials','准备这次服务的材料'),paper:'preparation'})
   if(!v.technicallyReady)return present({...common,phase:'basics-needed',title:'先补上这份合作真正需要的技术。',line:'学习须实际投入和完成；不会自动取得模型用途许可或客户。',action:choice('basics','安排这次技术学习'),paper:'preparation'})
   if(!v.adapters.some(a=>a.businessId===b.id&&a.ready))return present({...common,phase:'adaptation-needed',title:'选定用途，再让工具真正适合它。',line:'部署与培训是不同承诺。模型节点已到达，也仍需明确原虚构用途和实际适配。',action:choice('adapt','选择模型与这次服务用途'),paper:'preparation'})
   return present({...common,phase:'activation',title:'准备已经留下，是否开始承接请求？',line:'启用仍核原材料、产能与资格；不替你获客或接受合同。',action:{kind:'command',command:'ActivateBusiness',payload:{businessId:b.id},label:'核对准备，启用这间生态企业',confirm:false},paper:'preparation'})
  }
  if(v.contracts.some(c=>c.businessId===b.id&&(!['completed','cancelled'].includes(c.status)||(c.balance?.receivableFen??0)>0)))return present({...common,phase:'original-contracts',title:'原来的合作，先选择想继续的一份。',line:'旧制作、客户复核、支持与款项都在。没有自动接另一份合同。',action:choice('contracts','选择一份原合作继续'),paper:'commitment'})
  if(b.funds.receivableFen>0||b.funds.payableFen>0)return present({...common,phase:'original-money',title:'本账户的原款与旧义务，还要分别核对。',line:'账户中的原应收、应付或其他资产并不都是这一单的款。原来源、期限与完整账目保留，没有因此出现新的客户请求。',active:true,action:choice('business','核对原账户的余额与旧约'),paper:'kept'})
  if(v.leads.some(l=>l.businessId===b.id&&l.status==='open'&&l.expiresAt>=date))return present({...common,phase:'known-leads',title:'有人已经说出了自己的需要。',line:'先选择一位原客户，再比较试点、标准范围和真实承担。',action:choice('leads','选择想回应的一位原客户'),paper:'letter'})
  return present({...common,phase:'outreach-needed',title:'去听听，谁真正需要这份服务。',line:'付费研究与已有受众转介须另选；尚未安排这份研究，也没有收到新的客户来信。',action:choice('outreach','选择这次想了解的需求'),paper:'intention'})
 }
 const job=resolution.job
 if(['preparation','adapter','outreach'].includes(target.kind)&&job){
  const n=nextJob(job,date),stopped=['interrupted','cancelled'].includes(job.status),done=job.status==='completed'&&job.completeAt<=date
  const label=target.kind==='preparation'?resolution.preparation!.kind==='materials'?'服务材料':'技术学习':target.kind==='adapter'?'模型用途适配':'有限需求研究'
  const modelId=resolution.adapter?.modelId??resolution.outreach?.modelId,productId=resolution.adapter?.purpose??resolution.outreach?.productId,model=v.catalog.models.find(m=>m.id===modelId),product=v.catalog.products.find(p=>p.id===productId)
  const contextLine=model&&product?model.label+' / '+product.label+(resolution.outreach?' / '+(resolution.outreach.mode==='paid'?'付费需求研究':'原受众转介'):'')+'。':''
  if(activeJob(job))return present({...common,phase:target.kind+'-'+job.status,object:'这份'+label+'的原安排',title:job.status==='planned'?'给'+label+'留好了日子。':label+'，正在认真做。',line:contextLine+jobFacts(job),originDate:job.startAt,outcome:'pending',active:true,action:n?wait(n,'等这份'+label+(job.status==='planned'&&n===job.startAt?'开工':'完成')):choice('record','核对原任务与日历'),paper:job.status==='planned'?'commitment':'work'})
  const next=done?ecosystemJourney(v,{runId:target.runId,accountId:target.accountId,businessId:target.businessId,kind:'business'},context).action:null
  return present({...common,phase:target.kind+(done?'-completed':stopped?'-stopped':'-unknown'),object:'这份'+label+'的实际记录',title:done?label+'，已经真正完成。':stopped?'这份'+label+'停了下来。':'这份准备仍需核对原记录。',line:contextLine+(target.kind==='outreach'&&done?`这次实际留下${resolution.outreach!.personIds.length}份需求；没有成交或服务收入。`:done?'完成的是这一份准备；下一份用途、客户和承诺仍由你另选。':'原成本和未完安排保留，没有把停止当作完成。'),originDate:job.startAt,resultDate:done?job.completeAt:job.releasedAt,outcome:done?'actual':stopped?'non-success':'none',action:stopped?{kind:'today',label:'收好这份停止记录，回到今天'}:next&&next.kind!=='wait'?next:choice(done?'objects':'record',done?'选择同一企业的下一处原约定':'核对这份原准备'),paper:done?'prepared':stopped?'stopped':'preparation'})
 }
 if(resolution.lead){const l=resolution.lead,open=l.status==='open'&&l.expiresAt>=date,number=v.leads.findIndex(row=>row.personId===l.personId)+1,client=number>0?'客户'+number:'这位原客户',model=v.catalog.models.find(m=>m.id===l.modelId),product=v.catalog.products.find(p=>p.id===l.productId)
  const line=`${client} · ${model?.label??'原模型'} / ${product?.label??'原用途'}，预算上限${moneyText(l.maxPriceFen)}，${l.expiresAt}前答复。`
  if(open&&b.lifecycle!=='operating')return present({...common,phase:'lead-business-unavailable',object:client+'的原需求来信',title:'原需求仍在，企业目前不承接新合作。',line:line+' 原企业暂停或正在收尾；原回复期限不会因此延长。',originDate:l.createdAt,action:choice('business','核对原企业的暂停与恢复条件'),paper:'kept'})
  return present({...common,phase:open?'lead-open':'lead-'+l.status,object:client+'的原需求来信',title:open?'这次合作，愿意承担多大的范围？':'这份需求已经留下原来的答复。',line,originDate:l.createdAt,outcome:open?'none':l.status==='accepted'?'actual':'non-success',active:open,finishWhen:'明确试点或标准的真实承担，或婉拒；原生产与独立支持一起核对。',action:open?choice('lead','比较范围，再答复'+client):l.status==='accepted'?choice('contracts','翻看'+client+'已经答应的原合作'):{kind:'today',label:'收好这次答复，回到今天'},paper:open?'letter':'kept'})
 }
 const c=resolution.contract
 if(!c)return present({...common,phase:'unknown',line:'没有取得该原对象的完整公开阶段；没有换成另一份合作。',action:choice('record','核对原记录')})
 const ds=receipts(v,c.id),remaining=ds.filter(d=>d.remainingFen>0).sort((a,b)=>a.dueAt.localeCompare(b.dueAt)||a.id.localeCompare(b.id)),due=remaining[0]
 const collectedAt=(deliveryId?:string)=>{
  const ids=new Set(ds.filter(d=>deliveryId===undefined||d.id===deliveryId).map(d=>d.id))
  return context.transactions?.filter(tx=>{try{isoDate(tx.date);return tx.date<=date&&tx.businessId===b.id&&tx.contractId===c.id&&ids.has(tx.sourceId)&&Number.isSafeInteger(tx.amountFen)&&tx.amountFen>0}catch{return false}}).map(tx=>tx.date).sort().at(-1)??null
 }
 const otherProtected=b.funds.prepaidLiabilityFen-c.balance!.prepaidFen,otherReceivable=b.funds.receivableFen-c.balance!.receivableFen
 const otherFacts=[...(otherProtected>0?['本账户其它客户保护'+moneyText(otherProtected)]:[]),...(otherReceivable>0?['其它原应收'+moneyText(otherReceivable)]:[]),...(b.funds.payableFen>0?['本账户原应付'+moneyText(b.funds.payableFen)]:[])]
 const contractFacts=[`本合同已确认收入${moneyText(c.balance!.recognizedIncomeFen)}；本单未履约保护${moneyText(c.balance!.prepaidFen)}、原应收${moneyText(c.balance!.receivableFen)}；应收部分累计实收${moneyText(ds.reduce((n,d)=>n+d.creditFen-d.remainingFen,0))}。`,...(otherFacts.length?[otherFacts.join('；')+'。均按各自原来源保留，不合并成本单收益。']:[])]
 const directCosts=ecosystemContractCosts(c,context.operations?.jobs,context.finance,date)
 const responsibility=ecosystemContractResponsibility(c,context.finance)
 const spentLine='这次制作与支持已付'+moneyText(directCosts.paidFen)+'，尚未开工的资金预留'+moneyText(directCosts.reservedFen)+'。'+(directCosts.reason??'已耗投入不会因退出退还。')
 const remainingResponsibilityLine=!responsibility.known?'本合作的原义务来源尚需核对，未知部分不按结清处理。':responsibility.hasResponsibility?'本合作仍有原未完义务，按各自原来源继续处理。':c.status==='cancelled'?'这份合作已没有未履约保护或未清应付；自己的待收款可以另行安排。':'这份合作的履约已经结束；待收款仍按原期限保留，也可以先回生活。'
 const remediated=c.remediationJobId!==null
 const data={originDate:c.acceptedAt,facts:contractFacts,object:name(v,c),purpose:'把同一位客户的这份承诺认真交付，再核清实际结果。',finishWhen:'生产、支持与原款分别看清；也可明确收缩或回生活，不自动接新单。'}
 if(resolution.delivery){const d=resolution.delivery,unpaid=d.remainingFen>0
  return present({...data,phase:unpaid?d.dueAt<=date?'collection':'receivable':d.creditFen>0?'paid':'prepaid-delivery',object:'这笔'+(d.stage==='production'?'已验收生产':'已完成支持')+'的原款',title:unpaid?d.dueAt<=date?'原款到了约定的日子，怎样收好？':'履约已经留下，现金仍在路上。':d.creditFen>0?'这笔原应收，已经实际收回。':'本阶段消费的是原预款，没有新增现金收取。',line:`原确认${moneyText(d.amountFen)}，消费原预款${moneyText(d.prepaidFen)}，信用部分${moneyText(d.creditFen)}；尚未实收${moneyText(d.remainingFen)}，原到期日${d.dueAt}。`,originDate:d.date,resultDate:unpaid?null:d.creditFen>0?collectedAt(d.id):d.date,outcome:unpaid?'pending':'actual',active:unpaid,action:unpaid?d.dueAt<=date?choice('collection','核对这笔原应收与收款金额'):wait(d.dueAt,'等这笔原款到期'):{kind:'today',label:'收好原记录，回到今天'},paper:unpaid?'receivable':d.creditFen>0?'receipt':'kept'})
 }
 if(c.status==='production'&&job){
  const n=nextJob(job,date),done=job.status==='completed'&&job.completeAt<=date,canSubmit=done&&c.submittedAt===null&&c.reviewAt!==null&&date<c.reviewAt,retry=remediated&&job.id===c.remediationJobId
  const support=c.supportJob,supportTerm=DEEPSEEK_JOBS.find(t=>t.id===support?.definitionId)
  const line=retry?'补救 '+jobFacts(job)+(support&&supportTerm?'后续支持另在'+support.startAt+'—'+support.completeAt+'，预算'+moneyText(supportTerm.costFen)+' / '+supportTerm.actionPoints+'点。':'后续支持安排仍需核对。')+spentLine:jobFacts(job)
  const title=canSubmit?retry?'补救稿准备好了，亲手再交一次。':'作品做好了，亲手交给这位客户。':job.status==='planned'?retry?'给这次补救，留好了日子。':'接下了承诺，制作还没开工。':job.status==='running'?retry?'这次补救，正在认真做。':'答应过的作品，正在认真做。':retry?'这次补救停了下来，余下的约定还在。':'这份制作没有按原约走到交付。'
  return present({...data,object:data.object+(retry?' · 这次补救':''),phase:canSubmit?'ready-to-submit':'production-'+job.status,title,line,outcome:activeJob(job)?'pending':canSubmit?'none':'non-success',active:true,action:canSubmit?{kind:'command',command:'SubmitEcoDelivery',payload:{contractId:c.id},label:retry?'把补救稿交给这位客户':'把这份作品交给原客户',confirm:false}:n?wait(n,retry?'等这次补救的下一处反馈':'等这份原作品的下一处反馈'):choice('remediation','看看停止后的责任与退出'),paper:canSubmit?'ready':job.status==='running'?'work':job.status==='planned'?'commitment':'stopped'})
 }
 if(c.status==='review')return present({...data,object:data.object+(remediated?' · 补救稿':''),phase:'customer-review',title:remediated?'补救稿已经交出，再等客户的回信。':'作品已经交出，等对方真正回应。',line:`${c.submittedAt??'原提交日期'}亲手提交；原复核日${c.reviewAt??'尚需核对'}。不提前宣布客户认可、收入或回款。`,outcome:'pending',active:true,action:c.reviewAt&&c.reviewAt>date?wait(c.reviewAt,remediated?'等客户回应这次补救':'等这位原客户复核'):choice('record','核对原复核与日历'),paper:'sent'})
 if(c.status==='rejected')return present({...data,phase:'rejected',title:remediated?'这次补救也没获认可，怎样收好余下责任？':'客户没认可这份作品。还要再试吗？',line:spentLine+(remediated?'这份合同的一次补救已用完；可以核对未履约预款的退款和旧款，结束这次合作。':'可以重新安排补救和后续支持，也可以退回未履约预款，结束这次合作。'),resultDate:c.reviewAt,outcome:'non-success',active:true,action:choice('remediation',remediated?'看看退款与结束这次合作':'看看再试一次，或退款退出'),paper:'reply'})
 if(c.status==='support'){const support=c.supportJob,interrupted=!!support&&['interrupted','cancelled'].includes(support.status),n=support?interrupted&&support.completeAt>date?support.completeAt:nextJob(support,date):null
  if(interrupted)return present({...data,phase:'support-interrupted',title:'答应的支持停了下来，责任还在。',line:spentLine+'等待不会补做或免费恢复；已确认收入、待收款和退出补偿各自保留。',outcome:'non-success',active:true,resultDate:support?.releasedAt??null,action:choice('remediation','看看中断后的责任与退出'),paper:'stopped'})
  return present({...data,phase:'support',title:remediated?'这次补救获认可，答应的支持仍要完成。':'生产已获认可，答应的支持还要走完。',line:`已实际验收生产的80%，支持仍按原日期和投入进行；完成支持才确认最后20%。${support?jobFacts(support):'原支持安排尚需核对。'}`,outcome:'pending',active:true,resultDate:c.deliveredAt,action:n?wait(n,'等这份原支持的反馈'):choice('record','核对原支持与未结责任'),paper:'support'})
 }
 if(due)return present({...data,phase:due.dueAt<=date?'collection':'receivable',title:c.status==='cancelled'?responsibility.known&&!responsibility.hasResponsibility?'这次合作停下了，还有自己的余款。':'合作已经停下，原款与责任仍须分别收好。':'履约已经完成，仍有自己的原款。',line:(c.status==='cancelled'?spentLine:'')+`${due.stage==='production'?'已验收生产':'已完成支持'}尚待收${moneyText(due.remainingFen)}，${due.dueAt}到期。`+remainingResponsibilityLine,resultDate:c.supportPostedAt??c.cancelledAt,outcome:c.status==='cancelled'?'non-success':'actual',active:true,action:due.dueAt<=date?choice('collection','选择这份合作的原应收'):wait(due.dueAt,'等这份合作的原款到期'),paper:c.status==='cancelled'?'stopped':'receivable'})
 return present({...data,phase:c.status==='completed'?'completed':c.status==='cancelled'?'cancelled':'unknown',title:c.status==='completed'?'这份合作，已经留下真实结果。':c.status==='cancelled'?'这次合作，就先到这里。':'这份合作的实际阶段，仍需核对。',line:c.status==='completed'?'生产和支持分别履行，原款以原账核对；下一次工作或生活仍由你决定。':spentLine+(responsibility.known&&!responsibility.hasResponsibility?'这份合作的原义务已经结清，退款与补偿记录仍留在账本里。':'退款、支持补偿与原义务仍须按各自来源核对。'),resultDate:[c.supportPostedAt,c.cancelledAt,collectedAt()].filter((d):d is string=>d!==null).sort().at(-1)??null,outcome:c.status==='completed'?'actual':c.status==='cancelled'?'non-success':'none',action:{kind:'today',label:'合上这份合作，回到今天'},paper:c.status==='cancelled'?'stopped':'kept'})
}
