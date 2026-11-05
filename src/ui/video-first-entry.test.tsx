import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {videoFirstAccount,videoFirstEntryCopy} from './video-first-entry.ts'
import {VideoSceneChoice,videoDraftCommand} from './VideoSceneChoice.tsx'
import {VideoFirstAccountForm} from './VideoFirstAccountForm.tsx'
import {VideoEncounter} from './VideoEncounter.tsx'
import {VideoThreadAction} from './VideoThreadAction.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {CommandButton} from './CommandButton.tsx'
import {Dialog} from './Dialog.tsx'
import {openingFocusFor,playerThread} from './player-thread.ts'
import {videoSceneProgress,type VideoSceneTarget} from './video-scene-progress.ts'

// Normal in-memory gameplay and local React callbacks; no store, codec,
// controller submission, import/export, failure injection or reload checks.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T|((old:T)=>T))=>{hooks.values[i]=typeof next==='function'?(next as (old:T)=>T)(hooks.values[i] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useId:()=> 'first-video-ui'}
})
afterEach(()=>{hooks.values=[];hooks.index=0;vi.clearAllMocks()})
type Element=ReactElement<Record<string,unknown>>
function elements(v:unknown):Element[]{
 if(Array.isArray(v))return v.flatMap(elements)
 if(!isValidElement<Record<string,unknown>>(v))return []
 const rows=[v,...elements(v.props.children),...elements(v.props.footer)]
 if(v.type===VideoFirstAccountForm)rows.push(...elements(v.props.audience),...elements(v.props.nameField),...elements(v.props.terms))
 return rows
}
const words=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(words).join(''):isValidElement<Record<string,unknown>>(v)?words(v.props.children):''
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'first-video-ui',actorId:'player',commandId:'create',seed:'first-video-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:Record<string,unknown>){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'first-video-'+run.revision,expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_COMMAND_REQUIRED:'+kind);return result.nextRun}
const one=act(initial,'OpenVideoChannel',{name:'本地日常',segment:'local_merchants'}),two=act(one,'OpenVideoChannel',{name:'另一份生活',segment:'lifestyle'})
function input(run=initial):GamePanelProps{
 const projected=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 return {view,features:projected as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']}
}
function driver(run=initial,initialTarget?:VideoSceneTarget,change?:(p:GamePanelProps)=>GamePanelProps){
 const base=input(run),p=change?.(base)??base;Object.assign(p.controller.snapshot,{view:p.view})
 let target=initialTarget
 let activate:((intent?:'select-account'|'channel')=>void)|undefined
 const onTarget=vi.fn((next:VideoSceneTarget)=>{target=next}),inspect=vi.fn()
 const render=()=>{hooks.index=0;return elements(VideoSceneChoice({p,...(target?{target}:{}),onTargetChange:onTarget,onInspect:inspect,children:fn=>{activate=fn;return null}}))}
 const click=(label:string)=>{const rows=render(),dialog=rows.find(n=>n.type===Dialog),scope=dialog?elements(dialog):rows,node=scope.find(n=>n.type==='button'&&words(n.props.children)===label);if(!node||node.props.disabled||typeof node.props.onClick!=='function')throw Error('ENABLED_BUTTON_REQUIRED:'+label);node.props.onClick()}
 const fill=(value:string)=>{const node=render().find(n=>n.type==='input'&&!n.props.type)!;if(!node||typeof node.props.onChange!=='function')throw Error('NAME_FIELD_REQUIRED');node.props.onChange({target:{value}})}
 const audience=(index:number)=>{const node=render().filter(n=>n.type==='input'&&String(n.props.name).endsWith('segment'))[index]!;(node.props.onChange as ()=>void)()}
 render();return {p,onTarget,inspect,render,click,fill,audience,open:(intent?:'select-account'|'channel')=>{render();activate!(intent)},dialog:()=>render().find(n=>n.type===Dialog)}
}

it('uses the first path only for an entirely empty public video history',()=>{
 const p=input(),v=p.features.video!;expect(videoFirstAccount(v)).toBe(true);expect(videoFirstAccount(undefined)).toBe(false);expect(videoFirstAccount(input(one).features.video)).toBe(false)
 const workRun=act(one,'StartVideoWork',{channelId:input(one).features.video!.channels[0]!.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:'2020-01-01'})
 const actual=input(workRun).features.video!;expect(videoFirstAccount({...actual,channels:[]})).toBe(false)
})

it('opens blank audience and name fields directly for ordinary and explicit account-entry intents',()=>{
 for(const intent of [undefined,'select-account'] as const){hooks.values=[];const ui=driver();ui.open(intent);expect(ui.dialog()?.props.layout).toBe('direct');expect(ui.render().some(n=>n.type===VideoFirstAccountForm)).toBe(true)
  const radios=ui.render().filter(n=>n.type==='input'&&n.props.type==='radio');expect(radios).toHaveLength(3);expect(radios.every(n=>n.props.checked===false)).toBe(true)
  expect(ui.render().find(n=>n.type==='input'&&!n.props.type)?.props.value).toBe('');expect(ui.render().some(n=>n.type===CommandButton)).toBe(false);expect(ui.p.request).not.toHaveBeenCalled();expect(ui.onTarget).not.toHaveBeenCalled()
 }
})

it('requires both explicit fields, retains the same local draft on close, and presents the original confirm command',()=>{
 const ui=driver();ui.open();ui.fill('街角的新鲜事');expect(ui.render().some(n=>n.type===CommandButton)).toBe(false);ui.audience(1)
 let command=ui.render().find(n=>n.type===CommandButton)!;expect(command.props).toMatchObject({kind:'OpenVideoChannel',payload:{name:'街角的新鲜事',segment:'local_merchants'},confirm:true})
 ui.click('先合上，保留草稿');expect(ui.dialog()).toBeUndefined();ui.open();expect(ui.render().find(n=>n.type==='input'&&!n.props.type)?.props.value).toBe('街角的新鲜事');expect(ui.render().filter(n=>n.type==='input'&&n.props.type==='radio').map(n=>n.props.checked)).toEqual([false,true,false])
 command=ui.render().find(n=>n.type===CommandButton)!;expect(command.props.payload).toEqual({name:'街角的新鲜事',segment:'local_merchants'});expect(ui.p.request).not.toHaveBeenCalled()
})

it('keeps one and multiple existing channels on the explicit selector, never automatically choosing the only channel',()=>{
 for(const run of [one,two]){hooks.values=[];const ui=driver(run);ui.open('select-account');expect(ui.dialog()?.props.layout).toBe('book');expect(ui.render().some(n=>n.type===VideoFirstAccountForm)).toBe(false)
  const radios=ui.render().filter(n=>n.type==='input'&&String(n.props.name).endsWith('channel'));expect(radios).toHaveLength(ui.p.features.video!.channels.length);expect(radios.every(n=>n.props.checked===false)).toBe(true);expect(ui.onTarget).not.toHaveBeenCalled()
  ;(radios[0]!.props.onChange as ()=>void)();expect(ui.onTarget).not.toHaveBeenCalled();ui.click('明确选择这个账号');expect(ui.onTarget).toHaveBeenCalledExactlyOnceWith({channelId:ui.p.features.video!.channels[0]!.id});expect(ui.p.request).not.toHaveBeenCalled()
 }
})

it('invalid targets, foreign account context and epilogue retain the original selector or protected view',()=>{
 const cases=[driver(initial,{channelId:'missing'}),driver(initial,undefined,p=>({...p,accountId:'missing-account'})),driver(initial,undefined,p=>({...p,view:{...p.view,phase:'epilogue'}}))]
 for(const ui of cases){hooks.values=[];ui.open('select-account');expect(ui.dialog()?.props.layout).toBe('book');expect(ui.render().some(n=>n.type===VideoFirstAccountForm)).toBe(false);expect(ui.p.request).not.toHaveBeenCalled();expect(ui.onTarget).not.toHaveBeenCalled()}
})

it('readonly preparation preserves the original submission lock and does not acquire a create permission',()=>{
 const ui=driver(initial,undefined,p=>({...p,view:{...p.view,readOnly:true,readOnlyReason:'ANOTHER_WRITER',saveStatus:'read_only'}}));ui.open();ui.fill('只读草稿');ui.audience(0)
 expect(ui.render().some(n=>n.type===CommandButton)).toBe(false);expect(ui.render().find(n=>n.type==='button'&&words(n.props.children)==='创建这个内容账号')?.props.disabled).toBe(true);expect(ui.p.request).not.toHaveBeenCalled()
})

it('the route copy and the thought/object share one original source-bound action without duplicated entry detail',()=>{
 const p=input(),focus=openingFocusFor(p,'video',{})!,thread=playerThread(p,focus),choose=vi.fn()
 expect(thread).toMatchObject({stage:'video-entry',title:videoFirstEntryCopy.title,line:videoFirstEntryCopy.line});expect(videoSceneProgress(p.features.video,p.view.date,null)).toMatchObject({title:thread.title,line:thread.line})
 const element=VideoEncounter({p,thread,date:null,waitLabel:'',onChoose:choose,onResult:vi.fn(),onToday:vi.fn()})
 if(!isValidElement<ComponentProps<typeof VideoThreadAction>>(element))throw Error('ORIGINAL_THREAD_ACTION_REQUIRED')
 const rows=elements(VideoThreadAction(element.props)),main=rows.find(n=>n.type==='button')!,paper=rows.find(n=>n.type===OpeningObject)!
 expect(words(main)).toContain(videoFirstEntryCopy.action);expect(paper.props.onActivate).toBe(main.props.onClick);expect(paper.props.copyMode).toBe('tableau');expect(rows.some(n=>n.type==='p'&&words(n)===thread.detail)).toBe(false)
 ;(main.props.onClick as ()=>void)();(paper.props.onActivate as ()=>void)();expect(choose).toHaveBeenCalledTimes(2)
 Object.assign(p.controller.snapshot,{view:{...p.view,revision:p.view.revision+1}});(paper.props.onActivate as ()=>void)();expect(choose).toHaveBeenCalledTimes(2);expect(p.request).not.toHaveBeenCalled()
})

it('keeps the original command construction and record actions on an existing selected channel',()=>{
 const p=input(one),channel=p.features.video!.channels[0]!,target={channelId:channel.id},draft={channelId:channel.id,clientId:'',cohortId:'',modeId:'manual',materialId:'original',resource:'player-production',startAt:p.view.date,productId:'hotspot',name:'',segment:'',monetization:'',label:false}
 expect(videoDraftCommand(p,draft,'sample',target)).toMatchObject({kind:'StartVideoWork',payload:{channelId:channel.id,productId:'hotspot',modeId:'manual',materialId:'original',resources:['player-production'],startAt:p.view.date},confirm:true})
 const ui=driver(one,target);ui.open();expect(ui.dialog()?.props.title).toBe('这次，想把哪件事做起来？');expect(ui.render().some(n=>n.type===VideoFirstAccountForm)).toBe(false);expect(ui.p.request).not.toHaveBeenCalled()
})
