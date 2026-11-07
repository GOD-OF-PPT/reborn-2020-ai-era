import {obligationTargetFor,cashPauseTarget} from './obligation-scene.ts'
import {defaultWaitDate,defaultWaitLabel} from './default-wait-window.ts'
import {useEffect,useRef,useState,type Ref,type ReactNode} from 'react'
import {RoomMoment} from './RoomMoment.tsx'
import {SceneJournal,lifeWorkTarget} from './SceneJournal.tsx'
import {sceneShortcut} from './scene-season.ts'
import {Dialog} from './Dialog.tsx'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import type {LifePerson} from '../core/life-schema.ts'
import {RoomBackdrop} from './RoomBackdrop.tsx'
import {RoomExploration} from './RoomExploration.tsx'
import {StoryQueue} from './StoryQueue.tsx'
import {LifeQueue} from './LifeQueue.tsx'
import {Obligations} from './Obligations.tsx'
import {EventCard} from './QuarterPanel.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {moneyText,playableThrough} from './game-text.ts'
import {openingFocusAfterSave,type OpeningFocus} from './player-thread.ts'
import {SeasonRecollection} from './SeasonRecollection.tsx'
import {makeSharedAction} from './shared-action.ts'
import {dayPerspectiveCurrent,type DayPerspective} from './day-perspective.ts'
import {EquityFollowNotice} from './EquityFollowNotice.tsx'
import {EquitySceneChoice} from './EquitySceneChoice.tsx'
import {equityFocusFromSaved,type EquityThreadInput} from './equity-player-thread.ts'
import {equityTargetEntity,type EquitySceneTarget} from './equity-scene-target.ts'
import type {EquityChoiceIntent} from './equity-journey.ts'
import {canonicalJson} from '../core/identity.ts'

type Props=GamePanelProps&{readingContext?:string;initialToday?:DayPerspective|null;todayPerspective?:DayPerspective|null;onTodayPerspective?:(perspective:DayPerspective|null)=>void;headingRef:Ref<HTMLHeadingElement>;notice:string|null;timeEcho?:ReactNode;onNavigate:NavigateScene;onPeople:(id?:LifePerson)=>void;onYear:()=>void;onJourney?:()=>void;openingFocus?:OpeningFocus|null;focusQuarter?:string|null|undefined;focusNotice?:string|null|undefined;focusRequiresChoice?:boolean|undefined;onOpeningFocus?:(focus:OpeningFocus|null)=>void;onSavedFollowFocus?:(focus:OpeningFocus)=>void}
const ecoContractStatus={production:'制作中',review:'等待客户复核',rejected:'客户未接受，待处理',support:'支持进行中',completed:'已经履约',cancelled:'已经退出'}
const todayChoices=new Set(['WorkQuarter','StartLifeWork','ResearchMarket','PlanStockOrder','PlaceStockOrder'])

export function CinematicRoom(p:Props){
 const [responsibilities,setResponsibilities]=useState(false),[exploring,setExploring]=useState(false),[records,setRecords]=useState(false)
 const [recollection,setRecollection]=useState(false),[localTodayAt,setLocalTodayAt]=useState<DayPerspective|null>(()=>p.initialToday?.runId===p.view.runId?p.initialToday:null)
 const [followPanel,setFollowPanel]=useState<{target:EquitySceneTarget;intent:EquityChoiceIntent}|null>(null)
 const followHandoff=useRef<{previous:EquityThreadInput;payload:Record<string,unknown>;focusKey:string;exploring:boolean;todayKey:string}|null>(null)
 const todayHandoff=useRef<{controller:GamePanelProps['controller'];session:string|undefined;context:string|undefined;previous:Pick<GamePanelProps,'view'|'features'>;kind:string;payload:Record<string,unknown>;focusKey:string;todayKey:string;readingKey:string}|null>(null)
 const todayAt=p.onTodayPerspective?p.todayPerspective??null:localTodayAt,setTodayAt=p.onTodayPerspective??setLocalTodayAt
 const momentRoot=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  if(exploring)momentRoot.current?.querySelector<HTMLHeadingElement>('.room-chapter h1')?.focus({preventScroll:true})
 },[exploring])
 const {view,features:f}=p,w=f.workbench
 useEffect(()=>{
  const origin=followHandoff.current;if(!origin)return
  const saved=equityFocusFromSaved(origin.previous,{view,features:f},'FollowEquityRound',origin.payload)
  const focusKey=canonicalJson(p.openingFocus??null),sameFocus=focusKey===origin.focusKey||saved!==null&&focusKey===canonicalJson(saved)
  // A committed revision retires Today by itself. A new explicit reading does
  // not acquire the result of this older request, including after an abort.
  const sameToday=canonicalJson(todayAt)===origin.todayKey||saved!==null&&todayAt===null
  if(!sameFocus||exploring!==origin.exploring||!sameToday){followHandoff.current=null;return}
  if(view.busy||p.controller.snapshot.busy||p.controller.snapshot.view!==view)return
  if(saved){followHandoff.current=null;setExploring(false);setTodayAt(null);if(focusKey!==canonicalJson(saved))p.onSavedFollowFocus?.(saved)}
  else if(view.runId!==origin.previous.view.runId||view.revision!==origin.previous.view.revision)followHandoff.current=null
 },[view,f,p.openingFocus,p.onSavedFollowFocus,p.controller,exploring,todayAt,setTodayAt])
 const readingKey=canonicalJson([exploring,records,recollection,responsibilities])
 useEffect(()=>{
  const origin=todayHandoff.current;if(!origin)return
  if(origin.controller!==p.controller||origin.session!==p.controller.runtimeSession||origin.context!==p.readingContext){todayHandoff.current=null;return}
  const free:OpeningFocus={runId:origin.previous.view.runId,kind:'free',accountId:'personal',entityId:null}
  const next=openingFocusAfterSave(origin.previous,{view,features:f},origin.kind,origin.payload,free)
  const saved=next!==null&&next.kind!=='free'?next:null,focusKey=canonicalJson(p.openingFocus??null)
  const sameFocus=focusKey===origin.focusKey||saved!==null&&focusKey===canonicalJson(saved)
  const sameToday=canonicalJson(todayAt)===origin.todayKey||saved!==null&&todayAt===null
  if(!sameFocus||!sameToday||readingKey!==origin.readingKey){todayHandoff.current=null;return}
  if(view.busy||p.controller.snapshot.busy||p.controller.snapshot.view!==view)return
  if(saved){todayHandoff.current=null;setTodayAt(null);if(focusKey!==canonicalJson(saved))(p.onSavedFollowFocus??p.onOpeningFocus)?.(saved)}
  else if(view.runId!==origin.previous.view.runId||view.revision!==origin.previous.view.revision)todayHandoff.current=null
 },[view,f,p.openingFocus,p.onOpeningFocus,p.onSavedFollowFocus,p.controller,p.controller.runtimeSession,p.readingContext,todayAt,setTodayAt,readingKey])
 const requestScene:GamePanelProps['request']=(kind,payload,label,confirm)=>{
  todayHandoff.current=null
  if(todayChoices.has(kind)&&dayPerspectiveCurrent(view,todayAt)&&!view.readOnly&&!view.hasCandidate&&view.saveStatus==='saved'&&!view.busy&&!p.controller.snapshot.busy&&p.controller.snapshot.view===view&&typeof payload==='object'&&payload!==null&&!Array.isArray(payload)){
   try{todayHandoff.current={controller:p.controller,session:p.controller.runtimeSession,context:p.readingContext,previous:{view,features:f},kind,payload:JSON.parse(canonicalJson(payload)) as Record<string,unknown>,focusKey:canonicalJson(p.openingFocus??null),todayKey:canonicalJson(todayAt),readingKey}}catch{/* Invalid payload still follows the original request and validation. */}
  }
  p.request(kind,payload,label,confirm)
 }
 const opening=view.phase==='playing'
 const showToday=()=>makeSharedAction(p,'回到今天',()=>{setRecollection(false);setExploring(false);setTodayAt(w.pause||w.progression.requiresDelivery?null:{runId:view.runId,revision:view.revision})},{allowReadOnly:true}).activate()
 const returnToFocus=()=>setTodayAt(null)
 useEffect(()=>{if(todayAt&&!dayPerspectiveCurrent(view,todayAt))setTodayAt(null)},[todayAt,view,setTodayAt])
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{
   const target=event.target instanceof Element?event.target:null
   if(event.defaultPrevented||event.repeat||event.isComposing||!target?.closest('#main-content'))return
   const destination=sceneShortcut(event.key,!!target.closest('input,textarea,select,[contenteditable]:not([contenteditable=false])'),!!document.querySelector('dialog[open]'),event.ctrlKey||event.altKey||event.metaKey||event.shiftKey)
   if(exploring&&destination){event.preventDefault();p.onNavigate(destination);return}
   if(!exploring&&/^[1-3]$/.test(event.key)&&destination){
    const buttons=momentRoot.current?.querySelectorAll<HTMLButtonElement>('.moment-decisions>.command>button,.moment-decisions>button,.moment-wait .clock-main>button')
    const button=buttons?.[Number(event.key)-1]
    if(button&&!button.disabled&&!button.inert&&!button.closest('[inert]')){event.preventDefault();button.click()}
   }
  }
  document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)
 },[p.onNavigate,exploring])
 const forced=w.events.filter(e=>e.presentation!=='ordinary'||e.isBlocking)
 const debts=w.finance.flatMap(a=>a.obligations.filter(o=>o.remainingFen>0&&o.date<=view.date))
 const shortages=w.finance.filter(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0)
 const incidents=f.story.incidents.filter(i=>i.resolvedAt===null&&i.stage!=='normal')
 const urgent=forced.length+debts.length+shortages.length+incidents.length+f.life.queued.length+(w.pause?1:0)
 const canAdvance=(view.date<playableThrough||view.date===playableThrough&&!w.atQuarterEnd)&&!w.progression.requiresDelivery&&w.pause===null
 const nextDate=canAdvance?(w.progression.nextQuarterDate??playableAdvanceDate(w,view.date,defaultWaitDate(w,typeof p.requestWait==='function'))):null
 const commitmentRows=[
  ...(f.course?.updates??[]).filter(u=>u.resolvedAt===null).map(u=>({id:u.id,screen:'course' as const,link:'查看课程更新选择',text:`课程工具变化 · ${u.dueAt}前更新或停售，旧学员责任保留`})),
  ...(f.course?.cohorts??[]).filter(c=>c.closedAt===null).map(c=>({id:c.id,screen:'course' as const,link:'查看课程日历',text:`班期${c.startAt} · 教学${c.endAt} / 支持${c.supportCompleteAt} / 退款窗口${c.refundUntil}`})),
  ...(f.relay?.businesses??[]).filter(b=>b.lifecycle!=='closed').map(b=>({id:b.id,screen:'relay' as const,link:'查看服务与客户',text:`中转 · 保护余额${moneyText(b.funds.prepaidLiabilityFen)} / 应付${moneyText(b.funds.payableFen)} / 应收${moneyText(b.funds.receivableFen)}`})),
  ...(f.deepseek?.contracts??[]).filter(c=>!['completed','cancelled'].includes(c.status)).map(c=>({id:c.id,screen:'deepseek' as const,link:'查看合作记录',text:`生态合作 · ${ecoContractStatus[c.status]} · 预款保护${moneyText(c.balance?.prepaidFen)} / 应收${moneyText(c.balance?.receivableFen)}`})),
  ...(f.deepseek?.agreements??[]).map(a=>({id:a.id,screen:'deepseek' as const,link:'查看架空投资约定',text:`明确架空股权 · ${a.shares}/${a.totalShares}股 · 锁定至${a.lockUntil} · ${a.followDecision==='pending'?'跟投待决定，默认不付款':'估值不是可花现金'}`})),
  ...(f.routines?.plans??[]).filter(r=>r.status==='paused'||r.status==='confirmed').map(r=>({id:r.id,screen:'routines' as const,link:'查看例行安排',text:`例行计划 · ${r.name} · ${r.status==='paused'?'未来步骤已暂停':'已确认，仍待逐项执行'}`})),
 ]
 const panel=followPanel?.target.runId===view.runId?followPanel:null
 const followProps={...p,accountId:panel?.target.accountId??p.accountId,request:((kind,payload,label,confirm)=>{
  if(kind==='FollowEquityRound'&&typeof payload==='object'&&payload!==null&&!Array.isArray(payload))followHandoff.current={previous:{view,features:f},payload:{...payload},focusKey:canonicalJson(p.openingFocus??null),exploring,todayKey:canonicalJson(todayAt)}
  p.request(kind,payload,label,confirm)
 }) as GamePanelProps['request']}
 const inspectFollow=()=>{if(!panel)return;setFollowPanel(null);p.onNavigate('deepseek',{accountId:panel.target.accountId,deepseekPane:'equity',equityTarget:panel.target,recordId:equityTargetEntity(panel.target),openRecord:true})}
 return <div ref={momentRoot} className="cinematic-home" onPointerDownCapture={()=>{todayHandoff.current=null}} onKeyDownCapture={()=>{todayHandoff.current=null}}>
  <section className={'cinematic-stage clarity-stage'+(opening?' opening-room':'')} data-exploring={exploring?'true':'false'} aria-label="可探索的住处">
   {!p.textOnly?<RoomBackdrop improved={f.life.scene.workspaceCompleted}/>:null}
   <div className="room-vignette" aria-hidden="true"/>
   {exploring?<RoomExploration p={p} headingRef={p.headingRef} onNavigate={p.onNavigate} onReturn={()=>setExploring(false)} onResponsibilities={()=>setResponsibilities(true)} urgent={urgent>0} calendar={canAdvance?<ClockAdvance p={p} date={nextDate!} label={defaultWaitLabel(w,typeof p.requestWait==='function')+' · '+nextDate} room/>:null}/>:<RoomMoment p={{...p,request:requestScene}} openingFocus={p.openingFocus} focusQuarter={p.focusQuarter} focusNotice={p.focusNotice} focusRequiresChoice={p.focusRequiresChoice} onOpeningFocus={p.onOpeningFocus} headingRef={p.headingRef} feedback={p.timeEcho??p.notice} onNavigate={p.onNavigate} onExplore={()=>setExploring(true)} onResponsibilities={()=>setResponsibilities(true)} onRecollection={()=>setRecollection(true)} todayView={dayPerspectiveCurrent(view,todayAt)} onToday={showToday} onReturnFocus={returnToFocus}/>}
   <EquityFollowNotice p={p} viewing={!exploring&&!dayPerspectiveCurrent(view,todayAt)&&p.openingFocus?.kind==='equity'?p.openingFocus.equityTarget:null} blocked={urgent>0||recollection||records||responsibilities||panel!==null} onOpen={target=>setFollowPanel({target,intent:'follow'})}/>
   <nav className="room-pocket" aria-label="随身记录">{opening?<button type="button" onClick={()=>setRecords(true)}><span aria-hidden="true">▤</span>翻开随身册</button>:<><SceneJournal p={p} onNavigate={p.onNavigate} compact/>{p.onJourney?<button type="button" onClick={p.onJourney}><span aria-hidden="true">◈</span>篇章</button>:null}<button type="button" onClick={()=>p.onPeople()}><span aria-hidden="true">♧</span>人物</button><button type="button" onClick={p.onYear}><span aria-hidden="true">▤</span>年度</button></>}<button type="button" onClick={()=>setResponsibilities(true)}><span aria-hidden="true">◷</span>牵挂与日历{urgent>0?<b>{urgent}</b>:null}</button></nav>

   <p className="room-caption"><span>{f.life.scene.workspaceCompleted?'已改善的住处':'普通出租屋'} · {view.date}</span><span>模拟市场 / 明确架空股权</span></p>
  </section>
  {panel?<EquitySceneChoice p={followProps} target={panel.target} intent={panel.intent} onClose={()=>setFollowPanel(null)} onChoose={target=>{setFollowPanel(null);p.onNavigate('deepseek',{accountId:target?.accountId??'personal',deepseekPane:'equity',equityTarget:target,...(target?{recordId:equityTargetEntity(target)}:{})})}} onIntent={intent=>setFollowPanel(current=>current?{...current,intent}:null)} onInspect={inspectFollow} onToday={()=>{setFollowPanel(null);showToday()}}/>:null}
  {records?<Dialog title="随身册里，留着这些日子" className="opening-paper" onClose={()=>setRecords(false)}><p>先翻一页。读过以后，仍可以回到刚才在意的那件事。</p><div className="opening-directions"><button type="button" onClick={()=>{setRecords(false);setRecollection(true)}}>本季留页<span>实际回响、旧约定与下一问题</span></button><button type="button" onClick={()=>{setRecords(false);p.onNavigate('quarter')}}>本季日历<span>工作、准备及全部原安排</span></button><button type="button" onClick={()=>{setRecords(false);p.onNavigate('routes')}}>五条可选的路<span>原门槛、作品、课程、服务与合作</span></button><button type="button" onClick={()=>{setRecords(false);p.onNavigate('memory')}}>记忆与时代来信<span>已知新闻与自己的笔记</span></button><button type="button" onClick={()=>{setRecords(false);p.onNavigate('finance')}}>分账户的原账<span>现金、保护、应收应付及存档</span></button></div><div className="opening-room-records"><SceneJournal p={p} onNavigate={(screen,target)=>{setRecords(false);p.onNavigate(screen,target)}} compact/>{p.onJourney?<button type="button" onClick={()=>{setRecords(false);p.onJourney?.()}}>篇章</button>:null}<button type="button" onClick={()=>{setRecords(false);p.onPeople()}}>人物</button><button type="button" onClick={()=>{setRecords(false);p.onYear()}}>年度</button></div></Dialog>:null}
  {recollection?<SeasonRecollection p={p} onClose={()=>setRecollection(false)} onNavigate={p.onNavigate} onToday={showToday} {...(p.onOpeningFocus?{onContinueFocus:(focus:OpeningFocus)=>{p.onOpeningFocus!(focus);setTodayAt(null);setRecollection(false);setExploring(false)}}:{})}/>:null}
  {responsibilities?<Dialog title="桌上的牵挂" onClose={()=>setResponsibilities(false)} className="responsibility-book"><section id="room-responsibilities" className="room-responsibilities" aria-label="桌上全部待办与持续责任"><header className="section-heading"><div><p className="eyebrow">别忘了，已经答应的事</p><h2>桌上，还有这些牵挂。</h2></div><button type="button" onClick={()=>p.onNavigate('quarter')}>打开本季安排 →</button></header>
   {shortages.map(a=><section className="error-box" role="alert" key={a.accountId}><strong>{a.accountId==='personal'?'个人':'企业'}承诺资金存在真实缺口</strong><p>保护或承诺不足{moneyText(Math.max(a.protectionShortfallFen,a.commitmentShortfallFen))}，可花0不代表偿还。</p><button type="button" onClick={()=>p.onNavigate('finance')}>查看账本与欠款</button></section>)}
   {w.pause?<section className="warning-box" role="alert"><strong>推进暂停，需要你的决定</strong><p>{w.progression.barrierLabel??'查看本季安排中的期限、资金与独立记录。'}</p><button type="button" onClick={()=>{const target=cashPauseTarget(p);setResponsibilities(false);p.onNavigate('quarter',target?{obligationTarget:target}:undefined)}}>面对这件事</button></section>:null}
   {debts.length?<Obligations props={p} debts={debts} onSelect={debt=>{const target=obligationTargetFor(p,debt);setResponsibilities(false);if(target)p.onNavigate('quarter',{obligationTarget:target});else p.onNavigate('quarter',{accountId:debt.accountId})}}/>:null}
   <StoryQueue p={p} onOpen={()=>p.onNavigate('story')}/><LifeQueue p={p} onOpen={p.onPeople}/>
   {forced.map(event=><EventCard key={event.id} event={event} props={p}/>)}
   {f.life.jobs.filter(j=>j.status==='running').map(j=><article className="room-running-life" key={j.id}><strong>{j.kind==='promise_keep'?'兑现约定':f.life.work[j.kind].title} · 进行中</strong><p>{j.startAt}—{j.completeAt} · 已付{moneyText(j.costFen)} / {j.actionPoints}点，尚未完成。</p><button type="button" onClick={()=>p.onNavigate('life',lifeWorkTarget(j))}>查看这段生活安排</button></article>)}
   {commitmentRows.length?<div className="room-commitment-list"><h3>还在日历里的约定</h3>{commitmentRows.map(c=><article key={c.id}><p>{c.text}</p><button type="button" onClick={()=>p.onNavigate(c.screen)}>{c.link} →</button></article>)}</div>:null}
   {w.finance.filter(a=>a.forecast.earliestGap!==null).map(a=><p className="warning-box" key={a.accountId}>{a.accountId==='personal'?'个人':'企业'}{a.forecast.earliestGap!.certainty==='conditional'?'预算情景下可能不足':'按当前承诺预计不足'} · {a.forecast.earliestGap!.date} · 差额{moneyText(a.forecast.earliestGap!.shortfallFen)}。未来未知收入没有用于偿付。<button type="button" onClick={()=>p.onNavigate('finance')}>查看现金情景</button></p>)}
   <SceneJournal p={p} inlineOperating onNavigate={(screen,target)=>{setResponsibilities(false);p.onNavigate(screen,target)}}/>
   {urgent===0&&commitmentRows.length===0?<p className="room-quiet">此刻，没有尚待处理的强制事项。工作、记忆和生活，都可以慢慢安排。</p>:null}
  </section></Dialog>:null}
 </div>
}
