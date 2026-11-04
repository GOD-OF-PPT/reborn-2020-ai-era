import {expect,it} from 'vitest'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,projectRun} from '../core/commands.ts'
import type {GameRun} from '../core/run-types.ts'
import {inspectPublicWaitTransition,type PublicFeedback} from '../application/public-feedback.ts'
import type {PublicWaitResult} from '../application/public-wait.ts'
import type {PlayingView,PlayFeatures} from './game-types.ts'
import {preparationStartResult,preparationCompletionReading} from './preparation-feedback.ts'
import {savedSceneResult} from './scene-result.ts'
import {waitFeedbackReading} from './wait-feedback-reading.ts'
import {waitSceneResult} from './wait-scene-result.ts'

// Pure display tests from original in-memory commands. No persistence APIs.
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'preparation-reading',actorId:'player',commandId:'create',seed:'preparation-reading',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
const act=(run:GameRun,kind:string,payload:unknown={})=>{const r=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'prep-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(r.status!=='proposed')throw Error(JSON.stringify(r));return r.nextRun}
const view=(run:GameRun):PlayingView=>({...projectRun(run),features:registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null})
const feature=(v:PlayingView)=>v.features as unknown as PlayFeatures
function prepare(kind:'case'|'research'='case',startAt?:string){
 let run=act(initial,'SkipOffer',{offerId:feature(view(initial)).firstOrder.offerId});run=act(run,'WorkQuarter');run=act(run,'AdvanceTime',{date:'2020-01-22'})
 let event=feature(view(run)).workbench.events.find(e=>e.isBlocking)!
 if(kind==='research'){run=act(run,'ChooseEvent',{instanceId:event.id,choiceId:'defer'});run=act(run,'AdvanceTime',{date:'2020-02-01'});event=feature(view(run)).workbench.events.find(e=>e.isBlocking)!}
 if(startAt){run=act(run,'DeferEventDecision',{instanceId:event.id});run=act(run,'AdvanceTime',{date:startAt})}
 const before=view(run),started=act(run,'ChooseEvent',{instanceId:event.id,choiceId:'prepare'}),after=view(started),job=feature(after).workbench.preparationJobs.find(j=>!feature(before).workbench.preparationJobs.some(old=>old.id===j.id))!
 return {before,after,run:started,job,event}
}
function finish(start:ReturnType<typeof prepare>){
 let run=start.run
 for(let i=0;i<10;i++){
  const before=view(run),f=feature(before)
  if(f.workbench.pause){const e=f.workbench.events.find(e=>e.isBlocking)!,choice=e.choices.find(c=>c.isDefault)!;run=act(run,'ChooseEvent',{instanceId:e.id,choiceId:choice.id});continue}
  run=act(run,'AdvanceTime',{date:start.job.completeAt});const after=view(run)
  if(feature(after).workbench.preparationJobs.find(j=>j.id===start.job.id)?.status!=='completed')continue
  const last=after.receipts.at(-1)!,feedback=inspectPublicWaitTransition(before,after),result:PublicWaitResult={status:'stopped',reasonCodes:[],targetDate:after.date,before,lastBefore:before,lastSaved:after,current:after,steps:[{commandId:last.commandId,date:after.date,revisionBefore:before.revision,revisionAfter:after.revision}],feedback,failed:null}
  return {before,after,result,notice:waitSceneResult(result,after)!,row:feedback.find(row=>row.kind==='job'&&row.sourceId===start.job.id)!}
 }
 throw Error('ORIGINAL_COMPLETION_REQUIRED')
}

it.each(['case','research'] as const)('names the actual %s preparation and exact paid cost/action/date on response',kind=>{
 const p=prepare(kind),text=preparationStartResult('ChooseEvent',p.before,p.after)!
 expect(text).toContain(p.job.title);expect(text).toContain(kind==='case'?'已付¥0':'已付¥100');expect(text).toContain('已用1点');expect(text).toContain('预计'+p.job.completeAt+'完成')
 expect(savedSceneResult('ChooseEvent','原回应',p.before,p.after)).toBe(text)
 expect(p.after.budget.available).toBe(1)
 expect(text).not.toContain('已经完成');expect(text).not.toContain('收入')
})

it.each(['case','research'] as const)('names actual %s material in both brief and full completion reading',kind=>{
 const p=prepare(kind),c=finish(p),original=JSON.stringify(c.result.feedback),name=kind==='case'?'手工练习案例':'客户需求研究材料',text=preparationCompletionReading(c.before,c.after,c.row)!
 expect(text).toContain(name+'已于'+p.job.completeAt+'准备好')
 expect(c.notice.brief).toContain(name);expect(c.notice.text).toContain(name)
 expect(c.notice.text).not.toContain('一份原工作已经有了实际结果');expect(c.notice.text).not.toContain('已经确认的安排按真实日期发生')
 expect(c.notice.text).toContain('日历从'+c.before.date+'走到'+c.after.date)
 expect(JSON.stringify(c.result.feedback)).toBe(original);expect(c.row.label).toBe('一份原工作已经有了实际结果。')
 expect(c.notice.frame.pointsAfter).toBe(1)
})

it('keeps the real same-day expense and completion after an earlier event barrier',()=>{
 const p=prepare('case','2020-01-25'),c=finish(p)
 expect(c.before.date).toBe('2020-02-01');expect(c.after.date).toBe('2020-02-01')
 expect(c.notice.text).toContain('手工练习案例已于2020-02-01准备好')
 expect(c.notice.text).toContain('¥4,000');expect(c.notice.brief).toContain('¥4,000')
 expect(c.notice.frame.accounts.find(a=>a.id==='personal')).toMatchObject({before:3400000,after:3000000})
})

it('keeps mixed responsibilities and richer unknown messages intact',()=>{
 const c=finish(prepare()),extra:PublicFeedback={key:'original-obligation',kind:'responsibility',sourceId:'original-bill',label:'另一笔原款¥500仍待处理。',attention:'pause'},cause=savedSceneResult('AdvanceTime','原等待',c.before,c.after,{includeCash:false}),notice=waitSceneResult({...c.result,feedback:[...c.result.feedback,extra]},c.after)!
 expect(notice.text).toContain('手工练习案例');expect(notice.text).toContain(extra.label);expect(notice.brief).toContain(extra.label)
 const rich={...c.row,label:c.row.label+' 原费用仍待核对。'};expect(preparationCompletionReading(c.before,c.after,rich)).toBeNull();expect(waitFeedbackReading(c.before,c.after,cause,[rich])).toEqual([rich.label])
})

it('does not name a missing, duplicate or changed source or material as completed',()=>{
 const c=finish(prepare()),f=feature(c.after),raw=c.after.world!,job=raw.jobs.find(j=>j.id===c.row.sourceId)!
 expect(preparationCompletionReading({...c.before,runId:'another'},c.after,c.row)).toBeNull()
 expect(preparationCompletionReading(c.before,c.after,{...c.row,key:'job:'+job.id+':"running"'})).toBeNull()
 for(const world of [{...raw,jobs:[...raw.jobs,job]},{...raw,preparations:[]},{...raw,jobs:raw.jobs.map(j=>({...j,actionId:'other-action'}))},{...raw,preparations:raw.preparations.map(p=>({...p,sourceEventId:'other-event'}))}])expect(preparationCompletionReading(c.before,{...c.after,world},c.row)).toBeNull()
 const other={...c.after,features:{...f,workbench:{...f.workbench,preparationJobs:f.workbench.preparationJobs.map(j=>({...j,title:'另一份准备'}))}}}
 expect(preparationCompletionReading(c.before,other,c.row)).toBeNull()
})

it('does not invent a preparation from default/defer, unrelated cash or an unknown event',()=>{
 const p=prepare(),base=act(initial,'SkipOffer',{offerId:feature(view(initial)).firstOrder.offerId}),pending=act(base,'AdvanceTime',{date:'2020-01-22'}),before=view(pending),e=feature(before).workbench.events.find(e=>e.isBlocking)!
 for(const [kind,payload] of [['ChooseEvent',{instanceId:e.id,choiceId:'defer'}],['DeferEventDecision',{instanceId:e.id}]] as const){const next=view(act(pending,kind,payload));expect(preparationStartResult(kind,before,next)).toBeNull()}
 const changed={...p.after,accounts:p.after.accounts.map(a=>({...a,cashFen:a.cashFen-100}))}
 expect(preparationStartResult('ChooseEvent',p.before,changed)).toBeNull()
 const world={...p.after.world!,events:p.after.world!.events.map(e=>({...e,definitionId:'unfamiliar'}))}
 expect(preparationStartResult('ChooseEvent',p.before,{...p.after,world})).toBeNull()
})
