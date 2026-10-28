import type {ClockCommitmentProjection} from '../core/clock-projection-types.ts'
import {moneyText} from './game-text.ts'

/** The immutable original clock projection is presentation only. Known due
 * cash, new clock cost and old reservations keep their different meanings. */
export function ClockConfirmationFacts({clock,newCostFen,newActionPoints,accountName}:{clock:ClockCommitmentProjection;newCostFen:number;newActionPoints:number;accountName:(id:string)=>string}){
 const accounts=clock.accounts.flatMap(a=>{
  if(!a.outflows.length)return []
  const amount=a.outflows.reduce((sum,f)=>sum-f.amountFen,0),known=a.outflows.every(f=>Number.isSafeInteger(f.amountFen)&&f.amountFen<=0)&&Number.isSafeInteger(amount)
  return [{accountId:a.accountId,amountFen:known?amount:null,reserved:a.outflows.some(f=>f.releasedFen>0)}]
 })
 return <>
  <section className="clock-known-confirmation" aria-label="已有安排的本段已知待付"><h3>已有安排的本段已知待付</h3>
   {accounts.length?accounts.map(a=><p className="clock-due-account" key={a.accountId}><span>{accountName(a.accountId)}</span><strong>{a.amountFen===null?'金额来源待核对':moneyText(a.amountFen)}</strong></p>):<p>当前原排程未列本段待付。</p>}
   {accounts.some(a=>a.reserved)?<p>部分款项已列原占款，将按原引用转换或释放，不另占一份。</p>:null}
  </section>
  <p className="clock-confirmation-note">日历核对范围：{clock.from} → {clock.target}。</p>
  <p className="clock-confirmation-note">推进本身新增费用{moneyText(newCostFen)} / 推进本身新增行动{newActionPoints}点。已安排任务开工时，仍按原预留使用行动。</p>
  <p className="clock-confirmation-note">上列待付来自已有安排；按实际停点结算，原明细仍逐项保留。</p>
 </>
}
