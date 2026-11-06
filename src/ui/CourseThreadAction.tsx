import type {ReactNode} from 'react'
import {courseAudienceReading,courseAudienceNext} from './course-audience-reading.ts'
import {CourseAudienceAction} from './CourseAudienceAction.tsx'
import {courseEntryReading} from './course-entry-reading.ts'
import {CourseEntryAction,type CourseEntryExtras} from './CourseEntryAction.tsx'
import {courseStudioReading} from './course-studio-reading.ts'
import {courseLessonReading} from './course-lesson-preparation.ts'
import {courseClassResume,courseClassResult} from './course-class-reading.ts'
import {CourseStudioAction} from './CourseStudioAction.tsx'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'
import {courseWaitDate} from './course-wait-date.ts'
import {courseAttemptClosed} from './thread-purpose.ts'
import type {CourseChoiceIntent} from './CourseSceneChoice.tsx'
import {courseSceneProgress} from './course-scene-progress.ts'
import {resolveCourseFocus,courseSceneContext} from './course-player-thread.ts'
import {COURSE_JOBS} from '../content/course.ts'
import {moneyText} from './game-text.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'

type Primary={binding:SharedActionBinding;main:ReactNode;continuation?:ReactNode;courseEntry?:CourseEntryExtras}
type Props={p:GamePanelProps;thread:PlayerThreadView;active:boolean;date:string|null;waitLabel:string;onChoose:(intent?:CourseChoiceIntent)=>void;onResult:()=>void;onToday:()=>void;onNavigate?:NavigateScene|undefined;children:(primary:Primary|null)=>ReactNode}

/** The thought and course object invoke this same original decision. */
export function CourseThreadAction({p,thread,active,date,waitLabel,onChoose,onResult,onToday,onNavigate,children}:Props){
 if(!active)return children(null)
 const teaching=thread.focus.kind==='course'&&(thread.focus.courseTarget?.kind==='audience'||thread.focus.courseTarget?.kind==='cohort'||thread.stage.startsWith('course-refresh')||thread.stage==='course-update-required')
 const showReason=!p.view.hasCandidate&&!p.view.readOnly&&p.view.saveStatus!=='conflict'
 const choice=(label:string,caption:string,activate:()=>void)=>{
  const binding=makeSharedAction(p,label,activate,{allowReadOnly:true})
  return children({binding,main:<div className="command moment-decision moment-primary"><button type="button" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{label}<small>{caption}</small></span><i aria-hidden="true">→</i></button>{binding.reason?<small className="reason">{binding.reason}</small>:null}</div>})
 }
 if(courseAttemptClosed(p,thread))return choice('回到今天，看看接下来的日子','保留本班学习、退款、钱款与原书签；新班仍须另行决定',onToday)
 const classResult=courseClassResult(p,thread)
 if(classResult)return choice(classResult.label,'保留这一段实际交付；下一次投入仍由你决定',()=>onChoose('current-class'))
 const audienceNext=courseAudienceNext(p,thread)
 if(audienceNext)return <CourseAudienceAction p={p} thread={thread} reading={audienceNext} onChoose={onChoose} onToday={onToday}>{children}</CourseAudienceAction>
 if(thread.focusScope==='history'&&courseAudienceReading(p,thread)?.historical)return choice('看清这份原回应，再决定下一步','回看原反馈；新班仍按今天的条件另选',onResult)
 if(thread.focusScope==='history')return teaching?choice('看清这一段之后，决定怎样继续','翻回同一班的当前承诺，或保留这份实际结果',onResult):choice('合上这份教案留页，回到今天','保留原课程、样课尝试与书签，不重做准备',onToday)
 const entry=onNavigate?courseEntryReading(p,thread):null
 if(entry&&onNavigate)return <CourseEntryAction p={p} thread={thread} reading={entry} date={date} waitLabel={waitLabel} onChoose={onChoose} onToday={onToday} onNavigate={onNavigate}>{children}</CourseEntryAction>
 const studio=courseStudioReading(p,thread)
 if(studio?.choice)return <CourseStudioAction p={p} thread={thread} reading={studio} onChoose={onChoose}>{children}</CourseStudioAction>
 const resume=courseClassResume(p,thread)
 if(resume)return <CommandButton {...p} kind="ResumeCourseEnrollment" payload={{courseId:resume.courseId}} label={resume.label} confirm={false} className="moment-decision moment-primary" showReason={showReason} renderAction={(binding,main)=>children({binding,main})}><b aria-hidden="true">01</b><span>{resume.label}<small>原更新已经完成；新班仍要另作承诺</small></span><i aria-hidden="true">→</i></CommandButton>
 const lesson=courseLessonReading(p,thread)
 if(lesson?.toolCommand){const command=lesson.toolCommand;return <CommandButton {...p} kind="DecideVideoProgram" payload={{applicationId:command.applicationId}} label={command.label} confirm={false} className="moment-decision moment-primary" showReason={showReason} renderAction={(binding,main)=>children({binding,main})}><b aria-hidden="true">01</b><span>{command.label}<small>读真实回信，不重新付款或延长条件</small></span><i aria-hidden="true">↗</i></CommandButton>}
 if(lesson?.toolWait){const wait=lesson.toolWait,next=playableAdvanceDate(p.features.workbench,p.view.date,wait.date);if(next)return <ClockAdvance p={{...p,accountId:wait.accountId}} date={next} label={(next===wait.date?wait.label:'先到日历上的下一处反馈')+' · '+next} room showReason={showReason} renderAction={binding=>children({binding,main:<div className="moment-wait moment-primary"><div className="clock-advance clock-advance-room">{binding.reviewNode}{binding.mainNode}</div></div>})}/>}
 if(lesson?.tool)return choice('准备图像工具的使用条件','选原账号，留出人手和时间；课程与案例保留',()=>onChoose('tool'))
 if(thread.stage==='course-draft'&&lesson)return choice('亲手准备这一堂课的样课','先留出人手和时间，再作真实投入',()=>onChoose('sample'))
 if(teaching&&thread.outcome==='non-success')return choice('看清停下之后，仍要面对什么','先决定退款与未完承诺，再考虑继续等待',onResult)
 if(thread.command)return <CommandButton {...p} {...thread.command} className="moment-decision moment-primary" showReason={showReason} renderAction={(binding,main)=>children({binding,main})}><b aria-hidden="true">01</b><span>{thread.command.label}<small>核对这间教室的条件，再由你决定</small></span><i aria-hidden="true">→</i></CommandButton>
 if(teaching&&thread.stage==='course-cohort-update-required'){
  const target=thread.focus.kind==='course'?thread.focus.courseTarget:null
  const courseId=target&&'courseId' in target?target.courseId:null,businessId=target?.businessId
  const lessons=p.features.course?.courses.filter(lesson=>lesson.id===courseId&&lesson.businessId===businessId)??[]
  const lesson=lessons.length===1?lessons[0]:null,definition=lesson?COURSE_JOBS.find(job=>job.id===`course-refresh-${lesson.productId}-${lesson.topicId}`):null
  const caption=definition?`每份教学资源${moneyText(definition.costFen)} / ${definition.actionPoints}点 / ${definition.durationDays}日；先选人手和开工日`:'先选这堂课、人手和开工日，再核对钱与时间'
  return choice(definition?.durationDays===7?'留一周，把课补上':'安排人手，把课补上',caption,()=>onChoose())
 }
 if(thread.wait&&date){
  const next=teaching?courseWaitDate(p.features.workbench,p.view.date,date,p.requestWait!==undefined):date
  if(next===null)return choice('先翻看这份等待的安排','当前日历停点需要重新核对',onChoose)
  const label=next<date?'先到日历上的这一日':waitLabel
  return <ClockAdvance p={p} date={next} label={label+' · '+next} room showReason={showReason} renderAction={binding=>children({binding,main:<div className="moment-wait moment-primary"><div className="clock-advance clock-advance-room">{binding.reviewNode}{binding.mainNode}</div></div>})}/>
 }
 if(teaching&&(thread.outcome==='non-success'||thread.stage==='course-cohort-closed'||thread.stage.endsWith('-completed')))return choice('这一次的结果之后，怎样继续','看清实际学员、钱款与未完承诺，再决定下一步',onResult)
 const readyFocus=thread.focus.kind==='course'&&thread.focus.courseTarget?.kind==='course'?thread.focus:null
 const ready=readyFocus&&readyFocus.accountId===p.accountId&&!resolveCourseFocus(p,readyFocus).reason?courseSceneProgress(p.features.course,p.view.date,readyFocus.courseTarget,courseSceneContext(p)):null
 if(thread.stage==='course-ready'&&thread.focusStatus!=='invalid'&&thread.invalidReason===null&&ready?.phase==='course-ready'&&!ready.historical&&!thread.responsibilityOverrideNeeded&&p.features.workbench.pause===null&&!p.features.workbench.progression.requiresDelivery)return choice('先了解，谁可能需要这堂课','只选择来源与拟报价；推广、开班和报名仍须分别确认',()=>onChoose('audience'))
 if(thread.stage==='course-ready'||thread.stage==='course-paused'&&thread.outcome==='actual'||thread.outcome==='non-success'||thread.stage==='course-closed')return choice('这一份准备之后，想怎样继续','看清这份准备与未完约定，再决定接下来的日子',onResult)
 return choice(thread.inspect.label,teaching?thread.focus.kind==='course'&&thread.focus.courseTarget?.kind==='audience'?'先决定是否开班，新的承诺仍需确认':'先选择这班的具体安排，真正投入仍需确认':'先选教案、资源与日期，真正投入仍需确认',onChoose)
}
