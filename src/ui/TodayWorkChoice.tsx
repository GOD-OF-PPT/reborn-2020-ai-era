import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {CommandButton} from './CommandButton.tsx'
import {makeSharedAction} from './shared-action.ts'
import {moneyText} from './game-text.ts'
import {quarterOf} from '../core/calendar.ts'
import './today-daily-choice.css'

/** The original preview supplies this decision's actual cash/AP, including a
 * zero-point return to an existing quarter. A refused preview is not a quote. */
export function TodayWorkChoice({p,onWork}:{p:GamePanelProps;onWork:(id:string|null)=>void}){
 const w=p.features.workbench,rows=w.employment,period=rows.length===1?rows[0]:null,original=period?p.view.operations?.employment.filter(row=>row.id===period.id):null
 const known=w.quarter===quarterOf(p.view.date)&&rows.length<=1&&p.view.operations!==null&&p.view.operations!==undefined&&(!period||period.quarter===w.quarter&&original?.length===1&&JSON.stringify(original[0])===JSON.stringify(period))
 const active=known&&period&&period.limit>p.view.date?period.segments.find(segment=>segment.to===null):null
 const salary=w.employmentMonthlySalaryFen,salaryLine=salary!==null&&Number.isSafeInteger(salary)&&salary>=0?'月薪基准'+moneyText(salary)+'；月末按实际在岗日结算，尚未预发。':'月薪基准暂待核对；工资按实际在岗日和原日历结算。'
 const read=makeSharedAction(p,active?'回到这份原工作':'翻阅原工作条件',()=>onWork(period?.id??null),{allowReadOnly:true})
 const card=(terms:ReactNode,action:ReactNode)=><article className="today-life-option today-work-option" data-kind="work">
  <div className="today-life-heading"><span className="today-life-number" aria-hidden="true">01</span><h3>{active?'工作已经留好':period?'继续本季工作':'留一份工作'}</h3><svg className="today-life-sketch" viewBox="0 0 80 72" fill="none" aria-hidden="true" focusable="false"><path className="life-sketch-paper" d="m13 25 53-2 1 35-54 3z"/><path className="life-sketch-line" d="m30 24 1-9 18-1 2 10M14 36l53-2M37 34l9-1 1 9-10 1z"/></svg></div>
  {terms}<p className="today-life-date">{active?'当前在岗始于 '+active.from:'本季日历至 '+w.quarterEnd}</p><p className="today-life-effect">{salaryLine}</p>{action}
 </article>
 if(!known)return card(<p className="today-life-terms"><strong>先核原记录</strong></p>,<button type="button" className="today-work-reading" disabled={read.disabled} onClick={read.activate}>{read.label} ↗</button>)
 if(active)return card(<p className="today-life-terms"><strong>已在岗</strong><span>原安排继续</span></p>,<button type="button" className="today-work-reading" disabled={read.disabled} onClick={read.activate}>{read.label} ↗</button>)
 return <CommandButton {...p} kind="WorkQuarter" payload={{}} label="核对并安排本季工作" confirm primary renderAction={(_binding,node,{preview})=>card(preview.allowed?<p className="today-life-terms"><strong>{moneyText(preview.upfrontCostFen)}</strong><span>{preview.actionPoints}点 · 本次投入</span></p>:<p className="today-life-terms today-work-unavailable"><strong>先看原条件</strong></p>,node)}>{period?'继续这季的工作':'留好这季的工作'} <span aria-hidden="true">→</span></CommandButton>
}
