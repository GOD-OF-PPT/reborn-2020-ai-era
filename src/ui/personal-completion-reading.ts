import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {personalResultFacts} from './personal-day-copy.ts'

/** Reuse the existing exact same-job, unchanged-cash/AP and full-text proof.
 * Earlier paid costs remain in the result card. Mixed results keep their original reading. */
export function personalCompletionReading(p:Pick<GamePanelProps,'view'|'features'>,thread:PlayerThreadView,notice:Parameters<typeof personalResultFacts>[2]):{readonly brief:string}|null{
 return personalResultFacts(p,thread,notice)?{brief:'这段等待，没有新增支出。'}:null
}
