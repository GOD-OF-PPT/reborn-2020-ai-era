import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps} from './game-types.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {TodayScene} from './TodayScene.tsx'
import {TodayParallelChoice} from './TodayParallelChoice.tsx'
import {Dialog} from './Dialog.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {dayChoiceCurrent,dayPerspectiveCurrent} from './day-perspective.ts'
import {playerThread} from './player-thread.ts'
// Actual normal commands in memory plus separately mounted UI owners.
const hooks=vi.hoisted(()=>({slots:new Map<string,unknown[]>(),values:[] as unknown[],index:0}))
vi.mock('react',async original=>{const a=await original<typeof import('react')>();const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++,values=hooks.values;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const};return {...a,useState:state,useRef:<T,>(value:T)=>state(()=>({current:value}))[0],useEffect:()=>{},useImperativeHandle:()=>{},useMemo:<T,>(fn:()=>T)=>fn(),useCallback:<T,>(fn:T)=>fn,useId:()=> 'reply-rhythm-ui'}})
function mounted<T>(key:string,fn:()=>T){const old=hooks.values,index=hooks.index;hooks.values=hooks.slots.get(key)??[];hooks.slots.set(key,hooks.values);hooks.index=0;try{return fn()}finally{hooks.values=old;hooks.index=index}}
afterEach(()=>{hooks.slots.clear();hooks.values=[];hooks.index=0;vi.clearAllMocks()})
type E=ReactElement<Record<string,unknown>>
const nodes=(v:unknown):E[]=>Array.isArray(v)?v.flatMap(nodes):isValidElement<Record<string,unknown>>(v)?[v,...nodes(v.props.children),...nodes(v.props.heading),...nodes(v.props.context),...nodes(v.props.feedback),...nodes(v.props.facts),...nodes(v.props.decisions),...nodes(v.props.object),...nodes(v.props.record),...nodes(v.props.footer)]:[]
const text=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(text).join(''):isValidElement<Record<string,unknown>>(v)?text(v.props.children):''
function unwrap(value:unknown){let current=value;for(let n=0;n<12&&isValidElement<{children?:unknown}>(current)&&typeof current.props.children==='function';n++)current=(current.props.children as (v:undefined)=>unknown)(undefined);return current}
const registry=createCampaignRegistry()
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'reply-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_COMMAND_REQUIRED:'+kind);return result.nextRun}
function viewOf(run:GameRun):GamePanelProps['view']{return {...projectRun(run),features:registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}}
function input(run:GameRun):GamePanelProps{const view=viewOf(run);return {view,features:view.features as unknown as GamePanelProps['features'],accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId)} as unknown as GamePanelProps['controller']}}
let initial=createCampaignRun({runId:'reply-rhythm-normal',actorId:'player',commandId:'create',seed:'reply-rhythm-normal',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
initial=act(initial,'DeclineOffer',{offerId:'manual-first-2020'})
function normalReply(){
 let run=act(initial,'WorkQuarter'),origin=run
 for(let n=0;n<80;n++){
  const p=input(run),w=p.features.workbench,focus={runId:run.runId,kind:'work' as const,accountId:'personal',entityId:p.features.workbench.employment[0]?.id??null}
  if(w.pause){const event=w.events.find(e=>e.isBlocking),choice=event?.choices.find(c=>c.isDefault);if(!event||!choice||choice.costFen||choice.actionPoints)throw Error('PUBLIC_FREE_DEFAULT_REQUIRED');const after=act(run,'ChooseEvent',{instanceId:event.id,choiceId:choice.id});if(playerThread(p,focus).responsibilityOverrideNeeded&&!playerThread(input(after),focus).responsibilityOverrideNeeded)return {origin,paused:run,after,focus};run=after;continue}
  if(w.atQuarterEnd){if(!w.progression.nextQuarterDate)throw Error('PUBLIC_NEXT_QUARTER_REQUIRED');run=act(run,'AdvanceTime',{date:w.progression.nextQuarterDate});run=act(run,'WorkQuarter');origin=run;continue}
  run=act(run,'AdvanceTime',{date:w.quarterEnd})
 }
 throw Error('NORMAL_REPLY_NOT_FOUND')
}
const scenario=normalReply()
function driver(){
 let current=scenario.origin
 const first=input(current),controller=first.controller,request=vi.fn(),onFocus=vi.fn(),onNavigate=vi.fn(),originFocus={...scenario.focus,entityId:first.features.workbench.employment[0]!.id}
 const args:ComponentProps<typeof OpeningMoment>={p:{...first,request,controller},focus:originFocus,onFocus,onNavigate,headingRef:null,fallback:roomMoment(first),onExplore:vi.fn(),todayView:false,onToday:()=>{args.todayView=true},onReturnFocus:()=>{args.todayView=false}}
 const set=(run:GameRun)=>{current=run;const p=input(run);Object.assign(controller.snapshot,{view:p.view,busy:false});Object.assign(controller,{preview:(c:CommandEnvelope)=>previewCommand(current,c,registry,current.actorId)});args.p={...p,request,controller};args.fallback=roomMoment(args.p)}
 const draw=()=>unwrap(mounted('opening',()=>OpeningMoment(args)))
 const today=()=>{const node=draw();if(!isValidElement<ComponentProps<typeof TodayScene>>(node)||node.type!==TodayScene)throw Error('TODAY_REQUIRED');return node}
 const body=()=>unwrap(mounted('today',()=>TodayScene(today().props)))
 const open=()=>{const button=nodes(draw()).find(n=>n.type==='button'&&(String(n.props['aria-label']??'').includes('回到今天，看看其它安排')||text(n.props.children).includes('回到今天，看看其它安排')));if(!button||button.props.disabled)throw Error('ORIGINAL_TODAY_ACTION_REQUIRED');(button.props.onClick as ()=>void)()}
 const close=()=>{const dialog=nodes(body()).find(n=>n.type===Dialog);if(!dialog)throw Error('ORIGINAL_COMPARISON_REQUIRED');(dialog.props.onClose as ()=>void)()}
 return {args,controller,request,onFocus,onNavigate,draw,today,body,open,close,set}
}
function afterReply(){const h=driver();h.open();expect(h.today().props.initialChoice).toBe('daily');expect(nodes(h.body()).some(n=>n.type===Dialog)).toBe(true);h.close();expect(nodes(h.body()).some(n=>n.type===Dialog)).toBe(false);h.set(scenario.paused);const paused=h.draw();expect(isValidElement(paused)&&paused.type).not.toBe(TodayScene);hooks.slots.delete('today');h.set(scenario.after);h.args.feedback=<p data-testid="reply-result">这次原回应已经实际完成。</p>;return h}

it('keeps Today reading across an actual same-day reply while retiring the earlier menu request',()=>{const before=viewOf(scenario.origin),paused=viewOf(scenario.paused),after=viewOf(scenario.after),request={runId:before.runId,revision:before.revision};expect(after.date).toBe(paused.date);expect(after.revision).toBe(paused.revision+1);expect(dayPerspectiveCurrent(after,request)).toBe(true);expect(dayChoiceCurrent(before,request)).toBe(true);expect(dayChoiceCurrent(after,request)).toBe(false)})
it('rebuilds after the actual mandatory reply with no old comparison even before cleanup effects run',()=>{const h=afterReply(),node=h.today();expect(node.props.initialChoice).toBeNull();expect(node.props.today.primary.thread.focus.entityId).toBe(h.args.focus!.entityId);const rows=nodes(h.body()),table=rows.find(n=>n.type===RoomTableau)!;expect(rows.some(n=>n.type===Dialog)).toBe(false);expect(nodes(table.props.feedback).some(n=>n.props['data-testid']==='reply-result')).toBe(true);expect(h.request).not.toHaveBeenCalled();expect(h.onFocus).not.toHaveBeenCalled();expect(h.onNavigate).not.toHaveBeenCalled()})
it('a fresh explicit choice still opens the same work/life comparison after the reply',()=>{const h=afterReply();expect(h.today().props.initialChoice).toBeNull();const entry=nodes(h.body()).find(n=>n.type===TodayParallelChoice)!;expect(entry).toBeTruthy();const button=mounted('parallel',()=>TodayParallelChoice(entry.props as unknown as ComponentProps<typeof TodayParallelChoice>));if(!button||button.props.disabled)throw Error('CURRENT_EXPLICIT_READING_REQUIRED');button.props.onClick();expect(nodes(h.body()).some(n=>n.type===Dialog&&n.props.title==='等候时，怎样安排这段日子？')).toBe(true);expect(h.request).not.toHaveBeenCalled();expect(h.onFocus).not.toHaveBeenCalled()})
it('same-commit candidate and readonly reading do not become a later committed menu request',()=>{const v=viewOf(scenario.origin),request={runId:v.runId,revision:v.revision};for(const saveStatus of ['saved','unsaved','read_only'] as const){const view={...v,saveStatus,hasCandidate:saveStatus==='unsaved',readOnly:saveStatus==='read_only'};expect(dayChoiceCurrent(view,request)).toBe(true);expect(dayChoiceCurrent({...view,revision:view.revision+1},request)).toBe(false)}})
it('foreign lives, future requests and nonplaying phases cannot open an old comparison',()=>{const v=viewOf(scenario.after),request={runId:v.runId,revision:v.revision};expect(dayChoiceCurrent(v,null)).toBe(false);expect(dayChoiceCurrent(v,{...request,runId:'another-life'})).toBe(false);expect(dayChoiceCurrent(v,{...request,revision:v.revision+1})).toBe(false);expect(dayChoiceCurrent({...v,phase:'epilogue'},request)).toBe(false)})
it('a genuinely saved new arrangement still retires the old Today perspective and its menu',()=>{const next=act(scenario.origin,'ResearchMarket',{definitionId:'market-overview'}),before=viewOf(scenario.origin),request={runId:before.runId,revision:before.revision};expect(dayPerspectiveCurrent(viewOf(next),request)).toBe(false);expect(dayChoiceCurrent(viewOf(next),request)).toBe(false)})
