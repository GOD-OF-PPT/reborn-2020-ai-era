import {addDays,isoDate} from '../core/calendar.ts'
import type {GamePanelProps} from './game-types.ts'
import type {SeasonRecollectionView,SeasonPendingItem} from './season-thread.ts'
import {seasonMeaning} from './scene-meaning.ts'

export interface SeasonTurnReading {readonly quarter:string;readonly today:string;readonly nextDate:string;readonly title:string;readonly situation:string;readonly question:string;readonly pending:readonly SeasonPendingItem[];readonly retained:number}
/** A short turn of the page only for a verified current closing. Independent
 * risk, money, unknown sources and choices retain the complete original leaf. */
export function seasonTurnReading(p:Pick<GamePanelProps,'view'|'features'|'accountId'>,season:SeasonRecollectionView|null):SeasonTurnReading|null {
 const {view,features}=p,w=features.workbench,next=w.progression.nextQuarterDate
 if(!season||view.phase!=='playing'||view.busy||view.hasCandidate||view.saveStatus!=='saved'||!w.atQuarterEnd||w.pause||w.progression.requiresDelivery||!next||!season.closed||!season.atQuarterEnd||season.quarter!==w.quarter||season.asOf!==view.date||season.through!==view.date||season.from!==w.quarterStart||season.nextQuarterDate!==next)return null
 const chapters=features.journey?.chapters.filter(c=>c.id===season.quarter)??[]
 if(chapters.length!==1||chapters[0]!.closeSourceId!==season.closeSourceId||chapters[0]!.closedAt!==view.date)return null
 try{if(isoDate(view.date)!==view.date||view.date!==w.quarterEnd||addDays(view.date,1)!==next||next>'2025-12-31')return null}catch{return null}
 if(w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=view.date)))return null
 const pending=season.remaining.filter(item=>item.continuation!=='retained')
 if(pending.length>1||pending.some(item=>item.urgent||item.continuation!==undefined&&item.continuation!=='task'||!item.title.trim()||!item.line.trim()))return null
 const meaning=seasonMeaning(p,season)
 if(!meaning)return null
 const sentence=meaning.situation.indexOf('。')
 if(sentence<0)return null
 return {quarter:season.quarter,today:view.date,nextDate:next,title:'这一季已走完，下一季怎样过？',situation:meaning.situation.slice(0,sentence+1),question:'下一季，想把时间留给什么？',pending,retained:season.remaining.filter(item=>item.continuation==='retained').length}
}
