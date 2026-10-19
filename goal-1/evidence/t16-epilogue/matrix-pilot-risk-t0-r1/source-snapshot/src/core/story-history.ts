import {storyValidationContext,type StoryValidationContext} from './story-validation-context.ts'
import {STORY_CONTENT} from '../content/story.ts'
import {CAMPAIGN_CONTENT} from '../content/campaign.ts'
import {loadStoryCatalog,type StoryState,type StoryJobKind,type StoryJob} from './story-schema.ts'
import {hashValue} from './hash.ts'
import {freezeFact,revealFact} from './facts.ts'
import {requireRule} from './errors.ts'
import {storyId,storyOf} from './story-state.ts'
import {StoryWork,patchStory,storyLog,storyEvent,type StoryModel} from './story-work.ts'
import type {CommandView,CommandContext} from './commands.ts'
import type {RunOperation} from './content-types.ts'
import type {ScheduledEvent} from './timeline.ts'
import type {GameRun} from './run-types.ts'

export const historyKinds=['LinkMemoryPreparation','StartLinzhouWork','ChooseLinzhouPublication','InterruptStoryWork'] as const
const allowed=()=>({allowed:true,reasonCodes:[] as readonly string[],actionPoints:0,upfrontCostFen:0,releasedFen:0})
const historicalWork=(kind:StoryJobKind)=>['pilot','continuity','participation'].includes(kind)
const payloadOf=(r:GameRun['receipts'][number])=>JSON.parse(r.payloadSignature).payload as Record<string,unknown>
function preparation(m:Pick<CommandView,'world'|'story'>,key:string){if(key==='linzhou_pilot'){const j=m.story?.jobs.find(j=>j.id===m.story?.linzhou.pilotJobId&&j.status==='completed');return j?{date:j.completeAt,sourceId:j.id}:null}const p=m.world?.preparations.find(p=>p.bindingId==='player'&&(p.key===key||key==='manual_case'&&p.key==='paid_manual_case'));return p?{date:p.date,sourceId:p.sourceEventId}:null}
function consent(m:Pick<StoryModel,'facts'|'story'>){const f=m.facts.find(f=>f.id===m.story?.linzhou.factId);requireRule(f,'LINZHOU_FACT_MISSING');return BigInt(f.roll)*10000n<BigInt(STORY_CONTENT.linzhou.consentBps)*4294967296n}

/** Local, fictional publication rights are acquired through work and another actor's consent. */
export class StoryHistory {
 readonly catalog=loadStoryCatalog(STORY_CONTENT);readonly hash=hashValue(this.catalog);readonly work:StoryWork
 constructor(work:StoryWork){this.work=work}
 events(){return [storyEvent('linzhou_offer','linzhou',this.catalog.linzhou.offerAt),storyEvent('linzhou_publish','linzhou',this.catalog.linzhou.publishAt)]}
 inspect(m:CommandView,kind:string,p:Record<string,unknown>,date:string){
  const s=storyOf(m),l=s.linzhou
  if(kind==='StartLinzhouWork'||kind==='ChooseLinzhouPublication')requireRule(m.phase==='playing','RUN_NOT_PLAYING')
  if(kind==='LinkMemoryPreparation'){const memory=CAMPAIGN_CONTENT.memories.find(x=>x.id===p.memoryId);requireRule(memory&&memory.preparationKey===p.preparationKey,'MEMORY_PREPARATION_NOT_RELATED');return allowed()}
  if(kind==='ChooseLinzhouPublication'){requireRule(l.opportunityAt!==null&&date<=this.catalog.linzhou.choiceUntil&&l.branch==='pending','LINZHOU_PUBLICATION_WINDOW_CLOSED');if(p.choice==='open')requireRule(l.willingness==='agreed'&&[l.pilotJobId,l.continuityJobId,l.participationJobId].every(id=>s.jobs.some(j=>j.id===id&&j.status==='completed')),'LINZHOU_PUBLICATION_RIGHT_REQUIRED');return allowed()}
  if(kind==='InterruptStoryWork'){const j=s.jobs.find(j=>j.id===p.jobId);requireRule(j?.status==='running'&&m.controlledAccountIds.includes(j.accountId),'STORY_JOB_NOT_RUNNING');return allowed()}
  requireRule(kind==='StartLinzhouWork','UNKNOWN_HISTORY_COMMAND');requireRule(l.opportunityAt!==null&&date>=l.opportunityAt&&date<=this.catalog.linzhou.choiceUntil&&l.branch==='pending','LINZHOU_COOPERATION_NOT_AVAILABLE')
  const k=p.kind as StoryJobKind;requireRule(historicalWork(k),'INVALID_LINZHOU_WORK');const priorId=k==='pilot'?l.pilotJobId:k==='continuity'?l.continuityJobId:l.participationJobId
  requireRule(!s.jobs.some(j=>j.id===priorId&&j.status!=='interrupted'),'LINZHOU_WORK_ALREADY_COMMITTED')
  if(k==='pilot')requireRule(preparation(m,'manual_case'),'LINZHOU_ACTUAL_CASE_REQUIRED')
  if(k==='continuity')requireRule(s.jobs.some(j=>j.id===l.pilotJobId&&j.status==='completed'),'LINZHOU_PILOT_REQUIRED')
  if(k==='participation')requireRule(l.willingness==='unknown'&&s.jobs.some(j=>j.id===l.continuityJobId&&j.status==='completed'),'LINZHOU_CONTINUITY_REQUIRED')
  return this.work.inspect(m,k,'linzhou','personal',String(p.resourceId),date)
 }
 apply(m:StoryModel,kind:string,p:Record<string,unknown>,context:CommandContext):{state:StoryModel;newEvents:ScheduledEvent<RunOperation>[]} {
  const s=storyOf(m),date=context.date
  if(kind==='LinkMemoryPreparation'){
   const same=(x:StoryState['links'][number])=>x.memoryId===p.memoryId&&x.preparationKey===p.preparationKey,existing=s.links.find(same)
   const links=p.linked?(existing?s.links:[...s.links,{id:storyId('link',context.commandId,String(p.memoryId)),memoryId:String(p.memoryId),preparationKey:String(p.preparationKey),createdAt:date,sourceCommandId:context.commandId}]):s.links.filter(x=>!same(x))
   return {state:storyLog(patchStory(m,{links}),storyId('link-log',context.commandId),date,context.commandId,'记忆与准备计划关联已更新；没有自动完成准备或发钱'),newEvents:[]}
  }
  if(kind==='ChooseLinzhouPublication')return {state:storyLog(patchStory(m,{linzhou:{...s.linzhou,publicationChoice:p.choice as 'open'|'closed',choiceAt:date}}),storyId('publication-choice',context.commandId),date,context.commandId,'已明确选择虚构林舟工具的发布参与方式；实际发布仍未发生'),newEvents:[]}
  if(kind==='InterruptStoryWork')return {state:this.work.interrupt(m,String(p.jobId),date),newEvents:[]}
  requireRule(kind==='StartLinzhouWork','UNKNOWN_HISTORY_COMMAND');const result=this.work.start(m,p.kind as StoryJobKind,'linzhou',null,'personal',String(p.resourceId),date,context.commandId),key=p.kind==='pilot'?'pilotJobId':p.kind==='continuity'?'continuityJobId':'participationJobId'
  return {...result,state:patchStory(result.state,{linzhou:{...storyOf(result.state).linzhou,[key]:result.job.id}})}
 }
 finishWork(m:StoryModel,job:StoryJob,date:string):StoryModel{
  if(job.status!=='completed'||!historicalWork(job.kind))return m
  if(job.kind!=='participation')return storyLog(m,storyId('linzhou-work-completed',job.id),date,job.id,job.kind==='pilot'?'真实协作试点已完成，未取得团队治理或发布权':'继续经营支持已实际完成，发布仍需另一方同意')
  const agreed=consent(m),text=agreed?'林舟团队确认同意有限发布参与':'林舟团队拒绝共同发布，已发生成本保留';let next:StoryModel={...m,...revealFact(m,storyOf(m).linzhou.factId!,text)}
  next=patchStory(next,{linzhou:{...storyOf(next).linzhou,willingness:agreed?'agreed':'declined'},jobs:storyOf(next).jobs.map(j=>j.id===job.id?{...j,result:agreed?'agreed':'declined'}:j)});return storyLog(next,storyId('linzhou-consent',job.id),date,job.id,text)
 }
 reduce(m:StoryModel,event:ScheduledEvent<RunOperation>){
  const p=event.payload;requireRule(p.kind==='story_event','INVALID_STORY_EVENT');const s=storyOf(m)
  if(p.type==='linzhou_offer'){
   requireRule(event.instanceId===this.events()[0]!.instanceId&&s.linzhou.opportunityAt===null,'INVALID_LINZHOU_OFFER');const factId=storyId('linzhou-fact'),source=storyId('linzhou-offer')
   const next:StoryModel={...m,...freezeFact(m,{id:factId,domain:'world',sourceEventId:source,date:event.date})}
   return {state:storyLog(patchStory(next,{linzhou:{...s.linzhou,opportunityAt:event.date,factId}}),source,event.date,source,'虚构团队林舟提供早期协作机会；没有接受任何付费承诺')}
  }
  requireRule(p.type==='linzhou_publish'&&event.instanceId===this.events()[1]!.instanceId&&s.linzhou.publishedAt===null,'INVALID_LINZHOU_PUBLICATION');const l=s.linzhou,open=l.publicationChoice==='open'&&l.choiceAt!==null&&l.choiceAt<=this.catalog.linzhou.choiceUntil&&l.willingness==='agreed'&&[l.pilotJobId,l.continuityJobId,l.participationJobId].every(id=>s.jobs.some(j=>j.id===id&&j.status==='completed'&&j.completeAt<event.date)),source=storyId('linzhou-publication')
  const next=patchStory(m,{linzhou:{...l,branch:open?'open':'closed',publishedAt:event.date,publicationSourceId:source}})
  return {state:storyLog(next,source,event.date,source,open?'架空局部分支：林舟实际独立开放协作工具；兼容导出条件与本地竞争改变，其他历史域不重写':'虚构默认路径：林舟工具由封闭经营方收购；保留常规付费与退出方式，没有替玩家投资',[storyId('linzhou-offer')])}
 }
 worldUpdated(m:StoryModel,event:ScheduledEvent<RunOperation>){
  const op=event.payload;if(op.kind!=='world_anchor'||op.anchorId!==this.catalog.sharedAnchor)return {state:m}
  const s=storyOf(m);requireRule(!s.impacts.some(i=>i.anchorId===op.anchorId),'SHARED_HISTORY_ALREADY_APPLIED');const worldCauseId='world:'+hashValue([op.anchorId]).slice(0,32),id=storyId('impact',op.anchorId)
  const readiness=s.links.flatMap(link=>{const p=preparation(m,link.preparationKey);return p&&p.date<event.date?[{id:storyId('ready',link.id,op.anchorId),anchorId:op.anchorId,worldCauseId,memoryId:link.memoryId,preparationKey:link.preparationKey,sourceId:p.sourceId,linkId:link.id,date:event.date}]:[]})
  const next=patchStory(m,{readiness:[...s.readiness,...readiness],impacts:[...s.impacts,{id,anchorId:op.anchorId,worldCauseId,date:event.date,routes:['a_share','ai_course','api_relay'],courseIds:[...new Set(m.course?.updates.filter(u=>u.anchorId===op.anchorId).map(u=>u.courseId)??[])],relayBusinessIds:[...new Set(m.relay?.changes.filter(c=>c.anchorId===op.anchorId).map(c=>c.businessId)??[])]}]})
  return {state:storyLog(next,id,event.date,op.anchorId,'同一真实发布节点已传播：模拟股价暴露、原课程更新和中转供价条件分别处理；已完成准备关联'+readiness.length+'项，未提前发收入',[worldCauseId])}
 }
 validate(run:GameRun,context:StoryValidationContext=storyValidationContext(run)){
  const s=storyOf(run),l=s.linzhou,date=run.timeline.cursor.date;requireRule(s.catalogVersion===this.catalog.version&&s.catalogHash===this.hash,'STORY_CONTENT_MISMATCH')
  const events=context.events
  for(const expected of this.events()){const matching=events.filter(e=>e.instanceId===expected.instanceId);requireRule(matching.length===1,'MISSING_STORY_HISTORY_EVENT');const actual=matching[0]!;requireRule(hashValue(actual.payload)===hashValue(expected.payload)&&actual.phase===expected.phase&&actual.priority===expected.priority&&actual.date===expected.date,'INVALID_STORY_HISTORY_EVENT')}
  const offerDone=events.some(e=>e.instanceId===this.events()[0]!.instanceId&&e.processed),published=events.some(e=>e.instanceId===this.events()[1]!.instanceId&&e.processed)
  requireRule(offerDone===(l.opportunityAt!==null)&&published===(l.publishedAt!==null),'STORY_HISTORY_PROGRESS_MISMATCH')
  if(offerDone){const f=run.facts.find(f=>f.id===l.factId);requireRule(l.opportunityAt===this.catalog.linzhou.offerAt&&l.factId===storyId('linzhou-fact')&&f?.domain==='world'&&f.createdAt===l.opportunityAt&&f.sourceEventId===storyId('linzhou-offer'),'LINZHOU_FACT_SOURCE_MISMATCH')}
  else requireRule(l.factId===null&&l.branch==='pending'&&l.willingness==='unknown'&&[l.pilotJobId,l.continuityJobId,l.participationJobId].every(i=>i===null),'LINZHOU_BEFORE_OPPORTUNITY')
  for(const [kind,id] of [['pilot',l.pilotJobId],['continuity',l.continuityJobId],['participation',l.participationJobId]] as const)if(id!==null)requireRule(s.jobs.some(j=>j.id===id&&j.kind===kind&&j.entityId==='linzhou'),'INVALID_LINZHOU_JOB_REFERENCE')
  for(const j of s.jobs.filter(j=>historicalWork(j.kind))){const r=run.receipts.find(r=>r.commandId===j.originCommandId),p=r?payloadOf(r):null;requireRule(r?.kind==='StartLinzhouWork'&&p?.kind===j.kind&&p.resourceId===j.resourceId&&j.accountId==='personal'&&j.businessId===null&&j.entityId==='linzhou'&&j.startAt>=this.catalog.linzhou.offerAt&&j.startAt<=this.catalog.linzhou.choiceUntil,'LINZHOU_WORK_AUTHORIZATION_MISSING');if(j.kind==='pilot'){const priorCase=preparation(run,'manual_case');requireRule(priorCase&&priorCase.date<=j.startAt,'LINZHOU_ACTUAL_CASE_REQUIRED')}if(j.kind!=='pilot'){const prior=s.jobs.find(o=>o.id===(j.kind==='continuity'?l.pilotJobId:l.continuityJobId));requireRule(prior?.status==='completed'&&prior.completeAt<=j.startAt,'LINZHOU_WORK_PRECONDITION_MISSING')}}
  const participation=s.jobs.find(j=>j.id===l.participationJobId)
  if(participation?.status==='completed'){const expected=consent(run)?'agreed':'declined';requireRule(l.willingness===expected&&participation.result===expected&&run.facts.some(f=>f.id===l.factId&&f.evidence===(expected==='agreed'?'林舟团队确认同意有限发布参与':'林舟团队拒绝共同发布，已发生成本保留')),'LINZHOU_CONSENT_NOT_INDEPENDENT')}
  else requireRule(l.willingness==='unknown','LINZHOU_CONSENT_WITHOUT_WORK')
  if(l.publicationChoice!==null)requireRule(l.choiceAt!==null&&run.receipts.some(r=>r.kind==='ChooseLinzhouPublication'&&r.date===l.choiceAt&&payloadOf(r).choice===l.publicationChoice)&&l.choiceAt<=this.catalog.linzhou.choiceUntil&&(l.publicationChoice!=='open'||l.willingness==='agreed'&&participation?.status==='completed'&&participation.completeAt<=l.choiceAt),'LINZHOU_CHOICE_NOT_AUTHORIZED')
  if(published){const open=l.publicationChoice==='open'&&l.willingness==='agreed';requireRule(l.publishedAt===this.catalog.linzhou.publishAt&&l.publicationSourceId===storyId('linzhou-publication')&&l.branch===(open?'open':'closed'),'LINZHOU_BRANCH_WITHOUT_RIGHTS')}
  else requireRule(l.branch==='pending'&&l.publicationSourceId===null,'LINZHOU_FUTURE_BRANCH_LEAK')
  for(const link of s.links){const memory=CAMPAIGN_CONTENT.memories.find(m=>m.id===link.memoryId),r=run.receipts.find(r=>r.commandId===link.sourceCommandId),p=r?payloadOf(r):null;requireRule(memory?.preparationKey===link.preparationKey&&link.createdAt<=date&&link.id===storyId('link',link.sourceCommandId,link.memoryId)&&r?.kind==='LinkMemoryPreparation'&&r.date===link.createdAt&&p?.memoryId===link.memoryId&&p.preparationKey===link.preparationKey&&p.linked===true,'MEMORY_LINK_SOURCE_MISSING')}
  requireRule(new Set(s.links.map(l=>l.memoryId+':'+l.preparationKey)).size===s.links.length&&new Set(s.impacts.map(i=>i.anchorId)).size===s.impacts.length,'DUPLICATE_STORY_HISTORY_LINK')
  requireRule(s.impacts.length===(run.world?.anchors.some(a=>a.id===this.catalog.sharedAnchor)?1:0),'SHARED_HISTORY_IMPACT_MISSING')
  for(const impact of s.impacts){const anchor=run.world?.anchors.find(a=>a.id===impact.anchorId);requireRule(impact.anchorId===this.catalog.sharedAnchor&&anchor?.causeId===impact.worldCauseId&&impact.date===CAMPAIGN_CONTENT.anchors.find(a=>a.id===impact.anchorId)?.publishedAt&&impact.id===storyId('impact',impact.anchorId)&&hashValue(impact.routes)===hashValue(['a_share','ai_course','api_relay']),'SHARED_HISTORY_SOURCE_MISSING');const courseIds=[...new Set(run.course?.updates.filter(u=>u.anchorId===impact.anchorId).map(u=>u.courseId)??[])].sort(),relayIds=[...new Set(run.relay?.changes.filter(c=>c.anchorId===impact.anchorId).map(c=>c.businessId)??[])].sort();requireRule(hashValue([...impact.courseIds].sort())===hashValue(courseIds)&&hashValue([...impact.relayBusinessIds].sort())===hashValue(relayIds),'SHARED_HISTORY_CONSUMER_MISSING')}
  for(const ready of s.readiness){const impact=s.impacts.find(i=>i.anchorId===ready.anchorId),p=preparation(run,ready.preparationKey),linked=run.receipts.find(r=>r.kind==='LinkMemoryPreparation'&&storyId('link',r.commandId,ready.memoryId)===ready.linkId&&payloadOf(r).linked===true),anchorCause=run.causes.find(c=>c.id===ready.worldCauseId),anchorCommand=run.receipts.find(r=>r.commandId===anchorCause?.commandId);requireRule(impact&&ready.worldCauseId===impact.worldCauseId&&ready.date===impact.date&&ready.id===storyId('ready',ready.linkId,ready.anchorId)&&p?.sourceId===ready.sourceId&&p.date<ready.date&&linked&&anchorCommand&&linked.revisionAfter<anchorCommand.revisionAfter,'PREPARATION_REWARD_WITHOUT_PRIOR_WORK')}
 }
}
