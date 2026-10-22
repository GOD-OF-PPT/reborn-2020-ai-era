import {LIFE_CONTENT} from '../content/life.ts'
import {hashValue} from './hash.ts'
import {requireRule} from './errors.ts'
import {lifeCatalogSchema,type LifeCatalog,type LifeState,type LifePerson,type LifeReference,type LifeJob,type LifePromise} from './life-schema.ts'
import type {RuleModel} from './run-types.ts'
import type {ScheduledEvent} from './timeline.ts'
import type {RunOperation} from './content-types.ts'
import {addDays} from './calendar.ts'
import {dayBefore} from './operations-calendar.ts'

export type LifeContext=Pick<RuleModel,'controlledAccountIds'|'economy'|'world'|'operations'|'video'|'course'|'story'|'life'>
export const lifeId=(...parts:string[])=>'life:'+hashValue(parts).slice(0,32)
export const LIFE_CATALOG:LifeCatalog=lifeCatalogSchema.parse(LIFE_CONTENT)
export const LIFE_HASH=hashValue(LIFE_CATALOG)
export const LIFE_COMMAND_KINDS=['StartLifeWork','FulfillLifePromise','InterruptLifeWork','SetLifePriority','AcceptLifePromise','DeclineLifePromise'] as const
export function initialLife():LifeState{return {catalogVersion:LIFE_CATALOG.version,catalogHash:LIFE_HASH,jobs:[],promises:[],priorities:[],agenda:[],logs:[]}}
export function lifeOf(m:Pick<LifeContext,'life'>):LifeState{requireRule(m.life,'LIFE_NOT_CONFIGURED');return m.life}
export function lifePerson(id:string){const p=LIFE_CATALOG.people.find(p=>p.id===id);requireRule(p,'UNKNOWN_LIFE_PERSON');return p}
export function lifeEvent(type:import('./life-schema.ts').LifeEvent['type'],entityId:string,date:string):ScheduledEvent<RunOperation>{
 const phase=type==='agenda'?'world_update':type==='finish_job'?'player_actions':'snapshot'
 return {instanceId:lifeId(type,entityId,date),date,phase,priority:type==='agenda'?-10:type==='finish_job'?50:type==='offer_expiry'?80:90,payload:{kind:'life_event',type,entityId,date}}
}
export function agendaEvents(){return LIFE_CATALOG.busy.flatMap(b=>[lifeEvent('agenda',b.id+':start',b.from),lifeEvent('agenda',b.id+':end',b.to)])}
export function personAvailable(personId:LifePerson,from:string,to:string){return !LIFE_CATALOG.busy.some(b=>b.personId===personId&&b.from<to&&b.to>from)}
export function personalReferences(m:LifeContext,date:string):LifeReference[]{
 const refs:LifeReference[]=[]
 for(const c of m.operations?.contracts??[])if(c.caseKey!==null&&c.status==='settled'&&c.settledAt!==null&&c.settledAt<date)refs.push({kind:'paid_case',id:c.id,date:c.settledAt})
 for(const c of m.video?.contracts??[])if(c.status==='settled'&&c.settledAt!==null&&c.settledAt<date&&c.feePosted)refs.push({kind:'paid_case',id:c.id,date:c.settledAt})
 for(const w of m.video?.works??[]){const j=m.operations?.jobs.find(j=>j.id===w.jobId);if(w.productId==='original_series'&&w.materialId==='original'&&j?.status==='completed'&&j.completeAt<date)refs.push({kind:'video_work',id:j.id,date:j.completeAt})}
 for(const c of m.course?.cohorts??[])if(c.closedAt!==null&&c.closedAt<date&&c.supportSatisfied&&c.stages.every(s=>s.deliveredAt!==null&&s.amountFen>0)&&m.course!.payments.some(p=>p.cohortId===c.id&&p.amountFen>0))refs.push({kind:'course_delivery',id:c.id,date:c.closedAt})
 const l=m.story?.linzhou,j=m.story?.jobs.find(j=>j.id===l?.participationJobId)
 if(l?.willingness==='agreed'&&j?.status==='completed'&&j.completeAt<date)refs.push({kind:'linzhou_participation',id:j.id,date:j.completeAt})
 return refs.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))
}
export function personKnown(m:LifeContext,id:LifePerson,date:string){
 if(id==='tang-ying')return true
 if(id==='linzhou')return m.story?.linzhou.opportunityAt!==null&&m.story?.linzhou.opportunityAt!==undefined&&m.story.linzhou.opportunityAt<=date
 const refs=personalReferences(m,date).filter(r=>r.kind!=='linzhou_participation')
 return id==='xu-cheng'?date>=LIFE_CATALOG.peerAvailableAt&&m.world?.anchors.some(a=>a.id==='H002'&&a.happenedAt<date)===true&&refs.length>0:refs.some(r=>r.kind==='paid_case'||r.kind==='course_delivery')
}
export function workReferences(m:LifeContext,id:LifePerson,date:string){return personalReferences(m,date).filter(r=>id==='linzhou'?r.kind==='linzhou_participation':id==='xu-cheng'?r.kind!=='linzhou_participation':r.kind==='paid_case'||r.kind==='course_delivery')}
export function referenceAllowed(m:LifeContext,id:LifePerson,ref:LifeReference|null,date:string){return id==='tang-ying'?ref===null:ref!==null&&workReferences(m,id,date).some(r=>hashValue(r)===hashValue(ref))}
export function promiseTerms(personId:LifePerson){const p=lifePerson(personId);return {points:1 as const,costFen:p.promiseCostFen,days:p.promiseDays,title:p.promiseTitle}}
export function jobTerms(kind:LifeJob['kind'],personId:LifePerson|null){if(kind==='promise_keep'){requireRule(personId,'LIFE_PROMISE_PERSON_REQUIRED');return promiseTerms(personId)}return LIFE_CATALOG.work[kind]}
export function makeLifeOffer(job:LifeJob):LifePromise|null{
 if(job.personId===null||!['friend_visit','linzhou_review','peer_notes','partner_review'].includes(job.kind)||job.status!=='completed')return null
 const year=Number(job.completeAt.slice(0,4)),terms=promiseTerms(job.personId),end=year+'-'+LIFE_CATALOG.lastDeadlineDay,deadline=addDays(job.completeAt,LIFE_CATALOG.promiseDays)<end?addDays(job.completeAt,LIFE_CATALOG.promiseDays):end
 if(job.completeAt>year+'-'+LIFE_CATALOG.lastOfferDay||addDays(job.completeAt,terms.days)>deadline)return null
 const expiry=addDays(job.completeAt,LIFE_CATALOG.offerDays);let lastStart=deadline
 for(let n=0;n<terms.days;n++)lastStart=dayBefore(lastStart)
 return {id:lifeId('promise',job.personId,String(year)),personId:job.personId,year,sharedJobId:job.id,offeredAt:job.completeAt,expiresAt:expiry<lastStart?expiry:lastStart,deadline,costFen:terms.costFen,days:terms.days,actionPoints:1,status:'offered',acceptedAt:null,acceptedCommandId:null,responseCommandId:null,resolvedAt:null,resolutionSourceId:null,completionJobId:null}
}
/** Relationship changes have evidence; viewing a person cannot create any of them. */
export function relationshipAt(m:LifeContext,personId:LifePerson,date:string){
 const shared=m.life?.jobs.filter(j=>j.personId===personId&&j.status==='completed'&&j.result==='shared_experience'&&j.completeAt<=date)??[],kept=m.life?.promises.filter(p=>p.personId===personId&&p.status==='fulfilled'&&p.resolvedAt!==null&&p.resolvedAt<=date)??[],missed=m.life?.promises.filter(p=>p.personId===personId&&p.status==='missed'&&p.resolvedAt!==null&&p.resolvedAt<=date)??[]
 const historical=personId==='linzhou'?m.story?.jobs.filter(j=>['pilot','continuity','participation'].includes(j.kind)&&j.status==='completed'&&j.completeAt<=date).map(j=>j.id)??[]:[]
 const score=Math.max(0,Math.min(100,20+shared.length*10+kept.length*15-missed.length*15+historical.length*5))
 return {score,stage:!personKnown(m,personId,date)?'unknown':missed.length>kept.length?'strained':kept.length?'reliable':shared.length||historical.length?'shared':'known',sharedJobIds:shared.map(j=>j.id),keptPromiseIds:kept.map(p=>p.id),missedPromiseIds:missed.map(p=>p.id),historicalSourceIds:historical}
}
