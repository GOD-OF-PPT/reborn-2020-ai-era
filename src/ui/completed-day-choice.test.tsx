import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ComponentProps,type ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {TodayScene} from './TodayScene.tsx'
import {RoomTableau} from './RoomTableau.tsx'
import {Dialog} from './Dialog.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {todayThread} from './today-thread.ts'
import {type OpeningFocus} from './player-thread.ts'
import {sceneReadingName} from './scene-language.ts'

import {completedDayChoice} from './completed-day-choice.ts'
const hooks=vi.hoisted(()=>({enabled:false,current:[] as unknown[],index:0,slots:new Map<string,unknown[]>()}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>(),state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++,values=hooks.current;if(!(i in values))values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [values[i] as T,(next:T|((old:T)=>T))=>{values[i]=typeof next==='function'?(next as (old:T)=>T)(values[i] as T):next}] as const}
 return {...actual,useState:<T,>(v:T|(()=>T))=>hooks.enabled?state(v):actual.useState(v),useRef:<T,>(v:T)=>hooks.enabled?state(()=>({current:v}))[0]:actual.useRef(v),useEffect:(...args:Parameters<typeof actual.useEffect>)=>{if(!hooks.enabled)actual.useEffect(...args)},useImperativeHandle:(...args:Parameters<typeof actual.useImperativeHandle>)=>{if(!hooks.enabled)actual.useImperativeHandle(...args)},useCallback:<T extends (...args:never[])=>unknown,>(fn:T,deps:readonly unknown[])=>hooks.enabled?fn:actual.useCallback(fn,deps),useMemo:<T,>(fn:()=>T,deps:readonly unknown[])=>hooks.enabled?fn():actual.useMemo(fn,deps),useId:()=>hooks.enabled?'work-today':actual.useId()}
})
afterEach(()=>{hooks.enabled=false;hooks.current=[];hooks.index=0;hooks.slots.clear();vi.clearAllMocks()})
function mounted<T>(key:string,fn:()=>T){const old=hooks.current,index=hooks.index,enabled=hooks.enabled;hooks.current=hooks.slots.get(key)??[];hooks.slots.set(key,hooks.current);hooks.index=0;hooks.enabled=true;try{return fn()}finally{hooks.current=old;hooks.index=index;hooks.enabled=enabled}}
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'completed-day-ui',actorId:'player',commandId:'create',seed:'completed-day-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'today-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error(JSON.stringify(r));return r.nextRun}
const working=act(initial,'WorkQuarter'),full=act(act(working,'StartLifeWork',{kind:'rest',personId:null,reference:null}),'ResearchMarket',{definitionId:'market-overview'})
function input(run=full):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller']}}
const focus=(p:GamePanelProps):OpeningFocus=>({runId:p.view.runId,kind:'work',accountId:'personal',entityId:p.view.operations!.employment[0]!.id})
type Element=ReactElement<Record<string,unknown>>
const words=(n:unknown):string=>typeof n==='string'?n:Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
function elements(n:unknown,path='root'):Element[]{
 if(Array.isArray(n))return n.flatMap((v,i)=>elements(v,path+'/'+i));if(!isValidElement<Record<string,unknown>>(n))return []
 if(typeof n.type==='function'&&['MarketSceneChoice','VideoSceneChoice','CourseSceneChoice','RelaySceneChoice'].includes(n.type.name)&&typeof n.props.children==='function')return elements(n.props.children(vi.fn()),path+'/choice')
 if(typeof n.type==='function'&&['RelayThreadAction','OpeningAttemptAction','VideoThreadAction','CourseThreadAction'].includes(n.type.name)&&typeof n.props.children==='function')return elements(n.props.children(null),path+'/thread')
 const out=[n,...elements(n.props.children,path+'/children'),...elements(n.props.footer,path+'/footer')]
 if(n.type===RoomTableau)for(const key of ['intention','heading','context','feedback','facts','decisions','record','object'])out.push(...elements(n.props[key],path+'/'+key))
 if(typeof n.type==='function'&&['DayThreadAction','ClockAdvance','OpeningObject','TodayScene','TodayLifeChoices','TodayWorkChoice','TodayDirections','TodayOngoingChoices','CommandButton'].includes(n.type.name))out.push(...elements(mounted(n.type===TodayScene?'today':path,()=> (n.type as (p:Record<string,unknown>)=>unknown)(n.props)),path+'/render'))
 return out
}
function driver(run=full,extra:Partial<ComponentProps<typeof OpeningMoment>>={}){const p=input(run),onFocus=vi.fn(),onNavigate=vi.fn(),props:ComponentProps<typeof OpeningMoment>={p,focus:extra.focus??focus(p),onFocus,headingRef:null,fallback:roomMoment(p),onNavigate,onExplore:vi.fn(),...extra};let mountedToday=false
 const render=()=>{const tree=mounted('opening',()=>OpeningMoment(props)),now=tree.type===TodayScene;if(now&&!mountedToday)hooks.slots.delete('today');mountedToday=now;return elements(tree)},button=(label:string)=>render().find(n=>n.type==='button'&&(words(n.props.children).includes(label)||n.props['aria-label']===label||n.props['aria-label']===sceneReadingName(label))),click=(label:string)=>{const b=button(label);if(!b||b.props.disabled)throw Error('ENABLED_BUTTON_REQUIRED: '+label);(b.props.onClick as ()=>void)()};return {p,props,onFocus,onNavigate,render,button,click}}


function until(run:GameRun,date:string){for(let n=0;n<40;n++){const p=input(run),w=p.features.workbench;if(w.pause){const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;if(choice.costFen||choice.actionPoints)throw Error('FREE_ORIGINAL_RESPONSE_REQUIRED');run=act(run,'ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}if(run.timeline.cursor.date>=date)return run;run=act(run,'AdvanceTime',{date})}throw Error('TIME_BOUND')}
const lifeFocus=(p:GamePanelProps,kind:'rest'|'workspace'):OpeningFocus=>({runId:p.view.runId,kind:'life',accountId:'personal',selection:kind,entityId:p.features.life.jobs.find(j=>j.kind===kind)!.id})
const studyFocus=(p:GamePanelProps):OpeningFocus=>({runId:p.view.runId,kind:'market',accountId:'personal',entityKind:'research',entityId:p.features.market.researches[0]!.id})
const doneLife=(kind:'rest'|'workspace')=>until(act(initial,'StartLifeWork',{kind,personId:null,reference:null}),'2020-01-08')
const doneStudy=until(act(initial,'ResearchMarket',{definitionId:'market-foundation-course'}),'2020-01-08')
function value(run:GameRun,f:OpeningFocus){const p=input(run),today=todayThread(p,f)!;return {p,today,next:completedDayChoice(p,today)}}

it.each(['rest','workspace'] as const)('turns the real completed %s primary and object into one direct next-day comparison without a commitment',kind=>{
 const run=doneLife(kind),p=input(run),f=lifeFocus(p,kind),r=driver(run,{focus:f}),before=JSON.stringify(r.p.view),all=r.render(),object=all.find(n=>n.type===OpeningObject)!,primary=all.find(n=>n.type==='button'&&words(n.props.children).includes('安排接下来的日子'))!
 expect(completedDayChoice(r.p,todayThread(r.p,f)!)?.kind).toBe('daily');expect(object.props.onActivate).toBe(primary.props.onClick);(primary.props.onClick as ()=>void)();const rows=r.render(),dialog=rows.find(n=>n.type===Dialog)!;expect(dialog.props).toMatchObject({layout:'direct',title:'今天，怎样安排这段日子？'});expect(rows.filter(n=>n.props['data-kind']==='work')).toHaveLength(1);expect(r.p.request).not.toHaveBeenCalled();expect(r.onFocus).not.toHaveBeenCalled();expect(JSON.stringify(r.p.view)).toBe(before)
 ;(dialog.props.onClose as ()=>void)();expect(r.render().some(n=>n.type===Dialog)).toBe(false);expect(r.render().some(n=>n.type===TodayScene)).toBe(true);r.click('回到书签里的那件事 ↗');expect(r.render().some(n=>n.type===TodayScene)).toBe(false);expect(r.p.request).not.toHaveBeenCalled()
})
it('names a completed qualified study and opens the original comparison directly, keeping its record/Clock and original new-work confirmation',()=>{
 const p=input(doneStudy),f=studyFocus(p),r=driver(doneStudy,{focus:f}),html=renderToStaticMarkup(<OpeningMoment {...r.props}/>);expect(html).toContain('已取得本局模拟规则研习资格');expect(html).toContain('翻阅这一段的记录与代价');expect(html).toContain('核对后推进');r.click('安排接下来的日子');r.click('核对并安排本季工作');expect(r.p.request).toHaveBeenCalledExactlyOnceWith('WorkQuarter',{},'核对并安排本季工作',true);expect(r.onFocus).not.toHaveBeenCalled();expect(r.onNavigate).not.toHaveBeenCalled()
})
it('after an early study result goes directly to all original continuing papers, keeping both work and life at zero AP',()=>{
 const run=until(full,'2020-01-02'),p=input(run),f=studyFocus(p),r=driver(run,{focus:f}),next=value(run,f).next!
 expect(p.view.budget.available).toBe(0);expect(next).toMatchObject({kind:'ongoing',label:'选一件未完的事'});r.click(next.label);const rows=r.render(),dialog=rows.find(n=>n.type===Dialog)!;expect(dialog.props).toMatchObject({layout:'direct',title:'先把哪件事放回眼前？'});expect(rows.filter(n=>n.props.className==='ongoing-choice-card')).toHaveLength(2);expect(r.p.request).not.toHaveBeenCalled();expect(r.onFocus).not.toHaveBeenCalled()
})
it('after the actual life result returns straight to the single original work without renewing it',()=>{
 const run=until(full,'2020-01-08'),p=input(run),f=lifeFocus(p,'rest'),r=driver(run,{focus:f}),next=value(run,f).next!
 expect(next).toMatchObject({kind:'focus',label:'继续本季工作',focus:focus(p)});const all=r.render(),object=all.find(n=>n.type===OpeningObject)!,main=all.find(n=>n.type==='button'&&words(n.props.children).includes(next.label))!;expect(object.props.onActivate).toBe(main.props.onClick);(object.props.onActivate as ()=>void)();expect(r.onFocus).toHaveBeenCalledExactlyOnceWith(focus(p));expect(r.p.request).not.toHaveBeenCalled();expect(r.p.requestWait).not.toHaveBeenCalled()
})
it('keeps no-AP/no-continuation results on the original Today/Clock and leaves history, interruption and stale/unknown sources unchanged',()=>{
 const stopped=act(working,'QuitWork'),run=until(act(act(stopped,'StartLifeWork',{kind:'rest',personId:null,reference:null}),'ResearchMarket',{definitionId:'market-foundation-course'}),'2020-01-08'),p=input(run),f=lifeFocus(p,'rest'),c=value(run,f);expect(p.view.budget.available).toBe(0);expect(c.today.ongoing).toHaveLength(0);expect(c.next).toBeNull();expect(renderToStaticMarkup(<OpeningMoment p={p} focus={f} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(p)} onNavigate={vi.fn()} onExplore={vi.fn()}/>)).toContain('回到今天')
 const valid=value(doneStudy,studyFocus(input(doneStudy))),t=valid.today
 for(const today of [{...t,source:{...t.source,revision:t.source.revision-1}},{...t,source:{...t.source,quarter:'2020-Q2'}},{...t,responsibilityOverrideNeeded:true},{...t,primary:{...t.primary,classification:'history' as const}},{...t,remaining:[{...t.remaining[0]!,urgent:true}]}])expect(completedDayChoice(valid.p,today)).toBeNull()
 const running=act(initial,'ResearchMarket',{definitionId:'market-foundation-course'}),interrupted=act(running,'StopMarketResearch',{researchId:input(running).features.market.researches[0]!.id}),q=input(interrupted);expect(value(interrupted,studyFocus(q)).next).toBeNull()
})
it('keeps an original due customer visible instead of skipping it for the otherwise single work or fresh comparison',()=>{
 const run=until(full,'2020-01-08'),p=input(run),f=lifeFocus(p,'rest'),t=todayThread(p,f)!,withDue={...p,features:{...p.features,relay:{...p.features.relay!,customers:[{...p.features.relay!.customers[0]!,dueReceivableFen:100}]}}};expect(completedDayChoice(withDue,t)).toMatchObject({kind:'ongoing',label:'看看未完安排与原款'});expect(p.request).not.toHaveBeenCalled()
})
it('rejects obsolete callbacks after source or explicit focus changes, including an A to B to A visit at the same revision',()=>{
 const run=until(act(act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),'ResearchMarket',{definitionId:'market-foundation-course'}),'2020-01-08'),p=input(run),f=studyFocus(p),r=driver(run,{focus:f}),old=r.button('安排接下来的日子')!;r.props.focus=lifeFocus(p,'rest');r.render();r.props.focus=f;r.render();(old.props.onClick as ()=>void)();expect(r.render().some(n=>n.type===TodayScene)).toBe(false);expect(r.p.request).not.toHaveBeenCalled()
 const fresh=r.button('安排接下来的日子')!;Object.assign(r.p.controller.snapshot,{view:{...r.p.view,revision:r.p.view.revision+1}});(fresh.props.onClick as ()=>void)();expect(r.render().some(n=>n.type===TodayScene)).toBe(false)
})
