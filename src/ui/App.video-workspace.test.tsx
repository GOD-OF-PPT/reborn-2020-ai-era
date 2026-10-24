import {expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import type {PlayFeatures} from './game-types.ts'
import type {VideoSceneTarget} from './video-scene-progress.ts'
import {openingFocusFor} from './player-thread.ts'
import {seasonFocusPreferenceKey,type SeasonFocusPreferenceStorage} from './season-focus-preference.ts'
import App from './App.tsx'
import {CinematicRoom} from './CinematicRoom.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {Dialog} from './Dialog.tsx'

// Call actual App handlers, controller commands and IDB. React effects/DOM and
// native locks are deliberately outside this isolated handler evidence.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{
  const index=hooks.index++,values=hooks.values
  if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial
  return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const
 }
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useSyncExternalStore:<T,>(_subscribe:unknown,getSnapshot:()=>T)=>getSnapshot(),useMemo:<T,>(create:()=>T,deps:readonly unknown[])=>{
  const index=hooks.index++,previous=hooks.values[index] as {deps:readonly unknown[];value:T}|undefined
  if(!previous||previous.deps.length!==deps.length||deps.some((value,i)=>!Object.is(value,previous.deps[i])))hooks.values[index]={deps:[...deps],value:create()}
  return (hooks.values[index] as {value:T}).value
 }}
})
function deferred(){let resolve!:()=>void;const promise=new Promise<void>(done=>{resolve=done});return {promise,resolve}}
type Element=ReactElement<Record<string,unknown>>
function elements(value:unknown):Element[]{
 if(Array.isArray(value))return value.flatMap(elements)
 return isValidElement<Record<string,unknown>>(value)?[value,...elements(value.props.children),...elements(value.props.footer)]:[]
}
function text(value:unknown):string{
 if(typeof value==='string'||typeof value==='number')return String(value)
 if(Array.isArray(value))return value.map(text).join('')
 return isValidElement<Record<string,unknown>>(value)?text(value.props.children):''
}
function fire(element:Element,event:'onClick'|'onChange',value?:string){
 const action=element.props[event];if(typeof action!=='function')throw Error('REAL_APP_HANDLER_REQUIRED')
 if(element.props.disabled)throw Error('REAL_APP_HANDLER_DISABLED')
 if(event==='onChange')action({target:{value}});else action()
}
async function fixture(name:string,abort=false){
 const codec=createCampaignCodec(),factory=new IDBFactory(),locks=new MemoryWriterAccess(),physical=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 let sequence=0;const bootstrap=new GameController({codec,store:physical,locks,id:()=>name+'-setup-'+(++sequence)})
 await bootstrap.initialize();await bootstrap.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:name})
 for(const [kind,payload]of [
  ['OpenVideoChannel',{name:'原账号A',segment:'local_merchants'}],
  ['OpenVideoChannel',{name:'后来看的账号B',segment:'ai_learners'}],
  ['DiscoverBusiness',{definitionId:'course-studio'}],
 ] as const)expect((await bootstrap.submit(bootstrap.prepare(kind,payload))).status).toBe('saved')
 const raw=bootstrap.exportSaved(),original=bootstrap.snapshot.view!,features=original.features as unknown as PlayFeatures
 expect(original.origin).toBe('normal')
 const channelA=features.video!.channels.find(c=>c.name==='原账号A')!,channelB=features.video!.channels.find(c=>c.name==='后来看的账号B')!,company=original.operations!.businesses.find(b=>b.definitionId==='course-studio')!
 expect(company).toMatchObject({company:true,lifecycle:'discovered'});expect(company.accountId).not.toBe('personal')
 // This real discovery creates an account, not earned course access, capital or income.
 expect(original.accounts.find(a=>a.accountId===company.accountId)!.cashFen).toBe(0)
 await bootstrap.close()
 const fault=abort?abortAfterHeadWrite(factory,name):null,store=new IndexedDbRunStore({codec,factory:fault?.factory??factory,keyRange:IDBKeyRange,name})
 const controller=new GameController({codec,store,locks,id:()=>name+'-command-'+(++sequence)})
 await controller.initialize();await controller.continueLife(original.runId)
 const view=controller.snapshot.view!,targetA:VideoSceneTarget={channelId:channelA.id},targetB:VideoSceneTarget={channelId:channelB.id}
 const focus=openingFocusFor({view,features:view.features as unknown as PlayFeatures},'video',{accountId:channelA.accountId,videoTarget:targetA})!
 const preferences=new Map([[seasonFocusPreferenceKey(view.runId),JSON.stringify({version:1,runId:view.runId,quarter:features.workbench.quarter,focus})]])
 const storage:SeasonFocusPreferenceStorage={getItem:key=>preferences.get(key)??null,setItem:(key,value)=>{preferences.set(key,value)}}
 const settled=deferred(),release=deferred(),realSubmit=controller.submit.bind(controller)
 // The original save/failure completes. Only delivery of its real result to App is held.
 const submit=vi.spyOn(controller,'submit').mockImplementation(async command=>{const result=await realSubmit(command);settled.resolve();await release.promise;return result}),retry=vi.spyOn(controller,'retry')
 const finish=async()=>{release.resolve();const call=submit.mock.results.at(-1);if(call?.type!=='return')throw Error('REAL_SUBMIT_PROMISE_REQUIRED');const result=await call.value;await Promise.resolve();await Promise.resolve();return result}
 const finishRetry=async()=>{const call=retry.mock.results.at(-1);if(call?.type!=='return')throw Error('REAL_RETRY_PROMISE_REQUIRED');const result=await call.value;await Promise.resolve();await Promise.resolve();return result}
 const close=async()=>{release.resolve();const call=submit.mock.results.at(-1);if(call?.type==='return')await call.value;await controller.close(true);await physical.close()}
 return {codec,physical,controller,view,storage,preferences,targetA,targetB,company,settled,submit,retry,fault,raw,finish,finishRetry,close}
}
type Fixture=Awaited<ReturnType<typeof fixture>>
const readPin=(f:Fixture):VideoSceneTarget=>JSON.parse(f.preferences.get(seasonFocusPreferenceKey(f.view.runId))!).focus.videoTarget
function driver(f:Fixture){
 hooks.values=[];let tree:ReturnType<typeof App>
 const render=()=>{hooks.index=0;tree=App({controller:f.controller,focusPreferenceStorage:f.storage})}
 const component=<T,>(type:unknown):T=>{const element=elements(tree).find(e=>e.type===type);if(!element)throw Error('PUBLIC_APP_COMPONENT_REQUIRED');return element.props as T}
 const scene=()=>component<ComponentProps<typeof NarrativeScene>>(NarrativeScene)
 const book=()=>elements(tree).find(e=>e.type===Dialog&&e.props.className==='scene-workspace workspace-video')
 const click=(label:string)=>{const element=elements(tree).find(e=>e.type==='button'&&text(e).includes(label));if(!element)throw Error('VISIBLE_APP_BUTTON_REQUIRED:'+label);fire(element,'onClick');render()}
 const openBook=(target=f.targetA)=>{
  const request={openRecord:true,accountId:'personal',videoTarget:target}
  if(elements(tree).some(e=>e.type===CinematicRoom))component<ComponentProps<typeof CinematicRoom>>(CinematicRoom).onNavigate('video',request)
  else scene().onOpen('video',request)
  render()
 }
 render();openBook()
 return {render,scene,book,click,openBook,
  async start(){scene().request('StartVideoWork',{channelId:f.targetA.channelId,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-05'},'原账号A的真实制作',true);render();click('就这样决定');await f.settled.promise;render()},
  closeConfirmation(){click('返回调整')},
  changeAccount(accountId:string){const label=elements(tree).find(e=>e.type==='label'&&e.props.className==='scene-sheet-account'),select=label&&elements(label).find(e=>e.type==='select');if(!select)throw Error('VISIBLE_ACCOUNT_SELECT_REQUIRED');fire(select,'onChange',accountId);render()},
  selectTarget(target:VideoSceneTarget){const onSelect=scene().onVideoTargetChange;if(!onSelect)throw Error('PUBLIC_VIDEO_SELECTION_REQUIRED');onSelect(target);render()},
  closeBook(){const current=book();if(!current||typeof current.props.onClose!=='function')throw Error('OPEN_ORIGINAL_BOOK_REQUIRED');current.props.onClose();render()},
 }
}

it('publishes a real same-workspace video save to its actual new work and closes only its own original book',async()=>{
 const f=await fixture('u3-video-workspace-same')
 try{
  const ui=driver(f);await ui.start()
  expect(f.controller.snapshot.view!.revision).toBe(f.view.revision+1)
  const committed=f.controller.exportSaved();expect(committed).not.toBe(f.raw)
  expect((await f.finish()).status).toBe('saved');ui.render()
  const work=(f.controller.snapshot.view!.features as unknown as PlayFeatures).video!.works[0]!
  expect(ui.scene().videoTarget).toEqual({channelId:f.targetA.channelId,workId:work.id})
  expect(readPin(f)).toEqual(ui.scene().videoTarget)
  expect(ui.scene().accountId).toBe('personal');expect(ui.book()).toBeUndefined();expect(ui.scene().receipt).toContain('制作')
  expect(f.controller.exportSaved()).toBe(committed);expect(await f.physical.exportStored(f.view.runId)).toBe(committed);expect(f.submit).toHaveBeenCalledTimes(1)
 }finally{await f.close()}
},20000)

it.each(['target','account','reopen'] as const)('keeps a later video %s viewing context when the original real saved result arrives',async change=>{
 const f=await fixture('u3-video-workspace-'+change)
 try{
  const ui=driver(f);await ui.start();ui.closeConfirmation()
  if(change==='target')ui.selectTarget(f.targetB)
  else if(change==='account')ui.changeAccount(f.company.accountId)
  else{ui.closeBook();ui.openBook()}
  const chosenTarget=change==='target'?f.targetB:f.targetA,chosenAccount=change==='account'?f.company.accountId:'personal',committed=f.controller.exportSaved()
  expect(ui.scene().videoTarget).toEqual(chosenTarget);expect(ui.scene().accountId).toBe(chosenAccount);expect(ui.book()).toBeDefined()
  expect((await f.finish()).status).toBe('saved');ui.render()
  expect(ui.scene().videoTarget).toEqual(chosenTarget);expect(ui.scene().accountId).toBe(chosenAccount)
  expect(ui.book(),'the original result must not close a later reading workspace').toBeDefined();expect(ui.scene().receipt).toBeNull()
  const work=(f.controller.snapshot.view!.features as unknown as PlayFeatures).video!.works[0]!
  expect(readPin(f)).toEqual(change==='target'?f.targetB:{channelId:f.targetA.channelId,workId:work.id})
  expect(f.controller.snapshot.view!.revision).toBe(f.view.revision+1);expect(f.submit).toHaveBeenCalledTimes(1)
  expect(f.controller.exportSaved()).toBe(committed);expect(await f.physical.exportStored(f.view.runId)).toBe(committed)
 }finally{await f.close()}
},20000)

it('keeps an actual video candidate private and its original retry from replacing a later B record',async()=>{
 const f=await fixture('u3-video-workspace-retry',true)
 try{
  const ui=driver(f);await ui.start();expect((await f.finish()).status).toBe('unsaved');ui.render()
  expect(f.fault?.trace).toEqual({writeSucceeded:true,abortIssued:true})
  expect(f.controller.snapshot.view!.revision).toBe(f.view.revision);expect(ui.scene().videoTarget).toEqual(f.targetA)
  expect(ui.book()).toBeUndefined();expect(f.controller.exportSaved()).toBe(f.raw);expect(await f.physical.exportStored(f.view.runId)).toBe(f.raw)
  expect(readPin(f)).toEqual(f.targetA)
  const candidate=f.controller.exportCandidate();ui.openBook(f.targetB)
  expect(ui.scene().videoTarget).toEqual(f.targetB);ui.click('重试保存原候选')
  expect((await f.finishRetry()).status).toBe('saved');ui.render()
  expect(ui.scene().videoTarget).toEqual(f.targetB);expect(ui.book()).toBeDefined();expect(ui.scene().receipt).toBeNull()
  const work=(f.controller.snapshot.view!.features as unknown as PlayFeatures).video!.works[0]!
  expect(readPin(f)).toEqual({channelId:f.targetA.channelId,workId:work.id})
  expect(f.controller.exportSaved()).toBe(candidate);expect(await f.physical.exportStored(f.view.runId)).toBe(candidate)
  expect(f.submit).toHaveBeenCalledTimes(1);expect(f.retry).toHaveBeenCalledTimes(1)
 }finally{await f.close()}
},20000)
