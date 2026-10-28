import {deepseekId} from '../core/deepseek-state.ts'
import type {SceneCommands} from '../application/scene-commands.ts'
import type {GamePanelProps} from './game-types.ts'

export interface EquityHistorySource{
 readonly runId:string
 readonly date:string
 readonly source?:{readonly revision:number;readonly receipts:GamePanelProps['view']['receipts']}
 readonly sceneCommands?:SceneCommands
}

/** Identifiers and dates from the original committed public projection only.
 * The compact receipt has no payload or date; it binds the published command
 * identity and revision rather than pretending to supply either field. */
export function equityHistoryCommands(context:EquityHistorySource,kind:string,key:string,id:string,operationId?:string|null){
 const published=context.sceneCommands,source=context.source
 if(!published||!source||published.version!==1||published.runId!==context.runId||published.committedRevision!==source.revision)return []
 return published.commands.filter(c=>c.kind===kind&&c.identifiers[key]===id&&c.date<=context.date&&Number.isSafeInteger(c.revisionAfter)&&c.revisionAfter>0&&c.revisionAfter<=source.revision
  &&(operationId===undefined||operationId===deepseekId(c.commandId,c.kind))
  &&published.commands.filter(other=>other.commandId===c.commandId).length===1
  &&source.receipts.filter(r=>r.commandId===c.commandId&&r.kind===c.kind&&r.revisionAfter===c.revisionAfter).length===1)
}
