import type {GamePanelProps} from './game-types.ts'
import {equityDirectCosts} from './equity-costs.ts'
import type {CommandEnvelope} from '../core/run-types.ts'

export type EquityBusinessSource=Pick<GamePanelProps,'view'|'features'>
export const EQUITY_SHARED_COMMANDS=new Set(['FundBusiness','InterruptJob','RescheduleJob','WindDownBusiness','CloseBusiness'])
const one=<T,>(rows:readonly T[])=>rows.length===1?rows[0]:undefined
export function equitySharedCommandBusinessId(command:CommandEnvelope,p:EquityBusinessSource):string|null{
 if(!EQUITY_SHARED_COMMANDS.has(command.kind))return null
 const body=command.payload!==null&&typeof command.payload==='object'&&!Array.isArray(command.payload)?command.payload as Record<string,unknown>:{},job=typeof body.jobId==='string'?one(p.view.operations?.jobs.filter(j=>j.id===body.jobId)??[]):undefined,id=typeof body.businessId==='string'?body.businessId:job?.businessId
 return typeof id==='string'&&p.features.deepseek?.businesses.some(b=>b.id===id)?id:null
}
/** Public, captured facts only. This describes scope, never command eligibility. */
export function equityBusinessContinuity(p:EquityBusinessSource,businessId:string){
 const v=p.features.deepseek,ops=p.view.operations,b=one(v?.businesses.filter(b=>b.id===businessId)??[]),original=one(ops?.businesses.filter(b=>b.id===businessId)??[])
 if(!v||!ops||!b||!original||!['deepseek-investor','ecosystem-service'].includes(b.definitionId)||b.accountId!==original.accountId||b.lifecycle!==original.lifecycle||b.company!==original.company||p.view.accounts.filter(a=>a.accountId===b.accountId).length!==1)return null
 if(new Set(ops.businesses.map(b=>b.id)).size!==ops.businesses.length||new Set(ops.jobs.map(j=>j.id)).size!==ops.jobs.length||new Set(ops.workers.map(w=>w.id)).size!==ops.workers.length)return null
 const workers=ops.workers.filter(w=>w.sponsorBusinessId===b.id&&w.to===null),workerIds=new Set(workers.map(w=>w.id))
 const affected=ops.jobs.filter(j=>['planned','running'].includes(j.status)&&(j.businessId===b.id||j.resources.some(id=>workerIds.has(id))))
 if(affected.some(j=>ops.businesses.filter(owner=>owner.id===j.businessId).length!==1))return null
 const own=affected.filter(j=>j.businessId===b.id),elsewhere=affected.filter(j=>j.businessId!==b.id)
 const finance=one(p.features.workbench.finance.filter(f=>f.accountId===b.accountId))
 const agreements=v.agreements.filter(a=>a.businessId===b.id&&a.accountId===b.accountId),agreementIds=new Set(agreements.map(a=>a.id)),exits=v.exits.filter(e=>agreementIds.has(e.agreementId)&&e.businessId===b.id)
 return {business:b,finance,workers,affected,own,elsewhere,agreements,exits,costs:equityDirectCosts(b.id,b.accountId,ops.jobs,p.features.workbench.finance,p.view.date)}
}
export type EquityBusinessContinuity=NonNullable<ReturnType<typeof equityBusinessContinuity>>
