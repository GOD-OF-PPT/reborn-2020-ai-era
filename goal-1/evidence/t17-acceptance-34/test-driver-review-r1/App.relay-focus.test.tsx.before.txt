import normalReady from '../../goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0091.json?raw'
import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import {openingFocusFor} from './player-thread.ts'
import {seasonFocusPreferenceKey,type SeasonFocusPreferenceStorage} from './season-focus-preference.ts'
import App from './App.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'

// An existing fully replayable normal prefix exercises the real controller projection.
// SSR does not prove browser input, effects, storage failure recovery or understanding.
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 return {...actual,useSyncExternalStore:<T,>(_subscribe:unknown,getSnapshot:()=>T)=>getSnapshot()}
})

it('reads an older-quarter relay bookmark into the actual room and gates a mismatched route owner without changing the save',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'s4-r1-app-relay-identity'})
 let id=0,writes=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`s4-r1-app-relay-${++id}`})
 try{
  const input=normalReady
  await controller.initialize();await controller.importNew(input)
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,business=features.relay!.businesses[0]!,station=features.relay!.stations[0]!
  const target:RelaySceneTarget={kind:'business',runId:view.runId,accountId:business.accountId,businessId:business.id,stationId:station.id}
  const request=()=>{throw Error('PUBLIC_RENDER_MUST_NOT_REQUEST')},p:GamePanelProps={controller,view,features,accountId:business.accountId,request}
  const focus=openingFocusFor(p,'relay',{accountId:business.accountId,relayTarget:target});expect(focus?.kind).toBe('relay')
  const raw=JSON.stringify({version:1,runId:view.runId,quarter:'2024-Q4',focus})
  const storage:SeasonFocusPreferenceStorage={getItem:key=>key===seasonFocusPreferenceKey(view.runId)?raw:null,setItem:()=>{writes++}}
  const before=controller.exportSaved(),room=renderToStaticMarkup(<App controller={controller} focusPreferenceStorage={storage}/>)
  expect(before).toBe(input);expect(room).toContain('2024-Q4');expect(room).toContain('原书签未变')
  expect(room).toContain('relay-service-kit-v1.png');expect(room).not.toContain('接下这笔手工单')
  const route=(accountId:string)=>renderToStaticMarkup(<NarrativeScene {...p} accountId={accountId} relayTarget={target} screen="relay" headingRef={null} personId="tang-ying" onPerson={request} onOpen={request} onPeople={request} onYear={request} onNavigate={request} receipt={null}/>)
  const valid=route(business.accountId);expect(valid).toContain('显选客户、供应和真实投入')
  const wrong=route('unrelated-account');expect(wrong).toContain('原中转账户与当前对象不匹配');expect(wrong).not.toContain('显选客户、供应和真实投入')
  expect(writes).toBe(0);expect(controller.exportSaved()).toBe(before)
 }finally{await controller.close();await store.close()}
},20000)
