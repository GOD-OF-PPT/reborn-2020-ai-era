import { z } from 'zod'
import { isoDate } from './calendar.ts'
import { MONEY_LIMIT } from './money.ts'
import { assertJsonInput } from './json-input.ts'
import { requireRule } from './errors.ts'
import type { EconomyOperation } from './economy.ts'
import type { LedgerOperation } from './ledger.ts'

export const idSchema = z.string().min(1).max(512).regex(/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/)
export const commandIdSchema = idSchema.max(128)
export const dateSchema = z.string().refine((value) => { try { isoDate(value); return true } catch { return false } })
export const moneySchema = z.number().int().min(0).max(MONEY_LIMIT)
export const signedMoney = z.number().int().min(-MONEY_LIMIT).max(MONEY_LIMIT)
export const safeCount = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
export const signedPriority = z.number().int().min(-Number.MAX_SAFE_INTEGER + 1).max(Number.MAX_SAFE_INTEGER)
export const uint32 = z.number().int().min(0).max(0xffffffff)
export const signature = z.string().max(500000)
export const nullableId = idSchema.nullable()
export const optionalId = idSchema.optional()
export const purpose = z.enum(['ordinary', 'recovery']).optional()
export const rows = <T>(schema: z.ZodType<T>) => z.array(schema).max(100000)
const base = { id: idSchema, date: dateSchema, sourceEventId: idSchema, businessId: optionalId, contractId: optionalId, referenceId: optionalId }
const cash = { ...base, accountId: idSchema, counterpartyId: idSchema, amountFen: moneySchema }
const contract = { ...base, accountId: idSchema, businessId: idSchema, contractId: idSchema, amountFen: moneySchema }
const investment = { ...base, accountId: idSchema, investmentId: idSchema }
export const classification = z.enum(['historical', 'simulation', 'fictional', 'counterfactual'])

const ledgerVariants = [
  z.strictObject({...base,kind:z.literal('trade_buy'),accountId:idSchema,counterpartyId:idSchema,investmentId:idSchema,assetId:idSchema,reservationId:idSchema,originId:idSchema,principalFen:moneySchema.min(1),feeFen:moneySchema,valueFen:moneySchema}),
  z.strictObject({...base,kind:z.literal('trade_sell'),accountId:idSchema,counterpartyId:idSchema,investmentId:idSchema,removedPrincipalFen:moneySchema,grossFen:moneySchema,feeFen:moneySchema,valueFen:moneySchema,receivableId:idSchema.nullable(),dueAt:dateSchema}),
  z.strictObject({...cash,kind:z.literal('record_market_income'),receivableId:idSchema,dueAt:dateSchema,incomeKind:z.literal('dividend')}),
  z.strictObject({...cash,kind:z.literal('settle_market_receivable'),receivableId:idSchema}),
  z.strictObject({ ...base, kind: z.literal('open_business_account'), accountId: idSchema }),
  z.strictObject({ ...base, kind: z.literal('owner_transfer'), accountId: idSchema, targetAccountId: idSchema, amountFen: moneySchema.min(1), fundingPurpose: purpose }),
  z.strictObject({ ...cash, kind: z.literal('borrow_cash'), obligationId: idSchema, dueAt: dateSchema }),
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
  z.strictObject({ ...cash, kind: z.literal('incur_supplier_usage'), businessId:idSchema,prepaymentId:idSchema,obligationId:idSchema,dueAt:dateSchema }),
  z.strictObject({ ...base, kind:z.literal('reverse_supplier_usage'), accountId:idSchema,businessId:idSchema,prepaymentId:idSchema,amountFen:moneySchema.min(1),referenceId:idSchema }),
  z.strictObject({ ...base, kind:z.literal('settle_supplier_credit'), accountId:idSchema,businessId:idSchema,prepaymentId:idSchema,obligationId:idSchema,referenceId:idSchema,amountFen:moneySchema.min(1) }),
  z.strictObject({ ...base, kind:z.literal('refund_supplier'), accountId:idSchema,businessId:idSchema,prepaymentId:idSchema,amountFen:moneySchema.min(1) }),
  z.strictObject({ ...investment, kind: z.literal('capital_injection'), targetAccountId: idSchema, assetId: idSchema, classification, amountFen: moneySchema }),
  z.strictObject({ ...investment, kind: z.literal('acquire_asset'), counterpartyId: idSchema, assetId: idSchema, classification, amountFen: moneySchema }),
  z.strictObject({ ...investment, kind: z.literal('value_asset'), valueFen: moneySchema }),
  z.strictObject({ ...base, kind: z.literal('charge_fee'), accountId: idSchema, counterpartyId: idSchema, feeId: idSchema, addedBaseFen: moneySchema, basisPoints: z.number().int().min(0).max(10000) }),
] as const
export const ledgerOperationSchema = z.union(ledgerVariants)

export const actionDefinitionSchema = z.strictObject({ id: idSchema, definitionId: idSchema, accountId: idSchema, counterpartyId: idSchema, businessId: optionalId, actionPoints: z.number().int().min(0).max(4), costFen: moneySchema, cashReservationId: idSchema, fundingPurpose: purpose, startAt: dateSchema, completeAt: dateSchema, settlementAt: dateSchema })
const actionVariants = [
  z.strictObject({ ...base, kind: z.enum(['draft_action', 'reserve_action']), action: actionDefinitionSchema }),
  z.strictObject({ ...base, kind: z.enum(['execute_action', 'complete_action', 'cancel_action', 'interrupt_action']), actionId: idSchema }),
  z.strictObject({ ...base, kind: z.literal('reschedule_action'), actionId: idSchema, startAt: dateSchema, completeAt: dateSchema, settlementAt: dateSchema }),
] as const
export const economyOperationSchema = z.union([ledgerOperationSchema,...actionVariants])

// Every branch already requires its own literal/enum kind. Reuse only matching
// branches for journal signatures; do not allocate errors for unrelated kinds.
const ledgerParsers=new Map<string,z.ZodType>(),economyParsers=new Map<string,z.ZodType>()
function parserFor(value:unknown,ledgerOnly:boolean){
  const reason=ledgerOnly?'INVALID_LEDGER_OPERATION':'INVALID_ECONOMY_OPERATION'
  requireRule(typeof value==='object'&&value!==null&&Object.hasOwn(value,'kind'),reason)
  const kind=Reflect.get(value,'kind');requireRule(typeof kind==='string',reason)
  const cache=ledgerOnly?ledgerParsers:economyParsers,cached=cache.get(kind);if(cached)return cached
  const variants=ledgerOnly?ledgerVariants:[...ledgerVariants,...actionVariants],matching=variants.filter(schema=>schema.shape.kind.safeParse(kind).success)
  requireRule(matching.length>0,reason);const parser:z.ZodType=matching.length===1?matching[0]!:z.union(matching);cache.set(kind,parser);return parser
}

export function parseEconomyOperation(value: unknown): EconomyOperation {
  assertJsonInput(value)
  const parsed = parserFor(value,false).safeParse(value)
  requireRule(parsed.success, 'INVALID_ECONOMY_OPERATION')
  // JSON-only input and strict union validation establish the optional-key contract.
  return parsed.data as EconomyOperation
}
export function parseLedgerOperation(value: unknown): LedgerOperation {
  assertJsonInput(value)
  const parsed = parserFor(value,true).safeParse(value)
  requireRule(parsed.success, 'INVALID_LEDGER_OPERATION')
  return parsed.data as LedgerOperation
}
