import type {WorkerInstance} from '../core/operations-types.ts'

const workerNames:Readonly<Record<string,string>>={'assistant-zhou':'周助理','editor-lin':'林剪辑员'}

/** Labels only: retain the command's original resource when it is no longer selectable. */
export function courseResourceLabel(id:string,resources:readonly {readonly id:string;readonly label:string}[],workers:readonly WorkerInstance[]|undefined):string{
 const resource=resources.find(r=>r.id===id)
 if(id==='player-production'&&resource)return '由我自己来教'
 const worker=workers?.find(w=>w.id===id),name=worker?workerNames[worker.definitionId]:undefined
 if(worker&&name){
  const label=name+' · '+worker.from+'入职（按实际日期计薪）'
  return resource?label:label+' · 原资源现不可用（'+id+'）'
 }
 return resource?resource.label+'（'+id+'）':'原资源现不可用（'+id+'）'
}
