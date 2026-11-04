import {isoDate,quarterOf} from '../core/calendar.ts'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {moneyText} from './game-text.ts'

export interface WorkHistoryCopy {readonly object:string;readonly title:string;readonly stage:string;readonly line:string;readonly next:string}
const validDate=(value:string)=>{try{return isoDate(value)===value}catch{return false}}

/** Ordinary old wages get a short reading layer. The original thread still
 * owns the full record, every action and the current day's separate feedback. */
export function workHistoryCopy(p:Pick<GamePanelProps,'view'|'features'>,thread:PlayerThreadView):WorkHistoryCopy|null {
 const {view,features}=p,w=features.workbench
 if(thread.focus.kind!=='work'||thread.focus.runId!==view.runId||thread.focus.accountId!=='personal'||thread.focusStatus==='invalid'||thread.focusScope!=='history'||thread.responsibilityOverrideNeeded||thread.legacyFallbackRequired||!validDate(view.date))return null
 const periods=view.operations?.employment.filter(e=>e.id===thread.focus.entityId)??[]
 if(periods.length!==1)return null
 const period=periods[0]!
 if(!/^202[0-5]-Q[1-4]$/.test(period.quarter)||period.quarter!==thread.focusQuarter||period.quarter>=w.quarter||quarterOf(view.date)!==w.quarter||!validDate(period.limit)||period.limit>view.date||!period.segments.length||period.segments.some(s=>!validDate(s.from)||s.to!==null&&(!validDate(s.to)||s.to<s.from)))return null
 const rows=view.operations!.payroll.filter(row=>row.kind==='salary'&&row.entityId===period.id)
 if(new Set(rows.map(row=>row.id)).size!==rows.length||rows.some(row=>!validDate(row.through)||row.through>view.date||quarterOf(row.through)!==period.quarter||!Number.isSafeInteger(row.amountFen)||row.amountFen<0||row.amountFen>0&&!row.operationId))return null
 const paid=rows.filter(row=>row.amountFen>0).sort((a,b)=>b.through.localeCompare(a.through)||b.id.localeCompare(a.id)),total=paid.reduce((sum,row)=>sum+row.amountFen,0),latest=paid[0]
 if(!Number.isSafeInteger(total))return null
 return {object:period.quarter+' · 工作手记',title:'这段工作的日子，已经收好。',stage:'历史回看 · 原书签保留',line:latest?`工资实收合计${moneyText(total)}。最近一笔：${latest.through} · ${moneyText(latest.amountFen)}。`:'这段工作尚无工资实收记录；原在岗日期与已用行动仍保留。',next:'旧工资不计入本季收入；回到今天，查看当前安排。'}
}
