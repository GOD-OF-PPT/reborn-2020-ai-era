import { addDays,monthEnd,quarterOf } from './calendar.ts'
export function quarterLimit(date:string):string { const q=Number(quarterOf(date).slice(-1));return q===4?`${Number(date.slice(0,4))+1}-01-01`:`${date.slice(0,4)}-${String(q*3+1).padStart(2,'0')}-01` }
export function earnedMonthly(rate:number,segments:readonly {readonly from:string;readonly to:string|null}[],month:string,through:string):number {
 let days=0;const last=monthEnd(`${month}-01`)
 for(let day=`${month}-01`;day<=last&&day<=through;day=addDays(day,1))if(segments.some(segment=>segment.from<=day&&(segment.to===null||day<segment.to)))days++
 return Number(BigInt(rate)*BigInt(days)/BigInt(Number(last.slice(-2))))
}
export function dayBefore(date:string):string { const day=Number(date.slice(-2));if(day>1)return date.slice(0,8)+String(day-1).padStart(2,'0');const month=Number(date.slice(5,7));return monthEnd(month>1?date.slice(0,5)+String(month-1).padStart(2,'0')+'-01':String(Number(date.slice(0,4))-1)+'-12-01') }
