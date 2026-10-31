import {useEffect,useRef,useState,type Ref,type ReactNode} from 'react'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import {RoomTableau} from './RoomTableau.tsx'
import {EcosystemPaper} from './EcosystemPaper.tsx'
import {EcosystemSceneChoice} from './EcosystemSceneChoice.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'
import {ecosystemCurrentDecision,ecosystemFocusFor,ecosystemJourneyFor,type EcosystemOpeningFocus} from './ecosystem-player-thread.ts'
import {ecosystemCalendarStatus,ecosystemUiStatus} from './ecosystem-ui-status.ts'
import {ecosystemTargetEntity,type EcosystemSceneTarget} from './ecosystem-scene-target.ts'
import type {EcosystemChoiceIntent} from './ecosystem-journey.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {playableAdvanceDate,PLAYABLE_THROUGH} from '../application/playable-advance.ts'
import {TodayScene} from './TodayScene.tsx'
import {todayThread} from './today-thread.ts'
import {dayPerspectiveCurrent,type DayPerspective} from './day-perspective.ts'
import {wishes} from './game-text.ts'

type Props={p:GamePanelProps;focus:EcosystemOpeningFocus;focusQuarter?:string|null|undefined;headingRef:Ref<HTMLHeadingElement>;feedback?:ReactNode;onFocus:(focus:OpeningFocus)=>void;onNavigate:NavigateScene;onExplore:()=>void;onToday?:undefined|(()=>void);onRecollection?:undefined|(()=>void)}
export function EcosystemMoment({p,focus,focusQuarter,headingRef,feedback,onFocus,onNavigate,onExplore,onToday,onRecollection}:Props){
 const [panel,setPanel]=useState<{key:string;intent:EcosystemChoiceIntent}|null>(null),[localToday,setLocalToday]=useState<DayPerspective|null>(null)
 const stage=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  const choose=(event:KeyboardEvent)=>{
   const root=stage.current,target=event.target
   if(!root||root.closest('.game-app')?.getAttribute('data-screen')!=='deepseek'||event.defaultPrevented||event.repeat||event.isComposing||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey||!/^\d$/.test(event.key)||document.querySelector('dialog[open]'))return
   if(!(target instanceof Element)||!(target===document.body||target===document.getElementById('main-content')||root.contains(target)&&target.tagName==='H1'))return
   const buttons=root.querySelectorAll<HTMLButtonElement>('.moment-decisions>.command>button,.moment-decisions>button,.moment-wait .clock-main>button'),button=buttons[Number(event.key)-1]
   if(button&&!button.disabled&&!button.inert&&button.getClientRects().length){event.preventDefault();button.click()}
  }
  document.addEventListener('keydown',choose);return()=>document.removeEventListener('keydown',choose)
 },[])
 const target=focus.ecosystemTarget,journey=ecosystemJourneyFor(p,focus),thread=playerThread(p,focus,focusQuarter),key=JSON.stringify([p.view.runId,focus.accountId,target]),activePanel=panel?.key===key?panel.intent:null
 const ui=(label:string,activate:()=>void)=>makeSharedAction(p,label,activate,{allowReadOnly:true})
 const today=()=>ui('合上原记录，回到今天',()=>{setPanel(null);if(onToday)onToday();else setLocalToday({runId:p.view.runId,revision:p.view.revision})}).activate()
 const choose=(next:EcosystemSceneTarget|null)=>ui('明确选择这份原生态对象',()=>{setPanel(null);onFocus(ecosystemFocusFor(p,next,next?.accountId??'personal'))}).activate()
 const inspect=()=>ui('翻阅同一份合作的全部原记录',()=>{setPanel(null);onNavigate('deepseek',{accountId:focus.accountId,deepseekPane:'ecosystem',ecosystemTarget:target,...(target?{recordId:ecosystemTargetEntity(target)}:{}),openRecord:true})}).activate()
 const open=(intent:EcosystemChoiceIntent)=>ui('核对这次原决定',()=>setPanel({key,intent})).activate()
 const action=journey.action
 const normalTimeEnded=p.view.phase!=='playing'||p.view.date>PLAYABLE_THROUGH||p.view.date===PLAYABLE_THROUGH&&p.features.workbench.atQuarterEnd
 const globalProtection=p.view.readOnly||p.view.hasCandidate||p.view.busy||['saving','unsaved','conflict'].includes(p.view.saveStatus)
 const advance=action.kind==='wait'&&!normalTimeEnded&&!thread.responsibilityOverrideNeeded?playableAdvanceDate(p.features.workbench,p.view.date,action.date>PLAYABLE_THROUGH?PLAYABLE_THROUGH:action.date):null
 const statusFeedback=ecosystemUiStatus(feedback,p.view.date),calendarStatus=ecosystemCalendarStatus(feedback,p.view.date),currentDecision=ecosystemCurrentDecision(p,focus)
 const title=thread.focusStatus==='invalid'?thread.title:journey.title
 const waitLabel=action.kind==='wait'&&advance!==null&&advance!==action.date?advance===p.features.workbench.progression.quarterTarget?'先到本季末，原安排仍保留':'先到原日历的这一处反馈':action.label
 const choiceLabel=action.kind==='wait'&&advance!==null?waitLabel+' · '+advance:action.label
 const entryDirections=p.view.phase==='playing'&&target===null&&journey.resolution.status==='entry'&&thread.focusStatus!=='invalid'&&!thread.responsibilityOverrideNeeded
 const decision=(binding:SharedActionBinding,main:ReactNode)=>{
  const day=todayThread(p,focus,focusQuarter)
  if(day&&dayPerspectiveCurrent(p.view,localToday)&&!thread.responsibilityOverrideNeeded)return <TodayScene p={p} today={day} headingRef={headingRef} feedback={feedback} onFocus={next=>{onFocus(next);setLocalToday(null)}} onPrepare={onFocus} onResume={()=>setLocalToday(null)} onExplore={onExplore} onRecollection={onRecollection??inspect} onNavigate={onNavigate}/>
  const contract=journey.resolution.contract,finished=contract&&['completed','cancelled'].includes(contract.status),responding=action.kind==='choice'&&action.intent==='remediation'
  const businessClosed=journey.phase==='business-closed'&&journey.resolution.status==='valid'&&target?.kind==='business'
  const secondaryLabel=action.kind==='today'?'看看这间企业，下一步有哪些条件':finished?'先回到今天，未收的原款仍保留':responding?'先回到今天，保留这份约定':journey.active&&contract?'核对这份合作的原款与退出选择':'先回到今天，给生活留些余地'
  const secondaryHint=businessClosed?'显选原对象，或查看下一次投入条件。':entryDirections?'服务合同与出资分别决定；不必先开服务企业，查看不付款或持股。':action.kind==='today'?'先看看当前条件；新的合作由你另选':finished?'留着这次合作的账，去安排今天':responding?'旧约和预款保护都在，生活仍由你安排':journey.active&&contract?'待收款、退款和支持责任，分别看清':'原来的安排还在，也可以先过自己的日子'
  const business=journey.resolution.business
  const nextBusiness=()=>business?choose({runId:p.view.runId,accountId:business.accountId,businessId:business.id,kind:'business'}):open('business')
  const secondary=ui(businessClosed?'翻看其它合作记录':entryDirections?'另看明确架空的出资选择':secondaryLabel,businessClosed?()=>open('objects'):entryDirections?()=>{setPanel(null);onNavigate('deepseek',{deepseekPane:'equity',equityTarget:null,accountId:'personal'})}:action.kind==='today'?nextBusiness:finished||responding?today:journey.active&&contract?()=>open('next'):today),record=ui('翻阅同一份合作与原账',inspect)
  const leaveEntry=entryDirections?ui('先回到今天，给生活留些余地',today):null
  return <div ref={stage} className="ecosystem-stage opening-room" data-exploring="false"><RoomTableau scene="ecosystem" state={journey.phase} perspective={thread.focusScope} textOnly={p.textOnly}
   intention={<div className="opening-room-intention"><span>我想{wishes[p.view.playerProfile.wishId]}</span><button type="button" className="scene-text-action" onClick={()=>open('objects')}>换一份原对象 ↗</button>{onRecollection?<button type="button" className="scene-text-action" onClick={onRecollection}>翻本季留页 ↗</button>:null}</div>}
   heading={<div className="moment-heading"><p className="moment-overline">{journey.object}</p><h1 ref={headingRef} tabIndex={-1}>{title}</h1></div>}
   context={<><p className="moment-stage-label">{currentDecision?'今天 '+p.view.date+(thread.focusQuarter?' · '+(target?.kind==='lead'?'原需求来自':target?.kind==='business'?'原企业始于':'原合作来自')+thread.focusQuarter:''):thread.focusScope==='history'?'历史回看 · '+(thread.focusQuarter??'原日期'):thread.focusScope==='carry'?'旧约定继续 · '+thread.focusQuarter:'今天 '+p.view.date+' · '+(journey.outcome==='actual'?'已经发生的回响':journey.outcome==='non-success'?'实际停下或受挫':'眼前的这一步')}</p><p>{!currentDecision&&thread.focusScope==='carry'?'这件事从'+thread.focusQuarter+'留下，仍按原约继续。 ':''}{journey.line}</p></>}
   feedback={statusFeedback===null&&calendarStatus===null?feedback:null} facts={<>{journey.facts.map(line=><p key={line}>{line}</p>)}</>}
   decisions={<>{main}<button type="button" className="moment-decision" disabled={secondary.disabled} onClick={secondary.activate}><b aria-hidden="true">02</b><span>{secondary.label}<small>{secondaryHint}</small></span><i aria-hidden="true">↗</i></button>{leaveEntry?<button type="button" className="moment-explore" disabled={leaveEntry.disabled} onClick={leaveEntry.activate}>{leaveEntry.label} ↗</button>:<button type="button" className="moment-explore" onClick={onExplore}>环顾房间，想想别的可能 ↗</button>}</>}
   object={<EcosystemPaper p={p} journey={journey} binding={binding} {...(action.kind==='wait'?{actionHint:advance===null?binding.label:waitLabel}:{})}/>}
   record={<><button type="button" className="scene-text-action" disabled={record.disabled} onClick={record.activate}>{record.label} ↗</button>{statusFeedback?<p className="moment-status" role="status">{statusFeedback}</p>:null}{calendarStatus?<div className="ecosystem-reading-status">{calendarStatus}</div>:null}{!globalProtection&&binding.reason?<p className="reason">{binding.reason}</p>:null}</>}/>
   {activePanel?<EcosystemSceneChoice p={p} target={target} intent={activePanel} onClose={()=>setPanel(null)} onChoose={choose} onInspect={inspect} onToday={today}/>:null}
  </div>
 }
 if(action.kind==='command')return <CommandButton {...p} kind={action.command} payload={action.payload} label={action.label} confirm={action.confirm} className="moment-decision moment-primary" renderAction={decision}><b aria-hidden="true">01</b><span>{action.label}<small>{action.command==='SubmitEcoDelivery'?'交出之后，等这位客户回应':'启用之后，再决定要承接谁的需求'}</small></span><i aria-hidden="true">→</i></CommandButton>
 if(action.kind==='wait'&&advance)return <ClockAdvance p={p} date={advance} label={choiceLabel} room showReason={!globalProtection} renderAction={binding=>decision(binding,<div className="moment-wait moment-primary"><div className="clock-advance clock-advance-room">{binding.reviewNode}{binding.mainNode}</div></div>)}/>
 if(action.kind==='wait'){
  const binding=ui(normalTimeEnded?'回到住处，核对收尾与原约':'先回住处，回应日历里的原责任',()=>onNavigate('room'))
  return decision(binding,<button type="button" className="moment-decision moment-primary" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{binding.label}<small>{normalTimeEnded?'旧款和未完约定仍保留，后续沿原收尾入口继续。':'处理眼前的原责任后，还能回来核对这一份。'}</small></span><i aria-hidden="true">↗</i></button>)
 }
 const binding=ui(action.label,action.kind==='today'?today:()=>open(action.kind==='choice'?action.intent:'record'))
 return decision(binding,<button type="button" className="moment-decision moment-primary" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{binding.label}<small>{journey.finishWhen}</small></span><i aria-hidden="true">→</i></button>)
}
