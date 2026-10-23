import {knownRelayState} from './relay-knowledge.ts'
import { z } from 'zod'
import {journeyCauseSpecs} from './journey.ts'
import { playerProfileSchema } from './player-profile.ts'
import { marketValuationComplete } from './market-projection.ts'
import { accountPosition } from './ledger.ts'
import { actionBudget, applyEconomy } from './economy.ts'
import { advanceEconomicTime } from './economic-time.ts'
import { acknowledgePause, checkedAdvanceTarget, DAY_PHASES } from './timeline.ts'
import { isoDate } from './calendar.ts'
import { commandIdentity } from './command-identity.ts'
import { visibleFacts } from './facts.ts'
import { assertJsonInput, copyJson } from './json-input.ts'
import { requireRule, RuleError } from './errors.ts'
import { assertGameRun } from './run.ts'
import { assertCompatible } from './versions.ts'
import type { CommandEnvelope, GameRun, RuleModel, VersionSet, ProposedRun, RejectedCommand, ExistingReceipt, CauseEntry } from './run-types.ts'
import type { DayPhase } from './timeline.ts'
import { operatingAccruals } from './operations-accrual.ts'
import type { WorldLog } from './content-types.ts'
import type {ClockCommitmentProjection,ClockTarget} from './clock-projection-types.ts'

const id = z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/)
const opaqueId = z.string().min(1).max(512).regex(/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/)
const date = z.string().refine((value) => { try { isoDate(value); return true } catch { return false } })
const envelopeSchema = z.strictObject({ commandId: id, runId: id, actorId: id, expectedRevision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER), kind: id, payload: z.unknown() })
export const creationPayloadSchema = z.strictObject({ backgroundId: opaqueId, playerProfile:playerProfileSchema,origin: z.enum(['normal', 'fixture']), seed: z.string().min(1).max(256), initialStateHash: z.string().regex(/^[0-9a-f]{64}$/) })

export interface CommandPreview {
  readonly accruedServiceFeeFen?:number
  readonly privateSale?:{readonly shares:number;readonly grossFen:number;readonly feeFen:number;readonly netReceivableFen:number;readonly dueAt:string}
  readonly knownAdjustments?:{readonly customerIncomeDeltaFen:number;readonly supplierCostDeltaFen:number}
  readonly actionAllocations?:readonly {readonly date:string;readonly actionPoints:number;readonly label:string}[]
  readonly actionDate?:string
  readonly receivedPrepaymentFen?:number
  readonly protectedIncreaseFen?:number
  readonly allowed: boolean
  readonly reasonCodes: readonly string[]
  readonly actionPoints: number
  readonly upfrontCostFen: number
  readonly releasedFen: number
}
export interface CommandView {
  readonly origin?:GameRun['origin']
  readonly pending:GameRun['timeline']['pending']
  readonly runId: string
  readonly actorId: string
  readonly revision: number
  readonly date: string
  readonly phase: GameRun['phase']
  readonly controlledAccountIds: readonly string[]
  readonly economy: GameRun['economy']
  readonly cursor: GameRun['timeline']['cursor']
  readonly pause: GameRun['timeline']['pause']
  readonly evidence: ReturnType<typeof visibleFacts>
  readonly world: RuleModel['world']
  readonly operations: RuleModel['operations']
  readonly market:RuleModel['market']
  readonly video:RuleModel['video']
  readonly course:RuleModel['course']
  readonly relay:RuleModel['relay']
  readonly routines:RuleModel['routines']
  readonly deepseek:RuleModel['deepseek']
  readonly story:RuleModel['story']
  readonly life:RuleModel['life']
  readonly journey:RuleModel['journey']
}
export interface CommandContext { readonly commandId: string; readonly runId: string; readonly actorId: string; readonly date: string;readonly revision:number }
export interface CommandEffect { readonly model: RuleModel; readonly summary: string; readonly domain: string }
export interface RegistryRuntime {
  advance(model: RuleModel, target: { readonly date: string; readonly phase?: DayPhase }): RuleModel
  validate(run: GameRun): void
  guard?(view:CommandView,kind:string,payload:unknown):void
  project?(run:GameRun):Readonly<Record<string,unknown>>
  clockCommitments?(run:GameRun,target:ClockTarget):ClockCommitmentProjection
}
export interface CommandHandler {
  readonly kind: string
  normalize(payload: unknown): unknown
  inspect(view: CommandView, payload: unknown): CommandPreview
  apply(model: RuleModel, payload: unknown, context: CommandContext): CommandEffect
}

const allowed = (): CommandPreview => ({ allowed: true, reasonCodes: [], actionPoints: 0, upfrontCostFen: 0, releasedFen: 0 })

export function defineCommand<Payload>(kind: string, schema: z.ZodType<Payload>, inspect: (view: CommandView, payload: Payload) => CommandPreview, apply: (model: RuleModel, payload: Payload, context: CommandContext) => CommandEffect): CommandHandler {
  function normalize(payload: unknown): Payload {
    assertJsonInput(payload)
    const parsed = schema.safeParse(payload)
    requireRule(parsed.success, 'INVALID_PAYLOAD')
    return parsed.data
  }
  return Object.freeze({ kind, normalize, inspect: (view: CommandView, payload: unknown) => inspect(view, normalize(payload)), apply: (model: RuleModel, payload: unknown, context: CommandContext) => apply(model, normalize(payload), context) })
}

export class CommandRegistry {
  readonly versions: VersionSet
  readonly #handlers: ReadonlyMap<string, CommandHandler>
  readonly runtime: RegistryRuntime | null
  constructor(versions: VersionSet, handlers: readonly CommandHandler[], runtime: RegistryRuntime | null = null) {
    const entries = new Map<string, CommandHandler>()
    for (const handler of handlers) {
      requireRule(id.safeParse(handler.kind).success && handler.kind !== 'CreateRun' && !entries.has(handler.kind), 'INVALID_COMMAND_REGISTRATION')
      entries.set(handler.kind, Object.freeze({ ...handler }))
    }
    this.versions = Object.freeze({ ...versions })
    this.#handlers = entries
    this.runtime = runtime
  }
  get(kind: string): CommandHandler | undefined { return this.#handlers.get(kind) }
  normalize(kind: string, payload: unknown): unknown {
    if (kind === 'CreateRun') {
      const parsed = creationPayloadSchema.safeParse(payload)
      requireRule(parsed.success, 'INVALID_PAYLOAD')
      return parsed.data
    }
    const handler = this.get(kind)
    requireRule(handler, 'UNKNOWN_COMMAND')
    return handler.normalize(payload)
  }
}

export function createBaseRegistry(versions: VersionSet, extra: readonly CommandHandler[] = [], runtime: RegistryRuntime | null = null): CommandRegistry {
  const advance = defineCommand('AdvanceTime', z.strictObject({ date, phase: z.enum(DAY_PHASES).default('snapshot') }), (view, payload) => {
    requireRule(view.phase === 'playing', 'RUN_NOT_PLAYING')
    requireRule(payload.date <= '2025-12-31', 'DATE_OUTSIDE_CAMPAIGN')
    requireRule(view.pause === null, 'DECISION_PENDING')
    checkedAdvanceTarget({ cursor: view.cursor }, payload)
    return allowed()
  }, (model, payload) => {
    if (runtime) { const next = runtime.advance(model, payload); return { model: next, summary: `推进至${next.timeline.cursor.date}${next.timeline.pause ? '，等待处置' : ''}`, domain: 'time' } }
    requireRule(model.world === null, 'WORLD_HANDLER_REQUIRED')
    const result = advanceEconomicTime(model.timeline, model.economy, payload)
    return { model: { ...model, timeline: result.timeline, economy: result.state }, summary: `推进至${result.timeline.cursor.date}${result.status === 'paused' ? '，等待处置' : ''}`, domain: 'time' }
  })
  const note = defineCommand('SetPrivateNote', z.strictObject({ text: z.string().max(16000) }), () => allowed(), (model, payload) => ({ model: { ...model, privateNotes: payload.text }, summary: '私人备注已更新', domain: 'notes' }))
  const gap = defineCommand('AcknowledgeCashGap', z.strictObject({ instanceId: opaqueId }), (view, payload) => {
    requireRule(view.pause?.instanceId === payload.instanceId && view.pause.reason === 'CASH_SHORTFALL', 'CASH_GAP_NOT_PENDING')
    return allowed()
  }, (model, payload) => ({ model: { ...model, timeline: acknowledgePause(model.timeline, payload.instanceId) }, summary: '延期处置，欠款仍保留', domain: 'time' }))
  const cancel = defineCommand('CancelAction', z.strictObject({ actionId: opaqueId }), (view, payload) => {
    const action = view.economy.actions.find((item) => item.definition.id === payload.actionId)
    requireRule(action && view.controlledAccountIds.includes(action.definition.accountId), 'ACTION_NOT_CONTROLLED')
    requireRule(action.status === 'draft' || action.status === 'reserved', 'ACTION_CANNOT_BE_CANCELLED')
    return { ...allowed(), releasedFen: action.status === 'reserved' ? action.definition.costFen : 0 }
  }, (model, payload, context) => ({ model: { ...model, economy: applyEconomy(model.economy, { id: `command:${context.commandId}:cancel`, sourceEventId: `command:${context.commandId}`, date: context.date, kind: 'cancel_action', actionId: payload.actionId }) }, summary: '未执行计划已取消', domain: 'actions' }))
  return new CommandRegistry(versions, [advance, note, gap, cancel, ...extra], runtime)
}

function commandView(run: GameRun): CommandView {
  return copyJson({origin:run.origin,pending:run.timeline.pending, runId: run.runId, actorId: run.actorId, revision: run.revision, date: run.timeline.cursor.date, phase: run.phase, controlledAccountIds: run.controlledAccountIds, economy: run.economy, cursor: run.timeline.cursor, pause: run.timeline.pause, evidence: visibleFacts(run.facts), world: run.world, operations: run.operations,market:run.market,video:run.video,course:run.course,relay:knownRelayState(run.relay),routines:run.routines,deepseek:run.deepseek,story:run.story,life:run.life,journey:run.journey })
}

export function projectRun(run: GameRun) {
  const accruals=operatingAccruals(run,run.timeline.cursor.date)
  const operations=run.operations===null?null:{employment:run.operations.employment,businesses:run.operations.businesses,workers:run.operations.workers,jobs:run.operations.jobs,contracts:run.operations.contracts.map(({factId: _factId,...visible})=>visible),payroll:run.operations.payroll,loans:run.operations.loans,unbilledAccruals:accruals}
  const world = run.world === null ? null : { anchors: run.world.anchors.map(({ id, happenedAt }) => ({ id, happenedAt })), newsRead: run.world.newsRead, favoriteMemories: run.world.favoriteMemories, events: run.world.instances.map(({ id, definitionId, bindingId, createdAt, expiresAt, status, choiceId, resolution }) => ({ id, definitionId, bindingId, createdAt, expiresAt, status, choiceId, resolution })), jobs: run.world.jobs, preparations: run.world.preparations, entitlements: run.world.entitlements, stoppedBindings: run.world.stoppedBindings, evidence: run.world.evidence }
  return copyJson({ runId: run.runId,backgroundId:run.backgroundId,playerProfile:run.playerProfile, revision: run.revision, origin: run.origin, date: run.timeline.cursor.date, phase: run.phase, accounts: run.controlledAccountIds.map((accountId) => ({ accountId, ...accountPosition(run.economy.ledger, accountId),valuationStatus:marketValuationComplete(run,accountId)?'current':'data_unavailable',lastKnownInvestmentValueFen:accountPosition(run.economy.ledger,accountId).investmentValueFen,investmentValueFen:marketValuationComplete(run,accountId)?accountPosition(run.economy.ledger,accountId).investmentValueFen:null,accruedCostFen:accruals.filter(a=>a.accountId===accountId).reduce((sum,a)=>sum+a.amountFen,0),netAssetsFen:marketValuationComplete(run,accountId)?accountPosition(run.economy.ledger,accountId).netAssetsFen-accruals.filter(a=>a.accountId===accountId).reduce((sum,a)=>sum+a.amountFen,0):null })), budget: actionBudget(run.economy, run.timeline.cursor.date), evidence: visibleFacts(run.facts), receipts: run.receipts.map(({ commandId, kind, revisionAfter, summary }) => ({ commandId, kind, revisionAfter, summary })), world,operations })
}

type PreviewIdentity=Pick<GameRun,'runId'|'actorId'|'versions'|'revision'>
function prepare(run: PreviewIdentity, raw: unknown, registry: CommandRegistry, principalActorId: string) {
  assertJsonInput(raw)
  requireRule(typeof raw === 'object' && raw !== null && Object.hasOwn(raw, 'payload'), 'INVALID_COMMAND')
  const parsed = envelopeSchema.safeParse(raw)
  requireRule(parsed.success, 'INVALID_COMMAND')
  const command: CommandEnvelope = parsed.data
  assertCompatible(run.versions, registry.versions)
  requireRule(command.runId === run.runId, 'WRONG_RUN')
  requireRule(command.actorId === principalActorId && principalActorId === run.actorId, 'FORBIDDEN_ACTOR')
  const handler = registry.get(command.kind)
  const payload = handler || command.kind === 'CreateRun' ? registry.normalize(command.kind, command.payload) : command.payload
  const identity = commandIdentity(command.runId, command.actorId, command.kind, payload)
  return { command, handler, payload, identity }
}

export function fingerprintCommand(run: GameRun, raw: unknown, registry: CommandRegistry, principalActorId: string) {
  const prepared = prepare(run, raw, registry, principalActorId)
  return { commandId: prepared.command.commandId, signature: prepared.identity.signature, hash: prepared.identity.hash }
}

function inspectPreview(run:PreviewIdentity,raw:unknown,registry:CommandRegistry,principalActorId:string,getView:()=>CommandView):CommandPreview{
  try {
    const {command,handler,payload}=prepare(run,raw,registry,principalActorId)
    requireRule(command.expectedRevision===run.revision,'STALE_REVISION')
    requireRule(handler,command.kind==='CreateRun'?'RUN_ALREADY_EXISTS':'UNKNOWN_COMMAND')
    const view=getView();registry.runtime?.guard?.(view,command.kind,payload);return handler.inspect(view,payload)
  }catch(error){if(error instanceof RuleError)return {...allowed(),allowed:false,reasonCodes:[error.code]};throw error}
}
export function previewCommand(run:GameRun,raw:unknown,registry:CommandRegistry,principalActorId:string):CommandPreview{
  return inspectPreview(run,raw,registry,principalActorId,()=>commandView(run))
}
/** A detached read-only snapshot. A session replaces this binding after a durable record changes. */
export function bindCommandPreview(run:GameRun,registry:CommandRegistry,principalActorId:string):(raw:unknown)=>CommandPreview{
  const identity:PreviewIdentity={runId:run.runId,actorId:run.actorId,revision:run.revision,versions:{...run.versions}},view=commandView(run)
  function freeze(value:unknown):void{if(typeof value!=='object'||value===null)return;for(const child of Object.values(value))freeze(child);Object.freeze(value)}
  freeze(identity);freeze(view)
  return raw=>inspectPreview(identity,raw,registry,principalActorId,()=>view)
}

export function evaluateCommand(run: GameRun, raw: unknown, registry: CommandRegistry, principalActorId: string): ProposedRun | RejectedCommand | ExistingReceipt {
  try {
    assertGameRun(run)
    registry.runtime?.validate(run)
    const { command, handler, payload, identity } = prepare(run, raw, registry, principalActorId)
    const previous = run.receipts.find((receipt) => receipt.commandId === command.commandId)
    if (previous) {
      requireRule(previous.payloadHash === identity.hash && previous.payloadSignature === identity.signature, 'COMMAND_ID_REUSED')
      return { status: 'duplicate', run, receipt: previous }
    }
    requireRule(command.expectedRevision === run.revision, 'STALE_REVISION')
    requireRule(handler, command.kind === 'CreateRun' ? 'RUN_ALREADY_EXISTS' : 'UNKNOWN_COMMAND')
    const view=commandView(run);registry.runtime?.guard?.(view,command.kind,payload)
    const inspection = handler.inspect(view, payload)
    if (!inspection.allowed) return { status: 'rejected', reasonCodes: inspection.reasonCodes }
    const model: RuleModel = copyJson({ controlledAccountIds: run.controlledAccountIds, phase: run.phase, economy: run.economy, timeline: run.timeline, random: run.random, facts: run.facts, privateNotes: run.privateNotes, world: run.world, operations: run.operations,market:run.market,video:run.video,course:run.course,relay:run.relay,routines:run.routines,deepseek:run.deepseek,story:run.story,life:run.life,journey:run.journey })
    const effect = handler.apply(model, payload, { commandId: command.commandId, runId: run.runId, actorId: command.actorId, date: run.timeline.cursor.date,revision:run.revision })
    requireRule(Object.keys(effect.model).length === 18 && Object.keys(effect.model).every((key) => ['controlledAccountIds', 'phase', 'economy', 'timeline', 'random', 'facts', 'privateNotes', 'world', 'operations','market','video','course','relay','routines','deepseek','story','life','journey'].includes(key)), 'INVALID_RULE_MODEL')
    for (const fact of run.facts) {
      const nextFact = effect.model.facts.find((item) => item.id === fact.id)
      requireRule(nextFact && nextFact.roll === fact.roll && nextFact.domain === fact.domain && nextFact.sourceEventId === fact.sourceEventId && nextFact.createdAt === fact.createdAt && (fact.evidence === null || fact.evidence === nextFact.evidence), 'FACT_REWRITE')
    }
    requireRule(run.revision < Number.MAX_SAFE_INTEGER, 'REVISION_EXHAUSTED')
    const causeId = `cause:${command.commandId}`
    const cause: CauseEntry = { id: causeId, commandId: command.commandId, date: effect.model.timeline.cursor.date, domain: effect.domain, parentIds: [], sourceEventId: `command:${command.commandId}`, visibleSummary: effect.summary, visibility: 'visible' }
    const priorLogs = new Set(run.world?.logs.map((log) => log.id) ?? [])
    const worldCauses: CauseEntry[] = (effect.model.world?.logs.filter((log) => !priorLogs.has(log.id)) ?? []).map((log: WorldLog) => ({ id: log.id, commandId: command.commandId, date: log.date, domain: 'world', parentIds: [...log.parentIds], sourceEventId: log.sourceEventId, visibleSummary: log.text, visibility: log.visibility }))
    const priorOperatingLogs = new Set(run.operations?.logs.map((log) => log.id) ?? [])
    const operatingCauses: CauseEntry[] = (effect.model.operations?.logs.filter((log) => !priorOperatingLogs.has(log.id)) ?? []).map((log) => ({ id: log.id, commandId: command.commandId, date: log.date, domain: 'operations', parentIds: log.parentIds, sourceEventId: log.sourceEventId, visibleSummary: log.text, visibility: log.visibility }))
    const priorMarketLogs=new Set(run.market?.logs.map(log=>log.id)??[]);const marketCauses:CauseEntry[]=(effect.model.market?.logs.filter(log=>!priorMarketLogs.has(log.id))??[]).map(log=>({id:log.id,commandId:command.commandId,date:log.date,domain:'market',parentIds:log.parentIds,sourceEventId:log.sourceEventId,visibleSummary:log.text,visibility:log.visibility}));const priorStoryLogs=new Set(run.story?.logs.map(log=>log.id)??[]);const storyCauses:CauseEntry[]=(effect.model.story?.logs.filter(log=>!priorStoryLogs.has(log.id))??[]).map(log=>({id:log.id,commandId:command.commandId,date:log.date,domain:'story',parentIds:log.parentIds,sourceEventId:log.sourceEventId,visibleSummary:log.text,visibility:log.visibility}));const priorLifeLogs=new Set(run.life?.logs.map(log=>log.id)??[]);const lifeCauses:CauseEntry[]=(effect.model.life?.logs.filter(log=>!priorLifeLogs.has(log.id))??[]).map(log=>({id:log.id,commandId:command.commandId,date:log.date,domain:'life',parentIds:log.parentIds,sourceEventId:log.sourceEventId,visibleSummary:log.text,visibility:log.visibility}));const journeyCauses=journeyCauseSpecs(run.journey,effect.model.journey).map(c=>({...c,commandId:command.commandId}));const causes = [cause, ...worldCauses, ...operatingCauses,...marketCauses,...storyCauses,...lifeCauses,...journeyCauses]
    const entries = effect.model.economy.ledger.transactions.slice(run.economy.ledger.transactions.length)
    const receipt = { runId: run.runId, commandId: command.commandId, actorId: command.actorId, kind: command.kind, payloadHash: identity.hash, payloadSignature: identity.signature, revisionBefore: run.revision, revisionAfter: run.revision + 1, ledgerReceiptCountAfter:effect.model.economy.ledger.receipts.length,date: effect.model.timeline.cursor.date, summary: effect.summary, transactionIds: entries.map((entry) => entry.id), causeIds: causes.map((entry) => entry.id) }
    const nextRun: GameRun = { ...run, ...effect.model, revision: run.revision + 1, receipts: [...run.receipts, receipt], causes: [...run.causes, ...causes] }
    assertGameRun(nextRun)
    registry.runtime?.validate(nextRun)
    return { status: 'proposed', previousRevision: run.revision, nextRun, receipt, ledgerEntries: entries, causeEntries: causes }
  } catch (error) {
    if (error instanceof RuleError) return { status: 'rejected', reasonCodes: [error.code] }
    throw error
  }
}
