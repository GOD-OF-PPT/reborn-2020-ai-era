import type {EquityThreadInput} from './equity-player-thread.ts'
import {equityFocusTargets,equitySceneContext} from './equity-player-thread.ts'
import {equityTargetEntity,resolveEquitySceneTarget,type EquitySceneTarget} from './equity-scene-target.ts'

/** Legacy reading links must name exactly one original record. Neither a
 * missing link nor an unrelated first business is a replacement selection. */
export function equityRecordSelection(p:EquityThreadInput,accountId:string,recordId:string|undefined):{target:EquitySceneTarget|null;reason:string|null}{
 if(recordId===undefined)return {target:null,reason:null}
 const rows=equityFocusTargets(p).filter(r=>equityTargetEntity(r.target)===recordId)
 if(rows.length!==1)return {target:null,reason:'指定的权益原记录不唯一或已不可达，请明确重新选择。'}
 const target=rows[0]!.target,r=resolveEquitySceneTarget(p.features.deepseek,target,equitySceneContext(p,accountId))
 return {target,reason:r.reason}
}
