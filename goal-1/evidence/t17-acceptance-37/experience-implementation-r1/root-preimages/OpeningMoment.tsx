import {cloneElement,isValidElement,useEffect,useId,useState,type Ref,type ReactNode,type ComponentProps} from 'react'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import type {Moment} from './RoomMoment.tsx'
import {OpeningObject,type OpeningObjectProps} from './OpeningObject.tsx'
import {openingFocusFor,playerThread,type OpeningFocus,type PlayerThreadView} from './player-thread.ts'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {Dialog} from './Dialog.tsx'
import {MarketSceneChoice} from './MarketSceneChoice.tsx'
import {VideoSceneChoice,type VideoChoiceAction} from './VideoSceneChoice.tsx'
import {CourseSceneChoice,type CourseChoiceIntent} from './CourseSceneChoice.tsx'
import {courseSceneProgress,type CourseSceneTarget} from './course-scene-progress.ts'
import {courseStageWaitDate} from './course-stage-wait.ts'
import {courseSceneContext} from './course-player-thread.ts'
import {courseTeachingPaper} from './course-teaching-paper.ts'
import {courseTeachingPaperFor,courseTeachingPaperLabel,courseTeachingMoneyFor,courseTeachingClosureFor} from './course-teaching-continuity.ts'
import {SceneTimeNotice,sceneTimeNarrative} from './SceneEcho.tsx'
import {RelaySceneChoice} from './RelaySceneChoice.tsx'
import {relaySceneProgress} from './relay-scene-progress.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import {relaySceneContext} from './relay-player-thread.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {moneyText,playableThrough} from './game-text.ts'
import {seasonFocusChoices,seasonFocusGroups,seasonFocusGroupFor,initialSeasonFocusGroup,type SeasonFocusGroup} from './season-thread.ts'
import {SeasonRecollection} from './SeasonRecollection.tsx'
import {openingAttempt,type OpeningFirstOrderView} from './opening-attempt.ts'
import {OpeningAttemptAction} from './OpeningAttemptAction.tsx'
import {OpeningAttemptChoices,type OpeningChoicePanel} from './OpeningAttemptChoices.tsx'
import type {FirstOrderArtState} from './OpeningObject.tsx'
import {todayThread} from './today-thread.ts'
import {TodayScene} from './TodayScene.tsx'
import {DayThreadAction} from './DayThreadAction.tsx'
import {VideoThreadAction} from './VideoThreadAction.tsx'
import {videoPaperFor} from './video-continuity.ts'
import {dayPerspectiveCurrent,type DayPerspective} from './day-perspective.ts'
import {makeSharedAction} from './shared-action.ts'
import './video-scene-object.css'
import {CourseThreadAction} from './CourseThreadAction.tsx'
import {RelayThreadAction} from './RelayThreadAction.tsx'
import {relayPaperFor,relayMoneyFor} from './relay-continuity.ts'
import {relayReviewDate,relayReviewLabel,relayDeferredFeedback} from './relay-scene-clock.ts'
import {courseAttemptClosed} from './thread-purpose.ts'
import {coursePreparationPaperFor,isCoursePreparationThread,isCourseContinuityThread} from './course-continuity.ts'
import type {DayContinuityArt} from './DayContinuityPaper.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {sceneMeaning} from './scene-meaning.ts'

type Props={p:GamePanelProps;headingRef:Ref<HTMLHeadingElement>;fallback:Moment;feedback?:ReactNode;focus?:OpeningFocus|null|undefined;focusQuarter?:string|null|undefined;focusNotice?:string|null|undefined;focusRequiresChoice?:boolean|undefined;onFocus?:((focus:OpeningFocus|null)=>void)|undefined;onNavigate:NavigateScene;onExplore:()=>void;onResponsibilities?:(()=>void)|undefined;onRecollection?:(()=>void)|undefined;todayView?:boolean|undefined;onToday?:(()=>void)|undefined;onReturnFocus?:(()=>void)|undefined}

/** Keep the offer, reserved cost, actual payment and net result distinct in the first layer. */
function firstOrderFacts(first:OpeningFirstOrderView):readonly string[]|null{
 if(first.phase==='paid')return [`本单实收${moneyText(first.result.paymentFen)} · 制作直接成本${moneyText(first.result.directCostFen)} · 本单净额${moneyText(first.result.netOrderFen)}。`]
 if(first.phase==='letter')return [`原报价${moneyText(first.terms.priceFen)} · 制作需${moneyText(first.terms.costFen)} / ${first.terms.actionPoints}点。尚未接单，实际制作费与本单行动占用均为0。`,`${first.dates.replyBy}前答复 · 接下后须在${first.dates.submitBy}前提交。`]
 if(first.phase==='planned')return [`已预留制作${moneyText(first.terms.costFen)} / ${first.terms.actionPoints}点，尚未实际支付制作费。`,`${first.dates.startAt}开工 · ${first.dates.submitBy}前提交。`]
 if(first.phase==='running'||first.phase==='delivery')return [`已支付制作直接成本${moneyText(first.result.directCostFen)} · 原约定${first.terms.actionPoints}点。`,`${first.dates.submitBy}前提交；客户款仍须实际验收和支付。`]
 if(first.phase==='feedback')return [`制作直接成本${moneyText(first.result.directCostFen)} · 已确认收入${moneyText(first.result.confirmedIncomeFen)} · 客户实付${moneyText(first.result.paymentFen)}。`,`验收与实际到账分别发生。`]
 return null
}

function objectKind(thread:PlayerThreadView):OpeningObjectProps['kind']{
 if(thread.focus.kind==='relay')return thread.outcome==='actual'?'receipt':thread.outcome==='non-success'?'letter':thread.stage==='relay-planned'?'calendar':thread.wait?'waiting':thread.stage==='relay-service'?'work':'portfolio'
 if(thread.focus.kind==='market')return 'portfolio'
 if(thread.focus.kind==='course')return isCoursePreparationThread(thread)?thread.outcome==='non-success'?'letter':thread.wait?'calendar':'work':thread.outcome==='actual'?'receipt':thread.wait?'waiting':thread.stage.includes('planned')?'calendar':'portfolio'
 if(thread.focus.kind==='video'){
  if(thread.outcome==='actual')return 'receipt'
  if(thread.outcome==='non-success')return 'letter'
  if(thread.stage==='video-planned'||thread.stage==='video-marketing-planned')return 'calendar'
  if(thread.stage==='video-self-review'||thread.stage==='video-submit')return 'work'
  return thread.wait?'waiting':'letter'
 }
 if(thread.focus.kind==='life'||thread.focus.kind==='work'||thread.focus.kind==='free')return thread.outcome==='actual'?'receipt':'calendar'
 if(thread.stage==='paid')return 'receipt'
 if(thread.stage==='planned')return 'calendar'
 if(thread.stage==='delivery')return 'work'
 if(thread.wait)return 'waiting'
 return 'letter'
}
function stageLabel(thread:PlayerThreadView){
 if(thread.focusStatus==='invalid')return '原对象需要重新选择'
 if(thread.focusScope==='history')return '历史回看 · '+(thread.focusQuarter??'沿原日期')
 if(thread.focusScope==='carry')return '旧约定继续 · '+(thread.focusQuarter??'沿原日期')
 if(thread.focus.kind==='relay'){
  const labels:Record<string,string>={'relay-opening':'先选择本站与这笔服务','relay-planned':'已经安排 · 尚未实际开工','relay-service':'服务正在进行 · 报告不代替实计','relay-support':'原支持继续 · 尚待实际完成','relay-audit-waiting':'复核正在等待 · 实计尚未全部揭示','relay-audit-ready':'已发生记录 · 仍待独立复核','relay-correction':'已有复核依据 · 差额仍待更正','relay-collection':'原应收已到期 · 尚待实际收取','relay-period-closed':'本期原记录 · 余额与旧账另核','relay-stopping':'服务已经停下 · 原责任仍在','relay-closed':'本站已经关闭 · 原记录仍保留'}
  const current=labels[thread.stage];if(current)return current
 }
 if(thread.focus.kind==='course'){
  if(thread.stage==='course-unavailable')return '尚未开放 · 没有接受教学承诺'
  if(thread.stage.endsWith('-planned'))return '已经安排 · 尚未实际开工'
  if(thread.stage.endsWith('-running'))return thread.stage==='course-stage-running'?'正在教学 · 尚未实际交付':thread.stage==='course-support-running'||thread.stage==='course-recovery-running'?'正在支持 · 仍待实际反馈':thread.stage==='course-audience-running'?'推广正在进行 · 尚未实际完成':thread.stage==='course-refresh-running'?'正在更新 · 尚未实际完成':'正在准备 · 尚未实际完成'
  if(thread.stage==='course-ready')return '样课已经完成 · 招生仍另行决定'
  if(thread.stage==='course-outline-completed')return '大纲已经完成 · 样课仍另行准备'
  if(thread.stage==='course-license-completed')return '课程使用范围已准备 · 样课仍另行准备'
 }
 if(thread.focus.kind==='video'){
  const label:Record<string,string>={'video-planned':'已安排 · 尚未开工','video-marketing-planned':'已安排 · 尚未开工','video-running':'制作正在进行 · 尚待实际完成','video-marketing-running':'受众推广进行中 · 尚无新询价','video-negotiating':'条件已经提出 · 等原谈判回信','video-affiliate-window':'已有统计 · 原订单观察仍未结束','video-platform-payment-wait':'原平台应收 · 还没有实际到账','video-platform-collect':'原款已经到期 · 等你核对收取','video-platform-paid':'原平台款已实收 · 原费用另核','video-self-review':'制作实际完成 · 尚未人工核对','video-submit':'本版已核对 · 等你亲手提交','video-client-review':'已提交 · 尚未验收','video-payment-wait':'已验收 · 尚未到账','video-revision':'客户要求修改 · 尚未验收','video-quality':'实际发现的问题 · 等你处理','video-entry':'先选择这次尝试的账号','video-channel':'原账号已建立 · 选择一次具体尝试'}
  const current=label[thread.stage]
  if(current)return current
 }
 if(thread.outcome==='actual')return '已经发生的回响'
 if(thread.outcome==='non-success')return '这次选择留下的记录'
 if(thread.stage==='planned')return '已安排 · 尚未开工'
 if(thread.stage==='delivery')return '制作完成 · 等你提交'
 if(thread.wait)return '已经答应 · 仍在等待'
 return '眼前这件事 · 由你决定'
}

export {courseStageWaitDate}

/** A scene reads the original public thread; every action still uses the original command flow. */
export function OpeningMoment({p,headingRef,fallback,feedback,focus,focusQuarter,focusNotice,focusRequiresChoice=false,onFocus,onNavigate,onExplore,onResponsibilities,onRecollection,todayView,onToday,onReturnFocus}:Props){
 const [objectOpen,setObjectOpen]=useState(false),[directions,setDirections]=useState(false),[localFocus,setLocalFocus]=useState<OpeningFocus|null>(null)
 const [choicePanel,setChoicePanel]=useState<OpeningChoicePanel|null>(null)
 const [draftId,setDraftId]=useState<string|null>(null),[recollectionOpen,setRecollectionOpen]=useState(false)
 const [localQuarter,setLocalQuarter]=useState<string|null>(null)
 const [focusGroup,setFocusGroup]=useState<SeasonFocusGroup>('continue')
 const [localTodayAt,setLocalTodayAt]=useState<DayPerspective|null>(null)
 const [recordOpen,setRecordOpen]=useState(false)
 useEffect(()=>{if(localTodayAt&&!dayPerspectiveCurrent(p.view,localTodayAt))setLocalTodayAt(null)},[localTodayAt,p.view])
 const choiceName=useId(),candidates=seasonFocusChoices(p),picked=candidates.find(candidate=>candidate.id===draftId)
 const groupTitle=seasonFocusGroups.find(group=>group.id===focusGroup)!.label,groupCandidates=candidates.filter(candidate=>seasonFocusGroupFor(candidate)===focusGroup)
 const focusLocked=p.view.busy||p.controller.snapshot.busy||p.view.hasCandidate||p.view.saveStatus==='conflict'
 const showSceneReasons=!p.view.hasCandidate&&!p.view.readOnly&&p.view.saveStatus!=='conflict'
 const chooseFocus=onFocus??setLocalFocus
 const thread=playerThread(p,onFocus?focus:localFocus,onFocus?focusQuarter:localQuarter),w=p.features.workbench,first=p.features.firstOrder
 const day=todayThread(p,onFocus?focus:localFocus,onFocus?focusQuarter:localQuarter)
 const unknownFocus=focusRequiresChoice||thread.focusStatus==='invalid'
 const ownDelivery=!focusRequiresChoice&&thread.focusStatus!=='invalid'&&thread.focus.kind==='first-order'&&first.status==='awaiting_submission'
 const shortage=w.finance.find(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date))
 const otherAttention=w.pause!==null||!!shortage||w.events.some(e=>e.isBlocking||e.presentation!=='ordinary')||p.features.story.incidents.some(i=>i.resolvedAt===null&&!['normal','resolved'].includes(i.stage))
 const interrupted=thread.responsibilityOverrideNeeded&&(!ownDelivery||otherAttention)
 const attention:Moment=interrupted&&fallback.stage!=='attention'&&fallback.object!=='一封需要面对的来信'?{
  stage:'attention',object:shortage?'账本里需要面对的责任':'日历上的来信',title:shortage?'先把眼前的账，认真看清。':'日历里，有件事需要先回应。',line:shortage?'已经到期的付款或真实资金缺口仍在，原来的尝试会留在这里。':'先看看这件事为什么需要回应，再回到原来的尝试。',detail:'原承诺、费用与日期都保留；翻看不会替你接受新的安排。',inspect:{screen:shortage?'finance' as const:'quarter' as const,label:shortage?'核对原账与到期责任':'读这件需要回应的事',...(shortage?{accountId:shortage.accountId}:{})}}
  :fallback
 const requiresChoice=!interrupted&&unknownFocus
 const legacy=!interrupted&&!requiresChoice&&thread.legacyFallbackRequired
 const unread:Moment={stage:'choose-focus',object:'原来的关注尚未读出',title:'先选回这一季在意的事。',line:'还没有替你换成其他对象。请先翻看公开原记录，再明确放到桌面。',detail:'重新选择只调整书签；原合同、工作、费用与责任保留。'}
 const moment=interrupted?attention:requiresChoice?unread:legacy?fallback:thread
 const bookmarkQuarter=onFocus?focusQuarter:localQuarter
 const previousFocusNotice=!!bookmarkQuarter&&bookmarkQuarter<w.quarter&&focusNotice===`这份关注来自${bookmarkQuarter}，当前是${w.quarter}；可明确回看或继续原对象，不会自动改成本季关注。`
 const originPrefix=thread.focusQuarter&&thread.focusScope==='carry'?'这件事从'+thread.focusQuarter+'留下，仍按原约定继续。':thread.focusQuarter&&thread.focusScope==='history'?'这是'+thread.focusQuarter+'的原记录，旧收支不会重记为本季收入。':''
 const sceneLine=!interrupted&&!requiresChoice&&!legacy&&originPrefix&&moment.line.startsWith(originPrefix)?moment.line.slice(originPrefix.length):moment.line
 const meaning=!interrupted&&!requiresChoice&&!legacy?sceneMeaning({...p,accountId:thread.focus.accountId},thread):null
 const openDirections=()=>{setDraftId(null);setFocusGroup(initialSeasonFocusGroup(candidates));setDirections(true)}
 const openRecollection=()=>{setObjectOpen(false);if(onRecollection)onRecollection();else setRecollectionOpen(true)}
 const openToday=()=>{if(!day||focusLocked||p.controller.snapshot.view!==p.view)return;setObjectOpen(false);setChoicePanel(null);setDirections(false);setRecollectionOpen(false);if(thread.responsibilityOverrideNeeded){setLocalTodayAt(null);onReturnFocus?.();return}if(onToday)onToday();else setLocalTodayAt({runId:p.view.runId,revision:p.view.revision})}
 const returnToFocus=()=>{setLocalTodayAt(null);onReturnFocus?.()}
 const prepareToday=(next:OpeningFocus)=>{if(focusLocked||p.controller.snapshot.view!==p.view||next.runId!==p.view.runId)return;chooseFocus(next);if(!onFocus)setLocalQuarter(w.quarter)}
 const chooseToday=(next:OpeningFocus)=>{prepareToday(next);returnToFocus()}
 const inspectFocus=()=>{setObjectOpen(false);onNavigate(thread.inspect.screen,['video','course','relay'].includes(thread.inspect.screen)?{...thread.inspect.target,openRecord:true}:thread.inspect.target)}
 const inspect=()=>{
  setObjectOpen(false)
  if(interrupted){const target=attention.inspect;onNavigate(target?.screen??'quarter',target?{...(target.accountId?{accountId:target.accountId}:{}),...(target.personId?{personId:target.personId}:{}),...(target.lifeSelection?{lifeSelection:target.lifeSelection}:{}),...(target.recordId?{recordId:target.recordId}:{}),...(target.videoTarget?{videoTarget:target.videoTarget}:{}),...(target.courseTarget!==undefined?{courseTarget:target.courseTarget}:{}),...(target.courseDraftSlot?{courseDraftSlot:target.courseDraftSlot}:{}),...(target.courseTeachingSlot?{courseTeachingSlot:target.courseTeachingSlot}:{}),...(target.relayTarget!==undefined?{relayTarget:target.relayTarget}:{}),...(target.relayDraftSlot?{relayDraftSlot:target.relayDraftSlot}:{}),...(['video','course','relay'].includes(target.screen)?{openRecord:true}:{})}:undefined)}
  else if(requiresChoice)onNavigate('quarter',{accountId:p.accountId})
  else if(legacy){const target=fallback.inspect;if(target)onNavigate(target.screen,{...(target.accountId?{accountId:target.accountId}:{}),...(target.personId?{personId:target.personId}:{}),...(target.lifeSelection?{lifeSelection:target.lifeSelection}:{}),...(target.recordId?{recordId:target.recordId}:{}),...(target.videoTarget?{videoTarget:target.videoTarget}:{}),...(target.courseTarget!==undefined?{courseTarget:target.courseTarget}:{}),...(target.courseDraftSlot?{courseDraftSlot:target.courseDraftSlot}:{}),...(target.courseTeachingSlot?{courseTeachingSlot:target.courseTeachingSlot}:{}),...(target.relayTarget!==undefined?{relayTarget:target.relayTarget}:{}),...(target.relayDraftSlot?{relayDraftSlot:target.relayDraftSlot}:{}),...(['video','course','relay'].includes(target.screen)?{openRecord:true}:{})});else onNavigate('quarter')}
  else onNavigate(thread.inspect.screen,['video','course'].includes(thread.inspect.screen)?{...thread.inspect.target,openRecord:true}:thread.inspect.target)
 }
 const canWait=p.view.phase==='playing'&&!w.atQuarterEnd&&!w.progression.requiresDelivery&&w.pause===null
 const requested=moment.wait?.date??w.progression.nextQuarterDate??w.progression.nextDate
 const ordinaryDate=canWait?playableAdvanceDate(w,p.view.date,requested):null
 const safeDate=thread.focus.kind==='relay'?relayReviewDate(p,ordinaryDate):ordinaryDate
 const originalWaitLabel=moment.wait&&safeDate===moment.wait.date?moment.wait.label:'先到日历上的下一处反馈'
 const waitLabel=thread.focus.kind==='relay'?relayReviewLabel(p,safeDate,originalWaitLabel):originalWaitLabel
 const employed=w.employment.some(e=>e.segments.some(s=>s.to===null))
 const terminal=p.view.date>=playableThrough
 const market=thread.focus.kind==='market',free=thread.focus.kind==='free',video=thread.focus.kind==='video',course=thread.focus.kind==='course',relay=thread.focus.kind==='relay'
 const relayTarget=thread.focus.kind==='relay'?thread.focus.relayTarget:null
 const relayProps=relay?{...p,accountId:thread.focus.accountId}:p
 const deferredRelay=relay&&thread.command?.kind==='CollectRelayDue'&&canWait?relayDeferredFeedback({...p,accountId:thread.focus.accountId},relayTarget):null
 const relayProgress=relay&&!unknownFocus?relaySceneProgress(p.features.relay,p.view.date,relayTarget,relaySceneContext(p,thread.focus.accountId)):null
 const relayHistory=relayTarget?.kind==='period'&&(relayTarget.jobId!==undefined||relayTarget.meterId!==undefined)&&relayProgress?.historical===true
 const relayArt=!interrupted&&!requiresChoice&&!legacy&&relay?relayPaperFor(relayProps,relayTarget):undefined
 const relayMoney=relay&&!interrupted&&!requiresChoice&&!legacy?relayMoneyFor(relayProps,relayTarget):null
 const relayDisplayTitle=relayTarget?.kind==='period'?relayHistory?'这份原任务记录':'本期服务单':relayTarget?.kind==='customer'?'这位客户的服务与原账':relayTarget?.kind==='audience'?'这次获客的回信':relayTarget?.kind==='application'?'这份供应回信':'本站的服务夹'
 const chooseRelayTarget=(target:RelaySceneTarget|null)=>{
  if(focusLocked||unknownFocus||!relay)return
  const next=openingFocusFor(p,'relay',{relayTarget:target,accountId:target?.accountId??'personal'})
  if(next){chooseFocus(next);if(!onFocus)setLocalQuarter(w.quarter)}
 }
 const courseTarget=thread.focus.kind==='course'?thread.focus.courseTarget:null
 const courseProgress=course&&!unknownFocus?courseSceneProgress(p.features.course,p.view.date,courseTarget,courseSceneContext(p)):null
 const courseHistory=courseTarget?.kind==='cohort'&&courseTarget.jobId!==undefined&&courseProgress?.historical===true
 const teachingPaper=!interrupted&&!unknownFocus&&!legacy&&course?courseTeachingPaper(p,courseTarget):undefined
 const courseDisplayTitle=courseTarget?.kind==='cohort'?courseHistory?'这份原任务记录':'这一班的约定':courseTarget?.kind==='audience'?'这次受众的回信':undefined
 const chooseCourseTarget=(target:CourseSceneTarget|null)=>{
  if(focusLocked||unknownFocus||!course)return
  const owner=p.features.course?.businesses.find(b=>b.id===target?.businessId)
  const next=openingFocusFor(p,'course',{courseTarget:target,accountId:owner?.accountId??'personal'})
  if(next){chooseFocus(next);if(!onFocus)setLocalQuarter(w.quarter)}
 }
 const videoTarget=thread.focus.kind==='video'?thread.focus.videoTarget:null
 const videoChannel=p.features.video?.channels.find(c=>c.id===videoTarget?.channelId)
 const videoPreparation=['video-channel','video-marketing-completed','video-settled','video-published'].includes(thread.stage)
 const videoAction:VideoChoiceAction|undefined=videoPreparation?(videoChannel?.leads.length?'commission':'marketing'):undefined
 const chooseVideoTarget=(target:NonNullable<typeof videoTarget>)=>{
  if(focusLocked||unknownFocus||!video)return
  const next=openingFocusFor(p,'video',{videoTarget:target})
  if(next){chooseFocus(next);if(!onFocus)setLocalQuarter(w.quarter)}
 }
 const canChooseOrder=!interrupted&&!requiresChoice&&!legacy&&market&&(!thread.wait&&!thread.command)&&thread.outcome!=='actual'
 const primaryIntent=moment.command??(free&&thread.stage==='choose'?{kind:'StartLifeWork',payload:{kind:'rest',personId:null,reference:null}}:null)
 let primaryAllowed=canChooseOrder
 if(primaryIntent)try{primaryAllowed=p.controller.preview({runId:p.view.runId,actorId:'player',commandId:'display-preview',expectedRevision:p.view.revision,kind:primaryIntent.kind,payload:primaryIntent.payload}).allowed}catch{primaryAllowed=false}
 const resultWithoutNext=!moment.command&&!moment.wait&&(thread.outcome==='actual'||thread.outcome==='non-success')
 const noAvailableNewAction=p.view.budget.available===0&&!moment.wait&&(!primaryAllowed||free||market)
 const optionalCourseDate=!interrupted&&!unknownFocus&&!legacy&&canWait&&!moment.wait&&course?courseStageWaitDate(w,p.view.date,courseProgress):null
 const continueDate=courseProgress?.phase==='course-stage-needed'?optionalCourseDate:safeDate
 const canContinue=thread.focusScope!=='history'&&!interrupted&&!unknownFocus&&!legacy&&!w.atQuarterEnd&&canWait&&continueDate!==null&&(resultWithoutNext||noAvailableNewAction||optionalCourseDate!==null)
 const continuation=()=> <div className="moment-wait moment-continue"><ClockAdvance showReason={showSceneReasons} p={p} date={continueDate!} label={'不新增安排，让原日子继续 · '+continueDate} room/></div>
 const research=w.researches.find(r=>r.id==='market-overview')
 const closeRequest:GamePanelProps['request']=(...args)=>{setObjectOpen(false);setDirections(false);p.request(...args)}
 const nearProps={...p,accountId:video||course||relay?thread.focus.accountId:p.accountId,request:closeRequest}
 const action=(index:string,label:string,caption:string,perform:()=>void)=>{
  const binding=makeSharedAction(p,label,perform,{allowReadOnly:true})
  return <button type="button" className={'moment-decision'+(index==='01'?' moment-primary':'')} disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">{index}</b><span>{label}<small>{caption}</small></span><i aria-hidden="true">↗</i></button>
 }
 const courseInspectLabel=course&&courseTarget?.kind==='audience'?'翻阅这次受众与报价':course&&courseTarget?.kind==='cohort'?courseTarget.jobId?'翻阅这一段的实际记录':'翻阅这一班的学员与承诺':null
 const inspectLabel=courseInspectLabel??(thread.focusScope==='history'&&thread.focus.kind==='work'&&thread.focusQuarter!==null?'翻看'+thread.focusQuarter+'的原工作记录':thread.inspect.label)
 const originalAction=(near=false,openOrder?:()=>void,openVideo?:(intent?:VideoChoiceAction)=>void,openCourse?:(intent?:CourseChoiceIntent)=>void,openRelay?:()=>void)=>{
  const current=near||relay?nearProps:p
  if(requiresChoice)return action('01','重新选择原关注','先翻阅，再明确把对象放到桌面',openDirections)
  if(!interrupted&&!legacy&&w.atQuarterEnd)return action('01','看看这一季，真实留下了什么',terminal?'翻阅原结果，旧约定和尾声仍需核对':'只翻阅实际结果，旧约定仍保留',openRecollection)
  if(canChooseOrder&&openOrder)return action('01','选择一份模拟委托','自己选标的、股数、价格和期限',()=>{setObjectOpen(false);openOrder()})
  if(moment.command)return <CommandButton showReason={near||showSceneReasons} {...current} {...moment.command} confirm={moment.command.confirm??true} className="moment-decision moment-primary"><b aria-hidden="true">01</b><span>{moment.command.label}<small>看清投入，再由你确认</small></span><i aria-hidden="true">→</i></CommandButton>
  if(moment.wait&&safeDate)return <div className="moment-wait moment-primary"><ClockAdvance showReason={near||showSceneReasons} p={current} date={safeDate} label={waitLabel+' · '+safeDate} room/></div>
  if(!interrupted&&!legacy&&relayHistory&&relayTarget.kind==='period')return action('01','回到同一期，核对接下来的约定','只回到这期当前记录，不重做原任务',()=>{setObjectOpen(false);const {jobId:originalJob,...periodTarget}=relayTarget;void originalJob;chooseRelayTarget(periodTarget)})
  if(!interrupted&&!legacy&&relay&&openRelay)return action('01',thread.inspect.label,relayProgress?.intent==='service'?'显选客户、供应与投入，再看原确认':relayProgress?.intent==='audit'?'只核对已经发生的计量，再由你确认':'翻看同一对象；查看不会安排服务或收款',()=>{setObjectOpen(false);openRelay()})
  if(!interrupted&&!legacy&&video&&openVideo)return action('01',thread.stage==='video-entry'?'选择账号，开始这次视频尝试':thread.stage==='video-marketing-completed'?'看看谁真正需要这份作品':thread.stage==='video-settled'?'保留这笔回执，选择下一次尝试':thread.stage==='video-channel'?(videoChannel?.leads.length?'回应一位真实询价的客户':'先认识这批具体受众'):thread.stage==='video-ready-to-publish'?'为这份作品选择发布方式':thread.stage==='video-revision'?'看清修改，选择怎样回应':'走近这份原作品与约定','先选择和核对；真正投入仍由你最后确认',()=>{setObjectOpen(false);openVideo(thread.stage==='video-ready-to-publish'?'publish':videoAction)})
  if(!interrupted&&!legacy&&courseHistory&&courseTarget.kind==='cohort')return action('01','回到这一班，看看接下来的约定','只回到同班当前安排；这份原任务记录仍保留',()=>{setObjectOpen(false);chooseCourseTarget({kind:'cohort',businessId:courseTarget.businessId,courseId:courseTarget.courseId,cohortId:courseTarget.cohortId})})
  if(!interrupted&&!legacy&&course&&openCourse)return action('01',courseTarget?.kind==='audience'||courseTarget?.kind==='cohort'?thread.inspect.label:thread.stage==='course-ready'?'看看谁真正需要这堂课':thread.outcome==='actual'?'带着这份教学准备，核对下一步':'走近这份教案，准备眼前一步',courseTarget?.kind==='audience'||courseTarget?.kind==='cohort'?courseProgress?.teachingIntent?'看清这次实际投入与下一处反馈，再由你确认':'翻看同一对象的实际记录，不新增安排':thread.stage==='course-ready'?'自选报价与真实受众；开班和报名仍各自决定':'案例、权利与样课分别核对；招生另定，原责任继续',()=>{setObjectOpen(false);openCourse()})
  if(!interrupted&&!legacy&&free&&thread.stage==='choose')return <CommandButton showReason={near||showSceneReasons} {...current} kind="StartLifeWork" payload={{kind:'rest',personId:null,reference:null}} label="把七天留给自己" confirm className="moment-decision moment-primary"><b aria-hidden="true">01</b><span>把七天留给自己<small>个人0元 · 本季1点 · 七日后看到实际结果</small></span><i aria-hidden="true">→</i></CommandButton>
  if(!interrupted&&!legacy&&thread.focus.kind==='first-order'&&thread.stage==='paid')return action('01','看看这份手艺，还能用在哪里','了解眼下可做的作品，不自动接下一单',()=>{setObjectOpen(false);onNavigate('video',{accountId:'personal'})})
  return action('01',interrupted?attention.inspect?.label??'先面对眼前的事':legacy?fallback.inspect?.label??'翻看原业务':inspectLabel,'翻开同一件事的原记录',inspect)
 }
 const label=interrupted?'先面对这项原责任':requiresChoice?'尚未改变关注':legacy?'原业务仍按原约定继续':day?.primary.classification==='active'&&thread.focus.kind==='work'?'本季工作仍在继续 · 工资按原日历发生':day?.primary.classification==='active'&&thread.stage==='market-position'?'仍在持有 · 浮盈不是现金':day?.primary.classification==='active'&&thread.stage==='market-settlement'&&thread.wait?'原款仍待交收 · 目前不可花':stageLabel(thread)
 const attempt=!interrupted&&!requiresChoice&&!legacy&&!w.atQuarterEnd?openingAttempt(p,onFocus?focus:localFocus,onFocus?focusQuarter:localQuarter):null
 const firstAttempt=attempt?.firstOrder
 const firstFacts=firstAttempt?firstOrderFacts(firstAttempt):null
 const courseReady=course&&!interrupted&&!requiresChoice&&!legacy&&thread.focusScope!=='history'&&thread.stage==='course-ready'&&courseTarget?.kind==='course'&&courseProgress?.historical!==true
 const summarized=firstFacts!==null||meaning!==null&&(courseReady||relay&&relayTarget?.kind==='period'&&!relayHistory)
 // Collection covers this customer's full due balance, possibly across periods.
 // That exact command scope takes precedence over the current period summary.
 const collectionScope=summarized&&relay&&thread.stage==='relay-collection'?sceneLine:null
 const recordBinding=makeSharedAction(p,requiresChoice?'翻看本季已有记录':'翻阅这一段的记录与代价',()=>{if(requiresChoice)onNavigate('quarter',{accountId:p.accountId});else setRecordOpen(true)},{allowReadOnly:true})
 const recordLink=(openRelay:(intent?:'record')=>void)=>{
  const binding=relay&&!requiresChoice&&!legacy?makeSharedAction(p,relayTarget===null?'翻看这次开站的条件与投入':'翻看同一份服务的原票与回应',()=>{setObjectOpen(false);openRelay('record')},{allowReadOnly:true}):recordBinding
  return <button type="button" className="scene-text-action" disabled={binding.disabled} onClick={binding.activate}>{binding.label} ↗</button>
 }
 const entryPaper=attempt?.kind==='free-entry'?'calendar' as const:attempt?.kind==='market-entry'?'market' as const:undefined
 const firstObjectLabel=firstAttempt?({letter:'待答复',planned:'已安排 · 等开工',running:'制作中',delivery:'作品待提交',feedback:'已发送 · 等回信',paid:'实收凭证','non-success':({declined:'已婉拒',skipped:'已略过',expired:'报价已到期',cancelled:'已取消',interrupted:'工作已中断',missed:'错过交付期限'} as Record<string,string>)[thread.stage]??'这次留下的记录'}[firstAttempt.phase]):null
 const firstArt:FirstOrderArtState|undefined=firstAttempt?firstAttempt.phase==='paid'?firstAttempt.receipt?.date?{phase:'paid',receipt:{receivedFen:firstAttempt.receipt.amountFen,receivedAt:firstAttempt.receipt.date}}:undefined:{phase:firstAttempt.phase,dateLabel:firstAttempt.phase==='letter'?'最迟'+firstAttempt.dates.replyBy+'答复':firstAttempt.phase==='planned'?'开工 '+firstAttempt.dates.startAt:firstAttempt.phase==='running'||firstAttempt.phase==='delivery'?'提交 '+firstAttempt.dates.submitBy:firstAttempt.phase==='feedback'?moment.wait?.date??'等待客户回复':p.features.firstOrder.decision?'答复 '+p.features.firstOrder.decision.date:firstAttempt.needsAttention?'原约定仍待处理':'原记录保留'}:undefined
 const changeAttempt=(next:OpeningFocus)=>{if(focusLocked||next.runId!==p.view.runId||p.controller.snapshot.view!==p.view)return;chooseFocus(next);if(!onFocus)setLocalQuarter(w.quarter);setChoicePanel(null)}
 const dayActive=!!day&&!interrupted&&!requiresChoice&&!legacy&&(day.primary.supported||thread.focusScope==='history')&&(!w.atQuarterEnd||thread.focusScope==='history')
 const videoArt=!interrupted&&!requiresChoice&&!legacy&&video?videoPaperFor(thread):undefined
 const classArt=!interrupted&&!requiresChoice&&!legacy&&course?courseTeachingPaperFor(p,courseTarget):undefined
 const teachingMoney=classArt?courseTeachingMoneyFor(p,courseTarget):null
 const courseComplete=course&&!interrupted&&!requiresChoice&&!legacy&&courseAttemptClosed(p,thread)
 const currentCohortContext=meaning&&course&&!courseComplete&&courseTarget?.kind==='cohort'&&courseTarget.jobId===undefined&&thread.focusScope!=='history'?meaning.situation:null
 const closedCopy=classArt?.phase==='closed'&&thread.focusScope!=='history'&&p.view.saveStatus==='saved'&&!p.view.hasCandidate?courseTeachingClosureFor(p,courseTarget):null
 // Only this class's complete closure-only receipt gets a shorter first layer.
 // A different result or any additional fact keeps its original presentation.
 const closedEcho=closedCopy&&isValidElement<ComponentProps<typeof SceneTimeNotice>>(feedback)&&feedback.type===SceneTimeNotice&&feedback.props.compact===true&&feedback.props.date===p.view.date&&sceneTimeNarrative(p.view.date,feedback.props.text)===closedCopy.originalEcho
 const sceneFeedback=closedEcho?cloneElement(feedback,{brief:closedCopy.line}):feedback
 const courseArt=!interrupted&&!requiresChoice&&!legacy&&course?coursePreparationPaperFor(thread):undefined
 const quarterBinding=!interrupted&&!unknownFocus&&!legacy&&w.atQuarterEnd&&thread.focusScope!=='history'?makeSharedAction(p,'看看这一季，真实留下了什么',openRecollection,{allowReadOnly:true}):null
 const quarterPrimary=quarterBinding?{binding:quarterBinding,main:<div className="command moment-decision moment-primary"><button type="button" disabled={quarterBinding.disabled} onClick={quarterBinding.activate}><b aria-hidden="true">01</b><span>{quarterBinding.label}<small>翻阅实际结果，所有未完约定继续保留</small></span><i aria-hidden="true">↗</i></button>{quarterBinding.reason?<small className="reason">{quarterBinding.reason}</small>:null}</div>}:null
 const videoChooseIntent:VideoChoiceAction|undefined=thread.stage==='video-quality'?'rework':thread.stage==='video-ready-to-publish'?'publish':undefined
 const dayArt:DayContinuityArt|undefined=dayActive&&['work','life','market'].includes(thread.focus.kind)?{kind:thread.focus.kind as 'work'|'life'|'market',state:thread.focusScope==='history'?'history':day?.primary.classification==='result'?'result':thread.focusScope==='carry'?'carry':'ongoing'}:undefined
 if((todayView??dayPerspectiveCurrent(p.view,localTodayAt))&&day&&!thread.responsibilityOverrideNeeded&&!interrupted&&!requiresChoice&&!legacy)return <TodayScene p={p} today={day} headingRef={headingRef} feedback={feedback} onFocus={chooseToday} onPrepare={prepareToday} onResume={returnToFocus} onExplore={onExplore} onRecollection={openRecollection} onNavigate={onNavigate}/>
 return <MarketSceneChoice p={p} onFullRecord={inspect} blockedReason={unknownFocus?'原来的关注尚未读出，请先重新选择；原委托草稿仍保留。':null}>{openOrder=><VideoSceneChoice p={video?{...p,accountId:thread.focus.accountId}:p} {...(videoTarget?{target:videoTarget}:{})} onTargetChange={chooseVideoTarget} onToday={openToday} onLife={()=>{setObjectOpen(false);onNavigate('life',{accountId:'personal'})}} blockedReason={unknownFocus?"原来的关注尚待读出，请先明确重新选择。":interrupted?"先回应日历里的原责任；原视频草稿仍保留。":null} onInspect={target=>{setObjectOpen(false);onNavigate('video',target?{openRecord:true,videoTarget:target,...(p.features.video?.channels.find(c=>c.id===target.channelId)?{accountId:p.features.video.channels.find(c=>c.id===target.channelId)!.accountId}:{})}:{openRecord:true,accountId:video?thread.focus.accountId:p.accountId})}}>{openVideo=><CourseSceneChoice p={course?{...p,accountId:thread.focus.accountId}:p} target={courseTarget} onTarget={chooseCourseTarget} onToday={openToday} onLife={()=>{setObjectOpen(false);onNavigate('life',{accountId:'personal'})}} blockedReason={unknownFocus?'原关注尚待读出，请先明确重新选择。':interrupted?'先回应日历里的原责任；这份教案仍保留。':null} onInspect={(target,slot,teachingSlot)=>{setObjectOpen(false);const owner=p.features.course?.businesses.find(b=>b.id===target?.businessId),recordId=!slot&&!teachingSlot?courseSceneProgress(p.features.course,p.view.date,target,courseSceneContext(p))?.recordId:undefined;onNavigate('course',{openRecord:true,courseTarget:target,accountId:owner?.accountId??'personal',...(recordId?{recordId}:{}),...(slot?{courseDraftSlot:slot}:{}),...(teachingSlot?{courseTeachingSlot:teachingSlot}:{})})}}>{openCourse=><RelaySceneChoice p={relayProps} target={relayTarget} onToday={openToday} onLife={()=>{setObjectOpen(false);onNavigate('life',{accountId:'personal'})}} onTargetChange={chooseRelayTarget} blockedReason={unknownFocus?'原关注尚待读出，请先明确重新选择。':interrupted?'先回应日历里的原责任；这份服务单仍保留。':null} onInspect={(target,slot,requestedRecordId)=>{setObjectOpen(false);const accountId=target?.accountId??(relay?thread.focus.accountId:p.accountId),recordId=requestedRecordId??(!slot?relaySceneProgress(p.features.relay,p.view.date,target,relaySceneContext(p,accountId))?.recordId:undefined);onNavigate('relay',{openRecord:true,relayTarget:target,accountId,...(recordId?{recordId}:{}),...(slot?{relayDraftSlot:slot}:{})})}}>{openRelay=><RelayThreadAction p={relayProps} thread={thread} target={relayTarget} active={dayActive&&!attempt&&relay} date={safeDate} waitLabel={waitLabel} onChoose={intent=>{setObjectOpen(false);openRelay(intent)}} onToday={openToday}>{relayPrimary=><OpeningAttemptAction p={p} attempt={attempt} date={safeDate} waitLabel={waitLabel} openOffer={()=>setChoicePanel('offer')} openMarket={()=>setChoicePanel('market')} openFree={()=>setChoicePanel('free')} openNext={()=>setChoicePanel('next')} onToday={openToday} inspect={inspect}>{primary=><VideoThreadAction p={nearProps} thread={thread} active={dayActive&&!attempt&&video} date={safeDate} waitLabel={waitLabel} onChoose={()=>{setObjectOpen(false);openVideo(videoChooseIntent)}} onResult={()=>{setObjectOpen(false);openVideo('next')}} onToday={openToday}>{videoPrimary=><CourseThreadAction p={nearProps} thread={thread} active={dayActive&&!attempt&&course&&isCourseContinuityThread(thread)} date={safeDate} waitLabel={waitLabel} onChoose={intent=>{setObjectOpen(false);openCourse(intent)}} onResult={()=>{setObjectOpen(false);openCourse('next')}} onToday={openToday}>{coursePrimary=><DayThreadAction p={p} thread={thread} active={dayActive&&!attempt&&!video&&!course&&!relay} result={day?.primary.classification==='result'} date={safeDate} waitLabel={waitLabel} onToday={openToday}>{dayPrimary=><><RoomTableau scene={interrupted?'attention':requiresChoice?'unavailable':thread.focus.kind} state={moment.stage} perspective={thread.focusScope} textOnly={p.textOnly===true}
 intention={<p className="opening-room-intention"><span>我想{thread.wish.label}</span>{!unknownFocus&&!w.atQuarterEnd?<button type="button" onClick={openDirections}>调整本季书签 ↗</button>:null}{!w.atQuarterEnd?<button type="button" onClick={openRecollection}>翻本季留页 ↗</button>:null}</p>}
 heading={<header className="moment-heading"><p>{thread.focusScope==='history'?'正在回看 · ':''}{moment.object}</p><h1 ref={headingRef} tabIndex={-1}>{meaning?.title??moment.title}</h1></header>}
 context={<><p className="opening-room-stage" data-interrupted={interrupted?'true':undefined}>{label}{interrupted?<span> · 原来的关注仍保留</span>:previousFocusNotice?<span> · 原书签未变（{bookmarkQuarter}）</span>:null}</p>{meaning?.question?<p className="tableau-question">{meaning.question}</p>:null}</>}
 feedback={<>{interrupted?<p className="season-return-bookmark">{unknownFocus?'原关注尚待读出。先面对原责任，再明确重选；没有换成另一项安排。':'书签留着：'+thread.object+'。原责任处理后，回来核对这件事的当前状态。'}</p>:null}
   {focusNotice&&!previousFocusNotice?<p className="season-focus-notice" role="status">{focusNotice}</p>:null}
   {thread.focusScope==='invalid'&&thread.invalidReason?<p className="season-focus-notice" role="status">{thread.invalidReason}</p>:null}
   {!interrupted&&!requiresChoice&&!legacy&&thread.focusScope==='history'?<p className="season-focus-notice">正在回看{thread.focusQuarter}，今天仍是{p.view.date}。旧收支不会重记为本季收入。</p>:null}
   {sceneFeedback?<div className={typeof sceneFeedback==='string'?'moment-status':'moment-feedback'} role={typeof sceneFeedback==='string'?'status':undefined}>{sceneFeedback}</div>:null}</>}
 facts={<>{currentCohortContext?<p className="moment-line">{currentCohortContext}</p>:null}{!closedEcho?firstFacts?firstFacts.map(line=><p key={line} className="moment-line">{line}</p>):<p className="moment-line">{collectionScope??(summarized?meaning!.situation:closedCopy?.line??sceneLine)}</p>:null}{!summarized&&(closedCopy?.terms||moment.detail)?<p className="moment-terms">{closedCopy?.terms??moment.detail}</p>:null}{teachingMoney?<p className="course-scene-money">{teachingMoney}</p>:null}{relayMoney?<p className="relay-scene-money">{relayMoney}</p>:null}{courseComplete?<button type="button" className="scene-text-action" onClick={inspectFocus}>翻阅本班的完整原记录 ↗</button>:null}</>}
 decisions={<>

   {primary?.main??quarterPrimary?.main??videoPrimary?.main??coursePrimary?.main??relayPrimary?.main??dayPrimary?.main??originalAction(false,openOrder,openVideo,openCourse,openRelay)}
   {interrupted?unknownFocus?action('02','只翻本季已有记录','原关注待重选；这项原责任不会因此解除',()=>onNavigate('quarter',{accountId:p.accountId})):action('02','只翻原来关注的那件事','只查看；这项原责任不会因此解除',inspectFocus)
    :!requiresChoice&&!legacy&&thread.focusScope==='history'?action('02',inspectLabel,'只回看，不新增工作、交易或推进日期',inspectFocus)
    :deferredRelay?<div className="moment-wait moment-continue"><ClockAdvance showReason={showSceneReasons} p={nearProps} date={deferredRelay.date} label={deferredRelay.label+' · '+deferredRelay.date} room/></div>
    :courseReady?action('02','把样课收好，回到今天','保留这份准备与原书签，新的招生仍另行决定',openToday)
    :attempt?.action.kind==='next-choice'?action('02','看看这份经历，还能通向哪些尝试','先看手艺、生活与模拟判断，不自动新增安排',()=>setChoicePanel('next'))
    :!requiresChoice&&!legacy&&!w.atQuarterEnd&&relay&&relayTarget?.kind==='period'&&!relayHistory?action('02','先回到今天，留些时间给生活','原支持、待复核与旧款照原日历保留',openToday)
    :courseComplete?action('02','看看再备一堂课前的选择','查看下一次准备或生活方向，不招生、不付款',()=>openCourse('next'))
    :dayActive&&!attempt&&(day?.primary.classification==='result'||thread.stage==='market-position')?action('02',inspectLabel,'只翻阅同一件事的实际结果与全部原记录',inspectFocus)
    :requiresChoice?action('02','翻看本季已有记录','只翻阅，不代你换到另一项安排',()=>onNavigate('quarter',{accountId:p.accountId}))
    :!legacy&&w.atQuarterEnd?terminal?action('02','翻回原记录与未完约定','正常篇已到原结点，后续沿原尾声',inspect):action('02','下一季，还想把什么放在桌面','只调整书签，不接受新安排',openDirections)
    :noAvailableNewAction&&canContinue?continuation()
    :attempt?.kind==='free-entry'?action('02','先看看日历上已有的安排','只翻阅工作与生活记录，不新增承诺',()=>onNavigate('quarter',{accountId:'personal'}))
    :attempt?.kind==='market-entry'?action('02','先核对生活储备','查看个人现金、占款与已知责任，不下单',()=>onNavigate('finance',{accountId:'personal'}))
    :canContinue&&!thread.secondaryCommand?continuation()
    :!legacy&&thread.secondaryCommand?<CommandButton showReason={showSceneReasons} {...p} {...thread.secondaryCommand} className="moment-decision"><b aria-hidden="true">02</b><span>{thread.secondaryCommand.label}<small>按原记录核对这次决定</small></span><i aria-hidden="true">→</i></CommandButton>
    :!interrupted&&canChooseOrder&&research&&!research.state?<CommandButton showReason={showSceneReasons} {...p} kind="ResearchMarket" payload={{definitionId:research.id}} label="先把公开产业线索理一理" confirm className="moment-decision"><b aria-hidden="true">02</b><span>先把公开产业线索理一理<small>个人{moneyText(research.costFen)} · {research.actionPoints}点 · {research.days}日，不代你买股</small></span><i aria-hidden="true">→</i></CommandButton>
    :!interrupted&&!legacy&&course&&(courseTarget?.kind==='cohort'||courseTarget?.kind==='audience')&&(p.view.budget.available<2||p.view.readOnly||p.view.hasCandidate)?action('02',courseTarget.kind==='cohort'?'翻看这一班的原记录':'翻看这次受众的原记录','先看同一件事；其他选择仍需另行确认',()=>{setObjectOpen(false);if(p.view.hasCandidate||p.view.saveStatus==='conflict'||p.view.saveStatus==='unsaved')inspectFocus();else openCourse('record')})
    :!interrupted&&!legacy&&relay&&(p.view.budget.available<2||p.view.readOnly||p.view.hasCandidate)?action('02',relayTarget?.kind==='period'?'翻看本期约定与原账':'翻看同一对象的原记录','只翻阅同一对象，不新增工作或改变日期',inspectFocus)
    :!interrupted&&!legacy&&!employed&&!market&&moment.command?.kind!=='WorkQuarter'?<CommandButton showReason={showSceneReasons} {...p} kind="WorkQuarter" payload={{}} label="先保留这一季的工作" confirm className="moment-decision"><b aria-hidden="true">02</b><span>先保留这一季的工作<small>共享本季2点 · 按实际在岗日领工资，可与副业组合</small></span><i aria-hidden="true">→</i></CommandButton>
    :action('02',!legacy&&thread.outcome==='actual'?'给接下来的日子，留一点余地':'等候时，也看看生活','只翻阅休整与相识的人，不改变本季书签',()=>onNavigate('life',{accountId:'personal'}))}
   {canContinue&&(courseReady||attempt?.action.kind==='next-choice'||thread.secondaryCommand||dayActive&&!attempt&&(day?.primary.classification==='result'||thread.stage==='market-position'))?continuation():<button type="button" className="moment-explore" onClick={interrupted?(onResponsibilities??onExplore):onExplore}>{interrupted?'翻看全部原责任与牵挂':'环顾房间，想想别的可能'} <span aria-hidden="true">↗</span></button>}
 </>}
 object={<OpeningObject copyMode="tableau" {...(relayArt?{relayPaper:{...relayArt,...(relayPrimary?{actionHint:relayPrimary.hint}:{})},displayTitle:''}:{})} {...(videoArt?{videoPaper:videoArt,displayTitle:''}:{})} {...(courseArt?{coursePaper:courseArt,displayTitle:''}:{})} {...(classArt?{teachingPaper:classArt,displayTitle:''}:{})} {...(dayArt?{dayPaper:dayArt,displayTitle:''}:{})} {...(entryPaper?{entryPaper,displayTitle:''}:{})} {...(firstArt?{displayTitle:''}:{})} {...(!interrupted&&!requiresChoice&&(video||course||relay)?{appearance:relay?'relay' as const:course?'course' as const:'video' as const}:{})} {...(!interrupted&&!requiresChoice&&relay&&!relayArt?{displayTitle:relayDisplayTitle}:{})} {...(!interrupted&&!requiresChoice&&courseDisplayTitle&&!classArt?{displayTitle:courseDisplayTitle}:{})} {...(teachingPaper?{teaching:teachingPaper}:{})} kind={interrupted||requiresChoice?'calendar':legacy?(moment.wait?'waiting':'portfolio'):objectKind(thread)} title={moment.object} detail={relayArt?'':courseArt||classArt?(moment.wait&&!(coursePrimary?.binding.label.includes(moment.wait.date)&&coursePrimary?.binding.label.includes(moment.wait.label))?moment.wait.date+' · '+moment.wait.label:''):videoArt?(moment.wait&&!(videoPrimary?.binding.label.includes(moment.wait.date)&&videoPrimary?.binding.label.includes(moment.wait.label))?moment.wait.date+' · '+moment.wait.label:''):entryPaper?p.view.date:firstArt?'':moment.wait?moment.wait.date+' · '+moment.wait.label:interrupted?'这项责任仍需你回应':requiresChoice?'原记录与责任都保留，先明确重新选择':legacy?'沿原业务记录继续':thread.outcome==='actual'?'回响已有实际记录':'翻开，看清这次选择'} stageLabel={relayArt?relayTarget===null?'服务资料':relayDisplayTitle:classArt?courseTeachingPaperLabel(classArt):entryPaper==='calendar'?'接下来，自己安排':entryPaper==='market'?'公开市场资料':firstObjectLabel??label} actionLabel={primary?.binding.label??quarterPrimary?.binding.label??videoPrimary?.binding.label??coursePrimary?.binding.label??relayPrimary?.binding.label??dayPrimary?.binding.label??(requiresChoice?'重新选择原关注':'走近这件事')} {...(firstArt?{firstOrder:firstArt}:{})} {...(p.view.readOnly?{protection:'readonly' as const}:p.view.hasCandidate||p.view.saveStatus!=='saved'?{protection:'unsaved' as const}:(primary?.binding.disabled??quarterPrimary?.binding.disabled??videoPrimary?.binding.disabled??coursePrimary?.binding.disabled??relayPrimary?.binding.disabled??dayPrimary?.binding.disabled)?{protection:'unavailable' as const}:{})} disabled={primary?.binding.disabled??quarterPrimary?.binding.disabled??videoPrimary?.binding.disabled??coursePrimary?.binding.disabled??relayPrimary?.binding.disabled??dayPrimary?.binding.disabled??p.view.busy} textOnly={p.textOnly===true} onActivate={primary?.binding.activate??quarterPrimary?.binding.activate??videoPrimary?.binding.activate??coursePrimary?.binding.activate??relayPrimary?.binding.activate??dayPrimary?.binding.activate??(requiresChoice?openDirections:()=>setObjectOpen(true))}/>}
 record={recordLink(openRelay)}
 />
  {recordOpen?<Dialog title={moment.object+' · 记录与代价'} className="opening-paper tableau-source-record" onClose={()=>setRecordOpen(false)}><p className="opening-paper-date">今天 {p.view.date} · {label}</p><h3>{moment.title}</h3><p>{moment.line}</p><p>{moment.detail}</p>{collectionScope&&meaning?<p>{meaning.situation}</p>:null}{!interrupted&&!requiresChoice&&!legacy?<p>这一步想走到：{thread.finishWhen}</p>:null}{attempt?<p>{attempt.purpose}</p>:null}{firstFacts?.map(line=><p key={line}>{line}</p>)}{teachingMoney?<p>{teachingMoney}</p>:null}{relayMoney?<p>{relayMoney}</p>:null}{meaning?.sourceRefs.length?<details><summary>核对这段处境的实际来源</summary>{meaning.sourceRefs.map(ref=><p key={ref.kind+':'+ref.id+':'+(ref.date??'')}>{ref.kind} · {ref.date??'原记录日期'} · <code>{ref.id}</code></p>)}</details>:null}{attempt?.action.kind==='next-choice'?<button type="button" onClick={()=>{setRecordOpen(false);setChoicePanel('next')}}>翻看手艺、生活与模拟判断的后续选择</button>:null}{courseReady?<button type="button" onClick={()=>{setRecordOpen(false);openCourse('next')}}>翻看这间教室的其它选择与旧责任</button>:null}<button type="button" onClick={()=>{setRecordOpen(false);if(interrupted||legacy)inspect();else inspectFocus()}}>翻开这件事的完整原册 ↗</button></Dialog>:null}

  {objectOpen&&!attempt?<Dialog title={moment.object} className="opening-paper" onClose={()=>setObjectOpen(false)}><p className="opening-paper-date">{p.view.date} · {label}</p>{previousFocusNotice?<p className="season-focus-notice" role="status">{focusNotice}</p>:null}<h3>{moment.title}</h3><p>{moment.line}</p>{moment.detail?<p className="opening-paper-terms">{moment.detail}</p>:null}{originalAction(true,openOrder,openVideo,openCourse,openRelay)}{!interrupted&&!unknownFocus&&!legacy&&thread.stage==='offer'?<div className="opening-paper-alternatives"><CommandButton {...nearProps} kind="DeclineOffer" payload={{offerId:first.offerId}} label="婉拒这笔报价" confirm/><CommandButton {...nearProps} kind="SkipOffer" payload={{offerId:first.offerId}} label="先跳过这次小单" confirm/></div>:null}<button type="button" className="scene-text-action" onClick={inspect}>{unknownFocus?'翻看本季已有记录':'翻看同一件事的全部原记录'} ↗</button></Dialog>:null}
  {choicePanel&&attempt?<OpeningAttemptChoices p={p} attempt={attempt} panel={choicePanel} onClose={()=>setChoicePanel(null)} onInspect={inspect} onMarket={()=>{setChoicePanel(null);openOrder()}} onExplore={()=>{setChoicePanel(null);onExplore()}} onFocus={changeAttempt} onNavigate={onNavigate}/>:null}
  {directions?<Dialog title={'这一季，先把哪件事放在桌面？ · '+groupTitle} className="opening-paper season-focus-book" onClose={()=>setDirections(false)} footer={<div className="season-focus-footer">
   <nav className="season-focus-groups" aria-label="按眼前约定、方向与历史翻阅书签">{seasonFocusGroups.map(group=><button type="button" key={group.id} aria-pressed={focusGroup===group.id} onClick={()=>setFocusGroup(group.id)}>{group.label} · {candidates.filter(candidate=>seasonFocusGroupFor(candidate)===group.id).length}</button>)}</nav>
   <p className="season-selection-note" role="status">{picked?<>待确认：<strong>{picked.title}</strong> · {seasonFocusGroups.find(group=>group.id===seasonFocusGroupFor(picked))!.label}{picked.originQuarter?' · 来源'+picked.originQuarter:''}{picked.date?' · 原日期'+picked.date:''}。尚未改变原书签。{picked.disabledReason?' '+picked.disabledReason:''}</>:'尚未改变原关注。先选一个对象预看，再明确放到桌面。'}</p>
   <div className="season-focus-actions"><button type="button" onClick={()=>setDirections(false)}>仍留原来的书签</button><button type="button" className="primary" disabled={!picked||picked.disabledReason!==null||focusLocked} onClick={()=>{if(!picked||picked.disabledReason!==null||focusLocked)return;chooseFocus(picked.focus);if(!onFocus)setLocalQuarter(picked.originQuarter??w.quarter);setDirections(false);setDraftId(null);returnToFocus()}}>把这件事放到桌面</button></div>
  </div>}>
   <p>你想{thread.wish.label}。{thread.yearQuestion} 先翻看具体对象，再决定调整书签；不接受合同、工作、交易或新权限。</p>
   <p className="opening-paper-date">当前{w.quarter} · {p.view.date} · 本季共享四点保持原数</p>
   {focusLocked?<p className="season-focus-notice" role="status">正在保存、有原候选或存在冲突时，先保留原关注；仍可翻阅这些记录。</p>:null}
   {groupCandidates.map(candidate=><label className="season-focus-choice" key={candidate.id} data-selected={draftId===candidate.id?'true':undefined}><input type="radio" name={choiceName} value={candidate.id} checked={draftId===candidate.id} disabled={candidate.disabledReason!==null} onChange={()=>setDraftId(candidate.id)}/><span><strong>{candidate.title}</strong><span className="season-choice-origin">{candidate.scope==='history'?'历史回看':candidate.scope==='carry'?'旧约定延续':candidate.scope==='entry'?'可查看的方向':'本季原对象'}{candidate.originQuarter?' · '+candidate.originQuarter:''}{candidate.date?' · 原日期'+candidate.date:''}</span><span>{candidate.line}</span>{candidate.nextDate?<span className="season-choice-date">{candidate.nextDate>p.view.date?'下一公开反馈':'原反馈日期'} · {candidate.nextDate}</span>:null}{candidate.disabledReason?<span className="reason">{candidate.disabledReason}</span>:null}</span></label>)}
   {!groupCandidates.length?<p>这组尚无可定位的公开对象。仍可翻看另外两组和完整原记录，不为凑选项新增安排。</p>:null}
   <button type="button" className="scene-text-action" onClick={()=>{setDirections(false);onExplore()}}>只环顾房间，不新增安排 ↗</button>
  </Dialog>:null}
  {recollectionOpen?<SeasonRecollection p={p} onClose={()=>setRecollectionOpen(false)} onNavigate={onNavigate} onChooseFocus={openDirections} onToday={openToday} onContinueFocus={chooseToday}/>:null}
 </>}</DayThreadAction>}</CourseThreadAction>}</VideoThreadAction>}</OpeningAttemptAction>}</RelayThreadAction>}</RelaySceneChoice>}</CourseSceneChoice>}</VideoSceneChoice>}</MarketSceneChoice>
}
