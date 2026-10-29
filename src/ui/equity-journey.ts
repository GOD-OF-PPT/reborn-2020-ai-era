import type {GamePanelProps} from './game-types.ts'
import {DEEPSEEK_JOBS} from '../content/deepseek.ts'
import {moneyText} from './game-text.ts'
import {equityDirectCosts,equityBrokerFee,type EquityDirectCosts} from './equity-costs.ts'
import type {SceneCommands} from '../application/scene-commands.ts'
import {resolveEquitySceneTarget,type EquitySceneContext,type EquitySceneTarget,type EquityTargetResolution} from './equity-scene-target.ts'
import {equityHistoryCommands} from './equity-public-history.ts'
import {equityGovernancePolicy,equityGovernanceEffectiveDate} from './equity-governance-ui.ts'
import {equityExitCash} from './equity-exit-cash.ts'
import {equityRetainedFacts} from './equity-retained-facts.ts'

export type EquityChoiceIntent='actors'|'business'|'objects'|'prepare'|'relationship'|'eligibility'|'discover'|'fund'|'job'|'invitation'|'negotiate'|'terms'|'holding'|'follow'|'governance'|'exit-request'|'exit-accept'|'collect'|'record'|'next'
export type EquityJourneyAction=
 |{readonly kind:'choice';readonly intent:EquityChoiceIntent;readonly label:string}
 |{readonly kind:'command';readonly command:'EnableCounterfactualEquity';readonly payload:{readonly acknowledge:true};readonly confirm:true;readonly label:string}
 |{readonly kind:'wait';readonly date:string;readonly label:string}
 |{readonly kind:'today';readonly label:string}
export type EquityPaperState='intention'|'preparation'|'letter'|'report'|'terms'|'reply'|'holding'|'governance'|'quote'|'receivable'|'receipt'|'kept'|'stopped'
export interface EquityJourneyContext extends EquitySceneContext{
 readonly phase?:GamePanelProps['view']['phase']
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
  const rows=equityHistoryCommands(context,kind,key,id,operationId)
  return rows.length===1?rows[0]!.date:null
 }
 if(r.status==='invalid')return {...base,phase:'unknown',paper:'stopped',title:'先找回原来那一份。',line:r.reason!,action:choice('objects','明确重新选择原权益记录')}
 if(context.phase==='epilogue'&&r.status==='entry')return {...base,phase:'tail-entry',paper:'kept',object:'明确架空的原事项',title:'原来的持股和款项，想怎样收好？',line:'只沿原协议、邀请、任务与款项继续；没有新的投资、季度预算或资格。',purpose:'明确选择原来那一份，再决定如何处理或保留。',finishWhen:'查看不付款或转让；也可以回尾声，保留原来的事项。',action:choice('objects','选择一份原持股、任务或款项')}
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
  const action=part.action??base.action
  return {...base,object:'明确架空 · '+(target?labels[target.kind]:'参与想法'),originDate:origin,purpose,finishWhen,...part,action:context.phase==='epilogue'&&action.kind==='today'?{...action,label:'收好原记录，回到尾声'}:action,facts:[...facts,...(part.facts??[])]}
 }
 const task=(phase:string,paper:EquityPaperState,title:string,label:string,originDate:string|null):EquityJourney|null=>{
  const job=r.job;if(!job||!['planned','running'].includes(job.status))return null
  const term=DEEPSEEK_JOBS.find(t=>t.id===job.definitionId),next=job.status==='planned'&&job.startAt>context.date?job.startAt:job.completeAt>context.date?job.completeAt:null
  const terms=term?`原基础支出${moneyText(term.costFen)} / 开工季度${term.actionPoints}点 / ${term.durationDays}日；工资与维护另列。`:'原投入定义尚待核对，完整记录仍保留。'
  const workingTitle=phase==='preparation'?(r.preparation?.kind==='relationship'?'正在把关系准备做扎实。':'正在完成本局参与资格。'):phase==='diligence'?'正在核对这封邀请的授权和意愿。':phase==='negotiation'?'正在谈这一份具体条款。':phase==='governance'?'这次有限提案，还在会议中。':'正在核实本次独立买方。'
  return build({phase:phase+'-'+job.status,paper,title:job.status==='planned'?title:workingTitle,line:job.status==='planned'?'已经安排，尚未实际开工；原来的日子仍要照常过。':'正在按原安排进行，还没有收到完成后的回应。',originDate,outcome:'pending',active:true,facts:[job.startAt+'—'+job.completeAt+'；'+terms+(job.status==='planned'?'已预留，尚未实付本任务费用或使用开工行动。':'已经实际开工，后续回信或权利仍分别核对。')],action:next?{kind:'wait',date:next,label:job.status==='planned'&&job.startAt>context.date?'等这份安排实际开工':label}:choice('record','翻原任务，核对这次等待')})
 }
 if(target?.kind==='business'){
  const retained=equityRetainedFacts(v,business!,context)
  if(business!.lifecycle==='winding_down'||business!.lifecycle==='closed'){
   const closed=business!.lifecycle==='closed',history=business!.history.filter(h=>h.state===(closed?'closed':'winding_down')),latest=history.at(-1)
   return build({phase:closed?'business-closed':'business-winding-down',paper:'kept',title:closed?'这份原分账已经合上，日子仍可以继续。':'这份主体已经进入收尾，原记录仍在。',line:closed?'原准备、费用和人生历史仍保留；没有开启另一份主体，也没有新增收入。':'原任务按实际阶段停止，不会继续寻找新邀请；已经持有的股份、锁定与各笔原款分别保留。',purpose:closed?'本分账已经关闭，收好原记录，再选择自己的生活。':'核对停止后的原记录，保留持股、旧款与已经承担的责任。',finishWhen:'不要求为了回生活而清空持股；关闭仍按原资产和义务条件独立确认。',originDate:business!.history[0]?.date??null,resultDate:latest?.date===commandDate(closed?'CloseBusiness':'WindDownBusiness','businessId',business!.id)?latest?.date??null:null,outcome:'actual',action:closed?today():choice('next','看看原持股、款项与关闭条件'),facts:[...retained,'本账户当前可花'+moneyText(business!.funds.availableFen)+'；它不是本次收尾新增的收入。']})
  }
  if(context.phase==='epilogue')return build({phase:'business',paper:'kept',title:'这份原主体，还有哪些事项要收好？',line:'只沿本主体原来的任务、费用、持股与款项继续；尾声不开始新的关系、资格或投资。',purpose:'核对本主体的旧约与余地，再决定继续保留或实际收尾。',finishWhen:'回尾声保留全部原记录；新的收尾或转账仍由你确认。',originDate:business!.history[0]?.date??null,action:choice('business','核对原事项与收尾选择'),facts:[...retained,'当前原主体可花'+moneyText(business!.funds.availableFen)+'；保护款与旧义务仍分别保留。']})
  const activeJobs=context.operations?.jobs.filter(j=>j.businessId===business!.id&&['planned','running'].includes(j.status))??[],active=activeJobs.length>0
  if(active)return build({phase:'business',paper:'preparation',title:'这份原安排还在日历上，想怎样继续？',line:'本主体仍有已经安排或进行中的原任务。可以保留它们，过自己的日子；真正停止整份主体则须另行核对原影响。',purpose:'保留原安排，或看清停止整份主体的真实代价。',finishWhen:'原任务与已经付出的费用继续按各自记录；真正停止仍须独立确认。',originDate:business!.history[0]?.date??null,action:choice('next','保留原安排，或核对整份主体的收尾'),facts:[...retained,'本主体当前'+activeJobs.length+'份原任务仍在日历上；具体日期与投入保留在同一份原记录。']})
  if(business!.lifecycle==='preparing'||business!.lifecycle==='discovered')return build({phase:'business',paper:'preparation',title:'这份原主体仍在准备，下一步由你决定。',line:'资金转入不代替实际准备；原材料、任务、关系与参与资格仍各自核对。可以先保留这份投入，也可以查看真实收尾条件。',purpose:'看清尚未完成的原准备和自有资金，再决定继续还是保留。',finishWhen:'翻阅条件不会自动安排新任务、取得股份或产生收入；新的承担仍须独立确认。',originDate:business!.history[0]?.date??null,action:choice('business','看看这份原准备的条件与去向'),facts:[...retained,'本账户当前可花'+moneyText(business!.funds.availableFen)+'；它仍是自己的资金，不代表准备已经完成。']})
  const first=business!.lifecycle==='operating'&&!active&&!v.invitations.some(i=>i.businessId===business!.id)
  return build({phase:'business',paper:'preparation',title:!business!.related?'先让这份关系，真正成立。':'关系并不代替授权，还要看同一封邀请。',line:active?'本主体仍有原准备在日历上，可以明确回到那一份，也可以先过自己的生活。':'邀请来源、付费尽调和本主体资格分别决定，不会因为资金或技术就取得股份。',originDate:business!.history[0]?.date??null,action:first?choice(business!.related?'discover':'relationship',business!.related?'选择一次介绍的来源，先听再判断':'给这份关系准备，选自己的资源与日子'):choice('business','核对这个主体的原条件与下一步'),facts:[...retained,'当前原主体可花'+moneyText(business!.funds.availableFen)+'；准备和本金仍须分别确认。']})
 }
 if(r.preparation){
  const name=r.preparation.kind==='relationship'?'关系准备':'本局参与资格',pending=task('preparation','preparation',name+'，已经留好日子。','等这份'+name+'实际完成',r.job!.startAt)
  if(pending)return pending
  const completed=r.job?.status==='completed'
  const firstIntroduction=completed&&r.preparation.kind==='relationship'&&business!.lifecycle==='operating'&&!v.invitations.some(i=>i.businessId===business!.id)
  return build({phase:completed?'preparation-completed':'preparation-stopped',paper:completed?'report':'stopped',title:completed?name+'已经完成。':'这份'+name+'已经停下。',line:completed?'准备成果已经留下，邀请、条款和实际付款仍分别决定；现在还没有因此多出股份。':'已经发生的成本与原记录保留；等候不会自动补做，也没有取得股份。',purpose:completed?'本次准备成果已经留下，接下来是否继续由你另选。':'这份安排已经停下，保留原成本和记录，再选择自己的生活。',finishWhen:completed?'本次准备已经完成；邀请、调查与实际付款仍分别决定。':'这份安排已经停下，不再等不存在的完成；重新准备仍须显选，也可先回今天。',originDate:r.job?.startAt??null,resultDate:completed?r.job!.completeAt:r.job?.releasedAt??null,outcome:completed?'actual':'non-success',action:firstIntroduction?choice('discover','选择一次介绍的来源，先听再判断'):completed&&r.preparation.kind==='eligibility'?choice('objects','明确选回原邀请，再比较条款'):choice('business','回到同一主体，选择接下来的一步')})
 }
 if(target?.kind==='invitation'&&r.invitation){
  const i=r.invitation
  if(i.status!=='open'){
   const pending=task('diligence','letter','邀请已结束，原调查仍有安排。','等这份调查实际完成，不恢复邀请',i.createdAt)
   if(pending)return {...pending,phase:'invitation-closed-with-task',title:i.status==='declined'?'邀请已经拒绝，原调查仍在日历上。':'邀请已经到期，原调查仍在日历上。',line:'邀请不能继续使用，不等于调查任务自动取消；原投入和安排保留，也可核对原任务的停止选择。',purpose:'看清已经安排的调查，不恢复这封原邀请。',finishWhen:'调查结果留下后，可回生活；新的邀请仍须另选。'}
   return build({phase:'invitation-closed',paper:'kept',title:i.status==='used'?'这封邀请已有自己的协议记录。':i.status==='declined'?'这封邀请已经拒绝。':'这封原邀请已经到期。',line:'原调查、中间费和准备记录仍保留；没有换成另一封邀请或免费取得股份。',originDate:i.createdAt,resultDate:i.status==='declined'?commandDate('RejectEquityInvitation','invitationId',i.id):null,outcome:i.status==='used'?'actual':'non-success',action:today(),facts:[`原邀请有效至${i.expiresAt}。`]})
  }
  const pending=task('diligence','letter','先查清这封邀请的来意。','等同一份尽调报告实际完成',i.createdAt);if(pending)return pending
  if(context.phase==='epilogue')return build({phase:'tail-invitation',paper:i.reportAt===null?'letter':'report',title:'这封原邀请，仍有自己的来处。',line:'尾声不开始新的调查、资格或投资；原报告、费用和拒绝选择仍可核对。',originDate:i.createdAt,resultDate:i.reportAt,action:choice('invitation','核对原邀请与拒绝收起的选择'),facts:['原邀请有效至'+i.expiresAt+'；未公开的授权或意愿仍未核实。']})
  if(i.reportAt===null)return build({phase:r.job?'diligence-stopped':'invitation',paper:r.job?'stopped':'letter',title:r.job?'尽调还没有留下可用的报告。':'一封介绍，还不是可投资的承诺。',line:'授权与融资意愿都尚未核实。可以安排原尽调，也可以拒绝；中间服务费不产生股份、资格或同意。',originDate:i.createdAt,decisionOpen:true,outcome:r.job?'non-success':'none',action:choice('invitation','先比较尽调、拒绝与原风险选择'),facts:['原邀请最迟'+i.expiresAt+'；调查和新承诺都保自己的真实时间。',...(i.brokerPaymentId?['这封邀请已有原中间服务费记录，不能把它当作投资本金。']:[])]})
  const verified=i.authority===true&&i.financingConsent===true
  return build({phase:verified?'diligence-completed':'diligence-rejected',paper:'report',title:verified?'授权和有条件意愿，已经分别核实。':i.authority===false?'这次没有核实到原对手授权。':'对方当前没有可确认的融资意愿。',line:verified?business!.eligible?'仍要比较条款与原日期，再决定是否付出下一次谈判成本。':'本主体资格仍须另行准备；已知报告不等于已经持股。':'这次调查已真实发生，原费用和记录保留；不能据此付款签出股份。',originDate:i.createdAt,resultDate:i.reportAt,outcome:verified?'actual':'non-success',decisionOpen:verified,action:verified?choice(business!.eligible?'negotiate':'eligibility',business!.eligible?'比较这封邀请可谈的原条款':'给本局资格准备，另选资源与日子'):today(),facts:['原邀请有效至'+i.expiresAt+'；授权、融资意愿、资格和谈判各自成立。']})
 }
 if(target?.kind==='negotiation'&&r.negotiation){
  const n=r.negotiation,terms=v.catalog.terms.find(t=>t.id===n.termsId)!,pending=task('negotiation','terms','这份条款，还在等原回应。','等这份原谈判实际回应',n.createdAt)
  if(pending)return r.invitation?.status!=='open'?{...pending,phase:'negotiation-invitation-closed',title:'原邀请已不再有效，谈判任务仍在日历上。',line:'这份已安排的谈判不会自动取消；即使后来回应，也不能据已结束邀请直接取得股份。'}:pending
  const details=[`${n.closedAt!==null||n.expired||r.invitation?.status!=='open'?'原条款本金':'拟支付本金'}${moneyText(n.amountFen)} / ${n.shares}模拟股；${n.kind==='new_capital'?'新增项目资本':'老股款付给原卖方，不增加项目资本'}。`,`${terms.label} / 原锁定${terms.lockDays}日 / 条款有效至${n.expiresAt}。`]
  if(n.closedAt!==null)return build({phase:'terms-closed',paper:'kept',title:n.closedKind==='signed'?'本条款已经实际签署，持股另有原册。':'这份条款已经由你拒绝。',line:'原谈判与调查费用保留；查看这份旧条款不会再次付款或取得股份。',purpose:n.closedKind==='signed'?'收好已经签署的原条款，实际持股与生活分别继续。':'收好已经拒绝的原条款，再选择接下来的生活。',finishWhen:n.closedKind==='signed'?'回到今天不重复付款；实际持股、锁定和原款仍按各自记录继续。':'原条款已经拒绝，回到今天不重谈或新增付款。',originDate:n.createdAt,resultDate:n.closedAt,outcome:n.closedKind==='signed'?'actual':'non-success',action:today(),facts:details})
  if(n.expired)return build({phase:'terms-expired',paper:'kept',title:'这份条款已经过了原有效期。',line:'没有自动付款或取得股份。已付准备费用保留，新的提案须另行选择。',purpose:'收好已经过期的原条款，不恢复原承诺。',finishWhen:'回到今天保留原费用；新的提案仍须另选并确认。',originDate:n.createdAt,outcome:'non-success',action:today(),facts:details})
  if(n.respondedAt===null)return build({phase:'negotiation-stopped',paper:'stopped',title:'本次谈判尚无可用回应。',line:'原任务未完成或已停下；没有提前接受、付款或持股。',originDate:n.createdAt,outcome:'non-success',action:choice('record','核对这份原条款与任务'),facts:details})
  if(context.phase==='epilogue')return build({phase:'terms-tail',paper:'kept',title:'常规篇已经结束，原条款仍可收好。',line:'原回应与费用保留；尾声不再签署新持股，可按原允许范围拒绝收起。',purpose:'核对原条款的回应和退出选择，不新增投资。',finishWhen:'拒绝仍由你另行确认；回尾声不付款或恢复原邀请。',originDate:n.createdAt,resultDate:n.respondedAt,outcome:'non-success',action:choice('terms','核对原条款，决定是否明确收起'),facts:details})
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
  if(target?.kind==='agreement')return build({phase:a.followDecision==='pending'?'follow':'holding',paper:'holding',title:a.followDecision==='pending'?context.phase==='epilogue'?'原融资只保留不新增投入的选择。':'愿不愿再留一笔钱，参与这次融资？':'这份权利已经持有，生活仍可继续。',line:a.followDecision==='pending'?'本轮最迟'+a.followDeadline+'决定；不跟投或逾期默认不付款，原股份按实际新增资本稀释。':'锁定和原权利仍在；持有本身不要求清空记录，也不等于有买方或可花现金。',originDate:a.signedAt,resultDate:a.followDecision&&a.followDecision!=='pending'?a.followAt:a.signedAt,outcome:a.followDecision==='pending'?'pending':'actual',decisionOpen:a.followDecision==='pending',action:choice(a.followDecision==='pending'?'follow':'holding',a.followDecision==='pending'?context.phase==='epilogue'?'核对原融资，明确不新增付款':'比较本轮投入和明确不跟投':'看看本协议的权利、锁定与原选择'),facts:[holding,`原锁定至${a.lockUntil}；${a.board?'一席董事，无单方控制':'无董事权'}，${a.preemptive?'原条款有跟投权':'原条款无跟投权'}。`]})
  if(r.governance){const g=r.governance,policy=equityGovernancePolicy(g.policy),effective=g.resolvedAt!==null&&g.policy==='commercial_scope'?equityGovernanceEffectiveDate(g.resolvedAt):null
   if(!policy||g.resolvedAt!==null&&g.policy==='commercial_scope'&&effective===null)return build({phase:'governance-unknown',paper:'stopped',title:'先核对原会议的性质和日期。',line:'这份提案的政策或生效日期仍待核对，不能按另一种政策显示结果。',purpose:'找回这次会议的原记录，保留原持股和费用。',finishWhen:'核对原记录，不补表决或猜生效日。',originDate:g.createdAt,action:choice('record','翻阅同一份会议原记录'),facts:[holding]})
   const pending=task('governance','governance','有限提案，尚未实际表决。','等这次原会议实际回应',g.createdAt);if(pending)return {...pending,line:'本次'+policy.label+'；'+pending.line}
   const stopped=g.resolvedAt===null,approved=g.approved===true,restriction=g.policy==='commercial_scope'&&effective!==null?(context.date<effective?'用途与接手方限制已通过，自'+effective+'起影响新的退出申请；旧报价不追改。':'用途与接手方限制已生效；自'+effective+'起的新退出申请按原范围核对，旧报价不追改。'):''
   return build({phase:stopped?'governance-stopped':'governance-result',paper:stopped?'stopped':'governance',title:stopped?'这次会议还没有留下表决结果。':approved?'有限提案已经按原范围通过。':'原董事会没有通过这份提案。',line:stopped?'原股份和已发生成本保留，不能把未完成会议画成通过。':approved?g.policy==='independent_audit'?'本局已发生的资本用途核对已开放；没有取得单方研发控制。':restriction:'原股份及会议成本保留；少数席位不能替对手作决定。',purpose:stopped?'这次会议已经停下，保留原持股和实际已花费用。':approved?g.policy==='independent_audit'?'本局已经发生的资本用途核对已经开放；本次提案不再等待表决。':restriction:'这次提案未获通过；原持股与会议成本仍保留。',finishWhen:stopped?'本次没有表决结果；收好原记录，再决定自己的生活。':approved?'本次已经结束；回原协议或今天，不自动新增提案或投入。':'本次已经结束，不必再等本次表决；回原协议或今天保留原费用。',originDate:g.createdAt,resultDate:g.resolvedAt,outcome:approved?'actual':'non-success',action:today(),facts:['本次提案：'+policy.label+'。',holding]})
  }
  if(r.exit){const e=r.exit,pending=task('exit','letter','先问清，是否真有人愿意接手。','等本次原买方调查实际回应',e.createdAt);if(pending)return pending
   if(e.receivable){const credit=e.receivable,closed=credit.remainingFen===0,zero=credit.amountFen===0
    const cash=equityExitCash(e,a.accountId,context),uncertain=!cash.complete,resultDate=zero&&cash.complete?commandDate('AcceptEquityExit','exitId',e.id,e.operationId):cash.complete?cash.lastVerifiedDate:null
    const sourceFacts=uncertain?[`原款记录已记收${moneyText(e.collectedFen)}；${cash.verifiedFen!==null?'其中已核现金'+moneyText(cash.verifiedFen)+'；':''}其余现金或原命令来源仍待核对，不按零补齐，也不反推收齐日期。`]:[]
    if(closed&&uncertain)return build({phase:'collection-source-unknown',paper:'kept',title:'原款记录已收齐，现金来源还要核对。',line:'原款金额与已知持股仍保留；现金来源仍待核对，不能先当成实际银行收款回执。',purpose:'核对本笔原收取来源，保留原款记录与已经核实的现金。',finishWhen:'核对不重记收益或收取第二遍；也可先回今天，原记录继续保留。',originDate:e.createdAt,action:choice('record','核对这笔原款的现金来源'),facts:[...sourceFacts,`原净应收${moneyText(credit.amountFen)} / 原款已记${moneyText(e.collectedFen)} / 原记录未收${moneyText(credit.remainingFen)} / 原到期${credit.dueAt}。`,holding]})
    const partial=e.collectedFen>0,due=credit.dueAt<=context.date
    return build({phase:closed?zero?'transfer-no-credit':'collected':uncertain?'collection-source-partial':due?'collection':'receivable',paper:closed?zero?'kept':'receipt':'receivable',title:closed?zero?'这次转让没有形成净应收款。':'本笔原款已经收齐，下一段日子怎么安排？':partial?'这笔原款收过一部分，余款仍保留。':due?'这笔原转让款，已经到约定日期。':'股份已转让，原款还在路上。',line:uncertain?'原款收取记录与现金来源分别核对，未收余款仍按自己的原日期和原允许动作继续。':zero?'未发生现金收款；剩余股份和原投资记录保留。':closed?'实际银行现金已收到，收款不重复确认投资收益；余股和原成本仍在。':partial?'已经核实的收款不再收第二遍；原未收余款继续，也可以先过自己的生活。':'原费用已在转让中单列，应收还不能花；可先过自己的生活，原款不会消失。',purpose:closed?zero?'本次转让已经结束，没有新增净款要等；保留余股和原费用。':'本笔实际现金已经核齐，保留余股和原成本，再安排自己的生活。':due?'明确本次要收的原款金额，或先保留余款过自己的生活。':'沿本笔原到期日等待；应收不能当成今天的可花现金。',finishWhen:closed?'本笔已经结束；回原协议或今天，不重复转让或确认收益。':'原未收余款继续保留，不要求为离开而清空；收款仍独立核对并保存。',originDate:e.createdAt,resultDate,outcome:closed?'actual':'pending',active:!closed,decisionOpen:!closed&&due,action:closed?today():due?choice('collect','核对这笔原款，选择实际收取金额'):{kind:'wait',date:credit.dueAt,label:'等本笔原款到约定日期'},facts:[...sourceFacts,`本笔已转${e.soldShares}股 / 净应收${moneyText(credit.amountFen)} / ${uncertain?'原款记收':'已收'}${moneyText(e.collectedFen)} / 未收${moneyText(credit.remainingFen)} / 原到期${credit.dueAt}。`,holding]})
   }
   const absent=e.buyerWilling===false,expired=e.quoteExpired
   if(absent||expired||e.responseAt===null)return build({phase:absent?'no-buyer':expired?'quote-expired':'exit-stopped',paper:absent||expired?'kept':'stopped',title:absent?'这次没有愿意接手的买方。':expired?'这份原报价已经失效。':'原买方调查尚无可用回应。',line:'本次申请没有实际出售股份；原调查费用与全部未售股份保留，不能按过去峰值套现。',purpose:absent?'这次原买方没有接手；保留全部未售股份与实际调查费用。':expired?'本份报价已经结束，未售股份与原费用继续保留。':'本份调查没有留下可用报价，先保原任务与费用记录。',finishWhen:'本次不再等待已结束的回应；回原协议或今天，新申请仍须另选并按原规则核对。',originDate:e.createdAt,resultDate:absent?e.responseAt:null,outcome:'non-success',action:today(),facts:[absent?'原买方回应 '+e.responseAt+'；本次没有可接受报价。':expired?'本份原报价有效至'+e.expiresAt+'；本次没有实际转出。':'原任务与未完成回应继续保留在同一份原记录。',holding]})
   return build({phase:'quote',paper:'quote',title:'有人愿意接手，也要看清这份有限报价。',line:'报价还不是成交。接受的实际股数由你显选，余股保留；转让后仍要等原款到期。',purpose:'比较这份原报价与继续持有，显选本次真正愿意转出的股数。',finishWhen:'实际转出、原净应收与现金收取分别发生；未售股份仍保留。',originDate:e.createdAt,resultDate:e.responseAt,outcome:'actual',decisionOpen:true,action:choice('exit-accept','选择实际股数，核对这份原转让'),facts:[`原每股${moneyText(e.unitPriceFen)} / 最多${e.shares}股 / 有效至${e.expiresAt}；总价、本次累计取整费用和净应收在原确认分列。`,holding]})
  }
 }
 return build({phase:'unknown',paper:'stopped',title:'先核对原来这一份的阶段。',line:'当前公开记录还不足以组织下一步；没有换成另一份协议或报价。',action:choice('record','翻阅这一份原记录')})
}
