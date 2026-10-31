import { z } from 'zod'
import { requireRule, RuleError } from '../core/errors.ts'
import { canonicalJson } from '../core/identity.ts'
import { commandIdentifier } from '../core/command-identity.ts'
import { hashText,hashValue } from '../core/hash.ts'
import type { CommandReceipt, GameRun, ProposedRun } from '../core/run-types.ts'
import { RunCodec } from './codec.ts'
import type {SaveDocument} from './save-packing.ts'
import { causeSchema, commandIdSchema, commandReceiptSchema } from './schemas.ts'
import {captureWaitCheckpoint,checkpointBaseMatches,type WaitCheckpoint} from './wait-checkpoint.ts'

const STORES = ['heads', 'backups', 'receipts', 'logs', 'imports'] as const
const generationSchema = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER)
const rowSchema = z.strictObject({ runId: commandIdSchema, generation: generationSchema, envelope: z.unknown() })
const receiptRowSchema = z.strictObject({ runId: commandIdSchema, commandId: commandIdSchema, receipt: commandReceiptSchema })
const logRowSchema = z.strictObject({ runId: commandIdSchema, revision: generationSchema, causes: z.array(causeSchema) })
const importRowSchema = z.strictObject({ runId: commandIdSchema, importId: commandIdSchema, actorId: commandIdSchema, payloadHash: z.string().regex(/^[0-9a-f]{64}$/), signature: z.string(), generationAfter: generationSchema, revisionAfter: generationSchema })
interface StoredRow { readonly runId: string; readonly generation: number; readonly envelope: SaveDocument }
export interface StoredRun { readonly run: GameRun; readonly generation: number }
export interface CommitResult { readonly record: StoredRun; readonly receipt: CommandReceipt; readonly duplicate: boolean }
export type ImportOptions = { readonly importId: string; readonly actorId: string } & (
  | { readonly mode: 'create' }
  | { readonly mode: 'replace'; readonly expectedRevision: number; readonly expectedGeneration: number }
)
export interface ImportResult { readonly record: StoredRun; readonly duplicate: boolean; readonly importId: string }
export interface RunListing {readonly runId:string;readonly revision:number|null;readonly date:string|null;readonly backgroundId:string|null;readonly compatible:boolean;readonly errorCode:string|null}
export interface RunStore {
  readonly name: string
  readonly supportsWaitCheckpoints?:boolean
  load(runId: string): Promise<StoredRun | null>
  create(run: GameRun): Promise<CommitResult>
  commit(proposal: ProposedRun, expectedGeneration: number): Promise<CommitResult>
  commitCheckpoint?(checkpoint:WaitCheckpoint,expectedGeneration:number):Promise<CommitResult>
  loadBackup(runId: string): Promise<StoredRun | null>
  importSave(text: string, options: ImportOptions): Promise<ImportResult>
  exportStored(runId: string, backup?: boolean): Promise<string | null>
}
interface StoreOptions { readonly name?: string; readonly factory?: IDBFactory; readonly keyRange?: Pick<typeof IDBKeyRange, 'bound'>; readonly codec: RunCodec }

export class IndexedDbRunStore implements RunStore {
  readonly name: string
  readonly #factory: IDBFactory
  readonly #ranges: Pick<typeof IDBKeyRange, 'bound'>
  readonly #codec: RunCodec
  #connection: Promise<IDBDatabase> | null = null

  constructor(options: StoreOptions) {
    this.name = options.name ?? 'reborn-2020-local-v1'
    this.#factory = options.factory ?? globalThis.indexedDB
    this.#ranges = options.keyRange ?? globalThis.IDBKeyRange
    requireRule(this.#factory && this.#ranges, 'STORAGE_UNAVAILABLE')
    this.#codec = options.codec
  }

  // A subclass may attach policy to commit. It must explicitly implement the
  // checkpoint policy before the session can bypass that single-step hook.
  get supportsWaitCheckpoints():boolean{return this.commit===IndexedDbRunStore.prototype.commit}

  async #database(): Promise<IDBDatabase> {
    if (this.#connection === null) {
      const opening: Promise<IDBDatabase> = new Promise<IDBDatabase>((resolve, reject) => {
        let request: IDBOpenDBRequest
        try { request = this.#factory.open(this.name, 1) } catch { reject(new RuleError('STORAGE_UNAVAILABLE')); return }
        let cancelled = false
        request.onupgradeneeded = () => {
          const database = request.result
          for (const name of STORES) if (!database.objectStoreNames.contains(name)) database.createObjectStore(name, { keyPath: name === 'receipts' ? ['runId', 'commandId'] : name === 'logs' ? ['runId', 'revision'] : name === 'imports' ? ['runId', 'importId'] : 'runId' })
        }
        request.onerror = () => reject(new RuleError(request.error?.name === 'VersionError' ? 'INCOMPATIBLE_DATABASE_VERSION' : 'DATABASE_OPEN_FAILED'))
        request.onblocked = () => { cancelled = true; reject(new RuleError('DATABASE_BLOCKED')) }
        request.onsuccess = () => {
          const database = request.result
          if (cancelled) { database.close(); return }
          database.onversionchange = () => { database.close(); this.#connection = null }
          resolve(database)
        }
      })
      this.#connection = opening
      void opening.catch(() => { if (this.#connection === opening) this.#connection = null })
    }
    return this.#connection
  }

  async #transaction<T>(stores: readonly string[], mode: IDBTransactionMode, schedule: (transaction: IDBTransaction, finish: (value: T) => void, abort: (error: unknown) => void) => void): Promise<T> {
    const database = await this.#database()
    return new Promise<T>((resolve, reject) => {
      let transaction: IDBTransaction
      try { transaction = database.transaction([...stores], mode) } catch { reject(new RuleError('DATABASE_TRANSACTION_FAILED')); return }
      let result: T
      let ready = false
      let failure: RuleError | null = null
      const abort = (error: unknown) => {
        failure = error instanceof RuleError ? error : new RuleError('SAVE_REQUEST_FAILED')
        try { transaction.abort() } catch { reject(failure) }
      }
      transaction.onabort = () => reject(transaction.error?.name === 'QuotaExceededError' ? new RuleError('STORAGE_QUOTA_EXCEEDED') : failure ?? new RuleError(transaction.error === null ? 'SAVE_ABORTED' : 'SAVE_TRANSACTION_FAILED'))
      transaction.oncomplete = () => {
        if (failure !== null) reject(failure)
        else if (!ready) reject(new RuleError('STORE_NO_RESULT'))
        else resolve(result)
      }
      try { schedule(transaction, (value) => { result = value; ready = true }, abort) } catch (error) { abort(error) }
    })
  }

  #readRow(raw: unknown): { readonly row: StoredRow; readonly record: StoredRun } | null {
    if (raw === undefined) return null
    const parsed = rowSchema.safeParse(raw)
    requireRule(parsed.success, 'INVALID_STORED_RECORD')
    const envelope = this.#codec.readEnvelope(parsed.data.envelope)
    requireRule(parsed.data.runId === envelope.runId, 'STORED_RUN_ID_MISMATCH')
    // readEnvelope verified this wire document; retain its exact physical form for backups.
    const row = { runId: envelope.runId, generation: parsed.data.generation, envelope:parsed.data.envelope as SaveDocument }
    return { row, record: { run: envelope.state, generation: row.generation } }
  }

  #commandRange(runId: string): IDBKeyRange { return this.#ranges.bound([runId, ''], [runId, '\uffff']) }
  #logRange(runId: string): IDBKeyRange { return this.#ranges.bound([runId, 0], [runId, Number.MAX_SAFE_INTEGER]) }

  #writeRecords(transaction: IDBTransaction, run: GameRun, receipts: readonly CommandReceipt[]): void {
    for (const receipt of receipts) {
      transaction.objectStore('receipts').put({ runId: run.runId, commandId: receipt.commandId, receipt })
      transaction.objectStore('logs').put({ runId: run.runId, revision: receipt.revisionAfter, causes: run.causes.filter((cause) => cause.commandId === receipt.commandId) })
    }
  }

  async load(runId: string): Promise<StoredRun | null> {
    return this.#transaction(['heads', 'receipts', 'logs'], 'readonly', (transaction, finish, abort) => {
      const request = transaction.objectStore('heads').get(runId)
      request.onsuccess = () => {
        try {
          const loaded = this.#readRow(request.result)
          if (!loaded) { finish(null); return }
          const receipts = transaction.objectStore('receipts').getAll(this.#commandRange(runId))
          const logs = transaction.objectStore('logs').getAll(this.#logRange(runId))
          let receiptRows: unknown[] | null = null
          let logRows: unknown[] | null = null
          const validate = () => {
            if (receiptRows === null || logRows === null) return
            try {
              const run = loaded.record.run
              requireRule(receiptRows.length === run.receipts.length && logRows.length === run.receipts.length, 'STORE_BUNDLE_MISMATCH')
              for (const raw of receiptRows) {
                const row = receiptRowSchema.parse(raw)
                const expected = run.receipts.find((receipt) => receipt.commandId === row.commandId)
                requireRule(row.runId === runId && expected && canonicalJson(expected) === canonicalJson(row.receipt), 'STORE_RECEIPT_MISMATCH')
              }
              for (const raw of logRows) {
                const row = logRowSchema.parse(raw)
                const receipt = run.receipts.find((item) => item.revisionAfter === row.revision)
                requireRule(row.runId === runId && receipt && canonicalJson(row.causes) === canonicalJson(run.causes.filter((cause) => cause.commandId === receipt.commandId)), 'STORE_LOG_MISMATCH')
              }
              finish(loaded.record)
            } catch (error) { abort(error) }
          }
          receipts.onsuccess = () => { receiptRows = receipts.result; validate() }
          logs.onsuccess = () => { logRows = logs.result; validate() }
        } catch (error) { abort(error) }
      }
    })
  }

  async listRuns():Promise<readonly RunListing[]>{
    return this.#transaction(['heads'],'readonly',(transaction,finish)=>{
      const request=transaction.objectStore('heads').getAll()
      request.onsuccess=()=>finish(request.result.map((raw:unknown)=>{
        const row=rowSchema.safeParse(raw)
        if(!row.success)return {runId:'invalid-record',revision:null,date:null,backgroundId:null,compatible:false,errorCode:'INVALID_STORED_RECORD'}
        try{const loaded=this.#readRow(raw);requireRule(loaded,'RUN_NOT_FOUND');const run=loaded.record.run;return {runId:run.runId,revision:run.revision,date:run.timeline.cursor.date,backgroundId:run.backgroundId,compatible:true,errorCode:null}}
        catch(error){return {runId:row.data.runId,revision:null,date:null,backgroundId:null,compatible:false,errorCode:error instanceof RuleError?error.code:'INVALID_STORED_RECORD'}}
      }))
    })
  }

  async loadBackup(runId: string): Promise<StoredRun | null> {
    return this.#transaction(['backups'], 'readonly', (transaction, finish, abort) => {
      const request = transaction.objectStore('backups').get(runId)
      request.onsuccess = () => { try { finish(this.#readRow(request.result)?.record ?? null) } catch (error) { abort(error) } }
    })
  }

  async create(run: GameRun): Promise<CommitResult> {
    const prepared=this.#codec.prepare(run),envelope=prepared.envelope
    const state = envelope.state
    requireRule(state.revision === 1 && state.receipts[0]?.kind === 'CreateRun', 'INVALID_NEW_RUN')
    const receipt = state.receipts[0]
    return this.#transaction(['heads', 'receipts', 'logs'], 'readwrite', (transaction, finish, abort) => {
      const request = transaction.objectStore('heads').get(state.runId)
      request.onsuccess = () => {
        try {
          const existing = this.#readRow(request.result)
          if (existing) {
            requireRule(existing.record.run.actorId === state.actorId, 'FORBIDDEN_ACTOR')
            const first = existing.record.run.receipts[0]
            requireRule(first?.commandId === receipt.commandId, 'RUN_ALREADY_EXISTS')
            requireRule(first.payloadHash === receipt.payloadHash && first.payloadSignature === receipt.payloadSignature, 'COMMAND_ID_REUSED')
            finish({ record: existing.record, receipt: first, duplicate: true })
            return
          }
          const row: StoredRow = { runId: state.runId, generation: 1, envelope:prepared.storage }
          transaction.objectStore('heads').add(row)
          this.#writeRecords(transaction, envelope.state, envelope.state.receipts)
          finish({ record: { run: envelope.state, generation: 1 }, receipt, duplicate: false })
        } catch (error) { abort(error) }
      }
    })
  }

  async commit(proposal: ProposedRun, expectedGeneration: number): Promise<CommitResult> {
    const prepared=this.#codec.prepare(proposal.nextRun),envelope=prepared.envelope
    const last = envelope.state.receipts.at(-1)
    requireRule(last && canonicalJson(last) === canonicalJson(proposal.receipt) && proposal.previousRevision + 1 === envelope.revision, 'INVALID_PROPOSAL')
    const previousRevision = proposal.previousRevision
    const receipt = last
    requireRule(Number.isSafeInteger(expectedGeneration) && expectedGeneration >= 1, 'INVALID_STORAGE_GENERATION')
    return this.#transaction(['heads', 'backups', 'receipts', 'logs'], 'readwrite', (transaction, finish, abort) => {
      const headRequest = transaction.objectStore('heads').get(envelope.runId)
      headRequest.onsuccess = () => {
        try {
          const current = this.#readRow(headRequest.result)
          requireRule(current, 'RUN_NOT_FOUND')
          requireRule(current.record.run.actorId === envelope.state.actorId, 'FORBIDDEN_ACTOR')
          const receiptRequest = transaction.objectStore('receipts').get([envelope.runId, receipt.commandId])
          receiptRequest.onsuccess = () => {
            try {
              if (receiptRequest.result !== undefined) {
                const row = receiptRowSchema.parse(receiptRequest.result)
                const prior = current.record.run.receipts.find((item) => item.commandId === receipt.commandId)
                requireRule(prior && canonicalJson(prior) === canonicalJson(row.receipt), 'STORE_RECEIPT_MISMATCH')
                requireRule(prior.payloadHash === receipt.payloadHash && prior.payloadSignature === receipt.payloadSignature, 'COMMAND_ID_REUSED')
                finish({ record: current.record, receipt: prior, duplicate: true })
                return
              }
              requireRule(current.record.generation === expectedGeneration && current.record.run.revision === previousRevision, 'STALE_REVISION')
              requireRule(current.record.generation < Number.MAX_SAFE_INTEGER, 'STORAGE_GENERATION_EXHAUSTED')
              const generation = current.record.generation + 1
              transaction.objectStore('backups').put(current.row)
              transaction.objectStore('heads').put({ runId: envelope.runId, generation, envelope:prepared.storage })
              this.#writeRecords(transaction, envelope.state, [last])
              finish({ record: { run: envelope.state, generation }, receipt: last, duplicate: false })
            } catch (error) { abort(error) }
          }
        } catch (error) { abort(error) }
      }
    })
  }

  /** All original receipt/log rows become durable in the same transaction as the checkpoint. */
  async commitCheckpoint(input:WaitCheckpoint,expectedGeneration:number):Promise<CommitResult>{
    requireRule(this.supportsWaitCheckpoints,'WAIT_CHECKPOINT_UNAVAILABLE')
    const captured=captureWaitCheckpoint(input)
    requireRule(Number.isSafeInteger(expectedGeneration)&&expectedGeneration>=1,'INVALID_STORAGE_GENERATION')
    requireRule(Number.isSafeInteger(expectedGeneration+captured.count),'STORAGE_GENERATION_EXHAUSTED')
    const final=this.#codec.prepare(captured.nextRun),previous=captured.count===1?null:this.#codec.prepare(captured.previousRun)
    const state=final.envelope.state,receipt=state.receipts.at(-1)!,receipts=state.receipts.slice(-captured.count)
    return this.#transaction(['heads','backups','receipts','logs'],'readwrite',(transaction,finish,abort)=>{
      const request=transaction.objectStore('heads').get(state.runId)
      request.onsuccess=()=>{
        try{
          const current=this.#readRow(request.result)
          requireRule(current,'RUN_NOT_FOUND');requireRule(current.record.run.actorId===state.actorId,'FORBIDDEN_ACTOR')
          const existing=current.record.run.receipts.find(row=>row.commandId===receipt.commandId)
          if(existing){
            requireRule(canonicalJson(existing)===canonicalJson(receipt),'COMMAND_ID_REUSED')
            const identity=(run:GameRun)=>[run.runId,run.actorId,run.seed,run.versions,run.backgroundId,run.origin,run.personalAccountId,run.playerProfile]
            requireRule(canonicalJson(identity(current.record.run))===canonicalJson(identity(state))&&canonicalJson(current.record.run.receipts.slice(0,state.receipts.length))===canonicalJson(state.receipts)&&canonicalJson(current.record.run.causes.slice(0,state.causes.length))===canonicalJson(state.causes),'WAIT_CHECKPOINT_PREFIX_MISMATCH')
            if(current.record.run.revision===state.revision)requireRule(checkpointBaseMatches(current.record.run,hashValue(state)),'WAIT_CHECKPOINT_PREFIX_MISMATCH')
            let remaining=receipts.length*2
            const done=()=>{if(--remaining===0)finish({record:current.record,receipt:existing,duplicate:true})}
            for(const row of receipts){
              const saved=current.record.run.receipts.find(item=>item.commandId===row.commandId)
              requireRule(saved&&canonicalJson(saved)===canonicalJson(row),'STORE_RECEIPT_MISMATCH')
              const receiptRequest=transaction.objectStore('receipts').get([state.runId,row.commandId]),logRequest=transaction.objectStore('logs').get([state.runId,row.revisionAfter])
              receiptRequest.onsuccess=()=>{try{const stored=receiptRowSchema.parse(receiptRequest.result);requireRule(stored.runId===state.runId&&canonicalJson(stored.receipt)===canonicalJson(row),'STORE_RECEIPT_MISMATCH');done()}catch(error){abort(error)}}
              logRequest.onsuccess=()=>{try{const stored=logRowSchema.parse(logRequest.result);requireRule(stored.runId===state.runId&&canonicalJson(stored.causes)===canonicalJson(current.record.run.causes.filter(cause=>cause.commandId===row.commandId)),'STORE_LOG_MISMATCH');done()}catch(error){abort(error)}}
            }
            return
          }
          requireRule(current.record.generation===expectedGeneration&&current.record.run.revision===captured.baseRevision,'STALE_REVISION')
          requireRule(checkpointBaseMatches(current.record.run,captured.baseHash),'WAIT_CHECKPOINT_PREFIX_MISMATCH')
          for(const row of receipts)requireRule(!current.record.run.receipts.some(old=>old.commandId===row.commandId),'COMMAND_ID_REUSED')
          let remaining=receipts.length*2
          const absent=(value:unknown)=>{
            requireRule(value===undefined,'STORE_BUNDLE_MISMATCH')
            if(--remaining!==0)return
            const generation=expectedGeneration+captured.count
            transaction.objectStore('backups').put(previous?{runId:state.runId,generation:generation-1,envelope:previous.storage}:current.row)
            transaction.objectStore('heads').put({runId:state.runId,generation,envelope:final.storage})
            this.#writeRecords(transaction,state,receipts)
            finish({record:{run:state,generation},receipt,duplicate:false})
          }
          for(const row of receipts){
            const storedReceipt=transaction.objectStore('receipts').get([state.runId,row.commandId]),storedLog=transaction.objectStore('logs').get([state.runId,row.revisionAfter])
            storedReceipt.onsuccess=()=>{try{absent(storedReceipt.result)}catch(error){abort(error)}}
            storedLog.onsuccess=()=>{try{absent(storedLog.result)}catch(error){abort(error)}}
          }
        }catch(error){abort(error)}
      }
    })
  }

  async importSave(text: string, options: ImportOptions): Promise<ImportResult> {
    const requestOptions = { ...options }
    commandIdentifier(requestOptions.importId); commandIdentifier(requestOptions.actorId)
    requireRule(requestOptions.mode === 'create' || requestOptions.mode === 'replace', 'INVALID_IMPORT_MODE')
    const run = this.#codec.import(text)
    requireRule(run.actorId === requestOptions.actorId, 'FORBIDDEN_ACTOR')
    const prepared=this.#codec.prepare(run),envelope=prepared.envelope
    const signature = canonicalJson({ runId: run.runId, actorId: requestOptions.actorId, mode: requestOptions.mode, checksum: envelope.checksum })
    const payloadHash = hashText(signature)
    return this.#transaction(STORES, 'readwrite', (transaction, finish, abort) => {
      const headRequest = transaction.objectStore('heads').get(run.runId)
      headRequest.onsuccess = () => {
        try {
          const current = this.#readRow(headRequest.result)
          if (current) requireRule(current.record.run.actorId === requestOptions.actorId, 'FORBIDDEN_ACTOR')
          const priorRequest = transaction.objectStore('imports').get([run.runId, requestOptions.importId])
          priorRequest.onsuccess = () => {
            try {
              if (priorRequest.result !== undefined) {
                const prior = importRowSchema.parse(priorRequest.result)
                requireRule(prior.payloadHash === payloadHash && prior.signature === signature && prior.actorId === requestOptions.actorId, 'COMMAND_ID_REUSED')
                requireRule(current, 'RUN_NOT_FOUND')
                finish({ record: current.record, duplicate: true, importId: requestOptions.importId })
                return
              }
              if (requestOptions.mode === 'create') requireRule(current === null, 'IMPORT_TARGET_EXISTS')
              else requireRule(current && current.record.generation === requestOptions.expectedGeneration && current.record.run.revision === requestOptions.expectedRevision, 'STALE_REVISION')
              const oldGeneration = current?.record.generation ?? 0
              requireRule(oldGeneration < Number.MAX_SAFE_INTEGER, 'STORAGE_GENERATION_EXHAUSTED')
              const generation = oldGeneration + 1
              if (current) transaction.objectStore('backups').put(current.row)
              transaction.objectStore('receipts').delete(this.#commandRange(run.runId))
              transaction.objectStore('logs').delete(this.#logRange(run.runId))
              transaction.objectStore('heads').put({ runId: run.runId, generation, envelope:prepared.storage })
              this.#writeRecords(transaction, run, run.receipts)
              transaction.objectStore('imports').put({ runId: run.runId, importId: requestOptions.importId, actorId: requestOptions.actorId, payloadHash, signature, generationAfter: generation, revisionAfter: run.revision })
              finish({ record: { run, generation }, duplicate: false, importId: requestOptions.importId })
            } catch (error) { abort(error) }
          }
        } catch (error) { abort(error) }
      }
    })
  }

  async exportStored(runId: string, backup = false): Promise<string | null> {
    const store = backup ? 'backups' : 'heads'
    return this.#transaction([store], 'readonly', (transaction, finish, abort) => {
      const request = transaction.objectStore(store).get(runId)
      request.onsuccess = () => {
        try {
          if (request.result === undefined) { finish(null); return }
          const row = rowSchema.parse(request.result)
          requireRule(row.runId === runId, 'STORED_RUN_ID_MISMATCH')
          // Export raw versioned data without executing or silently migrating it.
          finish(canonicalJson(row.envelope))
        } catch (error) { abort(error) }
      }
    })
  }

  async close(): Promise<void> {
    const connection = this.#connection
    this.#connection = null
    if (connection !== null) (await connection).close()
  }
}
