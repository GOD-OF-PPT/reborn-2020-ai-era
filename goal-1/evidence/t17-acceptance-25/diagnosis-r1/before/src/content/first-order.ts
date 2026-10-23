/** A fictional 2020 manual assignment, not generative-model access or a permanent reward. */
export const FIRST_ORDER = {
  id: 'manual-first-2020', businessDefinitionId: 'manual-content', jobDefinitionId: 'manual-editing-first',
  title: '手工剪辑与资料整理小单', classification: 'fictional', productionMode: 'manual',
  offeredFrom: '2020-01-01', offeredTo: '2020-01-05', startAt: '2020-01-05', completeAt: '2020-01-19',
  reviewAt: '2020-01-20', durationDays: 14, actionPoints: 1, costFen: 50_000, priceFen: 130_000,
  capabilityId: 'manual_editing', caseKey: 'paid_manual_case',
} as const
export const FIRST_ORDER_JOB = { id: FIRST_ORDER.jobDefinitionId, purpose: 'production', routes: ['ai_video'], skill: FIRST_ORDER.capabilityId, durationDays: FIRST_ORDER.durationDays, actionPoints: FIRST_ORDER.actionPoints, costFen: FIRST_ORDER.costFen, output: 'manual-editing-delivery' }
export const FIRST_ORDER_OFFER = { id: FIRST_ORDER.id, route: 'ai_video', from: FIRST_ORDER.offeredFrom, to: FIRST_ORDER.offeredTo, jobDefinitionId: FIRST_ORDER.jobDefinitionId, priceFen: FIRST_ORDER.priceFen, prepaymentFen: 0, deliveryDueAt: FIRST_ORDER.completeAt, reviewDays: 1, paymentDays: 0, acceptBps: 10000, classification: FIRST_ORDER.classification, startWindow: { from: FIRST_ORDER.startAt, to: FIRST_ORDER.startAt }, caseKey: FIRST_ORDER.caseKey }
