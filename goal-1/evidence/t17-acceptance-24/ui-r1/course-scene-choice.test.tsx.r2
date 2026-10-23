import {expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {GameController} from '../application/game-controller.ts'
import {createCampaignCodec} from '../application/campaign.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {StoryHarness} from '../testing/story-harness.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {emptyCourseSceneDraft,createCourseSceneDraftMemory} from './course-scene-draft.ts'
import {CourseSceneChoice,CourseSceneRecord,courseDraftCommand,courseScheduleCaption,courseSceneContextReason,courseSceneSubmissionLock} from './CourseSceneChoice.tsx'
import {CoursePreparationFields,coursePreparationCommand} from './CoursePreparation.tsx'
import prefix from '../../goal-1/evidence/t17-acceptance-16/normal-before-course-studio.json?raw'

async function withView(raw:string,check:(p:GamePanelProps)=>void){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'c1-paper-'+Math.random()})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`c1-paper-${++id}`})
 try{await controller.initialize();await controller.importNew(raw);const view=controller.snapshot.view!,before=controller.exportSaved();check({controller,view,features:view.features as unknown as PlayFeatures,request:()=>{throw Error('READING_MUST_NOT_EXECUTE')},accountId:'personal',courseDraftMemory:createCourseSceneDraftMemory(view.runId)});expect(controller.exportSaved()).toBe(before)}finally{await controller.close();await store.close()}
}
it('keeps explicit funding and future/expired preparation drafts without default account or time commitments',async()=>{
 await withView(prefix,p=>{
  const blank=emptyCourseSceneDraft()
  expect(courseDraftCommand(p,blank,'fund',null)).toBeNull()
  expect(courseDraftCommand(p,{...blank,capital:'5000'},'fund',null)).toMatchObject({kind:'OpenCourseStudio',payload:{capitalFen:500000},confirm:true})
  expect(courseDraftCommand({...p,accountId:'missing-account'},{...blank,capital:'5000'},'fund',null)).toBeNull()
  expect(courseSceneContextReason({...p,accountId:'missing-account'},null)).toContain('不可用')
  const future={...blank,startAt:'2023-01-03',resources:['player-production']}
  const html=renderToStaticMarkup(<CoursePreparationFields p={p} step={{phase:'outline'}} draft={future} setDraft={()=>{throw Error('READING_MUST_NOT_EDIT')}}/>)
  expect(html).toContain('2023-01-03');expect(html).toContain('2023-01-10');expect(html).toContain('预计不等于实际完成')
  const old=renderToStaticMarkup(<CoursePreparationFields p={p} step={{phase:'outline'}} draft={{...future,startAt:'2020-01-01'}} setDraft={()=>{throw Error('READING_MUST_NOT_EDIT')}}/>)
  expect(old).toContain('2020-01-01');expect(old).toContain('已经过去，请重新选择')
  const scene=renderToStaticMarkup(<CourseSceneChoice p={p} target={null}>{()=> <button type="button">先明确这一次教学准备</button>}</CourseSceneChoice>)
  expect(scene).toContain('先明确这一次教学准备');expect(scene).not.toContain('dialog')
  expect(courseSceneSubmissionLock({...p,view:{...p.view,readOnly:true}})).toContain('仅可翻阅')
  expect(courseSceneSubmissionLock({...p,view:{...p.view,hasCandidate:true}})).toContain('尚未保存')
 })
})
it('uses a normally earned paid handwork case and the selected course cost, preserving original commands and owner boundaries',async()=>{
 const codec=createCampaignCodec(),h=new StoryHarness({priorRun:codec.import(prefix)})
 h.send('OpenCourseStudio',{capitalFen:1000000});const b=h.run.operations!.businesses.find(b=>b.route==='ai_course')!
 h.send('StartCourseOutline',{businessId:b.id,resources:['player-production'],startAt:'2022-11-30'})
 h.send('AdvanceTime',{date:'2022-12-07'});h.send('ActivateBusiness',{businessId:b.id})
 const caseId=h.run.operations!.contracts.find(c=>c.status==='settled'&&c.caseKey!==null)!.id
 h.send('DefineCourse',{businessId:b.id,name:'从真实交付开始',productId:'intro_recorded',topicId:'image_workflows',edition:'foundation',segment:'ai_learners',cases:[{kind:'first_order',id:caseId}],consent:true})
 const c=h.run.course!.courses.at(-1)!,target={kind:'course' as const,businessId:b.id,courseId:c.id}
 await withView(codec.export(h.run),original=>{
  const p={...original,accountId:b.accountId},empty=emptyCourseSceneDraft(),studio={kind:'studio' as const,businessId:b.id}
  expect(coursePreparationCommand(p,{phase:'activate',businessId:b.id},empty)).toMatchObject({kind:'ActivateBusiness',payload:{businessId:b.id}})
  expect(courseDraftCommand({...p,accountId:'personal'},{...empty,capital:'5000'},'fund',null)).toBeNull()
  const definition={...empty,name:'另一堂真正准备的课',productId:'intro_recorded',topicId:'image_workflows',segment:'ai_learners',consent:true,cases:[{kind:'first_order' as const,id:caseId}]}
  expect(courseDraftCommand(p,definition,'define',studio)).toMatchObject({kind:'DefineCourse',payload:{businessId:b.id,cases:[{kind:'first_order',id:caseId}],edition:'foundation'}})
  expect(courseDraftCommand(p,{...definition,productId:'enterprise_training'},'define',studio)).toBeNull()
  expect(courseDraftCommand(p,{...definition,cases:[...definition.cases,...definition.cases]},'define',studio)).toBeNull()
  expect(courseDraftCommand(p,empty,'sample',target)).toBeNull()
  const draft={...empty,resources:['player-production'],startAt:'2022-12-09'}
  const command=courseDraftCommand(p,draft,'sample',target)!
  expect(command).toEqual({kind:'BuildCourseSample',payload:{courseId:c.id,resources:['player-production'],startAt:'2022-12-09'},label:'核对这门课的实际样课安排',confirm:true})
  expect(p.controller.preview({runId:p.view.runId,actorId:'player',commandId:'c1-payload-check',expectedRevision:p.view.revision,kind:command.kind,payload:command.payload}).allowed).toBe(true)
  expect(courseScheduleCaption(p,draft,'sample',target)).toContain('¥2,000 · 1点 · 14日');expect(courseScheduleCaption(p,draft,'sample',target)).toContain('2022-12-23')
  expect(courseScheduleCaption(p,draft,'sample',target)).not.toContain('¥2,500')
  expect(courseDraftCommand({...p,accountId:'personal'},draft,'sample',target)).toBeNull()
  expect(courseDraftCommand(p,{...draft,startAt:'2020-01-01'},'sample',target)).toBeNull()
  expect(courseDraftCommand(p,draft,'sample',{...target,businessId:'other-business'})).toBeNull()
  expect(courseDraftCommand(p,draft,'sample',{...target,sampleJobId:'old-unmatched-attempt'})).toBeNull()
  // Public display variant only, never imported or claimed as an accepted license command.
  const unrelated={kind:'video' as const,id:'another-course-case'},display={...p,features:{...p.features,course:{...p.features.course!,cases:[...p.features.course!.cases,{...unrelated,label:'另一份已付案例',licensed:true}]}}}
  expect(courseDraftCommand(display,draft,'license',target,unrelated)).toBeNull()
  const html=renderToStaticMarkup(<CourseSceneRecord p={p} target={target}/>)
  expect(html).toContain('从真实交付开始');expect(html).toContain('仍是方案');expect(html).toContain('已付手工小单经验')
  const outline=p.features.course!.outlines.find(o=>o.businessId===b.id)!
  const actualOutline=renderToStaticMarkup(<CourseSceneRecord p={p} target={{kind:'outline',businessId:b.id,outlineId:outline.id}}/>)
  expect(actualOutline).toContain('本任务直接成本¥100 · 1点');expect(actualOutline).toContain('已实际完成')
  expect(p.features.course!.cohorts).toHaveLength(0)
 })
},20000)
