import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {VideoSceneChoice,VideoSceneRecord,videoDraftCommand,videoSceneSubmissionLock,videoSceneBookmarkLock,videoSceneContextReason,type VideoSceneDraft} from './VideoSceneChoice.tsx'
import {OpeningObject} from './OpeningObject.tsx'

const noWrite=()=>{throw Error('VIDEO_DISPLAY_MUST_NOT_WRITE')}

it('requires explicit current client, rights, resource and date, and keeps a real second-channel order through completion and exit',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'s3-video-paper-normal'})
 let id=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`s3-video-paper-${++id}`})
 const p=():GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:noWrite}}
 const send=async(kind:string,payload:unknown)=>{const preview=controller.preview(controller.prepare(kind,payload));expect(preview.allowed,JSON.stringify({kind,date:p().view.date,reasons:preview.reasonCodes})).toBe(true);expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')}
 const advance=async(date:string)=>{for(let i=0;i<20;i++){
  const w=p().features.workbench
  if(w.pause){const event=w.events.find(e=>e.isBlocking),choice=event?.choices.find(c=>c.isDefault);expect(choice).toMatchObject({costFen:0,actionPoints:0});await send('ChooseEvent',{instanceId:event!.id,choiceId:choice!.id});continue}
  if(p().view.date>=date&&!p().view.operations?.jobs.some(j=>['planned','running'].includes(j.status)&&j.completeAt<=date))return
  await send('AdvanceTime',{date})
 }throw Error('VIDEO_PAPER_ORIGINAL_CLOCK_LIMIT')}
 try{
  await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'s3-video-paper-normal'})
  await send('OpenVideoChannel',{name:'另一个公开账号',segment:'lifestyle'})
  await send('OpenVideoChannel',{name:'这份作品的原账号',segment:'local_merchants'})
  const channel=p().features.video!.channels[1]!
  await send('StartVideoMarketing',{channelId:channel.id,resources:['player-production'],startAt:p().view.date});await advance('2020-01-08')
  const lead=p().features.video!.channels.find(c=>c.id===channel.id)!.leads[0]!
  const draft:VideoSceneDraft={channelId:channel.id,clientId:lead.personId,cohortId:lead.cohortId,modeId:'manual',materialId:'original',resource:'player-production',startAt:p().view.date,productId:'',name:'',segment:'',monetization:'',label:false}
  const target={channelId:channel.id,section:'leads' as const},before=controller.exportSaved(),draftBefore=JSON.stringify(draft)
  expect(videoDraftCommand(p(),draft,'channel')).toBeNull()
  expect(videoDraftCommand(p(),{...draft,name:'我明确起的名字',segment:'ai_learners'},'channel')).toMatchObject({kind:'OpenVideoChannel',payload:{name:'我明确起的名字',segment:'ai_learners'}})
  const command=videoDraftCommand(p(),draft,'commission',target)!
  expect(command).toMatchObject({kind:'AcceptVideoCommission',confirm:true,payload:{channelId:channel.id,clientId:lead.personId,cohortId:lead.cohortId,modeId:'manual',materialId:'original',resources:['player-production'],startAt:p().view.date}})
  expect(controller.preview(controller.prepare(command.kind,command.payload)).allowed).toBe(true)
  for(const patch of [{clientId:''},{cohortId:'other-cohort'},{modeId:''},{materialId:''},{resource:''},{resource:'dismissed-worker'},{startAt:''},{startAt:'2020-02-30'}])expect(videoDraftCommand(p(),{...draft,...patch},'commission',target)).toBeNull()
  expect(videoDraftCommand(p(),draft,'commission',{channelId:p().features.video!.channels[0]!.id})).toBeNull()
  expect(videoDraftCommand(p(),draft,'commission',{channelId:channel.id,marketingId:'missing'})).toBeNull()
  // Wrong UI account context only; the normal public game and real channel are untouched.
  const wrongContext={...p(),accountId:'another-inspection-account'}
  expect(videoSceneContextReason(wrongContext,target)).toContain('当前查看账户不匹配')
  expect(videoDraftCommand(wrongContext,draft,'commission',target)).toBeNull()
  expect(videoSceneContextReason(wrongContext)).toBeNull()
  expect(videoSceneContextReason(p(),target)).toBeNull()
  expect(videoSceneSubmissionLock(p(),'原关注尚未读出')).toBe('原关注尚未读出')
  expect(videoSceneSubmissionLock({...p(),view:{...p().view,revision:p().view.revision-1}})).toContain('原记录已经更新')
  expect(videoSceneSubmissionLock({...p(),view:{...p().view,readOnly:true}})).toContain('仅可翻阅')
  expect(videoSceneBookmarkLock({...p(),view:{...p().view,readOnly:true}})).toBeNull()
  expect(videoSceneBookmarkLock({...p(),view:{...p().view,hasCandidate:true,saveStatus:'unsaved'}})).toContain('原候选')
  expect(videoSceneSubmissionLock({...p(),view:{...p().view,hasCandidate:true,saveStatus:'unsaved'}})).toContain('原候选')
  expect(videoSceneSubmissionLock(p())).toBeNull();expect(JSON.stringify(draft)).toBe(draftBefore);expect(controller.exportSaved()).toBe(before)
  expect(renderToStaticMarkup(<VideoSceneChoice p={p()} target={target} blockedReason="原关注尚未读出">{()=> <button type="button">只翻这份视频纸页</button>}</VideoSceneChoice>)).toContain('只翻这份视频纸页')
  expect(controller.exportSaved()).toBe(before)
  await send(command.kind,command.payload)
  const work=p().features.video!.works[0]!,contract=p().features.video!.contracts[0]!,workTarget={channelId:channel.id,workId:work.id}
  expect(contract.channelId).toBe(channel.id);expect(contract.prepaymentFen).toBe(90000)
  await advance(work.production!.completeAt)
  expect(p().features.video!.works[0]!.production!.status).toBe('completed')
  const completeBefore=controller.exportSaved(),complete=renderToStaticMarkup(<VideoSceneRecord p={p()} target={workTarget}/>)
  expect(complete).toContain('这份作品的原账号');expect(complete).toContain('当前版本仍须人工核对');expect(complete).toContain('客户标识'+contract.clientId.slice(-6));expect(complete).toContain('¥900')
  expect(complete).not.toContain('已形成已付案例');expect(controller.exportSaved()).toBe(completeBefore)
  await send('ReviewVideoOutput',{workId:work.id,disclosure:'manual'})
  expect(renderToStaticMarkup(<VideoSceneRecord p={p()} target={workTarget}/>)).toContain('当前版本已人工核对')
  await send('ExitVideoCommission',{contractId:contract.id})
  const exitedBefore=controller.exportSaved(),exited=renderToStaticMarkup(<VideoSceneRecord p={p()} target={workTarget}/>)
  expect(exited).toContain('本单已经退出');expect(exited).toContain('原退款与口碑后果');expect(exited).not.toContain('已形成已付案例');expect(controller.exportSaved()).toBe(exitedBefore)
 }finally{await controller.close();await store.close()}
},30000)

it('uses the real video cutout without changing native button state or hiding text in text-only mode',()=>{
 const props={kind:'waiting' as const,appearance:'video' as const,title:'原账号的第2版作品',detail:'等待原客户复核 · 2023-09-04',stageLabel:'已提交，未验收',actionLabel:'翻看这份原作品',disabled:false,onActivate:noWrite}
 const image=renderToStaticMarkup(<OpeningObject {...props}/>),text=renderToStaticMarkup(<OpeningObject {...props} textOnly/>)
 expect(image).toContain('video-making-kit-v1.png');expect(image).toContain('width="1254"');expect(image).toContain('data-kind="waiting"');expect(image).toContain('data-appearance="video"')
 expect(text).not.toContain('<img');for(const line of [props.title,props.detail,props.stageLabel,props.actionLabel])expect(text).toContain(line)
 expect(text).toContain('<button type="button"');expect(text).toContain('aria-describedby=');expect(text).not.toContain('已收款')
 expect(renderToStaticMarkup(<OpeningObject {...props} disabled/>)).toContain('disabled=""')
 expect(renderToStaticMarkup(<OpeningObject kind={props.kind} title={props.title} detail={props.detail} stageLabel={props.stageLabel} actionLabel={props.actionLabel} disabled={false} onActivate={noWrite}/>)).toContain('first-attempt-v1.png')
})
