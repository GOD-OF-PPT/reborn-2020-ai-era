import {z} from 'zod'
import {idSchema,commandIdSchema,dateSchema,rows,safeCount,moneySchema} from './record-schemas.ts'

export const quarterSchema=z.string().regex(/^202[0-5]-Q[1-4]$/)
export const journeyCatalogSchema=z.strictObject({version:idSchema,classification:z.literal('fictional'),years:z.array(z.string().min(1).max(160)).length(6),quarters:z.array(z.strictObject({id:quarterSchema,year:z.number().int().min(2020).max(2025),season:z.number().int().min(1).max(4),from:dateSchema,through:dateSchema,title:z.string().min(1).max(160),thought:z.string().min(1).max(200),line:z.string().min(1).max(1000)})).length(24)})
const digest=z.string().regex(/^[0-9a-f]{64}$/)
export const recoveryEstimateSchema=z.strictObject({assetId:idSchema,kind:z.enum(['contract_receivable','market_receivable','private_receivable','supplier_prepayment','private_asset']),basisFen:moneySchema,estimatedFen:moneySchema})
export const journeyStateSchema=z.strictObject({
 catalogVersion:idSchema,catalogHash:digest,
 quarters:z.array(z.strictObject({quarter:quarterSchema,openedAt:dateSchema,openSourceId:idSchema,closedAt:dateSchema.nullable(),closeSourceId:idSchema.nullable()})).min(1).max(24),
 epilogue:z.strictObject({commandId:commandIdSchema,date:dateSchema,sourceRevision:safeCount}).nullable(),
 endings:rows(z.strictObject({commandId:commandIdSchema,date:dateSchema,sourceRevision:safeCount,reviewHash:digest,estimates:rows(recoveryEstimateSchema)})),
 resumes:rows(z.strictObject({commandId:commandIdSchema,date:dateSchema,sourceRevision:safeCount,endingCommandId:commandIdSchema})),
})
export type JourneyState=z.infer<typeof journeyStateSchema>
export type RecoveryEstimate=z.infer<typeof recoveryEstimateSchema>
export const journeyEventSchema=z.strictObject({kind:z.literal('journey_event'),type:z.enum(['quarter_open','quarter_close']),quarter:quarterSchema,date:dateSchema})
export type JourneyEvent=z.infer<typeof journeyEventSchema>
