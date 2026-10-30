import type {ProductionJob} from '../core/operations-types.ts'
import {OPERATIONS_CONTENT} from '../content/operations.ts'
import type {GamePanelProps} from './game-types.ts'
import {operatingJobMoney} from './operating-job-money.ts'
import {isoDate} from '../core/calendar.ts'

export interface OperatingJobTarget{readonly runId:string;readonly accountId:string;readonly businessId:string;readonly jobId:string}
type Source=Pick<GamePanelProps,'view'|'features'>
const kinds=new Set(['business-preparation','service-maintenance'])
const keys=['runId','accountId','businessId','jobId']
export function isOperatingJobTarget(value:unknown):value is OperatingJobTarget{
 if(value===null||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))return false
 const own=Reflect.ownKeys(value),descriptors=Object.getOwnPropertyDescriptors(value)
 return own.length===keys.length&&own.every(k=>typeof k==='string'&&keys.includes(k))&&keys.every(k=>{const d=descriptors[k];return d!==undefined&&'value'in d&&typeof d.value==='string'&&d.value.length>0})
}
export const operatingJobKey=(target:OperatingJobTarget)=>JSON.stringify([1,target.runId,target.accountId,target.businessId,target.jobId])
export function operatingJobTargetFor(p:Source,job:ProductionJob):OperatingJobTarget|null{
 if(!kinds.has(job.definitionId))return null
 const owners=p.view.operations?.businesses.filter(b=>b.id===job.businessId)??[]
 // Empty is explicitly unresolved, never a substitution of the personal account.
 return {runId:p.view.runId,accountId:owners.length===1?owners[0]!.accountId:'',businessId:job.businessId,jobId:job.id}
}
export function resolveOperatingJob(p:Source,target:unknown){
 const reason='这份原安排的主体、账户或任务来源尚未核定，请重新选择；没有换成另一项工作。'
 if(!isOperatingJobTarget(target)||target.runId!==p.view.runId)return {status:'invalid' as const,reason}
 const ops=p.view.operations,owners=ops?.businesses.filter(b=>b.id===target.businessId)??[],jobs=ops?.jobs.filter(j=>j.id===target.jobId)??[]
 if(!ops||owners.length!==1||jobs.length!==1||owners[0]!.accountId!==target.accountId||p.view.accounts.filter(a=>a.accountId===target.accountId).length!==1||jobs[0]!.businessId!==target.businessId||!kinds.has(jobs[0]!.definitionId)||ops.jobs.filter(j=>j.actionId===jobs[0]!.actionId).length!==1)return {status:'invalid' as const,reason}
 const job=jobs[0]!,definitions=OPERATIONS_CONTENT.jobs.filter(d=>d.id===job.definitionId)
 if(definitions.length!==1)return {status:'invalid' as const,reason}
 try{isoDate(job.startAt);isoDate(job.completeAt)}catch{return {status:'invalid' as const,reason}}
 if(job.completeAt<job.startAt||!['planned','running','completed','cancelled','interrupted'].includes(job.status)||!Array.isArray(job.resources)||!job.resources.length||job.resources.some(id=>typeof id!=='string'||!id))return {status:'invalid' as const,reason}
 const title=job.definitionId==='service-maintenance'?'这份维护':'这次经营准备',resourceLabels=job.resources.map(id=>{
  if(id==='player-production')return '本人实际日期产能'
  const workers=ops.workers.filter(w=>w.id===id)
  if(workers.length!==1)return '原人手来源待核对'
  const worker=workers[0]!,name=({'editor-lin':'林剪辑员','assistant-zhou':'周助理'} as Record<string,string>)[worker.definitionId]??worker.definitionId
  return name+(worker.to===null?'（实际计薪）':'（原聘用记录）')
 })
 const finances=p.features.workbench.finance.filter(f=>f.accountId===target.accountId)
 return {status:'valid' as const,reason:null,target,job,business:owners[0]!,definition:definitions[0]!,title,resourceLabels,money:operatingJobMoney(p,job),finance:finances.length===1?finances[0]:undefined}
}
