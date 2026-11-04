import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {ClockCommitmentProjection} from '../core/clock-projection-types.ts'
import type {PlayingView} from './game-types.ts'
import {isoDate} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'
import './clock-decision-facts.css'

export interface ClockDecision {
 readonly from:string;readonly target:string;readonly newCostFen:number;readonly newActionPoints:number
 readonly accounts:readonly {readonly id:string;readonly name:string;readonly dueFen:number;readonly accruedFen:number;readonly held:boolean}[]
}

/** Only a reading budget for the original captured clock. Unknown or complex
 * responsibilities retain the complete original review; this grants no action. */
export function captureClockDecision(command:CommandEnvelope,preview:CommandPreview,view:PlayingView,clock:ClockCommitmentProjection|null,accountName:(id:string)=>string):ClockDecision|null {
 if(command.kind!=='AdvanceTime'||!preview.allowed||view.phase!=='playing'||view.readOnly||view.hasCandidate||view.busy||view.saveStatus!=='saved'||command.runId!==view.runId||command.expectedRevision!==view.revision||!clock||clock.runId!==view.runId||clock.sourceRevision!==view.revision||clock.from!==view.date||clock.targetPhase!=='snapshot')return null
 const payload=command.payload!==null&&typeof command.payload==='object'&&!Array.isArray(command.payload)?command.payload as Record<string,unknown>:null
 if(payload?.date!==clock.target||payload.phase!==undefined&&payload.phase!=='snapshot')return null
 if(!Number.isSafeInteger(preview.upfrontCostFen)||preview.upfrontCostFen<0||!Number.isSafeInteger(preview.actionPoints)||preview.actionPoints<0||preview.actionPoints>4||preview.releasedFen!==0||preview.actionAllocations||preview.actionDate!==undefined&&preview.actionDate!==view.date||preview.receivedPrepaymentFen!==undefined||preview.protectedIncreaseFen!==undefined||preview.accruedServiceFeeFen||preview.privateSale||preview.knownAdjustments)return null
 try{if(isoDate(clock.from)!==clock.from||isoDate(clock.target)!==clock.target||clock.target<clock.from)return null}catch{return null}
 const accounts:ClockDecision['accounts'][number][]=[],ids=new Set<string>(),flowIds=new Set<string>()
 let count=0
 for(const account of clock.accounts){
  if(ids.has(account.accountId)||view.accounts.filter(a=>a.accountId===account.accountId).length!==1||!Number.isSafeInteger(account.accruedAtFromFen)||account.accruedAtFromFen<0)return null
  ids.add(account.accountId)
  let dueFen=0,held=false
  for(const flow of account.outflows){
   if(++count>6||!flow.id||flowIds.has(flow.id)||!flow.label.trim()||!Number.isSafeInteger(flow.amountFen)||flow.amountFen>0||!Number.isSafeInteger(flow.releasedFen)||flow.releasedFen<0||flow.originalDueAt!==undefined&&flow.originalDueAt!==flow.date)return null
   try{if(isoDate(flow.date)!==flow.date||flow.date<clock.from||flow.date>clock.target)return null}catch{return null}
   flowIds.add(flow.id);dueFen-=flow.amountFen;held||=flow.releasedFen>0
  }
  if(!Number.isSafeInteger(dueFen))return null
  if(account.outflows.length||account.accruedAtFromFen>0){
   const name=accountName(account.accountId)
   if(!name.trim()||Array.from(name).length>24||Array.from(moneyText(dueFen)).length>22||Array.from(moneyText(account.accruedAtFromFen)).length>22)return null
   accounts.push({id:account.accountId,name,dueFen,accruedFen:account.accruedAtFromFen,held})
  }
 }
 if(accounts.length>2)return null
 return {from:clock.from,target:clock.target,newCostFen:preview.upfrontCostFen,newActionPoints:preview.actionPoints,accounts}
}

export function ClockDecisionFacts({value}:{value:ClockDecision}) {
 return <section className="clock-decision-facts">
  <dl className="command-facts"><div><dt>从今天</dt><dd>{value.from}</dd></div><div><dt>计划走到</dt><dd>{value.target}</dd></div></dl>
  <p className="clock-new-cost">推进本身：{moneyText(value.newCostFen)} / {value.newActionPoints}点。已安排任务仍按原预留使用行动。</p>
  <section className="clock-existing-due" aria-label="原安排的已知待付">
   <h3>这段日子里的原支出</h3>
   {value.accounts.length?value.accounts.map(account=><div className="clock-existing-account" key={account.id}><p><span>{account.name}</span><strong>{moneyText(account.dueFen)}</strong></p>{account.held?<small>含原占款，按原引用转换或释放，不另占一份。</small>:null}{account.accruedFen>0?<small>已用未出账{moneyText(account.accruedFen)}，是原成本的一部分，不与同笔到期账单重复相加。</small>:null}</div>):<p className="clock-no-due">原排程未列本段已知待付。</p>}
  </section>
  <p className="clock-stop-boundary">遇到交付、决定或资金缺口会先停；费用按实际日期结算。未成交和未出账另按原条款处理。</p>
 </section>
}
