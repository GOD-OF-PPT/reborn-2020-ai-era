import {JOURNEY_CONTENT} from '../content/journey.ts'
import {hashValue} from './hash.ts'
import {requireRule} from './errors.ts'
import {queueEvent,type ScheduledEvent} from './timeline.ts'
import {journeyCatalogSchema,journeyStateSchema,type JourneyState} from './journey-schema.ts'
import type {RunOperation} from './content-types.ts'
import type {GameRun,RuleModel} from './run-types.ts'
import type {OperatingModel} from './operations-types.ts'

export function journeyCauseSpecs(before:JourneyState|null,after:JourneyState|null){
 const sources=(s:JourneyState|null)=>s?.quarters.flatMap(q=>[...(q.openSourceId.startsWith('journey:')?[{source:q.openSourceId,date:q.openedAt,quarter:q.quarter,type:'开启'}]:[]),...(q.closeSourceId&&q.closedAt?[{source:q.closeSourceId,date:q.closedAt,quarter:q.quarter,type:'走过'}]:[])])??[]
 const prior=new Set(sources(before).map(e=>e.source))
 return sources(after).filter(e=>!prior.has(e.source)).map(e=>({id:'journey:cause:'+e.source,date:e.date,domain:'journey',parentIds:[] as string[],sourceEventId:e.source,visibleSummary:e.quarter+'已实际'+e.type+'，原收支和未结责任保留。',visibility:'visible' as const}))
}

export class JourneyRuntime {
 readonly catalog=journeyCatalogSchema.parse(JOURNEY_CONTENT)
 readonly hash=hashValue(JOURNEY_CONTENT)
 initial(commandId:string):JourneyState{return {catalogVersion:this.catalog.version,catalogHash:this.hash,quarters:[{quarter:'2020-Q1',openedAt:'2020-01-01',openSourceId:'command:'+commandId,closedAt:null,closeSourceId:null}],epilogue:null,endings:[],resumes:[]}}
 events():ScheduledEvent<RunOperation>[]{return this.catalog.quarters.flatMap((q,index)=>[
  ...(index?[{instanceId:'journey:open:'+q.id,date:q.from,phase:'world_update' as const,priority:-2000,payload:{kind:'journey_event' as const,type:'quarter_open' as const,quarter:q.id,date:q.from}}]:[]),
  {instanceId:'journey:close:'+q.id,date:q.through,phase:'snapshot' as const,priority:Number.MAX_SAFE_INTEGER-1,payload:{kind:'journey_event' as const,type:'quarter_close' as const,quarter:q.id,date:q.through}},
 ])}
 schedule(model:RuleModel):RuleModel{let timeline=model.timeline;for(const event of this.events())timeline=queueEvent(timeline,event);return {...model,timeline}}
 reduce(model:OperatingModel,event:ScheduledEvent<RunOperation>){
  const op=event.payload,s=model.journey;requireRule(s&&op.kind==='journey_event','JOURNEY_REQUIRED')
  const quarters=op.type==='quarter_open'?[...s.quarters,{quarter:op.quarter,openedAt:event.date,openSourceId:event.instanceId,closedAt:null,closeSourceId:null}]:s.quarters.map(q=>q.quarter===op.quarter?{...q,closedAt:event.date,closeSourceId:event.instanceId}:q)
  return {state:{...model,journey:{...s,quarters}}}
 }
 validate(run:GameRun){
  if(run.journey===null){requireRule(run.origin==='fixture'&&run.phase==='playing','JOURNEY_REQUIRED');return}
  const parsed=journeyStateSchema.safeParse(run.journey);requireRule(parsed.success,'INVALID_JOURNEY_STATE');const s=parsed.data
  requireRule(s.catalogVersion===this.catalog.version&&s.catalogHash===this.hash,'JOURNEY_CATALOG_MISMATCH')
  const creation=run.receipts[0];requireRule(creation?.kind==='CreateRun','JOURNEY_CREATION_REQUIRED')
  type Event=ScheduledEvent<RunOperation>&{processed:boolean}
  const actual:Event[]=[...run.timeline.pending.map(e=>({...e,processed:false})),...run.timeline.receipts.map(r=>({...JSON.parse(r.signature),processed:true}) as Event)].filter(e=>e.payload.kind==='journey_event'||e.instanceId.startsWith('journey:'))
  const byId=new Map(actual.map(e=>[e.instanceId,e]));requireRule(byId.size===actual.length,'DUPLICATE_JOURNEY_TIMER')
  const expected=this.events();requireRule(actual.length===expected.length,'JOURNEY_TIMER_COUNT')
  const processed=new Set<string>()
  for(const e of expected){const found=byId.get(e.instanceId);requireRule(found,'JOURNEY_TIMER_MISSING');const {processed:done,...value}=found;requireRule(hashValue(value)===hashValue(e),'JOURNEY_TIMER_MISMATCH');if(done)processed.add(e.instanceId)}
  const quarters=this.initial(creation.commandId).quarters.map(q=>({...q}))
  for(const q of this.catalog.quarters){
   if(q.id!=='2020-Q1'&&processed.has('journey:open:'+q.id))quarters.push({quarter:q.id,openedAt:q.from,openSourceId:'journey:open:'+q.id,closedAt:null,closeSourceId:null})
   if(processed.has('journey:close:'+q.id)){const row=quarters.find(r=>r.quarter===q.id);requireRule(row,'JOURNEY_QUARTER_NOT_OPEN');row.closedAt=q.through;row.closeSourceId='journey:close:'+q.id}
  }
  requireRule(hashValue(s.quarters)===hashValue(quarters),'JOURNEY_QUARTER_SOURCE_MISMATCH')
  const specs=journeyCauseSpecs(null,s),causeIds=new Set(specs.map(c=>c.id))
  for(const spec of specs){const cause=run.causes.find(c=>c.id===spec.id),clock=run.receipts.find(r=>r.commandId===cause?.commandId);requireRule(cause&&clock&&['AdvanceTime','RunRoutineStep'].includes(clock.kind)&&clock.causeIds.includes(spec.id)&&clock.date>=spec.date&&run.receipts[clock.revisionBefore-1]!.date<=spec.date&&hashValue({...cause,commandId:''})===hashValue({...spec,commandId:''}),'JOURNEY_CLOCK_SOURCE_MISSING')}
  for(const r of run.timeline.receipts.filter(r=>r.instanceId.startsWith('journey:')))requireRule(r.pauseReason===null&&r.skippedReason===undefined,'JOURNEY_TIMER_RESULT_MISMATCH')
  requireRule(run.causes.filter(c=>c.domain==='journey').every(c=>causeIds.has(c.id)),'ORPHAN_JOURNEY_CAUSE')
  requireRule(s.epilogue===null&&s.endings.length===0&&s.resumes.length===0&&run.phase==='playing','JOURNEY_PHASE_SOURCE_MISMATCH')
 }
}

export function projectJourney(run:GameRun,runtime:JourneyRuntime){
 const s=run.journey;return s?{classification:'fictional' as const,asOf:run.timeline.cursor.date,phase:run.phase,chapters:s.quarters.map(q=>({...q,...runtime.catalog.quarters.find(c=>c.id===q.quarter)!})),closedQuarters:s.quarters.filter(q=>q.closedAt!==null).length,yearThemes:runtime.catalog.years.slice(0,Math.min(6,Number(run.timeline.cursor.date.slice(0,4))-2019)),canEnterEpilogue:false}:null
}
