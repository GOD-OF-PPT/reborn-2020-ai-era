import {useState,type ReactNode} from 'react'
import type {GamePanelProps,SceneTarget} from './game-types.ts'
import {quarterOf} from '../core/calendar.ts'
import {TodayLifeChoices} from './TodayLifeChoices.tsx'
import {TodayWorkChoice} from './TodayWorkChoice.tsx'
import './calendar-entry.css'

/** A quiet personal day may use the direct comparison. Responsibilities retain their original front path. */
export function calendarEntryAvailable(p:GamePanelProps){
 const w=p.features.workbench
 try{quarterOf(p.view.date)}catch{return false}
 return p.view.phase==='playing'&&p.accountId==='personal'&&w.quarter===quarterOf(p.view.date)&&p.view.budget.quarter===w.quarter&&!w.atQuarterEnd&&w.pause===null&&!w.progression.requiresDelivery&&!w.events.some(e=>e.presentation!=='ordinary'||e.isBlocking)&&!w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date))
}

/** Reuses the same original decisions as Today; a reading carries its exact original employment identity. */
export function CalendarChoices({p,firstChoice,firstReceipt,onOpen}:{p:GamePanelProps;firstChoice:ReactNode;firstReceipt:ReactNode;onOpen:(target?:SceneTarget)=>void}){
 const key=JSON.stringify([p.view.runId,p.accountId,p.features.workbench.quarter]),first=p.features.firstOrder,initial=()=>firstReceipt||['planned','running','awaiting_submission','review','delivered'].includes(String(first.status))?'order' as const:'daily' as const
 const [stored,setStored]=useState({key,mode:initial()}),mode=stored.key===key?stored.mode:initial(),hasOrder=!!firstChoice||!!firstReceipt
 return <section className="calendar-choices" aria-label="今天的实际安排">
  {hasOrder?<nav className="calendar-entry-tabs" aria-label="先看哪一份日子"><button type="button" aria-pressed={mode==='daily'} onClick={()=>setStored({key,mode:'daily'})}>今天的工作与生活</button><button type="button" aria-pressed={mode==='order'} onClick={()=>setStored({key,mode:'order'})}>{firstReceipt?'小单的实际回款':'原来这一笔小单'}{!firstReceipt&&['planned','running','awaiting_submission'].includes(String(first.status))&&first.dates.submitBy?' · '+first.dates.submitBy+'前交付':''}</button></nav>:null}
  {mode==='daily'?<div className="calendar-entry-comparison"><TodayLifeChoices p={p} work={<TodayWorkChoice p={p} onWork={id=>onOpen({accountId:'personal',...(id===null?{}:{recordId:id})})}/>}/></div>:<div className="calendar-first-order">{hasOrder?<>{firstReceipt}{firstChoice}{firstReceipt&&!firstChoice?<button type="button" className="calendar-entry-return" onClick={()=>setStored({key,mode:'daily'})}>看看今天的工作与生活 →</button>:null}</>:<><p role="status">这份小单的状态已经变化，先翻原记录核对。</p><button type="button" onClick={()=>onOpen({accountId:'personal'})}>翻原日历与小单记录</button><button type="button" onClick={()=>setStored({key,mode:'daily'})}>回到今天的工作与生活</button></>}</div>}

 </section>
}
