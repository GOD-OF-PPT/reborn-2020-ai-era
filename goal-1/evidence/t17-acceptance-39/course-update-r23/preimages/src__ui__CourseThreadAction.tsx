import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'
import {courseWaitDate} from './course-wait-date.ts'
import {courseAttemptClosed} from './thread-purpose.ts'
import type {CourseChoiceIntent} from './CourseSceneChoice.tsx'
import {courseSceneProgress} from './course-scene-progress.ts'
import {resolveCourseFocus,courseSceneContext} from './course-player-thread.ts'

type Primary={binding:SharedActionBinding;main:ReactNode}
type Props={p:GamePanelProps;thread:PlayerThreadView;active:boolean;date:string|null;waitLabel:string;onChoose:(intent?:CourseChoiceIntent)=>void;onResult:()=>void;onToday:()=>void;children:(primary:Primary|null)=>ReactNode}

/** The thought and course object invoke this same original decision. */
export function CourseThreadAction({p,thread,active,date,waitLabel,onChoose,onResult,onToday,children}:Props){
 if(!active)return children(null)
 const teaching=thread.focus.kind==='course'&&(thread.focus.courseTarget?.kind==='audience'||thread.focus.courseTarget?.kind==='cohort'||thread.stage.startsWith('course-refresh')||thread.stage==='course-update-required')
 const showReason=!p.view.hasCandidate&&!p.view.readOnly&&p.view.saveStatus!=='conflict'
 const choice=(label:string,caption:string,activate:()=>void)=>{
  const binding=makeSharedAction(p,label,activate,{allowReadOnly:true})
  return children({binding,main:<div className="command moment-decision moment-primary"><button type="button" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{label}<small>{caption}</small></span><i aria-hidden="true">→</i></button>{binding.reason?<small className="reason">{binding.reason}</small>:null}</div>})
 }
 if(courseAttemptClosed(p,thread))return choice('回到今天，看看接下来的日子','保留本班学习、退款、钱款与原书签；新班仍须另行决定',onToday)
 if(thread.focusScope==='history')return teaching?choice('看清这一段之后，决定怎样继续','翻回同一班的当前承诺，或保留这份实际结果',onResult):choice('合上这份教案留页，回到今天','保留原课程、样课尝试与书签，不重做准备',onToday)
 if(teaching&&thread.outcome==='non-success')return choice('看清停下之后，仍要面对什么','先决定退款与未完承诺，再考虑继续等待',onResult)
 if(thread.command)return <CommandButton {...p} {...thread.command} className="moment-decision moment-primary" showReason={showReason} renderAction={(binding,main)=>children({binding,main})}><b aria-hidden="true">01</b><span>{thread.command.label}<small>核对这间教室的条件，再由你决定</small></span><i aria-hidden="true">→</i></CommandButton>
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
