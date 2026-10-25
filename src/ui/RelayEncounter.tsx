import {cloneElement,isValidElement} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import type {RelayChoiceIntent} from './relay-journey.ts'
import {RelayThreadAction} from './RelayThreadAction.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {relayPaperFor,relayMoneyFor} from './relay-continuity.ts'
import {relayDeferredFeedback} from './relay-scene-clock.ts'
import {ClockAdvance} from './ClockAdvance.tsx'
import './relay-encounter.css'

type Props={p:GamePanelProps;thread:PlayerThreadView;target:RelaySceneTarget|null|undefined;date:string|null;waitLabel:string;onChoose:(intent:RelayChoiceIntent)=>void;onToday:()=>void}
export function RelayEncounter({p,thread,target,date,waitLabel,onChoose,onToday}:Props){
 const art=relayPaperFor(p,target),money=relayMoneyFor(p,target),deferred=thread.command?.kind==='CollectRelayDue'?relayDeferredFeedback(p,target):null
 return <RelayThreadAction p={p} thread={thread} target={target} active date={date} waitLabel={waitLabel} onChoose={onChoose} onToday={onToday}>{primary=>{
  if(!primary)return null
  const node=isValidElement<{className?:string}>(primary.main)?primary.main:null
  const main=node?cloneElement(node,{className:(node.props.className??'')+' scene-decision-main'}):primary.main
  const protection=p.view.readOnly?'readonly' as const:p.view.hasCandidate||p.view.saveStatus!=='saved'?'unsaved' as const:primary.binding.disabled?'unavailable' as const:undefined
  return <section className="scene-action relay-encounter" data-relay-stage={thread.stage} aria-label="这一份服务的决定"><div className="relay-encounter-thought"><span className="scene-choice-overline" data-book-chapter={thread.title}>眼前的服务与承诺 · 由你决定</span><p>{thread.object}</p><p className="scene-choice-line">这次想走到：{thread.finishWhen}</p>{money?<p className="relay-scene-money">{money}</p>:null}{main}{deferred?<ClockAdvance p={p} date={deferred.date} label={deferred.label+' · '+deferred.date}/>:null}</div><div className="relay-encounter-paper"><OpeningObject kind={thread.wait?'calendar':'work'} appearance="relay" title={thread.object} displayTitle="" detail="" stageLabel={target?.kind==='period'?'本期服务单':target===null?'服务资料':'服务夹'} actionLabel={primary.binding.label} disabled={primary.binding.disabled} onActivate={primary.binding.activate} textOnly={p.textOnly===true} {...(art?{relayPaper:{...art,actionHint:primary.hint}}:{})} {...(protection?{protection}:{})}/></div></section>
 }}</RelayThreadAction>
}
