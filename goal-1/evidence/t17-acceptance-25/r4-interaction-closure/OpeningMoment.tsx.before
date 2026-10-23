import {useId,useState,type Ref,type ReactNode} from 'react'
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
import {courseSceneContext} from './course-player-thread.ts'
import {courseTeachingPaper} from './course-teaching-paper.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {moneyText,playableThrough} from './game-text.ts'
import {seasonFocusChoices} from './season-thread.ts'
import {SeasonRecollection} from './SeasonRecollection.tsx'

type Props={p:GamePanelProps;headingRef:Ref<HTMLHeadingElement>;fallback:Moment;feedback?:ReactNode;focus?:OpeningFocus|null|undefined;focusQuarter?:string|null|undefined;focusNotice?:string|null|undefined;focusRequiresChoice?:boolean|undefined;onFocus?:((focus:OpeningFocus|null)=>void)|undefined;onNavigate:NavigateScene;onExplore:()=>void;onResponsibilities?:(()=>void)|undefined;onRecollection?:(()=>void)|undefined}

function objectKind(thread:PlayerThreadView):OpeningObjectProps['kind']{
 if(thread.focus.kind==='market')return 'portfolio'
 if(thread.focus.kind==='course')return thread.outcome==='actual'?'receipt':thread.wait?'waiting':thread.stage.includes('planned')?'calendar':'portfolio'
 if(thread.focus.kind==='video'){
  if(thread.outcome==='actual'||thread.outcome==='non-success')return 'receipt'
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
 if(thread.focus.kind==='course'){
  if(thread.stage==='course-unavailable')return '尚未开放 · 没有接受教学承诺'
  if(thread.stage.endsWith('-planned'))return '已经安排 · 尚未实际开工'
  if(thread.stage.endsWith('-running'))return thread.stage==='course-stage-running'?'正在教学 · 尚未实际交付':thread.stage==='course-support-running'||thread.stage==='course-recovery-running'?'正在支持 · 仍待实际反馈':'正在准备 · 尚未实际完成'
  if(thread.stage==='course-ready')return '样课已经完成 · 招生仍另行决定'
  if(thread.stage==='course-outline-completed')return '大纲已经完成 · 样课仍另行准备'
  if(thread.stage==='course-license-completed')return '课程使用范围已准备 · 样课仍另行准备'
 }
 if(thread.focus.kind==='video'){
  const label:Record<string,string>={'video-planned':'已安排 · 尚未开工','video-marketing-planned':'已安排 · 尚未开工','video-self-review':'制作实际完成 · 尚未人工核对','video-submit':'本版已核对 · 等你亲手提交','video-client-review':'已提交 · 尚未验收','video-payment-wait':'已验收 · 尚未到账','video-revision':'客户要求修改 · 尚未验收','video-quality':'实际发现的问题 · 等你处理','video-entry':'先选择这次尝试的账号','video-channel':'原账号已建立 · 选择一次具体尝试'}
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

/** A scene reads the original public thread; every action still uses the original command flow. */
export function OpeningMoment({p,headingRef,fallback,feedback,focus,focusQuarter,focusNotice,focusRequiresChoice=false,onFocus,onNavigate,onExplore,onResponsibilities,onRecollection}:Props){
 const [objectOpen,setObjectOpen]=useState(false),[directions,setDirections]=useState(false),[localFocus,setLocalFocus]=useState<OpeningFocus|null>(null)
 const [draftId,setDraftId]=useState<string|null>(null),[recollectionOpen,setRecollectionOpen]=useState(false)
 const [localQuarter,setLocalQuarter]=useState<string|null>(null)
 const choiceName=useId(),candidates=seasonFocusChoices(p),picked=candidates.find(candidate=>candidate.id===draftId)
 const focusLocked=p.view.busy||p.controller.snapshot.busy||p.view.hasCandidate||p.view.saveStatus==='conflict'
 const chooseFocus=onFocus??setLocalFocus
 const thread=playerThread(p,onFocus?focus:localFocus,onFocus?focusQuarter:localQuarter),w=p.features.workbench,first=p.features.firstOrder
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
 const openDirections=()=>{setDraftId(null);setDirections(true)}
 const openRecollection=()=>{setObjectOpen(false);if(onRecollection)onRecollection();else setRecollectionOpen(true)}
 const inspectFocus=()=>{setObjectOpen(false);onNavigate(thread.inspect.screen,['video','course'].includes(thread.inspect.screen)?{...thread.inspect.target,openRecord:true}:thread.inspect.target)}
 const inspect=()=>{
  setObjectOpen(false)
  if(interrupted){const target=attention.inspect;onNavigate(target?.screen??'quarter',target?{...(target.accountId?{accountId:target.accountId}:{}),...(target.personId?{personId:target.personId}:{}),...(target.lifeSelection?{lifeSelection:target.lifeSelection}:{}),...(target.recordId?{recordId:target.recordId}:{}),...(target.videoTarget?{videoTarget:target.videoTarget}:{}),...(target.courseTarget!==undefined?{courseTarget:target.courseTarget}:{}),...(target.courseDraftSlot?{courseDraftSlot:target.courseDraftSlot}:{}),...(target.courseTeachingSlot?{courseTeachingSlot:target.courseTeachingSlot}:{}),...(['video','course'].includes(target.screen)?{openRecord:true}:{})}:undefined)}
  else if(requiresChoice)onNavigate('quarter',{accountId:p.accountId})
  else if(legacy){const target=fallback.inspect;if(target)onNavigate(target.screen,{...(target.accountId?{accountId:target.accountId}:{}),...(target.personId?{personId:target.personId}:{}),...(target.lifeSelection?{lifeSelection:target.lifeSelection}:{}),...(target.recordId?{recordId:target.recordId}:{}),...(target.videoTarget?{videoTarget:target.videoTarget}:{}),...(target.courseTarget!==undefined?{courseTarget:target.courseTarget}:{}),...(target.courseDraftSlot?{courseDraftSlot:target.courseDraftSlot}:{}),...(target.courseTeachingSlot?{courseTeachingSlot:target.courseTeachingSlot}:{}),...(['video','course'].includes(target.screen)?{openRecord:true}:{})});else onNavigate('quarter')}
  else onNavigate(thread.inspect.screen,['video','course'].includes(thread.inspect.screen)?{...thread.inspect.target,openRecord:true}:thread.inspect.target)
 }
 const canWait=p.view.phase==='playing'&&!w.atQuarterEnd&&!w.progression.requiresDelivery&&w.pause===null
 const requested=moment.wait?.date??w.progression.nextQuarterDate??w.progression.nextDate
 const safeDate=canWait?playableAdvanceDate(w,p.view.date,requested):null
 const waitLabel=moment.wait&&safeDate===moment.wait.date?moment.wait.label:'先到日历上的下一处反馈'
 const employed=w.employment.some(e=>e.segments.some(s=>s.to===null))
 const terminal=p.view.date>=playableThrough
 const market=thread.focus.kind==='market',free=thread.focus.kind==='free',video=thread.focus.kind==='video',course=thread.focus.kind==='course'
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
 const noAvailableNewAction=p.view.budget.available===0&&!primaryAllowed&&!moment.wait
 const canContinue=!interrupted&&!unknownFocus&&!legacy&&!w.atQuarterEnd&&canWait&&safeDate!==null&&(resultWithoutNext||noAvailableNewAction)
 const continuation=()=> <div className="moment-wait moment-continue"><ClockAdvance p={p} date={safeDate!} label={'不新增安排，让原日子继续 · '+safeDate} room/></div>
 const research=w.researches.find(r=>r.id==='market-overview')
 const closeRequest:GamePanelProps['request']=(...args)=>{setObjectOpen(false);setDirections(false);p.request(...args)}
 const nearProps={...p,accountId:video||course?thread.focus.accountId:p.accountId,request:closeRequest}
 const action=(index:string,label:string,caption:string,perform:()=>void)=> <button type="button" className={'moment-decision'+(index==='01'?' moment-primary':'')} onClick={perform}><b aria-hidden="true">{index}</b><span>{label}<small>{caption}</small></span><i aria-hidden="true">↗</i></button>
 const inspectLabel=thread.focusScope==='history'&&thread.focus.kind==='work'&&thread.focusQuarter!==null?'翻看'+thread.focusQuarter+'的原工作记录':thread.inspect.label
 const originalAction=(near=false,openOrder?:()=>void,openVideo?:(intent?:VideoChoiceAction)=>void,openCourse?:(intent?:CourseChoiceIntent)=>void)=>{
  const current=near?nearProps:p
  if(requiresChoice)return action('01','重新选择原关注','先翻阅，再明确把对象放到桌面',openDirections)
  if(!interrupted&&!legacy&&w.atQuarterEnd)return action('01','看看这一季，真实留下了什么',terminal?'翻阅原结果，旧约定和尾声仍需核对':'只翻阅实际结果，旧约定仍保留',openRecollection)
  if(canChooseOrder&&openOrder)return action('01','选择一份模拟委托','自己选标的、股数、价格和期限',()=>{setObjectOpen(false);openOrder()})
  if(moment.command)return <CommandButton {...current} {...moment.command} confirm={moment.command.confirm??true} className="moment-decision moment-primary"><b aria-hidden="true">01</b><span>{moment.command.label}<small>看清投入，再由你确认</small></span><i aria-hidden="true">→</i></CommandButton>
  if(moment.wait&&safeDate)return <div className="moment-wait moment-primary"><ClockAdvance p={current} date={safeDate} label={waitLabel+' · '+safeDate} room/></div>
  if(!interrupted&&!legacy&&video&&openVideo)return action('01',thread.stage==='video-entry'?'选择账号，开始这次视频尝试':thread.stage==='video-marketing-completed'?'看看谁真正需要这份作品':thread.stage==='video-settled'?'保留这笔回执，选择下一次尝试':thread.stage==='video-channel'?(videoChannel?.leads.length?'回应一位真实询价的客户':'先认识这批具体受众'):thread.stage==='video-ready-to-publish'?'为这份作品选择发布方式':thread.stage==='video-revision'?'看清修改，选择怎样回应':'走近这份原作品与约定','先选择和核对；真正投入仍由你最后确认',()=>{setObjectOpen(false);openVideo(thread.stage==='video-ready-to-publish'?'publish':videoAction)})
  if(!interrupted&&!legacy&&courseHistory&&courseTarget.kind==='cohort')return action('01','回到这一班，看看接下来的约定','只回到同班当前安排；这份原任务记录仍保留',()=>{setObjectOpen(false);chooseCourseTarget({kind:'cohort',businessId:courseTarget.businessId,courseId:courseTarget.courseId,cohortId:courseTarget.cohortId})})
  if(!interrupted&&!legacy&&course&&openCourse)return action('01',courseTarget?.kind==='audience'||courseTarget?.kind==='cohort'?thread.inspect.label:thread.stage==='course-ready'?'看看谁真正需要这堂课':thread.outcome==='actual'?'带着这份教学准备，核对下一步':'走近这份教案，准备眼前一步',courseTarget?.kind==='audience'||courseTarget?.kind==='cohort'?'看清本班实际投入与下一处反馈，再由你确认':thread.stage==='course-ready'?'自选报价与真实受众；开班和报名仍各自决定':'案例、权利与样课分别核对；招生另定，原责任继续',()=>{setObjectOpen(false);openCourse()})
  if(!interrupted&&!legacy&&free&&thread.stage==='choose')return <CommandButton {...current} kind="StartLifeWork" payload={{kind:'rest',personId:null,reference:null}} label="把七天留给自己" confirm className="moment-decision moment-primary"><b aria-hidden="true">01</b><span>把七天留给自己<small>个人0元 · 本季1点 · 七日后看到实际结果</small></span><i aria-hidden="true">→</i></CommandButton>
  if(!interrupted&&!legacy&&thread.focus.kind==='first-order'&&thread.stage==='paid')return action('01','看看这份手艺，还能用在哪里','了解眼下可做的作品，不自动接下一单',()=>{setObjectOpen(false);onNavigate('video',{accountId:'personal'})})
  return action('01',interrupted?attention.inspect?.label??'先面对眼前的事':legacy?fallback.inspect?.label??'翻看原业务':inspectLabel,'翻开同一件事的原记录',inspect)
 }
 const label=interrupted?'先面对这项原责任':requiresChoice?'尚未改变关注':legacy?'原业务仍按原约定继续':stageLabel(thread)
 return <MarketSceneChoice p={p} onFullRecord={inspect} blockedReason={unknownFocus?'原来的关注尚未读出，请先重新选择；原委托草稿仍保留。':null}>{openOrder=><VideoSceneChoice p={video?{...p,accountId:thread.focus.accountId}:p} {...(videoTarget?{target:videoTarget}:{})} onTargetChange={chooseVideoTarget} blockedReason={unknownFocus?"原来的关注尚待读出，请先明确重新选择。":interrupted?"先回应日历里的原责任；原视频草稿仍保留。":null} onInspect={target=>{setObjectOpen(false);onNavigate('video',target?{openRecord:true,videoTarget:target,...(p.features.video?.channels.find(c=>c.id===target.channelId)?{accountId:p.features.video.channels.find(c=>c.id===target.channelId)!.accountId}:{})}:{openRecord:true,accountId:video?thread.focus.accountId:p.accountId})}}>{openVideo=><CourseSceneChoice p={course?{...p,accountId:thread.focus.accountId}:p} target={courseTarget} onTarget={chooseCourseTarget} blockedReason={unknownFocus?'原关注尚待读出，请先明确重新选择。':interrupted?'先回应日历里的原责任；这份教案仍保留。':null} onInspect={(target,slot,teachingSlot)=>{setObjectOpen(false);const owner=p.features.course?.businesses.find(b=>b.id===target?.businessId),recordId=!slot&&!teachingSlot?courseSceneProgress(p.features.course,p.view.date,target,courseSceneContext(p))?.recordId:undefined;onNavigate('course',{openRecord:true,courseTarget:target,accountId:owner?.accountId??'personal',...(recordId?{recordId}:{}),...(slot?{courseDraftSlot:slot}:{}),...(teachingSlot?{courseTeachingSlot:teachingSlot}:{})})}}>{openCourse=><><p className="opening-room-intention"><span>我想{thread.wish.label}</span><span>{unknownFocus?'先选回原来的关注，原安排仍保留。':legacy?'原来的经营事项，还在继续。':thread.attempt}</span>{!unknownFocus&&!w.atQuarterEnd?<button type="button" onClick={openDirections}>调整本季书签 ↗</button>:null}{!w.atQuarterEnd?<button type="button" onClick={openRecollection}>翻本季留页 ↗</button>:null}</p>
 <section className="room-current-moment opening-current-moment" data-stage={moment.stage} data-focus-scope={thread.focusScope} aria-label="眼前这一幕">
  <header className="moment-heading"><p>{w.quarter} / {moment.object}</p><h1 ref={headingRef} tabIndex={-1}>{moment.title}</h1></header>
  <p className="opening-room-stage" data-interrupted={interrupted?'true':undefined}>{label}{interrupted?<span> · 原来的关注仍保留</span>:null}</p>
  <div className="moment-story" aria-label="眼前的情况">
   {interrupted?<p className="season-return-bookmark">{unknownFocus?'原关注尚待读出。先面对原责任，再明确重选；没有换成另一项安排。':'书签留着：'+thread.object+'。原责任处理后，回来核对这件事的当前状态。'}</p>:null}
   {focusNotice?<p className="season-focus-notice" role="status">{focusNotice}</p>:null}
   {thread.focusScope==='invalid'&&thread.invalidReason?<p className="season-focus-notice" role="status">{thread.invalidReason}</p>:null}
   {feedback?<div className={typeof feedback==='string'?'moment-status':'moment-feedback'} role={typeof feedback==='string'?'status':undefined}>{feedback}</div>:null}
   <p className="moment-line">{moment.line}</p><p className="moment-terms">{moment.detail}</p>
  </div>
  <div className="moment-decisions">
   {originalAction(false,openOrder,openVideo,openCourse)}
   {interrupted?unknownFocus?action('02','只翻本季已有记录','原关注待重选；这项原责任不会因此解除',()=>onNavigate('quarter',{accountId:p.accountId})):action('02','只翻原来关注的那件事','只查看；这项原责任不会因此解除',inspectFocus)
    :requiresChoice?action('02','翻看本季已有记录','只翻阅，不代你换到另一项安排',()=>onNavigate('quarter',{accountId:p.accountId}))
    :!legacy&&w.atQuarterEnd?terminal?action('02','翻回原记录与未完约定','正常篇已到原结点，后续沿原尾声',inspect):action('02','下一季，还想把什么放在桌面','只调整书签，不接受新安排',openDirections)
    :canContinue&&!thread.secondaryCommand?continuation()
    :!legacy&&thread.secondaryCommand?<CommandButton {...p} {...thread.secondaryCommand} className="moment-decision"><b aria-hidden="true">02</b><span>{thread.secondaryCommand.label}<small>按原记录核对这次决定</small></span><i aria-hidden="true">→</i></CommandButton>
    :!interrupted&&canChooseOrder&&research&&!research.state?<CommandButton {...p} kind="ResearchMarket" payload={{definitionId:research.id}} label="先把公开产业线索理一理" confirm className="moment-decision"><b aria-hidden="true">02</b><span>先把公开产业线索理一理<small>个人{moneyText(research.costFen)} · {research.actionPoints}点 · {research.days}日，不代你买股</small></span><i aria-hidden="true">→</i></CommandButton>
    :!interrupted&&!legacy&&!employed&&!market&&moment.command?.kind!=='WorkQuarter'?<CommandButton {...p} kind="WorkQuarter" payload={{}} label="先保留这一季的工作" confirm className="moment-decision"><b aria-hidden="true">02</b><span>先保留这一季的工作<small>共享本季2点 · 按实际在岗日领工资，可与副业组合</small></span><i aria-hidden="true">→</i></CommandButton>
    :action('02',!legacy&&thread.outcome==='actual'?'给接下来的日子，留一点余地':'等候时，也看看生活','只翻阅休整与相识的人，不改变本季书签',()=>onNavigate('life',{accountId:'personal'}))}
   {canContinue&&thread.secondaryCommand?continuation():<button type="button" className="moment-explore" onClick={interrupted?(onResponsibilities??onExplore):onExplore}>{interrupted?'翻看全部原责任与牵挂':'环顾房间，想想别的可能'} <span aria-hidden="true">↗</span></button>}
  </div>
 </section>
  <OpeningObject {...(!interrupted&&!requiresChoice&&(video||course)?{appearance:course?'course' as const:'video' as const}:{})} {...(!interrupted&&!requiresChoice&&courseDisplayTitle?{displayTitle:courseDisplayTitle}:{})} {...(teachingPaper?{teaching:teachingPaper}:{})} kind={interrupted||requiresChoice?'calendar':legacy?(moment.wait?'waiting':'portfolio'):objectKind(thread)} title={moment.object} detail={moment.wait?moment.wait.date+' · '+moment.wait.label:interrupted?'这项责任仍需你回应':requiresChoice?'原记录与责任都保留，先明确重新选择':legacy?'沿原业务记录继续':thread.outcome==='actual'?'回响已有实际记录':'翻开，看清这次选择'} stageLabel={label} actionLabel={requiresChoice?'重新选择原关注':'走近这件事'} disabled={p.view.busy} textOnly={p.textOnly===true} onActivate={requiresChoice?openDirections:()=>setObjectOpen(true)}/>
  {objectOpen?<Dialog title={moment.object} className="opening-paper" onClose={()=>setObjectOpen(false)}><p className="opening-paper-date">{p.view.date} · {label}</p><h3>{moment.title}</h3><p>{moment.line}</p><p className="opening-paper-terms">{moment.detail}</p>{originalAction(true,openOrder,openVideo,openCourse)}{!interrupted&&!unknownFocus&&!legacy&&thread.stage==='offer'?<div className="opening-paper-alternatives"><CommandButton {...nearProps} kind="DeclineOffer" payload={{offerId:first.offerId}} label="婉拒这笔报价" confirm/><CommandButton {...nearProps} kind="SkipOffer" payload={{offerId:first.offerId}} label="先跳过这次小单" confirm/></div>:null}<button type="button" className="scene-text-action" onClick={inspect}>{unknownFocus?'翻看本季已有记录':'翻看同一件事的全部原记录'} ↗</button></Dialog>:null}
  {directions?<Dialog title="这一季，先把哪件事放在桌面？" className="opening-paper season-focus-book" onClose={()=>setDirections(false)} footer={<div className="season-focus-actions"><button type="button" onClick={()=>setDirections(false)}>仍留原来的书签</button><button type="button" className="primary" disabled={!picked||picked.disabledReason!==null||focusLocked} onClick={()=>{if(!picked||picked.disabledReason!==null||focusLocked)return;chooseFocus(picked.focus);if(!onFocus)setLocalQuarter(picked.originQuarter??w.quarter);setDirections(false);setDraftId(null)}}>把这件事放到桌面</button></div>}>
   <p>你想{thread.wish.label}。{thread.yearQuestion} 先翻看具体对象，再决定调整书签；不接受合同、工作、交易或新权限。</p>
   <p className="opening-paper-date">当前{w.quarter} · {p.view.date} · 本季共享四点保持原数</p>
   {focusLocked?<p className="season-focus-notice" role="status">正在保存、有原候选或存在冲突时，先保留原关注；仍可翻阅这些记录。</p>:null}
   {candidates.map(candidate=><label className="season-focus-choice" key={candidate.id} data-selected={draftId===candidate.id?'true':undefined}><input type="radio" name={choiceName} value={candidate.id} checked={draftId===candidate.id} disabled={candidate.disabledReason!==null} onChange={()=>setDraftId(candidate.id)}/><span><strong>{candidate.title}</strong><span className="season-choice-origin">{candidate.scope==='history'?'历史回看':candidate.scope==='carry'?'旧约定延续':candidate.scope==='entry'?'可查看的方向':'本季原对象'}{candidate.originQuarter?' · '+candidate.originQuarter:''}{candidate.date?' · 原日期'+candidate.date:''}</span><span>{candidate.line}</span>{candidate.nextDate?<span className="season-choice-date">{candidate.nextDate>p.view.date?'下一公开反馈':'原反馈日期'} · {candidate.nextDate}</span>:null}{candidate.disabledReason?<span className="reason">{candidate.disabledReason}</span>:null}</span></label>)}
   {!candidates.length?<p>当前没有可定位的公开对象。原记录与五条路线仍可翻阅，不为凑选项新增安排。</p>:null}
   <p className="season-selection-note">{picked?'已选来预看：'+picked.title+'。点击“放到桌面”才调整关注。':'尚未改变原关注。先选一个对象查看，再明确放到桌面。'}</p>
   <button type="button" className="scene-text-action" onClick={()=>{setDirections(false);onExplore()}}>只环顾房间，不新增安排 ↗</button>
  </Dialog>:null}
  {recollectionOpen?<SeasonRecollection p={p} onClose={()=>setRecollectionOpen(false)} onNavigate={onNavigate} onChooseFocus={openDirections}/>:null}
 </>}</CourseSceneChoice>}</VideoSceneChoice>}</MarketSceneChoice>
}
