import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'
import {moneyText} from './game-text.ts'

type Primary={binding:SharedActionBinding;main:ReactNode}
type Props={p:GamePanelProps;thread:PlayerThreadView;active:boolean;result:boolean;date:string|null;waitLabel:string;onToday:()=>void;children:(primary:Primary|null)=>ReactNode}

/** A single original action binds both the work/life/market object and its main thought. */
export function DayThreadAction({p,thread,active,result,date,waitLabel,onToday,children}:Props){
 if(!active)return children(null)
 const showReason=!p.view.hasCandidate&&!p.view.readOnly&&p.view.saveStatus!=='conflict'
 if(thread.focusScope==='history'||result||thread.stage==='market-position'){
  const label=thread.stage==='market-position'?'看看别的安排':'回到今天'
  const binding=makeSharedAction(p,label,onToday,{allowReadOnly:true})
  return children({binding,main:<div className="command moment-decision moment-primary"><button type="button" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{label}</span><i aria-hidden="true">→</i></button>{binding.reason?<small className="reason">{binding.reason}</small>:null}</div>})
 }
 if(thread.focus.kind==='free'&&thread.stage==='choose'){
  const terms=p.features.life.work.rest
  return <CommandButton {...p} kind="StartLifeWork" payload={{kind:'rest',personId:null,reference:null}} label="歇几天" confirm className="moment-decision moment-primary" showReason={showReason} renderAction={(binding,main)=>children({binding,main})}><b aria-hidden="true">01</b><span>歇几天<small>{moneyText(terms.costFen)} · {terms.points}点 · {terms.days}天</small></span><i aria-hidden="true">→</i></CommandButton>
 }
 if(thread.command)return <CommandButton {...p} {...thread.command} confirm={thread.command.confirm} className="moment-decision moment-primary" showReason={showReason} renderAction={(binding,main)=>children({binding,main})}><b aria-hidden="true">01</b><span>{thread.command.label}</span><i aria-hidden="true">→</i></CommandButton>
 if(thread.wait&&date)return <ClockAdvance p={p} date={date} label={waitLabel+' · '+date} room showReason={showReason} renderAction={binding=>children({binding,main:<div className="moment-wait moment-primary"><div className="clock-advance clock-advance-room">{binding.reviewNode}{binding.mainNode}</div></div>})}/>
 return children(null)
}
