import {NewLifeChoices} from './NewLifeChoices.tsx'
import {Dialog} from './Dialog.tsx'
import {lastViewedLife,selectContinuation} from './continuation.ts'
import { useEffect,useRef,useState,useId } from 'react'
import type {GameSnapshot} from '../application/game-controller.ts'
import type {GameControllerPort as GameController} from '../application/game-controller-port.ts'
import type { PlayerProfile } from '../core/player-profile.ts'
import { backgroundNames } from './game-text.ts'

export function Home({controller,state,onStorage,onExport}:{controller:GameController|null;state:GameSnapshot;onStorage:()=>void;onExport:(runId:string)=>void}){
 const entryForm=useId()
 const [library,setLibrary]=useState(false)
 const [seedOpen,setSeedOpen]=useState(false),[memoryOpen,setMemoryOpen]=useState(false)
 const [step,setStep]=useState<'room'|'identity'|'wish'|'approach'>('room')
 const [backgroundId,setBackgroundId]=useState<'technical_employee'|'content_employee'>('technical_employee'),[wishId,setWishId]=useState<PlayerProfile['wishId']>('autonomy'),[approach,setApproach]=useState<PlayerProfile['approach']>('first_order'),[seed,setSeed]=useState('')
 const stepHeading=useRef<HTMLHeadingElement>(null)
 const ready=controller!==null&&state.phase==='home'&&!state.busy,latest=selectContinuation(state.runs,lastViewedLife())
 useEffect(()=>{if(step!=='room'){stepHeading.current?.focus({preventScroll:true});window.scrollTo(0,0)}},[step])
 const loading=state.phase==='loading'||!controller
 return <main id="main-content" tabIndex={-1} className={'home-layout home-step-'+step}>
 <section className="home-story cinematic-room"><div className="home-copy"><p className="eyebrow">2020 / 你的故事重新开始</p><h1>重生2020<span>AI时代</span></h1><p className="premise">那时，一切还没有发生。<br/>这一次，你想怎样生活？</p><p className="home-intro">保留一份工作，做一点自己的事。<br/>未来的片段还模糊，眼前的选择由你决定。</p>
 {step==='room'?<><div className="home-actions">{latest?<button type="button" className="primary" disabled={!ready} onClick={()=>{void controller?.continueLife(latest.runId).catch(()=>{})}}>继续这段人生</button>:null}<button type="button" className={latest?'room-secondary':'primary'} disabled={loading||state.busy} onClick={()=>setStep('identity')}>开始一段新人生</button></div>{latest?<p className="continue-caption">{backgroundNames[latest.backgroundId as keyof typeof backgroundNames]??latest.backgroundId} · {latest.date} · 第{latest.revision}次提交</p>:null}{loading||state.busy?<p className="continue-caption" role="status">{loading?"正在读取本机存档…":"正在翻开这段人生…"}</p>:null}<div className="home-footnotes"><span>每季四点，由你安排</span><span>五条不同的财富路线</span><span>储蓄、工作，也关乎生活</span></div></>:null}
 </div></section>
 <section className="entry-card entry-choice-stage" hidden={step==='room'}><p className="eyebrow">{step==='identity'?'01 / 你从哪里重新开始':step==='wish'?'02 / 这一次，在意什么':'03 / 先留一段日子'}</p><h2 ref={stepHeading} tabIndex={-1}>{step==='identity'?'还是那个熟悉的2020年。':step==='wish'?'这一次，想把什么留给自己？':'先从哪件事开始？'}</h2>
 <form className="entry-choice-form" id={entryForm} onSubmit={event=>{event.preventDefault();if(step==='identity'){setStep('wish');return}if(step==='wish'){setStep('approach');return}if(controller&&ready)void controller.newLife({backgroundId,playerProfile:{wishId,approach},...(seed?{seed}:{})}).catch(()=>{})}}>
 {step!=='room'?<NewLifeChoices step={step} backgroundId={backgroundId} wishId={wishId} approach={approach} seed={seed} onBackground={setBackgroundId} onWish={setWishId} onApproach={setApproach} onSeedSettings={()=>setSeedOpen(true)} onMemoryExplanation={()=>setMemoryOpen(true)}/>:null}
 </form><div className="entry-step-actions"><button type="button" onClick={()=>setStep(step==='identity'?'room':step==='wish'?'identity':'wish')}>{step==='identity'?'返回房间':step==='wish'?'回到原来的起点':'回看自己的愿望'}</button><button className="primary" type="submit" form={entryForm} disabled={state.busy||step==='approach'&&!ready}>{state.busy?'正在保存新人生…':step==='identity'?'下一步：想想自己的生活':step==='wish'?'下一步：看看本季的选择':'开始新人生'}</button></div></section>
 <div className="home-library-pocket"><button type="button" disabled={!controller||state.busy} onClick={onStorage}>导入人生</button><button type="button" onClick={()=>setLibrary(true)}>本机故事 · {state.runs.length}</button></div>
 {memoryOpen?<Dialog title="那段模糊的记忆" onClose={()=>setMemoryOpen(false)}><blockquote className="entry-memory">“后来，有些工具走进了日常。可现在，你还需要先把生活安顿好。”</blockquote><p className="field-help">模糊的记忆不是精确价格，也不是购买资格。开局不会因为知道未来而收到额外的钱。</p><p>这里只是建议顺序，开局后仍需逐项确认，也可以跳过引导；不会自动工作、接单或买股。</p><button type="button" onClick={()=>setMemoryOpen(false)}>回到起步选择</button></Dialog>:null}
 {seedOpen?<Dialog title="固定种子（可选）" onClose={()=>setSeedOpen(false)}><label className="field">重玩使用的种子<input value={seed} maxLength={256} onChange={event=>setSeed(event.target.value)} placeholder="留空生成新一局" autoComplete="off"/></label><p className="field-help">同版本、同种子、同命令才可比较；不会展示隐藏结果。</p><button type="button" onClick={()=>setSeedOpen(false)}>回到起步选择</button></Dialog>:null}
 {library?<Dialog title="保存在本机的故事" onClose={()=>setLibrary(false)}><section className="home-library"><div className="entry-bottom"><div><p className="eyebrow">只保存在这台浏览器</p><p>存档可以导出备份，继续哪段人生由你决定。</p></div><button type="button" disabled={!controller||state.busy} onClick={onStorage}>导入存档</button></div>
 {state.runs.length>0?<details className="continue-list" open><summary>本机存档与原档导出（{state.runs.length}）</summary>{state.runs.map(run=><article className="save-row" key={run.runId}><div><strong>{run.backgroundId?backgroundNames[run.backgroundId as keyof typeof backgroundNames]??run.backgroundId:'旧版本或不可读取存档'}</strong><small>{run.date??'原档保留'} · {run.revision===null?run.errorCode:`第${run.revision}次提交`} · {run.runId.slice(0,18)}</small></div><div className="button-row"><button type="button" disabled={!ready||!run.compatible} onClick={()=>{void controller?.continueLife(run.runId).catch(()=>{})}}>继续</button><button type="button" disabled={state.busy} onClick={()=>onExport(run.runId)}>导出原档</button></div></article>)}</details>:null}<p className="scope-label">这段人生可以回看，也可以继续处理原事项；新人生从2020重新开始。市场交易为模拟，直接股权为明确架空安排。</p></section></Dialog>:null}</main>
}
