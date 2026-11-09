import {makeSharedAction} from './shared-action.ts'
import {RouteObligationMoment,routeObligationReading} from './RouteObligationMoment.tsx'
import {obligationTargetFor,cashPauseTarget,type ObligationSceneTarget} from './obligation-scene.ts'
import {videoClientReplyReading} from './video-client-reply.ts'
import {videoClientSettlementReading} from './video-client-settlement.ts'
import {videoInquiryChoiceReading,videoPublicationFeedbackReading} from './video-publication-feedback.ts'
import {videoAccountAttemptReading} from './video-account-attempt.ts'
import {videoWorkStage} from './video-work-stage.ts'
import {courseEntryReading} from './course-entry-reading.ts'
import {courseStudioReading} from './course-studio-reading.ts'
import {courseLessonReading} from './course-lesson-preparation.ts'
import {courseAudienceReading} from './course-audience-reading.ts'
import {courseClassReading} from './course-class-reading.ts'
import {defaultWaitDate,defaultWaitLabel} from './default-wait-window.ts'
import {useState,useEffect,useRef,type Ref,type ComponentProps} from 'react'
import './life-choice-stage.css'
import './market-choice-stage.css'
import {LifeActionPause} from './LifeActionPause.tsx'
import {lifeActionPauseReading} from './life-action-pause.ts'
import {personalCompletionReading} from './personal-completion-reading.ts'
import {personInvitationLine,personTimeReading} from './person-time-reading.ts'
import {Dialog} from './Dialog.tsx'
import {singleSceneEvent,EventChoiceLetter} from './EventChoiceLetter.tsx'
import {SceneEcho,SceneTimeNotice,type EchoFrame} from './SceneEcho.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {ScreenBook} from './ScreenBook.tsx'
import type {GamePanelProps,LifeSceneMode,SceneTarget,NavigateScene} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import type {LifePerson} from '../core/life-schema.ts'
import {CommandButton} from './CommandButton.tsx'
import {PersonPortrait} from './PersonPortrait.tsx'
import {LifeContactBook} from './LifeContactBook.tsx'
import {PersonResultChoice,personResultReading} from './PersonResultChoice.tsx'
import {personMomentRecord} from './person-moment-record.ts'
import {PersonRecordReader} from './PersonRecordReader.tsx'
import {PersonalResultChoice,personalResultReading} from './PersonalResultChoice.tsx'
import {lifeSceneProgress,type LifeSceneSelection} from './life-scene-progress.ts'
import {LifeReferenceChoice} from './LifeReferenceChoice.tsx'
import {marketSceneProgress} from './market-scene-progress.ts'
import {openingFocusFor,playerThread} from './player-thread.ts'
import {MarketSceneChoice} from './MarketSceneChoice.tsx'
import {MarketResultChoices,marketResultReading} from './MarketResultChoices.tsx'
import {deepseekSceneProgress} from './deepseek-scene-progress.ts'
import {MarketRecordSwitch,DeepseekRecordSwitch} from './SceneRecordSwitch.tsx'
import {sceneThreads} from './scene-thread-notes.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {moneyText,playableThrough} from './game-text.ts'
import {videoSceneProgress,type VideoSceneTarget} from './video-scene-progress.ts'
import {VideoSceneChoice} from './VideoSceneChoice.tsx'
import {VideoEncounter} from './VideoEncounter.tsx'
import {CourseEncounter} from './CourseEncounter.tsx'
import {MemoryClippings} from './MemoryClippings.tsx'
import {CalendarChoices,calendarEntryAvailable} from './CalendarChoices.tsx'
import {isCourseContinuityThread} from './course-continuity.ts'
import {courseSceneProgress,type CourseSceneTarget} from './course-scene-progress.ts'
import {CourseSceneChoice,courseSceneContextReason} from './CourseSceneChoice.tsx'
import {CourseStageChoice} from './CourseStageChoice.tsx'
import {CoursePreparation,CoursePreparationTrail} from './CoursePreparation.tsx'
import {storySceneProgress} from './story-scene-progress.ts'
import {RiskInvestigationChoice,RiskLetter} from './RiskSceneChoice.tsx'
import {relaySceneProgress} from './relay-scene-progress.ts'
import {RelaySceneChoice,RelayServiceLetter} from './RelaySceneChoice.tsx'
import {relaySceneAdvanceDate,relayReviewDate,relayReviewLabel} from './relay-scene-clock.ts'
import {RelayEncounter} from './RelayEncounter.tsx'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import type {RelayChoiceDraftSlot} from './relay-preparation-draft.ts'

type Props=GamePanelProps&{
 screen:Screen;headingRef:Ref<HTMLHeadingElement>;personId:LifePerson
 onPerson:(id:LifePerson)=>void;onOpen:(screen?:Screen,target?:SceneTarget)=>void
 lifeMode?:LifeSceneMode;onLifeMode?:(mode:LifeSceneMode)=>void
 marketRecordId?:string|null
 videoTarget?:VideoSceneTarget|undefined;onVideoTargetChange?:((target:VideoSceneTarget)=>void)|undefined
 courseTarget?:CourseSceneTarget|null|undefined;onCourseTargetChange?:((target:CourseSceneTarget|null)=>void)|undefined
 relayTarget?:RelaySceneTarget|null|undefined;onRelayTargetChange?:((target:RelaySceneTarget|null)=>void)|undefined
 onPeople:()=>void;onYear:()=>void;onNavigate:NavigateScene
 storyIncidentId?:string|null;onStoryIncident?:(id:string)=>void;receipt:string|null;receiptBrief?:string|null;receiptKind?:string|null;echoFrame?:EchoFrame|null;onDismissReceipt?:()=>void
}
const stories:Record<Exclude<Screen,'room'|'routes'>,{overline:string;title:string;line:string;open:string}>={
 quarter:{overline:'这一季 / 把日子重新握在手里',title:'从眼前的一件事开始。',line:'工作、一个小单，或者留给自己的时间。你不必同时抓住所有机会。',open:'翻开本季日历'},
 market:{overline:'窗前 / 判断与等待',title:'把生活留好，再看远方。',line:'记忆不是明天的价格。一次研究、一个仓位，都要留下足够的余地。',open:'看看行情与自己的仓位'},
 video:{overline:'街角 / 有人需要的作品',title:'让一个念头，被人看见。',line:'2020年的第一步可以只是手工剪辑。制作、交付和客户回款，各有自己的时刻。',open:'去安排一份作品'},
 course:{overline:'教与学 / 值得交付的改变',title:'先把一件事做过，再认真教会。',line:'案例、样课和答疑，都是要亲自兑现的承诺。预售的钱还属于尚待完成的课。',open:'筹备课程与已经答应的课'},
 relay:{overline:'灯还亮着 / 每一次连接',title:'服务别人，也守住自己的边界。',line:'供应、客户和一笔笔用量，把这门生意连在一起。充值还不是利润。',open:'查看供应、客户与服务'},
 deepseek:{overline:'天将亮时 / 参与一种可能',title:'从真正的合作开始。',line:'技术服务、融资资格和拥有的权利，是不同的事。生态合作不会自动变成股权。',open:'寻找合作与核对参与条件'},
 life:{overline:'眼前生活 / 也给人留一点时间',title:'这一次，别只记得赚钱。',line:'有些选择不会变成利润，却会留下真实相处过的日子。',open:'翻看生活与已经答应的事'},
 memory:{overline:'书架旁 / 前世片段',title:'有些方向，依稀还记得。',line:'把趋势记在心里，把答案留给这一次的经历。阅读不会替你推进时间。',open:'翻开记忆与已经发生的新闻'},
 finance:{overline:'夜深了 / 算清自己的余地',title:'知道还剩多少，也记得欠着什么。',line:'现金、预款、持仓和股权，各有自己的去处。回顾不会把义务抹掉。',open:'摊开账本与本机存档'},
 story:{overline:'风向有变 / 留下自己的判断',title:'改变过什么，又要守住什么？',line:'把已经发生的事、尚待核实的信号和自己的权利分开看。停止不等于已经恢复。',open:'查看变化与需要面对的事'},
 routines:{overline:'日常还在继续 / 已确认的安排',title:'让答应过的事，有序发生。',line:'只有你确认过的范围才能执行。新的季度，仍要重新看看条件。',open:'翻看例行草稿与待办'},
}
const closingStories:Record<Exclude<Screen,'room'|'routes'>,{title:string;open:string}>={
 quarter:{title:'答应过的事，仍留在日历。',open:'核对原日历与全部责任'},
 market:{title:'持有过的判断，留下真实结果。',open:'核对原持仓与交收'},
 video:{title:'作品留下了，承诺也还在。',open:'核对原作品与回款'},
 course:{title:'教过的人，仍值得认真对待。',open:'核对原学员与交付'},
 relay:{title:'每次连接，都有原来的账。',open:'核对原客户与服务'},
 deepseek:{title:'合作与拥有，都各有边界。',open:'核对原协议与转让应收'},
 life:{title:'真正相处过的日子，留在这里。',open:'翻看原约定与生活记录'},
 memory:{title:'走过的片段，可以慢慢回看。',open:'翻开原记忆与历史记录'},
 finance:{title:'原来的账，一笔一笔看清。',open:'摊开账本与本机存档'},
 story:{title:'停下之后，还要看证据。',open:'核对旧风险与控制证据'},
 routines:{title:'确认过的范围，仍由你守住。',open:'核对原授权与未完步骤'},
}

function Choice({title,line,label,onClick,secondary=false,caption,intent='inspect'}:{title:string;line:string;label:string;onClick:()=>void;secondary?:boolean;caption?:string;intent?:'inspect'|'plan'}){
 return <button type="button" className={'scene-choice'+(secondary?' scene-choice-secondary':'')} data-interaction={intent} onClick={onClick} aria-label={label}><span className="scene-choice-overline">{intent==='plan'?'准备这次选择':'查看与翻阅'}</span><strong data-book-chapter={title}>{title}</strong><span className="scene-choice-line">{line}</span><span className="scene-choice-end">{caption??label}<span aria-hidden="true">{intent==='plan'?'→':'↗'}</span></span></button>
}
function Action({p,kind,payload,title,line,label,buttonLabel,compact=false,confirm=true}:{p:GamePanelProps;kind:string;payload:unknown;title:string;line:string;label:string;buttonLabel?:string;compact?:boolean;confirm?:boolean}){
 return <section className="scene-action scene-action-card"><span className="scene-choice-overline" data-interaction="decide">作出决定</span>{compact?null:<strong data-book-chapter={title}>{title}</strong>}<p className="scene-choice-line">{line}</p><CommandButton {...p} kind={kind} payload={payload} label={label} confirm={confirm} className="scene-decision-main"><span>{buttonLabel??label}</span><span aria-hidden="true">→</span></CommandButton></section>
}
function WaitChoice({p,date,title,line,label,displayLabel,compact=false}:{p:GamePanelProps;date:string;title:string;line:string;label:string;displayLabel?:string;compact?:boolean}){
 return <section className="scene-wait-decision"><span className="scene-choice-overline">等候，有自己的日子</span>{compact?null:<strong data-book-chapter={title}>{title}</strong>}<ClockAdvance p={p} date={date} label={label+' · '+date} {...(displayLabel?{displayLabel:displayLabel+' · '+date}:{})}/><p>{line}</p></section>
}

/** The visible button owns every preview and guard; a number never submits a command directly. */
function chooseWithNumber(root:HTMLElement,event:KeyboardEvent){
 if(event.defaultPrevented||event.repeat||event.isComposing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!/^[1-9]$/.test(event.key))return
 const target=event.target
 if(!(target instanceof Element)||target.closest('input,textarea,select,[contenteditable]:not([contenteditable=false])')||document.querySelector('dialog[open]'))return
 const responsibility=root.querySelector<HTMLButtonElement>('.route-obligation-primary')
 if(responsibility){if(event.key==='1'&&!responsibility.disabled&&!responsibility.inert&&!responsibility.closest('[inert]')){event.preventDefault();responsibility.click()}return}
 const number=Number(event.key)-1,direct=root.querySelector('.video-first-attempt-stage,.video-work-stage,.course-entry-stage,.course-studio-stage,.calendar-entry-stage,.market-choice-stage')
 if(direct){const cards=direct.querySelectorAll<HTMLElement>('.today-life-option'),button=direct.matches('.market-choice-stage')?direct.querySelectorAll<HTMLButtonElement>('.scene-decision-main>button,.clock-main>button,.scene-choices>.scene-choice')[number]:direct.matches('.calendar-entry-stage')?(cards.length?cards[number]?.querySelector<HTMLButtonElement>('button'):number===0?direct.querySelector<HTMLButtonElement>('.calendar-first-order button'):null):direct.querySelectorAll<HTMLButtonElement>('.scene-decision-main>button,.clock-main>button,.video-attempt-option,.video-attempt-more,.course-entry-option,.course-entry-details')[number];if(!button||button.disabled||button.inert||button.closest('[inert]')||!button.getClientRects().length)return;event.preventDefault();button.click();return}
 const choice=root.querySelectorAll<HTMLElement>('.scene-choices>.scene-choice,.scene-choices>.scene-action,.scene-choices>.scene-wait-decision')[number]
 // The calendar review is a secondary control inside one thought, never another numbered decision.
 const button=choice instanceof HTMLButtonElement?choice:choice?.querySelector<HTMLButtonElement>('.clock-main>button,.scene-decision-main>button')??choice?.querySelector<HTMLButtonElement>(':scope>button'),viewport=button?.closest('.book-viewport')??button?.closest('.life-choice-stage')
 if(!button||!viewport)return
 const bounds=viewport.getBoundingClientRect(),rect=button.getBoundingClientRect()
 if(!button.getClientRects().length)return
 if(button.inert||rect.left<bounds.left-1||rect.right>bounds.right+1||rect.top<bounds.top-1||rect.bottom>bounds.bottom+1){
  const jump=viewport.closest('.screen-book')?.querySelectorAll<HTMLButtonElement>('.book-decisions button')[number]
  if(jump&&!jump.disabled){event.preventDefault();jump.click()}
  return
 }
 if(button.disabled)return
 event.preventDefault();button.click()
}

function sceneCommitmentCount(p:GamePanelProps){
 const f=p.features,w=f.workbench
 return sceneThreads(f,p.view.date).length+w.events.filter(e=>e.presentation!=='ordinary'||e.isBlocking).length+
 w.finance.reduce((n,a)=>n+a.obligations.filter(o=>o.remainingFen>0&&o.date<=p.view.date).length+(a.protectionShortfallFen>0||a.commitmentShortfallFen>0?1:0),0)+(w.pause?1:0)
}

/** Known urgent facts stay outside the optional operation sheet. No facts are invented here. */
export function SceneAttention({p,onOpen,onStoryScene,onObligation}:{p:GamePanelProps;onOpen:(screen:Screen,accountId?:string)=>void;onStoryScene?:(incidentId:string|null)=>void;onObligation?:(target:ObligationSceneTarget)=>void}){
 const [open,setOpen]=useState(true)
 const w=p.features.workbench,short=w.finance.filter(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0)
 const due=w.finance.flatMap(a=>a.obligations.filter(o=>o.remainingFen>0&&o.date<=p.view.date).map(o=>({...o,accountId:a.accountId})))
 const forced=w.events.filter(e=>e.presentation!=='ordinary'||e.isBlocking),directEvent=singleSceneEvent(p)
 return short.length||due.length||forced.length||w.pause?<><button type="button" className="attention-pocket" onClick={()=>setOpen(true)}>有{short.length+due.length+forced.length+(w.pause?1:0)}件事需要面对 <span>翻开来信 →</span></button>{open?directEvent?<Dialog title={directEvent.title} layout="direct" className="event-choice-review" onClose={()=>setOpen(false)}><EventChoiceLetter p={p} event={directEvent}/></Dialog>:<Dialog title="不能略过的事" onClose={()=>setOpen(false)}><aside className="scene-attention" aria-label="不能略过的事">
  {short.map(a=><div role="alert" key={a.accountId}><strong>{a.accountId==='personal'?'个人':w.routes.find(r=>r.accountId===a.accountId)?.name??'企业'}承诺资金存在缺口 · {moneyText(Math.max(a.protectionShortfallFen,a.commitmentShortfallFen))}</strong><button type="button" onClick={()=>onOpen('finance',a.accountId)}>查看原账与责任</button></div>)}
  {due.map(o=><div role="alert" key={o.id}><strong>{o.accountId==='personal'?'个人':w.routes.find(r=>r.accountId===o.accountId)?.name??'企业'}到期未付 · {moneyText(o.remainingFen)} · {o.date}</strong><button type="button" onClick={()=>{const target=obligationTargetFor(p,o);if(target&&onObligation){makeSharedAction(p,'核对这笔到期款',()=>{setOpen(false);onObligation(target)},{allowReadOnly:true}).activate()}else onOpen('quarter',o.accountId)}}>处理这笔义务</button></div>)}
  {w.pause&&!forced.some(e=>e.isBlocking)?<div role="alert"><strong>日子在这里停了一下 · {w.progression.barrierLabel??'有一件需要你决定的事'}</strong><button type="button" onClick={()=>{if(w.pause?.reason==='STORY_RISK_DECISION_PENDING'&&onStoryScene){const source=w.pause.instanceId,incident=p.features.story.incidents.find(c=>c.sourceEventId===source||c.signals.some(s=>s.sourceEventId===source));setOpen(false);onStoryScene(incident?.id??null)}else{const target=cashPauseTarget(p);if(target&&onObligation){makeSharedAction(p,'核对这次原暂停',()=>{setOpen(false);onObligation(target)},{allowReadOnly:true}).activate()}else onOpen(w.pause?.reason==='STORY_RISK_DECISION_PENDING'?'story':'quarter')}}}>面对这件事</button></div>:null}
  {forced.map(e=><section className="scene-event-letter" key={e.id}><p className="scene-overline">眼前，多了一种选择 / {e.classification==='historical'?'史实节点':'本局模拟'}</p><h2>{e.title}</h2><p>{e.createdAt}出现 · {e.expiresAt}前决定。不回应时：{e.choices.find(c=>c.isDefault)?.label}。</p><div className="scene-event-options">{e.choices.map(choice=><CommandButton {...p} key={choice.id} kind="ChooseEvent" payload={{instanceId:e.id,choiceId:choice.id}} label={choice.label} confirm className="scene-event-action"><strong>{choice.label}</strong><span>安排需要{choice.actionPoints}点 · 确定费用{moneyText(choice.costFen)}</span><span className="scene-choice-end">核对这个决定 <span aria-hidden="true">→</span></span></CommandButton>)}</div>{e.isBlocking?<CommandButton {...p} kind="DeferEventDecision" payload={{instanceId:e.id}} label="暂缓，按期限默认" confirm/>:null}</section>)}
 </aside></Dialog>:null}</>:null
}

/** Short life decisions belong on the stage; only the reading surfaces paginate. */
function SceneChoiceSurface({direct,video=false,work=false,course=false,studio=false,memory=false,calendar=false,market=false,children,...book}:ComponentProps<typeof ScreenBook>&{direct:boolean;video?:boolean;work?:boolean;course?:boolean;studio?:boolean;memory?:boolean;calendar?:boolean;market?:boolean}){
 return direct?<div className={market?'market-choice-stage':memory?'memory-reading-stage':calendar?'calendar-entry-stage':work?'video-work-stage':studio?'course-studio-stage':course?'course-entry-stage':video?'video-first-attempt-stage':'life-choice-stage'} role="group" aria-label={market?'当前模拟投资的取舍':memory?'时代来信与前世片段':calendar?'今天的实际安排':course||studio?'现在可以作出的课程选择':video?'现在可以作出的视频选择':'现在可以作出的生活选择'}>{children}</div>:<ScreenBook {...book}>{children}</ScreenBook>
}

export function NarrativeScene(p:Props){
 const stage=useRef<HTMLElement>(null)
 const [selectedLetter,setSelectedLetter]=useState<{source:string|null;id:string|null}>({source:null,id:null})
 const [localRelaySelection,setLocalRelaySelection]=useState<{context:string;target:RelaySceneTarget|null}>({context:'',target:null})
 const [marketSelection,setMarketSelection]=useState<{context:string;id:string|null}>({context:'',id:null})
 const [deepseekSelection,setDeepseekSelection]=useState<{context:string;id:string|null}>({context:'',id:null})
 const [localLifeMode,setLocalLifeMode]=useState<LifeSceneMode>('person')
 const lifeMode=p.lifeMode??localLifeMode,setLifeMode=p.onLifeMode??setLocalLifeMode
 useEffect(()=>{const choose=(event:KeyboardEvent)=>{if(stage.current&&(event.target===document.body||event.target===document.getElementById('main-content')))chooseWithNumber(stage.current,event)};document.addEventListener('keydown',choose);return()=>document.removeEventListener('keydown',choose)},[])
 const {view,features:f}=p,w=f.workbench,first=f.firstOrder
 const screen=p.screen as Exclude<Screen,'room'|'routes'>,closing=view.phase!=='playing',archived=view.phase==='finished'
 const memoryReading=p.screen==='memory'&&!closing,calendarEntry=p.screen==='quarter'&&calendarEntryAvailable(p)
 const memoryCommandReceipt=!!p.receipt&&memoryReading&&['ReadNews','FavoriteMemory'].includes(p.receiptKind??'')
 const entryTimeReceipt=!!p.receipt&&(memoryReading&&['ReadNews','FavoriteMemory'].includes(p.receiptKind??'')||(memoryReading||calendarEntry)&&p.receiptKind==='AdvanceTime')
 const videoFocus=p.screen==='video'?openingFocusFor(p,'video',{accountId:p.accountId,...(p.videoTarget?{videoTarget:p.videoTarget}:{})}):null
 const videoThread=videoFocus?playerThread(p,videoFocus):null
 const videoAttempt=videoThread?videoAccountAttemptReading(p,videoThread):null
 const clientReply=videoThread?videoClientReplyReading(p,videoThread):null
 const clientReceipt=videoThread?videoClientSettlementReading(p,videoThread):null
 const videoInquiry=videoThread?videoInquiryChoiceReading(p,videoThread):null
 const videoFeedback=videoThread?videoPublicationFeedbackReading(p,videoThread):null
 const videoWork=videoThread!==null&&videoWorkStage(p,videoThread)
 const rawVideoProgress=!closing&&p.screen==='video'&&w.pause===null&&!w.progression.requiresDelivery?videoSceneProgress(f.video,view.date,p.videoTarget??null):null
 const videoProgress=rawVideoProgress&&videoThread?.focusStatus==='invalid'?{...rawVideoProgress,title:videoThread.title,line:videoThread.line,command:undefined,wait:undefined,invalidReason:videoThread.invalidReason}:rawVideoProgress&&clientReply?{...rawVideoProgress,title:clientReply.title,line:clientReply.line}:rawVideoProgress&&clientReceipt?{...rawVideoProgress,title:clientReceipt.title,line:clientReceipt.line}:rawVideoProgress&&videoInquiry?{...rawVideoProgress,title:videoInquiry.title,line:videoInquiry.line}:rawVideoProgress&&videoFeedback?{...rawVideoProgress,title:videoFeedback.title,line:videoFeedback.line}:rawVideoProgress&&videoAttempt?{...rawVideoProgress,title:videoAttempt.title,line:videoAttempt.line}:rawVideoProgress
 const courseIdentityReason=p.screen==='course'&&p.courseTarget!==undefined?courseSceneContextReason(p,p.courseTarget):null
 const courseProgress=!closing&&p.screen==='course'&&w.pause===null&&!w.progression.requiresDelivery?courseSceneProgress(f.course,view.date,p.courseTarget,{preparationReady:w.routes.find(r=>r.id==='ai_course')?.requirements.preparationReady===true,operations:view.operations}):null
 const courseFocus=p.screen==='course'&&!closing&&p.courseTarget!==undefined&&w.pause===null&&!w.progression.requiresDelivery?openingFocusFor(p,'course',{accountId:p.accountId,courseTarget:p.courseTarget}):null
 const courseThread=courseFocus?playerThread(p,courseFocus):null
 const courseContinuity=courseThread!==null&&isCourseContinuityThread(courseThread)
 const courseEntry=courseThread?courseEntryReading(p,courseThread):null
 const courseLesson=courseThread?courseLessonReading(p,courseThread):null
 const courseStudio=courseThread?(courseStudioReading(p,courseThread)??courseLesson??courseAudienceReading(p,courseThread)??courseClassReading(p,courseThread)):null
 const relaySelectionContext=view.runId+'|'+p.accountId
 const relayTarget=p.relayTarget!==undefined?p.relayTarget:!p.onRelayTargetChange&&localRelaySelection.context===relaySelectionContext?localRelaySelection.target:undefined
 const relayAccount=!p.onRelayTargetChange&&p.relayTarget===undefined&&relayTarget?relayTarget.accountId:p.accountId
 const relayProps=relayAccount===p.accountId?p:{...p,accountId:relayAccount}
 const selectRelay=(target:RelaySceneTarget|null)=>{if(p.onRelayTargetChange)p.onRelayTargetChange(target);else setLocalRelaySelection({context:relaySelectionContext,target})}
 const relayProgress=!closing&&p.screen==='relay'&&w.pause===null&&!w.progression.requiresDelivery?relaySceneProgress(f.relay,view.date,relayTarget,{runId:view.runId,accountId:relayAccount,operations:view.operations}):null
 const relayFocus=relayTarget!==undefined?openingFocusFor({view,features:f},'relay',{relayTarget,accountId:relayAccount}):null
 const relayThread=relayFocus?playerThread({view,features:f},relayFocus):null
 const marketContext=view.runId+'|'+p.accountId+'|'+(p.marketRecordId??''),deepseekContext=view.runId
 const marketSelectedId=marketSelection.context===marketContext?marketSelection.id:p.marketRecordId
 const marketTarget=p.screen==='market'&&marketSelectedId?playerThread(p,{kind:'market',runId:view.runId,accountId:p.accountId,entityId:marketSelectedId}):null
 const marketInvalid=marketTarget?.focusStatus==='invalid'
 const marketResearchTarget=!closing&&!marketInvalid&&w.pause===null&&!w.progression.requiresDelivery&&marketTarget&&f.market.researches.some(r=>r.id===marketSelectedId&&r.status!=='running')?marketTarget:null
 const marketProgress=!closing&&p.screen==='market'&&!marketInvalid&&!marketResearchTarget&&w.pause===null&&!w.progression.requiresDelivery?marketSceneProgress(f.market,view.date,p.accountId,marketSelectedId):null
 const marketResult=marketProgress?marketResultReading(p,marketProgress):null
 const deepseekProgress=!closing&&p.screen==='deepseek'&&w.pause===null&&!w.progression.requiresDelivery?deepseekSceneProgress(f.deepseek,view.date,deepseekSelection.context===deepseekContext?deepseekSelection.id:null):null
 const lifeSelection:LifeSceneSelection=lifeMode==='person'?p.personId:lifeMode
 const lifeProgress=!closing&&p.screen==='life'?lifeSceneProgress(f.life,view.date,lifeSelection):null
 const preferredLetter=p.onStoryIncident?p.storyIncidentId:selectedLetter.source===(p.storyIncidentId??null)?selectedLetter.id??p.storyIncidentId:p.storyIncidentId
 const storyProgress=!closing&&p.screen==='story'?storySceneProgress(f.story,view.date,preferredLetter,w.pause?.reason==='STORY_RISK_DECISION_PENDING'?w.pause.instanceId:null):null
 const originalCopy=closing?{...stories[screen],...closingStories[screen],overline:'原来的记录与边界',line:archived?'已经归档的经历和原账仍可以翻阅。若想继续实做，请回到住处明确继续旧事项；原回顾会保留。':'原合同、原资产与答应过的事，仍沿真实日期发生。尾声共用原四点，等候与收尾仍承担原来的费用。'}:stories[screen]
 const presentedRelay=relayProgress&&relayThread&&relayThread.focusStatus!=='invalid'?{...relayProgress,title:relayThread.title,line:relayThread.line}:relayProgress
 const progress=storyProgress??videoProgress??courseProgress??presentedRelay??marketResearchTarget??marketProgress??deepseekProgress??lifeProgress
 const copy=memoryReading?{...originalCopy,overline:'书架旁 / 这一次的时代',title:'翻一页，看看这次的时代。',line:''}:calendarEntry?{...originalCopy,overline:'本季日历 / 工作与生活',title:'今天，怎样安排这段日子？',line:''}:courseIdentityReason?{...originalCopy,title:'先找回这份教案与原账户。',line:courseIdentityReason}:courseEntry?{...originalCopy,title:courseEntry.title,line:courseEntry.line}:courseStudio?{...originalCopy,title:courseStudio.title,line:courseStudio.line}:marketInvalid?{...originalCopy,title:'先找回原来的那份委托。',line:marketTarget.invalidReason??'原对象已经不可达，请重新选择。'}:progress?{...originalCopy,title:marketResult?.title??progress.title,line:progress.line}:originalCopy
 const person=f.life.people.find(person=>person.id===p.personId)??f.life.people[0]!
 const canAdvance=!closing&&(view.date<playableThrough||view.date===playableThrough&&!w.atQuarterEnd)&&!w.progression.requiresDelivery&&w.pause===null
 const ordinaryNext=canAdvance?(w.progression.nextQuarterDate??playableAdvanceDate(w,view.date,defaultWaitDate(w,typeof p.requestWait==='function'))):null
 const encounterWait=courseLesson?.toolWait?.date??(videoThread?.focusStatus!=='invalid'&&p.screen==='video'?videoThread?.wait?.date:lifeProgress?.waitDate??marketProgress?.nextDate??deepseekProgress?.nextDate??(courseIdentityReason?undefined:courseProgress?.waitDate))
 const sceneNext=storyProgress?.phase==='waiting'?storyProgress.completeAt:relayProgress?.nextDate??encounterWait
 const next=relayProgress?relayReviewDate(p,relaySceneAdvanceDate(relayProgress,w,view.date,ordinaryNext)):sceneNext&&sceneNext>view.date&&ordinaryNext&&sceneNext<ordinaryNext?sceneNext:ordinaryNext
 const waitAt=canAdvance&&encounterWait&&encounterWait>=view.date?playableAdvanceDate(w,view.date,encounterWait):null
 const lifePause=p.screen==='life'&&lifeProgress&&canAdvance&&next?lifeActionPauseReading(p,lifeProgress):null
 const availableClock=canAdvance&&next?<ClockAdvance p={p} date={next} label={defaultWaitLabel(w,typeof p.requestWait==='function')+' · '+next}/>:null
 const personRecord=lifeProgress&&lifeMode==='person'?personMomentRecord(p,lifeProgress):null
 const personalResult=lifeProgress&&lifeMode!=='person'?personalResultReading(p,lifeProgress):null
 const personResult=lifeProgress&&lifeMode==='person'?personResultReading(p,lifeProgress):null
 const lifeMainAction=lifeProgress?.command?<Action compact p={p} {...lifeProgress.command} title={lifeProgress.choice.title} line={lifeProgress.choice.line} label={lifeProgress.choice.label}/>:null
 const waitLabel=waitAt&&waitAt!==encounterWait?'先到日历上的这一日':courseLesson?.toolWait?.label??videoThread?.wait?.label??courseProgress?.wait?.label??marketProgress?.waitLabel??(courseProgress?.preparation?'等这份大纲的下一处反馈':lifeProgress?.person?'等和'+lifeProgress.person.name+'约好的这段时间结束':lifeProgress?'等这次生活安排完成':deepseekProgress?.source==='counterfactual-equity'?'等这份架空投资的回信':'等这份合作的回信')
 const research=w.researches.find(r=>r.id==='market-overview')
 const commitmentCount=sceneCommitmentCount(p)
 const encounterScreen=['market','deepseek','life'].includes(p.screen)
 const bookContext=p.screen==='course'&&courseProgress?.preparation?view.runId+':course-preparation:'+(courseProgress.preparation.businessId??'new')+':'+courseProgress.preparation.phase:encounterScreen?view.runId+':'+view.revision+':'+(lifeProgress?.selection??marketResearchTarget?.focus.entityId??marketProgress?.entityId??deepseekProgress?.entityId??''):p.receipt&&p.receiptKind!=='AdvanceTime'?p.receipt:'choosing'
 const openCourse=()=>p.onOpen('course',{...(courseProgress?.recordId?{recordId:courseProgress.recordId}:{}),...(p.courseTarget!==undefined?{courseTarget:p.courseTarget}:{})})
 const openRelay=(target:RelaySceneTarget|null=relayTarget!==undefined?relayTarget:relayProgress?.target??null,slot?:RelayChoiceDraftSlot,recordId?:string)=>p.onOpen('relay',{accountId:target?.accountId??relayAccount,relayTarget:target,...(slot?{relayDraftSlot:slot}:{}),...(recordId?{recordId}:{})})
 const nextRelayPeriod=()=>{
  const target=relayProgress?.target,periodIds=relayProgress?.periodIds
  if(!target||!periodIds?.length)return
  const periodId=periodIds[((relayProgress?.periodIndex??-1)+1)%periodIds.length]!
  selectRelay({kind:'period',runId:target.runId,accountId:target.accountId,businessId:target.businessId,stationId:target.stationId,periodId})
 }
 const openDeepseek=()=>p.onOpen('deepseek',{deepseekPane:deepseekProgress?.source==='counterfactual-equity'?'equity':'ecosystem',...(deepseekProgress?.active&&deepseekProgress.entity?{recordId:deepseekProgress.entity.kind==='business'?(deepseekProgress.source==='counterfactual-equity'?'equity-preparation':deepseekProgress.entity.businessId+'-prepare'):deepseekProgress.entity.id}:{})})
 const recordLabels:Partial<Record<Screen,string>>={memory:'全部记忆、新闻与本局依据',quarter:'原日历、工作与已有安排',video:'细看原作品、客户与资源',course:'翻看全部课程、学员与原安排',relay:'翻看全部中转、客户与原安排',story:'翻看原授权、全部风险与责任',market:'翻看全部模拟行情、委托与交收',deepseek:'翻看全部生态合作与明确架空权益',life:lifeMode==='person'?'打开人物与全部原约定':'翻看全部生活工作与年度原记录'}
 const recordNames:Partial<Record<Screen,string>>={memory:'完整手记与来源',quarter:'原日历与安排',video:'作品与客户',course:'课程与学员',relay:'服务与客户',story:'来信与处置',market:'行情与委托',deepseek:'合作与权益记录',life:lifeMode==='person'?'人物与约定':'休整与居住安排'}
 const lifeCompletion=personalResult&&p.receipt&&p.receiptKind==='AdvanceTime'?personalCompletionReading(p,playerThread(p,{runId:view.runId,kind:'life',accountId:'personal',entityId:personalResult.jobId,selection:personalResult.kind}),{date:view.date,text:p.receipt,...(p.receiptBrief?{brief:p.receiptBrief}:{}),frame:p.echoFrame??null}):null
 const personTime=p.screen==='life'&&lifeMode==='person'&&lifeProgress&&p.receipt&&p.receiptKind==='AdvanceTime'?personTimeReading(p,lifeProgress,{date:view.date,text:p.receipt,...(p.receiptBrief?{brief:p.receiptBrief}:{}),frame:p.echoFrame??null}):null
 const invitationLine=p.screen==='life'&&lifeMode==='person'&&lifeProgress?personInvitationLine(p,lifeProgress):null
 const lifeReceiptBrief=lifeCompletion?.brief??personTime?.brief??p.receiptBrief
 const lifeTimeReceipt=p.screen==='life'&&!closing&&p.receipt&&p.receiptKind==='AdvanceTime'?<SceneTimeNotice compact key={view.revision} date={view.date} text={p.receipt} {...(lifeReceiptBrief?{brief:lifeReceiptBrief}:{})} frame={p.echoFrame??null} onClose={()=>p.onDismissReceipt?.()} accountName={id=>id==='personal'?'个人账户':w.routes.find(r=>r.accountId===id)?.name??'经营账户'}/>:null
 const memoryFeedback=memoryCommandReceipt&&p.receipt?<SceneTimeNotice compact date={view.date} text={p.receipt} {...(p.receiptBrief?{brief:p.receiptBrief}:{})} frame={p.echoFrame??null} onClose={()=>p.onDismissReceipt?.()} accountName={id=>id==='personal'?'个人账户':w.routes.find(r=>r.accountId===id)?.name??'经营账户'}/>:null
 const firstChoice=first.status==='available'?<Action p={p} kind="StartFirstOrder" payload={{}} title="接下一笔手工小单" line={`制作预算${moneyText(first.terms.costFen)}，${first.terms.actionPoints}点；先核对开工与交付日期，再接受。`} label="查看报价，决定是否接单"/>:first.status==='awaiting_submission'?<Action p={p} kind="SubmitDelivery" payload={{contractId:first.contractId}} title="把完成的作品交给客户" line="作品已经完成。提交后仍要等客户复核，回款不会提前发生。" label="核对并提交这份作品"/>:['planned','running'].includes(String(first.status))?<Choice title={first.status==='planned'?'这份作品，已排进日历':'把这一份作品认真做完'} line={first.status==='planned'?`${first.dates.startAt}实际开工，${first.dates.submitBy}前完成；此刻还没有交付和回款。`:`${first.dates.submitBy}前完成并提交；当前已发生成本${moneyText(first.result.directCostFen)}。完成以后还要交给客户。`} label="核对这笔小单的日历" onClick={()=>p.onOpen('quarter')}/>:['review','delivered'].includes(String(first.status))?<Choice title="作品已经交出，等下一处反馈" line={`最早${first.dates.earliestReviewAt}客户复核。复核、验收和实际到账还要分别核对，未到账不能叫回款。`} label="看看客户复核与收款记录" onClick={()=>p.onOpen('quarter')}/>:null
 const firstReceipt=p.screen==='quarter'&&w.quarter==='2020-Q1'&&first.result.paymentFen>0?<aside className="scene-earned"><span>这笔小单，客户已经付了款。</span><strong>{moneyText(first.result.paymentFen)}</strong><p>实际制作成本{moneyText(first.result.directCostFen)} · 本单净额{moneyText(first.result.netOrderFen)}</p><small>工资和浮盈没有算进这笔净额。</small></aside>:null
 const renderPerson=(readPerson:()=>void)=><section ref={stage} className={'narrative-scene narrative-'+p.screen} data-market-record-id={marketResearchTarget?.focus.entityId??undefined} aria-label="场景中的选择" onKeyDown={event=>chooseWithNumber(event.currentTarget,event.nativeEvent)}><header className="scene-title"><p className="scene-overline">{closing?(archived?'已经归档':'有限尾声')+' / '+view.date:courseContinuity&&courseThread?.focusScope==='history'?'正在回看 '+(courseThread.focusQuarter??'原准备'):w.quarter} / {copy.overline}</p><h1 ref={p.headingRef} tabIndex={-1}>{!closing&&p.screen==='quarter'&&w.atQuarterEnd?'这一季，你留下了什么？':lifePause?.title??copy.title}</h1>{lifeCompletion||(memoryReading||calendarEntry)&&(!entryTimeReceipt||memoryCommandReceipt)?null:<p>{invitationLine??(lifeTimeReceipt?(personTime?.line??lifePause?.line??copy.line):p.receipt&&(p.receiptKind==='AdvanceTime'||p.screen==='video'||courseContinuity||entryTimeReceipt)?<SceneTimeNotice compact={p.screen==='market'||p.screen==='life'||p.screen==='video'||courseContinuity||memoryReading||calendarEntry&&!!p.receiptBrief} {...((p.screen==='life'||memoryReading||calendarEntry)&&p.receiptBrief?{brief:p.receiptBrief}:{})} key={view.revision} date={view.date} text={p.receipt} frame={p.echoFrame??null} onClose={()=>p.onDismissReceipt?.()} accountName={id=>id==='personal'?'个人账户':w.routes.find(r=>r.accountId===id)?.name??'经营账户'}/>:!closing&&p.screen==='quarter'&&w.atQuarterEnd?'已经发生的回款、成本和经历，留在这一季。旧承诺还在，下一季的安排仍由你决定。':lifePause?.line??copy.line)}</p>}</header>
  {p.screen==='life'&&closing?<div className="scene-people" aria-label="你的长期联系">{f.life.people.map(person=><button type="button" key={person.id} aria-label={'看看'+person.name} aria-pressed={lifeMode==='person'&&person.id===p.personId} onClick={()=>{setLifeMode('person');p.onPerson(person.id)}}><PersonPortrait personId={person.id} name={person.name} revealed={person.known} textOnly={p.textOnly===true}/><span>{person.name}<small>{person.known?'已经相识':'还未形成联系'}</small></span></button>)}</div>:null}
  {p.screen==='life'&&!closing?<nav className="scene-life-paths" aria-label="这次想把时间留给什么"><button type="button" aria-pressed={lifeMode==='person'} onClick={()=>setLifeMode('person')}>与人在一起</button><button type="button" aria-pressed={lifeMode==='rest'} onClick={()=>setLifeMode('rest')}>留七天给自己</button><button type="button" aria-pressed={lifeMode==='workspace'} onClick={()=>setLifeMode('workspace')}>改善眼前住处</button>{lifeMode==='person'?<LifeContactBook p={p} selectedId={p.personId} onSelect={id=>{setLifeMode('person');p.onPerson(id)}}/>:null}</nav>:null}
  {p.screen==='life'&&lifeMode==='person'&&(!p.receipt||p.receiptKind==='AdvanceTime')?<figure className="scene-person-focus"><PersonPortrait personId={person.id} name={person.name} revealed={person.known} textOnly={p.textOnly===true} feature/><figcaption><strong>{person.name}</strong><span>{person.known?person.role:'这段联系，还没有实际前提。'}</span>{lifeTimeReceipt?<><div className="life-time-echo">{lifeTimeReceipt}</div><button type="button" className="scene-text-action" onClick={p.onPeople}>人物目标与边界 ↗</button></>:<><p>{person.goal}</p><small>{person.boundary}</small></>}</figcaption></figure>:null}
  {lifeTimeReceipt&&lifeMode!=='person'?<aside className="life-time-echo life-personal-echo" aria-label="刚才发生的回响"><p className="scene-overline">刚才的回响</p>{lifeTimeReceipt}</aside>:null}
  {marketProgress?<MarketRecordSwitch p={p} progress={marketProgress} onSelect={id=>setMarketSelection({context:marketContext,id})}/>:null}
  {deepseekProgress?<DeepseekRecordSwitch p={p} progress={deepseekProgress} onSelect={id=>setDeepseekSelection({context:deepseekContext,id})}/>:null}
  <SceneChoiceSurface direct={marketProgress!==null||marketResearchTarget!==null||memoryReading||calendarEntry||p.screen==='life'&&!closing||clientReply!==null||clientReceipt!==null||videoInquiry!==null||videoAttempt!==null||videoWork||courseEntry!==null||courseStudio!==null} video={clientReply!==null||clientReceipt!==null||videoInquiry!==null||videoAttempt!==null||videoWork} work={videoWork||videoInquiry!==null||clientReceipt!==null||clientReply!==null} course={courseEntry!==null} studio={courseStudio!==null} memory={memoryReading} calendar={calendarEntry} market={marketProgress!==null||marketResearchTarget!==null} choiceNavigation key={memoryReading||calendarEntry?view.runId+':'+p.accountId+':'+p.screen+':'+view.phase+':'+(calendarEntry?w.quarter:'reading'):p.screen==='video'||courseContinuity?view.runId+':'+p.screen+':'+view.phase:p.screen+':'+view.phase+':'+view.date+':'+(p.screen==='life'?lifeSelection:relayProgress?.periodId??marketProgress?.entityId??deepseekProgress?.entityId??'')+':'+bookContext} label="眼前的选择" className="scene-story-book">
  {!calendarEntry?firstReceipt:null}
  {storyProgress?<RiskLetter key={storyProgress.incident.id} p={p} incident={storyProgress.incident} count={f.story.incidents.length} index={f.story.incidents.findIndex(c=>c.id===storyProgress.incident.id)} onNext={()=>{const index=f.story.incidents.findIndex(c=>c.id===storyProgress.incident.id);const id=f.story.incidents[(index+1)%f.story.incidents.length]!.id;if(p.onStoryIncident)p.onStoryIncident(id);else setSelectedLetter({source:p.storyIncidentId??null,id})}}/>:null}
  {relayProgress?.periodId&&!relayProgress.invalidReason?<RelayServiceLetter p={relayProps} progress={relayProgress} onFullRecord={()=>openRelay()} onNext={nextRelayPeriod} />:null}
  <div className="scene-choices" aria-label="这一幕可以做的事">
   {closing?<><Choice title={archived?'翻看这条路的真实记录':'把原来的事项逐项收好'} line={copy.line} label={copy.open} onClick={()=>p.onOpen()}/><Choice title={archived?'回到已经记下的人生':'回到住处，再决定下一步'} line="原来的资产、账目与约定继续保留；回顾不会抹掉它们。" label="回到人生回顾" onClick={()=>p.onNavigate('room')}/></>:<>
   {p.screen==='quarter'&&w.atQuarterEnd?<><Choice title="回看这一季真实留下的记录" line="工作和经营的收入、实际成本与未结责任，各有自己的来处。" label="翻看本季实际记录" onClick={()=>p.onOpen('quarter')}/><Choice title="下一季，还想走哪条路？" line="可以继续，也可以调整。进入下一季不会自动替你接受工作、交易或融资。" label="再看看眼前的机会" onClick={()=>p.onNavigate('routes')}/></>:p.screen==='quarter'?calendarEntry?<CalendarChoices p={p} firstChoice={firstChoice} firstReceipt={firstReceipt} onOpen={target=>p.onOpen('quarter',target)}/>:<>{w.employment.some(plan=>plan.segments.some(segment=>segment.to===null))?<Choice title="把余下的时间，留给生活" line="本季工作已经确认。工资按真实在岗日到账，余下的行动仍由你安排。" label="看看生活里的人与事" onClick={()=>p.onNavigate('life')}/>:<Action p={p} kind="WorkQuarter" payload={{}} title="把这一季的工作留好" line="通常占本季2点。工资仍按实际在岗日期，在月末到账。" label="查看这季的工作安排"/>}{firstChoice}<Choice title="给时间留另一种可能" line="学习、经营和生活，可以用这一季的四份时间来安排。" label={copy.open} onClick={()=>p.onOpen()}/></>:null}
   {p.screen==='video'?w.progression.requiresDelivery?(first.status==='awaiting_submission'?firstChoice:<Choice title="先把答应过的交付看清" line="这份制作与原客户责任仍在；先处理交付，再回到视频尝试。" label="先面对这份交付" onClick={()=>p.onOpen('quarter')}/>):w.pause!==null?<Choice title="日历里，有件事需要先回应" line={w.progression.barrierLabel??'先看清已经发生的事，再回到这份视频尝试。'} label="先回应日历里的这件事" onClick={()=>p.onOpen(w.pause?.reason==='STORY_RISK_DECISION_PENDING'?'story':'quarter')}/>:<VideoSceneChoice p={p} {...(p.videoTarget?{target:p.videoTarget}:{})} {...(p.onVideoTargetChange?{onTargetChange:p.onVideoTargetChange}:{})} blockedReason={w.pause!==null||w.progression.requiresDelivery?'先回应日历里的原责任；视频草稿和原约定仍保留。':null} onToday={()=>p.onNavigate('room',{roomView:'today'})} onLife={()=>p.onNavigate('life',{accountId:'personal'})} onInspect={target=>p.onOpen('video',target?{accountId:p.accountId,videoTarget:target}:undefined)}>{open=><>
    {videoThread&&videoThread.focusStatus!=='invalid'&&!videoThread.legacyFallbackRequired?<VideoEncounter p={p} thread={videoThread} condensedReceipt={!!p.receipt} date={waitAt} waitLabel={waitLabel} onChoose={intent=>open(intent??(videoThread.stage==='video-quality'?'rework':videoThread.stage==='video-ready-to-publish'?'publish':undefined))} onResult={()=>open('next')} onToday={()=>p.onNavigate('room',{roomView:'today'})}/>:<Choice intent="plan" title={videoProgress?.choice.title??'先选一个具体的内容账号'} line={videoProgress?.invalidReason??videoProgress?.choice.line??'从手工制作开始，受众、作品和客户反馈分别发生。'} label={videoProgress?.invalidReason?'明确重新选择原视频对象':videoProgress?.choice.label??'选择账号与这次尝试'} caption={videoProgress?.invalidReason?'重新选择，不替换原记录':'先选择，再核对真正的投入'} onClick={()=>open()}/>}
   </>}</VideoSceneChoice>:null}
   {p.screen==='course'&&courseProgress?p.courseTarget===undefined?<>{courseProgress.preparation?.phase==='fund'||courseProgress.preparation?.phase==='outline'?<CoursePreparation key={view.runId+':'+(courseProgress.preparation.businessId??'new')} p={p} step={courseProgress.preparation}/>:courseProgress.preparation?.phase==='waiting'&&waitAt?<><CoursePreparationTrail step={courseProgress.preparation}/><WaitChoice p={p} date={waitAt} title={courseProgress.choice.title} line={courseProgress.choice.line} label={waitLabel}/></>:courseProgress.preparation?.phase==='activate'?<><CoursePreparationTrail step={courseProgress.preparation}/><Action p={p} kind="ActivateBusiness" payload={{businessId:courseProgress.preparation.businessId}} title={courseProgress.choice.title} line={courseProgress.choice.line} label={courseProgress.choice.label}/></>:courseProgress.stage?<CourseStageChoice key={courseProgress.stage.cohortId+':'+courseProgress.stage.index} p={p} stage={courseProgress.stage} onFullRecord={(target,slot)=>p.onOpen('course',{...(target?{courseTarget:target}:{}),...(slot?{courseTeachingSlot:slot}:{})})}>{open=><Choice title={courseProgress.choice.title} line={courseProgress.choice.line} label={courseProgress.choice.label} caption="选择资源与日期" onClick={open}/>}</CourseStageChoice>:<Choice title={courseProgress.choice.title} line={courseProgress.choice.line} label={courseProgress.choice.label} onClick={openCourse}/>}</>:<CourseSceneChoice p={p} target={p.courseTarget} onToolAccount={()=>p.onNavigate('video',{accountId:'personal'})} {...(p.onCourseTargetChange?{onTarget:p.onCourseTargetChange}:{})} onToday={()=>p.onNavigate('room',{roomView:'today'})} onLife={()=>p.onNavigate('life',{accountId:'personal'})} blockedReason={w.pause!==null||w.progression.requiresDelivery?'先面对原责任，再回到这份教案。':null} onInspect={(target,slot,teachingSlot)=>{const recordId=!slot&&!teachingSlot?courseSceneProgress(f.course,view.date,target,{operations:view.operations})?.recordId:undefined;p.onOpen('course',{courseTarget:target,...(recordId?{recordId}:{}),...(slot?{courseDraftSlot:slot}:{}),...(teachingSlot?{courseTeachingSlot:teachingSlot}:{})})}}>{open=><>{courseContinuity&&courseThread?<CourseEncounter p={p} thread={courseThread} date={waitAt} waitLabel={waitLabel} onChoose={intent=>open(intent)} onResult={()=>open('next')} onToday={()=>p.onNavigate('room',{roomView:'today'})} onNavigate={p.onNavigate}/>:courseProgress.command&&!courseProgress.invalidReason&&!courseIdentityReason?<Action p={p} {...courseProgress.command} title={courseProgress.choice.title} line={courseProgress.choice.line} label={courseProgress.choice.label}/>:waitAt&&!courseProgress.invalidReason&&!courseIdentityReason?<WaitChoice p={p} date={waitAt} title={courseProgress.choice.title} line={courseProgress.choice.line} label={waitLabel}/>:<Choice intent="plan" title={courseProgress.choice.title} line={courseIdentityReason??courseProgress.invalidReason??courseProgress.choice.line} label={courseProgress.choice.label} caption={courseProgress.invalidReason?'重新显选，不替换原记录':'走近这份教案，核对眼前一步'} onClick={()=>open()}/>}</>}</CourseSceneChoice>:null}
   {p.screen==='relay'?w.progression.requiresDelivery?(first.status==='awaiting_submission'?firstChoice:<Choice title="先看清答应过的交付" line="原服务书签和草稿仍在，先回应眼前的原交付责任。" label="先面对这份交付" onClick={()=>p.onOpen('quarter')}/>):w.pause!==null?<Choice title="日历里，有件事需要先回应" line={w.progression.barrierLabel??'先处理已发生的责任，再回这份服务。'} label="先回应日历里的这件事" onClick={()=>p.onOpen(w.pause?.reason==='STORY_RISK_DECISION_PENDING'?'story':'quarter')}/>:relayProgress?<RelaySceneChoice p={relayProps} target={relayTarget} onTargetChange={selectRelay} onInspect={openRelay} onToday={()=>p.onNavigate('room',{roomView:'today'})} onLife={()=>p.onNavigate('life',{accountId:'personal'})}>{open=>relayThread&&relayThread.focusStatus!=='invalid'?<RelayEncounter p={relayProps} thread={relayThread} target={relayTarget} date={next} waitLabel={relayReviewLabel(relayProps,next,next===relayThread.wait?.date?relayThread.wait.label:'先到日历上的这一日')} onChoose={open} onToday={()=>p.onNavigate('room',{roomView:'today'})}/>:<Choice intent="plan" title={relayProgress.choice.title} line={relayProgress.invalidReason??relayProgress.choice.line} label="明确选定原对象或准备新站" caption="查看不签约、不充值" onClick={()=>open('objects')}/>}</RelaySceneChoice>:null:null}
   {storyProgress?<>
    {w.pause?.reason==='STORY_RISK_DECISION_PENDING'?<Action p={p} kind="AcknowledgeStoryPause" payload={{instanceId:w.pause.instanceId}} title="记下让日子暂停的那条信号" line="只确认已看见触发暂停的新信号。眼前其他来信、核查、付款与原期限仍分别保留。" label="记下新信号，保留期限继续"/>:null}
    {storyProgress.phase==='signal'?<RiskInvestigationChoice key={storyProgress.incident.id} p={p} incident={storyProgress.incident} onFullRecord={()=>p.onOpen()}>{open=><Choice title="请人把原记录查清楚" line={`${moneyText(storyProgress.incident.taskTerms.investigate!.costFen)} · ${storyProgress.incident.taskTerms.investigate!.points}点 · ${storyProgress.incident.taskTerms.investigate!.days}日。由原业务承担，完成后再判断。`} label="安排这封来信的独立核查" caption="留出钱与时间" onClick={open}/>}</RiskInvestigationChoice>:storyProgress.phase==='assessment'?<Action p={p} kind="ConfirmRiskAssessment" payload={{incidentId:storyProgress.incident.id}} title="回信到了，认真对照这一次" line="独立工作已实际完成。核对公开回信，再明确确认本次评估；原账和客户承诺继续。" label="核对回信并确认本次评估"/>:storyProgress.phase==='waiting'?<Choice title="给这份委托，真正的几天" line={`${storyProgress.completeAt}预计回信；尚未完成，不提前下结论。${storyProgress.deadlineWarning??'原默认期限仍在，旧费用与其他安排继续。'}`} label="翻看这份委托与全部原记录" caption="查看原委托" onClick={()=>p.onOpen()}/>:null}
    {storyProgress.phase==='handling'&&storyProgress.incident.kind==='agent'?storyProgress.incident.deploymentIds.map(id=><Action key={id} p={p} kind="StopHengxingAuthority" payload={{deploymentId:id}} title="先停止本人能控制的权限" line="0点；原已用费用仍结清或列应付，依赖它的未完成支持会中断。停止自报不等于外部通道已撤回。" label={'核对有限停止 · '+id.slice(-6)}/>):null}

   </>:null}
   {marketResearchTarget?<Choice title={marketResearchTarget.title} line={marketResearchTarget.line+' '+marketResearchTarget.detail} label="翻看这项原研究与实际记录" onClick={()=>p.onOpen('market',marketResearchTarget.inspect.target)}/>:null}
   {p.screen==='market'&&marketProgress?<>
    {marketProgress.command?<Action p={p} {...marketProgress.command} title={marketProgress.choice.title} line={marketProgress.choice.line} label={marketProgress.choice.label}/>:waitAt?<WaitChoice p={p} date={waitAt} title={marketProgress.choice.title} line={marketProgress.choice.line} label={waitLabel}/>:null}
    {marketProgress.secondaryCommand?<Action p={p} {...marketProgress.secondaryCommand} title="撤回还没有成交的余量" line="已经成交的记录与费用继续保留；释放冻结不会产生一笔收入。" label="撤销这份委托的剩余数量"/>:null}
    {!marketResult&&!marketProgress.active&&research&&!research.state?<Action p={p} kind="ResearchMarket" payload={{definitionId:research.id}} title="先把公开产业线索理一理" line={`个人${research.actionPoints}点 · ${moneyText(research.costFen)} · ${research.days}日。研究不揭示未来价格，也不替你交易。`} label="核对公开研究安排"/>:null}
    {!marketProgress.active||marketProgress.phase==='position'?<MarketSceneChoice key={view.runId} p={p} onFullRecord={()=>p.onOpen()}>{open=>marketResult?<MarketResultChoices p={p} progress={marketProgress} onToday={()=>p.onNavigate('room',{roomView:'today'})} onOrder={open}/>:<Choice intent="plan" title={marketProgress.phase==='history'||marketProgress.phase==='settlement'?'填写一份新的买卖委托':'填写一份买卖委托'} line={marketProgress.phase==='history'||marketProgress.phase==='settlement'?'股票、买卖方向、股数、限价和期限，都由你决定。':marketProgress.choice.line} label="选择一份模拟委托" caption="选择股票与买卖条件" onClick={open}/>}</MarketSceneChoice>:null}

    {marketResult&&!marketProgress.active&&research&&!research.state?<Action p={p} kind="ResearchMarket" payload={{definitionId:research.id}} title="先把公开产业线索理一理" line={`个人${research.actionPoints}点 · ${moneyText(research.costFen)} · ${research.days}日。研究不揭示未来价格，也不替你交易。`} label="核对公开研究安排"/>:null}
   {marketResult&&marketProgress.active?<MarketResultChoices p={p} progress={marketProgress} onToday={()=>p.onNavigate('room',{roomView:'today'})}/>:null}
   </>:null}
   {p.screen==='deepseek'&&deepseekProgress?<>
    {deepseekProgress.command?<Action p={p} {...deepseekProgress.command} title={deepseekProgress.choice.title} line={deepseekProgress.choice.line} label={deepseekProgress.choice.label}/>:waitAt?<WaitChoice p={p} date={waitAt} title={deepseekProgress.choice.title} line={deepseekProgress.choice.line} label={waitLabel}/>:<Choice title={deepseekProgress.choice.title} line={deepseekProgress.choice.line} label={deepseekProgress.choice.label} onClick={openDeepseek}/>}

   </>:null}
   {p.screen==='life'&&lifeProgress?<>
    {personalResult?<PersonalResultChoice p={p} value={personalResult} onOpen={p.onOpen} onNavigate={p.onNavigate}/>:personResult?<PersonResultChoice p={p} value={personResult} onRecord={readPerson} onNavigate={p.onNavigate}/>:lifeProgress.command?lifePause&&availableClock?<LifeActionPause title={lifeProgress.choice.label} clock={availableClock}>{lifeMainAction}</LifeActionPause>:lifeMainAction:waitAt?<WaitChoice compact displayLabel={waitAt===lifeProgress.waitDate?(lifeProgress.person?'等这次相处结束':'等这次生活安排完成'):waitLabel} p={p} date={waitAt} title={lifeProgress.choice.title} line={lifeProgress.choice.line} label={waitLabel}/>:lifeProgress.waitDate?<Choice title="这次等候，还要先面对日历上的事" line={lifeProgress.choice.line} label="查看阻碍推进的原事项" onClick={()=>p.onOpen('quarter')}/>:lifeProgress.referenceRequired&&lifeProgress.person?<LifeReferenceChoice key={view.runId+':'+person.id} p={p} person={lifeProgress.person} onFullRecord={p.onPeople}>{open=>lifePause&&availableClock?<LifeActionPause title={lifeProgress.choice.title} clock={availableClock} onRead={open} readLabel={'先挑一份想与'+person.name+'聊的经历 ↗'}/>:<Choice intent="plan" title={lifeProgress.choice.title} line={lifeProgress.choice.line} label={lifeProgress.choice.label} onClick={open}/>}</LifeReferenceChoice>:<Choice title={lifeProgress.choice.title} line={lifeProgress.choice.line} label={lifeProgress.choice.label} onClick={lifeMode==='person'?readPerson:p.onYear}/>}
    {lifeProgress.secondaryCommand?<Action compact p={p} {...lifeProgress.secondaryCommand} buttonLabel={lifeProgress.secondaryCommand.kind==='DeclineLifePromise'?'婉拒这次邀请':'中断这次安排'} title={lifeProgress.secondaryCommand.kind==='DeclineLifePromise'?'婉拒这次邀请':'中断这次安排'} line={lifeProgress.secondaryCommand.kind==='DeclineLifePromise'?'告诉对方这次无法参加；不会花钱，也不会接受这项约定。':'原成本、已经用掉的行动和答应过的责任不会因中断消失；再次安排仍须另付真实资源。'} label={lifeProgress.secondaryCommand.kind==='DeclineLifePromise'?'婉拒'+person.name+'的邀请':'中断这次生活工作，保留原成本与承诺'}/>:null}

   </>:null}
   {memoryReading?<MemoryClippings p={p} feedback={memoryFeedback} receiptKind={p.receiptKind??null} onReadingChange={()=>{if(['ReadNews','FavoriteMemory'].includes(p.receiptKind??''))p.onDismissReceipt?.()}} onFull={()=>p.onOpen('memory')}/>:null}
   {!memoryReading&&!['quarter','video','market','life','deepseek'].includes(p.screen)&&!(p.screen==='course'&&courseProgress)&&!(p.screen==='relay'&&relayProgress)&&!storyProgress?<><Choice title={p.screen==='course'?'先备好值得交付的课':p.screen==='relay'?'把一次服务认真安排好':p.screen==='memory'?'翻开那些模糊的片段':p.screen==='finance'?'摊开每一笔账':p.screen==='story'?'先把事实看清': '看看已经确认过的安排'} line={copy.line} label={copy.open} onClick={()=>p.onOpen()}/><Choice title="仍可以慢慢选择" line="回到自己的住处，再决定这一季把时间留给哪里。" label="回到住处想一想" onClick={()=>p.onNavigate('room')}/></>:null}
   {marketInvalid?<Choice title="原对象没有被换成另一份委托" line={marketTarget.invalidReason??'原账户、对象或公开记录已失效。'} label="重新选择本账户的投资安排" onClick={()=>p.onNavigate('market')}/>:(p.screen==='market'&&!marketProgress&&!marketResearchTarget||p.screen==='deepseek'&&!deepseekProgress)?<Choice title="先面对日历上需要回应的事" line="原交付、资金与暂停仍保留。可以翻看全部记录，不绕过原来的推进屏障。" label={copy.open} onClick={()=>p.onOpen()}/>:null}
   </>}
  </div>
  </SceneChoiceSurface>

  {p.screen!=='video'&&!courseContinuity&&!entryTimeReceipt&&p.receipt&&p.receiptKind!=='AdvanceTime'?<SceneEcho text={p.receipt} frame={p.echoFrame??null} onClose={()=>p.onDismissReceipt?.()} accountName={id=>id==='personal'?'个人账户':w.routes.find(r=>r.accountId===id)?.name??'企业账户'}/>:null}
  <footer className="scene-turn"><div>{calendarEntry?<><button type="button" className="scene-text-action" onClick={()=>p.onNavigate('life',{accountId:'personal'})}>相识的人 ↗</button><button type="button" className="scene-text-action" onClick={()=>p.onNavigate('routes')}>其它尝试 ↗</button></>:null}<button type="button" className="scene-text-action" onClick={()=>p.onOpen('quarter')}>日历上的牵挂{commitmentCount>0?' · '+commitmentCount:''} ↗</button>{p.screen==='life'?<button type="button" className="scene-text-action" onClick={p.onYear}>回看年度胶片 ↗</button>:null}<button type="button" className="scene-text-action" aria-label={recordLabels[p.screen]} onClick={()=>p.screen==='life'&&lifeMode==='person'?p.onPeople():p.screen==='course'?openCourse():marketResult&&marketProgress?p.onOpen('market',{accountId:marketProgress.accountId,recordId:marketProgress.entityId!}):p.onOpen()}>{closing?'翻看人生记录':recordNames[p.screen]??'细看这一幕的安排'} ↗</button></div>{courseLesson?.toolCommand?<small className="scene-wait-caption">读原回信不推进日期，费用与约定仍按原记录保留。</small>:lifePause?null:waitAt?<small className="scene-wait-caption">等候期间，费用和约定照常发生。也可以先去做别的事。</small>:availableClock?availableClock:<button type="button" onClick={()=>closing?p.onNavigate('room'):p.onOpen('quarter')}>{closing?'回到人生回顾':w.progression.requiresDelivery?'先面对这份交付':view.date===playableThrough&&w.atQuarterEnd?'回看最后一季':'看看停在了哪件事'}</button>}</footer>
 </section>
 const obligation=['video','course','relay','market','deepseek','life'].includes(p.screen)?routeObligationReading(p):null
 if(obligation)return <RouteObligationMoment p={p} reading={obligation} sourceName={recordNames[p.screen]??'这条路的原记录'} headingRef={p.headingRef} stageRef={stage} onKeyDown={event=>chooseWithNumber(event.currentTarget,event.nativeEvent)} onNavigate={p.onNavigate} onRecord={()=>p.screen==='life'&&lifeMode==='person'?p.onPeople():p.screen==='course'?openCourse():p.onOpen()} feedback={p.receipt?<SceneTimeNotice compact date={view.date} text={p.receipt} {...(p.receiptBrief?{brief:p.receiptBrief}:{})} frame={p.echoFrame??null} onClose={()=>p.onDismissReceipt?.()} accountName={id=>id==='personal'?'个人账户':w.routes.find(r=>r.accountId===id)?.name??'经营账户'}/>:null}/>
 return personRecord?<PersonRecordReader key={personRecord.key} p={p} value={personRecord} onFull={target=>p.onOpen('life',target)}>{renderPerson}</PersonRecordReader>:renderPerson(p.onPeople)
}
