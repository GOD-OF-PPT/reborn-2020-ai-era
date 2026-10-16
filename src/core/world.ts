import { loadContentPack } from './content-schema.ts'
import { addDays } from './calendar.ts'
import { applyEconomy, actionBudget, type EconomyState } from './economy.ts'
import { sumMoney } from './money.ts'
import { accountFunds, contractBalance } from './ledger.ts'
import { advanceTimeline, queueEvent, type ScheduledEvent, type DayPhase } from './timeline.ts'
import { scheduledActionSkipReason } from './economic-time.ts'
import { freezeFact, revealFact } from './facts.ts'
import { hashValue } from './hash.ts'
import { requireRule, RuleError } from './errors.ts'
import { copyJson } from './json-input.ts'
import { parseLedgerOperation } from './record-schemas.ts'
import { isWorldOperation, type ContentPack, type Condition, type Effect, type WorldState, type WorldBinding, type EventDefinition, type EventInstance, type ContentChoice, type RunOperation, type WorldLog } from './content-types.ts'
import type { RuleModel } from './run-types.ts'
import type { GameRun } from './run-types.ts'
import { assertWorldRun } from './world-validation.ts'

type State = Omit<RuleModel, 'timeline'>
type Context = Pick<State, 'world' | 'economy' | 'controlledAccountIds'>
type Changes = { state: State; events: ScheduledEvent<RunOperation>[] }
export const contentId = (prefix: string, ...parts: string[]) => `${prefix}:${hashValue(parts).slice(0, 32)}`
const worldOf = (state: Context): WorldState => { requireRule(state.world, 'WORLD_NOT_CONFIGURED'); return state.world }
const bindingOf = (state: Context, id: string): WorldBinding => { const binding = worldOf(state).bindings.find((item) => item.id === id); requireRule(binding && state.controlledAccountIds.includes(binding.accountId), 'INVALID_CONTENT_BINDING'); return binding }

export class WorldRuntime {
  readonly #pack: ContentPack
  readonly hash: string
  constructor(value: unknown) { this.#pack = loadContentPack(value); this.hash = hashValue(this.#pack) }
  get pack(): ContentPack { return copyJson(this.#pack) }
  validate(run: GameRun): void { assertWorldRun(this.#pack, run) }
  definition(id: string): EventDefinition { const definition = this.#pack.events.find((item) => item.id === id); requireRule(definition, 'UNKNOWN_EVENT_DEFINITION'); return definition }
  initialWorld(bindings: readonly WorldBinding[], backgroundId?: string): WorldState {
    const ids = this.#pack.initialEntitlements.find((profile) => profile.backgroundId === backgroundId)?.entitlementIds ?? []
    const entitlements = bindings.filter((binding) => binding.kind === 'player').flatMap((binding) => ids.map((id) => ({ id, bindingId: binding.id, acquiredAt: '2020-01-01', expiresAt: null, sourceEventId: 'bootstrap:profile' })))
    return { packVersion: this.#pack.version, packHash: this.hash, bindings: copyJson(bindings), anchors: [], newsRead: [], favoriteMemories: [], preparations: [], entitlements, instances: [], jobs: [], stoppedBindings: [], evidence: [], logs: [] }
  }
  #checkEffects(state: Context, binding: WorldBinding, items: readonly Effect[], date: string): void {
    for (const effect of items) {
      if (effect.op === 'postLedgerTransaction') {
        const transaction = effect.transaction
        requireRule(transaction.accountId === '$owner' || transaction.accountId === binding.accountId, 'EFFECT_ACCOUNT_NOT_BOUND')
        requireRule(!('businessId' in transaction) || transaction.businessId === binding.businessId, 'EFFECT_BUSINESS_NOT_BOUND')
        requireRule(!('contractId' in transaction) || transaction.contractId === binding.contractId, 'EFFECT_CONTRACT_NOT_BOUND')
        for (const key of ['counterpartyId', 'targetAccountId'] as const) if (key in transaction) requireRule(state.economy.ledger.accounts.some((account) => account.id === Reflect.get(transaction, key)), 'INVALID_ACCOUNT_REFERENCE')
      } else if (effect.op === 'recordObligation') requireRule(state.economy.ledger.accounts.some((account) => account.id === effect.counterpartyId), 'INVALID_ACCOUNT_REFERENCE')
      else if (effect.op === 'scheduleEvent') {
        const next = this.definition(effect.definitionId)
        const at = addDays(date, effect.delayDays)
        requireRule(next.scope.binding === binding.kind && (next.scope.businessKind === null || next.scope.businessKind === binding.route), 'FOLLOW_UP_SCOPE_MISMATCH')
        requireRule(at >= next.effectiveWindow.from && at <= next.effectiveWindow.to, 'FOLLOW_UP_OUTSIDE_WINDOW')
      } else if (effect.op === 'startJob') this.#checkEffects(state, binding, effect.onComplete, addDays(date, effect.durationDays))
    }
  }
  #checkBinding(state: Context, definition: EventDefinition, bindingId: string, date: string): void {
    const binding = bindingOf(state, bindingId)
    requireRule(binding.kind === definition.scope.binding && (definition.scope.businessKind === null || definition.scope.businessKind === binding.route), 'CONTENT_SCOPE_MISMATCH')
    for (const choice of definition.choices) this.#checkEffects(state, binding, choice.effects, date)
  }
  schedule(model: RuleModel): RuleModel {
    let timeline = model.timeline
    for (const anchor of this.#pack.anchors.filter((item) => item.enabled)) timeline = queueEvent(timeline, { instanceId: `anchor:${anchor.id}`, date: anchor.publishedAt, phase: 'world_update', priority: -1000, payload: { kind: 'world_anchor', anchorId: anchor.id, date: anchor.publishedAt } })
    for (const row of this.#pack.calendar) {
      const definition = this.definition(row.definitionId)
      this.#checkBinding(model, definition, row.bindingId, row.date)
      timeline = queueEvent(timeline, { instanceId: row.occurrenceId, date: row.date, phase: 'world_update', priority: definition.priority, payload: { kind: 'open_content_event', definitionId: row.definitionId, bindingId: row.bindingId, date: row.date } })
    }
    return { ...model, timeline }
  }
  hasEntitlement(state: Context, bindingId: string, id: string, date: string): boolean {
    return worldOf(state).entitlements.some((item) => item.id === id && item.bindingId === bindingId && item.acquiredAt <= date && (item.expiresAt === null || date < item.expiresAt))
  }
  capabilityReasons(state: Context, bindingId: string, id: string, date: string): readonly string[] {
    const capability = this.#pack.capabilities.find((item) => item.id === id)
    if (!capability) return ['UNKNOWN_CAPABILITY']
    const reasons: string[] = []
    if (date < capability.availableAt) reasons.push('CAPABILITY_NOT_YET_AVAILABLE')
    if (capability.anchorId !== null && !worldOf(state).anchors.some((item) => item.id === capability.anchorId)) reasons.push('WORLD_RELEASE_NOT_OCCURRED')
    for (const entitlement of capability.entitlementIds) if (!this.hasEntitlement(state, bindingId, entitlement, date)) reasons.push(`MISSING_ENTITLEMENT:${entitlement}`)
    return reasons
  }
  capacityAvailable(state: Context, bindingId: string, date: string, durationDays: number): number {
    const binding = bindingOf(state, bindingId)
    const end = addDays(date, durationDays)
    const jobs = worldOf(state).jobs.filter((item) => item.bindingId === bindingId && item.status === 'running' && item.startAt < end && item.completeAt > date)
    const dates = [date, ...jobs.map((job) => job.startAt).filter((start) => start > date)]
    return Math.min(...dates.map((point) => binding.capacityUnits - jobs.filter((job) => job.startAt <= point && job.completeAt > point).reduce((n, job) => n + job.capacityUnits, 0)))
  }
  conditionReasons(state: Context, bindingId: string, value: Condition, date: string): readonly string[] {
    const binding = bindingOf(state, bindingId)
    switch (value.op) {
      case 'all': return value.conditions.flatMap((item) => this.conditionReasons(state, bindingId, item, date))
      case 'any': return value.conditions.some((item) => this.conditionReasons(state, bindingId, item, date).length === 0) ? [] : ['NO_ALTERNATIVE_CONDITION_MET']
      case 'not': return this.conditionReasons(state, bindingId, value.condition, date).length === 0 ? ['NEGATED_CONDITION_MET'] : []
      case 'flagEquals': return worldOf(state).preparations.some((item) => item.key === value.key && item.bindingId === bindingId && item.date <= date) === value.value ? [] : ['PREPARATION_REQUIRED']
      case 'dateInWindow': return date >= value.from && date <= value.to ? [] : ['OUTSIDE_CHOICE_WINDOW']
      case 'availableFundsGte': return accountFunds(state.economy.ledger, binding.accountId).availableFen >= value.amountFen ? [] : ['INSUFFICIENT_AVAILABLE_FUNDS']
      case 'capacityGte': return this.capacityAvailable(state, bindingId, date, value.durationDays) >= value.units ? [] : ['INSUFFICIENT_CAPACITY']
      case 'businessKindIs': return binding.kind === 'business' && binding.route === value.route ? [] : ['BUSINESS_KIND_MISMATCH']
      case 'hasEntitlement': return this.hasEntitlement(state, bindingId, value.entitlementId, date) ? [] : [`MISSING_ENTITLEMENT:${value.entitlementId}`]
      case 'hasCapability': return this.capabilityReasons(state, bindingId, value.capabilityId, date)
      case 'contractStateIs': {
        const contract = state.economy.ledger.contracts.find((item) => item.id === binding.contractId)
        if (!contract || contract.accountId !== binding.accountId) return ['CONTRACT_NOT_BOUND']
        const balance = contractBalance(state.economy.ledger, contract.id)
        const delivered = state.economy.ledger.receipts.some((receipt) => receipt.contractId === contract.id && ['deliver_prepaid', 'deliver_on_credit'].includes(receipt.kind))
        const debt = state.economy.ledger.obligations.some((obligation) => obligation.contractId === contract.id && obligation.remainingFen > 0)
        const matches = value.state === 'unfulfilled' ? balance.prepaidFen > 0 : value.state === 'delivered' ? delivered && balance.prepaidFen === 0 : balance.prepaidFen === 0 && contract.receivableFen === 0 && !debt
        return matches ? [] : ['CONTRACT_STATE_MISMATCH']
      }
    }
  }
  inspect(state: Context, instanceId: string, choiceId: string, date: string) {
    const world = worldOf(state)
    const instance = world.instances.find((item) => item.id === instanceId)
    requireRule(instance, 'EVENT_NOT_FOUND')
    requireRule(instance.status === 'pending', 'EVENT_ALREADY_RESOLVED')
    const definition = this.definition(instance.definitionId)
    const choice = definition.choices.find((item) => item.id === choiceId)
    requireRule(choice, 'UNKNOWN_EVENT_CHOICE')
    requireRule(date >= instance.createdAt && date <= instance.expiresAt, 'EVENT_OUTSIDE_WINDOW')
    const reasons = [...this.conditionReasons(state, instance.bindingId, choice.condition, date)]
    const binding = bindingOf(state, instance.bindingId)
    this.#checkEffects(state, binding, choice.effects, date)
    if (actionBudget(state.economy, date).available < choice.actionPoints) reasons.push('INSUFFICIENT_ACTION_POINTS')
    if (accountFunds(state.economy.ledger, binding.accountId).availableFen < choice.costFen) reasons.push('INSUFFICIENT_AVAILABLE_FUNDS')
    const job = choice.effects.find((effect) => effect.op === 'startJob')
    if (job && this.capacityAvailable(state, binding.id, date, job.durationDays) < job.capacityUnits) reasons.push('INSUFFICIENT_CAPACITY')
    let upfrontCostFen = choice.costFen
    if (reasons.length === 0) {
      let economy = state.economy
      if (choice.costFen > 0) economy = applyEconomy(economy, { kind: 'expense', id: contentId('preview-cost', instance.id, choice.id), sourceEventId: instance.id, date, accountId: binding.accountId, counterpartyId: 'world', amountFen: choice.costFen })
      choice.effects.forEach((effect, index) => {
        const before = accountFunds(economy.ledger, binding.accountId).cashFen
        economy = this.#financial(economy, binding, instance, effect, date, contentId('effect', contentId('choice', instance.id, choice.id), String(index))).economy
        upfrontCostFen = sumMoney([upfrontCostFen, Math.max(0, before - accountFunds(economy.ledger, binding.accountId).cashFen)])
      })
    }
    return { allowed: reasons.length === 0, reasonCodes: reasons, actionPoints: choice.actionPoints, upfrontCostFen, releasedFen: 0 }
  }
  #financial(economy: EconomyState, binding: WorldBinding, instance: EventInstance, effect: Effect, date: string, id: string): { economy: EconomyState; events: ScheduledEvent<RunOperation>[] } {
    if (effect.op === 'postLedgerTransaction') {
      const template = effect.transaction
      requireRule(template.accountId === '$owner' || template.accountId === binding.accountId, 'EFFECT_ACCOUNT_NOT_BOUND')
      requireRule(!('businessId' in template) || template.businessId === binding.businessId, 'EFFECT_BUSINESS_NOT_BOUND')
      requireRule(!('contractId' in template) || template.contractId === binding.contractId, 'EFFECT_CONTRACT_NOT_BOUND')
      const operation = parseLedgerOperation({ ...template, ...(binding.businessId === null ? {} : { businessId: binding.businessId }), ...(binding.contractId === null ? {} : { contractId: binding.contractId }), accountId: binding.accountId, id, date, sourceEventId: instance.id })
      requireRule(operation.kind !== 'opening_cash', 'CONTENT_CANNOT_REINITIALIZE_CASH')
      return { economy: applyEconomy(economy, operation), events: [] }
    }
    if (effect.op === 'moveReservation') return { economy: applyEconomy(economy, { kind: 'move_reservation', id, date, sourceEventId: instance.id, accountId: binding.accountId, reservationId: effect.reservationId, newOriginId: effect.newOriginId }), events: [] }
    if (effect.op === 'recordObligation') {
      requireRule(economy.ledger.accounts.some((account) => account.id === effect.counterpartyId), 'INVALID_ACCOUNT_REFERENCE')
      const due = addDays(date, effect.dueInDays)
      const operation: RunOperation = { kind: 'due_expense', id, date: due, sourceEventId: instance.id, accountId: binding.accountId, ...(binding.businessId === null ? {} : { businessId: binding.businessId }), ...(binding.contractId === null ? {} : { contractId: binding.contractId }), counterpartyId: effect.counterpartyId, obligationId: contentId('obligation', id), amountFen: effect.amountFen }
      return due === date ? { economy: applyEconomy(economy, operation), events: [] } : { economy, events: [{ instanceId: id, date: due, phase: 'due_obligations', priority: 0, payload: operation }] }
    }
    return { economy, events: [] }
  }
  #log(state: State, id: string, date: string, sourceEventId: string, text: string, kind: WorldLog['kind'], parentIds: readonly string[] = []): State {
    const world = worldOf(state)
    requireRule(!world.logs.some((log) => log.id === id), 'DUPLICATE_WORLD_EFFECT')
    return { ...state, world: { ...world, logs: [...world.logs, { id, date, sourceEventId, text, kind, parentIds, visibility: 'visible' }] } }
  }
  #newCashGap(before: State, after: State) {
    return after.economy.ledger.obligations.find((obligation) => obligation.remainingFen > 0 && !before.economy.ledger.obligations.some((prior) => prior.id === obligation.id && prior.remainingFen > 0))
  }
  #clockEffects(before: State, result: Changes) {
    return { state: result.state, newEvents: result.events, ...(this.#newCashGap(before, result.state) ? { pauseReason: 'CASH_SHORTFALL' } : {}) }
  }
  #effects(state: State, instance: EventInstance, choice: ContentChoice, effects: readonly Effect[], date: string, prefix: string, actionId: string | null): Changes {
    let current = state
    const events: ScheduledEvent<RunOperation>[] = []
    const binding = bindingOf(current, instance.bindingId)
    effects.forEach((effect, index) => {
      const id = contentId('effect', prefix, String(index))
      let world = worldOf(current)
      const parent = world.logs.find((item) => item.id === contentId('instance', instance.id))
      switch (effect.op) {
        case 'postLedgerTransaction': case 'moveReservation': case 'recordObligation': {
          const result = this.#financial(current.economy, binding, instance, effect, date, id)
          current = { ...current, economy: result.economy }; events.push(...result.events)
          break
        }
        case 'startJob': {
          requireRule(actionId, 'JOB_ACTION_REQUIRED')
          const jobId = contentId('job', instance.id, choice.id)
          const completeAt = addDays(date, effect.durationDays)
          world = worldOf(current)
          current = { ...current, world: { ...world, jobs: [...world.jobs, { id: jobId, instanceId: instance.id, actionId, bindingId: binding.id, choiceId: choice.id, startAt: date, completeAt, capacityUnits: effect.capacityUnits, status: 'running' }] } }
          events.push({ instanceId: contentId('finish', jobId), date: completeAt, phase: 'player_actions', priority: 0, payload: { kind: 'finish_preparation', jobId, date: completeAt } })
          break
        }
        case 'pauseNewContracts': current = { ...current, world: { ...world, stoppedBindings: [...new Set([...world.stoppedBindings, binding.id])] } }; break
        case 'scheduleEvent': {
          const next = this.definition(effect.definitionId)
          const at = addDays(date, effect.delayDays)
          requireRule(at >= next.effectiveWindow.from && at <= next.effectiveWindow.to, 'FOLLOW_UP_OUTSIDE_WINDOW')
          events.push({ instanceId: id, date: at, phase: 'world_update', priority: next.priority, payload: { kind: 'open_content_event', definitionId: next.id, bindingId: binding.id, date: at } })
          break
        }
        case 'recordEvidence': {
          if (effect.mode === 'fixed_fact') { requireRule(instance.factId, 'EVENT_HAS_NO_HIDDEN_FACT'); current = { ...current, ...revealFact({ random: current.random, facts: current.facts }, instance.factId, effect.text) } }
          world = worldOf(current)
          current = { ...current, world: { ...world, evidence: [...world.evidence, { id: contentId('evidence', instance.id, effect.evidenceId), instanceId: instance.id, date, text: effect.text }] } }
          break
        }
        case 'recordPreparation': current = { ...current, world: { ...world, preparations: [...world.preparations, { key: effect.key, bindingId: binding.id, date, sourceEventId: instance.id }] } }; break
        case 'grantEntitlement': current = { ...current, world: { ...world, entitlements: [...world.entitlements, { id: effect.entitlementId, bindingId: binding.id, acquiredAt: date, expiresAt: effect.validDays === null ? null : addDays(date, effect.validDays), sourceEventId: instance.id }] } }; break
        case 'recordCause': break
      }
      current = this.#log(current, id, date, instance.id, effect.op === 'recordCause' ? effect.text : effect.op, 'effect', parent ? [parent.id] : [])
    })
    return { state: current, events }
  }
  #resolve(state: State, instanceId: string, choiceId: string, date: string, mode: 'chosen' | 'default', reason: string): Changes {
    const world = worldOf(state)
    const instance = world.instances.find((item) => item.id === instanceId)
    requireRule(instance && instance.status === 'pending', 'EVENT_ALREADY_RESOLVED')
    const definition = this.definition(instance.definitionId)
    const choice = definition.choices.find((item) => item.id === choiceId)
    requireRule(choice, 'UNKNOWN_EVENT_CHOICE')
    if (mode === 'chosen') { const preview = this.inspect(state, instanceId, choiceId, date); requireRule(preview.allowed, preview.reasonCodes[0] ?? 'CHOICE_DISABLED') }
    let current = state
    const job = choice.effects.find((effect) => effect.op === 'startJob')
    const actionId = choice.actionPoints > 0 || choice.costFen > 0 || job ? contentId('action', instance.id, choice.id) : null
    if (actionId) {
      const binding = bindingOf(current, instance.bindingId)
      const completeAt = job ? addDays(date, job.durationDays) : date
      const action = { id: actionId, definitionId: definition.id, accountId: binding.accountId, ...(binding.businessId === null ? {} : { businessId: binding.businessId }), counterpartyId: 'world', actionPoints: choice.actionPoints, costFen: choice.costFen, cashReservationId: contentId('funds', actionId), startAt: date, completeAt, settlementAt: completeAt }
      current = { ...current, economy: applyEconomy(current.economy, { id: `${actionId}:reserve`, date, sourceEventId: instance.id, kind: 'reserve_action', action }) }
      current = { ...current, economy: applyEconomy(current.economy, { id: `${actionId}:execute`, date, sourceEventId: instance.id, kind: 'execute_action', actionId }) }
      if (!job) current = { ...current, economy: applyEconomy(current.economy, { id: `${actionId}:complete`, date, sourceEventId: instance.id, kind: 'complete_action', actionId }) }
    }
    const result = this.#effects(current, instance, choice, choice.effects, date, contentId('choice', instance.id, choice.id), actionId)
    current = result.state
    const updated = worldOf(current)
    current = { ...current, world: { ...updated, instances: updated.instances.map((item) => item.id === instance.id ? { ...item, status: 'resolved', choiceId, resolvedAt: date, resolution: mode, reason } : item) } }
    current = this.#log(current, contentId('resolved', instance.id), date, instance.id, `${mode}:${choice.label}`, 'event', [contentId('instance', instance.id)])
    return { state: current, events: result.events }
  }
  choose(model: RuleModel, instanceId: string, choiceId: string): RuleModel {
    const result = this.#resolve(model, instanceId, choiceId, model.timeline.cursor.date, 'chosen', 'PLAYER_CHOICE')
    let timeline = model.timeline
    const instance = worldOf(model).instances.find((item) => item.id === instanceId)
    if (instance && timeline.pause?.instanceId === instance.openedBy && timeline.pause.reason === 'CONTENT_DECISION_PENDING') timeline = { ...timeline, pause: null }
    const gap = this.#newCashGap(model, result.state)
    if (gap && timeline.pause === null) timeline = { ...timeline, pause: { instanceId: gap.originOperationId, reason: 'CASH_SHORTFALL', source: 'command' } }
    for (const event of result.events) timeline = queueEvent(timeline, event)
    return { ...result.state, timeline }
  }
  advance(model: RuleModel, target: { readonly date: string; readonly phase?: DayPhase }): RuleModel {
    const result = advanceTimeline(model.timeline, model as State, target, (state, event) => {
      const operation = event.payload
      if (!isWorldOperation(operation)) {
        const skippedReason = scheduledActionSkipReason(state.economy, operation)
        if (skippedReason) return { state, skippedReason }
        const economy = applyEconomy(state.economy, operation)
        const receipt = economy.ledger.receipts.find((item) => item.id === operation.id)
        const obligationId = 'obligationId' in operation ? operation.obligationId : null
        const due = economy.ledger.obligations.some((item) => item.remainingFen > 0 && (item.originOperationId === operation.id || item.id === obligationId))
        return { state: { ...state, economy }, ...(receipt?.status === 'due' && due ? { pauseReason: 'CASH_SHORTFALL' } : {}) }
      }
      let current: State = { ...state, economy: { ...state.economy, asOf: event.date, ledger: { ...state.economy.ledger, asOf: event.date } } }
      const world = worldOf(current)
      if (operation.kind === 'world_anchor') {
        const anchor = this.#pack.anchors.find((item) => item.id === operation.anchorId)
        requireRule(anchor?.enabled && anchor.publishedAt === event.date, 'INVALID_ANCHOR_OCCURRENCE')
        requireRule(!world.anchors.some((item) => item.id === anchor.id), 'DUPLICATE_WORLD_ANCHOR')
        const causeId = contentId('world', anchor.id)
        current = { ...current, world: { ...world, anchors: [...world.anchors, { id: anchor.id, happenedAt: anchor.actualDate, causeId }] } }
        return { state: this.#log(current, causeId, event.date, anchor.id, anchor.title, 'anchor') }
      }
      if (operation.kind === 'open_content_event') {
        const definition = this.definition(operation.definitionId)
        const binding = bindingOf(current, operation.bindingId)
        this.#checkBinding(current, definition, binding.id, event.date)
        requireRule(event.date >= definition.effectiveWindow.from && event.date <= definition.effectiveWindow.to, 'EVENT_OUTSIDE_WINDOW')
        const instanceId = contentId('event', event.instanceId)
        requireRule(!world.instances.some((item) => item.id === instanceId), 'DUPLICATE_EVENT_INSTANCE')
        const factId = definition.hiddenFactsPolicy.mode === 'none' ? null : contentId('fact', instanceId)
        if (factId) current = { ...current, ...freezeFact({ random: current.random, facts: current.facts }, { id: factId, sourceEventId: instanceId, domain: definition.hiddenFactsPolicy.domain, date: event.date }) }
        const expiresAt = [addDays(event.date, definition.responseDays), definition.effectiveWindow.to].sort()[0] as string
        const instance: EventInstance = { id: instanceId, definitionId: definition.id, bindingId: binding.id, openedBy: event.instanceId, createdAt: event.date, expiresAt, factId, status: 'pending', choiceId: null, resolvedAt: null, resolution: null, reason: null }
        current = { ...current, world: { ...worldOf(current), instances: [...world.instances, instance] } }
        current = this.#log(current, contentId('instance', instanceId), event.date, definition.id, '事件已到达', 'event')
        const unmet = this.conditionReasons(current, binding.id, definition.trigger, event.date)
        const exclusive = definition.exclusiveGroup !== null && world.instances.some((item) => {
          const prior = this.definition(item.definitionId)
          return item.bindingId === binding.id && prior.exclusiveGroup === definition.exclusiveGroup && prior.effectiveWindow.from <= definition.effectiveWindow.to && prior.effectiveWindow.to >= definition.effectiveWindow.from && (item.status === 'pending' || (item.resolution === 'chosen' && item.choiceId !== prior.defaultChoiceId))
        })
        if (unmet.length > 0 || exclusive) return this.#clockEffects(current, this.#resolve(current, instance.id, definition.defaultChoiceId, event.date, 'default', exclusive ? 'EXCLUSIVE_GROUP_BUSY' : unmet.join(',')))
        const expiry: ScheduledEvent<RunOperation> = { instanceId: contentId('expiry', instanceId), date: expiresAt, phase: 'due_obligations', priority: definition.priority, payload: { kind: 'expire_content_event', eventId: instanceId, date: expiresAt } }
        return { state: current, newEvents: [expiry], ...(definition.pausesTime ? { pauseReason: 'CONTENT_DECISION_PENDING' } : {}) }
      }
      if (operation.kind === 'expire_content_event') {
        const instance = world.instances.find((item) => item.id === operation.eventId)
        requireRule(instance && instance.expiresAt === event.date, 'INVALID_EVENT_EXPIRY')
        if (instance.status === 'resolved') return { state: current, skippedReason: 'EVENT_ALREADY_RESOLVED' }
        const fallback = this.#resolve(current, instance.id, this.definition(instance.definitionId).defaultChoiceId, event.date, 'default', 'DEADLINE_REACHED')
        return this.#clockEffects(current, fallback)
      }
      const job = world.jobs.find((item) => item.id === operation.jobId)
      requireRule(job && job.completeAt === event.date, 'INVALID_JOB_COMPLETION')
      if (job.status === 'interrupted') return { state: current, skippedReason: 'PREPARATION_INTERRUPTED' }
      requireRule(job.status === 'running', 'PREPARATION_ALREADY_COMPLETED')
      const instance = world.instances.find((item) => item.id === job.instanceId)
      requireRule(instance, 'EVENT_NOT_FOUND')
      const choice = this.definition(instance.definitionId).choices.find((item) => item.id === job.choiceId)
      const start = choice?.effects.find((effect) => effect.op === 'startJob')
      requireRule(choice && start, 'JOB_DEFINITION_MISMATCH')
      let completed: Changes
      try {
        const candidate = { ...current, economy: applyEconomy(current.economy, { id: `${job.actionId}:complete`, date: event.date, sourceEventId: job.instanceId, kind: 'complete_action', actionId: job.actionId }) }
        completed = this.#effects(candidate, instance, choice, start.onComplete, event.date, contentId('completion', job.id), null)
      } catch (error) {
        if (!(error instanceof RuleError)) throw error
        current = { ...current, economy: applyEconomy(current.economy, { id: contentId('failure', job.id), date: event.date, sourceEventId: job.instanceId, kind: 'interrupt_action', actionId: job.actionId }), world: { ...worldOf(current), jobs: worldOf(current).jobs.map((item) => item.id === job.id ? { ...item, status: 'interrupted' } : item) } }
        return { state: this.#log(current, contentId('failed', job.id), event.date, job.id, `准备任务未完成：${error.code}，保留已发生成本`, 'job', [contentId('instance', instance.id)]), skippedReason: `PREPARATION_COMPLETION_FAILED:${error.code}` }
      }
      current = completed.state
      current = { ...current, world: { ...worldOf(current), jobs: worldOf(current).jobs.map((item) => item.id === job.id ? { ...item, status: 'completed' } : item) } }
      return this.#clockEffects(state, { state: this.#log(current, contentId('completed', job.id), event.date, job.id, '准备任务已完成', 'job', [contentId('instance', instance.id)]), events: completed.events })
    })
    const asOf = result.timeline.cursor.date
    return { ...result.state, timeline: result.timeline, economy: { ...result.state.economy, asOf, ledger: { ...result.state.economy.ledger, asOf } } }
  }
  defer(model: RuleModel, instanceId: string): RuleModel {
    const instance = worldOf(model).instances.find((item) => item.id === instanceId)
    requireRule(instance?.status === 'pending' && model.timeline.pause?.instanceId === instance.openedBy && model.timeline.pause.reason === 'CONTENT_DECISION_PENDING', 'EVENT_NOT_PAUSED')
    return { ...model, timeline: { ...model.timeline, pause: null } }
  }
  interrupt(model: RuleModel, jobId: string): RuleModel {
    const world = worldOf(model)
    const job = world.jobs.find((item) => item.id === jobId)
    requireRule(job?.status === 'running', 'JOB_NOT_RUNNING')
    const date = model.timeline.cursor.date
    return { ...model, economy: applyEconomy(model.economy, { id: contentId('interrupt', jobId), date, sourceEventId: job.instanceId, kind: 'interrupt_action', actionId: job.actionId }), world: { ...world, jobs: world.jobs.map((item) => item.id === job.id ? { ...item, status: 'interrupted' } : item) } }
  }
}
