import { evaluateCommand, fingerprintCommand, previewCommand, projectRun, type CommandPreview, type CommandRegistry } from '../core/commands.ts'
import { commandIdentifier } from '../core/command-identity.ts'
import { copyJson } from '../core/json-input.ts'
import { requireRule, RuleError } from '../core/errors.ts'
import type { CommandReceipt, ProposedRun } from '../core/run-types.ts'
import type { RunStore, StoredRun } from '../persistence/indexeddb.ts'
import { RunCodec } from '../persistence/codec.ts'
import type { WriterAccess, WriterLease } from '../persistence/writer-lock.ts'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'conflict' | 'read_only' | 'closed'
type PublicReceipt = Pick<CommandReceipt, 'commandId' | 'kind' | 'revisionAfter' | 'date' | 'summary'>
export type SessionResult = { readonly status: 'saved' | 'duplicate'; readonly receipt: PublicReceipt; readonly reasonCodes: readonly string[] } | { readonly status: 'rejected' | 'unsaved' | 'conflict'; readonly reasonCodes: readonly string[] }
interface SessionOptions { readonly store: RunStore; readonly codec: RunCodec; readonly registry: CommandRegistry; readonly locks: WriterAccess; readonly runId: string; readonly actorId: string }
type Flight = { readonly commandId: string; readonly signature: string; readonly promise: Promise<SessionResult> }

function rejected(code: string): SessionResult { return { status: 'rejected', reasonCodes: [code] } }
function errorCode(error: unknown): string { return error instanceof RuleError ? error.code : 'SAVE_FAILED' }
function publicReceipt(receipt: CommandReceipt): PublicReceipt { return { commandId: receipt.commandId, kind: receipt.kind, revisionAfter: receipt.revisionAfter, date: receipt.date, summary: receipt.summary } }

export class RunSession {
  readonly #options: SessionOptions
  #record: StoredRun
  #lease: WriterLease
  #candidate: ProposedRun | null = null
  #flight: Flight | null = null
  #externalBusy = false
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

  get view() {
    // Never publish uncommitted outcomes, hidden evidence, or success receipts.
    return { ...projectRun(this.#record.run), features:this.#options.registry.runtime?.project?.(this.#record.run)??{}, saveStatus: this.#status, busy: this.#flight !== null || this.#externalBusy, readOnly: this.#lease.mode !== 'writer', readOnlyReason: this.#lease.reason, hasCandidate: this.#candidate !== null, pendingRevision: this.#candidate?.nextRun.revision ?? null }
  }
  get savedView() { return projectRun(this.#record.run) }
  get needsUnsavedWarning(): boolean { return this.#candidate !== null || this.#status === 'saving' }

  subscribe(listener: (view: RunSession['view']) => void): () => void {
    requireRule(this.#status !== 'closed', 'SESSION_CLOSED')
    this.#listeners.add(listener)
    try { listener(this.view) } catch { this.#listeners.delete(listener) }
    return () => { this.#listeners.delete(listener) }
  }
  #notify(): void {
    for (const listener of [...this.#listeners]) {
      // A view observer must not interrupt or fabricate a durable commit.
      try { listener(this.view) } catch { this.#listeners.delete(listener) }
    }
  }

  preview(raw: unknown): CommandPreview {
    const blocked = this.#blockReason()
    if (blocked !== null) return { allowed: false, reasonCodes: [blocked], actionPoints: 0, upfrontCostFen: 0, releasedFen: 0 }
    return previewCommand(this.#record.run, raw, this.#options.registry, this.#options.actorId)
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
      const committed = await this.#options.store.commit(proposal, this.#record.generation)
      this.#record = committed.record
      this.#candidate = null
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
    const promise = this.#saveCandidate().finally(() => { this.#flight = null; this.#notify() })
    this.#flight = { commandId: candidate.receipt.commandId, signature: candidate.receipt.payloadSignature, promise }
    this.#notify()
    return promise
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
      this.#record = latest; this.#candidate = null; this.#lease = lease
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
    this.#candidate = null
    this.#status = 'closed'; this.#notify(); this.#listeners.clear()
    await this.#lease.release()
  }
}

export function guardUnsavedClose(session: RunSession, target: Window = globalThis.window): () => void {
  const handler = (event: BeforeUnloadEvent) => {
    if (session.needsUnsavedWarning) { event.preventDefault(); event.returnValue = '' }
  }
  target.addEventListener('beforeunload', handler)
  return () => target.removeEventListener('beforeunload', handler)
}
