import {addDays,quarterOf} from './calendar.ts'
import {quarterLimit,dayBefore} from './operations-calendar.ts'
import {requireRule,RuleError} from './errors.ts'
import {hashValue} from './hash.ts'
import {visibleFacts} from './facts.ts'
import {routineStateSchema,type RoutineState,type RoutinePlan,type RoutineStep,type RoutineInputStep,routineInput} from './routine-schema.ts'
import {ROUTINE_CONTENT} from '../content/routines.ts'
import type {CommandHandler,CommandView,CommandContext} from './commands.ts'
import type {RuleModel,GameRun,VersionSet} from './run-types.ts'
import type {OperationsRuntime} from './operations.ts'
import type {RelayRuntime} from './relay.ts'
import type {WorldRuntime} from './world.ts'
export const routineId=(...parts:string[])=>`routine:${hashValue(parts).slice(0,32)}`
const state=(m:{readonly routines?:RoutineState|null})=>{requireRule(m.routines,'ROUTINES_NOT_CONFIGURED');return m.routines}
const allowed=()=>({allowed:true,reasonCodes:[] as readonly string[],actionPoints:0,upfrontCostFen:0,releasedFen:0})
const startOf=(quarter:string)=>`${quarter.slice(0,4)}-${String((Number(quarter.slice(-1))-1)*3+1).padStart(2,'0')}-01`
const dayOffset=(from:string,to:string)=>Math.round((Date.parse(to+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/86400000)
type Scope=Pick<RoutinePlan,'accountId'|'businessIds'|'resourceIds'|'quarter'|'validUntil'>
type Input=ReturnType<typeof routineInput.parse>
type RContext=Pick<RuleModel,'controlledAccountIds'|'economy'|'operations'|'world'|'market'|'video'|'course'|'relay'|'routines'>
export class RoutineRuntime{
 readonly catalog=ROUTINE_CONTENT;readonly hash=hashValue(ROUTINE_CONTENT);readonly #handlers:ReadonlyMap<string,CommandHandler>;readonly operations:OperationsRuntime;readonly relay:RelayRuntime|null;readonly clock:WorldRuntime
 constructor(operations:OperationsRuntime,relay:RelayRuntime|null,clock:WorldRuntime,handlers:readonly CommandHandler[]){this.operations=operations;this.relay=relay;this.clock=clock;this.#handlers=new Map(handlers.filter(h=>this.catalog.kinds.some(k=>k===h.kind)).map(h=>[h.kind,h]))}
 initial():RoutineState{return {version:this.catalog.version,catalogHash:this.hash,plans:[]}}
 normalizeAction(kind:string,payload:unknown):Record<string,unknown>{const handler=this.#handlers.get(kind);requireRule(handler&&this.catalog.kinds.some(k=>k===kind),'ROUTINE_OPERATION_NOT_ALLOWED');return handler.normalize(payload) as Record<string,unknown>}
 plan(m:RContext,id:string){const p=state(m).plans.find(p=>p.id===id);requireRule(p,'ROUTINE_PLAN_NOT_FOUND');requireRule(m.controlledAccountIds.includes(p.accountId),'ROUTINE_ACCOUNT_NOT_CONTROLLED');return p}
 #patch<T extends RuleModel>(m:T,plans:RoutinePlan[]):T{return {...m,routines:{...state(m),plans}}}
 #scope(m:RContext,p:Scope,step:RoutineInputStep){
  requireRule(m.controlledAccountIds.includes(p.accountId)&&new Set(p.businessIds).size===p.businessIds.length&&new Set(p.resourceIds).size===p.resourceIds.length,'ROUTINE_INVALID_SCOPE')
  requireRule(p.businessIds.every(id=>m.operations?.businesses.some(b=>b.id===id&&b.accountId===p.accountId)),'ROUTINE_BUSINESS_OUTSIDE_SCOPE')
  requireRule(p.resourceIds.every(id=>id==='player-production'||m.operations?.workers.some(w=>w.id===id)),'ROUTINE_RESOURCE_OUTSIDE_SCOPE')
  const payload=this.normalizeAction(step.kind,step.payload)
  if(step.kind==='WorkQuarter')requireRule(p.accountId==='personal','ROUTINE_BUSINESS_OUTSIDE_SCOPE')
  else if(step.kind==='PayObligation'){const owed=m.economy.ledger.obligations.find(o=>o.id===payload.obligationId);requireRule(payload.accountId===p.accountId&&owed?.businessId&&owed.date<=step.at&&p.businessIds.includes(owed.businessId),'ROUTINE_BUSINESS_OUTSIDE_SCOPE')}
  else{const businessId=typeof payload.businessId==='string'?payload.businessId:typeof payload.customerId==='string'?m.relay?.customers.find(c=>c.id===payload.customerId)?.businessId:typeof payload.cohortId==='string'?m.course?.courses.find(c=>c.id===m.course?.cohorts.find(co=>co.id===payload.cohortId)?.courseId)?.businessId:null;requireRule(businessId&&p.businessIds.includes(businessId),'ROUTINE_BUSINESS_OUTSIDE_SCOPE')}
  if(Array.isArray(payload.resources))requireRule(payload.resources.every(id=>p.resourceIds.includes(String(id))),'ROUTINE_RESOURCE_OUTSIDE_SCOPE')
 }
 #guard(m:RContext,p:RoutinePlan,date:string){
  const live=p.steps.filter(s=>s.status==='pending'),priceKinds=live.some(s=>s.kind==='StartRelayServicePeriod'||s.kind==='TopUpRelaySupplier'),supplierIds=[...new Set(live.flatMap(s=>Array.isArray(s.payload.supplierIds)?s.payload.supplierIds.map(String):typeof s.payload.supplierId==='string'?[s.payload.supplierId]:[]))].sort(),customerIds=[...new Set(live.flatMap(s=>Array.isArray(s.payload.customerIds)?s.payload.customerIds.map(String):typeof s.payload.customerId==='string'?[s.payload.customerId]:[]))].sort(),courseIds=live.flatMap(s=>typeof s.payload.cohortId==='string'?[s.payload.cohortId]:[])
  const prices=priceKinds&&this.relay?supplierIds.map(id=>{try{return [id,this.relay!.rate(m,id,date).id]}catch(error){if(error instanceof RuleError)return [id,error.code];throw error}}):[]
  const permissions=this.relay?supplierIds.map(id=>[id,...p.businessIds.map(b=>{const a=this.relay!.permission(m,b,id,date);return a?[a.id,a.expiresAt,a.purpose,a.allowedSegments]:null})]):[]
  const contracts=[...customerIds.map(id=>{const c=m.relay?.customers.find(c=>c.id===id);return c?[id,c.termEnd,c.mode,c.creditLimitFen,c.closedAt,c.terms.map(t=>[t.id,t.effectiveAt])]:[id,null]}),...courseIds.map(id=>{const co=m.course?.cohorts.find(c=>c.id===id),c=m.course?.courses.find(c=>c.id===co?.courseId);return [id,co?.closedAt??null,co?.refundUntil??null,c?.versions.map(v=>v.revision)??[]]})]
  const risk=m.world?.evidence.filter(e=>{const instance=m.world?.instances.find(i=>i.id===e.instanceId);return instance&&(instance.bindingId==='player'||p.businessIds.includes(instance.bindingId))&&this.clock.definition(instance.definitionId).presentation==='risk'})??[]
  const resources=p.resourceIds.map(id=>id==='player-production'?[id,1]:m.operations?.workers.filter(w=>w.id===id).map(w=>[w.id,w.units,w.to])??[])
  return {prices:hashValue(prices),permissions:hashValue(permissions),contracts:hashValue(contracts),risk:hashValue(risk),resources:hashValue(resources)}
 }
 #view(m:RuleModel,p:RoutinePlan,context:CommandContext):CommandView{return {runId:p.runId,actorId:context.actorId,revision:context.revision,date:m.timeline.cursor.date,phase:m.phase,controlledAccountIds:m.controlledAccountIds,economy:m.economy,cursor:m.timeline.cursor,pause:m.timeline.pause,evidence:visibleFacts(m.facts),world:m.world,operations:m.operations,market:m.market,video:m.video,course:m.course,relay:m.relay,routines:m.routines}}
 #commitment(step:RoutineStep,upfront:number){if(step.kind!=='StartRelayServicePeriod'||!this.relay)return upfront;const ids=step.payload.supplierIds as string[];return upfront+(ids.some(id=>this.relay!.supplier(id).billing==='postpaid')?Number(step.payload.maxSupplierCostFen):0)}
 inspect(m:RContext&{readonly phase?:RuleModel['phase'];readonly date?:string},kind:string,payload:Record<string,unknown>,date:string){
  requireRule(m.phase===undefined||m.phase==='playing'||kind==='CancelRoutinePlan'||kind==='CancelRoutineStep','RUN_NOT_PLAYING')
  if(kind==='CreateRoutinePlan'){requireRule(state(m).plans.length<this.catalog.maxPlans,'ROUTINE_PLAN_LIMIT');const input=payload as Input;const scope={...input,validUntil:dayBefore(quarterLimit(startOf(input.quarter)))};for(const step of input.steps)this.#scope(m,scope,step);return allowed()}
  const p=this.plan(m,String(payload.planId??payload.sourcePlanId))
  if(kind==='UpdateRoutineDraft'){requireRule(p.status==='draft','ROUTINE_DRAFT_REQUIRED');const input=payload as unknown as Input;for(const step of input.steps)this.#scope(m,{...input,validUntil:p.validUntil},step);return allowed()}
  if(kind==='ReuseRoutinePlan'){requireRule(state(m).plans.length<this.catalog.maxPlans&&String(payload.targetQuarter)>=p.quarter&&String(payload.targetQuarter)>=quarterOf(date),'ROUTINE_INVALID_REUSE_QUARTER');return allowed()}
  if(kind==='ConfirmRoutinePlan'){requireRule(p.status==='draft'&&p.quarter===quarterOf(date),'ROUTINE_CONFIRM_CURRENT_QUARTER');requireRule(p.steps.some(s=>s.status==='pending')&&p.steps.filter(s=>s.status==='pending').every(step=>step.at>=date&&step.at<=p.validUntil),'ROUTINE_STEP_OUTSIDE_VALIDITY');for(const step of p.steps)this.#scope(m,p,step);return allowed()}
  if(kind==='RunRoutineStep'){requireRule(p.status==='confirmed'&&p.steps.some(s=>s.status==='pending'),'ROUTINE_NOT_CONFIRMED');requireRule(p.steps.find(s=>s.status==='pending')?.id===payload.stepId,'ROUTINE_STEP_OUT_OF_ORDER');return allowed()}
  if(kind==='CancelRoutinePlan'){requireRule(p.status!=='cancelled','ROUTINE_ALREADY_CANCELLED');return allowed()}
  if(kind==='CancelRoutineStep'){const step=p.steps.find(s=>s.id===payload.stepId);requireRule(step&&step.status==='pending','ROUTINE_STEP_ALREADY_EXECUTED');return allowed()}
  requireRule(false,'UNKNOWN_ROUTINE_COMMAND')
 }
 apply(m:RuleModel,kind:string,payload:Record<string,unknown>,context:CommandContext,versions:VersionSet):{model:RuleModel;summary:string}{
  const date=m.timeline.cursor.date;this.inspect(m,kind,payload,date);let next=m;const id=routineId(context.commandId,kind),s=state(m),versionKey=hashValue(versions)
  const build=(input:Input,planId:string,sourcePlanId:string|null):RoutinePlan=>({...input,id:planId,runId:context.runId,validUntil:dayBefore(quarterLimit(startOf(input.quarter))),createdAt:date,updatedAt:date,sourcePlanId,versionKey,status:'draft',confirmedAt:null,guard:null,stepGuards:[],allocatedFen:0,actionPoints:0,steps:input.steps.map((step,index)=>({...step,id:routineId('step',planId,String(index)),status:'pending',executedAt:null,executionCommandId:null,actionPoints:0,allocatedFen:0,createdJobIds:[],cancelledJobIds:[]})),pauses:[]})
  if(kind==='CreateRoutinePlan')return {model:this.#patch(next,[...s.plans,build(payload as Input,id,null)]),summary:'例行草稿已保存，尚未授权执行或占用钱和行动'}
  const p=this.plan(m,String(payload.planId??payload.sourcePlanId)),replace=(plan:RoutinePlan)=>this.#patch(next,state(next).plans.map(old=>old.id===p.id?plan:old))
  if(kind==='UpdateRoutineDraft'){const fresh=build(payload as unknown as Input,p.id,p.sourcePlanId);return {model:replace({...fresh,createdAt:p.createdAt}),summary:'例行草稿已调整，仍需确认'}}
  if(kind==='ReuseRoutinePlan'){
   const quarter=String(payload.targetQuarter),from=startOf(p.quarter),target=startOf(quarter),steps=p.steps.filter(s=>payload.remainingOnly!==true||s.status==='pending').map(s=>{const shift=(value:string)=>addDays(target,Math.max(0,dayOffset(from,value)));const body={...s.payload};for(const key of ['startAt','effectiveAt'])if(typeof body[key]==='string')body[key]=shift(String(body[key]));return {at:shift(s.at),kind:s.kind,payload:body}});requireRule(steps.length>0,'ROUTINE_NO_REMAINING_ACTIONS')
   const input={name:Array.from(p.name+' · 复用').slice(0,80).join(''),quarter,accountId:p.accountId,businessIds:[...p.businessIds],resourceIds:[...p.resourceIds],cashLimitFen:p.cashLimitFen,actionLimit:p.actionLimit,steps};return {model:this.#patch(next,[...s.plans,build(input,id,p.id)]),summary:'已生成复用草稿，请重新核对日期、合同与条件；没有执行新动作'}
  }
  if(kind==='ConfirmRoutinePlan')return {model:replace({...p,status:'confirmed',confirmedAt:date,guard:this.#guard(next,p,date),stepGuards:p.steps.filter(s=>s.status==='pending').map(step=>({stepId:step.id,conditions:this.#guard(next,{...p,steps:[step]},date)})),updatedAt:date}),summary:'已确认本季有限例行授权；每步仍会重验资金、价格、资格和产能'}
  if(kind==='CancelRoutineStep'){const steps=p.steps.map(step=>step.id===payload.stepId?{...step,status:'cancelled' as const}:step);return {model:replace({...p,steps,status:steps.every(s=>s.status!=='pending')?(p.confirmedAt===null?'cancelled':'completed'):p.status,updatedAt:date}),summary:'已取消尚未执行的步骤，既有履约和账目不变'}}
  if(kind==='CancelRoutinePlan'){const steps=p.steps.map(step=>{const cancelled=[...step.cancelledJobIds];for(const jobId of step.createdJobIds){if(next.operations?.jobs.some(j=>j.id===jobId&&j.status==='planned')){next=this.operations.apply(next,{kind:'InterruptJob',jobId},routineId('cancel-job',context.commandId,jobId));cancelled.push(jobId)}}return {...step,status:step.status==='pending'?'cancelled' as const:step.status,cancelledJobIds:cancelled}});return {model:replace({...p,status:'cancelled',steps,updatedAt:date}),summary:'已停止未来授权并撤回尚未开工的安排；已执行成本与旧义务仍保留'}}
  const step=p.steps.find(s=>s.id===payload.stepId)!,pause=(reasons:string[])=>{const at=next.timeline.cursor.date;next=replace({...p,status:'paused',updatedAt:at,pauses:[...p.pauses,{date:at,stepId:step.id,reasons}]});return {model:next,summary:`例行已暂停：${reasons.join('；')}。已执行流水保留，未来动作没有接受新条件`}}
  if(step.at<date||step.at>p.validUntil)return pause(['ROUTINE_STEP_OUTSIDE_VALIDITY'])
  if(step.at>date)next=this.clock.advance(next,{date:step.at,phase:'snapshot'})
  if(next.timeline.pause!==null)return pause([next.timeline.pause.reason])
  if(next.timeline.cursor.date!==step.at)return pause(['ROUTINE_DATE_NOT_REACHED'])
  const guard=this.#guard(next,{...p,steps:[step]},step.at),expected=p.stepGuards.find(g=>g.stepId===step.id)?.conditions,changes=(Object.keys(guard) as (keyof typeof guard)[]).filter(key=>guard[key]!==expected?.[key]);if(changes.length)return pause(changes.map(key=>'ROUTINE_'+key.toUpperCase()+'_CHANGED'))
  const handler=this.#handlers.get(step.kind)!,view=this.#view(next,p,context)
  try{
   this.#scope(next,p,step);const inspection=handler.inspect(view,step.payload);if(!inspection.allowed)return pause([...inspection.reasonCodes]);const allocation=this.#commitment(step,inspection.upfrontCostFen)
   requireRule(p.allocatedFen+allocation<=p.cashLimitFen,'ROUTINE_CASH_LIMIT');requireRule(p.actionPoints+inspection.actionPoints<=p.actionLimit,'ROUTINE_ACTION_LIMIT')
   const jobIds=new Set(next.operations?.jobs.map(j=>j.id));const effect=handler.apply(next,step.payload,{...context,date:step.at}),candidate=effect.model;const createdJobIds=candidate.operations?.jobs.filter(j=>!jobIds.has(j.id)).map(j=>j.id)??[];requireRule(createdJobIds.every(id=>candidate.operations!.jobs.find(j=>j.id===id)!.completeAt<=p.validUntil),'ROUTINE_OBLIGATION_OUTSIDE_VALIDITY');next=candidate
   const steps=p.steps.map(old=>old.id===step.id?{...old,status:'completed' as const,executedAt:next.timeline.cursor.date,executionCommandId:context.commandId,actionPoints:inspection.actionPoints,allocatedFen:allocation,createdJobIds}:old),updated={...p,steps,allocatedFen:p.allocatedFen+allocation,actionPoints:p.actionPoints+inspection.actionPoints,updatedAt:next.timeline.cursor.date,status:steps.every(s=>s.status!=='pending')?'completed' as const:'confirmed' as const};next=replace(updated);return {model:next,summary:'本项例行安排已保存；工作、服务和支持仍按实际日期履约'}
  }catch(error){if(error instanceof RuleError)return pause([error.code]);throw error}
 }
 validate(run:GameRun){
  requireRule(routineStateSchema.safeParse(run.routines).success&&run.routines,'INVALID_ROUTINE_STATE');const s=run.routines,date=run.timeline.cursor.date;requireRule(s.version===this.catalog.version&&s.catalogHash===this.hash&&s.plans.length<=this.catalog.maxPlans,'ROUTINE_CONTEXT_MISMATCH');requireRule(new Set(s.plans.map(p=>p.id)).size===s.plans.length,'DUPLICATE_ROUTINE_PLAN')
  const specCache=new Map<string,{input:Input;revision:number}>()
  const payload=(receipt:GameRun['receipts'][number])=>JSON.parse(receipt.payloadSignature).payload as Record<string,unknown>
  const inputOf=(value:Record<string,unknown>)=>{const {planId:_,...spec}=value;return routineInput.parse(spec)}
  const specAt=(planId:string,through:number):{input:Input;revision:number}=>{
   const key=planId+'|'+through,cached=specCache.get(key);if(cached)return cached
   const creator=run.receipts.find(r=>(r.kind==='CreateRoutinePlan'||r.kind==='ReuseRoutinePlan')&&routineId(r.commandId,r.kind)===planId&&r.revisionAfter<=through)
   requireRule(creator,'ROUTINE_CREATION_RECEIPT_MISSING');let input:Input
   if(creator.kind==='CreateRoutinePlan')input=inputOf(payload(creator))
   else{const data=payload(creator),sourceId=String(data.sourcePlanId),source=specAt(sourceId,creator.revisionBefore),quarter=String(data.targetQuarter),from=startOf(source.input.quarter),target=startOf(quarter)
    const pending=(index:number)=>{const stepId=routineId('step',sourceId,String(index));return !run.receipts.some(r=>{if(r.revisionAfter<=source.revision||r.revisionAfter>creator.revisionBefore)return false;const body=payload(r);if(body.planId!==sourceId)return false;if(r.kind==='CancelRoutinePlan')return true;if(body.stepId!==stepId)return false;return r.kind==='CancelRoutineStep'||r.kind==='RunRoutineStep'&&r.summary==='本项例行安排已保存；工作、服务和支持仍按实际日期履约'})}
    const shift=(value:string)=>addDays(target,Math.max(0,dayOffset(from,value))),steps=source.input.steps.filter((_,index)=>data.remainingOnly!==true||pending(index)).map(step=>{const body={...step.payload};for(const field of ['startAt','effectiveAt'])if(typeof body[field]==='string')body[field]=shift(String(body[field]));return {at:shift(step.at),kind:step.kind,payload:body}})
    input={...source.input,name:Array.from(source.input.name+' · 复用').slice(0,80).join(''),quarter,steps}
   }
   const changes=run.receipts.filter(r=>r.kind==='UpdateRoutineDraft'&&r.revisionAfter>creator.revisionAfter&&r.revisionAfter<=through&&payload(r).planId===planId),confirmed=run.receipts.find(r=>r.kind==='ConfirmRoutinePlan'&&r.revisionAfter<=through&&payload(r).planId===planId)
   requireRule(changes.every(r=>!confirmed||r.revisionAfter<confirmed.revisionAfter),'ROUTINE_CONFIRMED_SPEC_REWRITE')
   const last=changes.at(-1);if(last)input=inputOf(payload(last));const result={input,revision:last?.revisionAfter??creator.revisionAfter};specCache.set(key,result);return result
  }
  for(const p of s.plans){requireRule(p.runId===run.runId&&p.versionKey===hashValue(run.versions)&&p.createdAt<=p.updatedAt&&p.updatedAt<=date&&p.validUntil===dayBefore(quarterLimit(startOf(p.quarter))),'INVALID_ROUTINE_PLAN');if(p.sourcePlanId!==null)requireRule(s.plans.some(old=>old.id===p.sourcePlanId&&old.createdAt<=p.createdAt),'ROUTINE_SOURCE_PLAN_MISSING');requireRule(new Set(p.steps.map(step=>step.id)).size===p.steps.length,'DUPLICATE_ROUTINE_STEP');let allocation=0,points=0
   const origin=specAt(p.id,run.revision),actual={name:p.name,quarter:p.quarter,accountId:p.accountId,businessIds:p.businessIds,resourceIds:p.resourceIds,cashLimitFen:p.cashLimitFen,actionLimit:p.actionLimit,steps:p.steps.map(step=>({at:step.at,kind:step.kind,payload:step.payload}))};requireRule(hashValue(actual)===hashValue(origin.input),'ROUTINE_AUTHORIZATION_SPEC_MISMATCH')
   const confirmation=run.receipts.find(r=>r.kind==='ConfirmRoutinePlan'&&payload(r).planId===p.id);requireRule(p.confirmedAt===null?!confirmation:confirmation?.date===p.confirmedAt,'ROUTINE_CONFIRMATION_RECEIPT_MISSING')
   for(const step of p.steps){this.#scope(run,p,step);requireRule(hashValue(this.normalizeAction(step.kind,step.payload))===hashValue(step.payload),'NONCANONICAL_ROUTINE_ACTION');if(step.status==='completed'){const receipt=run.receipts.find(r=>r.commandId===step.executionCommandId);const identity=receipt?JSON.parse(receipt.payloadSignature) as {payload:{planId:string;stepId:string}}:null;requireRule(receipt?.kind==='RunRoutineStep'&&receipt.date===step.executedAt&&identity?.payload.planId===p.id&&identity.payload.stepId===step.id&&step.executedAt===step.at&&step.at<=p.validUntil,'ROUTINE_STEP_RECEIPT_MISSING');requireRule(step.createdJobIds.every(id=>run.operations?.jobs.some(j=>j.id===id&&p.businessIds.includes(j.businessId)&&j.completeAt<=p.validUntil)),'ROUTINE_JOB_MISSING');allocation+=step.allocatedFen;points+=step.actionPoints}else requireRule(step.executedAt===null&&step.executionCommandId===null&&step.allocatedFen===0&&step.actionPoints===0&&step.createdJobIds.length===0,'PREMATURE_ROUTINE_EXECUTION');requireRule(step.cancelledJobIds.every(id=>step.createdJobIds.includes(id)&&run.operations?.jobs.some(j=>j.id===id&&j.status==='cancelled')),'INVALID_ROUTINE_JOB_CANCELLATION')}
   requireRule(allocation===p.allocatedFen&&points===p.actionPoints&&allocation<=p.cashLimitFen&&points<=p.actionLimit,'ROUTINE_BUDGET_MISMATCH');requireRule(new Set(p.stepGuards.map(g=>g.stepId)).size===p.stepGuards.length&&p.stepGuards.every(g=>p.steps.some(step=>step.id===g.stepId)),'INVALID_ROUTINE_STEP_GUARDS');if(p.confirmedAt!==null)requireRule(p.steps.filter(s=>s.status!=='cancelled').every(step=>p.stepGuards.some(g=>g.stepId===step.id)),'ROUTINE_STEP_GUARD_MISSING');if(p.status==='draft')requireRule(p.stepGuards.length===0&&p.guard===null&&p.confirmedAt===null&&p.steps.every(s=>s.status!=='completed'),'ROUTINE_DRAFT_EXECUTED');else if(p.status!=='cancelled')requireRule(p.guard!==null&&p.confirmedAt!==null&&p.confirmedAt<=date,'ROUTINE_AUTHORIZATION_MISSING');if(p.status==='completed')requireRule(p.steps.every(s=>s.status!=='pending'),'ROUTINE_FALSE_COMPLETION');for(const pause of p.pauses)requireRule(pause.date<=date&&p.steps.some(s=>s.id===pause.stepId),'INVALID_ROUTINE_PAUSE')
  }
 }
}
