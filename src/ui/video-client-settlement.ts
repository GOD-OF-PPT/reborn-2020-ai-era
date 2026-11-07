import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {resolveVideoFocus} from './video-player-thread.ts'
import {isoDate} from '../core/calendar.ts'
import {MONEY_LIMIT} from '../core/money.ts'
import {VIDEO_JOBS} from '../content/video.ts'

export interface VideoClientSettlementReading{readonly title:string;readonly line:string;readonly settledAt:string;readonly receivedFen:number;readonly prepaymentFen:number;readonly balanceFen:number;readonly directPaidFen:number|null;readonly feePaidFen:number|null;readonly canHearInquiry:boolean}
const money=(n:number)=>Number.isSafeInteger(n)&&n>=0&&n<=MONEY_LIMIT
const total=(values:readonly number[]):number|null=>{if(values.some(n=>!money(n)))return null;const n=values.reduce((a,b)=>a+BigInt(b),0n);return n<=BigInt(MONEY_LIMIT)?Number(n):null}
const unique=(rows:readonly {id:string}[])=>new Set(rows.map(r=>r.id)).size===rows.length
/** A current original paid order, with cash and direct expenses reconciled separately. */
export function videoClientSettlementReading(p:GamePanelProps,thread:PlayerThreadView):VideoClientSettlementReading|null{
 const w=p.features.workbench,v=p.features.video
 if(!v||p.view.phase!=='playing'||thread.stage!=='video-settled'||thread.outcome!=='actual'||thread.focus.kind!=='video'||thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.responsibilityOverrideNeeded||!['current','carry'].includes(thread.focusScope)||thread.focus.accountId!==p.accountId||w.atQuarterEnd||w.pause!==null||w.progression.requiresDelivery||w.events.some(e=>e.isBlocking||e.presentation!=='ordinary')||w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date)))return null
 const resolved=resolveVideoFocus(p,thread.focus),t=resolved.focus.videoTarget
 if(resolved.reason||!t?.workId||!t.contractId||t.marketingId)return null
 const channels=v.channels.filter(c=>c.id===t.channelId),works=v.works.filter(r=>r.id===t.workId),contracts=v.contracts.filter(r=>r.id===t.contractId),c=channels[0],work=works[0],contract=contracts[0]
 if(channels.length!==1||works.length!==1||contracts.length!==1||!c||!work||!contract||work.channelId!==c.id||work.contractId!==contract.id||contract.channelId!==c.id||contract.workId!==work.id||contract.status!=='settled'||!contract.paidCase||!contract.feePosted||contract.settledAt===null||!money(contract.priceFen)||!money(contract.prepaymentFen)||contract.prepaymentFen>contract.priceFen||!Number.isSafeInteger(contract.feeBps)||contract.feeBps<0||contract.feeBps>10000)return null
 try{isoDate(contract.acceptedAt);isoDate(contract.settledAt);if(contract.acceptedAt>=contract.settledAt||contract.settledAt>p.view.date)return null}catch{return null}
 const finances=w.finance.filter(f=>f.accountId===c.accountId),finance=finances[0],balances=finance?.contracts.filter(b=>b.id===contract.id)??[],balance=balances[0]
 if(finances.length!==1||!finance||balances.length!==1||!balance||balance.accountId!==c.accountId||balance.businessId!==c.businessId||balance.prepaidFen!==0||balance.receivableFen!==0||balance.recognizedIncomeFen!==contract.priceFen||finance.reservations.some(r=>r.kind==='customer_protection'&&r.originId===contract.id&&r.status==='active'&&r.amountFen>0))return null
 const related=finance.transactions.filter(tx=>tx.sourceId===contract.id),cash=related.filter(tx=>tx.amountFen>0)
 if(!unique(related)||related.some(tx=>tx.businessId!==c.businessId)||cash.some(tx=>tx.contractId!==contract.id||!money(tx.amountFen)||![contract.acceptedAt,contract.settledAt].includes(tx.date)))return null
 const prepayment=total(cash.filter(tx=>tx.date===contract.acceptedAt).map(tx=>tx.amountFen)),remainder=total(cash.filter(tx=>tx.date===contract.settledAt).map(tx=>tx.amountFen))
 if(prepayment!==contract.prepaymentFen||remainder!==contract.priceFen-contract.prepaymentFen||total(cash.map(tx=>tx.amountFen))!==contract.priceFen)return null
 const paidMetrics=(metrics:typeof finance.metrics,expected:number):number|null=>{
  if(new Set(metrics.map(m=>m.operationId)).size!==metrics.length||metrics.some(m=>m.accountId!==c.accountId||m.businessId!==c.businessId||m.kind!=='cost'||m.date>contract.settledAt!||!money(m.deltaFen)))return null
  const sum=total(metrics.map(m=>m.deltaFen));if(sum!==expected)return null
  for(const m of metrics){const tx=finance.transactions.filter(t=>t.id===m.operationId);if(tx.length!==1||tx[0]!.amountFen!==-m.deltaFen||tx[0]!.date!==m.date||tx[0]!.businessId!==c.businessId||tx[0]!.sourceId!==m.sourceEventId)return null}
  return sum
 }
 const expectedFee=Number(BigInt(contract.priceFen)*BigInt(contract.feeBps)/10000n),feeMetrics=finance.metrics.filter(m=>m.kind==='cost'&&m.sourceEventId===contract.id),feePaid=paidMetrics(feeMetrics,expectedFee)
 const directPaid=():number|null=>{
  const ops=p.view.operations;if(!ops)return null
  const jobs:(ProductionJob|undefined)[]=[work.production,...work.corrections]
  if(contract.negotiationJobId!==null){const matches=ops.jobs.filter(j=>j.id===contract.negotiationJobId);if(matches.length!==1)return null;jobs.push(matches[0])}
  const known=jobs.filter((j):j is ProductionJob=>!!j)
  if(known.length!==jobs.length||!unique(known)||new Set(known.map(j=>j.actionId)).size!==known.length)return null
  const costs:number[]=[]
  for(const job of known){
   const originals=ops.jobs.filter(j=>j.id===job.id),original=originals[0],definitions=VIDEO_JOBS.filter(d=>d.id===job.definitionId),definition=definitions[0]
   if(originals.length!==1||!original||original.businessId!==c.businessId||job.businessId!==c.businessId||original.actionId!==job.actionId||original.definitionId!==job.definitionId||original.status!=='completed'||job.status!=='completed'||job.completeAt>contract.settledAt!||definitions.length!==1||!definition)return null
   const metrics=finance.metrics.filter(m=>m.kind==='cost'&&m.referenceId===job.actionId),amount=paidMetrics(metrics,definition.costFen)
   if(amount===null||metrics.some(m=>m.date<job.startAt))return null;costs.push(amount)
  }
  return total(costs)
 }
 return {title:'这一单，已经收好。',line:c.name+' · '+contract.settledAt+'结清的这份商单。',settledAt:contract.settledAt,receivedFen:contract.priceFen,prepaymentFen:prepayment,balanceFen:remainder,directPaidFen:directPaid(),feePaidFen:feePaid,canHearInquiry:c.lifecycle==='operating'&&c.leads.length>0&&c.leads.every(l=>!!l.personId&&!!l.cohortId)&&new Set(c.leads.map(l=>l.personId)).size===c.leads.length}
}
