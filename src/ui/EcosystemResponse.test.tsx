import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {EcosystemSceneChoice} from './EcosystemSceneChoice.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ResourceSelect} from './ResourceSelect.tsx'
import {createEcosystemDraftMemory} from './ecosystem-draft.ts'
import {ecosystemFocusFor,ecosystemJourneyFor} from './ecosystem-player-thread.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {EcosystemSceneTarget} from './ecosystem-scene-target.ts'
import source146 from '../../goal-1/evidence/t17-acceptance-38/chrome-main-r9/u5-r9-05-new146-client1-pilot-actual-rejected.json?raw'

// Real Native146 is re-imported by the original controller. This driver checks
// consumer choices/payloads and unchanged storage, not human or visual acceptance.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),current:[] as unknown[],index:0}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const index=hooks.index++,values=hooks.current;if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useId:()=> 'ecology-original-response'}
})
function mounted<T>(key:string,render:()=>T):T{const old=hooks.current,index=hooks.index;hooks.current=hooks.slots.get(key)??[];hooks.slots.set(key,hooks.current);hooks.index=0;try{return render()}finally{hooks.current=old;hooks.index=index}}
type Element=ReactElement<Record<string,unknown>>
function nodes(value:unknown):Element[]{return Array.isArray(value)?value.flatMap(nodes):isValidElement<Record<string,unknown>>(value)?[value,...nodes(value.props.children),...nodes(value.props.footer)]:[]}
const words=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(words).join(''):isValidElement<Record<string,unknown>>(value)?words(value.props.children):''
let controller:GameController,store:IndexedDbRunStore,p:GamePanelProps,target:EcosystemSceneTarget
beforeAll(async()=>{
 const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u5-response-original146'})
 controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(source146)
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,rows=features.deepseek!.contracts.filter(c=>c.status==='rejected');expect(rows).toHaveLength(1)
 const c=rows[0]!,b=features.deepseek!.businesses.find(b=>b.id===c.businessId)!
 p={controller,view,features,accountId:b.accountId,request:vi.fn(),ecosystemDraftMemory:createEcosystemDraftMemory()};target={runId:view.runId,accountId:b.accountId,businessId:b.id,kind:'contract',recordId:c.id}
 expect(view.revision).toBe(146);expect(controller.exportSaved()).toBe(source146)
})
afterAll(async()=>{await controller?.close();await store?.close()})
function response(key:string){const onClose=vi.fn(),onChoose=vi.fn(),draw=()=>mounted(key,()=>EcosystemSceneChoice({p,target,intent:'remediation',onClose,onChoose,onInspect:vi.fn(),onToday:vi.fn()}));return {draw,onClose,onChoose}}

it('first compares actual400 already paid, total800 and2 points to retry, or1500 refund with no support compensation',()=>{
 hooks.slots.clear();const ui=response('first-comparison'),tree=ui.draw(),all=nodes(tree),copy=words(tree)
 expect(copy).toContain('这次制作与支持已付¥400，未开工预留¥0');expect(copy).toContain('合计自有预算¥800、2点');expect(copy).toContain('退回未履约预款¥1,500；支持退出补偿¥0')
 expect(all.some(n=>n.type===ResourceSelect||n.type==='input'&&n.props.type==='date')).toBe(false)
 const cancel=all.find(n=>n.type===CommandButton&&n.props.kind==='CancelEcoContract')!
 expect(cancel.props.payload).toEqual({contractId:target.kind==='contract'?target.recordId:''});expect(cancel.props.confirm).toBe(true)
 expect(controller.preview(controller.prepare('CancelEcoContract',cancel.props.payload))).toMatchObject({allowed:true,actionPoints:0})
 const scene=ecosystemJourneyFor(p,ecosystemFocusFor(p,target));expect(scene.line).toContain('已付¥400');expect(scene.line).toContain('未开工的资金预留¥0')
 expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(source146)
})

it('opens preparation only after the explicit retry choice and preserves exact resource/date through returning and reopening',()=>{
 hooks.slots.clear();const ui=response('selected-remediation');let tree:unknown
 const draw=()=>{tree=ui.draw()};draw();const retry=nodes(tree).find(n=>n.type==='button'&&words(n).startsWith('想再试一次，选择日子与资源'))!;(retry.props.onClick as ()=>void)();draw()
 const resource=nodes(tree).find(n=>n.type===ResourceSelect)!,date=nodes(tree).find(n=>n.type==='input'&&n.props.type==='date')!
 expect(resource.props.value).toBe('');expect(date.props.value).toBe('');expect(date.props.min).toBe('2025-10-09')
 ;(resource.props.onChange as (value:string)=>void)('player-production');draw();(nodes(tree).find(n=>n.type==='input'&&n.props.type==='date')!.props.onChange as (event:unknown)=>void)({target:{value:'2025-10-16'}});draw()
 const body={contractId:target.kind==='contract'?target.recordId:'',resources:['player-production'],startAt:'2025-10-16'},command=nodes(tree).find(n=>n.type===CommandButton&&n.props.kind==='StartEcoRemediation')!
 expect(command.props.payload).toEqual(body);expect(command.props.confirm).toBe(true);expect(controller.preview(controller.prepare('StartEcoRemediation',body)).allowed).toBe(true)
 const back=nodes(tree).find(n=>n.type==='button'&&words(n)==='返回两种回应，再想一想')!;(back.props.onClick as ()=>void)();draw();expect(nodes(tree).some(n=>n.type===ResourceSelect)).toBe(false)
 ;(nodes(tree).find(n=>n.type==='button'&&words(n).startsWith('想再试一次，选择日子与资源'))!.props.onClick as ()=>void)();draw()
 expect(nodes(tree).find(n=>n.type===ResourceSelect)!.props.value).toBe('player-production');expect(nodes(tree).find(n=>n.type==='input'&&n.props.type==='date')!.props.value).toBe('2025-10-16')
 expect(ui.onChoose).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(source146)
})
