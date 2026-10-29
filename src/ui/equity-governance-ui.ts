import {addDays} from '../core/calendar.ts'
import type {EquityJourney} from './equity-journey.ts'

export const EQUITY_GOVERNANCE_POLICIES=[
 {id:'independent_audit',label:'独立核对本局资本用途',question:'先核对，资本去了哪里。',effect:'若实际通过，开放本局已经发生的资本用途报告。',limit:'不揭示未来研发，也不取得单方控制。'},
 {id:'commercial_scope',label:'限定研究用途与接手方',question:'为以后的接手，划清边界。',effect:'若实际通过，从通过次日起影响新的退出申请；原报价不追改。',limit:'可能收窄后续接手范围，不保证退出、收入或控制权。'},
] as const
export const equityGovernancePolicy=(value:unknown)=>EQUITY_GOVERNANCE_POLICIES.find(p=>p.id===value)??null
export function equityGovernanceEffectiveDate(date:string){try{return addDays(date,1)}catch{return null}}

export type EquityGovernanceMark='planned'|'running'|'approved'|'rejected'|'stopped'|'unknown'
/** This is a material/readability state, never a permission or a vote. */
export function equityGovernanceMark(journey:EquityJourney):EquityGovernanceMark|null{
 const r=journey.resolution
 if(r.target?.kind!=='governance')return null
 const g=r.governance
 if(r.status!=='valid'||!g||!equityGovernancePolicy(g.policy))return 'unknown'
 if(journey.phase==='governance-planned'&&g.resolvedAt===null)return 'planned'
 if(journey.phase==='governance-running'&&g.resolvedAt===null)return 'running'
 if(journey.phase==='governance-result'&&g.resolvedAt!==null&&g.approved!==null)return g.approved?'approved':'rejected'
 if(journey.phase==='governance-stopped'&&g.resolvedAt===null&&r.job&&['cancelled','interrupted'].includes(r.job.status))return 'stopped'
 return 'unknown'
}
export const equityGovernanceMarkText:Record<EquityGovernanceMark,string>={planned:'已经排期 · 尚未开会',running:'会议进行中 · 尚未表决',approved:'本次有限通过',rejected:'本次未通过',stopped:'会议已停 · 没有表决',unknown:'原会议尚待核对'}
