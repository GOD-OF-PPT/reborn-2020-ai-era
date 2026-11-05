import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {resolveCourseFocus} from './course-player-thread.ts'
import {isoDate} from '../core/calendar.ts'
import {moneyText} from './game-text.ts'

export interface CourseEntryReading{readonly title:string;readonly line:string;readonly caseLine:string;readonly label:string;readonly caption:string;readonly route:'first-order'|'video'|'today';readonly availableAt:string;readonly caseCount:number}
/** This original public era is a reason to choose today's work, never a teaching permission. */
export function courseEntryReading(p:GamePanelProps,thread:PlayerThreadView):CourseEntryReading|null{
 const f=thread.focus,v=p.features.course,w=p.features.workbench
 if(p.view.phase!=='playing'||p.accountId!=='personal'||f.kind!=='course'||f.courseTarget!==null||f.accountId!=='personal'||thread.focusStatus==='invalid'||thread.legacyFallbackRequired||thread.responsibilityOverrideNeeded||!['entry','current'].includes(thread.focusScope)||thread.stage!=='course-unavailable'||resolveCourseFocus(p,f).reason||p.view.accounts.filter(a=>a.accountId==='personal').length!==1)return null
 if(!v||w.pause!==null||w.atQuarterEnd||w.progression.requiresDelivery||w.events.some(e=>e.presentation!=='ordinary'||e.isBlocking)||w.finance.some(a=>a.protectionShortfallFen>0||a.commitmentShortfallFen>0||a.obligations.some(o=>o.remainingFen>0&&o.date<=p.view.date)))return null
 try{isoDate(v.catalog.availableAt);isoDate(p.view.date)}catch{return null}
 if(p.view.date>=v.catalog.availableAt||[v.businesses,v.courses,v.outlines,v.licenses,v.studies,v.audiences,v.cohorts].some(rows=>rows.length>0)||v.cases.some(c=>!['first_order','video'].includes(c.kind)||typeof c.id!=='string'||c.id.length===0)||new Set(v.cases.map(c=>c.kind+':'+c.id)).size!==v.cases.length)return null
 const count=v.cases.length,first=p.features.firstOrder
 const route=count?'today':first.status==='available'||['planned','running','awaiting_submission','review','delivered'].includes(first.status)?'first-order':['unavailable','expired','declined','skipped','cancelled'].includes(first.status)?'video':null
 if(!route)return null
 return {title:count?'先把这份经历留下，慢慢想一堂课。':'先把一件事，真正做成。',line:`课程准备从${v.catalog.availableAt}开放；眼前的日子仍由你安排。`,caseLine:count?`已有${count}份已付案例可核对。素材权利、工具资格与实际样课，仍须分别准备。`:'还没有已付案例。先做完真实作品、等验收与实收；开课时仍须另核权利、工具与样课。',label:route==='today'?'把经历留下，先回到今天':route==='video'?'看看眼前能做的作品':first.status==='available'?'看看手工小单的原报价':'回到手头那份手工小单',caption:route==='today'?'只回到生活选择，不开户、不招生。':route==='video'?'先看作品与真实需求；接单和制作仍另行决定。':first.status==='available'?`这份小单尚未接下，制作费¥0、占用0点；原报价${moneyText(first.terms.priceFen)}。`:'查看这份原小单的日期与责任，不新增安排。',route,availableAt:v.catalog.availableAt,caseCount:count}
}
