import { isoDate, quarterOf, type IsoDate } from './calendar.ts'
import { requireRule } from './errors.ts'
import { canonicalJson, identifier } from './identity.ts'
import { applyLedger, assertLedger, type LedgerOperation, type LedgerState, type OperationBase } from './ledger.ts'
import { money } from './money.ts'

export interface ActionDefinition {
  readonly id: string
  readonly definitionId: string
  readonly accountId: string
  readonly counterpartyId: string
  readonly businessId?: string
  readonly actionPoints: number
  readonly costFen: number
  readonly cashReservationId: string
  readonly fundingPurpose?: 'ordinary' | 'recovery'
  readonly startAt: IsoDate
  readonly completeAt: IsoDate
  readonly settlementAt: IsoDate
}
export interface ActionRecord {
  readonly definition: ActionDefinition
  readonly status: 'draft' | 'reserved' | 'executed' | 'completed' | 'interrupted' | 'cancelled'
  readonly plannedAt: IsoDate
  readonly executedAt: IsoDate | null
  readonly finishedAt: IsoDate | null
}
type ActionOperation = OperationBase & (
  | { readonly kind: 'reserve_action'; readonly action: ActionDefinition }
  | { readonly kind: 'draft_action'; readonly action: ActionDefinition }
  | { readonly kind: 'execute_action'; readonly actionId: string }
  | { readonly kind: 'complete_action'; readonly actionId: string }
  | { readonly kind: 'cancel_action'; readonly actionId: string }
  | { readonly kind: 'interrupt_action'; readonly actionId: string }
  | { readonly kind: 'reschedule_action'; readonly actionId: string; readonly startAt: IsoDate; readonly completeAt: IsoDate; readonly settlementAt: IsoDate }
)
export type EconomyOperation = LedgerOperation | ActionOperation
export interface EconomyState {
  readonly tailQuarterLock?:'2025-Q4'
  readonly asOf: IsoDate
  readonly ledger: LedgerState
  readonly actions: readonly ActionRecord[]
  readonly receipts: readonly { readonly id: string; readonly signature: string }[]
}

export function createEconomy(ledger: LedgerState): EconomyState {
  assertLedger(ledger)
  return { asOf: ledger.asOf, ledger, actions: [], receipts: ledger.receipts.map(({ id, signature }) => ({ id, signature })) }
}

export function actionBudget(state: EconomyState, date: IsoDate) {
  const locked=state.tailQuarterLock==='2025-Q4'&&date>='2025-10-01'
  const quarter = locked?'2025-Q4':quarterOf(date)
  let spent = 0
  let reserved = 0
  for (const action of state.actions) {
    if (locked?action.definition.startAt<'2025-10-01':quarterOf(action.definition.startAt)!==quarter) continue
    if (action.status === 'reserved') reserved += action.definition.actionPoints
    else if (['executed', 'completed', 'interrupted'].includes(action.status)) spent += action.definition.actionPoints
  }
  if(locked){requireRule(spent<=4,'EPILOGUE_ACTION_BUDGET_EXCEEDED');return {quarter,total:4,spent,reserved,available:Math.max(0,4-spent-reserved),overReserved:Math.max(0,spent+reserved-4)}}
  requireRule(spent + reserved <= 4, 'ACTION_BUDGET_CORRUPT')
  return { quarter, total: 4, spent, reserved, available: 4 - spent - reserved }
}

function validateDefinition(action: ActionDefinition, plannedAt: IsoDate, ledger: LedgerState) {
  identifier(action.id); identifier(action.definitionId); identifier(action.accountId); identifier(action.counterpartyId); identifier(action.cashReservationId)
  if (action.businessId !== undefined) identifier(action.businessId)
  isoDate(action.startAt); isoDate(action.completeAt); isoDate(action.settlementAt); money(action.costFen)
  requireRule(action.startAt >= plannedAt && action.completeAt >= action.startAt && action.settlementAt >= action.completeAt, 'INVALID_ACTION_DATES')
  requireRule(Number.isInteger(action.actionPoints) && action.actionPoints >= 0 && action.actionPoints <= 4, 'INVALID_ACTION_POINTS')
  requireRule(action.fundingPurpose === undefined || action.fundingPurpose === 'ordinary' || action.fundingPurpose === 'recovery', 'INVALID_FUNDING_PURPOSE')
  requireRule(ledger.accounts.some((account) => account.id === action.accountId && account.kind !== 'external'), 'EXPECTED_OWNED_ACCOUNT')
  requireRule(ledger.accounts.some((account) => account.id === action.counterpartyId && account.kind === 'external'), 'EXPECTED_EXTERNAL_COUNTERPARTY')
}

function cloneEconomy(state: EconomyState) {
  return { ...state, actions: state.actions.map((action) => ({ ...action, definition: { ...action.definition } })), receipts: [...state.receipts] }
}

function fundingFor(state: EconomyState, action: ActionDefinition) {
  const reservation = state.ledger.reservations.find((item) => item.id === action.cashReservationId)
  requireRule(reservation && reservation.accountId === action.accountId && reservation.kind === 'plan' && reservation.originId === action.id && reservation.status === 'active' && reservation.amountFen === action.costFen, 'ACTION_RESERVATION_CHANGED')
  return reservation
}

export function assertEconomy(state: EconomyState): void {
  isoDate(state.asOf)
  requireRule(state.tailQuarterLock===undefined||state.tailQuarterLock==='2025-Q4'&&state.asOf>='2025-12-31','INVALID_EPILOGUE_BUDGET_LOCK')
  assertLedger(state.ledger)
  requireRule(state.ledger.asOf <= state.asOf, 'LEDGER_AHEAD_OF_ECONOMY')
  const ids = new Set<string>()
  const quarters = new Map<string, IsoDate>()
  for (const action of state.actions) {
    validateDefinition(action.definition, action.plannedAt, state.ledger)
    isoDate(action.plannedAt)
    requireRule(action.plannedAt <= state.asOf, 'ACTION_IN_FUTURE')
    requireRule(!ids.has(action.definition.id), 'ACTION_ID_REUSED')
    ids.add(action.definition.id)
    quarters.set(quarterOf(action.definition.startAt), action.definition.startAt)
    const executed = action.status === 'executed' || action.status === 'completed' || action.status === 'interrupted'
    requireRule(executed || action.status === 'draft' || action.status === 'reserved' || action.status === 'cancelled', 'INVALID_ACTION_STATUS')
    requireRule(executed ? action.executedAt === action.definition.startAt : action.executedAt === null, 'INVALID_ACTION_EXECUTION_DATE')
    if (action.executedAt !== null) requireRule(action.executedAt <= state.asOf, 'ACTION_IN_FUTURE')
    if (action.status === 'reserved' && action.definition.costFen > 0) fundingFor(state, action.definition)
    if (action.status === 'completed' || action.status === 'interrupted' || action.status === 'cancelled') {
      requireRule(action.finishedAt !== null, 'INVALID_ACTION_FINISH_DATE')
      isoDate(action.finishedAt)
      requireRule(action.finishedAt >= (action.executedAt ?? action.plannedAt) && action.finishedAt <= state.asOf, 'INVALID_ACTION_FINISH_DATE')
      if (action.status === 'completed') requireRule(action.finishedAt >= action.definition.completeAt, 'ACTION_NOT_COMPLETE_YET')
    } else requireRule(action.finishedAt === null, 'INVALID_ACTION_FINISH_DATE')
  }
  for (const date of quarters.values()) actionBudget(state, date)
  const receiptIds = new Set<string>()
  for (const receipt of state.receipts) {
    identifier(receipt.id)
    requireRule(!receiptIds.has(receipt.id), 'DUPLICATE_ECONOMY_RECEIPT')
    receiptIds.add(receipt.id)
  }
}

export function applyEconomy(state: EconomyState, operation: EconomyOperation): EconomyState {
  identifier(operation.id); identifier(operation.sourceEventId); isoDate(operation.date)
  assertEconomy(state)
  const signature = canonicalJson(operation)
  const previous = state.receipts.find((receipt) => receipt.id === operation.id)
  if (previous) {
    requireRule(previous.signature === signature, 'OPERATION_ID_REUSED')
    return state
  }
  requireRule(operation.date >= state.asOf, 'BACKDATED_ECONOMY_OPERATION')
  const next = cloneEconomy(state)
  switch (operation.kind) {
    case 'draft_action':
      validateDefinition(operation.action, operation.date, next.ledger)
      requireRule(!next.actions.some((item) => item.definition.id === operation.action.id), 'ACTION_ID_REUSED')
      next.actions.push({ definition: { ...operation.action }, status: 'draft', plannedAt: operation.date, executedAt: null, finishedAt: null })
      break
    case 'reserve_action': {
      validateDefinition(operation.action, operation.date, next.ledger)
      const draft = next.actions.find((item) => item.definition.id === operation.action.id)
      requireRule(!draft || (draft.status === 'draft' && canonicalJson(draft.definition) === canonicalJson(operation.action)), 'ACTION_ID_REUSED')
      requireRule(actionBudget(next, operation.action.startAt).available >= operation.action.actionPoints, 'INSUFFICIENT_ACTION_POINTS')
      const definition = { ...operation.action }
      if (definition.costFen > 0) next.ledger = applyLedger(next.ledger, {
        id: `${operation.id}:funds`, date: operation.date, sourceEventId: operation.sourceEventId,
        kind: 'reserve_cash', accountId: definition.accountId, reservationId: definition.cashReservationId,
        bucket: 'plan', originId: definition.id, amountFen: definition.costFen,
        ...(definition.fundingPurpose === undefined ? {} : { fundingPurpose: definition.fundingPurpose }),
      })
      if (draft) draft.status = 'reserved'
      else next.actions.push({ definition, status: 'reserved', plannedAt: operation.date, executedAt: null, finishedAt: null })
      break
    }
    case 'execute_action': {
      const action = next.actions.find((item) => item.definition.id === operation.actionId)
      requireRule(action && action.status === 'reserved', 'ACTION_NOT_RESERVED')
      requireRule(operation.date === action.definition.startAt, 'ACTION_START_DATE_MISMATCH')
      if(next.tailQuarterLock&&action.definition.startAt>='2025-10-01')requireRule(actionBudget(next,operation.date).spent+action.definition.actionPoints<=4,'EPILOGUE_ACTION_BUDGET_EXCEEDED')
      if (action.definition.costFen > 0) {
        fundingFor(next, action.definition)
        next.ledger = applyLedger(next.ledger, {
          id: `${operation.id}:cost`, date: operation.date, sourceEventId: operation.sourceEventId,
          kind: 'expense', accountId: action.definition.accountId, counterpartyId: action.definition.counterpartyId,
          referenceId: action.definition.id,
          ...(action.definition.businessId === undefined ? {} : { businessId: action.definition.businessId }),
          reservationId: action.definition.cashReservationId, originId: action.definition.id, amountFen: action.definition.costFen,
          ...(action.definition.fundingPurpose === undefined ? {} : { fundingPurpose: action.definition.fundingPurpose }),
        })
      }
      action.status = 'executed'
      action.executedAt = operation.date
      break
    }
    case 'complete_action': {
      const action = next.actions.find((item) => item.definition.id === operation.actionId)
      requireRule(action && action.status === 'executed', 'ACTION_NOT_EXECUTED')
      requireRule(operation.date >= action.definition.completeAt, 'ACTION_NOT_COMPLETE_YET')
      action.status = 'completed'
      action.finishedAt = operation.date
      break
    }
    case 'cancel_action': {
      const action = next.actions.find((item) => item.definition.id === operation.actionId)
      requireRule(action && (action.status === 'draft' || action.status === 'reserved'), 'ACTION_CANNOT_BE_CANCELLED')
      if (action.status === 'reserved' && action.definition.costFen > 0) {
        fundingFor(next, action.definition)
        next.ledger = applyLedger(next.ledger, { id: `${operation.id}:release`, date: operation.date, sourceEventId: operation.sourceEventId, kind: 'release_reservation', accountId: action.definition.accountId, reservationId: action.definition.cashReservationId })
      }
      action.status = 'cancelled'
      action.finishedAt = operation.date
      break
    }
    case 'interrupt_action': {
      const action = next.actions.find((item) => item.definition.id === operation.actionId)
      requireRule(action && action.status === 'executed', 'ACTION_NOT_EXECUTED')
      action.status = 'interrupted'
      action.finishedAt = operation.date
      break
    }
    case 'reschedule_action': {
      const action = next.actions.find((item) => item.definition.id === operation.actionId)
      requireRule(action && (action.status === 'draft' || action.status === 'reserved'), 'ACTION_CANNOT_BE_RESCHEDULED')
      const definition = { ...action.definition, startAt: operation.startAt, completeAt: operation.completeAt, settlementAt: operation.settlementAt }
      validateDefinition(definition, operation.date, next.ledger)
      if (action.status === 'reserved' && actionBudget(next,definition.startAt).quarter !== actionBudget(next,action.definition.startAt).quarter) requireRule(actionBudget(next, definition.startAt).available >= definition.actionPoints, 'INSUFFICIENT_ACTION_POINTS')
      action.definition = definition
      break
    }
    default:
      next.ledger = applyLedger(next.ledger, operation)
  }
  next.asOf = operation.date
  next.receipts.push({ id: operation.id, signature })
  assertEconomy(next)
  return next
}
