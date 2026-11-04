import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {isoDate} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'
import './first-order-decision.css'

export interface FirstOrderDecision {
 readonly kind:'accept'|'decline'|'skip'|'submit';readonly offerId:string;readonly title:string;readonly date:string
 readonly reserve:boolean;readonly costFen:number;readonly points:number;readonly quotedFen:number;readonly paidCostFen:number;readonly paidByCustomerFen:number
 readonly replyBy:string;readonly startAt:string;readonly submitBy:string;readonly reviewAt:string
}
const natural=(value:number)=>Number.isSafeInteger(value)&&value>=0

/** Exact original first-order facts. Unrelated offers and uncertain projections
 * retain the full existing confirmation and its original permissions. */
export function captureFirstOrderDecision(command:CommandEnvelope,preview:CommandPreview,view:PlayingView,features:PlayFeatures):FirstOrderDecision|null {
 if(!['StartFirstOrder','DeclineOffer','SkipOffer','SubmitDelivery'].includes(command.kind)||!preview.allowed||view.phase!=='playing'||view.readOnly||view.hasCandidate||view.busy||view.saveStatus!=='saved'||command.runId!==view.runId||command.expectedRevision!==view.revision||view.accounts.filter(a=>a.accountId==='personal').length!==1)return null
 const first=features.firstOrder,payload=command.payload!==null&&typeof command.payload==='object'&&!Array.isArray(command.payload)?command.payload as Record<string,unknown>:null
 if(!payload||first.productionMode!=='manual'||first.classification!=='fictional'||!first.title.trim()||!first.offerId||!natural(first.terms.costFen)||!natural(first.terms.priceFen)||!natural(first.terms.actionPoints)||first.terms.actionPoints>4||!natural(first.result.directCostFen)||!natural(first.result.paymentFen))return null
 const dates=[view.date,first.dates.replyBy,first.dates.startAt,first.dates.submitBy,first.dates.earliestReviewAt]
 try{if(dates.some(date=>isoDate(date)!==date)||first.dates.replyBy>first.dates.startAt||first.dates.startAt>=first.dates.submitBy||first.dates.submitBy>first.dates.earliestReviewAt)return null}catch{return null}
 if(preview.releasedFen!==0||preview.actionAllocations||preview.actionDate!==undefined&&preview.actionDate!==view.date||preview.receivedPrepaymentFen!==undefined||preview.protectedIncreaseFen!==undefined||preview.accruedServiceFeeFen||preview.privateSale||preview.knownAdjustments)return null
 const kind=command.kind==='StartFirstOrder'?'accept':command.kind==='DeclineOffer'?'decline':command.kind==='SkipOffer'?'skip':'submit'
 if(kind==='submit'){
  const contracts=view.operations?.contracts.filter(c=>c.id===first.contractId&&c.offerId===first.offerId&&c.jobId===first.jobId&&c.businessId===first.businessId)??[],jobs=view.operations?.jobs.filter(j=>j.id===first.jobId&&j.businessId===first.businessId&&j.contractId===first.contractId)??[],owners=view.operations?.businesses.filter(b=>b.id===first.businessId&&b.accountId==='personal')??[]
  if(Object.keys(payload).length!==1||payload.contractId!==first.contractId||first.status!=='awaiting_submission'||first.deadlineMissed||contracts.length!==1||jobs.length!==1||owners.length!==1||contracts[0]!.status!=='production'||jobs[0]!.status!=='completed'||jobs[0]!.startAt!==first.dates.startAt||jobs[0]!.completeAt!==first.dates.submitBy||view.date<jobs[0]!.completeAt||view.date>first.dates.submitBy||preview.upfrontCostFen!==0||preview.actionPoints!==0||first.result.directCostFen!==first.terms.costFen||first.result.paymentFen!==0||first.result.confirmedIncomeFen!==0)return null
 }else{
  if(first.status!=='available'||first.contractId!==null||first.jobId!==null||first.decision!==null||view.date>first.dates.replyBy||first.result.directCostFen!==0||first.result.paymentFen!==0||first.result.confirmedIncomeFen!==0)return null
  if(kind==='accept'){
   if(Object.keys(payload).length!==0||preview.upfrontCostFen!==first.terms.costFen||preview.actionPoints!==first.terms.actionPoints)return null
  }else if(Object.keys(payload).length!==1||payload.offerId!==first.offerId||preview.upfrontCostFen!==0||preview.actionPoints!==0)return null
 }
 return {kind,offerId:first.offerId,title:first.title,date:view.date,reserve:kind==='accept'&&view.date<first.dates.startAt,costFen:preview.upfrontCostFen,points:preview.actionPoints,quotedFen:first.terms.priceFen,paidCostFen:first.result.directCostFen,paidByCustomerFen:first.result.paymentFen,replyBy:first.dates.replyBy,startAt:first.dates.startAt,submitBy:first.dates.submitBy,reviewAt:first.dates.earliestReviewAt}
}

export function FirstOrderDecisionFacts({value:v}:{value:FirstOrderDecision}) {
 return <section className="first-order-decision-facts"><p className="command-introduction">个人承担 · {v.title}</p>
  {v.kind==='accept'?<><dl className="command-facts"><div><dt>{v.reserve?'先留出的制作费':'今天支付制作费'}</dt><dd>{moneyText(v.costFen)}</dd></div><div><dt>{v.reserve?'为开工预留行动':'今天使用行动'}</dt><dd>{v.points}点</dd></div><div><dt>开工</dt><dd>{v.startAt}</dd></div><div><dt>亲手提交前</dt><dd>{v.submitBy}</dd></div></dl><p>{v.reserve?'现在先预留，开工时才支付制作费。':'今天接下就开工，制作费和行动现在使用。'}</p><p className="first-order-decision-boundary">客户报价{moneyText(v.quotedFen)}仍未到账；最早{v.reviewAt}看复核，验收与收款分别发生。</p></>:v.kind==='submit'?<><dl className="command-facts"><div><dt>本次新增费用</dt><dd>{moneyText(v.costFen)}</dd></div><div><dt>本次新增行动</dt><dd>{v.points}点</dd></div><div><dt>原制作已付</dt><dd>{moneyText(v.paidCostFen)}</dd></div><div><dt>客户目前实付</dt><dd>{moneyText(v.paidByCustomerFen)}</dd></div></dl><p>把已做完的作品交给客户，最早{v.reviewAt}看回信。</p><p className="first-order-decision-boundary">提交不等于验收，报价{moneyText(v.quotedFen)}也还不是现金。</p></>:<><dl className="command-facts"><div><dt>本次制作费</dt><dd>{moneyText(v.costFen)}</dd></div><div><dt>本单行动占用</dt><dd>{v.points}点</dd></div></dl><p>{v.kind==='decline'?'婉拒这笔报价':'略过这次委托'}，把时间留给别的事。</p><p className="first-order-decision-boundary">本次不接单，原报价{moneyText(v.quotedFen)}不成为收入。</p></>}
 </section>
}

export function FirstOrderDecisionDetails({value:v}:{value:FirstOrderDecision}) {
 return <section className="confirmation-context"><h3>{v.title} · 原报价与日期</h3><p>当前日期{v.date}。客户原报价{moneyText(v.quotedFen)}，实际客户款{moneyText(v.paidByCustomerFen)}；原制作已付{moneyText(v.paidCostFen)}。</p><p>最迟{v.replyBy}答复，{v.startAt}开工，{v.submitBy}前实际完成并亲手提交，最早{v.reviewAt}客户复核。</p><p>{v.kind==='accept'?v.reserve?'本次先预留制作费和开工行动，开工才转换为实际使用。':'本次当天开工，制作费和行动立即使用。':v.kind==='submit'?'本次只提交已完成的作品，不再次收制作费或行动；客户尚未验收、付款。':'本次只留下自己的答复，不接受该单或获得报价收入。'}原其它工作、生活和约定仍各自保留。</p></section>
}
