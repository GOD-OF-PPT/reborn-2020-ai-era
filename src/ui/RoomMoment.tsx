import type {Ref,ReactNode} from 'react'
import type {GamePanelProps,NavigateScene,LifeSceneMode,SceneTarget} from './game-types.ts'
import type {LifePerson} from '../core/life-schema.ts'
import type {Screen} from './Navigation.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {sceneWorks} from './SceneJournal.tsx'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {moneyText} from './game-text.ts'
import {videoSceneProgress} from './video-scene-progress.ts'
import {courseSceneProgress} from './course-scene-progress.ts'
import {relaySceneProgress} from './relay-scene-progress.ts'
import {storySceneProgress} from './story-scene-progress.ts'
import {lifeSceneProgress,pendingLifePromises} from './life-scene-progress.ts'
import {marketSceneProgress} from './market-scene-progress.ts'
import {deepseekSceneProgress} from './deepseek-scene-progress.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import type {OpeningFocus} from './player-thread.ts'

type Props={p:GamePanelProps;headingRef:Ref<HTMLHeadingElement>;feedback?:ReactNode;onNavigate:NavigateScene;onExplore:()=>void;openingFocus?:OpeningFocus|null|undefined;focusQuarter?:string|null|undefined;focusNotice?:string|null|undefined;focusRequiresChoice?:boolean|undefined;onOpeningFocus?:((focus:OpeningFocus|null)=>void)|undefined;onResponsibilities?:(()=>void)|undefined;onRecollection?:(()=>void)|undefined}
export type Moment={stage:string;object:string;title:string;line:string;detail:string;command?:{kind:string;payload:unknown;label:string;confirm?:boolean};wait?:{date:string;label:string};inspect?:{screen:Screen;label:string;accountId?:string;personId?:LifePerson;lifeSelection?:LifeSceneMode;recordId?:string;videoTarget?:SceneTarget['videoTarget']}}

/** Current public commitments select a scene, never a command or an outcome. */
export function roomMoment(p:Pick<GamePanelProps,'view'|'features'>):Moment{
 const {view,features:f}=p,w=f.workbench,first=f.firstOrder
 let paid:Moment|null=null
 if(w.pause)return {stage:'attention',object:'日历上的来信',title:'有件事，等你亲自回应。',line:w.progression.barrierLabel??'先看清已经发生的事，再决定怎样继续。',detail:'原费用和答应过的事都保留。看一眼不会替你作决定。',inspect:{screen:w.pause.reason==='STORY_RISK_DECISION_PENDING'?'story':'quarter',label:'读这封需要回应的来信'}}
 const activeRisk=f.story.incidents.filter(c=>c.resolvedAt===null&&!['normal','resolved'].includes(c.stage)).sort((a,b)=>a.deadline.localeCompare(b.deadline))[0]
 const risk=activeRisk?storySceneProgress(f.story,view.date,activeRisk.id):null
 if(risk)return {stage:'commitment',object:'一封需要面对的来信',title:risk.title,line:risk.line,detail:risk.deadlineWarning??`原默认期限${risk.incident.deadline}；确认本次记录不清除原费用、合同或范围外责任。`,inspect:{screen:'story',label:'查看这封来信的下一步'}}
 if(w.progression.requiresDelivery&&first.status!=='awaiting_submission')return {stage:'attention',object:'桌上的作品',title:'作品做好了，还差你的决定。',line:'完成制作与交给客户是两回事。',detail:'先面对原交付，时间不会替你提交。',inspect:{screen:'quarter',label:'查看这份待交付的作品'}}
 const accepted=pendingLifePromises(f.life,view.date)[0]
 const living=f.life.jobs.filter(j=>j.status==='running').sort((a,b)=>a.completeAt.localeCompare(b.completeAt)||a.id.localeCompare(b.id))[0]
 const lifeSelection=accepted?.person.id??living?.personId??(living?.kind==='rest'||living?.kind==='workspace'?living.kind:null)
 const life=lifeSelection&&!w.progression.requiresDelivery?lifeSceneProgress(f.life,view.date,lifeSelection):null
 if(life)return {stage:'commitment',object:life.person?'答应'+life.person.name+'的事':'已经留给生活的日子',title:life.title,line:life.line,detail:life.choice.line,...(life.command?{command:{...life.command,label:life.choice.label}}:{}),...(life.waitDate?{wait:{date:life.waitDate,label:life.person?'等和'+life.person.name+'约好的这段时间结束':'等这次生活安排完成'}}:{}),inspect:{screen:'life',label:life.person?'查看与'+life.person.name+'的约定':'查看这次生活安排',lifeSelection:life.selection==='rest'?'rest':life.selection==='workspace'?'workspace':'person',...(life.person?{personId:life.person.id}:{})}}
 const markets=view.accounts.map(a=>marketSceneProgress(f.market,view.date,a.accountId)).filter(m=>m.active)
 markets.sort((a,b)=>({planned:10,settlement:20,pending:30,partial:30,research:40,opening:90,position:90,history:90}[a.phase])-({planned:10,settlement:20,pending:30,partial:30,research:40,opening:90,position:90,history:90}[b.phase])||(a.nextDate??'9999').localeCompare(b.nextDate??'9999')||a.accountId.localeCompare(b.accountId))
 const market=markets[0]
 const marketMoment=market?{stage:'commitment',object:'桌上的买卖委托',title:market.title,line:market.line,detail:(market.accountId==='personal'?'个人账户':w.routes.find(r=>r.accountId===market.accountId)?.name??'原经营账户')+' · '+market.choice.line,...(market.command?{command:{...market.command,label:market.choice.label}}:{}),...(market.nextDate?{wait:{date:market.nextDate,label:market.waitLabel??'等原市场安排的反馈'}}:{}),inspect:{screen:'market' as const,label:'查看这份委托与其他选择',accountId:market.accountId}}:null
 if(marketMoment&&first.status==='available'&&!w.progression.requiresDelivery)return marketMoment
 if(view.date<='2020-03-31'||first.status==='awaiting_submission'){
  const detail=`个人制作成本${moneyText(first.terms.costFen)} · ${first.terms.actionPoints}点 · ${first.dates.startAt}—${first.dates.submitBy}`
  if(first.status==='available')return {stage:'offer',object:'电脑里的一封委托',title:'有人想请你，剪一条短片。',line:`这是一次手工制作的尝试。客户报价${moneyText(first.terms.priceFen)}，需要你在${first.dates.replyBy}前答复。`,detail,command:{kind:'StartFirstOrder',payload:{},label:'接下这笔手工单'}}
  if(first.status==='planned')return {stage:'planned',object:'已经答应的委托',title:'答应了，就给它留出日子。',line:`制作排在${first.dates.startAt}开始，${first.dates.submitBy}完成。此刻还没有交付和回款。`,detail,wait:{date:first.dates.startAt,label:'等到这份作品开工'}}
  if(first.status==='running')return {stage:'running',object:'桌上的制作文件',title:'这条短片，正在一点点成形。',line:`制作已经开始。${first.dates.submitBy}完成后，还需要你亲手交给客户。`,detail:`已发生制作成本${moneyText(first.result.directCostFen)} · 还没有收到客户款`,wait:{date:first.dates.submitBy,label:'等作品做完'}}
  if(first.status==='awaiting_submission')return first.deadlineMissed?{stage:'attention',object:'超过约定日期的作品',title:'约定的交付日，已经过去了。',line:'作品和已发生成本仍在。继续或退出，需要面对原合同。',detail,inspect:{screen:'quarter',label:'查看逾期后的处理办法'}}:{stage:'delivery',object:'等你发送的作品',title:'短片做好了。要发给客户吗？',line:'你可以亲手提交。客户复核和真正到账，还会分别发生。',detail:`已经支付制作成本${moneyText(first.result.directCostFen)} · 提交不再占用行动`,command:{kind:'SubmitDelivery',payload:{contractId:first.contractId},label:'把作品交给客户'}}
  if(first.status==='review'||first.status==='delivered')return {stage:'waiting',object:'已经发出的作品',title:first.status==='review'?'作品发出去了，等客户回信。':'客户已经验收，款项还要等到账。',line:'不必反复提交。也可以先去看看生活里的人与事。',detail:'客户复核、确认收入和实际到账，仍按原约定分别发生。',wait:{date:first.status==='review'&&first.dates.earliestReviewAt>view.date?first.dates.earliestReviewAt:w.progression.nextDate,label:first.status==='review'?'等客户复核':'等原款到账'}}
  if(first.result.paymentFen>0)paid={stage:'paid',object:'客户寄回的回执',title:'第一笔回款，真的到了。',line:`客户实际支付${moneyText(first.result.paymentFen)}。制作成本${moneyText(first.result.directCostFen)}，这笔小单净额${moneyText(first.result.netOrderFen)}。`,detail:'工资和持仓浮盈不在这笔小单里。下一次尝试，仍由你选择。',inspect:{screen:'routes',label:'去看看另一种可能'}}
 }
 const ecosystem=deepseekSceneProgress(f.deepseek,view.date)
 const ecoOwner=ecosystem?.entity?(ecosystem.entity.accountId==='personal'?'个人账户':w.routes.find(r=>r.accountId===ecosystem.entity!.accountId)?.name??'原生态企业账户')+' · ':''
 if(ecosystem?.active&&ecosystem.priority<=22)return {stage:'commitment',object:ecosystem.source==='counterfactual-equity'?'明确架空 · 投资约定':'合作到了需要回应的日子',title:ecosystem.title,line:ecosystem.line,detail:ecoOwner+ecosystem.choice.line,...(ecosystem.command?{command:{...ecosystem.command,label:ecosystem.choice.label}}:{}),inspect:{screen:'deepseek',label:ecosystem.choice.label}}
 const current=sceneWorks(p)[0]
 if(current)return {stage:'ongoing',object:'你已经答应的事',title:current.title,line:current.status,detail:`${current.start}—${current.end} · ${current.cost}`,inspect:{screen:current.screen,label:'查看这件事的下一步',...(current.accountId?{accountId:current.accountId}:{}),...(current.personId?{personId:current.personId}:{}),...(current.lifeSelection?{lifeSelection:current.lifeSelection}:{}),...(current.recordId?{recordId:current.recordId}:{}),...(current.videoTarget?{videoTarget:current.videoTarget}:{})}}
 const pending=[
  {screen:'video' as const,value:f.video&&(f.video.contracts.some(c=>!['settled','cancelled'].includes(c.status))||f.video.works.some(w=>w.contractId===null&&w.abandonedAt===null&&!f.video!.publications.some(p=>p.workId===w.id))||f.video.publications.some(p=>p.measuredAt===null)||f.video.settlements.some(s=>s.collectedAt===null))?videoSceneProgress(f.video,view.date):null},
  {screen:'course' as const,value:f.course&&(f.course.cohorts.some(c=>c.closedAt===null)||f.course.courses.some(c=>c.unresolvedUpdates.length>0))?courseSceneProgress(f.course,view.date):null},
  {screen:'relay' as const,value:f.relay&&(f.relay.applications.some(a=>!a.read&&a.job?.status==='completed')||f.relay.periods.some(p=>['planned','running','support','settling'].includes(p.status))||f.relay.customers.some(c=>c.closedAt===null)||f.relay.meters.some(m=>m.auditedUnits!==null&&m.auditedUnits!==m.reportedUnits&&m.correctionId===null)||f.relay.businesses.some(b=>b.funds.payableFen>0||b.funds.receivableFen>0||b.funds.prepaidLiabilityFen>0||b.funds.supplierPrepaidFen>0))?relaySceneProgress(f.relay,view.date):null},
 ].find(item=>item.value!==null)
 const pendingVideoTarget=pending?.screen==='video'&&pending.value&&'target' in pending.value?pending.value.target:undefined
 const pendingVideoOwner=f.video?.channels.find(c=>c.id===pendingVideoTarget?.channelId)
 if(pending?.value){
  const direct='command' in pending.value?pending.value.command:null
  return {stage:'commitment',object:'答应过的事，还在继续',title:pending.value.title,line:pending.value.line,detail:pending.value.choice.line,...(direct?{command:{kind:direct.kind,payload:direct.payload,label:pending.value.choice.label,confirm:direct.confirm}}:{}),inspect:{screen:pending.screen,label:'查看这件事的下一步',...(pendingVideoTarget?{videoTarget:pendingVideoTarget,...(pendingVideoOwner?{accountId:pendingVideoOwner.accountId}:{})}:{})}}
 }
 if(ecosystem?.active)return {stage:'commitment',object:ecosystem.source==='counterfactual-equity'?'明确架空 · 投资约定':'还在继续的生态合作',title:ecosystem.title,line:ecosystem.line,detail:ecoOwner+ecosystem.choice.line,...(ecosystem.command?{command:{...ecosystem.command,label:ecosystem.choice.label}}:{}),...(ecosystem.nextDate?{wait:{date:ecosystem.nextDate,label:'等这份合作的下一次回信'}}:{}),inspect:{screen:'deepseek',label:ecosystem.choice.label}}
 if(marketMoment)return marketMoment
 if(paid)return paid
 const employed=w.employment.some(e=>e.segments.some(s=>s.to===null))
 if(!employed&&!w.atQuarterEnd&&view.phase==='playing'&&view.budget.available>=2)return {stage:'choose',object:'门外的日子',title:'这一季，先把生活留稳。',line:'保留一份工作，或给自己的尝试留些时间。工作与副业可以按真实预算组合。',detail:'工作占本季2点，工资按实际在岗日、在月末到账。',command:{kind:'WorkQuarter',payload:{},label:'保留这一季的工作'}}
 return {stage:'quiet',object:'眼前的生活',title:w.atQuarterEnd?'这一季，留下了怎样的日子？':'还有一些时间，属于你自己。',line:w.atQuarterEnd?'看一眼已经发生的事，再决定下一季怎么过。':'工作与已经答应的事照原日历继续。可以探索新的路，也可以留给在意的人。',detail:'阅读与探索不消耗行动，不会替你接受交易、合同或权限。',inspect:{screen:w.atQuarterEnd?'quarter':'routes',label:w.atQuarterEnd?'回看这一季的经历':'探索五条不同的人生路线'}}
}

export function RoomMoment({p,headingRef,feedback,onNavigate,onExplore,openingFocus,onOpeningFocus,focusQuarter,focusNotice,focusRequiresChoice,onResponsibilities,onRecollection}:Props){
 if(p.view.phase==='playing')return <OpeningMoment p={p} headingRef={headingRef} feedback={feedback} fallback={roomMoment(p)} focus={openingFocus} focusQuarter={focusQuarter} focusNotice={focusNotice} focusRequiresChoice={focusRequiresChoice} onFocus={onOpeningFocus} onNavigate={onNavigate} onExplore={onExplore} onResponsibilities={onResponsibilities} onRecollection={onRecollection}/>
 const moment=roomMoment(p),w=p.features.workbench
 const employed=w.employment.some(e=>e.segments.some(s=>s.to===null))
 const canWait=false
 const target=moment.wait?.date??w.progression.nextQuarterDate??w.progression.nextDate
 const safeDate=canWait?playableAdvanceDate(w,p.view.date,target):null
 const waitLabel=moment.wait&&safeDate===moment.wait.date?moment.wait.label:w.progression.nextQuarterDate?'走进下一季':'让原来的安排继续'
 const alternateWork=['offer','planned','running','waiting'].includes(moment.stage)&&!employed
 return <section className="room-current-moment" data-stage={moment.stage} aria-label="眼前这一幕">
  <header className="moment-heading"><p>{w.quarter} / {moment.object}</p><h1 ref={headingRef} tabIndex={-1}>{moment.title}</h1></header>
  <div className="moment-time" aria-label={`本季行动：可用${p.view.budget.available}点，预留${p.view.budget.reserved}点`}><span>这一季，四份时间</span><ol aria-hidden="true">{Array.from({length:4},(_,i)=><li key={i} data-state={i<p.view.budget.available?'available':i<p.view.budget.available+p.view.budget.reserved?'reserved':'used'}>{i+1}</li>)}</ol><small>可用{p.view.budget.available} · 预留{p.view.budget.reserved}</small></div>
  <div className="moment-story" aria-label="眼前的情况">
   {feedback?<div className={typeof feedback==='string'?'moment-status':'moment-feedback'} role={typeof feedback==='string'?'status':undefined}>{feedback}</div>:null}
   {!feedback||typeof feedback==='string'?<p className="moment-line">{moment.line}</p>:null}<p className="moment-terms">{moment.detail}</p>
  </div>
   <div className="moment-decisions">
    {moment.command?<CommandButton {...p} {...moment.command} confirm={moment.command.confirm??true} className="moment-decision moment-primary"><b aria-hidden="true">01</b><span>{moment.command.label}<small>{moment.command.confirm===false?'只办理眼前这一笔':'先看钱与时间，再决定'}</small></span><i aria-hidden="true">→</i></CommandButton>:moment.wait&&safeDate?<div className="moment-wait moment-primary"><ClockAdvance p={p} date={safeDate} label={waitLabel+' · '+safeDate} room/></div>:moment.inspect?<button type="button" className="moment-decision moment-primary" onClick={()=>onNavigate(moment.inspect!.screen,{...(moment.inspect!.accountId?{accountId:moment.inspect!.accountId}:{}),...(moment.inspect!.personId?{personId:moment.inspect!.personId}:{}),...(moment.inspect!.lifeSelection?{lifeSelection:moment.inspect!.lifeSelection}:{})})}><b aria-hidden="true">01</b><span>{moment.inspect.label}<small>查看详情，读过以后再决定</small></span><i aria-hidden="true">↗</i></button>:<button type="button" className="moment-decision moment-primary" onClick={()=>onNavigate('quarter')}>先面对眼前的事 →</button>}
    {alternateWork?<CommandButton {...p} kind="WorkQuarter" payload={{}} label="先保留这一季的工作" confirm className="moment-decision"><b aria-hidden="true">02</b><span>先保留这一季的工作<small>可与小单一起安排 · 占2点，按在岗日领工资</small></span><i aria-hidden="true">→</i></CommandButton>:moment.stage==='planned'||moment.stage==='running'||moment.stage==='waiting'?<button type="button" className="moment-decision" onClick={()=>onNavigate('life')}><b aria-hidden="true">02</b><span>等候时，也看看在意的人<small>先去看看，不自动花钱或占用时间</small></span><i aria-hidden="true">↗</i></button>:null}
    <button type="button" className="moment-explore" onClick={onExplore}>环顾房间，想想别的可能 <span aria-hidden="true">↗</span></button>
   </div>
   {!moment.wait&&safeDate&&moment.stage!=='offer'?<div className="moment-idle-clock"><ClockAdvance p={p} date={safeDate} label={(w.progression.nextQuarterDate?'进入下一季 · ':'让日子向前 · ')+safeDate} room/></div>:null}
 </section>
}
