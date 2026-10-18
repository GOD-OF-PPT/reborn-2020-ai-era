import type {Ref} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import type {LifePerson} from '../core/life-schema.ts'
import {RoomBackdrop} from './RoomBackdrop.tsx'
import {StoryQueue} from './StoryQueue.tsx'
import {LifeQueue} from './LifeQueue.tsx'
import {Obligations} from './Obligations.tsx'
import {EventCard} from './QuarterPanel.tsx'
import {CommandButton} from './CommandButton.tsx'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {moneyText,playableThrough} from './game-text.ts'

type Props=GamePanelProps&{headingRef:Ref<HTMLHeadingElement>;notice:string|null;onNavigate:(screen:Screen)=>void;onPeople:(id?:LifePerson)=>void;onYear:()=>void}
const spots=[['routes','电脑 · 经营','新的机会，都从一次尝试开始。',76,49],['quarter','门外 · 安排','工作与时间，仍由你决定。',37,40],['memory','书架 · 记忆','记得趋势，不是答案。',22,48],['life','床边 · 生活','也留一些时间，给自己。',21,65]] as const

export function CinematicRoom(p:Props){
 const {view,features:f}=p,w=f.workbench
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
 return <div className="cinematic-home">
  <section className="cinematic-stage" aria-label="可探索的住处">
   {!p.textOnly?<RoomBackdrop improved={f.life.scene.workspaceCompleted}/>:null}
   <div className="room-vignette" aria-hidden="true"/>
   <header className="room-chapter"><p className="eyebrow">{w.quarter} / 你的人生</p><h1 ref={p.headingRef} tabIndex={-1}>{view.date==='2020-01-01'?<>如果人生，<br/>可以再来一次。</>:<>日子还在向前，<br/>选择由你。</>}</h1></header>
   <nav className="room-objects" aria-label="探索住处">{spots.map(([screen,label,hint,x,y])=><button type="button" className="room-hotspot" key={screen} style={{left:x+'%',top:y+'%'}} onClick={()=>p.onNavigate(screen)}><span className="hotspot-diamond" aria-hidden="true"/><span><strong>{label}</strong><small>{hint}</small></span></button>)}</nav>
   <nav className="room-pocket" aria-label="随身记录"><button type="button" onClick={()=>p.onPeople()}><span aria-hidden="true">♧</span>人物</button><button type="button" onClick={p.onYear}><span aria-hidden="true">▤</span>年度</button><a href="#room-responsibilities"><span aria-hidden="true">◷</span>桌上待办{urgent+commitmentRows.length>0?<b>{urgent+commitmentRows.length}</b>:null}</a></nav>
   {p.notice?<p className="room-action-note" role="status">{p.notice}</p>:null}
   <footer className="room-narrative"><div><span className="narrative-speaker">你 · 内心独白</span><p>{f.life.scene.workspaceCompleted?'桌椅与照明已经改善，投入成了每天用得上的东西。':view.date==='2020-01-01'?'你在旧房间醒来。电脑还亮着，日历回到了2020年。':'窗外是熟悉的城市，生活与新的机会仍在继续。'}</p><small>{w.pause?'有一件需要先面对的事。看看桌上待办，再决定如何继续。':w.progression.requiresDelivery?'作品已经完成。下一步，仍要由你决定是否提交。':w.atQuarterEnd?'这一季留下了自己的结果，旧承诺仍会延续。':'一切，都从眼前的一个选择开始。'}</small></div><div className="room-next"><button type="button" className="primary" onClick={()=>p.onNavigate('quarter')}>{w.progression.requiresDelivery?'处理这份交付':'安排本季的生活'} <span aria-hidden="true">→</span></button>{canAdvance?<CommandButton {...p} kind="AdvanceTime" payload={{date:nextDate}} label={(w.progression.nextQuarterDate?'进入下一季 · ':'推进下一节点 · ')+nextDate} confirm/>:null}</div></footer>
   <p className="room-caption"><span>{f.life.scene.workspaceCompleted?'已改善的住处':'普通出租屋'} · {view.date}</span><span>模拟市场 / 明确架空股权</span></p>
  </section>
  <section id="room-responsibilities" className="room-responsibilities" aria-label="桌上全部待办与持续责任"><header className="section-heading"><div><p className="eyebrow">别忘了，已经答应的事</p><h2>桌上，还有这些牵挂。</h2></div><button type="button" onClick={()=>p.onNavigate('quarter')}>打开本季安排 →</button></header>
   {shortages.map(a=><section className="error-box" role="alert" key={a.accountId}><strong>{a.accountId==='personal'?'个人':'企业'}承诺资金存在真实缺口</strong><p>保护或承诺不足{moneyText(Math.max(a.protectionShortfallFen,a.commitmentShortfallFen))}，可花0不代表偿还。</p><button type="button" onClick={()=>p.onNavigate('finance')}>查看账本与原义务</button></section>)}
   {w.pause?<section className="warning-box" role="alert"><strong>推进暂停，需要你的决定</strong><p>{w.progression.barrierLabel??'查看本季安排中的期限、资金与独立记录。'}</p><button type="button" onClick={()=>p.onNavigate('quarter')}>面对这件事</button></section>:null}
   {debts.length?<Obligations props={p} debts={debts}/>:null}
   <StoryQueue p={p} onOpen={()=>p.onNavigate('story')}/><LifeQueue p={p} onOpen={p.onPeople}/>
   {forced.map(event=><EventCard key={event.id} event={event} props={p}/>)}
   {f.life.jobs.filter(j=>j.status==='running').map(j=><article className="room-running-life" key={j.id}><strong>{j.kind==='promise_keep'?'兑现约定':f.life.work[j.kind].title} · 实际进行中</strong><p>{j.startAt}—{j.completeAt} · 已付{moneyText(j.costFen)} / {j.actionPoints}点，尚未完成。</p><button type="button" onClick={()=>p.onNavigate('life')}>查看原生活记录</button></article>)}
   {commitmentRows.length?<div className="room-commitment-list">{commitmentRows.map(c=><article key={c.id}><p>{c.text}</p><button type="button" onClick={()=>p.onNavigate(c.screen)}>继续处理 →</button></article>)}</div>:null}
   {w.finance.filter(a=>a.forecast.earliestGap!==null).map(a=><p className="warning-box" key={a.accountId}>{a.accountId==='personal'?'个人':'企业'}{a.forecast.earliestGap!.certainty==='conditional'?'预算情景下可能不足':'按当前承诺预计不足'} · {a.forecast.earliestGap!.date} · 差额{moneyText(a.forecast.earliestGap!.shortfallFen)}。未来未知收入没有用于偿付。<button type="button" onClick={()=>p.onNavigate('finance')}>查看现金情景</button></p>)}
   {urgent===0&&commitmentRows.length===0?<p className="room-quiet">此刻，没有尚待处理的强制事项。工作、记忆和生活，都可以慢慢安排。</p>:null}
  </section>
 </div>
}
