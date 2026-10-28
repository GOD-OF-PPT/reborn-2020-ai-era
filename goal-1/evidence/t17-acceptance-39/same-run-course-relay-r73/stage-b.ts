import fs from 'node:fs'
import path from 'node:path'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../../../../src/application/campaign.ts'
import {GameController} from '../../../../src/application/game-controller.ts'
import {IndexedDbRunStore} from '../../../../src/persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../../../../src/testing/memory-writer-access.ts'
import {addDays,quarterOf} from '../../../../src/core/calendar.ts'
import type {PlayFeatures} from '../../../../src/ui/game-types.ts'
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs'
import {ident} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs'

const root='goal-1/evidence/t17-acceptance-39',out=root+'/same-run-course-relay-r73',input=root+'/same-run-course-relay-r49/stage-a-normal.json',codec=createCampaignCodec()
const store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'cux09-same-run-mixed-stage-b-r73'})
let serial=0
const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=> 'cux09-mixed-c-'+(++serial)})
const current=()=>{const view=controller.snapshot.view!;return {view,features:view.features as unknown as PlayFeatures}}
const commands:unknown[]=[],probes:unknown[]=[]
const put=(name:string,value:unknown)=>{guard(path.resolve(out));fs.writeFileSync(out+'/'+name,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})}
async function send(kind:string,payload:unknown){
 const p=current(),command=controller.prepare(kind,payload),preview=controller.preview(command)
 probes.push({kind,payload,date:p.view.date,revision:p.view.revision,budget:p.view.budget,preview})
 if(!preview.allowed)throw Error('ORIGINAL_PREVIEW:'+kind+':'+preview.reasonCodes.join(','))
 const result=await controller.submit(command)
 commands.push({command,status:result.status,reasons:result.reasonCodes,date:current().view.date,revision:current().view.revision})
 if(result.status!=='saved')throw Error('ORIGINAL_SAVE:'+kind+':'+result.status)
 return command
}
async function advance(target:string){
 for(let n=0;n<180;n++){
  const p=current(),w=p.features.workbench
  if(w.pause){
   const rows=w.events.filter(e=>e.id===w.pause!.instanceId||e.isBlocking),event=rows.find(e=>e.id===w.pause!.instanceId)??(rows.length===1?rows[0]:undefined),choice=event?.choices.find(c=>c.isDefault&&c.costFen===0&&c.actionPoints===0)
   if(!event||!choice)throw Error('EXPLICIT_PUBLIC_RESPONSE_REQUIRED:'+w.pause.reason)
   await send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue
  }
  if(w.progression.requiresDelivery)throw Error('ORIGINAL_MANUAL_DELIVERY_REQUIRED')
  const due=p.view.operations?.jobs.some(j=>j.status==='planned'&&j.startAt<=target||j.status==='running'&&j.completeAt<=target)
  if(p.view.date>=target&&!due)return
  const date=w.atQuarterEnd?w.progression.nextQuarterDate:target
  if(!date)throw Error('NO_PUBLIC_QUARTER_DATE')
  await send('AdvanceTime',{date:date>target?target:date})
 }throw Error('BOUNDED_ORIGINAL_CLOCK_LIMIT')
}
async function refresh(courseId:string,startAt:string){
 await advance(startAt)
 const lesson=current().features.course!.courses.find(c=>c.id===courseId)!
 if(!lesson.unresolvedUpdates.length)throw Error('ACTUAL_PUBLIC_UPDATE_REQUIRED')
 await send('StartCourseRefresh',{courseId,resources:['player-production'],startAt})
 await advance(addDays(startAt,7))
 const next=current().features.course!.courses.find(c=>c.id===courseId)!
 if(next.unresolvedUpdates.length)throw Error('REAL_REFRESH_NOT_COMPLETED')
 if(next.paused)await send('ResumeCourseEnrollment',{courseId})
}
function sameNew<T extends {id:string}>(before:readonly T[],after:readonly T[],label:string):T{
 const rows=after.filter(x=>!before.some(y=>x.id===y.id));if(rows.length!==1)throw Error('EXACT_NEW_'+label+'_REQUIRED');return rows[0]!
}
let error:string|null=null
try{
 await controller.initialize();await controller.importNew(fs.readFileSync(input,'utf8'))
 const original=current(),lesson=original.features.course!.courses.find(c=>c.id==='crs:60aafe5da1d987ede4868ffc2c3a469f')!,relay=original.features.relay!,business=relay.businesses.find(b=>b.id==='ops:3dc059a3c7736a118fb448ed2018a9c9')!
 if(!lesson||!business||original.view.runId!=='normal-course-content_employee-453bb7c2'||original.view.revision!==147)throw Error('EXACT_ORIGINAL_STAGE_A_REQUIRED')
 const source=relay.audiences.filter(a=>a.businessId===business.id&&a.completedAt!==null)
 if(source.length!==1||!source[0]!.members.length)throw Error('ACTUAL_ORIGINAL_RELAY_PROSPECT_REQUIRED')
 const beforeOffers=relay.offers
 await send('SetRelayOffer',{businessId:business.id,offerKind:'low_margin',unitPriceFen:10})
 const offer=sameNew(beforeOffers,current().features.relay!.offers,'OFFER'),beforeCustomers=current().features.relay!.customers
 await send('SignRelayCustomers',{businessId:business.id,audienceId:source[0]!.id,offerId:offer.id,personIds:[source[0]!.members[0]!],termEnd:'2024-12-31',mode:'prepaid',creditLimitFen:0})
 const customer=sameNew(beforeCustomers,current().features.relay!.customers,'CUSTOMER')
 await refresh(lesson.id,'2024-12-27')
 await advance('2025-01-04')
 const matchingVideo=current().features.course!.videoCohorts.filter(c=>c.segment===lesson.segment&&c.date<=current().view.date)
 if(!matchingVideo.length)throw Error('ACTUAL_ORIGINAL_VIDEO_AUDIENCE_REQUIRED')
 const beforeAudience=current().features.course!.audiences
 await send('CreateCourseAudience',{courseId:lesson.id,mode:'video_referral',priceFen:9900,videoCohortIds:matchingVideo.map(c=>c.id)})
 const audience=sameNew(beforeAudience,current().features.course!.audiences,'COURSE_AUDIENCE'),beforeClasses=current().features.course!.cohorts
 if(!audience.eligibleMembers.length)throw Error('NO_REAL_PURCHASE_ELIGIBILITY_NO_SEED_SUBSTITUTION')
 await send('PlanCourseCohort',{courseId:lesson.id,audienceId:audience.id,startAt:'2025-01-28',endAt:'2025-04-17',supportStartAt:'2025-04-17',seatLimit:5,supportMode:'self_small',resources:['player-production'],promise:'clear_scope'})
 const cohort=sameNew(beforeClasses,current().features.course!.cohorts,'COHORT'),people=current().features.course!.cohorts.find(c=>c.id===cohort.id)!.availablePeople.slice(0,5)
 if(!people.length)throw Error('ACTUAL_COHORT_ELIGIBILITY_REQUIRED')
 await send('EnrollCourseAudience',{cohortId:cohort.id,personIds:people})
 await send('StartCourseStage',{cohortId:cohort.id,index:0,resources:['player-production'],startAt:'2025-01-28'})
 await refresh(lesson.id,'2025-01-20')
 await advance('2025-02-04')
 const first=current().features.course!.cohorts.find(c=>c.id===cohort.id)!
 if(first.stages[0]!.deliveredAt!=='2025-02-04')throw Error('ACTUAL_FIRST_STAGE_NOT_DELIVERED')
 await send('StartCourseStage',{cohortId:cohort.id,index:1,resources:['player-production'],startAt:'2025-04-10'})
 await advance('2025-03-04')
 await send('RenewRelayCustomer',{customerId:customer.id,termEnd:'2025-04-30',mode:'prepaid',creditLimitFen:0})
 await send('RechargeRelayCustomer',{customerId:customer.id,amountFen:400000})
 const relayNow=current().features.relay!,pendingChanges=relayNow.changes.filter(c=>c.supplierId==='cedar-direct'&&!relayNow.observations.some(o=>o.changeId===c.id&&o.businessId===business.id))
 for(const change of pendingChanges)await send('AcknowledgeRelayMarket',{businessId:business.id,changeId:change.id})
 const beforePeriods=current().features.relay!.periods
 await send('StartRelayServicePeriod',{businessId:business.id,customerIds:[customer.id],supplierIds:['cedar-direct'],maxUnits:60000,maxSupplierCostFen:240000,supportMode:'guided',resources:['player-production'],startAt:'2025-03-05'})
 const period=sameNew(beforePeriods,current().features.relay!.periods,'PERIOD')
 await advance('2025-03-06')
 const p=current(),co=p.features.course!.cohorts.find(c=>c.id===cohort.id)!,service=p.features.relay!.periods.find(x=>x.id===period.id)!,paid=co.students.filter(s=>s.paidRemainingFen>0)
 if(p.view.runId!==original.view.runId||co.closedAt!==null||!paid.length||co.stages[1]!.deliveredAt!==null||service.status!=='running'||service.observedDays<1||service.from!=='2025-03-05'||service.to!=='2025-04-02')throw Error('REAL_SAME_RUN_UNFINISHED_PAID_COURSE_AND_RUNNING_SERVICE_REQUIRED')
 put('stage-b-normal.json',controller.exportSaved())
 put('stage-b-result.json',{at:new Date().toISOString(),scope:'Same original normal run with actual paid unfinished cohort and running service; original controller/store only. Model evidence, not Native or human.',input:ident(input),runId:p.view.runId,revision:p.view.revision,date:p.view.date,quarter:quarterOf(p.view.date),courseId:lesson.id,cohort:co,period:service,customer:p.features.relay!.customers.find(c=>c.id===customer.id),supply:p.features.relay!.supplyOptions.filter(o=>o.businessId===business.id&&o.supplierId==='cedar-direct'),budget:p.view.budget,accounts:p.view.accounts,originalSourceCommands:commands.length,newNative:0,compatibility:0})
}catch(e){
 error=String(e);put('stage-b-failure.json',{at:new Date().toISOString(),error,date:current().view.date,revision:current().view.revision,budget:current().view.budget,accounts:current().view.accounts,course:current().features.course!.courses.map(c=>({id:c.id,status:c.status,paused:c.paused,qualificationReasons:c.qualificationReasons,unresolvedUpdates:c.unresolvedUpdates})),newNative:0,compatibility:0});put('stage-b-last-saved.json',controller.exportSaved());process.exitCode=1
}finally{put('stage-b-commands.json',commands);put('stage-b-public-probes.json',probes);console.log(JSON.stringify({stage:'B',error,date:current().view.date,revision:current().view.revision,commands:commands.length,newNative:0,compatibility:0}));await controller.close(true);await store.close()}
