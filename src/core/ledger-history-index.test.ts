import {beforeAll,expect,it} from 'vitest'
import {applyLedger,assertLedger,createLedger,type LedgerState} from './ledger.ts'
// A real internal ledger call with many distinct invoices. Property-read counting
// checks work growth without a machine-time threshold; external JSON guards are separate.
let history:LedgerState
beforeAll(()=>{history=createLedger([{id:'personal',kind:'personal'},{id:'world',kind:'external'}],'2021-01-01');for(let n=0;n<80;n++)history=applyLedger(history,{id:'invoice-op-'+n,kind:'incur_supplier_usage',date:'2021-01-01',sourceEventId:'usage-'+n,accountId:'personal',businessId:'relay',counterpartyId:'world',prepaymentId:'supplier-pool',obligationId:'invoice-'+n,amountFen:100,dueAt:'2021-01-08'})})
it('validates every original supplier invoice without rescanning the obligation list for each one',()=>{let reads=0;const state={...history,obligations:history.obligations.map(o=>({...o,get id(){reads++;return o.id}}))};expect(()=>assertLedger(state)).not.toThrow();expect(reads).toBeLessThanOrEqual(history.obligations.length*12);expect(history.obligations).toHaveLength(80)})
it('rejects a changed unpaid invoice even after the same object was successfully checked before',()=>{const state=structuredClone(history);assertLedger(state);Object.assign(state.obligations[0]!,{remainingFen:99});expect(()=>assertLedger(state)).toThrow('SUPPLIER_INVOICE_HISTORY_MISMATCH')})
it('preserves any-match history semantics until the original duplicate-obligation guard rejects the malformed input',()=>{const original=history.obligations[0]!,state={...history,obligations:[...history.obligations,{...original,remainingFen:0}]};expect(()=>assertLedger(state)).toThrow('OBLIGATION_ID_REUSED')})
it('rejects an absent invoice instead of accepting another invoice with the same amount',()=>{const state={...history,obligations:history.obligations.slice(1)};expect(()=>assertLedger(state)).toThrow('SUPPLIER_INVOICE_HISTORY_MISMATCH')})
