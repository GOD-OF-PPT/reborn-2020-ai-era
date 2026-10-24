import {useEffect,useImperativeHandle,useRef,useState,type Ref,type ReactNode} from 'react'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import {openingFocusFor,type OpeningFocus} from './player-thread.ts'
import {VideoSceneChoice} from './VideoSceneChoice.tsx'
import type {TodayThreadView} from './today-thread.ts'
import {OpeningObject} from './OpeningObject.tsx'
import {Dialog} from './Dialog.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {CommandButton} from './CommandButton.tsx'
import {MarketSceneChoice} from './MarketSceneChoice.tsx'
import {makeSharedAction} from './shared-action.ts'
import {moneyText} from './game-text.ts'
import {addDays} from '../core/calendar.ts'
import './today-scene.css'

type Props={p:GamePanelProps;today:TodayThreadView;headingRef:Ref<HTMLHeadingElement>;feedback?:ReactNode;onFocus:(focus:OpeningFocus)=>void;onPrepare:(focus:OpeningFocus)=>void;onResume:()=>void;onExplore:()=>void;onRecollection:()=>void;onNavigate:NavigateScene}
type Page='directions'|'life'|'market'|'ongoing'

/** Today is a reading/choice perspective. Only original command controls can make a new promise. */
export function TodayScene({p,today,headingRef,feedback,onFocus,onPrepare,onResume,onExplore,onRecollection,onNavigate}:Props){
 const [page,setPage]=useState<Page|null>(null)
 const localHeading=useRef<HTMLHeadingElement>(null)
 useImperativeHandle(headingRef,()=>localHeading.current!,[])
 useEffect(()=>{localHeading.current?.focus({preventScroll:true})},[])
 const personal={...p,accountId:'personal'},free:OpeningFocus={runId:p.view.runId,kind:'free',accountId:'personal',entityId:null}
 const ui=(label:string,activate:()=>void)=>makeSharedAction(p,label,activate,{allowReadOnly:true})
 const choose=(focus:OpeningFocus)=>{const binding=ui('把这件事放回眼前',()=>{setPage(null);onFocus(focus)});binding.activate()}
 const prepare=(next:'life'|'market')=>{const binding=ui('选择新的方向',()=>{onPrepare(free);setPage(next)});binding.activate()}
 const request:GamePanelProps['request']=(...args)=>{setPage(null);p.request(...args)}
 const commandProps={...personal,request}
 const primary=ui('今天，想把时间留给什么',()=>setPage('directions'))
 const button=(label:string,activate:()=>void,description?:string)=>{const action=ui(label,activate);return <button type="button" disabled={action.disabled} onClick={action.activate}>{label}{description?<span>{description}</span>:null}</button>}
 const videoFocus=today.primary.thread.focus.kind==='video'?today.primary.thread.focus:null
 const videoTarget=videoFocus?.videoTarget??undefined
 const videoProps={...p,accountId:videoFocus?.accountId??'personal',request}
 const research=p.features.workbench.researches.find(r=>r.id==='market-overview')
 if(today.responsibilityOverrideNeeded)return <section className="room-current-moment opening-current-moment" aria-label="今天仍需面对的责任"><header className="moment-heading"><p>今天 {p.view.date}</p><h1 ref={localHeading} tabIndex={-1}>先面对已经答应的事。</h1></header><p>原来的交付、期限或资金责任仍在；这页不替你新增安排。</p>{button('回到眼前需要处理的事',onResume)}</section>
 return <VideoSceneChoice p={videoProps} {...(videoTarget?{target:videoTarget}:{})} onTargetChange={target=>{const next=openingFocusFor(p,'video',{videoTarget:target});if(next)onPrepare(next)}} onToday={()=>setPage(null)} onLife={()=>{setPage(null);onNavigate('life',{accountId:'personal'})}} onInspect={target=>{setPage(null);const owner=p.features.video?.channels.find(c=>c.id===target?.channelId);onNavigate('video',{openRecord:true,...(target?{videoTarget:target}:{}),accountId:owner?.accountId??videoProps.accountId})}}>{openVideo=><MarketSceneChoice p={commandProps} onFullRecord={()=>onNavigate('market',{accountId:'personal',openRecord:true})}>{openOrder=><>
  <p className="opening-room-intention"><span>我想{today.primary.thread.wish.label}</span><span>把已经发生的事收好，再安排今天。</span>{button('回到书签里的那件事 ↗',onResume)}{button('翻季度留页 ↗',onRecollection)}</p>
  <section className="room-current-moment opening-current-moment today-current-moment" data-day-view="today" aria-label="今天这一幕">
   <header className="moment-heading"><p>{p.features.workbench.quarter} / 今天的日历</p><h1 ref={localHeading} tabIndex={-1}>今天，仍由你安排。</h1></header>
   <p className="opening-room-stage">今天 {p.view.date} · 原来的书签和约定仍保留</p>
   <div className="moment-story" aria-label="今天的情况">{feedback?<div className={typeof feedback==='string'?'moment-status':'moment-feedback'}>{feedback}</div>:null}<p className="moment-line">{today.ongoing.length?'还有'+today.ongoing.length+'件工作、生活、视频或模拟投资安排，正在照原约定继续。':'可以先保留眼前的生活，再选择一件愿意承担的事。'}</p><p className="moment-terms">{today.question}</p></div>
   <div className="moment-decisions"><div className="command moment-decision moment-primary"><button type="button" disabled={primary.disabled} onClick={primary.activate}><b aria-hidden="true">01</b><span>{primary.label}<small>继续原安排，或明确选择下一次投入</small></span><i aria-hidden="true">→</i></button>{primary.reason?<small className="reason">{primary.reason}</small>:null}</div>
    {today.wait?<div className="moment-wait"><ClockAdvance p={p} date={today.wait.date} label={'不新增安排，让原日子继续 · '+today.wait.date} room showReason={!p.view.readOnly&&!p.view.hasCandidate&&p.view.saveStatus!=='conflict'}/></div>:button('翻看今天的日历',()=>onNavigate('quarter',{accountId:p.accountId}),'原费用、期限和未完约定都在这里')}
    <button type="button" className="moment-explore" onClick={ui('环顾房间，想想别的可能',onExplore).activate}>环顾房间，想想别的可能 <span aria-hidden="true">↗</span></button>
   </div>
  </section>
  <OpeningObject kind="calendar" title="今天的日历" displayTitle="" detail={p.view.date} stageLabel="今天 · 仍可安排" actionLabel={primary.label} onActivate={primary.activate} disabled={primary.disabled} textOnly={p.textOnly===true} dayPaper={{kind:'today',state:'ongoing'}} {...(p.view.readOnly?{protection:'readonly' as const}:p.view.hasCandidate||p.view.saveStatus==='conflict'?{protection:'unsaved' as const}:{})}/>
  {page?<Dialog title={page==='directions'?'今天，想把时间留给什么？':page==='life'?'给生活留出一段真实的日子':page==='market'?'给自己的模拟判断划一个边界':'这些原安排，仍在继续'} className="opening-paper today-choice-paper" onClose={()=>setPage(null)} footer={<div className="today-choice-footer">{page!=='directions'?button('返回今天的选择',()=>setPage('directions')):null}{button('先不新增安排，合上这一页',()=>setPage(null))}</div>}>
   <p className="opening-paper-date">今天 {p.view.date} · {p.features.workbench.quarter}</p>
   {page==='directions'?<><p>选择关注只把一件事放到眼前。新的工作、生活投入和买卖，仍由你核对原确认。</p><div className="opening-directions today-directions">
    {today.ongoing.length?button('继续已经答应的事',()=>setPage('ongoing'),'从同一份原工作、生活、视频或投资安排继续'):null}
    {button('先看看本季工作',()=>choose({runId:p.view.runId,kind:'work',accountId:'personal',entityId:null}),'若本季尚未安排，先看真实行动占用与工资日期，再决定')}
    {button('留一段新的时间给生活',()=>prepare('life'),'休整或改善住处；原安排、费用和行动保留')}
    {button('给一次视频尝试留出日子',()=>{setPage(null);openVideo('select-account')},'明确选择账号和具体作品；新的客户、素材与投入仍由你决定')}
    {button('准备自己的下一份模拟判断',()=>prepare('market'),'研究、显选委托，或先保留现金')}
   </div></>:null}
   {page==='life'?<><p>留给自己的时间也要作取舍。已经在进行的安排仍在原日历上，新安排不返行动或增加收入。</p><div className="today-commitments">{(['rest','workspace'] as const).map(kind=>{const terms=p.features.life.work[kind];return <article key={kind}><h3>{terms.title}</h3><p>个人{moneyText(terms.costFen)} · {terms.points}点 · {terms.days}日；今天开始，最早{addDays(p.view.date,terms.days)}实际完成。</p><CommandButton {...commandProps} kind="StartLifeWork" payload={{kind,personId:null,reference:null}} label={kind==='rest'?'核对并留出七天休整':'核对并改善桌椅与照明'} confirm/></article>})}</div>{button('看看相识的人与全部生活记录',()=>{setPage(null);onNavigate('life',{accountId:'personal'})})}</>:null}
   {page==='market'?<><p>这里只准备自己的判断，不预报未来价格。已有持仓、未成交余量和交收仍按原记录继续。</p><div className="opening-directions today-directions">{button('显选一份新的模拟委托',()=>{setPage(null);openOrder()},'自己选账户、标的、方向、股数、限价和原撮合期限')}{research&&!research.state?<article><h3>先整理公开产业线索</h3><p>个人{moneyText(research.costFen)} · {research.actionPoints}点 · {research.days}日</p><CommandButton {...commandProps} kind="ResearchMarket" payload={{definitionId:research.id}} label="核对并开始公开研究" confirm/></article>:<p>这组基础线索已按原记录整理；完整研究和已有委托仍可在原记录核对。</p>}{button('先保留现金，不新增委托',()=>setPage(null),'回到今天，原来的股票与交收不变')}</div></>:null}
   {page==='ongoing'?<><p>这些是截至今天仍在继续的原对象。回到其中一件事不重做任务，也不新增合同。</p><div className="today-ongoing">{today.ongoing.map(item=><article key={JSON.stringify(item.focus)}><p className="opening-paper-date">{item.classification==='carry'?'从'+item.originQuarter+'留下，仍在继续':'本季原安排'}{item.wait?' · 下一反馈 '+item.wait.date:''}</p><h3>{item.title}</h3><p>{item.line}</p>{button('回到这件原安排',()=>choose(item.focus))}</article>)}</div></>:null}
  </Dialog>:null}
 </>}</MarketSceneChoice>}</VideoSceneChoice>
}
