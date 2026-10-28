import {isoDate} from '../core/calendar.ts'
import type {GamePanelProps} from './game-types.ts'
import type {ProductionJob} from '../core/operations-types.ts'

type Input=Pick<GamePanelProps,'view'|'features'>
export interface ClockStopCopy{readonly label:string;readonly jobIds:readonly string[];readonly source:'public-scheduled-jobs'}
const sameJob=(a:ProductionJob|null,b:ProductionJob)=>!!a&&a.id===b.id&&a.businessId===b.businessId&&a.definitionId===b.definitionId&&a.actionId===b.actionId&&a.status===b.status&&a.startAt===b.startAt&&a.completeAt===b.completeAt&&a.resources.length===b.resources.length&&a.resources.every((r,i)=>r===b.resources[i])

/** Describes an ALREADY chosen clock date. It never picks a date, previews a
 * future outcome, reads a queue or changes a command/permission/cost. */
export function clockStopCopy(p:Input,date:string|null):ClockStopCopy|null{
 if(!date)return null
 try{isoDate(date)}catch{return null}
 if(date<p.view.date)return null
 const jobs=p.view.operations?.jobs.filter(j=>j.status==='planned'&&j.startAt===date||j.status==='running'&&j.completeAt===date)??[]
 if(!jobs.length||new Set(jobs.map(j=>j.id)).size!==jobs.length)return null
 const relay=p.features.relay
 if(!relay)return null
 const supports=jobs.filter(j=>j.status==='planned'&&j.definitionId.startsWith('relay-support-')),services=jobs.filter(j=>j.status==='running'&&j.definitionId==='relay-service')
 if(supports.length!==1||jobs.length!==1&&!(jobs.length===2&&services.length===1))return null
 const support=supports[0]!,service=services[0]
 const periods=relay.periods.filter(r=>r.businessId===support.businessId&&r.supportJobId===support.id&&sameJob(r.supportJob,support)&&(!service||r.jobId===service.id&&sameJob(r.job,service)))
 if(periods.length!==1)return null
 const business=relay.businesses.filter(b=>b.id===support.businessId)
 if(business.length!==1||p.view.accounts.filter(a=>a.accountId===business[0]!.accountId).length!==1)return null
 return {label:service?'先等这期中转服务与支持的交接':'先等已安排的中转支持开工',jobIds:jobs.map(j=>j.id),source:'public-scheduled-jobs'}
}
