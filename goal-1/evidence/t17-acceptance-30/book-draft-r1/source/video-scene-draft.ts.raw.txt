import type {VideoSceneTarget} from './video-scene-progress.ts'

export type VideoSceneDraft={channelId:string;clientId:string;cohortId:string;modeId:string;materialId:string;resource:string;startAt:string;productId:string;name:string;segment:string;monetization:string;label:boolean}

export const emptyVideoSceneDraft=(channelId=''):VideoSceneDraft=>({channelId,clientId:'',cohortId:'',modeId:'',materialId:'',resource:'',startAt:'',productId:'',name:'',segment:'',monetization:'',label:false})

/** Sections change the page being read, not the identity of the unfinished choice. */
export function videoSceneDraftKey(runId:string,accountId:string,target:VideoSceneTarget|undefined):string{
 return JSON.stringify([runId,accountId,target?.channelId??'',target?.workId??'',target?.contractId??'',target?.marketingId??''])
}

export interface VideoSceneDraftMemory{
 read(runId:string,accountId:string,target:VideoSceneTarget|undefined):VideoSceneDraft|undefined
 write(runId:string,accountId:string,target:VideoSceneTarget|undefined,draft:VideoSceneDraft):boolean
}

/** Owned by one mounted life; no save, command, permission or random state is accessed. */
export function createVideoSceneDraftMemory(runId:string):VideoSceneDraftMemory{
 const drafts=new Map<string,VideoSceneDraft>()
 return {
  read(requestedRunId,accountId,target){
   if(requestedRunId!==runId)return undefined
   const draft=drafts.get(videoSceneDraftKey(runId,accountId,target))
   return draft?{...draft}:undefined
  },
  write(requestedRunId,accountId,target,draft){
   if(requestedRunId!==runId)return false
   drafts.set(videoSceneDraftKey(runId,accountId,target),{...draft})
   return true
  },
 }
}
