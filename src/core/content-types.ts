import type { EconomyOperation } from './economy.ts'
import type { LedgerOperation } from './ledger.ts'
import type { RandomDomain } from './random.ts'

export const ROUTES = ['a_share', 'ai_video', 'ai_course', 'api_relay', 'deepseek_opportunity'] as const
export type Route = typeof ROUTES[number]
export const CONTENT_LEDGER_KINDS = ['expense', 'income', 'reserve_cash', 'move_reservation', 'release_reservation', 'due_expense', 'pay_obligation'] as const
export type Classification = 'historical' | 'fictional' | 'counterfactual'
export interface ContentSource { readonly id: string; readonly url: string; readonly checkedAt: string; readonly status: 'verified' | 'pending'; readonly scope: string }
export interface HistoricalAnchor { readonly id: string; readonly classification: 'historical'; readonly title: string; readonly sourceIds: readonly string[]; readonly actualDate: string; readonly publishedAt: string; readonly availableAt: string; readonly access: 'private_beta' | 'public_preview' | 'conditional_release' | 'announcement' | 'rule_effective'; readonly enabled: boolean }
export interface Capability { readonly id: string; readonly anchorId: string | null; readonly availableAt: string; readonly entitlementIds: readonly string[]; readonly classification: Classification; readonly route: Route | null }
export type Condition =
  | { readonly op: 'all' | 'any'; readonly conditions: readonly Condition[] }
  | { readonly op: 'not'; readonly condition: Condition }
  | { readonly op: 'flagEquals'; readonly key: string; readonly value: boolean }
  | { readonly op: 'dateInWindow'; readonly from: string; readonly to: string }
  | { readonly op: 'availableFundsGte'; readonly amountFen: number }
  | { readonly op: 'capacityGte'; readonly units: number; readonly durationDays: number }
  | { readonly op: 'businessKindIs'; readonly route: Route }
  | { readonly op: 'hasEntitlement'; readonly entitlementId: string }
  | { readonly op: 'contractStateIs'; readonly state: 'unfulfilled' | 'delivered' | 'settled' }
  | { readonly op: 'hasCapability'; readonly capabilityId: string }
type Template<T> = T extends unknown ? Omit<T, 'id' | 'date' | 'sourceEventId'> : never
export type LedgerTemplate = Template<LedgerOperation>
export type Effect =
  | { readonly op: 'postLedgerTransaction'; readonly transaction: LedgerTemplate }
  | { readonly op: 'moveReservation'; readonly reservationId: string; readonly newOriginId: string }
  | { readonly op: 'recordObligation'; readonly amountFen: number; readonly counterpartyId: string; readonly dueInDays: number }
  | { readonly op: 'startJob'; readonly durationDays: number; readonly capacityUnits: number; readonly onComplete: readonly Effect[] }
  | { readonly op: 'pauseNewContracts' }
  | { readonly op: 'scheduleEvent'; readonly definitionId: string; readonly delayDays: number }
  | { readonly op: 'recordEvidence'; readonly evidenceId: string; readonly text: string; readonly mode: 'public' | 'fixed_fact' }
  | { readonly op: 'recordCause'; readonly text: string }
  | { readonly op: 'recordPreparation'; readonly key: string }
  | { readonly op: 'grantEntitlement'; readonly entitlementId: string; readonly validDays: number | null }
export interface ContentChoice { readonly id: string; readonly label: string; readonly condition: Condition; readonly actionPoints: number; readonly costFen: number; readonly effects: readonly Effect[] }
export interface EventDefinition {
  readonly id: string; readonly title: string; readonly classification: Classification; readonly sourceIds: readonly string[]
  readonly effectiveWindow: { readonly from: string; readonly to: string }
  readonly scope: { readonly binding: 'player' | 'business' | 'contract' | 'person'; readonly businessKind: Route | null }
  readonly trigger: Condition; readonly priority: number; readonly exclusiveGroup: string | null
  readonly hiddenFactsPolicy: { readonly mode: 'none' | 'fixed_at_instance_creation'; readonly domain: RandomDomain }
  readonly choices: readonly ContentChoice[]; readonly defaultChoiceId: string
  readonly followUpPolicy: 'explicit_effects'; readonly responseDays: number
  readonly presentation: 'ordinary' | 'mandatory' | 'risk'; readonly pausesTime: boolean
}
export interface ContentPack {
  readonly version: string; readonly sources: readonly ContentSource[]; readonly anchors: readonly HistoricalAnchor[]
  readonly capabilities: readonly Capability[]; readonly entitlementIds: readonly string[]; readonly preparationKeys: readonly string[]
  readonly initialEntitlements: readonly { readonly backgroundId: string; readonly entitlementIds: readonly string[] }[]
  readonly events: readonly EventDefinition[]
  readonly calendar: readonly { readonly definitionId: string; readonly date: string; readonly bindingId: string; readonly occurrenceId: string }[]
  readonly memories: readonly { readonly id: string; readonly domain: string; readonly hint: string; readonly preparationKey: string }[]
}
export interface WorldBinding { readonly id: string; readonly kind: EventDefinition['scope']['binding']; readonly accountId: string; readonly businessId: string | null; readonly route: Route | null; readonly contractId: string | null; readonly personId: string | null; readonly capacityUnits: number }
export interface EventInstance {
  readonly id: string; readonly definitionId: string; readonly bindingId: string; readonly openedBy: string
  readonly createdAt: string; readonly expiresAt: string; readonly factId: string | null
  readonly status: 'pending' | 'resolved'; readonly choiceId: string | null; readonly resolvedAt: string | null
  readonly resolution: 'chosen' | 'default' | null; readonly reason: string | null
}
export interface PreparationJob { readonly id: string; readonly instanceId: string; readonly actionId: string; readonly bindingId: string; readonly choiceId: string; readonly startAt: string; readonly completeAt: string; readonly capacityUnits: number; readonly status: 'running' | 'completed' | 'interrupted' }
export interface WorldLog { readonly id: string; readonly date: string; readonly sourceEventId: string; readonly parentIds: readonly string[]; readonly text: string; readonly kind: 'anchor' | 'event' | 'effect' | 'job'; readonly visibility: 'visible' | 'hidden' }
export interface WorldState {
  readonly packVersion: string; readonly packHash: string; readonly bindings: readonly WorldBinding[]
  readonly anchors: readonly { readonly id: string; readonly happenedAt: string; readonly causeId: string }[]
  readonly newsRead: readonly string[]; readonly favoriteMemories: readonly string[]
  readonly preparations: readonly { readonly key: string; readonly bindingId: string; readonly date: string; readonly sourceEventId: string }[]
  readonly entitlements: readonly { readonly id: string; readonly bindingId: string; readonly acquiredAt: string; readonly expiresAt: string | null; readonly sourceEventId: string }[]
  readonly instances: readonly EventInstance[]; readonly jobs: readonly PreparationJob[]
  readonly stoppedBindings: readonly string[]; readonly evidence: readonly { readonly id: string; readonly instanceId: string; readonly date: string; readonly text: string }[]
  readonly logs: readonly WorldLog[]
}
export type WorldOperation =
  | { readonly kind: 'world_anchor'; readonly anchorId: string; readonly date: string }
  | { readonly kind: 'open_content_event'; readonly definitionId: string; readonly bindingId: string; readonly date: string }
  | { readonly kind: 'expire_content_event'; readonly eventId: string; readonly date: string }
  | { readonly kind: 'finish_preparation'; readonly jobId: string; readonly date: string }
export type RunOperation = EconomyOperation | WorldOperation
export function isWorldOperation(operation: { readonly kind: string }): operation is WorldOperation { return ['world_anchor', 'open_content_event', 'expire_content_event', 'finish_preparation'].includes(operation.kind) }
