import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {OpeningFocus} from './player-thread.ts'
import {todayThread} from './today-thread.ts'
import {todayWaitReading} from './today-wait-reading.ts'
import {TodayWaitCue} from './TodayWaitCue.tsx'
import {TodayScene} from './TodayScene.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {OpeningObject} from './OpeningObject.tsx'

// Normal in-memory proposals and original public forecasts; no storage/codec.
const capture=vi.hoisted(()=>({room:null as ComponentProps<typeof RoomTableau>|null}))
vi.mock('./RoomTableau.tsx',async original=>{const actual=await original<typeof import('./RoomTableau.tsx')>();return {...actual,RoomTableau:(p:ComponentProps<typeof actual.RoomTableau>)=>{capture.room=p;return <actual.RoomTableau {...p}/>}}})
afterEach(()=>{capture.room=null;vi.clearAllMocks()})
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'today-wait-ui',actorId:'player',commandId:'create',seed:'today-wait-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'wait-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error(JSON.stringify(r));return r.nextRun}
const working=act(initial,'WorkQuarter'),rest=act(working,'StartLifeWork',{kind:'rest',personId:null,reference:null}),parallel=act(rest,'ResearchMarket',{definitionId:'market-overview'})
function input(run=parallel):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']}}
function context(run=parallel){const p=input(run),focus:OpeningFocus={runId:p.view.runId,kind:'work',accountId:'personal',entityId:p.view.operations!.employment[0]!.id},today=todayThread(p,focus)!,value=todayWaitReading(p,today);return {p,focus,today,value}}
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children)]:[]
const words=(n:unknown):string=>typeof n==='string'||typeof n==='number'?String(n):Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''

it('shows research, rest and wage dates from exactly the same original public objects',()=>{
 const c=context(),v=c.value!;expect(v).not.toBeNull();expect(v.items.map(row=>[row.label,row.date])).toEqual([['公开资料','2020-01-02'],['休整','2020-01-08'],['工资回响','2020-01-31']]);expect(c.p.view.budget.available).toBe(0)
 for(const row of v.items){const originals=c.today.ongoing.filter(item=>JSON.stringify(item.focus)===JSON.stringify(row.focus));expect(originals).toHaveLength(1);expect(originals[0]!.wait!.date).toBe(row.date)}
 expect(c.p.request).not.toHaveBeenCalled();expect(c.p.requestWait).not.toHaveBeenCalled()
})
it('selects each exact original focus without advancing a date or making another arrangement',()=>{
 const c=context(),onChoose=vi.fn(),onAll=vi.fn(),before=JSON.stringify({accounts:c.p.view.accounts,budget:c.p.view.budget,date:c.p.view.date}),tree=TodayWaitCue({p:c.p,value:c.value!,onChoose,onAll}),buttons=nodes(tree).filter(n=>n.type==='button')
 expect(buttons).toHaveLength(3);for(const [i,b] of buttons.entries()){(b.props.onClick as ()=>void)();expect(onChoose).toHaveBeenLastCalledWith(c.value!.items[i]!.focus)}
 expect(onAll).not.toHaveBeenCalled();expect(c.p.request).not.toHaveBeenCalled();expect(c.p.requestWait).not.toHaveBeenCalled();expect(JSON.stringify({accounts:c.p.view.accounts,budget:c.p.view.budget,date:c.p.view.date})).toBe(before)
 const html=renderToStaticMarkup(tree);expect(html).toContain('原预计日期 · 费用、来信可能先到');expect(html).not.toContain('保证');expect(html).not.toContain('即将到账')
})
it('removes only an actually completed research and then retires the multi-item cue when rest really finishes',()=>{
 const first=act(parallel,'AdvanceTime',{date:'2020-01-02'}),c=context(first);expect(c.p.features.market.researches[0]!.status).toBe('completed');expect(c.value!.items.map(row=>row.label)).toEqual(['休整','工资回响'])
 const stopped=act(first,'AdvanceTime',{date:'2020-01-06'}),done=act(stopped,'AdvanceTime',{date:'2020-01-08'}),last=context(done);expect(last.p.features.life.jobs[0]!.status).toBe('completed');expect(last.value).toBeNull();expect(last.p.view.budget.available).toBe(0);expect(last.p.view.accounts).toEqual(context().p.view.accounts);expect(last.p.view.operations!.employment[0]!.id).toBe(c.p.view.operations!.employment[0]!.id)
})
it('falls back for incomplete, duplicate, stale, mismatched-date and non-personal coverage without claiming the rest is empty',()=>{
 const c=context(),t=c.today,duplicate={...t,ongoing:[...t.ongoing,t.ongoing[0]!]}
 expect(todayWaitReading(c.p,duplicate)).toBeNull();expect(todayWaitReading(c.p,{...t,ongoing:t.ongoing.slice(0,-1)})).toBeNull();expect(todayWaitReading(c.p,{...t,source:{...t.source,revision:t.source.revision-1}})).toBeNull();expect(todayWaitReading(c.p,{...t,responsibilityOverrideNeeded:true})).toBeNull();expect(todayWaitReading({...c.p,features:{...c.p.features,life:{...c.p.features.life,asOf:'2019-12-31'}}},t)).toBeNull()
 const changed={...t,ongoing:t.ongoing.map((item,i)=>i===0?{...item,wait:{date:'2020-01-03',label:'mismatched public date'}}:item)};expect(todayWaitReading(c.p,changed)).toBeNull()
 const other={...t.ongoing[0]!,focus:{...c.focus,accountId:'another-account'}};expect(todayWaitReading(c.p,{...t,ongoing:[...t.ongoing,other]})).toBeNull();expect(todayWaitReading({...c.p,features:{...c.p.features,workbench:{...c.p.features.workbench,atQuarterEnd:true}}},t)).toBeNull()
})
it('keeps original Today primary/object, wait date, expenses and complete ongoing reader while adding source-bound date choices',()=>{
 const c=context(),onFocus=vi.fn(),html=renderToStaticMarkup(<TodayScene p={c.p} today={c.today} headingRef={null} onFocus={onFocus} onPrepare={vi.fn()} onResume={vi.fn()} onExplore={vi.fn()} onRecollection={vi.fn()} onNavigate={vi.fn()}/>),room=capture.room!,cue=room.context as ReactElement<ComponentProps<typeof TodayWaitCue>>,clock=nodes(room.decisions).find(n=>n.type===ClockAdvance)!,primary=nodes(room.decisions).find(n=>n.type==='button'&&n.props['aria-label'])!,object=room.object as ReactElement<ComponentProps<typeof OpeningObject>>
 expect(cue.type).toBe(TodayWaitCue);expect(cue.props.value.items).toHaveLength(3);expect(clock.props.date).toBe(c.today.wait!.date);expect(clock.props.p).toBe(c.p);expect(object.props.onActivate).toBe(primary.props.onClick);expect(html).toContain('继续哪件事');expect(html).toContain(c.today.wait!.label);expect(html).toContain('2020-01-31')
 cue.props.onChoose(c.value!.items[0]!.focus);expect(onFocus).toHaveBeenCalledExactlyOnceWith(c.value!.items[0]!.focus);expect(c.p.request).not.toHaveBeenCalled();expect(c.p.requestWait).not.toHaveBeenCalled()
})
it('leaves uncertain or single-item Today on its original presentation',()=>{
 const c=context(working),html=renderToStaticMarkup(<TodayScene p={c.p} today={c.today} headingRef={null} onFocus={vi.fn()} onPrepare={vi.fn()} onResume={vi.fn()} onExplore={vi.fn()} onRecollection={vi.fn()} onNavigate={vi.fn()}/>);expect(html).not.toContain('today-wait-cue');expect(html).toContain('继续这季的工作')
})
it('retains extra items through an explicit original-reader action and makes stale callbacks inert',()=>{
 const c=context(),onChoose=vi.fn(),onAll=vi.fn()
 // UI-only overflow shape, not a claim that this duplicate is legal gameplay.
 const v={...c.value!,items:[...c.value!.items,{...c.value!.items[0]!,key:'shape-only-fourth'}]},tree=TodayWaitCue({p:c.p,value:v,onChoose,onAll}),buttons=nodes(tree).filter(n=>n.type==='button')
 expect(buttons).toHaveLength(4);expect(words(buttons[3]!.props.children)).toBe('还有1项原安排 ↗');(buttons[3]!.props.onClick as ()=>void)();expect(onAll).toHaveBeenCalledTimes(1);expect(onChoose).not.toHaveBeenCalled()
 Object.assign(c.p.controller.snapshot,{view:{...c.p.view,revision:c.p.view.revision+1}});for(const b of buttons)(b.props.onClick as ()=>void)();expect(onAll).toHaveBeenCalledTimes(1);expect(onChoose).not.toHaveBeenCalled();expect(c.p.request).not.toHaveBeenCalled()
})
