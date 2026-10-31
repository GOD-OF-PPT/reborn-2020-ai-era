import {hashValue} from '../core/hash.ts'
import { createCampaignCodec,createCampaignRun } from './campaign.ts'
import { RunSession } from './session.ts'
import { requireRule,RuleError } from '../core/errors.ts'
import { PLAYABLE_THROUGH } from './playable-advance.ts'
import type { PlayerProfile } from '../core/player-profile.ts'
import type { CommandEnvelope } from '../core/run-types.ts'
import type { RunListing,RunStore } from '../persistence/indexeddb.ts'
import type { WriterAccess } from '../persistence/writer-lock.ts'
import type { RunCodec } from '../persistence/codec.ts'
import type { SessionResult } from './session.ts'
import {assertJsonInput,copyJson} from '../core/json-input.ts'
import {executePublicWait,type PublicWaitResult} from './public-wait.ts'
export interface GameStart {readonly backgroundId:string;readonly playerProfile:PlayerProfile;readonly seed?:string}
export { INITIAL_GAME_SNAPSHOT } from './game-snapshot.ts'
export type { GameSnapshot } from './game-snapshot.ts'
import { INITIAL_GAME_SNAPSHOT,type GameSnapshot } from './game-snapshot.ts'
interface ControllerOptions {readonly codec?:RunCodec;readonly store:RunStore&{listRuns():Promise<readonly RunListing[]>;close?():Promise<void>};readonly locks:WriterAccess;readonly id?:()=>string;readonly guard?:(session:RunSession)=>()=>void;readonly yieldControl?:()=>Promise<void>}
const code=(error:unknown)=>error instanceof RuleError?error.code:'LOCAL_STORAGE_FAILED'
const endActions=new Set(['StopHengxingAuthority','InterruptStoryWork','AcknowledgeStoryPause','ConfirmRiskAssessment','DeclareRiskLiabilities','ResolveRiskCase','DeclineRiskClaim','ShareRiskFindings','StartRiskTask','ReadNews','FavoriteMemory','SetPrivateNote','CancelStockOrder','StopMarketResearch','CancelAction','InterruptPreparation','InterruptJob','CancelContract','QuitWork','WindDownBusiness','CloseBusiness','PauseBusiness','DismissWorker','PayObligation','AcknowledgeCashGap','DeclineOffer','SkipOffer','SubmitDelivery','ExitVideoCommission','AbandonVideoWork','UnlistVideo','CollectVideoSettlement','SubmitVideoCommission','ReviewVideoOutput','PauseNewEnrollment','StopCourseSales','RetireCourse','RefundCourseLearners','PauseRelayTraffic','StopRelayStation','RefundRelayBalance','RefundRelaySupplier','CollectRelayReceivable','CollectRelayDue','CorrectRelayUsage','CorrectRelayPeriod','CloseRelayCustomer','StopRelayPeriod','AcknowledgeRelayMarket','CancelRoutinePlan','CancelRoutineStep','StopEcosystemService','CancelEcoContract','SubmitEcoDelivery','CollectEcoReceivable','RejectEquityInvitation','DeclineEquityTerms','CollectEquityExit'])

/** Owns save/session ordering and identity. UI callers receive only committed projections. */
export class GameController {
 readonly #codec:RunCodec;readonly #options:ControllerOptions;readonly #listeners=new Set<()=>void>()
 #state:GameSnapshot=INITIAL_GAME_SNAPSHOT;#session:RunSession|null=null;#unsubscribe:(()=>void)|null=null;#unguard:(()=>void)|null=null;#libraryBusy=false;#routineRunning=false;#routineStopRequested=false;#closed=false
 #timeWaiting=false;#timeWaitStop=false;#timeWaitFlight:Promise<PublicWaitResult>|null=null
 #timeWaitScope:{commandId:string;signature:string;targetDate:string}|null=null
 #lastTimeWait:{session:RunSession;commandId:string;signature:string}|null=null
 constructor(options:ControllerOptions){this.#options=options;this.#codec=options.codec??createCampaignCodec()}
 get snapshot(){return this.#state}
 get needsUnsavedWarning(){return this.#session?.needsUnsavedWarning??false}
 get timeWait(){return this.#timeWaiting&&this.#timeWaitScope?{targetDate:this.#timeWaitScope.targetDate,stopRequested:this.#timeWaitStop}:null}
 subscribe=(listener:()=>void)=>{this.#listeners.add(listener);return ()=>{this.#listeners.delete(listener)}}
 #id(prefix:string){return `${prefix}-${(this.#options.id??(()=>globalThis.crypto.randomUUID()))()}`}
 #set(change:Partial<GameSnapshot>){this.#state={...this.#state,...change,busy:this.#libraryBusy||this.#routineRunning||this.#timeWaiting||(change.view??this.#state.view)?.busy===true};for(const listener of [...this.#listeners]){try{listener()}catch{this.#listeners.delete(listener)}}}
 async #exclusive<T>(work:()=>Promise<T>):Promise<T>{requireRule(!this.#closed,'SESSION_CLOSED');requireRule(!this.#libraryBusy&&!this.#routineRunning&&!this.#timeWaiting,'SAVE_IN_PROGRESS');this.#libraryBusy=true;this.#set({error:null});try{return await work()}catch(error){this.#set({error:code(error)});throw error}finally{this.#libraryBusy=false;this.#set({})}}
 async initialize(){await this.#exclusive(async()=>{const runs=await this.#options.store.listRuns();this.#set({runs,phase:'home'})}).catch(error=>{this.#set({phase:'error'});throw error})}
 async #bind(runId:string){
  const session=await RunSession.open({store:this.#options.store,codec:this.#codec,registry:this.#codec.registry,locks:this.#options.locks,runId,actorId:'player'});this.#session=session
  this.#unsubscribe=session.subscribe(view=>this.#set({view,phase:'playing'}));this.#unguard=this.#options.guard?.(session)??null
 }
 async newLife(input:GameStart){return this.#exclusive(async()=>{requireRule(this.#session===null,'CLOSE_CURRENT_RUN_FIRST');const run=createCampaignRun({...input,runId:this.#id('life'),actorId:'player',commandId:this.#id('create'),seed:input.seed??this.#id('seed')});await this.#options.store.create(run);await this.#bind(run.runId);this.#set({notice:'新人生已保存。所有安排仍由你确认。'})})}
 async continueLife(runId:string){return this.#exclusive(async()=>{requireRule(this.#session===null,'CLOSE_CURRENT_RUN_FIRST');await this.#bind(runId);this.#set({notice:this.#state.view?.readOnly?'当前为只读，请查看写入状态说明。':'已从本机存档继续。'})})}
 prepare(kind:string,payload:unknown):CommandEnvelope{requireRule(this.#session&&this.#state.view,'RUN_NOT_FOUND');const view=this.#state.view;return {runId:view.runId,actorId:'player',commandId:this.#id('command'),expectedRevision:view.revision,kind,payload}}
 #rangeBlocks(command:CommandEnvelope){
  const view=this.#state.view
  // The finite closing runtime owns its old-item and clock restrictions.
  // Applying the old preview wall here would make its public commands unreachable.
  if(view&&(view.phase==='epilogue'||view.phase==='finished'||command.kind==='EnterEpilogue'))return false
  const tail=view?.date===PLAYABLE_THROUGH&&command.kind==='AdvanceTime'&&typeof command.payload==='object'&&command.payload!==null&&'date' in command.payload&&command.payload.date===PLAYABLE_THROUGH&&(view.features.workbench as {atQuarterEnd?:boolean}|undefined)?.atQuarterEnd===false
  const requestedPastRange=command.kind==='AdvanceTime'&&typeof command.payload==='object'&&command.payload!==null&&'date' in command.payload&&typeof command.payload.date==='string'&&command.payload.date>PLAYABLE_THROUGH
  return view&&!view.receipts.some(r=>r.commandId===command.commandId)&&(requestedPastRange||!tail&&view.date>=PLAYABLE_THROUGH&&!endActions.has(command.kind))
 }
 preview(command:CommandEnvelope){requireRule(this.#session,'RUN_NOT_FOUND');if(this.#routineRunning||this.#timeWaiting)return {allowed:false,reasonCodes:['SAVE_IN_PROGRESS'],actionPoints:0,upfrontCostFen:0,releasedFen:0};if(this.#rangeBlocks(command))return {allowed:false,reasonCodes:['PREVIEW_RANGE_ENDED'],actionPoints:0,upfrontCostFen:0,releasedFen:0};return this.#session.preview(command)}
 clockCommitments(raw:CommandEnvelope){
  requireRule(this.#session,'RUN_NOT_FOUND');requireRule(!this.#libraryBusy&&!this.#routineRunning&&!this.#timeWaiting,'SAVE_IN_PROGRESS');assertJsonInput(raw)
  const command=copyJson(raw),preview=this.preview(command)
  requireRule(preview.allowed,preview.reasonCodes[0]??'INVALID_PAYLOAD')
  return this.#session.clockCommitments(command)
 }
 submit(command:CommandEnvelope):Promise<SessionResult>{requireRule(this.#session,'RUN_NOT_FOUND');requireRule(!this.#libraryBusy&&!this.#routineRunning&&!this.#timeWaiting,'SAVE_IN_PROGRESS');if(this.#rangeBlocks(command)){this.#set({error:'PREVIEW_RANGE_ENDED'});return Promise.resolve({status:'rejected',reasonCodes:['PREVIEW_RANGE_ENDED']})}return this.#session.submit(command).then(result=>{this.#set({error:result.reasonCodes[0]??null,notice:result.status==='saved'||result.status==='duplicate'?result.receipt.summary:null});return result})}
 /** A confirmed time range authorizes original time commands, never a new business decision. */
 waitForFeedback(raw:CommandEnvelope):Promise<PublicWaitResult>{
  requireRule(this.#session&&!this.#closed,'RUN_NOT_FOUND');assertJsonInput(raw)
  const command=copyJson(raw);requireRule(command.kind==='AdvanceTime','CLOCK_COMMAND_REQUIRED')
  const session=this.#session,signature=hashValue({runId:command.runId,actorId:command.actorId,kind:command.kind,payload:command.payload})
  if(this.#timeWaitFlight){requireRule(this.#timeWaitScope?.commandId===command.commandId&&this.#timeWaitScope.signature===signature,'SAVE_IN_PROGRESS');return this.#timeWaitFlight}
  requireRule(!this.#libraryBusy&&!this.#routineRunning,'SAVE_IN_PROGRESS')
  const current=this.#state.view!;requireRule(current.runId===command.runId,'RUN_NOT_FOUND')
  const empty=(reason:string):PublicWaitResult=>({status:'stopped',reasonCodes:[reason],targetDate:typeof command.payload==='object'&&command.payload!==null&&'date'in command.payload&&typeof command.payload.date==='string'?command.payload.date:current.date,before:current,lastSaved:current,lastBefore:null,current,steps:[],feedback:[],failed:null})
  if(this.#lastTimeWait?.session===session&&this.#lastTimeWait.commandId===command.commandId){requireRule(this.#lastTimeWait.signature===signature,'COMMAND_ID_REUSED');return Promise.resolve(empty('WAIT_ALREADY_HANDLED'))}
  if(current.receipts.some(r=>r.commandId===command.commandId))return this.submit(command).then(result=>({...empty('WAIT_ALREADY_HANDLED'),status:result.status==='unsaved'?'unsaved':result.status==='conflict'?'conflict':result.status==='rejected'?'rejected':'stopped',reasonCodes:result.reasonCodes}))
  this.#timeWaiting=true;this.#timeWaitStop=false
  this.#timeWaitScope={commandId:command.commandId,signature,targetDate:typeof command.payload==='object'&&command.payload!==null&&'date'in command.payload&&typeof command.payload.date==='string'?command.payload.date:current.date}
  const flight=Promise.resolve().then(()=>session.supportsWaitCheckpoints&&!this.#rangeBlocks(command)?session.waitForFeedbackCheckpoint(command,{
   stopping:()=>this.#timeWaitStop||this.#closed||this.#session!==session,
   yieldControl:()=>this.#options.yieldControl?.()??Promise.resolve(),
  }):executePublicWait(command,{
   current:()=>{requireRule(this.#session===session&&this.#state.view?.runId===command.runId,'RUN_NOT_FOUND');return this.#state.view!},
   preview:step=>this.#rangeBlocks(step)?{allowed:false,reasonCodes:['PREVIEW_RANGE_ENDED'],actionPoints:0,upfrontCostFen:0,releasedFen:0}:session.preview(step),
   submit:async step=>{const result=await session.submit(step);this.#set({error:result.reasonCodes[0]??null,notice:result.status==='saved'?result.receipt.summary:null});if(this.#options.yieldControl)await this.#options.yieldControl();return result},
   stopping:()=>this.#timeWaitStop||this.#closed||this.#session!==session,
  })).then(result=>{this.#lastTimeWait={session,commandId:command.commandId,signature};this.#set({error:result.status==='rejected'||result.status==='unsaved'||result.status==='conflict'?result.reasonCodes[0]??null:null});return result}).finally(()=>{this.#timeWaiting=false;this.#timeWaitFlight=null;this.#timeWaitScope=null;this.#set({})})
  this.#timeWaitFlight=flight;this.#set({error:null})
  return flight
 }
 stopWaiting(){if(this.#timeWaiting&&!this.#timeWaitStop){this.#timeWaitStop=true;this.#set({notice:'先停下来，已经发生的日子保留。'})}}
 /** Both UI modes dispatch the same deterministic envelopes, one durable command at a time. */
 async runRoutine(planId:string,batch=true){
  requireRule(this.#session&&!this.#libraryBusy&&!this.#routineRunning&&!this.#timeWaiting,'SAVE_IN_PROGRESS');let stepsExecuted=0,commandsSaved=0;this.#routineRunning=true;this.#routineStopRequested=false;this.#set({error:null})
  try{for(let attempt=0;attempt<24;attempt++){
   if(this.#routineStopRequested)break
   const session=this.#session;requireRule(session,'RUN_NOT_FOUND');if(session.view.hasCandidate||session.view.readOnly||session.view.saveStatus==='conflict')break
   const run=this.#codec.import(session.exportSaved()),plan=run.routines?.plans.find(p=>p.id===planId);requireRule(plan,'ROUTINE_PLAN_NOT_FOUND');if(plan.status!=='confirmed')break;const step=plan.steps.find(s=>s.status==='pending');if(!step)break
   const command:CommandEnvelope={runId:run.runId,actorId:run.actorId,expectedRevision:run.revision,commandId:'routine-step-'+hashValue([run.runId,planId,step.id]).slice(0,32),kind:'RunRoutineStep',payload:{planId,stepId:step.id}}
   if(this.#rangeBlocks(command)){this.#set({error:'PREVIEW_RANGE_ENDED'});break}
   const result=await session.submit(command);this.#set({error:result.reasonCodes[0]??null,notice:result.status==='saved'||result.status==='duplicate'?result.receipt.summary:null});if(this.#options.yieldControl)await this.#options.yieldControl();if(result.status!=='saved'&&result.status!=='duplicate')break;commandsSaved++
   const saved=this.#codec.import(session.exportSaved()).routines!.plans.find(p=>p.id===planId)!;if(saved.steps.find(s=>s.id===step.id)!.status==='completed')stepsExecuted++;if(!batch||saved.status!=='confirmed')break
  }return {stepsExecuted,commandsSaved}}
  finally{this.#routineRunning=false;this.#set({})}
 }
 stopRoutineBatch(){if(this.#routineRunning){this.#routineStopRequested=true;this.#set({notice:'本项保存结束后停止批量；剩余授权可继续或取消。'})}}
 retry(){requireRule(this.#session,'RUN_NOT_FOUND');requireRule(!this.#timeWaiting,'SAVE_IN_PROGRESS');return this.#session.retry().then(result=>{this.#set({error:result.reasonCodes[0]??null,notice:result.status==='saved'?'原候选已保存；没有重新执行或重新抽取结果。':null});return result})}
 async reload(discardCandidate=false){return this.#exclusive(async()=>{requireRule(this.#session,'RUN_NOT_FOUND');await this.#session.reload({discardCandidate});this.#set({notice:'已重新读取本机提交。'})})}
 exportSaved(){requireRule(this.#session,'RUN_NOT_FOUND');return this.#session.exportSaved()}
 exportCandidate(){requireRule(this.#session,'RUN_NOT_FOUND');return this.#session.exportCandidate()}
 async exportStored(runId:string,backup=false){const text=await this.#options.store.exportStored(runId,backup);requireRule(text,'RUN_NOT_FOUND');return text}
 inspectImport(text:string){const run=this.#codec.import(text);requireRule(run.actorId==='player','FORBIDDEN_ACTOR');return {runId:run.runId,date:run.timeline.cursor.date,revision:run.revision,backgroundId:run.backgroundId,playerProfile:run.playerProfile,origin:run.origin,alreadyExists:this.#state.runs.some(r=>r.runId===run.runId)||this.#state.view?.runId===run.runId}}
 async importNew(text:string){return this.#exclusive(async()=>{requireRule(this.#session===null,'CLOSE_CURRENT_RUN_FIRST');const preview=this.inspectImport(text);await this.#options.store.importSave(text,{mode:'create',actorId:'player',importId:this.#id('import')});await this.#bind(preview.runId);this.#set({notice:'已导入独立存档，未覆盖其他人生。'})})}
 async restore(text:string){return this.#exclusive(async()=>{requireRule(this.#session,'RUN_NOT_FOUND');await this.#session.restore(text,this.#id('restore'));this.#set({notice:'已恢复同一人生；替换前的本机提交保留为备份。'})})}
 async restoreBackup(){requireRule(this.#session,'RUN_NOT_FOUND');const text=await this.exportStored(this.#session.view.runId,true);return this.restore(text)}
 async #detach(discardCandidate=false){const session=this.#session;if(session){await session.close({discardCandidate});this.#unsubscribe?.();this.#unguard?.();this.#unsubscribe=null;this.#unguard=null;this.#session=null;this.#lastTimeWait=null}}
 async home(discardCandidate=false){return this.#exclusive(async()=>{await this.#detach(discardCandidate);this.#set({view:null,runs:await this.#options.store.listRuns(),phase:'home',notice:null})})}
 async close(discardCandidate=false){if(this.#timeWaitFlight){this.stopWaiting();await this.#timeWaitFlight.catch(()=>{})}await this.#detach(discardCandidate);this.#closed=true;this.#listeners.clear();await this.#options.store.close?.()}
}
