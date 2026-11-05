import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {OpeningFocus} from './player-thread.ts'
import {todayThread} from './today-thread.ts'
import {todayChoiceBoard,type TodayChoiceBoard} from './today-choice-board.ts'
import {TodayOngoingChoices} from './TodayOngoingChoices.tsx'
import {TodayScene} from './TodayScene.tsx'
import {Dialog} from './Dialog.tsx'
import {sceneReadingName} from './scene-language.ts'

// Normal public in-memory proposals and UI callbacks. No store, codec or saved fixtures.
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
 if(typeof value.type==='function'&&['OpeningObject','ClockAdvance','CommandButton','TodayHoldings','TodayLifeChoices','TodayDirections','TodayOngoingChoices'].includes(value.type.name)){const fn=value.type as (props:Record<string,unknown>)=>unknown;own.push(...elements(mounted(path,()=>fn(value.props)),path+'/render'))}
 return own
}
const words=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(words).join(''):isValidElement<Record<string,unknown>>(value)?words(value.props.children):''

const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'ongoing-choice-ui',actorId:'player',commandId:'create',seed:'ongoing-choice-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'choice-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error(JSON.stringify(r));return r.nextRun}
const rest=(run:GameRun)=>act(run,'StartLifeWork',{kind:'rest',personId:null,reference:null}),study=(run:GameRun)=>act(run,'ResearchMarket',{definitionId:'market-foundation-course'})
const two=study(rest(initial)),three=study(rest(act(initial,'WorkQuarter')))
function input(run:GameRun):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId)} as unknown as GamePanelProps['controller']}}
function context(run=two){const p=input(run),focus:OpeningFocus={runId:p.view.runId,kind:'work',accountId:'personal',entityId:p.view.operations!.employment[0]?.id??null},today=todayThread(p,focus)!;return {p,today}}
function driver(run=two){const {p,today}=context(run),onFocus=vi.fn(),render=()=>elements(mounted('scene',()=>TodayScene({p,today,headingRef:null,onFocus,onPrepare:vi.fn(),onResume:vi.fn(),onNavigate:vi.fn(),onExplore:vi.fn(),onRecollection:vi.fn()})));const click=(label:string)=>{const n=render().find(n=>n.type==='button'&&(words(n.props.children)===label||n.props['aria-label']===label||n.props['aria-label']===sceneReadingName(label)));if(!n||n.props.disabled||typeof n.props.onClick!=='function')throw Error('ENABLED_BUTTON_REQUIRED:'+label);n.props.onClick()};return {p,today,onFocus,render,click,dialog:()=>render().find(n=>n.type===Dialog),open:()=>click('选回一件未完的约定')}}

it('compares two actual personal arrangements without requiring employment or guessing paid research amounts',()=>{
 const {p,today}=context(),before=JSON.stringify(p.view),v=todayChoiceBoard(p,today)!
 expect(v.items).toHaveLength(2);expect(v.items.map(i=>i.kind).sort()).toEqual(['research','rest']);expect(p.view.operations!.employment).toHaveLength(0)
 const life=v.items.find(i=>i.kind==='rest')!,research=v.items.find(i=>i.kind==='research')!
 expect(life.lines).toEqual(['2020-01-01开始','已付¥0 / 已用1点']);expect(life.date).toBe('2020-01-08');expect(research.date).toBe('2020-01-08');expect(research.lines).toEqual(['2020-01-01开始','不揭示未来价格，买卖仍须显选。']);expect(research.lines.join('')).not.toContain('已付');for(const item of v.items)expect(item.focus).toBe(today.ongoing.find(row=>row.focus.entityId===item.focus.entityId)!.focus)
 expect(v).toMatchObject({runId:p.view.runId,revision:p.view.revision,date:p.view.date,quarter:'2020-Q1'});expect(p.request).not.toHaveBeenCalled();expect(JSON.stringify(p.view)).toBe(before)
})
it('covers all three normal work/life/research items while preserving the actual original action cost',()=>{
 const c=context(three),v=todayChoiceBoard(c.p,c.today)!
 expect(v.items).toHaveLength(3);expect(c.p.view.budget.available).toBe(0);const w=v.items.find(i=>i.kind==='work')!;expect(w.lines).toEqual(['本季尚无工资实收','工资按原在岗日结算。']);expect(w.date).toBe('2020-01-31');expect(v.items.map(i=>i.focus)).toEqual(c.today.ongoing.map(i=>i.focus))
})
it('retains actual wage total and latest original wage date/amount, not a future salary quote',()=>{
 let run=act(initial,'WorkQuarter');run=act(run,'AdvanceTime',{date:'2020-02-02'});for(let n=0;n<8&&input(run).features.workbench.pause;n++){const w=input(run).features.workbench,e=w.events.find(e=>e.isBlocking)!,choice=e.choices.find(c=>c.isDefault)!;expect(choice.costFen+choice.actionPoints).toBe(0);run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:choice.id});if(run.timeline.cursor.date<'2020-02-02')run=act(run,'AdvanceTime',{date:'2020-02-02'})}
 run=rest(run);const c=context(run),v=todayChoiceBoard(c.p,c.today)!,w=v.items.find(i=>i.kind==='work')!,pay=c.p.view.operations!.payroll.filter(i=>i.kind==='salary');expect(w.lines[0]).toBe('本季工资已实收¥8,000');expect(w.lines[1]).toBe('最近一笔 2020-01-31 · ¥8,000');expect(pay.some(i=>i.through==='2020-01-31'&&i.amountFen===800000)).toBe(true)
})
it('keeps an accepted promise parent as the action target, reading only its proven running child',()=>{
 let run=act(initial,'StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null});run=act(run,'AdvanceTime',{date:'2020-01-04'});const promise=input(run).features.life.promises[0]!;run=act(run,'AcceptLifePromise',{promiseId:promise.id,consent:true});run=study(act(run,'FulfillLifePromise',{promiseId:promise.id}));const p=input(run),today=todayThread(p,{runId:p.view.runId,kind:'life',accountId:'personal',selection:'tang-ying',entityId:promise.id})!,v=todayChoiceBoard(p,today)!,item=v.items.find(i=>i.kind==='person')!
 expect(item.focus.entityId).toBe(promise.id);expect(item.lines).toContain('已付¥300 / 已用1点');expect(item.personId).toBe('tang-ying');expect(item.stage).toBe('兑现中')
})
it('falls back to the complete original reader for stale, unknown, due, duplicate, foreign or altered sources',()=>{
 const c=context(),t=c.today,one=t.ongoing[0]!
 for(const today of [{...t,source:{...t.source,revision:t.source.revision-1}},{...t,responsibilityOverrideNeeded:true},{...t,primary:{...t.primary,classification:'history' as const}},{...t,ongoing:[one,one]},{...t,ongoing:[one]},{...t,ongoing:t.ongoing.map((i,n)=>n?i:{...i,line:i.line+'未知义务'})},{...t,ongoing:t.ongoing.map((i,n)=>n?i:{...i,originQuarter:'2019-Q4'})},{...t,ongoing:t.ongoing.map((i,n)=>n?i:{...i,focus:{...i.focus,accountId:'foreign'}})}])expect(todayChoiceBoard(c.p,today)).toBeNull()
 const {wait:originalWait,...heldBase}=one;expect(originalWait).toBeDefined();const held={...heldBase,focus:{runId:c.p.view.runId,kind:'market' as const,accountId:'personal',entityKind:'position' as const,entityId:'ui-shape-position'}};expect(todayChoiceBoard(c.p,{...t,ongoing:[...t.ongoing,held]})).toBeNull()
 const business={...one,relayContinuation:{kind:'period' as const,label:'原服务'}};expect(todayChoiceBoard(c.p,{...t,ongoing:[business,...t.ongoing.slice(1)]})).toBeNull()
 const withDue={...c.p,features:{...c.p.features,relay:{...c.p.features.relay!,customers:[{...c.p.features.relay!.customers[0]!,dueReceivableFen:100}]}}};expect(todayChoiceBoard(withDue,t)).toBeNull()
 const bad={...c.p,features:{...c.p.features,life:{...c.p.features.life,jobs:c.p.features.life.jobs.map(i=>({...i,costFen:-1}))}}};expect(todayChoiceBoard(bad,todayThread(bad,t.primary.thread.focus)!)).toBeNull()
 const unknown={...t,remaining:[...t.remaining,{...t.remaining[0]!,urgent:true}]};expect(todayChoiceBoard(c.p,unknown)).toBeNull()
})
it('opens a direct sheet, preserves the exact full original reader and returns/close without new commands',()=>{
 const ui=driver(),before=JSON.stringify(ui.p.view);ui.open();expect(ui.dialog()?.props).toMatchObject({layout:'direct',title:'先把哪件事放回眼前？'});expect(ui.render().filter(n=>n.props.className==='ongoing-choice-card')).toHaveLength(2)
 ui.click('逐条翻阅完整原说明 ↗');expect(ui.dialog()?.props).toMatchObject({layout:'book',title:'手头的事'});const text=ui.render().map(n=>words(n.props.children)).join('');for(const row of ui.today.ongoing){expect(text).toContain(row.title);expect(text).toContain(row.line)}
 ui.click('回到这些原安排');expect(ui.dialog()?.props.layout).toBe('direct');ui.click('先不新增安排，合上这一页');expect(ui.dialog()).toBeUndefined();expect(ui.onFocus).not.toHaveBeenCalled();expect(ui.p.request).not.toHaveBeenCalled();expect(ui.p.requestWait).not.toHaveBeenCalled();expect(JSON.stringify(ui.p.view)).toBe(before)
})
it('each paper goes straight to its exact original focus and obsolete UI callbacks cannot move it',()=>{
 const ui=driver();ui.open();const v=todayChoiceBoard(ui.p,ui.today)!,target=v.items[0]!,label='回到'+target.label+' · '+target.date+'原预计反馈';ui.click(label);expect(ui.onFocus).toHaveBeenCalledExactlyOnceWith(target.focus);expect(ui.dialog()).toBeUndefined();ui.open();const button=ui.render().find(n=>n.props['aria-label']===label)!;Object.assign(ui.p.controller.snapshot,{view:{...ui.p.view,revision:ui.p.view.revision+1}});(button.props.onClick as ()=>void)();expect(ui.onFocus).toHaveBeenCalledTimes(1);expect(ui.p.request).not.toHaveBeenCalled()
})
it('paginates more than three explicit UI-shape cards, keeping all fields/targets and text-only controls',()=>{
 const c=context(),original=todayChoiceBoard(c.p,c.today)!,v:TodayChoiceBoard={...original,items:Array.from({length:5},(_,n)=>({...original.items[n%2]!,key:'shape-'+n,label:'原安排'+n}))},choose=vi.fn(),full=vi.fn();const render=()=>elements(mounted('board',()=>TodayOngoingChoices({p:{...c.p,textOnly:true},value:v,onChoose:choose,onFull:full}))),click=(label:string)=>{const n=render().find(n=>n.type==='button'&&words(n.props.children)===label)!;expect(n.props.disabled).toBe(false);(n.props.onClick as ()=>void)()}
 expect(render().filter(n=>n.props.className==='ongoing-choice-card')).toHaveLength(3);expect(render().some(n=>n.type==='svg')).toBe(false);click('下一组');expect(render().filter(n=>n.props.className==='ongoing-choice-card')).toHaveLength(2);expect(render().map(n=>words(n.props.children)).join('')).toContain('原安排4');click('上一组');expect(render().filter(n=>n.props.className==='ongoing-choice-card')).toHaveLength(3);expect(choose).not.toHaveBeenCalled();expect(full).not.toHaveBeenCalled()
})
