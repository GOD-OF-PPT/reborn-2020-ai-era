import type {PublicFeedback} from '../application/public-feedback.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {isoDate} from '../core/calendar.ts'

type LifeJob=PlayFeatures['life']['jobs'][number]
const genericCompleted='一份原工作已经有了实际结果。'
const researchCompleted='原研究有了实际进展。'
const researchNames:Record<string,string>={'market-overview':'公开资料整理','market-foundation-course':'模拟交易规则研习','simulation-special-study':'本局试验段研习'}
const day=(value:string)=>{try{return isoDate(value)===value}catch{return false}}

/** Exact existing authored cause, used only to recognize a redundant add-on. */
export function personalCompletionCause(job:LifeJob,date:string):string|null {
 if(job.kind==='rest'&&job.result==='rested')return date+'，1次休整已经结束，行动与花费照账保留。'
 if(job.kind==='workspace'&&job.result==='workspace_ready')return date+'，桌椅与照明已经改善，这次投入的钱和时间仍记在账上。'
 return null
}

/** Reading only. Original feedback identities, pause classification, money and
 * unfamiliar consequences remain with their producers. */
export function waitFeedbackReading(previous:PlayingView,current:PlayingView,cause:string,rows:readonly PublicFeedback[]):string[] {
 const before=previous.features as unknown as PlayFeatures,after=current.features as unknown as PlayFeatures
 return rows.flatMap(row=>{
  if(previous.runId!==current.runId||previous.date>current.date||row.kind!=='job'||row.attention!=='pause'||row.key!=='job:'+row.sourceId+':"completed"'||![genericCompleted,researchCompleted].includes(row.label))return [row.label]
  const lives=after.life.jobs.filter(job=>job.id===row.sourceId),studies=after.market.researches.filter(job=>job.id===row.sourceId)
  if(lives.length===1&&studies.length===0&&row.label===genericCompleted){
   const job=lives[0]!,old=before.life.jobs.filter(prior=>prior.id===job.id)
   if(old.length!==1||old[0]!.status!=='running'||job.status!=='completed'||!day(job.completeAt)||job.completeAt<=previous.date||job.completeAt>current.date||!['kind','accountId','personId','promiseId','originCommandId','startAt','completeAt'].every(key=>old[0]![key as keyof LifeJob]===job[key as keyof LifeJob]))return [row.label]
   const exact=personalCompletionCause(job,current.date)
   if(exact&&cause===exact&&job.personId===null&&job.promiseId===null&&after.life.jobs.filter(j=>j.status==='completed'&&j.completeAt>previous.date&&j.completeAt<=current.date).length===1)return []
   if(job.personId===null&&job.promiseId===null&&job.kind==='rest'&&job.result==='rested')return ['这次休整已经结束。']
   if(job.personId===null&&job.promiseId===null&&job.kind==='workspace'&&job.result==='workspace_ready')return ['这次桌椅与照明改善已经完成。']
  }
  if(studies.length===1&&lives.length===0&&row.label===researchCompleted){
   const job=studies[0]!,old=before.market.researches.filter(prior=>prior.id===job.id)
   if(old.length!==1||old[0]!.status!=='running'||job.status!=='completed'||!day(job.completeAt)||job.completeAt<=previous.date||job.completeAt>current.date||old[0]!.definitionId!==job.definitionId||old[0]!.actionId!==job.actionId||old[0]!.startAt!==job.startAt||old[0]!.completeAt!==job.completeAt||!Object.hasOwn(researchNames,job.definitionId))return [row.label]
   const exact=current.date+'，个人账户：1项市场研究已完成，只整理已公开线索；这不是未来价格，也没有替你下委托。'
   if(cause===exact&&after.market.researches.filter(j=>j.status==='completed'&&j.completeAt>previous.date&&j.completeAt<=current.date).length===1)return []
   return [researchNames[job.definitionId]+'已经完成；买卖仍由你决定。']
  }
  return [row.label]
 })
}
