import type {PublicFeedback} from '../application/public-feedback.ts'
import type {GamePanelProps,PlayFeatures,PlayingView} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {EchoFrame} from './SceneEcho.tsx'
import {isoDate} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

const day=(value:string)=>{try{return isoDate(value)===value}catch{return false}}
const natural=(value:number)=>Number.isSafeInteger(value)&&value>=0
const cashText=(amount:number,received:boolean)=>'这段日子，个人实际'+(received?'收到':'付出')+moneyText(amount)+'。这是各账户真实现金收付，性质和逐笔来源仍按原账分别保留。'
const paidBrief=(amount:number)=>'客户付来了'+moneyText(amount)+'，这笔手工单收好了。'
const paymentCause=(date:string,payment:number,cost:number,net:number)=>`${date}，客户实际付来了${moneyText(payment)}。制作成本${moneyText(cost)}，这一单净得${moneyText(net)}。`
const unchangedBudget=(a:PlayingView,b:PlayingView)=>a.budget.quarter===b.budget.quarter&&a.budget.available===b.budget.available&&a.budget.reserved===b.budget.reserved&&a.budget.spent===b.budget.spent

function sameOrder(previous:PlayingView,current:PlayingView){
 const before=previous.features as unknown as PlayFeatures,after=current.features as unknown as PlayFeatures,old=before.firstOrder,first=after.firstOrder
 if(previous.runId!==current.runId||!day(previous.date)||!day(current.date)||previous.date>=current.date||previous.budget.quarter!==current.budget.quarter||first.productionMode!=='manual'||first.classification!=='fictional'||!first.contractId||!first.jobId||!first.businessId||old.offerId!==first.offerId||old.contractId!==first.contractId||old.jobId!==first.jobId||old.businessId!==first.businessId||JSON.stringify(old.terms)!==JSON.stringify(first.terms)||JSON.stringify(old.dates)!==JSON.stringify(first.dates)||!Object.values(first.terms).every(natural)||![first.result.directCostFen,first.result.paymentFen,first.result.confirmedIncomeFen].every(natural))return null
 const jobs=current.operations?.jobs.filter(j=>j.id===first.jobId&&j.contractId===first.contractId&&j.businessId===first.businessId)??[],priorJobs=previous.operations?.jobs.filter(j=>j.id===first.jobId)??[],contracts=current.operations?.contracts.filter(c=>c.id===first.contractId&&c.offerId===first.offerId&&c.jobId===first.jobId&&c.businessId===first.businessId)??[],priorContracts=previous.operations?.contracts.filter(c=>c.id===first.contractId)??[]
 if(jobs.length!==1||priorJobs.length!==1||contracts.length!==1||priorContracts.length!==1||current.operations?.businesses.filter(b=>b.id===first.businessId&&b.accountId==='personal').length!==1||previous.operations?.businesses.filter(b=>b.id===first.businessId&&b.accountId==='personal').length!==1)return null
 const job=jobs[0]!,prior=priorJobs[0]!,contract=contracts[0]!
 if(job.actionId!==prior.actionId||job.definitionId!==prior.definitionId||job.startAt!==prior.startAt||job.completeAt!==prior.completeAt||job.startAt!==first.dates.startAt||job.completeAt!==first.dates.submitBy||contract.acceptedAt!==priorContracts[0]!.acceptedAt||!day(job.startAt)||!day(job.completeAt))return null
 return {before,after,old,first,job,prior,contract}
}

/** Reconcile every newly visible cash row, not an account balance or quote alone. */
function onlyCash(previous:PlayingView,current:PlayingView,sourceId:string,delta:number):boolean {
 const old=(previous.features as unknown as PlayFeatures).workbench.finance,rows=(current.features as unknown as PlayFeatures).workbench.finance
 if(old.length!==rows.length||new Set(rows.map(a=>a.accountId)).size!==rows.length||new Set(old.map(a=>a.accountId)).size!==old.length)return false
 let total=0,count=0
 for(const account of rows){
  const prior=old.find(a=>a.accountId===account.accountId);if(!prior)return false
  if(new Set(prior.transactions.map(t=>t.id)).size!==prior.transactions.length||new Set(account.transactions.map(t=>t.id)).size!==account.transactions.length||prior.transactions.some(t=>JSON.stringify(t)!==JSON.stringify(account.transactions.find(row=>row.id===t.id))))return false
  const ids=new Set(prior.transactions.map(t=>t.id)),added=account.transactions.filter(t=>!ids.has(t.id))
  if(added.some(t=>account.accountId!=='personal'||t.sourceId!==sourceId||t.date!==current.date||!Number.isSafeInteger(t.amountFen)||delta===0||Math.sign(t.amountFen)!==Math.sign(delta)))return false
  const amount=added.reduce((sum,t)=>sum+t.amountFen,0)
  if(!Number.isSafeInteger(amount)||prior.cashFen+amount!==account.cashFen)return false
  total+=amount;count+=added.length
 }
 return Number.isSafeInteger(total)&&total===delta&&(delta===0?count===0:count>0)
}

function sameFeedback(rows:readonly PublicFeedback[],expected:readonly {kind:PublicFeedback['kind'];sourceId:string;key:string;label:string}[]):boolean {
 return rows.length===expected.length&&new Set(rows.map(r=>r.key)).size===rows.length&&rows.every(row=>row.attention==='pause'&&expected.some(e=>row.kind===e.kind&&row.key===e.key&&row.sourceId===e.sourceId&&row.label===e.label))
}

/** Only the exact simple first-order transition gets a short first layer.
 * The caller keeps full text, gross cash, responsibilities and frame intact. */
export function firstOrderWaitBrief(previous:PlayingView,current:PlayingView,cash:string|null,cause:string,rows:readonly PublicFeedback[]):string|null {
 const s=sameOrder(previous,current);if(!s)return null
 const {old,first,job,prior,contract}=s,offer={kind:'result' as const,sourceId:first.offerId,key:'result:'+first.offerId+':'+JSON.stringify(first.status),label:'那份原委托，有了新的实际反馈。'}
 if(old.status==='planned'&&first.status==='running'&&prior.status==='planned'&&job.status==='running'&&current.date===job.startAt&&first.result.paymentFen===0&&first.result.directCostFen===first.terms.costFen&&old.result.directCostFen===0&&current.budget.available===previous.budget.available&&previous.budget.reserved-current.budget.reserved===first.terms.actionPoints&&current.budget.spent-previous.budget.spent===first.terms.actionPoints){
  const expected=[{kind:'job' as const,sourceId:job.id,key:'job:'+job.id+':"running"',label:'原安排已经实际开始。'},offer]
  if(cash===cashText(first.result.directCostFen,false)&&cause===current.date+'。已经确认的安排按真实日期发生，眼前又多了一次选择。'&&sameFeedback(rows,expected)&&onlyCash(previous,current,job.id,-first.result.directCostFen))return '这份短片开工了 · 制作已付'+moneyText(first.result.directCostFen)+'。'
 }
 if(old.status==='running'&&first.status==='awaiting_submission'&&!first.deadlineMissed&&prior.status==='running'&&job.status==='completed'&&current.date===job.completeAt&&unchangedBudget(previous,current)&&first.result.paymentFen===0&&old.result.directCostFen===first.result.directCostFen){
  const expected=[{kind:'responsibility' as const,sourceId:first.offerId,key:'responsibility:'+first.offerId,label:'原作品已经做好，等待你的决定。'},{kind:'job' as const,sourceId:job.id,key:'job:'+job.id+':"completed"',label:'一份原工作已经有了实际结果。'},offer]
  if(cash===null&&cause===`${current.date}，这份作品已经做完。下一步，要由你亲手交给客户。`&&sameFeedback(rows,expected)&&onlyCash(previous,current,job.id,0))return '短片做完了，等你亲手交给客户。'
 }
 if(['review','delivered'].includes(old.status)&&first.status==='settled'&&job.status==='completed'&&contract.settledAt===current.date&&old.result.paymentFen===0&&first.result.paymentFen>0&&first.result.confirmedIncomeFen===first.result.paymentFen&&first.result.netOrderFen===first.result.paymentFen-first.result.directCostFen&&old.result.directCostFen===first.result.directCostFen&&unchangedBudget(previous,current)){
  if(cash===cashText(first.result.paymentFen,true)&&cause===paymentCause(current.date,first.result.paymentFen,first.result.directCostFen,first.result.netOrderFen)&&sameFeedback(rows,[offer])&&onlyCash(previous,current,contract.id,first.result.paymentFen))return paidBrief(first.result.paymentFen)
 }
 return null
}

/** The visible exact receipt already says the actual amount. Retain cost/net
 * beside it; closing the echo restores the original complete scene facts. */
export function firstOrderPaidFacts(p:Pick<GamePanelProps,'view'|'features'>,thread:PlayerThreadView,notice:{date:string;text:string;brief?:string;frame:EchoFrame|null}):string[]|null {
 const first=p.features.firstOrder,frame=notice.frame,focus=thread.focus
 if(focus.kind!=='first-order'||focus.runId!==p.view.runId||focus.accountId!=='personal'||focus.entityId!==null&&focus.entityId!==first.contractId||thread.focusStatus==='invalid'||thread.focusScope==='history'||thread.responsibilityOverrideNeeded||first.status!=='settled'||!frame||frame.quarterChanged||notice.date!==p.view.date||frame.dateAfter!==p.view.date||!day(frame.dateBefore)||frame.dateBefore>=frame.dateAfter||notice.brief!==paidBrief(first.result.paymentFen))return null
 if(![first.result.paymentFen,first.result.directCostFen].every(natural)||first.result.paymentFen===0||first.result.confirmedIncomeFen!==first.result.paymentFen||first.result.netOrderFen!==first.result.paymentFen-first.result.directCostFen||frame.pointsBefore!==frame.pointsAfter||frame.pointsAfter!==p.view.budget.available||frame.spentBefore!==frame.spentAfter||frame.spentAfter!==p.view.budget.spent||frame.reservedBefore!==frame.reservedAfter||frame.reservedAfter!==p.view.budget.reserved)return null
 if(new Set(frame.accounts.map(a=>a.id)).size!==frame.accounts.length||frame.accounts.filter(a=>a.id==='personal').length!==1||frame.accounts.some(a=>{const current=p.view.accounts.filter(row=>row.accountId===a.id);return current.length!==1||a.before===null||current[0]!.availableFen!==a.after||a.after-a.before!==(a.id==='personal'?first.result.paymentFen:0)}))return null
 const contracts=p.view.operations?.contracts.filter(c=>c.id===first.contractId&&c.offerId===first.offerId&&c.settledAt===p.view.date&&c.status==='settled')??[],finance=p.features.workbench.finance.filter(a=>a.accountId==='personal')
 if(contracts.length!==1||finance.length!==1)return null
 const payments=finance[0]!.transactions.filter(t=>t.sourceId===first.contractId&&t.amountFen>0)
 if(!payments.length||payments.some(t=>t.date!==p.view.date)||payments.reduce((sum,t)=>sum+t.amountFen,0)!==first.result.paymentFen||payments.some(t=>!thread.resultRefs.some(ref=>ref.kind==='payment'&&ref.id===t.id&&ref.date===t.date)))return null
 const original=cashText(first.result.paymentFen,true)+' '+paymentCause(p.view.date,first.result.paymentFen,first.result.directCostFen,first.result.netOrderFen)+' 那份原委托，有了新的实际反馈。 日历从'+frame.dateBefore+'走到'+frame.dateAfter+'。'
 if(notice.text!==original&&notice.text!==original+' 日子先停在这次真实反馈，剩下的安排仍在原日历里。')return null
 return [`制作成本${moneyText(first.result.directCostFen)} · 本单净额${moneyText(first.result.netOrderFen)}。`]
}
