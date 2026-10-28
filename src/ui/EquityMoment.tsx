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

type Props={p:GamePanelProps;focus:EquityOpeningFocus;focusQuarter?:string|null|undefined;headingRef:Ref<HTMLHeadingElement>;feedback?:ReactNode;onFocus:(focus:OpeningFocus)=>void;onNavigate:NavigateScene;onExplore:()=>void;onToday?:undefined|(()=>void);onRecollection?:undefined|(()=>void)}
export function EquityMoment({p,focus,focusQuarter,headingRef,feedback,onFocus,onNavigate,onExplore,onToday,onRecollection}:Props){
 const [panel,setPanel]=useState<{key:string;intent:EquityChoiceIntent}|null>(null),[localToday,setLocalToday]=useState<DayPerspective|null>(null)
 const target=focus.equityTarget,journey=equityJourneyFor(p,focus),thread=playerThread(p,focus,focusQuarter),key=JSON.stringify([p.view.runId,focus.accountId,focus.entityId,target]),activePanel=panel?.key===key?panel.intent:null
 const ui=(label:string,activate:()=>void)=>makeSharedAction(p,label,activate,{allowReadOnly:true})
 const today=()=>ui('收好原权益记录，回到今天',()=>{setPanel(null);if(onToday)onToday();else setLocalToday({runId:p.view.runId,revision:p.view.revision})}).activate()
 const choose=(next:EquitySceneTarget|null)=>ui('明确选择这份权益原对象',()=>{setPanel(null);onFocus(equityFocusFor(p,next,next?.accountId??'personal'))}).activate()
 const inspect=()=>ui('翻阅同一份权益原册',()=>{setPanel(null);onNavigate('deepseek',{accountId:focus.accountId,deepseekPane:'equity',...(target!==null||focus.entityId===null?{equityTarget:target}:{}),...(target?{recordId:equityTargetEntity(target)}:focus.entityId!==null?{recordId:focus.entityId}:{}),openRecord:true})}).activate()
 const open=(intent:EquityChoiceIntent)=>ui('核对这次权益选择',()=>setPanel({key,intent})).activate()
 const action:EquityJourneyAction=thread.focusStatus==='invalid'?{kind:'choice',intent:'objects',label:'明确重选这份权益原记录'}:journey.action
 const normalTimeEnded=p.view.phase!=='playing'||p.view.date>PLAYABLE_THROUGH||p.view.date===PLAYABLE_THROUGH&&p.features.workbench.atQuarterEnd
 const advance=action.kind==='wait'&&!normalTimeEnded&&!thread.responsibilityOverrideNeeded?playableAdvanceDate(p.features.workbench,p.view.date,action.date>PLAYABLE_THROUGH?PLAYABLE_THROUGH:action.date):null
 const waitLabel=action.kind==='wait'&&advance!==null&&advance!==action.date?advance===p.features.workbench.progression.quarterTarget?'先到本季末，原安排仍保留':'先到原日历的这一处反馈':action.label
 const decision=(binding:SharedActionBinding,main:ReactNode)=>{
  const day=todayThread(p,focus,focusQuarter)
  if(day&&dayPerspectiveCurrent(p.view,localToday)&&!thread.responsibilityOverrideNeeded)return <TodayScene p={p} today={day} headingRef={headingRef} feedback={feedback} onFocus={next=>{onFocus(next);setLocalToday(null)}} onPrepare={onFocus} onResume={()=>setLocalToday(null)} onExplore={onExplore} onRecollection={onRecollection??inspect} onNavigate={onNavigate}/>
  const secondary=ui(action.kind==='today'?'再看看同一份权益的原选择':'先回到今天，原安排与费用仍保留',action.kind==='today'?()=>open('next'):today),record=ui('翻阅同一份权益与原账',inspect)
  const currentDecision=equityCurrentDecision(p,focus),scope=currentDecision?'今天 '+p.view.date+(thread.focusQuarter?' · 原来源 '+thread.focusQuarter:''):thread.focusScope==='history'?'历史回看 · '+(thread.focusQuarter??'原日期'):thread.focusScope==='carry'?'旧安排继续 · '+thread.focusQuarter:'今天 '+p.view.date
  return <div className="ecosystem-stage equity-stage opening-room" data-exploring="false"><RoomTableau scene="equity" state={journey.phase} perspective={thread.focusScope} textOnly={p.textOnly}
   intention={<div className="opening-room-intention"><span>我想{wishes[p.view.playerProfile.wishId]}</span><button type="button" className="scene-text-action" onClick={()=>open('objects')}>换一份权益原对象 ↗</button>{onRecollection?<button type="button" className="scene-text-action" onClick={onRecollection}>翻本季留页 ↗</button>:null}</div>}
   heading={<div className="moment-heading"><p className="moment-overline">{journey.object}</p><h1 ref={headingRef} tabIndex={-1}>{thread.focusStatus==='invalid'?thread.title:journey.title}</h1></div>}
   context={<><p className="moment-stage-label">{scope}</p><p>{journey.line}</p></>}
   feedback={feedback} facts={<>{thread.focusStatus==='invalid'&&thread.invalidReason?<p role="alert">{thread.invalidReason}</p>:null}{journey.facts.map(line=><p key={line}>{line}</p>)}</>}
   decisions={<>{main}<button type="button" className="moment-decision" disabled={secondary.disabled} onClick={secondary.activate}><b aria-hidden="true">02</b><span>{secondary.label}<small>{action.kind==='today'?'新的一笔投入仍由你另选并核对':'持股、原款和未完任务都按自己的记录继续'}</small></span><i aria-hidden="true">↗</i></button><button type="button" className="moment-explore" onClick={onExplore}>环顾房间，想想别的可能 ↗</button></>}
   object={<EquityPaper p={p} journey={journey} binding={binding} {...(action.kind==='wait'?{actionHint:advance===null?binding.label:waitLabel}:{})}/>}
   record={<><button type="button" className="scene-text-action" disabled={record.disabled} onClick={record.activate}>{record.label} ↗</button>{binding.reason?<p className="reason">{binding.reason}</p>:null}</>}/>
   {activePanel?<EquitySceneChoice p={p} target={target} intent={activePanel} sourceInvalid={thread.focusStatus==='invalid'} sourceReason={thread.invalidReason??null} onClose={()=>setPanel(null)} onChoose={choose} onIntent={open} onInspect={inspect} onToday={today}/>:null}
  </div>
 }
 const button=(binding:SharedActionBinding,hint:string)=><button type="button" className="moment-decision moment-primary" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{binding.label}<small>{hint}</small></span><i aria-hidden="true">→</i></button>
 if(action.kind==='command')return <CommandButton {...p} kind={action.command} payload={action.payload} label={action.label} confirm={action.confirm} className="moment-decision moment-primary" renderAction={binding=>decision(binding,button(binding,'先看清架空边界，实际投入仍由你另选'))}/>
 if(action.kind==='wait'&&advance)return <ClockAdvance p={p} date={advance} label={waitLabel+' · '+advance} room renderAction={binding=>decision(binding,<div className="moment-wait moment-primary"><div className="clock-advance clock-advance-room">{binding.reviewNode}{binding.mainNode}</div></div>)}/>
 if(action.kind==='wait'){
  const binding=ui(normalTimeEnded?'回到住处，核对原收尾与旧约':'先回住处，回应日历里的原责任',()=>onNavigate('room'))
  return decision(binding,button(binding,'原款、原任务和原日期仍保留，不自动完成或转让。'))
 }
 const binding=ui(action.label,action.kind==='today'?today:()=>open(action.intent))
 return decision(binding,button(binding,journey.finishWhen))
}
