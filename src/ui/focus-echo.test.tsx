import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {explicitFocusChangesObject,retireRoomAcknowledgement,roomNoticeAfterFocus} from './focus-echo.ts'
import {CinematicRoom} from './CinematicRoom.tsx'
import {savedSceneResult} from './scene-result.ts'

// Normal in-memory proposals and UI callback/effect frames. No persistence APIs.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0,effects:[] as (()=>void)[]}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const index=hooks.index++;if(!(index in hooks.values))hooks.values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[index] as T,(value:T|((old:T)=>T))=>{hooks.values[index]=typeof value==='function'?(value as (old:T)=>T)(hooks.values[index] as T):value}] as const}
 const effect=(callback:()=>void|(()=>void),deps?:readonly unknown[])=>{const [slot]=state(()=>({deps:null as readonly unknown[]|null,cleanup:undefined as void|(()=>void)}));if(slot.deps===null||deps===undefined||deps.length!==slot.deps.length||deps.some((value,index)=>!Object.is(value,slot.deps![index]))){hooks.effects.push(()=>{slot.cleanup?.();slot.cleanup=callback()});slot.deps=deps??null}}
 return {...actual,useState:state,useRef:<T,>(value:T)=>state(()=>({current:value}))[0],useEffect:effect}
})
afterEach(()=>{hooks.values=[];hooks.index=0;hooks.effects=[];vi.unstubAllGlobals()})
function mounted<T>(render:()=>T){hooks.index=0;hooks.effects=[];const result=render(),effects=hooks.effects.slice();effects.forEach(effect=>effect());return result}
type Element=ReactElement<Record<string,unknown>>
function elements(value:unknown):Element[]{if(Array.isArray(value))return value.flatMap(elements);if(!isValidElement<Record<string,unknown>>(value))return [];return [value,...elements(value.props.children)]}
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'focus-echo-ui',actorId:'player',commandId:'create',seed:'focus-echo-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'echo-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED: '+JSON.stringify(result));return result.nextRun}
const resting=act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),midway=act(resting,'AdvanceTime',{date:'2020-01-06'}),completed=act(midway,'AdvanceTime',{date:'2020-01-08'})
function view(run:GameRun):PlayingView{return {...projectRun(run),features:registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}}
const input=(run=completed)=>{const v=view(run);return {view:v,features:v.features as unknown as PlayFeatures}}
function lifeFocus(p=input()):OpeningFocus{const job=p.features.life.jobs.find(job=>job.kind==='rest')!;return {runId:p.view.runId,kind:'life',accountId:'personal',entityId:job.id,selection:'rest'}}

it('retires an unrelated completed life echo when a new work direction is explicitly chosen',()=>{
 const p=input(),original=lifeFocus(p),next:OpeningFocus={runId:p.view.runId,kind:'work',accountId:'personal',entityId:null},receipts=p.view.receipts
 expect(explicitFocusChangesObject(p,original,next)).toBe(true)
 expect(p.view.receipts).toBe(receipts)
 expect(playerThread(p,original).outcome).toBe('actual')
 expect(p.features.life.jobs[0]!.status).toBe('completed')
})

it('retains same-object reading even when property order or object identity differs',()=>{
 const p=input(),job=p.features.life.jobs[0]!,first=lifeFocus(p),same:OpeningFocus={entityId:job.id,selection:'rest',accountId:'personal',kind:'life',runId:p.view.runId}
 expect(explicitFocusChangesObject(p,first,same)).toBe(false)
 const free:OpeningFocus={runId:p.view.runId,kind:'free',accountId:'personal',entityId:null}
 expect(explicitFocusChangesObject(input(initial),free,null)).toBe(false)
 expect(explicitFocusChangesObject(p,first,null)).toBe(true)
})

it('does not retire an echo for an invalid or different-life target',()=>{
 const p=input(),focus=lifeFocus(p)
 expect(explicitFocusChangesObject(p,focus,{...focus,runId:'other-life'})).toBe(false)
 expect(explicitFocusChangesObject(p,focus,{...focus,entityId:'missing-life-job'})).toBe(false)
})

it('retires only the exact old ordinary life acknowledgement and only for its own UI revision',()=>{
 const p=input(resting),notice='生活工作已实际开始；完成与场景仍按真实日期处理。',retired=retireRoomAcknowledgement(p.view,notice)
 expect(roomNoticeAfterFocus(p.view,notice,retired)).toBeNull()
 expect(roomNoticeAfterFocus({...p.view,revision:p.view.revision+1},notice,retired)).toBe(notice)
 expect(roomNoticeAfterFocus({...p.view,runId:'other-life'},notice,retired)).toBe(notice)
 for(const text of ['原费用仍待核对。','当前为只读，请查看写入状态说明。','另有一项责任待回应。']){
  expect(retireRoomAcknowledgement(p.view,text)).toBeNull()
  expect(roomNoticeAfterFocus(p.view,text,{runId:p.view.runId,revision:p.view.revision,notice:text})).toBe(text)
 }
})

function driver(withResultCallback=true){
 vi.stubGlobal('document',{addEventListener:vi.fn(),removeEventListener:vi.fn()})
 let run=completed,current=view(run),feedback='原休整已完成。'
 const pin=lifeFocus(input(run)),request=vi.fn(),explicit=vi.fn(),result=vi.fn()
 const controller={get snapshot(){return {view:current,busy:current.busy}},runtimeSession:'ui-only-session',asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']
 const render=()=>mounted(()=>CinematicRoom({view:current,features:current.features as unknown as PlayFeatures,controller,request,accountId:'personal',openingFocus:pin,initialToday:{runId:completed.runId,revision:completed.revision},headingRef:null,notice:null,timeEcho:feedback,onNavigate:vi.fn(),onPeople:vi.fn(),onYear:vi.fn(),onOpeningFocus:explicit,...(withResultCallback?{onSavedFollowFocus:result}:{})}))
 const moment=(tree=render())=>elements(tree).find(node=>typeof node.type==='function'&&node.type.name==='RoomMoment')!
 const choose=()=>{const node=moment();(node.props.p as GamePanelProps).request('StartLifeWork',{kind:'workspace',personId:null,reference:null},'核对住处',true);render()}
 const apply=()=>{const before=current;run=act(run,'StartLifeWork',{kind:'workspace',personId:null,reference:null});current=view(run);feedback=savedSceneResult('StartLifeWork','核对住处',before,current);return render()}
 return {render,moment,choose,apply,request,explicit,result,current:()=>current,feedback:()=>feedback}
}

it('follows a new Today result through the dedicated result callback without treating it as explicit reading',()=>{
 const ui=driver();ui.choose();expect(ui.request).toHaveBeenCalledExactlyOnceWith('StartLifeWork',{kind:'workspace',personId:null,reference:null},'核对住处',true)
 const tree=ui.apply(),features=ui.current().features as unknown as PlayFeatures,job=features.life.jobs.find(job=>job.kind==='workspace')!
 expect(ui.result).toHaveBeenCalledExactlyOnceWith({runId:ui.current().runId,kind:'life',accountId:'personal',selection:'workspace',entityId:job.id})
 expect(ui.explicit).not.toHaveBeenCalled()
 expect(ui.moment(tree).props.feedback).toBe(ui.feedback());expect(ui.feedback()).toContain('¥3,000')
 ui.render();expect(ui.result).toHaveBeenCalledOnce()
})

it('keeps the older consumer callback when no result-specific callback is supplied',()=>{
 const ui=driver(false);ui.choose();ui.apply()
 expect(ui.explicit).toHaveBeenCalledOnce();expect(ui.result).not.toHaveBeenCalled()
})

it('keeps Today and return-to-bookmark navigation out of the explicit focus callback',()=>{
 const ui=driver(),moment=ui.moment()
 expect(moment.props.onOpeningFocus).toBe(ui.explicit)
 ;(moment.props.onToday as ()=>void)();ui.render()
 ;(ui.moment().props.onReturnFocus as ()=>void)();ui.render()
 expect(ui.explicit).not.toHaveBeenCalled();expect(ui.result).not.toHaveBeenCalled()
 expect(ui.moment().props.feedback).toBe('原休整已完成。')
})

it('keeps the existing later-gesture fence ahead of automatic result following',()=>{
 const ui=driver();ui.choose();const tree=ui.render()
 ;(tree.props.onPointerDownCapture as ()=>void)();ui.apply()
 expect(ui.result).not.toHaveBeenCalled();expect(ui.explicit).not.toHaveBeenCalled()
})
