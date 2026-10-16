import { expect,it } from 'vitest'
import { IDBFactory,IDBKeyRange } from 'fake-indexeddb'
import { createCampaignRun,createCampaignCodec } from './campaign.ts'
import { evaluateCommand } from '../core/commands.ts'
import { IndexedDbRunStore } from '../persistence/indexeddb.ts'
import { RunSession } from './session.ts'
import { abortAfterHeadWrite } from '../testing/abort-after-write.ts'
import { MemoryWriterAccess } from '../testing/memory-writer-access.ts'

it.each(['order','fill'])('keeps %s and market projection unpublished after abort, then retries the same candidate once',async(stage)=>{
 const codec=createCampaignCodec(),registry=codec.registry;let run=createCampaignRun({runId:`atomic-market-${stage}`,actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'atomic-market-seed'});const order={accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:100,limitPriceFen:11988,quoteId:'initial-2020-01-01',validUntil:'SIM-CP-2020-01-10'}
 if(stage==='fill'){const result=evaluateCommand(run,{runId:run.runId,actorId:'player',commandId:'place',expectedRevision:run.revision,kind:'PlaceStockOrder',payload:order},registry,'player');if(result.status!=='proposed')throw new Error(JSON.stringify(result));run=result.nextRun}
 const factory=new IDBFactory(),name=`t08-market-${stage}`,store=new IndexedDbRunStore({factory,keyRange:IDBKeyRange,name,codec});await store.importSave(codec.export(run),{mode:'create',importId:'market-save',actorId:'player'});const fault=abortAfterHeadWrite(factory,name),failing=new IndexedDbRunStore({factory:fault.factory,keyRange:IDBKeyRange,name,codec}),session=await RunSession.open({store:failing,codec,registry,locks:new MemoryWriterAccess(),runId:run.runId,actorId:'player'});const command={runId:run.runId,actorId:'player',commandId:'atomic-command',expectedRevision:run.revision,kind:stage==='order'?'PlaceStockOrder':'AdvanceTime',payload:stage==='order'?order:{date:'2020-01-10'}}
 expect((await session.submit(command)).status).toBe('unsaved');expect(session.view.features.market).toMatchObject({fills:[],positions:[],orders:stage==='order'?[]:[{status:'pending'}]});expect((await store.load(run.runId))?.run).toEqual(run);const candidate=codec.import(session.exportCandidate());expect(stage==='order'?candidate.market?.orders:candidate.market?.fills).toHaveLength(1);const random=candidate.random;expect((await session.submit(command)).status).toBe('rejected');expect((await session.retry()).status).toBe('saved');expect((await store.load(run.runId))?.run.random).toEqual(random);expect(session.view.features.market).toMatchObject(stage==='order'?{orders:[{status:'pending'}],fills:[]}:{orders:[{status:'filled'}],fills:[{quantity:100}],positions:[{quantity:100}]});expect((await session.submit(command)).status).toBe('duplicate');await session.close();await failing.close();await store.close()
},20000)
