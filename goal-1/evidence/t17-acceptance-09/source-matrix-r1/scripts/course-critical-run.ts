import {actionBudget} from '../src/core/economy.ts'
import {quarterOf} from '../src/core/calendar.ts'
import {evaluateCommand} from '../src/core/commands.ts'
import {createCampaignCodec} from '../src/application/campaign.ts'
import type {GameRun} from '../src/core/run-types.ts'
import {assertCourseCashDelta, assertCourseMoney} from '../src/testing/course-shape-assertions.ts'
import {CourseCriticalContext, CourseCriticalHarness, type CourseCriticalDefinition,
 type CriticalAttemptStart, type CriticalAttemptResult} from '../src/testing/course-critical-context.ts'
import {check, commandsOf, equal, putMember, sha, strict, type MemberRef} from './course-critical-evidence.ts'

export interface CriticalAttempt extends CriticalAttemptStart {
 status: 'attempted' | CriticalAttemptResult['status']
 reasonCodes: readonly string[]
 revisionAfter: number | null
 dateAfter: string | null
}
export interface CriticalMilestone {
 readonly name: string
 readonly revision: number
 readonly date: string
 readonly raw: MemberRef
 readonly courseMoney: ReturnType<typeof assertCourseMoney>[]
 readonly quarters: {quarter: string; spent: number; reserved: number; available: number}[]
}
export interface CriticalRunCallbacks {
 readonly before?: (attempt: CriticalAttempt) => void
 readonly after?: (attempt: CriticalAttempt, actualRun: GameRun) => void
 readonly milestone?: (milestone: CriticalMilestone) => void
}
export function criticalMoney(run: GameRun) {
 const courseMoney = (run.course?.cohorts ?? []).map(cohort => assertCourseMoney(run, cohort.id))
 const dates = new Map<string, string>()
 dates.set(quarterOf(run.timeline.cursor.date), run.timeline.cursor.date)
 for (const action of run.economy.actions) dates.set(quarterOf(action.definition.startAt), action.definition.startAt)
 const quarters = [...dates].sort(([a], [b]) => a.localeCompare(b)).map(([quarter, date]) => {
  const budget = actionBudget(run.economy, date)
  check(Number.isSafeInteger(budget.spent) && Number.isSafeInteger(budget.reserved) &&
   budget.spent >= 0 && budget.reserved >= 0 && budget.spent + budget.reserved <= 4 && budget.available >= 0,
  'CRITICAL_ORIGINAL_FOUR_POINT_BUDGET:' + quarter)
  return {quarter, spent: budget.spent, reserved: budget.reserved, available: budget.available}
 })
 check(run.economy.ledger.receipts.filter(receipt => receipt.kind === 'opening_cash').length === 1,
  'CRITICAL_SINGLE_NORMAL_OPENING_CASH_REQUIRED')
 return {courseMoney, quarters}
}

/** Existing accounts use their real before state; a new account is checked from its actual transfer lines. */
export function commandCash(before: GameRun, after: GameRun) {
 const oldAccounts = before.economy.ledger.accounts.filter(account => account.kind !== 'external')
 const existing = oldAccounts.map(account => assertCourseCashDelta(before, after, account.id))
 const oldIds = new Set(before.economy.ledger.accounts.map(account => account.id))
 const appended = after.economy.ledger.transactions.slice(before.economy.ledger.transactions.length)
 const created = after.economy.ledger.accounts.filter(account => !oldIds.has(account.id) && account.kind !== 'external').map(account => {
  const transfers = appended.filter(transaction => transaction.lines.some(line => line.accountId === account.id))
  const amount = transfers.flatMap(transaction => transaction.lines.filter(line => line.accountId === account.id))
   .reduce((total, line) => total + BigInt(line.deltaFen), 0n)
  check(BigInt(account.balanceFen) === amount, 'NEW_CRITICAL_ACCOUNT_CASH_NOT_EXPLAINED_BY_ACTUAL_TRANSFERS')
  return {accountId: account.id, actualOpeningRevision: after.revision, actualOpeningBalanceFen: account.balanceFen, transfers}
 })
 return {existing, created}
}

export function runCriticalBranch(definition: CourseCriticalDefinition, sourceRaw: string,
 callbacks: CriticalRunCallbacks = {}, members = new Map<string, string>()) {
 const codec = createCampaignCodec(), source = codec.import(sourceRaw)
 check(codec.export(source) === sourceRaw && source.origin === 'normal' && source.revision === definition.sourceRevision,
  'EXACT_EARNED_CRITICAL_SOURCE_REQUIRED:' + definition.id)
 const sourceRef = putMember(members, 'source.json', sourceRaw)
 const attempts: CriticalAttempt[] = [], milestones: CriticalMilestone[] = []
 const cash: {sequence: number; proof: ReturnType<typeof commandCash>}[] = []
 const h = new CourseCriticalHarness(source, {
  beforeAttempt(attempt) {
   const recorded: CriticalAttempt = {...attempt, status: 'attempted', reasonCodes: [], revisionAfter: null, dateAfter: null}
   attempts.push(recorded)
   callbacks.before?.(recorded)
  },
  afterAttempt(attempt) {
   const recorded = attempts.at(-1)
   check(recorded?.sequence === attempt.sequence, 'CRITICAL_ATTEMPT_RESULT_WITHOUT_EXACT_START')
   Object.assign(recorded, {status: attempt.status, reasonCodes: [...attempt.reasonCodes],
    revisionAfter: attempt.after.revision, dateAfter: attempt.after.timeline.cursor.date})
   if (attempt.proposedCandidate !== null) putMember(members, 'unexpected-candidate-' + attempt.sequence + '.json', codec.export(attempt.proposedCandidate))
   // Preserve an uncommitted proposal before a fallible external result journal; accounting follows it.
   callbacks.after?.(recorded, attempt.after)
   cash.push({sequence: attempt.sequence, proof: commandCash(attempt.before, attempt.after)})
  },
 })
 const context = new CourseCriticalContext(h, {milestone(name, run) {
  const raw = codec.export(run), reference = putMember(members, 'milestone-' + String(milestones.length + 1).padStart(3, '0') + '.json', raw)
  const proof = criticalMoney(run)
  const milestone: CriticalMilestone = {name, revision: run.revision, date: run.timeline.cursor.date, raw: reference, ...proof}
  milestones.push(milestone)
  callbacks.milestone?.(milestone)
 }})
 let error: string | null = null
 try {
  definition.run(context)
  check(attempts.length > 0, 'CRITICAL_TARGET_WITHOUT_ACTUAL_COMMAND_ATTEMPT')
  check(definition.requiredChecks.every(code => context.observations.some(observation => observation.code === code)),
   'ORIGINAL_CRITICAL_TARGET_CHECK_MISSING:' + definition.id)
  check(attempts.every(attempt => attempt.status === (attempt.expectedRejection ? 'rejected' : 'accepted')),
   'UNFINISHED_OR_UNEXPECTED_CRITICAL_ATTEMPT')
  check(codec.export(context.original) === sourceRaw, 'CRITICAL_SOURCE_MUTATED_BY_BRANCH')
  criticalMoney(h.run)
 } catch (caught) { error = String(caught) }
 const terminalRaw = codec.export(h.run), terminal = putMember(members, error === null ? 'final.json' : 'partial.json', terminalRaw)
 let finalMoney: ReturnType<typeof criticalMoney> | null = null, finalMoneyError: string | null = null
 try { finalMoney = criticalMoney(h.run) } catch (caught) { finalMoneyError = String(caught); error ??= finalMoneyError }
 const fullCommands = commandsOf(h.run), sourceCommands = commandsOf(source), accepted = attempts.filter(attempt => attempt.status === 'accepted')
 const normalized = accepted.map(attempt => ({...attempt.command, payload: codec.registry.normalize(attempt.command.kind, attempt.command.payload)}))
 try {
  equal(fullCommands.slice(0, sourceCommands.length), sourceCommands, 'CRITICAL_REWROTE_NORMAL_SOURCE_COMMANDS')
  equal(fullCommands.slice(sourceCommands.length), normalized, 'CRITICAL_ACCEPTED_COMMANDS_DISAGREE_WITH_ORIGINAL_RECEIPTS')
 } catch (caught) { error ??= String(caught) }
 const record = {caseId: definition.id, sourceRevision: definition.sourceRevision, purpose: definition.purpose,
  requiredChecks: definition.requiredChecks, status: error === null ? 'target_verified' : 'failed', error,
  source: sourceRef, terminal, attempts, observations: context.observations, milestones, commandCash: cash,
  acceptedCommands: accepted.length, rejectedCommands: attempts.filter(attempt => attempt.status === 'rejected').length,
  fullCommands, suffixCommands: fullCommands.slice(sourceCommands.length), finalRevision: h.run.revision,
  finalDate: h.run.timeline.cursor.date, finalMoney, finalMoneyError,
  scope: 'One fixed normal critical branch. The registered target assertions run on public decisions and actual state; complete raw, exact expected rejections and independent accounting are retained. No browser, compatibility or human-playtest result.'}
 return {record, members, run: h.run, raw: terminalRaw}
}

/** Replays actual attempted envelopes separately from the scenario and recomputes every milestone's accounting. */
export function replayCriticalAttempts(record: ReturnType<typeof runCriticalBranch>['record'], members: ReadonlyMap<string, string>) {
 const codec = createCampaignCodec(), sourceRaw = members.get(record.source.member)
 check(sourceRaw !== undefined && sha(sourceRaw) === record.source.sha256, 'CRITICAL_REPLAY_SOURCE_MEMBER_REQUIRED')
 let state = strict(codec.import(sourceRaw), codec)
 const matched = new Set<number>(), seen = new Set<number>()
 const inspect = () => {
  record.milestones.forEach((milestone, index) => {
   if (milestone.revision !== state.run.revision) return
   const raw = members.get(milestone.raw.member)
   check(raw !== undefined && raw === state.raw && Buffer.byteLength(raw) === milestone.raw.bytes && sha(raw) === milestone.raw.sha256,
    'CRITICAL_FULL_MILESTONE_RAW_CHANGED:' + milestone.name)
   equal(criticalMoney(state.run), {courseMoney: milestone.courseMoney, quarters: milestone.quarters}, 'CRITICAL_REPLAY_MILESTONE_ACCOUNTING_CHANGED')
   matched.add(index)
  })
 }
 inspect()
 let accepted = 0, rejected = 0
 for (const attempt of record.attempts) {
  check(attempt.sequence === seen.size + 1 && !seen.has(attempt.sequence), 'CRITICAL_ATTEMPT_SEQUENCE_CHANGED')
  seen.add(attempt.sequence)
  check(attempt.sourceRevision === state.run.revision && attempt.sourceDate === state.run.timeline.cursor.date,
   'CRITICAL_ATTEMPT_SOURCE_IDENTITY_CHANGED')
  const before = state.run, beforeRaw = state.raw
  const result = evaluateCommand(before, attempt.command, codec.registry, before.actorId)
  if (attempt.status === 'rejected') {
   check(result.status === 'rejected', 'CRITICAL_ACTUAL_REJECTION_NOT_REPRODUCED')
   equal(result.reasonCodes, attempt.reasonCodes, 'CRITICAL_ACTUAL_REJECTION_REASON_CHANGED')
   check(codec.export(before) === beforeRaw, 'CRITICAL_REJECTION_CHANGED_COMPLETE_RAW')
   rejected++
  } else if (attempt.status === 'accepted') {
   check(result.status === 'proposed', 'CRITICAL_ACTUAL_ACCEPTANCE_NOT_REPRODUCED')
   state = strict(result.nextRun, codec)
   accepted++
  } else {
   check(record.status === 'failed', 'UNFINISHED_CRITICAL_ATTEMPT_CANNOT_BE_VERIFIED')
   return {status: 'partial-actual-history', accepted, rejected, milestones: matched.size, terminalMatched: false}
  }
  check(attempt.revisionAfter === state.run.revision && attempt.dateAfter === state.run.timeline.cursor.date,
   'CRITICAL_ATTEMPT_RESULT_IDENTITY_CHANGED')
  const cash = record.commandCash.find(row => row.sequence === attempt.sequence)
  check(cash, 'INDEPENDENT_CRITICAL_COMMAND_CASH_PROOF_MISSING')
  equal(commandCash(before, state.run), cash.proof, 'CRITICAL_ACTUAL_COMMAND_CASH_CHANGED')
  inspect()
 }
 const terminal = members.get(record.terminal.member)
 check(terminal !== undefined && terminal === state.raw && sha(terminal) === record.terminal.sha256,
  'CRITICAL_EXACT_TERMINAL_RAW_CHANGED')
 check(matched.size === record.milestones.length && accepted === record.acceptedCommands && rejected === record.rejectedCommands,
  'CRITICAL_ALL_MILESTONES_OR_ACTUAL_COUNTS_CHANGED')
 return {status: 'verified-exact-actual-history', accepted, rejected, milestones: matched.size, terminalMatched: true}
}
