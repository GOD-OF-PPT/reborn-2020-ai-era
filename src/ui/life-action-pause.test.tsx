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
import {personResultReading} from './PersonResultChoice.tsx'
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

function until(run:GameRun,date:string){for(let n=0;n<120;n++){const p=props(run),w=p.features.workbench;if(w.pause){const event=w.events.find(e=>e.isBlocking),choice=event?.choices.find(c=>c.isDefault);if(!event||!choice||choice.costFen!==0||choice.actionPoints!==0)throw Error('ORIGINAL_PUBLIC_ZERO_DEFAULT_REQUIRED');run=act(run,'ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}if(p.view.date>=date)return run;run=act(run,'AdvanceTime',{date})}throw Error('NORMAL_TIME_BOUND')}
it('a known multi-material ready person may read original materials at zero actions without a fabricated command',()=>{const p=props(spent),person=p.features.life.people.find(p=>p.id==='chen-yu')!,samples=[{kind:'paid_case' as const,id:'presentation-only-material-A',date:'2019-12-30'},{kind:'paid_case' as const,id:'presentation-only-material-B',date:'2019-12-31'}],life={...p.features.life,people:p.features.life.people.map(row=>row.id===person.id?{...row,known:true,references:samples}:row)},sample={...p,features:{...p.features,life}},progress=lifeSceneProgress(life,p.view.date,'chen-yu');expect(progress).toMatchObject({stage:'ready',command:null,referenceRequired:true});expect(lifeActionPauseReading(sample,progress)?.title).toBe('这季的四点，已经用完。');expect(lifeActionPauseReading(sample,{...progress,stage:'unavailable'})).toBeNull();expect(lifeActionPauseReading(sample,{...progress,referenceRequired:false})).toBeNull();expect(lifeActionPauseReading({...sample,features:{...sample.features,workbench:{...sample.features.workbench,pause:{reason:'CONTENT_DECISION_PENDING',instanceId:'presentation-only-responsibility'}}}},progress)).toBeNull();expect(p.request).not.toHaveBeenCalled()})
it('the optional material reader directly opens the original callback and never adds another conditions dialog',()=>{const p=props(spent),clock=<ClockAdvance p={p} date="2020-03-31" label="原Clock与费用"/>,open=vi.fn();hooks.index=0;const tree=LifeActionPause({title:'原材料',clock,onRead:open,readLabel:'先挑一份想与陈屿聊的经历 ↗'});expect((tree.props.children as ReactNode[])[0]).toBe(clock);expect(nodes(tree).filter(n=>n.type===ClockAdvance)).toHaveLength(1);const button=nodes(tree).find(n=>n.type==='button')!;expect(words(button)).toContain('先挑一份想与陈屿聊');(button.props.onClick as ()=>void)();expect(open).toHaveBeenCalledOnce();hooks.index=0;expect(nodes(LifeActionPause({title:'原材料',clock,onRead:open})).some(n=>n.type===Dialog)).toBe(false);expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled()})
it('a real busy calendar does not advertise an impossible immediate meeting completion date',()=>{const p=props(until(initial,'2020-07-01')),progress=lifeSceneProgress(p.features.life,p.view.date,'tang-ying');expect(progress.stage).toBe('unavailable');expect(progress.person?.busy).toMatchObject({from:'2020-07-01',to:'2020-09-01'});expect(progress.command).toBeNull();expect(progress.choice.line).toContain('个人¥200 · 1点 · 3日');expect(progress.choice.line).toContain('对方档期结束后');expect(progress.choice.line).not.toContain('现在开始');expect(progress.choice.line).not.toContain('2020-07-04');expect(p.request).not.toHaveBeenCalled()})
it('the same original material leads through actual meeting cost, invitation, zero-cost acceptance, promise work and completed next-life reading',()=>{let run=act(initial,'StartFirstOrder');run=until(run,'2020-01-19');run=act(run,'SubmitDelivery',{contractId:props(run).features.firstOrder.contractId!});run=until(run,'2020-01-21');const before=props(run),ready=lifeSceneProgress(before.features.life,before.view.date,'chen-yu');expect(ready.stage).toBe('ready');expect(ready.command?.kind).toBe('StartLifeWork');expect(ready.command?.payload).toMatchObject({personId:'chen-yu',reference:ready.references[0]});run=act(run,ready.command!.kind,ready.command!.payload);const started=props(run),working=lifeSceneProgress(started.features.life,started.view.date,'chen-yu');expect(started.features.life.personalAvailableFen).toBe(before.features.life.personalAvailableFen-30000);expect(started.view.budget.available).toBe(before.view.budget.available-1);expect(working).toMatchObject({stage:'running',waitDate:'2020-01-28'});run=until(run,'2020-01-28');let p=props(run),offered=lifeSceneProgress(p.features.life,p.view.date,'chen-yu');expect(offered.stage).toBe('offered');const cash=p.features.life.personalAvailableFen,points=p.view.budget.available;run=act(run,offered.command!.kind,offered.command!.payload);p=props(run);expect(p.features.life.personalAvailableFen).toBe(cash);expect(p.view.budget.available).toBe(points);const accepted=lifeSceneProgress(p.features.life,p.view.date,'chen-yu');expect(accepted.stage).toBe('accepted');run=act(run,accepted.command!.kind,accepted.command!.payload);p=props(run);expect(p.features.life.personalAvailableFen).toBe(cash-accepted.promise!.costFen);const running=lifeSceneProgress(p.features.life,p.view.date,'chen-yu');run=until(run,running.waitDate!);p=props(run);const done=lifeSceneProgress(p.features.life,p.view.date,'chen-yu');expect(done).toMatchObject({stage:'completed',promise:{status:'fulfilled'}});expect(personResultReading(p,done)).toMatchObject({personId:'chen-yu',jobId:done.job!.id,costFen:done.job!.costFen});expect(p.request).not.toHaveBeenCalled()})

it('a real zero-action quarter ending leads with its published next-quarter date, while responsibility guards remain first',()=>{const p=props(until(spent,'2020-03-31')),progress=lifeSceneProgress(p.features.life,p.view.date,'workspace');expect(p.features.workbench.atQuarterEnd).toBe(true);expect(p.features.workbench.progression.nextQuarterDate).toBe('2020-04-01');expect(lifeActionPauseReading(p,progress)?.title).toBe('这一季，已经走到最后一天。');expect(lifeActionPauseReading({...p,features:{...p.features,workbench:{...p.features.workbench,progression:{...p.features.workbench.progression,nextQuarterDate:null}}}},progress)).toBeNull();expect(p.request).not.toHaveBeenCalled()})
