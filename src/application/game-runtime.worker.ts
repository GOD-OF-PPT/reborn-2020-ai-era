import {installRuntimeHost} from './runtime-host.ts'
import {createRuntimeOwner} from './browser-runtime-owner.ts'

// The UI's DOM library and a Worker share this small message surface. The
// simulation entry imports no Window, document or rendering implementation.
const runtime=globalThis as unknown as {
 postMessage(value:unknown):void
 addEventListener(type:'message',listener:(event:MessageEvent<unknown>)=>void):void
 removeEventListener(type:'message',listener:(event:MessageEvent<unknown>)=>void):void
}
installRuntimeHost({
 postMessage:value=>runtime.postMessage(value),
 listen:listener=>{const receive=(event:MessageEvent<unknown>)=>listener(event.data);runtime.addEventListener('message',receive);return()=>runtime.removeEventListener('message',receive)},
},createRuntimeOwner)
