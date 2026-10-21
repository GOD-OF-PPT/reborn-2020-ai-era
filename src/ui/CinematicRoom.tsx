import {useEffect,useRef,useState,type Ref,type ReactNode} from 'react'
import {RoomMoment} from './RoomMoment.tsx'
import {SceneJournal} from './SceneJournal.tsx'
import {sceneSeason,sceneShortcut} from './scene-season.ts'
import {Dialog} from './Dialog.tsx'
import type {GamePanelProps} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import type {LifePerson} from '../core/life-schema.ts'
import {RoomBackdrop} from './RoomBackdrop.tsx'
import {StoryQueue} from './StoryQueue.tsx'
import {LifeQueue} from './LifeQueue.tsx'
import {Obligations} from './Obligations.tsx'
import {EventCard} from './QuarterPanel.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {moneyText,playableThrough} from './game-text.ts'

type Props=GamePanelProps&{headingRef:Ref<HTMLHeadingElement>;notice:string|null;timeEcho?:ReactNode;onNavigate:(screen:Screen)=>void;onPeople:(id?:LifePerson)=>void;onYear:()=>void;onJourney?:()=>void}
const spots=[['routes','电脑 · 经营','新的机会，都从一次尝试开始。',76,49],['quarter','门外 · 安排','工作与时间，仍由你决定。',37,40],['memory','书架 · 记忆','记得趋势，不是答案。',22,48],['life','床边 · 生活','也留一些时间，给自己。',21,65]] as const
type Spot=typeof spots[number][0]
const inspection:Record<Spot,{speaker:string;line:string;hint:string}>={
 routes:{speaker:'目光所至 · 电脑',line:'一台电脑，也可能是一条新的路。',hint:'翻看五条路线，了解眼下的门槛。真正投入资金或时间前，仍由你另行确认。'},
 quarter:{speaker:'目光所至 · 门外',line:'门外的日子，等你重新安排。',hint:'保留工作、为未来准备，或留些时间休整。每一项安排，都要用真实的日子去完成。'},
 memory:{speaker:'目光所至 · 书架',line:'有些未来，还只是模糊的片段。',hint:'翻开记忆与已经发生的新闻。阅读不会推进时间，也不会替你作出决定。'},
 life:{speaker:'目光所至 · 床边',line:'这一次，也记得照顾自己的生活。',hint:'看看生活、人物与已经答应的事。休整和改善环境，需要你决定何时付诸行动。'},
}

export function CinematicRoom(p:Props){
 const [responsibilities,setResponsibilities]=useState(false),[exploring,setExploring]=useState(false)
 const momentRoot=useRef<HTMLDivElement>(null)
 const [hovered,setHovered]=useState<Spot|null>(null),[focused,setFocused]=useState<Spot|null>(null)
 const inspected=hovered??focused,spot=spots.find(([screen])=>screen===inspected),look=inspected?inspection[inspected]:null
 const {view,features:f}=p,w=f.workbench
 const season=sceneSeason(w.quarter)
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
 const nextDate=canAdvance?(w.progression.nextQuarterDate??playableAdvanceDate(w,view.date,w.progression.nextDate)):null
 const commitmentRows=[
  ...(f.course?.updates??[]).filter(u=>u.resolvedAt===null).map(u=>({id:u.id,screen:'course' as const,text:`课程工具变化 · ${u.dueAt}前更新或停售，旧学员责任保留`})),
  ...(f.course?.cohorts??[]).filter(c=>c.closedAt===null).map(c=>({id:c.id,screen:'course' as const,text:`班期${c.startAt} · 教学${c.endAt} / 支持${c.supportCompleteAt} / 退款窗口${c.refundUntil}`})),
  ...(f.relay?.businesses??[]).filter(b=>b.lifecycle!=='closed').map(b=>({id:b.id,screen:'relay' as const,text:`中转 · 保护余额${moneyText(b.funds.prepaidLiabilityFen)} / 应付${moneyText(b.funds.payableFen)} / 应收${moneyText(b.funds.receivableFen)}`})),
  ...(f.deepseek?.contracts??[]).filter(c=>!['completed','cancelled'].includes(c.status)).map(c=>({id:c.id,screen:'deepseek' as const,text:`生态旧合同 · ${c.status} · 客户保护${moneyText(c.balance?.prepaidFen)} / 应收${moneyText(c.balance?.receivableFen)}`})),
  ...(f.deepseek?.agreements??[]).map(a=>({id:a.id,screen:'deepseek' as const,text:`明确架空股权 · ${a.shares}/${a.totalShares}股 · 锁定至${a.lockUntil} · ${a.followDecision==='pending'?'跟投待决定，默认不付款':'估值不是可花现金'}`})),
  ...(f.routines?.plans??[]).filter(r=>r.status==='paused'||r.status==='confirmed').map(r=>({id:r.id,screen:'routines' as const,text:`例行计划 · ${r.name} · ${r.status==='paused'?'未来步骤已暂停':'已确认，仍待逐项执行'}`})),
 ]
 return <div ref={momentRoot} className="cinematic-home">
  <section className="cinematic-stage clarity-stage" data-exploring={exploring?'true':'false'} aria-label="可探索的住处">
   {!p.textOnly?<RoomBackdrop improved={f.life.scene.workspaceCompleted}/>:null}
   <div className="room-vignette" aria-hidden="true"/>
   {spot?<div className="room-attention" aria-hidden="true" style={{left:spot[3]+'%',top:spot[4]+'%'}}/>:null}
   {exploring?<><header className="room-chapter"><p className="eyebrow">{w.quarter} / 第{season.chapter??'—'}幕</p><h1 ref={p.headingRef} tabIndex={-1}>房间里，还有别的可能。</h1><p className="room-exploration-guide">走近一件物品，看看它带你去哪里。</p></header>
   <nav className="room-objects" aria-label="探索住处">{spots.map(([screen,label,hint,x,y])=><button type="button" className="room-hotspot" key={screen} style={{left:x+'%',top:y+'%'}} aria-label={label} aria-describedby={inspected===screen?'room-inspection-copy':undefined} data-inspected={inspected===screen?'true':undefined} onPointerEnter={()=>setHovered(screen)} onPointerLeave={()=>setHovered(null)} onFocus={()=>{setFocused(screen);setHovered(null)}} onBlur={()=>setFocused(null)} onClick={()=>p.onNavigate(screen)}><span className="hotspot-diamond" aria-hidden="true"/><span><strong>{label}</strong><small>{hint}</small></span></button>)}</nav></>:<RoomMoment p={p} headingRef={p.headingRef} feedback={p.timeEcho??p.notice} onNavigate={p.onNavigate} onExplore={()=>setExploring(true)}/>}
   <nav className="room-pocket" aria-label="随身记录"><SceneJournal p={p} onNavigate={p.onNavigate} compact/>{p.onJourney?<button type="button" onClick={p.onJourney}><span aria-hidden="true">◈</span>篇章</button>:null}<button type="button" onClick={()=>p.onPeople()}><span aria-hidden="true">♧</span>人物</button><button type="button" onClick={p.onYear}><span aria-hidden="true">▤</span>年度</button><button type="button" onClick={()=>setResponsibilities(true)}><span aria-hidden="true">◷</span>桌上待办{urgent+commitmentRows.length>0?<b>{urgent+commitmentRows.length}</b>:null}</button></nav>
   {exploring?<footer className="room-narrative" data-inspecting={look?'true':undefined}><div id="room-inspection-copy"><span className="narrative-speaker">{look?.speaker??'你 · 眼前的房间'}</span><p>{look?.line??'电脑、门外、书架和床边，连接着四种不同的日子。'}</p><small>{look?.hint??'这里是自由探索。翻看不花钱，也不替你接受承诺。'}</small></div><div className="room-next"><button type="button" className="primary" onClick={()=>setExploring(false)}>回到眼前这件事 →</button>{canAdvance?<ClockAdvance p={p} date={nextDate!} label={'继续原来的日子 · '+nextDate} room/>:null}</div></footer>:null}
   <p className="room-caption"><span>{f.life.scene.workspaceCompleted?'已改善的住处':'普通出租屋'} · {view.date}</span><span>模拟市场 / 明确架空股权</span></p>
  </section>
  {responsibilities?<Dialog title="桌上的牵挂" onClose={()=>setResponsibilities(false)} className="responsibility-book"><section id="room-responsibilities" className="room-responsibilities" aria-label="桌上全部待办与持续责任"><header className="section-heading"><div><p className="eyebrow">别忘了，已经答应的事</p><h2>桌上，还有这些牵挂。</h2></div><button type="button" onClick={()=>p.onNavigate('quarter')}>打开本季安排 →</button></header>
   {shortages.map(a=><section className="error-box" role="alert" key={a.accountId}><strong>{a.accountId==='personal'?'个人':'企业'}承诺资金存在真实缺口</strong><p>保护或承诺不足{moneyText(Math.max(a.protectionShortfallFen,a.commitmentShortfallFen))}，可花0不代表偿还。</p><button type="button" onClick={()=>p.onNavigate('finance')}>查看账本与原义务</button></section>)}
   {w.pause?<section className="warning-box" role="alert"><strong>推进暂停，需要你的决定</strong><p>{w.progression.barrierLabel??'查看本季安排中的期限、资金与独立记录。'}</p><button type="button" onClick={()=>p.onNavigate('quarter')}>面对这件事</button></section>:null}
   {debts.length?<Obligations props={p} debts={debts}/>:null}
   <StoryQueue p={p} onOpen={()=>p.onNavigate('story')}/><LifeQueue p={p} onOpen={p.onPeople}/>
   {forced.map(event=><EventCard key={event.id} event={event} props={p}/>)}
   {f.life.jobs.filter(j=>j.status==='running').map(j=><article className="room-running-life" key={j.id}><strong>{j.kind==='promise_keep'?'兑现约定':f.life.work[j.kind].title} · 实际进行中</strong><p>{j.startAt}—{j.completeAt} · 已付{moneyText(j.costFen)} / {j.actionPoints}点，尚未完成。</p><button type="button" onClick={()=>p.onNavigate('life')}>查看原生活记录</button></article>)}
   {commitmentRows.length?<div className="room-commitment-list">{commitmentRows.map(c=><article key={c.id}><p>{c.text}</p><button type="button" onClick={()=>p.onNavigate(c.screen)}>继续处理 →</button></article>)}</div>:null}
   {w.finance.filter(a=>a.forecast.earliestGap!==null).map(a=><p className="warning-box" key={a.accountId}>{a.accountId==='personal'?'个人':'企业'}{a.forecast.earliestGap!.certainty==='conditional'?'预算情景下可能不足':'按当前承诺预计不足'} · {a.forecast.earliestGap!.date} · 差额{moneyText(a.forecast.earliestGap!.shortfallFen)}。未来未知收入没有用于偿付。<button type="button" onClick={()=>p.onNavigate('finance')}>查看现金情景</button></p>)}
   {urgent===0&&commitmentRows.length===0?<p className="room-quiet">此刻，没有尚待处理的强制事项。工作、记忆和生活，都可以慢慢安排。</p>:null}
  </section></Dialog>:null}
 </div>
}
