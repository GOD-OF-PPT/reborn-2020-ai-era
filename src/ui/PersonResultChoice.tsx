import type {GamePanelProps,NavigateScene} from './game-types.ts'
import type {LifeSceneProgress} from './life-scene-progress.ts'
import {isoDate} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'
import {makeSharedAction} from './shared-action.ts'
import './person-result-choice.css'

export interface PersonResultReading{readonly runId:string;readonly revision:number;readonly personId:string;readonly jobId:string;readonly name:string;readonly completedAt:string;readonly costFen:number;readonly points:number}
/** Only the selected public completed activity can introduce another life choice.
 * Current invitations and accepted promises retain lifeSceneProgress priority. */
export function personResultReading(p:Pick<GamePanelProps,'view'|'features'>,progress:LifeSceneProgress):PersonResultReading|null{
 const {view,features}=p,job=progress.job,person=progress.person
 if(view.phase!=='playing'||features.life.asOf!==view.date||progress.stage!=='completed'||progress.command||progress.waitDate||!job||!person?.known||progress.selection!==person.id||job.personId!==person.id||job.accountId!=='personal'||job.status!=='completed')return null
 const people=features.life.people.filter(row=>row.id===person.id),jobs=features.life.jobs.filter(row=>row.id===job.id),ownJobs=person.jobs.filter(row=>row.id===job.id)
 if(people.length!==1||JSON.stringify(people[0])!==JSON.stringify(person)||jobs.length!==1||ownJobs.length!==1||JSON.stringify(jobs[0])!==JSON.stringify(job)||JSON.stringify(ownJobs[0])!==JSON.stringify(job)||!Number.isSafeInteger(job.costFen)||job.costFen<0||!Number.isSafeInteger(job.actionPoints)||job.actionPoints<0)return null
 try{isoDate(view.date);isoDate(job.startAt);isoDate(job.completeAt)}catch{return null}
 if(job.completeAt>view.date||job.completeAt<=job.startAt)return null
 if(job.promiseId!==null){
  const promise=progress.promise,rows=features.life.promises.filter(row=>row.id===job.promiseId)
  if(job.kind!=='promise_keep'||job.result!=='promise_fulfilled'||!promise||rows.length!==1||JSON.stringify(rows[0])!==JSON.stringify(promise)||promise.id!==job.promiseId||promise.personId!==person.id||promise.status!=='fulfilled'||promise.completionJobId!==job.id||promise.resolvedAt!==job.completeAt||promise.costFen!==job.costFen||promise.actionPoints!==job.actionPoints)return null
 }else if(progress.promise!==null||job.kind!==person.work.kind||job.result!=='shared_experience')return null
 return {runId:view.runId,revision:view.revision,personId:person.id,jobId:job.id,name:person.name,completedAt:job.completeAt,costFen:job.costFen,points:job.actionPoints}
}
export function PersonResultChoice({p,value,onRecord,onNavigate}:{p:GamePanelProps;value:PersonResultReading;onRecord:()=>void;onNavigate:NavigateScene}){
 const action=(label:string,activate:()=>void)=>makeSharedAction(p,label,activate,{allowReadOnly:true,canActivate:()=>p.view.runId===value.runId&&p.view.revision===value.revision})
 const today=action('回到今天，安排接下来',()=>onNavigate('room',{roomView:'today'})),rest=action('看看休整安排',()=>onNavigate('life',{lifeSelection:'rest'})),record=action('翻阅与'+value.name+'的这段经历',onRecord)
 return <section className="scene-action scene-action-card person-result-choice" aria-label="共同经历后的下一选择">
  <p className="person-result-cost">已付{moneyText(value.costFen)} / 已用{value.points}点。完成不返行动，不产生收入。</p>
  <div className="person-result-next"><div className="scene-decision-main"><button type="button" disabled={today.disabled} onClick={today.activate}>{today.label} <span aria-hidden="true">→</span></button></div><button type="button" className="person-result-rest" disabled={rest.disabled} onClick={rest.activate}>{rest.label} <span aria-hidden="true">↗</span></button></div>
  <button type="button" className="person-result-record" disabled={record.disabled} onClick={record.activate}>{record.label} <span aria-hidden="true">↗</span></button>
 </section>
}
