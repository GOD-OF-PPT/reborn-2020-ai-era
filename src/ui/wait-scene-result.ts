import type {PublicWaitResult} from '../application/public-wait.ts'
import type {SessionResult} from '../application/session.ts'
import {publicFeedbackSince} from '../application/public-feedback.ts'
import {committedEcho,type EchoFrame} from './SceneEcho.tsx'
import {savedSceneResult} from './scene-result.ts'
import {sceneCashResult} from './scene-cash-result.ts'
import {equityReportBrief} from './equity-invitation-result.ts'
import {relayPrepaidSupportBrief} from './relay-support-settlement.ts'
import {waitCauseBrief} from './scene-feedback-copy.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'

const first=(text:string)=>text.includes('。')?text.slice(0,text.indexOf('。')+1):text
function prepaidSupportRangeBrief(before:PlayingView,last:PlayingView,paused:PublicWaitResult['feedback']):string|null{
 const old=(before.features as unknown as PlayFeatures).relay,features=last.features as unknown as PlayFeatures,relay=features.relay
 if(!old||!relay)return null
 const completed=relay.periods.filter(period=>{
  const previous=old.periods.filter(row=>row.id===period.id&&row.businessId===period.businessId),job=period.supportJob
  return previous.length===1&&previous[0]!.feePostedAt===null&&previous[0]!.compensatedAt===null&&job?.status==='completed'&&job.completeAt===last.date&&before.date<job.completeAt&&previous[0]!.supportJob?.id===job.id&&['planned','running'].includes(previous[0]!.supportJob!.status)
 })
 if(completed.length!==1)return null
 const period=completed[0]!,businesses=relay.businesses.filter(row=>row.id===period.businessId),stations=relay.stations.filter(row=>row.businessId===period.businessId),ownedIds=new Set([period.id,period.supportJob!.id])
 if(businesses.length!==1||stations.length!==1||paused.some(row=>!ownedIds.has(row.sourceId)))return null
 const accountId=businesses[0]!.accountId,target={kind:'period' as const,runId:last.runId,accountId,businessId:period.businessId,stationId:stations[0]!.id,periodId:period.id}
 return relayPrepaidSupportBrief({view:last,features,accountId},target)
}
/** A range must prove every original time receipt, not merely have a larger revision. */
export function waitSequenceValid(result:PublicWaitResult,current:PlayingView):boolean{
 const before=result.before,last=result.lastSaved,steps=result.steps
 if(!steps.length||before.runId!==last.runId||current.runId!==last.runId||before.saveStatus!=='saved'||before.hasCandidate||last.saveStatus!=='saved'||last.hasCandidate||last.revision!==before.revision+steps.length||current.revision!==last.revision||current.date!==last.date||last.receipts.length!==before.receipts.length+steps.length||current.receipts.length!==last.receipts.length)return false
 if(!before.receipts.every((row,index)=>{const next=last.receipts[index];return next?.commandId===row.commandId&&next.kind===row.kind&&next.revisionAfter===row.revisionAfter}))return false
 let revision=before.revision,date=before.date
 const ids=new Set<string>()
 for(const [index,step]of steps.entries()){
  const receipt=last.receipts[before.receipts.length+index]
  if(ids.has(step.commandId)||step.revisionBefore!==revision||step.revisionAfter!==revision+1||step.date<date||receipt?.commandId!==step.commandId||receipt.kind!=='AdvanceTime'||receipt.revisionAfter!==step.revisionAfter)return false
  ids.add(step.commandId);revision=step.revisionAfter;date=step.date
 }
 return date===last.date&&current.receipts.every((row,index)=>{const saved=last.receipts[index];return row.commandId===saved?.commandId&&row.kind===saved.kind&&row.revisionAfter===saved.revisionAfter})&&JSON.stringify(current.accounts)===JSON.stringify(last.accounts)&&JSON.stringify(current.budget)===JSON.stringify(last.budget)
}

export function waitSceneResult(result:PublicWaitResult,current:PlayingView):{text:string;brief:string;frame:EchoFrame}|null{
 if(!waitSequenceValid(result,current)||!result.lastBefore||result.lastBefore.runId!==result.lastSaved.runId||result.lastBefore.revision!==result.lastSaved.revision-1)return null
 const before=result.before,last=result.lastSaved,features=last.features as unknown as PlayFeatures,old=before.features as unknown as PlayFeatures
 const label=(id:string)=>id==='personal'?'个人':({a_share:'模拟投资',ai_video:'视频',ai_course:'课程',api_relay:'中转服务',deepseek_opportunity:'生态服务'} as Record<string,string>)[features.workbench.routes.find(r=>r.accountId===id)?.id??'']??'经营'
 const cash=sceneCashResult(old.workbench.finance,features.workbench.finance,before.date,last.date,label),cause=savedSceneResult('AdvanceTime','等原安排的反馈',result.lastBefore,last,{includeCash:false}),frame=committedEcho(before,last)
 if(!frame)return null
 const partial=result.status==='unsaved'||result.status==='conflict',stopped=result.reasonCodes.includes('WAIT_STOP_REQUESTED'),retryOnly=result.reasonCodes.includes('WAIT_RETRY_SAVED_ONLY'),retained=result.feedback.filter(row=>row.attention==='retain'),paused=result.feedback.filter(row=>row.attention==='pause'),meaning=[...new Set(paused.map(row=>row.label))].join(' '),important=paused.find(row=>['responsibility','course-update','invitation'].includes(row.kind))
 const retryNote=last.date<result.targetDate?'原候选已经保存；余下的等候仍由你重新选择。':'原候选已经保存，没有额外推进日子。'
 const note=partial?'这些日子已经保存；接下来这段等候尚未保存，请处理原候选。':stopped?'已经按你的选择停下；已发生的日子与原约保留。':retryOnly?retryNote:last.date<result.targetDate?'日子先停在这次真实反馈，剩下的安排仍在原日历里。':''
 const text=[cash,cause,meaning,'日历从'+before.date+'走到'+last.date+'。',retained.length?'这期间有'+new Set(retained.map(row=>row.sourceId)).size+'笔自己的原款到期，未收款仍保留，逐笔依据可翻原账。':null,note].filter(Boolean).join(' ')
 const singleReport=!cash&&retained.length===0?equityReportBrief(before,last,paused):null
 const supportBrief=retained.length===0?prepaidSupportRangeBrief(before,last,paused):null
 const causeBrief=singleReport??supportBrief??waitCauseBrief(last.date,cause,paused,old.firstOrder,features.firstOrder)
 const wageAlreadySummarized=!!cash&&first(cause)===last.date+'。'&&paused.length===1&&paused[0]!.kind==='result'&&causeBrief===paused[0]!.label&&last.operations?.payroll.some(row=>row.id===paused[0]!.sourceId&&row.kind==='salary'&&row.amountFen>0&&row.through===last.date&&!before.operations?.payroll.some(old=>old.id===row.id))
 const brief=[stopped?'已经按你的选择停下。':null,cash?first(cash):null,wageAlreadySummarized?null:causeBrief,singleReport||important?.label===causeBrief?null:important?.label,partial?'已保存部分保留，后续等候尚未保存。':retryOnly?retryNote:null].filter(Boolean).join(' ')
 return {text,brief,frame}
}

/** Completing the exact original candidate is not authorization to resume the range. */
export function checkpointResultAfterRetry(pending:PublicWaitResult,saved:PublicWaitResult,current:PlayingView):PublicWaitResult|null{
 if(!pending.failed||!['saved','stopped'].includes(saved.status)||saved.before.runId!==pending.before.runId||saved.before.revision!==pending.before.revision||saved.before.date!==pending.before.date||saved.targetDate!==pending.targetDate||saved.failed!==null||saved.reasonCodes.join('|')!=='WAIT_RETRY_SAVED_ONLY')return null
 if(!pending.steps.every((step,index)=>{const row=saved.steps[index];return row?.commandId===step.commandId&&row.date===step.date&&row.revisionBefore===step.revisionBefore&&row.revisionAfter===step.revisionAfter}))return null
 const anchored:PublicWaitResult={...saved,before:pending.before,current,lastSaved:current}
 return waitSequenceValid(anchored,current)?anchored:null
}

/** Recovery for an original single-step store without checkpoint support. */
export function waitResultAfterRetry(pending:PublicWaitResult,receipt:Extract<SessionResult,{status:'saved'|'duplicate'}>['receipt'],current:PlayingView):PublicWaitResult|null{
 const failed=pending.failed,before=pending.lastSaved
 if(!failed||receipt.commandId!==failed.command.commandId||receipt.kind!=='AdvanceTime'||current.runId!==before.runId||current.revision!==before.revision+1||current.saveStatus!=='saved'||current.hasCandidate||current.receipts.at(-1)?.commandId!==receipt.commandId)return null
 const resumed:PublicWaitResult={...pending,status:current.date>=pending.targetDate?'saved':'stopped',reasonCodes:['WAIT_RETRY_SAVED_ONLY'],lastBefore:failed.before,lastSaved:current,current,steps:[...pending.steps,{commandId:receipt.commandId,date:current.date,revisionBefore:before.revision,revisionAfter:current.revision}],feedback:[...pending.feedback,...publicFeedbackSince(failed.before,current)],failed:null}
 return waitSequenceValid(resumed,current)?resumed:null
}
