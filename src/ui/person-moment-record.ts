import type {GamePanelProps,SceneTarget} from './game-types.ts'
import type {LifePerson} from '../core/life-schema.ts'
import type {LifeSceneProgress} from './life-scene-progress.ts'
import {personResultReading} from './PersonResultChoice.tsx'
import {isoDate} from '../core/calendar.ts'

export interface PersonRecordJob{readonly id:string;readonly title:string;readonly startAt:string;readonly completeAt:string;readonly releasedAt:string|null;readonly status:'completed'|'interrupted';readonly costFen:number;readonly points:number;readonly reference:string|null}
export interface PersonMomentRecord{
 readonly key:string;readonly runId:string;readonly revision:number;readonly personId:LifePerson;readonly name:string;readonly role:string;readonly goal:string;readonly boundary:string;readonly today:string;readonly status:string;readonly missed:boolean
 readonly promise:{readonly title:string;readonly offeredAt:string;readonly acceptedAt:string|null;readonly resolvedAt:string;readonly deadline:string;readonly costFen:number;readonly points:number;readonly days:number;readonly accepted:boolean}|null
 readonly basis:{readonly startAt:string;readonly completeAt:string;readonly costFen:number;readonly points:number}|null
 readonly jobs:readonly PersonRecordJob[];readonly initialJob:number;readonly target:SceneTarget
}
const labels={completed:'已经实际完成',expired:'原邀请已过回应窗口',declined:'已经明确婉拒',missed:'原约定未按期兑现','npc-declined':'对方撤回尚未接受的邀请'} as const
const references={paid_case:'已付履约案例',video_work:'实际原创制作',course_delivery:'完整课程履约',linzhou_participation:'林舟实际参与记录'}
const amount=(n:number)=>Number.isSafeInteger(n)&&n>=0
const day=(s:string)=>{try{return isoDate(s)===s}catch{return false}}
/** One original public moment; every associated paid attempt remains individually
 * reachable. Uncertain sources keep the existing full person reader. */
export function personMomentRecord(p:Pick<GamePanelProps,'view'|'features'>,progress:LifeSceneProgress):PersonMomentRecord|null{
 const {view,features}=p,life=features.life,person=progress.person,promise=progress.promise,stage=progress.stage
 if(view.phase!=='playing'||life.asOf!==view.date||!day(view.date)||!Object.hasOwn(labels,stage)||!person?.known||progress.selection!==person.id||person.name.length>40||person.role.length>80||person.goal.length+person.boundary.length>240)return null
 const people=life.people.filter(row=>row.id===person.id)
 if(people.length!==1||JSON.stringify(people[0])!==JSON.stringify(person)||stage==='completed'&&!personResultReading(p,progress))return null
 let basis:PersonMomentRecord['basis']=null,promiseReading:PersonMomentRecord['promise']=null
 if(promise){
  const rows=life.promises.filter(row=>row.id===promise.id),own=person.promises.filter(row=>row.id===promise.id),expected=stage==='completed'?'fulfilled':stage==='npc-declined'?'npc_declined':stage
  if(rows.length!==1||own.length!==1||JSON.stringify(rows[0])!==JSON.stringify(promise)||JSON.stringify(own[0])!==JSON.stringify(promise)||promise.personId!==person.id||progress.sourceId!==promise.id||promise.status!==expected||!promise.resolvedAt||!day(promise.offeredAt)||!day(promise.resolvedAt)||!day(promise.deadline)||!day(promise.expiresAt)||promise.offeredAt>promise.resolvedAt||promise.resolvedAt>view.date||promise.expiresAt<promise.offeredAt||promise.deadline<promise.offeredAt||!amount(promise.costFen)||!amount(promise.actionPoints)||!Number.isSafeInteger(promise.days)||promise.days<1||person.promiseTerms.title.length>80)return null
  const accepted=promise.acceptedAt!==null
  if(accepted&&(!day(promise.acceptedAt!)||promise.acceptedAt!<promise.offeredAt||promise.acceptedAt!>promise.resolvedAt)||(['fulfilled','missed'].includes(promise.status)?!accepted:accepted))return null
  const previous=life.jobs.filter(row=>row.id===promise.sharedJobId),shared=previous[0]
  if(previous.length!==1||!shared||shared.personId!==person.id||shared.accountId!=='personal'||shared.status!=='completed'||shared.result!=='shared_experience'||shared.kind!==person.work.kind||shared.promiseId!==null||shared.completeAt>promise.offeredAt||!day(shared.startAt)||!day(shared.completeAt)||shared.completeAt<=shared.startAt||!amount(shared.costFen)||!amount(shared.actionPoints)||person.jobs.filter(row=>row.id===shared.id&&JSON.stringify(row)===JSON.stringify(shared)).length!==1)return null
  basis={startAt:shared.startAt,completeAt:shared.completeAt,costFen:shared.costFen,points:shared.actionPoints}
  promiseReading={title:person.promiseTerms.title,offeredAt:promise.offeredAt,acceptedAt:promise.acceptedAt,resolvedAt:promise.resolvedAt,deadline:promise.deadline,costFen:promise.costFen,points:promise.actionPoints,days:promise.days,accepted}
 }else if(stage!=='completed'||!progress.job||progress.sourceId!==progress.job.id)return null
 const originals=promise?life.jobs.filter(row=>row.promiseId===promise.id):progress.job?[progress.job]:[],jobs:PersonRecordJob[]=[]
 if(promise&&promise.status!=='fulfilled'&&originals.some(row=>row.status==='completed')||promise&&promise.status==='fulfilled'&&originals.filter(row=>row.status==='completed').length!==1)return null
 for(const job of originals){
  const rows=life.jobs.filter(row=>row.id===job.id),own=person.jobs.filter(row=>row.id===job.id)
  if(rows.length!==1||own.length!==1||JSON.stringify(rows[0])!==JSON.stringify(job)||JSON.stringify(own[0])!==JSON.stringify(job)||job.personId!==person.id||job.accountId!=='personal'||promise&&job.kind!=='promise_keep'||!promise&&job.kind!==person.work.kind||!day(job.startAt)||!day(job.completeAt)||job.startAt>view.date||job.completeAt<=job.startAt||!amount(job.costFen)||!amount(job.actionPoints))return null
  if(job.status==='completed'){if(job.completeAt>view.date||job.result!==(promise?'promise_fulfilled':'shared_experience'))return null}
  else if(job.status==='interrupted'){if(!job.releasedAt||!day(job.releasedAt)||job.releasedAt<job.startAt||job.releasedAt>view.date||job.result!==null)return null}
  else return null
  const reference=job.reference
  if(reference&&(!Object.hasOwn(references,reference.kind)||!day(reference.date)||reference.date>job.startAt||!reference.id))return null
  jobs.push({id:job.id,title:promise?'实际兑现约定':person.work.title,startAt:job.startAt,completeAt:job.completeAt,releasedAt:job.releasedAt,status:job.status,costFen:job.costFen,points:job.actionPoints,reference:reference?reference.date+' · '+references[reference.kind]:null})
 }
 if(new Set(jobs.map(row=>row.id)).size!==jobs.length||!promise&&jobs.length!==1)return null
 const initialJob=progress.job?jobs.findIndex(row=>row.id===progress.job!.id):Math.max(0,jobs.length-1)
 if(progress.job&&initialJob<0)return null
 return {key:JSON.stringify([view.runId,view.revision,person.id,progress.sourceId,stage]),runId:view.runId,revision:view.revision,personId:person.id,name:person.name,role:person.role,goal:person.goal,boundary:person.boundary,today:view.date,status:labels[stage as keyof typeof labels],missed:stage==='missed',promise:promiseReading,basis,jobs,initialJob,target:{accountId:'personal',personId:person.id,lifeSelection:'person',recordId:progress.sourceId}}
}
