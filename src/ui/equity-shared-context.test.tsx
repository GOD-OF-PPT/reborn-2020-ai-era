import {afterAll,beforeAll,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t17-acceptance-40/equity-shared-closure-r221/normal75-input.json?raw'
import {createCampaignCodec,campaignDeepseek,campaignRuntime,campaignOperations,campaignMarket} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {equityBusinessContinuity,equitySharedCommandBusinessId} from './equity-business-continuity.ts'
import {EquityBusinessContinuity} from './EquityBusinessContinuity.tsx'
import {EquitySharedCommandDetails} from './EquitySharedCommandDetails.tsx'
import {EquityDecisionFacts} from './EquityDecisionFacts.tsx'
import {equityFocusFromSaved,equityFocusFor,equityJourneyFor} from './equity-player-thread.ts'
import heldRaw from '../../goal-1/evidence/t17-acceptance-40/equity-exit-r213/normal145-partly-collected.json?raw'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {projectSceneCommands} from '../application/scene-commands.ts'
import {equityJourney} from './equity-journey.ts'
import {equitySharedResult} from './equity-shared-result.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'

// One actual normal75 prefix continues through the original controller/store.
// Fake IDB is explicitly model evidence, not Chrome or a new Native2020 run.
let controller:GameController,store:IndexedDbRunStore,initial:PlayingView,planned:PlayingView,started:PlayingView,stopped:PlayingView,closed:PlayingView,businessId:string,jobId:string,companyId:string
const features=(v:PlayingView)=>v.features as unknown as PlayFeatures
const p=(view:PlayingView)=>({view,features:features(view)})
const cash=(v:PlayingView,id='personal')=>features(v).workbench.finance.find(f=>f.accountId===id)!.cashFen
const send=async(kind:string,payload:unknown)=>{const command=controller.prepare(kind,payload),before=controller.snapshot.view!,result=await controller.submit(command);expect(result.status).toBe('saved');return{command,before,current:controller.snapshot.view!}}
beforeAll(async()=>{
 const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-shared-normal75'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(raw);initial=controller.snapshot.view!;businessId=features(initial).deepseek!.businesses.find(b=>b.definitionId==='deepseek-investor')!.id;
 planned=(await send('StartEquityRelationship',{businessId,resources:['player-production'],startAt:'2025-01-21'})).current;jobId=features(planned).deepseek!.preparations.find(t=>t.kind==='relationship')!.jobId;
})
afterAll(async()=>{await controller?.close();await store?.close()})
it('keeps future task cash reserved and its original start-quarter action separate from paid costs',()=>{
 const c=equityBusinessContinuity(p(planned),businessId)!;expect(c.own).toHaveLength(1);expect(c.own[0]!.status).toBe('planned');expect(c.costs.reservedFen).toBe(50000);expect(c.costs.paidFen).toBe(0);expect(cash(planned)).toBe(cash(initial));expect(planned.budget.spent).toBe(initial.budget.spent);expect(planned.budget.reserved).toBe(initial.budget.reserved+1);
})
it('preserves the fixed-schedule refusal and captured original task without rescheduling or changing the save',()=>{
 const before=controller.exportSaved(),command=controller.prepare('RescheduleJob',{jobId,resources:['player-production'],startAt:'2025-01-22'}),preview=controller.preview(command);expect(preview.allowed).toBe(false);expect(preview.reasonCodes).toContain('VIDEO_SCHEDULE_FIXED');const html=renderToStaticMarkup(<EquitySharedCommandDetails command={command} preview={preview} {...p(planned)}/>);expect(html).toContain('原固定日程');expect(html).toContain('2025-01-21');expect(controller.exportSaved()).toBe(before);
})
it('actually cancels only the planned task and releases its reservation without refunding consumed action',async()=>{
 const r=await send('InterruptJob',{jobId}),c=equityBusinessContinuity(p(r.current),businessId)!;expect(c.costs.reservedFen).toBe(0);expect(c.costs.paidFen).toBe(0);expect(cash(r.current)).toBe(cash(initial));expect(r.current.budget.reserved).toBe(initial.budget.reserved);expect(r.current.budget.spent).toBe(initial.budget.spent);expect(equitySharedResult('InterruptJob',r.before,r.current)).toContain('取消未开工安排');
})
it('actually stops a running desk, retains its spent money and action, and never rebinds the captured confirmation',async()=>{
 started=(await send('StartEquityRelationship',{businessId,resources:['player-production'],startAt:initial.date})).current;expect(cash(started)).toBe(cash(initial)-50000);const command=controller.prepare('WindDownBusiness',{businessId}),preview=controller.preview(command),captured=p(started),html=renderToStaticMarkup(<EquitySharedCommandDetails command={command} preview={preview} {...captured}/>);expect(html).toContain('1项进行中');expect(html).toContain('¥500');expect(html).toContain('不会只收起眼前这一张纸');
 expect((await controller.submit(command)).status).toBe('saved');stopped=controller.snapshot.view!;expect(cash(stopped)).toBe(cash(started));expect(stopped.budget.spent).toBe(started.budget.spent);expect(equityBusinessContinuity(p(stopped),businessId)!.costs.paidFen).toBe(50000);expect(equitySharedResult('WindDownBusiness',started,stopped)).toContain('进入收尾');const preparation=features(started).deepseek!.preparations.at(-1)!,focus=equityFocusFor(p(started),{runId:started.runId,accountId:'personal',businessId,kind:'preparation',recordId:preparation.id});expect(equityFocusFromSaved(p(started),p(stopped),'WindDownBusiness',{businessId},focus)?.equityTarget).toEqual({runId:started.runId,accountId:'personal',businessId,kind:'business'});expect(equityFocusFromSaved(p(started),p({...stopped,hasCandidate:true,saveStatus:'unsaved'}),'WindDownBusiness',{businessId},focus)).toBeNull();expect(renderToStaticMarkup(<EquitySharedCommandDetails command={command} preview={preview} {...captured}/>)).toBe(html);
})
it('closes the empty personal desk without transferring personal cash or deleting its actual preparation',async()=>{
 closed=(await send('CloseBusiness',{businessId})).current;expect(cash(closed)).toBe(cash(stopped));expect(features(closed).deepseek!.preparations).toHaveLength(2);expect(equityBusinessContinuity(p(closed),businessId)!.business.lifecycle).toBe('closed');expect(equitySharedResult('CloseBusiness',stopped,closed)).toContain('分账已经关闭');
})
it('retains the known original owner when finance is missing and does not turn unknown cash into zero',()=>{
 const source=p(started),missing={...source,features:{...source.features,workbench:{...source.features.workbench,finance:[]}}},value=equityBusinessContinuity(missing,businessId);expect(value?.business.id).toBe(businessId);expect(value?.finance).toBeUndefined();const html=renderToStaticMarkup(<EquityBusinessContinuity value={value}/>);expect(html).toContain('资金来源仍待核对');expect(html).not.toContain('本账户现金¥0');
})
it('includes cross-business worker tasks in a declared public scope example and rejects duplicate or dangling identities',()=>{
 // Public projection scope example only; no normal save or actual employee is invented.
 const source=p(started),ops=started.operations!,own=ops.businesses.find(b=>b.id===businessId)!,job=ops.jobs.find(j=>j.businessId===businessId&&j.status==='running')!,worker={id:'scope-worker',definitionId:'scope-example',sponsorBusinessId:businessId,from:initial.date,to:null,units:1,monthlyWageFen:10000},other={...own,id:'scope-other',definitionId:'video-freelance',route:'ai_video' as const},cross={...job,id:'scope-cross-job',businessId:other.id,resources:[worker.id]},view={...started,operations:{...ops,businesses:[...ops.businesses,other],workers:[...ops.workers,worker],jobs:[...ops.jobs,cross]}};
 const value=equityBusinessContinuity({...source,view},businessId)!;expect(value.workers).toHaveLength(1);expect(value.own).toHaveLength(1);expect(value.elsewhere.map(j=>j.id)).toEqual([cross.id]);expect(renderToStaticMarkup(<EquityBusinessContinuity value={value}/>)).toContain('其他分账的1项原任务');expect(equityBusinessContinuity({...source,view:{...view,operations:{...view.operations,businesses:[...view.operations.businesses,other]}}},businessId)).toBeNull();expect(equityBusinessContinuity({...source,view:{...view,operations:{...view.operations,businesses:ops.businesses}}},businessId)).toBeNull();
})
it('does not replace generic confirmation facts for unrelated businesses and does not accept foreign captured revisions',()=>{
 const command=controller.prepare('FundBusiness',{businessId:'another-route-business',amountFen:10000});expect(equitySharedCommandBusinessId(command,p(closed))).toBeNull();const original=controller.prepare('CloseBusiness',{businessId}),preview=controller.preview(original),html=renderToStaticMarkup(<EquitySharedCommandDetails command={{...original,expectedRevision:0}} preview={preview} {...p(closed)}/>);expect(html).toContain('原确认与主体');expect(equitySharedResult('CloseBusiness',stopped,{...closed,hasCandidate:true,saveStatus:'unsaved'})).toBeNull();
})
it('transfers real personal capital to the selected company without service income or investment shares',async()=>{
 const opened=(await send('OpenEcosystemService',{capitalFen:500000})).current,b=features(opened).deepseek!.businesses.find(b=>b.definitionId==='ecosystem-service')!;companyId=b.id;const r=await send('FundBusiness',{businessId:companyId,amountFen:100000});expect(cash(r.current)).toBe(cash(r.before)-100000);expect(cash(r.current,b.accountId)).toBe(cash(r.before,b.accountId)+100000);expect(features(r.current).deepseek!.agreements).toHaveLength(0);expect(features(r.current).deepseek!.businesses.find(n=>n.id===companyId)!.metrics.incomeFen).toBe(b.metrics.incomeFen);expect(equitySharedResult('FundBusiness',r.before,r.current)).toContain('自有资本');
})
it('actually closes an eligible company and returns its remaining capital to personal cash without profit',async()=>{
 const stoppedCompany=(await send('WindDownBusiness',{businessId:companyId})).current,b=features(stoppedCompany).deepseek!.businesses.find(n=>n.id===companyId)!,command=controller.prepare('CloseBusiness',{businessId:companyId}),preview=controller.preview(command),html=renderToStaticMarkup(<EquitySharedCommandDetails command={command} preview={preview} {...p(stoppedCompany)}/>);expect(preview.allowed).toBe(true);expect(html).toContain('¥6,000');expect(html).toContain('不是收入');const r=await send('CloseBusiness',{businessId:companyId});expect(cash(r.current,b.accountId)).toBe(0);expect(cash(r.current)).toBe(cash(stoppedCompany)+600000);expect(equitySharedResult('CloseBusiness',stoppedCompany,r.current)).toContain('自有资金转回');
})

it('preserves the original held shares and unpaid credit after wind-down, rejects closure and still permits that exact old collection',()=>{
 const codec=createCampaignCodec(),run=codec.import(heldRaw),a=run.deepseek!.agreements[0]!,e=run.deepseek!.exits.find(e=>e.receivableId!==null)!,make=(kind:string,payload:unknown,revision=run.revision)=>({runId:run.runId,actorId:run.actorId,commandId:'u6-shared-held-'+kind,expectedRevision:revision,kind,payload}),r=evaluateCommand(run,make('WindDownBusiness',{businessId:a.businessId}),codec.registry,run.actorId);expect(r.status).toBe('proposed');if(r.status!=='proposed')throw Error('ORIGINAL_STOP_REQUIRED');const stopped=codec.import(codec.export(r.nextRun));expect(stopped.deepseek!.agreements[0]!.shares).toBe(a.shares);const credit=stopped.economy.ledger.privateReceivables.find(c=>c.id===e.receivableId)!;expect(credit.remainingFen).toBe(344835);const close=previewCommand(stopped,make('CloseBusiness',{businessId:a.businessId},stopped.revision),codec.registry,run.actorId);expect(close.allowed).toBe(false);expect(close.reasonCodes).toContain('DEEPSEEK_UNSETTLED_ASSETS_OR_SERVICE');expect(previewCommand(stopped,make('CollectEquityExit',{exitId:e.id,amountFen:credit.remainingFen},stopped.revision),codec.registry,run.actorId).allowed).toBe(true);const view=projectRun(stopped),v=projectDeepseek(stopped,campaignDeepseek)!,context={runId:run.runId,accountId:a.accountId,date:view.date,phase:stopped.phase,accounts:view.accounts,operations:stopped.operations!,finance:projectWorkbench(stopped,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog).finance,source:{revision:view.revision,receipts:view.receipts},sceneCommands:projectSceneCommands(stopped)},target={runId:run.runId,accountId:a.accountId,businessId:a.businessId,kind:'business' as const},j=equityJourney(v,target,context);for(const text of ['1500模拟股','¥3,448.35','2027-07-15'])expect(j.facts.join(' ')).toContain(text);const missing=equityJourney({...v,exits:v.exits.map(row=>row.id===e.id?{...row,receivable:null}:row)},target,context);expect(missing.facts.join(' ')).toContain('原转让款的来源尚待核对');expect(missing.facts.join(' ')).toContain('1500模拟股');
})

it('keeps the whole-business decision about the existing actual task and makes its real continuation direct',()=>{
 const source=p(started),target={runId:started.runId,accountId:'personal',businessId,kind:'business' as const},j=equityJourneyFor(source,equityFocusFor(source,target));expect(j.title).toContain('日历');expect(j.title).not.toContain('先让这份关系');expect(j.phase).toBe('business-active');expect(j.action).toMatchObject({kind:'choice',intent:'business'});const stop=features(stopped).deepseek!.preparations.at(-1)!,oldTarget={...target,kind:'preparation' as const,recordId:stop.id},result=equityJourneyFor(p(stopped),equityFocusFor(p(stopped),oldTarget));expect(result.finishWhen).toContain('已经停下');expect(result.finishWhen).not.toContain('看到本次准备');
})
it('captures the original current-to-start dates, resource, budget and feedback together without submitting a preparation',()=>{
 const codec=createCampaignCodec(),run=codec.import(raw),command={runId:run.runId,actorId:run.actorId,commandId:'u6-review-original-future',expectedRevision:run.revision,kind:'StartEquityRelationship',payload:{businessId,resources:['player-production'],startAt:'2025-01-21'}},preview=previewCommand(run,command,codec.registry,run.actorId),html=renderToStaticMarkup(<EquityDecisionFacts command={command} preview={preview} view={initial} features={features(initial)} accountName={()=> '个人账户'}/>);expect(preview.allowed).toBe(true);for(const value of ['2025-01-20','2025-01-21','2025-01-28','本人实际日期产能','¥500','开工季度行动'])expect(html).toContain(value);expect(codec.export(run)).toBe(raw);
})
