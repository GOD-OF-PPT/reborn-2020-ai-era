import type {CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps} from './game-types.ts'
import {DEEPSEEK_JOBS} from '../content/deepseek.ts'
import {isoDate,addDays} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'
import {ecosystemContractCosts} from './ecosystem-contract-costs.ts'

type Props={command:CommandEnvelope;view:Pick<GamePanelProps['view'],'runId'|'revision'|'date'|'accounts'|'operations'>;features:Pick<GamePanelProps['features'],'deepseek'>&{readonly workbench:Pick<GamePanelProps['features']['workbench'],'finance'>}}
const one=<T,>(rows:readonly T[])=>rows.length===1?rows[0]:undefined
const known=new Set(['StartEcosystemPreparation','StartEcosystemAdaptation','StartEcoOutreach','AcceptEcoContract','DeclineEcoLead','SubmitEcoDelivery','StartEcoRemediation','CancelEcoContract','CollectEcoReceivable','StopEcosystemService'])
const lifecycle=new Set(['ActivateBusiness','ResumeBusiness','WindDownBusiness','CloseBusiness'])
function planDate(value:unknown,days=0):string|null{try{return typeof value==='string'?addDays(isoDate(value),days):null}catch{return null}}

/** Every value belongs to the immutable command-review snapshot; this component never reads the live controller. */
export function EcosystemCommandDetails({command,view,features}:Props){
 const v=features.deepseek,body=command.payload!==null&&typeof command.payload==='object'&&!Array.isArray(command.payload)?command.payload as Record<string,unknown>:{},kind=command.kind
 if(!v)return null
 const interruptJob=kind==='InterruptJob'&&typeof body.jobId==='string'?one(view.operations?.jobs.filter(j=>j.id===body.jobId)??[]):undefined
 const interruptBusiness=interruptJob?one(v.businesses.filter(b=>b.id===interruptJob.businessId&&b.definitionId==='ecosystem-service')):undefined
 if(kind==='InterruptJob'&&!interruptBusiness)return null
 const lead=typeof body.leadId==='string'?one(v.leads.filter(l=>l.id===body.leadId)):undefined
 const delivery=typeof body.deliveryId==='string'?one(v.deliveries.filter(d=>d.id===body.deliveryId)):undefined
 const interruptContracts=interruptJob?v.contracts.filter(c=>c.businessId===interruptJob.businessId&&[c.productionJobId,c.originalSupportJobId,c.supportJobId,c.remediationJobId].includes(interruptJob.id)):[]
 const contractId=typeof body.contractId==='string'?body.contractId:delivery?.contractId??one(interruptContracts)?.id
 const contract=contractId?one(v.contracts.filter(c=>c.id===contractId)):undefined
 const businessId=typeof body.businessId==='string'?body.businessId:lead?.businessId??contract?.businessId??interruptBusiness?.id
 const business=businessId?one(v.businesses.filter(b=>b.id===businessId&&b.definitionId==='ecosystem-service')):undefined
 if(!known.has(kind)&&!(lifecycle.has(kind)&&business)&&kind!=='InterruptJob')return null
 const bad=(message:string)=><section className="warning-box"><h3>先核对这份原生态决定</h3><p>{message} 没有替换为另一位客户或另一主体，请返回重新选择。</p></section>
 if(command.runId!==view.runId||command.expectedRevision!==view.revision)return bad('这份确认与当前捕获的存档身份不一致。')
 if(!business||view.accounts.filter(a=>a.accountId===business.accountId).length!==1
  ||lead&&lead.businessId!==business.id||contract&&contract.businessId!==business.id)return bad('原生态企业、账户或客户来源尚未唯一核定。')
 if(['AcceptEcoContract','DeclineEcoLead'].includes(kind)&&!lead||['SubmitEcoDelivery','StartEcoRemediation','CancelEcoContract','CollectEcoReceivable'].includes(kind)&&!contract||kind==='CollectEcoReceivable'&&!delivery)return bad('原客户、合同或阶段款项已经不可达。')
 const finance=one(features.workbench.finance.filter(f=>f.accountId===business.accountId)),modelId=lead?.modelId??contract?.modelId??body.modelId,productId=lead?.productId??contract?.productId??body.productId
 const personId=lead?.personId??contract?.personId,customerNumber=personId?v.leads.findIndex(l=>l.personId===personId)+1:0,customerLabel=customerNumber>0?'客户'+customerNumber:'这位原客户'
 const model=one(v.catalog.models.filter(m=>m.id===modelId)),product=one(v.catalog.products.filter(p=>p.id===productId))
 const resources=Array.isArray(body.resources)&&body.resources.every(id=>typeof id==='string')?body.resources as string[]:[]
 const resourceNames=resources.map(id=>one(v.resources.filter(r=>r.id===id))?.label??'原资源待核对')
 const source=<details className="eco-confirm-source"><summary>核对同一份原记录的来源</summary><p>本次捕获日期 {view.date}。原企业 <code>{business.id}</code> · 原账户 <code>{business.accountId}</code></p>{lead?<p>原需求 <code>{lead.id}</code> · 原获客 <code>{lead.outreachId}</code> · 原客户身份 <code>{lead.personId}</code></p>:null}{contract?<><p>原合同 <code>{contract.id}</code> · 原需求 <code>{contract.leadId}</code></p><p>原生产 <code>{contract.productionJobId}</code> · 最初支持 <code>{contract.originalSupportJobId}</code> · 当前支持 <code>{contract.supportJobId}</code>{contract.remediationJobId?<> · 原补救 <code>{contract.remediationJobId}</code></>:null}</p></>:null}{delivery?<p>原阶段款 <code>{delivery.id}</code> · 原流水引用 {delivery.operationIds.map(id=><code key={id}>{id} </code>)}</p>:null}</details>
 const resourceFacts=<><p>本次显选资源：{resourceNames.length?resourceNames.join('、'):'尚未完整选择'}。开工日：{planDate(body.startAt)??'尚未完整选择'}。</p><p>资源、原工资维护与跨季注意力仍按原预览核对；本次确认没有免费产能，也不复用另一份草稿。</p></>
 if(kind==='InterruptJob'&&interruptJob){
  if(interruptContracts.length>1||interruptJob.contractId!==null&&!contract)return bad('这份原任务的合同身份尚未唯一核定。')
  const term=DEEPSEEK_JOBS.find(j=>j.id===interruptJob.definitionId)
  if(!term||!['planned','running'].includes(interruptJob.status))return bad('原生态任务的种类或当前阶段尚未核定。')
  const costs=contract?ecosystemContractCosts(contract,view.operations?.jobs,features.workbench.finance,view.date):null
  const paid=costs?.paidFen!==null&&costs?.paidFen!==undefined?(interruptJob.status==='running'?term.costFen:0):null
  const role=contract?interruptJob.id===contract.supportJobId||interruptJob.id===contract.originalSupportJobId?'独立支持':interruptJob.id===contract.remediationJobId?'补救制作':'原生产':'原准备'
  return <section className="warning-box"><h3>中断这一份{role}，保留已经付出的投入</h3>{contract?<p>{customerLabel} · {model?.label??'原模型'} · {product?.label??'原用途'} · {contract.scope==='pilot'?'有限试点':'标准范围'}。</p>:null}<p>原任务窗口{interruptJob.startAt}—{interruptJob.completeAt}，{interruptJob.status==='running'?'已经开工':'尚未开工'}；原基础预算{moneyText(term.costFen)} / {term.actionPoints}点。</p>{contract?<><p>这份任务已实际支付{moneyText(paid)}；本合同制作、支持及补救累计已付{moneyText(costs?.paidFen)}，尚未开工资金预留{moneyText(costs?.reservedFen)}。{costs?.reason??'已耗费用与行动不因中断退还。'}</p><p>原已确认收入{moneyText(contract.balance?.recognizedIncomeFen)}、待收款{moneyText(contract.balance?.receivableFen)}及未履约保护{moneyText(contract.balance?.prepaidFen)}分别保留。中断不等于取消合同；另行退出时，原支持补偿{moneyText(contract.cancellationCompensationFen)}与退款仍由原确认核对。</p></>:<p>实际已付与资金预留仍按本任务的原账核对；中断不把已耗费用或行动退成免费资源。</p>}<p>本次新增费用与可用行动按上方原预览；原工资、维护及旧约继续，不会因中断而自动结清。</p>{source}<p>本次原任务 <code>{interruptJob.id}</code></p></section>
 }
 if(kind==='StartEcosystemPreparation'){
  const name=body.preparation==='materials'?'服务材料':body.preparation==='basics'?'技术基础学习':null,term=DEEPSEEK_JOBS.find(j=>j.id===(body.preparation==='materials'?'deepseek-materials':body.preparation==='basics'?'deepseek-basics':''))
  return name&&term?<section className="confirmation-context"><h3>本次明确安排的是{name}</h3>{resourceFacts}<p>原计划窗口：{planDate(body.startAt)??'待核'}—{planDate(body.startAt,term.durationDays)??'待核'}；基础预算{moneyText(term.costFen)} / {term.actionPoints}点。完成准备不会自动接单或取得收入。</p>{source}</section>:bad('准备种类尚未明确。')
 }
 if(kind==='StartEcosystemAdaptation')return model&&product?<section className="confirmation-context"><h3>本次模型与用途，按这份选择确认</h3><p><strong>{model.label} · {product.label}</strong>。{body.acceptSimulationTerms===true?'已明确同意本次游戏内虚构的模型用途范围。':'尚未明确同意本次虚构用途范围，不能据此安排。'}</p>{resourceFacts}<p>原适配计划{planDate(body.startAt)??'待核'}—{planDate(body.startAt,DEEPSEEK_JOBS.find(j=>j.id==='deepseek-adaptation')!.durationDays)??'待核'}；基础预算500元 / 1点。它不授予现实供应权限、客户合同、股份或治理权。</p>{source}</section>:bad('原模型或服务用途尚未完整选择。')
 if(kind==='StartEcoOutreach'){
  const mode=body.mode==='paid'?'付费需求研究':body.mode==='referral'?'原视频受众转介':null,ids=Array.isArray(body.sourceCohortIds)?body.sourceCohortIds:[],cohorts=ids.map(id=>one(v.videoCohorts.filter(c=>c.id===id)))
  if(!model||!product||!mode||body.mode==='referral'&&(!ids.length||new Set(ids).size!==ids.length||cohorts.some(c=>!c)))return bad('模型、用途或实际受众来源尚未完整选择。')
  return <section className="confirmation-context"><h3>本次只研究这一种具体需求</h3><p>{model.label} · {product.label} · {mode}。{body.mode==='paid'?'原基础预算1000元。':'原基础费用0元，原受众来源仍须真实存在。'}</p>{body.mode==='referral'?<ul>{cohorts.map(c=><li key={c!.id}>{c!.date} · 该份原受众{c!.people}人；不同来源不合算为去重后的客户数。</li>)}</ul>:null}{resourceFacts}<p>原计划{planDate(body.startAt)??'待核'}—{planDate(body.startAt,7)??'待核'}，1点。需求、客户接受范围与实际收入分别发生，不保证成交。</p>{source}</section>
 }
 if(kind==='AcceptEcoContract'||kind==='StartEcoRemediation'){
  const scope=kind==='AcceptEcoContract'?body.scope:contract?.scope,valid=scope==='pilot'||scope==='standard',productionId=kind==='StartEcoRemediation'?'deepseek-remediation':valid&&(productId==='deployment'||productId==='training')?(scope==='pilot'?'deepseek-pilot-':'deepseek-')+productId:null
  const production=DEEPSEEK_JOBS.find(j=>j.id===productionId),support=valid&&(productId==='deployment'||productId==='training')?DEEPSEEK_JOBS.find(j=>j.id===(scope==='pilot'?'deepseek-pilot-':'deepseek-')+productId+'-support'):undefined
  if(!model||!product||!valid||!production||!support)return bad('原范围、模型用途或原生产支持条款不完整。')
  const price=kind==='AcceptEcoContract'?product.priceFen/(scope==='pilot'?2:1):contract!.priceFen,productionAt=planDate(body.startAt),completeAt=planDate(body.startAt,production.durationDays),reviewAt=planDate(body.startAt,production.durationDays+3),supportEnd=planDate(body.startAt,production.durationDays+3+support.durationDays)
  return <section className="confirmation-context eco-contract-confirmation"><h3>{kind==='StartEcoRemediation'?'本次补救与重新安排的支持':'本次明确承担的客户范围'}</h3><p><strong>{customerLabel} · {model.label} · {product.label} · {scope==='pilot'?'有限试点':'标准范围'}</strong>，{kind==='StartEcoRemediation'?'原合同额':'拟合同额'}{moneyText(price)}。{lead?'原客户预算上限'+moneyText(lead.maxPriceFen)+'，答复期限'+lead.expiresAt+'。':''}</p>{resourceFacts}<dl className="eco-confirm-facts"><div><dt>拟制作 / 补救</dt><dd>{productionAt??'待核'}—{completeAt??'待核'} · {moneyText(production.costFen)} / {production.actionPoints}点</dd></div><div><dt>拟客户复核</dt><dd>{reviewAt??'待核'}；作品仍须在原窗口亲手提交，不预告客户认可。</dd></div><div><dt>另行预留的原支持</dt><dd>{reviewAt??'待核'}—{supportEnd??'待核'} · {moneyText(support.costFen)} / {support.actionPoints}点</dd></div></dl><p>{kind==='AcceptEcoContract'?'拟收客户预款'+moneyText(price/2)+'并全额保护，不用于支付制作或支持。':'补救不重复收客户预款；原任务费用和中断记录保留，本次支持按新计划重新预留。'}生产实际获认可后确认80%，实际完成支持才确认20%；原应收和真正实收另列。</p><p>生产获认可后取消未完成支持，原退出补偿为合同额10%即{moneyText(price/10)}；现金不足继续按原合同列应付。以上是确定计划与原条款，不是已保存结果。</p>{source}</section>
 }
 if(kind==='CollectEcoReceivable'&&contract&&delivery)return <section className="confirmation-context"><h3>本次只核对这笔原阶段款</h3><p>{customerLabel} · {model?.label??'原模型'} · {product?.label??'原用途'} · {delivery.stage==='production'?'已验收生产':'已完成支持'}，原到期日{delivery.dueAt}。</p><p>本阶段原确认{moneyText(delivery.amountFen)}，其中消费原预款{moneyText(delivery.prepaidFen)}；信用部分{moneyText(delivery.creditFen)}、累计实收{moneyText(delivery.creditFen-delivery.remainingFen)}、尚未实收{moneyText(delivery.remainingFen)}。</p><p>本次拟收取<strong>{moneyText(typeof body.amountFen==='number'?body.amountFen:null)}</strong>，只进入原企业账户，不重复确认收入、不替你收另一笔原款。</p>{source}</section>
 if(kind==='CancelEcoContract'&&contract){
  const costs=ecosystemContractCosts(contract,view.operations?.jobs,features.workbench.finance,view.date),paid=costs.paidFen,reserved=costs.reservedFen,complete=costs.reason===null
  return <section className="warning-box"><h3>取消剩余原约，原款与支持分别处理</h3><p>{customerLabel} · {model?.label??'原模型'} · {product?.label??'原用途'} · {contract.scope==='pilot'?'有限试点':'标准范围'}。</p><p>原未履约预款退款{moneyText(contract.balance?.prepaidFen)}；本次原支持退出补偿{moneyText(contract.cancellationCompensationFen)}。已确认生产收入{moneyText(contract.balance?.recognizedIncomeFen)}保留；当前原应收{moneyText(contract.balance?.receivableFen)}不消失。</p><p>本合同制作、原支持及补救任务已实际支付{moneyText(paid)}；当前尚未开工资金预留{moneyText(reserved)}。{complete?'两者按捕获的原任务与流水分别核对；已耗投入不退成免费行动。':'部分原任务或流水来源尚未取得，未知不能按0处理，仍须原账核对。'}</p><p>现金不足的退款或补偿继续关联原合同列应付，不能把取消当结清。</p>{source}</section>
 }
 if(kind==='StopEcosystemService'||lifecycle.has(kind))return <section className="confirmation-context"><h3>{kind==='StopEcosystemService'?'本次只暂停新增合作':kind==='WindDownBusiness'?'本次进入实际收尾':kind==='CloseBusiness'?'本次核对原企业关闭':kind==='ResumeBusiness'?'本次核对恢复新增合作':'本次核对启用生态企业'}</h3><p>{kind==='StopEcosystemService'?'原制作、支持、维护与工资继续；没有同时取消合同。':kind==='WindDownBusiness'?'本主体原任务将按实际收尾中断，原退款、支持补偿和应收应付分别保留。':kind==='CloseBusiness'?'只有原义务与资产满足原规则才能关闭，历史记录不删除。':'本次不接受新客户、不重复预款或取得股份；后续合同仍另行确认。'}</p>{finance?<p>本账户已发生未出账成本{moneyText(finance.accruedCostFen)}，可能包括原工资与维护；它不是本次新增服务预算，实际结算仍按原规则与流水。</p>:null}{source}</section>
 if(kind==='DeclineEcoLead'&&lead)return <section className="confirmation-context"><h3>只答复这一份原需求</h3><p>{customerLabel} · {model?.label??'原模型'} · {product?.label??'原用途'}，预算上限{moneyText(lead.maxPriceFen)}，原答复期限{lead.expiresAt}。婉拒不安排生产、不收预款或取得股份，原准备费用保留。</p>{source}</section>
 return null
}
