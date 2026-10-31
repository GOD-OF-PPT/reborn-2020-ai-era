import {useEffect,useRef,useState,type RefObject} from 'react'
import {assertJsonInput} from '../core/json-input.ts'
import {canonicalJson} from '../core/identity.ts'
import {RuleError} from '../core/errors.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {GameControllerPort} from '../application/game-controller-port.ts'
import type {GamePanelProps} from './game-types.ts'

type View=GamePanelProps['view']
type ReadRoot=RefObject<HTMLElement|null>
const rejected=(code:string):CommandPreview=>({allowed:false,reasonCodes:[code],actionPoints:0,upfrontCostFen:0,releasedFen:0})
function commandKey(command:CommandEnvelope|null):{key:string;error:string|null}{
 if(command===null)return {key:'none',error:null}
 try{assertJsonInput(command);return {key:canonicalJson(command),error:null}}
 catch(error){return {key:'invalid',error:error instanceof RuleError?error.code:'INVALID_PAYLOAD'}}
}
function useRemoteRead<T>(controller:GameControllerPort,view:View,key:string,enabled:boolean,read:()=>Promise<T>,root?:ReadRoot){
 const fullKey=String(controller.runtimeSequence??0)+':'+key,latest=useRef({key:fullKey,read});latest.current={key:fullKey,read}
 const [value,setValue]=useState<{key:string;data:T|null;error:string|null}>({key:'',data:null,error:null}),accepted=useRef(value)
 useEffect(()=>{
  if(!controller.asynchronous||!enabled)return
  let live=true,pending=false
  const visible=()=>{const button=root?.current?.querySelector('button');return !button||!button.closest('[inert],[hidden]')}
  const current=()=>live&&latest.current.key===fullKey&&controller.snapshot.view===view&&!controller.snapshot.busy&&!view.busy&&!controller.runtimeFailed
  const inspect=()=>{
   if(!current()||!visible()||pending||accepted.current.key===fullKey)return
   pending=true
   void latest.current.read().then(data=>{
    if(!current()||!visible())return
    const next={key:fullKey,data,error:null};accepted.current=next;setValue(next)
   }).catch(error=>{
    if(!current()||!visible())return
    const next={key:fullKey,data:null,error:error instanceof RuleError?error.code:'RUNTIME_OPERATION_FAILED'};accepted.current=next;setValue(next)
   }).finally(()=>{pending=false;inspect()})
  }
  // Reuse the original book's interaction state. No viewport or page geometry
  // is measured, and original off-page forms remain mounted with their drafts.
  const observer=root?.current?new MutationObserver(inspect):null
  if(observer&&root?.current)observer.observe(root.current,{subtree:true,attributes:true,attributeFilter:['inert','hidden']})
  inspect()
  return()=>{live=false;observer?.disconnect()}
 },[controller,view,fullKey,enabled,root])
 return value.key===fullKey?value:{key:fullKey,data:null,error:null}
}

export function useCommandPreview(controller:GameControllerPort,view:View,command:CommandEnvelope|null,root?:ReadRoot){
 const source=controller.asynchronous?commandKey(command):{key:'local',error:null}
 const blocked=command&&controller.asynchronous?controller.preview(command):null
 const enabled=command!==null&&source.error===null&&controller.snapshot.view===view&&blocked?.reasonCodes[0]==='RUNTIME_READ_PENDING'
 const result=useRemoteRead(controller,view,source.key,enabled,()=>controller.previewAsync!(command!),root)
 const live=useRef({key:source.key,view,version:0,mounted:true})
 if(live.current.key!==source.key||live.current.view!==view)live.current={key:source.key,view,version:live.current.version+1,mounted:live.current.mounted}
 const version=live.current.version
 useEffect(()=>{live.current.mounted=true;return()=>{live.current.mounted=false}},[])
 let local:CommandPreview|null=null
 if(command&&!controller.asynchronous)try{local=controller.preview(command)}catch(error){local=rejected(error instanceof RuleError?error.code:'STALE_REVISION')}
 const preview=command===null?rejected('RUNTIME_READ_PENDING'):!controller.asynchronous?local!:source.error?rejected(source.error):!enabled?blocked??rejected('STALE_REVISION'):result.data??rejected(result.error??'RUNTIME_READ_PENDING')
 return {preview,pending:preview.reasonCodes[0]==='RUNTIME_READ_PENDING',isCurrentAllowed:()=>live.current.mounted&&live.current.version===version&&!controller.runtimeFailed&&!controller.snapshot.busy&&live.current.key===source.key&&live.current.view===view&&controller.snapshot.view===view&&!root?.current?.querySelector('button')?.closest('[inert],[hidden]')&&(!controller.asynchronous?!!command&&controller.preview(command).allowed:preview.allowed)}
}

export function useClockRead(controller:GameControllerPort,view:View,command:CommandEnvelope,enabled:boolean,root?:ReadRoot){
 const source=controller.asynchronous?commandKey(command):{key:'local',error:null}
 const value=useRemoteRead(controller,view,'clock:'+source.key,enabled&&source.error===null,()=>controller.clockCommitmentsAsync!(command),root)
 return value.data
}
