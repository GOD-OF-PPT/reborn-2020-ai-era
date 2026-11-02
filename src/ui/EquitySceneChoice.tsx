import {useEffect,useId,useRef} from 'react'
import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'
import type {EquityChoiceIntent} from './equity-journey.ts'
import {equityFocusFor,equityFocusTargets,equityJourneyFor,equitySceneContext} from './equity-player-thread.ts'
import {useEquityDraft} from './equity-draft.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ResourceSelect} from './ResourceSelect.tsx'
import {equityFollowHistory} from './equity-follow-history.ts'
import {makeSharedAction} from './shared-action.ts'
import {moneyText} from './game-text.ts'
import {parseMoneyInput} from './money-input.ts'
import {equityFollowOffer,equityFollowPosition,equityFollowHalfAmount,equityPaidFollowPrerequisites} from './equity-follow-offer.ts'
import {EQUITY_GOVERNANCE_POLICIES,equityGovernancePolicy} from './equity-governance-ui.ts'
import {DEEPSEEK_JOBS} from '../content/deepseek.ts'
import {equityExitCash} from './equity-exit-cash.ts'
import {equityBusinessContinuity} from './equity-business-continuity.ts'
import {EquityBusinessContinuity} from './EquityBusinessContinuity.tsx'
import {equityInvitationState,equityInvitationText} from './equity-invitation-ui.ts'
import {equityStageCopy} from './equity-stage-copy.ts'
import {equityDirectCosts} from './equity-costs.ts'
import {equityResourceOptions} from './equity-resource-options.ts'

type Props={p:GamePanelProps;target:EquitySceneTarget|null;intent:EquityChoiceIntent;sourceInvalid?:boolean;sourceReason?:string|null;onClose:()=>void;onChoose:(target:EquitySceneTarget|null)=>void;onIntent:(intent:EquityChoiceIntent)=>void;onInspect:()=>void;onToday:()=>void}
const titles:Record<EquityChoiceIntent,string>={actors:'这次想法，由谁的自有钱承担？',objects:'想走近哪一份架空安排？',business:'先看看，这份想法的实际条件。',prepare:'给这一次准备，留好日子。',relationship:'为这份关系，留七天自己的时间。',eligibility:'给本局资格，另留一份投入。',discover:'这一次，想听哪一种介绍？',fund:'为这间企业，另留一笔自己的钱。',job:'这份安排，要不要继续等？',invitation:'一封介绍，还需要你的判断。',negotiate:'哪些条件，值得再谈一次？',terms:'条件有了回应，要不要真的承诺？',holding:'持有这份权利，生活仍可继续。',follow:'这一次融资，要不要再投入？',governance:'一席董事，想提出怎样的有限提案？','exit-request':'先问问，有没有愿意接手的人。','exit-accept':'这份报价，愿意实际转出多少？',collect:'这笔原款，这次想收回多少？',record:'翻开同一份权益原册。',next:'收好这一段，再想想接下来的日子。'}
const positiveShares=(value:string)=>/^\d+$/.test(value)&&Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):null

/** All choices stay UI drafts. Every commitment still uses its captured
 * original preview, independent confirmation and atomic save. */
export function EquitySceneChoice({p,target,intent,sourceInvalid=false,sourceReason=null,onClose,onChoose,onIntent,onInspect,onToday}:Props){
 const v=p.features.deepseek,journey=equityJourneyFor(p,equityFocusFor(p,target,p.accountId)),r=journey.resolution,b=r.business,i=r.invitation,n=r.negotiation,a=r.agreement,e=r.exit
 // Public prerequisites only organize this near view. Original previews still
 // decide every command, including the unchanged full-book controls.
 const governancePrerequisites=a!==null&&a.board&&a.shares>0,exitPrerequisites=a!==null&&a.shares>0&&!a.locked&&a.transferConsent
 const draft=useEquityDraft(p,target,intent),name=useId(),resource=draft.value('resource'),date=draft.value('date'),assignment={resources:resource?[resource]:[],startAt:date}
 const directPreparation=intent==='relationship'||intent==='eligibility',preparing=intent==='prepare'||directPreparation
 const resourceJobId=preparing?'deepseek-'+(directPreparation?intent:draft.value('preparation')):({invitation:'deepseek-diligence',negotiate:'deepseek-negotiation',governance:'deepseek-governance','exit-request':'deepseek-exit'} as Partial<Record<EquityChoiceIntent,string>>)[intent]
 const resourceJob=DEEPSEEK_JOBS.find(job=>job.id===resourceJobId)
 const close=()=>{if(!draft.current())return;draft.retire();onClose()}
 const inspect=()=>{if(!draft.current())return;if(directPreparation)draft.set('preparation',intent);close();onInspect()}
 const choose=(next:EquitySceneTarget|null)=>{if(!draft.current())return;draft.retire();onChoose(next)}
 const changeIntent=(next:EquityChoiceIntent)=>{if(!draft.current())return;draft.retire();onIntent(next)}
 const today=()=>{if(!draft.current())return;close();onToday()}
 const amount=parseMoneyInput(draft.value('amount')),shares=positiveShares(draft.value('shares'))
 const exitCash=e&&a?equityExitCash(e,a.accountId,equitySceneContext(p,p.accountId)):null
 const continuity=(intent==='next'||intent==='business')&&b?equityBusinessContinuity(p,b.id):null
 const jobCost=intent==='job'&&r.job&&b?equityDirectCosts(b.id,b.accountId,p.view.operations?.jobs,p.features.workbench.finance,p.view.date).jobs.find(row=>row.id===r.job!.id):undefined
 const followOffer=a?equityFollowOffer(p,a):null,zeroFollow=followOffer&&a?equityFollowPosition(followOffer,a,0):null,paidFollow=followOffer&&a&&amount!==null?equityFollowPosition(followOffer,a,amount):null
 const followHistory=a?equityFollowHistory(p,a):null,followPending=a?.followDecision==='pending'
 const followPaidPrerequisites=a!==null&&equityPaidFollowPrerequisites(a)
 const followPrincipal=intent==='follow'&&p.view.phase==='playing'&&followPending&&followPaidPrerequisites&&draft.value('followStep')==='principal',followInput=useRef<HTMLInputElement>(null)
 useEffect(()=>{if(followPrincipal)followInput.current?.focus({preventScroll:true})},[followPrincipal,draft.key])
 const governancePolicy=equityGovernancePolicy(draft.value('policy')),governanceArranging=intent==='governance'&&governancePolicy!==null&&draft.value('governanceStep')==='arrange',governanceFields=useRef<HTMLDivElement>(null),governanceJob=DEEPSEEK_JOBS.find(j=>j.id==='deepseek-governance')
 useEffect(()=>{if(intent!=='governance')return;const region=governanceFields.current,target=governanceArranging?region?.querySelector<HTMLInputElement>('input[type=radio]:checked')??region?.querySelector<HTMLInputElement>('input[type=radio]'):region?.querySelector<HTMLButtonElement>('[data-selected=true] button')??region?.querySelector('button');target?.focus({preventScroll:true})},[intent,governanceArranging,governancePolicy?.id,draft.key])
 const invitationState=equityInvitationState(r),invitationCanArrange=i?.status==='open'&&i.reportAt===null&&!(r.job&&['planned','running'].includes(r.job.status)),invitationArranging=intent==='invitation'&&invitationCanArrange&&draft.value('invitationStep')==='arrange',invitationFields=useRef<HTMLDivElement>(null)
 useEffect(()=>{if(intent!=='invitation')return;const region=invitationFields.current,focus=invitationArranging?region?.querySelector<HTMLInputElement>('input[type=radio]:checked')??region?.querySelector<HTMLInputElement>('input[type=radio]'):region?.querySelector('button');focus?.focus({preventScroll:true})},[intent,invitationArranging,draft.key])
 const hasResource=!!v?.resources.some(row=>row.id===resource),hasAssignment=hasResource&&date!==''
 const commandProps={...p,request:((...args:Parameters<GamePanelProps['request']>)=>{if(!draft.current())return;close();p.request(...args)})}
 const ui=(label:string,line:string,activate:()=>void,key=label)=>{
  const action=makeSharedAction(p,label,activate,{allowReadOnly:true,canActivate:draft.current})
  return <button type="button" className="opening-next-choice" key={key} data-reading={key!==label||undefined} disabled={action.disabled} onClick={action.activate}><strong>{label}</strong>{line?<span>{line}</span>:null}{action.reason?<span className="reason">{action.reason}</span>:null}<i aria-hidden="true">↗</i></button>
 }
 const go=(next:EquityChoiceIntent,label:string,line:string)=>ui(label,line,()=>changeIntent(next))
 const activeJob=r.job&&['planned','running'].includes(r.job.status),quietJobLink=r.job&&!activeJob&&intent!=='job'?go('job','翻阅本次安排记录',''):null
 const fillFollow=(label:string,value:number)=>{
  const action=makeSharedAction(p,label,()=>draft.set('amount',String(value/100)),{allowReadOnly:true,canActivate:draft.current})
  return <button type="button" className="scene-text-action" disabled={action.disabled} onClick={action.activate}>{label}</button>
 }
 const fillAssignmentToday=()=>{
  const action=makeSharedAction(p,'填入今天 · '+p.view.date,()=>draft.set('date',p.view.date),{allowReadOnly:true,canActivate:draft.current})
  return <button type="button" className="scene-text-action" disabled={action.disabled} onClick={action.activate}>{action.label}</button>
 }
 const command=(kind:string,payload:unknown,label:string,ready=true,hint='请先明确填写这次选择。')=><CommandButton {...commandProps} kind={kind} payload={payload} label={label} confirm renderAction={(binding)=><div className="command"><button type="button" disabled={binding.disabled||!ready} onClick={()=>{if(ready&&draft.current())binding.activate()}}>{label}</button>{!ready?<small className="reason">{hint}</small>:binding.reason?<small className="reason">{binding.reason}</small>:null}</div>}/>
 const field=(label:string,key:string,numeric=false)=><label className="field">{label}<input ref={intent==='follow'&&key==='amount'?followInput:undefined} inputMode={numeric?'numeric':'decimal'} value={draft.value(key)} onChange={event=>draft.set(key,event.currentTarget.value)}/></label>
 const resources=<section className="equity-choice-resources" aria-label="这一次，实际投入哪些日子与资源？"><p>{resourceJob?<><strong>{b?.accountId==='personal'?'个人':'企业'}预算{moneyText(resourceJob.costFen)} · {resourceJob.actionPoints}点 · {resourceJob.durationDays}天</strong><br/></>:null}本季可用{p.view.budget.available}点 · 另有预留{p.view.budget.reserved}点{resourceJob?' · 工资维护另计':''}</p><div className="equity-assignment-people"><span>谁来做</span><ResourceSelect appearance="people" name={name+'-people'} ariaLabel="谁来做 · 本次实际资源" options={equityResourceOptions(v?.resources??[],p.view.operations?.workers)} emptyLabel="先选人手" value={resource} onChange={value=>draft.set('resource',value)}/></div><div className="equity-assignment-date"><label className="field">本次开工日期<input type="date" min={p.view.date} max={p.view.phase==='epilogue'?p.view.date:'2025-12-31'} value={date} onChange={event=>draft.set('date',event.currentTarget.value)}/></label>{fillAssignmentToday()}</div>{resource&&!hasResource||date&&date<p.view.date?<p className="reason">{resource&&!hasResource?'草稿中的原资源已不可用，请明确重新选择。':''}{date&&date<p.view.date?'草稿里的开工日已经过去，确认前请重新核对；没有替你改成今天。':''}</p>:null}</section>
 const businessTarget=b?{runId:p.view.runId,accountId:b.accountId,businessId:b.id,kind:'business' as const}:null
 const agreementTarget=a?{runId:p.view.runId,accountId:a.accountId,businessId:a.businessId,kind:'agreement' as const,recordId:a.id}:null
 const rows=equityFocusTargets(p),actorRows=rows.filter(row=>row.target.kind==='business')
 const original=(row:typeof rows[number])=>{
  const scene=equityJourneyFor(p,equityFocusFor(p,row.target)),n=scene.resolution.negotiation,a=scene.resolution.agreement,e=scene.resolution.exit
  const identity=row.target.kind==='negotiation'&&n?' · 报价'+moneyText(n.amountFen)+' · '+(v?.catalog.terms.find(t=>t.id===n.termsId)?.label??'条款待核'):row.target.kind==='agreement'&&a?' · 现持'+a.shares+'股':row.target.kind==='exit'&&e?' · 原询'+e.shares+'股':''
  return ui(row.label,(row.target.accountId==='personal'?'个人账户':'企业账户 · '+row.target.accountId.slice(-6))+' · '+(row.date??'原日期待核')+' · '+equityStageCopy(p,scene).heading+identity,()=>choose(row.target),JSON.stringify(row.target))
 }
 const holdingFacts=a?<><p>本协议仍持{a.shares}/{a.totalShares}模拟股（约{(a.holdingBps/100).toFixed(2)}%）；尚持有成本{moneyText(a.asset?.bookCostFen)}，账面值{moneyText(a.asset?.valueFen)}不能花。</p><p>锁定至{a.lockUntil}，{a.locked?'当前仍锁定':'锁定期已到，仍需独立买方'}；{a.board?a.shares>0?'一席董事，无单方控制':'原条款有席位，现已无股，不能提交会议':'无董事权'}，{a.preemptive?a.shares>0?'有原跟投权，仍按本轮条件决定':'现已无股，不能新增跟投':'无跟投权'}。原主体不随新的准备切换。</p></>:null
 const invalidSource=sourceInvalid||r.status==='invalid'
 const closing=p.view.phase==='epilogue',newClosingDecision=closing&&['prepare','relationship','eligibility','discover','negotiate','governance'].includes(intent)
 const termsCurrent=!!n&&n.respondedAt!==null&&n.closedAt===null&&!n.expired,termsSign=!closing&&journey.phase==='terms-accepted'
 const followHistoryTitle=followHistory?.state==='participated'?'这轮投入，已经留下记录。':followHistory?.state==='declined'?'这轮，你把现金留住了。':followHistory?.state==='defaulted'?'这轮期限已过，没有追加。':followHistory?.state==='before'?'这轮融资还没有开放。':'先核对这轮原记录。'
 const governanceTitle=intent==='governance'&&a?(!a.board||a.shares===0?governanceArranging?'当前没有会议权利，只核对原安排。':'先核对本协议当前的会议权利。':governanceArranging&&governancePolicy?'为「'+governancePolicy.label+'」留好会议日子。':titles.governance):null
 const invitationTitle=intent==='invitation'?(invitationArranging?'为调查留几天。':i?.reportAt!==null&&i?.reportAt!==undefined?'回信到了，怎么选？':'查清楚，还是放下？'):null
 const jobTitle=intent==='job'&&r.job?({planned:'这份安排还没开工，要不要保留？',running:'已经投入的时间，要继续吗？',completed:'这次安排已经完成。',cancelled:'这次安排已经取消。',interrupted:'这次安排已经中断。'})[r.job.status]:null
 const title=invalidSource?'先找回原来那一份。':newClosingDecision?'常规篇已经结束，只沿原来的事项继续。':closing&&(intent==='actors'||intent==='objects')?'想收好哪一份原权益记录？':closing&&intent==='follow'?'核对原融资与不新增付款的选择。':followPrincipal?'这笔本金，留多少给这次融资？':intent==='holding'&&a?.shares===0?'收好原协议，看看各笔原款。':intent==='follow'&&a?.shares===0?'已无现持股，核对本轮原安排。':intent==='follow'&&a&&!followPending?followHistoryTitle:intent==='follow'&&followPending&&!followPaidPrerequisites?'这轮不能追加，原持股仍在。':jobTitle!==null?jobTitle:governanceTitle!==null?governanceTitle:invitationTitle!==null?invitationTitle:intent==='exit-request'&&a?.locked?'还在原锁定期，先看看这份安排。':intent==='exit-request'&&a&&!a.transferConsent?'先核对这份协议的原转让同意。':intent==='terms'&&n&&journey.phase!=='terms-accepted'?journey.title:intent==='relationship'?'为这份关系，留七天自己的时间。':intent==='eligibility'?'给本局资格，另留一份投入。':titles[intent]
 const contents:ReactNode=<>
  <p className="counterfactual-boundary">明确架空情境 · 无现实申购</p>
  {closing?<p>尾声只处理原来的事项，不再开始新的准备、投资或治理。仍沿用2025年第四季的四点行动，原生活费、工资与维护继续结算。</p>:null}
  {intent==='actors'||intent==='objects'?<>
   {r.reason||sourceReason?<p role="alert">{r.reason??sourceReason}</p>:null}
   {!closing&&!invalidSource&&v?.counterfactualEnabledAt===null?command('EnableCounterfactualEquity',{acknowledge:true},'走进这段架空经历'):null}
   {(intent==='actors'?actorRows:rows).map(original)}
   {!closing&&!invalidSource&&v?.counterfactualEnabledAt!==null?command('OpenEquityDesk',{},'开始自己的筹备'):null}
   {closing&&rows.length===0?<p>当前没有留下可选择的原权益记录；可以回尾声，查看其它旧约与回顾。</p>:null}
   {invalidSource?ui('重新选择关注','原记录与费用保留。',()=>choose(null)):null}
   {ui(closing?'回到尾声':'回到今天','',today)}
  </>:invalidSource||r.status!=='valid'?<><p role="alert">{sourceReason??r.reason??'先明确选择本次准备的主体，原协议和旧费用仍保留。'}</p>{go('actors','明确选择准备主体','没有默认换成另一家企业。')}</>:<>
   <p className="equity-choice-owner">{b!.accountId==='personal'?'个人资金':'企业 · '+b!.accountId.slice(-6)} · 可用{moneyText(b!.funds.availableFen)}{b!.funds.prepaidLiabilityFen>0?' · 另有客户预款保护'+moneyText(b!.funds.prepaidLiabilityFen):null}</p>
   {newClosingDecision?<><p>尾声只处理旧事项，不再新增准备、投资或治理。</p>{go('objects','看看原来的事项','任务、持股与款项仍在。')}{ui('翻阅原册与条件','',inspect)}{ui('回到尾声','',today)}</>:<>
   {intent==='business'?<>
    {journey.phase==='business-active'?continuity?<p>已有{continuity.own.length}份原安排，按原日历继续。</p>:<p className="reason">原安排来源尚待核对，请翻原册；没有替你停止。</p>:null}
    <p>{b!.related?'关系准备已有依据。':'还需实际关系准备。'}{b!.eligible?'本局参与资格已完成。':'本局参与资格待核对。'}</p>
    {['winding_down','closed'].includes(b!.lifecycle)?<><p>这里已停止新增安排，原条件仍可翻阅。</p><details><summary>原准备与介绍条件</summary>{go('prepare','核对准备条件','原允许范围与拒绝理由仍保留。')}{go('discover','核对介绍条件','查看不创建邀请。')}</details></>:!closing?<>{go('prepare','先做一点准备','关系与资格分别安排。')}{go('discover','听一次介绍','合作介绍，或未核验的中间人消息。')}</>:null}
    {go('objects','翻看邀请与协议','')}
    {go('next','核对保留与收尾','')}
   </>:null}
   {preparing?<>
    <p>{intent==='relationship'?'关系准备 · ¥500 · 1点 · 7天':intent==='eligibility'?'本局参与资格 · ¥1,500 · 1点 · 7天':'关系准备 ¥500；本局参与资格 ¥1,500。每项各1点、7天。'}</p>
    {!directPreparation?<label className="field">这次具体准备哪一项<select value={draft.value('preparation')} onChange={event=>draft.set('preparation',event.currentTarget.value)}><option value="">明确选择这次准备</option><option value="relationship">实际关系准备</option><option value="eligibility">本局参与资格</option></select></label>:null}
    {p.view.budget.available===0?<p className="reason">本季没有可用行动。以后开工仍须核对那一季的预算、预留与费用。</p>:null}<div className="equity-assignment-decision">{resources}
    {draft.value('preparation')==='relationship'?command('StartEquityRelationship',{businessId:b!.id,...assignment},'安排关系准备',hasAssignment):draft.value('preparation')==='eligibility'?command('StartEquityEligibility',{businessId:b!.id,...assignment},'安排参与资格',hasAssignment):<p>先选这次要准备的一项。</p>}</div>
    {rows.filter(row=>row.target.businessId===b!.id&&row.target.kind==='preparation').map(original)}
    {directPreparation?go('business','看看其它选择',''):null}
    <details><summary>准备条件与原记录</summary><p>关系、介绍、调查和本局资格分别成立；资格仍需本主体实际关系，以及已核实授权和融资意愿的邀请。准备完成不产生股份，也不授予现实金融资格。</p>{ui('翻阅完整筹备手记','',inspect)}</details>
   </>:null}
   {intent==='discover'?<>
    <p>听介绍 · ¥0 · 0点。来历与意愿仍需另行调查。</p><label className="field">本次邀请来源<select value={draft.value('source')} onChange={event=>draft.set('source',event.currentTarget.value)}><option value="">明确选择一个来源</option><option value="referral">已有实际合作或关系的介绍</option><option value="broker">虚构中间人的未核验消息</option></select></label>
    {command('DiscoverEquityInvitation',{businessId:b!.id,source:draft.value('source')},'听这次介绍',['referral','broker'].includes(draft.value('source')))}
    <details><summary>介绍的范围与期限</summary><p>介绍不支付投资本金、不产生股份。授权与融资意愿仍需独立调查；新邀请受原公开窗口和次数限制。</p>{ui('翻阅完整筹备手记','',inspect)}</details>
   </>:null}
   {intent==='invitation'&&i?<>
    <p>这封介绍来自{i.source==='referral'?'实际合作介绍':'未核验的中间人'}，有效至{i.expiresAt}；{invitationState?equityInvitationText[invitationState]:'本次来源待核'}。</p>
    <p>{i.reportAt===null?'还没有可用的调查报告。':i.authority&&i.financingConsent?'授权与有条件意愿已核实，下一步由你选。':i.authority===false?'没有核实到授权，这次调查结束了。':'授权已核实，对方暂不愿融资。'}</p>
    {!closing&&invitationCanArrange?<>
     {!invitationArranging?<div className="equity-invitation-choices" ref={invitationFields}>
      <section><h3>先把这封介绍查清楚</h3><p>¥2,000 · 1点 · 7天。结果可能无法核实授权或意愿。</p>{ui('我想先查清楚','选人手和日子，再确认。',()=>draft.set('invitationStep','arrange'))}</section>
      <section><h3>把这封邀请收好</h3><p>本次¥0 · 0点。已花费用不退，另有调查不会自动取消。</p>{command('RejectEquityInvitation',{invitationId:i.id},'拒绝这封邀请')}</section>
     </div>:<>
      <div className="equity-assignment-decision" ref={invitationFields}><p>调查¥2,000 · 1点 · 7天</p>{resources}{command('InvestigateEquityInvitation',{invitationId:i.id,...assignment},'安排这次调查',hasAssignment)}</div>
      {ui('再想一想','保留人手和日子。',()=>draft.set('invitationStep','compare'))}
     </>}
    </>:<>
     {i.status==='open'?command('RejectEquityInvitation',{invitationId:i.id},'拒绝这封邀请'):null}
     {r.job&&['planned','running'].includes(r.job.status)?<p>这份调查仍按{r.job.startAt}—{r.job.completeAt}进行。拒绝邀请不会替你停止任务，原任务的中断选择仍在。</p>:null}
    </>}
    {ui(closing?'先回尾声':'先过自己的日子','不新增安排。',today)}
    {!closing&&i.status==='open'?<details><summary>其它选择</summary>
     {i.reportAt===null?<><p>中间服务费1000元可能全部损失，不产生股份、资格或融资同意。可先独立调查，也可直接拒绝。</p>{command('PayUnverifiedBrokerFee',{invitationId:i.id},'承担风险支付1000元中间服务费，仍不获得股份')}</>:null}
     {invitationArranging?command('RejectEquityInvitation',{invitationId:i.id},'不查了，拒绝这封邀请'):null}
     {go('prepare','核对本主体的关系与资格','另选项目、资源和日期，不自动继续。')}{go('negotiate','比较这封邀请的具体条款','原资格、窗口和授权仍由原确认核定。')}
    </details>:null}
    {i.brokerPaymentId?<p>中间费已付，明细留在手记里。</p>:null}
   </>:null}
   {intent==='negotiate'&&i?<>
    <p>谈判预算 ¥500 · 1点 · 7天。对方可能拒绝；本次不支付报价本金。</p>
    <label className="field">取得股份的方式<select value={draft.value('acquisition')} onChange={event=>draft.set('acquisition',event.currentTarget.value)}><option value="">明确选择取得方式</option><option value="new_capital">新增资本，向项目融资</option><option value="secondary">已有股份转让，支付原卖方</option></select></label>
    {field('拟支付的投资本金（元）','amount')}
    <p>每股 ¥8；新增资本与老股转让分别核对。</p>
    <fieldset><legend>愿意谈怎样的权利与锁定？</legend>{v!.catalog.terms.map(t=><label className="equity-terms-choice" key={t.id}><input type="radio" name={name} value={t.id} checked={draft.value('terms')===t.id} onChange={()=>draft.set('terms',t.id)}/><span><strong>{t.label} · 最低{moneyText(t.minCapitalFen)} / 锁定{t.lockDays}日</strong><span>{t.board?'一席董事，无单方控制；':'无董事权；'}{t.preemptive?'可另行决定跟投；':'无跟投权；'}{t.transferConsent?'转让须原同意与实际买方。':'不承诺转让同意。'}</span></span></label>)}</fieldset>
    <div className="equity-assignment-decision">{resources}{command('StartEquityNegotiation',{invitationId:i.id,acquisitionKind:draft.value('acquisition'),termsId:draft.value('terms'),amountFen:amount??-1,...assignment},'按这些条件谈一次',hasAssignment&&amount!==null&&amount>0&&['new_capital','secondary'].includes(draft.value('acquisition'))&&v!.catalog.terms.some(t=>t.id===draft.value('terms')))}</div>
    <details><summary>融资、报价与真实付款</summary><p>模拟初始1000000股，每股8元。首轮投前{moneyText(v!.catalog.initialPreMoneyFen)}，总新增资本{moneyText(v!.catalog.firstNewMoneyFen)}；老股不增加项目资本或总股数。谈妥之后仍须另行支付并签署，才真正取得股份。</p>{ui('翻阅完整筹备手记','',inspect)}</details>
   </>:null}
   {intent==='terms'&&n?<>
    <p>{equityStageCopy(p,journey).line}</p><p>{n.closedAt!==null||n.expired||i?.status!=='open'?'当时报价':'报价本金'}{moneyText(n.amountFen)} · {n.shares}模拟股 · {v!.catalog.terms.find(t=>t.id===n.termsId)?.label} · 条款至{n.expiresAt}</p>
    {termsSign?command('SignEquityAgreement',{negotiationId:n.id},'支付本金，签署协议'):null}
    {termsCurrent?command('DeclineEquityTerms',{negotiationId:n.id},'放下这份条款'):null}
    {!termsCurrent?<div className="equity-history-next">{ui(closing?'回到尾声':'回到今天','',today)}{go('business',closing?'看看同主体的原事项':'看看同主体的选择','')}</div>:!termsSign?ui(closing?'回到尾声':'先回到今天','',today):null}
    <details><summary>原条款与过去的投入</summary><p>{journey.line}</p><p>{n.kind==='new_capital'?'本条款新增项目资本。':'本条款支付老股卖方，不增加项目资本。'}已付调查与谈判费用不退，其它未完约定保留。</p>{!termsSign&&!closing?command('SignEquityAgreement',{negotiationId:n.id},'支付本金，签署协议'):null}{!termsCurrent?command('DeclineEquityTerms',{negotiationId:n.id},'放下这份条款'):null}{quietJobLink}{ui('翻阅完整筹备手记','',inspect)}</details>
   </>:null}
   {intent==='holding'&&a?<>
    <p>仍持{a.shares}股 · 约{(a.holdingBps/100).toFixed(2)}% · {a.locked?'锁定至':'原锁定至'}{a.lockUntil}</p>
    {go('follow',a.followDecision==='pending'?'看看这轮融资':a.followDecision===null?'看看融资安排':'回看这轮融资',a.followDecision==='pending'?followPaidPrerequisites?'追加，或把现金留下。':'本轮不能追加，原记录保留。':a.followDecision===null?'这轮尚未开放。':'查看已经发生的决定。')}
    {!closing?go('governance','看看会议权利',a.board&&a.shares>0?'一席董事，无单方控制。':'当前没有董事权。'):null}
    {go('exit-request','问问有没有买方',a.locked?'锁定尚未到期。':'提出申请，不保证卖出。')}
    {rows.filter(row=>{const t=row.target;return t.kind==='governance'&&v!.governance.some(g=>g.id===t.recordId&&g.agreementId===a.id)||t.kind==='exit'&&v!.exits.some(e=>e.id===t.recordId&&e.agreementId===a.id)}).map(original)}
    {ui(closing?'回到尾声':'回到今天','',today)}
    <details><summary>持股、权利与原账</summary>{holdingFacts}<p>持有不要求做完所有记录才能离开。新的资金或权利决定由你另选；旧协议、费用与未收款继续保留。</p>{quietJobLink}{ui('翻开完整持股手记','',inspect)}</details>
   </>:null}
   {intent==='follow'&&a?<>
    {!followPending?<section className="equity-follow-history" aria-label="这轮融资的实际记录">
     {followHistory?.date?<p className="equity-history-date">原记录 · <time dateTime={followHistory.date}>{followHistory.date}</time></p>:null}
     {followHistory?.state==='participated'?<p className="equity-history-result">本轮已追加本金{moneyText(followHistory.amountFen)}</p>:followHistory?.state==='declined'?<p className="equity-history-result">本轮选择不追加</p>:followHistory?.state==='defaulted'?<p className="equity-history-result">本轮没有追加付款</p>:followHistory?.state==='before'?<p>{closing?'持股与原约定继续保留。':'持股仍按原协议保留，开放后再单独决定。'}</p>:<p className="reason">{followHistory?.reason??'原融资状态尚待核对。'}</p>}
     <p>当前仍持{a.shares} / {a.totalShares}股 · 约{(a.holdingBps/100).toFixed(2)}%</p>
     <div className="equity-history-next">{go('holding','回到这份持股','')}{ui(closing?'回到尾声':'回到今天','',today)}</div>
    </section>:<>
    <p>请在 {a.followDeadline} 前决定。</p>
    {!followPaidPrerequisites?<section className="equity-follow-history equity-follow-zero" aria-label="本轮不追加的选择">
     <p>{a.shares===0?'股份已经转出，本轮不能追加本金。':'原协议没有跟投权，本轮不能追加本金。'}</p>
     <p>付款 ¥0 · 新增 0股{zeroFollow?<> · 稀释后 {zeroFollow.sharesAfter} / {zeroFollow.totalSharesAfter}股 · 约{(zeroFollow.holdingBps/100).toFixed(2)}%</>:null}</p>
     {!zeroFollow?<p className="reason">本轮报价来源待核，不能试算稀释。</p>:null}
     <div className="equity-history-next">{command('FollowEquityRound',{agreementId:a.id,amountFen:0},'这次不跟投')}{ui(closing?'先留着，回到尾声':'先留着，回到今天','',today)}</div>
    </section>:!followPrincipal?<div className="equity-follow-options">
     <section className="equity-follow-option"><h3>留住现金</h3><p>付款 ¥0 · 新增 0股</p>{zeroFollow?<p>稀释后 {zeroFollow.sharesAfter} / {zeroFollow.totalSharesAfter}股 · 约{(zeroFollow.holdingBps/100).toFixed(2)}%</p>:a.followDecision==='pending'?<p className="reason">本轮报价来源待核，不能试算稀释。</p>:<p>现持{a.shares} / {a.totalShares}股</p>}{command('FollowEquityRound',{agreementId:a.id,amountFen:0},'这次不跟投')}</section>
     {!closing?<section className="equity-follow-option"><h3>追加投入</h3>{followOffer?<p>每股 {moneyText(followOffer.unitPriceFen)} · 最多 {moneyText(followOffer.maxAmountFen)}</p>:a.followDecision==='pending'?<p className="reason">本轮报价来源待核。</p>:null}{a.followDecision==='pending'?ui('试算一笔投入','',()=>draft.set('followStep','principal')):go('holding','看看持股','')}</section>:null}
    </div>:<section className="equity-follow-principal" aria-label="本轮本金试算">
      {followOffer?<p>每股 {moneyText(followOffer.unitPriceFen)} · 最多 {moneyText(followOffer.maxAmountFen)}</p>:<p className="reason">本轮报价来源待核。</p>}
      <div className="equity-follow-decision">
       {field('本次愿意另行投入的本金（元）','amount')}
       {followOffer&&amount!==null&&amount>0&&amount%followOffer.unitPriceFen!==0?<p className="reason">请按每股{moneyText(followOffer.unitPriceFen)}填写整份本金。</p>:paidFollow&&amount!==null&&amount>0?<p>试算：新增{paidFollow.newShares}股 · 合计{paidFollow.sharesAfter} / {paidFollow.totalSharesAfter}股 · 约{(paidFollow.holdingBps/100).toFixed(2)}%</p>:null}
       {command('FollowEquityRound',{agreementId:a.id,amountFen:amount??-1},'按这笔本金参与',amount!==null&&amount>0,'请填写大于零的本金。')}
      </div>
      {ui('回到两种选择','',()=>draft.set('followStep','compare'))}
      <div className="equity-follow-presets">{followOffer&&equityFollowHalfAmount(followOffer)>0?fillFollow('试填约一半份额 · '+moneyText(equityFollowHalfAmount(followOffer)),equityFollowHalfAmount(followOffer)):null}{fillFollow('填入原上限 · '+moneyText(a.followMaxFen),a.followMaxFen)}</div><p className="field-help">试填不付款，实际出资仍须原确认。</p>
    </section>}
    </>}
    <details><summary>持股与融资条款</summary>{holdingFacts}<p>不会自动借款，也不以估值支付。已发生的费用和原责任不会因本次选择清除；本轮未新增现金收入。到期未选仍按原规则不付款并记录实际稀释。</p>{!followPending?command('FollowEquityRound',{agreementId:a.id,amountFen:0},'这次不跟投'):null}{quietJobLink}{ui('翻开完整持股手记','',inspect)}</details>
   </>:null}
   {intent==='governance'&&a?<>
    {!governancePrerequisites?<><p>{!a.board?'这份协议当前没有可提出会议的董事权。':'股份已经转出，这次不能提出会议。'}原条款和已发生会议仍可查看。</p><div>{go('holding','回到这份持股','')}{ui('先过自己的日子','',today)}</div></>:<>
    <p>会议预算 {moneyText(governanceJob?.costFen)} · {governanceJob?.actionPoints??'待核'}点 · {governanceJob?.durationDays??'待核'}天。工资维护另计，对方可能拒绝。</p>
    {!governanceArranging?<div className="equity-governance-options" aria-label="先比较这次有限提案" ref={governanceFields}>
     {EQUITY_GOVERNANCE_POLICIES.map(policy=><section className="equity-governance-option" data-selected={governancePolicy?.id===policy.id?'true':undefined} key={policy.id}><h3>{policy.question}</h3><p>{policy.choiceEffect}</p><p>{policy.choiceLimit}</p>{ui(policy.choiceLabel,'',()=>draft.patch({policy:policy.id,governanceStep:'arrange'}))}</section>)}
    </div>:<>
     <h3>本次想提出：{governancePolicy.label}</h3>
     <div className="equity-governance-decision equity-assignment-decision" ref={governanceFields}>
      {resources}
      {command('ProposeEquityGovernance',{agreementId:a.id,policy:governancePolicy.id,...assignment},'安排这次会议',hasAssignment)}
     </div>
     {ui('重新比较两项提案','',()=>draft.set('governanceStep','compare'))}
    </>}
    </>}
    <details><summary>持股与会议条款</summary>{holdingFacts}{!governancePrerequisites?<p>原会议预算 {moneyText(governanceJob?.costFen)} · {governanceJob?.actionPoints??'待核'}点 · {governanceJob?.durationDays??'待核'}天；工资维护另计，对方可能拒绝。当前没有安排会议。</p>:null}{EQUITY_GOVERNANCE_POLICIES.map(policy=><p key={policy.id}>{policy.label}：{policy.effect} {policy.limit}</p>)}<p>本次提案不增加股份、不解除原锁定，不删除旧费用、客户保护或原应收；实际通过后才有对应的本局政策。</p>{quietJobLink}{ui('翻开完整持股手记','',inspect)}</details>
   </>:null}
   {intent==='exit-request'&&a?<>
    {closing&&a.locked?<><p>原锁定至{a.lockUntil}。等候沿原下一日期，仍结算原生活费与旧约，不免费跳到锁定结束。</p>{command('AdvanceTime',{date:a.lockUntil},'等原锁定到期，再核对独立买方')}</>:null}
    <p>仍持{a.shares}股 · {a.locked?'锁定至':'原锁定至'}{a.lockUntil}</p>{!a.transferConsent?<p className="reason">原协议尚无转让同意。</p>:null}
    {exitPrerequisites?<><p>调查预算 ¥500 · 1点 · 7天。买方可能拒绝，或只给有限折价报价。</p>{field('本次拟询问转让的模拟股数','shares',true)}<div className="equity-assignment-decision">{resources}
    {command('RequestEquityExit',{agreementId:a.id,shares:shares??-1,...assignment},'询问独立买方',hasAssignment&&shares!==null)}</div></>:<>{a.shares===0?<p>股份已经转出，原报价和款项仍可翻阅。</p>:null}<div>{go('holding','回到这份持股','')}{ui(closing?'回到尾声':'先过自己的日子','',today)}</div></>}
    <details><summary>持股与转让条款</summary>{holdingFacts}{!exitPrerequisites?<p>原调查预算 ¥500 · 1点 · 7天。买方可能拒绝，或只给有限折价报价；当前没有安排调查。</p>:null}<p>锁定结束不保证出售，不能按过去峰值套现。提出调查不出售股份；成交与收款仍须另行决定。</p>{quietJobLink}{ui('翻开完整持股手记','',inspect)}</details>
   </>:null}
   {intent==='exit-accept'&&e?<>
    <p>每股 {moneyText(e.unitPriceFen)} · 最多 {e.shares}股 · 报价至 {e.expiresAt}</p>{e.scopeRestricted?<p className="reason">用途与接手方受限。</p>:null}
    <div className="equity-exit-decision-row">{field('本次实际转让的模拟股数','shares',true)}
     <CommandButton {...commandProps} kind="AcceptEquityExit" payload={{exitId:e.id,shares:shares??-1}} label="按这个股数转让" confirm renderAction={(binding,_node,{preview})=><div className="equity-exit-quote-action">
      {preview.allowed&&preview.privateSale?<><p>净应收 {moneyText(preview.privateSale.netReceivableFen)} · {preview.privateSale.dueAt}起可收</p><p>总价{moneyText(preview.privateSale.grossFen)} − 转让费{moneyText(preview.privateSale.feeFen)} · {a&&preview.privateSale.shares<=a.shares?'余'+(a.shares-preview.privateSale.shares)+'股':'余股待核'}。</p><p>转出{preview.privateSale.shares}股，现在不增加现金。</p></>:<p>先填愿意转出的股数，再核对款项。</p>}
      <div className="command"><button type="button" disabled={binding.disabled||shares===null} onClick={()=>{if(shares!==null&&draft.current())binding.activate()}}>按这个股数转让</button>{shares===null?<small className="reason">请填写转出股数。</small>:binding.reason?<small className="reason">{binding.reason}</small>:null}</div>
     </div>}/>
    </div>
    {ui(closing?'先保留股份，回到尾声':'先保留股份，回到今天','',today)}
    <details><summary>报价与转让费用</summary><p>报价不是成交。转让费按累计总价的3%取整；以上金额按这次选择的股数核对。决定前仍会逐项核对总价、费用、净应收和约定日期。未转的股数保留，转让当下没有实收现金。原报价有效期与旧费用保留。</p>{quietJobLink}{ui('翻开完整持股手记','',inspect)}</details>
   </>:null}
   {intent==='collect'&&e?<>
    <p>待收 {moneyText(e.receivable?.remainingFen)} · 到期 {e.dueAt??'待核'}</p><p>{exitCash?.complete?'已收':'原款记收'}{moneyText(e.collectedFen)} · 原净应收{moneyText(e.receivable?.amountFen)} · 已转出{e.soldShares}股</p>
    {exitCash&&!exitCash.complete?<p className="reason">{exitCash.reason}{exitCash.verifiedFen!==null?'已核现金'+moneyText(exitCash.verifiedFen)+'仍保留；':''}原允许收取的余款和完整原册继续。</p>:null}
    <div className="equity-collection-decision">{field('这一次实际收取的金额（元）','amount')}{command('CollectEquityExit',{exitId:e.id,amountFen:amount??-1},'收回这笔款',amount!==null&&amount>0)}</div>
    {e.receivable?ui('填入余款 · '+moneyText(e.receivable.remainingFen),'仅填写',()=>draft.set('amount',String(e.receivable!.remainingFen/100))):null}
    {ui(closing?'先留着，回到尾声':'先留着，回到今天','',today)}
    <details><summary>本笔原款与账目</summary><p>本次收款不重复确认收益。未收余额、余股、旧费用与其它义务仍分别保留；不会自动收款。</p>{quietJobLink}{ui('翻开完整持股手记','',inspect)}</details>
   </>:null}
   {intent==='job'?<>
    {r.job?<>
     <p>{r.job.startAt}—{r.job.completeAt} · {({planned:'已预留，尚未开工',running:'正在进行',completed:'已经完成',cancelled:'未开工安排已取消',interrupted:'已经中断'})[r.job.status]}</p>
     <p>这次已付{moneyText(jobCost?.paidFen??null)} · 仍预留{moneyText(jobCost?.reservedFen??null)}{!jobCost||jobCost.paidFen===null||jobCost.reservedFen===null?' · 本次费用来源待核对':''}</p>
     {activeJob?<>{ui('回到这次安排','沿原日历继续等待。',close)}{command('InterruptJob',{jobId:r.job.id},r.job.status==='planned'?'取消尚未开工的安排':'中断这次安排')}<p>{r.job.status==='planned'?'取消只解除这次未开工的预留；已付费用不退。':'已付费用和已用行动不退，中断不会补做结果。'}</p></>:<>{ui('回到生活','',today)}{ui('翻阅这次安排的记录','',inspect)}<p>这次已经结束，不再等待它完成；过去的投入仍在。</p></>}
     <details><summary>原安排与改期条件</summary><p>本路线日程固定，原改期拒绝理由仍保留。</p><div className="equity-assignment-decision">{resources}{command('RescheduleJob',{jobId:r.job.id,...assignment},'核对改期条件',hasAssignment)}</div>{!activeJob?command('InterruptJob',{jobId:r.job.id},'核对已结束任务的停止条件'):null}{activeJob?ui('翻阅完整任务手记','',inspect):null}</details>
    </>:<p>当前对象没有独立任务，请明确选择原来那一项。</p>}
   </>:null}
   {intent==='fund'?<>
    <p>个人自有钱 → 企业资本。不是费用或收入。</p>{field('另行转入的个人自有资本（元）','amount')}{command('FundBusiness',{businessId:b!.id,amountFen:amount??-1},'转入企业资本',amount!==null&&amount>0)}
    <details><summary>资金与原义务</summary><p>这不是本次投资本金。客户预款不能用来追加；原维护、工资与旧义务继续结算。</p>{ui('翻阅完整筹备手记','',inspect)}</details>
   </>:null}
   {intent==='next'?<>
    <p>{b!.lifecycle==='closed'?'分账已合上，原来的记录仍在。':b!.lifecycle==='winding_down'?'这里已经在收尾，持股与旧款各自保留。':'收尾将中断本主体任务；如有本主体员工参与其它工作，也一并中断。'}</p>
    <div className="equity-closure-decision">
     {ui(closing?'先留着，回到尾声':'先留着，回到今天','原安排与旧约保留。',today)}
     {b!.lifecycle==='winding_down'?command('CloseBusiness',{businessId:b!.id},'核对条件，合上分账'):b!.lifecycle!=='closed'?command('WindDownBusiness',{businessId:b!.id},'核对代价，进入收尾'):null}
    </div>
    <EquityBusinessContinuity value={continuity}/>
    <details><summary>本次结果与原记录</summary><p>{journey.line}</p>{journey.facts.map(fact=><p key={fact}>{fact}</p>)}
     {businessTarget?ui('回看同主体的条件','',()=>changeIntent('business')):null}
     {agreementTarget?ui('回到这份原协议','原持股、锁定与未收款仍在。',()=>choose(agreementTarget)):null}
     {rows.filter(row=>row.target.businessId===b!.id&&row.target.kind!=='business').map(original)}
    </details>
    <details><summary>其它资金与收尾选择</summary>{b!.company?go('fund','另留一笔自有资本','客户保护款与估值不能代付。'):null}{command('WindDownBusiness',{businessId:b!.id},'核对整份主体的收尾')}{command('CloseBusiness',{businessId:b!.id},'核对条件，关闭分账')}</details>
   </>:null}
   {intent==='record'?<><p>{journey.line}</p>{journey.facts.map(fact=><p key={fact}>{fact}</p>)}{r.governance?<p>本次提案{r.governance.resolvedAt===null?'尚无实际表决结果':r.governance.approved?'已经有限通过':'原董事会未通过'}，{r.governance.policy==='independent_audit'?'独立资本用途核对':'用途与接手方限制'}；不取得单方控制。</p>:null}{v?.auditedProjectReport?<p>已开放的本局资本用途核对（截至{v.auditedProjectReport.asOf}）：新增资本{moneyText(v.auditedProjectReport.newCapitalFen)}，老股卖方收款{moneyText(v.auditedProjectReport.secondaryPaymentFen)}，总模拟股数{v.auditedProjectReport.sharesOutstanding}；{v.auditedProjectReport.scope}。</p>:null}{ui('翻开完整原册与账目','同一主体和同一记录；只读查看。',inspect)}</>:null}
   {r.job&&intent!=='job'&&(activeJob||!['holding','follow','governance','exit-request','exit-accept','collect','terms'].includes(intent))?go('job',activeJob?'看看正在进行的安排':'翻阅本次安排记录',activeJob?'按本次日期和已留资源继续。':''):null}
   {!['record','follow','holding','governance','exit-request','exit-accept','collect','prepare','relationship','eligibility','discover','negotiate','terms','fund','job'].includes(intent)?ui('翻开完整筹备手记','',inspect):null}
   </>}
  </>}
 </>
 return <Dialog title={title} className="equity-scene-choice scene-choice-dialog" onClose={close}>{contents}</Dialog>
}
