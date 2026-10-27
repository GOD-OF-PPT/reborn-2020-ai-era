import type {PlayingView,PlayFeatures} from './game-types.ts'
import {DEEPSEEK_JOBS} from '../content/deepseek.ts'
import {deepseekId} from '../core/deepseek-state.ts'
import {moneyText} from './game-text.ts'
import {ecosystemContractCosts} from './ecosystem-contract-costs.ts'

type View=Pick<PlayingView,'runId'|'revision'|'date'|'receipts'|'saveStatus'|'hasCandidate'|'readOnly'|'features'|'operations'|'accounts'>
const one=<T,>(rows:readonly T[])=>rows.length===1?rows[0]:undefined
/** Describe the adjacent committed public transition; no payload signature, hidden fact or simulation is read. */
export function ecosystemSceneResult(kind:string,previous:View|null,current:View):string|null{
 const last=current.receipts.at(-1)
 if(!previous||previous.runId!==current.runId||current.revision!==previous.revision+1||current.saveStatus!=='saved'||current.hasCandidate||current.readOnly||last?.kind!==kind||last.revisionAfter!==current.revision)return null
 const oldFeatures=previous.features as unknown as PlayFeatures,features=current.features as unknown as PlayFeatures,before=oldFeatures.deepseek,v=features.deepseek
 if(!before||!v)return null
 const id=deepseekId(last.commandId,kind),business=(businessId:string)=>one(v.businesses.filter(b=>b.id===businessId&&b.definitionId==='ecosystem-service'))
 const finance=(businessId:string)=>{const b=business(businessId);return b?one(features.workbench.finance.filter(f=>f.accountId===b.accountId)):undefined}
 if(kind==='OpenEcosystemService'){
  const b=one(v.businesses.filter(b=>b.definitionId==='ecosystem-service'&&!before.businesses.some(o=>o.id===b.id))),a=one(previous.accounts.filter(a=>a.accountId==='personal')),z=one(current.accounts.filter(a=>a.accountId==='personal'))
  if(b&&a&&z&&b.funds.cashFen>0&&a.cashFen-z.cashFen===b.funds.cashFen)return `个人自有资本${moneyText(b.funds.cashFen)}已转入原生态企业，仍是自己的资金，不记服务收入或费用。材料、用途和客户承诺还要分别准备。`
 }
 if(['StartEcosystemPreparation','StartEcosystemAdaptation','StartEcoOutreach','StartEcoRemediation'].includes(kind)){
  const job=one(current.operations?.jobs.filter(j=>j.id===id&&!previous.operations?.jobs.some(o=>o.id===j.id))??[]),term=DEEPSEEK_JOBS.find(j=>j.id===job?.definitionId),f=job?finance(job.businessId):undefined
  if(job&&term&&f){
   const paid=f.transactions.filter(tx=>tx.sourceId===job.actionId&&tx.businessId===job.businessId&&tx.amountFen<0).reduce((n,tx)=>n-tx.amountFen,0),reserved=f.reservations.filter(r=>r.kind==='plan'&&r.originId===job.actionId&&r.status==='active').reduce((n,r)=>n+r.amountFen,0)
   if(kind==='StartEcoRemediation'){
    const c=one(v.contracts.filter(c=>c.remediationJobId===job.id&&c.businessId===job.businessId)),old=c?one(before.contracts.filter(o=>o.id===c.id&&o.status==='rejected'&&o.remediationJobId===null)):undefined,support=c?.supportJob,supportTerm=DEEPSEEK_JOBS.find(t=>t.id===support?.definitionId)
    if(!c||!old||!support||!supportTerm||support.status!=='planned'||c.balance?.prepaidFen!==old.balance?.prepaidFen||c.balance?.recognizedIncomeFen!==old.balance?.recognizedIncomeFen)return null
    const costs=ecosystemContractCosts(c,current.operations?.jobs,features.workbench.finance,current.date),oldCosts=ecosystemContractCosts(old,previous.operations?.jobs,oldFeatures.workbench.finance,previous.date),total=term.costFen+supportTerm.costFen,points=term.actionPoints+supportTerm.actionPoints
    if(costs.reason||oldCosts.reason)return null
    if(job.status==='planned'&&paid===0&&reserved===term.costFen&&costs.reservedFen===total&&costs.paidFen===oldCosts.paidFen)return `补救和后续支持都已留好日子，共预留自有预算${moneyText(total)}、${points}点；本次新增安排尚未付款。补救${job.startAt}—${job.completeAt}，支持另在${support.startAt}—${support.completeAt}。此前已付${moneyText(oldCosts.paidFen)}仍保留，客户预款继续保护，不重复收取或提前确认收入。`
    return null
   }
   if(job.status==='planned'&&paid===0&&reserved===term.costFen)return `原任务已安排在${job.startAt}—${job.completeAt}，开工季度预留${term.actionPoints}点与自有资金${moneyText(reserved)}，尚未实际支付。完成这份准备不等于客户、收入或回款。`
   if(job.status==='running'&&paid===term.costFen)return `原任务已实际开工：支付自有资金${moneyText(paid)}、使用开工季度${term.actionPoints}点，${job.completeAt}才看实际反馈。没有因此取得客户或服务收入。`
  }
 }
 if(kind==='AcceptEcoContract'){
  const c=one(v.contracts.filter(c=>c.id===id&&!before.contracts.some(o=>o.id===c.id))),f=c?finance(c.businessId):undefined
  if(c&&f&&c.productionJob&&c.supportJob&&c.balance?.prepaidFen===c.prepaymentFen&&c.balance.recognizedIncomeFen===0&&c.balance.receivableFen===0){
   const reserved=f.reservations.filter(r=>r.status==='active'&&[c.productionJob!.actionId,c.supportJob!.actionId].includes(r.originId)).reduce((n,r)=>n+r.amountFen,0)
   return `这份${c.productId==='deployment'?'部署':'培训'}原约已保存，收到客户预款${moneyText(c.prepaymentFen)}并全额保护，尚未确认收入。自有制作与支持共预留${moneyText(reserved)}；制作${c.productionJob.startAt}—${c.productionJob.completeAt}，支持另在${c.supportJob.startAt}—${c.supportJob.completeAt}。`
  }
 }
 if(kind==='CollectEcoReceivable'){
  const changed=v.deliveries.flatMap(d=>{const old=one(before.deliveries.filter(o=>o.id===d.id));return old&&old.contractId===d.contractId&&old.remainingFen>d.remainingFen?[{d,amount:old.remainingFen-d.remainingFen}]:[]}),row=one(changed),c=row?one(v.contracts.filter(c=>c.id===row.d.contractId)):undefined,old=c?one(before.contracts.filter(o=>o.id===c.id)):undefined,f=c?finance(c.businessId):undefined
  const tx=row&&c&&f?one(f.transactions.filter(t=>t.id===id&&t.sourceId===row.d.id&&t.contractId===c.id&&t.businessId===c.businessId&&t.amountFen===row.amount)):undefined
  if(row&&c&&old&&tx&&c.balance?.recognizedIncomeFen===old.balance?.recognizedIncomeFen)return `这笔${row.d.stage==='production'?'已验收生产':'已完成支持'}原应收实际收回${moneyText(row.amount)}，进入同一生态企业账户。本单尚未实收${moneyText(c.balance?.receivableFen)}；收款没有再确认一次收入。`
 }
 if(kind==='SubmitEcoDelivery'){
  const c=one(v.contracts.filter(c=>c.status==='review'&&c.submittedAt===current.date&&before.contracts.some(o=>o.id===c.id&&o.submittedAt===null&&o.status==='production')))
  if(c)return `这份原作品已亲手交给客户，等${c.reviewAt}真正复核；提交没有新增现金或提前确认收入，原支持承诺仍保留。`
 }
 if(kind==='DeclineEcoLead'){
  const l=one(v.leads.filter(l=>l.status==='declined'&&before.leads.some(old=>old.id===l.id&&old.businessId===l.businessId&&old.status==='open')))
  if(l&&business(l.businessId))return `客户${v.leads.findIndex(row=>row.personId===l.personId)+1}的这份原需求已经婉拒，没有安排制作或支持、不收客户预款，也不新增本单行动。原准备费用与其它已经安排的工作继续保留。`
 }
 if(['ActivateBusiness','StopEcosystemService','ResumeBusiness','WindDownBusiness','CloseBusiness'].includes(kind)){
  const b=one(v.businesses.filter(b=>b.definitionId==='ecosystem-service'&&before.businesses.some(old=>old.id===b.id&&old.accountId===b.accountId&&old.lifecycle!==b.lifecycle&&b.history.length===old.history.length+1)&&b.history.at(-1)?.sourceId===(kind==='StopEcosystemService'?id:last.commandId)))
  if(b){
   if(kind==='ActivateBusiness'&&b.lifecycle==='operating')return '原生态企业已经按准备条件启用；没有自动接受客户、收取预款或确认服务收入。后续用途与合作仍另行显选，原维护与工资按日历继续。'
   if(kind==='StopEcosystemService'&&b.lifecycle==='paused')return '原生态企业已经暂停新增合作；已答应的制作、支持、原款和工资维护继续，没有同时取消客户合同。'
   if(kind==='ResumeBusiness'&&b.lifecycle==='operating')return '原生态企业已经核对条件并恢复承接新合作；没有自动接受客户、重复收款或取得股份。'
   if(kind==='CloseBusiness'&&b.lifecycle==='closed')return '原生态企业已经按实际规则关闭；原合同、交付、费用与历史记录仍保留，没有新增服务收入。'
   if(kind==='WindDownBusiness'&&b.lifecycle==='winding_down'){
    const f=finance(b.id),oldF=one(oldFeatures.workbench.finance.filter(f=>f.accountId===b.accountId)),oldIds=new Set(oldF?.transactions.map(t=>t.id)??[]),out=f&&oldF?f.transactions.filter(t=>!oldIds.has(t.id)&&t.businessId===b.id&&t.amountFen<0).reduce((n,t)=>n-t.amountFen,0):null
    return `原生态企业已经进入实际收尾，本次原经营现金实际付出${moneyText(out)}；原计划任务按实际状态中断，已耗投入不退。客户退款、支持补偿、原应收和真实应付仍须分别处理，收尾不等于取消全部合同或清债。`
   }
  }
 }
 if(kind==='CancelEcoContract'){
  const c=one(v.contracts.filter(c=>c.status==='cancelled'&&c.cancelledAt===current.date&&before.contracts.some(o=>o.id===c.id&&o.status!=='cancelled'))),old=c?one(before.contracts.filter(o=>o.id===c.id)):undefined,f=c?finance(c.businessId):undefined,oldF=c?oldFeatures.workbench.finance.find(f=>f.accountId===business(c.businessId)?.accountId):undefined
  if(c&&old&&f&&oldF){
   const oldTx=new Set(oldF.transactions.map(t=>t.id)),cash=f.transactions.filter(t=>!oldTx.has(t.id)&&t.businessId===c.businessId&&t.contractId===c.id&&t.amountFen<0).reduce((n,t)=>n-t.amountFen,0),debt=f.obligations.filter(o=>o.businessId===c.businessId&&o.contractId===c.id).reduce((n,o)=>n+o.remainingFen,0)
   const oldCosts=ecosystemContractCosts(old,previous.operations?.jobs,oldFeatures.workbench.finance,previous.date),costs=ecosystemContractCosts(c,current.operations?.jobs,features.workbench.finance,current.date),released=oldCosts.reservedFen!==null&&costs.reservedFen!==null&&oldCosts.reservedFen>=costs.reservedFen?oldCosts.reservedFen-costs.reservedFen:null
   return `原合作已经取消，本次退款与支持补偿实际付出${moneyText(cash)}，该合同当前原义务待付${moneyText(debt)}${released!==null&&released>0?'；另释放未开工资金预留'+moneyText(released):''}。取消前未履约预款${moneyText(old.balance?.prepaidFen)}、原支持退出补偿${moneyText(old.cancellationCompensationFen)}分别核对；已耗成本与已确认收入不抹除，解除预留不是新的收入，行动仍按各自原季度解除占用。`
  }
 }
 if(kind==='AdvanceTime'){
  const parts:string[]=[],starts:{jobId:string;date:string;paid:number;points:number;text:string}[]=[],includedStarts=new Set<string>()
  for(const job of current.operations?.jobs??[]){
   const old=one(previous.operations?.jobs.filter(j=>j.id===job.id)??[]),b=business(job.businessId),term=DEEPSEEK_JOBS.find(t=>t.id===job.definitionId),f=b?finance(b.id):undefined,oldF=b?one(oldFeatures.workbench.finance.filter(f=>f.accountId===b.accountId)):undefined
   if(!old||!b||!term||!f||!oldF||old.businessId!==b.id||old.actionId!==job.actionId||old.startAt!==job.startAt||old.definitionId!==job.definitionId||old.status!=='planned'||!['running','completed'].includes(job.status)||job.startAt<previous.date||job.startAt>current.date)continue
   const ids=new Set(oldF.transactions.map(t=>t.id)),paid=f.transactions.filter(t=>!ids.has(t.id)&&t.sourceId===job.actionId&&t.businessId===b.id&&t.amountFen<0).reduce((n,t)=>n-t.amountFen,0)
   if(paid===term.costFen&&paid>0){
    const retry=one(v.contracts.filter(c=>c.businessId===b.id&&c.remediationJobId===job.id)),support=retry?.supportJob,supportTerm=DEEPSEEK_JOBS.find(t=>t.id===support?.definitionId),held=support?f.reservations.filter(r=>r.kind==='plan'&&r.status==='active'&&r.originId===support.actionId).reduce((n,r)=>n+r.amountFen,0):null
    const supportLine=retry&&support?.status==='planned'&&supportTerm&&held===supportTerm.costFen?'；后续支持仍预留'+moneyText(held)+'与'+supportTerm.actionPoints+'点':''
    starts.push({jobId:job.id,date:job.startAt,paid,points:term.actionPoints,text:`${job.startAt}，${retry?'这次补救':'这份原生态任务'}实际开工，支付原自有预算${moneyText(paid)}、使用开工季度${term.actionPoints}点${supportLine}；原预留转为实际使用，没有新增免费行动。`})
   }
  }
  const preparationResults=[...v.preparations.filter(p=>['materials','basics'].includes(p.kind)).map(p=>({id:p.id,businessId:p.businessId,job:p.job,label:p.kind==='materials'?'服务材料':'技术学习'})),...v.adapters.map(a=>({id:a.id,businessId:a.businessId,job:a.job,label:'模型用途适配'})),...v.outreaches.map(o=>({id:o.id,businessId:o.businessId,job:o.job,label:'有限需求研究'}))]
  for(const record of preparationResults){
   const job=record.job,old=job?one(previous.operations?.jobs.filter(j=>j.id===job.id)??[]):undefined
   if(job&&old&&business(record.businessId)&&old.businessId===record.businessId&&old.actionId===job.actionId&&old.status!=='completed'&&job.status==='completed'&&job.completeAt>=previous.date&&job.completeAt<=current.date)parts.push(`${job.completeAt}，这份原${record.label}已经实际完成；留下的是准备与公开反馈，没有因此接受客户或确认服务收入。`)
  }
  for(const d of v.deliveries.filter(d=>!before.deliveries.some(old=>old.id===d.id)&&d.date>=previous.date&&d.date<=current.date)){
   const c=one(v.contracts.filter(c=>c.id===d.contractId)),old=c?one(before.contracts.filter(o=>o.id===c.id)):undefined
   if(!c||!old||!business(c.businessId)||d.amountFen!==d.prepaidFen+d.creditFen||d.stage==='production'&&(c.deliveredAt!==d.date||c.accepted!==true)||d.stage==='support'&&(c.supportPostedAt!==d.date||c.supportJob?.status!=='completed'))continue
   const supportStart=d.stage==='production'?one(starts.filter(s=>s.jobId===c.supportJobId&&s.date===d.date)):undefined
   if(supportStart){
    includedStarts.add(supportStart.jobId)
    parts.push(`${d.date}，原生产已经由客户实际验收，确认收入${moneyText(d.amountFen)}；原支持同日开工，支付原自有预算${moneyText(supportStart.paid)}、使用开工季度${supportStart.points}点。其中消费原预款${moneyText(d.prepaidFen)}、新增原应收${moneyText(d.creditFen)}${d.creditFen>0?'（'+d.dueAt+'到期）':''}；这次没有收取新的现金，原支持预留转为实际使用，没有新增免费行动。`)
   }else parts.push(`${d.date}，原${d.stage==='production'?'生产已经由客户实际验收':'支持已经实际完成'}，确认收入${moneyText(d.amountFen)}，其中消费原预款${moneyText(d.prepaidFen)}、新增原应收${moneyText(d.creditFen)}${d.creditFen>0?'（'+d.dueAt+'到期）':''}；这次没有收取新的现金。`)
  }
  for(const c of v.contracts.filter(c=>c.status==='rejected'&&c.accepted===false&&c.reviewAt!==null&&c.reviewAt>=previous.date&&c.reviewAt<=current.date&&before.contracts.some(o=>o.id===c.id&&o.status==='review')))parts.push(`${c.reviewAt}，这位原客户没有认可提交的作品。未确认新的服务收入；可以核对真实补救或退款退出，原投入保留。`)
  parts.push(...starts.filter(s=>!includedStarts.has(s.jobId)).map(s=>s.text))
  return parts.length?parts.join(' '):null
 }
 return null
}
