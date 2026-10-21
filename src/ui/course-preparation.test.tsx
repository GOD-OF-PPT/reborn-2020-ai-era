import {beforeAll,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCourseFixture} from '../testing/course-fixture.ts'
import {projectCourse} from '../core/course-projection.ts'
import {courseSceneProgress} from './course-scene-progress.ts'
import {CoursePreparation,CoursePreparationTrail} from './CoursePreparation.tsx'
import type {GamePanelProps} from './game-types.ts'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {PlayFeatures} from './game-types.ts'
import {createCampaignCodec,campaignCourse} from '../application/campaign.ts'
import {evaluateCommand} from '../core/commands.ts'
import {StoryHarness} from '../testing/story-harness.ts'
import type {GameRun} from '../core/run-types.ts'
import source from '../../goal-1/evidence/t17-acceptance-05/prefix-r1/content_employee-t16-campaign-2/image-studio-open.json?raw'
import earnedPrefix from '../../goal-1/evidence/t17-acceptance-16/normal-before-course-studio.json?raw'

let beforeStudio:GameRun
beforeAll(()=>{
 // The saved prefix was earned by prepare-browser-input.ts's complete Create
 // replay. Keep that independent audit; this UI suite checks the original
 // boundary and whole resulting bytes without replaying two years per run.
 const codec=createCampaignCodec(),original=codec.import(source),receipt=original.receipts.at(-1)!
 beforeStudio=codec.import(earnedPrefix)
 expect(beforeStudio.origin).toBe('normal');expect(receipt.kind).toBe('OpenCourseStudio')
 expect(beforeStudio.revision+1).toBe(original.revision)
 const command={...JSON.parse(receipt.payloadSignature),commandId:receipt.commandId,expectedRevision:receipt.revisionBefore}
 const result=evaluateCommand(beforeStudio,command,codec.registry,beforeStudio.actorId)
 if(result.status!=='proposed')throw Error('ORIGINAL_PREPARATION_PREFIX_REJECTED')
 expect(codec.export(result.nextRun)).toBe(source);expect(beforeStudio).toBeDefined()
},20000)
function normalPreparation(){
 const h=new StoryHarness({priorRun:beforeStudio}),course=()=>projectCourse(h.run,campaignCourse)!,progress=()=>courseSceneProgress(course(),h.run.timeline.cursor.date)
 return {h,course,progress}
}

/** Isolated real-command boundary, not evidence of a normally financed campaign. */
function preparation(){
 const h=createCourseFixture(),course=()=>projectCourse(h.run,h.course)!,progress=()=>courseSceneProgress(course(),h.run.timeline.cursor.date)
 return {h,course,progress}
}
it('keeps teaching preparation unavailable before its public era and never changes a run by inspecting it',()=>{
 const p=preparation(),before=p.h.codec.export(p.h.run)
 expect(p.progress()).toBeNull();expect(p.h.codec.export(p.h.run)).toBe(before)
 p.h.send('AdvanceTime',{date:'2022-11-30'})
 const arrived=p.h.codec.export(p.h.run)
 expect(p.progress()?.preparation).toEqual({phase:'fund'})
 expect(p.progress()?.choice.line).toContain('样课、招生和收入都还没有发生')
 expect(p.h.codec.export(p.h.run)).toBe(arrived)
})
it('moves through actual funding, future scheduling, real completion and separately confirmed activation',()=>{
 const p=normalPreparation()
 p.h.send('OpenCourseStudio',{capitalFen:500000})
 const business=p.course().businesses[0]!
 expect(p.progress()?.preparation).toEqual({phase:'outline',businessId:business.id})
 expect(business.metrics.incomeFen).toBe(0);expect(business.funds.cashFen).toBe(500000)
 p.h.send('StartCourseOutline',{businessId:business.id,resources:['player-production'],startAt:'2022-12-02'})
 expect(p.progress()).toMatchObject({preparation:{phase:'waiting',businessId:business.id},waitDate:'2022-12-02'})
 expect(p.progress()?.line).toContain('尚未开始')
 expect(p.course().businesses[0]!.prepared).toBe(false)
 p.h.send('AdvanceTime',{date:'2022-12-02'})
 expect(p.progress()?.waitDate).toBe('2022-12-09')
 expect(p.progress()?.line).toContain('写作已经开始')
 p.h.send('AdvanceTime',{date:'2022-12-09'})
 expect(p.progress()?.preparation).toEqual({phase:'activate',businessId:business.id})
 expect(p.course().businesses[0]!.lifecycle).toBe('preparing')
 expect(p.course().businesses[0]!.metrics.incomeFen).toBe(0)
 p.h.send('ActivateBusiness',{businessId:business.id})
 expect(p.course().businesses[0]!.lifecycle).toBe('operating')
 expect(p.progress()?.preparation).toBeUndefined();expect(p.course().cohorts).toHaveLength(0)
 expect(p.progress()?.recordId).toBe(business.id+'-define')
 expect(p.course().businesses[0]!.funds.cashFen).toBe(490000)
},20000)
it('keeps an actually interrupted outline as unfinished and offers a newly paid arrangement',()=>{
 const p=normalPreparation();p.h.send('OpenCourseStudio',{capitalFen:500000})
 const business=p.course().businesses[0]!
 p.h.send('StartCourseOutline',{businessId:business.id,resources:['player-production'],startAt:'2022-11-30'})
 const job=p.course().outlines[0]!.job!
 p.h.send('InterruptJob',{jobId:job.id})
 expect(p.progress()?.preparation).toEqual({phase:'outline',businessId:business.id})
 expect(p.course().businesses[0]!.metrics.costFen).toBe(10000)
 expect(p.course().businesses[0]!.prepared).toBe(false)
})
it('does not confuse a generic business preparation or a completed old studio with this new teaching outline',()=>{
 const p=normalPreparation();p.h.send('OpenCourseStudio',{capitalFen:500000})
 const before=p.h.codec.export(p.h.run),publicCourse=p.course(),business=publicCourse.businesses[0]!
 // Public display variants only; neither variant is imported or claimed as an accepted command.
 const generic={...publicCourse,businesses:[{...business,prepared:true}]}
 expect(courseSceneProgress(generic,'2022-11-30')?.preparation?.phase).toBe('outline')
 const closed={...publicCourse,businesses:[{...business,lifecycle:'closed' as const}]}
 expect(courseSceneProgress(closed,'2022-11-30')?.preparation).toBeUndefined()
 expect(courseSceneProgress(closed,'2022-11-30')?.choice.title).toContain('原课程')
 expect(p.h.codec.export(p.h.run)).toBe(before)
})
it('shows picking as picking, never a completed outline or a default money/resource commitment',async()=>{
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d11-preparation-display'})
 let id=0
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess(),id:()=>`d11-preparation-${++id}`})
 try{
  await controller.initialize();await controller.importNew(codec.export(beforeStudio))
  const view=controller.snapshot.view!,props:GamePanelProps={controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request:()=>{throw Error('DISPLAY_MUST_NOT_SUBMIT')}}
  const before=controller.exportSaved(),fund=renderToStaticMarkup(<CoursePreparation p={props} step={{phase:'fund'}}/>)
  expect(fund).toContain('aria-label="选择这次留给教室的自有资金"')
  expect(fund).not.toContain('aria-pressed="true"');expect(fund).not.toContain('data-state="done"')
  expect(fund).toContain('不是成本或收入');expect(fund).toContain('看看和调整都不会转账')
  expect(fund).toContain('留出¥5,000准备教室')
  const outline=renderToStaticMarkup(<CoursePreparation p={props} step={{phase:'outline'}}/>)
  expect(outline).toContain('先选执笔人和日期');expect(outline).not.toContain('aria-pressed="true"')
  const waiting=renderToStaticMarkup(<CoursePreparationTrail step={{phase:'waiting'}}/>)
  expect(waiting.match(/data-state="done"/g)).toHaveLength(1)
  expect(controller.exportSaved()).toBe(before)
 }finally{await controller.close();await store.close()}
})
