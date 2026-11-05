import type {PlayingView,PlayFeatures} from './game-types.ts'
import type {PublicFeedback} from '../application/public-feedback.ts'
import {addDays,isoDate} from '../core/calendar.ts'
import {canonicalJson} from '../core/identity.ts'

const day=(date:string)=>{try{return isoDate(date)===date}catch{return false}}
const natural=(n:number)=>Number.isSafeInteger(n)&&n>=0
const studies:Record<string,{readonly result:string;readonly entitlement:string|null}>={
 'market-overview':{result:'公开资料已整理好',entitlement:null},
 'market-foundation-course':{result:'规则研习资格已取得',entitlement:'sim-researched'},
 'simulation-special-study':{result:'试验段研习资格已取得',entitlement:'sim-experimental-access'},
}
/** Exact before/after personal completions only. The caller retains its original
 * cash summary, full text, dates, resource frame and every command boundary. */
export function personalParallelFeedback(previous:PlayingView,current:PlayingView,cause:string,feedback:readonly PublicFeedback[]):string|null{
 const before=previous.features as unknown as PlayFeatures,after=current.features as unknown as PlayFeatures,last=current.receipts.at(-1)
 if(previous.runId!==current.runId||current.phase!=='playing'||current.busy||current.readOnly||current.hasCandidate||current.saveStatus!=='saved'||previous.saveStatus!=='saved'||previous.hasCandidate||current.revision!==previous.revision+1||last?.kind!=='AdvanceTime'||last.revisionAfter!==current.revision||!day(previous.date)||!day(current.date)||previous.date>=current.date||after.life.asOf!==current.date||after.workbench.atQuarterEnd||after.workbench.pause||after.workbench.progression.requiresDelivery)return null
 const life=after.life.jobs.filter(j=>j.status==='completed'&&j.completeAt>previous.date&&j.completeAt<=current.date),research=after.market.researches.filter(r=>r.status==='completed'&&r.completeAt>previous.date&&r.completeAt<=current.date)
 if(!life.length||!research.length||life.length+research.length>3||new Set(life.map(j=>j.id)).size!==life.length||new Set(research.map(r=>r.id)).size!==research.length||new Set(research.map(r=>r.definitionId)).size!==research.length||new Set([...life.map(j=>j.id),...research.map(r=>r.id)]).size!==life.length+research.length)return null
 if(previous.accounts.filter(a=>a.accountId==='personal').length!==1||current.accounts.filter(a=>a.accountId==='personal').length!==1)return null
 for(const job of life){
  const originals=before.life.jobs.filter(j=>j.id===job.id),old=originals[0]
  if(originals.length!==1||!old||old.status!=='running'||after.life.jobs.filter(j=>j.id===job.id).length!==1||job.accountId!=='personal'||job.personId!==null||job.promiseId!==null||job.reference!==null||job.completeAt!==current.date||!day(job.startAt)||job.startAt>previous.date||!natural(job.costFen)||job.actionPoints!==1||job.interruptedBy!==null||job.interruptionReason!==null)return null
  const keys=['id','kind','personId','promiseId','reference','originCommandId','actionId','accountId','resourceId','startAt','completeAt','costFen','actionPoints'] as const
  if(keys.some(key=>canonicalJson(old[key])!==canonicalJson(job[key])))return null
  if(job.kind==='rest'){if(job.result!=='rested')return null}
  else if(job.kind==='workspace'){if(job.result!=='workspace_ready'||!after.life.scene.workspaceCompleted||after.life.scene.workspaceJobId!==job.id)return null}
  else return null
 }
 for(const r of research){
  const originals=before.market.researches.filter(j=>j.id===r.id),old=originals[0],known=studies[r.definitionId],terms=after.workbench.researches.filter(t=>t.id===r.definitionId),term=terms[0]
  if(originals.length!==1||!old||old.status!=='running'||after.market.researches.filter(j=>j.id===r.id).length!==1||!known||terms.length!==1||!term?.state||term.state.id!==r.id||term.state.status!=='completed'||term.entitlementId!==known.entitlement||r.completeAt!==current.date||!day(r.startAt)||r.startAt>previous.date||r.startAt>=r.completeAt||!Number.isSafeInteger(term.days)||term.days<1||term.days>365||addDays(r.startAt,term.days)!==r.completeAt)return null
  if(['id','definitionId','startAt','completeAt','actionId'].some(key=>old[key as keyof typeof r]!==r[key as keyof typeof r]))return null
  if(known.entitlement){const permissions=after.market.permissions.filter(p=>p.id===known.entitlement&&p.sourceId===r.id);if(permissions.length!==1||permissions[0]!.date!==r.completeAt)return null}
 }
 const ids=new Set([...life.map(j=>j.id),...research.map(r=>r.id)])
 if(feedback.length!==ids.size||new Set(feedback.map(f=>f.sourceId)).size!==feedback.length||feedback.some(f=>!ids.has(f.sourceId)||f.kind!=='job'||f.attention!=='pause'||f.key!=='job:'+f.sourceId+':"completed"'||f.label!==(research.some(r=>r.id===f.sourceId)?'原研究有了实际进展。':'一份原工作已经有了实际结果。')))return null
 const workspace=life.filter(j=>j.kind==='workspace'),rest=life.filter(j=>j.kind==='rest')
 if(workspace.length>1||rest.length>1)return null
 const parts=[`个人账户：${research.length}项市场研究已完成，只整理已公开线索；这不是未来价格，也没有替你下委托`,...(workspace.length?['桌椅与照明已经改善，这次投入的钱和时间仍记在账上']:[]),...(rest.length?[`${rest.length}次休整已经结束，行动与花费照账保留`]:[])]
 if(cause!==current.date+'，'+parts.join('；')+'。')return null
 return [...(workspace.length?['桌椅与照明已改善']:[]),...(rest.length?['休整结束']:[]),...research.map(r=>studies[r.definitionId]!.result)].join('；')+'。'
}
