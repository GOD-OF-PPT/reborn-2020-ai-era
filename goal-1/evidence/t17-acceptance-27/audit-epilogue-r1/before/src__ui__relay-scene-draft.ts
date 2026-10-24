import {useRef,useState,type Dispatch,type SetStateAction} from 'react'

export type RelaySceneDraftSlot='service'|'audit'
export interface RelaySceneDraftScope{
 readonly accountId:string
 readonly businessId:string
 readonly stationId:string
 readonly periodId:string|null
 readonly meterId:string|null
 readonly slot:RelaySceneDraftSlot
}
export interface RelaySceneDraft{
 customerIds:string[]
 supplierIds:string[]
 resources:string[]
 startAt:string
 maxUnits:string
 /** Player-entered yuan, converted only when preparing the original command. */
 maxSupplierCost:string
 supportMode:''|'guided'|'self'|'assisted'|'delegated'
 deploymentId:string|null
}
export const emptyRelaySceneDraft=():RelaySceneDraft=>({customerIds:[],supplierIds:[],resources:[],startAt:'',maxUnits:'',maxSupplierCost:'',supportMode:'',deploymentId:null})
const copy=(draft:RelaySceneDraft):RelaySceneDraft=>({...draft,customerIds:[...draft.customerIds],supplierIds:[...draft.supplierIds],resources:[...draft.resources]})

/** Page, revision and today's date never change an unfinished service or audit identity. */
export function relaySceneDraftKey(runId:string,scope:RelaySceneDraftScope):string{
 return JSON.stringify([runId,scope.accountId,scope.businessId,scope.stationId,scope.periodId,scope.meterId,scope.slot])
}
export interface RelaySceneDraftMemory{
 read(runId:string,scope:RelaySceneDraftScope):RelaySceneDraft|undefined
 write(runId:string,scope:RelaySceneDraftScope,draft:RelaySceneDraft):boolean
}
/** One mounted life owns this map. It never stores a save, invokes a command or validates permission. */
export function createRelaySceneDraftMemory(runId:string):RelaySceneDraftMemory{
 const drafts=new Map<string,RelaySceneDraft>()
 return {
  read(requestedRunId,scope){if(requestedRunId!==runId)return undefined;const draft=drafts.get(relaySceneDraftKey(runId,scope));return draft?copy(draft):undefined},
  write(requestedRunId,scope,draft){if(requestedRunId!==runId)return false;drafts.set(relaySceneDraftKey(runId,scope),copy(draft));return true},
 }
}
export type RelaySceneDraftUpdate=Dispatch<SetStateAction<RelaySceneDraft>>
/** Same-event functional edits and another mounted editor both read the latest shared draft. */
export function useRelaySceneDraft(runId:string,scope:RelaySceneDraftScope|null,memory?:RelaySceneDraftMemory,initial:RelaySceneDraft=emptyRelaySceneDraft()):readonly [RelaySceneDraft,RelaySceneDraftUpdate]{
 const key=scope?relaySceneDraftKey(runId,scope):JSON.stringify([runId,null]),read=()=>scope?memory?.read(runId,scope)??copy(initial):copy(initial)
 const [stored,setStored]=useState(()=>({key,draft:read()})),draft=scope?memory?.read(runId,scope)??(stored.key===key?stored.draft:read()):read(),latest=useRef({key,draft})
 latest.current={key,draft}
 const update:RelaySceneDraftUpdate=value=>{
  if(scope===null)return
  const previous=memory?.read(runId,scope)??(latest.current.key===key?latest.current.draft:read()),next=copy(typeof value==='function'?value(copy(previous)):value)
  memory?.write(runId,scope,next);latest.current={key,draft:next};setStored({key,draft:next})
 }
 return [draft,update]
}
