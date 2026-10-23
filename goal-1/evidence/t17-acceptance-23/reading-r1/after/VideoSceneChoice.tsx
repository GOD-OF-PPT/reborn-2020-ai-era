import {useEffect,useId,useRef,useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import {videoSceneDraftKey,type VideoSceneDraft} from './video-scene-draft.ts'
export type {VideoSceneDraft} from './video-scene-draft.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {videoSceneProgress,type VideoSceneTarget} from './video-scene-progress.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {addDays,isoDate} from '../core/calendar.ts'
import {VIDEO_JOBS} from '../content/video.ts'
import {moneyText,playableThrough,lifecycleText,reasonText} from './game-text.ts'
import './video-play.css'

export type VideoChoiceAction='channel'|'marketing'|'sample'|'commission'|'rework'|'price'|'scope'|'publish'
type Page='channel'|'create'|'purpose'|'clients'|'product'|'mode'|'material'|'schedule'|'record'|'response'|'publish'|'objects'
export type VideoChoiceCommand={kind:string;payload:Record<string,unknown>;label:string;confirm:boolean}
type Props={p:GamePanelProps;target?:VideoSceneTarget;onTargetChange?:(target:VideoSceneTarget)=>void;blockedReason?:string|null;onInspect?:(target?:VideoSceneTarget)=>void;children?:(open:(action?:VideoChoiceAction)=>void)=>ReactNode}
const emptyDraft=(channelId=''):VideoSceneDraft=>({channelId,clientId:'',cohortId:'',modeId:'',materialId:'',resource:'',startAt:'',productId:'',name:'',segment:'',monetization:'',label:false})
const segments=[['ai_learners','学习AI的普通人'],['local_merchants','本地商家'],['lifestyle','生活方式受众']] as const
const actions:Record<VideoChoiceAction,string>={channel:'创建这个内容账号',marketing:'核对这次受众调研与推广',sample:'核对这份作品的制作安排',commission:'核对并接下这位客户的委托',rework:'核对这一版的校正或返工',price:'核对额外报价谈判',scope:'核对缩小范围谈判',publish:'核对本次发布'}

/** Only presentation changes; the original error code and command guard remain intact. */
export function videoSceneReasonText(code:string):string{
 return code==='INSUFFICIENT_ACTION_POINTS'?'本季行动点已不足。阅读与撤回未执行安排不另耗行动；推进本身不另耗行动，途中原费用照常发生。':reasonText(code)
}

/** Browsing a tool is not a failed command; describe only its already public prerequisites. */
export function videoModeCaption(reasonCodes:readonly string[]):string{
 const era=reasonCodes.some(code=>code==='CAPABILITY_NOT_YET_AVAILABLE'||code==='WORLD_RELEASE_NOT_OCCURRED')
 const access=reasonCodes.some(code=>code.startsWith('MISSING_ENTITLEMENT:'))
 const unknown=reasonCodes.some(code=>code!=='CAPABILITY_NOT_YET_AVAILABLE'&&code!=='WORLD_RELEASE_NOT_OCCURRED'&&!code.startsWith('MISSING_ENTITLEMENT:'))
 const lines:string[]=[]
 if(era)lines.push('这项工具在当前年代尚未开放')
 if(access)lines.push('使用前需先取得对应访问资格')
 if(unknown)lines.push('其他使用条件请查看完整记录')
 return lines.length?lines.join('；')+'。':'下一步核对资格、资源与开工日期。'
}

/** An estimate reads the selected original job; it never schedules or completes work. */
export function videoScheduleCaption(draft:VideoSceneDraft,action:VideoChoiceAction,currentDate:string):string{
 const jobId=action==='marketing'?'video-marketing':action==='rework'?'video-rework':action==='price'||action==='scope'?'video-negotiate':action==='commission'||action==='sample'?`video-make-${action==='commission'?'commercial':draft.productId}-${draft.modeId}-${draft.materialId}`:null
 const job=VIDEO_JOBS.find(item=>item.id===jobId)
 if(!job)return '请先选择本次制作方式与素材，再核对这次投入和预计完成日。'
 if(!draft.resource||!draft.startAt)return '请先选择本次实际资源与开工日，再核对这次投入和预计完成日。'
 let completeAt:string
 try{isoDate(draft.startAt);if(draft.startAt<currentDate)return '草稿里的开工日已经过去，请先重新选择日期。';completeAt=addDays(draft.startAt,job.durationDays)}catch{return '请先选择有效的开工日期，再核对这次投入与预计完成日。'}
 const label=action==='marketing'?'本次推广':action==='rework'?'本次校正或返工':action==='price'?'本次额外报价谈判':action==='scope'?'本次缩小范围谈判':'本次制作'
 const boundary=action==='marketing'?'预计不等于实际完成；推广完成后才看询价，询价不是订单或收入。':action==='rework'?'素材校正与客户包含修改轮次分开计算。预计不等于实际完成；做完还须人工核对，验收与到账另记。':action==='price'||action==='scope'?'预计不等于实际完成；谈判可能失败，交付期限与已有费用继续。':'预计不等于实际完成；做完仍须人工核对，商单的客户验收、应收与实收分别发生。'
 return `${label}直接成本${moneyText(job.costFen)} · ${job.actionPoints}点 · ${job.durationDays}日，预计${completeAt}完成。${draft.materialId==='licensed'&&(action==='commission'||action==='sample')?'已含本单授权素材费用。':''}${boundary}`
}

/** A display gate supplements the original preview; it never grants a resource or permission. */
export function videoSceneBookmarkLock(p:GamePanelProps,blockedReason?:string|null):string|null{
 if(blockedReason)return blockedReason
 const committed=p.controller.snapshot.view
 if(committed&&(committed.runId!==p.view.runId||committed.revision!==p.view.revision))return '记录已更新，请重新核对这份草稿后再决定。'
 if(p.view.busy||p.controller.snapshot.busy)return '正在记下这一步，请稍候。'
 if(p.view.hasCandidate||p.view.saveStatus==='conflict')return '原操作尚未保存或存在冲突，请先处理原候选；这份草稿仍保留。'
 return null
}
export function videoSceneSubmissionLock(p:GamePanelProps,blockedReason?:string|null):string|null{
 const bookmarkLock=videoSceneBookmarkLock(p,blockedReason);if(bookmarkLock)return bookmarkLock
 if(p.view.readOnly)return '当前仅可翻阅，不能提交视频安排。'
 if(p.features.workbench.pause!==null||p.features.workbench.progression.requiresDelivery)return '先回应日历里需要处理的事；这份草稿仍保留。'
 return null
}
/** Callers supply the account being inspected; changing it requires an explicit channel choice. */
export function videoSceneContextReason(p:Pick<GamePanelProps,'features'|'accountId'|'view'>,target?:VideoSceneTarget):string|null{
 if(!p.view.accounts.some(account=>account.accountId===p.accountId))return '当前查看账户已不可用，请重新选择账号后继续。'
 if(!target&&p.accountId!=='personal')return '尚未选择视频账号，请先选择内容账号或切回个人账户。'
 const channel=target?p.features.video?.channels.find(c=>c.id===target.channelId):undefined
 return channel&&channel.accountId!==p.accountId?'这份视频与当前查看账户不匹配，请重新选择账号再继续。':null
}

/** Only explicitly filled fields become a payload. All prices, dates and eligibility still pass original preview. */
export function videoDraftCommand(p:GamePanelProps,draft:VideoSceneDraft,action:VideoChoiceAction,target?:VideoSceneTarget):VideoChoiceCommand|null{
 const v=p.features.video;if(!v)return null
 if(videoSceneContextReason(p,target))return null
 if(target&&videoSceneProgress(v,p.view.date,target)?.invalidReason)return null
 const command=(kind:string,payload:Record<string,unknown>):VideoChoiceCommand=>({kind,payload,label:actions[action],confirm:true})
 if(action==='channel')return draft.name.trim()&&draft.name.trim().length<=60&&segments.some(([id])=>id===draft.segment)?command('OpenVideoChannel',{name:draft.name.trim(),segment:draft.segment}):null
 const channel=v.channels.find(c=>c.id===draft.channelId);if(!channel)return null
 const work=target?.workId?v.works.find(w=>w.id===target.workId&&w.channelId===channel.id):target?.contractId?v.works.find(w=>w.contractId===target.contractId&&w.channelId===channel.id):undefined
 const contract=target?.contractId?v.contracts.find(c=>c.id===target.contractId&&c.channelId===channel.id&&c.workId===work?.id):work?.contractId?v.contracts.find(c=>c.id===work.contractId&&c.workId===work.id):undefined
 if(target&&(target.channelId!==channel.id||target.workId&&!work||target.contractId&&!contract||target.workId&&contract&&contract.workId!==target.workId))return null
 if(action==='publish')return work&&['none','ads','affiliate'].includes(draft.monetization)?command('PublishVideo',{workId:work.id,monetization:draft.monetization,label:draft.label}):null
 try{isoDate(draft.startAt)}catch{return null}
 if(draft.startAt<p.view.date||!v.resources.some(r=>r.id===draft.resource))return null
 const assignment={resources:[draft.resource],startAt:draft.startAt}
 if(action==='marketing')return command('StartVideoMarketing',{channelId:channel.id,...assignment})
 if(action==='rework')return work?command('ReworkVideo',{workId:work.id,...assignment}):null
 if(action==='price'||action==='scope')return contract?command('NegotiateVideoCommission',{contractId:contract.id,proposal:action,...assignment}):null
 if(!v.modes.some(m=>m.id===draft.modeId)||!['original','licensed'].includes(draft.materialId))return null
 const production={channelId:channel.id,modeId:draft.modeId,materialId:draft.materialId,...assignment}
 if(action==='sample')return ['hotspot','original_series','commercial'].includes(draft.productId)?command('StartVideoWork',{...production,productId:draft.productId}):null
 const lead=channel.leads.find(l=>l.personId===draft.clientId&&l.cohortId===draft.cohortId)
 return lead?command('AcceptVideoCommission',{...production,clientId:lead.personId,cohortId:lead.cohortId}):null
}

/** This record has no invented footage, client dialogue or hidden revision forecast. */
export function VideoSceneRecord({p,target}:{p:GamePanelProps;target:VideoSceneTarget}){
 const v=p.features.video,progress=videoSceneProgress(v,p.view.date,target)
 if(!v||!progress)return <p>还没有找到这份视频记录，请选择账号或作品。</p>
 const channel=v.channels.find(c=>c.id===target.channelId),directWork=target.workId?v.works.find(w=>w.id===target.workId&&w.channelId===target.channelId):undefined
 const contract=v.contracts.find(c=>c.channelId===target.channelId&&(target.contractId?c.id===target.contractId:directWork?.contractId===c.id))
 const work=directWork??v.works.find(w=>w.channelId===target.channelId&&w.id===contract?.workId)
 return <section className="video-record-leaf">
  <p className="video-paper-kicker">{channel?.name??'内容账号'} · {p.view.date}</p>
  <h3>{progress.title}</h3><p>{progress.line}</p><p className="video-paper-terms">{progress.choice.line}</p>
  {work?<p>作品第{work.version}版 · {v.modes.find(m=>m.id===work.modeId)?.label??'制作方式待核对'} · {work.materialId==='licensed'?'本单授权素材':'自行制作并保留来源'}。{work.reviewedVersion===work.version?'当前版本已人工核对。':'当前版本仍须人工核对。'}</p>:null}
  {contract?<p>这笔客户委托 · 约定报价{moneyText(contract.priceFen)} · 预款{moneyText(contract.prepaymentFen)}。已安排修改{contract.revisions}轮，条款包含{contract.includedRevisions}轮；最迟{contract.dueAt}提交。</p>:null}
  {contract?.status==='delivered'?<p>已实际验收；余款{moneyText(contract.priceFen-contract.prepaymentFen)}仍为应收，约定{contract.paymentAt}到账。验收时预款已释放保护并确认收入；余款到账另记。</p>:null}
  {contract?.status==='settled'?<p className="video-paper-receipt">{contract.settledAt}余款结算已登记；本单约定总价{moneyText(contract.priceFen)}，结算费率{contract.feeBps/100}%。{contract.paidCase?'客户付款与本单费用依据齐全，已形成已付案例。':'费用或欠款仍须核对，尚未形成已付案例。'}</p>:null}
  {contract?.status==='cancelled'?<p className="video-paper-warning">本单已经退出。已耗制作、退款责任与口碑变化仍保留；退出不会增加回款或案例。</p>:null}
  {contract?.negotiationOutcome?<p role="status">{contract.negotiationOutcome==='accepted'?'客户已接受这次条款调整，请按当前报价与版本核对下一步提交。':contract.negotiationOutcome==='rejected'?'客户没有接受条款调整，原条件保留；仍可核对有成本的返工或有限退出。':'本次谈判已中断，约定条件、已耗行动与交付责任仍保留。'}</p>:null}
  {progress.invalidReason?<p role="status" className="video-paper-warning">{progress.invalidReason}</p>:null}
 </section>
}

/** One persistent choice sheet; changing a page never requests a command. */
export function VideoSceneChoice({p,target,onTargetChange,blockedReason=null,onInspect,children}:Props){
 const propKey=JSON.stringify([p.view.runId,target??null]),[localTarget,setLocalTarget]=useState<{source:string;value:VideoSceneTarget}|null>(null)
 const currentTarget=localTarget?.source===propKey?localTarget.value:target
 const scope=videoSceneDraftKey(p.view.runId,p.accountId,currentTarget)
 const readDraft=(selected:VideoSceneTarget|undefined,accountId=p.accountId)=>p.videoDraftMemory?.read(p.view.runId,accountId,selected)??emptyDraft(selected?.channelId)
 const [stored,setStored]=useState(()=>({scope,draft:readDraft(currentTarget)})),draft=stored.scope===scope?stored.draft:readDraft(currentTarget)
 const edit=(patch:Partial<VideoSceneDraft>)=>{const next={...draft,...patch};p.videoDraftMemory?.write(p.view.runId,p.accountId,currentTarget,next);setStored({scope,draft:next})}
 const [open,setOpen]=useState(false),[page,setPage]=useState<Page>('channel'),[action,setAction]=useState<VideoChoiceAction>('marketing'),[recordPick,setRecordPick]=useState<VideoSceneTarget|null>(null)
  const [channelPick,setChannelPick]=useState<string|null>(null)
 const openedRevision=useRef(p.view.revision),name=useId(),v=p.features.video
 const progress=currentTarget?videoSceneProgress(v,p.view.date,currentTarget):null
 const channel=v?.channels.find(c=>c.id===draft.channelId),directWork=currentTarget?.workId?v?.works.find(w=>w.id===currentTarget.workId&&w.channelId===currentTarget.channelId):undefined
  const pickedChannel=v?.channels.find(c=>c.id===(channelPick??draft.channelId))
 const contract=v?.contracts.find(c=>c.channelId===currentTarget?.channelId&&(currentTarget?.contractId?c.id===currentTarget.contractId:directWork?.contractId===c.id))
 const work=directWork??v?.works.find(w=>w.channelId===currentTarget?.channelId&&w.id===contract?.workId)
 const contextReason=videoSceneContextReason(p,currentTarget)
 const lock=videoSceneSubmissionLock(p,blockedReason)??contextReason??progress?.invalidReason??null
 const bookmarkLocked=videoSceneBookmarkLock(p,blockedReason)!==null
 useEffect(()=>{if(blockedReason||p.view.hasCandidate||p.view.saveStatus==='conflict'||open&&p.view.revision!==openedRevision.current&&p.view.saveStatus==='saved')setOpen(false)},[blockedReason,p.view.hasCandidate,p.view.saveStatus,p.view.revision,open])
 const chooseTarget=(chosen:VideoSceneTarget,keepDraft=false)=>{if(videoSceneBookmarkLock(p,blockedReason))return false;const owner=v?.channels.find(channel=>channel.id===chosen.channelId)?.accountId??p.accountId,next=keepDraft&&chosen.channelId===draft.channelId?{...draft}:readDraft(chosen,owner);p.videoDraftMemory?.write(p.view.runId,owner,chosen,next);setStored({scope:videoSceneDraftKey(p.view.runId,owner,chosen),draft:next});setLocalTarget({source:propKey,value:chosen});onTargetChange?.(chosen);return true}
 const activate=(intent?:VideoChoiceAction)=>{
  if(blockedReason)return
   setChannelPick(null)
  openedRevision.current=p.view.revision
  if(contextReason||progress?.invalidReason){setPage('channel');setOpen(true);return}
  if(channel&&(intent==='marketing'||intent==='sample')&&!chooseTarget({channelId:channel.id,section:'making'},true))return
  if(intent){setAction(intent);setPage(intent==='channel'?'create':!channel?'channel':intent==='commission'?'clients':intent==='sample'?'product':intent==='publish'?'publish':intent==='rework'||intent==='price'||intent==='scope'||intent==='marketing'?'schedule':'purpose')}
  else setPage(progress?.invalidReason||!channel?'channel':currentTarget?.workId||currentTarget?.contractId||currentTarget?.marketingId||currentTarget?.section==='publications'?'record':'purpose')
  setOpen(true)
 }
 const inspect=()=>{setOpen(false);onInspect?.(currentTarget)}
 const request:GamePanelProps['request']=(kind,payload,label,confirm)=>{if(videoSceneSubmissionLock(p,blockedReason)||videoSceneContextReason(p,currentTarget)||progress?.invalidReason)return;setOpen(false);p.request(kind,payload,label,confirm)}
 const submit=(command:VideoChoiceCommand)=>lock?<button type="button" disabled>{command.label}</button>:<CommandButton {...p} request={request} {...command} reasonText={videoSceneReasonText} primary/>
 const selectAction=(next:VideoChoiceAction,nextPage:Page)=>{if(channel&&(next==='sample'||next==='marketing')&&!chooseTarget({channelId:channel.id,section:'making'},true))return;setAction(next);setPage(nextPage)}
 const next=()=>{if(page==='clients'&&channel&&!chooseTarget({channelId:channel.id,section:'leads'},true))return;setPage(page==='product'||page==='clients'?'mode':page==='mode'?'material':'schedule')}
 const validClient=channel?.leads.some(l=>l.personId===draft.clientId&&l.cohortId===draft.cohortId)
 const command=videoDraftCommand(p,draft,action,currentTarget)
 const negotiationJob=contract?.status==='negotiating'?p.view.operations?.jobs.find(j=>j.id===contract.negotiationJobId):undefined
 const wait=progress?.wait??(negotiationJob&&['planned','running'].includes(negotiationJob.status)?{date:negotiationJob.completeAt,label:'等这次谈判的回信'}:undefined)
 const safeWait=wait&&p.features.workbench.pause===null&&!p.features.workbench.progression.requiresDelivery?playableAdvanceDate(p.features.workbench,p.view.date,wait.date):null
 const records:VideoSceneTarget[]=channel?[...v!.contracts.filter(c=>c.channelId===channel.id).map(c=>({channelId:channel.id,workId:c.workId,contractId:c.id})),...v!.works.filter(w=>w.channelId===channel.id&&w.contractId===null).map(w=>({channelId:channel.id,workId:w.id})),...v!.marketing.filter(m=>m.channelId===channel.id).map(m=>({channelId:channel.id,marketingId:m.id}))]:[]
 const title=page==='create'?'这次，想为谁制作？':page==='channel'?'先选择一个内容账号':page==='clients'?'这次，回应哪一份询价？':page==='product'?'想先做怎样一份作品？':page==='mode'?'用什么方式认真完成？':page==='material'?'这次素材，从哪里来？':page==='schedule'?'给这一份，留出真正的日子':page==='response'?'先看清修改，再决定怎么回应':page==='publish'?'这份作品，怎样让人看见？':page==='objects'?'翻回具体的那一份记录':page==='record'?'这份作品与约定':'这次，想把哪件事做起来？'
 let primary:ReactNode=null
 if(page==='create')primary=command&&action==='channel'?submit(command):<button type="button" disabled>先填写名称与选择受众</button>
  else if(page==='channel')primary=<button type="button" className="primary" disabled={!pickedChannel||bookmarkLocked} onClick={()=>{if(!pickedChannel||!chooseTarget({channelId:pickedChannel.id}))return;setChannelPick(null);setPage('purpose')}}>明确选择这个账号</button>
 else if(page==='objects')primary=<button type="button" className="primary" disabled={!recordPick||bookmarkLocked} onClick={()=>{if(!recordPick||!chooseTarget(recordPick))return;setPage('record')}}>翻看这一份记录</button>
 else if(page==='product'||page==='clients'||page==='mode'||page==='material')primary=<button type="button" className="primary" disabled={page==='product'?!draft.productId:page==='clients'?!validClient:page==='mode'?!draft.modeId:!draft.materialId} onClick={next}>继续核对{page==='product'||page==='clients'?'制作方式':page==='mode'?'素材来源':'资源与日历'} →</button>
 else if(page==='schedule'||page==='publish')primary=command?submit(command):<button type="button" disabled>先明确选择本页条件</button>
 else if(page==='record'&&!lock&&progress?.command)primary=submit({...progress.command,label:progress.choice.label})
 else if(page==='record'&&!lock&&safeWait&&wait)primary=<ClockAdvance p={{...p,request}} date={safeWait} label={(safeWait===wait.date?wait.label:'先到日历上的下一处反馈')+' · '+safeWait}/>
 const footer=<div className="video-choice-footer">
  {primary}
  {(page==='record'||page==='response')&&contract&&!['delivered','settled','cancelled'].includes(contract.status)?submit({kind:'ExitVideoCommission',payload:{contractId:contract.id},label:'核对退出这笔商单与退款',confirm:true}):null}
  {page==='record'&&work&&!contract&&!work.abandonedAt&&!v?.publications.some(pub=>pub.workId===work.id)?submit({kind:'AbandonVideoWork',payload:{workId:work.id},label:'核对放弃样片，保留已耗成本',confirm:true}):null}
  {page==='schedule'?<button type="button" onClick={()=>setPage(action==='sample'||action==='commission'?'material':action==='price'||action==='scope'?'response':'purpose')}>返回调整</button>:page!=='purpose'&&page!=='record'&&page!=='channel'?<button type="button" onClick={()=>setPage(page==='create'?'channel':'purpose')}>返回选择</button>:<button type="button" onClick={()=>setOpen(false)}>先合上，保留草稿</button>}
  {onInspect?<button type="button" className="video-record-link" onClick={inspect}>翻看作品与客户的完整记录 ↗</button>:null}
 </div>
 return <>{children?children(activate):<button type="button" className="video-scene-open" onClick={()=>activate()}>翻开视频制作与客户约定 ↗</button>}{open?<Dialog title={title} className="opening-paper video-choice-paper" onClose={()=>setOpen(false)} footer={footer}>
  <p className="video-paper-kicker">{p.view.date} · {channel?.name??'尚未选择账号'}</p>
  <p className="video-paper-hint">填写、翻页和合上都不接单；投入仍需最后确认。</p>
  {(action==='commission'||action==='sample')&&['mode','material','schedule'].includes(page)?<p className="video-paper-kicker">{action==='commission'?(validClient?'待确认 · 客户询价 '+((channel?.leads.findIndex(lead=>lead.personId===draft.clientId&&lead.cohortId===draft.cohortId)??-1)+1):'请重新选择询价客户'):'待确认样片 · '+(v?.catalog.products.find(product=>product.id===draft.productId)?.label??'尚未选择方向')}{draft.modeId?' · '+(v?.modes.find(mode=>mode.id===draft.modeId)?.label??'制作方式待核对'):''}{draft.materialId?' · '+(draft.materialId==='licensed'?'本单授权素材':'自行制作并保留来源'):''}</p>:null}
  {lock?<p role="status" className="video-paper-warning">{lock}</p>:null}
  {contextReason&&contextReason!==lock?<p className="video-paper-warning">{contextReason}</p>:null}
   {page==='channel'?<><fieldset className="video-paper-choices"><legend>明确选择要查看和安排的账号</legend>{v?.channels.map(c=><label key={c.id}><input type="radio" name={name+'channel'} checked={(channelPick??draft.channelId)===c.id} onChange={()=>setChannelPick(c.id)}/><span><strong>{c.name}</strong><small>{segments.find(([id])=>id===c.segment)?.[1]} · {c.accountId==='personal'?'个人账户':p.features.workbench.routes.find(route=>route.accountId===c.accountId)?.name??'经营账户'} · {lifecycleText[c.lifecycle]??'状态待核对'} · {c.leads.length}名当前合格询价</small></span></label>)}</fieldset>{!v?.channels.length?<p>还没有内容账号。先起个名字、选择受众，再安排作品或了解需求。</p>:null}<button type="button" className="video-paper-direction" onClick={()=>selectAction('channel','create')}>另起一个内容账号 →</button></>:null}
  {page==='create'?<><label className="field">想给账号起什么名字<input value={draft.name} maxLength={60} onChange={e=>edit({name:e.target.value})}/></label><fieldset className="video-paper-choices"><legend>这次想为谁制作</legend>{segments.map(([id,label])=><label key={id}><input type="radio" name={name+'segment'} checked={draft.segment===id} onChange={()=>edit({segment:id})}/><span>{label}</span></label>)}</fieldset><p>个人经营沿用原账户。首次启用需至少¥500可花资金，这不是额外开户费。继续前会核对你的资金与资格。</p></>:null}
  {page==='purpose'?<><h3>{channel?.name??'先明确选择账号'}</h3><p>询价来自已经完成的推广或作品反馈。选择新尝试后，眼前先放这份准备；已有作品仍在记录里，真正开工还须最后确认。</p><div className="video-paper-directions"><button type="button" disabled={!channel} onClick={()=>selectAction('marketing','schedule')}>先认识这批受众<small>推广¥600 · 1点 · 7日；完成后才看实际询价。</small></button><button type="button" disabled={!channel} onClick={()=>selectAction('sample','product')}>先认真做一份样片<small>选择作品方向、制作方式与真实投入。</small></button><button type="button" disabled={!channel?.leads.length} onClick={()=>selectAction('commission','clients')}>回应已有的合格询价<small>当前{channel?.leads.length??0}名；接谁的委托、由谁制作、哪天开工，都由你决定。</small></button></div><button type="button" className="video-paper-direction" onClick={()=>{setRecordPick(null);setPage('objects')}}>翻回这个账号已经留下的作品与推广 →</button><button type="button" className="video-paper-direction" onClick={()=>setPage('channel')}>重新选择账号 →</button></>:null}
  {page==='objects'?<fieldset className="video-paper-choices"><legend>翻看已有作品与推广，不新增安排</legend>{records.map((r,i)=><label key={JSON.stringify(r)}><input type="radio" name={name+'record'} checked={JSON.stringify(recordPick)===JSON.stringify(r)} onChange={()=>setRecordPick(r)}/><span>{r.contractId?'商单及关联作品':r.marketingId?'受众推广':'样片'} {i+1}<small>{r.contractId?'接单日 '+(v?.contracts.find(contract=>contract.id===r.contractId)?.acceptedAt??'待核对'):r.marketingId?'安排日 '+(v?.marketing.find(marketing=>marketing.id===r.marketingId)?.job?.startAt??'待核对'):'开工日 '+(v?.works.find(work=>work.id===r.workId)?.production?.startAt??'待核对')}</small></span></label>)}{!records.length?<p>这个账号还没有作品或推广记录，可以返回选择第一次尝试。</p>:null}</fieldset>:null}
  {page==='clients'?<><p>约定报价{moneyText(v?.catalog.commercial.priceFen??0)}；预款{moneyText(v?.catalog.commercial.prepaymentFen??0)}受保护，当期收入仍为¥0。条款包含{v?.catalog.commercial.includedRevisions}轮修改，验收与实收分别发生。</p><fieldset className="video-paper-choices"><legend>这次回应哪份询价</legend>{channel?.leads.map((lead,index)=><label key={lead.personId}><input type="radio" name={name+'client'} checked={draft.clientId===lead.personId&&draft.cohortId===lead.cohortId} onChange={()=>edit({clientId:lead.personId,cohortId:lead.cohortId})}/><span>客户询价 {index+1}<small>这份询价来自已有受众；接下后先安排制作，再等待客户反馈。</small></span></label>)}</fieldset>{!channel?.leads.length?<p>暂时没有可接的询价，可以先制作样片或了解受众需求。</p>:null}</>:null}
  {page==='product'?<fieldset className="video-paper-choices"><legend>这一份样片的方向</legend>{[['hotspot','热点样片','较少制作投入，偏向曝光。'],['original_series','原创系列','较长制作，积累定向受众与原创作品。'],['commercial','商家样片','先做一份给商家看的样片；有询价后再决定接单。']].map(([id,label,line])=><label key={id}><input type="radio" name={name+'product'} checked={draft.productId===id} onChange={()=>edit({productId:id!})}/><span><strong>{label}</strong><small>{line}</small></span></label>)}</fieldset>:null}
  {page==='mode'?<fieldset className="video-paper-choices"><legend>选择制作方式，核对开放日期与所需权限</legend>{v?.modes.map(mode=><label key={mode.id}><input type="radio" name={name+'mode'} checked={draft.modeId===mode.id} onChange={()=>edit({modeId:mode.id})}/><span><strong>{mode.label}</strong><small>{mode.from}起；{videoModeCaption(mode.reasonCodes)}</small></span></label>)}</fieldset>:null}
  {page==='material'?<fieldset className="video-paper-choices"><legend>明确本次素材与权利来源</legend><label><input type="radio" name={name+'material'} checked={draft.materialId==='original'} onChange={()=>edit({materialId:'original'})}/><span>自行制作并保留来源<small>完成后仍须人工核对本版素材、权利与使用说明。</small></span></label><label><input type="radio" name={name+'material'} checked={draft.materialId==='licensed'} onChange={()=>edit({materialId:'licensed'})}/><span>购买本单授权素材<small>额外¥300；不赠与其他作品或未来用途授权。</small></span></label></fieldset>:null}
  {page==='schedule'?<>
   <p className="video-paper-terms">{videoScheduleCaption(draft,action,p.view.date)}</p>
   <div className="video-schedule-fields">
    <div className="video-resource-field">
     <label className="field">由谁留出实际制作时间<select value={draft.resource} onChange={e=>edit({resource:e.target.value})}><option value="">请明确选择本人或已有员工</option>{v?.resources.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}</select></label>
     {draft.resource&&!v?.resources.some(r=>r.id===draft.resource)?<p className="video-paper-warning">之前选的制作资源已不可用，请重新选择谁来制作。</p>:null}
    </div>
    <div className="video-date-field">
     <label className="field">这次从哪天开始<input type="date" min={p.view.date} max={p.view.phase==='epilogue'?p.view.date:playableThrough} value={draft.startAt} onChange={e=>edit({startAt:e.target.value})}/></label>
     <button type="button" className="video-paper-direction" onClick={()=>edit({startAt:p.view.date})}>明确从今天 {p.view.date} 开始</button>
     {draft.startAt&&draft.startAt<p.view.date?<p className="video-paper-warning">草稿里的开工日已经过去，请重新选择日期。</p>:null}
    </div>
   </div>
   <p className="video-schedule-account">{channel?.accountId==='personal'?'个人账户':p.features.workbench.routes.find(route=>route.accountId===channel?.accountId)?.name??'经营账户'}承担这次费用；继续前核对资源冲突、共享四点、资格与完成日期。</p>
  </>:null}
  {page==='publish'?<><fieldset className="video-paper-choices"><legend>明确本次发布方式</legend>{[['none','积累受众'],['ads','平台分成（需本次已有资格）'],['affiliate','带货（需本次已有资格）']].map(([id,label])=><label key={id}><input type="radio" name={name+'publish'} checked={draft.monetization===id} onChange={()=>edit({monetization:id!})}/><span>{label}</span></label>)}</fieldset><label className="video-paper-check"><input type="checkbox" checked={draft.label} onChange={e=>edit({label:e.target.checked})}/>为AI生成内容附合成标识；2025-09-01起按要求核对。</label><p>发布7日后才统计实际反馈。播放、询价、收入资格、应收和实际到账分别记录；发布不提前加钱。</p></>:null}
  {page==='record'&&currentTarget?<><VideoSceneRecord p={p} target={currentTarget}/><div className="video-paper-directions">
   {(work?.defectKnown===true&&work.corrections.length===0||contract?.status==='revision')?<button type="button" onClick={()=>selectAction('rework','schedule')}>安排有代价的校正或返工<small>¥300 · 1点 · 7日，再核对新的版本。</small></button>:null}
   {contract?.status==='revision'?<button type="button" onClick={()=>setPage('response')}>先核对范围、报价与退出<small>先看清可谈的条件，再决定是否投入时间。</small></button>:null}
   {work&&!contract&&work.reviewedVersion===work.version&&!work.abandonedAt&&!v?.publications.some(pub=>pub.workId===work.id)?<button type="button" onClick={()=>selectAction('publish','publish')}>决定这份已核对作品的发布方式</button>:null}
   <button type="button" onClick={()=>setPage('purpose')}>先做别的安排，这份记录保留</button>
  </div></>:null}
  {page==='response'&&contract?<><p>客户提出了修改。按条款可谈判一次；对方可能拒绝，已有费用、交付期限与退款责任仍保留。</p><div className="video-paper-directions"><button type="button" disabled={contract.revisions<contract.includedRevisions||contract.negotiated} onClick={()=>selectAction('price','schedule')}>谈额外¥300报价<small>1点 · 3日 · 继续前核对时间与资格。</small></button><button type="button" disabled={contract.revisions<contract.includedRevisions||contract.negotiated} onClick={()=>selectAction('scope','schedule')}>谈缩小范围<small>1点 · 3日 · 不保证接受。</small></button></div></>:null}
 </Dialog>:null}</>
}
