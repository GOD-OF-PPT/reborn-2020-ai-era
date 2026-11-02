import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest'
import {createRef,isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import raw from '../../goal-1/evidence/t17-acceptance-40/business-entry-r447/normal94-input.json?raw'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {EquityMoment} from './EquityMoment.tsx'
import {EquitySceneChoice} from './EquitySceneChoice.tsx'
import {EquityPaper} from './EquityPaper.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {ResourceSelect} from './ResourceSelect.tsx'
import {CommandButton} from './CommandButton.tsx'
import {EquityBusinessContinuity} from './EquityBusinessContinuity.tsx'
import {equityBusinessContinuity} from './equity-business-continuity.ts'
import {equityFocusFor,equityJourneyFor} from './equity-player-thread.ts'
import {equityStageCopy} from './equity-stage-copy.ts'
import {createEquityDraftMemory} from './equity-draft.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {EquityChoiceIntent} from './equity-journey.ts'
import type {SharedActionBinding} from './shared-action.ts'

// Actual normal94, Controller/IDB and original component callbacks. Hook driving
// does not run DOM/effects and does not replace the current Chrome playtest.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0}))
vi.mock('react',async load=>{
 const actual=await load<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const values=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,values);const i=hooks.index++;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return[values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:state,useCallback:<T,>(fn:T)=>fn,useRef:<T,>(value:T)=>state(()=>({current:value}))[0],useId:()=>hooks.scope,useEffect:()=>{}}
})
type Element=ReactElement<Record<string,unknown>>
const elements=(v:unknown):Element[]=>Array.isArray(v)?v.flatMap(elements):isValidElement<Record<string,unknown>>(v)?[v,...elements(v.props.children)]:[]
const text=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(text).join(''):isValidElement<Record<string,unknown>>(v)?text(v.props.children):''
function draw<T,>(scope:string,create:()=>T):T{hooks.scope=scope;hooks.index=0;return create()}
function invoke(e:Element,name:string,...args:unknown[]){const fn=e.props[name];if(e.props.disabled||typeof fn!=='function')throw Error('ORIGINAL_ENABLED_HANDLER_REQUIRED');return fn(...args)}
async function setup(id:string,faulty=false){
 const codec=createCampaignCodec(),factory=new IDBFactory(),name='u6-business-entry-'+id,locks=new MemoryWriterAccess();let armed=false
 const fault=abortAfterHeadWrite(factory,name,()=>armed),store=new IndexedDbRunStore({codec,factory:faulty?fault.factory:factory,keyRange:IDBKeyRange,name}),controller=new GameController({codec,store,locks})
 await controller.initialize();await controller.importNew(raw)
 return{controller,store,locks,fault,arm:()=>{armed=true}}
}
let normal:Awaited<ReturnType<typeof setup>>,failed:Awaited<ReturnType<typeof setup>>,reader:GameController
const props=(controller:GameController):GamePanelProps=>{const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,b=features.deepseek!.businesses.find(b=>b.company)!;return{controller,view,features,accountId:b.accountId,request:vi.fn(),equityDraftMemory:createEquityDraftMemory()}}
const target=(p:GamePanelProps)=>{const b=p.features.deepseek!.businesses.find(b=>b.company)!;return{runId:p.view.runId,accountId:b.accountId,businessId:b.id,kind:'business' as const}}
function moment(p:GamePanelProps,scope='moment'){
 const focus=equityFocusFor(p,target(p)),callbacks={onFocus:vi.fn(),onNavigate:vi.fn(),onExplore:vi.fn()},render=()=>draw(scope,()=>EquityMoment({p,focus,headingRef:createRef<HTMLHeadingElement>(),...callbacks})),table=(tree:unknown)=>elements(tree).find(e=>e.type===RoomTableau)!
 const tree=render(),room=table(tree),primary=elements(room.props.decisions).find(e=>e.type==='button'&&String(e.props.className).includes('moment-primary'))!,paper=elements(room.props.object).find(e=>e.type===EquityPaper)!
 return{tree,room,primary,paper,render,callbacks}
}
const near=(p:GamePanelProps,intent:EquityChoiceIntent,scope='near')=>{const callbacks={onClose:vi.fn(),onChoose:vi.fn(),onIntent:vi.fn(),onInspect:vi.fn(),onToday:vi.fn()};return{tree:draw(scope,()=>EquitySceneChoice({p,target:target(p),intent,...callbacks})),callbacks}}
beforeAll(async()=>{normal=await setup('normal');failed=await setup('failed',true);reader=new GameController({codec:createCampaignCodec(),store:normal.store,locks:normal.locks});await reader.initialize();await reader.continueLife(normal.controller.snapshot.view!.runId)})
beforeEach(()=>hooks.slots.clear())
afterAll(async()=>{await reader?.close();await normal?.controller.close();await failed?.controller.close(true);await normal?.store.close();await failed?.store.close()})

it('keeps the real active business as an entry and opens its conditions instead of leading with closure',()=>{
 const p=props(normal.controller),before=normal.controller.exportSaved(),j=equityJourneyFor(p,equityFocusFor(p,target(p))),copy=equityStageCopy(p,j),continuity=equityBusinessContinuity(p,target(p).businessId)!
 expect(p.view.origin).toBe('normal');expect(p.view.revision).toBe(94);expect(p.view.budget.available).toBe(0);expect(continuity.own).toHaveLength(1);expect(continuity.elsewhere).toHaveLength(1);expect(continuity.workers).toHaveLength(2)
 expect(j).toMatchObject({phase:'business-active',active:false,decisionOpen:false,action:{kind:'choice',intent:'business'}})
 expect(copy.heading).toContain('日历');expect(copy.action).toBe('看看安排与选择');expect(copy.line).not.toContain('收尾');expect(j.finishWhen).toContain('停止仍须独立确认')
 const tail={...p,view:{...p.view,phase:'epilogue' as const}},tailCopy=equityStageCopy(tail,equityJourneyFor(tail,equityFocusFor(tail,target(tail))))
 expect(tailCopy.heading).toBe('把这份旧事收好');expect(tailCopy.action).toBe('看看原来的事项');expect(tailCopy.line).not.toContain('准备')
 expect(normal.controller.exportSaved()).toBe(before)
})

it('binds the main decision and paper to the same business page without submitting or choosing another object',()=>{
 const p=props(normal.controller),before=normal.controller.exportSaved(),ui=moment(p),binding=ui.paper.props.binding as {activate:()=>void;label:string}
 expect(text(ui.primary)).toContain('看看安排与选择');expect(binding.label).toBe('看看安排与选择');expect(ui.primary.props.onClick).toBe(binding.activate)
 const paper=draw('active-paper',()=>EquityPaper({p,journey:equityJourneyFor(p,equityFocusFor(p,target(p))),binding:ui.paper.props.binding as SharedActionBinding}));expect(text(paper)).toContain('本主体的原安排');expect(text(paper)).not.toContain('实际关系与资格准备')
 invoke(ui.primary,'onClick');const panel=elements(ui.render()).find(e=>e.type===EquitySceneChoice)!
 expect(panel.props.intent).toBe('business');expect(panel.props.target).toEqual(target(p));expect(p.request).not.toHaveBeenCalled();expect(ui.callbacks.onFocus).not.toHaveBeenCalled();expect(normal.controller.exportSaved()).toBe(before)
})

it('keeps preparation explicit and empty, and retains the full original closure scope and command',()=>{
 const p=props(normal.controller),before=normal.controller.exportSaved(),business=near(p,'business'),rows=elements(business.tree)
 expect(text(business.tree)).toContain('已有1份原安排，按原日历继续。');expect(text(business.tree)).toContain('¥4,383.88')
 invoke(rows.find(e=>e.type==='button'&&text(e).startsWith('先做一点准备'))!,'onClick');expect(business.callbacks.onIntent).toHaveBeenCalledWith('prepare')
 const preparation=near(p,'prepare','preparation').tree,resource=elements(preparation).find(e=>e.type===ResourceSelect)!,date=elements(preparation).find(e=>e.type==='input'&&e.props.type==='date')!
 expect(resource.props.value).toBe('');expect(date.props.value).toBe('');expect(text(preparation)).toContain('本季没有可用行动')
 const returned=near(p,'business','business-returned');invoke(elements(returned.tree).find(e=>e.type==='button'&&text(e).startsWith('核对保留与收尾'))!,'onClick');expect(returned.callbacks.onIntent).toHaveBeenCalledWith('next')
 const closure=near(p,'next','closure').tree,continuity=elements(closure).find(e=>e.type===EquityBusinessContinuity)!.props.value as NonNullable<ReturnType<typeof equityBusinessContinuity>>,command=elements(closure).find(e=>e.type===CommandButton&&e.props.kind==='WindDownBusiness')!
 expect(continuity.own).toHaveLength(1);expect(continuity.elsewhere).toHaveLength(1);expect(continuity.workers).toHaveLength(2);expect(command.props.payload).toEqual({businessId:target(p).businessId});expect(command.props.confirm).toBe(true)
 expect(p.request).not.toHaveBeenCalled();expect(normal.controller.exportSaved()).toBe(before)
})

it('allows original read-only inspection and keeps invalid or stale sources from gaining a command',()=>{
 const p=props(reader),before=reader.exportSaved(),ui=moment(p,'reader');expect(p.view.readOnly).toBe(true);expect(ui.primary.props.disabled).toBe(false);invoke(ui.primary,'onClick');expect(elements(ui.render()).find(e=>e.type===EquitySceneChoice)!.props.intent).toBe('business')
 const stale=moment({...p,view:{...p.view}},'stale');expect(stale.primary.props.disabled).toBe(true)
 const invalid=draw('invalid',()=>EquitySceneChoice({p,target:target(p),intent:'business',sourceInvalid:true,sourceReason:'原来源已失效。',onClose:vi.fn(),onChoose:vi.fn(),onIntent:vi.fn(),onInspect:vi.fn(),onToday:vi.fn()}))
 expect(text(invalid)).toContain('原来源已失效');expect(elements(invalid).some(e=>e.type===CommandButton)).toBe(false);expect(reader.exportSaved()).toBe(before)
})

it('retires the captured entry after a real head write abort while preserving the original save and candidate',async()=>{
 const p=props(failed.controller),ui=moment(p,'before-failure'),before=failed.controller.exportSaved();failed.arm()
 expect((await failed.controller.submit(failed.controller.prepare('FundBusiness',{businessId:target(p).businessId,amountFen:10000}))).status).toBe('unsaved');expect(failed.fault.trace).toEqual({writeSucceeded:true,abortIssued:true});expect(failed.controller.exportSaved()).toBe(before);expect(failed.controller.exportCandidate()).not.toBe(before)
 const handler=ui.primary.props.onClick as ()=>void;handler();expect(elements(ui.render()).some(e=>e.type===EquitySceneChoice)).toBe(false);expect(p.request).not.toHaveBeenCalled();expect(moment(props(failed.controller),'candidate').primary.props.disabled).toBe(true)
})
