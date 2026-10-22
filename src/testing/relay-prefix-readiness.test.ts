import {expect,it} from 'vitest'
import {relayAdapterProof,relayPeriodFeeProof} from './relay-prefix-readiness.ts'

it('requires a positive income entry for this period and business, never a meter, future amount or another company',()=>{
 const correct={sourceEventId:'period-1',businessId:'business-1',kind:'income',deltaFen:50000,date:'2025-01-01'}
 const entries=[correct,{...correct,sourceEventId:'meter-1'},{...correct,businessId:'business-2'},
  {...correct,kind:'cost'},{...correct,deltaFen:0},{...correct,deltaFen:-1},{...correct,date:'2025-01-02'}]
 expect(relayPeriodFeeProof(entries,'period-1','business-1','2025-01-01')).toEqual([correct])
 expect(relayPeriodFeeProof(entries,'period-2','business-1','2025-01-01')).toEqual([])
})

it('requires the initial adapter to be the same completed, read and approved supplier application',()=>{
 const application={businessId:'business-1',supplierId:'cedar-direct',jobId:'application-job',read:true,approved:true}
 const adapter={businessId:'business-1',supplierId:'cedar-direct',jobId:'application-job',kind:'initial_verification',job:{status:'completed',completeAt:'2024-04-09'}}
 expect(relayAdapterProof(adapter,application,'2025-01-01')).toBe(true)
 expect(relayAdapterProof({...adapter,jobId:'another-job'},application,'2025-01-01')).toBe(false)
 expect(relayAdapterProof(adapter,{...application,read:false},'2025-01-01')).toBe(false)
 expect(relayAdapterProof(adapter,{...application,approved:null},'2025-01-01')).toBe(false)
 expect(relayAdapterProof({...adapter,businessId:'other'},application,'2025-01-01')).toBe(false)
 expect(relayAdapterProof({...adapter,supplierId:'harbor-independent'},application,'2025-01-01')).toBe(false)
 expect(relayAdapterProof({...adapter,job:{status:'running',completeAt:'2024-04-09'}},application,'2025-01-01')).toBe(false)
 expect(relayAdapterProof(adapter,application,'2024-04-08')).toBe(false)
 expect(relayAdapterProof({...adapter,kind:'migration',jobId:'separate-paid-adapter'},application,'2025-01-01')).toBe(true)
})
