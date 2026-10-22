import { isoDate } from '../core/calendar.ts'
import { requireRule } from '../core/errors.ts'
import type { WorkbenchProjection } from './workbench-projection.ts'
export const PLAYABLE_THROUGH='2025-12-31'
/** A convenience policy. The core still enforces date ordering and every intervening event. */
export function playableAdvanceDate(w:WorkbenchProjection,currentDate:string,requested:string):string{
 isoDate(requested);requireRule(requested>=currentDate,'CANNOT_REWIND_TIME');requireRule(currentDate<PLAYABLE_THROUGH||currentDate===PLAYABLE_THROUGH&&!w.atQuarterEnd&&requested===PLAYABLE_THROUGH,'PREVIEW_RANGE_ENDED');requireRule(!w.progression.requiresDelivery,'DELIVERY_DECISION_PENDING')
 const barrier=w.atQuarterEnd?w.progression.nextQuarterDate??PLAYABLE_THROUGH:w.progression.quarterTarget
 return [requested,barrier,PLAYABLE_THROUGH].sort()[0]!
}
