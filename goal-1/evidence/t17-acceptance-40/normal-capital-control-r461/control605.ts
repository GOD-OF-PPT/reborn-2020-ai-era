import assert from 'node:assert/strict'
export interface Control605Input{
 revision:number;date:string;quarter:string;businessId:string;accountId:string;periodCount:number;
 periods:readonly {id:string;status:string;from:string;to:string}[];activePeriods:readonly string[];
 budget:{available:number;reserved:number;spent:number;total:number};
 customers:readonly {id:string;termEnd:string}[];permissions:readonly {id:string;expiresAt:string|null}[];
 from:string;to:string;required:string;renewedTerm:string
}
/** Resume the original serviceQuarter while body after 15 of 20 renewals.
 * Input is the original public projection, never a proposal or future state. */
export function original605Remainder(c:Control605Input){
 assert.equal(c.revision,605);assert.equal(c.date,'2024-07-31');assert.equal(c.quarter,'2024-Q3')
 assert.equal(c.businessId,'ops:ba624da362c2c6850efa1eff912fe9f8');assert.equal(c.accountId,'ops:5324790e65be34234f2f8fab9737ae4e')
 assert.equal(c.periodCount,0);assert.equal(c.periods.length,0);assert.equal(c.activePeriods.length,0)
 assert.deepEqual(c.budget,{available:2,quarter:'2024-Q3',reserved:0,spent:2,total:4})
 assert.equal(c.from,'2024-08-01');assert.equal(c.to,'2024-08-29');assert.equal(c.required,'2024-08-28');assert.equal(c.renewedTerm,'2024-10-29')
 assert.equal(c.customers.length,20);assert.equal(new Set(c.customers.map(row=>row.id)).size,20)
 assert.ok(c.customers.slice(0,15).every(row=>row.termEnd===c.renewedTerm));assert.ok(c.customers.slice(15).every(row=>row.termEnd<c.required))
 assert.ok(c.permissions.length>0&&c.permissions.at(-1)!.expiresAt!==null&&c.permissions.at(-1)!.expiresAt!>=c.to)
 return {quarterEnd:'2024-09-30',count:0,from:c.from,to:c.to,remainingRenewals:c.customers.slice(15).map(row=>row.id),nextRevision:606,nextCommandId:'normal-capital-v2:606',nextYear:2024,nextQuarter:4} as const
}
