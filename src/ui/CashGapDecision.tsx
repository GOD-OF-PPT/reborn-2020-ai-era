import type {GamePanelProps} from './game-types.ts'
import {cashGapReading} from './cash-gap-reading.ts'
import {CommandButton} from './CommandButton.tsx'
import './cash-gap-decision.css'

export function CashGapDecision({p,hasDebts}:{p:GamePanelProps;hasDebts:boolean}){
 const reading=cashGapReading(p),pause=p.features.workbench.pause
 if(!reading||!pause)return null
 return <section className="cash-gap-decision" data-state={reading.state} role="alert"><h3>{reading.title}</h3><p>{reading.line}</p><div className="cash-gap-actions">{hasDebts?<a href="#quarter-original-debts">核对原待付款 ↗</a>:null}<CommandButton {...p} kind="AcknowledgeCashGap" payload={{instanceId:pause.instanceId}} label={reading.label}/></div></section>
}
