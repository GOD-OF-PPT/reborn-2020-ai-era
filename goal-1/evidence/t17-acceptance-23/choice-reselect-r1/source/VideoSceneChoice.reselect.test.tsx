import {expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {VideoSceneChoice} from './VideoSceneChoice.tsx'
import {createVideoSceneDraftMemory,type VideoSceneDraft} from './video-scene-draft.ts'
import type {VideoSceneTarget} from './video-scene-progress.ts'

// Drive this component's real handlers without a browser or DOM/effect claims.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async importOriginal=>{
 const actual=await importOriginal<typeof import('react')>()
 const slot=<T,>(initial:()=>T):[T,(value:T|((previous:T)=>T))=>void]=>{
  const index=hooks.index++
  if(!(index in hooks.values))hooks.values[index]=initial()
  return [hooks.values[index] as T,value=>{hooks.values[index]=typeof value==='function'?(value as (previous:T)=>T)(hooks.values[index] as T):value}]
 }
 return {...actual,useState:<T,>(initial:T|(()=>T))=>slot(()=>typeof initial==='function'?(initial as ()=>T)():initial),useRef:<T,>(initial:T)=>slot(()=>({current:initial}))[0],useId:()=> 'video-reselect',useEffect:()=>{}}
})

type Element=ReactElement<Record<string,unknown>>
function elements(value:unknown):Element[]{
 if(Array.isArray(value))return value.flatMap(elements)
 if(!isValidElement<Record<string,unknown>>(value))return []
 return [value,...elements(value.props.children),...elements(value.props.footer)]
}
function text(value:unknown):string{
 if(typeof value==='string'||typeof value==='number')return String(value)
 if(Array.isArray(value))return value.map(text).join('')
 return isValidElement<Record<string,unknown>>(value)?text(value.props.children):''
}
function act(element:Element,event:'onClick'|'onChange'){
 const handler=element.props[event]
 if(typeof handler!=='function')throw Error('VISIBLE_HANDLER_REQUIRED')
 handler()
}

it('keeps the confirmed account and both drafts until a different account is explicitly chosen',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'video-choice-reselect'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`video-choice-reselect-${++id}`})
 try{
  await controller.initialize();await controller.newLife({backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'},seed:'video-choice-reselect'})
  for(const name of ['已经确认的账号甲','只预看未确认的账号乙'])expect((await controller.submit(controller.prepare('OpenVideoChannel',{name,segment:'local_merchants'}))).status).toBe('saved')
  const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,[a,b]=features.video!.channels
  if(!a||!b)throw Error('TWO_REAL_CHANNELS_REQUIRED')
  const memory=createVideoSceneDraftMemory(view.runId),targetA={channelId:a.id},targetB={channelId:b.id},before=controller.exportSaved()
  // These are unsubmitted UI choices, not earned clients or permission grants.
  const draftA:VideoSceneDraft={channelId:a.id,clientId:'unsubmitted-client-a',cohortId:'unsubmitted-cohort-a',modeId:'manual',materialId:'original',resource:'player-production',startAt:view.date,productId:'commercial',name:'甲草稿',segment:'local_merchants',monetization:'none',label:true}
  const draftB:VideoSceneDraft={...draftA,channelId:b.id,clientId:'unsubmitted-client-b',cohortId:'unsubmitted-cohort-b',name:'乙草稿'}
  memory.write(view.runId,a.accountId,targetA,draftA);memory.write(view.runId,b.accountId,targetB,draftB)
  let target:VideoSceneTarget=targetA
  const chosen:VideoSceneTarget[]=[],p:GamePanelProps={controller,view,features,accountId:a.accountId,videoDraftMemory:memory,request:()=>{throw Error('RESELECT_MUST_NOT_SUBMIT')}}
  hooks.values=[]
  let tree:ReturnType<typeof VideoSceneChoice>|null=null
  const render=()=>{hooks.index=0;tree=VideoSceneChoice({p,target,onTargetChange:next=>{chosen.push(next);target=next}})}
  const button=(label:string)=>{
   const found=elements(tree).find(element=>element.type==='button'&&text(element.props.children).includes(label))
   if(!found)throw Error('VISIBLE_BUTTON_REQUIRED:'+label)
   return found
  }
  const click=(label:string)=>{act(button(label),'onClick');render()}
  const previewB=()=>{
   const label=elements(tree).find(element=>element.type==='label'&&text(element.props.children).includes(b.name)),radio=label&&elements(label).find(element=>element.type==='input'&&element.props.type==='radio')
   if(!radio)throw Error('VISIBLE_CHANNEL_CHOICE_REQUIRED')
   act(radio,'onChange');render()
  }
  render();click('翻开视频制作与客户约定');click('重新选择账号');previewB()
  expect(chosen).toEqual([])
  expect(memory.read(view.runId,a.accountId,targetA)).toEqual(draftA)
  expect(memory.read(view.runId,b.accountId,targetB)).toEqual(draftB)
  click('先合上，保留草稿');click('翻开视频制作与客户约定')
  const kicker=elements(tree).find(element=>element.type==='p'&&element.props.className==='video-paper-kicker')
  expect(text(kicker)).toContain(a.name);expect(text(kicker)).not.toContain(b.name)
  expect(target).toEqual(targetA);expect(chosen).toEqual([])
  click('重新选择账号');previewB();click('明确选择这个账号')
  expect(chosen).toEqual([targetB]);expect(target).toEqual(targetB)
  expect(memory.read(view.runId,a.accountId,targetA)).toEqual(draftA)
  expect(memory.read(view.runId,b.accountId,targetB)).toEqual(draftB)
  expect(controller.exportSaved()).toBe(before)
 }finally{hooks.values=[];await controller.close();await store.close()}
})
