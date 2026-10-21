import {beforeAll,expect,it} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {GameController} from '../application/game-controller.ts'
import {IndexedDbRunStore} from '../persistence/indexeddb.ts'
import {MemoryWriterAccess} from '../testing/memory-writer-access.ts'
import {abortAfterHeadWrite} from '../testing/abort-after-write.ts'
import {createCourseFixture} from '../testing/course-fixture.ts'
import {committedEcho} from './SceneEcho.tsx'
import {savedSceneResult} from './scene-result.ts'
import {keepPreparationWorkspace,type PreparationWorkspaceContext} from './App.tsx'
import type {PlayingView} from './game-types.ts'

let materialCase:ReturnType<typeof prepareLicensedCase>
let saved:{previous:PlayingView;current:PlayingView;raw:string}
const workspace=(view:PlayingView):PreparationWorkspaceContext=>({runId:view.runId,screen:'course',accountId:'personal',open:true,epoch:7})

function prepareLicensedCase(){
 // This isolated fixture omits normal wages/living/maintenance. The paid, licensed
 // video case and the course preparation still use their actual original commands.
 const h=createCourseFixture({seed:'d11-course-material-draft'}),send=h.send
 send('AdvanceTime',{date:'2022-08-22'})
 send('OpenVideoChannel',{name:'已授权案例',segment:'ai_learners'})
 const channel=h.run.video!.channels[0]!
 send('ApplyVideoProgram',{channelId:channel.id,program:'image_rights',resources:['player-production'],startAt:'2022-08-22'})
 send('AdvanceTime',{date:'2022-08-29'})
 send('DecideVideoProgram',{applicationId:h.run.video!.applications[0]!.id})
 send('AdvanceTime',{date:'2022-12-01'})
 send('StartVideoMarketing',{channelId:channel.id,resources:['player-production'],startAt:'2022-12-01'})
 send('AdvanceTime',{date:'2022-12-08'})
 const audience=h.run.video!.cohorts[0]!
 send('AcceptVideoCommission',{channelId:channel.id,cohortId:audience.id,clientId:audience.qualifiedMembers[0],modeId:'image_assisted',materialId:'licensed',resources:['player-production'],startAt:'2022-12-08'})
 const contract=h.run.video!.contracts[0]!
 send('AdvanceTime',{date:'2022-12-15'})
 send('ReviewVideoOutput',{workId:contract.workId,disclosure:'ai_assisted'})
 send('SubmitVideoCommission',{contractId:contract.id})
 send('AdvanceTime',{date:'2022-12-24'})
 send('DiscoverBusiness',{definitionId:'course-studio'})
 const business=h.run.operations!.businesses.find(row=>row.definitionId==='course-studio')!
 send('PrepareBusiness',{businessId:business.id})
 send('StartCourseOutline',{businessId:business.id,resources:['player-production'],startAt:'2022-12-24'})
 send('AdvanceTime',{date:'2022-12-31'})
 send('ActivateBusiness',{businessId:business.id})
 send('AdvanceTime',{date:'2023-01-01'})
 expect(h.run.origin).toBe('fixture')
 expect(h.run.video!.contracts[0]!).toMatchObject({status:'settled',settledAt:'2022-12-24'})
 expect(h.run.video!.works.find(row=>row.id===contract.workId)!.materialId).toBe('licensed')
 return {codec:h.codec,raw:h.codec.export(h.run),runId:h.run.runId,payload:{businessId:business.id,caseKind:'video',caseId:contract.id,resources:['player-production'],startAt:'2023-01-01'}}
}

beforeAll(async()=>{
 materialCase=prepareLicensedCase()
 const store=new IndexedDbRunStore({codec:materialCase.codec,factory:new IDBFactory(),keyRange:IDBKeyRange,name:'d11-app-license-saved'})
 let id=0
 const controller=new GameController({codec:materialCase.codec,store,locks:new MemoryWriterAccess(),id:()=>`d11-license-${++id}`})
 try{
  await controller.initialize();await controller.importNew(materialCase.raw)
  const previous=controller.snapshot.view!,command=controller.prepare('LicenseCourseMaterials',materialCase.payload)
  expect(controller.preview(command)).toMatchObject({allowed:true,actionPoints:1,upfrontCostFen:30000})
  expect((await controller.submit(command)).status).toBe('saved')
  saved={previous,current:controller.snapshot.view!,raw:controller.exportSaved()}
 }finally{await controller.close()}
},20000)

it('retains the open course context only after the actual materials preparation saves, without creating a course or completing the licence',()=>{
 const {previous,current,raw}=saved,origin=workspace(previous),before=materialCase.codec.import(materialCase.raw),after=materialCase.codec.import(raw)
 expect(keepPreparationWorkspace('saved','LicenseCourseMaterials',previous,current,origin,origin)).toBe(true)
 expect(current.revision).toBe(previous.revision+1)
 expect(current.accounts.find(row=>row.accountId==='personal')!.cashFen).toBe(previous.accounts.find(row=>row.accountId==='personal')!.cashFen-30000)
 expect(current.budget.spent).toBe(previous.budget.spent+1)
 expect(after.course!.courses).toEqual(before.course!.courses)
 expect(after.course!.licenses).toHaveLength(1)
 const job=after.operations!.jobs.find(row=>row.id===after.course!.licenses[0]!.jobId)!
 expect(job).toMatchObject({status:'running',startAt:'2023-01-01',completeAt:'2023-01-08'})
 expect(after.receipts).toHaveLength(before.receipts.length+1)
 expect(after.receipts.at(-1)!.kind).toBe('LicenseCourseMaterials')
 expect(materialCase.codec.export(after)).toBe(raw)
})

it('does not turn the retention exception into a general saved-command rule',()=>{
 const {previous,current}=saved,origin=workspace(previous)
 for(const kind of ['GrantCourseMaterials','StartCourseOutline','DefineCourse','OpenCourseStudio','EnrollCourseAudience','PlaceStockOrder','FundBusiness','SetHengxingAuthority'])expect(keepPreparationWorkspace('saved',kind,previous,current,origin,origin),kind).toBe(false)
 expect(keepPreparationWorkspace('saved','LicenseCourseMaterials',previous,current,{...origin,screen:'video'},{...origin,screen:'video'})).toBe(false)
})

it('does not retain or revive another life, page, account, reopened book or failed save',()=>{
 const {previous,current}=saved,origin=workspace(previous)
 for(const status of ['saving','unsaved','conflict','duplicate','rejected'])expect(keepPreparationWorkspace(status,'LicenseCourseMaterials',previous,current,origin,origin),status).toBe(false)
 for(const active of [{...origin,runId:'another-life'},{...origin,screen:'video' as const},{...origin,accountId:'another-account'},{...origin,open:false},{...origin,epoch:origin.epoch+2}])expect(keepPreparationWorkspace('saved','LicenseCourseMaterials',previous,current,origin,active)).toBe(false)
 expect(keepPreparationWorkspace('saved','LicenseCourseMaterials',previous,current,{...origin,open:false},origin)).toBe(false)
 const foreign={...origin,accountId:'not-controlled'}
 expect(keepPreparationWorkspace('saved','LicenseCourseMaterials',previous,current,foreign,foreign)).toBe(false)
 for(const view of [{...current,runId:'another-life'},{...current,revision:previous.revision},{...current,saveStatus:'saving' as const},{...current,saveStatus:'unsaved' as const},{...current,hasCandidate:true},{...current,readOnly:true}])expect(keepPreparationWorkspace('saved','LicenseCourseMaterials',previous,view,origin,origin)).toBe(false)
 expect(keepPreparationWorkspace('saved','LicenseCourseMaterials',null,current,origin,origin)).toBe(false)
})

it('keeps a real head-write abort private and saves the same candidate on retry without reopening the dismissed book or charging twice',async()=>{
 const {codec,raw,runId,payload}=materialCase,factory=new IDBFactory(),name='d11-app-license-abort'
 const store=new IndexedDbRunStore({codec,factory,keyRange:IDBKeyRange,name})
 await store.importSave(raw,{mode:'create',actorId:'player',importId:'d11-original'})
 const fault=abortAfterHeadWrite(factory,name),failing=new IndexedDbRunStore({codec,factory:fault.factory,keyRange:IDBKeyRange,name})
 const controller=new GameController({codec,store:failing,locks:new MemoryWriterAccess(),id:()=> 'd11-original-license'})
 try{
  await controller.initialize();await controller.continueLife(runId)
  const previous=controller.snapshot.view!,origin=workspace(previous),command=controller.prepare('LicenseCourseMaterials',payload)
  expect((await controller.submit(command)).status).toBe('unsaved')
  const failed=controller.snapshot.view!
  expect(failed.revision).toBe(previous.revision)
  expect(failed.accounts).toEqual(previous.accounts)
  expect(failed.budget).toEqual(previous.budget)
  expect(controller.exportSaved()).toBe(raw)
  expect(codec.export((await store.load(runId))!.run)).toBe(raw)
  expect(keepPreparationWorkspace('unsaved','LicenseCourseMaterials',previous,failed,origin,origin)).toBe(false)
  const candidate=controller.exportCandidate(),closed={...origin,open:false,epoch:origin.epoch+1}
  expect((await controller.retry()).status).toBe('saved')
  const current=controller.snapshot.view!
  expect(controller.exportSaved()).toBe(candidate)
  expect(codec.export((await store.load(runId))!.run)).toBe(candidate)
  expect(keepPreparationWorkspace('saved','LicenseCourseMaterials',previous,current,closed,closed)).toBe(false)
  expect(keepPreparationWorkspace('saved','LicenseCourseMaterials',previous,current,origin,{...closed,accountId:'another-visible-account'})).toBe(false)
  expect(committedEcho(previous,current)).not.toBeNull()
  expect(savedSceneResult('LicenseCourseMaterials','安排课程素材使用范围',previous,current)).toContain('安排课程素材使用范围')
  expect((await controller.submit(command)).status).toBe('duplicate')
  expect(controller.exportSaved()).toBe(candidate)
  expect(fault.trace).toMatchObject({writeSucceeded:true,abortIssued:true})
 }finally{await controller.close();await store.close()}
},20000)
