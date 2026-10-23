import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {VideoPanel,videoTargetLocation,videoRecordChoices,videoRecordSelection,videoPanelContext} from './VideoPanel.tsx'
import {videoSceneProgress} from './video-scene-progress.ts'
import type {VideoSceneTarget} from './video-scene-progress.ts'
import type {PlayFeatures} from './game-types.ts'
import {videoWorkTarget} from './video-work-target.ts'
import {sceneWorks} from './SceneJournal.tsx'
import {addDays} from '../core/calendar.ts'
import {quarterLimit,dayBefore} from '../core/operations-calendar.ts'
import historicalRejectedNegotiation from '../../goal-1/evidence/t17-acceptance-03/normal-negotiation-r1/technical_employee-t16-campaign-0-marketing-3-final.json?raw'

it('opens the original second video channel and work while keeping every account and saved byte',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d11-video-target'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`video-target-${++id}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'d11-video-target'})
 try{
  const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')
  await send('OpenVideoChannel',{name:'原账号甲',segment:'local_merchants'})
  await send('OpenVideoChannel',{name:'场景作品所属乙',segment:'local_merchants'})
  const channels=(controller.snapshot.view!.features as unknown as PlayFeatures).video!.channels,owner=channels[1]!
  await send('StartVideoWork',{channelId:owner.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-02'})
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,work=features.video!.works[0]!,before=controller.exportSaved(),target=videoSceneProgress(features.video,view.date)!.target!
  const p={controller,view,features,request:()=>{throw Error('LOCATING_A_VIDEO_MUST_NOT_SUBMIT')},accountId:'personal'}
  const html=renderToStaticMarkup(<VideoPanel {...p} initialTarget={target}/>)
  expect(target).toEqual({channelId:owner.id,workId:work.id})
  expect(html).toContain(`<option value="${owner.id}" selected="">`)
  expect(html).toContain('原账号甲');expect(html).toContain('场景作品所属乙')
  expect(html).toContain('href="#'+encodeURIComponent(work.id)+'"');expect(html).toContain('id="'+work.id+'"')
  const inconsistent={channelId:channels[0]!.id,workId:work.id}
  expect(videoTargetLocation(features.video,inconsistent)).toBeNull()
  const wrong=renderToStaticMarkup(<VideoPanel {...p} initialTarget={inconsistent}/>)
  expect(wrong).toContain('这份事项已不在当前视频记录');expect(wrong).not.toContain('href="#'+encodeURIComponent(work.id)+'"')
  const invalid:VideoSceneTarget[]=[inconsistent,{channelId:'missing-channel'}, {...target,workId:'missing-work'},{...target,contractId:'another-contract'},{channelId:owner.id,marketingId:'missing-marketing'},{...target,section:'leads'},{...target,section:'publications'}]
  for(const input of invalid){
   const blocked=renderToStaticMarkup(<VideoPanel {...p} initialTarget={input} onTargetChange={()=>{throw Error('RENDER_MUST_NOT_CHOOSE_A_RECORD')}}/>)
   expect(blocked).toContain('先找回原来的视频记录')
   for(const command of ['创建并启用内容账号','安排一件新作品','安排受众调研与推广','人工核对素材、权利与使用说明'])expect(blocked).not.toContain(command)
   expect(blocked).not.toContain(' selected=""')
   expect(blocked).toContain('取消这次重选')
  }
  expect(videoTargetLocation(features.video,target,'another-account')).toBeNull()
  const wrongAccount=renderToStaticMarkup(<VideoPanel {...p} accountId="another-account" initialTarget={target}/>)
  expect(wrongAccount).toContain('先找回原来的视频记录');expect(wrongAccount).not.toContain('创建并启用内容账号');expect(wrongAccount).not.toContain('安排一件新作品')
  const choices=videoRecordChoices(features.video,'personal'),choice=choices.find(c=>c.target.workId===work.id)!
  const original={target:{channelId:channels[0]!.id},draftId:null}
  const preview=videoRecordSelection(features.video,'personal',original,{type:'preview',id:choice.id})
  expect(preview.target).toBe(original.target)
  const cancelled=videoRecordSelection(features.video,'personal',preview,{type:'cancel'})
  expect(cancelled).toEqual(original);expect(cancelled.target).toBe(original.target)
  const confirmed=videoRecordSelection(features.video,'personal',preview,{type:'confirm'})
  expect(confirmed.target).toEqual(target)
  expect(renderToStaticMarkup(<VideoPanel {...p} initialTarget={confirmed.target!}/>)).toContain('id="'+work.id+'"')
  expect(videoRecordSelection(features.video,'another-account',preview,{type:'confirm'})).toBe(preview)
  const scope=videoPanelContext(view.runId,'personal',target)
  expect(videoPanelContext(view.runId,'personal',{workId:work.id,channelId:owner.id})).toBe(scope)
  expect(VideoPanel({...p,initialTarget:target}).key).toBe(scope)
  expect(VideoPanel({...p,view:{...view,revision:view.revision+1},initialTarget:target}).key).toBe(scope)
  expect(videoPanelContext('another-run','personal',target)).not.toBe(scope)
  expect(videoPanelContext(view.runId,'another-account',target)).not.toBe(scope)
  expect(videoPanelContext(view.runId,'personal',{channelId:channels[0]!.id})).not.toBe(scope)
  const generic=renderToStaticMarkup(<VideoPanel {...p}/>)
  expect(generic).not.toContain('安排一件新作品')
  for(const channel of channels)expect(generic).not.toContain(`<option value="${channel.id}" selected="">`)
  expect(videoTargetLocation(features.video,{...target,contractId:'another-contract'})).toBeNull()
  const readonly=renderToStaticMarkup(<VideoPanel {...p} view={{...view,readOnly:true}} initialTarget={target}/>)
  expect(readonly).toContain('id="'+work.id+'"');expect(readonly.match(/<button[^>]*>安排一件新作品<\/button>/)?.[0]).toContain('disabled=""')
  expect(controller.exportSaved()).toBe(before)
 }finally{await controller.close();await store.close()}
},20000)

it('maps real normal marketing and production without inventing a client revision or negotiation',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'s3-video-calendar-target'})
 let id=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`s2-s3-video-${++id}`})
 await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'s2-s3-video'})
 const p=()=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:()=>{throw Error('READING_TARGET_MUST_NOT_SUBMIT')}}}
 const send=async(kind:string,payload:unknown)=>expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')
 const advance=async(date:string)=>{for(let n=0;n<35;n++){
  const w=p().features.workbench
  if(w.pause){expect(w.pause.reason).toBe('CONTENT_DECISION_PENDING');const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;expect(choice).toMatchObject({costFen:0,actionPoints:0});await send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}
  if(p().view.date>=date)return
  await send('AdvanceTime',{date})
 }throw Error('VIDEO_TARGET_CLOCK_GUARD')}
 const finish=async(date:string,done:()=>boolean)=>{for(let n=0;n<12&&!done();n++){await advance(date);if(!done())await send('AdvanceTime',{date})}expect(done()).toBe(true)}
 const seen={marketing:false,production:false,correction:false,negotiation:false}
 try{
  await send('OpenVideoChannel',{name:'正常这一份商单',segment:'local_merchants'})
  const channel=p().features.video!.channels[0]!
  const check=(jobId:string,target:VideoSceneTarget)=>{
   const snapshot=p(),job=snapshot.view.operations!.jobs.find(j=>j.id===jobId)!,raw=controller.exportSaved()
   expect(videoWorkTarget(snapshot.features.video,jobId,job.businessId)).toEqual({accountId:channel.accountId,videoTarget:target})
   expect(sceneWorks(snapshot).find(w=>w.id===jobId)).toMatchObject({screen:'video',accountId:channel.accountId,videoTarget:target})
   expect(videoWorkTarget(snapshot.features.video,jobId,'another-business')).toBeNull()
   const html=renderToStaticMarkup(<VideoPanel {...snapshot} initialTarget={target} onTargetChange={()=>{throw Error('READING_MUST_NOT_CHOOSE')}}/>)
   const location=videoTargetLocation(snapshot.features.video,target,channel.accountId)!
   expect(html).toContain('id="'+location.focusId+'"');expect(html).toContain('href="#'+encodeURIComponent(location.focusId)+'"')
   expect(controller.exportSaved()).toBe(raw)
  }
  await send('StartVideoMarketing',{channelId:channel.id,resources:['player-production'],startAt:p().view.date})
  const marketing=p().features.video!.marketing[0]!,marketingTarget={channelId:channel.id,marketingId:marketing.id}
  check(marketing.job!.id,marketingTarget);seen.marketing=true
  expect(videoTargetLocation(p().features.video,{...marketingTarget,workId:'conflicting-work'})).toBeNull()
  await finish(marketing.job!.completeAt,()=>p().features.video!.marketing[0]!.completedAt!==null)
  const lead=p().features.video!.channels[0]!.leads[0]!
  expect(lead).toBeTruthy()
  await send('AcceptVideoCommission',{channelId:channel.id,cohortId:lead.cohortId,clientId:lead.personId,modeId:'manual',materialId:'original',resources:['player-production'],startAt:p().view.date})
  const original=p().features.video!.contracts[0]!,target={channelId:channel.id,workId:original.workId,contractId:original.id}
  check(p().features.video!.works[0]!.production!.id,target);seen.production=true
  await send('OpenVideoChannel',{name:'只看另一账号',segment:'lifestyle'});await send('WorkQuarter',{})
  const other=p().features.video!.channels[1]!
  expect(videoTargetLocation(p().features.video,{...target,channelId:other.id})).toBeNull()
  const rejected=renderToStaticMarkup(<VideoPanel {...p()} initialTarget={{channelId:other.id,marketingId:marketing.id}}/>)
  expect(rejected).toContain('先找回原来的视频记录');expect(rejected).not.toContain('安排一件新作品')
  for(let guard=0;guard<28;guard++){
   const v=p().features.video!,c=v.contracts.find(c=>c.id===original.id)!,work=v.works.find(w=>w.id===original.workId)!
   if(c.status==='settled'||c.status==='cancelled')break
   if(c.status==='delivered'){await finish(c.paymentAt!,()=>p().features.video!.contracts.find(x=>x.id===c.id)!.status==='settled');continue}
   if(c.status==='review'){await finish(addDays(c.submittedAt!,2),()=>p().features.video!.contracts.find(x=>x.id===c.id)!.status!=='review');continue}
   if(c.status==='negotiating'){const job=p().view.operations!.jobs.find(j=>j.id===c.negotiationJobId)!;check(job.id,target);seen.negotiation=true;await finish(job.completeAt,()=>p().features.video!.contracts.find(c=>c.id===original.id)!.status!=='negotiating');continue}
   const active=[work.production,...work.corrections].find(j=>j&&['planned','running'].includes(j.status))
   if(active){check(active.id,target);if(work.corrections.some(j=>j?.id===active.id))seen.correction=true;await finish(active.completeAt,()=>p().view.operations!.jobs.find(j=>j.id===active.id)!.status==='completed');continue}
   if(c.status==='revision'||work.defectKnown&&work.corrections.length===0){
    if(p().view.budget.available===0){const next=quarterLimit(p().view.date);await advance(dayBefore(next));await advance(next)}
    if(c.status==='revision'&&c.revisions>=c.includedRevisions&&!c.negotiated)await send('NegotiateVideoCommission',{contractId:c.id,proposal:'price',resources:['player-production'],startAt:p().view.date})
    else await send('ReworkVideo',{workId:work.id,resources:['player-production'],startAt:p().view.date})
    continue
   }
   if(work.reviewedVersion!==work.version)await send('ReviewVideoOutput',{workId:work.id,disclosure:'manual'})
   await send('SubmitVideoCommission',{contractId:c.id})
  }
  expect(seen).toEqual({marketing:true,production:true,correction:false,negotiation:false})
  expect(p().features.video!.contracts.find(c=>c.id===original.id)).toMatchObject({status:'settled',revisions:0,negotiationJobId:null})
  const raw=controller.exportSaved();expect(videoWorkTarget(p().features.video,'missing-job',channel.businessId)).toBeNull();expect(controller.exportSaved()).toBe(raw)
 }finally{await controller.close();await store.close()}
},30000)

it('keeps completed correction and rejected-negotiation records of an original normal history on their own object',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'s3-original-video-records'})
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=> 's3-original-record-import'})
 await controller.initialize();await controller.importNew(historicalRejectedNegotiation)
 try{
  // This published normal whole history was Create-audited before S3; completed jobs are not relabelled active.
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,v=features.video!,c=v.contracts.find(c=>c.id==='vid:3619f14d31eebb074244f5444d2f6dfd')!,work=v.works.find(w=>w.id===c.workId)!,channel=v.channels.find(ch=>ch.id===c.channelId)!
  const target={channelId:channel.id,workId:work.id,contractId:c.id},raw=controller.exportSaved()
  expect(view.origin).toBe('normal');expect(c).toMatchObject({status:'cancelled',negotiationOutcome:'rejected'})
  const jobs=[...work.corrections,view.operations!.jobs.find(j=>j.id===c.negotiationJobId)]
  expect(work.corrections.length).toBeGreaterThan(0);expect(c.negotiationJobId).not.toBeNull()
  for(const job of jobs){
   expect(job).toBeTruthy();expect(job!.status).toBe('completed')
   expect(videoWorkTarget(v,job!.id,job!.businessId)).toEqual({accountId:channel.accountId,videoTarget:target})
   expect(videoWorkTarget(v,job!.id,'another-business')).toBeNull()
   expect(sceneWorks({view,features}).some(w=>w.id===job!.id)).toBe(false)
  }
  expect(videoTargetLocation(v,target,channel.accountId)).toEqual({channelId:channel.id,focusId:work.id})
  const html=renderToStaticMarkup(<VideoPanel controller={controller} view={view} features={features} accountId={channel.accountId} request={()=>{throw Error('READING_COMPLETED_WORK_MUST_NOT_SUBMIT')}} initialTarget={target}/>)
  expect(html).toContain('id="'+work.id+'"');expect(html).toContain('href="#'+encodeURIComponent(work.id)+'"')
  expect(controller.exportSaved()).toBe(raw);expect(raw).toBe(historicalRejectedNegotiation)
 }finally{await controller.close();await store.close()}
},30000)
