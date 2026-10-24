import {cloneElement,isValidElement} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {OpeningObject} from './OpeningObject.tsx'
import {CourseThreadAction} from './CourseThreadAction.tsx'
import {coursePreparationPaperFor} from './course-continuity.ts'
import {courseTeachingPaperFor,courseTeachingPaperLabel,courseTeachingMoneyFor} from './course-teaching-continuity.ts'
import {courseTeachingPaper} from './course-teaching-paper.ts'
import './course-encounter.css'

type Props={p:GamePanelProps;thread:PlayerThreadView;date:string|null;waitLabel:string;onChoose:()=>void;onResult:()=>void;onToday:()=>void}

export function CourseEncounter({p,thread,date,waitLabel,onChoose,onResult,onToday}:Props){
 const art=coursePreparationPaperFor(thread)
 const target=thread.focus.kind==='course'?thread.focus.courseTarget:null
 const classArt=courseTeachingPaperFor(p,target),teaching=courseTeachingPaper(p,target),money=courseTeachingMoneyFor(p,target)
 return <CourseThreadAction p={p} thread={thread} active date={date} waitLabel={waitLabel} onChoose={onChoose} onResult={onResult} onToday={onToday}>{primary=>{
  if(!primary)return null
  const node=isValidElement<{className?:string}>(primary.main)?primary.main:null
  const classes=node?.props.className?.split(/\s+/).filter(Boolean)??[]
  const main=node?cloneElement(node,{className:(classes.includes('command')?['command','scene-decision-main',...classes.filter(c=>c!=='command'&&c!=='scene-decision-main')]:[...classes.filter(c=>c!=='scene-decision-main'),'scene-decision-main']).join(' ')}):primary.main
  const protection=p.view.readOnly?'readonly' as const:p.view.hasCandidate||p.view.saveStatus!=='saved'?'unsaved' as const:primary.binding.disabled?'unavailable' as const:undefined
  return <section className="scene-action course-encounter" aria-label={classArt?target?.kind==='audience'?'这一份受众的决定':'这一班学员的决定':'这一份教学准备的决定'} data-course-stage={thread.stage}>
   <div className="course-encounter-thought"><span className="scene-choice-overline" data-book-chapter={thread.title}>{classArt?target?.kind==='audience'?'眼前的受众与报价 · 由你决定':'眼前的学员与承诺 · 由你决定':'眼前这份教案 · 由你决定'}</span><p className="course-encounter-object">{thread.object}</p><p className="scene-choice-line">{thread.detail}</p>{money?<p className="course-scene-money">{money}</p>:null}{main}</div>
   <div className="course-encounter-paper"><OpeningObject kind={thread.outcome==='non-success'?'letter':thread.wait?'calendar':'work'} appearance="course" title={thread.object} displayTitle="" detail={thread.wait&&!(primary.binding.label.includes(thread.wait.date)&&primary.binding.label.includes(thread.wait.label))?thread.wait.date+' · '+thread.wait.label:''} stageLabel={classArt?courseTeachingPaperLabel(classArt):thread.focusScope==='history'?'历史回看':thread.stage==='course-ready'?'样课已经完成':thread.stage.endsWith('-planned')?'已安排 · 尚未开工':thread.stage.endsWith('-running')?'正在准备 · 尚未完成':thread.outcome==='non-success'?'这次准备留下的原记录':'这份教学准备'} actionLabel={primary.binding.label} disabled={primary.binding.disabled} onActivate={primary.binding.activate} textOnly={p.textOnly===true} {...(art?{coursePaper:art}:{})} {...(classArt?{teachingPaper:classArt}:{})} {...(teaching?{teaching}:{})} {...(protection?{protection}:{})}/></div>
  </section>
 }}</CourseThreadAction>
}
