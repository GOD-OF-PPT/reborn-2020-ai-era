import { z } from 'zod'
import { idSchema as id, dateSchema as date, moneySchema, ledgerOperationSchema, safeCount, signedPriority } from './record-schemas.ts'
import { RANDOM_DOMAINS } from './random.ts'
import { assertJsonInput, copyJson } from './json-input.ts'
import { requireRule } from './errors.ts'
import { ROUTES, CONTENT_LEDGER_KINDS, type Condition, type Effect, type ContentPack } from './content-types.ts'

const text = z.string().min(1).max(4000)
const list = <T>(schema: z.ZodType<T>) => z.array(schema).max(10000)
const classification = z.enum(['historical', 'fictional', 'counterfactual'])
export const conditionSchema: z.ZodType<Condition> = z.lazy(() => z.union([
  z.strictObject({ op: z.enum(['all', 'any']), conditions: list(conditionSchema) }),
  z.strictObject({ op: z.literal('not'), condition: conditionSchema }),
  z.strictObject({ op: z.literal('flagEquals'), key: id, value: z.boolean() }),
  z.strictObject({ op: z.literal('dateInWindow'), from: date, to: date }),
  z.strictObject({ op: z.literal('availableFundsGte'), amountFen: moneySchema }),
  z.strictObject({ op: z.literal('capacityGte'), units: safeCount.min(1).max(1000), durationDays: safeCount.min(1).max(3650) }),
  z.strictObject({ op: z.literal('businessKindIs'), route: z.enum(ROUTES) }),
  z.strictObject({ op: z.literal('hasEntitlement'), entitlementId: id }),
  z.strictObject({ op: z.literal('contractStateIs'), state: z.enum(['unfulfilled', 'delivered', 'settled']) }),
  z.strictObject({ op: z.literal('hasCapability'), capabilityId: id }),
]))
const transaction = z.unknown().refine((value) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  if (['id', 'date', 'sourceEventId'].some((key) => Object.hasOwn(value, key))) return false
  if (!(CONTENT_LEDGER_KINDS as readonly unknown[]).includes(Reflect.get(value, 'kind'))) return false
  return ledgerOperationSchema.safeParse({ ...value, ...(Reflect.get(value, 'accountId') === '$owner' ? { accountId: 'validation-owner' } : {}), id: 'validation', date: '2020-01-01', sourceEventId: 'validation' }).success
})
export const effectSchema: z.ZodType<Effect> = z.lazy(() => z.union([
  z.strictObject({ op: z.literal('postLedgerTransaction'), transaction }),
  z.strictObject({ op: z.literal('moveReservation'), reservationId: id, newOriginId: id }),
  z.strictObject({ op: z.literal('recordObligation'), amountFen: moneySchema.min(1), counterpartyId: id, dueInDays: safeCount.max(3650) }),
  z.strictObject({ op: z.literal('startJob'), durationDays: safeCount.min(1).max(3650), capacityUnits: safeCount.min(1).max(1000), onComplete: list(effectSchema) }),
  z.strictObject({ op: z.literal('pauseNewContracts') }),
  z.strictObject({ op: z.literal('scheduleEvent'), definitionId: id, delayDays: safeCount.min(1).max(3650) }),
  z.strictObject({ op: z.literal('recordEvidence'), evidenceId: id, text, mode: z.enum(['public', 'fixed_fact']) }),
  z.strictObject({ op: z.literal('recordCause'), text }),
  z.strictObject({ op: z.literal('recordPreparation'), key: id }),
  z.strictObject({ op: z.literal('grantEntitlement'), entitlementId: id, validDays: safeCount.min(1).max(3650).nullable() }),
]) as z.ZodType<Effect>)
export const contentPackSchema = z.strictObject({
  version: id.max(128), sources: list(z.strictObject({ id, url: z.string().url().startsWith('https://'), checkedAt: date, status: z.enum(['verified', 'pending']), scope: text })),
  anchors: list(z.strictObject({ id, classification: z.literal('historical'), title: text, sourceIds: list(id).min(1), actualDate: date, publishedAt: date, availableAt: date, access: z.enum(['private_beta', 'public_preview', 'conditional_release', 'announcement', 'rule_effective']), enabled: z.boolean() })),
  capabilities: list(z.strictObject({ id, anchorId: id.nullable(), availableAt: date, entitlementIds: list(id), classification, route: z.enum(ROUTES).nullable() })),
  entitlementIds: list(id), preparationKeys: list(id),
  initialEntitlements: list(z.strictObject({ backgroundId: id, entitlementIds: list(id) })).default([]),
  events: list(z.strictObject({ id, title: text, classification, sourceIds: list(id), effectiveWindow: z.strictObject({ from: date, to: date }), scope: z.strictObject({ binding: z.enum(['player', 'business', 'contract', 'person']), businessKind: z.enum(ROUTES).nullable() }), trigger: conditionSchema, priority: signedPriority.refine((n) => n < Number.MAX_SAFE_INTEGER), exclusiveGroup: id.nullable(), hiddenFactsPolicy: z.strictObject({ mode: z.enum(['none', 'fixed_at_instance_creation']), domain: z.enum(RANDOM_DOMAINS) }), choices: list(z.strictObject({ id, label: text, condition: conditionSchema, actionPoints: safeCount.max(4), costFen: moneySchema, effects: list(effectSchema) })).min(1), defaultChoiceId: id, followUpPolicy: z.literal('explicit_effects'), responseDays: safeCount.min(1).max(3650), presentation: z.enum(['ordinary', 'mandatory', 'risk']), pausesTime: z.boolean() })),
  calendar: list(z.strictObject({ definitionId: id, date, bindingId: id, occurrenceId: id })),
  memories: list(z.strictObject({ id, domain: id, hint: text, preparationKey: id })),
})
function unique(ids: readonly string[]): void { requireRule(new Set(ids).size === ids.length, 'DUPLICATE_CONTENT_ID') }
export function loadContentPack(value: unknown): ContentPack {
  assertJsonInput(value)
  const parsed = contentPackSchema.safeParse(value)
  requireRule(parsed.success, 'INVALID_CONTENT_PACK')
  const pack = parsed.data as ContentPack
  for (const rows of [pack.sources, pack.anchors, pack.capabilities, pack.events, pack.memories]) unique(rows.map((item) => item.id))
  unique(pack.entitlementIds); unique(pack.preparationKeys); unique(pack.calendar.map((row) => row.occurrenceId))
  unique(pack.initialEntitlements.map((item) => item.backgroundId))
  const sources = new Map(pack.sources.map((source) => [source.id, source]))
  const events = new Map(pack.events.map((event) => [event.id, event]))
  const edges = new Map<string, Set<string>>()
  const checkSources = (ids: readonly string[], historical: boolean, enabled: boolean) => {
    unique(ids)
    requireRule(!historical || ids.length > 0, 'HISTORICAL_SOURCE_REQUIRED')
    for (const id of ids) requireRule(sources.has(id) && (!enabled || sources.get(id)?.status === 'verified'), 'UNVERIFIED_CONTENT_SOURCE')
  }
  for (const anchor of pack.anchors) {
    checkSources(anchor.sourceIds, true, anchor.enabled)
    requireRule(anchor.actualDate <= anchor.publishedAt && anchor.publishedAt <= anchor.availableAt, 'INVALID_ANCHOR_DATES')
  }
  for (const capability of pack.capabilities) {
    const anchor = pack.anchors.find((item) => item.id === capability.anchorId)
    requireRule(capability.anchorId === null || anchor, 'UNKNOWN_ANCHOR')
    requireRule(!anchor || capability.availableAt >= anchor.availableAt, 'CAPABILITY_BEFORE_RELEASE')
    requireRule(capability.entitlementIds.every((id) => pack.entitlementIds.includes(id)), 'UNKNOWN_ENTITLEMENT')
    requireRule(capability.classification !== 'historical' || anchor, 'HISTORICAL_SOURCE_REQUIRED')
  }
  for (const profile of pack.initialEntitlements) {
    unique(profile.entitlementIds)
    for (const id of profile.entitlementIds) requireRule(pack.entitlementIds.includes(id) && !pack.capabilities.some((capability) => capability.classification === 'historical' && capability.entitlementIds.includes(id)) && pack.capabilities.some((capability) => capability.entitlementIds.includes(id) && capability.anchorId === null && capability.availableAt <= '2020-01-01' && capability.classification === 'fictional'), 'INVALID_INITIAL_ENTITLEMENT')
  }
  function condition(value: Condition): void {
    if (value.op === 'all' || value.op === 'any') value.conditions.forEach(condition)
    else if (value.op === 'not') condition(value.condition)
    else if (value.op === 'flagEquals') requireRule(pack.preparationKeys.includes(value.key), 'UNKNOWN_PREPARATION')
    else if (value.op === 'dateInWindow') requireRule(value.from <= value.to, 'INVALID_CONTENT_WINDOW')
    else if (value.op === 'hasEntitlement') requireRule(pack.entitlementIds.includes(value.entitlementId), 'UNKNOWN_ENTITLEMENT')
    else if (value.op === 'hasCapability') requireRule(pack.capabilities.some((c) => c.id === value.capabilityId), 'UNKNOWN_CAPABILITY')
  }
  function effects(items: readonly Effect[], eventId: string, nested: boolean): void {
    for (const effect of items) {
      if (effect.op === 'scheduleEvent') { requireRule(events.has(effect.definitionId), 'UNKNOWN_FOLLOW_UP'); const links = edges.get(eventId) ?? new Set<string>(); links.add(effect.definitionId); edges.set(eventId, links) }
      if (effect.op === 'recordPreparation') requireRule(pack.preparationKeys.includes(effect.key), 'UNKNOWN_PREPARATION')
      if (effect.op === 'grantEntitlement') requireRule(pack.entitlementIds.includes(effect.entitlementId), 'UNKNOWN_ENTITLEMENT')
      if (effect.op === 'startJob') { requireRule(!nested, 'NESTED_JOB_FORBIDDEN'); effects(effect.onComplete, eventId, true) }
    }
    requireRule(items.filter((item) => item.op === 'startJob').length <= 1, 'MULTIPLE_CHOICE_JOBS')
  }
  for (const event of pack.events) {
    checkSources(event.sourceIds, event.classification === 'historical', true)
    requireRule(event.effectiveWindow.from <= event.effectiveWindow.to && event.effectiveWindow.from >= '2020-01-01' && event.effectiveWindow.to <= '2025-12-31', 'INVALID_CONTENT_WINDOW')
    requireRule(event.priority >= 0, 'CONTENT_PRIORITY_BEFORE_WORLD')
    condition(event.trigger); unique(event.choices.map((choice) => choice.id))
    for (const choice of event.choices) {
      condition(choice.condition); effects(choice.effects, event.id, false)
      requireRule(event.classification !== 'historical' || choice.effects.every((effect) => effect.op === 'recordCause' || (effect.op === 'recordEvidence' && effect.mode === 'public')), 'FICTIONAL_EFFECT_REQUIRES_LABEL')
      requireRule(!choice.effects.some((effect) => effect.op === 'startJob') || !choice.effects.some((effect) => effect.op === 'recordPreparation' || effect.op === 'grantEntitlement'), 'PREMATURE_JOB_EFFECT')
      const reveals = choice.effects.some((effect) => (effect.op === 'recordEvidence' && effect.mode === 'fixed_fact') || (effect.op === 'startJob' && effect.onComplete.some((part) => part.op === 'recordEvidence' && part.mode === 'fixed_fact')))
      requireRule(!reveals || (event.hiddenFactsPolicy.mode === 'fixed_at_instance_creation' && (choice.actionPoints > 0 || choice.costFen > 0)), 'FREE_HIDDEN_FACT_REVEAL')
    }
    const fallback = event.choices.find((choice) => choice.id === event.defaultChoiceId)
    requireRule(fallback, 'MISSING_DEFAULT_CHOICE')
    requireRule(fallback.actionPoints === 0 && fallback.costFen === 0 && fallback.condition.op === 'all' && fallback.condition.conditions.length === 0, 'DEFAULT_REQUIRES_RESOURCES')
    requireRule(fallback.effects.every((effect) => ['pauseNewContracts', 'recordObligation', 'recordCause'].includes(effect.op) || (effect.op === 'recordEvidence' && effect.mode === 'public')), 'UNSAFE_DEFAULT_EFFECT')
  }
  for (const row of pack.calendar) { const event = events.get(row.definitionId); requireRule(event && row.date >= event.effectiveWindow.from && row.date <= event.effectiveWindow.to, 'INVALID_CALENDAR_REFERENCE') }
  for (const memory of pack.memories) requireRule(pack.preparationKeys.includes(memory.preparationKey), 'UNKNOWN_PREPARATION')
  const active = new Set<string>(); const visited = new Set<string>()
  function visit(id: string): void { requireRule(!active.has(id), 'CYCLIC_FOLLOW_UP'); if (visited.has(id)) return; active.add(id); for (const target of edges.get(id) ?? []) visit(target); active.delete(id); visited.add(id) }
  for (const event of pack.events) visit(event.id)
  return copyJson(pack)
}
