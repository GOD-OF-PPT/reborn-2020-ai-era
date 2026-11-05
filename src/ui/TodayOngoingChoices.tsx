import {useState} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {OpeningFocus} from './player-thread.ts'
import type {TodayChoiceBoard} from './today-choice-board.ts'
import {makeSharedAction} from './shared-action.ts'
import {PersonPortrait} from './PersonPortrait.tsx'
import './today-ongoing-choices.css'

export function TodayOngoingChoices({p,value:v,onChoose,onFull}:{p:GamePanelProps;value:TodayChoiceBoard;onChoose:(focus:OpeningFocus)=>void;onFull:()=>void}){
 const [page,setPage]=useState(0),pages=Math.ceil(v.items.length/3),current=Math.min(page,Math.max(0,pages-1)),items=v.items.slice(current*3,current*3+3)
 const ui=(label:string,activate:()=>void)=>makeSharedAction(p,label,activate,{allowReadOnly:true,canActivate:()=>v.runId===p.view.runId&&v.revision===p.view.revision})
 const previous=ui('上一组原安排',()=>setPage(current-1)),next=ui('下一组原安排',()=>setPage(current+1)),full=ui('逐条翻阅完整原说明',onFull)
 return <section className="ongoing-choice-sheet"><p className="ongoing-choice-context"><span>{v.date} · {v.quarter}</span><span>先回到一件正在发生的事。</span></p><div className="ongoing-choice-cards" style={{gridTemplateColumns:'repeat('+items.length+', minmax(0,1fr))'}}>{items.map((item,index)=>{
  const action=ui('回到'+item.label+' · '+item.date+'原预计反馈',()=>onChoose(item.focus))
  return <article key={item.key} className="ongoing-choice-card" data-kind={item.kind}><header><span className="ongoing-choice-number" aria-hidden="true">{String(current*3+index+1).padStart(2,'0')}</span><h3>{item.label}</h3>{p.textOnly?null:item.personId&&item.personName?<PersonPortrait personId={item.personId} name={item.personName} revealed/>:<svg className="ongoing-choice-sketch" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">{item.kind==='work'?<><path className="choice-paper" d="m9 22 46-2 1 32-47 3z"/><path className="choice-ink" d="m24 21 1-10 15-1 2 11M10 32l45-2m-27 0 9-1 1 8-10 1z"/></>:item.kind==='workspace'?<><path className="choice-light" d="m31 28-16 24h39L39 28"/><path className="choice-paper" d="m25 15 12-7 12 18-26 6z"/><path className="choice-ink" d="M10 56h47M39 29l8 24m-9 3h16"/></>:<><path className="choice-paper" d="m8 17 23-5 25 8-4 34-24-6-23 3z"/><path className="choice-ink" d="m31 12-3 36M14 27l10-2m-11 10 10-2m15-9 10 3m-11 6 10 3"/>{item.kind==='research'?<><circle className="choice-glass" cx="43" cy="42" r="10"/><path className="choice-ink" d="m50 50 8 9"/></>:<path className="choice-thread" d="m42 16-5 40 6-4 5 6 3-40"/>}</>}</svg>}</header>
   <p className="ongoing-choice-source">{item.originQuarter&&item.originQuarter!==v.quarter?'来自'+item.originQuarter:'本季原安排'}<span className="ongoing-choice-stage">{item.stage}</span></p>
   <div className="ongoing-choice-facts">{item.lines.map((line,i)=><p key={i}>{line}</p>)}</div><p className="ongoing-choice-date"><span>原预计反馈</span><time dateTime={item.date}>{item.date}</time></p>
   <button type="button" className="ongoing-choice-return" aria-label={action.label} disabled={action.disabled} onClick={action.activate}>回到这件事 <span aria-hidden="true">↗</span></button>
  </article>
 })}</div><div className="ongoing-choice-reading"><button type="button" disabled={full.disabled} onClick={full.activate}>{full.label} ↗</button>{pages>1?<nav aria-label="原安排显式分页"><button type="button" disabled={current===0||previous.disabled} onClick={previous.activate}>上一组</button><span>{current+1} / {pages}</span><button type="button" disabled={current+1>=pages||next.disabled} onClick={next.activate}>下一组</button></nav>:null}</div></section>
}
