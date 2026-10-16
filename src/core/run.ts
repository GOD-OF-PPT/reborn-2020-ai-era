import { assertEconomy } from './economy.ts'
import { isoDate } from './calendar.ts'
import { requireRule } from './errors.ts'
import { commandIdentifier, commandIdentity } from './command-identity.ts'
import { hashValue } from './hash.ts'
import { freezeFact, type FactState } from './facts.ts'
import { assertRandom, createRandom, RNG_ALGORITHM } from './random.ts'
import { identifier } from './identity.ts'
import type { CreateRunInput, GameRun, InitialRunState, RuleModel, VersionSet } from './run-types.ts'

export function assertGameRun(run: GameRun): void {
  commandIdentifier(run.runId); commandIdentifier(run.actorId)
  identifier(run.backgroundId)
  requireRule(Number.isSafeInteger(run.revision) && run.revision >= 1, 'INVALID_REVISION')
  requireRule(run.versions.rngAlgorithmVersion === RNG_ALGORITHM, 'UNSUPPORTED_RNG_VERSION')
  assertEconomy(run.economy)
  assertRandom(run.random)
  requireRule(run.timeline.cursor.date === run.economy.asOf, 'CLOCK_ECONOMY_MISMATCH')
  isoDate(run.timeline.cursor.date)
  requireRule(run.timeline.cursor.date >= '2020-01-01' && (run.phase !== 'playing' || run.timeline.cursor.date <= '2025-12-31'), 'DATE_OUTSIDE_CAMPAIGN')
  requireRule(new Set(run.controlledAccountIds).size === run.controlledAccountIds.length && run.controlledAccountIds.includes(run.personalAccountId), 'INVALID_CONTROLLED_ACCOUNTS')
  requireRule(run.economy.ledger.accounts.some((account) => account.id === run.personalAccountId && account.kind === 'personal'), 'INVALID_PERSONAL_ACCOUNT')
  for (const id of run.controlledAccountIds) requireRule(run.economy.ledger.accounts.some((account) => account.id === id && account.kind !== 'external'), 'INVALID_CONTROLLED_ACCOUNTS')
  for (const action of run.economy.actions) requireRule(run.controlledAccountIds.includes(action.definition.accountId), 'UNCONTROLLED_ACTION_ACCOUNT')
  const facts = new Set<string>()
  for (const fact of run.facts) {
    identifier(fact.id); identifier(fact.sourceEventId); isoDate(fact.createdAt)
    requireRule(!facts.has(fact.id) && fact.createdAt <= run.timeline.cursor.date, 'INVALID_FACT_REFERENCE')
    facts.add(fact.id)
    requireRule(Number.isInteger(fact.roll) && fact.roll >= 0 && fact.roll <= 0xffffffff, 'INVALID_FACT_VALUE')
  }
  requireRule(run.receipts.length === run.revision, 'RECEIPT_REVISION_MISMATCH')
  const commands = new Set<string>()
  run.receipts.forEach((receipt, index) => {
    commandIdentifier(receipt.commandId)
    requireRule(!commands.has(receipt.commandId), 'DUPLICATE_COMMAND_RECEIPT')
    commands.add(receipt.commandId)
    requireRule(receipt.runId === run.runId && receipt.actorId === run.actorId && receipt.revisionBefore === index && receipt.revisionAfter === index + 1, 'INVALID_COMMAND_RECEIPT')
  })
  const causes = new Set<string>()
  for (const cause of run.causes) {
    identifier(cause.id); identifier(cause.sourceEventId); isoDate(cause.date)
    requireRule(!causes.has(cause.id) && commands.has(cause.commandId) && cause.date <= run.timeline.cursor.date && cause.parentIds.every((parent) => causes.has(parent)), 'INVALID_CAUSE_REFERENCE')
    causes.add(cause.id)
  }
  for (const receipt of run.receipts) requireRule(receipt.causeIds.every((id) => causes.has(id)), 'INVALID_CAUSE_REFERENCE')
}

export function createGameRun(input: CreateRunInput, initial: InitialRunState, versions: VersionSet): GameRun {
  commandIdentifier(input.runId); commandIdentifier(input.actorId); commandIdentifier(input.commandId)
  let factState: FactState = { random: createRandom(input.seed), facts: [] }
  for (const descriptor of initial.initialFacts ?? []) factState = freezeFact(factState, descriptor)
  const model: RuleModel = { controlledAccountIds: [...initial.controlledAccountIds], phase: 'playing', economy: initial.economy, timeline: initial.timeline, random: factState.random, facts: factState.facts, privateNotes: '' }
  const payload = { backgroundId: input.backgroundId, origin: initial.origin, seed: input.seed, initialStateHash: hashValue(model) }
  const identity = commandIdentity(input.runId, input.actorId, 'CreateRun', payload)
  const date = initial.timeline.cursor.date
  const causeId = `cause:${input.commandId}`
  const run: GameRun = {
    ...model, versions: { ...versions }, runId: input.runId, actorId: input.actorId, personalAccountId: initial.personalAccountId,
    backgroundId: input.backgroundId, origin: initial.origin, seed: input.seed, revision: 1,
    receipts: [{ runId: input.runId, commandId: input.commandId, actorId: input.actorId, kind: 'CreateRun', payloadHash: identity.hash, payloadSignature: identity.signature, revisionBefore: 0, revisionAfter: 1, date, summary: '新人生已建立', transactionIds: initial.economy.ledger.transactions.map((entry) => entry.id), causeIds: [causeId] }],
    causes: [{ id: causeId, commandId: input.commandId, date, domain: 'run', parentIds: [], sourceEventId: `command:${input.commandId}`, visibleSummary: '确认背景与开局义务', visibility: 'visible' }],
  }
  assertGameRun(run)
  return run
}
