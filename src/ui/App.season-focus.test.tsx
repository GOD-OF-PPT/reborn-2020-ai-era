import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import App from './App.tsx'
import {seasonFocusPreferenceKey,type SeasonFocusPreferenceStorage} from './season-focus-preference.ts'

// App's real server snapshot is deliberately the empty entry. This bounded render
// test reads the current controller projection instead; it does not run effects,
// click handlers or native browser persistence.
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 return {...actual,useSyncExternalStore:<T,>(_subscribe:unknown,getSnapshot:()=>T)=>getSnapshot()}
})

const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'s2-app-preference'})
let sequence=0
const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`s2-app-${++sequence}`})
beforeAll(async()=>{await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'first_order'},seed:'s2-app-preference'})})
afterAll(async()=>{await controller.close();await store.close()})

function preference(raw:(runId:string)=>unknown){
 const runId=controller.snapshot.view!.runId,key=seasonFocusPreferenceKey(runId),text=JSON.stringify(raw(runId))
 let writes=0
 const storage:SeasonFocusPreferenceStorage={getItem:k=>k===key?text:null,setItem:()=>{writes++}}
 return {storage,text,writes:()=>writes}
}
const work=(runId:string)=>({version:1,runId,quarter:'2020-Q1',focus:{runId,kind:'work',accountId:'personal',entityId:null}})

it('renders a stored work focus instead of the opening recommendation without writing a preference or game command',()=>{
 const h=preference(work),before=controller.exportSaved(),html=renderToStaticMarkup(<App controller={controller} focusPreferenceStorage={h.storage}/>)
 expect(html).toContain('门外的工作与生活')
 expect(html).toContain('保留一份工作，也为自己留些余地。')
 expect(html).not.toContain('有人想请你，剪一条短片。')
 expect(h.writes()).toBe(0)
 expect(controller.exportSaved()).toBe(before)
})

it('keeps a schema-valid but unavailable account explicit instead of replacing it with an executable work offer',()=>{
 const h=preference(runId=>({...work(runId),focus:{runId,kind:'market',accountId:'missing-account',entityId:null}})),before=controller.exportSaved()
 const html=renderToStaticMarkup(<App controller={controller} focusPreferenceStorage={h.storage}/>)
 expect(html).toContain('原账户已不可达')
 expect(html).not.toContain('接下这笔手工单')
 expect(html).not.toContain('先保留这一季的工作')
 expect(h.writes()).toBe(0);expect(controller.exportSaved()).toBe(before)
})

it('requires an explicit choice for an unsupported saved UI version and preserves its exact text',()=>{
 const h=preference(runId=>({...work(runId),version:99})),before=controller.exportSaved()
 const html=renderToStaticMarkup(<App controller={controller} focusPreferenceStorage={h.storage}/>)
 expect(html).toContain('不支持的UI版本')
 expect(html).toContain('先选回这一季在意的事')
 expect(html).not.toContain('接下这笔手工单')
 expect(h.storage.getItem(seasonFocusPreferenceKey(controller.snapshot.view!.runId))).toBe(h.text)
 expect(h.writes()).toBe(0);expect(controller.exportSaved()).toBe(before)
})

it('requires a public rematch for a shape-valid market entry bound to an unrelated business',()=>{
 const h=preference(runId=>({...work(runId),focus:{runId,kind:'market',accountId:'personal',entityId:null,businessId:'unrelated-business'}})),before=controller.exportSaved()
 const html=renderToStaticMarkup(<App controller={controller} focusPreferenceStorage={h.storage}/>)
 expect(html).toContain('先选回这一季在意的事')
 expect(html).not.toContain('接下这笔手工单')
 expect(html).not.toContain('选择一份模拟委托')
 expect(h.writes()).toBe(0);expect(controller.exportSaved()).toBe(before)
})

it('separates an actual preference read exception from a successful game save and blocks a substituted default action',()=>{
 const before=controller.exportSaved(),storage:SeasonFocusPreferenceStorage={getItem:()=>{throw Error('storage denied')},setItem:()=>{throw Error('READING_MUST_NOT_WRITE')}}
 const html=renderToStaticMarkup(<App controller={controller} focusPreferenceStorage={storage}/>)
 expect(html).toContain('未能读取本机关注')
 expect(html).toContain('先选回这一季在意的事')
 expect(html).toContain('已保存，第1次提交')
 expect(html).not.toContain('接下这笔手工单')
 expect(html).not.toContain('操作未完成')
 expect(controller.exportSaved()).toBe(before)
})
