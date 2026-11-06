import {useState} from 'react'
import type {CourseSceneTarget} from './course-scene-progress.ts'
import type {CourseObjectGroup,CourseObjectReading} from './course-object-reading.ts'
import './course-object-choices.css'

const groups:readonly [CourseObjectGroup,string][]=[['classes','班期与学员'],['courses','课程与受众'],['preparation','教室与准备']]
/** Previewing is local; a real button explicitly returns the captured original object to the scene. */
export function CourseObjectChoices({reading,date,locked,onChoose}:{reading:CourseObjectReading;date:string;locked:string|null;onChoose:(target:CourseSceneTarget)=>void}){
 const initial=()=>({key:reading.key,group:reading.entries.some(e=>e.group==='classes')?'classes' as const:reading.entries.some(e=>e.group==='courses')?'courses' as const:'preparation' as const,page:0,preview:null as string|null})
 const [stored,setStored]=useState(initial),state=stored.key===reading.key&&reading.entries.some(e=>e.group===stored.group)?stored:initial(),rows=reading.entries.filter(e=>e.group===state.group),pages=Math.max(1,Math.ceil(rows.length/2)),page=Math.min(state.page,pages-1),visible=rows.slice(page*2,page*2+2),preview=visible.find(e=>e.key===state.preview)??visible[0]??null
 const edit=(patch:Partial<ReturnType<typeof initial>>)=>setStored(old=>({...((old.key===reading.key)?old:initial()),...patch,key:reading.key}))
 return <section className="course-object-choices" aria-label="翻回这间教室的经历">
  <nav className="course-object-tabs" aria-label="想翻回哪一段">{groups.filter(([group])=>reading.entries.some(e=>e.group===group)).map(([group,label])=><button type="button" key={group} aria-pressed={state.group===group} onClick={()=>edit({group,page:0,preview:null})}>{label}<span>{reading.entries.filter(e=>e.group===group).length}</span></button>)}</nav>
  <div className="course-object-desk"><nav className="course-object-index" aria-label="同教室的原对象">{visible.map(e=><button type="button" key={e.key} aria-label={'翻回'+e.title+' · '+e.kind+' · '+(e.date??'来源日期待核')} data-preview={preview?.key===e.key?'true':'false'} disabled={locked!==null} onPointerEnter={()=>edit({preview:e.key})} onFocus={()=>edit({preview:e.key})} onClick={()=>onChoose(e.target)}><span>{e.kind} · {e.date??'来源日期待核'}</span><strong>{e.title}</strong><small>放到眼前 ↗</small></button>)}{!visible.length?<p>这一叠还没有留下记录。可以翻其它纸页。</p>:null}{pages>1?<div className="course-object-turn"><button type="button" disabled={page===0} onClick={()=>edit({page:page-1,preview:null})}>← 前两份</button><span>{page+1}/{pages}</span><button type="button" disabled={page===pages-1} onClick={()=>edit({page:page+1,preview:null})}>后两份 →</button></div>:null}</nav>
   <article className="course-object-paper" aria-label="正在预看的原经历">{preview?<><p className="course-object-kind">{preview.kind} · 预看</p><h3>{preview.title}</h3><p className="course-object-state">{preview.state}</p><p className="course-object-source">{preview.dateLabel}：{preview.date??'日期待核'} · 今天{date}</p>{preview.wait?<p className="course-object-wait">原日历：{preview.wait.date} · {preview.wait.label}</p>:null}<button type="button" className="course-object-open" disabled={locked!==null} onClick={()=>onChoose(preview.target)}>翻回这一份，接着看 ↗</button></>:<p>先翻一叠有记录的纸页。</p>}{locked?<p className="course-object-lock" role="status">{locked}</p>:null}</article>
  </div>
 </section>
}
