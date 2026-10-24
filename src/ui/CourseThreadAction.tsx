import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'

type Primary={binding:SharedActionBinding;main:ReactNode}
type Props={p:GamePanelProps;thread:PlayerThreadView;active:boolean;date:string|null;waitLabel:string;onChoose:()=>void;onResult:()=>void;onToday:()=>void;children:(primary:Primary|null)=>ReactNode}

/** The thought and preparation object invoke this same original decision. */
export function CourseThreadAction({p,thread,active,date,waitLabel,onChoose,onResult,onToday,children}:Props){
 if(!active)return children(null)
 const showReason=!p.view.hasCandidate&&!p.view.readOnly&&p.view.saveStatus!=='conflict'
 const choice=(label:string,caption:string,activate:()=>void)=>{
  const binding=makeSharedAction(p,label,activate,{allowReadOnly:true})
  return children({binding,main:<div className="command moment-decision moment-primary"><button type="button" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{label}<small>{caption}</small></span><i aria-hidden="true">→</i></button>{binding.reason?<small className="reason">{binding.reason}</small>:null}</div>})
 }
 if(thread.focusScope==='history')return choice('合上这份教案留页，回到今天','保留原课程、样课尝试与书签，不重做准备',onToday)
 if(thread.command)return <CommandButton {...p} {...thread.command} className="moment-decision moment-primary" showReason={showReason} renderAction={(binding,main)=>children({binding,main})}><b aria-hidden="true">01</b><span>{thread.command.label}<small>核对这间教室的条件，再由你决定</small></span><i aria-hidden="true">→</i></CommandButton>
 if(thread.wait&&date)return <ClockAdvance p={p} date={date} label={waitLabel+' · '+date} room showReason={showReason} renderAction={binding=>children({binding,main:<div className="moment-wait moment-primary"><div className="clock-advance clock-advance-room">{binding.reviewNode}{binding.mainNode}</div></div>})}/>
 if(thread.stage==='course-ready'||thread.stage==='course-paused'&&thread.outcome==='actual'||thread.outcome==='non-success'||thread.stage==='course-closed')return choice('这一份准备之后，想怎样继续','看清这份准备与未完约定，再决定接下来的日子',onResult)
 return choice(thread.inspect.label,'先选教案、资源与日期，真正投入仍需确认',onChoose)
}
