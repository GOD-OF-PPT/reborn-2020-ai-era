import {useLayoutEffect,useRef,useState} from 'react'
import {Dialog} from './Dialog.tsx'
import type {GamePanelProps} from './game-types.ts'
import type {Screen} from './Navigation.tsx'
import type {LifePerson} from '../core/life-schema.ts'
import {sceneThreads} from './scene-thread-notes.ts'

export function SceneThreads({p,onOpen}:{p:GamePanelProps;onOpen:(screen:Screen,personId?:LifePerson)=>void}){
 const [open,setOpen]=useState(false),[selected,setSelected]=useState(0)
 const pocket=useRef<HTMLElement>(null)
 const notes=sceneThreads(p.features)
 const current=notes[Math.min(selected,notes.length-1)]
 useLayoutEffect(()=>{
  const node=pocket.current,stage=node?.closest<HTMLElement>('.game-app');if(!node||!stage)return
  const measure=()=>stage.style.setProperty('--scene-thread-height',node.getBoundingClientRect().height+'px')
  const resize=new ResizeObserver(measure);resize.observe(node);measure()
  return()=>{resize.disconnect();stage.style.removeProperty('--scene-thread-height')}
 },[notes.length>0])
 return current?<><aside ref={pocket} className="thread-pocket" aria-label="全部持续牵挂"><div className="thread-count">日历边的牵挂 · {Math.min(selected,notes.length-1)+1}/{notes.length}{notes.length>1?<button type="button" aria-label="下一件牵挂" onClick={()=>setSelected(n=>(n+1)%notes.length)}>→</button>:null}</div><strong>{current.title}</strong><p>{current.detail}</p><button type="button" onClick={()=>onOpen(current.screen,current.personId)}>面对这件事 ↗</button><button type="button" onClick={()=>setOpen(true)}>翻看全部</button></aside>{open?<Dialog title="日历边的全部牵挂" onClose={()=>setOpen(false)}><aside className="scene-threads" aria-label="全部持续牵挂"><header><p className="scene-overline">日历边，留着这些牵挂</p><h2>还有些事，等着你。</h2></header><ul>{notes.map(note=><li key={note.id}><h3>{note.title}</h3><p>{note.detail}</p><button type="button" onClick={()=>{setOpen(false);onOpen(note.screen,note.personId)}} aria-label={'继续处理：'+note.title}>翻开这件事 <span aria-hidden="true">↗</span></button></li>)}</ul></aside></Dialog>:null}</>:null
}
