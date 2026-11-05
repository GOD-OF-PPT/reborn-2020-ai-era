import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {TodayScene} from './TodayScene.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {Dialog} from './Dialog.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {todayThread} from './today-thread.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {sceneReadingName} from './scene-language.ts'

// Normal in-memory game state; the driver follows real Opening/Today/DayThread
// UI callbacks. No persistence, codec or imported run fixtures.
const hooks=vi.hoisted(()=>({enabled:false,current:[] as unknown[],index:0,slots:new Map<string,unknown[]>()}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>(),state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++,values=hooks.current;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:<T,>(v:T|(()=>T))=>hooks.enabled?state(v):actual.useState(v),useRef:<T,>(v:T)=>hooks.enabled?state(()=>({current:v}))[0]:actual.useRef(v),useEffect:(...args:Parameters<typeof actual.useEffect>)=>{if(!hooks.enabled)actual.useEffect(...args)},useImperativeHandle:(...args:Parameters<typeof actual.useImperativeHandle>)=>{if(!hooks.enabled)actual.useImperativeHandle(...args)},useCallback:<T extends (...args:never[])=>unknown,>(fn:T,deps:readonly unknown[])=>hooks.enabled?fn:actual.useCallback(fn,deps),useMemo:<T,>(fn:()=>T,deps:readonly unknown[])=>hooks.enabled?fn():actual.useMemo(fn,deps),useId:()=>hooks.enabled?'work-today':actual.useId()}
})
afterEach(()=>{hooks.enabled=false;hooks.current=[];hooks.index=0;hooks.slots.clear();vi.clearAllMocks()})
function mounted<T>(key:string,fn:()=>T){const old=hooks.current,index=hooks.index,enabled=hooks.enabled;hooks.current=hooks.slots.get(key)??[];hooks.slots.set(key,hooks.current);hooks.index=0;hooks.enabled=true;try{return fn()}finally{hooks.current=old;hooks.index=index;hooks.enabled=enabled}}
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'work-today-ui',actorId:'player',commandId:'create',seed:'work-today-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'today-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error(JSON.stringify(r));return r.nextRun}
const working=act(initial,'WorkQuarter'),full=act(act(working,'StartLifeWork',{kind:'rest',personId:null,reference:null}),'ResearchMarket',{definitionId:'market-overview'})
function input(run=full):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']}}
const focus=(p:GamePanelProps):OpeningFocus=>({runId:p.view.runId,kind:'work',accountId:'personal',entityId:p.view.operations!.employment[0]!.id})
type Element=ReactElement<Record<string,unknown>>
const words=(n:unknown):string=>typeof n==='string'?n:Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
function elements(n:unknown,path='root'):Element[]{
 if(Array.isArray(n))return n.flatMap((v,i)=>elements(v,path+'/'+i));if(!isValidElement<Record<string,unknown>>(n))return []
 if(typeof n.type==='function'&&['MarketSceneChoice','VideoSceneChoice','CourseSceneChoice','RelaySceneChoice'].includes(n.type.name)&&typeof n.props.children==='function')return elements(n.props.children(vi.fn()),path+'/choice')
 if(typeof n.type==='function'&&['RelayThreadAction','OpeningAttemptAction','VideoThreadAction','CourseThreadAction'].includes(n.type.name)&&typeof n.props.children==='function')return elements(n.props.children(null),path+'/thread')
 const out=[n,...elements(n.props.children,path+'/children'),...elements(n.props.footer,path+'/footer')]
 if(n.type===RoomTableau)for(const key of ['heading','context','feedback','facts','decisions','record','object'])out.push(...elements(n.props[key],path+'/'+key))
 if(typeof n.type==='function'&&['DayThreadAction','ClockAdvance','OpeningObject','TodayScene','TodayLifeChoices','TodayWorkChoice','TodayDirections','CommandButton'].includes(n.type.name))out.push(...elements(mounted(n.type===TodayScene?'today':path,()=> (n.type as (p:Record<string,unknown>)=>unknown)(n.props)),path+'/render'))
 return out
}
function driver(run=full,extra:Partial<ComponentProps<typeof OpeningMoment>>={}){const p=input(run),onFocus=vi.fn(),onNavigate=vi.fn(),props:ComponentProps<typeof OpeningMoment>={p,focus:focus(p),onFocus,headingRef:null,fallback:roomMoment(p),onNavigate,onExplore:vi.fn(),...extra};let mountedToday=false
 const render=()=>{const tree=mounted('opening',()=>OpeningMoment(props)),now=tree.type===TodayScene;if(now&&!mountedToday)hooks.slots.delete('today');mountedToday=now;return elements(tree)},button=(label:string)=>render().find(n=>n.type==='button'&&(words(n.props.children)===label||n.props['aria-label']===label||n.props['aria-label']===sceneReadingName(label))),click=(label:string)=>{const b=button(label);if(!b||b.props.disabled)throw Error('ENABLED_BUTTON_REQUIRED: '+label);(b.props.onClick as ()=>void)()};return {p,props,onFocus,onNavigate,render,button,click}}

it('opens the actual daily comparison directly from zero-action work without navigating through another system',()=>{
 const r=driver(),before=JSON.stringify({accounts:r.p.view.accounts,budget:r.p.view.budget,date:r.p.view.date}),buttons=r.render().filter(n=>n.type==='button'&&words(n.props.children).includes('回到今天，看看其它安排'))
 expect(buttons).toHaveLength(1);r.click('回到今天，看看其它安排');const dialog=r.render().find(n=>n.type===Dialog)!
 expect(dialog.props).toMatchObject({layout:'direct',title:'今天，怎样安排这段日子？'});expect(r.render().some(n=>n.props['data-kind']==='work')).toBe(true);expect(r.onNavigate).not.toHaveBeenCalled();expect(r.onFocus).not.toHaveBeenCalled();expect(r.p.request).not.toHaveBeenCalled();expect(r.p.requestWait).not.toHaveBeenCalled();expect(JSON.stringify({accounts:r.p.view.accounts,budget:r.p.view.budget,date:r.p.view.date})).toBe(before)
})
it('closes to Today and explicitly returns to the same work, with no automatic reopen on an ordinary Today visit',()=>{
 const r=driver(working);r.click('回到今天，看看其它安排 ↗');const dialog=r.render().find(n=>n.type===Dialog)!;(dialog.props.onClose as ()=>void)();expect(r.render().some(n=>n.type===Dialog)).toBe(false)
 r.click('继续这季的工作');expect(r.onFocus).toHaveBeenCalledExactlyOnceWith(focus(r.p));expect(r.render().some(n=>n.type===TodayScene)).toBe(false)
 r.props.todayView=true;expect(r.render().some(n=>n.type===TodayScene)).toBe(true);expect(r.render().some(n=>n.type===Dialog)).toBe(false);expect(r.p.request).not.toHaveBeenCalled()
})
it('reads the existing work directly from the daily card without starting another work command',()=>{
 const r=driver();r.click('回到今天，看看其它安排');r.click('回到这份原工作 ↗');expect(r.onFocus).toHaveBeenCalledExactlyOnceWith(focus(r.p));expect(r.render().some(n=>n.type===TodayScene)).toBe(false);expect(r.p.request).not.toHaveBeenCalled()
})
it('retains spare-time primary/object and the original single clock, placing Today in light reading',()=>{
 const r=driver(working),all=r.render(),room=all.find(n=>n.type===RoomTableau)!,primary=all.find(n=>n.type==='button'&&words(n.props.children).includes('安排工作之外的时间'))!,object=all.find(n=>n.type===OpeningObject)!
 expect(object.props.onActivate).toBe(primary.props.onClick);expect(words(room.props.decisions)).not.toContain('回到今天，看看其它安排');expect(words(room.props.record)).toContain('回到今天，看看其它安排')
 const html=renderToStaticMarkup(<OpeningMoment {...r.props}/>);expect(html.match(/class="clock-advance clock-advance-room"/g)).toHaveLength(1);expect(html).toContain('等工作回响 · 2020-01-31');r.click('回到今天，看看其它安排 ↗');expect(r.render().some(n=>n.type===Dialog&&n.props.title==='今天，怎样安排这段日子？')).toBe(true);expect(r.p.request).not.toHaveBeenCalled()
})
it('keeps old-view callbacks inert and does not open the new intent for an invalid focus',()=>{
 const r=driver(),b=r.button('回到今天，看看其它安排')!;Object.assign(r.p.controller.snapshot,{view:{...r.p.view,revision:r.p.view.revision+1}});(b.props.onClick as ()=>void)();expect(r.render().some(n=>n.type===TodayScene)).toBe(false);expect(r.onNavigate).not.toHaveBeenCalled()
 hooks.slots.clear();const invalid=driver(full,{focus:{...focus(r.p),entityId:'missing'}});expect(invalid.render().some(n=>n.type==='button'&&words(n.props.children).includes('回到今天，看看其它安排'))).toBe(false)
})
it('leaves ordinary Today closed until a choice is explicitly requested',()=>{
 const p=input(),today=todayThread(p,focus(p))!,common={p,today,headingRef:null,onFocus:vi.fn(),onPrepare:vi.fn(),onResume:vi.fn(),onExplore:vi.fn(),onRecollection:vi.fn(),onNavigate:vi.fn()},normal=renderToStaticMarkup(<TodayScene {...common}/>),chosen=renderToStaticMarkup(<TodayScene {...common} initialChoice="daily"/> )
 expect(normal).not.toContain('today-daily-dialog');expect(chosen).toContain('today-daily-dialog');expect(chosen).toContain('已在岗');expect(p.request).not.toHaveBeenCalled()
})
it('keeps the original zero-action work wait date and object/main binding intact',()=>{
 const r=driver(),all=r.render(),object=all.find(n=>n.type===OpeningObject)!,button=all.find(n=>n.type==='button'&&n.props['aria-label']===object.props.actionLabel)!
 expect(playerThread(r.p,focus(r.p)).wait!.date).toBe('2020-01-31');expect(object.props.actionLabel).toContain(r.p.features.workbench.progression.quarterTarget);expect(object.props.onActivate).toBe(button.props.onClick);expect(r.p.requestWait).not.toHaveBeenCalled();expect(r.p.request).not.toHaveBeenCalled()
})
