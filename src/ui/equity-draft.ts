import {useRef,useState} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {EquityChoiceIntent} from './equity-journey.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'
import {makeSharedAction} from './shared-action.ts'

export type EquityDraftMemory=Map<string,Readonly<Record<string,string>>>
export const createEquityDraftMemory=():EquityDraftMemory=>new Map()

/** A new, actually published promise gets a fresh slot. A changed date,
 * revision, auxiliary save or failed candidate never constitutes a new promise. */
export function equityDraftKey(p:Pick<GamePanelProps,'view'|'features'|'accountId'>,target:EquitySceneTarget|null,intent:EquityChoiceIntent):string{
 if(intent==='relationship'||intent==='eligibility')intent='prepare'
 const v=p.features.deepseek,b=target?.businessId
 const generations=!v?[]:target===null&&intent==='actors'?v.businesses.filter(r=>r.definitionId==='deepseek-investor').map(r=>r.id)
  :intent==='prepare'?v.preparations.filter(r=>r.businessId===b&&['relationship','eligibility'].includes(r.kind)).map(r=>r.id)
  :intent==='discover'?v.invitations.filter(r=>r.businessId===b).map(r=>r.id)
  :intent==='negotiate'?v.negotiations.filter(r=>target?.kind==='invitation'&&r.invitationId===target.recordId).map(r=>r.id)
  :intent==='governance'?v.governance.filter(r=>target?.kind==='agreement'&&r.agreementId===target.recordId).map(r=>r.id)
  :intent==='exit-request'?v.exits.filter(r=>target?.kind==='agreement'&&r.agreementId===target.recordId).map(r=>r.id)
  :intent==='collect'?v.exits.filter(r=>target?.kind==='exit'&&r.id===target.recordId).flatMap(r=>r.collectionOperationIds):[]
 // Both preparation commands belong to the business, independently of which
 // invitation led the reader here. All other records retain their full identity.
 const owner=intent==='prepare'&&target?{runId:target.runId,accountId:target.accountId,businessId:target.businessId,kind:'business'}:target
 return JSON.stringify(['equity-draft-v1',p.view.runId,p.accountId,owner,intent,[...generations].sort()])
}

export function useEquityDraft(p:GamePanelProps,target:EquitySceneTarget|null,intent:EquityChoiceIntent){
 const fallback=useRef<EquityDraftMemory>(new Map()),memory=p.equityDraftMemory??fallback.current,key=equityDraftKey(p,target,intent)
 const scope=useRef({key,memory,intent})
 // An identity token, rather than just its string, also fences A→B→A callbacks.
 if(scope.current.key!==key||scope.current.memory!==memory||scope.current.intent!==intent)scope.current={key,memory,intent}
 const captured=scope.current,[,refresh]=useState(0),values=memory.get(key)??{}
 const current=()=>scope.current===captured
 const set=(name:string,value:string)=>makeSharedAction(p,'准备这次权益选择',()=>{
  if(!current())return
  memory.set(key,{...memory.get(key),...(intent==='relationship'||intent==='eligibility'?{preparation:intent}:{}),[name]:value});refresh(n=>n+1)
 },{allowReadOnly:true,canActivate:current}).activate()
 return {key,value:(name:string)=>name==='preparation'&&(intent==='relationship'||intent==='eligibility')?intent:values[name]??'',set,current}
}
