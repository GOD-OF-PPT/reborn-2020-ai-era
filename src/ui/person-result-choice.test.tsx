import {expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {personResultReading,PersonResultChoice} from './PersonResultChoice.tsx'
import {lifeSceneProgress} from './life-scene-progress.ts'
import {NarrativeScene} from './NarrativeScene.tsx'

// Normal in-memory play and public UI, no persistence or codec fixture.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'person-result-ui',actorId:'player',commandId:'create',seed:'person-result-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'result-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify(result));return result.nextRun}
function context(run=initial):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_CONFIRMATION_REQUIRED')}} as unknown as GamePanelProps['controller']}}
const progress=(p:GamePanelProps)=>lifeSceneProgress(p.features.life,p.view.date,'tang-ying')
const started=act(initial,'StartLifeWork',{kind:'friend_visit',personId:'tang-ying',reference:null}),met=act(started,'AdvanceTime',{date:'2020-01-04'}),promise=context(met).features.life.promises.find(row=>row.status==='offered')!,accepted=act(met,'AcceptLifePromise',{promiseId:promise.id,consent:true}),fulfilling=act(accepted,'FulfillLifePromise',{promiseId:promise.id})
function finish(run:GameRun){for(let i=0;i<5&&run.timeline.cursor.date<'2020-01-07';i++)run=act(run,'AdvanceTime',{date:'2020-01-07'});return run}
const done=finish(fulfilling)
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children)]:[]
const words=(n:unknown):string=>typeof n==='string'?n:Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
function scene(p:GamePanelProps){return {...p,screen:'life',headingRef:null,personId:'tang-ying',lifeMode:'person',onPerson:vi.fn(),onOpen:vi.fn(),onPeople:vi.fn(),onYear:vi.fn(),onNavigate:vi.fn(),receipt:null} as ComponentProps<typeof NarrativeScene>}

it('introduces next choices only after the exact selected promise actually completes',()=>{
 for(const run of [initial,started,met,accepted,fulfilling]){const p=context(run);expect(personResultReading(p,progress(p))).toBeNull()}
 const p=context(done),v=personResultReading(p,progress(p))!
 expect(v).toMatchObject({runId:done.runId,revision:done.revision,personId:'tang-ying',costFen:30000,points:1,completedAt:'2020-01-07'})
 expect(v.jobId).toBe(progress(p).job!.id)
})
it('keeps the original person reader and explicit Today/rest destinations without creating an activity',()=>{
 const p=context(done),value=personResultReading(p,progress(p))!,onRecord=vi.fn(),onNavigate=vi.fn(),tree=PersonResultChoice({p,value,onRecord,onNavigate}),buttons=nodes(tree).filter(n=>n.type==='button')
 const click=(text:string)=>{const b=buttons.find(n=>words(n.props.children).startsWith(text))!;(b.props.onClick as ()=>void)()}
 click('翻阅与唐萤');expect(onRecord).toHaveBeenCalledTimes(1);expect(onNavigate).not.toHaveBeenCalled()
 click('回到今天');click('看看休整安排');expect(onNavigate.mock.calls).toEqual([['room',{roomView:'today'}],['life',{lifeSelection:'rest'}]])
 expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled()
})
it('renders actual paid cost and next choices while retaining original clock and complete-person access',()=>{
 const p=context(done),html=renderToStaticMarkup(<NarrativeScene {...scene(p)}/> )
 expect(html).toContain('答应唐萤的事，你做到了');expect(html).toContain('已付¥300 / 已用1点');expect(html).toContain('完成不返行动，不产生收入')
 expect(html).toContain('回到今天，安排接下来');expect(html).toContain('看看休整安排');expect(html).toContain('翻阅与唐萤的这段经历');expect(html).toContain('打开人物与全部原约定');expect(html.match(/class="clock-advance"/g)).toHaveLength(1)
 expect(html).not.toContain('回看一起走过的这段日子');expect(p.request).not.toHaveBeenCalled()
})
it('retains invitation and interruption actions instead of replacing them with success navigation',()=>{
 const invited=context(met),stopped=context(act(started,'InterruptLifeWork',{jobId:context(started).features.life.jobs[0]!.id}))
 for(const p of [invited,stopped]){expect(personResultReading(p,progress(p))).toBeNull();expect(renderToStaticMarkup(<NarrativeScene {...scene(p)}/>)).not.toContain('person-result-choice')}
 const html=renderToStaticMarkup(<NarrativeScene {...scene(invited)}/>);expect(html).toContain('看清约定后答应');expect(html).toContain('婉拒唐萤的邀请')
})
it('does not relabel unknown, duplicate, future or mismatched original records as completed',()=>{
 const p=context(done),pg=progress(p),job=pg.job!
 expect(personResultReading(p,{...pg,selection:'linzhou'})).toBeNull()
 expect(personResultReading(p,{...pg,job:{...job,costFen:0}})).toBeNull()
 expect(personResultReading(p,{...pg,person:{...pg.person!,known:false}})).toBeNull()
 expect(personResultReading({...p,features:{...p.features,life:{...p.features.life,jobs:[...p.features.life.jobs,job]}}},pg)).toBeNull()
 expect(personResultReading({...p,view:{...p.view,date:'2020-01-06'},features:{...p.features,life:{...p.features.life,asOf:'2020-01-06'}}},pg)).toBeNull()
 expect(personResultReading(p,{...pg,promise:{...pg.promise!,completionJobId:'another'}})).toBeNull()
})
it('keeps old-view result clicks inert after the live public view changes',()=>{
 const p=context(done),value=personResultReading(p,progress(p))!,onRecord=vi.fn(),onNavigate=vi.fn(),tree=PersonResultChoice({p,value,onRecord,onNavigate})
 Object.assign(p.controller.snapshot,{view:{...p.view,revision:p.view.revision+1}})
 for(const button of nodes(tree).filter(n=>n.type==='button'))(button.props.onClick as ()=>void)()
 expect(onRecord).not.toHaveBeenCalled();expect(onNavigate).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled()
})
it('keeps a zero-action next-rest view on the original wait-and-condition flow',()=>{
 const spent=act(done,'WorkQuarter'),p=context(spent),html=renderToStaticMarkup(<NarrativeScene {...scene(p)} lifeMode="rest"/> )
 expect(p.view.budget.available).toBe(0);expect(html).toContain('这季的四点，已经用完');expect(html).toContain('留出七天休整 · 条件与费用');expect(p.request).not.toHaveBeenCalled()
})
