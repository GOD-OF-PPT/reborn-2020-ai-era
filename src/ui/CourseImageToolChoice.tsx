import {useState,type ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import {courseLessonPreparationPage} from './course-lesson-preparation.ts'
import {Dialog} from './Dialog.tsx'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {playableAdvanceDate} from '../application/playable-advance.ts'
import {addDays,isoDate} from '../core/calendar.ts'
import {moneyText,playableThrough} from './game-text.ts'
import {courseResourceLabel} from './course-resource-labels.ts'

type Props={p:GamePanelProps;target:CourseSceneTarget;open:boolean;lock:string|null;request:GamePanelProps['request'];onClose:()=>void;onAccount?:(()=>void)|undefined}
type Draft={key:string;channelId:string;resource:string;startAt:string;sheet:'channels'|'arrange'|'applications'|'record';applicationId:string;page:number;arrangedAtRevision:number}
export function courseImageToolState(p:GamePanelProps,target:CourseSceneTarget,channelId:string,applicationId:string){
 const v=p.features.video,valid=target.kind==='course'&&courseLessonPreparationPage(p,target,'tool'),channels=v?.channels.filter(c=>c.lifecycle==='operating'&&p.view.accounts.some(a=>a.accountId===c.accountId))??[],matched=channels.filter(c=>c.id===channelId),channel=matched.length===1?matched[0]:undefined,applications=channel?v?.applications.filter(a=>a.channelId===channel.id&&a.program==='image_rights')??[]:[],matches=applications.filter(a=>a.id===applicationId),application=matches.length===1?matches[0]:undefined
 return {valid,channels,channel,applications,application}
}
/** This paper only supplies explicit original video commands; it never grants tool access. */
export function CourseImageToolChoice({p,target,open,lock,request,onClose,onAccount}:Props){
 const key=JSON.stringify([p.view.runId,p.accountId,target.businessId,target.kind==='course'?target.courseId:null]),blank:Draft={key,channelId:'',resource:'',startAt:'',sheet:'channels',applicationId:'',page:0,arrangedAtRevision:p.view.revision},[cached,setCached]=useState<Draft>(blank),draft=cached.key===key?cached:blank,edit=(patch:Partial<Draft>)=>setCached({...draft,...patch}),model=courseImageToolState(p,target,draft.channelId,draft.applicationId),v=p.features.video
 const sheet=draft.sheet==='arrange'&&draft.arrangedAtRevision!==p.view.revision&&model.applications.length?'applications':draft.sheet,channel=model.channel,application=model.application,job=application?.job?.definitionId==='video-apply-image_rights'?application.job:undefined,owner=channel?p.view.accounts.find(a=>a.accountId===channel.accountId):undefined,actor={...p,...(channel?{accountId:channel.accountId}:{})}
 let validDate=false;try{isoDate(draft.startAt);validDate=draft.startAt>=p.view.date&&draft.startAt<=playableThrough}catch{/* Keep the explicit invalid date visible. */}
 const validAssignment=validDate&&!!v?.resources.some(r=>r.id===draft.resource),active=job?.status==='planned'||job?.status==='running',wait=active?job.status==='planned'?job.startAt:job.completeAt:null,safe=wait?playableAdvanceDate(p.features.workbench,p.view.date,wait):null,renew=application?addDays(application.appliedAt,90):null,canRenew=renew!==null&&p.view.date>=renew
 const submit=(kind:string,payload:Record<string,unknown>,label:string,confirm=false)=>lock?<button type="button" disabled>{label}</button>:<CommandButton {...actor} request={request} kind={kind} payload={payload} label={label} confirm={confirm} primary/>
 const arrange=()=>edit({sheet:'arrange',applicationId:'',arrangedAtRevision:p.view.revision})
 let primary:ReactNode=null
 if(model.valid&&sheet==='channels')primary=<button type="button" className="primary" disabled={!channel} onClick={()=>edit({sheet:model.applications.length?'applications':'arrange',arrangedAtRevision:p.view.revision,page:0})}>看看这个账号的工具准备 →</button>
 else if(model.valid&&channel&&sheet==='arrange')primary=validAssignment?submit('ApplyVideoProgram',{channelId:channel.id,program:'image_rights',resources:[draft.resource],startAt:draft.startAt},'核对图像工具的实际准备',true):<button type="button" disabled>先选人手和开工日，再决定</button>
 else if(model.valid&&channel&&sheet==='record'&&application&&job){
  if(active&&safe)primary=<ClockAdvance p={actor} date={safe} label={(job?.status==='planned'?'等这份工具准备实际开工':'等这份工具准备的回信')+' · '+safe}/>
  else if(job?.status==='completed'&&!application.resultRead)primary=submit('DecideVideoProgram',{applicationId:application.id},'读这份图像工具回信')
  else if(application.resultRead&&application.approved===true&&application.expiresAt!==null&&p.view.date<application.expiresAt)primary=<button type="button" className="primary" onClick={onClose}>回到这堂课，继续准备样课 →</button>
  else if(application.resultRead&&canRenew)primary=<button type="button" className="primary" onClick={arrange}>重新考虑一份工具准备 →</button>
  else if(application.resultRead&&renew&&renew>p.view.date){const next=playableAdvanceDate(p.features.workbench,p.view.date,renew);if(next)primary=<ClockAdvance p={actor} date={next} label={'等到原来允许重新申请的日子 · '+next}/>}
 }
 const listed=sheet==='channels'?model.channels:model.applications,pages=Math.max(1,Math.ceil(listed.length/2)),page=Math.min(Math.max(0,draft.page),pages-1)
 if(!open)return null
 return <Dialog title="为这一堂课，准备图像工具" layout="direct" className="opening-paper course-choice-paper course-studio-preparation course-lesson-preparation course-image-tool" onClose={onClose} footer={<div className="course-choice-footer">{primary}<button type="button" onClick={onClose}>先回到这堂课</button>{sheet!=='channels'?<button type="button" className="course-record-link" onClick={()=>edit({sheet:'channels',applicationId:'',page:0})}>另选原账号 ↗</button>:null}{onAccount?<button type="button" className="course-record-link" onClick={onAccount}>{model.channels.length?'翻看创作账号 ↗':'明确准备一个创作账号 ↗'}</button>:null}</div>}>
  <p className="course-paper-kicker">{p.view.date} · 课程与案例仍保留{channel?' · '+channel.name:''}</p>{lock?<p className="course-paper-warning" role="status">{lock}</p>:null}
  {!model.valid?<p className="course-paper-warning">先重新核对这堂课、原教室和图像工具主题。没有替换课程或新增申请。</p>:<>
   {sheet==='channels'?<><p>先选由哪个原账号准备图像工具；本次没有安排视频作品。申请、真实等待和阅读回信分别发生。</p><fieldset className="course-paper-choices"><legend>这次用哪个创作账号？</legend>{model.channels.slice(page*2,page*2+2).map(c=><label key={c.id}><input type="radio" name="course-image-channel" checked={c.id===draft.channelId} onChange={()=>edit({channelId:c.id,applicationId:'',page})}/><span>{c.name}<small>{c.accountId==='personal'?'个人账户':'独立经营账户'} · 只选账号，不申请或付费</small></span></label>)}</fieldset>{model.channels.length===0?<p>还没有可用创作账号。可先明确准备一个，再回这堂课继续；不会替你开户。</p>:null}</>:null}
   {sheet!=='channels'&&!channel?<p className="course-paper-warning">原账号已不可匹配，请明确重选；没有换成另一份账号。</p>:null}
   {channel&&sheet==='arrange'?<><p>由{channel.accountId==='personal'?'个人账户':'这个账号的经营账户'}承担，当前可花{moneyText(owner?.availableFen)}。本次图像工具权利与硬件准备¥1,000 · 1点 · 7日；审核可能不通过。</p><div className="course-schedule-fields"><div><label className="field">这次由谁准备图像条件<select value={draft.resource} onChange={e=>edit({resource:e.target.value})}><option value="">请明确选择本人或已有员工</option>{v?.resources.map(r=><option key={r.id} value={r.id}>{r.id==='player-production'?'由我自己准备':courseResourceLabel(r.id,v.resources,p.view.operations?.workers)}</option>)}</select></label></div><div><label className="field">从哪一天开始准备<input type="date" min={p.view.date} max={playableThrough} value={draft.startAt} onChange={e=>edit({startAt:e.target.value})}/></label><button type="button" className="course-paper-direction" onClick={()=>edit({startAt:p.view.date})}>明确从今天 {p.view.date} 开始</button></div></div><p>{validDate?`${draft.startAt}开工 → ${addDays(draft.startAt,7)}预计准备完成。`:'先明确人手和日期，不默认安排。'}实际结果要等回信；条件从原审核完成日起算365日，晚阅读不会顺延。</p>{draft.startAt&&draft.startAt<p.view.date?<p className="course-paper-warning">原日期已经过去，请明确重选。</p>:null}</>:null}
   {channel&&sheet==='applications'?<><p>这些是这个原账号已经安排过的图像工具准备。明确翻开一份，原日期、费用与回信都保留。</p><div className="course-paper-directions">{model.applications.slice(page*2,page*2+2).map(a=><button type="button" key={a.id} onClick={()=>edit({applicationId:a.id,sheet:'record'})}>{a.appliedAt}的图像工具准备<small>{a.job?.status==='completed'?a.resultRead?'原回信已经读过':'实际准备结束 · 回信尚未阅读':a.job?.status==='planned'?'已安排 · 尚未开工':a.job?.status==='running'?'准备中 · 尚待实际回信':'原安排状态仍须核对'}{a.job?' · '+a.job.startAt+'—'+a.job.completeAt:''}</small></button>)}</div><button type="button" className="course-paper-direction" onClick={arrange}>另作一份新的准备，再核对原条件 →</button></>:null}
   {channel&&sheet==='record'&&!application?<p className="course-paper-warning">原申请已不可匹配，请返回明确选择，没有替换成最近一次。</p>:null}
   {channel&&sheet==='record'&&application&&!job?<p className="course-paper-warning">这份原申请的准备来源暂不可核对；没有把它当成完成或获准。请翻阅原账号记录。</p>:null}{channel&&sheet==='record'&&application&&job?<><p>{application.appliedAt}留下的原申请{job?' · '+job.startAt+'—'+job.completeAt:''}。</p>{active?<p>{job?.status==='planned'?'这份准备已安排，尚未实际开工。原直接预算¥1,000与1点按开工日核对。':'这份准备已经开工，原申请直接费用¥1,000和1点已承担；工资、维护另按原账。'}课程仍未制作样课。</p>:job?.status==='completed'&&!application.resultRead?<p>实际准备已经结束，原回信还没读过。先读回信，再看结果；本次阅读不重新付款或延长条件。</p>:application.resultRead?<><p>{application.approved===true?application.expiresAt!==null&&p.view.date<application.expiresAt?`这份图像工具条件已实际获准，有效至${application.expiresAt}。`:`原条件曾经获准，原有效日为${application.expiresAt??'待核对'}；当前不把它当作有效许可。`:'这次原申请未获准，已经付出的直接费用和行动仍保留。'}</p><p>原申请直接费用¥1,000 · 原行动1点；工资与维护另按实际日期记账。{application.approved!==true&&renew?'原规则最早'+renew+'重新申请，仍须新的显选与投入。':''}</p></>:<p>这次准备已经停下或状态需要核对；原成本、日期和记录仍保留，不把它当成完成或获准。</p>}<button type="button" className="course-paper-direction" onClick={()=>edit({sheet:'applications',page:0})}>翻回这个账号的全部原申请 →</button></>:null}
   {(sheet==='channels'||sheet==='applications')&&pages>1?<nav className="course-case-leaves" aria-label="翻选全部原账号或图像工具申请"><button type="button" disabled={page===0} onClick={()=>edit({page:page-1})}>← 前两份</button><span>{page+1}/{pages}</span><button type="button" disabled={page+1>=pages} onClick={()=>edit({page:page+1})}>后两份 →</button></nav>:null}
  </>}
 </Dialog>
}
