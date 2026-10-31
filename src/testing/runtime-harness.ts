import {installRuntimeHost,type RuntimeOwner,type RuntimeOwnerFactory} from '../application/runtime-host.ts'
import type {RuntimeTransport} from '../application/runtime-transport.ts'

/** Explicit asynchronous transport for author tests; it runs the real host. */
export function createRuntimeHarness(create:RuntimeOwnerFactory){
 const listeners=new Set<(value:unknown)=>void>(),errors=new Set<(error:unknown)=>void>(),hostListeners=new Set<(value:unknown)=>void>()
 const inbound:unknown[]=[],outbound:unknown[]=[],held:unknown[]=[],waiters:{test:(value:unknown)=>boolean;resolve:(value:unknown)=>void}[]=[]
 let alive=true,owner:RuntimeOwner|undefined,ownerPromise:Promise<RuntimeOwner>|undefined,closing=Promise.resolve(),hold:(value:unknown)=>boolean=()=>false
 const deliver=(value:unknown)=>{if(alive)queueMicrotask(()=>{if(alive)for(const listener of listeners)listener(structuredClone(value))})}
 const disposeHost=installRuntimeHost({
  listen:listener=>{hostListeners.add(listener);return()=>{hostListeners.delete(listener)}},
  postMessage:value=>{
   const copy=structuredClone(value);outbound.push(copy)
   if(hold(copy))held.push(copy);else deliver(copy)
   for(const waiter of [...waiters])if(waiter.test(copy)){waiters.splice(waiters.indexOf(waiter),1);waiter.resolve(copy)}
  },
 },options=>{ownerPromise=create(options).then(result=>{owner=result;return result});return ownerPromise})
 const terminate=()=>{if(!alive)return;alive=false;disposeHost();closing=(async()=>{if(ownerPromise)await ownerPromise;await owner?.controller.close(true)})()}
 const transport:RuntimeTransport={
  listen:listener=>{listeners.add(listener);return()=>{listeners.delete(listener)}},
  onError:listener=>{errors.add(listener);return()=>{errors.delete(listener)}},
  terminate,
  postMessage:value=>{const copy=structuredClone(value);inbound.push(copy);queueMicrotask(()=>{if(alive)for(const listener of hostListeners)listener(copy)})},
 }
 return {
  transport,inbound,outbound,held,inject:deliver,
  setHold:(test:(value:unknown)=>boolean)=>{hold=test},
  release:()=>{for(const value of held.splice(0))deliver(value)},
  next:(test:(value:unknown)=>boolean)=>new Promise<unknown>(resolve=>waiters.push({test,resolve})),
  fail:()=>{for(const listener of [...errors])listener(new Error('explicit transport interruption'))},
  close:async()=>{terminate();await closing},
 }
}
