import {expect,it} from 'vitest'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {relayBusinessTarget,relayFocusFor,relayFocusFromSaved,resolveRelayFocus} from './relay-player-thread.ts'
import {openingFocusFor,playerThread} from './player-thread.ts'
import {seasonFocusAfterSave,seasonFocusChoices,seasonRecollection} from './season-thread.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import prefix from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0091.json?raw'
import settled from '../../goal-1/evidence/t17-acceptance-11/chrome-production-r12/r105-audit-correction-real-cash-saved.json?raw'

const input=(view:PlayingView)=>({view,features:view.features as unknown as PlayFeatures})

it('publishes the actual normal service identity only after original retry, keeps its pin on waiting and preserves stopped support',async()=>{
 const codec=createCampaignCodec(),factory=new IDBFactory(),name='relay-focus-atomic',run=codec.import(prefix)
 expect(run.origin).toBe('normal');expect(run.revision).toBe(91)
 const physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name});await physical.importSave(prefix,{mode:'create',actorId:'player',importId:'relay-focus-earned-prefix'})
 const fault=abortAfterHeadWrite(factory,name),store=new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name})
 let n=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`relay-focus-${++n}`})
 try{
  await controller.initialize();await controller.continueLife(run.runId)
  const previous=input(controller.snapshot.view!),v=previous.features.relay!
  expect(v.periods).toHaveLength(0);expect(v.businesses).toHaveLength(1);expect(previous.view.budget.available).toBe(3)
  const identity=relayBusinessTarget(previous,v.businesses[0]!.id)!,focus=relayFocusFor(previous,identity)
  expect(playerThread(previous,focus)).toMatchObject({focusStatus:'valid',focusQuarter:'2024-Q3',focusScope:'carry'})
  const payload={businessId:identity.businessId,customerIds:v.customers.map(c=>c.id),supplierIds:['cedar-direct'],resources:['player-production'],startAt:'2025-01-28',maxUnits:300000,maxSupplierCostFen:1200000,supportMode:'guided'}
  const command=controller.prepare('StartRelayServicePeriod',payload),savedBefore=controller.exportSaved()
  expect(controller.preview(command).allowed).toBe(true)
  expect((await controller.submit(command)).status).toBe('unsaved');expect(fault.trace).toEqual({writeSucceeded:true,abortIssued:true})
  const candidate=input(controller.snapshot.view!)
  expect(candidate.features.relay!.periods).toHaveLength(0);expect(candidate.view.hasCandidate).toBe(true)
  expect(relayFocusFromSaved(previous,candidate,command.kind,payload,focus)).toBeNull()
  expect(seasonFocusAfterSave(previous,candidate,command.kind,payload,focus)).toBe(focus)
  expect(controller.exportSaved()).toBe(savedBefore);expect(await physical.exportStored(run.runId)).toBe(savedBefore)
  expect((await controller.retry()).status).toBe('saved')
  const current=input(controller.snapshot.view!),period=current.features.relay!.periods[0]!
  const next=relayFocusFromSaved(previous,current,command.kind,payload,focus)!
  expect(next.relayTarget).toEqual({...identity,kind:'period',periodId:period.id})
  expect(seasonFocusAfterSave(previous,current,command.kind,payload,focus)).toEqual(next)
  expect(playerThread(current,next)).toMatchObject({focusStatus:'valid',stage:'relay-planned',outcome:'pending',wait:{date:'2025-01-28'}})
  expect(openingFocusFor(current,'relay',{relayTarget:next.relayTarget,accountId:identity.accountId})).toEqual(next)
  const beforeRead=controller.exportSaved(),choices=seasonFocusChoices(current)
  expect(choices.some(c=>c.focus.kind==='relay'&&c.focus.relayTarget?.kind==='period'&&c.focus.relayTarget.periodId===period.id)).toBe(true)
  expect(seasonRecollection(current)!.allNodes.some(node=>node.id==='relay-plan:'+period.id)).toBe(true)
  const html=renderToStaticMarkup(createElement(OpeningMoment,{p:{...current,controller,accountId:identity.accountId,request:()=>{throw Error('RELAY_SCENE_RENDER_MUST_NOT_EXECUTE')}},headingRef:null,fallback:roomMoment(current),focus:next,onNavigate:()=>{},onExplore:()=>{}}))
  expect(current.view.budget.available).toBe(1)
  expect(html).toContain('relay-service-kit-v1.png');expect(html).not.toContain('video-making-kit-v1.png')
  expect(html).toContain('本期服务单');expect(html).toContain('翻看本期约定与原账');expect(html).not.toContain('先保留这一季的工作')
  expect(controller.exportSaved()).toBe(beforeRead)
  const advance=controller.prepare('AdvanceTime',{date:'2025-01-28'});expect((await controller.submit(advance)).status).toBe('saved')
  const running=input(controller.snapshot.view!)
  expect(relayFocusFromSaved(current,running,'AdvanceTime',{date:'2025-01-28'},next)).toBeNull()
  expect(seasonFocusAfterSave(current,running,'AdvanceTime',{date:'2025-01-28'},next)).toBe(next)
  expect(playerThread(running,next)).toMatchObject({stage:'relay-service',outcome:'pending'})
  const stop={periodId:period.id};expect((await controller.submit(controller.prepare('StopRelayPeriod',stop))).status).toBe('saved')
  const stopped=input(controller.snapshot.view!)
  expect(relayFocusFromSaved(running,stopped,'StopRelayPeriod',stop,next)).toBe(next)
  expect(stopped.features.relay!.periods[0]!.stoppedAt).toBe('2025-01-28')
  expect(stopped.features.relay!.periods[0]!.supportJob?.status).toBe('planned')
  expect(playerThread(stopped,next).line).toContain('支持')
 }finally{await controller.close();await physical.close()}
},30000)

it('keeps actual old period and audit anchors separate from wrong run, owner, station and unrelated jobs',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'relay-focus-old-record'})
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
 try{
  await controller.initialize();await controller.importNew(settled)
  const p=input(controller.snapshot.view!),v=p.features.relay!,period=v.periods[0]!,identity=relayBusinessTarget(p,period.businessId)!
  expect(p.view.origin).toBe('normal');expect(p.view.revision).toBe(105)
  const focus=relayFocusFor(p,{...identity,kind:'period',periodId:period.id}),raw=controller.exportSaved()
  expect(resolveRelayFocus(p,focus).reason).toBeNull()
  for(const target of [{...identity,kind:'period' as const,periodId:'missing-period'},{...identity,kind:'period' as const,periodId:period.id,runId:'other-life'},{...identity,kind:'period' as const,periodId:period.id,accountId:'personal'},{...identity,kind:'period' as const,periodId:period.id,stationId:'missing-station'},{...identity,kind:'period' as const,periodId:period.id,jobId:p.view.operations!.jobs.find(j=>j.definitionId==='relay-application')!.id}]){
   const invalid=relayFocusFor(p,target)
   expect(playerThread(p,invalid)).toMatchObject({focusStatus:'invalid',focusScope:'invalid',outcome:'none'})
   expect(playerThread(p,invalid).command).toBeUndefined();expect(playerThread(p,invalid).wait).toBeUndefined()
   expect(playerThread(p,invalid).focus).toBe(invalid)
  }
  const audit=v.auditJobs.find(a=>a.periodIds.includes(period.id))!
  const original=relayFocusFor(p,{...identity,kind:'period',periodId:period.id,jobId:audit.jobId})
  const thread=playerThread(p,original)
  expect(thread.focusStatus).toBe('valid');expect(thread.stage).toBe('relay-records');expect(thread.wait).toBeUndefined();expect(thread.command).toBeUndefined()
  expect(thread.inspect.target?.relayTarget).toEqual(original.relayTarget)
  expect(seasonFocusChoices(p).some(c=>c.focus.kind==='relay'&&c.focus.relayTarget?.kind==='period'&&c.focus.relayTarget.jobId===audit.jobId)).toBe(true)
  expect(seasonRecollection(p)!.allNodes.some(node=>node.id==='relay-audit:'+audit.jobId+':'+period.id)).toBe(true)
  expect(controller.exportSaved()).toBe(raw)
 }finally{await controller.close()}
},30000)
