import {useEffect,useRef,useState} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {EquityChoiceIntent} from './equity-journey.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'
import {makeSharedAction} from './shared-action.ts'

export type EquityDraftMemory=Map<string,Readonly<Record<string,string>>>
export const createEquityDraftMemory=():EquityDraftMemory=>new Map()
const decisionStep=(intent:EquityChoiceIntent,values:Readonly<Record<string,string>>)=>intent==='follow'?values.followStep??'compare':intent==='governance'?JSON.stringify([values.governanceStep??'compare',values.policy??'']):null

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
 const values=memory.get(key)??{},step=decisionStep(intent,values)
 const scope=useRef({key,memory,intent,step,live:true,retired:false})
 // An identity token, rather than just its string, also fences A→B→A callbacks.
 if(scope.current.key!==key||scope.current.memory!==memory||scope.current.intent!==intent||scope.current.step!==step)scope.current={key,memory,intent,step,live:true,retired:false}
 const captured=scope.current,[,refresh]=useState(0)
 useEffect(()=>{captured.live=true;return()=>{captured.live=false}},[captured])
 const current=()=>scope.current===captured&&captured.live&&!captured.retired&&decisionStep(intent,memory.get(key)??{})===step
 const retire=()=>{captured.retired=true}
 const patch=(next:Readonly<Record<string,string>>)=>makeSharedAction(p,'准备这次权益选择',()=>{
  if(!current())return
  const updated={...memory.get(key),...(intent==='relationship'||intent==='eligibility'?{preparation:intent}:{}),...next}
  memory.set(key,updated);refresh(n=>n+1)
  if(decisionStep(intent,updated)!==step)captured.retired=true
 },{allowReadOnly:true,canActivate:current}).activate()
 const set=(name:string,value:string)=>patch({[name]:value})
 return {key,value:(name:string)=>name==='preparation'&&(intent==='relationship'||intent==='eligibility')?intent:values[name]??'',set,patch,current,retire}
}
