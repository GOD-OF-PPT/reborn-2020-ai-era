import type {GamePanelProps,SceneTarget} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import {screenForRoute} from './Navigation.tsx'
import {moneyText,reasonText,wishes} from './game-text.ts'
import {sceneThreads} from './scene-thread-notes.ts'
import {openingFocusAfterSave,playerThread,type OpeningFocus} from './player-thread.ts'

export type SeasonInput=Pick<GamePanelProps,'view'|'features'>
type Inspect={screen:Screen;label:string;target?:SceneTarget}
export interface SeasonSourceRef{readonly kind:string;readonly id:string;readonly date:string|null}
export interface SeasonFocusChoice{
 readonly id:string;readonly title:string;readonly line:string;readonly stage:string
 readonly originQuarter:string|null;readonly date:string|null;readonly nextDate:string|null
 readonly focus:OpeningFocus;readonly scope:'entry'|'current'|'carry'|'history';readonly disabledReason:string|null
}
export interface SeasonEchoNode{readonly id:string;readonly date:string;readonly title:string;readonly line:string;readonly sourceRefs:readonly SeasonSourceRef[];readonly inspect:Inspect}
export interface SeasonPendingItem{readonly id:string;readonly title:string;readonly line:string;readonly dueAt:string|null;readonly accountId:string|null;readonly urgent:boolean;readonly sourceRefs:readonly SeasonSourceRef[];readonly focus:OpeningFocus|null;readonly inspect:Inspect}
export interface SeasonRecollectionView{
 readonly quarter:string;readonly from:string;readonly through:string;readonly asOf:string
 readonly closed:boolean;readonly atQuarterEnd:boolean;readonly closeSourceId:string|null
 readonly nodes:readonly SeasonEchoNode[];readonly allNodes:readonly SeasonEchoNode[];readonly remaining:readonly SeasonPendingItem[]
 readonly nextQuestion:string;readonly nextQuarterDate:string|null
}
const focusId=(f:OpeningFocus)=>[f.kind,f.accountId,f.entityId??('selection' in f?f.selection:'entry')].join('|')

/** Choosing a bookmark is separate from executing any of its original commands. */
export function seasonFocusChoices(p:SeasonInput):readonly SeasonFocusChoice[]{
 const {view,features:f}=p,rows:SeasonFocusChoice[]=[],base={runId:view.runId,accountId:'personal',entityId:null}
 const add=(focus:OpeningFocus,date:string|null=null,title?:string)=>{
  const thread=playerThread(p,focus),id=focusId(thread.focus)
  const prior=rows.findIndex(row=>row.id===id)
  if(prior!==-1){if(rows[prior]!.date===null&&date!==null)rows[prior]={...rows[prior]!,date};return}
  rows.push({id,title:title??thread.title,line:thread.line+' '+thread.detail,stage:thread.stage,originQuarter:thread.focusQuarter,date,nextDate:thread.wait?.date??null,focus:thread.focus,scope:thread.focusScope==='invalid'?'entry':thread.focusScope,disabledReason:thread.invalidReason})
 }
 add({...base,kind:'work'},null,'本季的工作与生活底线')
 add({...base,kind:'life',selection:'rest'},null,'留一段时间给自己')
 add({...base,kind:'life',selection:'workspace'},null,'眼前的住处与原改善记录')
 for(const person of f.life.people.filter(x=>x.known))add({...base,kind:'life',selection:person.id},null,'与'+person.name+'的原安排')
 for(const account of view.accounts)add({...base,kind:'market',accountId:account.accountId},null,(account.accountId==='personal'?'自己的':'原经营账户的')+'投资判断')
 add({...base,kind:'first-order',entityId:f.firstOrder.contractId??f.firstOrder.offerId},f.firstOrder.dates.startAt,'那份手工单与实际结果')
 for(const period of view.operations?.employment??[])add({...base,kind:'work',entityId:period.id},period.segments[0]?.from??null,period.quarter+' · 原工作安排')
 for(const job of f.life.jobs)add({...base,kind:'life',selection:job.personId??(job.kind==='workspace'?'workspace':'rest'),entityId:job.id},job.startAt)
 for(const promise of f.life.promises)add({...base,kind:'life',selection:promise.personId,entityId:promise.id},promise.offeredAt)
 for(const order of f.market.orders)add({...base,kind:'market',accountId:order.accountId,entityId:order.id,entityKind:'order'},order.submittedAt)
 for(const settlement of f.market.settlements)add({...base,kind:'market',accountId:settlement.accountId,entityId:settlement.id,entityKind:'settlement'},settlement.dueAt)
 for(const position of f.market.positions)add({...base,kind:'market',accountId:position.accountId,entityId:position.id,entityKind:'position'})
 for(const research of f.market.researches)add({...base,kind:'market',entityId:research.id,entityKind:'research'},research.startAt)
 return rows
}
export const focusCandidates=seasonFocusChoices

/** A pinned primary survives temporary responsibilities and explicitly chosen side activities. */
export function seasonFocusAfterSave(previous:SeasonInput,current:SeasonInput,kind:string,payload:unknown,existing:OpeningFocus|null,pinned=true):OpeningFocus|null{
 // An invalid public identity needs an explicit choice; a side action must not repair its pin.
 if(existing!==null&&playerThread(previous,existing).focusStatus==='invalid')return existing
 const candidate=openingFocusAfterSave(previous,current,kind,payload,existing)
 if(!pinned||existing===null||candidate===existing||candidate===null)return candidate
 if(existing.runId!==current.view.runId||candidate.kind!==existing.kind||candidate.accountId!==existing.accountId)return existing
 if(existing.kind==='life'&&(candidate.kind!=='life'||existing.selection!==candidate.selection))return existing
 // Refreshing the outcome of the same object is not a new primary selection or quarter.
 if(candidate.entityId===existing.entityId)return existing
 const entry=existing.entityId===null||existing.kind==='life'&&existing.entityId===existing.selection
 const firstEntry=existing.kind==='first-order'&&previous.features.firstOrder.contractId===null&&existing.entityId===previous.features.firstOrder.offerId
 if(entry||firstEntry)return candidate
 if(existing.kind==='market'&&kind==='AmendStockOrder'&&current.features.market.orders.some(o=>o.id===candidate.entityId&&o.accountId===existing.accountId&&o.replacesId===existing.entityId))return candidate
 return existing
}

function remainingItems(p:SeasonInput):SeasonPendingItem[]{
 const {view,features:f}=p,w=f.workbench,rows:SeasonPendingItem[]=[],base={runId:view.runId,accountId:'personal',entityId:null}
 const add=(row:SeasonPendingItem)=>{if(!rows.some(x=>x.id===row.id))rows.push(row)}
 const object=(focus:OpeningFocus,dueAt:string|null,ref:SeasonSourceRef)=>{const thread=playerThread(p,focus);add({id:focusId(focus),title:thread.title,line:thread.line+' '+thread.detail,dueAt,accountId:focus.accountId,urgent:dueAt!==null&&dueAt<view.date,sourceRefs:[ref],focus:thread.focus,inspect:thread.inspect})}
 for(const event of w.events.filter(e=>e.isBlocking||e.presentation!=='ordinary'))add({id:'event:'+event.id,title:event.title,line:`${event.createdAt}出现，最迟${event.expiresAt}回应；${event.isBlocking?'时间正等待你的决定。':'原选择与期限仍在。'}`,dueAt:event.expiresAt,accountId:event.accountId,urgent:event.isBlocking||event.expiresAt<=view.date,sourceRefs:[{kind:'event',id:event.id,date:event.createdAt}],focus:null,inspect:{screen:'quarter',label:'翻看这封原来信与可用选择',target:{accountId:event.accountId}}})
 if(w.pause)add({id:'pause:'+w.pause.instanceId,title:'日历停在一件需要面对的事上',line:w.pause.reason==='CONTENT_DECISION_PENDING'?'原来信正等待回应；读过不会自动选择，也不会清除旧责任。':reasonText(w.pause.reason),dueAt:null,accountId:null,urgent:true,sourceRefs:[{kind:'pause',id:w.pause.instanceId,date:null}],focus:null,inspect:{screen:w.pause.reason==='STORY_RISK_DECISION_PENDING'?'story':'quarter',label:'查看暂停原因与原处理入口'}})
 for(const account of w.finance){
  for(const debt of account.obligations)add({id:'obligation:'+debt.id,title:'原账户仍有待付义务',line:`${debt.date}到期，仍未付${moneyText(debt.remainingFen)}；原付款与延期处置分别决定。`,dueAt:debt.date,accountId:account.accountId,urgent:debt.date<=view.date,sourceRefs:[{kind:'obligation',id:debt.id,date:debt.date}],focus:null,inspect:{screen:'finance',label:'核对这份原账与待付义务',target:{accountId:account.accountId}}})
  if(account.protectionShortfallFen>0||account.commitmentShortfallFen>0)add({id:'shortfall:'+account.accountId,title:'当前有真实的承诺资金缺口',line:`保护或承诺不足${moneyText(Math.max(account.protectionShortfallFen,account.commitmentShortfallFen))}，不是已经清偿。`,dueAt:view.date,accountId:account.accountId,urgent:true,sourceRefs:[{kind:'account',id:account.accountId,date:view.date}],focus:null,inspect:{screen:'finance',label:'查看当前资金缺口',target:{accountId:account.accountId}}})
 }
 const first=f.firstOrder
 if(first.contractId&&!['settled','cancelled'].includes(String(first.status)))object({...base,kind:'first-order',entityId:first.contractId},first.dates.submitBy,{kind:'contract',id:first.contractId,date:first.dates.startAt})
 for(const job of f.life.jobs.filter(j=>j.status==='running'&&j.promiseId===null))object({...base,kind:'life',selection:job.personId??(job.kind==='workspace'?'workspace':'rest'),entityId:job.id},job.completeAt,{kind:'job',id:job.id,date:job.startAt})
 for(const promise of f.life.promises.filter(o=>o.status==='accepted'))object({...base,kind:'life',selection:promise.personId,entityId:promise.id},promise.deadline,{kind:'promise',id:promise.id,date:promise.acceptedAt})
 for(const order of f.market.orders.filter(o=>['planned','pending','partially_filled'].includes(o.status))){
  const expiry=f.market.matchingCalendar[order.expiresIndex-(f.market.stocks[0]?.index??-1)-1]?.date??null
  object({...base,kind:'market',accountId:order.accountId,entityId:order.id,entityKind:'order'},expiry,{kind:'order',id:order.id,date:order.submittedAt})
 }
 for(const settlement of f.market.settlements.filter(s=>s.paidAt===null))object({...base,kind:'market',accountId:settlement.accountId,entityId:settlement.id,entityKind:'settlement'},settlement.dueAt,{kind:'settlement',id:settlement.id,date:settlement.dueAt})
 for(const research of f.market.researches.filter(r=>r.status==='running'))object({...base,kind:'market',entityId:research.id,entityKind:'research'},research.completeAt,{kind:'research',id:research.id,date:research.startAt})
 for(const job of w.preparationJobs.filter(j=>j.status==='running'))add({id:'preparation:'+job.id,title:job.title,line:`原准备从${job.startAt}至${job.completeAt}，仍未完成；下一步沿原日历与准备记录。`,dueAt:job.completeAt,accountId:job.accountId,urgent:false,sourceRefs:[{kind:'preparation',id:job.id,date:job.startAt}],focus:null,inspect:{screen:'quarter',label:'翻看这项原准备',target:{accountId:job.accountId}}})
 for(const job of view.operations?.jobs.filter(j=>j.id!==first.jobId&&['planned','running'].includes(j.status))??[]){
  const business=view.operations?.businesses.find(b=>b.id===job.businessId)
  add({id:'operation-job:'+job.id,title:'原经营工作仍在继续',line:`${job.startAt}—${job.completeAt}；安排还没有成为完成结果。`,dueAt:job.completeAt,accountId:business?.accountId??null,urgent:false,sourceRefs:[{kind:'job',id:job.id,date:job.startAt}],focus:null,inspect:{screen:business?screenForRoute(business.route):'quarter',label:'翻看这项工作的原记录',...(business?{target:{accountId:business.accountId}}:{})}})
 }
 // Original specialized business responsibilities stay reachable without pretending S2 has their new UI.
 for(const item of sceneThreads(f,view.date).filter(t=>t.screen!=='life')){
  const id=item.id.slice(item.id.indexOf(':')+1)
  add({id:item.id,title:item.title,line:item.detail+' 请翻阅对应业务的全部原记录。',dueAt:null,accountId:null,urgent:item.screen==='story',sourceRefs:[{kind:'record',id,date:null}],focus:null,inspect:{screen:item.screen,label:'翻看这项责任的全部原记录',...(item.personId?{target:{personId:item.personId}}:{})}})
 }
 return rows
}

/** Recollection is an explanation of public dated records, never a stored score or a balance-delta guess. */
export function seasonRecollection(p:SeasonInput,quarter=p.features.workbench.quarter):SeasonRecollectionView|null{
 const {view,features:f}=p,w=f.workbench
 if(!/^202[0-5]-Q[1-4]$/.test(quarter)||quarter>w.quarter)return null
 const chapter=f.journey?.chapters.find(c=>c.id===quarter);if(!chapter)return null
 const from=chapter.from,end=chapter.through,through=view.date<end?view.date:end
 const closed=chapter.closedAt!==null&&chapter.closeSourceId!==null&&chapter.closedAt<=view.date&&(quarter<w.quarter||w.atQuarterEnd)
 const inPeriod=(date:string|null)=>date!==null&&date>=from&&date<=through
 const allNodes:SeasonEchoNode[]=[]
 const add=(node:SeasonEchoNode)=>{if(inPeriod(node.date)&&!allNodes.some(x=>x.id===node.id))allNodes.push(node)}
 for(const payroll of view.operations?.payroll??[])if(payroll.kind==='salary'&&payroll.amountFen>0)add({id:payroll.id,date:payroll.through,title:'按实际在岗日，工资已经收到',line:`本次实际工资${moneyText(payroll.amountFen)}；它与经营利润、持仓浮盈分别记录。`,sourceRefs:[{kind:'payroll',id:payroll.id,date:payroll.through},...(payroll.operationId?[{kind:'operation',id:payroll.operationId,date:payroll.through}]:[])],inspect:{screen:'quarter',label:'翻看这段原工作与工资记录',target:{accountId:'personal',recordId:payroll.entityId}}})
 const first=f.firstOrder
 if(first.contractId)for(const tx of w.finance.find(a=>a.accountId==='personal')?.transactions??[])if(tx.amountFen>0&&(tx.contractId===first.contractId||tx.sourceId===first.contractId))add({id:tx.id,date:tx.date,title:'手工单的客户款实际到账',line:`本次实收${moneyText(tx.amountFen)}；原制作成本${moneyText(first.result.directCostFen)}、本单净额${moneyText(first.result.netOrderFen)}。工资与其他收支没有算入本单。`,sourceRefs:[{kind:'payment',id:tx.id,date:tx.date},{kind:'contract',id:first.contractId,date:tx.date}],inspect:{screen:'quarter',label:'翻看这份原手工单',target:{accountId:'personal',recordId:first.contractId}}})
 for(const job of f.life.jobs){
  if(job.status==='completed'&&!f.life.promises.some(o=>o.status==='fulfilled'&&o.completionJobId===job.id))add({id:'life-result:'+job.id,date:job.completeAt,title:'一段留给生活的时间已经完成',line:`原安排${job.startAt}—${job.completeAt}；原费用${moneyText(job.costFen)}、${job.actionPoints}点已经按原开工日承担，完成不返还行动或增加收入。`,sourceRefs:[{kind:'job',id:job.id,date:job.completeAt},{kind:'command',id:job.originCommandId,date:job.startAt}],inspect:{screen:'life',label:'翻看这次原生活工作',target:{accountId:'personal',recordId:job.id,...(job.personId?{personId:job.personId,lifeSelection:'person' as const}:{lifeSelection:job.kind==='workspace'?'workspace' as const:'rest' as const})}}})
  if(job.status==='interrupted'&&job.releasedAt)add({id:'life-stop:'+job.id,date:job.releasedAt,title:'这次生活安排在半路停下',line:`已用${job.actionPoints}点与实际费用${moneyText(job.costFen)}保留，没有记作完成。`,sourceRefs:[{kind:'job',id:job.id,date:job.releasedAt}],inspect:{screen:'life',label:'翻看中断的原工作',target:{accountId:'personal',recordId:job.id,...(job.personId?{personId:job.personId,lifeSelection:'person' as const}:{lifeSelection:job.kind==='workspace'?'workspace' as const:'rest' as const})}}})
 }
 for(const promise of f.life.promises)if(promise.resolvedAt&&['fulfilled','missed','npc_declined'].includes(promise.status))add({id:'promise-result:'+promise.id,date:promise.resolvedAt,title:promise.status==='fulfilled'?'答应的事，已经实际兑现':promise.status==='missed'?'原约定没有按期兑现':'对方也有自己的安排',line:promise.status==='fulfilled'?'兑现来自原实际工作；接受邀请和实际完成各有自己的日期。':promise.status==='missed'?'原失约与已发生成本保留，不因回顾清除。':'对方撤回尚未接受的邀请，不记玩家失约，也没有自动新增费用。',sourceRefs:[{kind:'promise',id:promise.id,date:promise.resolvedAt},...(promise.resolutionSourceId?[{kind:'source',id:promise.resolutionSourceId,date:promise.resolvedAt}]:[])],inspect:{screen:'life',label:'翻看这项原约定',target:{accountId:'personal',personId:promise.personId,lifeSelection:'person',recordId:promise.id}}})
 for(const fill of f.market.fills){
  const order=f.market.orders.find(o=>o.id===fill.orderId);if(!order)continue
  add({id:fill.id,date:fill.date,title:order.side==='buy'?'一份模拟买入实际成交':'一份模拟卖出实际成交',line:`实际成交${fill.quantity}股，成交额${moneyText(fill.grossFen)}、费用${moneyText(fill.feeFen)}。成交、可售股份、交收和现金分别核对，持仓浮盈不是到账。`,sourceRefs:[{kind:'fill',id:fill.id,date:fill.date},{kind:'order',id:order.id,date:order.submittedAt}],inspect:{screen:'market',label:'翻看这份原委托与成交',target:{accountId:order.accountId,recordId:order.id}}})
 }
 for(const settlement of f.market.settlements)if(settlement.paidAt)add({id:settlement.id,date:settlement.paidAt,title:settlement.kind==='sale'?'模拟卖款已实际交收':'模拟分红已实际到账',line:`${moneyText(settlement.amountFen)}已进入原账户；它不是新的免费本金或额外行动。`,sourceRefs:[{kind:'settlement',id:settlement.id,date:settlement.paidAt}],inspect:{screen:'market',label:'翻看这笔原交收',target:{accountId:settlement.accountId,recordId:settlement.id}}})
 for(const research of f.market.researches)if(research.status==='completed')add({id:'research-result:'+research.id,date:research.completeAt,title:'公开研究已实际完成',line:'整理完成的是原公开资料；没有替你买股，也没有揭示未来价格。',sourceRefs:[{kind:'research',id:research.id,date:research.completeAt}],inspect:{screen:'market',label:'翻看这项原研究',target:{accountId:'personal',recordId:research.id}}})
 allNodes.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id))
 const nodes:SeasonEchoNode[]=[],kinds=new Set<string>()
 for(const node of allNodes){const kind=node.sourceRefs[0]?.kind??node.id;if(!kinds.has(kind)){nodes.push(node);kinds.add(kind)}if(nodes.length===3)break}
 for(const node of allNodes){if(nodes.length===3)break;if(!nodes.includes(node))nodes.push(node)}
 const remaining=remainingItems(p),wish=wishes[view.playerProfile.wishId]
 const nextQuarterDate=quarter===w.quarter&&w.atQuarterEnd?w.progression.nextQuarterDate:null
 const nextQuestion=quarter==='2025-Q4'?`六年之后，怎样守住“${wish}”？有限尾声只处理原来的事，不再开启新的季度或补充行动。`:`${nextQuarterDate?'下一季':'接下来'}，怎样让日子更接近“${wish}”？${remaining.length?'原来的约定仍在，可以先收好它们，再决定新的投入。':'可以继续熟悉的节奏，也可以重新选择把时间留给哪里。'}`
 return {quarter,from,through,asOf:view.date,closed,atQuarterEnd:quarter===w.quarter&&w.atQuarterEnd,closeSourceId:closed?chapter.closeSourceId:null,nodes,allNodes,remaining,nextQuestion,nextQuarterDate}
}
