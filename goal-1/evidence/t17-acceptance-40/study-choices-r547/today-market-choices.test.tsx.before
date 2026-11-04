import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {todayThread} from './today-thread.ts'
import {TodayScene} from './TodayScene.tsx'
import {TodayMarketChoices} from './TodayMarketChoices.tsx'
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
 if(typeof value.type==='function'&&['OpeningObject','ClockAdvance','CommandButton','TodayHoldings','TodayLifeChoices','TodayDirections','TodayMarketChoices'].includes(value.type.name)){const fn=value.type as (props:Record<string,unknown>)=>unknown;own.push(...elements(mounted(path,()=>fn(value.props)),path+'/render'))}
 return own
}
const words=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(words).join(''):isValidElement<Record<string,unknown>>(value)?words(value.props.children):''
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'today-market-ui',actorId:'player',commandId:'create',seed:'today-market-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'market-ui-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED: '+JSON.stringify(result));return result.nextRun}
const running=act(initial,'ResearchMarket',{definitionId:'market-overview'}),researchId=running.market!.researches[0]!.id
const completed=act(running,'AdvanceTime',{date:running.market!.researches[0]!.completeAt}),interrupted=act(running,'StopMarketResearch',{researchId})
const work=act(initial,'WorkQuarter'),rest=act(work,'StartLifeWork',{kind:'rest',personId:null,reference:null}),stopped=act(rest,'InterruptLifeWork',{jobId:rest.life!.jobs[0]!.id}),zero=act(stopped,'StartLifeWork',{kind:'rest',personId:null,reference:null})
function driver(run:GameRun=initial){
 const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures,view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 const request=vi.fn(),requestWait=vi.fn(),controller={snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']
 const p:GamePanelProps={view,features,controller,request,requestWait,accountId:'personal'},focus={runId:run.runId,kind:'work' as const,accountId:'personal',entityId:null},today=todayThread(p,focus)!
 const onFocus=vi.fn(),onPrepare=vi.fn()
 const render=()=>elements(mounted('scene',()=>TodayScene({p,today,headingRef:null,onFocus,onPrepare,onResume:vi.fn(),onNavigate:vi.fn(),onExplore:vi.fn(),onRecollection:vi.fn()})))
 const find=(label:string)=>render().find(row=>row.type==='button'&&(words(row.props.children)===label||row.props['aria-label']===label||row.props['aria-label']===sceneReadingName(label)))
 const click=(label:string)=>{const node=find(label);if(!node||typeof node.props.onClick!=='function'||node.props.disabled)throw Error('ENABLED_BUTTON_REQUIRED: '+label);node.props.onClick()}
 const dialog=()=>render().find(row=>row.type===Dialog)
 const open=()=>{click('想想今天 · 看看工作、其它尝试与原约定 ↗');click('准备一次模拟判断')}
 const sheet=()=>render().find(row=>row.type===TodayMarketChoices)!
 const content=()=>{const node=sheet();return words(TodayMarketChoices(node.props as Parameters<typeof TodayMarketChoices>[0]))}
 return {p,today,render,find,click,dialog,open,sheet,content,onFocus,onPrepare}
}

it('shows research and order preparation together with current cash, points and finish date',()=>{
 const ui=driver();ui.open();expect(ui.dialog()?.props).toMatchObject({layout:'direct',title:'这次，怎样判断？'})
 for(const text of ['先读一份公开资料','写一份模拟委托','¥26,000','¥0','1点','2020-01-02','本季可用4点','不揭示未来价格','填写不等于成交'])expect(ui.content()).toContain(text)
 expect(ui.find('核对并开始公开研究')).toBeDefined();expect(ui.find('显选一份新的模拟委托')).toBeDefined();expect(ui.find('先保留现金，不新增委托')).toBeDefined()
 expect(ui.p.request).not.toHaveBeenCalled();expect(ui.onFocus).not.toHaveBeenCalled()
})

it('uses the original research confirmation and personal definition payload',()=>{
 const ui=driver();ui.open();ui.click('核对并开始公开研究')
 expect(ui.p.request).toHaveBeenCalledExactlyOnceWith('ResearchMarket',{definitionId:'market-overview'},'核对并开始公开研究',true)
 expect(ui.dialog()).toBeUndefined();expect(ui.onFocus).not.toHaveBeenCalled();expect(drawers.MarketSceneChoice).not.toHaveBeenCalled()
})

it.each([[running,'公开资料正在整理','预计2020-01-02完成'],[completed,'这份资料，已整理完成','已于2020-01-02整理完成'],[interrupted,'这份研究，已经中断','已经投入的钱和行动不返还']] as const)('reads the actual research state and returns to its original identity: %s', (run,title,line)=>{
 const ui=driver(run);ui.open();expect(ui.content()).toContain(title);expect(ui.content()).toContain(line)
 expect(ui.find('核对并开始公开研究')).toBeUndefined()
 ui.click('回到这份公开研究');expect(ui.onFocus).toHaveBeenCalledExactlyOnceWith({runId:run.runId,kind:'market',accountId:'personal',entityId:researchId,entityKind:'research'})
 expect(ui.p.request).not.toHaveBeenCalled();expect(ui.dialog()).toBeUndefined()
})

it('keeps original zero-action rejection visible without blocking order preparation or cash retention',()=>{
 const ui=driver(zero);ui.open();expect(ui.p.view.budget.available).toBe(0)
 const research=ui.find('核对并开始公开研究')!;expect(research.props.disabled).toBe(true)
 ;(research.props.onClick as ()=>void)();expect(ui.p.request).not.toHaveBeenCalled()
 expect(ui.render().some(row=>row.props.className==='reason'&&words(row.props.children).length>0)).toBe(true)
 expect(ui.find('显选一份新的模拟委托')?.props.disabled).toBe(false);ui.click('先保留现金，不新增委托');expect(ui.dialog()).toBeUndefined();expect(ui.onFocus).not.toHaveBeenCalled()
})

it('opens the original order picker and returns to directions without issuing orders',()=>{
 const ui=driver();ui.open();ui.click('显选一份新的模拟委托');expect(drawers.MarketSceneChoice).toHaveBeenCalledExactlyOnceWith();expect(ui.dialog()).toBeUndefined()
 ui.open();ui.click('返回今天的选择');expect(ui.dialog()?.props.title).toBe('今天，想把时间留给什么？');expect(ui.p.request).not.toHaveBeenCalled();expect(ui.onFocus).not.toHaveBeenCalled()
})

it('preserves existing order nodes and does not invent missing research terms',()=>{
 const ui=driver(),orderAction=<button onClick={vi.fn()}>original order</button>,researchAction=<button>original research</button>
 const p={...ui.p,features:{...ui.p.features,workbench:{...ui.p.features.workbench,researches:[]}}}
 const tree=TodayMarketChoices({p,orderAction,researchAction}),rows=elements(tree)
 expect(words(tree)).toContain('暂未找到这份研究的公开条件');expect(rows).toContain(orderAction);expect(rows).not.toContain(researchAction)
 expect(rows.some(row=>row.props.kind==='ResearchMarket')).toBe(false);expect(ui.p.request).not.toHaveBeenCalled()
})
