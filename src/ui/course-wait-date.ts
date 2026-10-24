import {isoDate} from '../core/calendar.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import type {GamePanelProps} from './game-types.ts'

/** A default course wait visits the next date already present in the public calendar. */
export function courseWaitDate(w:GamePanelProps['features']['workbench'],current:string,requested:string):string|null{
 if(w.pause!==null||w.progression.requiresDelivery)return null
 try{
  const next=w.progression.nextDate
  isoDate(current);isoDate(requested);isoDate(next)
  if(requested<current||next<current)return null
  const bounded=playableAdvanceDate(w,current,requested),nextBounded=playableAdvanceDate(w,current,next)
  const date=bounded<nextBounded?bounded:nextBounded
  if(date<current)return null
  // A same-day pending phase can finish normally. With no same-day event,
  // only the existing quarter-closing snapshot needs another same-day step.
  if(date===current&&next>current&&current!==w.quarterEnd)return null
  return date
 }catch{return null}
}
