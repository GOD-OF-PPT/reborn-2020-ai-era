import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {EchoFrame} from './SceneEcho.tsx'
import {sceneTimeNarrative} from './SceneEcho.tsx'
import {isoDate} from '../core/calendar.ts'

type Input=Pick<GamePanelProps,'view'|'features'>
/** The generic start notice expires once no life job is running. */
export function personalStartNoticeExpired(p:Input,notice:unknown):boolean{
  return notice==='生活工作已实际开始；完成与场景仍按真实日期处理。'&&!p.features.life.jobs.some(job=>job.status==='running')
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
