import type {GamePanelProps} from './game-types.ts'
import {todayReadingGroups,type TodayThreadView} from './today-thread.ts'
import {playerThread,type OpeningFocus} from './player-thread.ts'
import {workRoomCopy} from './work-room-copy.ts'
import {personalDayReturn} from './personal-day-return.ts'
import {researchRoomCopy} from './research-room-copy.ts'
import {lifeSceneProgress} from './life-scene-progress.ts'
import {moneyText} from './game-text.ts'

export interface TodayOngoingReading{readonly title:string;readonly line:string;readonly merged:boolean}
const generic='还有1件已经答应的事，正在照约定继续。'
const samePersonalFocus=(a:OpeningFocus,b:OpeningFocus)=>{if(a.runId!==b.runId||a.kind!==b.kind||a.accountId!==b.accountId||a.entityId!==b.entityId)return false;if(a.kind==='life'&&b.kind==='life')return a.selection===b.selection;if(a.kind==='market'&&b.kind==='market')return a.entityKind===b.entityKind;return a.kind==='work'&&b.kind==='work'}
/** Name the sole current personal object. Only exact authored equivalent facts
 * may replace the generic/continuation pair; unfamiliar money or context stays. */
export function todayOngoingReading(p:Pick<GamePanelProps,'view'|'features'>,today:TodayThreadView,situation:string|null):TodayOngoingReading|null{
 const {view,features}=p,source=today.source,pin=today.primary.thread
 if(view.phase!=='playing'||features.workbench.atQuarterEnd||today.responsibilityOverrideNeeded||pin.responsibilityOverrideNeeded||pin.focusStatus==='invalid'||pin.focusScope==='history'||today.primary.classification==='history'||today.primary.classification==='invalid'||pin.focus.runId!==view.runId||pin.focus.accountId!=='personal'||source.runId!==view.runId||source.revision!==view.revision||source.date!==view.date||source.quarter!==features.workbench.quarter||view.accounts.filter(row=>row.accountId==='personal').length!==1)return null
 const {continuing}=todayReadingGroups(today.ongoing)
 if(continuing.length!==1)return null
 const one=continuing[0]!,f=one.focus
 if(f.runId!==view.runId||f.accountId!=='personal'||one.relayContinuation||one.ecosystemContinuation||one.equityContinuation)return null
 const original=playerThread(p,f),date=one.wait?.date
 if(!samePersonalFocus(original.focus,f)||original.focusStatus==='invalid'||!['current','carry'].includes(original.focusScope)||original.responsibilityOverrideNeeded||original.legacyFallbackRequired||!date||original.wait?.date!==date||one.title!==original.title||one.line!==original.line)return null
 const allowed=[generic]
 let title:string,line:string
 if(f.kind==='work'){
  if(!workRoomCopy(p,original)||one.marketContinuation)return null
  const periods=view.operations!.employment.filter(row=>row.id===f.entityId),period=periods[0]
  if(periods.length!==1||!period||period.quarter!==features.workbench.quarter||period.limit<=view.date||!period.segments.some(row=>row.to===null&&row.from<=view.date)||date<=view.date)return null
  const paid=view.operations!.payroll.filter(row=>row.kind==='salary'&&row.entityId===period.id&&row.amountFen>0),total=paid.reduce((sum,row)=>sum+row.amountFen,0)
  title='工作还在继续，今天怎么过？';line=(paid.length?'本季已实收工资'+moneyText(total):'本季尚无工资实收')+' · 下一次反馈预计'+date+'。'
  allowed.push((paid.length?'本段实际工资'+moneyText(total)+'；':'')+'原在岗日与共享行动照常，副业和生活仍可组合。')
 }else{
  let reading=personalDayReturn(p,original)
  if(!reading&&f.kind==='life'){
   // Today may retain the accepted parent promise while its original child job
   // actually runs. Read that child, keeping every action on the parent focus.
   const progress=lifeSceneProgress(features.life,view.date,f.selection),promise=progress.promise,job=progress.job,person=progress.person
   if(progress.stage==='running'&&promise?.id===f.entityId&&promise.status==='accepted'&&promise.acceptedAt!==null&&promise.acceptedAt<=view.date&&job?.promiseId===promise.id&&job.personId===promise.personId&&person?.id===promise.personId){
    const rows=features.life.promises.filter(row=>row.id===promise.id),own=person.promises.filter(row=>row.id===promise.id)
    if(rows.length===1&&own.length===1&&JSON.stringify(rows[0])===JSON.stringify(promise)&&JSON.stringify(own[0])===JSON.stringify(promise))reading=personalDayReturn(p,playerThread(p,{...f,entityId:job.id}))
   }
  }
  if(!reading)return null
  if(f.kind==='life'&&reading.kind==='life'){
   if(one.marketContinuation)return null
   const job=features.life.jobs.find(row=>row.id===reading.sourceId)!
   if(!Number.isSafeInteger(job.costFen)||job.costFen<0||!Number.isSafeInteger(job.actionPoints)||job.actionPoints<0)return null
   if(job.kind==='rest')title='休整还在继续，今天怎样过？'
   else if(job.kind==='workspace')title='住处还在改善，今天怎样安排？'
   else{const person=features.life.people.find(row=>row.id===job.personId);if(!person?.known)return null;title=job.kind==='promise_keep'?'答应'+person.name+'的事，还在进行。':'与'+person.name+'的相处，还在继续。'}
   line=job.startAt+'—'+job.completeAt+' · 已付'+moneyText(job.costFen)+' / 已用'+job.actionPoints+'点，尚未完成。'
   if(samePersonalFocus(pin.focus,f))allowed.push(job.startAt+'—'+job.completeAt+'的原安排尚未完成；实际投入'+moneyText(job.costFen)+'保留。')
  }else if(f.kind==='market'&&f.entityKind==='research'&&reading.kind==='research'){
   if(one.marketContinuation?.kind!=='task')return null
   const copy=researchRoomCopy(p,original),research=features.market.researches.find(row=>row.id===reading.sourceId)!
   if(!copy)return null
   title=copy.object+'，还在继续。';line=research.startAt+'—'+research.completeAt+' · 预计整理完成；不揭示未来价格，不代你交易。'
   const expected=research.startAt+'—'+research.completeAt+'，你正在整理公开资料。研究不会揭示未来价格，也不会替你买入。'
   if(one.line===expected)allowed.push(expected)
  }else return null
 }
 return {title,line,merged:situation!==null&&allowed.includes(situation)}
}
