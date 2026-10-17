import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignRun,createCampaignCodec} from './campaign.ts'
import {bindCommandPreview,previewCommand} from '../core/commands.ts'
import {hashValue} from '../core/hash.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {RunSession} from './session.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
it('preserves command preview outcomes and random state with a detached immutable preview binding',()=>{
 const codec=createCampaignCodec(),run=createCampaignRun({runId:'preview-binding',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'preview-binding-v1'}),bound=bindCommandPreview(run,codec.registry,'player'),before=hashValue(run)
 for(const [kind,payload] of [['WorkQuarter',{}],['ResearchMarket',{definitionId:'market-foundation-course'}],['OpenRelayStation',{capitalFen:3000000}],['StartFirstOrder',{}]] as const){const c={runId:run.runId,actorId:'player',commandId:'display-preview',expectedRevision:run.revision,kind,payload};expect(bound(c)).toEqual(previewCommand(run,c,codec.registry,'player'));expect(bound(c)).toEqual(previewCommand(run,c,codec.registry,'player'))}
 expect(hashValue(run)).toBe(before);expect(bound({runId:run.runId,actorId:'other',commandId:'wrong',expectedRevision:run.revision,kind:'WorkQuarter',payload:{}})).toMatchObject({allowed:false,reasonCodes:['FORBIDDEN_ACTOR']})
})
it('invalidates the session preview binding after the actual committed research changes',async()=>{
 const codec=createCampaignCodec(),run=createCampaignRun({runId:'session-preview-binding',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'preview-binding-v1'}),store=new IndexedDbRunStore({name:'preview-binding',factory:new IDBFactory(),keyRange:IDBKeyRange,codec});await store.create(run);const session=await RunSession.open({store,codec,registry:codec.registry,locks:new MemoryWriterAccess(),runId:run.runId,actorId:'player'}),command={runId:run.runId,actorId:'player',commandId:'research',expectedRevision:run.revision,kind:'ResearchMarket',payload:{definitionId:'market-foundation-course'}};expect(session.preview(command).allowed).toBe(true);expect((await session.submit(command)).status).toBe('saved');expect(session.preview({...command,commandId:'another-preview',expectedRevision:session.view.revision})).toMatchObject({allowed:false,reasonCodes:['RESEARCH_NOT_AVAILABLE']});await session.close();await store.close()
})
