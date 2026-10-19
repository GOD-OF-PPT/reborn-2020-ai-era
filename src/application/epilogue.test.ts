import {beforeAll,expect,it} from 'vitest'
import {StoryHarness} from '../testing/story-harness.ts'
import {createCampaignRun} from './campaign.ts'
import {reviewFingerprint,nextTailDate} from '../core/epilogue.ts'
import {actionBudget,applyEconomy,createEconomy,assertEconomy} from '../core/economy.ts'
import {createLedger,applyLedger,accountFunds} from '../core/ledger.ts'
import {OPERATIONS_CONTENT} from '../content/operations.ts'
import type {GameRun} from '../core/run-types.ts'
import {queueEvent} from '../core/timeline.ts'
import {recoveryAssets,assertRecoveryEstimates} from '../core/ending-ledger.ts'
import {hashValue} from '../core/hash.ts'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {GameController} from './game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {createCampaignCodec} from './campaign.ts'
import {renderToStaticMarkup} from 'react-dom/server'
import {createElement} from 'react'
import {EndingStage} from '../ui/EndingStage.tsx'
import type {PlayFeatures} from '../ui/game-types.ts'
import {journeyIntent} from '../ui/journey-intent.ts'

let prepared:GameRun,beforeClose:GameRun,unfunded:GameRun
beforeAll(()=>{
 const h=new StoryHarness({priorRun:createCampaignRun({runId:'t16-closing-loan',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'t16-campaign-0'})})
 h.at('2025-12-30');h.send('RequestLoan',{accountId:'personal',offerId:OPERATIONS_CONTENT.loans[0]!.id});h.send('AdvanceTime',{date:'2025-12-31',phase:'player_actions'});beforeClose=h.run;h.at('2025-12-31');prepared=h.run
 const stress=new StoryHarness({priorRun:prepared});stress.send('DiscoverBusiness',{definitionId:'relay-station'});const business=stress.run.operations!.businesses.find(b=>b.definitionId==='relay-station')!;stress.send('FundBusiness',{businessId:business.id,amountFen:accountFunds(stress.run.economy.ledger,'personal').availableFen});stress.send('EnterEpilogue',{consent:true,reviewHash:reviewFingerprint(stress.run)});unfunded=stress.run
},120000)

it('requires an actual complete 24-quarter snapshot and current review before entering',()=>{
 const notClosed=new StoryHarness({priorRun:beforeClose});expect(notClosed.reject('EnterEpilogue',{consent:true,reviewHash:reviewFingerprint(notClosed.run)})).toContain('EPILOGUE_REQUIRES_COMPLETED_CAMPAIGN')
 const h=new StoryHarness({priorRun:prepared}),before=h.codec.export(h.run)
 expect(h.reject('EnterEpilogue',{consent:true,reviewHash:'0'.repeat(64)})).toContain('JOURNEY_REVIEW_CHANGED');expect(h.codec.export(h.run)).toBe(before)
 h.send('EnterEpilogue',{consent:true,reviewHash:reviewFingerprint(h.run)})
 expect(h.run.phase).toBe('epilogue');expect(h.run.economy.ledger).toEqual(prepared.economy.ledger);expect(h.run.random).toEqual(prepared.random)
 expect(actionBudget(h.run.economy,'2026-01-01').available).toBe(2)
 for(const kind of ['WorkQuarter','OpenVideoChannel','EnableCounterfactualEquity','StartLifeWork'])expect(h.reject(kind,kind==='OpenVideoChannel'?{name:'new',segment:'lifestyle'}:kind==='EnableCounterfactualEquity'?{acknowledge:true}:kind==='StartLifeWork'?{kind:'rest',personId:null,reference:null}:{})).toContain('EPILOGUE_OLD_ITEMS_ONLY')
 expect(h.reject('AdvanceTime',{date:'2026-01-01'})).toContain('EPILOGUE_OLD_ITEMS_ONLY')
 expect(h.reject('AdvanceEpilogueTime',{date:'2027-01-01'})).toContain('EPILOGUE_CLOCK_OLD_ITEMS_ONLY')
})

it('keeps original Q4 points, living expenses and the original loan while settling actual future dates',()=>{
 const h=new StoryHarness({priorRun:prepared}),opening=accountFunds(h.run.economy.ledger,'personal').cashFen,loans=h.run.economy.ledger.obligations.filter(o=>o.kind==='loan_principal'),salaryCount=h.run.operations!.payroll.filter(p=>p.kind==='salary').length
 h.send('EnterEpilogue',{consent:true,reviewHash:reviewFingerprint(h.run)})
 for(const date of ['2026-01-01',prepared.operations!.loans[0]!.dueAt]){
  const next=nextTailDate({...h.run,date:h.run.timeline.cursor.date,cursor:h.run.timeline.cursor,pending:h.run.timeline.pending});expect(next).toBe(date)
  h.send('AdvanceEpilogueTime',{date});expect(actionBudget(h.run.economy,date).available).toBe(2);expect(h.run.operations!.payroll.filter(p=>p.kind==='salary')).toHaveLength(salaryCount)
 }
 expect(accountFunds(h.run.economy.ledger,'personal').cashFen).toBe(opening-400000-OPERATIONS_CONTENT.loans[0]!.feeFen-OPERATIONS_CONTENT.loans[0]!.principalFen)
 const paid=h.run.economy.ledger.obligations.find(o=>o.id===loans[0]!.id)!;expect(paid.amountFen).toBe(loans[0]!.amountFen);expect(paid.remainingFen).toBe(0)
 expect(h.run.economy.ledger.receipts.some(r=>{const p=JSON.parse(r.signature);return p.kind==='pay_obligation'&&p.obligationId===paid.id&&p.amountFen===paid.amountFen})).toBe(true)
 const {tailQuarterLock,...unlocked}=h.run.economy;expect(tailQuarterLock).toBe('2025-Q4');const corrupt={...h.run,economy:unlocked};expect(()=>h.codec.export(corrupt)).toThrow('EPILOGUE_ENTRY_SOURCE_MISMATCH')
 const removed={...h.run,timeline:{...h.run.timeline,receipts:h.run.timeline.receipts.filter(r=>!r.instanceId.startsWith('tail:living:2026-01'))}};expect(()=>h.codec.export(removed)).toThrow()
 const forged={...h.run,timeline:queueEvent(h.run.timeline,{instanceId:'forged-salary',date:'2026-02-01',phase:'certain_receipts',priority:0,payload:{id:'forged-salary',date:'2026-02-01',kind:'income',accountId:'personal',counterpartyId:'world',sourceEventId:'bootstrap:living',amountFen:1000000}})};expect(()=>h.codec.export(forged)).toThrow('UNOWNED_EPILOGUE_FINANCIAL_TIMER')
 expect(h.codec.export(h.codec.import(h.codec.export(h.run)))).toBe(h.codec.export(h.run))
},120000)

it('personal zero cash does not erase the old principal, fee or living debt',()=>{
 const h=new StoryHarness({priorRun:unfunded});expect(accountFunds(h.run.economy.ledger,'personal').cashFen).toBe(0)
 h.send('AdvanceEpilogueTime',{date:'2026-01-01'});expect(accountFunds(h.run.economy.ledger,'personal').cashFen).toBe(0);expect(h.run.timeline.pause?.reason).toBe('CASH_SHORTFALL')
 h.send('AcknowledgeCashGap',{instanceId:h.run.timeline.pause!.instanceId});h.send('AdvanceEpilogueTime',{date:'2026-01-01'});h.send('AdvanceEpilogueTime',{date:prepared.operations!.loans[0]!.dueAt})
 expect(h.run.economy.ledger.obligations.find(o=>o.kind==='loan_principal')!.remainingFen).toBe(OPERATIONS_CONTENT.loans[0]!.principalFen)
 expect(h.run.economy.ledger.obligations.filter(o=>o.accountId==='personal'&&o.remainingFen>0).reduce((n,o)=>n+o.remainingFen,0)).toBe(400000+OPERATIONS_CONTENT.loans[0]!.feeFen+OPERATIONS_CONTENT.loans[0]!.principalFen)
})

it('exposes over-reserved old future plans without permitting a fifth closing point',()=>{
 let e=createEconomy(applyLedger(createLedger([{id:'personal',kind:'personal'},{id:'world',kind:'external'}],'2025-12-31'),{id:'fixture-opening',kind:'opening_cash',date:'2025-12-31',sourceEventId:'fixture',accountId:'personal',counterpartyId:'world',amountFen:100000}))
 for(const [id,startAt,points] of [['q4','2025-12-31',2],['jan','2026-01-01',3],['apr','2026-04-01',3]] as const){e=applyEconomy(e,{kind:'reserve_action',id:'reserve-'+id,date:'2025-12-31',sourceEventId:'fixture',action:{id,definitionId:'fixture-closing',accountId:'personal',counterpartyId:'world',actionPoints:points,costFen:0,cashReservationId:'funds-'+id,startAt,completeAt:startAt,settlementAt:startAt}});if(id==='q4')e=applyEconomy(e,{kind:'execute_action',id:'execute-q4',date:startAt,sourceEventId:'fixture',actionId:id})}
 e={...e,tailQuarterLock:'2025-Q4'};assertEconomy(e)
 expect(actionBudget(e,'2026-01-01')).toMatchObject({total:4,spent:2,reserved:6,available:0,overReserved:4})
 expect(()=>applyEconomy(e,{kind:'execute_action',id:'execute-jan',date:'2026-01-01',sourceEventId:'fixture',actionId:'jan'})).toThrow('EPILOGUE_ACTION_BUDGET_EXCEEDED')
})

it('archives without clearing liabilities, preserves the first record on resume, and never renews the budget',()=>{
 const h=new StoryHarness({priorRun:prepared})
 h.send('EnterEpilogue',{consent:true,reviewHash:reviewFingerprint(h.run)})
 const before=h.codec.export(h.run),ledger=hashValue(h.run.economy.ledger),estimates=recoveryAssets(h.run.economy.ledger).map(a=>({assetId:a.assetId,kind:a.kind,basisFen:a.basisFen,estimatedFen:a.basisFen}))
 expect(h.reject('FinishJourney',{consent:true,reviewHash:'0'.repeat(64),estimates})).toContain('JOURNEY_REVIEW_CHANGED');expect(h.codec.export(h.run)).toBe(before)
 h.send('FinishJourney',{consent:true,reviewHash:reviewFingerprint(h.run),estimates})
 expect(h.run.phase).toBe('finished');expect(hashValue(h.run.economy.ledger)).toBe(ledger)
 expect(h.run.economy.ledger.obligations.find(o=>o.kind==='loan_principal')!.remainingFen).toBe(OPERATIONS_CONTENT.loans[0]!.principalFen)
 const first=structuredClone(h.run.journey!.endings[0]!)
 expect(h.reject('WorkQuarter',{})).toContain('RUN_FINISHED')
 h.send('ResumeEpilogue',{consent:true,endingCommandId:first.commandId});expect(actionBudget(h.run.economy,'2026-01-01').available).toBe(2)
 h.send('AdvanceEpilogueTime',{date:'2026-01-01'});h.send('FinishJourney',{consent:true,reviewHash:reviewFingerprint(h.run),estimates:[]})
 expect(h.run.journey!.endings).toHaveLength(2);expect(h.run.journey!.endings[0]).toEqual(first)
 expect(accountFunds(h.run.economy.ledger,'personal').cashFen).toBe(accountFunds(prepared.economy.ledger,'personal').cashFen-400000)
 const deleted={...h.run,journey:{...h.run.journey!,endings:[]}};expect(()=>h.codec.export(deleted)).toThrow('JOURNEY_ENDING_SOURCE_MISMATCH')
},120000)

it('requires an explicit bounded recovery assumption and does not turn it into cash',()=>{
 let ledger=createLedger([{id:'personal',kind:'personal'},{id:'world',kind:'external'}],'2025-12-31')
 ledger=applyLedger(ledger,{id:'fixture-credit-delivery',date:'2025-12-31',sourceEventId:'fixture',kind:'deliver_on_credit',accountId:'personal',businessId:'fixture-business',contractId:'fixture-contract',counterpartyId:'world',amountFen:100000})
 const before=hashValue(ledger),estimate={assetId:'fixture-contract',kind:'contract_receivable' as const,basisFen:100000,estimatedFen:0}
 assertRecoveryEstimates(ledger,[estimate]);expect(hashValue(ledger)).toBe(before);expect(accountFunds(ledger,'personal').cashFen).toBe(0)
 expect(()=>assertRecoveryEstimates(ledger,[])).toThrow('JOURNEY_ESTIMATES_INCOMPLETE')
 expect(()=>assertRecoveryEstimates(ledger,[{...estimate,estimatedFen:100001}])).toThrow('JOURNEY_ESTIMATE_EXCEEDS_ASSET')
})

it('the public product controller reaches, archives and resumes the earned ending, then starts an independent life',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'t16-public-ending'});let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`ending-${++id}`})
 await controller.initialize();await controller.importNew(codec.export(prepared))
 const send=async(kind:string,payload:unknown)=>{const c=controller.prepare(kind,payload);expect(controller.preview(c).allowed,kind).toBe(true);expect((await controller.submit(c)).status,kind).toBe('saved')}
 const render=()=>{const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,noop=()=>{throw Error('ENDING_RENDER_MUST_NOT_ACT')};return renderToStaticMarkup(createElement(EndingStage,{p:{controller,view,features,request:noop,accountId:'personal'},headingRef:null,onOpen:noop,onJourney:noop,onNewLife:noop}))}
 try{
  expect(render()).toContain('核对并进入有限尾声')
  await send('EnterEpilogue',{consent:true,reviewHash:reviewFingerprint(codec.import(controller.exportSaved()))})
  const oldTask=journeyIntent(controller.snapshot.view!,'AdvanceTime',{date:'2027-07-01'},'等待原股权工作完成')
  expect(oldTask.confirm).toBe(true);expect(oldTask.label).toContain('2026-01-01');expect(oldTask.label).toContain('2027-07-01')
  await send(oldTask.kind,oldTask.payload)
  expect(controller.snapshot.view!.date).toBe('2026-01-01')
  const run=codec.import(controller.exportSaved()),ledger=hashValue(run.economy.ledger)
  await send('FinishJourney',{consent:true,reviewHash:reviewFingerprint(run),estimates:[]})
  const before=controller.exportSaved(),html=render()
  expect(html).toContain('真实因果胶片');expect(html).toContain('选择分享片段');expect(html).toContain('从2020，再作选择');expect(html).not.toContain('核对并进入有限尾声')
  expect(controller.exportSaved()).toBe(before);expect(hashValue(codec.import(before).economy.ledger)).toBe(ledger)
  const endingId=codec.import(before).journey!.endings[0]!.commandId
  await send('ResumeEpilogue',{consent:true,endingCommandId:endingId})
  expect(codec.import(controller.exportSaved()).journey!.endings[0]!.commandId).toBe(endingId)
  const rejected=controller.prepare('WorkQuarter',{});expect(controller.preview(rejected).reasonCodes).toContain('EPILOGUE_OLD_ITEMS_ONLY')
  await controller.home();await controller.newLife({backgroundId:'content_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'t16-campaign-0'})
  const newRun=codec.import(controller.exportSaved());expect(newRun.runId).not.toBe(prepared.runId);expect(newRun.timeline.cursor.date).toBe('2020-01-01');expect(newRun.journey!.endings).toHaveLength(0);expect(newRun.story!.deployments).toHaveLength(0)
  expect((await store.listRuns()).some(r=>r.runId===prepared.runId)).toBe(true)
 }finally{await controller.close();await store.close()}
},60000)
