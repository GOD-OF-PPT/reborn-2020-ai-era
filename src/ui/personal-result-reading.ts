import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {playerThread} from './player-thread.ts'
import type {PersonalResultProof,EchoFrame} from './SceneEcho.tsx'
import {researchRoomCopy} from './research-room-copy.ts'
import {moneyText} from './game-text.ts'
import {todayReadingGroups,type TodayThreadView} from './today-thread.ts'
import {completedDayChoice} from './completed-day-choice.ts'
import {personalResultScene} from './personal-result-scene.ts'
import {personalResultFacts} from './personal-day-copy.ts'

type Input=Pick<GamePanelProps,'view'|'features'>
type Notice={date:string;text:string;brief?:string;frame:EchoFrame|null;personalResults?:PersonalResultProof}
const researchTerms:Record<string,{label:string;entitlement:string|null}>={'market-overview':{label:'公开资料已整理好',entitlement:null},'market-foundation-course':{label:'规则研习资格已取得',entitlement:'sim-researched'},'simulation-special-study':{label:'试验段研习资格已取得',entitlement:'sim-experimental-access'}}
/** The producer carries the complete original membership. Consumers check its
 * current identity and exact original notice; no sentence parsing or inferred before-state. */
export function parallelResultReading(p:Input,thread:PlayerThreadView,notice:Notice):{readonly brief:string;readonly coversSelected:boolean}|null{
 const {view,features}=p,proof=notice.personalResults,frame=notice.frame,f=thread.focus,last=view.receipts.at(-1)
 if(!proof||!frame||view.phase!=='playing'||view.busy||view.readOnly||view.hasCandidate||view.saveStatus!=='saved'||features.workbench.atQuarterEnd||features.workbench.pause||features.life.asOf!==view.date||proof.runId!==view.runId||proof.revision!==view.revision||proof.date!==view.date||notice.date!==view.date||proof.text!==notice.text||proof.brief!==notice.brief||proof.frame!==frame||last?.kind!=='AdvanceTime'||last.revisionAfter!==view.revision||f.runId!==view.runId||f.accountId!=='personal'||thread.focusStatus==='invalid'||!['current','carry'].includes(thread.focusScope)||thread.responsibilityOverrideNeeded||thread.legacyFallbackRequired||!['work','life','market'].includes(f.kind)||f.kind==='market'&&f.entityKind!=='research')return null
 if(frame.quarterChanged||frame.dateAfter!==view.date||frame.dateBefore>=frame.dateAfter||frame.pointsBefore!==frame.pointsAfter||frame.pointsAfter!==view.budget.available||frame.reservedBefore!==frame.reservedAfter||frame.reservedAfter!==view.budget.reserved||frame.spentBefore!==frame.spentAfter||frame.spentAfter!==view.budget.spent||new Set(frame.accounts.map(a=>a.id)).size!==frame.accounts.length||frame.accounts.filter(a=>a.id==='personal').length!==1||frame.accounts.some(a=>{const rows=view.accounts.filter(row=>row.accountId===a.id);return rows.length!==1||a.before!==a.after||rows[0]!.availableFen!==a.after}))return null
 const members=proof.members
 if(members.length<2||members.length>3||new Set(members.map(m=>m.id)).size!==members.length||!members.some(m=>m.kind==='life')||!members.some(m=>m.kind==='research'))return null
 const all=[...features.life.jobs.filter(j=>j.status==='completed'&&j.completeAt===view.date).map(j=>j.id),...features.market.researches.filter(r=>r.status==='completed'&&r.completeAt===view.date).map(r=>r.id)]
 if(all.length!==members.length||new Set(all).size!==all.length||all.some(id=>!members.some(m=>m.id===id)))return null
 const lines:string[]=[]
 for(const m of members){
  if(m.completeAt!==view.date)return null
  if(m.kind==='life'){
   const rows=features.life.jobs.filter(j=>j.id===m.id),j=rows[0]
   if(rows.length!==1||!j||j.status!=='completed'||j.accountId!=='personal'||j.personId!==null||j.promiseId!==null||j.actionId!==m.actionId||j.kind!==m.work||j.completeAt!==m.completeAt||j.costFen!==m.costFen||j.actionPoints!==m.actionPoints||!Number.isSafeInteger(m.costFen)||m.costFen<0||m.actionPoints!==1)return null
   if(m.work==='rest'){if(j.result!=='rested')return null}
   else if(j.result!=='workspace_ready'||!features.life.scene.workspaceCompleted||features.life.scene.workspaceJobId!==j.id||features.life.scene.workspaceCompletedAt!==j.completeAt||features.life.scene.workspaceCostFen!==j.costFen)return null
   lines.push((m.work==='rest'?'休整结束':'桌椅与照明已改善')+'（原投入'+moneyText(m.costFen)+' / '+m.actionPoints+'点）')
  }else{
   const rows=features.market.researches.filter(r=>r.id===m.id),r=rows[0],term=researchTerms[m.definitionId]
   if(rows.length!==1||!r||r.status!=='completed'||r.actionId!==m.actionId||r.definitionId!==m.definitionId||r.completeAt!==m.completeAt||!term||term.entitlement!==m.entitlementId)return null
   const original=playerThread(p,{runId:view.runId,kind:'market',accountId:'personal',entityKind:'research',entityId:r.id})
   if(!researchRoomCopy(p,original))return null
   lines.push(term.label)
  }
 }
 const coversSelected=members.some(m=>m.id===f.entityId&&(m.kind==='life'&&f.kind==='life'||m.kind==='research'&&f.kind==='market'&&f.entityKind==='research'))
 return {brief:lines.join('；')+'。已用行动不返还，买卖仍由你决定。',coversSelected}
}

/** Current obligations retain their original Today priority. Only an exact
 * single personal-cost sentence already included in the result can be consolidated. */
export function todayPersonalResultReading(p:Input,today:TodayThreadView,notice:Notice|undefined,situation:string|null):{readonly title:string|null;readonly brief:string|null;readonly line:string|null;readonly coversSituation:boolean}|null{
 const source=today.source,t=today.primary.thread
 if(source.runId!==p.view.runId||source.revision!==p.view.revision||source.date!==p.view.date||source.quarter!==p.features.workbench.quarter||today.responsibilityOverrideNeeded)return null
 const next=completedDayChoice(p,today),single=next?personalResultScene(p,t,next,notice):null,parallel=notice?parallelResultReading(p,t,notice):null
 if(!single&&!parallel)return null
 const brief=parallel?.brief??single?.brief??null
 let coversSituation=false
 if(brief&&t.focus.kind==='life'){
  const rows=p.features.life.jobs.filter(j=>j.id===t.focus.entityId),j=rows[0],exact=notice?personalResultFacts(p,t,notice):null
  coversSituation=!!j&&rows.length===1&&(single?.brief!==null&&exact!==null&&situation===exact||!!(single?.brief||parallel?.coversSelected)&&situation===j.completeAt+'实际完成，投入'+moneyText(j.costFen)+'；结果不返还行动，也不产生收入。')
 }
 const noContinuing=todayReadingGroups(today.ongoing).continuing.length===0
 const line=single&&!brief&&noContinuing&&t.focus.kind==='market'&&t.focus.entityKind==='research'?researchRoomCopy(p,t)?.facts.join(' ')??null:null
 return {title:noContinuing?single?.title??null:null,brief,line,coversSituation}
}
