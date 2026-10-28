import type {GamePanelProps} from './game-types.ts'
import {DEEPSEEK_JOBS} from '../content/deepseek.ts'
import {deepseekId} from '../core/deepseek-state.ts'
import {moneyText} from './game-text.ts'
import {equityDirectCosts,equityBrokerFee,type EquityDirectCosts} from './equity-costs.ts'
import type {SceneCommands} from '../application/scene-commands.ts'
import {resolveEquitySceneTarget,type EquitySceneContext,type EquitySceneTarget,type EquityTargetResolution} from './equity-scene-target.ts'

export type EquityChoiceIntent='actors'|'business'|'objects'|'prepare'|'discover'|'fund'|'job'|'invitation'|'negotiate'|'terms'|'holding'|'follow'|'governance'|'exit-request'|'exit-accept'|'collect'|'record'|'next'
export type EquityJourneyAction=
 |{readonly kind:'choice';readonly intent:EquityChoiceIntent;readonly label:string}
 |{readonly kind:'command';readonly command:'EnableCounterfactualEquity';readonly payload:{readonly acknowledge:true};readonly confirm:true;readonly label:string}
 |{readonly kind:'wait';readonly date:string;readonly label:string}
 |{readonly kind:'today';readonly label:string}
export type EquityPaperState='intention'|'preparation'|'letter'|'report'|'terms'|'reply'|'holding'|'governance'|'quote'|'receivable'|'receipt'|'kept'|'stopped'
export interface EquityJourneyContext extends EquitySceneContext{
 readonly finance:GamePanelProps['features']['workbench']['finance']
 readonly source?:{readonly revision:number;readonly receipts:GamePanelProps['view']['receipts']}
 readonly sceneCommands?:SceneCommands
}
export interface EquityJourney{
 readonly resolution:EquityTargetResolution
 readonly phase:string
 readonly paper:EquityPaperState
 readonly title:string
 readonly line:string
 readonly object:string
 readonly purpose:string
 readonly finishWhen:string
 readonly facts:readonly string[]
 readonly action:EquityJourneyAction
 readonly active:boolean
 readonly decisionOpen:boolean
 readonly outcome:'none'|'pending'|'actual'|'non-success'
 readonly originDate:string|null
 readonly resultDate:string|null
 readonly directCosts:EquityDirectCosts|null
}
const choice=(intent:EquityChoiceIntent,label:string):EquityJourneyAction=>({kind:'choice',intent,label})
const today=(label='收好原记录，回到今天'):EquityJourneyAction=>({kind:'today',label})

/** A selected original record is the entire scope. No private fact, latest-row
 * selection, permission grant or future evaluation is available here. */
export function equityJourney(v:GamePanelProps['features']['deepseek'],target:EquitySceneTarget|null,context:EquityJourneyContext):EquityJourney{
 const r=resolveEquitySceneTarget(v,target,context),business=r.business
 const costs=business?equityDirectCosts(business.id,business.accountId,context.operations?.jobs,context.finance,context.date):null
 const base:EquityJourney={resolution:r,phase:'entry',paper:'intention',title:'先决定，要不要留下这个假设。',line:'技术合作和购买服务不会产生股份。以下只是一段由你明确选择的架空融资情境。',object:'明确架空 · 一份参与想法',purpose:'比较一次架空参与的承担和自己的生活安排。',finishWhen:'每次承诺由你确认，实际结果按原规则发生。',facts:[],action:choice('actors','先选择这次准备的原主体'),active:false,decisionOpen:false,outcome:'none',originDate:null,resultDate:null,directCosts:costs}
 const commandDate=(kind:string,key:string,id:string,operationId?:string|null)=>{
  const published=context.sceneCommands,source=context.source
  if(!published||!source||published.version!==1||published.runId!==context.runId||published.committedRevision!==source.revision)return null
  const rows=published.commands.filter(c=>c.kind===kind&&c.identifiers[key]===id&&c.date<=context.date&&(operationId===undefined||operationId===deepseekId(c.commandId,c.kind))&&source.receipts.filter(r=>r.commandId===c.commandId&&r.kind===c.kind&&r.revisionAfter===c.revisionAfter).length===1)
  return rows.length===1&&published.commands.filter(c=>c.commandId===rows[0]!.commandId).length===1?rows[0]!.date:null
 }
 if(r.status==='invalid')return {...base,phase:'unknown',paper:'stopped',title:'先找回原来那一份。',line:r.reason!,action:choice('objects','明确重新选择原权益记录')}
 if(!v)return base
 if(v.counterfactualEnabledAt===null)return {...base,phase:'boundary',facts:['此选择不付投资本金、不获得股份，也不创建现实申购入口。'],action:{kind:'command',command:'EnableCounterfactualEquity',payload:{acknowledge:true},confirm:true,label:'看清边界后，选择这段架空情境'}}
 if(r.status==='entry')return {...base,title:'这次想法，由哪份自有钱承担？',line:'先选原个人准备分账或原生态企业。查看不创建股份，旧协议也不随新准备切换主体。',facts:['本局于'+v.counterfactualEnabledAt+'选择明确架空情境；协议、持有、治理和退出持续标识。']}
 const facts:string[]=[]
 const broker=r.invitation?equityBrokerFee(r.invitation,business!.accountId,context.finance,context.date):null
 const paid=[...(costs?.paidFen!==null&&costs?.paidFen!==undefined&&costs.paidFen>0?['本主体已付权益直接费用'+moneyText(costs.paidFen)]:[]),...(broker?.paidFen!==null&&broker?.paidFen!==undefined&&broker.paidFen>0?['这封邀请中间服务费已付'+moneyText(broker.paidFen)]:[])]
 if(paid.length)facts.push(paid.join('；')+'。不含投资本金、工资或维护。')
 if(broker?.reason)facts.push(broker.reason)
 if(costs?.reservedFen!==null&&costs?.reservedFen!==undefined&&costs.reservedFen>0)facts.push('同主体原权益任务仍预留'+moneyText(costs.reservedFen)+'，尚未作为实付费用。')
 if(costs?.reason)facts.push(costs.reason)
 if(business!.funds.prepaidLiabilityFen>0)facts.push('客户未履约预款'+moneyText(business!.funds.prepaidLiabilityFen)+'仍有保护义务，不能用于这次参与。')
 const origin=r.preparation?r.job?.startAt??null:r.invitation?.createdAt??null
 const labels:Record<EquitySceneTarget['kind'],string>={business:'这次参与的准备主体',preparation:'本主体的关系或资格准备',invitation:'这一封架空邀请',negotiation:'这一份架空条款',agreement:'已签署的架空持股',governance:'这一份有限治理提案',exit:'这一笔架空转让'}
 const build=(part:Partial<EquityJourney>):EquityJourney=>{
  const phase=part.phase??base.phase
  const purpose=phase.startsWith('preparation')?'把这份准备做到实际结果，再决定是否继续。':phase==='business'?'从这份自有钱与实际关系出发，决定下一步。':phase.startsWith('diligence')||phase.startsWith('invitation')?'核实这封邀请，再决定继续还是收起。':phase.startsWith('negotiation')||phase.startsWith('terms')?'比较这份具体条款，决定是否真正承诺本金。':phase.startsWith('follow')?'核对本轮当前能承担的原选择，也可以明确不新增付款。':phase==='holding'?'保留真实持股和自己的生活，再决定下一次承担。':phase.startsWith('governance')?'按已有权利提出有限的提案，接受实际表决。':'看清本次转让、余股与原款，再安排接下来的生活。'
  const finishWhen=phase==='holding'?'持有不要求清空记录；新的治理或转让须另选。':phase.startsWith('follow')?'本次原选择确认后，看实际持股与余地。':phase.startsWith('governance')?'实际表决后，回原协议或自己的生活。':['quote','receivable','collection','collected','transfer-no-credit','no-buyer','quote-expired','exit-stopped','disposed'].includes(phase)?'转让、应收与实收分别发生；余股和未收款继续保留。':phase.startsWith('terms')?'只有实际付款签署后才会取得股份；拒绝也能继续生活。':'看到本次准备或回信的实际结果，再选择下一步。'
  return {...base,object:'明确架空 · '+(target?labels[target.kind]:'参与想法'),originDate:origin,purpose,finishWhen,...part,facts:[...facts,...(part.facts??[])]}
 }
 const task=(phase:string,paper:EquityPaperState,title:string,label:string,originDate:string|null):EquityJourney|null=>{
  const job=r.job;if(!job||!['planned','running'].includes(job.status))return null
  const term=DEEPSEEK_JOBS.find(t=>t.id===job.definitionId),next=job.status==='planned'&&job.startAt>context.date?job.startAt:job.completeAt>context.date?job.completeAt:null
  const terms=term?`原基础支出${moneyText(term.costFen)} / 开工季度${term.actionPoints}点 / ${term.durationDays}日；工资与维护另列。`:'原投入定义尚待核对，完整记录仍保留。'
  const workingTitle=phase==='preparation'?(r.preparation?.kind==='relationship'?'正在把关系准备做扎实。':'正在完成本局参与资格。'):phase==='diligence'?'正在核对这封邀请的授权和意愿。':phase==='negotiation'?'正在谈这一份具体条款。':phase==='governance'?'这次有限提案，还在会议中。':'正在核实本次独立买方。'
  return build({phase:phase+'-'+job.status,paper,title:job.status==='planned'?title:workingTitle,line:job.status==='planned'?'已经安排，尚未实际开工；原来的日子仍要照常过。':'正在按原安排进行，还没有收到完成后的回应。',originDate,outcome:'pending',active:true,facts:[job.startAt+'—'+job.completeAt+'；'+terms+(job.status==='planned'?'已预留，尚未实付本任务费用或使用开工行动。':'已经实际开工，后续回信或权利仍分别核对。')],action:next?{kind:'wait',date:next,label:job.status==='planned'&&job.startAt>context.date?'等这份安排实际开工':label}:choice('record','翻原任务，核对这次等待')})
 }
 if(target?.kind==='business'){
  const active=v.preparations.some(p=>p.businessId===business!.id&&['relationship','eligibility'].includes(p.kind)&&p.job&&['planned','running'].includes(p.job.status))
  return build({phase:'business',paper:'preparation',title:business!.lifecycle==='closed'?'原准备分账已经合上。':!business!.related?'先让这份关系，真正成立。':'关系并不代替授权，还要看同一封邀请。',line:business!.lifecycle==='closed'?'原持股、转让和费用仍有各自记录；没有默认启用另一份主体。':active?'本主体仍有原准备在日历上，可以明确回到那一份，也可以先过自己的生活。':'邀请来源、付费尽调和本主体资格分别决定，不会因为资金或技术就取得股份。',originDate:business!.history[0]?.date??null,action:choice('business','核对这个主体的原条件与下一步'),facts:['当前原主体可花'+moneyText(business!.funds.availableFen)+'；准备和本金仍须分别确认。']})
 }
 if(r.preparation){
  const name=r.preparation.kind==='relationship'?'关系准备':'本局参与资格',pending=task('preparation','preparation',name+'，已经留好日子。','等这份'+name+'实际完成',r.job!.startAt)
  if(pending)return pending
  const completed=r.job?.status==='completed'
  return build({phase:completed?'preparation-completed':'preparation-stopped',paper:completed?'report':'stopped',title:completed?name+'已经完成。':'这份'+name+'已经停下。',line:completed?'准备成果已经留下，邀请、条款和实际付款仍分别决定；现在还没有因此多出股份。':'已经发生的成本与原记录保留；等候不会自动补做，也没有取得股份。',originDate:r.job?.startAt??null,resultDate:completed?r.job!.completeAt:r.job?.releasedAt??null,outcome:completed?'actual':'non-success',action:choice('business','回到同一主体，选择接下来的一步')})
 }
 if(target?.kind==='invitation'&&r.invitation){
  const i=r.invitation
  if(i.status!=='open'){
   const pending=task('diligence','letter','邀请已结束，原调查仍有安排。','等这份调查实际完成，不恢复邀请',i.createdAt)
   if(pending)return {...pending,phase:'invitation-closed-with-task',title:i.status==='declined'?'邀请已经拒绝，原调查仍在日历上。':'邀请已经到期，原调查仍在日历上。',line:'邀请不能继续使用，不等于调查任务自动取消；原投入和安排保留，也可核对原任务的停止选择。',purpose:'看清已经安排的调查，不恢复这封原邀请。',finishWhen:'调查结果留下后，可回生活；新的邀请仍须另选。'}
   return build({phase:'invitation-closed',paper:'kept',title:i.status==='used'?'这封邀请已有自己的协议记录。':i.status==='declined'?'这封邀请已经拒绝。':'这封原邀请已经到期。',line:'原调查、中间费和准备记录仍保留；没有换成另一封邀请或免费取得股份。',originDate:i.createdAt,resultDate:i.status==='declined'?commandDate('RejectEquityInvitation','invitationId',i.id):null,outcome:i.status==='used'?'actual':'non-success',action:today(),facts:[`原邀请有效至${i.expiresAt}。`]})
  }
  const pending=task('diligence','letter','先查清这封邀请的来意。','等同一份尽调报告实际完成',i.createdAt);if(pending)return pending
  if(i.reportAt===null)return build({phase:r.job?'diligence-stopped':'invitation',paper:r.job?'stopped':'letter',title:r.job?'尽调还没有留下可用的报告。':'一封介绍，还不是可投资的承诺。',line:'授权与融资意愿都尚未核实。可以安排原尽调，也可以拒绝；中间服务费不产生股份、资格或同意。',originDate:i.createdAt,decisionOpen:true,outcome:r.job?'non-success':'none',action:choice('invitation','先比较尽调、拒绝与原风险选择'),facts:['原邀请最迟'+i.expiresAt+'；调查和新承诺都保自己的真实时间。',...(i.brokerPaymentId?['这封邀请已有原中间服务费记录，不能把它当作投资本金。']:[])]})
  const verified=i.authority===true&&i.financingConsent===true
  return build({phase:verified?'diligence-completed':'diligence-rejected',paper:'report',title:verified?'授权和有条件意愿，已经分别核实。':i.authority===false?'这次没有核实到原对手授权。':'对方当前没有可确认的融资意愿。',line:verified?business!.eligible?'仍要比较条款与原日期，再决定是否付出下一次谈判成本。':'本主体资格仍须另行准备；已知报告不等于已经持股。':'这次调查已真实发生，原费用和记录保留；不能据此付款签出股份。',originDate:i.createdAt,resultDate:i.reportAt,outcome:verified?'actual':'non-success',decisionOpen:verified,action:verified?choice(business!.eligible?'negotiate':'prepare',business!.eligible?'比较这封邀请可谈的原条款':'核对本主体的资格准备'):today(),facts:['原邀请有效至'+i.expiresAt+'；授权、融资意愿、资格和谈判各自成立。']})
 }
 if(target?.kind==='negotiation'&&r.negotiation){
  const n=r.negotiation,terms=v.catalog.terms.find(t=>t.id===n.termsId)!,pending=task('negotiation','terms','这份条款，还在等原回应。','等这份原谈判实际回应',n.createdAt)
  if(pending)return r.invitation?.status!=='open'?{...pending,phase:'negotiation-invitation-closed',title:'原邀请已不再有效，谈判任务仍在日历上。',line:'这份已安排的谈判不会自动取消；即使后来回应，也不能据已结束邀请直接取得股份。'}:pending
  const details=[`${n.closedAt!==null||n.expired||r.invitation?.status!=='open'?'原条款本金':'拟支付本金'}${moneyText(n.amountFen)} / ${n.shares}模拟股；${n.kind==='new_capital'?'新增项目资本':'老股款付给原卖方，不增加项目资本'}。`,`${terms.label} / 原锁定${terms.lockDays}日 / 条款有效至${n.expiresAt}。`]
  if(n.closedAt!==null)return build({phase:'terms-closed',paper:'kept',title:n.closedKind==='signed'?'本条款已经实际签署，持股另有原册。':'这份条款已经由你拒绝。',line:'原谈判与调查费用保留；查看这份旧条款不会再次付款或取得股份。',purpose:n.closedKind==='signed'?'收好已经签署的原条款，实际持股与生活分别继续。':'收好已经拒绝的原条款，再选择接下来的生活。',finishWhen:n.closedKind==='signed'?'回到今天不重复付款；实际持股、锁定和原款仍按各自记录继续。':'原条款已经拒绝，回到今天不重谈或新增付款。',originDate:n.createdAt,resultDate:n.closedAt,outcome:n.closedKind==='signed'?'actual':'non-success',action:today(),facts:details})
  if(n.expired)return build({phase:'terms-expired',paper:'kept',title:'这份条款已经过了原有效期。',line:'没有自动付款或取得股份。已付准备费用保留，新的提案须另行选择。',purpose:'收好已经过期的原条款，不恢复原承诺。',finishWhen:'回到今天保留原费用；新的提案仍须另选并确认。',originDate:n.createdAt,outcome:'non-success',action:today(),facts:details})
  if(n.respondedAt===null)return build({phase:'negotiation-stopped',paper:'stopped',title:'本次谈判尚无可用回应。',line:'原任务未完成或已停下；没有提前接受、付款或持股。',originDate:n.createdAt,outcome:'non-success',action:choice('record','核对这份原条款与任务'),facts:details})
  if(r.invitation?.status!=='open')return build({phase:'terms-invitation-closed',paper:'kept',title:'原邀请已经结束，不能据此实际签署。',line:'谈判回应与邀请时效是两件事。原费用和条款仍保留，可按原允许范围拒绝收起；没有自动付款或取得股份。',purpose:'核对已结束邀请的原条款与已付费用，不恢复签署。',finishWhen:'回到今天不恢复原邀请；原条款可按原允许范围另行收起。',originDate:n.createdAt,resultDate:n.respondedAt,outcome:'non-success',action:today(),facts:details})
  return build({phase:n.accepted?'terms-accepted':'terms-rejected',paper:'reply',title:n.accepted?'条件谈妥了，要不要真的投入这笔本金？':'这份条款没有得到原对手接受。',line:n.accepted?'对手接受条款不等于你已经付款；签署和取得股份仍由你独立确认。':'本次谈判费用已经发生；可明确拒绝收起，不自动重谈或取得股份。',...(!n.accepted?{purpose:'看清原对手未接受的回应，再决定是否明确收起。',finishWhen:'拒绝收起须由你确认；不会自动重谈、付款或取得股份。'}:{}),originDate:n.createdAt,resultDate:n.respondedAt,outcome:n.accepted?'actual':'non-success',decisionOpen:true,action:choice('terms',n.accepted?'比较实际签署和不接受':'核对原回应，选择是否收起'),facts:details})
 }
 const a=r.agreement
 if(a){
  const holding=`仍持${a.shares}/${a.totalShares}模拟股（约${(a.holdingBps/100).toFixed(2)}%）；尚持有成本${moneyText(a.asset?.bookCostFen)}，账面值${moneyText(a.asset?.valueFen)}不能花。`
  if(target?.kind==='agreement'&&a.shares===0){
   const sales=v.exits.filter(e=>e.agreementId===a.id&&e.operationId!==null&&e.soldShares>0),dates=sales.map(e=>commandDate('AcceptEquityExit','exitId',e.id,e.operationId)).filter((date):date is string=>date!==null),sold=sales.reduce((sum,e)=>sum+e.soldShares,0)
   const known=sales.length>0&&new Set(sales.map(e=>e.id)).size===sales.length&&new Set(sales.map(e=>e.operationId)).size===sales.length&&sales.every(e=>e.businessId===a.businessId)&&Number.isSafeInteger(sold)&&sold===a.disposedShares&&dates.length===sales.length
   const pending=a.followDecision==='pending'
   return build({phase:pending?'follow-without-holding':'disposed',paper:'kept',title:pending?'持股已经转出，本轮只核对旧安排。':'这份原持股，已经全部转出。',line:pending?'当前没有可新增跟投的持股；可明确不新增付款，或沿原到期安排继续。各笔转让原款仍分别保留。':'股份已经转出，不等于原款已经到账。每笔转让和应收仍按自己的原记录继续，生活也可以继续。',originDate:a.signedAt,resultDate:known?dates.sort().at(-1)??null:null,outcome:pending?'pending':'actual',decisionOpen:pending,action:choice(pending?'follow':'holding',pending?'核对本轮原安排，明确不新增付款':'核对原协议与各笔转让原款'),facts:[`原签署本金${moneyText(a.initialCostFen)}；已转出${a.disposedShares}模拟股，原转出持有成本${moneyText(a.disposedBasisFen)}。这不是现金退款或已经收回的本金。`,pending?'本轮原截止'+a.followDeadline+'，不会因查看自动付款或作出决定。':'现已没有这份协议的持股；原调查、会议和转让费用仍在原账。']})
  }
  if(target?.kind==='agreement')return build({phase:a.followDecision==='pending'?'follow':'holding',paper:'holding',title:a.followDecision==='pending'?'愿不愿再留一笔钱，参与这次融资？':'这份权利已经持有，生活仍可继续。',line:a.followDecision==='pending'?'本轮最迟'+a.followDeadline+'决定；不跟投或逾期默认不付款，原股份按实际新增资本稀释。':'锁定和原权利仍在；持有本身不要求清空记录，也不等于有买方或可花现金。',originDate:a.signedAt,resultDate:a.followDecision&&a.followDecision!=='pending'?a.followAt:a.signedAt,outcome:a.followDecision==='pending'?'pending':'actual',decisionOpen:a.followDecision==='pending',action:choice(a.followDecision==='pending'?'follow':'holding',a.followDecision==='pending'?'比较本轮投入和明确不跟投':'看看本协议的权利、锁定与原选择'),facts:[holding,`原锁定至${a.lockUntil}；${a.board?'一席董事，无单方控制':'无董事权'}，${a.preemptive?'原条款有跟投权':'原条款无跟投权'}。`]})
  if(r.governance){const g=r.governance,pending=task('governance','governance','有限提案，尚未实际表决。','等这次原会议实际回应',g.createdAt);if(pending)return pending
   return build({phase:g.resolvedAt===null?'governance-stopped':'governance-result',paper:g.resolvedAt===null?'stopped':'governance',title:g.resolvedAt===null?'这次会议还没有留下表决结果。':g.approved?'有限提案已经按原范围通过。':'原董事会没有通过这份提案。',line:g.resolvedAt===null?'原股份和已发生成本保留，不能把未完成会议画成通过。':g.approved?g.policy==='independent_audit'?'本局已发生的资本用途核对已开放；没有取得单方研发控制。':'原用途/接手方限制按实际生效日影响新的退出申请，旧报价不追改。':'原股份及会议成本保留；少数席位不能替对手作决定。',originDate:g.createdAt,resultDate:g.resolvedAt,outcome:g.approved?'actual':'non-success',action:today(),facts:[holding]})
  }
  if(r.exit){const e=r.exit,pending=task('exit','letter','先问清，是否真有人愿意接手。','等本次原买方调查实际回应',e.createdAt);if(pending)return pending
   if(e.receivable){const credit=e.receivable,closed=credit.remainingFen===0,zero=credit.amountFen===0
    const accounts=context.finance.filter(f=>f.accountId===a.accountId),transactions=accounts.length===1?accounts[0]!.transactions.filter(t=>e.collectionOperationIds.includes(t.id)):[]
    const knownCash=e.collectedFen>0&&new Set(e.collectionOperationIds).size===e.collectionOperationIds.length&&transactions.length===e.collectionOperationIds.length&&new Set(transactions.map(t=>t.id)).size===transactions.length&&transactions.every(t=>t.sourceId===e.id&&Number.isSafeInteger(t.amountFen)&&t.amountFen>0&&t.date>=credit.dueAt&&t.date<=context.date)&&transactions.reduce((n,t)=>n+t.amountFen,0)===e.collectedFen
    const resultDate=knownCash?transactions.map(t=>t.date).sort().at(-1)??null:null
    return build({phase:closed?zero?'transfer-no-credit':'collected':credit.dueAt<=context.date?'collection':'receivable',paper:closed?zero?'kept':'receipt':'receivable',title:closed?zero?'这次转让没有形成净应收款。':'本笔原款已经收齐，下一段日子怎么安排？':credit.dueAt<=context.date?'这笔原转让款，已经到约定日期。':'股份已转让，原款还在路上。',line:zero?'未发生现金收款；剩余股份和原投资记录保留。':closed?'实际银行现金已收到，收款不重复确认投资收益；余股和原成本仍在。':'原费用已在转让中单列，应收还不能花；可先过自己的生活，原款不会消失。',originDate:e.createdAt,resultDate,outcome:closed?'actual':'pending',active:!closed,decisionOpen:!closed&&credit.dueAt<=context.date,action:closed?today():credit.dueAt<=context.date?choice('collect','核对这笔原款，选择实际收取金额'):{kind:'wait',date:credit.dueAt,label:'等本笔原款到约定日期'},facts:[`本笔已转${e.soldShares}股 / 净应收${moneyText(credit.amountFen)} / 已收${moneyText(e.collectedFen)} / 未收${moneyText(credit.remainingFen)} / 原到期${credit.dueAt}。`,holding]})
   }
   const absent=e.buyerWilling===false,expired=e.quoteExpired
   if(absent||expired||e.responseAt===null)return build({phase:absent?'no-buyer':expired?'quote-expired':'exit-stopped',paper:absent||expired?'kept':'stopped',title:absent?'这次没有愿意接手的买方。':expired?'这份原报价已经失效。':'原买方调查尚无可用回应。',line:'本次申请没有实际出售股份；原调查费用与全部未售股份保留，不能按过去峰值套现。',originDate:e.createdAt,resultDate:absent?e.responseAt:null,outcome:'non-success',action:today(),facts:[holding]})
   return build({phase:'quote',paper:'quote',title:'有人愿意接手，也要看清这份有限报价。',line:'报价还不是成交。接受的实际股数由你显选，余股保留；转让后仍要等原款到期。',originDate:e.createdAt,resultDate:e.responseAt,outcome:'actual',decisionOpen:true,action:choice('exit-accept','选择实际股数，核对这份原转让'),facts:[`原每股${moneyText(e.unitPriceFen)} / 最多${e.shares}股 / 有效至${e.expiresAt}；总价、本次累计取整费用和净应收在原确认分列。`,holding]})
  }
 }
 return build({phase:'unknown',paper:'stopped',title:'先核对原来这一份的阶段。',line:'当前公开记录还不足以组织下一步；没有换成另一份协议或报价。',action:choice('record','翻阅这一份原记录')})
}
