import {isoDate} from '../core/calendar.ts'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {moneyText} from './game-text.ts'

export interface WorkRoomCopy {readonly title:string;readonly stage:string;readonly line:string}
const validDate=(value:string)=>{try{return isoDate(value)===value}catch{return false}}

/** A shorter first layer for the current, uniquely identified employment.
 * The original thread remains the full reading record and owns every action. */
export function workRoomCopy(p:Pick<GamePanelProps,'view'|'features'>,thread:PlayerThreadView):WorkRoomCopy|null {
 if(thread.focus.kind!=='work'||thread.focus.runId!==p.view.runId||thread.focus.accountId!=='personal'||thread.focusStatus==='invalid'||thread.focusScope!=='current'||thread.responsibilityOverrideNeeded||thread.legacyFallbackRequired||p.features.workbench.atQuarterEnd)return null
 const periods=p.view.operations?.employment.filter(e=>e.id===thread.focus.entityId)??[]
 if(periods.length!==1||periods[0]!.quarter!==p.features.workbench.quarter||!validDate(p.view.date))return null
 const period=periods[0]!,open=period.segments.filter(s=>s.to===null)
 if(open.length>1||!period.segments.length||period.segments.some(s=>!validDate(s.from)||s.to!==null&&!validDate(s.to)))return null
 const rows=p.view.operations!.payroll.filter(r=>r.kind==='salary'&&r.entityId===period.id)
 if(new Set(rows.map(r=>r.id)).size!==rows.length||rows.some(r=>!validDate(r.through)||r.through>p.view.date||!Number.isSafeInteger(r.amountFen)||r.amountFen<0||r.amountFen>0&&r.operationId===null))return null
 const paid=rows.filter(r=>r.amountFen>0).sort((a,b)=>b.through.localeCompare(a.through)||b.id.localeCompare(a.id))
 const total=paid.reduce((sum,row)=>sum+row.amountFen,0)
 if(!Number.isSafeInteger(total))return null
 const scheduled=open[0],planned=scheduled!==undefined&&scheduled.from>p.view.date,active=scheduled!==undefined&&!planned,latest=paid[0]
 const wage=latest?`${latest.through}工资实收${moneyText(latest.amountFen)}${paid.length>1?' · 本季累计'+moneyText(total):''}。`:null
 if(planned)return {title:'接下来的工作，已经留好。',stage:'已安排 · 等待开工',line:`${scheduled.from}开始。${wage??'工资按实际在岗日结算。'}`}
 if(active)return {title:latest?'工资到了，工作还在继续。':'工作之外，想做点什么？',stage:'在岗 · 按月结薪',line:wage??'工资按在岗日结算，尚未到账。生活与副业仍可安排。'}
 return {title:'这段工作，先告一段落。',stage:'已停止 · 记录保留',line:(wage??'这段工作尚无工资实收。')+'已用行动不返还，后续工作另行决定。'}
}
