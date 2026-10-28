import type {GamePanelProps} from './game-types.ts'
import {openingFocusAfterSave,playerThread,type OpeningFocus} from './player-thread.ts'
import {openingAttempt} from './opening-attempt.ts'
import {courseAttemptClosed} from './thread-purpose.ts'
import {relayClosedPeriodTarget} from './relay-journey.ts'

type Input=Pick<GamePanelProps,'view'|'features'>

/** A new explicit life promise can follow a finished current attempt, without ending other obligations. */
export function nextLifeFocusAfterResult(previous:Input,current:Input,kind:string,payload:unknown,existing:OpeningFocus|null,quarter?:string):OpeningFocus|null{
 if(!existing||!['StartLifeWork','FulfillLifePromise','AcceptLifePromise'].includes(kind)||previous.view.readOnly)return null
 const prior=playerThread(previous,existing,quarter)
 if(prior.focusStatus==='invalid'||prior.legacyFallbackRequired||prior.focusScope!=='current'||prior.stage==='review-choice')return null
 const opening=openingAttempt(previous,existing,quarter)
 let finished=opening?.action.kind==='next-choice'||prior.outcome==='actual'&&!prior.command&&!prior.secondaryCommand&&!prior.wait
 if(prior.focus.kind==='course'&&prior.focus.courseTarget?.kind==='cohort')finished=courseAttemptClosed(previous,prior)
 if(prior.focus.kind==='relay'&&prior.focus.relayTarget?.kind==='period')finished=relayClosedPeriodTarget({...previous,accountId:prior.focus.accountId},prior.focus.relayTarget)!==null
 if(!finished)return null
 const next=openingFocusAfterSave(previous,current,kind,payload,existing),receipt=current.view.receipts.at(-1)
 if(next?.kind!=='life'||next===existing||next.entityId===null||!receipt||typeof payload!=='object'||payload===null||Array.isArray(payload))return null
 const body=payload as Record<string,unknown>,old=previous.features.life,life=current.features.life
 // Require the original public command relation; never choose the newest matching row.
 if(kind==='AcceptLifePromise'){
  const promises=life.promises.filter(p=>p.id===body.promiseId&&p.id===next.entityId&&p.personId===next.selection&&p.status==='accepted'&&p.responseCommandId===receipt.commandId&&old.promises.some(prior=>prior.id===p.id&&prior.responseCommandId!==p.responseCommandId))
  if(promises.length!==1)return null
 }else{
  const jobs=life.jobs.filter(job=>!old.jobs.some(prior=>prior.id===job.id)&&job.accountId==='personal'&&job.originCommandId===receipt.commandId
   &&(kind==='FulfillLifePromise'?job.promiseId===body.promiseId&&next.entityId===job.promiseId:job.kind===body.kind&&job.personId===(body.personId??null)&&next.entityId===job.id))
  if(jobs.length!==1)return null
 }
 return playerThread(current,next).focusStatus==='invalid'?null:next
}
