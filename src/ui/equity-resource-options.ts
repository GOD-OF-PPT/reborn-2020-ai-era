import type {WorkerInstance} from '../core/operations-types.ts'
import {courseResourceLabel} from './course-resource-labels.ts'

/** Presentation only: every published resource remains bound to its original ID. */
export function equityResourceOptions(resources:readonly {readonly id:string;readonly label:string}[],workers:readonly WorkerInstance[]|undefined){
 return resources.map(resource=>({id:resource.id,label:resource.id==='player-production'?'由我自己来做':courseResourceLabel(resource.id,resources,workers)}))
}
