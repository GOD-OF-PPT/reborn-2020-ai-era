import { expect,it } from 'vitest'
import { IDBFactory,IDBKeyRange } from 'fake-indexeddb'
import { createCampaignCodec } from './campaign.ts'
import { IndexedDbRunStore } from '../persistence/indexeddb.ts'
import { MemoryWriterAccess } from '../testing/memory-writer-access.ts'
import { GameController } from './game-controller.ts'
import { abortAfterHeadWrite } from '../testing/abort-after-write.ts'
import type { WorkbenchProjection } from './workbench-projection.ts'

it('creates and resumes a normal game through the same public controller, saving before publishing choices',async()=>{
 const codec=createCampaignCodec(),factory=new IDBFactory(),store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name:'t09-controller'}),locks=new MemoryWriterAccess();let sequence=0
 const controller=new GameController({codec,store,locks,id:()=>`intent-${++sequence}`});await controller.initialize();expect(controller.snapshot.runs).toHaveLength(0)
 await controller.newLife({backgroundId:'content_employee',playerProfile:{wishId:'autonomy',approach:'first_order'}});expect(controller.snapshot.view).toMatchObject({backgroundId:'content_employee',saveStatus:'saved',budget:{available:4}})
 const command=controller.prepare('WorkQuarter',{});await Promise.all([controller.submit(command),controller.submit(command)]);expect(controller.snapshot.view?.budget.spent).toBe(2);expect(controller.snapshot.view?.operations?.employment).toHaveLength(1)
 const exported=controller.exportSaved();await controller.home();expect(controller.snapshot.runs).toHaveLength(1);await controller.continueLife(controller.snapshot.runs[0]!.runId);expect(controller.exportSaved()).toBe(exported);await controller.close();await store.close()
},20000)

it('keeps an aborted controller candidate private, blocks exit, and retries the original result',async()=>{
 const codec=createCampaignCodec(),factory=new IDBFactory(),name='t09-controller-abort',fault=abortAfterHeadWrite(factory,name),store=new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name});let sequence=0
 const c=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`abort-${++sequence}`});await c.initialize();await c.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}});const before=c.exportSaved(),command=c.prepare('WorkQuarter',{})
 expect((await c.submit(command)).status).toBe('unsaved');expect(c.snapshot.view).toMatchObject({saveStatus:'unsaved',budget:{spent:0}});expect(c.exportSaved()).toBe(before);expect(fault.trace).toEqual({writeSucceeded:true,abortIssued:true});await expect(c.home()).rejects.toThrow('UNSAVED_CANDIDATE_EXISTS');const candidate=c.exportCandidate();expect((await c.submit(c.prepare('FavoriteMemory',{memoryId:'MEM-CONTENT',favorite:true}))).status).toBe('rejected');expect((await c.retry()).status).toBe('saved');expect(c.exportSaved()).toBe(candidate);expect((await c.submit(command)).status).toBe('duplicate');await c.close()
},20000)

it('continues and cancels a real plan at zero available money and zero action points',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'t09-zero'});let seq=0;const c=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`zero-${++seq}`});await c.initialize();await c.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
 const send=async(kind:string,payload:unknown)=>{const result=await c.submit(c.prepare(kind,payload));expect(result.status).toBe('saved')}
 await send('WorkQuarter',{});await send('ResearchMarket',{definitionId:'market-overview'});await send('ResearchMarket',{definitionId:'market-foundation-course'});for(const limitPriceFen of [11988,10988])await send('PlanStockOrder',{accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:100,limitPriceFen,quoteId:'initial-2020-01-01',validUntil:'SIM-CP-2020-01-10'})
 expect(c.snapshot.view).toMatchObject({budget:{available:0},accounts:[{availableFen:0,heldFen:2300000}]});expect((c.snapshot.view!.features.workbench as WorkbenchProjection).finance[0]!.forecast.earliestGap).toBeNull();await send('AdvanceTime',{date:'2020-01-02'});expect(c.snapshot.view!.date).toBe('2020-01-02');const run=codec.import(c.exportSaved()),order=run.market!.orders[0]!;expect(c.preview(c.prepare('CancelStockOrder',{orderId:order.id}))).toMatchObject({allowed:true,actionPoints:0,releasedFen:1200000});await send('CancelStockOrder',{orderId:order.id});expect(c.snapshot.view!.accounts[0]!.availableFen).toBe(1200000);await send('CancelStockOrder',{orderId:run.market!.orders[1]!.id});expect(c.snapshot.view!.accounts[0]!.availableFen).toBe(2300000);expect(c.snapshot.view!.budget.spent).toBe(4);await c.close()
},20000)
it('keeps deferred debt payable, starts zero-cash work, and pays only after the real salary date',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'t09-recovery'});let seq=0;const c=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`recovery-${++seq}`});await c.initialize();await c.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'t09-recovery'})
 const send=async(kind:string,payload:unknown)=>{const result=await c.submit(c.prepare(kind,payload));if(result.status!=='saved')throw new Error(JSON.stringify({kind,result}))}
 await send('DeclineOffer',{offerId:'manual-first-2020'});await send('PlaceStockOrder',{accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:200,limitPriceFen:11988,quoteId:'initial-2020-01-01',validUntil:'SIM-CP-2020-01-10'})
 for(let step=0;step<10&&!(c.snapshot.view!.features.workbench as WorkbenchProjection).pause?.reason.includes('CASH_SHORTFALL');step++){const w=c.snapshot.view!.features.workbench as WorkbenchProjection;if(w.pause){const e=w.events.find(e=>e.isBlocking)!;await send('ChooseEvent',{instanceId:e.id,choiceId:e.defaultChoiceId})}else await send('AdvanceTime',{date:'2020-02-01'})}
 let w=c.snapshot.view!.features.workbench as WorkbenchProjection;expect(w.pause?.reason).toBe('CASH_SHORTFALL');expect(c.snapshot.view!.accounts[0]!.cashFen).toBe(200002);const debt=w.finance[0]!.obligations[0]!
 expect((await c.submit(c.prepare('PayObligation',{accountId:'personal',obligationId:debt.id,amountFen:400000}))).status).toBe('rejected');await send('PayObligation',{accountId:'personal',obligationId:debt.id,amountFen:200002});expect(c.snapshot.view!.accounts[0]).toMatchObject({cashFen:0,payableFen:199998});await send('AcknowledgeCashGap',{instanceId:w.pause!.instanceId});await send('WorkQuarter',{});expect(c.snapshot.view!.budget.spent).toBe(2)
 expect((await c.submit(c.prepare('PayObligation',{accountId:'personal',obligationId:debt.id,amountFen:199998}))).status).toBe('rejected');await send('AdvanceTime',{date:'2020-02-29'});w=c.snapshot.view!.features.workbench as WorkbenchProjection;expect(c.snapshot.view!.accounts[0]!.cashFen).toBe(800000);expect(w.finance[0]!.obligations[0]!.remainingFen).toBe(199998);await send('PayObligation',{accountId:'personal',obligationId:debt.id,amountFen:199998});expect(c.snapshot.view!.accounts[0]).toMatchObject({cashFen:600002,payableFen:0});await c.close()
},30000)
it('rejects direct video feedback targets beyond the current front-end date range before changing the save',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'t10-range'});let seq=0;const c=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`t10-range-${++seq}`});await c.initialize();await c.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}});const before=c.exportSaved(),command=c.prepare('AdvanceTime',{date:'2026-01-01'});expect(c.preview(command).reasonCodes).toContain('PREVIEW_RANGE_ENDED');expect((await c.submit(command)).status).toBe('rejected');expect(c.exportSaved()).toBe(before);expect(c.preview(c.prepare('AdvanceTime',{date:'2020-07-01'})).allowed).toBe(true);await c.close()
},20000)
