import {afterEach,expect,it,vi} from 'vitest'
import {Children,isValidElement,type ReactNode,type ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {lifeSceneProgress} from './life-scene-progress.ts'
import {lifeActionPauseReading} from './life-action-pause.ts'
import {LifeActionPause} from './LifeActionPause.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance,type ClockActionBinding} from './ClockAdvance.tsx'
import type {SharedActionBinding} from './shared-action.ts'
import {Dialog} from './Dialog.tsx'

// Normal public projections and local reader callbacks; no persistence APIs.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();return {...actual,useState:<T,>(initial:T|(()=>T))=>{const index=hooks.index++;if(!(index in hooks.values))hooks.values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[index] as T,(value:T)=>{hooks.values[index]=value}] as const}}})
afterEach(()=>{hooks.values=[];hooks.index=0})
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'life-pause-ui',actorId:'player',commandId:'create',seed:'life-pause-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'pause-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error(JSON.stringify(r));return r.nextRun}
function props(run:GameRun):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']}}
const working=act(initial,'WorkQuarter'),studying=act(working,'ResearchMarket',{definitionId:'market-overview'}),spent=act(studying,'StartLifeWork',{kind:'rest',personId:null,reference:null}),reserved=act(studying,'StartFirstOrder')
function reading(p:GamePanelProps,selection:'rest'|'workspace'|'tang-ying'|'linzhou'='workspace'){return lifeActionPauseReading(p,lifeSceneProgress(p.features.life,p.view.date,selection))}
const nodes=(value:ReactNode):ReactElement<Record<string,unknown>>[]=>Children.toArray(value).flatMap(n=>isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children as ReactNode)]:[])
const words=(v:unknown):string=>typeof v==='string'?v:Array.isArray(v)?v.map(words).join(''):isValidElement<Record<string,unknown>>(v)?words(v.props.children):''

it('distinguishes actually spent points from points still reserved for an original plan',()=>{
 const used=props(spent),held=props(reserved)
 expect(used.view.budget).toMatchObject({available:0,spent:4,reserved:0})
 expect(reading(used)?.title).toBe('这季的四点，已经用完。')
 expect(held.view.budget).toMatchObject({available:0,spent:3,reserved:1})
 expect(reading(held)?.title).toBe('这季的行动，已经排进日历。');expect(reading(held)?.line).toContain('预留仍属于原安排')
 expect(reading(props(studying))).toBeNull();expect(reading(props(initial))).toBeNull()
})

it('keeps running work, unknown people, current money obligations and quarter endings on their original lead',()=>{
 const p=props(spent),w=p.features.workbench
 expect(reading(p,'rest')).toBeNull();expect(reading(p,'linzhou')).toBeNull()
 expect(reading({...p,features:{...p.features,workbench:{...w,atQuarterEnd:true}}})).toBeNull()
 expect(reading({...p,features:{...p.features,workbench:{...w,finance:w.finance.map(a=>({...a,protectionShortfallFen:100}))}}})).toBeNull()
 expect(reading({...p,features:{...p.features,workbench:{...w,progression:{...w.progression,requiresDelivery:true}}}})).toBeNull()
})

it('keeps real zero-action invitation replies and accepted responsibilities ahead of waiting advice',()=>{
 const person=props(studying).features.life.people.find(p=>p.id==='tang-ying')!,met=act(studying,'StartLifeWork',{kind:person.work.kind,personId:person.id,reference:null}),finished=act(met,'AdvanceTime',{date:'2020-01-04'}),offered=props(finished),promise=offered.features.life.promises.find(p=>p.status==='offered')!
 expect(offered.view.budget.available).toBe(0);expect(promise).toBeDefined()
 expect(reading(offered,'tang-ying')).toBeNull();expect(reading(offered,'workspace')).toBeNull()
 const accepted=props(act(finished,'AcceptLifePromise',{promiseId:promise.id,consent:true}))
 expect(reading(accepted,'tang-ying')).toBeNull();expect(reading(accepted,'workspace')).toBeNull()
})

it('moves the exact original clock once and opens the exact original disabled decision only on request',()=>{
 const p=props(spent),progress=lifeSceneProgress(p.features.life,p.view.date,'workspace'),command=progress.command!,clock=<ClockAdvance p={p} date="2020-03-31" label="等下一次反馈（最迟） · 2020-03-31"/>,original=<section><p>{progress.choice.line}</p><CommandButton {...p} {...command} label={progress.choice.label}/></section>
 const input={title:progress.choice.label,clock,children:original},render=()=>{hooks.index=0;return LifeActionPause(input)}
 const first=render();expect((first.props.children as ReactNode[])[0]).toBe(clock);expect(nodes(first).filter(n=>n.type===ClockAdvance)).toHaveLength(1);expect(nodes(first).some(n=>n.type===Dialog)).toBe(false)
 const open=nodes(first).find(n=>n.type==='button'&&words(n.props.children).includes('条件与费用'))!;(open.props.onClick as ()=>void)()
 const second=render(),dialog=nodes(second).find(n=>n.type===Dialog)!
 expect(dialog.props.children).toBe(original);expect(dialog.props.layout).toBe('direct')
 let action:SharedActionBinding|undefined
 const html=renderToStaticMarkup(<CommandButton {...p} {...command} label={progress.choice.label} renderAction={(binding,node)=>{action=binding;return node}}/>)
 expect(action?.disabled).toBe(true);expect(action?.reason).toBeTruthy();expect(html).toContain('disabled');action!.activate()
 expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled()
 ;(dialog.props.onClose as ()=>void)();expect(nodes(render()).some(n=>n.type===Dialog)).toBe(false)
 expect(p.request).not.toHaveBeenCalled()
})

it('keeps the original zero-action wait date and fee-confirmation request',()=>{
 const p=props(spent),date='2020-03-31',label='等下一次反馈（最迟） · '+date
 let binding:ClockActionBinding|undefined
 renderToStaticMarkup(<ClockAdvance p={p} date={date} label={label} renderAction={value=>{binding=value;return value.mainNode}}/>)
 expect(binding?.disabled).toBe(false);binding!.activate()
 expect(p.requestWait).toHaveBeenCalledExactlyOnceWith(date,expect.stringContaining(label),true);expect(p.request).not.toHaveBeenCalled()
})
