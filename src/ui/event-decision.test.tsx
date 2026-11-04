import {expect,it,vi} from 'vitest'
import {Children,isValidElement,type ReactNode,type ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import {singleSceneEvent,EventChoiceLetter} from './EventChoiceLetter.tsx'
import {captureEventDecision,EventDecisionFacts,EventDecisionDetails} from './EventDecisionFacts.tsx'
import {CommandButton} from './CommandButton.tsx'
import {SceneAttention} from './NarrativeScene.tsx'
import {isPersonalDecisionFacts} from './PersonalCommandReview.tsx'
import {personalConfirmationAction} from './personal-confirmation.ts'

// Normal in-memory proposals and public UI only; no store, codec, import or replay.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'event-ui',actorId:'player',commandId:'create',seed:'event-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'event-ui-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error(JSON.stringify(r));return r.nextRun}
function input(run:GameRun):GamePanelProps {const f=registry.runtime!.project!(run),view:PlayingView={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(c:CommandEnvelope)=>previewCommand(run,c,registry,run.actorId)} as unknown as GamePanelProps['controller']}}
const skipped=act(initial,'SkipOffer',{offerId:input(initial).features.firstOrder.offerId}),paused=act(skipped,'AdvanceTime',{date:'2020-01-22'}),p=input(paused),event=p.features.workbench.events.find(e=>e.isBlocking)!
function captured(choiceId='defer',deferred=false){const command:CommandEnvelope={runId:paused.runId,actorId:paused.actorId,commandId:'event-review',expectedRevision:paused.revision,kind:deferred?'DeferEventDecision':'ChooseEvent',payload:deferred?{instanceId:event.id}:{instanceId:event.id,choiceId}},preview=previewCommand(paused,command,registry,paused.actorId);return {command,preview,value:captureEventDecision(command,preview,p.view,p.features,()=> '个人账户')}}
function nodes(value:ReactNode):ReactElement<Record<string,unknown>>[]{return Children.toArray(value).flatMap(c=>isValidElement<Record<string,unknown>>(c)?[c,...nodes(c.props.children as ReactNode)]:[])}

it('puts the two original responses and distinct defer action in one direct event scene',()=>{
 expect(p.view.date).toBe('2020-01-22');expect(event.title).toBe('整理手工练习案例');expect(singleSceneEvent(p)).toBe(event)
 const tree=EventChoiceLetter({p,event}),commands=nodes(tree).filter(n=>n.type===CommandButton)
 expect(commands).toHaveLength(3)
 event.choices.forEach((choice,i)=>{expect(commands[i]!.props).toMatchObject({kind:'ChooseEvent',payload:{instanceId:event.id,choiceId:choice.id},label:choice.label,confirm:true});expect(commands[i]!.props.request).toBe(p.request);expect(commands[i]!.props.view).toBe(p.view)})
 expect(commands[2]!.props).toMatchObject({kind:'DeferEventDecision',payload:{instanceId:event.id},confirm:true})
 const html=renderToStaticMarkup(<SceneAttention p={p} onOpen={vi.fn()}/>)
 expect(html).toContain('dialog-direct-body');expect(html).not.toContain('screen-book');expect(html).toContain(event.title)
 for(const c of event.choices)expect(html).toContain(c.label)
 expect(html).toContain('个人账户');expect(html).toContain('最迟2020-02-05回应');expect(html).toContain('到期未回应：暂不新增承诺');expect(p.request).not.toHaveBeenCalled()
})

it('retains the full responsibility reader when money, multiple events or a different barrier needs attention',()=>{
 const w=p.features.workbench,change=(workbench:typeof w)=>({...p,features:{...p.features,workbench}})
 const gap=change({...w,finance:w.finance.map(a=>({...a,protectionShortfallFen:100}))})
 expect(singleSceneEvent({...p,view:{...p.view,accounts:[]}})).toBeNull();expect(singleSceneEvent(gap)).toBeNull();expect(renderToStaticMarkup(<SceneAttention p={gap} onOpen={vi.fn()}/>)).toContain('承诺资金存在缺口')
 expect(singleSceneEvent(change({...w,events:[event,{...event,id:'another'}]}))).toBeNull()
 expect(singleSceneEvent(change({...w,events:[{...event,isBlocking:false,presentation:'mandatory'}]}))).toBeNull()
 expect(singleSceneEvent(change({...w,events:[{...event,choices:event.choices.map(c=>({...c,isDefault:false}))}]}))).toBeNull()
 expect(singleSceneEvent(change({...w,events:[{...event,expiresAt:'2020-01-21'}]}))).toBeNull()
})

it('captures the actual prepare cost and action, without promising the future result',()=>{
 const c=captured('prepare');expect(c.preview.allowed).toBe(true);expect(c.value).toMatchObject({title:event.title,response:'投入时间整理准备材料',costFen:0,points:1,date:'2020-01-22',deadline:'2020-02-05',deferred:false})
 const html=renderToStaticMarkup(<EventDecisionFacts value={c.value!}/>);expect(html).toContain('本次确定费用</dt><dd>¥0');expect(html).toContain('本次行动</dt><dd>1点');expect(html).not.toContain('已经完成')
 expect(isPersonalDecisionFacts(<EventDecisionFacts value={c.value!}/>)).toBe(true);expect(personalConfirmationAction(c.command)).toBe('回应这件事')
 const next=act(paused,'ChooseEvent',c.command.payload),n=input(next)
 expect(n.view.date).toBe(p.view.date);expect(n.view.budget.available).toBe(p.view.budget.available-1);expect(n.features.workbench.events.some(e=>e.id===event.id)).toBe(false)
 expect(n.view.world!.jobs.some(j=>j.status==='running')).toBe(true)
})

it('distinguishes choosing the default now from deferring to the existing deadline',()=>{
 const answer=captured(),later=captured('defer',true)
 expect(answer.value).toMatchObject({deferred:false,costFen:0,points:0,response:'暂不新增承诺'})
 expect(later.value).toMatchObject({deferred:true,costFen:0,points:0,deadline:'2020-02-05'})
 const html=renderToStaticMarkup(<EventDecisionFacts value={later.value!}/>),details=renderToStaticMarkup(<EventDecisionDetails value={later.value!}/>)
 expect(html).toContain('到期仍未回应');expect(details).toContain('不是现在执行默认回应');expect(personalConfirmationAction(later.command)).toBe('暂缓这次回应')
 const decided=input(act(paused,answer.command.kind,answer.command.payload)),deferred=input(act(paused,later.command.kind,later.command.payload))
 expect(decided.features.workbench.events.some(e=>e.id===event.id)).toBe(false)
 expect(deferred.features.workbench.events.find(e=>e.id===event.id)).toMatchObject({isBlocking:false,expiresAt:'2020-02-05'})
 expect(deferred.view.budget.available).toBe(p.view.budget.available)
})

it('keeps an unavailable preparation disabled with its original capacity reason',()=>{
 const before=act(skipped,'AdvanceTime',{date:'2020-01-20'}),living=act(before,'StartLifeWork',{kind:'workspace',personId:null,reference:null}),blocked=act(living,'AdvanceTime',{date:'2020-01-22'}),b=input(blocked),e=singleSceneEvent(b)!
 const html=renderToStaticMarkup(<EventChoiceLetter p={b} event={e}/>)
 expect(html).toMatch(/aria-label="投入时间整理准备材料"[^>]*disabled=""/);expect(html).toContain('产能')
 expect(b.request).not.toHaveBeenCalled()
})

it('falls back for stale identity, duplicate source, mismatched cost or extra financial semantics',()=>{
 const c=captured('prepare'),capture=(command=c.command,preview=c.preview,features=p.features)=>captureEventDecision(command,preview,p.view,features,()=> '个人账户')
 expect(capture({...c.command,runId:'other'})).toBeNull();expect(capture({...c.command,expectedRevision:p.view.revision-1})).toBeNull()
 expect(capture({...c.command,payload:{instanceId:event.id,choiceId:'missing'}})).toBeNull()
 expect(capture(c.command,{...c.preview,upfrontCostFen:100})).toBeNull();expect(capture(c.command,{...c.preview,releasedFen:100})).toBeNull()
 expect(capture(c.command,c.preview,{...p.features,workbench:{...p.features.workbench,events:[event,event]}})).toBeNull()
})
