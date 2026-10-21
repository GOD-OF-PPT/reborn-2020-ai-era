import type {DeepseekProjection} from '../core/deepseek-projection.ts'
import {DEEPSEEK_JOBS} from '../content/deepseek.ts'
import {moneyText} from './game-text.ts'

type Deepseek=NonNullable<DeepseekProjection>
type Job=Deepseek['contracts'][number]['productionJob']
type EntityKind='business'|'preparation'|'adapter'|'outreach'|'lead'|'contract'|'delivery'|'invitation'|'negotiation'|'agreement'|'governance'|'exit'
type Phase='opening'|'preparation'|'working'|'delivery'|'customer-review'|'support'|'collection'|'receivable'|'rejected'|'cancelled'|'history'|'settling'|'lead'|'invitation'|'diligence'|'terms'|'follow'|'locked'|'exit-request'|'exit-quote'|'governance'
export interface DeepseekSceneProgress{
 readonly source:'ecosystem'|'counterfactual-equity'
 readonly phase:Phase
 readonly active:boolean
 /** Smaller values are more urgent; only public dates participate in ranking. */
 readonly priority:number
 readonly publicDueAt:string|null
 readonly title:string
 readonly line:string
 readonly choice:{readonly title:string;readonly line:string;readonly label:string}
 readonly command?:{readonly kind:'SubmitEcoDelivery'|'CollectEcoReceivable'|'CollectEquityExit';readonly payload:Record<string,unknown>;readonly confirm:boolean}
 readonly nextDate:string|null
 readonly entity:{readonly kind:EntityKind;readonly id:string;readonly businessId:string;readonly accountId:string}|null
 readonly entityId:string|null
 readonly entityIds:readonly string[]
 readonly entityIndex:number
}
type Row=Omit<DeepseekSceneProgress,'entityIds'|'entityIndex'>
function nextJobDate(job:Job,date:string):string|null{
 if(!job||!['planned','running'].includes(job.status))return null
 return job.status==='planned'&&job.startAt>date?job.startAt:job.completeAt>date?job.completeAt:null
}
function jobFacts(job:Job):string{
 if(!job)return '任务安排、资源和花费可以在完整记录里查看。'
 const terms=DEEPSEEK_JOBS.find(t=>t.id===job.definitionId)
 return `${job.startAt}—${job.completeAt}，${terms?'基础支出'+moneyText(terms.costFen)+'、'+terms.actionPoints+'点；工资、维护和已经答应的支持另列。':''}${job.status==='planned'?'已经预留，还没开工。':job.status==='running'?'正在做，还没有完成。':['interrupted','cancelled'].includes(job.status)?'已中断或取消；已花成本保留，等候不会补做。':'已经完成；后续权利与回款还要分别核对。'}`
}

/** Selects only committed public records. It never chooses terms, grants permission or reveals a frozen fact. */
export function deepseekSceneProgress(deepseek:DeepseekProjection,date:string,preferredId?:string|null):DeepseekSceneProgress|null{
 if(!deepseek)return null
 const v=deepseek,rows:Row[]=[]
 const add=(kind:EntityKind,id:string,businessId:string,source:Row['source'],phase:Phase,active:boolean,priority:number,publicDueAt:string|null,title:string,line:string,detail:string,label:string,extra:Partial<Pick<Row,'command'|'nextDate'>>={})=>{
  const business=v.businesses.find(b=>b.id===businessId)
  rows.push({source,phase,active,priority,publicDueAt,title,line,choice:{title,line:detail,label},nextDate:null,entity:{kind,id,businessId,accountId:business?.accountId??'personal'},entityId:id,...extra})
 }
 const contractName=(id:string)=>{
  const c=v.contracts.find(c=>c.id===id)
  const number=c?v.leads.findIndex(l=>l.personId===c.personId)+1:0
  return c?`${number>0?'客户'+number:'这位客户'}的${c.productId==='deployment'?'部署':'培训'}合作`:'这份生态合作'
 }
 for(const d of v.deliveries){
  if(d.remainingFen<=0)continue
  const c=v.contracts.find(c=>c.id===d.contractId)
  if(!c)continue
  const due=d.dueAt<=date,stage=d.stage==='production'?'已验收生产':'已完成支持'
  add('delivery',d.id,c.businessId,'ecosystem',due?'collection':'receivable',true,due?10:55,d.dueAt,due?'约定的日子到了，收好这笔回款。':'有了履约凭据，现金还在路上。',`${contractName(c.id)}的${stage}原应收${moneyText(d.remainingFen)}，${d.dueAt}${due?'已经到期。':'才可收取。'}`,`这笔钱进入原生态服务账户；只收这笔全部未收余额，不重复确认收入。客户预款、支持和其他原账仍分别保留。`,due?'收取这笔到期款 · '+moneyText(d.remainingFen):'查看这笔应收与到账约定',due?{command:{kind:'CollectEcoReceivable',payload:{deliveryId:d.id,amountFen:d.remainingFen},confirm:false}}:{nextDate:d.dueAt})
 }
 for(const c of v.contracts){
  const name=contractName(c.id),job=c.remediationJob??c.productionJob
  const balances=`客户预款${moneyText(c.balance?.prepaidFen)}仍受保护，应收${moneyText(c.balance?.receivableFen)}另记；验收确认80%收入，完成支持再确认20%，回款另算。`
  if(c.status==='production'){
   if(job?.status==='completed'&&c.submittedAt===null){
    const allowed=c.reviewAt!==null&&date<c.reviewAt
    add('contract',c.id,c.businessId,'ecosystem','delivery',true,allowed?20:15,c.reviewAt,allowed?'作品做好了，等你亲手交给客户。':'原交付窗口过去了，承诺仍需要回应。',`${name}的${c.remediationJob?'补救':'生产'}已经实际完成；${allowed?'提交以后仍需客户复核。':'不能按旧窗口补领认可或回款。'}`,balances,allowed?'把这份作品交给客户':'查看逾期合同、退出条件与未结责任',allowed?{command:{kind:'SubmitEcoDelivery',payload:{contractId:c.id},confirm:false}}:{})
   }else add('contract',c.id,c.businessId,'ecosystem','working',true,40,nextJobDate(job,date),job?.status==='planned'?'已经接下合作，给制作留好了日子。':job?.status==='running'?'答应过的合作，正在认真做。':'生产停在了半路，原约定没有消失。',`${name}。${jobFacts(job)}`,balances,'查看制作安排、资源与退出方式',{nextDate:nextJobDate(job,date)})
  }else if(c.status==='review')add('contract',c.id,c.businessId,'ecosystem','customer-review',true,35,c.reviewAt,'作品已交，等对方真正回应。',`${name}已于${c.submittedAt}提交；${c.reviewAt??'原约定日期'}实际复核前，不替客户宣布认可或收入。`,balances,'查看客户回信日期与合同',{nextDate:c.reviewAt!==null&&c.reviewAt>date?c.reviewAt:null})
  else if(c.status==='rejected')add('contract',c.id,c.businessId,'ecosystem','rejected',true,18,c.reviewAt,'客户没有认可，先回应这份原约定。',`${name}已有本次实际反馈。补救需要重新选择资源与日期，也可以核对退款和有限退出。`,balances,'查看补救、退款或退出选择')
  else if(c.status==='support')add('contract',c.id,c.businessId,'ecosystem','support',true,40,nextJobDate(c.supportJob,date),'生产被认可之后，支持还要真正走完。',`${name}。${jobFacts(c.supportJob)}`,`支持未实际完成前不提前确认最后20%。${balances}`,'查看支持安排、资源与未结责任',{nextDate:nextJobDate(c.supportJob,date)})
  else add('contract',c.id,c.businessId,'ecosystem',c.status==='cancelled'?'cancelled':'history',false,95,c.supportPostedAt??c.cancelledAt,c.status==='cancelled'?'合作已经取消，原账仍留在这里。':'这份合作已经留下真实记录。',`${name}的生产、客户反馈、支持和原收款各有自己的记录。`,`${balances}取消不抹去已花成本或支持补偿${moneyText(c.cancellationCompensationFen)}。`,'翻阅这份合作与全部账目')
 }
 for(const i of v.invitations){
  const open=i.status==='open'&&i.expiresAt>=date,job=i.diligenceJob
  const handlingTerms=v.negotiations.some(n=>n.invitationId===i.id&&n.closedAt===null&&!n.expired&&date<=n.expiresAt)
  const alreadySigned=v.agreements.some(a=>a.invitationId===i.id)
  // A pending job takes precedence over report fields; no pre-frozen authority or consent is narrated.
  const running=job&&['planned','running'].includes(job.status)
  const revealed=i.reportAt!==null&&i.reportAt<=date&&job?.status==='completed'&&job.completeAt<=date
  const line=!open?'原邀请已使用、婉拒或到期；没有自动取得新的股份。':running?`尽调仍沿${job.startAt}—${job.completeAt}完成，未完成前不提前宣布授权或融资意愿。`:!revealed?'邀请还没有本次独立报告。资金、技术和中间服务费都不能代替授权与融资意愿。':i.authority===true&&i.financingConsent===true?'本次独立报告确认了本局架空授权与有条件融资意愿；资格、条款谈判和实际付款仍是后续不同决定。':i.authority===false?'本次独立报告没有证明邀请授权；没有取得股份。':'本次独立报告没有确认融资意愿；不能生成股权。'
  add('invitation',i.id,i.businessId,'counterfactual-equity',running?'diligence':'invitation',open&&!handlingTerms&&!alreadySigned,open?30:96,i.expiresAt,running?'这封架空邀请，还在独立核对。':revealed?'调查回信到了，再看清能谈什么。':'一份明确架空的邀请，先核实再决定。',line,`明确架空，原回应期限${i.expiresAt}不因尽调顺延。${handlingTerms?'这份邀请已有原条款正在处理；原报告保留，当前工作与回应分别查看。':running?jobFacts(job):'安排尽调须自己选择实际资源与日期，亦可免费拒绝原邀请；没有自动支付中间服务费。'}`,'查看邀请、独立调查与可选做法',{nextDate:running?nextJobDate(job,date):null})
 }
 for(const n of v.negotiations){
  const running=n.job&&['planned','running'].includes(n.job.status),revealed=n.respondedAt!==null&&n.respondedAt<=date&&n.job?.status==='completed'&&n.job.completeAt<=date,open=n.closedAt===null&&!n.expired&&date<=n.expiresAt
  const terms=v.catalog.terms.find(t=>t.id===n.termsId)
  add('negotiation',n.id,n.businessId,'counterfactual-equity','terms',open,open&&revealed?22:running?42:96,n.expiresAt,running?'架空条款已经提出，对方还在考虑。':revealed&&open?'对方的条款回应，已经真正到了。':'原架空谈判，保留实际回应与费用。',running||!revealed?'谈判工作未实际完成，不提前宣布接受或拒绝，更没有取得股份。':n.closedAt!==null?'这份条款已经签署或拒绝，原费用与实际股份另列。':!open?'原条款已经到期，没有自动付款或取得股份。':n.accepted===true?'对方接受了本次有条件条款；实际支付并签约，仍必须由你明确确认。':'对方没有接受本次条款；可拒绝并保留已花费用，没有新增股份。',`明确架空，拟支付${moneyText(n.amountFen)}，${n.shares}模拟股；${terms?.label??'原权利条款'}，原期限${n.expiresAt}。${running?jobFacts(n.job):'不替你签约、支付投资本金或接受权利条件。'}`,'查看条款、付款与拒绝选择',{nextDate:running?nextJobDate(n.job,date):null})
 }
 for(const a of v.agreements){
  const pending=a.followDecision==='pending',locked=a.locked&&a.lockUntil>date
  add('agreement',a.id,a.businessId,'counterfactual-equity',pending?'follow':locked?'locked':'exit-request',pending,pending?12:90,pending?a.followDeadline:locked?a.lockUntil:null,pending?'新的融资来信到了，这次仍由你决定。':locked?'股份已经持有，仍在原锁定期。':'锁定日到了，也不等于已经有买方。',pending?`最迟${a.followDeadline}决定。明确不跟投或逾期默认不新增付款，并按本轮真实发行稀释；不会自动借款或投资。`:`明确架空持仓${a.shares}/${a.totalShares}模拟股，锁定至${a.lockUntil}。估值不是可花现金，也不是公开交易价格。`,pending?`原协议主体${a.accountId==='personal'?'个人':'生态企业'}。${a.preemptive?'已签跟投权的原金额上限'+moneyText(a.followMaxFen)+'，实际付款仍须你另行选择。':'原协议没有跟投权。'}旧股份、费用与其他责任保留。`:'申请独立买方、股数和资源日期必须另行选择；原治理权不授予单方研发控制。',pending?'查看本轮跟投与不跟投选择':'查看持股、锁定期与退出条件')
 }
 for(const e of v.exits){
  const running=e.job&&['planned','running'].includes(e.job.status),revealed=e.responseAt!==null&&e.responseAt<=date&&e.job?.status==='completed'&&e.job.completeAt<=date
  if(e.receivable&&e.receivable.remainingFen>0&&e.operationId!==null&&e.dueAt!==null){
   const due=e.dueAt<=date
   add('exit',e.id,e.businessId,'counterfactual-equity',due?'collection':'receivable',true,due?10:55,e.dueAt,due?'原转让款到期了，收好这笔真实应收。':'股份已经转让，现金仍在约定的路上。',`明确架空：已转让${e.soldShares}股，原净应收尚余${moneyText(e.receivable.remainingFen)}，${e.dueAt}${due?'已经到期。':'才可实际收取。'}`,'转让费已按原单处理，收款不再确认一遍收益；原余股、成本和其他责任保留。',due?'收取这笔到期架空转让款 · '+moneyText(e.receivable.remainingFen):'查看这笔转让款与到账约定',due?{command:{kind:'CollectEquityExit',payload:{exitId:e.id,amountFen:e.receivable.remainingFen},confirm:false}}:{nextDate:e.dueAt})
  }else{
   const quote=revealed&&e.operationId===null&&!e.quoteExpired&&e.buyerWilling===true&&e.unitPriceFen!==null
   add('exit',e.id,e.businessId,'counterfactual-equity',quote?'exit-quote':'exit-request',!!running||quote,quote?21:running?42:96,e.expiresAt,running?'独立买方还在核实，不提前出售股份。':quote?'买方给了条件，是否转让仍由你决定。':'原退出申请，留下了这次真实结果。',running||!revealed?'申请工作尚未实际完成，不提前展示买方意愿或价格，也没有卖出股份。':quote?`明确架空条件报价：每模拟股${moneyText(e.unitPriceFen)}，最多${e.shares}股，${e.expiresAt}前决定；实际股数仍由你填写。`:e.operationId!==null?'这次转让及收款已经留在原账，不能再出售同一份股份。':e.quoteExpired?'原报价已到期，没有自动转让；未售股份保留。':'本次没有可接受的买方窗口；未售股份保留。',`锁定结束不保证有买方；${running?jobFacts(e.job):'接受前仍核对股数、费用、净应收与到账日，不按过去估值即时套现。'}`,'查看买方报价与转让股数选择',{nextDate:running?nextJobDate(e.job,date):null})
  }
 }
 for(const g of v.governance){
  const running=g.job&&['planned','running'].includes(g.job.status),revealed=g.resolvedAt!==null&&g.resolvedAt<=date&&g.job?.status==='completed'&&g.job.completeAt<=date
  add('governance',g.id,g.businessId,'counterfactual-equity','governance',!!running,running?43:96,nextJobDate(g.job,date),'有限的治理提案，仍按原权利发生。',!revealed?'会议尚未实际表决，不提前宣布通过或生效。':g.approved?'本次有限提案实际通过，按原范围生效；没有授予单方研发控制。':'对方没有同意本次提案，原股份与已花费用保留。',jobFacts(g.job),'查看会议与表决结果',{nextDate:nextJobDate(g.job,date)})
 }
 for(const p of v.preparations){
  const equity=p.kind==='relationship'||p.kind==='eligibility',running=p.job&&['planned','running'].includes(p.job.status)
  const name=({materials:'生态服务材料',basics:'部署技术基础',relationship:'明确架空关系准备',eligibility:'本局架空参与资格'})[p.kind]
  add('preparation',p.id,p.businessId,equity?'counterfactual-equity':'ecosystem','preparation',!!running,running?45:97,nextJobDate(p.job,date),`${name}，有自己的真实日子。`,jobFacts(p.job),equity?'完成准备不等于邀请获准、谈判成功或取得股份。':'材料和技术准备不代替模型用途许可、实际适配或客户合同。','查看准备安排、资源与下一步',{nextDate:nextJobDate(p.job,date)})
 }
 for(const a of v.adapters){
  const running=a.job&&['planned','running'].includes(a.job.status)
  add('adapter',a.id,a.businessId,'ecosystem','preparation',!!running,running?45:97,nextJobDate(a.job,date),'用途要真正适配，许可也有自己的边界。',`${a.modelId} / ${a.purpose==='deployment'?'部署':'培训'}。${jobFacts(a.job)}`,`原用途适配有效至${a.expiresAt}；${a.ready?'当前公开条件下有效。':'尚未完成或当前已失效，不能据此接受新承诺。'}不包含融资、股份或治理权限。`,'查看用途许可、资源与适配',{nextDate:nextJobDate(a.job,date)})
 }
 for(const o of v.outreaches){
  const running=o.job&&['planned','running'].includes(o.job.status),revealed=o.completedAt!==null&&o.completedAt<=date&&o.job?.status==='completed'
  add('outreach',o.id,o.businessId,'ecosystem','preparation',!!running,running?45:97,nextJobDate(o.job,date),'先听听，谁真正需要这份服务。',`${jobFacts(o.job)}${revealed?'这次实际留下'+o.personIds.length+'份客户需求记录。':'此刻不把将来名单当作客户或收入。'}`,'已有受众、付费获客与服务范围各自选择，不保证成交，也不重复向同一人收费。','查看需求研究与客户记录',{nextDate:nextJobDate(o.job,date)})
 }
 for(const l of v.leads){
  const open=l.status==='open'&&l.expiresAt>=date
  add('lead',l.id,l.businessId,'ecosystem','lead',open,open?70:98,l.expiresAt,open?'有人需要你的合作，先把范围说清。':'原来的需求，仍保留实际答复。',`客户${v.leads.findIndex(other=>other.personId===l.personId)+1} / ${l.modelId} / ${l.productId==='deployment'?'部署':'培训'}，原预算上限${moneyText(l.maxPriceFen)}，${l.expiresAt}前答复。`,'试点或标准范围、实际资源和开工日期必须另选，同时核对原生产与支持成本；客户预款不能支付这些自有投入。',open?'查看客户需求，选择范围与日期':'翻阅这次需求与合作记录')
 }
 for(const b of v.businesses){
  const equity=b.definitionId==='deepseek-investor',unsettled=b.funds.prepaidLiabilityFen>0||b.funds.receivableFen>0||b.funds.payableFen>0
  add('business',b.id,b.id,equity?'counterfactual-equity':'ecosystem',unsettled?'settling':b.lifecycle==='closed'?'history':'preparation',unsettled,unsettled?60:99,null,unsettled?'原主体的余额和责任，还要分别收好。':equity?'架空参与的准备，与真正持有分开。':'一份生态合作，从真实准备开始。',unsettled?'任务完成或合同取消，都不会清除未履约保护款、应收或应付；原账户与全部义务继续保留。':b.lifecycle==='closed'?'原主体已经关闭，原资产与交付记录仍可翻阅。':equity?'关系、独立尽调、参与资格和对方融资意愿各有前提；资金或技术不会自动变成股份。':'材料、技术、模型用途、真实需求与客户合同，仍需要分别决定。',`原主体可花${moneyText(b.funds.availableFen)}，客户保护${moneyText(b.funds.prepaidLiabilityFen)}、应收${moneyText(b.funds.receivableFen)}、应付${moneyText(b.funds.payableFen)}不合并为收益。`,'翻阅这个账户与全部准备条件')
 }
 if(!rows.length)return {source:'ecosystem',phase:'opening',active:false,priority:100,publicDueAt:null,title:'先看清，怎样参与这一种可能。',line:'生态服务、模型用途与直接股权，是不同的事。未来节点不等于本局许可，技术也不会自动变成股份。',choice:{title:'由你选择实际的参与方式',line:'资本、用途同意、架空融资开关和后续权利都需另行明确选择；不自动开公司、投资或取得权限。',label:'查看生态服务与明确架空投资条件'},nextDate:null,entity:null,entityId:null,entityIds:[],entityIndex:-1}
 rows.sort((a,b)=>Number(b.active)-Number(a.active)||a.priority-b.priority||(a.publicDueAt??'9999-12-31').localeCompare(b.publicDueAt??'9999-12-31')||a.entityId!.localeCompare(b.entityId!))
 const chosen=preferredId?rows.find(r=>r.entityId===preferredId)??rows[0]!:rows[0]!
 return {...chosen,entityIds:rows.map(row=>row.entityId!),entityIndex:rows.indexOf(chosen)}
}
