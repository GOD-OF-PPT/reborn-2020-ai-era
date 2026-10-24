import {beforeAll,expect,it} from 'vitest'
import {createCampaignCodec,campaignRelay,campaignRuntime,campaignOperations,campaignMarket} from '../application/campaign.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {evaluateCommand} from '../core/commands.ts'
import {prepareRelayF04} from '../testing/relay-scenarios.ts'
import normalReadyRaw from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0091.json?raw'
import {projectRelay,type RelayProjection} from '../core/relay-projection.ts'
import {canonicalRelayTarget,relayTargetReason,resolveRelaySceneTarget,type RelaySceneTarget,type RelaySceneContext} from './relay-scene-target.ts'
import {relaySceneProgress} from './relay-scene-progress.ts'
import {relayWorkTarget} from './relay-work-target.ts'

/** Original normal r91 was earned/audited from Create; this test imports it and executes only the affected suffix. */
function actualFrames(){
 const codec=createCampaignCodec();let run=codec.import(normalReadyRaw),count=0
 const business=run.operations!.businesses.find(b=>b.route==='api_relay')!
 const frame=()=>({relay:projectRelay(run,campaignRelay)!,date:run.timeline.cursor.date,context:{runId:run.runId,accountId:business.accountId,operations:run.operations!}})
 const send=(kind:string,payload:unknown)=>{const result=evaluateCommand(run,{runId:run.runId,actorId:'player',commandId:'r1-target-'+(++count),expectedRevision:run.revision,kind,payload},codec.registry,'player');if(result.status!=='proposed')throw Error(JSON.stringify({kind,result}));run=codec.import(codec.export(result.nextRun))}
 const advance=(date:string)=>{for(let n=0;n<24;n++){
  const w=projectWorkbench(run,campaignRuntime,campaignOperations.catalog,campaignMarket.catalog)
  if(w.pause){const event=w.events.find(e=>e.isBlocking),choice=event?.choices.find(c=>c.isDefault);if(!event||!choice)throw Error('Unexpected original barrier');expect(choice.costFen).toBe(0);expect(choice.actionPoints).toBe(0);send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}
  if(run.timeline.cursor.date>=date)return
  send('AdvanceTime',{date})
 }throw Error('Original clock did not reach '+date)}
 const prepared=frame(),station=prepared.relay.stations[0]!,identity={runId:run.runId,accountId:business.accountId,businessId:business.id,stationId:station.id}
 const customer=prepared.relay.customers.find(c=>c.mode==='postpaid')!
 send('StartRelayServicePeriod',{businessId:business.id,customerIds:[customer.id],supplierIds:['cedar-direct'],maxUnits:2800,maxSupplierCostFen:10000,supportMode:'guided',resources:['player-production'],startAt:'2025-01-28'})
 const planned=frame(),period=run.relay!.periods[0]!,target:RelaySceneTarget={...identity,kind:'period',periodId:period.id}
 advance('2025-03-04')
 const supported=frame()
 send('StartRelayAudit',{periodId:period.id,resources:['player-production'],startAt:'2025-03-05'})
 const oldAudit=frame(),oldJob=oldAudit.relay.auditJobs[0]!.jobId
 send('InterruptJob',{jobId:oldJob})
 const cancelled=frame()
 send('StartRelayAudit',{periodId:period.id,resources:['player-production'],startAt:'2025-03-05'})
 const auditPlanned=frame()
 advance('2025-03-08')
 return {identity,prepared,planned,supported,oldAudit,oldJob,cancelled,auditPlanned,audited:frame(),target}
}
let frames:ReturnType<typeof actualFrames>
beforeAll(()=>{frames=actualFrames()})
const check=(relay:RelayProjection,target:RelaySceneTarget,context:RelaySceneContext)=>resolveRelaySceneTarget(relay,target,context)

it('matches original service/support jobs and keeps the approved application shared baseline source valid',()=>{
 const {prepared,planned,target,identity}=frames,application=prepared.relay.applications[0]!
 const app:RelaySceneTarget={...identity,kind:'application',applicationId:application.id}
 expect(prepared.relay.adapters.some(a=>a.jobId===application.jobId)).toBe(true)
 expect(check(prepared.relay,app,prepared.context).status).toBe('valid')
 expect(relayWorkTarget(prepared.relay,identity.runId,application.jobId,prepared.context.operations)).toEqual(app)
 expect(canonicalRelayTarget(planned.relay,target,planned.context)).toBe(target)
 for(const jobId of [planned.relay.periods[0]!.jobId,planned.relay.periods[0]!.supportJobId]){
  const original={...target,jobId} as RelaySceneTarget
  expect(check(planned.relay,original,planned.context).job?.id).toBe(jobId)
  expect(relayWorkTarget(planned.relay,identity.runId,jobId,planned.context.operations)).toEqual(original)
 }
})

it('reads the original independent personal-account relay without imposing a new company rule',()=>{
 const {h,business}=prepareRelayF04(),relay=projectRelay(h.run,h.relay)!,station=relay.stations[0]!
 expect(business.company).toBe(false);expect(business.accountId).toBe('personal')
 const target:RelaySceneTarget={kind:'business',runId:h.run.runId,accountId:business.accountId,businessId:business.id,stationId:station.id}
 expect(resolveRelaySceneTarget(relay,target,{runId:h.run.runId,accountId:'personal',operations:h.run.operations!}).status).toBe('valid')
})

it('rejects another run/account/station, mixed leaf fields and duplicate public identities without replacing the target',()=>{
 const {planned,target}=frames
 for(const changed of [{runId:'other-life'},{accountId:'personal'},{businessId:'other-business'},{stationId:'other-station'},{periodId:'missing'},{jobId:'missing'}]){
  const invalid={...target,...changed} as RelaySceneTarget,result=check(planned.relay,invalid,planned.context)
  expect(result.status).toBe('invalid');expect(result.target).toBe(invalid);expect(result.reason).toContain('重新选择')
  expect(relaySceneProgress(planned.relay,planned.date,invalid,planned.context)).toMatchObject({phase:'invalid',command:null,audit:null,nextDate:null})
 }
 const mixed={...target,jobId:planned.relay.periods[0]!.jobId,meterId:'another-meter'} as unknown as RelaySceneTarget
 expect(relayTargetReason(planned.relay,mixed,planned.context)).not.toBeNull()
 const duplicated={...planned.relay,periods:[...planned.relay.periods,planned.relay.periods[0]!]}
 expect(check(duplicated,target,planned.context).status).toBe('invalid')
 expect(relaySceneProgress(planned.relay,planned.date,null,planned.context)?.periodId).toBeNull()
})

it('uses actual job status and retains a cancelled audit when a later audit is scheduled for the same period',()=>{
 const {planned,supported,target,cancelled,auditPlanned,oldJob}=frames
 const service=planned.relay.periods[0]!.job!
 const notFinished=relaySceneProgress(planned.relay,service.completeAt,target,planned.context)!
 expect(notFinished.phase).toBe('planned');expect(notFinished.outcome).toBe('pending')
 const oldTarget={...target,jobId:oldJob} as RelaySceneTarget
 expect(relaySceneProgress(cancelled.relay,cancelled.date,oldTarget,cancelled.context)).toMatchObject({historical:true,outcome:'non-success',command:null,audit:null,nextDate:null})
 expect(relaySceneProgress(auditPlanned.relay,auditPlanned.date,oldTarget,auditPlanned.context)).toMatchObject({historical:true,outcome:'non-success',recordId:oldJob,nextDate:null})
 const newAuditTarget={...target,jobId:auditPlanned.relay.auditJobs.at(-1)!.jobId} as RelaySceneTarget
 expect(relaySceneProgress(auditPlanned.relay,auditPlanned.date,newAuditTarget,auditPlanned.context)).toMatchObject({phase:'audit-waiting',historical:false,outcome:'pending',recordId:newAuditTarget.kind==='period'?newAuditTarget.jobId:null})
 expect(relaySceneProgress(auditPlanned.relay,auditPlanned.date,target,auditPlanned.context)?.periodId).toBe(target.kind==='period'?target.periodId:null)
 const originalSupport={...target,jobId:supported.relay.periods[0]!.supportJobId} as RelaySceneTarget
 expect(relaySceneProgress(supported.relay,supported.date,originalSupport,supported.context)).toMatchObject({historical:true,outcome:'actual',command:null,audit:null})
})

it('keeps historical price identity and does not disclose an unaudited actual value',()=>{
 const {supported,audited,target}=frames,meter=supported.relay.meters[0]!
 const original={...target,meterId:meter.id} as RelaySceneTarget
 expect(check(supported.relay,original,supported.context).status).toBe('valid')
 const before=relaySceneProgress(supported.relay,supported.date,original,supported.context)!
 expect(before.line).toContain('实计待核');expect(before.command).toBeNull()
 const after=relaySceneProgress(audited.relay,audited.date,original,audited.context)!
 expect(after.line).toContain('独立复核实计');expect(after.recordId).toBe(meter.id)
 const wrong={...supported.relay,meters:supported.relay.meters.map(m=>m.id===meter.id?{...m,customerId:'other-customer'}:m)}
 expect(check(wrong,original,supported.context).status).toBe('invalid')
 const laterRate={...audited.relay,catalog:{...audited.relay.catalog,suppliers:audited.relay.catalog.suppliers.map(s=>s.id===meter.supplierId&&s.currentRate?{...s,currentRate:{...s.currentRate,id:'later-public-rate'}}:s)}}
 expect(check(laterRate,original,audited.context).status).toBe('valid')
})

it('keeps period collection limited by an original source while describing the customer-wide command honestly',()=>{
 const {supported,target}=frames
 const actual=relaySceneProgress(supported.relay,supported.date,target,supported.context)!
 expect(actual.phase).toBe('collection');expect(actual.line).toContain('全部到期原单');expect(actual.line).toContain('其他账期')
 const outside={...supported.relay,receivables:supported.relay.receivables.map(r=>({...r,sourceId:'other-period'}))}
 expect(relaySceneProgress(outside,supported.date,target,supported.context)?.phase).not.toBe('collection')
})

it('rejects an audit calendar shortcut spanning periods rather than choosing the first period',()=>{
 const {audited,identity}=frames,audit=audited.relay.auditJobs.at(-1)!
 expect(relayWorkTarget(audited.relay,identity.runId,audit.jobId,audited.context.operations)).toMatchObject({kind:'period',jobId:audit.jobId})
 const ambiguous={...audited.relay,auditJobs:audited.relay.auditJobs.map(a=>a.jobId===audit.jobId?{...a,periodIds:[...a.periodIds,'another-original-period']}:a)}
 expect(relayWorkTarget(ambiguous,identity.runId,audit.jobId,audited.context.operations)).toBeNull()
})
