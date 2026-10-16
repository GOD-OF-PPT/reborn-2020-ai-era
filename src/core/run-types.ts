import type { IsoDate } from './calendar.ts'
import type { EconomyState } from './economy.ts'
import type { RunOperation, WorldState } from './content-types.ts'
import type { FrozenFact, FactDescriptor } from './facts.ts'
import type { RandomState } from './random.ts'
import type { Timeline } from './timeline.ts'
import type { MarketState } from './market-types.ts'
import type { OperationsState } from './operations-types.ts'
import type { PlayerProfile } from './player-profile.ts'

export interface VersionSet {
  readonly schemaVersion: number
  readonly rulesVersion: string
  readonly contentVersion: string
  readonly contentHash: string
  readonly rngAlgorithmVersion: string
}
export interface RuleModel {
  readonly controlledAccountIds: readonly string[]
  readonly phase: 'playing' | 'epilogue' | 'finished'
  readonly economy: EconomyState
  readonly timeline: Timeline<RunOperation>
  readonly random: RandomState
  readonly facts: readonly FrozenFact[]
  readonly privateNotes: string
  readonly world: WorldState | null
  readonly operations: OperationsState | null
  readonly market:MarketState|null
}
export interface CommandEnvelope {
  readonly commandId: string
  readonly runId: string
  readonly expectedRevision: number
  readonly actorId: string
  readonly kind: string
  readonly payload: unknown
}
export interface CommandReceipt {
  readonly runId: string
  readonly commandId: string
  readonly actorId: string
  readonly kind: string
  readonly payloadHash: string
  readonly payloadSignature: string
  readonly revisionBefore: number
  readonly revisionAfter: number
  readonly date: IsoDate
  readonly summary: string
  readonly transactionIds: readonly string[]
  readonly causeIds: readonly string[]
}
export interface CauseEntry {
  readonly id: string
  readonly commandId: string
  readonly date: IsoDate
  readonly domain: string
  readonly parentIds: readonly string[]
  readonly sourceEventId: string
  readonly visibleSummary: string
  readonly visibility: 'visible' | 'hidden'
}
export interface GameRun extends RuleModel {
  readonly playerProfile:PlayerProfile
  readonly versions: VersionSet
  readonly runId: string
  readonly actorId: string
  readonly personalAccountId: string
  readonly backgroundId: string
  readonly origin: 'normal' | 'fixture'
  readonly seed: string
  readonly revision: number
  readonly receipts: readonly CommandReceipt[]
  readonly causes: readonly CauseEntry[]
}
export interface CreateRunInput {
  readonly playerProfile?:PlayerProfile
  readonly runId: string
  readonly actorId: string
  readonly commandId: string
  readonly backgroundId: string
  readonly seed: string
}
export interface InitialRunState {
  readonly origin: GameRun['origin']
  readonly personalAccountId: string
  readonly controlledAccountIds: readonly string[]
  readonly economy: EconomyState
  readonly timeline: Timeline<RunOperation>
  readonly initialFacts?: readonly FactDescriptor[]
  readonly world?: WorldState | null
  readonly operations?: OperationsState | null
  readonly market?:MarketState|null
}
export interface ProposedRun {
  readonly status: 'proposed'
  readonly previousRevision: number
  readonly nextRun: GameRun
  readonly receipt: CommandReceipt
  readonly ledgerEntries: EconomyState['ledger']['transactions']
  readonly causeEntries: readonly CauseEntry[]
}
export interface RejectedCommand { readonly status: 'rejected'; readonly reasonCodes: readonly string[] }
export interface ExistingReceipt { readonly status: 'duplicate'; readonly run: GameRun; readonly receipt: CommandReceipt }
