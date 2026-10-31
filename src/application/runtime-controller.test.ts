import {afterEach,expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec,createCampaignRun} from './campaign.ts'
import {GameController} from './game-controller.ts'
import {RuntimeGameController} from './runtime-client.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {createRuntimeHarness} from '../testing/runtime-harness.ts'
import {evaluateCommand} from '../core/commands.ts'
import {record} from './runtime-protocol.ts'

const codec=createCampaignCodec(),raw=codec.export(createCampaignRun({runId:'runtime-normal',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'runtime-normal',playerProfile:{wishId:'autonomy',approach:'free'}}))
const cleanups:(()=>Promise<void>)[]=[]
afterEach(async()=>{for(const close of cleanups.splice(0).reverse())await close()})
async function open(abort=false){
 const factory=new IDBFactory(),locks=new MemoryWriterAccess(),name='runtime-'+globalThis.crypto.randomUUID(),fault=abortAfterHeadWrite(factory,name,row=>(row as {envelope?:{revision?:number}}).envelope?.revision===2)
 const physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name}),harnesses:ReturnType<typeof createRuntimeHarness>[]=[],instances:GameController[]=[]
 const transport=()=>{
  const h=createRuntimeHarness(async()=>{
   const localCodec=createCampaignCodec(),store=new IndexedDbRunStore({codec:localCodec,factory:abort?fault.factory:factory,keyRange:IDBKeyRange,name})
   const controller=new GameController({codec:localCodec,store,locks});instances.push(controller)
   return {controller,diagnostics:abort?{name,trace:fault.trace}:null}
  });harnesses.push(h);return h.transport
 }
 const c=new RuntimeGameController(transport);await c.ready();await c.initialize();await c.importNew(raw)
 cleanups.push(async()=>{for(const h of harnesses){h.setHold(()=>false);h.release()}await c.close(true);for(const h of harnesses)await h.close();await physical.close()})
 return {c,transport,physical,fault,harnesses,instances,h:harnesses[0]!}
}
it('moves the real original command through the host and publishes the exact durable outcome',async()=>{
 const h=await open(),command=h.c.prepare('WorkQuarter',{}),before=await h.c.exportSavedAsync(),expected=evaluateCommand(codec.import(before),command,codec.registry,'player')
 expect(expected.status).toBe('proposed');if(expected.status!=='proposed')throw Error('fixture command refused')
 const pending=h.c.submit(command);expect(h.c.snapshot.busy).toBe(true);expect(h.c.snapshot.view!.revision).toBe(1)
 expect((await pending).status).toBe('saved');expect(h.c.snapshot.view).toMatchObject({revision:2,budget:{spent:2}})
 expect(await h.c.exportSavedAsync()).toBe(codec.export(expected.nextRun));expect((await h.c.submit(command)).status).toBe('duplicate')
 expect(codec.import(await h.c.exportSavedAsync()).receipts.filter(r=>r.kind==='WorkQuarter')).toHaveLength(1)
})
it('retains a real put-success abort, opaque candidate and the original retry without a second command',async()=>{
 const h=await open(true),before=await h.c.exportSavedAsync(),result=await h.c.submit(h.c.prepare('WorkQuarter',{}))
 expect(result.status).toBe('unsaved');expect(h.fault.trace).toEqual({writeSucceeded:true,abortIssued:true})
 expect(h.c.snapshot.view).toMatchObject({revision:1,hasCandidate:true,pendingRevision:2,budget:{spent:0}})
 expect(await h.c.exportSavedAsync()).toBe(before);expect(codec.export((await h.physical.load('runtime-normal'))!.run)).toBe(before)
 const candidate=h.c.exportCandidate();expect(candidate).toBe(await h.c.exportCandidateAsync())
 expect((await h.c.retry()).status).toBe('saved');expect(await h.c.exportSavedAsync()).toBe(candidate)
 expect(h.c.snapshot.view).toMatchObject({revision:2,hasCandidate:false});expect(codec.import(candidate).receipts.filter(r=>r.kind==='WorkQuarter')).toHaveLength(1)
 expect(await h.physical.exportStored('runtime-normal',true)).toBe(before)
})
it('keeps an actual second session read-only without granting authority through preview or submission',async()=>{
 const h=await open(),reader=new RuntimeGameController(h.transport);await reader.ready();await reader.initialize();await reader.continueLife('runtime-normal')
 cleanups.push(()=>reader.close(true))
 expect(reader.snapshot.view).toMatchObject({readOnly:true,readOnlyReason:'ANOTHER_WRITER',revision:1})
 const command=reader.prepare('WorkQuarter',{});expect((await reader.previewAsync(command)).reasonCodes).toEqual(['READ_ONLY_SESSION'])
 expect((await reader.submit(command)).status).toBe('rejected');expect(await reader.exportSavedAsync()).toBe(raw)
})
it('ignores a retired preview response after another actual revision becomes current',async()=>{
 const h=await open();let readId=0
 h.h.setHold(value=>record(value)&&value.kind==='response'&&value.id===readId)
 const held=h.h.next(value=>record(value)&&value.kind==='response'&&value.id===readId)
 const outcome=h.c.previewAsync(h.c.prepare('WorkQuarter',{})).then(()=>'',error=>error.message)
 readId=(h.h.inbound.at(-1) as {id:number}).id;await held
 expect((await h.c.submit(h.c.prepare('WorkQuarter',{}))).status).toBe('saved')
 h.h.release();expect(await outcome).toBe('RUNTIME_SCOPE_EXPIRED');expect(h.c.snapshot.view!.revision).toBe(2)
})
it('does not resolve a saved RPC before the corresponding public snapshot has arrived',async()=>{
 const h=await open();h.h.setHold(value=>record(value)&&value.kind==='snapshot'&&record(value.state)&&record(value.state.view)&&value.state.view.revision===2)
 const response=h.h.next(value=>record(value)&&value.kind==='response'&&value.ok===true)
 let settled=false;const pending=h.c.submit(h.c.prepare('WorkQuarter',{})).then(value=>{settled=true;return value})
 await response;expect(settled).toBe(false);expect(h.c.snapshot.view!.revision).toBe(1)
 expect((await h.physical.load('runtime-normal'))!.run.revision).toBe(2)
 h.h.release();expect((await pending).status).toBe('saved');expect(h.c.snapshot.view!.revision).toBe(2)
})
it('rejects old-session prepared commands even after the same run is reopened at the same revision',async()=>{
 const h=await open(),old=h.c.prepare('WorkQuarter',{});await h.c.home();await h.c.continueLife('runtime-normal')
 expect(()=>h.c.submit(old)).toThrow('RUNTIME_SCOPE_EXPIRED');expect(await h.c.exportSavedAsync()).toBe(raw)
 const wrong={...h.c.prepare('WorkQuarter',{}),actorId:'other'}
 expect((await h.c.submit(wrong)).reasonCodes).toContain('FORBIDDEN_ACTOR');expect(await h.c.exportSavedAsync()).toBe(raw)
})
it('blocks replayed transport IDs and unknown methods without mutating or rebooting the owner',async()=>{
 const h=await open(),before=await h.c.exportSavedAsync(),last=h.h.inbound.at(-1) as Record<string,unknown>
 const duplicate=h.h.next(value=>record(value)&&value.kind==='response'&&value.error==='RUNTIME_REQUEST_REUSED')
 h.h.transport.postMessage(last);await duplicate
 const rejected=h.h.next(value=>record(value)&&value.kind==='response'&&value.error==='RUNTIME_METHOD_NOT_ALLOWED')
 h.h.transport.postMessage({...last,id:9999,method:'constructor',args:[]});await rejected
 expect(h.instances).toHaveLength(1);expect(await h.c.exportSavedAsync()).toBe(before)
})
it('keeps captured candidate text after a transport failure and requires explicit discard before a physical reload',async()=>{
 const h=await open(true);expect((await h.c.submit(h.c.prepare('WorkQuarter',{}))).status).toBe('unsaved')
 const candidate=h.c.exportCandidate();h.h.fail();await h.h.close()
 expect(h.c.runtimeFailed).toBe(true);expect(h.c.snapshot.view).toMatchObject({revision:1,hasCandidate:true})
 expect(await h.c.exportCandidateAsync()).toBe(candidate);await expect(h.c.retry()).rejects.toThrow('RUNTIME_UNAVAILABLE')
 await expect(h.c.reload()).rejects.toThrow('UNSAVED_CANDIDATE_EXISTS')
 await h.c.reload(true);expect(await h.c.exportSavedAsync()).toBe(raw);expect(h.c.snapshot.view).toMatchObject({revision:1,hasCandidate:false})
})
it('coalesces the same in-flight original command and rejects accessors before transport cloning',async()=>{
 const h=await open(),command=h.c.prepare('WorkQuarter',{})
 const results=await Promise.all([h.c.submit(command),h.c.submit({...command})]);expect(results.every(r=>r.status==='saved')).toBe(true)
 const saved=await h.c.exportSavedAsync();expect(codec.import(saved).receipts.filter(r=>r.kind==='WorkQuarter')).toHaveLength(1)
 let invoked=false;const payload={};Object.defineProperty(payload,'resource',{enumerable:true,get(){invoked=true;return 'player-production'}})
 const count=h.h.inbound.length
 await expect(h.c.previewAsync({...h.c.prepare('WorkQuarter',{}),payload})).rejects.toThrow('INVALID_JSON_VALUE')
 expect(invoked).toBe(false);expect(h.h.inbound).toHaveLength(count);expect(await h.c.exportSavedAsync()).toBe(saved)
})
it('reads the physical outcome after losing a completed write reply without re-executing that command',async()=>{
 const h=await open(),command=h.c.prepare('WorkQuarter',{});let writeId=0
 h.h.setHold(value=>record(value)&&(value.kind==='snapshot'&&record(value.state)&&record(value.state.view)&&value.state.view.revision===2||value.kind==='response'&&value.id===writeId))
 const response=h.h.next(value=>record(value)&&value.kind==='response'&&value.id===writeId)
 const outcome=h.c.submit(command).then(()=>'',error=>error.message);writeId=(h.h.inbound.at(-1) as {id:number}).id
 await response;expect(h.c.snapshot.view!.revision).toBe(1);h.h.fail();await h.h.close()
 expect(await outcome).toBe('RUNTIME_UNAVAILABLE');expect(h.c.runtimeWriteUncertain).toBe(true)
 expect(h.c.snapshot.busy).toBe(false);expect(h.c.snapshot.view!.busy).toBe(false)
 const physical=codec.export((await h.physical.load('runtime-normal'))!.run)
 await h.c.initialize();expect(h.c.runtimeWriteUncertain).toBe(false);expect(await h.c.exportSavedAsync()).toBe(physical)
 expect(h.c.snapshot.view!.revision).toBe(2);expect(codec.import(physical).receipts.filter(r=>r.kind==='WorkQuarter')).toHaveLength(1)
 expect(()=>h.c.submit(command)).toThrow('RUNTIME_SCOPE_EXPIRED')
})
it('freezes the channel on an invalid public result instead of accepting a fabricated permission',async()=>{
 const h=await open();let readId=0
 h.h.setHold(value=>record(value)&&value.kind==='response'&&value.id===readId)
 const held=h.h.next(value=>record(value)&&value.kind==='response'&&value.id===readId)
 const result=h.c.previewAsync(h.c.prepare('WorkQuarter',{})).then(()=>'',error=>error.message);readId=(h.h.inbound.at(-1) as {id:number}).id
 const response=await held as Record<string,unknown>
 h.h.inject({...response,result:{allowed:true,reasonCodes:[],actionPoints:-1,upfrontCostFen:0,releasedFen:0}})
 expect(await result).toBe('RUNTIME_INVALID_RESPONSE');expect(h.c.runtimeFailed).toBe(true)
 expect(h.c.snapshot.view!.revision).toBe(1);expect(codec.export((await h.physical.load('runtime-normal'))!.run)).toBe(raw)
})
it('settles an unanswered reading when the original owner closes, without accepting its later reply',async()=>{
 const h=await open();let readId=0,settled='pending'
 h.h.setHold(value=>record(value)&&value.kind==='response'&&value.id===readId)
 const held=h.h.next(value=>record(value)&&value.kind==='response'&&value.id===readId)
 const reading=h.c.previewAsync(h.c.prepare('WorkQuarter',{})).then(()=>{settled='accepted'},error=>{settled=error.message})
 readId=(h.h.inbound.at(-1) as {id:number}).id;await held
 expect(h.c.readingCount).toBe(1);await h.c.close(true)
 await Promise.resolve();expect(settled).toBe('SESSION_CLOSED');expect(h.c.readingCount).toBe(0)
 h.h.release();await reading
 expect(settled).toBe('SESSION_CLOSED');expect(codec.export((await h.physical.load('runtime-normal'))!.run)).toBe(raw)
})
