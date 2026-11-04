import type {GamePanelProps} from './game-types.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {makeSharedAction} from './shared-action.ts'
import {moneyText} from './game-text.ts'
import {addDays,quarterOf} from '../core/calendar.ts'
import './work-time-choice.css'

type Props={p:GamePanelProps;onClose:()=>void;onLife:()=>void;onExplore:()=>void;onResearch:(id?:string)=>void;onRest:(id:string)=>void}
export function WorkTimeChoices({p,onClose,onLife,onExplore,onResearch,onRest}:Props){
 const rest=p.features.life.work.rest,matching=p.features.workbench.researches.filter(row=>row.id==='market-overview'),research=matching.length===1?matching[0]:null,state=research?.state
 const restRows=p.features.life.jobs.filter(job=>job.kind==='rest'&&job.personId===null&&quarterOf(job.startAt)===p.features.workbench.quarter&&job.status!=='interrupted'),oldRest=restRows.length===1?restRows[0]:null
 const request:GamePanelProps['request']=(...args)=>{onClose();p.request(...args)}
 const commandProps={...p,accountId:'personal',request}
 const ui=(label:string,activate:()=>void)=>{const action=makeSharedAction(p,label,activate,{allowReadOnly:true});return <button type="button" className="scene-text-action" disabled={action.disabled} onClick={action.activate}>{label}</button>}
 return <Dialog title="工作之外，想把时间留给什么？" layout="direct" className="opening-paper work-time-choice" onClose={onClose} footer={<div className="work-time-actions">{ui('看看相识的人与其它生活',onLife)}{ui('看看自己的其它尝试',onExplore)}<button type="button" onClick={onClose}>先不新增安排</button></div>}>
  <p className="work-time-context">个人安排 · {p.view.date} · 本季还可用{p.view.budget.available}点。工作照原日历继续，下面的安排共用剩余行动。</p>
  <div className="work-time-options">
   <section><header><svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="m10 17 22-5 24 7-4 35-23-5-22 3z"/><path d="m32 12-3 37M17 27l9-2m-10 9 9-2m14-7 9 3m-10 6 9 3"/></svg><h3>{oldRest?.status==='running'?'休整正在继续':oldRest?.status==='completed'?'这段休整已经完成':restRows.length?'这份休整的原记录':'给自己几天时间'}</h3></header>{oldRest?<><p className="work-time-cost"><strong>已付{moneyText(oldRest.costFen)}</strong><span>已用{oldRest.actionPoints}点</span></p><p>{oldRest.status==='completed'?oldRest.completeAt+'已完成':oldRest.startAt+'开始 · 预计'+oldRest.completeAt+'完成'}</p><p className="work-time-purpose">原休整与工作都保留；翻阅不重新占用行动。</p>{ui('翻阅这段休整',()=>onRest(oldRest.id))}</>:restRows.length?<><p className="work-time-purpose">本季休整来源需核对，没有替换成另一份安排。</p>{ui('查看原生活记录',onLife)}</>:<><p className="work-time-cost"><strong>{moneyText(rest.costFen)}</strong><span>{rest.points}点 · {rest.days}天</span></p><p>最早{addDays(p.view.date,rest.days)}完成</p><p className="work-time-purpose">完成后留下这段休整；不会返还行动。</p><CommandButton {...commandProps} kind="StartLifeWork" payload={{kind:'rest',personId:null,reference:null}} label="核对并留出七天休整" confirm primary>留几天给自己 <span aria-hidden="true">→</span></CommandButton></>}</section>
   <section><header><svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="m14 10 34 4-4 42-34-4zM21 22l17 2m-18 7 12 1"/><circle cx="42" cy="40" r="11"/><path d="m50 49 8 10"/></svg><h3>{state?.status==='running'?'公开资料正在整理':state?.status==='completed'?'公开资料已整理好':state?'这份研究的原记录':'读一份公开资料'}</h3></header>
    {research&&!state?<><p className="work-time-cost"><strong>{moneyText(research.costFen)}</strong><span>{research.actionPoints}点 · {research.days}天</span></p><p>预计{addDays(p.view.date,research.days)}完成</p><p className="work-time-purpose">整理公开线索；不揭示未来价格，也不自动买卖。</p><CommandButton {...commandProps} kind="ResearchMarket" payload={{definitionId:research.id}} label="核对并开始公开研究" confirm primary>先整理公开线索 <span aria-hidden="true">→</span></CommandButton></>:state?<><p className="work-time-existing">{state.status==='running'?`${state.startAt}开始 · 预计${state.completeAt}完成`:state.status==='completed'?`${state.completeAt}已完成`:state.status==='interrupted'?'已中断，原投入不返还。':'原状态请继续核对。'}</p><p className="work-time-purpose">原研究继续保留。翻阅不会再次开工或代你买卖。</p>{ui('翻阅这份原研究',()=>onResearch(state.id))}</>:<><p className="work-time-purpose">公开研究条件暂不可确认，先翻原记录。</p>{ui('查看原市场记录',()=>onResearch())}</>}
   </section>
  </div>
 </Dialog>
}
