import type {GamePanelProps} from './game-types.ts'
import type {ProductionJob} from '../core/operations-types.ts'
import {DEEPSEEK_JOBS} from '../content/deepseek.ts'
import {isoDate} from '../core/calendar.ts'

type Contract=NonNullable<GamePanelProps['features']['deepseek']>['contracts'][number]
type Finance=GamePanelProps['features']['workbench']['finance']
export interface EcosystemDirectCosts{readonly paidFen:number|null;readonly reservedFen:number|null;readonly reason:string|null}
const missing:EcosystemDirectCosts={paidFen:null,reservedFen:null,reason:'部分制作或支持的任务、流水来源尚未完整取得，不能按零元处理。'}
const validDate=(date:string)=>{try{isoDate(date);return true}catch{return false}}
const sum=(values:readonly number[])=>{const total=values.reduce((a,b)=>a+b,0);return values.every(n=>Number.isSafeInteger(n)&&n>=0)&&Number.isSafeInteger(total)?total:null}

/** Direct job budgets only. Capital, prepayment, revenue, payroll and maintenance
 * keep their own original records; this never calculates profit or grants an action. */
export function ecosystemContractCosts(c:Contract,jobs:readonly ProductionJob[]|undefined,finance:Finance|undefined,asOf:string):EcosystemDirectCosts{
 if(!validDate(asOf)||!c.balance||!jobs||!finance)return missing
 const ids=new Set([c.productionJobId,c.originalSupportJobId,c.supportJobId,...(c.remediationJobId?[c.remediationJobId]:[])])
 if([...ids].some(id=>typeof id!=='string'||!id))return missing
 const selected=[...ids].map(id=>jobs.filter(j=>j.id===id)),accounts=finance.filter(f=>f.accountId===c.balance!.accountId)
 if(selected.some(rows=>rows.length!==1)||accounts.length!==1)return missing
 const tasks=selected.map(rows=>rows[0]!),f=accounts[0]!,actions=new Set(tasks.map(j=>j.actionId))
 if(tasks.some(j=>j.businessId!==c.businessId||!validDate(j.startAt)||!DEEPSEEK_JOBS.some(t=>t.id===j.definitionId))||actions.size!==tasks.length)return missing
 const payments=f.transactions.filter(t=>actions.has(t.sourceId)&&t.amountFen<0)
 const holds=f.reservations.filter(r=>r.kind==='plan'&&r.status==='active'&&actions.has(r.originId))
 const paidSources=payments.every(t=>t.businessId===c.businessId&&validDate(t.date)&&t.date<=asOf)&&new Set(payments.map(t=>t.id)).size===payments.length
 const reserveSources=new Set(holds.map(r=>r.id)).size===holds.length
 let paidFen=paidSources?sum(payments.map(t=>-t.amountFen)):null,reservedFen=reserveSources?sum(holds.map(r=>r.amountFen)):null
 for(const job of tasks){
  const term=DEEPSEEK_JOBS.find(t=>t.id===job.definitionId)!,paid=sum(payments.filter(t=>t.sourceId===job.actionId).map(t=>-t.amountFen)),held=sum(holds.filter(r=>r.originId===job.actionId).map(r=>r.amountFen))
  const started=['running','completed'].includes(job.status)||job.status==='interrupted'&&job.releasedAt!==null&&validDate(job.releasedAt)&&job.releasedAt>=job.startAt
  if(paid!==(started?term.costFen:0))paidFen=null
  if(held!==(job.status==='planned'?term.costFen:0))reservedFen=null
 }
 return {paidFen,reservedFen,reason:paidFen===null||reservedFen===null?missing.reason:null}
}
