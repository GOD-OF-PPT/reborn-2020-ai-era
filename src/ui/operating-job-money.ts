import type {ProductionJob} from '../core/operations-types.ts'
import {OPERATIONS_CONTENT} from '../content/operations.ts'
import {isoDate} from '../core/calendar.ts'
import type {GamePanelProps} from './game-types.ts'

type Source=Pick<GamePanelProps,'view'|'features'>
export interface OperatingJobMoney{readonly paidFen:number|null;readonly reservedFen:number|null;readonly reason:string|null}
const unknown:OperatingJobMoney={paidFen:null,reservedFen:null,reason:'这份安排的实付或预留来源待核对，不能按零说明。'}
const date=(value:string)=>{try{isoDate(value);return true}catch{return false}}
const sum=(values:readonly number[])=>{const n=values.reduce((a,b)=>a+b,0);return values.every(v=>Number.isSafeInteger(v)&&v>=0)&&Number.isSafeInteger(n)?n:null}

/** Read actual public payment/hold references. This never decides eligibility. */
export function operatingJobMoney(p:Source,job:ProductionJob):OperatingJobMoney{
 const ops=p.view.operations,owners=ops?.businesses.filter(b=>b.id===job.businessId)??[],definition=OPERATIONS_CONTENT.jobs.filter(d=>d.id===job.definitionId)
 if(!ops||owners.length!==1||definition.length!==1||ops.jobs.filter(j=>j.id===job.id&&j.actionId===job.actionId&&j.businessId===job.businessId).length!==1||ops.jobs.filter(j=>j.actionId===job.actionId).length!==1||!date(p.view.date)||!date(job.startAt)||!date(job.completeAt))return unknown
 const accountId=owners[0]!.accountId,accounts=p.features.workbench.finance.filter(f=>f.accountId===accountId)
 if(accounts.length!==1||p.view.accounts.filter(a=>a.accountId===accountId).length!==1)return unknown
 const f=accounts[0]!,transactions=f.transactions.filter(t=>t.sourceId===job.actionId),metrics=f.metrics.filter(m=>m.kind==='cost'&&m.sourceEventId===job.actionId),holds=f.reservations.filter(r=>r.kind==='plan'&&r.status==='active'&&r.originId===job.actionId)
 if(new Set(transactions.map(t=>t.id)).size!==transactions.length||new Set(metrics.map(m=>m.operationId)).size!==metrics.length||new Set(holds.map(r=>r.id)).size!==holds.length||holds.some(r=>r.accountId!==accountId))return unknown
 const payments=transactions.filter(t=>t.amountFen<0&&metrics.some(m=>m.operationId===t.id&&m.sourceEventId===t.sourceId&&m.accountId===accountId&&m.businessId===job.businessId&&m.date===t.date&&m.deltaFen===-t.amountFen))
 if(payments.some(t=>t.businessId!==job.businessId||!date(t.date)||t.date>p.view.date))return unknown
 const paid=sum(payments.map(t=>-t.amountFen)),reserved=sum(holds.map(r=>r.amountFen)),started=job.status==='running'||job.status==='completed'||job.status==='interrupted'&&job.releasedAt!==null&&date(job.releasedAt)&&job.releasedAt>=job.startAt,cost=definition[0]!.costFen
 const paidFen=paid===(started?cost:0)?paid:null,reservedFen=reserved===(job.status==='planned'?cost:0)?reserved:null
 return {paidFen,reservedFen,reason:paidFen===null||reservedFen===null?unknown.reason:null}
}
