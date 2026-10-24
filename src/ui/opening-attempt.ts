import type {GamePanelProps,SceneTarget} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import {playerThread,type OpeningFocus,type PlayerThreadView,type ThreadCommand,type ThreadResultRef} from './player-thread.ts'

export type OpeningAttemptInput=Pick<GamePanelProps,'view'|'features'>
type FirstOrder=OpeningAttemptInput['features']['firstOrder']

/** Display intents only. The caller keeps the original preview, confirmation and session gates. */
export type OpeningAttemptAction=
 |{readonly kind:'offer-reply'}
 |{readonly kind:'command';readonly command:ThreadCommand}
 |{readonly kind:'wait';readonly wait:NonNullable<PlayerThreadView['wait']>}
 |{readonly kind:'market-choice'}
 |{readonly kind:'free-choice'}
 |{readonly kind:'next-choice'}
 |{readonly kind:'inspect';readonly inspect:PlayerThreadView['inspect']}

export interface OpeningNextChoice{
 readonly id:string
 readonly label:string
 readonly line:string
 readonly screen:Screen
 readonly target?:SceneTarget
 readonly focus?:OpeningFocus
}

export interface OpeningFirstOrderView{
 readonly status:FirstOrder['status']
 readonly offerId:string
 readonly contractId:string|null
 readonly jobId:string|null
 readonly phase:'letter'|'planned'|'running'|'delivery'|'feedback'|'paid'|'non-success'
 readonly needsAttention:boolean
 readonly terms:Readonly<FirstOrder['terms']>
 readonly dates:Readonly<FirstOrder['dates']>
 readonly result:Readonly<Pick<FirstOrder['result'],'confirmedIncomeFen'|'paymentFen'|'directCostFen'|'netOrderFen'>>
 readonly receipt:null|{
  readonly amountFen:number
  readonly costFen:number
  readonly netFen:number
  readonly date:string|null
  readonly sourceRefs:readonly ThreadResultRef[]
 }
}

export interface OpeningAttemptView{
 readonly kind:'first-order'|'market-entry'|'free-entry'
 readonly source:{readonly runId:string;readonly revision:number;readonly date:string}
 readonly thread:PlayerThreadView
 readonly purpose:string
 readonly endpoint:string
 readonly action:OpeningAttemptAction
 readonly firstOrder:OpeningFirstOrderView|null
 readonly nextChoices:readonly OpeningNextChoice[]
}

function nextChoices(p:OpeningAttemptInput):readonly OpeningNextChoice[]{
 const identity={runId:p.view.runId,accountId:'personal',entityId:null}
 return [
  {id:'craft',label:'再看看靠手艺接单',line:'先了解视频制作的机会与投入，再决定是否接下一份委托。',screen:'video',target:{accountId:'personal'},focus:{...identity,kind:'video',videoTarget:null}},
  {id:'life',label:'安排工作与生活',line:'看看本季工作、生活和日历，再选择愿意承担的安排。',screen:'quarter',target:{accountId:'personal'},focus:{...identity,kind:'free'}},
  {id:'market',label:'了解模拟投资',line:'先看公开资料与风险，再决定是否提交一份模拟委托。',screen:'market',target:{accountId:'personal'},focus:{...identity,kind:'market'}},
 ]
}

function firstOrderView(first:FirstOrder,thread:PlayerThreadView):OpeningFirstOrderView{
 // This is a visual grouping of the committed original statuses, not a second business lifecycle.
 const phase:OpeningFirstOrderView['phase']=thread.stage==='paid'&&first.result.paymentFen>0?'paid'
  :first.status==='available'?'letter'
  :first.status==='planned'?'planned'
  :first.status==='running'?'running'
  :first.status==='awaiting_submission'&&!first.deadlineMissed?'delivery'
  :first.status==='review'||first.status==='delivered'?'feedback':'non-success'
 const sourceRefs=thread.resultRefs.filter(ref=>ref.kind==='payment').map(ref=>({...ref}))
 // Payment is a public first-order result. A missing public source date stays unknown, never "today".
 const paymentDate=sourceRefs.reduce<string|null>((latest,ref)=>ref.date!==null&&(latest===null||ref.date>latest)?ref.date:latest,null)
 const result={confirmedIncomeFen:first.result.confirmedIncomeFen,paymentFen:first.result.paymentFen,directCostFen:first.result.directCostFen,netOrderFen:first.result.netOrderFen}
 return {
  status:first.status,offerId:first.offerId,contractId:first.contractId,jobId:first.jobId,phase,
  needsAttention:first.deadlineMissed||first.status==='interrupted'||thread.command?.kind==='CancelContract',
  terms:{...first.terms},dates:{...first.dates},result,
  receipt:phase==='paid'?{amountFen:result.paymentFen,costFen:result.directCostFen,netFen:result.netOrderFen,date:paymentDate,sourceRefs}:null,
 }
}

/** U1 only: describes the current opening attempt from saved public projections; it cannot issue commands. */
export function openingAttempt(p:OpeningAttemptInput,focus?:OpeningFocus|null,focusQuarter?:string|null):OpeningAttemptView|null{
 if(p.view.phase!=='playing'||p.features.workbench.quarter!=='2020-Q1')return null
 const thread=playerThread(p,focus,focusQuarter)
 // Keep the existing invalid-target / multi-object / other-business presentation and responsibility override.
 if(thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.stage==='review-choice')return null
 const source={runId:p.view.runId,revision:p.view.revision,date:p.view.date}
 if(thread.focus.kind==='market'&&thread.focus.accountId==='personal'&&thread.focus.entityId===null)return {
  kind:'market-entry',source,thread,purpose:'用一份模拟投资判断，看看自己愿意承担怎样的风险。',
  endpoint:'以一份委托的真实结果，或明确不下单为终点；收益没有保证。',
  action:{kind:'market-choice'},firstOrder:null,nextChoices:[],
 }
 if(thread.focus.kind==='free'&&thread.stage==='choose')return {
  kind:'free-entry',source,thread,purpose:'选择自己愿意承担的一件安排，也可以先不新增承诺。',
  endpoint:'以这项安排的实际反馈，或本次明确暂缓为终点。',
  action:{kind:'free-choice'},firstOrder:null,nextChoices:[],
 }
 if(thread.focus.kind!=='first-order')return null
 const firstOrder=firstOrderView(p.features.firstOrder,thread)
 const hasNextChoice=firstOrder.phase==='paid'||['declined','skipped','expired','unavailable','cancelled','rejected'].includes(firstOrder.status)
 const action:OpeningAttemptAction=firstOrder.phase==='letter'?{kind:'offer-reply'}
  :thread.command?{kind:'command',command:thread.command}
  :thread.wait?{kind:'wait',wait:thread.wait}
  :hasNextChoice?{kind:'next-choice'}:{kind:'inspect',inspect:thread.inspect}
 return {
  kind:'first-order',source,thread,purpose:firstOrder.phase==='paid'?'这笔手工委托已有结果，下一段日子由你安排。':hasNextChoice?'这次委托已经结束，带着这份记录继续安排日子。':firstOrder.needsAttention?'这份原约定还需回应，先看清眼前的问题。':'把这笔手工委托从答复做到真实回款，再选择接下来的日子。',
  endpoint:'实际收到这笔款，或按原记录结束委托，才是本次尝试的终点。',
  action,firstOrder,nextChoices:hasNextChoice?nextChoices(p):[],
 }
}
