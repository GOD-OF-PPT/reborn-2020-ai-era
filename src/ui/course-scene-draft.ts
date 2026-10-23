import {useRef,useState,type Dispatch,type SetStateAction} from 'react'

export type CourseDraftCase={kind:'first_order'|'video';id:string}
export type CourseSceneDraftSlot='entry'|'outline'|'definition'|'sample'|`license:${CourseDraftCase['kind']}:${string}`
export interface CourseSceneDraftScope{
 readonly accountId:string
 readonly businessId:string|null
 readonly courseId:string|null
 readonly slot:CourseSceneDraftSlot
}
export interface CourseSceneDraft{
 capital:string
 name:string
 productId:string
 topicId:string
 segment:string
 consent:boolean
 cases:CourseDraftCase[]
 resources:string[]
 startAt:string
}
export const emptyCourseSceneDraft=():CourseSceneDraft=>({capital:'',name:'',productId:'',topicId:'',segment:'',consent:false,cases:[],resources:[],startAt:''})
const copyDraft=(draft:CourseSceneDraft):CourseSceneDraft=>({...draft,cases:draft.cases.map(ref=>({...ref})),resources:[...draft.resources]})

/** Reading pages, revisions and dates do not create a new business choice. */
export function courseSceneDraftKey(runId:string,scope:CourseSceneDraftScope):string{
 return JSON.stringify([runId,scope.accountId,scope.businessId,scope.courseId,scope.slot])
}
export interface CourseSceneDraftMemory{
 read(runId:string,scope:CourseSceneDraftScope):CourseSceneDraft|undefined
 write(runId:string,scope:CourseSceneDraftScope,draft:CourseSceneDraft):boolean
}
/** One mounted life owns this map. It does not store, validate or execute game state. */
export function createCourseSceneDraftMemory(runId:string):CourseSceneDraftMemory{
 const drafts=new Map<string,CourseSceneDraft>()
 return {
  read(requestedRunId,scope){
   if(requestedRunId!==runId)return undefined
   const draft=drafts.get(courseSceneDraftKey(runId,scope))
   return draft?copyDraft(draft):undefined
  },
  write(requestedRunId,scope,draft){
   if(requestedRunId!==runId)return false
   drafts.set(courseSceneDraftKey(runId,scope),copyDraft(draft))
   return true
  },
 }
}

/** Both the scene and original book use the same slot; stale dates remain visible. */
export function useCourseSceneDraft(runId:string,scope:CourseSceneDraftScope,memory?:CourseSceneDraftMemory,initial:CourseSceneDraft=emptyCourseSceneDraft()):readonly [CourseSceneDraft,Dispatch<SetStateAction<CourseSceneDraft>>]{
 const key=courseSceneDraftKey(runId,scope),read=()=>memory?.read(runId,scope)??copyDraft(initial)
 const [stored,setStored]=useState(()=>({key,draft:read()})),draft=memory?.read(runId,scope)??(stored.key===key?stored.draft:read())
 const latest=useRef({key,draft})
 latest.current={key,draft}
 const update:Dispatch<SetStateAction<CourseSceneDraft>>=value=>{
  const previous=memory?.read(runId,scope)??(latest.current.key===key?latest.current.draft:read())
  const next=copyDraft(typeof value==='function'?value(copyDraft(previous)):value)
  memory?.write(runId,scope,next)
  latest.current={key,draft:next}
  setStored({key,draft:next})
 }
 return [draft,update]
}
