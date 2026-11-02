import type {GamePanelProps} from './game-types.ts'
import type {EquityJourney} from './equity-journey.ts'
import {equityBrokerFee} from './equity-costs.ts'
import {moneyText} from './game-text.ts'
import {resolveEquitySceneTarget} from './equity-scene-target.ts'
import {equitySceneContext} from './equity-player-thread.ts'

/** Editorial projection of already public state. Full rules, records and
 * command bindings stay with the existing journey, book and confirmation. */
export function equityStageCopy(p:GamePanelProps,j:EquityJourney){
 const r=j.resolution,i=r.invitation,a=r.agreement,e=r.exit,n=r.negotiation,b=r.business,phase=j.phase
 let action=j.action.kind==='today'?(p.view.phase==='epilogue'?'回到尾声':'回到生活'):j.action.kind==='wait'?(j.phase.startsWith('preparation')?'等准备完成':j.phase.startsWith('governance')?'等会议结果':j.phase.startsWith('exit')?'等买方回信':j.phase==='receivable'?'等款项到期':'等调查回信'):j.action.kind==='command'?(j.action.command==='RejectEquityInvitation'?'拒绝这封邀请':'看看这段可能'):({actors:'选择出资主体',business:'看看接下来的选择',objects:'选一份记录',prepare:'安排这次准备',relationship:'安排关系准备',eligibility:'准备参与资格',discover:'听一次介绍',fund:'留一笔自有钱',job:'看看这次安排',invitation:'调查，还是拒绝？',negotiate:'比较参与条件',terms:'签署，还是放下？',holding:'看看持股与去向',follow:'追加，还是留住现金？',governance:'看看会议权利','exit-request':'问问有没有买方','exit-accept':'决定转出多少',collect:'收回这笔款',record:'核对这份记录',next:'看看收尾选择'}[j.action.intent])
 if(j.action.kind==='wait'&&r.job?.status==='planned'&&r.job.startAt>p.view.date)action='等开工'
 if(phase==='follow-without-holding')action='核对旧融资'
 if(phase==='terms-rejected')action='看看这次回应'
 if(phase==='terms-tail')action='收好旧条款'
 if(phase==='disposed')action='看看转让款'
 if(phase==='business-active')action='看看安排与选择'
 const copy:Record<string,[string,string]>={
  boundary:['留一个不同的可能？','这是一段明确架空的融资经历。'],entry:['这次，用谁的钱参与？','先选自己的准备，或已有企业。'],'tail-entry':['还有哪些旧事想收好？','从一份持股或旧款继续。'],
  invitation:['一封还没查清的介绍','先核实来历，也可以把它收好。'],'diligence-stopped':['调查停下了','没有报告；重新调查要另留时间。'],'diligence-completed':['调查回信了','授权与有条件意愿已核实，下一步由你决定。'],'diligence-rejected':[i?.authority===false?'授权没能核实':'对方暂不愿融资',i?.authority===false?'这次调查已经结束。':'授权已核实，融资意愿未能确认。'],
  'invitation-closed':[i?.status==='used'?'介绍已经成了协议':i?.status==='declined'?'这封邀请收好了':'这封邀请到期了','已花的费用留在手记里。'],'invitation-closed-with-task':['邀请结束，调查还在','原调查仍按日历进行，可另行中断。'],'tail-invitation':['把这封旧介绍收好','可翻报告，或明确拒绝。'],
  'preparation-completed':['这次准备完成了','下一次投入，仍由你选择。'],'preparation-stopped':[r.job?.status==='cancelled'?'这份安排取消了':'这份准备停下了',r.job?.status==='cancelled'?'还没开工，预留已经解除。':'已经投入的费用与行动不会退回。'],
  'terms-accepted':['对方答应了这些条件','真正付出本金，还是把这次谈判放下？'],'terms-rejected':['这次条件没谈妥','谈判已经结束，也可以先过自己的日子。'],'terms-closed':[n?.closedKind==='signed'?'协议已签，生活继续':'这份条款放下了','过去的投入和记录都在手记里。'],'terms-expired':['这份条件过期了','没有自动签署或付款。'],'terms-invitation-closed':['介绍已经失效','谈判回应仍在，这次不能再签署。'],'negotiation-stopped':['谈判停下了','没有接受回应，也没有取得股份。'],'terms-tail':['把旧条款收好','尾声只处理已有的事。'],
  holding:['这份持股，可以慢慢留着','下一笔投入，或下一段生活，由你决定。'],follow:['这轮融资，你想怎样选？','可以追加，也可以把现金留给生活。'],'follow-without-holding':['股份已转出，旧事还在','本轮只核对不新增付款的选择。'],disposed:['这份股份已经转出','各笔转让款仍要分别收取。'],
  'governance-result':[r.governance?.approved?'提案通过了':'提案没获通过',r.governance?.approved?r.governance.policy==='commercial_scope'?'用途限制按约定日期生效。':'这次资本用途报告已经开放。':'会议已经结束，股份和已花费用仍在。'],'governance-stopped':['会议停下了','没有表决结果。'],
  quote:['有人愿意接手','报价有限，转不转、转多少，由你决定。'],receivable:['股份转出，款还没到','按这笔约定日期再收款。'],collection:['这笔款到日子了','收回一部分，或先留着，都可以。'],collected:['这笔款收齐了','余股还在，接下来想怎样生活？'],'transfer-no-credit':['这次没有净款要等','股份与费用按实际转让记录保留。'],'no-buyer':['这次没人接手','未售股份还在，不必再等这次回信。'],'quote-expired':['这份报价过期了','股份没有出售。'],'exit-stopped':['买方调查停下了','没有可接受的报价。'],
  business:['先看看这次准备','下一步，还可以继续准备或先过生活。'],'business-active':['原来的安排，还在日历上','原安排照常继续，新投入另作决定。'],'business-winding-down':['这段准备，已经收尾','持股和旧款各自保留。'],'business-closed':['这份分账合上了','接下来，回到自己的日子。'],
 }
 let [heading,line]=copy[phase]??[j.title,j.line]
 if(phase==='business'&&p.view.phase==='epilogue'){heading='把这份旧事收好';line='持股、款项和原任务，分别核对。';action='看看原来的事项'}
 if(['preparation-planned','diligence-planned','negotiation-planned','governance-planned','exit-planned'].includes(phase)){heading='日子留好了，等开工';line='现在还没开始。'}
 if(['preparation-running','diligence-running','negotiation-running','governance-running','exit-running'].includes(phase)){heading=phase==='diligence-running'?'正在查这封介绍':phase==='governance-running'?'这次会议还在进行':'事情正在一步步往前走';line='到约定日，再看这一次的结果。'}
 const facts:string[]=[],costs=j.directCosts,fee=i&&b?equityBrokerFee(i,b.accountId,p.features.workbench.finance,p.view.date):null,paid:string[]=[]
 if(costs?.paidFen!==null&&costs?.paidFen!==undefined&&costs.paidFen>0)paid.push('已付准备费'+moneyText(costs.paidFen))
 if(fee?.paidFen!==null&&fee?.paidFen!==undefined&&fee.paidFen>0)paid.push('已付中间费'+moneyText(fee.paidFen))
 if(paid.length)facts.push(paid.join(' · '))
 if(costs?.reservedFen!==null&&costs?.reservedFen!==undefined&&costs.reservedFen>0)facts.push('准备费预留'+moneyText(costs.reservedFen))
 if(b&&b.funds.prepaidLiabilityFen>0)facts.push('客户预款保护'+moneyText(b.funds.prepaidLiabilityFen))
 if(i&&r.target?.kind==='invitation'&&i.status==='open')facts.push('邀请有效至 '+i.expiresAt)
 if(n&&r.target?.kind==='negotiation')facts.push((n.closedAt!==null||n.expired?'当时报价':'拟投入本金')+moneyText(n.amountFen)+' · '+(n.closedAt!==null||n.expired?'拟':'')+n.shares+'股'+(n.closedAt===null&&!n.expired?' · 条件至'+n.expiresAt:''))
 if(a)facts.push('仍持'+a.shares+'股 · 约'+(a.holdingBps/100).toFixed(2)+'% · 尚持成本'+moneyText(a.asset?.bookCostFen)+(a.shares>0?' · '+(a.locked?'锁定至':'原锁定至')+a.lockUntil:''))
 if(e?.receivable)facts.push('已收'+moneyText(e.collectedFen)+' · 待收'+moneyText(e.receivable.remainingFen)+' · '+e.receivable.dueAt+'到期')
 else if(e?.buyerWilling===true&&!e.quoteExpired)facts.push('每股'+moneyText(e.unitPriceFen)+' · 最多'+e.shares+'股 · 报价至'+e.expiresAt)
 if(b&&r.target?.kind==='business'&&p.features.deepseek){
  const v=p.features.deepseek,c=equitySceneContext(p,b.accountId),base={runId:p.view.runId,accountId:b.accountId,businessId:b.id},holdings:NonNullable<typeof r.agreement>[]=[],credits:NonNullable<NonNullable<typeof r.exit>['receivable']>[]=[],unknown={holding:false,credit:false}
  for(const row of v.agreements.filter(a=>a.businessId===b.id)){const found=resolveEquitySceneTarget(v,{...base,kind:'agreement',recordId:row.id},c);if(found.status!=='valid'||!found.agreement)unknown.holding=true;else if(found.agreement.shares>0)holdings.push(found.agreement)}
  for(const row of v.exits.filter(e=>e.businessId===b.id&&(e.receivableId!==null||e.operationId!==null||e.soldShares>0))){const found=resolveEquitySceneTarget(v,{...base,kind:'exit',recordId:row.id},c);if(found.status!=='valid'||!found.exit?.receivable)unknown.credit=true;else if(found.exit.receivable.remainingFen>0)credits.push(found.exit.receivable)}
  const sum=(values:readonly number[])=>{const total=values.reduce((n,value)=>n+value,0);return values.every(Number.isSafeInteger)&&Number.isSafeInteger(total)&&total>=0?total:null}
  if(holdings.length)facts.push('仍持'+(sum(holdings.map(a=>a.shares))??'待核')+'股 · 尚持成本'+moneyText(sum(holdings.map(a=>a.asset!.bookCostFen))))
  if(credits.length)facts.push('待收'+moneyText(sum(credits.map(c=>c.remainingFen)))+' · 最早'+credits.map(c=>c.dueAt).sort()[0]+'到期')
  if(unknown.holding)facts.push('另有持股来源待核，已核部分仍在。')
  if(unknown.credit)facts.push('另有款项来源待核，已核部分仍在。')
 }
 // Unknown provenance and real obligations are exceptions to the prose budget.
 if(costs?.reason)facts.push(costs.reason)
 if(fee?.reason)facts.push(fee.reason)
 if(r.status!=='valid')return{heading:j.title,line:j.line,action,facts:j.facts}
 if(phase.includes('source-')||phase.includes('unknown'))return{heading,line,action,facts:j.facts}
 return{heading,line,action,facts}
}
