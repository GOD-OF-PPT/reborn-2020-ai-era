import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {isoDate} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

export interface EventDecision {readonly title:string;readonly account:string;readonly date:string;readonly appeared:string;readonly deadline:string;readonly response:string;readonly defaultResponse:string;readonly costFen:number;readonly points:number;readonly deferred:boolean}
/** Capture only public event terms from the same original decision. Event
 * effects and future results are deliberately not inferred from a zero price. */
export function captureEventDecision(command:CommandEnvelope,preview:CommandPreview,view:PlayingView,features:PlayFeatures,accountName:(id:string)=>string):EventDecision|null {
 if(!['ChooseEvent','DeferEventDecision'].includes(command.kind)||!preview.allowed||command.runId!==view.runId||command.expectedRevision!==view.revision||view.phase!=='playing'||view.busy||view.hasCandidate||view.readOnly||view.saveStatus!=='saved')return null
 const payload=command.payload!==null&&typeof command.payload==='object'&&!Array.isArray(command.payload)?command.payload as Record<string,unknown>:null,deferred=command.kind==='DeferEventDecision'
 if(!payload||Object.keys(payload).length!==(deferred?1:2))return null
 const events=features.workbench.events.filter(e=>e.id===payload.instanceId),event=events.length===1?events[0]:undefined
 if(!event||!event.title.trim()||view.accounts.filter(a=>a.accountId===event.accountId).length!==1||event.choices.filter(c=>c.isDefault).length!==1)return null
 const choices=event.choices.filter(c=>c.id===payload.choiceId),choice=choices.length===1?choices[0]:undefined
 if(deferred?!event.isBlocking:!choice||!choice.label.trim())return null
 try{if([view.date,event.createdAt,event.expiresAt].some(d=>isoDate(d)!==d)||event.createdAt>view.date||event.expiresAt<view.date)return null}catch{return null}
 const cost=deferred?0:choice!.costFen,points=deferred?0:choice!.actionPoints
 if(!Number.isSafeInteger(cost)||cost<0||!Number.isSafeInteger(points)||points<0||preview.upfrontCostFen!==cost||preview.actionPoints!==points||preview.releasedFen!==0||preview.actionAllocations||preview.actionDate!==undefined&&preview.actionDate!==view.date||preview.receivedPrepaymentFen!==undefined||preview.protectedIncreaseFen!==undefined||preview.accruedServiceFeeFen||preview.privateSale||preview.knownAdjustments)return null
 return {title:event.title,account:accountName(event.accountId),date:view.date,appeared:event.createdAt,deadline:event.expiresAt,response:deferred?'暂缓这次回应':choice!.label,defaultResponse:event.choices.find(c=>c.isDefault)!.label,costFen:cost,points,deferred}
}
export function EventDecisionFacts({value:v}:{value:EventDecision}) {
 return <section className="event-decision-facts"><p className="command-introduction">{v.account} · {v.date} · {v.title}</p><dl className="command-facts"><div><dt>本次确定费用</dt><dd>{moneyText(v.costFen)}</dd></div><div><dt>本次行动</dt><dd>{v.points}点</dd></div></dl>{v.deferred?<><p>现在先不作回应，期限仍是{v.deadline}。</p><p>到期仍未回应，将按“{v.defaultResponse}”处理。</p></>:<p>原回应期限{v.deadline}；原有费用与义务按各自记录处理。</p>}</section>
}
export function EventDecisionDetails({value:v}:{value:EventDecision}) {
 return <section className="confirmation-context"><h3>{v.title}</h3><p>{v.appeared}出现，原回应期限{v.deadline}；无人响应时按“{v.defaultResponse}”处理。</p><p>当前{v.date}，由{v.account}承担本次确定费用{moneyText(v.costFen)}与{v.points}点行动。</p><p>{v.deferred?'本次仅暂缓，不是现在执行默认回应；之后仍可在原期限内另行选择。':'本次明确选择“'+v.response+'”；是否形成后续工作及实际结果，沿原事件继续。'}原其它安排与义务保留。</p></section>
}
