import assert from 'node:assert/strict'

interface Job623 {
 id:string;status:string;startAt:string;completeAt:string;resources:readonly string[]
}
export interface Control623Input {
 revision:number;date:string;phase:string;quarter:string;runId:string;actorId:string;seed:string;origin:string
 businessId:string;accountId:string;lifecycle:string;periodCount:number;activePeriodIds:readonly string[]
 period:{id:string;status:string;from:string;to:string;customerIds:readonly string[];supportMode:string;job:Job623|null;supportJob:Job623|null}
 budget:{available:number;quarter:string;reserved:number;spent:number;total:number}
 lastBoughtMonth:string|null;pauseReason:string|null
}
export interface Control623Pin {
 businessId:string;accountId:string;customerIds:readonly string[];lastBoughtMonth:string|null
 period:{id:string;status:string;from:string;to:string;job:Job623;supportJob:Job623}
 budget:Control623Input['budget']
 nextOriginalCommand:{runId:string;actorId:string;commandId:string;expectedRevision:number;kind:string;payload:{date:string}}
}
const jobIdentity=(job:Job623)=>({id:job.id,status:job.status,startAt:job.startAt,completeAt:job.completeAt,resources:job.resources})

/** Original serviceQuarter was inside finishPeriod/advance, just before send624.
 * The first Q4 period had already incremented the original local count to1. */
export function original623Remainder(current:Control623Input,pin:Control623Pin){
 assert.equal(current.revision,623);assert.equal(current.date,'2024-10-10');assert.equal(current.phase,'snapshot');assert.equal(current.quarter,'2024-Q4')
 assert.equal(current.runId,'u6-board-capital-pilot-v1');assert.equal(current.actorId,'player');assert.equal(current.origin,'normal');assert.equal(current.seed,'normal-relay-s03-v1')
 assert.equal(current.businessId,pin.businessId);assert.equal(current.accountId,pin.accountId);assert.equal(current.lifecycle,'operating')
 assert.equal(current.periodCount,1);assert.deepEqual(current.activePeriodIds,[pin.period.id])
 assert.equal(current.period.id,pin.period.id);assert.equal(current.period.status,'running');assert.equal(current.period.from,'2024-10-02');assert.equal(current.period.to,'2024-10-30')
 assert.equal(pin.period.id,'rly:32d7b9b0deb14854b207c8c49fe2556f');assert.equal(pin.period.from,current.period.from);assert.equal(pin.period.to,current.period.to)
 assert.equal(current.period.supportMode,'guided');assert.equal(pin.customerIds.length,20);assert.equal(new Set(pin.customerIds).size,20);assert.deepEqual(current.period.customerIds,pin.customerIds)
 assert.ok(current.period.job);assert.ok(current.period.supportJob)
 assert.deepEqual(jobIdentity(current.period.job),jobIdentity(pin.period.job));assert.deepEqual(jobIdentity(current.period.supportJob),jobIdentity(pin.period.supportJob))
 assert.equal(current.period.job.status,'running');assert.equal(current.period.supportJob.status,'planned');assert.equal(current.period.supportJob.startAt,'2024-10-30');assert.equal(current.period.supportJob.completeAt,'2024-11-06')
 assert.deepEqual(current.budget,{available:2,quarter:'2024-Q4',reserved:1,spent:1,total:4});assert.deepEqual(current.budget,pin.budget)
 assert.equal(current.pauseReason,null);assert.equal(current.lastBoughtMonth,'2024-09');assert.equal(current.lastBoughtMonth,pin.lastBoughtMonth)
 assert.deepEqual(pin.nextOriginalCommand,{runId:current.runId,actorId:current.actorId,commandId:'normal-capital-v2:624',expectedRevision:623,kind:'AdvanceTime',payload:{date:'2024-10-20'}})
 return{quarter:'2024-Q4',quarterStart:'2024-10-01',quarterEnd:'2024-12-31',count:1,pending:{...pin.nextOriginalCommand,payload:{...pin.nextOriginalCommand.payload}},periodId:pin.period.id,nextYear:2025,nextQuarter:1} as const
}
