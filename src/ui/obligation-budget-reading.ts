import type {GamePanelProps} from './game-types.ts'
import {resolveObligationScene,type ObligationSceneTarget} from './obligation-scene.ts'
import {marketId} from '../core/market.ts'
import {isoDate} from '../core/calendar.ts'
import {MONEY_LIMIT} from '../core/money.ts'
const money=(n:number)=>Number.isSafeInteger(n)&&n>=0&&n<=MONEY_LIMIT
const day=(s:string)=>{try{return isoDate(s)===s}catch{return false}}
export interface ObligationBudgetPlan{readonly id:string;readonly key:string;readonly accountId:string;readonly name:string;readonly symbol:string;readonly writtenAt:string;readonly quantity:number;readonly limitFen:number;readonly heldFen:number}
/** A limited reading of actual unsubmitted buy plans. Other orders, protected
 * funds and production reservations retain their complete original records. */
export function obligationBudgetReading(p:Pick<GamePanelProps,'view'|'features'>,target:ObligationSceneTarget){
 const value=resolveObligationScene(p,target),empty=(reason:string)=>({status:'unavailable' as const,reason,plans:[] as ObligationBudgetPlan[]})
 if(value.status!=='payment')return empty('请先重新核对同一笔原款。')
 const {account,finance,debt}=value,market=p.features.market,reservations=finance.reservations
 if(!market||!money(account.heldFen)||account.heldFen!==finance.heldFen||new Set(reservations.map(r=>r.id)).size!==reservations.length||reservations.some(r=>r.accountId!==debt.accountId||r.status!=='active'||!money(r.amountFen)||r.amountFen===0))return empty('这份账户的原预留来源尚待核对，请翻看完整原账。')
 const sum=reservations.reduce((n,r)=>n+r.amountFen,0)
 if(!money(sum)||sum!==account.heldFen)return empty('原预留合计与账户尚未核同，请翻看完整原账。')
 const plans:ObligationBudgetPlan[]=[];let unknown=false
 for(const o of market.orders.filter(o=>o.accountId===debt.accountId&&o.status==='planned'&&o.side==='buy')){
  const held=reservations.filter(r=>r.id===o.reservationId),r=held[0]
  if(market.orders.filter(n=>n.id===o.id).length!==1||!o.id||o.reservationId!==marketId('funds',o.id)||held.length!==1||!r||r.kind!=='plan'||r.originId!==marketId('plan',o.id)||!money(o.cashHeldFen)||o.cashHeldFen===0||o.cashHeldFen!==r.amountFen||!Number.isSafeInteger(o.quantity)||o.quantity<=0||o.remaining!==o.quantity||o.grossFilledFen!==0||o.feesPaidFen!==0||market.fills.some(f=>f.orderId===o.id)||!day(o.submittedAt)||o.submittedAt>p.view.date||!money(o.limitPriceFen)||o.limitPriceFen===0){unknown=true;continue}
  const stocks=market.stocks.filter(s=>s.symbol===o.symbol),name=stocks.length===1?stocks[0]!.name:o.symbol
  plans.push({id:o.id,key:JSON.stringify([p.view.runId,o.accountId,o.id,o.symbol,o.reservationId,r.originId,o.submittedAt,o.quantity,o.limitPriceFen,o.ruleId,o.quoteId,o.eligibleIndex,o.expiresIndex,o.cashHeldFen]),accountId:o.accountId,name,symbol:o.symbol,writtenAt:o.submittedAt,quantity:o.quantity,limitFen:o.limitPriceFen,heldFen:o.cashHeldFen})
 }
 const held=plans.reduce((n,o)=>n+o.heldFen,0)
 if(!money(held)||held>account.heldFen)return empty('这些原计划的预留合计尚待核对，请翻看完整原账。')
 return {status:'ready' as const,plans,availableFen:account.availableFen,remainingFen:debt.remainingFen,otherHeldFen:account.heldFen-held,unknown}
}
