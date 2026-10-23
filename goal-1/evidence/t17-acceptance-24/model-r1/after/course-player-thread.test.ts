import {expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {courseFocusFor,courseFocusFromSaved,resolveCourseFocus,courseSceneContext} from './course-player-thread.ts'
import {courseSceneProgress,courseTargetReason} from './course-scene-progress.ts'
import {openingFocusFor,playerThread} from './player-thread.ts'
import {seasonFocusAfterSave,seasonFocusChoices,seasonRecollection} from './season-thread.ts'
import {courseSceneResult} from './course-scene-result.ts'
import earnedPrefix from '../../goal-1/evidence/t17-acceptance-16/normal-before-course-studio.json?raw'
import earnedLicensedCase from '../../goal-1/evidence/t17-acceptance-23/chrome-r6/ai-saved-70-paid-r6.json?raw'

const input=(view:PlayingView)=>({view,features:view.features as unknown as PlayFeatures})
async function normal(name:string,raw=earnedPrefix){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'c1-model-'+name})
 let count=0;const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`c1-${name}-${++count}`})
 await controller.initialize();await controller.importNew(raw)
 const p=()=>input(controller.snapshot.view!)
 expect(p().view.origin).toBe('normal')
 const send=async(kind:string,payload:unknown)=>{const previous=p(),result=await controller.submit(controller.prepare(kind,payload));expect(result.status,JSON.stringify({kind,date:previous.view.date,result})).toBe('saved');return {previous,current:p()}}
 const advance=async(target:string)=>{let last:Awaited<ReturnType<typeof send>>|null=null;for(let n=0;n<40;n++){
  const {view,features}=p(),w=features.workbench
  if(w.pause){expect(w.pause.reason).toBe('CONTENT_DECISION_PENDING');const event=w.events.find(e=>e.isBlocking)!,choice=event.choices.find(c=>c.isDefault)!;expect(choice).toMatchObject({costFen:0,actionPoints:0});last=await send('ChooseEvent',{instanceId:event.id,choiceId:choice.id});continue}
  if(view.date>=target&&!view.operations?.jobs.some(j=>['planned','running'].includes(j.status)&&j.completeAt<=target))return last
  const quarter=w.progression.quarterTarget,date=quarter&&quarter>view.date&&quarter<target?quarter:target
  last=await send('AdvanceTime',{date})
 }throw Error('C1_MODEL_ORIGINAL_CLOCK_LIMIT')}
 return {codec,controller,p,send,advance,close:async()=>{await controller.close();await store.close()}}
}

it('binds a normally funded first-order course only after each actual save, keeps a side draft out of its pin and stops at the real sample',async()=>{
 const h=await normal('first-order')
 try{
  const entry=courseFocusFor(h.p()),other=openingFocusFor(h.p(),'quarter',{recordId:h.p().features.firstOrder.contractId!})!
  const opened=await h.send('OpenCourseStudio',{capitalFen:500000}),studio=courseFocusFromSaved(opened.previous,opened.current,'OpenCourseStudio',{capitalFen:500000})!
  expect(courseSceneResult('OpenCourseStudio',opened.previous.view,opened.current.view)).toContain('不是经营收入')
  for(const invalid of [{...opened.current.view,saveStatus:'unsaved' as const},{...opened.current.view,hasCandidate:true},{...opened.current.view,revision:opened.previous.view.revision},{...opened.current.view,runId:'another-life'}])expect(courseSceneResult('OpenCourseStudio',opened.previous.view,invalid)).toBeNull()
  expect(studio.accountId).not.toBe('personal');expect(resolveCourseFocus(h.p(),studio).reason).toBeNull()
  expect(seasonFocusAfterSave(opened.previous,opened.current,'OpenCourseStudio',{capitalFen:500000},entry)).toEqual(studio)
  expect(seasonFocusAfterSave(opened.previous,opened.current,'OpenCourseStudio',{capitalFen:500000},other)).toBe(other)
  const businessId=studio.businessId!,outlined=await h.send('StartCourseOutline',{businessId,resources:['player-production'],startAt:'2022-12-02'}),outline=courseFocusFromSaved(outlined.previous,outlined.current,'StartCourseOutline',{businessId})!
  expect(outline.courseTarget?.kind).toBe('outline');expect(playerThread(h.p(),outline).wait).toMatchObject({date:'2022-12-02'})
  expect(courseFocusFromSaved(outlined.previous,{...outlined.current,view:{...outlined.current.view,hasCandidate:true,saveStatus:'unsaved'}},'StartCourseOutline',{businessId})).toBeNull()
  expect(courseFocusFromSaved(outlined.previous,{...outlined.current,view:{...outlined.current.view,readOnly:true}},'StartCourseOutline',{businessId})).toBeNull()
  await h.advance('2022-12-09');expect(playerThread(h.p(),outline).command?.kind).toBe('ActivateBusiness')
  await h.send('ActivateBusiness',{businessId})
  const ref=h.p().features.course!.cases.find(c=>c.kind==='first_order')!;expect(ref).toBeDefined()
  const definition={businessId,name:'自己交付过的手工经验与图像实作',productId:'intro_recorded',topicId:'image_workflows',edition:'foundation',segment:'ai_learners',cases:[{kind:ref.kind,id:ref.id}],consent:true}
  const defined=await h.send('DefineCourse',definition),course=courseFocusFromSaved(defined.previous,defined.current,'DefineCourse',definition)!
  expect(courseSceneResult('DefineCourse',defined.previous.view,defined.current.view)).toContain('已记为课程方案');expect(courseSceneResult('DefineCourse',defined.previous.view,defined.current.view)).toContain('尚未完成样课')
  expect(playerThread(h.p(),course)).toMatchObject({focusStatus:'valid',stage:'course-draft',outcome:'none'})
  const side=await h.send('DefineCourse',{...definition,name:'明确另外留下的草稿'})
  expect(seasonFocusAfterSave(side.previous,side.current,'DefineCourse',{...definition,name:'明确另外留下的草稿'},course)).toBe(course)
  expect(playerThread(h.p(),course).object).toContain(definition.name)
  await h.advance('2023-01-01')
  const target=course.courseTarget!;if(target.kind!=='course')throw Error('C1_EXPECT_COURSE')
  const payload={courseId:target.courseId,resources:['player-production'],startAt:'2023-01-02'},built=await h.send('BuildCourseSample',payload),sample=seasonFocusAfterSave(built.previous,built.current,'BuildCourseSample',payload,course)!
  expect(courseSceneResult('BuildCourseSample',built.previous.view,built.current.view)).toContain('已安排，尚未开工')
  expect(courseSceneResult('AdvanceTime',built.current.view,{...built.current.view,revision:built.current.view.revision+1,date:'2023-01-16'})).toBeNull()
  expect(sample.kind).toBe('course');expect(sample.entityId).not.toBe(course.entityId);expect(playerThread(h.p(),sample).wait).toMatchObject({date:'2023-01-02'})
  const completed=(await h.advance('2023-01-16'))!
  expect(courseSceneResult('AdvanceTime',completed.previous.view,completed.current.view)).toContain('样课已实际完成')
  const before=h.controller.exportSaved(),thread=playerThread(h.p(),sample)
  expect(thread).toMatchObject({stage:'course-ready',outcome:'actual',focusStatus:'valid'});expect(thread.line).toContain('尚未招生')
  expect(thread.inspect.target?.courseTarget).toEqual(sample.kind==='course'?sample.courseTarget:null)
  expect(h.p().features.course!.cohorts).toHaveLength(0);expect(h.p().features.course!.businesses[0]!.metrics.incomeFen).toBe(0)
  expect(seasonFocusChoices(h.p()).some(c=>c.focus.entityId===sample.entityId)).toBe(true)
  const reel=seasonRecollection(h.p())!
  expect(reel.allNodes.some(n=>n.id==='course-sample:'+sample.entityId&&n.inspect.target?.courseTarget?.kind==='course')).toBe(true)
  expect(courseFocusFromSaved(built.current,h.p(),'AdvanceTime',{date:'2023-01-16'},sample.kind==='course'?sample:null)).toBeNull()
  expect(playerThread(h.p(),{...course,accountId:'personal'}).focusStatus).toBe('invalid')
  expect(playerThread(h.p(),{...course,runId:'another-life'}).focusStatus).toBe('invalid')
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},30000)

it('keeps a saved course materials task attached to its actual licensed course and waits for the original completion',async()=>{
 const h=await normal('licensed-course',earnedLicensedCase)
 try{
  await h.advance('2022-11-30');await h.send('OpenCourseStudio',{capitalFen:500000});const b=h.p().features.course!.businesses.find(b=>b.lifecycle==='preparing')!
  await h.send('StartCourseOutline',{businessId:b.id,resources:['player-production'],startAt:'2022-11-30'});await h.advance('2022-12-07');await h.send('ActivateBusiness',{businessId:b.id})
  const ref=h.p().features.course!.cases.find(c=>c.kind==='video'&&c.licensed)!;expect(ref).toBeDefined()
  await h.send('DefineCourse',{businessId:b.id,name:'原授权案例的课程使用范围',productId:'intro_recorded',topicId:'image_workflows',edition:'foundation',segment:'ai_learners',cases:[{kind:ref.kind,id:ref.id}],consent:true})
  const c=h.p().features.course!.courses[0]!,focus=courseFocusFor(h.p(),{kind:'course',businessId:b.id,courseId:c.id})
  expect(playerThread(h.p(),focus).stage).toBe('course-rights-required')
  const payload={businessId:b.id,caseKind:ref.kind,caseId:ref.id,resources:['player-production'],startAt:'2022-12-08'},saved=await h.send('LicenseCourseMaterials',payload)
  expect(courseFocusFromSaved(saved.previous,saved.current,'LicenseCourseMaterials',payload,focus)).toBe(focus)
  expect(seasonFocusAfterSave(saved.previous,saved.current,'LicenseCourseMaterials',payload,focus)).toBe(focus)
  expect(courseFocusFromSaved(saved.previous,saved.current,'LicenseCourseMaterials',payload)?.courseTarget?.kind).toBe('license')
  expect(playerThread(h.p(),focus)).toMatchObject({stage:'course-license-planned',wait:{date:'2022-12-08'},outcome:'pending'})
  await h.advance('2022-12-08');expect(playerThread(h.p(),focus)).toMatchObject({stage:'course-license-running',wait:{date:'2022-12-15'}})
  await h.advance('2022-12-15');expect(playerThread(h.p(),focus).stage).toBe('course-draft')
  expect(h.p().features.course!.cohorts).toHaveLength(0);expect(h.p().features.course!.businesses.find(row=>row.id===b.id)!.metrics.incomeFen).toBe(0)
 }finally{await h.close()}
},30000)

it('reuses an actual old global outline after closing its studio, without charging another outline for the new prepared business',async()=>{
 const h=await normal('reused-outline')
 try{
  await h.send('OpenCourseStudio',{capitalFen:500000});const old=h.p().features.course!.businesses[0]!
  await h.send('StartCourseOutline',{businessId:old.id,resources:['player-production'],startAt:'2022-12-02'});await h.advance('2022-12-09')
  const oldTarget={kind:'outline' as const,businessId:old.id,outlineId:h.p().features.course!.outlines[0]!.id}
  await h.send('WindDownBusiness',{businessId:old.id});await h.send('CloseBusiness',{businessId:old.id})
  await h.send('OpenCourseStudio',{capitalFen:500000});const next=h.p().features.course!.businesses.find(b=>b.lifecycle==='preparing')!
  await h.advance('2023-01-01');await h.send('StartInternalJob',{businessId:next.id,definitionId:'business-preparation',resources:['player-production'],startAt:'2023-01-01'});await h.advance('2023-01-08')
  expect(h.p().features.course!.outlines.filter(o=>o.businessId===next.id)).toHaveLength(0)
  const before=h.controller.exportSaved(),target={kind:'studio' as const,businessId:next.id},progress=courseSceneProgress(h.p().features.course,h.p().view.date,target,courseSceneContext(h.p()))!
  expect(progress).toMatchObject({phase:'course-activate',command:{kind:'ActivateBusiness',payload:{businessId:next.id}}})
  expect(h.controller.preview(h.controller.prepare('ActivateBusiness',{businessId:next.id})).allowed).toBe(true)
  expect(courseTargetReason(h.p().features.course,{...oldTarget,businessId:next.id},courseSceneContext(h.p()))).toBeTruthy()
  expect(courseTargetReason(h.p().features.course,oldTarget,courseSceneContext(h.p()))).toBeNull()
  expect(h.controller.exportSaved()).toBe(before)
 }finally{await h.close()}
},30000)
