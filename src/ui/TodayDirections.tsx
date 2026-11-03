import type {ReactNode} from 'react'
import './today-directions.css'

export type TodayDirectionKey='work'|'life'|'video'|'course'|'relay'|'ecosystem'|'equity'|'market'
const groups=[
 {id:'daily',title:'把日子过稳',keys:['work','life']},
 {id:'making',title:'做点自己的事',keys:['video','course','relay']},
 {id:'possibilities',title:'看看新的可能',keys:['ecosystem','equity','market']},
] as const

/** The parent supplies every original guarded button. This sheet only groups
 * their reading order and never creates commands or decides eligibility. */
export function TodayDirections({date,quarter,existing,choices}:{date:string;quarter:string;existing:ReactNode;choices:Readonly<Record<TodayDirectionKey,ReactNode>>}){
 return <section className="today-directions-sheet">
  <p className="today-directions-context"><span>{date} · {quarter}</span><span>先看条件，再决定投入。</span></p>
  {existing?<div className="today-directions-existing">{existing}</div>:null}
  <div className="today-directions-groups">{groups.map(group=><section className="today-direction-group" key={group.id} data-group={group.id}>
   <header><svg className="today-directions-sketch" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    {group.id==='daily'?<><path className="direction-paper" d="m12 12 42 5-5 39-42-5z"/><path className="direction-ink" d="m19 8-2 15m27-12-2 15M14 28l33 4m-35 9 33 4m-22-18-3 23m15-21-3 23"/></>:group.id==='making'?<><path className="direction-paper" d="m8 18 23-5 25 8-4 33-24-6-23 3z"/><path className="direction-ink" d="m31 13-3 35M14 28l10-2m-11 10 10-2m15-8 10 3m-11 6 10 3"/><path className="direction-pencil" d="m41 44 12-29 5 2-12 29-7 6z"/></>:<><circle className="direction-paper" cx="32" cy="32" r="23"/><path className="direction-ink" d="M32 9v7m0 32v7M9 32h7m32 0h7"/><path className="direction-pencil" d="m40 20-4 17-16 7 8-17z"/><circle className="direction-pin" cx="32" cy="32" r="3"/></>}
   </svg><h3>{group.title}</h3></header>
   <div className="today-direction-entries">{group.keys.map(key=><div className="today-direction-entry" data-direction={key} key={key}>{choices[key]}</div>)}</div>
  </section>)}</div>
 </section>
}
