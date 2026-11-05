import type {GamePanelProps,NavigateScene,SceneTarget} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import type {LifeSceneProgress} from './life-scene-progress.ts'
import {isoDate} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'
import {makeSharedAction} from './shared-action.ts'
import './person-result-choice.css'

export interface PersonalResultReading{readonly runId:string;readonly revision:number;readonly kind:'rest'|'workspace';readonly jobId:string;readonly completedAt:string;readonly costFen:number;readonly points:number}
/** Personal completion remains a fact of one original job, not a new reward or
 * a permission to begin another activity. Unknown sources keep the old reader. */
export function personalResultReading(p:Pick<GamePanelProps,'view'|'features'>,progress:LifeSceneProgress):PersonalResultReading|null{
 const {view,features}=p,job=progress.job
 if(view.phase!=='playing'||features.life.asOf!==view.date||progress.stage!=='completed'||progress.command||progress.waitDate||progress.person!==null||progress.promise!==null||!job||job.personId!==null||job.promiseId!==null||job.accountId!=='personal'||job.status!=='completed'||job.kind!=='rest'&&job.kind!=='workspace'||progress.selection!==job.kind)return null
 const rows=features.life.jobs.filter(row=>row.id===job.id)
 if(rows.length!==1||JSON.stringify(rows[0])!==JSON.stringify(job)||!Number.isSafeInteger(job.costFen)||job.costFen<0||!Number.isSafeInteger(job.actionPoints)||job.actionPoints<0)return null
 try{isoDate(view.date);isoDate(job.startAt);isoDate(job.completeAt)}catch{return null}
 if(job.completeAt>view.date||job.completeAt<=job.startAt||job.result!==(job.kind==='rest'?'rested':'workspace_ready'))return null
 if(job.kind==='workspace'){
  const scene=features.life.scene
  if(!scene.workspaceCompleted||scene.workspaceJobId!==job.id||scene.workspaceCompletedAt!==job.completeAt||scene.workspaceCostFen!==job.costFen)return null
 }
 return {runId:view.runId,revision:view.revision,kind:job.kind,jobId:job.id,completedAt:job.completeAt,costFen:job.costFen,points:job.actionPoints}
}
export function PersonalResultChoice({p,value,onOpen,onNavigate}:{p:GamePanelProps;value:PersonalResultReading;onOpen:(screen?:Screen,target?:SceneTarget)=>void;onNavigate:NavigateScene}){
 const action=(label:string,activate:()=>void)=>makeSharedAction(p,label,activate,{allowReadOnly:true,canActivate:()=>p.view.runId===value.runId&&p.view.revision===value.revision})
 const today=action('回到今天，安排接下来',()=>onNavigate('room',{roomView:'today'})),people=action('看看相识的人',()=>onNavigate('life',{lifeSelection:'person'})),record=action(value.kind==='rest'?'翻阅这段休整':'翻阅这次住处改善',()=>onOpen('life',{accountId:'personal',lifeSelection:value.kind,recordId:value.jobId}))
 return <section className="scene-action scene-action-card person-result-choice personal-result-choice" aria-label="个人生活完成后的下一选择">
  <p className="person-result-cost">个人已付{moneyText(value.costFen)} / 已用{value.points}点。完成不返行动，不产生收入。</p>
  <div className="person-result-next"><div className="scene-decision-main"><button type="button" disabled={today.disabled} onClick={today.activate}>{today.label} <span aria-hidden="true">→</span></button></div><button type="button" className="person-result-rest" disabled={people.disabled} onClick={people.activate}>{people.label} <span aria-hidden="true">↗</span></button></div>
  <button type="button" className="person-result-record" disabled={record.disabled} onClick={record.activate}>{record.label} <span aria-hidden="true">↗</span></button>
 </section>
}
