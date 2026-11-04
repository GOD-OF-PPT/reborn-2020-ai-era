import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {EchoFrame} from './SceneEcho.tsx'
import {sceneTimeNarrative} from './SceneEcho.tsx'
import {isoDate} from '../core/calendar.ts'
import {personalCompletionCause} from './wait-feedback-reading.ts'
import {moneyText} from './game-text.ts'

type Input=Pick<GamePanelProps,'view'|'features'>
/** The generic start notice expires once no life job is running. */
export function personalStartNoticeExpired(p:Input,notice:unknown,thread?:PlayerThreadView):boolean{
  if(notice!=='生活工作已实际开始；完成与场景仍按真实日期处理。')return false
  if(!p.features.life.jobs.some(job=>job.status==='running'))return true
  const job=thread?personalJob(p,thread):null,last=p.view.receipts.at(-1)
  return !!job&&job.status==='running'&&last?.kind==='StartLifeWork'&&last.commandId===job.originCommandId&&last.revisionAfter===p.view.revision
}


function personalJob(p:Input,thread:PlayerThreadView){
  const focus=thread.focus
  if(focus.kind!=='life'||focus.runId!==p.view.runId||focus.accountId!=='personal'||focus.entityId===null||thread.focusStatus==='invalid'||thread.responsibilityOverrideNeeded||!['current','carry'].includes(thread.focusScope))return null
  const jobs=p.features.life.jobs.filter(job=>job.id===focus.entityId)
  if(jobs.length!==1)return null
  const job=jobs[0]!
  if(job.accountId!=='personal'||job.personId!==null||job.promiseId!==null||!['rest','workspace'].includes(job.kind)||job.kind!==focus.selection)return null
  try{isoDate(p.view.date);isoDate(job.startAt);isoDate(job.completeAt)}catch{return null}
  return job.startAt<=p.view.date&&job.completeAt>job.startAt?job:null
}

/** Add only current public progress to a date-only echo. Full event text stays intact. */
export function personalDayProgressBrief(p:Input,thread:PlayerThreadView,notice:{date:string;text:string;brief?:string;frame:EchoFrame|null}):string|null{
  const job=personalJob(p,thread),frame=notice.frame
  if(!job||job.status!=='running'||p.view.date>=job.completeAt||notice.date!==p.view.date||p.view.saveStatus!=='saved'||p.view.hasCandidate)return null
  const orderFeedback=notice.text.includes('那份原委托，有了新的实际反馈。')
    ?p.features.firstOrder.status==='expired'?'委托答复期限已过。':'原委托有了新反馈。'
    :''
  const brief=notice.brief??sceneTimeNarrative(notice.date,notice.text)
  if(brief!==p.view.date+'。'&&(!orderFeedback||brief!==orderFeedback))return null
  if(!frame||frame.dateAfter!==p.view.date||frame.dateBefore>=frame.dateAfter||frame.quarterChanged||frame.pointsBefore!==frame.pointsAfter||frame.reservedBefore!==frame.reservedAfter||frame.spentBefore!==frame.spentAfter||frame.accounts.some(account=>account.before!==account.after))return null
  try{isoDate(frame.dateBefore)}catch{return null}
  if(frame.pointsAfter!==p.view.budget.available||frame.reservedAfter!==p.view.budget.reserved||frame.spentAfter!==p.view.budget.spent)return null
  if(frame.accounts.filter(account=>account.id==='personal').length!==1||new Set(frame.accounts.map(account=>account.id)).size!==frame.accounts.length)return null
  if(frame.accounts.some(account=>{
    const current=p.view.accounts.filter(row=>row.accountId===account.id)
    return current.length!==1||current[0]!.availableFen!==account.after
  }))return null
  const activity=job.kind==='rest'?'休整还在继续':'住处改善还在进行'
  return `${orderFeedback}${activity}，预计${job.completeAt}结束。`
}

/** A visible completed personal rest can lead to a fresh, explicit work choice. */
export function personalRestCompleted(p:Input,thread:PlayerThreadView):boolean{
  const job=personalJob(p,thread)
  return !!job&&job.kind==='rest'&&job.status==='completed'&&job.completeAt<=p.view.date&&thread.outcome==='actual'
}

/** A visible exact completion echo already carries the date and outcome.
 * Keep its original paid cost and consumed action beside it. */
export function personalResultFacts(p:Input,thread:PlayerThreadView,notice:{date:string;text:string;brief?:string;frame:EchoFrame|null}):string|null {
 const job=personalJob(p,thread),frame=notice.frame,last=p.view.receipts.at(-1)
 if(!job||job.status!=='completed'||job.completeAt!==p.view.date||p.view.readOnly||p.view.busy||p.view.hasCandidate||p.view.saveStatus!=='saved'||!frame||frame.quarterChanged||notice.date!==p.view.date||frame.dateAfter!==p.view.date||frame.dateBefore>=job.completeAt||last?.kind!=='AdvanceTime'||last.revisionAfter!==p.view.revision)return null
 if(p.features.life.jobs.filter(j=>j.status==='completed'&&j.completeAt===p.view.date).length!==1||!Number.isSafeInteger(job.costFen)||job.costFen<0||!Number.isSafeInteger(job.actionPoints)||job.actionPoints<0)return null
 if(frame.pointsBefore!==frame.pointsAfter||frame.pointsAfter!==p.view.budget.available||frame.reservedBefore!==frame.reservedAfter||frame.reservedAfter!==p.view.budget.reserved||frame.spentBefore!==frame.spentAfter||frame.spentAfter!==p.view.budget.spent)return null
 if(new Set(frame.accounts.map(a=>a.id)).size!==frame.accounts.length||frame.accounts.filter(a=>a.id==='personal').length!==1||frame.accounts.some(a=>{const accounts=p.view.accounts.filter(row=>row.accountId===a.id);return a.before!==a.after||accounts.length!==1||accounts[0]!.availableFen!==a.after}))return null
 const cause=personalCompletionCause(job,p.view.date)
 if(!cause||notice.brief!==cause)return null
 const tail=' 日历从'+frame.dateBefore+'走到'+frame.dateAfter+'。',stop=' 日子先停在这次真实反馈，剩下的安排仍在原日历里。'
 if(notice.text!==cause+tail&&notice.text!==cause+tail+stop)return null
 return `已付${moneyText(job.costFen)} / 已用${job.actionPoints}点；行动不返还，不产生收入。`
}
