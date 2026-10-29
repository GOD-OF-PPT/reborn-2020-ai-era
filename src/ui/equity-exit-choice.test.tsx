import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import quoteRaw from '../../goal-1/evidence/t16-epilogue/native-exit-prefix/normal-before-exit-accept.json?raw'
import dueRaw from '../../goal-1/evidence/t17-acceptance-40/equity-exit-r213/normal144-before-collection.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {EquitySceneChoice} from './EquitySceneChoice.tsx'
import {CommandButton,type CommandActionContext} from './CommandButton.tsx'
import {createEquityDraftMemory} from './equity-draft.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'

// Original normal142/144 and the actual component/Controller callbacks.
// This hook surface is not DOM, Chrome, a new normal strategy or human QA.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const values=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,values);const i=hooks.index++;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return[values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(value:T)=>state(()=>({current:value}))[0],useId:()=>hooks.scope,useEffect:()=>{}}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(v:unknown):Element[]=>Array.isArray(v)?v.flatMap(elements):isValidElement<Record<string,unknown>>(v)?[v,...elements(v.props.children)]:[]
const text=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(text).join(''):isValidElement<Record<string,unknown>>(v)?text(v.props.children):''
function draw<T,>(scope:string,fn:()=>T):T{hooks.scope=scope;hooks.index=0;return fn()}
function invoke(e:Element,name:string,...args:unknown[]){const fn=e.props[name];if(e.props.disabled||typeof fn!=='function')throw Error('ACTUAL_ENABLED_CALLBACK_REQUIRED');return fn(...args)}
async function open(id:string,raw:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-exit-choice-'+id}),controller=new GameController({codec,store,locks:new MemoryWriterAccess()})
 await controller.initialize();await controller.importNew(raw)
 return{controller,store,p:():GamePanelProps=>{const view=controller.snapshot.view!;return{controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),equityDraftMemory:createEquityDraftMemory()}},close:async()=>{await controller.close();await store.close()}}
}
let quote:Awaited<ReturnType<typeof open>>,due:Awaited<ReturnType<typeof open>>
beforeAll(async()=>{quote=await open('quote',quoteRaw);due=await open('due',dueRaw)})
afterAll(async()=>{await quote?.close();await due?.close()})
beforeEach(()=>hooks.slots.clear())
function near(p:GamePanelProps,intent:'exit-accept'|'collect'){
 const e=p.features.deepseek!.exits.find(e=>intent==='collect'?e.receivable!==null&&e.receivable.remainingFen>0:e.buyerWilling===true&&!e.quoteExpired&&e.operationId===null)!,a=p.features.deepseek!.agreements.find(a=>a.id===e.agreementId)!,target:EquitySceneTarget={runId:p.view.runId,accountId:a.accountId,businessId:a.businessId,kind:'exit',recordId:e.id},callbacks={onClose:vi.fn(),onChoose:vi.fn(),onIntent:vi.fn(),onInspect:vi.fn(),onToday:vi.fn()}
 let tree=draw('near-'+intent,()=>EquitySceneChoice({p,target,intent,...callbacks}))
 const render=()=>{tree=draw('near-'+intent,()=>EquitySceneChoice({p,target,intent,...callbacks}));return tree}
 const edit=(value:string)=>{const field=elements(tree).find(e=>e.type==='input')!;invoke(field,'onChange',{currentTarget:{value}});render()}
 const command=()=>elements(tree).find(e=>e.type===CommandButton&&e.props.kind===(intent==='collect'?'CollectEquityExit':'AcceptEquityExit'))!
 const action=()=>Reflect.apply(CommandButton,undefined,[command().props])
 const pay=()=>elements(action()).find(e=>e.type==='button')!
 return{e,tree:()=>tree,render,edit,command,action,pay,callbacks}
}

it('exposes the same original display command and preview to a renderer without preparing or submitting a second command',()=>{
 const p=quote.p(),e=p.features.deepseek!.exits.find(e=>e.buyerWilling===true&&e.operationId===null&&!e.quoteExpired)!,spy=vi.spyOn(p.controller,'preview'),prepare=vi.spyOn(p.controller,'prepare'),submit=vi.spyOn(p.controller,'submit');const contexts:CommandActionContext[]=[]
 const tree=CommandButton({...p,kind:'AcceptEquityExit',payload:{exitId:e.id,shares:1000},label:'原转让',confirm:true,renderAction:(_binding,node,context)=>{contexts.push(context);return node}})
 const captured=contexts[0]!;expect(captured).toBeDefined();expect(captured.command).toMatchObject({runId:p.view.runId,expectedRevision:p.view.revision,kind:'AcceptEquityExit',payload:{exitId:e.id,shares:1000}});expect(captured.preview).toBe(spy.mock.results[0]!.value);expect(captured.preview.privateSale).toMatchObject({grossFen:711000,feeFen:21330,netReceivableFen:689670})
 expect(prepare).not.toHaveBeenCalled();expect(submit).not.toHaveBeenCalled();invoke(elements(tree).find(e=>e.type==='button')!,'onClick');expect(p.request).toHaveBeenCalledWith('AcceptEquityExit',{exitId:e.id,shares:1000},'原转让',true)
})
it('keeps the blank transfer disabled and shows original net credit, cumulative fee and due date after an explicit share choice',()=>{
 const p=quote.p(),before=quote.controller.exportSaved(),ui=near(p,'exit-accept');expect(ui.pay().props.disabled).toBe(true)
 ui.edit('1000');expect(ui.pay().props.disabled).toBe(false);const actual=text(ui.action())
 for(const value of ['净应收 ¥6,896.70','2027-07-15','总价¥7,110','转让费¥213.30','余1500股','现在不增加现金'])expect(actual).toContain(value)
 invoke(ui.pay(),'onClick');expect(p.request).toHaveBeenCalledWith('AcceptEquityExit',{exitId:ui.e.id,shares:1000},expect.any(String),true);expect(quote.controller.exportSaved()).toBe(before)
})
it('keeps invalid or overlarge shares on the original refusal and permits a UI-only choice to retain the holding',()=>{
 const p=quote.p(),before=quote.controller.exportSaved(),ui=near(p,'exit-accept');ui.edit('99999999');expect(ui.pay().props.disabled).toBe(true);expect(text(ui.action())).not.toContain('净应收 ')
 const keep=elements(ui.tree()).find(e=>e.type==='button'&&text(e).startsWith('先保留股份'))!;invoke(keep,'onClick');expect(ui.callbacks.onToday).toHaveBeenCalledOnce();expect(p.request).not.toHaveBeenCalled();expect(quote.controller.exportSaved()).toBe(before)
})
it('fills only the same original unpaid balance, keeps partial collection explicit and returns without collecting automatically',()=>{
 const p=due.p(),before=due.controller.exportSaved(),ui=near(p,'collect');expect(ui.pay().props.disabled).toBe(true)
 const fill=elements(ui.tree()).find(e=>e.type==='button'&&text(e).startsWith('填入余款'))!;invoke(fill,'onClick');ui.render();expect(ui.pay().props.disabled).toBe(false);expect((ui.command().props.payload as {amountFen:number}).amountFen).toBe(689670);expect(p.request).not.toHaveBeenCalled()
 ui.edit('3448.35');invoke(ui.pay(),'onClick');expect(p.request).toHaveBeenCalledWith('CollectEquityExit',{exitId:ui.e.id,amountFen:344835},expect.any(String),true);expect(due.controller.exportSaved()).toBe(before)
})

it('opens the same original business conditions from next without reselecting the subject or issuing a commitment',()=>{
 const p=quote.p(),before=quote.controller.exportSaved(),e=p.features.deepseek!.exits.find(e=>e.buyerWilling===true&&e.operationId===null&&!e.quoteExpired)!,a=p.features.deepseek!.agreements.find(a=>a.id===e.agreementId)!,target:EquitySceneTarget={runId:p.view.runId,accountId:a.accountId,businessId:a.businessId,kind:'exit',recordId:e.id},onIntent=vi.fn(),onChoose=vi.fn();
 const tree=draw('original-next-conditions',()=>EquitySceneChoice({p,target,intent:'next',onClose:vi.fn(),onChoose,onIntent,onInspect:vi.fn(),onToday:vi.fn()})),read=elements(tree).find(e=>e.type==='button'&&text(e).startsWith('回看同一主体的原条件和记录'))!;invoke(read,'onClick');expect(onIntent).toHaveBeenCalledWith('business');expect(onChoose).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled();expect(quote.controller.exportSaved()).toBe(before);
})
