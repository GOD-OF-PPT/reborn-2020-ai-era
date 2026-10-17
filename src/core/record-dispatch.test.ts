import {expect,it} from 'vitest'
import {ledgerOperationSchema,economyOperationSchema,parseLedgerOperation,parseEconomyOperation} from './record-schemas.ts'
import {replayRelayF04} from '../testing/relay-scenarios.ts'
it('preserves strict union acceptance and canonical output for actual journals and corrupted discriminator payloads',()=>{
 const r=replayRelayF04(),operations=[...r.h.run.economy.receipts.map(r=>JSON.parse(r.signature)),...r.h.run.economy.ledger.receipts.map(r=>JSON.parse(r.signature))]
 for(const op of operations){const accepted=economyOperationSchema.safeParse(op);expect(accepted.success).toBe(true);if(accepted.success)expect(parseEconomyOperation(op)).toEqual(accepted.data);if(ledgerOperationSchema.safeParse(op).success)expect(parseLedgerOperation(op)).toEqual(ledgerOperationSchema.parse(op))}
 const base={id:'entry',sourceEventId:'known',date:'2025-01-01',accountId:'personal',businessId:'relay',contractId:'customer',amountFen:1,referenceId:'original'}
 for(const value of [{...base,kind:'refund_delivered',settlement:'cash'},{...base,kind:'refund_delivered',settlement:'receivable',reservationId:'not-permitted'},{...base,kind:'consume_supplier',prepaymentId:'supplier',amountFen:-1},{...base,kind:'income',counterpartyId:'world',unexpected:true},{...base,kind:'unregistered'},{...base,kind:42}]){expect(economyOperationSchema.safeParse(value).success).toBe(false);expect(()=>parseEconomyOperation(value)).toThrow();expect(()=>parseLedgerOperation(value)).toThrow()}
 expect(()=>parseLedgerOperation({kind:'execute_action',id:'execute',date:'2025-01-01',sourceEventId:'known',actionId:'reserved'})).toThrow('INVALID_LEDGER_OPERATION')
},60000)
