import type {PlayingView,PlayFeatures} from './game-types.ts'
import {equityBusinessContinuity,EQUITY_SHARED_COMMANDS} from './equity-business-continuity.ts'
import {sceneCashResult} from './scene-cash-result.ts'
import {moneyText} from './game-text.ts'

/** An adjacent, original saved command and its actual public consequences. */
export function equitySharedResult(kind:string,previous:PlayingView|null,current:PlayingView):string|null{
 if(!EQUITY_SHARED_COMMANDS.has(kind)||!previous||previous.runId!==current.runId||current.revision!==previous.revision+1||current.saveStatus!=='saved'||current.hasCandidate||current.readOnly||current.busy)return null
 const before=previous.features as unknown as PlayFeatures,after=current.features as unknown as PlayFeatures,last=current.receipts.at(-1),published=after.sceneCommands
 if(!last||last.kind!==kind||last.revisionAfter!==current.revision||!published||published.version!==1||published.runId!==current.runId||published.committedRevision!==current.revision)return null
 const commands=published.commands.filter(c=>c.commandId===last.commandId&&c.kind===kind&&c.revisionAfter===current.revision&&c.date===current.date)
 if(commands.length!==1)return null
 const command=commands[0]!,jobs=previous.operations?.jobs.filter(j=>j.id===command.identifiers.jobId)??[],job=jobs.length===1?jobs[0]:undefined,businessId=command.identifiers.businessId??job?.businessId
 if(!businessId)return null
 const old=equityBusinessContinuity({view:previous,features:before},businessId),next=equityBusinessContinuity({view:current,features:after},businessId)
 if(!old||!next||old.business.accountId!==next.business.accountId)return null
 const cash=old.finance&&next.finance?sceneCashResult(before.workbench.finance,after.workbench.finance,previous.date,current.date,id=>id==='personal'?'个人账户':'原企业账户 · '+id.slice(-6))??'本次没有新的现金收付。':'本次实际现金来源仍待核对，不按零补齐。'
 const retention='原持股、锁定、费用与未收款各自保留；客户退款、支持补偿和真实应付仍按原记录处理，也可以先回自己的生活。'
 if(kind==='WindDownBusiness'){
  if(old.business.lifecycle===next.business.lifecycle||next.business.lifecycle!=='winding_down'||next.business.history.at(-1)?.sourceId!==last.commandId)return null
  for(const j of old.affected){const rows=current.operations?.jobs.filter(n=>n.id===j.id&&n.businessId===j.businessId&&n.actionId===j.actionId)??[];if(rows.length!==1||rows[0]!.status!==(j.status==='planned'?'cancelled':'interrupted')||rows[0]!.releasedAt!==current.date)return null}
  return `原主体已经进入收尾；${cash} ${old.own.length}项本主体原任务按实际阶段停止${old.elsewhere.length?'，本主体员工涉及的另外'+old.elsewhere.length+'项跨分账任务也已停止':''}，已用行动和费用不退。${retention}`
 }
 if(kind==='CloseBusiness'){
  if(old.business.lifecycle!=='winding_down'||next.business.lifecycle!=='closed'||next.business.history.at(-1)?.sourceId!==last.commandId)return null
  return `这份原分账已经关闭；${cash} ${next.business.company?'原企业剩余现金转回个人，是自有资金转回，不是新收入。':'个人现金不因合上准备分账而转移或产生收入。'}原准备、合同、费用与人生历史继续留存，下一段生活由你再选。`
 }
 if(kind==='FundBusiness')return `这笔个人自有资本已经转入原企业；${cash} 转账不是收入、费用或取得股份，原保护款和旧义务继续保留。`
 if(!job||old.business.definitionId!=='deepseek-investor')return null
 const rows=current.operations?.jobs.filter(j=>j.id===job.id&&j.businessId===job.businessId&&j.actionId===job.actionId)??[],now=rows.length===1?rows[0]:undefined
 if(kind==='InterruptJob'&&now&&['planned','running'].includes(job.status)&&now.status===(job.status==='planned'?'cancelled':'interrupted')&&now.releasedAt===current.date)return `这份原任务已经${job.status==='planned'?'取消未开工安排':'中断，未记作完成'}；${cash} 原已付权益任务费用${moneyText(next.costs.paidFen)}仍保留，未开工资金预留${moneyText(next.costs.reservedFen)}按原任务核对；已用行动不退，原持股和其他约定仍在。`
 return null
}
