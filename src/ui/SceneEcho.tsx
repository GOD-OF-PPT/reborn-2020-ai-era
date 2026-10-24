import type {PlayingView} from './game-types.ts'
import {Dialog} from './Dialog.tsx'
import {moneyText} from './game-text.ts'
import {useState} from 'react'

export type EchoFrame={dateBefore:string;dateAfter:string;pointsBefore:number;pointsAfter:number;reservedBefore:number;reservedAfter:number;spentBefore:number;spentAfter:number;quarterChanged:boolean;accounts:{id:string;before:number|null;after:number}[]}

/** A cross-run or uncommitted snapshot cannot produce a success reel. */
export function committedEcho(previous:PlayingView|null,current:PlayingView):EchoFrame|null{
 if(!previous||previous.runId!==current.runId||current.saveStatus!=='saved'||current.hasCandidate||current.revision<=previous.revision)return null
 return {dateBefore:previous.date,dateAfter:current.date,pointsBefore:previous.budget.available,pointsAfter:current.budget.available,reservedBefore:previous.budget.reserved,reservedAfter:current.budget.reserved,spentBefore:previous.budget.spent,spentAfter:current.budget.spent,quarterChanged:previous.budget.quarter!==current.budget.quarter,accounts:current.accounts.filter(a=>a.accountId==='personal'||previous.accounts.find(b=>b.accountId===a.accountId)?.availableFen!==a.availableFen).map(a=>({id:a.accountId,before:previous.accounts.find(b=>b.accountId===a.accountId)?.availableFen??null,after:a.availableFen}))}
}

const pointChange=(before:number,after:number)=>before===after?`${after} 点 · 未变`:`${before} → ${after} 点`

export function SceneEcho({text,frame,onClose,accountName}:{text:string;frame:EchoFrame|null;onClose:()=>void;accountName:(id:string)=>string}){
 return <Dialog title="这一幕，已经记下" onClose={onClose} className="scene-echo" footer={<div className="echo-continue"><button type="button" className="primary" onClick={onClose}>继续选择 →</button></div>}><section className="echo-letter" role="status"><p className="scene-overline">这一幕的回响 / 已保存</p><h3>这一步，已经记下。</h3><p className="echo-result">{text}</p>{frame?<><dl className="echo-facts"><div><dt>日历翻到</dt><dd>{frame.dateBefore===frame.dateAfter?frame.dateAfter:frame.dateBefore+' → '+frame.dateAfter}</dd></div><div><dt>{frame.quarterChanged?'新季度可用行动':'可用行动'}</dt><dd>{pointChange(frame.pointsBefore,frame.pointsAfter)}</dd></div><div><dt>{frame.quarterChanged?'新季度预留行动':'预留行动'}</dt><dd>{pointChange(frame.reservedBefore,frame.reservedAfter)}</dd></div><div><dt>{frame.quarterChanged?'新季度已用行动':'已用行动'}</dt><dd>{pointChange(frame.spentBefore,frame.spentAfter)}</dd></div>{frame.accounts.map(a=><div key={a.id}><dt>{accountName(a.id)} · 可花</dt><dd>{a.before===a.after?moneyText(a.after)+' · 未变':(a.before===null?'新账户':moneyText(a.before))+' → '+moneyText(a.after)}</dd></div>)}</dl>{frame.quarterChanged?<small>新季度有四点时间；未完成的约定仍留在日历里。</small>:frame.reservedAfter>frame.reservedBefore?<small>这段时间先为安排留好，尚未开工的预留还没有算作已用行动。</small>:null}</>:null}</section></Dialog>
}

/** The scene already owns today's date. Other dates and the complete result stay intact. */
export function sceneTimeNarrative(date:string,text:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return text
 const prefix=[date+'，',date+'。'].find(value=>text.startsWith(value))
 return prefix&&text.length>prefix.length?text.slice(prefix.length):text
}

/** The actual saved result stays in the scene; the same complete reel opens on demand. */
export function SceneTimeNotice({date,text,frame,onClose,accountName,compact=false,brief}:{date:string;text:string;frame:EchoFrame|null;onClose:()=>void;accountName:(id:string)=>string;compact?:boolean;brief?:string}){
 const [open,setOpen]=useState(false)
 const narrative=sceneTimeNarrative(date,text),summary=compact&&brief?brief:compact&&narrative.includes('。')?narrative.slice(0,narrative.indexOf('。')+1):narrative
 return <span className="scene-time-note" role="status">{!compact?<time dateTime={date}>{date}</time>:null}<span className="scene-time-result">{summary}</span><button type="button" data-interaction="inspect" onClick={()=>setOpen(true)}>细看回响 ↗</button><button type="button" aria-label="收起这次时间回响" onClick={onClose}>收好</button>{open?<SceneEcho text={text} frame={frame} accountName={accountName} onClose={()=>setOpen(false)}/>:null}</span>
}
