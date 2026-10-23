import {useRef,useState,type Dispatch,type SetStateAction} from 'react'

export type CourseTeachingDraftSlot='capital'|'audience'|'plan'|'enroll'|'stage:0'|'stage:1'|'recovery'|'refund'|'refresh'
export interface CourseTeachingDraftScope{
 readonly accountId:string
 readonly businessId:string
 readonly courseId:string
 readonly audienceId:string|null
 readonly cohortId:string|null
 readonly slot:CourseTeachingDraftSlot
}
export interface CourseTeachingDraft{
 capital:string
 price:string
 audienceMode:string
 sourceIds:string[]
 resources:string[]
 startAt:string
 endAt:string
 supportStartAt:string
 seatLimit:string
 supportMode:string
 deploymentId:string|null
 promise:string
 personIds:string[]
 reason:string
}
export const emptyCourseTeachingDraft=():CourseTeachingDraft=>({capital:'',price:'',audienceMode:'',sourceIds:[],resources:[],startAt:'',endAt:'',supportStartAt:'',seatLimit:'',supportMode:'',deploymentId:null,promise:'',personIds:[],reason:''})
const copy=(draft:CourseTeachingDraft):CourseTeachingDraft=>({...draft,sourceIds:[...draft.sourceIds],resources:[...draft.resources],personIds:[...draft.personIds]})
/** Page, current date and saved revision do not change the chosen teaching slot. */
export function courseTeachingDraftKey(runId:string,scope:CourseTeachingDraftScope):string{
 return JSON.stringify([runId,scope.accountId,scope.businessId,scope.courseId,scope.audienceId,scope.cohortId,scope.slot])
}
export interface CourseTeachingDraftMemory{
 read(runId:string,scope:CourseTeachingDraftScope):CourseTeachingDraft|undefined
 write(runId:string,scope:CourseTeachingDraftScope,draft:CourseTeachingDraft):boolean
}
/** One mounted run owns this UI map; it never writes a game save or executes a rule. */
export function createCourseTeachingDraftMemory(runId:string):CourseTeachingDraftMemory{
 const drafts=new Map<string,CourseTeachingDraft>()
 return {
  read(requestedRunId,scope){if(requestedRunId!==runId)return undefined;const draft=drafts.get(courseTeachingDraftKey(runId,scope));return draft?copy(draft):undefined},
  write(requestedRunId,scope,draft){if(requestedRunId!==runId)return false;drafts.set(courseTeachingDraftKey(runId,scope),copy(draft));return true},
 }
}
/** Both original book and scene read the latest same-slot edits, including functional updates in one event. */
export function useCourseTeachingDraft(runId:string,scope:CourseTeachingDraftScope,memory?:CourseTeachingDraftMemory,initial:CourseTeachingDraft=emptyCourseTeachingDraft()):readonly [CourseTeachingDraft,Dispatch<SetStateAction<CourseTeachingDraft>>]{
 const key=courseTeachingDraftKey(runId,scope),read=()=>memory?.read(runId,scope)??copy(initial)
 const [stored,setStored]=useState(()=>({key,draft:read()})),draft=memory?.read(runId,scope)??(stored.key===key?stored.draft:read()),latest=useRef({key,draft})
 latest.current={key,draft}
 const update:Dispatch<SetStateAction<CourseTeachingDraft>>=value=>{
  const previous=memory?.read(runId,scope)??(latest.current.key===key?latest.current.draft:read()),next=copy(typeof value==='function'?value(copy(previous)):value)
  memory?.write(runId,scope,next);latest.current={key,draft:next};setStored({key,draft:next})
 }
 return [draft,update]
}
