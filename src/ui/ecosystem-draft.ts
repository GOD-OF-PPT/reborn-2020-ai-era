import {useRef,useState} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {EcosystemChoiceIntent} from './ecosystem-journey.ts'
import type {EcosystemSceneTarget} from './ecosystem-scene-target.ts'

export type EcosystemDraftMemory=Map<string,Readonly<Record<string,string>>>
export const createEcosystemDraftMemory=():EcosystemDraftMemory=>new Map()
export function ecosystemDraftKey(p:Pick<GamePanelProps,'view'|'features'|'accountId'>,target:EcosystemSceneTarget|null,intent:EcosystemChoiceIntent):string{
 const v=p.features.deepseek,businessId=target?.businessId
 const generations=intent==='open'?v?.businesses.filter(b=>b.definitionId==='ecosystem-service').map(b=>b.id).sort():intent==='materials'||intent==='basics'?v?.preparations.filter(r=>r.businessId===businessId&&r.kind===intent).map(r=>r.id).sort():intent==='adapt'?v?.adapters.filter(r=>r.businessId===businessId).map(r=>r.id).sort():intent==='outreach'?v?.outreaches.filter(r=>r.businessId===businessId).map(r=>r.id).sort():null
 return JSON.stringify(['ecosystem-draft-v1',p.view.runId,p.accountId,target,intent,generations??null])
}
/** UI-only fields survive cancellation and reading. Date/revision changes never clear or rewrite a draft. */
export function useEcosystemDraft(p:GamePanelProps,target:EcosystemSceneTarget|null,intent:EcosystemChoiceIntent){
 const fallback=useRef<EcosystemDraftMemory>(new Map()),memory=p.ecosystemDraftMemory??fallback.current,key=ecosystemDraftKey(p,target,intent),current=useRef(key)
 current.current=key
 const [,refresh]=useState(0),values=memory.get(key)??{}
 const set=(name:string,value:string)=>{if(current.current!==key)return;memory.set(key,{...memory.get(key),[name]:value});refresh(n=>n+1)}
 return {key,value:(name:string)=>values[name]??'',set}
}
