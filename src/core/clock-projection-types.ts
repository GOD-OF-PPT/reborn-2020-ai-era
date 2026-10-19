/** Public, read-only existing commitments. No hidden facts or executable state cross this boundary. */
import type {DayPhase} from './timeline.ts'
export interface ClockTarget {readonly date:string;readonly phase:DayPhase}
export interface ClockCommitmentProjection {
 readonly runId:string
 readonly sourceRevision:number
 readonly from:string
 readonly target:string
 readonly targetPhase:DayPhase
 readonly accounts:readonly {
  readonly accountId:string
  readonly accruedAtFromFen:number
  readonly outflows:readonly {
   readonly id:string
   readonly date:string
   readonly originalDueAt?:string
   readonly label:string
   readonly amountFen:number
   readonly releasedFen:number
  }[]
 }[]
}
