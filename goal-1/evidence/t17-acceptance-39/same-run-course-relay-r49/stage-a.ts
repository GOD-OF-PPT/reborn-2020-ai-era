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

const root='goal-1/evidence/t17-acceptance-39',out=root+'/same-run-course-relay-r49',input=root+'/same-run-course-relay-r48/stage-a-last-saved.json',codec=createCampaignCodec()
const store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'cux09-same-run-course-relay-stage-a'})
let serial=0
const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=> 'cux09-mixed-b-'+(++serial)})
const current=()=>{const view=controller.snapshot.view!;return {view,features:view.features as unknown as PlayFeatures}}
const commands:unknown[]=[],probes:unknown[]=[]
const put=(name:string,value:unknown)=>{guard(path.resolve(out));fs.writeFileSync(out+'/'+name,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})}
async function send(kind:string,payload:unknown){
 const p=current(),command=controller.prepare(kind,payload),preview=controller.preview(command)
 if(!preview.allowed){probes.push({kind,payload,date:p.view.date,budget:p.view.budget,preview});throw Error('ORIGINAL_PREVIEW:'+kind+':'+preview.reasonCodes.join(','))}
 const result=await controller.submit(command)
 commands.push({command,status:result.status,reasons:result.reasonCodes,date:current().view.date,revision:current().view.revision})
 if(result.status!=='saved')throw Error('ORIGINAL_SAVE:'+kind+':'+result.status)
 return command
}
async function optional(kind:string,payload:unknown){
 const command=controller.prepare(kind,payload),preview=controller.preview(command)
 probes.push({kind,payload,date:current().view.date,preview})
 if(preview.allowed){await send(kind,payload);return true}return false
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
async function refresh(courseId:string){
 const lesson=current().features.course!.courses.find(c=>c.id===courseId)!
 if(lesson.unresolvedUpdates.length){
  const startAt=current().view.date;await send('StartCourseRefresh',{courseId,resources:['player-production'],startAt});await advance(addDays(startAt,7))
 }
 const next=current().features.course!.courses.find(c=>c.id===courseId)!
 if(next.paused)await send('ResumeCourseEnrollment',{courseId})
}
let error:string|null=null
try{
 await controller.initialize();await controller.importNew(fs.readFileSync(input,'utf8'))
 const original=current(),lesson=original.features.course!.courses[0]!,background=codec.import(controller.exportSaved()).backgroundId
 if(lesson.qualificationReasons.some(reason=>reason==='MISSING_ENTITLEMENT:local_model_rights_and_hardware')){
  const channels=original.features.video!.channels
  if(channels.length!==1)throw Error('EXACT_ORIGINAL_VIDEO_CHANNEL_REQUIRED')
  const old=new Set(original.features.video!.applications.map(a=>a.id)),startAt=current().view.date
  await send('ApplyVideoProgram',{channelId:channels[0]!.id,program:'image_rights',resources:['player-production'],startAt});await advance(addDays(startAt,7))
  const applications=current().features.video!.applications.filter(a=>!old.has(a.id));if(applications.length!==1)throw Error('UNIQUE_REAL_VIDEO_APPLICATION_REQUIRED')
  await send('DecideVideoProgram',{applicationId:applications[0]!.id})
 }
 const qualified=current().features.course!.courses.find(c=>c.id===lesson.id)!.qualificationReasons.length===0
 if(qualified)await refresh(lesson.id)
 if(current().view.date<'2024-07-02')await advance('2024-07-02')
 await send('OpenRelayStation',{capitalFen:1500000})
 const businesses=current().features.relay!.businesses.filter(b=>b.definitionId==='relay-station');if(businesses.length!==1)throw Error('EXACT_NEW_RELAY_BUSINESS_REQUIRED')
 const business=businesses[0]!
 await send('StartRelayPreparation',{businessId:business.id,preparation:'materials',resources:['player-production'],startAt:current().view.date});await advance(addDays(current().view.date,7))
 if(background==='content_employee'){await send('StartRelayPreparation',{businessId:business.id,preparation:'basics',resources:['player-production'],startAt:current().view.date});await advance(addDays(current().view.date,7))}
 let approved=false
 for(let attempt=0;attempt<3&&!approved;attempt++){
  if(current().view.budget.available<1)await advance('2024-10-02')
  const old=new Set(current().features.relay!.applications.map(a=>a.id)),startAt=current().view.date
  await send('ApplyRelaySupply',{businessId:business.id,supplierId:'cedar-direct',resources:['player-production'],startAt});await advance(addDays(startAt,7))
  const rows=current().features.relay!.applications.filter(a=>!old.has(a.id));if(rows.length!==1)throw Error('UNIQUE_APPLICATION_REQUIRED')
  await send('ReadRelaySupplyDecision',{applicationId:rows[0]!.id})
  const letter=current().features.relay!.applications.find(a=>a.id===rows[0]!.id)!
  approved=letter.read&&letter.approved===true
  if(!approved&&attempt<2)await advance(addDays(current().view.date,31))
 }
 if(!approved)throw Error('THREE_REAL_APPLICATIONS_REJECTED_NO_SEED_SUBSTITUTION')
 if(current().view.date<'2024-10-02')await advance('2024-10-02')
 await send('ActivateBusiness',{businessId:business.id})
 await send('StartRelayMarketing',{businessId:business.id,segment:'local_merchants',mode:'paid',resources:['player-production'],startAt:current().view.date});await advance(addDays(current().view.date,7))
 const p=current(),audiences=p.features.relay!.audiences.filter(a=>a.businessId===business.id&&a.completedAt!==null)
 if(audiences.length!==1||audiences[0]!.members.length===0)throw Error('ACTUAL_SERVICE_PROSPECTS_REQUIRED')
 put('stage-a-normal.json',controller.exportSaved())
 put('stage-a-result.json',{at:new Date().toISOString(),scope:'Same original normal run resumed after actual tool-qualification rejection. Real application/readback and relay preparation; stageA only, not yet simultaneous class/service or Native.',input:ident(input),runId:p.view.runId,date:p.view.date,revision:p.view.revision,quarter:quarterOf(p.view.date),courseId:lesson.id,courseQualificationReasons:p.features.course!.courses.find(c=>c.id===lesson.id)!.qualificationReasons,oldClassId:original.features.course!.cohorts[0]!.id,relayBusinessId:business.id,actualSupplierReadApproval:true,actualProspects:audiences[0]!.members.length,budget:p.view.budget,accounts:p.view.accounts,newNative:0,compatibility:0})
}catch(e){error=String(e);put('stage-a-failure.json',{at:new Date().toISOString(),error,date:current().view.date,revision:current().view.revision,budget:current().view.budget,course:current().features.course!.courses.map(c=>({id:c.id,status:c.status,paused:c.paused,qualificationReasons:c.qualificationReasons,unresolvedUpdates:c.unresolvedUpdates})),newNative:0,compatibility:0});put('stage-a-last-saved.json',controller.exportSaved());process.exitCode=1}
finally{put('stage-a-commands.json',commands);put('stage-a-public-probes.json',probes);console.log(JSON.stringify({stage:'A',error,date:current().view.date,revision:current().view.revision,commands:commands.length,newNative:0,compatibility:0}));await controller.close(true);await store.close()}
