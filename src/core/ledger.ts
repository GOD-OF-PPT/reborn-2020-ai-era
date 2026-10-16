import { isoDate, type IsoDate } from './calendar.ts'
import { requireRule, RuleError } from './errors.ts'
import { canonicalJson, identifier } from './identity.ts'
import { cumulativeFee, money, signedMoney, sumMoney } from './money.ts'

export interface AccountDefinition {
  readonly id: string
  readonly kind: 'personal' | 'business' | 'external'
}
export interface CashAccount extends AccountDefinition { readonly balanceFen: number }
export interface OperationBase {
  readonly id: string
  readonly date: IsoDate
  readonly sourceEventId: string
  readonly businessId?: string
  readonly contractId?: string
  readonly referenceId?: string
}
type CashOperation = OperationBase & {
  readonly kind: 'opening_cash' | 'income'
  readonly accountId: string
  readonly counterpartyId: string
  readonly amountFen: number
}
type ExpenseOperation = OperationBase & {
  readonly kind: 'expense'
  readonly accountId: string
  readonly counterpartyId: string
  readonly amountFen: number
  readonly reservationId?: string
  readonly originId?: string
  readonly fundingPurpose?: 'ordinary' | 'recovery'
}
type ReservationOperation = OperationBase & { readonly accountId: string } & (
  | { readonly kind: 'reserve_cash'; readonly reservationId: string; readonly bucket: 'plan' | 'order' | 'frozen'; readonly originId: string; readonly amountFen: number; readonly fundingPurpose?: 'ordinary' | 'recovery' }
  | { readonly kind: 'move_reservation'; readonly reservationId: string; readonly newOriginId: string }
  | { readonly kind: 'release_reservation'; readonly reservationId: string; readonly amountFen?: number }
)
type ContractOperation = OperationBase & { readonly accountId: string; readonly businessId: string; readonly contractId: string; readonly amountFen: number } & (
  | { readonly kind: 'receive_prepayment'; readonly counterpartyId: string; readonly reservationId: string }
  | { readonly kind: 'deliver_prepaid' }
  | { readonly kind: 'deliver_on_credit'; readonly counterpartyId: string }
  | { readonly kind: 'collect_receivable' }
  | { readonly kind: 'refund_undelivered'; readonly obligationId: string; readonly referenceId: string }
  | { readonly kind: 'refund_delivered'; readonly settlement: 'cash'; readonly obligationId: string; readonly reservationId: string; readonly referenceId: string }
  | { readonly kind: 'refund_delivered'; readonly settlement: 'receivable'; readonly referenceId: string }
)
type PayObligationOperation = OperationBase & { readonly kind: 'pay_obligation'; readonly accountId: string; readonly obligationId: string; readonly amountFen: number }
type DueExpenseOperation = OperationBase & { readonly kind: 'due_expense'; readonly accountId: string; readonly counterpartyId: string; readonly obligationId: string; readonly amountFen: number }
type SupplierOperation = OperationBase & { readonly accountId: string; readonly businessId: string; readonly prepaymentId: string; readonly amountFen: number } & (
  | { readonly kind: 'supplier_prepay'; readonly counterpartyId: string }
  | { readonly kind: 'consume_supplier' }
)
type InvestmentOperation = OperationBase & { readonly accountId: string; readonly investmentId: string } & (
  | { readonly kind: 'capital_injection'; readonly targetAccountId: string; readonly assetId: string; readonly classification: InvestmentPosition['classification']; readonly amountFen: number }
  | { readonly kind: 'acquire_asset'; readonly counterpartyId: string; readonly assetId: string; readonly classification: InvestmentPosition['classification']; readonly amountFen: number }
  | { readonly kind: 'value_asset'; readonly valueFen: number }
)
type FeeOperation = OperationBase & { readonly kind: 'charge_fee'; readonly accountId: string; readonly counterpartyId: string; readonly feeId: string; readonly addedBaseFen: number; readonly basisPoints: number }
type OperatingLedgerOperation = OperationBase & ({ readonly kind: 'open_business_account'; readonly accountId: string } | { readonly kind: 'owner_transfer'; readonly accountId: string; readonly targetAccountId: string; readonly amountFen: number; readonly fundingPurpose?: 'ordinary' | 'recovery' } | { readonly kind: 'borrow_cash'; readonly accountId: string; readonly counterpartyId: string; readonly amountFen: number; readonly obligationId: string; readonly dueAt: string })
type TradingLedgerOperation=OperationBase&{readonly accountId:string;readonly counterpartyId:string}&({readonly kind:'trade_buy';readonly investmentId:string;readonly assetId:string;readonly reservationId:string;readonly originId:string;readonly principalFen:number;readonly feeFen:number;readonly valueFen:number}|{readonly kind:'trade_sell';readonly investmentId:string;readonly removedPrincipalFen:number;readonly grossFen:number;readonly feeFen:number;readonly valueFen:number;readonly receivableId:string|null;readonly dueAt:string}|{readonly kind:'record_market_income';readonly receivableId:string;readonly amountFen:number;readonly dueAt:string;readonly incomeKind:'dividend'}|{readonly kind:'settle_market_receivable';readonly receivableId:string;readonly amountFen:number})
export type LedgerOperation = CashOperation | ExpenseOperation | ReservationOperation | ContractOperation | PayObligationOperation | DueExpenseOperation | SupplierOperation | InvestmentOperation | FeeOperation | OperatingLedgerOperation | TradingLedgerOperation
export interface MarketReceivable {readonly id:string;readonly accountId:string;readonly counterpartyId:string;readonly sourceEventId:string;readonly originOperationId:string;readonly date:string;readonly dueAt:string;readonly amountFen:number;readonly remainingFen:number;readonly kind:'sale'|'dividend'}
export interface FeeAccrual {
  readonly id: string
  readonly accountId: string
  readonly counterpartyId: string
  readonly businessId: string | null
  readonly basisPoints: number
  readonly totalBaseFen: number
  readonly paidFen: number
}
export interface InvestmentPosition {
  readonly id: string
  readonly accountId: string
  readonly assetId: string
  readonly subjectAccountId: string | null
  readonly classification: 'historical' | 'simulation' | 'fictional' | 'counterfactual'
  readonly bookCostFen: number
  readonly valueFen: number
}
export interface SupplierPrepayment {
  readonly id: string
  readonly accountId: string
  readonly businessId: string
  readonly counterpartyId: string
  readonly paidFen: number
  readonly remainingFen: number
}
export interface Payable {
  readonly id: string
  readonly accountId: string
  readonly businessId: string | null
  readonly contractId: string | null
  readonly counterpartyId: string
  readonly date: IsoDate
  readonly sourceEventId: string
  readonly originOperationId: string
  readonly kind: 'expense' | 'refund_undelivered' | 'refund_delivered' | 'loan_principal'
  readonly amountFen: number
  readonly remainingFen: number
  readonly protectionReservationId: string | null
}
export interface RevenueBalance {
  readonly id: string
  readonly accountId: string
  readonly businessId: string
  readonly counterpartyId: string
  readonly protectionReservationId: string | null
  readonly prepaidFen: number
  readonly receivableFen: number
  readonly recognizedIncomeFen: number
}
export interface CashReservation {
  readonly id: string
  readonly accountId: string
  readonly kind: 'plan' | 'order' | 'frozen' | 'customer_protection'
  readonly originId: string
  readonly amountFen: number
  readonly status: 'active' | 'released'
}
export interface CashTransaction {
  readonly id: string
  readonly date: IsoDate
  readonly sourceEventId: string
  readonly businessId: string | null
  readonly contractId: string | null
  readonly referenceId: string | null
  readonly lines: readonly { readonly accountId: string; readonly deltaFen: number }[]
}
export interface MetricEntry {
  readonly operationId: string
  readonly sourceEventId: string
  readonly contractId: string | null
  readonly referenceId: string | null
  readonly date: IsoDate
  readonly accountId: string
  readonly businessId: string | null
  readonly kind: 'income' | 'cost'
  readonly deltaFen: number
}
export interface LedgerReceipt {
  readonly id: string
  readonly signature: string
  readonly status: 'applied' | 'due'
  readonly kind: LedgerOperation['kind']
  readonly accountId: string
  readonly contractId: string | null
}
export interface LedgerState {
  readonly asOf: IsoDate
  readonly accounts: readonly CashAccount[]
  readonly transactions: readonly CashTransaction[]
  readonly metrics: readonly MetricEntry[]
  readonly receipts: readonly LedgerReceipt[]
  readonly openingPosted: readonly string[]
  readonly reservations: readonly CashReservation[]
  readonly contracts: readonly RevenueBalance[]
  readonly obligations: readonly Payable[]
  readonly supplierPrepayments: readonly SupplierPrepayment[]
  readonly investments: readonly InvestmentPosition[]
  readonly fees: readonly FeeAccrual[]
  readonly marketReceivables:readonly MarketReceivable[]
}

export function createLedger(accounts: readonly AccountDefinition[], date: IsoDate): LedgerState {
  isoDate(date)
  const ids = new Set<string>()
  for (const account of accounts) {
    identifier(account.id)
    requireRule(!ids.has(account.id), 'DUPLICATE_ACCOUNT')
    requireRule(['personal', 'business', 'external'].includes(account.kind), 'INVALID_ACCOUNT_KIND')
    ids.add(account.id)
  }
  return { asOf: date, accounts: accounts.map((account) => ({ ...account, balanceFen: 0 })), transactions: [], metrics: [], receipts: [], openingPosted: [], reservations: [], contracts: [], obligations: [], supplierPrepayments: [], investments: [], fees: [],marketReceivables:[] }
}

function cloneLedger(state: LedgerState) {
  return {
    ...state,
    accounts: state.accounts.map((account) => ({ ...account })),
    transactions: [...state.transactions], metrics: [...state.metrics],
    receipts: [...state.receipts], openingPosted: [...state.openingPosted],
    reservations: state.reservations.map((reservation) => ({ ...reservation })),
    contracts: state.contracts.map((contract) => ({ ...contract })),
    obligations: state.obligations.map((obligation) => ({ ...obligation })),
    supplierPrepayments: state.supplierPrepayments.map((prepayment) => ({ ...prepayment })),
    investments: state.investments.map((investment) => ({ ...investment })),
    fees: state.fees.map((fee) => ({ ...fee })),
    marketReceivables:state.marketReceivables.map(r=>({...r})),
  }
}
type WorkingLedger = ReturnType<typeof cloneLedger>

function findAccount(state: LedgerState, id: string): CashAccount {
  const account = state.accounts.find((candidate) => candidate.id === id)
  requireRule(account, 'ACCOUNT_NOT_FOUND')
  return account
}

export function accountFunds(state: LedgerState, accountId: string) {
  const account = findAccount(state, accountId)
  requireRule(account.kind !== 'external', 'EXTERNAL_IS_NOT_PLAYER_CASH')
  const active = state.reservations.filter((reservation) => reservation.accountId === accountId && reservation.status === 'active')
  const heldFen = sumMoney(active.map((reservation) => reservation.amountFen))
  const protectionRequiredFen = sumMoney(active.filter((reservation) => reservation.kind === 'customer_protection' || reservation.kind === 'frozen').map((reservation) => reservation.amountFen))
  return {
    cashFen: account.balanceFen, heldFen, availableFen: Math.max(0, account.balanceFen - heldFen),
    protectionRequiredFen, protectionShortfallFen: Math.max(0, protectionRequiredFen - account.balanceFen),
    commitmentShortfallFen: Math.max(0, heldFen - account.balanceFen),
  }
}

export function metricsFor(state: LedgerState, accountId: string, businessId?: string, from?: IsoDate, to?: IsoDate) {
  findAccount(state, accountId)
  if (from !== undefined) isoDate(from)
  if (to !== undefined) isoDate(to)
  requireRule(from === undefined || to === undefined || from <= to, 'INVALID_DATE_RANGE')
  const entries = state.metrics.filter((entry) => entry.accountId === accountId && (businessId === undefined || entry.businessId === businessId) && (from === undefined || entry.date >= from) && (to === undefined || entry.date <= to))
  const incomeFen = sumMoney(entries.filter((entry) => entry.kind === 'income').map((entry) => entry.deltaFen), true)
  const costFen = sumMoney(entries.filter((entry) => entry.kind === 'cost').map((entry) => entry.deltaFen), true)
  return { incomeFen, costFen, profitFen: sumMoney([incomeFen, -costFen], true) }
}

export function contractBalance(state: LedgerState, contractId: string): RevenueBalance {
  const contract = state.contracts.find((item) => item.id === contractId)
  requireRule(contract, 'CONTRACT_BALANCE_NOT_FOUND')
  return { ...contract }
}

export function accountPosition(state: LedgerState, accountId: string) {
  const funds = accountFunds(state, accountId)
  const contracts = state.contracts.filter((item) => item.accountId === accountId)
  const receivableFen = sumMoney([...contracts.map((item) => item.receivableFen),...state.marketReceivables.filter(r=>r.accountId===accountId).map(r=>r.remainingFen)])
  const prepaidLiabilityFen = sumMoney(contracts.map((item) => item.prepaidFen))
  const payableFen = sumMoney(state.obligations.filter((item) => item.accountId === accountId).map((item) => item.remainingFen))
  const supplierPrepaidFen = sumMoney(state.supplierPrepayments.filter((item) => item.accountId === accountId).map((item) => item.remainingFen))
  const investmentValueFen = sumMoney(state.investments.filter((item) => item.accountId === accountId).map((item) => item.valueFen))
  return { ...funds, receivableFen, prepaidLiabilityFen, payableFen, supplierPrepaidFen, investmentValueFen, netAssetsFen: sumMoney([funds.cashFen, receivableFen, supplierPrepaidFen, investmentValueFen, -prepaidLiabilityFen, -payableFen], true) }
}

function paymentCapacity(state: LedgerState, accountId: string, reservationId: string | null = null) {
  const funds = accountFunds(state, accountId)
  const own = reservationId === null ? 0 : state.reservations.find((item) => item.id === reservationId && item.accountId === accountId)?.amountFen
  requireRule(own !== undefined, 'RESERVATION_NOT_FOUND')
  return Math.max(0, funds.cashFen - (funds.heldFen - own))
}

function cashTransfer(state: WorkingLedger, operation: OperationBase, fromId: string, toId: string, amountFen: number, reservationId: string | null = null) {
  money(amountFen)
  requireRule(fromId !== toId, 'SAME_ACCOUNT_TRANSFER')
  const from = state.accounts.find((account) => account.id === fromId)
  const to = state.accounts.find((account) => account.id === toId)
  requireRule(from && to, 'ACCOUNT_NOT_FOUND')
  if (from.kind !== 'external') requireRule(paymentCapacity(state, from.id, reservationId) >= amountFen, 'INSUFFICIENT_AVAILABLE_FUNDS')
  from.balanceFen = signedMoney(from.balanceFen - amountFen)
  to.balanceFen = signedMoney(to.balanceFen + amountFen)
  if (amountFen > 0) state.transactions.push({
    id: operation.id, date: operation.date, sourceEventId: operation.sourceEventId,
    businessId: operation.businessId ?? null, contractId: operation.contractId ?? null, referenceId: operation.referenceId ?? null,
    lines: [{ accountId: from.id, deltaFen: -amountFen }, { accountId: to.id, deltaFen: amountFen }],
  })
}

function metric(state: WorkingLedger, operation: OperationBase, accountId: string, kind: 'income' | 'cost', deltaFen: number) {
  signedMoney(deltaFen)
  const contractId = operation.contractId ?? null
  if (deltaFen !== 0) state.metrics.push({ operationId: operation.id, sourceEventId: operation.sourceEventId, contractId, referenceId: operation.referenceId ?? contractId, date: operation.date, accountId, businessId: operation.businessId ?? null, kind, deltaFen })
}

function reservationFor(state: WorkingLedger, accountId: string, reservationId: string) {
  const reservation = state.reservations.find((item) => item.id === reservationId)
  requireRule(reservation && reservation.accountId === accountId, 'RESERVATION_NOT_FOUND')
  requireRule(reservation.status === 'active', 'RESERVATION_RELEASED')
  return reservation
}

function reduceReservation(reservation: WorkingLedger['reservations'][number], amountFen: number) {
  money(amountFen)
  requireRule(amountFen > 0 && amountFen <= reservation.amountFen, 'INVALID_RESERVATION_AMOUNT')
  reservation.amountFen -= amountFen
  if (reservation.amountFen === 0) reservation.status = 'released'
}

function revenueFor(state: WorkingLedger, operation: { readonly contractId: string; readonly accountId: string; readonly businessId: string }) {
  const contract = state.contracts.find((item) => item.id === operation.contractId)
  requireRule(contract && contract.accountId === operation.accountId && contract.businessId === operation.businessId, 'CONTRACT_BALANCE_NOT_FOUND')
  return contract
}

function receivePrepayment(state: WorkingLedger, operation: Extract<LedgerOperation, { kind: 'receive_prepayment' }>) {
  identifier(operation.contractId); identifier(operation.reservationId)
  requireRule(operation.amountFen > 0, 'INVALID_CONTRACT_AMOUNT')
  let contract = state.contracts.find((item) => item.id === operation.contractId)
  if (!contract) {
    contract = { id: operation.contractId, accountId: operation.accountId, businessId: operation.businessId, counterpartyId: operation.counterpartyId, protectionReservationId: null, prepaidFen: 0, receivableFen: 0, recognizedIncomeFen: 0 }
    state.contracts.push(contract)
  }
  requireRule(contract.accountId === operation.accountId && contract.businessId === operation.businessId && contract.counterpartyId === operation.counterpartyId, 'CONTRACT_BINDING_MISMATCH')
  requireRule(contract.protectionReservationId === null || contract.protectionReservationId === operation.reservationId, 'PROTECTION_REFERENCE_CHANGED')
  cashTransfer(state, operation, operation.counterpartyId, operation.accountId, operation.amountFen)
  let reservation = state.reservations.find((item) => item.id === operation.reservationId)
  if (reservation) {
    requireRule(reservation.kind === 'customer_protection' && reservation.originId === contract.id && reservation.accountId === contract.accountId, 'RESERVATION_ID_REUSED')
    reservation.amountFen = sumMoney([reservation.amountFen, operation.amountFen])
    reservation.status = 'active'
  } else {
    reservation = { id: operation.reservationId, accountId: operation.accountId, kind: 'customer_protection', originId: contract.id, amountFen: operation.amountFen, status: 'active' }
    state.reservations.push(reservation)
  }
  contract.protectionReservationId = reservation.id
  contract.prepaidFen = sumMoney([contract.prepaidFen, operation.amountFen])
}

function createPayable(state: WorkingLedger, operation: OperationBase & { readonly obligationId: string; readonly accountId: string; readonly amountFen: number }, kind: Payable['kind'], counterpartyId: string, contractId: string | null, protectionReservationId: string | null) {
  identifier(operation.obligationId)
  requireRule(operation.amountFen > 0, 'INVALID_OBLIGATION_AMOUNT')
  requireRule(!state.obligations.some((item) => item.id === operation.obligationId), 'OBLIGATION_ID_REUSED')
  if (contractId !== null) requireRule(state.contracts.some((contract) => contract.id === contractId && contract.accountId === operation.accountId && (operation.businessId === undefined || operation.businessId === contract.businessId)), 'INVALID_OBLIGATION_BINDING')
  const payable = { id: operation.obligationId, accountId: operation.accountId, businessId: operation.businessId ?? null, contractId, counterpartyId, date: operation.date, sourceEventId: operation.sourceEventId, originOperationId: operation.id, kind, amountFen: operation.amountFen, remainingFen: operation.amountFen, protectionReservationId }
  state.obligations.push(payable)
  return payable
}

function payObligation(state: WorkingLedger, operation: OperationBase, payable: WorkingLedger['obligations'][number], amountFen: number) {
  requireRule(amountFen > 0 && amountFen <= payable.remainingFen, 'INVALID_OBLIGATION_AMOUNT')
  const payment = { ...operation, referenceId: payable.id, ...(payable.contractId === null ? {} : { contractId: payable.contractId }), ...(payable.businessId === null ? {} : { businessId: payable.businessId }) }
  cashTransfer(state, payment, payable.accountId, payable.counterpartyId, amountFen, payable.protectionReservationId)
  if (payable.protectionReservationId !== null) reduceReservation(reservationFor(state, payable.accountId, payable.protectionReservationId), amountFen)
  payable.remainingFen -= amountFen
}

function requireRefundSource(state: LedgerState, operation: OperationBase & { readonly accountId: string; readonly contractId: string }, kinds: readonly LedgerOperation['kind'][]) {
  const source = state.receipts.find((receipt) => receipt.id === operation.referenceId)
  requireRule(source && source.accountId === operation.accountId && source.contractId === operation.contractId && kinds.includes(source.kind), 'INVALID_REFUND_REFERENCE')
}

function requireNoOverdue(state: LedgerState, accountId: string, date: IsoDate) {
  requireRule(!state.obligations.some((item) => item.accountId === accountId && item.date <= date && item.remainingFen > 0), 'OVERDUE_OBLIGATION')
}

function requireSpendingPermission(state: LedgerState, accountId: string, date: IsoDate, fundingPurpose: 'ordinary' | 'recovery' | undefined) {
  requireRule(fundingPurpose === undefined || fundingPurpose === 'ordinary' || fundingPurpose === 'recovery', 'INVALID_FUNDING_PURPOSE')
  if (fundingPurpose !== 'recovery') requireNoOverdue(state, accountId, date)
}

function addInvestment(state: WorkingLedger, operation: OperationBase & { readonly accountId: string; readonly investmentId: string; readonly assetId: string; readonly classification: InvestmentPosition['classification']; readonly amountFen: number }, subjectAccountId: string | null) {
  identifier(operation.investmentId); identifier(operation.assetId)
  requireRule(['historical', 'simulation', 'fictional', 'counterfactual'].includes(operation.classification), 'INVALID_CLASSIFICATION')
  const investment = state.investments.find((item) => item.id === operation.investmentId)
  if (investment) {
    requireRule(investment.accountId === operation.accountId && investment.assetId === operation.assetId && investment.subjectAccountId === subjectAccountId && investment.classification === operation.classification, 'INVESTMENT_BINDING_MISMATCH')
    investment.bookCostFen = sumMoney([investment.bookCostFen, operation.amountFen])
    investment.valueFen = sumMoney([investment.valueFen, operation.amountFen])
  } else state.investments.push({ id: operation.investmentId, accountId: operation.accountId, assetId: operation.assetId, subjectAccountId, classification: operation.classification, bookCostFen: operation.amountFen, valueFen: operation.amountFen })
}

export function assertLedger(state: LedgerState): void {
  isoDate(state.asOf)
  const balances = new Map(state.accounts.map((account) => [account.id, 0n]))
  requireRule(balances.size === state.accounts.length, 'DUPLICATE_ACCOUNT')
  const transactionIds = new Set<string>()
  for (const entry of state.transactions) {
    identifier(entry.id); identifier(entry.sourceEventId); isoDate(entry.date)
    requireRule(entry.date <= state.asOf, 'FUTURE_LEDGER_ENTRY')
    if (entry.businessId !== null) identifier(entry.businessId)
    if (entry.contractId !== null) identifier(entry.contractId)
    if (entry.referenceId !== null) identifier(entry.referenceId)
    requireRule(!transactionIds.has(entry.id), 'DUPLICATE_TRANSACTION')
    transactionIds.add(entry.id)
    let total = 0n
    for (const line of entry.lines) {
      signedMoney(line.deltaFen)
      requireRule(balances.has(line.accountId), 'ACCOUNT_NOT_FOUND')
      total += BigInt(line.deltaFen)
      balances.set(line.accountId, (balances.get(line.accountId) ?? 0n) + BigInt(line.deltaFen))
    }
    requireRule(total === 0n, 'UNBALANCED_TRANSACTION')
  }
  for (const account of state.accounts) {
    signedMoney(account.balanceFen)
    requireRule(BigInt(account.balanceFen) === balances.get(account.id), 'BALANCE_MISMATCH')
    requireRule(account.kind === 'external' || account.balanceFen >= 0, 'NEGATIVE_PLAYER_CASH')
  }
  const reservationIds = new Set<string>()
  for (const reservation of state.reservations) {
    identifier(reservation.id); identifier(reservation.originId); money(reservation.amountFen)
    requireRule(!reservationIds.has(reservation.id), 'RESERVATION_ID_REUSED')
    reservationIds.add(reservation.id)
    requireRule(findAccount(state, reservation.accountId).kind !== 'external', 'EXPECTED_OWNED_ACCOUNT')
    requireRule(reservation.status === 'active' ? reservation.amountFen > 0 : reservation.status === 'released' && reservation.amountFen === 0, 'INVALID_RESERVATION_STATE')
  }
  for (const account of state.accounts) if (account.kind !== 'external') accountFunds(state, account.id)
  const contractIds = new Set<string>()
  for (const contract of state.contracts) {
    identifier(contract.id); identifier(contract.businessId)
    requireRule(!contractIds.has(contract.id), 'DUPLICATE_CONTRACT_BALANCE')
    contractIds.add(contract.id)
    money(contract.prepaidFen); money(contract.receivableFen); money(contract.recognizedIncomeFen)
    requireRule(findAccount(state, contract.accountId).kind !== 'external' && findAccount(state, contract.counterpartyId).kind === 'external', 'CONTRACT_BINDING_MISMATCH')
    requireRule(contract.receivableFen <= contract.recognizedIncomeFen, 'RECEIVABLE_EXCEEDS_INCOME')
    const recognized = sumMoney(state.metrics.filter((entry) => entry.contractId === contract.id && entry.kind === 'income').map((entry) => entry.deltaFen), true)
    requireRule(recognized === contract.recognizedIncomeFen, 'RECOGNIZED_INCOME_MISMATCH')
    if (contract.protectionReservationId !== null) {
      const reservation = state.reservations.find((item) => item.id === contract.protectionReservationId)
      const refundsDue = sumMoney(state.obligations.filter((item) => item.contractId === contract.id && item.kind === 'refund_undelivered').map((item) => item.remainingFen))
      requireRule(reservation && reservation.kind === 'customer_protection' && reservation.accountId === contract.accountId && reservation.originId === contract.id && reservation.amountFen === sumMoney([contract.prepaidFen, refundsDue]), 'PROTECTION_MISMATCH')
    } else requireRule(contract.prepaidFen === 0, 'PROTECTION_MISMATCH')
  }
  const obligationIds = new Set<string>()
  for (const obligation of state.obligations) {
    identifier(obligation.id); identifier(obligation.originOperationId); identifier(obligation.sourceEventId); isoDate(obligation.date)
    requireRule(!obligationIds.has(obligation.id), 'OBLIGATION_ID_REUSED')
    obligationIds.add(obligation.id)
    money(obligation.amountFen); money(obligation.remainingFen)
    requireRule(obligation.remainingFen <= obligation.amountFen, 'INVALID_OBLIGATION_AMOUNT')
    requireRule(findAccount(state, obligation.accountId).kind !== 'external' && findAccount(state, obligation.counterpartyId).kind === 'external', 'INVALID_OBLIGATION_BINDING')
    if (obligation.contractId !== null) requireRule(state.contracts.some((contract) => contract.id === obligation.contractId && contract.accountId === obligation.accountId && (obligation.businessId === null || obligation.businessId === contract.businessId)), 'INVALID_OBLIGATION_BINDING')
    if (obligation.kind === 'refund_delivered') {
      const reservation = state.reservations.find((item) => item.id === obligation.protectionReservationId)
      requireRule(reservation && reservation.kind === 'customer_protection' && reservation.accountId === obligation.accountId && reservation.originId === obligation.id && reservation.amountFen === obligation.remainingFen, 'REFUND_PROTECTION_MISMATCH')
    }
  }
  const supplierIds = new Set<string>()
  for (const prepayment of state.supplierPrepayments) {
    requireRule(!supplierIds.has(prepayment.id), 'SUPPLIER_PREPAYMENT_ID_REUSED')
    supplierIds.add(prepayment.id)
    money(prepayment.paidFen); money(prepayment.remainingFen)
    requireRule(prepayment.remainingFen <= prepayment.paidFen, 'INVALID_SUPPLIER_PREPAYMENT')
    requireRule(findAccount(state, prepayment.accountId).kind !== 'external' && findAccount(state, prepayment.counterpartyId).kind === 'external', 'INVALID_SUPPLIER_BINDING')
  }
  const investmentIds = new Set<string>()
  for (const investment of state.investments) {
    requireRule(!investmentIds.has(investment.id), 'INVESTMENT_ID_REUSED')
    investmentIds.add(investment.id)
    money(investment.bookCostFen); money(investment.valueFen)
    requireRule(findAccount(state, investment.accountId).kind !== 'external', 'EXPECTED_OWNED_ACCOUNT')
    if (investment.subjectAccountId !== null) requireRule(findAccount(state, investment.subjectAccountId).kind === 'business', 'EXPECTED_BUSINESS_ACCOUNT')
  }
  for (const account of state.accounts) if (account.kind !== 'external') accountPosition(state, account.id)
  const feeIds = new Set<string>()
  for (const fee of state.fees) {
    requireRule(!feeIds.has(fee.id), 'FEE_ID_REUSED')
    feeIds.add(fee.id)
    requireRule(cumulativeFee(0, fee.totalBaseFen, fee.basisPoints) === fee.paidFen, 'FEE_TOTAL_MISMATCH')
  }
  for (const entry of state.metrics) {
    identifier(entry.operationId); identifier(entry.sourceEventId); isoDate(entry.date); signedMoney(entry.deltaFen)
    requireRule(entry.date <= state.asOf, 'FUTURE_LEDGER_ENTRY')
    requireRule(findAccount(state, entry.accountId).kind !== 'external', 'EXPECTED_OWNED_ACCOUNT')
    requireRule(entry.kind === 'income' || entry.kind === 'cost', 'INVALID_METRIC_KIND')
    const contract = state.contracts.find((item) => item.id === entry.contractId)
    if (contract) requireRule(contract.accountId === entry.accountId && contract.businessId === entry.businessId, 'METRIC_CONTRACT_MISMATCH')
  }
  const receiptIds = new Set<string>()
  const marketReceivableIds=new Set<string>()
  for(const r of state.marketReceivables){identifier(r.id);identifier(r.originOperationId);identifier(r.sourceEventId);isoDate(r.date);isoDate(r.dueAt);money(r.amountFen);money(r.remainingFen);requireRule(!marketReceivableIds.has(r.id)&&r.remainingFen<=r.amountFen&&r.date<=state.asOf&&r.dueAt>=r.date&&findAccount(state,r.accountId).kind!=='external'&&findAccount(state,r.counterpartyId).kind==='external','INVALID_MARKET_RECEIVABLE');marketReceivableIds.add(r.id)}
  for (const receipt of state.receipts) {
    identifier(receipt.id)
    requireRule(!receiptIds.has(receipt.id), 'DUPLICATE_LEDGER_RECEIPT')
    receiptIds.add(receipt.id)
    requireRule(receipt.status === 'applied' || receipt.status === 'due', 'INVALID_RECEIPT_STATUS')
  }
}

export function applyLedger(state: LedgerState, operation: LedgerOperation): LedgerState {
  identifier(operation.id); identifier(operation.sourceEventId); isoDate(operation.date)
  if (operation.businessId !== undefined) identifier(operation.businessId)
  if (operation.contractId !== undefined) identifier(operation.contractId)
  if (operation.referenceId !== undefined) identifier(operation.referenceId)
  assertLedger(state)
  const signature = canonicalJson(operation)
  const previous = state.receipts.find((receipt) => receipt.id === operation.id)
  if (previous) {
    requireRule(previous.signature === signature, 'OPERATION_ID_REUSED')
    return state
  }
  requireRule(operation.date >= state.asOf, 'BACKDATED_LEDGER_OPERATION')
  const next = cloneLedger(state)
  let status: LedgerReceipt['status'] = 'applied'
  if (operation.kind === 'open_business_account') {
    identifier(operation.accountId)
    requireRule(!next.accounts.some((account) => account.id === operation.accountId), 'ACCOUNT_ALREADY_EXISTS')
    next.accounts.push({ id: operation.accountId, kind: 'business', balanceFen: 0 })
  }
  const account = findAccount(next, operation.accountId)
  requireRule(account.kind !== 'external', 'EXPECTED_OWNED_ACCOUNT')
  if ('counterpartyId' in operation) requireRule(findAccount(next, operation.counterpartyId).kind === 'external', 'EXPECTED_EXTERNAL_COUNTERPARTY')
  if ('amountFen' in operation && operation.amountFen !== undefined) money(operation.amountFen)
  switch (operation.kind) {
    case 'trade_buy': {
      requireNoOverdue(next,account.id,operation.date);money(operation.principalFen);money(operation.feeFen);money(operation.valueFen);requireRule(operation.principalFen>0,'INVALID_TRADE_AMOUNT')
      const reservation=reservationFor(next,account.id,operation.reservationId);requireRule(reservation.kind==='order'&&reservation.originId===operation.originId,'INVALID_RESERVATION_PERMISSION')
      const cost=sumMoney([operation.principalFen,operation.feeFen]);requireRule(reservation.amountFen>=cost,'INSUFFICIENT_ORDER_RESERVATION');cashTransfer(next,operation,account.id,operation.counterpartyId,cost,reservation.id);reduceReservation(reservation,cost)
      addInvestment(next,{...operation,classification:'simulation',amountFen:operation.principalFen},null);const asset=next.investments.find(i=>i.id===operation.investmentId);requireRule(asset,'INVESTMENT_NOT_FOUND');asset.valueFen=operation.valueFen;if(operation.feeFen>0)metric(next,operation,account.id,'cost',operation.feeFen);break
    }
    case 'trade_sell': {
      money(operation.removedPrincipalFen);money(operation.grossFen);money(operation.feeFen);money(operation.valueFen);isoDate(operation.dueAt);requireRule(operation.grossFen>=operation.feeFen&&operation.dueAt>=operation.date,'INVALID_TRADE_AMOUNT');const asset=next.investments.find(i=>i.id===operation.investmentId&&i.accountId===account.id&&i.classification==='simulation');requireRule(asset&&asset.bookCostFen>=operation.removedPrincipalFen,'INVALID_TRADE_BASIS');asset.bookCostFen-=operation.removedPrincipalFen;asset.valueFen=operation.valueFen;const net=operation.grossFen-operation.feeFen
      if(operation.receivableId===null)cashTransfer(next,operation,operation.counterpartyId,account.id,net);else {identifier(operation.receivableId);requireRule(!next.marketReceivables.some(r=>r.id===operation.receivableId),'MARKET_RECEIVABLE_ID_REUSED');next.marketReceivables.push({id:operation.receivableId,accountId:account.id,counterpartyId:operation.counterpartyId,sourceEventId:operation.sourceEventId,originOperationId:operation.id,date:operation.date,dueAt:operation.dueAt,amountFen:net,remainingFen:net,kind:'sale'})}
      metric(next,operation,account.id,'income',operation.grossFen);metric(next,operation,account.id,'cost',sumMoney([operation.removedPrincipalFen,operation.feeFen]));break
    }
    case 'record_market_income': {
      identifier(operation.receivableId);money(operation.amountFen);isoDate(operation.dueAt);requireRule(operation.amountFen>0&&operation.dueAt>=operation.date&&!next.marketReceivables.some(r=>r.id===operation.receivableId),'INVALID_MARKET_RECEIVABLE');next.marketReceivables.push({id:operation.receivableId,accountId:account.id,counterpartyId:operation.counterpartyId,sourceEventId:operation.sourceEventId,originOperationId:operation.id,date:operation.date,dueAt:operation.dueAt,amountFen:operation.amountFen,remainingFen:operation.amountFen,kind:'dividend'});metric(next,operation,account.id,'income',operation.amountFen);break
    }
    case 'settle_market_receivable': {
      const receivable=next.marketReceivables.find(r=>r.id===operation.receivableId&&r.accountId===account.id);requireRule(receivable&&receivable.counterpartyId===operation.counterpartyId&&receivable.dueAt<=operation.date&&operation.amountFen>0&&operation.amountFen<=receivable.remainingFen,'INVALID_MARKET_SETTLEMENT');cashTransfer(next,operation,operation.counterpartyId,account.id,operation.amountFen);receivable.remainingFen-=operation.amountFen;break
    }
    case 'open_business_account': break
    case 'owner_transfer':
      requireRule(findAccount(next, operation.targetAccountId).kind !== 'external' && operation.targetAccountId !== account.id && operation.amountFen > 0, 'INVALID_OWNER_TRANSFER')
      requireSpendingPermission(next, account.id, operation.date, operation.fundingPurpose)
      cashTransfer(next, operation, account.id, operation.targetAccountId, operation.amountFen)
      break
    case 'borrow_cash': {
      isoDate(operation.dueAt)
      requireRule(operation.dueAt > operation.date && operation.amountFen > 0, 'INVALID_LOAN_TERMS')
      const payable = createPayable(next, operation, 'loan_principal', operation.counterpartyId, null, null)
      payable.date = operation.dueAt
      cashTransfer(next, operation, operation.counterpartyId, account.id, operation.amountFen)
      break
    }
    case 'opening_cash':
      requireRule(!next.openingPosted.includes(account.id), 'OPENING_ALREADY_POSTED')
      next.openingPosted.push(account.id)
      cashTransfer(next, operation, operation.counterpartyId, account.id, operation.amountFen)
      break
    case 'income':
      cashTransfer(next, operation, operation.counterpartyId, account.id, operation.amountFen)
      metric(next, operation, account.id, 'income', operation.amountFen)
      break
    case 'expense': {
      requireSpendingPermission(next, account.id, operation.date, operation.fundingPurpose)
      let permission: WorkingLedger['reservations'][number] | null = null
      if (operation.reservationId !== undefined) {
        permission = reservationFor(next, account.id, operation.reservationId)
        requireRule((permission.kind === 'plan' || permission.kind === 'order') && permission.originId === operation.originId && operation.amountFen <= permission.amountFen, 'INVALID_RESERVATION_PERMISSION')
      }
      cashTransfer(next, operation, account.id, operation.counterpartyId, operation.amountFen, permission?.id ?? null)
      if (permission && operation.amountFen > 0) reduceReservation(permission, operation.amountFen)
      metric(next, operation, account.id, 'cost', operation.amountFen)
      break
    }
    case 'reserve_cash': {
      identifier(operation.reservationId); identifier(operation.originId)
      requireRule(['plan', 'order', 'frozen'].includes(operation.bucket), 'INVALID_RESERVATION_KIND')
      requireRule(!next.reservations.some((reservation) => reservation.id === operation.reservationId), 'RESERVATION_ID_REUSED')
      requireRule(operation.amountFen > 0, 'INVALID_RESERVATION_AMOUNT')
      if (operation.bucket !== 'frozen') {
        requireSpendingPermission(next, account.id, operation.date, operation.fundingPurpose)
        requireRule(accountFunds(next, account.id).availableFen >= operation.amountFen, 'INSUFFICIENT_AVAILABLE_FUNDS')
      }
      next.reservations.push({ id: operation.reservationId, accountId: account.id, kind: operation.bucket, originId: operation.originId, amountFen: operation.amountFen, status: 'active' })
      break
    }
    case 'move_reservation': {
      identifier(operation.newOriginId)
      const reservation = reservationFor(next, account.id, operation.reservationId)
      requireRule(reservation.kind === 'plan', 'RESERVATION_MOVE_NOT_ALLOWED')
      reservation.kind = 'order'
      reservation.originId = operation.newOriginId
      break
    }
    case 'release_reservation': {
      const reservation = reservationFor(next, account.id, operation.reservationId)
      requireRule(reservation.kind !== 'customer_protection', 'PROTECTED_RESERVATION_MANAGED_BY_CONTRACT')
      reduceReservation(reservation, operation.amountFen ?? reservation.amountFen)
      break
    }
    case 'receive_prepayment':
      receivePrepayment(next, operation)
      break
    case 'deliver_prepaid': {
      requireRule(operation.amountFen > 0, 'INVALID_CONTRACT_AMOUNT')
      const contract = revenueFor(next, operation)
      requireRule(operation.amountFen <= contract.prepaidFen && contract.protectionReservationId !== null, 'DELIVERY_EXCEEDS_PREPAYMENT')
      reduceReservation(reservationFor(next, account.id, contract.protectionReservationId), operation.amountFen)
      contract.prepaidFen -= operation.amountFen
      contract.recognizedIncomeFen = sumMoney([contract.recognizedIncomeFen, operation.amountFen])
      metric(next, operation, account.id, 'income', operation.amountFen)
      break
    }
    case 'refund_undelivered': {
      requireRefundSource(next, operation, ['receive_prepayment'])
      const contract = revenueFor(next, operation)
      requireRule(operation.amountFen > 0 && operation.amountFen <= contract.prepaidFen && contract.protectionReservationId !== null, 'REFUND_EXCEEDS_PREPAYMENT')
      contract.prepaidFen -= operation.amountFen
      const payable = createPayable(next, operation, 'refund_undelivered', contract.counterpartyId, contract.id, contract.protectionReservationId)
      if (paymentCapacity(next, account.id, payable.protectionReservationId) >= payable.remainingFen) payObligation(next, operation, payable, payable.remainingFen)
      else status = 'due'
      break
    }
    case 'refund_delivered': {
      requireRefundSource(next, operation, ['deliver_prepaid', 'deliver_on_credit'])
      const contract = revenueFor(next, operation)
      requireRule(operation.amountFen > 0 && operation.amountFen <= contract.recognizedIncomeFen, 'REFUND_EXCEEDS_RECOGNIZED_INCOME')
      if (operation.settlement === 'receivable') {
        requireRule(operation.amountFen <= contract.receivableFen, 'REFUND_EXCEEDS_RECEIVABLE')
        contract.receivableFen -= operation.amountFen
      } else {
        requireRule(operation.settlement === 'cash', 'INVALID_REFUND_SETTLEMENT')
        requireRule(operation.amountFen <= contract.recognizedIncomeFen - contract.receivableFen, 'REFUND_EXCEEDS_PAID_DELIVERY')
        identifier(operation.reservationId)
        requireRule(!next.reservations.some((item) => item.id === operation.reservationId), 'RESERVATION_ID_REUSED')
        next.reservations.push({ id: operation.reservationId, accountId: account.id, kind: 'customer_protection', originId: operation.obligationId, amountFen: operation.amountFen, status: 'active' })
        const payable = createPayable(next, operation, 'refund_delivered', contract.counterpartyId, contract.id, operation.reservationId)
        if (paymentCapacity(next, account.id, payable.protectionReservationId) >= payable.remainingFen) payObligation(next, operation, payable, payable.remainingFen)
        else status = 'due'
      }
      contract.recognizedIncomeFen -= operation.amountFen
      metric(next, operation, account.id, 'income', -operation.amountFen)
      break
    }
    case 'deliver_on_credit': {
      identifier(operation.contractId)
      requireRule(operation.amountFen > 0, 'INVALID_CONTRACT_AMOUNT')
      let contract = next.contracts.find((item) => item.id === operation.contractId)
      if (!contract) {
        contract = { id: operation.contractId, accountId: account.id, businessId: operation.businessId, counterpartyId: operation.counterpartyId, protectionReservationId: null, prepaidFen: 0, receivableFen: 0, recognizedIncomeFen: 0 }
        next.contracts.push(contract)
      }
      requireRule(contract.accountId === account.id && contract.businessId === operation.businessId && contract.counterpartyId === operation.counterpartyId, 'CONTRACT_BINDING_MISMATCH')
      contract.receivableFen = sumMoney([contract.receivableFen, operation.amountFen])
      contract.recognizedIncomeFen = sumMoney([contract.recognizedIncomeFen, operation.amountFen])
      metric(next, operation, account.id, 'income', operation.amountFen)
      break
    }
    case 'collect_receivable': {
      const contract = revenueFor(next, operation)
      requireRule(operation.amountFen > 0 && operation.amountFen <= contract.receivableFen, 'COLLECTION_EXCEEDS_RECEIVABLE')
      cashTransfer(next, { ...operation, referenceId: contract.id }, contract.counterpartyId, account.id, operation.amountFen)
      contract.receivableFen -= operation.amountFen
      break
    }
    case 'pay_obligation': {
      const payable = next.obligations.find((item) => item.id === operation.obligationId && item.accountId === account.id)
      requireRule(payable, 'OBLIGATION_NOT_FOUND')
      requireRule(operation.businessId === undefined || operation.businessId === payable.businessId, 'OBLIGATION_BINDING_MISMATCH')
      payObligation(next, operation, payable, operation.amountFen)
      if (payable.remainingFen > 0) status = 'due'
      break
    }
    case 'due_expense': {
      const payable = createPayable(next, operation, 'expense', operation.counterpartyId, operation.contractId ?? null, null)
      metric(next, operation, account.id, 'cost', operation.amountFen)
      if (paymentCapacity(next, account.id) >= payable.remainingFen) payObligation(next, operation, payable, payable.remainingFen)
      else status = 'due'
      break
    }
    case 'supplier_prepay': {
      identifier(operation.prepaymentId)
      requireNoOverdue(next, account.id, operation.date)
      requireRule(operation.amountFen > 0, 'INVALID_SUPPLIER_AMOUNT')
      const existing = next.supplierPrepayments.find((item) => item.id === operation.prepaymentId)
      requireRule(!existing || (existing.accountId === account.id && existing.businessId === operation.businessId && existing.counterpartyId === operation.counterpartyId), 'SUPPLIER_PREPAYMENT_ID_REUSED')
      cashTransfer(next, operation, account.id, operation.counterpartyId, operation.amountFen)
      if (existing) {
        existing.paidFen = sumMoney([existing.paidFen, operation.amountFen])
        existing.remainingFen = sumMoney([existing.remainingFen, operation.amountFen])
      } else next.supplierPrepayments.push({ id: operation.prepaymentId, accountId: account.id, businessId: operation.businessId, counterpartyId: operation.counterpartyId, paidFen: operation.amountFen, remainingFen: operation.amountFen })
      break
    }
    case 'consume_supplier': {
      const prepayment = next.supplierPrepayments.find((item) => item.id === operation.prepaymentId && item.accountId === account.id && item.businessId === operation.businessId)
      requireRule(prepayment, 'SUPPLIER_PREPAYMENT_NOT_FOUND')
      requireRule(operation.amountFen > 0 && operation.amountFen <= prepayment.remainingFen, 'USAGE_EXCEEDS_SUPPLIER_PREPAYMENT')
      prepayment.remainingFen -= operation.amountFen
      metric(next, { ...operation, referenceId: prepayment.id }, account.id, 'cost', operation.amountFen)
      break
    }
    case 'capital_injection':
      requireNoOverdue(next, account.id, operation.date)
      requireRule(operation.amountFen > 0, 'INVALID_INVESTMENT_AMOUNT')
      requireRule(findAccount(next, operation.targetAccountId).kind === 'business', 'EXPECTED_BUSINESS_ACCOUNT')
      cashTransfer(next, operation, account.id, operation.targetAccountId, operation.amountFen)
      addInvestment(next, operation, operation.targetAccountId)
      break
    case 'acquire_asset':
      requireNoOverdue(next, account.id, operation.date)
      requireRule(operation.amountFen > 0, 'INVALID_INVESTMENT_AMOUNT')
      cashTransfer(next, operation, account.id, operation.counterpartyId, operation.amountFen)
      addInvestment(next, operation, null)
      break
    case 'value_asset': {
      money(operation.valueFen)
      const investment = next.investments.find((item) => item.id === operation.investmentId && item.accountId === account.id)
      requireRule(investment, 'INVESTMENT_NOT_FOUND')
      investment.valueFen = operation.valueFen
      break
    }
    case 'charge_fee': {
      identifier(operation.feeId)
      requireNoOverdue(next, account.id, operation.date)
      const existing = next.fees.find((item) => item.id === operation.feeId)
      requireRule(!existing || (existing.accountId === account.id && existing.counterpartyId === operation.counterpartyId && existing.businessId === (operation.businessId ?? null) && existing.basisPoints === operation.basisPoints), 'FEE_BINDING_MISMATCH')
      const previousBase = existing?.totalBaseFen ?? 0
      const feeFen = cumulativeFee(previousBase, operation.addedBaseFen, operation.basisPoints)
      cashTransfer(next, { ...operation, referenceId: operation.feeId }, account.id, operation.counterpartyId, feeFen)
      metric(next, operation, account.id, 'cost', feeFen)
      if (existing) {
        existing.totalBaseFen = sumMoney([previousBase, operation.addedBaseFen])
        existing.paidFen = sumMoney([existing.paidFen, feeFen])
      } else next.fees.push({ id: operation.feeId, accountId: account.id, counterpartyId: operation.counterpartyId, businessId: operation.businessId ?? null, basisPoints: operation.basisPoints, totalBaseFen: operation.addedBaseFen, paidFen: feeFen })
      break
    }
    default: throw new RuleError('UNKNOWN_LEDGER_OPERATION')
  }
  next.asOf = operation.date
  next.receipts.push({ id: operation.id, signature, status, kind: operation.kind, accountId: account.id, contractId: operation.contractId ?? null })
  assertLedger(next)
  return next
}
