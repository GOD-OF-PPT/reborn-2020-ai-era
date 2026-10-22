import {projectCashForecast} from './cash-forecast.ts'
import {operatingAccruals} from '../core/operations-accrual.ts'
import type {GameRun} from '../core/run-types.ts'
import type {OperationsCatalog} from '../core/operations-types.ts'
import type {ClockCommitmentProjection,ClockTarget} from '../core/clock-projection-types.ts'
import {DAY_PHASES} from '../core/timeline.ts'

/** The installed campaign supplies its actual catalog; no world step or unknown income is simulated. */
export function projectClockCommitments(run:GameRun,target:ClockTarget,catalog:Pick<OperationsCatalog,'loans'>,marketPoints:readonly {id:string;date:string}[]):ClockCommitmentProjection{
 const from=run.timeline.cursor.date,accrued=operatingAccruals(run,from)
 return {runId:run.runId,sourceRevision:run.revision,from,target:target.date,targetPhase:target.phase,accounts:run.controlledAccountIds.map(accountId=>{
  const forecast=projectCashForecast(run,accountId,catalog,marketPoints,target.date)
  return {accountId,accruedAtFromFen:accrued.filter(a=>a.accountId===accountId).reduce((n,a)=>n+a.amountFen,0),outflows:forecast.flows.filter(f=>f.amountFen<0&&(f.date!==target.date||DAY_PHASES.indexOf(f.phase)<=DAY_PHASES.indexOf(target.phase))).map(f=>{
   const due=run.economy.ledger.obligations.find(o=>o.id===f.id)
   return {id:f.id,date:f.date,label:f.label,amountFen:f.amountFen,releasedFen:f.releasedFen,...(due?{originalDueAt:due.date}:{})}
  })}
 })}
}
