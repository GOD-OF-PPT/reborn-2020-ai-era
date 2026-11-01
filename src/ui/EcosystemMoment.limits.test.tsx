import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {EcosystemMoment} from './EcosystemMoment.tsx'
import {EcosystemPaper} from './EcosystemPaper.tsx'
import {EcosystemSceneChoice} from './EcosystemSceneChoice.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {CommandButton} from './CommandButton.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {ecosystemFocusFor,ecosystemJourneyFor} from './ecosystem-player-thread.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import normalEnd from '../../goal-1/evidence/t17-acceptance-38/guard-and-reading-r21/normal-end-wait.json?raw'
import normalEve from '../../goal-1/evidence/t17-acceptance-38/guard-and-reading-r21/normal-end-eve.json?raw'
import normalMiddle from '../../goal-1/evidence/t17-acceptance-38/art-r19/replayed-original-native-prefix75.json?raw'

// Real earned normal codec prefixes. These execute original UI handlers and
// original controller/store APIs, without browser, geometry or human claims.
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 return {...actual,useState:<T,>(initial:T|(()=>T))=>[typeof initial==='function'?(initial as ()=>T)():initial,()=>{}],useRef:<T,>(initial:T)=>({current:initial}),useMemo:<T,>(factory:()=>T)=>factory(),useCallback:<T,>(callback:T)=>callback,useId:()=> 'u5-end-original-consumer',useEffect:()=>{}}
})
type Element=ReactElement<Record<string,unknown>>
const execute=new Set<unknown>([ClockAdvance,CommandButton,EcosystemPaper])
function nodes(value:unknown):Element[]{
 if(Array.isArray(value))return value.flatMap(nodes)
 if(!isValidElement<Record<string,unknown>>(value))return []
 const children=['children','heading','context','feedback','facts','decisions','object','record','footer'].flatMap(key=>nodes(value.props[key]))
 if(execute.has(value.type)){const component=value.type as (props:Record<string,unknown>)=>unknown;children.push(...nodes(component(value.props)))}
 return [value,...children]
}
const words=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(words).join(''):isValidElement<Record<string,unknown>>(value)?words(value.props.children):''
async function fixture(raw:string,name:string,withReader=false){
 const codec=createCampaignCodec(),factory=new IDBFactory(),locks=new MemoryWriterAccess(),store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name}),writer=new GameController({codec,store,locks})
 await writer.initialize();await writer.importNew(raw)
 let controller=writer,reader:GameController|undefined
 if(withReader){const physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name});reader=new GameController({codec,store:physical,locks});await reader.initialize();await reader.continueLife(writer.snapshot.view!.runId);controller=reader}
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,c=features.deepseek!.contracts.at(-1)!,b=features.deepseek!.businesses.find(b=>b.id===c.businessId)!,p:GamePanelProps={controller,view,features,accountId:b.accountId,request:vi.fn()},target={kind:'contract' as const,recordId:c.id,runId:view.runId,businessId:b.id,accountId:b.accountId},focus=ecosystemFocusFor(p,target)
 expect(view.origin).toBe('normal')
 return {p,target,focus,controller,close:async()=>{await reader?.close(true);await writer.close(true)}}
}
type Fixture=Awaited<ReturnType<typeof fixture>>

describe('normal last-day original receivable',()=>{
 let f:Fixture
 beforeAll(async()=>{f=await fixture(normalEnd,'u5-normal-end-receivable')})
 afterAll(async()=>{await f?.close()})
 it('keeps the original2026 due date and sends both thought and paper to the original closing entry without advancing normal time',()=>{
  const {p,focus}=f,onNavigate=vi.fn()
  expect(p.view.date).toBe('2025-12-31');expect(p.features.workbench.atQuarterEnd).toBe(true);expect(p.features.journey!.canEnterEpilogue).toBe(true)
  expect(ecosystemJourneyFor(p,focus).action).toMatchObject({kind:'wait',date:'2026-01-06'})
  const tree=EcosystemMoment({p,focus,headingRef:{current:null},onFocus:vi.fn(),onNavigate,onExplore:vi.fn()}),all=nodes(tree),paper=all.find(n=>n.type===EcosystemPaper)!,binding=paper.props.binding as {activate:()=>void;disabled:boolean;label:string}
  expect(all.some(n=>n.type===ClockAdvance)).toBe(false);expect(all.some(n=>n.type==='button'&&n.props.onClick===binding.activate&&!String(n.props.className).includes('ecosystem-object'))).toBe(true)
  expect(binding.disabled).toBe(false);binding.activate();expect(onNavigate).toHaveBeenCalledWith('room');expect(p.request).not.toHaveBeenCalled()
  expect(f.controller.preview(f.controller.prepare('AdvanceTime',{date:'2026-01-06'}))).toMatchObject({allowed:false,reasonCodes:['PREVIEW_RANGE_ENDED']})
  expect(f.controller.exportSaved()).toBe(normalEnd)
 })
})

describe('normal day before closing',()=>{
 let f:Fixture
 beforeAll(async()=>{f=await fixture(normalEve,'u5-normal-eve-receivable')})
 afterAll(async()=>{await f?.close()})
 it('keeps the original future receivable while the same original clock binding first requests the final normal date',()=>{
  const {p,focus}=f,onNavigate=vi.fn(),tree=EcosystemMoment({p,focus,headingRef:{current:null},onFocus:vi.fn(),onNavigate,onExplore:vi.fn()}),all=nodes(tree),clock=all.find(n=>n.type===ClockAdvance)!,paper=all.find(n=>n.type===EcosystemPaper)!,binding=paper.props.binding as {activate:()=>void}
  expect(p.view.date).toBe('2025-12-30');expect(clock.props.date).toBe('2025-12-31');expect(ecosystemJourneyFor(p,focus).action).toMatchObject({kind:'wait',date:'2026-01-06'})
  expect(all.some(n=>n.type==='button'&&n.props.onClick===binding.activate&&!String(n.props.className).includes('ecosystem-object'))).toBe(true)
  binding.activate();expect(p.request).toHaveBeenCalledWith('AdvanceTime',{date:'2025-12-31'},expect.any(String),false);expect(onNavigate).not.toHaveBeenCalled();expect(f.controller.exportSaved()).toBe(normalEve)
 })
})

describe('original actual read-only source',()=>{
 let f:Fixture
 beforeAll(async()=>{f=await fixture(normalMiddle,'u5-normal-reading-protection',true)})
 afterAll(async()=>{await f?.close()})
 it('consolidates global read protection while retaining the original near decision reason and exact write prohibition',()=>{
  const {p,focus,target}=f,onNavigate=vi.fn(),tree=EcosystemMoment({p,focus,headingRef:{current:null},feedback:f.controller.snapshot.notice,onFocus:vi.fn(),onNavigate,onExplore:vi.fn()}),all=nodes(tree),tableau=all.find(n=>n.type===RoomTableau)!,paper=all.find(n=>n.type===EcosystemPaper)!,binding=paper.props.binding as {disabled:boolean;activate:()=>void}
  expect(p.view.readOnly).toBe(true);expect(binding.disabled).toBe(true);binding.activate();expect(p.request).not.toHaveBeenCalled()
  expect(nodes(tableau.props.decisions).filter(n=>n.type==='small'&&n.props.className==='reason')).toHaveLength(0)
  // The global notice is already owned by App; this paper retains its visible
  // protection and its original disabled action without repeating that notice.
  expect(words(tableau.props.record)).not.toContain('当前为只读，请查看写入状态说明。')
  const visiblePaper=nodes(tableau.props.object).find(n=>n.type==='button'&&String(n.props.className).includes('ecosystem-object'))!
  expect(words(visiblePaper)).toContain('只读 · 原记录保留');expect(visiblePaper.props.disabled).toBe(true)
  const read=nodes(tableau.props.record).find(n=>n.type==='button')!;(read.props.onClick as ()=>void)();expect(onNavigate).toHaveBeenCalledWith('deepseek',expect.objectContaining({recordId:target.recordId,openRecord:true,accountId:target.accountId}))
  const near=EcosystemSceneChoice({p,target,intent:'next',onClose:vi.fn(),onChoose:vi.fn(),onInspect:vi.fn(),onToday:vi.fn()}),cancel=nodes(near).find(n=>n.type===CommandButton&&n.props.kind==='CancelEcoContract')!,nearOriginal=CommandButton(cancel.props as unknown as Parameters<typeof CommandButton>[0]),button=nodes(nearOriginal).find(n=>n.type==='button')!
  expect(button.props.disabled).toBe(true);expect(words(nearOriginal)).toContain('当前只读。请关闭正在操作同一人生的另一标签，再尝试接管。');(button.props.onClick as ()=>void)();expect(p.request).not.toHaveBeenCalled();expect(f.controller.exportSaved()).toBe(normalMiddle)
 })
})
