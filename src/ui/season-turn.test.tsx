import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {seasonRecollection} from './season-thread.ts'
import {seasonTurnReading} from './season-turn.ts'
import {SeasonRecollection} from './SeasonRecollection.tsx'
import {SeasonTurnSummary} from './SeasonTurnSummary.tsx'
import {ClockAdvance,type ClockActionBinding} from './ClockAdvance.tsx'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import type {OpeningFocus} from './player-thread.ts'

// Normal in-memory commands and actual UI callbacks only. No stores or codecs.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),scope:'',index:0}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();const state=<T,>(initial:T|(()=>T))=>{const rows=hooks.slots.get(hooks.scope)??[];hooks.slots.set(hooks.scope,rows);const i=hooks.index++;if(!(i in rows))rows[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [rows[i] as T,(next:T|((old:T)=>T))=>{rows[i]=typeof next==='function'?(next as (old:T)=>T)(rows[i] as T):next}] as const};return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useMemo:<T,>(factory:()=>T)=>factory()}})
afterEach(()=>{hooks.slots.clear();hooks.scope='';hooks.index=0})
const scoped=<T,>(key:string,fn:()=>T)=>{hooks.scope=key;hooks.index=0;return fn()}
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children),...nodes(n.props.footer)]:[]
const words=(n:unknown):string=>typeof n==='string'?n:Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'quarter-turn-ui',actorId:'player',commandId:'create',seed:'quarter-turn-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'turn-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error(JSON.stringify(r));return r.nextRun}
function props(run:GameRun):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']}}
function until(run:GameRun,date:string){for(let n=0;n<25;n++){const w=props(run).features.workbench;if(w.pause){const e=w.events.find(e=>e.isBlocking)!,c=e.choices.find(c=>c.isDefault)!;if(c.actionPoints||c.costFen)throw Error('ORIGINAL_FREE_REPLY_REQUIRED');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:c.id});continue}if(run.timeline.cursor.date>=date&&(date!=='2020-03-31'||w.atQuarterEnd))return run;run=act(run,'AdvanceTime',{date})}throw Error('ORIGINAL_TIME_BOUND')}
const working=act(act(initial,'SkipOffer',{offerId:props(initial).features.firstOrder.offerId}),'WorkQuarter'),end=until(working,'2020-03-31'),next=until(end,'2020-04-01')
function driver(p=props(end)) {const onClose=vi.fn(),onToday=vi.fn(),onNavigate=vi.fn();return {p,onClose,onToday,onNavigate,draw:(current=p)=>scoped('leaf',()=>SeasonRecollection({p:current,onClose,onToday,onNavigate}))}}

it('presents actual quarter results and the original next date without inventing new work',()=>{
 const p=props(end),season=seasonRecollection(p)!,reading=seasonTurnReading(p,season)!
 expect(p.view.date).toBe('2020-03-31');expect(season.closed).toBe(true);expect(reading.nextDate).toBe('2020-04-01')
 expect(reading.situation).toContain('实际工资¥24,000');expect(reading.situation).not.toContain('仍需面对的约定另按')
 const html=renderToStaticMarkup(<SeasonTurnSummary value={reading}/>);expect(html).toContain('旧约与费用照原日历继续');expect(html).toContain('下一季，想把时间留给什么')
 expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled()
})

it('opens all original records and returns to the short page without running the clock',()=>{
 const ui=driver(),short=ui.draw();expect(short.props.layout).toBe('direct');expect(nodes(short).filter(n=>n.type===ClockAdvance)).toHaveLength(1)
 const open=nodes(short).find(n=>n.type==='button'&&words(n.props.children)==='翻阅全部回响、旧约与原账 ↗')!;(open.props.onClick as ()=>void)()
 const full=ui.draw();expect(full.props.layout).toBeUndefined();expect(full.props.title).toBe('2020-Q1 · 这季留下的日子')
 const text=words(full.props.children);expect(text).toContain('按实际在岗日，工资已经收到');expect(text).toContain('核对这项实际来源');expect(text).toContain('截至今天，仍需面对的约定')
 const back=nodes(full).find(n=>n.type==='button'&&words(n.props.children)==='回到季末交接')!;(back.props.onClick as ()=>void)();expect(ui.draw().props.layout).toBe('direct')
 expect(ui.onClose).not.toHaveBeenCalled();expect(ui.onToday).not.toHaveBeenCalled();expect(ui.p.request).not.toHaveBeenCalled();expect(ui.p.requestWait).not.toHaveBeenCalled()
})

it('forwards the same quarter clock only after closing and choosing Today',()=>{
 const ui=driver(),clock=nodes(ui.draw()).find(n=>n.type===ClockAdvance)!
 expect(clock.props.date).toBe('2020-04-01');expect(clock.props.label).toBe('核对旧约定，进入下一季 · 2020-04-01')
 let binding:ClockActionBinding|undefined
 scoped('clock',()=>renderToStaticMarkup(<ClockAdvance {...clock.props as ComponentProps<typeof ClockAdvance>} renderAction={value=>{binding=value;return value.mainNode}}/>))
 expect(binding?.disabled).toBe(false);binding!.activate();binding!.activate()
 expect(ui.onClose).toHaveBeenCalledTimes(1);expect(ui.onToday).toHaveBeenCalledTimes(1)
 expect(ui.p.requestWait).toHaveBeenCalledExactlyOnceWith('2020-04-01',expect.stringContaining('进入下一季'),true);expect(ui.p.request).not.toHaveBeenCalled()
 expect(ui.onClose.mock.invocationCallOrder[0]).toBeLessThan(ui.onToday.mock.invocationCallOrder[0]!);expect(ui.onToday.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(ui.p.requestWait!).mock.invocationCallOrder[0]!)
})

it('keeps the original quarter when the actual next quarter begins and does not auto-renew work',()=>{
 const ui=driver();ui.draw();const p=props(next),old=ui.draw(p)
 expect(p.features.workbench.quarter).toBe('2020-Q2');expect(p.view.budget.available).toBe(4)
 expect(p.view.operations!.employment.some(e=>e.quarter==='2020-Q2')).toBe(false)
 expect(old.props.title).toBe('2020-Q1 · 这季留下的日子');expect(nodes(old).some(n=>n.type===ClockAdvance)).toBe(false)
 expect(seasonTurnReading(p,seasonRecollection(p,'2020-Q1'))).toBeNull()
 expect(ui.p.request).not.toHaveBeenCalled()
})

it('keeps a real cross-quarter task visible and falls back for more complex or urgent responsibilities',()=>{
 const before=until(working,'2020-03-27'),started=act(before,'StartLifeWork',{kind:'rest',personId:null,reference:null}),p=props(until(started,'2020-03-31')),season=seasonRecollection(p)!,reading=seasonTurnReading(p,season)!
 expect(reading.pending).toHaveLength(1);const item=reading.pending[0]!,html=renderToStaticMarkup(<SeasonTurnSummary value={reading}/>);expect(html).toContain(item.title);expect(html).toContain('2020-04-03');expect(html).toContain(item.line)
 for(const remaining of [[{...item,urgent:true}],[{...item,continuation:'money' as const}],[{...item,continuation:'unknown' as const}],[{...item,continuation:'choice' as const}],[item,{...item,id:'second'}]])expect(seasonTurnReading(p,{...season,remaining})).toBeNull()
 expect(seasonTurnReading(p,{...season,asOf:'2020-03-30'})).toBeNull();expect(seasonTurnReading(p,{...season,closeSourceId:'wrong'})).toBeNull()
 expect(seasonTurnReading(props(working),seasonRecollection(props(working)))).toBeNull()
})

it('marks the actual closing in the room while preserving the original facts and shared leaf action',()=>{
 const p=props(end),focus:OpeningFocus={runId:p.view.runId,kind:'work',accountId:'personal',entityId:p.view.operations!.employment[0]!.id},onRead=vi.fn()
 const html=scoped('room',()=>renderToStaticMarkup(<OpeningMoment p={p} focus={focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(p)} onNavigate={vi.fn()} onExplore={vi.fn()} onRecollection={onRead}/>))
 expect(html).toContain('这一季已走完，下一季怎样过？');expect(html).toContain('2020-Q1 · 季末留页');expect(html).toContain('看看这一季，真实留下了什么');expect(html).toContain('¥24,000')
 expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled();expect(onRead).not.toHaveBeenCalled()
})
