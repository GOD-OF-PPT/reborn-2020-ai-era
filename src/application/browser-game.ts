import {RuntimeGameController} from './runtime-client.ts'
import {browserWorkerTransport,type RuntimeTransport} from './runtime-transport.ts'
import {guardUnsavedClose} from './session-close-guard.ts'

export async function createBrowserGame(options:{workerFactory?:()=>RuntimeTransport}={}){
 const storageTest=import.meta.env.DEV?new URLSearchParams(globalThis.location.search).get('storageTest'):null
 const factory=options.workerFactory??(()=>browserWorkerTransport(new Worker(new URL('./game-runtime.worker.ts',import.meta.url),{type:'module',name:'reborn-game-runtime'})))
 const controller=new RuntimeGameController(factory,storageTest)
 await controller.ready()
 controller.onDispose(guardUnsavedClose(controller))
 return {controller,diagnostics:controller.diagnostics}
}
