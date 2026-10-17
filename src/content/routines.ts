/** A deterministic authorization whitelist; it is never an AI agent permission. */
export const ROUTINE_CONTENT={version:'routine-work-v1',maxPlans:96,maxSteps:24,kinds:['WorkQuarter','StartCourseRecovery','StartRelayServicePeriod','TopUpRelaySupplier','CollectRelayDue','PayObligation'] as const}
