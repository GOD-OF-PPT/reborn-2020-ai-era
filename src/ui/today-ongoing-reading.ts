import type {GamePanelProps} from './game-types.ts'
import {todayReadingGroups,type TodayThreadView} from './today-thread.ts'
import {personalOngoingFacts,samePersonalFocus} from './personal-ongoing-facts.ts'

export interface TodayOngoingReading{readonly title:string;readonly line:string;readonly merged:boolean}
const generic='还有1件已经答应的事，正在照约定继续。'
/** Exact authored equivalence only. Unknown context and different result money
 * keep their original presentation, independent of the optional choice board. */
export function todayOngoingReading(p:Pick<GamePanelProps,'view'|'features'>,today:TodayThreadView,situation:string|null):TodayOngoingReading|null{
 const {view,features}=p,source=today.source,pin=today.primary.thread
 if(view.phase!=='playing'||features.workbench.atQuarterEnd||today.responsibilityOverrideNeeded||pin.responsibilityOverrideNeeded||pin.focusStatus==='invalid'||pin.focusScope==='history'||today.primary.classification==='history'||today.primary.classification==='invalid'||pin.focus.runId!==view.runId||pin.focus.accountId!=='personal'||source.runId!==view.runId||source.revision!==view.revision||source.date!==view.date||source.quarter!==features.workbench.quarter||view.accounts.filter(row=>row.accountId==='personal').length!==1)return null
 const {continuing}=todayReadingGroups(today.ongoing)
 if(continuing.length!==1)return null
 const one=continuing[0]!,facts=personalOngoingFacts(p,one)
 if(!facts)return null
 const allowed=[generic,...facts.equivalents]
 if(facts.ownSituation&&samePersonalFocus(pin.focus,one.focus))allowed.push(facts.ownSituation)
 return {title:facts.title,line:facts.line,merged:situation!==null&&allowed.includes(situation)}
}
