import {isoDate} from '../../../../.delivery/t17-u6-runtime-r324/src/core/calendar.ts'
// Author scheduling only. The game's addDays intentionally accepts nonnegative counts.
export function daysBefore(value:string,count:number):string{
 isoDate(value);if(!Number.isSafeInteger(count)||count<0||count>28)throw Error('AUTHOR_BACKWARD_DAY_RANGE_REQUIRED')
 const day=new Date(value+'T00:00:00.000Z');day.setUTCDate(day.getUTCDate()-count)
 return isoDate(day.toISOString().slice(0,10))
}
