import {z} from 'zod'
import {defineCommand} from '../core/commands.ts'
import {idSchema as id} from '../core/record-schemas.ts'
import {routineInput} from '../core/routine-schema.ts'
import type {RoutineRuntime} from '../core/routines.ts'
import type {VersionSet} from '../core/run-types.ts'
export function createRoutineHandlers(runtime:RoutineRuntime,versions:VersionSet){
 const input=routineInput.transform(value=>({...value,steps:value.steps.map(step=>({...step,payload:runtime.normalizeAction(step.kind,step.payload)}))})),quarter=z.string().regex(/^202[0-5]-Q[1-4]$/)
 const schemas:Record<string,z.ZodType<Record<string,unknown>>>={CreateRoutinePlan:input,UpdateRoutineDraft: routineInput.extend({planId:id}).transform(value=>({...value,steps:value.steps.map(step=>({...step,payload:runtime.normalizeAction(step.kind,step.payload)}))})),ReuseRoutinePlan:z.strictObject({sourcePlanId:id,targetQuarter:quarter,remainingOnly:z.boolean().default(false)}),ConfirmRoutinePlan:z.strictObject({planId:id}),RunRoutineStep:z.strictObject({planId:id,stepId:id}),CancelRoutinePlan:z.strictObject({planId:id}),CancelRoutineStep:z.strictObject({planId:id,stepId:id})}
 return Object.entries(schemas).map(([kind,schema])=>defineCommand(kind,schema,(view,payload)=>runtime.inspect(view,kind,payload,view.date),(model,payload,context)=>{const r=runtime.apply(model,kind,payload,context,versions);return {model:r.model,summary:r.summary,domain:'routine'}}))
}
