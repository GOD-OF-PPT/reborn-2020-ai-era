import {z} from 'zod'
import {idSchema as id,dateSchema as date,moneySchema as money,safeCount as count,rows} from './record-schemas.ts'
export const routineKind=z.enum(['WorkQuarter','StartCourseRecovery','StartRelayServicePeriod','TopUpRelaySupplier','CollectRelayDue','PayObligation'])
export const routineInputStep=z.strictObject({at:date,kind:routineKind,payload:z.record(z.string(),z.unknown())})
const guard=z.strictObject({prices:id,permissions:id,contracts:id,risk:id,resources:id})
const step=z.strictObject({...routineInputStep.shape,id,status:z.enum(['pending','completed','cancelled']),executedAt:date.nullable(),executionCommandId:id.nullable(),actionPoints:count.max(4),allocatedFen:money,createdJobIds:rows(id),cancelledJobIds:rows(id)})
const pause=z.strictObject({date,stepId:id,reasons:z.array(z.string().min(1).max(512)).min(1)})
const plan=z.strictObject({id,runId:id,name:z.string().trim().min(1).max(80),quarter:z.string().regex(/^202[0-5]-Q[1-4]$/),accountId:id,businessIds:rows(id),resourceIds:rows(id),validUntil:date,cashLimitFen:money,actionLimit:count.max(4),createdAt:date,updatedAt:date,sourcePlanId:id.nullable(),versionKey:id,status:z.enum(['draft','confirmed','paused','completed','cancelled']),confirmedAt:date.nullable(),guard:guard.nullable(),stepGuards:rows(z.strictObject({stepId:id,conditions:guard})),allocatedFen:money,actionPoints:count.max(4),steps:z.array(step).min(1).max(24),pauses:rows(pause)})
export const routineStateSchema=z.strictObject({version:id,catalogHash:z.string().regex(/^[0-9a-f]{64}$/),plans:rows(plan)})
export type RoutineState=z.infer<typeof routineStateSchema>
export type RoutinePlan=z.infer<typeof plan>
export type RoutineStep=z.infer<typeof step>
export type RoutineInputStep=z.infer<typeof routineInputStep>
export const routineInput=z.strictObject({name:z.string().trim().min(1).max(80),quarter:z.string().regex(/^202[0-5]-Q[1-4]$/),accountId:id,businessIds:z.array(id).max(5),resourceIds:z.array(id).max(4),cashLimitFen:money,actionLimit:count.max(4),steps:z.array(routineInputStep).min(1).max(24)})

export type RoutineDraftInput=z.infer<typeof routineInput>
