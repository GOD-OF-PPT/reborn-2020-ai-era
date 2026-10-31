/** Same existing warning contract, read through the current session owner. */
export function guardUnsavedClose(session:{readonly needsUnsavedWarning:boolean},target:Window=globalThis.window):()=>void{
 const handler=(event:BeforeUnloadEvent)=>{if(session.needsUnsavedWarning){event.preventDefault();event.returnValue=''}}
 target.addEventListener('beforeunload',handler)
 return()=>target.removeEventListener('beforeunload',handler)
}
