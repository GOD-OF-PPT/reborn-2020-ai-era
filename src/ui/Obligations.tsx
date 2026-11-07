import { useEffect,useState } from 'react'
import type { GamePanelProps } from './game-types.ts'
import { CommandButton } from './CommandButton.tsx'
import { parseMoneyInput } from './money-input.ts'
import { moneyText } from './game-text.ts'
type Debt=GamePanelProps['features']['workbench']['finance'][number]['obligations'][number]
export function DebtPayment({debt,props,draftAmount,onAmount}:{debt:Debt;props:GamePanelProps;draftAmount?:string;onAmount?:(amount:string)=>void}){
 const [localAmount,setAmount]=useState((debt.remainingFen/100).toFixed(2));useEffect(()=>setAmount((debt.remainingFen/100).toFixed(2)),[debt.remainingFen]);const amount=draftAmount??localAmount
 const business=props.view.operations?.businesses.find(b=>b.accountId===debt.accountId),route=props.features.workbench.routes.find(r=>r.id===business?.route),owner=debt.accountId==='personal'?'个人账户':(route?.name??'企业账户')+' · '+debt.accountId.slice(-6)
 const amountFen=parseMoneyInput(amount),available=props.view.accounts.find(a=>a.accountId===debt.accountId)?.availableFen??0
 return <article className="debt-payment" aria-label={`${debt.date} ${owner}未结义务`}><div><strong>{owner} · {debt.date}{debt.date>props.view.date?'尚未到期':'已到期'}</strong><p>原义务剩余{moneyText(debt.remainingFen)}；该账户可花{moneyText(available)}。</p></div><label className="field">本次支付（元）<input inputMode="decimal" value={amount} onChange={event=>{if(onAmount)onAmount(event.target.value);else setAmount(event.target.value)}}/></label>{amountFen===null?<p className="reason">请输入大于0、最多两位小数的金额。</p>:<CommandButton {...props} kind="PayObligation" payload={{accountId:debt.accountId,obligationId:debt.id,amountFen}} label="支付已有义务" confirm/>}</article>
}
export function Obligations({props,debts,onSelect}:{props:GamePanelProps;debts:readonly Debt[];onSelect?:(debt:Debt)=>void}){return <section className="panel obligations"><h3>已有未结义务</h3><p className="field-help">可以部分支付，剩余金额继续关联原义务；延期后仍可在这里处理。按这笔原义务核对当前资金与对应保护，不挪用其它客户的保护款。</p>{debts.map(debt=>onSelect?<article key={debt.id}><p>{debt.accountId==='personal'?'个人账户':props.features.workbench.routes.find(r=>r.accountId===debt.accountId)?.name??'原企业账户'} · {debt.date} · 尚欠{moneyText(debt.remainingFen)}</p><button type="button" onClick={()=>onSelect(debt)}>核对这笔付款 ↗</button></article>:<DebtPayment key={debt.id} debt={debt} props={props}/>)}</section>}
