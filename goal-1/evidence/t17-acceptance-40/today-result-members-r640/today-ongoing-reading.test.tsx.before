import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {OpeningFocus} from './player-thread.ts'
import {todayThread} from './today-thread.ts'
import {sceneMeaning} from './scene-meaning.ts'
import {todayOngoingReading} from './today-ongoing-reading.ts'
import {TodayScene} from './TodayScene.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {OpeningObject} from './OpeningObject.tsx'

// Original normal proposals and public UI only. No store/codec or saved fixtures.
const capture=vi.hoisted(()=>({room:null as ComponentProps<typeof RoomTableau>|null}))
vi.mock('./RoomTableau.tsx',async original=>{const actual=await original<typeof import('./RoomTableau.tsx')>();return {...actual,RoomTableau:(p:ComponentProps<typeof actual.RoomTableau>)=>{capture.room=p;return <actual.RoomTableau {...p}/>}}})
afterEach(()=>{capture.room=null;vi.clearAllMocks()})
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'today-ongoing-ui',actorId:'player',commandId:'create',seed:'today-ongoing-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'ongoing-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error(JSON.stringify(r));return r.nextRun}
const working=act(initial,'WorkQuarter')
function input(run:GameRun):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']}}
function until(run:GameRun,date:string){for(let n=0;n<50;n++){const w=input(run).features.workbench;if(w.pause){const e=w.events.find(e=>e.isBlocking)!,c=e.choices.find(c=>c.isDefault)!;if(c.costFen||c.actionPoints)throw Error('EXPECTED_FREE_ORIGINAL_REPLY');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:c.id});continue}if(run.timeline.cursor.date>=date)return run;run=act(run,'AdvanceTime',{date})}throw Error('TIME_BOUND')}
function context(run:GameRun,f?:OpeningFocus){const p=input(run),focus=f??{runId:p.view.runId,kind:'work' as const,accountId:'personal',entityId:p.view.operations?.employment[0]?.id??null},today=todayThread(p,focus)!;return {p,focus,today}}
const generic='还有1件已经答应的事，正在照约定继续。'
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children)]:[]
const words=(n:unknown):string=>typeof n==='string'?n:Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
function scene(c:ReturnType<typeof context>){const onFocus=vi.fn(),html=renderToStaticMarkup(<TodayScene p={c.p} today={c.today} headingRef={null} onFocus={onFocus} onPrepare={vi.fn()} onResume={vi.fn()} onExplore={vi.fn()} onRecollection={vi.fn()} onNavigate={vi.fn()}/>);return {html,onFocus,room:capture.room!}}

it('names the real sole work and consolidates only the exact generic facts, preserving primary/object/Clock',()=>{
 const c=context(working),before=JSON.stringify(c.p.view),raw=sceneMeaning(c.p,c.today.primary.thread)!.situation,value=todayOngoingReading(c.p,c.today,raw)!,s=scene(c),object=s.room.object as ReactElement<ComponentProps<typeof OpeningObject>>,primary=nodes(s.room.decisions).find(n=>n.type==='button'&&n.props['aria-label'])!,clock=nodes(s.room.decisions).find(n=>n.type===ClockAdvance)!
 expect(value).toEqual({title:'工作还在继续，今天怎么过？',line:'本季尚无工资实收 · 下一次反馈预计2020-01-31。',merged:true});expect(s.html).toContain(value.title);expect(s.html).toContain(value.line);expect(s.html).not.toContain('还有1件已经答应');expect(s.html).not.toContain('仍在继续：')
 expect(object.props.onActivate).toBe(primary.props.onClick);expect(clock.props.date).toBe(c.today.wait!.date);expect(clock.props.p).toBe(c.p);(primary.props.onClick as ()=>void)();expect(s.onFocus).toHaveBeenCalledExactlyOnceWith(c.today.ongoing[0]!.focus);expect(c.p.request).not.toHaveBeenCalled();expect(c.p.requestWait).not.toHaveBeenCalled();expect(JSON.stringify(c.p.view)).toBe(before)
})
it('keeps zero-action ongoing work factual and uses actual wages as historical total, not a new payday',()=>{
 const full=act(act(working,'StartLifeWork',{kind:'rest',personId:null,reference:null}),'ResearchMarket',{definitionId:'market-overview'}),used=context(until(full,'2020-01-08'));expect(used.p.view.budget.available).toBe(0);expect(todayOngoingReading(used.p,used.today,generic)!.line).toContain('尚无工资实收')
 const feb=context(until(working,'2020-02-02')),value=todayOngoingReading(feb.p,feb.today,sceneMeaning(feb.p,feb.today.primary.thread)!.situation)!
 expect(value.merged).toBe(true);expect(value.line).toBe('本季已实收工资¥8,000 · 下一次反馈预计2020-02-29。');expect(value.title).not.toContain('工资到了');expect(feb.p.view.operations!.payroll.some(row=>row.through==='2020-01-31'&&row.amountFen===800000)).toBe(true)
})
it.each(['rest','workspace'] as const)('names a sole running %s and keeps its real paid cost/original used point and dates',kind=>{
 const run=act(initial,'StartLifeWork',{kind,personId:null,reference:null}),p=input(run),job=p.features.life.jobs[0]!,f:OpeningFocus={runId:p.view.runId,kind:'life',accountId:'personal',selection:kind,entityId:job.id},c=context(run,f),raw=sceneMeaning(c.p,c.today.primary.thread)!.situation,value=todayOngoingReading(c.p,c.today,raw)!,s=scene(c)
 expect(value.merged).toBe(true);expect(value.title).toContain(kind==='rest'?'休整还在继续':'住处还在改善');expect(value.line).toBe('2020-01-01—2020-01-08 · 已付'+(kind==='rest'?'¥0':'¥3,000')+' / 已用1点，尚未完成。');expect(s.html).toContain(value.line);expect(s.html).not.toContain('仍在继续：');expect(c.p.request).not.toHaveBeenCalled()
})
it.each(['market-overview','market-foundation-course','simulation-special-study'] as const)('names the sole %s without revealing future prices, trading or granting a pending qualification',definitionId=>{
 const run=act(initial,'ResearchMarket',{definitionId}),p=input(run),research=p.features.market.researches[0]!,f:OpeningFocus={runId:p.view.runId,kind:'market',accountId:'personal',entityKind:'research',entityId:research.id},c=context(run,f),one=c.today.ongoing[0]!,value=todayOngoingReading(c.p,c.today,one.line)!,s=scene(c)
 expect(value.merged).toBe(true);expect(value.title).toContain('还在继续');expect(value.line).toContain(research.startAt+'—'+research.completeAt);expect(value.line).toContain('不揭示未来价格，不代你交易');expect(value.title+value.line).not.toContain('已取得');expect(s.html).toContain(value.title);expect(s.html).not.toContain('仍在继续：');expect(c.p.request).not.toHaveBeenCalled()
})
it('keeps an accepted parent-promise focus while reading only its original running child, without changing the decision target',()=>{
 const start=act(initial,'StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null}),met=act(start,'AdvanceTime',{date:'2020-01-04'}),promise=input(met).features.life.promises[0]!,accepted=act(met,'AcceptLifePromise',{promiseId:promise.id,consent:true}),running=act(accepted,'FulfillLifePromise',{promiseId:promise.id}),p=input(running),f:OpeningFocus={runId:p.view.runId,kind:'life',accountId:'personal',selection:'tang-ying',entityId:promise.id},c=context(running,f),value=todayOngoingReading(c.p,c.today,generic)!,s=scene(c),main=nodes(s.room.decisions).find(n=>n.type==='button'&&n.props['aria-label'])!
 expect(value.title).toBe('答应唐萤的事，还在进行。');expect(value.line).toContain('已付¥300 / 已用1点');expect(value.line).toContain('2020-01-04—2020-01-07');expect(c.today.ongoing[0]!.focus.entityId).toBe(promise.id);(main.props.onClick as ()=>void)();expect(s.onFocus).toHaveBeenCalledExactlyOnceWith(c.today.ongoing[0]!.focus);expect(c.p.request).not.toHaveBeenCalled()
 const wrong={...c.p,features:{...c.p.features,life:{...c.p.features.life,promises:c.p.features.life.promises.map(row=>({...row,status:'missed' as const}))}}};expect(todayOngoingReading(wrong,c.today,generic)).toBeNull()
})
it('names a sole known-person shared work from its actual source without inventing a promise',()=>{
 const run=act(initial,'StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null}),p=input(run),job=p.features.life.jobs[0]!,f:OpeningFocus={runId:p.view.runId,kind:'life',accountId:'personal',selection:'tang-ying',entityId:job.id},c=context(run,f),v=todayOngoingReading(c.p,c.today,generic)!
 expect(v.title).toBe('与唐萤的相处，还在继续。');expect(v.line).toContain('已付¥200 / 已用1点');expect(c.p.features.life.promises).toHaveLength(0)
})
it('keeps different completed-life money and unfamiliar extra obligations visible instead of merging them into work facts',()=>{
 const done=until(act(working,'StartLifeWork',{kind:'workspace',personId:null,reference:null}),'2020-01-08'),p=input(done),job=p.features.life.jobs[0]!,f:OpeningFocus={runId:p.view.runId,kind:'life',accountId:'personal',selection:'workspace',entityId:job.id},c=context(done,f),raw=sceneMeaning(c.p,c.today.primary.thread)!.situation,value=todayOngoingReading(c.p,c.today,raw)!,s=scene(c)
 expect(value.title).toContain('工作还在继续');expect(value.merged).toBe(false);expect(s.html).toContain('2020-01-08实际完成，投入¥3,000');expect(s.html).toContain('仍在继续：')
 const extra=raw+' 另有原客户款¥500待核。';expect(todayOngoingReading(c.p,c.today,extra)!.merged).toBe(false);expect(c.p.request).not.toHaveBeenCalled()
})
it('falls back for stale, history, strong, multi-object, altered dates or unknown object narratives and foreign accounts',()=>{
 const c=context(working),t=c.today,one=t.ongoing[0]!
 for(const today of [{...t,source:{...t.source,revision:t.source.revision-1}},{...t,responsibilityOverrideNeeded:true},{...t,primary:{...t.primary,classification:'history' as const}},{...t,ongoing:[one,one]},{...t,ongoing:[{...one,title:one.title+'原退款¥100'}]},{...t,ongoing:[{...one,line:one.line+'未知责任'}]},{...t,ongoing:[{...one,wait:{date:'2020-01-30',label:'mismatch'}}]},{...t,ongoing:[{...one,focus:{...one.focus,accountId:'company'}}]}])expect(todayOngoingReading(c.p,today,generic)).toBeNull()
 const multi=context(act(working,'StartLifeWork',{kind:'rest',personId:null,reference:null}));expect(todayOngoingReading(multi.p,multi.today,generic)).toBeNull();const stopped=context(act(working,'QuitWork'));expect(todayOngoingReading(stopped.p,stopped.today,generic)).toBeNull()
})
it('does not publish guessed or malformed life money and keeps a completed result on the original next-choice presentation',()=>{
 const run=act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),p=input(run),job=p.features.life.jobs[0]!,f:OpeningFocus={runId:p.view.runId,kind:'life',accountId:'personal',selection:'rest',entityId:job.id},c=context(run,f),changed={...c.p,features:{...c.p.features,life:{...c.p.features.life,jobs:c.p.features.life.jobs.map(row=>({...row,costFen:-1}))}}}
 expect(todayOngoingReading(changed,todayThread(changed,f)!,generic)).toBeNull();const done=context(until(run,'2020-01-08'),f);expect(todayOngoingReading(done.p,done.today,generic)).toBeNull();expect(scene(done).html).toContain('歇过之后，想从哪里开始？')
})
