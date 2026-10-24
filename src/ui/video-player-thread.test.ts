import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {VideoPublicationTerms} from './VideoPublicationTerms.tsx'
import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec,campaignMarket} from '../application/campaign.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {createVideoFixture,VIDEO_FIXTURE_PARAMETERS} from '../testing/video-fixture.ts'
import {projectRun} from '../core/commands.ts'
import {projectVideo} from '../core/video-projection.ts'
import {addDays} from '../core/calendar.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {openingFocusFor,playerThread} from './player-thread.ts'
import {videoFocusFromSaved,videoFocusOpen,videoFocusResultDate,videoPlayerScene,type VideoOpeningFocus} from './video-player-thread.ts'
import {videoSceneProgress} from './video-scene-progress.ts'
import {videoSceneResult} from './video-scene-result.ts'
import type {GameRun} from '../core/run-types.ts'

const input=(view:PlayingView)=>({view,features:view.features as unknown as PlayFeatures})
const fixtureInput=(f:ReturnType<typeof createVideoFixture>,run:GameRun)=>{
 const features={video:projectVideo(run,f.video),workbench:projectWorkbench(run,f.runtime,f.operations.catalog,campaignMarket.catalog)},view={...projectRun(run),features,saveStatus:'saved' as const,busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 return {view,features}
}

it('keeps a normal original work through its actual next-quarter publication feedback without rewriting its saved source',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u3-video-normal-publication'})
 let count=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`u3-video-normal-${++count}`})
 try{
  await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'u3-video-normal-publication'})
  const p=()=>input(controller.snapshot.view!)
  const send=async(kind:string,payload:unknown)=>{const previous=p(),result=await controller.submit(controller.prepare(kind,payload));expect(result.status,JSON.stringify({kind,payload,result})).toBe('saved');return {previous,current:p()}}
  const advance=async(date:string)=>{for(let n=0;n<40;n++){
   const current=p(),w=current.features.workbench
   if(w.pause){expect(w.pause.reason).toBe('CONTENT_DECISION_PENDING');const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;expect(choice).toMatchObject({costFen:0,actionPoints:0});await send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}
   if(current.view.date>=date&&!current.view.operations!.jobs.some(j=>['planned','running'].includes(j.status)&&j.completeAt<=date))return
   const boundary=w.progression.quarterTarget;await send('AdvanceTime',{date:boundary&&boundary>current.view.date&&boundary<date?boundary:date})
  }throw Error('U3_VIDEO_PUBLIC_CLOCK_LIMIT')}
  await send('OpenVideoChannel',{name:'一份继续的手工观察',segment:'ai_learners'})
  const channel=p().features.video!.channels[0]!
  const made=await send('StartVideoWork',{channelId:channel.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-03-18'})
  const work=made.current.features.video!.works[0]!,focus=openingFocusFor(made.current,'video',{accountId:channel.accountId,videoTarget:{channelId:channel.id,workId:work.id}})!
  expect(focus.kind).toBe('video');if(focus.kind!=='video')throw Error('VIDEO_FOCUS_REQUIRED')
  await advance('2020-03-25');await send('ReviewVideoOutput',{workId:work.id,disclosure:'manual'})
  const published=await send('PublishVideo',{workId:work.id,monetization:'none',label:false})
  expect(videoFocusOpen(published.current,focus)).toBe(true)
  expect(playerThread(published.current,focus)).toMatchObject({stage:'video-published',outcome:'pending',wait:{date:'2020-04-01'}})
  await advance('2020-04-01')
  const current=p(),raw=controller.exportSaved(),publication=current.features.video!.publications.find(pub=>pub.workId===work.id)!
  expect(current.view.origin).toBe('normal');expect(publication.measuredAt).toBe('2020-04-01')
  expect(videoFocusOpen(current,focus)).toBe(false);expect(videoFocusResultDate(current,focus)).toBe(publication.measuredAt)
  expect(playerThread(current,focus)).toMatchObject({focusScope:'current',focusQuarter:'2020-Q1',outcome:'actual',inspect:{target:{accountId:channel.accountId,videoTarget:focus.videoTarget}}})
  expect(playerThread(current,focus).resultRefs).toContainEqual({kind:'publication',id:publication.id,date:publication.measuredAt})
  expect(controller.exportSaved()).toBe(raw)
 }finally{await controller.close();await store.close()}
},20000)

/** The independent F02 fixture exercises real platform commands, not normal-game qualification proof. */
function platform(kind:'ads'|'affiliate',unlistAtPublish=false){
 const f=createVideoFixture();let run=f.run
 let beforeMeasurement:PlayingView|null=null,beforePublication:PlayingView|null=null
 const send=(command:string,payload:unknown)=>{run=f.apply(run,command,payload)}
 const p=()=>fixtureInput(f,run)
 send('OpenVideoChannel',{name:'平台回款原记录',segment:'local_merchants'})
 const channel=run.video!.channels[0]!
 const publish=(monetization:'none'|'ads'|'affiliate',unlist=false)=>{
  send('StartVideoWork',{channelId:channel.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:run.timeline.cursor.date})
  const work=run.video!.works.at(-1)!
  send('AdvanceTime',{date:addDays(run.timeline.cursor.date,7)});send('ReviewVideoOutput',{workId:work.id,disclosure:'manual'});beforePublication=p().view;send('PublishVideo',{workId:work.id,monetization,label:false})
  if(unlist)send('UnlistVideo',{publicationId:run.video!.publications.find(row=>row.workId===work.id)!.id})
  beforeMeasurement=p().view
  send('AdvanceTime',{date:addDays(run.timeline.cursor.date,7)})
  return work
 }
 publish('none');publish('none')
 send('ApplyVideoProgram',{channelId:channel.id,program:kind,resources:['player-production'],startAt:run.timeline.cursor.date});send('AdvanceTime',{date:addDays(run.timeline.cursor.date,7)});send('DecideVideoProgram',{applicationId:run.video!.applications.at(-1)!.id})
 const work=publish(kind,unlistAtPublish),focus:VideoOpeningFocus={runId:run.runId,kind:'video',accountId:'personal',businessId:channel.businessId,entityId:work.id,videoTarget:{channelId:channel.id,workId:work.id,section:'publications'}}
 return {f,p,send,focus,work,get beforeMeasurement(){return beforeMeasurement},get beforePublication(){return beforePublication},get run(){return run}}
}

it.each(['ads','affiliate'] as const)('keeps the original %s publication pending until its own real collection and maps the saved settlement back to that same work',kind=>{
 const h=platform(kind),target=h.focus.videoTarget!,publicBefore=JSON.stringify(h.p().features.video),rawBefore=h.f.codec.export(h.run)
 if(kind==='affiliate'){
  const pub=h.p().features.video!.publications.find(p=>p.workId===h.work.id)!
  expect(h.p().features.video!.settlements).toHaveLength(0)
  expect(videoSceneProgress(h.p().features.video,h.p().view.date,target)).toMatchObject({stage:'video-affiliate-window',outcome:'pending',wait:{date:addDays(pub.measuredAt!,7)},target})
  expect(videoFocusOpen(h.p(),h.focus)).toBe(true)
  expect(h.f.codec.export(h.run)).toBe(rawBefore);expect(JSON.stringify(h.p().features.video)).toBe(publicBefore)
  h.send('AdvanceTime',{date:addDays(pub.measuredAt!,7)})
 }
 const settlement=h.p().features.video!.settlements.find(s=>s.publicationId===h.p().features.video!.publications.find(p=>p.workId===h.work.id)!.id)!
 expect(settlement.amountFen).toBeGreaterThan(0);expect(settlement.collectedAt).toBeNull()
 const pending=h.p(),rawPending=h.f.codec.export(h.run)
 expect(videoSceneProgress(pending.features.video,pending.view.date,target)).toMatchObject({stage:'video-platform-payment-wait',outcome:'pending',wait:{date:settlement.dueAt},target})
 expect(videoFocusOpen(pending,h.focus)).toBe(true)
 expect(videoPlayerScene(pending,h.focus).resultRefs).toContainEqual({kind:'settlement',id:settlement.id,date:settlement.confirmedAt})
 expect(h.f.codec.export(h.run)).toBe(rawPending)
 // Original phase input stops before certain_receipts: collection remains an explicit real command.
 h.send('AdvanceTime',{date:settlement.dueAt,phase:'world_update'})
 const previous=h.p(),progress=videoSceneProgress(previous.features.video,previous.view.date,target)!
 expect(progress).toMatchObject({stage:'video-platform-collect',outcome:'pending',command:{kind:'CollectVideoSettlement',payload:{settlementId:settlement.id},confirm:true}})
 expect(progress.wait).toBeUndefined()
 h.send(progress.command!.kind,progress.command!.payload)
 const current=h.p(),next=videoFocusFromSaved(previous,current,'CollectVideoSettlement',{settlementId:settlement.id})!
 expect(next).toMatchObject({kind:'video',accountId:h.focus.accountId,businessId:h.focus.businessId,entityId:h.work.id,videoTarget:{channelId:target.channelId,workId:h.work.id,section:'publications'}})
 expect(videoSceneProgress(current.features.video,current.view.date,target)).toMatchObject({stage:'video-platform-paid',outcome:'actual',target})
 expect(videoFocusOpen(current,h.focus)).toBe(false);expect(videoFocusResultDate(current,h.focus)).toBe(settlement.dueAt)
 expect(videoPlayerScene(current,h.focus).resultRefs).toContainEqual({kind:'settlement',id:settlement.id,date:settlement.dueAt})
 const raw=h.f.codec.export(h.run)
 expect(videoFocusFromSaved(previous,current,'CollectVideoSettlement',{settlementId:'unrelated-settlement'})).toBeNull()
 for(const changed of [
  {...current,view:{...current.view,runId:'different-life'}},
  {...current,view:{...current.view,revision:previous.view.revision}},
  {...current,view:{...current.view,hasCandidate:true,saveStatus:'unsaved' as const}},
  {...current,view:{...current.view,readOnly:true,saveStatus:'read_only' as const}},
  {...current,view:{...current.view,accounts:current.view.accounts.filter(a=>a.accountId!==h.focus.accountId)}},
 ])expect(videoFocusFromSaved(previous,changed,'CollectVideoSettlement',{settlementId:settlement.id})).toBeNull()
 expect(h.f.codec.export(h.run)).toBe(raw)
},20000)

it('keeps the original commission collection distinct from platform IDs and retains a public unpaid-fee responsibility',()=>{
 const f=createVideoFixture({parameters:{...VIDEO_FIXTURE_PARAMETERS,revisionCount:0}});let run=f.run
 const send=(kind:string,payload:unknown)=>{run=f.apply(run,kind,payload)}
 send('OpenVideoChannel',{name:'原商单收款',segment:'local_merchants'})
 const channel=run.video!.channels[0]!
 send('StartVideoMarketing',{channelId:channel.id,resources:['player-production'],startAt:run.timeline.cursor.date});send('AdvanceTime',{date:'2020-01-08'})
 const cohort=run.video!.cohorts[0]!
 send('AcceptVideoCommission',{channelId:channel.id,cohortId:cohort.id,clientId:cohort.qualifiedMembers[0],modeId:'manual',materialId:'original',resources:['player-production'],startAt:run.timeline.cursor.date})
 const contract=run.video!.contracts[0]!,work=run.video!.works[0]!
 send('AdvanceTime',{date:'2020-01-22'});send('ReviewVideoOutput',{workId:work.id,disclosure:'manual'});send('SubmitVideoCommission',{contractId:contract.id});send('AdvanceTime',{date:'2020-01-24'})
 const paymentAt=run.video!.contracts[0]!.paymentAt!
 send('AdvanceTime',{date:paymentAt,phase:'world_update'})
 const previous=fixtureInput(f,run)
 send('CollectVideoSettlement',{settlementId:contract.id})
 const current=fixtureInput(f,run),focus=videoFocusFromSaved(previous,current,'CollectVideoSettlement',{settlementId:contract.id})!
 expect(focus.videoTarget).toEqual({channelId:channel.id,workId:work.id,contractId:contract.id})
 expect(videoPlayerScene(current,focus)).toMatchObject({stage:'video-settled',outcome:'actual'})
 expect(videoFocusOpen(current,focus)).toBe(false);expect(videoFocusResultDate(current,focus)).toBe(paymentAt)
 const raw=f.codec.export(run)
 // Public display boundary only: paidCase=false means this original fee remains unresolved.
 const unpaid={...current,features:{...current.features,video:{...current.features.video!,contracts:current.features.video!.contracts.map(c=>c.id===contract.id?{...c,paidCase:false}:c)}}}
 expect(videoFocusOpen(unpaid,focus)).toBe(true)
 expect(videoPlayerScene(unpaid,focus).detail).toContain('未付费用')
 expect(videoFocusFromSaved(previous,current,'CollectVideoSettlement',{settlementId:work.id})).toBeNull()
 expect(f.codec.export(run)).toBe(raw)
},20000)


it('does not invent an affiliate observation after an actually qualified F02 publication is unlisted the same day',()=>{
 // Explicit independent F02 qualification; this is not a normal earned-program proof.
 const h=platform('affiliate',true),previous=h.beforeMeasurement,current=h.p(),video=current.features.video!,target=h.focus.videoTarget!
 if(!previous)throw Error('ACTUAL_PRE_MEASUREMENT_VIEW_REQUIRED')
 const publication=video.publications.find(row=>row.workId===h.work.id)!
 expect(publication).toMatchObject({qualified:true,views:0,cohortId:null,unlistedAt:publication.publishedAt,measuredAt:current.view.date})
 expect(video.settlements.filter(row=>row.publicationId===publication.id)).toHaveLength(0)
 const raw=h.f.codec.export(h.run),publicBefore=JSON.stringify(video),focused=videoSceneProgress(video,current.view.date,target)!,legacy=videoSceneProgress(video,current.view.date)
 if(!h.beforePublication)throw Error('ACTUAL_PRE_PUBLICATION_VIEW_REQUIRED')
 const beforeVideo=(h.beforePublication.features as unknown as PlayFeatures).video!,terms=(source:typeof beforeVideo)=>renderToStaticMarkup(createElement(VideoPublicationTerms,{video:source,date:h.beforePublication!.date,workId:h.work.id,monetization:'affiliate'}))
 expect(terms(beforeVideo)).toContain('当前带货资格覆盖');expect(terms(beforeVideo)).toContain(publication.measureAt)
 const readApplication=beforeVideo.applications.find(row=>row.channelId===target.channelId&&row.program==='affiliate'&&row.resultRead)!
 expect(readApplication).toBeDefined()
 // Bounded public display variants compare unread replies, not imported financial states.
 const unread=(approved:boolean)=>({...beforeVideo,applications:beforeVideo.applications.map(row=>row.id===readApplication.id?{...row,resultRead:false,approved,expiresAt:approved?row.expiresAt:null}:row),channels:beforeVideo.channels.map(row=>row.id===target.channelId?{...row,eligiblePrograms:approved?row.eligiblePrograms:row.eligiblePrograms.filter(program=>program.program!=='affiliate')}:row)})
 expect(terms(unread(true))).toBe(terms(unread(false)));expect(terms(unread(true))).toContain('申请回信尚未查看')
 expect(terms(unread(true))).not.toContain('当前带货资格覆盖')

 // Soft assertions preserve every independent symptom in the expected pre-fix red.
 expect.soft(focused).toMatchObject({stage:'video-published',outcome:'actual',target})
 expect.soft(focused.wait).toBeUndefined()
 expect.soft(legacy?.title??'').not.toContain('等订单')
 expect.soft(legacy?.choice.line??'').not.toContain('观察窗口')
 expect.soft(videoFocusOpen(current,h.focus)).toBe(false)
 const feedback=videoSceneResult('AdvanceTime',previous,current.view)
 expect.soft(feedback).not.toBeNull()
 expect.soft(feedback).toContain('播放0')
 expect.soft(feedback).not.toContain('原订单观察仍需等到')
 expect.soft(feedback).not.toContain('原订单观察止于')
 expect(JSON.stringify(video)).toBe(publicBefore);expect(h.f.codec.export(h.run)).toBe(raw)
})
