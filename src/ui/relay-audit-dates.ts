import {addDays} from '../core/calendar.ts'
import {RuleError} from '../core/errors.ts'

/** An estimate for a draft, never a replacement for the original command's date checks. */
export function relayAuditCompletion(startAt:string,days:number):string|null{
 try{return addDays(startAt,days)}catch(error){
  if(error instanceof RuleError&&['INVALID_DATE','DATE_OUT_OF_RANGE'].includes(error.code))return null
  throw error
 }
}
