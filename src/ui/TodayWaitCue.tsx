import type {GamePanelProps} from './game-types.ts'
import type {OpeningFocus} from './player-thread.ts'
import type {TodayWaitReading} from './today-wait-reading.ts'
import {makeSharedAction} from './shared-action.ts'
import './work-wait-cue.css'
import './today-wait-cue.css'

export function TodayWaitCue({p,value:v,onChoose,onAll}:{p:GamePanelProps;value:TodayWaitReading;onChoose:(focus:OpeningFocus)=>void;onAll:()=>void}){
 const ui=(label:string,activate:()=>void)=>makeSharedAction(p,label,activate,{allowReadOnly:true,canActivate:()=>v.runId===p.view.runId&&v.revision===p.view.revision})
 const more=ui('翻看全部'+v.items.length+'项原安排',onAll)
 return <section className="work-wait-cue today-wait-cue" aria-label="个人原安排的预计反馈日期"><p className="today-wait-caption">原预计日期 · 费用、来信可能先到</p><div className="work-wait-dates" style={{gridTemplateColumns:'repeat('+Math.min(v.items.length,3)+', minmax(0,1fr))'}}>{v.items.slice(0,3).map(row=>{
  const when=row.date===v.today?'本日待反馈':'预计',binding=ui('回到'+row.title+' · '+when+row.date,()=>onChoose(row.focus))
  return <button type="button" key={row.key} className="work-wait-note" aria-label={binding.label} disabled={binding.disabled} onClick={binding.activate}><span>{row.label}<i aria-hidden="true">↗</i></span><time dateTime={row.date}>{when} {row.date}</time></button>
 })}</div>{v.items.length>3?<button type="button" className="work-wait-more" disabled={more.disabled} onClick={more.activate}>还有{v.items.length-3}项原安排 ↗</button>:null}</section>
}
