import {beforeAll,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignCodec,campaignCourse} from '../application/campaign.ts'
import {projectRun,previewCommand,evaluateCommand} from '../core/commands.ts'
import {projectCourse} from '../core/course-projection.ts'
import type {CommandEnvelope,GameRun} from '../core/run-types.ts'
import type {PlayingView} from './game-types.ts'
import {CourseTeachingDetails,courseCohortFinancials} from './CourseTeachingDetails.tsx'
import {OpeningObject} from './OpeningObject.tsx'
import savedNormal from '../../goal-1/evidence/t17-acceptance-10/chrome-physical-r1/r74-physical-after-candidate-retry.json?raw'

const codec=createCampaignCodec(),normal=codec.import(savedNormal)
const courseOf=(run:GameRun)=>projectCourse(run,campaignCourse)!
function viewOf(run:GameRun):PlayingView{return {...projectRun(run),features:codec.registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}}
function command(run:GameRun,kind:string,payload:unknown):CommandEnvelope{return {runId:run.runId,actorId:'player',commandId:'teaching-details-'+run.revision+'-'+kind,expectedRevision:run.revision,kind,payload}}
function propose(run:GameRun,c:CommandEnvelope){const result=evaluateCommand(run,c,codec.registry,'player');if(result.status!=='proposed')throw Error(JSON.stringify({kind:c.kind,result}));return result.nextRun}
function html(run:GameRun,c:CommandEnvelope,view=viewOf(run)){return renderToStaticMarkup(<CourseTeachingDetails command={c} course={courseOf(run)} view={view} confirm={previewCommand(run,c,codec.registry,'player')} accountName={()=>'本课程企业账户'}/>)}
const originalCourse=courseOf(normal),originalClass=originalCourse.cohorts[0]!,lesson=originalCourse.courses.find(c=>c.id===originalClass.courseId)!
let planned:GameRun,enrolled:GameRun,plan:CommandEnvelope,enroll:CommandEnvelope
beforeAll(()=>{
 // Exact original commands evaluated from an imported normal history. Proposals are not storage/browser completion.
 plan=command(normal,'PlanCourseCohort',{courseId:lesson.id,audienceId:originalClass.audienceId,startAt:'2023-05-01',endAt:'2023-06-01',supportStartAt:'2023-07-01',seatLimit:2,supportMode:'self_small',deploymentId:null,resources:['player-production'],promise:'clear_scope'})
 expect(previewCommand(normal,plan,codec.registry,'player').allowed).toBe(true);planned=propose(normal,plan)
 const co=courseOf(planned).cohorts.find(c=>!originalCourse.cohorts.some(old=>old.id===c.id))!
 expect(co.availablePeople.length).toBeGreaterThanOrEqual(2)
 enroll=command(planned,'EnrollCourseAudience',{cohortId:co.id,personIds:co.availablePeople.slice(0,2)})
 expect(previewCommand(planned,enroll,codec.registry,'player').allowed).toBe(true);enrolled=propose(planned,enroll)
},20000)

it('confirms the actual chosen class and future support reservation before explicit enrolment receives protected prepayment, with income still zero',()=>{
 const before=codec.export(normal),planBody=html(normal,plan),plannedCourse=courseOf(planned),co=plannedCourse.cohorts.find(c=>c.id===(enroll.payload as {cohortId:string}).cohortId)!,audience=plannedCourse.audiences.find(a=>a.id===co.audienceId)!
 for(const line of [lesson.name,'2023-05-01','2023-06-01','2023-07-01','2023-07-15','最多2人','单价沿所选受众记录冻结','保存这一步就为原支持预留','当前没有学员预款或教学收入'])expect(planBody).toContain(line)
 expect(co.priceFen).toBe(audience.priceFen);expect(co.supportJobs).toHaveLength(1);expect(co.supportJobs[0]!.job?.status).toBe('planned')
 expect(courseCohortFinancials(plannedCourse,viewOf(planned),co.id)).toMatchObject({receivedFen:0,unearnedFen:0,recognizedFen:0,protectedFen:0})
 const preview=previewCommand(planned,enroll,codec.registry,'player'),enrollBody=html(planned,enroll)
 expect(preview.receivedPrepaymentFen).toBe(co.priceFen*2);expect(preview.protectedIncreaseFen).toBe(co.priceFen*2)
 for(const line of ['2位实际合格意向','同时增加保护','本次教学收入仍为¥0','原受众意向','不能替代本应先准备的自有资金'])expect(enrollBody).toContain(line)
 expect(courseCohortFinancials(courseOf(enrolled),viewOf(enrolled),co.id)).toMatchObject({receivedFen:co.priceFen*2,unearnedFen:co.priceFen*2,recognizedFen:0,protectedFen:co.priceFen*2,refundPaidFen:0,refundDueFen:0,feePostedFen:0})
 expect(codec.export(normal)).toBe(before)
})

it('keeps real teaching dates and old support/refund duties in the captured confirmation without announcing delivery or another cash receipt',()=>{
 const stage=command(normal,'StartCourseStage',{cohortId:originalClass.id,index:0,resources:['player-production'],startAt:originalClass.startAt}),preview=previewCommand(normal,stage,codec.registry,'player'),body=html(normal,stage),before=codec.export(normal)
 expect(preview.allowed).toBe(true)
 for(const line of [lesson.name,originalClass.startAt,originalClass.stages[0]!.dueAt,'第1段教学安排','预计','安排和开工不确认收入','真实完成后才释放原保护并确认本段收入，不重复收款','原支持、退款责任继续保留'])expect(body).toContain(line)
 expect(body).not.toContain('本段已实际交付');expect(body).not.toContain('本次已收到教学收入')
 for(const patch of [{cohortId:'unknown-class'},{resources:['player-production','unknown-resource']},{startAt:'2020-01-01'},{startAt:'2023-02-30'},{index:2}]){
  const wrong=html(normal,{...stage,payload:{...(stage.payload as Record<string,unknown>),...patch}})
  expect(wrong).toContain('返回逐项重新核对');expect(wrong).not.toContain('第1段教学安排')
 }
 expect(html(normal,{...stage,expectedRevision:stage.expectedRevision-1})).toContain('返回逐项重新核对')
 expect(html(normal,stage,{...viewOf(normal),readOnly:true})).toContain('返回逐项重新核对')
 expect(html(normal,stage,{...viewOf(normal),hasCandidate:true})).toContain('返回逐项重新核对')
 expect(codec.export(normal)).toBe(before)
})

it('reads real cash refunds and remaining protection from original ledger records instead of treating registered refunds or fee posting as closure',()=>{
 const before=codec.export(normal),view=viewOf(normal),initial=courseCohortFinancials(originalCourse,view,originalClass.id)!,ids=originalClass.students.slice(0,2).map(s=>s.personId),refund=command(normal,'RefundCourseLearners',{cohortId:originalClass.id,personIds:ids,reason:'按本班原承诺退还未交付款'})
 expect(previewCommand(normal,refund,codec.registry,'player').allowed).toBe(true)
 const terms=html(normal,refund)
 expect(terms).toContain('尚未交付的原预款');expect(terms).toContain('不等于学员已经到账')
 const next=propose(normal,refund),nextCourse=courseOf(next),nextView=viewOf(next),money=courseCohortFinancials(nextCourse,nextView,originalClass.id)!,amount=originalClass.priceFen*2
 expect(initial).toMatchObject({recognizedFen:0,unearnedFen:initial.receivedFen,protectedFen:initial.receivedFen})
 expect(money).toMatchObject({receivedFen:initial.receivedFen,unearnedFen:initial.unearnedFen-amount,protectedFen:initial.protectedFen-amount,recognizedFen:0,refundRegisteredFen:amount,refundPaidFen:amount,refundDueFen:0,feePostedFen:0,feePaidFen:0,feeDueFen:0})
 expect(nextCourse.cohorts.find(c=>c.id===originalClass.id)!.closedAt).toBeNull()
 const missingFinance={...nextView,features:{...nextView.features,workbench:{...(nextView.features as unknown as {workbench:Record<string,unknown>}).workbench,finance:[]}}}
 expect(courseCohortFinancials(nextCourse,missingFinance,originalClass.id)).toBeNull();expect(courseCohortFinancials(nextCourse,nextView,'unknown-class')).toBeNull()
 expect(codec.export(normal)).toBe(before)
})

it('uses a short visible folio title while retaining the full object action name and all text-mode responsibilities',()=>{
 const full=lesson.name+' · '+originalClass.startAt+'班',base={kind:'calendar' as const,title:full,detail:'原日期、支持与退款窗口继续。',stageLabel:'原支持已预留',actionLabel:'翻看本班当前安排',onActivate:()=>{},disabled:false,appearance:'course' as const},short=renderToStaticMarkup(<OpeningObject {...base} displayTitle="这一班的约定" textOnly teaching={{stages:['planned','pending'],protectedFen:199800,needsHelp:1,refundDueFen:10000,supportUnmet:true,closedAt:null}}/>),legacy=renderToStaticMarkup(<OpeningObject {...base}/> )
 expect(short).toContain('aria-label="'+full+' 翻看本班当前安排"');expect(short).not.toContain('aria-labelledby=');expect(short).not.toContain('<img')
 for(const line of ['这一班的约定','第1段 · 已安排','第2段 · 待安排','保护中','1人待帮助','退款待付','原支持待履行',base.detail])expect(short).toContain(line)
 expect(short).not.toContain('本班结清');expect(legacy).toContain('aria-labelledby=');expect(legacy).toContain(full)
})
