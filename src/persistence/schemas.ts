import { z } from 'zod'
import { isoDate } from '../core/calendar.ts'
import { MONEY_LIMIT } from '../core/money.ts'
import { DAY_PHASES } from '../core/timeline.ts'
import { RANDOM_DOMAINS, RNG_ALGORITHM } from '../core/random.ts'
import { assertJsonInput } from '../core/json-input.ts'
import { requireRule } from '../core/errors.ts'
import type { EconomyOperation } from '../core/economy.ts'
import type { LedgerOperation } from '../core/ledger.ts'

export const idSchema = z.string().min(1).max(512).regex(/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/)
export const commandIdSchema = idSchema.max(128)
export const dateSchema = z.string().refine((value) => { try { isoDate(value); return true } catch { return false } })
export const moneySchema = z.number().int().min(0).max(MONEY_LIMIT)
const signedMoney = z.number().int().min(-MONEY_LIMIT).max(MONEY_LIMIT)
const safeCount = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
const signedPriority = z.number().int().min(-Number.MAX_SAFE_INTEGER + 1).max(Number.MAX_SAFE_INTEGER)
const uint32 = z.number().int().min(0).max(0xffffffff)
const signature = z.string().max(500000)
const nullableId = idSchema.nullable()
const optionalId = idSchema.optional()
const purpose = z.enum(['ordinary', 'recovery']).optional()
const rows = <T>(schema: z.ZodType<T>) => z.array(schema).max(100000)
const base = { id: idSchema, date: dateSchema, sourceEventId: idSchema, businessId: optionalId, contractId: optionalId, referenceId: optionalId }
const cash = { ...base, accountId: idSchema, counterpartyId: idSchema, amountFen: moneySchema }
const contract = { ...base, accountId: idSchema, businessId: idSchema, contractId: idSchema, amountFen: moneySchema }
const investment = { ...base, accountId: idSchema, investmentId: idSchema }
const classification = z.enum(['historical', 'simulation', 'fictional', 'counterfactual'])

export const ledgerOperationSchema = z.union([
  z.strictObject({ ...cash, kind: z.enum(['opening_cash', 'income']) }),
  z.strictObject({ ...cash, kind: z.literal('expense'), reservationId: optionalId, originId: optionalId, fundingPurpose: purpose }),
  z.strictObject({ ...base, kind: z.literal('reserve_cash'), accountId: idSchema, reservationId: idSchema, bucket: z.enum(['plan', 'order', 'frozen']), originId: idSchema, amountFen: moneySchema, fundingPurpose: purpose }),
  z.strictObject({ ...base, kind: z.literal('move_reservation'), accountId: idSchema, reservationId: idSchema, newOriginId: idSchema }),
  z.strictObject({ ...base, kind: z.literal('release_reservation'), accountId: idSchema, reservationId: idSchema, amountFen: moneySchema.optional() }),
  z.strictObject({ ...contract, kind: z.literal('receive_prepayment'), counterpartyId: idSchema, reservationId: idSchema }),
  z.strictObject({ ...contract, kind: z.literal('deliver_prepaid') }),
  z.strictObject({ ...contract, kind: z.literal('deliver_on_credit'), counterpartyId: idSchema }),
  z.strictObject({ ...contract, kind: z.literal('collect_receivable') }),
  z.strictObject({ ...contract, kind: z.literal('refund_undelivered'), obligationId: idSchema, referenceId: idSchema }),
  z.strictObject({ ...contract, kind: z.literal('refund_delivered'), settlement: z.literal('cash'), obligationId: idSchema, reservationId: idSchema, referenceId: idSchema }),
  z.strictObject({ ...contract, kind: z.literal('refund_delivered'), settlement: z.literal('receivable'), referenceId: idSchema }),
  z.strictObject({ ...base, kind: z.literal('pay_obligation'), accountId: idSchema, obligationId: idSchema, amountFen: moneySchema }),
  z.strictObject({ ...cash, kind: z.literal('due_expense'), obligationId: idSchema }),
  z.strictObject({ ...cash, kind: z.literal('supplier_prepay'), businessId: idSchema, prepaymentId: idSchema }),
  z.strictObject({ ...base, kind: z.literal('consume_supplier'), accountId: idSchema, businessId: idSchema, prepaymentId: idSchema, amountFen: moneySchema }),
  z.strictObject({ ...investment, kind: z.literal('capital_injection'), targetAccountId: idSchema, assetId: idSchema, classification, amountFen: moneySchema }),
  z.strictObject({ ...investment, kind: z.literal('acquire_asset'), counterpartyId: idSchema, assetId: idSchema, classification, amountFen: moneySchema }),
  z.strictObject({ ...investment, kind: z.literal('value_asset'), valueFen: moneySchema }),
  z.strictObject({ ...base, kind: z.literal('charge_fee'), accountId: idSchema, counterpartyId: idSchema, feeId: idSchema, addedBaseFen: moneySchema, basisPoints: z.number().int().min(0).max(10000) }),
])

export const actionDefinitionSchema = z.strictObject({ id: idSchema, definitionId: idSchema, accountId: idSchema, counterpartyId: idSchema, businessId: optionalId, actionPoints: z.number().int().min(0).max(4), costFen: moneySchema, cashReservationId: idSchema, fundingPurpose: purpose, startAt: dateSchema, completeAt: dateSchema, settlementAt: dateSchema })
export const economyOperationSchema = z.union([
  ledgerOperationSchema,
  z.strictObject({ ...base, kind: z.enum(['draft_action', 'reserve_action']), action: actionDefinitionSchema }),
  z.strictObject({ ...base, kind: z.enum(['execute_action', 'complete_action', 'cancel_action', 'interrupt_action']), actionId: idSchema }),
  z.strictObject({ ...base, kind: z.literal('reschedule_action'), actionId: idSchema, startAt: dateSchema, completeAt: dateSchema, settlementAt: dateSchema }),
])

export function parseEconomyOperation(value: unknown): EconomyOperation {
  assertJsonInput(value)
  const parsed = economyOperationSchema.safeParse(value)
  requireRule(parsed.success, 'INVALID_ECONOMY_OPERATION')
  // JSON-only input and strict union validation establish the optional-key contract.
  return parsed.data as EconomyOperation
}
export function parseLedgerOperation(value: unknown): LedgerOperation {
  assertJsonInput(value)
  const parsed = ledgerOperationSchema.safeParse(value)
  requireRule(parsed.success, 'INVALID_LEDGER_OPERATION')
  return parsed.data as LedgerOperation
}

const ledgerSchema = z.strictObject({
  asOf: dateSchema,
  accounts: rows(z.strictObject({ id: idSchema, kind: z.enum(['personal', 'business', 'external']), balanceFen: signedMoney })),
  transactions: rows(z.strictObject({ id: idSchema, date: dateSchema, sourceEventId: idSchema, businessId: nullableId, contractId: nullableId, referenceId: nullableId, lines: z.array(z.strictObject({ accountId: idSchema, deltaFen: signedMoney })).length(2) })),
  metrics: rows(z.strictObject({ operationId: idSchema, sourceEventId: idSchema, contractId: nullableId, referenceId: nullableId, date: dateSchema, accountId: idSchema, businessId: nullableId, kind: z.enum(['income', 'cost']), deltaFen: signedMoney })),
  receipts: rows(z.strictObject({ id: idSchema, signature, status: z.enum(['applied', 'due']), kind: idSchema, accountId: idSchema, contractId: nullableId })),
  openingPosted: rows(idSchema),
  reservations: rows(z.strictObject({ id: idSchema, accountId: idSchema, kind: z.enum(['plan', 'order', 'frozen', 'customer_protection']), originId: idSchema, amountFen: moneySchema, status: z.enum(['active', 'released']) })),
  contracts: rows(z.strictObject({ id: idSchema, accountId: idSchema, businessId: idSchema, counterpartyId: idSchema, protectionReservationId: nullableId, prepaidFen: moneySchema, receivableFen: moneySchema, recognizedIncomeFen: moneySchema })),
  obligations: rows(z.strictObject({ id: idSchema, accountId: idSchema, businessId: nullableId, contractId: nullableId, counterpartyId: idSchema, date: dateSchema, sourceEventId: idSchema, originOperationId: idSchema, kind: z.enum(['expense', 'refund_undelivered', 'refund_delivered']), amountFen: moneySchema, remainingFen: moneySchema, protectionReservationId: nullableId })),
  supplierPrepayments: rows(z.strictObject({ id: idSchema, accountId: idSchema, businessId: idSchema, counterpartyId: idSchema, paidFen: moneySchema, remainingFen: moneySchema })),
  investments: rows(z.strictObject({ id: idSchema, accountId: idSchema, assetId: idSchema, subjectAccountId: nullableId, classification, bookCostFen: moneySchema, valueFen: moneySchema })),
  fees: rows(z.strictObject({ id: idSchema, accountId: idSchema, counterpartyId: idSchema, businessId: nullableId, basisPoints: z.number().int().min(0).max(10000), totalBaseFen: moneySchema, paidFen: moneySchema })),
})
const economySchema = z.strictObject({
  asOf: dateSchema, ledger: ledgerSchema,
  actions: rows(z.strictObject({ definition: actionDefinitionSchema, status: z.enum(['draft', 'reserved', 'executed', 'completed', 'interrupted', 'cancelled']), plannedAt: dateSchema, executedAt: dateSchema.nullable(), finishedAt: dateSchema.nullable() })),
  receipts: rows(z.strictObject({ id: idSchema, signature })),
})
export const eventSchema = z.strictObject({ instanceId: idSchema, date: dateSchema, phase: z.enum(DAY_PHASES), priority: signedPriority.refine((value) => value < Number.MAX_SAFE_INTEGER), payload: economyOperationSchema })
const timelineSchema = z.strictObject({
  cursor: z.strictObject({ date: dateSchema, phase: z.enum([...DAY_PHASES, 'before']), priority: signedPriority, instanceId: z.string().max(512) }),
  pending: rows(eventSchema),
  receipts: rows(z.strictObject({ instanceId: idSchema, signature, date: dateSchema, phase: z.enum(DAY_PHASES), pauseReason: z.string().min(1).max(512).nullable(), skippedReason: z.string().min(1).max(512).optional() })),
  pause: z.strictObject({ instanceId: idSchema, reason: z.string().min(1).max(512) }).nullable(),
})
const words = z.tuple([uint32, uint32, uint32, uint32]).refine((value) => value.some((word) => word !== 0))
const stream = z.strictObject({ words, draws: safeCount })
const randomSchema = z.strictObject({ algorithm: z.literal(RNG_ALGORITHM), streams: z.strictObject({ world: stream, market: stream, opportunity: stream, crisis: stream }) })
export const versionSchema = z.strictObject({ schemaVersion: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER), rulesVersion: commandIdSchema, contentVersion: commandIdSchema, contentHash: z.string().regex(/^[0-9a-f]{64}$/), rngAlgorithmVersion: commandIdSchema })
export const commandReceiptSchema = z.strictObject({ runId: commandIdSchema, commandId: commandIdSchema, actorId: commandIdSchema, kind: commandIdSchema, payloadHash: z.string().regex(/^[0-9a-f]{64}$/), payloadSignature: signature, revisionBefore: safeCount, revisionAfter: safeCount, date: dateSchema, summary: z.string().max(4000), transactionIds: rows(idSchema), causeIds: rows(idSchema) })
export const causeSchema = z.strictObject({ id: idSchema, commandId: commandIdSchema, date: dateSchema, domain: commandIdSchema, parentIds: rows(idSchema), sourceEventId: idSchema, visibleSummary: z.string().max(4000), visibility: z.enum(['visible', 'hidden']) })

export const runSchema = z.strictObject({
  versions: versionSchema, runId: commandIdSchema, actorId: commandIdSchema, personalAccountId: idSchema,
  backgroundId: idSchema, origin: z.enum(['normal', 'fixture']), seed: z.string().min(1).max(256), revision: safeCount.min(1),
  controlledAccountIds: rows(idSchema), phase: z.enum(['playing', 'epilogue', 'finished']), economy: economySchema, timeline: timelineSchema, random: randomSchema,
  facts: rows(z.strictObject({ id: idSchema, domain: z.enum(RANDOM_DOMAINS), sourceEventId: idSchema, createdAt: dateSchema, roll: uint32, evidence: z.string().min(1).max(4000).nullable() })),
  privateNotes: z.string().max(16000), receipts: rows(commandReceiptSchema), causes: rows(causeSchema),
})

export const envelopeSchema = z.strictObject({
  saveVersion: z.literal(1), ...versionSchema.shape, runId: commandIdSchema, revision: safeCount.min(1), checksum: z.string().regex(/^[0-9a-f]{64}$/), state: z.unknown(),
})
