import {afterEach,expect,it,vi} from 'vitest'
import {IDBFactory,IDBKeyRange,IDBObjectStore as FakeObjectStore} from 'fake-indexeddb'
import {createCampaignCodec} from './campaign.ts'
import {GameController} from './game-controller.ts'
import {RunSession} from './session.ts'
import {createInitialRun} from './bootstrap.ts'
import {createBaseRegistry,evaluateCommand} from '../core/commands.ts'
import {assertGameRun} from '../core/run.ts'
import {advanceEconomicTime} from '../core/economic-time.ts'
import {addDays} from '../core/calendar.ts'
import {BOOTSTRAP_VERSIONS} from '../content/bootstrap.ts'
import {RunCodec} from '../persistence/codec.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import raw19 from '../../goal-1/evidence/t17-acceptance-39/public-wait-model-r1/reconstructed-original19.json?raw'

const cleanups:(()=>Promise<void>)[]=[]
afterEach(async()=>{vi.restoreAllMocks();for(const close of cleanups.splice(0).reverse())await close()})
async function open(name:string,options:{abort?:boolean;yieldControl?:()=>Promise<void>}={}){
 const codec=createCampaignCodec(),factory=new IDBFactory(),database='batch-wait-'+name,locks=new MemoryWriterAccess()
 const fault=abortAfterHeadWrite(factory,database,row=>(row as {envelope?:{revision?:number}}).envelope?.revision===21)
 const store=new IndexedDbRunStore({codec,factory:options.abort?fault.factory:factory,keyRange:IDBKeyRange,name:database}),physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name:database})
 let n=0;const controller=new GameController({codec,store,locks,id:()=>name+'-'+(++n),...(options.yieldControl?{yieldControl:options.yieldControl}:{})})
 await controller.initialize();await controller.importNew(raw19)
 cleanups.push(async()=>{await controller.close(true);await store.close();await physical.close()})
 return {codec,controller,store,physical,factory,locks,fault,database}
}
function replay(run:GameRun,commands:readonly CommandEnvelope[],codec:RunCodec){let current=run,previous=run;for(const command of commands){const result=evaluateCommand(current,command,codec.registry,current.actorId);if(result.status!=='proposed')throw Error('ORIGINAL_REPLAY_REQUIRED');previous=current;current=result.nextRun}return {current,previous}}

it('publishes only durable checkpoints and preserves every original logical command, full run and backup',async()=>{
 const h=await open('complete'),before=h.codec.import(h.controller.exportSaved()),seen:number[]=[]
 const unsubscribe=h.controller.subscribe(()=>{const view=h.controller.snapshot.view;if(view?.saveStatus==='saved'&&!view.hasCandidate)seen.push(view.revision)})
 const originalPut=FakeObjectStore.prototype.put;let writes=0
 vi.spyOn(FakeObjectStore.prototype,'put').mockImplementation(function(this:IDBObjectStore,...args:Parameters<IDBObjectStore['put']>){if(this.name==='heads')writes++;return originalPut.apply(this,args)})
 const command=h.controller.prepare('AdvanceTime',{date:'2020-04-11'}),result=await h.controller.waitForFeedback(command);unsubscribe()
 expect(result.status).toBe('saved');expect(result.steps.map(step=>step.date)).toEqual(['2020-04-10','2020-04-11'])
 expect(writes).toBe(1);expect(seen.every(revision=>revision===19||revision===21)).toBe(true);expect(seen).toContain(21)
 const actual=h.codec.import(h.controller.exportSaved()),commands=actual.receipts.slice(before.receipts.length).map(row=>({...JSON.parse(row.payloadSignature),commandId:row.commandId,expectedRevision:row.revisionBefore}) as CommandEnvelope),expected=replay(before,commands,h.codec)
 expect(h.codec.export(actual)).toBe(h.codec.export(expected.current))
 expect(await h.physical.exportStored(before.runId,true)).toBe(h.codec.export(expected.previous))
 expect(h.codec.export((await h.physical.load(before.runId))!.run)).toBe(h.controller.exportSaved())
})

it('accepts stop between real logical steps without exposing the uncommitted date',async()=>{
 let h!:Awaited<ReturnType<typeof open>>,ticks=0,observed=0
 h=await open('stop',{yieldControl:async()=>{if(++ticks===1){
  observed=h.controller.snapshot.view!.revision
  const priorNotice=h.controller.snapshot.notice
  h.controller.stopWaiting()
  expect(h.controller.timeWait?.stopRequested).toBe(true)
  expect(h.controller.snapshot.view!.revision).toBe(observed)
  expect(h.controller.snapshot.notice).toBe(priorNotice)
 }}})
 const result=await h.controller.waitForFeedback(h.controller.prepare('AdvanceTime',{date:'2020-04-11'}))
 expect(observed).toBe(19);expect(result.status).toBe('stopped');expect(result.reasonCodes).toEqual(['WAIT_STOP_REQUESTED'])
 expect(result.steps).toHaveLength(1);expect(result.current).toMatchObject({revision:20,date:'2020-04-10',saveStatus:'saved',hasCandidate:false})
 expect(await h.physical.exportStored(result.before.runId)).toBe(h.controller.exportSaved())
})

it('keeps all first-checkpoint outcomes private after real abort and retries the same multi-step candidate without execution',async()=>{
 const h=await open('retry',{abort:true}),before=h.controller.exportSaved(),advance=vi.spyOn(h.codec.registry.runtime!,'advance')
 const scope=h.controller.prepare('AdvanceTime',{date:'2020-04-11'}),result=await h.controller.waitForFeedback(scope)
 expect(result.status).toBe('unsaved');expect(result.steps).toEqual([]);expect(result.feedback).toEqual([])
 expect(h.fault.trace).toEqual({writeSucceeded:true,abortIssued:true})
 expect(h.controller.snapshot.view).toMatchObject({revision:19,saveStatus:'unsaved',hasCandidate:true,pendingRevision:21})
 expect(h.controller.exportSaved()).toBe(before);expect(await h.physical.exportStored(result.before.runId)).toBe(before)
 const candidate=h.controller.exportCandidate(),count=advance.mock.calls.length;expect(count).toBe(2)
 const saved=await h.controller.retry();expect(saved.status).toBe('saved');expect(advance.mock.calls.length).toBe(count)
 expect(h.controller.exportSaved()).toBe(candidate);expect(saved).toMatchObject({checkpointWait:true,waitResult:{reasonCodes:['WAIT_RETRY_SAVED_ONLY'],failed:null}})
 if(saved.status!=='saved'||!saved.waitResult)throw Error('ACTUAL_RETRY_WAIT_RESULT_REQUIRED')
 expect(saved.waitResult.steps).toHaveLength(2);expect(saved.waitResult.before.revision).toBe(19);expect(saved.waitResult.lastBefore!.revision).toBe(20)
 expect(saved.waitResult.lastSaved.revision).toBe(21);expect(saved.waitResult.current.saveStatus).toBe('saved')
 expect(saved.waitResult.feedback.some(row=>row.kind==='job'&&row.attention==='pause')).toBe(true)
 expect((await h.controller.waitForFeedback(scope)).steps).toEqual([]);expect(advance.mock.calls.length).toBe(count)
})

it('keeps an actual second controller read-only and preserves its entire original saved wire',async()=>{
 const h=await open('reader'),store=new IndexedDbRunStore({codec:h.codec,factory:h.factory,keyRange:IDBKeyRange,name:h.database}),reader=new GameController({codec:h.codec,store,locks:h.locks})
 await reader.initialize();await reader.continueLife(h.controller.snapshot.view!.runId)
 cleanups.push(async()=>{await reader.close();await store.close()})
 const raw=h.controller.exportSaved(),result=await reader.waitForFeedback(reader.prepare('AdvanceTime',{date:'2020-04-11'}))
 expect(result.status).toBe('rejected');expect(result.reasonCodes).toEqual(['READ_ONLY_SESSION']);expect(result.steps).toEqual([])
 expect(reader.exportSaved()).toBe(raw);expect(await h.physical.exportStored(result.before.runId)).toBe(raw)
})

async function economic(name:string,abortRevision?:number){
 const registry=createBaseRegistry(BOOTSTRAP_VERSIONS,[],{
  advance:(model,target)=>{const result=advanceEconomicTime(model.timeline,model.economy,target);return {...model,timeline:result.timeline,economy:result.state}},
  validate:assertGameRun,
  project:run=>({workbench:{quarter:'2020-Q1',atQuarterEnd:false,pause:run.timeline.pause,events:[],finance:[],preparationJobs:[],progression:{nextDate:addDays(run.timeline.cursor.date,1),quarterTarget:'2020-03-31',requiresDelivery:false,nextQuarterDate:null}}}),
 })
 const codec=new RunCodec(registry,['technical_employee','content_employee']),factory=new IDBFactory(),database='bounded-economic-'+name
 const fault=abortAfterHeadWrite(factory,database,row=>(row as {envelope?:{revision?:number}}).envelope?.revision===abortRevision)
 const physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name:database}),store=new IndexedDbRunStore({codec,factory:abortRevision?fault.factory:factory,keyRange:IDBKeyRange,name:database})
 const initial=createInitialRun({runId:'bounded-'+name,actorId:'player',commandId:'bounded-create',seed:'bounded-engine',backgroundId:'technical_employee'})
 await physical.create(initial)
 const session=await RunSession.open({codec,registry,store,locks:new MemoryWriterAccess(),runId:initial.runId,actorId:initial.actorId})
 cleanups.push(async()=>{await session.close({discardCandidate:true});await store.close();await physical.close()})
 return {codec,factory,store,physical,initial,session,fault}
}

it('bounds a quiet economic-engine range at eight steps, keeping global IDs and the complete physical bundle',async()=>{
 // Isolated economic engine with a public daily calendar adapter. It uses the
 // original economic advance/reducer and real codec/IDB, not a normal campaign
 // or a synthetic replacement for the campaign/Chrome checks above.
 const {codec,store,initial,session}=await economic('range')
 const originalPut=FakeObjectStore.prototype.put;let writes=0
 vi.spyOn(FakeObjectStore.prototype,'put').mockImplementation(function(this:IDBObjectStore,...args:Parameters<IDBObjectStore['put']>){if(this.name==='heads')writes++;return originalPut.apply(this,args)})
 const result=await session.waitForFeedbackCheckpoint({runId:initial.runId,actorId:'player',commandId:'bounded-scope',expectedRevision:1,kind:'AdvanceTime',payload:{date:'2020-01-13'}},{stopping:()=>false,yieldControl:async()=>{}})
 expect(result.status).toBe('saved');expect(result.steps).toHaveLength(12);expect(writes).toBe(2)
 const actual=codec.import(session.exportSaved()),commands=actual.receipts.slice(1).map(row=>({...JSON.parse(row.payloadSignature),commandId:row.commandId,expectedRevision:row.revisionBefore}) as CommandEnvelope)
 const ordinaryCodec=new RunCodec(createBaseRegistry(BOOTSTRAP_VERSIONS),['technical_employee','content_employee']),expected=replay(initial,commands,ordinaryCodec)
 expect(codec.export(actual)).toBe(ordinaryCodec.export(expected.current));expect(await store.exportStored(initial.runId,true)).toBe(ordinaryCodec.export(expected.previous))
 expect((await store.load(initial.runId))!.generation).toBe(13);expect((await store.loadBackup(initial.runId))!.generation).toBe(12)
})

it('retains the first real checkpoint when the next one aborts and retries only its remaining accepted prefix',async()=>{
 const h=await economic('partial',13),scope:CommandEnvelope={runId:h.initial.runId,actorId:'player',commandId:'partial-scope',expectedRevision:1,kind:'AdvanceTime',payload:{date:'2020-01-13'}}
 const result=await h.session.waitForFeedbackCheckpoint(scope,{stopping:()=>false,yieldControl:async()=>{}})
 expect(result.status).toBe('unsaved');expect(result.steps).toHaveLength(8);expect(result.lastSaved).toMatchObject({revision:9,date:'2020-01-09',saveStatus:'saved'})
 expect(result.lastBefore!.revision).toBe(8);expect(h.session.view).toMatchObject({revision:9,hasCandidate:true,pendingRevision:13})
 expect(h.fault.trace).toEqual({writeSucceeded:true,abortIssued:true})
 const candidate=h.session.exportCandidate(),old=h.session.exportSaved()
 expect(await h.physical.exportStored(h.initial.runId)).toBe(old);expect((await h.physical.loadBackup(h.initial.runId))!.run.revision).toBe(8)
 const saved=await h.session.retry()
 expect(saved.status).toBe('saved');expect(h.session.exportSaved()).toBe(candidate)
 if(saved.status!=='saved'||!saved.waitResult)throw Error('REAL_RETRY_RANGE_REQUIRED')
 expect(saved.waitResult.steps).toHaveLength(12);expect(saved.waitResult.before.revision).toBe(1);expect(saved.waitResult.lastBefore!.revision).toBe(12)
 expect(h.codec.export((await h.physical.load(h.initial.runId))!.run)).toBe(candidate)
})
