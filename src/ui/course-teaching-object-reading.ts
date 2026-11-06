import type {GamePanelProps} from './game-types.ts'
import {courseObjectReading,type CourseObjectReading} from './course-object-reading.ts'
import {courseTargetReason,type CourseSceneTarget} from './course-scene-progress.ts'

const rootKey=(target:CourseSceneTarget)=>JSON.stringify(target.kind==='course'?{kind:'course',businessId:target.businessId,courseId:target.courseId}:target)

/** Reuse the exact original teaching record set; a course stays its original bare course target. */
export function courseTeachingObjectReading(p:GamePanelProps,target:CourseSceneTarget|null,records:readonly CourseSceneTarget[]):CourseObjectReading|null{
 const original=courseObjectReading(p,target)
 if(!original)return null
 const entries:CourseObjectReading['entries'][number][]=[]
 for(const entry of original.entries){
  if(!['course','audience','cohort'].includes(entry.target.kind))continue
  const matches=records.filter(record=>rootKey(record)===rootKey(entry.target))
  if(matches.length>1)return null
  if(matches.length===0)continue
  const record=matches[0]!
  if(courseTargetReason(p.features.course,record,{operations:p.view.operations}))return null
  entries.push({...entry,target:record,key:JSON.stringify(record)})
 }
 return entries.length?{...original,key:JSON.stringify([original.key,'teaching']),entries}:null
}
