import { requireRule, RuleError } from '../core/errors.ts'
import { canonicalJson } from '../core/identity.ts'
import { assertJsonInput,inspectJsonInput } from '../core/json-input.ts'
import { hashValue, hashText, utf8Length } from '../core/hash.ts'
import { assertGameRun } from '../core/run.ts'
import { assertCompatible } from '../core/versions.ts'
import { commandIdentity } from '../core/command-identity.ts'
import { compareTimePoints, queueEvent, type TimePoint } from '../core/timeline.ts'
import type { CommandRegistry } from '../core/commands.ts'
import type { GameRun, VersionSet } from '../core/run-types.ts'
import type { EconomyOperation } from '../core/economy.ts'
import { isWorldOperation } from '../core/content-types.ts'
import { envelopeSchema, eventSchema, parseEconomyOperation, parseLedgerOperation, runSchema } from './schemas.ts'
import {MAX_ENCODED_SAVE_BYTES,MAX_LOGICAL_SAVE_BYTES,MAX_LOGICAL_SAVE_NODES,packSave,unpackSave,assertPackedMetadata,type SaveDocument} from './save-packing.ts'

export const MAX_SAVE_BYTES = MAX_ENCODED_SAVE_BYTES
export interface SaveEnvelope extends VersionSet {
  readonly saveVersion: 1
  readonly runId: string
  readonly revision: number
  readonly checksum: string
  readonly state: GameRun
}
export interface PreparedSave {readonly envelope:SaveEnvelope;readonly storage:SaveDocument;readonly text:string}

function parseSignature(value: string): unknown {
  try { return JSON.parse(value) } catch { throw new RuleError('INVALID_RECEIPT_SIGNATURE') }
}

function unique(values: readonly string[], code: string): void { requireRule(new Set(values).size === values.length, code) }
function recordBody(value: unknown): Record<string, unknown> {
  requireRule(typeof value === 'object' && value !== null && !Array.isArray(value), 'INVALID_RECEIPT_SIGNATURE')
  return value as Record<string, unknown>
}

// Only the private JSON.parse path uses this after assertJsonInput. It cannot
// contain getters, custom toJSON/map methods, sparse arrays or proxy behavior.
function hasCanonicalKeyOrder(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return true
  const keys = Object.keys(value)
  if (!Array.isArray(value)) for (let i = 1; i < keys.length; i++) if (keys[i - 1]! > keys[i]!) return false
  return keys.every(key => hasCanonicalKeyOrder(Reflect.get(value, key)))
}
function encodeParsedJson(value: unknown): string {
  if (!hasCanonicalKeyOrder(value)) return canonicalJson(value)
  const encoded = JSON.stringify(value)
  requireRule(typeof encoded === 'string', 'INVALID_PAYLOAD')
  return encoded
}
function sameJsonData(first: unknown, second: unknown): boolean {
  if (first === second) return true
  if (first === null || second === null || typeof first !== 'object' || typeof second !== 'object' || Array.isArray(first) !== Array.isArray(second)) return false
  const keys = Object.keys(first)
  return keys.length === Object.keys(second).length && keys.every(key => Object.hasOwn(second, key) && sameJsonData(Reflect.get(first, key), Reflect.get(second, key)))
}

export class RunCodec {
  readonly registry: CommandRegistry
  readonly backgrounds: readonly string[]
  constructor(registry: CommandRegistry, backgrounds: readonly string[]) {
    this.registry = registry
    this.backgrounds = [...backgrounds]
  }

  validateRun(value: unknown): GameRun {
    inspectJsonInput(value,MAX_LOGICAL_SAVE_NODES)
    const parsed = runSchema.safeParse(value)
    requireRule(parsed.success, 'INVALID_RUN_SHAPE')
    // Strict JSON schemas establish field types, followed by cross-record invariants.
    const run = parsed.data as GameRun
    assertCompatible(run.versions, this.registry.versions)
    requireRule(this.backgrounds.includes(run.backgroundId), 'UNKNOWN_BACKGROUND')
    assertGameRun(run)
    this.#references(run)
    requireRule(run.world === null || this.registry.runtime !== null, 'WORLD_HANDLER_REQUIRED')
    requireRule(run.deepseek===null||this.registry.runtime!==null,'DEEPSEEK_HANDLER_REQUIRED')
    requireRule(run.story===null||this.registry.runtime!==null,'STORY_HANDLER_REQUIRED')
    requireRule(run.life===null||this.registry.runtime!==null,'LIFE_HANDLER_REQUIRED')
    requireRule(run.routines===null||this.registry.runtime!==null,'ROUTINE_HANDLER_REQUIRED')
    requireRule(run.relay===null||this.registry.runtime!==null,'RELAY_HANDLER_REQUIRED')
    requireRule(run.course === null || this.registry.runtime !== null, 'COURSE_HANDLER_REQUIRED')
    requireRule(run.video === null || this.registry.runtime !== null, 'VIDEO_HANDLER_REQUIRED')
    requireRule(run.market === null || this.registry.runtime !== null, 'MARKET_HANDLER_REQUIRED')
    this.registry.runtime?.validate(run)
    return run
  }

  #references(run: GameRun): void {
    const ledger = run.economy.ledger
    const accounts = new Set(ledger.accounts.map((account) => account.id))
    const contracts = new Map(ledger.contracts.map((contract) => [contract.id, contract]))
    const reservations = new Map(ledger.reservations.map((reservation) => [reservation.id, reservation]))
    const obligations = new Map(ledger.obligations.map((obligation) => [obligation.id, obligation]))
    const economics = new Map<string, EconomyOperation>()
    for (const receipt of run.economy.receipts) {
      const operation = parseEconomyOperation(parseSignature(receipt.signature))
      requireRule(operation.id === receipt.id && canonicalJson(operation) === receipt.signature && operation.date <= run.timeline.cursor.date, 'INVALID_ECONOMY_RECEIPT')
      economics.set(receipt.id, operation)
    }
    unique(ledger.openingPosted, 'DUPLICATE_OPENING')
    for (const accountId of ledger.openingPosted) requireRule(accounts.has(accountId), 'INVALID_ACCOUNT_REFERENCE')
    const financial = new Map(ledger.receipts.map((receipt) => {
      const operation = parseLedgerOperation(parseSignature(receipt.signature))
      requireRule(operation.id === receipt.id && operation.kind === receipt.kind && operation.accountId === receipt.accountId && (operation.contractId ?? null) === receipt.contractId && canonicalJson(operation) === receipt.signature, 'INVALID_LEDGER_RECEIPT')
      requireRule(operation.date <= run.timeline.cursor.date && accounts.has(operation.accountId), 'INVALID_ACCOUNT_REFERENCE')
      if ('counterpartyId' in operation) requireRule(accounts.has(operation.counterpartyId), 'INVALID_ACCOUNT_REFERENCE')
      if ('targetAccountId' in operation) requireRule(accounts.has(operation.targetAccountId), 'INVALID_ACCOUNT_REFERENCE')
      const direct = economics.get(operation.id)
      if (direct) requireRule(canonicalJson(direct) === receipt.signature, 'ECONOMY_LEDGER_RECEIPT_MISMATCH')
      else {
        const suffix = [':funds', ':cost', ':release'].find((ending) => operation.id.endsWith(ending))
        const parent = suffix ? economics.get(operation.id.slice(0, -suffix.length)) : undefined
        requireRule(parent && ['reserve_action', 'execute_action', 'cancel_action'].includes(parent.kind), 'ORPHAN_LEDGER_OPERATION')
      }
      return [receipt.id, operation] as const
    }))
    for (const entry of ledger.transactions) {
      const operation = financial.get(entry.id)
      requireRule(operation && entry.date === operation.date && entry.sourceEventId === operation.sourceEventId, 'INVALID_TRANSACTION_REFERENCE')
    }
    for (const entry of ledger.metrics) requireRule(financial.has(entry.operationId), 'INVALID_METRIC_REFERENCE')
    for (const obligation of ledger.obligations) {
      const operation = financial.get(obligation.originOperationId)
      requireRule(operation && operation.accountId === obligation.accountId && (operation.kind === 'borrow_cash' || operation.kind === 'incur_supplier_usage' ? operation.dueAt : operation.date) === obligation.date, 'INVALID_OBLIGATION_REFERENCE')
      if (obligation.kind !== 'expense' && obligation.kind !== 'loan_principal') requireRule(obligation.contractId !== null && contracts.get(obligation.contractId)?.accountId === obligation.accountId, 'INVALID_CONTRACT_REFERENCE')
      if (obligation.protectionReservationId !== null) requireRule(reservations.get(obligation.protectionReservationId)?.accountId === obligation.accountId, 'INVALID_RESERVATION_REFERENCE')
    }
    for (const receipt of ledger.receipts) {
      const operation = financial.get(receipt.id)
      if (operation && (operation.kind === 'refund_delivered' || operation.kind === 'refund_undelivered')) {
        const source = financial.get(operation.referenceId)
        requireRule(source && 'contractId' in source && source.contractId === operation.contractId && source.accountId === operation.accountId, 'INVALID_REFUND_REFERENCE')
      }
    }
    for(const receivable of ledger.marketReceivables){
      const origin=financial.get(receivable.originOperationId)
      requireRule(origin&&(origin.kind==='trade_sell'||origin.kind==='record_market_income')&&origin.receivableId===receivable.id&&origin.accountId===receivable.accountId&&origin.counterpartyId===receivable.counterpartyId&&origin.dueAt===receivable.dueAt&&origin.date===receivable.date&&receivable.amountFen===(origin.kind==='trade_sell'?origin.grossFen-origin.feeFen:origin.amountFen),'INVALID_MARKET_RECEIVABLE')
      const paid=[...financial.values()].filter(o=>o.kind==='settle_market_receivable'&&o.receivableId===receivable.id).reduce((sum,o)=>sum+('amountFen' in o?o.amountFen:0),0)
      requireRule(receivable.remainingFen===receivable.amountFen-paid,'MARKET_RECEIVABLE_BALANCE_MISMATCH')
    }
    for(const r of ledger.privateReceivables){const origin=financial.get(r.originOperationId);requireRule(origin?.kind==='dispose_private_asset'&&origin.receivableId===r.id&&origin.accountId===r.accountId&&origin.counterpartyId===r.counterpartyId&&origin.date===r.date&&origin.dueAt===r.dueAt&&origin.grossFen-origin.feeFen===r.amountFen,'INVALID_PRIVATE_RECEIVABLE');const paid=[...financial.values()].filter(o=>o.kind==='collect_private_sale'&&o.receivableId===r.id).reduce((n,o)=>n+('amountFen' in o?o.amountFen:0),0);requireRule(r.remainingFen===r.amountFen-paid,'PRIVATE_RECEIVABLE_BALANCE_MISMATCH')}
    const processedIds = new Set<string>()
    let previousPoint: TimePoint | null = null
    for (const receipt of run.timeline.receipts) {
      const parsed = eventSchema.safeParse(parseSignature(receipt.signature))
      requireRule(parsed.success, 'INVALID_EVENT_RECEIPT')
      const event = parsed.data
      requireRule(event.instanceId === receipt.instanceId && event.date === receipt.date && event.phase === receipt.phase && canonicalJson(event) === receipt.signature && event.payload.date === event.date, 'INVALID_EVENT_RECEIPT')
      requireRule(!processedIds.has(receipt.instanceId) && event.date <= run.timeline.cursor.date, 'INVALID_EVENT_REFERENCE')
      processedIds.add(receipt.instanceId)
      requireRule(previousPoint === null || compareTimePoints(event, previousPoint) > 0, 'EVENT_HISTORY_OUT_OF_ORDER')
      requireRule(compareTimePoints(event, run.timeline.cursor) <= 0, 'EVENT_HISTORY_AHEAD_OF_CURSOR')
      previousPoint = event
      if(event.payload.kind==='story_event')requireRule(run.story,'STORY_HANDLER_REQUIRED')
      if(event.payload.kind==='life_event')requireRule(run.life,'LIFE_HANDLER_REQUIRED')
      if(event.payload.kind==='journey_event')requireRule(run.journey,'JOURNEY_REQUIRED')
      if (isWorldOperation(event.payload) || event.payload.kind === 'operating_event'||event.payload.kind==='market_event'||event.payload.kind==='video_event'||event.payload.kind==='course_event'||event.payload.kind==='relay_event'||event.payload.kind==='deepseek_event'||event.payload.kind==='story_event'||event.payload.kind==='life_event'||event.payload.kind==='journey_event') {
        requireRule(this.registry.runtime && run.world, 'WORLD_HANDLER_REQUIRED')
      } else if (receipt.skippedReason !== undefined) {
        // Validate the historical reason against its earlier operation. The action
        // can have progressed since that receipt (executed -> interrupted/completed).
        const reason = receipt.skippedReason
        const kind = reason === 'ACTION_CANCELLED' ? 'cancel_action' : reason === 'ACTION_INTERRUPTED' ? 'interrupt_action' : reason === 'ACTION_ALREADY_EXECUTED' ? 'execute_action' : reason === 'ACTION_ALREADY_COMPLETED' ? 'complete_action' : null
        const actionId = 'actionId' in event.payload ? event.payload.actionId : null
        const timer = event.payload.kind === 'execute_action' || event.payload.kind === 'complete_action'
        const compatible = reason === 'ACTION_ALREADY_EXECUTED' ? event.payload.kind === 'execute_action' : reason === 'ACTION_ALREADY_COMPLETED' ? event.payload.kind === 'complete_action' : timer
        const earlierAction = [...economics.values()].some((operation) => operation.kind === kind && 'actionId' in operation && operation.actionId === actionId && operation.date <= event.date)
        requireRule(kind !== null && compatible && receipt.pauseReason === null && actionId !== null && run.economy.actions.some((action) => action.definition.id === actionId) && earlierAction, 'INVALID_SKIPPED_EVENT')
      } else {
        const effect = economics.get(event.payload.id)
        requireRule(effect && canonicalJson(effect) === canonicalJson(event.payload), 'MISSING_EVENT_EFFECT')
      }
    }
    const cursor = run.timeline.cursor
    if (cursor.phase === 'before') requireRule(cursor.priority === 0 && cursor.instanceId === '' && previousPoint === null, 'INVALID_CLOCK_CURSOR')
    else if (cursor.priority === Number.MAX_SAFE_INTEGER) requireRule(cursor.instanceId === '', 'INVALID_CLOCK_CURSOR')
    else requireRule(previousPoint !== null && compareTimePoints(previousPoint, cursor) === 0, 'INVALID_CLOCK_CURSOR')
    let reconstructed = { ...run.timeline, pending: [] as GameRun['timeline']['pending'], receipts: [] as GameRun['timeline']['receipts'] }
    for (const event of run.timeline.pending) {
      requireRule(!processedIds.has(event.instanceId) && event.payload.date === event.date, 'INVALID_EVENT_REFERENCE')
      reconstructed = queueEvent(reconstructed, event)
      const operation = event.payload
      if(operation.kind==='story_event')requireRule(run.story&&this.registry.runtime,'STORY_HANDLER_REQUIRED')
      if(operation.kind==='life_event')requireRule(run.life&&this.registry.runtime,'LIFE_HANDLER_REQUIRED')
      if(operation.kind==='journey_event')requireRule(run.journey&&this.registry.runtime,'JOURNEY_REQUIRED')
      if ('accountId' in operation) requireRule(accounts.has(operation.accountId), 'INVALID_ACCOUNT_REFERENCE')
      if ('action' in operation) requireRule(accounts.has(operation.action.accountId) && accounts.has(operation.action.counterpartyId), 'INVALID_ACCOUNT_REFERENCE')
      if ('counterpartyId' in operation) requireRule(accounts.has(operation.counterpartyId), 'INVALID_ACCOUNT_REFERENCE')
    }
    requireRule(reconstructed.pending.length === run.timeline.pending.length && canonicalJson(reconstructed.pending) === canonicalJson(run.timeline.pending), 'INVALID_EVENT_QUEUE')
    if (run.timeline.pause !== null) {
      const last = run.timeline.receipts.at(-1)
      if (run.timeline.pause.source === 'command') requireRule(run.timeline.pause.reason === 'CASH_SHORTFALL' && ledger.obligations.some((obligation) => obligation.originOperationId === run.timeline.pause?.instanceId && obligation.remainingFen > 0) && run.causes.some((cause) => cause.id === run.timeline.pause?.instanceId && cause.date === run.timeline.cursor.date), 'INVALID_PAUSE_REFERENCE')
      else requireRule(last?.instanceId === run.timeline.pause.instanceId && last.pauseReason === run.timeline.pause.reason && run.timeline.cursor.instanceId === last.instanceId, 'INVALID_PAUSE_REFERENCE')
    }
    const transactions = new Set(ledger.transactions.map((entry) => entry.id))
    const claimedTransactions: string[] = []
    let ledgerBoundary=0
    const ledgerTransactionIds=new Set(ledger.transactions.map(t=>t.id))
    run.receipts.forEach((receipt, index) => {
      assertJsonInput(parseSignature(receipt.payloadSignature))
      const signature = recordBody(parseSignature(receipt.payloadSignature))
      requireRule(Object.keys(signature).length === 4 && ['runId', 'actorId', 'kind', 'payload'].every((key) => Object.hasOwn(signature, key)), 'INVALID_COMMAND_SIGNATURE')
      requireRule(signature.runId === run.runId && signature.actorId === run.actorId && signature.kind === receipt.kind, 'INVALID_COMMAND_RECEIPT')
      const payload = this.registry.normalize(receipt.kind, signature.payload)
      const identity = commandIdentity(run.runId, run.actorId, receipt.kind, payload)
      requireRule(identity.signature === receipt.payloadSignature && identity.hash === receipt.payloadHash, 'INVALID_COMMAND_HASH')
      if (index === 0) {
        requireRule(receipt.kind === 'CreateRun', 'INVALID_CREATION_RECEIPT')
        const creation = recordBody(payload)
        requireRule(creation.backgroundId === run.backgroundId && creation.origin === run.origin && creation.seed === run.seed, 'INVALID_CREATION_RECEIPT')
        requireRule(canonicalJson(creation.playerProfile)===canonicalJson(run.playerProfile),'INVALID_PLAYER_PROFILE_RECEIPT')
      } else requireRule(receipt.kind !== 'CreateRun', 'INVALID_CREATION_RECEIPT')
      requireRule(receipt.date <= run.timeline.cursor.date && receipt.transactionIds.every((id) => transactions.has(id)), 'INVALID_TRANSACTION_REFERENCE')
      for (const causeId of receipt.causeIds) requireRule(run.causes.some((cause) => cause.id === causeId && cause.commandId === receipt.commandId), 'INVALID_CAUSE_REFERENCE')
      const expectedTransactions=ledger.receipts.slice(ledgerBoundary,receipt.ledgerReceiptCountAfter).filter(r=>ledgerTransactionIds.has(r.id)).map(r=>r.id)
      requireRule(canonicalJson(expectedTransactions)===canonicalJson(receipt.transactionIds),'COMMAND_LEDGER_BOUNDARY_MISMATCH');ledgerBoundary=receipt.ledgerReceiptCountAfter
      claimedTransactions.push(...receipt.transactionIds)
    })
    unique(claimedTransactions, 'DUPLICATE_TRANSACTION_CLAIM')
    requireRule(claimedTransactions.length === transactions.size, 'ORPHAN_TRANSACTION')
    for (const fact of run.facts) requireRule(run.random.streams[fact.domain].draws > 0, 'FACT_WITHOUT_RANDOM_DRAW')
    for (const prepayment of ledger.supplierPrepayments) requireRule(accounts.has(prepayment.accountId) && accounts.has(prepayment.counterpartyId), 'INVALID_SUPPLIER_BINDING')
    for (const payable of obligations.values()) requireRule(accounts.has(payable.counterpartyId), 'INVALID_ACCOUNT_REFERENCE')
  }

  #sealed(run: GameRun): { envelope:SaveEnvelope;serialized:string } {
    const state = this.validateRun(run)
    const body = { saveVersion: 1 as const, ...state.versions, runId: state.runId, revision: state.revision, state }
    const encodedBody = canonicalJson(body), checksum = hashText(encodedBody)
    const envelope = { ...body, checksum }, keys = Object.keys(body)
    // Reuse the exact body bytes. A future header sorting before checksum
    // falls back to the original canonical envelope rather than changing wire order.
    const serialized = keys.length > 0 && keys.every(key => key > 'checksum')
      ? '{"checksum":' + JSON.stringify(checksum) + ',' + encodedBody.slice(1)
      : canonicalJson(envelope)
    requireRule(utf8Length(serialized) <= MAX_LOGICAL_SAVE_BYTES, 'SAVE_TOO_LARGE')
    return {envelope,serialized}
  }

  prepare(run:GameRun):PreparedSave{
    const {envelope,serialized}=this.#sealed(run),nodes=inspectJsonInput(envelope,MAX_LOGICAL_SAVE_NODES),storage=packSave(envelope,serialized,nodes)
    return{envelope,storage,text:storage===envelope?serialized:canonicalJson(storage)}
  }

  /** Logical state/checksum for callers; prepare/export provide the portable wire document. */
  seal(run: GameRun): SaveEnvelope { return this.prepare(run).envelope }

  export(run: GameRun): string { return this.prepare(run).text }

  readEnvelope(value: unknown): SaveEnvelope { return this.#readEnvelope(value, false) }

  #readEnvelope(value: unknown, fromJsonText: boolean): SaveEnvelope {
    assertJsonInput(value)
    const encoded = fromJsonText ? encodeParsedJson(value) : canonicalJson(value)
    requireRule(utf8Length(encoded) <= MAX_SAVE_BYTES, 'SAVE_TOO_LARGE')
    if(typeof value==='object'&&value!==null&&Reflect.get(value,'saveVersion')===2){
      const unpacked=unpackSave(value,header=>assertCompatible(header,this.registry.versions))
      let raw:unknown
      try{raw=JSON.parse(unpacked.text)}catch{throw new RuleError('INVALID_SAVE_JSON')}
      const envelope=this.#readLogicalEnvelope(raw,true,true)
      assertPackedMetadata(envelope,unpacked.header)
      return envelope
    }
    return this.#readLogicalEnvelope(value,fromJsonText,false,encoded)
  }

  #readLogicalEnvelope(value:unknown,fromJsonText:boolean,packed:boolean,checkedEncoded?:string):SaveEnvelope{
    let encoded=checkedEncoded
    if(encoded===undefined){
      if(packed)inspectJsonInput(value,MAX_LOGICAL_SAVE_NODES);else assertJsonInput(value)
      encoded=fromJsonText?encodeParsedJson(value):canonicalJson(value)
      requireRule(utf8Length(encoded)<=(packed?MAX_LOGICAL_SAVE_BYTES:MAX_SAVE_BYTES),'SAVE_TOO_LARGE')
    }
    requireRule(typeof value === 'object' && value !== null && Reflect.get(value, 'saveVersion') === 1, 'UNSUPPORTED_SAVE_VERSION')
    const parsed = envelopeSchema.safeParse(value)
    requireRule(parsed.success, 'INVALID_SAVE_ENVELOPE')
    assertCompatible(parsed.data, this.registry.versions)
    const { checksum, ...body } = parsed.data
    const prefix = '{"checksum":' + JSON.stringify(checksum) + ','
    const unchanged = fromJsonText && sameJsonData(value, parsed.data) && encoded.startsWith(prefix)
    const expectedChecksum = unchanged ? hashText('{' + encoded.slice(prefix.length)) : hashValue(body)
    requireRule(expectedChecksum === checksum, 'CORRUPT_SAVE')
    const state = this.validateRun(body.state)
    requireRule(body.runId === state.runId && body.revision === state.revision, 'SAVE_HEADER_MISMATCH')
    assertCompatible(state.versions, body)
    return { ...body, checksum, state }
  }

  import(text: string): GameRun {
    requireRule(typeof text === 'string', 'INVALID_SAVE_TEXT')
    requireRule(text.length <= MAX_SAVE_BYTES && utf8Length(text) <= MAX_SAVE_BYTES, 'SAVE_TOO_LARGE')
    let raw: unknown
    try { raw = JSON.parse(text) } catch { throw new RuleError('INVALID_SAVE_JSON') }
    return this.#readEnvelope(raw, true).state
  }
}
