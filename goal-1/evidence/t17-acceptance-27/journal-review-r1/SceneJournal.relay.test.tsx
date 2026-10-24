import {beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec,createCampaignRun,campaignMarket} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {projectRun} from '../core/commands.ts'
import {projectRelay} from '../core/relay-projection.ts'
import {prepareRelayF04} from '../testing/relay-scenarios.ts'
import type {GamePanelProps,PlayFeatures,PlayingView,SceneTarget} from './game-types.ts'
import {SceneJournal,relayCalendarTargets,sceneWorks} from './SceneJournal.tsx'

// Execute this component's real handlers. This does not render a DOM or claim browser focus behavior.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 return {...actual,useState:<T,>(initial:T|(()=>T))=>{
  const index=hooks.index++
  if(!(index in hooks.values))hooks.values[index]=typeof initial==='function'?(initial as ()=>T)():initial
  return [hooks.values[index] as T,(value:T|((previous:T)=>T))=>{hooks.values[index]=typeof value==='function'?(value as (previous:T)=>T)(hooks.values[index] as T):value}]
 }}
})
type Element=ReactElement<Record<string,unknown>>
function elements(value:unknown):Element[]{if(Array.isArray(value))return value.flatMap(elements);return isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children)]:[]}
function text(value:unknown):string{return typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''}

/** Official commands/projectors, independent F04 finance origin; the unused UI controller never opens a store. */
function fixture(){
 const {h,business}=prepareRelayF04({parameters:{monthlyUnits:1000}}),codec=createCampaignCodec()
 const base=createCampaignRun({runId:'relay-journal-public-base',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'relay-journal-public-base'})
 const original=codec.registry.runtime!.project!(base) as unknown as PlayFeatures
 const controller=new GameController({codec,store:new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'unused-journal-view'}),locks:new MemoryWriterAccess()})
 const capture=():GamePanelProps=>{
  const features={...original,relay:projectRelay(h.run,h.relay),workbench:projectWorkbench(h.run,h.runtime,h.operations.catalog,campaignMarket.catalog)}
  const view:PlayingView={...projectRun(h.run),features,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
  return {controller,view,features,accountId:business.accountId,request:vi.fn()}
 }
 h.send('StartRelayMarketing',{businessId:business.id,segment:'local_merchants',mode:'paid',resources:['player-production'],startAt:'2025-01-01'})
 h.send('AdvanceTime',{date:'2025-01-08'});h.send('SetRelayOffer',{businessId:business.id,offerKind:'managed_support',unitPriceFen:6})
 const audience=h.run.relay!.audiences[0]!,offer=h.run.relay!.offers[0]!
 h.send('SignRelayCustomers',{businessId:business.id,audienceId:audience.id,offerId:offer.id,personIds:audience.members.slice(0,1),termEnd:'2025-03-31',mode:'postpaid',creditLimitFen:500000})
 h.send('StartRelayServicePeriod',{businessId:business.id,customerIds:[h.run.relay!.customers[0]!.id],supplierIds:['cedar-direct'],maxUnits:2800,maxSupplierCostFen:10000,supportMode:'guided',resources:['player-production'],startAt:'2025-01-09'})
 const planned=capture(),periodId=h.run.relay!.periods[0]!.id
 h.send('AdvanceTime',{date:'2025-02-13'});h.send('StartRelayAudit',{periodId,resources:['player-production'],startAt:'2025-02-14'})
 return {planned,audit:capture(),businessId:business.id,periodId}
}
let frames:ReturnType<typeof fixture>
beforeAll(()=>{frames=fixture()})

/** Deliberate public display variant for a shared audit batch, never exported as an earned normal history. */
function multiPeriodDisplay(){
 const source=frames.audit,relay=source.features.relay!,first=relay.periods[0]!,batch=relay.auditJobs[0]!
 const service={...first.job!,id:'display-service-b'},support={...first.supportJob!,id:'display-support-b'}
 const second={...first,id:'display-period-b',jobId:service.id,supportJobId:support.id,job:service,supportJob:support}
 const meter={...relay.meters[0]!,id:'display-meter-b',periodId:second.id}
 const audit={...relay.audits[0]!,id:'display-audit-b',meterId:meter.id}
 const next={...relay,periods:[first,second],meters:[...relay.meters,meter],audits:[...relay.audits,audit],auditJobs:[{...batch,periodIds:[first.id,second.id],meterCount:batch.meterCount+1}]}
 const features={...source.features,relay:next},view={...source.view,features,operations:{...source.view.operations!,jobs:[...source.view.operations!.jobs,service,support]}}
 return {...source,features,view}
}

it('maps each actual service/support/audit job to the original full run, account, station and period',()=>{
 for(const p of [frames.planned,frames.audit]){
  const period=p.features.relay!.periods[0]!
  const ids=p===frames.planned?[period.jobId,period.supportJobId]:[p.features.relay!.auditJobs[0]!.jobId]
  for(const id of ids){
   const work=sceneWorks(p).find(row=>row.id===id)!
   expect(work.screen).toBe('relay')
   expect(work.relayTarget).toEqual({kind:'period',runId:p.view.runId,accountId:p.accountId,businessId:frames.businessId,stationId:p.features.relay!.stations[0]!.id,periodId:period.id,jobId:id})
  }
 }
})

it('offers every valid original period in a shared audit and refuses to select a valid subset of a broken batch',()=>{
 const p=multiPeriodDisplay(),batch=p.features.relay!.auditJobs[0]!,choices=relayCalendarTargets(p,batch.jobId,frames.businessId)
 expect(choices.map(t=>t.kind==='period'?t.periodId:null)).toEqual(batch.periodIds)
 expect(choices.every(t=>t.kind==='period'&&t.jobId===batch.jobId&&t.runId===p.view.runId&&t.accountId===p.accountId)).toBe(true)
 const broken={...p,features:{...p.features,relay:{...p.features.relay!,periods:p.features.relay!.periods.slice(0,1)}}}
 expect(relayCalendarTargets(broken,batch.jobId,frames.businessId)).toEqual([])
 const work=sceneWorks(p).find(row=>row.id===batch.jobId)!
 expect(work.relayTarget).toBeUndefined();expect(work.relayChoices).toEqual(choices)
})

it('requires an explicit original period click and drops a pending chooser after the run changes',()=>{
 let p=multiPeriodDisplay();const before=JSON.stringify(p.features),navigate=vi.fn<(screen:string,target?:SceneTarget)=>void>()
 hooks.values=[]
 let tree:ReturnType<typeof SceneJournal>|null=null
 const render=()=>{hooks.index=0;tree=SceneJournal({p,onNavigate:navigate})}
 const click=(label:string)=>{const button=elements(tree).find(e=>e.type==='button'&&text(e.props.children)===label);if(!button||typeof button.props.onClick!=='function')throw Error('REAL_VISIBLE_HANDLER_REQUIRED:'+label);button.props.onClick();render()}
 render();click('走近这件事 →')
 expect(navigate).not.toHaveBeenCalled()
 expect(elements(tree).some(e=>e.props.title==='这次复核，覆盖了几段原账')).toBe(true)
 click('查看原账期2与这次复核')
 expect(navigate).toHaveBeenCalledExactlyOnceWith('relay',{accountId:p.accountId,relayTarget:relayCalendarTargets(p,p.features.relay!.auditJobs[0]!.jobId,frames.businessId)[1]})
 expect(p.request).not.toHaveBeenCalled();expect(JSON.stringify(p.features)).toBe(before)
 navigate.mockClear();click('走近这件事 →')
 p={...p,view:{...p.view,runId:'another-visible-life'}};render()
 expect(elements(tree).some(e=>e.props.title==='这次复核，覆盖了几段原账')).toBe(false)
 expect(navigate).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled()
 hooks.values=[]
})
