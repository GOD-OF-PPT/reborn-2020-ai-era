import {afterAll,beforeAll,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {EcosystemMoment} from './EcosystemMoment.tsx'
import {EcosystemSceneChoice} from './EcosystemSceneChoice.tsx'
import {EcosystemPaper} from './EcosystemPaper.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {CommandButton} from './CommandButton.tsx'
import {createEcosystemDraftMemory} from './ecosystem-draft.ts'
import {ecosystemFocusFor} from './ecosystem-player-thread.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {EcosystemSceneTarget} from './ecosystem-scene-target.ts'
import actual115 from '../../goal-1/evidence/t17-acceptance-37/chrome-main-r7/r7-22-new115-quote-actually-effective-no-cash-ap-change.json?raw'

// Execute original React consumer handlers and original controller previews.
// This test does not render a browser, inspect geometry or replace Native play.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),current:[] as unknown[],index:0}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++,values=hooks.current;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useId:()=> 'ecology-test-choice',useEffect:()=>{},useCallback:<T,>(callback:T)=>callback}
})
function mounted<T>(key:string,render:()=>T):T{const old=hooks.current,index=hooks.index;hooks.current=hooks.slots.get(key)??[];hooks.slots.set(key,hooks.current);hooks.index=0;try{return render()}finally{hooks.current=old;hooks.index=index}}
type Element=ReactElement<Record<string,unknown>>
function nodes(value:unknown):Element[]{
 if(Array.isArray(value))return value.flatMap(nodes)
 if(!isValidElement<Record<string,unknown>>(value))return []
 const found=[value,...['children','footer','heading','context','facts','decisions','object','record'].flatMap(key=>nodes(value.props[key]))]
 if(value.type===EcosystemSceneChoice||value.type===CommandButton||value.type===EcosystemPaper){const component=value.type as (p:Record<string,unknown>)=>unknown;found.push(...nodes(mounted(component.name,()=>component(value.props))))}
 return found
}
const words=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(words).join(''):isValidElement<Record<string,unknown>>(value)?words(value.props.children):''
let controller:GameController,store:IndexedDbRunStore,p:GamePanelProps,entry:GamePanelProps,business:EcosystemSceneTarget,raw:string
let closedController:GameController,closedStore:IndexedDbRunStore,closedProps:GamePanelProps,closedRaw:string
beforeAll(async()=>{
 const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u5-original-handler-consumer'})
 controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(actual115)
 const props=():GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),ecosystemDraftMemory:createEcosystemDraftMemory()}}
 entry=props();expect((await controller.submit(controller.prepare('OpenEcosystemService',{capitalFen:3000000}))).status).toBe('saved')
 p=props();const b=p.features.deepseek!.businesses.find(b=>b.definitionId==='ecosystem-service')!;business={kind:'business',runId:p.view.runId,businessId:b.id,accountId:b.accountId};p={...p,accountId:b.accountId};raw=controller.exportSaved()
})
beforeAll(async()=>{
 const codec=createCampaignCodec();closedStore=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'u6-closed-ecology-consumer'})
 closedController=new GameController({codec,store:closedStore,locks:new MemoryWriterAccess()});await closedController.initialize();await closedController.importNew(raw)
})
beforeAll(async()=>{expect((await closedController.submit(closedController.prepare('WindDownBusiness',{businessId:business.businessId}))).status).toBe('saved')})
beforeAll(async()=>{
 expect((await closedController.submit(closedController.prepare('CloseBusiness',{businessId:business.businessId}))).status).toBe('saved')
 const view=closedController.snapshot.view!;closedProps={...p,controller:closedController,view,features:view.features as unknown as PlayFeatures,request:vi.fn(),ecosystemDraftMemory:createEcosystemDraftMemory()};closedRaw=closedController.exportSaved()
})
afterAll(async()=>{await closedController?.close();await closedStore?.close();await controller?.close();await store?.close()})

it('gives the main thought and foreground paper the same direct preparation action without a duplicate summary modal',()=>{
 hooks.slots.clear();const focus=ecosystemFocusFor(p,business),props={p,focus,headingRef:{current:null},onFocus:vi.fn(),onNavigate:vi.fn(),onExplore:vi.fn()};let tree:unknown
 const render=()=>{tree=mounted('moment',()=>EcosystemMoment(props))};render()
 const rows=nodes(tree),paper=rows.find(n=>n.type===EcosystemPaper)!,binding=paper.props.binding as {activate:()=>void},main=rows.find(n=>n.type==='button'&&n.props.onClick===binding.activate)!
 expect(main).toBeDefined();expect(words(main)).toContain('准备这次服务的材料')
 binding.activate();render();expect(nodes(tree).some(n=>n.type===EcosystemSceneChoice&&n.props.intent==='materials')).toBe(true)
 expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(raw)
})

it('keeps explicit date/resource fields and original payload through cancellation and original-book reading',()=>{
 hooks.slots.clear();const closed=vi.fn(),inspect=vi.fn(),props={p,target:business,intent:'materials' as const,onClose:closed,onChoose:vi.fn(),onInspect:inspect,onToday:vi.fn()};let tree:unknown
 const render=()=>{tree=mounted('materials',()=>EcosystemSceneChoice(props))};render()
 const change=(type:'input'|'select',value:string)=>{const row=nodes(tree).find(n=>n.type===type&&(type==='select'||n.props.type==='date'))!;(row.props.onChange as (e:unknown)=>void)({target:{value}});render()}
 const draftKey=()=>[...p.ecosystemDraftMemory!.keys()].find(k=>k.includes('materials'))!
 expect(nodes(tree).find(n=>n.type==='input'&&n.props.type==='date')!.props.value).toBe('')
 // ResourceSelect is an original child component. Its controlled callback receives the original resource ID.
 const resource=nodes(tree).find(n=>typeof n.type==='function'&&n.type.name==='ResourceSelect')!;(resource.props.onChange as (v:string)=>void)('player-production');render();change('input','2025-04-10')
 const cmd=nodes(tree).find(n=>n.type===CommandButton&&n.props.kind==='StartEcosystemPreparation')!
 expect(cmd.props.payload).toEqual({businessId:business.businessId,preparation:'materials',resources:['player-production'],startAt:'2025-04-10'});expect(cmd.props.confirm).toBe(true)
 expect(controller.preview(controller.prepare('StartEcosystemPreparation',cmd.props.payload)).allowed).toBe(true)
 const cancel=nodes(tree).find(n=>n.type==='button'&&words(n).includes('先不决定'))!;(cancel.props.onClick as ()=>void)();render()
 expect(p.ecosystemDraftMemory!.get(draftKey())).toMatchObject({resource:'player-production',date:'2025-04-10'})
 const read=nodes(tree).find(n=>n.type==='button'&&words(n).includes('全部原记录'))!;(read.props.onClick as ()=>void)();expect(inspect).toHaveBeenCalledOnce();render()
 expect(nodes(tree).find(n=>n.type==='input'&&n.props.type==='date')!.props.value).toBe('2025-04-10');expect(p.request).not.toHaveBeenCalled();expect(controller.exportSaved()).toBe(raw)
})

it('only previews an object radio until the player explicitly places that same original record in view',()=>{
 hooks.slots.clear();const chosen=vi.fn(),props={p,target:business,intent:'objects' as const,onClose:vi.fn(),onChoose:chosen,onInspect:vi.fn(),onToday:vi.fn()};let tree:unknown
 const render=()=>{tree=mounted('objects',()=>EcosystemSceneChoice(props))};render()
 const radio=nodes(tree).find(n=>n.type==='input'&&n.props.type==='radio')!;expect(radio.props.checked).toBe(false)
 ;(radio.props.onChange as ()=>void)();render();expect(chosen).not.toHaveBeenCalled()
 const confirm=nodes(tree).find(n=>n.type==='button'&&words(n).includes('把这份原对象放到眼前'))!;(confirm.props.onClick as ()=>void)();expect(chosen).toHaveBeenCalledWith(business)
 expect(controller.exportSaved()).toBe(raw)
})

it('claims the explicitly chosen ecology object before original confirmation, without submitting a game command itself',()=>{
 hooks.slots.clear();const events:string[]=[],choose=vi.fn(()=>events.push('focus')),request=vi.fn<GamePanelProps['request']>(()=>events.push('request')),current={...p,request,ecosystemDraftMemory:createEcosystemDraftMemory()},props={p:current,target:business,intent:'materials' as const,onClose:vi.fn(),onChoose:choose,onInspect:vi.fn(),onToday:vi.fn()};let tree:unknown
 const render=()=>{tree=mounted('claim-confirmation',()=>EcosystemSceneChoice(props))};render()
 const resource=nodes(tree).find(n=>typeof n.type==='function'&&n.type.name==='ResourceSelect')!;(resource.props.onChange as (v:string)=>void)('player-production');render()
 const date=nodes(tree).find(n=>n.type==='input'&&n.props.type==='date')!;(date.props.onChange as (e:unknown)=>void)({target:{value:'2025-04-10'}});render()
 const cmd=nodes(tree).find(n=>n.type===CommandButton&&n.props.kind==='StartEcosystemPreparation')!,button=nodes(cmd).find(n=>n.type==='button')!;expect(button.props.disabled).toBe(false);(button.props.onClick as ()=>void)()
 expect(events).toEqual(['focus','request']);expect(choose).toHaveBeenCalledWith(business);expect(request).toHaveBeenCalledWith('StartEcosystemPreparation',{businessId:business.businessId,preparation:'materials',resources:['player-production'],startAt:'2025-04-10'},expect.any(String),true)
 expect(controller.exportSaved()).toBe(raw)
})

it('retains old business facts in a candidate or a stale source and rejects both thought and paper activation',()=>{
 hooks.slots.clear();const focus=ecosystemFocusFor(p,business),choose=vi.fn()
 for(const source of [{...p,view:{...p.view,hasCandidate:true,saveStatus:'unsaved' as const}},{...p,view:{...p.view}}]){
  const tree=mounted('protected',()=>EcosystemMoment({p:source,focus,headingRef:{current:null},onFocus:choose,onNavigate:vi.fn(),onExplore:vi.fn()})),paper=nodes(tree).find(n=>n.type===EcosystemPaper)!,binding=paper.props.binding as {disabled:boolean;activate:()=>void}
  expect(binding.disabled).toBe(true);binding.activate();expect(choose).not.toHaveBeenCalled()
 }
 expect(controller.exportSaved()).toBe(raw);expect(entry.features.deepseek!.businesses.some(b=>b.definitionId==='ecosystem-service')).toBe(false)
})

it('keeps generic restore status by the record entry while preserving a rich real-result node in the story',()=>{
 hooks.slots.clear();const focus=ecosystemFocusFor(p,business),props={p,focus,headingRef:{current:null},onFocus:vi.fn(),onNavigate:vi.fn(),onExplore:vi.fn()}
 const restored=mounted('restore-kind',()=>EcosystemMoment({...props,feedback:'已从本机存档继续。'})),tableau=nodes(restored).find(n=>n.type===RoomTableau)!
 expect(tableau.props.feedback).toBeNull();expect(words(tableau.props.record)).toContain('已从本机存档继续。')
 const actual=<p>这份原结果的现金与日期仍在这里。</p>,result=mounted('actual-result-kind',()=>EcosystemMoment({...props,feedback:actual}))
 expect(nodes(result).find(n=>n.type===RoomTableau)!.props.feedback).toBe(actual)
})

it('takes an actually closed ecology business straight back to today and makes other records an explicit reading choice',()=>{
 hooks.slots.clear();const focus=ecosystemFocusFor(closedProps,business),today=vi.fn(),chosen=vi.fn(),navigate=vi.fn(),props={p:closedProps,focus,headingRef:{current:null},onFocus:chosen,onNavigate:navigate,onExplore:vi.fn(),onToday:today};let tree:unknown
 const render=()=>{tree=mounted('closed-ecology',()=>EcosystemMoment(props))};render()
 const rows=nodes(tree),paper=rows.find(n=>n.type===EcosystemPaper)!,journey=paper.props.journey as {phase:string;action:{kind:string}},binding=paper.props.binding as {activate:()=>void},main=rows.find(n=>n.type==='button'&&n.props.onClick===binding.activate)!
 expect(journey).toMatchObject({phase:'business-closed',action:{kind:'today'}});expect(main).toBeDefined()
 ;(main.props.onClick as ()=>void)();render();expect(today).toHaveBeenCalledOnce();expect(chosen).not.toHaveBeenCalled();expect(nodes(tree).some(n=>n.type===EcosystemSceneChoice)).toBe(false)
 const other=nodes(tree).find(n=>n.type==='button'&&words(n).includes('翻看其它合作记录'))!;expect(other).toBeDefined();(other.props.onClick as ()=>void)();render()
 expect(nodes(tree).some(n=>n.type===EcosystemSceneChoice&&n.props.intent==='objects')).toBe(true);expect(chosen).not.toHaveBeenCalled()
 const read=nodes(tree).find(n=>n.type==='button'&&words(n)==='翻阅同一份合作与原账 ↗')!;expect(read).toBeDefined();(read.props.onClick as ()=>void)()
 expect(navigate).toHaveBeenCalledWith('deepseek',expect.objectContaining({accountId:business.accountId,ecosystemTarget:business,recordId:business.businessId,openRecord:true}))
 expect(closedProps.request).not.toHaveBeenCalled();expect(closedController.exportSaved()).toBe(closedRaw);expect(controller.exportSaved()).toBe(raw)
})
