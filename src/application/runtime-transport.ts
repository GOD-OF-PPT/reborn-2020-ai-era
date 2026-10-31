export interface RuntimeChannel{
 postMessage(value:unknown):void
 listen(listener:(value:unknown)=>void):()=>void
}
export interface RuntimeTransport extends RuntimeChannel{
 onError(listener:(error:unknown)=>void):()=>void
 terminate():void
}

/** A real browser Worker adapter. Tests supply an explicit channel at this seam. */
export function browserWorkerTransport(worker:Worker):RuntimeTransport{
 return {
  postMessage:value=>worker.postMessage(value),
  listen:listener=>{const onMessage=(event:MessageEvent<unknown>)=>listener(event.data);worker.addEventListener('message',onMessage);return()=>worker.removeEventListener('message',onMessage)},
  onError:listener=>{const onError=(event:Event)=>listener(event);worker.addEventListener('error',onError);worker.addEventListener('messageerror',onError);return()=>{worker.removeEventListener('error',onError);worker.removeEventListener('messageerror',onError)}},
  terminate:()=>worker.terminate(),
 }
}
