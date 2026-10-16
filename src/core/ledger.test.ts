import { describe, expect, it } from 'vitest'
import { accountFunds, accountPosition, applyLedger, assertLedger, contractBalance, createLedger, metricsFor } from './ledger.ts'

function emptyLedger() {
  return createLedger([
    { id: 'personal', kind: 'personal' },
    { id: 'company', kind: 'business' },
    { id: 'world', kind: 'external' },
  ], '2020-01-01')
}

function stamp(id: string, date = '2020-01-01') { return { id, date, sourceEventId: 'fixture' } }
function fundedLedger(amountFen = 3_000_000) {
  return applyLedger(emptyLedger(), { ...stamp('opening'), kind: 'opening_cash', accountId: 'personal', counterpartyId: 'world', amountFen })
}

describe('shared ledger', () => {
  it('pairs the opening cash and living payment with virtual counterparties', () => {
    const initial = emptyLedger()
    const funded = applyLedger(initial, { id: 'opening', kind: 'opening_cash', date: '2020-01-01', sourceEventId: 'fixture', accountId: 'personal', counterpartyId: 'world', amountFen: 3_000_000 })
    const paid = applyLedger(funded, { id: 'living', kind: 'expense', date: '2020-01-01', sourceEventId: 'fixture', accountId: 'personal', counterpartyId: 'world', amountFen: 400_000 })
    expect(accountFunds(paid, 'personal').cashFen).toBe(2_600_000)
    expect(paid.accounts.reduce((sum, account) => sum + account.balanceFen, 0)).toBe(0)
    expect(accountFunds(initial, 'personal').cashFen).toBe(0)
    expect(paid.transactions).toHaveLength(2)
  })

  it('returns one posting for replay and rejects reused IDs with changed intent', () => {
    const funded = fundedLedger()
    const operation = { ...stamp('living'), kind: 'expense', accountId: 'personal', counterpartyId: 'world', amountFen: 400_000 } as const
    const paid = applyLedger(funded, operation)
    expect(applyLedger(paid, { amountFen: 400_000, counterpartyId: 'world', accountId: 'personal', kind: 'expense', ...stamp('living') })).toEqual(paid)
    expect(() => applyLedger(paid, { ...operation, amountFen: 1 })).toThrow('OPERATION_ID_REUSED')
    expect(() => applyLedger(paid, { ...stamp('again'), kind: 'opening_cash', accountId: 'personal', counterpartyId: 'world', amountFen: 3_000_000 })).toThrow('OPENING_ALREADY_POSTED')
    expect(() => applyLedger(funded, { ...operation, amountFen: 3_000_001 })).toThrow('INSUFFICIENT_AVAILABLE_FUNDS')
    expect(accountFunds(funded, 'personal').cashFen).toBe(3_000_000)
  })

  it('moves the same reservation into an order and releases only its remainder', () => {
    let ledger = fundedLedger(1_000_000)
    ledger = applyLedger(ledger, { ...stamp('reserve'), kind: 'reserve_cash', accountId: 'personal', reservationId: 'r1', bucket: 'plan', originId: 'plan1', amountFen: 300_000 })
    expect(accountFunds(ledger, 'personal').availableFen).toBe(700_000)
    ledger = applyLedger(ledger, { ...stamp('move'), kind: 'move_reservation', accountId: 'personal', reservationId: 'r1', newOriginId: 'order1' })
    expect(accountFunds(ledger, 'personal').availableFen).toBe(700_000)
    ledger = applyLedger(ledger, { ...stamp('release-part'), kind: 'release_reservation', accountId: 'personal', reservationId: 'r1', amountFen: 100_000 })
    expect(accountFunds(ledger, 'personal').availableFen).toBe(800_000)
    expect(ledger.reservations).toHaveLength(1)
    expect(ledger.reservations[0]?.kind).toBe('order')
    expect(() => applyLedger(ledger, { ...stamp('double'), kind: 'reserve_cash', accountId: 'personal', reservationId: 'r1', bucket: 'order', originId: 'order1', amountFen: 200_000 })).toThrow('RESERVATION_ID_REUSED')
  })

  it('keeps a prepayment protected until delivery and separates cash from profit (Q12)', () => {
    let ledger = fundedLedger(0)
    ledger = applyLedger(ledger, { ...stamp('prepay'), kind: 'receive_prepayment', accountId: 'personal', businessId: 'course1', contractId: 'c1', counterpartyId: 'world', reservationId: 'protected-c1', amountFen: 1_000_000 })
    expect(accountFunds(ledger, 'personal').availableFen).toBe(0)
    expect(metricsFor(ledger, 'personal', 'course1').incomeFen).toBe(0)
    expect(() => applyLedger(ledger, { ...stamp('misuse'), kind: 'expense', accountId: 'personal', counterpartyId: 'world', amountFen: 1 })).toThrow('INSUFFICIENT_AVAILABLE_FUNDS')
    ledger = applyLedger(ledger, { ...stamp('deliver-half'), kind: 'deliver_prepaid', accountId: 'personal', businessId: 'course1', contractId: 'c1', amountFen: 500_000 })
    ledger = applyLedger(ledger, { ...stamp('cost'), kind: 'expense', accountId: 'personal', businessId: 'course1', counterpartyId: 'world', amountFen: 200_000 })
    expect(accountFunds(ledger, 'personal')).toMatchObject({ cashFen: 800_000, availableFen: 300_000 })
    expect(contractBalance(ledger, 'c1').prepaidFen).toBe(500_000)
    expect(metricsFor(ledger, 'personal', 'course1')).toEqual({ incomeFen: 500_000, costFen: 200_000, profitFen: 300_000 })
    expect(() => applyLedger(ledger, { ...stamp('free-protection'), kind: 'release_reservation', accountId: 'personal', reservationId: 'protected-c1' })).toThrow('PROTECTED_RESERVATION_MANAGED_BY_CONTRACT')
  })

  it('refunds an undelivered amount without recording a second expense', () => {
    let ledger = fundedLedger(0)
    ledger = applyLedger(ledger, { ...stamp('prepay'), kind: 'receive_prepayment', accountId: 'personal', businessId: 'course1', contractId: 'c1', counterpartyId: 'world', reservationId: 'protected-c1', amountFen: 1_000_000 })
    const refund = { ...stamp('refund'), referenceId: 'prepay', kind: 'refund_undelivered', accountId: 'personal', businessId: 'course1', contractId: 'c1', obligationId: 'refund-due', amountFen: 400_000 } as const
    ledger = applyLedger(ledger, refund)
    expect(accountFunds(ledger, 'personal')).toMatchObject({ cashFen: 600_000, availableFen: 0 })
    expect(contractBalance(ledger, 'c1').prepaidFen).toBe(600_000)
    expect(metricsFor(ledger, 'personal', 'course1')).toEqual({ incomeFen: 0, costFen: 0, profitFen: 0 })
    expect(applyLedger(ledger, refund)).toEqual(ledger)
  })

  it('reduces delivered income for a refund instead of inventing a prepayment liability (Q26)', () => {
    let ledger = fundedLedger(1_000_000)
    ledger = applyLedger(ledger, { ...stamp('prepay'), kind: 'receive_prepayment', accountId: 'personal', businessId: 'course1', contractId: 'c1', counterpartyId: 'world', reservationId: 'protected-c1', amountFen: 500_000 })
    ledger = applyLedger(ledger, { ...stamp('delivery'), kind: 'deliver_prepaid', accountId: 'personal', businessId: 'course1', contractId: 'c1', amountFen: 500_000 })
    ledger = applyLedger(ledger, { ...stamp('refund'), referenceId: 'delivery', kind: 'refund_delivered', settlement: 'cash', accountId: 'personal', businessId: 'course1', contractId: 'c1', obligationId: 'refund-due', reservationId: 'refund-protection', amountFen: 100_000 })
    ledger = applyLedger(ledger, { ...stamp('cost'), kind: 'expense', accountId: 'personal', businessId: 'course1', counterpartyId: 'world', amountFen: 200_000 })
    expect(accountFunds(ledger, 'personal').cashFen).toBe(1_200_000)
    expect(contractBalance(ledger, 'c1').prepaidFen).toBe(0)
    expect(metricsFor(ledger, 'personal', 'course1')).toEqual({ incomeFen: 400_000, costFen: 200_000, profitFen: 200_000 })
    expect(ledger.obligations[0]?.kind).toBe('refund_delivered')
  })

  it('recognizes postpaid delivery once and applies a refund against unpaid receivables', () => {
    let ledger = fundedLedger(0)
    ledger = applyLedger(ledger, { ...stamp('delivery'), kind: 'deliver_on_credit', accountId: 'personal', businessId: 'service1', contractId: 'c1', counterpartyId: 'world', amountFen: 500_000 })
    expect(accountFunds(ledger, 'personal').cashFen).toBe(0)
    ledger = applyLedger(ledger, { ...stamp('allowance'), referenceId: 'delivery', kind: 'refund_delivered', settlement: 'receivable', accountId: 'personal', businessId: 'service1', contractId: 'c1', amountFen: 100_000 })
    ledger = applyLedger(ledger, { ...stamp('collection'), kind: 'collect_receivable', accountId: 'personal', businessId: 'service1', contractId: 'c1', amountFen: 400_000 })
    expect(accountFunds(ledger, 'personal').cashFen).toBe(400_000)
    expect(contractBalance(ledger, 'c1').receivableFen).toBe(0)
    expect(metricsFor(ledger, 'personal', 'service1').incomeFen).toBe(400_000)
    expect(() => applyLedger(ledger, { ...stamp('collect-again'), kind: 'collect_receivable', accountId: 'personal', businessId: 'service1', contractId: 'c1', amountFen: 1 })).toThrow('COLLECTION_EXCEEDS_RECEIVABLE')
  })

  it('records an unpaid due expense rather than borrowing future salary (Q03)', () => {
    let ledger = fundedLedger(100_000)
    ledger = applyLedger(ledger, { ...stamp('living'), kind: 'due_expense', accountId: 'personal', counterpartyId: 'world', obligationId: 'living-due', amountFen: 400_000 })
    expect(accountFunds(ledger, 'personal').cashFen).toBe(100_000)
    expect(ledger.obligations[0]?.remainingFen).toBe(400_000)
    expect(ledger.receipts.find((receipt) => receipt.id === 'living')?.status).toBe('due')
    ledger = applyLedger(ledger, { ...stamp('salary', '2020-01-31'), kind: 'income', accountId: 'personal', counterpartyId: 'world', amountFen: 800_000 })
    expect(() => applyLedger(ledger, { ...stamp('expand', '2020-01-31'), kind: 'expense', accountId: 'personal', counterpartyId: 'world', amountFen: 1 })).toThrow('OVERDUE_OBLIGATION')
    ledger = applyLedger(ledger, { ...stamp('pay-living', '2020-01-31'), kind: 'pay_obligation', accountId: 'personal', obligationId: 'living-due', amountFen: 400_000 })
    expect(accountFunds(ledger, 'personal').cashFen).toBe(500_000)
    expect(metricsFor(ledger, 'personal').costFen).toBe(400_000)
  })

  it('shows an overfunded protection requirement as a separate shortfall', () => {
    const ledger = applyLedger(fundedLedger(100_000), { ...stamp('freeze'), kind: 'reserve_cash', accountId: 'personal', reservationId: 'frozen', originId: 'risk', bucket: 'frozen', amountFen: 200_000 })
    expect(accountFunds(ledger, 'personal')).toMatchObject({ cashFen: 100_000, availableFen: 0, protectionShortfallFen: 100_000 })
  })

  it('keeps supplier prepayment as an asset until actual consumption', () => {
    let ledger = fundedLedger(900_000)
    ledger = applyLedger(ledger, { ...stamp('supplier-payment'), kind: 'supplier_prepay', accountId: 'personal', businessId: 'relay1', counterpartyId: 'world', prepaymentId: 'supplier1', amountFen: 500_000 })
    expect(accountPosition(ledger, 'personal')).toMatchObject({ cashFen: 400_000, supplierPrepaidFen: 500_000, netAssetsFen: 900_000 })
    expect(metricsFor(ledger, 'personal', 'relay1').costFen).toBe(0)
    ledger = applyLedger(ledger, { ...stamp('usage'), kind: 'consume_supplier', accountId: 'personal', businessId: 'relay1', prepaymentId: 'supplier1', amountFen: 200_000 })
    expect(accountPosition(ledger, 'personal')).toMatchObject({ cashFen: 400_000, supplierPrepaidFen: 300_000, netAssetsFen: 700_000 })
    expect(metricsFor(ledger, 'personal', 'relay1').costFen).toBe(200_000)
  })

  it('transfers capital between subjects and values equity without adding company cash twice (Q05)', () => {
    let ledger = fundedLedger()
    ledger = applyLedger(ledger, { ...stamp('capital'), kind: 'capital_injection', accountId: 'personal', targetAccountId: 'company', investmentId: 'stake', assetId: 'company-equity', classification: 'fictional', amountFen: 1_000_000 })
    expect(accountPosition(ledger, 'personal').netAssetsFen).toBe(3_000_000)
    ledger = applyLedger(ledger, { ...stamp('valuation'), kind: 'value_asset', accountId: 'personal', investmentId: 'stake', valueFen: 2_000_000 })
    expect(accountPosition(ledger, 'personal')).toMatchObject({ cashFen: 2_000_000, investmentValueFen: 2_000_000, netAssetsFen: 4_000_000 })
    expect(accountFunds(ledger, 'company').cashFen).toBe(1_000_000)
    expect(metricsFor(ledger, 'personal').incomeFen).toBe(0)
  })

  it('exchanges cash for a simulated asset and keeps unrealized losses outside income', () => {
    let ledger = fundedLedger()
    ledger = applyLedger(ledger, { ...stamp('purchase'), kind: 'acquire_asset', accountId: 'personal', counterpartyId: 'world', investmentId: 'sim-position', assetId: 'SIM-AI01', classification: 'simulation', amountFen: 1_200_000 })
    ledger = applyLedger(ledger, { ...stamp('market-value'), kind: 'value_asset', accountId: 'personal', investmentId: 'sim-position', valueFen: 1_100_000 })
    expect(accountPosition(ledger, 'personal')).toMatchObject({ cashFen: 1_800_000, investmentValueFen: 1_100_000, netAssetsFen: 2_900_000 })
    expect(metricsFor(ledger, 'personal')).toEqual({ incomeFen: 0, costFen: 0, profitFen: 0 })
  })

  it('stores cumulative fee bases so splitting one obligation cannot round fees twice', () => {
    let ledger = fundedLedger(10)
    ledger = applyLedger(ledger, { ...stamp('fee-part1'), kind: 'charge_fee', accountId: 'personal', counterpartyId: 'world', feeId: 'fee1', addedBaseFen: 1, basisPoints: 5000 })
    ledger = applyLedger(ledger, { ...stamp('fee-part2'), kind: 'charge_fee', accountId: 'personal', counterpartyId: 'world', feeId: 'fee1', addedBaseFen: 1, basisPoints: 5000 })
    expect(accountFunds(ledger, 'personal').cashFen).toBe(9)
    expect(metricsFor(ledger, 'personal').costFen).toBe(1)
    expect(() => applyLedger(ledger, { ...stamp('change-rate'), kind: 'charge_fee', accountId: 'personal', counterpartyId: 'world', feeId: 'fee1', addedBaseFen: 1, basisPoints: 10000 })).toThrow('FEE_BINDING_MISMATCH')
  })

  it('retains a delivered refund as payable when cash is missing, including after a partial payment', () => {
    let ledger = fundedLedger(0)
    ledger = applyLedger(ledger, { ...stamp('prepay'), kind: 'receive_prepayment', accountId: 'personal', businessId: 'course1', contractId: 'c1', counterpartyId: 'world', reservationId: 'protected-c1', amountFen: 500_000 })
    ledger = applyLedger(ledger, { ...stamp('delivery'), kind: 'deliver_prepaid', accountId: 'personal', businessId: 'course1', contractId: 'c1', amountFen: 500_000 })
    ledger = applyLedger(ledger, { ...stamp('cost'), kind: 'expense', accountId: 'personal', businessId: 'course1', counterpartyId: 'world', amountFen: 500_000 })
    ledger = applyLedger(ledger, { ...stamp('refund'), referenceId: 'delivery', kind: 'refund_delivered', settlement: 'cash', accountId: 'personal', businessId: 'course1', contractId: 'c1', obligationId: 'refund-due', reservationId: 'refund-protection', amountFen: 200_000 })
    expect(accountPosition(ledger, 'personal')).toMatchObject({ cashFen: 0, prepaidLiabilityFen: 0, payableFen: 200_000, protectionShortfallFen: 200_000, netAssetsFen: -200_000 })
    ledger = applyLedger(ledger, { ...stamp('salary', '2020-01-02'), kind: 'income', accountId: 'personal', counterpartyId: 'world', amountFen: 100_000 })
    ledger = applyLedger(ledger, { ...stamp('partial-refund', '2020-01-02'), kind: 'pay_obligation', accountId: 'personal', obligationId: 'refund-due', amountFen: 100_000 })
    expect(accountPosition(ledger, 'personal')).toMatchObject({ cashFen: 0, payableFen: 100_000, protectionShortfallFen: 100_000 })
    expect(ledger.receipts.find((item) => item.id === 'partial-refund')?.status).toBe('due')
  })

  it('keeps source and original delivery references on non-cash refund corrections', () => {
    let ledger = fundedLedger(0)
    ledger = applyLedger(ledger, { ...stamp('delivery'), kind: 'deliver_on_credit', accountId: 'personal', businessId: 'service1', contractId: 'c1', counterpartyId: 'world', amountFen: 500_000 })
    ledger = applyLedger(ledger, { ...stamp('correction'), referenceId: 'delivery', kind: 'refund_delivered', settlement: 'receivable', accountId: 'personal', businessId: 'service1', contractId: 'c1', amountFen: 100_000 })
    expect(ledger.metrics.find((entry) => entry.operationId === 'correction')).toMatchObject({ sourceEventId: 'fixture', contractId: 'c1', referenceId: 'delivery', deltaFen: -100_000 })
  })

  it('records contract and source identities on cash transactions', () => {
    const ledger = applyLedger(fundedLedger(0), { ...stamp('prepay'), kind: 'receive_prepayment', accountId: 'personal', businessId: 'course1', contractId: 'c1', counterpartyId: 'world', reservationId: 'protected-c1', amountFen: 500_000 })
    expect(ledger.transactions.find((entry) => entry.id === 'prepay')).toMatchObject({ contractId: 'c1', businessId: 'course1', sourceEventId: 'fixture' })
  })

  it('detects an inconsistent recognized balance rather than accepting a plausible cash total', () => {
    let ledger = applyLedger(fundedLedger(0), { ...stamp('prepay'), kind: 'receive_prepayment', accountId: 'personal', businessId: 'course1', contractId: 'c1', counterpartyId: 'world', reservationId: 'protected-c1', amountFen: 500_000 })
    ledger = applyLedger(ledger, { ...stamp('delivery'), kind: 'deliver_prepaid', accountId: 'personal', businessId: 'course1', contractId: 'c1', amountFen: 500_000 })
    const inconsistent = { ...ledger, contracts: ledger.contracts.map((contract) => ({ ...contract, recognizedIncomeFen: contract.recognizedIncomeFen + 1 })) }
    expect(() => assertLedger(inconsistent)).toThrow('RECOGNIZED_INCOME_MISMATCH')
  })
})
