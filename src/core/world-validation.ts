import { requireRule } from './errors.ts'
import { hashValue } from './hash.ts'
import { addDays } from './calendar.ts'
import { worldStateSchema, worldOperationSchema } from './world-schema.ts'
import type { ContentPack, Effect, EventInstance } from './content-types.ts'
import type { GameRun } from './run-types.ts'

export function assertWorldRun(pack: ContentPack, run: GameRun): void {
  const parsed = worldStateSchema.safeParse(run.world)
  requireRule(parsed.success && run.world, 'INVALID_WORLD_STATE')
  const world = run.world
  requireRule(world.packVersion === pack.version && world.packHash === hashValue(pack), 'WORLD_CONTENT_MISMATCH')
  const unique = (ids: readonly string[]) => requireRule(new Set(ids).size === ids.length, 'DUPLICATE_WORLD_ID')
  for (const rows of [world.bindings, world.anchors, world.instances, world.jobs, world.logs, world.evidence]) unique(rows.map((item) => item.id))
  unique(world.newsRead); unique(world.favoriteMemories); unique(world.stoppedBindings)
  const bindings = new Map(world.bindings.map((item) => [item.id, item]))
  const definitions = new Map(pack.events.map((item) => [item.id, item]))
  const instances = new Map(world.instances.map((item) => [item.id, item]))
  const date = run.timeline.cursor.date
  for (const binding of world.bindings) {
    requireRule(run.controlledAccountIds.includes(binding.accountId), 'INVALID_CONTENT_BINDING')
    if (binding.kind === 'player') requireRule(binding.businessId === null && binding.contractId === null && binding.personId === null && binding.route === null, 'INVALID_CONTENT_BINDING')
    if (binding.kind === 'business') requireRule(binding.businessId !== null && binding.route !== null && (run.operations?.businesses.some((business) => business.id === binding.businessId && business.accountId === binding.accountId && business.route === binding.route) || run.economy.ledger.accounts.some((account) => account.id === binding.accountId && account.kind === 'business') || run.economy.ledger.contracts.some((contract) => contract.businessId === binding.businessId && contract.accountId === binding.accountId)), 'INVALID_BUSINESS_BINDING')
    if (binding.kind === 'contract') requireRule(run.economy.ledger.contracts.some((contract) => contract.id === binding.contractId && contract.businessId === binding.businessId && contract.accountId === binding.accountId), 'INVALID_CONTRACT_BINDING')
    if (binding.kind === 'person') requireRule(binding.personId !== null, 'INVALID_PERSON_BINDING')
  }
  for (const anchor of world.anchors) {
    const definition = pack.anchors.find((item) => item.id === anchor.id)
    requireRule(definition?.enabled && definition.actualDate === anchor.happenedAt && definition.publishedAt <= date && world.logs.some((log) => log.id === anchor.causeId && log.sourceEventId === anchor.id && log.kind === 'anchor'), 'INVALID_WORLD_ANCHOR')
  }
  requireRule(world.newsRead.every((id) => world.anchors.some((anchor) => anchor.id === id)), 'UNKNOWN_NEWS')
  requireRule(world.favoriteMemories.every((id) => pack.memories.some((memory) => memory.id === id)), 'UNKNOWN_MEMORY')
  for (const instance of world.instances) {
    const definition = definitions.get(instance.definitionId)
    const binding = bindings.get(instance.bindingId)
    requireRule(definition && binding && definition.scope.binding === binding.kind && (definition.scope.businessKind === null || definition.scope.businessKind === binding.route), 'CONTENT_SCOPE_MISMATCH')
    requireRule(instance.createdAt <= date && instance.createdAt >= definition.effectiveWindow.from && instance.createdAt <= definition.effectiveWindow.to && instance.expiresAt === [addDays(instance.createdAt, definition.responseDays), definition.effectiveWindow.to].sort()[0], 'INVALID_EVENT_WINDOW')
    if (instance.status === 'pending') requireRule(instance.choiceId === null && instance.resolvedAt === null && instance.resolution === null && instance.reason === null, 'INVALID_EVENT_RESOLUTION')
    else requireRule(definition.choices.some((choice) => choice.id === instance.choiceId) && instance.resolvedAt !== null && instance.resolvedAt >= instance.createdAt && instance.resolvedAt <= date && instance.resolution !== null && instance.reason !== null && (instance.resolution !== 'default' || instance.choiceId === definition.defaultChoiceId), 'INVALID_EVENT_RESOLUTION')
    if (definition.hiddenFactsPolicy.mode === 'none') requireRule(instance.factId === null, 'INVALID_EVENT_FACT')
    else requireRule(run.facts.some((fact) => fact.id === instance.factId && fact.sourceEventId === instance.id && fact.createdAt === instance.createdAt && fact.domain === definition.hiddenFactsPolicy.domain), 'INVALID_EVENT_FACT')
    requireRule(run.timeline.receipts.some((receipt) => receipt.instanceId === instance.openedBy), 'MISSING_EVENT_OCCURRENCE')
    if (instance.status === 'pending') requireRule(run.timeline.pending.some((event) => event.payload.kind === 'expire_content_event' && event.payload.eventId === instance.id && event.date === instance.expiresAt), 'MISSING_EVENT_DEADLINE')
  }
  for (const job of world.jobs) {
    const instance = instances.get(job.instanceId)
    const choice = instance ? definitions.get(instance.definitionId)?.choices.find((item) => item.id === job.choiceId) : undefined
    const template = choice?.effects.find((item) => item.op === 'startJob')
    const action = run.economy.actions.find((item) => item.definition.id === job.actionId)
    requireRule(instance && choice && template && bindings.has(job.bindingId) && instance.bindingId === job.bindingId && instance.choiceId === choice.id && action, 'INVALID_PREPARATION_JOB')
    requireRule(job.completeAt === addDays(job.startAt, template.durationDays) && job.capacityUnits === template.capacityUnits && job.startAt === action.executedAt && job.completeAt === action.definition.completeAt && action.definition.actionPoints === choice.actionPoints && action.definition.costFen === choice.costFen, 'INVALID_PREPARATION_JOB')
    requireRule(job.status === 'running' ? action.status === 'executed' : job.status === 'completed' ? action.status === 'completed' : action.status === 'interrupted', 'JOB_ACTION_STATE_MISMATCH')
    if (job.status === 'completed') requireRule(job.completeAt <= date, 'FUTURE_COMPLETED_JOB')
    if (job.status === 'running') requireRule(run.timeline.pending.some((event) => event.payload.kind === 'finish_preparation' && event.payload.jobId === job.id && event.date === job.completeAt), 'MISSING_JOB_COMPLETION')
  }
  for (const binding of world.bindings) {
    const jobs = world.jobs.filter((job) => job.bindingId === binding.id).map((job) => ({ ...job, occupiedUntil: job.status === 'interrupted' ? run.economy.actions.find((action) => action.definition.id === job.actionId)?.finishedAt ?? job.completeAt : job.completeAt }))
    for (const point of jobs.map((job) => job.startAt)) requireRule(jobs.filter((job) => job.startAt <= point && job.occupiedUntil > point).reduce((n, job) => n + job.capacityUnits, 0) <= binding.capacityUnits, 'OVERALLOCATED_CONTENT_CAPACITY')
  }
  function authored(instance: EventInstance, predicate: (effect: Effect) => boolean): boolean {
    const choice = definitions.get(instance.definitionId)?.choices.find((item) => item.id === instance.choiceId)
    if (!choice || instance.status !== 'resolved') return false
    return choice.effects.some((effect) => predicate(effect) || (effect.op === 'startJob' && world.jobs.some((job) => job.instanceId === instance.id && job.status === 'completed') && effect.onComplete.some(predicate)))
  }
  for (const item of world.preparations) {
    const instance = instances.get(item.sourceEventId)
    requireRule(pack.preparationKeys.includes(item.key) && bindings.has(item.bindingId) && item.date <= date && ((instance?.bindingId === item.bindingId && authored(instance, (effect) => effect.op === 'recordPreparation' && effect.key === item.key)) || (item.bindingId === 'player' && run.operations?.contracts.some(c=>c.id===item.sourceEventId&&c.status==='settled'&&c.caseKey===item.key&&c.settledAt===item.date))), 'INVALID_PREPARATION_SOURCE')
  }
  for (const item of world.entitlements) {
    const instance = instances.get(item.sourceEventId)
    const initial = item.sourceEventId === 'bootstrap:profile' && item.acquiredAt === '2020-01-01' && item.expiresAt === null && bindings.get(item.bindingId)?.kind === 'player' && pack.initialEntitlements.some((profile) => profile.backgroundId === run.backgroundId && profile.entitlementIds.includes(item.id))
    requireRule(pack.entitlementIds.includes(item.id) && bindings.has(item.bindingId) && item.acquiredAt <= date && (item.expiresAt === null || item.expiresAt > item.acquiredAt) && (initial || (instance?.bindingId === item.bindingId && authored(instance, (effect) => effect.op === 'grantEntitlement' && effect.entitlementId === item.id))), 'INVALID_ENTITLEMENT_SOURCE')
  }
  for (const profile of pack.initialEntitlements.filter((item) => item.backgroundId === run.backgroundId)) for (const id of profile.entitlementIds) requireRule(world.entitlements.some((item) => item.id === id && item.sourceEventId === 'bootstrap:profile'), 'MISSING_INITIAL_ENTITLEMENT')
  for (const evidence of world.evidence) requireRule(instances.has(evidence.instanceId) && evidence.date <= date && authored(instances.get(evidence.instanceId) as EventInstance, (effect) => effect.op === 'recordEvidence' && effect.text === evidence.text), 'INVALID_EVIDENCE_SOURCE')
  requireRule(world.stoppedBindings.every((id) => bindings.has(id) && (run.operations?.businesses.some(b=>b.id===id&&['paused','winding_down','closed'].includes(b.lifecycle)) || world.instances.some((instance) => instance.bindingId === id && authored(instance, (effect) => effect.op === 'pauseNewContracts')))), 'INVALID_STOP_SOURCE')
  const logs = new Set<string>()
  for (const log of world.logs) {
    requireRule(log.date <= date && log.parentIds.every((id) => logs.has(id)), 'INVALID_WORLD_CAUSE')
    requireRule(run.causes.some((cause) => cause.id === log.id && cause.sourceEventId === log.sourceEventId && cause.date === log.date && cause.visibleSummary === log.text), 'MISSING_WORLD_CAUSE')
    logs.add(log.id)
  }
  function validateOperation(raw: unknown, occurrenceId: string, processed: boolean, skippedReason?: string): void {
    const parsed = worldOperationSchema.safeParse(raw)
    if (!parsed.success) return
    const operation = parsed.data
    if (operation.kind === 'world_anchor') {
      const anchor = pack.anchors.find((item) => item.id === operation.anchorId)
      requireRule(anchor?.enabled && operation.date === anchor.publishedAt, 'INVALID_ANCHOR_OCCURRENCE')
      if (processed) requireRule(world.anchors.some((item) => item.id === anchor.id), 'MISSING_WORLD_ANCHOR')
    } else if (operation.kind === 'open_content_event') {
      const definition = definitions.get(operation.definitionId)
      const binding = bindings.get(operation.bindingId)
      requireRule(definition && binding && definition.scope.binding === binding.kind && (definition.scope.businessKind === null || definition.scope.businessKind === binding.route) && operation.date >= definition.effectiveWindow.from && operation.date <= definition.effectiveWindow.to, 'INVALID_EVENT_OCCURRENCE')
      if (processed) requireRule(world.instances.some((item) => item.openedBy === occurrenceId && item.definitionId === operation.definitionId && item.bindingId === operation.bindingId && item.createdAt === operation.date), 'MISSING_EVENT_INSTANCE')
    } else if (operation.kind === 'expire_content_event') {
      const instance = instances.get(operation.eventId)
      requireRule(instance && operation.date === instance.expiresAt, 'INVALID_EVENT_EXPIRY')
      if (processed) requireRule(instance.status === 'resolved' && (skippedReason === undefined ? instance.resolution === 'default' : skippedReason === 'EVENT_ALREADY_RESOLVED'), 'INVALID_EVENT_EXPIRY')
    } else {
      const job = world.jobs.find((item) => item.id === operation.jobId)
      requireRule(job && job.completeAt === operation.date, 'INVALID_JOB_COMPLETION')
      if (processed) requireRule(skippedReason === undefined ? job.status === 'completed' : job.status === 'interrupted' && (skippedReason === 'PREPARATION_INTERRUPTED' || (skippedReason.startsWith('PREPARATION_COMPLETION_FAILED:') && world.logs.some((log) => log.kind === 'job' && log.sourceEventId === job.id && log.date === operation.date && log.text.includes(skippedReason.slice('PREPARATION_COMPLETION_FAILED:'.length))))), 'INVALID_JOB_COMPLETION')
    }
  }
  for (const event of run.timeline.pending) validateOperation(event.payload, event.instanceId, false)
  for (const receipt of run.timeline.receipts) validateOperation((JSON.parse(receipt.signature) as { payload: unknown }).payload, receipt.instanceId, true, receipt.skippedReason)
  const occurrences = [...run.timeline.pending, ...run.timeline.receipts]
  for (const anchor of pack.anchors.filter((item) => item.enabled)) requireRule(occurrences.filter((event) => event.instanceId === `anchor:${anchor.id}`).length === 1, 'MISSING_WORLD_SCHEDULE')
  for (const row of pack.calendar) {
    const found = occurrences.filter((event) => event.instanceId === row.occurrenceId)
    requireRule(found.length === 1, 'MISSING_CONTENT_SCHEDULE')
    const occurrence = found[0]
    requireRule(occurrence, 'MISSING_CONTENT_SCHEDULE')
    const payload = 'payload' in occurrence ? occurrence.payload : (JSON.parse(occurrence.signature) as { payload: unknown }).payload
    const operation = worldOperationSchema.parse(payload)
    requireRule(operation.kind === 'open_content_event' && operation.definitionId === row.definitionId && operation.bindingId === row.bindingId && operation.date === row.date && occurrence.phase === 'world_update', 'INVALID_CALENDAR_OCCURRENCE')
  }
  if (run.timeline.pause?.reason === 'CONTENT_DECISION_PENDING') requireRule(world.instances.some((instance) => instance.openedBy === run.timeline.pause?.instanceId && instance.status === 'pending'), 'INVALID_CONTENT_PAUSE')
}
