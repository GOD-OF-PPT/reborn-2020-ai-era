import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {VideoPanel,videoTargetLocation} from './VideoPanel.tsx'
import {videoSceneProgress} from './video-scene-progress.ts'
import type {PlayFeatures} from './game-types.ts'

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
  expect(videoTargetLocation(features.video,{...target,contractId:'another-contract'})).toBeNull()
  const readonly=renderToStaticMarkup(<VideoPanel {...p} view={{...view,readOnly:true}} initialTarget={target}/>)
  expect(readonly).toContain('id="'+work.id+'"');expect(readonly.match(/<button[^>]*>安排一件新作品<\/button>/)?.[0]).toContain('disabled=""')
  expect(controller.exportSaved()).toBe(before)
 }finally{await controller.close();await store.close()}
},20000)
