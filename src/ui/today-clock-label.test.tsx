import {afterEach,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import type {ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps} from './game-types.ts'
import {TodayScene} from './TodayScene.tsx'
import {ClockAdvance,type ClockActionBinding} from './ClockAdvance.tsx'
import {todayThread} from './today-thread.ts'
// Normal in-memory projections and original UI request routing only.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
const capture=vi.hoisted(()=>({clocks:[] as unknown[]}))
vi.mock('react',async original=>{const a=await original<typeof import('react')>();const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T)=>{hooks.values[i]=next}] as const};return {...a,useState:state,useRef:<T,>(v:T)=>state(()=>({current:v}))[0],useMemo:<T,>(f:()=>T)=>f(),useCallback:<T,>(fn:T)=>fn,useEffect:()=>{},useImperativeHandle:()=>{},useId:()=> 'today-clock-label'}})
vi.mock('./ClockAdvance.tsx',async original=>{const a=await original<typeof import('./ClockAdvance.tsx')>();return {...a,ClockAdvance:(p:ComponentProps<typeof a.ClockAdvance>)=>{capture.clocks.push(p);return <a.ClockAdvance {...p}/>}}})
afterEach(()=>{hooks.values=[];hooks.index=0;capture.clocks=[];vi.clearAllMocks()})
const registry=createCampaignRegistry()
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'clock-label-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error('NORMAL_COMMAND_REQUIRED:'+kind);return r.nextRun}
let initial=createCampaignRun({runId:'today-clock-label',actorId:'player',commandId:'create',seed:'today-clock-label',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
initial=act(initial,'DeclineOffer',{offerId:'manual-first-2020'})
const work=act(initial,'WorkQuarter'),rest=act(work,'StartLifeWork',{kind:'rest',personId:null,reference:null}),parallel=act(rest,'ResearchMarket',{definitionId:'market-overview'})
function input(run=parallel):GamePanelProps{const features=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:features as unknown as GamePanelProps['features'],accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']}}
function read(p=input()){
 const focus={runId:p.view.runId,kind:'work' as const,accountId:'personal',entityId:p.features.workbench.employment[0]?.id??null},today=todayThread(p,focus)!
 hooks.values=[];hooks.index=0;capture.clocks=[]
 const html=renderToStaticMarkup(<TodayScene p={p} today={today} headingRef={null} onFocus={vi.fn()} onPrepare={vi.fn()} onResume={vi.fn()} onExplore={vi.fn()} onRecollection={vi.fn()} onNavigate={vi.fn()}/>),clock=capture.clocks[0] as ComponentProps<typeof ClockAdvance>
 return {p,today,html,clock}
}
function binding(clock:ComponentProps<typeof ClockAdvance>){let found:ClockActionBinding|null=null;hooks.values=[];hooks.index=0;renderToStaticMarkup(<ClockAdvance {...clock} renderAction={value=>{found=value;return <>{value.reviewNode}{value.mainNode}</>}}/>);if(!found)throw Error('ORIGINAL_CLOCK_BINDING_REQUIRED');return found as ClockActionBinding}
function until(run:GameRun,date:string){for(let n=0;n<40;n++){const p=input(run),w=p.features.workbench;if(w.pause){const e=w.events.find(e=>e.isBlocking),c=e?.choices.find(c=>c.isDefault);if(!e||!c||c.costFen||c.actionPoints)throw Error('PUBLIC_FREE_DEFAULT_REQUIRED');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:c.id})}else if(p.view.date>=date)return run;else run=act(run,'AdvanceTime',{date})}throw Error('PUBLIC_CALENDAR_LIMIT')}

it('distinguishes the actual public object dates from the original later semantic wait limit',()=>{const c=read();expect(c.p.view.budget.available).toBe(0);expect(c.today.ongoing.map(i=>i.wait?.date)).toEqual(expect.arrayContaining(['2020-01-02','2020-01-08','2020-01-31']));expect(c.clock.date).toBe(c.today.wait!.date);expect(c.clock.date).toBe(c.p.features.life.jobs.find(job=>job.kind==='rest')!.completeAt);expect(c.clock.date>'2020-01-02').toBe(true);expect(c.clock.label).toBe(c.today.wait!.label+' · '+c.today.wait!.date);expect(c.clock.label).toContain('最迟');for(const date of ['2020-01-02','2020-01-08','2020-01-31',c.clock.date])expect(c.html).toContain(date);expect(c.p.request).not.toHaveBeenCalled();expect(c.p.requestWait).not.toHaveBeenCalled()})
it('uses the same original bounded requestWait and independent review, without shortening or submitting directly',()=>{const c=read(),b=binding(c.clock);b.activate();expect(c.p.requestWait).toHaveBeenCalledExactlyOnceWith(c.today.wait!.date,expect.stringContaining('最迟'),true);expect(c.p.request).not.toHaveBeenCalled();expect(c.p.view.date).toBe('2020-01-01');expect(c.clock.p).toBe(c.p)})
it('a legacy direct time channel keeps its original date and never claims a semantic feedback stop',()=>{const p={...input(),requestWait:undefined},c=read(p);expect(c.clock.date).toBe(c.today.wait!.date);expect(c.clock.label).toBe(c.today.wait!.label+' · '+c.clock.date);expect(c.clock.label).not.toContain('最迟');binding(c.clock).activate();expect(p.request).toHaveBeenCalledExactlyOnceWith('AdvanceTime',{date:c.clock.date},expect.stringContaining(c.today.wait!.label),true)})
it('the actual quarter-end handoff retains the original next-quarter label and date',()=>{const c=read(input(until(parallel,'2020-03-31')));expect(c.p.features.workbench.atQuarterEnd).toBe(true);expect(c.today.wait!.label).toBe('核对旧约定，进入下一季');expect(c.clock.label).toBe(c.today.wait!.label+' · '+c.today.wait!.date);expect(c.clock.date).toBe(c.today.wait!.date);expect(c.clock.label).not.toContain('最迟');expect(c.p.requestWait).not.toHaveBeenCalled()})
it.each(['read_only','unsaved','conflict'] as const)('%s keeps the same date reading without granting time authority',saveStatus=>{const base=input(),view={...base.view,saveStatus,readOnly:saveStatus==='read_only',hasCandidate:saveStatus==='unsaved'},p={...base,view};Object.assign(p.controller.snapshot,{view});const c=read(p),b=binding(c.clock);expect(b.disabled).toBe(true);b.activate();expect(p.requestWait).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled();expect(c.clock.date).toBe(c.today.wait!.date)})
