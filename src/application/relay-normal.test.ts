import {expect,it} from 'vitest'
import {replayNormalRelay} from '../testing/normal-relay-scenario.ts'
it.each(['technical_employee','content_employee'])('reaches and settles S03 from a normal %s 2020 opening with actual supply and mixed payment terms',profile=>{
 const r=replayNormalRelay(profile);expect(r.result.origin).toBe('normal');expect(r.run.economy.ledger.receipts.filter(r=>r.kind==='opening_cash')).toHaveLength(1);expect(r.result.customers).toBe(6);expect(r.result.postpaidCustomers).toBe(2);expect(r.result.meters).toBe(168);expect(r.result.salaryPayments).toBe(57);expect(r.result.servicePeriodStatus).toBe('closed');expect(r.result.business.receivableFen).toBe(0);expect(r.result.business.payableFen).toBe(0);expect(r.result.business.prepaidLiabilityFen).toBeGreaterThan(0);expect(r.result.applicationAttempts).toBeGreaterThan(0);expect(r.run.relay!.changes.some(c=>c.anchorId==='H009')).toBe(true);expect(r.result.audits).toBeGreaterThan(0)
},120000)
