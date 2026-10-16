import { expect, it } from 'vitest'
import { createLedger, applyLedger, accountPosition, metricsFor } from './ledger.ts'

it('keeps owner funding and borrowing out of profit and exposes principal as a dated liability', () => {
  let ledger = applyLedger(createLedger([{ id: 'personal', kind: 'personal' }, { id: 'world', kind: 'external' }], '2020-01-01'), { id: 'cash', sourceEventId: 'fixture', date: '2020-01-01', kind: 'opening_cash', accountId: 'personal', counterpartyId: 'world', amountFen: 100_000 })
  ledger = applyLedger(ledger, { id: 'account', sourceEventId: 'fixture', date: '2020-01-01', kind: 'open_business_account', accountId: 'company' })
  ledger = applyLedger(ledger, { id: 'fund', sourceEventId: 'fixture', date: '2020-01-01', kind: 'owner_transfer', accountId: 'personal', targetAccountId: 'company', amountFen: 50_000 })
  ledger = applyLedger(ledger, { id: 'loan', sourceEventId: 'fixture', date: '2020-01-01', kind: 'borrow_cash', accountId: 'company', counterpartyId: 'world', amountFen: 100_000, obligationId: 'principal', dueAt: '2020-02-01' })
  expect(accountPosition(ledger, 'company')).toMatchObject({ cashFen: 150_000, payableFen: 100_000, netAssetsFen: 50_000 })
  expect(metricsFor(ledger, 'company').incomeFen).toBe(0)
  ledger = applyLedger(ledger, { id: 'repay', sourceEventId: 'fixture', date: '2020-01-31', kind: 'pay_obligation', accountId: 'company', obligationId: 'principal', amountFen: 50_000 })
  expect(metricsFor(ledger, 'company').costFen).toBe(0)
  expect(accountPosition(ledger, 'company')).toMatchObject({ cashFen: 100_000, payableFen: 50_000 })
})
