import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {OpeningMoment,courseStageWaitDate} from './OpeningMoment.tsx'
import {roomMoment} from './RoomMoment.tsx'
import {courseFocusFor,courseSceneContext} from './course-player-thread.ts'
import {courseSceneProgress} from './course-scene-progress.ts'
import raw95 from '../../goal-1/evidence/t17-acceptance-25/chrome-recover-r3/c2-physical-readonly95-stage1.json?raw'
import raw92 from '../../goal-1/evidence/t17-acceptance-25/chrome-r3/c2-saved92-enrolled-protected.json?raw'

// These are actual saved browser inputs. No Create replay or business command is executed here.
async function scene(raw:string,name:string){
 const codec=createCampaignCodec(),store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'c2-optional-wait-'+name})
 const controller=new GameController({codec,store,locks:new MemoryWriterAccess()}),request=vi.fn()
 await controller.initialize();await controller.importNew(raw)
 const view=controller.snapshot.view!,features=view.features as unknown as PlayFeatures,co=features.course!.cohorts.find(co=>co.startAt==='2023-01-26')!,lesson=features.course!.courses.find(c=>c.id===co.courseId)!,business=features.course!.businesses.find(b=>b.id===lesson.businessId)!
 const p:GamePanelProps={controller,view,features,accountId:business.accountId,request},target={kind:'cohort' as const,businessId:business.id,courseId:lesson.id,cohortId:co.id}
 const progress=courseSceneProgress(features.course,view.date,target,courseSceneContext(p))!,focus=courseFocusFor(p,target,business.accountId)
 const render=(current=p,focusRequiresChoice=false)=>renderToStaticMarkup(<OpeningMoment p={current} focus={focus} focusRequiresChoice={focusRequiresChoice} onFocus={vi.fn()} headingRef={null} fallback={roomMoment(current)} onNavigate={vi.fn()} onExplore={vi.fn()}/>)
 return {p,target,progress,request,render,raw:()=>controller.exportSaved(),close:async()=>{await controller.close();await store.close()}}
}

it('keeps the actual95 second-stage choice and offers only the original Feb10 clock beside it, with writer locks intact',async()=>{
 const h=await scene(raw95,'actual95')
 try{
  const {p,progress}=h,before=h.raw()
  expect(p.view).toMatchObject({origin:'normal',revision:95,date:'2023-02-05'});expect(p.view.budget.available).toBe(1)
  expect(progress).toMatchObject({phase:'course-stage-needed',stage:{index:1,dueAt:'2023-04-20',days:10}})
  expect(p.features.workbench.progression.nextDate).toBe('2023-02-10')
  expect(courseStageWaitDate(p.features.workbench,p.view.date,progress)).toBe('2023-02-10')
  const html=h.render();expect(html).toContain('选择第2段资源与日期');expect(html).toContain('不新增安排，让原日子继续 · 2023-02-10');expect(html).not.toContain('先保留这一季的工作')
  // Explicit UI-lock inputs are not newly saved simulations.
  for(const locked of [{...p.view,readOnly:true},{...p.view,hasCandidate:true,saveStatus:'unsaved' as const}]){
   const lockedHtml=h.render({...p,view:locked})
   expect(lockedHtml).toContain('aria-label="不新增安排，让原日子继续 · 2023-02-10" disabled=""')
  }
  expect(h.render(p,true)).not.toContain('不新增安排，让原日子继续')
  expect(h.request).not.toHaveBeenCalled();expect(h.raw()).toBe(before)
 }finally{await h.close()}
})

it('bounds the actual92 first-stage pause at Jan30 and rejects explicit deadline, barrier and wrong-object UI inputs',async()=>{
 const h=await scene(raw92,'actual92')
 try{
  const {p,progress}=h,w=p.features.workbench,before=h.raw()
  expect(p.view).toMatchObject({origin:'normal',revision:92,date:'2023-01-24'})
  expect(progress).toMatchObject({phase:'course-stage-needed',stage:{index:0,days:10}})
  expect(w.progression.nextDate).toBe('2023-01-31');expect(courseStageWaitDate(w,p.view.date,progress)).toBe('2023-01-30')
  const html=h.render();expect(html).toContain('选择第1段资源与日期');expect(html).toContain('不新增安排，让原日子继续 · 2023-01-30')
  // Boundary overrides below test UI policy only, not engine acceptance or a normal history.
  expect(courseStageWaitDate({...w,progression:{...w.progression,quarterTarget:'2023-01-27'}},p.view.date,progress)).toBe('2023-01-27')
  expect(courseStageWaitDate(w,'2023-01-30',progress)).toBeNull()
  expect(courseStageWaitDate(w,'2023-01-31',progress)).toBeNull()
  for(const available of [0,1]){
   const deadlineUI={...p,view:{...p.view,date:'2023-01-30',budget:{...p.view.budget,available}}}
   expect(h.render(deadlineUI)).not.toContain('不新增安排，让原日子继续')
  }
  expect(courseStageWaitDate({...w,atQuarterEnd:true},p.view.date,progress)).toBeNull()
  expect(courseStageWaitDate({...w,pause:{instanceId:'explicit-ui-boundary',reason:'CONTENT_DECISION_PENDING'}},p.view.date,progress)).toBeNull()
  expect(courseStageWaitDate({...w,progression:{...w.progression,requiresDelivery:true}},p.view.date,progress)).toBeNull()
  expect(courseStageWaitDate(w,p.view.date,{...progress,target:{...h.target,cohortId:'unmatched-public-target'}})).toBeNull()
  expect(courseStageWaitDate(w,p.view.date,{...progress,invalidReason:'公开对象不匹配'})).toBeNull()
  expect(courseStageWaitDate(w,p.view.date,{...progress,wait:{date:'2023-01-26',label:'已有原安排'}})).toBeNull()
  expect(h.request).not.toHaveBeenCalled();expect(h.raw()).toBe(before)
 }finally{await h.close()}
})
