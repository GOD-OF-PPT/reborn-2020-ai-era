import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {TodayThreadView} from './today-thread.ts'
import {todayReadingGroups} from './today-thread.ts'
import {ClockAdvance,type ClockActionBinding} from './ClockAdvance.tsx'
import {isoDate} from '../core/calendar.ts'

export interface TodayIdleReading{readonly runId:string;readonly revision:number;readonly date:string;readonly waitDate:string;readonly title:string;readonly line:string}
export interface TodayIdlePrimary{readonly binding:ClockActionBinding;readonly node:ReactNode}
/** A new presentation focus only when no old continuation needs the lead.
 * Zero action points never disables the original readers or free decisions. */
export function todayIdleReading(p:Pick<GamePanelProps,'view'|'features'>,today:TodayThreadView):TodayIdleReading|null{
 const {view,features}=p,w=features.workbench,b=view.budget,source=today.source
 if(view.phase!=='playing'||view.busy||view.readOnly||view.hasCandidate||view.saveStatus!=='saved'||source.runId!==view.runId||source.revision!==view.revision||source.date!==view.date||source.quarter!==w.quarter||b.quarter!==w.quarter||b.available!==0||b.total!==4||!Number.isSafeInteger(b.spent)||!Number.isSafeInteger(b.reserved)||b.spent<0||b.reserved<0||b.spent+b.reserved!==4||w.atQuarterEnd||w.pause||w.progression.requiresDelivery||today.responsibilityOverrideNeeded||todayReadingGroups(today.ongoing).continuing.length||!today.wait)return null
 if(w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=view.date))||features.life.promises.some(o=>['offered','accepted'].includes(o.status)&&o.offeredAt<=view.date)||features.story.incidents.some(i=>i.resolvedAt===null&&!['normal','resolved'].includes(i.stage)))return null
 try{isoDate(view.date);isoDate(today.wait.date)}catch{return null}
 if(today.wait.date<=view.date)return null
 return {runId:view.runId,revision:view.revision,date:view.date,waitDate:today.wait.date,title:b.reserved>0?'这季的行动，已经排进日历。':'这季的行动，已经用完。',line:b.reserved>0?'预留仍属于原安排。可以继续翻阅，费用和旧约照常发生。':'可以继续翻阅；让日子往前走时，费用和旧约照常发生。'}
}
/** Reuse exactly one original clock and its shared object activation. */
export function TodayIdleAction({p,value,children}:{p:GamePanelProps;value:TodayIdleReading;children:(primary:TodayIdlePrimary|null)=>ReactNode}){
 if(value.runId!==p.view.runId||value.revision!==p.view.revision||value.date!==p.view.date)return children(null)
 return <ClockAdvance p={p} date={value.waitDate} label={'不新增安排，让原日子继续 · '+value.waitDate} room showReason={!p.view.readOnly&&!p.view.hasCandidate&&p.view.saveStatus!=='conflict'} renderAction={binding=>children({binding,node:<div className="moment-wait moment-primary"><div className="clock-advance clock-advance-room">{binding.reviewNode}{binding.mainNode}</div></div>})}/>
}
