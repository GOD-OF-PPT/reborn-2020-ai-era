import {isoDate} from '../core/calendar.ts'
import {hashValue} from '../core/hash.ts'
import type {CommandEnvelope,GameRun,ProposedRun} from '../core/run-types.ts'
import type {CommandPreview,evaluateCommand} from '../core/commands.ts'
import {MAX_WAIT_CHECKPOINT_STEPS,type WaitCheckpoint} from '../persistence/wait-checkpoint.ts'
import {playableAdvanceDate} from './playable-advance.ts'
import {inspectPublicWaitTransition,type PublicFeedback,type WaitMeaningView} from './public-feedback.ts'
import {captureWaitScope,type PublicWaitResult,type PublicWaitStep} from './public-wait.ts'
import type {SessionView,SessionResult} from './session.ts'
import type {WorkbenchProjection} from './workbench-projection.ts'

export interface WaitCheckpointContext {
 readonly scope:CommandEnvelope
 readonly targetDate:string
 readonly before:SessionView
 readonly prefixSteps:readonly PublicWaitStep[]
 readonly prefixFeedback:readonly PublicFeedback[]
 readonly pendingSteps:readonly PublicWaitStep[]
 readonly pendingFeedback:readonly PublicFeedback[]
 readonly previousRun:GameRun
}
export interface CheckpointWaitPort {
 current():SessionView
 run():GameRun
 preview(command:CommandEnvelope):CommandPreview
 propose(run:GameRun,command:CommandEnvelope):ReturnType<typeof evaluateCommand>
 project(run:GameRun):WaitMeaningView
 commit(checkpoint:WaitCheckpoint,context:WaitCheckpointContext):Promise<SessionResult>
 previousSaved(run:GameRun):SessionView
 stopping():boolean
 yieldControl():Promise<void>
}

/** Private Worker execution. Logical steps stay private until their single
 * checkpoint commits; each step is still an original, independently validated
 * AdvanceTime envelope. No hidden queue or speculative future is inspected.
 */
export async function executeCheckpointedWait(raw:CommandEnvelope,before:SessionView,port:CheckpointWaitPort):Promise<PublicWaitResult>{
 const steps:PublicWaitStep[]=[],feedback:PublicFeedback[]=[]
 let lastSaved=before,lastBefore:SessionView|null=null,targetDate=before.date,failed:PublicWaitResult['failed']=null,scope:CommandEnvelope
 let baseRun=port.run(),workingRun=baseRun,previousRun=baseRun,working:WaitMeaningView=before
 let commands:CommandEnvelope[]=[],pendingSteps:PublicWaitStep[]=[],pendingFeedback:PublicFeedback[]=[],lastProposal:ProposedRun|null=null
 const result=(status:PublicWaitResult['status'],reasonCodes:readonly string[]=[]):PublicWaitResult=>({status,reasonCodes,targetDate,before,lastSaved,lastBefore,current:port.current(),steps:[...steps],feedback:[...feedback],failed})
 try{
  const captured=captureWaitScope(raw,before);targetDate=captured.targetDate
  if(captured.status==='rejected')return result('rejected',captured.reasonCodes)
  scope=captured.scope
  const preview=port.preview(scope)
  if(!preview.allowed)return result('rejected',preview.reasonCodes)
 }catch{return result('rejected',['INVALID_PAYLOAD'])}

 const flush=async():Promise<PublicWaitResult|null>=>{
  if(!lastProposal)return null
  const checkpoint:WaitCheckpoint={baseRun,previousRun,proposal:lastProposal,commands}
  const context:WaitCheckpointContext={scope,targetDate,before,prefixSteps:[...steps],prefixFeedback:[...feedback],pendingSteps:[...pendingSteps],pendingFeedback:[...pendingFeedback],previousRun}
  let saved:SessionResult
  try{saved=await port.commit(checkpoint,context)}catch{failed={command:commands.at(-1)!,before:lastSaved};return result('stopped',['CLOCK_WAIT_INTERRUPTED'])}
  if(saved.status!=='saved'&&saved.status!=='duplicate'){
   failed={command:commands.at(-1)!,before:lastSaved}
   return result(saved.status==='unsaved'?'unsaved':saved.status==='conflict'?'conflict':'rejected',saved.reasonCodes.length?saved.reasonCodes:['STALE_REVISION'])
  }
  const current=port.current(),tail=current.receipts.at(-1)
  if(current.runId!==before.runId||current.revision!==workingRun.revision||current.hasCandidate||current.saveStatus!=='saved'||tail?.commandId!==lastProposal.receipt.commandId||tail.kind!=='AdvanceTime')return result('stopped',['STALE_REVISION'])
  steps.push(...pendingSteps);feedback.push(...pendingFeedback)
  lastSaved=current;lastBefore=port.previousSaved(previousRun)
  baseRun=port.run();workingRun=baseRun;previousRun=baseRun;working=current
  commands=[];pendingSteps=[];pendingFeedback=[];lastProposal=null
  return null
 }
 const finish=async(status:PublicWaitResult['status'],reasons:readonly string[]=[]):Promise<PublicWaitResult>=>{
  const issue=await flush();if(issue)return issue
  if(failed)failed={...failed,before:lastSaved}
  if(port.stopping())return result('stopped',['WAIT_STOP_REQUESTED'])
  return result(status,reasons)
 }

 for(let index=0;index<256;index++){
  if(port.stopping())return finish('stopped',['WAIT_STOP_REQUESTED'])
  const committed=port.current()
  if(committed.runId!==before.runId||committed.revision!==baseRun.revision)return result('stopped',['STALE_REVISION'])
  if(committed.readOnly)return result('rejected',['READ_ONLY_SESSION'])
  if(committed.hasCandidate)return result('unsaved',['UNSAVED_CANDIDATE'])
  if(committed.saveStatus==='conflict')return result('conflict',['RELOAD_REQUIRED'])
  if(committed.saveStatus!=='saved')return result('stopped',['SAVE_IN_PROGRESS'])
  if(workingRun.phase!=='playing')return finish('stopped',['PREVIEW_RANGE_ENDED'])
  const workbench=working.features.workbench as WorkbenchProjection|undefined
  if(!workbench)return finish('stopped',['CLOCK_PREVIEW_UNAVAILABLE'])
  let date:string
  try{isoDate(workbench.progression.nextDate);date=playableAdvanceDate(workbench,working.date,workbench.progression.nextDate<targetDate?workbench.progression.nextDate:targetDate)}catch{return finish('stopped',['CLOCK_PREVIEW_UNAVAILABLE'])}
  const prior=pendingSteps.at(-1)??steps.at(-1)
  if(index>0&&date===working.date&&prior?.date===date)return finish('stopped',['WAIT_NO_PUBLIC_PROGRESS'])
  const command:CommandEnvelope={runId:scope.runId,actorId:scope.actorId,commandId:date===targetDate?scope.commandId:'wait-step-'+hashValue([scope.runId,scope.commandId,index]).slice(0,32),expectedRevision:workingRun.revision,kind:'AdvanceTime',payload:{date}}
  let proposal:ReturnType<typeof evaluateCommand>
  try{proposal=port.propose(workingRun,command)}catch{failed={command,before:lastSaved};return finish('stopped',['CLOCK_WAIT_INTERRUPTED'])}
  if(proposal.status!=='proposed'){failed={command,before:lastSaved};return finish('rejected',proposal.status==='rejected'?proposal.reasonCodes:['STALE_REVISION'])}
  const receipt=proposal.nextRun.receipts.at(-1)
  if(proposal.nextRun.runId!==before.runId||proposal.nextRun.revision!==workingRun.revision+1||receipt?.commandId!==command.commandId||receipt.kind!=='AdvanceTime')return finish('stopped',['STALE_REVISION'])
  const previousMeaning=working
  previousRun=workingRun;workingRun=proposal.nextRun;lastProposal=proposal
  commands.push(command);pendingSteps.push({commandId:command.commandId,date:workingRun.timeline.cursor.date,revisionBefore:command.expectedRevision,revisionAfter:workingRun.revision})
  let meanings:readonly PublicFeedback[]
  try{working=port.project(workingRun);meanings=inspectPublicWaitTransition(previousMeaning,working)}catch{return finish('stopped',['CLOCK_FEEDBACK_UNAVAILABLE'])}
  pendingFeedback.push(...meanings)
  // This yields a task, not a fake saved state. A queued stop can request the
  // current accepted prefix without waiting for the whole chosen date range.
  await port.yieldControl()
  if(port.stopping())return finish('stopped',['WAIT_STOP_REQUESTED'])
  if(working.date>=targetDate)return finish('saved')
  if(meanings.some(row=>row.attention==='pause'))return finish('stopped')
  if(commands.length===MAX_WAIT_CHECKPOINT_STEPS){const issue=await flush();if(issue)return issue}
 }
 return finish('stopped',['WAIT_STEP_LIMIT'])
}
