import {useEffect,useState} from 'react'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import {makeSharedAction} from './shared-action.ts'
import {Dialog} from './Dialog.tsx'
import type {WorkWaitItem,WorkWaitReading} from './work-wait-reading.ts'
import './work-wait-cue.css'

type Props={p:GamePanelProps;value:WorkWaitReading;onNavigate:NavigateScene}
export function WorkWaitCue({p,value:v,onNavigate}:Props){
 const [reading,setReading]=useState<{key:string;page:number}|null>(null)
 useEffect(()=>{setReading(null)},[v.key])
 const pages=Math.max(1,Math.ceil(v.items.length/3)),page=reading?.key===v.key?Math.min(reading.page,pages-1):0
 const ui=(label:string,activate:()=>void)=>makeSharedAction(p,label,activate,{allowReadOnly:true,canActivate:()=>v.runId===p.view.runId&&v.revision===p.view.revision})
 const item=(row:WorkWaitItem,full=false)=>{const when=row.date===v.today?'本日待反馈':'预计',binding=ui('翻阅'+row.title+' · '+when+row.date,()=>{setReading(null);onNavigate(row.screen,row.target)})
  return <button type="button" className="work-wait-note" key={row.key} aria-label={binding.label} disabled={binding.disabled} onClick={binding.activate}><span>{full?row.title:row.label}<i aria-hidden="true">↗</i></span><time dateTime={row.date}>{when} {row.date}</time></button>
 }
 const more=ui('翻看全部'+v.items.length+'项原预计日期',()=>setReading({key:v.key,page:0}))
 return <section className="work-wait-cue" aria-label="在岗期间，原安排的预计反馈日期">
  <div className="work-wait-dates" style={{gridTemplateColumns:'repeat('+Math.min(v.items.length,3)+', minmax(0,1fr))'}}>{v.items.slice(0,3).map(row=>item(row))}</div>
  {v.items.length>3?<button type="button" className="work-wait-more" disabled={more.disabled} onClick={more.activate}>还有{v.items.length-3}项原日期 ↗</button>:null}
  {reading?.key===v.key?<Dialog title="已安排的日子" layout="direct" className="opening-paper work-wait-reading-dialog" onClose={()=>setReading(null)} footer={<div className="work-wait-pages"><button type="button" disabled={page===0} onClick={()=>setReading({key:v.key,page:page-1})}>上一组日期</button><span>{page+1} / {pages}</span><button type="button" disabled={page+1>=pages} onClick={()=>setReading({key:v.key,page:page+1})}>下一组日期</button><button type="button" onClick={()=>setReading(null)}>回到原来的安排</button></div>}><p>这些是原安排的预计反馈。费用、来信或原责任仍可能先让日历停下。</p><div className="work-wait-records">{v.items.slice(page*3,page*3+3).map(row=>item(row,true))}</div></Dialog>:null}
 </section>
}
