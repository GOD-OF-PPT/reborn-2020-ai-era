import {useSyncExternalStore} from 'react'
import type {GameControllerPort} from '../application/game-controller-port.ts'
const noSubscribe=()=>()=>{}
export function RuntimeReadStatus({controller,enabled}:{controller:GameControllerPort;enabled:boolean}){
 const reading=useSyncExternalStore(controller.subscribeReads??noSubscribe,()=>controller.readingCount??0,()=>0)
 return enabled&&controller.asynchronous&&reading>0?<div className="runtime-feedback" role="status">正在核对眼前的选择…</div>:null
}
