import {agentServiceEarned} from '../core/story-state.ts'
import { cumulativeFee } from '../core/money.ts'
import { OPERATIONS_CONTENT } from '../content/operations.ts'
import type { OperationsCatalog } from '../core/operations-types.ts'
import { addDays,monthEnd,isoDate } from '../core/calendar.ts'
import {requireRule} from '../core/errors.ts'
import { dayBefore,earnedMonthly,quarterLimit } from '../core/operations-calendar.ts'
import { accountFunds } from '../core/ledger.ts'
import { compareTimePoints,type DayPhase } from '../core/timeline.ts'
import type { GameRun } from '../core/run-types.ts'

export interface KnownCashFlow {readonly id:string;readonly date:string;readonly phase:DayPhase;readonly priority:number;readonly amountFen:number;readonly releasedFen:number;readonly label:string;readonly sourceId:string}
export interface CashForecast {readonly accountId:string;readonly horizon:string;readonly flows:readonly (KnownCashFlow&{availableFen:number})[];readonly minimumAvailableFen:number;readonly endingAvailableFen:number;readonly earliestGap:{date:string;shortfallFen:number;certainty:'conditional'|'committed'}|null;readonly assumption:string}
/** A projection of existing commitments; never advances the world or prices an unknown trade. */
export function projectCashForecast(run:GameRun,accountId:string,catalog:Pick<OperationsCatalog,'loans'>={loans:OPERATIONS_CONTENT.loans},marketPoints:readonly {id:string;date:string}[]=[],through?:string):CashForecast{
 const date=run.timeline.cursor.date,horizon=through===undefined?dayBefore(quarterLimit(date)):isoDate(through),funds=accountFunds(run.economy.ledger,accountId),flows:KnownCashFlow[]=[]
 if(through!==undefined)requireRule(horizon>=date,'INVALID_FORECAST_HORIZON')
 const add=(id:string,at:string,amountFen:number,label:string,sourceId:string,phase:DayPhase='due_obligations',priority=0,releasedFen=0)=>{if((amountFen!==0||releasedFen>0)&&at<=horizon)flows.push({id,date:at<date?date:at,phase,priority,amountFen,label,sourceId,releasedFen})}
 for(const order of run.market?.orders.filter(o=>o.status==='planned'&&o.side==='buy'&&o.accountId===accountId)??[]){const point=marketPoints[order.expiresIndex],reservation=run.economy.ledger.reservations.find(r=>r.id===order.reservationId);if(point&&reservation)add('expiry:'+order.id,point.date,0,'未提交计划到期释放占款（不是收入）',order.id,'market_matching',0,reservation.amountFen)}
 const supplierCredits=new Map(run.economy.ledger.supplierPrepayments.filter(p=>p.accountId===accountId).map(p=>[p.id,p.remainingFen]))
 const financial=new Map(run.economy.ledger.receipts.map(r=>[r.id,r]))
 for(const obligation of run.economy.ledger.obligations.filter(o=>o.accountId===accountId&&o.remainingFen>0).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))){
  const origin=financial.get(obligation.originOperationId);let credit=0
  if(origin?.kind==='incur_supplier_usage'&&supplierCredits.size>0){const {prepaymentId}=JSON.parse(origin.signature) as {prepaymentId:string};credit=Math.min(obligation.remainingFen,supplierCredits.get(prepaymentId)??0);supplierCredits.set(prepaymentId,(supplierCredits.get(prepaymentId)??0)-credit)}
  const protectedAmount=obligation.protectionReservationId?run.economy.ledger.reservations.find(r=>r.id===obligation.protectionReservationId)?.amountFen??0:0
  add(obligation.id,obligation.date,-(obligation.remainingFen-credit),credit>0?'已用量供应账单（扣除已有供应贷项）':'尚未结清的义务',obligation.sourceEventId,'due_obligations',origin?.kind==='incur_supplier_usage'?130:0,Math.min(protectedAmount,obligation.remainingFen))
 }
 for(const event of run.timeline.pending){const op=event.payload
  if(op.kind==='due_expense'&&op.accountId===accountId&&!run.economy.ledger.obligations.some(o=>o.id===op.obligationId))add(event.instanceId,event.date,-op.amountFen,op.sourceEventId==='bootstrap:living'?'生活费':'已确认费用',op.sourceEventId,event.phase,event.priority)
  if(op.kind==='income'&&op.accountId===accountId)add(event.instanceId,event.date,op.amountFen,'已确定到账',op.sourceEventId,event.phase,event.priority)
  if(op.kind==='story_event'&&op.type==='agent_fee'){const d=run.story?.deployments.find(d=>d.id===op.entityId&&d.accountId===accountId);if(d){const month=event.date.slice(0,7),billed=run.story!.fees.filter(f=>f.deploymentId===d.id&&f.month===month).reduce((n,f)=>n+f.amountFen,0);add(event.instanceId,event.date,-Math.max(0,agentServiceEarned(d,month,event.date)-billed),'衡星已确认服务费（不默续）',d.id,event.phase,event.priority)}}
  if(op.kind==='operating_event'&&run.operations){const s=run.operations,month=op.month
   if(op.type==='salary'&&month){const p=s.employment.find(p=>p.id===op.entityId);if(p&&accountId==='personal')add(event.instanceId,event.date,earnedMonthly(p.salaryFen,p.segments.map(segment=>({from:segment.from,to:segment.to??p.limit})),month,monthEnd(month+'-01')),'已确认工作工资',p.id,event.phase,event.priority)}
   if(op.type==='wage'&&month){const w=s.workers.find(w=>w.id===op.entityId),b=s.businesses.find(b=>b.id===w?.sponsorBusinessId);if(w&&b?.accountId===accountId)add(event.instanceId,event.date,-earnedMonthly(w.monthlyWageFen,[{from:w.from,to:w.to===null?null:addDays(w.to,1)}],month,event.date),'员工工资',w.id,event.phase,event.priority)}
   if(op.type==='maintenance'&&month){const b=s.businesses.find(b=>b.id===op.entityId);if(b?.accountId===accountId&&b.activeFrom)add(event.instanceId,event.date,-earnedMonthly(b.monthlyMaintenanceFen,[{from:b.activeFrom,to:b.stoppedAt}],month,event.date),'已承诺维护费',b.id,event.phase,event.priority)}
   if(op.type==='start_job'){const job=s.jobs.find(j=>j.id===op.entityId&&j.status==='planned'),action=run.economy.actions.find(a=>a.definition.id===job?.actionId);if(action?.definition.accountId===accountId){const held=run.economy.ledger.reservations.find(r=>r.id===action.definition.cashReservationId)?.amountFen??0;add(event.instanceId,event.date,-action.definition.costFen,'已确认开工成本',job!.id,event.phase,event.priority,Math.min(held,action.definition.costFen))}}
   if(op.type==='collection'){const c=s.contracts.find(c=>c.id===op.entityId&&c.status==='delivered'),b=s.businesses.find(b=>b.id===c?.businessId),balance=run.economy.ledger.contracts.find(b=>b.id===c?.id);if(c&&b?.accountId===accountId&&balance)add(event.instanceId,event.date,balance.receivableFen,'客户已确认待收款',c.id,event.phase,event.priority)}
   // Loan fees are already a declared term, even though the bill posts at maturity.
   if(op.type==='loan_due'){const loan=s.loans.find(l=>l.id===op.entityId&&l.accountId===accountId&&!l.feePosted);if(loan){const offer=catalog.loans.find(o=>o.id===loan.offerId);if(offer)add(event.instanceId,event.date,-offer.feeFen,'借款约定费用',loan.id,event.phase,event.priority)}}
  }
  if(op.kind==='video_event'&&op.type==='collect'&&run.video){const c=run.video.contracts.find(c=>c.id===op.entityId&&c.status==='delivered'),settlement=run.video.settlements.find(s=>s.id===op.entityId&&s.collectedAt===null),channel=run.video.channels.find(ch=>ch.id===(c?.channelId??settlement?.channelId)),business=run.operations?.businesses.find(b=>b.id===channel?.businessId),balance=run.economy.ledger.contracts.find(b=>b.id===op.entityId);if(business?.accountId===accountId&&balance){add(event.instanceId,event.date,balance.receivableFen,'视频已确认待收款',op.entityId,event.phase,event.priority);const fee=c?Number(BigInt(c.priceFen)*BigInt(c.feeBps)/10000n):settlement?.feeFen??0;add(event.instanceId+':fee',event.date,-fee,'视频约定结算费',op.entityId,event.phase,event.priority)}}
  if(op.kind==='course_event'&&op.type==='fee_close'){const co=run.course?.cohorts.find(c=>c.id===op.entityId&&c.feePostedAt===null),course=run.course?.courses.find(c=>c.id===co?.courseId),business=run.operations?.businesses.find(b=>b.id===course?.businessId),balance=run.economy.ledger.contracts.find(c=>c.id===co?.id);if(business?.accountId===accountId&&balance)add(event.instanceId,event.date,-cumulativeFee(0,balance.recognizedIncomeFen,500),'课程结算费（当前留存收入情景）',co!.id,event.phase,event.priority)}
  if(op.kind==='market_event'&&op.type==='settlement'){const settlement=run.market?.settlements.find(s=>s.id===op.entityId&&s.accountId===accountId&&s.paidAt===null);if(settlement)add(event.instanceId,event.date,settlement.amountFen,'已成交款/分红交收',settlement.sourceId,event.phase,event.priority)}
 }
 flows.sort((a,b)=>compareTimePoints({...a,instanceId:a.id},{...b,instanceId:b.id}))
 let cash=funds.cashFen,held=funds.heldFen,minimumAvailableFen=funds.availableFen;let earliestGap:{date:string;shortfallFen:number;certainty:'conditional'|'committed'}|null=null
 const manualReceivables=run.economy.ledger.privateReceivables.some(r=>r.accountId===accountId&&r.remainingFen>0)||run.deepseek?.deliveries.some(d=>d.creditFen>run.deepseek!.collections.filter(p=>p.deliveryId===d.id).reduce((n,p)=>n+p.amountFen,0)&&run.deepseek!.contracts.some(c=>c.id===d.contractId&&run.operations?.businesses.some(b=>b.id===c.businessId&&b.accountId===accountId)))===true
 const conditional=run.market?.orders.some(o=>o.accountId===accountId&&o.side==='buy'&&(o.status==='pending'||o.status==='partially_filled'||o.status==='planned'&&marketPoints.length===0))??false
 const trace=flows.map(flow=>{cash+=flow.amountFen;held-=flow.releasedFen;const available=cash-held;minimumAvailableFen=Math.min(minimumAvailableFen,available);if(available<0&&earliestGap===null)earliestGap={date:flow.date,shortfallFen:-available,certainty:conditional?'conditional':'committed'};return {...flow,availableFen:available}})
 return {accountId,horizon,flows:trace,minimumAvailableFen,endingAvailableFen:cash-held,earliestGap,assumption:(conditional?'买单按现有冻结预算占用；尚未成交，可取消释放。未来价格和卖股收益不计入。':'仅计现有承诺按期继续的工资、费用和已排定的确定到账；未知收入不计入。')+(run.story?.externalDelegations.some(e=>e.revocationVerifiedAt===null&&run.story!.deployments.some(d=>d.id===e.deploymentId&&d.accountId===accountId))?' 尚未验证撤回的外部代理委托可能有争议；未知结果没有用作确定收支。':'')+(manualReceivables?' 生态 / 架空股权的手动应收尚未计作到账；需按合同实际收取。':'')}
}
