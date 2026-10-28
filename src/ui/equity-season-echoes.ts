import {deepseekId} from '../core/deepseek-state.ts'
import {isoDate} from '../core/calendar.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import type {SeasonEchoNode,SeasonInput,SeasonSourceRef,SeasonPendingItem} from './season-thread.ts'
import {equitySceneContext,equityFocusTargets,equityFocusFor,equityJourneyFor} from './equity-player-thread.ts'
import {resolveEquitySceneTarget,equityTargetEntity,type EquitySceneTarget} from './equity-scene-target.ts'
import {equityDirectCosts,equityBrokerFee} from './equity-costs.ts'
import {equityHistoryCommands,type EquityHistorySource} from './equity-public-history.ts'
import {moneyText} from './game-text.ts'

const one=<T,>(rows:readonly T[]):T|null=>rows.length===1?rows[0]!:null
const amount=(n:number)=>Number.isSafeInteger(n)&&n>=0
const dated=(date:string,asOf:string)=>{try{isoDate(date);return date<=asOf}catch{return false}}

/** Dated public outcomes, not a balance-delta reconstruction or another save.
 * Original quantities remain historical after later dilution and disposals. */
export function equitySeasonEchoes(p:SeasonInput):SeasonEchoNode[]{
 const {view,features:f}=p,v=f.deepseek,published=f.sceneCommands
 if(!v||v.counterfactualEnabledAt===null||!published||published.version!==1||published.runId!==view.runId||published.committedRevision!==view.revision)return []
 const source:EquityHistorySource={runId:view.runId,date:view.date,source:{revision:view.revision,receipts:view.receipts},sceneCommands:published},rows:SeasonEchoNode[]=[]
 const original=(kind:Exclude<EquitySceneTarget['kind'],'business'>,id:string,businessId:string)=>{
  const b=one(v.businesses.filter(b=>b.id===businessId));if(!b)return null
  const target:EquitySceneTarget={runId:view.runId,accountId:b.accountId,businessId,kind,recordId:id}
  const result=resolveEquitySceneTarget(v,target,equitySceneContext(p,b.accountId))
  return result.status==='valid'?{target,result}:null
 }
 const add=(id:string,target:EquitySceneTarget,date:string,title:string,line:string,sourceRefs:readonly SeasonSourceRef[],sequence?:number)=>{
  if(!dated(date,view.date)||rows.some(r=>r.id===id))return
  rows.push({id,date,title,line,sourceRefs,inspect:{screen:'deepseek',label:'翻看同一份权益原册',target:{accountId:target.accountId,deepseekPane:'equity',equityTarget:target,recordId:equityTargetEntity(target),openRecord:true}},...(sequence===undefined?{}:{sequence})})
 }
 const costs=new Map<string,ReturnType<typeof equityDirectCosts>>()
 const expense=(target:EquitySceneTarget,job:ProductionJob)=>{
  const key=target.accountId+'|'+target.businessId
  if(!costs.has(key))costs.set(key,equityDirectCosts(target.businessId,target.accountId,view.operations?.jobs,f.workbench.finance,view.date))
  const paid=costs.get(key)!.jobs.find(j=>j.id===job.id)?.paidFen
  return paid===null||paid===undefined?'本任务原直接费用尚待核对；':'本任务已付直接费用'+moneyText(paid)+'；'
 }
 const stopped=(target:EquitySceneTarget,job:ProductionJob|null,label:string)=>{
  if(!job||!['interrupted','cancelled'].includes(job.status)||!job.releasedAt)return false
  add('equity-job-stop:'+job.id,target,job.releasedAt,label+'已经停下',expense(target,job)+'没有记作实际完成或取得新股份，原行动、已发生成本与旧约仍保留。',[{kind:'job',id:job.id,date:job.releasedAt}])
  return true
 }
 const finance=(target:EquitySceneTarget)=>one(f.workbench.finance.filter(a=>a.accountId===target.accountId))
 const cash=(target:EquitySceneTarget,id:string,date:string,sourceId:string,value:number,allowUnscopedBusiness=false)=>{
  const row=one(finance(target)?.transactions.filter(t=>t.id===id)??[])
  return row&&row.date===date&&row.sourceId===sourceId&&row.amountFen===value&&Number.isSafeInteger(value)
   &&(row.businessId===target.businessId||allowUnscopedBusiness&&row.businessId===null)?row:null
 }
 for(const prep of v.preparations.filter(r=>r.kind==='relationship'||r.kind==='eligibility')){
  const found=original('preparation',prep.id,prep.businessId);if(!found)continue
  const {target,result:r}=found,job=r.job!,label=prep.kind==='relationship'?'这份原关系准备':'这份本局资格准备'
  if(stopped(target,job,label)||job.status!=='completed')continue
  add('equity-preparation:'+prep.id,target,job.completeAt,label+'已实际完成',expense(target,job)+'完成的是原准备，不等于对手已经授权、接受条款或发放股份。',[{kind:'preparation',id:prep.id,date:job.completeAt},{kind:'job',id:job.id,date:job.completeAt}])
 }
 for(const item of v.invitations){
  const found=original('invitation',item.id,item.businessId);if(!found)continue
  const {target,result:r}=found,i=r.invitation!
  if(i.brokerPaymentId){
   const fee=equityBrokerFee(i,target.accountId,f.workbench.finance,view.date),payment=one(finance(target)?.transactions.filter(t=>t.id===i.brokerPaymentId)??[])
   if(fee.paidFen!==null&&fee.paidFen>0&&payment)add('equity-broker:'+i.brokerPaymentId,target,payment.date,'这封邀请的中间服务费已实际支付','原中间服务费'+moneyText(fee.paidFen)+'已经付出；这笔费用本身不生成股份，也不证明对手授权或愿意融资。',[{kind:'payment',id:payment.id,date:payment.date},{kind:'invitation',id:i.id,date:i.createdAt}])
  }
  if(i.reportAt&&r.job?.status==='completed')add('equity-report:'+i.id,target,i.reportAt,'这封原邀请已经有实际核对结果',expense(target,r.job)+(i.authority?'原对手授权已核实；':'原对手授权未能核实；')+(i.financingConsent?'已核实有条件谈融资的意愿。':'未核实可谈融资的意愿。')+'报告本身不发股份，原资格与具体条款仍分别核对。',[{kind:'invitation',id:i.id,date:i.reportAt},{kind:'job',id:r.job.id,date:i.reportAt}])
  else stopped(target,r.job,'这次原邀请调查')
  if(i.status==='declined'){
   const c=one(equityHistoryCommands(source,'RejectEquityInvitation','invitationId',i.id))
   if(c)add('equity-invitation-declined:'+c.commandId,target,c.date,'这封邀请已经明确收起','收起邀请没有取得股份或退回已经发生的费用，原报告与付款仍保留。',[{kind:'command',id:c.commandId,date:c.date},{kind:'invitation',id:i.id,date:i.createdAt}],c.revisionAfter)
  }
 }
 for(const item of v.negotiations){
  const found=original('negotiation',item.id,item.businessId);if(!found)continue
  const {target,result:r}=found,n=r.negotiation!,job=r.job!
  if(!stopped(target,job,'这次原谈判')&&n.respondedAt&&n.accepted!==null)add('equity-terms-response:'+n.id,target,n.respondedAt,n.accepted?'这份原条款已有接受答复':'对方没有接受这份原条款',expense(target,job)+'原拟议本金'+moneyText(n.amountFen)+'与谈判费分开。答复本身不签署或发股，实际付款签署另列。',[{kind:'negotiation',id:n.id,date:n.respondedAt},{kind:'job',id:job.id,date:job.completeAt}])
  if(n.closedKind==='declined'){
   const c=one(equityHistoryCommands(source,'DeclineEquityTerms','negotiationId',n.id))
   if(c&&c.date===n.closedAt)add('equity-terms-declined:'+c.commandId,target,c.date,'这份原条款已经明确放下',expense(target,job)+'放下条款没有支付拟议投资本金或取得股份，原准备和报告保留。',[{kind:'command',id:c.commandId,date:c.date},{kind:'negotiation',id:n.id,date:n.closedAt}],c.revisionAfter)
  }
 }
 for(const item of v.agreements){
  const found=original('agreement',item.id,item.businessId);if(!found)continue
  const {target,result:r}=found,a=r.agreement!,initialRoundId=deepseekId('round1',a.id),initialOperation=deepseekId('acquire',a.id)
  const initial=one(v.rounds.filter(row=>row.id===initialRoundId)),initialLot=one(a.lots.filter(l=>l.originId===initialOperation)),sign=one(equityHistoryCommands(source,'SignEquityAgreement','negotiationId',a.negotiationId,a.id))
  if(initial&&sign&&initial.agreementId===a.id&&initial.kind===a.kind&&initial.date===a.signedAt&&sign.date===a.signedAt&&initial.playerMoneyFen===a.initialCostFen&&initial.totalShares>=a.initialShares&&initialLot?.shares===a.initialShares&&initialLot.costFen===a.initialCostFen
   &&a.acquisitionOperationIds.filter(id=>id===initialOperation).length===1&&cash(target,initialOperation,a.signedAt,a.negotiationId,-a.initialCostFen)){
   add('equity-signed:'+a.id,target,a.signedAt,'这份原本金已实际承诺，并取得架空股份','本次原本金'+moneyText(a.initialCostFen)+'实际支付，取得原'+a.initialShares+' / '+initial.totalShares+'模拟股；'+(a.kind==='new_capital'?'款项作为项目新增资本。':'款项付给原老股卖方，不增加项目资本。')+'这不是消费费用或现金收入，原锁定至'+a.lockUntil+'。',[{kind:'round',id:initial.id,date:initial.date},{kind:'agreement',id:a.id,date:a.signedAt},{kind:'operation',id:initialOperation,date:a.signedAt},{kind:'command',id:sign.commandId,date:sign.date}],sign.revisionAfter)
  }
  if(!a.followAt||!['participated','declined','defaulted'].includes(a.followDecision??'')||!amount(a.followAmountFen))continue
  const round=one(v.rounds.filter(row=>row.agreementId===a.id&&row.id!==initialRoundId&&row.date===a.followAt))
  if(!round||v.rounds.filter(row=>row.id===round.id).length!==1||round.kind!=='new_capital'||round.playerMoneyFen!==a.followAmountFen||!amount(round.totalShares)||round.totalShares===0||!amount(round.newMoneyFen)||round.newMoneyFen===0)continue
  const explicit=a.followDecision!=='defaulted',command=explicit?one(equityHistoryCommands(source,'FollowEquityRound','agreementId',a.id,round.id)):null
  if(explicit&&(!command||command.date!==a.followAt)||!explicit&&a.followAmountFen!==0)continue
  const operation=deepseekId('follow-acquire',round.id),lot=one(a.lots.filter(l=>l.originId===operation)),positive=a.followDecision==='participated'
  if(positive?!(a.followAmountFen>0&&lot&&lot.costFen===a.followAmountFen&&amount(lot.shares)&&lot.shares>0&&a.acquisitionOperationIds.filter(id=>id===operation).length===1&&cash(target,operation,a.followAt,a.id,-a.followAmountFen)):a.followAmountFen!==0||a.lots.some(l=>l.originId===operation)||a.acquisitionOperationIds.includes(operation))continue
  const refs:SeasonSourceRef[]=[{kind:'round',id:round.id,date:round.date},{kind:'agreement',id:a.id,date:a.followAt}]
  if(command)refs.push({kind:'command',id:command.commandId,date:command.date})
  if(positive)refs.push({kind:'operation',id:operation,date:a.followAt})
  add('equity-follow:'+round.id,target,a.followAt,positive?'这轮架空融资，已经实际追加本金':explicit?'这轮融资，已明确保留现金不追加':'本轮期限已到，原安排默认不追加',positive?'本次实际追加本金'+moneyText(a.followAmountFen)+'，新增'+lot!.shares+'模拟股；本轮总股本'+round.totalShares+'。投资资产和估值不是现金收入。':'本次新增付款0元、新增股份0股；'+(explicit?'这是原明确不追加的决定。':'这是原期限默认结果，不是另一次主动付款或选择。')+'原股份按本轮实际总股本'+round.totalShares+'继续，实际稀释不是退款或现金收入。',refs,command?.revisionAfter)
 }
 for(const item of v.governance){
  const found=original('governance',item.id,item.businessId);if(!found)continue
  const {target,result:r}=found,g=r.governance!,job=r.job!
  if(stopped(target,job,'这次原有限会议')||!g.resolvedAt||g.approved===null)continue
  add('equity-governance:'+g.id,target,g.resolvedAt,g.approved?'这项有限治理提案已有实际通过记录':'原董事会没有通过这项提案',expense(target,job)+(g.approved?'实际通过':'没有通过')+(g.policy==='independent_audit'?'独立核对本局资本用途':'限定研究用途与接手方')+'；少数席位不等于单方控制，旧报价与原款按各自记录保留。',[{kind:'governance',id:g.id,date:g.resolvedAt},{kind:'job',id:job.id,date:job.completeAt}])
 }
 for(const item of v.exits){
  const found=original('exit',item.id,item.businessId);if(!found)continue
  const {target,result:r}=found,e=r.exit!,job=r.job!
  if(!stopped(target,job,'这次原买方调查')&&e.responseAt&&e.buyerWilling!==null)add('equity-buyer:'+e.id,target,e.responseAt,e.buyerWilling?'独立买方留下了原有限报价':'这次原调查没有找到愿意接手的买方',expense(target,job)+(e.buyerWilling?'原每股'+moneyText(e.unitPriceFen)+'、原有效期至'+e.expiresAt+'，报价本身不是成交。':'本次没有成交，未售股份与原成本仍保留。')+'转让、应收和实际到账分别核对。',[{kind:'exit',id:e.id,date:e.responseAt},{kind:'job',id:job.id,date:job.completeAt}])
  const credit=e.receivable,sale=e.operationId?one(equityHistoryCommands(source,'AcceptEquityExit','exitId',e.id,e.operationId)):null
  if(sale&&credit&&e.soldShares>0)add('equity-sale:'+e.operationId,target,sale.date,'这笔原股份已经实际转出','本次实际转出'+e.soldShares+'股，形成原净应收'+moneyText(credit.amountFen)+'，原到期'+credit.dueAt+'。转让本身不等于收到现金；原累计费用保留，逐笔实收另列。',[{kind:'operation',id:e.operationId!,date:sale.date},{kind:'receivable',id:credit.id,date:credit.dueAt},{kind:'command',id:sale.commandId,date:sale.date}],sale.revisionAfter)
  if(!credit||e.collectionOperationIds.length===0)continue
  const ids=[...new Set(e.collectionOperationIds)],collections=ids.map(id=>{
   const c=one(equityHistoryCommands(source,'CollectEquityExit','exitId',e.id,id)),tx=one(finance(target)?.transactions.filter(t=>t.id===id)??[])
   return c&&tx&&tx.amountFen>0&&amount(tx.amountFen)&&cash(target,id,c.date,e.id,tx.amountFen,true)?{c,tx}:null
  })
  const actual=collections.filter(c=>c!==null).sort((a,b)=>a.c.revisionAfter-b.c.revisionAfter),total=actual.reduce((sum,row)=>sum+row.tx.amountFen,0)
  if(!amount(total)||total>e.collectedFen||total>credit.amountFen)continue
  const complete=ids.length===e.collectionOperationIds.length&&actual.length===ids.length&&total===e.collectedFen
  let received=0
  for(const [index,row] of actual.entries()){
   received+=row.tx.amountFen
   add('equity-collected:'+row.tx.id,target,row.c.date,complete?'这笔原款的第'+(index+1)+'次收款已实际到账':'这笔原款有一笔已核实的现金到账','本次原账户实收'+moneyText(row.tx.amountFen)+'；'+(complete?'截至本次收款后，原款尚余'+moneyText(credit.amountFen-received)+'。':'原收款序列尚未核全，不能反推当次后余款。')+'收款不再次确认投资收益，也不清除同协议的原余股或其它款项。',[{kind:'payment',id:row.tx.id,date:row.tx.date},{kind:'receivable',id:credit.id,date:credit.dueAt},{kind:'command',id:row.c.commandId,date:row.c.date}],row.c.revisionAfter)
  }
 }
 return rows
}

/** Reading roles do not grant or remove original command authority. A holding
 * stays visible without being presented as unfinished service or a debt. */
export function equitySeasonContinuations(p:SeasonInput):SeasonPendingItem[]{
 const v=p.features.deepseek;if(!v)return []
 const rows:SeasonPendingItem[]=[],published=p.features.sceneCommands
 const bound=published?.version===1&&published.runId===p.view.runId&&published.committedRevision===p.view.revision
 for(const {target} of equityFocusTargets(p)){
  if(target.kind==='business')continue
  const focus=equityFocusFor(p,target),journey=equityJourneyFor(p,focus),r=journey.resolution
  let continuation:NonNullable<SeasonPendingItem['continuation']>,dueAt:string|null=null,title=journey.title,line=journey.line,id='equity-record:'+target.kind+':'+target.recordId
  const job=r.job,credit=r.exit?.receivable
  if(!bound||r.status!=='valid'){
   continuation='unknown';title='这份权益原来源，仍待核对';line=!bound?'原公开来源尚未与当前人生和提交核同，先保留原对象；没有改用另一份权益。':r.reason??'原权益记录尚待核对。'
  }else if(job&&['planned','running'].includes(job.status)){
   continuation='task';id='operation-job:'+job.id;dueAt=journey.action.kind==='wait'?journey.action.date:job.completeAt;line=journey.line+' '+journey.facts.join(' ')
  }else if(credit&&credit.remainingFen>0){
   continuation='money';id='equity-credit:'+credit.id;dueAt=credit.dueAt;line='原净应收'+moneyText(credit.amountFen)+'、已收'+moneyText(r.exit!.collectedFen)+'、未收'+moneyText(credit.remainingFen)+'；款项仍在，实际收取须另行选择，不是新的收入或必须清空的任务。'
  }else if(target.kind==='agreement'&&r.agreement?.followDecision==='pending'||journey.decisionOpen){
   continuation='choice';dueAt=r.agreement?.followDecision==='pending'?r.agreement.followDeadline:r.invitation?.status==='open'?r.invitation.expiresAt:r.negotiation?.closedAt===null?r.negotiation.expiresAt:r.exit?.operationId===null?r.exit.expiresAt:null;line=journey.line+' 原选择仍由你决定；翻阅不接受新承诺。'
  }else if(target.kind==='agreement'&&r.agreement&&r.agreement.shares>0){
   continuation='retained';title='原持股与锁定，继续保留';line='当前仍持'+r.agreement.shares+' / '+r.agreement.totalShares+'模拟股，原锁定至'+r.agreement.lockUntil+'。估值不能花；持有不要求新增付款、续约或清空原记录。'
  }else continue
  if(rows.some(row=>row.id===id))continue
  rows.push({id,title,line,dueAt,accountId:target.accountId,urgent:false,continuation,sourceRefs:[{kind:target.kind,id:target.recordId,date:journey.originDate}],focus:continuation==='unknown'?null:focus,inspect:{screen:'deepseek',label:'翻看同一份权益原册',target:{accountId:target.accountId,deepseekPane:'equity',equityTarget:target,recordId:target.recordId,openRecord:true}}})
 }
 return rows
}
