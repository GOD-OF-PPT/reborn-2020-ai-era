import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement,type ReactNode} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec,createCampaignRun} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance,type ClockActionBinding} from './ClockAdvance.tsx'

// Real component handlers and controller/store state. Effects/DOM geometry are
// not emulated here; native Space/focus and visual acceptance remain separate.
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 return {...actual,useRef:<T,>(current:T)=>({current}),useMemo:<T,>(read:()=>T)=>read(),useEffect:()=>{}}
})
type Element=ReactElement<Record<string,unknown>>
function elements(node:unknown):Element[]{
 if(Array.isArray(node))return node.flatMap(elements)
 if(!isValidElement<Record<string,unknown>>(node))return []
 if(node.type===CommandButton)return elements(CommandButton(node.props as ComponentProps<typeof CommandButton>))
 return [node,...elements(node.props.children)]
}
function click(node:Element){expect(node.props.disabled).not.toBe(true);const activate=node.props.onClick;if(typeof activate!=='function')throw Error('ACTUAL_HANDLER_REQUIRED');activate()}
function deferred(){let resolve!:()=>void;const promise=new Promise<void>(done=>{resolve=done});return {promise,resolve}}
class HeldStore extends IndexedDbRunStore{
 readonly entered=deferred()
 readonly release=deferred()
 override async commit(...args:Parameters<IndexedDbRunStore['commit']>){this.entered.resolve();await this.release.promise;return super.commit(...args)}
}
async function fixture(name:string,{abort=false,held=false}={}){
 const codec=createCampaignCodec(),factory=new IDBFactory(),locks=new MemoryWriterAccess(),physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 const run=createCampaignRun({runId:name,actorId:'player',commandId:name+'-create',backgroundId:'technical_employee',seed:name})
 await physical.create(run)
 const fault=abort?abortAfterHeadWrite(factory,name):null,options={codec,factory:fault?.factory??factory,keyRange:IDBKeyRange,name}
 const store=held?new HeldStore(options):new IndexedDbRunStore(options)
 let sequence=0
 const controller=new GameController({codec,store,locks,id:()=>name+'-'+(++sequence)}),request=vi.fn()
 await controller.initialize();await controller.continueLife(run.runId)
 const props=():GamePanelProps=>{const view=controller.snapshot.view!;return {controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request}}
 const close=async()=>{if(store instanceof HeldStore)store.release.resolve();await controller.close(true);await store.close();await physical.close()}
 return {codec,factory,locks,physical,store,controller,request,props,fault,close}
}

// One actual serialized lifecycle, separated at durable boundaries. Setup uses
// Vitest's unchanged default hooks; each assertion stage keeps the default 5s.
describe('original command lifecycle',()=>{
 let f:Awaited<ReturnType<typeof fixture>>,binding:SharedActionBinding,raw:string,candidate:string,previousRunId:string,oldRunAction:SharedActionBinding
 const alternateRunId='shared-command-source-another'
 beforeAll(async()=>{f=await fixture('shared-command-source',{abort:true})})
 beforeAll(async()=>{await f.physical.create(createCampaignRun({runId:alternateRunId,actorId:'player',commandId:alternateRunId+'-create',backgroundId:'technical_employee',seed:alternateRunId}))})
 afterAll(async()=>{if(f)await f.close()})
 it('shares the same original request between visible controls, then blocks the real failed candidate',async()=>{
  const p=f.props(),options={kind:'StartFirstOrder',payload:{},label:'接下这笔手工单',confirm:true}
  raw=f.controller.exportSaved()
  const tree=CommandButton({...p,...options,renderAction:action=>{binding=action;return <><button type="button" onClick={action.activate} disabled={action.disabled}>主操作</button><button type="button" onClick={action.activate} disabled={action.disabled}>物件</button></>}})
  const buttons=elements(tree).filter(e=>e.type==='button')
  expect(buttons).toHaveLength(2);expect(buttons[0]!.props.onClick).toBe(buttons[1]!.props.onClick)
  click(buttons[0]!);click(buttons[1]!)
  expect(f.request.mock.calls).toEqual([[options.kind,options.payload,options.label,true],[options.kind,options.payload,options.label,true]])
  expect(f.controller.exportSaved()).toBe(raw)
  const proposed=await f.controller.submit(f.controller.prepare(options.kind,options.payload))
  expect(proposed.status).toBe('unsaved');expect(f.fault!.trace).toEqual({writeSucceeded:true,abortIssued:true})
  expect(f.controller.snapshot.view).toMatchObject({revision:1,hasCandidate:true,saveStatus:'unsaved'})
  candidate=f.controller.exportCandidate()
  f.request.mockClear();binding.activate();expect(f.request).not.toHaveBeenCalled()
  const blocked=makeSharedAction(f.props(),'只选一个方向',f.request,{allowReadOnly:true})
  expect(blocked.disabled).toBe(true);blocked.activate();expect(f.request).not.toHaveBeenCalled()
  const heldClock=elements(ClockAdvance({p:f.props(),date:'2020-01-05',label:'先处理原候选',showReason:false}))
  expect(heldClock.some(e=>e.type==='small'&&e.props.className==='reason')).toBe(false)
  for(const button of heldClock.filter(e=>e.type==='button')){expect(button.props.disabled).toBe(true);if(typeof button.props.onClick==='function')button.props.onClick()}
  expect(f.request).not.toHaveBeenCalled()
  expect(f.controller.exportSaved()).toBe(raw);expect(f.codec.export((await f.physical.load(p.view.runId))!.run)).toBe(raw)
 })
 it('saves exactly the original candidate and refuses the pre-save activation',async()=>{
  expect((await f.controller.retry()).status).toBe('saved')
  expect(f.controller.exportSaved()).toBe(candidate)
  binding.activate();expect(f.request).not.toHaveBeenCalled()
  const current=f.props(),choice=makeSharedAction(current,'选方向',f.request)
  expect(choice.disabled).toBe(false);choice.activate();expect(f.request).toHaveBeenCalledOnce();f.request.mockClear()
 })
 it('refuses a replaced snapshot even when run and revision are unchanged',async()=>{
  const current=f.props(),choice=makeSharedAction(current,'选方向',f.request)
  await f.controller.reload()
  expect(f.controller.snapshot.view?.revision).toBe(current.view.revision)
  choice.activate();expect(f.request).not.toHaveBeenCalled()
 })
 it('refuses the previous activation after the original run has closed',async()=>{
  const previous=f.props();previousRunId=previous.view.runId;oldRunAction=makeSharedAction(previous,'旧人生的选择',f.request)
  await f.controller.home()
  oldRunAction.activate();expect(f.request).not.toHaveBeenCalled()
 })
 it('continues refusing the previous activation in another actual normal run',async()=>{
  await f.controller.continueLife(alternateRunId)
  expect(f.controller.snapshot.view!.runId).not.toBe(previousRunId)
  oldRunAction.activate();expect(f.request).not.toHaveBeenCalled()
 })
})

describe('readonly choices and an actual pending write',()=>{
 let f:Awaited<ReturnType<typeof fixture>>,readerStore:IndexedDbRunStore,reader:GameController
 let pending:ReturnType<GameController['submit']>|null=null
 beforeAll(async()=>{f=await fixture('shared-action-held',{held:true})})
 beforeAll(async()=>{readerStore=new IndexedDbRunStore({codec:f.codec,factory:f.factory,keyRange:IDBKeyRange,name:'shared-action-held'});reader=new GameController({codec:f.codec,store:readerStore,locks:f.locks});await reader.initialize();await reader.continueLife(f.controller.snapshot.view!.runId)})
 afterAll(async()=>{if(f){(f.store as HeldStore).release.resolve();if(pending)await pending;if(reader)await reader.close(true);if(readerStore)await readerStore.close();await f.close()}})
 it('allows explicit stable readonly UI choices without permitting a command',()=>{
  const view=reader.snapshot.view!,p={controller:reader,view},choose=vi.fn()
  expect(view.readOnly).toBe(true)
  const command=makeSharedAction(p,'执行',choose),reading=makeSharedAction(p,'只选UI方向',choose,{allowReadOnly:true})
  expect(command.disabled).toBe(true);command.activate();expect(choose).not.toHaveBeenCalled()
  expect(reading.disabled).toBe(false);reading.activate();expect(choose).toHaveBeenCalledOnce()
 })
 it('can consolidate repeated readonly reasons in the room without enabling either clock button, while the default keeps local reasons',()=>{
  const view=reader.snapshot.view!,request=vi.fn(),p:GamePanelProps={controller:reader,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request}
  const options={p,date:'2020-01-05',label:'原日期仍待推进'}
  const local=elements(ClockAdvance(options)),room=elements(ClockAdvance({...options,showReason:false}))
  expect(local.some(e=>e.type==='small'&&e.props.className==='reason')).toBe(true)
  expect(room.some(e=>e.type==='small'&&e.props.className==='reason')).toBe(false)
  const buttons=room.filter(e=>e.type==='button');expect(buttons).toHaveLength(2)
  for(const button of buttons){expect(button.props.disabled).toBe(true);if(typeof button.props.onClick==='function')button.props.onClick()}
  expect(request).not.toHaveBeenCalled()
 })
 it('blocks both old and newly rendered activations while the original save is genuinely in flight',async()=>{
  const original=f.props(),old=makeSharedAction(original,'旧按钮',f.request)
  pending=f.controller.submit(f.controller.prepare('SetPrivateNote',{text:'one actual held save'}))
  await (f.store as HeldStore).entered.promise
  expect(f.controller.snapshot.view?.saveStatus).toBe('saving')
  old.activate();expect(f.request).not.toHaveBeenCalled()
  const during=makeSharedAction(f.props(),'仍在保存',f.request,{allowReadOnly:true})
  expect(during.disabled).toBe(true);expect(during.reason).toContain('正在保存');during.activate();expect(f.request).not.toHaveBeenCalled()
  ;(f.store as HeldStore).release.resolve();expect((await pending).status).toBe('saved');pending=null
 })
})

describe('original clock presentation and shared activation',()=>{
 let f:Awaited<ReturnType<typeof fixture>>,binding:ClockActionBinding,fallback:ClockActionBinding
 const date='2020-01-05',label='等这份手工单开工'
 beforeAll(async()=>{f=await fixture('shared-clock-original')})
 beforeAll(async()=>{expect((await f.controller.submit(f.controller.prepare('StartFirstOrder',{}))).status).toBe('saved')})
 afterAll(async()=>{if(f)await f.close()})
 it('keeps the default controls and direct-child bridge with the same activation and original expense/review contract',()=>{
  const p=f.props(),raw=f.controller.exportSaved()
  const clock=vi.spyOn(f.controller,'clockCommitments')
  const normal=ClockAdvance({p,date,label,room:true}),defaultElements=elements(normal)
  expect(isValidElement<Record<string,unknown>>(normal)&&normal.props.className).toBe('clock-advance clock-advance-room')
  expect(defaultElements.filter(e=>e.type==='button')).toHaveLength(2)
  expect(defaultElements.some(e=>e.type==='div'&&e.props.className==='command clock-main')).toBe(true)
  expect(defaultElements.some(e=>e.type==='div'&&e.props.className==='command clock-review')).toBe(true)
  const wrapped=ClockAdvance({p,date,label,renderAction:action=>{binding=action;return <section className="opening-room"><section>{action.reviewNode}{action.mainNode}</section><button type="button" className="opening-object" onClick={action.activate} disabled={action.disabled}>物件</button></section>}})
  expect(isValidElement(wrapped)&&wrapped.type).toBe(CommandButton)
  const room=CommandButton((wrapped as ReactElement<ComponentProps<typeof CommandButton>>).props) as Element
  expect(room.type).toBe('section');expect(room.props.className).toBe('opening-room')
  const direct=Array.isArray(room.props.children)?room.props.children:[]
  expect(direct.some(e=>isValidElement<Record<string,unknown>>(e)&&e.props.className==='opening-object')).toBe(true)
  const all=elements(room),main=all.find(e=>e.type==='div'&&e.props.className==='command clock-main')!,mainButton=elements(main.props.children).find(e=>e.type==='button')!,object=all.find(e=>e.type==='button'&&e.props.className==='opening-object')!,review=all.find(e=>e.type==='div'&&e.props.className==='command clock-review')!
  expect(binding.caption).toContain('个人已知待付');expect(binding.caption).toContain('500')
  expect(mainButton.props.onClick).toBe(object.props.onClick)
  click(object);expect(f.request.mock.calls.at(-1)).toEqual(['AdvanceTime',{date},binding.label,false])
  click(elements(review.props.children).find(e=>e.type==='button')!)
  expect(f.request.mock.calls.at(-1)).toEqual(['AdvanceTime',{date},'核对后推进 · '+date,true])
  expect(f.controller.exportSaved()).toBe(raw)
  const originalProjection=clock.mock.results.at(-1)!
  if(originalProjection.type!=='return')throw Error('ORIGINAL_CLOCK_PROJECTION_REQUIRED')
  clock.mockReturnValue({...originalProjection.value,sourceRevision:p.view.revision-1})
  const rejectedProjection=ClockAdvance({p,date,label,renderAction:action=>{fallback=action;return action.mainNode as ReactNode}})
  elements(rejectedProjection)
  expect(fallback.caption).toBe('原支出待核对');fallback.activate()
  expect(f.request.mock.calls.at(-1)).toEqual(['AdvanceTime',{date},fallback.label,true])
  clock.mockRestore()
 })
 it('refuses the previous clock bindings after a real original advance has committed',async()=>{
  expect((await f.controller.submit(f.controller.prepare('AdvanceTime',{date}))).status).toBe('saved')
  f.request.mockClear();binding.activate();fallback.activate();expect(f.request).not.toHaveBeenCalled()
 })
})
