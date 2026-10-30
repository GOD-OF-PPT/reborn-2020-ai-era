import type {GamePanelProps} from './game-types.ts'
import type {EquitySceneTarget} from './equity-scene-target.ts'
import {resolveEquitySceneTarget} from './equity-scene-target.ts'

/** Calendar entries keep the original record; an ambiguous source stays explicit. */
export function equityWorkTarget(p:Pick<GamePanelProps,'view'|'features'>,jobId:string,businessId:string):{accountId:string;deepseekPane:'equity';recordId:string;equityTarget?:EquitySceneTarget}|null{
 const v=p.features.deepseek,ops=p.view.operations,owners=ops?.businesses.filter(b=>b.id===businessId)??[],jobs=ops?.jobs.filter(j=>j.id===jobId&&j.businessId===businessId)??[]
 if(!v||!ops||owners.length!==1||jobs.length!==1||!['deepseek-relationship','deepseek-eligibility','deepseek-diligence','deepseek-negotiation','deepseek-governance','deepseek-exit'].includes(jobs[0]!.definitionId))return null
 const accountId=owners[0]!.accountId,base={runId:p.view.runId,accountId,businessId}
 const candidates:EquitySceneTarget[]=[
  ...v.preparations.filter(r=>r.businessId===businessId&&['relationship','eligibility'].includes(r.kind)&&r.job?.id===jobId).map(r=>({...base,kind:'preparation' as const,recordId:r.id})),
  ...v.invitations.filter(r=>r.businessId===businessId&&r.diligenceJob?.id===jobId).map(r=>({...base,kind:'invitation' as const,recordId:r.id})),
  ...v.negotiations.filter(r=>r.businessId===businessId&&r.job?.id===jobId).map(r=>({...base,kind:'negotiation' as const,recordId:r.id})),
  ...v.governance.filter(r=>r.businessId===businessId&&r.job?.id===jobId).map(r=>({...base,kind:'governance' as const,recordId:r.id})),
  ...v.exits.filter(r=>r.businessId===businessId&&r.job?.id===jobId).map(r=>({...base,kind:'exit' as const,recordId:r.id})),
 ]
 const valid=candidates.filter(t=>{const r=resolveEquitySceneTarget(v,t,{runId:p.view.runId,accountId,date:p.view.date,accounts:p.view.accounts,operations:ops});return r.status==='valid'&&r.job?.id===jobId})
 return valid.length===1?{accountId,deepseekPane:'equity',recordId:valid[0]!.kind==='business'?businessId:valid[0]!.recordId,equityTarget:valid[0]!}:{accountId,deepseekPane:'equity',recordId:jobId}
}
