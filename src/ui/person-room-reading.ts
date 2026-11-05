import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {lifeSceneProgress} from './life-scene-progress.ts'
import {personMomentRecord} from './person-moment-record.ts'
import {moneyText} from './game-text.ts'

/** A current person's original resolved moment, never a newer invitation or an
 * older shared job. Reading leaves the original next choice and clock intact. */
export function personRoomReading(p:Pick<GamePanelProps,'view'|'features'>,thread:PlayerThreadView){
 const focus=thread.focus,target=thread.inspect.target
 if(focus.kind!=='life'||focus.accountId!=='personal'||focus.runId!==p.view.runId||focus.selection==='rest'||focus.selection==='workspace'||thread.focusScope!=='current'||thread.focusStatus==='invalid'||thread.responsibilityOverrideNeeded||thread.legacyFallbackRequired||p.features.workbench.atQuarterEnd||thread.command||thread.wait||thread.inspect.screen!=='life')return null
 const progress=lifeSceneProgress(p.features.life,p.view.date,focus.selection)
 if(focus.entityId!==progress.sourceId||thread.stage!=='life-'+progress.stage||target?.accountId!=='personal'||target.personId!==focus.selection||target.lifeSelection!=='person'||target.recordId!==focus.entityId)return null
 const record=personMomentRecord(p,progress)
 if(!record)return null
 const job=record.jobs[record.initialJob]
 return {record,label:'翻阅与'+record.name+'的这段经历',line:progress.stage==='completed'&&job?.status==='completed'?job.completeAt+'完成 · 本段已付'+moneyText(job.costFen)+' / 已用'+job.points+'点，无收入。':null}
}
