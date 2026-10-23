import {afterAll,beforeAll,describe,expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {courseFocusFor,courseFocusFromSaved,courseSceneContext,type CourseOpeningFocus} from './course-player-thread.ts'
import {courseSceneProgress,courseTargetReason,type CourseSceneTarget} from './course-scene-progress.ts'
import {playerThread} from './player-thread.ts'
import {seasonFocusAfterSave,seasonFocusChoices,seasonRecollection} from './season-thread.ts'
import {loadSeasonFocusPreference,saveSeasonFocusPreference} from './season-focus-preference.ts'
import {courseTeachingSceneResult} from './course-teaching-result.ts'
import {moneyText} from './game-text.ts'
import ready86 from '../../goal-1/evidence/t17-acceptance-24/chrome-final-r5/course-r5-final-physical-86.json?raw'

const input=(view:PlayingView)=>({view,features:view.features as unknown as PlayFeatures})
async function normal(name:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'c2-model-'+name})
 let count=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`c2-${name}-${++count}`})
 await controller.initialize();await controller.importNew(ready86)
 const p=()=>input(controller.snapshot.view!)
 const frames:{kind:string;previous:ReturnType<typeof input>;current:ReturnType<typeof input>}[]=[]
 const send=async(kind:string,payload:unknown)=>{const previous=p(),result=await controller.submit(controller.prepare(kind,payload));expect(result.status,JSON.stringify({kind,date:previous.view.date,result})).toBe('saved');const frame={kind,previous,current:p()};frames.push(frame);return frame}
 const advance=async(target:string)=>{for(let n=0;n<100;n++){
  const {view,features}=p(),w=features.workbench
  if(w.pause){expect(w.pause.reason).toBe('CONTENT_DECISION_PENDING');const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;expect(choice).toMatchObject({costFen:0,actionPoints:0});await send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}
  if(view.date>=target&&!view.operations?.jobs.some(j=>['planned','running'].includes(j.status)&&j.completeAt<=target))return
  const barrier=w.atQuarterEnd?w.progression.nextQuarterDate:w.progression.quarterTarget
  await send('AdvanceTime',{date:barrier&&barrier<target?barrier:target})
 }throw Error('C2_ORIGINAL_CLOCK_LIMIT')}
 return {codec,controller,p,send,advance,frames,close:async()=>{await controller.close();await store.close()}}
}

describe('one original normal86 class across its original dates and windows',{concurrent:false},()=>{
 let h:Awaited<ReturnType<typeof normal>>,c:NonNullable<PlayFeatures['course']>['courses'][number],a:NonNullable<PlayFeatures['course']>['audiences'][number],co:NonNullable<PlayFeatures['course']>['cohorts'][number],cf:CourseOpeningFocus,af:CourseOpeningFocus,jf:CourseOpeningFocus
 beforeAll(async()=>{h=await normal('complete')},30000)
 afterAll(async()=>{await h?.close()})
 it('earns actual matching audience only after the saved paid marketing work',async()=>{
  expect(h.p().view).toMatchObject({origin:'normal',date:'2023-01-16',revision:86})
  c=h.p().features.course!.courses[0]!;const base:CourseSceneTarget={kind:'course',businessId:c.businessId,courseId:c.id},pin=courseFocusFor(h.p(),base)
  const progress=()=>courseSceneProgress(h.p().features.course,h.p().view.date,base,courseSceneContext(h.p()))!
  expect(progress().teachingIntent).toBe('audience')
  expect(h.controller.preview(h.controller.prepare('CreateCourseAudience',{courseId:c.id,mode:'paid',priceFen:99900,resources:['player-production'],startAt:'2023-01-17'})).allowed).toBe(false)
  const funded=await h.send('FundBusiness',{businessId:c.businessId,amountFen:1500000})
  expect(courseTeachingSceneResult('FundBusiness',funded.previous.view,funded.current.view)).toContain('个人资金转入，未产生课程收入')
  const payload={courseId:c.id,mode:'paid',priceFen:99900,resources:['player-production'],startAt:'2023-01-17'},aSaved=await h.send('CreateCourseAudience',payload);af=courseFocusFromSaved(aSaved.previous,aSaved.current,'CreateCourseAudience',payload)!
  expect(af.courseTarget?.kind).toBe('audience');expect(seasonFocusAfterSave(aSaved.previous,aSaved.current,'CreateCourseAudience',payload,pin)).toEqual(af)
  expect(courseTeachingSceneResult('CreateCourseAudience',aSaved.previous.view,aSaved.current.view)).toContain('报价和意向都不是报名或学费收入')
  for(const view of [{...aSaved.current.view,saveStatus:'unsaved' as const},{...aSaved.current.view,hasCandidate:true},{...aSaved.current.view,readOnly:true},{...aSaved.current.view,revision:aSaved.previous.view.revision},{...aSaved.current.view,runId:'other-life'}])expect(courseTeachingSceneResult('CreateCourseAudience',aSaved.previous.view,view)).toBeNull()
  expect(playerThread(h.p(),af)).toMatchObject({stage:'course-audience-planned',outcome:'pending',wait:{date:'2023-01-17'}})
  for(const view of [{...aSaved.current.view,saveStatus:'unsaved' as const},{...aSaved.current.view,hasCandidate:true},{...aSaved.current.view,readOnly:true},{...aSaved.current.view,runId:'other-life'}])expect(courseFocusFromSaved(aSaved.previous,{...aSaved.current,view},'CreateCourseAudience',payload)).toBeNull()
  await h.advance('2023-01-24')
  expect(playerThread(h.p(),af).stage).toBe('course-audience-ready')
  a=h.p().features.course!.audiences[0]!
  expect(a.completedAt).toBe('2023-01-24');expect(a.eligibleMembers.length).toBeGreaterThan(0)
  expect(h.frames.some(f=>f.kind==='AdvanceTime'&&courseTeachingSceneResult(f.kind,f.previous.view,f.current.view)?.includes('这次推广已实际完成'))).toBe(true)
 },30000)
 it('reserves original support, protects actual tuition and delivers only the completed first stage',async()=>{
  const plan={courseId:c.id,audienceId:a.id,startAt:'2023-01-26',endAt:'2023-04-20',supportStartAt:'2023-04-20',seatLimit:5,supportMode:'guided_group',resources:['player-production'],promise:'clear_scope'}
  const planned=await h.send('PlanCourseCohort',plan);cf=seasonFocusAfterSave(planned.previous,planned.current,'PlanCourseCohort',plan,af) as CourseOpeningFocus
  expect(cf.kind==='course'&&cf.courseTarget?.kind).toBe('cohort')
  expect(courseTeachingSceneResult('PlanCourseCohort',planned.previous.view,planned.current.view)).toContain('尚未报名收款')
  co=h.p().features.course!.cohorts[0]!
  expect(playerThread(h.p(),cf).stage).toBe('course-cohort-enroll')
  const enroll={cohortId:co.id,personIds:co.availablePeople.slice(0,5)},enrolled=await h.send('EnrollCourseAudience',enroll)
  expect(courseFocusFromSaved(enrolled.previous,enrolled.current,'EnrollCourseAudience',enroll,cf.kind==='course'?cf:null)).toBe(cf)
  expect(courseTeachingSceneResult('EnrollCourseAudience',enrolled.previous.view,enrolled.current.view)).toContain('收到保护预款'+moneyText(enroll.personIds.length*co.priceFen))
  expect(courseTeachingSceneResult('EnrollCourseAudience',enrolled.previous.view,enrolled.current.view)).toContain('本次课程收入仍为0')
  const paid=h.p().features.course!.cohorts[0]!
  expect(paid.students).toHaveLength(enroll.personIds.length);expect(paid.students.every(s=>s.delivered[0]===0&&s.delivered[1]===0)).toBe(true)
  expect(playerThread(h.p(),cf)).toMatchObject({stage:'course-stage-needed',outcome:'pending'})
  const lesson={cohortId:co.id,index:0,resources:['player-production'],startAt:'2023-01-26'},first=await h.send('StartCourseStage',lesson);jf=courseFocusFromSaved(first.previous,first.current,'StartCourseStage',lesson)!
  expect(jf.courseTarget?.kind==='cohort'&&jf.courseTarget.jobId).toBeDefined()
  expect(courseTeachingSceneResult('StartCourseStage',first.previous.view,first.current.view)).toContain('已安排，尚未开工')
  expect(courseTeachingSceneResult('StartCourseStage',first.previous.view,first.current.view)).toContain('没有提前记作交付')
  expect(playerThread(h.p(),jf).stage).toBe('course-stage-planned')
  expect(courseSceneProgress(h.p().features.course,'2023-02-05',jf.courseTarget!,courseSceneContext(h.p()))).toMatchObject({phase:'course-stage-planned',outcome:'pending'})
  await h.advance('2023-02-05')
  const half=h.p().features.course!.cohorts[0]!
  expect(half.stages[0]!.deliveredAt).toBe('2023-02-05');expect(half.stages[1]!.deliveredAt).toBeNull()
  expect(h.frames.some(f=>f.kind==='AdvanceTime'&&courseTeachingSceneResult(f.kind,f.previous.view,f.current.view)?.includes('按原阶段确认收入'+moneyText(half.stages[0]!.amountFen)))).toBe(true)
  expect(playerThread(h.p(),jf)).toMatchObject({stage:'course-stage-completed',outcome:'actual'})
 },30000)
 it('keeps the Q1 class through a real update and the Q2 teaching while support is still unfinished',async()=>{
  await h.advance('2023-03-14')
  expect(h.p().features.course!.courses[0]!.unresolvedUpdates.length).toBeGreaterThan(0)
  expect(playerThread(h.p(),cf).stage).toBe('course-cohort-update-required')
  const refreshPayload={courseId:c.id,resources:['player-production'],startAt:'2023-03-14'},refresh=await h.send('StartCourseRefresh',refreshPayload),refreshJob=h.p().features.course!.courses.find(row=>row.id===c.id)!.refreshes.at(-1)!.job!
  const targets:CourseSceneTarget[]=[cf.courseTarget!,{kind:'course',businessId:c.businessId,courseId:c.id},{kind:'audience',businessId:c.businessId,courseId:c.id,audienceId:a.id}]
  for(const target of targets){
   const progress=courseSceneProgress(h.p().features.course,h.p().view.date,target,courseSceneContext(h.p()))!
   expect(progress).toMatchObject({phase:'course-refresh-running',target,outcome:'pending',wait:{date:'2023-03-21'}})
   expect(progress.teachingIntent).toBeUndefined();expect(progress.choice.line).toContain('¥2,000 / 1点 / 7日')
   expect(progress.resultRefs.some(ref=>ref.kind==='job'&&ref.id===refreshJob.id)).toBe(true)
  }
  expect(courseFocusFromSaved(refresh.previous,refresh.current,'StartCourseRefresh',refreshPayload,cf)).toBe(cf)
  expect(seasonFocusAfterSave(refresh.previous,refresh.current,'StartCourseRefresh',refreshPayload,cf)).toBe(cf)
  expect(courseTeachingSceneResult('StartCourseRefresh',refresh.previous.view,refresh.current.view)).toContain('尚未完成')
  for(const view of [{...refresh.current.view,saveStatus:'unsaved' as const,hasCandidate:true},{...refresh.current.view,readOnly:true}])expect(courseTeachingSceneResult('StartCourseRefresh',refresh.previous.view,view)).toBeNull()
  expect(playerThread(refresh.previous,cf).stage).toBe('course-cohort-update-required')
  expect(playerThread(h.p(),jf).stage).toBe('course-stage-completed')
  await h.advance('2023-03-21')
  expect(h.p().features.course!.courses.find(row=>row.id===c.id)!.refreshes.at(-1)).toMatchObject({applied:true,job:{id:refreshJob.id,status:'completed'}})
  expect(playerThread(h.p(),cf).stage).toBe('course-stage-needed')
  expect(playerThread(h.p(),courseFocusFor(h.p(),targets[1]!)).stage).toBe('course-ready')
  expect(playerThread(h.p(),af).stage).toBe('course-audience-ready')
  expect(h.frames.some(frame=>frame.kind==='AdvanceTime'&&courseTeachingSceneResult(frame.kind,frame.previous.view,frame.current.view)?.includes('本次绑定的材料已实际更新'))).toBe(true)
  await h.advance('2023-04-01')
  expect(playerThread(h.p(),cf).focusQuarter).toBe('2023-Q1')
  expect(playerThread(h.p(),cf).focusScope).toBe('carry')
  const second={cohortId:co.id,index:1,resources:['player-production'],startAt:'2023-04-02'}
  await h.send('StartCourseStage',second);await h.advance('2023-04-12')
  expect(h.p().features.course!.cohorts[0]!.assessmentAt).toBeNull()
  expect(playerThread(h.p(),cf).stage).toBe('course-support-planned')
 },30000)
 it('records public support, possible remedy and only then the original fee and closing window',async()=>{
  await h.advance('2023-04-27')
  const feedback=h.p().features.course!.cohorts[0]!
  expect(feedback.assessmentAt).not.toBeNull();expect(feedback.students.every(s=>s.outcome!=='pending')).toBe(true)
  expect(h.frames.some(f=>f.kind==='AdvanceTime'&&courseTeachingSceneResult(f.kind,f.previous.view,f.current.view)?.includes('已有实际学习反馈'))).toBe(true)
  if(feedback.students.some(s=>s.outcome==='needs_recovery')){
   expect(playerThread(h.p(),cf).stage).toBe('course-recovery-needed')
   const recover={cohortId:co.id,supportMode:'guided_group',resources:['player-production'],startAt:'2023-04-27'}
   await h.send('StartCourseRecovery',recover);await h.advance('2023-05-04')
  }
  expect(playerThread(h.p(),cf).stage).toBe('course-refund-window')
  await h.advance('2023-05-05')
  const actualClosed=h.p().features.course!.cohorts[0]!
  expect(actualClosed.closedAt).toBe('2023-05-05')
  expect(h.frames.some(f=>courseTeachingSceneResult(f.kind,f.previous.view,f.current.view)?.includes('已于2023-05-05实际结清'))).toBe(true)
  console.info('C2_NORMAL_PUBLIC_RESULT',JSON.stringify({runId:h.p().view.runId,revision:h.p().view.revision,date:h.p().view.date,courseId:c.id,cohortId:co.id,learners:actualClosed.students.length,stages:actualClosed.stages.map(s=>({index:s.index,date:s.deliveredAt,amountFen:s.amountFen})),assessmentAt:actualClosed.assessmentAt,recovered:actualClosed.students.filter(s=>s.recovered).length,refunds:h.p().features.course!.refunds.filter(r=>r.cohortId===co.id),feePostedAt:actualClosed.feePostedAt,feeFen:actualClosed.feeFen,closedAt:actualClosed.closedAt}))
  expect(playerThread(h.p(),cf)).toMatchObject({stage:'course-cohort-closed',outcome:'actual'})
  expect(courseTargetReason(h.p().features.course,cf.courseTarget!,courseSceneContext(h.p()))).toBeNull()
  expect(seasonFocusChoices(h.p()).some(x=>x.focus.entityId===co.id)).toBe(true)
  const reel=seasonRecollection(h.p())!
  expect(reel.allNodes.some(n=>n.id==='course-close:'+co.id)).toBe(true)
  expect(new Set(reel.allNodes.map(n=>n.id)).size).toBe(reel.allNodes.length)
  expect(seasonRecollection(h.p(),'2023-Q1')!.allNodes.some(n=>n.id==='course-stage:'+co.id+':0')).toBe(true)
  let raw:string|null=null;const storage={getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value}}
  const record={version:1 as const,runId:h.p().view.runId,quarter:'2023-Q2',focus:cf}
  expect(saveSeasonFocusPreference(storage,record,{runId:record.runId,quarter:record.quarter,saveStatus:'saved',hasCandidate:false,busy:false}).status).toBe('saved')
  expect(loadSeasonFocusPreference(storage,{runId:record.runId,quarter:'2023-Q2'})).toMatchObject({status:'loaded',record})
 },30000)
})

it('keeps two real cohorts and a cancelled original teaching attempt distinct, including bookmarks and partial refunds',async()=>{
 const h=await normal('identity')
 try{
  const c=h.p().features.course!.courses[0]!
  await h.send('FundBusiness',{businessId:c.businessId,amountFen:2000000})
  await h.send('CreateCourseAudience',{courseId:c.id,mode:'paid',priceFen:99900,resources:['player-production'],startAt:'2023-01-17'})
  await h.advance('2023-01-24')
  const a=h.p().features.course!.audiences[0]!,plan={courseId:c.id,audienceId:a.id,startAt:'2023-01-26',endAt:'2023-04-20',supportStartAt:'2023-04-20',seatLimit:5,supportMode:'guided_group',resources:['player-production'],promise:'clear_scope'}
  await h.send('PlanCourseCohort',plan)
  const co=h.p().features.course!.cohorts[0]!,target:CourseSceneTarget={kind:'cohort',businessId:c.businessId,courseId:c.id,cohortId:co.id},pin=courseFocusFor(h.p(),target)
  const sidePayload={...plan,startAt:'2023-01-27',endAt:'2023-04-25',supportStartAt:'2023-05-01'},side=await h.send('PlanCourseCohort',sidePayload)
  expect(seasonFocusAfterSave(side.previous,side.current,'PlanCourseCohort',sidePayload,pin)).toBe(pin)
  const other=h.p().features.course!.cohorts[1]!,foreign=other.supportJobs[0]!.jobId
  expect(courseTargetReason(h.p().features.course,{...target,jobId:foreign},courseSceneContext(h.p()))).toContain('没有改成最新任务')
  const people=co.availablePeople.slice(0,2)
  await h.send('EnrollCourseAudience',{cohortId:co.id,personIds:people})
  const lesson={cohortId:co.id,index:0,resources:['player-production'],startAt:'2023-01-26'},scheduled=await h.send('StartCourseStage',lesson),old=courseFocusFromSaved(scheduled.previous,scheduled.current,'StartCourseStage',lesson)!
  const jobId=old.entityId!
  await h.send('InterruptJob',{jobId})
  await h.send('StartCourseStage',{...lesson,startAt:'2023-01-27'})
  expect(playerThread(h.p(),old)).toMatchObject({stage:'course-stage-cancelled',outcome:'non-success'})
  expect(courseSceneProgress(h.p().features.course,h.p().view.date,old.courseTarget!,courseSceneContext(h.p()))).toMatchObject({historical:true})
  expect(playerThread(h.p(),old).inspect.target?.courseTarget).toEqual(old.courseTarget)
  expect(playerThread(h.p(),pin)).toMatchObject({stage:'course-stage-planned',outcome:'pending'})
  const invalidJobs={operations:{jobs:[...h.p().view.operations!.jobs,h.p().view.operations!.jobs.find(j=>j.id===jobId)!]}}
  expect(courseTargetReason(h.p().features.course,old.courseTarget!,invalidJobs)).not.toBeNull()
  const before=h.controller.exportSaved(),refund={cohortId:co.id,personIds:people.slice(0,1),reason:'明确仅退本班所选原学员'}
  const refunded=await h.send('RefundCourseLearners',refund)
  expect(courseFocusFromSaved(refunded.previous,refunded.current,'RefundCourseLearners',refund,pin)).toBe(pin)
  const actual=h.p().features.course!.refunds.at(-1)!
  expect(actual).toMatchObject({cohortId:co.id,personIds:people.slice(0,1),undeliveredFen:99900,deliveredFen:0})
  const refundResult=courseTeachingSceneResult('RefundCourseLearners',refunded.previous.view,refunded.current.view)
  expect(refundResult).toContain('应退¥999');expect(refundResult).toContain('本次实际付出¥999');expect(refundResult).not.toContain('仍欠')
  const reel=seasonRecollection(h.p())!
  expect(reel.allNodes.find(n=>n.id==='course-refund:'+actual.id)?.line).toContain('不等于现金已付清')
  expect(reel.remaining.filter(r=>r.id.startsWith('cohort:')).map(r=>r.focus?.entityId)).toEqual(expect.arrayContaining([co.id,other.id]))
  expect(playerThread(h.p(),{...pin,accountId:'personal'}).focusStatus).toBe('invalid')
  expect(h.controller.exportSaved()).not.toBe(before)
  const saved=h.controller.exportSaved()
  let raw=JSON.stringify({version:1,runId:h.p().view.runId,quarter:'2023-Q1',focus:old})
  const storage={getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value}}
  expect(loadSeasonFocusPreference(storage,{runId:h.p().view.runId,quarter:'2023-Q1'})).toMatchObject({status:'loaded',record:{focus:old}})
  raw=JSON.stringify({version:1,runId:h.p().view.runId,quarter:'2023-Q1',focus:{...old,courseTarget:{...old.courseTarget,cohortId:other.id,sampleJobId:jobId}}})
  const invalidRaw=raw
  expect(loadSeasonFocusPreference(storage,{runId:h.p().view.runId,quarter:'2023-Q1'}).status).toBe('invalid')
  expect(raw).toBe(invalidRaw);expect(h.controller.exportSaved()).toBe(saved)
  await h.advance('2023-03-14')
  expect(playerThread(h.p(),pin).stage).toBe('course-cohort-update-required')
  const maintenance={courseId:c.id,resources:['player-production'],startAt:'2023-03-15'}
  await h.send('StartCourseRefresh',maintenance)
  const refreshJob=h.p().features.course!.courses.find(row=>row.id===c.id)!.refreshes.at(-1)!.job!
  const targets:CourseSceneTarget[]=[target,{kind:'course',businessId:c.businessId,courseId:c.id},{kind:'audience',businessId:c.businessId,courseId:c.id,audienceId:a.id}]
  for(const selected of targets){const progress=courseSceneProgress(h.p().features.course,h.p().view.date,selected,courseSceneContext(h.p()))!;expect(progress).toMatchObject({phase:'course-refresh-planned',target:selected,outcome:'pending',wait:{date:'2023-03-15'}});expect(progress.teachingIntent).toBeUndefined();expect(progress.choice.line).toContain('已预留，尚未实付或使用行动')}
  expect(playerThread(h.p(),old).stage).toBe('course-stage-cancelled')
  await h.advance('2023-03-15')
  for(const selected of targets){const progress=courseSceneProgress(h.p().features.course,h.p().view.date,selected,courseSceneContext(h.p()))!;expect(progress).toMatchObject({phase:'course-refresh-running',target:selected,wait:{date:'2023-03-22'}});expect(progress.resultRefs.some(ref=>ref.kind==='job'&&ref.id===refreshJob.id)).toBe(true)}
 }finally{await h.close()}
},30000)
