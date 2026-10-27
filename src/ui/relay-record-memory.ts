import type {RelaySceneTarget} from './relay-scene-target.ts'

export interface RelayRecordMemory{
 read(target:RelaySceneTarget):string|undefined
 write(target:RelaySceneTarget,recordKey:string):boolean
}

/** Reading position is shared by the close view and original book, separately from the game save. */
export function createRelayRecordMemory(runId:string):RelayRecordMemory{
 const positions=new Map<string,string>()
 const key=(t:RelaySceneTarget)=>JSON.stringify([t.runId,t.accountId,t.businessId,t.stationId,t.kind,t.kind==='period'?t.periodId:t.kind==='customer'?t.customerId:t.kind==='audience'?t.audienceId:t.kind==='application'?t.applicationId:null,t.kind==='period'?t.jobId??null:null,t.kind==='period'?t.meterId??null:null])
 return {
  read(target){return target.runId===runId?positions.get(key(target)):undefined},
  write(target,recordKey){if(target.runId!==runId||!recordKey||recordKey.length>2048||/[\u0000-\u001f\u007f]/.test(recordKey))return false;positions.set(key(target),recordKey);return true},
 }
}

export const relayCasebookRecordId=(recordKey:string)=>'relay-casebook:'+recordKey
export function relayCasebookKey(recordId:string|null|undefined):string|undefined{
 return recordId?.startsWith('relay-casebook:')?recordId.slice('relay-casebook:'.length):undefined
}
