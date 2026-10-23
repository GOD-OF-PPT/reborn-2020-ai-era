import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import App from './App.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {seasonFocusPreferenceKey,type SeasonFocusPreferenceStorage} from './season-focus-preference.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'

// Read the actual committed controller projection during this bounded render.
// Server rendering does not run effects, browser input or browser persistence.
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 return {...actual,useSyncExternalStore:<T,>(_subscribe:unknown,getSnapshot:()=>T)=>getSnapshot()}
})

it('keeps the selected second-channel marketing on the room and route, and gates a mismatched owner without a substituted action',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'s3-app-video-identity'})
 let id=0,writes=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`s3-app-video-${++id}`})
 try{
  await controller.initialize();await controller.newLife({backgroundId:'content_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'s3-app-video-identity'})
  const send=async(kind:string,payload:unknown)=>{expect((await controller.submit(controller.prepare(kind,payload))).status).toBe('saved')}
  await send('OpenVideoChannel',{name:'第一账号',segment:'lifestyle'})
  await send('OpenVideoChannel',{name:'这次明确选择的第二账号',segment:'local_merchants'})
  let view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures
  const channel=features.video!.channels[1]!
  await send('StartVideoMarketing',{channelId:channel.id,resources:['player-production'],startAt:view.date})
  view=controller.snapshot.view!;features=view.features as unknown as PlayFeatures
  const marketing=features.video!.marketing.find(m=>m.channelId===channel.id)!,target={channelId:channel.id,marketingId:marketing.id}
  const raw=JSON.stringify({version:1,runId:view.runId,quarter:features.workbench.quarter,focus:{runId:view.runId,kind:'video',accountId:channel.accountId,businessId:channel.businessId,entityId:marketing.id,videoTarget:target}})
  const storage:SeasonFocusPreferenceStorage={getItem:key=>key===seasonFocusPreferenceKey(view.runId)?raw:null,setItem:()=>{writes++}}
  const before=controller.exportSaved(),room=renderToStaticMarkup(<App controller={controller} focusPreferenceStorage={storage}/>)
  expect(room).toContain('这份推广已经安排');expect(room).toContain('这次明确选择的第二账号')
  expect(room).toContain('video-making-kit-v1.png');expect(room).not.toContain('接下这笔手工单')
  const request=()=>{throw Error('RENDER_MUST_NOT_REQUEST')},p:GamePanelProps={controller,view,features,accountId:channel.accountId,request}
  const route=(accountId:string)=>renderToStaticMarkup(<NarrativeScene {...p} accountId={accountId} screen="video" videoTarget={target} headingRef={null} personId="tang-ying" onPerson={request} onOpen={request} onPeople={request} onYear={request} onNavigate={request} receipt={null}/>)
  const valid=route(channel.accountId)
  expect(valid).toContain('这份推广已经安排');expect(valid).toContain('等这份推广的实际询价反馈')
  expect(valid).not.toContain('查看报价，决定是否接单')
  const wrong=route('unrelated-account')
  expect(wrong).toContain('重新选择');expect(wrong).not.toContain('等这份推广的实际询价反馈')
  expect(wrong).not.toContain('查看报价，决定是否接单')
  expect(writes).toBe(0);expect(controller.exportSaved()).toBe(before)
 }finally{await controller.close();await store.close()}
},20000)
