import { expect,it,beforeAll } from 'vitest'
import { createOperationsFixture } from '../testing/operations-fixture.ts'
import { hashValue } from '../core/hash.ts'
import oldWorld from '../../goal-1/evidence/t05-clock-technical_employee-initial.json?raw'

const f=createOperationsFixture();let saved=''
beforeAll(()=>{let run=f.apply(f.run,'DiscoverBusiness',{definitionId:'fixture-company'});const b=run.operations?.businesses[0];if(!b)throw new Error('business expected');run=f.apply(run,'FundBusiness',{businessId:b.id,amountFen:800000});run=f.apply(run,'PrepareBusiness',{businessId:b.id});run=f.apply(run,'ActivateBusiness',{businessId:b.id});run=f.apply(run,'HireWorker',{businessId:b.id,definitionId:'editor-lin'});const worker=run.operations?.workers[0];if(!worker)throw new Error('worker expected');run=f.apply(run,'AcceptContract',{businessId:b.id,offerId:'fixture-offer-one',resources:[worker.id],startAt:'2020-01-02'});saved=f.codec.export(run)},20000)
it.each(['foreign-account','missing-job-start','missing-job-finish','forged-output','inflated-worker','duplicate-offer','changed-catalog'])('rejects a resigned inconsistent operations save: %s',(variant)=>{
 const raw=JSON.parse(saved)

 if(variant==='foreign-account')raw.state.operations.businesses[0].accountId='world'
 if(variant==='missing-job-start'||variant==='missing-job-finish')raw.state.timeline.pending=raw.state.timeline.pending.filter((event:{payload:{kind:string;type?:string}})=>event.payload.kind!=='operating_event'||event.payload.type!==(variant==='missing-job-start'?'start_job':'finish_job'))
 if(variant==='forged-output'){raw.state.operations.jobs[0].status='completed';raw.state.operations.jobs[0].outputId='free-output'}
 if(variant==='inflated-worker')raw.state.operations.workers[0].units=1000
 if(variant==='duplicate-offer')raw.state.operations.contracts.push({...raw.state.operations.contracts[0],id:'duplicate-contract'})
 if(variant==='changed-catalog')raw.state.operations.catalogHash='0'.repeat(64)
 const {checksum:ignored,...body}=raw;expect(ignored).toBeTruthy();raw.checksum=hashValue(body);expect(()=>f.codec.import(JSON.stringify(raw))).toThrow();expect(f.codec.export(f.codec.import(saved))).toBe(saved)
})
it('refuses a preserved schema2 save explicitly',()=>{expect(()=>createOperationsFixture().codec.import(oldWorld)).toThrow('UNSUPPORTED_SCHEMA_VERSION')})
