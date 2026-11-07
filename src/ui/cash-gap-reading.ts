import type {GamePanelProps,PlayingView,PlayFeatures} from './game-types.ts'
import {isoDate} from '../core/calendar.ts'
import {MONEY_LIMIT} from '../core/money.ts'
import {operatingId} from '../core/operations.ts'
import {moneyText} from './game-text.ts'

type Finance=PlayFeatures['workbench']['finance'][number]
type Debt=Finance['obligations'][number]
type Scope=Pick<GamePanelProps,'view'|'features'>
const money=(n:number)=>Number.isSafeInteger(n)&&n>=0&&n<=MONEY_LIMIT
const day=(s:string)=>{try{return isoDate(s)===s}catch{return false}}
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b)

/** The complete public positive-debt list is reconciled with each account's
 * payable balance. A missing or inconsistent source never means paid. */
export function currentDueReading({view,features}:Scope):{dueFen:number;finance:readonly Finance[];debts:readonly Debt[]}|null{
 const accounts=view.accounts,finance=features.workbench.finance
 if(!day(view.date)||!accounts.length||new Set(accounts.map(a=>a.accountId)).size!==accounts.length||finance.length!==accounts.length||new Set(finance.map(f=>f.accountId)).size!==finance.length)return null
 const debts:Debt[]=[];let dueFen=0
 for(const account of accounts){
  const f=finance.find(f=>f.accountId===account.accountId)
  if(!f||!money(f.payableFen)||!money(account.payableFen)||f.payableFen!==account.payableFen||f.cashFen!==account.cashFen)return null
  let total=0
  for(const d of f.obligations){
   if(!d.id||!d.originOperationId||!d.sourceEventId||d.accountId!==f.accountId||!day(d.date)||!money(d.amountFen)||!money(d.remainingFen)||d.remainingFen===0||d.remainingFen>d.amountFen)return null
   total+=d.remainingFen;if(!money(total))return null
   if(d.date<=view.date){dueFen+=d.remainingFen;if(!money(dueFen))return null}
   debts.push(d)
  }
  if(total!==f.payableFen)return null
 }
 if(new Set(debts.map(d=>d.id)).size!==debts.length)return null
 return {dueFen,finance,debts}
}

export function cashGapReading(p:Scope){
 if(p.features.workbench.pause?.reason!=='CASH_SHORTFALL')return null
 const current=currentDueReading(p)
 if(!current)return {state:'unknown' as const,title:'先核对这次停点',line:'款项来源尚待核对。确认暂停本身不会付款。',label:'核对这次暂停后继续',dueFen:null}
 if(current.dueFen===0)return {state:'clear' as const,title:'到期款项已处理',line:'当前已无未付到期款。确认这次停点后，再继续原来的日子。',label:'确认这次暂停，继续今天',dueFen:0}
 return {state:'due' as const,title:'先安顿这笔到期支出',line:'仍有'+moneyText(current.dueFen)+'到期未付。先处理原款，或确认继续；欠款照原约保留。',label:'暂留欠款，继续今天',dueFen:current.dueFen}
}

function owner(view:PlayingView,features:PlayFeatures,debt:Debt){
 if(debt.accountId==='personal')return '个人账户'
 const rows=view.operations?.businesses.filter(b=>b.accountId===debt.accountId)??[],business=rows[0]
 if(rows.length!==1||!business)return '原企业账户'
 return (features.workbench.routes.find(r=>r.id===business.route)?.name??'原企业')+'账户'
}

/** UI narrative from one adjacent, already-published original decision. This
 * reads public projections only and never changes a payment or pause rule. */
export function cashGapResult(kind:string,previous:PlayingView|null,current:PlayingView):string|null{
 if(!['PayObligation','AcknowledgeCashGap'].includes(kind)||!previous||previous.runId!==current.runId||current.revision!==previous.revision+1||current.saveStatus!=='saved'||current.hasCandidate||current.busy||current.readOnly||previous.date!==current.date||!equal(previous.budget,current.budget))return null
 const receipts=current.receipts.filter(r=>r.revisionAfter===current.revision),receipt=receipts[0]
 if(receipts.length!==1||!receipt||receipt.kind!==kind||!receipt.commandId||!equal(previous.receipts,current.receipts.slice(0,-1)))return null
 const beforeFeatures=previous.features as unknown as PlayFeatures,afterFeatures=current.features as unknown as PlayFeatures,before=currentDueReading({view:previous,features:beforeFeatures}),after=currentDueReading({view:current,features:afterFeatures})
 if(!before||!after)return null
 if(kind==='AcknowledgeCashGap'){
  if(beforeFeatures.workbench.pause?.reason!=='CASH_SHORTFALL'||afterFeatures.workbench.pause!==null||!equal(previous.accounts,current.accounts)||!equal(before.finance,after.finance))return null
  return after.dueFen===0?'这次暂停已确认。当前已无未付到期款；日历仍停在今天，原安排可以继续。':'这次暂停已确认，仍有'+moneyText(after.dueFen)+'到期未付。这一步没有付款，原欠款继续保留。'
 }
 if(after.debts.some(d=>!before.debts.some(old=>old.id===d.id)))return null
 const changed=before.debts.filter(old=>!equal(old,after.debts.find(d=>d.id===old.id)))
 if(changed.length!==1)return null
 const debt=changed[0]!,remaining=after.debts.find(d=>d.id===debt.id),left=remaining?.remainingFen??0,paid=debt.remainingFen-left
 if(!money(paid)||paid===0||remaining&&!equal({...debt,remainingFen:left},remaining))return null
 const operationId=operatingId(receipt.commandId,'PayObligation')
 for(const f of after.finance){
  const old=before.finance.find(o=>o.accountId===f.accountId)!,oldIds=new Set(old.transactions.map(t=>t.id)),added=f.transactions.filter(t=>!oldIds.has(t.id)),own=f.accountId===debt.accountId
  if(new Set(old.transactions.map(t=>t.id)).size!==old.transactions.length||new Set(f.transactions.map(t=>t.id)).size!==f.transactions.length||old.transactions.some(t=>!equal(t,f.transactions.find(n=>n.id===t.id)))||!equal(old.metrics,f.metrics))return null
  if(!own){if(added.length||old.cashFen!==f.cashFen||old.payableFen!==f.payableFen)return null;continue}
  const tx=added[0]
  if(added.length!==1||!tx||tx.id!==operationId||tx.sourceId!==receipt.commandId||tx.date!==current.date||tx.amountFen!==-paid||tx.contractId!==null||tx.businessId!==null&&tx.businessId!==debt.businessId||old.cashFen-f.cashFen!==paid||old.payableFen-f.payableFen!==paid)return null
 }
 const name=owner(current,afterFeatures,debt)
 return name+'实际支付'+moneyText(paid)+'，'+(left?'这笔原款还剩'+moneyText(left)+'。':'这笔原款已付清。')+'这是偿还原款，没有再记一遍费用。'+(after.dueFen>left?'另有到期款项，仍按各自原记录处理。':'')
}
