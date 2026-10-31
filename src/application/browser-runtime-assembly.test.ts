import {afterEach,expect,it,vi} from 'vitest'
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb'
import {createBrowserGame} from './browser-game.ts'
import {INITIAL_GAME_SNAPSHOT} from './game-snapshot.ts'

let close:(()=>Promise<void>)|undefined
afterEach(async()=>{await close?.();close=undefined;vi.unstubAllEnvs();vi.unstubAllGlobals()})

it('starts the browser through its supplied background transport before any local game computation',async()=>{
 vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange)
 vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn()});vi.stubEnv('DEV',false)
 const listeners=new Set<(value:unknown)=>void>(),terminated=vi.fn()
 const workerFactory=vi.fn(()=>({
  listen(listener:(value:unknown)=>void){listeners.add(listener);return()=>{listeners.delete(listener)}},
  onError(){return()=>{}},terminate:terminated,
  postMessage(value:unknown){
   const message=value as {protocol:number;bootId:string;id:number;method:string}
   queueMicrotask(()=>{
    if(message.method==='boot')for(const listener of listeners)listener({protocol:1,bootId:message.bootId,kind:'snapshot',sequence:1,session:0,state:INITIAL_GAME_SNAPSHOT,needsUnsavedWarning:false,timeWait:null,waitRequestId:null,diagnostics:null})
    for(const listener of listeners)listener({protocol:1,bootId:message.bootId,kind:'response',id:message.id,sequence:1,session:0,ok:true,result:message.method==='boot'?{diagnostics:null}:undefined})
   })
  },
 }))
 // Reflect preserves the original public call seam while the new option is red.
 const game=await Reflect.apply(createBrowserGame,undefined,[{workerFactory}])
 close=()=>game.controller.close(true)
 expect(workerFactory).toHaveBeenCalledOnce()
 expect(game.controller.asynchronous).toBe(true)
 expect(game.controller.snapshot).toEqual(INITIAL_GAME_SNAPSHOT)
 expect(game.diagnostics).toBeNull()
})
