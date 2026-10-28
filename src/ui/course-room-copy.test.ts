import {afterAll,beforeAll,expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import {courseRoomCopy} from './course-room-copy.ts'
import {courseSceneProgress} from './course-scene-progress.ts'
import {courseSceneContext} from './course-player-thread.ts'
import raw from '../../goal-1/evidence/t17-acceptance-39/same-run-course-relay-r73/stage-b-normal.json?raw'

let controller:GameController,store:IndexedDbRunStore,p:Pick<GamePanelProps,'view'|'features'>
let target:Extract<CourseSceneTarget,{kind:'cohort'}>
beforeAll(async()=>{
 const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'cux09-course-room-copy'})
 controller=new GameController({codec,store,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(raw)
 const view=controller.snapshot.view!;p={view,features:view.features as unknown as PlayFeatures}
 target={kind:'cohort',businessId:'ops:70e0cadd5330feff20f003b459bec5aa',courseId:'crs:60aafe5da1d987ede4868ffc2c3a469f',cohortId:'crs:179bc59c6ed7ab5eb7ab116ab5979a0e'}
})
afterAll(async()=>{await controller?.close(true);await store?.close()})

it('describes the actual next teaching segment and paid learners without repeating the long course identity',()=>{
 const copy=courseRoomCopy(p,target)!,name=p.features.course!.courses.find(c=>c.id===target.courseId)!.name
 expect(copy.title).toBe('第2段教学，已经安排。')
 expect(copy.context).toContain('5名留存学员 · 已交出1/2段')
 expect(copy.context).toContain('原支持和退款期限继续')
 expect(copy.line).toContain('2025-04-10—2025-04-17')
 expect(copy.line).toContain('尚未实际开工');expect(copy.line).not.toContain(name)
 expect(copy.terms).toContain('本人制作/教学时间 · ¥0 / 1点 / 7日')
 expect(copy.terms).toContain('已预留，尚未实付或使用行动');expect(copy.terms).toContain('释放原保护、确认收入；不再收费')
 const original=courseSceneProgress(p.features.course,p.view.date,target,courseSceneContext(p))!
 expect(original.line).toContain(name)
 expect(original.choice.line).toContain('已预留，尚未实付或使用行动')
 expect(controller.exportSaved()).toBe(raw)
})

it('keeps unknown resource details on the complete original narration instead of publishing a shortened zero-cost promise',()=>{
 const missing={...p,features:{...p.features,course:{...p.features.course!,resources:[]}}}
 expect(courseRoomCopy(missing,target)).toBeNull()
 expect(controller.exportSaved()).toBe(raw)
})

it('keeps an explicitly opened original teaching attempt on its complete original narration',()=>{
 const co=p.features.course!.cohorts.find(c=>c.id===target.cohortId)!,oldJob=co.stageJobs[0]![0]!
 expect(courseRoomCopy(p,{...target,jobId:oldJob.id})).toBeNull()
 expect(controller.exportSaved()).toBe(raw)
})

it('does not replace a missing or wrong-owner cohort with another available class',()=>{
 expect(courseRoomCopy(p,{...target,cohortId:'missing-original-class'})).toBeNull()
 expect(courseRoomCopy(p,{...target,businessId:'another-business'})).toBeNull()
 expect(courseRoomCopy(p,null)).toBeNull()
 expect(controller.exportSaved()).toBe(raw)
})
