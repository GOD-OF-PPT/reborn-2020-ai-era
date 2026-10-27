import {isoDate} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

interface CashRow{readonly id:string;readonly date:string;readonly amountFen:number;readonly sourceId:string;readonly businessId:string|null;readonly contractId:string|null}
interface CashAccount{readonly accountId:string;readonly cashFen:number;readonly transactions:readonly CashRow[]}
const unknown='这段日子的新增现金来源尚未完整核定，请在原账核对实际付出与收到；未收款仍不是现金。'
const day=(value:string)=>{try{return isoDate(value)===value}catch{return false}}
const valid=(rows:readonly CashRow[],asOf:string)=>new Set(rows.map(t=>t.id)).size===rows.length&&rows.every(t=>t.id&&t.sourceId&&day(t.date)&&t.date<=asOf&&Number.isSafeInteger(t.amountFen))

/** Adjacent published ledger rows, gross cash by account. Never available funds,
 * profit, recognized revenue, or a forecast. The caller owns saved-command gating. */
export function sceneCashResult(before:readonly CashAccount[],after:readonly CashAccount[],from:string,through:string,label:(accountId:string)=>string):string|null{
 if(!day(from)||!day(through)||through<from||new Set(before.map(a=>a.accountId)).size!==before.length||new Set(after.map(a=>a.accountId)).size!==after.length||before.length!==after.length)return unknown
 const parts:string[]=[]
 for(const account of after){
  const old=before.find(a=>a.accountId===account.accountId)
  if(!old||!Number.isSafeInteger(old.cashFen)||!Number.isSafeInteger(account.cashFen)||!valid(old.transactions,from)||!valid(account.transactions,through))return unknown
  const oldIds=new Set(old.transactions.map(t=>t.id)),added=account.transactions.filter(t=>!oldIds.has(t.id))
  if(old.transactions.some(t=>JSON.stringify(t)!==JSON.stringify(account.transactions.find(n=>n.id===t.id)))||added.some(t=>t.date<from))return unknown
  const paid=added.reduce((n,t)=>n+Math.max(0,-t.amountFen),0),received=added.reduce((n,t)=>n+Math.max(0,t.amountFen),0)
  if(!Number.isSafeInteger(paid)||!Number.isSafeInteger(received)||!Number.isSafeInteger(old.cashFen+received-paid)||old.cashFen+received-paid!==account.cashFen)return unknown
  if(paid||received)parts.push(label(account.accountId)+'实际'+(paid?'付出'+moneyText(paid):'')+(paid&&received?'，另':'')+(received?'收到'+moneyText(received):''))
 }
 return parts.length?'这段日子，'+parts.join('；')+'。这是各账户真实现金收付，性质和逐笔来源仍按原账分别保留。':null
}
