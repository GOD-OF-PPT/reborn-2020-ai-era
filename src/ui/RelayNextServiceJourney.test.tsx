import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {relayBusinessTarget} from './relay-player-thread.ts'
import {RelaySceneChoice,RelayNextServiceConditions} from './RelaySceneChoice.tsx'
import {RelayServiceChoice,RelayServiceFields,relayDraftScopeForTarget} from './RelayServiceChoice.tsx'
import {createRelaySceneDraftMemory,emptyRelaySceneDraft} from './relay-scene-draft.ts'
import {RelayResponseEditor,RelayRenewFields} from './RelayResponseEditor.tsx'
import {CommandButton} from './CommandButton.tsx'
import {createRelayResponseDraftMemory} from './relay-response-draft.ts'
import {relayNextServiceContract} from './relay-next-service-contract.ts'
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
function elements(node:unknown):Element[]{if(Array.isArray(node))return node.flatMap(elements);if(!isValidElement<Record<string,unknown>>(node))return [];const rows=[node,...elements(node.props.children),...elements(node.props.footer)];if(node.type===RelayNextServiceConditions||node.type===RelayServiceChoice||node.type===RelayServiceFields||node.type===RelayResponseEditor||node.type===RelayRenewFields||node.type===CommandButton){const component=node.type as (props:Record<string,unknown>)=>unknown;rows.push(...elements(mounted(component.name,()=>component(node.props))))}return rows}
const text=(node:unknown):string=>typeof node==='string'||typeof node==='number'?String(node):Array.isArray(node)?node.map(text).join(''):isValidElement<Record<string,unknown>>(node)?text(node.props.children):''
let controller:GameController,store:IndexedDbRunStore,p:GamePanelProps,raw:string
beforeAll(async()=>{const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'next-service-actual115'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(actual115);const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures;p={view,features,controller,accountId:features.relay!.businesses[0]!.accountId,request:vi.fn()};raw=controller.exportSaved()},20000)
afterAll(async()=>{await controller?.close();await store?.close()})

it('opens the same-business fresh promise only in an explicit public coverage variant, preserving its draft, original-book reading and the old bookmark',()=>{
 // A bounded public-view prerequisite variant, not a renewal, imported save
 // or proof that the unmodified115 controller permits this proposed service.
 hooks.slots.clear();const memory=createRelaySceneDraftMemory(p.view.runId),first=p.features.relay!.customers[0]!,features={...p.features,relay:{...p.features.relay!,customers:p.features.relay!.customers.map(c=>c.id===first.id?{...c,termEnd:'2025-05-31'}:c)}},scoped={...p,features,relayDraftMemory:memory},business=relayBusinessTarget(scoped,p.features.relay!.businesses[0]!.id)!,period={...business,kind:'period' as const,periodId:p.features.relay!.periods[0]!.id},chosen=vi.fn(),inspect=vi.fn();let tree:unknown
 expect(relayNextServiceContract(scoped,business).customers[0]!.coverage).toBe('covers');expect(relayNextServiceContract(p,business).customers.every(c=>c.coverage==='short')).toBe(true)
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

it('keeps the real115 short contracts out of a service draft and opens only the explicitly selected original renewal with empty terms',()=>{
 hooks.slots.clear();const memory=createRelaySceneDraftMemory(p.view.runId),responses=createRelayResponseDraftMemory(p.view.runId),scoped={...p,relayDraftMemory:memory,relayResponseDraftMemory:responses,request:vi.fn<GamePanelProps['request']>()},business=relayBusinessTarget(scoped,p.features.relay!.businesses[0]!.id)!,period={...business,kind:'period' as const,periodId:p.features.relay!.periods[0]!.id},customer=p.features.relay!.customers[1]!,pin=JSON.stringify(period),chosen=vi.fn(),inspect=vi.fn();let tree:unknown
 const render=()=>{tree=mounted('actual115-short-wrapper',()=>RelaySceneChoice({p:scoped,target:period,onTargetChange:chosen,onInspect:inspect,children:open=><button type="button" onClick={()=>open('next-service')}>核对下一期条件</button>}))}
 const click=(label:string)=>{const button=elements(tree).find(e=>e.type==='button'&&text(e).includes(label));if(!button||button.props.disabled||typeof button.props.onClick!=='function')throw Error('REAL_SHORT_CONTRACT_BUTTON_REQUIRED:'+label);button.props.onClick();render()}
 const field=(label:string)=>{const parent=elements(tree).find(e=>e.type==='label'&&text(e).includes(label)),input=parent&&elements(parent).find(e=>e.type==='input'||e.type==='select');if(!input)throw Error('REAL_RENEWAL_FIELD_REQUIRED:'+label);return input}
 const edit=(label:string,value:string)=>{const input=field(label);if(typeof input.props.onChange!=='function')throw Error('REAL_RENEWAL_HANDLER_REQUIRED');input.props.onChange({target:{value}});render()}
 render();click('核对下一期条件');let rows=elements(tree)
 expect(rows.some(e=>e.type===RelayNextServiceConditions)).toBe(true);expect(rows.some(e=>e.type===RelayServiceChoice)).toBe(false);expect(rows.some(e=>e.type==='input'&&e.props.type==='checkbox')).toBe(false)
 const radios=rows.filter(e=>e.type==='input'&&e.props.type==='radio');expect(radios).toHaveLength(6);expect(radios.every(e=>e.props.checked===false)).toBe(true)
 expect(text(rows)).toContain('目前没有一份已核原合同能覆盖');expect(text(rows)).toContain('2025-04-10');expect(text(rows)).toContain('2025-05-08');expect(elements(tree).find(e=>e.type==='button'&&text(e).includes('明确核对这位原客户的续签条件'))!.props.disabled).toBe(true)
 const scope=relayDraftScopeForTarget(scoped,business,'service').scope!;expect(memory.read(p.view.runId,scope)).toBeUndefined()
 const label=rows.find(e=>e.type==='label'&&e.key===customer.id)!,radio=elements(label).find(e=>e.type==='input'&&e.props.type==='radio')!
 if(typeof radio.props.onChange!=='function')throw Error('EXPLICIT_ORIGINAL_RENEWAL_CUSTOMER_REQUIRED')
 radio.props.onChange({target:{checked:true}});render();click('明确核对这位原客户的续签条件')
 const editor=elements(tree).find(e=>e.type===RelayResponseEditor)!
 expect(editor.props.target).toEqual(business);expect(editor.props.subject).toEqual({kind:'customer',id:customer.id});expect(editor.props.mode).toBe('renew');expect(field('本次新有效期').props.value).toBe('');expect(field('本次续签收款条件').props.value).toBe('')
 edit('本次新有效期','2025-05-31');edit('本次续签收款条件','postpaid');expect(field('本次新后付信用上限').props.value).toBe('');edit('本次新后付信用上限','100')
 const original=elements(tree).find(e=>e.type===CommandButton&&e.props.kind==='RenewRelayCustomer')!
 expect(original.props.payload).toEqual({customerId:customer.id,termEnd:'2025-05-31',mode:'postpaid',creditLimitFen:10000});expect(original.props.confirm).toBe(true);expect(controller.preview(controller.prepare('RenewRelayCustomer',original.props.payload)).allowed).toBe(true)
 click('返回同企业新期条件，保留两份草稿');expect(elements(tree).some(e=>e.type===RelayServiceChoice)).toBe(false);click('明确核对这位原客户的续签条件');expect(field('本次新有效期').props.value).toBe('2025-05-31');expect(field('本次新后付信用上限').props.value).toBe('100')
 click('合上续签，仍留原期书签');expect(elements(tree).some(e=>e.type===RelayNextServiceConditions)).toBe(false)
 expect(memory.read(p.view.runId,scope)).toBeUndefined();expect(chosen).not.toHaveBeenCalled();expect(inspect).not.toHaveBeenCalled();expect(scoped.request).not.toHaveBeenCalled();expect(JSON.stringify(period)).toBe(pin);expect(controller.exportSaved()).toBe(raw)
})

it('keeps a specified missing old period in explicit source recovery instead of opening a different business draft',()=>{
 hooks.slots.clear();const business=relayBusinessTarget(p,p.features.relay!.businesses[0]!.id)!,target={...business,kind:'period' as const,periodId:'missing-original-period'},chosen=vi.fn();let tree:unknown
 const render=()=>{tree=mounted('invalid-wrapper',()=>RelaySceneChoice({p,target,onTargetChange:chosen,onInspect:vi.fn(),children:open=><button type="button" onClick={()=>open('next-service')}>核对下一期条件</button>}))};render()
 const open=elements(tree).find(e=>e.type==='button'&&text(e)==='核对下一期条件')!;(open.props.onClick as ()=>void)();render()
 expect(elements(tree).some(e=>e.type===RelayServiceChoice)).toBe(false);expect(chosen).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(raw)
})
