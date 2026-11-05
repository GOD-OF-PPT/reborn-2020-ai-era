import type {GamePanelProps} from './game-types.ts'
import {todayReadingGroups,type TodayThreadView} from './today-thread.ts'
import {personalOngoingFacts,type PersonalOngoingCard} from './personal-ongoing-facts.ts'

export interface TodayChoiceBoard{readonly key:string;readonly runId:string;readonly revision:number;readonly date:string;readonly quarter:string;readonly items:readonly PersonalOngoingCard[]}
/** All continuing entries must be covered. Complex money/holdings/unknowns
 * keep their original complete reader instead of becoming a personal subset. */
export function todayChoiceBoard(p:Pick<GamePanelProps,'view'|'features'>,today:TodayThreadView):TodayChoiceBoard|null{
 const {view,features}=p,source=today.source,pin=today.primary.thread
 if(view.phase!=='playing'||features.workbench.atQuarterEnd||today.responsibilityOverrideNeeded||pin.responsibilityOverrideNeeded||pin.focusStatus==='invalid'||pin.focusScope==='history'||today.primary.classification==='history'||today.primary.classification==='invalid'||source.runId!==view.runId||source.revision!==view.revision||source.date!==view.date||source.quarter!==features.workbench.quarter||today.remaining.some(row=>row.urgent||row.continuation==='unknown')||features.relay?.customers.some(row=>row.dueReceivableFen>0))return null
 const {continuing,holdings}=todayReadingGroups(today.ongoing)
 if(continuing.length<2||holdings.length)return null
 const items:PersonalOngoingCard[]=[]
 for(const item of continuing){const facts=personalOngoingFacts(p,item);if(!facts)return null;items.push(facts.card)}
 if(new Set(items.map(item=>item.key)).size!==items.length)return null
 return {key:JSON.stringify([view.runId,view.revision,source.quarter,...items.map(item=>item.key)]),runId:view.runId,revision:view.revision,date:view.date,quarter:source.quarter,items}
}
