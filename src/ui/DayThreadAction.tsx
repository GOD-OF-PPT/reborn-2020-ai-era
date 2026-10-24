import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'

type Primary={binding:SharedActionBinding;main:ReactNode}
type Props={p:GamePanelProps;thread:PlayerThreadView;active:boolean;result:boolean;date:string|null;waitLabel:string;onToday:()=>void;children:(primary:Primary|null)=>ReactNode}

/** A single original action binds both the work/life/market object and its main thought. */
export function DayThreadAction({p,thread,active,result,date,waitLabel,onToday,children}:Props){
 if(!active)return children(null)
 const showReason=!p.view.hasCandidate&&!p.view.readOnly&&p.view.saveStatus!=='conflict'
 if(thread.focusScope==='history'||result||thread.stage==='market-position'){
  const label=thread.focusScope==='history'?'合上这页，回到今天':thread.stage==='market-position'?'这份判断，接下来怎样安排':'收好这次结果，想想接下来的日子'
  const binding=makeSharedAction(p,label,onToday,{allowReadOnly:true})
  return children({binding,main:<div className="command moment-decision moment-primary"><button type="button" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{label}<small>{thread.focusScope==='history'?'返回今天的选择，原来的书签保留':'继续原安排，或明确选择下一步'}</small></span><i aria-hidden="true">→</i></button>{binding.reason?<small className="reason">{binding.reason}</small>:null}</div>})
 }
 if(thread.command)return <CommandButton {...p} {...thread.command} confirm={thread.command.confirm} className="moment-decision moment-primary" showReason={showReason} renderAction={(binding,main)=>children({binding,main})}><b aria-hidden="true">01</b><span>{thread.command.label}<small>看清投入，再由你确认</small></span><i aria-hidden="true">→</i></CommandButton>
 if(thread.wait&&date)return <ClockAdvance p={p} date={date} label={waitLabel+' · '+date} room showReason={showReason} renderAction={binding=>children({binding,main:<div className="moment-wait moment-primary"><div className="clock-advance clock-advance-room">{binding.reviewNode}{binding.mainNode}</div></div>})}/>
 return children(null)
}
