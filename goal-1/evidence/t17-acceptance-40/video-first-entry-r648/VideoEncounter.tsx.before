import {cloneElement,isValidElement} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {VideoThreadAction} from './VideoThreadAction.tsx'
import {OpeningObject,type OpeningObjectProps} from './OpeningObject.tsx'
import {videoPaperFor} from './video-continuity.ts'
import './video-encounter.css'

export interface VideoEncounterProps{
 readonly p:GamePanelProps
 readonly thread:PlayerThreadView
 readonly date:string|null
 readonly waitLabel:string
 readonly onChoose:()=>void
 readonly onResult:()=>void
 readonly onToday:()=>void
}

function objectKind(thread:PlayerThreadView):OpeningObjectProps['kind']{
 if(thread.outcome==='non-success')return 'letter'
 if(thread.stage==='video-settled'||thread.stage==='video-platform-paid')return 'receipt'
 if(thread.stage==='video-planned'||thread.stage==='video-marketing-planned')return 'calendar'
 if(['video-self-review','video-submit','video-ready-to-publish'].includes(thread.stage))return 'work'
 return thread.wait?'waiting':'portfolio'
}

/** One original route decision and its foreground object; no parallel command or lifecycle. */
export function VideoEncounter({p,thread,date,waitLabel,onChoose,onResult,onToday}:VideoEncounterProps){
 const art=videoPaperFor(thread)
 const paperStage=thread.focusScope==='history'?'历史回看':thread.focusScope==='carry'?'原约定仍在继续':thread.stage==='video-entry'?'先选账号':art?.phase==='planned'?'已经安排 · 尚未开工':art?.phase==='making'?'正在进行 · 尚待实际完成':art?.phase==='review'?'作品完成 · 待亲自核对':art?.phase==='delivery'?(thread.stage==='video-ready-to-publish'?'这一版待选择发布':'这一版待亲手提交'):art?.phase==='feedback'?'等待这次反馈':art?.phase==='revision'?(thread.stage==='video-quality'?'素材问题 · 待处理':'客户回信 · 待回应'):art?.phase==='settlement'?'原应收 · 尚未实际到账':art?.phase==='non-success'?'这次留下的原记录':art?.phase==='result'?'已有实际结果':'等待你的决定'
 const paperDetail=thread.wait?thread.wait.date+' · '+thread.wait.label:thread.outcome==='non-success'?'原成本与约定仍保留':''
 return <VideoThreadAction p={p} thread={thread} active={thread.focus.kind==='video'&&thread.focusStatus!=='invalid'} date={date} waitLabel={waitLabel} onChoose={onChoose} onResult={onResult} onToday={onToday}>{primary=>{
  if(!primary)return null
  // Keep the original button/Clock and live handler. The existing route number
  // lookup finds .scene-decision-main>button or the original .clock-main>button.
  const main=isValidElement<{className?:string}>(primary.main)?cloneElement(primary.main,{className:[primary.main.props.className,'scene-decision-main'].filter(Boolean).join(' ')}):primary.main
  const protection=p.view.readOnly?'readonly' as const:p.view.hasCandidate||p.view.saveStatus!=='saved'?'unsaved' as const:primary.binding.disabled?'unavailable' as const:undefined
  return <section className="scene-action video-encounter" data-video-stage={thread.stage} data-focus-scope={thread.focusScope} aria-label="这一份视频的决定">
   <div className="video-encounter-thought">
    <span className="scene-choice-overline" data-book-chapter={thread.title}>{thread.focusScope==='history'?'翻阅原来的一份':'眼前这一份 · 由你决定'}</span>
    <p className="scene-choice-line">{thread.detail}</p>
    {main}
   </div>
   <div className="video-encounter-paper">
    <OpeningObject kind={objectKind(thread)} appearance="video" title={thread.object} displayTitle="" detail={paperDetail} stageLabel={paperStage} actionLabel={primary.binding.label} disabled={primary.binding.disabled} onActivate={primary.binding.activate} textOnly={p.textOnly===true} {...(art?{videoPaper:art}:{})} {...(protection?{protection}:{})}/>
   </div>
  </section>
 }}</VideoThreadAction>
}
