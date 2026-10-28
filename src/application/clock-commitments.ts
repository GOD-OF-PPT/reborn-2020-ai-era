import {projectCashForecast} from './cash-forecast.ts'
import {operatingAccruals} from '../core/operations-accrual.ts'
import type {GameRun} from '../core/run-types.ts'
import type {OperationsCatalog} from '../core/operations-types.ts'
import type {ClockCommitmentProjection,ClockTarget} from '../core/clock-projection-types.ts'
import {DAY_PHASES} from '../core/timeline.ts'
import {tailBillingEvents} from '../core/tail-billing.ts'

/** The installed campaign supplies its actual catalog; no world step or unknown income is simulated. */
export function projectClockCommitments(run:GameRun,target:ClockTarget,catalog:Pick<OperationsCatalog,'loans'>,marketPoints:readonly {id:string;date:string}[]):ClockCommitmentProjection{
 const from=run.timeline.cursor.date,accrued=operatingAccruals(run,from)
 // Closing bills use the same already-declared terms as the original clock.
 // These timers are materialized by that clock only when it actually advances;
 // this local reading copy neither schedules them nor simulates a world step.
 const known=new Set([...run.timeline.pending,...run.timeline.receipts].map(e=>e.instanceId))
 const bills=run.phase==='epilogue'?tailBillingEvents(run,target.date).filter(e=>!known.has(e.instanceId)):[]
 const source=bills.length?{...run,timeline:{...run.timeline,pending:[...run.timeline.pending,...bills]}}:run
 return {runId:run.runId,sourceRevision:run.revision,from,target:target.date,targetPhase:target.phase,accounts:run.controlledAccountIds.map(accountId=>{
  const forecast=projectCashForecast(source,accountId,catalog,marketPoints,target.date)
  return {accountId,accruedAtFromFen:accrued.filter(a=>a.accountId===accountId).reduce((n,a)=>n+a.amountFen,0),outflows:forecast.flows.filter(f=>f.amountFen<0&&(f.date!==target.date||DAY_PHASES.indexOf(f.phase)<=DAY_PHASES.indexOf(target.phase))).map(f=>{
   const due=run.economy.ledger.obligations.find(o=>o.id===f.id)
   return {id:f.id,date:f.date,label:f.label,amountFen:f.amountFen,releasedFen:f.releasedFen,...(due?{originalDueAt:due.date}:{})}
  })}
 })}
}
