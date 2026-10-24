import type {GamePanelProps} from './game-types.ts'

export interface SharedActionBinding{
 readonly label:string
 readonly disabled:boolean
 readonly reason:string|null
 readonly activate:()=>void
}
export interface SharedActionOptions{
 readonly disabled?:boolean
 readonly reason?:string|null
 /** A final read-only check; the original request/preview remains authoritative. */
 readonly canActivate?:()=>boolean
 /** Only for UI choices/reading, never a game-command permission. */
 readonly allowReadOnly?:boolean
}
type Source=Pick<GamePanelProps,'controller'|'view'>

function sourceReason(p:Source,allowReadOnly=false):string|null{
 const snapshot=p.controller.snapshot,current=snapshot.view
 if(snapshot.busy||p.view.busy||current?.busy||p.view.saveStatus==='saving'||current?.saveStatus==='saving')return '正在保存，请等这次记录完成。'
 if(p.view.hasCandidate||current?.hasCandidate||p.view.saveStatus==='unsaved'||current?.saveStatus==='unsaved')return '这一步还未保存，请先处理原候选。'
 if(p.view.saveStatus==='conflict'||current?.saveStatus==='conflict')return '存档冲突尚未处理，请先重新读取。'
 if(!current||current!==p.view||current.runId!==p.view.runId||current.revision!==p.view.revision)return '原画面已经变化，请重新核对当前对象。'
 if(!allowReadOnly&&(p.view.readOnly||current.readOnly))return '当前只读，仍可翻阅原记录。'
 const stableReadOnly=allowReadOnly&&p.view.readOnly&&current.readOnly&&p.view.saveStatus==='read_only'&&current.saveStatus==='read_only'
 if(!stableReadOnly&&(current.saveStatus!=='saved'||p.view.saveStatus!=='saved'))return '原画面已经变化，请重新核对当前对象。'
 return null
}

/** Both visible controls use this activation; it never prepares or submits a command. */
export function makeSharedAction(p:Source,label:string,activate:()=>void,options:SharedActionOptions={}):SharedActionBinding{
 const reason=sourceReason(p,options.allowReadOnly)??(options.disabled?(options.reason??'这一步当前不能执行。'):null)
 return {label,disabled:reason!==null,reason,activate:()=>{
  if(options.disabled||sourceReason(p,options.allowReadOnly))return
  if(options.canActivate){try{if(!options.canActivate())return}catch{return}}
  activate()
 }}
}
