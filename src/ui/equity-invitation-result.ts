import type {PlayingView,PlayFeatures} from './game-types.ts'
import {deepseekId} from '../core/deepseek-state.ts'
import {equityBrokerFee,equityDirectCosts} from './equity-costs.ts'
import {moneyText} from './game-text.ts'
import type {PublicFeedback} from '../application/public-feedback.ts'
import {resolveEquitySceneTarget} from './equity-scene-target.ts'
import {equitySceneContext} from './equity-player-thread.ts'

/** Only a uniquely matched adjacent saved public invitation effect is narrated. */
export function equityInvitationResult(kind:string,previous:PlayingView|null,current:PlayingView):string|null{
 if(!['DiscoverEquityInvitation','PayUnverifiedBrokerFee','RejectEquityInvitation'].includes(kind)||!previous||previous.runId!==current.runId||previous.date!==current.date||current.revision!==previous.revision+1||current.saveStatus!=='saved'||current.hasCandidate||current.readOnly||current.busy)return null
 const before=previous.features as unknown as PlayFeatures,after=current.features as unknown as PlayFeatures,v=after.deepseek,old=before.deepseek,last=current.receipts.at(-1),source=after.sceneCommands
 if(!v||!old||last?.kind!==kind||last.revisionAfter!==current.revision||source?.version!==1||source.runId!==current.runId||source.committedRevision!==current.revision)return null
 const commands=source.commands.filter(c=>c.commandId===last.commandId&&c.kind===kind&&c.date===current.date&&c.revisionAfter===current.revision)
 if(commands.length!==1)return null
 const command=commands[0]!,id=kind==='DiscoverEquityInvitation'?deepseekId(last.commandId,kind):command.identifiers.invitationId,rows=v.invitations.filter(i=>i.id===id)
 if(rows.length!==1)return null
 const i=rows[0]!,owners=v.businesses.filter(b=>b.id===i.businessId),prior=old.invitations.filter(a=>a.id===i.id)
 if(owners.length!==1||prior.some(a=>a.businessId!==i.businessId))return null
 const b=owners[0]!,account=b.accountId==='personal'?'个人账户':'原企业账户 · '+b.accountId.slice(-6)
 if(kind==='DiscoverEquityInvitation')return !prior.length&&command.identifiers.businessId===b.id&&i.createdAt===current.date&&i.reportAt===null?`这封${i.source==='broker'?'未核验的中间人消息':'合作介绍'}已经留下，最迟${i.expiresAt}；查看介绍没有取得股份。先比较独立调查与拒绝，是否投入由你决定。`:null
 if(prior.length!==1||prior[0]!.status!=='open')return null
 const fee=equityBrokerFee(i,b.accountId,after.workbench.finance,current.date)
 if(kind==='PayUnverifiedBrokerFee')return prior[0]!.brokerPaymentId===null&&i.brokerPaymentId===deepseekId(last.commandId,kind)&&fee.paidFen===100000?`${account}已实际支付中间服务费${moneyText(fee.paidFen)}；没有取得股份、资格或融资同意，也没有安排调查。费用留在这封介绍的记录里，下一步仍可独立调查或拒绝。`:null
 if(i.status!=='declined'||i.brokerPaymentId!==prior[0]!.brokerPaymentId||i.diligenceJobId!==prior[0]!.diligenceJobId)return null
 const costs=equityDirectCosts(b.id,b.accountId,current.operations?.jobs,after.workbench.finance,current.date),retained=[...(fee.paidFen!==null&&fee.paidFen>0?['已付中间服务费'+moneyText(fee.paidFen)]:[]),...(costs.paidFen!==null&&costs.paidFen>0?['本主体已付权益任务费用'+moneyText(costs.paidFen)]:[])],working=i.diligenceJob&&['planned','running'].includes(i.diligenceJob.status)
 return `这封邀请已经拒绝，本次没有新增付款；${retained.length?retained.join('、')+'仍保留，不自动退还。':'已有投入仍按原账保留。'}${fee.reason??''}${costs.reason??''}${working?'原调查仍在'+i.diligenceJob!.startAt+'—'+i.diligenceJob!.completeAt+'，拒绝邀请没有自动取消该任务。':'本次不再等待新的邀请回应，也没有取得股份。'}可以收好记录，回到自己的生活。`
}

export function equityInvitationBrief(kind:string,previous:PlayingView|null,current:PlayingView):string|null{
 if(equityInvitationResult(kind,previous,current)===null)return null
 return kind==='PayUnverifiedBrokerFee'?'付了¥1,000中间费，介绍还没查清。':kind==='RejectEquityInvitation'?'这封邀请收好了，已花费用仍在。':'一封介绍留下了，下一步由你选。'
}

/** A pure, already published report may have a short sentence. Mixed public
 * feedback must retain its original multi-object narration. */
export function equityReportBrief(before:PlayingView,last:PlayingView,feedback:readonly PublicFeedback[]):string|null{
 const old=(before.features as unknown as PlayFeatures).deepseek,features=last.features as unknown as PlayFeatures,v=features.deepseek
 if(before.runId!==last.runId||last.revision<=before.revision||last.saveStatus!=='saved'||last.hasCandidate||!old||!v)return null
 const reports=v.invitations.filter(i=>i.reportAt!==null&&i.reportAt<=last.date&&old.invitations.filter(o=>o.id===i.id&&o.businessId===i.businessId&&o.reportAt===null).length===1)
 if(reports.length!==1)return null
 const i=reports[0]!,owners=v.businesses.filter(b=>b.id===i.businessId)
 if(owners.length!==1||!feedback.length||feedback.some(row=>row.kind!=='job'||row.sourceId!==i.diligenceJobId))return null
 const b=owners[0]!,r=resolveEquitySceneTarget(v,{runId:last.runId,accountId:b.accountId,businessId:b.id,kind:'invitation',recordId:i.id},equitySceneContext({view:last,features},b.accountId))
 if(r.status!=='valid'||r.job?.status!=='completed'||r.invitation?.reportAt!==r.job.completeAt)return null
 return i.authority===false?'调查回信了：这次没能核实授权。':i.financingConsent===false?'授权已核实，对方暂不愿融资。':'授权与有条件融资意愿已核实。'
}
