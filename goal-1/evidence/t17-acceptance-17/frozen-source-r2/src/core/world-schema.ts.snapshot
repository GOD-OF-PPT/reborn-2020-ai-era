import { z } from 'zod'
import { idSchema as id, dateSchema as date, safeCount, rows } from './record-schemas.ts'
import { ROUTES } from './content-types.ts'

export const worldOperationSchema = z.union([
  z.strictObject({ kind: z.literal('world_anchor'), anchorId: id, date }),
  z.strictObject({ kind: z.literal('open_content_event'), definitionId: id, bindingId: id, date }),
  z.strictObject({ kind: z.literal('expire_content_event'), eventId: id, date }),
  z.strictObject({ kind: z.literal('finish_preparation'), jobId: id, date }),
])
export const worldStateSchema = z.strictObject({
  packVersion: id, packHash: z.string().regex(/^[0-9a-f]{64}$/),
  bindings: rows(z.strictObject({ id, kind: z.enum(['player', 'business', 'contract', 'person']), accountId: id, businessId: id.nullable(), route: z.enum(ROUTES).nullable(), contractId: id.nullable(), personId: id.nullable(), capacityUnits: safeCount.max(1000) })),
  anchors: rows(z.strictObject({ id, happenedAt: date, causeId: id })), newsRead: rows(id), favoriteMemories: rows(id),
  preparations: rows(z.strictObject({ key: id, bindingId: id, date, sourceEventId: id })),
  entitlements: rows(z.strictObject({ id, bindingId: id, acquiredAt: date, expiresAt: date.nullable(), sourceEventId: id })),
  instances: rows(z.strictObject({ id, definitionId: id, bindingId: id, openedBy: id, createdAt: date, expiresAt: date, factId: id.nullable(), status: z.enum(['pending', 'resolved']), choiceId: id.nullable(), resolvedAt: date.nullable(), resolution: z.enum(['chosen', 'default']).nullable(), reason: z.string().max(4000).nullable() })),
  jobs: rows(z.strictObject({ id, instanceId: id, actionId: id, bindingId: id, choiceId: id, startAt: date, completeAt: date, capacityUnits: safeCount.min(1).max(1000), status: z.enum(['running', 'completed', 'interrupted']) })),
  stoppedBindings: rows(id), evidence: rows(z.strictObject({ id, instanceId: id, date, text: z.string().min(1).max(4000) })),
  logs: rows(z.strictObject({ id, date, sourceEventId: id, parentIds: rows(id), text: z.string().min(1).max(4000), kind: z.enum(['anchor', 'event', 'effect', 'job']), visibility: z.enum(['visible', 'hidden']) })),
})
