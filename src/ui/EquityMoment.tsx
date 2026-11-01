import {useState,type Ref,type ReactNode} from 'react'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import {RoomTableau} from './RoomTableau.tsx'
import {EquityPaper} from './EquityPaper.tsx'
import {EquitySceneChoice} from './EquitySceneChoice.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'
import {equityCurrentDecision,equityFocusFor,equityJourneyFor,type EquityOpeningFocus} from './equity-player-thread.ts'
import {equityTargetEntity,type EquitySceneTarget} from './equity-scene-target.ts'
import type {EquityChoiceIntent,EquityJourneyAction} from './equity-journey.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {playableAdvanceDate,PLAYABLE_THROUGH} from '../application/playable-advance.ts'
import {TodayScene} from './TodayScene.tsx'
import {todayThread} from './today-thread.ts'
import {dayPerspectiveCurrent,type DayPerspective} from './day-perspective.ts'
import {wishes} from './game-text.ts'
import './ecosystem-scene.css'
import {equityStageCopy} from './equity-stage-copy.ts'

type Props={p:GamePanelProps;focus:EquityOpeningFocus;focusQuarter?:string|null|undefined;headingRef:Ref<HTMLHeadingElement>;feedback?:ReactNode;onFocus:(focus:OpeningFocus)=>void;onNavigate:NavigateScene;onExplore:()=>void;onToday?:undefined|(()=>void);onRecollection?:undefined|(()=>void)}
export function EquityMoment({p,focus,focusQuarter,headingRef,feedback,onFocus,onNavigate,onExplore,onToday,onRecollection}:Props){
 const [panel,setPanel]=useState<{key:string;intent:EquityChoiceIntent}|null>(null),[localToday,setLocalToday]=useState<DayPerspective|null>(null)
 const target=focus.equityTarget,journey=equityJourneyFor(p,focus),thread=playerThread(p,focus,focusQuarter),key=JSON.stringify([p.view.runId,focus.accountId,focus.entityId,target]),activePanel=panel?.key===key?panel.intent:null
 const closing=p.view.phase==='epilogue',copy=equityStageCopy(p,journey),globalProtection=p.view.readOnly||p.view.hasCandidate||['unsaved','conflict','saving'].includes(p.view.saveStatus)||p.view.busy
 const repeatedReadOnly=p.view.readOnly&&feedback==='当前为只读，请查看写入状态说明。'
 const ui=(label:string,activate:()=>void)=>makeSharedAction(p,label,activate,{allowReadOnly:true})
 const today=()=>ui(closing?'收好原权益记录，回到尾声':'收好原权益记录，回到今天',()=>{setPanel(null);if(onToday)onToday();else if(closing)onNavigate('room');else setLocalToday({runId:p.view.runId,revision:p.view.revision})}).activate()
 const choose=(next:EquitySceneTarget|null)=>ui('明确选择这份权益原对象',()=>{setPanel(null);onFocus(equityFocusFor(p,next,next?.accountId??'personal'))}).activate()
 const inspect=()=>ui('翻阅同一份权益原册',()=>{setPanel(null);onNavigate('deepseek',{accountId:focus.accountId,deepseekPane:'equity',...(target!==null||focus.entityId===null?{equityTarget:target}:{}),...(target?{recordId:equityTargetEntity(target)}:focus.entityId!==null?{recordId:focus.entityId}:{}),openRecord:true})}).activate()
 const open=(intent:EquityChoiceIntent)=>ui('核对这次权益选择',()=>setPanel({key,intent})).activate()
 const action:EquityJourneyAction=thread.focusStatus==='invalid'?{kind:'choice',intent:'objects',label:'明确重选这份权益原记录'}:journey.action
 const normalTimeEnded=p.view.phase!=='playing'||p.view.date>PLAYABLE_THROUGH||p.view.date===PLAYABLE_THROUGH&&p.features.workbench.atQuarterEnd
 const advance=action.kind==='wait'&&!thread.responsibilityOverrideNeeded?closing?p.features.journey?.nextTailDate??null:!normalTimeEnded?playableAdvanceDate(p.features.workbench,p.view.date,action.date>PLAYABLE_THROUGH?PLAYABLE_THROUGH:action.date):null:null
 const waitLabel=action.kind==='wait'&&advance!==null&&advance!==action.date?closing?'先过这次结算':advance===p.features.workbench.progression.quarterTarget?'先到本季末':'先过这个日子':copy.action
 const decision=(binding:SharedActionBinding,main:ReactNode)=>{
  const day=todayThread(p,focus,focusQuarter)
  if(day&&dayPerspectiveCurrent(p.view,localToday)&&!thread.responsibilityOverrideNeeded)return <TodayScene p={p} today={day} headingRef={headingRef} feedback={feedback} onFocus={next=>{onFocus(next);setLocalToday(null)}} onPrepare={onFocus} onResume={()=>setLocalToday(null)} onExplore={onExplore} onRecollection={onRecollection??inspect} onNavigate={onNavigate}/>
  const secondary=ui(action.kind==='today'?'再看看同一份权益的原选择':closing?'先回尾声，原事项和费用仍保留':'先回到今天，原安排与费用仍保留',action.kind==='today'?()=>open('next'):today),record=ui('翻阅同一份权益与原账',inspect)
  const activeJob=thread.focusStatus!=='invalid'&&journey.resolution.job&&['planned','running'].includes(journey.resolution.job.status),manageJob=ui('看看这次安排',()=>open('job'))
  const currentDecision=equityCurrentDecision(p,focus),scope=closing?'有限尾声 · 今天 '+p.view.date+(journey.originDate?' · 原事项 '+journey.originDate:''):currentDecision?'今天 '+p.view.date+(thread.focusQuarter&&thread.focusQuarter!==p.features.workbench.quarter?' · 来自'+thread.focusQuarter:''):thread.focusScope==='history'?'历史回看 · '+(thread.focusQuarter??'原日期'):thread.focusScope==='carry'?'旧安排继续 · '+thread.focusQuarter:'今天 '+p.view.date
  return <div className="ecosystem-stage equity-stage opening-room" data-exploring="false"><RoomTableau scene="equity" state={journey.phase} perspective={thread.focusScope} textOnly={p.textOnly}
   intention={<div className="opening-room-intention"><span>我想{wishes[p.view.playerProfile.wishId]}</span><button type="button" className="scene-text-action" onClick={()=>open('objects')}>换个关注 ↗</button>{onRecollection?<button type="button" className="scene-text-action" onClick={onRecollection}>翻本季手记 ↗</button>:null}</div>}
   heading={<div className="moment-heading"><p className="moment-overline">{closing?'有限尾声 / ':''}{thread.focusStatus==='invalid'?'先核对这份记录':'明确架空'}</p><h1 ref={headingRef} tabIndex={-1}>{thread.focusStatus==='invalid'?thread.title:copy.heading}</h1></div>}
   context={<><p className="moment-stage-label">{scope}</p><p>{thread.focusStatus==='invalid'?'先找回这份记录的来源。':copy.line}</p>{closing?<p>沿用2025年第四季行动；等候仍结算生活费与旧约。</p>:null}</>}
   feedback={feedback==='已从本机存档继续。'||repeatedReadOnly?null:feedback} facts={<>{thread.focusStatus==='invalid'?thread.invalidReason?<p role="alert">{thread.invalidReason}</p>:null:copy.facts.map(line=><p key={line}>{line}</p>)}</>}
   decisions={<>{main}<button type="button" className="moment-decision" disabled={secondary.disabled} onClick={secondary.activate}><b aria-hidden="true">02</b><span>{action.kind==='today'?'再作打算':closing?'先回尾声':'先过自己的日子'}</span><i aria-hidden="true">↗</i></button>{!closing?<button type="button" className="moment-explore" onClick={onExplore}>环顾房间 ↗</button>:null}</>}
   object={<EquityPaper p={p} journey={journey} binding={{...binding,label:thread.focusStatus==='invalid'?binding.label:action.kind==='wait'?advance!==null?waitLabel:binding.label:copy.action}} unavailable={thread.focusStatus==='invalid'} {...(action.kind==='wait'?{actionHint:advance===null?binding.label:waitLabel}:{})}/>}
   record={<><span className={'equity-record-links'+(closing?' equity-record-navigation':'')}>{activeJob?<button type="button" className="scene-text-action" disabled={manageJob.disabled} onClick={manageJob.activate}>看看这次安排 ↗</button>:null}<button type="button" className="scene-text-action" disabled={record.disabled} onClick={record.activate}>翻开手记 ↗</button>{closing?<button type="button" className="scene-text-action" onClick={onExplore}>回到尾声，看看其它旧约 ↗</button>:null}</span>{binding.reason&&!globalProtection?<p className="reason">{binding.reason}</p>:null}</>}/>
   {activePanel?<EquitySceneChoice p={p} target={target} intent={activePanel} sourceInvalid={thread.focusStatus==='invalid'} sourceReason={thread.invalidReason??null} onClose={()=>setPanel(null)} onChoose={choose} onIntent={open} onInspect={inspect} onToday={today}/>:null}
  </div>
 }
 const button=(binding:SharedActionBinding,_hint:string)=><button type="button" className="moment-decision moment-primary" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{thread.focusStatus==='invalid'?binding.label:copy.action}</span><i aria-hidden="true">→</i></button>
 if(action.kind==='command')return <CommandButton {...p} kind={action.command} payload={action.payload} label={action.label} confirm={action.confirm} className="moment-decision moment-primary" renderAction={binding=>decision(binding,button(binding,'先看清架空边界，实际投入仍由你另选'))}/>
 if(action.kind==='wait'&&advance)return <ClockAdvance showReason={!globalProtection} p={p} date={advance} label={waitLabel+' · '+advance} room renderAction={binding=>decision(binding,<div className="moment-wait moment-primary"><div className="clock-advance clock-advance-room">{binding.reviewNode}{binding.mainNode}</div></div>)}/>
 if(action.kind==='wait'){
  const binding=ui(normalTimeEnded?'回到住处，核对原收尾与旧约':'先回住处，回应日历里的原责任',()=>onNavigate('room'))
  return decision(binding,button(binding,'原款、原任务和原日期仍保留，不自动完成或转让。'))
 }
 const binding=ui(action.label,action.kind==='today'?today:()=>open(action.intent))
 return decision(binding,button(binding,thread.focusStatus==='invalid'?'先核对原身份，重选只改变眼前的阅读位置。':journey.finishWhen))
}
