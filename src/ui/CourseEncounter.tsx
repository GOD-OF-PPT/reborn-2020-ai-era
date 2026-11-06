import {cloneElement,isValidElement} from 'react'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {OpeningObject} from './OpeningObject.tsx'
import {CourseThreadAction} from './CourseThreadAction.tsx'
import {coursePreparationPaperFor} from './course-continuity.ts'
import {courseTeachingPaperFor,courseTeachingPaperLabel,courseTeachingMoneyFor} from './course-teaching-continuity.ts'
import {courseTeachingPaper} from './course-teaching-paper.ts'
import type {CourseChoiceIntent} from './CourseSceneChoice.tsx'
import './course-encounter.css'
import {CourseStudioAction} from './CourseStudioAction.tsx'
import {CourseEntryOptions} from './CourseEntryOptions.tsx'
import {courseStudioReading} from './course-studio-reading.ts'
import {courseLessonReading} from './course-lesson-preparation.ts'
import {courseAudienceReading} from './course-audience-reading.ts'
import {courseClassReading} from './course-class-reading.ts'

type Props={p:GamePanelProps;thread:PlayerThreadView;date:string|null;waitLabel:string;onChoose:(intent?:CourseChoiceIntent)=>void;onResult:()=>void;onToday:()=>void;onNavigate?:NavigateScene|undefined}

export function CourseEncounter({p,thread,date,waitLabel,onChoose,onResult,onToday,onNavigate}:Props){
 const lesson=courseLessonReading(p,thread),classReading=courseClassReading(p,thread),preparation=courseStudioReading(p,thread),audience=courseAudienceReading(p,thread),studio=preparation??lesson??audience??classReading,art=coursePreparationPaperFor(thread)
 const target=thread.focus.kind==='course'?thread.focus.courseTarget:null
 const classArt=courseTeachingPaperFor(p,target),teaching=courseTeachingPaper(p,target),money=courseTeachingMoneyFor(p,target)
 const browse=!!target&&['course','audience','cohort'].includes(target.kind)&&thread.focusStatus!=='invalid'&&!thread.legacyFallbackRequired&&!thread.responsibilityOverrideNeeded&&p.features.workbench.pause===null&&!p.features.workbench.progression.requiresDelivery
 return <CourseThreadAction p={p} thread={thread} active date={date} waitLabel={waitLabel} onChoose={onChoose} onResult={onResult} onToday={onToday} onNavigate={onNavigate}>{primary=>{
  if(!primary)return null
  const node=isValidElement<{className?:string}>(primary.main)?primary.main:null
  const classes=node?.props.className?.split(/\s+/).filter(Boolean)??[]
  const main=node?cloneElement(node,{className:(classes.includes('command')?['command','scene-decision-main',...classes.filter(c=>c!=='command'&&c!=='scene-decision-main')]:[...classes.filter(c=>c!=='scene-decision-main'),'scene-decision-main']).join(' ')}):primary.main
  const protection=p.view.readOnly?'readonly' as const:p.view.hasCandidate||p.view.saveStatus!=='saved'?'unsaved' as const:primary.binding.disabled?'unavailable' as const:undefined
  return <section className="scene-action course-encounter" aria-label={classArt?target?.kind==='audience'?'这一份受众的决定':'这一班学员的决定':'这一份教学准备的决定'} data-course-stage={thread.stage} data-course-entry={primary.courseEntry?true:undefined} data-studio-preparation={studio?true:undefined}>
   <div className="course-encounter-thought">{primary.courseEntry?<p className="scene-choice-line">{primary.courseEntry.reading.caseLine}</p>:studio?<><p className="scene-choice-line">{classReading?.detail??lesson?.detail??preparation?.detail??audience?.detail??thread.detail}</p>{classReading&&money?<p className="course-scene-money">{money}</p>:null}</>:<><span className="scene-choice-overline" data-book-chapter={thread.title}>{classArt?target?.kind==='audience'?'眼前的受众与报价 · 由你决定':'眼前的学员与承诺 · 由你决定':'眼前这份教案 · 由你决定'}</span><p className="course-encounter-object">{thread.object}</p><p className="scene-choice-line">{thread.detail}</p>{money?<p className="course-scene-money">{money}</p>:null}</>}{main}{primary.courseEntry?<CourseEntryOptions value={primary.courseEntry}/>:null}{browse?<CourseStudioAction p={p} thread={thread} reading={{title:'翻回这间教室的经历',line:thread.line,stageLabel:thread.stage,choice:'objects',label:'翻回这间教室的其它经历',caption:'班期、课程与原来的受众'}} onChoose={onChoose}>{({binding})=><button type="button" className="course-object-browse" disabled={binding.disabled} onClick={binding.activate}>{binding.label} ↗</button>}</CourseStudioAction>:null}</div>
   <div className="course-encounter-paper"><OpeningObject {...(primary.courseEntry||studio?{copyMode:'tableau' as const}:{})} kind={thread.outcome==='non-success'?'letter':thread.wait?'calendar':'work'} appearance="course" title={thread.object} displayTitle="" detail={primary.courseEntry?'':thread.wait&&!(primary.binding.label.includes(thread.wait.date)&&primary.binding.label.includes(thread.wait.label))?thread.wait.date+' · '+thread.wait.label:''} stageLabel={primary.courseEntry?'课程尚未开放':studio?studio.stageLabel:classArt?courseTeachingPaperLabel(classArt):thread.focusScope==='history'?'历史回看':thread.stage==='course-ready'?'样课已经完成':thread.stage.endsWith('-planned')?'已安排 · 尚未开工':thread.stage.endsWith('-running')?'正在准备 · 尚未完成':thread.outcome==='non-success'?'这次准备留下的原记录':'这份教学准备'} actionLabel={primary.binding.label} disabled={primary.binding.disabled} onActivate={primary.binding.activate} textOnly={p.textOnly===true} {...(art?{coursePaper:art}:{})} {...(classArt?{teachingPaper:classArt}:{})} {...(teaching?{teaching}:{})} {...(protection?{protection}:{})}/></div>
  </section>
 }}</CourseThreadAction>
}
