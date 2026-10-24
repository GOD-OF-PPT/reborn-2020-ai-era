import type {WorkbenchProjection} from '../application/workbench-projection.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import type {RelaySceneProgress} from './relay-scene-progress.ts'

/** Pick the next public task feedback; the original clock still executes every intervening day. */
export function relaySceneAdvanceDate(progress:RelaySceneProgress|null,w:WorkbenchProjection,date:string,ordinary:string|null):string|null{
 if(w.pause!==null||w.progression.requiresDelivery)return null
 const next=progress?.wait?.date??progress?.nextDate
 if(!ordinary||!next||next<=date||w.progression.nextQuarterDate)return ordinary
 return playableAdvanceDate(w,date,next)
}
