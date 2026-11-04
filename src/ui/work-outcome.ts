import type {GamePanelProps,SceneTarget} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import {playerThread,type PlayerThreadView} from './player-thread.ts'
import {workRoomCopy} from './work-room-copy.ts'
import {researchRoomBrief} from './research-room-copy.ts'
import {personalResultFacts} from './personal-day-copy.ts'
import {moneyText} from './game-text.ts'

export interface WorkOutcome {
 readonly key:string;readonly brief:string
 readonly record:{readonly label:string;readonly screen:Screen;readonly target:SceneTarget}
 readonly next:{readonly label:string;readonly screen:Screen;readonly target:SceneTarget}
}
/** Exact single completions only. The original readers keep ownership of source,
 * money, action and narration checks; unfamiliar or mixed results remain whole. */
export function workOutcome(p:Pick<GamePanelProps,'view'|'features'>,thread:PlayerThreadView,notice:Parameters<typeof researchRoomBrief>[2]):WorkOutcome|null {
 if(p.view.phase!=='playing'||!workRoomCopy(p,thread)||p.view.receipts.at(-1)?.kind!=='AdvanceTime')return null
 const period=p.view.operations!.employment.find(row=>row.id===thread.focus.entityId)
 if(!period?.segments.some(row=>row.to===null&&row.from<=p.view.date))return null
 const results:WorkOutcome[]=[]
 for(const research of p.features.market.researches.filter(row=>row.definitionId==='market-overview'&&row.status==='completed'&&row.completeAt===p.view.date)){
  const original=playerThread(p,{runId:p.view.runId,kind:'market',accountId:'personal',entityKind:'research',entityId:research.id})
  if(!researchRoomBrief(p,original,notice))continue
  results.push({key:'research:'+research.id,brief:'公开资料已整理好；买卖仍由你决定。',record:{label:'研究记录 ↗',screen:'market',target:{accountId:'personal',recordId:research.id,openRecord:true,returnToRoom:true}},next:{label:'看看模拟判断',screen:'market',target:{accountId:'personal'}}})
 }
 for(const job of p.features.life.jobs.filter(row=>row.status==='completed'&&row.completeAt===p.view.date&&row.personId===null&&row.promiseId===null&&(row.kind==='rest'||row.kind==='workspace'))){
  if(job.kind!=='rest'&&job.kind!=='workspace')continue
  const original=playerThread(p,{runId:p.view.runId,kind:'life',accountId:'personal',entityId:job.id,selection:job.kind})
  if(!personalResultFacts(p,original,notice))continue
  results.push({key:'life:'+job.id,brief:(job.kind==='rest'?'休整已完成':'住处改善已完成')+' · 原投入'+moneyText(job.costFen)+' / '+job.actionPoints+'点。',record:{label:job.kind==='rest'?'休整记录 ↗':'住处记录 ↗',screen:'life',target:{accountId:'personal',recordId:job.id,lifeSelection:job.kind,returnToRoom:true}},next:{label:'看看相识的人',screen:'life',target:{accountId:'personal',lifeSelection:'person'}}})
 }
 return results.length===1?results[0]!:null
}
