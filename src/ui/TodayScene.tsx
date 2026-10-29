import {useEffect,useImperativeHandle,useRef,useState,type Ref,type ReactNode} from 'react'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import {openingFocusFor,type OpeningFocus} from './player-thread.ts'
import {VideoSceneChoice} from './VideoSceneChoice.tsx'
import {CourseSceneChoice} from './CourseSceneChoice.tsx'
import type {TodayThreadView} from './today-thread.ts'
import {OpeningObject} from './OpeningObject.tsx'
import {Dialog} from './Dialog.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {CommandButton} from './CommandButton.tsx'
import {MarketSceneChoice} from './MarketSceneChoice.tsx'
import {makeSharedAction} from './shared-action.ts'
import {moneyText} from './game-text.ts'
import {addDays} from '../core/calendar.ts'
import {RoomTableau} from './RoomTableau.tsx'
import {sceneMeaning} from './scene-meaning.ts'
import {relayBusinessTarget} from './relay-player-thread.ts'
import {ecosystemCalendarStatus,ecosystemUiStatus} from './ecosystem-ui-status.ts'
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
 const continuing=today.ongoing.filter(item=>!(item.focus.kind==='market'&&item.focus.entityKind==='position'&&!item.wait))
 const one=continuing.length===1?continuing[0]:null
 const relayContinuation=one?.focus.kind==='relay'?one.relayContinuation:undefined
 const continuation=relayContinuation??one?.ecosystemContinuation??one?.equityContinuation
 const hasMoney=continuing.some(item=>item.relayContinuation?.kind==='money'||item.ecosystemContinuation?.kind==='money'||item.equityContinuation?.kind==='money')
 const statusFeedback=today.primary.thread.focus.kind==='ecosystem'?ecosystemUiStatus(feedback,p.view.date):null
 const calendarStatus=today.primary.thread.focus.kind==='ecosystem'?ecosystemCalendarStatus(feedback,p.view.date):null
 const primary=p.features.workbench.atQuarterEnd?ui('看看这一季，实际留下了什么',onRecollection)
  :one?ui(one.focus.kind==='relay'?relayContinuation?.label??'回到这份原中转事项':one.ecosystemContinuation?.label??one.equityContinuation?.label??'继续'+({work:'这季的工作',life:'这段生活安排',course:'这份教学约定',video:'这份作品',market:'这份模拟委托',ecosystem:'这份原生态事项',equity:'这份架空权益与原款',free:'原来的安排','first-order':'这份委托'}[one.focus.kind]),()=>choose(one.focus))
  :continuing.length>1?ui('选回一件未完的约定',()=>setPage('ongoing'))
  :ui('给生活留一段真实的日子',()=>prepare('life'))
 const meaning=today.primary.classification==='history'?null:sceneMeaning({...p,accountId:today.primary.thread.focus.accountId},today.primary.thread)
 const dueCustomers=p.features.relay?.customers.filter(customer=>customer.dueReceivableFen>0)??[]
 const dueTotal=dueCustomers.reduce((sum,customer)=>sum+customer.dueReceivableFen,0)
 const button=(label:string,activate:()=>void,description?:string)=>{const action=ui(label,activate);return <button type="button" disabled={action.disabled} onClick={action.activate}>{label}{description?<span>{description}</span>:null}</button>}
 const videoFocus=today.primary.thread.focus.kind==='video'?today.primary.thread.focus:null
 const videoTarget=videoFocus?.videoTarget??undefined
 const videoProps={...p,accountId:videoFocus?.accountId??'personal',request}
 const courseFocus=today.primary.thread.focus.kind==='course'?today.primary.thread.focus:null
 const courseProps={...p,accountId:courseFocus?.accountId??'personal',request}
 const research=p.features.workbench.researches.find(r=>r.id==='market-overview')
 if(today.responsibilityOverrideNeeded)return <section className="room-current-moment opening-current-moment" aria-label="今天仍需面对的责任"><header className="moment-heading"><p>今天 {p.view.date}</p><h1 ref={localHeading} tabIndex={-1}>先面对已经答应的事。</h1></header><p>原来的交付、期限或资金责任仍在；这页不替你新增安排。</p>{button('回到眼前需要处理的事',onResume)}</section>
 return <VideoSceneChoice p={videoProps} {...(videoTarget?{target:videoTarget}:{})} onTargetChange={target=>{const next=openingFocusFor(p,'video',{videoTarget:target});if(next)onPrepare(next)}} onToday={()=>setPage(null)} onLife={()=>{setPage(null);onNavigate('life',{accountId:'personal'})}} onInspect={target=>{setPage(null);const owner=p.features.video?.channels.find(c=>c.id===target?.channelId);onNavigate('video',{openRecord:true,...(target?{videoTarget:target}:{}),accountId:owner?.accountId??videoProps.accountId})}}>{openVideo=><CourseSceneChoice p={courseProps} target={courseFocus?.courseTarget??null} onTarget={target=>{const next=openingFocusFor(p,'course',{courseTarget:target});if(next)onPrepare(next)}} onToday={()=>setPage(null)} onLife={()=>{setPage(null);onNavigate('life',{accountId:'personal'})}} onInspect={(target,slot,teachingSlot)=>{setPage(null);const owner=p.features.course?.businesses.find(b=>b.id===target?.businessId);onNavigate('course',{openRecord:true,courseTarget:target,accountId:owner?.accountId??courseProps.accountId,...(slot?{courseDraftSlot:slot}:{}),...(teachingSlot?{courseTeachingSlot:teachingSlot}:{})})}}>{openCourse=><MarketSceneChoice p={commandProps} onFullRecord={()=>onNavigate('market',{accountId:'personal',openRecord:true})}>{openOrder=><>
  <RoomTableau scene="today" state={today.primary.classification} perspective="today" textOnly={p.textOnly===true}
   intention={<p className="opening-room-intention"><span>我想{today.primary.thread.wish.label}</span>{button('回到书签里的那件事 ↗',onResume)}{button('翻季度留页 ↗',onRecollection)}</p>}
   heading={<header className="moment-heading"><p>{p.features.workbench.quarter} / 今天的日历</p><h1 ref={localHeading} tabIndex={-1}>{one?continuation?.kind==='unknown'?'原站的责任，先核清来源。':continuation?.kind==='money'?'这些原款，仍要分别核对。':'这份约定，今天还在继续。':continuing.length>1?hasMoney?'今天，原安排与旧款都在。':'今天，还有几件答应过的事。':meaning?.title??'今天，仍由你安排。'}</h1></header>}
   context={<><p className="opening-room-stage">今天 {p.view.date}</p></>}
   feedback={!statusFeedback&&!calendarStatus&&feedback&&feedback!=='已从本机存档继续。'?<div className={typeof feedback==='string'?'moment-status':'moment-feedback'}>{feedback}</div>:null}
   facts={<><p className="moment-line">{meaning?.situation??(continuation?one!.line:hasMoney||!continuing.length&&p.features.relay?.businesses.length?today.line:today.ongoing.length?'还有'+today.ongoing.length+'件已经答应的事，正在照约定继续。':'原来的结果已经留下；接下来的日子，可以自己安排。')}</p>{one?<p className="moment-terms">{continuation?.kind==='money'?'原款仍保留：':'仍在继续：'}{one.title.replace(/[。！？]$/u,'')}{one.wait?' · 下一反馈 '+one.wait.date:''}。</p>:null}{dueTotal>0?<p className="relay-scene-money">原客户款已到期、尚未收取 {moneyText(dueTotal)}。<button type="button" className="scene-text-action" onClick={ui('翻看这些原客户款',()=>setPage('ongoing')).activate}>逐位翻回原客户 ↗</button></p>:null}</>}
   decisions={<><div className="command moment-decision moment-primary"><button type="button" disabled={primary.disabled} onClick={primary.activate}><b aria-hidden="true">01</b><span>{primary.label}</span><i aria-hidden="true">→</i></button>{primary.reason?<small className="reason">{primary.reason}</small>:null}</div>
    {today.wait?<div className="moment-wait"><ClockAdvance p={p} date={today.wait.date} label={'不新增安排，让原日子继续 · '+today.wait.date} room showReason={!p.view.readOnly&&!p.view.hasCandidate&&p.view.saveStatus!=='conflict'}/></div>:button('翻看今天的日历',()=>onNavigate('quarter',{accountId:p.accountId}),'原费用、期限和未完约定都在这里')}
    <button type="button" className="moment-explore" onClick={ui('环顾房间，想想别的可能',onExplore).activate}>环顾房间，想想别的可能 <span aria-hidden="true">↗</span></button>
   </>}
   object={<OpeningObject copyMode="tableau" kind="calendar" title="今天的日历" displayTitle="" detail={p.view.date} stageLabel="今天 · 仍可安排" actionLabel={primary.label} onActivate={primary.activate} disabled={primary.disabled} textOnly={p.textOnly===true} dayPaper={{kind:'today',state:'ongoing'}} {...(p.view.readOnly?{protection:'readonly' as const}:p.view.hasCandidate||p.view.saveStatus==='conflict'?{protection:'unsaved' as const}:{})}/>}
   record={<><button type="button" className="scene-text-action" onClick={ui('看看工作、其它尝试与原约定',()=>setPage('directions')).activate}>看看工作、其它尝试与原约定 ↗</button>{statusFeedback?<p className="moment-status" role="status">{statusFeedback}</p>:null}{calendarStatus?<div className="ecosystem-reading-status">{calendarStatus}</div>:null}</>}
  />
  {page?<Dialog title={page==='directions'?'今天，想把时间留给什么？':page==='life'?'给生活留出一段真实的日子':page==='market'?'给自己的模拟判断划一个边界':'这些原安排，仍在继续'} className="opening-paper today-choice-paper" onClose={()=>setPage(null)} footer={<div className="today-choice-footer">{page!=='directions'?button('返回今天的选择',()=>setPage('directions')):null}{button('先不新增安排，合上这一页',()=>setPage(null))}</div>}>
   <p className="opening-paper-date">今天 {p.view.date} · {p.features.workbench.quarter}</p>
   {page==='directions'?<><div className="opening-directions today-directions">
    {today.ongoing.length?button('继续手头的事',()=>setPage('ongoing'),'工作、旧约和待收款'):null}
    {button('看看工作',()=>choose({runId:p.view.runId,kind:'work',accountId:'personal',entityId:null}))}
    {button('留点时间给自己',()=>prepare('life'),'休整，或改善住处')}
    {button('做一段视频',()=>{setPage(null);openVideo('select-account')},'先选账号和作品')}
    {button('准备一堂课',()=>{setPage(null);openCourse('objects')},'教案、班期和学员')}
    {button('经营一份服务',()=>{const focus=openingFocusFor(p,'relay',{relayTarget:null,accountId:'personal'});if(focus)choose(focus)},'供应、客户和实际服务')}
    {button('听听合作需求',()=>{const focus=openingFocusFor(p,'deepseek',{ecosystemTarget:null,accountId:'personal',deepseekPane:'ecosystem'});if(focus)choose(focus)},'模型、用途和合作请求')}
    {button('看看架空参与',()=>{const focus=openingFocusFor(p,'deepseek',{equityTarget:null,accountId:'personal',deepseekPane:'equity'});if(focus)choose(focus)},'虚构参与，独立决定')}
    {button('准备一次模拟判断',()=>prepare('market'),'先研究，或写一份委托')}
   </div></>:null}
   {page==='life'?<><p>给自己留一点余地。</p><div className="today-commitments">{(['rest','workspace'] as const).map(kind=>{const terms=p.features.life.work[kind];return <article key={kind}><h3>{terms.title}</h3><p>个人{moneyText(terms.costFen)} · {terms.points}点 · {terms.days}日；今天开始，最早{addDays(p.view.date,terms.days)}实际完成。</p><CommandButton {...commandProps} kind="StartLifeWork" payload={{kind,personId:null,reference:null}} label={kind==='rest'?'核对并留出七天休整':'核对并改善桌椅与照明'} confirm/></article>})}</div>{button('看看相识的人与全部生活记录',()=>{setPage(null);onNavigate('life',{accountId:'personal'})})}</>:null}
   {page==='market'?<><p>准备一次判断，或先留住现金。</p><div className="opening-directions today-directions">{button('显选一份新的模拟委托',()=>{setPage(null);openOrder()},'自己选账户、标的、方向、股数、限价和原撮合期限')}{research&&!research.state?<article><h3>先整理公开产业线索</h3><p>个人{moneyText(research.costFen)} · {research.actionPoints}点 · {research.days}日</p><CommandButton {...commandProps} kind="ResearchMarket" payload={{definitionId:research.id}} label="核对并开始公开研究" confirm/></article>:<p>这组基础线索已按原记录整理；完整研究和已有委托仍可在原记录核对。</p>}{button('先保留现金，不新增委托',()=>setPage(null),'回到今天，原来的股票与交收不变')}</div></>:null}
   {page==='ongoing'?<>{dueCustomers.length?<section><h3>已到期、尚未收取的原客户款</h3>{dueCustomers.map(customer=>{const number=p.features.relay!.customers.filter(original=>original.businessId===customer.businessId).findIndex(original=>original.id===customer.id)+1,identity=relayBusinessTarget(p,customer.businessId),target=identity?{...identity,kind:'customer' as const,customerId:customer.id}:null,next=target?openingFocusFor(p,'relay',{relayTarget:target,accountId:target.accountId}):null;return <article key={customer.id}><p>{p.features.relay!.businesses.length>1?'中转站'+customer.businessId.slice(-6)+' · ':null}原客户{number} · 已到期{moneyText(customer.dueReceivableFen)}，尚未实收；本入口不收款。</p>{next&&target?button('翻到这位原客户的到期款记录',()=>{setPage(null);onNavigate('relay',{accountId:target.accountId,relayTarget:target,recordId:customer.id,openRecord:true})}):<p className="warning-box">这位原客户的服务身份暂不可确认，请先从原服务记录重新选择；没有换到另一客户或账户。</p>}</article>})}</section>:null}<p>这些是截至今天仍在继续的原对象。回到其中一件事不重做任务，也不新增合同。</p><div className="today-ongoing">{today.ongoing.map(item=><article key={JSON.stringify(item.focus)}><p className="opening-paper-date">{item.classification==='carry'?'从'+item.originQuarter+'留下，仍在继续':'本季原安排'}{item.wait?' · 下一反馈 '+item.wait.date:''}</p><h3>{item.title}</h3><p>{item.line}</p>{button('回到这件原安排',()=>choose(item.focus))}</article>)}</div></>:null}
  </Dialog>:null}
 </>}</MarketSceneChoice>}</CourseSceneChoice>}</VideoSceneChoice>
}
