import {addDays,isoDate} from '../core/calendar.ts'
import {marketId} from '../core/market.ts'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {sceneTimeNarrative,type EchoFrame} from './SceneEcho.tsx'
import {moneyText} from './game-text.ts'

type Input=Pick<GamePanelProps,'view'|'features'>
const definitions={
 'market-overview':{object:'公开研究笔记',wait:'等公开资料整理好',running:'先理清眼前的线索。',completed:'资料理清了，日子继续。',permission:null,result:'公开线索已整理；买卖仍由你决定。'},
 'market-foundation-course':{object:'模拟规则研习笔记',wait:'等规则研习完成',running:'先把交易规则学明白。',completed:'规则学完了，再作自己的判断。',permission:'sim-researched',result:'已取得本局模拟规则研习资格；买卖仍须显选。'},
 'simulation-special-study':{object:'模拟试验段研习笔记',wait:'等试验研习完成',running:'试验段的研习，还在继续。',completed:'研习完成，接下来由你选择。',permission:'sim-experimental-access',result:'已取得本局模拟试验段资格；不保证标的可交易。'},
} as const
const validDate=(date:string)=>{try{return isoDate(date)===date}catch{return false}}
const natural=(value:number)=>Number.isSafeInteger(value)&&value>=0
function currentResearch(p:Input,thread:PlayerThreadView){
 const focus=thread.focus,m=p.features.market,date=p.view.date
 if(focus.kind!=='market'||focus.entityKind!=='research'||focus.runId!==p.view.runId||focus.accountId!=='personal'||thread.focusStatus==='invalid'||!['current','carry'].includes(thread.focusScope)||thread.responsibilityOverrideNeeded||thread.legacyFallbackRequired||p.features.workbench.atQuarterEnd||!validDate(date))return null
 const rows=m.researches.filter(row=>row.id===focus.entityId)
 if(rows.length!==1||p.view.accounts.filter(row=>row.accountId==='personal').length!==1)return null
 const research=rows[0]!
 if(!['running','completed','interrupted'].includes(research.status)||!Object.hasOwn(definitions,research.definitionId)||!validDate(research.startAt)||!validDate(research.completeAt)||research.startAt>date||research.completeAt<=research.startAt)return null
 const copy=definitions[research.definitionId as keyof typeof definitions],terms=p.features.workbench.researches.filter(row=>row.id===research.definitionId)
 if(terms.length!==1||terms[0]!.state?.id!==research.id||terms[0]!.state.status!==research.status||terms[0]!.entitlementId!==copy.permission)return null
 if(research.status==='completed'&&research.completeAt>date||research.status==='running'&&research.completeAt<date)return null
 if(research.status==='completed'&&copy.permission){const permissions=m.permissions.filter(row=>row.id===copy.permission&&row.sourceId===research.id);if(permissions.length!==1||permissions[0]!.date!==research.completeAt)return null}
 return {research,copy,term:terms[0]!}
}

/** A short first layer for one known public research. Original records and
 * action bindings remain with the thread. */
export function researchRoomCopy(p:Input,thread:PlayerThreadView){
 const known=currentResearch(p,thread);if(!known)return null
 const {research,copy}=known,carry=thread.focusScope==='carry'&&thread.focusQuarter?'始于'+thread.focusQuarter+' · ':''
 const facts=research.status==='running'?[carry+'预计'+research.completeAt+'完成；期间仍可安排生活。','中断不退已用的钱和行动。']:research.status==='completed'?[research.completeAt+'已完成 · '+copy.result]:['这份研究已中断；已用的钱和行动不返还。']
 return {object:copy.object,title:research.status==='running'?copy.running:research.status==='completed'?copy.completed:'这份研究，先放一放。',stage:research.status==='running'?'研习中 · 等待结果':research.status==='completed'?'已完成 · 笔记保留':'已中断 · 原记录保留',facts,resultEcho:research.status==='completed'&&copy.permission?copy.result:null}
}

/** Name this exact original wait without changing its destination date. */
export function researchWaitLabel(p:Input,thread:PlayerThreadView,date:string|null,fallback:string):string{
 const known=currentResearch(p,thread)
 return known&&known.research.status==='running'&&date===known.research.completeAt&&thread.wait?.date===date?known.copy.wait:fallback
}

/** Shorten only the exact producer text for this single research. Mixed money,
 * responsibilities and unfamiliar narration keep the complete first layer. */
export function researchRoomBrief(p:Input,thread:PlayerThreadView,notice:{date:string;text:string;brief?:string;frame:EchoFrame|null}):string|null{
 const known=currentResearch(p,thread),frame=notice.frame,last=p.view.receipts.at(-1)
 if(!known||!frame||!last||last.revisionAfter!==p.view.revision||p.view.saveStatus!=='saved'||p.view.hasCandidate||p.view.busy||notice.date!==p.view.date||frame.dateAfter!==p.view.date||frame.quarterChanged||!validDate(frame.dateBefore)||frame.pointsAfter!==p.view.budget.available||frame.spentAfter!==p.view.budget.spent||frame.reservedAfter!==p.view.budget.reserved||frame.reservedBefore!==frame.reservedAfter)return null
 if(new Set(frame.accounts.map(row=>row.id)).size!==frame.accounts.length||frame.accounts.filter(row=>row.id==='personal').length!==1||frame.accounts.some(row=>{const current=p.view.accounts.filter(account=>account.accountId===row.id);return current.length!==1||current[0]!.availableFen!==row.after||row.before===null||row.id!=='personal'&&row.before!==row.after}))return null
 const {research,copy,term}=known,account=frame.accounts.find(row=>row.id==='personal')!
 if(last.kind==='AdvanceTime'&&research.status==='running'&&p.view.date<research.completeAt&&frame.dateBefore<p.view.date&&frame.pointsBefore===frame.pointsAfter&&frame.spentBefore===frame.spentAfter&&frame.accounts.every(row=>row.before===row.after)){
  const first=p.features.firstOrder,replyBy=first.dates.replyBy
  if(first.status==='expired'&&validDate(replyBy)&&frame.dateBefore<=replyBy&&addDays(replyBy,1)===p.view.date&&notice.brief==='委托答复期限已过。'){
   const original=p.view.date+'。已经确认的安排按真实日期发生，眼前又多了一次选择。 那份原委托，有了新的实际反馈。 日历从'+frame.dateBefore+'走到'+frame.dateAfter+'。'
   if(notice.text===original||notice.text===original+' 日子先停在这次真实反馈，剩下的安排仍在原日历里。')return '手工小单的答复期限已过；这份研习仍在继续。'
  }
 }
 if(last.kind==='ResearchMarket'&&research.status==='running'&&marketId('command',last.commandId)===research.id&&frame.dateBefore===frame.dateAfter&&research.startAt===p.view.date){
  const original=`个人账户：1项市场研究已开始，${research.startAt}—${research.completeAt}；费用与行动按这次安排记录，尚未完成，研究不揭示未来价格或代你交易。`
  if(notice.text!==original||notice.brief!==undefined&&notice.brief!==original||!natural(term.costFen)||!natural(term.actionPoints)||!Number.isSafeInteger(term.days)||term.days<=0||addDays(research.startAt,term.days)!==research.completeAt)return null
  const finance=p.features.workbench.finance.filter(row=>row.accountId==='personal');if(finance.length!==1)return null
  const costs=finance[0]!.metrics.filter(row=>row.kind==='cost'&&row.referenceId===research.actionId),payments=finance[0]!.transactions.filter(row=>row.sourceId===research.id)
  if(costs.some(row=>!natural(row.deltaFen))||payments.some(row=>!Number.isSafeInteger(row.amountFen)||row.amountFen>0||row.date!==research.startAt))return null
  const paid=costs.reduce((sum,row)=>sum+row.deltaFen,0),cash=-payments.reduce((sum,row)=>sum+row.amountFen,0),points=frame.spentAfter-frame.spentBefore
  if(!natural(paid)||paid!==cash||paid!==term.costFen||account.before!-account.after!==paid||points!==term.actionPoints||frame.pointsBefore-frame.pointsAfter!==points)return null
  return `${copy.object}已开始 · 已付${moneyText(paid)} / 已用${points}点。`
 }
 if(last.kind!=='AdvanceTime'||research.status!=='completed'||frame.dateBefore>=research.completeAt||research.completeAt!==p.view.date||frame.pointsBefore!==frame.pointsAfter||frame.spentBefore!==frame.spentAfter||frame.accounts.some(row=>row.before!==row.after))return null
 const original='个人账户：1项市场研究已完成，只整理已公开线索；这不是未来价格，也没有替你下委托。',cause=p.view.date+'，'+original
 const simple=cause+' 原研究有了实际进展。 日历从'+frame.dateBefore+'走到'+frame.dateAfter+'。'
 const direct=cause+' 日历从'+frame.dateBefore+'走到'+frame.dateAfter+'。'
 if(sceneTimeNarrative(notice.date,notice.brief??notice.text)!==original||![cause,simple,simple+' 日子先停在这次真实反馈，剩下的安排仍在原日历里。',direct,direct+' 日子先停在这次真实反馈，剩下的安排仍在原日历里。'].includes(notice.text))return null
 return copy.permission?copy.result:copy.object+'已完成，可以作下一次选择了。'
}
