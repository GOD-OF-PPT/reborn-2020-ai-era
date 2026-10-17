import {it,expect} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {StoryHarness} from '../testing/story-harness.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {RunSession} from './session.ts'
import {hashValue} from '../core/hash.ts'
import {intentAccount} from '../ui/intent-account.ts'
import {confirmationMoney} from '../ui/confirmation-money.ts'
import type {PlayFeatures} from '../ui/game-types.ts'

it.each(['work','promise','scene'] as const)('publishes no %s or paid cost after head.put succeeds but the actual transaction aborts',async kind=>{
 const h=new StoryHarness({seed:'t15-atomic-'+kind});let commandKind:string,payload:Record<string,unknown>
 if(kind==='work'){commandKind='StartLifeWork';payload={kind:'workspace',personId:null,reference:null}}
 else if(kind==='promise'){h.send('StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null});h.at('2020-01-04',{work:false});commandKind='AcceptLifePromise';payload={promiseId:h.run.life!.promises[0]!.id,consent:true}}
 else{h.send('StartLifeWork',{kind:'workspace',personId:null,reference:null});commandKind='AdvanceTime';payload={date:'2020-01-08'}}
 const initial=h.run,before=h.codec.export(initial),factory=new IDBFactory(),name='t15-atomic-'+kind,store=new IndexedDbRunStore({codec:h.codec,factory,keyRange:IDBKeyRange,name})
 await store.importSave(before,{mode:'create',actorId:'player',importId:'normal-before-life'})
 const fault=abortAfterHeadWrite(factory,name),failing=new IndexedDbRunStore({codec:h.codec,factory:fault.factory,keyRange:IDBKeyRange,name}),session=await RunSession.open({codec:h.codec,registry:h.codec.registry,store:failing,locks:new MemoryWriterAccess(),actorId:'player',runId:initial.runId}),visible=hashValue(session.view.features),command=h.command(commandKind,payload)
 if(kind!=='scene'){
  expect(intentAccount({...command,payload:{...payload,accountId:'company-must-not-pay'}},session.view,session.view.features as unknown as PlayFeatures)).toBe('personal')
  expect(confirmationMoney(command,session.preview(command))).toMatchObject({amountFen:kind==='work'?300000:0})
 }
 expect((await session.submit(command)).status).toBe('unsaved');expect(fault.trace).toEqual({writeSucceeded:true,abortIssued:true});expect(session.exportSaved()).toBe(before);expect(hashValue(session.view.features)).toBe(visible);expect(h.codec.export((await store.load(initial.runId))!.run)).toBe(before)
 const candidate=session.exportCandidate(),next=h.codec.import(candidate)
 if(kind==='work'){expect(next.life!.jobs).toHaveLength(1);expect(next.life!.jobs[0]!.status).toBe('running');expect(next.economy.ledger).not.toEqual(initial.economy.ledger)}
 else if(kind==='promise'){expect(next.life!.promises[0]!.status).toBe('accepted');expect(next.economy).toEqual(initial.economy)}
 else expect(next.life!.jobs[0]).toMatchObject({status:'completed',result:'workspace_ready'})
 expect((await session.submit({...command,commandId:'do-not-stack'})).status).toBe('rejected');expect(session.exportCandidate()).toBe(candidate)
 expect((await session.retry()).status).toBe('saved');expect(session.exportSaved()).toBe(candidate);expect((await session.submit(command)).status).toBe('duplicate')
 await session.close();await failing.close();expect(h.codec.export((await store.load(initial.runId))!.run)).toBe(candidate);await store.close()
},60000)
