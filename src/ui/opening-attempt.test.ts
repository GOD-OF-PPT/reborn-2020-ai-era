import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec,createCampaignRun} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {RunSession} from '../application/session.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {openingAttempt,type OpeningAttemptInput} from './opening-attempt.ts'
import {openingFocusFor,playerThread,type OpeningFocus} from './player-thread.ts'

const input=(view:PlayingView):OpeningAttemptInput=>({view,features:view.features as unknown as PlayFeatures})
async function normal(name:string,approach:PlayingView['playerProfile']['approach']='first_order',backgroundId:'technical_employee'|'content_employee'='technical_employee'){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u1-attempt-'+name})
 let count=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`u1-${name}-${++count}`})
 await controller.initialize();await controller.newLife({backgroundId,playerProfile:{wishId:'autonomy',approach},seed:'u1-'+name})
 const p=()=>input(controller.snapshot.view!)
 const send=async(kind:string,payload:unknown)=>{const result=await controller.submit(controller.prepare(kind,payload));expect(result.status,JSON.stringify({kind,payload,result})).toBe('saved')}
 return {controller,p,send,close:async()=>{await controller.close();await store.close()}}
}

it.each(['first_order','investment','free'] as const)('gives the %s opening its own purpose and original choice without committing anything',async approach=>{
 const h=await normal('entry-'+approach,approach)
 try{
  const before=h.controller.exportSaved(),p=h.p(),attempt=openingAttempt(p)!
  expect(attempt.kind).toBe({first_order:'first-order',investment:'market-entry',free:'free-entry'}[approach])
  expect(attempt.action.kind).toBe({first_order:'offer-reply',investment:'market-choice',free:'free-choice'}[approach])
  expect(attempt.source).toEqual({runId:p.view.runId,revision:1,date:'2020-01-01'})
  expect(attempt.purpose.length).toBeGreaterThan(5);expect(attempt.endpoint.length).toBeGreaterThan(5)
  expect(attempt.thread.focus.kind).toBe({first_order:'first-order',investment:'market',free:'free'}[approach])
  expect(attempt.nextChoices).toEqual([])
  if(approach==='first_order')expect(attempt.firstOrder).toMatchObject({phase:'letter',needsAttention:false,receipt:null,terms:{costFen:50000,priceFen:130000,actionPoints:1},dates:{replyBy:'2020-01-05'}})
  else{expect(attempt.firstOrder).toBeNull();expect(attempt.thread.command?.kind).not.toBe('StartFirstOrder')}
  if(approach==='free'){expect(attempt.thread.command).toBeUndefined();expect(attempt.thread.focus.entityId).toBeNull()}
  for(let i=0;i<3;i++)expect(openingAttempt(p)).toEqual(attempt)
  expect(h.controller.exportSaved()).toBe(before)
  expect(p.view.budget).toMatchObject({available:4,reserved:0,spent:0})
 }finally{await h.close()}
})

it.each(['technical_employee','content_employee'] as const)('shows the saved %s first order from reservation to one atomic receipt and explicit next directions',async background=>{
 const h=await normal('paid-'+background,'first_order',background)
 try{
  let focus=openingAttempt(h.p())!.thread.focus
  await h.send('WorkQuarter',{});await h.send('StartFirstOrder',{})
  let attempt=openingAttempt(h.p(),focus)!
  focus=attempt.thread.focus
  const contractId=h.p().features.firstOrder.contractId,jobId=h.p().features.firstOrder.jobId
  expect(attempt).toMatchObject({action:{kind:'wait',wait:{date:'2020-01-05'}},firstOrder:{phase:'planned',contractId,jobId,receipt:null,result:{paymentFen:0,directCostFen:0}}})
  expect(h.p().view.budget).toMatchObject({available:1,reserved:1,spent:2})
  await h.send('AdvanceTime',{date:'2020-01-05'})
  attempt=openingAttempt(h.p(),focus)!
  expect(attempt).toMatchObject({action:{kind:'wait',wait:{date:'2020-01-19'}},firstOrder:{phase:'running',receipt:null,result:{paymentFen:0,directCostFen:50000}}})
  await h.send('AdvanceTime',{date:'2020-01-19'})
  attempt=openingAttempt(h.p(),focus)!
  expect(attempt).toMatchObject({action:{kind:'command',command:{kind:'SubmitDelivery',payload:{contractId},confirm:true}},firstOrder:{phase:'delivery',needsAttention:false,receipt:null}})
  // Own delivery remains the current object even when the real delivery barrier is raised.
  expect(attempt.thread.responsibilityOverrideNeeded).toBe(true)
  expect(attempt.thread.resultRefs).toContainEqual({kind:'job',id:jobId,date:'2020-01-19'})
  if(attempt.action.kind!=='command')throw Error('DELIVERY_COMMAND_REQUIRED')
  await h.send(attempt.action.command.kind,attempt.action.command.payload)
  attempt=openingAttempt(h.p(),focus)!
  expect(attempt).toMatchObject({action:{kind:'wait',wait:{date:'2020-01-20'}},firstOrder:{status:'review',phase:'feedback',receipt:null,result:{confirmedIncomeFen:0,paymentFen:0}}})
  expect(attempt.nextChoices).toEqual([])
  const beforeRevision=h.p().view.revision
  await h.send('AdvanceTime',{date:'2020-01-20'})
  const saved=h.controller.exportSaved()
  attempt=openingAttempt(h.p(),focus)!
  expect(attempt.source.revision).toBe(beforeRevision+1)
  expect(attempt).toMatchObject({action:{kind:'next-choice'},firstOrder:{status:'settled',phase:'paid',receipt:{amountFen:130000,costFen:50000,netFen:80000,date:'2020-01-20'}}})
  expect(attempt.firstOrder!.result).toEqual({confirmedIncomeFen:130000,paymentFen:130000,directCostFen:50000,netOrderFen:80000})
  const refs=attempt.firstOrder!.receipt!.sourceRefs
  expect(refs).toHaveLength(1)
  expect(refs[0]).toMatchObject({kind:'payment',date:'2020-01-20'})
  expect(h.p().features.workbench.finance.find(a=>a.accountId==='personal')!.transactions).toContainEqual(expect.objectContaining({id:refs[0]!.id,amountFen:130000,date:'2020-01-20',sourceId:contractId}))
  expect(attempt.nextChoices.map(choice=>choice.screen)).toEqual(['video','quarter','market'])
  for(const choice of attempt.nextChoices){expect(choice.target?.accountId).toBe('personal');expect(choice.focus?.runId).toBe(h.p().view.runId)}
  expect(attempt.thread.command).toBeUndefined();expect(attempt.thread.wait).toBeUndefined()
  expect(attempt.purpose).toContain('已有结果')
  const runId=h.p().view.runId
  await h.controller.home();await h.controller.continueLife(runId)
  expect(h.controller.exportSaved()).toBe(saved)
  expect(openingAttempt(h.p(),focus)).toEqual(attempt)
 }finally{await h.close()}
})

it.each(['declined','skipped','expired','cancelled','interrupted','missed'] as const)('keeps the actual %s exit and any original cleanup instead of a paid result',async state=>{
 const h=await normal('exit-'+state)
 try{
  const focus=openingAttempt(h.p())!.thread.focus
  if(state==='declined'||state==='skipped')await h.send(state==='declined'?'DeclineOffer':'SkipOffer',{offerId:h.p().features.firstOrder.offerId})
  else if(state==='expired')await h.send('AdvanceTime',{date:'2020-01-06'})
  else{
   await h.send('StartFirstOrder',{})
   if(state==='cancelled')await h.send('CancelContract',{contractId:h.p().features.firstOrder.contractId})
   if(state==='interrupted'){await h.send('AdvanceTime',{date:'2020-01-05'});await h.send('InterruptJob',{jobId:h.p().features.firstOrder.jobId})}
   if(state==='missed')await h.send('AdvanceTime',{date:'2020-01-20'})
  }
  const before=h.controller.exportSaved(),attempt=openingAttempt(h.p(),focus)!
  expect(attempt.firstOrder).toMatchObject({phase:'non-success',receipt:null,result:{paymentFen:0,confirmedIncomeFen:0}})
  expect(attempt.thread.outcome).toBe('non-success')
  expect(attempt.thread.resultRefs.some(ref=>ref.kind==='payment')).toBe(false)
  expect(h.p().features.firstOrder.paidCaseAvailable).toBe(false)
  if(['declined','skipped','expired'].includes(state)){
   expect(attempt.thread.line).toContain('没有支付制作费或占用行动')
   expect(attempt.thread.detail).toContain('原报价的投入要求')
   expect(attempt.purpose).toContain('已经结束')
  }else expect(attempt.thread.detail).toContain('原约定的投入要求')
  if(state==='interrupted'||state==='missed'){
   expect(attempt).toMatchObject({action:{kind:'command',command:{kind:'CancelContract',payload:{contractId:h.p().features.firstOrder.contractId}}},firstOrder:{needsAttention:true,result:{directCostFen:50000,netOrderFen:-50000}}})
   expect(attempt.nextChoices).toEqual([])
  }else{expect(attempt.action.kind).toBe('next-choice');expect(attempt.nextChoices).toHaveLength(3)}
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
})

it('leaves invalid identities and already chosen work, life and market objects to their original models',async()=>{
 const h=await normal('scope','free')
 try{
  const p=h.p(),base:OpeningFocus={runId:p.view.runId,accountId:'personal',kind:'first-order',entityId:null}
  for(const focus of [{...base,runId:'different-life'},{...base,accountId:'missing-account'},{...base,entityId:'another-contract'}])expect(openingAttempt(p,focus)).toBeNull()
  expect(openingAttempt(p,base,'2020-Q2')).toBeNull()
  const work=openingFocusFor(p,'quarter')!
  expect(work.kind).toBe('work');expect(openingAttempt(p,work)).toBeNull()
  await h.send('ResearchMarket',{definitionId:'market-overview'})
  const research=h.p().features.market.researches.at(-1)!,market=openingFocusFor(h.p(),'market',{accountId:'personal',recordId:research.id})!
  expect(openingAttempt(h.p(),market)).toBeNull()
  const life:OpeningFocus={runId:p.view.runId,accountId:'personal',kind:'life',entityId:null,selection:'rest'}
  expect(openingAttempt(h.p(),life)).toBeNull()
 }finally{await h.close()}
})

it('keeps the old letter during a real head-write abort and publishes the plan only after the same candidate saves',async()=>{
 const codec=createCampaignCodec(),factory=new IDBFactory(),locks=new MemoryWriterAccess(),name='u1-attempt-atomic'
 const store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 const run=createCampaignRun({runId:name,actorId:'player',commandId:'u1-create',backgroundId:'technical_employee',seed:name,playerProfile:{wishId:'autonomy',approach:'first_order'}})
 await store.create(run)
 const fault=abortAfterHeadWrite(factory,name),failing=new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name})
 const session=await RunSession.open({store:failing,codec,registry:codec.registry,locks,runId:run.runId,actorId:'player'})
 const reader=await RunSession.open({store,codec,registry:codec.registry,locks,runId:run.runId,actorId:'player'})
 try{
  const before=session.exportSaved(),focus=openingAttempt(input(session.view))!.thread.focus,old=openingAttempt(input(session.view),focus)!
  const command={runId:run.runId,actorId:'player',commandId:'u1-accept',expectedRevision:1,kind:'StartFirstOrder',payload:{}}
  expect(reader.view.readOnly).toBe(true)
  expect((await reader.submit(command)).status).toBe('rejected')
  expect(openingAttempt(input(reader.view),focus)).toEqual(old)
  expect((await session.submit(command)).status).toBe('unsaved')
  expect(fault.trace).toEqual({writeSucceeded:true,abortIssued:true})
  expect(session.view.hasCandidate).toBe(true);expect(session.view.pendingRevision).toBe(2)
  expect(openingAttempt(input(session.view),focus)).toEqual(old)
  expect(session.exportSaved()).toBe(before)
  expect((await store.load(run.runId))?.run.revision).toBe(1)
  expect((await session.retry()).status).toBe('saved')
  const actual=openingAttempt(input(session.view),focus)!
  expect(actual).toMatchObject({source:{revision:2},firstOrder:{phase:'planned',receipt:null},action:{kind:'wait',wait:{date:'2020-01-05'}}})
  expect(actual.thread.focus.entityId).toBe(input(session.view).features.firstOrder.contractId)
  expect(playerThread(input(reader.view),focus).stage).toBe('offer')
  expect((await session.submit(command)).status).toBe('duplicate')
  expect(openingAttempt(input(session.view),focus)).toEqual(actual)
 }finally{await reader.close();await session.close();await failing.close();await store.close()}
})
