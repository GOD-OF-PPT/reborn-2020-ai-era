import {expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement,type ComponentProps} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {personalResultReading,PersonalResultChoice} from './PersonalResultChoice.tsx'
import {lifeSceneProgress} from './life-scene-progress.ts'
import {NarrativeScene} from './NarrativeScene.tsx'

// Normal in-memory proposals and public UI; no persistence or codec APIs.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'personal-result-ui',actorId:'player',commandId:'create',seed:'personal-result-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'result-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error(JSON.stringify(result));return result.nextRun}
function context(run=initial):GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),requestWait:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_CONFIRMATION_REQUIRED')}} as unknown as GamePanelProps['controller']}}
function until(run:GameRun,date:string){for(let i=0;i<30;i++){const w=context(run).features.workbench;if(w.pause){const e=w.events.find(e=>e.isBlocking)!,choice=e.choices.find(c=>c.isDefault)!;if(choice.costFen||choice.actionPoints)throw Error('EXPECTED_FREE_DEFAULT');run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:choice.id});continue}if(run.timeline.cursor.date>=date)return run;run=act(run,'AdvanceTime',{date})}throw Error('TIME_BOUND')}
const restStart=act(initial,'StartLifeWork',{kind:'rest',personId:null,reference:null}),rest=until(restStart,'2020-01-08'),workspaceStart=act(rest,'StartLifeWork',{kind:'workspace',personId:null,reference:null}),workspace=until(workspaceStart,'2020-01-15'),april=until(workspace,'2020-04-01')
const progress=(p:GamePanelProps,kind:'rest'|'workspace')=>lifeSceneProgress(p.features.life,p.view.date,kind)
type Element=ReactElement<Record<string,unknown>>
const nodes=(n:unknown):Element[]=>Array.isArray(n)?n.flatMap(nodes):isValidElement<Record<string,unknown>>(n)?[n,...nodes(n.props.children)]:[]
const words=(n:unknown):string=>typeof n==='string'?n:Array.isArray(n)?n.map(words).join(''):isValidElement<Record<string,unknown>>(n)?words(n.props.children):''
function scene(p:GamePanelProps,kind:'rest'|'workspace'){return {...p,screen:'life',headingRef:null,personId:'tang-ying',lifeMode:kind,onPerson:vi.fn(),onOpen:vi.fn(),onPeople:vi.fn(),onYear:vi.fn(),onNavigate:vi.fn(),receipt:null} as ComponentProps<typeof NarrativeScene>}

it('distinguishes each real completed rest or workspace from its planned or interrupted state',()=>{
 for(const [kind,start,finished] of [['rest',restStart,rest],['workspace',workspaceStart,workspace]] as const){
  const p=context(finished),value=personalResultReading(p,progress(p,kind))!
  expect(value).toMatchObject({kind,costFen:kind==='rest'?0:300000,points:1,completedAt:kind==='rest'?'2020-01-08':'2020-01-15'})
  expect(personalResultReading(context(start),progress(context(start),kind))).toBeNull()
  const stopped=context(act(start,'InterruptLifeWork',{jobId:context(start).features.life.jobs.find(j=>j.kind===kind)!.id}))
  expect(personalResultReading(stopped,progress(stopped,kind))).toBeNull()
 }
})
it('opens the exact original personal record and treats Today and people as explicit UI choices only',()=>{
 for(const [run,kind] of [[rest,'rest'],[workspace,'workspace']] as const){
  const p=context(run),value=personalResultReading(p,progress(p,kind))!,onOpen=vi.fn(),onNavigate=vi.fn(),tree=PersonalResultChoice({p,value,onOpen,onNavigate}),buttons=nodes(tree).filter(n=>n.type==='button')
  for(const b of buttons)(b.props.onClick as ()=>void)()
  expect(onOpen).toHaveBeenCalledExactlyOnceWith('life',{accountId:'personal',lifeSelection:kind,recordId:value.jobId});expect(onNavigate.mock.calls).toEqual([['room',{roomView:'today'}],['life',{lifeSelection:'person'}]])
  expect(p.request).not.toHaveBeenCalled();expect(p.requestWait).not.toHaveBeenCalled();expect(words(tree)).toContain('完成不返行动，不产生收入')
 }
})
it('shows real personal costs, a next choice and the original clock instead of another annual-summary card',()=>{
 for(const [run,kind] of [[rest,'rest'],[workspace,'workspace']] as const){
  const p=context(run),html=renderToStaticMarkup(<NarrativeScene {...scene(p,kind)}/> )
  expect(html).toContain('personal-result-choice');expect(html).toContain('已付'+(kind==='rest'?'¥0':'¥3,000')+' / 已用1点');expect(html).toContain('回到今天，安排接下来');expect(html).toContain('看看相识的人');expect(html).toContain('回看年度胶片');expect(html.match(/class="clock-advance"/g)).toHaveLength(1);expect(html).not.toContain('回看这次安排的结果');expect(p.request).not.toHaveBeenCalled()
 }
})
it('retains the actual completed workspace date into a later quarter without creating another improvement',()=>{
 const p=context(april),value=personalResultReading(p,progress(p,'workspace'))!
 expect(p.view.date).toBe('2020-04-01');expect(value.completedAt).toBe('2020-01-15');expect(value.jobId).toBe(p.features.life.scene.workspaceJobId);expect(value.costFen).toBe(300000)
 expect(personalResultReading(p,progress(p,'rest'))).toBeNull()
})
it('falls back for mismatched scene, duplicate job, wrong person or future completed dates',()=>{
 const p=context(workspace),pg=progress(p,'workspace'),job=pg.job!
 expect(personalResultReading(p,{...pg,selection:'rest'})).toBeNull();expect(personalResultReading(p,{...pg,job:{...job,costFen:0}})).toBeNull();expect(personalResultReading(p,{...pg,person:p.features.life.people[0]!})).toBeNull()
 expect(personalResultReading({...p,features:{...p.features,life:{...p.features.life,jobs:[...p.features.life.jobs,job]}}},pg)).toBeNull()
 expect(personalResultReading({...p,features:{...p.features,life:{...p.features.life,scene:{...p.features.life.scene,workspaceJobId:'another'}}}},pg)).toBeNull()
 expect(personalResultReading({...p,view:{...p.view,date:'2020-01-14'},features:{...p.features,life:{...p.features.life,asOf:'2020-01-14'}}},pg)).toBeNull()
})
it('keeps stale-result navigation inert and does not change the original record target',()=>{
 const p=context(rest),value=personalResultReading(p,progress(p,'rest'))!,onOpen=vi.fn(),onNavigate=vi.fn(),tree=PersonalResultChoice({p,value,onOpen,onNavigate})
 Object.assign(p.controller.snapshot,{view:{...p.view,revision:p.view.revision+1}})
 for(const b of nodes(tree).filter(n=>n.type==='button'))(b.props.onClick as ()=>void)()
 expect(onOpen).not.toHaveBeenCalled();expect(onNavigate).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled()
})
