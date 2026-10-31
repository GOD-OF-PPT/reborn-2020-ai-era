import {afterEach,expect,it,vi} from 'vitest'
import {IDBFactory,IDBKeyRange,IDBObjectStore as FakeObjectStore} from 'fake-indexeddb'
import {createCampaignCodec,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand} from '../core/commands.ts'
import type {CommandEnvelope,GameRun,ProposedRun} from '../core/run-types.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {IndexedDbRunStore,type CommitResult} from './indexeddb.ts'

type Checkpoint={readonly baseRun:GameRun;readonly previousRun:GameRun;readonly proposal:ProposedRun;readonly commands:readonly CommandEnvelope[]}
const cleanups:(()=>Promise<void>)[]=[]
afterEach(async()=>{vi.restoreAllMocks();for(const close of cleanups.splice(0))await close()})

async function setup(abort=false){
 const codec=createCampaignCodec(),factory=new IDBFactory(),name='checkpoint-'+crypto.randomUUID()
 const fault=abortAfterHeadWrite(factory,name,row=>(row as {envelope?:{revision?:number}}).envelope?.revision===3)
 const physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 const initial=createCampaignRun({runId:'wait-checkpoint',actorId:'player',commandId:'checkpoint-create',seed:'checkpoint-normal-v1',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
 await physical.create(initial)
 const store=new IndexedDbRunStore({codec,factory:abort?fault.factory:factory,keyRange:IDBKeyRange,name})
 const commands:CommandEnvelope[]=[],proposals:ProposedRun[]=[];let run=initial
 for(const date of ['2020-01-02','2020-01-03']){
  const command:CommandEnvelope={runId:run.runId,actorId:run.actorId,commandId:'checkpoint-step-'+(commands.length+1),expectedRevision:run.revision,kind:'AdvanceTime',payload:{date}}
  const result=evaluateCommand(run,command,codec.registry,run.actorId)
  if(result.status!=='proposed')throw Error('ORIGINAL_NORMAL_COMMAND_REQUIRED:'+result.status)
  commands.push(command);proposals.push(result);run=result.nextRun
 }
 cleanups.push(async()=>{await store.close();await physical.close()})
 const checkpoint:Checkpoint={baseRun:initial,previousRun:proposals[0]!.nextRun,proposal:proposals[1]!,commands}
 return {codec,physical,store,checkpoint,proposals,fault,factory,name}
}

/** Before the feature exists, use the real original commits as a control.
 * This produces valid game history while exposing its extra physical writes.
 */
async function commitCheckpoint(store:IndexedDbRunStore,checkpoint:Checkpoint,proposals:readonly ProposedRun[],generation=1):Promise<CommitResult>{
 const capable:IndexedDbRunStore&{commitCheckpoint?:(checkpoint:Checkpoint,generation:number)=>Promise<CommitResult>}=store
 if(capable.commitCheckpoint)return capable.commitCheckpoint(checkpoint,generation)
 let committed:CommitResult|null=null
 for(const proposal of proposals){committed=await store.commit(proposal,generation);generation=committed.record.generation}
 if(!committed)throw Error('ORIGINAL_COMMIT_REQUIRED')
 return committed
}

it('stores two original time commands with one physical head write and at most final/backup encoding',async()=>{
 const h=await setup(),originalPut=FakeObjectStore.prototype.put;let writes=0
 vi.spyOn(FakeObjectStore.prototype,'put').mockImplementation(function(this:IDBObjectStore,...args:Parameters<IDBObjectStore['put']>){if(this.name==='heads')writes++;return originalPut.apply(this,args)})
 const encoding=vi.spyOn(h.codec,'prepare'),result=await commitCheckpoint(h.store,h.checkpoint,h.proposals)
 expect(result.record.run.revision).toBe(3);expect(result.record.generation).toBe(3)
 expect(writes).toBe(1);expect(encoding.mock.calls.length).toBeLessThanOrEqual(2)
})

it('keeps the complete original run, immediate logical backup, receipts and cause-log bundle',async()=>{
 const h=await setup(),result=await commitCheckpoint(h.store,h.checkpoint,h.proposals)
 expect(h.codec.export(result.record.run)).toBe(h.codec.export(h.checkpoint.proposal.nextRun))
 const loaded=await h.physical.load(h.checkpoint.baseRun.runId),backup=await h.physical.loadBackup(h.checkpoint.baseRun.runId)
 expect(loaded!.generation).toBe(3);expect(backup!.generation).toBe(2)
 expect(h.codec.export(loaded!.run)).toBe(h.codec.export(h.checkpoint.proposal.nextRun))
 expect(h.codec.export(backup!.run)).toBe(h.codec.export(h.checkpoint.previousRun))
 expect(loaded!.run.receipts.map(row=>row.commandId)).toEqual(['checkpoint-create','checkpoint-step-1','checkpoint-step-2'])
})

it('rolls the entire checkpoint back after the final head.put succeeds then the transaction aborts',async()=>{
 const h=await setup(true),before=await h.physical.exportStored(h.checkpoint.baseRun.runId)
 await expect(commitCheckpoint(h.store,h.checkpoint,h.proposals)).rejects.toThrow('SAVE_ABORTED')
 expect(h.fault.trace).toEqual({writeSucceeded:true,abortIssued:true})
 expect(await h.physical.exportStored(h.checkpoint.baseRun.runId)).toBe(before)
 expect((await h.physical.load(h.checkpoint.baseRun.runId))!.run.revision).toBe(1)
 expect(await h.physical.loadBackup(h.checkpoint.baseRun.runId)).toBeNull()
})

it('rejects a source/command mismatch before changing any physical data',async()=>{
 const h=await setup(),before=await h.physical.exportStored(h.checkpoint.baseRun.runId)
 const commands=h.checkpoint.commands.map((command,index)=>index===0?{...command,actorId:'another-player'}:command)
 await expect(commitCheckpoint(h.store,{...h.checkpoint,commands},h.proposals)).rejects.toThrow()
 expect(await h.physical.exportStored(h.checkpoint.baseRun.runId)).toBe(before)
})

it('rejects a missing logical command rather than accepting a revision jump',async()=>{
 const h=await setup(),before=await h.physical.exportStored(h.checkpoint.baseRun.runId)
 await expect(commitCheckpoint(h.store,{...h.checkpoint,commands:h.checkpoint.commands.slice(1)},h.proposals)).rejects.toThrow()
 expect(await h.physical.exportStored(h.checkpoint.baseRun.runId)).toBe(before)
})

it('keeps the original single-step backup wire while enforcing the checkpoint base identity',async()=>{
 const h=await setup(),single:Checkpoint={baseRun:h.checkpoint.baseRun,previousRun:h.checkpoint.baseRun,proposal:h.proposals[0]!,commands:h.checkpoint.commands.slice(0,1)}
 const before=await h.physical.exportStored(single.baseRun.runId),encoding=vi.spyOn(h.codec,'prepare')
 const result=await commitCheckpoint(h.store,single,h.proposals.slice(0,1))
 expect(result.record.run.revision).toBe(2);expect(encoding.mock.calls).toHaveLength(1)
 expect(await h.physical.exportStored(single.baseRun.runId,true)).toBe(before)
})

it('rejects a mismatched base even for one original logical step',async()=>{
 const h=await setup(),before=await h.physical.exportStored(h.checkpoint.baseRun.runId),wrong={...h.checkpoint.baseRun,privateNotes:'isolated mismatched source'}
 const single:Checkpoint={baseRun:wrong,previousRun:wrong,proposal:h.proposals[0]!,commands:h.checkpoint.commands.slice(0,1)}
 await expect(commitCheckpoint(h.store,single,h.proposals.slice(0,1))).rejects.toThrow('WAIT_CHECKPOINT_PREFIX_MISMATCH')
 expect(await h.physical.exportStored(single.baseRun.runId)).toBe(before)
})

it('reads an original duplicate and a later saved head without overwriting either',async()=>{
 const h=await setup();await commitCheckpoint(h.store,h.checkpoint,h.proposals)
 const after=h.checkpoint.proposal.nextRun,command:CommandEnvelope={runId:after.runId,actorId:after.actorId,commandId:'later-private-note',expectedRevision:after.revision,kind:'SetPrivateNote',payload:{text:'a later actual note'}}
 const proposal=evaluateCommand(after,command,h.codec.registry,after.actorId)
 if(proposal.status!=='proposed')throw Error('ORIGINAL_NOTE_COMMAND_REQUIRED')
 await h.physical.commit(proposal,3)
 const before=await h.physical.exportStored(after.runId),result=await commitCheckpoint(h.store,h.checkpoint,h.proposals)
 expect(result.duplicate).toBe(true);expect(result.record.run.revision).toBe(4);expect(result.record.generation).toBe(4)
 expect(await h.physical.exportStored(after.runId)).toBe(before)
 expect((await h.physical.load(after.runId))!.run.privateNotes).toBe('a later actual note')
})

async function corrupt(h:Awaited<ReturnType<typeof setup>>,storeName:'receipts'|'logs',change:(store:IDBObjectStore)=>void){
 const database=await new Promise<IDBDatabase>((resolve,reject)=>{const request=h.factory.open(h.name,1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})
 try{await new Promise<void>((resolve,reject)=>{const tx=database.transaction(storeName,'readwrite');tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);change(tx.objectStore(storeName))})}finally{database.close()}
}

it('preserves an orphan range row as a failure instead of silently repairing the bundle',async()=>{
 const h=await setup(),before=await h.physical.exportStored(h.checkpoint.baseRun.runId),receipt=h.proposals[0]!.receipt
 await corrupt(h,'receipts',store=>{store.put({runId:receipt.runId,commandId:receipt.commandId,receipt})})
 await expect(commitCheckpoint(h.store,h.checkpoint,h.proposals)).rejects.toThrow()
 expect(await h.physical.exportStored(receipt.runId)).toBe(before)
 await expect(h.physical.load(receipt.runId)).rejects.toThrow()
})

it('refuses a duplicate whose committed cause-log bundle was damaged',async()=>{
 const h=await setup();await commitCheckpoint(h.store,h.checkpoint,h.proposals)
 const before=await h.physical.exportStored(h.checkpoint.baseRun.runId)
 await corrupt(h,'logs',store=>{store.delete([h.checkpoint.baseRun.runId,2])})
 await expect(commitCheckpoint(h.store,h.checkpoint,h.proposals)).rejects.toThrow()
 expect(await h.physical.exportStored(h.checkpoint.baseRun.runId)).toBe(before)
})

it('requires explicit checkpoint policy when a store overrides original single-step commit',async()=>{
 const codec=createCampaignCodec(),factory=new IDBFactory()
 class PolicyStore extends IndexedDbRunStore {override async commit(...args:Parameters<IndexedDbRunStore['commit']>){return super.commit(...args)}}
 const store=new PolicyStore({codec,factory,keyRange:IDBKeyRange,name:'checkpoint-policy'})
 cleanups.push(()=>store.close());expect(store.supportsWaitCheckpoints).toBe(false)
 const ordinary=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name:'checkpoint-ordinary'})
 cleanups.push(()=>ordinary.close());expect(ordinary.supportsWaitCheckpoints).toBe(true)
})
