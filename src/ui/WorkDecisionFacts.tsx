import {addDays,quarterOf} from '../core/calendar.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {moneyText} from './game-text.ts'

export interface WorkDecision {
 readonly arrangedAt:string
 readonly through:string
 readonly costFen:number
 readonly points:number
 readonly monthlySalaryFen:number
 readonly resuming:boolean
}

/** Capture presentation facts from the same decision as the original preview.
 * Unusual previews retain the complete generic confirmation. */
export function captureWorkDecision(command:CommandEnvelope,preview:CommandPreview,view:PlayingView,features:PlayFeatures):WorkDecision|null {
 if(command.kind!=='WorkQuarter'||!preview.allowed||command.runId!==view.runId||command.expectedRevision!==view.revision||view.readOnly||view.hasCandidate||view.busy||view.saveStatus!=='saved')return null
 const w=features.workbench,accounts=view.accounts.filter(a=>a.accountId==='personal')
 if(accounts.length!==1||!view.operations||preview.upfrontCostFen!==0||preview.releasedFen!==0||preview.actionAllocations||preview.actionDate!==undefined&&preview.actionDate!==view.date||preview.receivedPrepaymentFen!==undefined||preview.protectedIncreaseFen!==undefined||preview.accruedServiceFeeFen||preview.privateSale||preview.knownAdjustments)return null
 try{
  if(addDays(view.date,0)!==view.date||addDays(w.quarterEnd,0)!==w.quarterEnd||quarterOf(view.date)!==w.quarter||quarterOf(w.quarterEnd)!==w.quarter||quarterOf(addDays(w.quarterEnd,1))===w.quarter||view.date>w.quarterEnd)return null
 }catch{return null}
 const existing=view.operations.employment.filter(p=>p.quarter===w.quarter)
 if(existing.length>1)return null
 const employment=existing[0],salary=employment?.salaryFen??w.employmentMonthlySalaryFen
 if(salary===null||!Number.isSafeInteger(salary)||salary<0||preview.actionPoints!==(employment?0:2))return null
 if(employment&&(employment.limit!==addDays(w.quarterEnd,1)||employment.segments.some(s=>s.to===null||s.to>view.date)))return null
 return {arrangedAt:view.date,through:w.quarterEnd,costFen:preview.upfrontCostFen,points:preview.actionPoints,monthlySalaryFen:salary,resuming:!!employment}
}

export function WorkDecisionFacts({value}:{value:WorkDecision}) {
 return <section className="work-decision-facts">
  <p className="command-introduction">个人账户 · {value.arrangedAt}安排{value.resuming?'恢复本季工作':'本季工作'}</p>
  <dl className="command-facts work-decision-costs">
   <div><dt>现在支付</dt><dd>{moneyText(value.costFen)}</dd></div>
   <div><dt>{value.resuming?'本次新增行动':'本季行动'}</dt><dd>{value.points}点</dd></div>
  </dl>
  <ol className="work-decision-path" aria-label="这份工作的后续">
   <li><span>月末</span><div><strong>按在岗日领工资</strong><p>完整在岗月的基准为{moneyText(value.monthlySalaryFen)}，现在不会提前到账。</p></div></li>
   <li><span>本季结束</span><div><strong>{value.through}</strong><p>下一季是否继续，由你再决定。</p></div></li>
  </ol>
 </section>
}
