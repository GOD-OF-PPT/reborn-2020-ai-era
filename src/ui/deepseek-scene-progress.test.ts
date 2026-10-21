import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {GameController} from '../application/game-controller.ts'
import {RunSession} from '../application/session.ts'
import {createCampaignCodec,campaignDeepseek} from '../application/campaign.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {prepareEco,prepareEquity,offeredEquityExit} from '../testing/deepseek-scenarios.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {accountPosition} from '../core/ledger.ts'
import {deepseekSceneProgress} from './deepseek-scene-progress.ts'

it('lets a real fresh normal life inspect participation without creating an ecosystem or enabling counterfactual equity',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d09-deepseek-unstarted'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d09-unstarted-${++id}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'d09-deepseek-unstarted'})
 try{
  const raw=controller.exportSaved(),projection=projectDeepseek(codec.import(raw),campaignDeepseek)
  const scene=deepseekSceneProgress(projection,controller.snapshot.view!.date)
  expect(scene).toMatchObject({phase:'opening',active:false,entityId:null,entityIds:[]});expect(scene!.command).toBeUndefined()
  expect(scene!.choice.line).toContain('不自动开公司、投资或取得权限')
  expect(controller.exportSaved()).toBe(raw)
  expect(codec.import(raw).deepseek!.counterfactualEnabledAt).toBeNull()
 }finally{await controller.close();await store.close()}
})

it('connects real isolated service production, personal submission, customer review, support and due collection without inventing income',async()=>{
 // This fixture has deliberately fixed outcomes and funds. It is never a normal campaign or browser acceptance claim.
 const {h,lead}=prepareEco(),assignment={resources:['player-production'],startAt:'2024-07-02'}
 h.send('AcceptEcoContract',{leadId:lead.id,scope:'standard',...assignment})
 const contractId=h.run.deepseek!.contracts[0]!.id
 const project=()=>projectDeepseek(h.run,h.deepseek)!
 const scene=()=>deepseekSceneProgress(project(),h.run.timeline.cursor.date,contractId)!
 expect(project().leads.some(row=>row.status==='open'&&row.id!==lead.id)).toBe(true)
 expect(deepseekSceneProgress(project(),h.run.timeline.cursor.date)).toMatchObject({phase:'working',entityId:contractId})
 expect(scene()).toMatchObject({phase:'working',active:true,nextDate:'2024-07-02'});expect(scene().command).toBeUndefined()
 expect(scene().choice.line).toContain('80%收入来自实际验收，20%来自完成支持')
 const first=h.run.deepseek!.contracts[0]!,production=h.run.operations!.jobs.find(j=>j.id===first.productionJobId)!
 h.send('AdvanceTime',{date:production.completeAt})
 const ready=scene(),beforeSubmission=h.codec.export(h.run)
 expect(ready.command).toEqual({kind:'SubmitEcoDelivery',payload:{contractId},confirm:false})
 expect(h.codec.export(h.run)).toBe(beforeSubmission)
 h.send(ready.command!.kind,ready.command!.payload)
 expect(scene().phase).toBe('customer-review');expect(scene().command).toBeUndefined()
 expect(deepseekSceneProgress(project(),h.run.timeline.cursor.date)).toMatchObject({phase:'customer-review',entityId:contractId})
 expect(project().contracts[0]!.balance!.recognizedIncomeFen).toBe(0)
 h.send('AdvanceTime',{date:h.run.deepseek!.contracts[0]!.reviewAt!})
 expect(scene()).toMatchObject({phase:'support',active:true});expect(scene().command).toBeUndefined()
 expect(project().contracts[0]!.balance!.recognizedIncomeFen).toBe(first.priceFen*80/100)
 h.send('AdvanceTime',{date:h.run.operations!.jobs.find(j=>j.id===h.run.deepseek!.contracts[0]!.supportJobId)!.completeAt})
 expect(project().contracts[0]!.balance!.recognizedIncomeFen).toBe(first.priceFen)
 const owed=project().deliveries.find(d=>d.stage==='support'&&d.remainingFen>0)!
 expect(deepseekSceneProgress(project(),h.run.timeline.cursor.date,owed.id)).toMatchObject({phase:'receivable',nextDate:owed.dueAt});expect(deepseekSceneProgress(project(),h.run.timeline.cursor.date,owed.id)!.command).toBeUndefined()
 h.send('AdvanceTime',{date:owed.dueAt})
 const due=deepseekSceneProgress(project(),h.run.timeline.cursor.date,owed.id)!
 expect(due.command).toEqual({kind:'CollectEcoReceivable',payload:{deliveryId:owed.id,amountFen:owed.remainingFen},confirm:false})
 const business=project().businesses.find(b=>b.id===first.businessId)!,cash=business.funds.cashFen,income=project().contracts[0]!.balance!.recognizedIncomeFen
 h.send(due.command!.kind,due.command!.payload)
 expect(project().businesses.find(b=>b.id===first.businessId)!.funds.cashFen-cash).toBe(owed.remainingFen)
 expect(project().contracts[0]!.balance!.recognizedIncomeFen).toBe(income)
 expect(project().deliveries.find(d=>d.id===owed.id)!.remainingFen).toBe(0)
 expect(deepseekSceneProgress(project(),h.run.timeline.cursor.date,contractId)!.phase).toBe('history')
},30000)

it('keeps real diligence, accepted terms, locked shares and later follow consent distinct and never signs or follows automatically',()=>{
 const {h,invitation,negotiation}=prepareEquity()
 const project=()=>projectDeepseek(h.run,h.deepseek)!
 const before=h.codec.export(h.run),terms=deepseekSceneProgress(project(),h.run.timeline.cursor.date,negotiation.id)!
 expect(terms).toMatchObject({source:'counterfactual-equity',phase:'terms',active:true});expect(terms.command).toBeUndefined()
 expect(terms.line).toContain('实际支付并签约，仍必须由你明确确认')
 expect(deepseekSceneProgress(project(),h.run.timeline.cursor.date,invitation.id)!.line).toContain('本次独立报告确认')
 expect(h.codec.export(h.run)).toBe(before)
 h.send('SignEquityAgreement',{negotiationId:negotiation.id})
 const agreement=h.run.deepseek!.agreements[0]!,locked=deepseekSceneProgress(project(),h.run.timeline.cursor.date,agreement.id)!
 expect(locked).toMatchObject({phase:'locked',active:false,nextDate:null});expect(locked.command).toBeUndefined()
 expect(locked.line).toContain('估值不是可花现金')
 expect(deepseekSceneProgress(project(),h.run.timeline.cursor.date)!.entityId).toBe(agreement.id)
 h.send('AdvanceTime',{date:'2025-09-01'})
 const follow=deepseekSceneProgress(project(),h.run.timeline.cursor.date)!,cash=accountPosition(h.run.economy.ledger,agreement.accountId).cashFen,saved=h.codec.export(h.run)
 expect(follow).toMatchObject({entityId:agreement.id,phase:'follow',active:true,publicDueAt:'2025-09-15'});expect(follow.command).toBeUndefined()
 expect(follow.line).toContain('默认不新增付款')
 expect(h.codec.export(h.run)).toBe(saved)
 h.send('FollowEquityRound',{agreementId:agreement.id,amountFen:0})
 expect(accountPosition(h.run.economy.ledger,agreement.accountId).cashFen).toBe(cash)
 expect(project().agreements[0]!.followDecision).toBe('declined')
},30000)

it('keeps an actual unfinished negotiation ahead of its already-read invitation while preserving that original invitation for inspection',()=>{
 const {h,invitation}=prepareEquity()
 // The first terms are now expired; the original invitation still allows a different real proposal.
 h.send('AdvanceTime',{date:'2025-07-01'})
 h.send('StartEquityNegotiation',{invitationId:invitation.id,acquisitionKind:'new_capital',termsId:'liquidity',amountFen:2000000,resources:['player-production'],startAt:'2025-07-01'})
 const projection=projectDeepseek(h.run,h.deepseek)!,negotiation=projection.negotiations.at(-1)!,before=h.codec.export(h.run)
 expect(projection.invitations.find(i=>i.id===invitation.id)!.status).toBe('open')
 const current=deepseekSceneProgress(projection,h.run.timeline.cursor.date)!
 expect(current).toMatchObject({phase:'terms',entityId:negotiation.id,active:true,nextDate:negotiation.job!.completeAt})
 expect(current.choice.line).toContain('任务基础成本')
 expect(current.choice.line).toContain('原工资、维护和其他已承诺的支持另列')
 expect(current.entityIds).toContain(invitation.id)
 expect(deepseekSceneProgress(projection,h.run.timeline.cursor.date,invitation.id)!.active).toBe(false)
 expect(h.codec.export(h.run)).toBe(before)
},30000)

it('reveals a buyer quote only after the original completed response, leaves shares to the player, and collects only a real due transfer',async()=>{
 const {h,exit}=offeredEquityExit(),project=()=>projectDeepseek(h.run,h.deepseek)!
 const quote=deepseekSceneProgress(project(),h.run.timeline.cursor.date,exit.id)!
 expect(quote).toMatchObject({phase:'exit-quote',active:true});expect(quote.command).toBeUndefined()
 expect(quote.line).toContain('实际股数仍由你填写')
 // A bounded public-display stress case: frozen fields must not leak while the original job is still running.
 const raw=h.codec.export(h.run),base=project(),hidden={...base,exits:base.exits.map(e=>({...e,responseAt:null,buyerWilling:true,unitPriceFen:987654321,job:e.job?{...e.job,status:'running' as const}:null}))}
 const waiting=deepseekSceneProgress(hidden,h.run.timeline.cursor.date,exit.id)!
 expect(waiting.line).not.toContain('9,876,543.21');expect(waiting.line).not.toContain('有条件报价')
 expect(waiting.command).toBeUndefined();expect(h.codec.export(h.run)).toBe(raw)
 h.send('AcceptEquityExit',{exitId:exit.id,shares:50000})
 let current=project().exits.find(e=>e.id===exit.id)!
 expect(deepseekSceneProgress(project(),h.run.timeline.cursor.date,exit.id)).toMatchObject({phase:'receivable',nextDate:current.dueAt});expect(deepseekSceneProgress(project(),h.run.timeline.cursor.date,exit.id)!.command).toBeUndefined()
 h.send('AdvanceTime',{date:current.dueAt!})
 current=project().exits.find(e=>e.id===exit.id)!
 const due=deepseekSceneProgress(project(),h.run.timeline.cursor.date,exit.id)!
 expect(due.command).toEqual({kind:'CollectEquityExit',payload:{exitId:exit.id,amountFen:current.receivable!.remainingFen},confirm:false})
 const factory=new IDBFactory(),name='d09-deepseek-private-collection',store=new IndexedDbRunStore({factory,keyRange:IDBKeyRange,name,codec:h.codec})
 await store.importSave(h.codec.export(h.run),{mode:'create',actorId:'player',importId:'d09-collection-source'})
 const session=await RunSession.open({store,codec:h.codec,registry:h.codec.registry,locks:new MemoryWriterAccess(),runId:h.run.runId,actorId:'player'})
 try{
  const initial=h.codec.import(session.exportSaved()),business=project().businesses.find(b=>b.id===current.businessId)!,cash=accountPosition(initial.economy.ledger,business.accountId).cashFen,amount=current.receivable!.remainingFen
  const result=await session.submit({runId:initial.runId,actorId:'player',commandId:'d09-collect-private-sale',expectedRevision:initial.revision,kind:due.command!.kind,payload:due.command!.payload})
  expect(result.status).toBe('saved')
  const committed=h.codec.import(session.exportSaved()),after=projectDeepseek(committed,h.deepseek)!
  expect(accountPosition(committed.economy.ledger,business.accountId).cashFen-cash).toBe(amount)
  expect(after.exits.find(e=>e.id===exit.id)!.receivable!.remainingFen).toBe(0)
  expect(deepseekSceneProgress(after,committed.timeline.cursor.date,exit.id)).toMatchObject({active:false,phase:'exit-request'});expect(deepseekSceneProgress(after,committed.timeline.cursor.date,exit.id)!.command).toBeUndefined()
 }finally{await session.close();await store.close()}
},30000)

it('keeps the original visible collection scene on real transaction abort and advances it only after retrying that exact candidate',async()=>{
 const {h,lead}=prepareEco()
 h.send('AcceptEcoContract',{leadId:lead.id,scope:'standard',resources:['player-production'],startAt:'2024-07-02'})
 const c=h.run.deepseek!.contracts[0]!
 h.send('AdvanceTime',{date:h.run.operations!.jobs.find(j=>j.id===c.productionJobId)!.completeAt})
 h.send('SubmitEcoDelivery',{contractId:c.id})
 h.send('AdvanceTime',{date:h.run.operations!.jobs.find(j=>j.id===c.supportJobId)!.completeAt})
 const delivery=projectDeepseek(h.run,h.deepseek)!.deliveries.find(d=>d.remainingFen>0)!
 h.send('AdvanceTime',{date:delivery.dueAt})
 const factory=new IDBFactory(),name='d09-eco-collection-abort',store=new IndexedDbRunStore({factory,keyRange:IDBKeyRange,name,codec:h.codec}),original=h.codec.export(h.run)
 await store.importSave(original,{mode:'create',actorId:'player',importId:'d09-collect-base'})
 const fault=abortAfterHeadWrite(factory,name),failing=new IndexedDbRunStore({factory:fault.factory,keyRange:IDBKeyRange,name,codec:h.codec}),session=await RunSession.open({store:failing,codec:h.codec,registry:h.codec.registry,locks:new MemoryWriterAccess(),runId:h.run.runId,actorId:'player'})
 const visible=()=>{const run=h.codec.import(session.exportSaved());return deepseekSceneProgress(projectDeepseek(run,h.deepseek),run.timeline.cursor.date,delivery.id)!}
 try{
  const before=visible(),command=before.command!
  expect((await session.submit({runId:h.run.runId,actorId:'player',commandId:'d09-original-collection',expectedRevision:h.run.revision,kind:command.kind,payload:command.payload})).status).toBe('unsaved')
  expect(visible()).toEqual(before);expect(session.exportSaved()).toBe(original)
  expect(h.codec.export((await store.load(h.run.runId))!.run)).toBe(original)
  const candidate=session.exportCandidate()
  expect((await session.retry()).status).toBe('saved');expect(session.exportSaved()).toBe(candidate)
  expect(fault.trace).toMatchObject({writeSucceeded:true,abortIssued:true})
  expect(visible().command).toBeUndefined()
 }finally{await session.close();await failing.close();await store.close()}
},30000)
