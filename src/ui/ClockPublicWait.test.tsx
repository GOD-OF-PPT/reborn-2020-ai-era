import {beforeAll,afterAll,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createCampaignCodec} from '../application/campaign.ts'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {ClockAdvance,type ClockActionBinding} from './ClockAdvance.tsx'
import {courseWaitDate} from './course-wait-date.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import rest from '../../goal-1/evidence/t17-acceptance-39/public-wait-model-r1/reconstructed-original19.json?raw'
import class97 from '../../goal-1/evidence/t17-acceptance-36/chrome-final-r10/f04-final97-question-action-reading-unchanged.json?raw'
let controller:GameController,lesson:GameController,store:IndexedDbRunStore,lessonStore:IndexedDbRunStore
beforeAll(async()=>{
 const codec=createCampaignCodec();store=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'cux09-clock-public-rest'});lessonStore=new IndexedDbRunStore({codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'cux09-clock-public-class'});controller=new GameController({codec,store,locks:new MemoryWriterAccess()});lesson=new GameController({codec,store:lessonStore,locks:new MemoryWriterAccess()});await controller.initialize();await controller.importNew(rest);await lesson.initialize();await lesson.importNew(class97)
})
afterAll(async()=>{await controller?.close();await lesson?.close();await store?.close();await lessonStore?.close()})

it('binds the visible time action to the explicit range callback without changing the run while rendering or choosing',()=>{
 const before=controller.exportSaved(),view=controller.snapshot.view!,wait=vi.fn(),request=vi.fn(),p:GamePanelProps={controller,view,features:view.features as unknown as PlayFeatures,accountId:'personal',request,requestWait:wait};let binding:ClockActionBinding|null=null
 renderToStaticMarkup(<ClockAdvance p={p} date="2020-04-11" label="等这次原安排" renderAction={value=>{binding=value;return value.mainNode}}/>)
 const action=binding as ClockActionBinding|null
 expect(action).not.toBeNull();expect(action!.disabled).toBe(false);action!.activate()
 expect(wait).toHaveBeenCalledTimes(1);expect(wait.mock.calls[0]![0]).toBe('2020-04-11');expect(request).not.toHaveBeenCalled()
 expect(controller.exportSaved()).toBe(before)
})

it('retains the old conservative date without a range observer and keeps the original bound with it',()=>{
 const view=lesson.snapshot.view!,features=view.features as unknown as PlayFeatures,w=features.workbench
 expect(view.date).toBe('2023-01-31')
 expect(courseWaitDate(w,view.date,'2023-03-31')).toBe('2023-02-01')
 expect(courseWaitDate(w,view.date,'2023-03-31',true)).toBe('2023-03-31')
 expect(courseWaitDate({...w,progression:{...w.progression,quarterTarget:'2023-02-10'}},view.date,'2023-03-31',true)).toBe('2023-02-10')
 expect(courseWaitDate({...w,pause:{instanceId:'isolated-paused',reason:'CONTENT_DECISION_PENDING'}},view.date,'2023-03-31',true)).toBeNull()
 const html=renderToStaticMarkup(<ClockAdvance p={{controller:lesson,view,features,accountId:'personal',request:vi.fn(),requestWait:vi.fn()}} date="2023-03-31" label="等原班期的反馈"/>)
 expect(html).toContain('个人已知待付¥8,000')
 expect(html).not.toMatch(/\d+项已知待付/)
})

it('does not dispatch a substituted stale source to either original or range actions',()=>{
 const view=controller.snapshot.view!,wait=vi.fn(),request=vi.fn(),p:GamePanelProps={controller,view:{...view,date:'2020-04-05'},features:view.features as unknown as PlayFeatures,accountId:'personal',request,requestWait:wait};let binding:ClockActionBinding|null=null
 renderToStaticMarkup(<ClockAdvance p={p} date="2020-04-11" label="旧日期的原安排" renderAction={value=>{binding=value;return value.mainNode}}/>)
 const action=binding as ClockActionBinding|null
 expect(action!.disabled).toBe(true);action!.activate();expect(wait).not.toHaveBeenCalled();expect(request).not.toHaveBeenCalled()
})
