import {useLayoutEffect,useRef,useState} from 'react'
import {Dialog} from './Dialog.tsx'
import type {GamePanelProps,SceneTarget} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import type {LifePerson} from '../core/life-schema.ts'
import {sceneThreads,sceneThreadCourseTarget,type SceneThread} from './scene-thread-notes.ts'

export function SceneThreads({p,onOpen,compact=false}:{p:GamePanelProps;onOpen:(screen:Screen,personId?:LifePerson,incidentId?:string,target?:SceneTarget)=>void;compact?:boolean}){
 const [open,setOpen]=useState(false),[selected,setSelected]=useState(0),[reason,setReason]=useState<string|null>(null)
 const pocket=useRef<HTMLElement>(null)
 const notes=sceneThreads(p.features,p.view.date)
 const current=notes[Math.min(selected,notes.length-1)]
 const face=(note:SceneThread)=>{const result=sceneThreadCourseTarget(p,note);if(result?.status==='unavailable'){setReason(result.reason);return}setReason(null);setOpen(false);onOpen(note.screen,note.personId,note.incidentId,result?.target)}
 useLayoutEffect(()=>{
  const node=pocket.current,stage=node?.closest<HTMLElement>('.game-app');if(!node||!stage)return
  const measure=()=>stage.style.setProperty('--scene-thread-height',node.getBoundingClientRect().height+'px')
  const resize=new ResizeObserver(measure);resize.observe(node);measure()
  return()=>{resize.disconnect();stage.style.removeProperty('--scene-thread-height')}
 },[notes.length>0])
 return current?<><aside ref={pocket} className={'thread-pocket'+(compact?' thread-pocket-compact':'')} aria-label="全部持续牵挂">{compact?<button type="button" onClick={()=>setOpen(true)}>原约与日历 · {notes.length}份记录 ↗</button>:<><div className="thread-count">日历边的牵挂 · {Math.min(selected,notes.length-1)+1}/{notes.length}{notes.length>1?<button type="button" aria-label="下一件牵挂" onClick={()=>setSelected(n=>(n+1)%notes.length)}>→</button>:null}</div><strong>{current.title}</strong><p>{current.detail}</p>{reason?<p role="status" className="reason">{reason}</p>:null}<button type="button" onClick={()=>face(current)}>面对这件事 ↗</button><button type="button" onClick={()=>setOpen(true)}>翻看全部</button></>}</aside>{open?<Dialog title="日历边的全部牵挂" onClose={()=>setOpen(false)}><aside className="scene-threads" aria-label="全部持续牵挂"><header><p className="scene-overline">日历边，留着这些牵挂</p><h2>还有些事，等着你。</h2></header>{reason?<p role="status" className="reason">{reason}</p>:null}<ul>{notes.map(note=><li key={note.id}><h3>{note.title}</h3><p>{note.detail}</p><button type="button" onClick={()=>face(note)} aria-label={'继续处理：'+note.title}>翻开这件事 <span aria-hidden="true">↗</span></button></li>)}</ul></aside></Dialog>:null}</>:null
}
