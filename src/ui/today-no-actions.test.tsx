import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {todayThread} from './today-thread.ts'
import {TodayScene} from './TodayScene.tsx'
import {todayIdleReading} from './TodayIdleAction.tsx'
import {ClockAdvance,type ClockActionBinding} from './ClockAdvance.tsx'
import {CommandButton} from './CommandButton.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import type {SharedActionBinding} from './shared-action.ts'

// Public UI and original in-memory proposals; no persistence/codec fixtures.
const hooks=vi.hoisted(()=>({index:0,values:[] as unknown[]}))
const captured=vi.hoisted(()=>({room:null as Record<string,unknown>|null,clock:null as unknown}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(v:T)=>{hooks.values[i]=v}] as const};return {...actual,useState:state,useRef:<T,>(v:T)=>state(()=>({current:v}))[0],useMemo:<T,>(fn:()=>T)=>fn(),useCallback:<T,>(fn:T)=>fn,useEffect:()=>{},useImperativeHandle:()=>{},useId:()=> 'today-zero-ui'}})
vi.mock('./RoomTableau.tsx',async original=>{const actual=await original<typeof import('./RoomTableau.tsx')>();return {...actual,RoomTableau:(p:ComponentProps<typeof actual.RoomTableau>)=>{captured.room=p as unknown as Record<string,unknown>;return <actual.RoomTableau {...p}/>}}})
vi.mock('./ClockAdvance.tsx',async original=>{const actual=await original<typeof import('./ClockAdvance.tsx')>();return {...actual,ClockAdvance:(p:ComponentProps<typeof actual.ClockAdvance>)=>{const render=p.renderAction;return <actual.ClockAdvance {...p} renderAction={render?binding=>{captured.clock=binding;return render(binding)}:undefined}/>}}})
afterEach(()=>{hooks.index=0;hooks.values=[];captured.room=null;captured.clock=null})
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'today-zero-ui',actorId:'player',commandId:'create',seed:'today-zero-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'zero-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify(result));return result.nextRun}
function context(run=initial){const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null},p:GamePanelProps={view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']};return p}
function until(run:GameRun,date:string){for(let i=0;i<30;i++){const w=context(run).features.workbench;if(w.pause){const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;if(choice.costFen||choice.actionPoints)throw Error('EXPECTED_FREE_DEFAULT');run=act(run,'ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}if(run.timeline.cursor.date>=date)return run;run=act(run,'AdvanceTime',{date})}throw Error('TIME_BOUND')}
const rested=until(act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),'2020-01-08'),improved=until(act(rested,'StartLifeWork',{kind:'workspace',personId:null,reference:null}),'2020-01-15'),met=until(act(improved,'StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null}),'2020-01-18'),promise=context(met).features.life.promises.find(o=>o.status==='offered')!,accepted=act(met,'AcceptLifePromise',{promiseId:promise.id,consent:true}),running=act(accepted,'FulfillLifePromise',{promiseId:promise.id}),done=until(running,'2020-01-21')
function data(run=done){const p=context(run),job=p.features.life.jobs.find(j=>j.kind==='workspace')!,focus={runId:run.runId,kind:'life' as const,accountId:'personal',entityId:job?.id??null,selection:'workspace' as const};return {p,today:todayThread(p,focus)!}}
const props=(d:ReturnType<typeof data>):ComponentProps<typeof TodayScene>=>({...d,headingRef:null,onFocus:vi.fn(),onPrepare:vi.fn(),onResume:vi.fn(),onExplore:vi.fn(),onRecollection:vi.fn(),onNavigate:vi.fn()})
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children)]:[]
const words=(n:unknown):string=>typeof n==='string'?n:Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
function render(d:ReturnType<typeof data>){hooks.index=0;return renderToStaticMarkup(<TodayScene {...props(d)}/> )}

it('uses the original wait only after all four normal activities have actually consumed this quarter’s points',()=>{
 const d=data(),value=todayIdleReading(d.p,d.today)!
 expect(d.p.view.budget.available).toBe(0);expect(d.p.view.budget.spent).toBe(4);expect(d.today.ongoing).toHaveLength(0)
 expect(value.title).toBe('这季的行动，已经用完。');expect(value.waitDate).toBe(d.today.wait!.date);expect(value.waitLabel).toBe(d.today.wait!.label);expect(value.waitLabel).toContain('最迟');expect(value.line).toContain('费用和旧约照常发生')
 const html=render(d);expect(html).toContain(value.title);expect(html).toContain('2020-01-15实际完成，投入¥3,000');expect(html).toContain('翻阅今天的选择');expect(html).not.toContain('今天 · 仍可安排');expect(d.p.requestWait).not.toHaveBeenCalled()
})
it('binds the calendar object and main wait to exactly one original clock with its original confirmation request',()=>{
 const d=data(),html=render(d),clock=captured.clock as ClockActionBinding,room=captured.room!,object=room.object as Element
 expect(clock).toBeDefined();expect(object.type).toBe(OpeningObject);expect(object.props.onActivate).toBe(clock.activate);expect(object.props.actionLabel).toBe(clock.label);expect(object.props.stageLabel).toBe('今天 · 先不新增')
 expect(html.match(/class="clock-advance clock-advance-room"/g)).toHaveLength(1);expect(nodes(room.decisions).filter(n=>n.type===ClockAdvance)).toHaveLength(0)
 ;(object.props.onActivate as ()=>void)();expect(d.p.requestWait).toHaveBeenCalledExactlyOnceWith(d.today.wait!.date,expect.stringContaining(d.today.wait!.label),true);expect(d.p.request).not.toHaveBeenCalled()
 let review:SharedActionBinding|undefined;hooks.values=[];hooks.index=0
 renderToStaticMarkup(<CommandButton {...(clock.reviewNode as ReactElement<ComponentProps<typeof CommandButton>>).props} renderAction={(binding,main)=>{review=binding;return main}}/>);review!.activate()
 expect(d.p.requestWait).toHaveBeenLastCalledWith(d.today.wait!.date,'核对后推进 · '+d.today.wait!.date,true)
})
it('keeps all eight original directions readable at zero points and does not issue a command by opening them',()=>{
 const d=data();render(d);const button=nodes(captured.room!.decisions).find(n=>n.type==='button'&&words(n.props.children)==='翻阅今天的选择')!
 ;(button.props.onClick as ()=>void)();const html=render(d)
 for(const text of ['今天，想把时间留给什么？','看看工作','留点时间给自己','做一段视频','准备一堂课','经营一份服务','听听合作需求','看看架空参与','准备一次模拟判断'])expect(html).toContain(text)
 expect(d.p.request).not.toHaveBeenCalled();expect(d.p.requestWait).not.toHaveBeenCalled()
})
it('leaves actual invitations, accepted or running commitments, spare points and quarter-end handoff on their original path',()=>{
 for(const run of [initial,rested,improved,met,accepted,running]){const d=data(run);expect(todayIdleReading(d.p,d.today)).toBeNull()}
 const end=data(until(done,'2020-03-31'));expect(end.p.features.workbench.atQuarterEnd).toBe(true);expect(todayIdleReading(end.p,end.today)).toBeNull()
})
it('requires matching current public date, quarter, budget and obligations before reprioritizing Today',()=>{
 const d=data();for(const source of [{...d.today.source,runId:'other'},{...d.today.source,revision:0},{...d.today.source,date:'2020-01-20'},{...d.today.source,quarter:'2020-Q2'}])expect(todayIdleReading(d.p,{...d.today,source})).toBeNull()
 expect(todayIdleReading(d.p,{...d.today,responsibilityOverrideNeeded:true})).toBeNull();expect(todayIdleReading(d.p,{...d.today,wait:null})).toBeNull()
 expect(todayIdleReading({...d.p,view:{...d.p.view,budget:{...d.p.view.budget,spent:3}}},d.today)).toBeNull()
 const finance=d.p.features.workbench.finance.map((f,i)=>i?f:{...f,commitmentShortfallFen:100})
 expect(todayIdleReading({...d.p,features:{...d.p.features,workbench:{...d.p.features.workbench,finance}}},d.today)).toBeNull()
})
it('distinguishes a public reserved-budget display sample from points already consumed',()=>{
 const d=data(),sample={...d.p,view:{...d.p.view,budget:{...d.p.view.budget,spent:2,reserved:2}}},reading=todayIdleReading(sample,d.today)!
 expect(reading.title).toBe('这季的行动，已经排进日历。');expect(reading.line).toContain('预留仍属于原安排')
})
