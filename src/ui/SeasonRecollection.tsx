import type {GamePanelProps,NavigateScene} from './game-types.ts'
import {seasonRecollection} from './season-thread.ts'
import {Dialog} from './Dialog.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'

type Props={p:GamePanelProps;quarter?:string;onClose:()=>void;onNavigate:NavigateScene;onChooseFocus?:()=>void;focusLabel?:string}

/** Reading a season never closes it, clears an obligation or executes the next season's plans. */
export function SeasonRecollection({p,quarter,onClose,onNavigate,onChooseFocus,focusLabel='调整本季关注'}:Props){
 const season=seasonRecollection(p,quarter)
 const inspect:NavigateScene=(screen,target)=>{onClose();onNavigate(screen,target)}
 if(!season)return <Dialog title="这份季度留页暂不可读" className="opening-paper season-recollection" onClose={onClose}><p>原季度不存在、尚未开始或无法从当前公开记录确认。没有替换成另一季度。</p><button type="button" onClick={onClose}>回到眼前这件事</button></Dialog>
 const current=season.quarter===p.features.workbench.quarter
 const canEnter=current&&season.atQuarterEnd&&season.nextQuarterDate!==null&&p.view.phase==='playing'
 const closeRequest:GamePanelProps['request']=(...args)=>{onClose();p.request(...args)}
 const nearProps={...p,request:closeRequest}
 const footer=<div className="season-recollection-actions">
  {canEnter?<ClockAdvance p={nearProps} date={season.nextQuarterDate!} label={'核对旧约定，进入下一季 · '+season.nextQuarterDate} room/>:<button type="button" onClick={onClose}>回到眼前这件事</button>}
  {onChooseFocus?<button type="button" onClick={()=>{onClose();onChooseFocus()}}>{focusLabel} ↗</button>:<button type="button" onClick={()=>inspect('quarter',{accountId:p.accountId})}>翻开全部原账与约定 ↗</button>}
 </div>
 return <Dialog title={season.quarter+' · 这季留下的日子'} className="opening-paper season-recollection" onClose={onClose} footer={footer}>
  <header className="season-leaf-heading"><p className="opening-paper-date">{season.from}—{season.through} · 截至{season.asOf}</p><h3>{season.closed?'这一季，已经留下原结束记录。':season.atQuarterEnd?'本季日期已经结算到这里。':'日子还在继续，先看看已发生的事。'}</h3><p>{season.closed?'原来的义务仍按各自记录延续。':'翻阅不会提前结束本季，也不会替你进入下一季。'}</p></header>
  <section className="season-echoes" aria-label="本季实际回响">
   {season.nodes.length?season.nodes.map(node=><article key={node.id} className="season-echo-leaf"><time>{node.date}</time><h3>{node.title}</h3><p>{node.line}</p><button type="button" className="scene-text-action" onClick={()=>inspect(node.inspect.screen,node.inspect.target)}>{node.inspect.label} ↗</button><details><summary>核对这项实际来源</summary>{node.sourceRefs.map(ref=><p key={ref.kind+':'+ref.id}><span>{ref.kind} · {ref.date??'原记录日期'}</span><code>{ref.id}</code></p>)}</details></article>):<p>本季暂没有足够的已确认结果，不用安排、浮盈或想象补一份回报。原工作与生活仍可继续。</p>}
  </section>
  {season.allNodes.length>season.nodes.length?<details className="season-all-echoes"><summary>翻看本季全部有据回响（{season.allNodes.length}）</summary>{season.allNodes.map(node=><article key={node.id}><time>{node.date}</time><h4>{node.title}</h4><p>{node.line}</p><button type="button" className="scene-text-action" onClick={()=>inspect(node.inspect.screen,node.inspect.target)}>{node.inspect.label} ↗</button><details><summary>本项来源</summary>{node.sourceRefs.map(ref=><code key={ref.kind+':'+ref.id}>{ref.kind} · {ref.id}</code>)}</details></article>)}</details>:null}
  <section className="season-remaining" aria-label="原来未完的约定"><h3>还有些事，要继续认真对待。</h3>{season.remaining.length?season.remaining.map(item=><article key={item.id} data-urgent={item.urgent?'true':'false'}><p className="season-remaining-label">{item.urgent?'需要先面对 · ':'原约定 · '}{item.dueAt??'日期沿原记录'}</p><h4>{item.title}</h4><p>{item.line}</p><button type="button" className="scene-text-action" onClick={()=>inspect(item.inspect.screen,item.inspect.target)}>{item.inspect.label} ↗</button><details><summary>核对原责任来源</summary>{item.sourceRefs.map(ref=><code key={ref.kind+':'+ref.id}>{ref.kind} · {ref.id}</code>)}</details></article>):<p>当前公开记录中没有待续项。查看留页不会新增或清除责任。</p>}</section>
  <section className="season-next-question"><p className="opening-paper-date">把选择，留给接下来的自己</p><h3>{season.nextQuestion}</h3><p>可以继续原来的尝试，也可以改变关注。工作、交易、融资、招生和权限仍须各自决定。</p></section>
  <details><summary>翻看这季完整原记录</summary><p>精选回响只安排阅读顺序；全部原账、日期、费用、资格与未结责任仍以原记录为准。</p><button type="button" className="scene-text-action" onClick={()=>inspect('quarter',{accountId:p.accountId})}>翻开全部本季原账 ↗</button>{season.closeSourceId?<code>原季度结束来源 · {season.closeSourceId}</code>:<p>没有把本次阅读记作季度结束。</p>}</details>
 </Dialog>
}
