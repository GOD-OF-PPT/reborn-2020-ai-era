import type {LifePerson} from '../core/life-schema.ts'
export interface LifeMaterialSelection{readonly key:string;readonly date:string}
export interface LifeMaterialDraftMemory{
 read(runId:string,accountId:string,personId:LifePerson):LifeMaterialSelection|undefined
 write(runId:string,accountId:string,personId:LifePerson,value:LifeMaterialSelection):boolean
}
/** One mounted life keeps UI choices across reader remounts; no game state or persistence. */
export function createLifeMaterialDraftMemory(runId:string):LifeMaterialDraftMemory{
 const choices=new Map<string,LifeMaterialSelection>(),key=(accountId:string,personId:LifePerson)=>JSON.stringify([accountId,personId])
 return {read(requested,accountId,personId){if(requested!==runId)return undefined;const value=choices.get(key(accountId,personId));return value?{...value}:undefined},write(requested,accountId,personId,value){if(requested!==runId)return false;choices.set(key(accountId,personId),{...value});return true}}
}
