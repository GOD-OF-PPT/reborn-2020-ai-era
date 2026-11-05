import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {GameRun,CommandEnvelope} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {courseFocusFor} from './course-player-thread.ts'
import {playerThread} from './player-thread.ts'
import {courseEntryReading} from './course-entry-reading.ts'
import {CourseEntryAction} from './CourseEntryAction.tsx'
import {CourseEntryOptions} from './CourseEntryOptions.tsx'
import {CourseThreadAction} from './CourseThreadAction.tsx'
import {CourseEncounter} from './CourseEncounter.tsx'
import {CourseSceneChoice} from './CourseSceneChoice.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {OpeningAttemptChoices} from './OpeningAttemptChoices.tsx'
import {CommandButton} from './CommandButton.tsx'
import {NarrativeScene} from './NarrativeScene.tsx'
import {playableAdvanceDate} from '../application/playable-advance.ts'

// Actual normal game commands in memory and UI callbacks only; no persistence tests.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();const state=<T,>(initial:T|(()=>T))=>{const i=hooks.index++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[i] as T,(next:T|((old:T)=>T))=>{hooks.values[i]=typeof next==='function'?(next as (old:T)=>T)(hooks.values[i] as T):next}] as const};return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useId:()=> 'course-entry-ui'}})
afterEach(()=>{hooks.values=[];hooks.index=0;vi.clearAllMocks()})
type Element=ReactElement<Record<string,unknown>>
function elements(v:unknown):Element[]{if(Array.isArray(v))return v.flatMap(elements);if(!isValidElement<Record<string,unknown>>(v))return [];const rows=[v,...elements(v.props.children),...elements(v.props.footer)];if(v.type===CourseEntryOptions)rows.push(...elements(CourseEntryOptions(v.props as unknown as ComponentProps<typeof CourseEntryOptions>)));return rows}
const words=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(words).join(''):isValidElement<Record<string,unknown>>(v)?words(v.props.children):''
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'course-entry-ui',actorId:'player',commandId:'create',seed:'course-entry-ui',backgroundId:'technical_employee',playerProfile:{wishId:'own_brand',approach:'free'}})
function act(run:GameRun,kind:string,payload:Record<string,unknown>){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'course-entry-'+run.revision,expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_COMMAND_REQUIRED:'+kind+':'+JSON.stringify(result));return result.nextRun}
function input(run=initial):GamePanelProps{const projected=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:projected as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId)} as unknown as GamePanelProps['controller']}}
function context(run=initial){const p=input(run),focus=courseFocusFor(p,null,'personal'),thread=playerThread(p,focus);return {p,focus,thread}}
function advanceTo(run:GameRun,date:string){for(let n=0;input(run).view.date<date&&n<10;n++)run=act(run,'AdvanceTime',{date});expect(input(run).view.date).toBe(date);return run}
const arranged=act(initial,'StartFirstOrder',{}),ready=advanceTo(arranged,'2020-01-19'),contractId=input(ready).features.firstOrder.contractId!,submitted=act(ready,'SubmitDelivery',{contractId}),paid=advanceTo(submitted,'2020-01-20')
type Entry=Parameters<Parameters<typeof CourseEntryAction>[0]['children']>[0]
function renderEntry(c:ReturnType<typeof context>,callbacks={choose:vi.fn(),today:vi.fn(),navigate:vi.fn()}){const reading=courseEntryReading(c.p,c.thread);if(!reading)throw Error('ENTRY_READING_REQUIRED');const result:Entry[]=[];hooks.index=0;const tree=CourseEntryAction({p:c.p,thread:c.thread,reading,date:playableAdvanceDate(c.p.features.workbench,c.p.view.date,reading.availableAt),waitLabel:'保留准备，等到公开可用日',onChoose:callbacks.choose,onToday:callbacks.today,onNavigate:callbacks.navigate,children:v=>{result.push(v);return null}});return {value:result[0]!,callbacks,tree}}

it('explains the actual future opening date and the optional original quote without creating a studio or case',()=>{
 const c=context(),r=courseEntryReading(c.p,c.thread)!;expect(c.thread.stage).toBe('course-unavailable');expect(r).toMatchObject({route:'first-order',caseCount:0,availableAt:'2022-11-30',label:'看看手工小单的原报价'});expect(r.line).toContain('2022-11-30');expect(r.caseLine).toContain('验收与实收');expect(r.caption).toContain('制作费¥0、占用0点');expect(r.caption).toContain('原报价¥1,300');expect(c.p.features.course!.businesses).toEqual([]);expect(c.p.request).not.toHaveBeenCalled()
})
it('keeps a planned original contract distinct from an actual paid case and never hides its mandatory delivery',()=>{
 const c=context(arranged);expect(courseEntryReading(c.p,c.thread)).toMatchObject({route:'first-order',caseCount:0,label:'回到手头那份手工小单'});expect(c.p.view.budget.reserved).toBe(1)
 const delivery=context(ready);expect(delivery.p.features.workbench.progression.requiresDelivery).toBe(true);expect(courseEntryReading(delivery.p,delivery.thread)).toBeNull()
})
it('a real settlement changes the entry into a truthful case and life choice without making teaching available',()=>{
 const c=context(paid),r=courseEntryReading(c.p,c.thread)!;expect(c.p.features.firstOrder.result.paymentFen).toBe(130000);expect(c.p.features.firstOrder.result.directCostFen).toBe(50000);expect(c.p.features.course!.cases).toHaveLength(1);expect(r).toMatchObject({route:'today',caseCount:1,availableAt:'2022-11-30'});expect(r.caseLine).toContain('工具资格与实际样课');expect(c.p.features.course!.businesses).toHaveLength(0);expect(c.p.request).not.toHaveBeenCalled()
})
it('declining or skipping the first quote keeps an optional original video path rather than requiring the first order',()=>{
 for(const kind of ['DeclineOffer','SkipOffer']){const c=context(act(initial,kind,{offerId:input().features.firstOrder.offerId}));expect(courseEntryReading(c.p,c.thread)).toMatchObject({route:'video',caseCount:0});const v=renderEntry(c);v.value.binding.activate();expect(v.callbacks.navigate).toHaveBeenCalledExactlyOnceWith('video',{accountId:'personal'});expect(c.p.request).not.toHaveBeenCalled();hooks.values=[]}
})
it('the original account conditions, Today and calendar remain independent UI choices with the original wait date',()=>{
 const c=context(),v=renderEntry(c);v.value.binding.activate();expect(v.callbacks.navigate).not.toHaveBeenCalled();expect(elements(renderEntry(c,v.callbacks).tree).some(n=>n.type===OpeningAttemptChoices)).toBe(true);const options=elements(CourseEntryOptions({value:v.value.courseEntry}));const buttons=options.filter(n=>n.type==='button');expect(buttons).toHaveLength(2);(buttons[0]!.props.onClick as ()=>void)();(buttons[1]!.props.onClick as ()=>void)();expect(v.callbacks.today).toHaveBeenCalledOnce();expect(v.callbacks.choose).toHaveBeenCalledExactlyOnceWith('objects');const clock=options.find(n=>n.type===ClockAdvance)!;expect(clock.props).toMatchObject({date:'2020-03-31',room:true});expect(clock.props.p).toBe(c.p);expect(c.p.request).not.toHaveBeenCalled()
})
it('the thought and course object share the same guarded action and do not visually repeat the unavailable-era instructions',()=>{
 const c=context(),practice=vi.fn(),element=CourseEncounter({p:c.p,thread:c.thread,date:'2020-03-31',waitLabel:'原日历反馈',onChoose:vi.fn(),onResult:vi.fn(),onToday:vi.fn(),onNavigate:practice});if(!isValidElement<ComponentProps<typeof CourseThreadAction>>(element))throw Error('COURSE_ACTION_REQUIRED');const action=CourseThreadAction(element.props);if(!isValidElement<ComponentProps<typeof CourseEntryAction>>(action)||action.type!==CourseEntryAction)throw Error('COURSE_ENTRY_ACTION_REQUIRED');hooks.index=0;const rows=elements(CourseEntryAction(action.props)),main=rows.find(n=>n.type==='button')!,paper=rows.find(n=>n.type===OpeningObject)!;expect(paper.props.onActivate).toBe(main.props.onClick);expect(paper.props).toMatchObject({copyMode:'tableau',detail:'',stageLabel:'课程尚未开放'});expect(rows.some(n=>n.props.className==='course-encounter-object'||n.props.className==='scene-choice-overline')).toBe(false);(paper.props.onActivate as ()=>void)();expect(practice).not.toHaveBeenCalled();hooks.index=0;expect(elements(CourseEntryAction(action.props)).some(n=>n.type===OpeningAttemptChoices)).toBe(true);expect(c.p.request).not.toHaveBeenCalled()
})
it('retires old UI callbacks after a different source and on A to B to A without reviving the original closure',()=>{
 const a=context(),b=context(act(initial,'DeclineOffer',{offerId:input().features.firstOrder.offerId})),callbacks={choose:vi.fn(),today:vi.fn(),navigate:vi.fn()},first=renderEntry(a,callbacks),second=renderEntry(b,callbacks),again=renderEntry(a,callbacks);first.value.binding.activate();second.value.courseEntry.details.activate();expect(callbacks.navigate).not.toHaveBeenCalled();expect(callbacks.choose).not.toHaveBeenCalled();again.value.binding.activate();expect(elements(renderEntry(a,callbacks).tree).some(n=>n.type===OpeningAttemptChoices)).toBe(true);expect(callbacks.navigate).not.toHaveBeenCalled()
})
it('keeps unknown, foreign, history and blocked contexts on their original path',()=>{
 const c=context();for(const t of [{...c.thread,stage:'course-unknown'},{...c.thread,focusScope:'history' as const},{...c.thread,responsibilityOverrideNeeded:true},{...c.thread,legacyFallbackRequired:true},{...c.thread,focus:{...c.focus,runId:'another-life'}}])expect(courseEntryReading(c.p,t)).toBeNull();expect(courseEntryReading({...c.p,accountId:'other'},c.thread)).toBeNull();expect(courseEntryReading({...c.p,view:{...c.p.view,date:'2022-11-30'}},c.thread)).toBeNull();expect(courseEntryReading({...c.p,features:{...c.p.features,course:{...c.p.features.course!,cases:[...input(paid).features.course!.cases,...input(paid).features.course!.cases]}}},c.thread)).toBeNull()
})
it('the route has a direct current-purpose surface and preserves the supplied original navigation callback',()=>{
 const c=context(),navigate=vi.fn();hooks.index=0;const rows=elements(NarrativeScene({...c.p,screen:'course',courseTarget:null,headingRef:null,personId:'tang-ying',onPerson:vi.fn(),onOpen:vi.fn(),onPeople:vi.fn(),onYear:vi.fn(),onNavigate:navigate,receipt:null})),surface=rows.find(n=>typeof n.type==='function'&&n.type.name==='SceneChoiceSurface')!;expect(surface.props).toMatchObject({direct:true,course:true});expect(words(rows.find(n=>n.type==='h1'))).toBe(courseEntryReading(c.p,c.thread)!.title);const choice=rows.find(n=>n.type===CourseSceneChoice)!,render=choice.props.children as (open:()=>void)=>unknown,encounter=elements(render(vi.fn())).find(n=>n.type===CourseEncounter)!;(encounter.props.onNavigate as (screen:'quarter',target:{accountId:string})=>void)('quarter',{accountId:'personal'});expect(navigate).toHaveBeenCalledExactlyOnceWith('quarter',{accountId:'personal'});expect(c.p.request).not.toHaveBeenCalled()
})

it('opens the original offer directly with all three independent decisions and follows an arranged contract by its original identity',()=>{
 const c=context(),v=renderEntry(c);v.value.binding.activate();const opened=renderEntry(c,v.callbacks),offer=elements(opened.tree).find(n=>n.type===OpeningAttemptChoices)!;expect(offer.props.panel).toBe('offer');const rows=elements(OpeningAttemptChoices(offer.props as unknown as ComponentProps<typeof OpeningAttemptChoices>)),commands=rows.filter(n=>n.type===CommandButton);expect(commands.map(n=>n.props.kind)).toEqual(['StartFirstOrder','DeclineOffer','SkipOffer']);expect(commands.every(n=>n.props.confirm===true)).toBe(true);expect(words(rows)).toContain('个人制作投入');expect(words(rows)).toContain('¥500');expect(c.p.request).not.toHaveBeenCalled();hooks.values=[];const active=context(arranged),next=renderEntry(active);next.value.binding.activate();expect(next.callbacks.navigate).toHaveBeenCalledExactlyOnceWith('quarter',{accountId:'personal',recordId:active.p.features.firstOrder.contractId});expect(active.p.request).not.toHaveBeenCalled()
})
