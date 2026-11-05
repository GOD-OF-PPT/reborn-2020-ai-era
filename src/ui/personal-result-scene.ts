import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {CompletedDayChoice} from './completed-day-choice.ts'
import {personalResultFacts} from './personal-day-copy.ts'
import {researchRoomCopy,researchRoomBrief} from './research-room-copy.ts'

type Notice=Parameters<typeof personalResultFacts>[2]
export interface PersonalResultScene{readonly title:string;readonly brief:string|null}
/** One current completed scene and its already checked next reading. Only an
 * exact original single-result proof can replace the first layer's repeated facts. */
export function personalResultScene(p:Pick<GamePanelProps,'view'|'features'>,thread:PlayerThreadView,next:CompletedDayChoice,notice?:Notice):PersonalResultScene|null{
 const f=thread.focus
 if(p.view.phase!=='playing'||p.features.workbench.atQuarterEnd||f.runId!==p.view.runId||f.accountId!=='personal'||f.entityId===null||next.runId!==p.view.runId||next.revision!==p.view.revision||next.sourceId!==f.entityId||thread.outcome!=='actual'||thread.focusStatus==='invalid'||!['current','carry'].includes(thread.focusScope)||thread.responsibilityOverrideNeeded||thread.legacyFallbackRequired)return null
 const continuing=next.kind!=='daily'
 if(f.kind==='life'){
  const rows=p.features.life.jobs.filter(j=>j.id===f.entityId),job=rows[0]
  if(rows.length!==1||!job||job.status!=='completed'||job.personId!==null||job.promiseId!==null||job.kind!==f.selection)return null
  const rest=job.kind==='rest'&&job.result==='rested',workspace=job.kind==='workspace'&&job.result==='workspace_ready'
  if(!rest&&!workspace)return null
  const facts=notice?personalResultFacts(p,thread,notice):null
  return {title:rest?continuing?'歇过之后，手头的事还在。':'歇过之后，想怎样继续？':continuing?'住处变好了，手头的事还在。':'住处变好了，接下来呢？',brief:facts?(rest?'休整结束':'桌椅与照明已改善')+' · '+facts:null}
 }
 if(f.kind==='market'&&f.entityKind==='research'){
  const rows=p.features.market.researches.filter(r=>r.id===f.entityId),copy=researchRoomCopy(p,thread)
  if(rows.length!==1||rows[0]!.status!=='completed'||!copy)return null
  const proven=notice?researchRoomBrief(p,thread,notice):null
  return {title:continuing?'研究有了结果，再续手头的事。':'研究有了结果，接下来呢？',brief:proven?copy.resultEcho??'公开线索已整理；买卖仍由你决定。':null}
 }
 return null
}
