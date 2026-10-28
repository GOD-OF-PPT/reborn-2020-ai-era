import {useEffect,useRef,useState} from 'react'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import {seasonRecollection,type SeasonPendingItem} from './season-thread.ts'
import {Dialog} from './Dialog.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import type {OpeningFocus} from './player-thread.ts'
import {makeSharedAction} from './shared-action.ts'
import {seasonMeaning} from './scene-meaning.ts'

type Props={p:GamePanelProps;quarter?:string;onClose:()=>void;onNavigate:NavigateScene;onChooseFocus?:()=>void;focusLabel?:string;onToday?:()=>void;onContinueFocus?:(focus:OpeningFocus)=>void}

/** Reading a season never closes it, clears an obligation or executes the next season's plans. */
export function SeasonRecollection({p,quarter,onClose,onNavigate,onChooseFocus,focusLabel='调整本季关注',onToday,onContinueFocus}:Props){
 const key=p.view.runId+'|'+(quarter??'current'),[selection,setSelection]=useState<{key:string;quarter:string}|null>(null)
 const origin=useRef({key,quarter:quarter??p.features.workbench.quarter})
 if(origin.current.key!==key)origin.current={key,quarter:quarter??p.features.workbench.quarter}
 const reading=selection?.key===key?selection.quarter:origin.current.quarter,readingKey=key+'|'+reading
 const scope=useRef({key:readingKey,mounted:true,closed:false})
 if(scope.current.key!==readingKey)scope.current={key:readingKey,mounted:true,closed:false}
 const captured=scope.current,current=()=>scope.current===captured&&captured.mounted&&!captured.closed
 useEffect(()=>{captured.mounted=true;return()=>{captured.mounted=false}},[captured])
 const close=()=>{if(!current())return;captured.closed=true;onClose()}
 const available=(p.features.journey?.chapters??[]).filter(c=>c.openedAt<=p.view.date).map(c=>c.id)
 const season=seasonRecollection(p,reading)
 const ui=(label:string,activate:()=>void)=>makeSharedAction(p,label,activate,{allowReadOnly:true,canActivate:current})
 const today=ui('合上这一页，回到今天',()=>{close();onToday?.()})
 const sourceLocked=!current()||p.view.hasCandidate||p.view.busy||p.controller.snapshot.busy||p.view.saveStatus==='conflict'||p.controller.snapshot.view!==p.view
 const inspect:NavigateScene=(screen,target)=>ui('翻阅这份原记录',()=>{close();onNavigate(screen,target)}).activate()
 if(!season)return <Dialog title="这份季度留页暂不可读" className="opening-paper season-recollection" onClose={close}><p>原季度不存在、尚未开始或无法从当前公开记录确认。没有替换成另一季度。</p><button type="button" onClick={close}>回到眼前这件事</button></Dialog>
 const meaning=seasonMeaning(p,season)
 const isCurrent=season.quarter===p.features.workbench.quarter
 const canEnter=isCurrent&&season.atQuarterEnd&&season.nextQuarterDate!==null&&p.view.phase==='playing'
 const forwardClock=(dispatch:()=>void)=>makeSharedAction(p,'沿原日历继续',()=>{close();onToday?.();dispatch()},{canActivate:current}).activate()
 const closeRequest:GamePanelProps['request']=(...args)=>forwardClock(()=>p.request(...args))
 const requestWait:GamePanelProps['requestWait']=p.requestWait?(...args)=>forwardClock(()=>p.requestWait!(...args)):undefined
 const nearProps={...p,request:closeRequest,requestWait}
 const pending=season.remaining.filter(item=>item.continuation!=='choice'&&item.continuation!=='retained'),choices=season.remaining.filter(item=>item.continuation==='choice'),retained=season.remaining.filter(item=>item.continuation==='retained')
 const remainingRow=(item:SeasonPendingItem)=>{
  const label=item.urgent?'需要先面对 · ':item.continuation==='retained'?'保留记录 · ':item.continuation==='choice'?'尚可选择 · ':item.continuation==='money'?'原款待收 · ':item.continuation==='unknown'?'原来源待核 · ':'原约定 · '
  const focusLabel=item.continuation==='retained'?'把这份原记录放回眼前':item.continuation==='choice'?'把这个原选择放回眼前':'把这件仍待续的事放回眼前'
  return <article key={item.id} data-urgent={item.urgent?'true':'false'}><p className="season-remaining-label">{label}{item.continuation==='retained'?'仍按原协议保留':item.dueAt??'日期沿原记录'}</p><h4>{item.title}</h4><p>{item.line}</p><button type="button" className="scene-text-action" onClick={()=>inspect(item.inspect.screen,item.inspect.target)}>{item.inspect.label} ↗</button>{item.focus&&onContinueFocus?<button type="button" disabled={sourceLocked} className="scene-text-action" onClick={()=>ui(focusLabel,()=>{close();onContinueFocus(item.focus!)}).activate()}>{focusLabel}</button>:null}<details><summary>核对原责任来源</summary>{item.sourceRefs.map(ref=><code key={ref.kind+':'+ref.id}>{ref.kind} · {ref.id}</code>)}</details></article>
 }
 const footer=<div className="season-recollection-actions">
  {canEnter?<ClockAdvance p={nearProps} date={season.nextQuarterDate!} label={'核对旧约定，进入下一季 · '+season.nextQuarterDate} room/>:null}
  {onToday?<button type="button" disabled={today.disabled} onClick={today.activate}>{p.features.workbench.progression.requiresDelivery?'先回到待交付的作品':'合上'+season.quarter+'，回到今天'}</button>:!canEnter?<button type="button" onClick={close}>回到眼前这件事</button>:null}
   {onChooseFocus?<button type="button" onClick={()=>ui('调整本季关注',()=>{close();onChooseFocus()}).activate()}>{focusLabel} ↗</button>:<button type="button" onClick={()=>inspect('quarter',{accountId:p.accountId})}>转看今天（{p.features.workbench.quarter}）的全部安排与原账 ↗</button>}
 </div>
 return <Dialog key={season.quarter} title={season.quarter+' · 这季留下的日子'} className="opening-paper season-recollection" onClose={close} footer={footer}>
  <header className="season-leaf-heading"><p className="opening-paper-date">正在翻阅{season.quarter} · 今天仍是{p.view.date}</p><label className="season-reading-selector">翻阅哪一季<select value={reading} disabled={sourceLocked} onChange={event=>{const next=event.target.value;if(!available.includes(next)||sourceLocked)return;ui('翻阅原季度',()=>setSelection({key,quarter:next})).activate()}}>{available.map(id=><option key={id} value={id}>{id}{id===p.features.workbench.quarter?' · 本季':' · 已走过的日子'}</option>)}</select></label><p className="opening-paper-date">原发生范围 {season.from}—{season.through} · 公开记录截至{season.asOf}</p><h3>{season.closed?'这一季，已经留下原结束记录。':season.atQuarterEnd?'本季日期已经结算到这里。':'日子还在继续，先看看已发生的事。'}</h3><p>{season.closed?'原来的义务仍按各自记录延续。':'翻阅不会提前结束本季，也不会替你进入下一季。'}</p></header>
  <section className="season-echoes" aria-label="本季实际回响">
   {season.nodes.length?season.nodes.map(node=><article key={node.id} className="season-echo-leaf"><time>{node.date}</time><h3>{node.title}</h3><p>{node.line}</p><button type="button" className="scene-text-action" onClick={()=>inspect(node.inspect.screen,node.inspect.target)}>{node.inspect.label} ↗</button><details><summary>核对这项实际来源</summary>{node.sourceRefs.map(ref=><p key={ref.kind+':'+ref.id}><span>{ref.kind} · {ref.date??'原记录日期'}</span><code>{ref.id}</code></p>)}</details></article>):<p>本季暂没有足够的已确认结果，不用安排、浮盈或想象补一份回报。原工作与生活仍可继续。</p>}
  </section>
  {season.allNodes.length>season.nodes.length?<details className="season-all-echoes"><summary>翻看本季全部有据回响（{season.allNodes.length}）</summary>{season.allNodes.map(node=><article key={node.id}><time>{node.date}</time><h4>{node.title}</h4><p>{node.line}</p><button type="button" className="scene-text-action" onClick={()=>inspect(node.inspect.screen,node.inspect.target)}>{node.inspect.label} ↗</button><details><summary>本项来源</summary>{node.sourceRefs.map(ref=><code key={ref.kind+':'+ref.id}>{ref.kind} · {ref.id}</code>)}</details></article>)}</details>:null}
  <section className="season-remaining" aria-label="原来未完的约定"><h3>截至今天，仍需面对的约定。</h3><p>以下是{p.view.date}的当前待续事项，与上方原季度已经发生的结果分开核对。</p>{pending.length?pending.map(remainingRow):<p>当前公开记录中没有待续项。查看留页不会新增或清除责任。</p>}</section>
  {choices.length?<section className="season-remaining" aria-label="仍可决定的原选择"><h3>有些原选择，还可以慢慢决定。</h3><p>这些选择尚未替你接受新承诺。原截止日与默认处理仍按各自规则发生。</p>{choices.map(remainingRow)}</section>:null}
  {retained.length?<section className="season-remaining" aria-label="仍保留的权益原记录"><h3>持股与原记录，还在。</h3><p>保留不要求新增付款、续约或清空。可以翻阅，也可以继续自己的工作和生活。</p>{retained.map(remainingRow)}</section>:null}
  <section className="season-next-question"><p className="opening-paper-date">把选择，留给接下来的自己</p><h3>{meaning?.question??season.nextQuestion}</h3>{meaning?<><p>{meaning.situation}</p><details><summary>核对这段处境的实际来源</summary>{meaning.sourceRefs.map(ref=><p key={ref.kind+':'+ref.id}>{ref.kind} · {ref.date??'原记录日期'} · <code>{ref.id}</code></p>)}</details></>:null}<p>可以继续原来的尝试，也可以改变关注。工作、交易、融资、招生和权限仍须各自决定。</p></section>
   <details><summary>原季度的来源与今天的完整安排</summary><p>上方保留{season.quarter}的有据节点与具体原对象；下面转看今天{p.view.date}的综合安排。全部原账、日期、费用、资格与未结责任仍以原记录为准。</p><button type="button" className="scene-text-action" onClick={()=>inspect('quarter',{accountId:p.accountId})}>转看今天（{p.features.workbench.quarter}）的全部安排与原账 ↗</button>{season.closeSourceId?<code>原季度结束来源 · {season.closeSourceId}</code>:<p>没有把本次阅读记作季度结束。</p>}</details>
 </Dialog>
}
