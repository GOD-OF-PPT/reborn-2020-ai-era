import {z} from 'zod'
import {idSchema,dateSchema,moneySchema} from './record-schemas.ts'

export const lifePersonId=z.enum(['tang-ying','linzhou','xu-cheng','chen-yu'])
export const lifePriority=z.enum(['unchanged','reserve','rest','workspace','promises'])
export const lifeWorkKind=z.enum(['rest','workspace','friend_visit','linzhou_review','peer_notes','partner_review','promise_keep'])
export const lifeReferenceSchema=z.strictObject({kind:z.enum(['paid_case','video_work','course_delivery','linzhou_participation']),id:idSchema,date:dateSchema})
const rows=<T extends z.ZodType>(schema:T)=>z.array(schema).max(100000)
export const lifeJobSchema=z.strictObject({
 id:idSchema,kind:lifeWorkKind,personId:lifePersonId.nullable(),promiseId:idSchema.nullable(),reference:lifeReferenceSchema.nullable(),
 originCommandId:idSchema,actionId:idSchema,accountId:z.literal('personal'),resourceId:z.literal('player-production'),
 startAt:dateSchema,completeAt:dateSchema,costFen:moneySchema,actionPoints:z.literal(1),status:z.enum(['running','completed','interrupted']),releasedAt:dateSchema.nullable(),
 result:z.enum(['rested','workspace_ready','shared_experience','promise_fulfilled']).nullable(),interruptedBy:idSchema.nullable(),interruptionReason:z.string().min(1).max(200).nullable(),
})
export const lifePromiseSchema=z.strictObject({
 id:idSchema,personId:lifePersonId,year:z.number().int().min(2020).max(2025),sharedJobId:idSchema,
 offeredAt:dateSchema,expiresAt:dateSchema,deadline:dateSchema,costFen:moneySchema,days:z.number().int().min(1).max(30),actionPoints:z.literal(1),
 status:z.enum(['offered','accepted','declined','expired','npc_declined','missed','fulfilled']),acceptedAt:dateSchema.nullable(),acceptedCommandId:idSchema.nullable(),
 responseCommandId:idSchema.nullable(),resolvedAt:dateSchema.nullable(),resolutionSourceId:idSchema.nullable(),completionJobId:idSchema.nullable(),
})
export const lifeStateSchema=z.strictObject({
 catalogVersion:idSchema,catalogHash:z.string().regex(/^[a-f0-9]{64}$/),jobs:rows(lifeJobSchema),promises:rows(lifePromiseSchema),
 priorities:rows(z.strictObject({id:idSchema,year:z.number().int().min(2020).max(2025),priority:lifePriority,date:dateSchema,sourceCommandId:idSchema})),
 agenda:rows(z.strictObject({id:idSchema,definitionId:idSchema,personId:lifePersonId,date:dateSchema,sourceEventId:idSchema})),
 logs:rows(z.strictObject({id:idSchema,date:dateSchema,sourceEventId:idSchema,text:z.string().min(1).max(1000),parentIds:z.array(idSchema).max(100),visibility:z.enum(['visible','hidden'])})),
})
export const lifeEventSchema=z.strictObject({kind:z.literal('life_event'),type:z.enum(['agenda','finish_job','offer_expiry','promise_due']),entityId:idSchema,date:dateSchema})
export type LifeState=z.infer<typeof lifeStateSchema>
export type LifeJob=z.infer<typeof lifeJobSchema>
export type LifePromise=z.infer<typeof lifePromiseSchema>
export type LifePerson=z.infer<typeof lifePersonId>
export type LifeWorkKind=z.infer<typeof lifeWorkKind>
export type LifeReference=z.infer<typeof lifeReferenceSchema>
export type LifeEvent=z.infer<typeof lifeEventSchema>
export type LifePriority=z.infer<typeof lifePriority>

const terms=z.strictObject({title:z.string().min(1).max(100),costFen:moneySchema,days:z.number().int().min(1).max(30),points:z.literal(1)})
export const lifeCatalogSchema=z.strictObject({
 version:idSchema,classification:z.literal('fictional'),
 people:z.array(z.strictObject({id:lifePersonId,name:z.string().min(1).max(40),role:z.string().min(1).max(100),goal:z.string().min(1).max(300),work:z.enum(['friend_visit','linzhou_review','peer_notes','partner_review']),promiseTitle:z.string().min(1).max(100),promiseCostFen:moneySchema,promiseDays:z.number().int().min(1).max(30),boundary:z.string().min(1).max(300)})).length(4),
 work:z.strictObject({rest:terms,workspace:terms,friend_visit:terms,linzhou_review:terms,peer_notes:terms,partner_review:terms}),
 busy:z.array(z.strictObject({id:idSchema,personId:lifePersonId,from:dateSchema,to:dateSchema,startText:z.string().min(1).max(300),endText:z.string().min(1).max(300)})).max(100),
 peerAvailableAt:dateSchema,offerDays:z.number().int().min(1).max(30),promiseDays:z.number().int().min(7).max(90),lastOfferDay:z.literal('11-30'),lastDeadlineDay:z.literal('12-15'),
 scene:z.strictObject({base:idSchema,workspace:idSchema}),
}).superRefine((v,ctx)=>{
 if(new Set(v.people.map(p=>p.id)).size!==4||new Set(v.people.map(p=>p.work)).size!==4)ctx.addIssue({code:'custom',message:'LIFE_PEOPLE_NOT_DISTINCT'})
 if(new Set(v.busy.map(b=>b.id)).size!==v.busy.length)ctx.addIssue({code:'custom',message:'DUPLICATE_LIFE_AGENDA'})
 for(const b of v.busy){if(b.from>=b.to||b.from<'2020-01-01'||b.to>'2025-12-31')ctx.addIssue({code:'custom',message:'INVALID_LIFE_AGENDA_WINDOW'});if(v.busy.some(o=>o.id!==b.id&&o.personId===b.personId&&o.from<b.to&&o.to>b.from))ctx.addIssue({code:'custom',message:'OVERLAPPING_LIFE_AGENDA'})}
})
export type LifeCatalog=z.infer<typeof lifeCatalogSchema>
