import { expect,it } from 'vitest'
import { IDBFactory,IDBKeyRange } from 'fake-indexeddb'
import { createCampaignCodec } from '../application/campaign.ts'
import { GameController } from '../application/game-controller.ts'
import { MemoryWriterAccess } from '../testing/memory-writer-access.ts'
import { IndexedDbRunStore } from './indexeddb.ts'
import oldMarket from '../../goal-1/evidence/t08-normal-q01-initial.json?raw'

it('lists and exports an existing incompatible save without executing or silently converting it',async()=>{
 const factory=new IDBFactory(),name='t09-legacy-library',legacy=JSON.parse(oldMarket)
 // A previously installed version wrote this database; current import is intentionally forbidden.
 await new Promise<void>((resolve,reject)=>{const request=factory.open(name,1);request.onupgradeneeded=()=>{const db=request.result;for(const store of ['heads','backups','receipts','logs','imports'])db.createObjectStore(store,{keyPath:store==='receipts'?['runId','commandId']:store==='logs'?['runId','revision']:store==='imports'?['runId','importId']:'runId'})};request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('heads','readwrite');tx.objectStore('heads').put({runId:legacy.runId,generation:1,envelope:legacy});tx.oncomplete=()=>{db.close();resolve()};tx.onabort=()=>reject(tx.error)}})
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({factory,keyRange:IDBKeyRange,name,codec}),controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize()
 expect(controller.snapshot.runs).toEqual([{runId:legacy.runId,revision:null,date:null,backgroundId:null,compatible:false,errorCode:'UNSUPPORTED_SCHEMA_VERSION'}]);expect(await controller.exportStored(legacy.runId)).toBe(oldMarket.trim());await expect(controller.continueLife(legacy.runId)).rejects.toThrow('UNSUPPORTED_SCHEMA_VERSION');expect(controller.snapshot.view).toBeNull();expect(await controller.exportStored(legacy.runId)).toBe(oldMarket.trim());await controller.close()
})
