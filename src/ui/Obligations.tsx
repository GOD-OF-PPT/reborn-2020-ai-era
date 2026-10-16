import { useEffect,useState } from 'react'
import type { GamePanelProps } from './game-types.ts'
import { CommandButton } from './CommandButton.tsx'
import { parseMoneyInput } from './money-input.ts'
import { moneyText } from './game-text.ts'
type Debt=GamePanelProps['features']['workbench']['finance'][number]['obligations'][number]
function DebtPayment({debt,props}:{debt:Debt;props:GamePanelProps}){
 const [amount,setAmount]=useState((debt.remainingFen/100).toFixed(2));useEffect(()=>setAmount((debt.remainingFen/100).toFixed(2)),[debt.remainingFen])
 const amountFen=parseMoneyInput(amount),available=props.view.accounts.find(a=>a.accountId===debt.accountId)?.availableFen??0
 return <article className="debt-payment" aria-label={`${debt.date} ${debt.accountId==='personal'?'个人':'企业'}未结义务`}><div><strong>{debt.accountId==='personal'?'个人':'企业'} · {debt.date}{debt.date>props.view.date?'尚未到期':'已到期'}</strong><p>原义务剩余{moneyText(debt.remainingFen)}；该账户可花{moneyText(available)}。</p></div><label className="field">本次支付（元）<input inputMode="decimal" value={amount} onChange={event=>setAmount(event.target.value)}/></label>{amountFen===null?<p className="reason">请输入大于0、最多两位小数的金额。</p>:<CommandButton {...props} kind="PayObligation" payload={{accountId:debt.accountId,obligationId:debt.id,amountFen}} label="支付已有义务" confirm/>}</article>
}
export function Obligations({props,debts}:{props:GamePanelProps;debts:readonly Debt[]}){return <section className="panel obligations"><h3>已有未结义务</h3><p className="field-help">可以部分支付，剩余金额继续关联原义务；延期后仍可在这里处理。支付只使用当前账户可花现金。</p>{debts.map(debt=><DebtPayment key={debt.id} debt={debt} props={props}/>)}</section>}
