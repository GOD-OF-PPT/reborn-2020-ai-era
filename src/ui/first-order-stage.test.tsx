import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {GamePanelProps,PlayingView,PlayFeatures} from './game-types.ts'
import {firstOrderStage} from './first-order-stage.ts'
import {openingAttempt} from './opening-attempt.ts'
import {OpeningMoment} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'

// Normal in-memory original proposals and scene rendering, no persistence.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'first-stage-ui',actorId:'player',commandId:'create',seed:'first-stage-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'first_order'}})
function act(run:GameRun,kind:string,payload:unknown={}){const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'stage-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED: '+JSON.stringify(r));return r.nextRun}
function input(run:GameRun):GamePanelProps{
 const projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures,view:PlayingView={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
 return {view,features,controller:{snapshot:{view,busy:false},asynchronous:false,runtimeFailed:false,preview:(command:CommandEnvelope)=>previewCommand(run,command,registry,run.actorId),clockCommitments:()=>{throw Error('ORIGINAL_REVIEW_REQUIRED')}} as unknown as GamePanelProps['controller'],request:vi.fn(),accountId:'personal'}
}
const planned=act(initial,'StartFirstOrder'),running=act(planned,'AdvanceTime',{date:'2020-01-05'}),ready=act(running,'AdvanceTime',{date:'2020-01-19'}),contractId=input(ready).features.firstOrder.contractId!,jobId=input(running).features.firstOrder.jobId!,review=act(ready,'SubmitDelivery',{contractId}),paid=act(review,'AdvanceTime',{date:'2020-01-20'})
const stages=[{run:initial,key:'offer',label:'待你答复',phase:'letter'},{run:planned,key:'planned',label:'已安排 · 等开工',phase:'planned'},{run:running,key:'running',label:'正在制作',phase:'running'},{run:ready,key:'delivery',label:'制作完成 · 待提交',phase:'delivery'},{run:review,key:'review',label:'已交作品 · 等回信',phase:'feedback'},{run:paid,key:'paid',label:'已实际收款',phase:'paid'}]

it.each(stages)('uses one real $key label for the scene and its original paper shape',({run,key,label,phase})=>{
 const p=input(run),attempt=openingAttempt(p)!,before=JSON.stringify(p.view),action=JSON.stringify(attempt.action),value=firstOrderStage(attempt.firstOrder!,attempt.thread.stage)!
 expect(value.key).toBe(key);expect(value.label).toBe(label)
 const html=renderToStaticMarkup(<OpeningMoment p={p} focus={attempt.thread.focus} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(p)} onNavigate={vi.fn()} onExplore={vi.fn()}/>)
 const main=html.match(/<p class="opening-room-stage"[^>]*>([\s\S]*?)<\/p>/)?.[1],paper=html.match(/<span[^>]*class="opening-object-stage"[^>]*>([\s\S]*?)<\/span>/)?.[1]
 expect(main).toContain(label);expect(paper).toContain(label);expect(html).toContain('data-first-order-stage="'+key+'"');expect(html).toContain('data-first-order-phase="'+phase+'"');expect(html).toContain('class="first-order-stage-mark" aria-hidden="true"')
 expect(JSON.stringify(p.view)).toBe(before);expect(JSON.stringify(attempt.action)).toBe(action);expect(p.request).not.toHaveBeenCalled()
})

it('keeps the original own-delivery responsibility and exact submission action',()=>{
 const p=input(ready),attempt=openingAttempt(p)!,stage=firstOrderStage(attempt.firstOrder!,attempt.thread.stage)!
 expect(attempt.thread.responsibilityOverrideNeeded).toBe(true);expect(stage.label).toBe('制作完成 · 待提交')
 expect(attempt.action).toMatchObject({kind:'command',command:{kind:'SubmitDelivery',payload:{contractId}}})
})

it('distinguishes an accepted unpaid PUBLIC display from review and an actual receipt',()=>{
 const attempt=openingAttempt(input(review))!,first=attempt.firstOrder!
 // The normal first-order rules settle the same day; this is an isolated
 // presentation example, not a claimed executed unpaid first order.
 const accepted={...first,status:'delivered',result:{...first.result,confirmedIncomeFen:130000,paymentFen:0}}
 expect(firstOrderStage(first,attempt.thread.stage)?.label).toBe('已交作品 · 等回信')
 expect(firstOrderStage(accepted,attempt.thread.stage)?.label).toBe('已验收 · 等付款')
 expect(firstOrderStage({...accepted,result:{...accepted.result,confirmedIncomeFen:0}},attempt.thread.stage)).toBeNull()
})

it.each([
 {kind:'DeclineOffer',status:'declined',label:'已婉拒 · 未接单'},
 {kind:'SkipOffer',status:'skipped',label:'已略过 · 未接单'},
])('keeps $status distinct from a successful receipt',({kind,status,label})=>{
 const p=input(act(initial,kind,{offerId:input(initial).features.firstOrder.offerId})),attempt=openingAttempt(p)!,value=firstOrderStage(attempt.firstOrder!,attempt.thread.stage)!
 expect(value).toMatchObject({key:status,label,tone:'closed'});expect(attempt.firstOrder?.receipt).toBeNull();expect(p.features.firstOrder.result.directCostFen).toBe(0);expect(p.view.budget.available).toBe(4)
})

it('keeps actual cancellation, interruption and overdue responsibility separate',()=>{
 const examples=[{run:act(planned,'CancelContract',{contractId}),key:'cancelled',attention:false},{run:act(running,'InterruptJob',{jobId}),key:'interrupted',attention:true},{run:act(planned,'AdvanceTime',{date:'2020-01-20'}),key:'missed',attention:true},{run:act(initial,'AdvanceTime',{date:'2020-01-06'}),key:'expired',attention:false}]
 for(const {run,key,attention} of examples){
  const p=input(run),attempt=openingAttempt(p)!,value=firstOrderStage(attempt.firstOrder!,attempt.thread.stage)!
  expect(value.key).toBe(key);expect(value.tone).toBe(attention?'attention':'closed');expect(attempt.firstOrder?.receipt).toBeNull()
  if(attention){expect(value.mark).toBe('!');expect(value.label).toContain('仍需处理');expect(attempt.thread.command?.kind).toBe('CancelContract');expect(p.features.firstOrder.result.directCostFen).toBe(50000)}
 }
})

it('does not create a new paid or completed state from inconsistent presentation input',()=>{
 const initialFirst=openingAttempt(input(initial))!.firstOrder!,paidFirst=openingAttempt(input(paid))!.firstOrder!
 expect(firstOrderStage({...initialFirst,phase:'running'},'running')).toBeNull()
 expect(firstOrderStage({...paidFirst,receipt:null},'paid')).toBeNull()
 expect(firstOrderStage({...paidFirst,result:{...paidFirst.result,paymentFen:Number.NaN}},'paid')).toBeNull()
 expect(firstOrderStage({...paidFirst,phase:'non-success',status:'unknown-original-state'},'unknown')).toBeNull()
})
