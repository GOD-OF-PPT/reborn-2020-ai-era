import {isoDate} from '../core/calendar.ts'
import type {GamePanelProps,SceneTarget} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import type {PlayerThreadView} from './player-thread.ts'
import {workRoomCopy} from './work-room-copy.ts'
import {lifeWorkTarget} from './SceneJournal.tsx'

export interface WorkWaitItem {readonly key:string;readonly label:string;readonly title:string;readonly date:string;readonly screen:Screen;readonly target:SceneTarget}
export interface WorkWaitReading {readonly key:string;readonly runId:string;readonly revision:number;readonly today:string;readonly items:readonly WorkWaitItem[]}
const validDate=(date:string)=>{try{return isoDate(date)===date}catch{return false}}
const studies:Readonly<Record<string,string>>={'market-overview':'公开资料','market-foundation-course':'规则研习','simulation-special-study':'试验研习'}

/** Planned dates from public records only, never a replacement event queue. */
export function workWaitReading(p:Pick<GamePanelProps,'view'|'features'>,thread:PlayerThreadView):WorkWaitReading|null {
 if(p.view.phase!=='playing'||!workRoomCopy(p,thread)||!thread.wait||!validDate(thread.wait.date)||thread.wait.date<=p.view.date)return null
 const {view,features:f}=p,period=view.operations!.employment.find(row=>row.id===thread.focus.entityId)
 if(!period?.segments.some(row=>row.to===null&&row.from<=view.date))return null
 const life=f.life.jobs.filter(row=>row.status==='running'),researches=f.market.researches.filter(row=>row.status==='running')
 if(!life.length&&!researches.length)return null
 if(new Set(life.map(row=>row.id)).size!==life.length||new Set(researches.map(row=>row.id)).size!==researches.length)return null
 const items:WorkWaitItem[]=[]
 for(const job of life){
  if(job.accountId!=='personal'||!validDate(job.startAt)||!validDate(job.completeAt)||job.startAt>view.date||job.completeAt<view.date||job.completeAt<=job.startAt)return null
  const people=job.personId===null?[]:f.life.people.filter(person=>person.id===job.personId&&person.known)
  if(job.personId!==null&&people.length!==1)return null
  if(job.kind==='promise_keep'&&f.life.promises.filter(promise=>promise.id===job.promiseId&&promise.personId===job.personId).length!==1)return null
  const title=job.kind==='promise_keep'?'已答应的生活安排':f.life.work[job.kind]?.title
  if(!title)return null
  const label=job.kind==='rest'?'休整':job.kind==='workspace'?'住处改善':people.length?people[0]!.name+'约定':'生活安排'
  items.push({key:'life:'+job.id,label,title:(people.length?people[0]!.name+' · ':'')+title,date:job.completeAt,screen:'life',target:lifeWorkTarget(job)})
 }
 for(const research of researches){
  const terms=f.workbench.researches.filter(row=>row.id===research.definitionId),label=studies[research.definitionId]
  if(!label||terms.length!==1||terms[0]!.state?.id!==research.id||terms[0]!.state.status!=='running'||!validDate(research.startAt)||!validDate(research.completeAt)||research.startAt>view.date||research.completeAt<view.date||research.completeAt<=research.startAt)return null
  items.push({key:'research:'+research.id,label,title:label+'的原研究',date:research.completeAt,screen:'market',target:{accountId:'personal',recordId:research.id,openRecord:true}})
 }
 items.push({key:'work:'+period.id,label:'工资回响',title:period.quarter+'原工作的工资反馈',date:thread.wait.date,screen:'quarter',target:{accountId:'personal',recordId:period.id}})
 items.sort((a,b)=>a.date.localeCompare(b.date)||a.key.localeCompare(b.key))
 return {key:JSON.stringify([view.runId,'personal',period.id]),runId:view.runId,revision:view.revision,today:view.date,items}
}
