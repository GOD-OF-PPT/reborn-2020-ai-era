import type {WorkbenchProjection} from '../application/workbench-projection.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import type {RelaySceneProgress} from './relay-scene-progress.ts'
import type {GamePanelProps} from './game-types.ts'
import {courseWaitDate} from './course-wait-date.ts'
import {resolveRelaySceneTarget,type RelaySceneTarget} from './relay-scene-target.ts'

function parallelTeachingReview(p:Pick<GamePanelProps,'view'|'features'>,date:string):string|null{
 const course=p.features.course
 const teaching=course?.cohorts.some(cohort=>cohort.closedAt===null)
  ||course?.courses.some(lesson=>lesson.refreshes.some(refresh=>!refresh.applied&&refresh.job&&['planned','running'].includes(refresh.job.status)))
 return teaching?courseWaitDate(p.features.workbench,p.view.date,date):date
}

/** Pick the next public task feedback; the original clock still executes every intervening day. */
export function relaySceneAdvanceDate(progress:RelaySceneProgress|null,w:WorkbenchProjection,date:string,ordinary:string|null):string|null{
 if(w.pause!==null||w.progression.requiresDelivery)return null
 const next=progress?.wait?.date??progress?.nextDate
 if(!ordinary||!next||next<=date||w.progression.nextQuarterDate)return ordinary
 return playableAdvanceDate(w,date,next)
}

/** A parallel teaching promise keeps its existing conservative public review stops.
 * Relay-only daily metering still runs inside the original time command, without a daily click.
 * This does not classify hidden future events or alter an explicitly confirmed AdvanceTime.
 */
export function relayReviewDate(p:Pick<GamePanelProps,'view'|'features'>,date:string|null):string|null{
 if(date===null)return null
 const relay=p.features.relay
 // Existing invoices have already disclosed their own due dates. They are
 // meaningful decisions, unlike an unseen future request or routine meter day.
 const due=relay?.receivables.filter(invoice=>invoice.dueAt>p.view.date&&invoice.dueAt<date&&invoice.amountFen>invoice.collectedFen+invoice.reversedFen
  &&relay.customers.some(customer=>customer.id===invoice.customerId&&relay.businesses.some(business=>business.id===customer.businessId&&p.view.accounts.some(account=>account.accountId===business.accountId))))
  .map(invoice=>invoice.dueAt).sort()[0]
 const next=due??date
 return parallelTeachingReview(p,next)
}

/** Name a disclosed collection stop, rather than making its earlier date look arbitrary. */
export function relayReviewLabel(p:Pick<GamePanelProps,'view'|'features'>,date:string|null,fallback:string):string{
 const relay=p.features.relay
 return date!==null&&date>p.view.date&&relay?.receivables.some(invoice=>invoice.dueAt===date&&invoice.amountFen>invoice.collectedFen+invoice.reversedFen
  &&relay.customers.some(customer=>customer.id===invoice.customerId&&relay.businesses.some(business=>business.id===customer.businessId&&p.view.accounts.some(account=>account.accountId===business.accountId))))
  ?'等已知客户原单到期':fallback
}

/** Collecting an invoice is a choice. The same period's original work may continue
 * without a daily collection click; hard clock barriers and unpaid records remain.
 */
export function relayDeferredFeedback(p:Pick<GamePanelProps,'view'|'features'|'accountId'>,target:RelaySceneTarget|null|undefined):{date:string;label:string}|null{
 const w=p.features.workbench
 if(p.view.phase!=='playing'||w.atQuarterEnd||w.pause!==null||w.progression.requiresDelivery||target?.kind!=='period'||target.jobId||target.meterId)return null
 const r=resolveRelaySceneTarget(p.features.relay,target,{runId:p.view.runId,accountId:p.accountId,operations:p.view.operations})
 if(r.status!=='valid'||!r.period)return null
 const jobs=[r.period.job,r.period.supportJob,...p.features.relay!.auditJobs.filter(a=>a.periodIds.includes(r.period!.id)).map(a=>a.job)]
 const feedback=jobs.filter(j=>j&&['planned','running'].includes(j.status)).map(j=>({date:j!.status==='planned'?j!.startAt:j!.completeAt,kind:j!.definitionId.startsWith('relay-support-')?'支持':j!.definitionId==='relay-meter-audit'?'复核':'服务'})).filter(j=>j.date>p.view.date).sort((a,b)=>a.date.localeCompare(b.date))[0]
 if(!feedback)return null
 const date=parallelTeachingReview(p,playableAdvanceDate(w,p.view.date,feedback.date))
 return date?{date,label:date===feedback.date?'先继续原'+feedback.kind+'，待收款仍保留':'先到原日历停点，待收款仍保留'}:null
}
