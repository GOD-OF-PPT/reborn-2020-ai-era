import {addDays} from '../core/calendar.ts'
import type {StoryProjection} from '../core/story-projection.ts'

type Incident=StoryProjection['incidents'][number]
export type StoryScenePhase='signal'|'waiting'|'assessment'|'reviewed'|'handling'
export interface StorySceneProgress{
 readonly incident:Incident
 readonly title:string
 readonly line:string
 readonly phase:StoryScenePhase
 /** An actual current investigation date, never a newly invented or restarted job. */
 readonly completeAt:string|null
 readonly deadlineWarning:string|null
}
function latestHistoryDate(incident:Incident,date:string):string{
 const dates=[incident.openedAt]
 if(incident.resolvedAt!==null&&incident.resolvedAt<=date)dates.push(incident.resolvedAt)
 const job=incident.jobs.investigate
 if(job?.status==='completed'&&job.completeAt<=date)dates.push(job.completeAt)
 return dates.sort().at(-1)!
}
function selectIncident(story:StoryProjection,date:string,preferredId:string|null|undefined,pauseSourceId:string|null|undefined):Incident|null{
 const preferred=preferredId?story.incidents.find(incident=>incident.id===preferredId):undefined
 if(preferred)return preferred
 const paused=pauseSourceId?story.incidents.find(incident=>incident.sourceEventId===pauseSourceId||incident.signals.some(signal=>signal.sourceEventId===pauseSourceId)):undefined
 if(paused)return paused
 // A tie preserves the order of the original public records; no input array is sorted.
 const active=story.incidents.filter(incident=>incident.resolvedAt===null&&incident.stage!=='normal')
 if(active.length)return active.reduce((first,next)=>next.deadline<first.deadline?next:first)
 return story.incidents.reduce<Incident|null>((latest,next)=>!latest||latestHistoryDate(next,date)>=latestHistoryDate(latest,date)?next:latest,null)
}
function warning(incident:Incident,date:string,phase:StoryScenePhase,completeAt:string|null):string|null{
 if(phase==='reviewed'||incident.resolvedAt!==null)return null
 if(date>=incident.deadline)return `原默认期限${incident.deadline}已经到来。调查与核对不会顺延它，也不会撤回已经发生的处置；原责任仍在。`
 let expected=completeAt
 if(phase==='signal'){
  const days=incident.taskTerms.investigate?.days
  if(days!==undefined)expected=addDays(date,days)
 }
 if(expected!==null&&expected>=incident.deadline)return `${phase==='signal'?'现在另行安排调查':'这份原调查'}的完成日${expected}不早于原默认期限${incident.deadline}。默认处置可能先发生，调查不会把期限顺延。`
 return null
}

/** Public committed records only. Reading a scene neither starts work nor confirms its result. */
export function storySceneProgress(story:StoryProjection,date:string,preferredId?:string|null,pauseSourceId?:string|null):StorySceneProgress|null{
 const incident=selectIncident(story,date,preferredId,pauseSourceId)
 if(!incident)return null
 const job=incident.jobs.investigate,unreviewed=incident.verdict==='unknown'||incident.stage==='investigating'||incident.resolvedAt===null&&job?.status==='interrupted'
 const newerIndependentSignal=incident.resolvedAt===null&&job?.status==='completed'&&job.completeAt<=date&&incident.signals.some(signal=>signal.source!=='system_report'&&signal.date>job.completeAt&&signal.date<=date)
 let phase:StoryScenePhase,title:string,line:string,completeAt:string|null=null
 if(newerIndependentSignal){
  phase='signal';title='旧报告之后，又有一份记录来了。';line='此前已核对的范围仍然保留。这份较新的独立信号还需另行调查，不能把旧报告当作新的答案。'
 }else if(unreviewed&&job?.status==='running'&&job.startAt<=date){
  phase='waiting';completeAt=job.completeAt;title='这份调查，还需要一些真实的日子。'
  line=`${job.startAt}—${job.completeAt}是原来的调查安排。此刻还没有完成，原费用与责任继续保留。`
 }else if(unreviewed&&job?.status==='completed'&&job.result!==null&&job.completeAt<=date){
  phase='assessment';completeAt=job.completeAt;title='回信到了，先对照独立记录。'
  line=`调查已于${job.completeAt}实际完成。对照这份已揭示的独立记录，再确认本次评估；费用和旧约仍在。`
 }else if(unreviewed){
  phase='signal'
  if(job?.status==='interrupted'){
   title='这份调查，停在了半路。';line=incident.verdict==='unknown'?'已投入的费用和原责任仍在。是否重新安排调查，需要你另行决定；等候不会把中断的工作补完。':'此前已核对的结论保留，这次重新调查已经中断。已投入费用与旧责任仍在，是否重新安排需要另行决定。'
  }else if(incident.verdict!=='unknown'){
   title='新的调查，还没有独立回信。';line='此前已核对的范围仍然保留。这一次的调查尚无完整独立结果，不能把旧评估当作新回信。'
  }else if(incident.stage==='unresolved'){
   title='这份记录，还没有独立答案。';line='暂缓或停止都没有代替独立调查，已经发生的费用与原约定继续保留。'
  }else if(incident.kind==='external_claim'){
   title='这封来信，还不能照单相信。';line='来函中的身份与原合同仍待独立核对。原应收不会因为有人催促，就变成一笔新的付款。'
  }else{
   title='桌上，多了一份待核对的记录。';line=`${incident.openedAt}留下的信号还不是结论。原权限、合同与责任，需要按实际证据逐项核对。`
  }
 }else if(incident.verdict==='normal'||incident.verdict==='ordinary'||incident.verdict==='fraud'||incident.verdict==='legitimate'){
  phase='reviewed'
  if(incident.verdict==='normal'){
   title='这一次，记录没有证实越界。';line='只确认本次已核对的范围。调查费用和旧承诺照原记录保留，不能据此保证未来安全。'
  }else if(incident.verdict==='ordinary'){
   title='这一回，是需要处理的普通故障。';line='本次独立记录确认普通服务或摘要延迟，未证实故意越权。原故障、调查成本和旧交付仍按原记录处理，不担保未来。'
  }else if(incident.verdict==='fraud'){
   title='这封来信，对不上原来的合同。';line='本次来函已独立核实为冒名请求。原真实应收仍在，已支付的费用不因此返还，也没有新增收入。'
  }else{
   title='这次来信的身份，已经对照过了。';line='只核实本次原合同对手。原应收仍按到期日实际收取，确认身份没有新增回款或收入。'
  }
 }else{
  phase='handling'
  if(incident.externalManager){
   title='有人接过了管理，旧约还在。'
   line=incident.resolvedAt!==null?'仅本次受控范围完成原验证。新增经营管理权仍由外部托管，旧责任未清空，范围外网络仍有各自的情况。':'本主体的新增经营管理权已经交给外部托管。旧债与原交付仍在，托管没有自动替代全部独立验证。'
  }else if(incident.resolvedAt!==null){
   title='这一次的范围，有了独立交代。';line='仅本次受控范围已按原证据验证。旧交付、费用与范围外网络继续保留，不能宣布全部风险消失。'
  }else{
   title='看清了这一次越界，还要把边界收回来。';line='独立证据确认本次范围外行为。停止自报不等于外部已撤权，隔离、观察、替代与旧责任仍须按实际记录处理。'
  }
 }
 return {incident,title,line,phase,completeAt,deadlineWarning:warning(incident,date,phase,completeAt)}
}
