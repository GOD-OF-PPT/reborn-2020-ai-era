import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {lifeSceneProgress} from './life-scene-progress.ts'
import {researchRoomCopy} from './research-room-copy.ts'
import {isoDate} from '../core/calendar.ts'

export interface PersonalDayReturn{readonly runId:string;readonly revision:number;readonly sourceId:string;readonly kind:'life'|'research'}
const day=(value:string)=>{try{return isoDate(value)===value}catch{return false}}
/** A reading exit for the selected unfinished personal object. No new work,
 * refund, date advance, interruption or focus substitution is performed here. */
export function personalDayReturn(p:Pick<GamePanelProps,'view'|'features'>,thread:PlayerThreadView):PersonalDayReturn|null{
 const f=thread.focus,date=p.view.date
 if(p.view.phase!=='playing'||f.runId!==p.view.runId||f.accountId!=='personal'||thread.focusStatus==='invalid'||!['current','carry'].includes(thread.focusScope)||thread.responsibilityOverrideNeeded||thread.legacyFallbackRequired||p.features.workbench.atQuarterEnd||!day(date))return null
 if(f.kind==='market'&&f.entityKind==='research'){
  const rows=p.features.market.researches.filter(row=>row.id===f.entityId)
  return rows.length===1&&rows[0]!.status==='running'&&researchRoomCopy(p,thread)?{runId:p.view.runId,revision:p.view.revision,sourceId:rows[0]!.id,kind:'research'}:null
 }
 if(f.kind!=='life'||p.features.life.asOf!==date)return null
 const life=p.features.life,progress=lifeSceneProgress(life,date,f.selection),job=progress.job
 if(progress.stage!=='running'||!job||progress.sourceId!==f.entityId||job.id!==f.entityId||job.status!=='running'||job.accountId!=='personal'||!day(job.startAt)||!day(job.completeAt)||job.startAt>date||job.completeAt<date||job.completeAt<=job.startAt||thread.wait?.date!==job.completeAt)return null
 const rows=life.jobs.filter(row=>row.id===job.id)
 if(rows.length!==1||JSON.stringify(rows[0])!==JSON.stringify(job))return null
 if(job.personId===null){if(!['rest','workspace'].includes(job.kind)||job.kind!==f.selection||progress.person!==null)return null}
 else{
  const person=progress.person,people=life.people.filter(row=>row.id===job.personId),own=person?.jobs.filter(row=>row.id===job.id)??[]
  if(!person?.known||f.selection!==person.id||people.length!==1||JSON.stringify(people[0])!==JSON.stringify(person)||own.length!==1||JSON.stringify(own[0])!==JSON.stringify(job))return null
 }
 return {runId:p.view.runId,revision:p.view.revision,sourceId:job.id,kind:'life'}
}
