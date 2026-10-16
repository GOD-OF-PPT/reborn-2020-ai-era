import { courseEventSchema,courseStateSchema } from '../core/course-schema.ts'
import { videoStateSchema,videoEventSchema } from '../core/video-schema.ts'
import { z } from 'zod'
import { playerProfileSchema } from '../core/player-profile.ts'
import { DAY_PHASES } from '../core/timeline.ts'
import { RANDOM_DOMAINS, RNG_ALGORITHM } from '../core/random.ts'
import { worldOperationSchema, worldStateSchema } from '../core/world-schema.ts'
import { marketEventSchema,marketStateSchema } from '../core/market-schema.ts'
import { operatingEventSchema, operationsStateSchema } from '../core/operations-schema.ts'
import { idSchema, commandIdSchema, dateSchema, moneySchema, signedMoney, safeCount, signedPriority, uint32, signature, nullableId, rows, classification, actionDefinitionSchema, economyOperationSchema } from '../core/record-schemas.ts'
export { idSchema, commandIdSchema, dateSchema, moneySchema, ledgerOperationSchema, actionDefinitionSchema, economyOperationSchema, parseEconomyOperation, parseLedgerOperation } from '../core/record-schemas.ts'

const ledgerSchema = z.strictObject({
  asOf: dateSchema,
  marketReceivables:rows(z.strictObject({id:idSchema,accountId:idSchema,counterpartyId:idSchema,sourceEventId:idSchema,originOperationId:idSchema,date:dateSchema,dueAt:dateSchema,amountFen:moneySchema,remainingFen:moneySchema,kind:z.enum(['sale','dividend'])})),
  accounts: rows(z.strictObject({ id: idSchema, kind: z.enum(['personal', 'business', 'external']), balanceFen: signedMoney })),
  transactions: rows(z.strictObject({ id: idSchema, date: dateSchema, sourceEventId: idSchema, businessId: nullableId, contractId: nullableId, referenceId: nullableId, lines: z.array(z.strictObject({ accountId: idSchema, deltaFen: signedMoney })).length(2) })),
  metrics: rows(z.strictObject({ operationId: idSchema, sourceEventId: idSchema, contractId: nullableId, referenceId: nullableId, date: dateSchema, accountId: idSchema, businessId: nullableId, kind: z.enum(['income', 'cost']), deltaFen: signedMoney })),
  receipts: rows(z.strictObject({ id: idSchema, signature, status: z.enum(['applied', 'due']), kind: idSchema, accountId: idSchema, contractId: nullableId })),
  openingPosted: rows(idSchema),
  reservations: rows(z.strictObject({ id: idSchema, accountId: idSchema, kind: z.enum(['plan', 'order', 'frozen', 'customer_protection']), originId: idSchema, amountFen: moneySchema, status: z.enum(['active', 'released']) })),
  contracts: rows(z.strictObject({ id: idSchema, accountId: idSchema, businessId: idSchema, counterpartyId: idSchema, protectionReservationId: nullableId, prepaidFen: moneySchema, receivableFen: moneySchema, recognizedIncomeFen: moneySchema })),
  obligations: rows(z.strictObject({ id: idSchema, accountId: idSchema, businessId: nullableId, contractId: nullableId, counterpartyId: idSchema, date: dateSchema, sourceEventId: idSchema, originOperationId: idSchema, kind: z.enum(['expense', 'refund_undelivered', 'refund_delivered', 'loan_principal']), amountFen: moneySchema, remainingFen: moneySchema, protectionReservationId: nullableId })),
  supplierPrepayments: rows(z.strictObject({ id: idSchema, accountId: idSchema, businessId: idSchema, counterpartyId: idSchema, paidFen: moneySchema, remainingFen: moneySchema })),
  investments: rows(z.strictObject({ id: idSchema, accountId: idSchema, assetId: idSchema, subjectAccountId: nullableId, classification, bookCostFen: moneySchema, valueFen: moneySchema })),
  fees: rows(z.strictObject({ id: idSchema, accountId: idSchema, counterpartyId: idSchema, businessId: nullableId, basisPoints: z.number().int().min(0).max(10000), totalBaseFen: moneySchema, paidFen: moneySchema })),
})
const economySchema = z.strictObject({
  asOf: dateSchema, ledger: ledgerSchema,
  actions: rows(z.strictObject({ definition: actionDefinitionSchema, status: z.enum(['draft', 'reserved', 'executed', 'completed', 'interrupted', 'cancelled']), plannedAt: dateSchema, executedAt: dateSchema.nullable(), finishedAt: dateSchema.nullable() })),
  receipts: rows(z.strictObject({ id: idSchema, signature })),
})
// Kinds are disjoint. Most scheduled rows are market points; parse that narrow
// branch first instead of testing every financial operation for every quote.
export const eventSchema = z.strictObject({ instanceId: idSchema, date: dateSchema, phase: z.enum(DAY_PHASES), priority: signedPriority.refine((value) => value < Number.MAX_SAFE_INTEGER), payload: z.union([marketEventSchema,operatingEventSchema,videoEventSchema,courseEventSchema,worldOperationSchema,economyOperationSchema]) })
const timelineSchema = z.strictObject({
  cursor: z.strictObject({ date: dateSchema, phase: z.enum([...DAY_PHASES, 'before']), priority: signedPriority, instanceId: z.string().max(512) }),
  pending: rows(eventSchema),
  receipts: rows(z.strictObject({ instanceId: idSchema, signature, date: dateSchema, phase: z.enum(DAY_PHASES), pauseReason: z.string().min(1).max(512).nullable(), skippedReason: z.string().min(1).max(512).optional() })),
  pause: z.strictObject({ instanceId: idSchema, reason: z.string().min(1).max(512), source: z.literal('command').optional() }).nullable(),
})
const words = z.tuple([uint32, uint32, uint32, uint32]).refine((value) => value.some((word) => word !== 0))
const stream = z.strictObject({ words, draws: safeCount })
const randomSchema = z.strictObject({ algorithm: z.literal(RNG_ALGORITHM), streams: z.strictObject({ world: stream, market: stream, opportunity: stream, crisis: stream }) })
export const versionSchema = z.strictObject({ schemaVersion: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER), rulesVersion: commandIdSchema, contentVersion: commandIdSchema, contentHash: z.string().regex(/^[0-9a-f]{64}$/), rngAlgorithmVersion: commandIdSchema })
export const commandReceiptSchema = z.strictObject({ runId: commandIdSchema, commandId: commandIdSchema, actorId: commandIdSchema, kind: commandIdSchema, payloadHash: z.string().regex(/^[0-9a-f]{64}$/), payloadSignature: signature, revisionBefore: safeCount, revisionAfter: safeCount, date: dateSchema, summary: z.string().max(4000), transactionIds: rows(idSchema), causeIds: rows(idSchema) })
export const causeSchema = z.strictObject({ id: idSchema, commandId: commandIdSchema, date: dateSchema, domain: commandIdSchema, parentIds: rows(idSchema), sourceEventId: idSchema, visibleSummary: z.string().max(4000), visibility: z.enum(['visible', 'hidden']) })

export const runSchema = z.strictObject({
  versions: versionSchema, runId: commandIdSchema, actorId: commandIdSchema, personalAccountId: idSchema,
  backgroundId: idSchema,playerProfile:playerProfileSchema, origin: z.enum(['normal', 'fixture']), seed: z.string().min(1).max(256), revision: safeCount.min(1),
  controlledAccountIds: rows(idSchema), phase: z.enum(['playing', 'epilogue', 'finished']), economy: economySchema, timeline: timelineSchema, random: randomSchema,
  facts: rows(z.strictObject({ id: idSchema, domain: z.enum(RANDOM_DOMAINS), sourceEventId: idSchema, createdAt: dateSchema, roll: uint32, evidence: z.string().min(1).max(4000).nullable() })),
  privateNotes: z.string().max(16000), world: worldStateSchema.nullable(), operations: operationsStateSchema.nullable(), market:marketStateSchema.nullable(),video:videoStateSchema.nullable(),course:courseStateSchema.nullable(),receipts: rows(commandReceiptSchema), causes: rows(causeSchema),
})

export const envelopeSchema = z.strictObject({
  saveVersion: z.literal(1), ...versionSchema.shape, runId: commandIdSchema, revision: safeCount.min(1), checksum: z.string().regex(/^[0-9a-f]{64}$/), state: z.unknown(),
})
