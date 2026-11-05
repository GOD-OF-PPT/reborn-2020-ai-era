import {isoDate,quarterOf} from '../core/calendar.ts'
import {canonicalJson} from '../core/identity.ts'
import type {GamePanelProps} from './game-types.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {seasonRecollection,type SeasonPendingItem,type SeasonRecollectionView} from './season-thread.ts'
import {moneyText} from './game-text.ts'

export interface SeasonPersonalCarry{readonly id:string;readonly label:string;readonly stage:string;readonly from:string;readonly through:string;readonly quarter:string;readonly lines:readonly string[];readonly focus:OpeningFocus}
const day=(date:string)=>{try{return isoDate(date)===date}catch{return false}}
const natural=(value:number)=>Number.isSafeInteger(value)&&value>=0
/** Reading-only labels for the complete original cross-quarter personal set.
 * Unsupported or incomplete sets keep the complete season reader. */
export function seasonPersonalCarry(p:Pick<GamePanelProps,'view'|'features'>,season:SeasonRecollectionView,pending:readonly SeasonPendingItem[]):readonly SeasonPersonalCarry[]|null{
 const {view,features}=p,original=seasonRecollection(p,season.quarter)
 if(!original||!features.workbench.atQuarterEnd||features.life.asOf!==view.date||view.accounts.filter(a=>a.accountId==='personal').length!==1||pending.length<2||pending.length>3||canonicalJson(original.remaining)!==canonicalJson(season.remaining)||canonicalJson(original.remaining.filter(i=>i.continuation!=='retained'))!==canonicalJson(pending)||new Set(pending.map(i=>i.id)).size!==pending.length)return null
 const cards:SeasonPersonalCarry[]=[]
 for(const item of pending){
  const f=item.focus
  if(!f||f.runId!==view.runId||f.accountId!=='personal'||item.accountId!=='personal'||item.urgent||item.continuation!==undefined&&item.continuation!=='task')return null
  const thread=playerThread(p,f)
  if(canonicalJson(thread.focus)!==canonicalJson(f)||thread.focusStatus==='invalid'||!['current','carry'].includes(thread.focusScope)||thread.responsibilityOverrideNeeded||thread.legacyFallbackRequired||item.title!==thread.title||item.line!==thread.line+' '+thread.detail)return null
  let label:string,stage:string,from:string,through:string,lines:string[]
  if(f.kind==='life'){
   const life=features.life,promises=life.promises.filter(o=>o.id===f.entityId),promise=promises[0],parent=promises.length===1&&promise?.status==='accepted'
   const jobs=life.jobs.filter(j=>parent?j.promiseId===promise!.id&&j.status==='running':j.id===f.entityId),job=jobs[0]
   if(jobs.length!==1||!job||job.status!=='running'||job.accountId!=='personal'||!natural(job.costFen)||!natural(job.actionPoints)||!day(job.startAt)||!day(job.completeAt)||job.startAt>view.date||job.completeAt<=view.date||thread.wait?.date!==job.completeAt)return null
   if(parent){if(!promise!.acceptedAt||promise!.acceptedAt>view.date||promise!.personId!==job.personId||f.selection!==promise!.personId||item.dueAt!==promise!.deadline||!day(promise!.deadline)||promise!.deadline<job.completeAt)return null}
   else if(job.promiseId!==null||item.dueAt!==job.completeAt)return null
   if(job.personId===null){if(!['rest','workspace'].includes(job.kind)||f.selection!==job.kind)return null;label=job.kind==='rest'?'自己的休整':'住处改善'}
   else{const people=life.people.filter(person=>person.id===job.personId),person=people[0],own=person?.jobs.filter(j=>j.id===job.id)??[];if(people.length!==1||!person?.known||f.selection!==person.id||own.length!==1||canonicalJson(own[0])!==canonicalJson(job))return null;if(parent){const ownPromises=person.promises.filter(o=>o.id===promise!.id);if(ownPromises.length!==1||canonicalJson(ownPromises[0])!==canonicalJson(promise))return null}label=parent?'答应'+person.name+'的事':'与'+person.name+'的相处'}
   stage=parent?'兑现中':'进行中';from=job.startAt;through=job.completeAt;lines=['已付'+moneyText(job.costFen)+' / 已用'+job.actionPoints+'点',...(parent?['原约定最晚'+promise!.deadline]:[])]
  }else if(f.kind==='market'&&f.entityKind==='research'){
   const rows=features.market.researches.filter(row=>row.id===f.entityId),research=rows[0]
   if(rows.length!==1||!research||research.status!=='running'||!day(research.startAt)||!day(research.completeAt)||research.startAt>view.date||research.completeAt<=view.date||item.dueAt!==research.completeAt||thread.wait?.date!==research.completeAt)return null
   const definitions:Record<string,{label:string;entitlement:string|null}>={'market-overview':{label:'公开资料',entitlement:null},'market-foundation-course':{label:'规则研习',entitlement:'sim-researched'},'simulation-special-study':{label:'试验研习',entitlement:'sim-experimental-access'}}
   const known=definitions[research.definitionId],terms=features.workbench.researches.filter(row=>row.id===research.definitionId),term=terms[0]
   if(!known||terms.length!==1||!term?.state||term.state.id!==research.id||term.state.status!==research.status||term.entitlementId!==known.entitlement)return null
   label=known.label;stage='研习中';from=research.startAt;through=research.completeAt;lines=['不揭示未来价格；买卖仍须显选。']
  }else return null
  cards.push({id:item.id,label,stage,from,through,quarter:quarterOf(from),lines,focus:f})
 }
 return cards
}
