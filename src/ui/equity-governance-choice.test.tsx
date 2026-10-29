import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {signedEquity} from '../testing/deepseek-scenarios.ts'
import {projectDeepseek} from '../core/deepseek-projection.ts'
import {projectWorkbench} from '../application/workbench-projection.ts'
import {projectSceneCommands} from '../application/scene-commands.ts'
import {campaignMarket} from '../application/campaign.ts'
import {EquitySceneChoice} from './EquitySceneChoice.tsx'
import EquityPanel from './EquityPanel.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ResourceSelect} from './ResourceSelect.tsx'
import {createEquityDraftMemory,equityDraftKey} from './equity-draft.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'

// Real fixture codec, Controller/IDB and public projections, consumed by the
// actual choice/book callbacks. This narrow hook surface is not App or Native.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const values=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,values);const i=hooks.index++;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return[values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(value:T)=>state(()=>({current:value}))[0],useId:()=>hooks.scope,useEffect:()=>{}}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(v:unknown):Element[]=>Array.isArray(v)?v.flatMap(elements):isValidElement<Record<string,unknown>>(v)?[v,...elements(v.props.children)]:[]
const text=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(text).join(''):isValidElement<Record<string,unknown>>(v)?text(v.props.children):''
function draw<T,>(scope:string,create:()=>T):T{hooks.scope=scope;hooks.index=0;return create()}
function invoke(e:Element,name:string,...args:unknown[]){const fn=e.props[name];if(e.props.disabled||typeof fn!=='function')throw Error('ACTUAL_ENABLED_CALLBACK_REQUIRED');return fn(...args)}
let source:ReturnType<typeof signedEquity>,normal:Awaited<ReturnType<typeof open>>,failed:Awaited<ReturnType<typeof open>>,reader:GameController
async function open(id:string,faulty=false){
 const factory=new IDBFactory(),name='u6-governance-'+id,locks=new MemoryWriterAccess();let armed=false
 const fault=abortAfterHeadWrite(factory,name,()=>armed),store=new IndexedDbRunStore({codec:source.h.codec,factory:faulty?fault.factory:factory,keyRange:IDBKeyRange,name}),controller=new GameController({codec:source.h.codec,store,locks})
 await controller.initialize();await controller.importNew(source.h.codec.export(source.h.run))
 return{controller,store,locks,fault,arm:()=>{armed=true}}
}
function props(controller:GameController):GamePanelProps{
 const view=controller.snapshot.view!,run=source.h.codec.import(controller.exportSaved())
 // Only this component's real public features are supplied; no missing App,
 // life or journey projection is fabricated to imitate a normal campaign.
 const features={deepseek:projectDeepseek(run,source.h.deepseek),workbench:projectWorkbench(run,source.h.runtime,source.h.operations.catalog,campaignMarket.catalog),sceneCommands:projectSceneCommands(run)} as unknown as PlayFeatures
 return{controller,view,features,accountId:'personal',request:vi.fn(),equityDraftMemory:createEquityDraftMemory()}
}
const target=(p:GamePanelProps):EquitySceneTarget=>{const a=p.features.deepseek!.agreements[0]!;return{runId:p.view.runId,accountId:a.accountId,businessId:a.businessId,kind:'agreement',recordId:a.id}}
function near(p:GamePanelProps,scope='near-governance'){
 const t=target(p),callbacks={onClose:vi.fn(),onChoose:vi.fn(),onIntent:vi.fn(),onInspect:vi.fn(),onToday:vi.fn()}
 let tree=draw(scope,()=>EquitySceneChoice({p,target:t,intent:'governance',...callbacks}))
 const render=()=>{tree=draw(scope,()=>EquitySceneChoice({p,target:t,intent:'governance',...callbacks}));return tree}
 const choose=(label:string)=>{invoke(elements(tree).find(e=>e.type==='button'&&text(e).startsWith(label))!,'onClick');render()}
 const resource=()=>elements(tree).find(e=>e.type===ResourceSelect)!
 const date=()=>elements(tree).find(e=>e.type==='input'&&e.props.type==='date')!
 const assign=()=>{invoke(resource(),'onChange','player-production');render();invoke(date(),'onChange',{currentTarget:{value:'2025-07-02'}});render()}
 const pay=()=>{const c=elements(tree).find(e=>e.type===CommandButton&&e.props.kind==='ProposeEquityGovernance')!;return elements(Reflect.apply(CommandButton,undefined,[c.props])).find(e=>e.type==='button')!}
 return{render,choose,assign,resource,date,pay,tree:()=>tree,callbacks}
}
beforeAll(async()=>{
 source=signedEquity({},'board');source.h.send('AdvanceTime',{date:'2025-07-01'})
 normal=await open('normal');failed=await open('failed',true)
 reader=new GameController({codec:source.h.codec,store:normal.store,locks:normal.locks});await reader.initialize();await reader.continueLife(source.h.run.runId)
})
beforeEach(()=>hooks.slots.clear())
afterAll(async()=>{await reader?.close();await normal?.controller.close();await failed?.controller.close(true);await normal?.store.close();await failed?.store.close()})

it('compares both effects before showing an empty original arrangement, without writing or choosing a default policy',()=>{
 const p=props(normal.controller),before=normal.controller.exportSaved(),ui=near(p)
 expect(text(ui.tree())).toContain('已经发生的资本用途报告');expect(text(ui.tree())).toContain('原报价不追改');expect(elements(ui.tree()).some(e=>e.type===CommandButton&&e.props.kind==='ProposeEquityGovernance')).toBe(false)
 ui.choose('查清资本去向');expect(ui.date().props.value).toBe('');expect(ui.resource().props.value).toBe('');expect(ui.pay().props.disabled).toBe(true)
 expect(p.request).not.toHaveBeenCalled();expect(normal.controller.exportSaved()).toBe(before)
})

it('preserves fields on return and retires old edits and payment before repaint and across a policy round trip',()=>{
 const p=props(normal.controller),ui=near(p),comparisonTitle=ui.tree().props.title;ui.choose('查清资本去向');expect(ui.tree().props.title).not.toBe(comparisonTitle);ui.assign()
 const oldDate=ui.date(),oldPay=ui.pay(),back=elements(ui.tree()).find(e=>e.type==='button'&&text(e).startsWith('重新比较两项提案'))!
 invoke(back,'onClick');invoke(oldDate,'onChange',{currentTarget:{value:'2025-08-01'}});invoke(oldPay,'onClick');expect(p.request).not.toHaveBeenCalled();ui.render();expect(ui.tree().props.title).toBe(comparisonTitle)
 ui.choose('限定接手范围');expect(ui.date().props.value).toBe('2025-07-02');expect(ui.resource().props.value).toBe('player-production')
 ui.choose('重新比较两项提案');ui.choose('查清资本去向');invoke(oldPay,'onClick');expect(p.request).not.toHaveBeenCalled()
 invoke(ui.pay(),'onClick');expect(p.request).toHaveBeenCalledWith('ProposeEquityGovernance',{agreementId:source.agreement.id,policy:'independent_audit',resources:['player-production'],startAt:'2025-07-02'},expect.any(String),true)
})

it('fills today only on an explicit choice while preserving manual future dates and leaving the resource and commitment independent',()=>{
 const p=props(normal.controller),before=normal.controller.exportSaved(),ui=near(p);ui.choose('查清资本去向')
 expect(ui.date().props.value).toBe('');ui.choose('填入今天');expect(ui.date().props.value).toBe(p.view.date);expect(ui.resource().props.value).toBe('');expect(ui.pay().props.disabled).toBe(true)
 ui.assign();expect(ui.date().props.value).toBe('2025-07-02');ui.choose('重新比较两项提案');ui.choose('限定接手范围');expect(ui.date().props.value).toBe('2025-07-02')
 ui.choose('填入今天');invoke(ui.pay(),'onClick');expect(p.request).toHaveBeenCalledWith('ProposeEquityGovernance',expect.objectContaining({policy:'commercial_scope',startAt:'2025-07-01',resources:['player-production']}),expect.any(String),true);expect(normal.controller.exportSaved()).toBe(before)
})

it('shares the chosen policy and exact resources/date with the original book and fences a book policy change before the next near repaint',()=>{
 const p=props(normal.controller),t=target(p),ui=near(p);ui.choose('查清资本去向');ui.assign();const oldPay=ui.pay()
 const book=()=>draw('governance-book',()=>EquityPanel({...p,assignment:{resources:[],startAt:''},initialTarget:t})),tree=book(),c=elements(tree).find(e=>e.type===CommandButton&&e.props.kind==='ProposeEquityGovernance'&&(e.props.payload as {policy:string}).policy==='commercial_scope')!
 expect(c.props.payload).toMatchObject({resources:['player-production'],startAt:'2025-07-02'});expect(c.props.confirm).toBe(true)
 invoke(elements(Reflect.apply(CommandButton,undefined,[c.props])).find(e=>e.type==='button')!,'onClick');expect(p.request).toHaveBeenCalledTimes(1)
 invoke(oldPay,'onClick');expect(p.request).toHaveBeenCalledTimes(1);ui.render();expect(text(ui.tree())).toContain('本次想提出：限定研究用途与接手方');expect(ui.date().props.value).toBe('2025-07-02')
 const key=equityDraftKey(p,t,'governance');expect(p.equityDraftMemory!.get(key)).toMatchObject({policy:'commercial_scope',governanceStep:'arrange',date:'2025-07-02',resource:'player-production'})
})

it('allows a real reader to compare and read the arrangement while the original proposal remains disabled',()=>{
 const p=props(reader),ui=near(p);expect(p.view.readOnly).toBe(true);ui.choose('限定接手范围');ui.assign()
 expect(ui.pay().props.disabled).toBe(true);expect(text(ui.tree())).toContain('限定研究用途与接手方');expect(p.request).not.toHaveBeenCalled()
})

it('keeps the old draft generation after a real head.put abort and creates a new empty proposal slot only after the exact original retry',async()=>{
 const p=props(failed.controller),ui=near(p),key=equityDraftKey(p,target(p),'governance');ui.choose('查清资本去向');ui.assign();invoke(ui.pay(),'onClick')
 const [kind,payload]=(p.request as ReturnType<typeof vi.fn>).mock.calls[0]!,before=failed.controller.exportSaved();failed.arm()
 expect((await failed.controller.submit(failed.controller.prepare(kind,payload))).status).toBe('unsaved');expect(failed.fault.trace).toEqual({writeSucceeded:true,abortIssued:true});expect(failed.controller.exportSaved()).toBe(before)
 const old={...props(failed.controller),equityDraftMemory:p.equityDraftMemory!},oldKey=equityDraftKey(old,target(old),'governance');expect(oldKey).toBe(key);expect(p.equityDraftMemory!.get(key)?.policy).toBe('independent_audit')
 const candidate=failed.controller.exportCandidate();expect((await failed.controller.retry()).status).toBe('saved');expect(failed.controller.exportSaved()).toBe(candidate)
 const next={...props(failed.controller),equityDraftMemory:p.equityDraftMemory!},nextKey=equityDraftKey(next,target(next),'governance');expect(nextKey).not.toBe(key);expect(p.equityDraftMemory!.get(nextKey)).toBeUndefined();expect(next.features.deepseek!.governance[0]).toMatchObject({policy:'independent_audit',approved:null,resolvedAt:null})
})
