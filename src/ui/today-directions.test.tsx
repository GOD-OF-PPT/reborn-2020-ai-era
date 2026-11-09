import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {openingFocusFor} from './player-thread.ts'
import {todayThread,todayReadingGroups} from './today-thread.ts'
import {TodayScene} from './TodayScene.tsx'
import {TodayDirections,type TodayDirectionKey} from './TodayDirections.tsx'
import {Dialog} from './Dialog.tsx'
import {sceneReadingName} from './scene-language.ts'

// Normal in-memory gameplay projections plus a local React callback driver.
// No controller submission, storage, codec, import/export or reload checks.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),current:[] as unknown[],index:0}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const index=hooks.index++,values=hooks.current;if(!(index in values))values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[index] as T,(next:T|((old:T)=>T))=>{values[index]=typeof next==='function'?(next as (old:T)=>T)(values[index] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useImperativeHandle:()=>{},useCallback:<T,>(callback:T)=>callback,useMemo:<T,>(factory:()=>T)=>factory(),useId:()=> 'today-held-ui'}
})
function mounted<T>(key:string,fn:()=>T):T{const previous=hooks.current,index=hooks.index;hooks.current=hooks.slots.get(key)??[];hooks.slots.set(key,hooks.current);hooks.index=0;try{return fn()}finally{hooks.current=previous;hooks.index=index}}
afterEach(()=>{hooks.slots.clear();vi.clearAllMocks()})
type Element=ReactElement<Record<string,unknown>>
const drawers:Record<string,ReturnType<typeof vi.fn>>={VideoSceneChoice:vi.fn(),CourseSceneChoice:vi.fn(),MarketSceneChoice:vi.fn()}
function elements(value:unknown,path='root'):Element[]{
 if(Array.isArray(value))return value.flatMap((child,index)=>elements(child,path+'/'+index))
 if(!isValidElement<Record<string,unknown>>(value))return []
 if(typeof value.type==='function'&&['VideoSceneChoice','CourseSceneChoice','MarketSceneChoice'].includes(value.type.name)&&typeof value.props.children==='function')return elements(value.props.children(drawers[value.type.name]!),path+'/drawer')
 const own=[value,...elements(value.props.children,path+'/children'),...elements(value.props.footer,path+'/footer')]
 if(typeof value.type==='function'&&value.type.name==='RoomTableau')for(const key of ['heading','facts','decisions','record','object'])own.push(...elements(value.props[key],path+'/'+key))
 if(typeof value.type==='function'&&['OpeningObject','ClockAdvance','CommandButton','TodayHoldings','TodayLifeChoices','TodayDirections','TodayParallelChoice'].includes(value.type.name)){const fn=value.type as (props:Record<string,unknown>)=>unknown;own.push(...elements(mounted(path,()=>fn(value.props)),path+'/render'))}
 return own
}
const words=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(words).join(''):isValidElement<Record<string,unknown>>(value)?words(value.props.children):''
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'today-directions-ui',actorId:'player',commandId:'create',seed:'today-directions-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function workingRun(){const result=evaluateCommand(initial,{runId:initial.runId,actorId:initial.actorId,commandId:'work',expectedRevision:initial.revision,kind:'WorkQuarter',payload:{}},registry,initial.actorId);if(result.status!=='proposed')throw Error('NORMAL_WORK_REQUIRED');return result.nextRun}
function driver(run:GameRun=initial){
 const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures,view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 const request=vi.fn(),requestWait=vi.fn(),controller={snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']
 const p:GamePanelProps={view,features,controller,request,requestWait,accountId:'personal'},focus={runId:run.runId,kind:'work' as const,accountId:'personal',entityId:null},today=todayThread(p,focus)!
 const onFocus=vi.fn(),onPrepare=vi.fn()
 const render=()=>elements(mounted('scene',()=>TodayScene({p,today,headingRef:null,onFocus,onPrepare,onResume:vi.fn(),onNavigate:vi.fn(),onExplore:vi.fn(),onRecollection:vi.fn()})))
 const click=(label:string)=>{const node=render().find(row=>row.type==='button'&&(words(row.props.children)===label||row.props['aria-label']===label||row.props['aria-label']===sceneReadingName(label)));if(!node||typeof node.props.onClick!=='function'||node.props.disabled)throw Error('ENABLED_BUTTON_REQUIRED: '+label);node.props.onClick()}
 const dialog=()=>render().find(row=>row.type===Dialog)
 const open=()=>{const parallel=render().find(n=>n.type==='button'&&n.props['aria-label']==='等候时，看看工作与生活 ↗');if(parallel){click('等候时，看看工作与生活 ↗');click('其它尝试与原约定')}else click('想想今天 · 看看工作、其它尝试与原约定 ↗')}
 const route=(key:TodayDirectionKey)=>{const sheet=render().find(row=>row.type===TodayDirections)!;const node=(sheet.props.choices as Record<TodayDirectionKey,Element>)[key];(node.props.onClick as ()=>void)()}
 return {p,today,render,click,dialog,open,route,onFocus,onPrepare}
}

it('groups every original guarded button once, preserving the supplied identity and disabled state',()=>{
 const keys:TodayDirectionKey[]=['work','life','video','course','relay','ecosystem','equity','market'],handlers=keys.map(()=>vi.fn())
 const choices=Object.fromEntries(keys.map((key,index)=>[key,<button key={key} aria-label={key} onClick={handlers[index]} disabled={key==='relay'}>{key}</button>])) as Record<TodayDirectionKey,Element>
 const existing=<button onClick={vi.fn()}>original ongoing</button>
 const rows=elements(TodayDirections({date:'2020-01-01',quarter:'2020-Q1',existing,choices}))
 expect(rows.filter(row=>row.props['data-direction']).map(row=>row.props['data-direction'])).toEqual(keys)
 expect(rows.filter(row=>row.type==='button')).toEqual([existing,...keys.map(key=>choices[key])])
 expect(rows.filter(row=>row.type==='h3')).toHaveLength(3)
 for(const handler of handlers)expect(handler).not.toHaveBeenCalled()
})

it('opens one direct choice sheet and closes without making a commitment or changing focus',()=>{
 const ui=driver();ui.open()
 expect(ui.dialog()?.props).toMatchObject({layout:'direct',title:'今天，想把时间留给什么？'})
 const sheet=ui.render().find(row=>row.type===TodayDirections)!
 expect(sheet.props).toMatchObject({date:ui.p.view.date,quarter:ui.p.features.workbench.quarter,existing:null})
 ;(ui.dialog()!.props.onClose as ()=>void)()
 expect(ui.dialog()).toBeUndefined();expect(ui.onFocus).not.toHaveBeenCalled();expect(ui.p.request).not.toHaveBeenCalled()
})

it('opens daily work comparison and keeps the three business focuses on their original target payloads',()=>{
 const ui=driver()
 const targets={
  work:{runId:ui.p.view.runId,kind:'work',accountId:'personal',entityId:null},
  relay:openingFocusFor(ui.p,'relay',{relayTarget:null,accountId:'personal'}),
  ecosystem:openingFocusFor(ui.p,'deepseek',{ecosystemTarget:null,accountId:'personal',deepseekPane:'ecosystem'}),
  equity:openingFocusFor(ui.p,'deepseek',{equityTarget:null,accountId:'personal',deepseekPane:'equity'}),
 }
 ui.open();ui.route('work');expect(ui.dialog()?.props.title).toBe('今天，怎样安排这段日子？');expect(ui.onFocus).not.toHaveBeenCalled();ui.click('翻阅原工作与本季日历');expect(ui.onFocus).toHaveBeenLastCalledWith(targets.work);expect(ui.dialog()).toBeUndefined()
 for(const key of ['relay','ecosystem','equity'] as const){ui.open();ui.route(key);expect(ui.onFocus).toHaveBeenLastCalledWith(targets[key]);expect(ui.dialog()).toBeUndefined()}
 expect(ui.onFocus).toHaveBeenCalledTimes(4);expect(ui.p.request).not.toHaveBeenCalled();expect(ui.onPrepare).not.toHaveBeenCalled()
})

it('opens the original video and course first steps without issuing business commands',()=>{
 const ui=driver();ui.open();ui.route('video')
 expect(drawers.VideoSceneChoice).toHaveBeenCalledExactlyOnceWith('select-account');expect(ui.dialog()).toBeUndefined()
 ui.open();ui.route('course');expect(drawers.CourseSceneChoice).toHaveBeenCalledExactlyOnceWith('objects');expect(ui.dialog()).toBeUndefined()
 expect(ui.p.request).not.toHaveBeenCalled();expect(ui.onFocus).not.toHaveBeenCalled()
})

it('keeps life and market as explicit preparations, with the original life confirmation',()=>{
 const ui=driver();ui.open();ui.route('life');expect(ui.dialog()?.props.title).toBe('留点时间给自己');expect(ui.p.request).not.toHaveBeenCalled()
 ui.click('核对并留出七天休整');expect(ui.p.request).toHaveBeenCalledExactlyOnceWith('StartLifeWork',{kind:'rest',personId:null,reference:null},'核对并留出七天休整',true)
 ui.open();ui.route('market');expect(ui.dialog()?.props.title).toBe('这次，怎样判断？')
 expect(drawers.MarketSceneChoice).not.toHaveBeenCalled();expect(ui.p.request).toHaveBeenCalledTimes(1)
 ui.click('返回今天的选择');expect(ui.dialog()?.props.layout).toBe('direct')
 expect(ui.onFocus).not.toHaveBeenCalled()
})

it('keeps an actual ongoing work shortcut separate from new directions',()=>{
 const ui=driver(workingRun());ui.open()
 const original=todayReadingGroups(ui.today.ongoing).continuing[0]!
 ui.click('继续手头的事');expect(ui.dialog()?.props.title).toBe('手头的事')
 ui.click('回到这件原安排');expect(ui.onFocus).toHaveBeenCalledExactlyOnceWith(original.focus);expect(ui.p.request).not.toHaveBeenCalled()
})
