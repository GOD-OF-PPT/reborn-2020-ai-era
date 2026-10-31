import { evaluateCommand, fingerprintCommand, bindCommandPreview, projectRun, type CommandPreview, type CommandRegistry } from '../core/commands.ts'
import { commandIdentifier } from '../core/command-identity.ts'
import { copyJson,assertJsonInput } from '../core/json-input.ts'
import { requireRule, RuleError } from '../core/errors.ts'
import type { CommandReceipt, ProposedRun,CommandEnvelope,GameRun } from '../core/run-types.ts'
import type { RunStore, StoredRun } from '../persistence/indexeddb.ts'
import { RunCodec } from '../persistence/codec.ts'
import type { WriterAccess, WriterLease } from '../persistence/writer-lock.ts'
import {DAY_PHASES} from '../core/timeline.ts'
import {executeCheckpointedWait,type WaitCheckpointContext} from './checkpoint-wait.ts'
import {captureWaitScope,type PublicWaitResult} from './public-wait.ts'
import type {WaitCheckpoint} from '../persistence/wait-checkpoint.ts'
import {hashValue} from '../core/hash.ts'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'conflict' | 'read_only' | 'closed'
type PublicReceipt = Pick<CommandReceipt, 'commandId' | 'kind' | 'revisionAfter' | 'date' | 'summary'>
export type SessionResult = { readonly status: 'saved' | 'duplicate'; readonly receipt: PublicReceipt; readonly reasonCodes: readonly string[];readonly checkpointWait?:true;readonly waitResult?:PublicWaitResult } | { readonly status: 'rejected' | 'unsaved' | 'conflict'; readonly reasonCodes: readonly string[] }
interface SessionOptions { readonly store: RunStore; readonly codec: RunCodec; readonly registry: CommandRegistry; readonly locks: WriterAccess; readonly runId: string; readonly actorId: string }
type Flight = { readonly commandId: string; readonly signature: string; readonly promise: Promise<SessionResult> }

function rejected(code: string): SessionResult { return { status: 'rejected', reasonCodes: [code] } }
function errorCode(error: unknown): string { return error instanceof RuleError ? error.code : 'SAVE_FAILED' }
function publicReceipt(receipt: CommandReceipt): PublicReceipt { return { commandId: receipt.commandId, kind: receipt.kind, revisionAfter: receipt.revisionAfter, date: receipt.date, summary: receipt.summary } }
function sessionProjection(run:GameRun,registry:CommandRegistry,status:SaveStatus,busy:boolean,lease:WriterLease,pendingRevision:number|null){
 return {...projectRun(run),features:registry.runtime?.project?.(run)??{},saveStatus:status,busy,readOnly:lease.mode!=='writer',readOnlyReason:lease.reason,hasCandidate:pendingRevision!==null,pendingRevision}
}
export type SessionView=ReturnType<typeof sessionProjection>
type CheckpointCandidate={readonly checkpoint:WaitCheckpoint;readonly context:WaitCheckpointContext}

export class RunSession {
  readonly #options: SessionOptions
  #record: StoredRun
  #lease: WriterLease
  #previewRecord:StoredRun|null=null
  #previewer:ReturnType<typeof bindCommandPreview>|null=null
  #candidate: ProposedRun | null = null
  #flight: Flight | null = null
  #externalBusy = false
  #waiting = false
  #checkpointCandidate:CheckpointCandidate|null=null
  #status: SaveStatus
  readonly #listeners = new Set<(view: RunSession['view']) => void>()

  private constructor(options: SessionOptions, record: StoredRun, lease: WriterLease) {
    this.#options = options
    this.#record = record
    this.#lease = lease
    this.#status = lease.mode === 'writer' ? 'saved' : 'read_only'
  }

  static async open(options: SessionOptions): Promise<RunSession> {
    commandIdentifier(options.runId); commandIdentifier(options.actorId)
    requireRule(options.codec.registry === options.registry, 'RULE_CONTEXT_MISMATCH')
    const lease = await options.locks.acquire(`${options.store.name}:${options.runId}`)
    try {
      const record = await options.store.load(options.runId)
      requireRule(record, 'RUN_NOT_FOUND')
      requireRule(record.run.actorId === options.actorId, 'FORBIDDEN_ACTOR')
      options.codec.validateRun(record.run)
      return new RunSession({ ...options }, record, lease)
    } catch (error) { await lease.release(); throw error }
  }

  get view():SessionView {
    // Never publish uncommitted outcomes, hidden evidence, or success receipts.
    return sessionProjection(this.#record.run,this.#options.registry,this.#status,this.#flight!==null||this.#externalBusy,this.#lease,this.#candidate?.nextRun.revision??null)
  }
  get savedView() { return projectRun(this.#record.run) }
  get needsUnsavedWarning(): boolean { return this.#candidate !== null || this.#status === 'saving'||this.#waiting }
  get supportsWaitCheckpoints():boolean{return this.#options.store.supportsWaitCheckpoints===true&&typeof this.#options.store.commitCheckpoint==='function'}

  subscribe(listener: (view: RunSession['view']) => void): () => void {
    requireRule(this.#status !== 'closed', 'SESSION_CLOSED')
    this.#listeners.add(listener)
    try { listener(this.view) } catch { this.#listeners.delete(listener) }
    return () => { this.#listeners.delete(listener) }
  }
  #notify(projected?:SessionView): void {
    for (const listener of [...this.#listeners]) {
      // A view observer must not interrupt or fabricate a durable commit.
      try { listener(projected??this.view) } catch { this.#listeners.delete(listener) }
    }
  }

  preview(raw: unknown): CommandPreview {
    const blocked = this.#blockReason()
    if (blocked !== null) return { allowed: false, reasonCodes: [blocked], actionPoints: 0, upfrontCostFen: 0, releasedFen: 0 }
    if(this.#previewRecord!==this.#record||this.#previewer===null){this.#previewer=bindCommandPreview(this.#record.run,this.#options.registry,this.#options.actorId);this.#previewRecord=this.#record}
    return this.#previewer(raw)
  }
  clockCommitments(raw:CommandEnvelope){
    assertJsonInput(raw)
    const command=copyJson(raw),preview=this.preview(command)
    requireRule(preview.allowed,preview.reasonCodes[0]??'INVALID_PAYLOAD')
    requireRule(command.expectedRevision===this.#record.run.revision,'STALE_REVISION')
    requireRule((command.kind==='AdvanceTime'||command.kind==='AdvanceEpilogueTime')&&typeof command.payload==='object'&&command.payload!==null&&'date'in command.payload&&typeof command.payload.date==='string','CLOCK_COMMAND_REQUIRED')
    const requestedPhase='phase'in command.payload?command.payload.phase:'snapshot',phase=DAY_PHASES.find(p=>p===requestedPhase)
    requireRule(phase,'INVALID_PAYLOAD')
    const runtime=this.#options.registry.runtime
    requireRule(runtime?.clockCommitments,'CLOCK_PREVIEW_UNAVAILABLE')
    return copyJson(runtime.clockCommitments(this.#record.run,{date:command.payload.date,phase}))
  }
  #blockReason(): string | null {
    if (this.#status === 'closed') return 'SESSION_CLOSED'
    if (this.#lease.mode !== 'writer') return 'READ_ONLY_SESSION'
    if (this.#flight !== null || this.#externalBusy) return 'SAVE_IN_PROGRESS'
    if (this.#candidate !== null) return 'UNSAVED_CANDIDATE'
    if (this.#status === 'conflict') return 'RELOAD_REQUIRED'
    return null
  }

  submit(raw: unknown): Promise<SessionResult> {
    if (this.#status === 'closed') return Promise.resolve(rejected('SESSION_CLOSED'))
    if (this.#lease.mode !== 'writer') return Promise.resolve(rejected('READ_ONLY_SESSION'))
    try {
      const fingerprint = fingerprintCommand(this.#record.run, raw, this.#options.registry, this.#options.actorId)
      if (this.#flight !== null) {
        if (this.#flight.commandId === fingerprint.commandId) return this.#flight.signature === fingerprint.signature ? this.#flight.promise : Promise.resolve(rejected('COMMAND_ID_REUSED'))
        return Promise.resolve(rejected('SAVE_IN_PROGRESS'))
      }
      const blocked = this.#blockReason()
      if (blocked !== null) return Promise.resolve(rejected(blocked))
      const result = evaluateCommand(this.#record.run, raw, this.#options.registry, this.#options.actorId)
      if (result.status === 'rejected') return Promise.resolve(result)
      let promise: Promise<SessionResult>
      if (result.status === 'duplicate') promise = this.#refreshDuplicate(result.receipt)
      else {
        const proposal = copyJson(result)
        this.#options.codec.seal(proposal.nextRun)
        this.#candidate = proposal
        this.#status = 'saving'
        promise = this.#saveCandidate()
      }
      const completed = promise.finally(() => { this.#flight = null; this.#notify() })
      this.#flight = { commandId: fingerprint.commandId, signature: fingerprint.signature, promise: completed }
      this.#notify()
      return completed
    } catch (error) { return Promise.resolve(rejected(errorCode(error))) }
  }

  async #refreshDuplicate(receipt: CommandReceipt): Promise<SessionResult> {
    try {
      const latest = await this.#options.store.load(this.#record.run.runId)
      requireRule(latest && latest.run.actorId === this.#options.actorId, 'FORBIDDEN_ACTOR')
      const saved = latest.run.receipts.find((item) => item.commandId === receipt.commandId)
      requireRule(saved && saved.payloadHash === receipt.payloadHash && saved.payloadSignature === receipt.payloadSignature, 'STALE_REVISION')
      this.#record = latest
      this.#status = 'saved'
      return { status: 'duplicate', receipt: publicReceipt(saved), reasonCodes: [] }
    } catch (error) {
      this.#status = 'conflict'
      return { status: 'conflict', reasonCodes: [errorCode(error)] }
    }
  }

  async #saveCandidate(): Promise<SessionResult> {
    const proposal = this.#candidate
    requireRule(proposal, 'NO_UNSAVED_CANDIDATE')
    try {
      requireRule(!this.#checkpointCandidate||this.supportsWaitCheckpoints,'WAIT_CHECKPOINT_UNAVAILABLE')
      const committed = this.#checkpointCandidate
        ? await this.#options.store.commitCheckpoint!(this.#checkpointCandidate.checkpoint,this.#record.generation)
        : await this.#options.store.commit(proposal, this.#record.generation)
      this.#record = committed.record
      this.#previewRecord=null;this.#previewer=null
      this.#candidate = null
      this.#checkpointCandidate=null
      this.#status = 'saved'
      return { status: committed.duplicate ? 'duplicate' : 'saved', receipt: publicReceipt(committed.receipt), reasonCodes: [] }
    } catch (error) {
      this.#status = errorCode(error) === 'STALE_REVISION' ? 'conflict' : 'unsaved'
      return { status: this.#status, reasonCodes: [errorCode(error)] }
    }
  }

  retry(): Promise<SessionResult> {
    if (this.#status === 'closed') return Promise.resolve(rejected('SESSION_CLOSED'))
    if (this.#lease.mode !== 'writer') return Promise.resolve(rejected('READ_ONLY_SESSION'))
    if (this.#externalBusy) return Promise.resolve(rejected('SAVE_IN_PROGRESS'))
    if (this.#flight !== null) return this.#flight.promise
    const candidate = this.#candidate
    if (candidate === null) return Promise.resolve(rejected('NO_UNSAVED_CANDIDATE'))
    this.#status = 'saving'
    const checkpoint=this.#checkpointCandidate
    const promise = this.#saveCandidate().finally(() => { this.#flight = null; this.#notify() }).then(result=>{
      if(!checkpoint||result.status!=='saved'&&result.status!=='duplicate')return result
      return {...result,checkpointWait:true as const,...this.#checkpointRecovery(checkpoint)}
    })
    this.#flight = { commandId: candidate.receipt.commandId, signature: candidate.receipt.payloadSignature, promise }
    this.#notify()
    return promise
  }

  #projectWait(run:GameRun){return {...projectRun(run),features:this.#options.registry.runtime?.project?.(run)??{}}}
  #previousSaved(run:GameRun):SessionView{return sessionProjection(run,this.#options.registry,'saved',false,this.#lease,null)}
  #checkpointRecovery(candidate:CheckpointCandidate):{waitResult?:PublicWaitResult}{
    const {checkpoint,context}=candidate,current=this.view,expected=checkpoint.proposal.nextRun
    if(current.revision!==expected.revision||current.runId!==expected.runId||current.saveStatus!=='saved'||current.hasCandidate)return {}
    if(hashValue(this.#record.run)!==hashValue(expected))return {}
    const all=[...context.prefixSteps,...context.pendingSteps]
    if(current.receipts.length!==context.before.receipts.length+all.length||!all.every((step,index)=>{const row=current.receipts[context.before.receipts.length+index];return row?.commandId===step.commandId&&row.kind==='AdvanceTime'&&row.revisionAfter===step.revisionAfter}))return {}
    return {waitResult:{status:current.date>=context.targetDate?'saved':'stopped',reasonCodes:['WAIT_RETRY_SAVED_ONLY'],targetDate:context.targetDate,before:context.before,lastSaved:current,lastBefore:this.#previousSaved(context.previousRun),current,steps:all,feedback:[...context.prefixFeedback,...context.pendingFeedback],failed:null}}
  }

  /** The renderer never receives the working run or a fake saved projection. */
  async waitForFeedbackCheckpoint(raw:CommandEnvelope,controls:{stopping:()=>boolean;yieldControl:()=>Promise<void>}):Promise<PublicWaitResult>{
    requireRule(this.supportsWaitCheckpoints,'WAIT_CHECKPOINT_UNAVAILABLE')
    const before=this.view,captured=captureWaitScope(raw,before),blocked=this.#blockReason()
    if(captured.status==='rejected'||blocked)return {status:'rejected',reasonCodes:captured.status==='rejected'?captured.reasonCodes:[blocked!],targetDate:captured.targetDate,before,lastSaved:before,lastBefore:null,current:before,steps:[],feedback:[],failed:null}
    // Capture the original committed rule context before taking the exclusive
    // waiting lease. The runner validates the envelope before querying it.
    let preview:ReturnType<typeof bindCommandPreview>|null=bindCommandPreview(this.#record.run,this.#options.registry,this.#options.actorId)
    let published=before
    this.#externalBusy=true;this.#waiting=true;this.#notify({...before,busy:true})
    let outcome:PublicWaitResult
    try{
      outcome=await executeCheckpointedWait(raw,before,{
        current:()=>published,run:()=>this.#record.run,preview:command=>{const captured=preview;requireRule(captured,'STALE_REVISION');preview=null;return captured(command)},
        propose:(run,command)=>{const result=evaluateCommand(run,command,this.#options.registry,this.#options.actorId);if(result.status!=='proposed')return result;const nextRun=this.#options.codec.validateRun(result.nextRun);return {...result,nextRun,receipt:nextRun.receipts.at(-1)!}},
        project:run=>this.#projectWait(run),previousSaved:run=>this.#previousSaved(run),
        commit:async(checkpoint,context)=>{
          this.#candidate=checkpoint.proposal;this.#checkpointCandidate={checkpoint,context};this.#status='saving';this.#notify({...published,saveStatus:'saving',busy:true,hasCandidate:true,pendingRevision:checkpoint.proposal.nextRun.revision})
          const result=await this.#saveCandidate();published=this.view;this.#notify(published);return result
        },stopping:controls.stopping,yieldControl:controls.yieldControl,
      })
    }finally{
      this.#externalBusy=false;this.#waiting=false
      published={...published,busy:false,saveStatus:this.#status,readOnly:this.#lease.mode!=='writer',readOnlyReason:this.#lease.reason,hasCandidate:this.#candidate!==null,pendingRevision:this.#candidate?.nextRun.revision??null}
      this.#notify(published)
    }
    const current=published
    return {...outcome,current,...(current.saveStatus==='saved'&&!current.hasCandidate&&outcome.lastSaved.revision===current.revision?{lastSaved:current}:{})}
  }

  exportCandidate(): string {
    requireRule(this.#candidate !== null, 'NO_UNSAVED_CANDIDATE')
    return this.#options.codec.export(this.#candidate.nextRun)
  }
  exportSaved(): string { return this.#options.codec.export(this.#record.run) }

  async reload(options: { readonly discardCandidate?: boolean } = {}): Promise<void> {
    requireRule(this.#status !== 'closed' && this.#flight === null && !this.#externalBusy, 'SAVE_IN_PROGRESS')
    requireRule(this.#candidate === null || options.discardCandidate === true, 'UNSAVED_CANDIDATE_EXISTS')
    this.#externalBusy = true
    this.#notify()
    let lease = this.#lease
    try {
      if (lease.mode !== 'writer') lease = await this.#options.locks.acquire(`${this.#options.store.name}:${this.#options.runId}`)
      const latest = await this.#options.store.load(this.#options.runId)
      requireRule(latest && latest.run.actorId === this.#options.actorId, 'FORBIDDEN_ACTOR')
      this.#record = latest; this.#candidate = null;this.#checkpointCandidate=null; this.#lease = lease
      this.#status = lease.mode === 'writer' ? 'saved' : 'read_only'
    } catch (error) { if (lease !== this.#lease) await lease.release(); throw error }
    finally { this.#externalBusy = false; this.#notify() }
  }

  async restore(text: string, importId: string): Promise<void> {
    const blocked = this.#blockReason()
    requireRule(blocked === null, blocked ?? 'RESTORE_BLOCKED')
    const source = this.#options.codec.import(text)
    requireRule(source.runId === this.#options.runId && source.actorId === this.#options.actorId, 'WRONG_RUN')
    this.#externalBusy = true; this.#status = 'saving'; this.#notify()
    try {
      const imported = await this.#options.store.importSave(text, { importId, actorId: this.#options.actorId, mode: 'replace', expectedRevision: this.#record.run.revision, expectedGeneration: this.#record.generation })
      this.#record = imported.record; this.#status = 'saved'
    } catch (error) { this.#status = errorCode(error) === 'STALE_REVISION' ? 'conflict' : 'saved'; throw error }
    finally { this.#externalBusy = false; this.#notify() }
  }

  async close(options: { readonly discardCandidate?: boolean } = {}): Promise<void> {
    if (this.#status === 'closed') return
    requireRule(!this.#externalBusy, 'SAVE_IN_PROGRESS')
    if (this.#flight !== null) await this.#flight.promise
    requireRule(this.#candidate === null || options.discardCandidate === true, 'UNSAVED_CANDIDATE_EXISTS')
    this.#candidate = null;this.#checkpointCandidate=null;this.#previewer=null;this.#previewRecord=null
    this.#status = 'closed'; this.#notify(); this.#listeners.clear()
    await this.#lease.release()
  }
}

export {guardUnsavedClose} from './session-close-guard.ts'
