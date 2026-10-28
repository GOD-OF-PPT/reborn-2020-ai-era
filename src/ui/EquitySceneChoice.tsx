import {useEffect,useId,useRef} from 'react'
import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'
import type {EquityChoiceIntent} from './equity-journey.ts'
import {equityFocusFor,equityFocusTargets,equityJourneyFor} from './equity-player-thread.ts'
import {useEquityDraft} from './equity-draft.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ResourceSelect} from './ResourceSelect.tsx'
import {makeSharedAction} from './shared-action.ts'
import {moneyText} from './game-text.ts'
import {parseMoneyInput} from './money-input.ts'
import {equityFollowOffer,equityFollowPosition,equityFollowHalfAmount} from './equity-follow-offer.ts'

type Props={p:GamePanelProps;target:EquitySceneTarget|null;intent:EquityChoiceIntent;sourceInvalid?:boolean;sourceReason?:string|null;onClose:()=>void;onChoose:(target:EquitySceneTarget|null)=>void;onIntent:(intent:EquityChoiceIntent)=>void;onInspect:()=>void;onToday:()=>void}
const titles:Record<EquityChoiceIntent,string>={actors:'这次想法，由谁的自有钱承担？',objects:'想走近哪一份架空安排？',business:'先看看，这份想法的实际条件。',prepare:'给这一次准备，留好日子。',relationship:'为这份关系，留七天自己的时间。',eligibility:'给本局资格，另留一份投入。',discover:'这一次，想听哪一种介绍？',fund:'为这间企业，另留一笔自己的钱。',job:'这份安排，要不要继续等？',invitation:'一封介绍，还需要你的判断。',negotiate:'哪些条件，值得再谈一次？',terms:'条件有了回应，要不要真的承诺？',holding:'持有这份权利，生活仍可继续。',follow:'这一次融资，要不要再投入？',governance:'一席董事，想提出怎样的有限提案？','exit-request':'先问问，有没有愿意接手的人。','exit-accept':'这份报价，愿意实际转出多少？',collect:'这笔原款，这次想收回多少？',record:'翻开同一份权益原册。',next:'收好这一段，再想想接下来的日子。'}
const positiveShares=(value:string)=>/^\d+$/.test(value)&&Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):null

/** All choices stay UI drafts. Every commitment still uses its captured
 * original preview, independent confirmation and atomic save. */
export function EquitySceneChoice({p,target,intent,sourceInvalid=false,sourceReason=null,onClose,onChoose,onIntent,onInspect,onToday}:Props){
 const v=p.features.deepseek,journey=equityJourneyFor(p,equityFocusFor(p,target,p.accountId)),r=journey.resolution,b=r.business,i=r.invitation,n=r.negotiation,a=r.agreement,e=r.exit
 const draft=useEquityDraft(p,target,intent),name=useId(),resource=draft.value('resource'),date=draft.value('date'),assignment={resources:resource?[resource]:[],startAt:date}
 const directPreparation=intent==='relationship'||intent==='eligibility',preparing=intent==='prepare'||directPreparation
 const close=()=>{if(!draft.current())return;draft.retire();onClose()}
 const inspect=()=>{if(!draft.current())return;if(directPreparation)draft.set('preparation',intent);close();onInspect()}
 const choose=(next:EquitySceneTarget|null)=>{if(!draft.current())return;draft.retire();onChoose(next)}
 const changeIntent=(next:EquityChoiceIntent)=>{if(!draft.current())return;draft.retire();onIntent(next)}
 const today=()=>{if(!draft.current())return;close();onToday()}
 const amount=parseMoneyInput(draft.value('amount')),shares=positiveShares(draft.value('shares'))
 const followOffer=a?equityFollowOffer(p,a):null,zeroFollow=followOffer&&a?equityFollowPosition(followOffer,a,0):null,paidFollow=followOffer&&a&&amount!==null?equityFollowPosition(followOffer,a,amount):null
 const followPrincipal=intent==='follow'&&p.view.phase==='playing'&&a?.followDecision==='pending'&&draft.value('followStep')==='principal',followInput=useRef<HTMLInputElement>(null)
 useEffect(()=>{if(followPrincipal)followInput.current?.focus({preventScroll:true})},[followPrincipal,draft.key])
 const hasResource=!!v?.resources.some(row=>row.id===resource),hasAssignment=hasResource&&date!==''
 const commandProps={...p,request:((...args:Parameters<GamePanelProps['request']>)=>{if(!draft.current())return;close();p.request(...args)})}
 const ui=(label:string,line:string,activate:()=>void,key=label)=>{
  const action=makeSharedAction(p,label,activate,{allowReadOnly:true,canActivate:draft.current})
  return <button type="button" className="opening-next-choice" key={key} disabled={action.disabled} onClick={action.activate}><strong>{label}</strong><span>{line}</span>{action.reason?<span className="reason">{action.reason}</span>:null}<i aria-hidden="true">↗</i></button>
 }
 const go=(next:EquityChoiceIntent,label:string,line:string)=>ui(label,line,()=>changeIntent(next))
 const fillFollow=(label:string,value:number)=>{
  const action=makeSharedAction(p,label,()=>draft.set('amount',String(value/100)),{allowReadOnly:true,canActivate:draft.current})
  return <button type="button" className="scene-text-action" disabled={action.disabled} onClick={action.activate}>{label}</button>
 }
 const command=(kind:string,payload:unknown,label:string,ready=true,hint='请先明确填写这次选择。')=><CommandButton {...commandProps} kind={kind} payload={payload} label={label} confirm renderAction={(binding)=><div className="command"><button type="button" disabled={binding.disabled||!ready} onClick={()=>{if(ready&&draft.current())binding.activate()}}>{label}</button>{!ready?<small className="reason">{hint}</small>:binding.reason?<small className="reason">{binding.reason}</small>:null}</div>}/>
 const field=(label:string,key:string,numeric=false)=><label className="field">{label}<input ref={intent==='follow'&&key==='amount'?followInput:undefined} inputMode={numeric?'numeric':'decimal'} value={draft.value(key)} onChange={event=>draft.set(key,event.currentTarget.value)}/></label>
 const resources=<section className="equity-choice-resources"><h3>这一次，实际投入哪些日子与资源？</h3><p>本季可用{p.view.budget.available}点，已为原约定预留{p.view.budget.reserved}点。费用、开工季度的行动与工资维护分别核对；安排不等于已经完成。</p><label className="field">本次实际资源<ResourceSelect options={v?.resources??[]} emptyLabel="先选择本次实际资源" value={resource} onChange={value=>draft.set('resource',value)}/></label>{resource&&!hasResource?<p className="reason">草稿中的原资源已不可用，请明确重新选择。</p>:null}<label className="field">本次开工日期<input type="date" min={p.view.date} max={p.view.phase==='epilogue'?p.view.date:'2025-12-31'} value={date} onChange={event=>draft.set('date',event.currentTarget.value)}/></label>{date&&date<p.view.date?<p className="reason">草稿里的开工日已经过去，确认前请重新核对；没有替你改成今天。</p>:null}</section>
 const businessTarget=b?{runId:p.view.runId,accountId:b.accountId,businessId:b.id,kind:'business' as const}:null
 const agreementTarget=a?{runId:p.view.runId,accountId:a.accountId,businessId:a.businessId,kind:'agreement' as const,recordId:a.id}:null
 const rows=equityFocusTargets(p),actorRows=rows.filter(row=>row.target.kind==='business')
 const original=(row:typeof rows[number])=>{
  const scene=equityJourneyFor(p,equityFocusFor(p,row.target))
  return ui(row.label,(row.target.accountId==='personal'?'个人账户':'原企业账户 · '+row.target.accountId.slice(-6))+' · '+(row.date??'原日期待核')+' · '+scene.title,()=>choose(row.target),JSON.stringify(row.target))
 }
 const holdingFacts=a?<><p>本协议仍持{a.shares}/{a.totalShares}模拟股（约{(a.holdingBps/100).toFixed(2)}%）；尚持有成本{moneyText(a.asset?.bookCostFen)}，账面值{moneyText(a.asset?.valueFen)}不能花。</p><p>锁定至{a.lockUntil}，{a.locked?'当前仍锁定':'锁定期已到，仍需独立买方'}；{a.board?a.shares>0?'一席董事，无单方控制':'原条款有席位，现已无股，不能提交会议':'无董事权'}，{a.preemptive?a.shares>0?'有原跟投权，仍按本轮条件决定':'现已无股，不能新增跟投':'无跟投权'}。原主体不随新的准备切换。</p></>:null
 const invalidSource=sourceInvalid||r.status==='invalid'
 const closing=p.view.phase==='epilogue',newClosingDecision=closing&&['prepare','relationship','eligibility','discover','negotiate','governance'].includes(intent)
 const title=invalidSource?'先找回原来那一份。':newClosingDecision?'常规篇已经结束，只沿原来的事项继续。':closing&&(intent==='actors'||intent==='objects')?'想收好哪一份原权益记录？':closing&&intent==='follow'?'核对原融资与不新增付款的选择。':followPrincipal?(a?.shares===0?'已无现持股，先核对这笔试算。':'这笔本金，留多少给这次融资？'):intent==='holding'&&a?.shares===0?'收好原协议，看看各笔原款。':intent==='follow'&&a?.shares===0?'已无现持股，核对本轮原安排。':intent==='follow'&&a&&a.followDecision!=='pending'?'核对本协议的融资与原条款。':intent==='governance'&&a&&(!a.board||a.shares===0)?'先核对本协议当前的会议权利。':intent==='exit-request'&&a?.locked?'还在原锁定期，先看看这份安排。':intent==='exit-request'&&a&&!a.transferConsent?'先核对这份协议的原转让同意。':intent==='terms'&&n&&journey.phase!=='terms-accepted'?journey.title:intent==='relationship'?'为这份关系，留七天自己的时间。':intent==='eligibility'?'给本局资格，另留一份投入。':titles[intent]
 const contents:ReactNode=<>
  <p className="counterfactual-boundary">本局明确架空安排，不是现实公开申购。技术合作、服务合同、资金或中间费均不产生股份；估值和应收不能花。</p>
  {closing?<p>尾声只处理原来的事项，不再开始新的准备、投资或治理。仍沿用2025年第四季的四点行动，原生活费、工资与维护继续结算。</p>:null}
  {intent==='actors'||intent==='objects'?<>
   {r.reason||sourceReason?<p role="alert">{r.reason??sourceReason}</p>:null}
   {!closing&&!invalidSource&&v?.counterfactualEnabledAt===null?command('EnableCounterfactualEquity',{acknowledge:true},'看清边界后，选择这段架空情境'):null}
   {(intent==='actors'?actorRows:rows).map(original)}
   {!closing&&!invalidSource&&v?.counterfactualEnabledAt!==null?command('OpenEquityDesk',{},'另行建立个人准备分账，不领取资金或股份'):null}
   {closing&&rows.length===0?<p>当前没有留下可选择的原权益记录；可以回尾声，查看其它旧约与回顾。</p>:null}
   {invalidSource?ui('回到没有承诺的新入口','只明确重选阅读方向；原记录与费用保留，不建立分账或发出命令。',()=>choose(null)):null}
   {ui(closing?'合上这一页，回到尾声':'合上这一页，回到今天','查看不付款，也不取得股份。',today)}
  </>:invalidSource||r.status!=='valid'?<><p role="alert">{sourceReason??r.reason??'先明确选择本次准备的主体，原协议和旧费用仍保留。'}</p>{go('actors','明确选择准备主体','没有默认换成另一家企业。')}</>:<>
   <p className="equity-choice-owner">本次原主体：{b!.accountId==='personal'?'个人账户 · 投资准备分账':'企业账户 · '+b!.accountId.slice(-6)}，可花{moneyText(b!.funds.availableFen)}；客户保护款{moneyText(b!.funds.prepaidLiabilityFen)}仍有独立义务。</p>
   {newClosingDecision?<><p>原准备、报告、条款与会议记录仍保留；尾声不能为这次选择新增关系、资格、投资或治理。</p>{go('objects','翻看原任务、持股与款项','明确选择已经留下的那一份，不新增承诺。')}{ui('翻阅完整原册与原拒绝理由','原记录与原规则继续保留。',inspect)}{ui('回到尾声，保留原事项','查看不付款或清掉旧约。',today)}</>:<>
   {intent==='business'?<>
    <p>{b!.related?'已有真实关系准备或已付合作案例。':'尚无可谈判关系，只有资金或技术不够。'}{b!.eligible?'本局参与资格已经完成。':'本局参与资格仍须核对，不授予现实金融资格。'}</p>
    {!closing?go('prepare','看看关系与资格的准备','分别投入自己的资源和日期；完成准备不产生股份。'):null}
    {!closing?go('discover','听听一次新的介绍','明确选合作介绍或未核验的中间人消息。'):null}
    {go('objects','翻看已经留下的邀请与协议','每一份仍按自己的原主体、日期和阶段继续。')}
    {go('next','核对这间分账的去向与收尾','自有资本、暂停和实际收尾分别决定。')}
   </>:null}
   {preparing?<>
    <p>{intent==='relationship'?'这次只准备实际关系：基础预算500元 / 1点 / 7日。关系真正完成后，介绍、调查与参与资格仍分别选择。':intent==='eligibility'?'这次只准备本局参与资格：基础预算1500元 / 1点 / 7日。原实际关系、已核实授权与融资意愿仍由原确认核定；完成不产生股份。':'关系准备：基础预算500元 / 1点 / 7日。参与资格：基础预算1500元 / 1点 / 7日，仍需本主体实际关系和已核实授权/融资意愿的邀请。两者分别安排，不自动连做。'}</p>
    {!directPreparation?<label className="field">这次具体准备哪一项<select value={draft.value('preparation')} onChange={event=>draft.set('preparation',event.currentTarget.value)}><option value="">明确选择这次准备</option><option value="relationship">实际关系准备</option><option value="eligibility">本局参与资格</option></select></label>:null}
    {p.view.budget.available===0?<p>本季已经没有可用行动。可以先收好这份想法；若另选以后开工，仍须核对那个季度的原预算、预留与实际费用，不会恢复本季行动。</p>:null}{resources}
    {draft.value('preparation')==='relationship'?command('StartEquityRelationship',{businessId:b!.id,...assignment},'明确投入，安排这份关系准备',hasAssignment):draft.value('preparation')==='eligibility'?command('StartEquityEligibility',{businessId:b!.id,...assignment},'明确投入，安排这次本局资格',hasAssignment):<p>尚未选准备项目；没有默认替你安排。</p>}
    {rows.filter(row=>row.target.businessId===b!.id&&row.target.kind==='preparation').map(original)}
    {directPreparation?go('business','另看同主体的条件与其它选择','原介绍、两种准备、历史和收尾仍可分别查看。'):null}
   </>:null}
   {intent==='discover'?<>
    <p>寻找介绍本身不付投资本金、不占行动；邀请是否有授权、有融资意愿，需要另行真实调查。新邀请仍受原公开窗口和次数限制。</p><label className="field">本次邀请来源<select value={draft.value('source')} onChange={event=>draft.set('source',event.currentTarget.value)}><option value="">明确选择一个来源</option><option value="referral">已有实际合作或关系的介绍</option><option value="broker">虚构中间人的未核验消息</option></select></label>
    {command('DiscoverEquityInvitation',{businessId:b!.id,source:draft.value('source')},'按所选来源，听这一次介绍',['referral','broker'].includes(draft.value('source')))}
   </>:null}
   {intent==='invitation'&&i?<>
    <p>本封邀请来自{i.source==='referral'?'合作介绍':'未核验的中间人'}，有效至{i.expiresAt}；{i.status==='open'?'当前尚可核对':'已经结束，原费用与任务仍保留'}。</p>
    <p>{i.reportAt===null?'授权与融资意愿都尚未核实。':i.authority&&i.financingConsent?'已核实本局授权与有条件融资意愿，仍需本主体资格、谈判与实际签署。':i.authority===false?'本次没有核实到授权，不能据此获得股份。':'本次没有可确认的融资意愿，不能据此获得股份。'}</p>
    {!closing?<>{resources}{command('InvestigateEquityInvitation',{invitationId:i.id,...assignment},'实际核验本封邀请 · 2000元 / 1点 / 7日',hasAssignment)}</>:null}
    {command('RejectEquityInvitation',{invitationId:i.id},'拒绝这封邀请，不新增费用，原投入保留')}
    {!closing?<details><summary>未核实时的中间服务费风险</summary><p>1000元可能全部损失；不产生股份、资格或融资同意。可以先做调查，也可以直接拒绝。</p>{command('PayUnverifiedBrokerFee',{invitationId:i.id},'承担风险支付1000元中间服务费，仍不获得股份')}</details>:null}
    {i.brokerPaymentId?<p>这封邀请已有实际中间费记录，不能把它当作投资本金。</p>:null}
    {!closing?<>{go('prepare','核对本主体的关系与资格','另选项目、资源和日期，不自动继续。')}{go('negotiate','比较这封邀请的具体条款','原资格、窗口和授权仍由原确认核定。')}</>:null}
   </>:null}
   {intent==='negotiate'&&i?<>
    <p>谈判基础费用500元 / 1点 / 7日，可能被拒绝。拟支付本金仍在你手中；只有另行接受回应、实际付款签署后才持股。</p>
    <label className="field">取得股份的方式<select value={draft.value('acquisition')} onChange={event=>draft.set('acquisition',event.currentTarget.value)}><option value="">明确选择取得方式</option><option value="new_capital">新增资本，向项目融资</option><option value="secondary">已有股份转让，支付原卖方</option></select></label>
    {field('拟支付的投资本金（元）','amount')}
    <p>模拟初始1000000股，每股8元。首轮投前{moneyText(v!.catalog.initialPreMoneyFen)}，总新增资本{moneyText(v!.catalog.firstNewMoneyFen)}；老股不增加项目资本或总股数。</p>
    <fieldset><legend>愿意谈怎样的权利与锁定？</legend>{v!.catalog.terms.map(t=><label className="equity-terms-choice" key={t.id}><input type="radio" name={name} value={t.id} checked={draft.value('terms')===t.id} onChange={()=>draft.set('terms',t.id)}/><span><strong>{t.label} · 最低{moneyText(t.minCapitalFen)} / 锁定{t.lockDays}日</strong><span>{t.board?'一席董事，无单方控制；':'无董事权；'}{t.preemptive?'可另行决定跟投；':'无跟投权；'}{t.transferConsent?'转让须原同意与实际买方。':'不承诺转让同意。'}</span></span></label>)}</fieldset>
    {resources}{command('StartEquityNegotiation',{invitationId:i.id,acquisitionKind:draft.value('acquisition'),termsId:draft.value('terms'),amountFen:amount??-1,...assignment},'明确这些条件，安排七天谈判',hasAssignment&&amount!==null&&amount>0&&['new_capital','secondary'].includes(draft.value('acquisition'))&&v!.catalog.terms.some(t=>t.id===draft.value('terms')))}
   </>:null}
   {intent==='terms'&&n?<>
    <p>{journey.line}</p><p>{n.closedAt!==null||n.expired||i?.status!=='open'?'原条款本金':'拟支付本金'}{moneyText(n.amountFen)} / {n.shares}模拟股 / {v!.catalog.terms.find(t=>t.id===n.termsId)?.label} / 条款有效至{n.expiresAt}；{n.kind==='new_capital'?'新增项目资本':'支付老股卖方，不增加项目资本'}。</p>
    {!closing?command('SignEquityAgreement',{negotiationId:n.id},'核对真实本金，另行支付并签署本协议'):null}
    {command('DeclineEquityTerms',{negotiationId:n.id},'不接受这份条款，原调查与谈判费用保留')}
   </>:null}
   {(intent==='holding'||intent==='governance'||intent==='exit-request')&&a?holdingFacts:null}
   {intent==='holding'&&a?<>
    <p>持有不要求做完所有记录才能离开。新的资金或权利决定由你另选；旧协议、费用与未收款继续保留。</p>
    {go('follow','核对本轮融资与跟投选择',a.followDecision==='pending'?'当前有待决定融资；不跟投也是独立明确选择。':'原融资仍按已经发生的阶段表示，不自动新增投入。')}
    {!closing?go('governance','核对本协议的会议权利','原条款和当前持股分别核对；查看不取得董事席位。'):null}
    {go('exit-request','核对锁定，先询问独立买方','提出申请不出售，仍可能没有买方。')}
    {rows.filter(row=>{const t=row.target;return t.kind==='governance'&&v!.governance.some(g=>g.id===t.recordId&&g.agreementId===a.id)||t.kind==='exit'&&v!.exits.some(e=>e.id===t.recordId&&e.agreementId===a.id)}).map(original)}
    {ui(closing?'收好这份持股，回到尾声':'收好这份持股，回到今天','不自动跟投、转让或清掉旧约。',today)}
   </>:null}
   {intent==='follow'&&a?<>
    <p>{a.followDecision==='pending'?'这轮融资最迟'+a.followDeadline+'决定。原持股'+a.shares+'股，原锁定至'+a.lockUntil+'；不跟投也是一个完整选择。':'当前没有待决定的本轮跟投；已发生结果保留。'}不会自动借款，也不以估值支付。</p>
    {!followPrincipal?<div className="equity-follow-options">
     <section className="equity-follow-option"><h3>把现金留在自己手中</h3><p>本次新增付款0元、股份0股。{zeroFollow?<>仍持{zeroFollow.sharesAfter} / {zeroFollow.totalSharesAfter}模拟股，约{(zeroFollow.holdingBps/100).toFixed(2)}%。</>:null}</p>{command('FollowEquityRound',{agreementId:a.id,amountFen:0},'明确不跟投，不新增付款，接受实际稀释')}</section>
     {!closing?<section className="equity-follow-option"><h3>另留一笔自己的本金</h3>{followOffer?<p>本轮每份{moneyText(followOffer.unitPriceFen)}、对应1模拟股；原整份本金上限{moneyText(followOffer.maxAmountFen)}。</p>:<p>原整份报价尚待核对；原册和当次原确认仍可查看。</p>}{!a.preemptive||a.shares===0?<p className="reason">本协议当前没有可新增付款的跟投权；原记录与原拒绝理由保留。</p>:null}{a.followDecision==='pending'?ui('我想追加一笔本金，先试算','先填写金额再核对；这里不付款。',()=>draft.set('followStep','principal')):go('holding','回看持股和本轮结果','当前没有待决定的跟投；原本金与各笔原款继续保留。')}</section>:null}
    </div>:<section className="equity-follow-principal" aria-label="本轮本金试算">
     {!a.preemptive||a.shares===0?<p className="reason">本协议当前没有可新增付款的跟投权；原持股、原款与记录保留。</p>:null}
      {followOffer?<p>本轮每份{moneyText(followOffer.unitPriceFen)}、对应1模拟股；按原持股份额计算的整份本金上限{moneyText(followOffer.maxAmountFen)}。</p>:<p className="reason">原整份报价尚待核对；原册和当次原确认仍可查看。</p>}
      {field('本次愿意另行投入的本金（元）','amount')}
      <div className="equity-follow-presets">{followOffer&&equityFollowHalfAmount(followOffer)>0?fillFollow('试填约一半份额 · '+moneyText(equityFollowHalfAmount(followOffer)),equityFollowHalfAmount(followOffer)):null}{fillFollow('填入原上限 · '+moneyText(a.followMaxFen),a.followMaxFen)}</div><p className="field-help">试填不付款，实际出资仍须原确认。</p>
      {followOffer&&amount!==null&&amount>0&&amount%followOffer.unitPriceFen!==0?<p className="reason">本轮须按每份{moneyText(followOffer.unitPriceFen)}填写整份本金；当前金额不是整份。</p>:paidFollow&&amount!==null&&amount>0?<p>按原报价试算：新增{paidFollow.newShares}股，合计{paidFollow.sharesAfter} / {paidFollow.totalSharesAfter}，约{(paidFollow.holdingBps/100).toFixed(2)}%；实际资格和付款仍看原确认。</p>:null}
      {command('FollowEquityRound',{agreementId:a.id,amountFen:amount??-1},'核对所填本金，明确付款参与本轮',amount!==null&&amount>0,'先填写大于零的本次本金；空稿不会变成不跟投。')}
      {ui('回到两种选择','保留这份本金草稿，重新比较；仍没有付款。',()=>draft.set('followStep','compare'))}
    </section>}
    <details><summary>翻阅原持股、锁定与权利</summary>{holdingFacts}<p>已发生的费用和原责任不会因本次选择清除；本轮未新增现金收入。到期未选仍按原规则不付款并记录实际稀释。</p></details>
   </>:null}
   {intent==='governance'&&a?<>
    {!a.board||a.shares===0?<p>这份协议当前没有可提出会议的董事权。原条款和已发生会议仍可查看。</p>:null}
    <p>会议基础预算500元 / 1点 / 7日。原董事会可以拒绝；通过用途限制将从实际生效日起影响新的转让申请，旧报价不追改。</p>
    <label className="field">本次有限提案<select value={draft.value('policy')} onChange={event=>draft.set('policy',event.currentTarget.value)}><option value="">明确选择一项提案</option><option value="independent_audit">独立核对本局资本用途</option><option value="commercial_scope">限定研究用途与接手方</option></select></label>{resources}
    {command('ProposeEquityGovernance',{agreementId:a.id,policy:draft.value('policy'),...assignment},'明确提案与投入，安排这次有限会议',hasAssignment&&['independent_audit','commercial_scope'].includes(draft.value('policy')))}
   </>:null}
   {intent==='exit-request'&&a?<>
    {closing&&a.locked?<><p>原锁定至{a.lockUntil}。等候沿原下一日期，仍结算原生活费与旧约，不免费跳到锁定结束。</p>{command('AdvanceTime',{date:a.lockUntil},'等原锁定到期，再核对独立买方')}</>:null}
    <p>买方调查基础预算500元 / 1点 / 7日。锁定结束不保证出售，买方可能拒绝或只给有限折价报价；不能按过去峰值套现。</p>{field('本次拟询问转让的模拟股数','shares',true)}{resources}
    {command('RequestEquityExit',{agreementId:a.id,shares:shares??-1,...assignment},'先核实独立买方，尚不出售股份',hasAssignment&&shares!==null)}
   </>:null}
   {intent==='exit-accept'&&e?<>
    <p>原报价每股{moneyText(e.unitPriceFen)}，最多{e.shares}模拟股，有效至{e.expiresAt}；{e.scopeRestricted?'本次受原用途与接手方限制。':'按本份原报价范围核定。'}报价不是成交。</p>{field('本次实际转让的模拟股数','shares',true)}
    <p>转让费按累计总价的3%取整，原确认分别显示本次总价、费用、净应收和7日后的约定日期。未转的股数保留，转让当下没有实收现金。</p>
    {command('AcceptEquityExit',{exitId:e.id,shares:shares??-1},'核对实际股数与费用，再决定转让',shares!==null)}
   </>:null}
   {intent==='collect'&&e?<>
    <p>本笔已转让{e.soldShares}股，原净应收{moneyText(e.receivable?.amountFen)}，已实际收取{moneyText(e.collectedFen)}，未收{moneyText(e.receivable?.remainingFen)}，原到期{e.dueAt??'待核'}；本次收款不重复确认收益。</p>{field('这一次实际收取的金额（元）','amount')}
    {e.receivable?ui('填入本笔原未收余额 · '+moneyText(e.receivable.remainingFen),'只填写，收款仍按原到期日与确认。',()=>draft.set('amount',String(e.receivable!.remainingFen/100))):null}
    {command('CollectEquityExit',{exitId:e.id,amountFen:amount??-1},'核对本笔原款，实际收取所填金额',amount!==null&&amount>0)}
   </>:null}
   {intent==='job'?<>
    {r.job?<><p>本任务{r.job.startAt}—{r.job.completeAt} · {({planned:'已预留，未开工',running:'实际进行中',completed:'已实际完成',cancelled:'未开工安排已取消',interrupted:'已经中断，原已花成本保留'})[r.job.status]}。中断不退已消耗费用，也不让调查、谈判或买方回应自动完成。</p>{command('InterruptJob',{jobId:r.job.id},'核对原成本与责任，中断这一份任务')}{resources}{command('RescheduleJob',{jobId:r.job.id,...assignment},'核对原允许范围，申请调整本任务日子',hasAssignment)}<p>本路线日程按原规则固定；若原规则不允许改期，仍保留原拒绝理由，不借草稿改日期。</p></>:<p>当前对象没有独立原任务；没有默认取另一项安排。</p>}
   </>:null}
   {intent==='fund'?<>
    <p>转入企业的是个人自有资本，既不是本次投资本金，也不是费用或收入。客户预款不能拿来追加；原维护、工资与旧义务继续结算。</p>{field('另行转入的个人自有资本（元）','amount')}{command('FundBusiness',{businessId:b!.id,amountFen:amount??-1},'核对自有钱，另行追加这笔企业资本',amount!==null&&amount>0)}
   </>:null}
   {intent==='next'?<>
    <p>{journey.line}</p>{journey.facts.map(fact=><p key={fact}>{fact}</p>)}
    {businessTarget?ui('回到同一主体的准备条件','只换阅读位置，不新建邀请或承诺。',()=>choose(businessTarget)):null}
    {agreementTarget?ui('回到这一份原协议','原持股、锁定、融资和未售部分保留。',()=>choose(agreementTarget)):null}
    {b!.company?go('fund','另核一笔企业自有资本','不把客户保护款或账面估值当钱。'):null}
    {command('WindDownBusiness',{businessId:b!.id},'核对原任务与旧义务，停止这份准备并进入收尾')}
    {command('CloseBusiness',{businessId:b!.id},'核对资产和原义务，关闭这份分账')}
    {ui(closing?'收好原记录，回到尾声':'收好原记录，回到今天','原持股、应收、成本和未完约定仍在。',today)}
   </>:null}
   {intent==='record'?<><p>{journey.line}</p>{journey.facts.map(fact=><p key={fact}>{fact}</p>)}{r.governance?<p>本次提案{r.governance.resolvedAt===null?'尚无实际表决结果':r.governance.approved?'已经有限通过':'原董事会未通过'}，{r.governance.policy==='independent_audit'?'独立资本用途核对':'用途与接手方限制'}；不取得单方控制。</p>:null}{v?.auditedProjectReport?<p>已开放的本局资本用途核对（截至{v.auditedProjectReport.asOf}）：新增资本{moneyText(v.auditedProjectReport.newCapitalFen)}，老股卖方收款{moneyText(v.auditedProjectReport.secondaryPaymentFen)}，总模拟股数{v.auditedProjectReport.sharesOutstanding}；{v.auditedProjectReport.scope}。</p>:null}{ui('翻开完整原册与账目','同一主体和同一记录；只读查看。',inspect)}</>:null}
   {r.job&&intent!=='job'?go('job','核对本项原安排与中断选择','按原任务身份保留日期、已花费用和原拒绝理由。'):null}
   {intent!=='record'?ui('翻阅同一份权益原册','完整条款、报告、旧费用与历史仍可查看。',inspect):null}
   </>}
  </>}
 </>
 return <Dialog title={title} className="equity-scene-choice scene-choice-dialog" onClose={close}>{contents}</Dialog>
}
