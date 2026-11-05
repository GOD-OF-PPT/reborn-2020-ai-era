import {isoDate} from '../core/calendar.ts'
import {canonicalJson} from '../core/identity.ts'
import type {GamePanelProps} from './game-types.ts'
import type {OpeningFocus} from './player-thread.ts'
import {todayReadingGroups,type TodayThreadView} from './today-thread.ts'
import {researchRoomCopy} from './research-room-copy.ts'
import {personalOngoingFacts} from './personal-ongoing-facts.ts'

export type CompletedDayChoice={readonly key:string;readonly runId:string;readonly revision:number;readonly sourceId:string;readonly label:string}&({readonly kind:'daily'|'ongoing'}|{readonly kind:'focus';readonly focus:OpeningFocus})
const day=(value:string)=>{try{return isoDate(value)===value}catch{return false}}
/** A completed personal scene's next reading, never a new command or promise. */
export function completedDayChoice(p:Pick<GamePanelProps,'view'|'features'>,today:TodayThreadView):CompletedDayChoice|null{
 const {view,features}=p,source=today.source,t=today.primary.thread,f=t.focus
 if(view.phase!=='playing'||features.workbench.atQuarterEnd||today.primary.classification!=='result'||!today.primary.supported||today.responsibilityOverrideNeeded||t.responsibilityOverrideNeeded||t.legacyFallbackRequired||t.focusStatus==='invalid'||!['current','carry'].includes(t.focusScope)||f.runId!==view.runId||f.accountId!=='personal'||f.entityId===null||source.runId!==view.runId||source.revision!==view.revision||source.date!==view.date||source.quarter!==features.workbench.quarter||!day(view.date)||view.accounts.filter(a=>a.accountId==='personal').length!==1||today.remaining.some(item=>item.urgent||item.continuation==='unknown'))return null
 if(f.kind==='life'){
  const rows=features.life.jobs.filter(j=>j.id===f.entityId),j=rows[0]
  if(features.life.asOf!==view.date||rows.length!==1||!j||j.status!=='completed'||j.accountId!=='personal'||j.personId!==null||j.promiseId!==null||j.kind!==f.selection||!day(j.startAt)||!day(j.completeAt)||j.startAt>=j.completeAt||j.completeAt>view.date||!Number.isSafeInteger(j.costFen)||j.costFen<0||j.actionPoints!==1)return null
  if(j.kind==='rest'){if(j.result!=='rested')return null}
  else if(j.kind==='workspace'){const scene=features.life.scene;if(j.result!=='workspace_ready'||!scene.workspaceCompleted||scene.workspaceJobId!==j.id||scene.workspaceCompletedAt!==j.completeAt||scene.workspaceCostFen!==j.costFen)return null}
  else return null
 }else if(f.kind==='market'&&f.entityKind==='research'){
  const rows=features.market.researches.filter(row=>row.id===f.entityId)
  if(rows.length!==1||rows[0]!.status!=='completed'||!researchRoomCopy(p,t))return null
 }else return null
 const {continuing}=todayReadingGroups(today.ongoing),due=features.relay?.customers.some(c=>c.dueReceivableFen>0)??false
 let destination:{kind:'daily'|'ongoing';label:string}|{kind:'focus';label:string;focus:OpeningFocus}
 if(continuing.length===1&&!due){
  const facts=personalOngoingFacts(p,continuing[0]!)
  if(facts){const card=facts.card,label=card.kind==='work'?'继续本季工作':card.kind==='rest'?'回到这段休整':card.kind==='workspace'?'回到住处改善':card.kind==='research'?'继续'+card.label:'回到'+card.label;destination={kind:'focus',label,focus:card.focus}}
  else destination={kind:'ongoing',label:'看看未完的安排'}
 }else if(continuing.length||due)destination={kind:'ongoing',label:due?'看看未完安排与原款':'选一件未完的事'}
 else if(view.budget.available>0)destination={kind:'daily',label:'安排接下来的日子'}
 else return null
 return {key:canonicalJson([view.runId,view.revision,f,destination]),runId:view.runId,revision:view.revision,sourceId:f.entityId,...destination}
}
