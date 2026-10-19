import {BOOTSTRAP_CONTENT} from '../content/bootstrap.ts'
import {addDays,monthEnd} from './calendar.ts'
import {operatingId} from './operations-calendar.ts'
import {requireRule} from './errors.ts'
import {hashValue} from './hash.ts'
import type {ScheduledEvent} from './timeline.ts'
import type {RunOperation} from './content-types.ts'
import type {RuleModel,GameRun} from './run-types.ts'

/** Extends the same original terms only as far as an actually requested closing date. */
export function tailBillingEvents(m:Pick<RuleModel,'operations'>,through:string):ScheduledEvent<RunOperation>[]{
 const profile=BOOTSTRAP_CONTENT.profiles.find(p=>p.id===m.operations?.profileId);requireRule(profile&&m.operations,'TAIL_PROFILE_REQUIRED')
 const events:ScheduledEvent<RunOperation>[]=[]
 for(let from='2026-01-01';from<=through;from=addDays(monthEnd(from),1)){
  const month=from.slice(0,7),end=monthEnd(from),id='tail:living:'+from
  events.push({instanceId:id,date:from,phase:'due_obligations',priority:0,payload:{id,date:from,sourceEventId:'bootstrap:living',kind:'due_expense',accountId:'personal',counterpartyId:'world',obligationId:'tail:living-due:'+from,amountFen:profile.monthlyLivingCostFen}})
  if(end>through)continue
  for(const [type,ids] of [['wage',m.operations.workers.map(w=>w.id)],['maintenance',m.operations.businesses.filter(b=>b.activeFrom!==null).map(b=>b.id)]] as const)
   for(const entityId of ids)events.push({instanceId:operatingId(type,entityId,month),date:end,phase:'due_obligations',priority:100,payload:{kind:'operating_event',type,entityId,month,date:end}})
 }
 return events
}

export function assertTailBilling(run:GameRun){
 if(run.journey?.epilogue){const modules=new Set(['journey_event','life_event','story_event','deepseek_event','relay_event','course_event','video_event','market_event','operating_event','world_anchor','open_content_event','expire_content_event','finish_preparation']);for(const e of [...run.timeline.pending,...run.timeline.receipts.map(r=>JSON.parse(r.signature) as ScheduledEvent<RunOperation>)].filter(e=>e.date>'2025-12-31'))requireRule(modules.has(e.payload.kind)||e.instanceId.startsWith('tail:living:'),'UNOWNED_EPILOGUE_FINANCIAL_TIMER')}
 const events=[...run.timeline.pending,...run.timeline.receipts.map(r=>JSON.parse(r.signature) as ScheduledEvent<RunOperation>)].filter(e=>e.instanceId.startsWith('tail:living:')||e.payload.kind==='operating_event'&&['wage','maintenance'].includes(e.payload.type)&&(e.payload.month??'')>='2026-01')
 if(run.journey?.epilogue===null||run.journey===null){requireRule(events.length===0,'TAIL_BILLING_BEFORE_EPILOGUE');return}
 const expected=tailBillingEvents(run,run.timeline.cursor.date),byId=new Map(events.map(e=>[e.instanceId,e]))
 requireRule(events.length===expected.length&&byId.size===expected.length,'TAIL_BILLING_TIMER_MISSING')
 for(const e of expected)requireRule(hashValue(byId.get(e.instanceId)??null)===hashValue(e),'TAIL_BILLING_TIMER_MISMATCH')
}
