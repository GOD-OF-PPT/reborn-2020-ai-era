import {useState} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {Dialog} from './Dialog.tsx'
import './market-order-terms.css'

export type MarketExpiryEntry=GamePanelProps['features']['market']['matchingCalendar'][number]
export function marketExpiryMonths(calendar:readonly MarketExpiryEntry[]){
 const groups=new Map<string,MarketExpiryEntry[]>()
 for(const entry of calendar){const month=entry.date.slice(0,7),items=groups.get(month)??[];items.push(entry);groups.set(month,items)}
 return [...groups].map(([month,entries])=>({month,entries}))
}
export function marketExpiryLabel(calendar:readonly MarketExpiryEntry[],id:string):string{
 return calendar.find(entry=>entry.id===id)?.date??(id?'原到期日已不可选，请重选':'请选择到期日期')
}

type CalendarProps={calendar:readonly MarketExpiryEntry[];selectedId:string;month:string;onMonth:(month:string)=>void;onSelect:(id:string)=>void}
/** Browsing months and selecting an original checkpoint are separate UI actions. */
export function MarketExpiryCalendar({calendar,selectedId,month,onMonth,onSelect}:CalendarProps){
 const groups=marketExpiryMonths(calendar),current=groups.find(group=>group.month===month)??groups[0],years=[...new Set(groups.map(group=>group.month.slice(0,4)))],year=current?.month.slice(0,4)??''
 return <div className="market-expiry-calendar">
  <p className="order-help">翻年月只浏览；点一个撮合日才会写入草稿，不推进日历。</p>
  {current?<>
   <label className="expiry-year">查看年份<select aria-label="查看年份" value={year} onChange={event=>{const first=groups.find(group=>group.month.startsWith(event.target.value+'-'));if(first)onMonth(first.month)}}>{years.map(value=><option key={value} value={value}>{value}年</option>)}</select><strong>{year}年{Number(current.month.slice(5))}月</strong></label>
   <nav className="expiry-months" aria-label="查看月份">{Array.from({length:12},(_,i)=>{const key=year+'-'+String(i+1).padStart(2,'0'),available=groups.some(group=>group.month===key);return <button key={key} type="button" aria-label={'查看'+year+'年'+(i+1)+'月'} disabled={!available} aria-pressed={current.month===key} onClick={()=>onMonth(key)}>{i+1}月</button>})}</nav>
   <div className="expiry-days" aria-label="选择委托到期撮合日">{current.entries.map(entry=><button key={entry.id} type="button" aria-label={'选择到期日 · '+entry.date} aria-pressed={entry.id===selectedId} onClick={()=>onSelect(entry.id)}><small>到期撮合日</small><strong>{entry.date}</strong>{entry.id===selectedId?<span>已选</span>:<span>选择这一天</span>}</button>)}</div>
  </>:<p>当前没有可选的后续撮合日，不能设定新的委托期限。</p>}
  <p className="expiry-current" role="status">{selectedId?'原选择：'+marketExpiryLabel(calendar,selectedId):'尚未选择到期日。'}</p>
 </div>
}

export function MarketExpiryPicker({calendar,selectedId,onSelect,onClose}:{calendar:readonly MarketExpiryEntry[];selectedId:string;onSelect:(id:string)=>void;onClose:()=>void}){
 const [month,setMonth]=useState(()=>calendar.find(entry=>entry.id===selectedId)?.date.slice(0,7)??calendar[0]?.date.slice(0,7)??'')
 return <Dialog title="这份委托，留到哪一天？" layout="direct" className="market-expiry-dialog" onClose={onClose} footer={<div className="expiry-footer"><button type="button" onClick={onClose}>先不改日期</button></div>}>
  <MarketExpiryCalendar calendar={calendar} selectedId={selectedId} month={month} onMonth={setMonth} onSelect={id=>{if(calendar.some(entry=>entry.id===id)){onSelect(id);onClose()}}}/>
 </Dialog>
}
