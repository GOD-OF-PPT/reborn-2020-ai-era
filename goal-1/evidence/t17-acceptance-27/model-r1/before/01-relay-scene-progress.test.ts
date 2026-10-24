import {expect,it} from 'vitest'
import {createCampaignRun,campaignRelay} from '../application/campaign.ts'
import {projectRelay,type RelayProjection} from '../core/relay-projection.ts'
import {accountPosition,metricsFor} from '../core/ledger.ts'
import {relayAuditableMeters,relaySceneProgress} from './relay-scene-progress.ts'

type Relay=NonNullable<RelayProjection>
type Business=Relay['businesses'][number]
type Period=Relay['periods'][number]
type Job=NonNullable<Relay['preparations'][number]['job']>
type Meter=Relay['meters'][number]
type Customer=Relay['customers'][number]
// Complete public display variants only. These are never exported as earned histories.
const initial=createCampaignRun({runId:'relay-scene-display',actorId:'player',commandId:'create',backgroundId:'technical_employee',seed:'relay-public-display-only'})
const empty=projectRelay(initial,campaignRelay)!
const position=accountPosition(initial.economy.ledger,'personal')
function business(overrides:Partial<Business>={}):Business{
 return {id:'business',definitionId:'relay-station',route:'api_relay',accountId:'relay-account',company:true,lifecycle:'operating',prepared:true,activeFrom:'2025-01-01',stoppedAt:null,distributedFen:0,monthlyMaintenanceFen:30000,history:[{date:'2025-01-01',state:'operating',sourceId:'public-source'}],funds:{...position},metrics:{...metricsFor(initial.economy.ledger,'personal','business'),accruedCostFen:0},...overrides}
}
function job(overrides:Partial<Job>={}):Job{
 return {id:'service-job',businessId:'business',definitionId:'relay-service',contractId:null,actionId:'public-action',resources:['player-production'],startAt:'2025-01-01',completeAt:'2025-01-29',releasedAt:null,status:'running',outputId:null,...overrides}
}
function period(overrides:Partial<Period>={}):Period{
 const closed=overrides.status==='closed'
 return {id:'period',businessId:'business',customerIds:['customer'],supplierIds:['cedar-direct'],createdAt:'2024-12-31',from:'2025-01-01',to:'2025-01-29',jobId:'service-job',supportJobId:'support-job',supportMode:'guided',maxUnits:300000,maxSupplierCostFen:1200000,feeQuotes:[{customerId:'customer',termsId:'saved-offer',amountFen:50000}],status:'running',feePostedAt:closed?'2025-02-05':null,compensatedAt:closed?'2025-02-05':null,stoppedAt:null,job:job({status:closed?'completed':'running'}),supportJob:job({id:'support-job',definitionId:'relay-support-guided',startAt:'2025-01-29',completeAt:'2025-02-05',status:closed?'completed':'planned'}),reportedUnits:100,observedDays:1,failedDays:0,meterCount:1,auditedMeters:0,knownCorrections:0,...overrides}
}
function meter(overrides:Partial<Meter>={}):Meter{
 return {id:'meter',periodId:'period',customerId:'customer',date:'2025-01-01',reportedUnits:100,unitPriceFen:6,termsId:'saved-offer',supplierId:'cedar-direct',rateId:'cedar-v3',unitCostFen:3,supplierBilling:'postpaid',reason:null,deliveryIds:['original-delivery'],costOperationId:'original-supplier-cost',supplierDueAt:'2025-01-08',correctionId:null,auditedUnits:null,...overrides}
}
function customer(overrides:Partial<Customer>={}):Customer{
 const terms={id:'saved-offer',effectiveAt:'2025-01-01',offerId:'managed_support' as const,unitPriceFen:6,serviceFeeFen:50000,sourceId:'saved-offer'}
 return {id:'customer',businessId:'business',personId:'public-person',originAudienceId:'audience',originCohortIds:[],conversionId:'conversion',segment:'local_merchants',signedAt:'2025-01-01',initialTermEnd:'2025-03-31',termEnd:'2025-03-31',initialMode:'prepaid',initialCreditLimitFen:0,mode:'prepaid',creditLimitFen:0,monthlyUnits:60000,rechargeLimitFen:530000,terms:[terms],closedAt:null,activeTerms:terms,balance:{prepaidFen:0,receivableFen:0,recognizedIncomeFen:0},dueReceivableFen:0,...overrides}
}
function projection(overrides:Partial<Relay>={}):Relay{
 return {...structuredClone(empty),technicallyReady:true,businesses:[business()],stations:[{id:'station',businessId:'business',createdAt:'2025-01-01',trafficPaused:false,closedAt:null}],...overrides}
}
function auditRows(status:Job['status'],meterId='meter'){
 const actualJob=job({id:'audit-job',definitionId:'relay-meter-audit',startAt:'2025-02-05',completeAt:'2025-02-08',status})
 return {audits:[{id:'audit',businessId:'business',meterId,jobId:actualJob.id,completedAt:status==='completed'?'2025-02-08':null,actualUnits:status==='completed'?100:null}],auditJobs:[{jobId:actualJob.id,job:actualJob,businessId:'business',periodIds:['period'],meterCount:1,completed:status==='completed'}]}
}
function freeze<T>(value:T):T{
 if(value!==null&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))freeze(child)}
 return value
}

it('has an opening story without inventing a company, permission or paid customer',()=>{
 expect(relaySceneProgress(null,'2025-01-01')).toBeNull()
 const p=relaySceneProgress({...empty,businesses:[]},'2025-01-01')!
 expect(p.phase).toBe('opening');expect(p.businessId).toBeNull();expect(p.periodIds).toEqual([])
 expect(p.command).toBeNull();expect(p.audit).toBeNull();expect(p.nextDate).toBeNull()
})
it('reads a completed but unread supply letter before using exposed derived permission or adapter fields',()=>{
 const completed=job({id:'application-job',definitionId:'relay-application',completeAt:'2025-01-08',status:'completed'})
 const p=relaySceneProgress(projection({applications:[{id:'application',businessId:'business',supplierId:'cedar-direct',jobId:completed.id,appliedAt:'2025-01-01',decisionAt:'2025-01-08',approved:null,expiresAt:null,read:false,allowedSegments:['local_merchants'],purpose:'licensed_service_aggregation',job:completed}],supplyOptions:[{businessId:'business',supplierId:'cedar-direct',permitted:true,adapted:true,credit:null,outstandingFen:0}],adapters:[{id:'initial-adapter',businessId:'business',supplierId:'cedar-direct',jobId:completed.id,kind:'initial_verification',job:completed}]}),'2025-01-08')!
 expect(p.phase).toBe('supplier-letter');expect(p.command).toEqual({kind:'ReadRelaySupplyDecision',payload:{applicationId:'application'},confirm:false})
 expect(p.line).not.toContain('已批准');expect(p.audit).toBeNull()
})
it('keeps planned preparation and actual running marketing dates distinct from completion',()=>{
 const prep=job({id:'preparation-job',definitionId:'relay-preparation',status:'planned',startAt:'2025-01-10',completeAt:'2025-01-17'})
 const prepared=relaySceneProgress(projection({businesses:[business({lifecycle:'preparing'})],preparations:[{id:'preparation',businessId:'business',kind:'materials',jobId:prep.id,job:prep}]}),'2025-01-09')!
 expect(prepared.phase).toBe('preparation');expect(prepared.nextDate).toBe('2025-01-10');expect(prepared.completeAt).toBe('2025-01-17')
 const marketing=job({id:'marketing-job',definitionId:'relay-marketing',startAt:'2025-01-02',completeAt:'2025-01-09'})
 const p=relaySceneProgress(projection({audiences:[{id:'audience',businessId:'business',segment:'local_merchants',mode:'paid',createdAt:'2025-01-02',jobId:marketing.id,sourceCohortIds:[],completedAt:null,members:[],job:marketing}]}),'2025-01-05')!
 expect(p.phase).toBe('marketing');expect(p.nextDate).toBe('2025-01-09');expect(p.line).toContain('尚未完成');expect(p.command).toBeNull()
})
it('does not treat interrupted preparation or a hidden supply outcome as completed public work',()=>{
 const stopped=job({definitionId:'relay-preparation',status:'interrupted'})
 const p=relaySceneProgress(projection({businesses:[business({lifecycle:'preparing'})],preparations:[{id:'preparation',businessId:'business',kind:'materials',jobId:stopped.id,job:stopped}]}),'2025-01-05')!
 expect(p.phase).toBe('preparation');expect(p.nextDate).toBeNull();expect(p.completeAt).toBeNull();expect(p.command).toBeNull()
})
it('uses the public service and support jobs as different clock commitments',()=>{
 const planned=period({job:job({status:'planned',startAt:'2025-01-10',completeAt:'2025-02-07'})})
 expect(relaySceneProgress(projection({periods:[planned]}),'2025-01-09')).toMatchObject({phase:'planned',nextDate:'2025-01-10',completeAt:'2025-02-07'})
 expect(relaySceneProgress(projection({periods:[period()]}),'2025-01-11')).toMatchObject({phase:'service',nextDate:'2025-01-29',completeAt:'2025-01-29'})
 const support=period({job:job({status:'completed'}),supportJob:job({id:'support-job',definitionId:'relay-support-guided',startAt:'2025-01-29',completeAt:'2025-02-05'})})
 const p=relaySceneProgress(projection({periods:[support]}),'2025-01-30')!
 expect(p.phase).toBe('support');expect(p.nextDate).toBe('2025-02-05');expect(p.line).toContain('不等于支持已经完成')
})
it('allows a same-day start/completion phase to reach the original clock without backdating',()=>{
 const p=relaySceneProgress(projection({periods:[period({job:job({status:'planned',startAt:'2025-01-10',completeAt:'2025-02-07'})})]}),'2025-01-10')!
 expect(p.nextDate).toBe('2025-01-10')
 const late=relaySceneProgress(projection({periods:[period({job:job({completeAt:'2025-01-09'})})]}),'2025-01-10')!
 expect(late.nextDate).toBeNull()
})
it('audits only supplied meters not covered by a planned, running or completed audit job',()=>{
 const original=meter(),unsupplied=meter({id:'unsupplied',supplierId:null,auditedUnits:null})
 const states:Job['status'][]=['planned','running','completed','interrupted','cancelled']
 for(const status of states){
  const r=projection({meters:[original,unsupplied],...auditRows(status)})
  expect(relayAuditableMeters(r,'period')).toEqual(status==='interrupted'||status==='cancelled'?[original]:[])
 }
})
it('keeps new meters auditable while the main story follows actual service and support before another audit',()=>{
 const earlier=meter({auditedUnits:100,date:'2025-01-01'}),newer=meter({id:'new-meter',date:'2025-01-11'})
 const previous=auditRows('completed')
 previous.auditJobs[0]!.job=job({...previous.auditJobs[0]!.job,startAt:'2025-01-02',completeAt:'2025-01-05'})
 previous.audits[0]!.completedAt='2025-01-05'
 const r=projection({periods:[period({meterCount:999,auditedMeters:999})],meters:[earlier,newer],...previous})
 expect(relayAuditableMeters(r,'period')).toEqual([newer])
 const serving=relaySceneProgress(r,'2025-01-11')!
 expect(serving.phase).toBe('service');expect(serving.audit).toBeNull();expect(serving.nextDate).toBe('2025-01-29');expect(serving.choice.line).toContain('已记录')
 const dayOne=relaySceneProgress(projection({periods:[period()],meters:[meter()]}),'2025-01-01')!
 expect(dayOne.phase).toBe('service');expect(dayOne.audit).toBeNull();expect(dayOne.nextDate).toBe('2025-01-29')
 const supportPeriod=period({job:job({status:'completed'}),supportJob:job({id:'support-job',definitionId:'relay-support-guided',startAt:'2025-01-29',completeAt:'2025-02-05'})})
 const supporting=relaySceneProgress({...r,periods:[supportPeriod]},'2025-01-30')!
 expect(supporting.phase).toBe('support');expect(supporting.audit).toBeNull();expect(supporting.nextDate).toBe('2025-02-05')
 const p=relaySceneProgress({...r,periods:[period({status:'closed',meterCount:999,auditedMeters:999})]},'2025-02-09')!
 expect(p.phase).toBe('audit-ready');expect(p.audit).toEqual({businessId:'business',periodId:'period'})
 expect(p.command).toBeNull();expect(p.completeAt).toBeNull();expect(p.choice.line).toContain('1条')
})
it('retains interrupted support responsibility during service and does not call stopped service completed',()=>{
 const stoppedSupport=job({id:'support-job',definitionId:'relay-support-guided',startAt:'2025-01-29',completeAt:'2025-02-05',status:'interrupted'})
 const serving=relaySceneProgress(projection({periods:[period({supportJob:stoppedSupport})],meters:[meter()]}),'2025-01-10')!
 expect(serving.phase).toBe('service');expect(serving.line).toContain('原支持已中断或取消');expect(serving.line).toContain('等候不会自动补做')
 const support=job({id:'support-job',definitionId:'relay-support-guided',startAt:'2025-01-29',completeAt:'2025-02-05'})
 const stoppedService=period({status:'stopped',job:job({status:'cancelled'}),supportJob:support})
 const supporting=relaySceneProgress(projection({periods:[stoppedService],meters:[meter()]}),'2025-01-30')!
 expect(supporting.phase).toBe('support');expect(supporting.title).toContain('请求停下');expect(supporting.line).toContain('原服务已中断或取消');expect(supporting.nextDate).toBe('2025-02-05');expect(supporting.audit).toBeNull()
 const closed=relaySceneProgress(projection({periods:[period({status:'closed',supportJob:stoppedSupport})]}),'2025-02-06')!
 expect(closed.phase).toBe('period-closed');expect(closed.line).toContain('原支持已中断或取消');expect(closed.line).toContain('不等于企业关闭')
})
it('waits for actual audit work and never promotes an unaudited hidden value to a correction',()=>{
 const withHiddenExtra={...meter(),actualUnits:987654321}
 const waiting=relaySceneProgress(projection({periods:[period({status:'closed'})],meters:[withHiddenExtra],...auditRows('running')}),'2025-02-06')!
 expect(waiting.phase).toBe('audit-waiting');expect(waiting.nextDate).toBe('2025-02-08');expect(waiting.audit).toBeNull();expect(waiting.command).toBeNull()
 expect(JSON.stringify(waiting)).not.toContain('987654321')
 const publicOnly=relaySceneProgress(projection({periods:[period({status:'closed'})],meters:[withHiddenExtra]}),'2025-02-06')!
 expect(publicOnly.phase).toBe('audit-ready');expect(publicOnly.command).toBeNull()
})
it('promotes a known uncorrected old closed period and keeps every period explicitly reachable',()=>{
 const old=period({id:'old-period',status:'closed',from:'2024-12-01'}),current=period({id:'current-period'}),others=Array.from({length:6},(_,n)=>period({id:'other-'+n,status:'closed'}))
 const r=projection({periods:[old,current,...others],meters:[meter({periodId:old.id,auditedUnits:90})]})
 const p=relaySceneProgress(r,'2025-02-06')!
 expect(p.phase).toBe('correction');expect(p.periodId).toBe(old.id);expect(p.periodIds).toEqual(r.periods.map(p=>p.id));expect(p.periodIndex).toBe(0)
 expect(p.command).toEqual({kind:'CorrectRelayPeriod',payload:{periodId:old.id},confirm:true});expect(p.audit).toBeNull()
 const selected=relaySceneProgress(r,'2025-01-10',current.id)!
 expect(selected.periodId).toBe(current.id);expect(selected.periodIndex).toBe(1);expect(selected.phase).toBe('service');expect(selected.periodIds).toHaveLength(8)
 expect(relaySceneProgress(r,'2025-02-06','missing')?.periodId).toBe(old.id)
})
it('does not mistake historical correction counts or an already corrected difference for a new command',()=>{
 const p=relaySceneProgress(projection({periods:[period({status:'closed',knownCorrections:9})],meters:[meter({auditedUnits:90,correctionId:'original-correction'})],...auditRows('completed')}),'2025-02-09')!
 expect(p.phase).toBe('period-closed');expect(p.command).toBeNull();expect(p.audit).toBeNull()
})
it('prefers real current service over an older stopped period without discarding either identity',()=>{
 const stopped=period({id:'stopped',status:'stopped',from:'2024-12-01',job:job({status:'interrupted'}),supportJob:job({status:'interrupted'})}),current=period({id:'current'})
 const r=projection({periods:[stopped,current]})
 expect(relaySceneProgress(r,'2025-01-10')).toMatchObject({periodId:'current',phase:'service',periodIds:['stopped','current']})
 expect(relaySceneProgress(r,'2025-01-10','stopped')).toMatchObject({periodId:'stopped',phase:'settling'})
})
it('falls back to old periods when a current company has no period and retains explicit scope for every record',()=>{
 const oldBusiness=business({id:'old-business',lifecycle:'closed'}),newBusiness=business({id:'new-business',lifecycle:'preparing'})
 const oldClosed=period({id:'old-closed',businessId:oldBusiness.id,status:'closed'}),oldUnclosed=period({id:'old-unclosed',businessId:oldBusiness.id,status:'stopped',job:job({status:'interrupted'}),supportJob:job({status:'interrupted'})})
 const r=projection({businesses:[oldBusiness,newBusiness],periods:[oldClosed,oldUnclosed]})
 expect(relaySceneProgress(r,'2025-02-09')).toMatchObject({businessId:oldBusiness.id,periodId:oldUnclosed.id,phase:'closed',periodIds:[oldClosed.id,oldUnclosed.id]})
 for(const record of r.periods)expect(relaySceneProgress(r,'2025-02-09',record.id)).toMatchObject({businessId:oldBusiness.id,periodId:record.id,periodIds:[oldClosed.id,oldUnclosed.id]})
 expect(relaySceneProgress({...r,periods:[oldClosed]},'2025-02-09')?.periodId).toBe(oldClosed.id)
})
it('collects only actually due original receivables and labels the customer-wide scope',()=>{
 const invoice={id:'invoice',customerId:'customer',sourceId:'original-meter',date:'2024-12-20',dueAt:'2025-01-10',operationId:'original-credit-use',amountFen:10000,collectedFen:1000,reversedFen:2000}
 const r=projection({customers:[customer({mode:'postpaid',creditLimitFen:500000,dueReceivableFen:7000})],receivables:[invoice]})
 expect(relaySceneProgress(r,'2025-01-09')?.command).toBeNull()
 const p=relaySceneProgress(r,'2025-01-10')!
 expect(p.phase).toBe('collection');expect(p.command).toEqual({kind:'CollectRelayDue',payload:{customerId:'customer'},confirm:true});expect(p.choice.line).toContain('全部已到期');expect(p.line).toContain('不会再确认一次新的收入')
})
it('keeps stopped customer balances, supplier assets and original debt distinct from a closed company',()=>{
 const funds={...position,prepaidLiabilityFen:400000,supplierPrepaidFen:20000,receivableFen:30000,payableFen:10000}
 const stopping=relaySceneProgress(projection({businesses:[business({lifecycle:'winding_down',funds})]}),'2025-02-09')!
 expect(stopping.phase).toBe('stopping');expect(stopping.choice.line).toContain('客户未消费余额');expect(stopping.choice.line).toContain('供应资产');expect(stopping.command).toBeNull()
 const closed=relaySceneProgress(projection({businesses:[business({lifecycle:'closed',funds})],periods:[period({status:'closed'})],meters:[meter()]}),'2025-02-09','period')!
 expect(closed.phase).toBe('closed');expect(closed.audit).toBeNull();expect(closed.periodIds).toEqual(['period'])
})
it('distinguishes paused traffic from paused new contracts and preserves public price changes',()=>{
 const traffic=relaySceneProgress(projection({stations:[{id:'station',businessId:'business',createdAt:'2025-01-01',trafficPaused:true,closedAt:null}],periods:[period()]}),'2025-01-10')!
 expect(traffic.phase).toBe('paused');expect(traffic.line).toContain('原交通已暂停');expect(traffic.nextDate).toBe('2025-01-29')
 const contracts=relaySceneProgress(projection({businesses:[business({lifecycle:'paused'})]}),'2025-01-10')!
 expect(contracts.phase).toBe('paused');expect(contracts.line).toContain('不因此自动停止')
 const change=relaySceneProgress(projection({changes:[{id:'change',businessId:'business',anchorId:'H009',date:'2025-01-20',acknowledgedAt:null}]}),'2025-01-20')!
 expect(change.phase).toBe('market-change');expect(change.command).toBeNull();expect(change.line).toContain('不替你重谈客户报价')
})
it('leaves real intake, saved quote, contract and recharge choices separate',()=>{
 const audience={id:'audience',businessId:'business',segment:'local_merchants' as const,mode:'video_referral' as const,createdAt:'2025-01-01',jobId:null,sourceCohortIds:['actual-video-cohort'],completedAt:'2025-01-01',members:['public-person'],job:null}
 expect(relaySceneProgress(projection(),'2025-01-01')?.phase).toBe('intake')
 const offer=relaySceneProgress(projection({audiences:[audience]}),'2025-01-01')!
 expect(offer.phase).toBe('terms');expect(offer.choice.label).toContain('保存本次报价');expect(offer.command).toBeNull()
 const signed=relaySceneProgress(projection({audiences:[audience],offers:[{id:'actual-saved-offer-id',businessId:'business',createdAt:'2025-01-01',offerId:'managed_support',unitPriceFen:6,serviceFeeFen:50000}]}),'2025-01-01')!
 expect(signed.choice.label).toContain('已保存报价');expect(signed.command).toBeNull()
 const funded=relaySceneProgress(projection({customers:[customer()]}),'2025-01-01')!
 expect(funded.phase).toBe('funding');expect(funded.choice.line).toContain('不能凭当前余额推算');expect(funded.command).toBeNull()
})
it('does not mutate or consume a frozen public projection while switching all period scopes',()=>{
 const r=freeze(projection({periods:[period({id:'first'}),period({id:'second',status:'closed'})],meters:[meter({periodId:'second',auditedUnits:90})]})),before=JSON.stringify(r)
 for(let n=0;n<10;n++)for(const id of ['first','second',null])relaySceneProgress(r,'2025-01-10',id)
 relayAuditableMeters(r,'second')
 expect(JSON.stringify(r)).toBe(before)
})
