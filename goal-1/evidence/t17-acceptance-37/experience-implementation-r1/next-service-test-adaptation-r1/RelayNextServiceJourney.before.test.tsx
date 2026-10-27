import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {relayBusinessTarget} from './relay-player-thread.ts'
import {RelaySceneChoice} from './RelaySceneChoice.tsx'
import {RelayServiceChoice,RelayServiceFields,relayDraftScopeForTarget} from './RelayServiceChoice.tsx'
import {createRelaySceneDraftMemory,emptyRelaySceneDraft} from './relay-scene-draft.ts'
import actual115 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r7/r7-22-new115-quote-actually-effective-no-cash-ap-change.json?raw'

// Original React handlers and the original controller. This is not a browser or layout test.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),current:[] as unknown[],index:0}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const index=hooks.index++,values=hooks.current;if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useId:()=> 'new-period-journey',useEffect:()=>{}}
})
function mounted<T>(name:string,render:()=>T):T{const previous=hooks.current,index=hooks.index;hooks.current=hooks.slots.get(name)??[];hooks.slots.set(name,hooks.current);hooks.index=0;try{return render()}finally{hooks.current=previous;hooks.index=index}}
type Element=ReactElement<Record<string,unknown>>
function elements(node:unknown):Element[]{if(Array.isArray(node))return node.flatMap(elements);if(!isValidElement<Record<string,unknown>>(node))return [];const rows=[node,...elements(node.props.children),...elements(node.props.footer)];if(node.type===RelayServiceChoice||node.type===RelayServiceFields){const component=node.type as (props:Record<string,unknown>)=>unknown;rows.push(...elements(mounted(component.name,()=>component(node.props))))}return rows}
const text=(node:unknown):string=>typeof node==='string'||typeof node==='number'?String(node):Array.isArray(node)?node.map(text).join(''):isValidElement<Record<string,unknown>>(node)?text(node.props.children):''
let controller:GameController,store:IndexedDbRunStore,p:GamePanelProps,raw:string
beforeAll(async()=>{const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'next-service-actual115'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(actual115);const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures;p={view,features,controller,accountId:features.relay!.businesses[0]!.accountId,request:vi.fn()};raw=controller.exportSaved()},20000)
afterAll(async()=>{await controller?.close();await store?.close()})

it('opens the same-business fresh promise directly, preserves its explicit draft after cancel and original-book reading, and leaves the old bookmark untouched',()=>{
 hooks.slots.clear();const memory=createRelaySceneDraftMemory(p.view.runId),scoped={...p,relayDraftMemory:memory},business=relayBusinessTarget(scoped,p.features.relay!.businesses[0]!.id)!,period={...business,kind:'period' as const,periodId:p.features.relay!.periods[0]!.id},chosen=vi.fn(),inspect=vi.fn();let tree:unknown
 const render=()=>{tree=mounted('wrapper',()=>RelaySceneChoice({p:scoped,target:period,onTargetChange:chosen,onInspect:inspect,children:open=><button type="button" onClick={()=>open('next-service')}>核对下一期条件</button>}))}
 const click=(label:string)=>{const button=elements(tree).find(e=>e.type==='button'&&text(e).includes(label));if(!button||button.props.disabled||typeof button.props.onClick!=='function')throw Error('ACTUAL_ENABLED_BUTTON_REQUIRED:'+label);button.props.onClick();render()}
 render();click('核对下一期条件');let rows=elements(tree),editor=rows.find(e=>e.type===RelayServiceChoice)!
 expect(editor.props.target).toEqual(business);expect(chosen).not.toHaveBeenCalled();expect(text(rows)).toContain('当前用量价¥0.05，周期支持基准¥0');expect(text(rows)).toContain('已过原期限，续签须另行决定')
 const scope=relayDraftScopeForTarget(scoped,business,'service').scope!;expect(memory.read(p.view.runId,scope)).toBeUndefined()
 const fields=rows.filter(e=>e.type==='input'&&e.props.type==='checkbox');expect(fields).toHaveLength(6);expect(fields.every(e=>e.props.checked===false)).toBe(true)
 const change=fields[1]!.props.onChange;if(typeof change!=='function')throw Error('ACTUAL_CUSTOMER_HANDLER_REQUIRED');change({target:{checked:true}});render()
 expect(memory.read(p.view.runId,scope)).toEqual({...emptyRelaySceneDraft(),customerIds:[p.features.relay!.customers[1]!.id]})
 click('先合上，保留草稿');expect(elements(tree).some(e=>e.type===RelayServiceChoice)).toBe(false);click('核对下一期条件')
 expect(elements(tree).filter(e=>e.type==='input'&&e.props.type==='checkbox').map(e=>e.props.checked)).toEqual([false,true,false,false,false,false])
 click('翻看同企业原册，保留这份草稿');expect(inspect).toHaveBeenCalledWith(business,'service');expect(chosen).not.toHaveBeenCalled();click('核对下一期条件')
 expect(memory.read(p.view.runId,scope)!.customerIds).toEqual([p.features.relay!.customers[1]!.id]);expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(raw)
})

it('keeps a specified missing old period in explicit source recovery instead of opening a different business draft',()=>{
 hooks.slots.clear();const business=relayBusinessTarget(p,p.features.relay!.businesses[0]!.id)!,target={...business,kind:'period' as const,periodId:'missing-original-period'},chosen=vi.fn();let tree:unknown
 const render=()=>{tree=mounted('invalid-wrapper',()=>RelaySceneChoice({p,target,onTargetChange:chosen,onInspect:vi.fn(),children:open=><button type="button" onClick={()=>open('next-service')}>核对下一期条件</button>}))};render()
 const open=elements(tree).find(e=>e.type==='button'&&text(e)==='核对下一期条件')!;(open.props.onClick as ()=>void)();render()
 expect(elements(tree).some(e=>e.type===RelayServiceChoice)).toBe(false);expect(chosen).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(raw)
})
