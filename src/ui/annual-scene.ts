import type {LifeProjection} from '../core/life-projection.ts'

/** A later completed purchase must never furnish an earlier year's room. */
export function annualRoomImproved(jobs:LifeProjection['jobs'],through:string){
 return jobs.some(j=>j.kind==='workspace'&&j.status==='completed'&&j.result==='workspace_ready'&&j.completeAt<=through)
}
