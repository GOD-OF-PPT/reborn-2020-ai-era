import {useState,type ReactNode} from 'react'
import {Dialog} from './Dialog.tsx'
import './life-action-pause.css'

/** The same original clock and decision nodes are relocated, never rebuilt. */
export function LifeActionPause({title,clock,children,onRead,readLabel}:{title:string;clock:ReactNode;children?:ReactNode;onRead?:()=>void;readLabel?:string}) {
 const [reading,setReading]=useState(false)
 return <section className="scene-wait-decision life-action-pause" aria-label="行动排满后的选择">
  {clock}
  <button type="button" className="scene-text-action life-action-read" onClick={onRead??(()=>setReading(true))}>{readLabel??title+' · 条件与费用 ↗'}</button>
  {!onRead&&reading?<Dialog title={title+' · 条件与费用'} layout="direct" className="life-paused-details" onClose={()=>setReading(false)} footer={<div className="button-row dialog-actions"><button type="button" onClick={()=>setReading(false)}>回到眼前的日历</button></div>}>{children}</Dialog>:null}
 </section>
}
