import {useState} from 'react'
import {emptyVideoSceneDraft,videoSceneDraftKey,type VideoSceneDraft,type VideoSceneDraftMemory} from './video-scene-draft.ts'
import type {VideoSceneTarget} from './video-scene-progress.ts'

/** Draft edits are local UI only; source/target guards stay with the caller. */
export function useVideoSceneDraft(runId:string,accountId:string,target:VideoSceneTarget|undefined,memory:VideoSceneDraftMemory|undefined,options:{fallback?:VideoSceneDraft;canEdit:()=>boolean}):readonly [VideoSceneDraft,(patch:Partial<VideoSceneDraft>)=>void]{
 const scope=videoSceneDraftKey(runId,accountId,target)
 const read=()=>memory?.read(runId,accountId,target)??options.fallback??emptyVideoSceneDraft(target?.channelId)
 const [stored,setStored]=useState(()=>({scope,draft:read()}))
 const draft=stored.scope===scope?stored.draft:read()
 const edit=(patch:Partial<VideoSceneDraft>)=>{
  if(!options.canEdit())return
  const next={...draft,...patch}
  if(memory&&!memory.write(runId,accountId,target,next))return
  setStored({scope,draft:next})
 }
 return [draft,edit]
}
