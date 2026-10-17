import { expect, it } from 'vitest'
import { createLedger, applyLedger, accountPosition, metricsFor, assertLedger } from './ledger.ts'
import { parseLedgerOperation } from './record-schemas.ts'
const stamp=(id:string,date='2025-01-01')=>({id,date,sourceEventId:'relay-bill',businessId:'relay',accountId:'personal'})
const initial=()=>applyLedger(createLedger([{id:'personal',kind:'personal'},{id:'world',kind:'external'}],'2025-01-01'),{...stamp('opening'),kind:'opening_cash',counterpartyId:'world',amountFen:100000})
it('keeps supplier credit cost and due date separate, reverses unpaid first and restores paid credit as an asset',()=>{
 let l=initial();const bill=parseLedgerOperation({...stamp('usage'),kind:'incur_supplier_usage',counterpartyId:'world',prepaymentId:'supplier',obligationId:'invoice',amountFen:60000,dueAt:'2025-01-08'});l=applyLedger(l,bill)
 expect(accountPosition(l,'personal')).toMatchObject({cashFen:100000,payableFen:60000,supplierPrepaidFen:0});expect(metricsFor(l,'personal','relay').costFen).toBe(60000)
 l=applyLedger(l,{...stamp('pay'),kind:'pay_obligation',obligationId:'invoice',amountFen:40000})
 l=applyLedger(l,parseLedgerOperation({...stamp('correct1'),kind:'reverse_supplier_usage',referenceId:'usage',prepaymentId:'supplier',amountFen:30000}))
 expect(accountPosition(l,'personal')).toMatchObject({cashFen:60000,payableFen:0,supplierPrepaidFen:10000});expect(metricsFor(l,'personal','relay').costFen).toBe(30000)
 const correction=parseLedgerOperation({...stamp('correct2'),kind:'reverse_supplier_usage',referenceId:'usage',prepaymentId:'supplier',amountFen:10000});l=applyLedger(l,correction);expect(applyLedger(l,correction)).toEqual(l)
 expect(()=>applyLedger(l,parseLedgerOperation({...stamp('overcorrect'),kind:'reverse_supplier_usage',referenceId:'usage',prepaymentId:'supplier',amountFen:20001}))).toThrow('SUPPLIER_CORRECTION_EXCEEDS_SOURCE')
 const refund=parseLedgerOperation({...stamp('credit-refund'),kind:'refund_supplier',prepaymentId:'supplier',amountFen:20000});l=applyLedger(l,refund)
 expect(accountPosition(l,'personal')).toMatchObject({cashFen:80000,payableFen:0,supplierPrepaidFen:0});expect(metricsFor(l,'personal','relay').costFen).toBe(20000)
})
it('reverses actual supplier prepayment consumption without creating cash or profit twice',()=>{
 let l=initial();l=applyLedger(l,{...stamp('topup'),kind:'supplier_prepay',counterpartyId:'world',prepaymentId:'supplier',amountFen:50000});l=applyLedger(l,{...stamp('consume'),kind:'consume_supplier',prepaymentId:'supplier',amountFen:30000})
 l=applyLedger(l,parseLedgerOperation({...stamp('correct'),kind:'reverse_supplier_usage',referenceId:'consume',prepaymentId:'supplier',amountFen:10000}));expect(accountPosition(l,'personal')).toMatchObject({cashFen:50000,supplierPrepaidFen:30000});expect(metricsFor(l,'personal','relay').costFen).toBe(20000)
 expect(()=>assertLedger({...l,supplierPrepayments:l.supplierPrepayments.map(p=>({...p,paidFen:p.paidFen+1,remainingFen:p.remainingFen+1}))})).toThrow('SUPPLIER_HISTORY_MISMATCH')
 expect(()=>applyLedger(l,parseLedgerOperation({...stamp('foreign'),kind:'reverse_supplier_usage',referenceId:'consume',prepaymentId:'other-supplier',amountFen:1}))).toThrow('INVALID_SUPPLIER_CORRECTION_SOURCE')
})
it('uses actual supplier credit to settle a later invoice and reverses only its actual unpaid or credited portions',()=>{
 let l=initial();l=applyLedger(l,parseLedgerOperation({...stamp('bill'),kind:'incur_supplier_usage',counterpartyId:'world',prepaymentId:'supplier',obligationId:'bill-due',amountFen:60000,dueAt:'2025-01-08'}));l=applyLedger(l,{...stamp('prepay'),kind:'supplier_prepay',counterpartyId:'world',prepaymentId:'supplier',amountFen:20000});l=applyLedger(l,parseLedgerOperation({...stamp('offset'),kind:'settle_supplier_credit',prepaymentId:'supplier',obligationId:'bill-due',referenceId:'bill',amountFen:20000}));expect(accountPosition(l,'personal')).toMatchObject({cashFen:80000,supplierPrepaidFen:0,payableFen:40000});expect(metricsFor(l,'personal','relay').costFen).toBe(60000);l=applyLedger(l,{...stamp('pay'),kind:'pay_obligation',obligationId:'bill-due',amountFen:30000});l=applyLedger(l,parseLedgerOperation({...stamp('correction'),kind:'reverse_supplier_usage',referenceId:'bill',prepaymentId:'supplier',amountFen:20000}));expect(accountPosition(l,'personal')).toMatchObject({cashFen:50000,supplierPrepaidFen:10000,payableFen:0});expect(metricsFor(l,'personal','relay').costFen).toBe(40000)
})
