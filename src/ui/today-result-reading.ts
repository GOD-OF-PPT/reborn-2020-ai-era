import type {GamePanelProps} from './game-types.ts'
import type {EchoFrame} from './SceneEcho.tsx'
import {todayReadingGroups,type TodayThreadView} from './today-thread.ts'
import {firstOrderPaidFacts} from './first-order-feedback.ts'
import {personalResultFacts} from './personal-day-copy.ts'
import {isoDate} from '../core/calendar.ts'

type Input=Pick<GamePanelProps,'view'|'features'>
type Notice={date:string;text:string;brief?:string;frame:EchoFrame|null}
export interface TodayResultReading{readonly title:string;readonly line?:string}
const day=(value:string)=>{try{return isoDate(value)===value}catch{return false}}

/** Today invites the next choice only after the same public result is complete.
 * Ongoing work, original money and responsibilities keep their existing lead. */
export function todayResultReading(p:Input,today:TodayThreadView,notice?:Notice):TodayResultReading|null {
 const {view,features}=p,thread=today.primary.thread,focus=thread.focus
 // The legacy Today model deliberately leaves first-order handling to its own
 // scene. Only its independently checked settled contract is adapted here.
 const resultClass=today.primary.classification==='result'&&today.primary.supported||focus.kind==='first-order'&&today.primary.classification==='other'
 if(view.phase!=='playing'||view.busy||view.readOnly||view.hasCandidate||view.saveStatus!=='saved'||features.workbench.atQuarterEnd||today.responsibilityOverrideNeeded||!resultClass||today.source.runId!==view.runId||today.source.revision!==view.revision||today.source.date!==view.date||today.source.quarter!==features.workbench.quarter||thread.focusStatus==='invalid'||thread.focusScope==='history'||thread.responsibilityOverrideNeeded||thread.outcome!=='actual'||focus.runId!==view.runId||focus.accountId!=='personal'||todayReadingGroups(today.ongoing).continuing.length>0)return null
 if(focus.kind==='first-order'){
  const first=features.firstOrder,contracts=view.operations?.contracts.filter(c=>c.id===first.contractId&&c.businessId===first.businessId&&c.offerId===first.offerId&&c.status==='settled')??[]
  if(first.status!=='settled'||focus.entityId!==first.contractId||contracts.length!==1||!Number.isSafeInteger(first.result.paymentFen)||first.result.paymentFen<=0||!contracts[0]!.settledAt||!day(contracts[0]!.settledAt)||contracts[0]!.settledAt>view.date||!thread.resultRefs.some(ref=>ref.kind==='contract'&&ref.id===first.contractId))return null
  const facts=notice?firstOrderPaidFacts(p,thread,notice):null
  return {title:'接下来的日子，想怎样过？',...(facts?{line:facts.join(' ')}:{})}
 }
 if(focus.kind==='life'){
  const jobs=features.life.jobs.filter(job=>job.id===focus.entityId),job=jobs.length===1?jobs[0]:undefined
  if(!job||job.accountId!=='personal'||job.personId!==null||job.promiseId!==null||job.status!=='completed'||job.kind!==focus.selection||!day(job.completeAt)||job.completeAt>view.date||!thread.resultRefs.some(ref=>ref.kind==='job'&&ref.id===job.id&&ref.date===job.completeAt))return null
  const rest=job.kind==='rest'&&job.result==='rested',workspace=job.kind==='workspace'&&job.result==='workspace_ready'&&features.life.scene.workspaceCompleted&&features.life.scene.workspaceJobId===job.id
  if(!rest&&!workspace)return null
  const facts=notice?personalResultFacts(p,thread,notice):null
  return {title:rest?'歇过之后，想从哪里开始？':'住处变好了，接下来呢？',...(facts?{line:facts}:{})}
 }
 return null
}
