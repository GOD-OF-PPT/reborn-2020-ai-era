import {useState,type Ref,type ReactNode} from 'react'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import type {Moment} from './RoomMoment.tsx'
import {OpeningObject,type OpeningObjectProps} from './OpeningObject.tsx'
import {playerThread,type OpeningFocus,type PlayerThreadView} from './player-thread.ts'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {Dialog} from './Dialog.tsx'
import {MarketSceneChoice} from './MarketSceneChoice.tsx'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {moneyText} from './game-text.ts'

type Props={p:GamePanelProps;headingRef:Ref<HTMLHeadingElement>;fallback:Moment;feedback?:ReactNode;focus?:OpeningFocus|null|undefined;onFocus?:((focus:OpeningFocus|null)=>void)|undefined;onNavigate:NavigateScene;onExplore:()=>void}

function objectKind(thread:PlayerThreadView):OpeningObjectProps['kind']{
 if(thread.focus.kind==='market')return 'portfolio'
 if(thread.focus.kind==='life'||thread.focus.kind==='work'||thread.focus.kind==='free')return thread.outcome==='actual'?'receipt':'calendar'
 if(thread.stage==='paid')return 'receipt'
 if(thread.stage==='planned')return 'calendar'
 if(thread.stage==='delivery')return 'work'
 if(thread.wait)return 'waiting'
 return 'letter'
}
function stageLabel(thread:PlayerThreadView){
 if(thread.focusStatus==='invalid')return '原对象需要重新选择'
 if(thread.outcome==='actual')return '已经发生的回响'
 if(thread.outcome==='non-success')return '这次选择留下的记录'
 if(thread.stage==='planned')return '已安排 · 尚未开工'
 if(thread.stage==='delivery')return '制作完成 · 等你提交'
 if(thread.wait)return '已经答应 · 仍在等待'
 return '眼前这件事 · 由你决定'
}

/** A scene reads the original public thread; every action still uses the original command flow. */
export function OpeningMoment({p,headingRef,fallback,feedback,focus,onFocus,onNavigate,onExplore}:Props){
 const [objectOpen,setObjectOpen]=useState(false),[directions,setDirections]=useState(false),[localFocus,setLocalFocus]=useState<OpeningFocus|null>(null)
 const chooseFocus=onFocus??setLocalFocus
 const thread=playerThread(p,onFocus?focus:localFocus),w=p.features.workbench,first=p.features.firstOrder
 const ownDelivery=thread.focus.kind==='first-order'&&first.status==='awaiting_submission'
 const shortage=w.finance.find(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date))
 const otherAttention=w.pause!==null||!!shortage||w.events.some(e=>e.isBlocking||e.presentation!=='ordinary')||p.features.story.incidents.some(i=>i.resolvedAt===null&&!['normal','resolved'].includes(i.stage))
 const interrupted=thread.responsibilityOverrideNeeded&&(!ownDelivery||otherAttention)
 const attention:Moment=interrupted&&fallback.stage!=='attention'&&fallback.object!=='一封需要面对的来信'?{
  stage:'attention',object:shortage?'账本里需要面对的责任':'日历上的来信',title:shortage?'先把眼前的账，认真看清。':'日历里，有件事需要先回应。',line:shortage?'已经到期的付款或真实资金缺口仍在，原来的尝试会留在这里。':'先看看这件事为什么需要回应，再回到原来的尝试。',detail:'原承诺、费用与日期都保留；翻看不会替你接受新的安排。',inspect:{screen:shortage?'finance' as const:'quarter' as const,label:shortage?'核对原账与到期责任':'读这件需要回应的事',...(shortage?{accountId:shortage.accountId}:{})}}
  :fallback
 const moment=interrupted?attention:thread
 const inspect=()=>{
  setObjectOpen(false)
  if(interrupted){const target=attention.inspect;onNavigate(target?.screen??'quarter',target?{...(target.accountId?{accountId:target.accountId}:{}),...(target.personId?{personId:target.personId}:{}),...(target.lifeSelection?{lifeSelection:target.lifeSelection}:{})}:undefined)}
  else onNavigate(thread.inspect.screen,thread.inspect.target)
 }
 const canWait=p.view.phase==='playing'&&!w.atQuarterEnd&&!w.progression.requiresDelivery&&w.pause===null
 const requested=moment.wait?.date??w.progression.nextQuarterDate??w.progression.nextDate
 const safeDate=canWait?playableAdvanceDate(w,p.view.date,requested):null
 const waitLabel=moment.wait&&safeDate===moment.wait.date?moment.wait.label:'先到日历上的下一处反馈'
 const employed=w.employment.some(e=>e.segments.some(s=>s.to===null))
 const market=thread.focus.kind==='market',free=thread.focus.kind==='free'
 const canChooseOrder=!interrupted&&market&&(!thread.wait&&!thread.command)&&thread.outcome!=='actual'
 const research=w.researches.find(r=>r.id==='market-overview')
 const closeRequest:GamePanelProps['request']=(...args)=>{setObjectOpen(false);setDirections(false);p.request(...args)}
 const nearProps={...p,request:closeRequest}
 const action=(index:string,label:string,caption:string,perform:()=>void)=> <button type="button" className={'moment-decision'+(index==='01'?' moment-primary':'')} onClick={perform}><b aria-hidden="true">{index}</b><span>{label}<small>{caption}</small></span><i aria-hidden="true">↗</i></button>
 const originalAction=(near=false,openOrder?:()=>void)=>{
  const current=near?nearProps:p
  if(canChooseOrder&&openOrder)return action('01','选择一份模拟委托','自己选标的、股数、价格和期限',()=>{setObjectOpen(false);openOrder()})
  if(moment.command)return <CommandButton {...current} {...moment.command} confirm={moment.command.confirm??true} className="moment-decision moment-primary"><b aria-hidden="true">01</b><span>{moment.command.label}<small>看清投入，再由你确认</small></span><i aria-hidden="true">→</i></CommandButton>
  if(moment.wait&&safeDate)return <div className="moment-wait moment-primary"><ClockAdvance p={current} date={safeDate} label={waitLabel+' · '+safeDate} room/></div>
  if(!interrupted&&free&&thread.stage==='choose')return <CommandButton {...current} kind="StartLifeWork" payload={{kind:'rest',personId:null,reference:null}} label="把七天留给自己" confirm className="moment-decision moment-primary"><b aria-hidden="true">01</b><span>把七天留给自己<small>个人0元 · 本季1点 · 七日后看到实际结果</small></span><i aria-hidden="true">→</i></CommandButton>
  if(!interrupted&&thread.stage==='paid')return action('01','看看这份手艺，还能用在哪里','了解眼下可做的作品，不自动接下一单',()=>{setObjectOpen(false);onNavigate('video',{accountId:'personal'})})
  return action('01',interrupted?attention.inspect?.label??'先面对眼前的事':thread.inspect.label,'翻开同一件事的原记录',inspect)
 }
 return <MarketSceneChoice p={p} onFullRecord={inspect}>{openOrder=><><p className="opening-room-intention"><span>我想{thread.wish.label}</span><span>{thread.attempt}</span><button type="button" onClick={()=>setDirections(true)}>换个念头 ↗</button></p>
 <section className="room-current-moment opening-current-moment" data-stage={moment.stage} aria-label="眼前这一幕">
  <header className="moment-heading"><p>{w.quarter} / {moment.object}</p><h1 ref={headingRef} tabIndex={-1}>{moment.title}</h1></header>
  <p className="opening-room-stage">{interrupted?'先面对这项原责任':stageLabel(thread)}{interrupted?<span> · 原来的关注仍保留</span>:null}</p>
  <div className="moment-story" aria-label="眼前的情况">
   {feedback?<div className={typeof feedback==='string'?'moment-status':'moment-feedback'} role={typeof feedback==='string'?'status':undefined}>{feedback}</div>:null}
   <p className="moment-line">{moment.line}</p><p className="moment-terms">{moment.detail}</p>
  </div>
  <div className="moment-decisions">
   {originalAction(false,openOrder)}
   {!interrupted&&thread.secondaryCommand?<CommandButton {...p} {...thread.secondaryCommand} className="moment-decision"><b aria-hidden="true">02</b><span>{thread.secondaryCommand.label}<small>按原记录核对这次决定</small></span><i aria-hidden="true">→</i></CommandButton>
    :!interrupted&&canChooseOrder&&research&&!research.state?<CommandButton {...p} kind="ResearchMarket" payload={{definitionId:research.id}} label="先把公开产业线索理一理" confirm className="moment-decision"><b aria-hidden="true">02</b><span>先把公开产业线索理一理<small>个人{moneyText(research.costFen)} · {research.actionPoints}点 · {research.days}日，不代你买股</small></span><i aria-hidden="true">→</i></CommandButton>
    :!interrupted&&!employed&&!market&&moment.command?.kind!=='WorkQuarter'?<CommandButton {...p} kind="WorkQuarter" payload={{}} label="先保留这一季的工作" confirm className="moment-decision"><b aria-hidden="true">02</b><span>先保留这一季的工作<small>共享本季2点 · 按实际在岗日领工资，可与副业组合</small></span><i aria-hidden="true">→</i></CommandButton>
    :!interrupted? action('02',thread.outcome==='actual'?'给接下来的日子，留一点余地':'等候时，也看看生活','先翻阅工作、休整和在意的人',()=>setDirections(true)):null}
   <button type="button" className="moment-explore" onClick={onExplore}>{interrupted?'先翻阅其他已知记录':'环顾房间，想想别的可能'} <span aria-hidden="true">↗</span></button>
  </div>
 </section>
  <OpeningObject kind={interrupted?'calendar':objectKind(thread)} title={moment.object} detail={moment.wait?moment.wait.date+' · '+moment.wait.label:interrupted?'这项责任仍需你回应':thread.outcome==='actual'?'回响已有实际记录':'翻开，看清这次选择'} stageLabel={interrupted?'先面对原责任':stageLabel(thread)} actionLabel="走近这件事" disabled={p.view.busy} textOnly={p.textOnly===true} onActivate={()=>setObjectOpen(true)}/>
  {objectOpen?<Dialog title={moment.object} className="opening-paper" onClose={()=>setObjectOpen(false)}><p className="opening-paper-date">{p.view.date} · {interrupted?'原责任':stageLabel(thread)}</p><h3>{moment.title}</h3><p>{moment.line}</p><p className="opening-paper-terms">{moment.detail}</p>{originalAction(true,openOrder)}{!interrupted&&thread.stage==='offer'?<div className="opening-paper-alternatives"><CommandButton {...nearProps} kind="DeclineOffer" payload={{offerId:first.offerId}} label="婉拒这笔报价" confirm/><CommandButton {...nearProps} kind="SkipOffer" payload={{offerId:first.offerId}} label="先跳过这次小单" confirm/></div>:null}<button type="button" className="scene-text-action" onClick={inspect}>翻看同一件事的全部原记录 ↗</button></Dialog>:null}
  {directions?<Dialog title="下一段日子，先留给什么？" className="opening-paper" onClose={()=>setDirections(false)}><p>你想{thread.wish.label}。眼前的一次尝试，并不要求把所有路都走一遍。</p><p>{thread.yearQuestion} 工作、自己的尝试和生活共享本季四点，可以组合，也可以暂缓。</p><div className="opening-directions">
   <button type="button" onClick={()=>{chooseFocus({runId:p.view.runId,kind:'first-order',accountId:'personal',entityId:first.contractId??first.offerId});setDirections(false)}}>回到那份手工委托<span>只切换关注，原报价、期限与已发生结果保留</span></button>
   <button type="button" onClick={()=>{chooseFocus({runId:p.view.runId,kind:'market',accountId:'personal',entityId:null});setDirections(false)}}>看看自己的投资判断<span>只切换关注，不下单或买股</span></button>
   <button type="button" onClick={()=>{chooseFocus({runId:p.view.runId,kind:'life',selection:'rest',accountId:'personal',entityId:null});setDirections(false)}}>把一段时间，留给自己<span>先看休整的日期与投入，再另行确认</span></button>
   <button type="button" onClick={()=>{chooseFocus({runId:p.view.runId,kind:'work',accountId:'personal',entityId:null});setDirections(false)}}>留好这一季的工作<span>只看原工作与可用安排，不自动在岗</span></button>
  </div><button type="button" className="scene-text-action" onClick={()=>{setDirections(false);onExplore()}}>暂不新增安排，环顾房间 ↗</button></Dialog>:null}
 </>}</MarketSceneChoice>
}
