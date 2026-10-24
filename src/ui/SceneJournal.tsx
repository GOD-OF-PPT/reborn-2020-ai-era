import {useState} from 'react'
import type {GamePanelProps,NavigateScene} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import type {LifePerson} from '../core/life-schema.ts'
import {Dialog} from './Dialog.tsx'
import {FirstChapterTrail} from './FirstChapterTrail.tsx'
import {moneyText} from './game-text.ts'
import {screenForRoute} from './Navigation.tsx'
import {videoWorkTarget} from './video-work-target.ts'
import type {VideoSceneTarget} from './video-scene-progress.ts'
import {courseTargetReason,type CourseSceneTarget} from './course-scene-progress.ts'
import {canonicalRelayTarget,type RelaySceneTarget} from './relay-scene-target.ts'
import {relayWorkTarget} from './relay-work-target.ts'

export interface SceneWorkTarget{
 readonly accountId?:string
 readonly personId?:LifePerson
 readonly lifeSelection?:'person'|'rest'|'workspace'
 readonly recordId?:string
 readonly videoTarget?:VideoSceneTarget
 readonly courseTarget?:CourseSceneTarget
 readonly relayTarget?:RelaySceneTarget
}
export interface SceneWork extends SceneWorkTarget{
 readonly id:string
 readonly title:string
 readonly start:string
 readonly end:string
 readonly status:string
 readonly screen:Screen
 readonly cost:string
 readonly relayChoices?:readonly RelaySceneTarget[]
}

/** A shared audit job needs an explicit original period, never the first or newest one. */
export function relayCalendarTargets(p:Pick<GamePanelProps,'view'|'features'>,jobId:string,businessId:string):RelaySceneTarget[]{
 const relay=p.features.relay,operations=p.view.operations
 if(!relay||!operations)return []
 const audits=relay.auditJobs.filter(a=>a.jobId===jobId&&a.businessId===businessId),businesses=relay.businesses.filter(b=>b.id===businessId),stations=relay.stations.filter(s=>s.businessId===businessId)
 if(audits.length!==1||audits[0]!.periodIds.length<2||businesses.length!==1||stations.length!==1)return []
 const business=businesses[0]!,context={runId:p.view.runId,accountId:business.accountId,operations}
 const choices=audits[0]!.periodIds.map(periodId=>canonicalRelayTarget(relay,{kind:'period',runId:p.view.runId,accountId:business.accountId,businessId,stationId:stations[0]!.id,periodId,jobId},context))
 return choices.every((target):target is RelaySceneTarget=>target!==null)?choices:[]
}

/** The original job owns its person, private account and personal-life mode. */
export function lifeWorkTarget(job:Pick<GamePanelProps['features']['life']['jobs'][number],'personId'|'kind'|'accountId'>&{readonly id?:string}):SceneWorkTarget{
 return {accountId:job.accountId,...(job.id?{recordId:job.id}:{}),...(job.personId!==null?{personId:job.personId,lifeSelection:'person' as const}:job.kind==='rest'||job.kind==='workspace'?{lifeSelection:job.kind}:{})}
}
function workTarget(work:SceneWork):SceneWorkTarget{
 return {...(work.accountId?{accountId:work.accountId}:{}),...(work.personId?{personId:work.personId}:{}),...(work.lifeSelection?{lifeSelection:work.lifeSelection}:{}),...(work.recordId?{recordId:work.recordId}:{}),...(work.videoTarget?{videoTarget:work.videoTarget}:{}),...(work.courseTarget?{courseTarget:work.courseTarget}:{}),...(work.relayTarget?{relayTarget:work.relayTarget}:{})}
}

/** A calendar job names its original course record, including an old sample attempt. */
export function courseWorkTarget(p:Pick<GamePanelProps,'view'|'features'>,jobId:string,businessId:string):{accountId:string;courseTarget:CourseSceneTarget;recordId?:string}|null{
 const course=p.features.course,operations=p.view.operations,businesses=course?.businesses.filter(b=>b.id===businessId)??[]
 if(!course||businesses.length!==1||!p.view.accounts.some(a=>a.accountId===businesses[0]!.accountId)||operations?.jobs.filter(j=>j.id===jobId&&j.businessId===businessId).length!==1)return null
 const targets:CourseSceneTarget[]=[]
 for(const o of course.outlines.filter(o=>o.businessId===businessId&&o.jobId===jobId))targets.push({kind:'outline',businessId,outlineId:o.id})
 for(const l of course.licenses.filter(l=>l.businessId===businessId&&l.jobId===jobId))targets.push({kind:'license',businessId,licenseId:l.id})
 for(const c of course.courses.filter(c=>c.businessId===businessId&&c.sampleAttempts.includes(jobId)))targets.push({kind:'course',businessId,courseId:c.id,sampleJobId:jobId})
 for(const a of course.audiences.filter(a=>a.jobId===jobId)){
  const c=course.courses.find(c=>c.id===a.courseId&&c.businessId===businessId)
  if(c)targets.push({kind:'audience',businessId,courseId:c.id,audienceId:a.id})
 }
 for(const co of course.cohorts){
  const c=course.courses.find(c=>c.id===co.courseId&&c.businessId===businessId)
  if(c&&(co.stages.some(stage=>stage.attempts.some(a=>a.jobId===jobId))||co.supportJobs.some(slot=>slot.jobId===jobId)))targets.push({kind:'cohort',businessId,courseId:c.id,cohortId:co.id,jobId})
 }
 const originalJob=operations.jobs.find(j=>j.id===jobId)!,recordCourses=course.courses.filter(c=>c.businessId===businessId&&(c.refreshJobs.some(r=>r.jobId===jobId)&&originalJob.definitionId==='course-refresh-'+c.productId+'-'+c.topicId||course.studies.some(s=>s.businessId===businessId&&s.predecessorId===c.id&&s.jobId===jobId&&originalJob.definitionId==='course-demand-study')))
 for(const c of recordCourses)targets.push({kind:'course',businessId,courseId:c.id})
 const valid=targets.filter(target=>courseTargetReason(course,target,{operations})===null)
 return valid.length===1?{accountId:businesses[0]!.accountId,courseTarget:valid[0]!,...(recordCourses.length?{recordId:jobId}:{})}:null
}

export function sceneWorks(p:Pick<GamePanelProps,'view'|'features'>):SceneWork[]{
 const f=p.features
 return [
  ...(['awaiting_submission','review','delivered'].includes(String(f.firstOrder.status))?[{id:'first-order-feedback',title:'那一份手工小单',start:f.firstOrder.dates.startAt,end:f.firstOrder.status==='awaiting_submission'?f.firstOrder.dates.submitBy:f.firstOrder.dates.earliestReviewAt,status:f.firstOrder.status==='awaiting_submission'?'作品已完成，等待你亲手提交':'已提交，客户复核与实际到账仍要分别发生',screen:'quarter' as Screen,accountId:'personal',...(f.firstOrder.contractId?{recordId:f.firstOrder.contractId}:{}),cost:`实际制作成本${moneyText(f.firstOrder.result.directCostFen)} · 尚未当作已经回款`}]:[]),
  ...f.life.jobs.filter(j=>j.status==='running').map(j=>({id:j.id,title:j.kind==='promise_keep'?'答应过的那件事':f.life.work[j.kind].title,start:j.startAt,end:j.completeAt,status:'进行中，尚未完成',screen:'life' as Screen,cost:`个人已付${moneyText(j.costFen)} · 已耗${j.actionPoints}点`,...lifeWorkTarget(j)})),
  ...(p.view.operations?.jobs??[]).filter(j=>['planned','running'].includes(j.status)).map(j=>{const business=p.view.operations?.businesses.find(b=>b.id===j.businessId),route=f.workbench.routes.find(r=>r.id===business?.route),manual=j.id===f.firstOrder.jobId,video=manual?null:videoWorkTarget(f.video,j.id,j.businessId),course=manual||video?null:courseWorkTarget(p,j.id,j.businessId),relay=manual||video||course?null:relayWorkTarget(f.relay,p.view.runId,j.id,p.view.operations),relayChoices=relay?[]:relayCalendarTargets(p,j.id,j.businessId);return {id:j.id,title:manual?f.firstOrder.title:route?.name??'已确认的经营工作',start:j.startAt,end:j.completeAt,status:j.status==='planned'?'已经安排，等待实际开工':'进行中，完成后仍需核对交付',screen:manual?'quarter' as Screen:video?'video' as Screen:course?'course' as Screen:relay?'relay' as Screen:business?screenForRoute(business.route):'quarter' as Screen,...(manual?{accountId:'personal',recordId:f.firstOrder.contractId??j.id}:video??course??(relay?{accountId:relay.accountId,relayTarget:relay}:business?{accountId:business.accountId}:{})),...(relayChoices.length?{relayChoices}:{}),cost:relayChoices.length?'原复核覆盖'+relayChoices.length+'期；先明确选择原期，原批次不会重新委托。':'原资金预留与费用，仍按原安排发生'}}),
  ...f.workbench.preparationJobs.filter(j=>j.status==='running').map(j=>({id:j.id,title:j.title,start:j.startAt,end:j.completeAt,status:'准备进行中，资格尚待实际结果',screen:'quarter' as Screen,accountId:j.accountId,cost:'开始准备不等于已经取得资格'})),
  ...f.story.jobs.filter(j=>j.status==='running').map(j=>({id:j.id,title:'已确认的合作与核查',start:j.startAt,end:j.completeAt,status:'进行中，仍待实际完成记录',screen:'story' as Screen,accountId:j.accountId,cost:'停止与独立恢复，仍是两件事'})),
 ].sort((a,b)=>a.end.localeCompare(b.end)||a.id.localeCompare(b.id))
}

/** The reel describes committed dates. It never advances the clock or invents completion. */
export function SceneJournal({p,onNavigate,compact=false}:{p:GamePanelProps;onNavigate:NavigateScene;compact?:boolean}){
 const works=sceneWorks(p),[selection,setSelection]=useState(0),[open,setOpen]=useState(false),[pendingRelay,setPendingRelay]=useState<SceneWork|null>(null),index=Math.min(selection,Math.max(0,works.length-1)),work=works[index]
 const inspect=(screen:Screen,target?:SceneWorkTarget)=>{setOpen(false);onNavigate(screen,target)}
 const inspectWork=(work:SceneWork)=>{if(work.relayChoices&&work.relayChoices.length>1){setOpen(false);setPendingRelay(work)}else inspect(work.screen,workTarget(work))}
 const pendingRecord=pendingRelay?.relayChoices?.some(target=>target.runId===p.view.runId)?works.find(record=>record.id===pendingRelay.id&&record.relayChoices?.length):undefined
 return <>{compact?<button type="button" className="scene-journal-object" data-interaction="inspect" onClick={()=>setOpen(true)} aria-label="翻看全部实际行动"><span aria-hidden="true">▤</span><span>随身日历</span><small>{works.length?works.length+'项原安排':'查看原安排'} ↗</small></button>:<aside className="scene-journal" aria-label="实际行动胶片"><div className="journal-label"><span>正在经历 / {works.length?String(index+1).padStart(2,'0')+' · '+String(works.length).padStart(2,'0'):'此刻'}</span><button type="button" onClick={()=>setOpen(true)} aria-label="翻看全部实际行动">翻开日历 ↗</button></div>{work?<><h2>{work.title}</h2><p>{work.status}</p><div className="journal-dates"><time>{work.start}</time><span aria-hidden="true">········ ◇ ········</span><time>{work.end}</time></div><small>{work.cost}</small><div className="journal-controls">{works.length>1?<><button type="button" disabled={index===0} aria-label="上一个实际行动" onClick={()=>setSelection(index-1)}>←</button><button type="button" disabled={index===works.length-1} aria-label="下一个实际行动" onClick={()=>setSelection(index+1)}>→</button></>:null}<button type="button" onClick={()=>inspectWork(work)}>走近这件事 →</button></div></>:<><h2>先给日子，一个方向。</h2><p>此刻没有正在制作或准备的工作。可以留好工作、试一次小单，也可以把时间留给生活。</p><button type="button" className="journal-start" onClick={()=>onNavigate('quarter')}>想想接下来做什么 →</button></>}</aside>}{open?<Dialog title="日历里，实际发生的安排" onClose={()=>setOpen(false)}><FirstChapterTrail p={p} onOpen={()=>inspect('quarter')}/><p>这是已经提交的安排，不会因翻阅自动开工或完成。工资、客户交付和回款仍按各自日期发生。</p>{works.map(j=><section className="journal-record" key={j.id}><h3>{j.title}</h3><p>{j.start}—{j.end} · {j.status}</p><p>{j.cost}</p><button type="button" onClick={()=>inspectWork(j)}>查看原工作与可用选择</button></section>)}{!works.length?<p>尚无正在制作或准备的工作；不替你接受任何安排。</p>:null}<button type="button" onClick={()=>inspect('quarter')}>翻开全部本季安排与旧义务</button></Dialog>:null}{pendingRecord?<Dialog title="这次复核，覆盖了几段原账" onClose={()=>setPendingRelay(null)}><p>{pendingRecord.start}—{pendingRecord.end}是同一份原复核安排。先选择要翻看的原账期，不换批次，也不重新委托。</p>{pendingRecord.relayChoices?.map((target,index)=>{if(target.kind!=='period')return null;const period=p.features.relay?.periods.find(p=>p.id===target.periodId);return <section className="journal-record" key={target.periodId}><h3>原账期{index+1} · {period?.from}—{period?.to}</h3><button type="button" onClick={()=>{setPendingRelay(null);inspect('relay',{accountId:target.accountId,relayTarget:target})}}>查看原账期{index+1}与这次复核</button></section>})}</Dialog>:null}</>
}
