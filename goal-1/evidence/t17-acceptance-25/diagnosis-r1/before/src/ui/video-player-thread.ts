import {quarterOf} from '../core/calendar.ts'
import type {GamePanelProps} from './game-types.ts'
import type {OpeningFocus,PlayerThreadView} from './player-thread.ts'
import {canonicalVideoTarget,videoSceneProgress,videoTargetReason,type VideoSceneTarget} from './video-scene-progress.ts'

type Input=Pick<GamePanelProps,'view'|'features'>
export type VideoOpeningFocus=Extract<OpeningFocus,{kind:'video'}>
type Scene=Pick<PlayerThreadView,'stage'|'object'|'title'|'line'|'detail'|'outcome'|'inspect'|'resultRefs'|'command'|'secondaryCommand'|'wait'>
export const videoTargetEntity=(t:VideoSceneTarget)=>t.contractId??t.workId??t.marketingId??t.channelId

export function resolveVideoFocus(p:Input,f:VideoOpeningFocus):{focus:VideoOpeningFocus;reason:string|null}{
 const v=p.features.video,t=f.videoTarget
 const bad=(reason:string)=>({focus:f,reason})
 if(f.runId!==p.view.runId)return bad('这份视频关注来自另一段人生，请重新选择。')
 if(t===null)return f.entityId===null&&f.accountId==='personal'&&f.businessId===undefined?{focus:f,reason:null}:bad('视频入口没有实际账号，不能绑定其他业务或对象，请重新选择。')
 const reason=videoTargetReason(v,t);if(reason)return bad(reason)
 const channel=v!.channels.find(c=>c.id===t.channelId)!
 const businesses=p.view.operations?.businesses.filter(b=>b.id===channel.businessId)??[]
 if(channel.accountId!==f.accountId||!p.view.accounts.some(a=>a.accountId===channel.accountId)||businesses.length!==1||businesses[0]!.accountId!==channel.accountId||businesses[0]!.route!=='ai_video'||f.businessId!==undefined&&f.businessId!==channel.businessId)return bad('原视频账号与账户或业务不匹配，没有换到另一个主体。')
 if(f.entityId!==videoTargetEntity(t))return bad('原视频关注对象与完整目标身份不一致，请重新选择。')
 const canonical=canonicalVideoTarget(v!,t)
 return {focus:{...f,businessId:channel.businessId,entityId:videoTargetEntity(canonical),videoTarget:canonical},reason:null}
}

export function videoFocusQuarter(p:Input,f:VideoOpeningFocus):string|null{
 const v=p.features.video,t=f.videoTarget;if(!v||!t)return p.features.workbench.quarter
 const c=v.contracts.find(c=>c.id===t.contractId),w=v.works.find(w=>w.id===t.workId),m=v.marketing.find(m=>m.id===t.marketingId),channel=v.channels.find(c=>c.id===t.channelId)
 const date=c?.acceptedAt??w?.production?.startAt??m?.job?.startAt??channel?.createdAt
 return date?quarterOf(date):null
}
export function videoFocusOpen(p:Input,f:VideoOpeningFocus){
 const v=p.features.video,t=f.videoTarget;if(!v||!t)return false
 if(t.contractId)return v.contracts.some(c=>c.id===t.contractId&&!['settled','cancelled'].includes(c.status))
 if(t.marketingId)return v.marketing.some(m=>m.id===t.marketingId&&!!m.job&&['planned','running'].includes(m.job.status))
 if(t.workId)return v.works.some(w=>w.id===t.workId&&!w.abandonedAt&&!v.publications.some(pub=>pub.workId===w.id&&pub.measuredAt!==null))
 return false
}
export function videoFocusResultDate(p:Input,f:VideoOpeningFocus):string|null{
 const v=p.features.video,t=f.videoTarget;if(!v||!t)return null
 const c=v.contracts.find(c=>c.id===t.contractId),w=v.works.find(w=>w.id===t.workId),m=v.marketing.find(m=>m.id===t.marketingId)
 return c?.settledAt??c?.reviewedAt??m?.completedAt??(w?.production?.status==='completed'?w.production.completeAt:null)
}
export function videoPlayerScene(p:Input,f:VideoOpeningFocus):Scene{
 const t=f.videoTarget
 if(t===null)return {stage:'video-entry',object:'桌上的视频制作工具',title:'先选一个具体的账号和受众。',line:'2020年可以从手工剪辑开始；新的客户必须来自真实受众。',detail:'建立账号不会自动制作或获得资格。准备、制作、客户验收与实际回款分别发生。',outcome:'none',inspect:{screen:'video',label:'查看原账号与视频准备',target:{accountId:'personal'}},resultRefs:[]}
 const progress=videoSceneProgress(p.features.video,p.view.date,t)!,contract=p.features.video!.contracts.find(c=>c.id===t.contractId)
 const resultRefs:PlayerThreadView['resultRefs'][number][]=[...progress.resultRefs]
 const work=p.features.video!.works.find(w=>w.id===t.workId)
 const channel=p.features.video!.channels.find(c=>c.id===t.channelId)!
 const workNumber=work?p.features.video!.works.filter(w=>w.channelId===channel.id).findIndex(w=>w.id===work.id)+1:null
 const object=channel.name+(workNumber?' · 作品'+workNumber:t.marketingId?' · 这次受众推广':' · 下一次制作')
 for(const job of work?[work.production,...work.corrections]:[])if(job?.status==='completed'&&job.completeAt<=p.view.date&&!resultRefs.some(r=>r.id===job.id))resultRefs.push({kind:'job',id:job.id,date:job.completeAt})
 if(contract?.settledAt)for(const tx of p.features.workbench.finance.find(a=>a.accountId===f.accountId)?.transactions??[])if(tx.date<=p.view.date&&tx.amountFen>0&&(tx.contractId===contract.id||tx.sourceId===contract.id))resultRefs.push({kind:'payment',id:tx.id,date:tx.date})
 const negotiation=contract?.status==='negotiating'?p.view.operations?.jobs.find(j=>j.id===contract.negotiationJobId):null
 const wait=negotiation&&['planned','running'].includes(negotiation.status)?{date:negotiation.status==='planned'?negotiation.startAt:negotiation.completeAt,label:negotiation.status==='planned'?'等这份原谈判开工':'等这份原谈判实际反馈'}:progress.wait
 return {stage:progress.stage,object,title:progress.title,line:progress.line,detail:progress.choice.line,outcome:progress.outcome,inspect:{screen:'video',label:progress.choice.label,target:{accountId:f.accountId,videoTarget:t}},resultRefs,...(progress.command?{command:{...progress.command,label:progress.choice.label}}:{}),...(wait?{wait}:{})}
}

/** Only an explicitly saved video command can introduce a related public identity. */
export function videoFocusFromSaved(previous:Input,current:Input,kind:string,body:Record<string,unknown>):VideoOpeningFocus|null{
 const before=previous.features.video,v=current.features.video;if(!v||!before)return null
 let target:VideoSceneTarget|null=null
 if(kind==='OpenVideoChannel'){const channel=v.channels.find(c=>!before.channels.some(old=>old.id===c.id));if(channel)target={channelId:channel.id}}
 if(kind==='StartVideoMarketing'){const m=v.marketing.find(m=>m.channelId===body.channelId&&!before.marketing.some(old=>old.id===m.id));if(m)target={channelId:m.channelId,marketingId:m.id}}
 if(kind==='StartVideoWork'){const w=v.works.find(w=>w.channelId===body.channelId&&!before.works.some(old=>old.id===w.id));if(w)target={channelId:w.channelId,workId:w.id}}
 if(kind==='AcceptVideoCommission'){const c=v.contracts.find(c=>c.channelId===body.channelId&&c.clientId===body.clientId&&c.cohortId===body.cohortId&&!before.contracts.some(old=>old.id===c.id));if(c)target={channelId:c.channelId,workId:c.workId,contractId:c.id}}
 if(['ReviewVideoOutput','ReworkVideo','PublishVideo','AbandonVideoWork'].includes(kind)){const w=v.works.find(w=>w.id===body.workId);if(w)target={channelId:w.channelId,workId:w.id,...(w.contractId?{contractId:w.contractId}:{})}}
 if(['SubmitVideoCommission','NegotiateVideoCommission','ExitVideoCommission','CollectVideoSettlement'].includes(kind)){const c=v.contracts.find(c=>c.id===(body.contractId??body.settlementId));if(c)target={channelId:c.channelId,workId:c.workId,contractId:c.id}}
 if(kind==='InterruptJob'){
  const w=v.works.find(w=>w.production?.id===body.jobId||w.corrections.some(j=>j?.id===body.jobId)),c=v.contracts.find(c=>c.negotiationJobId===body.jobId),m=v.marketing.find(m=>m.jobId===body.jobId)
  if(w)target={channelId:w.channelId,workId:w.id,...(w.contractId?{contractId:w.contractId}:{})}
  else if(c)target={channelId:c.channelId,workId:c.workId,contractId:c.id}
  else if(m)target={channelId:m.channelId,marketingId:m.id}
 }
 if(!target)return null
 const channel=v.channels.find(c=>c.id===target.channelId);if(!channel)return null
 const focus:VideoOpeningFocus={runId:current.view.runId,kind:'video',accountId:channel.accountId,businessId:channel.businessId,entityId:videoTargetEntity(target),videoTarget:target}
 const matched=resolveVideoFocus(current,focus);return matched.reason?null:matched.focus
}
