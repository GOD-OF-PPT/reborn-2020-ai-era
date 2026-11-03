import {useState} from 'react'
import type {TodayThreadItem} from './today-thread.ts'
import type {OpeningFocus} from './player-thread.ts'

/** One complete original position at a time; browsing never makes a trade. */
export function TodayHoldings({items,onChoose}:{items:readonly TodayThreadItem[];onChoose:(focus:OpeningFocus)=>void}){
 const key=(item:TodayThreadItem)=>JSON.stringify(item.focus)
 const [selected,setSelected]=useState(()=>items[0]?key(items[0]):null)
 const index=items.findIndex(item=>key(item)===selected),item=index<0?null:items[index]!
 return <section className="today-held-page">
  <p className="today-held-intro">股份留在原账户，也可以照常安排生活。</p>
  {item?<article><p className="opening-paper-date">{item.originQuarter?'来源 '+item.originQuarter:'原持仓'}</p><h3>{item.title}</h3><p className="today-held-facts">{item.line}</p><button type="button" className="primary" onClick={()=>onChoose(item.focus)}>查看这份持仓</button></article>:<p>{items.length?'刚才的持仓已变化，请明确重新选择。':'这里没有可翻阅的持仓。'}</p>}
  {!item&&items.length?<button type="button" onClick={()=>setSelected(key(items[0]!))}>从当前第一份开始翻阅</button>:null}
  {items.length>1?<nav className="today-held-pages" aria-label="逐份翻阅原持仓"><button type="button" disabled={index<=0} onClick={()=>{if(index>0)setSelected(key(items[index-1]!))}}>← 上一份</button><span>{index<0?'未选择':index+1} / {items.length}</span><button type="button" disabled={index<0||index>=items.length-1} onClick={()=>{if(index>=0&&index<items.length-1)setSelected(key(items[index+1]!))}}>下一份 →</button></nav>:null}
 </section>
}
