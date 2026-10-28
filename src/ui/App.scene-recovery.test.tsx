import {beforeAll,afterAll,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import App from './App.tsx'
import {seasonFocusPreferenceKey,type SeasonFocusPreferenceStorage} from './season-focus-preference.ts'
import raw from '../../goal-1/evidence/t17-acceptance-38/chrome-art-isolated-r25/u5-r25-03-actual-physical75-after-settings.json?raw'

// Render the actual controller snapshot. Browser effects/input remain a separate gate.
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();return {...actual,useSyncExternalStore:<T,>(_subscribe:unknown,getSnapshot:()=>T)=>getSnapshot()}})
let controller:GameController,store:IndexedDbRunStore
beforeAll(async()=>{const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'cux09-app-recovery'});controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=> 'cux09-app-input'});await controller.initialize();await controller.importNew(raw)})
afterAll(async()=>{await controller?.close();await store?.close()})

it('shows the actual cooperation and original wait on the first App view without writing a bookmark or game command',()=>{
 const before=controller.exportSaved(),write=vi.fn(),storage:SeasonFocusPreferenceStorage={getItem:()=>null,setItem:write}
 const html=renderToStaticMarkup(<App controller={controller} focusPreferenceStorage={storage}/>)
 expect(html).toContain('生产已获认可，答应的支持还要走完。')
 expect(html).toContain('等这份原支持的反馈')
 expect(html).toContain('2024-07-26')
 expect(html).not.toMatch(/<h1[^>]*>DeepSeek生态与架空股权<\/h1>/)
 expect(write).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(before)
})

it('keeps an unsupported bookmark explicit even though an original cooperation can otherwise be recovered',()=>{
 const runId=controller.snapshot.view!.runId,key=seasonFocusPreferenceKey(runId),text=JSON.stringify({version:99,runId,quarter:'2024-Q3',focus:{kind:'free',runId,accountId:'personal',entityId:null}}),write=vi.fn(),before=controller.exportSaved(),storage:SeasonFocusPreferenceStorage={getItem:k=>k===key?text:null,setItem:write}
 const html=renderToStaticMarkup(<App controller={controller} focusPreferenceStorage={storage}/>)
 expect(html).toContain('不支持的UI版本');expect(html).toContain('先选回这一季在意的事')
 expect(html).not.toContain('等这份原支持的反馈')
 expect(storage.getItem(key)).toBe(text);expect(write).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(before)
})

it('keeps a preference read failure separate from recovery and preserves the original saved life',()=>{
 const before=controller.exportSaved(),write=vi.fn(),storage:SeasonFocusPreferenceStorage={getItem:()=>{throw Error('DENIED')},setItem:write}
 const html=renderToStaticMarkup(<App controller={controller} focusPreferenceStorage={storage}/>)
 expect(html).toContain('未能读取本机关注');expect(html).toContain('先选回这一季在意的事')
 expect(html).not.toContain('等这份原支持的反馈')
 expect(write).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(before)
})
