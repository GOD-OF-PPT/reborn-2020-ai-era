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
 if(active){
  const budget=p.view.budget,known=budget.total===4&&budget.quarter===p.features.workbench.quarter&&[budget.available,budget.spent,budget.reserved].every(n=>Number.isSafeInteger(n)&&n>=0)&&budget.available+budget.spent+budget.reserved===4
  const full=known&&budget.available===0,paidToday=latest?.through===p.view.date
  const title=paidToday?'工资到了，工作还在继续。':!known?'这季的工作，仍在继续。':full?budget.reserved>0?'这季的行动已排满，工作照常继续。':'这季的四点已用完，工作照常继续。':latest?'工作照常，接下来怎样安排？':'工作之外，想做点什么？'
  const fact=wage?(paidToday?'':'最近一笔：')+wage:'工资按在岗日结算，尚未到账。'
  return {title,stage:'在岗 · 按月结薪',line:fact+(full?'仍可翻阅生活，或等下一次回响。':!latest&&known&&budget.available>0?'生活与副业仍可安排。':'')}
 }
 return {title:'这段工作，先告一段落。',stage:'已停止 · 记录保留',line:(wage??'这段工作尚无工资实收。')+'已用行动不返还，后续工作另行决定。'}
}
