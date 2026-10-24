import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {OpeningAttemptView} from './opening-attempt.ts'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'

type SharedPrimary={binding:SharedActionBinding;main:ReactNode}
type Props={p:GamePanelProps;attempt:OpeningAttemptView|null;date:string|null;waitLabel:string;openOffer:()=>void;openMarket:()=>void;openFree:()=>void;openNext:()=>void;inspect:()=>void;children:(primary:SharedPrimary|null)=>ReactNode}

/** One original action serves the thought and the physical object. No second command path. */
export function OpeningAttemptAction({p,attempt,date,waitLabel,openOffer,openMarket,openFree,openNext,inspect,children}:Props){
 if(!attempt)return children(null)
 const intent=attempt.action
 // The room already exposes the global save/readonly notice and its recovery button.
 const showReason=!p.view.hasCandidate&&!p.view.readOnly&&p.view.saveStatus!=='conflict'
 if(intent.kind==='command')return <CommandButton {...p} {...intent.command} confirm={intent.command.confirm??true} className="moment-decision moment-primary" showReason={showReason} renderAction={(binding,main)=>children({binding,main})}><b aria-hidden="true">01</b><span>{intent.command.label}<small>看清投入，再由你确认</small></span><i aria-hidden="true">→</i></CommandButton>
 if(intent.kind==='wait')return date?<ClockAdvance p={p} date={date} label={waitLabel+' · '+date} room showReason={showReason} renderAction={binding=>children({binding,main:<div className="moment-wait moment-primary"><div className="clock-advance clock-advance-room">{binding.reviewNode}{binding.mainNode}</div></div>})}/>:children(null)
 const choice=intent.kind==='offer-reply'?{label:'回应这封委托',caption:'接下、婉拒，或把日子留给别的事',activate:openOffer}
  :intent.kind==='market-choice'?{label:'看看这笔钱，准备怎样安排',caption:'先研究、显选模拟委托，或暂不买入',activate:openMarket}
  :intent.kind==='free-choice'?{label:'今天，先把时间留给什么',caption:'工作、休整，或先看看别的可能',activate:openFree}
  :intent.kind==='next-choice'?{label:'接下来的日子，想怎样继续',caption:'保留这次结果，再选一个在意的方向',activate:openNext}
  :{label:intent.inspect.label,caption:'翻阅同一件事的记录',activate:inspect}
 const binding=makeSharedAction(p,choice.label,choice.activate,{allowReadOnly:true})
 return children({binding,main:<div className="command moment-decision moment-primary"><button type="button" aria-label={binding.label} disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{choice.label}<small>{choice.caption}</small></span><i aria-hidden="true">→</i></button>{binding.reason?<small className="reason">{binding.reason}</small>:null}</div>})
}
