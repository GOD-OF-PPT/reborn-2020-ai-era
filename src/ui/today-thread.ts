import type {GamePanelProps} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import {openingFocusFor,playerThread,type OpeningFocus,type PlayerThreadView,type ThreadResultRef} from './player-thread.ts'
import {seasonRecollection,type SeasonRecollectionView} from './season-thread.ts'
import {videoFocusOpen} from './video-player-thread.ts'
import {courseFocusOpen} from './course-player-thread.ts'
import {isCoursePreparationThread} from './course-continuity.ts'
import {playableAdvanceDate} from '../application/playable-advance.ts'

export type TodayThreadInput=Pick<GamePanelProps,'view'|'features'>
export type TodayThreadClassification='entry'|'active'|'carry'|'result'|'history'|'invalid'|'other'
export interface TodayThreadItem{
 readonly focus:OpeningFocus
 readonly classification:'active'|'carry'
 readonly title:string
 readonly line:string
 readonly originQuarter:string|null
 readonly wait?:NonNullable<PlayerThreadView['wait']>
 readonly inspect:PlayerThreadView['inspect']
 readonly sourceRefs:readonly ThreadResultRef[]
}
export interface TodayDirection{readonly id:'work'|'life'|'market'|'video'|'course';readonly label:string;readonly line:string;readonly screen:Screen}
export interface TodayThreadView{
 readonly source:{readonly runId:string;readonly revision:number;readonly date:string;readonly quarter:string}
 readonly primary:{readonly thread:PlayerThreadView;readonly classification:TodayThreadClassification;readonly supported:boolean;readonly originQuarter:string|null;readonly sourceRefs:readonly ThreadResultRef[]}
 readonly title:string
 readonly line:string
 readonly question:string
 readonly ongoing:readonly TodayThreadItem[]
 readonly directions:readonly TodayDirection[]
 readonly remaining:SeasonRecollectionView['remaining']
 readonly wait:NonNullable<PlayerThreadView['wait']>|null
 readonly responsibilityOverrideNeeded:boolean
}

const supported=(thread:PlayerThreadView)=>['free','work','life','market','video'].includes(thread.focus.kind)||isCoursePreparationThread(thread)

/** Actual public arrangements decide whether a result is also still an ongoing commitment. */
function classification(p:TodayThreadInput,thread:PlayerThreadView):TodayThreadClassification{
 if(thread.focusStatus==='invalid')return 'invalid'
 const f=thread.focus,id=f.entityId,w=p.features.workbench
 if(!supported(thread))return 'other'
 if(f.kind==='free'||id===null||thread.focusScope==='entry')return 'entry'
 let open=false
 if(f.kind==='video')open=videoFocusOpen(p,f)
 else if(f.kind==='course')open=courseFocusOpen(p,f)
 else if(f.kind==='work'){
  const period=p.view.operations?.employment.find(row=>row.id===id)
  open=!!period&&period.quarter===w.quarter&&!w.atQuarterEnd&&p.view.date<period.limit&&period.segments.some(segment=>segment.from<=p.view.date&&(segment.to===null||segment.to>p.view.date))
 }else if(f.kind==='life'){
  const job=p.features.life.jobs.find(row=>row.id===id),promise=p.features.life.promises.find(row=>row.id===id)
  if(promise?.status==='offered')return 'entry'
  open=job?.status==='running'||promise?.status==='accepted'
 }else if(f.kind==='market'){
  const m=p.features.market,order=m.orders.find(row=>row.id===id),research=m.researches.find(row=>row.id===id),settlement=m.settlements.find(row=>row.id===id),position=m.positions.find(row=>row.id===id)
  open=!!order&&['planned','pending','partially_filled'].includes(order.status)
   ||research?.status==='running'||!!settlement&&settlement.paidAt===null||!!position&&position.quantity>0
   ||!!order&&m.fills.some(fill=>fill.orderId===order.id&&m.settlements.some(row=>row.accountId===f.accountId&&row.sourceId===fill.id&&row.paidAt===null))
 }
 if(open)return thread.focusQuarter!==null&&thread.focusQuarter<w.quarter?'carry':'active'
 return thread.focusScope==='history'?'history':'result'
}

function ongoing(p:TodayThreadInput):TodayThreadItem[]{
 const base={runId:p.view.runId,accountId:'personal',entityId:null},candidates:OpeningFocus[]=[],items:TodayThreadItem[]=[],seen=new Set<string>()
 for(const period of p.features.workbench.employment)candidates.push({...base,kind:'work',entityId:period.id})
 for(const job of p.features.life.jobs.filter(row=>row.status==='running'&&row.promiseId===null))candidates.push({...base,kind:'life',selection:job.personId??(job.kind==='workspace'?'workspace':'rest'),entityId:job.id})
 for(const promise of p.features.life.promises.filter(row=>row.status==='accepted'))candidates.push({...base,kind:'life',selection:promise.personId,entityId:promise.id})
 for(const order of p.features.market.orders)candidates.push({...base,kind:'market',accountId:order.accountId,entityKind:'order',entityId:order.id})
 for(const settlement of p.features.market.settlements.filter(row=>row.paidAt===null))candidates.push({...base,kind:'market',accountId:settlement.accountId,entityKind:'settlement',entityId:settlement.id})
 for(const position of p.features.market.positions.filter(row=>row.quantity>0))candidates.push({...base,kind:'market',accountId:position.accountId,entityKind:'position',entityId:position.id})
 for(const research of p.features.market.researches.filter(row=>row.status==='running'))candidates.push({...base,kind:'market',entityKind:'research',entityId:research.id})
 const video=p.features.video
 if(video){
  const addVideo=(target:Parameters<typeof openingFocusFor>[2])=>{const candidate=openingFocusFor(p,'video',target);if(candidate)candidates.push(candidate)}
  for(const contract of video.contracts)addVideo({videoTarget:{channelId:contract.channelId,workId:contract.workId,contractId:contract.id}})
  for(const work of video.works.filter(row=>row.contractId===null))addVideo({videoTarget:{channelId:work.channelId,workId:work.id}})
  for(const marketing of video.marketing)addVideo({videoTarget:{channelId:marketing.channelId,marketingId:marketing.id}})
 }
 const course=p.features.course
 if(course){
  const addCourse=(target:NonNullable<Extract<OpeningFocus,{kind:'course'}>['courseTarget']>)=>{const candidate=openingFocusFor(p,'course',{courseTarget:target});if(candidate)candidates.push(candidate)}
  for(const business of course.businesses.filter(b=>b.lifecycle==='preparing'&&!course.outlines.some(o=>o.businessId===b.id&&o.job&&['planned','running'].includes(o.job.status))))addCourse({kind:'studio',businessId:business.id})
  for(const outline of course.outlines.filter(o=>o.job&&['planned','running'].includes(o.job.status)))addCourse({kind:'outline',businessId:outline.businessId,outlineId:outline.id})
  for(const lesson of course.courses.filter(c=>['draft','building'].includes(c.status)))addCourse({kind:'course',businessId:lesson.businessId,courseId:lesson.id,...(lesson.sampleJobId?{sampleJobId:lesson.sampleJobId}:{})})
  for(const license of course.licenses.filter(l=>l.job&&['planned','running'].includes(l.job.status)&&!course.courses.some(c=>['draft','building'].includes(c.status)&&c.businessId===l.businessId&&c.cases.some(ref=>ref.id===l.caseId))))addCourse({kind:'license',businessId:license.businessId,licenseId:license.id})
 }
 for(const focus of candidates){
  const thread=playerThread(p,focus),state=classification(p,thread)
  if(state!=='active'&&state!=='carry')continue
  if(thread.focus.kind==='market'&&thread.focus.entityKind==='settlement'){
   const settlement=p.features.market.settlements.find(row=>row.id===thread.focus.entityId)
   // One sale stays one continuing choice. Its complete settlement remains in remaining/the original book.
   if(settlement?.kind==='sale'&&items.some(item=>item.focus.kind==='market'&&item.focus.entityKind==='order'&&item.focus.accountId===settlement.accountId
    &&p.features.market.fills.some(fill=>fill.id===settlement.sourceId&&fill.orderId===item.focus.entityId)))continue
  }
  const key=JSON.stringify([thread.focus.kind,thread.focus.accountId,thread.focus.entityId])
  if(seen.has(key))continue
  seen.add(key)
  items.push({focus:thread.focus,classification:state,title:thread.title,line:thread.line,originQuarter:thread.focusQuarter,inspect:thread.inspect,sourceRefs:thread.resultRefs.map(ref=>({...ref})),...(thread.wait?{wait:{...thread.wait}}:{})})
 }
 return items
}

function wait(p:TodayThreadInput):TodayThreadView['wait']{
 const w=p.features.workbench
 if(w.pause||w.progression.requiresDelivery||w.atQuarterEnd&&w.progression.nextQuarterDate===null)return null
 const requested=w.atQuarterEnd?w.progression.nextQuarterDate:w.progression.nextDate
 if(!requested)return null
 try{return {date:playableAdvanceDate(w,p.view.date,requested),label:w.atQuarterEnd?'核对旧约定，进入下一季':'让已确认的日子继续'}}catch{return null}
}

const directions:readonly TodayDirection[]=[
 {id:'work',label:'看看今天的工作安排',line:'先核对本季是否已在岗，再决定新的工作；原工资与行动分别保留。',screen:'quarter'},
 {id:'life',label:'给生活留一段日子',line:'休整、住处与原来认识的人，仍由你明确选择时间和投入。',screen:'life'},
 {id:'video',label:'给自己的视频尝试留一段时间',line:'显选账号、作品和客户，原制作与平台结算继续；新的投入仍要确认。',screen:'video'},
 {id:'course',label:'把做过的事，认真准备成一堂课',line:'显选教案、已付案例与样课；资金、权利、工具资格和日期仍须核对，不自动招生。',screen:'course'},
 {id:'market',label:'想想这笔钱的去处',line:'核对公开研究、原委托和持仓，再决定是否承担下一份模拟交易。',screen:'market'},
]

/** A read-only view of today. It neither replaces the primary pin nor executes any direction. */
export function todayThread(p:TodayThreadInput,focus?:OpeningFocus|null,focusQuarter?:string|null):TodayThreadView|null{
 if(p.view.phase!=='playing')return null
 const season=seasonRecollection(p)
 // Missing public chapter context must fall back, never claim that its responsibilities are empty.
 if(!season)return null
 const thread=playerThread(p,focus,focusQuarter),state=classification(p,thread),current=ongoing(p)
 return {
  source:{runId:p.view.runId,revision:p.view.revision,date:p.view.date,quarter:p.features.workbench.quarter},
  primary:{thread,classification:state,supported:supported(thread),originQuarter:thread.focusQuarter,sourceRefs:thread.resultRefs.map(ref=>({...ref}))},
  title:'回到今天，慢慢决定',line:current.length?'已经答应的事仍照原约定继续；今天的去向由你决定。':'旧结果留在原记录。接下来的日子，可以重新选择。',
  question:thread.focus.kind==='video'&&(state==='result'||state==='history')?'接下来是回应已有询价、做另一份作品，还是暂不新增制作？原结果与未完约定都留着。':thread.focus.kind==='course'&&(state==='result'||state==='history')?'这份教学准备留下后，是先看下一步、另备一份教案，还是把日子留给生活？样课与招生、学费仍分别决定。':season.nextQuestion,ongoing:current,directions:directions.map(direction=>({...direction})),remaining:season.remaining,wait:wait(p),responsibilityOverrideNeeded:thread.responsibilityOverrideNeeded,
 }
}
