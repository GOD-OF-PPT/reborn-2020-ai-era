import {isoDate} from '../core/calendar.ts'
import {assertJsonInput,copyJson} from '../core/json-input.ts'
import {hashValue} from '../core/hash.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {RunSession,SessionResult} from './session.ts'
import type {WorkbenchProjection} from './workbench-projection.ts'
import {playableAdvanceDate,PLAYABLE_THROUGH} from './playable-advance.ts'
import {publicFeedbackSince,type PublicFeedback} from './public-feedback.ts'

type View=RunSession['view']
export function captureWaitScope(raw:CommandEnvelope,before:View):{readonly status:'valid';readonly scope:CommandEnvelope;readonly targetDate:string}|{readonly status:'rejected';readonly reasonCodes:readonly string[];readonly targetDate:string}{
 let targetDate=before.date
 const reject=(code:string)=>({status:'rejected' as const,reasonCodes:[code],targetDate})
 try{
  assertJsonInput(raw);const scope=copyJson(raw)
  if(scope.kind!=='AdvanceTime'||scope.runId!==before.runId||scope.expectedRevision!==before.revision||scope.actorId!=='player')return reject('STALE_REVISION')
  const body=scope.payload
  if(body===null||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(key=>key!=='date')||!('date'in body)||typeof body.date!=='string')return reject('INVALID_PAYLOAD')
  isoDate(body.date);targetDate=body.date
  if(targetDate<before.date)return reject('CANNOT_REWIND_TIME')
  if(targetDate>PLAYABLE_THROUGH||before.phase!=='playing')return reject('PREVIEW_RANGE_ENDED')
  return {status:'valid',scope,targetDate}
 }catch{return reject('INVALID_PAYLOAD')}
}
export interface PublicWaitStep {readonly commandId:string;readonly date:string;readonly revisionBefore:number;readonly revisionAfter:number}
export interface PublicWaitResult {
 readonly status:'saved'|'stopped'|'rejected'|'unsaved'|'conflict'
 readonly reasonCodes:readonly string[]
 readonly targetDate:string
 readonly before:View
 readonly lastSaved:View
 readonly lastBefore:View|null
 readonly current:View
 readonly steps:readonly PublicWaitStep[]
 readonly feedback:readonly PublicFeedback[]
 readonly failed: {readonly command:CommandEnvelope;readonly before:View}|null
}
/** The controller supplies an exclusive session and only the original time-command authority. */
export interface PublicWaitPort {
 current():View
 preview(command:CommandEnvelope):CommandPreview
 submit(command:CommandEnvelope):Promise<SessionResult>
 stopping():boolean
}

/** Execute original envelopes, observing public facts after each durable save.
 * No rule model, private timeline or future simulation is available to this function.
 */
export async function executePublicWait(raw:CommandEnvelope,port:PublicWaitPort):Promise<PublicWaitResult>{
 const before=port.current(),steps:PublicWaitStep[]=[],feedback:PublicFeedback[]=[]
 let lastSaved=before,lastBefore:View|null=null,targetDate=before.date,failed:PublicWaitResult['failed']=null
 const result=(status:PublicWaitResult['status'],reasonCodes:readonly string[]=[]):PublicWaitResult=>({status,reasonCodes,targetDate,before,lastSaved,lastBefore,current:port.current(),steps:[...steps],feedback:[...feedback],failed})
 let scope:CommandEnvelope
 try{
  const captured=captureWaitScope(raw,before);targetDate=captured.targetDate
  if(captured.status==='rejected')return result('rejected',captured.reasonCodes)
  scope=captured.scope
  const preview=port.preview(scope)
  if(!preview.allowed)return result('rejected',preview.reasonCodes)
 }catch{return result('rejected',['INVALID_PAYLOAD'])}
 for(let index=0;index<256;index++){
  if(port.stopping())return result('stopped',['WAIT_STOP_REQUESTED'])
  const current=port.current()
  if(current.runId!==before.runId||current.revision!==lastSaved.revision)return result('stopped',['STALE_REVISION'])
  if(current.readOnly)return result('rejected',['READ_ONLY_SESSION'])
  if(current.hasCandidate)return result('unsaved',['UNSAVED_CANDIDATE'])
  if(current.saveStatus==='conflict')return result('conflict',['RELOAD_REQUIRED'])
  if(current.saveStatus!=='saved'||current.busy)return result('stopped',['SAVE_IN_PROGRESS'])
  if(current.phase!=='playing')return result('stopped',['PREVIEW_RANGE_ENDED'])
  const w=current.features.workbench as WorkbenchProjection|undefined
  if(!w)return result('stopped',['CLOCK_PREVIEW_UNAVAILABLE'])
  let date:string
  try{
   isoDate(w.progression.nextDate)
   const requested=w.progression.nextDate<targetDate?w.progression.nextDate:targetDate
   date=playableAdvanceDate(w,current.date,requested)
  }catch{return result('stopped',['CLOCK_PREVIEW_UNAVAILABLE'])}
  // The first same-day command may finish a real pending phase. A repeated
  // identical public stop does not authorize an empty-command loop.
  if(index>0&&date===current.date&&steps.at(-1)?.date===date)return result('stopped',['WAIT_NO_PUBLIC_PROGRESS'])
  const command:CommandEnvelope={runId:scope.runId,actorId:scope.actorId,commandId:date===targetDate?scope.commandId:'wait-step-'+hashValue([scope.runId,scope.commandId,index]).slice(0,32),expectedRevision:current.revision,kind:'AdvanceTime',payload:{date}}
  let preview:CommandPreview
  try{preview=port.preview(command)}catch{failed={command,before:current};return result('stopped',['CLOCK_PREVIEW_UNAVAILABLE'])}
  if(!preview.allowed){failed={command,before:current};return result('rejected',preview.reasonCodes)}
  let saved:SessionResult
  try{saved=await port.submit(command)}catch{failed={command,before:current};return result('stopped',['CLOCK_WAIT_INTERRUPTED'])}
  if(saved.status!=='saved'){
   failed={command,before:current}
   return result(saved.status==='unsaved'?'unsaved':saved.status==='conflict'?'conflict':'rejected',saved.reasonCodes.length?saved.reasonCodes:['STALE_REVISION'])
  }
  const after=port.current(),receipt=after.receipts.at(-1)
  if(after.runId!==before.runId||after.revision!==current.revision+1||after.hasCandidate||after.saveStatus!=='saved'||receipt?.commandId!==command.commandId||receipt.kind!=='AdvanceTime'||receipt.revisionAfter!==after.revision){failed={command,before:current};return result('stopped',['STALE_REVISION'])}
  steps.push({commandId:command.commandId,date:after.date,revisionBefore:current.revision,revisionAfter:after.revision})
  lastBefore=current;lastSaved=after
  try{feedback.push(...publicFeedbackSince(current,after))}catch{return result('stopped',['CLOCK_FEEDBACK_UNAVAILABLE'])}
  if(after.date>=targetDate)return result('saved')
  if(feedback.some(row=>row.attention==='pause'))return result('stopped')
 }
 return result('stopped',['WAIT_STEP_LIMIT'])
}
