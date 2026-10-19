import type {PlayingView} from './game-types.ts'
import {Dialog} from './Dialog.tsx'
import {moneyText} from './game-text.ts'
import {useState} from 'react'

export type EchoFrame={dateBefore:string;dateAfter:string;pointsBefore:number;pointsAfter:number;quarterChanged:boolean;accounts:{id:string;before:number|null;after:number}[]}

/** A cross-run or uncommitted snapshot cannot produce a success reel. */
export function committedEcho(previous:PlayingView|null,current:PlayingView):EchoFrame|null{
 if(!previous||previous.runId!==current.runId||current.saveStatus!=='saved'||current.hasCandidate||current.revision<=previous.revision)return null
 return {dateBefore:previous.date,dateAfter:current.date,pointsBefore:previous.budget.available,pointsAfter:current.budget.available,quarterChanged:previous.date.slice(0,4)!==current.date.slice(0,4)||Math.floor((Number(previous.date.slice(5,7))-1)/3)!==Math.floor((Number(current.date.slice(5,7))-1)/3),accounts:current.accounts.filter(a=>a.accountId==='personal'||previous.accounts.find(b=>b.accountId===a.accountId)?.availableFen!==a.availableFen).map(a=>({id:a.accountId,before:previous.accounts.find(b=>b.accountId===a.accountId)?.availableFen??null,after:a.availableFen}))}
}

export function SceneEcho({text,frame,onClose,accountName}:{text:string;frame:EchoFrame|null;onClose:()=>void;accountName:(id:string)=>string}){
 return <Dialog title="这一幕，已经记下" onClose={onClose} className="scene-echo" footer={<div className="echo-continue"><button type="button" className="primary" onClick={onClose}>继续选择 →</button></div>}><section className="echo-letter" role="status"><p className="scene-overline">一段真实发生的回响 / 已保存</p><h3>这一笔，已经记下。</h3><p className="echo-result">{text}</p>{frame?<><dl className="echo-facts"><div><dt>日历翻到</dt><dd>{frame.dateBefore===frame.dateAfter?frame.dateAfter:frame.dateBefore+' → '+frame.dateAfter}</dd></div><div><dt>{frame.quarterChanged?'新季度可用行动':'可用行动'}</dt><dd>{frame.pointsBefore} → {frame.pointsAfter} 点</dd></div>{frame.accounts.map(a=><div key={a.id}><dt>{accountName(a.id)} · 可花</dt><dd>{a.before===null?'新账户':moneyText(a.before)} → {moneyText(a.after)}</dd></div>)}</dl>{frame.quarterChanged?<small>新季度仍按原四点规则；旧义务继续保留。</small>:null}</>:null}<p className="echo-footnote">开始、完成、客户验收和实际到账，仍按原日期分别发生。余下的选择，交还给你。</p></section></Dialog>
}

/** Ordinary time keeps the scene open. The exact saved reel remains available on demand. */
export function SceneTimeNotice({date,text,frame,onClose,accountName}:{date:string;text:string;frame:EchoFrame|null;onClose:()=>void;accountName:(id:string)=>string}){
 const [open,setOpen]=useState(false)
 return <span className="scene-time-note" role="status"><time dateTime={date}>{date}</time><span>原安排，已经记下。</span><button type="button" onClick={()=>setOpen(true)}>查看回响 ↗</button><button type="button" aria-label="收起这次时间回响" onClick={onClose}>收好</button>{open?<SceneEcho text={text} frame={frame} accountName={accountName} onClose={()=>setOpen(false)}/>:null}</span>
}
