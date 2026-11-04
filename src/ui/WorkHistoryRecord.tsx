import {useState} from 'react'
import {Dialog} from './Dialog.tsx'
import {moneyText} from './game-text.ts'
import type {WorkHistoryReading} from './work-history-copy.ts'
import './work-history-record.css'

type Props={value:WorkHistoryReading;onClose:()=>void;onToday:()=>void;onExplanation:()=>void}
export function WorkHistoryRecord({value:v,onClose,onToday,onExplanation}:Props){
 const [pages,setPages]=useState({key:v.key,segments:0,wages:0})
 const counts={segments:Math.max(1,Math.ceil(v.segments.length/3)),wages:Math.max(1,Math.ceil(v.wages.length/3))}
 const current={segments:pages.key===v.key?Math.min(pages.segments,counts.segments-1):0,wages:pages.key===v.key?Math.min(pages.wages,counts.wages-1):0}
 const pager=(kind:'segments'|'wages',name:string)=>counts[kind]>1?<nav className="work-record-pages" aria-label={name+'分页'}><button type="button" disabled={current[kind]===0} onClick={()=>setPages({key:v.key,...current,[kind]:current[kind]-1})}>上一组{name}</button><span>{current[kind]+1} / {counts[kind]}</span><button type="button" disabled={current[kind]+1>=counts[kind]} onClick={()=>setPages({key:v.key,...current,[kind]:current[kind]+1})}>下一组{name}</button></nav>:null
 return <Dialog title={v.quarter+' · 工作手记'} layout="direct" className="opening-paper work-history-record" onClose={onClose} footer={<div className="work-record-actions"><button type="button" className="scene-text-action" onClick={onExplanation}>查看完整说明与原册 ↗</button><button type="button" onClick={onClose}>合上手记</button><button type="button" className="primary" onClick={onToday}>回到今天 →</button></div>}>
  <p className="work-record-today">今天 {v.today} · 这里只回看{v.quarter}，不新增{v.currentQuarter}安排。</p>
  <div className="work-record-columns">
   <section aria-label="原工作日期"><h3>那时工作的日子</h3><p>原安排边界 · {v.limit}</p><ol>{v.segments.slice(current.segments*3,current.segments*3+3).map((row,index)=><li key={current.segments*3+index}><span>{row.from}</span><span>{row.to?'— '+row.to:'至原安排边界'}</span></li>)}</ol>{pager('segments','在岗片段')}</section>
   <section aria-label="原工作全部工资"><h3>实际收到的工资 <strong>{moneyText(v.totalFen)}</strong></h3>{v.wages.length?<ol>{v.wages.slice(current.wages*3,current.wages*3+3).map(row=><li key={row.id}><span>{row.date}</span><strong>{moneyText(row.amountFen)}</strong></li>)}</ol>:<p>截至今天没有这份原工作的工资记录。</p>}{pager('wages','工资')}</section>
  </div>
  <p className="work-record-note">旧工资与已用行动仍保留；查看不会重新发薪或恢复行动。</p>
 </Dialog>
}
