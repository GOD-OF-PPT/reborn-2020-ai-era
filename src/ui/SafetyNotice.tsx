import {useState,type ReactNode} from 'react'
import {Dialog} from './Dialog.tsx'

/** Persistent entry stays visible even when the player closes the full explanation. */
export function SafetyNotice({title,children}:{title:string;children:ReactNode}){
 const [open,setOpen]=useState(true)
 return <><button type="button" className="safety-pocket" onClick={()=>setOpen(true)}><span aria-hidden="true">!</span>{title} · 查看处理</button>{open?<Dialog title={title} onClose={()=>setOpen(false)} className="safety-dialog">{children}</Dialog>:null}</>
}
