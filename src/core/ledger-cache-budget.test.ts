import {afterEach, expect, it, vi} from 'vitest'
import {applyLedger, assertLedger, createLedger, type LedgerState} from './ledger.ts'
import {canonicalJson} from './identity.ts'

afterEach(() => vi.restoreAllMocks())

function history(count: number, signature = '{"kind":"income"}'): LedgerState {
  let state = createLedger([{id:'personal',kind:'personal'},{id:'world',kind:'external'}], '2020-01-01')
  const stamp = {date:'2020-01-01',sourceEventId:'cache-budget',accountId:'personal'}
  state = applyLedger(state, {...stamp,id:'opening',kind:'opening_cash',counterpartyId:'world',amountFen:1000})
  state = applyLedger(state, {...stamp,id:'pool',kind:'supplier_prepay',businessId:'relay',prepaymentId:'pool',counterpartyId:'world',amountFen:200})
  // These records exercise the public ledger validator's direct-input seam.
  // Full campaign acceptance uses the captured original campaign separately.
  return {...state, receipts:[...state.receipts.map(row => ({...row})), ...Array.from({length:count}, (_, index) => ({
    id:'budget:'+index, signature, kind:'income' as const, status:'applied' as const, accountId:'personal',contractId:null,
  }))]}
}

function repeated(state: LedgerState) {
  const before = JSON.stringify(state)
  const nativeParse = JSON.parse
  let calls = 0, characters = 0
  const observe = () => {
    calls = 0; characters = 0
    JSON.parse = (...args: Parameters<typeof JSON.parse>) => {
      calls++; characters += args[0].length
      return Reflect.apply(nativeParse, JSON, args)
    }
    try { assertLedger(state) } finally { JSON.parse = nativeParse }
    return {calls, characters}
  }
  const cold = observe(), warm = observe(), repeatedWarm = observe()
  expect(JSON.stringify(state)).toBe(before)
  return {cold, warm, repeatedWarm}
}

it('retains a bounded reusable prefix while a receipt scan exceeds the entry budget', () => {
  const state = history(33000), {cold, warm, repeatedWarm} = repeated(state)
  expect(cold.calls).toBe(state.receipts.length)
  expect(warm.calls).toBeGreaterThan(0)
  expect(warm.calls).toBeLessThan(cold.calls/2)
  expect(cold.calls-warm.calls).toBeLessThanOrEqual(32768)
  expect(cold.characters-warm.characters).toBeLessThanOrEqual(16*1024*1024)
  expect(repeatedWarm).toEqual(warm)
})

it('retains a prefix within the character budget independently of the entry budget', () => {
  const signature = canonicalJson({kind:'income',extra:'x'.repeat(8000)})
  const state = history(2200, signature), {cold, warm, repeatedWarm} = repeated(state)
  expect(cold.calls).toBe(state.receipts.length)
  expect(warm.calls).toBeGreaterThan(0)
  expect(warm.calls).toBeLessThan(cold.calls/2)
  expect(cold.characters-warm.characters).toBeLessThanOrEqual(16*1024*1024)
  expect(repeatedWarm).toEqual(warm)
})

it('rebuilds reuse for decoded receipt objects and alternating ledgers', () => {
  const a = history(33000), b = structuredClone(a)
  for (const state of [a,b,a,b]) {
    const {cold,warm} = repeated(state)
    expect(cold.calls).toBe(state.receipts.length)
    expect(warm.calls).toBeLessThan(cold.calls/2)
  }
})

it('finds the cache anchor after an oversized first signature and reads each getter once', () => {
  const state = history(33000), first = state.receipts[0]!
  const original = first.signature, large = canonicalJson({...JSON.parse(original),extra:'x'.repeat(8192)})
  let reads = 0
  Object.defineProperty(first, 'signature', {enumerable:true,configurable:true,get(){reads++;return large}})
  const parse = vi.spyOn(JSON,'parse')
  assertLedger(state)
  parse.mockClear()
  assertLedger(state)
  expect(reads).toBe(2)
  expect(parse.mock.calls.length).toBeLessThan(state.receipts.length/2)
  expect(parse.mock.calls.filter(([text]) => text===large)).toHaveLength(1)
})

it('still rechecks receipt and asset failures after an over-budget history is warm', () => {
  const state = history(33000)
  assertLedger(state)
  assertLedger(state)
  const broken = state.receipts.at(-1)!
  const signature = broken.signature
  Object.assign(broken, {signature:'{broken'})
  expect(() => assertLedger(state)).toThrow(SyntaxError)
  Object.assign(broken, {signature})
  Object.assign(state.supplierPrepayments[0]!, {remainingFen:199})
  expect(() => assertLedger(state)).toThrow('SUPPLIER_HISTORY_MISMATCH')
})
