import type {GamePanelProps} from './game-types.ts'
import type {TodayThreadView} from './today-thread.ts'
import {playerThread} from './player-thread.ts'
import {researchRoomBrief,researchRoomCopy} from './research-room-copy.ts'
import {marketId} from '../core/market.ts'

type Notice=Parameters<typeof researchRoomBrief>[2]
/** One exact original research receipt may be read while work or life remains
 * the pin. The original text/frame and current focus are never replaced. */
export function todayResearchReading(p:Pick<GamePanelProps,'view'|'features'>,today:TodayThreadView,notice:Notice):{readonly brief:string;readonly sourceId:string}|null{
 const {view,features}=p,source=today.source,thread=today.primary.thread,focus=thread.focus,last=view.receipts.at(-1)
 if(view.phase!=='playing'||features.workbench.atQuarterEnd||today.responsibilityOverrideNeeded||thread.responsibilityOverrideNeeded||thread.legacyFallbackRequired||thread.focusStatus==='invalid'||thread.focusScope==='history'||focus.runId!==view.runId||focus.accountId!=='personal'||source.runId!==view.runId||source.revision!==view.revision||source.date!==view.date||source.quarter!==features.workbench.quarter||!last)return null
 if(focus.kind!=='work'&&focus.kind!=='life'&&!(focus.kind==='market'&&focus.entityKind==='research'))return null
 const rows=last.kind==='ResearchMarket'?features.market.researches.filter(row=>row.id===marketId('command',last.commandId)&&row.status==='running'&&row.startAt===view.date):last.kind==='AdvanceTime'?features.market.researches.filter(row=>row.status==='completed'&&row.completeAt===view.date):[]
 if(rows.length!==1)return null
 const research=rows[0]!
 if(focus.kind==='market'&&focus.entityId!==research.id)return null
 const original=playerThread(p,{runId:view.runId,kind:'market',accountId:'personal',entityKind:'research',entityId:research.id}),brief=researchRoomBrief(p,original,notice),copy=researchRoomCopy(p,original)
 if(!brief||!copy)return null
 return {sourceId:research.id,brief:research.status==='running'?brief+'预计'+research.completeAt+'完成。':research.definitionId==='market-overview'?copy.object+'已完成 · 不揭示未来价格，买卖仍须显选。':brief}
}
