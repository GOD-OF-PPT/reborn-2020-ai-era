import {beforeAll,expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {replayRelayF04} from '../testing/relay-scenarios.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {RunSession} from './session.ts'
let scenario:ReturnType<typeof replayRelayF04>
beforeAll(()=>{scenario=replayRelayF04()},60000)
it.each(['recharge','usage'])('keeps %s and its ledger private on an actual write-then-abort and retries the same proposed save',async kind=>{
 const r=scenario,codec=r.h.codec,initial=codec.import(kind==='recharge'?r.beforeRecharge:r.beforeService),factory=new IDBFactory(),name='t12-atomic-'+kind,store=new IndexedDbRunStore({name,factory,keyRange:IDBKeyRange,codec});await store.importSave(codec.export(initial),{mode:'create',actorId:'player',importId:'seed'});const fault=abortAfterHeadWrite(factory,name),failing=new IndexedDbRunStore({name,factory:fault.factory,keyRange:IDBKeyRange,codec}),session=await RunSession.open({store:failing,codec,registry:codec.registry,locks:new MemoryWriterAccess(),runId:initial.runId,actorId:'player'}),command={runId:initial.runId,actorId:'player',commandId:'atomic-relay-'+kind,expectedRevision:initial.revision,kind:kind==='recharge'?'RechargeRelayCustomer':'AdvanceTime',payload:kind==='recharge'?{customerId:r.customer.id,amountFen:4000000}:{date:'2025-01-09'}},before=codec.export(initial),cash=session.view.accounts[0]!.cashFen
 expect((await session.submit(command)).status).toBe('unsaved');expect(session.exportSaved()).toBe(before);expect(session.view.accounts[0]!.cashFen).toBe(cash);const candidate=session.exportCandidate(),proposed=codec.import(candidate);expect(kind==='recharge'?proposed.relay!.recharges.length:proposed.relay!.meters.length).toBe(1);expect((await store.load(initial.runId))!.run).toEqual(initial);expect((await session.retry()).status).toBe('saved');expect(session.exportSaved()).toBe(candidate);expect((await session.submit(command)).status).toBe('duplicate');await session.close();await failing.close();await store.close()
},60000)
