import {expect,it} from 'vitest'
import {createVideoSceneDraftMemory,videoSceneDraftKey,type VideoSceneDraft} from './video-scene-draft.ts'
import type {VideoSceneTarget} from './video-scene-progress.ts'

const run='life-a',account='personal'
const target:VideoSceneTarget={channelId:'channel-a',workId:'work-a',contractId:'contract-a'}
const ready=():VideoSceneDraft=>({channelId:'channel-a',clientId:'chosen-client',cohortId:'earned-cohort',modeId:'image_assisted',materialId:'licensed',resource:'employee-a',startAt:'2023-01-09',productId:'commercial',name:'留给这位客户的作品',segment:'local_merchants',monetization:'none',label:true})

it('recovers the same filled choice after looking at another section of its original record',()=>{
 const memory=createVideoSceneDraftMemory(run),draft=ready()
 expect(memory.read(run,account,target)).toBeUndefined()
 expect(memory.write(run,account,target,draft)).toBe(true)
 const returnTarget:VideoSceneTarget={contractId:'contract-a',section:'making',workId:'work-a',channelId:'channel-a'}
 expect(videoSceneDraftKey(run,account,returnTarget)).toBe(videoSceneDraftKey(run,account,target))
 expect(memory.read(run,account,returnTarget)).toEqual(draft)
 expect(memory.read(run,account,target)).toEqual(draft)
})

it('rejects another life and gives a newly created memory no draft from the previous instance',()=>{
 const memory=createVideoSceneDraftMemory(run),draft=ready()
 expect(memory.write(run,account,target,draft)).toBe(true)
 expect(memory.read('life-b',account,target)).toBeUndefined()
 expect(memory.write('life-b',account,target,{...draft,clientId:'another-life-client'})).toBe(false)
 expect(memory.read(run,account,target)?.clientId).toBe('chosen-client')
 expect(createVideoSceneDraftMemory(run).read(run,account,target)).toBeUndefined()
 const nextLife=createVideoSceneDraftMemory('life-b')
 expect(nextLife.write('life-b',account,target,{...draft,clientId:'next-life-client'})).toBe(true)
 expect(nextLife.read(run,account,target)).toBeUndefined()
 expect(memory.read(run,account,target)?.clientId).toBe('chosen-client')
})

it('keeps entry, account, channel, work, contract and marketing choices in separate slots',()=>{
 const memory=createVideoSceneDraftMemory(run)
 const scopes:readonly {accountId:string;target:VideoSceneTarget|undefined}[]=[
  {accountId:account,target:undefined},
  {accountId:account,target:{channelId:'channel-a'}},
  {accountId:account,target:{channelId:'channel-b'}},
  {accountId:account,target:{channelId:'channel-a',workId:'work-a'}},
  {accountId:account,target:{channelId:'channel-a',workId:'work-b'}},
  {accountId:account,target},
  {accountId:account,target:{...target,contractId:'contract-b'}},
  {accountId:account,target:{channelId:'channel-a',marketingId:'marketing-a'}},
  {accountId:account,target:{channelId:'channel-a',marketingId:'marketing-b'}},
  {accountId:'company-a',target},
 ]
 for(const [index,scope] of scopes.entries()){
  expect(memory.read(run,scope.accountId,scope.target)).toBeUndefined()
  expect(memory.write(run,scope.accountId,scope.target,{...ready(),clientId:'explicit-choice-'+index})).toBe(true)
 }
 for(const [index,scope] of scopes.entries())expect(memory.read(run,scope.accountId,scope.target)?.clientId).toBe('explicit-choice-'+index)
})

it('copies writes and reads so editing a returned or old draft cannot change the remembered choice',()=>{
 const memory=createVideoSceneDraftMemory(run),input=ready()
 memory.write(run,account,target,input)
 input.clientId='uncommitted-edit'
 const first=memory.read(run,account,target)!
 expect(first).not.toBe(input)
 expect(first.clientId).toBe('chosen-client')
 first.startAt='2023-01-25'
 const second=memory.read(run,account,target)!
 expect(second).not.toBe(first)
 expect(second.startAt).toBe('2023-01-09')
 const adjusted={...second,resource:'player-production'}
 memory.write(run,account,target,adjusted)
 adjusted.resource='later-local-edit'
 expect(memory.read(run,account,target)?.resource).toBe('player-production')
 expect(second.resource).toBe('employee-a')
})
