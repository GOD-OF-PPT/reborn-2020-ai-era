import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {SharedActionBinding} from './shared-action.ts'
import {TodayWorkChoice} from './TodayWorkChoice.tsx'
import {TodayLifeChoices} from './TodayLifeChoices.tsx'
import {TodayScene} from './TodayScene.tsx'
import {CommandButton} from './CommandButton.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {Dialog} from './Dialog.tsx'
import {todayThread} from './today-thread.ts'
import {sceneReadingName} from './scene-language.ts'
import type {OpeningFocus} from './player-thread.ts'

// Normal in-memory gameplay and UI callbacks. No persistence/import/export APIs.
const hooks=vi.hoisted(()=>({enabled:false,current:[] as unknown[],index:0,slots:new Map<string,unknown[]>()}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++,values=hooks.current;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:<T,>(v:T|(()=>T))=>hooks.enabled?state(v):actual.useState(v),useRef:<T,>(v:T)=>hooks.enabled?state(()=>({current:v}))[0]:actual.useRef(v),useEffect:(...args:Parameters<typeof actual.useEffect>)=>{if(!hooks.enabled)actual.useEffect(...args)},useImperativeHandle:(...args:Parameters<typeof actual.useImperativeHandle>)=>{if(!hooks.enabled)actual.useImperativeHandle(...args)},useCallback:<T extends (...args:never[])=>unknown,>(fn:T,deps:readonly unknown[])=>hooks.enabled?fn:actual.useCallback(fn,deps),useMemo:<T,>(factory:()=>T,deps:readonly unknown[])=>hooks.enabled?factory():actual.useMemo(factory,deps),useId:()=>hooks.enabled?'daily-ui':actual.useId()}
})
afterEach(()=>{hooks.enabled=false;hooks.slots.clear();hooks.current=[];hooks.index=0;vi.clearAllMocks()})
function mounted<T>(key:string,fn:()=>T){const old=hooks.current,index=hooks.index,enabled=hooks.enabled;hooks.current=hooks.slots.get(key)??[];hooks.slots.set(key,hooks.current);hooks.index=0;hooks.enabled=true;try{return fn()}finally{hooks.current=old;hooks.index=index;hooks.enabled=enabled}}
const registry=createCampaignRegistry()
const create=(backgroundId='technical_employee')=>createCampaignRun({runId:'daily-'+backgroundId,actorId:'player',commandId:'create',seed:'daily-ui',backgroundId,playerProfile:{wishId:'autonomy',approach:'free'}})
const initial=create()
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'daily-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify(result));return result.nextRun}
function input(run=initial):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId)} as unknown as GamePanelProps['controller']}}
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children)]:[]
const words=(n:unknown):string=>typeof n==='string'?n:Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
function work(p:GamePanelProps){const tree=TodayWorkChoice({p,onWork:vi.fn()});if(tree.type!==CommandButton)throw Error('ORIGINAL_WORK_COMMAND_REQUIRED');let binding:SharedActionBinding|undefined;const original=tree.props as ComponentProps<typeof CommandButton>,html=renderToStaticMarkup(<CommandButton {...original} renderAction={(value,node,context)=>{binding=value;return original.renderAction!(value,node,context)}}/>);return {html,binding:binding!}}

it.each([['technical_employee','¥8,000'],['content_employee','¥6,000']])('compares actual personal work/rest/workspace terms using the %s wage basis', (background,salary)=>{
 const p=input(create(background)),onWork=vi.fn(),html=renderToStaticMarkup(<TodayLifeChoices p={p} work={<TodayWorkChoice p={p} onWork={onWork}/>}/> )
 for(const text of ['留一份工作','留出七天休整','改善桌椅与照明','2点 · 本次投入','¥3,000','2020-01-08','本季日历至 2020-03-31','月薪基准'+salary,'月末按实际在岗日结算，尚未预发'])expect(html).toContain(text)
 expect(html.match(/data-kind=/g)).toHaveLength(3);expect(p.request).not.toHaveBeenCalled();expect(onWork).not.toHaveBeenCalled()
})
it('opens the exact original work confirmation and does not create wages while comparing',()=>{
 const p=input(),r=work(p);expect(r.binding.disabled).toBe(false);r.binding.activate();expect(p.request).toHaveBeenCalledExactlyOnceWith('WorkQuarter',{},'核对并安排本季工作',true);expect(p.view.operations!.payroll).toHaveLength(0)
})
it('shows existing work as a reading action and uses the exact original employment identity',()=>{
 const p=input(act(initial,'WorkQuarter')),onWork=vi.fn(),tree=TodayWorkChoice({p,onWork}),html=renderToStaticMarkup(tree),button=nodes(tree).find(n=>n.type==='button')!
 expect(html).toContain('已在岗');expect(html).toContain('回到这份原工作');expect(html).not.toContain('本次投入');(button.props.onClick as ()=>void)();expect(onWork).toHaveBeenCalledExactlyOnceWith(p.features.workbench.employment[0]!.id);expect(p.request).not.toHaveBeenCalled()
})
it('uses the original zero-point continuation after an actual work stop rather than quoting a second two points',()=>{
 const stopped=act(act(initial,'WorkQuarter'),'QuitWork'),next=act(stopped,'AdvanceTime',{date:'2020-01-02'}),p=input(next),r=work(p)
 expect(r.html).toContain('继续本季工作');expect(r.html).toContain('0点 · 本次投入');expect(r.binding.disabled).toBe(false);r.binding.activate();expect(p.request).toHaveBeenCalledExactlyOnceWith('WorkQuarter',{},'核对并安排本季工作',true)
})
it('does not turn a refused work preview into a free zero-point quote',()=>{
 const started=act(act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),'ResearchMarket',{definitionId:'market-overview'}),finished=act(act(started,'AdvanceTime',{date:'2020-01-06'}),'AdvanceTime',{date:'2020-01-08'}),last=act(finished,'StartLifeWork',{kind:'workspace',personId:null,reference:null}),p=input(last),r=work(p)
 expect(p.view.budget.available).toBeLessThan(2);expect(r.binding.disabled).toBe(true);expect(r.html).toContain('先看原条件');expect(r.html).not.toContain('0点 · 本次投入');expect(r.html).toContain('class="reason"');r.binding.activate();expect(p.request).not.toHaveBeenCalled()
})
it('preserves the standalone two-life comparison and sends ambiguous work sources to the original record',()=>{
 const p=input(),html=renderToStaticMarkup(<TodayLifeChoices p={p}/>);expect(html.match(/data-kind=/g)).toHaveLength(2);expect(html).not.toContain('月薪基准')
 const employed=input(act(initial,'WorkQuarter')),period=employed.features.workbench.employment[0]!,changed={...employed,features:{...employed.features,workbench:{...employed.features.workbench,employment:[period,period]}}},onWork=vi.fn(),tree=TodayWorkChoice({p:changed,onWork})
 expect(renderToStaticMarkup(tree)).toContain('先核原记录');const button=nodes(tree).find(n=>n.type==='button')!;(button.props.onClick as ()=>void)();expect(onWork).toHaveBeenCalledExactlyOnceWith(null);expect(changed.request).not.toHaveBeenCalled()
})

function ui(){const p=input(),f:OpeningFocus={runId:p.view.runId,kind:'free',accountId:'personal',entityId:null},today=todayThread(p,f)!,onFocus=vi.fn(),onPrepare=vi.fn(),render=()=>elements(mounted('today',()=>TodayScene({p,today,headingRef:null,onFocus,onPrepare,onResume:vi.fn(),onExplore:vi.fn(),onRecollection:vi.fn(),onNavigate:vi.fn()}))),click=(label:string)=>{const b=render().find(n=>n.type==='button'&&(words(n.props.children)===label||n.props['aria-label']===label||n.props['aria-label']===sceneReadingName(label)))!;if(!b||b.props.disabled)throw Error('ENABLED_BUTTON_REQUIRED: '+label);(b.props.onClick as ()=>void)()};return {p,today,render,click,onFocus,onPrepare}}
function elements(n:unknown,path='root'):Element[]{
 if(Array.isArray(n))return n.flatMap((v,i)=>elements(v,path+'/'+i));if(!isValidElement<Record<string,unknown>>(n))return []
 if(typeof n.type==='function'&&['VideoSceneChoice','CourseSceneChoice','MarketSceneChoice'].includes(n.type.name)&&typeof n.props.children==='function')return elements(n.props.children(vi.fn()),path+'/choice')
 const result=[n,...elements(n.props.children,path+'/children'),...elements(n.props.footer,path+'/footer')]
 if(typeof n.type==='function'&&n.type.name==='RoomTableau')for(const key of ['heading','facts','decisions','record','object'])result.push(...elements(n.props[key],path+'/'+key))
 if(typeof n.type==='function'&&['TodayLifeChoices','TodayWorkChoice','CommandButton','OpeningObject'].includes(n.type.name))result.push(...elements(mounted(path,()=> (n.type as (p:Record<string,unknown>)=>unknown)(n.props)),path+'/render'))
 return result
}
it('binds Today and its calendar to the same direct comparison, cancels without commands and retains all directions',()=>{
 const r=ui(),all=r.render(),main=all.find(n=>n.type==='button'&&words(n.props.children).includes('工作，还是留点时间给自己？'))!,object=all.find(n=>n.type===OpeningObject)!
 expect(object.props.onActivate).toBe(main.props.onClick);r.click('工作，还是留点时间给自己？');let dialog=r.render().find(n=>n.type===Dialog)!
 expect(dialog.props).toMatchObject({layout:'direct',title:'今天，怎样安排这段日子？'});expect(r.render().some(n=>n.type===TodayWorkChoice)).toBe(true)
 ;(dialog.props.onClose as ()=>void)();expect(r.render().some(n=>n.type===Dialog)).toBe(false);expect(r.p.request).not.toHaveBeenCalled();expect(r.onFocus).not.toHaveBeenCalled()
 r.click('工作，还是留点时间给自己？');r.click('返回今天的选择');dialog=r.render().find(n=>n.type===Dialog)!;expect(dialog.props.title).toBe('今天，想把时间留给什么？');expect(r.p.request).not.toHaveBeenCalled()
})
it('uses the same original personal work request when selected from the direct daily comparison',()=>{
 const r=ui();r.click('工作，还是留点时间给自己？');r.click('核对并安排本季工作');expect(r.p.request).toHaveBeenCalledExactlyOnceWith('WorkQuarter',{},'核对并安排本季工作',true);expect(r.render().some(n=>n.type===Dialog)).toBe(false);expect(r.onFocus).not.toHaveBeenCalled();expect(r.onPrepare).not.toHaveBeenCalled()
})
