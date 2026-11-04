import type {GamePanelProps} from './game-types.ts'
import {CommandButton} from './CommandButton.tsx'
import {moneyText} from './game-text.ts'
import {isoDate} from '../core/calendar.ts'
import './event-choice.css'

export type SceneEvent=GamePanelProps['features']['workbench']['events'][number]
/** Direct comparison is for one current, bounded question. Concurrent money or
 * independent barriers keep the original full responsibility reader. */
export function singleSceneEvent(p:Pick<GamePanelProps,'view'|'features'>):SceneEvent|null {
 const w=p.features.workbench,events=w.events.filter(e=>e.presentation!=='ordinary'||e.isBlocking)
 if(events.length!==1||w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date)))return null
 const e=events[0]!
 if(p.view.accounts.filter(a=>a.accountId===e.accountId).length!==1)return null
 if(w.pause&&!e.isBlocking||e.choices.length<2||e.choices.length>3||new Set(e.choices.map(c=>c.id)).size!==e.choices.length||e.choices.filter(c=>c.isDefault).length!==1||!e.title.trim()||e.choices.some(c=>!c.label.trim()||!Number.isSafeInteger(c.costFen)||c.costFen<0||!Number.isSafeInteger(c.actionPoints)||c.actionPoints<0))return null
 try{if([e.createdAt,e.expiresAt,p.view.date].some(d=>isoDate(d)!==d)||e.createdAt>p.view.date||e.expiresAt<p.view.date)return null}catch{return null}
 return e
}

export function EventChoiceLetter({p,event:e}:{p:GamePanelProps;event:SceneEvent}) {
 const account=e.accountId==='personal'?'个人账户':(p.features.workbench.routes.find(r=>r.accountId===e.accountId)?.name??'企业账户')+' · '+e.accountId.slice(-6)
 return <section className="event-choice-letter" aria-label="这件事的回应与代价">
  <p className="event-choice-date">{account} · {e.classification==='historical'?'史实节点':'本局模拟'} · {e.createdAt}出现 · 最迟{e.expiresAt}回应</p>
  <div className="event-choice-options" style={{gridTemplateColumns:`repeat(${e.choices.length},minmax(0,1fr))`}}>
   {e.choices.map((choice,index)=><CommandButton {...p} key={choice.id} kind="ChooseEvent" payload={{instanceId:e.id,choiceId:choice.id}} label={choice.label} confirm className="event-choice-action">
    <span className="event-choice-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><strong>{choice.label}</strong><span className="event-choice-cost">{moneyText(choice.costFen)} · {choice.actionPoints}点行动</span><span className="event-choice-next">看清后决定 →</span>
   </CommandButton>)}
  </div>
  <div className="event-choice-later"><p>到期未回应：{e.choices.find(c=>c.isDefault)!.label}。</p>{e.isBlocking?<CommandButton {...p} kind="DeferEventDecision" payload={{instanceId:e.id}} label="暂缓，按期限默认" confirm><span>稍后再想</span><small>期限仍是{e.expiresAt}</small></CommandButton>:null}</div>
 </section>
}
